/**
 * Layer 140: Advanced User Profiling Engine
 * Upgraded from simple loyalty to full behavioral intelligence.
 * 
 * Responsibilities:
 * - Tracks user interactions (clicks, views, time-on-page)
 * - Computes dynamic interest vectors (e.g., {"Football": 0.8, "Stats": 0.4})
 * - Manages user segments and behavioral archetypes
 * - Persists profile data securely
 */

export class SportIQUserProfilingEngine {
    constructor() {
        this.id = 'layer-140';
        this.name = 'Advanced User Profiling Engine';
        this.version = '2.0.0';
        this.initialized = false;

        // Core State
        this.profile = {
            userId: null,
            interestVector: {}, // { "category": score }
            behaviorHistory: [],
            lastActive: Date.now(),
            segments: []
        };

        this.config = {
            weights: {
                view: 1,
                click: 3,
                share: 10,
                search: 5,
                complete_read: 8
            },
            decayRate: 0.98, // Daily decay factor
            maxHistoryItems: 100
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🧠 Initializing ${this.name}...`);

        await this.loadConfiguration();
        this.loadProfileFromStorage();
        this.setupEventListeners();
        this.applyDecay();

        this.initialized = true;

        // Register with Orchestrator
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        } else {
            console.warn("RuntimeOrchestrator not found, running standalone.");
        }

        this.emitProfileUpdate();
    }

    async loadConfiguration() {
        try {
            const resp = await fetch('../api-json/layer140.json');
            if (resp.ok) {
                const json = await resp.json();
                this.config = { ...this.config, ...json };
                console.log('🧠 Profiling Config Loaded:', this.config);
            }
        } catch (e) {
            console.warn('Using default profiling config');
        }
    }

    setupEventListeners() {
        // Listen to Global Bus
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            const bus = window.__ANTIGRAVITY_EVENT_BUS__;

            bus.subscribe('article:view', (data) => this.trackInteraction('view', data));
            bus.subscribe('article:read_complete', (data) => this.trackInteraction('complete_read', data));
            bus.subscribe('ui:click', (data) => this.trackInteraction('click', data));
            bus.subscribe('search:query', (data) => this.trackInteraction('search', data));
        }

        // Fallback: Direct DOM listeners for basic interactions if Bus isn't fully ready
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.saveProfile();
        });
    }

    /**
     * Core tracking logic
     * @param {string} type - Interaction type (view, click, etc.)
     * @param {object} metadata - Context (tags, category, id)
     */
    trackInteraction(type, metadata) {
        if (!metadata) return;

        const weight = this.config.weights[type] || 1;
        const timestamp = Date.now();

        // 1. Update History
        this.profile.behaviorHistory.unshift({ type, metadata, timestamp });
        if (this.profile.behaviorHistory.length > this.config.maxHistoryItems) {
            this.profile.behaviorHistory.pop();
        }

        // 2. Update Interest Vector
        if (metadata.tags && Array.isArray(metadata.tags)) {
            metadata.tags.forEach(tag => this.boostInterest(tag, weight));
        }
        if (metadata.category) {
            this.boostInterest(metadata.category, weight);
        }

        // 3. Update Status
        this.profile.lastActive = timestamp;
        this.saveProfile(); // Debounce this in production

        // 4. Real-time Feedback
        console.log(`🧠 Profile Updated [${type}]:`, this.profile.interestVector);
    }

    boostInterest(topic, amount) {
        if (!topic) return;
        const normalizedTopic = topic.toLowerCase().trim();
        const currentScore = this.profile.interestVector[normalizedTopic] || 0;
        this.profile.interestVector[normalizedTopic] = parseFloat((currentScore + amount).toFixed(2));
    }

    /**
     * Applies time-based decay to interest scores to keep profile fresh
     */
    applyDecay() {
        const now = Date.now();
        const daysSinceLastActive = (now - this.profile.lastActive) / (1000 * 60 * 60 * 24);

        if (daysSinceLastActive > 0.5) {
            const factor = Math.pow(this.config.decayRate, daysSinceLastActive);
            for (const key in this.profile.interestVector) {
                this.profile.interestVector[key] *= factor;
                if (this.profile.interestVector[key] < 0.1) {
                    delete this.profile.interestVector[key]; // Prune low interests
                }
            }
            this.profile.lastActive = now;
            this.saveProfile();
        }
    }

    loadProfileFromStorage() {
        const stored = localStorage.getItem('sportiq_user_profile_v2');
        if (stored) {
            try {
                this.profile = JSON.parse(stored);
            } catch (e) {
                console.error('Profile corruption, resetting.');
            }
        } else {
            // Generate Anonymous ID
            this.profile.userId = 'anon_' + Math.random().toString(36).substr(2, 9);
        }
    }

    saveProfile() {
        try {
            localStorage.setItem('sportiq_user_profile_v2', JSON.stringify(this.profile));
            this.emitProfileUpdate();
        } catch (e) {
            console.warn('Storage quota exceeded for profile');
        }
    }

    emitProfileUpdate() {
        // Broadcast profile change to Personalization Layer
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.publish('profile:updated', this.profile);
        }

        // Expose globally
        window.SportIQProfile = this.profile;
    }

    /**
     * Public API: Get user segments
     */
    getSegments() {
        const segments = [];
        const vector = this.profile.interestVector;

        if (vector['football'] > 20) segments.push('Football Fanatic');
        if (vector['betting'] > 10) segments.push('Better');
        if (vector['stats'] > 15) segments.push('Analyst');

        return segments;
    }

    /**
     * Public API: Get top N interests
     */
    getTopInterests(limit = 5) {
        return Object.entries(this.profile.interestVector)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([topic]) => topic);
    }
}

// Runtime Execution
window.Layer140_UserProfiling = new SportIQUserProfilingEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer140_UserProfiling.init());
} else {
    window.Layer140_UserProfiling.init();
}
