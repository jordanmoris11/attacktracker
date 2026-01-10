/* =============================================================================
   ENTITY REGISTRY
   Entity type definitions for internal attack modeling
   ============================================================================= */

/**
 * Entity types for internal attack modeling
 * Maps node prefixes to entity metadata
 */
export const ENTITY_REGISTRY = {
  // ─────────────────────────────────────────────────────────────
  // ACTORS (Rounded shape)
  // ─────────────────────────────────────────────────────────────
  'attacker_': {
    type: 'actor',
    icon: 'attacker',
    shape: 'rounded',
    description: 'Threat actor / Attacker',
  },
  'user_': {
    type: 'actor',
    icon: 'user',
    shape: 'rounded',
    description: 'User / Employee',
  },

  // ─────────────────────────────────────────────────────────────
  // PROCESSES (Rectangle)
  // ─────────────────────────────────────────────────────────────
  'proc_': {
    type: 'process',
    icon: 'process',
    shape: 'rect',
    description: 'Executing process',
  },
  'svc_': {
    type: 'service',
    icon: 'service',
    shape: 'rect',
    description: 'System service',
  },

  // ─────────────────────────────────────────────────────────────
  // MEMORY (Cylinder)
  // ─────────────────────────────────────────────────────────────
  'mem_': {
    type: 'memory',
    icon: 'memory',
    shape: 'cylinder',
    description: 'Memory region / buffer',
  },
  'data_': {
    type: 'data',
    icon: 'db',
    shape: 'cylinder',
    description: 'Data store / files',
  },

  // ─────────────────────────────────────────────────────────────
  // CREDENTIALS (Double-brace / Hexagon)
  // ─────────────────────────────────────────────────────────────
  'cred_': {
    type: 'credential',
    icon: 'creds',
    shape: 'hexagon',
    description: 'Credential / Auth material',
  },
  'ticket_': {
    type: 'credential',
    icon: 'creds',
    shape: 'hexagon',
    description: 'Kerberos ticket',
  },
  'token_': {
    type: 'credential',
    icon: 'creds',
    shape: 'hexagon',
    description: 'Access token',
  },
};

/**
 * State annotations for entities
 */
export const ENTITY_STATES = {
  compromised: {
    cssClass: 'entity-compromised',
    color: '#ef4444',
    description: 'Entity is attacker-controlled',
  },
  elevated: {
    cssClass: 'entity-elevated',
    color: '#f59e0b',
    description: 'Running with elevated privileges',
  },
  encrypted: {
    cssClass: 'entity-encrypted',
    color: '#8b5cf6',
    description: 'Data has been encrypted',
  },
};

/**
 * Trust boundary types (for subgraphs)
 */
export const BOUNDARY_TYPES = {
  machine: {
    keywords: ['machine', 'host', 'server', 'workstation', 'vm'],
    cssClass: 'boundary-machine',
    borderColor: '#64748b',
    borderStyle: 'solid',
    borderWidth: 2,
    fill: 'rgba(100,116,139,0.05)',
  },
  kernel: {
    keywords: ['kernel', 'ring0', 'ring 0', 'os', 'system'],
    cssClass: 'boundary-kernel',
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
    borderWidth: 3,
    fill: 'rgba(139,92,246,0.05)',
  },
  protected: {
    keywords: ['protected', 'secure', 'lsa', 'lsass', 'security authority', 'trusted'],
    cssClass: 'boundary-protected',
    borderColor: '#ef4444',
    borderStyle: 'dashed',
    borderWidth: 2,
    fill: 'rgba(239,68,68,0.03)',
  },
  container: {
    keywords: ['container', 'pod', 'sandbox', 'namespace', 'docker', 'jail'],
    cssClass: 'boundary-container',
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderWidth: 2,
    fill: 'rgba(59,130,246,0.05)',
  },
  network: {
    keywords: ['network', 'segment', 'dmz', 'vlan', 'subnet', 'zone'],
    cssClass: 'boundary-network',
    borderColor: '#64748b',
    borderStyle: 'dotted',
    borderWidth: 1,
    fill: 'transparent',
  },
  default: {
    keywords: [],
    cssClass: 'boundary-default',
    borderColor: '#475569',
    borderStyle: 'dashed',
    borderWidth: 1,
    fill: 'rgba(255,255,255,0.02)',
  },
};

/**
 * Detect entity type from node ID
 * @param {string} nodeId - Node identifier
 * @returns {Object} Entity metadata
 */
export function detectEntityType(nodeId) {
  const idLower = nodeId.toLowerCase();

  for (const [prefix, meta] of Object.entries(ENTITY_REGISTRY)) {
    if (idLower.startsWith(prefix)) {
      return { ...meta, prefix };
    }
  }

  return { type: 'default', icon: null, shape: 'rect', prefix: null };
}

/**
 * Detect boundary type from subgraph label
 * @param {string} label - Subgraph label text
 * @returns {Object} Boundary metadata
 */
export function detectBoundaryType(label) {
  const labelLower = label.toLowerCase();

  for (const [type, meta] of Object.entries(BOUNDARY_TYPES)) {
    if (type === 'default') continue;

    for (const keyword of meta.keywords) {
      if (labelLower.includes(keyword)) {
        return { type, ...meta };
      }
    }
  }

  return { type: 'default', ...BOUNDARY_TYPES.default };
}

/**
 * Parse state annotation from node definition
 * @param {string} rawDefinition - Raw node definition line
 * @returns {string|null} State name or null
 */
export function parseEntityState(rawDefinition) {
  // Match :::state syntax (Mermaid class syntax)
  const classMatch = rawDefinition.match(/:::(\w+)/);
  if (classMatch && ENTITY_STATES[classMatch[1]]) {
    return classMatch[1];
  }

  // Match ::state suffix in label
  const suffixMatch = rawDefinition.match(/::(\w+)\]|::(\w+)\)/);
  if (suffixMatch) {
    const state = suffixMatch[1] || suffixMatch[2];
    if (ENTITY_STATES[state]) {
      return state;
    }
  }

  return null;
}
