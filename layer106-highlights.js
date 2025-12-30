/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 106: DYNAMIC HIGHLIGHT & KEY PHRASE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Extracts high-impact sentences and quotes for pull-quotes and highlights.
 * Features: Sentiment analysis (basic), quote detection, and visual highlight injection.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        extraction: {
            minQuoteLen: 20,
            maxQuoteLen: 150,
            highlightCount: 3
        },
        selectors: {
            articleBody: '.article-body', // Target for injection
            highlightBox: '.highlight-box'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EXTRACTION ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const HighlightEngine = {
        initialize: function () {
            console.log('🖍️ [Highlights] Engine initialized');

            // Listen for feed generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.processFeed(e.detail.feed);
                }
            });
        },

        processFeed: function (feed) {
            const text = feed.main.body;

            // 1. Extract Quotes
            const quotes = this.extractQuotes(text);

            // 2. Extract Key Sentences (Rule-based)
            const keySentences = this.extractKeySentences(text);

            const highlights = {
                quotes: quotes.slice(0, 2),
                keyPoints: keySentences.slice(0, 3)
            };

            console.log('🖍️ [Highlights] Extracted:', highlights);

            // 3. Inject into UI
            this.injectHighlights(feed.id, highlights);

            return highlights;
        },

        extractQuotes: function (text) {
            // Regex for text between "quotes"
            const matches = text.match(/"([^"]+)"/g) || [];
            return matches
                .map(s => s.replace(/"/g, '').trim())
                .filter(s => s.length >= CONFIG.extraction.minQuoteLen && s.length <= CONFIG.extraction.maxQuoteLen);
        },

        extractKeySentences: function (text) {
            // Split by sentence endings
            const sentences = text.split(/[.!?]+/);

            return sentences
                .map(s => s.trim())
                .filter(s => {
                    // Score sentence based on signal words
                    if (s.length < 30) return false;
                    const indicators = ['crucially', 'importantly', 'highlight', 'record', 'history', 'significant', 'turning point'];
                    return indicators.some(i => s.toLowerCase().includes(i));
                })
                .sort((a, b) => b.length - a.length); // Prioritize longer, descriptive sentences
        },

        injectHighlights: function (feedId, highlights) {
            // If we are on the article page (mock check)
            const container = document.getElementById('highlights-container');
            if (container) {
                container.innerHTML = HighlightRenderer.renderBox(highlights);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const HighlightRenderer = {
        renderBox: function (highlights) {
            let html = `<div class="dynamic-highlights-panel">`;

            // Quotes Section
            if (highlights.quotes.length > 0) {
                html += `<div class="highlight-section quotes">`;
                highlights.quotes.forEach(quote => {
                    html += `
                        <blockquote class="highlight-quote">
                            "${quote}"
                        </blockquote>
                    `;
                });
                html += `</div>`;
            }

            // Key Points Section
            if (highlights.keyPoints.length > 0) {
                html += `
                    <div class="highlight-section points">
                        <h4>Key Takeaways</h4>
                        <ul>
                            ${highlights.keyPoints.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            html += `</div>`;
            return html;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.HighlightSystem = {
        init: HighlightEngine.initialize.bind(HighlightEngine),
        process: HighlightEngine.processFeed.bind(HighlightEngine),

        // Manual Injection Helper
        injectDemo: () => {
            const demoText = `Manchester City secured a historic victory today. "This is the best day of my life," said the manager. Crucially, the team secured three points to lead the league. It was a significant achievement for the club. "We fight until the end," added the captain.`;
            const highlights = HighlightEngine.processFeed({ main: { body: demoText }, id: 'demo' });

            // Create container if missing
            if (!document.getElementById('highlights-container')) {
                const div = document.createElement('div');
                div.id = 'highlights-container';
                document.body.appendChild(div);
            }

            HighlightEngine.injectHighlights('demo', highlights);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HighlightEngine.initialize());
    } else {
        HighlightEngine.initialize();
    }

})();
