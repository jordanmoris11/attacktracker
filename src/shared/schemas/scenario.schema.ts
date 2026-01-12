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

    entities: z.array(ScenarioEntitySchema),
    visibility: VisibilityMapSchema.optional(), // Optional, default to always visible if missing? Or should strict parser handle defaults.
    steps: z.array(TimelineStepSchema)
});

// --- Types ---
export type Position = z.infer<typeof PositionSchema>;
export type Viewport = z.infer<typeof ViewportSchema>;
export type ScenarioEntity = z.infer<typeof ScenarioEntitySchema>;
export type VisibilityMap = z.infer<typeof VisibilityMapSchema>;
export type TimelineStep = z.infer<typeof TimelineStepSchema>;
export type EdgeStep = z.infer<typeof EdgeStepSchema>;
export type ShowTextStep = z.infer<typeof ShowTextStepSchema>;
export type ScenarioData = z.infer<typeof ScenarioSchema>;
