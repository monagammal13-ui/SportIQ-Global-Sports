/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 116: TRENDING TOPIC DETECTION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Identifies high-velocity topics based on content frequency and interaction.
 * Features: Heat scoring algo, "Trending Now" bar, and hot-topic visual indicators.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        trending: {
            decayRate: 0.95, // Score multiplier per tick (simulated time)
            threshold: 10,   // Min score to be "Trending"
            maxTrending: 5
        },
        selectors: {
            barContainer: '#trending-bar-container',
            tagContainer: '.topic-tag'
        }
    };

    const state = {
        topicScores: new Map(), // Map<TopicName, Score>
        activeTrends: []
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TRENDING ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const TrendingEngine = {
        initialize: function () {
            console.log('🔥 [Trending] Engine initialized');

            // Listen for topic categorization (Layer 111)
            document.addEventListener('topics:categorized', (e) => {
                if (e.detail && e.detail.topics) {
                    this.ingestTopics(e.detail.topics);
                }
            });

            // Start decay loop (simulating cooling off over time)
            setInterval(() => this.applyDecay(), 10000);

            // Seed some data for immediate visual
            this.seedDemoData();
        },

        ingestTopics: function (topics) {
            topics.forEach(topic => {
                const current = state.topicScores.get(topic.name) || 0;
                // Add points: weighted by depth (specific topics worth more)
                const points = (topic.depth + 1) * 5;
                state.topicScores.set(topic.name, current + points);
            });

            this.recalculateTrends();
        },

        applyDecay: function () {
            state.topicScores.forEach((score, topic) => {
                const newScore = score * CONFIG.trending.decayRate;
                if (newScore < 1) {
                    state.topicScores.delete(topic);
                } else {
                    state.topicScores.set(topic, newScore);
                }
            });
            this.recalculateTrends();
        },

        recalculateTrends: function () {
            // Sort by score
            const sorted = Array.from(state.topicScores.entries())
                .sort((a, b) => b[1] - a[1]) // Descending
                .map(entry => ({ name: entry[0], score: entry[1] })); // obj format

            state.activeTrends = sorted.slice(0, CONFIG.trending.maxTrending);

            console.log('🔥 [Trending] Top:', state.activeTrends.map(t => t.name).join(', '));

            // Update UI
            TrendingRenderer.renderBar(state.activeTrends);
            TrendingRenderer.highlightTags(state.activeTrends);
        },

        seedDemoData: function () {
            this.ingestTopics([
                { name: 'Transfer Market', depth: 2 },
                { name: 'Transfer Market', depth: 2 },
                { name: 'Premier League', depth: 1 },
                { name: 'AI', depth: 1 }
            ]);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const TrendingRenderer = {
        renderBar: function (activeTrends) {
            const container = document.getElementById('trending-bar'); // Check specific ID

            if (!container) {
                // Determine insertion point if missing (demo wrapper)
                this.injectWrapper();
                return; // Retry next tick or assume injected
            }

            container.innerHTML = `
                <div class="trending-label">Trending Now:</div>
                <div class="trending-list">
                    ${activeTrends.map((t, index) => `
                        <span class="trend-item">
                            <span class="trend-rank">#${index + 1}</span>
                            ${t.name}
                            <span class="trend-heat">🔥</span>
                        </span>
                    `).join('')}
                </div>
            `;
        },

        highlightTags: function (activeTrends) {
            // Find specific tags on page and add fire style
            const trendNames = activeTrends.map(t => t.name);
            const tags = document.querySelectorAll('.topic-tag');

            tags.forEach(tag => {
                const tagName = tag.textContent.trim();
                if (trendNames.includes(tagName)) {
                    tag.classList.add('is-trending');
                    if (!tag.querySelector('.fire-icon')) {
                        tag.innerHTML += ' <span class="fire-icon">🔥</span>';
                    }
                } else {
                    tag.classList.remove('is-trending');
                    const fire = tag.querySelector('.fire-icon');
                    if (fire) fire.remove();
                }
            });
        },

        injectWrapper: function () {
            if (!document.getElementById('trending-bar')) {
                const div = document.createElement('div');
                div.id = 'trending-bar';
                div.className = 'trending-bar';
                // Insert at top of content usually, here appending to body for demo visibility
                // Or try to put it before main content
                const main = document.querySelector('main') || document.body;
                main.insertBefore(div, main.firstChild);

                // Re-render immediately
                this.renderBar(state.activeTrends);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.TrendingSystem = {
        init: TrendingEngine.initialize.bind(TrendingEngine),
        addHit: (topicName) => TrendingEngine.ingestTopics([{ name: topicName, depth: 1 }]),
        getTrends: () => state.activeTrends
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TrendingEngine.initialize());
    } else {
        TrendingEngine.initialize();
    }

})();
