/**
 * Layer 27: Core Content & Data Foundation Runtime
 * Complete content management engine with templates, data mapping, and API integration
 */

class ContentFoundationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_CONTENT__) {
            return window.__ANTIGRAVITY_CONTENT__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-027';
        this.name = 'Core Content & Data Foundation';

        this.articles = [];
        this.categories = [];
        this.sections = [];
        this.templates = new Map();

        console.log(`[Content v${this.version}] Initializing...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        await this._loadTemplates();
        await this._loadContent();
        this._setupDataMapping();
        this._registerAPIPlaceholders();
        console.log('[Content] Initialized');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/content-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = this._getDefaultConfig();
        }
    }

    _getDefaultConfig() {
        return {
            articlesPerPage: 10,
            categoriesEnabled: true,
            sectionsEnabled: true,
            autoLoadContent: true,
            cacheTimeout: 300000
        };
    }

    async _loadTemplates() {
        // Article template
        this.templates.set('article', `
            <article class="content-article" data-article-id="{{id}}">
                <header class="article-header">
                    <h1 class="article-title">{{title}}</h1>
                    <div class="article-meta">
                        <span class="article-author">{{author}}</span>
                        <span class="article-date">{{date}}</span>
                        <span class="article-category">{{category}}</span>
                    </div>
                </header>
                {{#if featuredImage}}
                <div class="article-image">
                    <img src="{{featuredImage}}" alt="{{title}}" loading="lazy">
                </div>
                {{/if}}
                <div class="article-content">
                    {{content}}
                </div>
                <footer class="article-footer">
                    <div class="article-tags">
                        {{#each tags}}
                        <span class="tag">{{this}}</span>
                        {{/each}}
                    </div>
                    <div class="article-actions">
                        <button class="btn-like" data-article-id="{{id}}">Like</button>
                        <button class="btn-share" data-article-id="{{id}}">Share</button>
                        <button class="btn-bookmark" data-article-id="{{id}}">Bookmark</button>
                    </div>
                </footer>
            </article>
        `);

        // Category template
        this.templates.set('category', `
            <div class="content-category" data-category-id="{{id}}">
                <h2 class="category-title">{{name}}</h2>
                <p class="category-description">{{description}}</p>
                <div class="category-stats">
                    <span>{{articleCount}} articles</span>
                </div>
            </div>
        `);

        // Section template
        this.templates.set('section', `
            <section class="content-section" data-section-id="{{id}}">
                <h2 class="section-title">{{title}}</h2>
                <div class="section-articles" id="section-{{id}}-articles">
                    <!-- Articles loaded dynamically -->
                </div>
            </section>
        `);
    }

    async _loadContent() {
        // Load from CMS if available
        if (window.__ANTIGRAVITY_CMS__) {
            this.articles = window.__ANTIGRAVITY_CMS__.getArticles();
            this.categories = window.__ANTIGRAVITY_CMS__.getCategories();
        }

        // Load from localStorage
        const stored = localStorage.getItem('content_data');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.articles) this.articles = data.articles;
            if (data.categories) this.categories = data.categories;
        }
    }

    _setupDataMapping() {
        // Create data mapping for content
        this.dataMap = {
            article: {
                id: 'string',
                title: 'string',
                slug: 'string',
                content: 'html',
                excerpt: 'string',
                author: 'string',
                category: 'string',
                tags: 'array',
                featuredImage: 'url',
                publishedAt: 'date',
                status: 'enum:draft|published|archived'
            },
            category: {
                id: 'string',
                name: 'string',
                slug: 'string',
                description: 'string',
                parent: 'string',
                count: 'number'
            },
            section: {
                id: 'string',
                title: 'string',
                layout: 'string',
                articles: 'array',
                order: 'number'
            }
        };
    }

    _registerAPIPlaceholders() {
        // Register API endpoints for future integration
        this.apiEndpoints = {
            getArticles: '/api/articles',
            getArticle: '/api/articles/:id',
            getCategories: '/api/categories',
            getSections: '/api/sections',
            search: '/api/search'
        };
    }

    // Content rendering
    renderArticle(article, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = this._processTemplate('article', article);
        container.innerHTML = html;
        this._attachEventListeners(container);
    }

    renderCategory(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = this._processTemplate('category', category);
        container.innerHTML = html;
    }

    renderSection(section, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = this._processTemplate('section', section);
        container.innerHTML = html;

        // Load section articles
        const articlesContainer = document.getElementById(`section-${section.id}-articles`);
        if (articlesContainer && section.articles) {
            section.articles.forEach(articleId => {
                const article = this.getArticle(articleId);
                if (article) {
                    const articleHtml = this._processTemplate('article', article);
                    articlesContainer.innerHTML += articleHtml;
                }
            });
        }
    }

    _processTemplate(templateName, data) {
        let template = this.templates.get(templateName);
        if (!template) return '';

        // Simple template processing (replace {{var}})
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, data[key] || '');
        });

        // Handle conditionals {{#if}}
        template = template.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (match, key, content) => {
            return data[key] ? content : '';
        });

        // Handle loops {{#each}}
        template = template.replace(/{{#each (\w+)}}(.*?){{\/each}}/gs, (match, key, content) => {
            if (!data[key] || !Array.isArray(data[key])) return '';
            return data[key].map(item => {
                return content.replace(/{{this}}/g, item);
            }).join('');
        });

        return template;
    }

    _attachEventListeners(container) {
        // Like button
        container.querySelectorAll('.btn-like').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const articleId = e.target.dataset.articleId;
                this.likeArticle(articleId);
            });
        });

        // Share button
        container.querySelectorAll('.btn-share').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const articleId = e.target.dataset.articleId;
                this.shareArticle(articleId);
            });
        });

        // Bookmark button
        container.querySelectorAll('.btn-bookmark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const articleId = e.target.dataset.articleId;
                this.bookmarkArticle(articleId);
            });
        });
    }

    // Content operations
    getArticle(id) {
        return this.articles.find(a => a.id === id);
    }

    getArticleBySlug(slug) {
        return this.articles.find(a => a.slug === slug);
    }

    getArticlesByCategory(categoryId) {
        return this.articles.filter(a => a.category === categoryId);
    }

    getCategory(id) {
        return this.categories.find(c => c.id === id);
    }

    searchArticles(query) {
        const lowerQuery = query.toLowerCase();
        return this.articles.filter(a =>
            a.title.toLowerCase().includes(lowerQuery) ||
            a.content.toLowerCase().includes(lowerQuery) ||
            a.excerpt.toLowerCase().includes(lowerQuery)
        );
    }

    likeArticle(articleId) {
        const article = this.getArticle(articleId);
        if (article) {
            article.likes = (article.likes || 0) + 1;
            this._saveContent();
            this._emitEvent('content:article-liked', { articleId, likes: article.likes });
        }
    }

    shareArticle(articleId) {
        const article = this.getArticle(articleId);
        if (article && window.__ANTIGRAVITY_SOCIAL__) {
            window.__ANTIGRAVITY_SOCIAL__.share('twitter', window.location.href, article.title);
        }
    }

    bookmarkArticle(articleId) {
        if (window.__ANTIGRAVITY_BOOKMARK__) {
            window.__ANTIGRAVITY_BOOKMARK__.add(articleId);
        }
    }

    _saveContent() {
        localStorage.setItem('content_data', JSON.stringify({
            articles: this.articles,
            categories: this.categories
        }));
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    getState() {
        return {
            articles: this.articles.length,
            categories: this.categories.length,
            sections: this.sections.length
        };
    }
}

const contentFoundation = new ContentFoundationRuntime();
window.__ANTIGRAVITY_CONTENT__ = contentFoundation;

if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[Content] Registered with runtime');
    });
}

export default contentFoundation;
