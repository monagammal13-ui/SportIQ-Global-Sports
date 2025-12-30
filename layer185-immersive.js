/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 185 – LONG-READ IMMERSIVE EXPERIENCE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Render long-form journalism with immersive scroll-based storytelling.
 * 
 * @version 1.0.0
 * @layer 185
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 185,
        name: 'Long-Read Immersive Experience Engine',

        longReadThreshold: 2000, // words

        intervals: {
            scrollTracking: 100,
            analyticsUpdate: 60000
        }
    };

    class ImmersiveExperience {
        constructor() {
            this.immersiveArticles = new Map();
            this.scrollProgress = new Map();
            this.config = null;
            this.stats = {
                immersiveArticles: 0,
                averageReadTime: 0,
                completionRate: 0
            };

            this.init();
        }

        async init() {
            console.log('📖 [Layer 185] Immersive Experience - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupImmersive();
                this.startTracking();
                this.createDashboard();

                console.log('✅ [Layer 185] Immersive Experience - Active');

            } catch (error) {
                console.error('❌ [Layer 185] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer185-immersive.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupImmersive() {
            document.addEventListener('article:view', (event) => {
                if (event.detail && event.detail.article) {
                    this.evaluateForImmersive(event.detail.article);
                }
            });
        }

        evaluateForImmersive(article) {
            const wordCount = this.countWords(article.content || '');

            if (wordCount >= CONFIG.longReadThreshold) {
                this.renderImmersive(article);
            }
        }

        countWords(text) {
            return text.split(/\s+/).filter(word => word.length > 0).length;
        }

        renderImmersive(article) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            // Apply immersive class
            articleElement.classList.add('immersive-article');

            // Add progress indicator
            this.addProgressIndicator(articleElement);

            // Enable scroll-based effects
            this.enableScrollEffects(article.id, articleElement);

            // Track as immersive
            this.immersiveArticles.set(article.id, {
                article: article,
                startedAt: new Date().toISOString(),
                progress: 0,
                completedAt: null
            });

            this.stats.immersiveArticles++;
        }

        addProgressIndicator(articleElement) {
            const indicator = document.createElement('div');
            indicator.className = 'reading-progress-indicator';
            indicator.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            `;

            articleElement.insertBefore(indicator, articleElement.firstChild);
        }

        enableScrollEffects(articleId, articleElement) {
            let ticking = false;

            const updateProgress = () => {
                const rect = articleElement.getBoundingClientRect();
                const articleHeight = articleElement.scrollHeight;
                const viewportHeight = window.innerHeight;
                const scrolled = -rect.top;
                const total = articleHeight - viewportHeight;
                const progress = Math.max(0, Math.min(100, (scrolled / total) * 100));

                // Update progress bar
                const progressFill = articleElement.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }

                // Update tracking
                const tracking = this.immersiveArticles.get(articleId);
                if (tracking) {
                    tracking.progress = progress;

                    if (progress >= 95 && !tracking.completedAt) {
                        tracking.completedAt = new Date().toISOString();
                        this.recordCompletion(articleId);
                    }
                }

                this.scrollProgress.set(articleId, progress);
                ticking = false;
            };

            const scrollHandler = () => {
                if (!ticking) {
                    window.requestAnimationFrame(updateProgress);
                    ticking = true;
                }
            };

            window.addEventListener('scroll', scrollHandler);

            // Store handler for cleanup
            articleElement.dataset.scrollHandler = scrollHandler;
        }

        recordCompletion(articleId) {
            document.dispatchEvent(new CustomEvent('article:completed', {
                detail: { articleId }
            }));

            this.calculateCompletionRate();
        }

        calculateCompletionRate() {
            const articles = Array.from(this.immersiveArticles.values());
            if (articles.length === 0) return;

            const completed = articles.filter(a => a.completedAt !== null).length;
            this.stats.completionRate = Math.round((completed / articles.length) * 100);
        }

        startTracking() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.immersiveStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer185-dashboard';
            dashboard.className = 'layer185-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer185-dashboard-header">
                    <h3>📖 Immersive</h3>
                    <button class="layer185-close-btn">×</button>
                </div>
                <div class="layer185-dashboard-content">
                    <div class="layer185-stat">
                        <span class="layer185-stat-label">Articles:</span>
                        <span class="layer185-stat-value" id="layer185-articles">0</span>
                    </div>
                    <div class="layer185-stat">
                        <span class="layer185-stat-label">Completion:</span>
                        <span class="layer185-stat-value" id="layer185-completion">0%</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer185-toggle-btn';
            toggleBtn.innerHTML = '📖';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer185-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const articlesEl = document.getElementById('layer185-articles');
            const completionEl = document.getElementById('layer185-completion');

            if (articlesEl) articlesEl.textContent = this.stats.immersiveArticles;
            if (completionEl) completionEl.textContent = `${this.stats.completionRate}%`;
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImmersive);
    } else {
        initImmersive();
    }

    function initImmersive() {
        const immersive = new ImmersiveExperience();
        window.Layer185_Immersive = immersive;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.immersive = immersive;
        console.log('🎯 [Layer 185] Immersive Experience Engine - Ready');
    }

})();
