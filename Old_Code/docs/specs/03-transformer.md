# Spec 03: SVG Transformer

**Status:** Draft
**Priority:** P0 (Core)
**Dependencies:** 01-icon-system.md, 02-parser.md

---

## 1. Overview

### 1.1 Description

The SVG Transformer takes raw SVG output from Mermaid.js and beautifies it by:

1. Replacing default node shapes with custom icons
2. Styling edges based on attack type
3. Highlighting tool names in labels
4. Preparing elements for animation (adding classes, data attributes)

### 1.2 Goals

- Transform SVG in-place without re-rendering
- Maintain SVG accessibility (labels, aria attributes)
- Prepare animation targets with appropriate selectors
- Support both flowchart and sequence diagram SVG structures

### 1.3 Non-Goals

- Re-layout the diagram (Mermaid handles positioning)
- Change the overall diagram structure
- Support non-Mermaid SVG sources

---

## 2. Files Involved

| File | Purpose |
|------|---------|
| `js/core/SvgTransformer.js` | Main transformation logic |
| `js/diagrams/FlowchartStrategy.js` | Flowchart-specific selectors |
| `js/diagrams/SequenceStrategy.js` | Sequence-specific selectors |
| `css/diagram.css` | SVG styling rules |

---

## 3. Transformation Pipeline

```
┌───────────────┐
│   Raw SVG     │
│ (Mermaid.js)  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 1. Parse SVG  │  Convert string to DOM
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 2. Expand     │  Add padding to viewBox
│    ViewBox    │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 3. Add Defs   │  Filters, gradients, markers
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 4. Transform  │  Replace shapes with icons
│    Nodes      │  Add classes, data attributes
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 5. Transform  │  Style lines, add animation classes
│    Edges      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 6. Transform  │  Highlight tools, style text
│    Labels     │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 7. Serialize  │  Convert DOM back to string
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Beautified    │
│     SVG       │
└───────────────┘
```

---

## 4. Implementation

### 4.1 Main Transformer Class

