/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 120: AI-POWERED RELATED CONTENT ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Delivers personalized multimedia recommendations based on context & behavior.
 * Features: Contextual matching, user history weighting, and mixed-media suggestions.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        recommendation: {
            maxItems: 4,
            weights: {
                topicMatch: 0.5,
                categoryMatch: 0.3,
                trendingBonus: 0.2
            }
        },
        selectors: {
            container: '#ai-related-content'
        }
    };

    // Mock Content Database (Articles + Videos)
    const CONTENT_DB = [
        { id: 'rel_1', title: 'Top 10 Goals of the Month', type: 'video', category: 'Football', topics: ['goals', 'highlights'], img: 'https://via.placeholder.com/150/000000/FFFFFF?text=Goals' },
        { id: 'rel_2', title: 'Transfer Deadline Day Live', type: 'article', category: 'Football', topics: ['transfer', 'deadline'], img: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Transfer' },
        { id: 'rel_3', title: 'F1: Hamilton Speaks Out', type: 'article', category: 'Motorsport', topics: ['f1', 'hamilton'], img: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=F1' },
        { id: 'rel_4', title: 'Tactical Analysis: City vs Arsenal', type: 'video', category: 'Football', topics: ['tactics', 'analysis'], img: 'https://via.placeholder.com/150/008000/FFFFFF?text=Tactics' },
        { id: 'rel_5', title: 'NBA Playoffs Prediction', type: 'article', category: 'Basketball', topics: ['nba', 'playoffs'], img: 'https://via.placeholder.com/150/FFA500/FFFFFF?text=NBA' },
        { id: 'rel_6', title: 'Exclusive Interview: The Goat', type: 'video', category: 'General', topics: ['interview', 'exclusive'], img: 'https://via.placeholder.com/150/800080/FFFFFF?text=Interview' }
    ];

    const state = {
        userHistory: [], // IDs of viewed items
        currentContext: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AI RECOMMENDATION ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const RelatedContentEngine = {
        initialize: function () {
            console.log('🤖 [RelatedAI] Engine initialized');

            // Listen for feed generation (Context)
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.updateContext(e.detail.feed);
                }
            });
        },

        updateContext: function (feed) {
            state.currentContext = {
                id: feed.id,
                category: feed.main.category,
                topics: (feed.main.tags || []).map(t => t.toLowerCase())
            };

            // Track view
            state.userHistory.push(feed.id);
            if (state.userHistory.length > 10) state.userHistory.shift();

            console.log(`🤖 [RelatedAI] Context updated: ${state.currentContext.category}`);

            this.generateRecommendations();
        },

        generateRecommendations: function () {
            if (!state.currentContext) return;

            // Simple Weighted Scoring Algorithm
            const scored = CONTENT_DB.map(item => {
                // Don't recommend self
                if (item.id === state.currentContext.id) return { ...item, score: -1 };

                let score = 0;

                // 1. Category Match
                if (item.category === state.currentContext.category) {
                    score += CONFIG.recommendation.weights.categoryMatch;
                }

                // 2. Topic Overlap
                const itemTopics = item.topics || [];
                const overlap = itemTopics.filter(t => state.currentContext.topics.includes(t.toLowerCase())).length;
                score += (overlap * CONFIG.recommendation.weights.topicMatch);

                // 3. User History (Boost if similar to recently viewed)
                // (Simplified: random drift for variety in this demo)
                score += Math.random() * 0.1;

                return { ...item, score };
            });

            // Sort and Slice
            const topPicks = scored
                .sort((a, b) => b.score - a.score)
                .slice(0, CONFIG.recommendation.maxItems);

            console.log('🤖 [RelatedAI] Top picks:', topPicks.map(p => p.title).join(', '));

            RelatedRenderer.render(topPicks);
        },

        injectDemo: function () {
            if (!document.getElementById('ai-related-content')) {
                const div = document.createElement('div');
                div.id = 'ai-related-content';
                div.style.margin = '20px 0';
                // Place near bottom
                document.body.appendChild(div);
            }
            // Trigger with dummy context
            this.updateContext({
                id: 'demo_curr',
                main: { category: 'Football', tags: ['goals', 'transfer'] }
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const RelatedRenderer = {
        render: function (items) {
            const container = document.querySelector(CONFIG.selectors.container);
            if (!container) return;

            container.innerHTML = `
                <div class="related-ai-wrapper">
                    <div class="rai-header">
                        <h3>Recommended For You</h3>
                        <span class="rai-badge">AI POWERED</span>
                    </div>
                    <div class="rai-grid">
                        ${items.map(item => `
                            <div class="rai-card type-${item.type}">
                                <div class="rai-img">
                                    <img src="${item.img}" alt="${item.title}">
                                    ${item.type === 'video' ? '<span class="play-indicator">▶</span>' : ''}
                                </div>
                                <div class="rai-content">
                                    <span class="rai-cat">${item.category}</span>
                                    <h4>${item.title}</h4>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.RelatedContentAI = {
        init: RelatedContentEngine.initialize.bind(RelatedContentEngine),
        refresh: RelatedContentEngine.generateRecommendations.bind(RelatedContentEngine),
        demo: RelatedContentEngine.injectDemo.bind(RelatedContentEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => RelatedContentEngine.initialize());
    } else {
        RelatedContentEngine.initialize();
    }

})();
