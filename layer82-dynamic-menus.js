/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 82: MULTI-CATEGORY DYNAMIC MENUS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Dynamic menu generation, hierarchy management, category organization
 * Features: Multi-level menus, priority sorting, auto-sync, mobile responsive
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        menu: {
            configPath: '../api-json/menu-config.json',
            defaultContainer: '.nav-menu',
            mobileBreakpoint: 768,
            enableSearch: true
        },
        events: {
            menuRendered: 'menu:rendered',
            itemClicked: 'menu:item-clicked',
            categoryChanged: 'menu:category-changed'
        }
    };

    const state = {
        categories: new Map(),
        menuItems: new Map(),
        hierarchy: new Map(),
        activeCategory: null,
        mobileMenuOpen: false,
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const CategoryManager = {
        register: function (category) {
            state.categories.set(category.id, {
                id: category.id,
                name: category.name,
                slug: category.slug || category.id,
                icon: category.icon || '📁',
                priority: category.priority || 100,
                parent: category.parent || null,
                enabled: category.enabled !== false,
                children: []
            });

            // Build hierarchy
            if (category.parent) {
                const parent = state.categories.get(category.parent);
                if (parent) {
                    parent.children.push(category.id);
                }
            }

            console.log('✅ [Menu] Category registered:', category.name);
        },

        getAll: function (filter = {}) {
            let categories = Array.from(state.categories.values());

            if (filter.parent !== undefined) {
                categories = categories.filter(c => c.parent === filter.parent);
            }

            if (filter.enabled !== undefined) {
                categories = categories.filter(c => c.enabled === filter.enabled);
            }

            return categories.sort((a, b) => a.priority - b.priority);
        },

        getRoot: function () {
            return this.getAll({ parent: null, enabled: true });
        },

        getChildren: function (categoryId) {
            const category = state.categories.get(categoryId);
            if (!category) return [];

            return category.children.map(id => state.categories.get(id))
                .filter(Boolean)
                .sort((a, b) => a.priority - b.priority);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MENU ITEM MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const MenuItemManager = {
        register: function (item) {
            state.menuItems.set(item.id, {
                id: item.id,
                title: item.title,
                url: item.url || '#',
                category: item.category,
                icon: item.icon || '',
                priority: item.priority || 100,
                badge: item.badge || null,
                target: item.target || '_self',
                enabled: item.enabled !== false
            });

            console.log('✅ [Menu] Item registered:', item.title);
        },

        getByCategory: function (categoryId) {
            const items = Array.from(state.menuItems.values())
                .filter(item => item.category === categoryId && item.enabled);

            return items.sort((a, b) => a.priority - b.priority);
        },

        getAll: function () {
            return Array.from(state.menuItems.values())
                .filter(item => item.enabled)
                .sort((a, b) => a.priority - b.priority);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MENU RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const MenuRenderer = {
        render: function (container) {
            const targetContainer = typeof container === 'string'
                ? document.querySelector(container)
                : container;

            if (!targetContainer) {
                console.warn('⚠️ [Menu] Container not found');
                return;
            }

            const menuHTML = this.buildMenu();
            targetContainer.innerHTML = menuHTML;

            this.attachEventListeners(targetContainer);

            const event = new CustomEvent(CONFIG.events.menuRendered, {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('✅ [Menu] Rendered');
        },

        buildMenu: function () {
            const rootCategories = CategoryManager.getRoot();

            let html = '<nav class="dynamic-menu">';
            html += '<div class="menu-header">';
            html += '<button class="menu-toggle" onclick="window.DynamicMenu.toggleMobile()">☰</button>';
            html += '</div>';
            html += '<ul class="menu-list">';

            rootCategories.forEach(category => {
                html += this.buildCategoryItem(category);
            });

            html += '</ul>';
            html += '</nav>';

            return html;
        },

        buildCategoryItem: function (category) {
            const children = CategoryManager.getChildren(category.id);
            const items = MenuItemManager.getByCategory(category.id);
            const hasChildren = children.length > 0 || items.length > 0;

            let html = `<li class="menu-item ${hasChildren ? 'has-submenu' : ''}">`;
            html += `<a href="#${category.slug}" class="menu-link" data-category="${category.id}">`;
            html += `<span class="menu-icon">${category.icon}</span>`;
            html += `<span class="menu-text">${category.name}</span>`;
            if (hasChildren) {
                html += '<span class="menu-arrow">▼</span>';
            }
            html += '</a>';

            if (hasChildren) {
                html += '<ul class="submenu">';

                // Add child categories
                children.forEach(child => {
                    html += this.buildCategoryItem(child);
                });

                // Add menu items
                items.forEach(item => {
                    html += this.buildMenuItem(item);
                });

                html += '</ul>';
            }

            html += '</li>';

            return html;
        },

        buildMenuItem: function (item) {
            let html = '<li class="menu-item">';
            html += `<a href="${item.url}" class="menu-link" target="${item.target}" data-item="${item.id}">`;
            if (item.icon) {
                html += `<span class="menu-icon">${item.icon}</span>`;
            }
            html += `<span class="menu-text">${item.title}</span>`;
            if (item.badge) {
                html += `<span class="menu-badge">${item.badge}</span>`;
            }
            html += '</a>';
            html += '</li>';

            return html;
        },

        attachEventListeners: function (container) {
            // Toggle submenu on click
            container.querySelectorAll('.has-submenu > .menu-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const parent = link.parentElement;
                    parent.classList.toggle('active');

                    const categoryId = link.dataset.category;
                    const event = new CustomEvent(CONFIG.events.categoryChanged, {
                        detail: { categoryId, timestamp: Date.now() }
                    });
                    document.dispatchEvent(event);
                });
            });

            // Track item clicks
            container.querySelectorAll('.menu-link[data-item]').forEach(link => {
                link.addEventListener('click', (e) => {
                    const itemId = link.dataset.item;
                    const event = new CustomEvent(CONFIG.events.itemClicked, {
                        detail: { itemId, timestamp: Date.now() }
                    });
                    document.dispatchEvent(event);
                });
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MOBILE MENU HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    const MobileMenu = {
        toggle: function () {
            state.mobileMenuOpen = !state.mobileMenuOpen;

            const menu = document.querySelector('.dynamic-menu');
            if (menu) {
                menu.classList.toggle('mobile-open', state.mobileMenuOpen);
            }
        },

        close: function () {
            state.mobileMenuOpen = false;
            const menu = document.querySelector('.dynamic-menu');
            if (menu) {
                menu.classList.remove('mobile-open');
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MENU SEARCH
    // ═══════════════════════════════════════════════════════════════════════

    const MenuSearch = {
        search: function (query) {
            const q = query.toLowerCase();
            const results = [];

            // Search categories
            state.categories.forEach(category => {
                if (category.name.toLowerCase().includes(q)) {
                    results.push({
                        type: 'category',
                        data: category
                    });
                }
            });

            // Search items
            state.menuItems.forEach(item => {
                if (item.title.toLowerCase().includes(q)) {
                    results.push({
                        type: 'item',
                        data: item
                    });
                }
            });

            return results;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📂 LAYER 82: DYNAMIC MENUS ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        try {
            const response = await fetch(CONFIG.menu.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register categories
                if (state.config.categories) {
                    state.config.categories.forEach(cat => {
                        CategoryManager.register(cat);
                    });
                    console.log(`✅ [Menu] Registered ${state.config.categories.length} categories`);
                }

                // Register menu items
                if (state.config.menuItems) {
                    state.config.menuItems.forEach(item => {
                        MenuItemManager.register(item);
                    });
                    console.log(`✅ [Menu] Registered ${state.config.menuItems.length} menu items`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Menu] Failed to load config');
        }

        // Auto-render if container exists
        const container = document.querySelector(CONFIG.menu.defaultContainer);
        if (container) {
            MenuRenderer.render(container);
        }

        console.log('✅ [Menu] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.DynamicMenu = {
        // Categories
        registerCategory: CategoryManager.register.bind(CategoryManager),
        getCategories: CategoryManager.getAll.bind(CategoryManager),
        getRootCategories: CategoryManager.getRoot.bind(CategoryManager),

        // Menu Items
        registerItem: MenuItemManager.register.bind(MenuItemManager),
        getItems: MenuItemManager.getAll.bind(MenuItemManager),
        getItemsByCategory: MenuItemManager.getByCategory.bind(MenuItemManager),

        // Rendering
        render: MenuRenderer.render.bind(MenuRenderer),

        // Mobile
        toggleMobile: MobileMenu.toggle.bind(MobileMenu),
        closeMobile: MobileMenu.close.bind(MobileMenu),

        // Search
        search: MenuSearch.search.bind(MenuSearch),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
