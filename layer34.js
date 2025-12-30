/**
 * Layer 34: Search & Filter Engine
 * Standalone runtime for full-text search and filtering
 */

class Layer34Search {
    constructor() {
        if (window.__LAYER34__) return window.__LAYER34__;

        this.layerId = 'layer-034';
        this.name = 'Search & Filter Engine';
        this.version = '1.0.0';

        this.searchIndex = [];

        console.log(`[Layer 34 v${this.version}] Initializing Search Engine...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._buildIndex();
        this._setupSearchUI();
        this._registerWithCoreEngines();
        console.log('[Layer 34] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer34-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                minQueryLength: 2,
                maxResults: 10,
                enableFuzzy: true
            };
        }
    }

    _buildIndex() {
        // Integrate with CMS if available, otherwise use placeholder
        if (window.__ANTIGRAVITY_CMS__) {
            const articles = window.__ANTIGRAVITY_CMS__.getArticles();
            this.searchIndex = articles.map(a => ({
                id: a.id,
                title: a.title,
                content: a.content || '',
                tags: a.tags || [],
                slug: a.slug,
                type: 'article'
            }));
            console.log(`[Layer 34] Indexed ${this.searchIndex.length} items`);
        }
    }

    _setupSearchUI() {
        const container = document.getElementById('layer34-search-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer34-widget">
                <input type="text" id="layer34-input" placeholder="Search content..." autocomplete="off">
                <div id="layer34-results" class="layer34-results hidden"></div>
            </div>
        `;

        const input = document.getElementById('layer34-input');
        input.addEventListener('input', (e) => this._handleInput(e.target.value));
        input.addEventListener('focus', () => {
            if (input.value.length >= this.config.minQueryLength) {
                document.getElementById('layer34-results').classList.remove('hidden');
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                document.getElementById('layer34-results').classList.add('hidden');
            }
        });
    }

    _handleInput(query) {
        const resultsContainer = document.getElementById('layer34-results');

        if (query.length < this.config.minQueryLength) {
            resultsContainer.classList.add('hidden');
            return;
        }

        const results = this.search(query);
        this._renderResults(results);
        resultsContainer.classList.remove('hidden');
    }

    search(query) {
        const q = query.toLowerCase();
        return this.searchIndex
            .filter(item => {
                const titleMatch = item.title.toLowerCase().includes(q);
                const tagMatch = item.tags.some(t => t.toLowerCase().includes(q));
                return titleMatch || tagMatch;
            })
            .slice(0, this.config.maxResults);
    }

    _renderResults(results) {
        const container = document.getElementById('layer34-results');

        if (results.length === 0) {
            container.innerHTML = '<div class="layer34-no-results">No results found</div>';
            return;
        }

        container.innerHTML = results.map(r => `
            <a href="/article/${r.slug}" class="layer34-result-item">
                <span class="layer34-title">${r.title}</span>
                <span class="layer34-type">${r.type}</span>
            </a>
        `).join('');
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 34] Connected to Runtime');
            });
        }

        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.on('content:updated', () => {
                this._buildIndex(); // Rebuild index on content update
            });
        }
    }
}

const layer34 = new Layer34Search();
window.__LAYER34__ = layer34;
export default layer34;
