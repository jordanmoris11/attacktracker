# Spec 05: UI Controls

**Status:** Draft
**Priority:** P1 (Feature)
**Dependencies:** 04-animation-system.md

---

## 1. Overview

### 1.1 Description

The UI Controls module provides interactive elements for controlling diagram animation playback. It includes:

1. **Control Panel** - Play, pause, step buttons
2. **Step Indicator** - Visual progress through animation steps
3. **Speed Control** - Playback speed adjustment
4. **Zoom/Pan** - Diagram navigation (future enhancement)

### 1.2 Goals

- Intuitive, responsive controls
- Clear visual feedback for current state
- Keyboard accessibility
- Mobile-friendly touch targets

### 1.3 Non-Goals

- Video-style scrubbing/timeline
- Complex gesture recognition
- Voice control

---

## 2. Files Involved

| File | Purpose |
|------|---------|
| `js/ui/ControlPanel.js` | Main control bar component |
| `js/ui/StepIndicator.js` | Step progress visualization |
| `js/ui/Button.js` | Reusable button component |
| `css/controls.css` | Control styling |

---

## 3. Control Panel Design

### 3.1 Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CONTROL PANEL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────┐  ┌─────┐  ┌─────────────┐  ┌─────┐  ┌─────┐    ┌──────────┐ │
│   │ ◀◀  │  │  ◀  │  │  ▶  PLAY   │  │  ▶  │  │ ▶▶  │    │ 1x ▼     │ │
│   │First│  │Prev │  │   PAUSE    │  │Next │  │Last │    │ Speed    │ │
│   └─────┘  └─────┘  └─────────────┘  └─────┘  └─────┘    └──────────┘ │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  ●────●────●────○────○────○    Step 3 of 6                      │  │
│   │         STEP INDICATOR                                          │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `≥ 768px` | Full layout with labels |
| `< 768px` | Icons only, stacked step indicator |
| `< 480px` | Essential controls only (play, prev, next) |

---

## 4. Implementation

### 4.1 Control Panel

