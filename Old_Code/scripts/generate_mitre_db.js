const https = require('https');
const fs = require('fs');
const path = require('path');

const URL = 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json';
const OUTPUT_JS = path.join(__dirname, '../js/config/mitre-index.js');
const OUTPUT_MD = path.join(__dirname, '../docs/mitre-reference.md');

console.log(`[MITRE] Fetching Enterprise ATT&CK data from ${URL}...`);

https.get(URL, (res) => {
    if (res.statusCode !== 200) {
        console.error(`[MITRE] Failed to fetch: HTTP ${res.statusCode}`);
        process.exit(1);
    }

    let rawData = '';
    const totalBytes = parseInt(res.headers['content-length'], 10);
    let downloadedBytes = 0;

    res.on('data', (chunk) => {
        rawData += chunk;
        downloadedBytes += chunk.length;
        if (process.stdout.isTTY) {
            const progress = Math.round((downloadedBytes / totalBytes) * 100);
            process.stdout.write(`\r[MITRE] Downloading... ${progress}%`);
        }
    });

    res.on('end', () => {
        console.log('\n[MITRE] Download complete. Parsing JSON...');
        try {
            const data = JSON.parse(rawData);
            processData(data);
        } catch (e) {
            console.error('[MITRE] JSON Parse Error:', e.message);
        }
    });

}).on('error', (e) => {
    console.error(`[MITRE] Network Error: ${e.message}`);
});

function processData(stixData) {
    console.log(`[MITRE] Processing ${stixData.objects.length} STIX objects...`);

    // Pass 1: Objects & Relationships
    const allTechniques = new Map(); // STIX_ID -> Entry
    const relationships = [];
    const categories = new Set();

    const getTCode = (ref) => (ref.find(r => r.source_name === 'mitre-attack')?.external_id);

    stixData.objects.forEach(obj => {
        // RELATIONSHIP: Store for Pass 2
        if (obj.type === 'relationship' && obj.relationship_type === 'subtechnique-of') {
            relationships.push({ childId: obj.source_ref, parentId: obj.target_ref });
            return;
        }

        // TECHNIQUE: Parse Metadata
        if (obj.type === 'attack-pattern' && !obj.revoked && !obj.x_mitre_deprecated) {
            const tCode = getTCode(obj.external_references || []);
            if (!tCode) return;

            const tactics = (obj.kill_chain_phases || [])
                .filter(p => p.kill_chain_name === 'mitre-attack')
                .map(p => p.phase_name);

            const entry = {
                id: obj.id, // STIX ID
                name: obj.name,
                tCode: tCode,
                url: obj.external_references?.find(r => r.source_name === 'mitre-attack')?.url,
                tactics: tactics,
                description: (obj.description || '').split('\n')[0],
                isSubTechnique: obj.x_mitre_is_subtechnique || false,
                subTechniques: [] // To be populated if this is a parent
            };

            allTechniques.set(obj.id, entry);

            // Collect tactics (usually from parents, but children have them too usually)
            tactics.forEach(t => categories.add(t));
        }
    });

    // Pass 2: Hierarchy (Link Children to Parents)
    relationships.forEach(rel => {
        const child = allTechniques.get(rel.childId);
        const parent = allTechniques.get(rel.parentId);

        if (child && parent) {
            // Add child metadata to parent
            parent.subTechniques.push({
                tCode: child.tCode,
                name: child.name,
                url: child.url
            });

            // Optimization: If child has no tactics listed (rare), inherit from parent
            if (child.tactics.length === 0) {
                child.tactics = [...parent.tactics];
                // And ensure active set has them
                child.tactics.forEach(t => categories.add(t));
            }
        }
    });

    // Pass 3: Final Index Construction
    // We want a FLAT INDEX for quick lookup, but rich metadata.
    const techniques = {};

    allTechniques.forEach(entry => {
        techniques[entry.tCode] = {
            name: entry.name,
            tCode: entry.tCode,
            url: entry.url,
            tactics: entry.tactics,
            description: entry.description,
            isSubTechnique: entry.isSubTechnique,
            subTechniques: entry.subTechniques.sort((a, b) => a.tCode.localeCompare(b.tCode))
        };
    });

    console.log(`[MITRE] Indexed ${Object.keys(techniques).length} techniques (Top-level & Sub).`);

    // 1. Generate JS Index
    generateJSIndex(techniques);

    // 2. Generate Markdown Reference (Grouped by Category)
    generateMarkdownRef(techniques, Array.from(categories));
}

function generateJSIndex(techniques) {
    const content = `/* 
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Source: MITRE CTI Enterprise ATT&CK (STIX)
 * Generated: ${new Date().toISOString()}
 */

export const MITRE_INDEX = ${JSON.stringify(techniques, null, 2)};
`;
    fs.writeFileSync(OUTPUT_JS, content);
    console.log(`[MITRE] Wrote JS Index to ${OUTPUT_JS}`);
}

function generateMarkdownRef(techniques, categories) {
    const chainOrder = [
        'reconnaissance', 'resource-development', 'initial-access', 'execution',
        'persistence', 'privilege-escalation', 'defense-evasion', 'credential-access',
        'discovery', 'lateral-movement', 'collection', 'command-and-control',
        'exfiltration', 'impact'
    ];

    let content = `# MITRE ATT&CK Reference\n\n_Auto-generated from Enterprise ATT&CK Matrix_\n\n`;

    chainOrder.forEach(phase => {
        if (!categories.includes(phase)) return;

        const niceName = phase.replace(/-/g, ' ').toUpperCase();
        content += `## ${niceName} ([${phase.toUpperCase()}])\n\n`;
        content += `| T-Code | Technique Name | Description |\n`;
        content += `| :--- | :--- | :--- |\n`;

        // Find techniques in this phase
        const phaseTechniques = Object.values(techniques)
            .filter(t => t.tactics.includes(phase))
            // Sort: Parents first, then by code
            .sort((a, b) => a.tCode.localeCompare(b.tCode));

        phaseTechniques.forEach(t => {
            const indent = t.isSubTechnique ? '  ↳ ' : '';
            const techName = indent + t.name;
            const cleanDesc = t.description.replace(/\|/g, '-').substring(0, 100) + '...';
            content += `| \`${t.tCode}\` | [${techName}](${t.url}) | ${cleanDesc} |\n`;
        });

        content += `\n`;
    });

    fs.writeFileSync(OUTPUT_MD, content);
    console.log(`[MITRE] Wrote Markdown Reference to ${OUTPUT_MD}`);
}
