# 09. Advanced MITRE ATT&CK Integration

## 1. Overview
This specification details the implementation of advanced Cyber Threat Intelligence (CTI) features, transforming the visualizer from a passive viewer into an interactive analysis tool.

**Key Features:**
1.  **Tactic Fidelity**: Integration of specific MITRE Technique IDs (T-Codes).
2.  **Interactive Filtering**: Legend-based focus mode.
3.  **Blast Radius**: Downstream impact visualization.
4.  **Enriched Context**: Smart tooltips with definitions and deep links.

---

## 2. Registry Schema Expansion (V2)

The `EDGE_STYLES` registry in `js/config/edges.registry.js` will be expanded to support semantic metadata.

### 2.1 Schema Definition
```javascript
{
  [styleKey]: {
    // ... existing visual props
    mitreId: 'TA00xx',       // Tactic ID (e.g., TA0006)
    url: 'string',           // Link to attack.mitre.org
    severity: 'low' | 'medium' | 'high' | 'critical',
    tCodeMap: {              // Heuristics for specific T-Codes
      'mimikatz': 'T1003',
      'kerberoast': 'T1558.003'
    }
  }
}
```

### 2.2 Implementation Plan
- update `js/config/edges.registry.js` to include `mitreId` and `url` for all 12 supported tactics.
- define `tCodeMap` within relevant tactics (e.g., `execution`, `credential_access`).

---

## 3. T-Code Auto-Enrichment

Automatically detect specific tools/techniques within edge labels and append visual badges.

### 3.1 Detection Logic (`SvgTransformer.js`)
During the label transformation phase (`#transformLabels`), the system will:
1.  Identify the base Tactic (e.g., Credential Access).
2.  Scan the label text against the `tCodeMap` of that tactic.
3.  If a match is found (e.g., "Mimikatz" -> "T1003"), append a badge.

### 3.2 Visual Rendering
The badge will be an SVG `<g>` element appended to the label group:
```html
<g class="mitre-badge" transform="...">
  <rect fill="#333" rx="4" ... />
  <text fill="#fff" font-size="10">T1003</text>
</g>
```

---

## 4. MITRE Matrix Legend (Architecture V2)

The Legend determines the "Dashboard" of the application. It will render the **Full MITRE Kill Chain** at all times, acting as both a status indicator and a reference explorer.

### 4.1 "Always-On" Rendering Strategy
The `StatusLegend` will iterate through **All 12 Tactics** defined in the registry, regardless of their presence in the current diagram.

**Visual States:**
1.  **Active (In Diagram):** Full Opacity, Colored Dot, specific "Active" border/glow.
2.  **Inactive (Not in Diagram):** Dimmed (Opacity 0.3), Desaturated, but visible.
3.  **Highlighted (Animation):** When animation steps through this phase, it pulses.

### 4.2 Interactive Expansion (Subcategories)
Clicking a Tactic Card toggles an **Accordion View** to reveal its known Techniques (from `tCodeMap`).

**Expanded UI Structure:**
```html
<div class="status-item [active|inactive] [expanded]">
    <!-- Header (Always Visible) -->
    <div class="status-header" onclick="toggleExpand()">
        <div class="status-dot"></div>
        <div class="status-info">
            <span class="status-label">Credential Access</span>
            <span class="status-badge">TA0006</span>
        </div>
        <div class="status-chevron">▼</div> <!-- Rotates on expand -->
    </div>

    <!-- Techniques Grid (Visible on Expand) -->
    <div class="status-techniques">
        <!-- Rendered from tCodeMap -->
        <div class="technique-tag">
            <span class="t-code">T1003</span>
            <span class="t-name">OS Credential Dumping</span>
        </div>
        ...
    </div>
    
    <!-- Footer Action -->
    <a href="..." class="mitre-deep-link">View Full Tactic ↗</a>
</div>
```

### 4.3 Data Logic
- **Input:** `parsedDiagram` provided to `update()`.
- **Processing:**
    1.  Get all 12 types from Registry.
    2.  Check if `type` exists in `parsedDiagram.edges`.
    3.  Set `isActive` boolean.
    4.  Render full list.
- **Subcategories:** derived purely from `edgeStyle.tCodeMap` (static knowledge base).

### 4.3 CSS Filtering (`diagram.css`)
Using CSS variables and class cascading for high-performance filtering:

```css
/* When filtering is active, dim everything by default */
.diagram-output.is-filtered .beautified-edge,
.diagram-output.is-filtered .node {
   opacity: 0.1;
   filter: grayscale(1);
}

/* Undim the specific type selected */
.diagram-output.is-filtered .beautified-edge[data-type="credential_access"] {
   opacity: 1;
   filter: none;
}
```

