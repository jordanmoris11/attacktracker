# Spec 06: Diagram Strategies

**Status:** Draft
**Priority:** P0 (Core)
**Dependencies:** 02-parser.md, 03-transformer.md

---

## 1. Overview

### 1.1 Description

The Diagram Strategies module implements the Strategy design pattern to handle differences between Mermaid diagram types (flowchart vs sequence). Each strategy encapsulates:

1. **Selectors** - DOM queries specific to diagram structure
2. **Parsing** - Type-specific code parsing
3. **Transformation** - Type-specific SVG modifications
4. **Animation** - Type-specific animation behavior

### 1.2 Goals

- Clean separation of diagram-type-specific logic
- Easy addition of new diagram types
- Consistent interface for core modules
- No conditional branching in core code

### 1.3 Non-Goals

- Supporting all Mermaid diagram types (only flowchart + sequence)
- Runtime diagram type switching
- Hybrid diagrams

---

## 2. Files Involved

| File | Purpose |
|------|---------|
| `js/diagrams/DiagramStrategy.js` | Abstract base class / interface |
| `js/diagrams/FlowchartStrategy.js` | Flowchart implementation |
| `js/diagrams/SequenceStrategy.js` | Sequence diagram implementation |
| `js/diagrams/DiagramFactory.js` | Factory for strategy instantiation |

---

## 3. Strategy Interface

### 3.1 Abstract Base Class

```javascript
// js/diagrams/DiagramStrategy.js

/**
 * Abstract base class for diagram type strategies
 * Subclasses must implement all methods
 */
export class DiagramStrategy {

  // ─────────────────────────────────────────────────────────────
  // TYPE DETECTION
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if this strategy can handle the given code
   * @param {string} code - Mermaid source code
   * @returns {boolean}
   */
  static canHandle(code) {
    throw new Error('Not implemented');
  }

  /**
   * Get diagram type identifier
   * @returns {string} 'flowchart' | 'sequence'
   */
  getType() {
    throw new Error('Not implemented');
  }

  // ─────────────────────────────────────────────────────────────
  // DOM SELECTORS
  // ─────────────────────────────────────────────────────────────

  /**
   * CSS selector for node elements
   * @returns {string}
   */
  getNodeSelector() {
    throw new Error('Not implemented');
  }

  /**
   * CSS selector for edge/connection elements
   * @returns {string}
   */
  getEdgeSelector() {
    throw new Error('Not implemented');
  }

  /**
   * CSS selector for edge labels
   * @returns {string}
   */
  getEdgeLabelSelector() {
    throw new Error('Not implemented');
  }

  /**
   * CSS selector for node labels
   * @returns {string}
   */
  getNodeLabelSelector() {
    throw new Error('Not implemented');
  }

  // ─────────────────────────────────────────────────────────────
  // ID EXTRACTION
  // ─────────────────────────────────────────────────────────────

  /**
   * Extract node ID from DOM element
   * @param {Element} element - Node DOM element
   * @returns {string} Node identifier
   */
  extractNodeId(element) {
    throw new Error('Not implemented');
  }

  /**
   * Extract edge source/target from DOM element
   * @param {Element} element - Edge DOM element
   * @returns {{ sourceId: string, targetId: string }}
   */
  extractEdgeEndpoints(element) {
    throw new Error('Not implemented');
  }

  // ─────────────────────────────────────────────────────────────
  // PARSING HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Parse diagram-specific structures from code
   * @param {string} code - Mermaid source code
   * @returns {Object} Parsed structures
   */
  parseSpecificStructures(code) {
    return {};
  }

  // ─────────────────────────────────────────────────────────────
  // TRANSFORMATION HOOKS
  // ─────────────────────────────────────────────────────────────

  /**
   * Called before main transformation
   * @param {SVGElement} svg
   * @param {ParsedDiagram} parsed
   */
  preTransform(svg, parsed) {
    // Default: no-op
  }

  /**
   * Called after main transformation
   * @param {SVGElement} svg
   * @param {ParsedDiagram} parsed
   */
  postTransform(svg, parsed) {
    // Default: no-op
  }

  /**
   * Get icon placement offset
   * @returns {{ x: number, y: number }}
   */
  getIconOffset() {
    return { x: 0, y: -15 };
  }

  // ─────────────────────────────────────────────────────────────
  // ANIMATION HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Get default animation effect for this diagram type
   * @returns {string}
   */
  getDefaultEffect() {
    return 'fadeInDrawPath';
  }

  /**
   * Get default step duration
   * @returns {number} milliseconds
   */
  getDefaultDuration() {
    return 800;
  }
}
```

---

## 4. Flowchart Strategy

### 4.1 Implementation

