import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, RotateCcw, Maximize2 } from 'lucide-react';

export interface SelectionBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface SelectionOverlayProps {
    isActive: boolean;
    onComplete: (bounds: SelectionBounds | null) => void;
    onCancel: () => void;
    containerRef: React.RefObject<HTMLElement>;
}

/**
 * SelectionOverlay
 * Allows user to draw a rectangle on the canvas to select export region.
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
    isActive,
    onComplete,
    onCancel,
    containerRef
}) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
    const [selection, setSelection] = useState<SelectionBounds | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Get container bounds
    const getContainerBounds = useCallback(() => {
        if (!containerRef.current) return null;
        return containerRef.current.getBoundingClientRect();
    }, [containerRef]);

    // Convert page coords to container-relative coords
    const toRelativeCoords = useCallback((pageX: number, pageY: number) => {
        const bounds = getContainerBounds();
        if (!bounds) return { x: 0, y: 0 };
        return {
            x: pageX - bounds.left,
            y: pageY - bounds.top
        };
    }, [getContainerBounds]);

    // Calculate selection rectangle from two points
    const calculateBounds = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }): SelectionBounds => {
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);
        return { x, y, width, height };
    }, []);

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only

        const coords = toRelativeCoords(e.clientX, e.clientY);
        setStartPoint(coords);
        setCurrentPoint(coords);
        setIsDrawing(true);
        setSelection(null);
    }, [toRelativeCoords]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDrawing || !startPoint) return;

        const coords = toRelativeCoords(e.clientX, e.clientY);
        setCurrentPoint(coords);
    }, [isDrawing, startPoint, toRelativeCoords]);

    const handleMouseUp = useCallback(() => {
        if (!isDrawing || !startPoint || !currentPoint) return;

        const bounds = calculateBounds(startPoint, currentPoint);

        // Minimum size check (at least 50x50)
        if (bounds.width >= 50 && bounds.height >= 50) {
            setSelection(bounds);
        }

        setIsDrawing(false);
    }, [isDrawing, startPoint, currentPoint, calculateBounds]);

    // Confirm selection
    const handleConfirm = useCallback(() => {
        onComplete(selection);
    }, [selection, onComplete]);

    // Select full canvas
    const handleSelectAll = useCallback(() => {
        const bounds = getContainerBounds();
        if (bounds) {
            const fullSelection: SelectionBounds = {
                x: 0,
                y: 0,
                width: bounds.width,
                height: bounds.height
            };
            setSelection(fullSelection);
        }
    }, [getContainerBounds]);

    // Reset selection
    const handleReset = useCallback(() => {
        setSelection(null);
        setStartPoint(null);
        setCurrentPoint(null);
    }, []);

    // Get current drawing bounds (during drag)
    const drawingBounds = isDrawing && startPoint && currentPoint
        ? calculateBounds(startPoint, currentPoint)
        : null;

    // Active bounds (either drawing or finalized selection)
    const activeBounds = drawingBounds || selection;

    if (!isActive) return null;

    const containerBounds = getContainerBounds();
    if (!containerBounds) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed z-[9998] cursor-crosshair"
            style={{
                left: containerBounds.left,
                top: containerBounds.top,
                width: containerBounds.width,
                height: containerBounds.height,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Darkened overlay with cutout */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="selection-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {activeBounds && (
                            <rect
                                x={activeBounds.x}
                                y={activeBounds.y}
                                width={activeBounds.width}
                                height={activeBounds.height}
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>

                {/* Dark overlay */}
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.6)"
                    mask="url(#selection-mask)"
                />

                {/* Selection border */}
                {activeBounds && (
                    <rect
                        x={activeBounds.x}
                        y={activeBounds.y}
                        width={activeBounds.width}
                        height={activeBounds.height}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray={isDrawing ? "5,5" : "none"}
                    />
                )}
            </svg>

            {/* Instructions */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 pointer-events-none">
                <p className="text-sm text-white font-medium">
                    {!selection && !isDrawing && "Click and drag to select export region"}
                    {isDrawing && "Release to confirm selection"}
                    {selection && !isDrawing && "Region selected! Confirm or adjust."}
                </p>
            </div>

            {/* Dimension badge */}
            {activeBounds && activeBounds.width > 0 && (
                <div
                    className="absolute bg-brand-blue text-white text-xs font-mono px-2 py-1 rounded pointer-events-none"
                    style={{
                        left: activeBounds.x + activeBounds.width / 2,
                        top: activeBounds.y + activeBounds.height + 8,
                        transform: 'translateX(-50%)'
                    }}
                >
                    {Math.round(activeBounds.width)} x {Math.round(activeBounds.height)}
                </div>
            )}

            {/* Control buttons */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg border border-white/10 transition-colors"
                    title="Select entire canvas"
                >
                    <Maximize2 size={16} />
                    Full Canvas
                </button>

                <button
                    onClick={handleReset}
                    disabled={!selection}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reset selection"
                >
                    <RotateCcw size={16} />
                    Reset
                </button>

                <div className="w-px h-8 bg-white/20 mx-1" />

                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-white/10 transition-colors"
                >
                    <X size={16} />
                    Cancel
                </button>

                <button
                    onClick={handleConfirm}
                    disabled={!selection}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Check size={16} />
                    Confirm
                </button>
            </div>
        </div>,
        document.body
    );
};
