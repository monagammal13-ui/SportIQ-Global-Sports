/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 91: INTERACTIVE LEADERBOARDS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Manage global rankings, calculate scores, and display leaderboards.
 * Features: Live ranking updates, user highlighting, trend analysis
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        configPath: '../api-json/leaderboards-config.json',
        updateInterval: 30000, // 30 seconds
        events: {
            updated: 'leaderboard:updated'
        }
    };

    const state = {
        rankings: new Map(),
        config: null,
        currentUser: 'SoccerWizard99' // Automated fallback for demo
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LEADERBOARD MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const LeaderboardManager = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.configPath);
                state.config = await response.json();

                // Load Initial Data
                if (state.config.mockData) {
                    Object.keys(state.config.mockData).forEach(key => {
                        this.updateRanking(key, state.config.mockData[key]);
                    });
                }

                console.log('🏆 [Leaderboards] Initialized');
                this.startAutoUpdate();
            } catch (error) {
                console.error('❌ [Leaderboards] Init Failed:', error);
            }
        },

        updateRanking: function (id, data) {
            state.rankings.set(id, data);
            this.dispatchUpdate(id);
        },

        getRanking: function (id) {
            return state.rankings.get(id) || [];
        },

        startAutoUpdate: function () {
            setInterval(() => {
                this.simulateLiveUpdates();
            }, CONFIG.updateInterval);
        },

        simulateLiveUpdates: function () {
            // Simulate score changes for demo
            state.rankings.forEach((list, id) => {
                let changed = false;
                list.forEach(entry => {
                    if (Math.random() > 0.7) {
                        const change = Math.floor(Math.random() * 10) - 2; // -2 to +8
                        entry.score += change;
                        entry.trend = change > 0 ? 'up' : (change < 0 ? 'down' : 'stable');
                        changed = true;
                    }
                });

                if (changed) {
                    // Re-sort
                    list.sort((a, b) => b.score - a.score);
                    // Re-rank
                    list.forEach((item, index) => item.rank = index + 1);
                    this.dispatchUpdate(id);
                }
            });
        },

        dispatchUpdate: function (leaderboardId) {
            const event = new CustomEvent(CONFIG.events.updated, {
                detail: {
                    id: leaderboardId,
                    data: state.rankings.get(leaderboardId),
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);
        },

        renderWidget: function (leaderboardId, containerId) {
            const data = this.getRanking(leaderboardId);
            const container = document.getElementById(containerId);
            if (!container || !data.length) return;

            const leagueMeta = state.config.leagues.find(l => l.id === leaderboardId);

            let html = `
                <div class="leaderboard-widget">
                    <div class="leaderboard-header">
                        <span class="leaderboard-title">${leagueMeta ? leagueMeta.name : leaderboardId}</span>
                        <span class="live-indicator">● LIVE</span>
                    </div>
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>${leagueMeta?.type === 'team' ? 'Team' : 'Player'}</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.slice(0, 10).forEach(row => {
                const isMe = row.name === state.currentUser;
                const trendIcon = row.trend === 'up' ? '▲' : (row.trend === 'down' ? '▼' : '−');

                html += `
                    <tr class="${isMe ? 'user-row-highlight' : ''}">
                        <td class="rank-cell rank-${row.rank}">${row.rank}</td>
                        <td class="entity-cell">
                            ${row.name}
                            <span class="trend-indicator trend-${row.trend}">${trendIcon}</span>
                        </td>
                        <td class="score-cell">${row.score}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
            container.innerHTML = html;
        }
    };

    // Global Export
    window.Leaderboards = {
        init: LeaderboardManager.initialize.bind(LeaderboardManager),
        get: LeaderboardManager.getRanking.bind(LeaderboardManager),
        render: LeaderboardManager.renderWidget.bind(LeaderboardManager)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => LeaderboardManager.initialize());
    } else {
        LeaderboardManager.initialize();
    }

})();
