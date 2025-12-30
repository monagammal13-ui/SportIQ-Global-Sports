/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 99: LIVE SCORE WIDGETS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Embeddable live score widgets, update handling, visual match tracking.
 * Features: Compact, Expanded, and Ticker modes. Real-time DOM updates.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        widgets: {
            configPath: '../api-json/widgets-config.json',
            updateInterval: 10000,
            animationDuration: 500
        },
        events: {
            scoreUpdated: 'widget:score-updated',
            matchFinished: 'widget:match-finished'
        }
    };

    const state = {
        activeWidgets: new Map(), // widgetId -> config
        matches: new Map(), // matchId -> matchData
        timer: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // WIDGET ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const WidgetEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.widgets.configPath);
                if (response.ok) {
                    const config = await response.json();
                    if (config.initialMatches) {
                        this.loadMatches(config.initialMatches);
                    }
                }
            } catch (error) {
                console.warn('⚠️ [Widgets] Failed to load config');
            }

            this.startUpdates();
            this.scanAndRender(); // Auto-render existing placeholders
            console.log('🏟️ [Widgets] Engine initialized');
        },

        loadMatches: function (matches) {
            matches.forEach(match => {
                state.matches.set(match.id, {
                    ...match,
                    lastUpdate: Date.now()
                });
            });
        },

        updateScore: function (matchId, homeScore, awayScore, minute, event = null) {
            const match = state.matches.get(matchId);
            if (match) {
                const oldHome = match.homeScore;
                const oldAway = match.awayScore;

                match.homeScore = homeScore;
                match.awayScore = awayScore;
                match.minute = minute;
                if (event) match.events = [...(match.events || []), event];

                // Trigger UI updates
                this.updateWidgets(matchId, oldHome !== homeScore || oldAway !== awayScore);

                // Dispatch global event
                document.dispatchEvent(new CustomEvent(CONFIG.events.scoreUpdated, {
                    detail: { matchId, score: `${homeScore}-${awayScore}` }
                }));
            }
        },

        updateWidgets: function (matchId, scoreChanged) {
            // Find all widgets displaying this match
            state.activeWidgets.forEach((config, elementId) => {
                if (config.matchId === matchId) {
                    WidgetRenderer.updateDOM(elementId, state.matches.get(matchId), scoreChanged);
                }
            });
        },

        startUpdates: function () {
            // Simulated live feed
            state.timer = setInterval(() => {
                this.simulateGameProgress();
            }, CONFIG.widgets.updateInterval);
        },

        simulateGameProgress: function () {
            state.matches.forEach(match => {
                if (match.status === 'LIVE') {
                    match.minute++;
                    if (match.minute > 90) match.status = 'FT';

                    // Random goal chance
                    if (Math.random() > 0.95) {
                        if (Math.random() > 0.5) match.homeScore++;
                        else match.awayScore++;

                        this.updateScore(match.id, match.homeScore, match.awayScore, match.minute, 'Goal');
                    } else {
                        // Just minute update
                        this.updateScore(match.id, match.homeScore, match.awayScore, match.minute);
                    }
                }
            });
        },

        scanAndRender: function () {
            document.querySelectorAll('[data-score-widget]').forEach(el => {
                const matchId = el.getAttribute('data-match-id');
                const type = el.getAttribute('data-widget-type') || 'compact';
                const id = el.id || `widget_${Math.random().toString(36).substr(2, 9)}`;
                el.id = id;

                this.render(id, matchId, type);
            });
        },

        render: function (elementId, matchId, type = 'compact') {
            const match = state.matches.get(matchId);
            if (match) {
                state.activeWidgets.set(elementId, { matchId, type });
                WidgetRenderer.initialRender(elementId, match, type);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const WidgetRenderer = {
        initialRender: function (elementId, match, type) {
            const container = document.getElementById(elementId);
            if (!container) return;

            container.className = `score-widget widget-${type}`;
            container.innerHTML = this.getTemplate(match, type);
        },

        updateDOM: function (elementId, match, scoreChanged) {
            const container = document.getElementById(elementId);
            if (!container) return;

            // Update Minute
            const timeEl = container.querySelector('.match-time');
            if (timeEl) {
                timeEl.textContent = match.status === 'LIVE' ? `${match.minute}'` : match.status;
                if (match.status === 'LIVE') timeEl.classList.add('live-pulse');
                else timeEl.classList.remove('live-pulse');
            }

            // Update Scores
            if (scoreChanged) {
                const homeEl = container.querySelector('.score-home');
                const awayEl = container.querySelector('.score-away');

                if (homeEl) {
                    homeEl.textContent = match.homeScore;
                    this.flashScore(homeEl);
                }
                if (awayEl) {
                    awayEl.textContent = match.awayScore;
                    this.flashScore(awayEl);
                }
            }
        },

        flashScore: function (element) {
            element.classList.add('score-update');
            setTimeout(() => element.classList.remove('score-update'), 1000);
        },

        getTemplate: function (match, type) {
            const isLive = match.status === 'LIVE';
            const statusClass = isLive ? 'live' : '';

            if (type === 'ticker') {
                return `
                    <div class="ticker-content">
                        <span class="ticker-teams">${match.homeTeam} vs ${match.awayTeam}</span>
                        <span class="ticker-score">${match.homeScore} - ${match.awayScore}</span>
                        <span class="match-time ${statusClass} ${isLive ? 'live-pulse' : ''}">${isLive ? match.minute + "'" : match.status}</span>
                    </div>
                `;
            }

            // Default Compact/Expanded
            return `
                <div class="widget-header">
                    <span class="league-name">${match.league}</span>
                    <span class="match-time ${statusClass} ${isLive ? 'live-pulse' : ''}">${isLive ? match.minute + "'" : match.status}</span>
                </div>
                <div class="teams-container">
                    <div class="team home">
                        <img src="${match.homeLogo}" alt="${match.homeTeam}" class="team-logo">
                        <span class="team-name">${match.homeTeam}</span>
                        <span class="score score-home">${match.homeScore}</span>
                    </div>
                    <div class="team away">
                        <img src="${match.awayLogo}" alt="${match.awayTeam}" class="team-logo">
                        <span class="team-name">${match.awayTeam}</span>
                        <span class="score score-away">${match.awayScore}</span>
                    </div>
                </div>
                ${type === 'expanded' ? `<div class="widget-footer">Live Odds: ${match.odds?.home || '-'} | ${match.odds?.away || '-'}</div>` : ''}
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.LiveWidgets = {
        init: WidgetEngine.initialize.bind(WidgetEngine),
        render: WidgetEngine.render.bind(WidgetEngine),
        scan: WidgetEngine.scanAndRender.bind(WidgetEngine),

        // Debugging / Manual Update
        update: WidgetEngine.updateScore.bind(WidgetEngine),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WidgetEngine.initialize());
    } else {
        WidgetEngine.initialize();
    }

})();
