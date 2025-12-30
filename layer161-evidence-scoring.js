/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 161 – EVIDENCE WEIGHT SCORING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Score each article based on evidence strength, sourcing depth, 
 * and corroboration.
 * 
 * @version 1.0.0
 * @layer 161
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 161,
        name: 'Evidence Weight Scoring Engine',

        evidenceWeights: {
            primarySources: 0.35,
            secondarySources: 0.20,
            expertQuotes: 0.20,
            dataStatistics: 0.15,
            citations: 0.10
        },

        scoreTiers: {
            gold: { min: 80, label: 'Strong Evidence', icon: '🥇', color: '#fbbf24' },
            silver: { min: 60, label: 'Good Evidence', icon: '🥈', color: '#94a3b8' },
            bronze: { min: 40, label: 'Fair Evidence', icon: '🥉', color: '#cd7f32' },
            weak: { min: 0, label: 'Weak Evidence', icon: '⚠️', color: '#ef4444' }
        },

        minimumSources: 2,

        intervals: {
            scoringCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class EvidenceWeightScoring {
        constructor() {
            this.articleScores = new Map();
            this.scoringQueue = [];
            this.scoringLog = [];
            this.config = null;
            this.stats = {
                totalScored: 0,
                goldTier: 0,
                silverTier: 0,
                bronzeTier: 0,
                weakTier: 0,
                averageScore: 0
            };

            this.init();
        }

        async init() {
            console.log('📊 [Layer 161] Evidence Weight Scoring Engine - Initializing...');

            try {
                await this.loadConfiguration();
                this.startScoringEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 161] Evidence Weight Scoring Engine - Active');
                this.logScoring('SYSTEM', 'Evidence scoring engine initialized');

            } catch (error) {
                console.error('❌ [Layer 161] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer161-evidence-scoring.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        scoreArticle(article) {
            if (!article || !article.id) return null;

            try {
                const evidenceData = {
                    articleId: article.id,
                    evidenceScore: 0,
                    tier: null,
                    breakdown: {
                        primarySources: 0,
                        secondarySources: 0,
                        expertQuotes: 0,
                        dataStatistics: 0,
                        citations: 0
                    },
                    sourceCount: 0,
                    corroborationLevel: 0,
                    timestamp: new Date().toISOString()
                };

                // Analyze primary sources
                evidenceData.breakdown.primarySources = this.analyzePrimarySources(article);
                evidenceData.evidenceScore += evidenceData.breakdown.primarySources * CONFIG.evidenceWeights.primarySources;

                // Analyze secondary sources
                evidenceData.breakdown.secondarySources = this.analyzeSecondarySources(article);
                evidenceData.evidenceScore += evidenceData.breakdown.secondarySources * CONFIG.evidenceWeights.secondarySources;

                // Analyze expert quotes
                evidenceData.breakdown.expertQuotes = this.analyzeExpertQuotes(article);
                evidenceData.evidenceScore += evidenceData.breakdown.expertQuotes * CONFIG.evidenceWeights.expertQuotes;

                // Analyze data/statistics
                evidenceData.breakdown.dataStatistics = this.analyzeDataStatistics(article);
                evidenceData.evidenceScore += evidenceData.breakdown.dataStatistics * CONFIG.evidenceWeights.dataStatistics;

                // Analyze citations
                evidenceData.breakdown.citations = this.analyzeCitations(article);
                evidenceData.evidenceScore += evidenceData.breakdown.citations * CONFIG.evidenceWeights.citations;

                // Count sources
                evidenceData.sourceCount = this.countSources(article);

                // Check corroboration
                evidenceData.corroborationLevel = this.checkCorroboration(article);

                // Determine tier
                evidenceData.tier = this.getEvidenceTier(evidenceData.evidenceScore);

                // Store score
                this.articleScores.set(article.id, evidenceData);
                this.stats.totalScored++;
                this.updateStats(evidenceData.tier);
                this.updateAverageScore(evidenceData.evidenceScore);

                // Attach evidence badge
                this.attachEvidenceBadge(article, evidenceData);

                this.logScoring('SCORE', `Article "${article.title}" - Evidence: ${evidenceData.tier.label} (${evidenceData.evidenceScore.toFixed(1)})`);

                document.dispatchEvent(new CustomEvent('article:evidence-scored', {
                    detail: { article, evidenceData }
                }));

                return evidenceData;

            } catch (error) {
                console.error(`❌ [Layer 161] Scoring failed for article ${article.id}:`, error);
                return null;
            }
        }

        analyzePrimarySources(article) {
            let score = 0;

            // Check for direct quotes
            const content = article.content || '';
            const quoteMatches = content.match(/"[^"]+"/g) || [];
            score += Math.min(1, quoteMatches.length / 3) * 0.4;

            // Check for attributed statements
            const attributionKeywords = ['said', 'stated', 'announced', 'confirmed', 'revealed'];
            const hasAttributions = attributionKeywords.some(keyword => content.toLowerCase().includes(keyword));
            if (hasAttributions) score += 0.3;

            // Check for official sources
            if (article.sources && article.sources.length > 0) {
                const officialSources = article.sources.filter(s =>
                    typeof s === 'string' && (s.includes('official') || s.includes('press release'))
                );
                score += Math.min(1, officialSources.length / 2) * 0.3;
            }

            return Math.min(100, score * 100);
        }

        analyzeSecondarySources(article) {
            let score = 0;

            if (article.sources && article.sources.length > 0) {
                // Count credible news sources
                const credibleSources = ['reuters', 'ap', 'afp', 'espn', 'bbc'];
                const sourceCount = article.sources.filter(s => {
                    const sourceName = typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase();
                    return credibleSources.some(cs => sourceName.includes(cs));
                }).length;

                score = Math.min(1, sourceCount / 2);
            }

            return Math.min(100, score * 100);
        }

        analyzeExpertQuotes(article) {
            let score = 0;
            const content = (article.content || '').toLowerCase();

            // Check for expert indicators
            const expertKeywords = ['expert', 'analyst', 'professor', 'researcher', 'specialist', 'coach', 'manager'];
            const expertMentions = expertKeywords.filter(keyword => content.includes(keyword)).length;
            score += Math.min(1, expertMentions / 2) * 0.6;

            // Check for analysis/commentary
            const analysisKeywords = ['analysis', 'according to', 'explains', 'points out'];
            const hasAnalysis = analysisKeywords.some(keyword => content.includes(keyword));
            if (hasAnalysis) score += 0.4;

            return Math.min(100, score * 100);
        }

        analyzeDataStatistics(article) {
            let score = 0;
            const content = article.content || '';

            // Check for numerical data
            const numberMatches = content.match(/\d+%|\d+\.\d+|\d{1,3}(,\d{3})*|\d+/g) || [];
            score += Math.min(1, numberMatches.length / 5) * 0.5;

            // Check for statistical keywords
            const statsKeywords = ['statistics', 'data', 'study', 'research', 'survey', 'poll'];
            const hasStats = statsKeywords.some(keyword => content.toLowerCase().includes(keyword));
            if (hasStats) score += 0.5;

            return Math.min(100, score * 100);
        }

        analyzeCitations(article) {
            let score = 0;

            // Check for URL links in content
            const content = article.content || '';
            const urlMatches = content.match(/https?:\/\/[^\s]+/g) || [];
            score += Math.min(1, urlMatches.length / 3) * 0.5;

            // Check for source list
            if (article.sources && article.sources.length > 0) {
                score += 0.5;
            }

            return Math.min(100, score * 100);
        }

        countSources(article) {
            if (!article.sources) return 0;
            return Array.isArray(article.sources) ? article.sources.length : 0;
        }

        checkCorroboration(article) {
            const sourceCount = this.countSources(article);

            if (sourceCount >= 3) return 1.0; // High corroboration
            if (sourceCount >= 2) return 0.6; // Medium corroboration
            if (sourceCount >= 1) return 0.3; // Low corroboration
            return 0; // No corroboration
        }

        getEvidenceTier(score) {
            if (score >= CONFIG.scoreTiers.gold.min) return CONFIG.scoreTiers.gold;
            if (score >= CONFIG.scoreTiers.silver.min) return CONFIG.scoreTiers.silver;
            if (score >= CONFIG.scoreTiers.bronze.min) return CONFIG.scoreTiers.bronze;
            return CONFIG.scoreTiers.weak;
        }

        attachEvidenceBadge(article, evidenceData) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            const badge = document.createElement('div');
            badge.className = 'evidence-badge';
            badge.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 3px 8px;
                background-color: ${evidenceData.tier.color};
                color: white;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                margin-left: 8px;
            `;
            badge.innerHTML = `
                <span>${evidenceData.tier.icon}</span>
                <span>${evidenceData.tier.label}</span>
                <span style="opacity: 0.8; margin-left: 4px;">${evidenceData.evidenceScore.toFixed(0)}</span>
            `;
            badge.title = `Evidence Score: ${evidenceData.evidenceScore.toFixed(1)}/100\nSources: ${evidenceData.sourceCount}\nCorroboration: ${(evidenceData.corroborationLevel * 100).toFixed(0)}%`;

            const titleElement = articleElement.querySelector('.article-title, h2, h3');
            if (titleElement && !titleElement.querySelector('.evidence-badge')) {
                titleElement.appendChild(badge);
            }
        }

        startScoringEngine() {
            console.log('🚀 [Layer 161] Starting evidence scoring engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.scoringCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForScoring(event.detail.article);
                }
            });

            document.addEventListener('article:validated', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForScoring(event.detail.article);
                }
            });
        }

        queueForScoring(article) {
            if (!this.scoringQueue.find(a => a.id === article.id)) {
                this.scoringQueue.push(article);
            }
        }

        processQueue() {
            if (this.scoringQueue.length === 0) return;

            const article = this.scoringQueue.shift();
            if (article) {
                this.scoreArticle(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.articleScores.has(article.id)) {
                            this.queueForScoring(article);
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
                window.SPORTIQ.evidenceScoringStats = this.stats;
            }
            this.updateDashboard();
        }

        updateStats(tier) {
            if (tier.label === 'Strong Evidence') this.stats.goldTier++;
            else if (tier.label === 'Good Evidence') this.stats.silverTier++;
            else if (tier.label === 'Fair Evidence') this.stats.bronzeTier++;
            else this.stats.weakTier++;
        }

        updateAverageScore(newScore) {
            const total = this.stats.averageScore * (this.stats.totalScored - 1) + newScore;
            this.stats.averageScore = total / this.stats.totalScored;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer161-dashboard';
            dashboard.className = 'layer161-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer161-dashboard-header">
                    <h3>📊 Evidence Scoring</h3>
                    <button class="layer161-close-btn">×</button>
                </div>
                <div class="layer161-dashboard-content">
                    <div class="layer161-stat">
                        <span class="layer161-stat-label">Total Scored:</span>
                        <span class="layer161-stat-value" id="layer161-total">0</span>
                    </div>
                    <div class="layer161-stat">
                        <span class="layer161-stat-label">🥇 Gold Tier:</span>
                        <span class="layer161-stat-value" id="layer161-gold">0</span>
                    </div>
                    <div class="layer161-stat">
                        <span class="layer161-stat-label">Avg Score:</span>
                        <span class="layer161-stat-value" id="layer161-avg">0</span>
                    </div>
                    <div class="layer161-log" id="layer161-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer161-toggle-btn';
            toggleBtn.innerHTML = '📊';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer161-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer161-total');
            const goldEl = document.getElementById('layer161-gold');
            const avgEl = document.getElementById('layer161-avg');

            if (totalEl) totalEl.textContent = this.stats.totalScored;
            if (goldEl) goldEl.textContent = this.stats.goldTier;
            if (avgEl) avgEl.textContent = this.stats.averageScore.toFixed(1);

            const logEl = document.getElementById('layer161-log');
            if (logEl && this.scoringLog.length > 0) {
                const recentLogs = this.scoringLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer161-log-entry">
                        <span class="layer161-log-type">${log.type}</span>
                        <span class="layer161-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logScoring(type, message) {
            this.scoringLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.scoringLog.length > 100) this.scoringLog.shift();
        }

        getEvidenceScore(articleId) {
            return this.articleScores.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEvidenceScoring);
    } else {
        initEvidenceScoring();
    }

    function initEvidenceScoring() {
        const engine = new EvidenceWeightScoring();
        window.Layer161_EvidenceScoring = engine;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.evidenceScoring = engine;
        document.dispatchEvent(new CustomEvent('layer161:ready', { detail: { engine } }));
        console.log('🎯 [Layer 161] Evidence Weight Scoring Engine - Ready');
    }

})();
