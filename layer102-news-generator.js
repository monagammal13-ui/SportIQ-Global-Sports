/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 102: AUTOMATED NEWS FEED GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Transforms a single long-form article into a complete structured news feed.
 * Features: Auto-summarization, tag extraction, section allocation, and multi-format generation.
 * 
 * Input: 4k-6k character article text
 * Output: 
 *   - Headline (H1)
 *   - Summary (Lead)
 *   - Main Body (Categorized)
 *   - Sidebar Snippet
 *   - Ticker Headline
 *   - Social Media Posts (Twitter, FB)
 *   - SEO Meta Tags
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        generator: {
            minChars: 50, // Minimum chars to process
            defaultCategory: 'General News',
            maxTickerLen: 100,
            summaryLen: 200
        },
        events: {
            feedGenerated: 'newsgen:feed-generated',
            error: 'newsgen:error'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GENERATOR ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const NewsGenerator = {
        processArticle: function (rawText, metadata = {}) {
            console.log('📰 [NewsGen] Processing article...');

            if (!rawText || rawText.length < CONFIG.generator.minChars) {
                console.error('❌ [NewsGen] Input text too short.');
                return null;
            }

            try {
                // 1. Analyze and Clean
                const cleanText = this.cleanText(rawText);

                // 2. Extract Key Elements
                const headline = metadata.title || this.generatedHeadline(cleanText);
                const summary = this.generateSummary(cleanText);
                const category = metadata.category || this.detectCategory(cleanText);
                const tags = this.extractTags(cleanText);

                // 3. Generate Formats
                const feed = {
                    id: 'art_' + Date.now(),
                    timestamp: Date.now(),
                    originalText: cleanText,

                    // Main Article
                    main: {
                        headline: headline,
                        lead: summary,
                        body: cleanText, // In a real NLP engines, would structure paragraphs
                        category: category,
                        tags: tags,
                        author: metadata.author || 'Sport IQ Editor'
                    },

                    // Widget Formats
                    widgets: {
                        sidebar: {
                            title: headline,
                            snippet: summary.substring(0, 100) + '...'
                        },
                        ticker: {
                            text: `BREAKING: ${headline} - ${summary.substring(0, 50)}...`
                        },
                        card: {
                            title: headline,
                            category: category,
                            readTime: Math.ceil(cleanText.split(' ').length / 200) + ' min read'
                        }
                    },

                    // Social Media
                    social: {
                        twitter: this.generateTweet(headline, tags),
                        facebook: `${headline}\n\n${summary}\n\nRead more at Sport IQ.`,
                        shareUrl: `https://sportiq.global/news/${Date.now()}`
                    },

                    // SEO
                    seo: {
                        title: `${headline} | Sport IQ News`,
                        description: summary,
                        keywords: tags.join(', ')
                    }
                };

                // Dispatch Event
                document.dispatchEvent(new CustomEvent(CONFIG.events.feedGenerated, {
                    detail: { feed }
                }));

                console.log('✅ [NewsGen] Feed Generated:', feed.id);
                return feed;

            } catch (e) {
                console.error('❌ [NewsGen] Generation Failed:', e);
                return null;
            }
        },

        // --- Mock NLP Helper Functions (Replace with Real AI/NLP later) ---

        cleanText: function (text) {
            return text.trim().replace(/\s+/g, ' ');
        },

        generatedHeadline: function (text) {
            // First sentence or first 10 words
            const firstSentence = text.split('.')[0];
            return firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence;
        },

        generateSummary: function (text) {
            // First 200 chars
            return text.substring(0, CONFIG.generator.summaryLen).trim() + '...';
        },

        detectCategory: function (text) {
            const lower = text.toLowerCase();
            if (lower.includes('football') || lower.includes('soccer') || lower.includes('goal')) return 'Football';
            if (lower.includes('basketball') || lower.includes('nba') || lower.includes('dunk')) return 'Basketball';
            if (lower.includes('tennis') || lower.includes('set') || lower.includes('match')) return 'Tennis';
            return CONFIG.generator.defaultCategory;
        },

        extractTags: function (text) {
            const keywords = ['transfer', 'goal', 'win', 'champions', 'league', 'final', 'injury', 'contract'];
            return keywords.filter(k => text.toLowerCase().includes(k)).map(k => k.charAt(0).toUpperCase() + k.slice(1));
        },

        generateTweet: function (headline, tags) {
            const tagString = tags.map(t => '#' + t).join(' ');
            return `🚨 ${headline}\n\n${tagString} #SportIQ`;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER (DEMO DASHBOARD)
    // ═══════════════════════════════════════════════════════════════════════

    const GeneratorUI = {
        renderDashboard: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="news-gen-panel">
                    <h3>News Feed Generator</h3>
                    <div class="input-section">
                        <textarea id="article-input" placeholder="Paste article text here (4k-6k chars)..."></textarea>
                        <button onclick="window.NewsFeedGenerator.generateFromInput()">Generate Feed</button>
                    </div>
                    <div id="feed-preview" class="feed-preview hidden">
                        <!-- Preview content goes here -->
                    </div>
                </div>
            `;
        },

        showPreview: function (feed) {
            const preview = document.getElementById('feed-preview');
            if (!preview) return;

            preview.classList.remove('hidden');
            preview.innerHTML = `
                <div class="preview-card main-preview">
                    <h4>Main Article</h4>
                    <h1>${feed.main.headline}</h1>
                    <span class="preview-pill">${feed.main.category}</span>
                    <p><strong>${feed.main.lead}</strong></p>
                </div>

                <div class="preview-grid">
                    <div class="preview-card">
                        <h4>Ticket Strip</h4>
                        <div class="ticker-mock">${feed.widgets.ticker.text}</div>
                    </div>
                    
                    <div class="preview-card">
                        <h4>Social Media</h4>
                        <div class="social-mock twitter">${feed.social.twitter}</div>
                    </div>

                    <div class="preview-card">
                        <h4>SEO Data</h4>
                        <div class="seo-mock">
                            <div>Title: ${feed.seo.title}</div>
                            <div>Desc: ${feed.seo.description}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.NewsFeedGenerator = {
        process: NewsGenerator.processArticle.bind(NewsGenerator),
        render: GeneratorUI.renderDashboard.bind(GeneratorUI),

        generateFromInput: () => {
            const text = document.getElementById('article-input').value;
            if (text) {
                const feed = NewsGenerator.processArticle(text);
                if (feed) GeneratorUI.showPreview(feed);
            } else {
                alert('Please enter text first');
            }
        }
    };

})();