```javascript
// js/ui/ControlPanel.js

import { Store } from '../state/Store.js';
import { StepIndicator } from './StepIndicator.js';

export class ControlPanel {
  #container = null;
  #controller = null;
  #stepIndicator = null;
  #elements = {};

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

  #render() {
    this.#container.innerHTML = `
      <div class="control-panel">
        <div class="control-panel__buttons">
          <button class="control-btn" data-action="first" title="Go to start (Home)">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 17L13 12L18 7V17ZM11 17V7L6 12L11 17Z"/>
            </svg>
            <span class="control-btn__label">First</span>
          </button>

          <button class="control-btn" data-action="prev" title="Previous step (←)">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M15 18L9 12L15 6V18Z"/>
            </svg>
            <span class="control-btn__label">Prev</span>
          </button>

          <button class="control-btn control-btn--primary" data-action="play" title="Play/Pause (Space)">
            <svg class="icon icon--play" viewBox="0 0 24 24">
              <path d="M8 5V19L19 12L8 5Z"/>
            </svg>
            <svg class="icon icon--pause" viewBox="0 0 24 24" style="display:none">
              <path d="M6 5H10V19H6V5ZM14 5H18V19H14V5Z"/>
            </svg>
            <span class="control-btn__label" data-label-play="Play" data-label-pause="Pause">Play</span>
          </button>

          <button class="control-btn" data-action="next" title="Next step (→)">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M9 18L15 12L9 6V18Z"/>
            </svg>
            <span class="control-btn__label">Next</span>
          </button>

          <button class="control-btn" data-action="last" title="Go to end (End)">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M6 17L11 12L6 7V17ZM13 7V17L18 12L13 7Z"/>
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

        <div class="control-panel__indicator" id="step-indicator"></div>
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
    const indicatorContainer = this.#container.querySelector('#step-indicator');
    this.#stepIndicator = new StepIndicator(
      indicatorContainer,
      this.#controller.totalSteps
    );
  }

  // ─────────────────────────────────────────────────────────────
  // EVENT BINDING
  // ─────────────────────────────────────────────────────────────

  #bindEvents() {
    // Button clicks
    this.#container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      this.#handleAction(action);
    });

    // Speed change
    this.#elements.speedSelect.addEventListener('change', (e) => {
      const speed = parseFloat(e.target.value);
      this.#controller.setSpeed(speed);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this.#handleKeyboard.bind(this));

    // Step indicator click
    this.#stepIndicator.onClick((index) => {
      this.#controller.goToStep(index);
    });
  }

  #handleAction(action) {
    switch (action) {
      case 'first':
        this.#controller.goToStart();
        break;
      case 'prev':
        this.#controller.stepBackward();
        break;
      case 'play':
        if (this.#controller.isPlaying) {
          this.#controller.pause();
        } else {
          this.#controller.play();
        }
        break;
      case 'next':
        this.#controller.stepForward();
        break;
      case 'last':
        this.#controller.goToEnd();
        break;
    }
  }

  #handleKeyboard(e) {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case ' ':
      case 'Space':
        e.preventDefault();
        this.#handleAction('play');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.#handleAction('prev');
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.#handleAction('next');
        break;
      case 'Home':
        e.preventDefault();
        this.#handleAction('first');
        break;
      case 'End':
        e.preventDefault();
        this.#handleAction('last');
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STATE SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────

  #subscribeToStore() {
    Store.on('animation:stateChange', ({ state }) => {
      this.#updatePlayButton(state);
      this.#updateButtonStates(state);
    });

    Store.on('animation:stepChange', ({ index }) => {
      this.#stepIndicator.setActive(index);
      this.#updateButtonStates(this.#controller.state);
    });
  }

  #updatePlayButton(state) {
    const { playIcon, pauseIcon, playLabel } = this.#elements;
    const isPlaying = state === 'playing';

    playIcon.style.display = isPlaying ? 'none' : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
    playLabel.textContent = isPlaying
      ? playLabel.dataset.labelPause
      : playLabel.dataset.labelPlay;
  }

  #updateButtonStates(state) {
    const { firstBtn, prevBtn, playBtn, nextBtn, lastBtn } = this.#elements;

    firstBtn.disabled = !this.#controller.canStepBackward;
    prevBtn.disabled = !this.#controller.canStepBackward;
    playBtn.disabled = state === 'finished' && !this.#controller.canPlay;
    nextBtn.disabled = !this.#controller.canStepForward;
    lastBtn.disabled = !this.#controller.canStepForward;
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  destroy() {
    document.removeEventListener('keydown', this.#handleKeyboard);
    this.#stepIndicator?.destroy();
    this.#container.innerHTML = '';
  }
}
```

### 4.2 Step Indicator

```javascript
// js/ui/StepIndicator.js

export class StepIndicator {
  #container = null;
  #totalSteps = 0;
  #activeIndex = -1;
  #clickHandler = null;
  #dots = [];

  constructor(container, totalSteps) {
    this.#container = container;
    this.#totalSteps = totalSteps;
    this.#render();
  }

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

      dot.addEventListener('click', () => {
        this.#clickHandler?.(i);
      });

      dotsContainer.appendChild(dot);
      this.#dots.push(dot);
    }
  }

  setActive(index) {
    this.#activeIndex = index;

    // Update dots
    this.#dots.forEach((dot, i) => {
      dot.classList.toggle('step-indicator__dot--completed', i <= index);
      dot.classList.toggle('step-indicator__dot--active', i === index);
    });

    // Update label
    const currentLabel = this.#container.querySelector('.step-indicator__current');
    currentLabel.textContent = Math.max(0, index + 1);
  }

  onClick(handler) {
    this.#clickHandler = handler;
  }

  destroy() {
    this.#dots = [];
    this.#clickHandler = null;
    this.#container.innerHTML = '';
  }
}
```

---

## 5. CSS Styles

### 5.1 Control Panel Styles

```css
/* css/controls.css */

