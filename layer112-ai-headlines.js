/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 112: AI HEADLINE GENERATOR ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Generates high-CTR, SEO-optimized headlines using pattern matching/AI logic.
 * Features: A/B test variants, emotional analysis (basic), and length optimization.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        generation: {
            variantCount: 3, // How many options to generate
            maxLen: 70,      // Ideal SEO length
            minLen: 30
        },
        patterns: [
            "Why {Topic} is Changing {Context}",
            "{Number} Reasons to Watch {Topic}",
            "The Truth About {Topic}",
            "{Topic}: What You Need to Know",
            "Breaking: {Topic} {Action}",
            "{Topic} vs {Context}: The Final Verdict"
        ]
    };

    const state = {
        history: []
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HEADLINE ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const HeadlineEngine = {
        initialize: function () {
            console.log('🧠 [Headlines] Engine initialized');

            // Listen for feed generation to suggest better titles
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.enhanceFeed(e.detail.feed);
                }
            });
        },

        enhanceFeed: function (feed) {
            console.log(`🧠 [Headlines] Optimizing title for: ${feed.main.headline}`);

            // 1. Generate Variants
            const variants = this.generateVariants(feed);

            // 2. Score Variants
            const scored = variants.map(v => ({
                text: v,
                score: this.scoreHeadline(v)
            })).sort((a, b) => b.score - a.score);

            // 3. Attach to Feed for A/B Testing
            feed.headlines = {
                original: feed.main.headline,
                variants: scored
            };

            console.log('🧠 [Headlines] Alternatives:', scored.map(s => s.text).join(' | '));

            // 4. Update UI if present
            HeadlineRenderer.renderSuggestions(scored);

            return scored;
        },

        generateVariants: function (feed) {
            const topic = feed.topics && feed.topics.length > 0 ? feed.topics[0].name : feed.main.category;
            const context = feed.topics && feed.topics.length > 1 ? feed.topics[1].name : "Everything";
            const action = "Just happened"; // In real NLP, extract verb phrase from summary

            const variants = [];

            // Pattern 1: Template filling
            CONFIG.patterns.forEach(pattern => {
                let text = pattern
                    .replace("{Topic}", topic)
                    .replace("{Context}", context)
                    .replace("{Action}", action)
                    .replace("{Number}", "5"); // hardcoded for demo

                variants.push(text);
            });

            // Pattern 2: Preservation (Keep original but clean)
            variants.push(feed.main.headline);

            return variants.slice(0, CONFIG.generation.variantCount + 1);
        },

        scoreHeadline: function (text) {
            let score = 50;

            // Length Check (Optimal 40-70 chars)
            if (text.length >= 40 && text.length <= 70) score += 20;
            else if (text.length < 30 || text.length > 90) score -= 10;

            // Power Words Check
            const powerWords = ["Why", "How", "Best", "Top", "Revealed", "Secret", "Alert", "Live"];
            powerWords.forEach(w => {
                if (text.includes(w)) score += 5;
            });

            // Number check
            if (/\d/.test(text)) score += 5;

            return Math.min(100, Math.max(0, score));
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const HeadlineRenderer = {
        renderSuggestions: function (scoredVariants) {
            const container = document.getElementById('headline-suggestions');
            if (!container) return; // Only render if container exists (e.g. editor mode)

            container.innerHTML = `
                <div class="headline-panel">
                    <h3>AI Headline Suggestions</h3>
                    <div class="variant-list">
                        ${scoredVariants.map(v => `
                            <div class="variant-item">
                                <div class="variant-score ${this.getScoreClass(v.score)}">${v.score}</div>
                                <div class="variant-text" onclick="window.AIHeadlines.select('${v.text.replace(/'/g, "\\'")}')">
                                    ${v.text}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        getScoreClass: function (score) {
            if (score >= 80) return 'high';
            if (score >= 50) return 'med';
            return 'low';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.AIHeadlines = {
        init: HeadlineEngine.initialize.bind(HeadlineEngine),
        generate: HeadlineEngine.enhanceFeed.bind(HeadlineEngine),

        // Manual Selection (mock function)
        select: (text) => {
            console.log(`🧠 [Headlines] User selected: ${text}`);
            // In real app, this would update the input field
            const input = document.getElementById('headline-input'); // hypothetical ID
            if (input) input.value = text;
        },

        injectDemo: (id) => {
            if (!document.getElementById(id)) {
                const div = document.createElement('div');
                div.id = id;
                document.body.appendChild(div);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HeadlineEngine.initialize());
    } else {
        HeadlineEngine.initialize();
    }

})();
