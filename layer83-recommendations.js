/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 83: PERSONALIZED RECOMMENDATIONS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Behavior tracking, recommendation algorithms, personalization
 * Features: User profiling, collaborative filtering, content-based recommendations
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        recommendations: {
            configPath: '../api-json/recommendations-config.json',
            storagePrefix: 'sportiq_reco_',
            maxRecommendations: 10,
            updateInterval: 30000 // 30 seconds
        },
        events: {
            behaviorTracked: 'reco:behavior-tracked',
            recommendationsUpdated: 'reco:updated',
            profileUpdated: 'reco:profile-updated'
        }
    };

    const state = {
        userProfile: null,
        behaviors: [],
        recommendations: [],
        contentItems: new Map(),
        affinities: new Map(),
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // USER PROFILE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const ProfileManager = {
        initialize: function (userId = 'guest') {
            const stored = this.load(userId);

            state.userProfile = stored || {
                userId,
                preferences: {
                    sports: [],
                    teams: [],
                    players: [],
                    categories: []
                },
                interests: new Map(),
                history: [],
                created: Date.now(),
                lastUpdated: Date.now()
            };

            console.log('✅ [Reco] Profile initialized:', userId);
        },

        updatePreference: function (type, value, weight = 1) {
            if (!state.userProfile.preferences[type]) {
                state.userProfile.preferences[type] = [];
            }

            if (!state.userProfile.preferences[type].includes(value)) {
                state.userProfile.preferences[type].push(value);
            }

            // Update interest weight
            const key = `${type}:${value}`;
            const current = state.affinities.get(key) || 0;
            state.affinities.set(key, current + weight);

            this.save();

            const event = new CustomEvent(CONFIG.events.profileUpdated, {
                detail: { type, value, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        addToHistory: function (contentId, action = 'view') {
            state.userProfile.history.unshift({
                contentId,
                action,
                timestamp: Date.now()
            });

            // Keep last 100 items
            if (state.userProfile.history.length > 100) {
                state.userProfile.history = state.userProfile.history.slice(0, 100);
            }

            this.save();
        },

        save: function () {
            state.userProfile.lastUpdated = Date.now();
            try {
                localStorage.setItem(
                    CONFIG.recommendations.storagePrefix + 'profile',
                    JSON.stringify({
                        ...state.userProfile,
                        interests: Array.from(state.affinities.entries())
                    })
                );
            } catch (e) {
                console.warn('⚠️ [Reco] Failed to save profile');
            }
        },

        load: function (userId) {
            try {
                const data = localStorage.getItem(CONFIG.recommendations.storagePrefix + 'profile');
                if (data) {
                    const profile = JSON.parse(data);
                    if (profile.interests) {
                        state.affinities = new Map(profile.interests);
                    }
                    return profile;
                }
            } catch (e) { }
            return null;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BEHAVIOR TRACKER
    // ═══════════════════════════════════════════════════════════════════════

    const BehaviorTracker = {
        track: function (event) {
            const behavior = {
                type: event.type || 'view',
                contentId: event.contentId,
                category: event.category,
                tags: event.tags || [],
                timestamp: Date.now(),
                duration: event.duration || 0
            };

            state.behaviors.push(behavior);

            // Update profile based on behavior
            this.updateProfile(behavior);

            // Keep last 200 behaviors
            if (state.behaviors.length > 200) {
                state.behaviors = state.behaviors.slice(0, 200);
            }

            const evt = new CustomEvent(CONFIG.events.behaviorTracked, {
                detail: behavior
            });
            document.dispatchEvent(evt);

            console.log('📊 [Reco] Behavior tracked:', behavior.type, behavior.contentId);
        },

        updateProfile: function (behavior) {
            // Update category preference
            if (behavior.category) {
                ProfileManager.updatePreference('categories', behavior.category, 1);
            }

            // Update tag preferences
            behavior.tags.forEach(tag => {
                ProfileManager.updatePreference('tags', tag, 0.5);
            });

            // Add to history
            ProfileManager.addToHistory(behavior.contentId, behavior.type);
        },

        getRecent: function (limit = 50) {
            return state.behaviors.slice(0, limit);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RECOMMENDATION ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const RecommendationEngine = {
        generate: function () {
            const recommendations = [];

            // Content-based filtering
            const contentBased = this.contentBasedFiltering();
            recommendations.push(...contentBased);

            // Collaborative filtering (simulated)
            const collaborative = this.collaborativeFiltering();
            recommendations.push(...collaborative);

            // Trending content
            const trending = this.getTrending();
            recommendations.push(...trending);

            // Remove duplicates and sort by score
            const unique = this.deduplicateAndScore(recommendations);

            state.recommendations = unique.slice(0, CONFIG.recommendations.maxRecommendations);

            const event = new CustomEvent(CONFIG.events.recommendationsUpdated, {
                detail: { count: state.recommendations.length, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log(`✨ [Reco] Generated ${state.recommendations.length} recommendations`);

            return state.recommendations;
        },

        contentBasedFiltering: function () {
            const recommendations = [];
            const userInterests = Array.from(state.affinities.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            // Find content matching user interests
            state.contentItems.forEach((content) => {
                let score = 0;

                userInterests.forEach(([key, weight]) => {
                    const [type, value] = key.split(':');

                    if (type === 'categories' && content.category === value) {
                        score += weight * 2;
                    }

                    if (type === 'tags' && content.tags && content.tags.includes(value)) {
                        score += weight;
                    }
                });

                // Don't recommend recently viewed
                const viewed = state.userProfile.history.slice(0, 20)
                    .find(h => h.contentId === content.id);

                if (!viewed && score > 0) {
                    recommendations.push({
                        contentId: content.id,
                        score,
                        reason: 'Based on your interests',
                        content
                    });
                }
            });

            return recommendations;
        },

        collaborativeFiltering: function () {
            // Simplified collaborative filtering
            // In production, use actual user similarity
            const recommendations = [];
            const recentBehaviors = BehaviorTracker.getRecent(10);

            recentBehaviors.forEach(behavior => {
                const similar = this.findSimilarContent(behavior.contentId);
                recommendations.push(...similar);
            });

            return recommendations;
        },

        findSimilarContent: function (contentId) {
            const baseContent = state.contentItems.get(contentId);
            if (!baseContent) return [];

            const similar = [];

            state.contentItems.forEach((content) => {
                if (content.id === contentId) return;

                let similarity = 0;

                // Category match
                if (content.category === baseContent.category) {
                    similarity += 3;
                }

                // Tag overlap
                if (content.tags && baseContent.tags) {
                    const overlap = content.tags.filter(t => baseContent.tags.includes(t));
                    similarity += overlap.length;
                }

                if (similarity > 0) {
                    similar.push({
                        contentId: content.id,
                        score: similarity,
                        reason: 'Similar to what you viewed',
                        content
                    });
                }
            });

            return similar;
        },

        getTrending: function () {
            // Simulate trending based on recent engagement
            const trending = [];
            const recentItems = Array.from(state.contentItems.values()).slice(0, 5);

            recentItems.forEach(content => {
                trending.push({
                    contentId: content.id,
                    score: 1,
                    reason: 'Trending now',
                    content
                });
            });

            return trending;
        },

        deduplicateAndScore: function (recommendations) {
            const map = new Map();

            recommendations.forEach(rec => {
                if (map.has(rec.contentId)) {
                    const existing = map.get(rec.contentId);
                    existing.score += rec.score;
                } else {
                    map.set(rec.contentId, rec);
                }
            });

            return Array.from(map.values())
                .sort((a, b) => b.score - a.score);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT REGISTRY
    // ═══════════════════════════════════════════════════════════════════════

    const ContentRegistry = {
        register: function (content) {
            state.contentItems.set(content.id, {
                id: content.id,
                title: content.title,
                category: content.category,
                tags: content.tags || [],
                type: content.type || 'article',
                timestamp: content.timestamp || Date.now()
            });
        },

        getAll: function () {
            return Array.from(state.contentItems.values());
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-UPDATE
    // ═══════════════════════════════════════════════════════════════════════

    const AutoUpdate = {
        start: function () {
            this.update();
            this.timerId = setInterval(() => {
                this.update();
            }, CONFIG.recommendations.updateInterval);
        },

        update: function () {
            RecommendationEngine.generate();
        },

        stop: function () {
            if (this.timerId) clearInterval(this.timerId);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✨ LAYER 83: RECOMMENDATIONS ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Initialize profile
        ProfileManager.initialize();

        // Load config
        try {
            const response = await fetch(CONFIG.recommendations.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register sample content
                if (state.config.sampleContent) {
                    state.config.sampleContent.forEach(content => {
                        ContentRegistry.register(content);
                    });
                    console.log(`✅ [Reco] Registered ${state.config.sampleContent.length} content items`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Reco] Failed to load config');
        }

        // Generate initial recommendations
        RecommendationEngine.generate();

        // Start auto-update
        AutoUpdate.start();

        console.log('✅ [Reco] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.RecommendationEngine = {
        // Tracking
        track: BehaviorTracker.track.bind(BehaviorTracker),

        // Profile
        updatePreference: ProfileManager.updatePreference.bind(ProfileManager),
        getProfile: () => state.userProfile,

        // Recommendations
        getRecommendations: () => state.recommendations,
        generateRecommendations: RecommendationEngine.generate.bind(RecommendationEngine),

        // Content
        registerContent: ContentRegistry.register.bind(ContentRegistry),
        getContent: ContentRegistry.getAll.bind(ContentRegistry),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
