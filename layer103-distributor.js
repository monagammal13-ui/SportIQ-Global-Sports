/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 103: ARTICLE DISTRIBUTION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically distributes generated content to all relevant UI sections.
 * Features: Dynamic injection, template rendering, and section targeting.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        distribution: {
            maxFeatured: 1,
            maxLatest: 10,
            maxCategory: 5,
            animationDuration: 500
        },
        selectors: {
            featured: '#featured-news-container',
            latest: '#latest-news-list',
            ticker: '#breaking-news-ticker',
            sidebar: '#sidebar-news-widget',
            categoryBase: '#category-news-' // + category name
        }
    };

    const state = {
        contentStore: new Map(), // feedId -> feedData
        sections: {
            featured: [],
            latest: []
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DISTRIBUTION ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const DistributionEngine = {
        initialize: function () {
            console.log('🚚 [Distribution] Engine initialized');

            // Listen for generated content
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.distribute(e.detail.feed);
                }
            });
        },

        distribute: function (feed) {
            console.log(`🚚 [Distribution] Routing content: ${feed.main.headline}`);

            // 1. Store Content
            state.contentStore.set(feed.id, feed);

            // 2. Distribute to Sections
            this.updateFeatured(feed);
            this.updateLatest(feed);
            this.updateTicker(feed);
            this.updateCategory(feed);
            this.updateSidebar(feed);
        },

        updateFeatured: function (feed) {
            // Logic: Is this breaking news or highly important? 
            // For now, latest pushed item becomes featured for demo.
            const container = document.querySelector(CONFIG.selectors.featured);
            if (container) {
                // Animate out old
                container.style.opacity = '0';

                setTimeout(() => {
                    container.innerHTML = this.getTemplates().featured(feed);
                    container.style.opacity = '1';
                }, 300);
            }
        },

        updateLatest: function (feed) {
            const container = document.querySelector(CONFIG.selectors.latest);
            if (container) {
                const itemHtml = this.getTemplates().latest(feed);

                // Prepend
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = itemHtml;
                const newItem = tempDiv.firstElementChild;

                // Animation setup
                newItem.style.opacity = '0';
                newItem.style.transform = 'translateY(-20px)';
                newItem.style.transition = 'all 0.5s ease';

                container.insertBefore(newItem, container.firstChild);

                // Trigger animation
                requestAnimationFrame(() => {
                    newItem.style.opacity = '1';
                    newItem.style.transform = 'translateY(0)';
                });

                // Prune old items
                if (container.children.length > CONFIG.distribution.maxLatest) {
                    container.lastElementChild.remove();
                }
            }
        },

        updateTicker: function (feed) {
            const ticker = document.querySelector(CONFIG.selectors.ticker);
            if (ticker) {
                // Update text content with animation
                ticker.style.opacity = '0';
                setTimeout(() => {
                    ticker.innerHTML = `
                        <span class="ticker-label">BREAKING</span>
                        <span class="ticker-text">${feed.widgets.ticker.text}</span>
                    `;
                    ticker.style.opacity = '1';
                }, 300);
            }
        },

        updateCategory: function (feed) {
            const catId = feed.main.category.toLowerCase().replace(/\s+/g, '-');
            const container = document.querySelector(CONFIG.selectors.categoryBase + catId);

            if (container) {
                const html = this.getTemplates().card(feed);
                container.insertAdjacentHTML('afterbegin', html);
            }
        },

        updateSidebar: function (feed) {
            const container = document.querySelector(CONFIG.selectors.sidebar);
            if (container) {
                const html = this.getTemplates().sidebar(feed);
                container.innerHTML = html + container.innerHTML; // Prepend
            }
        },

        getTemplates: function () {
            return {
                featured: (feed) => `
                    <div class="featured-article" data-id="${feed.id}">
                        <div class="featured-content">
                            <span class="category-badge">${feed.main.category}</span>
                            <h1>${feed.main.headline}</h1>
                            <p>${feed.main.lead}</p>
                            <div class="meta">
                                <span>${new Date(feed.timestamp).toLocaleTimeString()}</span> • 
                                <span>${feed.main.author}</span>
                            </div>
                        </div>
                    </div>
                `,
                latest: (feed) => `
                    <div class="news-list-item" data-id="${feed.id}">
                        <div class="item-content">
                            <h4>${feed.main.headline}</h4>
                            <p>${feed.widgets.sidebar.snippet}</p>
                        </div>
                        <span class="item-time">${new Date(feed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                `,
                sidebar: (feed) => `
                    <div class="sidebar-news-item">
                        <h5>${feed.main.headline}</h5>
                    </div>
                `,
                card: (feed) => `
                    <div class="news-card">
                        <h3>${feed.main.headline}</h3>
                        <span class="read-time">${feed.widgets.card.readTime}</span>
                    </div>
                `
            };
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ContentDistributor = {
        init: DistributionEngine.initialize.bind(DistributionEngine),
        distribute: DistributionEngine.distribute.bind(DistributionEngine),

        // Manual helpers
        injectTestContainer: (id) => {
            if (!document.getElementById(id)) {
                const div = document.createElement('div');
                div.id = id;
                div.style.border = '1px dashed #ccc';
                div.style.padding = '10px';
                div.style.margin = '10px 0';
                div.innerText = `Container: ${id}`;
                document.body.appendChild(div);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DistributionEngine.initialize());
    } else {
        DistributionEngine.initialize();
    }

})();