```javascript
// js/core/SvgTransformer.js

import { iconLoader } from './IconLoader.js';
import { EDGE_STYLES } from '../config/edges.registry.js';

export class SvgTransformer {
  #iconSize = 70;
  #strategy = null;  // DiagramStrategy instance

  /**
   * Transform raw SVG with custom icons and styling
   * @param {string} svgString - Raw SVG from Mermaid
   * @param {ParsedDiagram} parsed - Parsed diagram data
   * @param {DiagramStrategy} strategy - Diagram type strategy
   * @returns {Promise<string>} Transformed SVG string
   */
  async transform(svgString, parsed, strategy) {
    this.#strategy = strategy;

    // 1. Parse SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) {
      throw new Error('Invalid SVG: no <svg> element found');
    }

    // 2. Expand viewBox
    this.#expandViewBox(svg, 30);

    // 3. Add definitions
    this.#addDefs(svg);

    // 4. Transform nodes
    await this.#transformNodes(svg, parsed);

    // 5. Transform edges
    this.#transformEdges(svg, parsed);

    // 6. Transform labels
    this.#transformLabels(svg);

    // 7. Serialize
    return new XMLSerializer().serializeToString(svg);
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: VIEWBOX EXPANSION
  // ─────────────────────────────────────────────────────────────

  #expandViewBox(svg, padding) {
    const viewBox = svg.getAttribute('viewBox');
    if (!viewBox) return;

    const [x, y, w, h] = viewBox.split(' ').map(Number);
    svg.setAttribute('viewBox',
      `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 3: SVG DEFINITIONS
  // ─────────────────────────────────────────────────────────────

  #addDefs(svg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Drop shadow filter for icons
    defs.innerHTML = `
      <filter id="icon-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3"
                      flood-color="#000" flood-opacity="0.5"/>
      </filter>

      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;

    svg.insertBefore(defs, svg.firstChild);
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 4: NODE TRANSFORMATION
  // ─────────────────────────────────────────────────────────────

  async #transformNodes(svg, parsed) {
    const nodeSelector = this.#strategy.getNodeSelector();
    const nodes = svg.querySelectorAll(nodeSelector);

    for (const nodeEl of nodes) {
      const nodeId = this.#strategy.extractNodeId(nodeEl);
      const parsedNode = parsed.nodes.find(n => n.id === nodeId);

      if (!parsedNode) continue;

      // Add data attributes for animation targeting
      nodeEl.setAttribute('data-node-id', nodeId);
      nodeEl.setAttribute('data-node-type', parsedNode.detectedType);
      nodeEl.classList.add('beautified-node');

      // Get center position of original shape
      const { cx, cy } = this.#getNodeCenter(nodeEl);

      // Hide original shape
      this.#hideOriginalShape(nodeEl);

      // Insert custom icon
      await this.#insertIcon(nodeEl, parsedNode, cx, cy);

      // Adjust label position
      this.#adjustLabel(nodeEl);
    }
  }

  #getNodeCenter(nodeEl) {
    const shape = nodeEl.querySelector('rect, polygon, circle, ellipse');
    if (!shape) return { cx: 0, cy: 0 };

    switch (shape.tagName) {
      case 'rect': {
        const x = parseFloat(shape.getAttribute('x')) || 0;
        const y = parseFloat(shape.getAttribute('y')) || 0;
        const w = parseFloat(shape.getAttribute('width')) || 80;
        const h = parseFloat(shape.getAttribute('height')) || 80;
        return { cx: x + w / 2, cy: y + h / 2 };
      }

      case 'circle':
      case 'ellipse': {
        return {
          cx: parseFloat(shape.getAttribute('cx')) || 0,
          cy: parseFloat(shape.getAttribute('cy')) || 0,
        };
      }

      case 'polygon': {
        const points = shape.getAttribute('points');
        if (!points) return { cx: 0, cy: 0 };
        const coords = points.split(/[\s,]+/).map(Number);
        let sumX = 0, sumY = 0, count = 0;
        for (let i = 0; i < coords.length; i += 2) {
          sumX += coords[i];
          sumY += coords[i + 1];
          count++;
        }
        return { cx: sumX / count, cy: sumY / count };
      }

      default:
        return { cx: 0, cy: 0 };
    }
  }

  #hideOriginalShape(nodeEl) {
    const shapes = nodeEl.querySelectorAll(':scope > rect, :scope > polygon, :scope > circle, :scope > ellipse');
    for (const shape of shapes) {
      shape.setAttribute('fill', 'transparent');
      shape.setAttribute('stroke', 'transparent');
      shape.style.opacity = '0';
    }
  }

  async #insertIcon(nodeEl, parsedNode, cx, cy) {
    const svgContent = await iconLoader.load(parsedNode.detectedType);
    if (!svgContent) return;

    const iconSize = this.#iconSize;
    const iconX = cx - iconSize / 2;
    const iconY = cy - iconSize / 2 - 15;  // Offset up for label space

    // Parse icon SVG
    const parser = new DOMParser();
    const iconDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const iconSvg = iconDoc.querySelector('svg');

    // Create group for icon
    const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    iconGroup.setAttribute('class', 'custom-icon');
    iconGroup.setAttribute('transform', `translate(${iconX}, ${iconY})`);
    iconGroup.setAttribute('filter', 'url(#icon-shadow)');
    iconGroup.setAttribute('data-icon-type', parsedNode.detectedType);

    // Scale icon to desired size (icons are 80x80)
    const scale = iconSize / 80;
    const innerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerGroup.setAttribute('transform', `scale(${scale})`);

    // Copy icon content
    for (const child of iconSvg.childNodes) {
      if (child.nodeType === 1) {
        innerGroup.appendChild(child.cloneNode(true));
      }
    }

    iconGroup.appendChild(innerGroup);
    nodeEl.insertBefore(iconGroup, nodeEl.firstChild);
  }

  #adjustLabel(nodeEl) {
    const labelGroup = nodeEl.querySelector('.label');
    if (!labelGroup) return;

    // Move label down below icon
    const transform = labelGroup.getAttribute('transform') || '';
    const match = transform.match(/translate\(([-\d.]+),?\s*([-\d.]+)?\)/);

    let tx = 0, ty = 0;
    if (match) {
      tx = parseFloat(match[1]) || 0;
      ty = parseFloat(match[2]) || 0;
    }

    ty += 50;  // Move down
    labelGroup.setAttribute('transform', `translate(${tx}, ${ty})`);

    // Style label background
    const rect = labelGroup.querySelector('rect');
    if (rect) {
      rect.setAttribute('fill', '#12121a');
      rect.setAttribute('stroke', 'none');
      rect.setAttribute('rx', '6');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 5: EDGE TRANSFORMATION
  // ─────────────────────────────────────────────────────────────

  #transformEdges(svg, parsed) {
    const edgeSelector = this.#strategy.getEdgeSelector();
    const edges = svg.querySelectorAll(edgeSelector);
    const edgeLabelSelector = this.#strategy.getEdgeLabelSelector();
    const edgeLabels = svg.querySelectorAll(edgeLabelSelector);

    // Build label lookup
    const labelTexts = new Map();
    edgeLabels.forEach((label, index) => {
      labelTexts.set(index, label.textContent?.trim() || '');
    });

    edges.forEach((edge, index) => {
      const labelText = labelTexts.get(index) || '';
      const parsedEdge = parsed.edges.find(e =>
        e.label === labelText || e.sequenceNumber === index + 1
      );

      // Add data attributes
      edge.setAttribute('data-edge-index', index);
      edge.setAttribute('data-sequence', parsedEdge?.sequenceNumber || index + 1);
      edge.classList.add('beautified-edge');

      // Initially hidden for animation
      edge.classList.add('animation-hidden');
      edge.style.opacity = '0';

      // Apply style based on edge type
      const styleType = parsedEdge?.edgeStyleType || 'default';
      const style = EDGE_STYLES[styleType] || EDGE_STYLES.default;

      // CRITICAL: Use inline styles to override Mermaid's high-specificity CSS
      edge.style.stroke = style.color;
      edge.setAttribute('stroke-width', style.width);
      if (style.dash) {
        edge.setAttribute('stroke-dasharray', style.dash);
      }

      // Store original path length for draw animation
      if (edge.getTotalLength) {
        const length = edge.getTotalLength();
        edge.setAttribute('data-path-length', length);
      }

      // Style arrow markers
      this.#styleArrowMarker(svg, edge, style.color);
    });

    // Style edge labels
    edgeLabels.forEach((label, index) => {
      label.setAttribute('data-edge-index', index);
      label.classList.add('beautified-edge-label', 'animation-hidden');
      label.style.opacity = '0';

      // Style label container
      const rect = label.querySelector('rect');
      if (rect) {
        rect.setAttribute('fill', '#1a1a24');
        rect.setAttribute('stroke', 'none');
        rect.setAttribute('rx', '4');
      }

      // Style text
      label.querySelectorAll('span, p').forEach(el => {
        el.style.background = '#1a1a24';
        el.style.padding = '4px 8px';
        el.style.borderRadius = '4px';
        el.style.color = '#94a3b8';
        el.style.fontSize = '11px';
      });
    });
  }

  #styleArrowMarker(svg, edge, color) {
    const markerUrl = edge.getAttribute('marker-end');
    if (!markerUrl) return;

    const idMatch = markerUrl.match(/url\(#([^)]+)\)/);
    if (!idMatch) return;
    const originalId = idMatch[1];

    // Create unique ID for this color to avoid polluting shared markers
    const safeColor = color.replace(/[^a-z0-9]/gi, '');
    const newId = `${originalId}-${safeColor}`;
    const newUrl = `url(#${newId})`;

    let newMarker = svg.querySelector(`#${newId}`);

    if (!newMarker) {
      const originalMarker = svg.querySelector(`#${originalId}`);
      if (!originalMarker) return;

      // Clone original marker
      newMarker = originalMarker.cloneNode(true);
      newMarker.setAttribute('id', newId);

      // Apply color to clone
      newMarker.querySelectorAll('path, circle, polygon').forEach(shape => {
        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', color);
      });

      // Inject into defs
      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }
      defs.appendChild(newMarker);
    }

    // Update edge to use new colored marker
    edge.setAttribute('marker-end', newUrl);
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 6: LABEL TRANSFORMATION
  // ─────────────────────────────────────────────────────────────

  #transformLabels(svg) {
    // Find all node labels and highlight tool references
    const nodeLabels = svg.querySelectorAll('.nodeLabel');

    for (const label of nodeLabels) {
      this.#highlightTools(label);
    }
  }

  #highlightTools(element) {
    const walk = (node) => {
      if (node.nodeType === 3) {  // Text node
        const text = node.textContent;
        const match = text.match(/(.*?Tools?:\s*)(.+)/i);

        if (match) {
          const span = document.createElement('span');
          span.innerHTML = `${match[1]}<span class="tool-highlight" style="color:#ef4444;font-weight:600;">${match[2]}</span>`;
          node.parentNode.replaceChild(span, node);
          return true;
        }
      } else if (node.nodeType === 1 && node.childNodes) {
        for (const child of Array.from(node.childNodes)) {
          if (walk(child)) return true;
        }
      }
      return false;
    };

    walk(element);
  }
}

