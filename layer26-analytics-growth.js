/**
 * Layer 26: Analytics & Growth Intelligence Runtime
 * Complete implementation with visitor tracking, events, conversions, heatmaps
 */

class AnalyticsGrowthRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_ANALYTICS_GROWTH__) {
            return window.__ANTIGRAVITY_ANALYTICS_GROWTH__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-026';
        this.name = 'Analytics & Growth Intelligence';

        // Core data stores
        this.visitors = [];
        this.events = [];
        this.conversions = [];
        this.heatmapData = [];
        this.performanceMetrics = {};

        // Session tracking
        this.sessionId = this._generateSessionId();
        this.sessionStart = Date.now();
        this.pageViews = parseInt(localStorage.getItem('total_page_views') || '0');

        console.log(`[Analytics v${this.version}] Initializing...`);
        this._init();
    }

    async _init() {
        try {
            await this._loadConfig();
            this._trackVisitor();
            this._setupEventTracking();
            this._setupHeatmapTracking();
            this._trackPerformance();
            this._setupAutoSave();
            console.log('[Analytics] Fully initialized');
        } catch (error) {
            console.error('[Analytics] Init error:', error);
        }
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/analytics-config.json');
            if (response.ok) {
                this.config = await response.json();
            }
        } catch (error) {
            this.config = this._getDefaultConfig();
        }
    }

    _getDefaultConfig() {
        return {
            trackingEnabled: true,
            heatmapEnabled: true,
            conversionGoals: ['signup', 'subscribe', 'share'],
            performanceMetrics: ['FCP', 'LCP', 'CLS', 'FID'],
            autoSaveInterval: 60000
        };
    }

    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Visitor Tracking
    _trackVisitor() {
        this.pageViews++;
        localStorage.setItem('total_page_views', this.pageViews.toString());

        const visitor = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            pageView: this.pageViews
        };

        this.visitors.push(visitor);
        this._saveData('visitors', this.visitors);
        this._emitEvent('analytics:visitor-tracked', visitor);
    }

    // Event Tracking
    _setupEventTracking() {
        // Track all clicks
        document.addEventListener('click', (e) => {
            this.trackEvent('click', {
                target: e.target.tagName,
                id: e.target.id,
                className: e.target.className,
                text: e.target.textContent?.substring(0, 50),
                x: e.clientX,
                y: e.clientY
            });
        });

        // Track scrolling
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                this.trackEvent('scroll', {
                    percent: Math.round(scrollPercent),
                    depth: window.scrollY
                });
            }, 500);
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackEvent('form_submit', {
                formId: e.target.id,
                formAction: e.target.action
            });
        });

        // Track video plays
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('play', () => {
                this.trackEvent('video_play', { src: video.src });
            });
        });
    }

    trackEvent(eventName, data = {}) {
        const event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: this.sessionId,
            name: eventName,
            data,
            timestamp: Date.now(),
            url: window.location.href
        };

        this.events.push(event);

        // Keep last 500 events
        if (this.events.length > 500) {
            this.events = this.events.slice(-500);
        }

        this._saveData('events', this.events);
        this._emitEvent('analytics:event-tracked', event);

        // Check if this is a conversion event
        if (this.config.conversionGoals.includes(eventName)) {
            this.trackConversion(eventName, data);
        }

        return event;
    }

    // Conversion Tracking
    trackConversion(goalName, data = {}, value = 0) {
        const conversion = {
            id: `conv_${Date.now()}`,
            sessionId: this.sessionId,
            goal: goalName,
            data,
            value,
            timestamp: Date.now(),
            url: window.location.href
        };

        this.conversions.push(conversion);
        this._saveData('conversions', this.conversions);
        this._emitEvent('analytics:conversion', conversion);

        return conversion;
    }

    // Heatmap Tracking
    _setupHeatmapTracking() {
        if (!this.config.heatmapEnabled) return;

        document.addEventListener('click', (e) => {
            this.heatmapData.push({
                x: e.clientX,
                y: e.clientY,
                scrollY: window.scrollY,
                timestamp: Date.now(),
                url: window.location.pathname
            });

            // Keep last 1000 clicks
            if (this.heatmapData.length > 1000) {
                this.heatmapData = this.heatmapData.slice(-1000);
            }

            this._saveData('heatmap', this.heatmapData);
        });
    }

    getHeatmapData(url = null) {
        if (url) {
            return this.heatmapData.filter(point => point.url === url);
        }
        return this.heatmapData;
    }

    // Performance Tracking
    _trackPerformance() {
        if (window.performance) {
            // Navigation timing
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                this.performanceMetrics.loadTime = nav.loadEventEnd - nav.fetchStart;
                this.performanceMetrics.domReady = nav.domContentLoadedEventEnd - nav.fetchStart;
                this.performanceMetrics.ttfb = nav.responseStart - nav.requestStart;
            }

            // Paint timing
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.performanceMetrics.fcp = entry.startTime;
                }
            });

            // Largest Contentful Paint
            if (PerformanceObserver && PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.performanceMetrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            }

            // Cumulative Layout Shift
            if (PerformanceObserver && PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.performanceMetrics.cls = clsValue;
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            }

            this._saveData('performance', this.performanceMetrics);
        }
    }

    getPerformanceMetrics() {
        return this.performanceMetrics;
    }

    // Growth Analytics
    getGrowthMetrics() {
        const now = Date.now();
        const dayAgo = now - 86400000;
        const weekAgo = now - 604800000;

        return {
            totalVisitors: this.visitors.length,
            todayVisitors: this.visitors.filter(v => v.timestamp > dayAgo).length,
            weekVisitors: this.visitors.filter(v => v.timestamp > weekAgo).length,
            totalEvents: this.events.length,
            totalConversions: this.conversions.length,
            conversionRate: this.conversions.length / this.visitors.length,
            topEvents: this._getTopEvents(),
            avgSessionDuration: this._getAvgSessionDuration(),
            bounceRate: this._getBounceRate()
        };
    }

    _getTopEvents() {
        const eventCounts = {};
        this.events.forEach(e => {
            eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
        });
        return Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }

    _getAvgSessionDuration() {
        // Simplified calculation
        const sessionDurations = {};
        this.events.forEach(e => {
            if (!sessionDurations[e.sessionId]) {
                sessionDurations[e.sessionId] = { start: e.timestamp, end: e.timestamp };
            } else {
                sessionDurations[e.sessionId].end = Math.max(sessionDurations[e.sessionId].end, e.timestamp);
            }
        });

        const durations = Object.values(sessionDurations).map(s => s.end - s.start);
        return durations.reduce((a, b) => a + b, 0) / durations.length || 0;
    }

    _getBounceRate() {
        const singlePageSessions = new Set();
        const allSessions = new Set();

        this.visitors.forEach(v => {
            allSessions.add(v.sessionId);
        });

        this.events.forEach(e => {
            if (e.name === 'click' || e.name === 'scroll') {
                singlePageSessions.delete(e.sessionId);
            }
        });

        return singlePageSessions.size / allSessions.size || 0;
    }

    // Dashboard Data
    getDashboardData() {
        return {
            overview: {
                totalPageViews: this.pageViews,
                activeSession: this.sessionId,
                sessionDuration: Date.now() - this.sessionStart
            },
            growth: this.getGrowthMetrics(),
            performance: this.performanceMetrics,
            recentEvents: this.events.slice(-20),
            recentConversions: this.conversions.slice(-10)
        };
    }

    // Data persistence
    _saveData(key, data) {
        try {
            localStorage.setItem(`analytics_${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn('[Analytics] Storage error:', error);
        }
    }

    _loadData(key) {
        try {
            const data = localStorage.getItem(`analytics_${key}`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }

    _setupAutoSave() {
        setInterval(() => {
            this._saveData('visitors', this.visitors);
            this._saveData('events', this.events);
            this._saveData('conversions', this.conversions);
            this._saveData('heatmap', this.heatmapData);
            this._saveData('performance', this.performanceMetrics);
        }, this.config.autoSaveInterval);
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    // Clear data (for testing/privacy)
    clearAllData() {
        this.visitors = [];
        this.events = [];
        this.conversions = [];
        this.heatmapData = [];
        this.performanceMetrics = {};

        localStorage.removeItem('analytics_visitors');
        localStorage.removeItem('analytics_events');
        localStorage.removeItem('analytics_conversions');
        localStorage.removeItem('analytics_heatmap');
        localStorage.removeItem('analytics_performance');
    }

    getState() {
        return {
            sessionId: this.sessionId,
            pageViews: this.pageViews,
            visitors: this.visitors.length,
            events: this.events.length,
            conversions: this.conversions.length,
            heatmapPoints: this.heatmapData.length
        };
    }
}

// Initialize and export
const analyticsGrowth = new AnalyticsGrowthRuntime();
window.__ANTIGRAVITY_ANALYTICS_GROWTH__ = analyticsGrowth;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[Analytics] Registered with runtime');
    });
}

export default analyticsGrowth;
