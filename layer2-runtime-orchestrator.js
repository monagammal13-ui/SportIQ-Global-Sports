/**
 * Layer 2: Runtime Orchestrator
 * ID: layer-002
 * Description: Orchestrates the dynamic loading of all platform layers, resolving dependencies
 * and enforcing lifecycle hooks (beforeLoad, onLoad, afterLoad).
 */

import Runtime from './layer1-core-runtime.js';
import LayerManifest from './layer3-manifest.js';


class LayerOrchestrator {
    constructor() {
        if (window.__ANTIGRAVITY_ORCHESTRATOR__) {
            console.warn('[Orchestrator] Already initialized.');
            return window.__ANTIGRAVITY_ORCHESTRATOR__;
        }

        this.manifest = null;
        this.layers = new Map(); // id -> layer definition
        this.activeModules = new Map(); // id -> module instance
        this.loadingPromises = new Map(); // id -> promise
        this.executionOrder = [];

        // Hooks
        this.hooks = {
            beforeLoad: [],
            onLoad: [],
            afterLoad: [],
            onError: []
        };

        this._bindMethods();
        this._initialize();
    }

    _bindMethods() {
        this.loadLayer = this.loadLayer.bind(this);
        this.init = this.init.bind(this);
    }

    _initialize() {
        console.log('[Orchestrator] Initializing...');

        // Register with Runtime
        if (Runtime && Runtime.setState) {
            Runtime.setState('orchestrator', 'initializing');
        }

        // Expose global
        window.__ANTIGRAVITY_ORCHESTRATOR__ = this;
    }

    /**
     * Start the orchestration process
     */
    async init() {
        try {
            // Step 1: Load Manifest via Layer 3
            this.manifest = await LayerManifest.init();

            // Index layers locally for quick access during loading
            // (Layer 3 already indexes them, but Orchestrator keeps its own map for state tracking)
            const allLayers = [
                ...(this.manifest.layers.active || []),
                ...(this.manifest.layers.nowActivating || [])
            ];
            allLayers.forEach(layer => {
                this.layers.set(layer.id, layer);
            });

            // Step 2: Get Execution Order from Layer 3
            this.executionOrder = LayerManifest.resolveExecutionOrder();

            // Step 3: Execute
            await this._executeLoadingSequence();

            if (Runtime && Runtime.setState) {
                Runtime.setState('orchestrator', 'ready');
            }
            console.log('[Orchestrator] System Fully Orchestrated.');
        } catch (error) {
            console.error('[Orchestrator] Critical Failure:', error);
            if (Runtime && Runtime.logError) {
                Runtime.logError(error, 'orchestrator-init');
            }
        }
    }

    /**
     * Execute the loading sequence
     */
    async _executeLoadingSequence() {
        for (const layerId of this.executionOrder) {
            // Check if already loaded (e.g., via script tag)
            const layer = this.layers.get(layerId);
            if (!layer) continue;

            // Skip Core Runtime (Layer 1) as it is the bootloader
            if (layerId === 'layer-001' || layerId === 'core-001') continue;

            // Attempt to load
            await this.loadLayer(layerId);
        }
    }

    /**
     * Dynamically load a specific layer
     * @param {string} layerId 
     */
    async loadLayer(layerId) {
        if (this.activeModules.has(layerId)) return this.activeModules.get(layerId);
        if (this.loadingPromises.has(layerId)) return this.loadingPromises.get(layerId);

        const layer = this.layers.get(layerId);
        if (!layer) {
            console.warn(`[Orchestrator] Unknown layer: ${layerId}`);
            return null;
        }

        const loadPromise = (async () => {
            console.log(`[Orchestrator] Loading: ${layer.name} (${layerId})...`);

            try {
                this._triggerHook('beforeLoad', layer);

                // Construct path (handling relative paths)
                let importPath = layer.file;
                if (!importPath.startsWith('/') && !importPath.startsWith('./') && !importPath.startsWith('../')) {
                    importPath = '../' + importPath;
                } else if (importPath.startsWith('js/')) {
                    importPath = '../' + importPath;
                }

                // Dynamic Import
                const module = await import(importPath);

                this.activeModules.set(layerId, module);
                this._triggerHook('onLoad', { layer, module });

                // Initialize if module has init method
                if (module && typeof module.init === 'function') {
                    await module.init({
                        runtime: Runtime,
                        config: layer.config ? await this._fetchConfig(layer.config) : {}
                    });
                } else if (module && module.default && typeof module.default.init === 'function') {
                    await module.default.init({
                        runtime: Runtime,
                        config: layer.config ? await this._fetchConfig(layer.config) : {}
                    });
                }

                this._triggerHook('afterLoad', layer);
                console.log(`[Orchestrator] Activated: ${layerId}`);

                return module;
            } catch (error) {
                console.error(`[Orchestrator] Failed to load ${layerId}:`, error);
                this._triggerHook('onError', { layer, error });
                // We don't throw here to allow other independent layers to proceed? 
                // Decision: Log but don't crash whole orchestrator for one non-critical layer.
                return null;
            }
        })();

        this.loadingPromises.set(layerId, loadPromise);
        return loadPromise;
    }

    /**
     * Fetch layer configuration
     */
    async _fetchConfig(path) {
        try {
            const res = await fetch('../' + path);
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn(`[Orchestrator] Config missing: ${path}`);
        }
        return {};
    }

    _triggerHook(hook, data) {
        if (this.hooks[hook]) {
            this.hooks[hook].forEach(fn => {
                try { fn(data); } catch (e) { console.error(`[Orchestrator] Hook error (${hook}):`, e); }
            });
        }
    }

    /**
     * Public: Add a hook
     */
    on(hook, callback) {
        if (this.hooks[hook]) {
            this.hooks[hook].push(callback);
        }
    }
}

// Instantiate and Export
const orchestrator = new LayerOrchestrator();

// Auto-start if document is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    orchestrator.init();
} else {
    document.addEventListener('DOMContentLoaded', () => orchestrator.init());
}

export default orchestrator;
