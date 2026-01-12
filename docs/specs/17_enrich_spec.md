# Enrich Spec: Metadata, Prompts & Export System

> **Version**: 1.0
> **Date**: January 2025
> **Status**: Implemented

## Overview

This spec documents the enriched metadata system that provides comprehensive attack context throughout the application. It covers:

1. **Two-Step LLM Workflow** - Deep Search → JSON Generation
2. **Data Model** - Schema fields for rich metadata
3. **UI Components** - How metadata displays in the app
4. **PDF Export** - Carousel pages with attack context

---

## 1. Two-Step LLM Workflow

### Problem

Single-prompt LLM generation produces shallow research because:
- LLMs do quick, surface-level searches
- JSON generation competes with research for context window
- Output quality varies based on LLM's training data

### Solution

Separate **research** from **translation**:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Attack Name    │────▶│   Deep Search    │────▶│  Rich Report    │
│  (CVE, tool)    │     │  (GPT/Gemini)    │     │  (structured)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Scenario JSON  │◀────│   LLM Prompt     │◀────│  Rich Report +  │
│  (final output) │     │  (translation)   │     │  full-llm-prompt│
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Step 1: Deep Search Prompt

**Location**: Manual input to GPT/Gemini with deep search enabled

**Input**: Attack name, CVE, or technique description

**Prompt Template**:
```
Research the following attack/technique/vulnerability thoroughly:

[ATTACK NAME / CVE / DESCRIPTION HERE]

Produce a structured technical report covering ALL of the following sections.
Be comprehensive and cite specific sources where possible.

---

## 1. ATTACK OVERVIEW
- What is this attack/technique? (2-3 sentences)
- Attack category (e.g., credential access, lateral movement, initial access, persistence)
- Target systems/platforms (Windows, Linux, Cloud, Web, etc.)

## 2. TECHNICAL FLOW
Describe the attack step-by-step from attacker's perspective:
1. Initial conditions/setup
2. Each action the attacker takes
3. What happens on the target system
4. Final outcome/impact

Include network protocols, ports, and system components involved.

## 3. COMMANDS & TOOLS
List the actual commands/tools used:
- Tool name and source (GitHub URL, Kali path, pip/apt install)
- Exact command syntax with flags explained
- Alternative tools that achieve the same goal
- Any required dependencies

## 4. PREREQUISITES
What must be true for this attack to work?
- Network access requirements
- Credentials/permissions needed
- Target configuration requirements
- Environmental conditions

## 5. ATTACKER GAINS
What does the attacker achieve?
- Immediate gains (credentials, access, data)
- Potential follow-up attacks enabled
- Persistence mechanisms if applicable

## 6. DETECTION & DEFENSE
How can defenders detect/prevent this?
- Log sources to monitor (Windows Event IDs, syslog, etc.)
- Network indicators
- Endpoint indicators
- Recommended mitigations

## 7. MITRE ATT&CK MAPPING
- Primary technique ID and name (e.g., T1558.003 - Kerberoasting)
- Related techniques
- Tactic category (e.g., Credential Access)

## 8. REFERENCES
- CVE numbers if applicable
- Official documentation
- Security research blogs/papers
- GitHub repositories
- Conference talks (DEF CON, Black Hat, etc.)

---

Focus on accuracy and technical depth. Include specific version numbers,
patch levels, or conditions where relevant.
```

### Step 2: JSON Generation Prompt

**Location**: `docs/full-llm-prompt.md`

**Input**: Deep search report + the full-llm-prompt

**Output**: Complete scenario JSON with all metadata fields populated

---

## 2. Data Model

### Schema Location

`src/shared/schemas/scenario.schema.ts`

### Root Scenario Fields

```typescript
ScenarioSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    version: z.string().default('2.0'),
    viewport: ViewportSchema.optional(),

    // Enriched fields
    shortDescription: z.string().optional(),       // 7-word max summary
    tags: z.array(z.string()).optional(),          // Categorization tags
    metadata: ScenarioMetadataSchema.optional(),   // Rich metadata object

    entities: z.array(ScenarioEntitySchema),
    visibility: VisibilityMapSchema.optional(),
    steps: z.array(TimelineStepSchema)
});
```

