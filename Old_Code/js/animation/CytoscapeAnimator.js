import { Store } from '../state/Store.js';
import { EVENTS } from '../config/constants.js';

class CytoscapeAnimator {
    /**
     * @param {Core} cy - Cytoscape instance
     */
    constructor(cy) {
        this.cy = cy;
        this.isPlaying = false;
        this.currentStep = 0;
        this.speed = 1;
        this.intervalId = null;

        // 1. Build Timeline
        // We assume edges e0, e1, e2... are the sequence
        this.edges = this.cy.edges().sort((a, b) => {
            const idA = parseInt(a.id().replace('e', ''));
            const idB = parseInt(b.id().replace('e', ''));
            return idA - idB;
        });

        this.totalSteps = this.edges.length;

        // Initial State: Hide all edges
        this.goToStep(0);
    }

    /**
     * Move to specific step
     * @param {number} stepIndex - 0 to totalSteps
     */
    goToStep(stepIndex) {
        if (stepIndex < 0) stepIndex = 0;
        if (stepIndex > this.totalSteps) stepIndex = this.totalSteps;

        this.currentStep = stepIndex;

        this.cy.batch(() => {
            this.edges.forEach((edge, idx) => {
                if (idx < stepIndex) {
                    // PAST or CURRENT: Visible
                    edge.style({
                        'opacity': 1,
                        'visibility': 'visible',
                        'line-opacity': 1,
                        'target-arrow-opacity': 1
                    });
                    // Highlight the latest edge
                    if (idx === stepIndex - 1) {
                        edge.addClass('active-edge');
                    } else {
                        edge.removeClass('active-edge');
                    }
                } else {
                    // FUTURE: Hidden
                    edge.style({
                        'opacity': 0,
                        'visibility': 'hidden',
                        'line-opacity': 0,
                        'target-arrow-opacity': 0
                    });
                    edge.removeClass('active-edge');
                }
            });
        });

        // Camera movement focus on active edge
        if (stepIndex > 0) {
            const activeEdge = this.edges[stepIndex - 1];
            // this.cy.animate({
            //    fit: { eles: activeEdge.connectedNodes(), padding: 100 },
            //    duration: 500
            // });
        }

        // Notify UI
        Store.emit(EVENTS.ANIMATION_STEP_CHANGE, { index: this.currentStep });
    }

    next() {
        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        } else {
            this.pause();
        }
    }

    prev() {
        if (this.currentStep > 0) {
            this.goToStep(this.currentStep - 1);
        }
    }

    // Mock the interface expected by ControlPanel
    get steps() { return this.totalSteps; }
    get canStepForward() { return this.currentStep < this.totalSteps; }
    get canStepBackward() { return this.currentStep > 0; }
    get isFinished() { return this.currentStep === this.totalSteps; }

    setSpeed(speed) {
        this.speed = speed;
        // In this implementation, animation is discrete steps, so speed affects auto-play interval
        this.#updateInterval();
    }

    #updateInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => this.next(), 2000 / (this.speed || 1));
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.isFinished) {
            this.goToStep(0);
        }
        this.isPlaying = true;
        this.intervalId = setInterval(() => this.next(), 2000 / (this.speed || 1));

        Store.emit(EVENTS.ANIMATION_STATE_CHANGE, { state: 'playing' });
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.intervalId);
        this.intervalId = null;
        Store.emit(EVENTS.ANIMATION_STATE_CHANGE, { state: 'paused' });
    }

    stepForward() { this.next(); }
    stepBackward() { this.prev(); }
    goToStart() { this.goToStep(0); }
    goToEnd() { this.goToStep(this.totalSteps); }
}

export { CytoscapeAnimator };
