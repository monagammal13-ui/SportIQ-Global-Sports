/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 152 – INTELLIGENT SECTION MAPPING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Determines which sections, tags, and collections an article belongs 
 * to based on semantic analysis.
 * 
 * Features:
 * - AI-powered semantic analysis
 * - Automatic section classification
 * - Smart tag extraction and mapping
 * - Collection membership determination
 * - Content categorization intelligence
 * - Multi-label classification
 * - Contextual relevance scoring
 * - Dynamic section recommendations
 * 
 * @version 1.0.0
 * @layer 152
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CORE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        version: '1.0.0',
        layerId: 152,
        name: 'Intelligent Section Mapping System',

        // Section categories
        sections: {
            sports: ['football', 'basketball', 'tennis', 'cricket', 'rugby', 'baseball', 'hockey', 'golf', 'athletics', 'swimming'],
            content: ['news', 'analysis', 'opinion', 'interviews', 'features', 'highlights', 'results'],
            special: ['breaking', 'trending', 'featured', 'exclusive', 'sponsored']
        },

        // Semantic keywords for mapping
        keywords: {
            football: ['football', 'soccer', 'goal', 'penalty', 'striker', 'midfielder', 'defender', 'match', 'league', 'tournament'],
            basketball: ['basketball', 'nba', 'dunk', 'three-pointer', 'rebounds', 'assists', 'playoffs', 'championship'],
            tennis: ['tennis', 'serve', 'forehand', 'backhand', 'grand slam', 'wimbledon', 'us open', 'australian open'],
            cricket: ['cricket', 'wicket', 'batting', 'bowling', 'century', 'test match', 'odi', 't20'],
            breaking: ['breaking', 'urgent', 'just in', 'developing', 'alert', 'live update'],
            analysis: ['analysis', 'tactical', 'strategy', 'breakdown', 'in-depth', 'review'],
            trending: ['viral', 'trending', 'popular', 'hot topic', 'buzz', 'sensation']
        },

        // Confidence thresholds
        thresholds: {
            minimumConfidence: 0.3,
            recommendationConfidence: 0.6,
            autoAssignConfidence: 0.8
        },

        // Processing intervals (ms)
        intervals: {
            processingCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION MAPPING CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class IntelligentSectionMapper {
        constructor() {
            this.mappedArticles = new Map();        // Article ID -> sections
            this.sectionArticles = new Map();       // Section -> article IDs
            this.processingQueue = [];              // Articles pending mapping
            this.mappingLog = [];                   // Mapping history
            this.config = null;
            this.stats = {
                totalMapped: 0,
                averageConfidence: 0,
                pendingQueue: 0
            };

            this.init();
        }

        // ───────────────────────────────────────────────────────────────────
        // INITIALIZATION
        // ───────────────────────────────────────────────────────────────────

        async init() {
            console.log('🗺️ [Layer 152] Intelligent Section Mapping System - Initializing...');

            try {
                await this.loadConfiguration();
                this.initializeSections();
                this.startMappingEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 152] Intelligent Section Mapping System - Active');
                this.logMapping('SYSTEM', 'Section mapper initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 152] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer152-section-mapping.json');
                if (response.ok) {
                    this.config = await response.json();
                    console.log('📋 [Layer 152] Configuration loaded');
                } else {
                    this.config = this.getDefaultConfig();
                    console.log('📋 [Layer 152] Using default configuration');
                }
            } catch (error) {
                this.config = this.getDefaultConfig();
                console.log('📋 [Layer 152] Using default configuration (fetch failed)');
            }
        }

        getDefaultConfig() {
            return {
                sections: CONFIG.sections,
                keywords: CONFIG.keywords,
                thresholds: CONFIG.thresholds,
                enabled: true,
                autoAssign: true
            };
        }

        initializeSections() {
            console.log('📂 [Layer 152] Initializing sections...');

            // Initialize all section categories
            Object.values(CONFIG.sections).flat().forEach(section => {
                this.sectionArticles.set(section, []);
            });

            console.log(`✅ [Layer 152] Initialized ${this.sectionArticles.size} sections`);
        }

        // ───────────────────────────────────────────────────────────────────
        // ARTICLE MAPPING
        // ───────────────────────────────────────────────────────────────────

        mapArticle(article) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 152] Invalid article provided');
                return null;
            }

            try {
                // Perform semantic analysis
                const analysis = this.analyzeArticle(article);

                // Determine sections
                const sections = this.determineSections(analysis);

                // Extract tags
                const tags = this.extractTags(analysis);

                // Determine collections
                const collections = this.determineCollections(analysis);

                // Create mapping result
                const mapping = {
                    articleId: article.id,
                    sections: sections,
                    tags: tags,
                    collections: collections,
                    confidence: analysis.averageConfidence,
                    timestamp: new Date().toISOString()
                };

                // Store mapping
                this.mappedArticles.set(article.id, mapping);

                // Update section indices
                sections.forEach(section => {
                    const articles = this.sectionArticles.get(section.name) || [];
                    if (!articles.includes(article.id)) {
                        articles.push(article.id);
                        this.sectionArticles.set(section.name, articles);
                    }
                });

                this.stats.totalMapped++;
                this.updateAverageConfidence(analysis.averageConfidence);

                this.logMapping('MAP', `Article "${article.title}" mapped to ${sections.length} sections`);
                console.log(`✅ [Layer 152] Article "${article.title}" mapped successfully`);

                // Dispatch mapping complete event
                document.dispatchEvent(new CustomEvent('article:mapped', {
                    detail: { article, mapping }
                }));

                return mapping;

            } catch (error) {
                console.error(`❌ [Layer 152] Mapping failed for article ${article.id}:`, error);
                return null;
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // SEMANTIC ANALYSIS
        // ───────────────────────────────────────────────────────────────────

        analyzeArticle(article) {
            const text = this.extractText(article);
            const words = this.tokenize(text);
            const analysis = {
                matches: new Map(),
                confidence: new Map(),
                averageConfidence: 0
            };

            // Analyze against keywords
            Object.entries(CONFIG.keywords).forEach(([category, keywords]) => {
                const matchCount = this.countMatches(words, keywords);
                const confidence = matchCount / words.length;

                if (confidence >= CONFIG.thresholds.minimumConfidence) {
                    analysis.matches.set(category, matchCount);
                    analysis.confidence.set(category, confidence);
                }
            });

            // Calculate average confidence
            if (analysis.confidence.size > 0) {
                const confidenceValues = Array.from(analysis.confidence.values());
                analysis.averageConfidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;
            }

            return analysis;
        }

        extractText(article) {
            const parts = [
                article.title || '',
                article.excerpt || '',
                article.summary || '',
                article.content || '',
                (article.tags || []).join(' '),
                (article.keywords || []).join(' ')
            ];

            return parts.join(' ').toLowerCase();
        }

        tokenize(text) {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2);
        }

        countMatches(words, keywords) {
            return words.filter(word =>
                keywords.some(keyword =>
                    word.includes(keyword.toLowerCase()) ||
                    keyword.toLowerCase().includes(word)
                )
            ).length;
        }

        // ───────────────────────────────────────────────────────────────────
        // SECTION DETERMINATION
        // ───────────────────────────────────────────────────────────────────

        determineSections(analysis) {
            const sections = [];

            analysis.confidence.forEach((confidence, category) => {
                if (confidence >= CONFIG.thresholds.autoAssignConfidence) {
                    sections.push({
                        name: category,
                        confidence: confidence,
                        auto: true
                    });
                } else if (confidence >= CONFIG.thresholds.recommendationConfidence) {
                    sections.push({
                        name: category,
                        confidence: confidence,
                        auto: false,
                        recommended: true
                    });
                }
            });

            return sections.sort((a, b) => b.confidence - a.confidence);
        }

        extractTags(analysis) {
            const tags = [];

            analysis.matches.forEach((count, category) => {
                const confidence = analysis.confidence.get(category);
                if (confidence >= CONFIG.thresholds.minimumConfidence) {
                    tags.push({
                        tag: category,
                        relevance: confidence,
                        matchCount: count
                    });
                }
            });

            return tags.sort((a, b) => b.relevance - a.relevance);
        }

        determineCollections(analysis) {
            const collections = [];

            // Check for special collections
            if (analysis.confidence.has('breaking') &&
                analysis.confidence.get('breaking') > CONFIG.thresholds.recommendationConfidence) {
                collections.push('breaking-news');
            }

            if (analysis.confidence.has('trending') &&
                analysis.confidence.get('trending') > CONFIG.thresholds.recommendationConfidence) {
                collections.push('trending');
            }

            if (analysis.confidence.has('analysis') &&
                analysis.confidence.get('analysis') > CONFIG.thresholds.recommendationConfidence) {
                collections.push('in-depth-analysis');
            }

            return collections;
        }

        // ───────────────────────────────────────────────────────────────────
        // MAPPING ENGINE
        // ───────────────────────────────────────────────────────────────────

        startMappingEngine() {
            console.log('🚀 [Layer 152] Starting mapping engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.processingCheck);

            // Listen for new article events
            document.addEventListener('article:created', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForMapping(event.detail.article);
                }
            });

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForMapping(event.detail.article);
                }
            });
        }

        queueForMapping(article) {
            if (!this.processingQueue.find(a => a.id === article.id)) {
                this.processingQueue.push(article);
                this.stats.pendingQueue = this.processingQueue.length;
                console.log(`📥 [Layer 152] Article "${article.title}" queued for mapping`);
            }
        }

        processQueue() {
            if (this.processingQueue.length === 0) return;

            const article = this.processingQueue.shift();
            if (article) {
                this.mapArticle(article);
                this.stats.pendingQueue = this.processingQueue.length;
            }
        }

        checkForNewArticles() {
            // Check if distributor has new articles
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;

                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.mappedArticles.has(article.id)) {
                            this.queueForMapping(article);
                        }
                    });
                }
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // ANALYTICS
        // ───────────────────────────────────────────────────────────────────

        startAnalytics() {
            console.log('📊 [Layer 152] Starting analytics tracking...');

            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();

            if (window.SPORTIQ) {
                window.SPORTIQ.mappingStats = this.stats;
            }

            this.updateDashboard();
        }

        updateAverageConfidence(newConfidence) {
            const total = this.stats.averageConfidence * (this.stats.totalMapped - 1) + newConfidence;
            this.stats.averageConfidence = total / this.stats.totalMapped;
        }

        // ───────────────────────────────────────────────────────────────────
        // DASHBOARD UI
        // ───────────────────────────────────────────────────────────────────

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer152-dashboard';
            dashboard.className = 'layer152-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer152-dashboard-header">
                    <h3>🗺️ Section Mapper</h3>
                    <button class="layer152-close-btn">×</button>
                </div>
                <div class="layer152-dashboard-content">
                    <div class="layer152-stat">
                        <span class="layer152-stat-label">Total Mapped:</span>
                        <span class="layer152-stat-value" id="layer152-total">0</span>
                    </div>
                    <div class="layer152-stat">
                        <span class="layer152-stat-label">Avg Confidence:</span>
                        <span class="layer152-stat-value" id="layer152-confidence">0%</span>
                    </div>
                    <div class="layer152-stat">
                        <span class="layer152-stat-label">Pending Queue:</span>
                        <span class="layer152-stat-value" id="layer152-queue">0</span>
                    </div>
                    <div class="layer152-log" id="layer152-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer152-toggle-btn';
            toggleBtn.innerHTML = '🗺️';
            toggleBtn.title = 'Toggle Section Mapper Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer152-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer152-total');
            const confidenceEl = document.getElementById('layer152-confidence');
            const queueEl = document.getElementById('layer152-queue');

            if (totalEl) totalEl.textContent = this.stats.totalMapped;
            if (confidenceEl) confidenceEl.textContent = `${(this.stats.averageConfidence * 100).toFixed(1)}%`;
            if (queueEl) queueEl.textContent = this.stats.pendingQueue;

            const logEl = document.getElementById('layer152-log');
            if (logEl && this.mappingLog.length > 0) {
                const recentLogs = this.mappingLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer152-log-entry">
                        <span class="layer152-log-type">${log.type}</span>
                        <span class="layer152-log-message">${log.message}</span>
                        <span class="layer152-log-time">${this.getTimeAgo(log.timestamp)}</span>
                    </div>
                `).join('');
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // UTILITY FUNCTIONS
        // ───────────────────────────────────────────────────────────────────

        logMapping(type, message) {
            this.mappingLog.push({
                type,
                message,
                timestamp: new Date().toISOString()
            });

            if (this.mappingLog.length > 100) {
                this.mappingLog.shift();
            }
        }

        getTimeAgo(timestamp) {
            if (!timestamp) return 'Just now';
            const now = new Date();
            const then = new Date(timestamp);
            const seconds = Math.floor((now - then) / 1000);
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
        }

        // ───────────────────────────────────────────────────────────────────
        // PUBLIC API
        // ───────────────────────────────────────────────────────────────────

        getMapping(articleId) {
            return this.mappedArticles.get(articleId);
        }

        getSectionArticles(section) {
            return this.sectionArticles.get(section) || [];
        }

        getStats() {
            return { ...this.stats };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION & GLOBAL EXPOSURE
    // ═══════════════════════════════════════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSectionMapper);
    } else {
        initSectionMapper();
    }

    function initSectionMapper() {
        const mapper = new IntelligentSectionMapper();

        window.Layer152_SectionMapper = mapper;

        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }
        window.SPORTIQ.sectionMapper = mapper;

        document.dispatchEvent(new CustomEvent('layer152:ready', {
            detail: { mapper }
        }));

        console.log('🎯 [Layer 152] Intelligent Section Mapping System - Ready');
    }

})();
