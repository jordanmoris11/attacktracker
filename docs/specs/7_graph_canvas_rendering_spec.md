# Spec 7: Graph Canvas Rendering

**Status:** Active
**Component:** `src/ui/features/GraphCanvas/GraphCanvas.tsx`
**Stack:** Cytoscape.js, React, Zustand

---

## 1. Overview

The `GraphCanvas` component renders the attack scenario visualization using **Cytoscape.js** — a graph theory library for analysis and visualization.

**Responsibilities:**
- Initialize and manage the Cytoscape instance
- Render nodes (entities) and edges (steps) from scenario data
- Handle visibility toggling per step
- Animate edge transitions
- Persist viewport and node positions

---

## 2. Technology Stack

### 2.1 Cytoscape.js

| Aspect | Detail |
|--------|--------|
| Library | `cytoscape` (npm) |
| Version | ^3.x |
| Purpose | Graph rendering, layout, interaction, animation |
| Documentation | https://js.cytoscape.org |

**Key Cytoscape APIs used:**

| API | Purpose |
|-----|---------|
| `cytoscape({ container, style, ... })` | Initialize graph instance |
| `cy.add({ group, data, style })` | Add nodes/edges |
| `cy.batch(() => { ... })` | Batch DOM updates for performance |
| `cy.elements().remove()` | Clear elements |
| `cy.getElementById(id)` | Get element by ID |
| `ele.animate({ style, duration, easing })` | Animate element properties |
| `cy.on('dragfree', handler)` | Listen to node drag events |
| `cy.on('pan zoom', handler)` | Listen to viewport changes |

### 2.2 Layout Engine

| Setting | Value |
|---------|-------|
| Layout | `preset` (manual positioning) |
| Node positions | Defined in JSON (`position: { x, y }`) |
| Auto-layout | Disabled (dagre removed) |

Previously used `cytoscape-dagre` for automatic hierarchical layout. Now uses `preset` layout with positions from scenario JSON.

### 2.3 State Management

| Store | Purpose |
|-------|---------|
| `useScenarioStore` (Zustand) | Scenario data, timeline, currentStep, visibility |
| `usePersistence` | Auto-save viewport/positions to localStorage |

---

## 3. Rendering Pipeline

### 3.1 Initialization (useEffect #1)

**Trigger:** Component mount
**Purpose:** Create Cytoscape instance with base styles

```
Mount → Create cy instance → Apply base styles → Init header layer
```

### 3.2 Element Loading (useEffect #2)

**Trigger:** `cyElements` or `status` change
**Purpose:** Load nodes from adapter output

```
cyElements change → Clear graph → Add all nodes → Set viewport → Attach listeners
```

### 3.3 Step Updates (useEffect #3)

**Trigger:** `currentStep` change
**Purpose:** Toggle visibility, draw cumulative edges, animate current edge

```
currentStep change → Update visibility → Remove edges → Rebuild edges 0..currentStep → Animate newest
```

---

## 4. Edge Rendering

### 4.1 Cumulative Edge Model

Edges are **cumulative** — all edges from step 1 to `currentStep` are visible simultaneously.

```
currentStep = 0  →  No edges
currentStep = 1  →  Edge 1
currentStep = 3  →  Edges 1, 2, 3
currentStep = 5  →  Edges 1, 2, 3, 4, 5
```

### 4.2 Edge Rebuild Strategy

On each step change, edges are **fully rebuilt**:

1. Remove all existing edges: `cy.edges().remove()`
2. Loop from `i = 0` to `i < currentStep`
3. Add each edge with appropriate styling
4. Animate only the newest edge

**Rationale:** Simpler than incremental add/remove; ensures clean state.

### 4.3 Edge Animation

**Behavior:** Current step's edge appears highlighted, then fades to normal.

| Phase | Color | Duration |
|-------|-------|----------|
| Initial | Amber `#fbbf24` | Instant |
| Fade | → Gray `#94a3b8` | 1000ms |

**Implementation:**

