# Spec 10: Internal Attack Modeling

**Status:** Draft
**Priority:** P1 (Feature Enhancement)
**Dependencies:** 02-parser.md, 03-transformer.md, 07-edge-styles.md

---

## 1. Overview

### 1.1 Problem Statement

Current CyberViewer diagrams model attacks from a **network perspective** - showing traffic between hosts. This fails to represent:

- What happens **inside** a compromised system
- **Trust boundaries** being violated (kernel/userspace, process isolation, protected memory)
- **Entity types** beyond machines (processes, memory regions, credentials)
- **Exploit semantics** - which edge represents the actual security violation

### 1.2 Solution

Extend the Mermaid syntax conventions and rendering system to support:

1. **New entity types** with distinct visual representations
2. **Trust boundary subgraphs** with security-relevant styling
3. **Semantic edge types** distinguishing normal, illegal, and high-impact actions
4. **State annotations** for entities (compromised, elevated, encrypted)

### 1.3 Goals

- Model attacks at any abstraction level (network, host, process, memory)
- Make security violations visually obvious
- Maintain compatibility with existing diagram rendering
- Provide clear LLM prompt conventions for consistent generation

### 1.4 Non-Goals

- Side-channel attack modeling (indirect information flow)
- Formal verification of attack paths
- Real-time attack simulation

---

## 2. Data Model

### 2.1 Entity Taxonomy

| Entity Type | Description | Mermaid Shape | Node Prefix | Icon |
|-------------|-------------|---------------|-------------|------|
| **Actor** | Intent-bearing principal | Rounded `([...])` | `attacker_`, `user_` | hacker, user |
| **Machine** | Physical/virtual host | Subgraph | (existing prefixes) | (existing) |
| **Process** | Executing program | Rectangle `[...]` | `proc_` | process |
| **Service** | System service/daemon | Rectangle `[...]` | `svc_` | service |
| **Memory** | Memory region/buffer | Cylinder `[(...)]` | `mem_` | memory |
| **Credential** | Auth material | Double-brace `{{...}}` | `cred_` | key |
| **Data** | Files/databases | Cylinder `[(...)]` | `data_` | (existing db) |

### 2.2 Trust Boundary Types

| Boundary Type | Subgraph Label Contains | CSS Class | Visual Style |
|---------------|------------------------|-----------|--------------|
| **Machine** | "Machine", "Host", "Server" | `boundary-machine` | Solid border |
| **OS/Kernel** | "Kernel", "Ring0", "OS" | `boundary-kernel` | Thick dashed |
| **Protected** | "Protected", "Secure", "LSA" | `boundary-protected` | Red dashed |
| **Container** | "Container", "Pod", "Sandbox" | `boundary-container` | Blue dashed |
| **Network** | "Network", "Segment", "DMZ" | `boundary-network` | Gray dashed |

### 2.3 Edge Semantics

| Edge Type | Mermaid Syntax | Meaning | Visual Style |
|-----------|---------------|---------|--------------|
| **Normal** | `-->` | Legitimate action | Default color, solid |
| **Illegal** | `-.->` | Security violation | Red, dashed, glow |
| **High-Impact** | `==>` | Critical action (cred theft, lateral) | Thick, orange/gold |

### 2.4 State Annotations

Entities can have state indicated via:

1. **Label suffix**: `proc_mimi[Process: mimikatz.exe ::elevated]`
2. **CSS class in diagram**: `:::compromised` or `:::elevated`

| State | Meaning | Visual Indicator |
|-------|---------|------------------|
| `::compromised` | Entity is attacker-controlled | Red border/glow |
| `::elevated` | Running with elevated privileges | Orange badge |
| `::encrypted` | Data has been encrypted | Lock icon overlay |

---

## 3. Syntax Specification

### 3.1 Node Definition Syntax

```mermaid
%% Actor (rounded)
attacker_([Attacker])
user_bob([User: Bob])

%% Process (rectangle)
proc_mimikatz[Process: mimikatz.exe]
proc_lsass[Process: lsass.exe]

%% Service
svc_smb[Service: SMB]

%% Memory (cylinder)
mem_lsass[(LSASS Memory)]
mem_stack[(Stack Buffer)]

%% Credential (double-brace)
cred_hash{{NTLM Hash}}
cred_ticket{{Kerberos TGT}}

%% With state annotation
proc_shell[Process: cmd.exe]:::elevated
```

