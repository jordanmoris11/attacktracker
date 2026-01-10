# Spec 7: Animation Specification

**Status:** Draft
**Related:** `docs/specs/4_rendering_with_cytoscape.md`
**Legacy Source:** `Old_Code/js/animation/CytoscapeAnimator.js`, `Old_Code/js/ui/ControlPanel.js`

## 1. Overview
The **Animation System** transforms the static attack graph into a dynamic "Replay" of the cyber incident. It allows users to step through the attack timeline, revealing edges and nodes sequentially.

**Core Concept:** "Declarative State." The current `step` index determines the visual state of the graph. We move away from imperative `.animate()` calls where possible.

## 2. Architecture (`src/core/animation/`)

We manage the timeline state globally using **Zustand**.

### 2.1 The Store (`useAnimationStore`)
```typescript
interface AnimationState {
  currentStep: number;  // 0 = Start (No edges), 1 = First edge visible
  totalSteps: number;
  isPlaying: boolean;
  speed: number;        // 1x, 2x, etc.
  
  // Actions
  setTotalSteps: (n: number) => void;
  goToStep: (n: number) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (s: number) => void;
}
```

### 2.2 The Logic Hook (`useAnimationLoop`)
A standard React hook that handles the `setInterval` logic when `isPlaying` is true.
*   **Interval**: `2000ms / speed` (Legacy compatibility).
*   **Logic**: Increments `currentStep` until `totalSteps`. Pauses at end.

## 3. Visual Synchronization
How do we update the graph?

### 3.1 The `AnimationSyncer` (in `GraphCanvas`)
Inside the Cytoscape component, we listen to `currentStep` changes.

**Logic Rules:**
1.  **Step 0 is Empty**: When `currentStep === 0`, ALL edges are hidden (`display: none`).
2.  **Fallback Sizing**: If edge data lacks explicit `step` fields, we assume sequential index 1-based order (Index 0 = Step 1).
3.  **Strict State**: Visibility classes must be stripped before applying new ones to avoid CSS state leakage.

```typescript
// Conceptual Implementation
useEffect(() => {
  if (!cy) return;
  
  cy.batch(() => {
    // 1. Get all edges sorted by sequence (defined in Spec 1/2)
    const allEdges = cy.edges().sort((a, b) => a.data('stepIndex') - b.data('stepIndex'));
    
    // 2. Apply Visibility
    allEdges.forEach((edge, idx) => {
      // Step Index is 1-based (Step 1 shows Edge 0)
      if (idx < currentStep) {
        edge.addClass('visible');
        edge.removeClass('hidden');
        
        // Highlight logic
        if (idx === currentStep - 1) {
           edge.addClass('active-edge'); // The "Action" happening now
           edge.target().addClass('active-node');
        } else {
           edge.removeClass('active-edge');
           edge.target().removeClass('active-node');
        }
      } else {
        edge.addClass('hidden');
        edge.removeClass('visible active-edge');
      }
    });
  });
}, [currentStep, cy]);
```

## 4. Visual Styles (Cytoscape Theme)
We define specific classes in `cytoscape-theme.ts` (Spec 6 extension):
*   `.hidden`: `opacity: 0`, `events: no` (User can't click unseen edges).
*   `.visible`: `opacity: 1`, `transition-property: opacity`, `transition-duration: 500ms`.
*   `.active-edge`: 
    *   `width`: 6px (Thicker)
    *   `line-color`: (Inherits data color but brighter)
    *   `target-arrow-color`: (Inherits data color)
    *   `shadow-blur`: 10px (Glow effect)

## 5. UI Controls (`src/ui/features/Animation/AnimationControls.tsx`)
A "Glass Panel" containing:
1.  **Scrubber**: Simple progress bar.
2.  **Playback**: `Prev`, `Play/Pause`, `Next` buttons. (Reset/Refresh is optional/contextual).
3.  **Positioning**: Absolute floating panel at the **bottom-center**, scaled (110%) for visibility.
4.  **Z-Index**: High z-index to sit above the Matrix Explorer or Canvas.

## 6. Camera Movement
Legacy code hinted at camera following. We will implement an optional **Auto-Focus** feature.
-   When stepping, use `cy.animate({ fit: { eles: activeNode }, duration: 300 })` to center the action.
-   This needs a "Camera Follow" toggle in the UI (default: Off).

## 7. Implementation Plan
1.  Setup `useAnimationStore`.
2.  Create `AnimationControls` UI component.
3.  Implement `AnimationSyncer` hook in `GraphCanvas`.
4.  Add `.hidden` / `.visible` / `.active` styles to Cytoscape theme.
