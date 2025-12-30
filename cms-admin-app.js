/**
 * CMS Admin Application
 * Handles UI interactions for the CMS dashboard
 */

class CMSAdminApp {
    constructor() {
        this.cms = window.__ANTIGRAVITY_CMS__;
        this.currentArticleId = null;
        this._init();
    }

    _init() {
        this._setupNavigation();
        this._setupArticles();
        this._setupCategories();
        this._setupMedia();
        this._updateDashboard();
    }

    _setupNavigation() {
        const navLinks = document.querySelectorAll('.cms-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this._showSection(section);

                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    _showSection(sectionId) {
        const sections = document.querySelectorAll('.cms-section');
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId)?.classList.add('active');
    }

    _setupArticles() {
        document.getElementById('btnNewArticle')?.addEventListener('click', () => {
            this._openArticleModal();
        });

        document.getElementById('btnSaveArticle')?.addEventListener('click', () => {
            this._saveArticle();
        });

        document.getElementById('btnCancelArticle')?.addEventListener('click', () => {
            this._closeArticleModal();
        });

        document.getElementById('btnCloseModal')?.addEventListener('click', () => {
            this._closeArticleModal();
        });

        this._renderArticles();
    }

    _setupCategories() {
        document.getElementById('btnNewCategory')?.addEventListener('click', () => {
            const name = prompt('Enter category name:');
            if (name) {
                this.cms.createCategory({ name });
                this._renderCategories();
            }
        });

        this._renderCategories();
    }

    _setupMedia() {
        document.getElementById('btnUploadMedia')?.addEventListener('click', () => {
            document.getElementById('fileMediaUpload')?.click();
        });

        document.getElementById('fileMediaUpload')?.addEventListener('change', (e) => {
            const files = e.target.files;
            Array.from(files).forEach(file => {
                this.cms.uploadMedia(file).then(() => {
                    this._renderMedia();
                });
            });
        });

        this._renderMedia();
    }

    _updateDashboard() {
        const stats = this.cms.getStatistics();
        document.getElementById('statTotalArticles').textContent = stats.totalArticles;
        document.getElementById('statPublished').textContent = stats.publishedArticles;
        document.getElementById('statDrafts').textContent = stats.draftArticles;
        document.getElementById('statMedia').textContent = stats.totalMedia;
    }

    _renderArticles() {
        const container = document.getElementById('articlesContainer');
        const articles = this.cms.getArticles();

        if (articles.length === 0) {
            container.innerHTML = '<p style="padding:2rem;text-align:center;">No articles yet</p>';
            return;
        }

        container.innerHTML = articles.map(article => `
            <div class="article-row">
                <div class="article-info">
                    <h3>${article.title}</h3>
                    <div class="article-meta">
                        ${article.status} • ${article.category} • ${new Date(article.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="article-actions">
                    <button class="btn btn-sm btn-primary" onclick="cmsApp._editArticle('${article.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="cmsApp._deleteArticle('${article.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    _renderCategories() {
        const container = document.getElementById('categoriesContainer');
        const categories = this.cms.getCategories();

        container.innerHTML = categories.map(cat => `
            <div class="category-row">
                <div>
                    <h3>${cat.name}</h3>
                    <div class="article-meta">${cat.count || 0} articles</div>
                </div>
                <div class="article-actions">
                    <button class="btn btn-sm btn-danger" onclick="cmsApp._deleteCategory('${cat.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    _renderMedia() {
        const container = document.getElementById('mediaContainer');
        const media = this.cms.getMedia();

        container.innerHTML = media.map(m => `
            <div class="media-item">
                <img src="${m.url}" alt="${m.name}">
            </div>
        `).join('');
    }

    _openArticleModal(article = null) {
        this.currentArticleId = article?.id || null;
        const modal = document.getElementById('articleModal');

        if (article) {
            document.getElementById('modalTitle').textContent = 'Edit Article';
            document.getElementById('articleTitle').value = article.title;
            document.getElementById('articleContent').value = article.content;
            document.getElementById('articleExcerpt').value = article.excerpt || '';
            document.getElementById('articleCategory').value = article.category;
            document.getElementById('articleStatus').value = article.status;
        } else {
            document.getElementById('modalTitle').textContent = 'New Article';
            document.getElementById('article Form')?.reset();
        }

        modal.classList.add('active');
    }

    _closeArticleModal() {
        document.getElementById('articleModal').classList.remove('active');
        this.currentArticleId = null;
    }

    _saveArticle() {
        const data = {
            title: document.getElementById('articleTitle').value,
            content: document.getElementById('articleContent').value,
            excerpt: document.getElementById('articleExcerpt').value,
            category: document.getElementById('articleCategory').value,
            status: document.getElementById('articleStatus').value
        };

        if (this.currentArticleId) {
            this.cms.updateArticle(this.currentArticleId, data);
        } else {
            this.cms.createArticle(data);
        }

        this._closeArticleModal();
        this._renderArticles();
        this._updateDashboard();
    }

    _editArticle(id) {
        const article = this.cms.getArticle(id);
        if (article) {
            this._openArticleModal(article);
        }
    }

    _deleteArticle(id) {
        if (confirm('Are you sure you want to delete this article?')) {
            this.cms.deleteArticle(id);
            this._renderArticles();
            this._updateDashboard();
        }
    }

    _deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            this.cms.deleteCategory(id);
            this._renderCategories();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cmsApp = new CMSAdminApp();
    });
} else {
    window.cmsApp = new CMSAdminApp();
}
