/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 181 – GLOBAL BREAKING NEWS ALERT SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Real-time breaking news alert system with instant escalation.
 * 
 * @version 1.0.0
 * @layer 181
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 181,
        name: 'Global Breaking News Alert System',

        urgencyLevels: ['critical', 'high', 'medium'],

        intervals: {
            monitoringCheck: 5000,
            alertPersistence: 30000,
            analyticsUpdate: 60000
        }
    };

    class BreakingNewsAlerts {
        constructor() {
            this.activeAlerts = new Map();
            this.alertQueue = [];
            this.alertHistory = [];
            this.config = null;
            this.stats = {
                totalAlerts: 0,
                criticalAlerts: 0,
                activeAlerts: 0,
                dismissedAlerts: 0
            };

            this.init();
        }

        async init() {
            console.log('🚨 [Layer 181] Breaking News Alerts - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupAlertSystem();
                this.startMonitoring();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 181] Breaking News Alerts - Active');
                this.logAlert('SYSTEM', 'Breaking news alert system initialized');

            } catch (error) {
                console.error('❌ [Layer 181] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer181-breaking-alerts.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupAlertSystem() {
            // Listen for breaking news triggers
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.evaluateForBreakingNews(event.detail.article);
                }
            });

            document.addEventListener('article:updated', (event) => {
                if (event.detail && event.detail.article) {
                    this.evaluateForBreakingNews(event.detail.article);
                }
            });

            document.addEventListener('crisis:activated', (event) => {
                if (event.detail && event.detail.crisis) {
                    this.createCrisisAlert(event.detail.crisis);
                }
            });
        }

        evaluateForBreakingNews(article) {
            if (!article || !article.id) return null;

            const evaluation = {
                articleId: article.id,
                timestamp: new Date().toISOString(),
                isBreaking: false,
                urgency: null,
                indicators: []
            };

            // Check breaking news indicators
            evaluation.indicators = this.detectBreakingIndicators(article);

            if (evaluation.indicators.length > 0) {
                evaluation.urgency = this.calculateUrgency(evaluation.indicators);
                evaluation.isBreaking = evaluation.urgency !== null;

                if (evaluation.isBreaking) {
                    this.createBreakingAlert(article, evaluation);
                }
            }

            return evaluation;
        }

        detectBreakingIndicators(article) {
            const indicators = [];
            const text = `${article.title || ''} ${article.content || ''}`.toLowerCase();

            // Breaking keyword indicators
            const breakingKeywords = ['breaking', 'urgent', 'just in', 'developing', 'update:', 'alert:'];
            breakingKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    indicators.push({ type: 'keyword', value: keyword, weight: 0.7 });
                }
            });

            // High-impact event indicators
            const highImpactKeywords = ['explosion', 'attack', 'disaster', 'emergency', 'death of', 'resignation'];
            highImpactKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    indicators.push({ type: 'high_impact', value: keyword, weight: 0.9 });
                }
            });

            // Recency indicator
            if (article.publishedAt) {
                const publishTime = new Date(article.publishedAt).getTime();
                const now = Date.now();
                const ageMinutes = (now - publishTime) / (1000 * 60);

                if (ageMinutes < 15) {
                    indicators.push({ type: 'recency', value: `${ageMinutes.toFixed(0)}min`, weight: 0.8 });
                }
            }

            // Source credibility indicator
            if (article.sources && article.sources.length > 0) {
                const credibleSources = article.sources.filter(s =>
                    s.credibility === 'high' || s.type === 'official'
                );
                if (credibleSources.length >= 2) {
                    indicators.push({ type: 'credible_sources', value: credibleSources.length, weight: 0.6 });
                }
            }

            // Crisis correlation
            if (window.Layer177_CrisisCoverage) {
                const activeCrises = window.Layer177_CrisisCoverage.getActiveCrises();
                if (activeCrises.length > 0) {
                    indicators.push({ type: 'crisis_correlation', value: 'active_crisis', weight: 1.0 });
                }
            }

            return indicators;
        }

        calculateUrgency(indicators) {
            if (indicators.length === 0) return null;

            const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
            const avgWeight = totalWeight / indicators.length;

            // Determine urgency level
            if (avgWeight >= 0.85 || indicators.some(i => i.type === 'crisis_correlation')) {
                return 'critical';
            } else if (avgWeight >= 0.65) {
                return 'high';
            } else if (avgWeight >= 0.45) {
                return 'medium';
            }

            return null;
        }

        createBreakingAlert(article, evaluation) {
            const alert = {
                id: `alert-${Date.now()}`,
                articleId: article.id,
                title: article.title,
                urgency: evaluation.urgency,
                timestamp: new Date().toISOString(),
                indicators: evaluation.indicators,
                status: 'active',
                dismissedAt: null
            };

            this.activeAlerts.set(alert.id, alert);
            this.alertQueue.push(alert);
            this.stats.totalAlerts++;
            this.stats.activeAlerts++;

            if (alert.urgency === 'critical') {
                this.stats.criticalAlerts++;
            }

            // Display alert
            this.displayAlert(alert);

            // Escalate across platform
            this.escalateBreakingNews(alert, article);

            this.logAlert('CREATED', `Breaking alert: ${article.title} (${alert.urgency})`);

            document.dispatchEvent(new CustomEvent('breaking:alert', {
                detail: { alert, article }
            }));

            return alert;
        }

        createCrisisAlert(crisis) {
            const alert = {
                id: `crisis-alert-${Date.now()}`,
                crisisId: crisis.id,
                title: `${crisis.type.toUpperCase()}: Crisis Alert`,
                urgency: 'critical',
                timestamp: new Date().toISOString(),
                indicators: [{ type: 'crisis', value: crisis.type, weight: 1.0 }],
                status: 'active',
                dismissedAt: null
            };

            this.activeAlerts.set(alert.id, alert);
            this.displayAlert(alert);
            this.stats.totalAlerts++;
            this.stats.criticalAlerts++;
            this.stats.activeAlerts++;

            return alert;
        }

        displayAlert(alert) {
            // Create visual alert
            const alertElement = document.createElement('div');
            alertElement.id = `breaking-alert-${alert.id}`;
            alertElement.className = `breaking-alert breaking-alert-${alert.urgency}`;
            alertElement.innerHTML = `
                <div class="breaking-alert-content">
                    <div class="breaking-alert-badge">
                        <span class="breaking-icon">🔴</span>
                        <span class="breaking-label">BREAKING</span>
                    </div>
                    <div class="breaking-alert-title">${alert.title}</div>
                    <button class="breaking-alert-dismiss" data-alert-id="${alert.id}">×</button>
                </div>
            `;

            // Insert at top of page
            document.body.insertBefore(alertElement, document.body.firstChild);

            // Add dismiss handler
            alertElement.querySelector('.breaking-alert-dismiss').addEventListener('click', () => {
                this.dismissAlert(alert.id);
            });

            // Auto-dismiss after persistence period (except critical)
            if (alert.urgency !== 'critical') {
                setTimeout(() => {
                    this.dismissAlert(alert.id);
                }, CONFIG.intervals.alertPersistence);
            }

            // Animate in
            setTimeout(() => {
                alertElement.classList.add('breaking-alert-visible');
            }, 100);
        }

        dismissAlert(alertId) {
            const alert = this.activeAlerts.get(alertId);
            if (!alert) return;

            alert.status = 'dismissed';
            alert.dismissedAt = new Date().toISOString();
            this.activeAlerts.delete(alertId);
            this.stats.activeAlerts--;
            this.stats.dismissedAlerts++;

            // Add to history
            this.alertHistory.push(alert);
            if (this.alertHistory.length > 100) {
                this.alertHistory.shift();
            }

            // Remove visual alert
            const alertElement = document.getElementById(`breaking-alert-${alertId}`);
            if (alertElement) {
                alertElement.classList.remove('breaking-alert-visible');
                setTimeout(() => alertElement.remove(), 300);
            }

            this.logAlert('DISMISSED', `Alert dismissed: ${alert.title}`);
        }

        escalateBreakingNews(alert, article) {
            // Escalate to all platform sections
            document.dispatchEvent(new CustomEvent('platform:prioritize', {
                detail: {
                    articleId: article.id,
                    urgency: alert.urgency,
                    reason: 'breaking_news'
                }
            }));

            // Escalate to Sovereign Control if critical
            if (alert.urgency === 'critical' && window.Layer180_SovereignControl) {
                window.Layer180_SovereignControl.handleEscalation({
                    domain: 'editorial',
                    type: 'breaking_news_critical',
                    severity: 'high',
                    urgency: 'urgent',
                    articleId: article.id,
                    alertId: alert.id
                });
            }

            // Notify News Distributor
            if (window.Layer150_NewsDistributor) {
                document.dispatchEvent(new CustomEvent('news:breaking', {
                    detail: { article, alert }
                }));
            }

            // Trigger live stream update
            if (window.Layer182_LiveStream) {
                window.Layer182_LiveStream.addBreakingStory(article);
            }
        }

        startMonitoring() {
            console.log('🚀 [Layer 181] Starting breaking news monitoring...');

            setInterval(() => {
                this.monitorNewContent();
            }, CONFIG.intervals.monitoringCheck);
        }

        monitorNewContent() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        // Check if already alerted
                        const alreadyAlerted = Array.from(this.activeAlerts.values())
                            .some(alert => alert.articleId === article.id);

                        if (!alreadyAlerted) {
                            this.evaluateForBreakingNews(article);
                        }
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
                window.SPORTIQ.breakingAlertsStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer181-dashboard';
            dashboard.className = 'layer181-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer181-dashboard-header">
                    <h3>🚨 Breaking Alerts</h3>
                    <button class="layer181-close-btn">×</button>
                </div>
                <div class="layer181-dashboard-content">
                    <div class="layer181-stat">
                        <span class="layer181-stat-label">Total:</span>
                        <span class="layer181-stat-value" id="layer181-total">0</span>
                    </div>
                    <div class="layer181-stat">
                        <span class="layer181-stat-label">Active:</span>
                        <span class="layer181-stat-value" id="layer181-active">0</span>
                    </div>
                    <div class="layer181-stat">
                        <span class="layer181-stat-label">Critical:</span>
                        <span class="layer181-stat-value" id="layer181-critical">0</span>
                    </div>
                    <div class="layer181-alerts" id="layer181-alerts"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer181-toggle-btn';
            toggleBtn.innerHTML = '🚨';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer181-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer181-total');
            const activeEl = document.getElementById('layer181-active');
            const criticalEl = document.getElementById('layer181-critical');

            if (totalEl) totalEl.textContent = this.stats.totalAlerts;
            if (activeEl) activeEl.textContent = this.stats.activeAlerts;
            if (criticalEl) criticalEl.textContent = this.stats.criticalAlerts;

            const alertsEl = document.getElementById('layer181-alerts');
            if (alertsEl) {
                const activeAlerts = Array.from(this.activeAlerts.values());
                if (activeAlerts.length > 0) {
                    alertsEl.innerHTML = '<h4>Active Alerts:</h4>' + activeAlerts.map(alert => `
                        <div class="alert-item alert-${alert.urgency}">
                            <strong>${alert.urgency.toUpperCase()}</strong>
                            <p>${alert.title}</p>
                            <button onclick="window.Layer181_BreakingAlerts.dismissAlert('${alert.id}')">Dismiss</button>
                        </div>
                    `).join('');
                } else {
                    alertsEl.innerHTML = '<p class="no-alerts">No active alerts</p>';
                }
            }
        }

        logAlert(type, message) {
            // Simple logging
        }

        getActiveAlerts() {
            return Array.from(this.activeAlerts.values());
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBreakingAlerts);
    } else {
        initBreakingAlerts();
    }

    function initBreakingAlerts() {
        const alerts = new BreakingNewsAlerts();
        window.Layer181_BreakingAlerts = alerts;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.breakingAlerts = alerts;
        document.dispatchEvent(new CustomEvent('layer181:ready', { detail: { alerts } }));
        console.log('🎯 [Layer 181] Breaking News Alerts - Ready');
    }

})();
