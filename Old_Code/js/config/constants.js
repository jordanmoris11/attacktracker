/* =============================================================================
   APPLICATION CONSTANTS
   Global configuration values
   ============================================================================= */

/**
 * Application metadata
 */
export const APP_CONFIG = {
  name: 'Attack Flow Beautifier',
  version: '2.0.0',
  description: 'Transform Mermaid diagrams into animated security attack flows',
};

/**
 * File paths
 */
export const PATHS = {
  icons: 'assets/icons/',
  data: 'data/',
  defaultDiagram: 'data/sample_attack.json',
};

/**
 * Icon configuration
 */
export const ICON_CONFIG = {
  defaultSize: 520,
  smallSize: 100,
  baseViewBox: 80,  // Icons are designed at 80x80
};

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  // Durations in milliseconds
  duration: {
    fast: 400,
    normal: 800,
    slow: 1200,
  },

  // Delay between steps
  stepDelay: 200,

  // Available playback speeds
  speeds: [0.5, 1, 1.5, 2],
  defaultSpeed: 1,

  // Effects
  defaultEffect: 'fadeInDrawPath',
};

// Meramid Configuration removed.

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  play: [' ', 'Space'],
  next: ['ArrowRight'],
  prev: ['ArrowLeft'],
  first: ['Home'],
  last: ['End'],
};

/**
 * Supported diagram types
 */
export const DIAGRAM_TYPES = {
  FLOWCHART: 'flowchart',
  SEQUENCE: 'sequence',
};

/**
 * Animation states
 */
export const ANIMATION_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished',
};

/**
 * Store event names
 */
export const EVENTS = {
  // Diagram events
  DIAGRAM_LOADED: 'diagram:loaded',
  DIAGRAM_PARSED: 'diagram:parsed',
  DIAGRAM_RENDERED: 'diagram:rendered',
  DIAGRAM_ERROR: 'diagram:error',

  // Animation events
  ANIMATION_STATE_CHANGE: 'animation:stateChange',
  ANIMATION_STEP_START: 'animation:stepStart',
  ANIMATION_STEP_COMPLETE: 'animation:stepComplete',
  ANIMATION_STEP_CHANGE: 'animation:stepChange',
  ANIMATION_SPEED_CHANGE: 'animation:speedChange',
  ANIMATION_READY: 'animation:ready',

  // UI events
  UI_LOADING: 'ui:loading',
  UI_READY: 'ui:ready',
  UI_ERROR: 'ui:error',

  // Resize events
  RESIZE_SCALE_CHANGE: 'resize:scaleChange',
};
