
import fs from 'fs';
import path from 'path';
import { AttackGraphSchema } from '../shared/schemas/graph.schema';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../public/data');

const files = ['case1.json', 'case2.json', 'case3.json', 'case4.json'];

console.log(`Validating ${files.length} files in ${DATA_DIR}...`);

let successCount = 0;

for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
        console.error(`[MISSING] ${file}`);
        continue;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);
        const result = AttackGraphSchema.safeParse(json);

        if (result.success) {
            console.log(`[PASS] ${file}`);
            successCount++;
        } else {
            console.error(`[FAIL] ${file}`);
            if (result.error && Array.isArray(result.error.errors)) {
                result.error.errors.forEach(e => {
                    console.error(`  - Path: ${e.path.join('.')}, Error: ${e.message}`);
                });
            } else {
                console.error('Unknown Zod Error Structure:', JSON.stringify(result, null, 2));
            }
        }
    } catch (e) {
        console.error(`[ERROR] ${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
}

console.log(`\nSummary: ${successCount}/${files.length} passed.`);
if (successCount < files.length) {
    process.exit(1);
}
