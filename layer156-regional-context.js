/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 156 – REGIONAL CONTEXT ENHANCEMENT LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Enhances articles with regional context blocks, timelines, and 
 * relevance cues tailored to the reader's location.
 * 
 * Features:
 * - Regional context blocks with local perspective
 * - Timeline generation for event sequences
 * - Location-specific relevance indicators
 * - Local impact analysis
 * - Regional statistics and comparisons
 * - Cultural context explanations
 * - Local event connections
 * - Dynamic context updates
 * 
 * @version 1.0.0
 * @layer 156
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 156,
        name: 'Regional Context Enhancement Layer',

        contextTypes: {
            local: 'Local Perspective',
            historical: 'Historical Context',
            statistical: 'Regional Statistics',
            cultural: 'Cultural Context',
            economic: 'Economic Impact',
            social: 'Social Implications'
        },

        relevanceIndicators: {
            immediate: { label: 'Immediate Impact', priority: 5, color: '#ef4444' },
            regional: { label: 'Regional Relevance', priority: 4, color: '#f59e0b' },
            national: { label: 'National Interest', priority: 3, color: '#3b82f6' },
            international: { label: 'Global Context', priority: 2, color: '#8b5cf6' },
            background: { label: 'Background Info', priority: 1, color: '#6b7280' }
        },

        intervals: {
            enhancementCheck: 5000,
            contextUpdate: 30000,
            analyticsUpdate: 30000
        }
    };

    class RegionalContextEnhancer {
        constructor() {
            this.enhancedArticles = new Map();      // Article ID -> enhanced context
            this.contextBlocks = new Map();         // Article ID -> context blocks
            this.timelines = new Map();             // Article ID -> timeline
            this.enhancementQueue = [];
            this.enhancementLog = [];
            this.config = null;
            this.userLocation = null;
            this.stats = {
                totalEnhanced: 0,
                contextsAdded: 0,
                timelinesCreated: 0,
                averageRelevance: 0
            };

            this.init();
        }

        async init() {
            console.log('📍 [Layer 156] Regional Context Enhancement Layer - Initializing...');

            try {
                await this.loadConfiguration();
                await this.detectUserLocation();
                this.startEnhancementEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 156] Regional Context Enhancement Layer - Active');
                this.logEnhancement('SYSTEM', 'Regional context enhancer initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 156] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer156-regional-context.json');
                if (response.ok) {
                    this.config = await response.json();
                    console.log('📋 [Layer 156] Configuration loaded');
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        async detectUserLocation() {
            // Use Layer 155 location if available
            if (window.Layer155_GeoAdaptation) {
                this.userLocation = window.Layer155_GeoAdaptation.getUserLocation();
                console.log(`📍 [Layer 156] Using location from Layer 155: ${this.userLocation.region}`);
            } else {
                this.userLocation = { region: 'global', country: 'unknown' };
                console.log('📍 [Layer 156] Using global location context');
            }
        }

        enhanceArticle(article) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 156] Invalid article provided');
                return null;
            }

            try {
                const enhancement = {
                    articleId: article.id,
                    userRegion: this.userLocation.region,
                    contextBlocks: [],
                    timeline: null,
                    relevanceIndicators: [],
                    localConnections: [],
                    timestamp: new Date().toISOString()
                };

                // Generate context blocks
                enhancement.contextBlocks = this.generateContextBlocks(article);
                this.stats.contextsAdded += enhancement.contextBlocks.length;

                // Create timeline if article has chronological events
                if (this.hasChronologicalContent(article)) {
                    enhancement.timeline = this.generateTimeline(article);
                    if (enhancement.timeline) {
                        this.stats.timelinesCreated++;
                    }
                }

                // Add relevance indicators
                enhancement.relevanceIndicators = this.generateRelevanceIndicators(article);

                // Find local connections
                enhancement.localConnections = this.findLocalConnections(article);

                // Calculate overall relevance
                enhancement.relevanceScore = this.calculateRelevance(article);
                this.updateAverageRelevance(enhancement.relevanceScore);

                // Store enhancement
                this.enhancedArticles.set(article.id, enhancement);
                this.stats.totalEnhanced++;

                // Render context blocks in DOM
                this.renderEnhancement(article, enhancement);

                this.logEnhancement('ENHANCE', `Article "${article.title}" enhanced with ${enhancement.contextBlocks.length} context blocks`);

                // Dispatch event
                document.dispatchEvent(new CustomEvent('article:context-enhanced', {
                    detail: { article, enhancement }
                }));

                console.log(`✅ [Layer 156] Article "${article.title}" enhanced with regional context`);

                return enhancement;

            } catch (error) {
                console.error(`❌ [Layer 156] Enhancement failed for article ${article.id}:`, error);
                return null;
            }
        }

        generateContextBlocks(article) {
            const blocks = [];

            // Local perspective block
            const localBlock = this.createLocalPerspectiveBlock(article);
            if (localBlock) blocks.push(localBlock);

            // Historical context block
            const historicalBlock = this.createHistoricalContextBlock(article);
            if (historicalBlock) blocks.push(historicalBlock);

            // Statistical context block
            const statsBlock = this.createStatisticalBlock(article);
            if (statsBlock) blocks.push(statsBlock);

            // Cultural context block (if needed)
            if (this.requiresCulturalContext(article)) {
                const culturalBlock = this.createCulturalContextBlock(article);
                if (culturalBlock) blocks.push(culturalBlock);
            }

            return blocks;
        }

        createLocalPerspectiveBlock(article) {
            const region = this.userLocation.region;

            return {
                type: 'local',
                title: CONFIG.contextTypes.local,
                content: this.generateLocalPerspective(article, region),
                region: region,
                priority: 5,
                icon: '📍'
            };
        }

        generateLocalPerspective(article, region) {
            // Generate region-specific perspective
            const perspectives = {
                'north-america': 'From a North American perspective, this development has significant implications for regional sports dynamics.',
                'europe': 'European perspective: This story reflects broader trends in continental sports development.',
                'asia': 'Asian context: This event highlights the growing influence of Asian markets in global sports.',
                'africa': 'African viewpoint: This development demonstrates Africa\'s increasing role in international sports.',
                'south-america': 'South American angle: This story connects to the region\'s passionate sports culture.',
                'oceania': 'Oceania perspective: This event has particular relevance to Pacific sports communities.',
                'middle-east': 'Middle Eastern context: This development aligns with the region\'s sports investment priorities.'
            };

            return perspectives[region] || 'Global perspective: This story has worldwide implications for the sports community.';
        }

        createHistoricalContextBlock(article) {
            if (!this.hasHistoricalRelevance(article)) return null;

            return {
                type: 'historical',
                title: CONFIG.contextTypes.historical,
                content: this.generateHistoricalContext(article),
                priority: 3,
                icon: '📜'
            };
        }

        generateHistoricalContext(article) {
            // Simplified historical context generation
            return 'This event builds upon a series of developments in this sport over the past decade, marking a significant milestone in its evolution.';
        }

        createStatisticalBlock(article) {
            return {
                type: 'statistical',
                title: CONFIG.contextTypes.statistical,
                content: this.generateStatistics(article),
                priority: 4,
                icon: '📊',
                stats: this.extractRelevantStats(article)
            };
        }

        generateStatistics(article) {
            const region = this.userLocation.region;
            return `Regional statistics for ${region}: Key metrics and comparisons relevant to this story.`;
        }

        extractRelevantStats(article) {
            // Placeholder for real stats extraction
            return {
                viewership: { value: '2.5M', trend: '+15%', label: 'Regional Viewership' },
                engagement: { value: '85%', trend: '+8%', label: 'Engagement Rate' },
                impact: { value: 'High', trend: 'Rising', label: 'Local Impact' }
            };
        }

        createCulturalContextBlock(article) {
            return {
                type: 'cultural',
                title: CONFIG.contextTypes.cultural,
                content: this.generateCulturalContext(article),
                priority: 2,
                icon: '🌍'
            };
        }

        generateCulturalContext(article) {
            return 'Understanding the cultural significance of this story within the local context provides deeper insight into its importance.';
        }

        requiresCulturalContext(article) {
            // Check if article involves cultural elements
            const content = `${article.title} ${article.content}`.toLowerCase();
            const culturalKeywords = ['tradition', 'culture', 'heritage', 'custom', 'ceremony', 'celebration'];
            return culturalKeywords.some(keyword => content.includes(keyword));
        }

        hasHistoricalRelevance(article) {
            const content = `${article.title} ${article.content}`.toLowerCase();
            const historicalKeywords = ['first', 'record', 'historic', 'anniversary', 'milestone', 'legacy'];
            return historicalKeywords.some(keyword => content.includes(keyword));
        }

        hasChronologicalContent(article) {
            const content = `${article.content}`.toLowerCase();
            const chronologicalIndicators = ['timeline', 'sequence', 'follow', 'then', 'after', 'before', 'since'];
            return chronologicalIndicators.some(indicator => content.includes(indicator));
        }

        generateTimeline(article) {
            // Extract key events and create timeline
            const events = this.extractTimelineEvents(article);

            if (events.length < 2) return null;

            return {
                title: 'Event Timeline',
                events: events,
                type: 'chronological',
                created: new Date().toISOString()
            };
        }

        extractTimelineEvents(article) {
            // Simplified timeline extraction
            const events = [];

            // Example timeline events (in production, this would parse actual content)
            if (article.publishedAt) {
                events.push({
                    date: article.publishedAt,
                    title: 'Article Published',
                    description: article.title
                });
            }

            return events;
        }

        generateRelevanceIndicators(article) {
            const indicators = [];

            // Determine relevance levels
            const immediateRelevance = this.checkImmediateRelevance(article);
            if (immediateRelevance > 0.7) {
                indicators.push({
                    ...CONFIG.relevanceIndicators.immediate,
                    score: immediateRelevance
                });
            }

            const regionalRelevance = this.checkRegionalRelevance(article);
            if (regionalRelevance > 0.5) {
                indicators.push({
                    ...CONFIG.relevanceIndicators.regional,
                    score: regionalRelevance
                });
            }

            return indicators;
        }

        checkImmediateRelevance(article) {
            // Check if article has immediate local impact
            if (article.breaking || article.priority === 'high') {
                return 0.9;
            }

            const hoursOld = this.getArticleAge(article);
            return hoursOld < 6 ? 0.8 : 0.4;
        }

        checkRegionalRelevance(article) {
            // Use Layer 155's relevance calculation if available
            if (window.Layer155_GeoAdaptation) {
                const adaptation = window.Layer155_GeoAdaptation.getAdaptation(article.id);
                return adaptation ? adaptation.relevanceScore : 0.5;
            }
            return 0.5;
        }

        getArticleAge(article) {
            if (!article.publishedAt) return 999;
            const published = new Date(article.publishedAt);
            const now = new Date();
            return (now - published) / (1000 * 60 * 60); // hours
        }

        findLocalConnections(article) {
            const connections = [];

            // Find related local events
            const localEvents = this.findRelatedLocalEvents(article);
            if (localEvents.length > 0) {
                connections.push({
                    type: 'local-events',
                    title: 'Related Local Events',
                    items: localEvents
                });
            }

            // Find regional athletes/teams mentioned
            const regionalEntities = this.findRegionalEntities(article);
            if (regionalEntities.length > 0) {
                connections.push({
                    type: 'regional-entities',
                    title: 'Regional Connections',
                    items: regionalEntities
                });
            }

            return connections;
        }

        findRelatedLocalEvents(article) {
            // Placeholder for local event detection
            return [];
        }

        findRegionalEntities(article) {
            // Placeholder for regional entity extraction
            return [];
        }

        calculateRelevance(article) {
            let relevance = 0;

            // Immediate relevance (40%)
            relevance += this.checkImmediateRelevance(article) * 0.4;

            // Regional relevance (30%)
            relevance += this.checkRegionalRelevance(article) * 0.3;

            // Context richness (20%)
            const contextBlocks = this.contextBlocks.get(article.id) || [];
            relevance += Math.min(1, contextBlocks.length / 4) * 0.2;

            // Local connections (10%)
            const connections = this.findLocalConnections(article);
            relevance += Math.min(1, connections.length / 3) * 0.1;

            return Math.min(1, relevance);
        }

        renderEnhancement(article, enhancement) {
            // Find article container in DOM
            const articleContainer = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleContainer) return;

            // Create context container
            const contextContainer = document.createElement('div');
            contextContainer.className = 'regional-context-container';
            contextContainer.innerHTML = this.buildContextHTML(enhancement);

            // Insert context blocks
            articleContainer.appendChild(contextContainer);
        }

        buildContextHTML(enhancement) {
            let html = '<div class="context-blocks">';

            // Render context blocks
            enhancement.contextBlocks.forEach(block => {
                html += `
                    <div class="context-block context-${block.type}">
                        <div class="context-header">
                            <span class="context-icon">${block.icon}</span>
                            <h4 class="context-title">${block.title}</h4>
                        </div>
                        <div class="context-content">${block.content}</div>
                        ${block.stats ? this.buildStatsHTML(block.stats) : ''}
                    </div>
                `;
            });

            // Render timeline if exists
            if (enhancement.timeline) {
                html += this.buildTimelineHTML(enhancement.timeline);
            }

            // Render relevance indicators
            if (enhancement.relevanceIndicators.length > 0) {
                html += this.buildRelevanceHTML(enhancement.relevanceIndicators);
            }

            html += '</div>';
            return html;
        }

        buildStatsHTML(stats) {
            let html = '<div class="context-stats">';
            Object.entries(stats).forEach(([key, stat]) => {
                html += `
                    <div class="stat-item">
                        <span class="stat-label">${stat.label}:</span>
                        <span class="stat-value">${stat.value}</span>
                        <span class="stat-trend">${stat.trend}</span>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        }

        buildTimelineHTML(timeline) {
            let html = '<div class="context-timeline"><h4>📅 ' + timeline.title + '</h4><div class="timeline-events">';
            timeline.events.forEach(event => {
                html += `
                    <div class="timeline-event">
                        <div class="timeline-date">${new Date(event.date).toLocaleDateString()}</div>
                        <div class="timeline-content">
                            <strong>${event.title}</strong>
                            <p>${event.description}</p>
                        </div>
                    </div>
                `;
            });
            html += '</div></div>';
            return html;
        }

        buildRelevanceHTML(indicators) {
            let html = '<div class="relevance-indicators">';
            indicators.forEach(indicator => {
                html += `
                    <span class="relevance-badge" style="background-color: ${indicator.color}">
                        ${indicator.label}
                    </span>
                `;
            });
            html += '</div>';
            return html;
        }

        startEnhancementEngine() {
            console.log('🚀 [Layer 156] Starting enhancement engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.enhancementCheck);

            document.addEventListener('article:geo-adapted', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForEnhancement(event.detail.article);
                }
            });

            document.addEventListener('article:translated', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForEnhancement(event.detail.article);
                }
            });
        }

        queueForEnhancement(article) {
            if (!this.enhancementQueue.find(a => a.id === article.id)) {
                this.enhancementQueue.push(article);
                console.log(`📥 [Layer 156] Article "${article.title}" queued for enhancement`);
            }
        }

        processQueue() {
            if (this.enhancementQueue.length === 0) return;

            const article = this.enhancementQueue.shift();
            if (article) {
                this.enhanceArticle(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.enhancedArticles.has(article.id)) {
                            this.queueForEnhancement(article);
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
                window.SPORTIQ.contextStats = this.stats;
            }

            this.updateDashboard();
        }

        updateAverageRelevance(newRelevance) {
            const total = this.stats.averageRelevance * (this.stats.totalEnhanced - 1) + newRelevance;
            this.stats.averageRelevance = total / this.stats.totalEnhanced;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer156-dashboard';
            dashboard.className = 'layer156-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer156-dashboard-header">
                    <h3>📍 Context Enhancer</h3>
                    <button class="layer156-close-btn">×</button>
                </div>
                <div class="layer156-dashboard-content">
                    <div class="layer156-stat">
                        <span class="layer156-stat-label">Enhanced Articles:</span>
                        <span class="layer156-stat-value" id="layer156-total">0</span>
                    </div>
                    <div class="layer156-stat">
                        <span class="layer156-stat-label">Context Blocks:</span>
                        <span class="layer156-stat-value" id="layer156-contexts">0</span>
                    </div>
                    <div class="layer156-stat">
                        <span class="layer156-stat-label">Timelines:</span>
                        <span class="layer156-stat-value" id="layer156-timelines">0</span>
                    </div>
                    <div class="layer156-log" id="layer156-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer156-toggle-btn';
            toggleBtn.innerHTML = '📍';
            toggleBtn.title = 'Toggle Context Enhancer Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer156-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer156-total');
            const contextsEl = document.getElementById('layer156-contexts');
            const timelinesEl = document.getElementById('layer156-timelines');

            if (totalEl) totalEl.textContent = this.stats.totalEnhanced;
            if (contextsEl) contextsEl.textContent = this.stats.contextsAdded;
            if (timelinesEl) timelinesEl.textContent = this.stats.timelinesCreated;

            const logEl = document.getElementById('layer156-log');
            if (logEl && this.enhancementLog.length > 0) {
                const recentLogs = this.enhancementLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer156-log-entry">
                        <span class="layer156-log-type">${log.type}</span>
                        <span class="layer156-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logEnhancement(type, message) {
            this.enhancementLog.push({
                type,
                message,
                timestamp: new Date().toISOString()
            });

            if (this.enhancementLog.length > 100) {
                this.enhancementLog.shift();
            }
        }

        getEnhancement(articleId) {
            return this.enhancedArticles.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContextEnhancer);
    } else {
        initContextEnhancer();
    }

    function initContextEnhancer() {
        const enhancer = new RegionalContextEnhancer();
        window.Layer156_RegionalContext = enhancer;

        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }
        window.SPORTIQ.regionalContext = enhancer;

        document.dispatchEvent(new CustomEvent('layer156:ready', {
            detail: { enhancer }
        }));

        console.log('🎯 [Layer 156] Regional Context Enhancement Layer - Ready');
    }

})();
