/**
 * Layer 143: Recommendation Intelligence Engine
 * AI-driven content ranking based on User Profiling (Layer 140).
 * 
 * Responsibilities:
 * - Subscribes to User Profile updates.
 * - Accesses available content pool.
 * - Calculates personalized "Relevance Scores" for each article.
 * - Generates "Recommended for You" feeds.
 */
export class SportIQRecommendationEngine {
    constructor() {
        this.id = 'layer-143';
        this.name = 'Recommendation Intelligence Engine';
        this.version = '2.0.0';
        this.initialized = false;

        this.cache = {
            recommendations: [],
            lastGenerated: 0
        };

        this.config = {
            weights: {
                interest_match: 5.0, // High importance on user interests
                recency: 2.0,        // Freshness matters
                popularity: 1.0,     // Crowd wisdom
                random_discovery: 0.5 // Serendipity
            },
            decay_hours: 48 // Content older than this gets penalized heavily
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🧠 Initializing ${this.name}...`);

        await this.loadConfig();
        this.bindEvents();

        this.initialized = true;

        // Register
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }

        // Initial generation attempt (if data exists)
        setTimeout(() => this.generateRecommendations(), 2000);
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer143.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('🧠 RecSys Config Loaded');
            }
        } catch (e) {
            console.warn('Using default recsys config');
        }
    }

    bindEvents() {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            // Re-run recommendations when profile changes
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('profile:updated', (profile) => {
                console.log('🧠 RecSys detected profile update, regenerating feed...');
                this.generateRecommendations(profile);
            });

            // Re-run when new content arrives
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('content:new', () => {
                this.generateRecommendations();
            });
        }
    }

    /**
     * Core Ranking Algorithm
     */
    generateRecommendations(profileOverride = null) {
        const profile = profileOverride || window.SportIQProfile || { interestVector: {} };
        const contentPool = this.getContentPool();

        if (contentPool.length === 0) return;

        console.log('🧠 RecSys: Ranking ' + contentPool.length + ' items...');

        const ranked = contentPool.map(article => {
            const score = this.calculateScore(article, profile);
            return { ...article, relevanceScore: score };
        });

        // Sort descending by score
        ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

        this.cache.recommendations = ranked;
        this.cache.lastGenerated = Date.now();

        console.log('🧠 Top Recommendation:', ranked[0]?.title, 'Score:', ranked[0]?.relevanceScore);

        // Broadcast
        window.__ANTIGRAVITY_EVENT_BUS__?.publish('recommendations:ready', {
            count: ranked.length,
            top: ranked.slice(0, 3)
        });
    }

    calculateScore(article, profile) {
        let score = 0;
        const weights = this.config.weights;

        // 1. Interest Vector Matching
        let interestScore = 0;
        if (article.tags && profile.interestVector) {
            article.tags.forEach(tag => {
                const normalized = tag.toLowerCase().trim();
                const userInterest = profile.interestVector[normalized] || 0;
                interestScore += userInterest;
            });
        }
        score += (interestScore * weights.interest_match);

        // 2. Recency Scoring (Linear decay)
        const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
        let recencyScore = Math.max(0, 1 - (ageHours / this.config.decay_hours));
        score += (recencyScore * scaleFactor(10) * weights.recency);

        // 3. Popularity (Simulated or Real)
        const popularity = article.popularity || 0;
        score += (popularity * weights.popularity);

        // 4. Random Discovery (Serendipity)
        score += (Math.random() * weights.random_discovery);

        return parseFloat(score.toFixed(2));
    }

    getContentPool() {
        // In a real app, this would fetch from Layer 8 (API) or Layer 9 (Store)
        // Here we try to access global store or use dummy data if early in boot
        if (window.__ANTIGRAVITY_STATE__?.get) {
            const articles = window.__ANTIGRAVITY_STATE__.get('articles');
            if (articles && articles.length) return articles;
        }

        // Fallback: Check for any global article variable or return Dummy for demonstration
        if (window.SPORTIQ_ARTICLES) return window.SPORTIQ_ARTICLES;

        return [];
    }

    /**
     * Public API
     */
    getFeed(limit = 10) {
        return this.cache.recommendations.slice(0, limit);
    }
}

// Helper
function scaleFactor(val) { return val; }

// Runtime Execution
window.Layer143_RecSys = new SportIQRecommendationEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer143_RecSys.init());
} else {
    window.Layer143_RecSys.init();
}
