# AttackTracker: High Level Design

> **Version**: 2.0
> **Updated**: January 2025

## 1. Vision

**AttackTracker** is a visualization engine for cybersecurity attack flows. It transforms threat data into interactive, animated graphs with rich metadata context. The system supports:

- **Interactive Graph Visualization** - Cytoscape.js-powered attack flow diagrams
- **Timeline Animation** - Step-by-step attack progression playback
- **Rich Metadata** - Prerequisites, attacker gains, detection notes, MITRE mapping
- **PDF Export** - LinkedIn-optimized carousel generation
- **LLM Integration** - Two-step workflow for scenario generation

## 2. Architecture Principles

1. **Domain Isolation**: Core logic (`core/`) is framework-agnostic TypeScript, decoupled from React UI
2. **Unidirectional Data Flow**: `Store` → `Graph Engine` → `React UI`. UI events trigger actions, not direct mutations
3. **Runtime Validation**: All external inputs validated via **Zod** schemas before system entry
4. **Component-Driven UI**: Reusable React components styled with Tailwind CSS

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| Build | Vite (ES Modules) |
| Framework | React 18+ (TypeScript 5+ Strict) |
| State | Zustand |
| Styling | Tailwind CSS |
| Validation | Zod |
| Graph Engine | Cytoscape.js + cytoscape-dagre + cytoscape-canvas |
| PDF Generation | pdf-lib + Canvas API |

## 4. Directory Structure

```text
attacktracker/
├── public/
│   ├── data/                    # Scenario JSON files
│   └── assets/icons/            # SVG icons (nodes, containers)
├── src/
│   ├── core/                    # CORE DOMAIN (Framework Agnostic)
│   │   ├── parser/
│   │   │   ├── ScenarioAdapter.ts      # JSON → Cytoscape elements
│   │   │   ├── LegacyMermaidAdapter.ts # Legacy text format support
│   │   │   └── ParserHost.ts           # Parser orchestrator
│   │   ├── store/
│   │   │   └── useScenarioStore.ts     # Zustand state + metadata extraction
│   │   └── export/
│   │       ├── PDFExporter.ts          # Main export orchestrator
│   │       ├── PageRenderer.ts         # Step page canvas renderer
│   │       ├── OverviewPageRenderer.ts # Attack overview page
│   │       └── CommandsPageRenderer.ts # Commands reference page
│   ├── shared/
│   │   ├── schemas/
│   │   │   └── scenario.schema.ts      # Zod schemas + TypeScript types
│   │   ├── config/
│   │   │   ├── mitre-index.ts          # MITRE ATT&CK technique database
│   │   │   └── icon-registry.ts        # Icon path mappings
│   │   └── utils/
│   │       └── jsonSanitizer.ts        # LLM output auto-fix
│   ├── ui/
│   │   ├── features/
│   │   │   ├── GraphCanvas/            # Cytoscape container + custom renderers
│   │   │   ├── Timeline/               # Playback controls
│   │   │   ├── AttackDetails/          # Metadata panels (Overview, Commands, MITRE)
│   │   │   └── Export/                 # PDF export modal
│   │   ├── components/                 # Shared UI atoms
│   │   └── layouts/                    # App shell
│   ├── App.tsx
│   └── main.tsx
├── docs/
│   ├── specs/                   # Feature specifications
│   ├── full-llm-prompt.md       # LLM JSON generation prompt
│   └── json-attack-graph-spec.md # Schema specification
└── package.json
```

## 5. Core Systems

### 5.1 Scenario Schema

The data model centers on `ScenarioData` (see `src/shared/schemas/scenario.schema.ts`):

```typescript
ScenarioSchema = {
    title: string,
    description?: string,
    shortDescription?: string,      // 7-word summary
    tags?: string[],                 // Categorization
    version: string,
    viewport?: { zoom, pan },

    metadata?: {
        descriptionHtml?: string,    // Rich HTML description
        commandsBlock?: string,      // Copy-paste CLI commands
        extraInfo?: string[],        // GitHub, CVE, tool links
        prerequisites?: string[],    // Attack requirements
        attackerGains?: string[],    // What attacker achieves
        detectionNotes?: string[],   // Blue team indicators
        mitreCategories?: string[],  // MITRE technique IDs
    },

    entities: Entity[],              // Nodes and containers
    visibility?: VisibilityMap,      // Step-based show/hide
    steps: TimelineStep[],           // Attack progression
}
```