```javascript
// js/diagrams/FlowchartStrategy.js

import { DiagramStrategy } from './DiagramStrategy.js';

export class FlowchartStrategy extends DiagramStrategy {

  // ─────────────────────────────────────────────────────────────
  // TYPE DETECTION
  // ─────────────────────────────────────────────────────────────

  static canHandle(code) {
    const firstLine = code.trim().toLowerCase();
    return firstLine.startsWith('flowchart') ||
           firstLine.startsWith('graph');
  }

  getType() {
    return 'flowchart';
  }

  // ─────────────────────────────────────────────────────────────
  // DOM SELECTORS
  // ─────────────────────────────────────────────────────────────

  getNodeSelector() {
    return '.node';
  }

  getEdgeSelector() {
    return 'path.flowchart-link';
  }

  getEdgeLabelSelector() {
    return '.edgeLabel';
  }

  getNodeLabelSelector() {
    return '.nodeLabel';
  }

  // ─────────────────────────────────────────────────────────────
  // ID EXTRACTION
  // ─────────────────────────────────────────────────────────────

  extractNodeId(element) {
    // Mermaid generates IDs like "flowchart-victim_ws-123"
    const id = element.id || '';

    // Try to extract original node ID
    const match = id.match(/flowchart-(\w+)-\d+/);
    if (match) {
      return match[1];
    }

    // Fallback: use the full ID
    return id;
  }

  extractEdgeEndpoints(element) {
    // Mermaid stores edge info in data attributes or we infer from markers
    const id = element.id || '';

    // Try parsing from ID pattern
    const match = id.match(/edge-(\w+)-(\w+)/);
    if (match) {
      return {
        sourceId: match[1],
        targetId: match[2]
      };
    }

    // Fallback: return nulls (will match by index)
    return { sourceId: null, targetId: null };
  }

  // ─────────────────────────────────────────────────────────────
  // PARSING HELPERS
  // ─────────────────────────────────────────────────────────────

  parseSpecificStructures(code) {
    const result = {
      direction: 'LR',
      subgraphs: []
    };

    const lines = code.split('\n');
    let currentSubgraph = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Direction
      const dirMatch = line.match(/^(?:flowchart|graph)\s+(LR|RL|TB|BT)/i);
      if (dirMatch) {
        result.direction = dirMatch[1].toUpperCase();
        continue;
      }

      // Subgraph start
      if (line.startsWith('subgraph')) {
        const subMatch = line.match(/subgraph\s+(\w+)(?:\s*\[([^\]]+)\])?/);
        if (subMatch) {
          currentSubgraph = {
            id: subMatch[1],
            label: subMatch[2] || subMatch[1],
            nodeIds: [],
            lineNumber: i + 1
          };
        }
        continue;
      }

      // Subgraph end
      if (line === 'end' && currentSubgraph) {
        result.subgraphs.push(currentSubgraph);
        currentSubgraph = null;
        continue;
      }

      // Node within subgraph
      if (currentSubgraph) {
        const nodeMatch = line.match(/^(\w+)/);
        if (nodeMatch && !line.includes('-->') && !line.includes('---')) {
          currentSubgraph.nodeIds.push(nodeMatch[1]);
        }
      }
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // TRANSFORMATION HOOKS
  // ─────────────────────────────────────────────────────────────

  preTransform(svg, parsed) {
    // Style subgraph containers
    const clusters = svg.querySelectorAll('.cluster');

    clusters.forEach(cluster => {
      const rect = cluster.querySelector('rect');
      if (rect) {
        rect.setAttribute('fill', 'rgba(255, 255, 255, 0.02)');
        rect.setAttribute('stroke', '#2d2d3d');
        rect.setAttribute('stroke-dasharray', '8 4');
        rect.setAttribute('rx', '12');
      }

      // Style subgraph title
      const title = cluster.querySelector('.nodeLabel');
      if (title) {
        title.style.fill = '#64748b';
        title.style.fontSize = '11px';
      }
    });
  }

  postTransform(svg, parsed) {
    // Any flowchart-specific cleanup
  }

  getIconOffset() {
    return { x: 0, y: -15 };  // Icon above center, label below
  }

  // ─────────────────────────────────────────────────────────────
  // ANIMATION HELPERS
  // ─────────────────────────────────────────────────────────────

  getDefaultEffect() {
    return 'fadeInDrawPath';
  }

  getDefaultDuration() {
    return 800;
  }
}
```

---

## 5. Sequence Strategy

### 5.1 Implementation

