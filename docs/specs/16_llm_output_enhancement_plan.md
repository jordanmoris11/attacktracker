# LLM Output Enhancement Plan
## Leveraging Full LLM Output for UI & PDF Export

**Version:** 3.0 (Iteration 3 - Final)
**Date:** 2026-01-12
**Status:** Ready for Implementation

---

## Executive Summary

Currently, CyberViewer-Cyto only consumes the **Attack Graph JSON** from the LLM output. The full LLM prompt (`docs/full-llm-prompt.md`) generates **5 distinct outputs** that contain rich contextual information. This plan proposes extending the system to capture, store, display, and export ALL output fields.

---

## Part 1: Current State Analysis

### 1.1 LLM Output Structure (from `full-llm-prompt.md`)

The LLM generates 5 sections:

| # | Section | Content Type | Currently Used |
|---|---------|--------------|----------------|
| 1 | **Description** | HTML with structured sections | NO |
| 2 | **Tags** | Comma-separated strings | NO |
| 3 | **Commands** | Enhanced CLI with comments | NO |
| 4 | **Attack Graph** | JSON (ScenarioData) | YES |
| 5 | **Short Description** | 7 words max summary | NO |

### 1.2 Description HTML Structure

The Description contains 7 sub-sections:
1. Tool & Attack Description (what it does)
2. Tool location/source (where to get it)
3. Attack Prerequisites (requirements)
4. How attack works (numbered steps)
5. What attacker gains (outcomes)
6. Detection/Defense/OPSEC
7. MITRE/OWASP category

### 1.3 Current Schema Limitations

`src/shared/schemas/scenario.schema.ts` only captures:
- `title`, `description`, `version`, `viewport`
- `entities[]`, `visibility{}`, `steps[]`

Missing: tags, detailed HTML description, enhanced commands block, short description.

---

## Part 2: Proposed Schema Extension

### 2.1 New Root-Level Fields

```typescript
// Extended ScenarioSchema
export const ScenarioSchema = z.object({
    // Existing fields...
    title: z.string(),
    description: z.string().optional(),
    version: z.string().default('2.0'),
    viewport: ViewportSchema.optional(),
    entities: z.array(ScenarioEntitySchema),
    visibility: VisibilityMapSchema.optional(),
    steps: z.array(TimelineStepSchema),

    // NEW FIELDS
    shortDescription: z.string().optional(),     // 7-word summary
    tags: z.array(z.string()).optional(),        // ["AD", "Kerberoasting", "NTLM"]

    // Rich metadata object
    metadata: z.object({
        descriptionHtml: z.string().optional(),   // Full HTML description
        commandsBlock: z.string().optional(),     // Enhanced commands with comments
        toolSource: z.string().optional(),        // Where to get the tool
        prerequisites: z.array(z.string()).optional(),
        attackerGains: z.array(z.string()).optional(),
        detectionNotes: z.array(z.string()).optional(),
        mitreCategories: z.array(z.string()).optional(),
        owaspCategories: z.array(z.string()).optional(),
    }).optional(),
});
```

### 2.2 Backward Compatibility

The new fields are optional, so existing JSON files will continue to work without modification.

---

## Part 3: UI Enhancements

### 3.1 Attack Details Panel (New Component)

**Location:** Right sidebar or bottom drawer (collapsible)
**Purpose:** Display rich context about the current attack scenario

#### Tab Structure:

| Tab | Content | Source |
|-----|---------|--------|
| **Overview** | Short description + tags + graph stats | `shortDescription`, `tags` |
| **Description** | Full HTML description (rendered) | `metadata.descriptionHtml` |
| **Commands** | Syntax-highlighted CLI block | `metadata.commandsBlock` |
| **MITRE/OWASP** | Reference links, tactic breakdown | `metadata.mitreCategories` |

#### Wireframe:

```
┌─────────────────────────────────────────────────────────┐
│ [Overview] [Description] [Commands] [MITRE]             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Short Description ──────────────────────────────┐   │
│  │ Kerberoasting attack extracts service tickets    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Tags: [AD] [Kerberoasting] [Credential_Dumping]        │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Prerequisites:                                         │
│  • Valid domain user credentials                        │
│  • Access to domain controller                          │
│                                                         │
│  Attacker Gains:                                        │
│  • Service account password hashes                      │
│  • Lateral movement capabilities                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Tag Chips in Header

Display scenario tags as colored chips in the header bar next to the title.

```
┌──────────────────────────────────────────────────────────────────┐
│ NPM Supply Chain Attack  [Supply_Chain] [npm] [RCE]    [Export ▼]│
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Enhanced Edge Tooltip

Extend the existing `EdgeTooltip` to optionally show:
- Link to related MITRE technique (clickable)
- Copy CLI command button
- Visual indicator if this step has detailed commands

---

## Part 4: PDF Export Enhancements

### 4.1 Enhanced Cover Page

