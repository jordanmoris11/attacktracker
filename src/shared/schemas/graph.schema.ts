import { z } from 'zod';

// --- Enums ---

// Spec 1: Entity Types
export const EntityTypeSchema = z.enum([
    'device',      // Physical/Virtual Machine
    'actor',       // Attacker/User
    'process',     // Running Code
    'service',     // Long-running Daemon
    'data',        // File/Database
    'credential',  // Key/Hash
    'container'    // Logical Boundary (Subnet, Cloud)
]);

// Spec 1: Entity States
export const EntityStateSchema = z.enum([
    'normal',
    'compromised', // Red border/glow
    'elevated',    // Orange badge
    'protected',   // Blue/Shielded
    'encrypted'    // Lock icon
]);

// Spec 1: Edge Semantics
export const EdgeTypeSchema = z.enum([
    'normal',  // Standard flow
    'illegal', // Security violation (Exploit)
    'impact'   // Critical consequence (Theft)
]);

// Spec 10: Trust Boundaries
export const BoundaryTypeSchema = z.enum([
    'network',
    'machine',
    'kernel',
    'protected',
    'container',
    'user'
]);

// --- Nodes ---

export const NodeSchema = z.object({
    id: z.string().min(1),
    label: z.string(),
    type: EntityTypeSchema.default('device'),

    // Hierarchy (Spec 10)
    parent: z.string().optional(), // ID of container node

    // Visuals
    icon: z.string().optional(), // Override icon name (e.g., "kali", "win10")
    state: EntityStateSchema.default('normal'),

    // Animation Control (Spec 12)
    step: z.number().int().min(0).optional(), // 0 = Always visible, N = Appears at Step N

    // Layout Persistence (New)
    position: z.object({
        x: z.number(),
        y: z.number()
    }).optional(),

    // Metadata for Containers (Spec 10)
    metadata: z.object({
        boundary: BoundaryTypeSchema.optional(),
        description: z.string().optional()
    }).catchall(z.any()).optional()
});

// --- Edges ---

export const EdgeSchema = z.object({
    id: z.string().optional(), // Auto-generated if missing
    source: z.string(),
    target: z.string(),

    label: z.string().default(''), // "DCSync"

    // Semantics & Animation
    type: EdgeTypeSchema.default('normal'),
    step: z.number().int().optional(), // Animation step index (1-based)

    // MITRE Integration (Spec 8)
    mitre: z.string().regex(/^T\d{4}(\.\d{3})?$/, "Invalid T-Code format").optional(),

    // Metadata
    description: z.string().optional(),
    protocol: z.string().optional()
});

// --- Graph ---

export const AttackGraphSchema = z.object({
    title: z.string().default('Untitled Attack Graph'),
    description: z.string().optional(),
    version: z.literal('2.0').default('2.0'),

    // Layout Persistence (New)
    viewport: z.object({
        zoom: z.number(),
        pan: z.object({ x: z.number(), y: z.number() })
    }).optional(),

    nodes: z.array(NodeSchema),
    edges: z.array(EdgeSchema)
});

// --- Type Inference ---
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type EntityState = z.infer<typeof EntityStateSchema>;
export type EdgeType = z.infer<typeof EdgeTypeSchema>;
export type BoundaryType = z.infer<typeof BoundaryTypeSchema>;
export type GraphNode = z.infer<typeof NodeSchema>;
export type GraphEdge = z.infer<typeof EdgeSchema>;
export type AttackGraph = z.infer<typeof AttackGraphSchema>;
