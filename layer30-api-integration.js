/**
 * Layer 30: API Integration & External Data Runtime
 * Standalone implementation with API connectors, data mapping, and external service integration
 */

class APIIntegrationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_API_INTEGRATION__) {
            return window.__ANTIGRAVITY_API_INTEGRATION__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-030';
        this.name = 'API Integration & External Data';

        this.connectors = new Map();
        this.cache = new Map();
        this.pendingRequests = new Map();

        console.log(`[API Integration v${this.version}] Initializing...`);
        this._init();
    }

    async _init() {
        try {
            await this._loadConfig();
            await this._registerConnectors();
            this._setupCaching();
            this._setupRequestQueue();
            console.log('[API Integration] Fully initialized');
        } catch (error) {
            console.error('[API Integration] Init error:', error);
        }
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/api-integration-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = this._getDefaultConfig();
        }
    }

    _getDefaultConfig() {
        return {
            cacheEnabled: true,
            cacheTTL: 300000,
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000,
            rateLimit: {
                enabled: true,
                maxRequests: 100,
                perMinute: 60
            },
            endpoints: {}
        };
    }

    async _registerConnectors() {
        // Sports Data API
        this.connectors.set('sportsdata', {
            baseUrl: 'https://api.sportsdata.io/v3',
            key: this.config.endpoints?.sportsdata?.apiKey || '',
            endpoints: {
                scores: '/scores/json/ScoresByDate/{sport}/{date}',
                teams: '/teams/json/Teams/{sport}',
                players: '/players/json/Players/{sport}',
                standings: '/standings/json/Standings/{sport}/{season}'
            },
            transform: (data) => this._transformSportsData(data)
        });

        // News API
        this.connectors.set('newsapi', {
            baseUrl: 'https://newsapi.org/v2',
            key: this.config.endpoints?.newsapi?.apiKey || '',
            endpoints: {
                headlines: '/top-headlines',
                search: '/everything',
                sources: '/sources'
            },
            transform: (data) => this._transformNewsData(data)
        });

        // Weather API (for match conditions)
        this.connectors.set('weather', {
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            key: this.config.endpoints?.weather?.apiKey || '',
            endpoints: {
                current: '/weather',
                forecast: '/forecast'
            },
            transform: (data) => this._transformWeatherData(data)
        });

        // Social Media API
        this.connectors.set('social', {
            baseUrl: 'https://api.twitter.com/2',
            key: this.config.endpoints?.social?.apiKey || '',
            endpoints: {
                tweets: '/tweets/search/recent',
                user: '/users/{id}'
            },
            transform: (data) => this._transformSocialData(data)
        });

        console.log(`[API Integration] Registered ${this.connectors.size} connectors`);
    }

    _setupCaching() {
        if (!this.config.cacheEnabled) return;

        // Clean expired cache every minute
        setInterval(() => {
            const now = Date.now();
            this.cache.forEach((value, key) => {
                if (value.expires < now) {
                    this.cache.delete(key);
                }
            });
        }, 60000);
    }

    _setupRequestQueue() {
        this.requestQueue = [];
        this.requestCount = 0;
        this.requestWindowStart = Date.now();

        // Reset request count every minute
        setInterval(() => {
            this.requestCount = 0;
            this.requestWindowStart = Date.now();
        }, 60000);
    }

    async fetchData(connectorId, endpoint, params = {}, options = {}) {
        const connector = this.connectors.get(connectorId);
        if (!connector) {
            throw new Error(`Unknown connector: ${connectorId}`);
        }

        // Check rate limit
        if (this.config.rateLimit.enabled && this.requestCount >= this.config.rateLimit.maxRequests) {
            throw new Error('Rate limit exceeded');
        }

        // Check cache
        const cacheKey = this._getCacheKey(connectorId, endpoint, params);
        if (this.config.cacheEnabled && !options.skipCache) {
            const cached = this._getFromCache(cacheKey);
            if (cached) {
                console.log(`[API Integration] Cache hit: ${cacheKey}`);
                return cached;
            }
        }

        // Build URL
        const url = this._buildUrl(connector, endpoint, params);

        // Execute request with retry
        const data = await this._executeWithRetry(url, connector, options);

        // Transform data
        const transformed = connector.transform ? connector.transform(data) : data;

        // Cache result
        if (this.config.cacheEnabled) {
            this._setCache(cacheKey, transformed);
        }

        // Track request
        this.requestCount++;

        // Emit event
        this._emitEvent('api:data-fetched', {
            connector: connectorId,
            endpoint,
            timestamp: Date.now()
        });

        return transformed;
    }

    _buildUrl(connector, endpoint, params) {
        let url = connector.baseUrl;

        if (connector.endpoints[endpoint]) {
            url += connector.endpoints[endpoint];
        } else {
            url += endpoint;
        }

        // Replace path params
        Object.keys(params).forEach(key => {
            url = url.replace(`{${key}}`, params[key]);
        });

        // Add query params
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (!url.includes(`{${key}}`)) {
                queryParams.append(key, params[key]);
            }
        });

        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }

        return url;
    }

    async _executeWithRetry(url, connector, options) {
        let lastError;
        const maxAttempts = options.retryAttempts || this.config.retryAttempts;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${connector.key}`,
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    signal: AbortSignal.timeout(this.config.timeout)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();

            } catch (error) {
                lastError = error;
                console.warn(`[API Integration] Attempt ${attempt + 1} failed:`, error.message);

                if (attempt < maxAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
                }
            }
        }

        throw lastError;
    }

    // Data transformers
    _transformSportsData(data) {
        return {
            type: 'sports',
            data: data,
            normalized: true,
            timestamp: Date.now()
        };
    }

    _transformNewsData(data) {
        if (data.articles) {
            return data.articles.map(article => ({
                id: article.url,
                title: article.title,
                description: article.description,
                url: article.url,
                image: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source.name
            }));
        }
        return data;
    }

    _transformWeatherData(data) {
        return {
            temperature: data.main?.temp,
            conditions: data.weather?.[0]?.main,
            description: data.weather?.[0]?.description,
            humidity: data.main?.humidity,
            windSpeed: data.wind?.speed
        };
    }

    _transformSocialData(data) {
        if (data.data) {
            return data.data.map(tweet => ({
                id: tweet.id,
                text: tweet.text,
                createdAt: tweet.created_at,
                author: tweet.author_id
            }));
        }
        return data;
    }

    // Cache methods
    _getCacheKey(connector, endpoint, params) {
        return `${connector}:${endpoint}:${JSON.stringify(params)}`;
    }

    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        return null;
    }

    _setCache(key, data) {
        this.cache.set(key, {
            data,
            expires: Date.now() + this.config.cacheTTL
        });
    }

    clearCache(connectorId = null) {
        if (connectorId) {
            this.cache.forEach((value, key) => {
                if (key.startsWith(connectorId + ':')) {
                    this.cache.delete(key);
                }
            });
        } else {
            this.cache.clear();
        }
    }

    // Public API
    async getSportsScores(sport, date) {
        return await this.fetchData('sportsdata', 'scores', { sport, date });
    }

    async getNews(query, options = {}) {
        return await this.fetchData('newsapi', 'search', { q: query, ...options });
    }

    async getWeather(location) {
        return await this.fetchData('weather', 'current', { q: location });
    }

    async getSocialFeed(query) {
        return await this.fetchData('social', 'tweets', { query });
    }

    getConnectorStatus() {
        const status = {};
        this.connectors.forEach((connector, id) => {
            status[id] = {
                registered: true,
                hasApiKey: !!connector.key,
                baseUrl: connector.baseUrl
            };
        });
        return status;
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    getState() {
        return {
            connectors: this.connectors.size,
            cacheSize: this.cache.size,
            requestCount: this.requestCount,
            rateLimit: this.config.rateLimit
        };
    }
}

// Initialize and export
const apiIntegration = new APIIntegrationRuntime();
window.__ANTIGRAVITY_API_INTEGRATION__ = apiIntegration;

// Register with core engines
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[API Integration] Registered with runtime');
    });
}

if (window.__ANTIGRAVITY_API__) {
    // Enhance existing API client with integration features
    window.__ANTIGRAVITY_API__.useIntegration = (connectorId) => {
        return apiIntegration.connectors.get(connectorId);
    };
}

export default apiIntegration;