Current cover: Title + description + step count
Enhanced cover:

```
┌─────────────────────────────────────────┐
│                                         │
│        NPM Supply Chain Attack          │
│                                         │
│   "Trojanized package harvests cloud    │
│    credentials via preinstall hook"     │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ [T1195] [Supply_Chain] [npm]    │   │
│   └─────────────────────────────────┘   │
│                                         │
│         ┌───────────────┐               │
│         │  9 Steps      │               │
│         └───────────────┘               │
│                                         │
│         Swipe to begin →                │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 New: Attack Overview Page (Page 2)

After cover, before step 1:

```
┌─────────────────────────────────────────┐
│ ATTACK OVERVIEW                         │
├─────────────────────────────────────────┤
│                                         │
│ Tool & Attack Description               │
│ ─────────────────────────────           │
│ GetUserSPNs.py from Impacket suite      │
│ extracts Kerberos service tickets...    │
│                                         │
│ Prerequisites                           │
│ ─────────────────────────────           │
│ • Valid domain credentials              │
│ • Network access to DC                  │
│                                         │
│ What Attacker Gains                     │
│ ─────────────────────────────           │
│ • Service account password hashes       │
│ • Offline crackable ticket material     │
│                                         │
│         Swipe to continue →             │
└─────────────────────────────────────────┘
```

### 4.3 New: Commands Reference Page (Last Page)

After all steps, before CTA:

```
┌─────────────────────────────────────────┐
│ COMMANDS REFERENCE                      │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ # Step 1: Enumerate SPNs            │ │
│ │ $ GetUserSPNs.py -dc-ip 10.0.0.1 \  │ │
│ │   domain.local/user:password        │ │
│ │                                     │ │
│ │ # Step 2: Request TGS ticket        │ │
│ │ $ GetUserSPNs.py -request \         │ │
│ │   -outputfile hashes.txt ...        │ │
│ │                                     │ │
│ │ # Step 3: Crack offline             │ │
│ │ $ hashcat -m 13100 hashes.txt \     │ │
│ │   rockyou.txt                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Detection/OPSEC Notes:                  │
│ • Monitor for TGS-REQ events (4769)     │
│ • Anomalous service ticket requests     │
│                                         │
└─────────────────────────────────────────┘
```

### 4.4 Export Options Update

Add checkboxes in ExportModal:
- [ ] Include Attack Overview page
- [ ] Include Commands Reference page
- [ ] Include MITRE mapping summary

---

## Part 5: Parser/Adapter Updates

### 5.1 New: FullOutputParser

Create a new parser that handles the complete LLM output format:

```typescript
// src/core/parser/FullOutputParser.ts

interface FullLLMOutput {
    description: string;      // HTML
    tags: string[];
    commands: string;
    attackGraph: ScenarioData;
    shortDescription: string;
}

