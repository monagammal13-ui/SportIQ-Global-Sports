/**
 * Layer 69 - SEO Optimization Core
 * Complete SEO management with meta tags, schema markup, sitemap generation, and canonical links
 * Sport IQ Platform
 */

class SEOOptimizationCore {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.currentPage = null;
        this.schema = null;
        this.metaTags = new Map();
        this.canonicalUrl = null;
        this.sitemap = [];
        this.keywords = [];
        this.init();
    }

    async init() {
        console.log('🔍 Layer 69: SEO Optimization Core - STARTING');

        // Load configuration
        await this.loadConfig();

        // Initialize SEO components
        this.detectCurrentPage();
        this.injectMetaTags();
        this.injectSchemaMarkup();
        this.setupCanonicalLinks();
        this.generateDynamicSitemap();
        this.setupOpenGraph();
        this.setupTwitterCards();
        this.injectStructuredData();
        this.setupSEOMonitoring();

        // Auto-update engine for dynamic content
        this.startAutoUpdate();

        this.isActive = true;
        console.log('✅ Layer 69: SEO Optimization Core - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/layer69-seo-optimization.json');
            this.config = await response.json();
            console.log('✅ SEO config loaded');
        } catch (error) {
            console.warn('⚠️ Using default SEO config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            siteName: "SPORTIQ Global Platform",
            defaultTitle: "SPORTIQ - Global Sports Platform | Live Scores & News",
            defaultDescription: "Your ultimate global sports platform with live scores, breaking news, and comprehensive coverage of all major sports worldwide.",
            defaultKeywords: ["sports", "live scores", "sports news", "global sports", "football", "basketball", "tennis"],
            baseUrl: "https://sportiq.com",
            language: "en",
            locale: "en_US",
            twitterHandle: "@sportiq",
            ogType: "website",
            autoUpdateInterval: 300000, // 5 minutes
            enableSchemaMarkup: true,
            enableOpenGraph: true,
            enableTwitterCards: true,
            enableDynamicSitemap: true,
            enableCanonicalLinks: true,
            robotsRules: "index, follow",
            sitemapChangeFreq: "daily",
            sitemapPriority: 0.8
        };
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);

        this.currentPage = {
            path: path,
            type: this.getPageType(path),
            sport: params.get('sport') || 'all',
            category: params.get('category') || null,
            article: params.get('article') || null,
            timestamp: new Date().toISOString()
        };

        console.log('📄 Current page detected:', this.currentPage);
    }

    getPageType(path) {
        if (path === '/' || path.includes('index.html')) return 'homepage';
        if (path.includes('article')) return 'article';
        if (path.includes('category')) return 'category';
        if (path.includes('about')) return 'about';
        if (path.includes('contact')) return 'contact';
        return 'page';
    }

    injectMetaTags() {
        console.log('🏷️ Injecting SEO meta tags...');

        const head = document.head;

        // Remove existing dynamic meta tags
        document.querySelectorAll('meta[data-seo-dynamic="true"]').forEach(el => el.remove());

        // Page-specific title and description
        const pageTitle = this.getPageTitle();
        const pageDescription = this.getPageDescription();
        const pageKeywords = this.getPageKeywords();

        // Update title
        document.title = pageTitle;

        // Meta description
        this.updateOrCreateMeta('description', pageDescription, true);

        // Meta keywords
        this.updateOrCreateMeta('keywords', pageKeywords.join(', '), true);

        // Robots
        this.updateOrCreateMeta('robots', this.config.robotsRules, true);

        // Language
        document.documentElement.lang = this.config.language;

        // Additional SEO meta tags
        this.updateOrCreateMeta('author', 'SPORTIQ Team', true);
        this.updateOrCreateMeta('viewport', 'width=device-width, initial-scale=1.0', true);
        this.updateOrCreateMeta('theme-color', '#1a73e8', true);

        console.log(`✅ Meta tags injected: ${pageTitle}`);
    }

    updateOrCreateMeta(name, content, isDynamic = false) {
        let meta = document.querySelector(`meta[name="${name}"]`);

        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }

        meta.content = content;
        if (isDynamic) {
            meta.setAttribute('data-seo-dynamic', 'true');
        }

        this.metaTags.set(name, content);
    }

    getPageTitle() {
        const base = this.config.siteName;

        switch (this.currentPage.type) {
            case 'homepage':
                return this.config.defaultTitle;
            case 'article':
                return `${this.currentPage.article || 'Article'} - ${base}`;
            case 'category':
                return `${this.currentPage.sport.toUpperCase()} - ${base}`;
            case 'about':
                return `About Us - ${base}`;
            case 'contact':
                return `Contact Us - ${base}`;
            default:
                return this.config.defaultTitle;
        }
    }

    getPageDescription() {
        switch (this.currentPage.type) {
            case 'homepage':
                return this.config.defaultDescription;
            case 'article':
                return `Read the latest sports news and updates about ${this.currentPage.article || 'this topic'} on SPORTIQ.`;
            case 'category':
                return `Comprehensive ${this.currentPage.sport} coverage with live scores, news, and analysis on SPORTIQ.`;
            case 'about':
                return `Learn about SPORTIQ - the ultimate global sports platform for live scores, breaking news, and comprehensive sports coverage.`;
            case 'contact':
                return `Get in touch with SPORTIQ. Contact us for support, partnerships, or feedback.`;
            default:
                return this.config.defaultDescription;
        }
    }

    getPageKeywords() {
        const baseKeywords = [...this.config.defaultKeywords];

        if (this.currentPage.sport && this.currentPage.sport !== 'all') {
            baseKeywords.push(this.currentPage.sport);
        }

        if (this.currentPage.category) {
            baseKeywords.push(this.currentPage.category);
        }

        return baseKeywords;
    }

    setupOpenGraph() {
        console.log('📘 Setting up Open Graph tags...');

        const ogTags = {
            'og:site_name': this.config.siteName,
            'og:title': this.getPageTitle(),
            'og:description': this.getPageDescription(),
            'og:type': this.config.ogType,
            'og:url': window.location.href,
            'og:locale': this.config.locale,
            'og:image': `${this.config.baseUrl}/assets/og-image.jpg`,
            'og:image:width': '1200',
            'og:image:height': '630'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            this.updateOrCreateMetaProperty(property, content, true);
        });

        console.log('✅ Open Graph tags setup complete');
    }

    setupTwitterCards() {
        console.log('🐦 Setting up Twitter Card tags...');

        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:site': this.config.twitterHandle,
            'twitter:title': this.getPageTitle(),
            'twitter:description': this.getPageDescription(),
            'twitter:image': `${this.config.baseUrl}/assets/twitter-card.jpg`
        };

        Object.entries(twitterTags).forEach(([name, content]) => {
            this.updateOrCreateMeta(name, content, true);
        });

        console.log('✅ Twitter Card tags setup complete');
    }

    updateOrCreateMetaProperty(property, content, isDynamic = false) {
        let meta = document.querySelector(`meta[property="${property}"]`);

        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }

        meta.content = content;
        if (isDynamic) {
            meta.setAttribute('data-seo-dynamic', 'true');
        }
    }

    injectSchemaMarkup() {
        if (!this.config.enableSchemaMarkup) return;

        console.log('📊 Injecting Schema.org markup...');

        const schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.config.siteName,
            "url": this.config.baseUrl,
            "description": this.config.defaultDescription,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${this.config.baseUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        };

        // Add organization schema
        const orgSchema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.config.siteName,
            "url": this.config.baseUrl,
            "logo": `${this.config.baseUrl}/assets/logo.png`,
            "sameAs": [
                "https://twitter.com/sportiq",
                "https://facebook.com/sportiq",
                "https://instagram.com/sportiq"
            ]
        };

        this.injectJSONLD(schema, 'website-schema');
        this.injectJSONLD(orgSchema, 'organization-schema');

        console.log('✅ Schema markup injected');
    }

    injectJSONLD(data, id) {
        // Remove existing schema with same ID
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }

    injectStructuredData() {
        console.log('📋 Injecting structured data...');

        // Article schema for article pages
        if (this.currentPage.type === 'article') {
            const articleSchema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": this.getPageTitle(),
                "description": this.getPageDescription(),
                "author": {
                    "@type": "Organization",
                    "name": this.config.siteName
                },
                "publisher": {
                    "@type": "Organization",
                    "name": this.config.siteName,
                    "logo": {
                        "@type": "ImageObject",
                        "url": `${this.config.baseUrl}/assets/logo.png`
                    }
                },
                "datePublished": this.currentPage.timestamp,
                "dateModified": this.currentPage.timestamp
            };

            this.injectJSONLD(articleSchema, 'article-schema');
        }

        console.log('✅ Structured data injected');
    }

    setupCanonicalLinks() {
        if (!this.config.enableCanonicalLinks) return;

        console.log('🔗 Setting up canonical links...');

        // Remove existing canonical
        const existing = document.querySelector('link[rel="canonical"]');
        if (existing) existing.remove();

        // Create canonical link
        const canonical = document.createElement('link');
        canonical.rel = 'canonical';
        canonical.href = this.getCanonicalUrl();
        document.head.appendChild(canonical);

        this.canonicalUrl = canonical.href;

        console.log(`✅ Canonical URL set: ${this.canonicalUrl}`);
    }

    getCanonicalUrl() {
        // Remove query parameters and fragments for clean canonical URL
        const url = new URL(window.location.href);
        return `${url.origin}${url.pathname}`;
    }

    async generateDynamicSitemap() {
        if (!this.config.enableDynamicSitemap) return;

        console.log('🗺️ Generating dynamic sitemap...');

        this.sitemap = [];

        // Add main pages
        const mainPages = [
            { url: '/', priority: 1.0, changefreq: 'daily' },
            { url: '/about.html', priority: 0.5, changefreq: 'monthly' },
            { url: '/contact.html', priority: 0.5, changefreq: 'monthly' },
            { url: '/category.html', priority: 0.8, changefreq: 'daily' }
        ];

        mainPages.forEach(page => {
            this.sitemap.push({
                loc: `${this.config.baseUrl}${page.url}`,
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: page.changefreq,
                priority: page.priority
            });
        });

        console.log(`✅ Dynamic sitemap generated with ${this.sitemap.length} URLs`);

        // Expose sitemap for export
        window.SPORTIQ_SITEMAP = this.sitemap;
    }

    setupSEOMonitoring() {
        console.log('📈 Setting up SEO monitoring...');

        // Track page views
        this.trackPageView();

        // Monitor performance metrics
        if (window.performance && window.performance.timing) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

            console.log(`⚡ Page load time: ${pageLoadTime}ms`);

            // Emit event for analytics
            window.dispatchEvent(new CustomEvent('seo:performance', {
                detail: { pageLoadTime, timestamp: Date.now() }
            }));
        }

        console.log('✅ SEO monitoring active');
    }

    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            type: this.currentPage.type,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || 'direct'
        };

        console.log('👁️ Page view tracked:', pageData);

        // Emit event for analytics
        window.dispatchEvent(new CustomEvent('seo:pageview', {
            detail: pageData
        }));
    }

    startAutoUpdate() {
        console.log(`⏰ Starting SEO auto-update (${this.config.autoUpdateInterval / 1000}s interval)`);

        setInterval(() => {
            console.log('🔄 Auto-updating SEO meta tags...');
            this.detectCurrentPage();
            this.injectMetaTags();
            this.setupOpenGraph();
            this.setupTwitterCards();
        }, this.config.autoUpdateInterval);
    }

    // Public API
    updatePageSEO(pageData) {
        console.log('🔄 Manually updating page SEO...');

        if (pageData.title) {
            document.title = pageData.title;
        }

        if (pageData.description) {
            this.updateOrCreateMeta('description', pageData.description, true);
        }

        if (pageData.keywords) {
            this.updateOrCreateMeta('keywords', pageData.keywords.join(', '), true);
        }

        this.setupOpenGraph();
        this.setupTwitterCards();

        console.log('✅ Page SEO updated');
    }

    getSitemapXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        this.sitemap.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${page.loc}</loc>\n`;
            xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });

        xml += '</urlset>';

        return xml;
    }

    exportSitemap() {
        const xml = this.getSitemapXML();
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.click();

        URL.revokeObjectURL(url);

        console.log('✅ Sitemap exported');
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 69,
            name: 'SEO Optimization Core',
            currentPage: this.currentPage,
            metaTags: Object.fromEntries(this.metaTags),
            canonicalUrl: this.canonicalUrl,
            sitemapPages: this.sitemap.length,
            features: {
                metaTags: true,
                openGraph: this.config.enableOpenGraph,
                twitterCards: this.config.enableTwitterCards,
                schemaMarkup: this.config.enableSchemaMarkup,
                canonicalLinks: this.config.enableCanonicalLinks,
                dynamicSitemap: this.config.enableDynamicSitemap,
                autoUpdate: true
            }
        };
    }

    destroy() {
        this.isActive = false;
        console.log('🗑️ Layer 69 destroyed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer69_SEOOptimization = new SEOOptimizationCore();
    });
} else {
    window.Layer69_SEOOptimization = new SEOOptimizationCore();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOOptimizationCore;
}
