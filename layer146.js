/**
 * Layer 146: AI Insight & Prediction Layer
 * Lightweight client-side inference engine for predicting trends and user behavior shifts.
 * 
 * Responsibilities:
 * - Analyzes time-series data from engagement layers.
 * - Detects "Velocity Spikes" (e.g., Topic X is gaining traction rapidly).
 * - Predicts next-likely-action (NLA) for users.
 * - Broadcasts insights to SEO and Editorial layers.
 */
export class SportIQInsightEngine {
    constructor() {
        this.id = 'layer-146';
        this.name = 'AI Insight & Prediction Engine';
        this.version = '2.0.0';
        this.initialized = false;

        this.trendBuffer = []; // Moving window of topic mentions
        this.insights = {
            risingTopics: [],
            predictedShift: null
        };

        this.config = {
            windowSize: 50, // Number of events to analyze
            velocityThreshold: 2.5, // Multiplier avg to be considered a spike
            scanInterval: 10000 // 10s
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🧠 Initializing ${this.name}...`);

        await this.loadConfig();
        this.bindEvents();
        this.startAnalysisLoop();

        this.initialized = true;

        // Register
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer146.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('🧠 Insight Config Loaded');
            }
        } catch (e) { console.warn('Using default insight config'); }
    }

    bindEvents() {
        // Feed the data buffer
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('article:view', (data) => this.ingestDatapoint(data));
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('search:query', (data) => this.ingestDatapoint(data));
        }
    }

    ingestDatapoint(data) {
        if (!data) return;

        // Extract topic
        const topic = data.category || data.query || (data.tags ? data.tags[0] : null);
        if (topic) {
            this.trendBuffer.push({ topic, time: Date.now() });

            // Keep buffer size constant
            if (this.trendBuffer.length > this.config.windowSize * 2) {
                this.trendBuffer.shift();
            }
        }
    }

    startAnalysisLoop() {
        setInterval(() => this.analyzeTrends(), this.config.scanInterval);
    }

    /**
     * Core Analysis Logic (Simplified Moving Average)
     */
    analyzeTrends() {
        if (this.trendBuffer.length < 10) return;

        const now = Date.now();
        const recent = this.trendBuffer.filter(d => (now - d.time) < 60000); // Last 1 min

        if (recent.length === 0) return;

        // Histogram
        const counts = {};
        recent.forEach(d => {
            counts[d.topic] = (counts[d.topic] || 0) + 1;
        });

        // Detect Spikes
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        const topTopic = sorted[0];

        if (topTopic) {
            const [topic, count] = topTopic;
            const velocity = count / (recent.length / Object.keys(counts).length || 1);

            if (velocity > this.config.velocityThreshold) {
                this.emitInsight('trend_spike', { topic, velocity: parseFloat(velocity.toFixed(2)) });
            }
        }

        // Predict Shift (e.g., User moving from Sport A to Sport B)
        // This relies on accessing the Layer 140 Profile
        if (window.SportIQProfile) {
            this.predictUserInterestShift(window.SportIQProfile);
        }
    }

    predictUserInterestShift(profile) {
        // Simple logic: If recent history shows rapid decline in top interest, predict churn
        // For now, we simulate a "Discovery" insight
        const interests = Object.keys(profile.interestVector || {});
        if (interests.length > 3) {
            // Suggest a synergy (e.g., likes Football + Betting -> Suggest "Odds Analysis")
            if (profile.interestVector['football'] && profile.interestVector['betting']) {
                this.emitInsight('editorial_suggestion', {
                    suggestion: "Create content about Football Betting Odds",
                    confidence: 0.85
                });
            }
        }
    }

    emitInsight(type, data) {
        // Debounce simple insights
        const key = `${type}:${JSON.stringify(data)}`;
        if (this.insights[key]) return;
        this.insights[key] = true;
        setTimeout(() => delete this.insights[key], 60000); // Clear after minute

        console.log(`🧠 AI Insight [${type}]:`, data);

        window.__ANTIGRAVITY_EVENT_BUS__?.publish('ai:insight', { type, data });
    }
}

// Runtime Execution
window.Layer146_AIInsights = new SportIQInsightEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer146_AIInsights.init());
} else {
    window.Layer146_AIInsights.init();
}
