/**
 * Layer 65 - Global Trending Hashtags & Social Feed
 * Real-time trending topics and social media integration
 * Sport IQ Platform
 */

class GlobalTrendingHashtags {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.trendingData = [];
        this.updateInterval = null;
        this.refreshRate = 60000; // 60 seconds
        this.init();
    }

    async init() {
        console.log('🔥 Layer 65: Global Trending Hashtags - STARTING');

        // Load configuration
        await this.loadConfig();

        // Initialize trending feed
        this.initializeTrendingFeed();

        // Start auto-update engine
        this.startAutoUpdate();

        // Inject social feed UI
        this.injectSocialFeedUI();

        this.isActive = true;
        console.log('✅ Layer 65: Global Trending Hashtags - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/trending-hashtags-config.json');
            this.config = await response.json();
            console.log('✅ Trending hashtags config loaded');
        } catch (error) {
            console.warn('⚠️ Using default trending config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            sources: [
                { name: 'Twitter Sports', endpoint: 'https://api.twitter.com/trends', enabled: true },
                { name: 'Instagram Sports', endpoint: 'https://api.instagram.com/trending', enabled: true },
                { name: 'Reddit Sports', endpoint: 'https://api.reddit.com/r/sports/hot', enabled: true }
            ],
            sports: ['football', 'basketball', 'tennis', 'cricket', 'baseball', 'hockey'],
            refreshRate: 60000,
            maxTrending: 20,
            displayMode: 'carousel',
            autoUpdate: true
        };
    }

    async initializeTrendingFeed() {
        console.log('📊 Initializing trending feed...');

        // Fetch initial trending data
        await this.fetchTrendingHashtags();

        console.log(`✅ Loaded ${this.trendingData.length} trending topics`);
    }

    async fetchTrendingHashtags() {
        console.log('🔍 Fetching trending hashtags...');

        // Simulate fetching from multiple sources (in production, use real APIs)
        const mockTrendingData = this.generateMockTrendingData();

        this.trendingData = mockTrendingData;

        // Update UI
        this.updateTrendingDisplay();

        return this.trendingData;
    }

    generateMockTrendingData() {
        const hashtags = [
            { tag: '#WorldCup2024', count: '2.5M', trend: 'up', sport: 'football' },
            { tag: '#NBA', count: '1.8M', trend: 'up', sport: 'basketball' },
            { tag: '#ChampionsLeague', count: '1.2M', trend: 'up', sport: 'football' },
            { tag: '#Wimbledon', count: '950K', trend: 'stable', sport: 'tennis' },
            { tag: '#SuperBowl', count: '850K', trend: 'down', sport: 'football' },
            { tag: '#IPL2024', count: '750K', trend: 'up', sport: 'cricket' },
            { tag: '#F1Racing', count: '680K', trend: 'up', sport: 'racing' },
            { tag: '#Olympics', count: '620K', trend: 'stable', sport: 'multi' },
            { tag: '#PremierLeague', count: '590K', trend: 'up', sport: 'football' },
            { tag: '#March Madness', count: '520K', trend: 'up', sport: 'basketball' },
            { tag: '#UFC', count: '480K', trend: 'stable', sport: 'mma' },
            { tag: '#AustralianOpen', count: '450K', trend: 'down', sport: 'tennis' },
            { tag: '#LaLiga', count: '420K', trend: 'up', sport: 'football' },
            { tag: '#NHL', count: '390K', trend: 'stable', sport: 'hockey' },
            { tag: '#SerieA', count: '360K', trend: 'up', sport: 'football' },
            { tag: '#Bundesliga', count: '340K', trend: 'stable', sport: 'football' },
            { tag: '#Ligue1', count: '310K', trend: 'down', sport: 'football' },
            { tag: '#MLS', count: '280K', trend: 'up', sport: 'football' },
            { tag: '#Boxing', count: '250K', trend: 'stable', sport: 'boxing' },
            { tag: '#Golf', count: '220K', trend: 'up', sport: 'golf' }
        ];

        return hashtags.map((item, index) => ({
            ...item,
            id: `trend-${index}`,
            timestamp: new Date().toISOString(),
            engagement: Math.floor(Math.random() * 100000),
            velocity: Math.random() * 10
        }));
    }

    updateTrendingDisplay() {
        const container = document.getElementById('trending-hashtags-feed');
        if (!container) {
            console.warn('⚠️ Trending feed container not found');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Create trending items
        this.trendingData.slice(0, this.config.maxTrending).forEach((item, index) => {
            const trendItem = this.createTrendingItem(item, index);
            container.appendChild(trendItem);
        });

        console.log(`✅ Updated trending display with ${this.trendingData.length} items`);
    }

    createTrendingItem(item, index) {
        const div = document.createElement('div');
        div.className = 'trending-item';
        div.dataset.trendId = item.id;

        const trendIcon = item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '➡️';
        const trendColor = item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : '#6b7280';

        div.innerHTML = `
            <div class="trend-rank">#${index + 1}</div>
            <div class="trend-content">
                <div class="trend-hashtag">${item.tag}</div>
                <div class="trend-meta">
                    <span class="trend-count">${item.count} posts</span>
                    <span class="trend-sport">${item.sport}</span>
                </div>
            </div>
            <div class="trend-indicator" style="color: ${trendColor}">
                ${trendIcon}
            </div>
        `;

        // Add click handler
        div.onclick = () => this.handleHashtagClick(item);

        return div;
    }

    handleHashtagClick(item) {
        console.log(`🔍 Clicked trending hashtag: ${item.tag}`);

        // Emit event for other layers to respond
        window.dispatchEvent(new CustomEvent('trending:hashtag:click', {
            detail: item
        }));

        // You can add navigation or modal display here
        this.showHashtagDetails(item);
    }

    showHashtagDetails(item) {
        // Create modal or expanded view
        const modal = document.createElement('div');
        modal.className = 'trending-modal';
        modal.innerHTML = `
            <div class="trending-modal-content">
                <button class="trending-modal-close">✕</button>
                <h2>${item.tag}</h2>
                <div class="trending-stats">
                    <div class="stat">
                        <span class="stat-label">Total Posts</span>
                        <span class="stat-value">${item.count}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Engagement</span>
                        <span class="stat-value">${item.engagement.toLocaleString()}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Sport</span>
                        <span class="stat-value">${item.sport}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Trend</span>
                        <span class="stat-value">${item.trend}</span>
                    </div>
                </div>
                <p>Loading related posts and social media content...</p>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handler
        modal.querySelector('.trending-modal-close').onclick = () => {
            modal.remove();
        };

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    injectSocialFeedUI() {
        console.log('📱 Injecting social feed UI...');

        // Check if container already exists
        if (document.getElementById('trending-hashtags-feed')) {
            console.log('✅ Social feed container already exists');
            return;
        }

        // Create main container
        const container = document.createElement('section');
        container.id = 'trending-social-section';
        container.className = 'trending-section';
        container.innerHTML = `
            <div class="trending-header">
                <h2>🔥 Trending Now</h2>
                <button class="trending-refresh-btn" id="refresh-trending">
                    🔄 Refresh
                </button>
            </div>
            <div class="trending-hashtags-feed" id="trending-hashtags-feed">
                <!-- Trending items will be inserted here -->
            </div>
        `;

        // Insert after hero section or at top of main content
        const insertPoint = document.querySelector('.hero') ||
            document.querySelector('#cinematic-slider-4k') ||
            document.querySelector('main') ||
            document.body;

        if (insertPoint.nextSibling) {
            insertPoint.parentNode.insertBefore(container, insertPoint.nextSibling);
        } else {
            insertPoint.parentNode.appendChild(container);
        }

        // Add refresh button handler
        document.getElementById('refresh-trending').onclick = () => {
            this.fetchTrendingHashtags();
        };

        // Initial display
        this.updateTrendingDisplay();

        console.log('✅ Social feed UI injected');
    }

    startAutoUpdate() {
        if (!this.config.autoUpdate) {
            console.log('⏸️ Auto-update disabled');
            return;
        }

        console.log(`⏰ Starting auto-update (${this.config.refreshRate / 1000}s interval)`);

        this.updateInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing trending hashtags...');
            this.fetchTrendingHashtags();
        }, this.config.refreshRate);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ Auto-update stopped');
        }
    }

    // Public API
    getTrendingData() {
        return this.trendingData;
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 65,
            name: 'Global Trending Hashtags & Social Feed',
            trendingCount: this.trendingData.length,
            autoUpdate: !!this.updateInterval,
            refreshRate: this.config.refreshRate,
            features: {
                hashtags: true,
                socialFeed: true,
                autoRefresh: this.config.autoUpdate,
                realTimeUpdates: true
            }
        };
    }

    destroy() {
        this.stopAutoUpdate();
        const section = document.getElementById('trending-social-section');
        if (section) section.remove();
        this.isActive = false;
        console.log('🗑️ Layer 65 destroyed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer65_TrendingHashtags = new GlobalTrendingHashtags();
    });
} else {
    window.Layer65_TrendingHashtags = new GlobalTrendingHashtags();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalTrendingHashtags;
}
