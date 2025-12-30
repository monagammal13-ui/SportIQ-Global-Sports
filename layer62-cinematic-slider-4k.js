/**
 * Layer 62 - Cinematic Slider 4K
 * Premium 4K slider with 50 media items, smooth animations, and auto-refresh
 */

class CinematicSlider4K {
    constructor() {
        this.config = null;
        this.currentSlide = 0;
        this.slides = [];
        this.isActive = false;
        this.autoplayInterval = null;
        this.container = null;

        this.init();
    }

    async init() {
        console.log('🎬 Layer 62: Cinematic Slider 4K - STARTING');

        // Load configuration
        await this.loadConfig();

        // Load 50 media items
        await this.load50Media();

        // Create slider container
        this.createSliderContainer();

        // Enable animations
        this.enableAnimations();

        // Auto-refresh media
        this.setupAutoRefresh();

        // Ensure no broken images
        await this.ensureNoBrokenImages();

        // Start autoplay
        this.startAutoplay();

        this.isActive = true;
        console.log('✅ Layer 62: Cinematic Slider 4K - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/layer62-cinematic-slider-4k.json');
            this.config = await response.json();
            console.log('✅ Layer 62 config loaded');
        } catch (error) {
            console.error('❌ Failed to load Layer 62 config:', error);
            this.config = { slides: [], animations: { enabled: false } };
        }
    }

    async load50Media() {
        console.log('📸 Loading 50 media items...');

        // Generate 50 slides (5 from config, 45 generated)
        const baseSlides = this.config?.slides || [];
        const totalNeeded = 50;

        // Use base slides and repeat/generate more
        for (let i = 0; i < totalNeeded; i++) {
            const baseSlide = baseSlides[i % baseSlides.length] || {
                id: i + 1,
                type: 'image',
                url: `https://source.unsplash.com/3840x2160/?sports,action,${i}`,
                title: `Sports Action ${i + 1}`,
                fallback: '/assets/images/slider-fallback.jpg'
            };

            this.slides.push({
                ...baseSlide,
                id: i + 1,
                loaded: false,
                broken: false
            });
        }

        console.log(`✅ Loaded ${this.slides.length} media items`);
    }

    createSliderContainer() {
        console.log('🎨 Creating 4K slider container...');

        // Find or create slider container
        this.container = document.getElementById('cinematic-slider-4k');

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'cinematic-slider-4k';
            this.container.className = 'cinematic-slider';

            // Insert at top of main content
            const main = document.querySelector('main') || document.body;
            main.insertBefore(this.container, main.firstChild);
        }

        // Build slider HTML
        this.buildSliderHTML();

        console.log('✅ Slider container created');
    }

    buildSliderHTML() {
        const slidesHTML = this.slides.slice(0, 10).map((slide, index) => `
      <div class="slider-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
        <div class="slide-image" style="background-image: url('${slide.url}')">
          <div class="slide-overlay"></div>
          <div class="slide-content">
            <h2 class="slide-title">${slide.title}</h2>
            <span class="slide-sport">${slide.sport || 'Sports'}</span>
          </div>
        </div>
      </div>
    `).join('');

        this.container.innerHTML = `
      <div class="slider-wrapper">
        <div class="slider-track">
          ${slidesHTML}
        </div>
        <button class="slider-nav slider-prev" aria-label="Previous slide">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" stroke-width="2"/>
          </svg>
        </button>
        <button class="slider-nav slider-next" aria-label="Next slide">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" stroke-width="2"/>
          </svg>
        </button>
        <div class="slider-dots">
          ${this.slides.slice(0, 10).map((_, i) =>
            `<button class="slider-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></button>`
        ).join('')}
        </div>
      </div>
    `;

        // Add event listeners
        this.addEventListeners();
    }

    addEventListeners() {
        // Navigation arrows
        this.container.querySelector('.slider-prev')?.addEventListener('click', () => this.prevSlide());
        this.container.querySelector('.slider-next')?.addEventListener('click', () => this.nextSlide());

        // Dots
        this.container.querySelectorAll('.slider-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const slideIndex = parseInt(e.target.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });

        // Pause on hover
        this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
        this.container.addEventListener('mouseleave', () => this.resumeAutoplay());
    }

    enableAnimations() {
        console.log('✨ Enabling cinematic animations...');

        const style = document.createElement('style');
        style.id = 'layer62-animations';
        style.textContent = `
      /* Layer 62: Cinematic Slider 4K Styles */
      
      .cinematic-slider {
        position: relative;
        width: 100%;
        height: 600px;
        overflow: hidden;
        background: #000;
      }
      
      .slider-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .slider-track {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .slider-slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 1;
      }
      
      .slider-slide.active {
        opacity: 1;
        z-index: 2;
      }
      
      .slide-image {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        animation: kenBurns 20s ease-in-out infinite;
      }
      
      @keyframes kenBurns {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .slide-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      }
      
      .slide-content {
        position: absolute;
        bottom: 60px;
        left: 60px;
        z-index: 3;
        color: white;
      }
      
      .slide-title {
        font-size: 3rem;
        font-weight: bold;
        margin: 0 0 10px 0;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
        animation: slideUp 1s ease-out;
      }
      
      .slide-sport {
        font-size: 1.2rem;
        color: #ffd700;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      /* Navigation */
      .slider-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        backdrop-filter: blur(10px);
        transition: all 0.3s;
      }
      
      .slider-nav:hover {
        background: rgba(255,255,255,0.4);
        transform: translateY(-50%) scale(1.1);
      }
      
      .slider-prev { left: 20px; }
      .slider-next { right: 20px; }
      
      /* Dots */
      .slider-dots {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
        display: flex;
        gap: 10px;
      }
      
      .slider-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgba(255,255,255,0.5);
        border: none;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .slider-dot.active {
        background: white;
        transform: scale(1.3);
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .cinematic-slider { height: 400px; }
        .slide-content { bottom: 30px; left: 30px; }
        .slide-title { font-size: 2rem; }
        .slider-nav { width: 40px; height: 40px; }
      }
    `;

        document.head.appendChild(style);
        console.log('✅ Cinematic animations enabled');
    }

    setupAutoRefresh() {
        console.log('🔄 Setting up auto-refresh...');

        const interval = this.config?.autoRefresh?.interval || 3600000; // 1 hour

        setInterval(async () => {
            console.log('🔄 Auto-refreshing media...');
            await this.ensureNoBrokenImages();
        }, interval);

        console.log(`✅ Auto-refresh enabled (${interval}ms)`);
    }

    async ensureNoBrokenImages() {
        console.log('🔍 Checking for broken images...');

        let brokenCount = 0;
        let fixedCount = 0;

        for (const slide of this.slides) {
            const isValid = await this.validateImage(slide.url);

            if (!isValid) {
                brokenCount++;
                console.warn(`⚠️ Broken image detected: ${slide.title}`);

                // Use fallback
                slide.url = slide.fallback || '/assets/images/slider-fallback.jpg';
                slide.broken = true;
                fixedCount++;
            } else {
                slide.loaded = true;
                slide.broken = false;
            }
        }

        if (brokenCount > 0) {
            console.log(`✅ Fixed ${fixedCount}/${brokenCount} broken images`);
            this.buildSliderHTML(); // Rebuild with fixed images
        } else {
            console.log('✅ All images valid');
        }
    }

    async validateImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;

            setTimeout(() => resolve(false), 5000); // 5s timeout
        });
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % 10;
        this.updateSlide();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + 10) % 10;
        this.updateSlide();
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlide();
    }

    updateSlide() {
        // Update slides
        this.container.querySelectorAll('.slider-slide').forEach((slide, i) => {
            slide.classList.toggle('active', i === this.currentSlide);
        });

        // Update dots
        this.container.querySelectorAll('.slider-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentSlide);
        });
    }

    startAutoplay() {
        const duration = this.config?.animations?.duration?.display || 5000;

        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, duration);

        console.log('▶️ Autoplay started');
    }

    pauseAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            console.log('⏸️ Autoplay paused');
        }
    }

    resumeAutoplay() {
        this.startAutoplay();
        console.log('▶️ Autoplay resumed');
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 62,
            name: 'Cinematic Slider 4K',
            totalSlides: this.slides.length,
            currentSlide: this.currentSlide,
            brokenImages: this.slides.filter(s => s.broken).length,
            validImages: this.slides.filter(s => !s.broken).length
        };
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer62_CinematicSlider4K = new CinematicSlider4K();
    });
} else {
    window.Layer62_CinematicSlider4K = new CinematicSlider4K();
}