---

## 5. Blast Radius Visualization

Visualize the potential downstream impact of a compromised node.

### 5.1 Graph Traversal Algorithm (`InteractionManager.js`)
- **Data Structure**: Build a lightweight adjacency list from `parsedDiagram.edges`.
- **Event**: `mouseenter` on a Node.
- **Algorithm** (BFS/DFS):
    1.  Start at hovered node.
    2.  traverse all outgoing edges.
    3.  Collect all downstream node IDs.
    4.  Apply `.impact-victim` class to these nodes and connecting edges.

### 5.2 Visual Feedback
- **Source Node**: Pulses Red (`.impact-source`).
- **Downstream Path**: Edges turn solid/bright (`.impact-path`).
- **Victim Nodes**: Flash warning color.

---

## 6. Smart Tooltips

Provide deep context without cluttering the diagram.

### 6.1 Tooltip Content
```html
<div class="smart-tooltip">
  <div class="header" style="border-color: {tacticColor}">
    <span class="tactic-name">{tacticName}</span>
    <span class="mitre-id">{mitreId}</span>
  </div>
  <div class="body">
    {description}
    <div class="t-code-match">
      Detected: <strong>Mimikatz</strong> (T1003)
    </div>
  </div>
  <div class="footer">
    <a href="{url}" target="_blank">View on MITRE ATT&CK ↗</a>
  </div>
</div>
```

### 6.2 Positioning
- Use `tippy.js` or a custom floating div positioned relative to the mouse cursor.
---

## 7. Exhaustive MITRE Database Integration (Phase 4)

To support the entire Enterprise ATT&CK matrix (690+ techniques) without manual maintenance, the system uses an automated ingestion pipeline.

### 7.1 Architecture
- **Source**: Official MITRE CTI GitHub (`enterprise-attack.json`).
- **Build Script**: `scripts/generate_mitre_db.js`.
- **Artifacts**:
    1.  `js/config/mitre-index.js`: Lightweight JSON index for the web app (Code -> Metadata).
    2.  `docs/mitre-reference.md`: Reference table for LLM context injection.

### 7.2 Update Workflow
If MITRE releases a new version of ATT&CK:
1.  Run the generation script:
    ```bash
    node scripts/generate_mitre_db.js
    ```
2.  This fetches the latest STIX JSON, parses active techniques, and rebuilds the index.
3.  Commit the updated `mitre-index.js` and `mitre-reference.md`.

### 7.3 Integration Logic
- **`edges.registry.js`**: Imports `mitre-index.js`.
- **`detectEdgeInfo`**: 
    1.  Checks if the label contains a specific T-Code (e.g., `T1595`).
    2.  Lookups the T-Code in the exhaustive `MITRE_INDEX`.
    3.  Maps the technique's tactic (e.g., `reconnaissance`) to our internal style key via `TACTIC_MAP`.
    4.  Returns enriched metadata `{ type, tCode, label }`.
- **`StatusLegend.js`**: Dynamically renders any technique found in the index, even if not hardcoded in the local registry map.

---

## 8. Recursive Data & UI Hierarchy (Phase 7)

To accurately reflect the specific parent-child relationships defined by MITRE (e.g., `T1059` -> `T1059.001`), the system implements a recursive architecture.

### 8.1 3-Pass Data Ingestion
The `generate_mitre_db.js` script now performs three passes during build time:
1.  **Catalog**: Identification of all Attack Patterns.
2.  **Link**: Mapping of `subtechnique-of` STIX relationships.
3.  **Nest**: Embedding Sub-techniques into their Parent's `subTechniques` array while maintaining O(1) T-Code lookup.

### 8.2 Recursive Matrix Explorer
The UI (`StatusLegend.js`) renders a nested taxonomy:
- **Tactic Container**: Collapsible Accordion (e.g., *Reconnaissance*).
- **Technique Row**: Parent item (e.g., *Active Scanning*).
    - **Sub-technique Block**: Indented child items (e.g., *Scanning IP Blocks*).

**Filtering Logic:**
- If a Child is active, its Parent is automatically shown.
- If "Active Only" filter is on, Parents with no active children are hidden unless the Parent itself is active.

---

## 9. Strict LLM Compliance (Phase 8)

To ensure the LLM utilizes this high-fidelity data, strict prompting rules are enforced.

### 9.1 Single Source of Truth
The `llm-prompt.md` explicitly forbids the LLM from hallucinating T-Codes and mandates the use of `mitre-reference.md`.

### 9.2 Validation Protocol
The LLM is instructed to perform a self-correction check:
- [ ] Verify T-Code against Reference.
- [ ] Prefer Sub-technique (Precision) over Parent.
- [ ] Verify Tactic mapping.

