import React, { useMemo } from 'react';
import { Shield, ExternalLink } from 'lucide-react';
import { MITRE_INDEX } from '../../../shared/config/mitre-index';
import type { ExtractedMetadata, TimelineStep } from '../../../shared/schemas/scenario.schema';

interface MitreTabProps {
    metadata: ExtractedMetadata | null;
    steps: TimelineStep[];
}

interface MitreEntry {
    id: string;
    technique: string;
    tactic: string;
    color: string;
    stepCount: number;
    stepNumbers: number[];
}

export const MitreTab: React.FC<MitreTabProps> = ({ metadata, steps }) => {
    // Build MITRE entries from steps with deduplication and counting
    const mitreEntries = useMemo(() => {
        const entriesMap = new Map<string, MitreEntry>();

        steps.forEach((step, idx) => {
            if (step.mitre?.id) {
                const id = step.mitre.id;
                const existing = entriesMap.get(id);

                if (existing) {
                    existing.stepCount++;
                    existing.stepNumbers.push(idx + 1);
                } else {
                    const mitreInfo = MITRE_INDEX[id];
                    entriesMap.set(id, {
                        id,
                        technique: step.mitre.technique || mitreInfo?.name || 'Unknown',
                        tactic: step.mitre.tactic || mitreInfo?.tactic || 'Unknown',
                        color: mitreInfo?.color || '#fbbf24',
                        stepCount: 1,
                        stepNumbers: [idx + 1],
                    });
                }
            }
        });

        return Array.from(entriesMap.values());
    }, [steps]);

    // Group by tactic
    const groupedByTactic = useMemo(() => {
        const groups = new Map<string, MitreEntry[]>();

        mitreEntries.forEach(entry => {
            const tactic = entry.tactic;
            if (!groups.has(tactic)) {
                groups.set(tactic, []);
            }
            groups.get(tactic)!.push(entry);
        });

        return groups;
    }, [mitreEntries]);

    const openMitreLink = (id: string) => {
        // Convert T1234.001 to format for ATT&CK URL
        const baseId = id.replace('.', '/');
        window.open(`https://attack.mitre.org/techniques/${baseId}/`, '_blank');
    };

    if (mitreEntries.length === 0) {
        return (
            <div className="text-center py-8">
                <Shield size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                    No MITRE ATT&CK mappings.
                </p>
                <p className="text-xs text-slate-600 mt-1">
                    Add mitre data to your scenario steps.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total Techniques</span>
                    <span className="text-lg font-bold text-white">{mitreEntries.length}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">Tactics Covered</span>
                    <span className="text-lg font-bold text-white">{groupedByTactic.size}</span>
                </div>
            </div>

            {/* Grouped techniques */}
            <div className="space-y-4">
                {Array.from(groupedByTactic.entries()).map(([tactic, entries]) => (
                    <div key={tactic}>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            {tactic}
                        </h4>
                        <div className="space-y-2">
                            {entries.map(entry => (
                                <button
                                    key={entry.id}
                                    onClick={() => openMitreLink(entry.id)}
                                    className="w-full text-left bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 border border-transparent hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded"
                                                    style={{
                                                        backgroundColor: `${entry.color}20`,
                                                        color: entry.color,
                                                    }}
                                                >
                                                    {entry.id}
                                                </span>
                                                <ExternalLink
                                                    size={12}
                                                    className="text-slate-600 group-hover:text-brand-blue transition-colors flex-shrink-0"
                                                />
                                            </div>
                                            <p className="text-sm text-white mt-1 truncate">
                                                {entry.technique}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-xs text-slate-500">
                                                {entry.stepCount === 1 ? 'Step' : 'Steps'}
                                            </span>
                                            <p className="text-xs text-slate-400 font-mono">
                                                {entry.stepNumbers.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer hint */}
            <p className="text-[10px] text-slate-600 text-center">
                Click a technique to view on MITRE ATT&CK
            </p>
        </div>
    );
};
