/**
 * PDFExporter.ts
 *
 * Main orchestrator for PDF carousel export.
 * Handles graph capture, page rendering, and PDF assembly.
 */

import { PDFDocument } from 'pdf-lib';
import cytoscape from 'cytoscape';
import { PageRenderer } from './PageRenderer';
import { OverviewPageRenderer } from './OverviewPageRenderer';
import { CommandsPageRenderer } from './CommandsPageRenderer';
import { PAGE, DEFAULT_EXPORT_OPTIONS, type PDFExportOptions } from './pdf.constants';
import { MITRE_INDEX } from '../../shared/config/mitre-index';
import type { ScenarioData, TimelineStep, VisibilityMap, EdgeStep, ExtractedMetadata } from '../../shared/schemas/scenario.schema';

export type ProgressCallback = (current: number, total: number, message: string) => void;

/**
 * Extract metadata from scenario with fallbacks (same logic as store)
 */
function extractMetadataFromScenario(scenario: ScenarioData): ExtractedMetadata {
    const buildCommandsFromSteps = (steps: TimelineStep[]): string => {
        return steps
            .filter((s): s is EdgeStep => s.type === 'edge' && !!s.cli)
            .map((s, i) => `# Step ${i + 1}: ${s.name}\n$ ${s.cli}`)
            .join('\n\n');
    };

    const extractMitreFromSteps = (steps: TimelineStep[]): string[] => {
        const ids = steps
            .map(s => s.mitre?.id)
            .filter((id): id is string => !!id);
        return [...new Set(ids)];
    };

    return {
        shortDescription: scenario.shortDescription || scenario.description || '',
        tags: scenario.tags || [],
        descriptionHtml: scenario.metadata?.descriptionHtml || null,
        commandsBlock: scenario.metadata?.commandsBlock || buildCommandsFromSteps(scenario.steps),
        extraInfo: scenario.metadata?.extraInfo || [],
        prerequisites: scenario.metadata?.prerequisites || [],
        attackerGains: scenario.metadata?.attackerGains || [],
        detectionNotes: scenario.metadata?.detectionNotes || [],
        mitreCategories: scenario.metadata?.mitreCategories || extractMitreFromSteps(scenario.steps),
    };
}

export class PDFExporter {
    private scenario: ScenarioData;
    private cy: cytoscape.Core;
    private options: PDFExportOptions;
    private pageRenderer: PageRenderer;
    private overviewRenderer: OverviewPageRenderer;
    private commandsRenderer: CommandsPageRenderer;
    private metadata: ExtractedMetadata;

    public onProgress?: ProgressCallback;

    constructor(
        scenario: ScenarioData,
        cy: cytoscape.Core,
        options?: Partial<PDFExportOptions>,
        metadata?: ExtractedMetadata
    ) {
        this.scenario = scenario;
        this.cy = cy;
        this.options = { ...DEFAULT_EXPORT_OPTIONS, ...options };
        this.pageRenderer = new PageRenderer();
        this.overviewRenderer = new OverviewPageRenderer();
        this.commandsRenderer = new CommandsPageRenderer();
        this.metadata = metadata || extractMetadataFromScenario(scenario);
    }

