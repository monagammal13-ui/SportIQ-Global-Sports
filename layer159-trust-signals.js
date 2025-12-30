/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 159 – TRUST, CREDIBILITY & SOURCE SIGNALS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Attaches trust indicators, source credibility markers, and 
 * verification status to all articles.
 * 
 * @version 1.0.0
 * @layer 159
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 159,
        name: 'Trust, Credibility & Source Signals',

        trustLevels: {
            verified: { score: 1.0, label: 'Verified', icon: '✓', color: '#10b981' },
            trusted: { score: 0.8, label: 'Trusted Source', icon: '🔒', color: '#3b82f6' },
            credible: { score: 0.6, label: 'Credible', icon: '📰', color: '#6366f1' },
            unverified: { score: 0.4, label: 'Unverified', icon: '❓', color: '#f59e0b' },
            caution: { score: 0.2, label: 'Use Caution', icon: '⚠️', color: '#ef4444' }
        },

        credibilityFactors: {
            hasAuthor: 0.2,
            hasSources: 0.3,
            hasVerification: 0.3,
            editorialQuality: 0.2
        },

        intervals: {
            verificationCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class TrustCredibilityEngine {
        constructor() {
            this.articleTrust = new Map();
            this.verificationQueue = [];
            this.verificationLog = [];
            this.config = null;
            this.stats = {
                totalVerified: 0,
                verified: 0,
                trusted: 0,
                credible: 0,
                unverified: 0,
                averageTrustScore: 0
            };

            this.init();
        }

        async init() {
            console.log('🔒 [Layer 159] Trust & Credibility Signals - Initializing...');

            try {
                await this.loadConfiguration();
                this.startVerificationEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 159] Trust & Credibility Signals - Active');
                this.logVerification('SYSTEM', 'Trust engine initialized');

            } catch (error) {
                console.error('❌ [Layer 159] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer159-trust-signals.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        verifyArticle(article) {
            if (!article || !article.id) return null;

            try {
                const trustData = {
                    articleId: article.id,
                    trustScore: 0,
                    trustLevel: null,
                    indicators: [],
                    sources: [],
                    verificationStatus: 'pending',
                    timestamp: new Date().toISOString()
                };

                // Calculate trust score
                trustData.trustScore = this.calculateTrustScore(article);
                trustData.trustLevel = this.getTrustLevel(trustData.trustScore);

                // Extract trust indicators
                trustData.indicators = this.extractTrustIndicators(article);

                // Identify sources
                trustData.sources = this.identifySources(article);

                // Determine verification status
                trustData.verificationStatus = this.determineVerificationStatus(article, trustData);

                // Store trust data
                this.articleTrust.set(article.id, trustData);
                this.stats.totalVerified++;
                this.updateStats(trustData.trustLevel);
                this.updateAverageTrustScore(trustData.trustScore);

                // Attach trust badge to article
                this.attachTrustBadge(article, trustData);

                this.logVerification('VERIFY', `Article "${article.title}" - Trust: ${trustData.trustLevel.label} (${(trustData.trustScore * 100).toFixed(1)}%)`);

                document.dispatchEvent(new CustomEvent('article:trust-verified', {
                    detail: { article, trustData }
                }));

                return trustData;

            } catch (error) {
                console.error(`❌ [Layer 159] Verification failed for article ${article.id}:`, error);
                return null;
            }
        }

        calculateTrustScore(article) {
            let score = 0;

            // Has author
            if (article.author) {
                score += CONFIG.credibilityFactors.hasAuthor;
            }

            // Has sources
            if (article.sources && article.sources.length > 0) {
                score += CONFIG.credibilityFactors.hasSources;
            }

            // Has verification (from Layer 153 quality check)
            if (window.Layer153_QualityValidator) {
                const validation = window.Layer153_QualityValidator.getValidation(article.id);
                if (validation && validation.passed) {
                    score += CONFIG.credibilityFactors.hasVerification;
                    score += (validation.qualityScore / 100) * CONFIG.credibilityFactors.editorialQuality;
                }
            }

            // Official source indicator
            if (article.official || article.verified) {
                score += 0.1;
            }

            return Math.min(1, score);
        }

        getTrustLevel(score) {
            if (score >= 0.9) return CONFIG.trustLevels.verified;
            if (score >= 0.7) return CONFIG.trustLevels.trusted;
            if (score >= 0.5) return CONFIG.trustLevels.credible;
            if (score >= 0.3) return CONFIG.trustLevels.unverified;
            return CONFIG.trustLevels.caution;
        }

        extractTrustIndicators(article) {
            const indicators = [];

            if (article.author) {
                indicators.push({ type: 'author', label: 'Byline Present', value: article.author });
            }

            if (article.sources && article.sources.length > 0) {
                indicators.push({ type: 'sources', label: 'Sources Cited', value: article.sources.length });
            }

            if (article.publishedAt) {
                indicators.push({ type: 'timestamp', label: 'Publication Date', value: article.publishedAt });
            }

            if (article.verified) {
                indicators.push({ type: 'verified', label: 'Verified', value: true });
            }

            return indicators;
        }

        identifySources(article) {
            const sources = [];

            if (article.sources && Array.isArray(article.sources)) {
                article.sources.forEach(source => {
                    sources.push({
                        name: source.name || source,
                        url: source.url || null,
                        credibility: this.assessSourceCredibility(source)
                    });
                });
            }

            return sources;
        }

        assessSourceCredibility(source) {
            // Simplified credibility assessment
            const trustedSources = ['Reuters', 'AP', 'AFP', 'ESPN', 'BBC Sport', 'CNN Sports'];
            const sourceName = typeof source === 'string' ? source : source.name;

            if (trustedSources.some(trusted => sourceName.includes(trusted))) {
                return 'high';
            }

            return 'medium';
        }

        determineVerificationStatus(article, trustData) {
            if (trustData.trustScore >= 0.9) return 'verified';
            if (trustData.trustScore >= 0.6) return 'credible';
            return 'pending';
        }

        attachTrustBadge(article, trustData) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            const badge = document.createElement('div');
            badge.className = 'trust-badge';
            badge.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                background-color: ${trustData.trustLevel.color};
                color: white;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                margin-left: 8px;
            `;
            badge.innerHTML = `
                <span>${trustData.trustLevel.icon}</span>
                <span>${trustData.trustLevel.label}</span>
            `;

            const titleElement = articleElement.querySelector('.article-title, h2, h3');
            if (titleElement) {
                titleElement.appendChild(badge);
            }
        }

        startVerificationEngine() {
            console.log('🚀 [Layer 159] Starting verification engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.verificationCheck);

            document.addEventListener('article:validated', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForVerification(event.detail.article);
                }
            });

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForVerification(event.detail.article);
                }
            });
        }

        queueForVerification(article) {
            if (!this.verificationQueue.find(a => a.id === article.id)) {
                this.verificationQueue.push(article);
            }
        }

        processQueue() {
            if (this.verificationQueue.length === 0) return;

            const article = this.verificationQueue.shift();
            if (article) {
                this.verifyArticle(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.articleTrust.has(article.id)) {
                            this.queueForVerification(article);
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
                window.SPORTIQ.trustStats = this.stats;
            }
            this.updateDashboard();
        }

        updateStats(trustLevel) {
            if (trustLevel.label === 'Verified') this.stats.verified++;
            else if (trustLevel.label === 'Trusted Source') this.stats.trusted++;
            else if (trustLevel.label === 'Credible') this.stats.credible++;
            else this.stats.unverified++;
        }

        updateAverageTrustScore(newScore) {
            const total = this.stats.averageTrustScore * (this.stats.totalVerified - 1) + newScore;
            this.stats.averageTrustScore = total / this.stats.totalVerified;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer159-dashboard';
            dashboard.className = 'layer159-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer159-dashboard-header">
                    <h3>🔒 Trust Signals</h3>
                    <button class="layer159-close-btn">×</button>
                </div>
                <div class="layer159-dashboard-content">
                    <div class="layer159-stat">
                        <span class="layer159-stat-label">Total Verified:</span>
                        <span class="layer159-stat-value" id="layer159-total">0</span>
                    </div>
                    <div class="layer159-stat">
                        <span class="layer159-stat-label">Verified:</span>
                        <span class="layer159-stat-value" id="layer159-verified">0</span>
                    </div>
                    <div class="layer159-stat">
                        <span class="layer159-stat-label">Avg Trust:</span>
                        <span class="layer159-stat-value" id="layer159-trust">0%</span>
                    </div>
                    <div class="layer159-log" id="layer159-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer159-toggle-btn';
            toggleBtn.innerHTML = '🔒';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer159-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer159-total');
            const verifiedEl = document.getElementById('layer159-verified');
            const trustEl = document.getElementById('layer159-trust');

            if (totalEl) totalEl.textContent = this.stats.totalVerified;
            if (verifiedEl) verifiedEl.textContent = this.stats.verified;
            if (trustEl) trustEl.textContent = `${(this.stats.averageTrustScore * 100).toFixed(1)}%`;

            const logEl = document.getElementById('layer159-log');
            if (logEl && this.verificationLog.length > 0) {
                const recentLogs = this.verificationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer159-log-entry">
                        <span class="layer159-log-type">${log.type}</span>
                        <span class="layer159-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logVerification(type, message) {
            this.verificationLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.verificationLog.length > 100) this.verificationLog.shift();
        }

        getTrustData(articleId) {
            return this.articleTrust.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTrustEngine);
    } else {
        initTrustEngine();
    }

    function initTrustEngine() {
        const engine = new TrustCredibilityEngine();
        window.Layer159_TrustSignals = engine;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.trustSignals = engine;
        document.dispatchEvent(new CustomEvent('layer159:ready', { detail: { engine } }));
        console.log('🎯 [Layer 159] Trust & Credibility Signals - Ready');
    }

})();
