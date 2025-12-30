/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 72: API INTEGRATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Complete API integration, data fetching, aggregation, and auto-sync
 * Features: Multi-source API fetching, real-time updates, caching, error handling
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION & CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        api: {
            configPath: '../api-json/api-endpoints.json',
            timeout: 10000, // 10 seconds
            retryAttempts: 3,
            retryDelay: 1000, // 1 second
            cacheDuration: 5 * 60 * 1000 // 5 minutes
        },
        sync: {
            enabled: true,
            defaultInterval: 60000, // 1 minute
            maxConcurrent: 5
        },
        cache: {
            enabled: true,
            maxSize: 100, // Max cached items
            prefix: 'sportiq_api_cache_'
        },
        events: {
            dataFetched: 'api:data-fetched',
            dataError: 'api:data-error',
            syncStarted: 'api:sync-started',
            syncCompleted: 'api:sync-completed',
            cacheUpdated: 'api:cache-updated'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        endpoints: new Map(),
        cache: new Map(),
        syncTimers: new Map(),
        requestQueue: [],
        activeRequests: 0,
        statistics: {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cacheHits: 0,
            cacheMisses: 0
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CACHE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const CacheManager = {
        /**
         * Get cached data
         */
        get: function (key) {
            if (!CONFIG.cache.enabled) return null;

            const cached = state.cache.get(key);
            if (!cached) {
                state.statistics.cacheMisses++;
                return null;
            }

            // Check expiration
            if (Date.now() > cached.expiresAt) {
                state.cache.delete(key);
                state.statistics.cacheMisses++;
                return null;
            }

            state.statistics.cacheHits++;
            return cached.data;
        },

        /**
         * Set cached data
         */
        set: function (key, data, duration = CONFIG.api.cacheDuration) {
            if (!CONFIG.cache.enabled) return;

            // Check cache size limit
            if (state.cache.size >= CONFIG.cache.maxSize) {
                // Remove oldest entry
                const firstKey = state.cache.keys().next().value;
                state.cache.delete(firstKey);
            }

            state.cache.set(key, {
                data: data,
                cachedAt: Date.now(),
                expiresAt: Date.now() + duration
            });

            // Fire cache updated event
            const event = new CustomEvent(CONFIG.events.cacheUpdated, {
                detail: { key, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        /**
         * Clear cache
         */
        clear: function (pattern = null) {
            if (pattern) {
                // Clear matching pattern
                for (const [key] of state.cache) {
                    if (key.includes(pattern)) {
                        state.cache.delete(key);
                    }
                }
            } else {
                // Clear all
                state.cache.clear();
            }

            console.log('✅ [API] Cache cleared', pattern || 'all');
        },

        /**
         * Get cache statistics
         */
        getStats: function () {
            return {
                size: state.cache.size,
                maxSize: CONFIG.cache.maxSize,
                hitRate: state.statistics.totalRequests > 0
                    ? (state.statistics.cacheHits / state.statistics.totalRequests * 100).toFixed(2) + '%'
                    : '0%'
            };
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HTTP CLIENT
    // ═══════════════════════════════════════════════════════════════════════

    const HttpClient = {
        /**
         * Fetch data with timeout and retry
         */
        fetch: async function (url, options = {}, attempt = 1) {
            state.statistics.totalRequests++;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeout);

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const contentType = response.headers.get('content-type');
                let data;

                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else if (contentType && contentType.includes('text')) {
                    data = await response.text();
                } else {
                    data = await response.blob();
                }

                state.statistics.successfulRequests++;
                return { success: true, data };

            } catch (error) {
                console.warn(`⚠️ [API] Fetch attempt ${attempt} failed:`, error.message);

                if (attempt < CONFIG.api.retryAttempts) {
                    await this.delay(CONFIG.api.retryDelay * attempt);
                    return this.fetch(url, options, attempt + 1);
                }

                state.statistics.failedRequests++;
                return {
                    success: false,
                    error: error.message,
                    url
                };
            }
        },

        /**
         * Delay helper
         */
        delay: function (ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // API MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const APIManager = {
        /**
         * Register API endpoint
         */
        register: function (endpoint) {
            const id = endpoint.id || endpoint.name;

            if (!endpoint.url) {
                console.error('❌ [API] Endpoint missing URL:', endpoint);
                return false;
            }

            state.endpoints.set(id, {
                id,
                name: endpoint.name || id,
                url: endpoint.url,
                method: endpoint.method || 'GET',
                headers: endpoint.headers || {},
                params: endpoint.params || {},
                updateInterval: endpoint.updateInterval || null,
                transform: endpoint.transform || null,
                enabled: endpoint.enabled !== false,
                category: endpoint.category || 'general'
            });

            console.log('✅ [API] Endpoint registered:', id);
            return true;
        },

        /**
         * Fetch from endpoint
         */
        fetch: async function (endpointId, params = {}, useCache = true) {
            const endpoint = state.endpoints.get(endpointId);

            if (!endpoint) {
                console.error('❌ [API] Endpoint not found:', endpointId);
                return { success: false, error: 'Endpoint not found' };
            }

            if (!endpoint.enabled) {
                console.warn('⚠️ [API] Endpoint disabled:', endpointId);
                return { success: false, error: 'Endpoint disabled' };
            }

            // Check cache
            const cacheKey = this.getCacheKey(endpointId, params);
            if (useCache) {
                const cached = CacheManager.get(cacheKey);
                if (cached) {
                    console.log('📦 [API] Cache hit:', endpointId);
                    return { success: true, data: cached, fromCache: true };
                }
            }

            // Build URL with params
            const url = this.buildUrl(endpoint.url, { ...endpoint.params, ...params });

            // Fetch data
            const result = await HttpClient.fetch(url, {
                method: endpoint.method,
                headers: endpoint.headers
            });

            if (result.success) {
                // Transform data if needed
                let data = result.data;
                if (endpoint.transform && typeof endpoint.transform === 'function') {
                    try {
                        data = endpoint.transform(data);
                    } catch (error) {
                        console.error('❌ [API] Transform error:', error);
                    }
                }

                // Cache result
                CacheManager.set(cacheKey, data);

                // Fire data fetched event
                const event = new CustomEvent(CONFIG.events.dataFetched, {
                    detail: { endpointId, data, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                return { success: true, data, fromCache: false };
            } else {
                // Fire error event
                const event = new CustomEvent(CONFIG.events.dataError, {
                    detail: { endpointId, error: result.error, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                return result;
            }
        },

        /**
         * Fetch multiple endpoints
         */
        fetchMultiple: async function (endpointIds, useCache = true) {
            const promises = endpointIds.map(id => this.fetch(id, {}, useCache));
            const results = await Promise.allSettled(promises);

            return results.map((result, index) => ({
                endpointId: endpointIds[index],
                success: result.status === 'fulfilled' && result.value.success,
                data: result.status === 'fulfilled' ? result.value.data : null,
                error: result.status === 'rejected' ? result.reason : (result.value?.error || null)
            }));
        },

        /**
         * Build URL with params
         */
        buildUrl: function (baseUrl, params) {
            if (!params || Object.keys(params).length === 0) {
                return baseUrl;
            }

            const url = new URL(baseUrl, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            return url.toString();
        },

        /**
         * Get cache key
         */
        getCacheKey: function (endpointId, params) {
            const paramStr = JSON.stringify(params);
            return `${CONFIG.cache.prefix}${endpointId}_${paramStr}`;
        },

        /**
         * Get all endpoints
         */
        getAll: function (category = null) {
            if (category) {
                return Array.from(state.endpoints.values()).filter(e => e.category === category);
            }
            return Array.from(state.endpoints.values());
        },

        /**
         * Enable/disable endpoint
         */
        setEnabled: function (endpointId, enabled) {
            const endpoint = state.endpoints.get(endpointId);
            if (endpoint) {
                endpoint.enabled = enabled;
                console.log(`✅ [API] Endpoint ${enabled ? 'enabled' : 'disabled'}:`, endpointId);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-SYNC ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const SyncEngine = {
        /**
         * Start auto-sync for endpoint
         */
        start: function (endpointId, interval = null) {
            if (!CONFIG.sync.enabled) {
                console.warn('⚠️ [API] Sync disabled in config');
                return false;
            }

            const endpoint = state.endpoints.get(endpointId);
            if (!endpoint) {
                console.error('❌ [API] Endpoint not found:', endpointId);
                return false;
            }

            // Stop existing sync
            this.stop(endpointId);

            // Use provided interval or endpoint's or default
            const syncInterval = interval || endpoint.updateInterval || CONFIG.sync.defaultInterval;

            console.log(`🔄 [API] Starting auto-sync for ${endpointId} (${syncInterval}ms)`);

            // Initial fetch
            this.syncNow(endpointId);

            // Set up interval
            const timerId = setInterval(() => {
                this.syncNow(endpointId);
            }, syncInterval);

            state.syncTimers.set(endpointId, {
                timerId,
                interval: syncInterval,
                startedAt: Date.now()
            });

            return true;
        },

        /**
         * Stop auto-sync
         */
        stop: function (endpointId) {
            const timer = state.syncTimers.get(endpointId);
            if (timer) {
                clearInterval(timer.timerId);
                state.syncTimers.delete(endpointId);
                console.log('⏹️ [API] Auto-sync stopped:', endpointId);
                return true;
            }
            return false;
        },

        /**
         * Sync now (one-time fetch)
         */
        syncNow: async function (endpointId) {
            const event = new CustomEvent(CONFIG.events.syncStarted, {
                detail: { endpointId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            const result = await APIManager.fetch(endpointId, {}, false); // Don't use cache

            const completeEvent = new CustomEvent(CONFIG.events.syncCompleted, {
                detail: {
                    endpointId,
                    success: result.success,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(completeEvent);

            return result;
        },

        /**
         * Start all auto-syncs
         */
        startAll: function () {
            console.log('🔄 [API] Starting all auto-syncs');

            state.endpoints.forEach((endpoint, id) => {
                if (endpoint.updateInterval) {
                    this.start(id);
                }
            });
        },

        /**
         * Stop all auto-syncs
         */
        stopAll: function () {
            console.log('⏹️ [API] Stopping all auto-syncs');

            state.syncTimers.forEach((timer, id) => {
                this.stop(id);
            });
        },

        /**
         * Get active syncs
         */
        getActive: function () {
            return Array.from(state.syncTimers.entries()).map(([id, timer]) => ({
                endpointId: id,
                interval: timer.interval,
                startedAt: timer.startedAt,
                uptime: Date.now() - timer.startedAt
            }));
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DATA AGGREGATOR
    // ═══════════════════════════════════════════════════════════════════════

    const DataAggregator = {
        /**
         * Aggregate data from multiple sources
         */
        aggregate: async function (sources, aggregationFn) {
            const results = await APIManager.fetchMultiple(sources);

            const successfulResults = results.filter(r => r.success);

            if (successfulResults.length === 0) {
                return {
                    success: false,
                    error: 'All sources failed',
                    results
                };
            }

            try {
                const aggregated = aggregationFn
                    ? aggregationFn(successfulResults.map(r => r.data))
                    : this.defaultAggregation(successfulResults.map(r => r.data));

                return {
                    success: true,
                    data: aggregated,
                    sources: successfulResults.length,
                    failed: results.length - successfulResults.length
                };
            } catch (error) {
                console.error('❌ [API] Aggregation error:', error);
                return {
                    success: false,
                    error: error.message,
                    results
                };
            }
        },

        /**
         * Default aggregation (merge arrays or objects)
         */
        defaultAggregation: function (dataArray) {
            if (dataArray.length === 0) return null;

            // If all are arrays, concatenate
            if (dataArray.every(d => Array.isArray(d))) {
                return dataArray.flat();
            }

            // If all are objects, merge
            if (dataArray.every(d => typeof d === 'object' && !Array.isArray(d))) {
                return Object.assign({}, ...dataArray);
            }

            // Otherwise return as is
            return dataArray;
        },

        /**
         * Merge with deduplication
         */
        mergeUnique: function (dataArray, keyFn = (item) => item.id) {
            const seen = new Set();
            const merged = [];

            dataArray.forEach(data => {
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        const key = keyFn(item);
                        if (!seen.has(key)) {
                            seen.add(key);
                            merged.push(item);
                        }
                    });
                }
            });

            return merged;
        },

        /**
         * Sort aggregated data
         */
        sort: function (data, sortFn) {
            if (Array.isArray(data)) {
                return data.sort(sortFn);
            }
            return data;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const UIRenderer = {
        /**
         * Render API data to container
         */
        render: function (containerId, data, template = 'default') {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('❌ [API] Container not found:', containerId);
                return false;
            }

            // Show loading
            container.innerHTML = this.getLoadingTemplate();

            // Render based on template
            setTimeout(() => {
                try {
                    let html;

                    switch (template) {
                        case 'list':
                            html = this.renderList(data);
                            break;
                        case 'grid':
                            html = this.renderGrid(data);
                            break;
                        case 'table':
                            html = this.renderTable(data);
                            break;
                        case 'cards':
                            html = this.renderCards(data);
                            break;
                        default:
                            html = this.renderDefault(data);
                    }

                    container.innerHTML = html;
                    container.classList.add('api-data-loaded');
                } catch (error) {
                    console.error('❌ [API] Render error:', error);
                    container.innerHTML = this.getErrorTemplate(error.message);
                }
            }, 100);

            return true;
        },

        /**
         * Loading template
         */
        getLoadingTemplate: function () {
            return `
                <div class="api-loading">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </div>
            `;
        },

        /**
         * Error template
         */
        getErrorTemplate: function (message) {
            return `
                <div class="api-error">
                    <span class="error-icon">⚠️</span>
                    <p>Failed to load data: ${message}</p>
                </div>
            `;
        },

        /**
         * Render as list
         */
        renderList: function (data) {
            if (!Array.isArray(data)) data = [data];

            return `
                <ul class="api-list">
                    ${data.map(item => `
                        <li class="api-list-item">
                            ${typeof item === 'object' ? JSON.stringify(item) : item}
                        </li>
                    `).join('')}
                </ul>
            `;
        },

        /**
         * Render as grid
         */
        renderGrid: function (data) {
            if (!Array.isArray(data)) data = [data];

            return `
                <div class="api-grid">
                    ${data.map(item => `
                        <div class="api-grid-item">
                            ${this.renderItem(item)}
                        </div>
                    `).join('')}
                </div>
            `;
        },

        /**
         * Render as table
         */
        renderTable: function (data) {
            if (!Array.isArray(data)) data = [data];
            if (data.length === 0) return '<p>No data available</p>';

            const keys = Object.keys(data[0]);

            return `
                <table class="api-table">
                    <thead>
                        <tr>
                            ${keys.map(key => `<th>${key}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                ${keys.map(key => `<td>${item[key] || '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        },

        /**
         * Render as cards
         */
        renderCards: function (data) {
            if (!Array.isArray(data)) data = [data];

            return `
                <div class="api-cards">
                    ${data.map(item => `
                        <div class="api-card">
                            <div class="api-card-body">
                                ${this.renderItem(item)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        /**
         * Render default
         */
        renderDefault: function (data) {
            return `<pre class="api-data">${JSON.stringify(data, null, 2)}</pre>`;
        },

        /**
         * Render single item
         */
        renderItem: function (item) {
            if (typeof item === 'object') {
                return Object.entries(item)
                    .map(([key, value]) => `
                        <div class="api-field">
                            <strong>${key}:</strong> ${value}
                        </div>
                    `).join('');
            }
            return item;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🌐 LAYER 72: API INTEGRATION ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Load API configuration
        try {
            const response = await fetch(CONFIG.api.configPath);
            if (response.ok) {
                const config = await response.json();

                // Register endpoints
                if (config.endpoints && Array.isArray(config.endpoints)) {
                    config.endpoints.forEach(endpoint => {
                        APIManager.register(endpoint);
                    });
                    console.log(`✅ [API] Registered ${config.endpoints.length} endpoints`);
                }

                // Start auto-syncs
                if (CONFIG.sync.enabled) {
                    SyncEngine.startAll();
                    console.log(`✅ [API] Auto-sync started for ${state.syncTimers.size} endpoints`);
                }
            } else {
                console.warn('⚠️ [API] Config file not found, using defaults');
            }
        } catch (error) {
            console.warn('⚠️ [API] Failed to load config:', error.message);
        }

        console.log('✅ [API] Integration engine initialized');
        console.log('📊 [API] Endpoints:', state.endpoints.size);
        console.log('🔄 [API] Active syncs:', state.syncTimers.size);
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.APIIntegration = {
        // API Management
        register: APIManager.register.bind(APIManager),
        fetch: APIManager.fetch.bind(APIManager),
        fetchMultiple: APIManager.fetchMultiple.bind(APIManager),
        getEndpoints: APIManager.getAll.bind(APIManager),
        setEnabled: APIManager.setEnabled.bind(APIManager),

        // Sync Engine
        startSync: SyncEngine.start.bind(SyncEngine),
        stopSync: SyncEngine.stop.bind(SyncEngine),
        syncNow: SyncEngine.syncNow.bind(SyncEngine),
        startAllSyncs: SyncEngine.startAll.bind(SyncEngine),
        stopAllSyncs: SyncEngine.stopAll.bind(SyncEngine),
        getActiveSyncs: SyncEngine.getActive.bind(SyncEngine),

        // Data Aggregation
        aggregate: DataAggregator.aggregate.bind(DataAggregator),
        mergeUnique: DataAggregator.mergeUnique.bind(DataAggregator),

        // UI Rendering
        render: UIRenderer.render.bind(UIRenderer),

        // Cache Management
        clearCache: CacheManager.clear.bind(CacheManager),
        getCacheStats: CacheManager.getStats.bind(CacheManager),

        // Statistics
        getStats: () => ({ ...state.statistics }),

        // State
        state: () => ({
            endpoints: state.endpoints.size,
            cache: state.cache.size,
            activeSyncs: state.syncTimers.size,
            statistics: state.statistics
        }),

        // Config
        CONFIG
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
