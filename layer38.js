/**
 * Layer 38: Live Sports Results Engine (Enhanced)
 * Standalone runtime for real-time sports scores
 */

class Layer38LiveSports {
    constructor() {
        if (window.__LAYER38__) return window.__LAYER38__;

        this.layerId = 'layer-038';
        this.name = 'Live Sports Enhanced';
        this.version = '1.0.0';

        this.scores = [];

        console.log(`[Layer 38 v${this.version}] Initializing Live Scores...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        // Connect to Layer 29 (Live Scores Aggregator) if available
        if (window.__ANTIGRAVITY_LIVE_SCORES__) {
            this.baseScores = window.__ANTIGRAVITY_LIVE_SCORES__;
        }

        await this._fetchMethod();
        this._renderScoreboard();
        this._startAutoRefresh();
        this._registerWithCoreEngines();
        console.log('[Layer 38] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer38-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                refreshInterval: 30000, // 30s
                featuredLeagues: ['Premier League', 'NBA', 'NFL', 'ATP']
            };
        }
    }

    async _fetchMethod() {
        // Use Layer 29 if available, else mock
        if (this.baseScores && this.baseScores.getLiveMatches) {
            this.scores = this.baseScores.getLiveMatches();
        } else {
            this._loadMockScores();
        }
    }

    _loadMockScores() {
        this.scores = [
            { home: 'Lakers', away: 'Warriors', score: '102-98', status: 'Q4 2:30', league: 'NBA' },
            { home: 'Man City', away: 'Liverpool', score: '2-2', status: 'FT', league: 'Premier League' },
            { home: 'Chiefs', away: 'Bills', score: '24-21', status: 'Live', league: 'NFL' }
        ];
    }

    _renderScoreboard() {
        const container = document.getElementById('layer38-scoreboard-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer38-ticker-wrap">
                <div class="layer38-ticker">
                    ${this.scores.map(match => `
                        <div class="layer38-match">
                            <span class="layer38-league">${match.league}</span>
                            <span class="layer38-teams">${match.home} vs ${match.away}</span>
                            <span class="layer38-score">${match.score}</span>
                            <span class="layer38-status ${match.status === 'Live' ? 'live' : ''}">${match.status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    _startAutoRefresh() {
        setInterval(async () => {
            await this._fetchMethod();
            this._renderScoreboard();
        }, this.config.refreshInterval);
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 38] Connected to Runtime');
            });
        }
    }
}

const layer38 = new Layer38LiveSports();
window.__LAYER38__ = layer38;
export default layer38;
