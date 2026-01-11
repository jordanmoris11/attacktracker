import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { useScenarioStore } from '../../../core/store/useScenarioStore';
import { MITRE_INDEX, TACTIC_SLUGS } from '../../../shared/config/mitre-index';
import clsx from 'clsx';

/**
 * Spec 8: Matrix Explorer
 * Side Overlay displaying active MITRE Tactics found in the graph.
 */
export const MatrixExplorer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);

    // Use new Scenario Store
    const { timeline, currentStep, status } = useScenarioStore();

    if (status !== 'success' || timeline.length === 0) return null;

    // 1. Enrich & Group
    // Collect all unique T-Codes from ALL steps
    const allTechniqueIDs = Array.from(new Set(timeline.map(s => s.mitre?.id).filter(Boolean))) as string[];

    // Tactic -> Techniques[]
    const tacticGroups: Record<string, string[]> = {};

    allTechniqueIDs.forEach(code => {
        const tech = MITRE_INDEX[code];
        if (tech) {
            tech.tactics.forEach(tactic => {
                if (!tacticGroups[tactic]) tacticGroups[tactic] = [];
                tacticGroups[tactic].push(code);
            });
        }
    });

    // Tactic Order (Kill Chain)
    const orderedTactics = Object.keys(TACTIC_SLUGS);

    // 2. Determine Active Tech (Current Step)
    const activeStep = timeline[currentStep];
    const currentActiveTech = activeStep?.mitre?.id;

    return (
        <div className={clsx(
            "absolute top-4 right-4 h-[calc(100vh-80px)] pointer-events-auto transition-all duration-300 ease-in-out z-20 flex",
            isOpen ? "w-80" : "w-10"
        )}>

            {/* Toggle Handle (Left Side of panel when Right Aligned) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -left-3 top-2 bg-slate-700 text-slate-300 p-1 rounded-full border border-slate-600 shadow-md hover:bg-slate-600 z-30"
            >
                {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* The Panel */}
            <div className={clsx(
                "h-full w-full glass-panel overflow-hidden flex flex-col transition-opacity",
                !isOpen && "opacity-0 pointer-events-none"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
                    <Layers size={18} className="text-brand-purple" />
                    <h2 className="font-bold text-slate-100 text-sm">ATT&CK MATRIX</h2>
                    <span className="ml-auto text-xs bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full">
                        {allTechniqueIDs.length}
                    </span>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {allTechniqueIDs.length === 0 ? (
                        <div className="text-center text-slate-500 text-xs py-10 opacity-60">
                            No MITRE T-Codes detected.<br />
                            Try adding edges with keywords like <br />
                            <code className="text-brand-blue">"mimikatz"</code> or <code className="text-brand-blue">"T1003"</code>.
                        </div>
                    ) : (
                        orderedTactics.map(slug => {
                            const techs = tacticGroups[slug];
                            if (!techs) return null;

                            return (
                                <div key={slug} className="space-y-2">
                                    <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                        {TACTIC_SLUGS[slug]}
                                    </h3>
                                    <div className="space-y-1">
                                        {techs.map(code => {
                                            const t = MITRE_INDEX[code];
                                            const isActive = code === currentActiveTech;
                                            return (
                                                <div
                                                    key={code}
                                                    className={clsx(
                                                        "flex items-center gap-2 text-xs p-2 rounded border transition-all duration-300 cursor-help group",
                                                        isActive
                                                            ? "bg-brand-purple/20 border-brand-purple shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105"
                                                            : "bg-slate-800/50 border-white/5 hover:border-brand-purple/50"
                                                    )}
                                                    title={`${code}: ${t.name}`}
                                                >
                                                    <span className={clsx(
                                                        "font-mono font-bold transition-colors",
                                                        isActive ? "text-white" : "text-brand-purple group-hover:text-white"
                                                    )}>
                                                        {code}
                                                    </span>
                                                    <span className={clsx(
                                                        "truncate transition-colors",
                                                        isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                                                    )}>
                                                        {t.name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Collapsed State Icon (When Closed) */}
            {!isOpen && (
                <div className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center bg-slate-800 rounded border border-white/10 shadow-xl">
                    <Layers size={18} className="text-slate-400" />
                </div>
            )}

        </div>
    );
};
