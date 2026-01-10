import cytoscape from 'cytoscape';

// Spec 6 Design Tokens (matching tailwind.config.ts)
const COLORS = {
    bg: '#1e293b', // slate-800
    text: '#ffffff', // slate-200
    border: '#475569', // slate-600

    // Semantics
    normal: '#94a3b8', // slate-400
    illegal: '#ef4444', // red-500
    impact: '#f59e0b',  // amber-500 (gold)

    // Boundaries
    b_machine: '#64748b',
    b_protected: '#ef4444',
    b_kernel: '#8b5cf6',
    b_container: '#3b82f6',

    // Selection
    selection: '#22d3ee' // cyan-400
};

/**
 * Spec 4: Parsing Node Data for Icons
 * We rely on `data(iconPath)` being pre-populated in the elements JSON.
 */

export const CYTOSCAPE_THEME: cytoscape.Stylesheet[] = [
    // --- CORE: NODES ---
    {
        selector: 'node',
        style: {
            'width': 60,
            'height': 60,
            'label': 'data(label)',
            'background-color': COLORS.bg,
            'border-width': 2,
            'border-color': COLORS.border,
            'color': COLORS.text,
            'font-size': 12,
            'text-valign': 'bottom',
            'text-margin-y': 8,
            'text-wrap': 'wrap',
            'text-max-width': 80,
            'z-index': 10
        }
    },

    // --- ICONS (Spec 5) ---
    // Apply background image if 'iconPath' data exists
    {
        selector: 'node[iconPath]',
        style: {
            'background-image': 'data(iconPath)',
            'background-fit': 'contain', // Ensure full glyph visibility
            'background-opacity': 0, // Transparent background
            'border-width': 0 // Invisible border (Spec 5 refinement)
        }
    },

    // --- CORE: EDGES ---
    {
        selector: 'edge',
        style: {
            'width': 2,
            'curve-style': 'bezier',
            'line-color': COLORS.normal,
            'target-arrow-color': COLORS.normal,
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.2,
            'label': 'data(label)',
            'color': '#94a3b8', // slight dim for edge text
            'font-size': 10,
            'text-rotation': 'autorotate',
            'text-background-opacity': 1,
            'text-background-color': '#0f172a', // dark bg for readability
            'text-background-padding': 2
        }
    },

    // --- EDGE SEMANTICS (Spec 4 & 1) ---
    {
        selector: 'edge[type="illegal"]',
        style: {
            'line-color': COLORS.illegal,
            'target-arrow-color': COLORS.illegal,
            'width': 3,
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3]
        }
    },
    {
        selector: 'edge[type="impact"]',
        style: {
            'line-color': COLORS.impact,
            'target-arrow-color': COLORS.impact,
            'width': 4
        }
    },

    // --- CONTAINERS / COMPOUND NODES (Spec 10) ---
    {
        selector: ':parent',
        style: {
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-y': -10,
            'background-color': '#ffffff',
            'background-image': 'none',
            'background-opacity': 0.03, // Very subtle fill
            'border-width': 2,
            'border-color': COLORS.border,
            'border-style': 'dashed',
            'shape': 'roundrectangle',
            'font-size': 14,
            'font-weight': 'bold',
            'color': '#cbd5e1',
            // Spec 10: Compound Padding
            'padding': 20
        }
    },

    // --- TRUST BOUNDARIES (Spec 10) ---
    {
        selector: ':parent[boundary="protected"]',
        style: {
            'border-color': COLORS.b_protected,
            'color': COLORS.b_protected // Label color matches border
        }
    },
    {
        selector: ':parent[boundary="kernel"]',
        style: {
            'border-color': COLORS.b_kernel,
            'color': COLORS.b_kernel
        }
    },
    {
        selector: ':parent[boundary="machine"]',
        style: {
            'border-color': COLORS.b_machine,
            'border-style': 'solid', // Machines are solid boxes usually
            'background-color': '#0f172a', // Dark slate fill
            'background-opacity': 0.3
        }
    },

    // --- STATES (Spec 1) ---
    {
        selector: 'node[state="compromised"]',
        style: {
            'border-color': COLORS.illegal,
            'border-width': 4,
            'shadow-blur': 15,
            'shadow-color': COLORS.illegal,
            'shadow-opacity': 0.5
        }
    },

    // --- SELECTION ---
    {
        selector: ':selected',
        style: {
            'overlay-color': COLORS.selection,
            'overlay-opacity': 0.2, // Glow ring
            'overlay-padding': 5
        }
    },

    // --- ANIMATION STATES (Spec 7) ---
    {
        selector: '.hidden',
        style: {
            'display': 'none' // Completely remove from layout/view
        }
    },
    {
        selector: '.visible',
        style: {
            'display': 'element',
            'opacity': 1,
            'transition-property': 'opacity',
            'transition-duration': 500
        }
    },
    {
        selector: '.faded',
        style: {
            'opacity': 0.2
        }
    }
];
