/**
 * Definition for a registered icon entry.
 */
export interface IconEntry {
    file: string;    // filename in /public/assets/icons/
    color: string;   // primary brand color (fallback or accent)
    category: 'os' | 'role' | 'device' | 'generic' | 'devtools' | 'security';
    keywords: string[]; // For auto-detection (future use)
}

/**
 * The Strict Registry of all available icons.
 * Keys = logical names used in JSON/Mermaid.
 * Values = Metadata for loading.
 */
export const ICON_REGISTRY = {
    // ═══════════════════════════════════════════════════════════════
    // ACTORS & ROLES
    // ═══════════════════════════════════════════════════════════════
    'IconKali': { file: 'kali.svg', color: '#2B79C2', category: 'os', keywords: ['kali', 'attacker'] },
    'IconAttacker': { file: 'attacker.svg', color: '#EF4444', category: 'role', keywords: ['hacker', 'threat'] },
    'IconHacker': { file: 'attacker.svg', color: '#EF4444', category: 'role', keywords: ['hacker'] }, // Alias
    'IconUser': { file: 'user.svg', color: '#64748B', category: 'role', keywords: ['client', 'victim', 'maintainer'] },

    // ═══════════════════════════════════════════════════════════════
    // OS & DEVICES
    // ═══════════════════════════════════════════════════════════════
    'IconWindows': { file: 'windows.svg', color: '#00ADEF', category: 'os', keywords: ['win10', 'server'] },
    'IconLinux': { file: 'linux.svg', color: '#FCC624', category: 'os', keywords: ['ubuntu', 'centos'] },
    'IconServer': { file: 'server.svg', color: '#3B82F6', category: 'device', keywords: ['dc', 'srv'] },
    'IconWorkstation': { file: 'workstation.svg', color: '#64748B', category: 'device', keywords: ['pc', 'laptop'] },
    'IconCloud': { file: 'cloud.svg', color: '#3B82F6', category: 'device', keywords: ['aws', 'azure', 'gcp'] },
    'IconFirewall': { file: 'firewall.svg', color: '#EF4444', category: 'device', keywords: ['fw', 'paloalto'] },
    'IconRouter': { file: 'router.svg', color: '#64748B', category: 'device', keywords: ['router', 'gateway'] },

    // ═══════════════════════════════════════════════════════════════
    // DEVELOPER TOOLS & SUPPLY CHAIN (NEW)
    // ═══════════════════════════════════════════════════════════════
    'IconGit': { file: 'git.svg', color: '#F97316', category: 'devtools', keywords: ['git', 'repo', 'clone', 'commit'] },
    'IconGitHub': { file: 'github.svg', color: '#E2E8F0', category: 'devtools', keywords: ['github', 'actions', 'repository'] },
    'IconNpm': { file: 'npm.svg', color: '#CB3837', category: 'devtools', keywords: ['npm', 'package', 'registry', 'node'] },
    'IconDocker': { file: 'docker.svg', color: '#2496ED', category: 'devtools', keywords: ['docker', 'container', 'whale'] },
    'IconPipeline': { file: 'pipeline.svg', color: '#8B5CF6', category: 'devtools', keywords: ['cicd', 'jenkins', 'actions', 'build'] },
    'IconAPI': { file: 'api.svg', color: '#22C55E', category: 'devtools', keywords: ['api', 'rest', 'endpoint'] },
    'IconBucket': { file: 'bucket.svg', color: '#14B8A6', category: 'devtools', keywords: ['s3', 'storage', 'blob', 'gcs'] },

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM COMPONENTS
    // ═══════════════════════════════════════════════════════════════
    'IconProcess': { file: 'process.svg', color: '#A855F7', category: 'generic', keywords: ['exe', 'bin', 'running'] },
    'IconTerminal': { file: 'terminal.svg', color: '#7C3AED', category: 'generic', keywords: ['cmd', 'bash', 'shell'] },
    'IconService': { file: 'service.svg', color: '#A855F7', category: 'generic', keywords: ['svc', 'daemon'] },
    'IconMemory': { file: 'memory.svg', color: '#A855F7', category: 'generic', keywords: ['ram', 'heap'] },
    'IconDatabase': { file: 'db.svg', color: '#3B82F6', category: 'generic', keywords: ['db', 'sql', 'mysql'] },
    'IconData': { file: 'db.svg', color: '#10B981', category: 'generic', keywords: ['data', 'file'] },
    'IconCode': { file: 'process.svg', color: '#F59E0B', category: 'generic', keywords: ['code', 'script'] },
    'IconFolder': { file: 'default.svg', color: '#F59E0B', category: 'generic', keywords: ['folder', 'directory'] },
    'IconEnv': { file: 'env.svg', color: '#10B981', category: 'generic', keywords: ['env', 'environment', 'variable', 'dotenv'] },

    // ═══════════════════════════════════════════════════════════════
    // SECRETS & CREDENTIALS (NEW)
    // ═══════════════════════════════════════════════════════════════
    'IconCredential': { file: 'credential.svg', color: '#F59E0B', category: 'security', keywords: ['cred', 'password'] },
    'IconKey': { file: 'key.svg', color: '#F59E0B', category: 'security', keywords: ['ssh', 'apikey', 'privatekey'] },
    'IconToken': { file: 'token.svg', color: '#06B6D4', category: 'security', keywords: ['jwt', 'oauth', 'bearer', 'session'] },
    'IconSocks': { file: 'socks.svg', color: '#F59E0B', category: 'generic', keywords: ['proxy', 'tunnel'] },

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS & EVENTS
    // ═══════════════════════════════════════════════════════════════
    'IconSearch': { file: 'terminal.svg', color: '#60A5FA', category: 'generic', keywords: ['scan', 'recon'] },
    'IconExploit': { file: 'malware.svg', color: '#EF4444', category: 'generic', keywords: ['exploit', 'attack'] },
    'IconLock': { file: 'default.svg', color: '#EF4444', category: 'generic', keywords: ['encrypt', 'lock'] },
    'IconAlert': { file: 'default.svg', color: '#F59E0B', category: 'generic', keywords: ['alert', 'warning'] },
    'IconCheck': { file: 'default.svg', color: '#10B981', category: 'generic', keywords: ['success', 'ok'] },

    // ═══════════════════════════════════════════════════════════════
    // THREATS & MALWARE
    // ═══════════════════════════════════════════════════════════════
    'IconMalware': { file: 'malware.svg', color: '#EF4444', category: 'security', keywords: ['virus', 'payload', 'trojan'] },
    'IconC2': { file: 'c2.svg', color: '#EF4444', category: 'security', keywords: ['beacon', 'callback', 'c2'] },

    // ═══════════════════════════════════════════════════════════════
    // FALLBACK
    // ═══════════════════════════════════════════════════════════════
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
