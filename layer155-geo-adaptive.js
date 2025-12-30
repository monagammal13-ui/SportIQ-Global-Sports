/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 155 – GEO-ADAPTIVE NEWS PRESENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Adapts headlines, summaries, and ordering based on user geography 
 * without altering factual content.
 * 
 * Features:
 * - Geographic location detection
 * - Regional content prioritization
 * - Locale-specific headline adaptation
 * - Geographic relevance scoring
 * - Regional news ordering
 * - Time zone-aware publishing
 * - Local terminology adaptation
 * - Regional trending topics integration
 * 
 * @version 1.0.0
 * @layer 155
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 155,
        name: 'Geo-Adaptive News Presentation',

        regions: {
            'north-america': { priority: ['usa', 'canada', 'mexico'], timezone: 'America/New_York' },
            'south-america': { priority: ['brazil', 'argentina', 'colombia'], timezone: 'America/Sao_Paulo' },
            'europe': { priority: ['uk', 'germany', 'france', 'spain', 'italy'], timezone: 'Europe/London' },
            'africa': { priority: ['south-africa', 'nigeria', 'egypt'], timezone: 'Africa/Cairo' },
            'asia': { priority: ['china', 'japan', 'india', 'korea'], timezone: 'Asia/Tokyo' },
            'oceania': { priority: ['australia', 'new-zealand'], timezone: 'Australia/Sydney' },
            'middle-east': { priority: ['saudi-arabia', 'uae', 'qatar'], timezone: 'Asia/Dubai' }
        },

        adaptationRules: {
            enableGeoAdaptation: true,
            preserveFactualContent: true,
            adaptHeadlines: true,
            adaptSummaries: true,
            reorderByRelevance: true,
            useLocalTerminology: true,
            integrateLocalTrending: true
        },

        relevanceWeights: {
            geographicDistance: 0.4,
            localMentions: 0.3,
            userPreferences: 0.2,
            recency: 0.1
        },

        intervals: {
            adaptationCheck: 5000,
            locationUpdate: 60000,
            analyticsUpdate: 30000
        }
    };

    class GeoAdaptivePresentation {
        constructor() {
            this.userLocation = null;
            this.adaptedContent = new Map();      // Article ID -> geo-adaptations
            this.regionalPreferences = new Map(); // Region -> preferences
            this.adaptationLog = [];              // Adaptation history
            this.config = null;
            this.stats = {
                totalAdaptations: 0,
                activeRegions: 0,
                currentRegion: null,
                averageRelevance: 0
            };

            this.init();
        }

        async init() {
            console.log('🌐 [Layer 155] Geo-Adaptive News Presentation - Initializing...');

            try {
                await this.loadConfiguration();
                await this.detectUserLocation();
                this.initializeRegionalPreferences();
                this.startAdaptationEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 155] Geo-Adaptive News Presentation - Active');
                this.logAdaptation('SYSTEM', 'Geo-adaptation engine initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 155] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer155-geo-adaptive.json');
                if (response.ok) {
                    this.config = await response.json();
                    console.log('📋 [Layer 155] Configuration loaded');
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        async detectUserLocation() {
            try {
                // Try geolocation API first
                if ('geolocation' in navigator) {
                    const position = await this.getCurrentPosition();
                    this.userLocation = this.determineRegionFromCoords(position.coords);
                } else {
                    // Fallback to IP-based location
                    this.userLocation = await this.getLocationFromIP();
                }

                this.stats.currentRegion = this.userLocation?.region || 'global';
                console.log(`📍 [Layer 155] User location detected: ${this.stats.currentRegion}`);

                // Update location periodically
                setInterval(() => {
                    this.updateUserLocation();
                }, CONFIG.intervals.locationUpdate);

            } catch (error) {
                console.warn('⚠️ [Layer 155] Location detection failed, using global defaults');
                this.userLocation = { region: 'global', country: 'unknown', timezone: 'UTC' };
                this.stats.currentRegion = 'global';
            }
        }

        getCurrentPosition() {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    maximumAge: 300000
                });
            });
        }

        determineRegionFromCoords(coords) {
            // Simplified region determination based on coordinates
            const { latitude, longitude } = coords;

            if (latitude > 15 && latitude < 70 && longitude > -170 && longitude < -50) {
                return { region: 'north-america', latitude, longitude, timezone: 'America/New_York' };
            } else if (latitude > -55 && latitude < 15 && longitude > -85 && longitude < -35) {
                return { region: 'south-america', latitude, longitude, timezone: 'America/Sao_Paulo' };
            } else if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
                return { region: 'europe', latitude, longitude, timezone: 'Europe/London' };
            } else if (latitude > -35 && latitude < 37 && longitude > -20 && longitude < 55) {
                return { region: 'africa', latitude, longitude, timezone: 'Africa/Cairo' };
            } else if (latitude > -10 && latitude < 55 && longitude > 60 && longitude < 150) {
                return { region: 'asia', latitude, longitude, timezone: 'Asia/Tokyo' };
            } else if (latitude > -50 && latitude < -10 && longitude > 110 && longitude < 180) {
                return { region: 'oceania', latitude, longitude, timezone: 'Australia/Sydney' };
            } else if (latitude > 12 && latitude < 40 && longitude > 34 && longitude < 60) {
                return { region: 'middle-east', latitude, longitude, timezone: 'Asia/Dubai' };
            }

            return { region: 'global', latitude, longitude, timezone: 'UTC' };
        }

        async getLocationFromIP() {
            try {
                // Simulate IP-based location (in production, use a real service)
                return {
                    region: 'north-america',
                    country: 'usa',
                    timezone: 'America/New_York',
                    source: 'ip'
                };
            } catch (error) {
                return { region: 'global', country: 'unknown', timezone: 'UTC' };
            }
        }

        async updateUserLocation() {
            // Periodically update location if user has moved
            try {
                if ('geolocation' in navigator) {
                    const position = await this.getCurrentPosition();
                    const newLocation = this.determineRegionFromCoords(position.coords);

                    if (newLocation.region !== this.userLocation.region) {
                        console.log(`🔄 [Layer 155] Location updated: ${this.userLocation.region} → ${newLocation.region}`);
                        this.userLocation = newLocation;
                        this.stats.currentRegion = newLocation.region;

                        // Re-adapt content for new location
                        this.adaptAllContent();
                    }
                }
            } catch (error) {
                // Location update failed, continue with current location
            }
        }

        initializeRegionalPreferences() {
            console.log('🎯 [Layer 155] Initializing regional preferences...');

            Object.keys(CONFIG.regions).forEach(region => {
                this.regionalPreferences.set(region, {
                    preferredSports: this.getRegionalSports(region),
                    localTerminology: this.getLocalTerminology(region),
                    culturalPreferences: this.getCulturalPreferences(region)
                });
            });

            this.stats.activeRegions = this.regionalPreferences.size;
            console.log(`✅ [Layer 155] Initialized ${this.stats.activeRegions} regional profiles`);
        }

        getRegionalSports(region) {
            const sportsByRegion = {
                'north-america': ['basketball', 'baseball', 'american-football', 'hockey'],
                'south-america': ['football', 'volleyball', 'futsal'],
                'europe': ['football', 'rugby', 'cricket', 'tennis'],
                'africa': ['football', 'rugby', 'cricket'],
                'asia': ['cricket', 'badminton', 'table-tennis', 'martial-arts'],
                'oceania': ['rugby', 'cricket', 'australian-football'],
                'middle-east': ['football', 'cricket', 'camel-racing']
            };

            return sportsByRegion[region] || ['football'];
        }

        getLocalTerminology(region) {
            const terminology = {
                'north-america': { 'football': 'soccer', 'match': 'game' },
                'europe': { 'soccer': 'football' },
                'oceania': { 'football': 'soccer', 'rugby': 'footy' }
            };

            return terminology[region] || {};
        }

        getCulturalPreferences(region) {
            return {
                dateFormat: this.getDateFormat(region),
                timeFormat: this.getTimeFormat(region),
                numberFormat: this.getNumberFormat(region)
            };
        }

        getDateFormat(region) {
            const formats = {
                'north-america': 'MM/DD/YYYY',
                'europe': 'DD/MM/YYYY',
                'asia': 'YYYY/MM/DD'
            };
            return formats[region] || 'DD/MM/YYYY';
        }

        getTimeFormat(region) {
            const formats = {
                'north-america': '12h',
                'europe': '24h',
                'asia': '24h'
            };
            return formats[region] || '24h';
        }

        getNumberFormat(region) {
            const formats = {
                'north-america': { decimal: '.', thousands: ',' },
                'europe': { decimal: ',', thousands: '.' }
            };
            return formats[region] || { decimal: '.', thousands: ',' };
        }

        adaptArticle(article) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 155] Invalid article provided');
                return null;
            }

            if (!CONFIG.adaptationRules.enableGeoAdaptation) {
                return article;
            }

            try {
                const adaptation = {
                    articleId: article.id,
                    originalArticle: article,
                    region: this.userLocation.region,
                    adaptations: {},
                    relevanceScore: 0,
                    timestamp: new Date().toISOString()
                };

                // Calculate geographic relevance
                adaptation.relevanceScore = this.calculateRelevance(article);

                // Adapt headline
                if (CONFIG.adaptationRules.adaptHeadlines) {
                    adaptation.adaptations.headline = this.adaptHeadline(article);
                }

                // Adapt summary
                if (CONFIG.adaptationRules.adaptSummaries) {
                    adaptation.adaptations.summary = this.adaptSummary(article);
                }

                // Apply local terminology
                if (CONFIG.adaptationRules.useLocalTerminology) {
                    adaptation.adaptations.localizedContent = this.applyLocalTerminology(article);
                }

                // Add regional context
                adaptation.adaptations.regionalContext = this.addRegionalContext(article);

                // Adapt time display
                adaptation.adaptations.localTime = this.adaptTimeDisplay(article);

                // Store adaptation
                this.adaptedContent.set(article.id, adaptation);

                this.stats.totalAdaptations++;
                this.updateAverageRelevance(adaptation.relevanceScore);

                this.logAdaptation('ADAPT', `Article "${article.title}" adapted for ${this.userLocation.region} (Relevance: ${(adaptation.relevanceScore * 100).toFixed(1)}%)`);

                // Dispatch event
                document.dispatchEvent(new CustomEvent('article:geo-adapted', {
                    detail: { article, adaptation }
                }));

                console.log(`✅ [Layer 155] Article "${article.title}" adapted for ${this.userLocation.region}`);

                return adaptation;

            } catch (error) {
                console.error(`❌ [Layer 155] Adaptation failed for article ${article.id}:`, error);
                return null;
            }
        }

        calculateRelevance(article) {
            let relevance = 0;

            // Geographic distance factor
            if (article.location || article.region) {
                const geoScore = this.calculateGeographicRelevance(article);
                relevance += geoScore * CONFIG.relevanceWeights.geographicDistance;
            }

            // Local mentions factor
            const localMentions = this.countLocalMentions(article);
            relevance += localMentions * CONFIG.relevanceWeights.localMentions;

            // User preferences factor (based on preferred sports, topics)
            const prefScore = this.calculatePreferenceScore(article);
            relevance += prefScore * CONFIG.relevanceWeights.userPreferences;

            // Recency factor
            const recencyScore = this.calculateRecencyScore(article);
            relevance += recencyScore * CONFIG.relevanceWeights.recency;

            return Math.min(1.0, relevance);
        }

        calculateGeographicRelevance(article) {
            const articleRegion = article.region || article.location;

            if (!articleRegion) return 0.5; // Neutral if no region specified

            // Direct match
            if (articleRegion === this.userLocation.region) {
                return 1.0;
            }

            // Neighboring regions
            const neighboringRegions = this.getNeighboringRegions(this.userLocation.region);
            if (neighboringRegions.includes(articleRegion)) {
                return 0.7;
            }

            // Same continent/area
            if (this.isSameArea(articleRegion, this.userLocation.region)) {
                return 0.5;
            }

            // Global/international
            return 0.3;
        }

        getNeighboringRegions(region) {
            const neighbors = {
                'north-america': ['south-america'],
                'south-america': ['north-america'],
                'europe': ['africa', 'middle-east'],
                'africa': ['europe', 'middle-east'],
                'asia': ['middle-east', 'oceania'],
                'oceania': ['asia'],
                'middle-east': ['europe', 'africa', 'asia']
            };

            return neighbors[region] || [];
        }

        isSameArea(region1, region2) {
            // Simplified area grouping
            const areas = {
                americas: ['north-america', 'south-america'],
                eurasia: ['europe', 'asia', 'middle-east'],
                southern: ['africa', 'oceania']
            };

            for (const [area, regions] of Object.entries(areas)) {
                if (regions.includes(region1) && regions.includes(region2)) {
                    return true;
                }
            }

            return false;
        }

        countLocalMentions(article) {
            const content = `${article.title} ${article.excerpt} ${article.content}`.toLowerCase();
            const regionalInfo = CONFIG.regions[this.userLocation.region];

            if (!regionalInfo) return 0;

            let mentions = 0;
            regionalInfo.priority.forEach(country => {
                const regex = new RegExp(country, 'gi');
                const matches = content.match(regex) || [];
                mentions += matches.length;
            });

            // Normalize (0-1 scale)
            return Math.min(1.0, mentions / 5);
        }

        calculatePreferenceScore(article) {
            const regionalPrefs = this.regionalPreferences.get(this.userLocation.region);
            if (!regionalPrefs) return 0.5;

            // Check if article sport matches regional preferences
            const articleSport = article.category || article.sport;
            if (articleSport && regionalPrefs.preferredSports.includes(articleSport.toLowerCase())) {
                return 1.0;
            }

            return 0.5;
        }

        calculateRecencyScore(article) {
            const publishedDate = new Date(article.publishedAt || article.createdAt);
            const now = new Date();
            const hoursSincePublished = (now - publishedDate) / (1000 * 60 * 60);

            // More recent = higher score
            if (hoursSincePublished < 1) return 1.0;
            if (hoursSincePublished < 6) return 0.8;
            if (hoursSincePublished < 24) return 0.6;
            if (hoursSincePublished < 72) return 0.4;
            return 0.2;
        }

        adaptHeadline(article) {
            let headline = article.title;
            const terminology = this.regionalPreferences.get(this.userLocation.region)?.localTerminology;

            if (terminology) {
                Object.entries(terminology).forEach(([from, to]) => {
                    const regex = new RegExp(`\\b${from}\\b`, 'gi');
                    headline = headline.replace(regex, to);
                });
            }

            // Add regional context if highly relevant
            const relevance = this.calculateRelevance(article);
            if (relevance > 0.8 && article.location) {
                headline = `[Local] ${headline}`;
            }

            return headline;
        }

        adaptSummary(article) {
            let summary = article.excerpt || article.summary;
            const terminology = this.regionalPreferences.get(this.userLocation.region)?.localTerminology;

            if (terminology) {
                Object.entries(terminology).forEach(([from, to]) => {
                    const regex = new RegExp(`\\b${from}\\b`, 'gi');
                    summary = summary.replace(regex, to);
                });
            }

            return summary;
        }

        applyLocalTerminology(article) {
            // Apply regional terminology to full content
            let content = { ...article };
            const terminology = this.regionalPreferences.get(this.userLocation.region)?.localTerminology;

            if (terminology) {
                Object.entries(terminology).forEach(([from, to]) => {
                    const regex = new RegExp(`\\b${from}\\b`, 'gi');
                    if (content.content) {
                        content.content = content.content.replace(regex, to);
                    }
                });
            }

            return content;
        }

        addRegionalContext(article) {
            const context = {
                localRelevance: this.calculateRelevance(article),
                regionalTrending: this.isRegionallyTrending(article),
                localTime: this.convertToLocalTime(article.publishedAt),
                nearbyEvents: []
            };

            return context;
        }

        isRegionallyTrending(article) {
            // Check if article is trending in user's region
            // This would integrate with trending detection systems
            return article.trending && article.trendingRegions?.includes(this.userLocation.region);
        }

        convertToLocalTime(timestamp) {
            if (!timestamp) return null;

            const date = new Date(timestamp);
            const timezone = this.userLocation.timezone || 'UTC';

            try {
                return date.toLocaleString('en-US', { timeZone: timezone });
            } catch (error) {
                return date.toLocaleString();
            }
        }

        adaptTimeDisplay(article) {
            const localTime = this.convertToLocalTime(article.publishedAt);
            const timeAgo = this.getTimeAgo(article.publishedAt);

            return {
                localTime,
                timeAgo,
                timezone: this.userLocation.timezone
            };
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

        startAdaptationEngine() {
            console.log('🚀 [Layer 155] Starting geo-adaptation engine...');

            setInterval(() => {
                this.adaptAllContent();
            }, CONFIG.intervals.adaptationCheck);

            // Listen for new articles
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.adaptArticle(event.detail.article);
                }
            });

            document.addEventListener('article:translated', (event) => {
                if (event.detail && event.detail.article) {
                    this.adaptArticle(event.detail.article);
                }
            });
        }

        adaptAllContent() {
            // Re-adapt all content for current location
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;

                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        this.adaptArticle(article);
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
                window.SPORTIQ.geoAdaptationStats = this.stats;
            }

            this.updateDashboard();
        }

        updateAverageRelevance(newRelevance) {
            const total = this.stats.averageRelevance * (this.stats.totalAdaptations - 1) + newRelevance;
            this.stats.averageRelevance = total / this.stats.totalAdaptations;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer155-dashboard';
            dashboard.className = 'layer155-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer155-dashboard-header">
                    <h3>🌐 Geo-Adaptation</h3>
                    <button class="layer155-close-btn">×</button>
                </div>
                <div class="layer155-dashboard-content">
                    <div class="layer155-stat">
                        <span class="layer155-stat-label">Current Region:</span>
                        <span class="layer155-stat-value" id="layer155-region">Unknown</span>
                    </div>
                    <div class="layer155-stat">
                        <span class="layer155-stat-label">Total Adaptations:</span>
                        <span class="layer155-stat-value" id="layer155-total">0</span>
                    </div>
                    <div class="layer155-stat">
                        <span class="layer155-stat-label">Avg Relevance:</span>
                        <span class="layer155-stat-value" id="layer155-relevance">0%</span>
                    </div>
                    <div class="layer155-log" id="layer155-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer155-toggle-btn';
            toggleBtn.innerHTML = '🌐';
            toggleBtn.title = 'Toggle Geo-Adaptation Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer155-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const regionEl = document.getElementById('layer155-region');
            const totalEl = document.getElementById('layer155-total');
            const relevanceEl = document.getElementById('layer155-relevance');

            if (regionEl) regionEl.textContent = this.stats.currentRegion || 'Unknown';
            if (totalEl) totalEl.textContent = this.stats.totalAdaptations;
            if (relevanceEl) relevanceEl.textContent = `${(this.stats.averageRelevance * 100).toFixed(1)}%`;

            const logEl = document.getElementById('layer155-log');
            if (logEl && this.adaptationLog.length > 0) {
                const recentLogs = this.adaptationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer155-log-entry">
                        <span class="layer155-log-type">${log.type}</span>
                        <span class="layer155-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logAdaptation(type, message) {
            this.adaptationLog.push({
                type,
                message,
                timestamp: new Date().toISOString()
            });

            if (this.adaptationLog.length > 100) {
                this.adaptationLog.shift();
            }
        }

        getAdaptation(articleId) {
            return this.adaptedContent.get(articleId);
        }

        getUserLocation() {
            return { ...this.userLocation };
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGeoAdaptation);
    } else {
        initGeoAdaptation();
    }

    function initGeoAdaptation() {
        const engine = new GeoAdaptivePresentation();
        window.Layer155_GeoAdaptation = engine;

        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }
        window.SPORTIQ.geoAdaptation = engine;

        document.dispatchEvent(new CustomEvent('layer155:ready', {
            detail: { engine }
        }));

        console.log('🎯 [Layer 155] Geo-Adaptive News Presentation - Ready');
    }

})();
