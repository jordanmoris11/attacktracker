# Spec 2: JSON Input Format

**Status:** Active & Strict
**Related:** `docs/specs/1_data_modeling_spec.md`

## 1. Introduction
This document specifies the Strict JSON input format for `CyberViewer-Cyto` v2.0.
It is designed to be **LLM-Write-Optimized** and strictly typed to prevent hallucinations.

## 2. Root Structure
```json
{
  "title": "String",
  "description": "String (Optional)",
  "version": "2.0",
  "viewport": {
    "zoom": 1.0,
    "pan": { "x": 0, "y": 0 }
  },
  "entities": [ ... ],
  "visibility": { ... },
  "steps": [ ... ]
}
```

## 3. Entities Array
Entities define the "Cast" of the scenario.
**Constraint**: NO `color` field. Visuals are derived from `icon` or `type`.

```json
[
  {
    "id": "web_server",
    "type": "node",
    "label": "Web Server",
    "icon": "IconServer", // MUST match src/shared/config/icons.registry.ts
    "position": { "x": 100, "y": 200 }
  },
  {
    "id": "dmz",
    "type": "container",
    "label": "DMZ Network",
    "members": ["web_server"], // Parent references Child IDs
    "style": "dashed_border",
    "width": 300,
    "height": 400
  }
]
```

## 4. Visibility Map
Defines when entities appear. Default is "Always Visible".
```json
"visibility": {
  "web_server": { "start": 0, "end": 100 }, 
  "malware": { "start": 5, "end": 6 }
}
```

## 5. Steps Array (The Script)
Ordered execution flow.
**Constraint**: Polymorphic based on `type`.

```json
"steps": [
  {
    "id": 0,
    "type": "edge",
    "name": "Establish Persistence",
    "from": "malware",
    "to": "registry_key",
    "icon": "IconLock", // Optional: icon traveling on edge
    "mitre": { "id": "T1547", "tactic": "Persistence", "technique": "Run Keys" }
  },
  {
    "id": 1,
    "type": "show_text",
    "target_entity": "alert_box_1",
    "content": "EDR detected registry modification.",
    "style": "warning_alert"
  }
]
```
