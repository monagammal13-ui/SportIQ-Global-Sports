/**
 * Layer 6: Media & Assets Runtime
 * ID: layer-006
 * Type: Core
 * Description: Lazy loading, responsive media management, and dynamic asset injection system.
 */

class MediaAssetsRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_MEDIA__) {
            console.warn('[MediaAssets] Media runtime already initialized.');
            return window.__ANTIGRAVITY_MEDIA__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-006';
        this.name = 'Media & Assets Runtime';
        this.timestamp = new Date().toISOString();

        // State
        this.mediaConfig = null;
        this.loadedImages = new Set();
        this.loadedVideos = new Set();
        this.observer = null;

        // Performance metrics
        this.metrics = {
            totalImages: 0,
            loadedImages: 0,
            totalVideos: 0,
            loadedVideos: 0,
            bytesLoaded: 0
        };

        console.log(`[MediaAssets v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize media runtime
     */
    async _init() {
        try {
            await this._loadConfig();

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._setupMedia());
            } else {
                this._setupMedia();
            }

            this._registerEvents();
            console.log('[MediaAssets] Initialized successfully');
        } catch (error) {
            console.error('[MediaAssets] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'media:init');
            }
        }
    }

    /**
     * Load media configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/media-config.json');
            if (response.ok) {
                this.mediaConfig = await response.json();
                console.log('[MediaAssets] Configuration loaded');
            } else {
                this.mediaConfig = this._getDefaultConfig();
            }
        } catch (error) {
            console.warn('[MediaAssets] Using default configuration:', error);
            this.mediaConfig = this._getDefaultConfig();
        }
    }

    /**
     * Get default configuration
     */
    _getDefaultConfig() {
        return {
            lazyLoading: {
                enabled: true,
                rootMargin: '50px',
                threshold: 0.01
            },
            images: {
                quality: 85,
                formats: ['webp', 'jpg', 'png'],
                responsive: true,
                placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ELoading...%3C/text%3E%3C/svg%3E'
            },
            videos: {
                autoplay: false,
                muted: true,
                controls: true,
                preload: 'metadata'
            },
            cdn: {
                enabled: false,
                baseUrl: ''
            },
            fallback: {
                image: '/assets/images/placeholder.jpg',
                video: '/assets/videos/placeholder.mp4'
            }
        };
    }

    /**
     * Setup media system
     */
    _setupMedia() {
        // Setup lazy loading with Intersection Observer
        if ('IntersectionObserver' in window && this.mediaConfig.lazyLoading.enabled) {
            this._setupLazyLoading();
        } else {
            // Fallback: load all images immediately
            this._loadAllMedia();
        }

        // Setup responsive images
        if (this.mediaConfig.images.responsive) {
            this._setupResponsiveImages();
        }

        // Setup video handling
        this._setupVideos();

        // Setup hover effects
        this._setupHoverEffects();
    }

    /**
     * Setup lazy loading with Intersection Observer
     */
    _setupLazyLoading() {
        const config = this.mediaConfig.lazyLoading;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;

                    if (element.tagName === 'IMG') {
                        this._loadImage(element);
                    } else if (element.tagName === 'VIDEO') {
                        this._loadVideo(element);
                    }

                    this.observer.unobserve(element);
                }
            });
        }, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Observe all lazy-loadable elements
        this._observeLazyElements();
    }

    /**
     * Observe all elements that should be lazy loaded
     */
    _observeLazyElements() {
        // Images with data-src
        const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        lazyImages.forEach(img => {
            this.metrics.totalImages++;
            this.observer.observe(img);
        });

        // Videos with data-src
        const lazyVideos = document.querySelectorAll('video[data-src]');
        lazyVideos.forEach(video => {
            this.metrics.totalVideos++;
            this.observer.observe(video);
        });

        // Emit event
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit('media:observed', {
                images: lazyImages.length,
                videos: lazyVideos.length
            });
        }
    }

    /**
     * Load an image
     */
    _loadImage(img) {
        const src = img.dataset.src || img.src;

        if (!src || this.loadedImages.has(src)) return;

        // Create a new image to preload
        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.classList.remove('loading');
            this.loadedImages.add(src);
            this.metrics.loadedImages++;

            // Emit event
            if (window.__ANTIGRAVITY_EVENT_BUS__) {
                window.__ANTIGRAVITY_EVENT_BUS__.emit('media:image-loaded', { src });
            }
        };

        tempImg.onerror = () => {
            console.error('[MediaAssets] Failed to load image:', src);
            if (this.mediaConfig.fallback.image) {
                img.src = this.mediaConfig.fallback.image;
            }
            img.classList.add('error');
            img.classList.remove('loading');
        };

        img.classList.add('loading');
        tempImg.src = src;
    }

    /**
     * Load a video
     */
    _loadVideo(video) {
        const src = video.dataset.src;

        if (!src || this.loadedVideos.has(src)) return;

        video.src = src;
        video.classList.add('loaded');
        this.loadedVideos.add(src);
        this.metrics.loadedVideos++;

        // Emit event
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit('media:video-loaded', { src });
        }
    }

    /**
     * Load all media (fallback)
     */
    _loadAllMedia() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this._loadImage(img));

        const videos = document.querySelectorAll('video[data-src]');
        videos.forEach(video => this._loadVideo(video));
    }

    /**
     * Setup responsive images with srcset
     */
    _setupResponsiveImages() {
        const images = document.querySelectorAll('img[data-srcset]');

        images.forEach(img => {
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
            }
        });
    }

    /**
     * Setup video handling
     */
    _setupVideos() {
        const videos = document.querySelectorAll('video');

        videos.forEach(video => {
            // Apply default settings
            if (this.mediaConfig.videos.controls) {
                video.controls = true;
            }
            if (this.mediaConfig.videos.muted) {
                video.muted = true;
            }
            video.preload = this.mediaConfig.videos.preload;

            // Pause other videos when one starts playing
            video.addEventListener('play', () => {
                this._pauseOtherVideos(video);
            });
        });
    }

    /**
     * Pause all videos except the currently playing one
     */
    _pauseOtherVideos(currentVideo) {
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            if (video !== currentVideo && !video.paused) {
                video.pause();
            }
        });
    }

    /**
     * Setup hover effects for images
     */
    _setupHoverEffects() {
        const hoverImages = document.querySelectorAll('[data-hover-effect]');

        hoverImages.forEach(img => {
            const effect = img.dataset.hoverEffect;

            img.addEventListener('mouseenter', () => {
                img.classList.add(`hover-${effect}`);
            });

            img.addEventListener('mouseleave', () => {
                img.classList.remove(`hover-${effect}`);
            });
        });
    }

    /**
     * Inject media from configuration
     */
    injectMedia(containerId, mediaItems) {
        const container = document.getElementById(containerId);
        if (!container || !mediaItems) return;

        mediaItems.forEach(item => {
            const element = this._createMediaElement(item);
            if (element) {
                container.appendChild(element);

                // Observe if lazy loading is enabled
                if (this.observer) {
                    this.observer.observe(element);
                }
            }
        });
    }

    /**
     * Create media element from configuration
     */
    _createMediaElement(config) {
        if (config.type === 'image') {
            const img = document.createElement('img');
            img.dataset.src = config.src;
            img.alt = config.alt || '';
            if (config.class) img.className = config.class;
            if (config.srcset) img.dataset.srcset = config.srcset;
            return img;
        } else if (config.type === 'video') {
            const video = document.createElement('video');
            video.dataset.src = config.src;
            if (config.class) video.className = config.class;
            if (config.poster) video.poster = config.poster;
            return video;
        }
        return null;
    }

    /**
     * Register event bus listeners
     */
    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Listen for dynamic media injection requests
        eventBus.on('media:inject', (data) => {
            if (data.container && data.items) {
                this.injectMedia(data.container, data.items);
            }
        });

        // Listen for media reload request
        eventBus.on('media:reload', () => {
            this._observeLazyElements();
        });
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            loadProgress: this.metrics.totalImages > 0
                ? Math.round((this.metrics.loadedImages / this.metrics.totalImages) * 100)
                : 100
        };
    }

    /**
     * Preload specific images
     */
    preloadImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        console.log('[MediaAssets] Destroyed');
    }
}

// Initialize and Export
const mediaAssets = new MediaAssetsRuntime();
window.__ANTIGRAVITY_MEDIA__ = mediaAssets;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[MediaAssets] Registered with runtime');
    });
}

export default mediaAssets;
