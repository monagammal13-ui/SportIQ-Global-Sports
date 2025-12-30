/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 122: CONTENT ENGAGEMENT HEATMAP ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Visualizes user engagement (clicks, hover time, reading depth)
 *          via a thermal overlay on article content.
 * Features: Click tracking, scroll/dwell tracking, and dynamic thermal rendering.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        heatmap: {
            colors: {
                low: 'rgba(59, 130, 246, 0.3)',    // Blue
                med: 'rgba(16, 185, 129, 0.3)',    // Green
                high: 'rgba(239, 68, 68, 0.4)'     // Red
            },
            decay: 0.99
        },
        selectors: {
            trackable: 'p, h2, h3, img, blockquote', // Elements to track
            container: '.article-body, #content-area' // Scope
        }
    };

    const state = {
        active: false,
        heatMap: new Map(), // Map<Element, Score>
        maxScore: 1
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HEATMAP ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const HeatmapEngine = {
        initialize: function () {
            console.log('🔥 [Heatmap] Engine initialized');

            this.bindTracker();
            this.injectControls();

            // Periodically refresh if active to show live changes
            setInterval(() => {
                if (state.active) this.renderOverlay();
            }, 1000);
        },

        bindTracker: function () {
            // Track Clicks
            document.addEventListener('click', (e) => {
                // Heuristic: Is this inside a trackable area?
                const target = e.target.closest(CONFIG.selectors.trackable);
                if (target) {
                    this.addHeat(target, 5); // Click = High heat
                }
            });

            // Track Mouse Over (Dwell)
            document.addEventListener('mousemove', (e) => {
                if (Math.random() > 0.8) { // Sample rate to reduce perf cost
                    const target = e.target.closest(CONFIG.selectors.trackable);
                    if (target) {
                        this.addHeat(target, 0.1); // Hover = Low heat accumulation
                    }
                }
            });
        },

        addHeat: function (element, amount) {
            const current = state.heatMap.get(element) || 0;
            const newScore = current + amount;
            state.heatMap.set(element, newScore);

            if (newScore > state.maxScore) state.maxScore = newScore;

            if (state.active) this.renderElement(element);
        },

        toggle: function () {
            state.active = !state.active;
            const btn = document.getElementById('heatmap-toggle-btn');

            if (state.active) {
                console.log('🔥 [Heatmap] Visualization ON');
                document.body.classList.add('heatmap-mode');
                if (btn) btn.classList.add('active');
                if (btn) btn.innerText = 'Hide Heatmap';
                this.renderOverlay();
            } else {
                console.log('🔥 [Heatmap] Visualization OFF');
                document.body.classList.remove('heatmap-mode');
                if (btn) btn.classList.remove('active');
                if (btn) btn.innerText = 'Show Heatmap';
                this.clearOverlay();
            }
        },

        renderOverlay: function () {
            state.heatMap.forEach((score, element) => {
                this.renderElement(element);
            });
        },

        renderElement: function (element) {
            const score = state.heatMap.get(element) || 0;
            const intensity = Math.min(1, score / (state.maxScore * 0.8)); // Normalize

            // Calculate Color
            let color = 'transparent';
            if (intensity > 0.7) color = CONFIG.heatmap.colors.high;
            else if (intensity > 0.3) color = CONFIG.heatmap.colors.med;
            else if (intensity > 0) color = CONFIG.heatmap.colors.low;

            element.style.setProperty('--heat-color', color);
            element.setAttribute('data-heat', Math.round(score));
        },

        clearOverlay: function () {
            state.heatMap.forEach((_, element) => {
                element.style.removeProperty('--heat-color');
                element.removeAttribute('data-heat');
            });
        },

        simulateData: function () {
            // Seed random data for demo
            const elements = document.querySelectorAll(CONFIG.selectors.trackable);
            elements.forEach(el => {
                if (Math.random() > 0.5) {
                    this.addHeat(el, Math.random() * 50);
                }
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const HeatmapUI = {
        injectControls: function () {
            if (document.getElementById('heatmap-controls')) return;

            const div = document.createElement('div');
            div.id = 'heatmap-controls';
            div.innerHTML = `
                <button id="heatmap-toggle-btn">Show Heatmap</button>
                <div class="heatmap-legend">
                    <span class="heat-dot low"></span> Low
                    <span class="heat-dot med"></span> Med
                    <span class="heat-dot high"></span> High
                </div>
            `;
            document.body.appendChild(div);

            document.getElementById('heatmap-toggle-btn').addEventListener('click', () => {
                HeatmapEngine.toggle();
            });
        }
    };

    // Keep HeatmapEngine internal but expose injectControls to it
    HeatmapEngine.injectControls = HeatmapUI.injectControls;

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ContentHeatmap = {
        init: HeatmapEngine.initialize.bind(HeatmapEngine),
        toggle: HeatmapEngine.toggle.bind(HeatmapEngine),
        seed: HeatmapEngine.simulateData.bind(HeatmapEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HeatmapEngine.initialize());
    } else {
        HeatmapEngine.initialize();
    }

})();
