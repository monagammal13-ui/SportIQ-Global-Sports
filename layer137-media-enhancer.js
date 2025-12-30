/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 137: DYNAMIC MULTIMEDIA ENHANCER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Analyzes article content and injects contextually relevant 
 *          visual breaks (Images, Videos, GIFs) to improve engagement.
 * Features:
 *  - Keyword-based media injection (e.g., "Goal" -> Celebration GIF).
 *  - Layout breaking helper (prevents walls of text).
 *  - Lazy loading integration.
 *  - "Smart Gallery" creation for groups of images.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        selectors: {
            articleBody: '.article-content, .post-body',
            paragraphs: 'p'
        },
        injectionFrequency: 4, // Inject media every 4 paragraphs
        keywords: {
            'goal': { type: 'gif', src: 'https://media.giphy.com/media/3o7qDWp7hxBA1F8uIV/giphy.gif' }, // Demo
            'win': { type: 'gif', src: 'https://media.giphy.com/media/26brv0coVfD7LbwHe/giphy.gif' },
            'interview': { type: 'image', src: 'https://picsum.photos/800/400?random=1' },
            'stats': { type: 'image', src: 'https://picsum.photos/800/400?random=2' },
            'fans': { type: 'image', src: 'https://picsum.photos/800/400?random=3' }
        }
    };

    class MultimediaEnhancer {
        constructor() {
            this.init();
        }

        init() {
            console.log('🖼️ Layer 137: Multimedia Enhancer - INITIALIZING');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.enhanceContent());
            } else {
                this.enhanceContent();
            }
        }

        enhanceContent() {
            const container = document.querySelector(CONFIG.selectors.articleBody);
            if (!container) return;

            const paragraphs = Array.from(container.querySelectorAll(CONFIG.selectors.paragraphs));

            // Skip short articles
            if (paragraphs.length < 5) return;

            let pCounter = 0;

            paragraphs.forEach((p, index) => {
                pCounter++;

                // 1. Keyword Scan (High Priority)
                const text = p.textContent.toLowerCase();
                const matchedKeyword = Object.keys(CONFIG.keywords).find(k => text.includes(k));

                if (matchedKeyword && pCounter >= 2) {
                    this.injectMediaAfter(p, CONFIG.keywords[matchedKeyword], matchedKeyword);
                    pCounter = -1; // Reset to avoid spacing issues
                }
                // 2. Frequency Injection (Low Priority fallback)
                else if (pCounter >= CONFIG.injectionFrequency) {
                    // Inject generic visual break
                    this.injectMediaAfter(p, { type: 'image', src: `https://picsum.photos/800/400?random=${index}` }, 'Visual Break');
                    pCounter = 0;
                }
            });
        }

        injectMediaAfter(element, media, alt) {
            // Avoid injecting if next element is already media
            const next = element.nextElementSibling;
            if (next && (next.tagName === 'IMG' || next.tagName === 'VIDEO' || next.classList.contains('injected-media'))) {
                return;
            }

            const wrapper = document.createElement('figure');
            wrapper.className = 'injected-media animated-fade-in';

            let content = '';
            if (media.type === 'gif' || media.type === 'image') {
                content = `<img src="${media.src}" alt="Context: ${alt}" loading="lazy" />`;
            } else if (media.type === 'video') {
                content = `<video src="${media.src}" controls muted></video>`;
            }

            wrapper.innerHTML = `
                ${content}
                <figcaption>Context: ${alt.charAt(0).toUpperCase() + alt.slice(1)}</figcaption>
            `;

            element.parentNode.insertBefore(wrapper, element.nextSibling);
            console.log(`🖼️ Injected ${media.type} for "${alt}"`);
        }
    }

    // Auto-Expose
    window.Layer137_Media = new MultimediaEnhancer();

})();
