/* =============================================================================
   CONTROL PANEL
   Animation playback controls
   ============================================================================= */

import { Store } from '../state/Store.js';
import { StepIndicator } from './StepIndicator.js';
import { EVENTS, KEYBOARD_SHORTCUTS } from '../config/constants.js';

/**
 * Control Panel Component
 *
 * Provides animation playback controls:
 * - Play / Pause
 * - Step forward / backward
 * - Go to start / end
 * - Speed control
 * - Step indicator
 */
export class ControlPanel {
  #container = null;
  #controller = null;
  #stepIndicator = null;
  #elements = {};
  #keyboardHandler = null;

  /**
   * Create control panel
   * @param {HTMLElement} container - Parent element
   * @param {AnimationController} controller
   */
  constructor(container, controller) {
    this.#container = container;
    this.#controller = controller;

    this.#render();
    this.#bindEvents();
    this.#subscribeToStore();
  }

  // ─────────────────────────────────────────────────────────────
  // RENDERING
  // ─────────────────────────────────────────────────────────────

  /**
   * Render the control panel
   */
  #render() {
    this.#container.innerHTML = `
      <div class="control-panel">
        <div class="control-panel__buttons">
          <button class="control-btn" data-action="first" title="Go to start (Home)" type="button">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z"/>
            </svg>
            <span class="control-btn__label">First</span>
          </button>

          <button class="control-btn" data-action="prev" title="Previous step (←)" type="button">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/>
            </svg>
            <span class="control-btn__label">Prev</span>
          </button>

          <button class="control-btn control-btn--primary" data-action="play" title="Play/Pause (Space)" type="button">
            <svg class="icon icon--play" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z"/>
            </svg>
            <svg class="icon icon--pause" viewBox="0 0 24 24" fill="currentColor" style="display:none">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            <span class="control-btn__label" data-label-play="Play" data-label-pause="Pause">Play</span>
          </button>

          <button class="control-btn" data-action="next" title="Next step (→)" type="button">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/>
            </svg>
            <span class="control-btn__label">Next</span>
          </button>

          <button class="control-btn" data-action="last" title="Go to end (End)" type="button">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z"/>
            </svg>
            <span class="control-btn__label">Last</span>
          </button>
        </div>

        <div class="control-panel__speed">
          <select class="speed-select" data-action="speed" title="Playback speed">
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>

        <div class="control-panel__indicator" id="step-indicator-container"></div>
      </div>
    `;

    // Cache element references
    this.#elements = {
      firstBtn: this.#container.querySelector('[data-action="first"]'),
      prevBtn: this.#container.querySelector('[data-action="prev"]'),
      playBtn: this.#container.querySelector('[data-action="play"]'),
      nextBtn: this.#container.querySelector('[data-action="next"]'),
      lastBtn: this.#container.querySelector('[data-action="last"]'),
      speedSelect: this.#container.querySelector('[data-action="speed"]'),
      playIcon: this.#container.querySelector('.icon--play'),
      pauseIcon: this.#container.querySelector('.icon--pause'),
      playLabel: this.#container.querySelector('[data-label-play]'),
    };

    // Initialize step indicator
    const indicatorContainer = this.#container.querySelector('#step-indicator-container');
    this.#stepIndicator = new StepIndicator(
      indicatorContainer,
      this.#controller.totalSteps
    );

    // Make container visible
    this.#container.style.display = 'block';
  }

  // ─────────────────────────────────────────────────────────────
  // EVENT BINDING
  // ─────────────────────────────────────────────────────────────

  /**
   * Bind event listeners
   */
  #bindEvents() {
    // Button clicks
    this.#container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.tagName === 'SELECT') return;

      const action = btn.dataset.action;
      this.#handleAction(action);
    });

    // Speed change
    this.#elements.speedSelect.addEventListener('change', (e) => {
      const speed = parseFloat(e.target.value);
      this.#controller.setSpeed(speed);
    });

    // Keyboard shortcuts
    this.#keyboardHandler = this.#handleKeyboard.bind(this);
    document.addEventListener('keydown', this.#keyboardHandler);

    // Step indicator click
    this.#stepIndicator.onClick((index) => {
      this.#controller.goToStep(index);
    });
  }

  /**
   * Handle button action
   * @param {string} action
   */
  #handleAction(action) {
    switch (action) {
      case 'first':
        this.#controller.goToStart();
        break;
      case 'prev':
        this.#controller.stepBackward();
        break;
      case 'play':
        this.#controller.togglePlay();
        break;
      case 'next':
        this.#controller.stepForward();
        break;
      case 'last':
        this.#controller.goToEnd();
        break;
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e
   */
  #handleKeyboard(e) {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key;

    if (KEYBOARD_SHORTCUTS.play.includes(key)) {
      e.preventDefault();
      this.#handleAction('play');
    } else if (KEYBOARD_SHORTCUTS.next.includes(key)) {
      e.preventDefault();
      this.#handleAction('next');
    } else if (KEYBOARD_SHORTCUTS.prev.includes(key)) {
      e.preventDefault();
      this.#handleAction('prev');
    } else if (KEYBOARD_SHORTCUTS.first.includes(key)) {
      e.preventDefault();
      this.#handleAction('first');
    } else if (KEYBOARD_SHORTCUTS.last.includes(key)) {
      e.preventDefault();
      this.#handleAction('last');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STATE SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────

  /**
   * Subscribe to store events
   */
  #subscribeToStore() {
    Store.on(EVENTS.ANIMATION_STATE_CHANGE, ({ state }) => {
      this.#updatePlayButton(state);
      this.#updateButtonStates();
    });

    Store.on(EVENTS.ANIMATION_STEP_CHANGE, ({ index }) => {
      this.#stepIndicator.setActive(index);
      this.#updateButtonStates();
    });
  }

  /**
   * Update play button icon and label
   * @param {string} state
   */
  #updatePlayButton(state) {
    const { playIcon, pauseIcon, playLabel } = this.#elements;
    const isPlaying = state === 'playing';

    playIcon.style.display = isPlaying ? 'none' : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';

    if (playLabel) {
      playLabel.textContent = isPlaying
        ? playLabel.dataset.labelPause
        : playLabel.dataset.labelPlay;
    }
  }

  /**
   * Update button enabled/disabled states
   */
  #updateButtonStates() {
    const { firstBtn, prevBtn, playBtn, nextBtn, lastBtn } = this.#elements;

    firstBtn.disabled = !this.#controller.canStepBackward;
    prevBtn.disabled = !this.#controller.canStepBackward;
    playBtn.disabled = this.#controller.isFinished && !this.#controller.canPlay;
    nextBtn.disabled = !this.#controller.canStepForward;
    lastBtn.disabled = !this.#controller.canStepForward;
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  /**
   * Destroy component
   */
  destroy() {
    document.removeEventListener('keydown', this.#keyboardHandler);
    this.#stepIndicator?.destroy();
    this.#container.innerHTML = '';
  }
}
