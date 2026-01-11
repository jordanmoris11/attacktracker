
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface XYPosition {
    x: number;
    y: number;
}

export interface ViewportState {
    zoom: number;
    pan: XYPosition;
}

export interface GraphLayoutData {
    positions: Record<string, XYPosition>;
    viewport?: ViewportState;
}

interface LayoutState {
    // Map<GraphID, Data>
    layouts: Record<string, GraphLayoutData>;

    saveNodePosition: (graphId: string, nodeId: string, position: XYPosition) => void;
    saveViewport: (graphId: string, zoom: number, pan: XYPosition) => void;
    getGraphLayout: (graphId: string) => GraphLayoutData | null;
    clearLayout: (graphId: string) => void;
}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set, get) => ({
            layouts: {},

            saveNodePosition: (graphId, nodeId, position) => {
                set((state) => {
                    const currentGraph = state.layouts[graphId] || { positions: {} };
                    return {
                        layouts: {
                            ...state.layouts,
                            [graphId]: {
                                ...currentGraph,
                                positions: {
                                    ...currentGraph.positions,
                                    [nodeId]: position
                                }
                            }
                        }
                    };
                });
            },

            saveViewport: (graphId, zoom, pan) => {
                set((state) => {
                    const currentGraph = state.layouts[graphId] || { positions: {} };
                    return {
                        layouts: {
                            ...state.layouts,
                            [graphId]: {
                                ...currentGraph,
                                viewport: { zoom, pan }
                            }
                        }
                    };
                });
            },

            getGraphLayout: (graphId) => {
                return get().layouts[graphId] || null;
            },

            clearLayout: (graphId) => {
                set((state) => {
                    const newLayouts = { ...state.layouts };
                    delete newLayouts[graphId];
                    return { layouts: newLayouts };
                });
            }
        }),
        {
            name: 'cyberviewer-layout-storage', // key in localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
