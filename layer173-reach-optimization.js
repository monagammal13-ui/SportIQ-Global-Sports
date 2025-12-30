/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 173 – ALGORITHMIC REACH OPTIMIZATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Optimize content reach ethically across discovery surfaces.
 * 
 * @version 1.0.0
 * @layer 173
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 173,
        name: 'Algorithmic Reach Optimization',

        optimizationFactors: ['engagement', 'relevance', 'freshness', 'quality', 'diversity'],

        intervals: {
            optimizationCheck: 15000,
            analyticsUpdate: 60000
        }
    };

    class ReachOptimizer {
        constructor() {
            this.optimizedContent = new Map();
            this.reachMetrics = new Map();
            this.optimizationLog = [];
            this.config = null;
            this.stats = {
                totalOptimized: 0,
                avgReachIncrease: 0,
                topPerformers: 0,
                diversityScore: 0
            };

            this.init();
        }

        async init() {
            console.log('📈 [Layer 173] Reach Optimizer - Initializing...');

            try {
                await this.loadConfiguration();
                this.startOptimization();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 173] Reach Optimizer - Active');
                this.logOptimization('SYSTEM', 'Reach optimization initialized');

            } catch (error) {
                console.error('❌ [Layer 173] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer173-reach-optimization.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        optimizeReach(content) {
            if (!content || !content.id) return null;

            try {
                const optimization = {
                    contentId: content.id,
                    timestamp: new Date().toISOString(),
                    scores: {},
                    recommendations: [],
                    estimatedReach: 0
                };

                // Calculate optimization scores
                optimization.scores.engagement = this.calculateEngagementScore(content);
                optimization.scores.relevance = this.calculateRelevanceScore(content);
                optimization.scores.freshness = this.calculateFreshnessScore(content);
                optimization.scores.quality = this.calculateQualityScore(content);
                optimization.scores.diversity = this.calculateDiversityScore(content);

                // Generate optimization recommendations
                optimization.recommendations = this.generateRecommendations(content, optimization.scores);

                // Estimate potential reach
                optimization.estimatedReach = this.estimateReach(optimization.scores);

                // Apply optimizations
                this.applyOptimizations(content, optimization);

                // Store optimization data
                this.optimizedContent.set(content.id, optimization);
                this.stats.totalOptimized++;

                this.logOptimization('OPTIMIZE', `Content "${content.title}" - Estimated reach: ${optimization.estimatedReach}`);

                document.dispatchEvent(new CustomEvent('reach:optimized', {
                    detail: { content, optimization }
                }));

                return optimization;

            } catch (error) {
                console.error(`❌ [Layer 173] Optimization failed:`, error);
                return null;
            }
        }

        calculateEngagementScore(content) {
            let score = 50; // Base score

            // Factor in existing engagement metrics
            if (content.views) score += Math.min(content.views / 100, 20);
            if (content.likes) score += Math.min(content.likes / 10, 15);
            if (content.shares) score += Math.min(content.shares / 5, 15);

            return Math.min(score, 100);
        }

        calculateRelevanceScore(content) {
            let score = 50;

            // Check keyword density
            const keywords = this.extractKeywords(content);
            if (keywords.length > 5) score += 15;

            // Check category relevance
            if (content.category && content.tags) {
                const categoryMatch = content.tags.includes(content.category);
                if (categoryMatch) score += 15;
            }

            // Check trending topics
            if (this.isTrendingTopic(content)) score += 20;

            return Math.min(score, 100);
        }

        calculateFreshnessScore(content) {
            const now = Date.now();
            const published = new Date(content.publishedAt || now).getTime();
            const ageHours = (now - published) / (1000 * 60 * 60);

            if (ageHours < 1) return 100;
            if (ageHours < 6) return 90;
            if (ageHours < 24) return 70;
            if (ageHours < 72) return 50;
            return 30;
        }

        calculateQualityScore(content) {
            let score = 50;

            // Check content length
            const wordCount = (content.content || '').split(/\s+/).length;
            if (wordCount > 500) score += 15;
            if (wordCount > 1000) score += 10;

            // Check multimedia presence
            if (content.images && content.images.length > 0) score += 10;
            if (content.videos && content.videos.length > 0) score += 15;

            return Math.min(score, 100);
        }

        calculateDiversityScore(content) {
            let score = 50;

            // Check topic diversity
            const recentContent = Array.from(this.optimizedContent.values()).slice(-10);
            const sameCategoryCount = recentContent.filter(c => c.category === content.category).length;

            if (sameCategoryCount < 3) score += 25;
            else if (sameCategoryCount < 5) score += 10;

            // Check author diversity
            if (content.author) {
                const sameAuthorCount = recentContent.filter(c => c.author === content.author).length;
                if (sameAuthorCount < 2) score += 25;
            }

            return Math.min(score, 100);
        }

        extractKeywords(content) {
            const text = `${content.title || ''} ${content.content || ''}`.toLowerCase();
            const words = text.match(/\b[a-z]{4,}\b/g) || [];

            // Count frequency
            const frequency = {};
            words.forEach(word => {
                frequency[word] = (frequency[word] || 0) + 1;
            });

            // Get top keywords
            return Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([word]) => word);
        }

        isTrendingTopic(content) {
            // Simple trending detection based on keywords
            const trendingKeywords = ['breaking', 'exclusive', 'championship', 'record', 'historic'];
            const title = (content.title || '').toLowerCase();

            return trendingKeywords.some(keyword => title.includes(keyword));
        }

        generateRecommendations(content, scores) {
            const recommendations = [];

            // Engagement recommendations
            if (scores.engagement < 60) {
                recommendations.push({
                    type: 'engagement',
                    priority: 'high',
                    suggestion: 'Add call-to-action to encourage user interaction'
                });
            }

            // Relevance recommendations
            if (scores.relevance < 60) {
                recommendations.push({
                    type: 'relevance',
                    priority: 'medium',
                    suggestion: 'Add more relevant tags and keywords'
                });
            }

            // Quality recommendations
            if (scores.quality < 70) {
                if (!content.images || content.images.length === 0) {
                    recommendations.push({
                        type: 'quality',
                        priority: 'high',
                        suggestion: 'Add featured image to improve visual appeal'
                    });
                }
            }

            // Diversity recommendations
            if (scores.diversity < 50) {
                recommendations.push({
                    type: 'diversity',
                    priority: 'low',
                    suggestion: 'Consider varying content topics for better distribution'
                });
            }

            return recommendations;
        }

        estimateReach(scores) {
            // Weighted formula for reach estimation
            const weights = {
                engagement: 0.25,
                relevance: 0.25,
                freshness: 0.20,
                quality: 0.20,
                diversity: 0.10
            };

            let totalScore = 0;
            Object.keys(weights).forEach(factor => {
                totalScore += (scores[factor] || 0) * weights[factor];
            });

            // Convert to estimated reach (synthetic metric)
            return Math.round(totalScore * 100);
        }

        applyOptimizations(content, optimization) {
            // Apply SEO enhancements
            this.enhanceSEO(content, optimization);

            // Apply social media optimizations
            this.optimizeSocialSharing(content, optimization);

            // Apply discovery surface optimizations
            this.optimizeDiscovery(content, optimization);

            this.logOptimization('APPLY', `Applied optimizations to "${content.title}"`);
        }

        enhanceSEO(content, optimization) {
            const keywords = this.extractKeywords(content);

            // Ensure meta tags are optimized
            content.metaKeywords = keywords.slice(0, 5).join(', ');

            // Optimize title for SEO
            if (!content.seoTitle && content.title) {
                content.seoTitle = content.title.substring(0, 60);
            }

            // Generate meta description if missing
            if (!content.metaDescription && content.content) {
                content.metaDescription = content.content.substring(0, 155) + '...';
            }
        }

        optimizeSocialSharing(content, optimization) {
            // Ensure Open Graph tags
            if (!content.ogTitle) content.ogTitle = content.title;
            if (!content.ogDescription) content.ogDescription = content.metaDescription;
            if (!content.ogImage && content.images && content.images[0]) {
                content.ogImage = content.images[0].src;
            }

            // Twitter Card optimization
            if (!content.twitterCard) content.twitterCard = 'summary_large_image';
        }

        optimizeDiscovery(content, optimization) {
            // Calculate priority for discovery surfaces
            const avgScore = Object.values(optimization.scores).reduce((a, b) => a + b, 0) / 5;

            content.discoveryPriority = avgScore > 75 ? 'high' : avgScore > 50 ? 'medium' : 'low';
            content.boostFactor = Math.round(avgScore / 10);
        }

        startOptimization() {
            console.log('🚀 [Layer 173] Starting reach optimization...');

            setInterval(() => {
                this.optimizeAllContent();
            }, CONFIG.intervals.optimizationCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.optimizeReach(event.detail.article);
                }
            });
        }

        optimizeAllContent() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.optimizedContent.has(article.id)) {
                            this.optimizeReach(article);
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
            // Calculate average reach increase
            const optimizations = Array.from(this.optimizedContent.values());
            if (optimizations.length > 0) {
                const totalReach = optimizations.reduce((sum, opt) => sum + opt.estimatedReach, 0);
                this.stats.avgReachIncrease = Math.round(totalReach / optimizations.length);

                // Count top performers (>75% reach)
                this.stats.topPerformers = optimizations.filter(opt => opt.estimatedReach > 7500).length;

                // Calculate diversity score
                const diversityScores = optimizations.map(opt => opt.scores.diversity || 0);
                this.stats.diversityScore = Math.round(
                    diversityScores.reduce((a, b) => a + b, 0) / diversityScores.length
                );
            }

            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.reachOptimizationStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer173-dashboard';
            dashboard.className = 'layer173-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer173-dashboard-header">
                    <h3>📈 Reach Optimizer</h3>
                    <button class="layer173-close-btn">×</button>
                </div>
                <div class="layer173-dashboard-content">
                    <div class="layer173-stat">
                        <span class="layer173-stat-label">Optimized:</span>
                        <span class="layer173-stat-value" id="layer173-optimized">0</span>
                    </div>
                    <div class="layer173-stat">
                        <span class="layer173-stat-label">Avg Reach:</span>
                        <span class="layer173-stat-value" id="layer173-reach">0</span>
                    </div>
                    <div class="layer173-stat">
                        <span class="layer173-stat-label">Top Performers:</span>
                        <span class="layer173-stat-value" id="layer173-performers">0</span>
                    </div>
                    <div class="layer173-log" id="layer173-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer173-toggle-btn';
            toggleBtn.innerHTML = '📈';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer173-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const optimizedEl = document.getElementById('layer173-optimized');
            const reachEl = document.getElementById('layer173-reach');
            const performersEl = document.getElementById('layer173-performers');

            if (optimizedEl) optimizedEl.textContent = this.stats.totalOptimized;
            if (reachEl) reachEl.textContent = this.stats.avgReachIncrease;
            if (performersEl) performersEl.textContent = this.stats.topPerformers;

            const logEl = document.getElementById('layer173-log');
            if (logEl && this.optimizationLog.length > 0) {
                const recentLogs = this.optimizationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer173-log-entry">
                        <span class="layer173-log-type">${log.type}</span>
                        <span class="layer173-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logOptimization(type, message) {
            this.optimizationLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.optimizationLog.length > 100) this.optimizationLog.shift();
        }

        getOptimization(contentId) {
            return this.optimizedContent.get(contentId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReachOptimizer);
    } else {
        initReachOptimizer();
    }

    function initReachOptimizer() {
        const optimizer = new ReachOptimizer();
        window.Layer173_ReachOptimizer = optimizer;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.reachOptimizer = optimizer;
        document.dispatchEvent(new CustomEvent('layer173:ready', { detail: { optimizer } }));
        console.log('🎯 [Layer 173] Reach Optimizer - Ready');
    }

})();
