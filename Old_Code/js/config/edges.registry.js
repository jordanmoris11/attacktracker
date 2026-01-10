/* =============================================================================
  EDGE STYLES REGISTRY
  Edge/connection styling based on MITRE ATT&CK categories
  ============================================================================= */

/**
 * Edge styles configuration
 *
 * Properties:
 * - color: Stroke color (hex)
 * - width: Stroke width (px)
 * - dash: Optional stroke-dasharray value for dashed lines
 * - keywords: Trigger words to apply this style (Priority: [TAGS] -> Keywords)
 */
import { MITRE_INDEX } from './mitre-index.js';

export const TACTIC_MAP = {
  'reconnaissance': 'discovery',
  'initial-access': 'infection',
  'persistence': 'persistence',
  'privilege-escalation': 'escalation',
  'credential-access': 'credential_access',
  'lateral-movement': 'lateral',
  'command-and-control': 'c2',
  'exfiltration': 'exfiltration',
  'impact': 'impact',
  'execution': 'execution',
  'defense-evasion': 'defense_evasion',
  'collection': 'collection',
  'resource-development': 'discovery' // Map Resource Dev to Discovery/Recon for now
};

export const EDGE_STYLES = {
  // ─────────────────────────────────────────────────────────────
  // 1. RECONNAISSANCE & DISCOVERY
  // ─────────────────────────────────────────────────────────────
  discovery: {
    color: '#06b6d4', // Cyan
    width: 2,
    dash: '2,2',
    label: 'Reconnaissance',
    mitreId: 'TA0043',
    url: 'https://attack.mitre.org/tactics/TA0043/',
    keywords: [
      '[RECON]', '[DISCOVERY]', // Explicit Tags
      'discover', 'enumerate', 'enum', 'scan', 'recon', 'survey', 'map', 'probe', 'whoami'
    ],
    tCodeMap: {
      'scan': 'T1595', // Active Scanning
      'probe': 'T1595',
      'whoami': 'T1033', // System Owner/User Discovery
      'map': 'T1046', // Network Service Discovery
      'enum': 'T1087' // Account Discovery
    },
    description: 'Reconnaissance, scanning, and enumeration',
  },

  // ─────────────────────────────────────────────────────────────
  // 2. INITIAL ACCESS (INFECTION)
  // ─────────────────────────────────────────────────────────────
  infection: {
    color: '#ef4444', // Red
    width: 3,
    dash: null,
    label: 'Initial Access',
    mitreId: 'TA0001',
    url: 'https://attack.mitre.org/tactics/TA0001/',
    keywords: [
      '[ACCESS]', '[INFECTION]', '[INITIAL]', // Explicit Tags
      'infect', 'compromise', 'exploit', 'initial access', 'phishing', 'malware', 'execute', 'payload', 'brute force'
    ],
    tCodeMap: {
      'phishing': 'T1566',
      'exploit': 'T1190', // Exploit Public-Facing Application
      'brute': 'T1110' // Brute Force
    },
    description: 'Initial compromise and exploitation',
  },

  // ─────────────────────────────────────────────────────────────
  // 3. PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  persistence: {
    color: '#8b5cf6', // Violet
    width: 2,
    dash: '4,2',
    label: 'Persistence',
    mitreId: 'TA0003',
    url: 'https://attack.mitre.org/tactics/TA0003/',
    keywords: [
      '[PERSIST]', '[PERSISTENCE]', // Explicit Tags
      'persist', 'backdoor', 'implant', 'scheduled task', 'startup', 'registry run', 'service create', 'account create'
    ],
    tCodeMap: {
      'scheduled task': 'T1053',
      'startup': 'T1547',
      'registry': 'T1547',
      'service': 'T1543',
      'account': 'T1136'
    },
    description: 'Establishing persistence (backdoors, tasks)',
  },

  // ─────────────────────────────────────────────────────────────
  // 4. PRIVILEGE ESCALATION
  // ─────────────────────────────────────────────────────────────
  escalation: {
    color: '#b91c1c', // Dark Red / Maroon
    width: 3,
    dash: null,
    label: 'Privilege Escalation',
    mitreId: 'TA0004',
    url: 'https://attack.mitre.org/tactics/TA0004/',
    keywords: [
      '[PRIVESC]', '[ESCALATION]', // Explicit Tags
      'escalat', 'privilege', 'privesc', 'getsystem', 'root', 'admin', 'elevat', 'bypass uac', 'token'
    ],
    tCodeMap: {
      'bypass uac': 'T1548.002',
      'token': 'T1134',
      'service': 'T1543'
    },
    description: 'Escalating privileges to Admin/SYSTEM',
  },

  // ─────────────────────────────────────────────────────────────
  // 5. CREDENTIAL ACCESS
  // ─────────────────────────────────────────────────────────────
  credential_access: {
    color: '#f59e0b', // Amber
    width: 2,
    dash: null,
    label: 'Credential Access',
    mitreId: 'TA0006',
    url: 'https://attack.mitre.org/tactics/TA0006/',
    keywords: [
      '[CREDS]', '[CREDENTIALS]', // Explicit Tags
      'dump', 'hash', 'mimikatz', 'kerberoast', 'lsass', 'ticket', 'brute', 'password', 'steal creds'
    ],
    tCodeMap: {
      'mimikatz': 'T1003', // OS Credential Dumping
      'lsass': 'T1003.001',
      'kerberoast': 'T1558.003',
      'brute': 'T1110',
      'ticket': 'T1558'
    },
    description: 'Stealing account names and passwords',
  },

  // ─────────────────────────────────────────────────────────────
  // 6. LATERAL MOVEMENT
  // ─────────────────────────────────────────────────────────────
  lateral: {
    color: '#eab308', // Yellow
    width: 2,
    dash: null,
    label: 'Lateral Movement',
    mitreId: 'TA0008',
    url: 'https://attack.mitre.org/tactics/TA0008/',
    keywords: [
      '[LATERAL]', '[MOVE]', // Explicit Tags
      'lateral', 'pivot', 'move', 'psexec', 'winrm', 'rdp', 'ssh', 'smb', 'wmi', 'pass-the-hash', 'remote'
    ],
    tCodeMap: {
      'psexec': 'T1570', // Lateral Tool Transfer (or T1021.002 SMB/Windows Admin Shares) - T1570 is specifically "Lateral Tool Transfer" but often used for psexec. T1021.002 is SMB/Windows Admin Shares which psexec uses.
      'smb': 'T1021.002',
      'rdp': 'T1021.001',
      'ssh': 'T1021.004',
      'winrm': 'T1021.006',
      'pass-the-hash': 'T1550.002',
      'wmi': 'T1047'
    },
    description: 'Moving laterally between systems',
  },

  // ─────────────────────────────────────────────────────────────
  // 7. COMMAND & CONTROL (C2)
  // ─────────────────────────────────────────────────────────────
  c2: {
    color: '#a855f7', // Purple
    width: 2,
    dash: '6,4',
    label: 'Command & Control',
    mitreId: 'TA0011',
    url: 'https://attack.mitre.org/tactics/TA0011/',
    keywords: [
      '[C2]', '[C&C]', // Explicit Tags
      'c2', 'beacon', 'callback', 'command', 'control', 'heartbeat', 'dns tunnel', 'http request', 'connect back'
    ],
    tCodeMap: {
      'beacon': 'T1071.001', // Web Protocols
      'dns': 'T1071.004', // DNS
      'http': 'T1071.001'
    },
    description: 'Command & Control communication',
  },

  // ─────────────────────────────────────────────────────────────
  // 8. EXFILTRATION
  // ─────────────────────────────────────────────────────────────
  exfiltration: {
    color: '#f97316', // Orange
    width: 2,
    dash: '8,4',
    label: 'Exfiltration',
    mitreId: 'TA0010',
    url: 'https://attack.mitre.org/tactics/TA0010/',
    keywords: [
      '[EXFIL]', '[EXFILTRATION]', // Explicit Tags
      'exfil', 'steal', 'extract', 'data theft', 'download', 'copy data', 'upload', 'transfer'
    ],
    tCodeMap: {
      'transfer': 'T1041', // Exfiltration Over C2 Channel
      'upload': 'T1048', // Exfiltration Over Alternative Protocol
      'cloud': 'T1537' // Transfer Data to Cloud Account
    },
    description: 'Stealing and extracting data',
  },

  // ─────────────────────────────────────────────────────────────
  // 9. IMPACT (DESTRUCTION/ENCRYPTION)
  // ─────────────────────────────────────────────────────────────
  impact: {
    color: '#db2777', // Pink/Magenta
    width: 3,
    dash: null,
    label: 'Impact',
    mitreId: 'TA0040',
    url: 'https://attack.mitre.org/tactics/TA0040/',
    keywords: [
      '[IMPACT]', '[DESTRUCTION]', // Explicit Tags
      'encrypt', 'ransom', 'wipe', 'delete', 'destroy', 'overwrite', 'shutdown'
    ],
    tCodeMap: {
      'encrypt': 'T1486', // Data Encrypted for Impact
      'wipe': 'T1485', // Data Destruction
      'shutdown': 'T1529' // System Shutdown/Reboot
    },
    description: 'Data destruction or ransomware encryption',
  },

  // ─────────────────────────────────────────────────────────────
  // 10. EXECUTION
  // ─────────────────────────────────────────────────────────────
  execution: {
    color: '#22c55e', // Green
    width: 2,
    dash: null,
    label: 'Execution',
    mitreId: 'TA0002',
    url: 'https://attack.mitre.org/tactics/TA0002/',
    keywords: [
      '[EXEC]', '[EXECUTION]', // Explicit Tags
      'exec', 'run', 'launch', 'powershell', 'cmd', 'bash', 'script', 'macro', 'binary'
    ],
    tCodeMap: {
      'powershell': 'T1059.001',
      'cmd': 'T1059.003',
      'bash': 'T1059.004',
      'script': 'T1059',
      'macro': 'T1204.002' // User Execution: Malicious File
    },
    description: 'Running malicious code',
  },

  // ─────────────────────────────────────────────────────────────
  // 11. DEFENSE EVASION
  // ─────────────────────────────────────────────────────────────
  defense_evasion: {
    color: '#9ca3af', // Gray (Stealth)
    width: 2,
    dash: '2,2',
    label: 'Defense Evasion',
    mitreId: 'TA0005',
    url: 'https://attack.mitre.org/tactics/TA0005/',
    keywords: [
      '[EVASION]', '[DEFENSE]', '[STEALTH]', // Explicit Tags
      'evade', 'bypass', 'hide', 'obfuscate', 'masquerade', 'disable', 'modify', 'cloak', 'spoof', 'clear logs'
    ],
    tCodeMap: {
      'clear logs': 'T1070', // Indicator Removal
      'masquerade': 'T1036',
      'obfuscate': 'T1027',
      'disable': 'T1562' // Impair Defenses
    },
    description: 'Avoiding detection',
  },

  // ─────────────────────────────────────────────────────────────
  // 12. COLLECTION
  // ─────────────────────────────────────────────────────────────
  collection: {
    color: '#14b8a6', // Teal
    width: 2,
    dash: null,
    label: 'Collection',
    mitreId: 'TA0009',
    url: 'https://attack.mitre.org/tactics/TA0009/',
    keywords: [
      '[COLLECT]', '[COLLECTION]', // Explicit Tags
      'collect', 'gather', 'keylog', 'screenshot', 'clipboard', 'record', 'search', 'archive', 'stage'
    ],
    tCodeMap: {
      'keylog': 'T1056.001',
      'screenshot': 'T1113',
      'clipboard': 'T1115',
      'search': 'T1119' // Automated Collection
    },
    description: 'Gathering data of interest',
  },

  // ─────────────────────────────────────────────────────────────
  // DEFAULT STYLE
  // ─────────────────────────────────────────────────────────────
  default: {
    color: '#4b5563', // Gray
    width: 2,
    dash: null,
    label: 'Standard Traffic',
    mitreId: '', // No ID for default
    url: '',
    keywords: [],
    tCodeMap: {},
    description: 'Standard network traffic',
  },
};

