import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import cytoscape from 'cytoscape';
import { X, FileText, Image, FileJson, Loader2, CheckCircle, AlertCircle, Crop, Maximize2 } from 'lucide-react';
import { useScenarioStore } from '../../../core/store/useScenarioStore';
import { exportScenarioToPDF } from '../../../core/export/PDFExporter';
import { SelectionOverlay, type SelectionBounds } from './SelectionOverlay';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ExportFormat = 'pdf' | 'png' | 'json';
type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';
type RegionMode = 'full' | 'selection';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [regionMode, setRegionMode] = useState<RegionMode>('full');
    const [status, setStatus] = useState<ExportStatus>('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
    const [error, setError] = useState<string | null>(null);
    const [isSelectingRegion, setIsSelectingRegion] = useState(false);

    // PDF-specific options
    const [includeCover, setIncludeCover] = useState(true);
    const [includeOverview, setIncludeOverview] = useState(true);
    const [includeCommands, setIncludeCommands] = useState(true);

    const { scenario, cyInstance, exportSelection, setExportSelection, graphContainerRef, extractedMetadata } = useScenarioStore();

    // Create a ref object that points to the graphContainerRef
    const containerRefObject = useRef<HTMLDivElement | null>(null);
    containerRefObject.current = graphContainerRef;

    const handleStartSelection = () => {
        setIsSelectingRegion(true);
    };

    const handleSelectionComplete = (bounds: SelectionBounds | null) => {
        setIsSelectingRegion(false);
        if (bounds) {
            setExportSelection(bounds);
            setRegionMode('selection');
        }
    };

    const handleSelectionCancel = () => {
        setIsSelectingRegion(false);
    };

    // Don't render anything if modal is closed and not selecting
    if (!isOpen && !isSelectingRegion) return null;

    const handleClearSelection = () => {
        setExportSelection(null);
        setRegionMode('full');
    };

    const handleExport = async () => {
        if (!scenario || !cyInstance) {
            setError('No scenario loaded');
            return;
        }

        setStatus('exporting');
        setError(null);

        try {
            // Get the selection bounds to use
            const selectionToUse = regionMode === 'selection' ? exportSelection : null;

            switch (selectedFormat) {
                case 'pdf':
                    await exportScenarioToPDF(
                        scenario,
                        cyInstance,
                        {
                            coverPage: includeCover,
                            includeCLI: true,
                            includeTooltips: true,
                            includeOverviewPage: includeOverview,
                            includeCommandsPage: includeCommands,
                            selectionBounds: selectionToUse
                        },
                        (current, total, message) => {
                            setProgress({ current, total, message });
                        },
                        extractedMetadata || undefined
                    );
                    break;

                case 'png':
                    // Apply clean export styles (remove glow/blur)
                    applyCleanExportStyles(cyInstance);

                    if (selectionToUse && graphContainerRef) {
                        // For selection, capture and crop manually
                        const croppedBlob = await cropCanvasToSelection(
                            cyInstance,
                            selectionToUse,
                            graphContainerRef
                        );
                        downloadBlob(croppedBlob, `${scenario.title.replace(/[^a-z0-9]/gi, '_')}.png`);
                    } else {
                        const pngData = cyInstance.png({
                            output: 'blob',
                            bg: '#0f172a',
                            scale: 2,
                            full: false,
                        });
                        downloadBlob(pngData, `${scenario.title.replace(/[^a-z0-9]/gi, '_')}.png`);
                    }

                    // Restore interactive styles
                    restoreInteractiveStyles(cyInstance);
                    break;

                case 'json':
                    const jsonBlob = new Blob(
                        [JSON.stringify(scenario, null, 2)],
                        { type: 'application/json' }
                    );
                    downloadBlob(jsonBlob, `${scenario.title.replace(/[^a-z0-9]/gi, '_')}.json`);
                    break;
            }

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                onClose();
            }, 1500);

        } catch (err) {
            console.error('Export failed:', err);
            setError(err instanceof Error ? err.message : 'Export failed');
            setStatus('error');
        }
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatOptions = [
        {
            id: 'pdf' as const,
            icon: FileText,
            title: 'PDF Carousel',
            description: 'LinkedIn-optimized, one step per page',
            recommended: true,
        },
        {
            id: 'png' as const,
            icon: Image,
            title: 'PNG Image',
            description: 'Current view as high-res image',
            recommended: false,
        },
        {
            id: 'json' as const,
            icon: FileJson,
            title: 'JSON Data',
            description: 'Raw scenario data for backup',
            recommended: false,
        },
    ];

    return (
        <>
            {/* Selection Overlay - rendered alongside modal */}
            {isSelectingRegion && (
                <SelectionOverlay
                    isActive={true}
                    onComplete={handleSelectionComplete}
                    onCancel={handleSelectionCancel}
                    containerRef={containerRefObject}
                />
            )}

            {/* Main Modal - hidden during selection */}
            {!isSelectingRegion && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">Export Scenario</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Region Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                            Export Region
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setRegionMode('full'); setExportSelection(null); }}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                    regionMode === 'full'
                                        ? 'border-brand-blue bg-brand-blue/10 text-white'
                                        : 'border-white/10 hover:border-white/20 text-slate-400 hover:text-white'
                                }`}
                            >
                                <Maximize2 size={18} />
                                <span className="text-sm font-medium">Full Canvas</span>
                            </button>
                            <button
                                onClick={handleStartSelection}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                    regionMode === 'selection' && exportSelection
                                        ? 'border-brand-blue bg-brand-blue/10 text-white'
                                        : 'border-white/10 hover:border-white/20 text-slate-400 hover:text-white'
                                }`}
                            >
                                <Crop size={18} />
                                <span className="text-sm font-medium">
                                    {exportSelection ? 'Reselect' : 'Select Region'}
                                </span>
                            </button>
                        </div>

                        {/* Selection confirmed indicator */}
                        {exportSelection && regionMode === 'selection' && (
                            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle size={18} className="text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-400">Region Selected</p>
                                    <p className="text-xs text-slate-400 font-mono">
                                        {Math.round(exportSelection.width)} x {Math.round(exportSelection.height)} px
                                    </p>
                                </div>
                                <button
                                    onClick={handleClearSelection}
                                    className="text-xs text-slate-400 hover:text-white px-2 py-1 hover:bg-white/10 rounded"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Format Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                            Export Format
                        </label>
                        <div className="space-y-2">
                            {formatOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedFormat(option.id)}
                                    disabled={status === 'exporting'}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                        selectedFormat === option.id
                                            ? 'border-brand-blue bg-brand-blue/10'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    } ${status === 'exporting' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`p-2 rounded-lg ${
                                        selectedFormat === option.id
                                            ? 'bg-brand-blue/20 text-brand-blue'
                                            : 'bg-white/5 text-slate-400'
                                    }`}>
                                        <option.icon size={20} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">
                                                {option.title}
                                            </span>
                                            {option.recommended && (
                                                <span className="text-[10px] font-bold bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded-full">
                                                    RECOMMENDED
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {option.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PDF Options (only when PDF selected) */}
                    {selectedFormat === 'pdf' && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                PDF Pages
                            </label>
                            <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={includeCover}
                                        onChange={(e) => setIncludeCover(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-brand-blue focus:ring-brand-blue/50 bg-slate-700"
                                    />
                                    <div>
                                        <span className="text-sm text-white group-hover:text-brand-blue transition-colors">Cover Page</span>
                                        <p className="text-xs text-slate-500">Title card with overview graph</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={includeOverview}
                                        onChange={(e) => setIncludeOverview(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-brand-blue focus:ring-brand-blue/50 bg-slate-700"
                                    />
                                    <div>
                                        <span className="text-sm text-white group-hover:text-brand-blue transition-colors">Attack Overview</span>
                                        <p className="text-xs text-slate-500">Description, prerequisites, gains, MITRE</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={includeCommands}
                                        onChange={(e) => setIncludeCommands(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-brand-blue focus:ring-brand-blue/50 bg-slate-700"
                                    />
                                    <div>
                                        <span className="text-sm text-white group-hover:text-brand-blue transition-colors">Commands Reference</span>
                                        <p className="text-xs text-slate-500">Copy-paste ready CLI commands</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Progress */}
                    {status === 'exporting' && (
                        <div className="space-y-2 p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Loader2 size={16} className="animate-spin text-brand-blue" />
                                <span>{progress.message || 'Preparing export...'}</span>
                            </div>
                            {progress.total > 0 && (
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-blue transition-all duration-300"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                            <CheckCircle size={18} />
                            <span className="text-sm">Export complete! Check your downloads.</span>
                        </div>
                    )}

                    {/* Error */}
                    {status === 'error' && error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-white/5">
                    <button
                        onClick={onClose}
                        disabled={status === 'exporting'}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={status === 'exporting' || !scenario}
                        className="px-4 py-2 text-sm font-medium bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {status === 'exporting' ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            'Export'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
            )}
        </>
    );
};

/**
 * Apply clean styles for export (remove glow/blur effects)
 */
function applyCleanExportStyles(cy: cytoscape.Core): void {
    cy.edges().forEach(edge => {
        edge.data('_exportBackup', {
            'text-outline-width': edge.style('text-outline-width'),
            'text-outline-opacity': edge.style('text-outline-opacity'),
            'underlay-opacity': edge.style('underlay-opacity'),
        });

        edge.style({
            'text-outline-width': 0,
            'text-outline-opacity': 0,
            'underlay-opacity': 0,
            'text-background-opacity': 1,
            'text-background-color': '#0f172a',
            'text-background-padding': '4px',
        });
    });
}

/**
 * Restore interactive styles after export
 */
function restoreInteractiveStyles(cy: cytoscape.Core): void {
    cy.edges().forEach(edge => {
        const backup = edge.data('_exportBackup');
        if (backup) {
            edge.style({
                'text-outline-width': backup['text-outline-width'],
                'text-outline-opacity': backup['text-outline-opacity'],
                'underlay-opacity': backup['underlay-opacity'],
            });
            edge.removeData('_exportBackup');
        }
    });
}

/**
 * Crop the canvas to the selected region
 */
async function cropCanvasToSelection(
    cy: cytoscape.Core,
    selection: SelectionBounds,
    container: HTMLDivElement
): Promise<Blob> {
    // Get the full canvas as base64
    const fullPng = cy.png({
        output: 'base64',
        bg: '#0f172a',
        scale: 2,
        full: false,
    });

    // Create an image from the full capture
    const img = new window.Image();
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = fullPng;
    });

    // Get container bounds to calculate the crop region relative to the canvas
    const containerRect = container.getBoundingClientRect();
    const scale = 2; // Match the export scale

    // Calculate crop coordinates (scaled)
    const cropX = selection.x * scale;
    const cropY = selection.y * scale;
    const cropWidth = selection.width * scale;
    const cropHeight = selection.height * scale;

    // Create a canvas for the cropped region
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d')!;

    // Draw the cropped region
    ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,  // Source
        0, 0, cropWidth, cropHeight            // Destination
    );

    // Convert to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
        }, 'image/png', 1.0);
    });
}
