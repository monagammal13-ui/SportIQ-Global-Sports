/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 169 – HISTORICAL CONTEXT & ARCHIVE LINKER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically link current stories to historical archives and prior coverage.
 * 
 * @version 1.0.0
 * @layer 169
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 169,
        name: 'Historical Context & Archive Linker',

        archiveSearchDepth: 365, // days
        minRelevanceScore: 0.6,

        intervals: {
            linkingCheck: 10000,
            analyticsUpdate: 60000
        }
    };

    class HistoricalContextLinker {
        constructor() {
            this.archive = new Map();
            this.contextLinks = new Map();
            this.linkingLog = [];
            this.config = null;
            this.stats = {
                totalArticlesProcessed: 0,
                contextLinksCreated: 0,
                archiveReferences: 0,
                timelineConnections: 0
            };

            this.init();
        }

        async init() {
            console.log('🏛️ [Layer 169] Historical Context Linker - Initializing...');

            try {
                await this.loadConfiguration();
                await this.loadArchive();
                this.startContextLinking();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 169] Historical Context Linker - Active');
                this.logLinking('SYSTEM', 'Historical context linker initialized');

            } catch (error) {
                console.error('❌ [Layer 169] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer169-historical-context.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        async loadArchive() {
            // Load existing articles into archive
            try {
                const response = await fetch('../api-json/article-archive.json');
                if (response.ok) {
                    const archiveData = await response.json();
                    if (archiveData.articles) {
                        archiveData.articles.forEach(article => {
                            this.archive.set(article.id, {
                                ...article,
                                archivedAt: article.publishedAt || new Date().toISOString()
                            });
                        });
                    }
                }
                console.log(`📚 [Layer 169] Loaded ${this.archive.size} archived articles`);
            } catch (error) {
                console.warn('⚠️ [Layer 169] Archive load failed, starting with empty archive', error);
            }
        }

        linkHistoricalContext(article) {
            if (!article || !article.id) return null;

            try {
                const contextData = {
                    articleId: article.id,
                    relatedArchive: [],
                    timeline: [],
                    background: [],
                    priorCoverage: [],
                    createdAt: new Date().toISOString()
                };

                // Find related archived articles
                contextData.relatedArchive = this.findRelatedArchive(article);

                // Build timeline from related articles
                contextData.timeline = this.buildTimeline(article, contextData.relatedArchive);

                // Extract background context
                contextData.background = this.extractBackground(article, contextData.relatedArchive);

                // Identify prior coverage
                contextData.priorCoverage = this.identifyPriorCoverage(article, contextData.relatedArchive);

                // Apply context to article
                this.applyContext(article, contextData);

                // Store context links
                this.contextLinks.set(article.id, contextData);

                this.stats.totalArticlesProcessed++;
                this.stats.contextLinksCreated += contextData.relatedArchive.length;
                this.stats.archiveReferences += contextData.priorCoverage.length;
                this.stats.timelineConnections += contextData.timeline.length;

                this.logLinking('LINK', `Article "${article.title}" - ${contextData.relatedArchive.length} archive links`);

                document.dispatchEvent(new CustomEvent('article:contextLinked', {
                    detail: { article, contextData }
                }));

                return contextData;

            } catch (error) {
                console.error(`❌ [Layer 169] Context linking failed for article:`, error);
                return null;
            }
        }

        findRelatedArchive(article) {
            const related = [];
            const articleKeywords = this.extractKeywords(article);
            const articleDate = new Date(article.publishedAt || Date.now());
            const searchDepthMs = CONFIG.archiveSearchDepth * 24 * 60 * 60 * 1000;

            this.archive.forEach((archivedArticle, id) => {
                // Skip self
                if (id === article.id) return;

                // Check if within search depth
                const archiveDate = new Date(archivedArticle.archivedAt);
                const timeDiff = articleDate - archiveDate;

                if (timeDiff < 0 || timeDiff > searchDepthMs) return;

                // Calculate relevance score
                const relevanceScore = this.calculateRelevance(article, archivedArticle, articleKeywords);

                if (relevanceScore >= CONFIG.minRelevanceScore) {
                    related.push({
                        article: archivedArticle,
                        relevanceScore: relevanceScore,
                        timeDelta: timeDiff,
                        relationship: this.determineRelationship(article, archivedArticle)
                    });
                }
            });

            // Sort by relevance and recency
            related.sort((a, b) => {
                const relevanceDiff = b.relevanceScore - a.relevanceScore;
                if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
                return a.timeDelta - b.timeDelta; // More recent first
            });

            return related.slice(0, 10); // Limit to top 10
        }

        extractKeywords(article) {
            const text = `${article.title || ''} ${article.content || ''}`.toLowerCase();
            const words = text.match(/\b[a-z]{4,}\b/g) || [];

            // Count word frequency
            const frequency = {};
            words.forEach(word => {
                frequency[word] = (frequency[word] || 0) + 1;
            });

            // Get top keywords
            return Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([word]) => word);
        }

        calculateRelevance(article1, article2, keywords1) {
            const keywords2 = this.extractKeywords(article2);

            // Calculate keyword overlap
            const overlap = keywords1.filter(kw => keywords2.includes(kw)).length;
            const keywordScore = overlap / Math.max(keywords1.length, keywords2.length);

            // Check title similarity
            const title1 = (article1.title || '').toLowerCase();
            const title2 = (article2.title || '').toLowerCase();
            const titleWords1 = title1.split(/\s+/);
            const titleWords2 = title2.split(/\s+/);
            const titleOverlap = titleWords1.filter(word => titleWords2.includes(word)).length;
            const titleScore = titleOverlap / Math.max(titleWords1.length, titleWords2.length);

            // Check category match
            const categoryScore = (article1.category === article2.category) ? 0.3 : 0;

            // Weighted combination
            return (keywordScore * 0.5) + (titleScore * 0.3) + categoryScore;
        }

        determineRelationship(current, archived) {
            const timeDiff = new Date(current.publishedAt || Date.now()) - new Date(archived.archivedAt);
            const daysDiff = timeDiff / (24 * 60 * 60 * 1000);

            if (daysDiff < 7) return 'recent_development';
            if (daysDiff < 30) return 'ongoing_story';
            if (daysDiff < 90) return 'related_coverage';
            return 'background_context';
        }

        buildTimeline(article, relatedArchive) {
            const timeline = [];

            // Add related articles to timeline
            relatedArchive.forEach(item => {
                timeline.push({
                    date: item.article.archivedAt,
                    title: item.article.title,
                    articleId: item.article.id,
                    relationship: item.relationship
                });
            });

            // Sort by date
            timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

            return timeline;
        }

        extractBackground(article, relatedArchive) {
            const background = [];

            // Find background-type articles
            relatedArchive.forEach(item => {
                if (item.relationship === 'background_context') {
                    background.push({
                        title: item.article.title,
                        id: item.article.id,
                        date: item.article.archivedAt,
                        summary: (item.article.summary || item.article.content || '').substring(0, 200) + '...'
                    });
                }
            });

            return background.slice(0, 5);
        }

        identifyPriorCoverage(article, relatedArchive) {
            const coverage = [];

            relatedArchive.forEach(item => {
                if (item.relationship === 'recent_development' || item.relationship === 'ongoing_story') {
                    coverage.push({
                        title: item.article.title,
                        id: item.article.id,
                        date: item.article.archivedAt,
                        relevance: item.relevanceScore
                    });
                }
            });

            return coverage;
        }

        applyContext(article, contextData) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            // Add context panel
            const contextPanel = this.createContextPanel(contextData);
            articleElement.appendChild(contextPanel);

            // Add timeline if available
            if (contextData.timeline.length > 0) {
                const timelineEl = this.createTimelineElement(contextData.timeline);
                articleElement.appendChild(timelineEl);
            }

            // Mark article as having context
            articleElement.setAttribute('data-has-context', 'true');
            articleElement.classList.add('context-enhanced');
        }

        createContextPanel(contextData) {
            const panel = document.createElement('div');
            panel.className = 'historical-context-panel';
            panel.innerHTML = `
                <div class="context-header">
                    <h3>🏛️ Historical Context</h3>
                </div>
                <div class="context-content">
                    ${contextData.background.length > 0 ? `
                        <div class="context-section">
                            <h4>Background</h4>
                            <ul>
                                ${contextData.background.map(bg => `
                                    <li>
                                        <a href="#article-${bg.id}">${bg.title}</a>
                                        <span class="context-date">${new Date(bg.date).toLocaleDateString()}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${contextData.priorCoverage.length > 0 ? `
                        <div class="context-section">
                            <h4>Prior Coverage</h4>
                            <ul>
                                ${contextData.priorCoverage.map(pc => `
                                    <li>
                                        <a href="#article-${pc.id}">${pc.title}</a>
                                        <span class="context-date">${new Date(pc.date).toLocaleDateString()}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${contextData.relatedArchive.length > 0 ? `
                        <div class="context-section">
                            <h4>Related Articles (${contextData.relatedArchive.length})</h4>
                        </div>
                    ` : ''}
                </div>
            `;

            return panel;
        }

        createTimelineElement(timeline) {
            const container = document.createElement('div');
            container.className = 'historical-timeline';
            container.innerHTML = `
                <h3>Story Timeline</h3>
                <div class="timeline-container">
                    ${timeline.map(event => `
                        <div data-relationship="${event.relationship}">
                            <div class="timeline-date">${new Date(event.date).toLocaleDateString()}</div>
                            <div class="timeline-title">
                                <a href="#article-${event.articleId}">${event.title}</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            return container;
        }

        startContextLinking() {
            console.log('🚀 [Layer 169] Starting historical context linking...');

            setInterval(() => {
                this.processNewArticles();
            }, CONFIG.intervals.linkingCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.linkHistoricalContext(event.detail.article);
                    // Add to archive
                    this.archive.set(event.detail.article.id, {
                        ...event.detail.article,
                        archivedAt: new Date().toISOString()
                    });
                }
            });
        }

        processNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.contextLinks.has(article.id)) {
                            this.linkHistoricalContext(article);
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
                window.SPORTIQ.historicalContextStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer169-dashboard';
            dashboard.className = 'layer169-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer169-dashboard-header">
                    <h3>🏛️ Historical Context</h3>
                    <button class="layer169-close-btn">×</button>
                </div>
                <div class="layer169-dashboard-content">
                    <div class="layer169-stat">
                        <span class="layer169-stat-label">Processed:</span>
                        <span class="layer169-stat-value" id="layer169-processed">0</span>
                    </div>
                    <div class="layer169-stat">
                        <span class="layer169-stat-label">Context Links:</span>
                        <span class="layer169-stat-value" id="layer169-links">0</span>
                    </div>
                    <div class="layer169-stat">
                        <span class="layer169-stat-label">Archive Size:</span>
                        <span class="layer169-stat-value" id="layer169-archive">0</span>
                    </div>
                    <div class="layer169-log" id="layer169-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer169-toggle-btn';
            toggleBtn.innerHTML = '🏛️';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer169-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const processedEl = document.getElementById('layer169-processed');
            const linksEl = document.getElementById('layer169-links');
            const archiveEl = document.getElementById('layer169-archive');

            if (processedEl) processedEl.textContent = this.stats.totalArticlesProcessed;
            if (linksEl) linksEl.textContent = this.stats.contextLinksCreated;
            if (archiveEl) archiveEl.textContent = this.archive.size;

            const logEl = document.getElementById('layer169-log');
            if (logEl && this.linkingLog.length > 0) {
                const recentLogs = this.linkingLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer169-log-entry">
                        <span class="layer169-log-type">${log.type}</span>
                        <span class="layer169-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logLinking(type, message) {
            this.linkingLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.linkingLog.length > 100) this.linkingLog.shift();
        }

        getContext(articleId) {
            return this.contextLinks.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHistoricalContext);
    } else {
        initHistoricalContext();
    }

    function initHistoricalContext() {
        const linker = new HistoricalContextLinker();
        window.Layer169_HistoricalContext = linker;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.historicalContext = linker;
        document.dispatchEvent(new CustomEvent('layer169:ready', { detail: { linker } }));
        console.log('🎯 [Layer 169] Historical Context Linker - Ready');
    }

})();