/**
 * Detect edge style type from label text (Legacy Wrapper)
 * @param {string} labelText - Edge label text
 * @returns {string} Style type key
 */
export function detectEdgeStyleType(labelText) {
  return detectEdgeInfo(labelText).type;
}

/**
 * Detect rich edge info from label text
 * @param {string} labelText 
 * @returns {{type: string, tCode: string|null, label: string|null}}
 */
export function detectEdgeInfo(labelText) {
  if (!labelText) return { type: 'default', tCode: null };

  const text = labelText.toUpperCase(); // Regex Check
  const textLower = labelText.toLowerCase(); // Keyword Check

  // 1. Check for specific T-Code (e.g., T1003, T1566.001)
  const tCodeMatch = text.match(/T\d{4}(\.\d{3})?/);
  if (tCodeMatch) {
    const code = tCodeMatch[0];

    // A. Check Exhaustive Index First
    if (MITRE_INDEX && MITRE_INDEX[code]) {
      const entry = MITRE_INDEX[code];
      // Find first mapped tactic
      const validTactic = (entry.tactics || []).find(t => TACTIC_MAP[t]);
      const styleType = validTactic ? TACTIC_MAP[validTactic] : 'default';

      console.log(`[EdgeRegistry] T-Code Global Match: ${code} (${entry.name}) -> ${styleType}`);
      return { type: styleType, tCode: code, label: entry.name };
    }

    console.log(`[EdgeRegistry] T-Code Detected: ${code}`);

    // Find which category owns this code
    for (const [styleType, config] of Object.entries(EDGE_STYLES)) {
      if (styleType === 'default') continue;

      // Reverse lookup in tCodeMap
      for (const [key, tCode] of Object.entries(config.tCodeMap || {})) {
        if (tCode === code) {
          console.log(`[EdgeRegistry] T-Code Mapped: ${code} -> ${styleType} (${key})`);
          return { type: styleType, tCode: code, label: key };
        }
      }
    }
  }

  // 2. Keyword Search (Fallback)
  for (const [styleType, config] of Object.entries(EDGE_STYLES)) {
    if (styleType === 'default') continue;

    for (const keyword of config.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        // Try to refine T-Code from keyword if possible
        let mappedCode = null;
        let mappedLabel = null;

        // precise check against tCodeMap keys
        for (const [key, code] of Object.entries(config.tCodeMap || {})) {
          if (textLower.includes(key.toLowerCase())) {
            mappedCode = code;
            mappedLabel = key;
            break;
          }
        }

        console.log(`[EdgeRegistry] Keyword Match: "${keyword}" -> ${styleType} [${mappedCode || 'Generic'}]`);
        return { type: styleType, tCode: mappedCode, label: mappedLabel };
      }
    }
  }

  return { type: 'default', tCode: null };
}

