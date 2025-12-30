/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 164 – VIRAL PROPAGATION CONTROL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Control and regulate how content spreads virally to prevent 
 * distortion or manipulation.
 * 
 * @version 1.0.0
 * @layer 164
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 164,
        name: 'Viral Propagation Control',

        velocityLimits: {
            verified: 1000,    // shares per hour
            trusted: 500,
            unverified: 100,
            suspicious: 20
        },

        qualityGates: {
            evidenceScore: 60,
            trustScore: 0.6,
            biasBalance: 0.5
        },

        intervals: {
            trackingUpdate: 3000,
            throttleCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class ViralPropagationControl {
        constructor() {
            this.articleMetrics = new Map();
            this.throttledArticles = new Set();
            this.propagationLog = [];
            this.config = null;
            this.stats = {
                totalTracked: 0,
                throttled: 0,
                allowedViral: 0,
                mutationDetected: 0
            };

            this.init();
        }

        async init() {
            console.log('🔒 [Layer 164] Viral Propagation Control - Initializing...');

            try {
                await this.loadConfiguration();
                this.startTrackingEngine();
                this.startThrottleEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 164] Viral Propagation Control - Active');
                this.logPropagation('SYSTEM', 'Viral control system activated');

            } catch (error) {
                console.error('❌ [Layer 164] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer164-viral-control.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        trackPropagation(article) {
            if (!article || !article.id) return null;

            try {
                let metrics = this.articleMetrics.get(article.id);

                if (!metrics) {
                    metrics = {
                        articleId: article.id,
                        shares: 0,
                        velocity: 0,
                        lastUpdate: Date.now(),
                        qualityStatus: this.checkQualityGate(article),
                        velocityLimit: this.determineVelocityLimit(article),
                        throttled: false,
                        mutationDetected: false,
                        timestamp: new Date().toISOString()
                    };

                    this.articleMetrics.set(article.id, metrics);
                    this.stats.totalTracked++;
                }

                // Calculate current velocity
                const timeDiff = (Date.now() - metrics.lastUpdate) / (1000 * 60 * 60); // hours
                if (timeDiff > 0) {
                    metrics.velocity = metrics.shares / timeDiff;
                }

                // Check if throttling needed
                if (metrics.velocity > metrics.velocityLimit) {
                    this.throttleArticle(article, metrics);
                }

                // Update timestamp
                metrics.lastUpdate = Date.now();

                this.logPropagation('TRACK', `Article "${article.title}" - Velocity: ${metrics.velocity.toFixed(0)}/hr (Limit: ${metrics.velocityLimit})`);

                document.dispatchEvent(new CustomEvent('article:propagation-tracked', {
                    detail: { article, metrics }
                }));

                return metrics;

            } catch (error) {
                console.error(`❌ [Layer 164] Tracking failed for article ${article.id}:`, error);
                return null;
            }
        }

        checkQualityGate(article) {
            const checks = {
                evidencePassed: false,
                trustPassed: false,
                biasPassed: false
            };

            // Check evidence score
            if (window.Layer161_EvidenceScoring) {
                const evidenceData = window.Layer161_EvidenceScoring.getEvidenceScore(article.id);
                if (evidenceData) {
                    checks.evidencePassed = evidenceData.evidenceScore >= CONFIG.qualityGates.evidenceScore;
                }
            }

            // Check trust score
            if (window.Layer159_TrustSignals) {
                const trustData = window.Layer159_TrustSignals.getTrustData(article.id);
                if (trustData) {
                    checks.trustPassed = trustData.trustScore >= CONFIG.qualityGates.trustScore;
                }
            }

            // Check bias balance
            if (window.Layer162_BiasDetection) {
                const biasData = window.Layer162_BiasDetection.getAnalysis(article.id);
                if (biasData) {
                    checks.biasPassed = biasData.balanceScore >= CONFIG.qualityGates.biasBalance;
                }
            }

            return checks;
        }

        determineVelocityLimit(article) {
            // Check disinformation risk
            if (window.Layer163_AntiDisinfo) {
                const check = window.Layer163_AntiDisinfo.getCheck(article.id);
                if (check && check.riskScore >= 0.5) {
                    return CONFIG.velocityLimits.suspicious;
                }
            }

            // Check trust level
            if (window.Layer159_TrustSignals) {
                const trustData = window.Layer159_TrustSignals.getTrustData(article.id);
                if (trustData) {
                    if (trustData.trustLevel.label === 'Verified') {
                        return CONFIG.velocityLimits.verified;
                    } else if (trustData.trustLevel.label === 'Trusted Source') {
                        return CONFIG.velocityLimits.trusted;
                    }
                }
            }

            return CONFIG.velocityLimits.unverified;
        }

        throttleArticle(article, metrics) {
            if (metrics.throttled) return;

            metrics.throttled = true;
            this.throttledArticles.add(article.id);
            this.stats.throttled++;

            console.warn(`⚠️ [Layer 164] THROTTLED: "${article.title}" - Velocity: ${metrics.velocity.toFixed(0)}/hr exceeds limit of ${metrics.velocityLimit}/hr`);

            // Apply visual throttle indicator
            this.attachThrottleIndicator(article, metrics);

            // Reduce amplification
            if (window.Layer158_TopicAmplification) {
                // De-amplify the article
                const amplification = window.Layer158_TopicAmplification.amplifiedTopics.get(article.id);
                if (amplification) {
                    amplification.channels = amplification.channels.filter(c => c !== 'push' && c !== 'social');
                }
            }

            // Lower priority
            if (window.Layer160_PriorityIndex) {
                const priority = window.Layer160_PriorityIndex.getArticlePriority(article.id);
                if (priority) {
                    priority.priorityScore *= 0.5; // Reduce priority by 50%
                }
            }

            this.logPropagation('THROTTLE', `Viral spread throttled for "${article.title}"`);
        }

        attachThrottleIndicator(article, metrics) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            const indicator = document.createElement('div');
            indicator.className = 'throttle-indicator';
            indicator.style.cssText = `
                background-color: #f59e0b;
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                margin: 6px 0;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            indicator.innerHTML = `
                <span>🐌</span>
                <span>Viral Spread Throttled: Exceeds velocity limit (${metrics.velocity.toFixed(0)}/${metrics.velocityLimit} per hour)</span>
            `;

            articleElement.appendChild(indicator);
        }

        detectMutation(article) {
            // Placeholder for mutation detection
            // In production, this would compare shared versions against original
            const mutationLikelihood = Math.random();

            if (mutationLikelihood > 0.9) {
                const metrics = this.articleMetrics.get(article.id);
                if (metrics) {
                    metrics.mutationDetected = true;
                    this.stats.mutationDetected++;
                    console.warn(`🔄 [Layer 164] Content mutation detected for "${article.title}"`);
                }
            }
        }

        simulateShare(articleId) {
            const metrics = this.articleMetrics.get(articleId);
            if (metrics) {
                metrics.shares++;
            }
        }

        startTrackingEngine() {
            console.log('🚀 [Layer 164] Starting viral tracking...');

            setInterval(() => {
                this.updatePropagationMetrics();
            }, CONFIG.intervals.trackingUpdate);

            document.addEventListener('article:amplified', (event) => {
                if (event.detail && event.detail.article) {
                    this.trackPropagation(event.detail.article);
                }
            });
        }

        updatePropagationMetrics() {
            this.articleMetrics.forEach((metrics, articleId) => {
                if (window.Layer150_NewsDistributor) {
                    const article = window.Layer150_NewsDistributor.getArticle(articleId);
                    if (article) {
                        this.trackPropagation(article);
                    }
                }
            });
        }

        startThrottleEngine() {
            setInterval(() => {
                this.reviewThrottles();
            }, CONFIG.intervals.throttleCheck);
        }

        reviewThrottles() {
            // Review throttled articles and remove throttle if velocity normalized
            this.throttledArticles.forEach(articleId => {
                const metrics = this.articleMetrics.get(articleId);
                if (metrics && metrics.velocity <= metrics.velocityLimit * 0.8) {
                    metrics.throttled = false;
                    this.throttledArticles.delete(articleId);
                    this.logPropagation('UNTHROTTLE', `Throttle removed for article ${articleId}`);
                }
            });
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.viralControlStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer164-dashboard';
            dashboard.className = 'layer164-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer164-dashboard-header">
                    <h3>🔒 Viral Control</h3>
                    <button class="layer164-close-btn">×</button>
                </div>
                <div class="layer164-dashboard-content">
                    <div class="layer164-stat">
                        <span class="layer164-stat-label">Tracked:</span>
                        <span class="layer164-stat-value" id="layer164-total">0</span>
                    </div>
                    <div class="layer164-stat">
                        <span class="layer164-stat-label">🐌 Throttled:</span>
                        <span class="layer164-stat-value" id="layer164-throttled">0</span>
                    </div>
                    <div class="layer164-stat">
                        <span class="layer164-stat-label">Mutations:</span>
                        <span class="layer164-stat-value" id="layer164-mutations">0</span>
                    </div>
                    <div class="layer164-log" id="layer164-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer164-toggle-btn';
            toggleBtn.innerHTML = '🔒';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer164-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer164-total');
            const throttledEl = document.getElementById('layer164-throttled');
            const mutationsEl = document.getElementById('layer164-mutations');

            if (totalEl) totalEl.textContent = this.stats.totalTracked;
            if (throttledEl) throttledEl.textContent = this.stats.throttled;
            if (mutationsEl) mutationsEl.textContent = this.stats.mutationDetected;

            const logEl = document.getElementById('layer164-log');
            if (logEl && this.propagationLog.length > 0) {
                const recentLogs = this.propagationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer164-log-entry">
                        <span class="layer164-log-type">${log.type}</span>
                        <span class="layer164-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logPropagation(type, message) {
            this.propagationLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.propagationLog.length > 100) this.propagationLog.shift();
        }

        getMetrics(articleId) {
            return this.articleMetrics.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initViralControl);
    } else {
        initViralControl();
    }

    function initViralControl() {
        const control = new ViralPropagationControl();
        window.Layer164_ViralControl = control;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.viralControl = control;
        document.dispatchEvent(new CustomEvent('layer164:ready', { detail: { control } }));
        console.log('🎯 [Layer 164] Viral Propagation Control - Ready');
    }

})();
