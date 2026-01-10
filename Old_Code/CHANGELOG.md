# Changelog

All notable changes to the Mermaid Attack Flow Beautifier project.

## [2.0.0] - January 2025

### Overview

Complete rewrite from single-file prototype (`old_beautifier.html`) to modular ES module architecture with step-by-step animation capabilities and responsive scaling.

---

### Added

#### Core Architecture
- **Modular ES Module Structure**: Reorganized codebase into ~25 files across logical directories
- **Strategy Pattern**: `DiagramStrategy` base class with `FlowchartStrategy` implementation
- **Event-Driven State**: Central `Store` with pub/sub pattern for loose coupling
- **Icon Loading System**: `IconLoader` with async loading and LRU cache

#### Animation System
- **Timeline-Based Animation**: `Timeline` class builds ordered sequence of animation steps
- **AnimationController**: State machine managing play/pause/step navigation
- **Effects Library**: `fadeIn`, `fadeInDrawPath`, `showImmediate`, `hideImmediate` effects
- **Step Indicator**: Visual progress display showing current step / total steps

#### UI Components
- **ControlPanel**: Play/pause, step forward/back, first/last, speed control buttons
- **ResizeManager**: Responsive scaling using ResizeObserver API
- **Keyboard Shortcuts**: Space (play/pause), Arrow keys (step), Home/End (first/last)

#### Configuration
- **Icon Registry**: Centralized icon definitions with keyword detection
- **Edge Registry**: Edge style definitions (color, width, dash patterns)
- **Constants**: Application-wide configuration values

#### CSS Architecture
- **CSS Custom Properties**: Design tokens for colors, spacing, typography
- **Responsive Layout**: Flexbox-based layout that fills viewport
- **Dark Theme**: Professional security-focused visual design

---

### Configuration Values

```javascript
// Icon sizes (js/config/constants.js)
ICON_CONFIG: {
  defaultSize: 140,    // Icon display size in pixels
  smallSize: 100,      // Smaller variant
  baseViewBox: 80,     // SVG viewBox base (icons designed at 80x80)
}

// Mermaid spacing (js/config/constants.js)
MERMAID_CONFIG.flowchart: {
  nodeSpacing: 300,    // Horizontal spacing between nodes
  rankSpacing: 350,    // Vertical spacing between ranks
  padding: 80,         // Diagram padding
}

// Font sizes (css/variables.css)
CSS_FONTS: {
  nodeLabels: '18px',  // Node text
  edgeLabels: '16px',  // Edge/step text
  clusterLabels: '14px', // Subgraph titles
}

// Animation timing (js/config/constants.js)
ANIMATION_CONFIG: {
  duration: { fast: 400, normal: 800, slow: 1200 },
  stepDelay: 200,
  speeds: [0.5, 1, 1.5, 2],
}

// Responsive scaling (js/ui/ResizeManager.js)
ResizeManager: {
  minScale: 0.1,       // Allows 10% for tiny containers
  maxScale: 5.0,       // Allows 500% for large displays
  padding: 10,         // Minimal padding for max content area
}
```

---

### Fixed

#### Animation Bugs
- **Edges visible at start**: Added `#hideAllEdges()` to hide all edges before animation begins
- **Missing steps**: Fixed step count by building timeline from DOM edges rather than parsed data
- **Label matching**: Extract sequence numbers directly from label text using regex
- **Edge labels not showing**: Changed selector from `.edgeLabel` to `g.edgeLabel`
- **Nested label visibility**: Updated Effects to show all nested elements within foreignObject labels

#### Sizing Issues
- **Small icons**: Increased icon size from 70 to 140 pixels
- **Cramped layout**: Increased node spacing to 300, rank spacing to 350
- **Small text**: Increased font sizes (nodes: 18px, edges: 16px)
- **Label offset**: Adjusted from 50 to 75 pixels below icon

#### Critical: Responsive Scaling (Non-Linear Behavior)
- **Problem**: CSS `transform: translate(-50%, -50%) scale()` caused exponential scaling
  - Small browser → diagram too small relative to space
  - Large browser → diagram overflowed beyond visible area
- **Root Cause**: `translate(-50%, -50%)` percentages are calculated on scaled element size
- **Solution**: Replaced with pixel-based sizing (width/height/left/top in pixels)
- **ViewBox Fitting**: Added `#fitViewBoxToContent()` using `getBBox()` to fit viewBox tightly to actual content bounds instead of expanding it

#### Critical: Edge Line Gaps When Resizing
- **Problem**: Edge lines had visible gaps/discontinuities that grew/shrank when resizing browser
- **Root Cause**: CSS `vector-effect: non-scaling-stroke` was applied to all SVG elements
  - Stroke widths stayed constant while path coordinates scaled
  - This mismatch created gaps where strokes didn't meet path endpoints
  - Most visible at edge-to-arrowhead connections
