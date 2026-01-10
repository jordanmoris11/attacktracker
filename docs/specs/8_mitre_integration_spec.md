# Spec 8: MITRE Integration Specification

**Status:** Draft
**Related:** `docs/specs/1_data_modeling_spec.md`
**Legacy Source:** `Old_Code/docs/specs/09-mitre-advanced-features.md`, `Old_Code/js/ui/StatusLegend.js`

## 1. Overview
The **MITRE Integration** turns the passive graph into an active Threat Intelligence tool. It provides a "Matrix Explorer" sidebar that maps the observed attack behaviors to the official MITRE ATT&CK Kill Chain.

**Core Features:**
1.  **Kill Chain Dashboard**: Visualizes all 12 Tactics (Reconnaissance -> Impact).
2.  **Auto-Enrichment**: Parses edge labels (e.g., "MimiKatz") into T-Codes (T1003).
3.  **Active Matrix**: Highlights techniques used in the specific diagram.

## 2. Architecture

### 2.1 The MITRE Index (`src/shared/config/mitre-index.ts`)
We will port the generated `mitre-index.js` to a typed TypeScript constant.
*   **Format**: Dictionary `Record<TCode, TechniqueMetadata>`.
*   **Content**: ID, Name, URL, Tactic[] (List of parent tactics).

### 2.2 The Enrichment Logic (`src/core/mitre/enrichment.ts`)
Used by the **Parser** (Spec 3) during graph creation.

```typescript
export function enrichEdge(edge: GraphEdge): void {
   // 1. Check explicit 'mitre' field
   if (edge.mitre) return;
   
   // 2. Scan Label for known Keywords
   const label = edge.label.toLowerCase();
   
   // Simple Heuristic Map (To be expanded)
   if (label.includes('mimikatz')) edge.mitre = 'T1003';
   if (label.includes('kerberoast')) edge.mitre = 'T1558.003';
   // ...
}
```

## 3. The `MatrixExplorer` Component (`src/ui/overlays/MatrixExplorer.tsx`)
Replaces the legacy `StatusLegend.js`.

### 3.1 UI Structure
A collapsible Side Panel (Right side via Spec 6 layout).
*   **Header**: "MITRE ATT&CK Matrix" + Stats (Active Techniques / Total).
*   **Filter**: Toggle "Show Active Only".
*   **Content**: List of **Tactic Cards**.

### 3.2 Tactic Card
An accordion that contains Techniques.
*   **State**: `Expanded` | `Collapsed`.
*   **Visual**:
    *   **Colors**: Based on legacy `edges.registry.js` (Recon=Cyan, Impact=Pink).
    *   **Active Indicator**: Glowing dot if any child technique is present in the graph.

### 3.3 Active Highlighting
When the Animation (Spec 7) plays a step:
1.  `useAnimationStore` emits the current active edge.
2.  `MatrixExplorer` checks if that edge has a T-Code.
3.  If yes, the corresponding Technique Tag in the matrix pulses (CSS Animation).

## 4. Implementation Plan
1.  **Data**: Copy `mitre-index.js` to `src/shared/config/mitre-index.ts` (Auto-generate typings).
2.  **Logic**: Implement `enrichment.ts`.
3.  **UI**: Build `MatrixExplorer` with Tailwind.
4.  **Integration**: Connect to `useGraphStore` to derive the list of "Used T-Codes".
