import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
// import dagre from 'cytoscape-dagre'; // Removed: defaulting to preset
import { useScenarioStore } from '../../../core/store/useScenarioStore';
import { usePersistence } from '../../../core/store/usePersistence'; // Re-enabled
import { MITRE_INDEX } from '../../../shared/config/mitre-index';
import { initContainerHeaderLayer, preloadContainerIcons } from './ContainerHeaderRenderer';
import { EdgeTooltip, type TooltipData } from './EdgeTooltip';

// cytoscape.use(dagre);

export const GraphCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const cleanupHeaderLayerRef = useRef<(() => void) | null>(null);
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

    // New Store
    const {
        status,
        cyElements,
        currentStep,
        timeline,
        visibility,
        scenario,
        setCyInstance,
        setGraphContainerRef
    } = useScenarioStore();

    // 0. Enable Persistence
    usePersistence();

    // 0.5. Set container ref for export selection
    useEffect(() => {
        if (containerRef.current) {
            setGraphContainerRef(containerRef.current);
        }
        return () => setGraphContainerRef(null);
    }, [setGraphContainerRef]);

    // 1. Initialize Cytoscape (Once)
    useEffect(() => {
        if (!containerRef.current) return;

        cyRef.current = cytoscape({
            container: containerRef.current,
            style: [
                // Minimal Default Theme matching new 'Scenario' look
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'text-valign': 'bottom',
                        'text-margin-y': 8,
                        'background-color': 'data(color)', // Use JSON color
                        'color': '#fff',
                        'font-size': 12,
                        'width': 40,
                        'height': 40,
                        'background-fit': 'contain',
                        'background-image': 'data(iconPath)',
                        'background-opacity': 0 // Icons are SVGs, hide the circle usually
                    }
                },
                {
                    selector: 'node[type="container"]',
                    style: {
                        'background-image': 'none', // Fix: Remove duplicate icon from center
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': 'data(color)', // e.g. #10B981
                        'border-style': 'dashed',
                        'label': '', // HeaderRenderer handles label
                        'shape': 'roundrectangle'
                    }
                },
                {
                    selector: ':parent',
                    style: {
                        'text-valign': 'top',
                        'text-halign': 'center',
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#94a3b8',
                        'target-arrow-color': '#94a3b8',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'text-background-opacity': 1,
                        'text-background-color': '#0f172a',
                        'text-background-padding': '4px',
                        'color': '#cbd5e1',
                        'font-size': 10,
                        'text-rotation': 'autorotate'
                    }
                },
                // Visibility Classes
                {
                    selector: '.hidden',
                    style: {
                        'display': 'none'
                    }
                },
                {
                    selector: '.highlighted',
                    style: {
                        'border-width': 4,
                        'border-color': '#fbbf24', // Amber
                        'transition-property': 'border-width, border-color',
                        'transition-duration': 300
                    }
                }
            ],
            wheelSensitivity: 0.2,
            maxZoom: 3,
            minZoom: 0.2,
        });

        cleanupHeaderLayerRef.current = initContainerHeaderLayer(cyRef.current);

        // Store cy instance for export
        setCyInstance(cyRef.current);

        return () => {
            cleanupHeaderLayerRef.current?.();
            setCyInstance(null);
            cyRef.current?.destroy();
            cyRef.current = null;
        };
    }, [setCyInstance]);

    // 2. Load Elements (Setting the Scene)
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy || status !== 'success') return;

        cy.batch(() => {
            cy.elements().remove();

            // Add Pre-computed Nodes
            if (cyElements.length > 0) {
                cy.add(cyElements);
            }

            // Set Viewport (if provided)
            if (scenario?.viewport) {
                cy.zoom(scenario.viewport.zoom);
                cy.pan(scenario.viewport.pan);
            } else {
                cy.fit();
            }
        });

        // Trigger Icon Preload
        preloadContainerIcons(cy);

        // Initial render logic
        cy.emit('render');

        // --- Persistence Listeners ---
        const updateStore = () => {
            const viewport = {
                zoom: cy.zoom(),
                pan: cy.pan()
            };
            useScenarioStore.getState().updateViewport(viewport.zoom, viewport.pan);
        };

        const updateNodePos = (evt: any) => {
            const node = evt.target;
            const pos = node.position();
            useScenarioStore.getState().updateEntityPosition(node.id(), pos.x, pos.y);
        };

        const onEdgeHover = (e: any) => {
            const edge = e.target;
            const renderPos = e.renderedPosition; // Canvas coordinates relative to container

            // Extract data
            const mitreData = edge.data('mitre');
            const color = mitreData ? MITRE_INDEX[mitreData.id]?.color : '#fbbf24';

            setTooltipData({
                x: renderPos.x,
                y: renderPos.y,
                label: edge.data('label'),
                description: edge.data('tooltip'),
                cli: edge.data('cli'),
                mitre: mitreData ? { ...mitreData, color } : undefined
            });
        };

        const onEdgeLeave = () => {
            setTooltipData(null);
        };

        cy.on('pan zoom', updateStore);
        cy.on('dragfree', 'node', updateNodePos);
        cy.on('mouseover', 'edge', onEdgeHover);
        cy.on('mouseout', 'edge', onEdgeLeave);

        // Cleanup listeners
        return () => {
            cy.off('pan zoom', updateStore);
            cy.off('dragfree', 'node', updateNodePos);
            cy.off('mouseover', 'edge', onEdgeHover);
            cy.off('mouseout', 'edge', onEdgeLeave);
        };
    }, [cyElements, status]); // Only re-run if complete graph replacement (not just pos update)

    // 3. The Movie Loop: Step Updates
    // Handles specific Edge Drawing + Visibility Toggling
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy || status !== 'success') return;

        cy.batch(() => {
            // A. Visibility Manager
            if (visibility) {
                cy.nodes().forEach(node => {
                    const id = node.id();
                    const range = visibility[id];

                    let isVisible = true; // Default to visible if no constraints
                    // If range exists, strictly enforce it
                    if (range) {
                        // Special Case: At Step 0 (Ready), show items that start at 1 (Scene Setting)
                        const checkStep = currentStep === 0 ? 1 : currentStep;
                        isVisible = (checkStep >= range.start && currentStep <= range.end);
                    }

                    if (isVisible) {
                        node.removeClass('hidden');
                    } else {
                        node.addClass('hidden');
                    }
                });
            }

            // B. Cumulative Edges
            // 1. Remove ALL edges first (to rebuild clean state)
            cy.edges().remove();
            cy.elements('.highlighted').removeClass('highlighted');

            // --- PRE-PROCESSING: Seamless Multi-Edge Layout ---
            // Calculate edge slots based on FULL timeline to prevent jumping
            const pairGroups: Record<string, string[]> = {};
            timeline.forEach(tStep => {
                if (tStep.type === 'edge') {
                    // Create stable pair ID (A-B same as B-A)
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

            // Track the newest edge for animation (outside batch)
            let newestEdge: cytoscape.EdgeSingular | null = null;

            // 2. Iterate from 0 to Current Step explicitly (1-based index adjustment)
            // If currentStep = 0 (Initial), loop doesn't run.
            // If currentStep = 1, loop runs for k=0 (timeline[0]).
            for (let i = 0; i < currentStep; i++) {
                const step = timeline[i];
                if (!step) continue;

                const isCurrentStepEdge = (i === currentStep - 1);

                // C. Dynamic Color Lookup
                let edgeColor = '#fbbf24'; // Default Amber
                if (step.mitre && step.mitre.id && MITRE_INDEX[step.mitre.id]) {
                    edgeColor = MITRE_INDEX[step.mitre.id].color || edgeColor;
                }

                if (step.type === 'edge') {
                    // Smart Arc Calculation
                    const meta = edgeMeta[`edge_${step.id}`];
                    let curveProps: any = { 'curve-style': 'bezier' };

                    if (meta && meta.total > 1) {
                        const SPEED_OF_LIGHT = 50; // Distance between arcs
                        let offset = (meta.index - (meta.total - 1) / 2) * SPEED_OF_LIGHT;

                        // DIRECTION CHECK:
                        // If edge direction opposes canonical sorting (A->B vs A-B), flip the offset
                        // value to ensure arcs curve in consistent pattern regardless of direction.
                        if (step.from > step.to) {
                            offset *= -1;
                        }

                        curveProps = {
                            'curve-style': 'unbundled-bezier',
                            'control-point-distances': offset,
                            'control-point-weights': 0.5
                        };
                    }

                    const edge = cy.add({
                        group: 'edges',
                        data: {
                            id: `edge_${step.id}`,
                            source: step.from,
                            target: step.to,
                            label: step.name,
                            // Inject Tooltip Data
                            tooltip: step.tooltip, // Correct property from schema
                            cli: step.cli,          // Inject CLI command
                            mitre: step.mitre
                        },
                        style: isCurrentStepEdge ? {
                            // Current step edge: Ultra-Thin Laser ("Modern")
                            'line-color': edgeColor,
                            'target-arrow-color': edgeColor,
                            'width': 1.5, // Ultra thin technical look
                            'arrow-scale': 1.2, // Balanced arrow size
                            'text-rotation': 'autorotate',
                            'z-index': 100,
                            'opacity': 1,

                            ...curveProps,

                            // Diffuse Glow (Constant size, breathing opacity)
                            'underlay-color': edgeColor,
                            'underlay-padding': 3, // slightly wider but soft
                            'underlay-opacity': 0.4, // Reduced base opacity
                            'underlay-shape': 'round',

                            // Text Glow (User Request)
                            'color': edgeColor, // Text matches tactic color
                            'text-outline-color': edgeColor,
                            'text-outline-width': 1, // Thin crisp outline
                            'text-outline-opacity': 0.4 // Base opacity
                        } : {
                            // Previous edges: Retain Tactic Color, No Glow
                            'line-color': edgeColor,
                            'target-arrow-color': edgeColor,
                            'width': 1.5, // Match thin laser width
                            'arrow-scale': 1.0,
                            'text-rotation': 'autorotate',

                            ...curveProps,

                            // History Text Style
                            'color': edgeColor,
                            'text-outline-width': 0, // No glow
                            'text-background-opacity': 1, // Fully opaque to hide line
                            'text-background-color': '#0f172a',
                            'text-background-padding': '4px', // Increased padding
                            'text-background-shape': 'roundrectangle',

                            // Granular Opacity (Fix: Don't use global opacity)
                            'opacity': 1, // Element is opaque
                            'line-opacity': 0.4, // Line is dimmed
                            'target-arrow-opacity': 0.4,
                            'text-opacity': 0.8, // Text is slightly brighter than line

                            'underlay-opacity': 0
                        }
                    });

                    if (isCurrentStepEdge) {
                        newestEdge = edge;
                    }
                }

                // D. Text/Alert Handling
                if (isCurrentStepEdge && step.type === 'show_text') {
                    const target = cy.getElementById(step.target_entity);
                    if (target.nonempty()) {
                        target.addClass('highlighted');
                    }
                }
            }

            // E. Pulse Animation (Opacity Only - More Transparent - Text Sync)
            if (newestEdge) {
                const runPulse = () => {
                    if (!newestEdge || newestEdge.removed()) return;

                    newestEdge.animate({
                        style: {
                            'underlay-opacity': 0.1,
                            'text-outline-opacity': 0.1
                        }, // Fade out almost completely
                        duration: 800,
                        easing: 'ease-in-out-sine'
                    }).delay(0).animate({
                        style: {
                            'underlay-opacity': 0.5,
                            'text-outline-opacity': 0.5
                        }, // Peak at 0.5 (was 0.8) to avoid "thick rectangle" look
                        duration: 800,
                        easing: 'ease-in-out-sine',
                        complete: runPulse
                    });
                };
                runPulse();
            }

        });
    }, [currentStep, status, timeline, visibility]);

    return (
        <div className="w-full h-full relative bg-slate-900 overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />

            {/* Step Indicator (Temporary UI) */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white p-2 text-xs z-50 rounded font-mono">
                Step: {currentStep} / {timeline.length}
            </div>

            {/* Edge Tooltip */}
            <EdgeTooltip data={tooltipData} />
        </div>
    );
};
