# Spec 04: Animation System

**Status:** Draft
**Priority:** P1 (Core Feature)
**Dependencies:** 02-parser.md, 03-transformer.md

---

## 1. Overview

### 1.1 Description

The Animation System orchestrates step-by-step reveal of attack flow diagrams. It manages:

1. **Timeline** - Ordered sequence of animation steps
2. **Effects** - Visual animations (fade, draw, highlight)
3. **Controller** - State machine for playback (play/pause/step)

### 1.2 Goals

- Smooth, professional-looking animations
- Precise control over playback (play, pause, step forward/back)
- GPU-accelerated animations where possible
- Support for different animation effects
- Accessible (respects reduced-motion preferences)

### 1.3 Non-Goals

- Complex keyframe animations
- Physics-based animations
- Video export of animations

---

## 2. Files Involved

| File | Purpose |
|------|---------|
| `js/animation/Timeline.js` | Animation sequence data structure |
| `js/animation/AnimationStep.js` | Single step definition |
| `js/animation/Effects.js` | Animation effect implementations |
| `js/animation/AnimationController.js` | Playback state machine |
| `css/diagram.css` | Animation keyframes and transitions |

---

## 3. Data Structures

### 3.1 Timeline

```typescript
interface Timeline {
  steps: AnimationStep[];
  totalSteps: number;
  totalDuration: number;  // ms

  // State
  currentIndex: number;   // -1 = before first step
  state: TimelineState;
}

type TimelineState = 'idle' | 'playing' | 'paused' | 'finished';
```

### 3.2 AnimationStep

```typescript
interface AnimationStep {
  id: number;                    // Unique step ID
  sequenceNumber: number;        // Display number (1, 2, 3...)

  // Target elements
  targets: {
    edge: SVGPathElement;        // Edge path to animate
    label: SVGElement;           // Edge label
    sourceNode?: SVGElement;     // Optional: highlight source
    targetNode?: SVGElement;     // Optional: highlight target
  };

  // Animation configuration
  effect: AnimationEffect;
  duration: number;              // ms
  delay: number;                 // ms before starting

  // Metadata
  description: string;           // Human-readable (from edge label)
  edgeData: ParsedEdge;          // Reference to parsed data
}

type AnimationEffect = 'fadeIn' | 'drawPath' | 'fadeInDrawPath' | 'highlight';
```

### 3.3 Effect Configuration

```typescript
interface EffectConfig {
  edge: {
    effect: 'draw' | 'fade';
    duration: number;
    easing: string;
  };
  label: {
    effect: 'fade';
    duration: number;
    delay: number;  // Delay after edge starts
  };
  nodeHighlight?: {
    enabled: boolean;
    duration: number;
  };
}
```

---

## 4. Timeline Builder

### 4.1 Building from Parsed Diagram

```javascript
// js/animation/Timeline.js

import { AnimationStep } from './AnimationStep.js';

export class Timeline {
  #steps = [];
  #currentIndex = -1;
  #state = 'idle';

  /**
   * Build timeline from parsed diagram and transformed SVG
   * @param {ParsedDiagram} parsed
   * @param {SVGElement} svg
   * @returns {Timeline}
   */
  static build(parsed, svg) {
    const timeline = new Timeline();

    // Sort edges by sequence number
    const sortedEdges = [...parsed.edges].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );

    for (const edge of sortedEdges) {
      const step = timeline.#createStep(edge, svg, parsed);
      if (step) {
        timeline.#steps.push(step);
      }
    }

    return timeline;
  }

  #createStep(edgeData, svg, parsed) {
    // Find DOM elements
    const edgeEl = svg.querySelector(
      `.beautified-edge[data-sequence="${edgeData.sequenceNumber}"]`
    );
    const labelEl = svg.querySelector(
      `.beautified-edge-label[data-edge-index="${edgeData.sequenceNumber - 1}"]`
    );

    if (!edgeEl) {
      console.warn(`Edge element not found for sequence ${edgeData.sequenceNumber}`);
      return null;
    }

    // Find source and target nodes
    const sourceNode = svg.querySelector(`[data-node-id="${edgeData.sourceId}"]`);
    const targetNode = svg.querySelector(`[data-node-id="${edgeData.targetId}"]`);

    return new AnimationStep({
      id: this.#steps.length,
      sequenceNumber: edgeData.sequenceNumber,
      targets: {
        edge: edgeEl,
        label: labelEl,
        sourceNode,
        targetNode,
      },
      effect: 'fadeInDrawPath',
      duration: 800,
      delay: 0,
      description: edgeData.label,
      edgeData,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────

  get steps() { return [...this.#steps]; }
  get totalSteps() { return this.#steps.length; }
  get currentIndex() { return this.#currentIndex; }
  get state() { return this.#state; }

  get currentStep() {
    if (this.#currentIndex < 0 || this.#currentIndex >= this.#steps.length) {
      return null;
    }
    return this.#steps[this.#currentIndex];
  }

  get isAtStart() { return this.#currentIndex <= 0; }
  get isAtEnd() { return this.#currentIndex >= this.#steps.length - 1; }
  get hasNext() { return this.#currentIndex < this.#steps.length - 1; }
  get hasPrevious() { return this.#currentIndex > 0; }

  get totalDuration() {
    return this.#steps.reduce((sum, step) => sum + step.duration + step.delay, 0);
  }

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────

  getStep(index) {
    return this.#steps[index] || null;
  }

  getNextStep() {
    return this.getStep(this.#currentIndex + 1);
  }

  getPreviousStep() {
    return this.getStep(this.#currentIndex - 1);
  }

  // Called by controller
  advance() {
    if (this.hasNext) {
      this.#currentIndex++;
      return this.currentStep;
    }
    return null;
  }

  rewind() {
    if (this.hasPrevious) {
      this.#currentIndex--;
      return this.currentStep;
    }
    return null;
  }

  goTo(index) {
    if (index >= -1 && index < this.#steps.length) {
      this.#currentIndex = index;
      return this.currentStep;
    }
    return null;
  }

  reset() {
    this.#currentIndex = -1;
    this.#state = 'idle';
  }

  setState(state) {
    this.#state = state;
  }
}
```

