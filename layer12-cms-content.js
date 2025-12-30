/**
 * Layer 12: CMS & Content Management Runtime
 * ID: layer-012
 * Type: Core
 * Description: Complete CMS for creating, editing, deleting articles, categories, and media management.
 */

class CMSRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_CMS__) {
            console.warn('[CMS] CMS runtime already initialized.');
            return window.__ANTIGRAVITY_CMS__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-012';
        this.name = 'CMS & Content Management Runtime';
        this.timestamp = new Date().toISOString();

        // Configuration
        this.config = null;
        this.articles = [];
        this.categories = [];
        this.media = [];
        this.currentArticle = null;
        this.currentUser = null;

        // Storage keys
        this.storageKeys = {
            articles: 'cms_articles',
            categories: 'cms_categories',
            media: 'cms_media',
            drafts: 'cms_drafts'
        };

        // Permissions
        this.permissions = {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canPublish: true
        };

        console.log(`[CMS v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize CMS
     */
    async _init() {
        try {
            await this._loadConfig();
            await this._loadData();
            this._setupEditors();
            this._registerEvents();
            console.log('[CMS] Initialized successfully');
        } catch (error) {
            console.error('[CMS] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'cms:init');
            }
        }
    }

    /**
     * Load configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/cms-config.json');
            if (response.ok) {
                this.config = await response.json();
                console.log('[CMS] Configuration loaded');
            }
        } catch (error) {
            console.warn('[CMS] Using default configuration:', error);
            this.config = this._getDefaultConfig();
        }
    }

    /**
     * Default configuration
     */
    _getDefaultConfig() {
        return {
            autoSave: true,
            autoSaveInterval: 30000,
            maxFileSize: 10485760,
            allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4'],
            editorOptions: {
                height: 400,
                toolbar: ['bold', 'italic', 'underline', 'link', 'image', 'code']
            }
        };
    }

    /**
     * Load data from localStorage
     */
    async _loadData() {
        // Load articles
        const articlesJSON = localStorage.getItem(this.storageKeys.articles);
        this.articles = articlesJSON ? JSON.parse(articlesJSON) : [];

        // Load categories
        const categoriesJSON = localStorage.getItem(this.storageKeys.categories);
        this.categories = categoriesJSON ? JSON.parse(categoriesJSON) : this._getDefaultCategories();

        // Load media
        const mediaJSON = localStorage.getItem(this.storageKeys.media);
        this.media = mediaJSON ? JSON.parse(mediaJSON) : [];
    }

    /**
     * Default categories
     */
    _getDefaultCategories() {
        return [
            { id: 'football', name: 'Football', slug: 'football', count: 0 },
            { id: 'basketball', name: 'Basketball', slug: 'basketball', count: 0 },
            { id: 'tennis', name: 'Tennis', slug: 'tennis', count: 0 },
            { id: 'news', name: 'News', slug: 'news', count: 0 },
            { id: 'analysis', name: 'Analysis', slug: 'analysis', count: 0 }
        ];
    }

    /**
     * Save data to localStorage
     */
    _saveData() {
        localStorage.setItem(this.storageKeys.articles, JSON.stringify(this.articles));
        localStorage.setItem(this.storageKeys.categories, JSON.stringify(this.categories));
        localStorage.setItem(this.storageKeys.media, JSON.stringify(this.media));
    }

    /**
     * Create Article
     */
    createArticle(data) {
        const article = {
            id: this._generateId(),
            title: data.title || 'Untitled',
            slug: this._generateSlug(data.title),
            content: data.content || '',
            excerpt: data.excerpt || '',
            author: data.author || 'Admin',
            category: data.category || 'news',
            tags: data.tags || [],
            featuredImage: data.featuredImage || null,
            status: data.status || 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: data.status === 'published' ? new Date().toISOString() : null,
            views: 0,
            likes: 0
        };

        this.articles.unshift(article);
        this._saveData();
        this._emitEvent('cms:article-created', article);

        return article;
    }

    /**
     * Update Article
     */
    updateArticle(id, updates) {
        const index = this.articles.findIndex(a => a.id === id);

        if (index === -1) {
            throw new Error(`Article not found: ${id}`);
        }

        const article = this.articles[index];
        const updatedArticle = {
            ...article,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Update published date if status changed to published
        if (updates.status === 'published' && article.status !== 'published') {
            updatedArticle.publishedAt = new Date().toISOString();
        }

        this.articles[index] = updatedArticle;
        this._saveData();
        this._emitEvent('cms:article-updated', updatedArticle);

        return updatedArticle;
    }

    /**
     * Delete Article
     */
    deleteArticle(id) {
        const index = this.articles.findIndex(a => a.id === id);

        if (index === -1) {
            throw new Error(`Article not found: ${id}`);
        }

        const article = this.articles[index];
        this.articles.splice(index, 1);
        this._saveData();
        this._emitEvent('cms:article-deleted', { id, article });

        return true;
    }

    /**
     * Get Article
     */
    getArticle(id) {
        return this.articles.find(a => a.id === id);
    }

    /**
     * Get Articles
     */
    getArticles(filters = {}) {
        let results = [...this.articles];

        // Filter by status
        if (filters.status) {
            results = results.filter(a => a.status === filters.status);
        }

        // Filter by category
        if (filters.category) {
            results = results.filter(a => a.category === filters.category);
        }

        // Filter by author
        if (filters.author) {
            results = results.filter(a => a.author === filters.author);
        }

        // Search
        if (filters.search) {
            const query = filters.search.toLowerCase();
            results = results.filter(a =>
                a.title.toLowerCase().includes(query) ||
                a.content.toLowerCase().includes(query)
            );
        }

        // Sort
        if (filters.sortBy) {
            results.sort((a, b) => {
                const aVal = a[filters.sortBy];
                const bVal = b[filters.sortBy];
                return filters.sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
        }

        // Pagination
        if (filters.page && filters.perPage) {
            const start = (filters.page - 1) * filters.perPage;
            const end = start + filters.perPage;
            results = results.slice(start, end);
        }

        return results;
    }

    /**
     * Create Category
     */
    createCategory(data) {
        const category = {
            id: this._generateId(),
            name: data.name,
            slug: this._generateSlug(data.name),
            description: data.description || '',
            count: 0,
            createdAt: new Date().toISOString()
        };

        this.categories.push(category);
        this._saveData();
        this._emitEvent('cms:category-created', category);

        return category;
    }

    /**
     * Update Category
     */
    updateCategory(id, updates) {
        const index = this.categories.findIndex(c => c.id === id);

        if (index === -1) {
            throw new Error(`Category not found: ${id}`);
        }

        this.categories[index] = {
            ...this.categories[index],
            ...updates
        };

        this._saveData();
        this._emitEvent('cms:category-updated', this.categories[index]);

        return this.categories[index];
    }

    /**
     * Delete Category
     */
    deleteCategory(id) {
        const index = this.categories.findIndex(c => c.id === id);

        if (index === -1) {
            throw new Error(`Category not found: ${id}`);
        }

        this.categories.splice(index, 1);
        this._saveData();
        this._emitEvent('cms:category-deleted', { id });

        return true;
    }

    /**
     * Get Categories
     */
    getCategories() {
        return this.categories;
    }

    /**
     * Upload Media
     */
    uploadMedia(file) {
        return new Promise((resolve, reject) => {
            // Validate file size
            if (file.size > this.config.maxFileSize) {
                reject(new Error('File size exceeds limit'));
                return;
            }

            // Validate file type
            const ext = file.name.split('.').pop().toLowerCase();
            if (!this.config.allowedFileTypes.includes(ext)) {
                reject(new Error('File type not allowed'));
                return;
            }

            // Read file as base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const media = {
                    id: this._generateId(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: e.target.result,
                    uploadedAt: new Date().toISOString()
                };

                this.media.push(media);
                this._saveData();
                this._emitEvent('cms:media-uploaded', media);

                resolve(media);
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Delete Media
     */
    deleteMedia(id) {
        const index = this.media.findIndex(m => m.id === id);

        if (index === -1) {
            throw new Error(`Media not found: ${id}`);
        }

        this.media.splice(index, 1);
        this._saveData();
        this._emitEvent('cms:media-deleted', { id });

        return true;
    }

    /**
     * Get Media
     */
    getMedia(filters = {}) {
        let results = [...this.media];

        if (filters.type) {
            results = results.filter(m => m.type.startsWith(filters.type));
        }

        return results;
    }

    /**
     * Setup editors (for CMS dashboard)
     */
    _setupEditors() {
        // Placeholder for rich text editor setup
        // Would integrate with TinyMCE, Quill, or similar
    }

    /**
     * Auto-save draft
     */
    autoSaveDraft(article) {
        const drafts = JSON.parse(localStorage.getItem(this.storageKeys.drafts) || '{}');
        drafts[article.id || 'new'] = {
            ...article,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(this.storageKeys.drafts, JSON.stringify(drafts));
    }

    /**
     * Load draft
     */
    loadDraft(id = 'new') {
        const drafts = JSON.parse(localStorage.getItem(this.storageKeys.drafts) || '{}');
        return drafts[id] || null;
    }

    /**
     * Clear draft
     */
    clearDraft(id = 'new') {
        const drafts = JSON.parse(localStorage.getItem(this.storageKeys.drafts) || '{}');
        delete drafts[id];
        localStorage.setItem(this.storageKeys.drafts, JSON.stringify(drafts));
    }

    /**
     * Generate ID
     */
    _generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate slug
     */
    _generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    /**
     * Event bus integration
     */
    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }

        // Update state store
        if (window.__ANTIGRAVITY_STATE__) {
            window.__ANTIGRAVITY_STATE__.set('cms.lastUpdate', new Date().toISOString());
        }
    }

    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Listen for CMS commands
        eventBus.on('cms:create-article', (data) => {
            this.createArticle(data);
        });

        eventBus.on('cms:update-article', (data) => {
            this.updateArticle(data.id, data.updates);
        });

        eventBus.on('cms:delete-article', (data) => {
            this.deleteArticle(data.id);
        });
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            totalArticles: this.articles.length,
            publishedArticles: this.articles.filter(a => a.status === 'published').length,
            draftArticles: this.articles.filter(a => a.status === 'draft').length,
            totalCategories: this.categories.length,
            totalMedia: this.media.length,
            totalViews: this.articles.reduce((sum, a) => sum + a.views, 0),
            totalLikes: this.articles.reduce((sum, a) => sum + a.likes, 0)
        };
    }

    /**
     * Get state
     */
    getState() {
        return {
            articles: this.articles.length,
            categories: this.categories.length,
            media: this.media.length,
            statistics: this.getStatistics()
        };
    }
}

// Initialize and Export
const cms = new CMSRuntime();
window.__ANTIGRAVITY_CMS__ = cms;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[CMS] Registered with runtime');
    });
}

export default cms;