### 5.2 Graph Engine

**Location**: `src/ui/features/GraphCanvas/`

- **Cytoscape Integration**: Manages the graph instance, layout, and events
- **Custom Canvas Layer**: `ContainerHeaderRenderer.ts` draws container labels via `cytoscape-canvas`
- **Theme**: `cytoscape-theme.ts` defines node/edge styles, colors, and MITRE tactic colors

### 5.3 State Management

**Location**: `src/core/store/useScenarioStore.ts`

Zustand store managing:
- Current scenario data
- Cytoscape elements (nodes, edges)
- Timeline state (current step)
- Extracted metadata (with fallback logic)

### 5.4 PDF Export System

**Location**: `src/core/export/`

Generates LinkedIn-optimized carousel PDFs (1080x1350, 4:5 ratio):

1. **Cover Page** - Title + zoomed-out graph
2. **Overview Page** - Prerequisites, gains, detection, MITRE badges, extra info
3. **Step Pages** - Graph snapshot + CLI command + tooltip for each step
4. **Commands Page** - Full command reference with syntax highlighting

### 5.5 LLM Integration

**Two-Step Workflow**:

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Attack Name  │────▶│ Deep Search │────▶│ Rich Report  │
└──────────────┘     │ (GPT/Gemini)│     └──────────────┘
                     └─────────────┘            │
                                                ▼
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Scenario JSON│◀────│ LLM Prompt  │◀────│ Report +     │
└──────────────┘     │ (translate) │     │ full-llm-prompt│
                     └─────────────┘     └──────────────┘
```

- **Step 1**: Deep search gathers comprehensive attack research
- **Step 2**: LLM translates report to scenario JSON using `full-llm-prompt.md`

## 6. Data Flow

```
                    ┌─────────────────┐
                    │   JSON File     │
                    │ (public/data/)  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ ScenarioAdapter │  Zod validation + transform
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ useScenarioStore│  State + metadata extraction
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌───────────┐  ┌───────────┐  ┌───────────┐
       │GraphCanvas│  │AttackPanel│  │PDFExporter│
       │(Cytoscape)│  │(Metadata) │  │(Carousel) │
       └───────────┘  └───────────┘  └───────────┘
```

## 7. Key Features

| Feature | Description | Location |
|---------|-------------|----------|
| Timeline Playback | Step-through attack animation | `ui/features/Timeline/` |
| MITRE Integration | Technique lookup + tactic coloring | `shared/config/mitre-index.ts` |
| Container Nesting | Compound nodes with custom headers | `GraphCanvas/ContainerHeaderRenderer.ts` |
| Visibility Control | Show/hide entities per step | `scenario.visibility` field |
| Layout Persistence | Save positions back to JSON | Vite middleware |
| JSON Sanitization | Auto-fix malformed LLM output | `shared/utils/jsonSanitizer.ts` |

## 8. File Formats

### Scenario JSON (v3.0)

Primary input format. See `docs/json-attack-graph-spec.md` for full specification.

### Legacy Mermaid Text

Deprecated format still supported via `LegacyMermaidAdapter.ts`. New scenarios should use JSON.

## 9. Security Considerations

- **Input Validation**: All JSON parsed through Zod schemas
- **Sanitization**: `jsonSanitizer.ts` handles malformed LLM output
- **File Access**: Vite middleware restricted to `public/data/` directory
- **No Execution**: Attack commands displayed only, never executed

## 10. Documentation Index

| Document | Purpose |
|----------|---------|
| `docs/full-llm-prompt.md` | LLM prompt for JSON generation |
| `docs/json-attack-graph-spec.md` | Complete schema specification |
| `docs/specs/17_enrich_spec.md` | Metadata & export system (current) |
| `docs/specs/README.md` | Spec index with status |
