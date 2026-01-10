# Mermaid Attack Flow Beautifier - High Level Design

**Version:** 2.0
**Status:** ✅ Implemented
**Last Updated:** January 2025

---

## 1. Executive Summary

### 1.1 Purpose

Transform Mermaid diagram code into professional, animated security attack flow visualizations. The system takes plain-text Mermaid syntax as input and produces interactive SVG diagrams with:

- Recognizable security infrastructure icons (Kali Linux, Windows, servers, etc.)
- Step-by-step animation of attack sequences
- Professional dark theme styling
- Support for both flowchart and sequence diagram types

### 1.2 Target Users

- Security professionals creating attack documentation
- Penetration testers visualizing attack chains
- Red team members preparing engagement reports
- Security educators creating training materials

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| **Auto-Icon Detection** | Automatically assigns appropriate icons based on node names and labels |
| **Step Animation** | Reveals attack steps one-by-one with smooth transitions |
| **Tool Highlighting** | Emphasizes tool/command names in attack labels |
| **Dual Diagram Support** | Handles both flowchart and sequence diagram types |
| **Responsive Scaling** | Dynamically scales diagram to fit available viewport space |
| **Playback Controls** | Play/pause, step forward/back, speed control, keyboard shortcuts |

---

## 2. System Architecture

### 2.1 Architecture Pattern

