# Spec 1: Data Modeling Strategy

**Status:** Draft
**Related:** `docs/0_high_level_design.md`
**Legacy Source:** `Old_Code/docs/specs/10-internal-attack-modeling.md`

## 1. Overview
This specification defines the core data structures for `CyberViewer-Cyto`. It unifies the legacy "Internal Attack Modeling" requirements with our new "Type Safe" architecture.

**Goal:** Create a strict, validated Zod schema that captures all semantic meaning of a cyber attack (Entities, Relationships, State) while remaining flexible enough for future rendering needs.

## 2. Core Entities (The "What")

We move away from generic "Nodes" to typed **Entities**. Each entity type roughly corresponds to a visual representation icon and specific behavior.

### 2.1 Entity Taxonomy
| Logical Type | Description | Legacy Eqv. | New Zod Type |
|--------------|-------------|-------------|--------------|
| **Device** | A physical or virtual machine (Host, Server, Phone) | `network_node` / `Machine` | `device` |
| **Actor** | The attacker or human user principal | `attacker_`, `Actor` | `actor` |
| **Process** | Running executable code | `process` | `process` |
| **Service** | Long-running system service | `service` | `service` |
| **Data** | Files, databases, memory regions | `memory`, `file`, `Data` | `data` |
| **Credential** | Keys, tickets, hashes, passwords | `credential` | `credential` |
| **Container** | Logical grouping (Subnet, Cloud Region, Group) | `container` / `subgraph` | `container` |

### 2.2 Entity States
Entities can have dynamic states that overlay visual indicators (borders, badges).
-   `normal`: Default state.
-   `compromised`: Attacker has full control (Red border/glow).
-   `elevated`: Process running as Admin/Root (Orange badge).
-   `protected`: Entity is fortified/hardened (Blue/Shielded).
-   `encrypted`: Data is locked (Lock icon).

## 3. Relationships (The "How")

Edges represent the *action* or *flow* between entities.

### 3.1 Edge Types
| Type | Description | Visual Style |
|------|-------------|--------------|
| **Normal** | Standard flow or logical connection | Solid Gray |
| **Illegal** | Security violation (Exploit, Entry) | Dashed Red + Animation |
| **Impact** | Critical consequence (Theft, Destruction) | Thick Amber |

### 3.2 Metadata
-   **MITRE T-Code**: `T1003.001` (Crucial for Matrix integration).
-   **Description**: Human readable label ("DCSync").
-   **Protocol**: Optional technical detail (SMB, HTTP).

## 4. Trust Boundaries (The "Where")

Containers are not just visual boxes; they represent **Trust Boundaries**.
-   `boundary: "network"`: Network segment (DMZ, LAN).
-   `boundary: "machine"`: Physical/Virtual host boundary.
-   `boundary: "kernel"`: Ring 0 / Hazardous protection capability.
-   `boundary: "user"`: User-space isolation.

## 5. Formal Schema (TypeScript/Zod Draft)

```typescript
import { z } from 'zod';

// --- Enums ---
export const EntityTypeSchema = z.enum([
  'device', 'actor', 'process', 'service', 'data', 'credential', 'container'
]);

export const EntityStateSchema = z.enum([
  'normal', 'compromised', 'elevated', 'protected', 'encrypted'
]);

export const EdgeTypeSchema = z.enum([
  'normal', 'illegal', 'impact'
]);

export const BoundaryTypeSchema = z.enum([
  'null', 'network', 'machine', 'kernel', 'user'
]);

// --- Nodes ---
export const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: EntityTypeSchema.default('device'),
  
  // Hierarchy
  parent: z.string().optional(), // ID of container
  
  // Visuals
  icon: z.string().optional(), // Override icon name (e.g. "kali", "win10")
  state: EntityStateSchema.default('normal'),
  
  // Data
  metadata: z.record(z.string()).optional()
});

// --- Edges ---
export const EdgeSchema = z.object({
  id: z.string().optional(), // Auto-generated if missing
  source: z.string(),
  target: z.string(),
  
  label: z.string(), // "DCSync"
  
  // Semantics
  type: EdgeTypeSchema.default('normal'),
  mitre: z.string().regex(/^T\d{4}(\.\d{3})?$/).optional(), // T-Code validation
  
  // Visuals
  description: z.string().optional(), // Longer tooltip text
  protocol: z.string().optional()
});

// --- Graph ---
export const AttackGraphSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  version: z.literal('2.0').default('2.0')
});

export type AttackGraph = z.infer<typeof AttackGraphSchema>;
```

## 6. Migration Mapping (Legacy -> New)

| Legacy Feature | New Model Strategy |
|----------------|--------------------|
| `subgraph` | Node of type `container` |
| `boundary-machine` (CSS) | Node `type: container`, `metadata.boundary: machine` |
| `procs_` prefix | Node `type: process` |
| `cred_` prefix | Node `type: credential` |
| Mermaid `-.->` | Edge `type: illegal` |
| Mermaid `==>` | Edge `type: impact` |

## 7. Validation Rules (Runtime)
1.  **Dangling Edges**: All `source`/`target` IDs must exist in `nodes`.
2.  **Parent Cycles**: Container hierarchy cannot form a loop.
3.  **Cross-Boundary Violations**: (Optional strict mode) Illegal edges should ideally cross a Trust Boundary.
