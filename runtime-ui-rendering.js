/**
 * Runtime_UI_Rendering
 * Live CSS loading, rendering, and auto-fixing engine
 */

class RuntimeUIRendering {
    constructor() {
        this.loadedStyles = new Set();
        this.appliedRules = new Map();
        this.isActive = false;

        this.init();
    }

    async init() {
        console.log('🎨 Runtime UI Rendering - STARTING');

        await this.loadAllCSS();
        this.applyResponsiveRules();
        this.enableAnimations();
        this.fixBrokenStyles();
        this.startCSSMonitoring();

        this.isActive = true;
        console.log('✅ Runtime UI Rendering - ACTIVE');
    }

    // LOAD ALL CSS FILES
    async loadAllCSS() {
        const cssFiles = [
            // Core Design System
            '/css/global-ui.css',
            '/css/components.css',
            '/css/responsive.css',
            '/css/animations.css',
            '/css/visual-effects.css',

            // Additional styles
            '/css/theme.css',
            '/css/utilities.css',
            '/css/typography.css',
            '/css/layout.css',
            '/css/forms.css',
            '/css/buttons.css',
            '/css/cards.css',
            '/css/navigation.css',
            '/css/footer.css',
            '/css/slider.css',
            '/css/dark-mode.css',
            '/css/print.css'
        ];

        console.log(`📦 Loading ${cssFiles.length} CSS files...`);

        for (const file of cssFiles) {
            await this.loadCSS(file);
        }

        console.log(`✅ Loaded ${this.loadedStyles.size} CSS files`);
    }

    // Load single CSS file
    async loadCSS(href) {
        return new Promise((resolve) => {
            // Check if already loaded
            if (this.loadedStyles.has(href) || document.querySelector(`link[href="${href}"]`)) {
                console.log(`⏭️  Already loaded: ${href}`);
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;

            link.onload = () => {
                this.loadedStyles.add(href);
                console.log(`✅ Loaded CSS: ${href}`);
                resolve();
            };

            link.onerror = () => {
                console.warn(`⚠️  CSS not found: ${href}`);
                // Try fallback
                this.applyFallbackStyles(href);
                resolve();
            };

            document.head.appendChild(link);
        });
    }

    // APPLY RESPONSIVE RULES
    applyResponsiveRules() {
        console.log('📱 Applying responsive rules...');

        // Inject responsive meta if missing
        if (!document.querySelector('meta[name="viewport"]')) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(meta);
            console.log('✅ Viewport meta added');
        }

        // Apply responsive breakpoints
        const style = document.createElement('style');
        style.id = 'runtime-responsive-rules';
        style.textContent = `
      /* Runtime Responsive Rules */
      * {
        box-sizing: border-box;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
      
      /* Breakpoints */
      @media (max-width: 768px) {
        .container { padding: 0 15px; }
        .hide-mobile { display: none !important; }
      }
      
      @media (min-width: 769px) {
        .hide-desktop { display: none !important; }
      }
      
      /* Fluid Typography */
      html {
        font-size: clamp(14px, 2vw, 16px);
      }
    `;

        document.head.appendChild(style);
        this.appliedRules.set('responsive', style);
        console.log('✅ Responsive rules applied');
    }

    // ENABLE ANIMATIONS
    enableAnimations() {
        console.log('✨ Enabling animations...');

        const style = document.createElement('style');
        style.id = 'runtime-animations';
        style.textContent = `
      /* Runtime Animations */
      
      /* Fade In */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Slide Up */
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Scale In */
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      /* Pulse */
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      /* Smooth Transitions */
      * {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      /* Animation Classes */
      .animate-fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      
      .animate-slide-up {
        animation: slideUp 0.6s ease-out;
      }
      
      .animate-scale-in {
        animation: scaleIn 0.5s ease-out;
      }
      
      .animate-pulse {
        animation: pulse 2s infinite;
      }
      
      /* Hover Effects */
      a, button {
        transition: all 0.3s ease;
      }
      
      a:hover, button:hover {
        transform: translateY(-2px);
        opacity: 0.8;
      }
      
      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;

        document.head.appendChild(style);
        this.appliedRules.set('animations', style);
        console.log('✅ Animations enabled');

        // Auto-apply animations to elements
        this.autoApplyAnimations();
    }

    // Auto-apply animations to elements
    autoApplyAnimations() {
        // Wait for DOM
        setTimeout(() => {
            // Animate headers
            document.querySelectorAll('h1, h2, h3').forEach((el, i) => {
                setTimeout(() => {
                    el.classList.add('animate-fade-in');
                }, i * 100);
            });

            // Animate sections
            document.querySelectorAll('section').forEach((el, i) => {
                setTimeout(() => {
                    el.classList.add('animate-slide-up');
                }, i * 150);
            });

            console.log('✅ Auto-animations applied');
        }, 500);
    }

    // FIX BROKEN STYLES
    fixBrokenStyles() {
        console.log('🔧 Fixing broken styles...');

        const style = document.createElement('style');
        style.id = 'runtime-style-fixes';
        style.textContent = `
      /* Runtime Style Fixes */
      
      /* Reset */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      /* Body defaults */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #fff;
      }
      
