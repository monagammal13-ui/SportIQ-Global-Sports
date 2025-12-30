/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 75: CORE MOBILE RESPONSIVENESS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Device detection, responsive layout management, adaptive design
 * Features: Breakpoint detection, orientation handling, dynamic resizing
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION & CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        responsive: {
            configPath: '../api-json/responsive-config.json',
            debounceDelay: 150,
            enableTouch: true,
            enableHover: true
        },
        breakpoints: {
            mobile: 480,
            mobileLandscape: 640,
            tablet: 768,
            tabletLandscape: 1024,
            desktop: 1280,
            desktopLarge: 1440,
            desktopXL: 1920
        },
        events: {
            breakpointChange: 'responsive:breakpoint-change',
            orientationChange: 'responsive:orientation-change',
            deviceChange: 'responsive:device-change',
            resizeComplete: 'responsive:resize-complete'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        currentBreakpoint: null,
        previousBreakpoint: null,
        currentOrientation: null,
        deviceType: null,
        viewport: {
            width: 0,
            height: 0
        },
        features: {
            touch: false,
            hover: false,
            retina: false,
            standalone: false
        },
        resizeTimer: null,
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DEVICE DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    const DeviceDetector = {
        /**
         * Detect device type
         */
        detect: function () {
            const ua = navigator.userAgent.toLowerCase();
            const width = window.innerWidth;

            // Mobile detection
            const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
            const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(ua);
            const isPhone = isMobile && !isTablet;

            // Device type based on screen width and UA
            let deviceType;
            if (isPhone || width < CONFIG.breakpoints.tablet) {
                deviceType = 'mobile';
            } else if (isTablet || (width >= CONFIG.breakpoints.tablet && width < CONFIG.breakpoints.desktop)) {
                deviceType = 'tablet';
            } else {
                deviceType = 'desktop';
            }

            // Specific devices
            const isIOS = /iphone|ipad|ipod/i.test(ua);
            const isAndroid = /android/i.test(ua);
            const isWindows = /windows/i.test(ua);
            const isMac = /mac/i.test(ua);

            return {
                type: deviceType,
                isMobile: isPhone,
                isTablet,
                isDesktop: deviceType === 'desktop',
                isPhone,
                isIOS,
                isAndroid,
                isWindows,
                isMac,
                userAgent: ua
            };
        },

        /**
         * Detect features
         */
        detectFeatures: function () {
            return {
                touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                hover: window.matchMedia('(hover: hover)').matches,
                retina: window.devicePixelRatio > 1,
                standalone: window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true,
                webGL: this.detectWebGL(),
                localStorage: this.detectLocalStorage(),
                serviceWorker: 'serviceWorker' in navigator
            };
        },

        /**
         * Detect WebGL support
         */
        detectWebGL: function () {
            try {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            } catch (e) {
                return false;
            }
        },

        /**
         * Detect localStorage support
         */
        detectLocalStorage: function () {
            try {
                const test = '__test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BREAKPOINT MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const BreakpointManager = {
        /**
         * Get current breakpoint
         */
        getCurrent: function () {
            const width = window.innerWidth;

            if (width < CONFIG.breakpoints.mobile) {
                return 'mobile-small';
            } else if (width < CONFIG.breakpoints.mobileLandscape) {
                return 'mobile';
            } else if (width < CONFIG.breakpoints.tablet) {
                return 'mobile-landscape';
            } else if (width < CONFIG.breakpoints.tabletLandscape) {
                return 'tablet';
            } else if (width < CONFIG.breakpoints.desktop) {
                return 'tablet-landscape';
            } else if (width < CONFIG.breakpoints.desktopLarge) {
                return 'desktop';
            } else if (width < CONFIG.breakpoints.desktopXL) {
                return 'desktop-large';
            } else {
                return 'desktop-xl';
            }
        },

        /**
         * Check if current breakpoint matches
         */
        is: function (breakpoint) {
            return state.currentBreakpoint === breakpoint;
        },

        /**
         * Check if screen is at least breakpoint
         */
        isAtLeast: function (breakpoint) {
            const breakpoints = [
                'mobile-small', 'mobile', 'mobile-landscape',
                'tablet', 'tablet-landscape',
                'desktop', 'desktop-large', 'desktop-xl'
            ];

            const currentIndex = breakpoints.indexOf(state.currentBreakpoint);
            const targetIndex = breakpoints.indexOf(breakpoint);

            return currentIndex >= targetIndex;
        },

        /**
         * Check if screen is at most breakpoint
         */
        isAtMost: function (breakpoint) {
            const breakpoints = [
                'mobile-small', 'mobile', 'mobile-landscape',
                'tablet', 'tablet-landscape',
                'desktop', 'desktop-large', 'desktop-xl'
            ];

            const currentIndex = breakpoints.indexOf(state.currentBreakpoint);
            const targetIndex = breakpoints.indexOf(breakpoint);

            return currentIndex <= targetIndex;
        },

        /**
         * Update breakpoint
         */
        update: function () {
            const newBreakpoint = this.getCurrent();

            if (newBreakpoint !== state.currentBreakpoint) {
                state.previousBreakpoint = state.currentBreakpoint;
                state.currentBreakpoint = newBreakpoint;

                // Update body class
                this.updateBodyClass();

                // Fire event
                const event = new CustomEvent(CONFIG.events.breakpointChange, {
                    detail: {
                        current: newBreakpoint,
                        previous: state.previousBreakpoint,
                        timestamp: Date.now()
                    }
                });
                document.dispatchEvent(event);

                console.log(`📱 [Responsive] Breakpoint changed: ${state.previousBreakpoint} → ${newBreakpoint}`);
            }
        },

        /**
         * Update body class with current breakpoint
         */
        updateBodyClass: function () {
            // Remove old breakpoint classes
            const classes = document.body.className.split(' ').filter(c => !c.startsWith('bp-'));

            // Add new breakpoint class
            classes.push(`bp-${state.currentBreakpoint}`);

            document.body.className = classes.join(' ');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ORIENTATION MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const OrientationManager = {
        /**
         * Get current orientation
         */
        getCurrent: function () {
            return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        },

        /**
         * Update orientation
         */
        update: function () {
            const newOrientation = this.getCurrent();

            if (newOrientation !== state.currentOrientation) {
                const previousOrientation = state.currentOrientation;
                state.currentOrientation = newOrientation;

                // Update body class
                document.body.classList.remove('orientation-portrait', 'orientation-landscape');
                document.body.classList.add(`orientation-${newOrientation}`);

                // Fire event
                const event = new CustomEvent(CONFIG.events.orientationChange, {
                    detail: {
                        current: newOrientation,
                        previous: previousOrientation,
                        timestamp: Date.now()
                    }
                });
                document.dispatchEvent(event);

                console.log(`📱 [Responsive] Orientation changed: ${previousOrientation} → ${newOrientation}`);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VIEWPORT MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const ViewportManager = {
        /**
         * Update viewport dimensions
         */
        update: function () {
            state.viewport.width = window.innerWidth;
            state.viewport.height = window.innerHeight;

            // Update CSS custom properties
            document.documentElement.style.setProperty('--vw', `${state.viewport.width}px`);
            document.documentElement.style.setProperty('--vh', `${state.viewport.height}px`);

            // Fix for iOS viewport height
            const vh = state.viewport.height * 0.01;
            document.documentElement.style.setProperty('--vh-unit', `${vh}px`);
        },

        /**
         * Get viewport info
         */
        getInfo: function () {
            return {
                width: state.viewport.width,
                height: state.viewport.height,
                aspectRatio: (state.viewport.width / state.viewport.height).toFixed(2),
                pixelRatio: window.devicePixelRatio,
                scrollY: window.scrollY,
                scrollX: window.scrollX
            };
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    const TouchHandler = {
        /**
         * Initialize touch handling
         */
        init: function () {
            if (!CONFIG.responsive.enableTouch) return;

            // Add touch class to body
            if (state.features.touch) {
                document.body.classList.add('touch-enabled');
            } else {
                document.body.classList.add('no-touch');
            }

            // Add hover class
            if (state.features.hover) {
                document.body.classList.add('hover-enabled');
            } else {
                document.body.classList.add('no-hover');
            }
        },

        /**
         * Prevent zoom on double tap
         */
        preventDoubleTapZoom: function () {
            let lastTouchEnd = 0;

            document.addEventListener('touchend', function (e) {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RESIZE HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    const ResizeHandler = {
        /**
         * Handle window resize
         */
        handle: function () {
            // Clear existing timer
            if (state.resizeTimer) {
                clearTimeout(state.resizeTimer);
            }

            // Update viewport immediately
            ViewportManager.update();

            // Debounce other updates
            state.resizeTimer = setTimeout(() => {
                BreakpointManager.update();
                OrientationManager.update();

                // Fire resize complete event
                const event = new CustomEvent(CONFIG.events.resizeComplete, {
                    detail: {
                        viewport: ViewportManager.getInfo(),
                        breakpoint: state.currentBreakpoint,
                        timestamp: Date.now()
                    }
                });
                document.dispatchEvent(event);

            }, CONFIG.responsive.debounceDelay);
        },

        /**
         * Initialize resize listener
         */
        init: function () {
            window.addEventListener('resize', () => this.handle());

            // Also listen for orientation change
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.handle(), 100);
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ADAPTIVE LAYOUT
    // ═══════════════════════════════════════════════════════════════════════

    const AdaptiveLayout = {
        /**
         * Apply adaptive styles
         */
        apply: function () {
            // Add device type class
            document.body.classList.add(`device-${state.deviceType.type}`);

            // Add feature classes
            if (state.features.retina) {
                document.body.classList.add('retina');
            }

            if (state.features.standalone) {
                document.body.classList.add('standalone');
            }

            // Apply meta viewport
            this.applyViewportMeta();
        },

        /**
         * Apply viewport meta tag
         */
        applyViewportMeta: function () {
            let meta = document.querySelector('meta[name="viewport"]');

            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'viewport';
                document.head.appendChild(meta);
            }

            // Different settings for different devices
            if (state.deviceType.isMobile) {
                meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
            } else {
                meta.content = 'width=device-width, initial-scale=1.0';
            }
        },

        /**
         * Get responsive images
         */
        getResponsiveImage: function (baseUrl, size = 'auto') {
            const suffix = size === 'auto'
                ? this.getImageSuffix()
                : size;

            const ext = baseUrl.split('.').pop();
            const base = baseUrl.replace(`.${ext}`, '');

            return `${base}_${suffix}.${ext}`;
        },

        /**
         * Get image suffix based on current breakpoint
         */
        getImageSuffix: function () {
            if (state.currentBreakpoint.includes('mobile')) return 'sm';
            if (state.currentBreakpoint.includes('tablet')) return 'md';
            if (state.currentBreakpoint === 'desktop') return 'lg';
            return 'xl';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📱 LAYER 75: MOBILE RESPONSIVENESS ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Detect device
        state.deviceType = DeviceDetector.detect();
        console.log('✅ [Responsive] Device detected:', state.deviceType.type);

        // Detect features
        state.features = DeviceDetector.detectFeatures();
        console.log('✅ [Responsive] Features detected:', state.features);

        // Initialize viewport
        ViewportManager.update();

        // Initialize breakpoint
        state.currentBreakpoint = BreakpointManager.getCurrent();
        BreakpointManager.updateBodyClass();
        console.log('✅ [Responsive] Breakpoint:', state.currentBreakpoint);

        // Initialize orientation
        state.currentOrientation = OrientationManager.getCurrent();
        document.body.classList.add(`orientation-${state.currentOrientation}`);
        console.log('✅ [Responsive] Orientation:', state.currentOrientation);

        // Apply adaptive layout
        AdaptiveLayout.apply();

        // Initialize touch handling
        TouchHandler.init();

        // Initialize resize handling
        ResizeHandler.init();

        // Load configuration
        try {
            const response = await fetch(CONFIG.responsive.configPath);
            if (response.ok) {
                state.config = await response.json();
                console.log('✅ [Responsive] Configuration loaded');
            }
        } catch (error) {
            console.warn('⚠️ [Responsive] Failed to load config:', error.message);
        }

        console.log('✅ [Responsive] Engine initialized');
        console.log('📱 [Responsive] Viewport:', `${state.viewport.width}x${state.viewport.height}`);
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ResponsiveEngine = {
        // Device Info
        getDevice: () => state.deviceType,
        getFeatures: () => state.features,
        isMobile: () => state.deviceType.isMobile,
        isTablet: () => state.deviceType.isTablet,
        isDesktop: () => state.deviceType.isDesktop,

        // Breakpoints
        getBreakpoint: () => state.currentBreakpoint,
        isBreakpoint: BreakpointManager.is.bind(BreakpointManager),
        isAtLeast: BreakpointManager.isAtLeast.bind(BreakpointManager),
        isAtMost: BreakpointManager.isAtMost.bind(BreakpointManager),

        // Orientation
        getOrientation: () => state.currentOrientation,
        isPortrait: () => state.currentOrientation === 'portrait',
        isLandscape: () => state.currentOrientation === 'landscape',

        // Viewport
        getViewport: ViewportManager.getInfo.bind(ViewportManager),

        // Utilities
        getResponsiveImage: AdaptiveLayout.getResponsiveImage.bind(AdaptiveLayout),

        // State
        state: () => ({
            breakpoint: state.currentBreakpoint,
            orientation: state.currentOrientation,
            device: state.deviceType.type,
            viewport: state.viewport,
            features: state.features
        }),

        // Config
        CONFIG
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
