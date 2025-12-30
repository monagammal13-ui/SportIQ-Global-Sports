/**
 * Layer 36: Analytics & Metrics Core (Enhanced)
 * Standalone runtime for detailed tracking and metrics
 */

class Layer36Analytics {
    constructor() {
        if (window.__LAYER36__) return window.__LAYER36__;

        this.layerId = 'layer-036';
        this.name = 'Analytics Enhanced';
        this.version = '1.0.0';

        this.sessionStart = Date.now();
        this.events = [];

        console.log(`[Layer 36 v${this.version}] Initializing Analytics...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        // Connect to Layer 26 (Base Analytics) if available
        if (window.__ANTIGRAVITY_ANALYTICS_GROWTH__) {
            this.baseAnalytics = window.__ANTIGRAVITY_ANALYTICS_GROWTH__;
        }

        this._setupTracking();
        this._registerWithCoreEngines();
        console.log('[Layer 36] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer36-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                sampleRate: 100,
                trackClicks: true,
                trackScroll: true
            };
        }
    }

    _setupTracking() {
        // Track Clicks
        if (this.config.trackClicks) {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button');
                if (target) {
                    this.trackEvent('click', {
                        tag: target.tagName,
                        id: target.id,
                        class: target.className,
                        text: target.innerText.substring(0, 50)
                    });
                }
            });
        }

        // Track Scroll Depth
        if (this.config.trackScroll) {
            let maxScroll = 0;
            window.addEventListener('scroll', () => {
                const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
                if (scrollPercent > maxScroll) {
                    maxScroll = scrollPercent;
                    if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                        this.trackEvent('scroll_depth', { depth: maxScroll });
                    }
                }
            });
        }
    }

    trackEvent(name, data = {}) {
        const event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name,
            data,
            timestamp: Date.now(),
            url: window.location.pathname
        };

        this.events.push(event);

        // Forward to Layer 26 if available
        if (this.baseAnalytics && this.baseAnalytics.trackEvent) {
            this.baseAnalytics.trackEvent(name, data);
        }

        console.log(`[Analytics] ${name}`, data);
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                this.trackEvent('session_start', { referrer: document.referrer });
            });
        }
    }
}

const layer36 = new Layer36Analytics();
window.__LAYER36__ = layer36;
export default layer36;