---

## 5. Animation Effects

### 5.1 Effects Library

```javascript
// js/animation/Effects.js

/**
 * Animation effects library
 * Uses Web Animations API for smooth, cancellable animations
 */
export const Effects = {

  /**
   * Fade in effect
   * @param {Element} element
   * @param {number} duration - ms
   * @returns {Animation}
   */
  fadeIn(element, duration = 400) {
    element.classList.remove('animation-hidden');
    element.classList.add('animation-visible');

    return element.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
  },

  /**
   * Fade out effect
   * @param {Element} element
   * @param {number} duration - ms
   * @returns {Animation}
   */
  fadeOut(element, duration = 400) {
    return element.animate([
      { opacity: 1 },
      { opacity: 0.3 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
  },

  /**
   * Draw path effect (stroke animation)
   * @param {SVGPathElement} path
   * @param {number} duration - ms
   * @returns {Animation}
   */
  drawPath(path, duration = 800) {
    const length = path.getTotalLength();

    // Set up stroke-dasharray
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    path.classList.remove('animation-hidden');
    path.classList.add('animation-visible');

    return path.animate([
      { strokeDashoffset: length },
      { strokeDashoffset: 0 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
  },

  /**
   * Highlight effect (glow)
   * @param {Element} element
   * @param {string} color
   * @param {number} duration - ms
   * @returns {Animation}
   */
  highlight(element, color = '#fff', duration = 600) {
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
   * Pulse effect
   * @param {Element} element
   * @param {number} duration - ms
   * @returns {Animation}
   */
  pulse(element, duration = 400) {
    return element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], {
      duration,
      easing: 'ease-in-out'
    });
  },

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

    // Start edge animation
    const edgeAnim = this.drawPath(edge, edgeDuration);

    // Start label animation after delay
    const labelPromise = new Promise(resolve => {
      setTimeout(() => {
        if (label) {
          const labelAnim = this.fadeIn(label, labelDuration);
          labelAnim.onfinish = resolve;
        } else {
          resolve();
        }
      }, labelDelay);
    });

    // Wait for both
    await Promise.all([
      edgeAnim.finished,
      labelPromise
    ]);
  }
};
```

### 5.2 Reduced Motion Support

```javascript
// Check for reduced motion preference
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Wrapper that respects preference
export function animate(element, keyframes, options) {
  if (prefersReducedMotion()) {
    // Skip to final state immediately
    const lastKeyframe = keyframes[keyframes.length - 1];
    Object.assign(element.style, lastKeyframe);
    return { finished: Promise.resolve() };
  }
  return element.animate(keyframes, options);
}
```

---

## 6. Animation Controller

### 6.1 State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
      reset()       │                                         │
          ┌─────────┴─────────┐                              │
          │                   │                              │
          ▼                   │                              │
      ┌───────┐    play()   ┌─┴───────┐    finish          │
      │ IDLE  │────────────▶│ PLAYING │─────────────────────┤
      └───────┘             └────┬────┘                     │
          ▲                      │                          │
          │                      │ pause()                  │
          │                      ▼                          │
          │                 ┌─────────┐                     │
          │                 │ PAUSED  │                     │
          │                 └────┬────┘                     │
          │                      │                          │
          │   reset()            │ play()                   │
          │◀─────────────────────┼──────────────────────────┤
          │                      │                          │
          │                      ▼                          │
          │                 ┌─────────┐                     │
          └─────────────────│FINISHED │◀────────────────────┘
                            └─────────┘
