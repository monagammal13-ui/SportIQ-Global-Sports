/**
 * Layer 39: Trending Articles & Keywords
 * Standalone runtime for content trends
 */

class Layer39Trending {
    constructor() {
        if (window.__LAYER39__) return window.__LAYER39__;

        this.layerId = 'layer-039';
        this.name = 'Trending Articles';
        this.version = '1.0.0';

        this.trendingItems = [];

        console.log(`[Layer 39 v${this.version}] Initializing Trending...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._calculateTrends();
        this._renderTrendingWidget();
        this._registerWithCoreEngines();
        console.log('[Layer 39] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer39-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                maxItems: 5,
                algorithm: 'views_recent'
            };
        }
    }

    _calculateTrends() {
        if (window.__ANTIGRAVITY_CMS__) {
            const articles = window.__ANTIGRAVITY_CMS__.getArticles();
            // Mock trend calculation
            this.trendingItems = articles
                .map(a => ({ ...a, trendScore: Math.random() * 100 }))
                .sort((a, b) => b.trendScore - a.trendScore)
                .slice(0, this.config.maxItems);
        } else {
            // Fallback for demo
            this.trendingItems = [
                { title: 'Top 10 Plays of the Week', slug: 'top-10-plays', trendScore: 98 },
                { title: 'Championship Preview', slug: 'championship-preview', trendScore: 85 },
                { title: 'Exclusive Interview', slug: 'exclusive-interview', trendScore: 72 }
            ];
        }
    }

    _renderTrendingWidget() {
        const container = document.getElementById('layer39-trending-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer39-widget">
                <h3>🔥 Trending Now</h3>
                <ol class="layer39-list">
                    ${this.trendingItems.map((item, index) => `
                        <li>
                            <a href="/article/${item.slug}">
                                <span class="layer39-rank">${index + 1}</span>
                                <span class="layer39-title">${item.title}</span>
                            </a>
                        </li>
                    `).join('')}
                </ol>
            </div>
        `;
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 39] Connected to Runtime');
            });
        }
    }
}

const layer39 = new Layer39Trending();
window.__LAYER39__ = layer39;
export default layer39;
