# Attack Graph JSON Schema Specification

## Overview
This document defines the structure of the JSON-based Attack Graph format. This format replaces the text-based Mermaid syntax to provide a strict, machine-readable, and LLM-friendly way to represent cybersecurity attack flows.

## Core Concepts
The graph consists of a flat list of **Nodes** (entities) and **Edges** (actions/relationships). Hierarchical relationships (nesting) are defined via the `parent` property on nodes, linking them to **Containers** (subgraphs).

## Schema Structure

### 1. Root Object
The root of the JSON file represents a single Attack Scenario.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | The name of the attack scenario (e.g., "Golden Ticket Attack"). |
| `description` | string | No | A short summary of the attack. |
| `metadata` | object | No | Additional metadata (author, date, tags). |
| `nodes` | array | Yes | List of all entities (Nodes and Containers). |
| `edges` | array | Yes | List of all relationships between nodes. |

### 2. Nodes & Containers
All entities are strictly typed. We use a single `nodes` array for both atomic nodes (like Processes) and container nodes (like Hosts).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (e.g., `attacker`, `proc_mimikatz`). |
| `label` | string | Yes | Display name (e.g., "Kali Linux", "lsass.exe"). |
| `type` | string | Yes | The entity type. See **Entity Types** below. |
| `parent` | string | No | The `id` of the parent container node. |
| `icon` | string | No | Explicit icon name (e.g., `linux`, `server`). Overrides detection. |
| `properties` | object | No | Arbitrary key-value pairs (e.g., `ip`, `pid`). |
| `state` | string | No | Visual state: `compromised`, `elevated`, `protected`. |

#### Entity Types (`type`)
| Type | Description | Visual Metaphor |
|------|-------------|-----------------|
| `container` | A boundary grouping other nodes. | Dashed Rectangle / Box |
| `process` | A running program. | Square / Rounded Box |
| `file` | A data file or document. | Cylinder (Data Store) |
| `service` | A system service. | Gear / Cog |
| `network_node` | A host or device (when not a container). | Circle / Icon |
| `credential` | A password, hash, or ticket. | Ticket / Key |

### 3. Edges
Edges represent the flow of the attack.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | Yes | `id` of the source node. |
| `target` | string | Yes | `id` of the target node. |
| `label` | string | Yes | Text description of the action (e.g., "DCSync"). |
| `mitre` | string | No | MITRE ATT&CK T-Code (e.g., "T1003.001"). |
| `type` | string | No | Semantic type. Default: `normal`. |

#### Edge Types (`type`)
| Type | Meaning | Visual Style |
|------|---------|--------------|
| `normal` | Legitimate standard operation. | Gray solid line. |
| `illegal` | Exploit / Boundary violation. | Red dashed line. |
| `impact` | High-value outcome / movement. | Amber thick line. |

## Example JSON

```json
{
  "title": "Local Privilege Escalation",
  "nodes": [
    { 
        "id": "host_win", 
        "label": "Victim Workstation", 
        "type": "container" 
    },
    { 
        "id": "proc_vulnerable", 
        "label": "BadApp.exe", 
        "type": "process", 
        "parent": "host_win" 
    },
    { 
        "id": "proc_cmd", 
        "label": "cmd.exe", 
        "type": "process", 
        "parent": "host_win", 
        "state": "elevated" 
    }
  ],
  "edges": [
    { 
        "source": "proc_vulnerable", 
        "target": "proc_cmd", 
        "label": "Buffer Overflow", 
        "mitre": "T1068", 
        "type": "illegal" 
    }
  ]
}
```
