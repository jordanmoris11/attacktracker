# Implementation Plan - CyberViewer-Cyto

**Goal**: Rewrite the legacy Vanilla JS Cyber Graph into a Mission-Critical React/TypeScript Application.

## User Review Required
> [!IMPORTANT]
> **Cytoscape Strategy**: To answer your question—**YES**. We are strictly adhering to the legacy strategy where Cytoscape handles the heavy lifting:
> 1.  **Moving Containers**: We use Cytoscape "Compound Nodes" (as defined in old code). Dragging a parent *automatically* moves children. Zero custom code needed.
> 2.  **Icons**: We use the `background-image` style property (same as old `IconLoader`).
> 3.  **Lines/Arrowheads**: We use native Cytoscape edge styles (Bezier curves).
>
> **The Key Difference**: We are wrapping this in **React Context** and **Zod Validation** to prevent the "silent failures" common in the old app.

---

## Phase 1: Foundation & Project Structure (Day 1)
**Goal**: Initialize the modern stack and ensure the "App Shell" is ready.

1. **Project Scaffolding**
   - [ ] Initialize `vite` + `react-ts` in root (overwriting existing `package.json`).
   - [ ] Install dependencies: `cytoscape`, `cytoscape-dagre`, `zustand`, `lucide-react`, `zod`, `clsx`, `tailwind-merge`.
   - [ ] **Crucial**: Configure `tailwind.config.ts` with Design Tokens from **Spec 6** (Cyber Dark theme, semantic colors for `attack.infection`, `boundary.protected`).

2. **Directory Structure**
   - [ ] Create strict domain folders: `src/core`, `src/ui`, `src/shared`.
   - [ ] **Asset Migration**: Copy `Old_Code/assets/icons` -> `public/assets/icons`. Verify `kali.svg`, `server.svg` exist.

3. **App Shell (Spec 6)**
   - [ ] Implement `src/ui/layout/MainLayout.tsx`: Grid structure with Header, Sidebar (Matrix), and Main Content (Graph).
   - [ ] Implement `src/ui/styles/globals.css`: Lucide icon defaults, font imports.

---

## Phase 2: Core Engine & Data Layer (Day 1-2)
**Goal**: Implement the "Brain" of the application. Input -> Validation -> Graph Data.

1. **Schema Definition (Spec 1)**
   - [ ] **Create** `src/shared/schemas/graph.schema.ts`.
   - [ ] Implement Zod Schemas: `EntityTypeSchema`, `BoundaryTypeSchema`, `NodeSchema`, `EdgeSchema`.
   - [ ] **Validation**: Export `GraphData` type inference.

2. **MITRE Data (Spec 8)**
   - [ ] **Create** `src/shared/config/mitre-index.ts`.
   - [ ] Port the `MITRE_INDEX` constant from old code.
   - [ ] Implement `src/core/mitre/enrichment.ts`: `enrichEdge(edge)` function that parses labels (e.g. "Mimikatz") and adds `mitre` T-Code.

3. **Parsers & Adapters (Spec 3)**
   - [ ] **Create** `src/core/parser/LegacyMermaidAdapter.ts`.
   - [ ] Implement Regex Logic:
     - [ ] Node Extraction: `id[label]`.
     - [ ] Inferred Typing: `proc_` -> `process`, `Protected:` -> `boundary='protected'`.
     - [ ] Edge Extraction: `-.->` -> `type='illegal'`.
   - [ ] **Integrate**: Call `enrichEdge()` during parsing to auto-tag T-Codes.

4. **State Management**
   - [ ] **Create** `src/core/store/useGraphStore.ts`.
   - [ ] actions: `loadData(json/text)`, `reset()`.

---

## Phase 3: Visual Rendering (Day 2)
**Goal**: The "Heart" of the app. Getting Cytoscape on screen.

1. **Icon System (Spec 5)**
   - [ ] **Create** `src/shared/config/icons.registry.ts`.
   - [ ] Port `ICON_REGISTRY` (Map 'kali' -> 'kali.svg').
   - [ ] Implement `getIconPath(key)` helper.

2. **Cytoscape Theme (Spec 4 & 6 & 10)**
   - [ ] **Create** `src/ui/features/GraphCanvas/cytoscape-theme.ts`.
   - [ ] **Nodes**: `background-image: data(icon)`.
   - [ ] **Containers (Spec 10)**:
     - [ ] `[boundary="protected"]` -> Dashed Red border.
     - [ ] `[boundary="machine"]` -> Solid Slate border.
     - [ ] `compoundPadding: 20`.
   - [ ] **Edges (Spec 4)**:
     - [ ] `[type="illegal"]` -> Red Dashed line.
     - [ ] `[type="impact"]` -> Thick Amber line.

3. **GraphCanvas Component**
   - [ ] **Create** `src/ui/features/GraphCanvas/GraphCanvas.tsx`.
   - [ ] Lifecycle: Initialize `cy`.
   - [ ] Layout: Run `dagre` with `rankDir: 'LR'`.
   - [ ] Verify: ResizeObserver works (Spec 6).

---

## Phase 4: Advanced Interaction (Day 3)
**Goal**: Adding life to the graph.

1. **Animation System (Spec 7)**
   - [ ] **Create** `src/core/animation/useAnimationStore.ts`.
   - [ ] **State**: `currentStep`, `isPlaying`.
   - [ ] **Hook**: `useAnimationLoop` (setInterval).
   - [ ] **Syncer**: `useEffect` in GraphCanvas to toggle `opacity: 0/1` based on `step` vs `edge.step`.
   - [ ] **UI**: `AnimationControls.tsx` (Glass panel with Play/Pause).

2. **Matrix Explorer (Spec 8)**
   - [ ] **Create** `src/ui/features/MatrixExplorer/MatrixExplorer.tsx`.
   - [ ] **UI**: Collapsible Sidebar.
   - [ ] **Logic**: Iterate `useGraphStore.edges`. Find all unique T-Codes.
   - [ ] **Render**: Active/Inactive dots for 12 Tactics.

---

## Verification Strategy

### Automated Tests (`npm test`)
1.  **Parser Unit Test**:
    -   Input: `proc_mem[LSASS]`
    -   Expect: `Node { id: 'proc_mem', type: 'process' }`
    -   Verify: Zod validation passes.
2.  **Enrichment Test**:
    -   Input: Edge label "DCSync"
    -   Expect: `mitre: 'T1003.006'` detected automatically.

### Manual Verification Checklist
1.  **Visuals (Spec 5 & 10)**
    -   Load `sample_attack.json`.
    -   [ ] Verify "Attacker" node has Kali Icon.
    -   [ ] Verify "Protected" container has Red Dashed Border.
    -   [ ] **Drag Test**: Move container, ensure children follow.
2.  **Animation (Spec 7)**
    -   [ ] Press Play.
    -   [ ] Verify Edges appear 1-by-1.
    -   [ ] Validate Step Counter increments.
3.  **MITRE (Spec 8)**
    -   [ ] Open Matrix Sidebar.
    -   [ ] Verify "Credential Access" is lit up (if DCSync present).
