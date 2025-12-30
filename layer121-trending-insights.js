/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 121: AI-POWERED TRENDING INSIGHTS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Analyzes user behavior velocity to detect "breakout" trends and generate
 *          qualitative AI insights about *why* something is trending.
 * Features: Velocity tracking, demographic segmentation (mock), and NLP insight generation.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        insights: {
            samplingWindow: 10, // clicks to analyze batch
            breakoutThreshold: 1.5 // 50% increase required
        },
        selectors: {
            container: '#trending-insights-widget'
        }
    };

    const state = {
        interactions: [], // Stream of {topic, timestamp}
        topicBaseline: new Map(),
        generatedInsights: []
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INSIGHTS ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const InsightEngine = {
        initialize: function () {
            console.log('📈 [Insights] Engine initialized');

            // Listen to interaction events (Simulating listening to Layer 88 Analytics)
            document.addEventListener('analytics:interaction', (e) => {
                if (e.detail) this.trackInteraction(e.detail);
            });

            // Start Analysis Loop
            setInterval(() => this.analyzeTrends(), 8000);

            // Seed baseline for demo
            state.topicBaseline.set('Football', 10);
            state.topicBaseline.set('F1', 5);
        },

        trackInteraction: function (data) {
            // data exp: { topic: 'Football', action: 'click' }
            state.interactions.push({
                topic: data.topic,
                time: Date.now()
            });
            console.log(`📈 [Insights] Tracked hit: ${data.topic}`);
        },

        analyzeTrends: function () {
            if (state.interactions.length === 0) return;

            // Group recent interactions
            const recentCounts = {};
            state.interactions.forEach(i => {
                recentCounts[i.topic] = (recentCounts[i.topic] || 0) + 1;
            });

            // Compare vs Baseline & Generate Insights
            const newInsights = [];

            Object.keys(recentCounts).forEach(topic => {
                const current = recentCounts[topic];
                const baseline = state.topicBaseline.get(topic) || 1; // Avoid div/0

                const velocity = current / baseline; // > 1.0 is growth

                if (velocity >= CONFIG.insights.breakoutThreshold) {
                    newInsights.push(this.generateNarrative(topic, velocity));
                }

                // Update baseline (moving average)
                state.topicBaseline.set(topic, (baseline + current) / 2);
            });

            if (newInsights.length > 0) {
                state.generatedInsights = [...newInsights, ...state.generatedInsights].slice(0, 3);
                InsightRenderer.render(state.generatedInsights);
            }

            // Clear batch
            state.interactions = [];
        },

        generateNarrative: function (topic, velocity) {
            // Simple template-based NLG
            const pct = Math.round((velocity - 1) * 100);
            const templates = [
                `Interest in <strong>${topic}</strong> is spiking (+${pct}%) right now.`,
                `User engagement with <strong>${topic}</strong> has accelerated rapidly.`,
                `Breakout Alert: <strong>${topic}</strong> is dominating the feed this minute.`
            ];

            return {
                id: Date.now(),
                text: templates[Math.floor(Math.random() * templates.length)],
                metric: `+${pct}%`,
                topic: topic
            };
        },

        injectDemo: function () {
            if (!document.getElementById('trending-insights-widget')) {
                const div = document.createElement('div');
                div.id = 'trending-insights-widget';
                div.style.margin = '20px 0';
                // Try sidebar or bottom
                document.body.appendChild(div);
            }

            // Simulate heavy traffic
            console.log('📈 [Insights] Simulating viral event...');
            for (let i = 0; i < 20; i++) this.trackInteraction({ topic: 'Viral News' });

            // Trigger analysis
            this.analyzeTrends();
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const InsightRenderer = {
        render: function (insights) {
            const container = document.querySelector(CONFIG.selectors.container);
            if (!container) return;

            container.innerHTML = `
                <div class="insights-card">
                    <div class="ins-header">
                        <h3>⚡ Live Market Insights</h3>
                        <div class="pulse-dot"></div>
                    </div>
                    <div class="ins-list">
                        ${insights.map(item => `
                            <div class="ins-item">
                                <div class="ins-metric">${item.metric}</div>
                                <div class="ins-text">${item.text}</div>
                            </div>
                        `).join('')}
                    </div>
                    ${insights.length === 0 ? '<div class="ins-empty">Analyzing user patterns...</div>' : ''}
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.TrendingInsights = {
        init: InsightEngine.initialize.bind(InsightEngine),
        track: InsightEngine.trackInteraction.bind(InsightEngine),
        demo: InsightEngine.injectDemo.bind(InsightEngine),

        // Debug
        getBaseline: () => state.topicBaseline
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => InsightEngine.initialize());
    } else {
        InsightEngine.initialize();
    }

})();
