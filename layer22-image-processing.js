/**
 * Layer 22: Image Processing & Optimization Runtime
 */
class ImageProcessingRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_IMAGES__) return window.__ANTIGRAVITY_IMAGES__;
        this.version = '1.0.0';
        this._init();
    }

    async _init() {
        this._setupLazyLoad();
        this._optimizeImages();
    }

    async optimize(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxWidth = 1920;
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    _setupLazyLoad() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        observer.unobserve(img);
                    }
                }
            });
        });
        document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
    }

    _optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            if (!img.loading) img.loading = 'lazy';
        });
    }
}

window.__ANTIGRAVITY_IMAGES__ = new ImageProcessingRuntime();
export default window.__ANTIGRAVITY_IMAGES__;
