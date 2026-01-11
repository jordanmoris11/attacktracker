# Spec 1: Data Modeling Strategy

**Status:** Active & Strict
**Architecture:** Scenario-Timeline ("The Movie Model")
**Schema:** `src/shared/schemas/scenario.schema.ts`
**Icons:** `src/shared/config/icons.registry.ts`

## 1. Core Philosophy
The data model treats a cyber attack not as a static graph, but as a **scripted scenario** consisting of:
1.  **Cast (Entities)**: All actors, devices, and containers involved.
2.  **Script (Timeline)**: A chronological sequence of actions (Edges) or events (Text).
3.  **Direction (Visibility)**: A map defining when each actor is on "stage".

## 2. Strict Constraints (The "No Hallucination" Rules)
To ensure reliability with LLM generation:
1.  **No Explicit Colors**: Entities and Edges DO NOT define hex codes. Visuals are derived deterministically from the `icon` or `style` type.
2.  **Strict Icon Keys**: Icons must match keys in the **Icon Registry** (e.g., `IconAttacker`, `IconServer`). No "magic strings" or file paths.
3.  **Flat Hierarchy**: Containers do not "contain" nodes in the object graph. Instead, containers list their `members` (ID references).

## 3. Data Structure

### 3.1 Scenario Root
```typescript
interface Scenario {
  title: string;
  description?: string;
  version: "2.0";
  viewport?: { zoom: number, pan: { x, y } };
  entities: ScenarioEntity[];
  visibility?: VisibilityMap;
  steps: TimelineStep[];
}
```

### 3.2 Entities
Entities are the nouns of the scenario. They are persistent (they don't strictly "move" in data, though visuals can layout them).

| Type | Computed Style | Required Fields |
| :--- | :--- | :--- |
| **Node** | `icon` defines image & brand color | `id`, `label`, `type="node"`, `icon`, `position` |
| **Container** | Dashed Border, Title Header | `id`, `label`, `type="container"`, `members`, `width`, `height` |
| **TextBox** | Alert Box / Toast Style | `id`, `label`, `type="text_box"`, `icon` (optional) |

**Note on Icons**: The `icon` field MUST be a PascalCase key from the registry (e.g. `IconFirewall`).

### 3.3 Visibility Map
Defines the *temporal existence* of entities.
*   **Key**: `entity_id`
*   **Value**: `{ start: number, end: number }` (Inclusive step indices).
*   **Default**: If absent, entity is **always visible**.

### 3.4 Timeline Steps
Steps are the verbs. They are polymorphic.

#### Type: `edge` (Movement/Action)
Draws a **temporary** connection between two entities.
*   **Fields**: `from`, `to`, `name` (label), `icon` (moving marker), `tooltip`.
*   **Behavior**: Appears ONLY during this step. Disappears when moving to next step.
*   **MITRE**: Optional `mitre` object (`id`, `tactic`, `technique`).

#### Type: `show_text` (Narrative/Event)
Highlights an entity or shows a global message.
*   **Fields**: `target_entity` (ID), `content` (Message), `style` (e.g., warning).
*   **Behavior**: Highlight persists only for this step.

## 4. Migration from Legacy
*   **Legacy**: `parent` field on child nodes. -> **New**: `members` array on Container.
*   **Legacy**: `step` number on edges. -> **New**: `steps` array index order.
*   **Legacy**: Hex colors in JSON. -> **New**: Removed. Colors controlled by React/CSS theme.
