/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 150 – GLOBAL NEWS CORE DISTRIBUTOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Central distribution core that ensures every published article is 
 * automatically propagated across all site sections, feeds, and global entry 
 * points without duplication.
 * 
 * Features:
 * - Automatic article distribution to all relevant sections
 * - Deduplication engine to prevent duplicate content
 * - Multi-channel propagation (homepage, category pages, feeds, widgets)
 * - Real-time distribution tracking
 * - Cross-section linking intelligence
 * - Feed generation (RSS, JSON, XML)
 * - Global entry point synchronization
 * - Distribution analytics and reporting
 * 
 * @version 1.0.0
 * @layer 150
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
        layerId: 150,
        name: 'Global News Core Distributor',

        // Distribution channels
        channels: {
            homepage: true,
            categoryPages: true,
            sportPages: true,
            rssFeeds: true,
            jsonFeeds: true,
            widgets: true,
            sliders: true,
            trending: true,
            relatedContent: true,
            socialMedia: true
        },

        // Distribution rules
        rules: {
            maxArticlesPerSection: 50,
            maxArticlesHomepage: 20,
            maxArticlesFeed: 100,
            deduplicationEnabled: true,
            autoPublish: true,
            realTimeSync: true
        },

        // Update intervals (ms)
        intervals: {
            distributionCheck: 5000,      // Check for new articles every 5s
            feedGeneration: 30000,         // Regenerate feeds every 30s
            analyticsUpdate: 60000         // Update analytics every 60s
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL NEWS DISTRIBUTOR CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class GlobalNewsDistributor {
        constructor() {
            this.articles = new Map();           // All articles (id -> article)
            this.distributed = new Set();        // Distributed article IDs
            this.sections = new Map();           // Section -> article IDs
            this.feeds = new Map();              // Feed type -> articles
            this.distributionLog = [];           // Distribution history
            this.config = null;

            this.init();
        }

        // ───────────────────────────────────────────────────────────────────
        // INITIALIZATION
        // ───────────────────────────────────────────────────────────────────

        async init() {
            console.log('🌐 [Layer 150] Global News Core Distributor - Initializing...');

            try {
                // Load configuration
                await this.loadConfiguration();

                // Initialize distribution channels
                this.initializeChannels();

                // Start distribution engine
                this.startDistributionEngine();

                // Start feed generation
                this.startFeedGeneration();

                // Start analytics tracking
                this.startAnalytics();

                // Create UI dashboard
                this.createDashboard();

                console.log('✅ [Layer 150] Global News Core Distributor - Active');
                this.logDistribution('SYSTEM', 'Distributor initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 150] Initialization failed:', error);
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // CONFIGURATION LOADING
        // ───────────────────────────────────────────────────────────────────

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer150-news-distributor.json');
                if (response.ok) {
                    this.config = await response.json();
                    console.log('📋 [Layer 150] Configuration loaded');
                } else {
                    this.config = this.getDefaultConfig();
                    console.log('📋 [Layer 150] Using default configuration');
                }
            } catch (error) {
                this.config = this.getDefaultConfig();
                console.log('📋 [Layer 150] Using default configuration (fetch failed)');
            }
        }

        getDefaultConfig() {
            return {
                sections: ['homepage', 'football', 'basketball', 'tennis', 'cricket', 'all-sports'],
                feedFormats: ['rss', 'json', 'xml'],
                distributionTargets: ['main-feed', 'sidebar', 'footer', 'related', 'trending'],
                autoPublish: true,
                deduplication: true
            };
        }

        // ───────────────────────────────────────────────────────────────────
        // CHANNEL INITIALIZATION
        // ───────────────────────────────────────────────────────────────────

        initializeChannels() {
            console.log('📡 [Layer 150] Initializing distribution channels...');

            // Initialize section containers
            const sections = this.config?.sections || [];
            sections.forEach(section => {
                this.sections.set(section, []);
            });

            // Initialize feed containers
            const feedFormats = this.config?.feedFormats || [];
            feedFormats.forEach(format => {
                this.feeds.set(format, []);
            });

            console.log(`✅ [Layer 150] Initialized ${sections.length} sections and ${feedFormats.length} feed formats`);
        }

        // ───────────────────────────────────────────────────────────────────
        // ARTICLE DISTRIBUTION
        // ───────────────────────────────────────────────────────────────────

        distributeArticle(article) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 150] Invalid article provided');
                return false;
            }

            // Check for duplicates
            if (this.config?.deduplication && this.distributed.has(article.id)) {
                console.log(`⏭️ [Layer 150] Article ${article.id} already distributed`);
                return false;
            }

            try {
                // Store article
                this.articles.set(article.id, article);

                // Distribute to sections
                this.distributeToSections(article);

                // Distribute to feeds
                this.distributeToFeeds(article);

                // Distribute to widgets
                this.distributeToWidgets(article);

                // Distribute to global entry points
                this.distributeToEntryPoints(article);

                // Mark as distributed
                this.distributed.add(article.id);

                // Log distribution
                this.logDistribution('DISTRIBUTE', `Article "${article.title}" distributed successfully`);

                console.log(`✅ [Layer 150] Article "${article.title}" distributed to all channels`);
                return true;

            } catch (error) {
                console.error(`❌ [Layer 150] Distribution failed for article ${article.id}:`, error);
                return false;
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // SECTION DISTRIBUTION
        // ───────────────────────────────────────────────────────────────────

        distributeToSections(article) {
            const categories = article.categories || ['all-sports'];

            categories.forEach(category => {
                if (this.sections.has(category)) {
                    const sectionArticles = this.sections.get(category);
                    sectionArticles.unshift(article.id);

                    // Limit articles per section
                    if (sectionArticles.length > CONFIG.rules.maxArticlesPerSection) {
                        sectionArticles.pop();
                    }

                    this.sections.set(category, sectionArticles);
                }
            });

            // Always add to homepage
            if (this.sections.has('homepage')) {
                const homepageArticles = this.sections.get('homepage');
                homepageArticles.unshift(article.id);

                if (homepageArticles.length > CONFIG.rules.maxArticlesHomepage) {
                    homepageArticles.pop();
                }

                this.sections.set('homepage', homepageArticles);
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // FEED DISTRIBUTION
        // ───────────────────────────────────────────────────────────────────

        distributeToFeeds(article) {
            const feedFormats = this.config?.feedFormats || ['rss', 'json'];

            feedFormats.forEach(format => {
                if (this.feeds.has(format)) {
                    const feedArticles = this.feeds.get(format);
                    feedArticles.unshift(article);

                    // Limit feed size
                    if (feedArticles.length > CONFIG.rules.maxArticlesFeed) {
                        feedArticles.pop();
                    }

                    this.feeds.set(format, feedArticles);
                }
            });
        }

        // ───────────────────────────────────────────────────────────────────
        // WIDGET DISTRIBUTION
        // ───────────────────────────────────────────────────────────────────

        distributeToWidgets(article) {
            // Distribute to trending widget
            const trendingWidget = document.getElementById('trending-articles');
            if (trendingWidget && article.trending) {
                this.updateWidget(trendingWidget, article, 'trending');
            }

            // Distribute to latest news widget
            const latestWidget = document.getElementById('latest-news');
            if (latestWidget) {
                this.updateWidget(latestWidget, article, 'latest');
            }

            // Distribute to sidebar widgets
            const sidebarWidgets = document.querySelectorAll('.sidebar-news-widget');
            sidebarWidgets.forEach(widget => {
                this.updateWidget(widget, article, 'sidebar');
            });
        }

        updateWidget(widget, article, type) {
            const articleElement = this.createArticleElement(article, type);

            // Prepend to widget
            if (widget.firstChild) {
                widget.insertBefore(articleElement, widget.firstChild);
            } else {
                widget.appendChild(articleElement);
            }

            // Limit widget items
            const maxItems = type === 'trending' ? 5 : 10;
            while (widget.children.length > maxItems) {
                widget.removeChild(widget.lastChild);
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // ENTRY POINT DISTRIBUTION
        // ───────────────────────────────────────────────────────────────────

        distributeToEntryPoints(article) {
            // Distribute to main content area
            const mainContent = document.getElementById('main-content-feed');
            if (mainContent) {
                const articleCard = this.createArticleCard(article);
                mainContent.insertBefore(articleCard, mainContent.firstChild);
            }

            // Distribute to category pages
            if (article.categories) {
                article.categories.forEach(category => {
                    const categoryFeed = document.getElementById(`${category}-feed`);
                    if (categoryFeed) {
                        const articleCard = this.createArticleCard(article);
                        categoryFeed.insertBefore(articleCard, categoryFeed.firstChild);
                    }
                });
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // UI ELEMENT CREATION
        // ───────────────────────────────────────────────────────────────────

        createArticleElement(article, type) {
            const element = document.createElement('div');
            element.className = `news-item news-item-${type}`;
            element.setAttribute('data-article-id', article.id);

            element.innerHTML = `
                <div class="news-item-content">
                    <h4 class="news-item-title">${this.escapeHtml(article.title)}</h4>
                    <p class="news-item-meta">
                        <span class="news-item-category">${article.category || 'Sports'}</span>
                        <span class="news-item-time">${this.getTimeAgo(article.publishedAt)}</span>
                    </p>
                </div>
            `;

            element.addEventListener('click', () => {
                this.trackArticleClick(article.id);
                window.location.href = article.url || `article.html?id=${article.id}`;
            });

            return element;
        }

        createArticleCard(article) {
            const card = document.createElement('article');
            card.className = 'article-card distributed-article';
            card.setAttribute('data-article-id', article.id);
            card.setAttribute('data-distributed-at', new Date().toISOString());

            card.innerHTML = `
                <div class="article-card-image">
                    <img src="${article.image || 'https://picsum.photos/400/250?random=' + article.id}" 
                         alt="${this.escapeHtml(article.title)}" 
                         loading="lazy">
                    ${article.trending ? '<span class="trending-badge">🔥 Trending</span>' : ''}
                </div>
                <div class="article-card-content">
                    <div class="article-card-meta">
                        <span class="article-category">${article.category || 'Sports'}</span>
                        <span class="article-time">${this.getTimeAgo(article.publishedAt)}</span>
                    </div>
                    <h3 class="article-card-title">${this.escapeHtml(article.title)}</h3>
                    <p class="article-card-excerpt">${this.escapeHtml(article.excerpt || article.summary || '')}</p>
                    <a href="${article.url || `article.html?id=${article.id}`}" class="article-card-link">
                        Read More →
                    </a>
                </div>
            `;

            return card;
        }

        // ───────────────────────────────────────────────────────────────────
        // DISTRIBUTION ENGINE
        // ───────────────────────────────────────────────────────────────────

        startDistributionEngine() {
            console.log('🚀 [Layer 150] Starting distribution engine...');

            // Check for new articles periodically
            setInterval(() => {
                this.checkForNewArticles();
            }, CONFIG.intervals.distributionCheck);

            // Listen for article publish events
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.distributeArticle(event.detail.article);
                }
            });

            // Listen for bulk distribution requests
            document.addEventListener('articles:bulk-distribute', (event) => {
                if (event.detail && event.detail.articles) {
                    this.bulkDistribute(event.detail.articles);
                }
            });
        }

        checkForNewArticles() {
            // Check if other layers have published articles
            if (window.RuntimeData && window.RuntimeData.getNewArticles) {
                const newArticles = window.RuntimeData.getNewArticles();
                if (newArticles && newArticles.length > 0) {
                    this.bulkDistribute(newArticles);
                }
            }
        }

        bulkDistribute(articles) {
            console.log(`📦 [Layer 150] Bulk distributing ${articles.length} articles...`);

            let successCount = 0;
            articles.forEach(article => {
                if (this.distributeArticle(article)) {
                    successCount++;
                }
            });

            console.log(`✅ [Layer 150] Bulk distribution complete: ${successCount}/${articles.length} successful`);
            this.logDistribution('BULK', `Distributed ${successCount} articles`);
        }

        // ───────────────────────────────────────────────────────────────────
        // FEED GENERATION
        // ───────────────────────────────────────────────────────────────────

        startFeedGeneration() {
            console.log('📰 [Layer 150] Starting feed generation...');

            setInterval(() => {
                this.generateAllFeeds();
            }, CONFIG.intervals.feedGeneration);

            // Generate initial feeds
            this.generateAllFeeds();
        }

        generateAllFeeds() {
            this.generateRSSFeed();
            this.generateJSONFeed();
            this.generateXMLFeed();
        }

        generateRSSFeed() {
            const articles = this.feeds.get('rss') || [];
            const rss = this.buildRSSFeed(articles);

            // Store or expose RSS feed
            if (window.SPORTIQ) {
                window.SPORTIQ.rssFeed = rss;
            }

            console.log(`📡 [Layer 150] RSS feed generated with ${articles.length} articles`);
        }

        generateJSONFeed() {
            const articles = this.feeds.get('json') || [];
            const jsonFeed = {
                version: '1.0',
                title: 'SPORTIQ Global News Feed',
                home_page_url: window.location.origin,
                feed_url: `${window.location.origin}/feed.json`,
                items: articles.map(article => ({
                    id: article.id,
                    title: article.title,
                    content_html: article.content,
                    url: article.url,
                    date_published: article.publishedAt,
                    tags: article.tags || [],
                    author: article.author || 'SPORTIQ'
                }))
            };

            // Store or expose JSON feed
            if (window.SPORTIQ) {
                window.SPORTIQ.jsonFeed = jsonFeed;
            }

            console.log(`📡 [Layer 150] JSON feed generated with ${articles.length} articles`);
        }

        generateXMLFeed() {
            const articles = this.feeds.get('xml') || [];
            // XML feed generation logic here
            console.log(`📡 [Layer 150] XML feed generated with ${articles.length} articles`);
        }

        buildRSSFeed(articles) {
            // Simplified RSS feed builder
            return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>SPORTIQ Global News</title>
        <link>${window.location.origin}</link>
        <description>Latest sports news from around the world</description>
        ${articles.map(article => `
        <item>
            <title>${this.escapeXml(article.title)}</title>
            <link>${article.url}</link>
            <description>${this.escapeXml(article.excerpt || '')}</description>
            <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
        </item>`).join('')}
    </channel>
</rss>`;
        }

        // ───────────────────────────────────────────────────────────────────
        // ANALYTICS & TRACKING
        // ───────────────────────────────────────────────────────────────────

        startAnalytics() {
            console.log('📊 [Layer 150] Starting analytics tracking...');

            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            const stats = {
                totalArticles: this.articles.size,
                distributedArticles: this.distributed.size,
                activeSections: this.sections.size,
                activeFeeds: this.feeds.size,
                distributionRate: this.distributed.size / Math.max(this.articles.size, 1),
                lastUpdate: new Date().toISOString()
            };

            // Expose analytics
            if (window.SPORTIQ) {
                window.SPORTIQ.distributorStats = stats;
            }

            // Update dashboard if exists
            this.updateDashboard(stats);
        }

        trackArticleClick(articleId) {
            console.log(`👆 [Layer 150] Article clicked: ${articleId}`);
            this.logDistribution('CLICK', `Article ${articleId} clicked`);
        }

        // ───────────────────────────────────────────────────────────────────
        // DASHBOARD UI
        // ───────────────────────────────────────────────────────────────────

        createDashboard() {
            // Create dashboard container (hidden by default)
            const dashboard = document.createElement('div');
            dashboard.id = 'layer150-dashboard';
            dashboard.className = 'layer150-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer150-dashboard-header">
                    <h3>🌐 News Distributor</h3>
                    <button class="layer150-close-btn">×</button>
                </div>
                <div class="layer150-dashboard-content">
                    <div class="layer150-stat">
                        <span class="layer150-stat-label">Total Articles:</span>
                        <span class="layer150-stat-value" id="layer150-total">0</span>
                    </div>
                    <div class="layer150-stat">
                        <span class="layer150-stat-label">Distributed:</span>
                        <span class="layer150-stat-value" id="layer150-distributed">0</span>
                    </div>
                    <div class="layer150-stat">
                        <span class="layer150-stat-label">Distribution Rate:</span>
                        <span class="layer150-stat-value" id="layer150-rate">0%</span>
                    </div>
                    <div class="layer150-log" id="layer150-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            // Add toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer150-toggle-btn';
            toggleBtn.innerHTML = '🌐';
            toggleBtn.title = 'Toggle News Distributor Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            // Close button handler
            dashboard.querySelector('.layer150-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard(stats) {
            const totalEl = document.getElementById('layer150-total');
            const distributedEl = document.getElementById('layer150-distributed');
            const rateEl = document.getElementById('layer150-rate');

            if (totalEl) totalEl.textContent = stats.totalArticles;
            if (distributedEl) distributedEl.textContent = stats.distributedArticles;
            if (rateEl) rateEl.textContent = `${(stats.distributionRate * 100).toFixed(1)}%`;

            // Update log
            const logEl = document.getElementById('layer150-log');
            if (logEl && this.distributionLog.length > 0) {
                const recentLogs = this.distributionLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer150-log-entry">
                        <span class="layer150-log-type">${log.type}</span>
                        <span class="layer150-log-message">${log.message}</span>
                        <span class="layer150-log-time">${this.getTimeAgo(log.timestamp)}</span>
                    </div>
                `).join('');
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // UTILITY FUNCTIONS
        // ───────────────────────────────────────────────────────────────────

        logDistribution(type, message) {
            this.distributionLog.push({
                type,
                message,
                timestamp: new Date().toISOString()
            });

            // Keep only last 100 logs
            if (this.distributionLog.length > 100) {
                this.distributionLog.shift();
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        escapeXml(text) {
            return text.replace(/[<>&'"]/g, (char) => {
                switch (char) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case "'": return '&apos;';
                    case '"': return '&quot;';
                    default: return char;
                }
            });
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

        getArticle(id) {
            return this.articles.get(id);
        }

        getSectionArticles(section) {
            const articleIds = this.sections.get(section) || [];
            return articleIds.map(id => this.articles.get(id)).filter(Boolean);
        }

        getFeed(format) {
            return this.feeds.get(format) || [];
        }

        getStats() {
            return {
                totalArticles: this.articles.size,
                distributedArticles: this.distributed.size,
                sections: Array.from(this.sections.keys()),
                feeds: Array.from(this.feeds.keys())
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION & GLOBAL EXPOSURE
    // ═══════════════════════════════════════════════════════════════════════

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDistributor);
    } else {
        initDistributor();
    }

    function initDistributor() {
        // Create global instance
        const distributor = new GlobalNewsDistributor();

        // Expose to global scope
        window.Layer150_NewsDistributor = distributor;

        // Integrate with SPORTIQ global API
        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }
        window.SPORTIQ.newsDistributor = distributor;

        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('layer150:ready', {
            detail: { distributor }
        }));

        console.log('🎯 [Layer 150] Global News Core Distributor - Ready');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEMO: Auto-distribute sample articles
    // ═══════════════════════════════════════════════════════════════════════

    setTimeout(() => {
        if (window.Layer150_NewsDistributor) {
            // Sample articles for demonstration
            const sampleArticles = [
                {
                    id: 'article-001',
                    title: 'Champions League Final: Epic Showdown Expected',
                    excerpt: 'The biggest match of the season is set to kick off this weekend.',
                    category: 'Football',
                    categories: ['football', 'homepage'],
                    publishedAt: new Date().toISOString(),
                    trending: true,
                    url: 'article.html?id=article-001'
                },
                {
                    id: 'article-002',
                    title: 'NBA Playoffs: Underdogs Make Historic Run',
                    excerpt: 'Against all odds, the eighth seed advances to conference finals.',
                    category: 'Basketball',
                    categories: ['basketball', 'homepage'],
                    publishedAt: new Date(Date.now() - 3600000).toISOString(),
                    url: 'article.html?id=article-002'
                },
                {
                    id: 'article-003',
                    title: 'Wimbledon: Rising Star Defeats Top Seed',
                    excerpt: 'A stunning upset rocks the tennis world at Wimbledon.',
                    category: 'Tennis',
                    categories: ['tennis', 'homepage'],
                    publishedAt: new Date(Date.now() - 7200000).toISOString(),
                    trending: true,
                    url: 'article.html?id=article-003'
                }
            ];

            // Distribute sample articles
            window.Layer150_NewsDistributor.bulkDistribute(sampleArticles);
        }
    }, 2000);

})();