### Metadata Schema

```typescript
ScenarioMetadataSchema = z.object({
    descriptionHtml: z.string().optional(),        // Full HTML description
    commandsBlock: z.string().optional(),          // Copy-paste CLI commands
    extraInfo: z.array(z.string()).optional(),     // GitHub, CVE, tool links
    prerequisites: z.array(z.string()).optional(), // Attack requirements
    attackerGains: z.array(z.string()).optional(), // What attacker achieves
    detectionNotes: z.array(z.string()).optional(),// Detection/OPSEC notes
    mitreCategories: z.array(z.string()).optional(),// MITRE technique IDs
    owaspCategories: z.array(z.string()).optional(),// OWASP categories
});
```

### Extracted Metadata Interface

Used by UI and PDF export with fallback logic:

```typescript
interface ExtractedMetadata {
    shortDescription: string;      // Falls back to description
    tags: string[];                // Empty array if missing
    descriptionHtml: string | null;
    commandsBlock: string;         // Built from steps if missing
    extraInfo: string[];           // Empty array if missing
    prerequisites: string[];
    attackerGains: string[];
    detectionNotes: string[];
    mitreCategories: string[];     // Extracted from steps if missing
}
```

### Field Mapping: Deep Search → JSON

| Deep Search Section | JSON Field | Notes |
|---------------------|------------|-------|
| 1. Attack Overview | `description`, `shortDescription` | Overview → short, details → description |
| 2. Technical Flow | `steps[]`, `entities[]` | Each step becomes edge, actors become nodes |
| 3. Commands & Tools | `metadata.commandsBlock`, `steps[].cli` | Commands go both places |
| 3. Tools (sources) | `metadata.extraInfo[]` | GitHub URLs, Kali paths |
| 4. Prerequisites | `metadata.prerequisites[]` | Direct mapping |
| 5. Attacker Gains | `metadata.attackerGains[]` | Direct mapping |
| 6. Detection | `metadata.detectionNotes[]` | Direct mapping |
| 7. MITRE Mapping | `metadata.mitreCategories[]`, `steps[].mitre` | IDs in both places |
| 8. References | `metadata.extraInfo[]` | CVEs, blogs, GitHub |
| Category/Tags | `tags[]` | Derived from overview |

---

## 3. UI Components

### Overview Tab

**Location**: `src/ui/features/AttackDetails/OverviewTab.tsx`

**Displays**:
1. **Stats Bar** - Step count, entity count, MITRE count
2. **Short Description** - 7-word summary
3. **Tags** - Colored chips with category-based styling
4. **Prerequisites** - Bullet list with amber accent
5. **Attacker Gains** - Bullet list with red accent
6. **Detection / OPSEC** - Bullet list with blue accent
7. **Extra Info** - Bullet list with violet accent (GitHub, CVE, tools)

**Section Rendering Pattern**:
```tsx
{metadata && metadata.fieldName.length > 0 && (
    <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase">
            <Icon size={12} />
            Section Title
        </h4>
        <ul className="space-y-1.5">
            {metadata.fieldName.map((item, i) => (
                <li key={i} className="text-sm text-slate-300">
                    <span className="text-[accent]-400">•</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    </div>
)}
```

### Commands Tab

**Location**: `src/ui/features/AttackDetails/CommandsTab.tsx`

**Displays**:
- `metadata.commandsBlock` with syntax highlighting
- Copy-to-clipboard functionality
- Monospace font styling

### Description Tab

**Location**: `src/ui/features/AttackDetails/DescriptionTab.tsx`

**Displays**:
- `metadata.descriptionHtml` rendered as HTML
- Styled spans for tools (red), ports (blue)
- Ordered/unordered lists for attack steps

---

## 4. PDF Export System

### Architecture

```
PDFExporter.ts (orchestrator)
    ├── PageRenderer.ts        (step pages)
    ├── OverviewPageRenderer.ts (attack overview page)
    └── CommandsPageRenderer.ts (commands reference page)
```

### Export Options

**Location**: `src/core/export/pdf.constants.ts`

