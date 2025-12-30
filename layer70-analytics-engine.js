/**
 * Layer 70 - Core Analytics & Metrics Engine
 * Comprehensive tracking system for visits, clicks, time-on-page, and performance
 * Sport IQ Platform
 */

class AnalyticsEngine {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.sessionId = this.generateSessionId();
        this.pageLoadTime = Date.now();
        this.metrics = {
            visits: 0,
            clicks: [],
            scrollDepth: 0,
            timeOnPage: 0,
            events: [],
            performance: {}
        };
        this.trackingInterval = null;
        this.aggregationInterval = null;
        this.storageKey = 'sportiq_analytics';
        this.init();
    }

    async init() {
        console.log('📊 Layer 70: Core Analytics & Metrics Engine - STARTING');

        // Load configuration
        await this.loadConfig();

        // Load existing analytics data
        this.loadStoredData();

        // Record page visit
        this.trackPageVisit();

        // Initialize tracking systems
        this.initializeClickTracking();
        this.initializeScrollTracking();
        this.initializeTimeTracking();
        this.initializePerformanceTracking();
        this.initializeCustomEventTracking();

        // Start real-time aggregation
        this.startAggregation();

        // Setup auto-save
        this.setupAutoSave();

        this.isActive = true;
        console.log('✅ Layer 70: Core Analytics & Metrics Engine - ACTIVE');
        console.log(`📈 Session ID: ${this.sessionId}`);
    }

    async loadConfig() {
        try {
            const response = await fetch('../api-json/analytics-tracking-config.json');
            this.config = await response.json();
            console.log('✅ Analytics config loaded');
        } catch (error) {
            console.warn('⚠️ Using default analytics config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            tracking: {
                pageViews: true,
                clicks: true,
                scrollDepth: true,
                timeOnPage: true,
                customEvents: true,
                performance: true
            },
            aggregation: {
                interval: 5000, // 5 seconds
                batchSize: 10
            },
            storage: {
                maxEntries: 1000,
                retentionDays: 30
            },
            sources: ['organic', 'direct', 'referral', 'social', 'email'],
            excludeSelectors: ['.ad-slot', '.cookie-banner', '.analytics-dashboard']
        };
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ========== VISIT TRACKING ==========
    trackPageVisit() {
        if (!this.config.tracking.pageViews) return;

        const visit = {
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href,
            referrer: document.referrer || 'direct',
            source: this.determineSource(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        };

        this.metrics.visits++;
        this.metrics.events.push({
            type: 'page_visit',
            data: visit,
            timestamp: Date.now()
        });

        console.log('📄 Page visit tracked:', visit);
    }

    determineSource() {
        const referrer = document.referrer.toLowerCase();

        if (!referrer) return 'direct';

        if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) {
            return 'organic';
        }
        if (referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('instagram')) {
            return 'social';
        }
        if (referrer.includes('mail') || referrer.includes('email')) {
            return 'email';
        }

        return 'referral';
    }

    // ========== CLICK TRACKING ==========
    initializeClickTracking() {
        if (!this.config.tracking.clicks) return;

        document.addEventListener('click', (e) => {
            // Skip excluded elements
            if (this.shouldExcludeElement(e.target)) return;

            const clickData = {
                timestamp: Date.now(),
                sessionId: this.sessionId,
                element: this.getElementInfo(e.target),
                coordinates: {
                    x: e.clientX,
                    y: e.clientY,
                    pageX: e.pageX,
                    pageY: e.pageY
                },
                target: {
                    tagName: e.target.tagName,
                    id: e.target.id || null,
                    className: e.target.className || null,
                    text: e.target.textContent?.substring(0, 50) || null
                }
            };

            this.metrics.clicks.push(clickData);
            this.metrics.events.push({
                type: 'click',
                data: clickData,
                timestamp: Date.now()
            });

            console.log('🖱️ Click tracked:', clickData);
        }, { passive: true });

        console.log('✅ Click tracking initialized');
    }

    getElementInfo(element) {
        const selector = this.getElementSelector(element);
        return {
            selector: selector,
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            href: element.href || null,
            type: element.type || null
        };
    }

    getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c).slice(0, 2).join('.');
            return `.${classes}`;
        }
        return element.tagName.toLowerCase();
    }

    shouldExcludeElement(element) {
        return this.config.excludeSelectors.some(selector => {
            return element.closest(selector) !== null;
        });
    }

    // ========== SCROLL TRACKING ==========
    initializeScrollTracking() {
        if (!this.config.tracking.scrollDepth) return;

        let maxScrollDepth = 0;

        const trackScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);

            if (scrollPercentage > maxScrollDepth) {
                maxScrollDepth = scrollPercentage;
                this.metrics.scrollDepth = maxScrollDepth;

                // Track milestone scroll depths
                if ([25, 50, 75, 100].includes(maxScrollDepth)) {
                    this.metrics.events.push({
                        type: 'scroll_milestone',
                        data: { depth: maxScrollDepth },
                        timestamp: Date.now()
                    });
                    console.log(`📜 Scroll milestone: ${maxScrollDepth}%`);
                }
            }
        };

        window.addEventListener('scroll', trackScroll, { passive: true });
        console.log('✅ Scroll tracking initialized');
    }

    // ========== TIME ON PAGE TRACKING ==========
    initializeTimeTracking() {
        if (!this.config.tracking.timeOnPage) return;

        this.trackingInterval = setInterval(() => {
            this.metrics.timeOnPage = Math.floor((Date.now() - this.pageLoadTime) / 1000);
        }, 1000);

        // Track when user leaves
        window.addEventListener('beforeunload', () => {
            this.metrics.events.push({
                type: 'page_leave',
                data: { timeOnPage: this.metrics.timeOnPage },
                timestamp: Date.now()
            });
            this.saveData();
        });

        console.log('✅ Time tracking initialized');
    }

    // ========== PERFORMANCE TRACKING ==========
    initializePerformanceTracking() {
        if (!this.config.tracking.performance) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];

                if (perfData) {
                    this.metrics.performance = {
                        loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                        firstPaint: this.getFirstPaint(),
                        dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
                        tcp: Math.round(perfData.connectEnd - perfData.connectStart),
                        request: Math.round(perfData.responseStart - perfData.requestStart),
                        response: Math.round(perfData.responseEnd - perfData.responseStart)
                    };

                    this.metrics.events.push({
                        type: 'performance',
                        data: this.metrics.performance,
                        timestamp: Date.now()
                    });

                    console.log('⚡ Performance metrics:', this.metrics.performance);
                }
            }, 0);
        });

        console.log('✅ Performance tracking initialized');
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return firstPaint ? Math.round(firstPaint.startTime) : null;
    }

    // ========== CUSTOM EVENT TRACKING ==========
    initializeCustomEventTracking() {
        if (!this.config.tracking.customEvents) return;

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackCustomEvent('form_submit', {
                formId: e.target.id || 'unknown',
                action: e.target.action || null
            });
        }, { passive: true });

        // Track video interactions
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('play', () => {
                this.trackCustomEvent('video_play', { src: video.src });
            });
            video.addEventListener('pause', () => {
                this.trackCustomEvent('video_pause', { src: video.src });
            });
        });

        console.log('✅ Custom event tracking initialized');
    }

    trackCustomEvent(eventName, eventData = {}) {
        const event = {
            type: 'custom_event',
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        this.metrics.events.push(event);
        console.log(`🎯 Custom event: ${eventName}`, eventData);
    }

    // ========== REAL-TIME AGGREGATION ==========
    startAggregation() {
        const interval = this.config.aggregation.interval;

        this.aggregationInterval = setInterval(() => {
            const aggregated = this.aggregateMetrics();
            console.log('📊 Real-time aggregation:', aggregated);
        }, interval);

        console.log(`⏰ Real-time aggregation started (${interval / 1000}s interval)`);
    }

    aggregateMetrics() {
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);

        return {
            totalVisits: this.metrics.visits,
            totalClicks: this.metrics.clicks.length,
            recentClicks: this.metrics.clicks.filter(c => c.timestamp > hourAgo).length,
            avgScrollDepth: this.metrics.scrollDepth,
            timeOnPage: this.metrics.timeOnPage,
            recentEvents: this.metrics.events.filter(e => e.timestamp > hourAgo).length,
            performance: this.metrics.performance,
            sessionId: this.sessionId,
            timestamp: now
        };
    }

    // ========== DATA PERSISTENCE ==========
    loadStoredData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);

                // Merge historical data
                if (data.sessions) {
                    console.log(`📂 Loaded ${data.sessions.length} previous sessions`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load stored analytics:', error);
        }
    }

    saveData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            let data = stored ? JSON.parse(stored) : { sessions: [] };

            // Add current session
            data.sessions.push({
                sessionId: this.sessionId,
                metrics: this.metrics,
                startTime: this.pageLoadTime,
                endTime: Date.now()
            });

            // Cleanup old sessions
            const maxAge = this.config.storage.retentionDays * 24 * 60 * 60 * 1000;
            const cutoff = Date.now() - maxAge;
            data.sessions = data.sessions.filter(s => s.endTime > cutoff);

            // Limit total entries
            if (data.sessions.length > this.config.storage.maxEntries) {
                data.sessions = data.sessions.slice(-this.config.storage.maxEntries);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('💾 Analytics data saved');
        } catch (error) {
            console.warn('⚠️ Could not save analytics:', error);
        }
    }

    setupAutoSave() {
        // Save every minute
        setInterval(() => {
            this.saveData();
        }, 60000);

        // Save on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveData();
            }
        });
    }

    // ========== PUBLIC API ==========
    getMetrics() {
        return {
            ...this.metrics,
            sessionId: this.sessionId,
            aggregated: this.aggregateMetrics()
        };
    }

    getLiveMetrics() {
        return this.aggregateMetrics();
    }

    getClickData() {
        return this.metrics.clicks;
    }

    getPerformanceData() {
        return this.metrics.performance;
    }

    getAllSessions() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored).sessions : [];
        } catch {
            return [];
        }
    }

    exportData() {
        const data = {
            currentSession: {
                sessionId: this.sessionId,
                metrics: this.metrics
            },
            allSessions: this.getAllSessions(),
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sportiq-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📥 Analytics data exported');
    }

    clearData() {
        localStorage.removeItem(this.storageKey);
        this.metrics = {
            visits: 0,
            clicks: [],
            scrollDepth: 0,
            timeOnPage: 0,
            events: [],
            performance: {}
        };
        console.log('🗑️ Analytics data cleared');
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 70,
            name: 'Core Analytics & Metrics Engine',
            sessionId: this.sessionId,
            tracking: this.config.tracking,
            features: {
                visitTracking: true,
                clickTracking: true,
                scrollTracking: true,
                timeTracking: true,
                performanceTracking: true,
                customEvents: true,
                realTimeAggregation: true,
                dataPersistence: true
            },
            stats: {
                visits: this.metrics.visits,
                clicks: this.metrics.clicks.length,
                events: this.metrics.events.length,
                timeOnPage: this.metrics.timeOnPage
            }
        };
    }

    destroy() {
        if (this.trackingInterval) clearInterval(this.trackingInterval);
        if (this.aggregationInterval) clearInterval(this.aggregationInterval);
        this.saveData();
        this.isActive = false;
        console.log('🗑️ Layer 70 destroyed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer70_Analytics = new AnalyticsEngine();
    });
} else {
    window.Layer70_Analytics = new AnalyticsEngine();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsEngine;
}
