/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 107: SEO OPTIMIZATION AUTO-GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Generates and injects comprehensive SEO metadata (Title, Desc, Schema).
 * Features: Keyword density analysis, JSON-LD injection, and Open Graph tagging.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        seo: {
            brandName: 'Sport IQ',
            separator: '|',
            maxDescLen: 160
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SEO ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SEOEngine = {
        initialize: function () {
            console.log('🔍 [SEO] Engine initialized');

            // Listen for content generation events
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.optimizePage(e.detail.feed);
                }
            });
        },

        optimizePage: function (feed) {
            console.log(`🔍 [SEO] Optimizing for: ${feed.main.headline}`);

            // 1. Update Title & Meta
            this.updateTitle(feed.seo.title);
            this.updateMetaTags(feed);

            // 2. Generate JSON-LD Schema
            const schema = this.generateSchema(feed);
            this.injectSchema(schema);

            // 3. Update Open Graph (Social)
            this.updateOpenGraph(feed);
        },

        updateTitle: function (title) {
            document.title = title;
        },

        updateMetaTags: function (feed) {
            this.setMeta('description', feed.seo.description.substring(0, CONFIG.seo.maxDescLen));
            this.setMeta('keywords', feed.seo.keywords);
            this.setMeta('author', feed.main.author);
            this.setMeta('robots', 'index, follow');
        },

        updateOpenGraph: function (feed) {
            this.setMeta('og:title', feed.seo.title, 'property');
            this.setMeta('og:description', feed.seo.description, 'property');
            this.setMeta('og:type', 'article', 'property');
            this.setMeta('og:url', window.location.href, 'property'); // Approx
            this.setMeta('og:site_name', CONFIG.seo.brandName, 'property');
            this.setMeta('article:published_time', new Date(feed.timestamp).toISOString(), 'property');
            this.setMeta('article:section', feed.main.category, 'property');

            if (feed.main.imageUrl) {
                this.setMeta('og:image', feed.main.imageUrl, 'property');
            }
        },

        setMeta: function (name, content, attr = 'name') {
            let meta = document.querySelector(`meta[${attr}="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        },

        generateSchema: function (feed) {
            // NewsArticle Schema
            return {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": feed.main.headline,
                "description": feed.seo.description,
                "datePublished": new Date(feed.timestamp).toISOString(),
                "dateModified": new Date(feed.timestamp).toISOString(),
                "author": [{
                    "@type": "Person",
                    "name": feed.main.author,
                    "url": "https://sportiq.global/authors/" + feed.main.author.replace(/\s+/g, '-').toLowerCase()
                }],
                "publisher": {
                    "@type": "Organization",
                    "name": CONFIG.seo.brandName,
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://sportiq.global/logo.png"
                    }
                }
            };
        },

        injectSchema: function (jsonSchema) {
            // Clear old schema
            const oldScript = document.getElementById('seo-structured-data');
            if (oldScript) oldScript.remove();

            const script = document.createElement('script');
            script.id = 'seo-structured-data';
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(jsonSchema, null, 2);
            document.head.appendChild(script);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DIAGNOSTIC RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const SEORenderer = {
        renderDiagnostics: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const title = document.title;
            const desc = document.querySelector('meta[name="description"]')?.content || 'Missing';
            const schema = document.getElementById('seo-structured-data')?.textContent || '{}';

            container.innerHTML = `
                <div class="seo-panel">
                    <h3>SEO Live Status</h3>
                    
                    <div class="seo-field">
                        <label>Page Title (${title.length} chars)</label>
                        <div class="val">${title}</div>
                        <div class="bar-wrap"><div class="bar" style="width: ${Math.min(100, (title.length / 60) * 100)}%"></div></div>
                    </div>
                    
                    <div class="seo-field">
                        <label>Meta Description (${desc.length} chars)</label>
                        <div class="val">${desc}</div>
                        <div class="bar-wrap"><div class="bar" style="width: ${Math.min(100, (desc.length / 160) * 100)}%"></div></div>
                    </div>
                    
                    <div class="seo-field">
                        <label>Structured Data (JSON-LD)</label>
                        <pre class="json-preview">${schema}</pre>
                    </div>
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.SEOOptimizer = {
        init: SEOEngine.initialize.bind(SEOEngine),
        optimize: SEOEngine.optimizePage.bind(SEOEngine),
        render: SEORenderer.renderDiagnostics.bind(SEORenderer),

        // Helper
        getMetaData: () => ({
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content
        })
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SEOEngine.initialize());
    } else {
        SEOEngine.initialize();
    }

})();
