import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useGraphStore } from '../../../core/store/useGraphStore';
import { CYTOSCAPE_THEME } from './cytoscape-theme';
import { getIconPath } from '../../../shared/config/icons.registry';

// Register Layout
cytoscape.use(dagre);

export const GraphCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);

    // State
    const { nodes, edges, status } = useGraphStore();

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

        return () => {
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
                    iconPath: node.type === 'container' ? undefined : getIconPath(node.icon), // Spec 5: Icon Resolution
                    boundary: node.metadata?.boundary,
                    state: node.state
                }
            }));

            // Transform Edges
            const cyEdges = edges.map(edge => ({
                group: 'edges',
                data: {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    label: edge.label,
                    type: edge.type, // Spec 4: 'illegal', 'impact'
                    mitre: edge.mitre
                }
            }));

            // @ts-ignore - cytoscape types logic
            cy.add([...cyNodes, ...cyEdges]);

            // 3. Run Layout (Dagre)
            cy.layout({
                name: 'dagre',
                // @ts-ignore - dagre types
                rankDir: 'LR',
                align: 'UL', // Up-Left alignment typically cleaner
                rankSep: 200,
                nodeSep: 50,
                padding: 100,
                animate: true,
                animationDuration: 500
            }).run();
        });

    }, [nodes, edges, status]);

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
