# Spec 15: PDF Export for LinkedIn Carousel

**Status:** Implementation Plan
**Author:** Claude
**Date:** 2026-01-12

---

## 1. Objective

Implement a one-click PDF export feature that generates LinkedIn-optimized carousel documents from attack scenarios. Each page represents one animation step, creating an interactive "swipe-to-play" experience.

---

## 2. User Flow

```
User clicks "Export" button (Header)
         ↓
    Export Modal opens
         ↓
    User selects "PDF Carousel"
         ↓
    Progress indicator shows generation
         ↓
    PDF auto-downloads
         ↓
    User uploads to LinkedIn
```

---

## 3. Output Specification

### 3.1 LinkedIn-Optimal Dimensions

| Property | Value | Rationale |
|----------|-------|-----------|
| Width | 1080px | LinkedIn standard |
| Height | 1350px | 4:5 ratio (optimal for feed) |
| DPI | 2x (retina) | Crisp on mobile |
| Format | PDF | Native carousel support |
| Max Pages | 15 recommended | Engagement sweet spot |

### 3.2 Page Layout (Per Step)

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │ ← 40px padding
│ │  [Icon] SCENARIO TITLE                  │ │ ← Header (60px)
│ │         Step 3 of 9                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │                                         │ │
│ │           GRAPH CANVAS                  │ │ ← Main area (~900px)
│ │      (Cytoscape PNG export)             │ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  ACTION NAME                            │ │ ← Info Panel (250px)
│ │  ┌─────────────────────────────────┐    │ │
│ │  │ $ nmap -sT -p- 192.168.1.10    │    │ │ ← CLI block
│ │  └─────────────────────────────────┘    │ │
│ │  Tooltip description text here...       │ │
│ │                                         │ │
│ │  [T1595] Active Scanning    [Swipe →]  │ │ ← MITRE badge + CTA
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.3 Visual Design Tokens

```typescript
const PDF_THEME = {
  // Background
  bgPrimary: '#0f172a',      // Slate 900
  bgSecondary: '#1e293b',    // Slate 800
  bgTertiary: '#334155',     // Slate 700

  // Text
  textPrimary: '#f8fafc',    // Slate 50
  textSecondary: '#cbd5e1',  // Slate 300
  textMuted: '#64748b',      // Slate 500

  // Accents
  brandBlue: '#3b82f6',
  cliGreen: '#4ade80',

  // Fonts
  fontSans: 'Inter, system-ui, sans-serif',
  fontMono: 'JetBrains Mono, Consolas, monospace',
};
```

---

## 4. Technical Architecture

### 4.1 Export Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  useScenarioStore│ ──► │  PDFExporter     │ ──► │   pdf-lib       │
│  (scenario data) │     │  (orchestrator)  │     │  (PDF assembly) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Cytoscape       │
                        │  cy.png()        │
                        │  (graph capture) │
                        └──────────────────┘
```

### 4.2 New Files to Create

```
src/
├── core/
│   └── export/
│       ├── PDFExporter.ts       # Main export orchestrator
│       ├── PageRenderer.ts      # Canvas-based page composition
│       └── pdf.constants.ts     # Dimensions, colors, fonts
├── ui/
│   ├── features/
│   │   └── Export/
│   │       ├── ExportModal.tsx  # Modal with export options
│   │       └── ExportProgress.tsx # Progress indicator
│   └── layout/
│       └── Header.tsx           # Wire up Export button (modify)
```

### 4.3 Dependencies

```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1"    // PDF creation (no native deps)
  }
}
```

**Why pdf-lib?**
- Pure JavaScript (works in browser)
- No server required
- Small bundle (~200kb)
- Supports embedded images
- Better than jsPDF for custom layouts

---

## 5. Implementation Steps

### Phase 1: Foundation (45 min)

#### 1.1 Install Dependencies
```bash
npm install pdf-lib
```

#### 1.2 Create Constants File
`src/core/export/pdf.constants.ts`
- Page dimensions
- Color palette
- Font sizes
- Layout measurements

#### 1.3 Create PDFExporter Class
`src/core/export/PDFExporter.ts`
- Constructor takes scenario + cytoscape instance
- `export()` method returns Blob
- Step iteration logic

### Phase 2: Graph Capture (30 min)

#### 2.1 Cytoscape Export Utility
Create helper to capture graph at specific step:
```typescript
async function captureGraphAtStep(
  cy: cytoscape.Core,
  step: number,
  timeline: TimelineStep[],
  visibility: VisibilityMap
): Promise<string> // base64 PNG
```

**Key considerations:**
- Must apply visibility rules for the step
- Must show cumulative edges up to step
- Must highlight current edge
- Export at 2x resolution for retina

#### 2.2 Temporary State Management
- Save current step before export
- Iterate through steps, capture each
- Restore original step after export

### Phase 3: Page Composition (60 min)

#### 3.1 Create PageRenderer
`src/core/export/PageRenderer.ts`

Uses Canvas API to compose each page:
```typescript
class PageRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  async renderPage(
    graphImage: string,      // base64 PNG from Cytoscape
    stepData: TimelineStep,
    stepIndex: number,
    totalSteps: number,
    scenarioTitle: string
  ): Promise<Uint8Array>     // PNG bytes for PDF embedding
}
```

**Rendering order:**
1. Fill background (slate 900)
2. Draw header bar (title + step counter)
3. Draw graph image (centered, scaled to fit)
4. Draw info panel background
5. Draw step name (bold, white)
6. Draw CLI block (if present) - green mono text on dark bg
7. Draw tooltip text (if present)
8. Draw MITRE badge (colored by tactic)
9. Draw "Swipe →" CTA on bottom right

#### 3.2 Font Handling
- Use Canvas standard fonts (system-ui fallback)
- For production: embed custom font as base64

### Phase 4: PDF Assembly (30 min)

#### 4.1 PDF Creation with pdf-lib
```typescript
import { PDFDocument } from 'pdf-lib';

