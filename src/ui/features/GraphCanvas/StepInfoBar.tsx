/**
 * StepInfoBar.tsx
 *
 * Persistent info bar at the bottom of the graph showing current step details.
 * Uses same styling as EdgeTooltip for visual consistency.
 * Responsive to AttackDetailsPanel - shifts left when panel is open.
 */

import React from 'react';
import { useScenarioStore } from '../../../core/store/useScenarioStore';
import type { EdgeStep } from '../../../shared/schemas/scenario.schema';

interface StepInfoBarProps {
    step: EdgeStep | null;
    stepIndex: number;
    totalSteps: number;
    mitreColor?: string;
}

// AttackDetailsPanel width when open
const DETAILS_PANEL_WIDTH = 420;
const DETAILS_PANEL_MARGIN = 16; // right-4 = 16px

export const StepInfoBar: React.FC<StepInfoBarProps> = ({ step, stepIndex, totalSteps, mitreColor }) => {
    const detailsPanelOpen = useScenarioStore(state => state.detailsPanelOpen);

    // Don't show if no step or at step 0 (initial state)
    if (!step || stepIndex === 0) return null;

    const borderColor = mitreColor || '#fbbf24'; // Default amber

    // Calculate right offset to center in available space (excluding panel when open)
    const rightOffset = detailsPanelOpen ? (DETAILS_PANEL_WIDTH + DETAILS_PANEL_MARGIN) / 2 : 0;

    const containerStyle = {
        borderColor: borderColor,
        boxShadow: `0 0 15px ${borderColor}4d`, // 30% opacity glow
        // Shift left by half the panel width when open to stay centered in visible area
        transform: `translateX(calc(-50% - ${rightOffset}px))`,
    };

    return (
        <div
            className="absolute bottom-20 left-1/2 z-40 flex flex-col gap-3 p-4 rounded-lg backdrop-blur-md bg-slate-900/95 border transition-all duration-300 ease-out"
            style={{
                minWidth: '400px',
                maxWidth: '600px',
                ...containerStyle
            }}
        >
            {/* Header with Step Number */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-white font-bold uppercase tracking-wide text-sm">
                    {stepIndex}. {step.name}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                    {stepIndex}/{totalSteps}
                </span>
            </div>

            {/* CLI Command */}
            {step.cli && (
                <div className="bg-black/60 rounded p-2 border border-slate-700 font-mono text-xs text-green-400 break-all leading-tight shadow-inner">
                    <span className="text-slate-500 select-none">$ </span>{step.cli}
                </div>
            )}

            {/* Description/Tooltip */}
            {step.tooltip && (
                <p className="text-slate-300 text-sm leading-relaxed">
                    {step.tooltip}
                </p>
            )}

            {/* MITRE Badge */}
            {step.mitre && (
                <div className="flex items-center gap-2">
                    <div
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded w-fit bg-black/50 border border-white/10"
                        style={{ color: borderColor }}
                    >
                        {step.mitre.id}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate uppercase tracking-wide">
                        {step.mitre.technique}
                    </span>
                </div>
            )}
        </div>
    );
};
