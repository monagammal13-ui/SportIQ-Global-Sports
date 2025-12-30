/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 157 – GLOBAL HEADLINE VARIANTS GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Generates multiple synchronized headline variants optimized for 
 * global, regional, and platform-specific distribution.
 * 
 * Features:
 * - Multi-variant headline generation
 * - Platform-specific optimization (mobile, desktop, social)
 * - Character limit adaptation
 * - SEO-optimized variants
 * - Emotional tone variants
 * - Regional language adaptation
 * - A/B testing support
 * - Performance tracking
 * 
 * @version 1.0.0
 * @layer 157
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 157,
        name: 'Global Headline Variants Generator',

        variantTypes: {
            standard: { maxLength: 100, style: 'neutral' },
            short: { maxLength: 60, style: 'concise' },
            long: { maxLength: 150, style: 'detailed' },
            seo: { maxLength: 70, style: 'keyword-rich' },
            social: { maxLength: 80, style: 'engaging' },
            mobile: { maxLength: 50, style: 'brief' },
            breaking: { maxLength: 90, style: 'urgent' }
        },

        toneVariants: ['neutral', 'exciting', 'analytical', 'conversational', 'urgent'],

        intervals: {
            generationCheck: 5000,
            performanceUpdate: 30000,
            analyticsUpdate: 30000
        }
    };

    class HeadlineVariantsGenerator {
        constructor() {
            this.articleVariants = new Map();
            this.performanceData = new Map();
            this.generationQueue = [];
            this.generationLog = [];
            this.config = null;
            this.stats = {
                totalGenerated: 0,
                variantsCreated: 0,
                averageVariants: 0,
                bestPerforming: null
            };

            this.init();
        }

        async init() {
            console.log('📝 [Layer 157] Global Headline Variants Generator - Initializing...');

            try {
                await this.loadConfiguration();
                this.startGenerationEngine();
                this.startPerformanceTracking();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 157] Global Headline Variants Generator - Active');
                this.logGeneration('SYSTEM', 'Headline generator initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 157] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer157-headline-variants.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        generateVariants(article) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 157] Invalid article provided');
                return null;
            }

            try {
                const variants = {
                    articleId: article.id,
                    originalHeadline: article.title,
                    variants: new Map(),
                    timestamp: new Date().toISOString()
                };

                // Generate variants for each type
                Object.entries(CONFIG.variantTypes).forEach(([type, config]) => {
                    const variant = this.createVariant(article, type, config);
                    if (variant) {
                        variants.variants.set(type, variant);
                        this.stats.variantsCreated++;
                    }
                });

                // Generate tone variants
                CONFIG.toneVariants.forEach(tone => {
                    const toneVariant = this.createToneVariant(article, tone);
                    if (toneVariant) {
                        variants.variants.set(`tone-${tone}`, toneVariant);
                        this.stats.variantsCreated++;
                    }
                });

                // Store variants
                this.articleVariants.set(article.id, variants);
                this.stats.totalGenerated++;
                this.updateAverageVariants(variants.variants.size);

                this.logGeneration('GENERATE', `Generated ${variants.variants.size} headline variants for "${article.title}"`);

                // Dispatch event
                document.dispatchEvent(new CustomEvent('article:headlines-generated', {
                    detail: { article, variants }
                }));

                console.log(`✅ [Layer 157] Generated ${variants.variants.size} headline variants`);

                return variants;

            } catch (error) {
                console.error(`❌ [Layer 157] Variant generation failed for article ${article.id}:`, error);
                return null;
            }
        }

        createVariant(article, type, config) {
            const originalTitle = article.title;
            let variant = originalTitle;

            // Apply style transformations
            switch (config.style) {
                case 'concise':
                    variant = this.makeConcise(originalTitle, config.maxLength);
                    break;
                case 'detailed':
                    variant = this.makeDetailed(originalTitle, article, config.maxLength);
                    break;
                case 'keyword-rich':
                    variant = this.makeSEOOptimized(originalTitle, article, config.maxLength);
                    break;
                case 'engaging':
                    variant = this.makeEngaging(originalTitle, config.maxLength);
                    break;
                case 'brief':
                    variant = this.makeBrief(originalTitle, config.maxLength);
                    break;
                case 'urgent':
                    variant = this.makeUrgent(originalTitle, config.maxLength);
                    break;
                default:
                    variant = this.fitToLength(originalTitle, config.maxLength);
            }

            return {
                text: variant,
                type: type,
                maxLength: config.maxLength,
                actualLength: variant.length,
                style: config.style,
                performance: { views: 0, clicks: 0, ctr: 0 }
            };
        }

        makeConcise(title, maxLength) {
            // Remove unnecessary words
            let concise = title
                .replace(/\b(the|a|an|that|which|who|very|really|just)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();

            return this.fitToLength(concise, maxLength);
        }

        makeDetailed(title, article, maxLength) {
            // Add context from excerpt
            const addition = article.excerpt ? `: ${article.excerpt.split('.')[0]}` : '';
            return this.fitToLength(title + addition, maxLength);
        }

        makeSEOOptimized(title, article, maxLength) {
            // Add relevant keywords
            const category = article.category || article.sport || '';
            const keywords = category ? `${category} - ` : '';
            return this.fitToLength(keywords + title, maxLength);
        }

        makeEngaging(title, maxLength) {
            // Add engaging elements
            const engagingPrefixes = ['🔥 ', '⚡ ', '🎯 ', ''];
            const prefix = engagingPrefixes[Math.floor(Math.random() * engagingPrefixes.length)];
            return this.fitToLength(prefix + title, maxLength);
        }

        makeBrief(title, maxLength) {
            // Extreme truncation for mobile
            const words = title.split(' ');
            let brief = '';
            for (const word of words) {
                if ((brief + word).length > maxLength - 3) break;
                brief += (brief ? ' ' : '') + word;
            }
            return brief + (brief.length < title.length ? '...' : '');
        }

        makeUrgent(title, maxLength) {
            // Add urgency indicators
            const urgent = title.includes('BREAKING') ? title : `BREAKING: ${title}`;
            return this.fitToLength(urgent, maxLength);
        }

        fitToLength(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength - 3) + '...';
        }

        createToneVariant(article, tone) {
            const originalTitle = article.title;
            let variant = originalTitle;

            switch (tone) {
                case 'exciting':
                    variant = this.makeExciting(originalTitle);
                    break;
                case 'analytical':
                    variant = this.makeAnalytical(originalTitle);
                    break;
                case 'conversational':
                    variant = this.makeConversational(originalTitle);
                    break;
                case 'urgent':
                    variant = this.makeUrgent(originalTitle, 100);
                    break;
                default:
                    variant = originalTitle;
            }

            return {
                text: variant,
                type: `tone-${tone}`,
                tone: tone,
                actualLength: variant.length,
                performance: { views: 0, clicks: 0, ctr: 0 }
            };
        }

        makeExciting(title) {
            const excitingWords = {
                'wins': 'dominates',
                'defeats': 'crushes',
                'scores': 'nets incredible',
                'plays': 'delivers stunning'
            };

            let exciting = title;
            Object.entries(excitingWords).forEach(([from, to]) => {
                exciting = exciting.replace(new RegExp(from, 'gi'), to);
            });

            return exciting;
        }

        makeAnalytical(title) {
            return `Analysis: ${title}`;
        }

        makeConversational(title) {
            return `Here's what happened: ${title}`;
        }

        getVariant(articleId, variantType) {
            const variants = this.articleVariants.get(articleId);
            return variants ? variants.variants.get(variantType) : null;
        }

        getBestPerformingVariant(articleId) {
            const variants = this.articleVariants.get(articleId);
            if (!variants) return null;

            let best = null;
            let bestCTR = 0;

            variants.variants.forEach(variant => {
                if (variant.performance.ctr > bestCTR) {
                    bestCTR = variant.performance.ctr;
                    best = variant;
                }
            });

            return best;
        }

        trackPerformance(articleId, variantType, action) {
            const variant = this.getVariant(articleId, variantType);
            if (!variant) return;

            if (action === 'view') {
                variant.performance.views++;
            } else if (action === 'click') {
                variant.performance.clicks++;
            }

            // Update CTR
            if (variant.performance.views > 0) {
                variant.performance.ctr = variant.performance.clicks / variant.performance.views;
            }
        }

        startGenerationEngine() {
            console.log('🚀 [Layer 157] Starting headline generation engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.generationCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForGeneration(event.detail.article);
                }
            });
        }

        queueForGeneration(article) {
            if (!this.generationQueue.find(a => a.id === article.id)) {
                this.generationQueue.push(article);
            }
        }

        processQueue() {
            if (this.generationQueue.length === 0) return;

            const article = this.generationQueue.shift();
            if (article) {
                this.generateVariants(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.articleVariants.has(article.id)) {
                            this.queueForGeneration(article);
                        }
                    });
                }
            }
        }

        startPerformanceTracking() {
            setInterval(() => {
                this.updatePerformanceData();
            }, CONFIG.intervals.performanceUpdate);
        }

        updatePerformanceData() {
            // Find top performing variant
            let topVariant = null;
            let topCTR = 0;

            this.articleVariants.forEach((variants, articleId) => {
                const best = this.getBestPerformingVariant(articleId);
                if (best && best.performance.ctr > topCTR) {
                    topCTR = best.performance.ctr;
                    topVariant = { articleId, variant: best };
                }
            });

            this.stats.bestPerforming = topVariant;
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();

            if (window.SPORTIQ) {
                window.SPORTIQ.headlineVariantsStats = this.stats;
            }

            this.updateDashboard();
        }

        updateAverageVariants(variantCount) {
            const total = this.stats.averageVariants * (this.stats.totalGenerated - 1) + variantCount;
            this.stats.averageVariants = total / this.stats.totalGenerated;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer157-dashboard';
            dashboard.className = 'layer157-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer157-dashboard-header">
                    <h3>📝 Headline Variants</h3>
                    <button class="layer157-close-btn">×</button>
                </div>
                <div class="layer157-dashboard-content">
                    <div class="layer157-stat">
                        <span class="layer157-stat-label">Articles:</span>
                        <span class="layer157-stat-value" id="layer157-total">0</span>
                    </div>
                    <div class="layer157-stat">
                        <span class="layer157-stat-label">Total Variants:</span>
                        <span class="layer157-stat-value" id="layer157-variants">0</span>
                    </div>
                    <div class="layer157-stat">
                        <span class="layer157-stat-label">Avg/Article:</span>
                        <span class="layer157-stat-value" id="layer157-avg">0</span>
                    </div>
                    <div class="layer157-log" id="layer157-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer157-toggle-btn';
            toggleBtn.innerHTML = '📝';
            toggleBtn.title = 'Toggle Headline Variants Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer157-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer157-total');
            const variantsEl = document.getElementById('layer157-variants');
            const avgEl = document.getElementById('layer157-avg');

            if (totalEl) totalEl.textContent = this.stats.totalGenerated;
            if (variantsEl) variantsEl.textContent = this.stats.variantsCreated;
            if (avgEl) avgEl.textContent = this.stats.averageVariants.toFixed(1);

            const logEl = document.getElementById('layer157-log');
            if (logEl && this.generationLog.length > 0) {
                const recentLogs = this.generationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer157-log-entry">
                        <span class="layer157-log-type">${log.type}</span>
                        <span class="layer157-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logGeneration(type, message) {
            this.generationLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.generationLog.length > 100) this.generationLog.shift();
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeadlineGenerator);
    } else {
        initHeadlineGenerator();
    }

    function initHeadlineGenerator() {
        const generator = new HeadlineVariantsGenerator();
        window.Layer157_HeadlineVariants = generator;

        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.headlineVariants = generator;

        document.dispatchEvent(new CustomEvent('layer157:ready', { detail: { generator } }));
        console.log('🎯 [Layer 157] Global Headline Variants Generator - Ready');
    }

})();
