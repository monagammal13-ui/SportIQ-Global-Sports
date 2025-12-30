/**
 * Layer 15: Caching & CDN Optimization Runtime
 */
class CacheOptimizationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_CACHE__) return window.__ANTIGRAVITY_CACHE__;
        this.version = '1.0.0';
        this.cache = new Map();
        this._init();
    }

    async _init() {
        this._setupServiceWorker();
        this._setupResourceHints();
        this._optimizeAssets();
    }

    async _setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('../sw.js');
                console.log('[Cache] Service Worker registered');
            } catch (e) {
                console.warn('[Cache] SW registration failed');
            }
        }
    }

    _setupResourceHints() {
        const hints = [
            { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
            { rel: 'preconnect', href: 'https://api.sportsdata.io' }
        ];

        hints.forEach(hint => {
            const link = document.createElement('link');
            link.rel = hint.rel;
            link.href = hint.href;
            document.head.appendChild(link);
        });
    }

    _optimizeAssets() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    set(key, value, ttl = 3600000) {
        this.cache.set(key, { value, expires: Date.now() + ttl });
    }

    get(key) {
        const item = this.cache.get(key);
        if (item && item.expires > Date.now()) return item.value;
        this.cache.delete(key);
        return null;
    }
}

window.__ANTIGRAVITY_CACHE__ = new CacheOptimizationRuntime();
export default window.__ANTIGRAVITY_CACHE__;
