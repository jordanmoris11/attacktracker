# Research: Layout Persistence Strategy

## 1. Problem Statement
Users arrange nodes (drag & drop) to organize the attack graph, but these positions are lost upon refreshing the page or reloading the data. Use case: *A user customizes the layout of `shai.json` and expects it to remain stable.*

## 2. Current Architecture Constraints
1.  **Strict Schema**: The `NodeSchema` (shared/schemas/graph.schema.ts) does **not** allow extra fields like `position`. We cannot simply inject `x` and `y` into the source JSON without breaking Zod validation.
2.  **Auto-Layout**: `GraphCanvas.tsx` forces a `dagre` layout run every time data is loaded. This overwrites any manual positioning immediately.
3.  **Environment**: The app runs as a pure Client-Side SPA (Vite). There is no backend API to write files (e.g., `shai.settings.json`) directly to the disk.

## 3. Proposed Solution: "Shadow Persistence"

We will implement a "Shadow Persistence" layer that stores layout data separately from the graph data.

### 3.1 Storage Mechanism
Since we cannot write to disk, we will use **LocalStorage** as the primary persistence store.
*   **Key format**: `cyberviewer_layout_{GRAPH_TITLE_OR_ID}`
*   **Value format**:
    ```json
    {
      "nodes": {
        "attacker_machine": { "x": 100, "y": 200 },
        "victim_pc": { "x": 450, "y": 300 }
      },
      "zoom": 1.2,
      "pan": { "x": 0, "y": 0 }
    }
    ```

### 3.2 Implementation Strategy

#### Step A: Capture (The Listener)
In `GraphCanvas.tsx`, we add an event listener to capture user interactions.
`cy.on('dragfree', 'node', (evt) => savePosition(evt.target))`

#### Step B: Restore (The Loader)
We need to modify the Layout Logic in `GraphCanvas.tsx`.
Currently: `Data Load -> Build Cytoscape Elements -> Run Dagre -> Render`.
New Flow:
1.  **Check Storage**: Does `localStorage` have positions for this graph?
2.  **Conditional Layout**:
    *   **Scenario A (First Load)**: No settings found. Run `dagre` layout (Status Quo).
    *   **Scenario B (Has Settings)**:
        *   Load graph elements.
        *   **Apply Positions**: Manually set `.position()` for every node found in settings.
        *   **Run "Preset" Layout**: `cy.layout({ name: 'preset' }).run()`. This tells Cytoscape "trust the provided positions".
        *   *(Optional Hybrid)*: Run `dagre` only on *new* nodes that lack saved positions.

## 4. Required Code Changes

### 1. `src/core/store/useLayoutStore.ts` (New File)
A separate Zustand store to manage layout preferences and interactions with LocalStorage.
```typescript
interface LayoutStore {
  saveNodePosition: (graphId: string, nodeId: string, pos: XYPosition) => void;
  getLayout: (graphId: string) => SavedLayout | null;
}
```

### 2. `src/ui/features/GraphCanvas/GraphCanvas.tsx`
Modify the `useEffect` trigger:
```typescript
// Pseudo-code
const savedLayout = useLayoutStore.getState().getLayout(graphTitle);

if (savedLayout) {
   // Apply positions
   cyNodes.forEach(n => {
       const pos = savedLayout.nodes[n.data.id];
       if (pos) n.position = pos;
   });
   
   cy.layout({ name: 'preset' }).run();
} else {
   cy.layout({ name: 'dagre' }).run();
}
```

## 5. Future "File" Support
If a backend is added later (e.g., Electron fs access), we can easily swap the `useLayoutStore` implementation to read/write `shai.settings.json` instead of LocalStorage, while keeping the UI logic identical.