    /**
     * Main export method - returns PDF as Blob
     */
    async export(): Promise<Blob> {
        const timeline = this.scenario.steps.filter(s => s.type === 'edge') as EdgeStep[];
        const totalSteps = timeline.length;

        // Calculate total pages including optional pages
        let totalPages = totalSteps;
        if (this.options.coverPage) totalPages++;
        if (this.options.includeOverviewPage) totalPages++;
        if (this.options.includeCommandsPage) totalPages++;

        const pageImages: Blob[] = [];
        let currentPage = 0;

        // Save current state
        const originalStep = this.getCurrentVisibleStep();

        try {
            // 1. Cover page
            if (this.options.coverPage) {
                currentPage++;
                this.reportProgress(currentPage, totalPages, 'Generating cover page...');

                // Get overview graph (step 0 or zoomed out)
                const overviewImage = await this.captureGraphOverview();

                const coverBlob = await this.pageRenderer.renderPage({
                    graphImage: overviewImage,
                    step: null,
                    stepIndex: 0,
                    totalSteps,
                    scenarioTitle: this.scenario.title,
                    scenarioDescription: this.scenario.description,
                    isCoverPage: true,
                });

                pageImages.push(coverBlob);
            }

            // 2. Overview page (includes description, prerequisites, gains, detection, MITRE)
            if (this.options.includeOverviewPage) {
                currentPage++;
                this.reportProgress(currentPage, totalPages, 'Generating overview page...');

                const overviewBlob = await this.overviewRenderer.renderPage({
                    metadata: this.metadata,
                    scenarioTitle: this.scenario.title,
                    totalSteps,
                });

                pageImages.push(overviewBlob);
            }

            // 3. Step pages
            for (let i = 0; i < totalSteps; i++) {
                const stepIndex = i + 1; // 1-indexed for display
                currentPage++;

                this.reportProgress(currentPage, totalPages, `Generating step ${stepIndex}...`);

                // Apply step state to graph
                this.applyStepState(stepIndex);

                // Small delay for rendering to settle
                await this.delay(50);

                // Capture graph
                const graphImage = await this.captureCurrentGraph();

                // Render page
                const pageBlob = await this.pageRenderer.renderPage({
                    graphImage,
                    step: timeline[i],
                    stepIndex,
                    totalSteps,
                    scenarioTitle: this.scenario.title,
                });

                pageImages.push(pageBlob);
            }

            // 4. Commands page (at end)
            if (this.options.includeCommandsPage && this.metadata.commandsBlock) {
                currentPage++;
                this.reportProgress(currentPage, totalPages, 'Generating commands page...');

                const commandsBlob = await this.commandsRenderer.renderPage({
                    metadata: this.metadata,
                    scenarioTitle: this.scenario.title,
                });

                pageImages.push(commandsBlob);
            }

            // 5. Assemble PDF
            this.reportProgress(totalPages, totalPages, 'Assembling PDF...');
            const pdfBlob = await this.assemblePDF(pageImages);

            return pdfBlob;

        } finally {
            // Restore original state
            this.applyStepState(originalStep);
        }
    }

    /**
     * Apply visibility and edge state for a specific step
     */
    private applyStepState(step: number): void {
        const visibility = this.scenario.visibility;
        const timeline = this.scenario.steps;

        this.cy.batch(() => {
            // A. Visibility Manager
            if (visibility) {
                this.cy.nodes().forEach(node => {
                    const id = node.id();
                    const range = visibility[id];

                    let isVisible = true;
                    if (range) {
                        const checkStep = step === 0 ? 1 : step;
                        isVisible = (checkStep >= range.start && step <= range.end);
                    }

                    if (isVisible) {
                        node.removeClass('hidden');
                    } else {
                        node.addClass('hidden');
                    }
                });
            }

            // B. Cumulative Edges
            this.cy.edges().remove();
            this.cy.elements('.highlighted').removeClass('highlighted');

            // Pre-process edge metadata for arc routing
            const pairGroups: Record<string, string[]> = {};
            timeline.forEach(tStep => {
                if (tStep.type === 'edge') {
                    const pairId = [tStep.from, tStep.to].sort().join('-');
                    if (!pairGroups[pairId]) pairGroups[pairId] = [];
                    pairGroups[pairId].push(`edge_${tStep.id}`);
                }
            });

            const edgeMeta: Record<string, { index: number; total: number }> = {};
            Object.values(pairGroups).forEach(group => {
                group.forEach((edgeId, idx) => {
                    edgeMeta[edgeId] = { index: idx, total: group.length };
                });
            });

            // Add edges up to current step
            for (let i = 0; i < step; i++) {
                const timelineStep = timeline[i];
                if (!timelineStep || timelineStep.type !== 'edge') continue;

                const isCurrentStepEdge = (i === step - 1);

                // Color lookup
                let edgeColor = '#fbbf24';
                if (timelineStep.mitre?.id && MITRE_INDEX[timelineStep.mitre.id]) {
                    edgeColor = MITRE_INDEX[timelineStep.mitre.id].color || edgeColor;
                }

                // Arc calculation for multi-edges
                const meta = edgeMeta[`edge_${timelineStep.id}`];
                let curveProps: any = { 'curve-style': 'bezier' };

                if (meta && meta.total > 1) {
                    const SPEED_OF_LIGHT = 50;
                    let offset = (meta.index - (meta.total - 1) / 2) * SPEED_OF_LIGHT;
                    if (timelineStep.from > timelineStep.to) offset *= -1;

                    curveProps = {
                        'curve-style': 'unbundled-bezier',
                        'control-point-distances': offset,
                        'control-point-weights': 0.5
                    };
                }

                this.cy.add({
                    group: 'edges',
                    data: {
                        id: `edge_${timelineStep.id}`,
                        source: timelineStep.from,
                        target: timelineStep.to,
                        label: timelineStep.name,
                    },
                    style: isCurrentStepEdge ? {
                        'line-color': edgeColor,
                        'target-arrow-color': edgeColor,
                        'width': 2.5,
                        'arrow-scale': 1.4,
                        'z-index': 100,
                        'opacity': 1,
                        ...curveProps,
                        'underlay-color': edgeColor,
                        'underlay-padding': 4,
                        'underlay-opacity': 0.4,
                        'color': edgeColor,
                        'text-outline-color': edgeColor,
                        'text-outline-width': 1,
                    } : {
                        'line-color': edgeColor,
                        'target-arrow-color': edgeColor,
                        'width': 1.5,
                        'arrow-scale': 1.0,
                        ...curveProps,
                        'color': edgeColor,
                        'opacity': 1,
                        'line-opacity': 0.5,
                        'target-arrow-opacity': 0.5,
                        'text-opacity': 0.7,
                        'text-background-opacity': 1,
                        'text-background-color': '#0f172a',
                        'text-background-padding': '4px',
                    }
                });
            }
        });
    }

