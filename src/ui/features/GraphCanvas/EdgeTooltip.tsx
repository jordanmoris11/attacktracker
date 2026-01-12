import React from 'react';

export interface TooltipData {
    x: number;
    y: number;
    label: string;       // The action name (e.g., "Exfiltrate to C2")
    description?: string; // The detailed tooltip text
    cli?: string;        // Command line instruction e.g. "nmap -sT ..."
    mitre?: {
        id: string;        // T1041
        technique: string; // Exfiltration Over C2 Channel
        tactic: string;    // Exfiltration
        color?: string;     // The tactic color (for border/glow)
    };
}

export const EdgeTooltip: React.FC<{ data: TooltipData | null }> = ({ data }) => {
    if (!data) return null;

    const { x, y, label, description, cli, mitre } = data;
    const borderColor = mitre?.color || '#fbbf24'; // Default amber if undefined

    // Inline style for dynamic border color to avoid complex Tailwind safelisting
    const containerStyle = {
        borderColor: borderColor,
        boxShadow: `0 0 15px ${borderColor}4d` // 30% opacity
    };

    return (
        <div
            className="absolute z-50 pointer-events-none flex flex-col gap-3 p-4 rounded-lg backdrop-blur-md bg-slate-900/95 border transition-all duration-200 ease-out"
            style={{
                left: x + 20, // Offset to not cover cursor
                top: y + 20,
                maxWidth: '400px', // Slightly wider for code
                ...containerStyle
            }}
        >
            {/* Header */}
            <div className="flex flex-col">
                <span className="font-mono text-white font-bold uppercase tracking-wide text-sm">
                    {label}
                </span>
            </div>

            {/* CLI Command (Primary Focus if present) */}
            {cli && (
                <div className="bg-black/60 rounded p-2 border border-slate-700 font-mono text-xs text-green-400 break-all leading-tight shadow-inner">
                    <span className="text-slate-500 select-none">$ </span>{cli}
                </div>
            )}

            {/* Description (Secondary Context) */}
            {description && (
                <p className="text-slate-300 text-xs leading-relaxed">
                    {description}
                </p>
            )}

            {/* Footer / MITRE Badge */}
            {mitre && (
                <div
                    className="flex items-center gap-2 mt-1"
                >
                    <div
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded w-fit bg-black/50 border border-white/10"
                        style={{ color: borderColor }}
                    >
                        {mitre.id}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate uppercase tracking-wide">
                        {mitre.technique}
                    </span>
                </div>
            )}
        </div>
    );
};
