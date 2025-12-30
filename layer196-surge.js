/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 196 – CRISIS LOAD SURGE MANAGEMENT
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Manage extreme traffic surges during global events.
 * 
 * @version 1.0.0
 * @layer 196
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 196,
        name: 'Crisis Load Surge Management'
    };

    class LoadSurgeMgmt {
        constructor() {
            this.currentLoad = 0;
            this.surgeMode = false;
            this.stats = {
                peakLoad: 0,
                surgeActivations: 0,
                requestsThrottled: 0
            };
            this.init();
        }

        async init() {
            console.log('⚡ [Layer 196] Load Surge Management - Initializing...');
            await this.loadConfiguration();
            this.setupSurgeManagement();
            this.startMonitoring();
            this.createDashboard();
            console.log('✅ [Layer 196] Load Surge Management - Active');
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer196-surge.json');
                this.config = response.ok ? await response.json() : CONFIG;
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupSurgeManagement() {
            document.addEventListener('crisis:activated', () => {
                this.activateSurgeMode();
            });
        }

        activateSurgeMode() {
            this.surgeMode = true;
            this.stats.surgeActivations++;
            console.log('⚡ Surge mode activated');

            document.dispatchEvent(new CustomEvent('surge:activated'));
        }

        deactivateSurgeMode() {
            this.surgeMode = false;
            console.log('⚡ Surge mode deactivated');
        }

        startMonitoring() {
            setInterval(() => {
                this.monitorLoad();
            }, 5000);
        }

        monitorLoad() {
            // Simulated load monitoring
            this.currentLoad = Math.random() * 100;
            if (this.currentLoad > this.stats.peakLoad) {
                this.stats.peakLoad = Math.round(this.currentLoad);
            }

            if (this.currentLoad > 80 && !this.surgeMode) {
                this.activateSurgeMode();
            } else if (this.currentLoad < 50 && this.surgeMode) {
                this.deactivateSurgeMode();
            }

            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer196-dashboard';
            dashboard.className = 'layer196-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer196-dashboard-header">
                    <h3>⚡ Load Surge</h3>
                    <button class="layer196-close-btn">×</button>
                </div>
                <div class="layer196-dashboard-content">
                    <div class="layer196-stat">
                        <span class="layer196-stat-label">Current Load:</span>
                        <span class="layer196-stat-value" id="layer196-current">0%</span>
                    </div>
                    <div class="layer196-stat">
                        <span class="layer196-stat-label">Peak:</span>
                        <span class="layer196-stat-value" id="layer196-peak">0%</span>
                    </div>
                    <div class="layer196-stat">
                        <span class="layer196-stat-label">Surge Mode:</span>
                        <span class="layer196-stat-value" id="layer196-surge">OFF</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer196-toggle-btn';
            toggleBtn.innerHTML = '⚡';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer196-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const currentEl = document.getElementById('layer196-current');
            const peakEl = document.getElementById('layer196-peak');
            const surgeEl = document.getElementById('layer196-surge');

            if (currentEl) currentEl.textContent = `${Math.round(this.currentLoad)}%`;
            if (peakEl) peakEl.textContent = `${this.stats.peakLoad}%`;
            if (surgeEl) surgeEl.textContent = this.surgeMode ? 'ACTIVE' : 'OFF';
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSurge);
    } else {
        initSurge();
    }

    function initSurge() {
        const surge = new LoadSurgeMgmt();
        window.Layer196_LoadSurge = surge;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.loadSurge = surge;
        console.log('🎯 [Layer 196] Load Surge Management - Ready');
    }

})();
