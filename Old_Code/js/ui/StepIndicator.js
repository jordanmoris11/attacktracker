/* =============================================================================
   STEP INDICATOR
   Visual step progress component
   ============================================================================= */

/**
 * Step Indicator Component
 *
 * Displays animation progress as clickable dots with a
 * current step label.
 */
export class StepIndicator {
  #container = null;
  #totalSteps = 0;
  #activeIndex = -1;
  #clickHandler = null;
  #dots = [];

  /**
   * Create step indicator
   * @param {HTMLElement} container - Parent element
   * @param {number} totalSteps - Number of steps
   */
  constructor(container, totalSteps) {
    this.#container = container;
    this.#totalSteps = totalSteps;
    this.#render();
  }

  // ─────────────────────────────────────────────────────────────
  // RENDERING
  // ─────────────────────────────────────────────────────────────

  /**
   * Render the component
   */
  #render() {
    this.#container.innerHTML = `
      <div class="step-indicator">
        <div class="step-indicator__dots"></div>
        <div class="step-indicator__label">
          <span class="step-indicator__current">0</span>
          <span class="step-indicator__separator">/</span>
          <span class="step-indicator__total">${this.#totalSteps}</span>
        </div>
      </div>
    `;

    const dotsContainer = this.#container.querySelector('.step-indicator__dots');

    // Create dots
    for (let i = 0; i < this.#totalSteps; i++) {
      const dot = document.createElement('button');
      dot.className = 'step-indicator__dot';
      dot.setAttribute('data-index', i);
      dot.setAttribute('aria-label', `Go to step ${i + 1}`);
      dot.setAttribute('title', `Step ${i + 1}`);
      dot.type = 'button';

      dot.addEventListener('click', () => {
        this.#clickHandler?.(i);
      });

      dotsContainer.appendChild(dot);
      this.#dots.push(dot);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Set active step
   * @param {number} index
   */
  setActive(index) {
    this.#activeIndex = index;

    // Update dots
    this.#dots.forEach((dot, i) => {
      dot.classList.toggle('step-indicator__dot--completed', i <= index);
      dot.classList.toggle('step-indicator__dot--active', i === index);
    });

    // Update label
    const currentLabel = this.#container.querySelector('.step-indicator__current');
    if (currentLabel) {
      currentLabel.textContent = Math.max(0, index + 1);
    }
  }

  /**
   * Register click handler
   * @param {Function} handler - (index) => void
   */
  onClick(handler) {
    this.#clickHandler = handler;
  }

  /**
   * Update total steps (rebuild if needed)
   * @param {number} total
   */
  setTotalSteps(total) {
    if (total !== this.#totalSteps) {
      this.#totalSteps = total;
      this.#dots = [];
      this.#render();
    }
  }

  /**
   * Get current active index
   * @returns {number}
   */
  getActiveIndex() {
    return this.#activeIndex;
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  /**
   * Destroy component
   */
  destroy() {
    this.#dots = [];
    this.#clickHandler = null;
    this.#container.innerHTML = '';
  }
}
