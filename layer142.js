/**
 * Layer 142: Gamification & Rewards System
 * Manages user progression, levels, badges, and rewards.
 * 
 * Responsibilities:
 * - Listens for 'fan:interaction' events.
 * - Calculates XP and Level advancement.
 * - Unlocks Badges based on accumulation criteria.
 * - Persists gamification state.
 */
export class SportIQGamificationEngine {
    constructor() {
        this.id = 'layer-142';
        this.name = 'Gamification & Rewards Engine';
        this.version = '2.0.0';
        this.initialized = false;

        // Default State
        this.state = {
            xp: 0,
            level: 1,
            badges: [], // list of unlocked badge IDs
            achievements: {} // progress counters e.g., { "likes": 50 }
        };

        this.config = {
            levelCurve: {
                base: 100,
                multiplier: 1.5 // XP needed = base * (level ^ multiplier)
            },
            badges: {} // Loaded from JSON
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🏆 Initializing ${this.name}...`);

        await this.loadConfig();
        this.loadState();
        this.bindEvents();

        this.initialized = true;

        // Register
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer142.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('🏆 Gamification Config Loaded');
            }
        } catch (e) {
            console.warn('Using default gamification config');
        }
    }

    loadState() {
        const stored = localStorage.getItem('sportiq_gamification');
        if (stored) {
            try {
                this.state = { ...this.state, ...JSON.parse(stored) };
            } catch (e) {
                console.error('Gamification state corrupted');
            }
        }
    }

    saveState() {
        localStorage.setItem('sportiq_gamification', JSON.stringify(this.state));
    }

    bindEvents() {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            // Listen for standardized engagement events from Layer 141
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('fan:interaction', (data) => {
                this.handleInteraction(data);
            });
        }
    }

    handleInteraction(data) {
        // data: { action: 'like', points: 10, ... }
        if (!data || !data.points) return;

        // 1. Add XP
        const xpGained = data.points;
        this.gainXP(xpGained);

        // 2. Track Achievement Progress
        this.updateAchievementProgress(data.action);

        this.saveState();
    }

    gainXP(amount) {
        this.state.xp += amount;
        this.checkLevelUp();

        console.log(`🏆 Gained ${amount} XP. Total: ${this.state.xp}`);

        // Emit XP Event
        window.__ANTIGRAVITY_EVENT_BUS__?.publish('gamification:xp_gained', {
            amount,
            total: this.state.xp,
            level: this.state.level
        });
    }

    checkLevelUp() {
        const xpNeeded = this.config.levelCurve.base * Math.pow(this.state.level, this.config.levelCurve.multiplier);

        if (this.state.xp >= xpNeeded) {
            this.state.level++;
            console.log(`🏆 LEVEL UP! Now Level ${this.state.level}`);

            window.__ANTIGRAVITY_EVENT_BUS__?.publish('gamification:level_up', {
                newLevel: this.state.level
            });

            // Recursive check in case of massive XP gain
            this.checkLevelUp();
        }
    }

    updateAchievementProgress(action) {
        if (!this.state.achievements[action]) {
            this.state.achievements[action] = 0;
        }
        this.state.achievements[action]++;

        this.checkBadges(action);
    }

    checkBadges(action) {
        const count = this.state.achievements[action];
        const badges = this.config.badges[action]; // Array of badge definitions for this action

        if (badges && Array.isArray(badges)) {
            badges.forEach(badge => {
                if (count >= badge.threshold && !this.state.badges.includes(badge.id)) {
                    this.unlockBadge(badge);
                }
            });
        }
    }

    unlockBadge(badge) {
        this.state.badges.push(badge.id);
        console.log(`🏆 BADGE UNLOCKED: ${badge.name}`);

        window.__ANTIGRAVITY_EVENT_BUS__?.publish('gamification:badge_unlocked', {
            badgeId: badge.id,
            name: badge.name,
            icon: badge.icon
        });

        // XP Bonus for Badge
        if (badge.xpReward) {
            this.gainXP(badge.xpReward);
        }
    }

    /**
     * Public API
     */
    getState() {
        return this.state;
    }

    getLevel() {
        return this.state.level;
    }

    getBadges() {
        return this.state.badges;
    }
}

// Runtime Execution
window.Layer142_Gamification = new SportIQGamificationEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer142_Gamification.init());
} else {
    window.Layer142_Gamification.init();
}
