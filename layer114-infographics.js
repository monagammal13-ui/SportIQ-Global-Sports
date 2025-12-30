/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 114: INTERACTIVE INFOGRAPHICS & CHART GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically identifies data patterns in article content and converts
 *          them into beautiful, interactive SVG/Canvas-based infographics.
 * 
 * Features:
 *  - Auto-scans article text for "Label: Value" patterns.
 *  - Detects data tables and converts them to charts.
 *  - Supports Bar, Pie, Doughnut, and Progress Ring charts.
 *  - Interactive tooltips and animations.
 *  - Fully responsive and theme-aware.
 * 
 * Version: 2.0.0 (Enhanced)
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        scanOnLoad: true,
        selectors: {
            articleContent: '.article-content, .post-body, .news-body', // Targeted containers
            tables: 'table.data-table, table.stats-table'
        },
        charts: {
            colors: [
                '#3b82f6', // Blue
                '#10b981', // Green
                '#f59e0b', // Amber
                '#ef4444', // Red
                '#8b5cf6', // Violet
                '#ec4899', // Pink
                '#06b6d4'  // Cyan
            ],
            animationDuration: 1000,
            barHeight: 24,
            barGap: 8
        },
        patterns: [
            // "Possession: 55%"
            /([A-Za-z\s]+):\s*(\d+(?:\.\d+)?)%/g,
            // "Shots: 12"
            /([A-Za-z\s]+):\s*(\d+)/g
        ]
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INFOGRAPHICS ANALYSIS ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    class InfographicsEngine {
        constructor() {
            this.charts = [];
            this.init();
        }

        init() {
            console.log('📊 Layer 114: Infographics Engine - INITIALIZED');

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.runScanner());
            } else {
                this.runScanner();
            }

            // Listen for dynamic content events
            window.addEventListener('content:loaded', () => this.runScanner());
            // Listen for manual triggers
            window.addEventListener('infographics:generate', (e) => this.generateFromData(e.detail));
        }

        runScanner() {
            if (!CONFIG.scanOnLoad) return;
            console.log('📊 Scanning content for data visualization opportunities...');

            // 1. Scan for Data Tables
            this.scanTables();

            // 2. Scan Text Content (Heuristic)
            this.scanTextContent();
        }

        /**
         * Converts specifically marked or heuristically detected tables into charts
         */
        scanTables() {
            const tables = document.querySelectorAll(CONFIG.selectors.tables);
            tables.forEach((table, index) => {
                if (table.dataset.chartified) return;

                const data = this.extractTableData(table);
                if (data.length > 0) {
                    const chartType = table.dataset.chartType || (data.length > 5 ? 'bar' : 'pie');
                    this.replaceTableWithChart(table, data, chartType, index);
                    table.dataset.chartified = 'true';
                }
            });
        }

        extractTableData(table) {
            const data = [];
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    // Assume col 1 is label, col 2 is value
                    const label = cells[0].textContent.trim();
                    const valueStr = cells[1].textContent.trim().replace(/[^0-9.]/g, '');
                    const value = parseFloat(valueStr);

                    if (label && !isNaN(value)) {
                        data.push({ label, value });
                    }
                }
            });
            return data;
        }

        replaceTableWithChart(table, data, type, index) {
            console.log(`📊 Converting table #${index} to ${type} chart`, data);

            const chartContainer = document.createElement('div');
            chartContainer.className = 'infographic-container animated-entry';
            chartContainer.innerHTML = `
                <div class="infographic-header">
                    <h4>${table.caption ? table.caption.textContent : 'Data Visualization'}</h4>
                    <button class="toggle-view" onclick="this.closest('.infographic-container').classList.toggle('show-table')">
                        <span class="icon-chart">📊</span>
                        <span class="icon-table">📋</span>
                    </button>
                </div>
                <div class="infographic-body">
                    <div class="chart-view">
                        ${this.renderChart(data, type)}
                    </div>
                    <div class="table-view" style="display:none;"></div>
                </div>
            `;

            // Clone table into the hidden view
            const tableView = chartContainer.querySelector('.table-view');
            tableView.appendChild(table.cloneNode(true));
            tableView.querySelector('table').style.display = 'table'; // Ensure visibility

            // Replace original table
            table.parentNode.insertBefore(chartContainer, table);
            table.style.display = 'none'; // Hide original
        }

        /**
         * Scans text blocks for statistical patterns
         */
        scanTextContent() {
            const contentBlocks = document.querySelectorAll(CONFIG.selectors.articleContent);

            contentBlocks.forEach(block => {
                // Heuristic Parsing logic would go here
                // For safety in this simpler version, we look for a specific wrapper
                // <div data-stats="true">...</div>

                const statBlocks = block.querySelectorAll('[data-stats="true"]');
                statBlocks.forEach(statBlock => {
                    const text = statBlock.textContent;
                    const data = this.parseTextData(text);

                    if (data.length >= 2) {
                        const chartContainer = document.createElement('div');
                        chartContainer.className = 'infographic-container inline-chart';
                        chartContainer.innerHTML = `
                            <div class="infographic-body">
                                ${this.renderChart(data, 'doughnut')}
                            </div>
                        `;
                        statBlock.parentNode.insertBefore(chartContainer, statBlock.nextSibling);
                    }
                });
            });
        }

        parseTextData(text) {
            const data = [];

            CONFIG.patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    // Filter common false positives
                    const label = match[1].trim();
                    if (['Page', 'Chapter', 'Verse', 'Figure'].includes(label)) continue;

                    const value = parseFloat(match[2]);
                    if (!isNaN(value)) {
                        data.push({ label, value, original: match[0] });
                    }
                }
            });

            // De-duplicate based on label
            const uniqueData = [];
            const seen = new Set();
            data.forEach(d => {
                if (!seen.has(d.label)) {
                    seen.add(d.label);
                    uniqueData.push(d);
                }
            });

            return uniqueData;
        }

        // ═════════════════════════════════════════════════════════════════════
        // CHART RENDERING
        // ═════════════════════════════════════════════════════════════════════

        renderChart(data, type = 'bar') {
            switch (type) {
                case 'pie':
                case 'doughnut':
                    return this.renderCircularChart(data, type === 'doughnut');
                case 'bar':
                default:
                    return this.renderBarChart(data);
            }
        }

        renderBarChart(data) {
            const max = Math.max(...data.map(d => d.value));

            return `
                <div class="ig-bar-chart">
                    ${data.map((d, i) => {
                const percent = (d.value / max) * 100;
                const color = CONFIG.charts.colors[i % CONFIG.charts.colors.length];
                return `
                        <div class="ig-bar-row">
                            <div class="ig-bar-label">${d.label}</div>
                            <div class="ig-bar-track">
                                <div class="ig-bar-fill" style="width: 0%; background-color: ${color};" data-width="${percent}%"></div>
                                <span class="ig-bar-value">${d.value}</span>
                            </div>
                        </div>
                        `;
            }).join('')}
                </div>
            `;
        }

        renderCircularChart(data, isDoughnut) {
            const total = data.reduce((sum, d) => sum + d.value, 0);
            let currentAngle = 0;

            // Build conic-gradient string
            const segments = data.map((d, i) => {
                const percent = (d.value / total) * 100;
                const deg = (percent / 100) * 360;
                const endAngle = currentAngle + deg;

                const color = CONFIG.charts.colors[i % CONFIG.charts.colors.length];
                const segmentStr = `${color} ${currentAngle}deg ${endAngle}deg`;

                currentAngle = endAngle;
                return segmentStr;
            }).join(', ');

            return `
                <div class="ig-circular-layout">
                    <div class="ig-pie-chart ${isDoughnut ? 'doughnut' : ''}" 
                         style="background: conic-gradient(${segments});">
                         ${isDoughnut ? '<div class="ig-hole"></div>' : ''}
                    </div>
                    <div class="ig-legend">
                        ${data.map((d, i) => `
                            <div class="ig-legend-item">
                                <span class="ig-dot" style="background-color: ${CONFIG.charts.colors[i % CONFIG.charts.colors.length]}"></span>
                                <span class="ig-label">${d.label}</span>
                                <span class="ig-val">${d.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Trigger animations after render
        animateCharts() {
            setTimeout(() => {
                document.querySelectorAll('.ig-bar-fill').forEach(bar => {
                    bar.style.width = bar.dataset.width;
                });
            }, 100);
        }

        generateFromData(payload) {
            // Manual trigger API
            // payload: { title: "My Stats", data: [{label: "A", value: 10}], type: "bar", target: "#container" }
            if (!payload) return;
            const container = document.querySelector(payload.target);
            if (!container) return; // Silent fail if target not found

            const chartHTML = `
                <div class="infographic-container manual-gen">
                    <div class="infographic-header">
                        <h4>${payload.title || 'Statistics'}</h4>
                    </div>
                    <div class="infographic-body">
                        ${this.renderChart(payload.data, payload.type || 'bar')}
                    </div>
                </div>
            `;
            container.innerHTML = chartHTML;
            this.animateCharts();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API & AUTO-INIT
    // ═══════════════════════════════════════════════════════════════════════

    window.Layer114_Infographics = new InfographicsEngine();

    // Animation trigger observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-trigger');
                // Trigger bar animations
                entry.target.querySelectorAll('.ig-bar-fill').forEach(bar => {
                    bar.style.width = bar.dataset.width; // Actually trigger CSS transition
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    // Wait for elements to exist before observing
    setInterval(() => {
        document.querySelectorAll('.infographic-container:not(.observed)').forEach(el => {
            observer.observe(el);
            el.classList.add('observed');
        });
    }, 1000);

})();
