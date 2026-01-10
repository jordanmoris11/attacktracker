
import type {
    AttackGraph,
    GraphNode,
    GraphEdge,
    EntityType,
    BoundaryType,
    EdgeType
} from '../../shared/schemas/graph.schema';
import { enrichEdge } from '../mitre/enrichment';
import { v4 as uuidv4 } from 'uuid';

/**
 * Spec 3: Legacy Mermaid Adapter
 * Parses text input (Mermaid Flowchart) -> AttackGraph JSON
 */
export class LegacyMermaidAdapter {

    /**
     * Main Parse Entry Point
     */
    public parse(content: string): AttackGraph {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const containerStack: string[] = []; // Track active subgraph parent

        // Normalize line endings
        const lines = content.split(/\r?\n/);

        let stepCounter = 1;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) {
                continue;
            }

            // 1. Handle Subgraphs (Containers)
            if (trimmed.startsWith('subgraph')) {
                const container = this.parseSubgraph(trimmed);
                nodes.push(container);
                containerStack.push(container.id);
                continue;
            }

            if (trimmed === 'end') {
                containerStack.pop();
                continue;
            }

            // 2. Handle Nodes (if line defines a node specifically)
            // Matches: id[label] or id([label]) or id[(label)]
            // Regex simplified for readability, catching the broad pattern
            const nodeMatch = trimmed.match(/^([\w_]+)\s*(\[|\(\[|\[\(|\{\{)(.*?)(\]|\)\]|\)\]|\}\})$/);

            // Note: Edge lines might also contain node defs like A[Label] --> B. 
            // We process explicit node lines first, but edges need to handle inline logic too.
            // For this implementation, we assume a simpler line-by-line approach where
            // lines are EITHER node defs OR edge defs, OR we extract nodes from edges.

            if (nodeMatch) {
                const id = nodeMatch[1];
                const shapeStart = nodeMatch[2];
                const label = nodeMatch[3].replace(/["']/g, ""); // Clean quotes

                const node = this.createNode(id, label, containerStack.at(-1));

                // If node already exists (maybe from an edge reference), update it
                const existingIdx = nodes.findIndex(n => n.id === node.id);
                if (existingIdx !== -1) {
                    nodes[existingIdx] = { ...nodes[existingIdx], ...node };
                } else {
                    nodes.push(node);
                }
                continue;
            }

            // 3. Handle Edges
            // A --> B
            // A -.->|Label| B
            const edgeMatch = trimmed.match(/^([\w_]+)\s*(-{1,2}|={1,2}|\.{1,2})(?:\s*\|([^|]+)\|)?\s*(-{1,2}>|={1,2}>|\.{1,2}>)\s*([\w_]+)$/);

            if (edgeMatch) {
                const sourceId = edgeMatch[1];
                // arrowBody = edgeMatch[2]; (unused directly, implied by arrowHead)
                const label = edgeMatch[3] ? edgeMatch[3].trim() : '';
                const arrowHead = edgeMatch[4]; // -->, -.->, ==>
                const targetId = edgeMatch[5];

                // Ensure nodes exist (basic implicit creation if not defined yet)
                if (!nodes.find(n => n.id === sourceId)) nodes.push(this.createNode(sourceId, sourceId, containerStack.at(-1)));
                if (!nodes.find(n => n.id === targetId)) nodes.push(this.createNode(targetId, targetId, containerStack.at(-1)));

                // Determine Type
                let type: EdgeType = 'normal';
                if (arrowHead.includes('.')) type = 'illegal'; // -.->
                if (arrowHead.includes('=')) type = 'impact';  // ==>

                const edge: GraphEdge = {
                    id: `e-${uuidv4().slice(0, 8)}`,
                    source: sourceId,
                    target: targetId,
                    label: label,
                    type: type,
                    step: stepCounter++
                };

                // Apply Spec 8: MITRE Enrichment
                enrichEdge(edge);

                edges.push(edge);
            }
        }

        return {
            title: 'Imported Legacy Graph',
            version: '2.0',
            nodes,
            edges
        };
    }

    // --- Helpers ---

    private parseSubgraph(line: string): GraphNode {
        // subgraph id["Label"]
        const match = line.match(/subgraph\s+([\w_]+)(?:\s*\["([^"]+)"\])?/);
        const id = match ? match[1] : `container_${uuidv4().slice(0, 4)}`;
        const label = match && match[2] ? match[2] : id;

        // Spec 10: Inferred Boundary Type
        let boundary: BoundaryType = 'network'; // Default
        const lowerLabel = label.toLowerCase();

        if (lowerLabel.includes('processed') || lowerLabel.includes('protected') || lowerLabel.includes('lsa')) boundary = 'protected';
        else if (lowerLabel.includes('kernel') || lowerLabel.includes('ring0')) boundary = 'kernel';
        else if (lowerLabel.includes('machine') || lowerLabel.includes('host') || lowerLabel.includes('box')) boundary = 'machine';
        else if (lowerLabel.includes('container') || lowerLabel.includes('docker')) boundary = 'container';

        return {
            id,
            label,
            type: 'container',
            state: 'normal',
            metadata: { boundary }
        };
    }

    private createNode(id: string, label: string, parentId?: string): GraphNode {
        // Spec 1 / 3: Inferred Entity Type
        let type: EntityType = 'device'; // Default
        const lowerId = id.toLowerCase();

        if (lowerId.startsWith('proc_')) type = 'process';
        else if (lowerId.startsWith('svc_')) type = 'service';
        else if (lowerId.startsWith('mem_')) type = 'data'; // Memory is data
        else if (lowerId.startsWith('cred_')) type = 'credential';
        else if (lowerId.startsWith('file_')) type = 'data';
        else if (lowerId.startsWith('attacker') || lowerId.startsWith('user')) type = 'actor';
        else if (lowerId.includes('container')) type = 'container';

        return {
            id,
            label,
            type,
            parent: parentId,
            state: 'normal',
            // Auto-detect icon from ID keywords if needed (Spec 5), 
            // but strictly we just pass the ID as icon logic handles fallback.
            icon: id.split('_')[0] // heuristic: 'kali_vm' -> 'kali'
        };
    }
}
