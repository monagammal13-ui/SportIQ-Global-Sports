/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 117: SOCIAL SENTIMENT ANALYSIS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Simulates analyzing social media reactions to gauge public sentiment.
 * Features: Sentiment scoring (Pos/Neg/Neut), reaction stream, and emotion charts.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        sentiment: {
            keywords: {
                positive: ['amazing', 'win', 'goal', 'great', 'love', 'contract', 'signed'],
                negative: ['loss', 'defeat', 'injury', 'bad', 'sacked', 'crisis']
            },
            simulationInterval: 6000
        },
        selectors: {
            container: '#sentiment-widget'
        }
    };

    const state = {
        currentTopic: null,
        reactions: [],
        stats: { pos: 0, neg: 0, neu: 0 }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SENTIMENT ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SentimentEngine = {
        initialize: function () {
            console.log('❤️ [Sentiment] Engine initialized');

            // Listen for feeds
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.startMonitoring(e.detail.feed);
                }
            });

            // Start simulation loop
            setInterval(() => {
                if (state.currentTopic) this.simulateReaction();
            }, CONFIG.sentiment.simulationInterval);
        },

        startMonitoring: function (feed) {
            state.currentTopic = feed.topics && feed.topics.length > 0 ? feed.topics[0].name : feed.main.category;
            console.log(`❤️ [Sentiment] Monitoring reactions for: ${state.currentTopic}`);

            // Determine initial bias based on content
            this.setInitialBias(feed.main.headline);

            this.renderWidget();
        },

        setInitialBias: function (text) {
            const lower = text.toLowerCase();
            let score = 0;
            CONFIG.sentiment.keywords.positive.forEach(k => { if (lower.includes(k)) score++; });
            CONFIG.sentiment.keywords.negative.forEach(k => { if (lower.includes(k)) score--; });

            // Reset stats with slight bias
            state.reactions = [];
            state.stats = {
                pos: score > 0 ? 5 : 2,
                neg: score < 0 ? 5 : 2,
                neu: 3
            };
        },

        simulateReaction: function () {
            // Randomly generate a tweet-like reaction
            const type = Math.random();
            let sentiment = 'neutral';
            let text = '';

            const users = ['@fan_123', '@sport_lover', '@city_boy', '@pundit_dave'];
            const user = users[Math.floor(Math.random() * users.length)];

            if (type > 0.6) {
                sentiment = 'positive';
                state.stats.pos++;
                text = `This is great news for ${state.currentTopic}! 🔥`;
            } else if (type < 0.3) {
                sentiment = 'negative';
                state.stats.neg++;
                text = `Not sure about this... worrying for ${state.currentTopic}. 😬`;
            } else {
                state.stats.neu++;
                text = `Interesting update on ${state.currentTopic}. 🤔`;
            }

            const reaction = {
                id: Date.now(),
                user: user,
                text: text,
                sentiment: sentiment
            };

            state.reactions.unshift(reaction);
            if (state.reactions.length > 5) state.reactions.pop(); // Keep last 5

            this.updateUI();
        },

        getPercentage: function () {
            const total = state.stats.pos + state.stats.neg + state.stats.neu;
            if (total === 0) return { pos: 0, neg: 0, neu: 0 };
            return {
                pos: Math.round((state.stats.pos / total) * 100),
                neg: Math.round((state.stats.neg / total) * 100),
                neu: Math.round((state.stats.neu / total) * 100)
            };
        },

        renderWidget: function () {
            // Inject if missing
            if (!document.querySelector(CONFIG.selectors.container)) {
                const div = document.createElement('div');
                div.id = 'sentiment-widget';
                // Try to place after article content or in sidebar
                // For now, append to body for demo visibility
                const existing = document.getElementById('sentiment-demo-wrapper');
                if (existing) existing.appendChild(div);
            }
            this.updateUI();
        },

        updateUI: function () {
            const container = document.querySelector(CONFIG.selectors.container);
            if (!container) return;

            const pct = this.getPercentage();

            container.innerHTML = `
                <div class="sentiment-card">
                    <h3>Social Sentiment: ${state.currentTopic || 'General'}</h3>
                    
                    <div class="sentiment-bar-multi">
                        <div class="sent-seg pos" style="flex: ${pct.pos}"></div>
                        <div class="sent-seg neu" style="flex: ${pct.neu}"></div>
                        <div class="sent-seg neg" style="flex: ${pct.neg}"></div>
                    </div>
                    
                    <div class="sentiment-legend">
                        <span class="l-item pos">${pct.pos}% Positive</span>
                        <span class="l-item neu">${pct.neu}% Neutral</span>
                        <span class="l-item neg">${pct.neg}% Negative</span>
                    </div>

                    <div class="reaction-stream">
                        ${state.reactions.map(r => `
                            <div class="reaction-item ${r.sentiment}">
                                <div class="r-user">${r.user}</div>
                                <div class="r-text">${r.text}</div>
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

    window.SocialSentiment = {
        init: SentimentEngine.initialize.bind(SentimentEngine),
        monitor: SentimentEngine.startMonitoring.bind(SentimentEngine),

        injectDemo: (id) => {
            const div = document.createElement('div');
            div.id = 'sentiment-demo-wrapper';
            div.style.margin = '20px 0';
            document.body.appendChild(div);

            // Trigger mock
            SentimentEngine.startMonitoring({
                main: { headline: 'Great win text', category: 'Football' },
                topics: [{ name: 'Liverpool FC' }]
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SentimentEngine.initialize());
    } else {
        SentimentEngine.initialize();
    }

})();
