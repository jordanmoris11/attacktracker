# Spec 11: Implementation Guide - Internal Attack Modeling

**Status:** Draft
**Priority:** P1
**Dependencies:** 10-internal-attack-modeling.md

---

## 1. Implementation Overview

This document provides **exact code changes** required to implement the Internal Attack Modeling feature.

### 1.1 Files to Modify

| File | Changes |
|------|---------|
| `js/config/icons.registry.js` | Add new entity type prefixes |
| `js/config/edges.registry.js` | Add semantic edge types (illegal, impact) |
| `js/core/MermaidParser.js` | Detect entity types, edge semantics, boundary types |
| `js/core/SvgTransformer.js` | Style edges, subgraphs, state annotations |
| `css/variables.css` | Add new color variables |
| `css/diagram.css` | Add boundary and edge semantic styles |
| `docs/llm-prompt.md` | Add new conventions |

### 1.2 New Files to Create

| File | Purpose |
|------|---------|
| `js/config/entities.registry.js` | Entity type definitions |
| `assets/icons/process.svg` | Process entity icon |
| `assets/icons/service.svg` | Service entity icon |
| `assets/icons/memory.svg` | Memory region icon |

---

## 2. Code Changes

### 2.1 Create `js/config/entities.registry.js`

```javascript
/* =============================================================================
   ENTITY REGISTRY
   Entity type definitions for internal attack modeling
   ============================================================================= */

/**
 * Entity types for internal attack modeling
 * Maps node prefixes to entity metadata
 */
export const ENTITY_REGISTRY = {
  // ─────────────────────────────────────────────────────────────
  // ACTORS (Rounded shape)
  // ─────────────────────────────────────────────────────────────
  attacker_: {
    type: 'actor',
    icon: 'attacker',
    shape: 'rounded',
    description: 'Threat actor / Attacker',
  },
  user_: {
    type: 'actor',
    icon: 'user',
    shape: 'rounded',
    description: 'User / Employee',
  },

  // ─────────────────────────────────────────────────────────────
  // PROCESSES (Rectangle)
  // ─────────────────────────────────────────────────────────────
  proc_: {
    type: 'process',
    icon: 'process',
    shape: 'rect',
    description: 'Executing process',
  },
  svc_: {
    type: 'service',
    icon: 'service',
    shape: 'rect',
    description: 'System service',
  },

  // ─────────────────────────────────────────────────────────────
  // MEMORY (Cylinder)
  // ─────────────────────────────────────────────────────────────
  mem_: {
    type: 'memory',
    icon: 'memory',
    shape: 'cylinder',
    description: 'Memory region / buffer',
  },
  data_: {
    type: 'data',
    icon: 'db',
    shape: 'cylinder',
    description: 'Data store / files',
  },

  // ─────────────────────────────────────────────────────────────
  // CREDENTIALS (Double-brace / Hexagon)
  // ─────────────────────────────────────────────────────────────
  cred_: {
    type: 'credential',
    icon: 'creds',
    shape: 'hexagon',
    description: 'Credential / Auth material',
  },
  ticket_: {
    type: 'credential',
    icon: 'creds',
    shape: 'hexagon',
    description: 'Kerberos ticket',
  },
  token_: {
    type: 'credential',
    icon: 'creds',
    shape: 'hexagon',
    description: 'Access token',
  },
};

/**
 * State annotations for entities
 */
export const ENTITY_STATES = {
  compromised: {
    cssClass: 'entity-compromised',
    color: '#ef4444',
    description: 'Entity is attacker-controlled',
  },
  elevated: {
    cssClass: 'entity-elevated',
    color: '#f59e0b',
    description: 'Running with elevated privileges',
  },
  encrypted: {
    cssClass: 'entity-encrypted',
    color: '#8b5cf6',
    description: 'Data has been encrypted',
  },
};

/**
 * Trust boundary types (for subgraphs)
 */
export const BOUNDARY_TYPES = {
  machine: {
    keywords: ['machine', 'host', 'server', 'workstation', 'vm'],
    cssClass: 'boundary-machine',
    borderColor: '#64748b',
    borderStyle: 'solid',
    borderWidth: 2,
    fill: 'rgba(100,116,139,0.05)',
  },
  kernel: {
    keywords: ['kernel', 'ring0', 'ring 0', 'os', 'system'],
    cssClass: 'boundary-kernel',
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
    borderWidth: 3,
    fill: 'rgba(139,92,246,0.05)',
  },
  protected: {
    keywords: ['protected', 'secure', 'lsa', 'lsass', 'security authority', 'trusted'],
    cssClass: 'boundary-protected',
    borderColor: '#ef4444',
    borderStyle: 'dashed',
    borderWidth: 2,
    fill: 'rgba(239,68,68,0.03)',
  },
  container: {
    keywords: ['container', 'pod', 'sandbox', 'namespace', 'docker', 'jail'],
    cssClass: 'boundary-container',
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderWidth: 2,
    fill: 'rgba(59,130,246,0.05)',
  },
  network: {
    keywords: ['network', 'segment', 'dmz', 'vlan', 'subnet', 'zone'],
    cssClass: 'boundary-network',
    borderColor: '#64748b',
    borderStyle: 'dotted',
    borderWidth: 1,
    fill: 'transparent',
  },
  default: {
    keywords: [],
    cssClass: 'boundary-default',
    borderColor: '#475569',
    borderStyle: 'dashed',
    borderWidth: 1,
    fill: 'rgba(255,255,255,0.02)',
  },
};

/**
 * Detect entity type from node ID
 * @param {string} nodeId - Node identifier
 * @returns {Object} Entity metadata
 */
export function detectEntityType(nodeId) {
  const idLower = nodeId.toLowerCase();

  for (const [prefix, meta] of Object.entries(ENTITY_REGISTRY)) {
    if (idLower.startsWith(prefix)) {
      return { ...meta, prefix };
    }
  }

  return { type: 'default', icon: null, shape: 'rect', prefix: null };
}

/**
 * Detect boundary type from subgraph label
 * @param {string} label - Subgraph label text
 * @returns {Object} Boundary metadata
 */
export function detectBoundaryType(label) {
  const labelLower = label.toLowerCase();

  for (const [type, meta] of Object.entries(BOUNDARY_TYPES)) {
    if (type === 'default') continue;

    for (const keyword of meta.keywords) {
      if (labelLower.includes(keyword)) {
        return { type, ...meta };
      }
    }
  }

  return { type: 'default', ...BOUNDARY_TYPES.default };
}

/**
 * Parse state annotation from node definition
 * @param {string} rawDefinition - Raw node definition line
 * @returns {string|null} State name or null
 */
export function parseEntityState(rawDefinition) {
  // Match :::state syntax (Mermaid class syntax)
  const classMatch = rawDefinition.match(/:::(\w+)/);
  if (classMatch && ENTITY_STATES[classMatch[1]]) {
    return classMatch[1];
  }

  // Match ::state suffix in label
  const suffixMatch = rawDefinition.match(/::(\w+)\]|::(\w+)\)/);
  if (suffixMatch) {
    const state = suffixMatch[1] || suffixMatch[2];
    if (ENTITY_STATES[state]) {
      return state;
    }
  }

  return null;
}
```

