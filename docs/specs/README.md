# Specification Index

This directory contains feature specifications documenting the design and implementation of AttackTracker components.

## Status Legend

| Status | Meaning |
|--------|---------|
| **Current** | Actively maintained, reflects current implementation |
| **Historical** | Documents original design decisions, may not reflect current code |
| **Superseded** | Replaced by newer spec, kept for reference |

---

## Current Specifications

| Spec | Title | Description |
|------|-------|-------------|
| [17_enrich_spec.md](17_enrich_spec.md) | **Enrich Spec** | Metadata system, PDF export, two-step LLM workflow, prompts |
| [15_pdf_export_spec.md](15_pdf_export_spec.md) | **PDF Export** | LinkedIn carousel generation, page renderers |

---

## Historical Specifications

These specs document the original design decisions. The implementation may have evolved.

### Data & Schema

| Spec | Title | Status |
|------|-------|--------|
| [1_data_modeling_spec.md](1_data_modeling_spec.md) | Data Modeling | Historical - see `scenario.schema.ts` for current |
| [2_json_input_spec.md](2_json_input_spec.md) | JSON Input Format | Historical - see `json-attack-graph-spec.md` |
| [3_parsing_input_spec.md](3_parsing_input_spec.md) | Parsing Input | Historical |

### Rendering & UI

| Spec | Title | Status |
|------|-------|--------|
| [4_rendering_with_cytoscape.md](4_rendering_with_cytoscape.md) | Cytoscape Rendering | Historical |
| [5_ui_icons_containers_spec.md](5_ui_icons_containers_spec.md) | Icons & Containers | Historical |
| [6_ui_styling_responsiveness_spec.md](6_ui_styling_responsiveness_spec.md) | UI Styling | Historical |
| [7_graph_canvas_rendering_spec.md](7_graph_canvas_rendering_spec.md) | Graph Canvas | Historical |

### Animation & Timeline

| Spec | Title | Status |
|------|-------|--------|
| [7_animation_spec.md](7_animation_spec.md) | Animation System | Historical |
| [12_animation_visibility_research.md](12_animation_visibility_research.md) | Visibility Research | Historical |

### Features

| Spec | Title | Status |
|------|-------|--------|
| [8_mitre_integration_spec.md](8_mitre_integration_spec.md) | MITRE Integration | Historical - core concepts still valid |
| [9_llm_prompt_spec.md](9_llm_prompt_spec.md) | LLM Prompt | Superseded by `full-llm-prompt.md` |
| [10_nesting_containers_spec.md](10_nesting_containers_spec.md) | Nesting Containers | Historical |
| [11_layout_persistence_spec.md](11_layout_persistence_spec.md) | Layout Persistence | Historical |
| [13_edge_tooltip_spec.md](13_edge_tooltip_spec.md) | Edge Tooltips | Historical |
| [14_add_clean_vs_malicious_svg.md](14_add_clean_vs_malicious_svg.md) | Clean/Malicious SVGs | Historical |
| [16_llm_output_enhancement_plan.md](16_llm_output_enhancement_plan.md) | LLM Enhancement Plan | Superseded by 17_enrich_spec |

---

## Key Documentation (Outside specs/)

| Document | Location | Purpose |
|----------|----------|---------|
| High Level Design | `docs/0_high_level_design.md` | Architecture overview |
| LLM Prompt | `docs/full-llm-prompt.md` | JSON generation prompt |
| Schema Spec | `docs/json-attack-graph-spec.md` | Complete JSON schema |

---

## Contributing

When adding new features:

1. Create a new spec with the next available number (e.g., `18_feature_name.md`)
2. Update this README to add the spec to the appropriate section
3. Mark any superseded specs in their status column
