/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 198 – PUBLIC TRANSPARENCY & ETHICS DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Expose transparency metrics, corrections history, and ethics policies.
 * 
 * @version 1.0.0
 * @layer 198
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 198,
        name: 'Public Transparency & Ethics Dashboard'
    };

    class TransparencyDashboard {
        constructor() {
            this.transparencyMetrics = {
                totalArticles: 0,
                corrections: 0,
                retractions: 0,
                sourceVerifications: 0,
                ethicsScore: 100
            };
            this.stats = {
                publicViews: 0,
                lastUpdated: null
            };
            this.init();
        }

        async init() {
            console.log('📊 [Layer 198] Transparency Dashboard - Initializing...');
            await this.loadConfiguration();
            this.setupDashboard();
            this.aggregateMetrics();
            this.createPublicDashboard();
            console.log('✅ [Layer 198] Transparency Dashboard - Active');
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer198-transparency.json');
                this.config = response.ok ? await response.json() : CONFIG;
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupDashboard() {
            // Collect metrics from other layers
            setInterval(() => {
                this.aggregateMetrics();
            }, 60000);
        }

        aggregateMetrics() {
            // Aggregate from corrections layer
            if (window.Layer190_Corrections) {
                const correctionStats = window.Layer190_Corrections.getStats();
                this.transparencyMetrics.corrections = correctionStats.totalCorrections || 0;
                this.transparencyMetrics.retractions = correctionStats.retractions || 0;
            }

            // Aggregate from source provenance
            if (window.Layer183_SourceProvenance) {
                const provenanceStats = window.Layer183_SourceProvenance.getStats();
                this.transparencyMetrics.sourceVerifications = provenanceStats.verifiedSources || 0;
            }

            // Calculate ethics score
            this.transparencyMetrics.ethicsScore = this.calculateEthicsScore();
            this.stats.lastUpdated = new Date().toISOString();

            this.updatePublicDashboard();
        }

        calculateEthicsScore() {
            let score = 100;

            // Deduct for corrections ratio
            const correctionRatio = this.transparencyMetrics.corrections /
                Math.max(this.transparencyMetrics.totalArticles, 1);
            score -= correctionRatio * 10;

            // Deduct for retractions
            score -= this.transparencyMetrics.retractions * 2;

            return Math.max(Math.round(score), 0);
        }

        createPublicDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'public-transparency-dashboard';
            dashboard.className = 'public-transparency-dashboard';
            dashboard.innerHTML = `
                <div class="transparency-header">
                    <h2>📊 Platform Transparency & Ethics</h2>
                    <p class="transparency-subtitle">Our commitment to accountability and ethical journalism</p>
                </div>
                <div class="transparency-metrics">
                    <div class="metric-card">
                        <div class="metric-value" id="trans-corrections">0</div>
                        <div class="metric-label">Total Corrections</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="trans-retractions">0</div>
                        <div class="metric-label">Retractions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="trans-sources">0</div>
                        <div class="metric-label">Verified Sources</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="trans-ethics">100</div>
                        <div class="metric-label">Ethics Score</div>
                    </div>
                </div>
                <div class="transparency-footer">
                    <p>Last Updated: <span id="trans-updated">Just now</span></p>
                    <button class="view-ethics-policy-btn">View Full Ethics Policy</button>
                </div>
            `;

            // Insert into page (if transparency section exists)
            const container = document.querySelector('.transparency-container') || document.body;
            container.appendChild(dashboard);

            // Also create toggle dashboard
            this.createToggleDashboard();
        }

        createToggleDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer198-dashboard';
            dashboard.className = 'layer198-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer198-dashboard-header">
                    <h3>📊 Transparency</h3>
                    <button class="layer198-close-btn">×</button>
                </div>
                <div class="layer198-dashboard-content">
                    <div class="layer198-stat">
                        <span class="layer198-stat-label">Ethics Score:</span>
                        <span class="layer198-stat-value" id="layer198-ethics">100</span>
                    </div>
                    <div class="layer198-stat">
                        <span class="layer198-stat-label">Public Views:</span>
                        <span class="layer198-stat-value" id="layer198-views">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer198-toggle-btn';
            toggleBtn.innerHTML = '📊';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer198-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updatePublicDashboard() {
            const correctionsEl = document.getElementById('trans-corrections');
            const retractionsEl = document.getElementById('trans-retractions');
            const sourcesEl = document.getElementById('trans-sources');
            const ethicsEl = document.getElementById('trans-ethics');
            const updatedEl = document.getElementById('trans-updated');

            if (correctionsEl) correctionsEl.textContent = this.transparencyMetrics.corrections;
            if (retractionsEl) retractionsEl.textContent = this.transparencyMetrics.retractions;
            if (sourcesEl) sourcesEl.textContent = this.transparencyMetrics.sourceVerifications;
            if (ethicsEl) ethicsEl.textContent = this.transparencyMetrics.ethicsScore;
            if (updatedEl) updatedEl.textContent = new Date(this.stats.lastUpdated).toLocaleString();

            // Update toggle dashboard
            const ethicsToggleEl = document.getElementById('layer198-ethics');
            if (ethicsToggleEl) ethicsToggleEl.textContent = this.transparencyMetrics.ethicsScore;
        }

        getStats() {
            return { ...this.stats, metrics: this.transparencyMetrics };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTransparency);
    } else {
        initTransparency();
    }

    function initTransparency() {
        const transparency = new TransparencyDashboard();
        window.Layer198_Transparency = transparency;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.transparency = transparency;
        console.log('🎯 [Layer 198] Transparency Dashboard - Ready');
    }

})();
