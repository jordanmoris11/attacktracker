/* =============================================================================
   ICON LOADER
   Async SVG icon loading with caching
   ============================================================================= */

import { ICON_REGISTRY, ICON_ALIASES } from '../config/icons.registry.js';
import { PATHS } from '../config/constants.js';

/**
 * Icon loader with caching and deduplication
 *
 * Features:
 * - Load SVG icons from external files
 * - In-memory caching to prevent duplicate requests
 * - Pending request deduplication
 * - Graceful fallback to default icon
 */
class IconLoaderClass {
  #cache = new Map();      // icon type -> SVG content
  #pending = new Map();    // icon type -> Promise
  #basePath = PATHS.icons;

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  /**
   * Load a single icon by type
   * @param {string} type - Icon type (e.g., 'kali', 'windows')
   * @returns {Promise<string>} SVG content
   */
  async load(type) {
    // Resolve alias
    const resolvedType = ICON_ALIASES[type] || type;

    // Check cache first
    if (this.#cache.has(resolvedType)) {
      return this.#cache.get(resolvedType);
    }

    // Check if already loading (deduplication)
    if (this.#pending.has(resolvedType)) {
      return this.#pending.get(resolvedType);
    }

    // Start loading
    const promise = this.#fetchIcon(resolvedType);
    this.#pending.set(resolvedType, promise);

    try {
      const content = await promise;
      this.#cache.set(resolvedType, content);
      return content;
    } finally {
      this.#pending.delete(resolvedType);
    }
  }

  /**
   * Preload multiple icons in parallel
   * @param {string[]} types - Array of icon types
   * @returns {Promise<void>}
   */
  async preload(types) {
    const uniqueTypes = [...new Set(types)];
    await Promise.all(uniqueTypes.map(type => this.load(type)));
  }

  /**
   * Preload icons based on mermaid code content
   * Analyzes code to determine which icons will be needed
   * @param {string} code - Mermaid diagram code
   * @returns {Promise<void>}
   */
  async preloadFromCode(code) {
    const { iconDetector } = await import('./IconDetector.js');
    const iconTypes = new Set(['default']);

    // Parse code to find potential nodes
    const lines = code.split('\n');
    for (const line of lines) {
      // Match node definitions: id["label"]
      const nodeMatch = line.match(/(\w+)\s*\[/);
      if (nodeMatch) {
        const nodeId = nodeMatch[1];
        const labelMatch = line.match(/\["([^"]+)"\]/);
        const label = labelMatch ? labelMatch[1] : '';
        const iconType = iconDetector.detect(nodeId, label);
        iconTypes.add(iconType);
      }

      // Match participant definitions for sequence diagrams
      const participantMatch = line.match(/participant\s+(\w+)(?:\s+as\s+(.+))?/i);
      if (participantMatch) {
        const id = participantMatch[1];
        const label = participantMatch[2] || id;
        const iconType = iconDetector.detect(id, label);
        iconTypes.add(iconType);
      }
    }

    await this.preload([...iconTypes]);
    console.log(`[IconLoader] Preloaded ${iconTypes.size} icons:`, [...iconTypes]);
  }

  /**
   * Get icon metadata without loading SVG
   * @param {string} type - Icon type
   * @returns {Object} Icon metadata (file, color, category, etc.)
   */
  getMetadata(type) {
    const resolvedType = ICON_ALIASES[type] || type;
    return ICON_REGISTRY[resolvedType] || ICON_REGISTRY.default;
  }

  /**
   * Check if icon is already cached
   * @param {string} type - Icon type
   * @returns {boolean}
   */
  isCached(type) {
    const resolvedType = ICON_ALIASES[type] || type;
    return this.#cache.has(resolvedType);
  }

  /**
   * Get all cached icon types
   * @returns {string[]}
   */
  getCachedTypes() {
    return [...this.#cache.keys()];
  }

  /**
   * Clear icon cache (for memory management)
   */
  clearCache() {
    this.#cache.clear();
  }

  /**
   * Set custom base path for icons
   * @param {string} path - New base path
   */
  setBasePath(path) {
    this.#basePath = path;
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch icon SVG from server
   * @param {string} type - Icon type
   * @returns {Promise<string>} SVG content
   */
  async #fetchIcon(type) {
    const meta = ICON_REGISTRY[type] || ICON_REGISTRY.default;
    // Add timestamp to prevent caching of SVG files
    const url = `${this.#basePath}${meta.file}?t=${Date.now()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[IconLoader] Failed to load icon: ${type} (${response.status})`);
        // Fallback to default
        if (type !== 'default') {
          return this.load('default');
        }
        throw new Error(`Failed to load default icon`);
      }

      return await response.text();
    } catch (error) {
      console.error(`[IconLoader] Error loading icon ${type}:`, error);

      // Fallback to default
      if (type !== 'default') {
        return this.load('default');
      }

      throw error;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────

export const iconLoader = new IconLoaderClass();

/**
 * Export class for testing or creating additional instances
 */
export { IconLoaderClass };
