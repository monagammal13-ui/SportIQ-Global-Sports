/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 132: MULTIMEDIA STORYTELLING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Transforms standard articles into immersive "Scrollytelling" experiences.
 * Features: Parallax backgrounds, sticky narrative overlays, full-screen media
 *          breakers, and scroll-triggered animations.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        story: {
            activationThreshold: 0.1, // IntersectionObs threshold
            parallaxSpeed: 0.5
        },
        selectors: {
            articleContainer: '.article-body', // Target standard article bodies
            immersiveWrapper: '#immersive-story-root'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STORYTELLING ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const StoryEngine = {
        initialize: function () {
            console.log('📖 [MultimediaStory] Engine initialized');

            this.observer = new IntersectionObserver(this.handleScrollIntersect.bind(this), {
                threshold: [0, 0.2, 0.5, 0.8, 1.0],
                rootMargin: "-10% 0px -10% 0px"
            });

            // Auto-detect existing immersive structures
            this.scanForChapters();

            // Parallax Listener
            window.addEventListener('scroll', this.handleParallax.bind(this));
        },

        scanForChapters: function () {
            const elements = document.querySelectorAll('.story-chapter, .immersive-hero');
            elements.forEach(el => this.observer.observe(el));
        },

        handleScrollIntersect: function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');

                    // Auto-play videos when in center view
                    if (entry.intersectionRatio > 0.5) {
                        const vid = entry.target.querySelector('video');
                        if (vid && vid.paused) vid.play();
                    }
                } else {
                    // entry.target.classList.remove('in-view'); // Optional: Toggle class

                    // Pause videos when out of view
                    const vid = entry.target.querySelector('video');
                    if (vid && !vid.paused) vid.pause();
                }
            });
        },

        handleParallax: function () {
            const parallaxEls = document.querySelectorAll('.parallax-bg');
            parallaxEls.forEach(el => {
                const speed = el.getAttribute('data-speed') || CONFIG.story.parallaxSpeed;
                const rect = el.parentElement.getBoundingClientRect();

                // Only animate if visible
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const offset = (window.innerHeight - rect.top) * speed;
                    el.style.transform = `translateY(${offset * 0.1}px) scale(1.1)`;
                }
            });
        },

        // ═══════════════════════════════════════════════════════════════════
        // BUILDER FUNCTIONS (For transforming content)
        // ═══════════════════════════════════════════════════════════════════

        buildImmersiveExperience: function (data) {
            // data: { title, subtitle, coverImage, chapters: [{ type: 'text'|'full-image'|'split', content, media }] }

            let html = `
                <div id="immersive-story-root" class="immersive-wrapper">
                    <header class="immersive-hero">
                        <div class="parallax-bg" style="background-image: url('${data.coverImage}')"></div>
                        <div class="hero-content">
                            <h1 class="story-title">${data.title}</h1>
                            <p class="story-subtitle">${data.subtitle}</p>
                            <span class="scroll-hint">▼ SCROLL TO START</span>
                        </div>
                    </header>
            `;

            data.chapters.forEach((chapter, index) => {
                if (chapter.type === 'text') {
                    html += `
                        <div class="story-chapter text-chapter">
                            <div class="chapter-content">${chapter.content}</div>
                        </div>
                    `;
                } else if (chapter.type === 'full-image') {
                    html += `
                        <div class="story-chapter full-media-chapter">
                            <div class="parallax-bg" style="background-image: url('${chapter.media}')"></div>
                            <div class="floating-caption">${chapter.content || ''}</div>
                        </div>
                    `;
                } else if (chapter.type === 'split') {
                    html += `
                        <div class="story-chapter split-chapter">
                            <div class="split-media sticky-side">
                                <img src="${chapter.media}" alt="Chapter Media">
                            </div>
                            <div class="split-text">
                                ${chapter.content}
                            </div>
                        </div>
                    `;
                }
            });

            html += `</div>`;

            // Replace or Append
            // specific logic: if #main-content exists, replace it, otherwise append to body
            const main = document.getElementById('main-content-feed') || document.body;

            // Create a modal-like overlay or replace content? 
            // For this demo, let's inject into a dedicated container or replace content area
            const existing = document.querySelector(CONFIG.selectors.immersiveWrapper);
            if (existing) existing.remove();

            // Inject new
            if (document.getElementById('main-content-feed')) {
                document.getElementById('main-content-feed').innerHTML = html;
            } else {
                document.body.insertAdjacentHTML('afterbegin', html);
            }

            // Rescan
            this.scanForChapters();
        },

        injectDemo: function () {
            this.buildImmersiveExperience({
                title: "The Rise of a Legend",
                subtitle: "How determination and skill forged a new era in sports history.",
                coverImage: "https://via.placeholder.com/1920x1080/1e293b/ffffff?text=Immersive+Feature+Post",
                chapters: [
                    {
                        type: 'text',
                        content: `
                            <h3>The Beginning</h3>
                            <p>It started on the streets of a small town. Without proper equipment, the dream seemed impossible. Yet, passion knows no bounds. Every morning before dawn, the training began.</p>
                            <p>Observers noted an unusual intensity in the young athlete's eyes—a fire that refused to be extinguished by setbacks or failures.</p>
                        `
                    },
                    {
                        type: 'full-image',
                        media: "https://via.placeholder.com/1920x1080/0f172a/ffffff?text=The+Stadium+Light",
                        content: "Under the bright lights, everything changed."
                    },
                    {
                        type: 'split',
                        media: "https://via.placeholder.com/800x1200/3b82f6/ffffff?text=Action+Shot",
                        content: `
                            <h3>Breaking Through</h3>
                            <p>The 2024 season was the turning point. Statistics shattered, records broken. The world watched in awe as a new king ascended the throne.</p>
                            <p>"I never doubted myself," he said in a post-match interview. "I just waited for the world to catch up."</p>
                            <p>Analysts struggle to define the style of play. Is it aggressive? Tactical? Or something entirely new?</p>
                        `
                    },
                    {
                        type: 'text',
                        content: `
                            <blockquote class="story-quote">"True greatness is not verified by medals, but by the inspiration left behind."</blockquote>
                        `
                    }
                ]
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.MultimediaStory = {
        init: StoryEngine.initialize.bind(StoryEngine),
        build: StoryEngine.buildImmersiveExperience.bind(StoryEngine),
        demo: StoryEngine.injectDemo.bind(StoryEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => StoryEngine.initialize());
    } else {
        StoryEngine.initialize();
    }

})();
