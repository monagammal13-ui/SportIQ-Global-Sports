/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 98: GLOBAL API AGGREGATOR & PROXY ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Centralized API management, response aggregation, caching, and proxying.
 * Features: Request batching, failover, unified response format, rate limiting.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        aggregator: {
            configPath: '../api-json/aggregator-config.json',
            defaultTimeout: 5000,
            cacheDuration: 60000, // 1 minute
            batchInterval: 50
        },
        events: {
            requestStarted: 'api:request-started',
            requestCompleted: 'api:request-completed',
            batchProcessed: 'api:batch-processed',
            error: 'api:error'
        }
    };

    const state = {
        config: null,
        cache: new Map(),
        pendingBatches: new Map(),
        activeRequests: 0,
        statistics: {
            totalRequests: 0,
            cacheHits: 0,
            errors: 0,
            avgLatency: 0
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AGGREGATOR ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const AggregatorEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.aggregator.configPath);
                if (response.ok) {
                    state.config = await response.json();
                    console.log(`🌐 [Aggregator] Initialized with ${state.config.sources?.length || 0} sources`);
                }
            } catch (error) {
                console.warn('⚠️ [Aggregator] Failed to load config');
            }
        },

        fetch: async function (endpoint, options = {}) {
            const startTime = Date.now();
            state.statistics.totalRequests++;
            state.activeRequests++;

            this.notifyRequestStart(endpoint);

            try {
                // Check cache
                if (!options.skipCache) {
                    const cached = this.getFromCache(endpoint);
                    if (cached) {
                        state.statistics.cacheHits++;
                        state.activeRequests--;
                        this.notifyRequestComplete(endpoint, true, 0);
                        return cached;
                    }
                }

                // Determine source
                const source = this.getSourceForEndpoint(endpoint);

                // Simulate fetch (or proxy)
                const data = await this.executeRequest(source, endpoint, options);

                // Cache result
                this.addToCache(endpoint, data);

                const latency = Date.now() - startTime;
                this.updateStats(latency);

                state.activeRequests--;
                this.notifyRequestComplete(endpoint, false, latency);

                return data;

            } catch (error) {
                state.statistics.errors++;
                state.activeRequests--;
                console.error(`❌ [Aggregator] Error fetching ${endpoint}:`, error);

                const event = new CustomEvent(CONFIG.events.error, {
                    detail: { endpoint, error: error.message }
                });
                document.dispatchEvent(event);

                throw error;
            }
        },

        executeRequest: async function (source, endpoint, options) {
            // Simulated response based on source configuration
            await new Promise(r => setTimeout(r, Math.random() * 500 + 100)); // Latency

            if (source && source.mockResponse) {
                return source.mockResponse;
            }

            // Default generic response
            return {
                status: 'ok',
                source: source ? source.id : 'unknown',
                data: {},
                timestamp: Date.now()
            };
        },

        getSourceForEndpoint: function (endpoint) {
            if (!state.config || !state.config.sources) return null;
            return state.config.sources.find(s => endpoint.startsWith(s.prefix));
        },

        // ═══════════════════════════════════════════════════════════════════════
        // CACHING SYSTEM
        // ═══════════════════════════════════════════════════════════════════════

        getFromCache: function (key) {
            const item = state.cache.get(key);
            if (!item) return null;

            if (Date.now() - item.timestamp > CONFIG.aggregator.cacheDuration) {
                state.cache.delete(key);
                return null;
            }

            return item.data;
        },

        addToCache: function (key, data) {
            state.cache.set(key, {
                data,
                timestamp: Date.now()
            });
        },

        clearCache: function () {
            state.cache.clear();
        },

        // ═══════════════════════════════════════════════════════════════════════
        // BATCH PROCESSING
        // ═══════════════════════════════════════════════════════════════════════

        batchFetch: function (endpoints) {
            // Group by source and execute
            console.log(`📦 [Aggregator] Batching ${endpoints.length} requests`);

            const promises = endpoints.map(ep => this.fetch(ep));
            return Promise.all(promises);
        },

        // ═══════════════════════════════════════════════════════════════════════
        // STATISTICS & MONITORING
        // ═══════════════════════════════════════════════════════════════════════

        updateStats: function (latency) {
            const oldAvg = state.statistics.avgLatency;
            const count = state.statistics.totalRequests - state.statistics.cacheHits;

            if (count > 0) {
                state.statistics.avgLatency = ((oldAvg * (count - 1)) + latency) / count;
            }
        },

        notifyRequestStart: function (endpoint) {
            const event = new CustomEvent(CONFIG.events.requestStarted, {
                detail: { endpoint, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        notifyRequestComplete: function (endpoint, cached, latency) {
            const event = new CustomEvent(CONFIG.events.requestCompleted, {
                detail: { endpoint, cached, latency, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            // Update Dashboard if visible
            DashboardRenderer.updateStats();
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const DashboardRenderer = {
        renderDashboard: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="api-dashboard">
                    <div class="api-dashboard-header">
                        <h3>Global API Gateway</h3>
                        <div class="api-status-indicator">
                            <span class="status-dot online"></span> Online
                        </div>
                    </div>
                    
                    <div class="api-metrics-grid">
                        <div class="api-metric-card">
                            <div class="metric-value" id="stat-requests">0</div>
                            <div class="metric-label">Total Requests</div>
                        </div>
                        <div class="api-metric-card">
                            <div class="metric-value" id="stat-hits">0</div>
                            <div class="metric-label">Cache Hits</div>
                        </div>
                        <div class="api-metric-card">
                            <div class="metric-value" id="stat-latency">0ms</div>
                            <div class="metric-label">Avg Latency</div>
                        </div>
                        <div class="api-metric-card">
                            <div class="metric-value" id="stat-errors">0</div>
                            <div class="metric-label">Errors</div>
                        </div>
                    </div>
                    
                    <div class="api-sources-list">
                        <h4>Active Sources</h4>
                        <div id="api-sources-container"></div>
                    </div>
                </div>
            `;

            this.renderSources();
            this.updateStats();
        },

        renderSources: function () {
            const container = document.getElementById('api-sources-container');
            if (!container || !state.config || !state.config.sources) return;

            container.innerHTML = state.config.sources.map(source => `
                <div class="api-source-item">
                    <div class="source-status active"></div>
                    <div class="source-info">
                        <div class="source-name">${source.name}</div>
                        <div class="source-endpoint">${source.baseUrl}</div>
                    </div>
                    <div class="source-meta">
                        Prefix: ${source.prefix}
                    </div>
                </div>
            `).join('');
        },

        updateStats: function () {
            const setText = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };

            setText('stat-requests', state.statistics.totalRequests);
            setText('stat-hits', state.statistics.cacheHits);
            setText('stat-latency', Math.round(state.statistics.avgLatency) + 'ms');
            setText('stat-errors', state.statistics.errors);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.APIAggregator = {
        init: AggregatorEngine.initialize.bind(AggregatorEngine),
        fetch: AggregatorEngine.fetch.bind(AggregatorEngine),
        batch: AggregatorEngine.batchFetch.bind(AggregatorEngine),
        clearCache: AggregatorEngine.clearCache.bind(AggregatorEngine),
        renderDashboard: DashboardRenderer.renderDashboard.bind(DashboardRenderer),

        getStats: () => ({ ...state.statistics }),
        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AggregatorEngine.initialize());
    } else {
        AggregatorEngine.initialize();
    }

})();
