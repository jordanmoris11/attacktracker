import { create } from 'zustand';
import type { AttackGraph, GraphNode, GraphEdge } from '../../shared/schemas/graph.schema';
import { parserHost } from '../parser/ParserHost';

interface GraphState {
    // Data
    graph: AttackGraph | null;
    nodes: GraphNode[];
    edges: GraphEdge[];

    // Meta
    title: string;
    description: string;

    // UI State
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;

    // Actions
    loadData: (content: string) => Promise<void>;
    reset: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
    graph: null,
    nodes: [],
    edges: [],
    title: 'Untitled Graph',
    description: '',
    status: 'idle',
    error: null,

    loadData: async (content: string) => {
        set({ status: 'loading', error: null });

        // Artificial small delay for UX to let spinner show
        await new Promise(r => setTimeout(r, 300));

        const result = await parserHost.parse(content);

        if (result.success && result.data) {
            set({
                status: 'success',
                graph: result.data,
                nodes: result.data.nodes,
                edges: result.data.edges,
                title: result.data.title,
                description: result.data.description || ''
            });
        } else {
            set({
                status: 'error',
                error: result.errors ? result.errors.join('\n') : 'Unknown parsing error'
            });
        }
    },

    reset: () => set({
        graph: null,
        nodes: [],
        edges: [],
        title: 'Untitled',
        status: 'idle',
        error: null
    })
}));
