/**
 * Runtime_Media_Engine
 * Validates, repairs, and optimizes all media files in real-time
 */

class RuntimeMediaEngine {
    constructor() {
        this.images = new Map();
        this.videos = new Map();
        this.brokenMedia = new Set();
        this.lazyObserver = null;
        this.isActive = false;

        this.fallbacks = {
            image: '/assets/images/placeholder.jpg',
            slider: '/assets/images/slider-fallback.jpg',
            thumbnail: '/assets/images/thumb-placeholder.jpg',
            video: '/assets/videos/placeholder.mp4'
        };

        this.init();
    }

    async init() {
        console.log('🖼️ Runtime Media Engine - STARTING');

        // Validate all existing media
        await this.validateAllMedia();

        // Enable lazy loading
        this.enableLazyLoading();

        // Setup 4K slider support
        this.setup4KSlider();

        // Monitor for new media
        this.startMediaMonitoring();

        this.isActive = true;
        console.log('✅ Runtime Media Engine - ACTIVE');
    }

    // VALIDATE ALL MEDIA
    async validateAllMedia() {
        console.log('🔍 Validating all media...');

        // Validate images
        const images = document.querySelectorAll('img');
        for (const img of images) {
            await this.validateImage(img);
        }

        // Validate videos
        const videos = document.querySelectorAll('video');
        for (const video of videos) {
            await this.validateVideo(video);
        }

        // Validate background images
        await this.validateBackgroundImages();

        console.log(`✅ Validated ${images.length} images, ${videos.length} videos`);
    }

    // VALIDATE SINGLE IMAGE
    async validateImage(img) {
        return new Promise((resolve) => {
            const src = img.src || img.dataset.src;

            if (!src) {
                this.repairImage(img, 'no-source');
                resolve();
                return;
            }

            // Track image
            this.images.set(img, {
                src,
                status: 'checking',
                timestamp: Date.now()
            });

            // Check if already loaded
            if (img.complete && img.naturalWidth > 0) {
                this.images.get(img).status = 'valid';
                console.log(`✅ Valid image: ${this.getShortPath(src)}`);
                resolve();
                return;
            }

            // Test load
            const testImg = new Image();

            testImg.onload = () => {
                this.images.get(img).status = 'valid';
                console.log(`✅ Valid image: ${this.getShortPath(src)}`);
                resolve();
            };

            testImg.onerror = () => {
                console.warn(`⚠️ Broken image: ${this.getShortPath(src)}`);
                this.brokenMedia.add(src);
                this.repairImage(img, 'load-failed');
                resolve();
            };

            testImg.src = src;

            // Timeout after 5 seconds
            setTimeout(() => {
                if (this.images.get(img)?.status === 'checking') {
                    console.warn(`⏱️ Image timeout: ${this.getShortPath(src)}`);
                    this.repairImage(img, 'timeout');
                    resolve();
                }
            }, 5000);
        });
    }

    // REPAIR BROKEN IMAGE
    repairImage(img, reason) {
        console.log(`🔧 Repairing image (${reason})...`);

        // Determine fallback type
        let fallback = this.fallbacks.image;

        if (img.classList.contains('slider-image')) {
            fallback = this.fallbacks.slider;
        } else if (img.classList.contains('thumbnail')) {
            fallback = this.fallbacks.thumbnail;
        }

        // Apply fallback
        img.src = fallback;
        img.alt = img.alt || 'Image placeholder';
        img.classList.add('media-fallback');

        // Update tracking
        if (this.images.has(img)) {
            this.images.get(img).status = 'repaired';
            this.images.get(img).fallback = fallback;
        }

        console.log(`✅ Image repaired with fallback`);
    }

    // VALIDATE VIDEO
    async validateVideo(video) {
        return new Promise((resolve) => {
            const src = video.src || video.querySelector('source')?.src;

            if (!src) {
                this.repairVideo(video, 'no-source');
                resolve();
                return;
            }

            this.videos.set(video, {
                src,
                status: 'checking',
                timestamp: Date.now()
            });

            // Test if video can be loaded
            video.addEventListener('loadedmetadata', () => {
                this.videos.get(video).status = 'valid';
                console.log(`✅ Valid video: ${this.getShortPath(src)}`);
                resolve();
            }, { once: true });

            video.addEventListener('error', () => {
                console.warn(`⚠️ Broken video: ${this.getShortPath(src)}`);
                this.brokenMedia.add(src);
                this.repairVideo(video, 'load-failed');
                resolve();
            }, { once: true });

            // Trigger load
            video.load();

            // Timeout
            setTimeout(() => {
                if (this.videos.get(video)?.status === 'checking') {
                    console.warn(`⏱️ Video timeout: ${this.getShortPath(src)}`);
                    this.repairVideo(video, 'timeout');
                    resolve();
                }
            }, 8000);
        });
    }

    // REPAIR BROKEN VIDEO
    repairVideo(video, reason) {
        console.log(`🔧 Repairing video (${reason})...`);

        // Try to replace with poster image
        if (video.poster) {
            const img = document.createElement('img');
            img.src = video.poster;
            img.alt = 'Video thumbnail';
            img.className = video.className;
            video.parentNode.replaceChild(img, video);
            console.log(`✅ Video replaced with poster image`);
        } else {
            // Hide broken video
            video.style.display = 'none';
            console.log(`✅ Broken video hidden`);
        }

        if (this.videos.has(video)) {
            this.videos.get(video).status = 'repaired';
        }
    }

