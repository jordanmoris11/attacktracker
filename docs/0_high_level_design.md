# CyberViewer-Cyto: High Level Design (Enterprise Edition)

## 1. Vision
**CyberViewer-Cyto** is a mission-critical visualization engine for cybersecurity attack flows. It transforms complex threat data into clear, interactive graphs. The architecture prioritizes **Type Safety**, **Runtime Validation**, and **Domain Isolation**, utilizing a modern React-based stack to deliver a "World Class" user experience.

> **Rewrite Context**: This project effectively supersedes the legacy code found in `Old_Code/`.

## 2. Architecture Principles
1.  **Domain Isolation**: The Graph Engine (`core/graph`) is a pure TypeScript layout engine, decoupled from the React UI. It enables portability (e.g., CLI usage or different renderers).
2.  **Unidirectional Data Flow**: Data flows from `Store` -> `Graph Engine` -> `React UI`. UI events trigger Actions, not direct mutations.
3.  **Runtime Integrity**: All external inputs (JSON, Legacy Formats) are validated via **Zod** schemas before entering the system.
4.  **Component-Driven UI**: The UI is built with distinct, reusable React components styled with Tailwind CSS for consistency and scalability.

## 3. Technology Stack
-   **Runtime/Build**: Vite (ES Modules)
-   **Framework**: React 18+ (TypeScript 5+ Strict)
-   **State Management**: Zustand
-   **Styling**: Tailwind CSS
-   **Validation**: Zod
-   **Graph Engine**: Cytoscape.js + cytoscape-dagre
-   **Testing**: Vitest (Unit), Playwright (E2E)

## 4. Directory Structure
```text
cyberviewer-cyto/
├── public/                 # Static Assets
│   ├── data/               # Attack JSONs / Legacy .txt
│   └── assets/             # Icons (SVG)
├── src/
│   ├── core/               # CORE DOMAIN (Framework Agnostic)
│   │   ├── graph/
│   │   │   ├── CytoscapeHost.ts # Main Engine Wrapper
│   │   │   ├── styles/         # Graph Stylesheets
│   │   │   └── adapters/       # Data Transformers
│   │   │       ├── LegacyMermaidAdapter.ts
│   │   │       └── TypedJsonAdapter.ts
│   │   ├── store/
│   │   │   └── useGraphStore.ts # Zustand Store
│   │   └── schemas/
│   │       └── graph.zod.ts    # Validation Schemas
│   ├── ui/                 # REACT UI
│   │   ├── features/       
│   │   │   ├── MatrixExplorer/ # MITRE Grid
│   │   │   ├── Playback/       # Time Travel Controls
│   │   │   └── GraphCanvas/    # Cytoscape Container
│   │   ├── components/     # Shared Atoms (Buttons, Panels)
│   │   ├── layouts/        # App Shell
│   │   └── styles/         # Tailwind Directives
│   ├── hooks/              # Custom React Hooks
│   ├── App.tsx
│   └── main.tsx
├── tests/                  # TEST SUITES
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 5. Key Components

### 5.1 The Graph Host (`src/core/graph/CytoscapeHost.ts`)
A singleton-like class (or managed instance) that encapsulates the raw `cytoscape` instance.
-   **Responsibilities**: Initialization, Layout execution (`dagre`), Event bridging.
-   **API**: Exposes methods like `loadData()`, `fit()`, `highlightPath()`.
-   **State Sync**: Syncs internal graph state (selection, zoom) back to the Zustand store.

### 5.2 Icon System
-   **SVG Loading**: Custom Cytoscape extensions or style mappers to render SVGs efficiently.
-   **Config**: A strictly typed registry mapping logical entity types (e.g., "Attacker", "Win10") to asset paths.

### 5.3 Legacy Adapter Layer
-   **LegacyMermaidAdapter**: Regex-based parsing to convert old text-based flowcharts into the new `GraphData` schema.
-   **Goal**: Deprecate eventual text usage in favor of LLM-generated JSON, but maintain read-compatibility.

### 5.4 Persistence Layer (Middleware)
-   **Vite Plugin** (`vite-plugin-json-save`): A custom middleware that exposes a `POST /api/save` endpoint during development.
-   **Function**: Enables writing graph layout changes (positions, viewport) directly back to the source JSON file on disk, enforcing a "File as Source of Truth" architecture.
-   **Security**: Restricted to `public/data` directory to prevent arbitrary file system access.

## 6. Implementation Strategy
1.  **Scaffold**: Initialize Vite + React + TypeScript + Tailwind.
2.  **Core Foundation**: Implement `GraphHost` and basic Zod schemas.
3.  **Adapters**: Port the "beautifier" logic from Old Code to `adapters/LegacyMermaidAdapter`.
4.  **UI Construction**: Build the App Shell and GraphCanvas.
5.  **Feature Parity**: Rebuild the Matrix Explorer and Animation controls using React.