# Spec 3: Parsing Input Specification

**Status:** Draft
**Related:** `docs/specs/2_json_input_spec.md`
**Legacy Source:** `Old_Code/docs/specs/02-parser.md`

## 1. Overview
The **Input Parsing System** is the gateway for data entering `CyberViewer-Cyto`. It is responsible for converting raw input (JSON files or Legacy Mermaid text) into the strict, type-safe `AttackGraph` structure defined in Spec 1.

**Core Principle:** "Parse, Validated, or Reject." No invalid data reaches the core Graph Engine.

## 2. Architecture
The parsing logic resides in `src/core/parser/`.

```mermaid
flowchart LR
    Input[Raw Input\n(.json / .txt)] --> Detector[Format Detector]
    
    Detector -- JSON --> ZodValidator[Zod Validator]
    Detector -- Mermaid --> MermaidAdapter[Legacy Mermaid Adapter]
    
    MermaidAdapter --> ZodValidator
    
    ZodValidator -- Valid --> AttackGraph[Typed AttackGraph]
    ZodValidator -- Invalid --> Error[Parse Error]
```

## 3. The `ParserHost`
A singleton service that coordinates the parsing pipeline.

### 3.1 Interface
```typescript
interface ParserResult {
    success: boolean;
    data?: AttackGraph;
    errors?: string[]; // Human readable errors
    metadata: {
        format: 'json' | 'mermaid';
        parseTime: number;
    }
}

class ParserHost {
    async parse(content: string): Promise<ParserResult>;
}
```

## 4. Sub-Component: JSON Parser (Primary)
The "Happy Path" for modern data.
1.  **Parse**: `JSON.parse(content)`
2.  **Validate**: `AttackGraphSchema.safeParse(obj)`
3.  **Error Handling**: Convert Zod errors into friendly messages (e.g., "Node 'kali' is missing required field 'type'").

## 5. Sub-Component: Legacy Mermaid Adapter
To support "Old Features" (text-based diagrams), we implement the logic described in `Old_Code/docs/specs/02-parser.md`.

**Responsibilities:**
1.  **Regex Parsing**: Extract Nodes (`id[label]`) and Edges (`A --> B`).
2.  **Entity Inference**:
    *   Detect `type` based on prefix (`proc_` -> `process`).
    *   Detect `boundary` based on subgraph labels ("Protected" -> `kernel`).
3.  **Edge Mapping**:
    *   `-->` -> `type: normal`
    *   `-.->` -> `type: illegal`
    *   `==>` -> `type: impact`
4.  **Transformation**: Construct a valid JSON object matching `AttackGraphSchema`.

### 5.1 Mermaid Regex Strategy
We will reuse the robust patterns defined in the legacy documentation:
*   **Nodes**: `/(\w+)\s*\[\s*"([^"]+)"\s*\]/`
*   **Edges**: `/(\w+)\s*(-{1,2}|={1,2}|\.{1,2})(?:\s*"([^"]*)")?\s*(-{1,2}>|={1,2}>|\.{1,2}>)\s*(\w+)/`

## 6. Validation Layer (Zod)
This is the final gatekeeper. Even data parsed from Mermaid must pass this check.
*   **Referential Integrity**: Checks that every `edge.source` and `edge.target` exists in `nodes`.
*   **Hierarchy Check**: Ensures `node.parent` refers to a valid `container` node.

## 7. Error Reporting
The parser must provide **Actionable Feedback** to the user (or LLM).

**Example Error:**
> "Parsing Failed on Line 14: Node 'proc_lsass' has parent 'dc_01', but 'dc_01' is not defined."

## 8. Implementation Plan
1.  **Setup**: Install `zod`.
2.  **Schemas**: Implement `src/core/schemas/graph.zod.ts` (from Spec 1).
3.  **Adapter**: Port Regex logic from legacy docs to `src/core/parser/MermaidAdapter.ts`.
4.  **Host**: Build `ParserHost.ts`.
5.  **Tests**: Unit tests with:
    *   Valid JSON
    *   Invalid JSON (Schema violation)
    *   Valid Mermaid (Complex Flowchart)
    *   Broken Mermaid
