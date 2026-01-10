/* =============================================================================
   APPLICATION ENTRY POINT
   Main orchestrator for the Mermaid Attack Flow Beautifier
   ============================================================================= */

import { Store } from './state/Store.js';
import { iconLoader } from './core/IconLoader.js';
import { PATHS, EVENTS } from './config/constants.js';

/**
 * Main Application Class
 *
 * Orchestrates the initialization and coordination of all modules:
 * - Loads mermaid diagram source
 * - Parses and renders diagram
 * - Transforms SVG with custom icons
 * - Sets up animation controls
 */
class App {
  #outputElement = null;
  #controlsElement = null;
  #diagramCode = '';
  #parsedDiagram = null;
  #animationController = null;
  #controlPanel = null;
  #resizeManager = null;

  constructor() {
    this.#outputElement = document.getElementById('diagram-output');
    this.#controlsElement = document.getElementById('controls-container');
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Initialize the application
   */
  async init() {
    console.log('[App] Initializing...');

    try {
      // Update loading state
      Store.emit(EVENTS.UI_LOADING, { message: 'Loading diagram...' });

      // Step 1: Load mermaid diagram file
      await this.#loadDiagramFile();

      // Step 2: Preload required icons
      Store.emit(EVENTS.UI_LOADING, { message: 'Loading icons...' });
      await iconLoader.preloadFromCode(this.#diagramCode);
      Store.set('system.iconsLoaded', true);

      // Step 3: Initialize Mermaid.js (Skipped for Cytoscape)
      // this.#initMermaid();
      // Store.set('system.mermaidReady', true);

      // Step 4: Render and beautify diagram
      Store.emit(EVENTS.UI_LOADING, { message: 'Rendering diagram...' });
      await this.#renderDiagram();

      // Step 5: Update Dynamic Legend (MITRE)
      // Note: Using static string to avoid cache-busting quirks in dynamic imports
      const { StatusLegend } = await import('./ui/StatusLegend.js?v=23');
      const statusLegend = new StatusLegend(document.getElementById('status-bar'));
      statusLegend.update(this.#parsedDiagram);

      // DragManager/ResizeManager removed.

      // Step 8: Setup animation controls
      Store.emit(EVENTS.UI_LOADING, { message: 'Setting up controls...' });
      await this.#setupControls();

      // Done!
      Store.set('ui.isLoading', false);
      Store.emit(EVENTS.UI_READY);
      console.log('[App] Initialization complete');

    } catch (error) {
      console.error('[App] Initialization failed:', error);
      this.#showError(error.message);
      Store.emit(EVENTS.UI_ERROR, { error });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DIAGRAM LOADING
  // ─────────────────────────────────────────────────────────────

  /**
   * Load mermaid diagram from file
   */
  /**
   * Load mermaid diagram from file
   * Supports Dynamic Routing:
   * - /           -> fetches data/mermaid.txt
   * - /filename   -> fetches data/filename.txt
   */
  async #loadDiagramFile() {
    const cacheBuster = `?t=${Date.now()}`;

    // Parse URL path to find requested diagram
    // e.g. http://localhost:8080/kali -> pathname is "/kali"
    const pathName = window.location.pathname;

    // Clean path: remove leading slash, trim
    let requestedFile = pathName.replace(/^\/+/, '').trim();

    // Default file path
    let targetPath = PATHS.defaultDiagram;

    // If path is provided (and not just index.html), construct new path
    if (requestedFile && requestedFile !== 'index.html') {
      // Check if user accidentally typed .txt or not
      if (!requestedFile.endsWith('.txt')) {
        requestedFile += '.txt';
      }
      // Security: Prevent directory traversal (basic check)
      requestedFile = requestedFile.replace(/\.\./g, '');

      targetPath = `${PATHS.data}${requestedFile}`;
      console.log(`[App] Routing detected. Fetching: ${targetPath}`);
    }

    try {
      const response = await fetch(targetPath + cacheBuster);

      if (!response.ok) {
        // Fallback: If custom file fails, try loading default
        if (targetPath !== PATHS.defaultDiagram) {
          console.warn(`[App] Failed to load ${targetPath}, falling back to default.`);
          const fallbackResponse = await fetch(PATHS.defaultDiagram + cacheBuster);
          if (fallbackResponse.ok) {
            this.#diagramCode = await fallbackResponse.text();
            Store.set('diagram.sourceCode', this.#diagramCode);
            Store.emit(EVENTS.DIAGRAM_LOADED, { code: this.#diagramCode });
            return;
          }
        }
        throw new Error(`Failed to load diagram file: ${targetPath}`);
      }

      this.#diagramCode = await response.text();
      Store.set('diagram.sourceCode', this.#diagramCode);
      Store.emit(EVENTS.DIAGRAM_LOADED, { code: this.#diagramCode });
      console.log('[App] Diagram loaded');

    } catch (err) {
      console.error(err);
      this.#showError(`Could not load diagram: ${targetPath}`);
    }
  }

  // initMermaid removed.

  // ─────────────────────────────────────────────────────────────
  // DIAGRAM RENDERING
  // ─────────────────────────────────────────────────────────────

  /**
   * Render and beautify the diagram
   */
  async #renderDiagram() {
    // CYTOSCAPE PIPELINE
    console.log('[App] Starting Cytoscape pipeline...');

    // Import Adapter dynamically
    const { CytoscapeAdapter } = await import('./core/CytoscapeAdapter.js?v=26');

    // 1. Load Data (JSON Dynamic)
    let data;
    try {
      // Determine file based on URL or default
      const pathName = window.location.pathname;
      let requestedFile = pathName.replace(/^\/+/, '').trim();

      // Default
      if (!requestedFile || requestedFile === 'index.html') {
        requestedFile = 'sample_attack';
      }

      // Normalize extension
      if (!requestedFile.endsWith('.json')) {
        requestedFile += '.json';
      }

      console.log(`[App] Fetching ${requestedFile}...`);
      const response = await fetch(`data/${requestedFile}`);

      if (!response.ok) throw new Error(`404 Not Found: ${requestedFile}`);

      data = await response.json();
      console.log('[App] Loaded JSON data:', data);
      this.#parsedDiagram = data; // CRITICAL: Store data for StatusLegend
    } catch (e) {
      console.error('Failed to load JSON data:', e);
      this.#showError(`Failed to load diagram: ${e.message}`);
      return;
    }

    // 2. Adapt
    const adapter = new CytoscapeAdapter();
    const elements = adapter.toElements(data);

    // 3. Initialize Cytoscape
    // Clear output and create a container div
    this.#outputElement.innerHTML = '<div id="cy" style="width: 100%; height: 100%; display: block;"></div>';

    // Check if extension is registered (global check)
    if (typeof cytoscapeDagre !== 'undefined' && !cytoscape.prototype.hasDagre) {
      cytoscape.use(cytoscapeDagre);
      cytoscape.prototype.hasDagre = true;
    }

    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: elements,
      style: this.#getCytoscapeStyle(),
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        rankDir: 'LR',
        nodeSep: 150,
        rankSep: 250,
        padding: 100
      },
      wheelSensitivity: 0.2
    });

    // Store for debugging
    window.cy = cy;
    this.#hideLoading();
    console.log(`[App] Diagram rendered via Cytoscape`);
  }

  #getCytoscapeStyle() {
    return [
      {
        selector: 'node:childless', // Apply fixed size ONLY to leaf nodes
        style: {
          'label': 'data(label)',
          'color': '#e2e8f0',
          'font-size': '40px',
          'text-valign': 'bottom',
          'text-margin-y': 30,
          'background-color': '#1e293b',
          'width': 400,
          'height': 400,
          'border-width': 0,
          'background-fit': 'contain',
          'background-clip': 'none'
        }
      },
      // Icon injection via background-image (Leaf nodes only)
      {
        selector: 'node:childless[iconPath]',
        style: {
          'background-image': 'data(iconPath)',
          'background-opacity': 0 // Transparent bg so icon stands out? No, keeps dark bg.
        }
      },
      {
        selector: ':parent',
        style: {
          'label': 'data(label)', // Restore label visibility
          'text-valign': 'top',
          'text-halign': 'center',
          'text-margin-y': -20, // Move title up slightly
          'background-color': '#ffffff',
          'background-opacity': 0.02, // Extremely subtle highlight
          'border-color': '#475569',
          'border-width': 4,
          'border-style': 'dashed',
          'shape': 'roundrectangle',
          'padding': 100, // More breathing room
          'font-size': '80px', // Larger container title
          'font-weight': 'bold',
          'color': '#cbd5e1',
          // Key Fix: Reset dimensions to auto for containers
          'width': 'label',
          'height': 'label',
          'min-width': 0,
          'min-height': 0
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 5,
          'line-color': '#64748b',
          'target-arrow-color': '#64748b',
          'target-arrow-shape': 'triangle',
          'curve-style': 'taxi', // Orthogonal
          'taxi-turn-min-distance': 40,
          'label': 'data(label)',
          'font-size': '36px',
          'color': '#cbd5e1',
          'text-background-color': '#0f172a',
          'text-background-opacity': 1,
          'text-background-padding': 8,
          'text-rotation': 'autorotate'
        }
      },
      // ──────────────────────────────────────────
      // NEW SCHEMA STYLING
      // ──────────────────────────────────────────
      {
        selector: '.state-compromised',
        style: {
          'border-color': '#ef4444', // Red
          'border-width': 4,
          'shadow-blur': 20,
          'shadow-color': '#ef4444',
          'shadow-opacity': 0.6
        }
      },
      {
        selector: '.state-protected',
        style: {
          'border-color': '#f59e0b', // Amber
          'border-style': 'dashed',
          'border-width': 4
        }
      },
      {
        selector: '.type-illegal',
        style: {
          'line-color': '#ef4444',
          'target-arrow-color': '#ef4444',
          'line-style': 'dashed',
          'width': 6
        }
      },
      {
        selector: '.type-impact',
        style: {
          'line-color': '#f59e0b',
          'target-arrow-color': '#f59e0b',
          'width': 10
        }
      }
    ];
  }

  // detectDiagramType removed.

  // ─────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Hide loading state
   */
  #hideLoading() {
    const loading = document.getElementById('loading-state');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  #showError(message) {
    this.#hideLoading();

    const template = document.getElementById('error-template');
    const errorElement = template.content.cloneNode(true);
    errorElement.querySelector('.error__message').textContent = message;

    this.#outputElement.innerHTML = '';
    this.#outputElement.appendChild(errorElement);

    Store.set('ui.error', message);
    Store.set('ui.isLoading', false);
  }

  // ─────────────────────────────────────────────────────────────
  // RESPONSIVE SCALING
  // ─────────────────────────────────────────────────────────────

  // Responsive scaling is native to Cytoscape.

  // ─────────────────────────────────────────────────────────────
  // ANIMATION CONTROLS
  // ─────────────────────────────────────────────────────────────

  /**
   * Setup animation controls
   */
  async #setupControls() {
    // Check if we have edges to animate
    if (!window.cy || window.cy.edges().length === 0) {
      console.log('[App] No edges to animate, skipping controls');
      return;
    }

    // Import animation modules
    // 3. Initialize Animator
    const { CytoscapeAnimator } = await import('./animation/CytoscapeAnimator.js');
    this.#animationController = new CytoscapeAnimator(window.cy);

    // 4. Setup Control Panel
    const { ControlPanel } = await import('./ui/ControlPanel.js');
    this.#controlPanel = new ControlPanel(this.#controlsElement, this.#animationController);

    // 5. Signal Ready
    this.#controlsElement.classList.add('initialized');
    Store.emit(EVENTS.ANIMATION_READY, {
      totalSteps: this.#animationController.totalSteps
    });

    console.log(`[App] Cytoscape Animation controls ready (${this.#animationController.totalSteps} steps)`);
  }

  /**
   * Hide all edges (No longer needed, handled by Animator)
   */
  #hideAllEdges(svg) {
    // legacy stub
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.#resizeManager?.destroy();
    this.#controlPanel?.destroy();
    this.#animationController?.destroy();
  }
}

// ─────────────────────────────────────────────────────────────
// APPLICATION STARTUP
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.init();
});