---

### 2.2 Modify `js/config/edges.registry.js`

Add semantic edge types after existing `EDGE_STYLES`:

```javascript
// ADD after EDGE_STYLES definition (around line 326)

/**
 * Semantic edge types for internal attack modeling
 * These override tactical styling when present
 */
export const EDGE_SEMANTICS = {
  normal: {
    // Uses default MITRE tactic coloring
    priority: 0,
    mermaidSyntax: ['-->', '---'],
    description: 'Normal/legitimate action',
  },
  illegal: {
    color: '#ef4444',      // Red
    width: 3,
    dash: '8,4',
    glow: true,
    glowColor: 'rgba(239,68,68,0.4)',
    priority: 10,          // Override tactic colors
    mermaidSyntax: ['-.->','-.->', '-..->', '-..->'],
    description: 'Illegal action / Security violation',
  },
  impact: {
    color: '#f59e0b',      // Amber
    width: 4,
    dash: null,
    glow: false,
    priority: 5,
    mermaidSyntax: ['==>', '==='],
    description: 'High-impact action (credential theft, lateral movement)',
  },
};

/**
 * Detect edge semantic from raw mermaid syntax
 * @param {string} rawDefinition - Raw edge definition line
 * @returns {string} Semantic type: 'normal' | 'illegal' | 'impact'
 */
export function detectEdgeSemantic(rawDefinition) {
  // Check for illegal edge syntax: -.-> or variations
  if (/\.-+>|\.{2,}->/.test(rawDefinition)) {
    return 'illegal';
  }

  // Check for impact edge syntax: ==> or ===
  if (/={2,}>/.test(rawDefinition)) {
    return 'impact';
  }

  return 'normal';
}

/**
 * Get combined edge style (semantic + tactic)
 * @param {string} semantic - Edge semantic type
 * @param {string} tacticType - MITRE tactic type
 * @returns {Object} Combined style
 */
export function getCombinedEdgeStyle(semantic, tacticType) {
  const tacticStyle = EDGE_STYLES[tacticType] || EDGE_STYLES.default;
  const semanticStyle = EDGE_SEMANTICS[semantic];

  // Semantic overrides tactic if higher priority
  if (semanticStyle && semanticStyle.priority > 0) {
    return {
      ...tacticStyle,
      color: semanticStyle.color,
      width: semanticStyle.width,
      dash: semanticStyle.dash,
      glow: semanticStyle.glow,
      glowColor: semanticStyle.glowColor,
      semantic,
    };
  }

  return { ...tacticStyle, semantic: 'normal' };
}
```

