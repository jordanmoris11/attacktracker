# Spec 3: Parsing Input Specification

**Status:** Active
**Related:** `src/core/parser/ScenarioAdapter.ts`

## 1. Overview
Input parsing is the gatekeeper. We accept **JSON ONLY**.
The **ScenarioAdapter** is responsible for converting the "LLM-Optimized" JSON format into "Cytoscape-Ready" elements.

## 2. The ScenarioAdapter
Located in `src/core/parser/ScenarioAdapter.ts`.

### 2.1 Responsibilities
1.  **Validation**: Uses `zod` to strictly validate the input against `ScenarioSchema`.
2.  **Container Flattening**:
    *   **Input**: Parent has `members: ["child1", "child2"]`.
    *   **Output**: Child element has `data: { parent: "parent_id" }`.
    *   *Why*: Cytoscape requires the `parent` pointer on the child, but LLMs prefer listing children under the parent.
3.  **Icon Resolution**:
    *   **Input**: `icon: "IconAttacker"` (PascalCase key).
    *   **Output**: `data: { iconPath: "/assets/icons/attacker.svg", color: "#EF4444" }`.
    *   *Logic*: Looks up the key in `ICON_REGISTRY`. If missing, falls back to `IconDefault`.

## 3. Error Handling
*   **Schema Errors**: If Zod fails, returns a list of specific field errors (e.g. "entities[0].icon is missing").
*   **Logic Errors**: If a container lists a member ID that doesn't exist, the adapter flattens it gracefully (or logs a warning).

## 4. Output
Returns a `ParseResult` object:
```typescript
{
  success: boolean;
  data: ScenarioData; // The raw JSON
  cyElements: ElementDefinition[]; // Nodes with resolved icons/parents
  errors: string[];
}
```
