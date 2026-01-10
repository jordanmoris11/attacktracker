# Spec 02: Mermaid Parser

**Status:** Draft
**Priority:** P0 (Core)
**Dependencies:** 01-icon-system.md

---

## 1. Overview

### 1.1 Description

The Parser module extracts structured data from Mermaid diagram source code. It transforms raw text into a `ParsedDiagram` object containing nodes, edges, and metadata that downstream systems use for rendering and animation.

### 1.2 Goals

- Parse both flowchart and sequence diagram syntax
- Extract node IDs, labels, and relationships
- Preserve source line numbers for debugging
- Determine edge ordering for animation sequence
- Detect tool references in labels

### 1.3 Non-Goals

- Full Mermaid syntax validation (Mermaid.js handles this)
- Parsing diagram types other than flowchart/sequence
- Modifying the source code

---

## 2. Files Involved

| File | Purpose |
|------|---------|
| `js/core/MermaidParser.js` | Main parser class |
| `js/workers/parser.worker.js` | Web Worker wrapper for non-blocking parsing |
| `js/diagrams/FlowchartStrategy.js` | Flowchart-specific parsing |
| `js/diagrams/SequenceStrategy.js` | Sequence-specific parsing |

---

## 3. Data Structures

### 3.1 ParsedDiagram

```typescript
interface ParsedDiagram {
  type: 'flowchart' | 'sequence';
  direction?: 'LR' | 'RL' | 'TB' | 'BT';  // Flowchart only

  nodes: ParsedNode[];
  edges: ParsedEdge[];
  subgraphs?: ParsedSubgraph[];  // Flowchart only

  metadata: {
    sourceCode: string;
    lineCount: number;
    parseTime: number;  // ms
  };
}
```

### 3.2 ParsedNode

```typescript
interface ParsedNode {
  id: string;               // Unique identifier (e.g., "victim_ws")
  label: string;            // Raw label with HTML (e.g., "Victim<br>Windows")
  labelText: string;        // Plain text label (e.g., "Victim Windows")
  shape: 'rect' | 'round' | 'diamond' | 'circle' | 'stadium';
  rawDefinition: string;    // Original line from source
  lineNumber: number;

  // Computed by IconDetector
  detectedType: string;
  iconFile: string;
  iconColor: string;
}
```

### 3.3 ParsedEdge

```typescript
interface ParsedEdge {
  id: string;               // Generated: "edge_{sourceId}_{targetId}_{index}"
  sourceId: string;
  targetId: string;
  label: string;            // Edge label (e.g., "1. Phishing Email")
  arrowType: 'arrow' | 'open' | 'dotted' | 'thick';
  rawDefinition: string;
  lineNumber: number;

  // Computed
  sequenceNumber: number;   // Animation order (1, 2, 3...)
  hasToolReference: boolean;
  toolName: string | null;  // Extracted tool name
  edgeStyleType: string;    // e.g., 'infection', 'lateral', 'c2'
}
```

### 3.4 ParsedSubgraph (Flowchart only)

```typescript
interface ParsedSubgraph {
  id: string;
  label: string;
  nodeIds: string[];
  lineNumber: number;
}
```

---

## 4. Parser Implementation

### 4.1 Main Parser Class

