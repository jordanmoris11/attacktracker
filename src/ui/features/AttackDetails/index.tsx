import React from 'react';
import { createPortal } from 'react-dom';
import { X, Info, Terminal, Shield, FileText } from 'lucide-react';
import { useScenarioStore, type DetailsPanelTab } from '../../../core/store/useScenarioStore';
import { OverviewTab } from './OverviewTab';
import { CommandsTab } from './CommandsTab';
import { MitreTab } from './MitreTab';
import { DescriptionTab } from './DescriptionTab';

const TABS: { id: DetailsPanelTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'commands', label: 'Commands', icon: Terminal },
    { id: 'mitre', label: 'MITRE', icon: Shield },
    { id: 'description', label: 'Details', icon: FileText },
];

/**
 * AttackDetailsPanel
 * Floating panel that displays rich attack context information
 */
export const AttackDetailsPanel: React.FC = () => {
    const {
        scenario,
        extractedMetadata,
        detailsPanelOpen,
        detailsPanelTab,
        toggleDetailsPanel,
        setDetailsPanelTab,
    } = useScenarioStore();

    // Don't render if no scenario loaded
    if (!scenario) return null;

    // Collapsed state: Just a floating button
    if (!detailsPanelOpen) {
        return (
            <button
                onClick={toggleDetailsPanel}
                className="fixed bottom-20 right-4 z-40 p-3 bg-slate-800 hover:bg-slate-700 rounded-full shadow-lg border border-white/10 transition-all hover:scale-105 group"
                title="Attack Details"
            >
                <Info size={20} className="text-brand-blue group-hover:text-white transition-colors" />
            </button>
        );
    }

    // Expanded state: Full panel
    return createPortal(
        <div className="fixed bottom-4 right-4 z-40 w-[420px] max-h-[75vh] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <Info size={16} className="text-brand-blue" />
                    <h3 className="font-semibold text-white text-sm">Attack Details</h3>
                </div>
                <button
                    onClick={toggleDetailsPanel}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Close panel"
                >
                    <X size={16} className="text-slate-400 hover:text-white" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-slate-800/30">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setDetailsPanelTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
                            detailsPanelTab === tab.id
                                ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon size={14} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {detailsPanelTab === 'overview' && (
                    <OverviewTab metadata={extractedMetadata} scenario={scenario} />
                )}
                {detailsPanelTab === 'commands' && (
                    <CommandsTab metadata={extractedMetadata} />
                )}
                {detailsPanelTab === 'mitre' && (
                    <MitreTab metadata={extractedMetadata} steps={scenario.steps} />
                )}
                {detailsPanelTab === 'description' && (
                    <DescriptionTab metadata={extractedMetadata} />
                )}
            </div>
        </div>,
        document.body
    );
};

export default AttackDetailsPanel;
