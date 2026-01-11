
import { useEffect, useRef } from 'react';
import { useScenarioStore } from './useScenarioStore';

/**
 * usePersistence Hook
 * 
 * Watches for changes in ScenarioStore (positions/viewport) and auto-saves them
 * to the source JSON file on disk via the Vite Middleware API.
 */
export const usePersistence = () => {
    const scenario = useScenarioStore(state => state.scenario);
    const sourcePath = useScenarioStore(state => state.sourcePath);
    const status = useScenarioStore(state => state.status);

    // Debounce Ref
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedState = useRef<string>('');

    // Listener Effect
    useEffect(() => {
        // 1. Pre-checks
        if (!scenario || !sourcePath || status !== 'success') {
            // console.log('[Persistence] Skipping: Missing requirements', { hasScenario: !!scenario, path: sourcePath, status });
            return;
        }

        // 2. Serialize to detect changes (Basic Deep Equal on what defines layout)
        // We track: entities (specifically positions) and viewport
        const layoutSnapshot = {
            viewport: scenario.viewport,
            positions: scenario.entities.map(e => ({ id: e.id, pos: e.position }))
        };

        const stateString = JSON.stringify(layoutSnapshot);

        // Initial load check
        if (lastSavedState.current === '') {
            lastSavedState.current = stateString;
            return;
        }

        if (stateString === lastSavedState.current) return;

        // 3. Debounce Save (1000ms)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            // console.log(`[Persistence] Auto-saving changes to ${sourcePath}...`);
            lastSavedState.current = stateString;

            // 4. Send the FULL SCENARIO to Server
            // Unlike Legacy, we just send the entire JSON object because the Store IS the Source of Truth.
            // We don't need to merge positions externally because 'updateEntityPosition' updated the Scenario object directly.

            try {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filePath: sourcePath,
                        content: scenario // Send the whole updated JSON
                    })
                });

                if (response.ok) {
                    // console.log(`[Persistence] Saved successfully.`);
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

    }, [scenario, sourcePath, status]); // Re-run when scenario updates (drag)
};
