/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 151 – UNIVERSAL ARTICLE SYNDICATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Republishes each approved article to all relevant categories, 
 * regions, and topical hubs dynamically.
 * 
 * Features:
 * - Dynamic article syndication across categories
 * - Regional content distribution
 * - Topical hub mapping and content routing
 * - Automatic cross-publishing to relevant sections
 * - Syndication rules engine
 * - Content replication management
 * - Multi-region support with localization
 * - Syndication analytics and tracking
 * 
 * @version 1.0.0
 * @layer 151
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CORE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        version: '1.0.0',
        layerId: 151,
        name: 'Universal Article Syndication Engine',

        // Syndication targets
        regions: ['north-america', 'europe', 'asia', 'africa', 'south-america', 'oceania'],
        categories: ['football', 'basketball', 'tennis', 'cricket', 'rugby', 'baseball', 'hockey'],
        topicalHubs: ['breaking-news', 'transfers', 'results', 'analysis', 'opinions', 'interviews'],

        // Syndication rules
        rules: {
            autoApprove: true,
            requireManualReview: false,
            respectRegionalRestrictions: true,
            enableCrossRegional: true,
            maxSyndicationTargets: 20,
            deduplicationEnabled: true
        },

        // Update intervals (ms)
        intervals: {
            syndicationCheck: 3000,        // Check for new articles every 3s
            analyticsUpdate: 30000          // Update analytics every 30s
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SYNDICATION ENGINE CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class UniversalSyndicationEngine {
        constructor() {
            this.syndicatedArticles = new Map();    // Article ID -> syndication targets
            this.targetMapping = new Map();         // Target -> article IDs
            this.syndicationQueue = [];             // Pending syndications
            this.syndicationLog = [];               // Syndication history
            this.config = null;
            this.stats = {
                totalSyndicated: 0,
                activeTargets: 0,
                pendingQueue: 0
            };

            this.init();
        }

        // ───────────────────────────────────────────────────────────────────
        // INITIALIZATION
        // ───────────────────────────────────────────────────────────────────

        async init() {
            console.log('🔄 [Layer 151] Universal Article Syndication Engine - Initializing...');

            try {
                // Load configuration
                await this.loadConfiguration();

                // Initialize syndication targets
                this.initializeTargets();

                // Start syndication engine
                this.startSyndicationEngine();

                // Start analytics
                this.startAnalytics();

                // Create monitoring dashboard
                this.createDashboard();

                console.log('✅ [Layer 151] Universal Article Syndication Engine - Active');
                this.logSyndication('SYSTEM', 'Syndication engine initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 151] Initialization failed:', error);
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // CONFIGURATION LOADING
        // ───────────────────────────────────────────────────────────────────

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer151-syndication-engine.json');
                if (response.ok) {
                    this.config = await response.json();
                    console.log('📋 [Layer 151] Configuration loaded');
                } else {
                    this.config = this.getDefaultConfig();
                    console.log('📋 [Layer 151] Using default configuration');
                }
            } catch (error) {
                this.config = this.getDefaultConfig();
                console.log('📋 [Layer 151] Using default configuration (fetch failed)');
            }
        }

        getDefaultConfig() {
            return {
                regions: CONFIG.regions,
                categories: CONFIG.categories,
                topicalHubs: CONFIG.topicalHubs,
                syndicationRules: CONFIG.rules,
                enabled: true
            };
        }

        // ───────────────────────────────────────────────────────────────────
        // TARGET INITIALIZATION
        // ───────────────────────────────────────────────────────────────────

        initializeTargets() {
            console.log('🎯 [Layer 151] Initializing syndication targets...');

            // Initialize regional targets
            CONFIG.regions.forEach(region => {
                CONFIG.categories.forEach(category => {
                    const targetId = `${region}-${category}`;
                    this.targetMapping.set(targetId, []);
                });

                CONFIG.topicalHubs.forEach(hub => {
                    const targetId = `${region}-${hub}`;
                    this.targetMapping.set(targetId, []);
                });
            });

            this.stats.activeTargets = this.targetMapping.size;
            console.log(`✅ [Layer 151] Initialized ${this.stats.activeTargets} syndication targets`);
        }

        // ───────────────────────────────────────────────────────────────────
        // ARTICLE SYNDICATION
        // ───────────────────────────────────────────────────────────────────

        syndicateArticle(article) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 151] Invalid article provided');
                return false;
            }

            // Check if already syndicated
            if (CONFIG.rules.deduplicationEnabled && this.syndicatedArticles.has(article.id)) {
                console.log(`⏭️ [Layer 151] Article ${article.id} already syndicated`);
                return false;
            }

            try {
                // Determine syndication targets
                const targets = this.determineSyndicationTargets(article);

                // Syndicate to each target
                targets.forEach(target => {
                    this.syndicateToTarget(article, target);
                });

                // Record syndication
                this.syndicatedArticles.set(article.id, targets);
                this.stats.totalSyndicated++;

                // Log syndication
                this.logSyndication('SYNDICATE', `Article "${article.title}" syndicated to ${targets.length} targets`);

                console.log(`✅ [Layer 151] Article "${article.title}" syndicated to ${targets.length} targets`);
                return true;

            } catch (error) {
                console.error(`❌ [Layer 151] Syndication failed for article ${article.id}:`, error);
                return false;
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // TARGET DETERMINATION
        // ───────────────────────────────────────────────────────────────────

        determineSyndicationTargets(article) {
            const targets = new Set();

            // Add category-based targets
            if (article.categories) {
                article.categories.forEach(category => {
                    CONFIG.regions.forEach(region => {
                        // Check regional restrictions
                        if (this.canSyndicateToRegion(article, region)) {
                            targets.add(`${region}-${category}`);
                        }
                    });
                });
            }

            // Add topical hub targets
            if (article.tags || article.topics) {
                const topics = article.tags || article.topics || [];
                topics.forEach(topic => {
                    const matchingHub = this.findMatchingHub(topic);
                    if (matchingHub) {
                        CONFIG.regions.forEach(region => {
                            if (this.canSyndicateToRegion(article, region)) {
                                targets.add(`${region}-${matchingHub}`);
                            }
                        });
                    }
                });
            }

            // Add breaking news hub if article is marked as breaking
            if (article.breaking || article.priority === 'high') {
                CONFIG.regions.forEach(region => {
                    if (this.canSyndicateToRegion(article, region)) {
                        targets.add(`${region}-breaking-news`);
                    }
                });
            }

            // Limit targets if needed
            const targetArray = Array.from(targets);
            if (targetArray.length > CONFIG.rules.maxSyndicationTargets) {
                return targetArray.slice(0, CONFIG.rules.maxSyndicationTargets);
            }

            return targetArray;
        }

        canSyndicateToRegion(article, region) {
            // Check regional restrictions
            if (article.restrictedRegions && article.restrictedRegions.includes(region)) {
                return false;
            }

            // Check if cross-regional is enabled
            if (!CONFIG.rules.enableCrossRegional && article.primaryRegion !== region) {
                return false;
            }

            return true;
        }

        findMatchingHub(topic) {
            const topicLower = topic.toLowerCase();
            return CONFIG.topicalHubs.find(hub =>
                topicLower.includes(hub) || hub.includes(topicLower)
            );
        }

        // ───────────────────────────────────────────────────────────────────
        // SYNDICATION TO TARGET
        // ───────────────────────────────────────────────────────────────────

        syndicateToTarget(article, targetId) {
            // Get target articles
            const targetArticles = this.targetMapping.get(targetId) || [];

            // Add article to target
            if (!targetArticles.includes(article.id)) {
                targetArticles.unshift(article.id);

                // Limit articles per target
                if (targetArticles.length > 50) {
                    targetArticles.pop();
                }

                this.targetMapping.set(targetId, targetArticles);

                // Update DOM if target container exists
                this.updateTargetContainer(targetId, article);
            }
        }

        updateTargetContainer(targetId, article) {
            const containerId = `syndication-target-${targetId}`;
            const container = document.getElementById(containerId);

            if (container) {
                const articleElement = this.createArticleElement(article, targetId);
                container.insertBefore(articleElement, container.firstChild);

                // Limit displayed articles
                while (container.children.length > 10) {
                    container.removeChild(container.lastChild);
                }
            }
        }

        createArticleElement(article, targetId) {
            const element = document.createElement('div');
            element.className = 'syndicated-article-item';
            element.setAttribute('data-article-id', article.id);
            element.setAttribute('data-target-id', targetId);

            element.innerHTML = `
                <div class="syndicated-article-content">
                    <h4 class="syndicated-article-title">${this.escapeHtml(article.title)}</h4>
                    <p class="syndicated-article-meta">
                        <span class="syndicated-badge">📡 Syndicated</span>
                        <span class="syndicated-target">${targetId}</span>
                        <span class="syndicated-time">${this.getTimeAgo(article.publishedAt)}</span>
                    </p>
                </div>
            `;

            element.addEventListener('click', () => {
                window.location.href = article.url || `article.html?id=${article.id}`;
            });

            return element;
        }

        // ───────────────────────────────────────────────────────────────────
        // SYNDICATION ENGINE
        // ───────────────────────────────────────────────────────────────────

        startSyndicationEngine() {
            console.log('🚀 [Layer 151] Starting syndication engine...');

            // Check for new articles periodically
            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.syndicationCheck);

            // Listen for article approval events
            document.addEventListener('article:approved', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForSyndication(event.detail.article);
                }
            });

            // Listen for bulk syndication requests
            document.addEventListener('articles:bulk-syndicate', (event) => {
                if (event.detail && event.detail.articles) {
                    event.detail.articles.forEach(article => {
                        this.queueForSyndication(article);
                    });
                }
            });
        }

        queueForSyndication(article) {
            if (!this.syndicationQueue.find(a => a.id === article.id)) {
                this.syndicationQueue.push(article);
                this.stats.pendingQueue = this.syndicationQueue.length;
                console.log(`📥 [Layer 151] Article "${article.title}" queued for syndication`);
            }
        }

        processQueue() {
            if (this.syndicationQueue.length === 0) return;

            const article = this.syndicationQueue.shift();
            if (article) {
                this.syndicateArticle(article);
                this.stats.pendingQueue = this.syndicationQueue.length;
            }
        }

        checkForNewArticles() {
            // Check if distributor has new articles
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                const stats = distributor.getStats();

                // Get articles that haven't been syndicated yet
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.syndicatedArticles.has(article.id)) {
                            this.queueForSyndication(article);
                        }
                    });
                }
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // ANALYTICS & TRACKING
        // ───────────────────────────────────────────────────────────────────

        startAnalytics() {
            console.log('📊 [Layer 151] Starting analytics tracking...');

            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();

            // Expose analytics
            if (window.SPORTIQ) {
                window.SPORTIQ.syndicationStats = this.stats;
            }

            // Update dashboard
            this.updateDashboard();
        }

        // ───────────────────────────────────────────────────────────────────
        // DASHBOARD UI
        // ───────────────────────────────────────────────────────────────────

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer151-dashboard';
            dashboard.className = 'layer151-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer151-dashboard-header">
                    <h3>🔄 Syndication Engine</h3>
                    <button class="layer151-close-btn">×</button>
                </div>
                <div class="layer151-dashboard-content">
                    <div class="layer151-stat">
                        <span class="layer151-stat-label">Total Syndicated:</span>
                        <span class="layer151-stat-value" id="layer151-total">0</span>
                    </div>
                    <div class="layer151-stat">
                        <span class="layer151-stat-label">Active Targets:</span>
                        <span class="layer151-stat-value" id="layer151-targets">0</span>
                    </div>
                    <div class="layer151-stat">
                        <span class="layer151-stat-label">Pending Queue:</span>
                        <span class="layer151-stat-value" id="layer151-queue">0</span>
                    </div>
                    <div class="layer151-log" id="layer151-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer151-toggle-btn';
            toggleBtn.innerHTML = '🔄';
            toggleBtn.title = 'Toggle Syndication Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer151-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer151-total');
            const targetsEl = document.getElementById('layer151-targets');
            const queueEl = document.getElementById('layer151-queue');

            if (totalEl) totalEl.textContent = this.stats.totalSyndicated;
            if (targetsEl) targetsEl.textContent = this.stats.activeTargets;
            if (queueEl) queueEl.textContent = this.stats.pendingQueue;

            // Update log
            const logEl = document.getElementById('layer151-log');
            if (logEl && this.syndicationLog.length > 0) {
                const recentLogs = this.syndicationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer151-log-entry">
                        <span class="layer151-log-type">${log.type}</span>
                        <span class="layer151-log-message">${log.message}</span>
                        <span class="layer151-log-time">${this.getTimeAgo(log.timestamp)}</span>
                    </div>
                `).join('');
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // UTILITY FUNCTIONS
        // ───────────────────────────────────────────────────────────────────

        logSyndication(type, message) {
            this.syndicationLog.push({
                type,
                message,
                timestamp: new Date().toISOString()
            });

            if (this.syndicationLog.length > 100) {
                this.syndicationLog.shift();
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        getTimeAgo(timestamp) {
            if (!timestamp) return 'Just now';

            const now = new Date();
            const then = new Date(timestamp);
            const seconds = Math.floor((now - then) / 1000);

            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
        }

        // ───────────────────────────────────────────────────────────────────
        // PUBLIC API
        // ───────────────────────────────────────────────────────────────────

        getSyndicatedArticles() {
            return Array.from(this.syndicatedArticles.keys());
        }

        getTargetArticles(targetId) {
            return this.targetMapping.get(targetId) || [];
        }

        getStats() {
            return { ...this.stats };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION & GLOBAL EXPOSURE
    // ═══════════════════════════════════════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyndicationEngine);
    } else {
        initSyndicationEngine();
    }

    function initSyndicationEngine() {
        const engine = new UniversalSyndicationEngine();

        // Expose to global scope
        window.Layer151_SyndicationEngine = engine;

        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }
        window.SPORTIQ.syndicationEngine = engine;

        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('layer151:ready', {
            detail: { engine }
        }));

        console.log('🎯 [Layer 151] Universal Article Syndication Engine - Ready');
    }

})();