/* ─────────────────────────────────────────────────────────────
   CONTROL PANEL
   ───────────────────────────────────────────────────────────── */

.control-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #12121a;
  border-top: 1px solid #1e1e2e;
}

.control-panel__buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-panel__speed {
  position: absolute;
  right: 20px;
}

/* ─────────────────────────────────────────────────────────────
   BUTTONS
   ───────────────────────────────────────────────────────────── */

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: #1e1e2e;
  border: 1px solid #2d2d3d;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.control-btn:hover:not(:disabled) {
  background: #2d2d3d;
  border-color: #3d3d4d;
}

.control-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn .icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

/* Primary button (Play/Pause) */
.control-btn--primary {
  background: #2563eb;
  border-color: #3b82f6;
  padding: 12px 24px;
  font-weight: 500;
}

.control-btn--primary:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #2563eb;
}

/* Speed select */
.speed-select {
  padding: 8px 12px;
  background: #1e1e2e;
  border: 1px solid #2d2d3d;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
}

.speed-select:hover {
  border-color: #3d3d4d;
}

/* ─────────────────────────────────────────────────────────────
   STEP INDICATOR
   ───────────────────────────────────────────────────────────── */

.step-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
}

.step-indicator__dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-indicator__dot {
  width: 12px;
  height: 12px;
  padding: 0;
  background: #2d2d3d;
  border: 2px solid #3d3d4d;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-indicator__dot:hover {
  border-color: #64748b;
  transform: scale(1.2);
}

.step-indicator__dot--completed {
  background: #3b82f6;
  border-color: #3b82f6;
}

.step-indicator__dot--active {
  background: #2563eb;
  border-color: #60a5fa;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  transform: scale(1.2);
}

.step-indicator__label {
  font-size: 13px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.step-indicator__current {
  color: #e2e8f0;
  font-weight: 600;
}

/* ─────────────────────────────────────────────────────────────
   RESPONSIVE
   ───────────────────────────────────────────────────────────── */

@media (max-width: 768px) {
  .control-btn__label {
    display: none;
  }

  .control-btn {
    padding: 12px;
  }

  .control-btn--primary {
    padding: 14px 20px;
  }

  .control-panel__speed {
    position: static;
  }

  .step-indicator {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .control-panel__buttons {
    gap: 4px;
  }

  /* Hide first/last buttons */
  .control-btn[data-action="first"],
  .control-btn[data-action="last"] {
    display: none;
  }

  .step-indicator__dots {
    gap: 4px;
  }

  .step-indicator__dot {
    width: 8px;
    height: 8px;
  }
}

/* ─────────────────────────────────────────────────────────────
   KEYBOARD FOCUS
   ───────────────────────────────────────────────────────────── */

.control-btn:focus-visible,
.step-indicator__dot:focus-visible,
.speed-select:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ─────────────────────────────────────────────────────────────
   REDUCED MOTION
   ───────────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .control-btn,
  .step-indicator__dot {
    transition: none;
  }
}
```

---

## 6. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` (Right Arrow) | Next step |
| `←` (Left Arrow) | Previous step |
| `Home` | Go to start |
| `End` | Go to end |

---

## 7. Accessibility

### 7.1 ARIA Labels

- All buttons have descriptive `aria-label` or visible text
- Step indicator dots have `aria-label` with step number
- Disabled buttons have `aria-disabled`

### 7.2 Focus Management

- Visible focus indicators on all interactive elements
- Logical tab order
- Keyboard shortcuts documented

### 7.3 Screen Reader Support

- State changes announced via live regions (future enhancement)
- Step progress communicated via label text

---

## 8. Testing Checklist

- [ ] All buttons render correctly
- [ ] Play/Pause toggles icon and label
- [ ] Disabled states apply correctly
- [ ] Step indicator shows correct progress
- [ ] Clicking dots navigates to step
- [ ] Keyboard shortcuts work
- [ ] Speed selection works
- [ ] Responsive layout at all breakpoints
- [ ] Focus indicators visible
- [ ] Works with screen reader