---

### 2.3 Modify `js/config/icons.registry.js`

Add new icons for internal entities (add after existing entries):

```javascript
// ADD to ICON_REGISTRY object (around line 180, before 'default')

  // ─────────────────────────────────────────────────────────────
  // INTERNAL ENTITY TYPES (for attack modeling)
  // ─────────────────────────────────────────────────────────────

  process: {
    file: 'process.svg',
    color: '#22c55e',      // Green
    category: 'internal',
    priority: 'high',
    keywords: ['process', 'proc_', '.exe', 'executable'],
  },

  service: {
    file: 'service.svg',
    color: '#3b82f6',      // Blue
    category: 'internal',
    priority: 'high',
    keywords: ['service', 'svc_', 'daemon', 'svchost'],
  },

  memory: {
    file: 'memory.svg',
    color: '#8b5cf6',      // Purple
    category: 'internal',
    priority: 'high',
    keywords: ['memory', 'mem_', 'buffer', 'heap', 'stack', 'lsass memory'],
  },
```

---

### 2.4 Modify `js/core/MermaidParser.js`

Update parser to detect new entity types and edge semantics.

**Add imports at top:**

```javascript
import { detectEntityType, detectBoundaryType, parseEntityState } from '../config/entities.registry.js';
import { detectEdgeSemantic } from '../config/edges.registry.js';
```

**Update `#createNode` method (around line 331):**

```javascript
#createNode(id, label, rawDefinition, lineNumber) {
  const labelText = this.#stripHtml(label);
  const detectedType = iconDetector.detect(id, labelText);
  const meta = iconDetector.getMetadata(detectedType);

  // NEW: Detect entity type from prefix
  const entityInfo = detectEntityType(id);

  // NEW: Detect state annotation
  const entityState = parseEntityState(rawDefinition);

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

    // NEW fields
    entityType: entityInfo.type,
    entityIcon: entityInfo.icon,
    entityState,
  };
}
```

**Update `#createEdge` method (around line 349):**

```javascript
#createEdge(sourceId, targetId, label, rawDefinition, lineNumber) {
  const id = `edge_${sourceId}_${targetId}_${lineNumber}`;
  const toolInfo = this.#extractToolName(label);
  const styleType = this.#detectEdgeStyle(label);

  // NEW: Detect edge semantic from syntax
  const edgeSemantic = detectEdgeSemantic(rawDefinition);

  return {
    id,
    sourceId,
    targetId,
    label,
    arrowType: this.#detectArrowType(rawDefinition),
    rawDefinition,
    lineNumber,
    sequenceNumber: 0,
    hasToolReference: toolInfo.hasTool,
    toolName: toolInfo.toolName,
    edgeStyleType: styleType,

    // NEW field
    edgeSemantic,
  };
}
```

**Update subgraph parsing in `#parseFlowchart` (around line 192):**

