# Spec 07: Edge Styles & Logic

**Status:** Draft
**Priority:** P1
**Dependencies:** 03-transformer.md

---

## 1. Overview

### 1.1 Description
The Edge Styling system automatically assigns colors and line styles to diagram edges based on **keywords** detected in their labels. This allows for semantic visualization of attack flows (e.g., Red for exploits, Orange for data theft) without requiring manual class definitions in the Mermaid code.

### 1.2 Goals
- **Semantic Coloring:** Visually distinguish different types of attack actions.
- **Automation:** Apply styles automatically based on natural language keywords.
- **Fallback:** Provide a sensible default for unmatched edges.

---

## 2. Style Definitions

The styles are defined in `js/config/edges.registry.js`.

| Style Type | Color | Hex | Label | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Infection** | Red | `#ef4444` | Solid | Initial compromise, exploits, malware execution. |
| **Exfiltration** | Orange | `#f97316` | Dashed (8,4) | Data theft, stealing credentials, downloading data. |
| **Lateral** | Yellow | `#eab308` | Solid | Moving between systems (RDP, SSH, pivoting). |
| **C2** | Purple | `#a855f7` | Dashed (6,4) | Command & Control, beacons, callbacks. |
| **Escalation** | Red | `#ef4444` | Solid | Privilege escalation (root, admin, system). |
| **Discovery** | Cyan | `#06b6d4` | Dashed (2,2) | Reconnaissance, scanning, enumeration. |
| **Collection** | Amber | `#f59e0b` | Solid | Gathering data, dumping hashes. |
| **Impact** | Pink | `#db2777` | Solid | Data destruction, ransomware, wiping. |
| **Execution** | Green | `#22c55e` | Solid | Running malicious code, scripts, macros. |
| **Evasion** | Gray | `#9ca3af` | Dashed (2,2) | Avoiding detection, bypassing defenses. |
| **Collection** | Teal | `#14b8a6` | Solid | Gathering data, keylogging, screenshots. |
| **Default** | Gray | `#4b5563` | Solid | Any action not matching a keyword. |

---

## 3. Keyword Triggers

The system scans the edge label (case-insensitive) for the following keywords. The **first matching category** determines the style.

### 3.1 Infection / Exploit
- `infect`
- `infection`
- `compromise`
- `exploit`
- `initial access`
- `phishing`
- `malware`

### 3.2 Exfiltration (Data Theft)
- `exfil` (matches `exfiltration`, `exfiltrate`)
- `steal`
- `extract`
- `data theft`
- `download`
- `copy data`

### 3.3 Collection
- `collect`
- `gather`
- `harvest`
- `dump`
- `capture`

### 3.4 Lateral Movement
- `lateral`
- `pivot`
- `move`
- `psexec`
- `wmi`
- `rdp`
- `ssh`
- `spread`

### 3.5 Command & Control (C2)
- `c2`
- `beacon`
- `callback`
- `command`
- `control`
- `c&c`
- `phone home`

### 3.6 Privilege Escalation
- `escalat` (matches `escalate`, `escalation`)
- `privilege`
- `privesc`
- `root`
- `admin`
- `elevat` (matches `elevate`, `elevated`)

### 3.7 Discovery
- `discover`
- `enum` (matches `enumerate`, `enumeration`)
- `scan`
- `recon`
- `survey`
- `map`

### 3.8 Execution
- `exec` (matches `execute`, `execution`)
- `run`
- `launch`
- `powershell`
- `cmd`
- `bash`
- `script`

### 3.9 Defense Evasion
- `evade` (matches `evasion`)
- `bypass`
- `hide`
- `obfuscate`
- `masquerade`
- `disable` (e.g. disable AV)
- `clear logs`

### 3.10 Collection
- `collect`
- `keylog`
- `screenshot`
- `clipboard`
- `record`
- `archive`

---

## 4. Implementation Details

### 4.1 Keyword Detection
Logic resides in `detectEdgeStyleType(labelText)` in `js/config/edges.registry.js`. It iterates through the style config and returns the key of the first match.

### 4.2 Application
The `SvgTransformer` applies these styles during the transformation phase:
1. **Stroke Color:** Sets the `stroke` attribute of the path.
2. **Stroke Width:** Sets `stroke-width` (usually 2px or 3px).
3. **Dash Array:** Sets `stroke-dasharray` for dashed lines.
4. **Arrow Markers:** **Crucial:** It generates a unique SVG marker ID for each detected color (e.g., `#arrowhead-ef4444`) to ensure arrowheads match their line color.

### 4.3 Animation
All edges, regardless of style, support the "Draw Path" animation effect defined in `css/diagram.css`.

---

## 5. Dynamic Legend (MITRE ATT&CK)

### 5.1 Purpose
The application renders a dynamic legend at the bottom of the diagram (`#status-bar`) that:
1.  **Reflects Actual Content:** Only displays categories that are actually present in the rendered diagram.
2.  **Uses Registry Source:** Pulls colors, labels, and sorting order directly from `edges.registry.js`.
3.  **Visual Caption:** Includes a "MITRE ATT&CK Mapping" caption.

### 5.2 Mechanics
*   **Class:** `js/ui/StatusLegend.js`
*   **Trigger:** Instantiated and updated in `App.js` after diagram parsing (`#renderDiagram`).
*   **Input:** Receives the `ParsedDiagram` object.
*   **Logic:**
    1.  Extracts all unique `edgeStyleType` values from `parsedDiagram.edges`.
    2.  Sorts them according to the definition order in `edges.registry.js` (Kill Chain order).
    3.  Renders `div.status-dot` elements with inline `background-color` and `box-shadow` derived from the registry.
*   **Labels:** Uses the `label` property added to `EDGE_STYLES` (e.g., `label: 'Initial Access'`) for user-friendly display.
