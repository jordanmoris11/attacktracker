/**
 * ContainerHeaderRenderer.ts
 *
 * Custom canvas layer for rendering container headers (icon + centered text).
 * Solves the Cytoscape limitation where background-image and text-label
 * cannot be positioned relative to each other.
 *
 * Uses cytoscape-canvas to draw on a layer above nodes.
 */

import cytoscape from 'cytoscape';
import cytoscapeCanvas from 'cytoscape-canvas';

// Register the extension
cytoscape.use(cytoscapeCanvas);

// --- Configuration ---
const ICON_SIZE = 24;
const ICON_TEXT_GAP = 8;
const HEADER_Y_OFFSET = 10; // Distance ABOVE the top edge of container
const FONT_SIZE = 14;
const FONT_FAMILY = 'Inter, system-ui, sans-serif';
const TEXT_COLOR = '#cbd5e1'; // slate-300

// --- Icon Cache ---
const iconCache = new Map<string, HTMLImageElement>();
const loadingIcons = new Map<string, Promise<HTMLImageElement>>();

/**
 * Preload an icon as an HTMLImageElement for canvas drawing.
 */
function loadIcon(iconPath: string): Promise<HTMLImageElement> {
    // Return cached
    if (iconCache.has(iconPath)) {
        return Promise.resolve(iconCache.get(iconPath)!);
    }

    // Return existing loading promise
    if (loadingIcons.has(iconPath)) {
        return loadingIcons.get(iconPath)!;
    }

    // Start new load
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            iconCache.set(iconPath, img);
            loadingIcons.delete(iconPath);
            resolve(img);
        };
        img.onerror = () => {
            loadingIcons.delete(iconPath);
            reject(new Error(`Failed to load icon: ${iconPath}`));
        };
        img.src = iconPath;
    });

    loadingIcons.set(iconPath, promise);
    return promise;
}

/**
 * Preload all icons used by container nodes.
 */
export async function preloadContainerIcons(cy: cytoscape.Core): Promise<void> {
    const parentNodes = cy.nodes(':parent');
    const iconPaths = new Set<string>();

    parentNodes.forEach(node => {
        const iconPath = node.data('iconPath');
        if (iconPath) {
            iconPaths.add(iconPath);
        }
    });

    await Promise.all([...iconPaths].map(loadIcon));
}

/**
 * Initialize the custom canvas layer for container headers.
 * Call this AFTER Cytoscape is initialized.
 */
export function initContainerHeaderLayer(cy: cytoscape.Core): () => void {
    // Create a canvas layer that renders above nodes
    // @ts-ignore - cytoscape-canvas extends Core
    const layer = cy.cyCanvas({
        zIndex: 1, // Above default node layer (0)
        pixelRatio: 'auto'
    });

    const canvas = layer.getCanvas();
    const ctx = canvas.getContext('2d')!;

    /**
     * The main draw function - called on every render.
     */
    function drawContainerHeaders() {
        // Reset transform and clear
        layer.resetTransform(ctx);
        layer.clear(ctx);

        // Apply current pan/zoom transform
        layer.setTransform(ctx);

        // Get all parent (container) nodes
        const parentNodes = cy.nodes(':parent');

        parentNodes.forEach(node => {
            const iconPath = node.data('iconPath');
            const label = node.data('label') || '';

            // Skip if no icon or label
            if (!iconPath && !label) return;

            // Get node bounding box (in model coordinates)
            const bb = node.boundingBox({
                includeLabels: false,
                includeOverlays: false
            });

            // Calculate center X of container
            const centerX = bb.x1 + bb.w / 2;
            // Position ABOVE the container (negative offset from top edge)
            const headerY = bb.y1 - HEADER_Y_OFFSET;

            // Setup text measurement
            ctx.font = `bold ${FONT_SIZE}px ${FONT_FAMILY}`;
            const textMetrics = ctx.measureText(label);
            const textWidth = textMetrics.width;

            // Get icon from cache
            const icon = iconPath ? iconCache.get(iconPath) : null;
            const hasIcon = icon !== null && icon !== undefined;

            // Calculate total width and start position
            const iconWidth = hasIcon ? ICON_SIZE : 0;
            const gap = hasIcon && label ? ICON_TEXT_GAP : 0;
            const totalWidth = iconWidth + gap + textWidth;
            const startX = centerX - totalWidth / 2;

            // Draw icon
            if (hasIcon && icon) {
                ctx.drawImage(
                    icon,
                    startX,
                    headerY - ICON_SIZE / 2,
                    ICON_SIZE,
                    ICON_SIZE
                );
            }

            // Draw text
            if (label) {
                ctx.fillStyle = getTextColor(node);
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    label,
                    startX + iconWidth + gap,
                    headerY
                );
            }
        });
    }

    // Listen to render events
    cy.on('render', drawContainerHeaders);

    // Also trigger on specific events that might not fire 'render'
    cy.on('pan zoom resize', drawContainerHeaders);

    // Initial draw after a short delay to ensure layout is complete
    setTimeout(() => {
        preloadContainerIcons(cy).then(drawContainerHeaders);
    }, 100);

    // Return cleanup function
    return () => {
        cy.off('render', drawContainerHeaders);
        cy.off('pan zoom resize', drawContainerHeaders);
    };
}

/**
 * Get the appropriate text color based on node boundary type.
 */
function getTextColor(node: cytoscape.NodeSingular): string {
    const boundary = node.data('boundary');

    switch (boundary) {
        case 'protected':
            return '#ef4444'; // red-500
        case 'kernel':
            return '#8b5cf6'; // purple-500
        case 'machine':
            return '#64748b'; // slate-500
        default:
            return TEXT_COLOR;
    }
}
