/* =============================================================================
   MATRIX EXPLORER (Formerly StatusLegend)
   A modern, glassmorphism UI for exploring MITRE ATT&CK usage.
   ============================================================================= */

import { getEdgeStyle, getAllEdgeStyleTypes, detectEdgeInfo, TACTIC_MAP } from '../config/edges.registry.js?v=2';
import { MITRE_INDEX } from '../config/mitre-index.js';
import { Store } from '../state/Store.js';
import { EVENTS } from '../config/constants.js';

export class StatusLegend {
    #container = null; // #matrix-root
    #sidebarEl = null;
    #widgetEl = null;

    // State
    #isOpen = false;
    #activeFilter = false; // "Show Only Active"
    #searchQuery = '';

    // Data
    #parsedData = { usedTypes: new Set(), usedTCodes: new Set(), dynamicMap: new Map() };
    #listening = false;

    constructor(containerElement) {
        this.#container = document.getElementById('matrix-root');
        if (!this.#container) {
            console.error('[MatrixExplorer] #matrix-root not found. UI will not render.');
            return;
        }
    }

    /**
     * Update based on diagram data
     */
    update(parsedDiagram) {
        if (!this.#container) return;

        // 1. Process Data
        const usedTypes = new Set();
        const usedTCodes = new Set();
        const dynamicMap = new Map();

        if (parsedDiagram && parsedDiagram.edges) {
            parsedDiagram.edges.forEach(edge => {
                const info = detectEdgeInfo(edge.text || edge.label);

                if (info.type && info.type !== 'default') {
                    usedTypes.add(info.type);
                }
                if (info.tCode) {
                    usedTCodes.add(info.tCode);
                    if (info.type) {
                        if (!dynamicMap.has(info.type)) dynamicMap.set(info.type, []);
                        const list = dynamicMap.get(info.type);
                        if (!list.find(x => x.tCode === info.tCode)) {
                            list.push({ tCode: info.tCode, label: info.label || info.tCode });
                        }
                    }
                }
            });
        }

        this.#parsedData = { usedTypes, usedTCodes, dynamicMap };

        // 2. Initial Render (if first time) or Re-render
        this.#render();
        this.#bindAnimationEvents();
    }

    #render() {
        this.#container.innerHTML = '';

        // A. Floating Widget
        const activeCount = this.#parsedData.usedTCodes.size;
        const activeTactics = this.#parsedData.usedTypes.size;

        const widget = document.createElement('div');
        widget.className = 'matrix-widget';
        widget.innerHTML = `
            <svg class="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <div class="widget-stats">
                <span class="stat-label">MITRE ATT&CK</span>
                <span class="stat-value">${activeCount} Techniques • ${activeTactics} Tactics</span>
            </div>
        `;
        widget.onclick = () => this.#toggleSidebar(true);
        this.#widgetEl = widget;

        // B. Sidebar
        const sidebar = document.createElement('div');
        sidebar.className = `matrix-sidebar ${this.#isOpen ? 'is-open' : ''}`;

        // Header
        const header = `
            <div class="sidebar-header">
                <div class="sidebar-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                       <line x1="3" y1="9" x2="21" y2="9"/>
                       <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    Matrix Explorer
                </div>
                <button class="close-btn" id="matrix-close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        // Controls
        const controls = `
            <div class="sidebar-controls">
                <input type="text" class="search-input" placeholder="Search techniques..." id="matrix-search" value="${this.#searchQuery}">
                <button class="filter-toggle ${this.#activeFilter ? 'active' : ''}" id="matrix-filter" title="Show Active Only">
                    Active
                </button>
            </div>
        `;

        // Content
        const content = document.createElement('div');
        content.className = 'sidebar-content';
        this.#renderContent(content);

        sidebar.innerHTML = header + controls;
        sidebar.appendChild(content);

        // Bind Sidebar Events
        sidebar.querySelector('#matrix-close').onclick = () => this.#toggleSidebar(false);

        const searchInput = sidebar.querySelector('#matrix-search');
        searchInput.oninput = (e) => {
            this.#searchQuery = e.target.value.toLowerCase();
            this.#renderContent(content);
        };

        const filterBtn = sidebar.querySelector('#matrix-filter');
        filterBtn.onclick = () => {
            this.#activeFilter = !this.#activeFilter;
            filterBtn.classList.toggle('active');
            this.#renderContent(content);
        };

        this.#sidebarEl = sidebar;
        this.#container.appendChild(widget);
        this.#container.appendChild(sidebar);
    }

    #renderContent(container) {
        container.innerHTML = '';
        const allTypes = getAllEdgeStyleTypes();
        const { usedTypes, usedTCodes } = this.#parsedData;

        // Iterate TACTICS (Internal Types)
        allTypes.forEach(type => {
            const style = getEdgeStyle(type);
            const isActiveInDiagram = usedTypes.has(type);

            // Find relevant MITRE Tactic Slug (e.g. discovery -> reconnaissance)
            // Reverse lookup TACTIC_MAP or iterate
            let mitreSlug = null;
            Object.entries(TACTIC_MAP).forEach(([key, value]) => {
                if (value === type) mitreSlug = key; // Note: TACTIC_MAP can have dupes, but usually one-to-one or many-to-one
            });
            // Fallback: Check if MITRE_INDEX has mapping?
            // If resource-development maps to discovery, we want discovery to show recon + resource dev?
            // Complex. For now, we iterate internal Types and find all techniques in MITRE_INDEX that explicitly match this tactic slug.

            // Collect Techniques for this Tactic
            let techniques = [];

            // 1. From Exhaustive DB (Preferred)
            if (mitreSlug) {
                Object.values(MITRE_INDEX).forEach(tech => {
                    if (tech.tactics.includes(mitreSlug) && !tech.isSubTechnique) { // Top Levels Only
                        techniques.push(tech);
                    }
                });
            } else {
                // Fallback (for non-mapped types like "initial-access" if key diff)
                // Just use legacy hardcoded if no slug match (unlikely if map is good)
                if (style.tCodeMap) {
                    Object.entries(style.tCodeMap).forEach(([key, code]) => {
                        techniques.push({ tCode: code, name: key, subTechniques: [] });
                    });
                }
            }

            // Dedupe and Sort
            techniques.sort((a, b) => a.tCode.localeCompare(b.tCode));

            // Filtering Logic (Recursive)
            // Keep Parent if:
            // 1. Matches Search OR Child matches Search
            // 2. Matches Active Filter (Parent Active OR Child Active)

            const visibleTechniques = techniques.filter(parent => {
                const parentActive = usedTCodes.has(parent.tCode);
                const parentMatch = this.#matchesQuery(parent.name, parent.tCode);

                // Check Children
                const visibleChildren = (parent.subTechniques || []).filter(sub => {
                    const subActive = usedTCodes.has(sub.tCode);
                    const subMatch = this.#matchesQuery(sub.name, sub.tCode);

                    if (this.#activeFilter && !subActive) return false;
                    if (this.#searchQuery && !subMatch && !parentMatch) return false;

                    return true;
                });

                // Store visible children for rendering
                parent._visibleSubs = visibleChildren;

                // Decision for Parent visibility
                if (this.#activeFilter) {
                    return parentActive || visibleChildren.length > 0;
                }
                if (this.#searchQuery) {
                    return parentMatch || visibleChildren.length > 0;
                }
                return true;
            });

            if (visibleTechniques.length === 0) return;

            // Render Tactic Card
            const card = document.createElement('div');
            card.className = `matrix-tactic ${isActiveInDiagram ? 'active-in-diagram' : 'dimmed'}`;
            card.setAttribute('data-type', type);

            const techHTML = visibleTechniques.map(parent => this.#renderTechniqueRow(parent, usedTCodes)).join('');

            card.innerHTML = `
                <div class="tactic-header">
                    <div class="tactic-indicator" style="background-color: ${style.color}; box-shadow: 0 0 8px ${style.color}40;"></div>
                    <div class="tactic-info">
                        <span class="tactic-name">${style.label}</span>
                        <span class="tactic-meta">${style.mitreId || ''} • ${visibleTechniques.length} Techniques</span>
                    </div>
                    <svg class="tactic-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="tactic-body">
                    <div class="technique-grid" style="display:flex; flex-direction:column; gap:2px;">
                        ${techHTML}
                    </div>
                </div>
            `;

            // Toggle Logic
            const header = card.querySelector('.tactic-header');
            header.onclick = () => card.classList.toggle('expanded');

            // Auto expand if searching or active filter
            if (this.#searchQuery || this.#activeFilter) card.classList.add('expanded');

            container.appendChild(card);
        });
    }

    #renderTechniqueRow(tech, usedTCodes) {
        const isActive = usedTCodes.has(tech.tCode);
        const children = tech._visibleSubs || [];

        let html = `
            <div class="tech-row ${isActive ? 'active-row' : ''}" style="display:flex; flex-direction:column;">
                <a href="${tech.url || '#'}" target="_blank" class="tech-tag ${isActive ? 'active' : ''}" data-code="${tech.tCode}" style="width:100%; justify-content:flex-start;">
                    <span class="code" style="min-width:60px; display:inline-block;">${tech.tCode}</span>
                    <span>${tech.name}</span>
                </a>
        `;

        if (children.length > 0) {
            html += `<div class="sub-techniques" style="padding-left: 20px; display:flex; flex-direction:column; gap:2px; margin-top:2px;">`;
            children.forEach(sub => {
                const isSubActive = usedTCodes.has(sub.tCode);
                html += `
                    <a href="${sub.url || '#'}" target="_blank" class="tech-tag ${isSubActive ? 'active' : ''}" data-code="${sub.tCode}" style="width:100%; justify-content:flex-start; font-size:10px; opacity:0.9;">
                        <span class="code" style="min-width:60px; display:inline-block;">${sub.tCode}</span>
                        <span>${sub.name}</span>
                    </a>
                `;
            });
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    #matchesQuery(name, code) {
        if (!this.#searchQuery) return true;
        return (name || '').toLowerCase().includes(this.#searchQuery) ||
            (code || '').toLowerCase().includes(this.#searchQuery);
    }

    #toggleSidebar(open) {
        this.#isOpen = open;
        if (this.#sidebarEl) {
            this.#sidebarEl.classList.toggle('is-open', open);
        }
    }

    #bindAnimationEvents() {
        if (this.#listening) return;
        this.#listening = true;

        Store.on(EVENTS.ANIMATION_STEP_START, ({ step }) => {
            if (!step || !step.edgeData) return;
            const { styleType, mitreInfo } = step.edgeData;
            const tCode = mitreInfo ? mitreInfo.tCode : null;

            this.#highlight(styleType, tCode);
        });

        Store.on(EVENTS.ANIMATION_STATE_CHANGE, ({ state }) => {
            if (state === 'idle' || state === 'finished') {
                this.#clearHighlights();
            }
        });
    }

    #highlight(type, tCode) {
        if (!this.#sidebarEl) return;

        const tags = this.#sidebarEl.querySelectorAll(`.tech-tag[data-code="${tCode}"]`);
        tags.forEach(tag => {
            tag.classList.add('highlight-pulse');
            tag.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    #clearHighlights() {
        if (!this.#sidebarEl) return;
        this.#sidebarEl.querySelectorAll('.highlight-pulse').forEach(el => el.classList.remove('highlight-pulse'));
    }
}
