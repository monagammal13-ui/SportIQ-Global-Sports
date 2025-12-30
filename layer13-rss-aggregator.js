/**
 * Layer 13: RSS Aggregation & Auto Content Runtime
 * ID: layer-013
 * Type: Core
 * Description: RSS feed aggregation, auto-fetch content, category mapping, and content distribution.
 */

class RSSAggregatorRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_RSS__) {
            console.warn('[RSS] RSS aggregator already initialized.');
            return window.__ANTIGRAVITY_RSS__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-013';
        this.name = 'RSS Aggregation Runtime';
        this.timestamp = new Date().toISOString();

        // Configuration
        this.config = null;
        this.feeds = [];
        this.aggregatedContent = [];
        this.categoryMap = {};

        // Auto-update
        this.autoUpdateInterval = null;
        this.updateFrequency = 300000; // 5 minutes default

        // Statistics
        this.stats = {
            totalFeeds: 0,
            activeFa: 0,
            articlesAggregated: 0,
            lastUpdate: null,
            failedFetches: 0
        };

        console.log(`[RSS v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize RSS aggregator
     */
    async _init() {
        try {
            await this._loadConfig();
            await this._loadCategoryMap();
            await this._restoreAggregatedContent();
            this._setupAutoUpdate();
            this._registerEvents();

            // Initial fetch
            await this.fetchAllFeeds();

            console.log('[RSS] Initialized successfully');
        } catch (error) {
            console.error('[RSS] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'rss:init');
            }
        }
    }

    /**
     * Load configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/rss-config.json');
            if (response.ok) {
                this.config = await response.json();
                this.feeds = this.config.feeds || [];
                this.updateFrequency = this.config.updateFrequency || 300000;
                console.log('[RSS] Configuration loaded');
            }
        } catch (error) {
            console.warn('[RSS] Using default configuration:', error);
            this.config = this._getDefaultConfig();
        }
    }

    /**
     * Default configuration
     */
    _getDefaultConfig() {
        return {
            updateFrequency: 300000,
            maxArticlesPerFeed: 20,
            feeds: [],
            categoryMapping: {
                'football': ['soccer', 'football', 'fifa', 'premier league'],
                'basketball': ['nba', 'basketball', 'ncaa'],
                'tennis': ['tennis', 'atp', 'wta']
            }
        };
    }

    /**
     * Load category mapping
     */
    async _loadCategoryMap() {
        try {
            const response = await fetch('../api-json/category-mapping.json');
            if (response.ok) {
                this.categoryMap = await response.json();
            } else {
                this.categoryMap = this.config.categoryMapping || {};
            }
        } catch (error) {
            this.categoryMap = this.config.categoryMapping || {};
        }
    }

    /**
     * Fetch all RSS feeds
     */
    async fetchAllFeeds() {
        console.log('[RSS] Fetching all feeds...');

        const fetchPromises = this.feeds.map(feed => this.fetchFeed(feed));
        const results = await Promise.allSettled(fetchPromises);

        let successCount = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                console.error(`[RSS] Failed to fetch feed: ${this.feeds[index].url}`, result.reason);
                this.stats.failedFetches++;
            }
        });

        this.stats.lastUpdate = new Date().toISOString();
        this._emitEvent('rss:feeds-updated', {
            total: this.feeds.length,
            successful: successCount
        });

        // Save aggregated content
        this._saveAggregatedContent();

        return successCount;
    }

    /**
     * Fetch single RSS feed
     */
    async fetchFeed(feed) {
        try {
            // Use RSS to JSON proxy service or CORS proxy
            const proxyUrl = this.config.proxyUrl || 'https://api.rss2json.com/v1/api.json';
            const url = `${proxyUrl}?rss_url=${encodeURIComponent(feed.url)}&api_key=${this.config.apiKey || ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'ok' && data.items) {
                const articles = this._processfItems(data.items, feed);
                this._mergeArticles(articles);
                return articles;
            }

            throw new Error('Invalid RSS response');

        } catch (error) {
            console.error(`[RSS] Error fetching feed ${feed.name}:`, error);
            throw error;
        }
    }

    /**
     * Process feed items
     */
    _processFeedItems(items, feed) {
        const maxArticles = this.config.maxArticlesPerFeed || 20;

        return items.slice(0, maxArticles).map(item => ({
            id: this._generateId(item.link),
            title: item.title || 'Untitled',
            content: item.description || item.content || '',
            excerpt: this._generateExcerpt(item.description || item.content || ''),
            link: item.link,
            author: item.author || feed.name,
            category: this._detectCategory(item, feed),
            tags: this._extractTags(item),
            image: item.thumbnail || item.enclosure?.link || null,
            publishedAt: item.pubDate,
            source: feed.name,
            sourceUrl: feed.url,
            aggregatedAt: new Date().toISOString()
        }));
    }

    /**
     * Detect category from content
     */
    _detectCategory(item, feed) {
        // Use feed's default category
        if (feed.category) {
            return feed.category;
        }

        // Auto-detect from title and content
        const text = `${item.title} ${item.description}`.toLowerCase();

        for (const [category, keywords] of Object.entries(this.categoryMap)) {
            if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
                return category;
            }
        }

        return 'news'; // Default category
    }

    /**
     * Extract tags from content
     */
    _extractTags(item) {
        const tags = [];

        if (item.categories) {
            tags.push(...item.categories);
        }

        // Extract from title
        const commonWords = ['the', 'and', 'for', 'with', 'from'];
        const words = item.title.toLowerCase().split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.includes(word));

        tags.push(...words.slice(0, 3));

        return [...new Set(tags)];
    }

    /**
     * Generate excerpt
     */
    _generateExcerpt(content, maxLength = 200) {
        // Strip HTML tags
        const text = content.replace(/<[^>]*>/g, '');

        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Merge articles into aggregated content
     */
    _mergeArticles(newArticles) {
        newArticles.forEach(article => {
            // Check if article already exists
            const existingIndex = this.aggregatedContent.findIndex(a => a.id === article.id);

            if (existingIndex === -1) {
                this.aggregatedContent.unshift(article);
                this.stats.articlesAggregated++;
            }
        });

        // Limit total stored articles
        const maxTotal = this.config.maxTotalArticles || 500;
        if (this.aggregatedContent.length > maxTotal) {
            this.aggregatedContent = this.aggregatedContent.slice(0, maxTotal);
        }
    }

    /**
     * Get aggregated content
     */
    getContent(filters = {}) {
        let results = [...this.aggregatedContent];

        // Filter by category
        if (filters.category) {
            results = results.filter(a => a.category === filters.category);
        }

        // Filter by source
        if (filters.source) {
            results = results.filter(a => a.source === filters.source);
        }

        // Search
        if (filters.search) {
            const query = filters.search.toLowerCase();
            results = results.filter(a =>
                a.title.toLowerCase().includes(query) ||
                a.content.toLowerCase().includes(query)
            );
        }

        // Sort
        if (filters.sortBy) {
            results.sort((a, b) => {
                const aVal = a[filters.sortBy];
                const bVal = b[filters.sortBy];
                return filters.sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
        }

        // Pagination
        if (filters.page && filters.perPage) {
            const start = (filters.page - 1) * filters.perPage;
            const end = start + filters.perPage;
            results = results.slice(start, end);
        }

        return results;
    }

    /**
     * Publish aggregated content to CMS
     */
    async publishToCMS(articleId) {
        const article = this.aggregatedContent.find(a => a.id === articleId);

        if (!article || !window.__ANTIGRAVITY_CMS__) {
            return false;
        }

        try {
            const cmsArticle = window.__ANTIGRAVITY_CMS__.createArticle({
                title: article.title,
                content: article.content,
                excerpt: article.excerpt,
                author: article.author,
                category: article.category,
                tags: article.tags,
                featuredImage: article.image,
                status: 'published'
            });

            this._emitEvent('rss:published-to-cms', { article, cmsArticle });
            return true;

        } catch (error) {
            console.error('[RSS] Error publishing to CMS:', error);
            return false;
        }
    }

    /**
     * Auto-publish articles
     */
    async autoPublish(criteria = {}) {
        const articles = this.getContent(criteria);
        const maxAutoPublish = criteria.limit || 10;

        let published = 0;
        for (const article of articles.slice(0, maxAutoPublish)) {
            if (await this.publishToCMS(article.id)) {
                published++;
            }
        }

        return published;
    }

    /**
     * Setup auto-update
     */
    _setupAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        if (this.config.autoUpdate !== false) {
            this.autoUpdateInterval = setInterval(() => {
                this.fetchAllFeeds();
            }, this.updateFrequency);

            console.log(`[RSS] Auto-update enabled (${this.updateFrequency}ms)`);
        }
    }

    /**
     * Save aggregated content
     */
    _saveAggregatedContent() {
        try {
            localStorage.setItem('rss_aggregated_content', JSON.stringify(this.aggregatedContent));
            localStorage.setItem('rss_stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('[RSS] Error saving content:', error);
        }
    }

    /**
     * Restore aggregated content
     */
    async _restoreAggregatedContent() {
        try {
            const content = localStorage.getItem('rss_aggregated_content');
            const stats = localStorage.getItem('rss_stats');

            if (content) {
                this.aggregatedContent = JSON.parse(content);
            }

            if (stats) {
                this.stats = { ...this.stats, ...JSON.parse(stats) };
            }
        } catch (error) {
            console.error('[RSS] Error restoring content:', error);
        }
    }

    /**
     * Generate ID from URL
     */
    _generateId(url) {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `rss_${Math.abs(hash)}`;
    }

    /**
     * Event bus integration
     */
    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        eventBus.on('rss:fetch-feeds', () => {
            this.fetchAllFeeds();
        });

        eventBus.on('rss:auto-publish', (data) => {
            this.autoPublish(data.criteria);
        });
    }

    /**
     * Get state
     */
    getState() {
        return {
            totalFeeds: this.feeds.length,
            aggregatedArticles: this.aggregatedContent.length,
            stats: { ...this.stats },
            lastUpdate: this.stats.lastUpdate
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
    }
}

// Initialize and Export
const rssAggregator = new RSSAggregatorRuntime();
window.__ANTIGRAVITY_RSS__ = rssAggregator;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[RSS] Registered with runtime');
    });
}

export default rssAggregator;
