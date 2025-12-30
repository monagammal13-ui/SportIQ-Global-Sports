/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 80: GLOBAL NEWS AGGREGATOR & RSS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: RSS feed aggregation, news parsing, auto-update engine
 * Features: Multi-source aggregation, filtering, caching, real-time updates
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        news: {
            configPath: '../api-json/news-config.json',
            updateInterval: 300000, // 5 minutes
            cacheExpiry: 600000, // 10 minutes
            maxArticles: 50
        },
        events: {
            feedFetched: 'news:feed-fetched',
            articleAdded: 'news:article-added',
            feedUpdated: 'news:feed-updated',
            fetchError: 'news:fetch-error'
        }
    };

    const state = {
        sources: new Map(),
        articles: new Map(),
        categories: new Map(),
        cache: new Map(),
        statistics: {
            totalFeeds: 0,
            totalArticles: 0,
            lastUpdate: null,
            errors: 0
        },
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RSS PARSER
    // ═══════════════════════════════════════════════════════════════════════

    const RSSParser = {
        parse: function (xmlText, sourceId) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xmlText, 'text/xml');

                const items = doc.querySelectorAll('item, entry');
                const articles = [];

                items.forEach((item, index) => {
                    const article = this.parseItem(item, sourceId, index);
                    if (article) articles.push(article);
                });

                return articles;
            } catch (error) {
                console.error('❌ [News] Parse error:', error);
                return [];
            }
        },

        parseItem: function (item, sourceId, index) {
            const getContent = (tag) => {
                const el = item.querySelector(tag);
                return el ? el.textContent.trim() : '';
            };

            const title = getContent('title');
            const link = getContent('link') || getContent('guid');
            const description = getContent('description') || getContent('summary');
            const pubDate = getContent('pubDate') || getContent('published');

            if (!title || !link) return null;

            return {
                id: this.generateId(link),
                sourceId,
                title: this.cleanText(title),
                link,
                description: this.cleanText(description),
                pubDate: new Date(pubDate || Date.now()),
                timestamp: Date.now(),
                image: this.extractImage(item, description),
                category: this.extractCategory(item)
            };
        },

        cleanText: function (text) {
            return text.replace(/<[^>]*>/g, '').substring(0, 500);
        },

        extractImage: function (item, description) {
            // Try media:content
            const media = item.querySelector('thumbnail, content[type*="image"]');
            if (media) {
                return media.getAttribute('url') || media.getAttribute('src');
            }

            // Try enclosure
            const enclosure = item.querySelector('enclosure[type*="image"]');
            if (enclosure) {
                return enclosure.getAttribute('url');
            }

            // Try to extract from description
            const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
            return imgMatch ? imgMatch[1] : null;
        },

        extractCategory: function (item) {
            const category = item.querySelector('category');
            return category ? category.textContent.trim() : 'general';
        },

        generateId: function (link) {
            let hash = 0;
            for (let i = 0; i < link.length; i++) {
                hash = ((hash << 5) - hash) + link.charCodeAt(i);
                hash = hash & hash;
            }
            return 'article_' + Math.abs(hash);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FEED FETCHER
    // ═══════════════════════════════════════════════════════════════════════

    const FeedFetcher = {
        fetch: async function (source) {
            const cacheKey = source.id;
            const cached = state.cache.get(cacheKey);

            // Check cache
            if (cached && (Date.now() - cached.timestamp < CONFIG.news.cacheExpiry)) {
                console.log('📰 [News] Using cached feed:', source.id);
                return cached.articles;
            }

            try {
                console.log('🔄 [News] Fetching feed:', source.url);

                // Use CORS proxy for RSS feeds
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`;

                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const xmlText = await response.text();
                const articles = RSSParser.parse(xmlText, source.id);

                // Update cache
                state.cache.set(cacheKey, {
                    articles,
                    timestamp: Date.now()
                });

                // Fire event
                const event = new CustomEvent(CONFIG.events.feedFetched, {
                    detail: { sourceId: source.id, count: articles.length }
                });
                document.dispatchEvent(event);

                console.log(`✅ [News] Fetched ${articles.length} articles from ${source.name}`);

                return articles;

            } catch (error) {
                console.error('❌ [News] Fetch error:', source.name, error.message);
                state.statistics.errors++;

                const event = new CustomEvent(CONFIG.events.fetchError, {
                    detail: { sourceId: source.id, error: error.message }
                });
                document.dispatchEvent(event);

                return [];
            }
        },

        fetchAll: async function () {
            const promises = Array.from(state.sources.values()).map(source => {
                if (source.enabled) {
                    return this.fetch(source);
                }
                return Promise.resolve([]);
            });

            const results = await Promise.all(promises);
            const articles = results.flat();

            // Add to state
            articles.forEach(article => {
                state.articles.set(article.id, article);
            });

            // Keep only latest articles
            this.pruneArticles();

            state.statistics.totalArticles = state.articles.size;
            state.statistics.lastUpdate = Date.now();

            return articles;
        },

        pruneArticles: function () {
            if (state.articles.size <= CONFIG.news.maxArticles) return;

            const sorted = Array.from(state.articles.values())
                .sort((a, b) => b.pubDate - a.pubDate);

            state.articles.clear();
            sorted.slice(0, CONFIG.news.maxArticles).forEach(article => {
                state.articles.set(article.id, article);
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SOURCE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const SourceManager = {
        register: function (source) {
            state.sources.set(source.id, {
                id: source.id,
                name: source.name,
                url: source.url,
                category: source.category || 'general',
                sport: source.sport || 'all',
                enabled: source.enabled !== false,
                icon: source.icon || '📰'
            });

            state.statistics.totalFeeds++;
            console.log('✅ [News] Source registered:', source.name);
        },

        get: function (sourceId) {
            return state.sources.get(sourceId);
        },

        getAll: function (filter = {}) {
            let sources = Array.from(state.sources.values());

            if (filter.category) {
                sources = sources.filter(s => s.category === filter.category);
            }

            if (filter.enabled !== undefined) {
                sources = sources.filter(s => s.enabled === filter.enabled);
            }

            return sources;
        },

        enable: function (sourceId) {
            const source = state.sources.get(sourceId);
            if (source) {
                source.enabled = true;
                return true;
            }
            return false;
        },

        disable: function (sourceId) {
            const source = state.sources.get(sourceId);
            if (source) {
                source.enabled = false;
                return true;
            }
            return false;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ARTICLE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const ArticleManager = {
        getAll: function (filter = {}) {
            let articles = Array.from(state.articles.values());

            if (filter.category) {
                articles = articles.filter(a => a.category === filter.category);
            }

            if (filter.sourceId) {
                articles = articles.filter(a => a.sourceId === filter.sourceId);
            }

            if (filter.limit) {
                articles = articles.slice(0, filter.limit);
            }

            return articles.sort((a, b) => b.pubDate - a.pubDate);
        },

        get: function (articleId) {
            return state.articles.get(articleId);
        },

        search: function (query) {
            const q = query.toLowerCase();
            return Array.from(state.articles.values()).filter(article => {
                return article.title.toLowerCase().includes(q) ||
                    article.description.toLowerCase().includes(q);
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-UPDATE ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const AutoUpdate = {
        start: function () {
            console.log(`🔄 [News] Auto-update started (${CONFIG.news.updateInterval / 1000}s interval)`);

            // Initial fetch
            this.update();

            // Set interval
            this.timerId = setInterval(() => {
                this.update();
            }, CONFIG.news.updateInterval);
        },

        update: async function () {
            console.log('🔄 [News] Updating feeds...');
            await FeedFetcher.fetchAll();

            const event = new CustomEvent(CONFIG.events.feedUpdated, {
                detail: {
                    count: state.articles.size,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);
        },

        stop: function () {
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📰 LAYER 80: NEWS AGGREGATOR ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Load configuration
        try {
            const response = await fetch(CONFIG.news.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register sources
                if (state.config.sources) {
                    state.config.sources.forEach(source => {
                        SourceManager.register(source);
                    });
                    console.log(`✅ [News] Registered ${state.config.sources.length} sources`);
                }

                // Register categories
                if (state.config.categories) {
                    state.config.categories.forEach(cat => {
                        state.categories.set(cat.id, cat);
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ [News] Failed to load config');
        }

        // Start auto-update
        AutoUpdate.start();

        console.log('✅ [News] Aggregator initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.NewsAggregator = {
        // Sources
        registerSource: SourceManager.register.bind(SourceManager),
        getSources: SourceManager.getAll.bind(SourceManager),
        enableSource: SourceManager.enable.bind(SourceManager),
        disableSource: SourceManager.disable.bind(SourceManager),

        // Articles
        getArticles: ArticleManager.getAll.bind(ArticleManager),
        getArticle: ArticleManager.get.bind(ArticleManager),
        searchArticles: ArticleManager.search.bind(ArticleManager),

        // Fetching
        fetchFeed: FeedFetcher.fetch.bind(FeedFetcher),
        fetchAll: FeedFetcher.fetchAll.bind(FeedFetcher),

        // Auto-update
        startAutoUpdate: AutoUpdate.start.bind(AutoUpdate),
        stopAutoUpdate: AutoUpdate.stop.bind(AutoUpdate),
        updateNow: AutoUpdate.update.bind(AutoUpdate),

        // Statistics
        getStats: () => ({ ...state.statistics }),

        CONFIG
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
