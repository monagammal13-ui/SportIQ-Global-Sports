/**
 * HyperSight Global - Main JavaScript
 * Layer 0: Core Interactive Behaviors
 */

// ========== UTILITY FUNCTIONS ==========

/**
 * Wait for DOM to be fully loaded
 */
function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait = 20) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== MOBILE NAVIGATION ==========

function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        // Toggle menu on button click
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');

            // Animate hamburger icon
            const spans = navToggle.querySelectorAll('span');
            if (navToggle.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');

                // Reset hamburger icon
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');

                // Reset hamburger icon
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

// ========== LANGUAGE SELECTOR ==========

function initLanguageSelector() {
    const languageBtn = document.getElementById('languageBtn');
    const languageSelector = document.getElementById('languageSelector');
    const languageDropdown = document.getElementById('languageDropdown');
    const currentLanguageSpan = document.getElementById('currentLanguage');
    const langOptions = document.querySelectorAll('.lang-option');

    if (languageBtn && languageSelector) {
        // Toggle dropdown
        languageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            languageSelector.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!languageSelector.contains(e.target)) {
                languageSelector.classList.remove('active');
            }
        });

        // Handle language selection
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();

                const selectedLang = option.getAttribute('data-lang');
                const selectedText = option.textContent.trim();

                // Update current language display
                currentLanguageSpan.textContent = selectedLang.toUpperCase();

                // Update active state
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Close dropdown
                languageSelector.classList.remove('active');

                // Store language preference
                localStorage.setItem('selectedLanguage', selectedLang);

                // Log language change (will be used for content switching later)
                console.log(`Language changed to: ${selectedText} (${selectedLang})`);

                // TODO: Implement actual language content switching
                // For now, we'll just show a message
                if (selectedLang !== 'en') {
                    console.log(`Note: ${selectedText} translation coming soon. Currently showing English.`);
                }
            });
        });

        // Load saved language preference
        const savedLang = localStorage.getItem('selectedLanguage') || 'en';
        const savedOption = document.querySelector(`.lang-option[data-lang="${savedLang}"]`);
        if (savedOption) {
            langOptions.forEach(opt => opt.classList.remove('active'));
            savedOption.classList.add('active');
            currentLanguageSpan.textContent = savedLang.toUpperCase();
        }
    }
}

// ========== STICKY HEADER ==========

function initStickyHeader() {
    const header = document.getElementById('header');

    if (header) {
        const handleScroll = throttle(() => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }
}

// ========== SMOOTH SCROLLING ==========

function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Skip if it's just "#"
            if (href === '#') return;

            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Update active link
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });

                if (link.classList.contains('nav-link')) {
                    link.classList.add('active');
                }
            }
        });
    });
}

// ========== SCROLL REVEAL ANIMATIONS ==========

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if (reveals.length === 0) return;

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing after reveal
                // revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(element => {
        revealObserver.observe(element);
    });
}

// ========== ACTIVE NAVIGATION ON SCROLL ==========

function initActiveNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    const handleScroll = throttle(() => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, 100);

    window.addEventListener('scroll', handleScroll);
}

// ========== FORM HANDLING ==========

function initFormHandling() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span>';

            // Simulate form submission (replace with actual API call)
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Success
                console.log('Form submitted:', data);
                alert('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
                contactForm.reset();

            } catch (error) {
                // Error
                console.error('Form submission error:', error);
                alert('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.');

            } finally {
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });

        // Add focus styles to inputs
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--color-primary)';
                input.style.outline = 'none';
                input.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            });

            input.addEventListener('blur', () => {
                input.style.borderColor = 'var(--color-gray-200)';
                input.style.boxShadow = 'none';
            });
        });
    }
}

// ========== CARD HOVER EFFECTS ==========