```javascript
// js/core/MermaidParser.js

import { iconDetector } from './IconDetector.js';
import { EDGE_STYLES } from '../config/edges.registry.js';

export class MermaidParser {

  /**
   * Parse mermaid source code
   * @param {string} code - Mermaid diagram source
   * @returns {ParsedDiagram}
   */
  parse(code) {
    const startTime = performance.now();
    const lines = code.split('\n');
    const type = this.#detectType(code);

    let result;
    if (type === 'sequence') {
      result = this.#parseSequence(lines);
    } else {
      result = this.#parseFlowchart(lines);
    }

    result.type = type;
    result.metadata = {
      sourceCode: code,
      lineCount: lines.length,
      parseTime: performance.now() - startTime,
    };

    return result;
  }

  /**
   * Detect diagram type from first line
   */
  #detectType(code) {
    const firstLine = code.trim().toLowerCase();
    if (firstLine.startsWith('sequencediagram')) {
      return 'sequence';
    }
    return 'flowchart';
  }

  // ─────────────────────────────────────────────────────────────
  // FLOWCHART PARSING
  // ─────────────────────────────────────────────────────────────

  #parseFlowchart(lines) {
    const nodes = new Map();  // id -> ParsedNode
    const edges = [];
    const subgraphs = [];

    let direction = 'LR';
    let currentSubgraph = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Skip empty lines and comments
      if (!line || line.startsWith('%%')) continue;

      // Detect direction
      const dirMatch = line.match(/^flowchart\s+(LR|RL|TB|BT)/i);
      if (dirMatch) {
        direction = dirMatch[1].toUpperCase();
        continue;
      }

      // Detect subgraph
      if (line.startsWith('subgraph')) {
        const subMatch = line.match(/subgraph\s+(\w+)(?:\s*\[([^\]]+)\])?/);
        if (subMatch) {
          currentSubgraph = {
            id: subMatch[1],
            label: subMatch[2] || subMatch[1],
            nodeIds: [],
            lineNumber,
          };
        }
        continue;
      }

      if (line === 'end' && currentSubgraph) {
        subgraphs.push(currentSubgraph);
        currentSubgraph = null;
        continue;
      }

      // Parse node definitions and edges
      const parsed = this.#parseFlowchartLine(line, lineNumber);

      if (parsed.nodes) {
        for (const node of parsed.nodes) {
          if (!nodes.has(node.id)) {
            nodes.set(node.id, node);
            if (currentSubgraph) {
              currentSubgraph.nodeIds.push(node.id);
            }
          }
        }
      }

      if (parsed.edge) {
        edges.push(parsed.edge);
      }
    }

    // Compute sequence numbers from edge labels or order
    this.#assignSequenceNumbers(edges);

    return {
      direction,
      nodes: Array.from(nodes.values()),
      edges,
      subgraphs,
    };
  }

  #parseFlowchartLine(line, lineNumber) {
    const result = { nodes: [], edge: null };

    // Pattern for node with label: id["label"] or id["label"]
    const nodePattern = /(\w+)\s*\[\s*"([^"]+)"\s*\]/g;
    let match;

    while ((match = nodePattern.exec(line)) !== null) {
      const node = this.#createNode(match[1], match[2], line, lineNumber);
      result.nodes.push(node);
    }

    // Pattern for edges: A --> B or A -- "label" --> B
    const edgePattern = /(\w+)\s*(-{1,2}|={1,2}|\.{1,2})(?:\s*"([^"]*)")?\s*(-{1,2}>|={1,2}>|\.{1,2}>)\s*(\w+)/;
    const edgeMatch = line.match(edgePattern);

    if (edgeMatch) {
      const sourceId = edgeMatch[1];
      const targetId = edgeMatch[5];
      const label = edgeMatch[3] || '';

      // Ensure source and target nodes exist
      if (!result.nodes.find(n => n.id === sourceId)) {
        result.nodes.push(this.#createNode(sourceId, sourceId, line, lineNumber));
      }
      if (!result.nodes.find(n => n.id === targetId)) {
        result.nodes.push(this.#createNode(targetId, targetId, line, lineNumber));
      }

      result.edge = this.#createEdge(sourceId, targetId, label, line, lineNumber);
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // SEQUENCE DIAGRAM PARSING
  // ─────────────────────────────────────────────────────────────

  #parseSequence(lines) {
    const nodes = new Map();  // Participants
    const edges = [];         // Messages

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      if (!line || line.startsWith('%%')) continue;

      // Participant definition
      const participantMatch = line.match(/participant\s+(\w+)(?:\s+as\s+(.+))?/i);
      if (participantMatch) {
        const id = participantMatch[1];
        const label = participantMatch[2] || id;
        nodes.set(id, this.#createNode(id, label, line, lineNumber));
        continue;
      }

      // Message: A->>B: message or A-->>B: message
      const messagePattern = /(\w+)\s*(-?>?>|--?>?>|-)>\s*(\w+)\s*:\s*(.+)/;
      const messageMatch = line.match(messagePattern);

      if (messageMatch) {
        const sourceId = messageMatch[1];
        const targetId = messageMatch[3];
        const label = messageMatch[4];

        // Auto-create participants if not defined
        if (!nodes.has(sourceId)) {
          nodes.set(sourceId, this.#createNode(sourceId, sourceId, line, lineNumber));
        }
        if (!nodes.has(targetId)) {
          nodes.set(targetId, this.#createNode(targetId, targetId, line, lineNumber));
        }

        edges.push(this.#createEdge(sourceId, targetId, label, line, lineNumber));
      }
    }

    this.#assignSequenceNumbers(edges);

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────

  #createNode(id, label, rawDefinition, lineNumber) {
    const labelText = this.#stripHtml(label);
    const detectedType = iconDetector.detect(id, labelText);
    const meta = iconDetector.getMetadata(detectedType);

    return {
      id,
      label,
      labelText,
      shape: this.#detectShape(rawDefinition),
      rawDefinition,
      lineNumber,
      detectedType,
      iconFile: meta.file,
      iconColor: meta.color,
    };
  }

  #createEdge(sourceId, targetId, label, rawDefinition, lineNumber) {
    const id = `edge_${sourceId}_${targetId}_${lineNumber}`;
    const toolInfo = this.#extractToolName(label);
    const styleType = this.#detectEdgeStyle(label);

    return {
      id,
      sourceId,
      targetId,
      label,
      arrowType: this.#detectArrowType(rawDefinition),
      rawDefinition,
      lineNumber,
      sequenceNumber: 0,  // Assigned later
      hasToolReference: toolInfo.hasTool,
      toolName: toolInfo.toolName,
      edgeStyleType: styleType,
    };
  }

  #assignSequenceNumbers(edges) {
    // Try to extract numbers from labels (e.g., "1. Phishing")
    const numbered = [];
    const unnumbered = [];

    for (const edge of edges) {
      const numMatch = edge.label.match(/^(\d+)\./);
      if (numMatch) {
        edge.sequenceNumber = parseInt(numMatch[1], 10);
        numbered.push(edge);
      } else {
        unnumbered.push(edge);
      }
    }

    // Sort numbered edges
    numbered.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // Assign sequence to unnumbered based on line order
    let nextNum = numbered.length > 0
      ? Math.max(...numbered.map(e => e.sequenceNumber)) + 1
      : 1;

    for (const edge of unnumbered) {
      edge.sequenceNumber = nextNum++;
    }
  }

  #extractToolName(label) {
    const toolMatch = label.match(/tools?:\s*([^\n<]+)/i);
    return {
      hasTool: !!toolMatch,
      toolName: toolMatch ? toolMatch[1].trim() : null,
    };
  }

  #detectEdgeStyle(label) {
    const text = label.toLowerCase();

    if (/infect|compromise|exploit/.test(text)) return 'infection';
    if (/exfil|steal|extract/.test(text)) return 'exfiltration';
    if (/lateral|pivot|move/.test(text)) return 'lateral';
    if (/c2|beacon|callback/.test(text)) return 'c2';
    if (/escalat/.test(text)) return 'escalation';

    return 'default';
  }

  #detectShape(line) {
    if (/\[\[.+\]\]/.test(line)) return 'stadium';
    if (/\(\(.+\)\)/.test(line)) return 'circle';
    if (/\{.+\}/.test(line)) return 'diamond';
    if (/\(.+\)/.test(line)) return 'round';
    return 'rect';
  }

  #detectArrowType(line) {
    if (/==>/.test(line)) return 'thick';
    if (/\.\.>/.test(line)) return 'dotted';
    if (/--[^>]/.test(line)) return 'open';
    return 'arrow';
  }

  #stripHtml(text) {
    return text
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
}

// Singleton
export const mermaidParser = new MermaidParser();
```

