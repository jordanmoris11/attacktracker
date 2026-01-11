# Spec 8: MITRE Integration Specification

**Status:** Active
**Related:** `docs/mitre-reference.md`, `src/ui/features/MatrixExplorer`

## 1. Overview
The **MITRE Integration** turns the Graph into a Threat Intelligence tool.
Unlike Legacy V1 (which regex-matched keywords), V2 relies on **LLM Precision**.

## 2. Enrichment Strategy
*   **Source**: The LLM selects T-Codes (e.g., `T1595`) during generation.
*   **Validation**: `ScenarioSchema` allows an optional `mitre` object on every step.
    ```typescript
    mitre: {
        id: "T1595",
        tactic: "Reconnaissance",
        technique: "Active Scanning"
    }
    ```
*   **Ref**: The LLM is given `docs/mitre-reference.md` as context to ensure accuracy.

## 3. The Matrix Explorer (`MatrixExplorer.tsx`)
A UI Component that acts as a "Dashboard" for the attack.

### 3.1 Features
1.  **Kill Chain Visualization**: Displays all 12 Tactics.
2.  **Active Highlighting**:
    *   **Static**: Highlights techniques present in the Scenario.
    *   **Dynamic**: When an animation step plays, the specific T-Code "Pulses" in the matrix.

## 4. Mitre Index
`src/shared/config/mitre-index.ts` (Auto-generated) provides the lookup table for Tactic Categories and Metadata, ensuring the UI Renders the correct Matrix structure.