// Singleton
export const svgTransformer = new SvgTransformer();
```

---

## 5. CSS Styles

### 5.1 Diagram Styles

```css
/* css/diagram.css */

/* ─────────────────────────────────────────────────────────────
   NODE STYLES
   ───────────────────────────────────────────────────────────── */

/* Hide Mermaid default shapes */
#diagram-output .node > rect,
#diagram-output .node > polygon,
#diagram-output .node > circle,
#diagram-output .node > ellipse {
  fill: transparent !important;
  stroke: transparent !important;
  opacity: 0 !important;
}

/* Ensure custom icons are visible */
#diagram-output .custom-icon,
#diagram-output .custom-icon * {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Node labels */
#diagram-output .nodeLabel {
  fill: #e2e8f0;
  font-size: 12px;
  font-weight: 500;
}

/* Tool highlight */
.tool-highlight {
  color: #ef4444;
  font-weight: 600;
}

/* ─────────────────────────────────────────────────────────────
   EDGE STYLES
   ───────────────────────────────────────────────────────────── */

/* Hidden state for animation */
.animation-hidden {
  opacity: 0;
  visibility: hidden;
}

/* Visible state */
.animation-visible {
  opacity: 1;
  visibility: visible;
}

/* Edge path draw animation */
.beautified-edge.drawing {
  animation: draw-path 0.8s ease-out forwards;
}

