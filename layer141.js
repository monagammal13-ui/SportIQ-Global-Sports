/**
 * Layer 141: Fan Engagement Engine
 * Real-time system for processing user interactions and driving engagement loops.
 * 
 * Responsibilities:
 * - High-speed event listener for User Interactions (Like, Share, Comment, Poll Vote)
 * - Calculates "Engagement Velocity" for content
 * - Triggers instant feedback/rewards
 * - Broadcasts engagement metrics to Analytics & Profiling layers
 */

export class SportIQFanEngagementEngine {
    constructor() {
        this.id = 'layer-141';
        this.name = 'Fan Engagement Engine';
        this.version = '2.0.0';
        this.initialized = false;

        this.sessionStats = {
            likes: 0,
            shares: 0,
            comments: 0,
            totalScore: 0
        };

        this.config = {
            points: {
                like: 10,
                dislike: -5,
                share: 50,
                comment: 30,
                bookmark: 20
            },
            thresholds: {
                "high_engagement": 100, // Score to trigger a "Fan Badge" or animation
                "viral_velocity": 5     // Interations per minute
            }
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🔥 Initializing ${this.name}...`);

        await this.loadConfig();
        this.bindEvents();

        this.initialized = true;

        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }

        // Announce readiness
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.publish('engagement:ready', { layer: this.id });
        }
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer141.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('🔥 Engagement Config Loaded');
            }
        } catch (e) {
            console.warn('Using default engagement config');
        }
    }

    bindEvents() {
        // 1. Delegate Global DOM clicks for engagement actions
        document.body.addEventListener('click', (e) => {
            // Check for buttons with data-action attribute
            const target = e.target.closest('[data-engage-action]');
            if (target) {
                const action = target.dataset.engageAction; // like, share, etc.
                const contentId = target.dataset.contentId;
                this.processInteraction(action, contentId, target);
            }
        });

        // 2. Listen for Event Bus triggers (internal logic events)
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('ui:interaction', (data) => {
                this.processInteraction(data.action, data.contentId);
            });
        }
    }

    /**
     * Core Processing Logic
     */
    processInteraction(action, contentId, uiElement = null) {
        if (!this.config.points[action]) return; // Unknown action

        const points = this.config.points[action];
        this.sessionStats.totalScore += points;

        // Update specific counters
        if (this.sessionStats[action + 's'] !== undefined) {
            this.sessionStats[action + 's']++;
        }

        console.log(`🔥 Interaction Processed: ${action} (+${points}pts) on ${contentId}`);

        // 1. Trigger Visual Feedback (Optimistic UI)
        if (uiElement) {
            this.triggerVisualReaction(uiElement, action);
        }

        // 2. Broadcast Event for Profiling (Layer 140 listens to this)
        this.emitEngagementEvent(action, contentId, points);

        // 3. Check Thresholds
        this.checkEngagementThresholds();
    }

    triggerVisualReaction(element, action) {
        // Simple scale vibration effect
        element.style.transform = 'scale(1.2)';
        element.style.transition = 'transform 0.1s ease';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);

        // If it's a like, maybe toggle a class
        if (action === 'like') {
            element.classList.toggle('active');
        }
    }

    emitEngagementEvent(action, contentId, points) {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        // "ui:click" event for general UI
        window.__ANTIGRAVITY_EVENT_BUS__.publish('ui:click', {
            type: 'engagement',
            action: action,
            contentId: contentId,
            points: points,
            timestamp: Date.now()
        });

        // Specific engagement event
        window.__ANTIGRAVITY_EVENT_BUS__.publish('fan:interaction', {
            action,
            points,
            contentId,
            currentSessionScore: this.sessionStats.totalScore
        });
    }

    checkEngagementThresholds() {
        if (this.sessionStats.totalScore >= this.config.thresholds.high_engagement) {
            console.log('🔥 HIGH ENGAGEMENT THRESHOLD REACHED');
            // Emit special event that might trigger a pop-up or badge
            window.__ANTIGRAVITY_EVENT_BUS__?.publish('fan:achievement', {
                type: 'high_engagement',
                message: 'You are on fire! 🔥'
            });
            // Reset threshold trigger to avoid spamming (or handle tiers)
        }
    }

    /**
     * Public API to get current score
     */
    getSessionScore() {
        return this.sessionStats.totalScore;
    }
}

// Runtime Execution
window.Layer141_FanEngagement = new SportIQFanEngagementEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer141_FanEngagement.init());
} else {
    window.Layer141_FanEngagement.init();
}
