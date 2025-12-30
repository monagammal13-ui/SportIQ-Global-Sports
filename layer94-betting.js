/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 94: BETTING & ODDS INTEGRATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Live odds integration, betting calculator, bookmaker comparisons
 * Features: Odds conversion (Decimal/Fractional/American), live updates, slips
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        betting: {
            configPath: '../api-json/betting-config.json',
            updateInterval: 5000, // 5 seconds
            defaultFormat: 'decimal', // decimal, fractional, american
            currency: 'USD'
        },
        events: {
            oddsUpdated: 'betting:odds-updated',
            slipUpdated: 'betting:slip-updated',
            formatChanged: 'betting:format-changed'
        }
    };

    const state = {
        markets: new Map(),
        betSlip: [],
        config: null,
        format: 'decimal',
        timer: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ODDS MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const OddsManager = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.betting.configPath);
                if (response.ok) {
                    state.config = await response.json();
                    state.format = state.config.settings?.defaultFormat || CONFIG.betting.defaultFormat;

                    if (state.config.markets) {
                        this.processMarkets(state.config.markets);
                    }
                }
            } catch (error) {
                console.warn('⚠️ [Betting] Failed to load config');
            }

            this.startAutoUpdate();
            console.log('🎰 [Betting] Engine initialized');
        },

        processMarkets: function (markets) {
            markets.forEach(market => {
                state.markets.set(market.id, {
                    ...market,
                    lastUpdate: Date.now(),
                    trend: 'stable' // up, down, stable
                });
            });

            const event = new CustomEvent(CONFIG.events.oddsUpdated, {
                detail: { count: state.markets.size, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        getOdds: function (marketId, format = state.format) {
            const market = state.markets.get(marketId);
            if (!market) return null;

            return {
                ...market,
                displayOdds: {
                    home: this.convertOdds(market.odds.home, format),
                    draw: this.convertOdds(market.odds.draw, format),
                    away: this.convertOdds(market.odds.away, format)
                }
            };
        },

        convertOdds: function (decimal, format) {
            if (format === 'decimal') return decimal.toFixed(2);

            if (format === 'fractional') {
                // Simplified fractional conversion
                const gcd = (a, b) => b ? gcd(b, a % b) : a;
                const top = Math.round((decimal - 1) * 100);
                const bottom = 100;
                const divisor = gcd(top, bottom);
                return `${top / divisor}/${bottom / divisor}`;
            }

            if (format === 'american') {
                if (decimal >= 2.0) {
                    return `+${Math.round((decimal - 1) * 100)}`;
                } else {
                    return `-${Math.round(100 / (decimal - 1))}`;
                }
            }

            return decimal.toFixed(2);
        },

        setFormat: function (format) {
            state.format = format;
            const event = new CustomEvent(CONFIG.events.formatChanged, {
                detail: { format, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        startAutoUpdate: function () {
            state.timer = setInterval(() => {
                this.simulateOddsChanges();
            }, CONFIG.betting.updateInterval);
        },

        simulateOddsChanges: function () {
            state.markets.forEach(market => {
                if (Math.random() > 0.7) { // 30% chance to change
                    const change = (Math.random() - 0.5) * 0.2;
                    const oldHome = market.odds.home;

                    market.odds.home = Math.max(1.01, market.odds.home + change);
                    market.odds.away = Math.max(1.01, market.odds.away - change);

                    market.trend = market.odds.home > oldHome ? 'up' : 'down';
                    market.lastUpdate = Date.now();
                } else {
                    market.trend = 'stable';
                }
            });

            const event = new CustomEvent(CONFIG.events.oddsUpdated, {
                detail: { count: state.markets.size, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BET SLIP MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const BetSlipManager = {
        addBet: function (bet) {
            // Check if already in slip
            const exists = state.betSlip.find(b => b.id === bet.id && b.selection === bet.selection);
            if (exists) return;

            state.betSlip.push({
                ...bet,
                timestamp: Date.now()
            });

            this.notifyUpdate();
            console.log('🎫 [BetSlip] Added bet:', bet.selection);
        },

        removeBet: function (betId, selection) {
            state.betSlip = state.betSlip.filter(b => !(b.id === betId && b.selection === selection));
            this.notifyUpdate();
        },

        clearSlip: function () {
            state.betSlip = [];
            this.notifyUpdate();
        },

        calculatePotentialWin: function (stake) {
            if (state.betSlip.length === 0) return 0;

            // Assuming accumulator for multiple bets
            const totalOdds = state.betSlip.reduce((acc, bet) => acc * bet.odds, 1);
            return (stake * totalOdds).toFixed(2);
        },

        notifyUpdate: function () {
            const event = new CustomEvent(CONFIG.events.slipUpdated, {
                detail: {
                    count: state.betSlip.length,
                    slip: state.betSlip,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const BettingRenderer = {
        renderOddsCard: function (containerId, marketId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const data = OddsManager.getOdds(marketId);
            if (!data) return;

            const trendIcon = data.trend === 'up' ? '↗' : (data.trend === 'down' ? '↘' : '');
            const trendClass = data.trend === 'up' ? 'trend-up' : (data.trend === 'down' ? 'trend-down' : '');

            container.innerHTML = `
                <div class="odds-card ${trendClass}">
                    <div class="odds-header">
                        <span class="odds-market">${data.eventName}</span>
                        <span class="odds-trend">${trendIcon}</span>
                    </div>
                    <div class="odds-grid">
                        <button class="odds-btn" onclick="window.BettingSystem.addToSlip('${data.id}', 'home', ${data.odds.home})">
                            <span class="odds-label">1</span>
                            <span class="odds-value">${data.displayOdds.home}</span>
                        </button>
                        <button class="odds-btn" onclick="window.BettingSystem.addToSlip('${data.id}', 'draw', ${data.odds.draw})">
                            <span class="odds-label">X</span>
                            <span class="odds-value">${data.displayOdds.draw}</span>
                        </button>
                        <button class="odds-btn" onclick="window.BettingSystem.addToSlip('${data.id}', 'away', ${data.odds.away})">
                            <span class="odds-label">2</span>
                            <span class="odds-value">${data.displayOdds.away}</span>
                        </button>
                    </div>
                </div>
            `;
        },

        renderBetSlip: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (state.betSlip.length === 0) {
                container.innerHTML = '<div class="empty-slip">Your bet slip is empty</div>';
                return;
            }

            const totalOdds = state.betSlip.reduce((acc, bet) => acc * bet.odds, 1).toFixed(2);

            container.innerHTML = `
                <div class="betslip-container">
                    <div class="betslip-header">
                        <span>Bet Slip (${state.betSlip.length})</span>
                        <button onclick="window.BettingSystem.clearSlip()">Clear</button>
                    </div>
                    <div class="betslip-items">
                        ${state.betSlip.map(bet => `
                            <div class="betslip-item">
                                <div class="bet-info">
                                    <div class="bet-selection">${bet.selectionName}</div>
                                    <div class="bet-event">${bet.eventName}</div>
                                </div>
                                <div class="bet-odds">${bet.odds.toFixed(2)}</div>
                                <button class="remove-bet" onclick="window.BettingSystem.removeBet('${bet.id}', '${bet.selection}')">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="betslip-footer">
                        <div class="total-odds">Total Odds: ${totalOdds}</div>
                        <div class="stake-input">
                            <input type="number" placeholder="Stake" oninput="window.BettingSystem.calculateWin(this.value)">
                        </div>
                        <div class="potential-win">Potential Win: <span id="potential-win-value">0.00</span></div>
                        <button class="place-bet-btn">Place Bet</button>
                    </div>
                </div>
            `;
        },

        updatePotentialWin: function (stake) {
            const win = BetSlipManager.calculatePotentialWin(stake);
            const el = document.getElementById('potential-win-value');
            if (el) el.textContent = win;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.BettingSystem = {
        init: OddsManager.initialize.bind(OddsManager),

        // Odds
        getOdds: OddsManager.getOdds.bind(OddsManager),
        setFormat: OddsManager.setFormat.bind(OddsManager),

        // Slip
        addToSlip: (id, selection, odds) => {
            const market = state.markets.get(id);
            if (market) {
                const names = { home: market.homeTeam, draw: 'Draw', away: market.awayTeam };
                BetSlipManager.addBet({
                    id,
                    eventName: market.eventName,
                    selection,
                    selectionName: names[selection],
                    odds
                });
            }
        },
        removeBet: BetSlipManager.removeBet.bind(BetSlipManager),
        clearSlip: BetSlipManager.clearSlip.bind(BetSlipManager),
        calculateWin: BettingRenderer.updatePotentialWin.bind(BettingRenderer),

        // Rendering
        renderCard: BettingRenderer.renderOddsCard.bind(BettingRenderer),
        renderSlip: BettingRenderer.renderBetSlip.bind(BettingRenderer),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => OddsManager.initialize());
    } else {
        OddsManager.initialize();
    }

})();
