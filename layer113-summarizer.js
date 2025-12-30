/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 113: AUTOMATED SUMMARY GENERATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Creates concise, informative summaries (TL;DR) for quick consumption.
 * Features: Extractive summarization, sentence ranking, and multi-format output.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        summary: {
            bulletCount: 3,
            targetLength: 300, // Words
            minSentences: 3
        },
        selectors: {
            summaryContainer: '.article-summary-box'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARIZATION ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SummaryEngine = {
        initialize: function () {
            console.log('📝 [Summaries] Engine initialized');

            // Listen for feed generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.processFeed(e.detail.feed);
                }
            });
        },

        processFeed: function (feed) {
            console.log(`📝 [Summaries] Summarizing: ${feed.main.headline}`);

            const rawText = feed.main.body;

            // 1. Generate Bullet Summary (TL;DR)
            const bullets = this.generateBullets(rawText);

            // 2. Generate Paragraph Summary
            const paragraph = this.generateParagraph(rawText, bullets);

            const summaryData = {
                bullets: bullets,
                text: paragraph
            };

            // Augment feed
            feed.aiSummary = summaryData;

            // 3. Render
            SummaryRenderer.render(summaryData);

            return summaryData;
        },

        generateBullets: function (text) {
            // Simplified extractive summarization:
            // 1. Split sentences
            // 2. Score by keyword density (using Title keywords)
            // 3. Pick top 3 unique sentences

            const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
            if (sentences.length < 3) return sentences; // Return all if short

            // In a real NLP engine, we'd use TF-IDF here. 
            // For now, we prioritize first, last, and longest sentence.
            const candidates = [
                sentences[0], // Lead
                sentences[sentences.length - 1], // Conclusion
                sentences.sort((a, b) => b.length - a.length)[0] // Most detailed
            ];

            // Filter duplicates and cleanup
            return [...new Set(candidates)].slice(0, CONFIG.summary.bulletCount)
                .map(s => s.trim());
        },

        generateParagraph: function (text, bullets) {
            // Combine bullets or extract first 300 words
            if (bullets.length > 0) {
                return bullets.join(' ');
            }
            return text.substring(0, CONFIG.summary.targetLength * 5) + '...';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const SummaryRenderer = {
        render: function (data) {
            const container = document.getElementById('ai-summary-container');
            if (container) {
                container.innerHTML = `
                    <div class="summary-card">
                        <div class="summary-header">
                            <span class="ai-badge">AI SUMMARY</span>
                        </div>
                        <ul class="summary-bullets">
                            ${data.bullets.map(b => `<li>${b}</li>`).join('')}
                        </ul>
                        <div class="summary-actions">
                            <button onclick="window.AutoSummarizer.speak()">🔊 Listen</button>
                            <button onclick="window.AutoSummarizer.copy()">📋 Copy</button>
                        </div>
                    </div>
                `;
            }
        },

        injectDemo: function () {
            if (!document.getElementById('ai-summary-container')) {
                const div = document.createElement('div');
                div.id = 'ai-summary-container';
                div.style.margin = '20px 0';
                document.body.appendChild(div);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.AutoSummarizer = {
        init: SummaryEngine.initialize.bind(SummaryEngine),
        summarize: SummaryEngine.processFeed.bind(SummaryEngine),
        injectDemo: SummaryRenderer.injectDemo.bind(SummaryRenderer),

        // Actions
        speak: () => {
            const text = document.querySelector('.summary-bullets').innerText;
            const msg = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(msg);
        },
        copy: () => {
            const text = document.querySelector('.summary-bullets').innerText;
            navigator.clipboard.writeText(text);
            alert('Summary copied!');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SummaryEngine.initialize());
    } else {
        SummaryEngine.initialize();
    }

})();