**Pure Frontend SPA** with modular ES module architecture.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                      MAIN THREAD                               │    │
│   │                                                                │    │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │    │
│   │  │    App      │───▶│   Parser    │───▶│  Renderer   │       │    │
│   │  │ Orchestrator│    │ (Mermaid)   │    │ (Mermaid.js)│       │    │
│   │  └─────────────┘    └─────────────┘    └─────────────┘       │    │
│   │         │                                      │              │    │
│   │         │                                      ▼              │    │
│   │         │                              ┌─────────────┐       │    │
│   │         │                              │ Transformer │       │    │
│   │         │                              │ (Beautify)  │       │    │
│   │         │                              └─────────────┘       │    │
│   │         │                                      │              │    │
│   │         ▼                                      ▼              │    │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │    │
│   │  │  Timeline   │───▶│  Animation  │◀──▶│   Effects   │       │    │
│   │  │  Builder    │    │ Controller  │    │   Library   │       │    │
│   │  └─────────────┘    └─────────────┘    └─────────────┘       │    │
│   │         │                  │                                  │    │
│   │         ▼                  ▼                                  │    │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │    │
│   │  │    State    │◀──▶│     UI      │◀──▶│   Resize    │       │    │
│   │  │    Store    │    │  Controls   │    │   Manager   │       │    │
│   │  └─────────────┘    └─────────────┘    └─────────────┘       │    │
│   │                                                                │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                          STATIC ASSETS                                  │
│                                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│   │  icons/*.svg│    │  css/*.css  │    │ mermaid.txt │               │
│   └─────────────┘    └─────────────┘    └─────────────┘               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No Backend** | Mermaid.js requires browser DOM; animation is inherently client-side |
| **ES Modules** | Native browser support, no build step required |
| **Strategy Pattern** | Clean separation between flowchart and sequence diagram logic |
| **Event-Driven State** | Loose coupling between components via pub/sub |
| **External SVG Icons** | Maintainability, smaller main bundle, easy customization |
| **ResizeObserver** | Native API for responsive container monitoring |
| **CSS Transform Scaling** | GPU-accelerated responsive scaling with smooth transitions |

### 2.3 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Modern Browser | ES2020+ | Execution environment |
| **Diagram Engine** | Mermaid.js | 10.x | Diagram parsing and base SVG generation |
| **Module System** | ES Modules | Native | Code organization without bundler |
| **Styling** | CSS Custom Properties | Native | Theming and responsive design |
| **Animation** | Web Animations API + CSS | Native | Smooth step transitions |
| **Responsive** | ResizeObserver API | Native | Container size monitoring |
| **State** | Custom Store | N/A | Lightweight pub/sub state management |

---

## 3. File Structure

```
mermaid-beautifier/
│
├── index.html                          # Entry point (minimal HTML shell)
│
├── css/
│   ├── variables.css                   # CSS custom properties (colors, spacing, timing)
│   ├── layout.css                      # Page structure, responsiveness
│   ├── diagram.css                     # SVG and diagram-specific styles
│   └── controls.css                    # Animation control panel styles
│
├── js/
│   ├── app.js                          # Main orchestrator, initialization
│   │
│   ├── config/
│   │   ├── icons.registry.js           # Icon definitions (file, color, keywords)
│   │   ├── edges.registry.js           # Edge style definitions
│   │   └── constants.js                # App-wide constants
│   │
│   ├── core/
│   │   ├── MermaidParser.js            # Parse mermaid code to structured data
│   │   ├── MermaidRenderer.js          # Render mermaid code to raw SVG
│   │   ├── SvgTransformer.js           # Beautify SVG (inject icons, style)
│   │   └── IconLoader.js               # Async SVG icon loading with cache
│   │
│   ├── diagrams/
│   │   ├── DiagramStrategy.js          # Abstract base class / interface
│   │   ├── FlowchartStrategy.js        # Flowchart-specific transformations
│   │   └── SequenceStrategy.js         # Sequence diagram-specific transformations
│   │
│   ├── animation/
│   │   ├── Timeline.js                 # Ordered sequence of animation steps
│   │   ├── AnimationStep.js            # Single step definition
│   │   ├── Effects.js                  # Animation effect implementations
│   │   └── AnimationController.js      # State machine (play/pause/step)
│   │
│   ├── ui/
│   │   ├── ControlPanel.js             # Animation control buttons
│   │   ├── StepIndicator.js            # Visual step progress
│   │   └── ResizeManager.js            # Responsive scaling with ResizeObserver
│   │
│   └── state/
│       └── Store.js                    # Central state with pub/sub
│
├── assets/
│   └── icons/                          # SVG icon files
│       ├── attacker.svg
│       ├── kali.svg
│       ├── windows.svg
│       ├── winserver.svg
│       ├── linux.svg
│       ├── victim.svg
│       ├── server.svg
│       ├── dc.svg
│       ├── firewall.svg
│       ├── router.svg
│       ├── db.svg
│       ├── c2.svg
│       ├── cloud.svg
│       ├── mail.svg
│       ├── web.svg
│       ├── vpn.svg
│       ├── malware.svg
│       ├── creds.svg
│       ├── user.svg
│       ├── workstation.svg
│       └── default.svg
│
├── data/
│   └── mermaid.txt                     # Input diagram file
│
└── docs/
    ├── high_level_design.md            # This document
    └── specs/
        ├── 01-icon-system.md
        ├── 02-parser.md
        ├── 03-transformer.md
        ├── 04-animation-system.md
        ├── 05-ui-controls.md
        └── 06-diagram-strategies.md
```

---

## 4. Data Models

### 4.1 Parsed Diagram

Intermediate representation after parsing mermaid code:

```typescript
interface ParsedDiagram {
  type: 'flowchart' | 'sequence';
  direction?: 'LR' | 'RL' | 'TB' | 'BT';  // Flowchart only

  nodes: ParsedNode[];
  edges: ParsedEdge[];

  metadata: {
    sourceCode: string;
    parseTime: number;
  };
}

interface ParsedNode {
  id: string;              // e.g., "victim_ws"
  label: string;           // e.g., "Victim Workstation<br>Windows"
  labelText: string;       // Plain text without HTML
  rawDefinition: string;   // Original mermaid line
  lineNumber: number;      // Line in source

  // Computed
  detectedType: string;    // e.g., "windows"
  iconFile: string;        // e.g., "windows.svg"
  iconColor: string;       // e.g., "#00ADEF"
}

interface ParsedEdge {
  id: string;              // Generated unique ID
  sourceId: string;        // Source node ID
  targetId: string;        // Target node ID
  label: string;           // Edge label text
  rawDefinition: string;   // Original mermaid line
  lineNumber: number;      // Line in source

  // Computed
  sequenceNumber: number;  // Order in animation (extracted from label or position)
  edgeStyle: EdgeStyle;    // Color, width, dash pattern
  hasToolReference: boolean;
  toolName?: string;       // Extracted tool name if present
}
```

### 4.2 Icon Registry Entry

```typescript
interface IconRegistryEntry {
  file: string;            // SVG filename
  color: string;           // Primary color (hex)
  category: 'os' | 'infrastructure' | 'security' | 'actor' | 'data';

  // Detection
  keywords: string[];      // Trigger words (lowercase)
  priority: 'high' | 'medium' | 'low';

  // Optional
  aliases?: string[];      // Alternative icon names
}
```

### 4.3 Animation Timeline

```typescript
interface Timeline {
  steps: AnimationStep[];
  totalSteps: number;
  currentIndex: number;
}

interface AnimationStep {
  id: number;
  sequenceNumber: number;  // Display number (1, 2, 3...)

  // Elements to animate
  edgeElement: SVGPathElement;   // The path/line element
  labelElement?: SVGElement;     // Edge label (optional)

  // Animation config
  effect: 'fadeIn' | 'fadeInDrawPath';
  duration: number;        // Default: 800ms

  // Metadata
  description: string;     // Human-readable step description (from label text)
}
```

### 4.4 Application State

```typescript
interface AppState {
  // Diagram
  diagram: {
    sourceCode: string;
    parsed: ParsedDiagram | null;
    svg: SVGElement | null;
    type: 'flowchart' | 'sequence';
  };

  // Animation
  animation: {
    timeline: Timeline | null;
    currentStep: number;
    state: 'idle' | 'playing' | 'paused' | 'finished';
    playbackSpeed: number;  // 0.5x, 1x, 2x
  };

  // UI
  ui: {
    currentScale: number;    // Current responsive scale factor
    showLabels: boolean;
    theme: 'dark';           // Dark theme only
  };

  // System
  system: {
    isLoading: boolean;
    error: string | null;
    iconsLoaded: boolean;
  };
}
```

---

## 5. Component Interaction

### 5.1 Initialization Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐
│  User   │     │  App.js  │     │  Worker  │     │  Renderer │
└────┬────┘     └────┬─────┘     └────┬─────┘     └─────┬─────┘
     │               │                │                  │
     │  Load Page    │                │                  │
     │──────────────▶│                │                  │
     │               │                │                  │
     │               │  Fetch mermaid.txt               │
     │               │───────────────────────────────────▶
     │               │                │                  │
     │               │  Parse Code    │                  │
     │               │───────────────▶│                  │
     │               │                │                  │
     │               │  ParsedDiagram │                  │
     │               │◀───────────────│                  │
     │               │                │                  │
     │               │  Preload Icons │                  │
     │               │───────────────────────────────────▶
     │               │                │                  │
     │               │  Render Mermaid                   │
     │               │───────────────────────────────────▶
     │               │                │                  │
     │               │  Transform SVG │                  │
     │               │───────────────────────────────────▶
     │               │                │                  │
     │               │  Build Timeline│                  │
     │               │───────────────▶│                  │
     │               │                │                  │
     │               │  Init UI       │                  │
     │               │────────────────────────────────────▶
     │               │                │                  │
     │  Ready        │                │                  │
     │◀──────────────│                │                  │
```

### 5.2 Animation Playback Flow

```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌─────────┐
│   UI    │     │Controller│     │  Timeline  │     │ Effects │
└────┬────┘     └────┬─────┘     └─────┬──────┘     └────┬────┘
     │               │                 │                  │
     │  Click Play   │                 │                  │
     │──────────────▶│                 │                  │
     │               │                 │                  │
     │               │  Get Next Step  │                  │
     │               │────────────────▶│                  │
     │               │                 │                  │
     │               │  AnimationStep  │                  │
     │               │◀────────────────│                  │
     │               │                 │                  │
     │               │  Execute Effect │                  │
     │               │─────────────────────────────────▶ │
     │               │                 │                  │
     │               │                 │   Animate SVG    │
     │               │                 │◀─────────────────│
     │               │                 │                  │
     │  Update UI    │                 │                  │
     │◀──────────────│                 │                  │
     │               │                 │                  │
     │               │  [Loop until finished or paused]  │
     │               │                 │                  │
```

---

## 6. Responsive Scaling System

### 6.1 Overview

The diagram scales automatically to fit the available viewport space while maintaining aspect ratio and readability. The system uses **pixel-based sizing** (not CSS transforms) for accurate, linear scaling at all container sizes.

### 6.2 ResizeManager Configuration

```javascript
// Key configuration values (js/ui/ResizeManager.js)
minScale: 0.1       // Allows shrinking to 10% for very small containers
maxScale: 5.0       // Allows expansion up to 500% for large displays
padding: 10         // Minimal padding to maximize content area
```

### 6.3 ViewBox Fitting (SvgTransformer)

Before scaling, the SVG viewBox is fitted tightly to actual content bounds:

```javascript
// Step 1: Temporarily insert SVG into DOM
// Step 2: Get bounding box of all visible content
const bbox = svg.getBBox();

// Step 3: Set viewBox to content bounds + minimal padding
const padding = 30;
svg.setAttribute('viewBox',
  `${bbox.x - padding} ${bbox.y - padding}
   ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
);
```

This ensures the viewBox contains only the actual diagram content, not excess whitespace.

### 6.4 Scaling Algorithm (Linear, Pixel-Based)

**Critical**: Uses explicit pixel dimensions, NOT CSS transforms (which cause non-linear scaling).

```javascript
// 1. Calculate scale to fit container while maintaining aspect ratio
const scaleX = containerWidth / originalSvgWidth;
const scaleY = containerHeight / originalSvgHeight;
const scale = Math.min(scaleX, scaleY);
const clampedScale = clamp(scale, minScale, maxScale);

// 2. Calculate exact pixel dimensions
const scaledWidth = originalWidth * clampedScale;
const scaledHeight = originalHeight * clampedScale;

// 3. Calculate centering offsets
const offsetX = (containerWidth - scaledWidth) / 2;
const offsetY = (containerHeight - scaledHeight) / 2;

// 4. Apply as fixed pixel values (NOT transform)
svg.style.width = `${scaledWidth}px`;
svg.style.height = `${scaledHeight}px`;
svg.style.left = `${offsetX}px`;
svg.style.top = `${offsetY}px`;
svg.style.position = 'absolute';
```

### 6.5 Why Pixel-Based (Not CSS Transform)

**Problem with CSS transforms:**
```css
/* BAD: Non-linear behavior */
transform: translate(-50%, -50%) scale(${scale});
```
The `translate(-50%, -50%)` is calculated on the *scaled* element size, causing exponential/non-linear behavior where:
- Small containers → diagram shrinks too much
- Large containers → diagram grows beyond bounds

**Solution with pixel sizing:**
```javascript
/* GOOD: Linear, predictable behavior */
width: scaledWidth + 'px';
height: scaledHeight + 'px';
left: offsetX + 'px';
top: offsetY + 'px';
```
All values are calculated in absolute pixels, ensuring perfectly linear scaling.

### 6.6 Layout Requirements

```css
/* Container must use flexbox with these properties */
body { height: 100vh; overflow: hidden; }
.app { height: 100vh; max-height: 100vh; overflow: hidden; }
.diagram-output { flex: 1; min-height: 0; position: relative; overflow: hidden; }