export function parseFullLLMOutput(rawText: string): FullLLMOutput {
    // Parse markdown-structured output
    // Extract each section
    // Return unified object
}
```

### 5.2 ScenarioAdapter Extension

Extend `ScenarioAdapter.parse()` to:
1. Accept either raw JSON (current) or full LLM output
2. Merge metadata into ScenarioData
3. Return enriched ParseResult

---

## Part 6: Implementation Phases

### Phase 1: Schema & Data Layer (Foundation)
1. Extend `scenario.schema.ts` with new fields
2. Create `FullOutputParser.ts`
3. Update `ScenarioAdapter` to merge metadata
4. Ensure backward compatibility with existing JSON files

### Phase 2: UI Enhancements
1. Create `AttackDetailsPanel` component
2. Add tag chips to header
3. Implement collapsible sidebar/drawer
4. Enhance `EdgeTooltip` with copy button

### Phase 3: PDF Export Enhancements
1. Update `PageRenderer` for enhanced cover
2. Create `OverviewPageRenderer` for attack overview
3. Create `CommandsPageRenderer` for commands reference
4. Add export options to `ExportModal`

### Phase 4: Polish & Integration
1. Test with various attack scenarios
2. Ensure mobile/responsive behavior
3. Add loading states for HTML content
4. Performance optimization (lazy rendering)

---

## Part 7: File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `scenario.schema.ts` | Modify | Add new optional fields |
| `FullOutputParser.ts` | Create | Parse full LLM output |
| `ScenarioAdapter.ts` | Modify | Support full output format |
| `AttackDetailsPanel.tsx` | Create | New sidebar component |
| `Header.tsx` | Modify | Add tag chips |
| `EdgeTooltip.tsx` | Modify | Add copy button |
| `PageRenderer.ts` | Modify | Enhanced cover page |
| `OverviewPageRenderer.ts` | Create | Attack overview page |
| `CommandsPageRenderer.ts` | Create | Commands reference page |
| `PDFExporter.ts` | Modify | Include new pages |
| `ExportModal.tsx` | Modify | Add export options |
| `pdf.constants.ts` | Modify | Add new layout constants |

---

## Appendix A: Sample Enhanced JSON

```json
{
    "title": "Kerberoasting Attack",
    "description": "Extract service tickets for offline cracking",
    "shortDescription": "Kerberoasting extracts crackable service tickets",
    "tags": ["AD", "Kerberoasting", "Credential_Dumping", "Impacket"],
    "version": "3.0",

    "metadata": {
        "descriptionHtml": "<div class=\"attack-desc\">...</div>",
        "commandsBlock": "# Step 1: Enumerate SPNs\nGetUserSPNs.py ...",
        "toolSource": "Impacket suite - https://github.com/fortra/impacket",
        "prerequisites": [
            "Valid domain user credentials",
            "Network access to Domain Controller"
        ],
        "attackerGains": [
            "Service account password hashes",
            "Potential for lateral movement"
        ],
        "detectionNotes": [
            "Monitor Windows Event 4769 (TGS-REQ)",
            "Anomalous service ticket request patterns"
        ],
        "mitreCategories": ["T1558.003 - Kerberoasting"],
        "owaspCategories": []
    },

    "entities": [...],
    "visibility": {...},
    "steps": [...]
}
```

---

---

# ITERATION 2: Refinements & Deep Dive

## Revision Notes (Iteration 2)

After reviewing iteration 1, the following refinements and additions are made:

### Key Changes in Iteration 2:
1. **Simplified metadata structure** - Flattened for easier access
2. **HTML sanitization strategy** - Security concern addressed
3. **Responsive UI approach** - Mobile-first considerations
4. **Step-synced context** - Show relevant metadata for current step
5. **Alternative: Floating panels vs Sidebar** - UX decision refined

---

## Part 8: Iteration 2 - UI Deep Dive

### 8.1 Layout Decision: Floating Panel vs Fixed Sidebar

**Option A: Fixed Right Sidebar (Rejected)**
- Pros: Always visible, familiar layout
- Cons: Reduces graph canvas space significantly, poor on mobile

**Option B: Floating Collapsible Panel (Selected)**
- Pros: Preserves graph space, can be dismissed, position-aware
- Cons: Extra click to access
- **Decision:** Use floating panel anchored bottom-right, collapsible

### 8.2 Refined Component: AttackDetailsPanel

```tsx
// src/ui/features/AttackDetails/AttackDetailsPanel.tsx

interface AttackDetailsPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    scenario: ScenarioData;
    currentStep: number; // To show step-synced info
}

// Panel states:
// - Collapsed: Small floating button with icon
// - Expanded: Panel with tabs
// - Maximized: Full-width drawer (mobile)
```

**Visual States:**

```
COLLAPSED (Always visible):
┌─────┐
│ 📋  │  ← Click to expand
└─────┘

EXPANDED (Default):
┌─────────────────────────────────────┐
│ Attack Details               [X] [-]│
├─────────────────────────────────────┤
│ [Overview] [Commands] [MITRE]       │
│                                     │
│ ...content...                       │
│                                     │
└─────────────────────────────────────┘

MAXIMIZED (Mobile/User choice):
┌─────────────────────────────────────────────────────────┐
│ Attack Details                                    [X]   │
├─────────────────────────────────────────────────────────┤
│ [Overview] [Description] [Commands] [MITRE]             │
│                                                         │
│ ... full content with scroll ...                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Step-Synced Context Feature

**New Concept:** The panel can highlight information relevant to the current step.

When user is on Step 5 (e.g., "Read AWS credentials"):
- Overview tab shows: Current step summary
- Commands tab highlights: Command for step 5
- MITRE tab shows: T1552.001 highlighted

```tsx
// Pseudo-code for step-synced content
const currentStepData = scenario.steps[currentStep - 1];
const relevantMitre = currentStepData?.mitre?.id;

// In Commands tab:
<CommandsBlock
    commands={scenario.metadata?.commandsBlock}
    highlightStep={currentStep}
/>
```

### 8.4 Tag Chip Color System

Tags should have consistent colors based on category:

| Category | Tags | Color |
|----------|------|-------|
| Attack Phase | Initial_Access, Execution, Persistence | Red variants |
| Protocol/Tech | SMB, LDAP, Kerberos, HTTP | Blue variants |
| Tool | Impacket, Mimikatz, CrackMapExec | Purple variants |
| Platform | Windows, Linux, AD | Green variants |
| MITRE | T-codes | Orange (matches existing) |

**Implementation:**

