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
    const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
    const [searchQuery, setSearchQuery] = useState('');

    // Use new Scenario Store
    const { timeline, currentStep, status } = useScenarioStore();

    if (status !== 'success' || timeline.length === 0) return null;

    // 1. Identify Active Techniques (Scenario & Current Step)
    const activeInScenario = new Set(timeline.map(s => s.mitre?.id).filter(Boolean) as string[]);
    const activeInStep = timeline[currentStep]?.mitre?.id;

    // 2. Determine Base Set of Techniques to Display
    const sourceKeys = viewMode === 'all'
        ? Object.keys(MITRE_INDEX)
        : Array.from(activeInScenario);

    // 3. Filter & Group
    const tacticGroups: Record<string, string[]> = {};
    const query = searchQuery.toLowerCase();

    sourceKeys.forEach(code => {
        // Filter by Search
        const tech = MITRE_INDEX[code];
        if (!tech) return;

        if (query) {
            const matchId = code.toLowerCase().includes(query);
            const matchName = tech.name.toLowerCase().includes(query);
            if (!matchId && !matchName) return;
        }

        // Group by Tactic
        tech.tactics.forEach(tactic => {
            if (!tacticGroups[tactic]) tacticGroups[tactic] = [];
            tacticGroups[tactic].push(code);
        });
    });

    // Tactic Order (Kill Chain)
    const orderedTactics = Object.keys(TACTIC_SLUGS);

    return (
        <div className={clsx(
            "absolute top-4 right-4 h-[calc(100vh-80px)] pointer-events-auto transition-all duration-300 ease-in-out z-20 flex",
            isOpen ? "w-80" : "w-10"
        )}>

            {/* Toggle Handle */}
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
                <div className="p-4 border-b border-white/10 space-y-3 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Layers size={18} className="text-brand-purple" />
                        <h2 className="font-bold text-slate-100 text-sm">ATT&CK MATRIX</h2>
                        <span className="ml-auto text-xs bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full">
                            {viewMode === 'all' ? Object.keys(MITRE_INDEX).length : activeInScenario.size}
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="space-y-2">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search T-Code or Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-purple focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Toggle */}
                        <div className="flex bg-slate-900/50 rounded p-1 border border-white/5">
                            <button
                                onClick={() => setViewMode('active')}
                                className={clsx(
                                    "flex-1 text-[10px] font-bold py-1 rounded transition-colors",
                                    viewMode === 'active' ? "bg-brand-purple text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                ACTIVE ({activeInScenario.size})
                            </button>
                            <button
                                onClick={() => setViewMode('all')}
                                className={clsx(
                                    "flex-1 text-[10px] font-bold py-1 rounded transition-colors",
                                    viewMode === 'all' ? "bg-brand-purple text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                ALL ({Object.keys(MITRE_INDEX).length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {sourceKeys.length === 0 ? (
                        <div className="text-center text-slate-500 text-xs py-10 opacity-60">
                            No techniques found.
                        </div>
                    ) : (
                        orderedTactics.map(slug => {
                            const techs = tacticGroups[slug];
                            if (!techs || techs.length === 0) return null;

                            return (
                                <div key={slug} className="space-y-2">
                                    <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 bg-[#0f172a] py-1 z-10 border-b border-white/5">
                                        {TACTIC_SLUGS[slug]}
                                    </h3>
                                    <div className="space-y-1">
                                        {techs.map(code => {
                                            const t = MITRE_INDEX[code];
                                            const isStepActive = code === activeInStep;
                                            const isScenarioActive = activeInScenario.has(code);

                                            // Tri-State Styles
                                            let containerStyle = "bg-slate-800/20 border-white/5 opacity-50"; // Default (Inactive)
                                            let textStyle = "text-slate-500";

                                            if (isScenarioActive) {
                                                containerStyle = "bg-slate-800/80 border-white/20 hover:border-brand-purple/50 opacity-100"; // Scenario Active
                                                textStyle = "text-slate-300 group-hover:text-white";
                                            }

                                            if (isStepActive) {
                                                containerStyle = "bg-brand-purple/20 animate-glow-pulse border border-brand-purple scale-105 opacity-100 z-10"; // Persisting Pulse
                                                textStyle = "text-white";
                                            }

                                            return (
                                                <div
                                                    key={code}
                                                    className={clsx(
                                                        "flex items-center gap-2 text-xs p-2 rounded border transition-all duration-300 cursor-help group",
                                                        containerStyle
                                                    )}
                                                    title={`${code}: ${t.name}`}
                                                >
                                                    <span className={clsx(
                                                        "font-mono font-bold transition-colors",
                                                        isStepActive ? "text-white" : (isScenarioActive ? "text-brand-purple" : "text-slate-600")
                                                    )}>
                                                        {code}
                                                    </span>
                                                    <span className={clsx(
                                                        "truncate transition-colors",
                                                        textStyle
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

            {/* Collapsed State Icon */}
            {!isOpen && (
                <div className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center bg-slate-800 rounded border border-white/10 shadow-xl">
                    <Layers size={18} className="text-slate-400" />
                </div>
            )}

        </div>
    );
};
