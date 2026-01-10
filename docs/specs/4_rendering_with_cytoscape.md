# Spec 4: Rendering with Cytoscape Specification

**Status:** Draft
**Related:** `docs/specs/1_data_modeling_spec.md`
**Legacy Source:** `Old_Code/js/app.js`, `Old_Code/docs/specs/07-edge-styles.md`

## 1. Overview
This specification details how `CyberViewer-Cyto` renders the `AttackGraph` using **Cytoscape.js**. It ensures the visual fidelity matches the "World Class" aesthetics defined in the legacy system while leveraging React for component lifecycle management.

**Core Goal:** 1:1 Parity with legacy "Beautifier" aesthetics + React's declarative power, including proper handling of "Glassmorphism" containers.

## 2. Architecture: `GraphCanvas` Component
The rendering logic is encapsulated in `src/ui/features/GraphCanvas/GraphCanvas.tsx`.

### 2.1 Dependencies
-   **Core**: `cytoscape`, `cytoscape-dagre`
-   **React**: `useRef` for DOM binding, `useEffect` for graph initialization.
-   **Store**: Subscribes to `useGraphStore` for data updates.

## 3. Layout Strategy (`dagre`)
We continue to use **Dagre** for hierarchical layout (Left-to-Right default), as it best represents attack flows.

**Configuration (Ported from `app.js`):**
```typescript
const LAYOUT_CONFIG = {
  name: 'dagre',
  rankDir: 'LR',
  nodeSep: 150, // Spacing between nodes on same rank
  rankSep: 250, // Spacing between ranks
  padding: 100,
  // Dagre specific alignment
  align: 'UL', // Up-Left alignment tends to look cleaner
  ranker: 'network-simplex'
};
```

## 4. Sub-Component: Stylesheet
The visual rules (CSS-for-Graphs) are defined in `src/core/graph/styles/cytoscape-theme.ts`.

### 4.1 Node Styles
| Selector | Style Rule | Legacy Value |
|----------|------------|--------------|
| `node` | Background | `#1e293b` (Slate-800) |
| `node` | Label Color | `#e2e8f0` (Slate-200) |
| `node[icon]` | BG Image | `data(iconPath)` |
| `node:parent` | Shape | `roundrectangle` |
| `node:parent` | Border | Dashed `#475569` |

### 4.2 Edge Styles (Semantic Coloring)
We map the semantic `type` from Spec 1 to specific visual rules.

| Type | Color | Style |
|------|-------|-------|
| `normal` | `#64748b` | Solid |
| `illegal` | `#ef4444` | Dashed (Line of compromise) |
| `impact` | `#f59e0b` | Thick (Critical path) |

**Keyword-Reference**:
Legacy `07-edge-styles.md` defined automatic keyword matching (e.g. "exploit" -> red).
*   **New Strategy**: The *Parser* assigns the `type`. The *Renderer* simply respects the `type`. This moves logic out of the view layer.

## 5. Icon Rendering Strategy
Cytoscape renders icons via `background-image`.
1.  **Icon Registry**: `src/core/graph/styles/icons.registry.ts` maps names to paths.
2.  **Asset Handling**: All SVGs stored in `public/assets/icons/`.
3.  **Data Mapper**: The `CytoscapeAdapter` (Spec 3) injects the resolved `iconPath` into the node's data object, so the stylesheet can use `background-image: data(iconPath)`.

## 6. Containers (Subgraphs)
Containers are critical for "Trust Boundaries".
-   **Selector**: `:parent`
-   **Style**:
    -   `background-opacity`: 0.05 (Subtle tint)
    -   `border-width`: 4px
    -   `border-style`: `dashed`
    -   `padding`: 40px (Ensure internal nodes aren't cramped)

### 6.1 State Overlays
Spec 1 defined states like `compromised` and `protected`.
-   `.compromised`: `border-color: #ef4444`, `shadow-blur: 20px` (Red Glow).
-   `.protected`: `border-color: #3b82f6` (Blue Shield).

## 7. Implementation Plan
1.  **Dependency**: `npm install cytoscape cytoscape-dagre react-cytoscapejs` (or raw hook usage).
2.  **Theme Module**: Create `cytoscape-theme.ts` porting all values from `Old_Code/js/app.js`.
3.  **Component**: Build `GraphCanvas` to initialize `cy` instance.
4.  **ResizeHandler**: Implement `ResizeObserver` on the container div to call `cy.resize()` and `cy.fit()`.