```typescript
// src/shared/config/tag-colors.ts
export const TAG_CATEGORIES: Record<string, { pattern: RegExp; color: string }> = {
    attack_phase: { pattern: /Initial_Access|Execution|Persistence|.../, color: '#ef4444' },
    protocol: { pattern: /SMB|LDAP|Kerberos|HTTP|.../, color: '#3b82f6' },
    tool: { pattern: /Impacket|Mimikatz|CrackMapExec|.../, color: '#8b5cf6' },
    platform: { pattern: /Windows|Linux|AD|.../, color: '#10b981' },
};

export function getTagColor(tag: string): string {
    for (const [_, cat] of Object.entries(TAG_CATEGORIES)) {
        if (cat.pattern.test(tag)) return cat.color;
    }
    return '#64748b'; // Default slate
}
```

---

## Part 9: Iteration 2 - Technical Challenges

### 9.1 HTML Sanitization (Security Critical)

The `descriptionHtml` field contains raw HTML from LLM output. This is a **potential XSS vector**.

**Solution: DOMPurify**

```typescript
// src/shared/utils/sanitizeHtml.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['div', 'span', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3', 'h4'],
        ALLOWED_ATTR: ['class', 'style'],
        ALLOWED_STYLE_PROPS: ['color', 'font-weight', 'background-color', 'padding', 'margin'],
    });
}
```

**Rendering:**

```tsx
// In Description tab
<div
    className="prose prose-invert prose-sm"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(metadata.descriptionHtml) }}
/>
```

### 9.2 Commands Syntax Highlighting

Use a lightweight highlighter for bash/shell commands.

**Option A: highlight.js** (Heavy, full-featured)
**Option B: Prism.js** (Lighter, tree-shakeable)
**Option C: Custom regex** (Lightest, limited)

**Selected: Option C** (Custom for performance)

```typescript
// src/shared/utils/highlightCommands.ts
export function highlightCommands(code: string): string {
    return code
        // Comments
        .replace(/(#.*$)/gm, '<span class="text-slate-500">$1</span>')
        // Commands/tools
        .replace(/\b(nmap|hashcat|impacket|GetUserSPNs\.py|secretsdump\.py|evil-winrm)\b/g,
            '<span class="text-red-400 font-bold">$1</span>')
        // Flags
        .replace(/(\s-\w+)/g, '<span class="text-cyan-400">$1</span>')
        // Strings
        .replace(/('.*?'|".*?")/g, '<span class="text-amber-400">$1</span>');
}
```

### 9.3 PDF Text Rendering for HTML Content

The PDF export uses Canvas API, which cannot render HTML directly.

**Solution: HTML → Plain Text Converter**

```typescript
// src/core/export/htmlToText.ts
export function htmlToPlainText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Convert <li> to bullet points
    temp.querySelectorAll('li').forEach(li => {
        li.textContent = '• ' + li.textContent;
    });

    // Convert <ol><li> to numbered
    temp.querySelectorAll('ol').forEach(ol => {
        ol.querySelectorAll('li').forEach((li, i) => {
            li.textContent = `${i + 1}. ` + li.textContent?.replace('• ', '');
        });
    });

    return temp.textContent || '';
}

// For structured extraction:
export function extractDescriptionSections(html: string): {
    toolDescription: string;
    prerequisites: string[];
    attackSteps: string[];
    attackerGains: string[];
    detection: string[];
} {
    // Parse HTML and extract each section by heading
}
```

### 9.4 Parsing Full LLM Output

The LLM output is markdown-structured, not JSON. We need a robust parser.

**Expected Format:**

```markdown
## 1. Description

<div>...HTML content...</div>

## 2. Tags

AD, Kerberoasting, Credential_Dumping, Impacket

## 3. Commands

```bash
# Step 1: Enumerate SPNs
GetUserSPNs.py -dc-ip 10.0.0.1 domain.local/user:pass
```

## 4. Attack Graph (JSON)

{
    "title": "...",
    ...
}

## 5. Short Description

Kerberoasting extracts crackable service tickets
```

**Parser Implementation:**

```typescript
// src/core/parser/FullOutputParser.ts

const SECTION_MARKERS = {
    description: /^##\s*1\.\s*Description/im,
    tags: /^##\s*2\.\s*Tags/im,
    commands: /^##\s*3\.\s*Commands/im,
    attackGraph: /^##\s*4\.\s*Attack Graph/im,
    shortDescription: /^##\s*5\.\s*Short Description/im,
};

export function parseFullLLMOutput(rawText: string): FullLLMOutput {
    // Split by section markers
    const sections = splitBySections(rawText, SECTION_MARKERS);

    // Extract JSON from Attack Graph section
    const jsonMatch = sections.attackGraph.match(/\{[\s\S]*\}/);
    const attackGraph = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    // Parse tags as array
    const tags = sections.tags.trim().split(',').map(t => t.trim()).filter(Boolean);

    // Extract commands block (between code fences)
    const commandsMatch = sections.commands.match(/```(?:bash|shell)?\n([\s\S]*?)```/);
    const commands = commandsMatch ? commandsMatch[1].trim() : sections.commands.trim();

    return {
        descriptionHtml: sections.description.trim(),
        tags,
        commandsBlock: commands,
        attackGraph,
        shortDescription: sections.shortDescription.trim(),
    };
}
```

