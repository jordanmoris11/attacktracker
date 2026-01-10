# Spec 5: UI Icons & Containers Specification

**Status:** Draft
**Related:** `docs/specs/1_data_modeling_spec.md`, `docs/specs/4_rendering_with_cytoscape.md`
**Legacy Source:** `Old_Code/docs/specs/01-icon-system.md`, `Old_Code/config/icons.registry.js`

## 1. Overview
The **Icon System** provides visual identity to the abstract nodes in our graph. It ensures that a "Kali Linux" node looks like a hacker machine, and a "Database" looking like a database.

**Core Requirement:**
1.  **Async Loading**: SVGs are fetched on-demand (lazy loaded) to keep bundle size small.
2.  **Type Safety**: The registry is strict. No "magic strings" in the code.
3.  **Containers**: Containers are visually distinct "Trust Boundaries" that group nodes.

## 2. Icon Architecture (`src/core/graph/IconManager.ts`)

We will port the legacy `IconLoader` but wrap it in a React-friendly Type-Safe Manager.

### 2.1 The Registry (`src/shared/config/icons.registry.ts`)
A constant dictionary mapping semantic types to asset definitions.

```typescript
export const ICON_REGISTRY = {
  kali: { file: 'kali.svg', color: '#2B79C2', keywords: ['kali', 'attacker'] },
  server: { file: 'server.svg', color: '#3B82F6', keywords: ['server', 'srv'] },
  user: { file: 'user.svg', color: '#64748B', keywords: ['user', 'client'] },
  // ... full legacy list
} as const;

export type IconKey = keyof typeof ICON_REGISTRY;
```

### 2.2 The Manager
A singleton logic class (no UI) responsible for fetching.
-   **Cache**: `Map<string, string>` (Url -> SVG Content).
-   **Method**: `getIconPath(key: IconKey): string` -> Returns the URL to the asset (e.g., `/assets/icons/kali.svg`).
-   **Note**: Cytoscape prefers *URLs* for `background-image`, not raw SVG string injection (unlike inline HTML). The legacy `IconLoader` fetched text content, but for Cytoscape, we primarily need the **Path**.
    -   *Correction*: Spec 4 uses `background-image: data(iconPath)`. So we just need to resolve the path.

## 3. Container Visualization
Containers (Subgraphs) represent **Trust Boundaries**. They must be:
-   **Transparent**: Allowing edges to pass through visible.
-   **Bound**: Dashed lines indicating the perimeter.
-   **Labeled**: Clear title at the top.

### 3.1 Styling Rules (to be implemented in Cytoscape Stylesheet)
| Property | Value | Notes |
|----------|-------|-------|
| `shape` | `roundrectangle` | Soft corners |
| `background-color` | `#ffffff` | |
| `background-opacity` | `0.02` | Barely visible tint |
| `border-width` | `4px` | Distinct boundary |
| `border-style` | `dashed` | "Virtual" boundary metaphor |
| `border-color` | `#475569` | Slate-600 |
| `padding` | `48px` | Breathing room for children |

## 4. Icon Assignment Logic (The "Detector")
How do we know which icon to use?
1.  **Explicit**: JSON `node.icon` field (e.g., `"icon": "kali"`). -> **Primary**.
2.  **Inferred**: The `LegacyMermaidAdapter` (Spec 3) uses reasonable defaults based on node type (`process` -> `process.svg`).
3.  **Fallback**: `default.svg`.

## 5. React Integration
The `GraphCanvas` component doesn't need to "load" icons manually. It simply passes the `iconPath` string to Cytoscape.
-   **Preloading**: Optional. We can render hidden `<img>` tags or use `Link rel="preload"` if we notice flash-of-invisible-content (FOIC), but browsers generally handle background-image loading well.

## 6. Migration of Assets
We must copy all `.svg` files from `Old_Code/assets/icons/` to `public/assets/icons/`.
**Critical**: Ensure the `ICON_REGISTRY` filenames match exactly the physical files.

## 7. Testing
-   **Unit**: `IconManager.resolve('kali')` returns correct path.
-   **Visual**: Verify icons appear in the GraphCanvas storybook/dev view.
