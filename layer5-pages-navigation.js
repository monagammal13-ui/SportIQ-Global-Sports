/**
 * Layer 5: Pages & Navigation Runtime
 * ID: layer-005
 * Type: Core
 * Description: Dynamic navigation system with page routing, active state management, and responsive menu handling.
 */

class PagesNavigationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_PAGES_NAV__) {
            console.warn('[PagesNav] Navigation runtime already initialized.');
            return window.__ANTIGRAVITY_PAGES_NAV__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-005';
        this.name = 'Pages & Navigation Runtime';
        this.timestamp = new Date().toISOString();

        // State
        this.currentPage = this._detectCurrentPage();
        this.navigationConfig = null;
        this.mobileMenuOpen = false;

        // DOM References
        this.navMenu = null;
        this.navToggle = null;
        this.dropdowns = [];

        console.log(`[PagesNav v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize the navigation runtime
     */
    async _init() {
        try {
            // Load navigation configuration
            await this._loadConfig();

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._setupNavigation());
            } else {
                this._setupNavigation();
            }

            // Register with event bus
            this._registerEvents();

            console.log('[PagesNav] Initialized successfully');
        } catch (error) {
            console.error('[PagesNav] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'pagesnav:init');
            }
        }
    }

    /**
     * Load navigation configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/navigation-config.json');
            if (response.ok) {
                this.navigationConfig = await response.json();
                console.log('[PagesNav] Configuration loaded');
            } else {
                // Use default configuration
                this.navigationConfig = this._getDefaultConfig();
                console.warn('[PagesNav] Using default configuration');
            }
        } catch (error) {
            console.warn('[PagesNav] Failed to load config, using defaults:', error);
            this.navigationConfig = this._getDefaultConfig();
        }
    }

    /**
     * Get default navigation configuration
     */
    _getDefaultConfig() {
        return {
            mainMenu: [
                { id: 'home', label: 'Home', url: '../html/index.html', icon: '🏠' },
                { id: 'about', label: 'About', url: '../html/about.html', icon: 'ℹ️' },
                { id: 'contact', label: 'Contact', url: '../html/contact.html', icon: '✉️' },
                { id: 'privacy', label: 'Privacy', url: '../html/privacy.html', icon: '🔒' },
                { id: 'terms', label: 'Terms', url: '../html/terms.html', icon: '📄' }
            ],
            settings: {
                mobileBreakpoint: 768,
                enableDropdowns: true,
                smoothScroll: true,
                autoHighlight: true
            }
        };
    }

    /**
     * Setup navigation system
     */
    _setupNavigation() {
        this.navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');
        this.navToggle = document.getElementById('navToggle') || document.querySelector('.nav-toggle');

        if (this.navMenu) {
            this._renderNavigation();
            this._highlightCurrentPage();
            this._setupMobileMenu();
            this._setupDropdowns();
            this._setupSmoothScroll();
        } else {
            console.warn('[PagesNav] Navigation menu not found in DOM');
        }
    }

    /**
     * Render navigation menu dynamically
     */
    _renderNavigation() {
        if (!this.navigationConfig || !this.navigationConfig.mainMenu) return;

        const menuItems = this.navigationConfig.mainMenu.map(item => {
            const isActive = this._isActivePage(item.id);
            return `
                <li class="nav-item">
                    <a href="${item.url}" 
                       class="nav-link ${isActive ? 'active' : ''}" 
                       data-page-id="${item.id}">
                        ${item.icon ? `<span class="nav-icon">${item.icon}</span>` : ''}
                        <span>${item.label}</span>
                    </a>
                </li>
            `;
        }).join('');

        // Only update if structure is different
        if (this.navMenu.children.length === 0) {
            this.navMenu.innerHTML = menuItems;
        }

        // Emit event
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit('navigation:rendered', {
                itemCount: this.navigationConfig.mainMenu.length
            });
        }
    }

    /**
     * Highlight current page in navigation
     */
    _highlightCurrentPage() {
        const navLinks = this.navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const pageId = link.getAttribute('data-page-id');
            if (this._isActivePage(pageId)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
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
     * Check if page is active
     */
    _isActivePage(pageId) {
        return this.currentPage === pageId;
    }

    /**
     * Setup mobile menu toggle
     */
    _setupMobileMenu() {
        if (!this.navToggle) return;

        this.navToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.mobileMenuOpen &&
                !this.navMenu.contains(e.target) &&
                !this.navToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;

        if (this.mobileMenuOpen) {
            this.navMenu.classList.add('active', 'mobile-open');
            this.navToggle.classList.add('active');
            document.body.classList.add('menu-open');
        } else {
            this.navMenu.classList.remove('active', 'mobile-open');
            this.navToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
        }

        // Emit event
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit('navigation:mobile-toggle', {
                open: this.mobileMenuOpen
            });
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        if (this.mobileMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    /**
     * Setup dropdown menus
     */
    _setupDropdowns() {
        const dropdownTriggers = document.querySelectorAll('[data-dropdown]');

        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdownId = trigger.getAttribute('data-dropdown');
                this._toggleDropdown(dropdownId);
            });
        });
    }

    /**
     * Toggle dropdown
     */
    _toggleDropdown(dropdownId) {
        const dropdown = document.querySelector(`[data-dropdown-menu="${dropdownId}"]`);
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    /**
     * Setup smooth scrolling for anchor links
     */
    _setupSmoothScroll() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                if (targetId) {
                    const target = document.getElementById(targetId);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });

                        // Close mobile menu if open
                        this.closeMobileMenu();

                        // Update URL without page reload
                        if (history.pushState) {
                            history.pushState(null, null, `#${targetId}`);
                        }
                    }
                }
            });
        });
    }

    /**
     * Register event bus listeners
     */
    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Listen for page changes
        eventBus.on('page:changed', (data) => {
            this.currentPage = data.page;
            this._highlightCurrentPage();
        });

        // Listen for navigation updates
        eventBus.on('navigation:update', (data) => {
            if (data.config) {
                this.navigationConfig = data.config;
                this._renderNavigation();
            }
        });
    }

    /**
     * Navigate to page programmatically
     */
    navigateToPage(pageId) {
        const menuItem = this.navigationConfig.mainMenu.find(item => item.id === pageId);
        if (menuItem) {
            window.location.href = menuItem.url;
        }
    }

    /**
     * Get navigation state
     */
    getState() {
        return {
            currentPage: this.currentPage,
            mobileMenuOpen: this.mobileMenuOpen,
            menuItems: this.navigationConfig?.mainMenu || []
        };
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.navToggle) {
            this.navToggle.removeEventListener('click', this.toggleMobileMenu);
        }
        console.log('[PagesNav] Destroyed');
    }
}

// Initialize and Export
const pagesNav = new PagesNavigationRuntime();
window.__ANTIGRAVITY_PAGES_NAV__ = pagesNav;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[PagesNav] Registered with runtime');
    });
}

export default pagesNav;