```

### 6.2 Controller Implementation

```javascript
// js/animation/AnimationController.js

import { Effects, prefersReducedMotion } from './Effects.js';
import { Store } from '../state/Store.js';

export class AnimationController {
  #timeline = null;
  #currentAnimation = null;
  #playbackSpeed = 1;
  #autoPlayInterval = null;

  constructor(timeline) {
    this.#timeline = timeline;
  }

  // ─────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────

  get state() { return this.#timeline.state; }
  get currentStep() { return this.#timeline.currentStep; }
  get currentIndex() { return this.#timeline.currentIndex; }
  get totalSteps() { return this.#timeline.totalSteps; }
  get isPlaying() { return this.state === 'playing'; }
  get isPaused() { return this.state === 'paused'; }
  get isFinished() { return this.state === 'finished'; }
  get canPlay() { return this.state !== 'playing' && this.#timeline.hasNext; }
  get canPause() { return this.state === 'playing'; }
  get canStepForward() { return this.#timeline.hasNext; }
  get canStepBackward() { return this.#timeline.hasPrevious; }

  // ─────────────────────────────────────────────────────────────
  // PLAYBACK CONTROLS
  // ─────────────────────────────────────────────────────────────

  /**
   * Start or resume playback
   */
  async play() {
    if (!this.canPlay) return;

    this.#timeline.setState('playing');
    Store.emit('animation:stateChange', { state: 'playing' });

    await this.#playLoop();
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.canPause) return;

    this.#timeline.setState('paused');
    this.#cancelCurrentAnimation();
    this.#clearAutoPlay();

    Store.emit('animation:stateChange', { state: 'paused' });
  }

  /**
   * Step to next animation
   */
  async stepForward() {
    if (!this.canStepForward) return;

    this.pause();
    await this.#executeStep(this.#timeline.advance());
  }

  /**
   * Step to previous animation (reverse)
   */
  stepBackward() {
    if (!this.canStepBackward) return;

    this.pause();
    const current = this.#timeline.currentStep;
    this.#hideStep(current);
    this.#timeline.rewind();

    Store.emit('animation:stepChange', {
      index: this.currentIndex,
      step: this.currentStep
    });
  }

  /**
   * Jump to specific step
   */
  async goToStep(index) {
    this.pause();

    // Hide all steps after target
    for (let i = this.#timeline.totalSteps - 1; i > index; i--) {
      this.#hideStep(this.#timeline.getStep(i));
    }

    // Show all steps up to and including target
    for (let i = 0; i <= index; i++) {
      const step = this.#timeline.getStep(i);
      this.#showStepImmediate(step);
    }

    this.#timeline.goTo(index);

    Store.emit('animation:stepChange', {
      index: this.currentIndex,
      step: this.currentStep
    });
  }

  /**
   * Go to first step (show nothing)
   */
  goToStart() {
    this.pause();
    this.#hideAllSteps();
    this.#timeline.reset();

    Store.emit('animation:stateChange', { state: 'idle' });
    Store.emit('animation:stepChange', { index: -1, step: null });
  }

  /**
   * Go to last step (show everything)
   */
  goToEnd() {
    this.pause();

    for (const step of this.#timeline.steps) {
      this.#showStepImmediate(step);
    }

    this.#timeline.goTo(this.#timeline.totalSteps - 1);
    this.#timeline.setState('finished');

    Store.emit('animation:stateChange', { state: 'finished' });
    Store.emit('animation:stepChange', {
      index: this.currentIndex,
      step: this.currentStep
    });
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.goToStart();
  }

  /**
   * Set playback speed
   * @param {number} speed - 0.5, 1, 1.5, 2
   */
  setSpeed(speed) {
    this.#playbackSpeed = speed;
    Store.emit('animation:speedChange', { speed });
  }

  // ─────────────────────────────────────────────────────────────
  // INTERNAL METHODS
  // ─────────────────────────────────────────────────────────────

  async #playLoop() {
    while (this.state === 'playing' && this.#timeline.hasNext) {
      const step = this.#timeline.advance();
      await this.#executeStep(step);

      // Small delay between steps
      if (this.state === 'playing') {
        await this.#delay(200 / this.#playbackSpeed);
      }
    }

    if (this.state === 'playing') {
      this.#timeline.setState('finished');
      Store.emit('animation:stateChange', { state: 'finished' });
    }
  }

  async #executeStep(step) {
    if (!step) return;

    Store.emit('animation:stepStart', {
      index: this.currentIndex,
      step
    });

    const duration = step.duration / this.#playbackSpeed;

    // Execute the effect
    if (prefersReducedMotion()) {
      this.#showStepImmediate(step);
    } else {
      await Effects.fadeInDrawPath(
        step.targets.edge,
        step.targets.label,
        {
          edgeDuration: duration,
          labelDuration: duration * 0.5,
          labelDelay: duration * 0.5
        }
      );
    }

    // Optional node highlight
    if (step.targets.targetNode) {
      Effects.pulse(step.targets.targetNode, 400 / this.#playbackSpeed);
    }

    Store.emit('animation:stepComplete', {
      index: this.currentIndex,
      step
    });
  }

  #showStepImmediate(step) {
    if (!step) return;

    const { edge, label } = step.targets;

    if (edge) {
      edge.classList.remove('animation-hidden');
      edge.classList.add('animation-visible');
      edge.style.opacity = '1';
      edge.style.strokeDasharray = 'none';
      edge.style.strokeDashoffset = '0';
    }

    if (label) {
      label.classList.remove('animation-hidden');
      label.classList.add('animation-visible');
      label.style.opacity = '1';
    }
  }

  #hideStep(step) {
    if (!step) return;

    const { edge, label } = step.targets;

    if (edge) {
      edge.classList.remove('animation-visible');
      edge.classList.add('animation-hidden');
      edge.style.opacity = '0';
    }

    if (label) {
      label.classList.remove('animation-visible');
      label.classList.add('animation-hidden');
      label.style.opacity = '0';
    }
  }

  #hideAllSteps() {
    for (const step of this.#timeline.steps) {
      this.#hideStep(step);
    }
  }

  #cancelCurrentAnimation() {
    if (this.#currentAnimation) {
      this.#currentAnimation.cancel();
      this.#currentAnimation = null;
    }
  }

  #clearAutoPlay() {
    if (this.#autoPlayInterval) {
      clearInterval(this.#autoPlayInterval);
      this.#autoPlayInterval = null;
    }
  }

  #delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  destroy() {
    this.#cancelCurrentAnimation();
    this.#clearAutoPlay();
    this.#timeline = null;
  }
}
```

---

## 7. Event System

### 7.1 Animation Events

| Event | Payload | Description |
|-------|---------|-------------|
| `animation:stateChange` | `{ state }` | State machine transition |
| `animation:stepStart` | `{ index, step }` | Step animation starting |
| `animation:stepComplete` | `{ index, step }` | Step animation finished |
| `animation:stepChange` | `{ index, step }` | Current step changed (any reason) |
| `animation:speedChange` | `{ speed }` | Playback speed changed |

### 7.2 Usage in UI

```javascript
// Example: Update step indicator
Store.on('animation:stepChange', ({ index, step }) => {
  stepIndicator.setActive(index);
});

