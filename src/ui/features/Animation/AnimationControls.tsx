import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { useAnimationStore } from '../../../core/animation/useAnimationStore';
import { useGraphStore } from '../../../core/store/useGraphStore';

/**
 * Spec 7: Animation Controls
 * Floating glass panel for controlling graph playback.
 */
export const AnimationControls: React.FC = () => {
    const {
        currentStep, totalSteps, isPlaying,
        play, pause, nextStep, prevStep, reset, setTotalSteps
    } = useAnimationStore();

    const { edges } = useGraphStore();

    // Sync Total Steps when graph changes
    useEffect(() => {
        if (edges.length > 0) {
            // Find max step defined in edges
            const maxStep = Math.max(...edges.map(e => e.step || 0), 0);

            // Fallback: If no explicit steps, use edge count as sequence
            const calculatedTotal = maxStep > 0 ? maxStep : edges.length;

            setTotalSteps(calculatedTotal);
        } else {
            setTotalSteps(0);
        }
    }, [edges, setTotalSteps]);

    // Animation Loop
    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            interval = setInterval(() => {
                nextStep();
            }, 1000); // 1 sec per step for now
        }
        return () => clearInterval(interval);
    }, [isPlaying, nextStep]);

    if (totalSteps === 0) return null; // Hide if no animation steps

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-3 flex items-center gap-6 text-slate-200 shadow-2xl scale-110 origin-bottom">

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
                <button onClick={reset} className="p-2 hover:text-white hover:bg-white/10 rounded transition" title="Reset">
                    <RefreshCw size={16} />
                </button>
                <button onClick={prevStep} className="p-2 hover:text-white hover:bg-white/10 rounded transition">
                    <SkipBack size={18} />
                </button>

                <button
                    onClick={isPlaying ? pause : play}
                    className="w-10 h-10 flex items-center justify-center bg-brand-blue hover:bg-brand-blue/90 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>

                <button onClick={nextStep} className="p-2 hover:text-white hover:bg-white/10 rounded transition">
                    <SkipForward size={18} />
                </button>
            </div>

            {/* Scrubber / Status */}
            <div className="flex flex-col min-w-[120px]">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>STEP {currentStep}</span>
                    <span>{totalSteps}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-brand-blue transition-all duration-300 ease-out"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

        </div>
    );
};