/* SVG positioning */
.diagram-output.responsive-scaling svg {
  position: absolute;
  max-width: none;
  max-height: none;
}
```

### 6.7 Critical: Do NOT Use vector-effect: non-scaling-stroke

**Problem:**
```css
/* BAD - causes gaps in edge lines when resizing */
.diagram-output svg * {
  vector-effect: non-scaling-stroke;
}
```

When `vector-effect: non-scaling-stroke` is applied:
- Stroke widths remain constant regardless of SVG scale
- But path coordinates scale with the container
- This mismatch creates **visible gaps** in edge lines that grow/shrink with resize
- Affects all paths, especially where edges connect to arrowhead markers

**Solution:** Do not use this property. Let SVG elements scale naturally:
```css
/* GOOD - SVG elements scale naturally with container */
/* No vector-effect property needed */
```

The pixel-based scaling approach (section 6.4) handles sizing correctly without needing non-scaling-stroke.

---

## 7. Security Considerations

| Concern | Mitigation |
|---------|------------|
| **XSS via mermaid input** | Mermaid.js sanitizes by default; `securityLevel: 'loose'` only for trusted input |
| **SVG injection** | Icons are local files, not user-provided |
| **Local file access** | Requires web server; cannot run from `file://` protocol |

---

## 8. Performance Considerations

