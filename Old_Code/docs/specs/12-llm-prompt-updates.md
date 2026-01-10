# Spec 12: LLM Prompt Updates

**Status:** Draft
**Priority:** P1
**Dependencies:** 10-internal-attack-modeling.md

---

## 1. Overview

This document provides the **exact additions** to `docs/llm-prompt.md` to enable LLM-generated internal attack diagrams.

---

## 2. New Section: Internal Attack Modeling

**Add after Section "### 2. NODE DEFINITIONS" and before "### 3. ATTACK FLOW & CLASSIFICATION":**

```markdown
### 2.5 INTERNAL ENTITY NODES (For Detailed Attack Modeling)

When modeling **what happens inside a system** (not just network traffic), use these additional entity types:

| Prefix | Entity Type | Mermaid Shape | Use Case |
|--------|-------------|---------------|----------|
| `proc_` | Process | `[Process: name.exe]` | Executing programs |
| `svc_` | Service | `[Service: name]` | System services/daemons |
| `mem_` | Memory | `[(Memory Region)]` | Memory buffers, heaps, protected memory |
| `cred_` | Credential | `{{Credential Name}}` | Hashes, tickets, tokens, keys |
| `data_` | Data | `[(Data Store)]` | Files, databases, configs |

**Shape Syntax Reference:**
- Rectangle (process): `proc_lsass[Process: lsass.exe]`
- Cylinder (memory/data): `mem_creds[(LSASS Memory)]`
- Double-brace (credential): `cred_hash{{NTLM Hash}}`
- Rounded (actor): `attacker_([Attacker])`

**State Annotations:**
Add `:::state` suffix to indicate entity state:
- `:::elevated` - Running with admin/SYSTEM privileges
- `:::compromised` - Under attacker control

Example: `proc_shell[Process: cmd.exe]:::elevated`

### 2.6 TRUST BOUNDARIES (Subgraphs)

Use `subgraph` to represent **containment and trust boundaries**. The label determines the boundary type:

| Label Contains | Boundary Type | Visual Style |
|----------------|---------------|--------------|
| "Machine", "Host" | Machine boundary | Solid gray |
| "Kernel", "OS", "Ring0" | Kernel boundary | Dashed purple |
| "Protected", "Secure", "LSASS", "LSA" | Protected boundary | Dashed red |
| "Container", "Pod", "Sandbox" | Container boundary | Dashed blue |
| "Network", "DMZ", "Segment" | Network boundary | Dotted gray |

**Nesting Rules:**
- Machines contain OS/Kernel
- OS contains Containers/Processes
- Processes contain Memory

**Example:**
```mermaid
subgraph victim_win["Windows Host"]
    subgraph os["Windows OS"]
        proc_mimikatz[Process: mimikatz.exe]:::elevated

        subgraph protected["Protected: Security Authority"]
            proc_lsass[Process: lsass.exe]
            mem_creds[(Credential Cache)]
        end
    end
end
```

**CRITICAL RULE:** Exploit edges (`-.->`) should visually **cross** a subgraph boundary. This makes the security violation obvious.
```

---

## 3. New Section: Edge Semantics

**Add after the ATTACK FLOW section, or integrate into it:**

```markdown
### 3.5 EDGE SEMANTICS (Action Types)

Beyond MITRE classification, edges have **semantic meaning** based on their syntax:

| Syntax | Meaning | When to Use | Visual |
|--------|---------|-------------|--------|
| `-->` | Normal action | Legitimate operations, standard flow | Default color |
| `-.->` | **Illegal action** | Security boundary violations, exploits | Red, dashed, glow |
| `==>` | **High-impact action** | Credential theft, lateral movement, exfiltration | Amber, thick |

**Usage Examples:**

```mermaid
%% Normal action - legitimate remote access
admin_ -->|1. [T1021] RDP Login| server_

%% Illegal action - security violation (crosses protected boundary)
proc_mimikatz -.->|2. [T1003.001] Dump Credentials| mem_lsass

%% High-impact action - credential theft result
cred_hashes ==>|3. [T1550] Pass the Hash| target_dc
```

**VALIDATION RULE:** Every `-.->` (illegal) edge should:
1. Cross a trust boundary (subgraph)
2. Have a MITRE T-Code in the label
3. Represent an actual security violation

**Common Illegal Edge Patterns:**
- Reading protected memory: `proc_attacker -.->|[T1003] Read| mem_protected`
- Process injection: `proc_malware -.->|[T1055] Inject| proc_target`
- Container escape: `proc_exploit -.->|[T1611] Escape| proc_host`
- Privilege boundary crossing: `proc_user -.->|[T1068] Exploit| proc_kernel`
```

---

## 4. Updated Examples Section

**Replace or augment the existing examples with:**

```markdown
### 5.5 INTERNAL ATTACK EXAMPLES

#### Example 1: Mimikatz Credential Dump

```mermaid
flowchart LR
    subgraph attacker_host["Attacker Machine"]
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

    attacker_ -->|1. [T1021.002] SMB Access| proc_mimi
    proc_mimi -.->|2. [T1003.001] Dump Credentials| mem_creds
    mem_creds -->|3. Extract| cred_tickets
    cred_tickets ==>|4. [T1550.002] Pass the Ticket| attacker_
```

#### Example 2: Process Injection

```mermaid
flowchart LR
    subgraph victim["Victim Host"]
        proc_malware[Process: malware.exe]

        subgraph user_session["User Session"]
            proc_explorer[Process: explorer.exe]
            mem_explorer[(Explorer Memory)]
        end
    end

    proc_malware -.->|1. [T1055.001] DLL Injection| mem_explorer
    mem_explorer -->|2. Execute in context| proc_explorer
    proc_explorer -->|3. [T1071] C2 Callback| c2_server
