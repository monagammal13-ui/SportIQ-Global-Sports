/**
 * Image Assurance System
 * Ensures all images load perfectly with fallbacks and verification
 */

class ImageAssurance {
    constructor(config = {}) {
        this.config = {
            retryAttempts: 3,
            retryDelay: 1000,
            fallbackEnabled: true,
            lazyLoad: true,
            qualityCheck: true,
            ...config
        };

        this.imageCache = new Map();
        this.failedImages = new Set();
        this.init();
    }

    init() {
        this.setupImageObserver();
        this.verifyAllImages();
        this.setupErrorHandlers();
    }

    // Setup Intersection Observer for lazy loading
    setupImageObserver() {
        if (!this.config.lazyLoad) return;

        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe all images with data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observer.observe(img);
        });
    }

    // Load image with fallback
    async loadImage(imgElement) {
        const src = imgElement.dataset.src || imgElement.src;
        const fallback = imgElement.dataset.fallback;

        try {
            await this.verifyImage(src);
            imgElement.src = src;
            imgElement.classList.add('loaded');
            this.imageCache.set(src, true);
        } catch (error) {
            console.warn(`Failed to load image: ${src}`);
            if (fallback) {
                await this.loadFallback(imgElement, fallback);
            } else {
                this.applyPlaceholder(imgElement);
            }
        }
    }

    // Verify image can be loaded
    verifyImage(src, attempt = 1) {
        return new Promise((resolve, reject) => {
            // Check cache first
            if (this.imageCache.has(src)) {
                resolve(src);
                return;
            }

            const img = new Image();
            const timeout = setTimeout(() => {
                reject(new Error('Image load timeout'));
            }, 10000);

            img.onload = () => {
                clearTimeout(timeout);
                // Verify image has valid dimensions
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    this.imageCache.set(src, true);
                    resolve(src);
                } else {
                    reject(new Error('Invalid image dimensions'));
                }
            };

            img.onerror = () => {
                clearTimeout(timeout);
                if (attempt < this.config.retryAttempts) {
                    setTimeout(() => {
                        this.verifyImage(src, attempt + 1)
                            .then(resolve)
                            .catch(reject);
                    }, this.config.retryDelay * attempt);
                } else {
                    this.failedImages.add(src);
                    reject(new Error('Image load failed'));
                }
            };

            img.src = src;
        });
    }

    // Load fallback image
    async loadFallback(imgElement, fallbackSrc) {
        try {
            await this.verifyImage(fallbackSrc);
            imgElement.src = fallbackSrc;
            imgElement.classList.add('fallback-loaded');
        } catch (error) {
            console.error(`Fallback also failed: ${fallbackSrc}`);
            this.applyPlaceholder(imgElement);
        }
    }

    // Apply placeholder for failed images
    applyPlaceholder(imgElement) {
        const width = imgElement.width || 1920;
        const height = imgElement.height || 1080;
        const category = imgElement.dataset.category || 'sports';

        // Use placeholder service
        const placeholder = `https://via.placeholder.com/${width}x${height}/0066cc/ffffff?text=${encodeURIComponent(category)}`;
        imgElement.src = placeholder;
        imgElement.classList.add('placeholder');
    }

    // Verify all images on page
    async verifyAllImages() {
        const images = document.querySelectorAll('img[src], img[data-src]');
        const verificationPromises = [];

        images.forEach(img => {
            const src = img.dataset.src || img.src;
            if (src && !src.startsWith('data:')) {
                verificationPromises.push(
                    this.verifyImage(src).catch(() => {
                        console.warn(`Initial verification failed: ${src}`);
                    })
                );
            }
        });

        await Promise.allSettled(verificationPromises);
        console.log(`Verified ${this.imageCache.size} images`);
    }

    // Setup global error handlers
    setupErrorHandlers() {
        // Handle all image errors
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    // Handle individual image errors
    async handleImageError(imgElement) {
        if (imgElement.classList.contains('error-handled')) return;

        imgElement.classList.add('error-handled');
        const fallback = imgElement.dataset.fallback;

        if (fallback && imgElement.src !== fallback) {
            await this.loadFallback(imgElement, fallback);
        } else {
            this.applyPlaceholder(imgElement);
        }
    }

    // Preload critical images
    async preloadImages(imageUrls) {
        const promises = imageUrls.map(url => this.verifyImage(url));
        return Promise.allSettled(promises);
    }

    // Get failed images report
    getFailedImages() {
        return Array.from(this.failedImages);
    }

    // Clear cache
    clearCache() {
        this.imageCache.clear();
        this.failedImages.clear();
    }
}

// Slider Image Manager - Specific for cinematic slider
class SliderImageManager extends ImageAssurance {
    constructor(sliderConfig) {
        super({
            retryAttempts: 3,
            retryDelay: 2000,
            fallbackEnabled: true,
            lazyLoad: false // Preload slider images
        });

        this.sliderConfig = sliderConfig;
        this.initSliderImages();
    }

    async initSliderImages() {
        // Preload featured/priority images
        const priorityImages = this.sliderConfig.slides
            .filter(slide => slide.featured)
            .map(slide => slide.image);

        console.log('Preloading priority slider images...');
        await this.preloadImages(priorityImages);

        // Lazy preload remaining images
        setTimeout(() => {
            const remainingImages = this.sliderConfig.slides
                .filter(slide => !slide.featured)
                .map(slide => slide.image);
            this.preloadImages(remainingImages);
        }, 2000);
    }

    // Get image with fallback
    getSlideImage(slideIndex) {
        const slide = this.sliderConfig.slides[slideIndex];
        if (!slide) return null;

        // Return cached or fallback
        if (this.failedImages.has(slide.image)) {
            return this.getFallbackForSlide(slide);
        }

        return slide.image;
    }

    // Get fallback image for slide
    getFallbackForSlide(slide) {
        const category = slide.category || 'sports';
        const fallbacks = {
            'football': '/assets/images/fallbacks/football-stadium.jpg',
            'basketball': '/assets/images/fallbacks/basketball-court.jpg',
            'tennis': '/assets/images/fallbacks/tennis-court.jpg',
            'cricket': '/assets/images/fallbacks/cricket-field.jpg',
            'multi-sport': '/assets/images/fallbacks/stadium-generic.jpg'
        };

        return fallbacks[category] || fallbacks['multi-sport'];
    }

    // Verify all slider images before initializing
    async verifySliderImages() {
        const allImages = this.sliderConfig.slides.map(slide => slide.image);
        const results = await Promise.allSettled(
            allImages.map(img => this.verifyImage(img))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Slider images verified: ${successCount}/${allImages.length}`);

        return {
            total: allImages.length,
            success: successCount,
            failed: allImages.length - successCount,
            failedImages: this.getFailedImages()
        };
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global image assurance
    window.imageAssurance = new ImageAssurance({
        retryAttempts: 3,
        retryDelay: 1000,
        fallbackEnabled: true,
        lazyLoad: true
    });

    // If slider config is available, initialize slider image manager
    if (window.sliderConfig) {
        window.sliderImageManager = new SliderImageManager(window.sliderConfig);

        // Verify all slider images
        const report = await window.sliderImageManager.verifySliderImages();
        console.log('Slider Image Report:', report);

        // Alert if too many images failed
        if (report.failed > 5) {
            console.warn(`Warning: ${report.failed} slider images failed to load`);
        }
    }
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageAssurance, SliderImageManager };
}