| Area | Strategy |
|------|----------|
| **Icon Loading** | Preload only required icons; cache in memory |
| **SVG Rendering** | Single render pass; transform in-place |
| **Animation** | Use CSS transforms/opacity (GPU accelerated) |
| **Responsive Scaling** | ResizeObserver with debounced updates (50ms) |
| **Memory** | Clear icon cache if >100 icons loaded |

---

## 9. Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | Full support |
| Safari | 14+ | Full support |
| Edge | 80+ | Full support (Chromium) |

**Required Features:**
- ES Modules
- ResizeObserver API
- Web Animations API
- CSS Custom Properties
- CSS Transform
- SVG 1.1

---

## 10. Future Considerations

### 10.1 Potential Enhancements

| Feature | Complexity | Value |
|---------|------------|-------|
| Export to PNG/PDF | Medium | High |
| Save/Load diagrams | Medium | High |
| Custom themes | Low | Medium |
| Keyboard shortcuts | Low | Medium |
| Mobile touch gestures | Medium | Medium |
| Collaborative editing | High | Low (needs backend) |
| MITRE ATT&CK integration | Medium | High for security users |

### 10.2 Backend Addition Triggers

Consider adding backend if:
- Need persistent diagram storage
- Need user authentication
- Need server-side PDF/PNG export
- Need real-time collaboration

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Beautifier** | The process of replacing Mermaid's default shapes with custom icons |
| **ParsedDiagram** | Structured representation of mermaid code |
| **Timeline** | Ordered sequence of animation steps |
| **Strategy** | Design pattern for diagram-type-specific logic |
| **Step** | Single animation unit (one edge + label appearing) |
| **Effect** | Animation implementation (fadeIn, drawPath, etc.) |

---

## 12. References

- [Mermaid.js Documentation](https://mermaid.js.org/)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [SVG Specification](https://www.w3.org/TR/SVG11/)
- [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
