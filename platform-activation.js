/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PLATFORM ACTIVATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Full Platform Activation Script
 * يربط كل الطبقات القديمة والجديدة، يهيئ السلايدر والواجهة الرئيسية
 * ويضمن تشغيل كل الوظائف Runtime بالمحتوى الفعلي
 * 
 * Version: 1.0.0
 * Created: 2025-12-29
 * 
 * Features:
 * - Sequential loading of all engines (Main, RuntimeMediaEngine, etc.)
 * - Orchestrated loading of all 200 layers (60 original + 140 new)
 * - Cinematic slider initialization with real media content
 * - Full platform initialization and verification
 * - Comprehensive error handling and logging
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // 1️⃣ CORE ENGINES - Essential runtime systems
    // ═══════════════════════════════════════════════════════════════════════
    const engines = [
        'js/main.js',
        'js/runtime-media-engine.js',
        'js/runtime-data-engine.js',
        'js/runtime-ads-scripts.js',
        'js/runtime-js-execution.js',
        'js/runtime-ui-rendering.js',
        'js/runtime-core-orchestrator.js',
        'js/runtime-error-autofix.js',
        'js/runtime-future-layers.js'
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // 2️⃣ LAYER DEFINITIONS - All 200 architectural layers
    // ═══════════════════════════════════════════════════════════════════════

    // Generate layer paths dynamically
    const layers = [];

    // Original 60 layers (layer1.js - layer60.js)
    for (let i = 1; i <= 60; i++) {
        layers.push(`js/layer${i}.js`);
    }

    // New 140 layers (layer61.js - layer200.js)
    for (let i = 61; i <= 200; i++) {
        layers.push(`js/layer${i}.js`);
    }

    // Explicitly register manually named layers
    layers.push('js/layer137-media-enhancer.js');
    layers.push('js/layer138-dashboard.js');
    layers.push('js/layer139-trending-booster.js');


    // ═══════════════════════════════════════════════════════════════════════
    // 3️⃣ CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        // Media configuration for cinematic slider
        media: {
            imagesCount: 50,
            videosCount: 50,
            imagePrefix: 'media/football/image',
            videoPrefix: 'media/football/video',
            imageExtension: '.jpg',
            videoExtension: '.mp4'
        },

        // Loading configuration
        loading: {
            sequential: true,  // Ensure proper dependency order
            timeout: 10000,    // 10 seconds timeout per script
            retryAttempts: 3
        },

        // Logging configuration
        logging: {
            enabled: true,
            verbose: true,
            errorTracking: true
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 4️⃣ STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        loadedScripts: new Set(),
        failedScripts: new Set(),
        currentPhase: 'Initializing',
        startTime: Date.now(),
        errors: []
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 5️⃣ LOGGING UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    const logger = {
        log: (message, type = 'info') => {
            if (!CONFIG.logging.enabled) return;

            const timestamp = new Date().toISOString();
            const prefix = {
                info: '✅',
                warn: '⚠️',
                error: '❌',
                success: '🎉',
                loading: '⏳'
            }[type] || 'ℹ️';

            console.log(`${prefix} [Platform Activation] ${message}`);
        },

        success: (message) => logger.log(message, 'success'),
        warn: (message) => logger.log(message, 'warn'),
        error: (message) => logger.log(message, 'error'),
        loading: (message) => logger.log(message, 'loading')
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 6️⃣ SCRIPT LOADING UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Load a single script with retry logic and timeout
     */
    function loadScript(src, callback, attempt = 1) {
        logger.loading(`Loading: ${src} (Attempt ${attempt}/${CONFIG.loading.retryAttempts})`);

        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Ensure sequential execution

        let timeoutId;

        // Success handler
        script.onload = () => {
            clearTimeout(timeoutId);
            logger.success(`Loaded: ${src}`);
            state.loadedScripts.add(src);
            if (callback) callback(null);
        };

        // Error handler with retry logic
        script.onerror = () => {
            clearTimeout(timeoutId);

            if (attempt < CONFIG.loading.retryAttempts) {
                logger.warn(`Failed to load ${src}, retrying...`);
                setTimeout(() => loadScript(src, callback, attempt + 1), 1000 * attempt);
            } else {
                const errorMsg = `Failed to load: ${src} after ${attempt} attempts`;
                logger.error(errorMsg);
                state.failedScripts.add(src);
                state.errors.push({ src, error: errorMsg });
                if (callback) callback(new Error(errorMsg));
            }
        };

        // Timeout handler
        timeoutId = setTimeout(() => {
            logger.warn(`Timeout loading ${src}`);
            script.onerror();
        }, CONFIG.loading.timeout);

        document.head.appendChild(script);
    }

    /**
     * Load multiple scripts sequentially
     */
    function loadScriptsSequentially(scripts, index = 0, onComplete) {
        if (index >= scripts.length) {
            if (onComplete) onComplete();
            return;
        }

        loadScript(scripts[index], (error) => {
            // Continue loading even if one script fails (graceful degradation)
            loadScriptsSequentially(scripts, index + 1, onComplete);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7️⃣ CINEMATIC SLIDER INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the cinematic slider with real media content
     */
    function initializeCinematicSlider() {
        logger.loading('Initializing Cinematic Slider...');

        // Find or create slider container
        let sliderContainer = document.getElementById('cinematic-slider');

        if (!sliderContainer) {
            logger.warn('Slider container not found, creating one...');
            sliderContainer = document.createElement('div');
            sliderContainer.id = 'cinematic-slider';
            sliderContainer.className = 'cinematic-slider';

            // Insert after hero section or at top of main content
            const hero = document.querySelector('.hero') || document.querySelector('main');
            if (hero) {
                hero.parentNode.insertBefore(sliderContainer, hero.nextSibling);
            } else {
                document.body.insertBefore(sliderContainer, document.body.firstChild);
            }
        }

        // Clear existing content
        sliderContainer.innerHTML = '';

        // Create wrapper for slides
        const slidesWrapper = document.createElement('div');
        slidesWrapper.className = 'cinematic-slides-wrapper';
        sliderContainer.appendChild(slidesWrapper);

        // Generate media files array
        const mediaFiles = [];

        // Add images
        for (let i = 1; i <= CONFIG.media.imagesCount; i++) {
            mediaFiles.push({
                type: 'image',
                src: `${CONFIG.media.imagePrefix}${i}${CONFIG.media.imageExtension}`,
                alt: `Football Image ${i}`
            });
        }

        // Add videos
        for (let i = 1; i <= CONFIG.media.videosCount; i++) {
            mediaFiles.push({
                type: 'video',
                src: `${CONFIG.media.videoPrefix}${i}${CONFIG.media.videoExtension}`,
                title: `Football Video ${i}`
            });
        }

        // Shuffle for variety
        mediaFiles.sort(() => Math.random() - 0.5);

        // Create media elements
        let elementsCreated = 0;
        mediaFiles.forEach((file, index) => {
            const slide = document.createElement('div');
            slide.className = 'cinematic-slide';
            slide.dataset.index = index;

            let element;

            if (file.type === 'image') {
                element = document.createElement('img');
                element.src = file.src;
                element.alt = file.alt;
                element.loading = 'lazy'; // Optimize loading

                // Error handling for missing images
                element.onerror = function () {
                    // Replace with placeholder
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="450"%3E%3Crect fill="%23667eea" width="800" height="450"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24"%3EImage Loading...%3C/text%3E%3C/svg%3E';
                };
            } else if (file.type === 'video') {
                element = document.createElement('video');
                element.src = file.src;
                element.controls = true;
                element.preload = 'metadata';
                element.loop = false;
                element.muted = true; // Auto-play friendly

                // Error handling for missing videos
                element.onerror = function () {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'video-placeholder';
                    placeholder.innerHTML = `
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.5rem;">
                            🎬 Video Loading...
                        </div>
                    `;
                    this.parentNode.replaceChild(placeholder, this);
                };
            }

            if (element) {
                element.style.maxWidth = '100%';
                element.style.width = '100%';
                element.style.height = 'auto';
                element.style.display = 'block';
                element.style.margin = 'auto';
                element.style.borderRadius = 'var(--radius-lg, 12px)';

                slide.appendChild(element);
                slidesWrapper.appendChild(slide);
                elementsCreated++;
            }
        });

        logger.success(`Cinematic Slider initialized with ${elementsCreated} media elements (${CONFIG.media.imagesCount} images + ${CONFIG.media.videosCount} videos)`);

        // Initialize slider controls if available
        if (window.CinematicSlider && typeof window.CinematicSlider.init === 'function') {
            window.CinematicSlider.init('cinematic-slider');
            logger.success('Cinematic Slider controls activated');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8️⃣ PLATFORM INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the complete platform
     */
    function initializePlatform() {
        state.currentPhase = 'Platform Initialization';
        logger.log('═══════════════════════════════════════════════════════════════');
        logger.log('🚀 STARTING PLATFORM INITIALIZATION');
        logger.log('═══════════════════════════════════════════════════════════════');

        // Initialize cinematic slider
        initializeCinematicSlider();

        // Fire platform ready event
        const readyEvent = new CustomEvent('platformActivated', {
            detail: {
                timestamp: Date.now(),
                loadedScripts: state.loadedScripts.size,
                failedScripts: state.failedScripts.size,
                totalTime: Date.now() - state.startTime
            }
        });
        document.dispatchEvent(readyEvent);

        // Final status report
        generateStatusReport();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 9️⃣ STATUS REPORTING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate comprehensive status report
     */
    function generateStatusReport() {
        const totalTime = ((Date.now() - state.startTime) / 1000).toFixed(2);
        const allScripts = engines.concat(layers);
        const successRate = ((state.loadedScripts.size / allScripts.length) * 100).toFixed(2);

        logger.log('═══════════════════════════════════════════════════════════════');
        logger.log('📊 PLATFORM ACTIVATION REPORT');
        logger.log('═══════════════════════════════════════════════════════════════');
        logger.log(`⏱️  Total Time: ${totalTime}s`);
        logger.log(`✅ Loaded Scripts: ${state.loadedScripts.size}/${allScripts.length}`);
        logger.log(`❌ Failed Scripts: ${state.failedScripts.size}`);
        logger.log(`📈 Success Rate: ${successRate}%`);
        logger.log('───────────────────────────────────────────────────────────────');
        logger.log(`🎬 Cinematic Slider: Active`);
        logger.log(`🔧 Runtime Engines: ${engines.length} loaded`);
        logger.log(`📦 Layers: ${layers.length} registered`);
        logger.log('═══════════════════════════════════════════════════════════════');

        if (state.failedScripts.size > 0) {
            logger.warn('⚠️  Failed Scripts:');
            state.failedScripts.forEach(script => {
                logger.warn(`   - ${script}`);
            });
        }

        if (state.loadedScripts.size === allScripts.length) {
            logger.success('✨ ALL SYSTEMS FULLY OPERATIONAL! ✨');
        } else {
            logger.warn('⚠️  Platform running with some components missing');
        }

        logger.log('═══════════════════════════════════════════════════════════════');

        // Make report available globally
        window.PLATFORM_STATUS = {
            loaded: state.loadedScripts.size,
            failed: state.failedScripts.size,
            total: allScripts.length,
            successRate: parseFloat(successRate),
            totalTime: parseFloat(totalTime),
            errors: state.errors,
            timestamp: new Date().toISOString()
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔟 EXECUTION START
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Main execution function
     */
    function start() {
        logger.log('═══════════════════════════════════════════════════════════════');
        logger.log('🌟 PLATFORM ACTIVATION STARTING');
        logger.log('═══════════════════════════════════════════════════════════════');
        logger.log(`📅 Timestamp: ${new Date().toISOString()}`);
        logger.log(`🔧 Engines: ${engines.length}`);
        logger.log(`📦 Layers: ${layers.length}`);
        logger.log(`🎬 Media Files: ${CONFIG.media.imagesCount + CONFIG.media.videosCount}`);
        logger.log('═══════════════════════════════════════════════════════════════');

        const allScripts = engines.concat(layers);

        state.currentPhase = 'Loading Scripts';

        // Start sequential loading
        loadScriptsSequentially(allScripts, 0, () => {
            logger.success('All scripts loading completed!');
            initializePlatform();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-START when DOM is ready
    // ═══════════════════════════════════════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        // DOM already loaded
        start();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API EXPOSURE
    // ═══════════════════════════════════════════════════════════════════════

    window.PlatformActivation = {
        state: () => ({ ...state }),
        reload: start,
        getStatus: () => window.PLATFORM_STATUS || null,
        logger
    };

})();
