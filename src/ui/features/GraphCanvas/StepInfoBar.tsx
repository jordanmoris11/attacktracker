/**
 * StepInfoBar.tsx
 *
 * Persistent info bar at the bottom of the graph showing current step details.
 * Uses same styling as EdgeTooltip for visual consistency.
 * Movable (drag from header) and resizable (drag from corner).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';
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
const DETAILS_PANEL_MARGIN = 16;

// Default dimensions
const DEFAULT_WIDTH = 450;
const DEFAULT_HEIGHT = 'auto';
const MIN_WIDTH = 300;
const MIN_HEIGHT = 150;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 500;

export const StepInfoBar: React.FC<StepInfoBarProps> = ({ step, stepIndex, totalSteps, mitreColor }) => {
    const detailsPanelOpen = useScenarioStore(state => state.detailsPanelOpen);
    const containerRef = useRef<HTMLDivElement>(null);

    // Position state (null means use default centered position)
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT as number | 'auto' });

    // Drag state
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });
    const initialSize = useRef({ width: 0, height: 0 });

    // Reset position when step changes to 0
    useEffect(() => {
        if (stepIndex === 0) {
            setPosition(null);
        }
    }, [stepIndex]);

    // Handle drag start
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };

        if (position) {
            initialPos.current = { x: position.x, y: position.y };
        } else if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            initialPos.current = { x: rect.left, y: rect.top };
        }

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }, [position]);

    // Handle drag move
    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;

        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;

        setPosition({
            x: initialPos.current.x + deltaX,
            y: initialPos.current.y + deltaY
        });
    }, []);

    // Handle drag end
    const handleDragEnd = useCallback(() => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
    }, [handleDragMove]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            initialSize.current = { width: rect.width, height: rect.height };

            // If we don't have a position yet, set it based on current rect
            if (!position) {
                setPosition({ x: rect.left, y: rect.top });
                initialPos.current = { x: rect.left, y: rect.top };
            }
        }

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }, [position]);

    // Handle resize move
    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;

        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;

        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, initialSize.current.width + deltaX));
        const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, initialSize.current.height + deltaY));

        setSize({ width: newWidth, height: newHeight });
    }, []);

    // Handle resize end
    const handleResizeEnd = useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

    // Don't show if no step or at step 0 (initial state)
    if (!step || stepIndex === 0) return null;

    const borderColor = mitreColor || '#fbbf24';

    // Calculate default centered position offset
    const rightOffset = detailsPanelOpen ? (DETAILS_PANEL_WIDTH + DETAILS_PANEL_MARGIN) / 2 : 0;

    // Build style based on whether we have a custom position
    const containerStyle: React.CSSProperties = position
        ? {
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'none',
            borderColor: borderColor,
            boxShadow: `0 0 15px ${borderColor}4d`,
            width: size.width,
            height: size.height === 'auto' ? 'auto' : size.height,
            minHeight: MIN_HEIGHT,
        }
        : {
            borderColor: borderColor,
            boxShadow: `0 0 15px ${borderColor}4d`,
            transform: `translateX(calc(-50% - ${rightOffset}px))`,
            width: size.width,
        };

    const positionClasses = position
        ? 'z-50'
        : 'absolute bottom-20 left-1/2 z-40';

    return (
        <div
            ref={containerRef}
            className={`${positionClasses} flex flex-col rounded-lg backdrop-blur-md bg-slate-900/95 border transition-shadow duration-300 ease-out overflow-hidden`}
            style={containerStyle}
        >
            {/* Drag Handle Header */}
            <div
                className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-white/10 cursor-move select-none"
                onMouseDown={handleDragStart}
            >
                <div className="flex items-center gap-2">
                    <GripHorizontal size={14} className="text-slate-500" />
                    <span className="font-mono text-white font-bold uppercase tracking-wide text-sm">
                        {stepIndex}. {step.name}
                    </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                    {stepIndex}/{totalSteps}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
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

            {/* Resize Handle (bottom-right corner) */}
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
                onMouseDown={handleResizeStart}
            >
                <svg
                    className="w-full h-full text-slate-600 group-hover:text-slate-400 transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                >
                    <path d="M14 14H10V12H12V10H14V14Z" />
                    <path d="M14 8H12V6H14V8Z" />
                    <path d="M8 14V12H6V14H8Z" />
                </svg>
            </div>
        </div>
    );
};
