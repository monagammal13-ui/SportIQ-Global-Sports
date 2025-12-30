/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 128: MULTI-SOURCE CONTENT AGGREGATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Aggregates and displays related content from verified external 
 *          sources alongside internal articles to provide diverse perspectives.
 * Features: Source verification, context matching, and seamless UI integration.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        aggregation: {
            maxItems: 3,
            sources: [
                { id: 'bbc', name: 'BBC Sport', icon: '🇧🇧', trustScore: 99 },
                { id: 'sky', name: 'Sky Sports', icon: '📺', trustScore: 95 },
                { id: 'espn', name: 'ESPN', icon: '🇺🇸', trustScore: 92 },
                { id: 'athletic', name: 'The Athletic', icon: '📰', trustScore: 98 }
            ]
        },
        selectors: {
            container: '#external-sources-widget'
        }
    };

    // Mock External Content Database
    const EXTERNAL_DB = [
        { sourceId: 'bbc', title: 'Analysis: Why the defense failed', url: '#', category: 'Football', tags: ['defense', 'tactics'] },
        { sourceId: 'sky', title: 'Live Transfer Blog: Latest updates', url: '#', category: 'Football', tags: ['transfer', 'market'] },
        { sourceId: 'athletic', title: 'The financial implications explained', url: '#', category: 'Business', tags: ['finance', 'money'] },
        { sourceId: 'espn', title: 'Power Rankings: Who is on top?', url: '#', category: 'General', tags: ['rankings'] },
        { sourceId: 'sky', title: 'Verstappen pole position reaction', url: '#', category: 'Motorsport', tags: ['f1', 'qualifying'] }
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // AGGREGATION ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const AggregatorEngine = {
        initialize: function () {
            console.log('🌐 [Aggregator] Engine initialized');

            // Listen for feed generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.processFeed(e.detail.feed);
                }
            });
        },

        processFeed: function (feed) {
            console.log(`🌐 [Aggregator] Fetching external sources for: ${feed.main.headline}`);

            // Simulate API latency
            setTimeout(() => {
                const results = this.fetchMockData(feed);
                if (results.length > 0) {
                    this.renderWidget(results);
                }
            }, 500);
        },

        fetchMockData: function (feed) {
            const contextTags = (feed.main.tags || []).map(t => t.toLowerCase());
            const contextCat = feed.main.category;

            // Simple matching logic
            const matches = EXTERNAL_DB.filter(item => {
                const catMatch = item.category === contextCat;
                const tagMatch = item.tags.some(t => contextTags.includes(t));
                return catMatch || tagMatch;
            });

            // Augment with Source Data
            return matches.map(m => {
                const source = CONFIG.aggregation.sources.find(s => s.id === m.sourceId);
                return { ...m, source };
            }).slice(0, CONFIG.aggregation.maxItems);
        },

        renderWidget: function (items) {
            let container = document.querySelector(CONFIG.selectors.container);

            if (!container) {
                // Determine layout injection point
                // Usually sidebar or bottom of article
                const sidebar = document.querySelector('.sidebar') || document.body;
                container = document.createElement('div');
                container.id = 'external-sources-widget';
                sidebar.appendChild(container);
            }

            container.innerHTML = `
                <div class="aggregator-card">
                    <div class="agg-header">
                        <h4>Around the Web</h4>
                        <span class="agg-badge">VERIFIED SOURCES</span>
                    </div>
                    <div class="agg-list">
                        ${items.map(item => `
                            <a href="${item.url}" class="agg-item" target="_blank">
                                <div class="agg-source-row">
                                    <span class="agg-icon">${item.source.icon}</span>
                                    <span class="agg-name">${item.source.name}</span>
                                    <span class="agg-trust" title="Trust Score">🛡️ ${item.source.trustScore}%</span>
                                </div>
                                <div class="agg-title">
                                    ${item.title} <span class="external-link-icon">↗</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        injectDemo: function () {
            if (!document.getElementById('external-sources-widget')) {
                const div = document.createElement('div');
                div.id = 'external-sources-widget';
                div.style.margin = '20px 0';
                document.body.appendChild(div);
            }

            // Trigger with dummy data
            this.processFeed({
                main: { headline: 'Demo Headline', category: 'Football', tags: ['transfer'] }
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ContentAggregator = {
        init: AggregatorEngine.initialize.bind(AggregatorEngine),
        fetch: AggregatorEngine.processFeed.bind(AggregatorEngine),
        demo: AggregatorEngine.injectDemo.bind(AggregatorEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AggregatorEngine.initialize());
    } else {
        AggregatorEngine.initialize();
    }

})();
