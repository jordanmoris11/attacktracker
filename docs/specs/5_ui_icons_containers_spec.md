# Spec 5: UI Icons & Containers Specification

**Status:** Active & Strict
**Related:** `src/shared/config/icons.registry.ts`

## 1. Overview
Visual identity is critical for rapid comprehension.
We use a **Strict Icon Registry** to ensure that "Hacker" always looks like a Hacker, and "Server" always looks like a Server.

## 2. The Registry
Located in `src/shared/config/icons.registry.ts`.
This file is the **Single Source of Truth** for:
1.  **Keys**: Logical names (e.g., `IconAttacker`, `IconServer`).
2.  **Files**: Physical SVG paths (e.g., `attacker.svg`).
3.  **Brand Color**: The default color associated with that role.

### 2.1 Strict Keys
The system (and LLM) must use the exact PascalCase keys defined in the registry.
*   ✅ `IconAttacker`
*   ❌ `attacker`
*   ❌ `hacker-icon`

## 3. Resolving Icons
The `ScenarioAdapter` uses `getIconPath(key)` to resolve the SVG path.
*   **Input**: `IconFirewall`
*   **Output**: `/assets/icons/firewall.svg`
*   **Fallback**: If the key is missing/invalid, it returns `IconDefault` (`default.svg`).

## 4. Container Visualization
Containers represent **Trust Boundaries** (e.g., Subnets, Clouds).
*   **Visualization**: Dashed border, translucent background.
*   **Icon**: Typically `IconCloud` or a generic folder icon.
*   **Header**: We render a custom "Badge" at the top of the container with the Icon + Label.

## 5. Asset Management
*   All SVGs live in `public/assets/icons/`.
*   They are loaded by the browser via standard `image()` references in Cytoscape.
