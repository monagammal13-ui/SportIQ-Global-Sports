/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 115: CROSS-SECTION LINKING INTELLIGENCE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Increases engagement by suggesting relevant content from *different* 
 *          site sections (e.g. suggesting "Business of Sport" on a "Football" article).
 * Features: Tag intersection logic, mock historical index, and card injection.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        linking: {
            maxLinks: 3,
            minCommonTags: 1
        },
        selectors: {
            container: '#cross-linking-widget'
        }
    };

    // Mock Historical Index (Seed data so the feature works immediately)
    const MOCK_INDEX = [
        { id: 'hist_1', headline: 'The Financial Impact of New Stadiums', category: 'Business', tags: ['stadium', 'finance', 'football'], url: '#' },
        { id: 'hist_2', headline: 'Top 10 F1 Drivers of All Time', category: 'Motorsport', tags: ['f1', 'racing', 'history'], url: '#' },
        { id: 'hist_3', headline: 'How AI is Changing Coaching', category: 'Technology', tags: ['ai', 'coaching', 'future'], url: '#' },
        { id: 'hist_4', headline: 'NBA Salary Cap Explained', category: 'Business', tags: ['nba', 'finance', 'basketball'], url: '#' },
        { id: 'hist_5', headline: 'Nutrition Secrets of Pro Athletes', category: 'Health', tags: ['fitness', 'diet', 'training'], url: '#' }
    ];

    const state = {
        index: [...MOCK_INDEX] // Determine runtime storage
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CROSS-LINKING ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const CrossLinkEngine = {
        initialize: function () {
            console.log('🔗 [CrossLink] Engine initialized');

            // Listen for feed generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.processFeed(e.detail.feed);
                }
            });
        },

        processFeed: function (feed) {
            console.log(`🔗 [CrossLink] Finding connections for: ${feed.main.headline}`);

            // 1. Add current to index (for future linking)
            this.addToIndex(feed);

            // 2. Find Related
            const related = this.findRelated(feed);

            if (related.length > 0) {
                console.log(`🔗 [CrossLink] Found ${related.length} related items`);
                this.renderWidget(related);
            }
        },

        addToIndex: function (feed) {
            // Avoid duplicates
            if (!state.index.find(i => i.id === feed.id)) {
                state.index.push({
                    id: feed.id,
                    headline: feed.main.headline,
                    category: feed.main.category,
                    tags: feed.main.tags || [],
                    url: '#' // In real app, real URL
                });
            }
        },

        findRelated: function (currentFeed) {
            const currentTags = (currentFeed.main.tags || []).map(t => t.toLowerCase());
            const currentCat = currentFeed.main.category;

            return state.index
                .filter(item => {
                    // Exclude self
                    if (item.id === currentFeed.id) return false;

                    // Logic: Must share a tag OR represent a relevant business connection
                    const sharedTags = item.tags.filter(t => currentTags.includes(t.toLowerCase()));

                    // Boost items from DIFFERENT categories (The "Cross-Section" goal)
                    const isCrossSection = item.category !== currentCat;

                    // Weighted Score
                    item._score = sharedTags.length * (isCrossSection ? 2 : 1);

                    // Add some randomness for discovery if no strong match
                    if (item._score === 0 && Math.random() > 0.8) item._score = 0.5;

                    return item._score > 0;
                })
                .sort((a, b) => b._score - a._score)
                .slice(0, CONFIG.linking.maxLinks);
        },

        injectDemo: function () {
            if (!document.getElementById('cross-linking-widget')) {
                const div = document.createElement('div');
                div.id = 'cross-linking-widget';
                div.style.margin = '20px 0';
                document.body.appendChild(div);
            }
            // Trigger a re-render with mock data context
            const mockContext = { main: { headline: 'Demo Context', category: 'Football', tags: ['finance', 'stadium'] }, id: 'demo' };
            this.processFeed(mockContext);
        },

        renderWidget: function (items) {
            const container = document.querySelector(CONFIG.selectors.container);
            if (container) {
                container.innerHTML = `
                    <div class="cross-link-panel">
                        <h3>You Might Also Like</h3>
                        <div class="link-grid">
                            ${items.map(item => `
                                <a href="${item.url}" class="cross-link-card">
                                    <div class="link-cat">${item.category}</div>
                                    <div class="link-title">${item.headline}</div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.CrossLinker = {
        init: CrossLinkEngine.initialize.bind(CrossLinkEngine),
        process: CrossLinkEngine.processFeed.bind(CrossLinkEngine),
        demo: CrossLinkEngine.injectDemo.bind(CrossLinkEngine),

        getIndex: () => state.index
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CrossLinkEngine.initialize());
    } else {
        CrossLinkEngine.initialize();
    }

})();