      /* Links */
      a {
        color: inherit;
        text-decoration: none;
      }
      
      /* Lists */
      ul, ol {
        list-style: none;
      }
      
      /* Images */
      img {
        display: block;
        max-width: 100%;
        height: auto;
      }
      
      /* Fix missing container */
      .container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }
      
      /* Fix broken grid */
      .grid {
        display: grid;
        gap: 20px;
      }
      
      .flex {
        display: flex;
        gap: 10px;
      }
      
      /* Hide broken images */
      img[src=""], img:not([src]) {
        display: none;
      }
      
      /* Fix z-index issues */
      header { z-index: 1000; }
      .modal { z-index: 2000; }
      .overlay { z-index: 1500; }
      
      /* Accessibility */
      :focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      /* Print styles */
      @media print {
        header, footer, nav, .no-print {
          display: none !important;
        }
      }
    `;

        document.head.appendChild(style);
        this.appliedRules.set('fixes', style);
        console.log('✅ Style fixes applied');
    }

    // Fallback styles for missing CSS
    applyFallbackStyles(missingFile) {
        console.log(`🔄 Applying fallback for: ${missingFile}`);

        const fileName = missingFile.split('/').pop().replace('.css', '');
        const style = document.createElement('style');
        style.id = `fallback-${fileName}`;

        // Basic fallback based on file name
        let fallbackCSS = '';

        if (fileName.includes('button')) {
            fallbackCSS = `
        button, .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          background: #0066cc;
          color: white;
          font-size: 16px;
        }
      `;
        } else if (fileName.includes('card')) {
            fallbackCSS = `
        .card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `;
        } else if (fileName.includes('nav')) {
            fallbackCSS = `
        nav {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          background: #fff;
        }
      `;
        }

        if (fallbackCSS) {
            style.textContent = `/* Fallback: ${fileName} */\n${fallbackCSS}`;
            document.head.appendChild(style);
            console.log(`✅ Fallback applied: ${fileName}`);
        }
    }

    // MONITOR FOR NEW CSS FILES
    startCSSMonitoring() {
        console.log('👀 CSS monitoring started (5min interval)');

        // Check for new CSS files every 5 minutes
        setInterval(() => {
            this.scanForNewCSS();
        }, 300000);
    }

    async scanForNewCSS() {
        console.log('🔍 Scanning for new CSS files...');

        // Check if any link elements were added to head
        const allLinks = document.querySelectorAll('link[rel="stylesheet"]');

        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !this.loadedStyles.has(href)) {
                console.log(`🆕 New CSS detected: ${href}`);
                this.loadedStyles.add(href);
            }
        });
    }

    // PUBLIC API
    addCSS(href) {
        return this.loadCSS(href);
    }

    removeCSS(href) {
        const link = document.querySelector(`link[href="${href}"]`);
        if (link) {
            link.remove();
            this.loadedStyles.delete(href);
            console.log(`🗑️ Removed CSS: ${href}`);
        }
    }

    reloadCSS(href) {
        this.removeCSS(href);
        return this.loadCSS(href);
    }

    getStatus() {
        return {
            active: this.isActive,
            loadedStyles: this.loadedStyles.size,
            appliedRules: this.appliedRules.size,
            styles: Array.from(this.loadedStyles)
        };
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.RuntimeUI = new RuntimeUIRendering();
    });
} else {
    window.RuntimeUI = new RuntimeUIRendering();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuntimeUIRendering;
}