---

## 5. Web Worker Integration

### 5.1 Worker Script

```javascript
// js/workers/parser.worker.js

import { MermaidParser } from '../core/MermaidParser.js';

const parser = new MermaidParser();

self.onmessage = function(e) {
  const { type, payload, id } = e.data;

  switch (type) {
    case 'PARSE':
      try {
        const result = parser.parse(payload.code);
        self.postMessage({ type: 'PARSE_RESULT', id, payload: result });
      } catch (error) {
        self.postMessage({ type: 'PARSE_ERROR', id, error: error.message });
      }
      break;
  }
};
```

### 5.2 Worker Manager

```javascript
// js/core/ParserWorkerManager.js

export class ParserWorkerManager {
  #worker = null;
  #requestId = 0;
  #pending = new Map();

  init() {
    this.#worker = new Worker('./workers/parser.worker.js', { type: 'module' });
    this.#worker.onmessage = this.#handleMessage.bind(this);
  }

  async parse(code) {
    const id = ++this.#requestId;

    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#worker.postMessage({ type: 'PARSE', id, payload: { code } });
    });
  }

  #handleMessage(e) {
    const { type, id, payload, error } = e.data;
    const pending = this.#pending.get(id);

    if (!pending) return;
    this.#pending.delete(id);

    if (type === 'PARSE_RESULT') {
      pending.resolve(payload);
    } else if (type === 'PARSE_ERROR') {
      pending.reject(new Error(error));
    }
  }

  terminate() {
    this.#worker?.terminate();
    this.#worker = null;
  }
}
```

