/* =============================================================================
   ANIMATION EFFECTS LIBRARY
   Visual animation effect implementations
   ============================================================================= */

/**
 * Check for reduced motion preference
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animation Effects Library
 *
 * Uses Web Animations API for smooth, cancellable animations.
 * All effects respect reduced motion preferences.
 */
export const Effects = {

  // ─────────────────────────────────────────────────────────────
  // BASIC EFFECTS
  // ─────────────────────────────────────────────────────────────

  /**
   * Fade in effect
   * @param {Element} element
   * @param {number} duration - ms
   * @returns {Animation}
   */
  fadeIn(element, duration = 400) {
    element.classList.remove('animation-hidden');
    element.classList.add('animation-visible');
    element.style.visibility = 'visible';
    element.style.opacity = '1';

    // Also ensure nested elements are visible (for Mermaid's foreignObject labels)
    const nested = element.querySelectorAll('*');
    nested.forEach(el => {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });

    if (prefersReducedMotion()) {
      return { finished: Promise.resolve() };
    }

    // Animate the element
    element.style.opacity = '0';

    const anim = element.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });

    // Set final opacity when animation completes
    anim.onfinish = () => {
      element.style.opacity = '1';
    };

    return anim;
  },

  /**
   * Fade out effect
   * @param {Element} element
   * @param {number} duration - ms
   * @returns {Animation}
   */
  fadeOut(element, duration = 400) {
    if (prefersReducedMotion()) {
      element.style.opacity = '0';
      return { finished: Promise.resolve() };
    }

    return element.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
  },

  /**
   * Fade to dimmed state
   * @param {Element} element
   * @param {number} duration - ms
   * @returns {Animation}
   */
  fadeDim(element, duration = 300) {
    if (prefersReducedMotion()) {
      element.style.opacity = '0.4';
      return { finished: Promise.resolve() };
    }

    return element.animate([
      { opacity: 1 },
      { opacity: 0.4 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
  },

  // ─────────────────────────────────────────────────────────────
  // PATH EFFECTS
  // ─────────────────────────────────────────────────────────────

  /**
   * Draw path effect (stroke animation)
   * @param {SVGPathElement} path
   * @param {number} duration - ms
   * @returns {Animation}
   */
  drawPath(path, duration = 800) {
    path.classList.remove('animation-hidden');
    path.classList.add('animation-visible');
    path.style.visibility = 'visible';
    path.style.opacity = '1';

    // Get path length
    let length;
    try {
      length = path.getTotalLength();
    } catch (e) {
      // Fallback if getTotalLength not supported
      length = 1000;
    }

    if (prefersReducedMotion()) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      return { finished: Promise.resolve() };
    }

    // Set up stroke-dasharray for drawing animation
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    return path.animate([
      { strokeDashoffset: length },
      { strokeDashoffset: 0 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
  },

  // ─────────────────────────────────────────────────────────────
  // HIGHLIGHT EFFECTS
  // ─────────────────────────────────────────────────────────────

  /**
   * Highlight effect (glow)
   * @param {Element} element
   * @param {string} color
   * @param {number} duration - ms
   * @returns {Animation}
   */
  highlight(element, color = '#fff', duration = 600) {
    if (prefersReducedMotion()) {
      return { finished: Promise.resolve() };
    }

    return element.animate([
      { filter: 'drop-shadow(0 0 0px transparent)' },
      { filter: `drop-shadow(0 0 8px ${color})` },
      { filter: 'drop-shadow(0 0 0px transparent)' }
    ], {
      duration,
      easing: 'ease-in-out'
    });
  },

  /**
   * Pulse effect (scale animation)
   * @param {Element} element
   * @param {number} duration - ms
   * @returns {Animation}
   */
  pulse(element, duration = 400) {
    if (prefersReducedMotion()) {
      return { finished: Promise.resolve() };
    }

    return element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], {
      duration,
      easing: 'ease-in-out'
    });
  },

  // ─────────────────────────────────────────────────────────────
  // COMBINED EFFECTS
  // ─────────────────────────────────────────────────────────────

  /**
   * Combined fade + draw for edges
   * @param {SVGPathElement} edge
   * @param {Element} label
   * @param {Object} options
   * @returns {Promise<void>}
   */
  async fadeInDrawPath(edge, label, options = {}) {
    const {
      edgeDuration = 800,
      labelDuration = 400,
      labelDelay = 400
    } = options;

    console.log(`[Effects] fadeInDrawPath: edge=${!!edge}, label=${!!label}`);

    if (prefersReducedMotion()) {
      // Instant show
      if (edge) {
        this.showImmediate(edge);
        edge.style.strokeDasharray = 'none';
        edge.style.strokeDashoffset = '0';
      }
      if (label) {
        this.showImmediate(label);
      }
      return;
    }

    // Start edge animation
    const edgeAnim = edge ? this.drawPath(edge, edgeDuration) : null;

    // Start label animation after delay
    const labelPromise = new Promise(resolve => {
      setTimeout(() => {
        if (label) {
          const labelAnim = this.fadeIn(label, labelDuration);
          labelAnim.finished?.then(resolve) || resolve();
        } else {
          resolve();
        }
      }, labelDelay);
    });

    // Wait for both
    await Promise.all([
      edgeAnim?.finished || Promise.resolve(),
      labelPromise
    ]);
  },

  // ─────────────────────────────────────────────────────────────
  // VISIBILITY HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Show element immediately (no animation)
   * @param {Element} element
   */
  showImmediate(element) {
    if (!element) return;

    element.classList.remove('animation-hidden');
    element.classList.add('animation-visible');
    element.style.visibility = 'visible';
    element.style.opacity = '1';

    // Reset stroke dash if path
    if (element.tagName?.toLowerCase() === 'path') {
      element.style.strokeDasharray = 'none';
      element.style.strokeDashoffset = '0';
    }

    // Also show nested elements (for Mermaid's foreignObject labels)
    const nested = element.querySelectorAll('*');
    nested.forEach(el => {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });
  },

  /**
   * Hide element immediately (no animation)
   * @param {Element} element
   */
  hideImmediate(element) {
    if (!element) return;

    element.classList.remove('animation-visible');
    element.classList.add('animation-hidden');
    element.style.visibility = 'hidden';
    element.style.opacity = '0';

    // Also hide nested elements
    const nested = element.querySelectorAll('*');
    nested.forEach(el => {
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
    });
  }
};
