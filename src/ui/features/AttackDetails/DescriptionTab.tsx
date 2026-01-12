import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import type { ExtractedMetadata } from '../../../shared/schemas/scenario.schema';

interface DescriptionTabProps {
    metadata: ExtractedMetadata | null;
}

/**
 * Simple HTML sanitizer (basic XSS protection)
 * For production, consider using DOMPurify
 */
function sanitizeHtml(dirty: string): string {
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = dirty;

    // Remove potentially dangerous elements
    const dangerous = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
    dangerous.forEach(tag => {
        const elements = temp.getElementsByTagName(tag);
        while (elements.length > 0) {
            elements[0].parentNode?.removeChild(elements[0]);
        }
    });

    // Remove event handlers from all elements
    const allElements = temp.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        const attrs = el.attributes;
        for (let j = attrs.length - 1; j >= 0; j--) {
            const attrName = attrs[j].name.toLowerCase();
            if (attrName.startsWith('on') || attrName === 'href' && attrs[j].value.startsWith('javascript:')) {
                el.removeAttribute(attrs[j].name);
            }
        }
    }

    return temp.innerHTML;
}

export const DescriptionTab: React.FC<DescriptionTabProps> = ({ metadata }) => {
    const hasDescription = metadata?.descriptionHtml && metadata.descriptionHtml.trim().length > 0;

    // Sanitize HTML content
    const sanitizedHtml = useMemo(() => {
        if (!hasDescription) return '';
        return sanitizeHtml(metadata!.descriptionHtml!);
    }, [metadata, hasDescription]);

    if (!hasDescription) {
        return (
            <div className="text-center py-8">
                <FileText size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                    No detailed description available.
                </p>
                <p className="text-xs text-slate-600 mt-1">
                    Add descriptionHtml to your scenario metadata.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={12} />
                Full Description
            </h4>

            {/* Rendered HTML content with custom styling */}
            <div
                className="prose prose-sm prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                    prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-h4:text-xs
                    prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:text-slate-300 prose-em:italic
                    prose-code:text-red-400 prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-black/50 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-lg
                    prose-ul:my-2 prose-ol:my-2
                    prose-li:text-slate-300 prose-li:my-0.5
                    prose-a:text-brand-blue prose-a:no-underline hover:prose-a:underline
                    [&_span]:text-inherit"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />

            {/* Hint */}
            <p className="text-[10px] text-slate-600 text-center pt-2 border-t border-white/5">
                HTML content from LLM description output
            </p>
        </div>
    );
};
