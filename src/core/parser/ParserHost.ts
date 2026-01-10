import { AttackGraphSchema } from '../../shared/schemas/graph.schema';
import type { AttackGraph } from '../../shared/schemas/graph.schema';
import { LegacyMermaidAdapter } from './LegacyMermaidAdapter';
import { z } from 'zod';

export interface ParserResult {
    success: boolean;
    data?: AttackGraph;
    errors?: string[];
    metadata: {
        format: 'json' | 'mermaid';
        parseTimeMs: number;
        nodeCount: number;
        edgeCount: number;
    }
}

/**
 * Spec 3: Parser Host
 * Coordinator for parsing and validating input.
 */
export class ParserHost {
    private mermaidAdapter = new LegacyMermaidAdapter();

    public async parse(content: string): Promise<ParserResult> {
        const start = performance.now();
        let format: 'json' | 'mermaid' = 'json';
        let rawObj: any;

        try {
            // 1. Detection Strategy
            const trimmed = content.trim();
            if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart') || trimmed.startsWith('subgraph')) {
                format = 'mermaid';
                rawObj = this.mermaidAdapter.parse(content);
            } else {
                // Try JSON
                try {
                    rawObj = JSON.parse(content);
                } catch (e) {
                    // If JSON fails and it looks vaguely text-like, maybe it's malformed mermaid?
                    // For now, strict failure.
                    throw new Error("Invalid JSON format.");
                }
            }

            // 2. Validation (Spec 1 w/ Zod)
            // This is the CRITICAL security gate.
            const parsed = AttackGraphSchema.safeParse(rawObj);

            if (!parsed.success) {
                // Transform Zod errors to readable strings
                const errors = parsed.error.errors.map(e =>
                    `[${e.path.join('.')}] ${e.message}`
                );
                return {
                    success: false,
                    errors,
                    metadata: { format, parseTimeMs: performance.now() - start, nodeCount: 0, edgeCount: 0 }
                };
            }

            return {
                success: true,
                data: parsed.data,
                metadata: {
                    format,
                    parseTimeMs: performance.now() - start,
                    nodeCount: parsed.data.nodes.length,
                    edgeCount: parsed.data.edges.length
                }
            };

        } catch (e: any) {
            return {
                success: false,
                errors: [e.message || "Unknown Parsing Error"],
                metadata: { format, parseTimeMs: performance.now() - start, nodeCount: 0, edgeCount: 0 }
            };
        }
    }
}

export const parserHost = new ParserHost();
