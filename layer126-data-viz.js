/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 126: INTERACTIVE DATA VISUALIZATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Advanced data rendering for complex metrics (Radar/Spider charts, 
 *          Line trends) to visualize player attributes and historical performance.
 * Features: SVG Radar charts for skills, interactive SVG Line charts for trends.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        charts: {
            radarSize: 200,
            colors: ['#3b82f6', '#ec4899', '#10b981'] // Blue, Pink, Green
        },
        selectors: {
            container: '#advanced-data-viz'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VISUALIZATION ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const DataVizEngine = {
        initialize: function () {
            console.log('📊 [DataViz] Engine initialized');

            // Listen for feed generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed && e.detail.feed.metrics) {
                    this.processMetrics(e.detail.feed.metrics);
                }
            });
        },

        processMetrics: function (metrics) {
            console.log('📊 [DataViz] Processing metrics:', metrics);

            if (metrics.type === 'player_attributes') {
                this.renderRadar(metrics.data, metrics.title);
            } else if (metrics.type === 'trend') {
                this.renderLine(metrics.data, metrics.title);
            }
        },

        renderRadar: function (stats, title) { // stats: { Label: 0-100 }
            const container = this.getContainer();
            const keys = Object.keys(stats);
            const values = Object.values(stats);
            const numPoints = keys.length;
            const radius = CONFIG.charts.radarSize / 2;
            const center = radius + 20; // Padding

            // Calculate Points
            const points = values.map((val, i) => {
                const angle = (Math.PI * 2 * i) / numPoints - (Math.PI / 2); // Start at top
                const r = (val / 100) * radius;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return `${x},${y}`;
            }).join(' ');

            // Calculate Axis Lines
            const axes = keys.map((key, i) => {
                const angle = (Math.PI * 2 * i) / numPoints - (Math.PI / 2);
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                // Label Pos
                const lx = center + (radius + 15) * Math.cos(angle);
                const ly = center + (radius + 10) * Math.sin(angle);
                return { x, y, lx, ly, label: key };
            });

            const svg = `
                <div class="viz-card radar-card">
                    <h3>${title || 'Attribute Analysis'}</h3>
                    <svg width="${(radius + 40) * 2}" height="${(radius + 40) * 2}">
                        <!-- Background Web -->
                        <circle cx="${center}" cy="${center}" r="${radius}" class="radar-bg" />
                        <circle cx="${center}" cy="${center}" r="${radius * 0.66}" class="radar-bg" />
                        <circle cx="${center}" cy="${center}" r="${radius * 0.33}" class="radar-bg" />
                        
                        <!-- Axes -->
                        ${axes.map(a => `<line x1="${center}" y1="${center}" x2="${a.x}" y2="${a.y}" class="radar-axis" />`).join('')}
                        
                        <!-- Data Poly -->
                        <polygon points="${points}" class="radar-poly" />
                        
                        <!-- Labels -->
                        ${axes.map(a => `<text x="${a.lx}" y="${a.ly}" class="radar-label" text-anchor="middle" dominant-baseline="middle">${a.label}</text>`).join('')}
                    </svg>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', svg);
        },

        // Simple SVG Line Chart generator
        renderLine: function (dataPoints, title) { // dataPoints: [10, 20, 15, ...]
            const container = this.getContainer();
            const width = 300;
            const height = 150;
            const max = Math.max(...dataPoints);
            const min = Math.min(...dataPoints);
            const stepX = width / (dataPoints.length - 1);

            const points = dataPoints.map((val, i) => {
                const x = i * stepX;
                const y = height - ((val - min) / (max - min)) * height;
                return `${x},${y}`;
            }).join(' ');

            const svg = `
                <div class="viz-card line-card">
                    <h3>${title || 'Performance Trend'}</h3>
                    <svg width="100%" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}">
                        <polyline points="${points}" class="line-poly" />
                        ${dataPoints.map((val, i) => {
                const x = i * stepX;
                const y = height - ((val - min) / (max - min)) * height;
                return `<circle cx="${x}" cy="${y}" r="4" class="line-dot" data-val="${val}" />`;
            }).join('')}
                    </svg>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', svg);
        },

        getContainer: function () {
            let container = document.querySelector(CONFIG.selectors.container);
            if (!container) {
                container = document.createElement('div');
                container.id = 'advanced-data-viz';
                container.className = 'viz-grid';
                // Try finding a good home
                const heatmap = document.getElementById('heatmap-controls');
                document.body.appendChild(container); // Just append for now
            }
            return container;
        },

        injectDemo: function () {
            this.getContainer().innerHTML = ''; // Clear

            // Demo 1: Player Stats (Radar)
            this.processMetrics({
                type: 'player_attributes',
                title: 'Player Impact: Erling Haaland',
                data: { 'Pace': 88, 'Shooting': 94, 'Passing': 70, 'Physical': 90, 'Defense': 40, 'Dribble': 78 }
            });

            // Demo 2: Form Guide (Line)
            this.processMetrics({
                type: 'trend',
                title: 'Goals per Season',
                data: [15, 22, 28, 35, 42, 53]
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.DataViz = {
        init: DataVizEngine.initialize.bind(DataVizEngine),
        render: DataVizEngine.processMetrics.bind(DataVizEngine),
        demo: DataVizEngine.injectDemo.bind(DataVizEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DataVizEngine.initialize());
    } else {
        DataVizEngine.initialize();
    }

})();
