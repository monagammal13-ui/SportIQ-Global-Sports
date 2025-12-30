/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 81: SOCIAL MEDIA FEED INTEGRATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Social media aggregation, Twitter/X, Instagram, hashtag tracking
 * Features: Multi-platform feeds, hashtag monitoring, real-time updates
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        social: {
            configPath: '../api-json/social-config.json',
            updateInterval: 60000, // 1 minute
            maxPosts: 100,
            simulateMode: true
        },
        events: {
            postAdded: 'social:post-added',
            feedUpdated: 'social:feed-updated',
            hashtagTrending: 'social:hashtag-trending'
        }
    };

    const state = {
        accounts: new Map(),
        posts: new Map(),
        hashtags: new Map(),
        platforms: new Map(),
        statistics: {
            totalPosts: 0,
            totalAccounts: 0,
            lastUpdate: null
        },
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ACCOUNT MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const AccountManager = {
        register: function (account) {
            state.accounts.set(account.id, {
                id: account.id,
                username: account.username,
                platform: account.platform,
                displayName: account.displayName || account.username,
                avatar: account.avatar || '',
                followers: account.followers || 0,
                verified: account.verified || false,
                enabled: account.enabled !== false
            });

            state.statistics.totalAccounts++;
            console.log('✅ [Social] Account registered:', account.username);
        },

        getAll: function (filter = {}) {
            let accounts = Array.from(state.accounts.values());

            if (filter.platform) {
                accounts = accounts.filter(a => a.platform === filter.platform);
            }

            if (filter.enabled !== undefined) {
                accounts = accounts.filter(a => a.enabled === filter.enabled);
            }

            return accounts;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // POST MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const PostManager = {
        add: function (post) {
            const id = post.id || this.generateId();

            state.posts.set(id, {
                id,
                accountId: post.accountId,
                platform: post.platform,
                text: post.text || '',
                image: post.image || null,
                video: post.video || null,
                link: post.link || '',
                likes: post.likes || 0,
                retweets: post.retweets || 0,
                replies: post.replies || 0,
                timestamp: post.timestamp || Date.now(),
                hashtags: this.extractHashtags(post.text)
            });

            state.statistics.totalPosts++;

            // Track hashtags
            this.trackHashtags(id);

            const event = new CustomEvent(CONFIG.events.postAdded, {
                detail: { postId: id, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            return id;
        },

        getAll: function (filter = {}) {
            let posts = Array.from(state.posts.values());

            if (filter.platform) {
                posts = posts.filter(p => p.platform === filter.platform);
            }

            if (filter.accountId) {
                posts = posts.filter(p => p.accountId === filter.accountId);
            }

            if (filter.hashtag) {
                posts = posts.filter(p => p.hashtags.includes(filter.hashtag));
            }

            if (filter.limit) {
                posts = posts.slice(0, filter.limit);
            }

            return posts.sort((a, b) => b.timestamp - a.timestamp);
        },

        extractHashtags: function (text) {
            if (!text) return [];
            const matches = text.match(/#[\w]+/g);
            return matches ? matches.map(h => h.toLowerCase()) : [];
        },

        trackHashtags: function (postId) {
            const post = state.posts.get(postId);
            if (!post) return;

            post.hashtags.forEach(tag => {
                if (!state.hashtags.has(tag)) {
                    state.hashtags.set(tag, {
                        tag,
                        count: 0,
                        posts: []
                    });
                }

                const hashtagData = state.hashtags.get(tag);
                hashtagData.count++;
                hashtagData.posts.push(postId);
            });
        },

        generateId: function () {
            return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FEED FETCHER (Simulated)
    // ═══════════════════════════════════════════════════════════════════════

    const FeedFetcher = {
        fetch: async function (account) {
            if (!account.enabled) return [];

            console.log('🔄 [Social] Fetching feed:', account.username);

            if (CONFIG.social.simulateMode) {
                return this.simulateFeed(account);
            }

            // In production, use actual API calls
            return [];
        },

        simulateFeed: function (account) {
            const posts = [];
            const count = Math.floor(Math.random() * 3) + 1;

            const sampleTexts = [
                'Amazing goal in the last minute! #Football #Sports',
                'Breaking: Major transfer news coming soon 🔥 #TransferNews',
                'What a match! Incredible performance by the team #MatchDay',
                'Player of the month announcement 🏆 #Awards',
                'Training session highlights #BehindTheScenes'
            ];

            for (let i = 0; i < count; i++) {
                posts.push({
                    accountId: account.id,
                    platform: account.platform,
                    text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
                    likes: Math.floor(Math.random() * 1000),
                    retweets: Math.floor(Math.random() * 500),
                    replies: Math.floor(Math.random() * 100),
                    timestamp: Date.now() - (Math.random() * 3600000)
                });
            }

            return posts;
        },

        fetchAll: async function () {
            const accounts = AccountManager.getAll({ enabled: true });

            const promises = accounts.map(account => this.fetch(account));
            const results = await Promise.all(promises);

            const posts = results.flat();
            posts.forEach(post => PostManager.add(post));

            state.statistics.lastUpdate = Date.now();

            const event = new CustomEvent(CONFIG.events.feedUpdated, {
                detail: { count: posts.length, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            return posts;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HASHTAG TRACKER
    // ═══════════════════════════════════════════════════════════════════════

    const HashtagTracker = {
        getTrending: function (limit = 10) {
            const hashtags = Array.from(state.hashtags.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);

            return hashtags;
        },

        getByTag: function (tag) {
            return state.hashtags.get(tag.toLowerCase());
        },

        trackTag: function (tag) {
            const normalized = tag.toLowerCase();

            if (!state.hashtags.has(normalized)) {
                state.hashtags.set(normalized, {
                    tag: normalized,
                    count: 0,
                    posts: [],
                    tracking: true
                });
            }

            return state.hashtags.get(normalized);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PLATFORM MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const PlatformManager = {
        register: function (platform) {
            state.platforms.set(platform.id, {
                id: platform.id,
                name: platform.name,
                icon: platform.icon,
                color: platform.color,
                enabled: platform.enabled !== false
            });
        },

        getAll: function () {
            return Array.from(state.platforms.values());
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-UPDATE ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const AutoUpdate = {
        start: function () {
            console.log(`🔄 [Social] Auto-update started (${CONFIG.social.updateInterval / 1000}s interval)`);

            this.update();

            this.timerId = setInterval(() => {
                this.update();
            }, CONFIG.social.updateInterval);
        },

        update: async function () {
            await FeedFetcher.fetchAll();
            this.checkTrending();
        },

        checkTrending: function () {
            const trending = HashtagTracker.getTrending(5);

            if (trending.length > 0) {
                const event = new CustomEvent(CONFIG.events.hashtagTrending, {
                    detail: { hashtags: trending, timestamp: Date.now() }
                });
                document.dispatchEvent(event);
            }
        },

        stop: function () {
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📱 LAYER 81: SOCIAL MEDIA ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        try {
            const response = await fetch(CONFIG.social.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register platforms
                if (state.config.platforms) {
                    state.config.platforms.forEach(p => {
                        PlatformManager.register(p);
                    });
                    console.log(`✅ [Social] Registered ${state.config.platforms.length} platforms`);
                }

                // Register accounts
                if (state.config.accounts) {
                    state.config.accounts.forEach(a => {
                        AccountManager.register(a);
                    });
                    console.log(`✅ [Social] Registered ${state.config.accounts.length} accounts`);
                }

                // Track hashtags
                if (state.config.trackedHashtags) {
                    state.config.trackedHashtags.forEach(tag => {
                        HashtagTracker.trackTag(tag);
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ [Social] Failed to load config');
        }

        // Start auto-update
        AutoUpdate.start();

        console.log('✅ [Social] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.SocialFeed = {
        // Accounts
        registerAccount: AccountManager.register.bind(AccountManager),
        getAccounts: AccountManager.getAll.bind(AccountManager),

        // Posts
        getPosts: PostManager.getAll.bind(PostManager),
        addPost: PostManager.add.bind(PostManager),

        // Hashtags
        getTrendingHashtags: HashtagTracker.getTrending.bind(HashtagTracker),
        getHashtag: HashtagTracker.getByTag.bind(HashtagTracker),
        trackHashtag: HashtagTracker.trackTag.bind(HashtagTracker),

        // Platforms
        getPlatforms: PlatformManager.getAll.bind(PlatformManager),

        // Fetching
        fetchFeed: FeedFetcher.fetch.bind(FeedFetcher),
        fetchAll: FeedFetcher.fetchAll.bind(FeedFetcher),
        updateNow: AutoUpdate.update.bind(AutoUpdate),

        // Statistics
        getStats: () => ({ ...state.statistics }),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
