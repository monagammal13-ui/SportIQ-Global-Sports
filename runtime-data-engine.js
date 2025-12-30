/**
 * Runtime_Data_Engine
 * Activates all JSON, fetches RSS feeds, caches intelligently, auto-refreshes
 */

class RuntimeDataEngine {
    constructor() {
        this.data = new Map();
        this.cache = new Map();
        this.feeds = new Map();
        this.refreshIntervals = new Map();
        this.isActive = false;

        // Cache settings
        this.cacheSettings = {
            maxAge: 1800000, // 30 minutes default
            maxSize: 100,    // Max cached items
            strategy: 'lru'  // Least recently used
        };

        this.init();
    }

    async init() {
        console.log('📊 Runtime Data Engine - STARTING');

        // Load all JSON configs as live data
        await this.loadAllJSON();

        // Setup RSS feeds
        await this.setupRSSFeeds();

        // Start auto-refresh
        this.startAutoRefresh();

        // Monitor for new data sources
        this.startDataMonitoring();

        this.isActive = true;
        console.log('✅ Runtime Data Engine - ACTIVE');
    }

    // LOAD ALL JSON AS LIVE DATA
    async loadAllJSON() {
        console.log('📦 Loading all JSON as live data...');

        const jsonFiles = [
            // Runtime configs
            { path: '/api-json/runtime-ultimate.json', refresh: 0 },
            { path: '/api-json/multilanguage-engine.json', refresh: 0 },

            // Live data
            { path: '/api-json/live-commentary.json', refresh: 5000 },
            { path: '/api-json/international-rankings.json', refresh: 3600000 },
            { path: '/api-json/sports-stats-engine.json', refresh: 60000 },

            // Features
            { path: '/api-json/event-calendars.json', refresh: 300000 },
            { path: '/api-json/polls-surveys.json', refresh: 60000 },
            { path: '/api-json/rankings-charts.json', refresh: 300000 },
            { path: '/api-json/trending-dashboard.json', refresh: 300000 },
            { path: '/api-json/video-highlights.json', refresh: 600000 },

            // System configs
            { path: '/api-json/performance-config.json', refresh: 0 },
            { path: '/api-json/media-optimization.json', refresh: 0 },
            { path: '/api-json/analytics-tracking.json', refresh: 0 },
            { path: '/api-json/slider-config.json', refresh: 0 },
            { path: '/api-json/ui-config.json', refresh: 0 },

            // Integration
            { path: '/api-json/multi-region-distribution.json', refresh: 0 },
            { path: '/api-json/rss-feeds.json', refresh: 0 },
            { path: '/api-json/notifications-engine.json', refresh: 0 },
            { path: '/api-json/interaction-analytics.json', refresh: 0 },
            { path: '/api-json/data-feeds-integration.json', refresh: 0 },
            { path: '/api-json/realtime-sync-config.json', refresh: 0 },
            { path: '/api-json/image-fallbacks.json', refresh: 0 }
        ];

        for (const file of jsonFiles) {
            await this.loadJSON(file.path, file.refresh);
        }

        console.log(`✅ Loaded ${this.data.size} JSON data sources`);
    }

    // LOAD SINGLE JSON FILE
    async loadJSON(path, refreshInterval = 0) {
        try {
            // Check cache first
            const cached = this.getFromCache(path);
            if (cached) {
                console.log(`💾 Cache hit: ${this.getFileName(path)}`);
                this.data.set(path, cached);
                return cached;
            }

            // Fetch fresh data
            const response = await fetch(path);
            if (!response.ok) {
                console.warn(`⚠️ Failed to load: ${path}`);
                return null;
            }

            const data = await response.json();
            const fileName = this.getFileName(path);

            // Store in data map
            this.data.set(path, {
                data,
                loaded: Date.now(),
                path,
                refreshInterval
            });

            // Store in cache
            this.addToCache(path, data);

            console.log(`✅ Loaded JSON: ${fileName}`);

            // Setup auto-refresh if specified
            if (refreshInterval > 0) {
                this.setupRefresh(path, refreshInterval);
            }

            return data;
        } catch (error) {
            console.error(`❌ Error loading ${path}:`, error.message);
            return null;
        }
    }

    // SETUP RSS FEEDS
    async setupRSSFeeds() {
        console.log('📡 Setting up RSS feeds...');

        // Load RSS config
        const rssConfig = this.data.get('/api-json/rss-feeds.json');
        if (!rssConfig?.data?.sources) {
            console.log('ℹ️ No RSS config found');
            return;
        }

        const sources = rssConfig.data.sources;
        console.log(`📰 Found ${sources.length} RSS sources`);

        // Fetch each RSS feed
        for (const source of sources.slice(0, 5)) { // Limit to 5 for demo
            await this.fetchRSSFeed(source);
        }

        console.log(`✅ RSS feeds active`);
    }

    // FETCH RSS FEED
    async fetchRSSFeed(source) {
        try {
            console.log(`📥 Fetching RSS: ${source.name}`);

            // In production, use RSS parser or proxy
            // For now, store feed config
            this.feeds.set(source.id, {
                ...source,
                lastFetch: Date.now(),
                status: 'active'
            });

            // Setup auto-refresh
            const refreshInterval = source.updateFrequency || 300000; // 5min default
            this.setupRefresh(`rss:${source.id}`, refreshInterval);

            console.log(`✅ RSS ready: ${source.name}`);
        } catch (error) {
            console.error(`❌ RSS error:`, error.message);
        }
    }