/**
 * Get edge style configuration by type
 * @param {string} styleType - Style type key
 * @returns {Object} Style configuration
 */
export function getEdgeStyle(styleType) {
  return EDGE_STYLES[styleType] || EDGE_STYLES.default;
}

/**
 * Get all edge style types (for legend/UI)
 * @returns {string[]} Array of style type names
 */
export function getAllEdgeStyleTypes() {
  return Object.keys(EDGE_STYLES).filter(key => key !== 'default');
}

/**
 * Get legend items for UI display
 * @returns {Array<{type: string, color: string, description: string}>}
 */
export function getEdgeLegendItems() {
  return getAllEdgeStyleTypes().map(type => ({
    type,
    color: EDGE_STYLES[type].color,
    description: EDGE_STYLES[type].description,
  }));
}

/* =============================================================================
   SEMANTIC EDGE TYPES (for internal attack modeling)
   ============================================================================= */

/**
 * Semantic edge types for internal attack modeling
 * These override tactical styling when present
 */
export const EDGE_SEMANTICS = {
  normal: {
    // Uses default MITRE tactic coloring
    priority: 0,
    mermaidSyntax: ['-->', '---'],
    description: 'Normal/legitimate action',
  },
  illegal: {
    color: '#ef4444',      // Red
    width: 3,
    dash: '8,4',
    glow: true,
    glowColor: 'rgba(239,68,68,0.4)',
    priority: 10,          // Override tactic colors
    mermaidSyntax: ['-.->','-.->', '-..->', '-..->'],
    description: 'Illegal action / Security violation',
  },
  impact: {
    color: '#f59e0b',      // Amber
    width: 4,
    dash: null,
    glow: false,
    priority: 5,
    mermaidSyntax: ['==>', '==='],
    description: 'High-impact action (credential theft, lateral movement)',
  },
};