- **Solution**: Removed `vector-effect: non-scaling-stroke` entirely
- **Result**: SVG elements now scale naturally and uniformly with no gaps

---

### Technical Details

#### Responsive Scaling Algorithm (Pixel-Based)

**Step 1: ViewBox Fitting (SvgTransformer)**
```javascript
// Fit viewBox tightly to actual content, not Mermaid's oversized canvas
const bbox = svg.getBBox();  // Requires temp DOM insertion
const padding = 30;
svg.setAttribute('viewBox',
  `${bbox.x - padding} ${bbox.y - padding}
   ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
```

**Step 2: Scale Calculation (ResizeManager)**
```javascript
// Calculate scale to fit container
const scaleX = containerWidth / originalSvgWidth;
const scaleY = containerHeight / originalSvgHeight;
const scale = clamp(Math.min(scaleX, scaleY), 0.1, 5.0);
```

**Step 3: Pixel-Based Application (NOT CSS transform)**
```javascript
// Calculate exact dimensions and position
const scaledWidth = originalWidth * scale;
const scaledHeight = originalHeight * scale;
const offsetX = (containerWidth - scaledWidth) / 2;
const offsetY = (containerHeight - scaledHeight) / 2;

// Apply as fixed pixels (linear, predictable)
svg.style.width = scaledWidth + 'px';
svg.style.height = scaledHeight + 'px';
svg.style.left = offsetX + 'px';
svg.style.top = offsetY + 'px';
svg.style.position = 'absolute';
```

**Why NOT CSS Transform:**
```css
/* BAD - causes non-linear/exponential behavior */
transform: translate(-50%, -50%) scale(${scale});
/* translate percentages are relative to SCALED size, not original */
```

#### Animation Step Building
```
1. Query DOM for all `.beautified-edge` elements
2. For each edge, extract sequence number from data attribute
3. Find corresponding label using `data-sequence` attribute
4. Fallback: match labels by index position
5. Create AnimationStep with edge, label, and duration
```

#### Edge Label Detection
```javascript
// Pattern matches: "1. Description" or "1: Description" or "1 Description"
const seqMatch = text.match(/^(\d+)[.\s:]/);
const sequenceNumber = seqMatch ? parseInt(seqMatch[1], 10) : index + 1;
```

---

### Files Created

```
mermaid-beautifier/
├── index.html
├── css/
│   ├── variables.css
│   ├── layout.css
│   ├── diagram.css
│   └── controls.css
├── js/
│   ├── app.js
│   ├── config/
│   │   ├── constants.js
│   │   ├── icons.registry.js
│   │   └── edges.registry.js
│   ├── core/
│   │   ├── IconDetector.js
│   │   ├── IconLoader.js
│   │   ├── MermaidParser.js
│   │   ├── MermaidRenderer.js
│   │   └── SvgTransformer.js
│   ├── diagrams/
│   │   ├── DiagramStrategy.js
│   │   ├── DiagramFactory.js
│   │   └── FlowchartStrategy.js
│   ├── animation/
│   │   ├── AnimationStep.js
│   │   ├── Timeline.js
│   │   ├── Effects.js
│   │   └── AnimationController.js
│   ├── ui/
│   │   ├── ControlPanel.js
│   │   ├── StepIndicator.js
│   │   └── ResizeManager.js
│   └── state/
│       └── Store.js
├── assets/icons/          (20+ SVG icons)
├── data/mermaid.txt
└── docs/
    ├── high_level_design.md
    ├── implementation_plan.md
    └── specs/
```

---

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+ (Chromium)

**Required APIs:**
- ES Modules
- ResizeObserver
- Web Animations API
- CSS Custom Properties
- CSS Transform

---

### Migration from v1.0

The original `old_beautifier.html` single-file implementation has been archived. To migrate:

1. Use the new modular structure in `/js/`
2. Update any custom icons in `/assets/icons/`
3. Modify diagram source in `/data/mermaid.txt`
4. Customize styles via CSS custom properties in `/css/variables.css`

---

### Known Limitations

- Sequence diagram support not yet implemented (FlowchartStrategy only)
- No export to PNG/PDF
- No diagram editing UI (requires editing mermaid.txt)
- Single dark theme only

---

### Future Enhancements

- [ ] Sequence diagram strategy
- [ ] Export to PNG/PDF
- [ ] Light theme option
- [ ] Custom icon upload
- [ ] Diagram editor UI
- [ ] MITRE ATT&CK integration
