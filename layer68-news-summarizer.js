/**
 * Layer 68 - Automated News Summarizer
 * AI-powered news summarization and digest system
 * Sport IQ Platform
 */

class AutomatedNewsSummarizer {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.summaries = [];
        this.updateInterval = null;
        this.refreshRate = 180000; // 3 minutes
        this.init();
    }

    async init() {
        console.log('📰 Layer 68: Automated News Summarizer - STARTING');

        // Load configuration
        await this.loadConfig();

        // Initialize summarizer
        this.initializeSummarizer();

        // Start auto-update engine
        this.startAutoUpdate();

        // Inject summaries UI
        this.injectSummariesUI();

        this.isActive = true;
        console.log('✅ Layer 68: Automated News Summarizer - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/news-summarizer-config.json');
            this.config = await response.json();
            console.log('✅ News summarizer config loaded');
        } catch (error) {
            console.warn('⚠️ Using default summarizer config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            sources: ['ESPN', 'BBC Sport', 'Sky Sports', 'Goal.com', 'The Athletic'],
            refreshRate: 180000,
            maxSummaries: 8,
            summaryLength: 'medium',
            displayMode: 'timeline',
            autoUpdate: true,
            categories: ['football', 'basketball', 'tennis', 'cricket', 'all']
        };
    }

    async initializeSummarizer() {
        console.log('🤖 Initializing news summarizer...');

        // Generate mock summaries (in production, use real AI summarization)
        this.summaries = this.generateMockSummaries();

        console.log(`✅ Generated ${this.summaries.length} news summaries`);
    }

    generateMockSummaries() {
        return [
            {
                id: 'summary-1',
                title: 'Champions League Quarter-Finals Set',
                category: 'football',
                source: 'ESPN',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                summary: 'The UEFA Champions League quarter-final draw has been completed. Real Madrid will face Manchester City in a repeat of last year\'s semi-final. Bayern Munich draws Arsenal, while PSG takes on Barcelona. Inter Milan faces Atletico Madrid in the fourth tie.',
                originalLength: '450 words',
                summaryLength: '45 words',
                keyPoints: [
                    'Real Madrid vs Manchester City rematch',
                    'Bayern Munich to play Arsenal',
                    'PSG faces Barcelona',
                    'Inter Milan vs Atletico Madrid'
                ],
                image: 'https://picsum.photos/400/250?random=201',
                url: '#'
            },
            {
                id: 'summary-2',
                title: 'Lakers Secure Playoff Spot with Win Over Warriors',
                category: 'basketball',
                source: 'NBA.com',
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                summary: 'The Los Angeles Lakers clinched their playoff berth with a decisive 118-108 victory over the Golden State Warriors. LeBron James led the way with 32 points and 11 assists. Anthony Davis contributed 28 points and 14 rebounds in the crucial win.',
                originalLength: '380 words',
                summaryLength: '42 words',
                keyPoints: [
                    'Lakers clinch playoff spot',
                    'LeBron James: 32 pts, 11 ast',
                    'Anthony Davis: 28 pts, 14 reb',
                    'Final score: 118-108'
                ],
                image: 'https://picsum.photos/400/250?random=202',
                url: '#'
            },
            {
                id: 'summary-3',
                title: 'Djokovic Withdraws from Madrid Open Due to Injury',
                category: 'tennis',
                source: 'ATP Tour',
                timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
                summary: 'World No. 1 Novak Djokovic has withdrawn from the Madrid Open citing an elbow injury. The Serbian star was scheduled to begin his campaign in the third round. His withdrawal opens up the draw for other contenders including Carlos Alcaraz and Rafael Nadal.',
                originalLength: '520 words',
                summaryLength: '46 words',
                keyPoints: [
                    'Djokovic withdraws with injury',
                    'Elbow problem cited',
                    'Opens draw for Alcaraz, Nadal',
                    'Was set for third round'
                ],
                image: 'https://picsum.photos/400/250?random=203',
                url: '#'
            },
            {
                id: 'summary-4',
                title: 'IPL 2024: Mumbai Indians Top Table After Thrilling Win',
                category: 'cricket',
                source: 'Cricinfo',
                timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
                summary: 'Mumbai Indians have moved to the top of the IPL 2024 points table following a last-ball victory over Chennai Super Kings. Rohit Sharma\'s 89 off 52 balls powered MI to 195/6. CSK fell short by 4 runs in a nail-biting finish at Wankhede Stadium.',
                originalLength: '410 words',
                summaryLength: '48 words',
                keyPoints: [
                    'MI tops IPL table',
                    'Rohit Sharma: 89 off 52',
                    'MI scored 195/6',
                    'Won by 4 runs'
                ],
                image: 'https://picsum.photos/400/250?random=204',
                url: '#'
            },
            {
                id: 'summary-5',
                title: 'F1: Verstappen Dominates Canadian GP Qualifying',
                category: 'racing',
                source: 'Formula1.com',
                timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
                summary: 'Max Verstappen secured pole position for the Canadian Grand Prix with a stunning lap of 1:12.345. The Red Bull driver was 0.4 seconds clear of Lewis Hamilton in second. Charles Leclerc will start third for Ferrari in Sunday\'s race.',
                originalLength: '340 words',
                summaryLength: '40 words',
                keyPoints: [
                    'Verstappen takes pole',
                    'Time: 1:12.345',
                    'Hamilton P2 (+0.4s)',
                    'Leclerc starts P3'
                ],
                image: 'https://picsum.photos/400/250?random=205',
                url: '#'
            },
            {
                id: 'summary-6',
                title: 'Premier League: Arsenal Extends Lead to 5 Points',
                category: 'football',
                source: 'Sky Sports',
                timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
                summary: 'Arsenal maintained their Premier League title charge with a 3-1 victory over Tottenham in the North London derby. Bukayo Saka scored twice, while Martin Ødegaard added a third. The win extends Arsenal\'s lead over Manchester City to five points with six games remaining.',
                originalLength: '480 words',
                summaryLength: '44 words',
                keyPoints: [
                    'Arsenal beats Spurs 3-1',
                    'Saka scores brace',
                    '5-point lead over City',
                    '6 games remaining'
                ],
                image: 'https://picsum.photos/400/250?random=206',
                url: '#'
            },
            {
                id: 'summary-7',
                title: 'NHL: Oilers Advance to Conference Finals',
                category: 'hockey',
                source: 'NHL.com',
                timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
                summary: 'The Edmonton Oilers have advanced to the Western Conference Finals after defeating the Vegas Golden Knights 5-2 in Game 6. Connor McDavid recorded 4 assists, bringing his playoff total to 28 points. The Oilers will face the Dallas Stars in the next round.',
                originalLength: '395 words',
                summaryLength: '47 words',
                keyPoints: [
                    'Oilers win series 4-2',
                    'McDavid: 4 assists (28 playoff pts)',
                    'Defeated Golden Knights 5-2',
                    'Faces Dallas Stars next'
                ],
                image: 'https://picsum.photos/400/250?random=207',
                url: '#'
            },
            {
                id: 'summary-8',
                title: 'UFC 300: Main Event Headliner Announced',
                category: 'mma',
                source: 'UFC',
                timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
                summary: 'UFC President Dana White announced the main event for UFC 300. The historic milestone card will feature a light heavyweight title fight between champion Alex Pereira and former champion Jamahal Hill. The event is scheduled for April 13 in Las Vegas.',
                originalLength: '430 words',
                summaryLength: '42 words',
                keyPoints: [
                    'Pereira vs Hill title fight',
                    'UFC 300 main event',
                    'April 13 in Las Vegas',
                    'Light heavyweight championship'
                ],
                image: 'https://picsum.photos/400/250?random=208',
                url: '#'
            }
        ];
    }

    injectSummariesUI() {
        console.log('📄 Injecting summaries UI...');

        if (document.getElementById('news-summaries-section')) {
            console.log('✅ Summaries section already exists');
            return;
        }

        const section = document.createElement('section');
        section.id = 'news-summaries-section';
        section.className = 'summaries-section';

        section.innerHTML = `
            <div class="summaries-header">
                <h2>📰 News Digest & Summaries</h2>
                <div class="summaries-controls">
                    <select class="summaries-category-filter" id="summaries-category">
                        <option value="all">All Categories</option>
                        <option value="football">⚽ Football</option>
                        <option value="basketball">🏀 Basketball</option>
                        <option value="tennis">🎾 Tennis</option>
                        <option value="cricket">🏏 Cricket</option>
                        <option value="racing">🏎️ Racing</option>
                        <option value="hockey">🏒 Hockey</option>
                        <option value="mma">🥊 MMA</option>
                    </select>
                    <button class="summaries-refresh-btn" id="refresh-summaries">
                        🔄 Refresh
                    </button>
                </div>
            </div>
            <div class="summaries-timeline" id="summaries-timeline">
                <!-- Summary cards will be inserted here -->
            </div>
        `;

        // Insert after polls section
        const insertPoint = document.getElementById('polls-section') ||
            document.getElementById('highlights-section') ||
            document.getElementById('trending-social-section') ||
            document.querySelector('main') ||
            document.body;

        if (insertPoint.nextSibling) {
            insertPoint.parentNode.insertBefore(section, insertPoint.nextSibling);
        } else {
            insertPoint.parentNode.appendChild(section);
        }

        // Add event listeners
        document.getElementById('refresh-summaries').onclick = () => {
            this.refreshSummaries();
        };

        document.getElementById('summaries-category').onchange = (e) => {
            this.filterByCategory(e.target.value);
        };

        // Initial display
        this.displaySummaries();

        console.log('✅ Summaries UI injected');
    }

    displaySummaries(category = 'all') {
        const container = document.getElementById('summaries-timeline');
        if (!container) return;

        container.innerHTML = '';

        const filtered = category === 'all'
            ? this.summaries
            : this.summaries.filter(s => s.category === category);

        filtered.slice(0, this.config.maxSummaries).forEach((summary, index) => {
            const card = this.createSummaryCard(summary, index);
            container.appendChild(card);
        });

        console.log(`✅ Displayed ${filtered.length} summaries`);
    }

    createSummaryCard(summary, index) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        card.dataset.summaryId = summary.id;

        const timeAgo = this.getTimeAgo(summary.timestamp);
        const compressionRate = Math.round((1 - (parseInt(summary.summaryLength) / parseInt(summary.originalLength))) * 100);

        card.innerHTML = `
            <div class="summary-image">
                <img src="${summary.image}" alt="${summary.title}" loading="lazy">
                <div class="summary-category-badge">${this.getCategoryIcon(summary.category)} ${summary.category}</div>
            </div>
            <div class="summary-content">
                <div class="summary-meta">
                    <span class="summary-source">📡 ${summary.source}</span>
                    <span class="summary-time">🕐 ${timeAgo}</span>
                </div>
                <h3 class="summary-title">${summary.title}</h3>
                <p class="summary-text">${summary.summary}</p>
                <div class="summary-key-points">
                    <strong>Key Points:</strong>
                    <ul>
                        ${summary.keyPoints.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
                <div class="summary-footer">
                    <span class="summary-compression">
                        🤖 ${compressionRate}% compression (${summary.originalLength} → ${summary.summaryLength})
                    </span>
                    <a href="${summary.url}" class="summary-read-more">Read Full Article →</a>
                </div>
            </div>
        `;

        return card;
    }

    getCategoryIcon(category) {
        const icons = {
            football: '⚽',
            basketball: '🏀',
            tennis: '🎾',
            cricket: '🏏',
            racing: '🏎️',
            hockey: '🏒',
            mma: '🥊'
        };
        return icons[category] || '🏆';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diff = now - then;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    filterByCategory(category) {
        console.log(`🔍 Filtering by category: ${category}`);
        this.displaySummaries(category);
    }

    refreshSummaries() {
        console.log('🔄 Refreshing summaries...');

        // Simulate new summaries arriving
        this.summaries.forEach(summary => {
            summary.timestamp = new Date(new Date(summary.timestamp).getTime() - 60000).toISOString();
        });

        const currentCategory = document.getElementById('summaries-category').value;
        this.displaySummaries(currentCategory);
    }

    startAutoUpdate() {
        if (!this.config.autoUpdate) return;

        console.log(`⏰ Starting auto-update (${this.config.refreshRate / 1000}s interval)`);

        this.updateInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing summaries...');
            this.refreshSummaries();
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
    getSummaries(category = 'all') {
        return category === 'all'
            ? this.summaries
            : this.summaries.filter(s => s.category === category);
    }

    getSummaryById(id) {
        return this.summaries.find(s => s.id === id);
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 68,
            name: 'Automated News Summarizer',
            summariesCount: this.summaries.length,
            autoUpdate: !!this.updateInterval,
            refreshRate: this.config.refreshRate,
            features: {
                summarization: true,
                keyPoints: true,
                categoryFilter: true,
                autoRefresh: this.config.autoUpdate
            }
        };
    }

    destroy() {
        this.stopAutoUpdate();
        const section = document.getElementById('news-summaries-section');
        if (section) section.remove();
        this.isActive = false;
        console.log('🗑️ Layer 68 destroyed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer68_NewsSummarizer = new AutomatedNewsSummarizer();
    });
} else {
    window.Layer68_NewsSummarizer = new AutomatedNewsSummarizer();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedNewsSummarizer;
}
