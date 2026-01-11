import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
// import dagre from 'cytoscape-dagre'; // Removed: defaulting to preset
import { useScenarioStore } from '../../../core/store/useScenarioStore';
import { usePersistence } from '../../../core/store/usePersistence'; // Re-enabled
import { initContainerHeaderLayer, preloadContainerIcons } from './ContainerHeaderRenderer';

// cytoscape.use(dagre);

export const GraphCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const cleanupHeaderLayerRef = useRef<(() => void) | null>(null);

    // New Store
    const {
        status,
        cyElements,
        currentStep,
        timeline,
        visibility,
        scenario
    } = useScenarioStore();

    // 0. Enable Persistence
    usePersistence();

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

        return () => {
            cleanupHeaderLayerRef.current?.();
            cyRef.current?.destroy();
            cyRef.current = null;
        };
    }, []);

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

        cy.on('pan zoom', updateStore);
        cy.on('dragfree', 'node', updateNodePos);

        // Cleanup listeners
        return () => {
            cy.off('pan zoom', updateStore);
            cy.off('dragfree', 'node', updateNodePos);
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

            // Track the newest edge for animation (outside batch)
            let newestEdge: cytoscape.EdgeSingular | null = null;

            // 2. Iterate from 0 to Current Step explicitly (1-based index adjustment)
            // If currentStep = 0 (Initial), loop doesn't run.
            // If currentStep = 1, loop runs for k=0 (timeline[0]).
            for (let i = 0; i < currentStep; i++) {
                const step = timeline[i];
                if (!step) continue;

                const isCurrentStepEdge = (i === currentStep - 1);

                if (step.type === 'edge') {
                    const edge = cy.add({
                        group: 'edges',
                        data: {
                            id: `edge_${step.id}`,
                            source: step.from,
                            target: step.to,
                            label: step.name,
                        },
                        style: isCurrentStepEdge ? {
                            // Current step edge: amber highlight
                            'line-color': '#fbbf24',
                            'target-arrow-color': '#fbbf24',
                            'width': 2,
                            'text-rotation': 'autorotate'
                        } : {
                            // Previous edges: normal gray
                            'line-color': '#94a3b8',
                            'target-arrow-color': '#94a3b8',
                            'width': 2,
                            'text-rotation': 'autorotate'
                        }
                    });

                    if (isCurrentStepEdge) {
                        newestEdge = edge;
                    }
                }

                // C. Text/Alert Handling (Highlight logic) - Only for CURRENT step
                if (isCurrentStepEdge && step.type === 'show_text') {
                    const target = cy.getElementById(step.target_entity);
                    if (target.nonempty()) {
                        target.addClass('highlighted');
                    }
                }
            }

            // D. Animate newest edge: amber → gray over 1 second
            if (newestEdge) {
                newestEdge.animate({
                    style: {
                        'line-color': '#94a3b8',
                        'target-arrow-color': '#94a3b8'
                    },
                    duration: 1000,
                    easing: 'ease-out'
                });
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
        </div>
    );
};
