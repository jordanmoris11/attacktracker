import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGraphStore } from '../../core/store/useGraphStore';
import { GraphCanvas } from '../features/GraphCanvas/GraphCanvas';

export const GraphPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const loadData = useGraphStore(state => state.loadData);
    const error = useGraphStore(state => state.error);

    useEffect(() => {
        if (id) {
            // Construct path assuming /data/{id}.json structure
            const path = `/data/${id}.json`;
            console.log(`Loading graph from: ${path}`);

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
                .then(data => loadData(data, path))
                .catch(err => {
                    console.error(err);
                    useGraphStore.setState({ status: 'error', error: err.message });
                });
        }
    }, [id, loadData]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-brand-red">
                <div className="glass-panel p-6 text-center max-w-md">
                    <h2 className="text-xl font-bold mb-2">Error Loading Graph</h2>
                    <p className="text-slate-300 mb-4">{error}</p>
                    <p className="text-sm text-slate-500">
                        Tried to load: <code className="bg-slate-800 px-1 py-0.5 rounded">/data/{id}.json</code>
                    </p>
                </div>
            </div>
        );
    }

    return <GraphCanvas />;
};