@keyframes draw-path {
  from {
    stroke-dashoffset: var(--path-length);
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* Edge fade in */
.beautified-edge.fade-in,
.beautified-edge-label.fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ─────────────────────────────────────────────────────────────
   SUBGRAPH STYLES
   ───────────────────────────────────────────────────────────── */

#diagram-output .cluster rect {
  fill: rgba(255, 255, 255, 0.02) !important;
  stroke: #2d2d3d !important;
  stroke-dasharray: 8 4;
  rx: 12;
}

#diagram-output .cluster .nodeLabel {
  fill: #64748b;
  font-size: 11px;
}
```

---

## 6. Animation Preparation

The transformer prepares edges for animation by:

1. **Adding Classes:**
   - `.beautified-edge` - All edge paths
   - `.beautified-edge-label` - All edge labels
   - `.animation-hidden` - Initial hidden state

2. **Adding Data Attributes:**
   - `data-edge-index` - Order in DOM
   - `data-sequence` - Animation sequence number
   - `data-path-length` - For draw animation

3. **CSS Variables:**
   - `--path-length` - Set dynamically for draw animation

---

## 7. Strategy Interface

The transformer uses a strategy to handle diagram-type differences:

```javascript
// js/diagrams/DiagramStrategy.js (interface)

export class DiagramStrategy {
  // DOM Selectors
  getNodeSelector() { throw new Error('Not implemented'); }
  getEdgeSelector() { throw new Error('Not implemented'); }
  getEdgeLabelSelector() { throw new Error('Not implemented'); }

  // ID Extraction
  extractNodeId(nodeElement) { throw new Error('Not implemented'); }

  // Diagram-specific transforms (optional overrides)
  preTransform(svg) {}
  postTransform(svg) {}
}
```

---

## 8. Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid SVG string | Throw descriptive error |
| Missing node in parsed data | Skip icon insertion, log warning |
| Icon load failure | Use default icon |
| Missing shape element | Skip node transformation |
| No viewBox | Skip viewBox expansion |

---

## 9. Testing Checklist

- [ ] Parses valid SVG string
- [ ] Expands viewBox correctly
- [ ] Adds filter definitions
- [ ] Hides original node shapes
- [ ] Inserts icons at correct positions
- [ ] Adjusts label positions
- [ ] Applies edge styles correctly
- [ ] Highlights tool names in labels
- [ ] Adds animation classes and attributes
- [ ] Serializes back to valid SVG string
- [ ] Works with flowchart SVG
- [ ] Works with sequence diagram SVG