### 3.2 Trust Boundary Syntax

```mermaid
subgraph victim_win["Windows Host"]
    subgraph os["Windows OS"]
        proc_app[Process: app.exe]

        subgraph protected["Protected: Security Authority"]
            proc_lsass[Process: lsass.exe]
            mem_creds[(Credential Cache)]
        end
    end
end
```

### 3.3 Edge Syntax

```mermaid
%% Normal action
attacker_ -->|1. [T1021] Remote Access| proc_shell

%% Illegal action (security violation)
proc_mimikatz -.->|2. [T1003.001] Dump Credentials| mem_creds

%% High-impact action
cred_hash ==>|3. [T1550.002] Pass the Hash| target_host
```

### 3.4 Complete Example

```mermaid
flowchart LR
    subgraph attacker_host["Kali Machine"]
        attacker_([Attacker])
    end

    subgraph victim_win["Windows Target"]
        subgraph os["Windows OS"]
            proc_mimi[Process: mimikatz.exe]:::elevated

            subgraph protected["Protected: Security Authority"]
                proc_lsass[Process: lsass.exe]
                mem_creds[(Credential Cache)]
            end
        end
    end

    cred_tickets{{Kerberos Tickets}}

    attacker_ -->|1. [T1021] Remote Access| proc_mimi
    proc_mimi -.->|2. [T1003.001] Dump Credentials| mem_creds
    mem_creds -->|3. Extract| cred_tickets
    cred_tickets ==>|4. [T1550] Pass the Ticket| attacker_
```

---

## 4. Parsing Requirements

### 4.1 Extended ParsedNode

```typescript
interface ParsedNode {
  // ... existing fields ...

  // NEW: Entity classification
  entityType: 'actor' | 'machine' | 'process' | 'service' | 'memory' | 'credential' | 'data' | 'default';

  // NEW: State annotations
  state?: 'compromised' | 'elevated' | 'encrypted' | null;
}
```

### 4.2 Extended ParsedEdge

```typescript
interface ParsedEdge {
  // ... existing fields ...

  // NEW: Semantic edge type
  edgeSemantic: 'normal' | 'illegal' | 'impact';
}
```

### 4.3 Extended ParsedSubgraph

```typescript
interface ParsedSubgraph {
  // ... existing fields ...

  // NEW: Boundary classification
  boundaryType: 'machine' | 'kernel' | 'protected' | 'container' | 'network' | 'default';
}
```

---

## 5. Rendering Requirements

### 5.1 Node Rendering

| Entity Type | Icon Source | Shape Preservation |
|-------------|-------------|-------------------|
| `proc_` | `process.svg` (new) | Rectangle visible |
| `svc_` | `service.svg` (new) | Rectangle visible |
| `mem_` | `memory.svg` (new) | Cylinder visible |
| `cred_` | `key.svg` (existing creds) | Hexagon/double-brace |

### 5.2 Edge Rendering

| Edge Semantic | Stroke Color | Stroke Width | Dash Array | Glow |
|--------------|--------------|--------------|------------|------|
| `normal` | (from MITRE tactic) | 2px | none | no |
| `illegal` | `#ef4444` (red) | 3px | `8,4` | yes |
| `impact` | `#f59e0b` (amber) | 4px | none | subtle |

### 5.3 Subgraph Rendering

| Boundary Type | Border Color | Border Style | Fill |
|--------------|--------------|--------------|------|
| `machine` | `#64748b` | solid 2px | `rgba(100,116,139,0.05)` |
| `kernel` | `#8b5cf6` | dashed 3px | `rgba(139,92,246,0.05)` |
| `protected` | `#ef4444` | dashed 2px | `rgba(239,68,68,0.03)` |
| `container` | `#3b82f6` | dashed 2px | `rgba(59,130,246,0.05)` |
| `network` | `#64748b` | dotted 1px | transparent |

---