```

#### Example 3: Container Escape

```mermaid
flowchart LR
    subgraph host["Docker Host"]
        subgraph container["Container Boundary"]
            proc_app[Process: webapp]
            proc_exploit[Process: exploit]
        end

        proc_dockerd[Process: dockerd]
        mem_host[(Host Filesystem)]
    end

    proc_app -->|1. Compromise| proc_exploit
    proc_exploit -.->|2. [T1611] CVE-2019-5736| proc_dockerd
    proc_dockerd -.->|3. Escape to host| mem_host
```

#### Example 4: SQL Injection (Web Application)

```mermaid
flowchart LR
    subgraph attacker_ext["External"]
        attacker_([Attacker])
    end

    subgraph server["Web Server"]
        subgraph app["Web Application"]
            proc_webapp[Process: webapp]
            mem_input[(User Input)]
        end

        subgraph db_boundary["Database Boundary"]
            proc_db[Process: mysql]
            data_customers[(Customer Data)]
        end
    end

    attacker_ -->|1. HTTP Request| mem_input
    mem_input -->|2. Unsanitized| proc_webapp
    proc_webapp -.->|3. [T1190] SQL Injection| proc_db
    proc_db -->|4. Query| data_customers
    data_customers ==>|5. [T1041] Exfiltrate| attacker_
```
```

---

## 5. New Validation Checklist

**Add to "### 5. FINAL CHECKS":**

```markdown
### 5.1 INTERNAL ATTACK DIAGRAM CHECKS

For diagrams using internal entity modeling:

- [ ] Every `proc_`, `mem_`, `cred_` prefix is used correctly for entity type
- [ ] Trust boundaries use descriptive labels ("Protected:", "Container:", etc.)
- [ ] Illegal edges (`-.->`) cross a subgraph boundary
- [ ] High-impact edges (`==>`) are used for credential theft / lateral movement
- [ ] Nested subgraphs follow containment logic (Machine > OS > Process > Memory)
- [ ] State annotations (`:::elevated`, `:::compromised`) are used where relevant
- [ ] Credential entities have incoming edges explaining their origin
```

---

## 6. Quick Reference Card

**Add as a new section at the end:**

```markdown
---

## QUICK REFERENCE: Internal Attack Modeling

### Node Prefixes
| Prefix | Type | Shape |
|--------|------|-------|
| `proc_` | Process | `[...]` |
| `mem_` | Memory | `[(...)]` |
| `cred_` | Credential | `{{...}}` |
| `svc_` | Service | `[...]` |
| `data_` | Data | `[(...)]` |

### Edge Types
| Syntax | Meaning |
|--------|---------|
| `-->` | Normal |
| `-.->` | Illegal (exploit) |
| `==>` | High-impact |

### Boundary Keywords
| Keyword | Type |
|---------|------|
| Protected, Secure, LSASS | Protected (red) |
| Kernel, OS, Ring0 | Kernel (purple) |
| Container, Pod, Sandbox | Container (blue) |
| Machine, Host | Machine (gray) |

### State Annotations
| Syntax | Meaning |
|--------|---------|
| `:::elevated` | Admin/SYSTEM privs |
| `:::compromised` | Attacker-controlled |

### Core Rule
> **Security is the absence of certain edges.**
> **Exploitation is the appearance of one.**
>
> Every `-.->` edge should cross a boundary and have a T-Code.
```

---

## 7. Full Updated `llm-prompt.md`

The complete updated file should have this structure:

```
# Who are you and what you need to do
(existing)

# RESPONSE FORMAT
(existing)

## Description
(existing)

## Tags
(existing)

## Commands
(existing)

## Mermaid

### 1. DIAGRAM TYPE
(existing)

### 2. NODE DEFINITIONS
(existing - network level prefixes)

### 2.5 INTERNAL ENTITY NODES (NEW)
(from Section 2 above)

### 2.6 TRUST BOUNDARIES (NEW)
(from Section 2 above)

### 3. ATTACK FLOW & CLASSIFICATION
(existing)

### 3.5 EDGE SEMANTICS (NEW)
(from Section 3 above)

### 4. SEQUENCE DIAGRAM RULES
(existing)

### 5. FINAL CHECKS
(existing + new validation checks)

### 5.5 INTERNAL ATTACK EXAMPLES (NEW)
(from Section 4 above)

## Short Description
(existing)

# IMPORTANT NOTES
(existing, remove "DONT USE SUBGRAPH" rule)

## QUICK REFERENCE (NEW)
(from Section 6 above)
```

---

## 8. Key Changes Summary

| Section | Change |
|---------|--------|
| Node Definitions | Added `proc_`, `mem_`, `cred_`, `svc_`, `data_` prefixes |
| Trust Boundaries | Added subgraph usage for containment modeling |
| Edge Semantics | Added `-.->` (illegal) and `==>` (impact) syntax |
| State Annotations | Added `:::elevated`, `:::compromised` |
| Examples | Added 4 internal attack examples |
| Validation | Added internal attack checklist |
| Important Notes | **REMOVED** "DONT USE SUBGRAPH" rule |

---

## 9. Migration Path

### For Existing Prompts
- Network-level diagrams continue to work unchanged
- Add internal modeling only when attack details require it

### For New Prompts
- Use network-level for multi-host attacks
- Use internal-level for privilege escalation, credential theft, injection attacks
- Combine both for complete attack chains

### Decision Guide

| Attack Type | Use Network Level | Use Internal Level |
|-------------|------------------|-------------------|
| Lateral movement between hosts | Yes | No |
| Credential dumping | Optional | Yes |
| Process injection | No | Yes |
| Container escape | No | Yes |
| Web app exploitation | Optional | Yes |
| Phishing → C2 | Yes | Optional |
| Memory corruption | No | Yes |
