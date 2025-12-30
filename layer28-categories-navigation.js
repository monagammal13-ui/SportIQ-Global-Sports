/**
 * Layer 28: Global Categories & Navigation Runtime
 * Standalone implementation with full navigation system, dropdowns, filters, and dynamic menus
 */

class CategoriesNavigationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_CATEGORIES_NAV__) {
            return window.__ANTIGRAVITY_CATEGORIES_NAV__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-028';
        this.name = 'Global Categories & Navigation';

        this.categories = [];
        this.navigationMenus = [];
        this.activeCategory = null;
        this.filters = {};

        console.log(`[Categories Nav v${this.version}] Initializing...`);
        this._init();
    }

    async _init() {
        try {
            await this._loadConfig();
            await this._loadCategories();
            this._buildHierarchy();
            this._renderNavigation();
            this._setupDropdowns();
            this._setupFilters();
            this._setupDynamicMenus();
            console.log('[Categories Nav] Fully initialized');
        } catch (error) {
            console.error('[Categories Nav] Init error:', error);
        }
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/categories-nav-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = this._getDefaultConfig();
        }
    }

    _getDefaultConfig() {
        return {
            maxDepth: 3,
            showCount: true,
            enableFilters: true,
            enableSearch: true,
            mobileBreakpoint: 768
        };
    }

    async _loadCategories() {
        // Load from CMS
        if (window.__ANTIGRAVITY_CMS__) {
            this.categories = window.__ANTIGRAVITY_CMS__.getCategories();
        }

        // Load from config
        try {
            const response = await fetch('../api-json/categories-hierarchy.json');
            const data = await response.json();
            if (data.categories) {
                this.categories = [...this.categories, ...data.categories];
            }
        } catch (error) {
            console.warn('[Categories Nav] Using default categories');
        }

        // Deduplicate
        this.categories = Array.from(new Map(this.categories.map(c => [c.id, c])).values());
    }

    _buildHierarchy() {
        // Build parent-child relationships
        this.categoryTree = this.categories
            .filter(c => !c.parent)
            .map(category => this._buildTree(category));
    }

    _buildTree(category) {
        const children = this.categories
            .filter(c => c.parent === category.id)
            .map(child => this._buildTree(child));

        return {
            ...category,
            children: children.length > 0 ? children : null
        };
    }

    _renderNavigation() {
        const navContainer = document.getElementById('global-navigation');
        if (!navContainer) {
            console.warn('[Categories Nav] Navigation container not found');
            return;
        }

        const nav = this._createNavigationHTML();
        navContainer.innerHTML = nav;
        this._attachNavigationEvents();
    }

    _createNavigationHTML() {
        let html = '<nav class="categories-nav">';
        html += '<ul class="nav-menu-primary">';

        this.categoryTree.forEach(category => {
            html += this._createMenuItem(category, 0);
        });

        html += '</ul>';
        html += '</nav>';

        return html;
    }

    _createMenuItem(category, depth) {
        const hasChildren = category.children && category.children.length > 0;
        const countBadge = this.config.showCount && category.count ?
            `<span class="category-count">${category.count}</span>` : '';

        let html = `<li class="nav-item nav-depth-${depth}" data-category-id="${category.id}">`;
        html += `<a href="/category/${category.slug}" class="nav-link">`;
        html += `${category.name} ${countBadge}`;

        if (hasChildren) {
            html += '<span class="dropdown-arrow">▼</span>';
        }

        html += '</a>';

        if (hasChildren && depth < this.config.maxDepth) {
            html += '<ul class="nav-submenu">';
            category.children.forEach(child => {
                html += this._createMenuItem(child, depth + 1);
            });
            html += '</ul>';
        }

        html += '</li>';

        return html;
    }

    _setupDropdowns() {
        document.querySelectorAll('.nav-item').forEach(item => {
            const link = item.querySelector('.nav-link');
            const submenu = item.querySelector('.nav-submenu');

            if (submenu) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this._toggleDropdown(item);
                });
            }
        });
    }

    _toggleDropdown(item) {
        const isOpen = item.classList.contains('dropdown-open');

        // Close all dropdowns at same level
        const siblings = item.parentElement.querySelectorAll('.dropdown-open');
        siblings.forEach(sibling => {
            if (sibling !== item) {
                sibling.classList.remove('dropdown-open');
            }
        });

        // Toggle current
        if (isOpen) {
            item.classList.remove('dropdown-open');
        } else {
            item.classList.add('dropdown-open');
        }
    }

    _setupFilters() {
        if (!this.config.enableFilters) return;

        // Create filter controls
        const filterContainer = document.getElementById('category-filters');
        if (!filterContainer) return;

        const filtersHTML = `
            <div class="category-filters">
                <select class="filter-sort" id="categorySort">
                    <option value="name">Sort by Name</option>
                    <option value="count">Sort by Count</option>
                    <option value="recent">Recently Updated</option>
                </select>
                <input type="text" class="filter-search" id="categorySearch" placeholder="Search categories...">
                <button class="filter-reset" id="resetFilters">Reset</button>
            </div>
        `;

        filterContainer.innerHTML = filtersHTML;
        this._attachFilterEvents();
    }

    _attachFilterEvents() {
        const sortSelect = document.getElementById('categorySort');
        const searchInput = document.getElementById('categorySearch');
        const resetBtn = document.getElementById('resetFilters');

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.applySorting(e.target.value);
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCategories(e.target.value);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    applySorting(sortBy) {
        let sorted = [...this.categories];

        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'count':
                sorted.sort((a, b) => (b.count || 0) - (a.count || 0));
                break;
            case 'recent':
                sorted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                break;
        }

        this.categories = sorted;
        this._buildHierarchy();
        this._renderNavigation();
    }

    filterCategories(query) {
        if (!query) {
            this._renderNavigation();
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = this.categories.filter(c =>
            c.name.toLowerCase().includes(lowerQuery) ||
            (c.description && c.description.toLowerCase().includes(lowerQuery))
        );

        // Temporarily replace categories for rendering
        const original = this.categories;
        this.categories = filtered;
        this._buildHierarchy();
        this._renderNavigation();
        this.categories = original;
    }

    resetFilters() {
        document.getElementById('categorySort').value = 'name';
        document.getElementById('categorySearch').value = '';
        this._buildHierarchy();
        this._renderNavigation();
    }

    _setupDynamicMenus() {
        // Setup mobile menu toggle
        this._setupMobileMenu();

        // Setup breadcrumbs
        this._updateBreadcrumbs();

        // Setup active category highlighting
        this._highlightActiveCategory();
    }

    _setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-nav-toggle');
        const nav = document.querySelector('.categories-nav');

        if (mobileToggle && nav) {
            mobileToggle.addEventListener('click', () => {
                nav.classList.toggle('mobile-open');
            });
        }

        // Close on resize if above breakpoint
        window.addEventListener('resize', () => {
            if (window.innerWidth > this.config.mobileBreakpoint) {
                nav?.classList.remove('mobile-open');
            }
        });
    }

    _updateBreadcrumbs() {
        const breadcrumbContainer = document.getElementById('breadcrumbs');
        if (!breadcrumbContainer || !this.activeCategory) return;

        const path = this._getCategoryPath(this.activeCategory);
        const breadcrumbs = path.map((cat, index) => {
            const isLast = index === path.length - 1;
            return `
                <span class="breadcrumb-item ${isLast ? 'active' : ''}">
                    ${isLast ? cat.name : `<a href="/category/${cat.slug}">${cat.name}</a>`}
                </span>
            `;
        }).join('<span class="breadcrumb-separator">/</span>');

        breadcrumbContainer.innerHTML = `<nav class="breadcrumbs">${breadcrumbs}</nav>`;
    }

    _getCategoryPath(categoryId) {
        const path = [];
        let current = this.categories.find(c => c.id === categoryId);

        while (current) {
            path.unshift(current);
            current = current.parent ? this.categories.find(c => c.id === current.parent) : null;
        }

        return path;
    }

    _highlightActiveCategory() {
        // Get current URL path
        const currentPath = window.location.pathname;

        // Find matching category
        const activeSlug = currentPath.split('/').pop();
        this.activeCategory = this.categories.find(c => c.slug === activeSlug)?.id;

        // Highlight in nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.categoryId === this.activeCategory) {
                item.classList.add('active');

                // Open parent dropdowns
                let parent = item.parentElement.closest('.nav-item');
                while (parent) {
                    parent.classList.add('dropdown-open');
                    parent = parent.parentElement.closest('.nav-item');
                }
            }
        });
    }

    _attachNavigationEvents() {
        // Track navigation clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.nav-item').dataset.categoryId;
                this._trackNavigation(categoryId);
            });
        });
    }

    _trackNavigation(categoryId) {
        if (window.__ANTIGRAVITY_ANALYTICS_GROWTH__) {
            window.__ANTIGRAVITY_ANALYTICS_GROWTH__.trackEvent('category_navigation', {
                categoryId,
                timestamp: Date.now()
            });
        }

        this._emitEvent('categories:navigation', { categoryId });
    }

    // Public API
    getCategory(id) {
        return this.categories.find(c => c.id === id);
    }

    getCategoryBySlug(slug) {
        return this.categories.find(c => c.slug === slug);
    }

    getChildren(parentId) {
        return this.categories.filter(c => c.parent === parentId);
    }

    setActiveCategory(categoryId) {
        this.activeCategory = categoryId;
        this._highlightActiveCategory();
        this._updateBreadcrumbs();
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    getState() {
        return {
            categories: this.categories.length,
            activeCategory: this.activeCategory,
            maxDepth: this.config.maxDepth
        };
    }
}

// Initialize and export
const categoriesNav = new CategoriesNavigationRuntime();
window.__ANTIGRAVITY_CATEGORIES_NAV__ = categoriesNav;

// Register with core engines
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[Categories Nav] Registered with runtime');
    });
}

if (window.__ANTIGRAVITY_EVENT_BUS__) {
    window.__ANTIGRAVITY_EVENT_BUS__.on('content:category-updated', (data) => {
        categoriesNav._loadCategories();
    });
}

export default categoriesNav;