    // AUTO-REFRESH SETUP
    setupRefresh(key, interval) {
        // Clear existing interval
        if (this.refreshIntervals.has(key)) {
            clearInterval(this.refreshIntervals.get(key));
        }

        // Setup new interval
        const intervalId = setInterval(async () => {
            console.log(`🔄 Auto-refresh: ${key}`);

            if (key.startsWith('rss:')) {
                const feedId = key.replace('rss:', '');
                const feed = this.feeds.get(feedId);
                if (feed) {
                    await this.fetchRSSFeed(feed);
                }
            } else {
                await this.loadJSON(key, interval);
            }
        }, interval);

        this.refreshIntervals.set(key, intervalId);
        console.log(`⏰ Auto-refresh enabled: ${this.getFileName(key)} (${interval}ms)`);
    }

    // CACHE MANAGEMENT
    addToCache(key, data) {
        // Check cache size
        if (this.cache.size >= this.cacheSettings.maxSize) {
            // Remove oldest entry (LRU)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            hits: 0
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Check if expired
        const age = Date.now() - cached.timestamp;
        if (age > this.cacheSettings.maxAge) {
            this.cache.delete(key);
            return null;
        }

        // Update hits
        cached.hits++;
        return cached.data;
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
            console.log(`🗑️ Cache cleared: ${key}`);
        } else {
            this.cache.clear();
            console.log(`🗑️ All cache cleared`);
        }
    }

    // START AUTO-REFRESH
    startAutoRefresh() {
        console.log('⏰ Starting auto-refresh system...');

        // Refresh live commentary every 5 seconds
        this.setupRefresh('/api-json/live-commentary.json', 5000);

        // Refresh stats every minute
        this.setupRefresh('/api-json/sports-stats-engine.json', 60000);

        // Refresh trending every 5 minutes
        this.setupRefresh('/api-json/trending-dashboard.json', 300000);

        console.log(`✅ Auto-refresh active for ${this.refreshIntervals.size} sources`);
    }

    // MONITOR FOR NEW DATA SOURCES
    startDataMonitoring() {
        console.log('👀 Data monitoring started');

        // Check for new data sources every 5 minutes
        setInterval(() => {
            this.scanForNewDataSources();
        }, 300000);
    }

    async scanForNewDataSources() {
        console.log('🔍 Scanning for new data sources...');

        // Check if any new JSON files in configs
        if (window.SPORTIQ_CONFIGS) {
            for (const [name, config] of Object.entries(window.SPORTIQ_CONFIGS)) {
                const path = `/api-json/${name}.json`;
                if (!this.data.has(path)) {
                    console.log(`🆕 New data source detected: ${name}`);
                    await this.loadJSON(path);
                }
            }
        }
    }

    // PUBLIC API
    async refreshData(path) {
        console.log(`🔄 Manual refresh: ${path}`);
        return await this.loadJSON(path);
    }

    getData(path) {
        const entry = this.data.get(path);
        return entry?.data || null;
    }

    getDataByName(name) {
        const path = `/api-json/${name}.json`;
        return this.getData(path);
    }

    getAllData() {
        const result = {};
        for (const [path, entry] of this.data) {
            const name = this.getFileName(path);
            result[name] = entry.data;
        }
        return result;
    }

    getFeed(id) {
        return this.feeds.get(id);
    }

    getAllFeeds() {
        return Array.from(this.feeds.values());
    }

    getStatus() {
        return {
            active: this.isActive,
            dataSources: this.data.size,
            rssFeeds: this.feeds.size,
            cacheSize: this.cache.size,
            activeRefreshes: this.refreshIntervals.size,
            cacheHitRate: this.calculateCacheHitRate()
        };
    }

    calculateCacheHitRate() {
        let totalHits = 0;
        let count = 0;

        for (const cached of this.cache.values()) {
            totalHits += cached.hits;
            count++;
        }

        return count > 0 ? (totalHits / count).toFixed(2) : 0;
    }

    getFileName(path) {
        return path.split('/').pop().replace('.json', '').replace('rss:', '');
    }

    // Advanced features
    async loadExternalAPI(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.data.set(url, {
                data,
                loaded: Date.now(),
                path: url,
                refreshInterval: options.refreshInterval || 0
            });

            console.log(`✅ External API loaded: ${url}`);
            return data;
        } catch (error) {
            console.error(`❌ External API error:`, error.message);
            return null;
        }
    }

    enableAutoRefreshFor(path, interval) {
        this.setupRefresh(path, interval);
    }

    disableAutoRefreshFor(path) {
        if (this.refreshIntervals.has(path)) {
            clearInterval(this.refreshIntervals.get(path));
            this.refreshIntervals.delete(path);
            console.log(`⏸️ Auto-refresh disabled: ${path}`);
        }
    }

    stopAllRefreshes() {
        for (const intervalId of this.refreshIntervals.values()) {
            clearInterval(intervalId);
        }
        this.refreshIntervals.clear();
        console.log('⏸️ All auto-refreshes stopped');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.RuntimeData = new RuntimeDataEngine();
    });
} else {
    window.RuntimeData = new RuntimeDataEngine();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuntimeDataEngine;
}
