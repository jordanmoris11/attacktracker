import React from 'react';
import { Shield, Upload, Download, Settings } from 'lucide-react';
import { useScenarioStore } from '../../core/store/useScenarioStore';

/**
 * Top Header Bar (Spec 6)
 * Glassmorphic strip at the top.
 */
export const Header: React.FC = () => {
    const { scenario } = useScenarioStore();
    const title = scenario?.title;

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

            {/* Center: Graph Title */}
            <div className="hidden md:block">
                <div className="px-4 py-1 rounded-full bg-white/5 border border-white/5 text-sm font-medium text-slate-200 font-mono">
                    {title}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="Import JSON/Mermaid">
                    <Upload size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="Export Image">
                    <Download size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="Settings">
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
};
