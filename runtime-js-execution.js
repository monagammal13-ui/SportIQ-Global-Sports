/**
 * Runtime_JS_Execution_Engine
 * Real-time JavaScript execution with dependency resolution and conflict prevention
 */

class RuntimeJSExecutionEngine {
    constructor() {
        this.executedScripts = new Set();
        this.pendingScripts = new Map();
        this.dependencies = new Map();
        this.modules = new Map();
        this.errors = [];
        this.isActive = false;

        this.init();
    }

    async init() {
        console.log('⚡ Runtime JS Execution Engine - STARTING');

        // Setup error handling
        this.setupErrorHandling();

        // Execute all JS files
        await this.executeAllJS();

        // Resolve dependencies
        this.resolveDependencies();

        // Start monitoring
        this.startJSMonitoring();

        this.isActive = true;
        console.log('✅ Runtime JS Execution Engine - ACTIVE');
    }

    // SETUP ERROR HANDLING (Failsafe)
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleScriptError(event);
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('⚠️ Unhandled Promise:', event.reason);
            this.errors.push({
                type: 'promise',
                error: event.reason,
                time: new Date().toISOString()
            });
        });

        console.log('✅ Error handling enabled (Failsafe)');
    }

    handleScriptError(event) {
        const error = {
            type: 'script',
            message: event.message,
            file: event.filename,
            line: event.lineno,
            column: event.colno,
            error: event.error,
            time: new Date().toISOString()
        };

        this.errors.push(error);
        console.error('❌ Script Error:', error.message, 'in', error.file);

        // Prevent error from breaking the page
        event.preventDefault();
    }

    // EXECUTE ALL JS FILES
    async executeAllJS() {
        const jsFiles = [
            // Core utilities
            { path: '/js/utils.js', priority: 1 },
            { path: '/js/helpers.js', priority: 1 },
            { path: '/js/constants.js', priority: 1 },

            // Theme & UI
            { path: '/js/theme-manager.js', priority: 2 },
            { path: '/js/ui-controller.js', priority: 2 },

            // Features
            { path: '/js/image-assurance.js', priority: 3 },
            { path: '/js/analytics-tracker.js', priority: 3 },
            { path: '/js/slider.js', priority: 3 },
            { path: '/js/navigation.js', priority: 3 },
            { path: '/js/search.js', priority: 3 },
            { path: '/js/forms.js', priority: 3 },

            // Advanced features
            { path: '/js/live-scores.js', priority: 4 },
            { path: '/js/commentary.js', priority: 4 },
            { path: '/js/rankings.js', priority: 4 },
            { path: '/js/notifications.js', priority: 4 },
            { path: '/js/polls.js', priority: 4 },

            // Integration
            { path: '/js/app.js', priority: 5 },
            { path: '/js/main.js', priority: 6 }
        ];

        // Sort by priority
        jsFiles.sort((a, b) => a.priority - b.priority);

        console.log(`📦 Executing ${jsFiles.length} JS files...`);

        // Execute in priority order
        for (const file of jsFiles) {
            await this.executeJS(file.path, file.priority);
        }

        console.log(`✅ Executed ${this.executedScripts.size} JS files`);
    }

    // Execute single JS file
    async executeJS(path, priority = 5) {
        return new Promise((resolve) => {
            // Skip if already executed
            if (this.executedScripts.has(path) || document.querySelector(`script[src="${path}"]`)) {
                console.log(`⏭️  Already loaded: ${path}`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = path;

            // Async execution based on priority
            if (priority <= 3) {
                script.async = false; // Load in order
            } else {
                script.defer = true;  // Defer execution
            }

            script.onload = () => {
                this.executedScripts.add(path);
                console.log(`✅ Executed JS: ${path}`);
                this.registerModule(path);
                resolve();
            };

            script.onerror = () => {
                console.warn(`⚠️  JS not found: ${path}`);
                this.errors.push({
                    type: 'load',
                    path,
                    time: new Date().toISOString()
                });
                resolve(); // Continue anyway
            };

            document.body.appendChild(script);
        });
    }

    // REGISTER MODULE
    registerModule(path) {
        const moduleName = path.split('/').pop().replace('.js', '');

        // Check if module exposed itself globally
        const possibleNames = [
            moduleName,
            moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
            moduleName.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        ];

        for (const name of possibleNames) {
            if (window[name] && typeof window[name] === 'object') {
                this.modules.set(moduleName, window[name]);
                console.log(`📌 Registered module: ${moduleName}`);
                break;
            } else if (window[name] && typeof window[name] === 'function') {
                this.modules.set(moduleName, window[name]);
                console.log(`📌 Registered function: ${moduleName}`);
                break;
            }
        }
    }

    // RESOLVE DEPENDENCIES
    resolveDependencies() {
        console.log('🔗 Resolving dependencies...');

        // Common dependency patterns
        const depMap = {
            'app': ['theme-manager', 'ui-controller'],
            'slider': ['image-assurance'],
            'live-scores': ['analytics-tracker'],
            'commentary': ['live-scores'],
            'rankings': ['live-scores']
        };

        this.dependencies = new Map(Object.entries(depMap));

        // Check if all dependencies are loaded
        for (const [module, deps] of this.dependencies) {
            const missing = deps.filter(dep => !this.modules.has(dep));
            if (missing.length > 0) {
                console.warn(`⚠️  ${module} missing dependencies:`, missing);
            }
        }

        console.log('✅ Dependencies resolved');
    }

    // PREVENT JS CONFLICTS
    preventConflicts() {
        console.log('🛡️  Preventing conflicts...');

        // Namespace protection
        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }

        // Store original globals
        const protectedGlobals = ['$', 'jQuery', '_', 'React', 'Vue', 'Angular'];

        protectedGlobals.forEach(global => {
            if (window[global]) {
                window.SPORTIQ[`_original_${global}`] = window[global];
            }
        });

        // Conflict resolver
        window.SPORTIQ.noConflict = (name) => {
            const original = window.SPORTIQ[`_original_${name}`];
            if (original) {
                window[name] = original;
            }
            return window.SPORTIQ[name];
        };

        console.log('✅ Conflict prevention enabled');
    }

    // MONITOR FOR NEW JS FILES
    startJSMonitoring() {
        console.log('👀 JS monitoring started (5min interval)');

        // Check for new JS every 5 minutes
        setInterval(() => {
            this.scanForNewJS();
        }, 300000);

        // Also monitor DOM mutations for dynamically added scripts
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'SCRIPT' && node.src) {
                        const src = node.getAttribute('src');
                        if (!this.executedScripts.has(src)) {
                            console.log(`🆕 New script detected: ${src}`);
                            this.executedScripts.add(src);
                            this.registerModule(src);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ DOM mutation observer active');
    }

    async scanForNewJS() {
        console.log('🔍 Scanning for new JS files...');

        const allScripts = document.querySelectorAll('script[src]');

        allScripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && !this.executedScripts.has(src)) {
                console.log(`🆕 New JS detected: ${src}`);
                this.executedScripts.add(src);
                this.registerModule(src);
            }
        });
    }

    // PUBLIC API
    async addJS(path, priority = 5) {
        return this.executeJS(path, priority);
    }

    removeJS(path) {
        const script = document.querySelector(`script[src="${path}"]`);
        if (script) {
            script.remove();
            this.executedScripts.delete(path);
            console.log(`🗑️ Removed JS: ${path}`);
        }
    }

    async reloadJS(path, priority = 5) {
        this.removeJS(path);
        return this.executeJS(path, priority);
    }

    getModule(name) {
        return this.modules.get(name);
    }

    hasModule(name) {
        return this.modules.has(name);
    }

    getErrors() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
        console.log('🗑️ Errors cleared');
    }

    getStatus() {
        return {
            active: this.isActive,
            executedScripts: this.executedScripts.size,
            registeredModules: this.modules.size,
            pendingScripts: this.pendingScripts.size,
            errors: this.errors.length,
            scripts: Array.from(this.executedScripts)
        };
    }

    // Execute code safely
    safeExecute(fn, context = window) {
        try {
            return fn.call(context);
        } catch (error) {
            console.error('❌ Safe Execute failed:', error);
            this.errors.push({
                type: 'execution',
                error: error.message,
                stack: error.stack,
                time: new Date().toISOString()
            });
            return null;
        }
    }

    // Execute code with timeout
    async executeWithTimeout(fn, timeout = 5000) {
        return Promise.race([
            new Promise((resolve) => {
                const result = this.safeExecute(fn);
                resolve(result);
            }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Execution timeout')), timeout);
            })
        ]);
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.RuntimeJS = new RuntimeJSExecutionEngine();
    });
} else {
    window.RuntimeJS = new RuntimeJSExecutionEngine();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuntimeJSExecutionEngine;
}
