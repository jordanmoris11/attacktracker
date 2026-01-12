import React from 'react';
import { Tag, Target, AlertTriangle, Eye, Layers, Link } from 'lucide-react';
import { getTagColor, getTagBgColor, getTagBorderColor } from '../../../shared/config/tag-colors';
import type { ExtractedMetadata, ScenarioData } from '../../../shared/schemas/scenario.schema';

interface OverviewTabProps {
    metadata: ExtractedMetadata | null;
    scenario: ScenarioData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ metadata, scenario }) => {
    // Calculate stats
    const stepCount = scenario.steps.filter(s => s.type === 'edge').length;
    const entityCount = scenario.entities.length;
    const mitreCount = metadata?.mitreCategories.length || 0;

    return (
        <div className="space-y-5">
            {/* Short Description */}
            {metadata?.shortDescription && (
                <div className="p-3 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
                    <p className="text-sm text-white font-medium leading-relaxed">
                        {metadata.shortDescription}
                    </p>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Layers size={16} className="text-brand-blue mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{stepCount}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Steps</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Target size={16} className="text-amber-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{entityCount}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Entities</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <AlertTriangle size={16} className="text-red-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{mitreCount}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">MITRE</p>
                </div>
            </div>

            {/* Tags */}
            {metadata && metadata.tags.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Tag size={12} />
                        Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                        {metadata.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-xs font-medium rounded-full transition-transform hover:scale-105"
                                style={{
                                    backgroundColor: getTagBgColor(tag),
                                    color: getTagColor(tag),
                                    border: `1px solid ${getTagBorderColor(tag)}`,
                                }}
                            >
                                {tag.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Prerequisites */}
            {metadata && metadata.prerequisites.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Target size={12} />
                        Prerequisites
                    </h4>
                    <ul className="space-y-1.5">
                        {metadata.prerequisites.map((p, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                <span>{p}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Attacker Gains */}
            {metadata && metadata.attackerGains.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Attacker Gains
                    </h4>
                    <ul className="space-y-1.5">
                        {metadata.attackerGains.map((g, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">→</span>
                                <span>{g}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Detection Notes */}
            {metadata && metadata.detectionNotes.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Eye size={12} />
                        Detection / OPSEC
                    </h4>
                    <ul className="space-y-1.5">
                        {metadata.detectionNotes.map((d, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5 flex-shrink-0">!</span>
                                <span>{d}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Extra Info (GitHub repos, CVE links, tools) */}
            {metadata && metadata.extraInfo.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Link size={12} />
                        Extra Info
                    </h4>
                    <ul className="space-y-1.5">
                        {metadata.extraInfo.map((info, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>
                                <span>{info}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Empty state */}
            {(!metadata || (
                !metadata.shortDescription &&
                metadata.tags.length === 0 &&
                metadata.prerequisites.length === 0 &&
                metadata.attackerGains.length === 0
            )) && (
                <div className="text-center py-8">
                    <Info size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                        No extended metadata available.
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                        Add metadata to your scenario JSON for richer context.
                    </p>
                </div>
            )}
        </div>
    );
};
