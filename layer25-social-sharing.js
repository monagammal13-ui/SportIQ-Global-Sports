/**
 * Layer 25: Social Media Integration & Sharing Runtime
 */
class SocialSharingRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_SOCIAL__) return window.__ANTIGRAVITY_SOCIAL__;
        this.version = '1.0.0';
        this.shareCount = {};
        this._init();
    }

    async _init() {
        this._setupShareButtons();
    }

    share(platform, url, title) {
        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
            this._trackShare(platform);
        }
    }

    _setupShareButtons() {
        document.querySelectorAll('[data-share]').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.share;
                const url = btn.dataset.url || window.location.href;
                const title = btn.dataset.title || document.title;
                this.share(platform, url, title);
            });
        });
    }

    _trackShare(platform) {
        this.shareCount[platform] = (this.shareCount[platform] || 0) + 1;
        localStorage.setItem('share_count', JSON.stringify(this.shareCount));
    }

    getShareCount() {
        return this.shareCount;
    }
}

window.__ANTIGRAVITY_SOCIAL__ = new SocialSharingRuntime();
export default window.__ANTIGRAVITY_SOCIAL__;
