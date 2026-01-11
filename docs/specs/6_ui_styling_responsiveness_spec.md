# Spec 6: UI Styling & Responsiveness

**Status:** Active
**Stack:** Tailwind CSS v3.4+

## 1. Philosophy
**"Mission Critical Dark Mode"**
*   High Contrast
*   Deep Slate Backgrounds (`slate-900` / `950`)
*   Vibrant Accents (`blue-500`, `red-500`) for data.

## 2. Layer Architecture
The app layout (`App.tsx` / `AppShell`) consists of stacked Z-Index layers:

| Layer | Z-Index | Content | Pointer Events |
|-------|---------|---------|----------------|
| **Base** | `z-0` | `GraphCanvas` (Cytoscape) | Auto |
| **Data** | `z-10` | Overlays, Tooltips | None (Pass-through) |
| **Controls**| `z-50` | Buttons, Scrubbers, Modals | Auto |

## 3. Glassmorphism
UI Panels (Controls, Legends) use a standard "Glass" utility:
```css
@apply bg-slate-900/90 backdrop-blur border border-white/10 shadow-xl rounded-lg;
```
This ensures the graph remains partially visible behind controls, maintaining context.

## 4. Responsiveness
*   **Graph**: Resizes automatically via `ResizeObserver` -> `cy.resize()`.
*   **UI**:
    *   **Desktop**: Full sidebars and controls.
    *   **Mobile**: Collapsed controls, hidden sidebars. Optimized for "View Only".

## 5. Colors
We do NOT use arbitrary hex codes in CSS. We use Tailwind classes.
Semantic colors for graph elements are defined in the `Theme` or `IconRegistry`, matching Tailwind headers where possible (e.g. `#EF4444` = `red-500`).