async function assemblePDF(pages: Uint8Array[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const pageImage of pages) {
    const image = await pdfDoc.embedPng(pageImage);
    const page = pdfDoc.addPage([1080, 1350]);
    page.drawImage(image, {
      x: 0, y: 0,
      width: 1080, height: 1350
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

### Phase 5: UI Integration (45 min)

#### 5.1 Create ExportModal Component
`src/ui/features/Export/ExportModal.tsx`
- Triggered by Header Download button
- Options: "PDF Carousel", "PNG Image", "JSON Data"
- Shows progress during generation

#### 5.2 Create Export Progress Component
`src/ui/features/Export/ExportProgress.tsx`
- Animated progress bar
- "Generating page X of Y..."
- Cancel button

#### 5.3 Wire Up Header Button
Modify `Header.tsx`:
- Download button opens ExportModal
- Pass cytoscape ref from GraphCanvas

#### 5.4 Cytoscape Ref Propagation
Challenge: Header needs access to `cyRef` from GraphCanvas.

**Solution:** Create export context or use store:
```typescript
// In useScenarioStore or new useExportStore
cyInstance: cytoscape.Core | null;
setCyInstance: (cy: cytoscape.Core) => void;
```

### Phase 6: Polish (30 min)

#### 6.1 First Page (Cover)
Special rendering for page 0:
- Larger title
- Scenario description
- "Swipe to begin →"
- No graph (or zoomed out overview)

#### 6.2 Last Page (CTA)
Optional final page:
- "View Interactive Version"
- QR code to hosted app (future)
- Branding

#### 6.3 Error Handling
- Graceful failure if graph not loaded
- Timeout for large scenarios
- Memory management for many steps

---

## 6. API Design

### 6.1 PDFExporter Class

```typescript
interface PDFExportOptions {
  includeTooltips: boolean;      // Show tooltip text (default: true)
  includeCLI: boolean;           // Show CLI commands (default: true)
  includeMitre: boolean;         // Show MITRE badges (default: true)
  coverPage: boolean;            // Add title page (default: true)
  ctaPage: boolean;              // Add final CTA page (default: false)
  quality: 'standard' | 'high';  // Image quality (default: 'high')
}

class PDFExporter {
  constructor(
    scenario: ScenarioData,
    cy: cytoscape.Core,
    options?: Partial<PDFExportOptions>
  );

  async export(): Promise<Blob>;

  // Progress callback
  onProgress?: (current: number, total: number) => void;
}
```

### 6.2 Usage in Component

```typescript
const handleExportPDF = async () => {
  const cy = useScenarioStore.getState().cyInstance;
  const scenario = useScenarioStore.getState().scenario;

  if (!cy || !scenario) return;

  const exporter = new PDFExporter(scenario, cy, {
    includeTooltips: true,
    includeCLI: true,
    coverPage: true
  });

  exporter.onProgress = (current, total) => {
    setProgress({ current, total });
  };

  const blob = await exporter.export();

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenario.title.replace(/\s+/g, '_')}_carousel.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## 7. Testing Checklist

### 7.1 Functional Tests
- [ ] Export button opens modal
- [ ] PDF generates without error
- [ ] All steps are captured
- [ ] Graph shows correct state per step
- [ ] Visibility rules are respected
- [ ] Current edge is highlighted
- [ ] CLI commands render correctly
- [ ] MITRE badges show correct colors
- [ ] PDF downloads with correct filename

### 7.2 Visual Tests
- [ ] Text is readable at LinkedIn display size
- [ ] Graph is not cropped or distorted
- [ ] Colors match app theme
- [ ] Spacing is consistent across pages

### 7.3 Edge Cases
- [ ] Scenario with 0 steps (should show message)
- [ ] Scenario with 20+ steps (performance)
- [ ] Steps without CLI/tooltip (graceful fallback)
- [ ] Long scenario titles (truncation)
- [ ] Very long CLI commands (wrapping)

---

## 8. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add pdf-lib dependency |
| `src/core/export/pdf.constants.ts` | Create | Export constants |
| `src/core/export/PDFExporter.ts` | Create | Main export logic |
| `src/core/export/PageRenderer.ts` | Create | Canvas page composition |
| `src/ui/features/Export/ExportModal.tsx` | Create | Export options modal |
| `src/ui/features/Export/ExportProgress.tsx` | Create | Progress indicator |
| `src/ui/layout/Header.tsx` | Modify | Wire up export button |
| `src/core/store/useScenarioStore.ts` | Modify | Add cyInstance state |
| `src/ui/features/GraphCanvas/GraphCanvas.tsx` | Modify | Set cyInstance in store |

---

## 9. Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundation | 45 min | 45 min |
| Phase 2: Graph Capture | 30 min | 1h 15min |
| Phase 3: Page Composition | 60 min | 2h 15min |
| Phase 4: PDF Assembly | 30 min | 2h 45min |
| Phase 5: UI Integration | 45 min | 3h 30min |
| Phase 6: Polish | 30 min | 4h |

**Total Estimated: ~4 hours**

---

## 10. Future Enhancements

1. **Video Export** - Use similar pipeline but output to WebM/MP4
2. **Custom Branding** - User logo overlay
3. **QR Code** - Link to interactive version
4. **Template Selection** - Different layouts (dark/light, compact/detailed)
5. **Batch Export** - Export multiple scenarios
6. **Cloud Storage** - Direct upload to Google Drive/Dropbox