---

## Part 10: Iteration 2 - PDF Layout Refinements

### 10.1 Page Sequence Options

**Option A: Linear Sequence (Simple)**
```
Cover → Step 1 → Step 2 → ... → Step N → Commands → CTA
```

**Option B: Context-First (Recommended)**
```
Cover → Overview → Step 1 → Step 2 → ... → Step N → Commands → CTA
```

**Selected: Option B** - Users need context before diving into steps.

### 10.2 Overview Page Layout (Refined)

```
┌─────────────────────────────────────────────────────────┐
│ ATTACK OVERVIEW                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ TOOL                                                │ │
│ │ GetUserSPNs.py (Impacket)                          │ │
│ │ github.com/fortra/impacket                         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ATTACK VECTOR                                           │
│ ─────────────────                                       │
│ Kerberoasting exploits the Kerberos authentication     │
│ protocol to extract service account password hashes     │
│ for offline cracking...                                 │
│                                                         │
│ PREREQUISITES              │ ATTACKER GAINS            │
│ ─────────────────          │ ──────────────            │
│ • Domain user creds        │ • Service account hashes  │
│ • Network to DC            │ • Lateral movement paths  │
│                            │ • Privilege escalation    │
│                                                         │
│ MITRE ATT&CK                                            │
│ ─────────────────                                       │
│ [T1558.003] Steal or Forge Kerberos Tickets:           │
│             Kerberoasting                               │
│                                                         │
│                                           Swipe → 1/9   │
└─────────────────────────────────────────────────────────┘
```

### 10.3 Commands Reference Page (Multi-Page Support)

If commands are long, split across multiple pages.

**Page Break Strategy:**
- Max ~15 lines of commands per page
- Break at step boundaries (# Step N comments)
- If single step exceeds page, truncate with "..."

---

## Part 11: Iteration 2 - Store Updates

### 11.1 Extended Zustand Store

```typescript
// Additions to useScenarioStore.ts

interface ScenarioState {
    // ... existing ...

    // New: Panel state
    detailsPanelOpen: boolean;
    detailsPanelTab: 'overview' | 'description' | 'commands' | 'mitre';

    // New: Parsed metadata (separate from scenario for cleaner access)
    metadata: {
        shortDescription: string | null;
        tags: string[];
        descriptionHtml: string | null;
        commandsBlock: string | null;
        prerequisites: string[];
        attackerGains: string[];
        detectionNotes: string[];
        mitreCategories: string[];
    };
}

interface ScenarioActions {
    // ... existing ...

    // New actions
    toggleDetailsPanel: () => void;
    setDetailsPanelTab: (tab: ScenarioState['detailsPanelTab']) => void;
    setMetadata: (meta: Partial<ScenarioState['metadata']>) => void;
}
```

### 11.2 Metadata Extraction on Load

When scenario loads, extract metadata:

```typescript
// In ScenarioAdapter or store action

function extractMetadata(scenario: ScenarioData): ScenarioState['metadata'] {
    return {
        shortDescription: scenario.shortDescription || null,
        tags: scenario.tags || [],
        descriptionHtml: scenario.metadata?.descriptionHtml || null,
        commandsBlock: scenario.metadata?.commandsBlock ||
            // Fallback: aggregate CLI from steps
            scenario.steps
                .filter(s => s.type === 'edge' && s.cli)
                .map((s, i) => `# Step ${i + 1}: ${s.name}\n$ ${(s as EdgeStep).cli}`)
                .join('\n\n'),
        prerequisites: scenario.metadata?.prerequisites || [],
        attackerGains: scenario.metadata?.attackerGains || [],
        detectionNotes: scenario.metadata?.detectionNotes || [],
        mitreCategories: scenario.metadata?.mitreCategories ||
            // Fallback: extract from steps
            [...new Set(scenario.steps.map(s => s.mitre?.id).filter(Boolean))],
    };
}
```

---

## Part 12: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| XSS via HTML injection | Medium | High | DOMPurify sanitization |
| PDF rendering failures | Low | Medium | Error boundaries, fallback text |
| Large HTML slows UI | Medium | Low | Lazy loading, virtualization |
| Parser fails on edge cases | Medium | Medium | Robust regex, error handling |
| Breaking existing JSON files | Low | High | All new fields optional |

---

---

---

# ITERATION 3: Final Plan & Implementation Guide

## Revision Notes (Iteration 3 - Final)

After reviewing iterations 1 and 2, final decisions and implementation details are documented below.

### Key Decisions Finalized:
1. **Metadata is embedded in JSON** - Not parsed from markdown (simpler, more reliable)
2. **Two-phase rollout** - UI first, then PDF enhancements
3. **Graceful degradation** - UI works with or without metadata
4. **Commands fallback** - Auto-aggregate from step.cli if no commandsBlock
5. **Simplified tag colors** - Use MITRE tactic colors for consistency

---

## Part 13: Final Architecture Decision

### 13.1 Data Flow (Finalized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                      │
└─────────────────────────────────────────────────────────────────────────┘

     LLM Output (Markdown)          OR          Pre-generated JSON
            │                                          │
            ▼                                          │
    ┌───────────────┐                                  │
    │ FullOutput    │                                  │
    │ Parser.ts     │                                  │
    └───────┬───────┘                                  │
            │                                          │
            ▼                                          ▼
    ┌─────────────────────────────────────────────────────┐
    │              Enhanced ScenarioData                   │
    │  (with metadata, tags, shortDescription)            │
    └──────────────────────┬──────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Zustand Store        │
              │  useScenarioStore.ts   │
              └───────────┬────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌───────────────┐           ┌───────────────┐
    │  UI Layer     │           │  PDF Export   │
    │  (React)      │           │  (Canvas)     │
    └───────────────┘           └───────────────┘
```

