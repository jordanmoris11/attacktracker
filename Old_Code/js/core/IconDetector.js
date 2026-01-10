/* =============================================================================
   ICON DETECTOR
   Priority-based keyword matching for icon type detection
   ============================================================================= */

import { ICON_REGISTRY, ICON_ALIASES } from '../config/icons.registry.js';

/**
 * Icon detector using priority-based keyword matching
 *
 * Detection Priority:
 * 1. HIGH - OS/Platform keywords (kali, windows, linux, dc)
 * 2. MEDIUM - Node ID prefix (e.g., attacker_1 → attacker)
 * 3. LOW - Generic keywords (server, user, etc.)
 * 4. DEFAULT - Fallback to 'default' icon
 */
class IconDetectorClass {
  #highPriority = [];
  #mediumPriority = [];
  #lowPriority = [];

  constructor() {
    this.#buildPriorityGroups();
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  /**
   * Detect icon type from node data
   * @param {string} nodeId - Node identifier (e.g., "victim_ws")
   * @param {string} labelText - Node label text (e.g., "Victim Workstation<br>Windows")
   * @returns {string} Icon type (e.g., "windows")
   */
  detect(nodeId, labelText = '') {
    // Normalize: combine ID and label, convert to lowercase
    const combined = `${nodeId} ${this.#stripHtml(labelText)}`.toLowerCase();

    // 1. HIGH PRIORITY: OS/Platform keywords
    for (const entry of this.#highPriority) {
      for (const keyword of entry.keywords) {
        if (combined.includes(keyword)) {
          return entry.type;
        }
      }
    }

    // 2. MEDIUM PRIORITY: Node ID prefix
    // Extract prefix from patterns like: flowchart-attacker_1-123 or attacker_machine
    const prefixMatch = nodeId.match(/^(?:flowchart-)?(\w+?)[-_]/i);
    if (prefixMatch) {
      const prefix = prefixMatch[1].toLowerCase();
      const resolved = ICON_ALIASES[prefix] || prefix;
      if (ICON_REGISTRY[resolved]) {
        return resolved;
      }
    }

    // 3. MEDIUM PRIORITY: Generic keyword matching
    for (const entry of this.#mediumPriority) {
      for (const keyword of entry.keywords) {
        if (combined.includes(keyword)) {
          return entry.type;
        }
      }
    }

    // 4. LOW PRIORITY: Broader keywords
    for (const entry of this.#lowPriority) {
      for (const keyword of entry.keywords) {
        if (combined.includes(keyword)) {
          return entry.type;
        }
      }
    }

    // 5. DEFAULT
    return 'default';
  }

  /**
   * Get metadata for a detected icon type
   * @param {string} type - Icon type
   * @returns {Object} Icon metadata
   */
  getMetadata(type) {
    const resolved = ICON_ALIASES[type] || type;
    return ICON_REGISTRY[resolved] || ICON_REGISTRY.default;
  }

  /**
   * Get all available icon types
   * @returns {string[]}
   */
  getAllTypes() {
    return Object.keys(ICON_REGISTRY);
  }

  /**
   * Check if a type exists in the registry
   * @param {string} type - Icon type to check
   * @returns {boolean}
   */
  hasType(type) {
    const resolved = ICON_ALIASES[type] || type;
    return ICON_REGISTRY.hasOwnProperty(resolved);
  }

  /**
   * Get keywords that would match a specific type
   * @param {string} type - Icon type
   * @returns {string[]} Array of matching keywords
   */
  getKeywordsForType(type) {
    const meta = this.getMetadata(type);
    return meta.keywords || [];
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Build priority groups from registry
   */
  #buildPriorityGroups() {
    for (const [type, meta] of Object.entries(ICON_REGISTRY)) {
      if (type === 'default') continue;

      const entry = {
        type,
        keywords: meta.keywords || [],
      };

      switch (meta.priority) {
        case 'high':
          this.#highPriority.push(entry);
          break;
        case 'medium':
          this.#mediumPriority.push(entry);
          break;
        case 'low':
          this.#lowPriority.push(entry);
          break;
      }
    }

    // Sort each group by keyword length (longer = more specific = higher priority)
    const sortByKeywordLength = (a, b) => {
      const maxA = a.keywords.length > 0 ? Math.max(...a.keywords.map(k => k.length)) : 0;
      const maxB = b.keywords.length > 0 ? Math.max(...b.keywords.map(k => k.length)) : 0;
      return maxB - maxA;
    };

    this.#highPriority.sort(sortByKeywordLength);
    this.#mediumPriority.sort(sortByKeywordLength);
    this.#lowPriority.sort(sortByKeywordLength);
  }

  /**
   * Strip HTML tags from text
   * @param {string} text - Text with possible HTML
   * @returns {string} Plain text
   */
  #stripHtml(text) {
    return text
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
}

// ─────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────

export const iconDetector = new IconDetectorClass();

/**
 * Export class for testing or creating additional instances
 */
export { IconDetectorClass };
