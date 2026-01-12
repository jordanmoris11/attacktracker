/**
 * PDF Export Constants
 * LinkedIn-optimized carousel dimensions and styling
 */

// =============================================================================
// PAGE DIMENSIONS (LinkedIn Optimal: 4:5 ratio)
// =============================================================================

export const PAGE = {
    WIDTH: 1080,
    HEIGHT: 1350,
    PADDING: 40,
    SCALE: 2, // Retina export (2x)
} as const;

// =============================================================================
// LAYOUT REGIONS
// =============================================================================

export const LAYOUT = {
    // Header region
    HEADER: {
        HEIGHT: 70,
        TITLE_FONT_SIZE: 28,
        STEP_FONT_SIZE: 16,
    },

    // Graph region (main content)
    GRAPH: {
        TOP: 120,           // Below header
        HEIGHT: 850,        // Main area
        PADDING: 20,        // Inner padding
    },

    // Info panel (bottom)
    INFO_PANEL: {
        TOP: 990,           // Below graph
        HEIGHT: 320,        // Bottom section
        PADDING: 30,

        // Sub-elements
        ACTION_FONT_SIZE: 24,
        CLI_FONT_SIZE: 14,
        TOOLTIP_FONT_SIZE: 17,
        MITRE_FONT_SIZE: 12,
    },

    // Swipe CTA
    CTA: {
        TEXT: 'Swipe',
        FONT_SIZE: 14,
        BOTTOM_OFFSET: 50,
        RIGHT_OFFSET: 50,
    }
} as const;

// =============================================================================
// COLOR PALETTE (Matches app theme)
// =============================================================================

export const COLORS = {
    // Backgrounds
    BG_PRIMARY: '#0f172a',      // Slate 900 - main background
    BG_SECONDARY: '#1e293b',    // Slate 800 - panels
    BG_TERTIARY: '#334155',     // Slate 700 - elevated
    BG_CLI: '#0c0c0c',          // Near black for CLI block

    // Text
    TEXT_PRIMARY: '#f8fafc',    // Slate 50 - headings
    TEXT_SECONDARY: '#cbd5e1',  // Slate 300 - body
    TEXT_MUTED: '#64748b',      // Slate 500 - subtle
    TEXT_CLI: '#4ade80',        // Green 400 - CLI commands

    // Accents
    BRAND_BLUE: '#3b82f6',      // Blue 500
    BRAND_PURPLE: '#8b5cf6',    // Violet 500
    AMBER: '#fbbf24',           // Amber 400

    // Border
    BORDER_SUBTLE: 'rgba(255, 255, 255, 0.1)',
    BORDER_MEDIUM: 'rgba(255, 255, 255, 0.2)',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const FONTS = {
    // Font families (Canvas compatible)
    SANS: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    MONO: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',

    // Weights
    WEIGHT_NORMAL: '400',
    WEIGHT_MEDIUM: '500',
    WEIGHT_BOLD: '700',
} as const;

// =============================================================================
// EXPORT OPTIONS (Defaults)
// =============================================================================

export interface SelectionBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PDFExportOptions {
    includeTooltips: boolean;
    includeCLI: boolean;
    includeMitre: boolean;
    coverPage: boolean;
    ctaPage: boolean;
    includeOverviewPage: boolean;    // Attack Overview page (description, prerequisites, gains, etc.)
    includeCommandsPage: boolean;    // Commands Reference page at end
    quality: 'standard' | 'high';
    selectionBounds: SelectionBounds | null;
}

export const DEFAULT_EXPORT_OPTIONS: PDFExportOptions = {
    includeTooltips: true,
    includeCLI: true,
    includeMitre: true,
    coverPage: true,
    ctaPage: false,
    includeOverviewPage: true,       // Enabled by default
    includeCommandsPage: true,       // Enabled by default
    quality: 'high',
    selectionBounds: null,
};

// =============================================================================
// OVERVIEW PAGE LAYOUT
// =============================================================================

export const OVERVIEW_LAYOUT = {
    TITLE_Y: 80,
    TITLE_FONT_SIZE: 32,
    SECTION_START_Y: 150,
    SECTION_GAP: 30,
    SECTION_TITLE_SIZE: 16,
    SECTION_CONTENT_SIZE: 14,
    BULLET_INDENT: 30,
    LINE_HEIGHT: 24,
    MAX_LINES_PER_SECTION: 8,
} as const;

// =============================================================================
// COMMANDS PAGE LAYOUT
// =============================================================================

export const COMMANDS_LAYOUT = {
    TITLE_Y: 80,
    TITLE_FONT_SIZE: 32,
    CODE_BLOCK_TOP: 150,
    CODE_BLOCK_PADDING: 30,
    CODE_FONT_SIZE: 13,
    CODE_LINE_HEIGHT: 22,
    MAX_LINES_PER_PAGE: 40,
} as const;

// =============================================================================
// MITRE TACTIC COLORS (Subset for PDF - matches mitre-index.ts)
// =============================================================================

export const TACTIC_COLORS: Record<string, string> = {
    'reconnaissance': '#2dd4bf',       // Teal
    'resource-development': '#a78bfa', // Violet
    'initial-access': '#f87171',       // Red
    'execution': '#fb923c',            // Orange
    'persistence': '#facc15',          // Yellow
    'privilege-escalation': '#a3e635', // Lime
    'defense-evasion': '#4ade80',      // Green
    'credential-access': '#22d3ee',    // Cyan
    'discovery': '#60a5fa',            // Blue
    'lateral-movement': '#818cf8',     // Indigo
    'collection': '#c084fc',           // Purple
    'command-and-control': '#f472b6',  // Pink
    'exfiltration': '#fb7185',         // Rose
    'impact': '#ef4444',               // Red 500
};

// Helper to get tactic color from MITRE data
export function getTacticColor(tactic?: string): string {
    if (!tactic) return COLORS.AMBER;
    const slug = tactic.toLowerCase().replace(/\s+/g, '-');
    return TACTIC_COLORS[slug] || COLORS.AMBER;
}