```javascript
// Detect subgraph
if (line.startsWith('subgraph')) {
  const subMatch = line.match(/subgraph\s+(\w+)(?:\s*\[([^\]]+)\])?/);
  if (subMatch) {
    const label = subMatch[2] || subMatch[1];

    // NEW: Detect boundary type
    const boundaryInfo = detectBoundaryType(label);

    currentSubgraph = {
      id: subMatch[1],
      label,
      nodeIds: [],
      lineNumber,

      // NEW field
      boundaryType: boundaryInfo.type,
    };
  }
  continue;
}
```

---

### 2.5 Modify `js/core/SvgTransformer.js`

Update transformer to apply new styles.

**Add imports at top:**

```javascript
import { EDGE_SEMANTICS, getCombinedEdgeStyle } from '../config/edges.registry.js?v=3';
import { BOUNDARY_TYPES, ENTITY_STATES } from '../config/entities.registry.js';
```

**Add new method for subgraph styling (add after `#transformEdges`):**

```javascript
/**
 * Transform subgraphs (trust boundaries)
 * @param {SVGElement} svg
 * @param {Object} parsed
 */
#transformSubgraphs(svg, parsed) {
  if (!parsed.subgraphs) return;

  const clusters = svg.querySelectorAll('.cluster');

  clusters.forEach((cluster, index) => {
    const subgraph = parsed.subgraphs[index];
    if (!subgraph) return;

    const boundaryConfig = BOUNDARY_TYPES[subgraph.boundaryType] || BOUNDARY_TYPES.default;

    // Add data attributes
    cluster.setAttribute('data-boundary-type', subgraph.boundaryType);
    cluster.classList.add('trust-boundary', boundaryConfig.cssClass);

    // Style the rectangle
    const rect = cluster.querySelector('rect');
    if (rect) {
      rect.style.stroke = boundaryConfig.borderColor;
      rect.style.strokeWidth = `${boundaryConfig.borderWidth}px`;
      rect.style.fill = boundaryConfig.fill;

      if (boundaryConfig.borderStyle === 'dashed') {
        rect.style.strokeDasharray = '8,4';
      } else if (boundaryConfig.borderStyle === 'dotted') {
        rect.style.strokeDasharray = '2,2';
      }
    }

    // Style the label
    const label = cluster.querySelector('.nodeLabel');
    if (label && subgraph.boundaryType === 'protected') {
      label.style.fill = boundaryConfig.borderColor;
      label.style.fontWeight = '600';
    }
  });
}
```

**Update `#transformEdges` to handle semantics (modify around line 365):**

```javascript
// Replace existing edge styling logic with:

// Get combined style (semantic + tactic)
const tacticType = parsedEdge?.edgeStyleType || 'default';
const semantic = parsedEdge?.edgeSemantic || 'normal';
const style = getCombinedEdgeStyle(semantic, tacticType);

edge.style.stroke = style.color;
edge.setAttribute('stroke-width', style.width);

if (style.dash) {
  edge.setAttribute('stroke-dasharray', style.dash);
} else {
  edge.removeAttribute('stroke-dasharray');
}

// NEW: Add glow effect for illegal edges
if (style.glow) {
  edge.classList.add('edge-glow');
  edge.style.filter = `drop-shadow(0 0 4px ${style.glowColor})`;
}

// Add semantic class
edge.classList.add(`edge-semantic-${semantic}`);
```

**Update `transform` method to call subgraph styling (add after Step 6):**

```javascript
// Step 6.5: Transform subgraphs (trust boundaries)
this.#transformSubgraphs(svg, parsed);
```

**Add method to style entity states:**

```javascript
/**
 * Apply state styling to nodes
 * @param {Element} nodeEl
 * @param {Object} parsedNode
 */
#applyEntityState(nodeEl, parsedNode) {
  if (!parsedNode.entityState) return;

  const stateConfig = ENTITY_STATES[parsedNode.entityState];
  if (!stateConfig) return;

  nodeEl.classList.add(stateConfig.cssClass);

  // Add visual indicator (border glow)
  const iconGroup = nodeEl.querySelector('.custom-icon');
  if (iconGroup) {
    iconGroup.style.filter = `drop-shadow(0 0 6px ${stateConfig.color})`;
  }
}
```

