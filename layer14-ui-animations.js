/**
 * Layer 14: Advanced UI/UX & Animations Runtime
 * ID: layer-014
 * Type: Core
 * Description: Advanced UI components, smooth animations, scroll effects, and premium interactions.
 */

class UIAnimationsRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_UI__) {
            return window.__ANTIGRAVITY_UI__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-014';
        this.name = 'UI/UX & Animations Runtime';

        this.observers = [];
        this.animations = new Map();

        console.log(`[UI v${this.version}] Initializing...`);
        this._init();
    }

    async _init() {
        this._setupScrollAnimations();
        this._setupHoverEffects();
        this._setupParallax();
        this._setupRevealOnScroll();
        this._setupSmoothScroll();
        console.log('[UI] Initialized');
    }

    _setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });

        this.observers.push(observer);
    }

    _setupHoverEffects() {
        document.querySelectorAll('[data-hover]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.classList.add('hover-active');
            });
            el.addEventListener('mouseleave', () => {
                el.classList.remove('hover-active');
            });
        });
    }

    _setupParallax() {
        window.addEventListener('scroll', () => {
            document.querySelectorAll('[data-parallax]').forEach(el => {
                const speed = el.dataset.parallax || 0.5;
                const yPos = -(window.scrollY * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    _setupRevealOnScroll() {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('[data-reveal]').forEach(el => {
            revealObserver.observe(el);
        });

        this.observers.push(revealObserver);
    }

    _setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';

        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.min(progress / duration, 1);

            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    slideIn(element, direction = 'left', duration = 300) {
        const transforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            top: 'translateY(-100%)',
            bottom: 'translateY(100%)'
        };

        element.style.transform = transforms[direction];
        element.style.display = 'block';

        setTimeout(() => {
            element.style.transition = `transform ${duration}ms ease-out`;
            element.style.transform = 'translate(0, 0)';
        }, 10);
    }

    getState() {
        return {
            observers: this.observers.length,
            animations: this.animations.size
        };
    }
}

const uiAnimations = new UIAnimationsRuntime();
window.__ANTIGRAVITY_UI__ = uiAnimations;
export default uiAnimations;