```javascript
// js/diagrams/SequenceStrategy.js

import { DiagramStrategy } from './DiagramStrategy.js';

export class SequenceStrategy extends DiagramStrategy {

  // ─────────────────────────────────────────────────────────────
  // TYPE DETECTION
  // ─────────────────────────────────────────────────────────────

  static canHandle(code) {
    const firstLine = code.trim().toLowerCase();
    return firstLine.startsWith('sequencediagram');
  }

  getType() {
    return 'sequence';
  }

  // ─────────────────────────────────────────────────────────────
  // DOM SELECTORS
  // ─────────────────────────────────────────────────────────────

  getNodeSelector() {
    // Sequence diagrams have actors, not nodes
    return '.actor';
  }

  getEdgeSelector() {
    // Messages are the "edges" in sequence diagrams
    return '.messageLine0, .messageLine1';
  }

  getEdgeLabelSelector() {
    return '.messageText';
  }

  getNodeLabelSelector() {
    return 'text.actor';
  }

  // ─────────────────────────────────────────────────────────────
  // ID EXTRACTION
  // ─────────────────────────────────────────────────────────────

  extractNodeId(element) {
    // For actors, try to find the text label
    const textEl = element.querySelector('text') ||
                   element.closest('g')?.querySelector('text.actor');

    if (textEl) {
      return textEl.textContent?.trim() || element.id;
    }

    return element.id || '';
  }

  extractEdgeEndpoints(element) {
    // Sequence messages don't have clear source/target in DOM
    // We rely on parsed data matching by index
    return { sourceId: null, targetId: null };
  }

  // ─────────────────────────────────────────────────────────────
  // PARSING HELPERS
  // ─────────────────────────────────────────────────────────────

  parseSpecificStructures(code) {
    const result = {
      participants: [],
      notes: [],
      activations: []
    };

    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Participant definitions
      const participantMatch = line.match(
        /participant\s+(\w+)(?:\s+as\s+(.+))?/i
      );
      if (participantMatch) {
        result.participants.push({
          id: participantMatch[1],
          alias: participantMatch[2] || participantMatch[1],
          lineNumber: i + 1
        });
        continue;
      }

      // Actor definitions (alternate syntax)
      const actorMatch = line.match(/actor\s+(\w+)(?:\s+as\s+(.+))?/i);
      if (actorMatch) {
        result.participants.push({
          id: actorMatch[1],
          alias: actorMatch[2] || actorMatch[1],
          isActor: true,
          lineNumber: i + 1
        });
        continue;
      }

      // Notes
      const noteMatch = line.match(/note\s+(left|right|over)\s+(\w+)\s*:\s*(.+)/i);
      if (noteMatch) {
        result.notes.push({
          position: noteMatch[1],
          participant: noteMatch[2],
          text: noteMatch[3],
          lineNumber: i + 1
        });
        continue;
      }

      // Activations
      if (line.startsWith('activate')) {
        const activateMatch = line.match(/activate\s+(\w+)/i);
        if (activateMatch) {
          result.activations.push({
            type: 'start',
            participant: activateMatch[1],
            lineNumber: i + 1
          });
        }
      }

      if (line.startsWith('deactivate')) {
        const deactivateMatch = line.match(/deactivate\s+(\w+)/i);
        if (deactivateMatch) {
          result.activations.push({
            type: 'end',
            participant: deactivateMatch[1],
            lineNumber: i + 1
          });
        }
      }
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // TRANSFORMATION HOOKS
  // ─────────────────────────────────────────────────────────────

  preTransform(svg, parsed) {
    // Style lifelines
    const lifelines = svg.querySelectorAll('.actor-line');
    lifelines.forEach(line => {
      line.setAttribute('stroke', '#374151');
      line.setAttribute('stroke-dasharray', '5 5');
      line.setAttribute('stroke-width', '1');
    });

    // Style activation boxes
    const activations = svg.querySelectorAll('.activation');
    activations.forEach(box => {
      box.setAttribute('fill', '#1e293b');
      box.setAttribute('stroke', '#475569');
    });
  }

  postTransform(svg, parsed) {
    // Style notes
    const notes = svg.querySelectorAll('.note');
    notes.forEach(note => {
      const rect = note.querySelector('rect');
      if (rect) {
        rect.setAttribute('fill', '#1e293b');
        rect.setAttribute('stroke', '#475569');
        rect.setAttribute('rx', '4');
      }

      const text = note.querySelector('text');
      if (text) {
        text.setAttribute('fill', '#94a3b8');
      }
    });
  }

  getIconOffset() {
    // Icons go above actor boxes in sequence diagrams
    return { x: 0, y: -60 };
  }

  // ─────────────────────────────────────────────────────────────
  // ANIMATION HELPERS
  // ─────────────────────────────────────────────────────────────

  getDefaultEffect() {
    // Sequence diagrams look better with fade (no path drawing)
    return 'fadeIn';
  }

  getDefaultDuration() {
    return 500;  // Faster for messages
  }
}
```

---

## 6. Factory

### 6.1 Implementation

