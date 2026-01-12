/**
 * Lightweight syntax highlighting for shell/bash commands
 * Custom implementation to avoid heavy dependencies like highlight.js
 */

// Common offensive security tools to highlight
const TOOLS = [
    // Impacket
    'GetUserSPNs\\.py', 'secretsdump\\.py', 'psexec\\.py', 'wmiexec\\.py',
    'smbexec\\.py', 'atexec\\.py', 'dcomexec\\.py', 'GetNPUsers\\.py',
    'ticketer\\.py', 'getST\\.py', 'getTGT\\.py', 'lookupsid\\.py',
    'reg\\.py', 'rpcdump\\.py', 'samrdump\\.py', 'services\\.py',
    // Mimikatz
    'mimikatz', 'sekurlsa', 'kerberos', 'lsadump',
    // CrackMapExec / NetExec
    'crackmapexec', 'cme', 'netexec', 'nxc',
    // Other tools
    'nmap', 'hashcat', 'john', 'hydra', 'gobuster', 'dirb', 'nikto',
    'sqlmap', 'burp', 'msfconsole', 'msfvenom', 'metasploit',
    'bloodhound', 'sharphound', 'rubeus', 'certify', 'powerview',
    'evil-winrm', 'winrm', 'psremoting', 'kerbrute',
    'responder', 'ntlmrelayx', 'mitm6', 'petitpotam',
    'ldapsearch', 'rpcclient', 'smbclient', 'enum4linux',
    'chisel', 'ligolo', 'proxychains', 'socat', 'nc', 'netcat',
    'curl', 'wget', 'python', 'python3', 'bash', 'powershell', 'pwsh',
    'certutil', 'bitsadmin', 'wmic', 'reg', 'sc', 'net',
    'grep', 'awk', 'sed', 'cat', 'tee', 'xargs',
];

// Build regex pattern for tools
const TOOLS_PATTERN = new RegExp(`\\b(${TOOLS.join('|')})\\b`, 'gi');

/**
 * Highlight shell commands with syntax coloring
 * Returns HTML string with span elements
 */
export function highlightCommands(code: string): string {
    // Escape HTML first
    let highlighted = escapeHtml(code);

    // 1. Comments (# ...) - must come first to avoid conflicts
    highlighted = highlighted.replace(
        /(^|\n)(#[^\n]*)/g,
        '$1<span class="text-slate-500 italic">$2</span>'
    );

    // 2. Tool names - red/bold
    highlighted = highlighted.replace(
        TOOLS_PATTERN,
        '<span class="text-red-400 font-semibold">$1</span>'
    );

    // 3. Flags (-x, --flag) - cyan
    highlighted = highlighted.replace(
        /(\s)(-{1,2}[a-zA-Z][\w-]*)/g,
        '$1<span class="text-cyan-400">$2</span>'
    );

    // 4. Strings ('...' or "...") - amber
    highlighted = highlighted.replace(
        /(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g,
        '<span class="text-amber-400">$1</span>'
    );

    // 5. Variables ($VAR, ${VAR}) - green
    highlighted = highlighted.replace(
        /(\$\{?[\w]+\}?)/g,
        '<span class="text-green-400">$1</span>'
    );

    // 6. IP addresses - blue
    highlighted = highlighted.replace(
        /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
        '<span class="text-blue-400">$1</span>'
    );

    // 7. Ports (:PORT) - blue
    highlighted = highlighted.replace(
        /:(\d{2,5})\b/g,
        ':<span class="text-blue-400">$1</span>'
    );

    // 8. Common keywords - purple
    highlighted = highlighted.replace(
        /\b(sudo|su|cd|ls|pwd|echo|export|source|chmod|chown|mkdir|rm|cp|mv)\b/g,
        '<span class="text-purple-400">$1</span>'
    );

    // 9. Pipes and redirects - slate
    highlighted = highlighted.replace(
        /(\||&gt;|&lt;|&amp;&amp;|;)/g,
        '<span class="text-slate-400">$1</span>'
    );

    return highlighted;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Strip highlighting and return plain text
 */
export function stripHighlighting(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}
