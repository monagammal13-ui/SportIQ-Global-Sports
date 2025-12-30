/**
 * Layer 7: SEO & Metadata Runtime
 * ID: layer-007
 * Type: Core
 * Description: Dynamic SEO management with meta tags, Open Graph, Twitter Cards, and structured data.
 */

class SEOMetadataRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_SEO__) {
            console.warn('[SEO] SEO runtime already initialized.');
            return window.__ANTIGRAVITY_SEO__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-007';
        this.name = 'SEO & Metadata Runtime';
        this.timestamp = new Date().toISOString();

        // State
        this.seoConfig = null;
        this.currentPage = this._detectCurrentPage();
        this.defaultMeta = {};

        console.log(`[SEO v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize SEO runtime
     */
    async _init() {
        try {
            await this._loadConfig();

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._setupSEO());
            } else {
                this._setupSEO();
            }

            this._registerEvents();
            console.log('[SEO] Initialized successfully');
        } catch (error) {
            console.error('[SEO] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'seo:init');
            }
        }
    }

    /**
     * Load SEO configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/seo-config.json');
            if (response.ok) {
                this.seoConfig = await response.json();
                console.log('[SEO] Configuration loaded');
            } else {
                this.seoConfig = this._getDefaultConfig();
            }
        } catch (error) {
            console.warn('[SEO] Using default configuration:', error);
            this.seoConfig = this._getDefaultConfig();
        }
    }

    /**
     * Get default SEO configuration
     */
    _getDefaultConfig() {
        return {
            siteName: "SPORTIQ",
            siteUrl: "https://sportiq.com",
            defaultTitle: "SPORTIQ - Global Sports Platform",
            defaultDescription: "Your ultimate global sports platform with live scores, breaking news, and comprehensive coverage.",
            defaultKeywords: ["sports", "live scores", "sports news", "global sports"],
            defaultImage: "/assets/images/og-default.jpg",
            twitterHandle: "@sportiq",
            pages: {}
        };
    }

    /**
     * Setup SEO system
     */
    _setupSEO() {
        // Get page-specific SEO data
        const pageSEO = this._getPageSEO(this.currentPage);

        // Update meta tags
        this._updateMetaTags(pageSEO);

        // Update Open Graph tags
        this._updateOpenGraph(pageSEO);

        // Update Twitter Card tags
        this._updateTwitterCards(pageSEO);

        // Update structured data
        this._updateStructuredData(pageSEO);

        // Add canonical link
        this._updateCanonical(pageSEO);
    }

    /**
     * Detect current page
     */
    _detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '') || 'index';
        return filename === 'index' ? 'home' : filename;
    }

    /**
     * Get SEO data for specific page
     */
    _getPageSEO(pageId) {
        const config = this.seoConfig;
        const pageData = config.pages && config.pages[pageId] ? config.pages[pageId] : {};

        return {
            title: pageData.title || config.defaultTitle,
            description: pageData.description || config.defaultDescription,
            keywords: pageData.keywords || config.defaultKeywords,
            image: pageData.image || config.defaultImage,
            url: pageData.url || `${config.siteUrl}/${pageId}.html`,
            author: pageData.author || config.siteName,
            type: pageData.type || 'website',
            structuredData: pageData.structuredData || null
        };
    }

    /**
     * Update basic meta tags
     */
    _updateMetaTags(seoData) {
        // Title
        document.title = seoData.title;

        // Description
        this._setMetaTag('name', 'description', seoData.description);

        // Keywords
        if (Array.isArray(seoData.keywords)) {
            this._setMetaTag('name', 'keywords', seoData.keywords.join(', '));
        }

        // Author
        this._setMetaTag('name', 'author', seoData.author);

        // Viewport (always present)
        this._setMetaTag('name', 'viewport', 'width=device-width, initial-scale=1.0');

        // Robots
        this._setMetaTag('name', 'robots', 'index, follow');

        // Language
        this._setMetaTag('http-equiv', 'Content-Language', 'en');
    }

    /**
     * Update Open Graph tags
     */
    _updateOpenGraph(seoData) {
        this._setMetaTag('property', 'og:title', seoData.title);
        this._setMetaTag('property', 'og:description', seoData.description);
        this._setMetaTag('property', 'og:type', seoData.type);
        this._setMetaTag('property', 'og:url', seoData.url);
        this._setMetaTag('property', 'og:image', this.seoConfig.siteUrl + seoData.image);
        this._setMetaTag('property', 'og:site_name', this.seoConfig.siteName);
        this._setMetaTag('property', 'og:locale', 'en_US');
    }

    /**
     * Update Twitter Card tags
     */
    _updateTwitterCards(seoData) {
        this._setMetaTag('name', 'twitter:card', 'summary_large_image');
        this._setMetaTag('name', 'twitter:site', this.seoConfig.twitterHandle);
        this._setMetaTag('name', 'twitter:title', seoData.title);
        this._setMetaTag('name', 'twitter:description', seoData.description);
        this._setMetaTag('name', 'twitter:image', this.seoConfig.siteUrl + seoData.image);
        this._setMetaTag('name', 'twitter:creator', this.seoConfig.twitterHandle);
    }

    /**
     * Update structured data (JSON-LD)
     */
    _updateStructuredData(seoData) {
        // Remove existing structured data
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => script.remove());

        // Add organization schema
        const organizationSchema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.seoConfig.siteName,
            "url": this.seoConfig.siteUrl,
            "logo": this.seoConfig.siteUrl + "/assets/images/logo.png",
            "sameAs": [
                "https://facebook.com/sportiq",
                "https://twitter.com/sportiq",
                "https://instagram.com/sportiq"
            ]
        };

        this._injectStructuredData(organizationSchema);

        // Add page-specific schema if provided
        if (seoData.structuredData) {
            this._injectStructuredData(seoData.structuredData);
        }

        // Add website schema
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.seoConfig.siteName,
            "url": this.seoConfig.siteUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${this.seoConfig.siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        };

        this._injectStructuredData(websiteSchema);
    }

    /**
     * Inject structured data script
     */
    _injectStructuredData(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    /**
     * Update canonical link
     */
    _updateCanonical(seoData) {
        let canonical = document.querySelector('link[rel="canonical"]');

        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }

        canonical.href = seoData.url;
    }

    /**
     * Set or update a meta tag
     */
    _setMetaTag(attribute, key, value) {
        if (!value) return;

        let meta = document.querySelector(`meta[${attribute}="${key}"]`);

        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, key);
            document.head.appendChild(meta);
        }

        meta.content = value;
    }

    /**
     * Update SEO dynamically (for SPA-like behavior)
     */
    updatePageSEO(pageId, customData = {}) {
        this.currentPage = pageId;
        const pageSEO = this._getPageSEO(pageId);

        // Merge with custom data
        const seoData = { ...pageSEO, ...customData };

        // Update all SEO elements
        this._updateMetaTags(seoData);
        this._updateOpenGraph(seoData);
        this._updateTwitterCards(seoData);
        this._updateStructuredData(seoData);
        this._updateCanonical(seoData);

        // Emit event
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit('seo:updated', {
                page: pageId,
                title: seoData.title
            });
        }
    }

    /**
     * Register event bus listeners
     */
    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Listen for page changes
        eventBus.on('page:changed', (data) => {
            if (data.page) {
                this.updatePageSEO(data.page, data.seo || {});
            }
        });

        // Listen for content updates
        eventBus.on('content:updated', (data) => {
            if (data.seo) {
                this.updatePageSEO(this.currentPage, data.seo);
            }
        });
    }

    /**
     * Get current SEO state
     */
    getState() {
        return {
            currentPage: this.currentPage,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content,
            canonicalUrl: document.querySelector('link[rel="canonical"]')?.href
        };
    }
}

// Initialize and Export
const seoMetadata = new SEOMetadataRuntime();
window.__ANTIGRAVITY_SEO__ = seoMetadata;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[SEO] Registered with runtime');
    });
}

export default seoMetadata;
