/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 95: HISTORICAL DATA ARCHIVE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Archive access, historical report generation, season analysis
 * Features: Long-term data storage, trend comparison, historical stats
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        archive: {
            configPath: '../api-json/archive-config.json',
            defaultSeason: '2023-2024',
            maxReportItems: 50
        },
        events: {
            dataLoaded: 'archive:data-loaded',
            reportGenerated: 'archive:report-generated',
            seasonChanged: 'archive:season-changed'
        }
    };

    const state = {
        seasons: new Map(),
        historicalPlayers: new Map(),
        historicalMatches: new Map(),
        activeSeason: null,
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ARCHIVE ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const ArchiveEngine = {
        initialize: async function () {
            console.log('📚 [Archive] Engine initializing...');
            try {
                const response = await fetch(CONFIG.archive.configPath);
                if (response.ok) {
                    state.config = await response.json();

                    if (state.config.seasons) {
                        this.loadSeasons(state.config.seasons);
                    }

                    this.setActiveSeason(state.config.defaultSeason || CONFIG.archive.defaultSeason);
                }
            } catch (error) {
                console.warn('⚠️ [Archive] Failed to load config');
            }
        },

        loadSeasons: function (seasons) {
            seasons.forEach(season => {
                state.seasons.set(season.id, season);
            });
            console.log(`📚 [Archive] Loaded ${seasons.length} seasons`);
        },

        setActiveSeason: function (seasonId) {
            if (!state.seasons.has(seasonId)) return false;

            state.activeSeason = seasonId;
            const season = state.seasons.get(seasonId);

            // Load season data (simulated)
            this.loadSeasonData(season);

            const event = new CustomEvent(CONFIG.events.seasonChanged, {
                detail: { seasonId, season, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
            return true;
        },

        loadSeasonData: function (season) {
            // Mock loading data for the season
            if (season.data) {
                // Clear current
                state.historicalPlayers.clear();
                state.historicalMatches.clear();

                // Load matches
                season.data.matches.forEach(m => state.historicalMatches.set(m.id, m));

                // Load players
                season.data.players.forEach(p => state.historicalPlayers.set(p.id, p));

                console.log(`📚 [Archive] Loaded data for ${season.name}`);
            }
        },

        query: function (options = {}) {
            const { type, season, limit = 10, sortBy = 'date' } = options;

            if (season && season !== state.activeSeason) {
                this.setActiveSeason(season);
            }

            let data = [];

            if (type === 'matches') {
                data = Array.from(state.historicalMatches.values());
            } else if (type === 'players') {
                data = Array.from(state.historicalPlayers.values());
            }

            // Sort
            data.sort((a, b) => {
                const valA = a[sortBy] || 0;
                const valB = b[sortBy] || 0;
                return valB - valA; // Descending
            });

            return data.slice(0, limit);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ANALYTICS REPORTER
    // ═══════════════════════════════════════════════════════════════════════

    const AnalyticsReporter = {
        generateReport: function (type) {
            const season = state.seasons.get(state.activeSeason);
            if (!season) return null;

            let report = {
                season: season.name,
                generated: Date.now(),
                type,
                metrics: {}
            };

            if (type === 'season_summary') {
                report.metrics = this.calculateSeasonMetrics();
            } else if (type === 'top_performers') {
                report.metrics = this.getTopPerformers();
            }

            return report;
        },

        calculateSeasonMetrics: function () {
            const matches = Array.from(state.historicalMatches.values());

            const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore + m.awayScore), 0);
            const totalMatches = matches.length;
            const avgGoals = totalMatches ? (totalGoals / totalMatches).toFixed(2) : 0;

            return {
                totalMatches,
                totalGoals,
                avgGoals,
                topScoringMatch: this.findTopScoringMatch(matches)
            };
        },

        getTopPerformers: function () {
            const players = Array.from(state.historicalPlayers.values());
            return players
                .sort((a, b) => b.goals - a.goals)
                .slice(0, 5)
                .map(p => ({
                    name: p.name,
                    goals: p.goals,
                    assists: p.assists,
                    matches: p.matches
                }));
        },

        findTopScoringMatch: function (matches) {
            return matches.sort((a, b) =>
                (b.homeScore + b.awayScore) - (a.homeScore + a.awayScore)
            )[0];
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const ArchiveRenderer = {
        renderDashboard: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const season = state.seasons.get(state.activeSeason);
            if (!season) return;

            const summary = AnalyticsReporter.generateReport('season_summary');

            let html = `
                <div class="archive-dashboard">
                    <div class="archive-header">
                        <h2>Historical Archive: ${season.name}</h2>
                        <select onchange="window.ArchiveSystem.setSeason(this.value)">
                            ${Array.from(state.seasons.values()).map(s =>
                `<option value="${s.id}" ${s.id === state.activeSeason ? 'selected' : ''}>${s.name}</option>`
            ).join('')}
                        </select>
                    </div>
                    
                    <div class="archive-stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${summary.metrics.totalMatches}</div>
                            <div class="stat-label">Matches Played</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${summary.metrics.totalGoals}</div>
                            <div class="stat-label">Total Goals</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${summary.metrics.avgGoals}</div>
                            <div class="stat-label">Avg Goals/Match</div>
                        </div>
                    </div>
                    
                    <div class="archive-section">
                        <h3>Season Highlights</h3>
                        ${summary.metrics.topScoringMatch ? `
                            <div class="highlight-card">
                                <strong>Highest Scoring Match:</strong>
                                ${summary.metrics.topScoringMatch.homeTeam} 
                                ${summary.metrics.topScoringMatch.homeScore} - 
                                ${summary.metrics.topScoringMatch.awayScore} 
                                ${summary.metrics.topScoringMatch.awayTeam}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ArchiveSystem = {
        init: ArchiveEngine.initialize.bind(ArchiveEngine),
        setSeason: (id) => {
            ArchiveEngine.setActiveSeason(id);
            // Re-render dashboard if it exists
            const dashboard = document.querySelector('.archive-dashboard');
            if (dashboard) {
                const parent = dashboard.parentElement;
                ArchiveRenderer.renderDashboard(parent.id);
            }
        },
        query: ArchiveEngine.query.bind(ArchiveEngine),
        generateReport: AnalyticsReporter.generateReport.bind(AnalyticsReporter),
        render: ArchiveRenderer.renderDashboard.bind(ArchiveRenderer),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ArchiveEngine.initialize());
    } else {
        ArchiveEngine.initialize();
    }

})();