    // VALIDATE BACKGROUND IMAGES
    async validateBackgroundImages() {
        const elements = document.querySelectorAll('[style*="background-image"]');

        for (const el of elements) {
            const style = window.getComputedStyle(el);
            const bgImage = style.backgroundImage;

            if (bgImage && bgImage !== 'none') {
                const url = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                if (url) {
                    await this.validateBackgroundImage(el, url);
                }
            }
        }

        console.log(`✅ Validated ${elements.length} background images`);
    }

    async validateBackgroundImage(el, url) {
        return new Promise((resolve) => {
            const img = new Image();

            img.onload = () => {
                console.log(`✅ Valid bg: ${this.getShortPath(url)}`);
                resolve();
            };

            img.onerror = () => {
                console.warn(`⚠️ Broken bg: ${this.getShortPath(url)}`);
                this.brokenMedia.add(url);
                el.style.backgroundImage = `url(${this.fallbacks.image})`;
                resolve();
            };

            img.src = url;
        });
    }

    // ENABLE LAZY LOADING
    enableLazyLoading() {
        console.log('📦 Enabling lazy loading...');

        // Modern lazy loading attribute
        const images = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            this.lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadLazyImage(img);
                        this.lazyObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            images.forEach(img => this.lazyObserver.observe(img));
            console.log(`✅ Lazy loading enabled for ${images.length} images`);
        } else {
            // Fallback: load all immediately
            images.forEach(img => this.loadLazyImage(img));
            console.log(`✅ Loaded ${images.length} images (no IO support)`);
        }
    }

    async loadLazyImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Create temp image to test
        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            console.log(`📸 Lazy loaded: ${this.getShortPath(src)}`);
        };

        tempImg.onerror = () => {
            console.warn(`⚠️ Lazy load failed: ${this.getShortPath(src)}`);
            this.repairImage(img, 'lazy-load-failed');
        };

        tempImg.src = src;
    }

    // SETUP 4K SLIDER
    setup4KSlider() {
        console.log('🎬 Setting up 4K slider...');

        // Find slider container
        const slider = document.querySelector('.slider, #slider, [data-slider]');
        if (!slider) {
            console.log('ℹ️ No slider found');
            return;
        }

        // Preload first 3 slider images
        const sliderImages = slider.querySelectorAll('img');
        const toPreload = Array.from(sliderImages).slice(0, 3);

        toPreload.forEach((img, i) => {
            const src = img.dataset.src || img.src;
            if (src) {
                const preloadImg = new Image();
                preloadImg.onload = () => {
                    console.log(`✅ Preloaded slider image ${i + 1}`);
                };
                preloadImg.src = src;
            }
        });

        // Apply 4K optimizations
        slider.style.willChange = 'transform';
        sliderImages.forEach(img => {
            img.style.objectFit = 'cover';
            img.style.width = '100%';
            img.style.height = '100%';
        });

        console.log(`✅ 4K slider ready (${sliderImages.length} slides)`);
    }

    // MONITOR FOR NEW MEDIA
    startMediaMonitoring() {
        console.log('👀 Media monitoring started');

        // Monitor DOM for new images/videos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'IMG') {
                        this.validateImage(node);
                    } else if (node.tagName === 'VIDEO') {
                        this.validateVideo(node);
                    } else if (node.querySelectorAll) {
                        // Check children
                        node.querySelectorAll('img').forEach(img => this.validateImage(img));
                        node.querySelectorAll('video').forEach(video => this.validateVideo(video));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ DOM observer active for new media');
    }

    // UTILITY METHODS
    getShortPath(url) {
        try {
            const path = new URL(url, window.location.origin).pathname;
            const parts = path.split('/');
            return parts[parts.length - 1] || path;
        } catch {
            return url.substring(0, 50) + '...';
        }
    }

    // PUBLIC API
    async validateAllImages() {
        const images = document.querySelectorAll('img');
        for (const img of images) {
            await this.validateImage(img);
        }
    }

    async validateAllVideos() {
        const videos = document.querySelectorAll('video');
        for (const video of videos) {
            await this.validateVideo(video);
        }
    }

    repairAllBroken() {
        document.querySelectorAll('img').forEach(img => {
            if (!img.complete || img.naturalWidth === 0) {
                this.repairImage(img, 'force-repair');
            }
        });
    }

    getBrokenMedia() {
        return Array.from(this.brokenMedia);
    }

    getStatus() {
        return {
            active: this.isActive,
            totalImages: this.images.size,
            totalVideos: this.videos.size,
            brokenMedia: this.brokenMedia.size,
            validImages: Array.from(this.images.values()).filter(i => i.status === 'valid').length,
            repairedImages: Array.from(this.images.values()).filter(i => i.status === 'repaired').length
        };
    }

    // Enable/disable lazy loading
    enableLazyLoadForNewImages() {
        if (this.lazyObserver) {
            document.querySelectorAll('img[data-src]:not(.loaded)').forEach(img => {
                this.lazyObserver.observe(img);
            });
        }
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.RuntimeMedia = new RuntimeMediaEngine();
    });
} else {
    window.RuntimeMedia = new RuntimeMediaEngine();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuntimeMediaEngine;
}
