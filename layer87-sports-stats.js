/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 87: ADVANCED SPORTS STATS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Live score aggregation, player/team statistics, performance metrics
 * Features: Real-time scores, leaderboards, player stats, team rankings
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        stats: {
            configPath: '../api-json/stats-config.json',
            updateInterval: 10000, // 10 seconds
            enableLiveScores: true
        },
        events: {
            scoreUpdated: 'stats:score-updated',
            statsCalculated: 'stats:calculated',
            leaderboardUpdated: 'stats:leaderboard-updated'
        }
    };

    const state = {
        matches: new Map(),
        teams: new Map(),
        players: new Map(),
        leagues: new Map(),
        leaderboards: new Map(),
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MATCH SCORE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const MatchScoreManager = {
        register: function (match) {
            const id = match.id || this.generateId();

            const matchObj = {
                id,
                league: match.league,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                homeScore: match.homeScore || 0,
                awayScore: match.awayScore || 0,
                status: match.status || 'scheduled',
                minute: match.minute || 0,
                stats: match.stats || {
                    possession: { home: 50, away: 50 },
                    shots: { home: 0, away: 0 },
                    shotsOnTarget: { home: 0, away: 0 },
                    corners: { home: 0, away: 0 },
                    fouls: { home: 0, away: 0 }
                },
                events: match.events || [],
                timestamp: Date.now()
            };

            state.matches.set(id, matchObj);
            console.log('⚽ [Stats] Match registered:', id);
            return matchObj;
        },

        updateScore: function (matchId, homeScore, awayScore) {
            const match = state.matches.get(matchId);
            if (!match) return false;

            match.homeScore = homeScore;
            match.awayScore = awayScore;

            const event = new CustomEvent(CONFIG.events.scoreUpdated, {
                detail: { matchId, homeScore, awayScore, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('📊 [Stats] Score updated:', matchId, `${homeScore}-${awayScore}`);
            return true;
        },

        updateStats: function (matchId, stats) {
            const match = state.matches.get(matchId);
            if (!match) return false;

            Object.assign(match.stats, stats);
            return true;
        },

        getLive: function () {
            return Array.from(state.matches.values())
                .filter(m => m.status === 'live' || m.status === 'in-progress')
                .sort((a, b) => b.timestamp - a.timestamp);
        },

        getByLeague: function (leagueId) {
            return Array.from(state.matches.values())
                .filter(m => m.league === leagueId);
        },

        generateId: function () {
            return 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TEAM STATS MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const TeamStatsManager = {
        register: function (team) {
            state.teams.set(team.id, {
                id: team.id,
                name: team.name,
                league: team.league,
                stats: {
                    played: team.played || 0,
                    won: team.won || 0,
                    drawn: team.drawn || 0,
                    lost: team.lost || 0,
                    goalsFor: team.goalsFor || 0,
                    goalsAgainst: team.goalsAgainst || 0,
                    points: team.points || 0,
                    position: team.position || 0
                }
            });

            console.log('🏆 [Stats] Team registered:', team.name);
        },

        get: function (teamId) {
            return state.teams.get(teamId);
        },

        updateStats: function (teamId, stats) {
            const team = state.teams.get(teamId);
            if (!team) return false;

            Object.assign(team.stats, stats);
            this.calculatePoints(teamId);
            return true;
        },

        calculatePoints: function (teamId) {
            const team = state.teams.get(teamId);
            if (!team) return;

            team.stats.points = (team.stats.won * 3) + team.stats.drawn;
            team.stats.goalDifference = team.stats.goalsFor - team.stats.goalsAgainst;
        },

        getStandings: function (leagueId) {
            const teams = Array.from(state.teams.values())
                .filter(t => t.league === leagueId);

            return teams.sort((a, b) => {
                if (b.stats.points !== a.stats.points) {
                    return b.stats.points - a.stats.points;
                }
                return b.stats.goalDifference - a.stats.goalDifference;
            }).map((team, index) => ({
                ...team,
                position: index + 1
            }));
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PLAYER STATS MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const PlayerStatsManager = {
        register: function (player) {
            state.players.set(player.id, {
                id: player.id,
                name: player.name,
                team: player.team,
                position: player.position || 'Forward',
                stats: {
                    appearances: player.appearances || 0,
                    goals: player.goals || 0,
                    assists: player.assists || 0,
                    yellowCards: player.yellowCards || 0,
                    redCards: player.redCards || 0,
                    minutesPlayed: player.minutesPlayed || 0
                }
            });

            console.log('👤 [Stats] Player registered:', player.name);
        },

        get: function (playerId) {
            return state.players.get(playerId);
        },

        updateStats: function (playerId, stats) {
            const player = state.players.get(playerId);
            if (!player) return false;

            Object.assign(player.stats, stats);
            return true;
        },

        getTopScorers: function (limit = 10) {
            return Array.from(state.players.values())
                .sort((a, b) => b.stats.goals - a.stats.goals)
                .slice(0, limit);
        },

        getTopAssisters: function (limit = 10) {
            return Array.from(state.players.values())
                .sort((a, b) => b.stats.assists - a.stats.assists)
                .slice(0, limit);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATISTICS CALCULATOR
    // ═══════════════════════════════════════════════════════════════════════

    const StatsCalculator = {
        calculate: function () {
            this.calculateLeagueStats();
            this.updateLeaderboards();

            const event = new CustomEvent(CONFIG.events.statsCalculated, {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        calculateLeagueStats: function () {
            state.leagues.forEach((league, leagueId) => {
                const standings = TeamStatsManager.getStandings(leagueId);
                league.standings = standings;

                const topScorers = this.getLeagueTopScorers(leagueId);
                league.topScorers = topScorers;
            });
        },

        getLeagueTopScorers: function (leagueId) {
            const leagueTeams = Array.from(state.teams.values())
                .filter(t => t.league === leagueId)
                .map(t => t.id);

            return Array.from(state.players.values())
                .filter(p => leagueTeams.includes(p.team))
                .sort((a, b) => b.stats.goals - a.stats.goals)
                .slice(0, 10);
        },

        updateLeaderboards: function () {
            state.leaderboards.set('topScorers', PlayerStatsManager.getTopScorers());
            state.leaderboards.set('topAssisters', PlayerStatsManager.getTopAssisters());

            const event = new CustomEvent(CONFIG.events.leaderboardUpdated, {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        getAverageGoalsPerMatch: function (teamId) {
            const team = state.teams.get(teamId);
            if (!team || team.stats.played === 0) return 0;

            return (team.stats.goalsFor / team.stats.played).toFixed(2);
        },

        getWinPercentage: function (teamId) {
            const team = state.teams.get(teamId);
            if (!team || team.stats.played === 0) return 0;

            return ((team.stats.won / team.stats.played) * 100).toFixed(1);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LIVE SCORE SIMULATOR
    // ═══════════════════════════════════════════════════════════════════════

    const LiveScoreSimulator = {
        simulate: function () {
            const liveMatches = MatchScoreManager.getLive();

            liveMatches.forEach(match => {
                // Randomly update scores
                if (Math.random() < 0.1) { // 10% chance
                    const homeGoal = Math.random() < 0.5;
                    if (homeGoal) {
                        match.homeScore++;
                    } else {
                        match.awayScore++;
                    }

                    MatchScoreManager.updateScore(match.id, match.homeScore, match.awayScore);
                }

                // Update minute
                if (match.minute < 90) {
                    match.minute++;
                }
            });
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
            }, CONFIG.stats.updateInterval);
        },

        update: function () {
            if (CONFIG.stats.enableLiveScores) {
                LiveScoreSimulator.simulate();
            }

            StatsCalculator.calculate();
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
        console.log('📊 LAYER 87: SPORTS STATS ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        try {
            const response = await fetch(CONFIG.stats.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register leagues
                if (state.config.leagues) {
                    state.config.leagues.forEach(league => {
                        state.leagues.set(league.id, league);
                    });
                    console.log(`✅ [Stats] Loaded ${state.config.leagues.length} leagues`);
                }

                // Register teams
                if (state.config.teams) {
                    state.config.teams.forEach(team => {
                        TeamStatsManager.register(team);
                    });
                    console.log(`✅ [Stats] Loaded ${state.config.teams.length} teams`);
                }

                // Register players
                if (state.config.players) {
                    state.config.players.forEach(player => {
                        PlayerStatsManager.register(player);
                    });
                    console.log(`✅ [Stats] Loaded ${state.config.players.length} players`);
                }

                // Register matches
                if (state.config.matches) {
                    state.config.matches.forEach(match => {
                        MatchScoreManager.register(match);
                    });
                    console.log(`✅ [Stats] Loaded ${state.config.matches.length} matches`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Stats] Failed to load config');
        }

        // Calculate initial stats
        StatsCalculator.calculate();

        // Start auto-update
        AutoUpdate.start();

        console.log('✅ [Stats] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.SportsStats = {
        // Matches
        registerMatch: MatchScoreManager.register.bind(MatchScoreManager),
        updateScore: MatchScoreManager.updateScore.bind(MatchScoreManager),
        updateMatchStats: MatchScoreManager.updateStats.bind(MatchScoreManager),
        getLiveMatches: MatchScoreManager.getLive.bind(MatchScoreManager),

        // Teams
        registerTeam: TeamStatsManager.register.bind(TeamStatsManager),
        getTeam: TeamStatsManager.get.bind(TeamStatsManager),
        updateTeamStats: TeamStatsManager.updateStats.bind(TeamStatsManager),
        getStandings: TeamStatsManager.getStandings.bind(TeamStatsManager),

        // Players
        registerPlayer: PlayerStatsManager.register.bind(PlayerStatsManager),
        getPlayer: PlayerStatsManager.get.bind(PlayerStatsManager),
        updatePlayerStats: PlayerStatsManager.updateStats.bind(PlayerStatsManager),
        getTopScorers: PlayerStatsManager.getTopScorers.bind(PlayerStatsManager),
        getTopAssisters: PlayerStatsManager.getTopAssisters.bind(PlayerStatsManager),

        // Statistics
        calculate: StatsCalculator.calculate.bind(StatsCalculator),
        getLeaderboards: () => Array.from(state.leaderboards.entries()),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
