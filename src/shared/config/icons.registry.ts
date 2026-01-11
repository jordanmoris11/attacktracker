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
    'IconKali': { file: 'kali.svg', color: '#2B79C2', category: 'os', keywords: ['kali', 'attacker'] },
    'IconAttacker': { file: 'attacker.svg', color: '#EF4444', category: 'role', keywords: ['hacker'] },
    'IconUser': { file: 'user.svg', color: '#64748B', category: 'role', keywords: ['client', 'victim'] },

    // OS / Devices
    'IconWindows': { file: 'windows.svg', color: '#00ADEF', category: 'os', keywords: ['win10', 'server'] },
    'IconServer': { file: 'server.svg', color: '#3B82F6', category: 'device', keywords: ['dc', 'srv'] },
    'IconLinux': { file: 'linux.svg', color: '#FCC624', category: 'os', keywords: ['ubuntu', 'centos'] },
    'IconCloud': { file: 'cloud.svg', color: '#3B82F6', category: 'device', keywords: ['aws', 'azure'] },
    'IconWorkstation': { file: 'workstation.svg', color: '#64748B', category: 'device', keywords: ['pc', 'laptop'] },
    'IconFirewall': { file: 'firewall.svg', color: '#EF4444', category: 'device', keywords: ['fw', 'paloalto'] },
    'IconRouter': { file: 'router.svg', color: '#64748B', category: 'device', keywords: ['router'] },

    // Entities
    'IconProcess': { file: 'process.svg', color: '#A855F7', category: 'generic', keywords: ['exe', 'bin'] },
    'IconTerminal': { file: 'terminal.svg', color: '#7C3AED', category: 'generic', keywords: ['cmd', 'bash', 'nmap'] },
    'IconService': { file: 'service.svg', color: '#A855F7', category: 'generic', keywords: ['svc', 'daemon'] },
    'IconSocks': { file: 'socks.svg', color: '#F59E0B', category: 'generic', keywords: ['proxy', 'tunnel'] },
    'IconMemory': { file: 'memory.svg', color: '#A855F7', category: 'generic', keywords: ['ram', 'heap'] },
    'IconCredential': { file: 'credential.svg', color: '#F59E0B', category: 'generic', keywords: ['key', 'hash', 'ticket'] },
    'IconData': { file: 'db.svg', color: '#10B981', category: 'generic', keywords: ['db', 'sql'] },
    'IconDatabase': { file: 'db.svg', color: '#3B82F6', category: 'generic', keywords: ['db', 'sql'] },
    'IconAPI': { file: 'cloud.svg', color: '#10B981', category: 'generic', keywords: ['api'] },
    'IconCode': { file: 'process.svg', color: '#F59E0B', category: 'generic', keywords: ['code'] },
    'IconFolder': { file: 'default.svg', color: '#F59E0B', category: 'generic', keywords: ['folder'] },

    // Actions & Events (Mapped to best available)
    'IconSearch': { file: 'terminal.svg', color: '#60A5FA', category: 'generic', keywords: ['scan'] },
    'IconExploit': { file: 'malware.svg', color: '#EF4444', category: 'generic', keywords: ['exploit'] },
    'IconLock': { file: 'default.svg', color: '#EF4444', category: 'generic', keywords: ['encrypt'] },
    'IconAlert': { file: 'default.svg', color: '#F59E0B', category: 'generic', keywords: ['alert'] },
    'IconCheck': { file: 'default.svg', color: '#10B981', category: 'generic', keywords: ['success'] },

    // Threats
    'IconHacker': { file: 'attacker.svg', color: '#EF4444', category: 'role', keywords: ['hacker'] }, // Alias for IconAttacker
    'IconMalware': { file: 'malware.svg', color: '#EF4444', category: 'generic', keywords: ['virus', 'payload'] },
    'IconC2': { file: 'c2.svg', color: '#EF4444', category: 'generic', keywords: ['beacon'] },

    // Fallback
    'IconDefault': { file: 'default.svg', color: '#94A3B8', category: 'generic', keywords: [] }
} as const;

export type IconKey = keyof typeof ICON_REGISTRY;

/**
 * Resolve the public URL for an icon.
 */
export function getIconPath(key: string | undefined): string {
    const iconKey = (key || 'IconDefault');
    // @ts-ignore
    const entry = ICON_REGISTRY[iconKey] || ICON_REGISTRY['IconDefault'];
    return `/assets/icons/${entry.file}`;
}
