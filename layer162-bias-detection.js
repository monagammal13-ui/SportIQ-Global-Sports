/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 162 – BIAS DETECTION & BALANCE ANALYZER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Analyze articles for narrative bias and recommend balancing adjustments.
 * 
 * @version 1.0.0
 * @layer 162
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 162,
        name: 'Bias Detection & Balance Analyzer',

        biasKeywords: {
            positive: ['amazing', 'incredible', 'phenomenal', 'brilliant', 'outstanding', 'perfect', 'flawless'],
            negative: ['terrible', 'awful', 'horrible', 'disaster', 'catastrophic', 'pathetic', 'abysmal'],
            emotional: ['shocking', 'unbelievable', 'stunning', 'devastating', 'heartbreaking']
        },

        balanceThresholds: {
            balanced: 0.8,
            slightBias: 0.6,
            moderate: 0.4,
            heavy: 0.2
        },

        intervals: {
            analysisCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class BiasDetectionAnalyzer {
        constructor() {
            this.articleAnalyses = new Map();
            this.analysisQueue = [];
            this.analysisLog = [];
            this.config = null;
            this.stats = {
                totalAnalyzed: 0,
                balanced: 0,
                slightBias: 0,
                moderateBias: 0,
                heavyBias: 0,
                averageBalance: 0
            };

            this.init();
        }

        async init() {
            console.log('🎭 [Layer 162] Bias Detection & Balance Analyzer - Initializing...');

            try {
                await this.loadConfiguration();
                this.startAnalysisEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 162] Bias Detection & Balance Analyzer - Active');
                this.logAnalysis('SYSTEM', 'Bias analyzer initialized');

            } catch (error) {
                console.error('❌ [Layer 162] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer162-bias-detection.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        analyzeArticle(article) {
            if (!article || !article.id) return null;

            try {
                const analysis = {
                    articleId: article.id,
                    biasScore: 0,
                    balanceScore: 0,
                    balanceLevel: null,
                    detectedBiases: [],
                    languageBias: { positive: 0, negative: 0, emotional: 0 },
                    perspectiveBalance: 0,
                    sourceDiversity: 0,
                    recommendations: [],
                    timestamp: new Date().toISOString()
                };

                // Detect language bias
                analysis.languageBias = this.detectLanguageBias(article);

                // Calculate overall bias score
                analysis.biasScore = this.calculateBiasScore(analysis.languageBias);

                // Analyze perspective balance
                analysis.perspectiveBalance = this.analyzePerspectiveBalance(article);

                // Check source diversity
                analysis.sourceDiversity = this.checkSourceDiversity(article);

                // Calculate overall balance score
                analysis.balanceScore = this.calculateBalanceScore(
                    analysis.biasScore,
                    analysis.perspectiveBalance,
                    analysis.sourceDiversity
                );

                // Determine balance level
                analysis.balanceLevel = this.getBalanceLevel(analysis.balanceScore);

                // Generate recommendations
                analysis.recommendations = this.generateRecommendations(analysis);

                // Store analysis
                this.articleAnalyses.set(article.id, analysis);
                this.stats.totalAnalyzed++;
                this.updateStats(analysis.balanceLevel);
                this.updateAverageBalance(analysis.balanceScore);

                // Attach bias indicator
                this.attachBiasIndicator(article, analysis);

                this.logAnalysis('ANALYZE', `Article "${article.title}" - Balance: ${analysis.balanceLevel} (${analysis.balanceScore.toFixed(1)})`);

                document.dispatchEvent(new CustomEvent('article:bias-analyzed', {
                    detail: { article, analysis }
                }));

                return analysis;

            } catch (error) {
                console.error(`❌ [Layer 162] Analysis failed for article ${article.id}:`, error);
                return null;
            }
        }

        detectLanguageBias(article) {
            const content = `${article.title} ${article.content}`.toLowerCase();
            const bias = { positive: 0, negative: 0, emotional: 0 };

            // Count biased keywords
            CONFIG.biasKeywords.positive.forEach(keyword => {
                const matches = content.match(new RegExp(keyword, 'gi')) || [];
                bias.positive += matches.length;
            });

            CONFIG.biasKeywords.negative.forEach(keyword => {
                const matches = content.match(new RegExp(keyword, 'gi')) || [];
                bias.negative += matches.length;
            });

            CONFIG.biasKeywords.emotional.forEach(keyword => {
                const matches = content.match(new RegExp(keyword, 'gi')) || [];
                bias.emotional += matches.length;
            });

            return bias;
        }

        calculateBiasScore(languageBias) {
            const total = languageBias.positive + languageBias.negative + languageBias.emotional;

            if (total === 0) return 1.0; // No bias detected = perfect score

            // Calculate imbalance
            const imbalance = Math.abs(languageBias.positive - languageBias.negative);
            const emotionalFactor = languageBias.emotional / 10;

            // Lower score = more bias
            const biasScore = 1 - Math.min(1, (imbalance / 10 + emotionalFactor));

            return biasScore;
        }

        analyzePerspectiveBalance(article) {
            const content = (article.content || '').toLowerCase();

            // Check for multiple perspectives
            const perspectiveIndicators = [
                'however', 'on the other hand', 'critics say', 'opponents argue',
                'supporters claim', 'while', 'although', 'despite', 'nevertheless'
            ];

            const perspectiveCount = perspectiveIndicators.filter(indicator =>
                content.includes(indicator)
            ).length;

            return Math.min(1, perspectiveCount / 3);
        }

        checkSourceDiversity(article) {
            if (!article.sources || article.sources.length === 0) return 0;

            // More sources = better diversity (up to a point)
            const sourceCount = article.sources.length;
            return Math.min(1, sourceCount / 4);
        }

        calculateBalanceScore(biasScore, perspectiveBalance, sourceDiversity) {
            // Weighted average
            return (biasScore * 0.5) + (perspectiveBalance * 0.3) + (sourceDiversity * 0.2);
        }

        getBalanceLevel(score) {
            if (score >= CONFIG.balanceThresholds.balanced) return 'Balanced';
            if (score >= CONFIG.balanceThresholds.slightBias) return 'Slight Bias';
            if (score >= CONFIG.balanceThresholds.moderate) return 'Moderate Bias';
            return 'Heavy Bias';
        }

        generateRecommendations(analysis) {
            const recommendations = [];

            if (analysis.languageBias.positive > analysis.languageBias.negative + 3) {
                recommendations.push({
                    type: 'language',
                    severity: 'medium',
                    message: 'Consider using more neutral language and reducing overly positive descriptors'
                });
            }

            if (analysis.languageBias.negative > analysis.languageBias.positive + 3) {
                recommendations.push({
                    type: 'language',
                    severity: 'medium',
                    message: 'Article contains excessive negative language; consider a more balanced tone'
                });
            }

            if (analysis.languageBias.emotional > 5) {
                recommendations.push({
                    type: 'emotion',
                    severity: 'high',
                    message: 'Reduce emotional language to maintain journalistic objectivity'
                });
            }

            if (analysis.perspectiveBalance < 0.3) {
                recommendations.push({
                    type: 'perspective',
                    severity: 'high',
                    message: 'Include additional perspectives or alternative viewpoints for balance'
                });
            }

            if (analysis.sourceDiversity < 0.3) {
                recommendations.push({
                    type: 'sources',
                    severity: 'medium',
                    message: 'Add more diverse sources to strengthen credibility and balance'
                });
            }

            return recommendations;
        }

        attachBiasIndicator(article, analysis) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            const colors = {
                'Balanced': '#10b981',
                'Slight Bias': '#f59e0b',
                'Moderate Bias': '#f97316',
                'Heavy Bias': '#ef4444'
            };

            const indicator = document.createElement('span');
            indicator.className = 'bias-indicator';
            indicator.style.cssText = `
                display: inline-block;
                padding: 2px 6px;
                background-color: ${colors[analysis.balanceLevel]};
                color: white;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                margin-left: 6px;
            `;
            indicator.textContent = analysis.balanceLevel;
            indicator.title = `Balance Score: ${(analysis.balanceScore * 100).toFixed(0)}%\nRecommendations: ${analysis.recommendations.length}`;

            const titleElement = articleElement.querySelector('.article-title, h2, h3');
            if (titleElement && !titleElement.querySelector('.bias-indicator')) {
                titleElement.appendChild(indicator);
            }
        }

        startAnalysisEngine() {
            console.log('🚀 [Layer 162] Starting bias analysis engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.analysisCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForAnalysis(event.detail.article);
                }
            });
        }

        queueForAnalysis(article) {
            if (!this.analysisQueue.find(a => a.id === article.id)) {
                this.analysisQueue.push(article);
            }
        }

        processQueue() {
            if (this.analysisQueue.length === 0) return;

            const article = this.analysisQueue.shift();
            if (article) {
                this.analyzeArticle(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.articleAnalyses.has(article.id)) {
                            this.queueForAnalysis(article);
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
                window.SPORTIQ.biasAnalysisStats = this.stats;
            }
            this.updateDashboard();
        }

        updateStats(balanceLevel) {
            if (balanceLevel === 'Balanced') this.stats.balanced++;
            else if (balanceLevel === 'Slight Bias') this.stats.slightBias++;
            else if (balanceLevel === 'Moderate Bias') this.stats.moderateBias++;
            else this.stats.heavyBias++;
        }

        updateAverageBalance(newBalance) {
            const total = this.stats.averageBalance * (this.stats.totalAnalyzed - 1) + newBalance;
            this.stats.averageBalance = total / this.stats.totalAnalyzed;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer162-dashboard';
            dashboard.className = 'layer162-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer162-dashboard-header">
                    <h3>🎭 Bias Analyzer</h3>
                    <button class="layer162-close-btn">×</button>
                </div>
                <div class="layer162-dashboard-content">
                    <div class="layer162-stat">
                        <span class="layer162-stat-label">Analyzed:</span>
                        <span class="layer162-stat-value" id="layer162-total">0</span>
                    </div>
                    <div class="layer162-stat">
                        <span class="layer162-stat-label">Balanced:</span>
                        <span class="layer162-stat-value" id="layer162-balanced">0</span>
                    </div>
                    <div class="layer162-stat">
                        <span class="layer162-stat-label">Avg Balance:</span>
                        <span class="layer162-stat-value" id="layer162-avg">0%</span>
                    </div>
                    <div class="layer162-log" id="layer162-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer162-toggle-btn';
            toggleBtn.innerHTML = '🎭';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer162-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer162-total');
            const balancedEl = document.getElementById('layer162-balanced');
            const avgEl = document.getElementById('layer162-avg');

            if (totalEl) totalEl.textContent = this.stats.totalAnalyzed;
            if (balancedEl) balancedEl.textContent = this.stats.balanced;
            if (avgEl) avgEl.textContent = `${(this.stats.averageBalance * 100).toFixed(1)}%`;

            const logEl = document.getElementById('layer162-log');
            if (logEl && this.analysisLog.length > 0) {
                const recentLogs = this.analysisLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer162-log-entry">
                        <span class="layer162-log-type">${log.type}</span>
                        <span class="layer162-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logAnalysis(type, message) {
            this.analysisLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.analysisLog.length > 100) this.analysisLog.shift();
        }

        getAnalysis(articleId) {
            return this.articleAnalyses.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBiasAnalyzer);
    } else {
        initBiasAnalyzer();
    }

    function initBiasAnalyzer() {
        const analyzer = new BiasDetectionAnalyzer();
        window.Layer162_BiasDetection = analyzer;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.biasDetection = analyzer;
        document.dispatchEvent(new CustomEvent('layer162:ready', { detail: { analyzer } }));
        console.log('🎯 [Layer 162] Bias Detection & Balance Analyzer - Ready');
    }

})();
