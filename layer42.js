/**
 * Layer 42: Social Signals & Engagement
 * Standalone runtime for social interactions, sharing, and metrics
 */

class Layer42Social {
    constructor() {
        if (window.__LAYER42__) return window.__LAYER42__;

        this.layerId = 'layer-042';
        this.name = 'Social Signals & Engagement';
        this.version = '1.0.0';

        this.metrics = {};

        console.log(`[Layer 42 v${this.version}] Initializing Social Signals...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._renderShareButtons();
        this._setupTracking();
        this._registerWithCoreEngines();
        console.log('[Layer 42] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer42-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                platforms: ['twitter', 'facebook', 'linkedin', 'whatsapp'],
                trackEngagement: true
            };
        }
    }

    _renderShareButtons() {
        const containers = document.querySelectorAll('[data-layer42-share]');
        containers.forEach(container => {
            const url = container.dataset.url || window.location.href;
            const title = container.dataset.title || document.title;

            container.innerHTML = `
                <div class="layer42-share-bar">
                    ${this.config.platforms.map(p => this._getShareButton(p, url, title)).join('')}
                </div>
            `;
        });
    }

    _getShareButton(platform, url, title) {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        let shareLink = '#';
        let icon = '';

        switch (platform) {
            case 'twitter':
                shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                icon = '𝕏';
                break;
            case 'facebook':
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                icon = 'f';
                break;
            case 'linkedin':
                shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
                icon = 'in';
                break;
            case 'whatsapp':
                shareLink = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
                icon = '💬';
                break;
        }

        return `
            <a href="${shareLink}" target="_blank" class="layer42-btn layer42-${platform}" 
               onclick="window.__LAYER42__.trackShare('${platform}')">
               ${icon}
            </a>
        `;
    }

    trackShare(platform) {
        this._emitEvent('layer42:share', { platform, url: window.location.href });

        // Sync with Layer 36 Analytics if available
        if (window.__LAYER36__) {
            window.__LAYER36__.trackEvent('social_share', { platform });
        }
    }

    _setupTracking() {
        if (!this.config.trackEngagement) return;

        // Time on page tracking (simple engagement metric)
        let timeOnPage = 0;
        setInterval(() => {
            timeOnPage += 10;
            if (timeOnPage % 30 === 0) { // Every 30s
                this._emitEvent('layer42:engagement-ping', { timeOnPage });
            }
        }, 10000);
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 42] Connected to Runtime');
            });
        }
    }
}

const layer42 = new Layer42Social();
window.__LAYER42__ = layer42;
export default layer42;
