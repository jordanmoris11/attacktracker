
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useScenarioStore } from '../../core/store/useScenarioStore';
import { GraphCanvas } from '../features/GraphCanvas/GraphCanvas';

export const GraphPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Switch to Scenario Store
    const loadScenario = useScenarioStore(state => state.loadScenario);
    const error = useScenarioStore(state => state.error);
    const status = useScenarioStore(state => state.status);

    useEffect(() => {
        if (id) {
            // Construct path assuming /data/{id}.json structure
            const path = `/data/${id}.json`;
            console.log(`[GraphPage] Loading scenario from: ${path}`);

            fetch(path)
                .then(res => {
                    if (!res.ok) {
                        if (res.status === 404) {
                            throw new Error(`Graph file not found: ${id}.json`);
                        }
                        throw new Error(`Failed to load ${path}: ${res.statusText}`);
                    }
                    return res.text();
                })
                .then(data => loadScenario(data, path))
                .catch(err => {
                    console.error(err);
                    // useScenarioStore handles internal parsing errors, but we can log network errors here
                });
        }
    }, [id, loadScenario]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-brand-red">
                <div className="glass-panel p-6 text-center max-w-md">
                    <h2 className="text-xl font-bold mb-2">Error Loading Scenario</h2>
                    <p className="text-slate-300 mb-4 whitespace-pre-wrap text-left text-xs bg-black/30 p-2 rounded max-h-40 overflow-auto">{error}</p>
                    <p className="text-sm text-slate-500">
                        Tried to load: <code className="bg-slate-800 px-1 py-0.5 rounded">/data/{id}.json</code>
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-brand-blue animate-pulse">Loading Scenario...</div>
            </div>
        );
    }

    return <GraphCanvas />;
};
