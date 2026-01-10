/* =============================================================================
   CYTOSCAPE ADAPTER
   Converts ParsedDiagram -> Cytoscape Elements JSON
   ============================================================================= */

import { ICON_CONFIG } from '../config/constants.js';
import { iconDetector } from './IconDetector.js';

export class CytoscapeAdapter {

    /**
     * Convert parsed mermaid data to Cytoscape elements
     * @param {Object} parsed - ParsedDiagram object from MermaidParser
     * @returns {Array} Cytoscape elements array
     */
    toElements(data) {
        // Detect input type: JSON Schema vs Legacy ParsedDiagram
        if (data.nodes && Array.isArray(data.nodes) && !data.subgraphs) {
            return this.#convertJsonSchema(data);
        }
        return this.#convertLegacyParsed(data);
    }

    #convertJsonSchema(json) {
        const elements = [];

        // Nodes
        json.nodes.forEach(node => {
            elements.push({
                group: 'nodes',
                data: {
                    id: node.id,
                    label: node.label,
                    parent: node.parent,
                    iconInfo: node.icon || node.type, // Map 'icon' field or fallback to type
                    iconPath: this.#getIconPath(node.icon || node.type),
                    type: node.type,
                    state: node.state || 'normal'
                },
                classes: [
                    node.type === 'container' ? 'cluster' : 'beautified-node',
                    node.state ? `state-${node.state}` : ''
                ]
            });
        });

        // Edges
        json.edges.forEach((edge, index) => {
            elements.push({
                group: 'edges',
                data: {
                    id: `e${index}`,
                    source: edge.source,
                    target: edge.target,
                    label: edge.label,
                    mitre: edge.mitre,
                    type: edge.type || 'normal'
                },
                classes: [
                    'beautified-edge',
                    `type-${edge.type || 'normal'}`
                ]
            });
        });

        return elements;
    }

    #convertLegacyParsed(parsed) {
        const elements = [];

        // 0. Build Child->Parent Map
        const nodeParentMap = new Map();

        parsed.subgraphs.forEach(sub => {
            if (sub.nodeIds) {
                sub.nodeIds.forEach(nodeId => {
                    nodeParentMap.set(nodeId, sub.id);
                });
            }
        });

        // 1. Convert Subgraphs (Parent Nodes)
        parsed.subgraphs.forEach(sub => {
            elements.push({
                group: 'nodes',
                data: {
                    id: sub.id,
                    label: sub.label || sub.id,
                    type: 'cluster',
                    boundaryType: sub.boundaryType
                },
                classes: ['cluster']
            });
        });

        // 2. Convert Nodes
        parsed.nodes.forEach(node => {
            const cyNode = {
                group: 'nodes',
                data: {
                    id: node.id,
                    label: node.label || node.id,
                    parent: nodeParentMap.get(node.id) || undefined,
                    iconInfo: node.detectedType, // e.g. 'attacker', 'server'
                    iconPath: this.#getIconPath(node.detectedType)
                },
                classes: ['beautified-node']
            };
            elements.push(cyNode);
        });

        // 3. Convert Edges
        parsed.edges.forEach((edge, index) => {
            elements.push({
                group: 'edges',
                data: {
                    id: edge.id || `e${index}`,
                    source: edge.sourceId,
                    target: edge.targetId,
                    label: edge.label || ''
                },
                classes: ['beautified-edge']
            });
        });

        return elements;
    }

    #getIconPath(type) {
        // Direct mapping to assets based on type
        // Ideally should use IconLoader, but Cytoscape usually wants a URL for background-image
        // We assume assets are served at /assets/icons/
        const meta = iconDetector.getMetadata(type);
        return `assets/icons/${meta.file}`;
    }
}