Store.on('animation:stateChange', ({ state }) => {
  playButton.setIcon(state === 'playing' ? 'pause' : 'play');
  playButton.setDisabled(state === 'finished');
});
```

---

## 8. CSS Animation Keyframes

```css
/* css/diagram.css - Animation keyframes */

/* Draw path effect */
@keyframes draw-path {
  from {
    stroke-dashoffset: var(--path-length, 1000);
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Fade out (dim previous steps) */
@keyframes fade-dim {
  from { opacity: 1; }
  to { opacity: 0.4; }
}

/* Pulse highlight */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Glow */
@keyframes glow {
  0%, 100% { filter: drop-shadow(0 0 0 transparent); }
  50% { filter: drop-shadow(0 0 8px var(--glow-color, #fff)); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .beautified-edge,
  .beautified-edge-label,
  .custom-icon {
    animation: none !important;
    transition: opacity 0.1s !important;
  }
}
```

---

## 9. Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Many simultaneous animations | Batch updates, use `requestAnimationFrame` |
| Long SVG paths | Use `will-change: stroke-dashoffset` |
| Memory leaks | Clean up animation references |
| Layout thrashing | Use `transform` and `opacity` only |

---

## 10. Testing Checklist

- [ ] Timeline builds correctly from parsed data
- [ ] Steps ordered by sequence number
- [ ] Play starts animation sequence
- [ ] Pause stops at current frame
- [ ] Step forward advances one step
- [ ] Step backward reverses one step
- [ ] Go to start hides all
- [ ] Go to end shows all
- [ ] Speed control affects duration
- [ ] Reduced motion preference respected
- [ ] Events fire at correct times
- [ ] Memory cleaned up on destroy
