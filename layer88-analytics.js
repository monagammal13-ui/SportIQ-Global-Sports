/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 88: REAL-TIME PLAYER & TEAM ANALYTICS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Advanced analytics, performance metrics, form analysis, predictions
 * Features: Player ratings, team form, heat maps, trend analysis, xG calculations
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        analytics: {
            configPath: '../api-json/analytics-config.json',
            updateInterval: 15000, // 15 seconds
            formLength: 5 // Last 5 matches for form
        },
        events: {
            analyticsUpdated: 'analytics:updated',
            ratingCalculated: 'analytics:rating-calculated',
            formUpdated: 'analytics:form-updated'
        }
    };

    const state = {
        playerAnalytics: new Map(),
        teamAnalytics: new Map(),
        matchAnalytics: new Map(),
        trends: new Map(),
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PLAYER ANALYTICS ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const PlayerAnalytics = {
        register: function (player) {
            const analytics = {
                playerId: player.id,
                name: player.name,
                team: player.team,
                rating: this.calculateRating(player),
                form: this.calculateForm(player),
                metrics: {
                    goalsPerMatch: this.getGoalsPerMatch(player),
                    assistsPerMatch: this.getAssistsPerMatch(player),
                    minutesPerGoal: this.getMinutesPerGoal(player),
                    passAccuracy: player.passAccuracy || 0,
                    tackleSuccess: player.tackleSuccess || 0,
                    aerialWins: player.aerialWins || 0
                },
                performance: {
                    last5Matches: player.last5Matches || [],
                    trend: 'stable',
                    consistency: 0
                },
                comparison: {
                    leagueAverage: 0,
                    positionRank: 0
                },
                timestamp: Date.now()
            };

            state.playerAnalytics.set(player.id, analytics);
            console.log('📈 [Analytics] Player registered:', player.name);
            return analytics;
        },

        calculateRating: function (player) {
            const stats = player.stats || player;

            // Weighted rating calculation
            let rating = 5.0;

            if (stats.goals) rating += stats.goals * 0.3;
            if (stats.assists) rating += stats.assists * 0.2;
            if (stats.appearances) rating += Math.min(stats.appearances / 10, 1);
            if (stats.passAccuracy) rating += (stats.passAccuracy / 100) * 1;

            // Cap at 10
            rating = Math.min(rating, 10);

            return parseFloat(rating.toFixed(1));
        },

        calculateForm: function (player) {
            const last5 = player.last5Matches || [];
            if (last5.length === 0) return 'N/A';

            const avgRating = last5.reduce((sum, match) => sum + (match.rating || 6), 0) / last5.length;

            if (avgRating >= 8) return 'Excellent';
            if (avgRating >= 7) return 'Good';
            if (avgRating >= 6) return 'Average';
            return 'Poor';
        },

        getGoalsPerMatch: function (player) {
            const stats = player.stats || player;
            if (!stats.appearances || stats.appearances === 0) return 0;
            return ((stats.goals || 0) / stats.appearances).toFixed(2);
        },

        getAssistsPerMatch: function (player) {
            const stats = player.stats || player;
            if (!stats.appearances || stats.appearances === 0) return 0;
            return ((stats.assists || 0) / stats.appearances).toFixed(2);
        },

        getMinutesPerGoal: function (player) {
            const stats = player.stats || player;
            if (!stats.goals || stats.goals === 0) return 0;
            return Math.round((stats.minutesPlayed || 0) / stats.goals);
        },

        updateAnalytics: function (playerId) {
            const analytics = state.playerAnalytics.get(playerId);
            if (!analytics) return;

            analytics.timestamp = Date.now();

            const event = new CustomEvent(CONFIG.events.ratingCalculated, {
                detail: { playerId, rating: analytics.rating }
            });
            document.dispatchEvent(event);
        },

        getTopRated: function (limit = 10) {
            return Array.from(state.playerAnalytics.values())
                .sort((a, b) => b.rating - a.rating)
                .slice(0, limit);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TEAM ANALYTICS ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const TeamAnalytics = {
        register: function (team) {
            const analytics = {
                teamId: team.id,
                name: team.name,
                league: team.league,
                form: this.calculateTeamForm(team),
                formGuide: team.formGuide || 'WWDWL',
                metrics: {
                    attackStrength: this.calculateAttackStrength(team),
                    defenseStrength: this.calculateDefenseStrength(team),
                    avgPossession: team.avgPossession || 50,
                    avgShots: team.avgShots || 12,
                    cleanSheets: team.cleanSheets || 0
                },
                performance: {
                    homeRecord: { w: 0, d: 0, l: 0 },
                    awayRecord: { w: 0, d: 0, l: 0 },
                    last10Form: [],
                    momentum: 'neutral'
                },
                rankings: {
                    overall: 0,
                    attack: 0,
                    defense: 0,
                    form: 0
                },
                predictions: {
                    nextMatchWinProbability: 0,
                    topFourChance: 0
                },
                timestamp: Date.now()
            };

            state.teamAnalytics.set(team.id, analytics);
            console.log('📊 [Analytics] Team registered:', team.name);
            return analytics;
        },

        calculateTeamForm: function (team) {
            const formGuide = team.formGuide || '';
            if (!formGuide) return 50;

            const points = {
                'W': 100,
                'D': 50,
                'L': 0
            };

            const total = formGuide.split('').reduce((sum, result) => {
                return sum + (points[result] || 0);
            }, 0);

            return Math.round(total / formGuide.length);
        },

        calculateAttackStrength: function (team) {
            const stats = team.stats || team;
            const goalsPerMatch = stats.played ? (stats.goalsFor / stats.played) : 0;

            // Score out of 100
            return Math.min(Math.round(goalsPerMatch * 40), 100);
        },

        calculateDefenseStrength: function (team) {
            const stats = team.stats || team;
            const goalsAgainstPerMatch = stats.played ? (stats.goalsAgainst / stats.played) : 0;

            // Inverse - lower is better
            return Math.max(100 - Math.round(goalsAgainstPerMatch * 40), 0);
        },

        updateFormGuide: function (teamId, result) {
            const analytics = state.teamAnalytics.get(teamId);
            if (!analytics) return;

            analytics.formGuide = (result + analytics.formGuide).slice(0, CONFIG.analytics.formLength);
            analytics.form = this.calculateTeamForm({ formGuide: analytics.formGuide });

            const event = new CustomEvent(CONFIG.events.formUpdated, {
                detail: { teamId, form: analytics.form }
            });
            document.dispatchEvent(event);
        },

        getTopPerformers: function (metric = 'form', limit = 10) {
            return Array.from(state.teamAnalytics.values())
                .sort((a, b) => {
                    if (metric === 'form') return b.form - a.form;
                    if (metric === 'attack') return b.metrics.attackStrength - a.metrics.attackStrength;
                    if (metric === 'defense') return b.metrics.defenseStrength - a.metrics.defenseStrength;
                    return 0;
                })
                .slice(0, limit);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MATCH ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════

    const MatchAnalytics = {
        analyze: function (match) {
            const analytics = {
                matchId: match.id,
                expectedGoals: {
                    home: this.calculateXG(match, 'home'),
                    away: this.calculateXG(match, 'away')
                },
                dominance: this.calculateDominance(match),
                momentum: this.calculateMomentum(match),
                keyMoments: match.events || [],
                heatMap: this.generateHeatMap(match),
                timestamp: Date.now()
            };

            state.matchAnalytics.set(match.id, analytics);
            return analytics;
        },

        calculateXG: function (match, side) {
            const stats = match.stats || {};
            const shots = side === 'home' ? stats.shots?.home || 0 : stats.shots?.away || 0;
            const shotsOnTarget = side === 'home' ? stats.shotsOnTarget?.home || 0 : stats.shotsOnTarget?.away || 0;

            // Simplified xG calculation
            return parseFloat((shotsOnTarget * 0.3 + (shots - shotsOnTarget) * 0.1).toFixed(2));
        },

        calculateDominance: function (match) {
            const stats = match.stats || {};
            const homePossession = stats.possession?.home || 50;

            if (homePossession > 60) return 'home-dominated';
            if (homePossession < 40) return 'away-dominated';
            return 'balanced';
        },

        calculateMomentum: function (match) {
            // Based on recent events - simplified
            return 'neutral';
        },

        generateHeatMap: function (match) {
            // Simplified heat map zones
            return {
                home: { attack: 30, midfield: 40, defense: 30 },
                away: { attack: 30, midfield: 40, defense: 30 }
            };
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TREND ANALYZER
    // ═══════════════════════════════════════════════════════════════════════

    const TrendAnalyzer = {
        analyzePlayerTrend: function (playerId) {
            const analytics = state.playerAnalytics.get(playerId);
            if (!analytics) return null;

            const last5 = analytics.performance.last5Matches;
            if (last5.length < 3) return 'insufficient-data';

            const recent = last5.slice(0, 3);
            const older = last5.slice(3);

            const recentAvg = recent.reduce((sum, m) => sum + (m.rating || 6), 0) / recent.length;
            const olderAvg = older.reduce((sum, m) => sum + (m.rating || 6), 0) / Math.max(older.length, 1);

            if (recentAvg > olderAvg + 0.5) return 'rising';
            if (recentAvg < olderAvg - 0.5) return 'declining';
            return 'stable';
        },

        analyzeTeamTrend: function (teamId) {
            const analytics = state.teamAnalytics.get(teamId);
            if (!analytics) return null;

            const formGuide = analytics.formGuide;
            const recent = formGuide.slice(0, 3);

            const wins = (recent.match(/W/g) || []).length;

            if (wins >= 2) return 'improving';
            if (wins === 0) return 'declining';
            return 'stable';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-UPDATE ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const AutoUpdate = {
        start: function () {
            this.update();

            this.timerId = setInterval(() => {
                this.update();
            }, CONFIG.analytics.updateInterval);
        },

        update: function () {
            // Update all analytics
            state.playerAnalytics.forEach((analytics, playerId) => {
                PlayerAnalytics.updateAnalytics(playerId);
            });

            const event = new CustomEvent(CONFIG.events.analyticsUpdated, {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        stop: function () {
            if (this.timerId) clearInterval(this.timerId);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📈 LAYER 88: ANALYTICS ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        try {
            const response = await fetch(CONFIG.analytics.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register players
                if (state.config.players) {
                    state.config.players.forEach(player => {
                        PlayerAnalytics.register(player);
                    });
                    console.log(`✅ [Analytics] Loaded ${state.config.players.length} player analytics`);
                }

                // Register teams
                if (state.config.teams) {
                    state.config.teams.forEach(team => {
                        TeamAnalytics.register(team);
                    });
                    console.log(`✅ [Analytics] Loaded ${state.config.teams.length} team analytics`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Analytics] Failed to load config');
        }

        // Start auto-update
        AutoUpdate.start();

        console.log('✅ [Analytics] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.AdvancedAnalytics = {
        // Player Analytics
        registerPlayer: PlayerAnalytics.register.bind(PlayerAnalytics),
        getPlayerAnalytics: (id) => state.playerAnalytics.get(id),
        getTopRatedPlayers: PlayerAnalytics.getTopRated.bind(PlayerAnalytics),

        // Team Analytics
        registerTeam: TeamAnalytics.register.bind(TeamAnalytics),
        getTeamAnalytics: (id) => state.teamAnalytics.get(id),
        updateTeamForm: TeamAnalytics.updateFormGuide.bind(TeamAnalytics),
        getTopTeams: TeamAnalytics.getTopPerformers.bind(TeamAnalytics),

        // Match Analytics
        analyzeMatch: MatchAnalytics.analyze.bind(MatchAnalytics),
        getMatchAnalytics: (id) => state.matchAnalytics.get(id),

        // Trends
        getPlayerTrend: TrendAnalyzer.analyzePlayerTrend.bind(TrendAnalyzer),
        getTeamTrend: TrendAnalyzer.analyzeTeamTrend.bind(TrendAnalyzer),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
