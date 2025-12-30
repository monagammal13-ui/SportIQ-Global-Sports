/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 125: SMART TAGGING & KEYWORD EXTRACTION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically generates SEO-friendly tags and normalized keywords 
 *          from article text using entity recognition and frequency analysis.
 * Features: Dictionary normalization (e.g. "CR7" -> "Cristiano Ronaldo"),
 *          keyword density scoring, and auto-injection.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        tagging: {
            minFreq: 1, // Minimum mentions to qualify as a tag
            maxTags: 8,
            stopWords: ['the', 'and', 'but', 'for', 'with', 'this', 'that', 'from']
        },
        selectors: {
            container: '#smart-tags-container'
        },
        // Knowledge Base for Normalization
        dictionary: {
            'cr7': 'Cristiano Ronaldo',
            'messi': 'Lionel Messi',
            'leo messi': 'Lionel Messi',
            'man city': 'Manchester City',
            'city': 'Manchester City',
            'united': 'Manchester United',
            'liverpool': 'Liverpool FC',
            'gunners': 'Arsenal',
            'f1': 'Formula 1',
            'verstappen': 'Max Verstappen',
            'lewis': 'Lewis Hamilton',
            'lakers': 'LA Lakers',
            'lebron': 'LeBron James'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TAGGING ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SmartTagEngine = {
        initialize: function () {
            console.log('🏷️ [SmartTags] Engine initialized');

            // Listen for new content
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.processFeed(e.detail.feed);
                }
            });
        },

        processFeed: function (feed) {
            console.log(`🏷️ [SmartTags] Analyzing text for: ${feed.main.headline}`);

            const text = `${feed.main.headline} ${feed.main.body}`.toLowerCase();
            const tags = this.extractTags(text);

            // Augment feed
            feed.smartTags = tags;

            console.log('🏷️ [SmartTags] Generated:', tags.map(t => t.term).join(', '));

            // Render
            TagRenderer.render(tags);

            return tags;
        },

        extractTags: function (text) {
            const rawWords = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
            const frequency = {};

            // 1. Scan Dictionary Phrases first (Multi-word entities)
            // (Simplified: just checking simple presence for dictionary keys)
            const detectedEntities = new Set();

            Object.keys(CONFIG.dictionary).forEach(key => {
                if (text.includes(key)) {
                    const normalized = CONFIG.dictionary[key];
                    frequency[normalized] = (frequency[normalized] || 0) + 5; // Bonus weight for known entities
                }
            });

            // 2. Scan Individual Words (Frequency Analysis)
            rawWords.forEach(word => {
                if (word.length > 3 && !CONFIG.tagging.stopWords.includes(word)) {
                    // Simple capitalization check or noun detection would go here in full NLP
                    // For now, raw frequency
                    frequency[word] = (frequency[word] || 0) + 1;
                }
            });

            // 3. Convert to Array and Sort
            const sorted = Object.keys(frequency)
                .map(term => ({
                    term: this.capitalize(term),
                    score: frequency[term],
                    type: detectedEntities.has(term) ? 'entity' : 'keyword'
                }))
                .filter(item => item.score >= CONFIG.tagging.minFreq)
                .sort((a, b) => b.score - a.score)
                .slice(0, CONFIG.tagging.maxTags);

            return sorted;
        },

        capitalize: function (str) {
            return str.replace(/\b\w/g, l => l.toUpperCase()); // Simple Title Case
        },

        injectDemo: function () {
            if (!document.getElementById('smart-tags-container')) {
                const div = document.createElement('div');
                div.id = 'smart-tags-container';
                div.style.margin = '20px 0';
                // Place near top meta
                const meta = document.querySelector('.meta-data-row') || document.body;
                if (meta !== document.body) meta.parentNode.insertBefore(div, meta.nextSibling);
                else document.body.appendChild(div);
            }

            this.processFeed({
                main: {
                    headline: 'CR7 hat-trick saves United in thriller',
                    body: 'Cristiano Ronaldo was seeing stars as Manchester United defeated the Gunners at home today. Lebron was watching.'
                }
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const TagRenderer = {
        render: function (tags) {
            const container = document.querySelector(CONFIG.selectors.container);
            if (!container) return;

            container.innerHTML = `
                <div class="smart-tags-panel">
                    <div class="st-header">
                        <span class="st-icon">🏷️</span> Auto-Generated Topics
                    </div>
                    <div class="st-cloud">
                        ${tags.map(t => `
                            <span class="st-chip ${t.score > 4 ? 'high-relevance' : ''}">
                                ${t.term}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.SmartTagger = {
        init: SmartTagEngine.initialize.bind(SmartTagEngine),
        analyze: SmartTagEngine.processFeed.bind(SmartTagEngine),
        demo: SmartTagEngine.injectDemo.bind(SmartTagEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SmartTagEngine.initialize());
    } else {
        SmartTagEngine.initialize();
    }

})();