    /**
     * Capture current graph state as PNG base64
     */
    private async captureCurrentGraph(): Promise<string> {
        const selection = this.options.selectionBounds;

        // Apply clean export styles (remove glow/blur effects)
        this.applyExportStyles();

        // Use Cytoscape's built-in PNG export
        const pngData = this.cy.png({
            output: 'base64uri',
            bg: '#0f172a', // Match background
            full: false,   // Current viewport
            scale: 2,      // Retina
            maxWidth: PAGE.WIDTH * 2,
            maxHeight: 850 * 2,
        });

        // Restore interactive styles
        this.restoreInteractiveStyles();

        // If selection bounds provided, crop the image
        if (selection) {
            return await this.cropImageToSelection(pngData, selection);
        }

        return pngData;
    }

    /**
     * Apply clean styles for export (remove glow/blur effects)
     * Also enables native labels for containers (normally drawn by custom canvas layer)
     */
    private applyExportStyles(): void {
        // Edge styles
        this.cy.edges().forEach(edge => {
            // Store current styles for restoration
            edge.data('_exportBackup', {
                'text-outline-width': edge.style('text-outline-width'),
                'text-outline-opacity': edge.style('text-outline-opacity'),
                'underlay-opacity': edge.style('underlay-opacity'),
            });

            // Apply clean export styles - crisp text, no glow
            edge.style({
                'text-outline-width': 0,
                'text-outline-opacity': 0,
                'underlay-opacity': 0,
                'text-background-opacity': 1,
                'text-background-color': '#0f172a',
                'text-background-padding': '4px',
            });
        });

        // Container labels - enable native Cytoscape labels for export
        // (normally rendered by custom cytoscape-canvas layer which cy.png() doesn't capture)
        this.cy.nodes(':parent').forEach(container => {
            const label = container.data('label') || '';
            container.data('_exportBackup', { label: container.style('label') });

            container.style({
                'label': label,
                'text-valign': 'top',
                'text-halign': 'center',
                'text-margin-y': -10,
                'font-size': 14,
                'font-weight': 'bold',
                'color': '#cbd5e1',
                'text-background-opacity': 0,
            });
        });
    }

