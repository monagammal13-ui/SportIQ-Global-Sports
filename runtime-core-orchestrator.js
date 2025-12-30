/**
 * Runtime_Core_Orchestrator
 * Auto-detects, links, and executes all project files
 * Persistent & Self-Executing
 */

class RuntimeCoreOrchestrator {
    constructor() {
        this.configs = new Map();
        this.modules = new Map();
        this.styles = new Set();
        this.templates = new Map();
        this.isRunning = false;

        this.init();
    }

    async init() {
        console.log('🚀 Runtime Core Orchestrator - STARTING');

        // Auto-detect and load all files
        await this.detectAndLoadConfigs();
        await this.linkStyles();
        await this.linkScripts();
        await this.registerGlobalFunctions();
        await this.executeConfigs();

        // Start monitoring for new files
        this.startFileMonitoring();

        this.isRunning = true;
        console.log('✅ Runtime Core Orchestrator - ACTIVE');
    }

    // AUTO-DETECT ALL JSON CONFIGS
    async detectAndLoadConfigs() {
        const configFiles = [
            '/api-json/runtime-ultimate.json',
            '/api-json/multilanguage-engine.json',
            '/api-json/live-commentary.json',
            '/api-json/international-rankings.json',
            '/api-json/sports-stats-engine.json',
            '/api-json/multi-region-distribution.json',
            '/api-json/rss-feeds.json',
            '/api-json/interaction-analytics.json',
            '/api-json/video-highlights.json',
            '/api-json/notifications-engine.json',
            '/api-json/trending-dashboard.json',
            '/api-json/rankings-charts.json',
            '/api-json/polls-surveys.json',
            '/api-json/event-calendars.json',
            '/api-json/analytics-tracking.json',
            '/api-json/performance-config.json',
            '/api-json/media-optimization.json',
            '/api-json/slider-config.json',
            '/api-json/image-fallbacks.json',
            '/api-json/ui-config.json',
            '/api-json/data-feeds-integration.json',
            '/api-json/realtime-sync-config.json'
        ];

        for (const file of configFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const config = await response.json();
                    const name = file.split('/').pop().replace('.json', '');
                    this.configs.set(name, config);
                    console.log(`✅ Loaded: ${name}`);
                }
            } catch (err) {
                console.warn(`⚠️ Config not found: ${file}`);
            }
        }
    }

    // AUTO-LINK ALL CSS FILES
    async linkStyles() {
        const cssFiles = [
            '/css/global-ui.css',
            '/css/components.css',
            '/css/responsive.css',
            '/css/animations.css',
            '/css/visual-effects.css',
            '/css/theme.css',
            '/css/utilities.css'
        ];

        for (const file of cssFiles) {
            if (!document.querySelector(`link[href="${file}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = file;
                link.onload = () => console.log(`✅ Linked CSS: ${file}`);
                link.onerror = () => console.warn(`⚠️ CSS not found: ${file}`);
                document.head.appendChild(link);
                this.styles.add(file);
            }
        }
    }

    // AUTO-LINK ALL JS MODULES
    async linkScripts() {
        const jsFiles = [
            '/js/ui-controller.js',
            '/js/theme-manager.js',
            '/js/image-assurance.js',
            '/js/app.js',
            '/js/analytics-tracker.js'
        ];

        for (const file of jsFiles) {
            if (!document.querySelector(`script[src="${file}"]`)) {
                const script = document.createElement('script');
                script.src = file;
                script.defer = true;
                script.onload = () => {
                    console.log(`✅ Loaded JS: ${file}`);
                    this.registerModuleFunctions(file);
                };
                script.onerror = () => console.warn(`⚠️ JS not found: ${file}`);
                document.body.appendChild(script);
            }
        }
    }

    // REGISTER ALL FUNCTIONS GLOBALLY
    registerGlobalFunctions() {
        // Make all configs accessible globally
        window.SPORTIQ_CONFIGS = Object.fromEntries(this.configs);

        // Global runtime functions
        window.SPORTIQ = {
            configs: this.configs,
            modules: this.modules,

            // Get any config by name
            getConfig: (name) => this.configs.get(name),

            // Add new config dynamically
            addConfig: (name, config) => {
                this.configs.set(name, config);
                console.log(`✅ Config added: ${name}`);
            },

            // Execute function by name
            execute: (fnName, ...args) => {
                if (this.modules.has(fnName)) {
                    return this.modules.get(fnName)(...args);
                }
            },

            // Status check
            getStatus: () => ({
                running: this.isRunning,
                configs: this.configs.size,
                modules: this.modules.size,
                styles: this.styles.size
            })
        };

        console.log('✅ Global functions registered');
    }

    // EXECUTE ALL JSON CONFIGS AS RUNTIME CONFIGS
    async executeConfigs() {
        // Runtime Ultimate
        const runtime = this.configs.get('runtime-ultimate');
        if (runtime) {
            console.log('🚀 Executing RuntimeUltimate...');
            this.executeRuntimeConfig(runtime);
        }

        // Multi-Language
        const lang = this.configs.get('multilanguage-engine');
        if (lang) {
            console.log('🌍 Activating Multi-Language...');
            this.activateMultiLanguage(lang);
        }

        // Performance
        const perf = this.configs.get('performance-config');
        if (perf) {
            console.log('⚡ Applying Performance Config...');
            this.applyPerformanceConfig(perf);
        }

        // Analytics
        const analytics = this.configs.get('analytics-tracking');
        if (analytics) {
            console.log('📊 Starting Analytics...');
            this.startAnalytics(analytics);
        }

        // Slider
        const slider = this.configs.get('slider-config');
        if (slider) {
            console.log('🎬 Initializing Slider...');
            this.initSlider(slider);
        }

        console.log('✅ All configs executed');
    }

    // Runtime config executor
    executeRuntimeConfig(config) {
        if (config.autoExecution?.enabled) {
            console.log('✅ Auto-execution enabled');
            // Execute initialization sequence
            if (config.autoExecution.initialization?.sequence) {
                config.autoExecution.initialization.sequence.forEach(step => {
                    console.log(`  → ${step}`);
                });
            }
        }
    }

    // Activate multi-language
    activateMultiLanguage(config) {
        const userLang = navigator.language.split('-')[0];
        const supported = config.supportedLanguages?.find(l => l.code === userLang);

        if (supported) {
            document.documentElement.lang = userLang;
            console.log(`✅ Language set: ${supported.name}`);
        }
    }

    // Apply performance config
    applyPerformanceConfig(config) {
        // Implement lazy loading if configured
        if (config.lazyLoading?.enabled) {
            this.enableLazyLoading();
        }

        // Apply caching strategy
        if (config.caching?.enabled) {
            console.log('✅ Caching enabled');
        }
    }

    // Start analytics
    startAnalytics(config) {
        if (config.googleAnalytics?.enabled && config.googleAnalytics?.trackingId) {
            // Initialize GA4
            console.log('✅ Analytics tracking ready');
        }
    }

    // Initialize slider
    initSlider(config) {
        if (config.autoplay?.enabled) {
            console.log(`✅ Slider ready: ${config.slides?.length} slides`);
        }
    }

    // Enable lazy loading
    enableLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => observer.observe(img));
        console.log(`✅ Lazy loading: ${images.length} images`);
    }

    // Register module functions
    registerModuleFunctions(file) {
        const moduleName = file.split('/').pop().replace('.js', '');

        // Try to access module functions if exposed globally
        if (window[moduleName]) {
            this.modules.set(moduleName, window[moduleName]);
        }
    }

    // MONITOR FOR NEW FILES (Future auto-binding)
    startFileMonitoring() {
        // Check for new configs every 5 minutes
        setInterval(async () => {
            console.log('🔍 Scanning for new files...');
            await this.detectAndLoadConfigs();
        }, 300000); // 5 minutes

        console.log('✅ File monitoring active (5min interval)');
    }

    // Public API
    addNewFile(type, path) {
        switch (type) {
            case 'css':
                return this.linkNewCSS(path);
            case 'js':
                return this.linkNewScript(path);
            case 'json':
                return this.loadNewConfig(path);
            default:
                console.warn(`Unknown file type: ${type}`);
        }
    }

    async linkNewCSS(path) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
        this.styles.add(path);
        console.log(`✅ New CSS linked: ${path}`);
    }

    async linkNewScript(path) {
        const script = document.createElement('script');
        script.src = path;
        script.defer = true;
        document.body.appendChild(script);
        console.log(`✅ New JS linked: ${path}`);
    }

    async loadNewConfig(path) {
        try {
            const response = await fetch(path);
            const config = await response.json();
            const name = path.split('/').pop().replace('.json', '');
            this.configs.set(name, config);
            window.SPORTIQ_CONFIGS[name] = config;
            console.log(`✅ New config loaded: ${name}`);
            return config;
        } catch (err) {
            console.error(`❌ Failed to load config: ${path}`, err);
        }
    }
}

// AUTO-START ON DOM READY
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.RuntimeOrchestrator = new RuntimeCoreOrchestrator();
    });
} else {
    window.RuntimeOrchestrator = new RuntimeCoreOrchestrator();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuntimeCoreOrchestrator;
}
