# Spec 7: Animation Specification

**Status:** Updated for Scenario-Timeline Architecture
**Related:** `src/core/parser/ScenarioAdapter.ts`, `src/ui/features/GraphCanvas/GraphCanvas.tsx`

## 1. Overview
The **Animation System** transforms the static attack graph into a dynamic "Movie".
It allows users to step through the `steps` array defined in the JSON.

**Difference from v1**: Edges are **Cumulative**. They persist to show the history of the attack path, unless explicitly hidden (future). Active step is highlighted.

## 2. Architecture (`src/core/store/useScenarioStore`)

We manage the timeline state globally using the centralized `useScenarioStore`.

### 2.1 State
```typescript
interface ScenarioState {
  currentStep: number;  // 0-indexed pointer to steps array
  timeline: TimelineStep[]; 
  isPlaying: boolean;
  
  // Actions
  setStep: (n: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  togglePlay: () => void;
}
```

## 3. Visual Synchronization (The "GraphCanvas" Loop)

Inside `GraphCanvas.tsx`, we react to `currentStep` changes.

### 3.1 Node Visibility (The Cast)
We check the `visibility` map for every node.
*   **Visible**: `start <= currentStep <= end`.
*   **Hidden**: Node is removed or hidden via CSS class (`display: none`).
*   **Optimization**: Use `cy.batch()` to apply these updates efficiently.

### 3.2 Polymorphic Steps (The Action)

We look at `steps[currentStep]`.

#### Type: `edge`
1.  **Cumulative Rebuild**: Iterate from step 0 to `currentStep`.
2.  **Add Edges**: Add all edges found in this range.
3.  **Styling**:
    *   **Active Step**: Amber color, thicker line.
    *   **History**: Slate color, thinner line.

#### Type: `show_text`
1.  **Clear All Edges**: Text steps usually pause the action, so edges are removed.
2.  **Highlight Target**: Find `step.target_entity` and add a `.highlighted` class.
3.  **Show Overlay**: (Future) Render a React Overlay component on top of the canvas with the text content.

## 4. UI Controls
A floating control bar (currently inline in App.tsx, to be refactored to `AnimationControls.tsx`) provides:
*   **Prev / Next**: Single step navigation.
*   **Scrubber**: Slider mapped to `0..totalSteps`.
*   **Play/Pause**: Automates `nextStep()` with a delay.

## 5. Camera Movement
*   **Auto-Focus**: Optionally, the camera can pan to the `step.to` node or `step.target_entity` when the step changes.
*   **Viewport Locking**: The JSON defines an initial viewport. Users can pan/zoom freely unless "Camera Follow" is enabled.
