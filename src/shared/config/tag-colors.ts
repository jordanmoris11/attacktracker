/**
 * Tag Color Configuration
 * Maps attack tags to consistent colors based on category
 */

// MITRE tactic colors (consistent with existing MITRE_INDEX)
const TACTIC_COLORS: Record<string, string> = {
    reconnaissance: '#6366f1',
    resource_development: '#818cf8',
    initial_access: '#ef4444',
    execution: '#f97316',
    persistence: '#eab308',
    privilege_escalation: '#84cc16',
    defense_evasion: '#22c55e',
    credential_access: '#14b8a6',
    discovery: '#06b6d4',
    lateral_movement: '#3b82f6',
    collection: '#8b5cf6',
    command_and_control: '#a855f7',
    exfiltration: '#d946ef',
    impact: '#f43f5e',
};

// Common offensive tool colors
const TOOL_COLORS: Record<string, string> = {
    impacket: '#8b5cf6',
    mimikatz: '#ec4899',
    crackmapexec: '#f97316',
    bloodhound: '#ef4444',
    cobalt_strike: '#dc2626',
    metasploit: '#059669',
    nmap: '#0ea5e9',
    hashcat: '#f59e0b',
    john: '#f59e0b',
    responder: '#10b981',
    rubeus: '#6366f1',
    powerview: '#3b82f6',
    sharphound: '#ef4444',
};

// Platform/environment colors
const PLATFORM_COLORS: Record<string, string> = {
    windows: '#0ea5e9',
    linux: '#facc15',
    ad: '#3b82f6',
    azure: '#0078d4',
    aws: '#ff9900',
    gcp: '#4285f4',
    macos: '#a3a3a3',
    docker: '#2496ed',
    kubernetes: '#326ce5',
};

// Protocol colors
const PROTOCOL_COLORS: Record<string, string> = {
    smb: '#06b6d4',
    ldap: '#8b5cf6',
    kerberos: '#f59e0b',
    ntlm: '#14b8a6',
    http: '#3b82f6',
    https: '#22c55e',
    dns: '#6366f1',
    ssh: '#10b981',
    rdp: '#0ea5e9',
    winrm: '#f97316',
    wmi: '#d946ef',
    dcom: '#a855f7',
};

/**
 * Get color for a tag based on its category
 */
export function getTagColor(tag: string): string {
    const normalizedTag = tag.toLowerCase().replace(/[_-]/g, '');

    // Check tactics (normalize underscores)
    for (const [tactic, color] of Object.entries(TACTIC_COLORS)) {
        const normalizedTactic = tactic.replace('_', '');
        if (normalizedTag.includes(normalizedTactic)) return color;
    }

    // Check tools
    for (const [tool, color] of Object.entries(TOOL_COLORS)) {
        if (normalizedTag.includes(tool)) return color;
    }

    // Check platforms
    for (const [platform, color] of Object.entries(PLATFORM_COLORS)) {
        if (normalizedTag === platform) return color;
    }

    // Check protocols
    for (const [protocol, color] of Object.entries(PROTOCOL_COLORS)) {
        if (normalizedTag === protocol) return color;
    }

    // Special tags
    if (normalizedTag.includes('rce')) return '#ef4444';
    if (normalizedTag.includes('lfi') || normalizedTag.includes('rfi')) return '#f97316';
    if (normalizedTag.includes('sqli') || normalizedTag.includes('injection')) return '#dc2626';
    if (normalizedTag.includes('xss')) return '#f59e0b';
    if (normalizedTag.includes('ssrf')) return '#8b5cf6';
    if (normalizedTag.includes('cve')) return '#ef4444';

    // Default slate
    return '#64748b';
}

/**
 * Get background color (20% opacity of main color)
 */
export function getTagBgColor(tag: string): string {
    return `${getTagColor(tag)}20`;
}

/**
 * Get border color (40% opacity of main color)
 */
export function getTagBorderColor(tag: string): string {
    return `${getTagColor(tag)}40`;
}