/**
 * Detect edge semantic from raw mermaid syntax
 * @param {string} rawDefinition - Raw edge definition line
 * @returns {string} Semantic type: 'normal' | 'illegal' | 'impact'
 */
export function detectEdgeSemantic(rawDefinition) {
  // Check for illegal edge syntax: -.-> or variations
  if (/\.-+>|\.{2,}->/.test(rawDefinition)) {
    return 'illegal';
  }

  // Check for impact edge syntax: ==> or ===
  if (/={2,}>/.test(rawDefinition)) {
    return 'impact';
  }

  return 'normal';
}

/**
 * Get combined edge style (semantic + tactic)
 * @param {string} semantic - Edge semantic type
 * @param {string} tacticType - MITRE tactic type
 * @returns {Object} Combined style
 */
export function getCombinedEdgeStyle(semantic, tacticType) {
  const tacticStyle = EDGE_STYLES[tacticType] || EDGE_STYLES.default;
  const semanticStyle = EDGE_SEMANTICS[semantic];

  // Semantic overrides tactic if higher priority
  if (semanticStyle && semanticStyle.priority > 0) {
    return {
      ...tacticStyle,
      color: semanticStyle.color,
      width: semanticStyle.width,
      dash: semanticStyle.dash,
      glow: semanticStyle.glow,
      glowColor: semanticStyle.glowColor,
      semantic,
    };
  }

  return { ...tacticStyle, semantic: 'normal' };
}