/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 177 – GLOBAL CRISIS COVERAGE MODE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Activate special workflows for major global crises.
 * 
 * @version 1.0.0
 * @layer 177
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 177,
        name: 'Global Crisis Coverage Mode',

        crisisTypes: ['natural_disaster', 'pandemic', 'conflict', 'terrorism', 'economic', 'political'],

        activationThresholds: {
            severity: 7, // 1-10 scale
            globalImpact: 0.6, // 60% of regions affected
            urgency: 'high'
        },

        intervals: {
            crisisDetection: 10000,
            updateFrequency: 5000, // More frequent during crisis
            analyticsUpdate: 30000
        }
    };

    class CrisisCoverageMode {
        constructor() {
            this.activeCrises = new Map();
            this.crisisWorkflows = new Map();
            this.crisisLog = [];
            this.config = null;
            this.crisisMode = false;
            this.stats = {
                totalCrises: 0,
                activeCrises: 0,
                crisisArticles: 0,
                liveUpdates: 0
            };

            this.init();
        }

        async init() {
            console.log('🚨 [Layer 177] Crisis Coverage Mode - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupCrisisWorkflows();
                this.startCrisisDetection();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 177] Crisis Coverage Mode - Active');
                this.logCrisis('SYSTEM', 'Crisis coverage mode initialized');

            } catch (error) {
                console.error('❌ [Layer 177] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer177-crisis-coverage.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupCrisisWorkflows() {
            // Natural disaster workflow
            this.addWorkflow({
                type: 'natural_disaster',
                name: 'Natural Disaster Protocol',
                actions: [
                    'enable_live_updates',
                    'create_safety_section',
                    'aggregate_official_sources',
                    'track_affected_areas',
                    'provide_emergency_info'
                ]
            });

            // Pandemic workflow
            this.addWorkflow({
                type: 'pandemic',
                name: 'Pandemic Coverage Protocol',
                actions: [
                    'verify_health_sources',
                    'fact_check_medical_claims',
                    'track_statistics',
                    'provide_safe_links_only',
                    'combat_misinformation'
                ]
            });

            // Conflict workflow
            this.addWorkflow({
                type: 'conflict',
                name: 'Conflict Coverage Protocol',
                actions: [
                    'verify_all_claims',
                    'multiple_source_requirement',
                    'safety_warnings',
                    'humanitarian_focus',
                    'avoid_glorification'
                ]
            });

            // Economic crisis workflow
            this.addWorkflow({
                type: 'economic',
                name: 'Economic Crisis Protocol',
                actions: [
                    'expert_verification',
                    'data_transparency',
                    'avoid_panic',
                    'provide_context',
                    'track_markets'
                ]
            });

            this.logCrisis('WORKFLOWS', `${this.crisisWorkflows.size} crisis workflows configured`);
        }

        addWorkflow(workflow) {
            this.crisisWorkflows.set(workflow.type, workflow);
        }

        detectCrisis(content) {
            if (!content || !content.id) return null;

            try {
                const detection = {
                    contentId: content.id,
                    timestamp: new Date().toISOString(),
                    isCrisis: false,
                    crisisType: null,
                    severity: 0,
                    indicators: []
                };

                // Analyze content for crisis indicators
                const indicators = this.analyzeCrisisIndicators(content);
                detection.indicators = indicators;

                if (indicators.length > 0) {
                    // Calculate severity
                    detection.severity = this.calculateSeverity(indicators);

                    // Determine crisis type
                    detection.crisisType = this.identifyCrisisType(content, indicators);

                    // Check if meets activation threshold
                    if (detection.severity >= CONFIG.activationThresholds.severity) {
                        detection.isCrisis = true;
                        this.activateCrisisMode(detection);
                    }
                }

                this.logCrisis('DETECT', `Content "${content.title}" - Severity: ${detection.severity}/10`);

                return detection;

            } catch (error) {
                console.error(`❌ [Layer 177] Crisis detection failed:`, error);
                return null;
            }
        }

        analyzeCrisisIndicators(content) {
            const indicators = [];
            const text = `${content.title || ''} ${content.content || ''}`.toLowerCase();

            // Natural disaster indicators
            const naturalDisasterKeywords = ['earthquake', 'hurricane', 'tsunami', 'flood', 'wildfire', 'tornado'];
            naturalDisasterKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    indicators.push({ type: 'natural_disaster', keyword, weight: 0.8 });
                }
            });

            // Pandemic indicators
            const pandemicKeywords = ['pandemic', 'epidemic', 'outbreak', 'virus', 'disease spread'];
            pandemicKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    indicators.push({ type: 'pandemic', keyword, weight: 0.9 });
                }
            });

            // Conflict indicators
            const conflictKeywords = ['war', 'conflict', 'attack', 'bombing', 'military operation'];
            conflictKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    indicators.push({ type: 'conflict', keyword, weight: 0.95 });
                }
            });

            // Economic crisis indicators
            const economicKeywords = ['market crash', 'economic crisis', 'recession', 'bank collapse'];
            economicKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    indicators.push({ type: 'economic', keyword, weight: 0.7 });
                }
            });

            // Urgency indicators
            const urgencyKeywords = ['breaking', 'urgent', 'emergency', 'immediate', 'critical'];
            urgencyKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    indicators.push({ type: 'urgency', keyword, weight: 0.5 });
                }
            });

            // Casualty indicators (high severity)
            if (text.match(/\d+\s+(dead|killed|casualties|deaths)/i)) {
                indicators.push({ type: 'casualties', keyword: 'casualties_mentioned', weight: 1.0 });
            }

            return indicators;
        }

        calculateSeverity(indicators) {
            if (indicators.length === 0) return 0;

            const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
            const avgWeight = totalWeight / indicators.length;

            // Base severity on indicators
            let severity = Math.min(indicators.length * 2, 10);

            // Adjust for weight
            severity = severity * avgWeight;

            return Math.min(Math.round(severity), 10);
        }

        identifyCrisisType(content, indicators) {
            const typeCounts = {};

            indicators.forEach(ind => {
                if (ind.type !== 'urgency') {
                    typeCounts[ind.type] = (typeCounts[ind.type] || 0) + ind.weight;
                }
            });

            if (Object.keys(typeCounts).length === 0) return null;

            // Return type with highest weighted count
            return Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
        }

        activateCrisisMode(detection) {
            const crisis = {
                id: `crisis-${Date.now()}`,
                type: detection.crisisType,
                severity: detection.severity,
                activatedAt: new Date().toISOString(),
                status: 'active',
                articles: [],
                updates: []
            };

            this.activeCrises.set(crisis.id, crisis);
            this.stats.totalCrises++;
            this.stats.activeCrises++;

            if (!this.crisisMode) {
                this.crisisMode = true;
                this.enableCrisisMode(crisis);
            }

            // Apply crisis workflow
            this.applyCrisisWorkflow(crisis);

            this.logCrisis('ACTIVATE', `Crisis mode activated - Type: ${crisis.type}, Severity: ${crisis.severity}/10`);

            document.dispatchEvent(new CustomEvent('crisis:activated', {
                detail: { crisis }
            }));
        }

        enableCrisisMode(crisis) {
            // Increase update frequency
            console.log('🚨 CRISIS MODE ACTIVATED');

            // Show crisis banner
            this.showCrisisBanner(crisis);

            // Enable live updates
            this.enableLiveUpdates();

            // Notify other layers
            document.dispatchEvent(new CustomEvent('platform:crisisMode', {
                detail: { enabled: true, crisis }
            }));

            // Reduce non-essential features for performance
            document.dispatchEvent(new CustomEvent('platform:reduceActivity'));
        }

        applyCrisisWorkflow(crisis) {
            const workflow = this.crisisWorkflows.get(crisis.type);

            if (workflow) {
                workflow.actions.forEach(action => {
                    this.executeWorkflowAction(action, crisis);
                });

                this.logCrisis('WORKFLOW', `Applied "${workflow.name}" workflow`);
            }
        }

        executeWorkflowAction(action, crisis) {
            switch (action) {
                case 'enable_live_updates':
                    this.enableLiveUpdates();
                    break;
                case 'verify_health_sources':
                    // Flag for extra verification
                    crisis.requireHealthVerification = true;
                    break;
                case 'multiple_source_requirement':
                    crisis.minSourceCount = 3;
                    break;
                case 'track_statistics':
                    this.initializeStatisticsTracking(crisis);
                    break;
                case 'combat_misinformation':
                    // Activate anti-disinfo layer
                    if (window.Layer163_AntiDisinfo) {
                        window.Layer163_AntiDisinfo.enableCrisisMode();
                    }
                    break;
            }
        }

        enableLiveUpdates() {
            this.stats.liveUpdates++;

            // Create live update ticker
            this.createLiveUpdateTicker();
        }

        createLiveUpdateTicker() {
            let ticker = document.getElementById('crisis-live-ticker');

            if (!ticker) {
                ticker = document.createElement('div');
                ticker.id = 'crisis-live-ticker';
                ticker.className = 'crisis-live-ticker';
                ticker.innerHTML = `
                    <div class="ticker-header">
                        <span class="ticker-icon">🔴 LIVE</span>
                        <span class="ticker-title">Crisis Coverage - Live Updates</span>
                    </div>
                    <div class="ticker-content" id="ticker-updates"></div>
                `;
                document.body.appendChild(ticker);
            }
        }

        initializeStatisticsTracking(crisis) {
            crisis.statistics = {
                casualtyCount: 0,
                affectedRegions: [],
                lastUpdate: new Date().toISOString()
            };
        }

        showCrisisBanner(crisis) {
            const banner = document.createElement('div');
            banner.className = 'crisis-banner';
            banner.innerHTML = `
                <div class="crisis-banner-content">
                    <span class="crisis-icon">🚨</span>
                    <div class="crisis-info">
                        <strong>CRISIS COVERAGE MODE</strong>
                        <p>${this.getCrisisDescription(crisis.type)} - Severity ${crisis.severity}/10</p>
                    </div>
                    <button class="crisis-details-btn">Details</button>
                </div>
            `;

            document.body.insertBefore(banner, document.body.firstChild);

            banner.querySelector('.crisis-details-btn').addEventListener('click', () => {
                this.showCrisisDetails(crisis);
            });
        }

        getCrisisDescription(type) {
            const descriptions = {
                natural_disaster: 'Natural Disaster',
                pandemic: 'Public Health Emergency',
                conflict: 'Armed Conflict',
                terrorism: 'Security Threat',
                economic: 'Economic Crisis',
                political: 'Political Crisis'
            };
            return descriptions[type] || 'Major Crisis Event';
        }

        showCrisisDetails(crisis) {
            // Implementation for crisis details modal
            console.log('Crisis details:', crisis);
        }

        deactivateCrisisMode(crisisId) {
            const crisis = this.activeCrises.get(crisisId);
            if (!crisis) return;

            crisis.status = 'resolved';
            crisis.resolvedAt = new Date().toISOString();
            this.stats.activeCrises--;

            if (this.stats.activeCrises === 0) {
                this.crisisMode = false;
                this.disableCrisisMode();
            }

            this.logCrisis('DEACTIVATE', `Crisis resolved - Type: ${crisis.type}`);

            document.dispatchEvent(new CustomEvent('crisis:deactivated', {
                detail: { crisis }
            }));
        }

        disableCrisisMode() {
            console.log('✅ CRISIS MODE DEACTIVATED');

            // Remove crisis banner
            const banner = document.querySelector('.crisis-banner');
            if (banner) banner.remove();

            // Remove live ticker
            const ticker = document.getElementById('crisis-live-ticker');
            if (ticker) ticker.remove();

            document.dispatchEvent(new CustomEvent('platform:crisisMode', {
                detail: { enabled: false }
            }));
        }

        startCrisisDetection() {
            console.log('🚀 [Layer 177] Starting crisis detection...');

            setInterval(() => {
                this.monitorForCrises();
            }, CONFIG.intervals.crisisDetection);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    const detection = this.detectCrisis(event.detail.article);
                    if (detection && detection.isCrisis) {
                        this.stats.crisisArticles++;
                    }
                }
            });
        }

        monitorForCrises() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        this.detectCrisis(article);
                    });
                }
            }
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.crisisCoverageStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer177-dashboard';
            dashboard.className = 'layer177-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer177-dashboard-header">
                    <h3>🚨 Crisis Coverage</h3>
                    <button class="layer177-close-btn">×</button>
                </div>
                <div class="layer177-dashboard-content">
                    <div class="layer177-stat">
                        <span class="layer177-stat-label">Mode:</span>
                        <span class="layer177-stat-value" id="layer177-mode">Standby</span>
                    </div>
                    <div class="layer177-stat">
                        <span class="layer177-stat-label">Active Crises:</span>
                        <span class="layer177-stat-value" id="layer177-active">0</span>
                    </div>
                    <div class="layer177-stat">
                        <span class="layer177-stat-label">Total:</span>
                        <span class="layer177-stat-value" id="layer177-total">0</span>
                    </div>
                    <div class="layer177-log" id="layer177-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer177-toggle-btn';
            toggleBtn.innerHTML = '🚨';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer177-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const modeEl = document.getElementById('layer177-mode');
            const activeEl = document.getElementById('layer177-active');
            const totalEl = document.getElementById('layer177-total');

            if (modeEl) modeEl.textContent = this.crisisMode ? 'ACTIVE' : 'Standby';
            if (activeEl) activeEl.textContent = this.stats.activeCrises;
            if (totalEl) totalEl.textContent = this.stats.totalCrises;

            const logEl = document.getElementById('layer177-log');
            if (logEl && this.crisisLog.length > 0) {
                const recentLogs = this.crisisLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer177-log-entry">
                        <span class="layer177-log-type">${log.type}</span>
                        <span class="layer177-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logCrisis(type, message) {
            this.crisisLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.crisisLog.length > 100) this.crisisLog.shift();
        }

        getActiveCrises() {
            return Array.from(this.activeCrises.values()).filter(c => c.status === 'active');
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCrisisCoverage);
    } else {
        initCrisisCoverage();
    }

    function initCrisisCoverage() {
        const coverage = new CrisisCoverageMode();
        window.Layer177_CrisisCoverage = coverage;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.crisisCoverage = coverage;
        document.dispatchEvent(new CustomEvent('layer177:ready', { detail: { coverage } }));
        console.log('🎯 [Layer 177] Crisis Coverage Mode - Ready');
    }

})();
