
import { useEffect, useRef } from 'react';
import { useGraphStore } from './useGraphStore';
import { useLayoutStore, type ViewportState, type XYPosition } from './useLayoutStore';
import type { AttackGraph } from '../../shared/schemas/graph.schema';

/**
 * usePersistence Hook
 * 
 * Watches for changes in LayoutStore (positions/viewport) and auto-saves them
 * to the source JSON file on disk via the Vite Middleware API.
 */
export const usePersistence = () => {
    const { title, rawData, sourcePath } = useGraphStore();
    const { layouts } = useLayoutStore();

    // Debounce Ref
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedState = useRef<string>('');

    // Listener Effect
    useEffect(() => {
        // 1. Get current layout data for this graph
        const currentLayout = layouts[title];
        if (!currentLayout || !sourcePath) return;

        // 2. Serialize to detect changes (Basic Deep Equal)
        const stateString = JSON.stringify(currentLayout);
        if (stateString === lastSavedState.current) return;

        // 3. Debounce Save (1000ms)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            console.log(`[Persistence] Auto-saving changes to ${sourcePath}...`);
            lastSavedState.current = stateString;

            // 4. Construct the Full JSON Object
            // We need to merge the *original* data with the *new* layout positions.
            // This is critical to avoid losing data we don't track (like custom props).

            // Deep Clone Reference
            const graphToSave: AttackGraph = JSON.parse(JSON.stringify(rawData || {
                title, nodes: [], edges: [], version: '2.0'
            }));

            // Inject Positions
            // We iterate over the *nodes we have in memory* to find their positions
            // But we must update the *nodes in the file object*.

            if (currentLayout.positions) {
                graphToSave.nodes = graphToSave.nodes.map(node => {
                    const pos = currentLayout.positions[node.id];
                    if (pos) {
                        return { ...node, position: pos };
                    }
                    return node;
                });
            }

            // Inject Viewport
            if (currentLayout.viewport) {
                graphToSave.viewport = currentLayout.viewport;
            }

            // 5. Send to Server
            try {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filePath: sourcePath, // e.g. "/data/shai.json"
                        content: graphToSave
                    })
                });

                if (response.ok) {
                    console.log(`[Persistence] Saved successfully.`);
                } else {
                    console.error(`[Persistence] Server error: ${response.statusText}`);
                }
            } catch (err) {
                console.error(`[Persistence] Network error:`, err);
            }

        }, 1000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };

    }, [layouts, title, sourcePath, rawData]); // Re-run when layout or graph changes
};
