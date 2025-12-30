/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 93: ADVANCED SEARCH & FILTER ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Global search functionality, dynamic filtering, sorting, indexing
 * Features: High-performance search, multi-category filters, sort options
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        search: {
            configPath: '../api-json/search-config.json',
            minChars: 2,
            debounceMs: 300,
            maxResults: 20
        },
        events: {
            searchStarted: 'search:started',
            resultsUpdated: 'search:results-updated',
            filtersChanged: 'search:filters-changed'
        }
    };

    const state = {
        index: [],
        filters: {
            category: 'all',
            type: 'all',
            sort: 'relevance',
            dateRange: 'all'
        },
        recentSearches: [],
        config: null,
        timer: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SEARCH ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SearchEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.search.configPath);
                if (response.ok) {
                    state.config = await response.json();

                    // Load indexable content
                    if (state.config.indexableContent) {
                        this.addToIndex(state.config.indexableContent);
                    }

                    // Add external sources if available
                    this.indexExternalSources();
                }
            } catch (error) {
                console.warn('⚠️ [Search] Failed to load config');
            }

            console.log('🔍 [Search] Engine initialized');
        },

        addToIndex: function (items) {
            items.forEach(item => {
                state.index.push({
                    id: item.id,
                    title: item.title,
                    description: item.description || '',
                    category: item.category,
                    type: item.type,
                    tags: item.tags || [],
                    timestamp: item.timestamp || Date.now(),
                    popularity: item.popularity || 0,
                    searchString: this.createSearchString(item)
                });
            });
        },

        createSearchString: function (item) {
            return `${item.title} ${item.description} ${item.category} ${(item.tags || []).join(' ')}`.toLowerCase();
        },

        indexExternalSources: function () {
            // Index content from other layers if available
            if (window.NewsAggregator) {
                const news = window.NewsAggregator.getAllArticles();
                this.addToIndex(news.map(n => ({ ...n, type: 'news', category: 'news' })));
            }

            if (window.VideoEngine) {
                const videos = window.VideoEngine.getVideos();
                this.addToIndex(videos.map(v => ({ ...v, type: 'video', category: 'video' })));
            }
        },

        search: function (query) {
            if (!query || query.length < CONFIG.search.minChars) {
                return [];
            }

            const normalizedQuery = query.toLowerCase();
            const terms = normalizedQuery.split(' ');

            let results = state.index.filter(item => {
                // Filter by category/type
                if (state.filters.category !== 'all' && item.category !== state.filters.category) return false;
                if (state.filters.type !== 'all' && item.type !== state.filters.type) return false;

                // Text matching
                return terms.every(term => item.searchString.includes(term));
            });

            // Apply sorting
            results = this.sortResults(results, normalizedQuery);

            // Limit results
            return results.slice(0, CONFIG.search.maxResults);
        },

        sortResults: function (results, query) {
            const sortMode = state.filters.sort;

            return results.sort((a, b) => {
                if (sortMode === 'date') {
                    return b.timestamp - a.timestamp;
                }

                if (sortMode === 'popularity') {
                    return b.popularity - a.popularity;
                }

                // Relevance scoring
                const scoreA = this.calculateRelevance(a, query);
                const scoreB = this.calculateRelevance(b, query);

                return scoreB - scoreA;
            });
        },

        calculateRelevance: function (item, query) {
            let score = 0;

            // Exact title match
            if (item.title.toLowerCase() === query) score += 100;

            // Title starts with query
            if (item.title.toLowerCase().startsWith(query)) score += 50;

            // Title contains query
            if (item.title.toLowerCase().includes(query)) score += 20;

            // Tag match
            if (item.tags.some(t => t.toLowerCase() === query)) score += 30;

            // Popularity boost
            score += (item.popularity || 0) * 0.1;

            return score;
        },

        performSearch: function (query) {
            clearTimeout(state.timer);

            state.timer = setTimeout(() => {
                const results = this.search(query);

                // Add to recent searches
                if (query.length > 3 && results.length > 0) {
                    this.addToRecent(query);
                }

                const event = new CustomEvent(CONFIG.events.resultsUpdated, {
                    detail: { query, results, count: results.length, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                this.renderResults(results);

            }, CONFIG.search.debounceMs);
        },

        addToRecent: function (query) {
            state.recentSearches = [query, ...state.recentSearches.filter(q => q !== query)].slice(0, 5);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FILTER MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const FilterManager = {
        setFilter: function (key, value) {
            if (state.filters[key] !== undefined) {
                state.filters[key] = value;

                const event = new CustomEvent(CONFIG.events.filtersChanged, {
                    detail: { filters: state.filters, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                // Re-trigger search if active
                const searchInput = document.getElementById('global-search-input');
                if (searchInput && searchInput.value) {
                    SearchEngine.performSearch(searchInput.value);
                }
            }
        },

        getFilters: function () {
            return state.filters;
        },

        resetFilters: function () {
            state.filters = {
                category: 'all',
                type: 'all',
                sort: 'relevance',
                dateRange: 'all'
            };
            this.setFilter('category', 'all'); // Trigger update
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const SearchRenderer = {
        renderSearchBar: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="search-container">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="global-search-input" 
                               class="search-input" 
                               placeholder="Search sports, news, videos..."
                               autocomplete="off">
                        <button class="filter-toggle" onclick="window.SearchSystem.toggleFilters()">⚙️</button>
                    </div>
                    
                    <div id="filter-panel" class="filter-panel hidden">
                        <div class="filter-group">
                            <label>Category</label>
                            <select onchange="window.SearchSystem.setFilter('category', this.value)">
                                <option value="all">All Categories</option>
                                <option value="news">News</option>
                                <option value="video">Videos</option>
                                <option value="player">Players</option>
                                <option value="team">Teams</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Sort By</label>
                            <select onchange="window.SearchSystem.setFilter('sort', this.value)">
                                <option value="relevance">Relevance</option>
                                <option value="date">Newest</option>
                                <option value="popularity">Popular</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="search-results" class="search-results hidden"></div>
                </div>
            `;

            // Add listeners
            const input = document.getElementById('global-search-input');
            input.addEventListener('input', (e) => SearchEngine.performSearch(e.target.value));
            input.addEventListener('focus', () => {
                const results = document.getElementById('search-results');
                if (input.value.length >= CONFIG.search.minChars) {
                    results.classList.remove('hidden');
                }
            });
        },

        toggleFilters: function () {
            const panel = document.getElementById('filter-panel');
            panel.classList.toggle('hidden');
        },

        renderResults: function (results) {
            const container = document.getElementById('search-results');
            if (!container) return;

            container.classList.remove('hidden');

            if (results.length === 0) {
                container.innerHTML = '<div class="no-results">No matches found</div>';
                return;
            }

            container.innerHTML = results.map(item => `
                <div class="search-result-item" onclick="window.location.href='${item.url || '#'}'">
                    <div class="result-icon">${this.getIcon(item.type)}</div>
                    <div class="result-content">
                        <div class="result-title">${item.title}</div>
                        <div class="result-meta">
                            <span class="result-category">${item.category}</span>
                            ${item.type !== 'player' ? `<span class="result-date">${new Date(item.timestamp).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        },

        getIcon: function (type) {
            const icons = {
                news: '📰',
                video: '🎥',
                player: '👤',
                team: '🛡️',
                match: '⚽',
                default: '📄'
            };
            return icons[type] || icons.default;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.SearchSystem = {
        init: SearchEngine.initialize.bind(SearchEngine),
        search: SearchEngine.performSearch.bind(SearchEngine),
        setFilter: FilterManager.setFilter.bind(FilterManager),
        getFilters: FilterManager.getFilters.bind(FilterManager),
        resetFilters: FilterManager.resetFilters.bind(FilterManager),
        render: SearchRenderer.renderSearchBar.bind(SearchRenderer),
        toggleFilters: SearchRenderer.toggleFilters.bind(SearchRenderer),
        addToIndex: SearchEngine.addToIndex.bind(SearchEngine),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SearchEngine.initialize());
    } else {
        SearchEngine.initialize();
    }

})();
