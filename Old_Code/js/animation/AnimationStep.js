/* =============================================================================
   ANIMATION STEP
   Single animation step definition
   ============================================================================= */

/**
 * Represents a single step in the animation timeline
 *
 * Each step contains:
 * - Target elements (edge, label, nodes)
 * - Animation configuration (effect, duration, delay)
 * - Metadata for UI display
 */
export class AnimationStep {
  /**
   * Create an animation step
   * @param {Object} config - Step configuration
   */
  constructor(config) {
    this.id = config.id;
    this.sequenceNumber = config.sequenceNumber;

    // Target elements
    this.targets = {
      edge: config.targets?.edge || null,
      label: config.targets?.label || null,
      sourceNode: config.targets?.sourceNode || null,
      targetNode: config.targets?.targetNode || null,
    };

    // Animation configuration
    this.effect = config.effect || 'fadeInDrawPath';
    this.duration = config.duration || 800;
    this.delay = config.delay || 0;

    // Metadata
    this.description = config.description || '';
    this.edgeData = config.edgeData || null;

    // State
    this.isVisible = false;
    this.isAnimating = false;
  }

  // ─────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if step has valid targets
   * @returns {boolean}
   */
  get hasValidTargets() {
    return this.targets.edge !== null;
  }

  /**
   * Get display label for step
   * @returns {string}
   */
  get displayLabel() {
    if (this.description) {
      return `${this.sequenceNumber}. ${this.description}`;
    }
    return `Step ${this.sequenceNumber}`;
  }

  /**
   * Get edge style info from edge data
   * @returns {Object|null}
   */
  get styleInfo() {
    return this.edgeData ? {
      color: this.edgeData.styleType,
      hasToolReference: this.edgeData.hasToolReference,
      toolName: this.edgeData.toolName,
    } : null;
  }

  // ─────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  /**
   * Mark step as visible
   */
  show() {
    this.isVisible = true;
    this.isAnimating = false;
  }

  /**
   * Mark step as hidden
   */
  hide() {
    this.isVisible = false;
    this.isAnimating = false;
  }

  /**
   * Mark step as currently animating
   */
  startAnimation() {
    this.isAnimating = true;
  }

  /**
   * Mark animation as complete
   */
  completeAnimation() {
    this.isAnimating = false;
    this.isVisible = true;
  }

  // ─────────────────────────────────────────────────────────────
  // SERIALIZATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Convert step to plain object (for debugging/logging)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      sequenceNumber: this.sequenceNumber,
      effect: this.effect,
      duration: this.duration,
      delay: this.delay,
      description: this.description,
      isVisible: this.isVisible,
      hasTargets: this.hasValidTargets,
    };
  }
}