function initCardEffects() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        // 3D tilt effect on mousemove (optional)
        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            this.style.transform = `translateY(-8px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = '';
        });
    });
}

// ========== SKELETON LOADING DEMO ==========

function initSkeletonLoading() {
    // Simulate loading state for feature images
    const featureImages = ['featureImage1', 'featureImage2', 'featureImage3'];

    featureImages.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            // Add skeleton class initially
            element.classList.add('skeleton');

            // Remove skeleton after delay (simulating image load)
            setTimeout(() => {
                element.classList.remove('skeleton');
                element.style.background = `linear-gradient(135deg, 
                    hsl(${240 + index * 40}, 100%, 60%) 0%, 
                    hsl(${260 + index * 40}, 90%, 70%) 100%)`;
            }, 1000 + index * 300);
        }
    });

    // About image
    const aboutImage = document.getElementById('aboutImage');
    if (aboutImage) {
        aboutImage.classList.add('skeleton');
        setTimeout(() => {
            aboutImage.classList.remove('skeleton');
        }, 1500);
    }
}

// ========== PERFORMANCE OPTIMIZATIONS ==========

// Enhanced lazy loading for images, videos, and background images
function initLazyLoading() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Handle data-src attribute
                if (img.dataset.src) {
                    // Create new image to load in background
                    const tempImg = new Image();

                    tempImg.onload = () => {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        img.removeAttribute('data-src');

                        // Fade in animation
                        img.style.opacity = '0';
                        img.style.transition = 'opacity 0.3s ease-in';
                        setTimeout(() => {
                            img.style.opacity = '1';
                        }, 50);
                    };

                    tempImg.onerror = () => {
                        console.warn('Failed to load image:', img.dataset.src);
                        // Use placeholder on error
                        img.src = '/assets/images/placeholders/article.svg';
                        img.classList.add('error');
                    };

                    tempImg.src = img.dataset.src;
                }

                // Handle srcset for responsive images
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                    img.removeAttribute('data-srcset');
                }

                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01
    });

    images.forEach(img => imageObserver.observe(img));

    // Lazy load videos
    const videos = document.querySelectorAll('video[data-src]');

    const videoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                const sources = video.querySelectorAll('source[data-src]');

                sources.forEach(source => {
                    source.src = source.dataset.src;
                    source.removeAttribute('data-src');
                });

                if (video.dataset.src) {
                    video.src = video.dataset.src;
                    video.removeAttribute('data-src');
                }

                video.load();
                video.classList.add('loaded');
                videoObserver.unobserve(video);
            }
        });
    }, {
        rootMargin: '300px',
        threshold: 0.01
    });

    videos.forEach(video => videoObserver.observe(video));

    // Lazy load background images
    const bgElements = document.querySelectorAll('[data-bg]');

    const bgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                element.style.backgroundImage = `url('${element.dataset.bg}')`;
                element.classList.add('loaded');
                element.removeAttribute('data-bg');
                bgObserver.unobserve(element);
            }
        });
    }, {
        rootMargin: '200px',
        threshold: 0.01
    });

    bgElements.forEach(element => bgObserver.observe(element));

    // Log performance
    console.log(`🖼️ Lazy loading initialized: ${images.length} images, ${videos.length} videos, ${bgElements.length} backgrounds`);
}

// ========== ANIMATIONS ON LOAD ==========

function initAnimationsOnLoad() {
    // Add fade-in to body
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in';

    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}

// ========== BACK TO TOP BUTTON (Optional) ==========

function initBackToTop() {
    // Create back to top button
    const backToTop = document.createElement('button');
    backToTop.innerHTML = '↑';
    backToTop.className = 'back-to-top';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--gradient-primary);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
    `;

    document.body.appendChild(backToTop);

    // Show/hide on scroll
    const handleScroll = throttle(() => {
        if (window.scrollY > 500) {
            backToTop.style.opacity = '1';
            backToTop.style.visibility = 'visible';
        } else {
            backToTop.style.opacity = '0';
            backToTop.style.visibility = 'hidden';
        }
    }, 100);

    window.addEventListener('scroll', handleScroll);

    // Scroll to top on click
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Hover effect
    backToTop.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = 'var(--shadow-xl)';
    });

    backToTop.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'var(--shadow-lg)';
    });
}

// ========== INITIALIZE ALL ==========

ready(() => {
    console.log('🚀 SPORTIQ initialized!');

    // Initialize all features
    initMobileNav();
    initLanguageSelector();
    initStickyHeader();
    initSmoothScroll();
    initScrollReveal();
    initActiveNavOnScroll();
    initFormHandling();
    initCardEffects();
    initSkeletonLoading();
    initLazyLoading();
    initAnimationsOnLoad();
    initBackToTop();

    console.log('✅ All interactive features loaded successfully!');
});

// ========== EXPORT FOR MODULES (Optional) ==========

// If using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMobileNav,
        initStickyHeader,
        initSmoothScroll,
        initScrollReveal,
        initActiveNavOnScroll,
        initFormHandling,
        initCardEffects,
        initSkeletonLoading,
        initLazyLoading,
        initBackToTop
    };
}
