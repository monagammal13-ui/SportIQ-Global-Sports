/**
 * Layer 41: High-Demand Image Gallery
 * Standalone runtime for lazy loading, trending images, and gallery management
 */

class Layer41ImageGallery {
    constructor() {
        if (window.__LAYER41__) return window.__LAYER41__;

        this.layerId = 'layer-041';
        this.name = 'High-Demand Image Gallery';
        this.version = '1.0.0';

        this.galleries = new Map();

        console.log(`[Layer 41 v${this.version}] Initializing Image Gallery...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._setupLazyLoading();
        this._startAutoUpdate();
        this._registerWithCoreEngines();
        console.log('[Layer 41] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer41-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                lazyLoad: true,
                autoUpdate: true,
                refreshInterval: 600000,
                sources: ['internal', 'external']
            };
        }
    }

    _setupLazyLoading() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                        obs.unobserve(img);
                        this._emitEvent('layer41:image-loaded', { src });
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));

        // Listen for DOM changes to attach new observers
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.on('dom:updated', () => {
                document.querySelectorAll('img[data-src]:not(.loaded)').forEach(img => observer.observe(img));
            });
        }
    }

    _startAutoUpdate() {
        if (!this.config.autoUpdate) return;

        setInterval(() => {
            this._fetchTrendingImages();
        }, this.config.refreshInterval);
    }

    async _fetchTrendingImages() {
        // Mock fetch - typically connects to Layer 33 or External API
        console.log('[Layer 41] Refreshing trending images...');
        // Updates DOM elements marked as dynamic
    }

    createGallery(containerId, images) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const galleryId = `gallery_${Date.now()}`;
        this.galleries.set(galleryId, images);

        container.innerHTML = `
            <div class="layer41-grid" id="${galleryId}">
                ${images.map(img => `
                    <div class="layer41-item">
                        <img class="layer41-img" data-src="${img.url}" alt="${img.alt || ''}">
                        <div class="layer41-caption">${img.caption || ''}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Re-run lazy loader on new elements
        this._setupLazyLoading();
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 41] Connected to Runtime');
            });
        }
    }
}

const layer41 = new Layer41ImageGallery();
window.__LAYER41__ = layer41;
export default layer41;
