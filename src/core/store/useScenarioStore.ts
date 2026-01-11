import { create } from 'zustand';
import { scenarioAdapter } from '../parser/ScenarioAdapter';
import type { ScenarioData, TimelineStep, VisibilityMap } from '../../shared/schemas/scenario.schema';

interface ScenarioState {
    // Data
    scenario: ScenarioData | null;
    cyElements: any[]; // Nodes only (Edges are ephemeral per step)

    // Derived Lookups (Optimization)
    timeline: TimelineStep[];
    visibility: VisibilityMap | null;

    // Meta
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    activeTitle: string;
    sourcePath?: string; // New: Track file path for persistence

    // Playback State
    currentStep: number;
    isPlaying: boolean;

    // Actions
    loadScenario: (content: string, path?: string) => Promise<void>;
    updateEntityPosition: (id: string, x: number, y: number) => void;
    updateViewport: (zoom: number, pan: { x: number, y: number }) => void;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    togglePlay: () => void;
    reset: () => void;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
    scenario: null,
    cyElements: [],
    timeline: [],
    visibility: null,
    status: 'idle',
    error: null,
    activeTitle: 'Untitled',

    currentStep: 0,
    isPlaying: false,


    loadScenario: async (content: string, path?: string) => {
        set({ status: 'loading', error: null, sourcePath: path }); // Store path


        // Artificial delay
        await new Promise(r => setTimeout(r, 200));

        const result = scenarioAdapter.parse(content);

        if (result.success && result.data) {
            set({
                status: 'success',
                scenario: result.data,
                cyElements: result.cyElements || [],
                timeline: result.data.steps,
                visibility: result.data.visibility || null,
                activeTitle: result.data.title,
                currentStep: 0, // Reset to start
                isPlaying: false
            });
        } else {
            set({
                status: 'error',
                error: result.errors ? result.errors.join('\n') : 'Unknown parsing error'
            });
        }
    },

    setStep: (step: number) => {
        const { timeline } = get();
        // Constrain
        // New Logic: 0 = Initial (Empty), 1..N = Steps
        const max = timeline.length;

        const safeStep = Math.max(0, Math.min(step, max));
        set({ currentStep: safeStep });
    },

    nextStep: () => {
        const { currentStep, timeline } = get();
        if (currentStep < timeline.length) {
            set({ currentStep: currentStep + 1 });
        } else {
            set({ isPlaying: false }); // Stop at end
        }
    },

    prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
            set({ currentStep: currentStep - 1 });
        }
    },

    togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),

    reset: () => set({
        scenario: null,
        cyElements: [],
        timeline: [],
        status: 'idle',
        error: null,
        currentStep: 0,
        sourcePath: undefined
    }),

    updateEntityPosition: (id, x, y) => {
        set(state => {
            if (!state.scenario) return state;
            const newEntities = state.scenario.entities.map(e =>
                e.id === id ? { ...e, position: { x, y } } : e
            );
            return {
                scenario: { ...state.scenario, entities: newEntities }
            };
        });
    },

    updateViewport: (zoom, pan) => {
        set(state => {
            if (!state.scenario) return state;
            return {
                scenario: {
                    ...state.scenario,
                    viewport: { zoom, pan }
                }
            };
        });
    }
}));
