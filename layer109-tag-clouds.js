/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 109: AUTOMATED DYNAMIC TAG CLOUD ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Visualizes trending topics and keywords in a dynamic, 
 *          interactive cloud format.
 * Features:
 *  - Weight-based sizing logic (Trending topics appear larger).
 *  - Interactive hover effects with count indicators.
 *  - Real-time page scanning for instant contextual tags.
 *  - Auto-injection into Sidebars or Footers.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        apiPath: '../api-json/tags.json',
        selectors: {
            sidebar: '.sidebar, #secondary, #sidebar-wrapper',
            articleContent: '.article-content, .post-body',
        },
        cloud: {
            minSize: 0.8, // rem
            maxSize: 2.2, // rem
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']
        }
    };

    class TagCloudEngine {
        constructor() {
            this.globalTags = [];
            this.localTags = [];
            this.init();
        }

        async init() {
            console.log('☁️ Layer 109: Tag Cloud Engine - INITIALIZING');

            // 1. Load Global Tags
            await this.loadGlobalTags();

            // 2. Scan Local Content
            this.scanLocalContent();

            // 3. Render
            this.injectClouds();
        }

        async loadGlobalTags() {
            try {
                const response = await fetch(CONFIG.apiPath);
                if (response.ok) {
                    const data = await response.json();
                    this.globalTags = data.tags || [];
                } else {
                    // Fallback
                    this.globalTags = this.getFallbackTags();
                }
            } catch (e) {
                console.warn('☁️ [TagCloud] API load failed, using fallback.');
                this.globalTags = this.getFallbackTags();
            }
        }

        getFallbackTags() {
            return [
                { name: 'Live Scores', count: 150, trending: true },
                { name: 'Breaking', count: 120, trending: true },
                { name: 'Premier League', count: 100, trending: false },
                { name: 'Transfers', count: 90, trending: true },
                { name: 'Formula 1', count: 80, trending: false },
                { name: 'NBA', count: 75, trending: false },
                { name: 'Highlights', count: 110, trending: true }
            ];
        }

        scanLocalContent() {
            const content = document.querySelector(CONFIG.selectors.articleContent);
            if (!content) return;

            const text = content.innerText;
            // Simple frequency analysis for demo purposes
            // In a real app, use NLP (Natural Language Processing)
            const words = text.match(/\b\w{5,}\b/g) || [];
            const freq = {};

            words.forEach(w => {
                const word = w.toLowerCase();
                if (['their', 'about', 'which', 'would', 'could'].includes(word)) return;
                freq[word] = (freq[word] || 0) + 1;
            });

            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
            this.localTags = sorted.map(([name, count]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                count: count * 10 + 50, // Inflate for display
                color: '#64748b' // Neutral for auto-extracted
            }));

            console.log('☁️ [TagCloud] Scanned content, found tags:', this.localTags);
        }

        injectClouds() {
            // Widget Wrapper
            const widget = document.createElement('div');
            widget.className = 'tag-cloud-widget animated-entry';
            widget.innerHTML = `
                <div class="cloud-header">
                    <h4>Trending Topics</h4>
                    <span class="pulse-dot"></span>
                </div>
                <div class="cloud-container" id="global-cloud"></div>
            `;

            // Inject
            const sidebar = document.querySelector(CONFIG.selectors.sidebar);
            if (sidebar) {
                sidebar.appendChild(widget);
                this.renderTags(this.globalTags, '#global-cloud');
            }

            // Article Footer Cloud (Local Tags)
            if (this.localTags.length > 0) {
                const articleFooter = document.createElement('div');
                articleFooter.className = 'tag-cloud-widget inline-cloud';
                articleFooter.innerHTML = `
                    <h5>Related Keywords</h5>
                    <div class="cloud-container" id="local-cloud"></div>
                `;

                const content = document.querySelector(CONFIG.selectors.articleContent);
                if (content && content.parentNode) {
                    content.parentNode.appendChild(articleFooter);
                    this.renderTags(this.localTags, '#local-cloud');
                }
            }
        }

        renderTags(tags, containerId) {
            const container = document.querySelector(containerId);
            if (!container) return;

            // Normalize counts for sizing
            const max = Math.max(...tags.map(t => t.count));
            const min = Math.min(...tags.map(t => t.count));

            tags.forEach(tag => {
                const size = this.calculateSize(tag.count, min, max);
                // Assign random color if not present
                const color = tag.color || CONFIG.cloud.colors[Math.floor(Math.random() * CONFIG.cloud.colors.length)];

                const tagEl = document.createElement('a');
                tagEl.href = '#tag/' + (tag.slug || tag.name.toLowerCase());
                tagEl.className = 'tag-item';
                tagEl.style.fontSize = `${size}rem`;
                tagEl.style.color = color;
                tagEl.style.setProperty('--hover-color', color);

                tagEl.innerHTML = `
                    <span class="tag-text">#${tag.name}</span>
                    <span class="tag-count">${tag.count}</span>
                `;

                container.appendChild(tagEl);
            });
        }

        calculateSize(val, min, max) {
            if (max === min) return (CONFIG.cloud.minSize + CONFIG.cloud.maxSize) / 2;
            const normalized = (val - min) / (max - min);
            return CONFIG.cloud.minSize + (normalized * (CONFIG.cloud.maxSize - CONFIG.cloud.minSize));
        }
    }

    // Auto-Expose
    window.Layer109_TagCloud = new TagCloudEngine();

})();
