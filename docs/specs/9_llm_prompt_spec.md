# Spec 9: LLM Prompt Strategy

**Status:** Active & Strict
**Related:** `docs/llm-prompt-json-only.md`, `docs/mitre-reference.md`

## 1. Overview
The **System Prompt** is the critical interface between the unstructured CTI world and our structured `CyberViewer-Cyto` engine.

**Philosophy**: "The LLM is a Scriptwriter, not a Graph Designer."
*   We do NOT ask it to "draw a graph".
*   We ask it to "write a movie script" (Cast, Steps, Visibility).

## 2. Key Constraints (Unbreakable Rules)

### 2.1 No Hallucinated Utilities
*   **Colors**: The LLM is FORBIDDEN from choosing colors. Hex codes are removed from the schema.
    *   *Why*: LLMs pick ugly colors. The UI Theme handles this deterministically based on `icon` or `type`.
*   **Icons**: The LLM must select from a **Strict Allowlist** (e.g., `IconAttacker`, `IconServer`).
    *   *Why*: Reduces dead links.
    *   *Implementation*: The prompt lists every valid key explicitly.

### 2.2 Unambiguous MITRE Mapping
*   We inject `docs/mitre-reference.md` into the context.
*   The LLM must cite specific T-Codes found in that file.

## 3. The Prompt Structure
See `docs/llm-prompt-json-only.md` for the live artifact.

1.  **Role**: CTI Analyst & Movie Director.
2.  **Mental Model**: "Entities = Cast", "Steps = Script".
3.  **Schema Contract**: The exact JSON keys required.
4.  **Strict Icon Table**: The "Menu" of available assets.
5.  **Few-Shot Example**: A perfect example demonstrating the "No Color" and "PascalCase Icon" rules.

## 4. Temperature & Sampling
*   **Temperature**: `0.1` (Extremely Low). We want structural rigidity, not creativity.
*   **Model Recommendation**: `Gemini 1.5 Pro` or `GPT-4o` (High reasoning for T-Code mapping).

## 5. Future Improvements
*   **Auto-Correction**: A middleware could fuzzy-match "hacker_icon" to "IconAttacker" if the LLM slips. (Currently partially handled by `ScenarioAdapter` fallback).
*   **Validation Loop**: Feed validation errors back to the LLM for self-correction.
