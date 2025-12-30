/**
 * Layer 144: Fan Leaderboards System
 * Real-time competitive ranking engine for user community.
 * 
 * Responsibilities:
 * - Aggregates scores from Layer 142 (Gamification).
 * - Sorts and ranks users dynamically.
 * - Handles multiple leaderboard types (Weekly, All-Time, Specific Badge).
 * - Manages persistence and mock data for populated view.
 */
export class SportIQLeaderboardEngine {
    constructor() {
        this.id = 'layer-144';
        this.name = 'Fan Leaderboards System';
        this.version = '2.0.0';
        this.initialized = false;

        this.leaderboards = {
            "all_time": [],
            "weekly": []
        };

        this.currentUserEntry = null;

        this.config = {
            max_size: 100,
            refresh_interval: 60000 // 1 min
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🏆 Initializing ${this.name}...`);

        await this.loadConfig();
        this.loadLeaderboardData();
        this.syncWithUser();
        this.startLiveUpdates();

        this.initialized = true;

        // Register
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer144.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('🏆 Leaderboard Config Loaded');
            }
        } catch (e) {
            console.warn('Using default leaderboard config');
        }
    }

    /**
     * Loads existing leaderboard data or generates seed data for demo
     */
    loadLeaderboardData() {
        const stored = localStorage.getItem('sportiq_leaderboards');
        if (stored) {
            this.leaderboards = JSON.parse(stored);
        } else {
            this.generateMockData();
        }
        this.sortAll();
    }

    /**
     * Ensures the current local user is present in the leaderboard
     */
    syncWithUser() {
        // Listen for XP gains to update rank in real-time
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('gamification:xp_gained', (data) => {
                this.updateCurrentUserScore(data.total);
            });
        }

        // Initial sync
        const userState = window.Layer142_Gamification ? window.Layer142_Gamification.getState() : null;
        if (userState) {
            this.updateCurrentUserScore(userState.xp);
        }
    }

    updateCurrentUserScore(xp) {
        const profile = window.SportIQProfile || { userId: 'me' };
        const entry = {
            userId: profile.userId || 'current_user',
            username: 'You',
            score: xp,
            lastActive: Date.now()
        };

        // Update or Add
        this.upsertEntry("all_time", entry);
        this.upsertEntry("weekly", entry);

        this.sortAll();
        this.save();
    }

    upsertEntry(boardInfo, entry) {
        const board = this.leaderboards[boardInfo];
        const idx = board.findIndex(u => u.userId === entry.userId);

        if (idx !== -1) {
            board[idx] = { ...board[idx], score: entry.score, lastActive: entry.lastActive };
        } else {
            board.push(entry);
        }
    }

    sortAll() {
        for (const key in this.leaderboards) {
            this.leaderboards[key].sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.lastActive - a.lastActive; // Tie-break: Recent activity wins
            });
            this.leaderboards[key] = this.leaderboards[key].slice(0, this.config.max_size);
        }
    }

    save() {
        localStorage.setItem('sportiq_leaderboards', JSON.stringify(this.leaderboards));

        // Broadcast Update
        window.__ANTIGRAVITY_EVENT_BUS__?.publish('leaderboard:updated', {
            top: this.leaderboards.all_time.slice(0, 3)
        });
    }

    generateMockData() {
        // Seed some fake competitive users
        const mockUsers = [
            { userId: 'u1', username: 'GoalMachine99', score: 5000 },
            { userId: 'u2', username: 'TacticalGenius', score: 4200 },
            { userId: 'u3', username: 'SpeedyWinger', score: 3800 },
            { userId: 'u4', username: 'NetBuster', score: 2100 }
        ];
        this.leaderboards.all_time = mockUsers;
        this.leaderboards.weekly = mockUsers.map(u => ({ ...u, score: Math.round(u.score * 0.1) }));
    }

    startLiveUpdates() {
        // Occasionally simulate other users gaining points to make it feel alive
        setInterval(() => {
            const randomIdx = Math.floor(Math.random() * this.leaderboards.all_time.length);
            const user = this.leaderboards.all_time[randomIdx];
            if (user && user.userId !== 'current_user') {
                user.score += 10;
                this.sortAll();
                this.save(); // In prod, we wouldn't save mock data updates this aggressively
            }
        }, 15000);
    }

    /**
     * Public API
     */
    getTop(board = "all_time", limit = 10) {
        return this.leaderboards[board]?.slice(0, limit) || [];
    }

    getUserRank(userId) {
        return this.leaderboards.all_time.findIndex(u => u.userId === userId) + 1;
    }
}

// Runtime Execution
window.Layer144_Leaderboards = new SportIQLeaderboardEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer144_Leaderboards.init());
} else {
    window.Layer144_Leaderboards.init();
}
