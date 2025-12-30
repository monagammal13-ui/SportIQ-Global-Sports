/**
 * Layer 37: Global News Aggregator (Enhanced)
 * Standalone runtime for fetching and displaying global news
 */

class Layer37News {
    constructor() {
        if (window.__LAYER37__) return window.__LAYER37__;

        this.layerId = 'layer-037';
        this.name = 'News Aggregator Enhanced';
        this.version = '1.0.0';

        this.newsFeed = [];

        console.log(`[Layer 37 v${this.version}] Initializing News Aggregator...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        // Connect to Layer 13 (RSS) if available
        if (window.__ANTIGRAVITY_RSS__) {
            this.rssEngine = window.__ANTIGRAVITY_RSS__;
        }

        await this._fetchNews();
        this._renderNewsWidget();
        this._startAutoUpdate();
        this._registerWithCoreEngines();
        console.log('[Layer 37] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer37-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                refreshInterval: 300000,
                sources: ['ESPN', 'BBC Sport', 'Sky Sports'],
                displayCount: 5
            };
        }
    }

    async _fetchNews() {
        // Here we would fetch from real APIs
        // Using Layer 30 (API Integration) if available
        if (window.__ANTIGRAVITY_API_INTEGRATION__) {
            try {
                const news = await window.__ANTIGRAVITY_API_INTEGRATION__.getNews('sports');
                if (news && news.length) {
                    this.newsFeed = news;
                }
            } catch (e) {
                console.warn('[Layer 37] API fetch failed, using mock data');
                this._loadMockNews();
            }
        } else {
            this._loadMockNews();
        }
    }

    _loadMockNews() {
        this.newsFeed = [
            { title: 'Championship Final Set for Sunday', source: 'Global Sport', time: Date.now() - 3600000 },
            { title: 'Star Player Breaks Record', source: 'Sports Weekly', time: Date.now() - 7200000 },
            { title: 'Transfer Window Updates', source: 'Transfer News', time: Date.now() - 10800000 }
        ];
    }

    _renderNewsWidget() {
        const container = document.getElementById('layer37-news-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer37-widget">
                <div class="layer37-header">
                    <h3>Global Headlines</h3>
                    <button onclick="window.__LAYER37__.refresh()">↻</button>
                </div>
                <div class="layer37-list">
                    ${this.newsFeed.slice(0, this.config.displayCount).map(news => `
                        <div class="layer37-item">
                            <a href="#" class="layer37-link">${news.title}</a>
                            <div class="layer37-meta">
                                <span>${news.source}</span>
                                <span>${this._timeAgo(news.time)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    _timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return 'Yesterday';
    }

    async refresh() {
        await this._fetchNews();
        this._renderNewsWidget();
    }

    _startAutoUpdate() {
        setInterval(() => this.refresh(), this.config.refreshInterval);
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 37] Connected to Runtime');
            });
        }
    }
}

const layer37 = new Layer37News();
window.__LAYER37__ = layer37;
export default layer37;
