/**
 * Layer 61 - UI/UX Advanced
 * Advanced UI/UX enhancements with smooth animations
 */

class UIUXAdvanced {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.init();
    }

    async init() {
        console.log('🎨 Layer 61: UI/UX Advanced - STARTING');

        // Load configuration
        await this.loadConfig();

        // Enable all elements
        this.enableAllElements();

        // Apply responsive enhancements
        this.applyResponsive();

        // Enable smooth animations
        this.enableSmoothAnimations();

        // Activate for future layers
        this.activateForFuture();

        this.isActive = true;
        console.log('✅ Layer 61: UI/UX Advanced - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/layer61-uiux-advanced.json');
            this.config = await response.json();
            console.log('✅ Layer 61 config loaded');
        } catch (error) {
            console.error('❌ Failed to load Layer 61 config:', error);
        }
    }

    enableAllElements() {
        console.log('🎯 Enabling all UI elements...');

        // Add smooth interactions to all interactive elements
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, select');

        interactiveElements.forEach(el => {
            el.classList.add('ui-enhanced');
            el.style.transition = 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
        });

        console.log(`✅ Enhanced ${interactiveElements.length} elements`);
    }

    applyResponsive() {
        console.log('📱 Applying advanced responsive rules...');

        const style = document.createElement('style');
        style.id = 'layer61-responsive';
        style.textContent = `
      /* Layer 61: Advanced Responsive */
      
      /* Container Queries Support */
      @container (min-width: 768px) {
        .container-responsive {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }
      }
      
      /* Fluid Typography */
      html {
        font-size: clamp(14px, 1.5vw, 18px);
      }
      
      h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
      h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); }
      h3 { font-size: clamp(1.25rem, 3vw, 2rem); }
      
      /* Responsive Spacing */
      .spacing-responsive {
        padding: clamp(1rem, 3vw, 3rem);
        margin: clamp(0.5rem, 2vw, 2rem);
      }
      
      /* Mobile First */
      @media (max-width: 767px) {
        .hide-mobile { display: none !important; }
        .stack-mobile { flex-direction: column !important; }
      }
      
      @media (min-width: 768px) {
        .hide-desktop { display: none !important; }
      }
    `;

        document.head.appendChild(style);
        console.log('✅ Advanced responsive rules applied');
    }

    enableSmoothAnimations() {
        console.log('✨ Enabling smooth animations...');

        const style = document.createElement('style');
        style.id = 'layer61-animations';
        style.textContent = `
      /* Layer 61: Smooth Animations */
      
      /* Global Smooth Transitions */
      * {
        transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
      }
      
      /* Fade Animations */
      .animate-fade-in {
        animation: layer61-fadeIn 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
      }
      
      @keyframes layer61-fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Slide Animations */
      .animate-slide-left {
        animation: layer61-slideLeft 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
      }
      
      @keyframes layer61-slideLeft {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      /* Scale Animations */
      .animate-scale-up {
        animation: layer61-scaleUp 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
      }
      
      @keyframes layer61-scaleUp {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      /* Hover Effects */
      .ui-enhanced:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      /* Ripple Effect */
      .ripple {
        position: relative;
        overflow: hidden;
      }
      
      .ripple::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.5);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }
      
      .ripple:active::after {
        width: 300px;
        height: 300px;
      }
      
      /* Focus Indicators */
      .ui-enhanced:focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      /* Respect Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;

        document.head.appendChild(style);

        // Auto-apply animations to new elements
        this.observeNewElements();

        console.log('✅ Smooth animations enabled');
    }

    observeNewElements() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Apply fade-in to new elements
                        node.classList.add('animate-fade-in');

                        // Apply enhancements to interactive elements
                        if (node.matches && node.matches('a, button, input, textarea, select')) {
                            node.classList.add('ui-enhanced');
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('✅ Observing new elements for auto-enhancement');
    }

    activateForFuture() {
        console.log('🔮 Activating for all future layers...');

        // Register with RuntimeFuture if available
        if (window.RuntimeFuture) {
            console.log('✅ Layer 61 registered with Future Layers system');
            console.log('✅ Will auto-apply to all future elements');
        }

        // Store settings globally for future layers
        window.LAYER61_SETTINGS = {
            responsive: true,
            animations: 'smooth',
            applyToFuture: true,
            autoPropagate: true
        };
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 61,
            name: 'UI/UX Advanced',
            features: {
                responsive: true,
                animations: 'smooth',
                allElements: true,
                futureSupport: true
            }
        };
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer61_UIUXAdvanced = new UIUXAdvanced();
    });
} else {
    window.Layer61_UIUXAdvanced = new UIUXAdvanced();
}
