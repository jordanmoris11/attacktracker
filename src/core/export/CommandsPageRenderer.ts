/**
 * CommandsPageRenderer.ts
 *
 * Renders the Commands Reference page for PDF export.
 * Shows all CLI commands from the attack scenario.
 */

import { PAGE, COLORS, FONTS, COMMANDS_LAYOUT } from './pdf.constants';
import type { ExtractedMetadata } from '../../shared/schemas/scenario.schema';

interface CommandsPageOptions {
    metadata: ExtractedMetadata;
    scenarioTitle: string;
    pageNumber?: number;  // For multi-page support
    totalPages?: number;
}

/**
 * CommandsPageRenderer
 * Creates a canvas page with syntax-highlighted commands
 */
export class CommandsPageRenderer {
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
     * Render the commands page and return as PNG blob
     */
    async renderPage(options: CommandsPageOptions): Promise<Blob> {
        const { metadata, scenarioTitle, pageNumber = 1, totalPages = 1 } = options;

        // Clear canvas
        this.ctx.fillStyle = COLORS.BG_PRIMARY;
        this.ctx.fillRect(0, 0, PAGE.WIDTH, PAGE.HEIGHT);

        let yOffset = COMMANDS_LAYOUT.TITLE_Y;

        // Page title
        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `bold ${COMMANDS_LAYOUT.TITLE_FONT_SIZE}px ${FONTS.SANS}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('COMMANDS REFERENCE', PAGE.WIDTH / 2, yOffset);

        // Subtitle
        yOffset += 45;
        this.ctx.fillStyle = COLORS.TEXT_MUTED;
        this.ctx.font = `400 14px ${FONTS.SANS}`;
        if (totalPages > 1) {
            this.ctx.fillText(`${scenarioTitle} • Page ${pageNumber} of ${totalPages}`, PAGE.WIDTH / 2, yOffset);
        } else {
            this.ctx.fillText(scenarioTitle, PAGE.WIDTH / 2, yOffset);
        }

        // Code block background
        const codeBlockTop = COMMANDS_LAYOUT.CODE_BLOCK_TOP;
        const codeBlockHeight = PAGE.HEIGHT - codeBlockTop - 150;

        this.ctx.fillStyle = '#0a0a0a';
        this.roundRect(
            PAGE.PADDING,
            codeBlockTop,
            PAGE.WIDTH - PAGE.PADDING * 2,
            codeBlockHeight,
            12
        );
        this.ctx.fill();

        // Code block border
        this.ctx.strokeStyle = COLORS.BORDER_MEDIUM;
        this.ctx.lineWidth = 1;
        this.roundRect(
            PAGE.PADDING,
            codeBlockTop,
            PAGE.WIDTH - PAGE.PADDING * 2,
            codeBlockHeight,
            12
        );
        this.ctx.stroke();

        // Render commands
        yOffset = codeBlockTop + COMMANDS_LAYOUT.CODE_BLOCK_PADDING;
        const commands = metadata.commandsBlock || 'No commands available';
        const lines = commands.split('\n');

        const maxY = codeBlockTop + codeBlockHeight - COMMANDS_LAYOUT.CODE_BLOCK_PADDING;

        for (const line of lines) {
            if (yOffset > maxY - COMMANDS_LAYOUT.CODE_LINE_HEIGHT) {
                // Would overflow - stop rendering
                this.ctx.fillStyle = COLORS.TEXT_MUTED;
                this.ctx.font = `italic 12px ${FONTS.SANS}`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText('(continued on next page...)', PAGE.WIDTH / 2, yOffset);
                break;
            }

            this.renderCodeLine(line, PAGE.PADDING + COMMANDS_LAYOUT.CODE_BLOCK_PADDING, yOffset);
            yOffset += COMMANDS_LAYOUT.CODE_LINE_HEIGHT;
        }

        // Detection notes section (if space and available)
        if (metadata.detectionNotes.length > 0 && yOffset < PAGE.HEIGHT - 200) {
            this.renderDetectionNotes(metadata.detectionNotes, PAGE.HEIGHT - 140);
        }

        // Footer
        this.renderFooter();

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
     * Render a single line of code with syntax highlighting
     */
    private renderCodeLine(line: string, x: number, y: number): void {
        this.ctx.font = `400 ${COMMANDS_LAYOUT.CODE_FONT_SIZE}px ${FONTS.MONO}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        // Detect line type and apply appropriate coloring
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('#')) {
            // Comment - slate gray italic
            this.ctx.fillStyle = '#64748b';
            this.ctx.font = `italic ${COMMANDS_LAYOUT.CODE_FONT_SIZE}px ${FONTS.MONO}`;
            this.ctx.fillText(line, x, y);
        } else if (trimmedLine.startsWith('$')) {
            // Command prompt - render with coloring
            this.renderHighlightedCommand(line, x, y);
        } else if (trimmedLine.length === 0) {
            // Empty line - skip
        } else {
            // Regular text - light gray
            this.ctx.fillStyle = '#cbd5e1';
            this.ctx.fillText(line, x, y);
        }
    }

    /**
     * Render a command with syntax highlighting
     */
    private renderHighlightedCommand(line: string, startX: number, y: number): void {
        let x = startX;

        // Split into tokens (simplified tokenization)
        const tokens = this.tokenizeLine(line);

        for (const token of tokens) {
            this.ctx.font = `${token.bold ? 'bold' : '400'} ${COMMANDS_LAYOUT.CODE_FONT_SIZE}px ${FONTS.MONO}`;
            this.ctx.fillStyle = token.color;
            this.ctx.fillText(token.text, x, y);
            x += this.ctx.measureText(token.text).width;
        }
    }

    /**
     * Simple tokenizer for command highlighting
     */
    private tokenizeLine(line: string): Array<{ text: string; color: string; bold?: boolean }> {
        const tokens: Array<{ text: string; color: string; bold?: boolean }> = [];

        // Common tools to highlight in red
        const tools = /\b(nmap|hashcat|john|impacket|mimikatz|crackmapexec|cme|netexec|evil-winrm|bloodhound|rubeus|GetUserSPNs\.py|secretsdump\.py|psexec\.py|wmiexec\.py)\b/gi;

        // Flags pattern
        const flagPattern = /(\s-{1,2}[\w-]+)/g;

        // Process line character by character with simple state machine
        let remaining = line;
        let match;

        // First, handle the $ prompt
        if (remaining.startsWith('$')) {
            tokens.push({ text: '$ ', color: '#64748b' });
            remaining = remaining.substring(2);
        }

        // Process remaining text
        let lastIndex = 0;
        const allMatches: Array<{ start: number; end: number; text: string; color: string; bold?: boolean }> = [];

        // Find all tool matches
        while ((match = tools.exec(remaining)) !== null) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0],
                color: '#f87171',
                bold: true
            });
        }

        // Find all flag matches
        tools.lastIndex = 0;
        while ((match = flagPattern.exec(remaining)) !== null) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0],
                color: '#22d3ee'
            });
        }

        // Sort by start position
        allMatches.sort((a, b) => a.start - b.start);

        // Build tokens
        let pos = 0;
        for (const m of allMatches) {
            if (m.start > pos) {
                // Add text before match
                tokens.push({ text: remaining.substring(pos, m.start), color: '#4ade80' });
            }
            if (m.start >= pos) {
                tokens.push({ text: m.text, color: m.color, bold: m.bold });
                pos = m.end;
            }
        }

        // Add remaining text
        if (pos < remaining.length) {
            tokens.push({ text: remaining.substring(pos), color: '#4ade80' });
        }

        return tokens;
    }

    /**
     * Render detection notes at bottom
     */
    private renderDetectionNotes(notes: string[], startY: number): void {
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillRect(PAGE.PADDING, startY, 4, 20);

        this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
        this.ctx.font = `600 12px ${FONTS.SANS}`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText('DETECTION NOTES', PAGE.PADDING + 12, startY + 4);

        this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
        this.ctx.font = `400 11px ${FONTS.SANS}`;

        const maxNotes = 2;
        notes.slice(0, maxNotes).forEach((note, idx) => {
            const y = startY + 24 + idx * 18;
            const truncatedNote = this.truncateText(note, PAGE.WIDTH - PAGE.PADDING * 2 - 30);
            this.ctx.fillText(`• ${truncatedNote}`, PAGE.PADDING + 12, y);
        });
    }

    /**
     * Render footer
     */
    private renderFooter(): void {
        this.ctx.fillStyle = COLORS.TEXT_MUTED;
        this.ctx.font = `400 12px ${FONTS.SANS}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Copy-paste ready commands • Generated by AttackViewer Cyto',
            PAGE.WIDTH / 2,
            PAGE.HEIGHT - 40
        );
    }

    /**
     * Truncate text with ellipsis
     */
    private truncateText(text: string, maxWidth: number): string {
        let truncated = text;
        let metrics = this.ctx.measureText(truncated);

        while (metrics.width > maxWidth && truncated.length > 3) {
            truncated = truncated.slice(0, -4) + '...';
            metrics = this.ctx.measureText(truncated);
        }

        return truncated;
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
