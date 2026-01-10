import type { GraphEdge } from '../../shared/schemas/graph.schema';
import { MITRE_INDEX } from '../../shared/config/mitre-index';

// Heuristic Map: Keyword -> T-Code
const KEYWORD_MAP: Record<string, string> = {
    'mimikatz': 'T1003.001',
    'lsass': 'T1003.001',
    'kerberoast': 'T1558.003',
    'dcsync': 'T1003.006',
    'golden ticket': 'T1558.001',
    'silver ticket': 'T1558.001',
    'pass the hash': 'T1550.002',
    'pth': 'T1550.002',
    'rdp': 'T1021.001',
    'smb': 'T1021.002',
    'psexec': 'T1021.002',
    'winrm': 'T1021.006',
    'wmi': 'T1047',
    'powershell': 'T1059.001',
    'c2': 'T1071',
    'beacon': 'T1071',
    'exsol': 'T1041', // Exfiltration
    'encrypt': 'T1486',
    'ransom': 'T1486'
};

/**
 * Spec 8: Auto-Enrichment
 * Scans the edge label for keywords or explicit T-Codes and updates the 'mitre' field.
 */
export function enrichEdge(edge: GraphEdge): void {
    // 0. If already valid, skip
    if (edge.mitre && MITRE_INDEX[edge.mitre]) return;

    const text = (edge.label || '').toLowerCase();

    // 1. Check for Explicit T-Code in Label (e.g. "[T1003] Dump")
    const explicitMatch = text.match(/t\d{4}(\.\d{3})?/i);
    if (explicitMatch) {
        const code = explicitMatch[0].toUpperCase();
        if (MITRE_INDEX[code]) {
            edge.mitre = code;
            return;
        }
    }

    // 2. Keyword Search
    for (const [keyword, tCode] of Object.entries(KEYWORD_MAP)) {
        if (text.includes(keyword)) {
            edge.mitre = tCode;
            return; // First match wins
        }
    }
}
