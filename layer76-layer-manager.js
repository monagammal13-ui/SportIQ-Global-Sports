/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 76: CORE MODULAR LAYER MANAGEMENT ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Centralized layer registry, status monitoring, dependency management
 * Features: Enable/disable layers, health monitoring, dependency resolution
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
        layer: {
            configPath: '../api-json/layer-manifest.json',
            statusCheckInterval: 5000,
            autoRegisterLayers: true
        },
        events: {
            layerRegistered: 'layer:registered',
            layerEnabled: 'layer:enabled',
            layerDisabled: 'layer:disabled',
            layerStatusChange: 'layer:status-change',
            dependencyError: 'layer:dependency-error'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        layers: new Map(),
        categories: new Map(),
        dependencies: new Map(),
        statusChecks: new Map(),
        statistics: {
            total: 0,
            active: 0,
            inactive: 0,
            failed: 0
        },
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER REGISTRY
    // ═══════════════════════════════════════════════════════════════════════

    const LayerRegistry = {
        /**
         * Register layer
         */
        register: function (layer) {
            const id = layer.id || layer.name;

            const layerObj = {
                id,
                name: layer.name || id,
                version: layer.version || '1.0.0',
                category: layer.category || 'core',
                description: layer.description || '',
                dependencies: layer.dependencies || [],
                globals: layer.globals || [],
                files: layer.files || [],
                enabled: layer.enabled !== false,
                status: 'unknown',
                health: {
                    isHealthy: true,
                    lastCheck: null,
                    errors: []
                },
                metadata: {
                    author: layer.author || 'SportIQ',
                    created: layer.created || Date.now(),
                    updated: layer.updated || Date.now()
                }
            };

            state.layers.set(id, layerObj);

            // Add to category
            if (!state.categories.has(layerObj.category)) {
                state.categories.set(layerObj.category, []);
            }
            state.categories.get(layerObj.category).push(id);

            // Check status
            this.checkStatus(id);

            // Update stats
            this.updateStatistics();

            // Fire event
            const event = new CustomEvent(CONFIG.events.layerRegistered, {
                detail: { layer: layerObj, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('✅ [LayerMgmt] Layer registered:', id);

            return layerObj;
        },

        /**
         * Get layer
         */
        get: function (layerId) {
            return state.layers.get(layerId);
        },

        /**
         * Get all layers
         */
        getAll: function (filter = {}) {
            let layers = Array.from(state.layers.values());

            if (filter.category) {
                layers = layers.filter(l => l.category === filter.category);
            }

            if (filter.enabled !== undefined) {
                layers = layers.filter(l => l.enabled === filter.enabled);
            }

            if (filter.status) {
                layers = layers.filter(l => l.status === filter.status);
            }

            return layers;
        },

        /**
         * Check layer status
         */
        checkStatus: function (layerId) {
            const layer = state.layers.get(layerId);
            if (!layer) return;

            let status = 'unknown';
            let isHealthy = true;
            const errors = [];

            // Check if globals are defined
            if (layer.globals.length > 0) {
                const allDefined = layer.globals.every(global => {
                    const exists = window[global] !== undefined;
                    if (!exists) {
                        errors.push(`Global ${global} not found`);
                    }
                    return exists;
                });

                status = allDefined ? 'active' : 'inactive';
                isHealthy = allDefined;
            } else {
                // Assume active if no globals to check
                status = layer.enabled ? 'active' : 'inactive';
            }

            // Update layer
            const previousStatus = layer.status;
            layer.status = status;
            layer.health.isHealthy = isHealthy;
            layer.health.lastCheck = Date.now();
            layer.health.errors = errors;

            // Fire event if status changed
            if (previousStatus !== status) {
                const event = new CustomEvent(CONFIG.events.layerStatusChange, {
                    detail: {
                        layerId,
                        status,
                        previous: previousStatus,
                        timestamp: Date.now()
                    }
                });
                document.dispatchEvent(event);
            }

            return { status, isHealthy, errors };
        },

        /**
         * Update statistics
         */
        updateStatistics: function () {
            state.statistics.total = state.layers.size;
            state.statistics.active = this.getAll({ status: 'active' }).length;
            state.statistics.inactive = this.getAll({ status: 'inactive' }).length;
            state.statistics.failed = this.getAll().filter(l => !l.health.isHealthy).length;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DEPENDENCY MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const DependencyManager = {
        /**
         * Check if dependencies are met
         */
        checkDependencies: function (layerId) {
            const layer = state.layers.get(layerId);
            if (!layer || layer.dependencies.length === 0) {
                return { satisfied: true, missing: [] };
            }

            const missing = [];

            for (const depId of layer.dependencies) {
                const dep = state.layers.get(depId);

                if (!dep) {
                    missing.push({ id: depId, reason: 'not-registered' });
                } else if (!dep.enabled) {
                    missing.push({ id: depId, reason: 'disabled' });
                } else if (dep.status !== 'active') {
                    missing.push({ id: depId, reason: 'not-active' });
                }
            }

            return {
                satisfied: missing.length === 0,
                missing
            };
        },

        /**
         * Get dependent layers
         */
        getDependents: function (layerId) {
            const dependents = [];

            state.layers.forEach((layer, id) => {
                if (layer.dependencies.includes(layerId)) {
                    dependents.push(id);
                }
            });

            return dependents;
        },

        /**
         * Build dependency graph
         */
        buildGraph: function () {
            const graph = {};

            state.layers.forEach((layer, id) => {
                graph[id] = {
                    dependencies: layer.dependencies,
                    dependents: this.getDependents(id)
                };
            });

            return graph;
        },

        /**
         * Resolve load order
         */
        resolveLoadOrder: function () {
            const ordered = [];
            const visited = new Set();
            const temp = new Set();

            const visit = (layerId) => {
                if (temp.has(layerId)) {
                    throw new Error(`Circular dependency detected: ${layerId}`);
                }

                if (visited.has(layerId)) return;

                temp.add(layerId);

                const layer = state.layers.get(layerId);
                if (layer) {
                    layer.dependencies.forEach(dep => visit(dep));
                }

                temp.delete(layerId);
                visited.add(layerId);
                ordered.push(layerId);
            };

            state.layers.forEach((layer, id) => {
                if (!visited.has(id)) {
                    try {
                        visit(id);
                    } catch (error) {
                        console.error('❌ [LayerMgmt] Dependency error:', error.message);
                    }
                }
            });

            return ordered;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER CONTROLLER
    // ═══════════════════════════════════════════════════════════════════════

    const LayerController = {
        /**
         * Enable layer
         */
        enable: function (layerId) {
            const layer = state.layers.get(layerId);
            if (!layer) {
                console.error('❌ [LayerMgmt] Layer not found:', layerId);
                return false;
            }

            // Check dependencies
            const depCheck = DependencyManager.checkDependencies(layerId);
            if (!depCheck.satisfied) {
                console.error('❌ [LayerMgmt] Dependencies not met:', depCheck.missing);

                const event = new CustomEvent(CONFIG.events.dependencyError, {
                    detail: { layerId, missing: depCheck.missing }
                });
                document.dispatchEvent(event);

                return false;
            }

            layer.enabled = true;
            LayerRegistry.checkStatus(layerId);
            LayerRegistry.updateStatistics();

            // Fire event
            const event = new CustomEvent(CONFIG.events.layerEnabled, {
                detail: { layerId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('✅ [LayerMgmt] Layer enabled:', layerId);

            return true;
        },

        /**
         * Disable layer
         */
        disable: function (layerId) {
            const layer = state.layers.get(layerId);
            if (!layer) {
                console.error('❌ [LayerMgmt] Layer not found:', layerId);
                return false;
            }

            // Check dependents
            const dependents = DependencyManager.getDependents(layerId);
            const activeDependents = dependents.filter(id => {
                const dep = state.layers.get(id);
                return dep && dep.enabled;
            });

            if (activeDependents.length > 0) {
                console.warn('⚠️ [LayerMgmt] Layer has active dependents:', activeDependents);
                // Optionally return false or disable dependents too
            }

            layer.enabled = false;
            layer.status = 'inactive';
            LayerRegistry.updateStatistics();

            // Fire event
            const event = new CustomEvent(CONFIG.events.layerDisabled, {
                detail: { layerId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('⏹️ [LayerMgmt] Layer disabled:', layerId);

            return true;
        },

        /**
         * Reload layer
         */
        reload: function (layerId) {
            const layer = state.layers.get(layerId);
            if (!layer) return false;

            // Disable then enable
            this.disable(layerId);

            setTimeout(() => {
                this.enable(layerId);
            }, 100);

            return true;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS MONITOR
    // ═══════════════════════════════════════════════════════════════════════

    const StatusMonitor = {
        /**
         * Start monitoring
         */
        start: function () {
            console.log('🔍 [LayerMgmt] Starting status monitoring');

            this.check();

            this.timerId = setInterval(() => {
                this.check();
            }, CONFIG.layer.statusCheckInterval);
        },

        /**
         * Stop monitoring
         */
        stop: function () {
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        },

        /**
         * Check all layers
         */
        check: function () {
            state.layers.forEach((layer, id) => {
                LayerRegistry.checkStatus(id);
            });

            LayerRegistry.updateStatistics();
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-DISCOVERY
    // ═══════════════════════════════════════════════════════════════════════

    const AutoDiscovery = {
        /**
         * Discover layers from window globals
         */
        discover: function () {
            const discovered = [];

            // Known layer globals
            const knownGlobals = {
                'AuthEngine': { id: 'layer71-auth', name: 'Authentication & Roles', category: 'security' },
                'APIIntegration': { id: 'layer72-api', name: 'API Integration', category: 'integration' },
                'CDNIntegration': { id: 'layer73-cdn', name: 'CDN Integration', category: 'infrastructure' },
                'BackupEngine': { id: 'layer74-backup', name: 'Backup & Recovery', category: 'data' },
                'ResponsiveEngine': { id: 'layer75-responsive', name: 'Mobile Responsiveness', category: 'ui' }
            };

            Object.entries(knownGlobals).forEach(([global, info]) => {
                if (window[global]) {
                    discovered.push({
                        ...info,
                        globals: [global],
                        enabled: true
                    });
                }
            });

            return discovered;
        },

        /**
         * Auto-register discovered layers
         */
        autoRegister: function () {
            const discovered = this.discover();

            discovered.forEach(layer => {
                if (!state.layers.has(layer.id)) {
                    LayerRegistry.register(layer);
                }
            });

            console.log(`✅ [LayerMgmt] Auto-discovered ${discovered.length} layers`);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🎛️ LAYER 76: MODULAR LAYER MANAGEMENT ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Auto-discover existing layers
        if (CONFIG.layer.autoRegisterLayers) {
            AutoDiscovery.autoRegister();
        }

        // Load manifest
        try {
            const response = await fetch(CONFIG.layer.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register layers from manifest
                if (state.config.layers) {
                    state.config.layers.forEach(layer => {
                        if (!state.layers.has(layer.id)) {
                            LayerRegistry.register(layer);
                        }
                    });
                    console.log(`✅ [LayerMgmt] Loaded ${state.config.layers.length} layers from manifest`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [LayerMgmt] Failed to load manifest:', error.message);
        }

        // Start status monitoring
        StatusMonitor.start();

        console.log('✅ [LayerMgmt] Engine initialized');
        console.log('📊 [LayerMgmt] Total layers:', state.statistics.total);
        console.log('✅ [LayerMgmt] Active layers:', state.statistics.active);
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.LayerManager = {
        // Registry
        register: LayerRegistry.register.bind(LayerRegistry),
        getLayer: LayerRegistry.get.bind(LayerRegistry),
        getLayers: LayerRegistry.getAll.bind(LayerRegistry),
        checkStatus: LayerRegistry.checkStatus.bind(LayerRegistry),

        // Control
        enable: LayerController.enable.bind(LayerController),
        disable: LayerController.disable.bind(LayerController),
        reload: LayerController.reload.bind(LayerController),

        // Dependencies
        checkDependencies: DependencyManager.checkDependencies.bind(DependencyManager),
        getDependents: DependencyManager.getDependents.bind(DependencyManager),
        getDependencyGraph: DependencyManager.buildGraph.bind(DependencyManager),
        getLoadOrder: DependencyManager.resolveLoadOrder.bind(DependencyManager),

        // Categories
        getCategories: () => Array.from(state.categories.keys()),
        getLayersByCategory: (cat) => state.categories.get(cat) || [],

        // Statistics
        getStats: () => ({ ...state.statistics }),

        // State
        state: () => ({
            layers: state.layers.size,
            categories: state.categories.size,
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
