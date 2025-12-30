/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 129: DYNAMIC RELATED MEDIA ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically matches and injects rich media (Images, GIFs, Videos)
 *          into articles based on keyword analysis and tag matching.
 * Features: Contextual media injection, GIF reaction integration, and gallery generation.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        media: {
            maxItems: 4,
            injectionMode: 'gallery' // 'gallery' or 'inline'
        },
        selectors: {
            container: '#dynamic-media-gallery',
            articleBody: '.article-body'
        }
    };

    // Mock Media Database
    const MEDIA_DB = [
        { id: 'm1', type: 'image', tags: ['football', 'stadium', 'fans'], url: 'https://via.placeholder.com/400x300/1e40af/ffffff?text=Stadium+Atmosphere' },
        { id: 'm2', type: 'gif', tags: ['goal', 'celebration', 'football'], url: 'https://via.placeholder.com/400x300/16a34a/ffffff?text=GOAL+GIF' },
        { id: 'm3', type: 'image', tags: ['f1', 'car', 'racing'], url: 'https://via.placeholder.com/400x300/dc2626/ffffff?text=F1+Car' },
        { id: 'm4', type: 'video', tags: ['interview', 'press'], url: 'https://via.placeholder.com/400x300/5b21b6/ffffff?text=Press+Conference' },
        { id: 'm5', type: 'gif', tags: ['shock', 'surprise', 'drama'], url: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Shock+Reaction' },
        { id: 'm6', type: 'image', tags: ['tactics', 'analysis'], url: 'https://via.placeholder.com/400x300/0f172a/ffffff?text=Tactical+Board' }
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // MEDIA ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const RelatedMediaEngine = {
        initialize: function () {
            console.log('🖼️ [RelatedMedia] Engine initialized');

            // Listen for feed generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.processFeed(e.detail.feed);
                }
            });
        },

        processFeed: function (feed) {
            console.log(`🖼️ [RelatedMedia] Searching media for: ${feed.main.headline}`);

            const matches = this.findMatches(feed);

            if (matches.length > 0) {
                console.log(`🖼️ [RelatedMedia] Found ${matches.length} matches`);
                this.renderGallery(matches);
            }
        },

        findMatches: function (feed) {
            const queryTags = (feed.main.tags || []).concat([feed.main.category.toLowerCase()]);
            const text = feed.main.body.toLowerCase();

            // Score items
            return MEDIA_DB.map(item => {
                let score = 0;
                // Tag match
                const shared = item.tags.filter(t => queryTags.includes(t));
                score += shared.length * 2;

                // Content scanning (simplified)
                item.tags.forEach(t => {
                    if (text.includes(t)) score += 1;
                });

                return { ...item, score };
            })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, CONFIG.media.maxItems);
        },

        renderGallery: function (items) {
            let container = document.querySelector(CONFIG.selectors.container);

            if (!container) {
                // Auto-inject after article body
                const body = document.querySelector(CONFIG.selectors.articleBody);
                container = document.createElement('div');
                container.id = 'dynamic-media-gallery';

                if (body) {
                    body.parentNode.insertBefore(container, body.nextSibling);
                } else {
                    // Fallback
                    const sidebar = document.querySelector('.sidebar') || document.body;
                    sidebar.appendChild(container);
                }
            }

            container.innerHTML = `
                <div class="media-gallery-wrapper">
                    <h4><span class="gallery-icon">📸</span> Media Gallery</h4>
                    <div class="media-grid">
                        ${items.map(item => `
                            <div class="media-item type-${item.type}">
                                <img src="${item.url}" alt="Related Media">
                                ${item.type === 'gif' ? '<span class="type-badge">GIF</span>' : ''}
                                ${item.type === 'video' ? '<span class="play-btn">▶</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        injectDemo: function () {
            if (!document.getElementById('dynamic-media-gallery')) {
                const div = document.createElement('div');
                div.id = 'dynamic-media-gallery';
                div.style.margin = '20px 0';
                document.body.appendChild(div);
            }

            this.processFeed({
                main: { headline: 'Match Day', category: 'football', tags: ['goal', 'stadium'], body: 'The fans went wild.' }
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.RelatedMedia = {
        init: RelatedMediaEngine.initialize.bind(RelatedMediaEngine),
        process: RelatedMediaEngine.processFeed.bind(RelatedMediaEngine),
        demo: RelatedMediaEngine.injectDemo.bind(RelatedMediaEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => RelatedMediaEngine.initialize());
    } else {
        RelatedMediaEngine.initialize();
    }

})();
