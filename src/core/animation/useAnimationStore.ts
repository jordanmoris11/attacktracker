import { create } from 'zustand';

interface AnimationState {
    currentStep: number;
    totalSteps: number;
    isPlaying: boolean;
    speed: number; // ms per step

    // Actions
    setTotalSteps: (steps: number) => void;
    play: () => void;
    pause: () => void;
    nextStep: () => void;
    prevStep: () => void;
    reset: () => void;
    setStep: (step: number) => void;
}

export const useAnimationStore = create<AnimationState>((set, get) => ({
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    speed: 1000,

    setTotalSteps: (steps) => set({ totalSteps: steps }),

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),

    nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps) {
            set({ currentStep: currentStep + 1 });
        } else {
            set({ isPlaying: false }); // Stop at end
        }
    },

    prevStep: () => {
        const { currentStep } = get();
        // User clarified: MUST be able to go back to Step 0 (Clean Start / Empty)
        if (currentStep > 0) {
            set({ currentStep: currentStep - 1 });
        }
    },

    setStep: (step) => set({ currentStep: step }),

    reset: () => set({ currentStep: 0, isPlaying: false })
}));
