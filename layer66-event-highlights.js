/**
 * Layer 66 - Event Highlights & Replay Engine
 * Video highlights and replay content system
 * Sport IQ Platform
 */

class EventHighlightsReplay {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.highlights = [];
        this.updateInterval = null;
        this.refreshRate = 120000; // 2 minutes
        this.currentCategory = 'all';
        this.init();
    }

    async init() {
        console.log('📹 Layer 66: Event Highlights & Replay - STARTING');

        // Load configuration
        await this.loadConfig();

        // Initialize highlights engine
        this.initializeHighlightsEngine();

        // Start auto-update engine
        this.startAutoUpdate();

        // Inject highlights UI
        this.injectHighlightsUI();

        this.isActive = true;
        console.log('✅ Layer 66: Event Highlights & Replay - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/event-highlights-config.json');
            this.config = await response.json();
            console.log('✅ Event highlights config loaded');
        } catch (error) {
            console.warn('⚠️ Using default highlights config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            sources: [
                { name: 'YouTube Sports', endpoint: 'https://www.youtube.com/feeds', enabled: true },
                { name: 'ESPN Highlights', endpoint: 'https://api.espn.com/highlights', enabled: true },
                { name: 'Sky Sports', endpoint: 'https://api.skysports.com/videos', enabled: true }
            ],
            categories: ['football', 'basketball', 'tennis', 'cricket', 'baseball', 'hockey', 'all'],
            refreshRate: 120000,
            maxHighlights: 12,
            displayMode: 'grid',
            autoUpdate: true,
            videoQuality: '720p'
        };
    }

    async initializeHighlightsEngine() {
        console.log('🎬 Initializing highlights engine...');

        // Fetch initial highlights
        await this.fetchHighlights();

        console.log(`✅ Loaded ${this.highlights.length} highlight videos`);
    }

    async fetchHighlights() {
        console.log('🔍 Fetching event highlights...');

        // Generate mock highlight data (in production, use real APIs)
        const mockHighlights = this.generateMockHighlights();

        this.highlights = mockHighlights;

        // Update UI
        this.updateHighlightsDisplay();

        return this.highlights;
    }

    generateMockHighlights() {
        const highlights = [
            {
                id: 'h1',
                title: 'Champions League Final: Amazing Goal Compilation',
                sport: 'football',
                duration: '5:23',
                views: '2.5M',
                thumbnail: 'https://picsum.photos/640/360?random=101',
                video: 'https://example.com/video1.mp4',
                date: '2 hours ago',
                league: 'UEFA Champions League'
            },
            {
                id: 'h2',
                title: 'NBA Top 10 Dunks of the Week',
                sport: 'basketball',
                duration: '4:15',
                views: '1.8M',
                thumbnail: 'https://picsum.photos/640/360?random=102',
                video: 'https://example.com/video2.mp4',
                date: '5 hours ago',
                league: 'NBA'
            },
            {
                id: 'h3',
                title: 'Wimbledon 2024: Best Rallies',
                sport: 'tennis',
                duration: '6:42',
                views: '950K',
                thumbnail: 'https://picsum.photos/640/360?random=103',
                video: 'https://example.com/video3.mp4',
                date: '1 day ago',
                league: 'Wimbledon'
            },
            {
                id: 'h4',
                title: 'IPL 2024: Massive Sixes Compilation',
                sport: 'cricket',
                duration: '7:18',
                views: '1.2M',
                thumbnail: 'https://picsum.photos/640/360?random=104',
                video: 'https://example.com/video4.mp4',
                date: '3 hours ago',
                league: 'IPL'
            },
            {
                id: 'h5',
                title: 'Premier League: Goals of the Month',
                sport: 'football',
                duration: '8:30',
                views: '3.1M',
                thumbnail: 'https://picsum.photos/640/360?random=105',
                video: 'https://example.com/video5.mp4',
                date: '1 hour ago',
                league: 'Premier League'
            },
            {
                id: 'h6',
                title: 'NBA Playoffs: Clutch Moments',
                sport: 'basketball',
                duration: '5:55',
                views: '2.3M',
                thumbnail: 'https://picsum.photos/640/360?random=106',
                video: 'https://example.com/video6.mp4',
                date: '4 hours ago',
                league: 'NBA Playoffs'
            },
            {
                id: 'h7',
                title: 'F1 Monaco GP: Best Overtakes',
                sport: 'racing',
                duration: '4:40',
                views: '890K',
                thumbnail: 'https://picsum.photos/640/360?random=107',
                video: 'https://example.com/video7.mp4',
                date: '2 days ago',
                league: 'Formula 1'
            },
            {
                id: 'h8',
                title: 'NHL Stanley Cup: Incredible Saves',
                sport: 'hockey',
                duration: '6:12',
                views: '720K',
                thumbnail: 'https://picsum.photos/640/360?random=108',
                video: 'https://example.com/video8.mp4',
                date: '6 hours ago',
                league: 'NHL'
            },
            {
                id: 'h9',
                title: 'La Liga: Skill Moves & Tricks',
                sport: 'football',
                duration: '5:48',
                views: '1.5M',
                thumbnail: 'https://picsum.photos/640/360?random=109',
                video: 'https://example.com/video9.mp4',
                date: '8 hours ago',
                league: 'La Liga'
            },
            {
                id: 'h10',
                title: 'UFC Fight Night: Best Knockouts',
                sport: 'mma',
                duration: '7:25',
                views: '2.8M',
                thumbnail: 'https://picsum.photos/640/360?random=110',
                video: 'https://example.com/video10.mp4',
                date: '1 day ago',
                league: 'UFC'
            },
            {
                id: 'h11',
                title: 'Australian Open: Match Point Winners',
                sport: 'tennis',
                duration: '5:30',
                views: '680K',
                thumbnail: 'https://picsum.photos/640/360?random=111',
                video: 'https://example.com/video11.mp4',
                date: '3 days ago',
                league: 'Australian Open'
            },
            {
                id: 'h12',
                title: 'MLB World Series: Home Run Derby',
                sport: 'baseball',
                duration: '9:15',
                views: '1.1M',
                thumbnail: 'https://picsum.photos/640/360?random=112',
                video: 'https://example.com/video12.mp4',
                date: '12 hours ago',
                league: 'MLB'
            }
        ];

        return highlights;
    }

    updateHighlightsDisplay() {
        const container = document.getElementById('highlights-grid');
        if (!container) {
            console.warn('⚠️ Highlights container not found');
            return;
        }

        // Filter by category if not 'all'
        const filteredHighlights = this.currentCategory === 'all'
            ? this.highlights
            : this.highlights.filter(h => h.sport === this.currentCategory);

        // Clear existing content
        container.innerHTML = '';

        // Create highlight cards
        filteredHighlights.slice(0, this.config.maxHighlights).forEach(highlight => {
            const card = this.createHighlightCard(highlight);
            container.appendChild(card);
        });

        console.log(`✅ Updated highlights display with ${filteredHighlights.length} items`);
    }

    createHighlightCard(highlight) {
        const card = document.createElement('div');
        card.className = 'highlight-card';
        card.dataset.highlightId = highlight.id;

        card.innerHTML = `
            <div class="highlight-thumbnail">
                <img src="${highlight.thumbnail}" alt="${highlight.title}" loading="lazy">
                <div class="highlight-duration">${highlight.duration}</div>
                <div class="highlight-play-btn">▶</div>
            </div>
            <div class="highlight-info">
                <h3 class="highlight-title">${highlight.title}</h3>
                <div class="highlight-meta">
                    <span class="highlight-league">${highlight.league}</span>
                    <span class="highlight-views">${highlight.views} views</span>
                </div>
                <div class="highlight-footer">
                    <span class="highlight-date">${highlight.date}</span>
                    <span class="highlight-sport">${this.getSportIcon(highlight.sport)} ${highlight.sport}</span>
                </div>
            </div>
        `;

        // Add click handler
        card.onclick = () => this.playHighlight(highlight);

        return card;
    }

    getSportIcon(sport) {
        const icons = {
            football: '⚽',
            basketball: '🏀',
            tennis: '🎾',
            cricket: '🏏',
            baseball: '⚾',
            hockey: '🏒',
            racing: '🏎️',
            mma: '🥊',
            all: '🏆'
        };
        return icons[sport] || '🏅';
    }

    playHighlight(highlight) {
        console.log(`▶️ Playing highlight: ${highlight.title}`);

        // Create video player modal
        const modal = document.createElement('div');
        modal.className = 'highlight-video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <button class="video-modal-close">✕</button>
                <div class="video-container">
                    <div class="video-placeholder">
                        <div class="video-poster" style="background-image: url('${highlight.thumbnail}')">
                            <div class="video-play-large">▶</div>
                        </div>
                        <div class="video-info-overlay">
                            <h2>${highlight.title}</h2>
                            <p>${highlight.league} • ${highlight.views} views • ${highlight.date}</p>
                        </div>
                    </div>
                </div>
                <div class="video-actions">
                    <button class="video-action-btn">👍 Like</button>
                    <button class="video-action-btn">💾 Save</button>
                    <button class="video-action-btn">↗️ Share</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handlers
        modal.querySelector('.video-modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // Emit event for tracking
        window.dispatchEvent(new CustomEvent('highlight:play', {
            detail: highlight
        }));
    }

    injectHighlightsUI() {
        console.log('📺 Injecting highlights UI...');

        // Check if container already exists
        if (document.getElementById('highlights-section')) {
            console.log('✅ Highlights section already exists');
            return;
        }

        // Create main container
        const section = document.createElement('section');
        section.id = 'highlights-section';
        section.className = 'highlights-section';

        // Create category filters
        const categoryTabs = this.config.categories.map(cat =>
            `<button class="category-tab ${cat === 'all' ? 'active' : ''}" data-category="${cat}">
                ${this.getSportIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>`
        ).join('');

        section.innerHTML = `
            <div class="highlights-header">
                <h2>🎬 Event Highlights & Replays</h2>
                <button class="highlights-refresh-btn" id="refresh-highlights">
                    🔄 Refresh
                </button>
            </div>
            <div class="category-filter">
                ${categoryTabs}
            </div>
            <div class="highlights-grid" id="highlights-grid">
                <!-- Highlight cards will be inserted here -->
            </div>
        `;

        // Insert after trending section or cinematic slider
        const insertPoint = document.getElementById('trending-social-section') ||
            document.getElementById('cinematic-slider-4k') ||
            document.querySelector('.hero') ||
            document.querySelector('main') ||
            document.body;

        if (insertPoint.nextSibling) {
            insertPoint.parentNode.insertBefore(section, insertPoint.nextSibling);
        } else {
            insertPoint.parentNode.appendChild(section);
        }

        // Add event listeners
        document.getElementById('refresh-highlights').onclick = () => {
            this.fetchHighlights();
        };

        // Category filter handlers
        section.querySelectorAll('.category-tab').forEach(tab => {
            tab.onclick = () => {
                // Update active state
                section.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update category and refresh display
                this.currentCategory = tab.dataset.category;
                this.updateHighlightsDisplay();
            };
        });

        // Initial display
        this.updateHighlightsDisplay();

        console.log('✅ Highlights UI injected');
    }

    startAutoUpdate() {
        if (!this.config.autoUpdate) {
            console.log('⏸️ Auto-update disabled');
            return;
        }

        console.log(`⏰ Starting auto-update (${this.config.refreshRate / 1000}s interval)`);

        this.updateInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing highlights...');
            this.fetchHighlights();
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
    getHighlights(category = 'all') {
        return category === 'all'
            ? this.highlights
            : this.highlights.filter(h => h.sport === category);
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 66,
            name: 'Event Highlights & Replay Engine',
            highlightsCount: this.highlights.length,
            currentCategory: this.currentCategory,
            autoUpdate: !!this.updateInterval,
            refreshRate: this.config.refreshRate,
            features: {
                videoHighlights: true,
                replayEngine: true,
                categoryFilter: true,
                autoRefresh: this.config.autoUpdate
            }
        };
    }

    destroy() {
        this.stopAutoUpdate();
        const section = document.getElementById('highlights-section');
        if (section) section.remove();
        this.isActive = false;
        console.log('🗑️ Layer 66 destroyed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer66_EventHighlights = new EventHighlightsReplay();
    });
} else {
    window.Layer66_EventHighlights = new EventHighlightsReplay();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventHighlightsReplay;
}