```typescript
// Current step edge starts amber
style: {
    'line-color': '#fbbf24',
    'target-arrow-color': '#fbbf24',
    'width': 2,
    'text-rotation': 'autorotate'
}

// Animate to gray over 1 second
newestEdge.animate({
    style: {
        'line-color': '#94a3b8',
        'target-arrow-color': '#94a3b8'
    },
    duration: 1000,
    easing: 'ease-out'
});
```

**Previous edges:** Rendered immediately in gray (`#94a3b8`), no animation.

---

## 5. Edge Styling

### 5.1 Base Edge Style (Cytoscape Init)

```typescript
{
    selector: 'edge',
    style: {
        'width': 3,
        'line-color': '#94a3b8',
        'target-arrow-color': '#94a3b8',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'text-background-opacity': 1,
        'text-background-color': '#0f172a',
        'text-background-padding': '4px',
        'color': '#cbd5e1',
        'font-size': 10,
        'text-rotation': 'autorotate'
    }
}
```

### 5.2 Label Rotation

| Property | Value | Effect |
|----------|-------|--------|
| `text-rotation` | `'autorotate'` | Label rotates to follow edge angle |

This ensures edge labels remain readable regardless of node positions.

---

## 6. Visibility System

### 6.1 Visibility Map

Each entity can have a visibility range:

```json
"visibility": {
    "malware_process": { "start": 4, "end": 100 },
    "attacker": { "start": 1, "end": 100 }
}
```

### 6.2 Visibility Logic

```typescript
const checkStep = currentStep === 0 ? 1 : currentStep;
const isVisible = (checkStep >= range.start && currentStep <= range.end);

if (isVisible) {
    node.removeClass('hidden');
} else {
    node.addClass('hidden');
}
```

**Special case:** At step 0, entities with `start: 1` are shown (scene setting).

### 6.3 Hidden Class

```typescript
{
    selector: '.hidden',
    style: { 'display': 'none' }
}
```

---

## 7. Persistence

### 7.1 What's Persisted

| Data | Trigger | Storage |
|------|---------|---------|
| Viewport (zoom, pan) | `pan`/`zoom` events | Zustand → localStorage |
| Node positions | `dragfree` event | Zustand → localStorage |

### 7.2 Event Handlers

```typescript
cy.on('pan zoom', () => {
    useScenarioStore.getState().updateViewport(cy.zoom(), cy.pan());
});

cy.on('dragfree', 'node', (evt) => {
    const node = evt.target;
    const pos = node.position();
    useScenarioStore.getState().updateEntityPosition(node.id(), pos.x, pos.y);
});
```

---

## 8. Container Headers

Custom canvas layer renders container headers (label + icon) above container nodes.

| File | Purpose |
|------|---------|
| `ContainerHeaderRenderer.ts` | Canvas drawing for container titles |

Initialized via: `initContainerHeaderLayer(cy)`

---

## 9. Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Edge (normal) | Slate 400 | `#94a3b8` |
| Edge (active) | Amber 400 | `#fbbf24` |
| Label background | Slate 900 | `#0f172a` |
| Label text | Slate 300 | `#cbd5e1` |
| Highlighted border | Amber 400 | `#fbbf24` |
| Canvas background | Slate 900 | `#0f172a` |

---

## 10. Performance Considerations

| Technique | Purpose |
|-----------|---------|
| `cy.batch()` | Batch multiple operations to minimize redraws |
| Preset layout | No layout computation; positions from JSON |
| Edge rebuild | Simple logic; avoids complex diffing |

---

## 11. File Structure

```
src/ui/features/GraphCanvas/
├── GraphCanvas.tsx           # Main component
├── ContainerHeaderRenderer.ts # Custom header drawing
└── cytoscape-theme.ts        # Theme definitions (currently unused inline)
```

---

## 12. Dependencies

```json
{
    "cytoscape": "^3.x",
    "react": "^18.x",
    "zustand": "^4.x"
}
```

**Removed:** `cytoscape-dagre` (auto-layout disabled)
