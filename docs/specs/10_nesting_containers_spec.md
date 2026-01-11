# Spec 10: Nesting Containers Specification

**Status:** Active
**Related:** `src/shared/schemas/scenario.schema.ts`

## 1. Overview
Containers represent **Trust Boundaries** (Subnets, Clouds, VPCs).
*   **Legacy V1**: Used `parent` ID on children.
*   **Scenario V2**: Uses `members` array on Parent (LLM Optimized).

## 2. Data Structure
The `ScenarioSchema` defines containers as:
```typescript
{
  id: "dmz_zone",
  type: "container",
  members: ["web_server", "api_gateway"], // <--- The Source of Truth
  width: 300,
  height: 400,
  style: "dashed_border"
}
```

## 3. Parsing Logic (`ScenarioAdapter`)
Cytoscape requires the *inverse* relationship.
1.  **Parse**: Adapter reads `members`.
2.  **Flatten**: Adapter finds child nodes and assigns `data.parent = container.id`.
3.  **Result**: Cytoscape Compound Nodes work natively.

## 4. Visuals
*   **Layout**: V2 uses `preset` layout. The JSON provides exact coordinates. Containers boundaries are drawn by Cytoscape around the children (plus padding/width attributes).
*   **Styling**:
    *   `dashed_border`: Used for Networks/Clouds.
    *   Title Header: Drawn by `ContainerHeaderRenderer`.
