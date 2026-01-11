# Spec 4: Rendering Specification

**Status:** Active
**Related:** `src/ui/features/GraphCanvas/GraphCanvas.tsx`

## 1. Overview
The **GraphCanvas** is the main stage. It renders the `Scenario` using `Cytoscape.js`.
Unlike the legacy system, it does **not** assume a static graph. It renders a dynamic "Movie Frame".

## 2. Layout Strategy: Preset
*   **Layout**: `preset`
*   **Source**: coordinates are read directly from `entity.position` in the JSON.
*   **Rationale**: LLMs/Users define the "Stage Set" once. We do not re-layout during the animation.

## 3. The Render Loop (Animation)
The canvas reacts to `currentStep` changes in `useScenarioStore`.

### 3.1 Step 1: Visibility (Who is on stage?)
Iterate all nodes:
*   Check `visibility[nodeId]`.
*   If `currentStep` is within `start/end`, remove `.hidden` class.
*   Else, add `.hidden` class.

### 3.2 Step 2: Ephemeral Edges (What is happening?)
*   **Clear**: `cy.edges().remove()`. All edges are temporary.
*   **Draw**: If the current step is type `edge`:
    *   Create a new edge from `step.from` to `step.to`.
    *   Apply label `step.name`.
    *   Style it (icon traveling, etc.).

### 3.3 Step 3: Text Events
*   If current step is type `show_text`:
    *   Find `target_entity`.
    *   Apply `.highlighted` class (or show Overlay).

## 4. Component Architecture
*   `GraphCanvas`: Wraps the Cytoscape instance.
*   `ContainerHeaderRenderer`: Pure canvas drawing for Container Titles + Icons (since Cytoscape compound nodes have limited styling).
