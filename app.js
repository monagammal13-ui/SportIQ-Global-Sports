/**
 * SportIQ Master Integration
 * Orchestrates all frontend layers into a cohesive system
 */

class SportIQApp {
    constructor() {
        this.config = {};
        this.modules = {};
        this.initialized = false;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing SportIQ Platform...');

        try {
            // Load all configurations
            await this.loadConfigurations();

            // Initialize core systems
            await this.initializeCoreModules();

            // Initialize UI components
            this.initializeUIComponents();

            // Initialize visual effects
            this.initializeVisualEffects();

            // Initialize slider
            await this.initializeSlider();

            // Setup event listeners
            this.setupEventListeners();

            // Mark as initialized
            this.initialized = true;

            console.log('✅ SportIQ Platform Ready!');
            this.triggerReadyEvent();

        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    // Load all JSON configurations
    async loadConfigurations() {
        console.log('📋 Loading configurations...');

        const configs = [
            { name: 'ui', path: '/api-json/ui-config.json' },
            { name: 'slider', path: '/api-json/slider-config.json' },
            { name: 'visual', path: '/api-json/visual-config.json' },
            { name: 'imageFallbacks', path: '/api-json/image-fallbacks.json' }
        ];

        try {
            const promises = configs.map(async ({ name, path }) => {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        this.config[name] = await response.json();
                        console.log(`✅ Loaded ${name} config`);
                    } else {
                        console.warn(`⚠️ Failed to load ${name} config, using defaults`);
                        this.config[name] = this.getDefaultConfig(name);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error loading ${name} config:`, error);
                    this.config[name] = this.getDefaultConfig(name);
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('Configuration loading error:', error);
        }
    }

    // Get default configurations if loading fails
    getDefaultConfig(name) {
        const defaults = {
            ui: { themes: { light: {}, dark: {} }, breakpoints: {} },
            slider: { slides: [], autoplay: true, interval: 5000 },
            visual: { animations: true, effects: true },
            imageFallbacks: { fallbackStrategy: { enabled: true } }
        };
        return defaults[name] || {};
    }

    // Initialize core modules
    async initializeCoreModules() {
        console.log('🔧 Initializing core modules...');

        // Theme Manager
        if (window.ThemeManager) {
            this.modules.theme = new window.ThemeManager();
            console.log('✅ Theme Manager initialized');
        }

        // UI Controller
        if (window.UIController) {
            this.modules.ui = new window.UIController();
            console.log('✅ UI Controller initialized');
        } else if (window.uiController) {
            this.modules.ui = window.uiController;
        }

        // Image Assurance
        if (window.ImageAssurance) {
            this.modules.imageAssurance = new window.ImageAssurance({
                retryAttempts: 3,
                retryDelay: 2000,
                fallbackEnabled: true,
                lazyLoad: true
            });
            console.log('✅ Image Assurance initialized');
        }
    }

    // Initialize UI Components
    initializeUIComponents() {
        console.log('🎨 Initializing UI components...');

        // Initialize tooltips
        this.initTooltips();

        // Initialize modals
        this.initModals();

        // Initialize dropdowns
        this.initDropdowns();

        // Initialize back to top
        this.initBackToTop();

        console.log('✅ UI Components ready');
    }

    // Initialize visual effects
    initializeVisualEffects() {
        console.log('✨ Initializing visual effects...');

        // Scroll animations
        this.initScrollAnimations();

        // Parallax effects
        this.initParallaxEffects();

        // Hover effects
        this.initHoverEffects();

        console.log('✅ Visual effects active');
    }

    // Initialize cinematic slider
    async initializeSlider() {
        console.log('🎬 Initializing cinematic slider...');

        if (!this.config.slider || !this.config.slider.slides) {
            console.warn('⚠️ No slider configuration found');
            return;
        }

        try {
            // Initialize slider image manager
            if (window.SliderImageManager) {
                this.modules.sliderImages = new window.SliderImageManager(this.config.slider);

                // Verify all images
                const report = await this.modules.sliderImages.verifySliderImages();
                console.log(`📊 Slider images: ${report.success}/${report.total} verified`);
            }

            // Initialize slider (when slider.js is available)
            if (window.CinematicSlider) {
                this.modules.slider = new window.CinematicSlider({
                    container: '#cinematic-slider',
                    slides: this.config.slider.slides,
                    autoplay: this.config.slider.autoplay,
                    interval: this.config.slider.interval,
                    transition: this.config.slider.transitionDuration,
                    parallax: this.config.slider.parallax,
                    kenBurns: this.config.slider.kenBurns
                });

                console.log('✅ Cinematic slider initialized');
            }
        } catch (error) {
            console.error('Slider initialization error:', error);
        }
    }

    // Initialize scroll animations
    initScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        // Observe all reveal elements
        document.querySelectorAll('.reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
            observer.observe(el);
        });

        // Observe stagger items
        document.querySelectorAll('.stagger-item').forEach(el => {
            observer.observe(el);
        });
    }

    // Initialize parallax effects
    initParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;

            parallaxElements.forEach(el => {
                const speed = parseFloat(el.dataset.parallax) || 0.5;
                const yPos = -(scrolled * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    // Initialize hover effects
    initHoverEffects() {
        // Ripple effect
        document.querySelectorAll('.ripple').forEach(el => {
            el.addEventListener('click', function (e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple-effect');

                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // Initialize tooltips
    initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = el.dataset.tooltip;
                tooltip.id = 'active-tooltip';

                document.body.appendChild(tooltip);

                const rect = el.getBoundingClientRect();
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
                tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            });

            el.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('active-tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    }

    // Initialize modals
    initModals() {
        document.querySelectorAll('[data-modal-target]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.dataset.modalTarget;
                this.openModal(modalId);
            });
        });

        document.querySelectorAll('[data-modal-close]').forEach(close => {
            close.addEventListener('click', () => this.closeAllModals());
        });

        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => this.closeAllModals());
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const backdrop = modal?.previousElementSibling;

        if (modal && backdrop) {
            backdrop.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.classList.remove('active'));
        document.body.style.overflow = '';
    }

    // Initialize dropdowns
    initDropdowns() {
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = toggle.closest('.dropdown');
                const menu = dropdown.querySelector('.dropdown-menu');

                document.querySelectorAll('.dropdown-menu.active').forEach(other => {
                    if (other !== menu) other.classList.remove('active');
                });

                menu.classList.toggle('active');
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
                menu.classList.remove('active');
            });
        });
    }

    // Initialize back to top button
    initBackToTop() {
        const backToTop = document.getElementById('back-to-top');

        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTop.style.display = 'flex';
                } else {
                    backToTop.style.display = 'none';
                }
            });

            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // Setup global event listeners
    setupEventListeners() {
        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Handle smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href !== '#!') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });

        // Performance monitoring
        if ('PerformanceObserver' in window) {
            this.setupPerformanceMonitoring();
        }
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        const perfObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 100) {
                    console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`);
                }
            }
        });

        perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Trigger ready event
    triggerReadyEvent() {
        window.dispatchEvent(new CustomEvent('sportiq:ready', {
            detail: {
                modules: Object.keys(this.modules),
                config: this.config,
                timestamp: Date.now()
            }
        }));
    }

    // Handle initialization errors
    handleInitializationError(error) {
        console.error('Initialization failed:', error);

        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.textContent = 'Some features may not be available. Please refresh the page.';
        errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999;';
        document.body.appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Public API methods
    getModule(name) {
        return this.modules[name];
    }

    getConfig(name) {
        return this.config[name];
    }

    isReady() {
        return this.initialized;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sportIQ = new SportIQApp();
    });
} else {
    window.sportIQ = new SportIQApp();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportIQApp;
}
