import React, { useMemo, useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { highlightCommands } from '../../../shared/utils/highlightCommands';
import type { ExtractedMetadata } from '../../../shared/schemas/scenario.schema';

interface CommandsTabProps {
    metadata: ExtractedMetadata | null;
}

export const CommandsTab: React.FC<CommandsTabProps> = ({ metadata }) => {
    const [copied, setCopied] = useState(false);

    const commands = metadata?.commandsBlock || '';
    const hasCommands = commands.trim().length > 0;

    // Memoize highlighted HTML to avoid re-computation
    const highlightedHtml = useMemo(() => {
        if (!hasCommands) return '';
        return highlightCommands(commands);
    }, [commands, hasCommands]);

    const handleCopy = async () => {
        if (!hasCommands) return;

        try {
            await navigator.clipboard.writeText(commands);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!hasCommands) {
        return (
            <div className="text-center py-8">
                <Terminal size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                    No commands available.
                </p>
                <p className="text-xs text-slate-600 mt-1">
                    Add CLI commands to your scenario steps.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header with copy button */}
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Terminal size={12} />
                    Command Reference
                </h4>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
                    title="Copy all commands"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy all</span>
                        </>
                    )}
                </button>
            </div>

            {/* Commands block */}
            <div className="bg-black/60 rounded-lg border border-slate-700 overflow-hidden">
                <pre
                    className="p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
            </div>

            {/* Hint */}
            <p className="text-[10px] text-slate-600 text-center">
                Syntax highlighted • Click "Copy all" to copy commands
            </p>
        </div>
    );
};