```typescript
interface PDFExportOptions {
    includeTooltips: boolean;      // Step tooltips on pages
    includeCLI: boolean;           // CLI commands on step pages
    includeMitre: boolean;         // MITRE badges
    coverPage: boolean;            // Title/overview cover
    ctaPage: boolean;              // "Swipe" CTA page
    includeOverviewPage: boolean;  // Attack Overview page
    includeCommandsPage: boolean;  // Commands Reference page
    quality: 'standard' | 'high';
    selectionBounds: SelectionBounds | null;
}
```

### Page Types

#### 1. Cover Page
- Scenario title
- Graph overview (zoomed out)
- Description snippet

#### 2. Overview Page (Attack Context)

**Location**: `src/core/export/OverviewPageRenderer.ts`

**Sections rendered in order**:
1. "ATTACK OVERVIEW" title
2. Scenario subtitle
3. Summary (shortDescription)
4. Description (HTML stripped to plain text)
5. Prerequisites (bullet list, amber accent)
6. Attacker Gains (bullet list, red accent)
7. Detection / OPSEC (bullet list, blue accent)
8. MITRE ATT&CK (technique badges)
9. Extra Info (bullet list, purple accent)
10. Footer with step count

**Layout Constants**:
```typescript
OVERVIEW_LAYOUT = {
    TITLE_Y: 80,
    TITLE_FONT_SIZE: 32,
    SECTION_START_Y: 150,
    SECTION_GAP: 30,
    SECTION_TITLE_SIZE: 16,
    SECTION_CONTENT_SIZE: 14,
    BULLET_INDENT: 30,
    LINE_HEIGHT: 24,
    MAX_LINES_PER_SECTION: 8,
}
```

#### 3. Step Pages

**Location**: `src/core/export/PageRenderer.ts`

Each step page contains:
- Header with title and step indicator (e.g., "Step 3 of 8")
- Graph snapshot at current step state
- Info panel with:
  - Step name/action
  - CLI command (monospace, green text)
  - Tooltip description
  - MITRE badge (tactic-colored)

#### 4. Commands Page

**Location**: `src/core/export/CommandsPageRenderer.ts`

- "COMMANDS REFERENCE" title
- Full `commandsBlock` with syntax highlighting
- Comment lines in muted color
- Command lines in green monospace

### Page Dimensions

LinkedIn-optimized carousel (4:5 ratio):
```typescript
PAGE = {
    WIDTH: 1080,
    HEIGHT: 1350,
    PADDING: 40,
    SCALE: 2,  // Retina
}
```

### Color Palette

```typescript
COLORS = {
    BG_PRIMARY: '#0f172a',      // Slate 900
    BG_SECONDARY: '#1e293b',    // Slate 800
    BG_CLI: '#0c0c0c',          // Near black
    TEXT_PRIMARY: '#f8fafc',    // Slate 50
    TEXT_SECONDARY: '#cbd5e1',  // Slate 300
    TEXT_CLI: '#4ade80',        // Green 400
    BRAND_BLUE: '#3b82f6',
    BRAND_PURPLE: '#8b5cf6',
    AMBER: '#fbbf24',
}
```

### Container Labels in Export

**Problem**: Container labels are rendered via a custom `cytoscape-canvas` layer (`ContainerHeaderRenderer.ts`), which `cy.png()` doesn't capture.

**Solution**: `PDFExporter.applyExportStyles()` temporarily enables native Cytoscape labels for containers during export:

```typescript
// In applyExportStyles()
this.cy.nodes(':parent').forEach(container => {
    container.style({
        'label': container.data('label'),
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': -10,
        'font-size': 14,
        'font-weight': 'bold',
        'color': '#cbd5e1',
    });
});

// In restoreInteractiveStyles()
this.cy.nodes(':parent').forEach(container => {
    container.style({ 'label': '' });  // Disable native, let canvas layer handle it
});
```

---

## 5. JSON Sanitization

### Problem

LLM output sometimes contains malformed JSON:
- Unescaped double quotes in HTML attributes
- Trailing commas
- Control characters

### Solution

**Location**: `src/shared/utils/jsonSanitizer.ts`

