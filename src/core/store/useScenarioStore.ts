import { create } from 'zustand';
import cytoscape from 'cytoscape';
import { scenarioAdapter } from '../parser/ScenarioAdapter';
import type { ScenarioData, TimelineStep, VisibilityMap, ExtractedMetadata, EdgeStep } from '../../shared/schemas/scenario.schema';

// Export selection bounds type
export interface ExportSelectionBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Details panel tab type
export type DetailsPanelTab = 'overview' | 'commands' | 'mitre' | 'description';

interface ScenarioState {
    // Data
    scenario: ScenarioData | null;
    cyElements: any[]; // Nodes only (Edges are ephemeral per step)

    // Derived Lookups (Optimization)
    timeline: TimelineStep[];
    visibility: VisibilityMap | null;

    // Extended Metadata (extracted with fallbacks)
    extractedMetadata: ExtractedMetadata | null;

    // Meta
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    activeTitle: string;
    sourcePath?: string; // Track file path for persistence

    // Playback State
    currentStep: number;
    isPlaying: boolean;

    // Cytoscape Instance (for export)
    cyInstance: cytoscape.Core | null;

    // Export Selection
    exportSelection: ExportSelectionBounds | null;
    graphContainerRef: HTMLDivElement | null;

    // Attack Details Panel State
    detailsPanelOpen: boolean;
    detailsPanelTab: DetailsPanelTab;

    // Actions
    loadScenario: (content: string, path?: string) => Promise<void>;
    updateEntityPosition: (id: string, x: number, y: number) => void;
    updateViewport: (zoom: number, pan: { x: number, y: number }) => void;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    togglePlay: () => void;
    reset: () => void;
    setCyInstance: (cy: cytoscape.Core | null) => void;
    setExportSelection: (bounds: ExportSelectionBounds | null) => void;
    setGraphContainerRef: (ref: HTMLDivElement | null) => void;
    toggleDetailsPanel: () => void;
    setDetailsPanelTab: (tab: DetailsPanelTab) => void;
}

/**
 * Extract metadata from scenario with fallbacks for backwards compatibility
 */
function extractMetadataFromScenario(scenario: ScenarioData): ExtractedMetadata {
    // Build commands from steps if not provided
    const buildCommandsFromSteps = (steps: TimelineStep[]): string => {
        return steps
            .filter((s): s is EdgeStep => s.type === 'edge' && !!s.cli)
            .map((s, i) => `# Step ${i + 1}: ${s.name}\n$ ${s.cli}`)
            .join('\n\n');
    };

    // Extract unique MITRE IDs from steps
    const extractMitreFromSteps = (steps: TimelineStep[]): string[] => {
        const ids = steps
            .map(s => s.mitre?.id)
            .filter((id): id is string => !!id);
        return [...new Set(ids)];
    };

    return {
        shortDescription: scenario.shortDescription || scenario.description || '',
        tags: scenario.tags || [],
        descriptionHtml: scenario.metadata?.descriptionHtml || null,
        commandsBlock: scenario.metadata?.commandsBlock || buildCommandsFromSteps(scenario.steps),
        extraInfo: scenario.metadata?.extraInfo || [],
        prerequisites: scenario.metadata?.prerequisites || [],
        attackerGains: scenario.metadata?.attackerGains || [],
        detectionNotes: scenario.metadata?.detectionNotes || [],
        mitreCategories: scenario.metadata?.mitreCategories || extractMitreFromSteps(scenario.steps),
    };
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
    scenario: null,
    cyElements: [],
    timeline: [],
    visibility: null,
    extractedMetadata: null,
    status: 'idle',
    error: null,
    activeTitle: 'Untitled',

    currentStep: 0,
    isPlaying: false,
    cyInstance: null,
    exportSelection: null,
    graphContainerRef: null,

    // Details panel state
    detailsPanelOpen: false,
    detailsPanelTab: 'overview',

    loadScenario: async (content: string, path?: string) => {
        set({ status: 'loading', error: null, sourcePath: path }); // Store path


        // Artificial delay
        await new Promise(r => setTimeout(r, 200));

        const result = scenarioAdapter.parse(content);

        if (result.success && result.data) {
            // Extract metadata with fallbacks
            const extractedMetadata = extractMetadataFromScenario(result.data);

            set({
                status: 'success',
                scenario: result.data,
                cyElements: result.cyElements || [],
                timeline: result.data.steps,
                visibility: result.data.visibility || null,
                extractedMetadata,
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
        extractedMetadata: null,
        status: 'idle',
        error: null,
        currentStep: 0,
        sourcePath: undefined,
        cyInstance: null,
        exportSelection: null,
        detailsPanelOpen: false,
        detailsPanelTab: 'overview'
    }),

    setCyInstance: (cy) => set({ cyInstance: cy }),

    setExportSelection: (bounds) => set({ exportSelection: bounds }),

    setGraphContainerRef: (ref) => set({ graphContainerRef: ref }),

    toggleDetailsPanel: () => set(state => ({ detailsPanelOpen: !state.detailsPanelOpen })),

    setDetailsPanelTab: (tab) => set({ detailsPanelTab: tab }),

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
