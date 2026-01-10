// Spec 8: MITRE Index (Ported from Legacy)

export interface MitreTechnique {
    id: string;        // T1003
    name: string;      // OS Credential Dumping
    url: string;       // https://attack.mitre.org/techniques/T1003
    tactics: string[]; // ['credential-access']
    isSubTechnique: boolean;
}

// Full Index (Shortened for initial implementation, to be expanded via script later if needed)
export const MITRE_INDEX: Record<string, MitreTechnique> = {
    // Credential Access
    'T1003': { id: 'T1003', name: 'OS Credential Dumping', url: 'https://attack.mitre.org/techniques/T1003', tactics: ['credential-access'], isSubTechnique: false },
    'T1003.001': { id: 'T1003.001', name: 'LSASS Memory', url: 'https://attack.mitre.org/techniques/T1003/001', tactics: ['credential-access'], isSubTechnique: true },
    'T1558': { id: 'T1558', name: 'Steal or Forge Kerberos Tickets', url: 'https://attack.mitre.org/techniques/T1558', tactics: ['credential-access'], isSubTechnique: false },
    'T1110': { id: 'T1110', name: 'Brute Force', url: 'https://attack.mitre.org/techniques/T1110', tactics: ['credential-access'], isSubTechnique: false },

    // Execution
    'T1059': { id: 'T1059', name: 'Command and Scripting Interpreter', url: 'https://attack.mitre.org/techniques/T1059', tactics: ['execution'], isSubTechnique: false },
    'T1059.001': { id: 'T1059.001', name: 'PowerShell', url: 'https://attack.mitre.org/techniques/T1059/001', tactics: ['execution'], isSubTechnique: true },

    // Lateral Movement
    'T1021': { id: 'T1021', name: 'Remote Services', url: 'https://attack.mitre.org/techniques/T1021', tactics: ['lateral-movement'], isSubTechnique: false },
    'T1021.001': { id: 'T1021.001', name: 'Remote Desktop Protocol', url: 'https://attack.mitre.org/techniques/T1021/001', tactics: ['lateral-movement'], isSubTechnique: true },
    'T1021.002': { id: 'T1021.002', name: 'SMB/Windows Admin Shares', url: 'https://attack.mitre.org/techniques/T1021/002', tactics: ['lateral-movement'], isSubTechnique: true },
    'T1550': { id: 'T1550', name: 'Use Alternate Authentication Material', url: 'https://attack.mitre.org/techniques/T1550', tactics: ['defense-evasion', 'lateral-movement'], isSubTechnique: false },

    // Exfiltration
    'T1041': { id: 'T1041', name: 'Exfiltration Over C2 Channel', url: 'https://attack.mitre.org/techniques/T1041', tactics: ['exfiltration'], isSubTechnique: false },

    // Impact
    'T1486': { id: 'T1486', name: 'Data Encrypted for Impact', url: 'https://attack.mitre.org/techniques/T1486', tactics: ['impact'], isSubTechnique: false },
};

// Helper: Tactic Slug Map (Legacy -> Spec 8)
export const TACTIC_SLUGS: Record<string, string> = {
    'reconnaissance': 'Reconnaissance',
    'resource-development': 'Resource Development',
    'initial-access': 'Initial Access',
    'execution': 'Execution',
    'persistence': 'Persistence',
    'privilege-escalation': 'Privilege Escalation',
    'defense-evasion': 'Defense Evasion',
    'credential-access': 'Credential Access',
    'discovery': 'Discovery',
    'lateral-movement': 'Lateral Movement',
    'collection': 'Collection',
    'command-and-control': 'Command and Control',
    'exfiltration': 'Exfiltration',
    'impact': 'Impact'
};
