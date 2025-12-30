/**
 * Layer 50: Global Top Charts & Rankings
 * Standalone runtime for leaderboards and ranked lists
 */

class Layer50Charts {
    constructor() {
        if (window.__LAYER50__) return window.__LAYER50__;

        this.layerId = 'layer-050';
        this.name = 'Global Top Charts';
        this.version = '1.0.0';

        this.charts = {};

        console.log(`[Layer 50 v${this.version}] Initializing Charts...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._calculateRankings();
        this._renderChartsWidget();
        this._registerWithCoreEngines();
        console.log('[Layer 50] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer50-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                categories: ['Teams', 'Players'],
                topCount: 5
            };
        }
    }

    _calculateRankings() {
        // Mock ranking calculation
        this.charts['Teams'] = [
            { name: 'Team Alpha', points: 2500 },
            { name: 'Team Beta', points: 2350 },
            { name: 'Team Gamma', points: 2100 }
        ];

        this.charts['Players'] = [
            { name: 'Player One', points: 500 },
            { name: 'Player Two', points: 480 },
            { name: 'Player Three', points: 450 }
        ];
    }

    _renderChartsWidget() {
        const container = document.getElementById('layer50-charts-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer50-widget">
                <h3>🏆 Top Rankings</h3>
                ${Object.keys(this.charts).map(category => `
                    <div class="layer50-category">
                        <h4>${category}</h4>
                        <ol>
                            ${this.charts[category].map(item => `
                                <li>${item.name} <span class="layer50-score">${item.points} pts</span></li>
                            `).join('')}
                        </ol>
                    </div>
                `).join('')}
            </div>
        `;
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 50] Connected to Runtime');
            });
        }
    }
}

const layer50 = new Layer50Charts();
window.__LAYER50__ = layer50;
export default layer50;