## 6. Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ Network View (existing capability)                          │
│   Hosts as nodes, network traffic as edges                  │
│   Icons: windows, linux, kali, server, etc.                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (zoom in / detail view)
┌─────────────────────────────────────────────────────────────┐
│ Host View (NEW)                                             │
│   Processes, services as nodes                              │
│   Memory regions, credentials as entities                   │
│   Trust boundaries as subgraphs                             │
│   Illegal edges cross boundaries visually                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Attack Pattern Templates

### 7.1 Credential Dumping Pattern

```mermaid
subgraph target["Target Host"]
    subgraph lsass_boundary["Protected: LSASS"]
        proc_lsass[Process: lsass.exe]
        mem_lsass[(LSASS Memory)]
    end
    proc_attacker[Process: attacker_tool]:::elevated
end

cred_hashes{{NTLM Hashes}}

proc_attacker -.->|[T1003.001] Read Memory| mem_lsass
mem_lsass -->|Extract| cred_hashes
```

### 7.2 Process Injection Pattern

```mermaid
subgraph target["Target Host"]
    proc_malware[Process: malware.exe]
    proc_explorer[Process: explorer.exe]
    mem_explorer[(Explorer Memory)]
end

proc_malware -.->|[T1055] Inject Code| mem_explorer
mem_explorer -->|Execute in| proc_explorer
```

### 7.3 Container Escape Pattern

```mermaid
subgraph host["Host Machine"]
    subgraph container["Container Boundary"]
        proc_app[Process: webapp]
        proc_exploit[Process: exploit]
    end

    proc_dockerd[Process: dockerd]
    mem_host[(Host Filesystem)]
end

proc_exploit -.->|[T1611] Escape| proc_dockerd
proc_dockerd -.->|Access| mem_host
```

---

## 8. Validation Rules

A well-formed internal attack diagram must satisfy:

1. **Every illegal edge (`-.->`) should cross a subgraph boundary**
   - If an edge is marked illegal but doesn't cross a boundary, warn

2. **Credential entities must have an origin**
   - Every `cred_*` node should have an incoming edge explaining where it came from

3. **Processes inside protected boundaries should be system processes**
   - `lsass.exe`, `csrss.exe`, `smss.exe`, etc.

4. **State annotations must be justified**
   - `:::elevated` requires a prior privilege escalation edge
   - `:::compromised` requires a prior compromise edge

---

## 9. Compatibility

### 9.1 Backward Compatibility

- Existing diagrams (network-level) continue to work unchanged
- New prefixes (`proc_`, `mem_`, `cred_`) are additive
- Existing edge syntax (`-->`) remains default "normal"

### 9.2 Mixed Diagrams

Diagrams can combine network and internal views:

```mermaid
flowchart LR
    kali_attacker["Attacker<br>Kali"]

    subgraph victim["Victim Host"]
        proc_shell[Process: reverse_shell]

        subgraph protected["Protected: LSASS"]
            mem_creds[(Credentials)]
        end
    end

    kali_attacker -->|1. [T1059] Execute Shell| proc_shell
    proc_shell -.->|2. [T1003] Dump| mem_creds
    mem_creds ==>|3. [T1041] Exfiltrate| kali_attacker
```

---

## 10. Success Criteria

A diagram using this spec should allow a viewer to immediately answer:

1. **Where is the trust boundary?** → Subgraph with security-relevant label
2. **Which edge violates it?** → Dashed red edge crossing the boundary
3. **What entity is compromised?** → Node with compromised state or target of illegal edge
4. **What is the security impact?** → Thick amber edge showing credential theft/lateral movement

---

## 11. Testing Checklist

- [ ] Parser detects `proc_`, `mem_`, `cred_` prefixes
- [ ] Parser detects `-.->` as illegal edge
- [ ] Parser detects `==>` as high-impact edge
- [ ] Parser extracts boundary type from subgraph labels
- [ ] Transformer applies correct icon for each entity type
- [ ] Transformer styles illegal edges (red, dashed, glow)
- [ ] Transformer styles impact edges (amber, thick)
- [ ] Transformer styles subgraphs by boundary type
- [ ] Animation system works with new edge types
- [ ] State annotations render correctly (`::: classes`)
- [ ] Mixed network/internal diagrams render correctly
