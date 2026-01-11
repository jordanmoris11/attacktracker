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
    // DEVELOPER TOOLS & SUPPLY CHAIN
    // ═══════════════════════════════════════════════════════════════
    'IconGit': { file: 'git.svg', color: '#F97316', category: 'devtools', keywords: ['git', 'repo', 'clone', 'commit'] },
    'IconGitHub': { file: 'github.svg', color: '#E2E8F0', category: 'devtools', keywords: ['github', 'actions', 'repository'] },
    'IconNpm': { file: 'npm.svg', color: '#CB3837', category: 'devtools', keywords: ['npm', 'package', 'registry', 'node'] },
    'IconPackage': { file: 'package.svg', color: '#CB3837', category: 'devtools', keywords: ['pip', 'cargo', 'nuget', 'gem'] },
    'IconDocker': { file: 'docker.svg', color: '#2496ED', category: 'devtools', keywords: ['docker', 'container', 'whale'] },
    'IconKubernetes': { file: 'kubernetes.svg', color: '#326CE5', category: 'devtools', keywords: ['k8s', 'pod', 'cluster'] },
    'IconPipeline': { file: 'pipeline.svg', color: '#8B5CF6', category: 'devtools', keywords: ['cicd', 'jenkins', 'actions', 'build'] },
    'IconAPI': { file: 'api.svg', color: '#22C55E', category: 'devtools', keywords: ['api', 'rest', 'endpoint'] },
    'IconBucket': { file: 'bucket.svg', color: '#14B8A6', category: 'devtools', keywords: ['s3', 'storage', 'blob', 'gcs'] },

    // ═══════════════════════════════════════════════════════════════
    // CLOUD SERVICES (NEW)
    // ═══════════════════════════════════════════════════════════════
    'IconAWS': { file: 'aws.svg', color: '#FF9900', category: 'device', keywords: ['aws', 'amazon', 'cloud'] },
    'IconAzure': { file: 'azure.svg', color: '#007FFF', category: 'device', keywords: ['azure', 'microsoft', 'cloud'] },
    'IconGoogle': { file: 'cloud.svg', color: '#4285F4', category: 'device', keywords: ['gcp', 'google'] }, // kept existing cloud.svg as generic/gcp
    'IconLambda': { file: 'lambda.svg', color: '#FF9900', category: 'device', keywords: ['serverless', 'function', 'compute'] },
    'IconMetadata': { file: 'metadata.svg', color: '#64748B', category: 'generic', keywords: ['imds', '169.254.169.254'] },

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM INTERNALS
    // ═══════════════════════════════════════════════════════════════
    'IconProcess': { file: 'process.svg', color: '#A855F7', category: 'generic', keywords: ['exe', 'bin', 'running'] },
    'IconTerminal': { file: 'terminal.svg', color: '#7C3AED', category: 'generic', keywords: ['cmd', 'bash', 'shell'] },
    'IconService': { file: 'service.svg', color: '#A855F7', category: 'generic', keywords: ['svc', 'daemon'] },
    'IconMemory': { file: 'memory.svg', color: '#A855F7', category: 'generic', keywords: ['ram', 'heap'] },
    'IconKernel': { file: 'kernel.svg', color: '#DC2626', category: 'generic', keywords: ['kernel', 'rootkit', 'driver'] },
    'IconRegistry': { file: 'registry.svg', color: '#3B82F6', category: 'generic', keywords: ['reg', 'windows', 'persistence'] },
    'IconScheduler': { file: 'scheduler.svg', color: '#F59E0B', category: 'generic', keywords: ['cron', 'task', 'schedule'] },
    'IconDatabase': { file: 'db.svg', color: '#3B82F6', category: 'generic', keywords: ['db', 'sql', 'mysql'] },
    'IconData': { file: 'db.svg', color: '#10B981', category: 'generic', keywords: ['data', 'file'] },
    'IconCode': { file: 'code.svg', color: '#F59E0B', category: 'generic', keywords: ['code', 'script', 'source'] },
    'IconFolder': { file: 'default.svg', color: '#F59E0B', category: 'generic', keywords: ['folder', 'directory'] },
    'IconEnv': { file: 'env.svg', color: '#10B981', category: 'generic', keywords: ['env', 'environment', 'variable', 'dotenv'] },
    'IconVariable': { file: 'variable.svg', color: '#10B981', category: 'generic', keywords: ['var', 'env', 'config', 'dollar'] },
    'IconBrowser': { file: 'browser.svg', color: '#3B82F6', category: 'devtools', keywords: ['chrome', 'firefox', 'cookie', 'cache'] },

    // ═══════════════════════════════════════════════════════════════
    // SECRETS & CREDENTIALS
    // ═══════════════════════════════════════════════════════════════
    'IconCredential': { file: 'credential.svg', color: '#F59E0B', category: 'security', keywords: ['cred', 'password'] },
    'IconKey': { file: 'key.svg', color: '#F59E0B', category: 'security', keywords: ['ssh', 'apikey', 'privatekey'] },
    'IconToken': { file: 'token.svg', color: '#06B6D4', category: 'security', keywords: ['jwt', 'oauth', 'bearer', 'session'] },
    'IconCertificate': { file: 'certificate.svg', color: '#10B981', category: 'security', keywords: ['cert', 'tls', 'ssl', 'signing'] },
    'IconTicket': { file: 'ticket.svg', color: '#EAB308', category: 'security', keywords: ['kerberos', 'tgt', 'tgs'] },
    'IconHash': { file: 'hash.svg', color: '#94A3B8', category: 'security', keywords: ['ntlm', 'md5', 'sha', 'password'] },

    // ═══════════════════════════════════════════════════════════════
    // NETWORK & COMMUNICATION (NEW)
    // ═══════════════════════════════════════════════════════════════
    'IconDNS': { file: 'dns.svg', color: '#8B5CF6', category: 'generic', keywords: ['dns', 'domain', 'lookup'] },
    'IconSocks': { file: 'socks.svg', color: '#F59E0B', category: 'generic', keywords: ['proxy', 'tunnel'] },
    'IconEmail': { file: 'email.svg', color: '#3B82F6', category: 'generic', keywords: ['email', 'mail', 'phishing'] },
    'IconSlack': { file: 'slack.svg', color: '#4A154B', category: 'generic', keywords: ['slack', 'chat'] },
    'IconTeams': { file: 'teams.svg', color: '#6264A7', category: 'generic', keywords: ['teams', 'microsoft'] },
    'IconDiscord': { file: 'discord.svg', color: '#5865F2', category: 'generic', keywords: ['discord', 'c2'] },

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS & EVENTS
    // ═══════════════════════════════════════════════════════════════
    'IconSearch': { file: 'terminal.svg', color: '#60A5FA', category: 'generic', keywords: ['scan', 'recon'] },
    'IconDownload': { file: 'download.svg', color: '#10B981', category: 'generic', keywords: ['download', 'pull'] },
    'IconUpload': { file: 'upload.svg', color: '#EF4444', category: 'generic', keywords: ['upload', 'exfil', 'push'] },
    'IconInject': { file: 'inject.svg', color: '#EF4444', category: 'security', keywords: ['inject', 'process', 'dll'] },
    'IconExploit': { file: 'malware.svg', color: '#EF4444', category: 'generic', keywords: ['exploit', 'attack'] },
    'IconLock': { file: 'default.svg', color: '#EF4444', category: 'generic', keywords: ['encrypt', 'lock'] },
    'IconAlert': { file: 'alert.svg', color: '#F59E0B', category: 'generic', keywords: ['alert', 'warning', 'siem'] },
    'IconCheck': { file: 'default.svg', color: '#10B981', category: 'generic', keywords: ['success', 'ok'] },

    // ═══════════════════════════════════════════════════════════════
    // THREATS & DEFENSE
    // ═══════════════════════════════════════════════════════════════
    'IconMalware': { file: 'malware.svg', color: '#EF4444', category: 'security', keywords: ['virus', 'payload', 'trojan'] },
    'IconBackdoor': { file: 'backdoor.svg', color: '#EF4444', category: 'security', keywords: ['backdoor', 'webshell', 'shell'] },
    'IconC2': { file: 'c2.svg', color: '#EF4444', category: 'security', keywords: ['beacon', 'callback', 'c2'] },
    'IconEDR': { file: 'edr.svg', color: '#3B82F6', category: 'security', keywords: ['edr', 'av', 'defense', 'shield'] },

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