Call this in `#transformNodes` after inserting the icon.

---

### 2.6 Add to `css/variables.css`

Add new color variables:

```css
/* ADD to :root (after existing color definitions) */

/* ─────────────────────────────────────────────────────────────
   INTERNAL ATTACK MODELING COLORS
   ───────────────────────────────────────────────────────────── */

/* Edge semantics */
--color-edge-illegal: #ef4444;
--color-edge-illegal-glow: rgba(239, 68, 68, 0.4);
--color-edge-impact: #f59e0b;

/* Boundary types */
--color-boundary-machine: #64748b;
--color-boundary-kernel: #8b5cf6;
--color-boundary-protected: #ef4444;
--color-boundary-container: #3b82f6;
--color-boundary-network: #64748b;

/* Entity states */
--color-state-compromised: #ef4444;
--color-state-elevated: #f59e0b;
--color-state-encrypted: #8b5cf6;
```

---

### 2.7 Add to `css/diagram.css`

Add new styles for boundaries, edge semantics, and entity states:

```css
/* ADD at end of file */

/* ─────────────────────────────────────────────────────────────
   TRUST BOUNDARY STYLES
   ───────────────────────────────────────────────────────────── */

.trust-boundary rect {
  rx: var(--border-radius-xl);
  transition: stroke 0.2s ease, fill 0.2s ease;
}

.boundary-machine rect {
  stroke: var(--color-boundary-machine) !important;
  stroke-width: 2px;
  fill: rgba(100, 116, 139, 0.05) !important;
}

.boundary-kernel rect {
  stroke: var(--color-boundary-kernel) !important;
  stroke-width: 3px;
  stroke-dasharray: 8, 4;
  fill: rgba(139, 92, 246, 0.05) !important;
}

.boundary-protected rect {
  stroke: var(--color-boundary-protected) !important;
  stroke-width: 2px;
  stroke-dasharray: 8, 4;
  fill: rgba(239, 68, 68, 0.03) !important;
}

.boundary-container rect {
  stroke: var(--color-boundary-container) !important;
  stroke-width: 2px;
  stroke-dasharray: 8, 4;
  fill: rgba(59, 130, 246, 0.05) !important;
}

.boundary-network rect {
  stroke: var(--color-boundary-network) !important;
  stroke-width: 1px;
  stroke-dasharray: 2, 2;
  fill: transparent !important;
}

/* Boundary label styling */
.boundary-protected .nodeLabel {
  fill: var(--color-boundary-protected) !important;
  font-weight: 600;
}

/* ─────────────────────────────────────────────────────────────
   SEMANTIC EDGE STYLES
   ───────────────────────────────────────────────────────────── */

.edge-semantic-illegal {
  stroke: var(--color-edge-illegal) !important;
  stroke-width: 3px !important;
  stroke-dasharray: 8, 4 !important;
}

.edge-glow {
  filter: drop-shadow(0 0 4px var(--color-edge-illegal-glow));
}

.edge-semantic-impact {
  stroke: var(--color-edge-impact) !important;
  stroke-width: 4px !important;
}

/* Animation for illegal edges */
@keyframes illegal-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 2px var(--color-edge-illegal-glow));
  }
  50% {
    filter: drop-shadow(0 0 8px var(--color-edge-illegal-glow));
  }
}

.edge-semantic-illegal.animation-visible {
  animation: illegal-pulse 2s ease-in-out infinite;
}

/* ─────────────────────────────────────────────────────────────
   ENTITY STATE STYLES
   ───────────────────────────────────────────────────────────── */

.entity-compromised .custom-icon {
  filter: drop-shadow(0 0 6px var(--color-state-compromised)) !important;
}

.entity-elevated .custom-icon {
  filter: drop-shadow(0 0 6px var(--color-state-elevated)) !important;
}

.entity-encrypted .custom-icon {
  filter: drop-shadow(0 0 6px var(--color-state-encrypted)) !important;
}

/* State badge (optional visual indicator) */
.entity-state-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### 2.8 Create New SVG Icons

**`assets/icons/process.svg`:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect x="10" y="15" width="60" height="50" rx="4" fill="#1e293b" stroke="#22c55e" stroke-width="2"/>
  <rect x="16" y="22" width="20" height="3" rx="1" fill="#22c55e"/>
  <rect x="16" y="28" width="35" height="3" rx="1" fill="#475569"/>
  <rect x="16" y="34" width="28" height="3" rx="1" fill="#475569"/>
  <rect x="16" y="40" width="40" height="3" rx="1" fill="#475569"/>
  <circle cx="60" cy="24" r="6" fill="#22c55e" opacity="0.8"/>
  <path d="M58 24l2 2 4-4" stroke="#1e293b" stroke-width="1.5" fill="none"/>
</svg>
```

