/* =============================================================================
   STATE STORE
   Central state management with pub/sub pattern
   ============================================================================= */

/**
 * Simple event-driven state store
 *
 * Features:
 * - Centralized application state
 * - Event-based pub/sub for state changes
 * - Immutable state updates
 * - Debug mode for logging
 */
class StateStore {
  #state = {};
  #listeners = new Map();
  #debug = false;

  constructor(initialState = {}, options = {}) {
    this.#state = { ...initialState };
    this.#debug = options.debug || false;
  }

  // ─────────────────────────────────────────────────────────────
  // STATE ACCESS
  // ─────────────────────────────────────────────────────────────

  /**
   * Get entire state (read-only copy)
   * @returns {Object} State copy
   */
  getState() {
    return { ...this.#state };
  }

  /**
   * Get specific state value by path
   * @param {string} path - Dot-notation path (e.g., 'animation.currentStep')
   * @returns {*} Value at path
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.#state);
  }

  /**
   * Set state value at path
   * @param {string} path - Dot-notation path
   * @param {*} value - New value
   */
  set(path, value) {
    const keys = path.split('.');
    const newState = { ...this.#state };
    let current = newState;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    this.#state = newState;

    if (this.#debug) {
      console.log(`[Store] set ${path}:`, value);
    }

    this.emit(`state:${path}`, { path, value, state: this.getState() });
  }

  /**
   * Update multiple state values at once
   * @param {Object} updates - Object with path: value pairs
   */
  update(updates) {
    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EVENT SYSTEM
  // ─────────────────────────────────────────────────────────────

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }

    this.#listeners.get(event).add(callback);

    if (this.#debug) {
      console.log(`[Store] subscribed to: ${event}`);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event for one-time execution
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler to remove
   */
  off(event, callback) {
    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.delete(callback);

      if (this.#debug) {
        console.log(`[Store] unsubscribed from: ${event}`);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data = {}) {
    const listeners = this.#listeners.get(event);

    if (this.#debug) {
      console.log(`[Store] emit: ${event}`, data);
    }

    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Store] Error in listener for ${event}:`, error);
        }
      }
    }

    // Also emit to wildcard listeners
    const wildcardListeners = this.#listeners.get('*');
    if (wildcardListeners) {
      for (const callback of wildcardListeners) {
        try {
          callback({ event, data });
        } catch (error) {
          console.error(`[Store] Error in wildcard listener:`, error);
        }
      }
    }
  }

  /**
   * Remove all listeners for an event (or all events)
   * @param {string} [event] - Event name (optional, removes all if not provided)
   */
  removeAllListeners(event) {
    if (event) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Reset state to initial values
   * @param {Object} initialState - New initial state
   */
  reset(initialState = {}) {
    this.#state = { ...initialState };
    this.emit('state:reset', { state: this.getState() });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.#debug = enabled;
  }

  /**
   * Get count of listeners for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    return this.#listeners.get(event)?.size || 0;
  }
}

// ─────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────

/**
 * Default initial state for the application
 */
const INITIAL_STATE = {
  // Diagram state
  diagram: {
    sourceCode: '',
    parsed: null,
    svg: null,
    type: null,
  },

  // Animation state
  animation: {
    timeline: null,
    currentStep: -1,
    state: 'idle',
    playbackSpeed: 1,
  },

  // UI state
  ui: {
    isLoading: true,
    error: null,
  },

  // System state
  system: {
    iconsLoaded: false,
  },
};

/**
 * Global store instance
 */
export const Store = new StateStore(INITIAL_STATE, {
  debug: false,  // Set to true for development debugging
});

/**
 * Export class for testing or creating additional instances
 */
export { StateStore };
