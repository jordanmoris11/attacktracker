// Spec 5: Icon Registry & Manager
// Legacy Source: Old_Code/config/icons.registry.js

/**
 * Definition for a registered icon entry.
 */
export interface IconEntry {
    file: string;    // filename in /public/assets/icons/
    color: string;   // primary brand color (fallback or accent)
    category: 'os' | 'role' | 'device' | 'generic';
    keywords: string[]; // For auto-detection (future use)
}

/**
 * The Strict Registry of all available icons.
 * Keys = logical names used in JSON/Mermaid.
 * Values = Metadata for loading.
 */
export const ICON_REGISTRY = {
    // Roles
    'kali': { file: 'kali.svg', color: '#2B79C2', category: 'os', keywords: ['kali', 'attacker'] },
    'attacker': { file: 'kali.svg', color: '#EF4444', category: 'role', keywords: ['hacker'] },
    'user': { file: 'user.svg', color: '#64748B', category: 'role', keywords: ['client', 'victim'] },

    // OS / Devices
    'windows': { file: 'windows.svg', color: '#00ADEF', category: 'os', keywords: ['win10', 'server'] },
    'server': { file: 'server.svg', color: '#3B82F6', category: 'device', keywords: ['dc', 'srv'] },
    'linux': { file: 'linux.svg', color: '#FCC624', category: 'os', keywords: ['ubuntu', 'centos'] },
    'cloud': { file: 'cloud.svg', color: '#3B82F6', category: 'device', keywords: ['aws', 'azure'] },
    'workstation': { file: 'workstation.svg', color: '#64748B', category: 'device', keywords: ['pc', 'laptop'] },
    'firewall': { file: 'firewall.svg', color: '#EF4444', category: 'device', keywords: ['fw', 'paloalto'] },

    // Entities
    'process': { file: 'process.svg', color: '#A855F7', category: 'generic', keywords: ['exe', 'bin'] },
    'service': { file: 'service.svg', color: '#A855F7', category: 'generic', keywords: ['svc', 'daemon'] },
    'memory': { file: 'memory.svg', color: '#A855F7', category: 'generic', keywords: ['ram', 'heap'] },
    'credential': { file: 'credential.svg', color: '#F59E0B', category: 'generic', keywords: ['key', 'hash', 'ticket'] },
    'data': { file: 'database.svg', color: '#10B981', category: 'generic', keywords: ['db', 'sql'] },

    // Defaults
    'default': { file: 'default.svg', color: '#94A3B8', category: 'generic', keywords: [] }
} as const;

export type IconKey = keyof typeof ICON_REGISTRY;

/**
 * Resolve the public URL for an icon.
 */
export function getIconPath(key: string | undefined): string {
    const safeKey = (key || 'default').toLowerCase();
    // Fallback to 'server' as a safe, professional default for unknown assets
    // (User requested: "fail back to something in our asset maybe server")
    // @ts-ignore - Runtime safety fallback
    const entry = ICON_REGISTRY[safeKey] || ICON_REGISTRY['server'];
    return `/assets/icons/${entry.file}`;
}
