import { z } from 'zod';

// --- Primitives ---
export const PositionSchema = z.object({
    x: z.number(),
    y: z.number()
});

export const ViewportSchema = z.object({
    zoom: z.number(),
    pan: PositionSchema
});

export const MitreMetadataSchema = z.object({
    id: z.string(), // e.g. T1595.001
    tactic: z.string(),
    technique: z.string()
});

// --- Entities ---
// Base attributes common to all entities
const BaseEntitySchema = z.object({
    id: z.string(),
    label: z.string(),
    position: PositionSchema,
    icon: z.string().optional()
});

export const NodeEntitySchema = BaseEntitySchema.extend({
    type: z.literal('node')
});

export const ContainerEntitySchema = BaseEntitySchema.extend({
    type: z.literal('container'),
    width: z.number().optional(),
    height: z.number().optional(),
    style: z.string().optional(), // e.g. 'dashed_border'
    members: z.array(z.string()).default([]) // IDs of children
});

export const TextBoxEntitySchema = BaseEntitySchema.extend({
    type: z.literal('text_box')
});

export const ScenarioEntitySchema = z.discriminatedUnion('type', [
    NodeEntitySchema,
    ContainerEntitySchema,
    TextBoxEntitySchema
]);

// --- Visibility ---
export const VisibilityRangeSchema = z.object({
    start: z.number().int(),
    end: z.number().int()
});

export const VisibilityMapSchema = z.record(z.string(), VisibilityRangeSchema);

// --- Scenario Metadata (Extended LLM Output) ---
export const ScenarioMetadataSchema = z.object({
    descriptionHtml: z.string().optional(),        // Full HTML description from LLM
    commandsBlock: z.string().optional(),          // Enhanced commands with comments
    prerequisites: z.array(z.string()).optional(), // Attack requirements
    attackerGains: z.array(z.string()).optional(), // What attacker achieves
    detectionNotes: z.array(z.string()).optional(), // Detection/OPSEC notes
    mitreCategories: z.array(z.string()).optional(), // MITRE technique IDs
    owaspCategories: z.array(z.string()).optional(), // OWASP categories
    extraInfo: z.array(z.string()).optional(),     // Extra refs: GitHub, CVE, tools, blogs
});

// --- Timeline Steps ---
const BaseStepSchema = z.object({
    id: z.number().int(),
    name: z.string(), // Human readable name for the timeline
    mitre: MitreMetadataSchema.optional()
});

export const EdgeStepSchema = BaseStepSchema.extend({
    type: z.literal('edge'),
    from: z.string(), // Source Entity ID
    to: z.string(),   // Target Entity ID
    icon: z.string().optional(), // Icon moving along the edge
    tooltip: z.string().optional(), // Description on hover
    cli: z.string().optional() // Command line instruction
});

export const ShowTextStepSchema = BaseStepSchema.extend({
    type: z.literal('show_text'),
    target_entity: z.string(), // ID of text_box or entity to annotate
    content: z.string(), // The text to show
    style: z.string().optional() // e.g. 'warning_alert', 'info_toast'
});

export const TimelineStepSchema = z.discriminatedUnion('type', [
    EdgeStepSchema,
    ShowTextStepSchema
]);

// --- Root Scenario ---
export const ScenarioSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    version: z.string().default('2.0'),
    viewport: ViewportSchema.optional(),

    // NEW: Extended metadata from full LLM output
    shortDescription: z.string().optional(),       // 7-word max summary
    tags: z.array(z.string()).optional(),          // Categorization tags
    metadata: ScenarioMetadataSchema.optional(),   // Rich metadata object

    entities: z.array(ScenarioEntitySchema),
    visibility: VisibilityMapSchema.optional(),
    steps: z.array(TimelineStepSchema)
});

// --- Types ---
export type Position = z.infer<typeof PositionSchema>;
export type Viewport = z.infer<typeof ViewportSchema>;
export type ScenarioEntity = z.infer<typeof ScenarioEntitySchema>;
export type VisibilityMap = z.infer<typeof VisibilityMapSchema>;
export type ScenarioMetadata = z.infer<typeof ScenarioMetadataSchema>;
export type TimelineStep = z.infer<typeof TimelineStepSchema>;
export type EdgeStep = z.infer<typeof EdgeStepSchema>;
export type ShowTextStep = z.infer<typeof ShowTextStepSchema>;
export type ScenarioData = z.infer<typeof ScenarioSchema>;

// --- Extracted Metadata (for UI consumption with fallbacks) ---
export interface ExtractedMetadata {
    shortDescription: string;
    tags: string[];
    descriptionHtml: string | null;
    commandsBlock: string;
    extraInfo: string[];
    prerequisites: string[];
    attackerGains: string[];
    detectionNotes: string[];
    mitreCategories: string[];
}
