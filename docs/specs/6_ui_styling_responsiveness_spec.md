# Spec 6: UI Styling & Responsiveness Specification

**Status:** Draft
**Related:** `docs/0_high_level_design.md`
**Legacy Source:** `Old_Code/css/variables.css`, `Old_Code/css/controls.css`

## 1. Overview
This specification defines the visual language and extensive layout rules for `CyberViewer-Cyto`. The goal is to replicate the "Cyber/Dark Mode" aesthetic of the legacy application using **Tailwind CSS**.

**Core Philosophy:** "Mission Critical Aesthetics." High contrast, dark themes, rigorous legibility, and fluid responsiveness.

## 2. Technology Stack
*   **Framework**: Tailwind CSS v3.4+
*   **Icons**: Lucide React (for UI controls), Custom SVGs (for Graph Nodes).
*   **Fonts**: `Inter` (UI), `JetBrains Mono` (Code/Data).

## 3. Design Tokens (Tailwind Config)
We map legacy CSS variables to Tailwind's `extend` configuration.

### 3.1 Colors (`tailwind.config.ts`)
```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Backgrounds: Mapping to Slate/Gray scale but slightly cooler
        background: {
          primary: '#0a0a0f',   // Legacy var(--color-bg-primary)
          secondary: '#12121a', // Legacy var(--color-bg-secondary)
          tertiary: '#1e1e2e',
        },
        // Semantic Colors (Direct Match)
        brand: {
          blue: '#3b82f6',
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          purple: '#a855f7',
        },
        // Attack Flow Semantics
        attack: {
          infection: '#ef4444',
          exfil: '#f97316',
          lateral: '#eab308',
          c2: '#a855f7',
        }
      }
    }
  }
}
```

## 4. App Shell Layout (`src/ui/layout/AppShell.tsx`)
The application uses a **Fixed Viewport** layout (ideal for Graph visualizations).

### 4.1 Grid Structure
```tsx
<div className="h-screen w-screen bg-background-primary flex flex-col overflow-hidden">
  {/* Header (Logo + Global Actions) */}
  <Header className="h-16 flex-none border-b border-white/10" />

  {/* Main Content Area */}
  <main className="flex-1 relative">
    
    {/* Layer 0: Graph Canvas (Z-0) */}
    <div className="absolute inset-0 z-0">
      <GraphCanvas />
    </div>

    {/* Layer 1: Overlays (Z-10 to Z-50) */}
    <div className="absolute inset-0 z-10 pointer-events-none">
       {/* Top Right: Search / Filters */}
       <div className="absolute top-4 right-4 pointer-events-auto">
         <SearchWidget />
       </div>

       {/* Bottom Center: Animation Controls */}
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
         <AnimationControls />
       </div>

       {/* Bottom Right: MITRE Legend */}
       <div className="absolute bottom-4 right-4 pointer-events-auto">
         <StatusLegend />
       </div>
    </div>
  </main>
</div>
```

## 5. Responsive Behavior
The application must work on Desktop (1920x1080) down to Tablet (768px). Mobile is supported but optimizing for "consumption" (viewing) rather than analysis.

### 5.1 Graph Responsiveness (ResizeObserver)
The `GraphCanvas` must detect container resize events.
*   **Hook**: `src/ui/hooks/useResizeGraph.ts`
*   **Logic**:
    ```typescript
    useEffect(() => {
       const observer = new ResizeObserver(() => {
          cy.resize(); // Basic resize
          // Optional: cy.fit() if we want auto-centering
       });
       observer.observe(containerRef.current);
    }, []);
    ```

### 5.2 UI Overlay Adaptation
Using Tailwind breakpoints:
*   **Desktop (`lg`)**: All panels visible.
*   **Tablet (`md`)**:
    *   Legend collapses to a toggle button.
    *   Animation scrubber condenses.
*   **Mobile (`sm`)**:
    *   Hide Sidebars.
    *   Show only "Play/Pause" and "Next Step" for animation.

## 6. Glassmorphism Utilities
To handle the overlays, we define a standard utility class `glass-panel`.

```css
@layer components {
  .glass-panel {
    @apply bg-background-secondary/90 backdrop-blur-md border border-white/10 shadow-xl rounded-lg;
  }
}
```
*   **Usage**: `<div className="glass-panel p-4">...</div>`
*   Replaces the solid backgrounds in legacy CSS, adding modern depth.

## 7. Global Typography
*   **Headings**: `font-sans font-bold tracking-tight text-slate-100`.
*   **Data/Code**: `font-mono text-xs text-slate-400`.
*   **Base Size**: 14px (Dense UI for complex data).