**`assets/icons/service.svg`:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect x="10" y="15" width="60" height="50" rx="4" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
  <circle cx="28" cy="32" r="8" fill="none" stroke="#3b82f6" stroke-width="2"/>
  <path d="M28 26v12M22 32h12" stroke="#3b82f6" stroke-width="2"/>
  <rect x="44" y="26" width="20" height="3" rx="1" fill="#3b82f6"/>
  <rect x="44" y="33" width="16" height="3" rx="1" fill="#475569"/>
  <rect x="16" y="48" width="48" height="3" rx="1" fill="#475569"/>
  <rect x="16" y="54" width="32" height="3" rx="1" fill="#475569"/>
</svg>
```

**`assets/icons/memory.svg`:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <ellipse cx="40" cy="18" rx="28" ry="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="2"/>
  <path d="M12 18v44c0 4.4 12.5 8 28 8s28-3.6 28-8V18" fill="none" stroke="#8b5cf6" stroke-width="2"/>
  <ellipse cx="40" cy="62" rx="28" ry="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="2"/>
  <path d="M12 32c0 4.4 12.5 8 28 8s28-3.6 28-8" fill="none" stroke="#8b5cf6" stroke-width="1" opacity="0.5"/>
  <path d="M12 46c0 4.4 12.5 8 28 8s28-3.6 28-8" fill="none" stroke="#8b5cf6" stroke-width="1" opacity="0.5"/>
  <text x="40" y="44" text-anchor="middle" fill="#8b5cf6" font-size="12" font-family="monospace">0x</text>
</svg>
```

---

## 3. LLM Prompt Updates

See separate document: `12-llm-prompt-updates.md`

---

## 4. Testing Plan

### 4.1 Unit Tests

| Test | Input | Expected |
|------|-------|----------|
| Entity detection | `proc_mimikatz` | `{ type: 'process', icon: 'process' }` |
| Entity detection | `mem_lsass` | `{ type: 'memory', icon: 'memory' }` |
| Entity detection | `cred_hash` | `{ type: 'credential', icon: 'creds' }` |
| Edge semantic | `A -.-> B` | `'illegal'` |
| Edge semantic | `A ==> B` | `'impact'` |
| Edge semantic | `A --> B` | `'normal'` |
| Boundary type | `"Protected: LSASS"` | `'protected'` |
| Boundary type | `"Container Namespace"` | `'container'` |
| State parsing | `proc_x[Name]:::elevated` | `'elevated'` |

### 4.2 Integration Tests

1. **Simple internal attack diagram** - Mimikatz example renders correctly
2. **Mixed network/internal diagram** - Both levels work together
3. **Nested boundaries** - Machine > OS > Protected renders correctly
4. **Animation with new edges** - Illegal edges animate with glow
5. **State annotations** - Elevated/compromised nodes show visual indicator

### 4.3 Visual Regression

Compare screenshots of:
- Existing diagrams (should not change)
- New internal attack diagrams
- Mixed diagrams

---

## 5. Migration Notes

### 5.1 Backward Compatibility

- All existing diagrams continue to work
- New prefixes are additive (don't conflict with existing)
- `-->` edge remains default behavior

### 5.2 Breaking Changes

None expected.

---

## 6. Implementation Order

1. Create `entities.registry.js` *(foundation)*
2. Update `edges.registry.js` with semantics *(foundation)*
3. Create new SVG icons *(assets)*
4. Update `MermaidParser.js` *(parsing)*
5. Update `SvgTransformer.js` *(rendering)*
6. Add CSS variables and styles *(styling)*
7. Update `llm-prompt.md` *(documentation)*
8. Test with example diagrams *(validation)*
