/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 167 – MULTIMEDIA NARRATIVE COMPOSER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Integrate images, video, and data visualizations contextually 
 * into articles.
 * 
 * @version 1.0.0
 * @layer 167
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 167,
        name: 'Multimedia Narrative Composer',

        mediaTypes: ['image', 'video', 'chart', 'infographic', 'embed'],

        placementStrategies: ['intro', 'section-break', 'evidence-support', 'conclusion'],

        intervals: {
            compositionCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class MultimediaNarrative {
        constructor() {
            this.composedArticles = new Map();
            this.compositionQueue = [];
            this.compositionLog = [];
            this.config = null;
            this.stats = {
                totalComposed: 0,
                imagesAdded: 0,
                videosAdded: 0,
                chartsAdded: 0
            };

            this.init();
        }

        async init() {
            console.log('🎬 [Layer 167] Multimedia Narrative Composer - Initializing...');

            try {
                await this.loadConfiguration();
                this.startCompositionEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 167] Multimedia Narrative Composer - Active');
                this.logComposition('SYSTEM', 'Multimedia composer initialized');

            } catch (error) {
                console.error('❌ [Layer 167] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer167-multimedia-composer.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        composeArticle(article) {
            if (!article || !article.id) return null;

            try {
                const composition = {
                    articleId: article.id,
                    mediaElements: [],
                    placements: [],
                    timestamp: new Date().toISOString()
                };

                // Identify optimal media placement points
                composition.placements = this.identifyPlacementPoints(article);

                // Compose multimedia elements
                composition.mediaElements = this.composeMediaElements(article, composition.placements);

                // Apply multimedia to article
                this.applyMultimedia(article, composition);

                // Store composition
                this.composedArticles.set(article.id, composition);
                this.stats.totalComposed++;
                this.updateMediaStats(composition.mediaElements);

                this.logComposition('COMPOSE', `Article "${article.title}" - ${composition.mediaElements.length} media elements`);

                document.dispatchEvent(new CustomEvent('article:multimedia-composed', {
                    detail: { article, composition }
                }));

                return composition;

            } catch (error) {
                console.error(`❌ [Layer 167] Composition failed for article ${article.id}:`, error);
                return null;
            }
        }

        identifyPlacementPoints(article) {
            const placements = [];
            const content = article.content || '';

            // Intro placement
            placements.push({
                position: 'intro',
                strategy: 'intro',
                priority: 1
            });

            // Section break placements
            const paragraphs = content.split(/\n\n+/);
            const midPoint = Math.floor(paragraphs.length / 2);
            placements.push({
                position: `paragraph-${midPoint}`,
                strategy: 'section-break',
                priority: 2
            });

            // Evidence support (if quotes present)
            const quoteMatches = content.match(/"[^"]+"/g) || [];
            if (quoteMatches.length > 0) {
                placements.push({
                    position: 'quote-1',
                    strategy: 'evidence-support',
                    priority: 3
                });
            }

            return placements;
        }

        composeMediaElements(article, placements) {
            const mediaElements = [];

            placements.forEach(placement => {
                const media = this.selectMediaForPlacement(article, placement);
                if (media) {
                    mediaElements.push(media);
                }
            });

            return mediaElements;
        }

        selectMediaForPlacement(article, placement) {
            switch (placement.strategy) {
                case 'intro':
                    return this.createFeaturedImage(article);
                case 'section-break':
                    return this.createDataVisualization(article);
                case 'evidence-support':
                    return this.createVideoEmbed(article);
                default:
                    return null;
            }
        }

        createFeaturedImage(article) {
            return {
                type: 'image',
                src: article.featuredImage || this.generatePlaceholderImage(article),
                alt: article.title,
                caption: article.imageCaption || article.title,
                position: 'intro',
                width: '100%'
            };
        }

        createDataVisualization(article) {
            return {
                type: 'chart',
                chartType: 'bar',
                data: this.extractChartData(article),
                title: 'Performance Metrics',
                position: 'section-break'
            };
        }

        createVideoEmbed(article) {
            if (article.videoUrl) {
                return {
                    type: 'video',
                    src: article.videoUrl,
                    thumbnail: article.videoThumbnail,
                    duration: article.videoDuration,
                    position: 'evidence-support'
                };
            }
            return null;
        }

        generatePlaceholderImage(article) {
            // Generate a placeholder image URL based on article title
            const encodedTitle = encodeURIComponent(article.title.substring(0, 50));
            return `https://via.placeholder.com/800x400/667eea/ffffff?text=${encodedTitle}`;
        }

        extractChartData(article) {
            // Placeholder chart data extraction
            return {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: 'Metrics',
                    data: [65, 59, 80, 81]
                }]
            };
        }

        applyMultimedia(article, composition) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            composition.mediaElements.forEach(media => {
                const mediaElement = this.createMediaElement(media);
                if (mediaElement) {
                    this.insertMediaElement(articleElement, mediaElement, media.position);
                }
            });

            // Add multimedia indicator
            this.attachMultimediaIndicator(articleElement, composition);
        }

        createMediaElement(media) {
            const container = document.createElement('div');
            container.className = `multimedia-element multimedia-${media.type}`;

            switch (media.type) {
                case 'image':
                    container.innerHTML = `
                        <img src="${media.src}" alt="${media.alt}" style="width: ${media.width};">
                        <p class="media-caption">${media.caption}</p>
                    `;
                    break;

                case 'video':
                    container.innerHTML = `
                        <video controls style="width: 100%;">
                            <source src="${media.src}" type="video/mp4">
                        </video>
                    `;
                    break;

                case 'chart':
                    container.innerHTML = `
                        <div class="chart-container">
                            <h4>${media.title}</h4>
                            <canvas id="chart-${Date.now()}"></canvas>
                        </div>
                    `;
                    break;
            }

            return container;
        }

        insertMediaElement(articleElement, mediaElement, position) {
            if (position === 'intro') {
                articleElement.insertBefore(mediaElement, articleElement.firstChild.nextSibling);
            } else {
                articleElement.appendChild(mediaElement);
            }
        }

        attachMultimediaIndicator(element, composition) {
            const indicator = document.createElement('div');
            indicator.className = 'multimedia-indicator';
            indicator.innerHTML = `
                <span>🎬 Multimedia Article</span>
                <span>${composition.mediaElements.length} elements</span>
            `;
            element.insertBefore(indicator, element.firstChild);
        }

        updateMediaStats(mediaElements) {
            mediaElements.forEach(media => {
                if (media.type === 'image') this.stats.imagesAdded++;
                else if (media.type === 'video') this.stats.videosAdded++;
                else if (media.type === 'chart') this.stats.chartsAdded++;
            });
        }

        startCompositionEngine() {
            console.log('🚀 [Layer 167] Starting multimedia composition...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.compositionCheck);

            document.addEventListener('article:structured', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForComposition(event.detail.article);
                }
            });
        }

        queueForComposition(article) {
            if (!this.compositionQueue.find(a => a.id === article.id)) {
                this.compositionQueue.push(article);
            }
        }

        processQueue() {
            if (this.compositionQueue.length === 0) return;

            const article = this.compositionQueue.shift();
            if (article) {
                this.composeArticle(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.composedArticles.has(article.id)) {
                            this.queueForComposition(article);
                        }
                    });
                }
            }
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.multimediaComposerStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer167-dashboard';
            dashboard.className = 'layer167-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer167-dashboard-header">
                    <h3>🎬 Multimedia Composer</h3>
                    <button class="layer167-close-btn">×</button>
                </div>
                <div class="layer167-dashboard-content">
                    <div class="layer167-stat">
                        <span class="layer167-stat-label">Composed:</span>
                        <span class="layer167-stat-value" id="layer167-total">0</span>
                    </div>
                    <div class="layer167-stat">
                        <span class="layer167-stat-label">Images:</span>
                        <span class="layer167-stat-value" id="layer167-images">0</span>
                    </div>
                    <div class="layer167-stat">
                        <span class="layer167-stat-label">Videos:</span>
                        <span class="layer167-stat-value" id="layer167-videos">0</span>
                    </div>
                    <div class="layer167-log" id="layer167-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer167-toggle-btn';
            toggleBtn.innerHTML = '🎬';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer167-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer167-total');
            const imagesEl = document.getElementById('layer167-images');
            const videosEl = document.getElementById('layer167-videos');

            if (totalEl) totalEl.textContent = this.stats.totalComposed;
            if (imagesEl) imagesEl.textContent = this.stats.imagesAdded;
            if (videosEl) videosEl.textContent = this.stats.videosAdded;

            const logEl = document.getElementById('layer167-log');
            if (logEl && this.compositionLog.length > 0) {
                const recentLogs = this.compositionLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer167-log-entry">
                        <span class="layer167-log-type">${log.type}</span>
                        <span class="layer167-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logComposition(type, message) {
            this.compositionLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.compositionLog.length > 100) this.compositionLog.shift();
        }

        getComposition(articleId) {
            return this.composedArticles.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMultimediaComposer);
    } else {
        initMultimediaComposer();
    }

    function initMultimediaComposer() {
        const composer = new MultimediaNarrative();
        window.Layer167_MultimediaComposer = composer;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.multimediaComposer = composer;
        document.dispatchEvent(new CustomEvent('layer167:ready', { detail: { composer } }));
        console.log('🎯 [Layer 167] Multimedia Narrative Composer - Ready');
    }

})();
