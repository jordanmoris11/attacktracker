# Spec 11: Layout Persistence Strategy

**Status:** Active
**Related:** `src/ui/features/GraphCanvas/GraphCanvas.tsx`

## 1. Context
Unlike the legacy "Auto-Layout" approach (Dagre/Cose), the **Scenario-Timeline** architecture requires deterministic positioning. Actors in a movie don't float randomly; they have set marks.

## 2. Layout Strategy: Strict Preset
*   **Engine**: Cytoscape `preset` layout.
*   **Source**: coordinates are strictly read from `entity.position` ({x, y}) in the JSON.
*   **No Auto-Layout**: The application DOES NOT calculate positions at runtime.

## 3. Persistence Workflow (Development)
To help users (and LLMs) author scenarios:
1.  **Load**: App loads JSON. Nodes appear at `x, y`.
2.  **Edit**: User drags a node.
3.  **Sync**: `usePersistence` hook (debounced) captures the new position.
4.  **Save**: App posts the updated JSON back to the `vite-plugin-filesystem` for saving to disk.

## 4. Why this matters for LLMs
LLMs are bad at coordinate geometry.
*   **Strategy**: LLMs output "reasonable" defaults (e.g., Grid 0,0 / 100,0 / 200,0).
*   **Refinement**: The human user loads the scenario, drags nodes to "look nice", and saves.
*   **Final**: The JSON is now "baked" with perfect coordinates for playback.