```javascript
// js/diagrams/DiagramFactory.js

import { FlowchartStrategy } from './FlowchartStrategy.js';
import { SequenceStrategy } from './SequenceStrategy.js';

// Registry of available strategies
const STRATEGIES = [
  FlowchartStrategy,
  SequenceStrategy
];

export class DiagramFactory {

  /**
   * Get appropriate strategy for diagram code
   * @param {string} code - Mermaid source code
   * @returns {DiagramStrategy}
   * @throws {Error} If no strategy can handle the code
   */
  static getStrategy(code) {
    for (const Strategy of STRATEGIES) {
      if (Strategy.canHandle(code)) {
        return new Strategy();
      }
    }

    throw new Error(
      'Unsupported diagram type. Only flowchart and sequence diagrams are supported.'
    );
  }

  /**
   * Detect diagram type without instantiating strategy
   * @param {string} code - Mermaid source code
   * @returns {string} 'flowchart' | 'sequence' | 'unknown'
   */
  static detectType(code) {
    for (const Strategy of STRATEGIES) {
      if (Strategy.canHandle(code)) {
        const instance = new Strategy();
        return instance.getType();
      }
    }
    return 'unknown';
  }

  /**
   * Get all supported diagram types
   * @returns {string[]}
   */
  static getSupportedTypes() {
    return STRATEGIES.map(S => new S().getType());
  }
}
```

---

## 7. Usage in Core Modules

### 7.1 In App.js (Orchestrator)

```javascript
import { DiagramFactory } from './diagrams/DiagramFactory.js';
import { mermaidParser } from './core/MermaidParser.js';
import { svgTransformer } from './core/SvgTransformer.js';

async function processdiagram(code) {
  // Get appropriate strategy
  const strategy = DiagramFactory.getStrategy(code);

  // Parse with strategy-aware hints
  const parsed = mermaidParser.parse(code);
  Object.assign(parsed, strategy.parseSpecificStructures(code));

  // Render with Mermaid.js
  const rawSvg = await mermaidRenderer.render(code);

  // Transform with strategy
  const beautifiedSvg = await svgTransformer.transform(rawSvg, parsed, strategy);

  return { parsed, svg: beautifiedSvg, strategy };
}
```

### 7.2 In SvgTransformer

```javascript
async transform(svgString, parsed, strategy) {
  // ... setup code ...

  // Strategy-specific pre-transform
  strategy.preTransform(svg, parsed);

  // Transform nodes using strategy's selector
  const nodeSelector = strategy.getNodeSelector();
  const nodes = svg.querySelectorAll(nodeSelector);

  for (const node of nodes) {
    const nodeId = strategy.extractNodeId(node);
    const offset = strategy.getIconOffset();
    // ... transform logic ...
  }

  // Strategy-specific post-transform
  strategy.postTransform(svg, parsed);

  return serializedSvg;
}
```

---

## 8. Comparison Table

| Aspect | Flowchart | Sequence |
|--------|-----------|----------|
| **First Line** | `flowchart LR` | `sequenceDiagram` |
| **Node Selector** | `.node` | `.actor` |
| **Edge Selector** | `path.flowchart-link` | `.messageLine0, .messageLine1` |
| **Label Selector** | `.edgeLabel` | `.messageText` |
| **Direction** | LR, RL, TB, BT | Always vertical |
| **Default Effect** | `fadeInDrawPath` | `fadeIn` |
| **Default Duration** | 800ms | 500ms |
| **Icon Offset Y** | -15 | -60 |
| **Special Elements** | Subgraphs | Lifelines, Activations, Notes |

---

## 9. Adding New Diagram Types

To add support for a new diagram type (e.g., state diagram):

1. **Create Strategy Class:**
```javascript
// js/diagrams/StateStrategy.js
export class StateStrategy extends DiagramStrategy {
  static canHandle(code) {
    return code.trim().toLowerCase().startsWith('statediagram');
  }
  // ... implement all methods
}
```

2. **Register in Factory:**
```javascript
// js/diagrams/DiagramFactory.js
import { StateStrategy } from './StateStrategy.js';

const STRATEGIES = [
  FlowchartStrategy,
  SequenceStrategy,
  StateStrategy  // Add here
];
```

3. **No changes needed in core modules!**

---

## 10. Testing Checklist

- [ ] FlowchartStrategy.canHandle detects flowchart code
- [ ] SequenceStrategy.canHandle detects sequence code
- [ ] Factory returns correct strategy
- [ ] Factory throws on unsupported type
- [ ] Node selector returns correct elements
- [ ] Edge selector returns correct elements
- [ ] extractNodeId works for both types
- [ ] parseSpecificStructures extracts subgraphs
- [ ] parseSpecificStructures extracts participants
- [ ] preTransform styles diagram-specific elements
- [ ] postTransform applies final touches
- [ ] Icon offset positions correctly for both types