### 13.2 Backwards Compatibility Strategy

```typescript
// Smart metadata extraction with fallbacks
function getMetadata(scenario: ScenarioData): ExtractedMetadata {
    return {
        // Direct fields (new format)
        shortDescription: scenario.shortDescription || scenario.description || '',
        tags: scenario.tags || [],

        // Nested metadata (new format)
        descriptionHtml: scenario.metadata?.descriptionHtml || null,

        // Fallback: Build commands from steps
        commandsBlock: scenario.metadata?.commandsBlock ||
            buildCommandsFromSteps(scenario.steps),

        // Fallback: Extract MITRE from steps
        mitreCategories: scenario.metadata?.mitreCategories ||
            extractMitreFromSteps(scenario.steps),

        prerequisites: scenario.metadata?.prerequisites || [],
        attackerGains: scenario.metadata?.attackerGains || [],
        detectionNotes: scenario.metadata?.detectionNotes || [],
    };
}

function buildCommandsFromSteps(steps: TimelineStep[]): string {
    return steps
        .filter((s): s is EdgeStep => s.type === 'edge' && !!s.cli)
        .map((s, i) => `# Step ${i + 1}: ${s.name}\n$ ${s.cli}`)
        .join('\n\n');
}

function extractMitreFromSteps(steps: TimelineStep[]): string[] {
    const ids = steps
        .map(s => s.mitre?.id)
        .filter((id): id is string => !!id);
    return [...new Set(ids)];
}
```

---

## Part 14: Implementation Order (Prioritized)

### Priority 1: Schema Extension (Foundation)
**Files:** `scenario.schema.ts`
**Effort:** Low
**Risk:** Low

```typescript
// ADD to ScenarioSchema
shortDescription: z.string().optional(),
tags: z.array(z.string()).optional(),
metadata: MetadataSchema.optional(),

// NEW MetadataSchema
export const MetadataSchema = z.object({
    descriptionHtml: z.string().optional(),
    commandsBlock: z.string().optional(),
    toolSource: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
    attackerGains: z.array(z.string()).optional(),
    detectionNotes: z.array(z.string()).optional(),
    mitreCategories: z.array(z.string()).optional(),
    owaspCategories: z.array(z.string()).optional(),
}).strict();
```

### Priority 2: Store Extension
**Files:** `useScenarioStore.ts`
**Effort:** Low
**Risk:** Low

Add:
- `detailsPanelOpen: boolean`
- `detailsPanelTab: string`
- `extractedMetadata: ExtractedMetadata | null`
- Actions: `toggleDetailsPanel`, `setDetailsPanelTab`

### Priority 3: Attack Details Panel (Core UI)
**Files:** `AttackDetailsPanel.tsx` (new), `App.tsx` or layout
**Effort:** Medium
**Risk:** Medium

Component structure:
```
AttackDetailsPanel/
├── index.tsx              # Main panel container
├── OverviewTab.tsx        # Tags + short description + stats
├── CommandsTab.tsx        # Syntax-highlighted commands
├── MitreTab.tsx           # MITRE techniques breakdown
└── DescriptionTab.tsx     # Sanitized HTML rendering
```

### Priority 4: Header Tag Chips
**Files:** `Header.tsx`
**Effort:** Low
**Risk:** Low

Add horizontal scrollable tag row below title.

### Priority 5: PDF Overview Page
**Files:** `PDFExporter.ts`, `OverviewPageRenderer.ts` (new)
**Effort:** Medium
**Risk:** Medium

New canvas-based page rendering for overview content.

### Priority 6: PDF Commands Page
**Files:** `PDFExporter.ts`, `CommandsPageRenderer.ts` (new)
**Effort:** Medium
**Risk:** Low

Code block rendering with line breaks and syntax highlighting (simple).

### Priority 7: Export Options
**Files:** `ExportModal.tsx`, `pdf.constants.ts`
**Effort:** Low
**Risk:** Low

Checkboxes for: Overview, Commands, MITRE summary.

---

## Part 15: Component Code Sketches

### 15.1 AttackDetailsPanel.tsx

```tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, Info, Terminal, Shield, FileText } from 'lucide-react';
import { useScenarioStore } from '../../../core/store/useScenarioStore';
import { OverviewTab } from './OverviewTab';
import { CommandsTab } from './CommandsTab';
import { MitreTab } from './MitreTab';
import { DescriptionTab } from './DescriptionTab';

