import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useGraphStore } from '../../../core/store/useGraphStore';
import { useAnimationStore } from '../../../core/animation/useAnimationStore';
import { useLayoutStore } from '../../../core/store/useLayoutStore';
import { CYTOSCAPE_THEME } from './cytoscape-theme';
import { getIconPath } from '../../../shared/config/icons.registry';
import { initContainerHeaderLayer, preloadContainerIcons } from './ContainerHeaderRenderer';

// Register Layout
cytoscape.use(dagre);

export const GraphCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const cleanupHeaderLayerRef = useRef<(() => void) | null>(null);

    // State
    const { nodes, edges, status, title } = useGraphStore();
    const { saveNodePosition, getGraphLayout } = useLayoutStore();

    // 1. Initialize Cytoscape (Once)
    useEffect(() => {
        if (!containerRef.current) return;

        cyRef.current = cytoscape({
            container: containerRef.current,
            style: CYTOSCAPE_THEME,
            wheelSensitivity: 0.2,
            maxZoom: 3,
            minZoom: 0.2,
        });

        // Initialize the custom container header canvas layer
        cleanupHeaderLayerRef.current = initContainerHeaderLayer(cyRef.current);

        return () => {
            cleanupHeaderLayerRef.current?.();
            cyRef.current?.destroy();
            cyRef.current = null;
        };
    }, []);

    // 2. Sync Data -> Elements
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy || status !== 'success') return;

        // Batch for performance
        cy.batch(() => {
            cy.elements().remove(); // Clear old graph

            // Transform Nodes (inject iconPath)
            const cyNodes = nodes.map(node => ({
                group: 'nodes',
                data: {
                    id: node.id,
                    label: node.label,
                    parent: node.parent, // Spec 10: Compound Parent
                    type: node.type,
                    iconPath: getIconPath(node.icon), // Spec 5: Icon Resolution (Enabled for Containers now)
                    boundary: node.metadata?.boundary,
                    state: node.state
                }
            }));

            // Calculate Visibility Context once
            // Note: We read state directly to avoid dependency cycle and ensure initial render is correct
            const currentStep = useAnimationStore.getState().currentStep;
            const maxExplicitStep = Math.max(...edges.map(e => e.step || 0), 0);
            const useExplicit = maxExplicitStep > 0;

            // Transform Edges
            const cyEdges = edges.map((edge, i) => {
                // Visibility Logic
                let isVisible = false;
                if (currentStep > 0) {
                    if (useExplicit) {
                        const step = edge.step || 9999;
                        isVisible = step <= currentStep;
                    } else {
                        // Step 1 corresponds to Index 0
                        isVisible = (i + 1) <= currentStep;
                    }
                }

                return {
                    group: 'edges',
                    data: {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        label: edge.label,
                        type: edge.type, // Spec 4: 'illegal', 'impact'
                        mitre: edge.mitre,
                        step: edge.step // Pass step data to element for Syncer usage later
                    },
                    classes: isVisible ? 'visible' : 'hidden'
                };
            });

            // 3. Run Layout (Conditional)
            const savedLayout = getGraphLayout(title);
            let layoutConfig: any = {
                name: 'dagre',
                rankDir: 'LR',
                align: 'UL', // Up-Left alignment typically cleaner
                rankSep: 200,
                nodeSep: 50,
                padding: 100,
                animate: true,
                animationDuration: 500
            };

            if (savedLayout && savedLayout.positions && Object.keys(savedLayout.positions).length > 0) {
                // Scenario B: Restore Saved Positions (Positions exist)
                console.log(`[Layout Persistence] Restoring positions for "${title}"`);

                // Identify valid saved positions (only for nodes that still exist)
                cyNodes.forEach(node => {
                    const savedPos = savedLayout.positions[node.data.id];
                    if (savedPos) {
                        (node as any).position = savedPos;
                    }
                });

                layoutConfig = {
                    name: 'preset', // Uses the positions we just injected
                    padding: 100,
                    animate: false
                };
            } else {
                console.log(`[Layout Persistence] No saved positions for "${title}". Running Auto-Layout.`);
            }

            // @ts-ignore - cytoscape types logic
            cy.add([...cyNodes, ...cyEdges]);

            const layout = cy.layout(layoutConfig);

            // 4. Preload container icons AFTER layout completes
            cy.one('layoutstop', () => {
                preloadContainerIcons(cy).then(() => {
                    // Restore Viewport (Zoom/Pan) if available
                    if (savedLayout?.viewport) {
                        console.log(`[Layout Persistence] Restoring viewport for "${title}"`);
                        cy.viewport({
                            zoom: savedLayout.viewport.zoom,
                            pan: savedLayout.viewport.pan
                        });
                    }

                    cy.emit('render');
                });
            });

            layout.run();

            // 5. Layout Persistence: Capture Moves & Viewport
            // Remove previous listeners to avoid duplicates if useEffect re-runs
            cy.off('dragfree', 'node');
            cy.off('pan zoom'); // Clear old listeners

            const { saveNodePosition, saveViewport } = useLayoutStore.getState();

            cy.on('dragfree', 'node', (evt) => {
                const node = evt.target;
                saveNodePosition(title, node.id(), node.position());
            });

            // Debounced Viewport Save (Pan/Zoom)
            let viewportTimeout: any;
            cy.on('pan zoom', () => {
                clearTimeout(viewportTimeout);
                viewportTimeout = setTimeout(() => {
                    saveViewport(title, cy.zoom(), cy.pan());
                }, 500); // Wait 500ms after last move
            });
        });

    }, [nodes, edges, status, title]); // Added title to deps

    // 4. Animation Syncer (Spec 7)
    // We import this hook inside here to avoid re-rendering the whole canvas, 
    // but effectively we just need access to the store's currentStep.
    const { currentStep } = useAnimationStore();

    useEffect(() => {
        const cy = cyRef.current;
        if (!cy || status !== 'success') return;

        cy.batch(() => {
            const cyEdges = cy.edges();

            // If at step 0, hide all edges
            if (currentStep === 0) {
                cyEdges.removeClass('visible').addClass('hidden');
                return;
            }

            // Determine if using explicit steps or index-based fallback
            // (Shared logic with Controls, ideal to centralize but fine here for now)
            const maxExplicitStep = Math.max(...edges.map(e => e.step || 0), 0);
            const useExplicit = maxExplicitStep > 0;

            cyEdges.forEach((edge, i) => {
                // If explicit: edge.data('step') <= currentStep
                // If fallback: index (0-based) < currentStep (1-based count)
                // e.g. Step 1 shows edge index 0.

                let isVisible = false;
                if (useExplicit) {
                    const step = edge.data('step') || 9999;
                    isVisible = step <= currentStep;
                } else {
                    isVisible = i < currentStep;
                }

                if (isVisible) {
                    edge.removeClass('hidden').addClass('visible');
                } else {
                    edge.removeClass('visible').addClass('hidden');
                }
            });
        });

    }, [currentStep, edges, status]); // Dependencies: Re-run when step changes

    return (
        <div className="w-full h-full relative bg-background-primary overflow-hidden">
            {/* The Canvas */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Simple Status Overlay */}
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                    <span className="text-white">Loading Graph...</span>
                </div>
            )}
            {status === 'error' && (
                <div className="absolute top-10 left-10 p-4 glass-panel border border-brand-red text-red-100 max-w-lg z-50">
                    <h3 className="font-bold mb-2">Error Loading Graph</h3>
                    {/* Access error from store if needed, but simple message for now */}
                    <p>Check console or upload valid JSON/Mermaid.</p>
                </div>
            )}
        </div>
    );
};
