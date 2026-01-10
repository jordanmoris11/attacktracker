/* =============================================================================
   ICON REGISTRY
   Icon metadata definitions (file paths, colors, detection keywords)
   ============================================================================= */

/**
 * Icon registry - metadata for each icon type
 *
 * Properties:
 * - file: SVG filename in assets/icons/
 * - color: Primary color (hex) for theming
 * - category: Grouping for organization
 * - priority: Detection priority ('high' > 'medium' > 'low')
 * - keywords: Trigger words for auto-detection (lowercase)
 */
export const ICON_REGISTRY = {
  // ─────────────────────────────────────────────────────────────
  // HIGH PRIORITY - Operating Systems (checked first)
  // ─────────────────────────────────────────────────────────────

  kali: {
    file: 'kali.svg',
    color: '#2B79C2',
    category: 'os',
    priority: 'high',
    keywords: ['kali', 'kali linux'],
  },

  winserver: {
    file: 'winserver.svg',
    color: '#00ADEF',
    category: 'os',
    priority: 'high',
    keywords: ['windows server', 'winserver', 'win srv', 'windows 2019', 'windows 2016', 'windows 2022', 'win2019', 'win2016', 'win2022'],
  },

  windows: {
    file: 'windows.svg',
    color: '#00ADEF',
    category: 'os',
    priority: 'high',
    keywords: ['windows', 'win10', 'win11', 'win 10', 'win 11'],
  },

  dc: {
    file: 'dc.svg',
    color: '#00A4EF',
    category: 'infrastructure',
    priority: 'high',
    keywords: ['domain controller', 'domaincontroller', 'active directory', ' dc ', '_dc', '_dc"', '-dc-'],
  },

  linux: {
    file: 'linux.svg',
    color: '#FCC624',
    category: 'os',
    priority: 'high',
    keywords: ['linux', 'ubuntu', 'debian', 'centos', 'redhat', 'fedora', 'rhel'],
  },

  // ─────────────────────────────────────────────────────────────
  // MEDIUM PRIORITY - Roles & Infrastructure
  // ─────────────────────────────────────────────────────────────

  attacker: {
    file: 'attacker.svg',
    color: '#EF4444',
    category: 'actor',
    priority: 'medium',
    keywords: ['attacker', 'threat actor', 'adversary', 'hacker', 'apt', 'threat'],
  },

  victim: {
    file: 'victim.svg',
    color: '#4D6FBB',
    category: 'actor',
    priority: 'medium',
    keywords: ['victim', 'target', 'employee', 'client', 'end user', 'target user'],
  },

  db: {
    file: 'db.svg',
    color: '#EAB308',
    category: 'data',
    priority: 'medium',
    keywords: ['database', 'sql', 'mysql', 'postgres', 'oracle', 'mongodb', ' db', 'mssql', 'mariadb'],
  },

  firewall: {
    file: 'firewall.svg',
    color: '#EF4444',
    category: 'security',
    priority: 'medium',
    keywords: ['firewall', 'waf', 'pfsense', 'fortinet', 'palo alto', 'checkpoint'],
  },

  router: {
    file: 'router.svg',
    color: '#06B6D4',
    category: 'infrastructure',
    priority: 'medium',
    keywords: ['router', 'gateway', 'switch', 'cisco'],
  },

  c2: {
    file: 'c2.svg',
    color: '#A855F7',
    category: 'security',
    priority: 'medium',
    keywords: ['c2', 'c&c', 'command control', 'cobalt', 'beacon', 'metasploit', 'empire'],
  },

  mail: {
    file: 'mail.svg',
    color: '#F97316',
    category: 'infrastructure',
    priority: 'medium',
    keywords: ['mail', 'email', 'exchange', 'smtp', 'outlook', 'o365 mail'],
  },

  web: {
    file: 'web.svg',
    color: '#22C55E',
    category: 'infrastructure',
    priority: 'medium',
    keywords: ['web server', 'apache', 'nginx', 'iis', 'http', 'webserver'],
  },

  vpn: {
    file: 'vpn.svg',
    color: '#8B5CF6',
    category: 'security',
    priority: 'medium',
    keywords: ['vpn', 'openvpn', 'wireguard'],
  },

  malware: {
    file: 'malware.svg',
    color: '#EF4444',
    category: 'security',
    priority: 'medium',
    keywords: ['malware', 'ransomware', 'trojan', 'virus', 'payload', 'backdoor'],
  },

  creds: {
    file: 'creds.svg',
    color: '#EAB308',
    category: 'data',
    priority: 'medium',
    keywords: ['credentials', 'creds', 'password', 'secrets', 'hash', 'ntlm', 'kerberos', 'ticket'],
  },

  // ─────────────────────────────────────────────────────────────
  // INTERNAL ENTITY TYPES (for attack modeling)
  // ─────────────────────────────────────────────────────────────

  process: {
    file: 'process.svg',
    color: '#22c55e',
    category: 'internal',
    priority: 'high',
    keywords: ['process', 'proc_', '.exe', 'executable'],
  },

  service: {
    file: 'service.svg',
    color: '#3b82f6',
    category: 'internal',
    priority: 'high',
    keywords: ['service', 'svc_', 'daemon', 'svchost'],
  },

  memory: {
    file: 'memory.svg',
    color: '#8b5cf6',
    category: 'internal',
    priority: 'high',
    keywords: ['memory', 'mem_', 'buffer', 'heap', 'stack', 'lsass memory'],
  },

  // ─────────────────────────────────────────────────────────────
  // LOW PRIORITY - Generic types
  // ─────────────────────────────────────────────────────────────

  server: {
    file: 'server.svg',
    color: '#3B82F6',
    category: 'infrastructure',
    priority: 'low',
    keywords: ['server', ' srv', 'host'],
  },

  cloud: {
    file: 'cloud.svg',
    color: '#06B6D4',
    category: 'infrastructure',
    priority: 'low',
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'o365', 'saas'],
  },

  user: {
    file: 'user.svg',
    color: '#64748B',
    category: 'actor',
    priority: 'low',
    keywords: ['user', 'person', 'admin', 'administrator'],
  },

  workstation: {
    file: 'workstation.svg',
    color: '#8B5CF6',
    category: 'infrastructure',
    priority: 'low',
    keywords: ['workstation', 'desktop', 'pc', 'laptop', 'endpoint'],
  },

  // Default fallback
  default: {
    file: 'default.svg',
    color: '#64748B',
    category: 'generic',
    priority: 'low',
    keywords: [],
  },
};

/**
 * Icon aliases - map alternative names to registry entries
 */
export const ICON_ALIASES = {
  ad: 'dc',
  'active directory': 'dc',
  secrets: 'creds',
  database: 'db',
  sql: 'db',
  threat: 'attacker',
  adversary: 'attacker',
  target: 'victim',
  employee: 'victim',
  beacon: 'c2',
  exchange: 'mail',
};

/**
 * Get all icon types (for preloading or UI)
 * @returns {string[]} Array of icon type names
 */
export function getAllIconTypes() {
  return Object.keys(ICON_REGISTRY);
}

/**
 * Get icons by category
 * @param {string} category - Category to filter by
 * @returns {Object} Filtered registry entries
 */
export function getIconsByCategory(category) {
  return Object.fromEntries(
    Object.entries(ICON_REGISTRY).filter(([_, meta]) => meta.category === category)
  );
}

/**
 * Get icons by priority
 * @param {string} priority - Priority level ('high', 'medium', 'low')
 * @returns {Object} Filtered registry entries
 */
export function getIconsByPriority(priority) {
  return Object.fromEntries(
    Object.entries(ICON_REGISTRY).filter(([_, meta]) => meta.priority === priority)
  );
}
