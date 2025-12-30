/**
 * Antigravity Full Activation Script
 * الهدف: ترتيب script tags، تفعيل Dormant Layers، تهيئة Cinematic Slider
 * تحميل 50 صورة وفيديو جاهز، وضبط الأداء بدون تقطع
 */

(function () {
    console.log('🚀 Antigravity Activation Loader - STARTING');

    // 1️⃣ ترتيب وتحميل Engines الأساسية أولاً
    const engines = [
        '../js/main.js',
        '../js/runtime-media-engine.js',
        '../js/runtime-data-engine.js',
        '../js/runtime-ads-scripts.js',
        '../js/runtime-js-execution.js',
        '../js/runtime-ui-rendering.js',
        '../js/runtime-core-orchestrator.js',
        '../js/runtime-error-autofix.js',
        '../js/runtime-future-layers.js'
    ];

    // 2️⃣ تحميل Dormant Layers بعد Engines (excluding app.js to avoid conflict)
    const dormantLayers = [
        '../js/analytics-tracker.js',
        '../js/engagement.js',
        '../js/image-assurance.js',
        '../js/theme-manager.js',
        '../js/ui-controller.js',
        '../js/layer61-uiux-advanced.js',
        '../js/layer62-cinematic-slider-4k.js',
        '../js/layer63-dynamic-ads-rotation.js',
        '../js/layer64-advanced-performance.js',
        '../js/layer65-trending-hashtags.js',
        '../js/layer66-event-highlights.js',
        '../js/layer67-polls-voting.js',
        '../js/layer68-news-summarizer.js',
        '../js/layer69-seo-optimization.js',
        '../js/layer70-analytics-engine.js',
        '../js/layer71-security-engine.js',
        '../js/layer150-news-distributor.js'
    ];

    // 3️⃣ كل الملفات معًا
    const allScripts = engines.concat(dormantLayers);

    let loadedCount = 0;
    const totalScripts = allScripts.length;

    // دالة تحميل JS ديناميكيًا
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // لضمان الترتيب
        script.onload = () => {
            loadedCount++;
            console.log(`✅ Loaded (${loadedCount}/${totalScripts}): ${src}`);
            if (callback) callback();
        };
        script.onerror = () => {
            console.error(`❌ Failed to load: ${src}`);
            // Continue even if one fails
            if (callback) callback();
        };
        document.head.appendChild(script);
    }

    // تحميل كل السكربتات واحد تلو الآخر لضمان ترتيب صحيح
    function loadScriptsSequentially(scripts, index = 0) {
        if (index < scripts.length) {
            loadScript(scripts[index], () => loadScriptsSequentially(scripts, index + 1));
        } else {
            console.log('✨ جميع السكربتات محملة. بدء تهيئة السلايدر.');
            console.log(`📊 Final Count: ${loadedCount}/${totalScripts} scripts loaded successfully`);

            // Wait for Layer 62 to initialize before setting up slider
            setTimeout(() => {
                initializeCinematicSlider();
            }, 1000);
        }
    }

    // 4️⃣ تهيئة Cinematic Slider وتحميل 50 صورة وفيديو
    function initializeCinematicSlider() {
        console.log('🎬 Initializing Cinematic Slider with media...');

        // Check if Layer 62 already initialized a slider
        if (window.Layer62_CinematicSlider4K) {
            console.log('✅ Layer 62 Cinematic Slider already active');
            loadMediaIntoSlider();
            return;
        }

        // Create slider container if not exists
        let sliderContainer = document.getElementById('cinematic-slider');
        if (!sliderContainer) {
            console.log('📦 Creating slider container...');
            sliderContainer = document.createElement('div');
            sliderContainer.id = 'cinematic-slider';
            sliderContainer.className = 'cinematic-slider-container';
            sliderContainer.style.cssText = `
                position: relative;
                width: 100%;
                max-width: 1920px;
                margin: 40px auto;
                overflow: hidden;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            `;

            // Insert after header or at top of main content
            const hero = document.querySelector('.hero') || document.querySelector('main') || document.body;
            if (hero.parentNode) {
                hero.parentNode.insertBefore(sliderContainer, hero);
            } else {
                document.body.insertBefore(sliderContainer, document.body.firstChild);
            }
        }

        loadMediaIntoSlider();
    }

    function loadMediaIntoSlider() {
        const sliderContainer = document.getElementById('cinematic-slider-4k') || document.getElementById('cinematic-slider');
        if (!sliderContainer) {
            console.error('❌ Slider container not found!');
            return;
        }

        // Clear existing content
        sliderContainer.innerHTML = '';

        // Create slider wrapper
        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'slider-wrapper';
        sliderWrapper.style.cssText = `
            display: flex;
            transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
            will-change: transform;
        `;

        // مصفوفة للصور والفيديوهات (25 images + 25 videos = 50 total)
        const mediaFiles = [];

        // Add 25 sports images from placeholder service
        for (let i = 1; i <= 25; i++) {
            mediaFiles.push({
                type: 'image',
                src: `https://picsum.photos/1920/1080?random=${i}`,
                alt: `Sports Action ${i}`
            });
        }

        // Add 25 video placeholders (using poster images since we don't have actual videos)
        for (let i = 26; i <= 50; i++) {
            mediaFiles.push({
                type: 'video-placeholder',
                src: `https://picsum.photos/1920/1080?random=${i}`,
                alt: `Sports Video ${i - 25}`
            });
        }

        // Create slides
        mediaFiles.forEach((media, index) => {
            const slide = document.createElement('div');
            slide.className = 'slider-slide';
            slide.style.cssText = `
                min-width: 100%;
                height: 600px;
                position: relative;
                background: #000;
            `;

            let element;
            if (media.type === 'image') {
                element = document.createElement('img');
                element.src = media.src;
                element.alt = media.alt;
                element.loading = 'lazy';
                element.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                `;
            } else if (media.type === 'video-placeholder') {
                // Video placeholder with poster
                element = document.createElement('div');
                element.className = 'video-placeholder';
                element.style.cssText = `
                    width: 100%;
                    height: 100%;
                    background: url('${media.src}') center/cover;
                    position: relative;
                `;

                // Add play button overlay
                const playBtn = document.createElement('div');
                playBtn.innerHTML = '▶️';
                playBtn.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 60px;
                    background: rgba(0,0,0,0.6);
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                `;
                playBtn.onmouseover = () => playBtn.style.transform = 'translate(-50%, -50%) scale(1.1)';
                playBtn.onmouseout = () => playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
                element.appendChild(playBtn);
            }

            // Add caption
            const caption = document.createElement('div');
            caption.textContent = media.alt;
            caption.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.8));
                color: white;
                padding: 30px 40px;
                font-size: 28px;
                font-weight: bold;
            `;

            slide.appendChild(element);
            slide.appendChild(caption);
            sliderWrapper.appendChild(slide);
        });

        sliderContainer.appendChild(sliderWrapper);

        // Add navigation controls
        addSliderControls(sliderContainer, sliderWrapper, mediaFiles.length);

        console.log(`🎬 Cinematic Slider initialized with ${mediaFiles.length} items (25 images + 25 video placeholders)`);
    }

    function addSliderControls(container, wrapper, slideCount) {
        let currentSlide = 0;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '❮';
        prevBtn.style.cssText = `
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            font-size: 40px;
            padding: 20px 30px;
            cursor: pointer;
            border-radius: 8px;
            z-index: 10;
            transition: all 0.3s;
        `;
        prevBtn.onmouseover = () => prevBtn.style.background = 'rgba(0,0,0,0.8)';
        prevBtn.onmouseout = () => prevBtn.style.background = 'rgba(0,0,0,0.5)';
        prevBtn.onclick = () => {
            currentSlide = (currentSlide - 1 + slideCount) % slideCount;
            wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '❯';
        nextBtn.style.cssText = prevBtn.style.cssText.replace('left: 20px', 'right: 20px');
        nextBtn.onmouseover = () => nextBtn.style.background = 'rgba(0,0,0,0.8)';
        nextBtn.onmouseout = () => nextBtn.style.background = 'rgba(0,0,0,0.5)';
        nextBtn.onclick = () => {
            currentSlide = (currentSlide + 1) % slideCount;
            wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        // Auto-play
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slideCount;
            wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        }, 5000);
    }

    // 🚀 بدء التحميل
    console.log(`📋 Starting sequential load of ${totalScripts} scripts...`);
    loadScriptsSequentially(allScripts);

})();
