/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 110: LIVE EXPERT COMMENTARY & SOCIAL INTEGRATION LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Integrates real-time expert commentary, social media feeds, and 
 *          crowd sentiment directly into the article experience.
 * 
 * Features:
 *  - Multi-stream feeds (Expert, Social, Crowd).
 *  - Simulated "Expert" personas with tactical analysis.
 *  - Crowd Meter visualization.
 *  - Auto-injection into article layouts.
 * 
 * Version: 2.0.0 (Major Upgrade)
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        feeds: {
            refreshRate: 5000, // 5s check
            expertChance: 0.25, // 25% chance of expert comment
            socialChance: 0.35, // 35% chance of social post
            crowdChance: 0.40   // 40% chance of crowd reaction change
        },
        experts: [
            { name: "Tactical Tom", role: "Senior Analyst", avatar: "👨‍🏫" },
            { name: "Coach Sarah", role: "Strategy Specialist", avatar: "👩‍💼" },
            { name: "Data Dan", role: "Stats Guru", avatar: "📊" }
        ],
        socials: [
            { user: "@SuperFan99", avatar: "🦁" },
            { user: "@SportsDaily", avatar: "📰" },
            { user: "@ArenaVoice", avatar: "🏟️" }
        ],
        selectors: {
            articleContainer: '.article-content, #main-content, .post-body',
            sidebar: '.sidebar, #secondary-content',
            hero: '.hero, .article-header'
        }
    };

    class LiveCommentaryLayer {
        constructor() {
            this.active = false;
            this.crowdSentiment = 50; // 0-100
            this.feedItems = [];
            this.init();
        }

        init() {
            console.log('🎙️ Layer 110: Live Commentary - INITIALIZING');

            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.start());
            } else {
                this.start();
            }
        }

        start() {
            this.injectUI();
            this.startSimulation();
            this.active = true;
            console.log('🎙️ Layer 110: Live Commentary - ACTIVE');
        }

        // ═════════════════════════════════════════════════════════════════════
        // UI INJECTION
        // ═════════════════════════════════════════════════════════════════════

        injectUI() {
            if (document.getElementById('live-commentary-widget')) return;

            const widget = document.createElement('div');
            widget.id = 'live-commentary-widget';
            widget.className = 'live-commentary-widget slide-in-right';
            widget.innerHTML = `
                <div class="lc-header">
                    <div class="lc-title">
                        <span class="lc-pulse"></span>
                        <h4>Live Commentary</h4>
                    </div>
                    <div class="lc-tabs">
                        <button class="lc-tab active" onclick="window.Layer110_Commentary.switchTab('all')">All</button>
                        <button class="lc-tab" onclick="window.Layer110_Commentary.switchTab('expert')">Expert</button>
                        <button class="lc-tab" onclick="window.Layer110_Commentary.switchTab('social')">Social</button>
                    </div>
                </div>
                
                <div class="lc-crowd-meter">
                    <div class="lc-meter-label">Crowd Energy</div>
                    <div class="lc-meter-track">
                        <div id="lc-meter-fill" class="lc-meter-fill" style="width: 50%"></div>
                    </div>
                </div>

                <div id="lc-feed-container" class="lc-feed-container custom-scrollbar">
                    <!-- Feed items go here -->
                </div>
                
                <div class="lc-footer">
                    <span>⚡ Powered by SportIQ Live</span>
                </div>
            `;

            // Smart Placement
            const sidebar = document.querySelector(CONFIG.selectors.sidebar);
            const article = document.querySelector(CONFIG.selectors.articleContainer);

            if (sidebar) {
                // Prefer Sidebar
                sidebar.insertBefore(widget, sidebar.firstChild);
            } else if (article) {
                // Or beside/inside article
                article.parentNode.insertBefore(widget, article.nextSibling);
                widget.style.marginTop = '40px';
            } else {
                // Floating Fallback
                widget.classList.add('floating-mode');
                document.body.appendChild(widget);
            }
        }

        // ═════════════════════════════════════════════════════════════════════
        // FEED MANAGEMENT
        // ═════════════════════════════════════════════════════════════════════

        addFeedItem(item) {
            const container = document.getElementById('lc-feed-container');
            if (!container) return;

            const el = document.createElement('div');
            el.className = `lc-feed-item ${item.type} animate-entry`;
            el.dataset.type = item.type;

            let icon = '';
            if (item.type === 'expert') icon = item.avatar;
            if (item.type === 'social') icon = '🐦';
            if (item.type === 'crowd') icon = '🔥';

            el.innerHTML = `
                <div class="lc-item-header">
                    <span class="lc-avatar">${icon}</span>
                    <span class="lc-author">${item.author}</span>
                    <span class="lc-time">Just now</span>
                </div>
                <div class="lc-item-body">
                    ${item.content}
                </div>
            `;

            container.insertBefore(el, container.firstChild);

            // Cleanup old items
            if (container.children.length > 50) {
                container.lastChild.remove();
            }

            this.feedItems.push(item);
        }

        switchTab(tab) {
            document.querySelectorAll('.lc-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');

            const container = document.getElementById('lc-feed-container');
            container.className = `lc-feed-container filter-${tab}`;
        }

        // ═════════════════════════════════════════════════════════════════════
        // SIMULATION ENGINE
        // ═════════════════════════════════════════════════════════════════════

        startSimulation() {
            setInterval(() => {
                const rand = Math.random();

                if (rand < CONFIG.feeds.expertChance) {
                    this.genExpertComment();
                } else if (rand < CONFIG.feeds.expertChance + CONFIG.feeds.socialChance) {
                    this.genSocialPost();
                } else {
                    this.updateCrowdSentiment();
                }

            }, CONFIG.feeds.refreshRate);
        }

        // Generators
        genExpertComment() {
            const expert = CONFIG.experts[Math.floor(Math.random() * CONFIG.experts.length)];
            const comments = [
                "The defensive line is pressing high, creating space in the midfield.",
                "Excellent transition play! That counter-attack was textbook execution.",
                "Notice the player positioning during set-pieces; they're clearly targeting the near post.",
                "Momentum is shifting. The home team needs to stabilize possession now."
            ];
            const content = comments[Math.floor(Math.random() * comments.length)];

            this.addFeedItem({
                type: 'expert',
                author: expert.name,
                avatar: expert.avatar,
                content: content
            });
        }

        genSocialPost() {
            const user = CONFIG.socials[Math.floor(Math.random() * CONFIG.socials.length)];
            const posts = [
                "Unbelievable scenes! 😱 #MatchDay",
                "Did you see that pass?? playing on another level today.",
                "Crowd is absolutely electric right now! 🔊",
                "Can't believe the ref missed that call... 🤔"
            ];
            const content = posts[Math.floor(Math.random() * posts.length)];

            this.addFeedItem({
                type: 'social',
                author: user.user,
                avatar: user.avatar,
                content: content
            });
        }

        updateCrowdSentiment() {
            // Fluctuate sentiment
            const change = Math.floor(Math.random() * 20) - 10;
            this.crowdSentiment = Math.max(0, Math.min(100, this.crowdSentiment + change));

            const fill = document.getElementById('lc-meter-fill');
            if (fill) {
                fill.style.width = `${this.crowdSentiment}%`;

                // Color shift
                if (this.crowdSentiment > 75) fill.style.background = '#ef4444'; // Hot
                else if (this.crowdSentiment > 40) fill.style.background = '#eab308'; // Neutral
                else fill.style.background = '#3b82f6'; // Cold
            }

            // Optional: Crowd update feed
            if (Math.abs(change) > 8) {
                this.addFeedItem({
                    type: 'crowd',
                    author: 'Crowd Monitor',
                    avatar: '📢',
                    content: change > 0 ? "The crowd is getting LOUD! Energy rising!" : "Audible frustration from the stands."
                });
            }
        }
    }

    // Auto-Expose
    window.Layer110_Commentary = new LiveCommentaryLayer();

})();
