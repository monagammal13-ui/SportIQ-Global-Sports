/**
 * Layer 3: Layer Manifest and Dependency Graph
 * ID: layer-003
 * Description: Defines what layers exist, their order, and dependencies.
 * Actively reads, parses, and validates the manifest at runtime.
 */

import Runtime from './layer1-core-runtime.js';

class LayerManifest {
    constructor() {
        // Singleton guard
        if (window.__ANTIGRAVITY_MANIFEST__ && window.__ANTIGRAVITY_MANIFEST__ instanceof LayerManifest) {
            return window.__ANTIGRAVITY_MANIFEST__;
        }

        this.manifest = null;
        this.layerMap = new Map();
        this.status = 'idle'; // idle, loading, ready, error
        this.isValid = false;

        // Expose global
        window.__ANTIGRAVITY_MANIFEST__ = this;

        console.log('[Layer 3] Manifest Module Initialized');
    }

    /**
     * Initializes the manifest layer.
     * Fetches the JSON, validates it, and prepares the dependency graph.
     */
    async init() {
        if (this.status === 'ready') return this.manifest;

        console.log('[Layer 3] Fetching and Validating Manifest from Runtime...');
        this.status = 'loading';

        try {
            // Active read at runtime
            const response = await fetch('../LAYER_MANIFEST.json');
            if (!response.ok) {
                throw new Error(`Manifest Fetch Failed: ${response.status} ${response.statusText}`);
            }

            const rawData = await response.json();

            // Validate integrity
            this._validateIntegrity(rawData);

            // If valid, store it
            this.manifest = rawData;
            this._indexLayers(this.manifest);

            this.isValid = true;
            this.status = 'ready';

            if (Runtime && Runtime.setState) {
                Runtime.setState('manifest', 'ready');
            }

            console.log(`[Layer 3] Manifest Validated. Total Layers: ${this.manifest.totalLayers || 'Unknown'}`);
            return this.manifest;

        } catch (error) {
            this.status = 'error';
            this.isValid = false;
            console.error('[Layer 3] Critical Manifest Error:', error);

            // Provide meaningful error messages
            if (Runtime && Runtime.logError) {
                Runtime.logError(error, 'layer3-manifest');
            }
            throw error; // Rethrow so Orchestrator knows we failed
        }
    }

    /**
     * Validates that the manifest structure is correct and consistent.
     * @param {Object} data 
     */
    _validateIntegrity(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Manifest is not a valid JSON object');
        }

        // Required root fields
        if (!data.manifestVersion) throw new Error('Missing "manifestVersion"');
        if (!data.layers) throw new Error('Missing "layers" object');

        const { active, nowActivating } = data.layers;

        // Validate Active Layers
        if (!Array.isArray(active)) {
            throw new Error('layers.active must be an array');
        }

        // Validate IDs and Duplicates
        const seenIds = new Set();
        const validateLayer = (layer, category) => {
            if (!layer.id) throw new Error(`Layer in ${category} missing "id"`);
            if (!layer.name) throw new Error(`Layer ${layer.id} missing "name"`);
            if (!layer.file) throw new Error(`Layer ${layer.id} missing "file" path`);

            if (seenIds.has(layer.id)) {
                throw new Error(`Duplicate Layer ID detected: ${layer.id}`);
            }
            seenIds.add(layer.id);

            // Check dependencies format
            if (layer.dependencies && !Array.isArray(layer.dependencies)) {
                throw new Error(`Layer ${layer.id} has invalid dependencies format (must be array)`);
            }
        };

        active.forEach(l => validateLayer(l, 'active'));

        if (nowActivating && Array.isArray(nowActivating)) {
            nowActivating.forEach(l => validateLayer(l, 'nowActivating'));
        }

        // Circular Dependency Check is assumed to be handled by Orchestrator's topological sort,
        // but we could add a check here if needed. For now, structural integrity is key.
    }

    /**
     * Indexes layers for O(1) lookup
     * @param {Object} data 
     */
    _indexLayers(data) {
        this.layerMap.clear();

        const allLayers = [
            ...(data.layers.active || []),
            ...(data.layers.nowActivating || [])
        ];

        allLayers.forEach(layer => {
            this.layerMap.set(layer.id, layer);
        });
    }

    /**
     * Returns the full manifest object
     */
    getManifest() {
        if (!this.isValid) {
            console.warn('[Layer 3] Warning: Requesting invalid or uninitialized manifest');
        }
        return this.manifest;
    }

    /**
     * Get a specific layer definition by ID
     * @param {string} id 
     */
    getLayer(id) {
        return this.layerMap.get(id);
    }

    /**
     * Get all active layer definitions as a list
     */
    getAllLayers() {
        return Array.from(this.layerMap.values());
    }
}

const layerManifest = new LayerManifest();
export default layerManifest;
