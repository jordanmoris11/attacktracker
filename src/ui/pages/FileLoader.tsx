
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGraphStore } from '../../core/store/useGraphStore';
import { GraphCanvas } from '../features/GraphCanvas/GraphCanvas';

export const FileLoader: React.FC = () => {
    const [searchParams] = useSearchParams();
    const loadData = useGraphStore(state => state.loadData);
    const error = useGraphStore(state => state.error);

    useEffect(() => {
        const path = searchParams.get('path');
        if (path) {
            console.log(`Loading file from: ${path}`);
            fetch(path)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.statusText}`);
                    return res.text();
                })
                .then(data => loadData(data))
                .catch(err => {
                    console.error(err);
                    useGraphStore.setState({ status: 'error', error: err.message });
                });
        }
    }, [searchParams, loadData]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-brand-red">
                <div className="glass-panel p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Error Loading Graph</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return <GraphCanvas />;
};