```typescript
function parseJsonWithSanitization<T>(jsonString: string): T {
    // Try direct parse first
    try {
        return JSON.parse(jsonString);
    } catch {
        // Apply sanitization fixes
        const sanitized = sanitizeJson(jsonString);
        return JSON.parse(sanitized);
    }
}
```

**Sanitization Rules**:
1. Convert `style="..."` to `style='...'` inside JSON strings
2. Remove trailing commas before `}` or `]`
3. Escape control characters

### HTML Attribute Rule

**CRITICAL**: LLM prompt specifies single quotes for HTML attributes:
```html
<!-- CORRECT (inside JSON) -->
<span style='color:#ef4444'>text</span>

<!-- WRONG (breaks JSON parsing) -->
<span style="color:#ef4444">text</span>
```

---

## 6. File Reference

### Core Files

| File | Purpose |
|------|---------|
| `src/shared/schemas/scenario.schema.ts` | Zod schemas and TypeScript types |
| `src/core/store/useScenarioStore.ts` | State management with metadata extraction |
| `src/shared/utils/jsonSanitizer.ts` | JSON parsing with auto-fix |

### UI Files

| File | Purpose |
|------|---------|
| `src/ui/features/AttackDetails/OverviewTab.tsx` | Metadata display component |
| `src/ui/features/AttackDetails/CommandsTab.tsx` | Commands display component |
| `src/ui/features/AttackDetails/DescriptionTab.tsx` | HTML description renderer |
| `src/ui/features/Export/ExportModal.tsx` | PDF export options UI |

### Export Files

| File | Purpose |
|------|---------|
| `src/core/export/PDFExporter.ts` | Main export orchestrator |
| `src/core/export/PageRenderer.ts` | Step page canvas renderer |
| `src/core/export/OverviewPageRenderer.ts` | Overview page canvas renderer |
| `src/core/export/CommandsPageRenderer.ts` | Commands page canvas renderer |
| `src/core/export/pdf.constants.ts` | Dimensions, colors, layout constants |

### Documentation Files

| File | Purpose |
|------|---------|
| `docs/full-llm-prompt.md` | JSON generation prompt for LLM |
| `docs/json-attack-graph-spec.md` | Complete schema specification |
| `docs/specs/17_enrich_spec.md` | This document |

---

## 7. Example Data

### Sample JSON with Full Metadata

```json
{
  "title": "NPM Supply Chain Attack - Shai Hulud",
  "description": "Worm-like NPM package that uses Bun runtime for evasion",
  "shortDescription": "NPM worm using Bun for evasion",
  "tags": ["Supply_Chain", "NPM", "Credential_Dumping", "JavaScript"],
  "version": "3.0",
  "metadata": {
    "descriptionHtml": "<p><span style='color:#ef4444'>Shai Hulud</span> is an NPM supply chain attack...</p>",
    "commandsBlock": "# Step 1: Publish malicious package\n$ npm publish @malicious/pkg\n\n# Step 2: Victim installs\n$ npm install @malicious/pkg",
    "extraInfo": [
      "NPM Registry - https://www.npmjs.com/",
      "Bun Runtime - https://bun.sh",
      "MITRE T1195.002 - Supply Chain Compromise",
      "socket.dev - Supply chain security scanner"
    ],
    "prerequisites": [
      "Victim installs compromised package",
      "Outbound network access",
      "Write access to filesystem"
    ],
    "attackerGains": [
      "Cloud credentials (AWS, GCP)",
      "SSH keys",
      "NPM tokens for propagation"
    ],
    "detectionNotes": [
      "Unexpected Bun installation (~/.bun)",
      "Suspicious postinstall scripts",
      "Outbound git push to unknown repos"
    ],
    "mitreCategories": ["T1195.002", "T1059.007"]
  },
  "entities": [...],
  "steps": [...]
}
```

---

## 8. Future Considerations

1. **Auto-linking**: Detect URLs in `extraInfo` and make them clickable in UI
2. **MITRE Enrichment**: Auto-fetch technique descriptions from MITRE API
3. **CVE Integration**: Parse CVE IDs and fetch CVSS scores
4. **Export Templates**: Multiple PDF themes (dark, light, minimal)
5. **Batch Processing**: Queue multiple deep searches for bulk scenario generation
