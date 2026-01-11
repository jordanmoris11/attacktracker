# Research: Animation Visibility (Show/Hide Nodes)

## 1. Goal
Enable nodes (e.g., Malware, Attacker tools) to remain hidden at the start of an animation and only appear at a specific timeline step.

**Constraint:** Do not modify the JSON schema or Prompt yet. Focus strictly on the UI implementation strategy.

## 2. Current Architecture
*   **Store**: `useAnimationStore` holds `currentStep`.
*   **Renderer**: `GraphCanvas.tsx` runs basic visibility logic.
*   **Theme**: `cytoscape-theme.ts` has `.hidden` (`display: none`) and `.visible` (`opacity: 1`) classes.

## 3. Findings

### 3.1 Edge Visibility (Existing Status)
Currently, `GraphCanvas` iterates through **edges only** inside the `useEffect` hook that listens to `currentStep`.
```typescript
cyEdges.forEach((edge) => {
   // Logic to show/hide based on edge.data('step')
});
```

### 3.2 Node Visibility (Missing)
Nodes currently have no such logic; they are effectively "Step 0" citizens that exist forever.

To implement "Show/Hide":
1.  We need to treat nodes similarly to edges.
2.  We need to access a property (conceptually `node.data('appearStep')`) to determine visibility.

### 3.3 Layout & Stability (Crucial)
**The Risk**: If we apply `display: none` to nodes *before* the initial layout (Dagre) runs, Dagre will ignore them, resulting in a different graph shape (or a crash if edges connect to non-existent nodes).

**The Solution**:
1.  **Initialize**: Load all nodes and edges as visible (or at least "layout-able").
2.  **Calculate Layout**: Run `dagre` or `preset` to assign `(x, y)` to *all* nodes, including future ones.
3.  **Apply Initial Visibility**: Immediately *after* layout completes (or as a final step of the batch), apply the `.hidden` class to nodes whose `appearStep > 0`.
4.  **Runtime**: In the animation loop (`useEffect`), update the classes.

This ensures the "Global Map" is stable, and actors just "pop in" at their pre-determined locations.

### 3.4 Compound Containers
If a node is inside a Container (Compound Node):
*   Does the container hide if empty?
*   Strategy: Containers usually represent static infrastructure (Networks, Clouds). They should likely default to `step: 0` (Always Visible). If a specific container *is* transient (e.g., a temporary docker container), it can have an explicit step.
*   **Rule**: Child visibility is independent of Parent, BUT if Parent is hidden, Children are effectively hidden.

## 3. Findings & Strategy Refinement

### 3.1 The "Ghost Node" Strategy (User Feedback)
**Problem**: If we completely hide nodes (`display: none`), containers will collapse (as they auto-size to fit visible children), and users cannot manually rearrange "future" nodes during the setup phase.

**Solution**: Do not remove nodes from the DOM/Graph. Instead, use a **"Pending" State**.

*   **Step < Current**: `Visible` (Standard opacity 1, full color).
*   **Step > Current**: `Pending` (Ghost Mode).
    *   `opacity: 0.2` (Transparent but visible).
    *   `grayscale: 1` (Black and white).
    *   `events: yes` (User can still drag them!).

### 3.2 Benefits
1.  **Layout Stability**: Since the nodes are physically present, the layout (`dagre` or `preset`) accounts for them. Containers remain expanded to fit the "future" graph.
2.  **UX**: The user sees the full scope of the attack infrastructure immediately but understands what is "active" vs "yet to happen".
3.  **Animation**: Transitioning `opacity` from 0.2 to 1.0 is smoother than `display: none` -> `block`.

### 3.3 Implementation Plan (UI Only)

#### Update `GraphCanvas.tsx` Syncer
```typescript
cyNodes.forEach(node => {
    const appearStep = node.data('step') || 0; 
    const isVisible = appearStep <= currentStep;
    
    if (isVisible) {
         node.removeClass('pending').addClass('visible');
    } else {
         node.removeClass('visible').addClass('pending');
    }
});
```

#### Update `cytoscape-theme.ts`
```typescript
{
    selector: '.pending',
    style: {
        'opacity': 0.15,
        'filter': 'grayscale(100%)', // Optional: requires cytoscape extension or just use color overrides
        'transition-property': 'opacity',
        'transition-duration': 500
    }
}
```

## 4. Compound Containers
With the Ghost Strategy, containers work automatically.
*   If a container contains only "Pending" nodes, it will still naturally enclose them.
*   The container itself handles its own visual state (it usually exists at Step 0 as infrastructure).

## 5. Data Modeling Strategy

To support the "Ghost Node" logic, we need the data to tell us *when* a node should appear.

### 5.1 Schema Update (`NodeSchema`)
We add an optional `step` field to the Node object.
*   `step: 0` (or missing): **Default**. The node is part of the initial infrastructure (e.g., Victim PC, Corporate Network, Cloud). It is always visible/ghosted based on context, but typically infrastructure is present from start.
*   `step: N` (> 0): The node "appears" or is deployed at Step N. Before Step N, it is a Ghost.

### 5.2 Container Rules
*   **Infrastructure Containers** (e.g., Corporate Network): `step: 0`. Always present.
*   **Transient Containers** (e.g., "Docker Swarm" created by attacker): Can have `step: N`.
*   **Visibility Logic**: If a Container is pending/ghosted, its children (even if step 0) are visually grouped within that ghosted boundary.

### 5.3 LLM Prompting
We must instruct the LLM:
1.  **Infrastructure First**: Define servers, networks, and victims at Step 0 (omit field).
2.  **Attack Tools Later**: If an attacker drops "Malware.exe" at Step 3, that node should have `"step": 3`.
