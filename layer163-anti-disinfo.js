/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 163 – ANTI-DISINFORMATION SHIELD
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Cross-check claims against trusted data sources and flag potential 
 * misinformation.
 * 
 * @version 1.0.0
 * @layer 163
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 163,
        name: 'Anti-Disinformation Shield',

        redFlags: [
            'exclusive leak', 'unnamed sources say', 'you won\'t believe',
            'shocking truth', 'they don\'t want you to know', 'mainstream media won\'t tell you'
        ],

        trustedSources: ['reuters.com', 'ap.org', 'afp.com', 'espn.com', 'bbc.com/sport'],

        riskLevels: {
            verified: { score: 0, label: 'Verified', color: '#10b981' },
            low: { score: 0.2, label: 'Low Risk', color: '#3b82f6' },
            medium: { score: 0.5, label: 'Medium Risk', color: '#f59e0b' },
            high: { score: 0.8, label: 'High Risk', color: '#ef4444' },
            critical: { score: 1.0, label: 'Critical Risk', color: '#991b1b' }
        },

        quarantineThreshold: 0.8,

        intervals: {
            checkInterval: 5000,
            analyticsUpdate: 30000
        }
    };

    class AntiDisinformationShield {
        constructor() {
            this.articleChecks = new Map();
            this.quarantinedArticles = new Set();
            this.checkQueue = [];
            this.checkLog = [];
            this.config = null;
            this.stats = {
                totalChecked: 0,
                verified: 0,
                lowRisk: 0,
                mediumRisk: 0,
                highRisk: 0,
                quarantined: 0
            };

            this.init();
        }

        async init() {
            console.log('🛡️ [Layer 163] Anti-Disinformation Shield - Initializing...');

            try {
                await this.loadConfiguration();
                this.startCheckingEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 163] Anti-Disinformation Shield - Active');
                this.logCheck('SYSTEM', 'Anti-disinformation shield activated');

            } catch (error) {
                console.error('❌ [Layer 163] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer163-anti-disinfo.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        checkArticle(article) {
            if (!article || !article.id) return null;

            try {
                const check = {
                    articleId: article.id,
                    riskScore: 0,
                    riskLevel: null,
                    flags: [],
                    trustedSourceMatch: false,
                    evidenceIntegrity: 1.0,
                    trustIntegrity: 1.0,
                    quarantined: false,
                    timestamp: new Date().toISOString()
                };

                // Check for red flags
                check.flags = this.detectRedFlags(article);

                // Check against trusted sources
                check.trustedSourceMatch = this.checkTrustedSources(article);

                // Integrate with evidence scoring
                check.evidenceIntegrity = this.getEvidenceIntegrity(article);

                // Integrate with trust signals
                check.trustIntegrity = this.getTrustIntegrity(article);

                // Calculate risk score
                check.riskScore = this.calculateRiskScore(check);

                // Determine risk level
                check.riskLevel = this.getRiskLevel(check.riskScore);

                // Quarantine if necessary
                if (check.riskScore >= CONFIG.quarantineThreshold) {
                    check.quarantined = true;
                    this.quarantineArticle(article, check);
                }

                // Store check result
                this.articleChecks.set(article.id, check);
                this.stats.totalChecked++;
                this.updateStats(check.riskLevel, check.quarantined);

                // Attach warning if risky
                if (check.riskScore >= 0.5) {
                    this.attachWarning(article, check);
                }

                this.logCheck('CHECK', `Article "${article.title}" - Risk: ${check.riskLevel.label} (${(check.riskScore * 100).toFixed(1)}%)`);

                document.dispatchEvent(new CustomEvent('article:disinfo-checked', {
                    detail: { article, check }
                }));

                return check;

            } catch (error) {
                console.error(`❌ [Layer 163] Check failed for article ${article.id}:`, error);
                return null;
            }
        }

        detectRedFlags(article) {
            const flags = [];
            const content = `${article.title} ${article.content}`.toLowerCase();

            CONFIG.redFlags.forEach(pattern => {
                if (content.includes(pattern.toLowerCase())) {
                    flags.push({
                        type: 'red-flag',
                        pattern: pattern,
                        severity: 'high'
                    });
                }
            });

            // Check for sensationalism
            const capsCount = (article.title.match(/[A-Z]/g) || []).length;
            if (capsCount > article.title.length * 0.5) {
                flags.push({
                    type: 'sensationalism',
                    pattern: 'Excessive capitalization',
                    severity: 'medium'
                });
            }

            // Check for excessive exclamation marks
            const exclamationCount = (article.title.match(/!/g) || []).length;
            if (exclamationCount > 1) {
                flags.push({
                    type: 'sensationalism',
                    pattern: 'Multiple exclamation marks',
                    severity: 'low'
                });
            }

            return flags;
        }

        checkTrustedSources(article) {
            if (!article.sources || article.sources.length === 0) return false;

            return article.sources.some(source => {
                const sourceName = typeof source === 'string' ? source.toLowerCase() : (source.url || source.name || '').toLowerCase();
                return CONFIG.trustedSources.some(trusted => sourceName.includes(trusted));
            });
        }

        getEvidenceIntegrity(article) {
            if (window.Layer161_EvidenceScoring) {
                const evidenceData = window.Layer161_EvidenceScoring.getEvidenceScore(article.id);
                if (evidenceData) {
                    return evidenceData.evidenceScore / 100;
                }
            }
            return 0.5; // Default medium integrity
        }

        getTrustIntegrity(article) {
            if (window.Layer159_TrustSignals) {
                const trustData = window.Layer159_TrustSignals.getTrustData(article.id);
                if (trustData) {
                    return trustData.trustScore;
                }
            }
            return 0.5; // Default medium trust
        }

        calculateRiskScore(check) {
            let risk = 0;

            // Red flags contribute significantly
            risk += Math.min(0.5, check.flags.length * 0.15);

            // Lack of trusted sources
            if (!check.trustedSourceMatch) {
                risk += 0.2;
            }

            // Low evidence integrity
            risk += (1 - check.evidenceIntegrity) * 0.2;

            // Low trust integrity
            risk += (1 - check.trustIntegrity) * 0.1;

            return Math.min(1, risk);
        }

        getRiskLevel(score) {
            if (score >= 0.8) return CONFIG.riskLevels.critical;
            if (score >= 0.5) return CONFIG.riskLevels.high;
            if (score >= 0.3) return CONFIG.riskLevels.medium;
            if (score >= 0.1) return CONFIG.riskLevels.low;
            return CONFIG.riskLevels.verified;
        }

        quarantineArticle(article, check) {
            this.quarantinedArticles.add(article.id);
            console.warn(`🚨 [Layer 163] QUARANTINED: "${article.title}" - Risk: ${(check.riskScore * 100).toFixed(1)}%`);

            // Hide from public view
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (articleElement) {
                articleElement.style.display = 'none';
            }

            // Notify governance layer
            if (window.Layer165_EditorialGovernance) {
                window.Layer165_EditorialGovernance.handleViolation(article, 'disinformation-risk', check);
            }
        }

        attachWarning(article, check) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            const warning = document.createElement('div');
            warning.className = 'disinfo-warning';
            warning.style.cssText = `
                background-color: ${check.riskLevel.color};
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                margin: 8px 0;
                font-size: 13px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            warning.innerHTML = `
                <span style="font-size: 18px;">⚠️</span>
                <span>${check.riskLevel.label}: This article has been flagged for potential misinformation (${check.flags.length} red flags detected)</span>
            `;

            articleElement.insertBefore(warning, articleElement.firstChild);
        }

        startCheckingEngine() {
            console.log('🚀 [Layer 163] Starting disinformation checking...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.checkInterval);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForCheck(event.detail.article);
                }
            });
        }

        queueForCheck(article) {
            if (!this.checkQueue.find(a => a.id === article.id)) {
                this.checkQueue.push(article);
            }
        }

        processQueue() {
            if (this.checkQueue.length === 0) return;

            const article = this.checkQueue.shift();
            if (article) {
                this.checkArticle(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.articleChecks.has(article.id)) {
                            this.queueForCheck(article);
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
                window.SPORTIQ.antiDisinfoStats = this.stats;
            }
            this.updateDashboard();
        }

        updateStats(riskLevel, quarantined) {
            if (riskLevel.label === 'Verified') this.stats.verified++;
            else if (riskLevel.label === 'Low Risk') this.stats.lowRisk++;
            else if (riskLevel.label === 'Medium Risk') this.stats.mediumRisk++;
            else this.stats.highRisk++;

            if (quarantined) this.stats.quarantined++;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer163-dashboard';
            dashboard.className = 'layer163-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer163-dashboard-header">
                    <h3>🛡️ Disinfo Shield</h3>
                    <button class="layer163-close-btn">×</button>
                </div>
                <div class="layer163-dashboard-content">
                    <div class="layer163-stat">
                        <span class="layer163-stat-label">Checked:</span>
                        <span class="layer163-stat-value" id="layer163-total">0</span>
                    </div>
                    <div class="layer163-stat">
                        <span class="layer163-stat-label">🚨 Quarantined:</span>
                        <span class="layer163-stat-value" id="layer163-quarantined">0</span>
                    </div>
                    <div class="layer163-stat">
                        <span class="layer163-stat-label">Verified:</span>
                        <span class="layer163-stat-value" id="layer163-verified">0</span>
                    </div>
                    <div class="layer163-log" id="layer163-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer163-toggle-btn';
            toggleBtn.innerHTML = '🛡️';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer163-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer163-total');
            const quarantinedEl = document.getElementById('layer163-quarantined');
            const verifiedEl = document.getElementById('layer163-verified');

            if (totalEl) totalEl.textContent = this.stats.totalChecked;
            if (quarantinedEl) quarantinedEl.textContent = this.stats.quarantined;
            if (verifiedEl) verifiedEl.textContent = this.stats.verified;

            const logEl = document.getElementById('layer163-log');
            if (logEl && this.checkLog.length > 0) {
                const recentLogs = this.checkLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer163-log-entry">
                        <span class="layer163-log-type">${log.type}</span>
                        <span class="layer163-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logCheck(type, message) {
            this.checkLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.checkLog.length > 100) this.checkLog.shift();
        }

        getCheck(articleId) {
            return this.articleChecks.get(articleId);
        }

        isQuarantined(articleId) {
            return this.quarantinedArticles.has(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAntiDisinfo);
    } else {
        initAntiDisinfo();
    }

    function initAntiDisinfo() {
        const shield = new AntiDisinformationShield();
        window.Layer163_AntiDisinfo = shield;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.antiDisinfo = shield;
        document.dispatchEvent(new CustomEvent('layer163:ready', { detail: { shield } }));
        console.log('🎯 [Layer 163] Anti-Disinformation Shield - Ready');
    }

})();
