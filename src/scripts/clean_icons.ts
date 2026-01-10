
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../../public/assets/icons');

console.log(`Scanning icons in: ${ICONS_DIR}`);

if (!fs.existsSync(ICONS_DIR)) {
    console.error("Directory not found!");
    process.exit(1);
}

const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));
let cleanedCount = 0;

files.forEach(file => {
    const filePath = path.join(ICONS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Heuristic: Find <rect> tags that are likely backgrounds.
    // Characteristics:
    // 1. Large width/height (approx 72-80, fitting the 80x80 viewbox)
    // 2. Often have rx (rounded corners)
    // 3. Usually the first drawing element.

    // Regex to capture self-closing rect or rect with closing tag
    // We target rects with width > 60 and height > 60 to be safe we don't delete small internal rects.

    const originalContent = content;

    // Remove <rect ... width="60+" height="60+" ... />
    // This is a simplified regex approach. For production XML parsing is safer, but for these simple SVGs regex is efficient.
    content = content.replace(/<rect[^>]*width="[6-9]\d"[^>]*height="[6-9]\d"[^>]*\/>/g, (match) => {
        console.log(`[${file}] Removing background: ${match}`);
        return '';
    });

    // Also handle non-self-closing rects if any (rare in these assets but possible)
    content = content.replace(/<rect[^>]*width="[6-9]\d"[^>]*height="[6-9]\d"[^>]*>[\s\S]*?<\/rect>/g, (match) => {
        console.log(`[${file}] Removing background (block): ${match}`);
        return '';
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        cleanedCount++;
    }
});

console.log(`\nCleanup Complete. Modified ${cleanedCount} of ${files.length} SVG files.`);
