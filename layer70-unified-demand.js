/**
 * Layer 70 - Unified Global Demand Engine
 * Master aggregation dashboard for all content layers
 * Sport IQ Platform
 */

class UnifiedGlobalDemandEngine {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.dashboard = null;
        this.syncInterval = null;
        this.widgets = {};
        this.init();
    }

    async init() {
        console.log('🌐 Layer 70: Unified Global Demand Engine - STARTING');

        // Load configuration
        await this.loadConfig();

        // Wait for other layers to initialize
        await this.waitForDependencies();

        // Create unified dashboard
        this.createDashboard();

        // Aggregate all content
        this.aggregateContent();

        // Start auto-sync engine
        this.startAutoSync();

        this.isActive = true;
        console.log('✅ Layer 70: Unified Global Demand Engine - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/unified-demand-config.json');
            this.config = await response.json();
            console.log('✅ Unified demand config loaded');
        } catch (error) {
            console.warn('⚠️ Using default unified config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            syncInterval: 30000, // 30 seconds
            widgets: {
                trending: { enabled: true, priority: 1 },
                highlights: { enabled: true, priority: 2 },
                polls: { enabled: true, priority: 3 },
                news: { enabled: true, priority: 4 },
                alerts: { enabled: true, priority: 5 }
            },
            dashboardPosition: 'floating',
            autoOpen: false
        };
    }

    async waitForDependencies() {
        const maxWait = 5000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            if (
                window.Layer65_TrendingHashtags?.isActive &&
                window.Layer66_EventHighlights?.isActive &&
                window.Layer67_GlobalPolls?.isActive &&
                window.Layer68_NewsSummarizer?.isActive &&
                window.Layer69_GlobalAlerts?.isActive
            ) {
                console.log('✅ All dependencies loaded');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.warn('⚠️ Some dependencies may not be loaded');
    }

    createDashboard() {
        console.log('📊 Creating unified dashboard...');

        // Create floating action button
        const fab = document.createElement('button');
        fab.id = 'unified-demand-fab';
        fab.className = 'unified-fab';
        fab.innerHTML = '🌐';
        fab.title = 'Open Unified Dashboard';
        fab.onclick = () => this.toggleDashboard();
        document.body.appendChild(fab);

        // Create dashboard container
        this.dashboard = document.createElement('div');
        this.dashboard.id = 'unified-demand-dashboard';
        this.dashboard.className = 'unified-dashboard hidden';

        this.dashboard.innerHTML = `
            <div class="dashboard-header">
                <h2>🌐 Unified Global Dashboard</h2>
                <div class="dashboard-controls">
                    <button class="dashboard-refresh" id="dashboard-refresh">🔄</button>
                    <button class="dashboard-close" id="dashboard-close">✕</button>
                </div>
            </div>
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-label">Trending Topics</div>
                    <div class="stat-value" id="stat-trending">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Video Highlights</div>
                    <div class="stat-value" id="stat-highlights">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Polls</div>
                    <div class="stat-value" id="stat-polls">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">News Stories</div>
                    <div class="stat-value" id="stat-news">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Alerts</div>
                    <div class="stat-value" id="stat-alerts">0</div>
                </div>
            </div>
            <div class="dashboard-widgets">
                <div class="widget-grid">
                    <!-- Widgets will be inserted here -->
                </div>
            </div>
        `;

        document.body.appendChild(this.dashboard);

        // Add event listeners
        document.getElementById('dashboard-close').onclick = () => this.toggleDashboard();
        document.getElementById('dashboard-refresh').onclick = () => this.refreshAllContent();

        console.log('✅ Dashboard created');
    }

    toggleDashboard() {
        this.dashboard.classList.toggle('hidden');

        if (!this.dashboard.classList.contains('hidden')) {
            this.aggregateContent();
        }
    }

    aggregateContent() {
        console.log('🔄 Aggregating all content...');

        // Clear existing widgets
        const widgetGrid = this.dashboard.querySelector('.widget-grid');
        widgetGrid.innerHTML = '';

        // Aggregate from each layer
        this.aggregateTrending();
        this.aggregateHighlights();
        this.aggregatePolls();
        this.aggregateNews();
        this.aggregateAlerts();

        // Update stats
        this.updateStats();
    }

    aggregateTrending() {
        if (!this.config.widgets.trending.enabled) return;
        if (!window.Layer65_TrendingHashtags?.isActive) return;

        const data = window.Layer65_TrendingHashtags.getTrendingData();
        if (!data || data.length === 0) return;

        const widget = this.createWidget('trending', '🔥 Top Trending',
            data.slice(0, 5).map(item => ({
                text: item.tag,
                meta: `${item.count} posts`,
                trend: item.trend
            }))
        );

        this.dashboard.querySelector('.widget-grid').appendChild(widget);
    }

    aggregateHighlights() {
        if (!this.config.widgets.highlights.enabled) return;
        if (!window.Layer66_EventHighlights?.isActive) return;

        const data = window.Layer66_EventHighlights.getHighlights();
        if (!data || data.length === 0) return;

        const widget = this.createWidget('highlights', '🎬 Latest Highlights',
            data.slice(0, 3).map(item => ({
                text: item.title,
                meta: `${item.views} views • ${item.duration}`,
                image: item.thumbnail
            }))
        );

        this.dashboard.querySelector('.widget-grid').appendChild(widget);
    }

    aggregatePolls() {
        if (!this.config.widgets.polls.enabled) return;
        if (!window.Layer67_GlobalPolls?.isActive) return;

        const data = window.Layer67_GlobalPolls.getPolls();
        if (!data || data.length === 0) return;

        const widget = this.createWidget('polls', '📊 Active Polls',
            data.slice(0, 3).map(item => ({
                text: item.question,
                meta: `${item.totalVotes.toLocaleString()} votes`,
                category: item.category
            }))
        );

        this.dashboard.querySelector('.widget-grid').appendChild(widget);
    }

    aggregateNews() {
        if (!this.config.widgets.news.enabled) return;
        if (!window.Layer68_NewsSummarizer?.isActive) return;

        const data = window.Layer68_NewsSummarizer.getSummaries();
        if (!data || data.length === 0) return;

        const widget = this.createWidget('news', '📰 Latest News',
            data.slice(0, 4).map(item => ({
                text: item.title,
                meta: `${item.source} • ${this.getTimeAgo(item.timestamp)}`,
                category: item.category
            }))
        );

        this.dashboard.querySelector('.widget-grid').appendChild(widget);
    }

    aggregateAlerts() {
        if (!this.config.widgets.alerts.enabled) return;
        if (!window.Layer69_GlobalAlerts?.isActive) return;

        const data = window.Layer69_GlobalAlerts.getActiveAlerts();
        if (!data || data.length === 0) return;

        const widget = this.createWidget('alerts', '🚨 Critical Updates',
            data.slice(0, 3).map(item => ({
                text: item.message,
                meta: item.source,
                priority: item.priority
            }))
        );

        this.dashboard.querySelector('.widget-grid').appendChild(widget);
    }

    createWidget(id, title, items) {
        const widget = document.createElement('div');
        widget.className = 'dashboard-widget';
        widget.dataset.widgetId = id;

        widget.innerHTML = `
            <div class="widget-header">${title}</div>
            <div class="widget-content">
                ${items.map(item => `
                    <div class="widget-item">
                        ${item.image ? `<img src="${item.image}" alt="" class="widget-item-image">` : ''}
                        <div class="widget-item-content">
                            <div class="widget-item-text">${item.text}</div>
                            <div class="widget-item-meta">${item.meta}</div>
                        </div>
                        ${item.trend ? `<span class="widget-trend">${item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '➡️'}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        return widget;
    }

    updateStats() {
        // Update trending count
        if (window.Layer65_TrendingHashtags?.isActive) {
            const trending = window.Layer65_TrendingHashtags.getTrendingData();
            document.getElementById('stat-trending').textContent = trending?.length || 0;
        }

        // Update highlights count
        if (window.Layer66_EventHighlights?.isActive) {
            const highlights = window.Layer66_EventHighlights.getHighlights();
            document.getElementById('stat-highlights').textContent = highlights?.length || 0;
        }

        // Update polls count
        if (window.Layer67_GlobalPolls?.isActive) {
            const polls = window.Layer67_GlobalPolls.getPolls();
            document.getElementById('stat-polls').textContent = polls?.length || 0;
        }

        // Update news count
        if (window.Layer68_NewsSummarizer?.isActive) {
            const news = window.Layer68_NewsSummarizer.getSummaries();
            document.getElementById('stat-news').textContent = news?.length || 0;
        }

        // Update alerts count
        if (window.Layer69_GlobalAlerts?.isActive) {
            const alerts = window.Layer69_GlobalAlerts.getActiveAlerts();
            document.getElementById('stat-alerts').textContent = alerts?.length || 0;
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diff = now - then;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return then.toLocaleDateString();
    }

    refreshAllContent() {
        console.log('🔄 Refreshing all content...');
        this.aggregateContent();

        // Trigger refresh on individual layers
        if (window.Layer65_TrendingHashtags?.isActive) {
            window.Layer65_TrendingHashtags.fetchTrendingHashtags?.();
        }
        if (window.Layer66_EventHighlights?.isActive) {
            window.Layer66_EventHighlights.fetchHighlights?.();
        }
        if (window.Layer67_GlobalPolls?.isActive) {
            window.Layer67_GlobalPolls.refreshPolls?.();
        }
        if (window.Layer68_NewsSummarizer?.isActive) {
            window.Layer68_NewsSummarizer.refreshSummaries?.();
        }
    }

    startAutoSync() {
        if (!this.config.syncInterval) return;

        console.log(`⏰ Starting auto-sync (${this.config.syncInterval / 1000}s interval)`);

        this.syncInterval = setInterval(() => {
            console.log('🔄 Auto-syncing content...');
            if (!this.dashboard.classList.contains('hidden')) {
                this.aggregateContent();
            }
        }, this.config.syncInterval);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Auto-sync stopped');
        }
    }

    // Public API
    getAggregatedData() {
        return {
            trending: window.Layer65_TrendingHashtags?.getTrendingData() || [],
            highlights: window.Layer66_EventHighlights?.getHighlights() || [],
            polls: window.Layer67_GlobalPolls?.getPolls() || [],
            news: window.Layer68_NewsSummarizer?.getSummaries() || [],
            alerts: window.Layer69_GlobalAlerts?.getActiveAlerts() || []
        };
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 70,
            name: 'Unified Global Demand Engine',
            dependencies: {
                trending: !!window.Layer65_TrendingHashtags?.isActive,
                highlights: !!window.Layer66_EventHighlights?.isActive,
                polls: !!window.Layer67_GlobalPolls?.isActive,
                news: !!window.Layer68_NewsSummarizer?.isActive,
                alerts: !!window.Layer69_GlobalAlerts?.isActive
            },
            autoSync: !!this.syncInterval,
            syncInterval: this.config.syncInterval,
            features: {
                unifiedDashboard: true,
                realTimeAggregation: true,
                autoSync: true,
                multiSource: true
            }
        };
    }

    destroy() {
        this.stopAutoSync();
        if (this.dashboard) this.dashboard.remove();
        const fab = document.getElementById('unified-demand-fab');
        if (fab) fab.remove();
        this.isActive = false;
        console.log('🗑️ Layer 70 destroyed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer70_UnifiedDemand = new UnifiedGlobalDemandEngine();
    });
} else {
    window.Layer70_UnifiedDemand = new UnifiedGlobalDemandEngine();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedGlobalDemandEngine;
}
