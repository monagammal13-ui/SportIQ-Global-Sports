/**
 * Layer 1: Core Runtime Bootstrap
 * ID: layer-001
 * Type: Core
 * Description: Initializes the global runtime environment, lifecycle, state, and error boundaries.
 */

class AntigravityRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            console.warn('[Antigravity] Runtime already initialized.');
            return window.__ANTIGRAVITY_RUNTIME__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-001';
        this.name = 'Core Runtime Bootstrap';
        this.timestamp = new Date().toISOString();

        // Global State Container
        this.state = {
            layers: {},
            config: {},
            session: {},
            flags: {},
            errors: [],
            metrics: {}
        };

        // Lifecycle Management
        this.lifecycle = {
            status: 'pending', // pending, booting, initializing, ready, destroyed
            hooks: {
                onBoot: [],
                onInit: [],
                onReady: [],
                onDestroy: []
            }
        };

        // Environment Detection
        this.env = this._detectEnvironment();

        // Bind methods
        this.hook = this.hook.bind(this);
        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);
        this.logError = this.logError.bind(this);

        // Initialize
        this._boot();
    }

    /**
     * Internal: Environment Detection
     */
    _detectEnvironment() {
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        let browser = 'Unknown';
        if (ua.indexOf("Chrome") > -1) browser = "Chrome";
        else if (ua.indexOf("Safari") > -1) browser = "Safari";
        else if (ua.indexOf("Firefox") > -1) browser = "Firefox";
        else if (ua.indexOf("MSIE") > -1 || !!document.documentMode) browser = "IE";

        let os = 'Unknown';
        if (ua.indexOf("Win") > -1) os = "Windows";
        else if (ua.indexOf("Mac") > -1) os = "MacOS";
        else if (ua.indexOf("Linux") > -1) os = "Linux";
        else if (ua.indexOf("Android") > -1) os = "Android";
        else if (ua.indexOf("like Mac") > -1) os = "iOS";

        return {
            browser,
            os,
            isMobile,
            isTouch,
            screen: {
                width: window.innerWidth,
                height: window.innerHeight,
                dpr: window.devicePixelRatio || 1
            },
            performance: {
                start: performance.now()
            }
        };
    }

    /**
     * Internal: Boot Sequence
     */
    _boot() {
        this.lifecycle.status = 'booting';
        this._setupErrorBoundaries();

        console.log(`[Antigravity v${this.version}] Bootstrap sequence initiated.`);
        console.log(`[Antigravity] Environment: ${this.env.os} / ${this.env.browser}`);

        // Execute Hooks
        this._executeHooks('onBoot');

        // Auto-transition to Init
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        this.lifecycle.status = 'initializing';
        console.log('[Antigravity] Initializing core services...');
        this._executeHooks('onInit');
        this._ready();
    }

    _ready() {
        this.lifecycle.status = 'ready';
        console.log('[Antigravity] System Ready.');
        document.documentElement.classList.add('ag-ready');
        window.dispatchEvent(new Event('antigravity:ready'));
        this._executeHooks('onReady');
    }

    /**
     * Internal: Run lifecycle hooks
     */
    _executeHooks(stage) {
        if (this.lifecycle.hooks[stage]) {
            this.lifecycle.hooks[stage].forEach(fn => {
                try {
                    fn(this);
                } catch (e) {
                    this.logError(e, `hook:${stage}`);
                }
            });
        }
    }

    /**
     * Internal: Error Boundaries
     */
    _setupErrorBoundaries() {
        // Global Error Handler
        window.addEventListener('error', (event) => {
            this.logError(event.error || event.message, 'global-window');
            // Don't prevent default, let browser handle logging too usually
        });

        // Unhandled Promise Rejection
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, 'unhandled-rejection');
        });
    }

    // ================= PUBLIC API =================

    /**
     * Register a lifecycle hook
     * @param {string} stage - 'onBoot', 'onInit', 'onReady', 'onDestroy'
     * @param {Function} callback 
     */
    hook(stage, callback) {
        if (this.lifecycle.hooks[stage]) {
            this.lifecycle.hooks[stage].push(callback);
        } else {
            console.error(`[Antigravity] Invalid lifecycle hook: ${stage}`);
        }
    }

    /**
     * Update global state
     * @param {string} key 
     * @param {any} value 
     */
    setState(key, value) {
        this.state[key] = value;
        window.dispatchEvent(new CustomEvent('antigravity:state-change', {
            detail: { key, value, timestamp: Date.now() }
        }));
    }

    /**
     * Get global state
     * @param {string} key 
     */
    getState(key) {
        return this.state[key];
    }

    /**
     * Log system error
     * @param {Error|string} error 
     * @param {string} source 
     */
    logError(error, source = 'system') {
        const errorRecord = {
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: error.message || String(error),
            stack: error.stack || null,
            source: source,
            timestamp: new Date().toISOString()
        };

        this.state.errors.push(errorRecord);

        // Differentiate critical system errors
        console.error(`[Antigravity Error][${source}]`, error);

        window.dispatchEvent(new CustomEvent('antigravity:error', { detail: errorRecord }));
    }
}

// Initialize and Export
const runtime = new AntigravityRuntime();
window.__ANTIGRAVITY_RUNTIME__ = runtime;

export default runtime;
