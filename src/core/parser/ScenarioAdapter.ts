import { z } from 'zod';
import { ScenarioSchema, type ScenarioData, type ScenarioEntity, type VisibilityMap, type TimelineStep } from '../../shared/schemas/scenario.schema';
import { getIconPath, ICON_REGISTRY } from '../../shared/config/icons.registry';
import { parseJsonWithSanitization } from '../../shared/utils/jsonSanitizer';

// Types for the Parse Result
export interface ParseResult {
    success: boolean;
    data?: ScenarioData; // The raw valid data
    cyElements?: any[];  // Converted Cytoscape Elements (Nodes)
    errors?: string[];
}

/**
 * ScenarioAdapter
 * 
 * Responsible for:
 * 1. Validating raw JSON against ScenarioSchema.
 * 2. converting 'members' arrays into 'parent' pointers for Cytoscape.
 * 3. Resolving icon paths.
 */
export const scenarioAdapter = {
    parse(content: string | object): ParseResult {
        try {
            // Use sanitizing parser for string input to handle common LLM output issues
            let rawJson: any;
            if (typeof content === 'string') {
                const parseResult = parseJsonWithSanitization(content);
                if (parseResult.error) {
                    return {
                        success: false,
                        errors: [parseResult.error]
                    };
                }
                rawJson = parseResult.data;
                if (parseResult.wasSanitized) {
                    console.info('[ScenarioAdapter] JSON was auto-sanitized (fixed HTML attribute quotes)');
                }
            } else {
                rawJson = content;
            }

            // 1. Validate
            const validation = ScenarioSchema.safeParse(rawJson);

            if (!validation.success) {
                return {
                    success: false,
                    errors: validation.error?.errors?.map(e => `${e.path.join('.')}: ${e.message}`) || ['Invalid Scenario Data']
                };
            }

            const scenario = validation.data;

            // 2. Convert Entities to Cytoscape Elements
            // We need to map 'members' (Container -> Children) to 'parent' (Child -> Container)

            // First, build a map of who belongs to whom
            const parentMap = new Map<string, string>(); // ChildID -> ParentID

            scenario.entities.forEach(entity => {
                if (entity.type === 'container' && entity.members) {
                    entity.members.forEach(childId => {
                        parentMap.set(childId, entity.id);
                    });
                }
            });

            // Now transform entities
            const cyNodes = scenario.entities.map(entity => {
                // Resolve Icon
                // We assume the JSON might use "IconFirewall" or just "firewall"
                // The registry helper deals with simple keys. If user passes "IconFirewall", 
                // we might need to strip "Icon" prefix or update registry? 
                // For now, let's pass the raw string and let getIconPath handle fallback
                // but let's try to normalize camelCase to lowercase if needed

                const iconKey = entity.icon;

                // For containers, use explicit color from JSON if provided, otherwise fall back to icon registry
                const defaultColor = ICON_REGISTRY[iconKey as keyof typeof ICON_REGISTRY]?.color || ICON_REGISTRY['IconDefault'].color;
                const entityColor = (entity.type === 'container' && 'color' in entity && entity.color)
                    ? entity.color
                    : defaultColor;

                const cvElement = {
                    group: 'nodes',
                    data: {
                        id: entity.id,
                        label: entity.label,
                        type: entity.type, // 'node' | 'container' | 'text_box'
                        parent: parentMap.get(entity.id), // The reverse mapping
                        iconPath: getIconPath(iconKey),
                        color: entityColor,
                        // Container specific
                        style: entity.type === 'container' ? entity.style : undefined,
                        width: entity.type === 'container' ? entity.width : undefined,
                        height: entity.type === 'container' ? entity.height : undefined,
                    },
                    position: entity.position, // { x, y } - Cytoscape preset layout uses this
                    // Lock viewport if needed, or allow drag
                    locked: false
                };

                return cvElement;
            });

            return {
                success: true,
                data: scenario,
                cyElements: cyNodes,
                errors: []
            };

        } catch (e: any) {
            return {
                success: false,
                errors: [e.message || 'Unknown parsing error']
            };
        }
    }
};
