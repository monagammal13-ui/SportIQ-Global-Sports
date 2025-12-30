/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 109: VISUAL MEDIA INTEGRATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically locates and attaches relevant images and videos to articles.
 * Features: Keyword matching, media gallery injection, and interactive embeds.
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
            configPath: '../api-json/media-sources.json',
            maxGallerySize: 4
        },
        selectors: {
            featuredImage: '.article-hero-image',
            galleryContainer: '.article-gallery',
            videoContainer: '.article-video-embed'
        }
    };

    const state = {
        library: [] // Loaded media assets
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MEDIA ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const MediaEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.media.configPath);
                if (response.ok) {
                    const data = await response.json();
                    state.library = data.assets || [];
                    console.log(`🎬 [Media] Loaded ${state.library.length} assets`);
                }
            } catch (error) {
                console.warn('⚠️ [Media] Failed to load config');
            }

            // Listen for new content
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.attachMedia(e.detail.feed);
                }
            });
        },

        attachMedia: function (feed) {
            console.log(`🎬 [Media] Searching assets for: ${feed.main.headline}`);

            // 1. Find Matching Assets
            const matches = this.findMatches(feed);

            if (matches.length > 0) {
                // 2. Select Featured Image
                const featured = matches[0];
                feed.main.imageUrl = featured.url; // Update feed object
                this.renderFeatured(featured);

                // 3. Build Gallery (Remaining matches)
                const galleryItems = matches.slice(1, CONFIG.media.maxGallerySize + 1);
                if (galleryItems.length > 0) {
                    this.renderGallery(galleryItems);
                }

                // 4. Find Video (if any)
                const video = matches.find(m => m.type === 'video');
                if (video) {
                    this.renderVideo(video);
                }
            } else {
                console.warn('⚠️ [Media] No assets found for this content.');
                this.renderFallback();
            }
        },

        findMatches: function (feed) {
            const text = (feed.main.headline + ' ' + feed.main.tags.join(' ')).toLowerCase();

            return state.library.filter(asset => {
                // Check tags
                const tagMatch = asset.tags.some(t => text.includes(t.toLowerCase()));
                // Check category
                const catMatch = asset.category.toLowerCase() === feed.main.category.toLowerCase();

                return tagMatch || catMatch;
            }).sort((a, b) => b.quality - a.quality); // Prioritize high quality
        },

        renderFeatured: function (asset) {
            // Find container in DOM (mock injection)
            const container = document.getElementById('featured-image-container');
            if (container) {
                container.innerHTML = `
                    <div class="hero-media-wrapper">
                        <img src="${asset.url}" alt="${asset.alt}" class="hero-img">
                        <span class="media-credit">📸 ${asset.credit}</span>
                    </div>
                `;
            }
        },

        renderGallery: function (assets) {
            const container = document.getElementById('gallery-container');
            if (container) {
                container.innerHTML = `
                    <div class="media-gallery-grid">
                        ${assets.map(asset => `
                            <div class="gallery-item">
                                <img src="${asset.url}" alt="${asset.alt}">
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        },

        renderVideo: function (asset) {
            const container = document.getElementById('video-container');
            if (container) {
                container.innerHTML = `
                    <div class="video-embed-wrapper">
                        <div class="video-placeholder">
                            <span class="play-icon">▶</span>
                            <span>${asset.title}</span>
                        </div>
                    </div>
                `;
            }
        },

        renderFallback: function () {
            // Placeholder logic if needed
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.VisualMediaManager = {
        init: MediaEngine.initialize.bind(MediaEngine),
        attach: MediaEngine.attachMedia.bind(MediaEngine),

        // Debug helper
        getLibrary: () => state.library
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MediaEngine.initialize());
    } else {
        MediaEngine.initialize();
    }

})();
