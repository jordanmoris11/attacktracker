/**
 * OverviewPageRenderer.ts
 *
 * Renders the Attack Overview page for PDF export.
 * Shows prerequisites, attacker gains, detection notes, and MITRE mapping.
 */

import { PAGE, COLORS, FONTS, OVERVIEW_LAYOUT, getTacticColor } from './pdf.constants';
import type { ExtractedMetadata } from '../../shared/schemas/scenario.schema';

interface OverviewPageOptions {
    metadata: ExtractedMetadata;
    scenarioTitle: string;
    totalSteps: number;
}

/**
 * OverviewPageRenderer
 * Creates a canvas page with attack context information
 */
export class OverviewPageRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private scale: number;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.scale = PAGE.SCALE;

        this.canvas.width = PAGE.WIDTH * this.scale;
        this.canvas.height = PAGE.HEIGHT * this.scale;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        this.ctx = ctx;

        this.ctx.scale(this.scale, this.scale);
    }

    /**
     * Render the overview page and return as PNG blob
     */
    async renderPage(options: OverviewPageOptions): Promise<Blob> {
        const { metadata, scenarioTitle, totalSteps } = options;

        // Clear canvas
        this.ctx.fillStyle = COLORS.BG_PRIMARY;
        this.ctx.fillRect(0, 0, PAGE.WIDTH, PAGE.HEIGHT);

        let yOffset = OVERVIEW_LAYOUT.TITLE_Y;

        // Page title
        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `bold ${OVERVIEW_LAYOUT.TITLE_FONT_SIZE}px ${FONTS.SANS}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('ATTACK OVERVIEW', PAGE.WIDTH / 2, yOffset);

        // Subtitle (scenario title)
        yOffset += 50;
        this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
        this.ctx.font = `400 18px ${FONTS.SANS}`;
        this.ctx.fillText(scenarioTitle, PAGE.WIDTH / 2, yOffset);

        // Divider
        yOffset += 50;
        this.ctx.strokeStyle = COLORS.BORDER_SUBTLE;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(PAGE.PADDING, yOffset);
        this.ctx.lineTo(PAGE.WIDTH - PAGE.PADDING, yOffset);
        this.ctx.stroke();

        yOffset = OVERVIEW_LAYOUT.SECTION_START_Y + 50;

        // Short Description (if present)
        if (metadata.shortDescription) {
            yOffset = this.renderSection(
                'Summary',
                [metadata.shortDescription],
                yOffset,
                COLORS.BRAND_BLUE
            );
        }

        // Full Description (strip HTML, render as plain text)
        if (metadata.descriptionHtml) {
            const plainDescription = this.stripHtml(metadata.descriptionHtml);
            if (plainDescription) {
                yOffset = this.renderSection(
                    'Description',
                    [plainDescription],
                    yOffset,
                    '#22d3ee' // Cyan
                );
            }
        }

        // Prerequisites
        if (metadata.prerequisites.length > 0) {
            yOffset = this.renderSection(
                'Prerequisites',
                metadata.prerequisites,
                yOffset,
                '#f59e0b' // Amber
            );
        }

        // Attacker Gains
        if (metadata.attackerGains.length > 0) {
            yOffset = this.renderSection(
                'Attacker Gains',
                metadata.attackerGains,
                yOffset,
                '#ef4444' // Red
            );
        }

        // Detection Notes
        if (metadata.detectionNotes.length > 0) {
            yOffset = this.renderSection(
                'Detection / OPSEC',
                metadata.detectionNotes,
                yOffset,
                '#3b82f6' // Blue
            );
        }

        // MITRE Techniques
        if (metadata.mitreCategories.length > 0) {
            yOffset = this.renderMitreSection(metadata.mitreCategories, yOffset);
        }

        // Extra Info (GitHub repos, CVE links, tools, references)
        if (metadata.extraInfo.length > 0) {
            yOffset = this.renderSection(
                'Extra Info',
                metadata.extraInfo,
                yOffset,
                COLORS.BRAND_PURPLE
            );
        }

        // Footer: step count badge
        this.renderFooter(totalSteps);

        // Convert to blob
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to create blob'));
                },
                'image/png',
                1.0
            );
        });
    }

    /**
     * Render a section with title and bullet points
     */
    private renderSection(
        title: string,
        items: string[],
        startY: number,
        accentColor: string
    ): number {
        let yOffset = startY;

        // Section title with accent bar
        this.ctx.fillStyle = accentColor;
        this.ctx.fillRect(PAGE.PADDING, yOffset, 4, 24);

        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `600 ${OVERVIEW_LAYOUT.SECTION_TITLE_SIZE}px ${FONTS.SANS}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(title.toUpperCase(), PAGE.PADDING + 16, yOffset + 4);

        yOffset += OVERVIEW_LAYOUT.LINE_HEIGHT + 10;

        // Items
        this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
        this.ctx.font = `400 ${OVERVIEW_LAYOUT.SECTION_CONTENT_SIZE}px ${FONTS.SANS}`;

        const maxItems = Math.min(items.length, OVERVIEW_LAYOUT.MAX_LINES_PER_SECTION);
        for (let i = 0; i < maxItems; i++) {
            const item = items[i];
            const lines = this.wrapText(item, PAGE.WIDTH - PAGE.PADDING * 2 - OVERVIEW_LAYOUT.BULLET_INDENT - 20);

            // Bullet
            this.ctx.fillStyle = accentColor;
            this.ctx.fillText('•', PAGE.PADDING + OVERVIEW_LAYOUT.BULLET_INDENT, yOffset);

            // Text
            this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
            lines.forEach((line, idx) => {
                const x = PAGE.PADDING + OVERVIEW_LAYOUT.BULLET_INDENT + 20;
                this.ctx.fillText(line, x, yOffset + idx * OVERVIEW_LAYOUT.LINE_HEIGHT);
            });

            yOffset += lines.length * OVERVIEW_LAYOUT.LINE_HEIGHT + 4;
        }

        if (items.length > maxItems) {
            this.ctx.fillStyle = COLORS.TEXT_MUTED;
            this.ctx.font = `italic 12px ${FONTS.SANS}`;
            this.ctx.fillText(`+${items.length - maxItems} more...`, PAGE.PADDING + OVERVIEW_LAYOUT.BULLET_INDENT + 20, yOffset);
            yOffset += OVERVIEW_LAYOUT.LINE_HEIGHT;
        }

        return yOffset + OVERVIEW_LAYOUT.SECTION_GAP;
    }

    /**
     * Render MITRE techniques section
     */
    private renderMitreSection(techniques: string[], startY: number): number {
        let yOffset = startY;

        // Section title
        this.ctx.fillStyle = '#fbbf24'; // Amber
        this.ctx.fillRect(PAGE.PADDING, yOffset, 4, 24);

        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `600 ${OVERVIEW_LAYOUT.SECTION_TITLE_SIZE}px ${FONTS.SANS}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('MITRE ATT&CK', PAGE.PADDING + 16, yOffset + 4);

        yOffset += OVERVIEW_LAYOUT.LINE_HEIGHT + 15;

        // Render technique badges
        const badgeWidth = 100;
        const badgeHeight = 32;
        const badgeGap = 10;
        const badgesPerRow = Math.floor((PAGE.WIDTH - PAGE.PADDING * 2) / (badgeWidth + badgeGap));

        techniques.slice(0, 12).forEach((technique, idx) => {
            const row = Math.floor(idx / badgesPerRow);
            const col = idx % badgesPerRow;

            const x = PAGE.PADDING + col * (badgeWidth + badgeGap);
            const y = yOffset + row * (badgeHeight + badgeGap);

            // Badge background
            this.ctx.fillStyle = COLORS.BG_TERTIARY;
            this.roundRect(x, y, badgeWidth, badgeHeight, 6);
            this.ctx.fill();

            // Badge text
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.font = `bold 12px ${FONTS.MONO}`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(technique, x + badgeWidth / 2, y + 12);
        });

        const rows = Math.ceil(Math.min(techniques.length, 12) / badgesPerRow);
        return yOffset + rows * (badgeHeight + badgeGap) + OVERVIEW_LAYOUT.SECTION_GAP;
    }

    /**
     * Render footer with step count
     */
    private renderFooter(totalSteps: number): void {
        const footerY = PAGE.HEIGHT - 80;

        // Swipe indicator
        this.ctx.fillStyle = COLORS.TEXT_MUTED;
        this.ctx.font = `500 14px ${FONTS.SANS}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${totalSteps} Steps`, PAGE.WIDTH / 2, footerY);

        // Arrow
        this.ctx.fillStyle = COLORS.BRAND_BLUE;
        this.ctx.font = `400 20px ${FONTS.SANS}`;
        this.ctx.fillText('Swipe to begin →', PAGE.WIDTH / 2, footerY + 30);
    }

    /**
     * Strip HTML tags and return plain text
     */
    private stripHtml(html: string): string {
        return html
            .replace(/<[^>]+>/g, ' ')  // Remove HTML tags
            .replace(/\s+/g, ' ')       // Normalize whitespace
            .trim();
    }

    /**
     * Wrap text to fit width
     */
    private wrapText(text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = this.ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    /**
     * Draw rounded rectangle
     */
    private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
}
