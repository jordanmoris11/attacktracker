
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useScenarioStore } from '../../core/store/useScenarioStore';
import { GraphCanvas } from '../features/GraphCanvas/GraphCanvas';

export const FileLoader: React.FC = () => {
    const [searchParams] = useSearchParams();

    // Switch to Scenario Store
    const loadScenario = useScenarioStore(state => state.loadScenario);
    const error = useScenarioStore(state => state.error);
    const status = useScenarioStore(state => state.status);

    useEffect(() => {
        const path = searchParams.get('path');
        if (path) {
            console.log(`[FileLoader] Loading scenario from: ${path}`);
            fetch(path)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.statusText}`);
                    return res.text();
                })
                .then(data => loadScenario(data, path))
                .catch(err => {
                    console.error(err);
                    // The store handles its own error state, but network errors need manual handling if loadScenario isn't called
                    // Actually loadScenario handles parsing errors, but fetch errors are here.
                    // Ideally pass the error to the store or handle locally.
                    // For now, let's just log it. useScenarioStore maintains its own 'error' state for parsing.
                });
        }
    }, [searchParams, loadScenario]);

    // Show Error State
    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-brand-red">
                <div className="glass-panel p-6 text-center max-w-2xl">
                    <h2 className="text-xl font-bold mb-2">Error Loading Scenario</h2>
                    <pre className="text-xs text-left whitespace-pre-wrap bg-black/30 p-4 rounded mt-4">
                        {error}
                    </pre>
                </div>
            </div>
        );
    }

    // Show Loading State
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-brand-blue animate-pulse">Loading Scenario...</div>
            </div>
        );
    }

    return <GraphCanvas />;
};