type Tab = 'overview' | 'commands' | 'mitre' | 'description';

export const AttackDetailsPanel: React.FC = () => {
    const { scenario, extractedMetadata, detailsPanelOpen, toggleDetailsPanel } = useScenarioStore();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    if (!scenario) return null;

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: Info },
        { id: 'commands', label: 'Commands', icon: Terminal },
        { id: 'mitre', label: 'MITRE', icon: Shield },
        { id: 'description', label: 'Details', icon: FileText },
    ];

    // Collapsed state: Just a floating button
    if (!detailsPanelOpen) {
        return (
            <button
                onClick={toggleDetailsPanel}
                className="fixed bottom-20 right-4 z-40 p-3 bg-slate-800 hover:bg-slate-700 rounded-full shadow-lg border border-white/10 transition-colors"
                title="Attack Details"
            >
                <Info size={20} className="text-brand-blue" />
            </button>
        );
    }

    // Expanded state: Full panel
    return createPortal(
        <div className="fixed bottom-4 right-4 z-40 w-[400px] max-h-[70vh] bg-slate-900 border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-800/50">
                <h3 className="font-semibold text-white text-sm">Attack Details</h3>
                <button
                    onClick={toggleDetailsPanel}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <X size={16} className="text-slate-400" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'overview' && <OverviewTab metadata={extractedMetadata} />}
                {activeTab === 'commands' && <CommandsTab metadata={extractedMetadata} />}
                {activeTab === 'mitre' && <MitreTab metadata={extractedMetadata} steps={scenario.steps} />}
                {activeTab === 'description' && <DescriptionTab metadata={extractedMetadata} />}
            </div>
        </div>,
        document.body
    );
};
```

### 15.2 CommandsTab.tsx

```tsx
import React, { useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { highlightCommands } from '../../../shared/utils/highlightCommands';

interface CommandsTabProps {
    metadata: ExtractedMetadata | null;
}

export const CommandsTab: React.FC<CommandsTabProps> = ({ metadata }) => {
    const [copied, setCopied] = React.useState(false);
    const commands = metadata?.commandsBlock || 'No commands available';

    const highlightedHtml = useMemo(() => highlightCommands(commands), [commands]);

    const handleCopy = () => {
        navigator.clipboard.writeText(commands);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Command Reference
                </h4>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy all'}
                </button>
            </div>

            <pre
                className="bg-black/50 rounded-lg p-3 text-xs font-mono overflow-x-auto border border-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
        </div>
    );
};
```

### 15.3 OverviewTab.tsx

```tsx
import React from 'react';
import { Tag } from 'lucide-react';
import { getTagColor } from '../../../shared/config/tag-colors';

interface OverviewTabProps {
    metadata: ExtractedMetadata | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ metadata }) => {
    if (!metadata) return <p className="text-slate-500 text-sm">No metadata available</p>;

    return (
        <div className="space-y-4">
            {/* Short Description */}
            {metadata.shortDescription && (
                <div className="p-3 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
                    <p className="text-sm text-white font-medium">
                        {metadata.shortDescription}
                    </p>
                </div>
            )}

            {/* Tags */}
            {metadata.tags.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Tag size={12} />
                        Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                        {metadata.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-xs font-medium rounded-full"
                                style={{
                                    backgroundColor: `${getTagColor(tag)}20`,
                                    color: getTagColor(tag),
                                    border: `1px solid ${getTagColor(tag)}40`,
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Prerequisites */}
            {metadata.prerequisites.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Prerequisites
                    </h4>
                    <ul className="space-y-1">
                        {metadata.prerequisites.map((p, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-amber-400 mt-0.5">•</span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Attacker Gains */}
            {metadata.attackerGains.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Attacker Gains
                    </h4>
                    <ul className="space-y-1">
                        {metadata.attackerGains.map((g, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">→</span>
                                {g}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Detection Notes */}
            {metadata.detectionNotes.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Detection / OPSEC
                    </h4>
                    <ul className="space-y-1">
                        {metadata.detectionNotes.map((d, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">!</span>
                                {d}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
```

### 15.4 tag-colors.ts

```typescript
// src/shared/config/tag-colors.ts

// Use MITRE tactic colors for consistency
const TACTIC_COLORS: Record<string, string> = {
    reconnaissance: '#6366f1',
    initial_access: '#ef4444',
    execution: '#f97316',
    persistence: '#eab308',
    privilege_escalation: '#84cc16',
    defense_evasion: '#22c55e',
    credential_access: '#14b8a6',
    discovery: '#06b6d4',
    lateral_movement: '#3b82f6',
    collection: '#8b5cf6',
    exfiltration: '#d946ef',
    impact: '#f43f5e',
};

const TOOL_COLORS: Record<string, string> = {
    impacket: '#8b5cf6',
    mimikatz: '#ec4899',
    crackmapexec: '#f97316',
    bloodhound: '#ef4444',
    cobalt_strike: '#dc2626',
    metasploit: '#059669',
    nmap: '#0ea5e9',
    hashcat: '#f59e0b',
    john: '#f59e0b',
};

const PLATFORM_COLORS: Record<string, string> = {
    windows: '#0ea5e9',
    linux: '#facc15',
    ad: '#3b82f6',
    azure: '#0078d4',
    aws: '#ff9900',
};

export function getTagColor(tag: string): string {
    const normalizedTag = tag.toLowerCase().replace(/[_-]/g, '');

    // Check tactics
    for (const [tactic, color] of Object.entries(TACTIC_COLORS)) {
        if (normalizedTag.includes(tactic.replace('_', ''))) return color;
    }

    // Check tools
    for (const [tool, color] of Object.entries(TOOL_COLORS)) {
        if (normalizedTag.includes(tool)) return color;
    }

    // Check platforms
    for (const [platform, color] of Object.entries(PLATFORM_COLORS)) {
        if (normalizedTag === platform) return color;
    }

    // Default
    return '#64748b';
}
```

---

## Part 16: Acceptance Criteria

### 16.1 Schema Extension
- [ ] New fields validate correctly with Zod
- [ ] Existing JSON files parse without errors
- [ ] TypeScript types update correctly

### 16.2 Attack Details Panel
- [ ] Panel renders in collapsed state by default
- [ ] Click expands panel with tabs
- [ ] All 4 tabs show appropriate content
- [ ] Panel is draggable (optional enhancement)
- [ ] Panel persists state across step changes
- [ ] Copy button works for commands
- [ ] HTML description is sanitized (no XSS)

### 16.3 Tag Chips
- [ ] Tags render in header with correct colors
- [ ] Horizontal scroll on overflow
- [ ] Tags are clickable (future: filter feature)

### 16.4 PDF Overview Page
- [ ] Overview page renders between cover and step 1
- [ ] Prerequisites and gains render correctly
- [ ] MITRE badge shows correctly
- [ ] Text wraps appropriately

### 16.5 PDF Commands Page
- [ ] Commands page renders after last step
- [ ] Syntax highlighting works (comments, tools, flags)
- [ ] Multi-page support for long commands
- [ ] Detection notes render

### 16.6 Export Options
- [ ] Checkboxes control page inclusion
- [ ] State persists during session
- [ ] Export works with all combinations

---

## Part 17: Future Enhancements (Out of Scope)

1. **Interactive MITRE Matrix** - Click T-code to see ATT&CK page
2. **Tag Filtering** - Click tag to filter scenarios
3. **Command Execution** - Copy to clipboard with env variables
4. **Description Editing** - Edit metadata in-app
5. **PDF Themes** - Light/dark, branded templates
6. **Animated GIF Export** - Auto-play scenario as GIF

---

## Part 18: Summary Checklist

```
PHASE 1: Data Layer
├── [ ] Extend scenario.schema.ts
├── [ ] Add MetadataSchema
├── [ ] Update TypeScript types
├── [ ] Test backward compatibility
└── [ ] Update sample JSON files

PHASE 2: Store
├── [ ] Add metadata state
├── [ ] Add panel state
├── [ ] Create extraction function
└── [ ] Wire up on scenario load

PHASE 3: UI Components
├── [ ] Create AttackDetailsPanel
├── [ ] Create OverviewTab
├── [ ] Create CommandsTab
├── [ ] Create MitreTab
├── [ ] Create DescriptionTab
├── [ ] Create tag-colors.ts
├── [ ] Create highlightCommands.ts
├── [ ] Create sanitizeHtml.ts
└── [ ] Add to App layout

PHASE 4: Header Tags
├── [ ] Update Header.tsx
├── [ ] Add TagChip component
└── [ ] Style horizontal scroll

PHASE 5: PDF Export
├── [ ] Create OverviewPageRenderer.ts
├── [ ] Create CommandsPageRenderer.ts
├── [ ] Update PDFExporter.ts
├── [ ] Update pdf.constants.ts
├── [ ] Update ExportModal.tsx
└── [ ] Test all export combinations
```

---

**Document Status:** READY FOR IMPLEMENTATION

This document has been refined through 3 iterations and is now ready to guide implementation. Start with Phase 1 (Schema) and proceed sequentially.
