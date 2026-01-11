# Spec 13: Modern Edge Tooltip Implementation

> [!NOTE]
> This specification defines the implementation details for a "Mission Control" style edge tooltip. It focuses on precision, modern aesthetics (glassmorphism), and high-performance interaction.

## 1. Objective

To implement a highly responsive, visually premium tooltip that appears when hovering over graph edges. The tooltip will display context-rich information about the attack step, including the action description and MITRE ATT&CK reference.

## 2. Technical Architecture

### 2.1 Component Structure

We will create a new dedicated component: `src/ui/features/GraphCanvas/EdgeTooltip.tsx`.

```tsx
interface TooltipData {
  x: number;
  y: number;
  label: string;       // The action name (e.g., "Exfiltrate to C2")
  description?: string; // The detailed tooltip text
  mitre?: {
    id: string;        // T1041
    technique: string; // Exfiltration Over C2 Channel
    tactic: string;    // Exfiltration
    color: string;     // The tactic color (for border/glow)
  };
}

export const EdgeTooltip: React.FC<{ data: TooltipData | null }> = ({ data }) => {
  if (!data) return null;
  // Render logic...
}
```

### 2.2 Integration Point (`GraphCanvas.tsx`)

The `GraphCanvas` component needs to host the state for the tooltip.

1.  **State Management**:
    ```typescript
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
    ```

2.  **Data Injection**:
    Modify the `cy.add` logic in `GraphCanvas.tsx` to include the necessary metadata in the edge's `data` field. Currently, it only includes `id`, `source`, `target`, and `label`.
    **New Data Fields**:
    *   `tooltip`: `step.tooltip`
    *   `mitre`: `step.mitre`

3.  **Event Listeners**:
    Attach listeners within the `useEffect` where Cytoscape is initialized (or the data loading effect).

    ```typescript
    // Hover Start
    cy.on('mouseover', 'edge', (e) => {
        const edge = e.target;
        const renderPos = e.renderedPosition; // Canvas coordinates
        
        // Extract data
        const mitreData = edge.data('mitre');
        const color = mitreData ? MITRE_INDEX[mitreData.id]?.color : '#fbbf24';

        setTooltipData({
            x: renderPos.x,
            y: renderPos.y,
            label: edge.data('label'),
            description: edge.data('tooltip'),
            mitre: { ...mitreData, color }
        });
    });

    // Follow Mouse (Optional but recommended for precision)
    cy.on('mousemove', (e) => {
        // Update position only if tooltip is active to avoid excessive re-renders
        // Alternatively, use a ref for position to avoid React render cycle for just X/Y
    });

    // Hover End
    cy.on('mouseout', 'edge', () => {
        setTooltipData(null);
    });
    ```

## 3. Visual Design (The "Mission Control" Statistic)

The design must feel "Cyberpunk / Scifi" but legible.

### 3.1 Styling Strategy (Tailwind)

*   **Container**:
    *   `absolute` positioning based on `top/left` styles.
    *   `z-50` to float above everything.
    *   `pointer-events-none` to prevent flickering if cursor touches it.
    *   **Glassmorphism**: `backdrop-blur-md`, `bg-slate-900/90`.
    *   **Border**: 1px solid, dynamic color based on MITRE tactic.
    *   **Shadow**: `shadow-[0_0_15px_rgba(var(--tactic-color),0.3)]`.

### 3.2 Content Layout

1.  **Header**:
    *   Action Name in **Bold**, uppercase tracking-wide.
    *   Font: `font-mono`.
    *   Color: White.

2.  **Body**:
    *   Description text.
    *   Color: `text-slate-300`.
    *   Text size: `text-xs` or `text-sm`.
    *   Leading: `leading-relaxed`.

3.  **Footer (MITRE Badge)**:
    *   A pill or distinct section at the bottom.
    *   Shows `[T1566] Phishing`.
    *   Text color matches the Tactic Color (e.g., Red for Execution, Gold for C2).

## 4. Implementation Steps (Plan)

1.  **Update Graph Logic**: Modify `GraphCanvas.tsx` loop to inject `tooltip` and `mitre` into edge `data`.
2.  **Create Component**: Build `EdgeTooltip.tsx` with dummy data to perfect the CSS.
3.  **Wire Events**: Connect Cytoscape events to the React state.
4.  **Polish**: Add entry animation (`framer-motion` or CSS keyframes `opacity-0` -> `opacity-100` scale-95 -> scale-100).

## 5. Example Data Payload

```json
{
  "label": "Exfiltrate to C2",
  "tooltip": "Malware bundles collected credentials and posts them to the C2 webhook.",
  "mitre": {
    "id": "T1041",
    "tactic": "Exfiltration",
    "technique": "Exfiltration Over C2 Channel"
  }
}
```
