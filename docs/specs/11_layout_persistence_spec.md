# Spec 11: Layout Persistence Strategy

**Status:** Implemented
**Related:** `docs/0_high_level_design.md`, `src/ui/features/GraphCanvas/GraphCanvas.tsx`

## 1. Problem Statement
Users arrange nodes (drag & drop) to organize the attack graph, but these positions are lost upon refreshing the page or reloading the data. Use case: *A user customizes the layout of `shai.json` and expects it to remain stable.*

## 2. Current Architecture Constraints
1.  **Strict Schema**: The `NodeSchema` (shared/schemas/graph.schema.ts) does **not** allow extra fields like `position`. We cannot simply inject `x` and `y` into the source JSON without breaking Zod validation.
2.  **Auto-Layout**: `GraphCanvas.tsx` forces a `dagre` layout run every time data is loaded. This overwrites any manual positioning immediately.
3.  **Environment**: The app runs as a pure Client-Side SPA (Vite). There is no backend API to write files (e.g., `shai.settings.json`) directly to the disk.

## 3. Findings & Final Architectue (Updated)
We initially explored "Shadow Persistence" using LocalStorage, but this proved problematic for cross-browser synchronization and was redundant.

### Final Decision: File Persistence (Middleware)
We implemented a **Vite Middleware** solution that allows the frontend to write changes securely back to the source JSON file in the `public/data` directory.

1.  **Schema**: Updated `NodeSchema` to include `position: {x, y}` and `AttackGraphSchema` to include `viewport`.
2.  **Middleware**: `vite-plugin-json-save` intercepts `/api/save` POST requests and writes to disk.
3.  **Store**: `useLayoutStore` acts as a temporary in-memory session cache.
4.  **Priority**: logic prioritizes `File Data` (Loaded) -> `Session Moves` (Memory) -> `File Write`.

## 4. Required Code Changes (Implemented)

### 1. `src/core/store/useLayoutStore.ts`
Manage in-memory layout state (session moves).

### 2. `src/ui/features/GraphCanvas/GraphCanvas.tsx`
Logic:
1.  Load nodes.
2.  If file has positions -> Use them (Preset Layout).
3.  If user moves node -> Update Memory Store -> Trigger Auto-Save.

### 3. `src/core/store/usePersistence.ts`
Hook that subscribes to store changes, debounces them (1s), and POSTs the full JSON (merged with original data) to the middleware.

## 5. Future "File" Support
This architecture roughly mimics a production backend where an API would persist changes to a database or file storage.