---

## 6. Parsing Examples

### 6.1 Flowchart Example

**Input:**
```
flowchart LR
    victim_ws["Victim Workstation<br>Windows"]
    kali_attacker["Attacker Machine<br>Tool: impacket-ntlmrelayx"]
    winserver_target["Target Server<br>SMB Signing Disabled"]

    victim_ws -- "1. NTLMv2 Auth" --> kali_attacker
    kali_attacker -- "2. Relay Auth" --> winserver_target
```

**Output (ParsedDiagram):**
```javascript
{
  type: 'flowchart',
  direction: 'LR',
  nodes: [
    {
      id: 'victim_ws',
      label: 'Victim Workstation<br>Windows',
      labelText: 'Victim Workstation Windows',
      detectedType: 'windows',
      iconFile: 'windows.svg',
      iconColor: '#00ADEF',
      lineNumber: 2,
    },
    {
      id: 'kali_attacker',
      label: 'Attacker Machine<br>Tool: impacket-ntlmrelayx',
      labelText: 'Attacker Machine Tool: impacket-ntlmrelayx',
      detectedType: 'kali',
      iconFile: 'kali.svg',
      iconColor: '#2B79C2',
      lineNumber: 3,
    },
    // ...
  ],
  edges: [
    {
      id: 'edge_victim_ws_kali_attacker_6',
      sourceId: 'victim_ws',
      targetId: 'kali_attacker',
      label: '1. NTLMv2 Auth',
      sequenceNumber: 1,
      hasToolReference: false,
      toolName: null,
      edgeStyleType: 'default',
    },
    // ...
  ],
  metadata: {
    sourceCode: '...',
    lineCount: 8,
    parseTime: 2.5,
  }
}
```

---

## 7. Error Handling

| Scenario | Handling |
|----------|----------|
| Empty code | Return empty nodes/edges arrays |
| Invalid syntax | Let Mermaid.js handle during render |
| Missing node definition | Auto-create minimal node |
| Circular reference | Allowed (valid in diagrams) |
| Very long labels | Truncate for detection, preserve original |

---

## 8. Performance

| Optimization | Implementation |
|--------------|----------------|
| Regex precompilation | Patterns defined once, reused |
| Single-pass parsing | Process line by line |
| Web Worker | Non-blocking for large diagrams |
| Map for deduplication | O(1) node lookup |

---

## 9. Testing Checklist

- [ ] Parse flowchart with nodes and edges
- [ ] Parse sequence diagram with participants and messages
- [ ] Extract sequence numbers from labels
- [ ] Detect tool references
- [ ] Handle subgraphs
- [ ] Handle nodes without explicit definitions
- [ ] Preserve line numbers
- [ ] Web Worker messaging works
- [ ] Large diagram (100+ nodes) performance acceptable
