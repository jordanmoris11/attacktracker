/**
 * PageRenderer.ts
 *
 * Canvas-based page composition for PDF export.
 * Renders a single PDF page with graph image + info panel.
 */

import { PAGE, LAYOUT, COLORS, FONTS, getTacticColor } from './pdf.constants';
import type { TimelineStep, EdgeStep } from '../../shared/schemas/scenario.schema';

interface RenderPageOptions {
    graphImage: string;        // base64 PNG from Cytoscape
    step: TimelineStep | null; // null for cover page
    stepIndex: number;
    totalSteps: number;
    scenarioTitle: string;
    scenarioDescription?: string;
    isCoverPage?: boolean;
}

/**
 * PageRenderer
 * Creates a canvas, renders all elements, and returns PNG bytes.
 */
export class PageRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private scale: number;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.scale = PAGE.SCALE;

        // Set canvas size (with retina scaling)
        this.canvas.width = PAGE.WIDTH * this.scale;
        this.canvas.height = PAGE.HEIGHT * this.scale;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        this.ctx = ctx;

        // Scale context for retina
        this.ctx.scale(this.scale, this.scale);
    }

    /**
     * Render a complete page and return as PNG blob
     */
    async renderPage(options: RenderPageOptions): Promise<Blob> {
        const { graphImage, step, stepIndex, totalSteps, scenarioTitle, scenarioDescription, isCoverPage } = options;

        // Clear canvas
        this.ctx.fillStyle = COLORS.BG_PRIMARY;
        this.ctx.fillRect(0, 0, PAGE.WIDTH, PAGE.HEIGHT);

        if (isCoverPage) {
            await this.renderCoverPage(scenarioTitle, scenarioDescription, totalSteps);
        } else {
            // Render components
            this.renderHeader(scenarioTitle, stepIndex, totalSteps);
            await this.renderGraph(graphImage);
            this.renderInfoPanel(step as EdgeStep, stepIndex);
            this.renderSwipeCTA(stepIndex, totalSteps);
        }

        // Convert to blob
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to create blob'));
                },
                'image/png',
                1.0
            );
        });
    }

    /**
     * Render cover page (first page)
     */
    private async renderCoverPage(title: string, description?: string, totalSteps?: number): Promise<void> {
        const centerX = PAGE.WIDTH / 2;
        const centerY = PAGE.HEIGHT / 2;

        // Title
        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `bold 42px ${FONTS.SANS}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Word wrap title
        const titleLines = this.wrapText(title, PAGE.WIDTH - 120, 42);
        let yOffset = centerY - 80;

        titleLines.forEach((line, i) => {
            this.ctx.fillText(line, centerX, yOffset + i * 52);
        });

        // Description
        if (description) {
            this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
            this.ctx.font = `400 18px ${FONTS.SANS}`;
            yOffset += titleLines.length * 52 + 40;

            const descLines = this.wrapText(description, PAGE.WIDTH - 160, 18);
            descLines.slice(0, 3).forEach((line, i) => {
                this.ctx.fillText(line, centerX, yOffset + i * 28);
            });
        }

        // Step count badge
        if (totalSteps) {
            this.ctx.fillStyle = COLORS.BG_SECONDARY;
            const badgeY = centerY + 120;
            this.roundRect(centerX - 80, badgeY - 20, 160, 40, 20);
            this.ctx.fill();

            this.ctx.fillStyle = COLORS.BRAND_BLUE;
            this.ctx.font = `600 16px ${FONTS.SANS}`;
            this.ctx.fillText(`${totalSteps} Steps`, centerX, badgeY);
        }

        // Swipe to begin
        this.ctx.fillStyle = COLORS.TEXT_MUTED;
        this.ctx.font = `500 16px ${FONTS.SANS}`;
        this.ctx.fillText('Swipe to begin', centerX, PAGE.HEIGHT - 80);

        // Arrow
        this.ctx.fillStyle = COLORS.BRAND_BLUE;
        this.ctx.font = `400 24px ${FONTS.SANS}`;
        this.ctx.fillText('\u2192', centerX, PAGE.HEIGHT - 50);
    }

    /**
     * Render header section
     */
    private renderHeader(title: string, stepIndex: number, totalSteps: number): void {
        const { HEADER } = LAYOUT;

        // Header background
        this.ctx.fillStyle = COLORS.BG_SECONDARY;
        this.ctx.fillRect(0, 0, PAGE.WIDTH, HEADER.HEIGHT + 30);

        // Border bottom
        this.ctx.strokeStyle = COLORS.BORDER_SUBTLE;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, HEADER.HEIGHT + 30);
        this.ctx.lineTo(PAGE.WIDTH, HEADER.HEIGHT + 30);
        this.ctx.stroke();

        // Title
        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `bold ${HEADER.TITLE_FONT_SIZE}px ${FONTS.SANS}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const truncatedTitle = this.truncateText(title, PAGE.WIDTH - 250, HEADER.TITLE_FONT_SIZE);
        this.ctx.fillText(truncatedTitle, PAGE.PADDING, 45);

        // Step counter (right side)
        this.ctx.fillStyle = COLORS.TEXT_MUTED;
        this.ctx.font = `500 ${HEADER.STEP_FONT_SIZE}px ${FONTS.MONO}`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Step ${stepIndex} of ${totalSteps}`, PAGE.WIDTH - PAGE.PADDING, 45);

        // Progress bar
        const progressBarY = 75;
        const progressBarWidth = PAGE.WIDTH - (PAGE.PADDING * 2);
        const progressWidth = (stepIndex / totalSteps) * progressBarWidth;

        // Background
        this.ctx.fillStyle = COLORS.BG_TERTIARY;
        this.roundRect(PAGE.PADDING, progressBarY, progressBarWidth, 6, 3);
        this.ctx.fill();

        // Progress
        this.ctx.fillStyle = COLORS.BRAND_BLUE;
        this.roundRect(PAGE.PADDING, progressBarY, progressWidth, 6, 3);
        this.ctx.fill();
    }

    /**
     * Render graph image
     */
    private async renderGraph(graphImageBase64: string): Promise<void> {
        const { GRAPH } = LAYOUT;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Calculate fit dimensions
                const maxWidth = PAGE.WIDTH - (PAGE.PADDING * 2) - (GRAPH.PADDING * 2);
                const maxHeight = GRAPH.HEIGHT - (GRAPH.PADDING * 2);

                let drawWidth = img.width;
                let drawHeight = img.height;

                // Scale down if needed
                const scaleX = maxWidth / img.width;
                const scaleY = maxHeight / img.height;
                const scale = Math.min(scaleX, scaleY, 1);

                drawWidth = img.width * scale;
                drawHeight = img.height * scale;

                // Center in graph area
                const x = PAGE.PADDING + GRAPH.PADDING + (maxWidth - drawWidth) / 2;
                const y = GRAPH.TOP + GRAPH.PADDING + (maxHeight - drawHeight) / 2;

                // Draw border/background for graph area
                this.ctx.fillStyle = COLORS.BG_SECONDARY;
                this.roundRect(
                    PAGE.PADDING,
                    GRAPH.TOP,
                    PAGE.WIDTH - (PAGE.PADDING * 2),
                    GRAPH.HEIGHT,
                    12
                );
                this.ctx.fill();

                // Draw graph image
                this.ctx.drawImage(img, x, y, drawWidth, drawHeight);

                resolve();
            };
            img.onerror = () => reject(new Error('Failed to load graph image'));
            img.src = graphImageBase64;
        });
    }

    /**
     * Render info panel at bottom
     */
    private renderInfoPanel(step: EdgeStep | null, stepIndex: number): void {
        if (!step) return;

        const { INFO_PANEL } = LAYOUT;
        const panelX = PAGE.PADDING;
        const panelY = INFO_PANEL.TOP;
        const panelWidth = PAGE.WIDTH - (PAGE.PADDING * 2);

        // Panel background
        this.ctx.fillStyle = COLORS.BG_SECONDARY;
        this.roundRect(panelX, panelY, panelWidth, INFO_PANEL.HEIGHT, 12);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = COLORS.BORDER_MEDIUM;
        this.ctx.lineWidth = 1;
        this.roundRect(panelX, panelY, panelWidth, INFO_PANEL.HEIGHT, 12);
        this.ctx.stroke();

        let yOffset = panelY + INFO_PANEL.PADDING;

        // Action name
        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `bold ${INFO_PANEL.ACTION_FONT_SIZE}px ${FONTS.SANS}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(step.name || 'Action', panelX + INFO_PANEL.PADDING, yOffset);
        yOffset += INFO_PANEL.ACTION_FONT_SIZE + 20;

        // CLI command (if present)
        if (step.type === 'edge' && step.cli) {
            const cliX = panelX + INFO_PANEL.PADDING;
            const cliWidth = panelWidth - (INFO_PANEL.PADDING * 2);
            const cliHeight = 50;

            // CLI background
            this.ctx.fillStyle = COLORS.BG_CLI;
            this.roundRect(cliX, yOffset, cliWidth, cliHeight, 8);
            this.ctx.fill();

            // CLI border
            this.ctx.strokeStyle = COLORS.BG_TERTIARY;
            this.ctx.lineWidth = 1;
            this.roundRect(cliX, yOffset, cliWidth, cliHeight, 8);
            this.ctx.stroke();

            // CLI text
            this.ctx.fillStyle = COLORS.TEXT_CLI;
            this.ctx.font = `400 ${INFO_PANEL.CLI_FONT_SIZE}px ${FONTS.MONO}`;
            const cliText = this.truncateText(`$ ${step.cli}`, cliWidth - 30, INFO_PANEL.CLI_FONT_SIZE);
            this.ctx.fillText(cliText, cliX + 15, yOffset + 18);

            yOffset += cliHeight + 16;
        }

        // Tooltip description
        if (step.type === 'edge' && step.tooltip) {
            this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
            this.ctx.font = `400 ${INFO_PANEL.TOOLTIP_FONT_SIZE}px ${FONTS.SANS}`;

            const tooltipWidth = panelWidth - (INFO_PANEL.PADDING * 2);
            const tooltipLines = this.wrapText(step.tooltip, tooltipWidth, INFO_PANEL.TOOLTIP_FONT_SIZE);

            tooltipLines.slice(0, 3).forEach((line, i) => {
                this.ctx.fillText(line, panelX + INFO_PANEL.PADDING, yOffset + i * 22);
            });

            yOffset += Math.min(tooltipLines.length, 3) * 22 + 16;
        }

        // MITRE badge
        if (step.mitre) {
            const tacticColor = getTacticColor(step.mitre.tactic);
            const badgeY = panelY + INFO_PANEL.HEIGHT - INFO_PANEL.PADDING - 30;

            // Badge background
            this.ctx.fillStyle = COLORS.BG_TERTIARY;
            this.roundRect(panelX + INFO_PANEL.PADDING, badgeY, 90, 28, 6);
            this.ctx.fill();

            // Badge text (T-code)
            this.ctx.fillStyle = tacticColor;
            this.ctx.font = `bold ${INFO_PANEL.MITRE_FONT_SIZE}px ${FONTS.MONO}`;
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(step.mitre.id, panelX + INFO_PANEL.PADDING + 12, badgeY + 14);

            // Technique name
            this.ctx.fillStyle = COLORS.TEXT_MUTED;
            this.ctx.font = `400 ${INFO_PANEL.MITRE_FONT_SIZE}px ${FONTS.SANS}`;
            const techniqueName = this.truncateText(
                step.mitre.technique || step.mitre.tactic,
                panelWidth - 200,
                INFO_PANEL.MITRE_FONT_SIZE
            );
            this.ctx.fillText(techniqueName, panelX + INFO_PANEL.PADDING + 105, badgeY + 14);
        }
    }

    /**
     * Render swipe CTA
     */
    private renderSwipeCTA(stepIndex: number, totalSteps: number): void {
        const { CTA, INFO_PANEL } = LAYOUT;

        if (stepIndex >= totalSteps) {
            // Last page - don't show swipe
            return;
        }

        const ctaX = PAGE.WIDTH - PAGE.PADDING - 80;
        const ctaY = INFO_PANEL.TOP + INFO_PANEL.HEIGHT - INFO_PANEL.PADDING - 30;

        this.ctx.fillStyle = COLORS.TEXT_MUTED;
        this.ctx.font = `500 ${CTA.FONT_SIZE}px ${FONTS.SANS}`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(CTA.TEXT, ctaX, ctaY + 14);

        // Arrow
        this.ctx.fillStyle = COLORS.BRAND_BLUE;
        this.ctx.font = `400 20px ${FONTS.SANS}`;
        this.ctx.fillText('\u2192', ctaX + 25, ctaY + 14);
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Draw a rounded rectangle path
     */
    private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * Wrap text to fit within a width
     */
    private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
        this.ctx.font = `400 ${fontSize}px ${FONTS.SANS}`;
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = this.ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    /**
     * Truncate text with ellipsis
     */
    private truncateText(text: string, maxWidth: number, fontSize: number): string {
        this.ctx.font = `400 ${fontSize}px ${FONTS.SANS}`;
        let truncated = text;
        let metrics = this.ctx.measureText(truncated);

        while (metrics.width > maxWidth && truncated.length > 3) {
            truncated = truncated.slice(0, -4) + '...';
            metrics = this.ctx.measureText(truncated);
        }

        return truncated;
    }
}
