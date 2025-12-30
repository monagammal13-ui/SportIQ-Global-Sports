/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 90: GLOBAL LIVE SPORTS API ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Centralized API management for live scores, fixtures, and results.
 * Features: Rate limiting, caching, auto-sync, mock data fallback
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        configPath: '../api-json/live-api-config.json',
        events: {
            dataUpdated: 'liveapi:updated',
            statusChanged: 'liveapi:status',
            error: 'liveapi:error'
        }
    };

    const state = {
        config: null,
        cache: new Map(),
        intervals: {},
        status: 'offline', // offline, online, fetching
        isMockMode: true
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CORE API ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const APIEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.configPath);
                if (!response.ok) throw new Error('Failed to load API config');

                state.config = await response.json();
                state.isMockMode = state.config.apiClient.mockMode;

                this.updateStatus('online');
                console.log(`📡 [LiveAPI] Initialized (Mock Mode: ${state.isMockMode})`);

                // Start generic polling
                this.startPolling();

                // Initial Fetch
                this.getLiveScores();
            } catch (error) {
                console.error('❌ [LiveAPI] Init Error:', error);
                this.updateStatus('error');
            }
        },

        updateStatus: function (status) {
            state.status = status;
            const event = new CustomEvent(CONFIG.events.statusChanged, {
                detail: { status, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
            this.renderStatusIndicator();
        },

        renderStatusIndicator: function () {
            let el = document.getElementById('live-api-status');
            if (!el) {
                el = document.createElement('div');
                el.id = 'live-api-status';
                el.className = 'live-api-status';
                document.body.appendChild(el);
            }

            const indicatorClass =
                state.status === 'fetching' ? 'fetching' :
                    state.status === 'online' ? 'online' : '';

            el.innerHTML = `
                <div class="api-indicator ${indicatorClass}"></div>
                <span>API: ${state.status.toUpperCase()}</span>
            `;
        },

        fetchData: async function (endpointKey, params = {}) {
            this.updateStatus('fetching');

            // Check cache
            const cacheKey = `${endpointKey}_${JSON.stringify(params)}`;
            const cached = state.cache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < (state.config.updateIntervals[endpointKey] || 5000)) {
                console.log(`📦 [LiveAPI] Serving cached: ${endpointKey}`);
                this.updateStatus('online');
                return cached.data;
            }

            // Simulate Network Delay
            await new Promise(r => setTimeout(r, 500 + Math.random() * 500));

            let data;

            if (state.isMockMode && state.config.mockData) {
                // Return Mock Data logic
                data = this.getMockData(endpointKey);
            } else {
                // Real Fetch Logic (Placeholder for production)
                // const url = this.buildUrl(endpointKey, params);
                // const res = await fetch(url);
                // data = await res.json();
                console.warn('⚠️ [LiveAPI] Real fetch not configured, falling back to mock.');
                data = this.getMockData(endpointKey);
            }

            // Update Cache
            state.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            this.updateStatus('online');
            return data;
        },

        getMockData: function (endpointKey) {
            if (endpointKey === 'liveScores') {
                // Return static mock data + random minor updates
                const scores = JSON.parse(JSON.stringify(state.config.mockData.liveScores));
                scores.forEach(match => {
                    if (match.status === 'LIVE') {
                        // 10% chance to increment minute
                        if (Math.random() > 0.1) match.minute++;
                        // 5% chance to score
                        if (Math.random() > 0.95) {
                            if (Math.random() > 0.5) match.homeScore++;
                            else match.awayScore++;
                        }
                    }
                });
                return scores;
            }
            return [];
        },

        // ═══════════════════════════════════════════════════════════════════════
        // PUBLIC METHODS
        // ═══════════════════════════════════════════════════════════════════════

        getLiveScores: async function () {
            const data = await this.fetchData('liveScores');
            this.dispatchUpdate('liveScores', data);
            return data;
        },

        getFixtures: async function (date) {
            return await this.fetchData('fixtures', { date });
        },

        dispatchUpdate: function (type, data) {
            const event = new CustomEvent(CONFIG.events.dataUpdated, {
                detail: { type, data, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        startPolling: function () {
            if (state.config.updateIntervals.liveScores) {
                state.intervals.live = setInterval(() => {
                    this.getLiveScores();
                }, state.config.updateIntervals.liveScores);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    window.LiveAPI = {
        init: APIEngine.initialize.bind(APIEngine),
        getLiveScores: APIEngine.getLiveScores.bind(APIEngine),
        getFixtures: APIEngine.getFixtures.bind(APIEngine),
        status: () => state.status
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => APIEngine.initialize());
    } else {
        APIEngine.initialize();
    }

})();
