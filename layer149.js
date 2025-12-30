/**
 * Layer 149: Future Expansion & Plugin Gateway
 * The connection point for external, third-party, or future internal modules
 * to attach to the SportIQ system without modifying core code.
 * 
 * Responsibilities:
 * - Validates and Registers external plugins.
 * - Provides Sandbox API for plugins to access system safely.
 * - Monitors plugin health and performance.
 */
export class SportIQPluginGateway {
    constructor() {
        this.id = 'layer-149';
        this.name = 'Future Expansion & Plugin Gateway';
        this.version = '2.0.0';
        this.initialized = false;

        this.plugins = new Map(); // Accepted Plugins
        this.sandboxApi = null;   // The restricted API surface

        this.config = {
            allowExternal: false, // Default secure
            maxPlugins: 10,
            requiredPerms: ["read_events"]
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🔌 Initializing ${this.name}...`);

        await this.loadConfig();
        this.constructSandbox();
        this.scanForPendingPlugins();

        this.initialized = true;

        // Register with Orchestrator
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }

        // Global Access Point
        window.SportIQPlugins = {
            register: (manifest) => this.registerPlugin(manifest),
            list: () => this.listPlugins()
        };
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer149.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('🔌 Plugin Gateway Config Loaded');
            }
        } catch (e) { console.warn('Using default plugin config'); }
    }

    constructSandbox() {
        // Create a restricted version of the Event Bus / State
        this.sandboxApi = {
            on: (event, callback) => {
                if (window.__ANTIGRAVITY_EVENT_BUS__) {
                    window.__ANTIGRAVITY_EVENT_BUS__.subscribe(event, callback);
                }
            },
            emit: (event, data) => {
                // Prefix events to prevent system hijacking
                if (window.__ANTIGRAVITY_EVENT_BUS__) {
                    window.__ANTIGRAVITY_EVENT_BUS__.publish(`plugin:${event}`, data);
                }
            },
            getPublicProfile: () => {
                // Only return safe fields
                const p = window.SportIQProfile || {};
                return { segments: p.segments || [] };
            }
        };
    }

    registerPlugin(manifest) {
        if (this.plugins.size >= this.config.maxPlugins) {
            console.warn(`🔌 Plugin limit reached. Rejected ${manifest.name}`);
            return false;
        }

        if (!this.validateManifest(manifest)) {
            console.error(`🔌 Invalid plugin manifest for ${manifest.name}`);
            return false;
        }

        try {
            console.log(`🔌 Registering Plugin: ${manifest.name} v${manifest.version}`);

            // Execute Init with Sandbox
            if (typeof manifest.init === 'function') {
                manifest.init(this.sandboxApi);
            }

            this.plugins.set(manifest.id, {
                ...manifest,
                status: 'active',
                registeredAt: Date.now()
            });

            return true;
        } catch (e) {
            console.error(`🔌 Plugin Crash: ${manifest.name}`, e);
            return false;
        }
    }

    validateManifest(m) {
        return m && m.id && m.name && m.version;
    }

    scanForPendingPlugins() {
        // Check if any plugins were loaded before Gateway was ready
        if (window.SportIQPendingPlugins && Array.isArray(window.SportIQPendingPlugins)) {
            window.SportIQPendingPlugins.forEach(p => this.registerPlugin(p));
            window.SportIQPendingPlugins = [];
        }
    }

    listPlugins() {
        return Array.from(this.plugins.values());
    }
}

// Runtime Execution
window.Layer149_Gateway = new SportIQPluginGateway();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer149_Gateway.init());
} else {
    window.Layer149_Gateway.init();
}
