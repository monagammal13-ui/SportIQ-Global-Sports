/**
 * Layer 47: Global Market Data Feed
 * Standalone runtime for financial/betting market data
 */

class Layer47MarketData {
    constructor() {
        if (window.__LAYER47__) return window.__LAYER47__;

        this.layerId = 'layer-047';
        this.name = 'Global Market Data';
        this.version = '1.0.0';

        this.marketData = [];

        console.log(`[Layer 47 v${this.version}] Initializing Market Data...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        await this.refreshMarketData();
        this._registerWithCoreEngines();
        console.log('[Layer 47] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer47-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                markets: ['Moneyline', 'Spread', 'Over/Under'],
                currency: 'USD'
            };
        }
    }

    async refreshMarketData() {
        // Mock fetch - would usually hit an API (Layer 30)
        this.marketData = [
            { event: 'Lakers vs Warriors', market: 'Moneyline', outcome: 'Lakers -150', time: Date.now() },
            { event: 'Chiefs vs Bills', market: 'Spread', outcome: 'Chiefs -2.5', time: Date.now() },
            { event: 'Man City vs Liverpool', market: 'Draw', outcome: '+240', time: Date.now() }
        ];

        this._renderMarketWidget();
        this._emitEvent('layer47:data-updated', {});
    }

    _renderMarketWidget() {
        const container = document.getElementById('layer47-market-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer47-widget">
                <h3>📈 Market Movers</h3>
                <div class="layer47-list">
                    ${this.marketData.map(d => `
                        <div class="layer47-item">
                            <span class="layer47-event">${d.event}</span>
                            <span class="layer47-outcome">${d.outcome}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 47] Connected to Runtime');
            });
        }
    }
}

const layer47 = new Layer47MarketData();
window.__LAYER47__ = layer47;
export default layer47;
