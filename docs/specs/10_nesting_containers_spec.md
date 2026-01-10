# Spec 10: Nesting Containers (Compound Nodes) Specification

**Status:** Draft
**Related:** `docs/specs/1_data_modeling_spec.md`
**Legacy Source:** `Old_Code/docs/specs/10-internal-attack-modeling.md`

## 1. Overview
This specification details the implementation of **Hierarchical Trust Boundaries** (e.g., A process *inside* an OS *inside* a Virtual Machine).
In Cytoscape terms, this is achieved via **Compound Nodes**.

**Core Requirements:**
1.  **Visual Containment**: Child nodes must move with their parents.
2.  **Boundary Styles**: Explicit visual cues for "Network" vs "Kernel" vs "Protected" boundaries.
3.  **Recursive Layout**: The Dagre layout must respect strict hierarchy.

## 2. Data Structure (`GraphNode`)

The `GraphNode` interface (Spec 1) already supports `parent?: string`.
This spec strictly defines the rules for that field.

### 2.1 Hierarchy Rules
*   **Root Level**: Nodes with `parent: undefined`.
*   **Container**: A node with `type: 'container'` that acts as a parent.
*   **Leaf**: Atomic entities (`device`, `process`, `credential`).

### 2.2 Boundary Metadata
Containers carry metadata to define their styling:
```typescript
interface ContainerMetadata {
   boundary: 'network' | 'machine' | 'kernel' | 'protected' | 'container';
   labelPosition?: 'top' | 'bottom';
}
```

## 3. Implementation Strategy

### 3.1 Cytoscape Configuration
Cytoscape supports compound nodes natively. We just need to ensure the element JSON is flat but contains `data.parent` references.

```typescript
// correct structure for cytoscape
[
  { group: 'nodes', data: { id: 'parent_vm', label: 'Victim PC' } },
  { group: 'nodes', data: { id: 'child_proc', parent: 'parent_vm', label: 'calc.exe' } }
]
```

### 3.2 Parsing Logic (Recursive)
When parsing JSON or Legacy Text:
1.  **Nodes First**: All nodes are collected.
2.  **Parent Resolution**: Ensure every `parent` ID exists in the node list.
    *   *Validation Rule*: If `parent` ID is missing, hoist the child to Root (prevent crash) and log warning.
3.  **Cycle Detection**: Ensure no circular parent references (A > B > A).

## 4. Visual Styles (The "Trust Boundary" Theme)

We translate the legacy CSS classes into Cytoscape Stylesheet selectors.

| Boundary Type | Selector | Visuals |
|---------------|----------|---------|
| **Network** | `[boundary="network"]` | Dotted Gray Border, Transparent BG. |
| **Machine** | `[boundary="machine"]` | Solid Slate Border, slight Gray fill (`bg-slate-900/50`). |
| **Kernel** | `[boundary="kernel"]` | Dashed Purple Border (`border-purple-500`). |
| **Protected** | `[boundary="protected"]` | Dashed Red Border (`border-red-500`), Red Text. |
| **Container** | `[boundary="container"]` | Dashed Blue Border (`border-blue-500`). |

### 4. Layout Constraints (The Overlap Solution)
Deeply nested containers pose a challenge for layout engines. Standard layouts often calculate spacing based on the *leaves*, causing the *intermediate* container borders to overlap.

**Strategy: Adaptive Layout Injection**
We solve this by injecting layout hints directly into the Container Node data.

1.  **Leaf Nodes**: Inherit global spacing settings (Standard).
2.  **Container Nodes**: Receive "Heavy" spacing settings via the `elk` data property.

#### Data Injection Logic
When transforming nodes for Cytoscape, if a node is a `container`:
```typescript
{
    group: 'nodes',
    data: {
        id: 'container_id',
        // ...
        elk: {
            'elk.direction': 'RIGHT',
            'elk.algorithm': 'layered',
            // Force massive separation between this container and its siblings
            'elk.spacing.nodeNode': '200',
            'elk.layered.spacing.nodeNodeBetweenLayers': '200',
            // Reserve internal space for the label and border
            'elk.padding': '[top=100,left=100,bottom=100,right=100]' 
        }
    }
}
```
This forces the layout engine to treat containers as "Large blocks" requiring significant buffer zones, resolving the overlap issue.

## 5. Interaction
*   **Collapse/Expand**: (Future Phase) Ability to double-click a boundary to collapse it into a single node.
*   **Drag**: Dragging a parent moves all children. (Native Cytoscape behavior).

## 6. Testing Checklist
1.  **Parsing**: Nested structure in JSON -> Correct `parent` fields in Cytoscape elements.
2.  **Rendering**: "Protected" boundary looks visually distinct (Red Dashed).
3.  **Layout**: No child node overlaps the parent border.
