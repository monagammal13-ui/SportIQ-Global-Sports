/**
 * Layer 29: Live Scores Aggregator Runtime
 * Standalone implementation with real-time score fetching, scoreboards, and auto-refresh
 */

class LiveScoresAggregatorRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_LIVE_SCORES__) {
            return window.__ANTIGRAVITY_LIVE_SCORES__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-029';
        this.name = 'Live Scores Aggregator';

        this.liveMatches = [];
        this.upcomingMatches = [];
        this.completedMatches = [];
        this.updateInterval = null;

        console.log(`[Live Scores v${this.version}] Initializing...`);
        this._init();
    }

    async _init() {
        try {
            await this._loadConfig();
            await this._setupDataSources();
            await this._fetchScores();
            this._renderScoreboards();
            this._startAutoRefresh();
            console.log('[Live Scores] Fully initialized');
        } catch (error) {
            console.error('[Live Scores] Init error:', error);
        }
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/live-scores-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = this._getDefaultConfig();
        }
    }

    _getDefaultConfig() {
        return {
            refreshInterval: 30000,
            sports: ['football', 'basketball', 'tennis'],
            maxMatchesPerSport: 10,
            autoRefresh: true,
            showOdds: false,
            dataSources: [
                {
                    id: 'primary',
                    url: 'https://api.sportsdata.io/v3/scores',
                    apiKey: '',
                    enabled: false
                }
            ]
        };
    }

    async _setupDataSources() {
        this.activeSources = this.config.dataSources.filter(s => s.enabled);

        if (this.activeSources.length === 0) {
            console.warn('[Live Scores] No active data sources, using mock data');
            this.useMockData = true;
        }
    }

    async _fetchScores() {
        if (this.useMockData) {
            this._loadMockData();
            return;
        }

        const promises = this.activeSources.map(source => this._fetchFromSource(source));
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                this._processScoreData(result.value, this.activeSources[index].id);
            } else {
                console.error(`[Live Scores] Failed to fetch from ${this.activeSources[index].id}:`, result.reason);
            }
        });

        this._categorizeMatches();
    }

    async _fetchFromSource(source) {
        const response = await fetch(source.url, {
            headers: {
                'Authorization': `Bearer ${source.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    }

    _loadMockData() {
        this.liveMatches = [
            {
                id: 'match1',
                sport: 'football',
                homeTeam: 'Manchester United',
                awayTeam: 'Liverpool',
                homeScore: 2,
                awayScore: 1,
                status: 'LIVE',
                minute: 67,
                league: 'Premier League',
                timestamp: Date.now()
            },
            {
                id: 'match2',
                sport: 'basketball',
                homeTeam: 'Lakers',
                awayTeam: 'Warriors',
                homeScore: 98,
                awayScore: 95,
                status: 'LIVE',
                quarter: 3,
                timeRemaining: '5:23',
                league: 'NBA',
                timestamp: Date.now()
            },
            {
                id: 'match3',
                sport: 'tennis',
                homeTeam: 'Djokovic',
                awayTeam: 'Nadal',
                homeScore: { sets: 2, games: 4 },
                awayScore: { sets: 1, games: 3 },
                status: 'LIVE',
                set: 3,
                league: 'Australian Open',
                timestamp: Date.now()
            }
        ];

        this.upcomingMatches = [
            {
                id: 'match4',
                sport: 'football',
                homeTeam: 'Real Madrid',
                awayTeam: 'Barcelona',
                status: 'UPCOMING',
                kickoff: Date.now() + 3600000,
                league: 'La Liga'
            }
        ];
    }

    _processScoreData(data, sourceId) {
        // Process and normalize data from different sources
        if (data.matches) {
            data.matches.forEach(match => {
                const normalized = this._normalizeMatch(match, sourceId);
                if (normalized.status === 'LIVE') {
                    this.liveMatches.push(normalized);
                } else if (normalized.status === 'UPCOMING') {
                    this.upcomingMatches.push(normalized);
                } else if (normalized.status === 'COMPLETED') {
                    this.completedMatches.push(normalized);
                }
            });
        }
    }

    _normalizeMatch(rawMatch, sourceId) {
        return {
            id: `${sourceId}_${rawMatch.id}`,
            sport: rawMatch.sport || 'unknown',
            homeTeam: rawMatch.home_team || rawMatch.homeTeam,
            awayTeam: rawMatch.away_team || rawMatch.awayTeam,
            homeScore: rawMatch.home_score || rawMatch.homeScore || 0,
            awayScore: rawMatch.away_score || rawMatch.awayScore || 0,
            status: rawMatch.status,
            league: rawMatch.league || rawMatch.competition,
            timestamp: rawMatch.timestamp || Date.now()
        };
    }

    _categorizeMatches() {
        // Sort matches by time
        this.liveMatches.sort((a, b) => b.timestamp - a.timestamp);
        this.upcomingMatches.sort((a, b) => a.kickoff - b.kickoff);
        this.completedMatches.sort((a, b) => b.timestamp - a.timestamp);
    }

    _renderScoreboards() {
        this._renderLiveScores();
        this._renderUpcoming();
        this._renderCompleted();
    }

    _renderLiveScores() {
        const container = document.getElementById('liveScoresContainer');
        if (!container) return;

        if (this.liveMatches.length === 0) {
            container.innerHTML = '<p class="no-matches">No live matches at the moment</p>';
            return;
        }

        const html = this.liveMatches.map(match => this._createMatchCard(match)).join('');
        container.innerHTML = html;
    }

    _createMatchCard(match) {
        const statusBadge = this._getStatusBadge(match);
        const scoreDisplay = this._getScoreDisplay(match);

        return `
            <div class="match-card match-${match.status.toLowerCase()}" data-match-id="${match.id}">
                <div class="match-header">
                    <span class="match-league">${match.league}</span>
                    ${statusBadge}
                </div>
                <div class="match-teams">
                    <div class="team home-team">
                        <span class="team-name">${match.homeTeam}</span>
                        <span class="team-score">${scoreDisplay.home}</span>
                    </div>
                    <div class="match-separator">vs</div>
                    <div class="team away-team">
                        <span class="team-name">${match.awayTeam}</span>
                        <span class="team-score">${scoreDisplay.away}</span>
                    </div>
                </div>
                ${this._getMatchDetails(match)}
            </div>
        `;
    }

    _getStatusBadge(match) {
        if (match.status === 'LIVE') {
            return `<span class="status-badge live-badge">LIVE ${match.minute ? match.minute + "'" : ''}</span>`;
        } else if (match.status === 'UPCOMING') {
            const time = new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `<span class="status-badge upcoming-badge">${time}</span>`;
        } else {
            return `<span class="status-badge completed-badge">FT</span>`;
        }
    }

    _getScoreDisplay(match) {
        if (match.sport === 'tennis') {
            return {
                home: `${match.homeScore.sets} (${match.homeScore.games})`,
                away: `${match.awayScore.sets} (${match.awayScore.games})`
            };
        }

        return {
            home: match.homeScore,
            away: match.awayScore
        };
    }

    _getMatchDetails(match) {
        let details = '';

        if (match.sport === 'basketball' && match.quarter) {
            details = `<div class="match-details">Q${match.quarter} - ${match.timeRemaining || ''}</div>`;
        } else if (match.sport === 'tennis' && match.set) {
            details = `<div class="match-details">Set ${match.set}</div>`;
        }

        return details;
    }

    _renderUpcoming() {
        const container = document.getElementById('upcomingMatchesContainer');
        if (!container) return;

        const html = this.upcomingMatches.slice(0, 5).map(match => this._createMatchCard(match)).join('');
        container.innerHTML = html || '<p class="no-matches">No upcoming matches</p>';
    }

    _renderCompleted() {
        const container = document.getElementById('completedMatchesContainer');
        if (!container) return;

        const html = this.completedMatches.slice(0, 10).map(match => this._createMatchCard(match)).join('');
        container.innerHTML = html || '<p class="no-matches">No recent results</p>';
    }

    _startAutoRefresh() {
        if (!this.config.autoRefresh) return;

        this.updateInterval = setInterval(async () => {
            await this._fetchScores();
            this._renderScoreboards();
            this._emitEvent('livescores:updated', {
                live: this.liveMatches.length,
                upcoming: this.upcomingMatches.length
            });
        }, this.config.refreshInterval);

        console.log(`[Live Scores] Auto-refresh enabled (${this.config.refreshInterval}ms)`);
    }

    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Public API
    getMatch(id) {
        return [...this.liveMatches, ...this.upcomingMatches, ...this.completedMatches]
            .find(m => m.id === id);
    }

    getLiveMatches(sport = null) {
        if (sport) {
            return this.liveMatches.filter(m => m.sport === sport);
        }
        return this.liveMatches;
    }

    getMatchesBySport(sport) {
        return {
            live: this.liveMatches.filter(m => m.sport === sport),
            upcoming: this.upcomingMatches.filter(m => m.sport === sport),
            completed: this.completedMatches.filter(m => m.sport === sport)
        };
    }

    async refreshScores() {
        await this._fetchScores();
        this._renderScoreboards();
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    getState() {
        return {
            liveMatches: this.liveMatches.length,
            upcomingMatches: this.upcomingMatches.length,
            completedMatches: this.completedMatches.length,
            autoRefresh: this.config.autoRefresh
        };
    }
}

// Initialize and export
const liveScores = new LiveScoresAggregatorRuntime();
window.__ANTIGRAVITY_LIVE_SCORES__ = liveScores;

// Register with core engines
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[Live Scores] Registered with runtime');
    });
}

if (window.__ANTIGRAVITY_EVENT_BUS__) {
    window.__ANTIGRAVITY_EVENT_BUS__.on('app:visibility-change', (visible) => {
        if (visible) {
            liveScores.refreshScores();
        }
    });
}

export default liveScores;
