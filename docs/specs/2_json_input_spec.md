# Spec 2: JSON Input Specification

**Status:** Draft
**Related:** `docs/specs/1_data_modeling_spec.md`

## 1. Overview
This specification details the **exact JSON structure** required by `CyberViewer-Cyto`. It serves as the contract between data providers (LLMs, Scrapers, Manual Authors) and the Application.

**Key Requirement:** The JSON must be strictly validated against the Zod schema defined in Spec 1 and support all advanced visualization features (Animation, MITRE, Containers).

## 2. Root Structure
The root object represents a single "Attack Scenario".

```json
{
  "title": "Golden Ticket Attack",
  "description": "Full domain compromise via Kerberos manipulation.",
  "version": "2.0",
  "metadata": {
    "author": "Red Team",
    "created_at": "2023-10-27T10:00:00Z",
    "mitre_technique_count": 4
  },
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

## 3. Nodes (Entities & Containers)
Nodes are flatly listed. Hierarchy is defined via the `parent` reference.

### 3.1 Standard Node
```json
{
  "id": "kali_vm",
  "label": "Kali Linux",
  "type": "device",
  "icon": "kali",
  "parent": "attacker_infra",
  "state": "normal"
}
```

### 3.2 Container Node
Containers are nodes that visually group other nodes.
```json
{
  "id": "attacker_infra",
  "label": "Attacker Infrastructure",
  "type": "container",
  "metadata": {
    "boundary": "network" // See Spec 1: Trust Boundaries
  }
}
```

### 3.3 Detailed Entity (Process/Credential)
```json
{
  "id": "proc_lsass",
  "label": "lsass.exe",
  "type": "process",
  "parent": "dc_01",
  "state": "protected",
  "metadata": {
    "pid": "504",
    "user": "SYSTEM"
  }
}
```

## 4. Edges (The Narrative)
Edges define the attack flow. **Crucially**, the order of edges in the array defines the **Animation Sequence** (unless an explicit `step` field is added, but array order is the default convention from legacy code).

```json
{
  "source": "kali_vm",
  "target": "dc_01",
  "label": "DCSync",
  "type": "illegal",
  "mitre": "T1003.001",
  "step": 1, 
  "description": "Replicating directory changes to get password hashes.",
  "metadata": {
    "protocol": "DRSUAPI"
  }
}
```

### 4.1 Animation Order & Steps
Legacy code inferred order from array index (`e0`, `e1`...).
**New Standard:**
1.  **Explicit `step` (Recommended)**: Integer `1..N`. Multiple edges can have the *same* step (parallel actions).
2.  **Implicit Order (Fallback)**: If `step` is missing, array index is used.

**Example: Parallel Action**
```json
[
  { "id": "e1", "data": "Step 1" },
  { "id": "e2", "step": 2, "label": "Action A" },
  { "id": "e3", "step": 2, "label": "Action B (Same Time)" }
]
```

## 5. MITRE Integration
Edges can include `mitre` fields referencing T-Codes.
-   **Validation**: Must match standard MITRE format `^T\d{4}(\.\d{3})?$`.
-   **UI Usage**: The UI will look up this code in the `mitre-db.ts` to display Tactic info (e.g., "Credential Access").

## 6. Complete Example (Golden Ticket)
```json
{
  "title": "Golden Ticket Attack",
  "version": "2.0",
  "nodes": [
    { "id": "zone_attacker", "label": "External", "type": "container", "metadata": { "boundary": "network" } },
    { "id": "zone_corp", "label": "Corp Network", "type": "container", "metadata": { "boundary": "network" } },
    
    { "id": "kali", "label": "Attacker", "type": "actor", "parent": "zone_attacker" },
    { "id": "dc01", "label": "DC01", "type": "device", "parent": "zone_corp", "icon": "server" },
    { "id": "krbtgt", "label": "krbtgt hash", "type": "credential", "parent": "dc01" }
  ],
  "edges": [
    {
      "step": 1,
      "source": "kali", 
      "target": "dc01",
      "label": "Compromise",
      "mitre": "T1190"
    },
    {
      "step": 2,
      "source": "kali",
      "target": "krbtgt",
      "label": "DCSync",
      "type": "illegal",
      "mitre": "T1003.006"
    },
    {
      "step": 3,
      "source": "krbtgt",
      "target": "kali",
      "label": "Forge Ticket",
      "type": "impact",
      "mitre": "T1558.001"
    }
  ]
}
```

## 7. Migration Logic (Legacy -> New JSON)
When parsing legacy `ParsingDiagram` objects (from Mermaid):
1.  `subgraphs` -> `nodes` (type: container).
2.  `nodes` -> `nodes` (type inferred from prefix/icon).
3.  `edges` -> `edges` (mapped 1:1, order preserved).