    /**
     * Restore interactive styles after export
     */
    private restoreInteractiveStyles(): void {
        // Restore edge styles
        this.cy.edges().forEach(edge => {
            const backup = edge.data('_exportBackup');
            if (backup) {
                edge.style({
                    'text-outline-width': backup['text-outline-width'],
                    'text-outline-opacity': backup['text-outline-opacity'],
                    'underlay-opacity': backup['underlay-opacity'],
                });
                edge.removeData('_exportBackup');
            }
        });

        // Restore container labels (disable native, let canvas layer handle it)
        this.cy.nodes(':parent').forEach(container => {
            const backup = container.data('_exportBackup');
            if (backup) {
                container.style({
                    'label': '',  // Disable native label
                });
                container.removeData('_exportBackup');
            }
        });
    }

    /**
     * Crop an image to selection bounds
     */
    private async cropImageToSelection(
        imageBase64: string,
        selection: { x: number; y: number; width: number; height: number }
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const scale = 2; // Match export scale

                // Calculate crop coordinates
                const cropX = selection.x * scale;
                const cropY = selection.y * scale;
                const cropWidth = selection.width * scale;
                const cropHeight = selection.height * scale;

                // Create canvas for cropped region
                const canvas = document.createElement('canvas');
                canvas.width = cropWidth;
                canvas.height = cropHeight;
                const ctx = canvas.getContext('2d')!;

                // Draw cropped region
                ctx.drawImage(
                    img,
                    cropX, cropY, cropWidth, cropHeight,
                    0, 0, cropWidth, cropHeight
                );

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => reject(new Error('Failed to load image for cropping'));
            img.src = imageBase64;
        });
    }

    /**
     * Capture overview/zoomed out graph for cover
     */
    private async captureGraphOverview(): Promise<string> {
        const selection = this.options.selectionBounds;

        // Temporarily fit graph to view all elements
        const currentZoom = this.cy.zoom();
        const currentPan = this.cy.pan();

        this.cy.fit(undefined, 50); // 50px padding
        await this.delay(100);

        // Apply clean export styles
        this.applyExportStyles();

        const pngData = this.cy.png({
            output: 'base64uri',
            bg: '#0f172a',
            full: false,
            scale: 2,
            maxWidth: PAGE.WIDTH * 2,
            maxHeight: 850 * 2,
        });

        // Restore styles
        this.restoreInteractiveStyles();

        // Restore viewport
        this.cy.zoom(currentZoom);
        this.cy.pan(currentPan);

        // If selection bounds provided, crop the image
        if (selection) {
            return await this.cropImageToSelection(pngData, selection);
        }

        return pngData;
    }

    /**
     * Assemble page images into final PDF
     */
    private async assemblePDF(pageImages: Blob[]): Promise<Blob> {
        const pdfDoc = await PDFDocument.create();

        for (const pageBlob of pageImages) {
            // Convert blob to array buffer
            const arrayBuffer = await pageBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Embed PNG image
            const image = await pdfDoc.embedPng(uint8Array);

            // Add page with exact dimensions
            const page = pdfDoc.addPage([PAGE.WIDTH, PAGE.HEIGHT]);

            // Draw image to fill page
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: PAGE.WIDTH,
                height: PAGE.HEIGHT,
            });
        }

        // Save and return as blob
        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    /**
     * Get currently visible step (for restore)
     */
    private getCurrentVisibleStep(): number {
        // This would ideally come from the store, but we'll estimate from edge count
        return this.cy.edges().length;
    }

    /**
     * Report progress to callback
     */
    private reportProgress(current: number, total: number, message: string): void {
        if (this.onProgress) {
            this.onProgress(current, total, message);
        }
    }

    /**
     * Async delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Helper function for quick export
 */
export async function exportScenarioToPDF(
    scenario: ScenarioData,
    cy: cytoscape.Core,
    options?: Partial<PDFExportOptions>,
    onProgress?: ProgressCallback,
    metadata?: ExtractedMetadata
): Promise<void> {
    const exporter = new PDFExporter(scenario, cy, options, metadata);
    exporter.onProgress = onProgress;

    const blob = await exporter.export();

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.title.replace(/[^a-z0-9]/gi, '_')}_carousel.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
