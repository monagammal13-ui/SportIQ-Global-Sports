/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 160 – GLOBAL NEWS PRIORITY INDEX
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Ranks and reorders news articles globally based on urgency, impact, 
 * and verified importance.
 * 
 * @version 1.0.0
 * @layer 160
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 160,
        name: 'Global News Priority Index',

        priorityWeights: {
            urgency: 0.35,
            impact: 0.30,
            trust: 0.20,
            recency: 0.10,
            engagement: 0.05
        },

        priorityLevels: {
            critical: { min: 0.9, label: 'Critical', color: '#dc2626' },
            high: { min: 0.7, label: 'High Priority', color: '#ea580c' },
            medium: { min: 0.5, label: 'Medium Priority', color: '#f59e0b' },
            normal: { min: 0.3, label: 'Normal', color: '#3b82f6' },
            low: { min: 0, label: 'Low Priority', color: '#6b7280' }
        },

        intervals: {
            rankingUpdate: 10000,
            reorderCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class GlobalNewsPriorityIndex {
        constructor() {
            this.articlePriorities = new Map();
            this.globalRanking = [];
            this.rankingLog = [];
            this.config = null;
            this.stats = {
                totalRanked: 0,
                critical: 0,
                high: 0,
                medium: 0,
                averagePriority: 0
            };

            this.init();
        }

        async init() {
            console.log('🎯 [Layer 160] Global News Priority Index - Initializing...');

            try {
                await this.loadConfiguration();
                this.startPriorityEngine();
                this.startRankingEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 160] Global News Priority Index - Active');
                this.logRanking('SYSTEM', 'Priority index initialized');

            } catch (error) {
                console.error('❌ [Layer 160] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer160-priority-index.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        calculatePriority(article) {
            if (!article || !article.id) return null;

            try {
                let priorityScore = 0;

                // Urgency (35%)
                const urgency = this.calculateUrgency(article);
                priorityScore += urgency * CONFIG.priorityWeights.urgency;

                // Impact (30%)
                const impact = this.calculateImpact(article);
                priorityScore += impact * CONFIG.priorityWeights.impact;

                // Trust (20%)
                const trust = this.calculateTrust(article);
                priorityScore += trust * CONFIG.priorityWeights.trust;

                // Recency (10%)
                const recency = this.calculateRecency(article);
                priorityScore += recency * CONFIG.priorityWeights.recency;

                // Engagement (5%)
                const engagement = this.calculateEngagement(article);
                priorityScore += engagement * CONFIG.priorityWeights.engagement;

                const priorityData = {
                    articleId: article.id,
                    priorityScore: priorityScore,
                    priorityLevel: this.getPriorityLevel(priorityScore),
                    components: { urgency, impact, trust, recency, engagement },
                    timestamp: new Date().toISOString(),
                    globalRank: 0
                };

                // Store priority data
                this.articlePriorities.set(article.id, priorityData);
                this.stats.totalRanked++;
                this.updateStats(priorityData.priorityLevel);
                this.updateAveragePriority(priorityScore);

                // Update global ranking
                this.updateGlobalRanking();

                // Apply priority to article
                this.applyPriority(article, priorityData);

                this.logRanking('RANK', `Article "${article.title}" - Priority: ${priorityData.priorityLevel.label} (${(priorityScore * 100).toFixed(1)})`);

                document.dispatchEvent(new CustomEvent('article:prioritized', {
                    detail: { article, priorityData }
                }));

                return priorityData;

            } catch (error) {
                console.error(`❌ [Layer 160] Priority calculation failed for article ${article.id}:`, error);
                return null;
            }
        }

        calculateUrgency(article) {
            let urgency = 0;

            // Breaking news
            if (article.breaking) urgency += 0.5;
            if (article.priority === 'high' || article.priority === 'critical') urgency += 0.3;

            // Time-sensitive keywords
            const content = `${article.title} ${article.content}`.toLowerCase();
            const urgentKeywords = ['breaking', 'urgent', 'just in', 'developing', 'live', 'now'];
            if (urgentKeywords.some(keyword => content.includes(keyword))) {
                urgency += 0.2;
            }

            return Math.min(1, urgency);
        }

        calculateImpact(article) {
            // Use Layer 158 impact score if available
            if (window.Layer158_TopicAmplification) {
                const amplification = window.Layer158_TopicAmplification.amplifiedTopics.get(article.id);
                if (amplification) {
                    return amplification.impactScore;
                }
            }

            // Fallback to basic impact calculation
            let impact = 0.5; // Default medium impact

            if (article.featured) impact += 0.2;
            if (article.exclusive) impact += 0.1;

            return Math.min(1, impact);
        }

        calculateTrust(article) {
            // Use Layer 159 trust score if available
            if (window.Layer159_TrustSignals) {
                const trustData = window.Layer159_TrustSignals.getTrustData(article.id);
                if (trustData) {
                    return trustData.trustScore;
                }
            }

            // Fallback to basic trust calculation
            let trust = 0.5;

            if (article.verified) trust += 0.3;
            if (article.author) trust += 0.1;
            if (article.sources && article.sources.length > 0) trust += 0.1;

            return Math.min(1, trust);
        }

        calculateRecency(article) {
            if (!article.publishedAt) return 0.5;

            const now = new Date();
            const published = new Date(article.publishedAt);
            const hoursOld = (now - published) / (1000 * 60 * 60);

            if (hoursOld < 1) return 1.0;
            if (hoursOld < 6) return 0.8;
            if (hoursOld < 24) return 0.5;
            if (hoursOld < 72) return 0.3;
            return 0.1;
        }

        calculateEngagement(article) {
            // Placeholder for engagement metrics
            let engagement = 0.5;

            if (article.views) engagement += Math.min(0.3, article.views / 10000);
            if (article.shares) engagement += Math.min(0.2, article.shares / 1000);

            return Math.min(1, engagement);
        }

        getPriorityLevel(score) {
            if (score >= CONFIG.priorityLevels.critical.min) return CONFIG.priorityLevels.critical;
            if (score >= CONFIG.priorityLevels.high.min) return CONFIG.priorityLevels.high;
            if (score >= CONFIG.priorityLevels.medium.min) return CONFIG.priorityLevels.medium;
            if (score >= CONFIG.priorityLevels.normal.min) return CONFIG.priorityLevels.normal;
            return CONFIG.priorityLevels.low;
        }

        updateGlobalRanking() {
            // Sort all articles by priority score
            this.globalRanking = Array.from(this.articlePriorities.entries())
                .sort((a, b) => b[1].priorityScore - a[1].priorityScore)
                .map(([articleId, priorityData], index) => {
                    priorityData.globalRank = index + 1;
                    return { articleId, ...priorityData };
                });

            // Reorder articles in DOM
            this.reorderArticles();
        }

        reorderArticles() {
            const mainFeed = document.getElementById('main-content-feed');
            if (!mainFeed) return;

            // Get top priority articles
            const topArticles = this.globalRanking.slice(0, 20);

            topArticles.forEach((item, index) => {
                const articleElement = mainFeed.querySelector(`[data-article-id="${item.articleId}"]`);
                if (articleElement) {
                    // Move to appropriate position
                    const children = Array.from(mainFeed.children);
                    const currentIndex = children.indexOf(articleElement);

                    if (currentIndex !== index && currentIndex !== -1) {
                        if (index === 0) {
                            mainFeed.insertBefore(articleElement, mainFeed.firstChild);
                        } else if (index < children.length) {
                            mainFeed.insertBefore(articleElement, children[index]);
                        }
                    }

                    // Add priority indicator
                    articleElement.classList.add('priority-' + item.priorityLevel.label.toLowerCase().replace(' ', '-'));
                }
            });
        }

        applyPriority(article, priorityData) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            // Add priority badge
            const badge = document.createElement('span');
            badge.className = 'priority-badge';
            badge.style.cssText = `
                display: inline-block;
                padding: 2px 6px;
                background-color: ${priorityData.priorityLevel.color};
                color: white;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                margin-right: 8px;
            `;
            badge.textContent = priorityData.priorityLevel.label;

            const titleElement = articleElement.querySelector('.article-title, h2, h3');
            if (titleElement && !titleElement.querySelector('.priority-badge')) {
                titleElement.insertBefore(badge, titleElement.firstChild);
            }
        }

        startPriorityEngine() {
            console.log('🚀 [Layer 160] Starting priority calculation...');

            setInterval(() => {
                this.checkForNewArticles();
                this.recalculatePriorities();
            }, CONFIG.intervals.rankingUpdate);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.calculatePriority(event.detail.article);
                }
            });

            document.addEventListener('article:trust-verified', (event) => {
                if (event.detail && event.detail.article) {
                    // Recalculate priority with updated trust
                    this.calculatePriority(event.detail.article);
                }
            });

            document.addEventListener('article:amplified', (event) => {
                if (event.detail && event.detail.article) {
                    // Recalculate priority with updated impact
                    this.calculatePriority(event.detail.article);
                }
            });
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.articlePriorities.has(article.id)) {
                            this.calculatePriority(article);
                        }
                    });
                }
            }
        }

        recalculatePriorities() {
            // Recalculate priorities for existing articles (recency changes over time)
            this.articlePriorities.forEach((priorityData, articleId) => {
                if (window.Layer150_NewsDistributor) {
                    const article = window.Layer150_NewsDistributor.getArticle(articleId);
                    if (article) {
                        this.calculatePriority(article);
                    }
                }
            });
        }

        startRankingEngine() {
            setInterval(() => {
                this.updateGlobalRanking();
            }, CONFIG.intervals.reorderCheck);
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.priorityIndexStats = this.stats;
            }
            this.updateDashboard();
        }

        updateStats(priorityLevel) {
            if (priorityLevel.label === 'Critical') this.stats.critical++;
            else if (priorityLevel.label === 'High Priority') this.stats.high++;
            else if (priorityLevel.label === 'Medium Priority') this.stats.medium++;
        }

        updateAveragePriority(newPriority) {
            const total = this.stats.averagePriority * (this.stats.totalRanked - 1) + newPriority;
            this.stats.averagePriority = total / this.stats.totalRanked;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer160-dashboard';
            dashboard.className = 'layer160-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer160-dashboard-header">
                    <h3>🎯 Priority Index</h3>
                    <button class="layer160-close-btn">×</button>
                </div>
                <div class="layer160-dashboard-content">
                    <div class="layer160-stat">
                        <span class="layer160-stat-label">Total Ranked:</span>
                        <span class="layer160-stat-value" id="layer160-total">0</span>
                    </div>
                    <div class="layer160-stat">
                        <span class="layer160-stat-label">Critical:</span>
                        <span class="layer160-stat-value" id="layer160-critical">0</span>
                    </div>
                    <div class="layer160-stat">
                        <span class="layer160-stat-label">High Priority:</span>
                        <span class="layer160-stat-value" id="layer160-high">0</span>
                    </div>
                    <div class="layer160-log" id="layer160-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer160-toggle-btn';
            toggleBtn.innerHTML = '🎯';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer160-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer160-total');
            const criticalEl = document.getElementById('layer160-critical');
            const highEl = document.getElementById('layer160-high');

            if (totalEl) totalEl.textContent = this.stats.totalRanked;
            if (criticalEl) criticalEl.textContent = this.stats.critical;
            if (highEl) highEl.textContent = this.stats.high;

            const logEl = document.getElementById('layer160-log');
            if (logEl && this.rankingLog.length > 0) {
                const recentLogs = this.rankingLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer160-log-entry">
                        <span class="layer160-log-type">${log.type}</span>
                        <span class="layer160-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logRanking(type, message) {
            this.rankingLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.rankingLog.length > 100) this.rankingLog.shift();
        }

        getArticlePriority(articleId) {
            return this.articlePriorities.get(articleId);
        }

        getGlobalRanking() {
            return [...this.globalRanking];
        }

        getTopArticles(limit = 10) {
            return this.globalRanking.slice(0, limit);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPriorityIndex);
    } else {
        initPriorityIndex();
    }

    function initPriorityIndex() {
        const index = new GlobalNewsPriorityIndex();
        window.Layer160_PriorityIndex = index;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.priorityIndex = index;
        document.dispatchEvent(new CustomEvent('layer160:ready', { detail: { index } }));
        console.log('🎯 [Layer 160] Global News Priority Index - Ready');
    }

})();
