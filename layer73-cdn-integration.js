/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 73: CDN INTEGRATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Complete CDN integration, cache management, and content delivery
 * Features: Cache purge, replication, monitoring, health checks, load balancing
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
        cdn: {
            configPath: '../api-json/cdn-config.json',
            healthCheckInterval: 30000, // 30 seconds
            purgeTimeout: 5000,
            replicationTimeout: 10000
        },
        cache: {
            defaultTTL: 3600, // 1 hour
            maxAge: 86400, // 24 hours
            staleWhileRevalidate: true
        },
        monitoring: {
            enabled: true,
            metricsInterval: 10000, // 10 seconds
            historySize: 100
        },
        events: {
            nodeHealthChange: 'cdn:node-health-change',
            cachePurged: 'cdn:cache-purged',
            contentReplicated: 'cdn:content-replicated',
            metricsUpdated: 'cdn:metrics-updated',
            failoverTriggered: 'cdn:failover-triggered'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        nodes: new Map(),
        regions: new Map(),
        rules: [],
        healthChecks: new Map(),
        metrics: {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            bytesTransferred: 0,
            purgeOperations: 0,
            replicationOperations: 0
        },
        metricsHistory: [],
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CDN NODE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const NodeManager = {
        /**
         * Register CDN node
         */
        register: function (node) {
            const id = node.id || node.name;

            state.nodes.set(id, {
                id,
                name: node.name || id,
                url: node.url,
                region: node.region || 'global',
                type: node.type || 'edge', // edge, origin, shield
                priority: node.priority || 100,
                enabled: node.enabled !== false,
                status: 'unknown',
                health: {
                    isHealthy: true,
                    lastCheck: null,
                    responseTime: null,
                    uptime: 100,
                    errors: 0
                },
                metrics: {
                    requests: 0,
                    hits: 0,
                    misses: 0,
                    bytes: 0
                },
                capabilities: node.capabilities || []
            });

            console.log('✅ [CDN] Node registered:', id);
            return true;
        },

        /**
         * Get node by ID
         */
        get: function (nodeId) {
            return state.nodes.get(nodeId);
        },

        /**
         * Get all nodes
         */
        getAll: function (filter = {}) {
            let nodes = Array.from(state.nodes.values());

            if (filter.region) {
                nodes = nodes.filter(n => n.region === filter.region);
            }

            if (filter.type) {
                nodes = nodes.filter(n => n.type === filter.type);
            }

            if (filter.enabled !== undefined) {
                nodes = nodes.filter(n => n.enabled === filter.enabled);
            }

            if (filter.healthy !== undefined) {
                nodes = nodes.filter(n => n.health.isHealthy === filter.healthy);
            }

            return nodes;
        },

        /**
         * Update node status
         */
        updateStatus: function (nodeId, status, health = {}) {
            const node = state.nodes.get(nodeId);
            if (!node) return false;

            const oldHealth = node.health.isHealthy;

            node.status = status;
            Object.assign(node.health, health);

            // Fire event if health changed
            if (oldHealth !== node.health.isHealthy) {
                const event = new CustomEvent(CONFIG.events.nodeHealthChange, {
                    detail: {
                        nodeId,
                        healthy: node.health.isHealthy,
                        timestamp: Date.now()
                    }
                });
                document.dispatchEvent(event);

                console.log(`${node.health.isHealthy ? '✅' : '❌'} [CDN] Node ${nodeId} health changed:`, node.health.isHealthy);
            }

            return true;
        },

        /**
         * Get optimal node for request
         */
        getOptimalNode: function (criteria = {}) {
            const nodes = this.getAll({
                enabled: true,
                healthy: true,
                ...criteria
            });

            if (nodes.length === 0) return null;

            // Sort by priority and response time
            nodes.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority; // Higher priority first
                }
                return (a.health.responseTime || 1000) - (b.health.responseTime || 1000);
            });

            return nodes[0];
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HEALTH CHECK ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const HealthCheck = {
        /**
         * Start health checks for all nodes
         */
        startAll: function () {
            console.log('🏥 [CDN] Starting health checks for all nodes');

            state.nodes.forEach((node, id) => {
                if (node.enabled) {
                    this.start(id);
                }
            });
        },

        /**
         * Start health check for specific node
         */
        start: function (nodeId) {
            // Stop existing check
            this.stop(nodeId);

            // Immediate check
            this.check(nodeId);

            // Set up interval
            const timerId = setInterval(() => {
                this.check(nodeId);
            }, CONFIG.cdn.healthCheckInterval);

            state.healthChecks.set(nodeId, timerId);
        },

        /**
         * Stop health check
         */
        stop: function (nodeId) {
            const timerId = state.healthChecks.get(nodeId);
            if (timerId) {
                clearInterval(timerId);
                state.healthChecks.delete(nodeId);
            }
        },

        /**
         * Perform health check
         */
        check: async function (nodeId) {
            const node = state.nodes.get(nodeId);
            if (!node) return;

            const startTime = Date.now();

            try {
                // Try to fetch a health check endpoint
                const healthUrl = node.url + '/health';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(healthUrl, {
                    method: 'HEAD',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const responseTime = Date.now() - startTime;
                const isHealthy = response.ok;

                NodeManager.updateStatus(nodeId, isHealthy ? 'online' : 'degraded', {
                    isHealthy,
                    lastCheck: Date.now(),
                    responseTime,
                    uptime: isHealthy ? Math.min(node.health.uptime + 1, 100) : Math.max(node.health.uptime - 5, 0),
                    errors: isHealthy ? 0 : node.health.errors + 1
                });

            } catch (error) {
                const responseTime = Date.now() - startTime;

                NodeManager.updateStatus(nodeId, 'offline', {
                    isHealthy: false,
                    lastCheck: Date.now(),
                    responseTime,
                    uptime: Math.max(node.health.uptime - 10, 0),
                    errors: node.health.errors + 1
                });
            }
        },

        /**
         * Stop all health checks
         */
        stopAll: function () {
            state.healthChecks.forEach((timerId, nodeId) => {
                this.stop(nodeId);
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CACHE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const CacheManager = {
        /**
         * Purge cache for specific path/pattern
         */
        purge: async function (path, options = {}) {
            const {
                nodes = 'all',
                pattern = false,
                recursive = false
            } = options;

            console.log('🗑️ [CDN] Purging cache:', path);

            const targetNodes = nodes === 'all'
                ? NodeManager.getAll({ enabled: true })
                : [NodeManager.get(nodes)].filter(Boolean);

            const results = await Promise.allSettled(
                targetNodes.map(node => this.purgeNode(node.id, path, { pattern, recursive }))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

            state.metrics.purgeOperations++;

            // Fire event
            const event = new CustomEvent(CONFIG.events.cachePurged, {
                detail: {
                    path,
                    nodes: successful,
                    total: targetNodes.length,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);

            console.log(`✅ [CDN] Cache purged on ${successful}/${targetNodes.length} nodes`);

            return {
                success: successful > 0,
                purged: successful,
                total: targetNodes.length
            };
        },

        /**
         * Purge cache on specific node
         */
        purgeNode: async function (nodeId, path, options = {}) {
            const node = NodeManager.get(nodeId);
            if (!node || !node.enabled) return false;

            try {
                const purgeUrl = `${node.url}/purge`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.cdn.purgeTimeout);

                const response = await fetch(purgeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path, ...options }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                return response.ok;
            } catch (error) {
                console.warn(`⚠️ [CDN] Purge failed on ${nodeId}:`, error.message);
                return false;
            }
        },

        /**
         * Set cache headers for content
         */
        setCacheHeaders: function (url, ttl = CONFIG.cache.defaultTTL) {
            return {
                'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
                'CDN-Cache-Control': `max-age=${ttl}`,
                'Expires': new Date(Date.now() + (ttl * 1000)).toUTCString()
            };
        },

        /**
         * Get cache statistics
         */
        getStats: function (nodeId = null) {
            if (nodeId) {
                const node = NodeManager.get(nodeId);
                return node ? node.metrics : null;
            }

            return {
                total: state.metrics.totalRequests,
                hits: state.metrics.cacheHits,
                misses: state.metrics.cacheMisses,
                hitRate: state.metrics.totalRequests > 0
                    ? ((state.metrics.cacheHits / state.metrics.totalRequests) * 100).toFixed(2) + '%'
                    : '0%'
            };
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT REPLICATION
    // ═══════════════════════════════════════════════════════════════════════

    const Replication = {
        /**
         * Replicate content to CDN nodes
         */
        replicate: async function (content, options = {}) {
            const {
                path = '/',
                regions = 'all',
                priority = 'normal'
            } = options;

            console.log('🔄 [CDN] Replicating content:', path);

            const targetNodes = regions === 'all'
                ? NodeManager.getAll({ enabled: true, type: 'edge' })
                : NodeManager.getAll({ enabled: true, region: regions });

            const results = await Promise.allSettled(
                targetNodes.map(node => this.replicateToNode(node.id, content, path))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

            state.metrics.replicationOperations++;

            // Fire event
            const event = new CustomEvent(CONFIG.events.contentReplicated, {
                detail: {
                    path,
                    nodes: successful,
                    total: targetNodes.length,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);

            console.log(`✅ [CDN] Content replicated to ${successful}/${targetNodes.length} nodes`);

            return {
                success: successful > 0,
                replicated: successful,
                total: targetNodes.length
            };
        },

        /**
         * Replicate to specific node
         */
        replicateToNode: async function (nodeId, content, path) {
            const node = NodeManager.get(nodeId);
            if (!node || !node.enabled) return false;

            try {
                const replicateUrl = `${node.url}/replicate`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.cdn.replicationTimeout);

                const response = await fetch(replicateUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path, content }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                return response.ok;
            } catch (error) {
                console.warn(`⚠️ [CDN] Replication failed on ${nodeId}:`, error.message);
                return false;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LOAD BALANCER
    // ═══════════════════════════════════════════════════════════════════════

    const LoadBalancer = {
        /**
         * Get URL for resource using load balancing
         */
        getUrl: function (path, options = {}) {
            const {
                region = null,
                type = 'edge',
                fallback = true
            } = options;

            // Try to get optimal node
            let node = NodeManager.getOptimalNode({ region, type });

            // Fallback to any healthy node
            if (!node && fallback) {
                node = NodeManager.getOptimalNode();
            }

            if (!node) {
                console.warn('⚠️ [CDN] No healthy nodes available');
                return null;
            }

            // Update metrics
            node.metrics.requests++;
            state.metrics.totalRequests++;

            return node.url + path;
        },

        /**
         * Round-robin load balancing
         */
        roundRobin: (function () {
            let currentIndex = 0;

            return function (nodes) {
                if (nodes.length === 0) return null;

                const node = nodes[currentIndex % nodes.length];
                currentIndex++;

                return node;
            };
        })(),

        /**
         * Least connections load balancing
         */
        leastConnections: function (nodes) {
            if (nodes.length === 0) return null;

            return nodes.reduce((min, node) =>
                node.metrics.requests < min.metrics.requests ? node : min
            );
        },

        /**
         * Geographic load balancing
         */
        geographic: function (userRegion, nodes) {
            // Prefer nodes in same region
            const regionalNodes = nodes.filter(n => n.region === userRegion);

            if (regionalNodes.length > 0) {
                return this.leastConnections(regionalNodes);
            }

            return this.leastConnections(nodes);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // METRICS COLLECTOR
    // ═══════════════════════════════════════════════════════════════════════

    const MetricsCollector = {
        /**
         * Start metrics collection
         */
        start: function () {
            if (!CONFIG.monitoring.enabled) return;

            console.log('📊 [CDN] Starting metrics collection');

            this.collect();

            this.timerId = setInterval(() => {
                this.collect();
            }, CONFIG.monitoring.metricsInterval);
        },

        /**
         * Stop metrics collection
         */
        stop: function () {
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        },

        /**
         * Collect current metrics
         */
        collect: function () {
            const snapshot = {
                timestamp: Date.now(),
                global: { ...state.metrics },
                nodes: Array.from(state.nodes.values()).map(node => ({
                    id: node.id,
                    status: node.status,
                    healthy: node.health.isHealthy,
                    responseTime: node.health.responseTime,
                    requests: node.metrics.requests,
                    hits: node.metrics.hits,
                    misses: node.metrics.misses
                }))
            };

            state.metricsHistory.push(snapshot);

            // Keep only last N snapshots
            if (state.metricsHistory.length > CONFIG.monitoring.historySize) {
                state.metricsHistory.shift();
            }

            // Fire event
            const event = new CustomEvent(CONFIG.events.metricsUpdated, {
                detail: snapshot
            });
            document.dispatchEvent(event);
        },

        /**
         * Get metrics history
         */
        getHistory: function (duration = 60000) {
            const cutoff = Date.now() - duration;
            return state.metricsHistory.filter(m => m.timestamp >= cutoff);
        },

        /**
         * Get current snapshot
         */
        getSnapshot: function () {
            return state.metricsHistory[state.metricsHistory.length - 1] || null;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // REGION MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const RegionManager = {
        /**
         * Register region
         */
        register: function (region) {
            state.regions.set(region.id, {
                id: region.id,
                name: region.name,
                code: region.code,
                continent: region.continent,
                coordinates: region.coordinates,
                nodes: []
            });

            console.log('✅ [CDN] Region registered:', region.id);
        },

        /**
         * Get region
         */
        get: function (regionId) {
            return state.regions.get(regionId);
        },

        /**
         * Get all regions
         */
        getAll: function () {
            return Array.from(state.regions.values());
        },

        /**
         * Get nodes in region
         */
        getNodes: function (regionId) {
            return NodeManager.getAll({ region: regionId });
        },

        /**
         * Detect user region (simplified)
         */
        detectUserRegion: function () {
            // In production, use GeoIP service
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Map timezone to region
            if (timezone.includes('America')) return 'us-east';
            if (timezone.includes('Europe')) return 'eu-west';
            if (timezone.includes('Asia')) return 'asia-east';
            if (timezone.includes('Pacific')) return 'asia-pacific';

            return 'global';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🌍 LAYER 73: CDN INTEGRATION ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Load CDN configuration
        try {
            const response = await fetch(CONFIG.cdn.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register regions
                if (state.config.regions) {
                    state.config.regions.forEach(region => {
                        RegionManager.register(region);
                    });
                    console.log(`✅ [CDN] Registered ${state.config.regions.length} regions`);
                }

                // Register nodes
                if (state.config.nodes) {
                    state.config.nodes.forEach(node => {
                        NodeManager.register(node);
                    });
                    console.log(`✅ [CDN] Registered ${state.config.nodes.length} nodes`);
                }

                // Store cache rules
                if (state.config.cacheRules) {
                    state.rules = state.config.cacheRules;
                    console.log(`✅ [CDN] Loaded ${state.rules.length} cache rules`);
                }

                // Start health checks
                HealthCheck.startAll();

                // Start metrics collection
                MetricsCollector.start();

            } else {
                console.warn('⚠️ [CDN] Config file not found, using defaults');
            }
        } catch (error) {
            console.warn('⚠️ [CDN] Failed to load config:', error.message);
        }

        console.log('✅ [CDN] Integration engine initialized');
        console.log('📊 [CDN] Nodes:', state.nodes.size);
        console.log('🌍 [CDN] Regions:', state.regions.size);
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.CDNIntegration = {
        // Node Management
        registerNode: NodeManager.register.bind(NodeManager),
        getNode: NodeManager.get.bind(NodeManager),
        getNodes: NodeManager.getAll.bind(NodeManager),
        getOptimalNode: NodeManager.getOptimalNode.bind(NodeManager),

        // Health Checks
        startHealthChecks: HealthCheck.startAll.bind(HealthCheck),
        stopHealthChecks: HealthCheck.stopAll.bind(HealthCheck),
        checkNodeHealth: HealthCheck.check.bind(HealthCheck),

        // Cache Management
        purgeCache: CacheManager.purge.bind(CacheManager),
        getCacheHeaders: CacheManager.setCacheHeaders.bind(CacheManager),
        getCacheStats: CacheManager.getStats.bind(CacheManager),

        // Content Replication
        replicateContent: Replication.replicate.bind(Replication),

        // Load Balancing
        getCDNUrl: LoadBalancer.getUrl.bind(LoadBalancer),

        // Region Management
        registerRegion: RegionManager.register.bind(RegionManager),
        getRegion: RegionManager.get.bind(RegionManager),
        getRegions: RegionManager.getAll.bind(RegionManager),
        detectRegion: RegionManager.detectUserRegion.bind(RegionManager),

        // Metrics
        getMetrics: MetricsCollector.getSnapshot.bind(MetricsCollector),
        getMetricsHistory: MetricsCollector.getHistory.bind(MetricsCollector),

        // State
        state: () => ({
            nodes: state.nodes.size,
            regions: state.regions.size,
            healthyNodes: NodeManager.getAll({ healthy: true }).length,
            metrics: state.metrics
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
