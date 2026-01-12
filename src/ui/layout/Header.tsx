import React, { useState } from 'react';
import { Shield, Upload, Download, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '../../core/store/useScenarioStore';
import { ExportModal } from '../features/Export/ExportModal';
import { getTagColor, getTagBgColor, getTagBorderColor } from '../../shared/config/tag-colors';

/**
 * Top Header Bar (Spec 6)
 * Glassmorphic strip at the top.
 */
export const Header: React.FC = () => {
    const navigate = useNavigate();
    const { scenario, extractedMetadata } = useScenarioStore();
    const title = scenario?.title;
    const tags = extractedMetadata?.tags || [];

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    return (
        <header className="h-16 flex-none border-b border-white/10 bg-background-secondary/80 backdrop-blur-md flex items-center px-6 justify-between z-20 relative">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-brand-blue/20 flex items-center justify-center text-brand-blue">
                    <Shield size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-slate-100 text-sm tracking-wide">ATTACKVIEWER <span className="text-brand-blue">CYTO</span></h1>
                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">v3-2026 @m@d$res</p>
                </div>
            </div>

            {/* Center: Graph Title + Tags */}
            <div className="hidden md:flex items-center gap-3 max-w-[50%]">
                <div className="px-4 py-1 rounded-full bg-white/5 border border-white/5 text-sm font-medium text-slate-200 font-mono flex-shrink-0">
                    {title}
                </div>

                {/* Tag Chips (horizontal scroll on overflow) */}
                {tags.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                        {tags.slice(0, 5).map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap flex-shrink-0"
                                style={{
                                    backgroundColor: getTagBgColor(tag),
                                    color: getTagColor(tag),
                                    border: `1px solid ${getTagBorderColor(tag)}`,
                                }}
                            >
                                {tag.replace(/_/g, ' ')}
                            </span>
                        ))}
                        {tags.length > 5 && (
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                +{tags.length - 5} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigate('/file')}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    title="Import JSON/Mermaid"
                >
                    <Upload size={18} />
                </button>
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    title="Export PDF/Image"
                >
                    <Download size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    title="Settings"
                >
                    <Settings size={18} />
                </button>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </header>
    );
};
