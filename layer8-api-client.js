/**
 * Layer 8: Data Fetching and API Integration Runtime
 * ID: layer-008
 * Type: Core
 * Description: Centralized API client for all HTTP requests with retries, caching, authentication, and error handling.
 */

class APIClientRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_API__) {
            console.warn('[API] API client already initialized.');
            return window.__ANTIGRAVITY_API__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-008';
        this.name = 'API Client Runtime';
        this.timestamp = new Date().toISOString();

        // Configuration
        this.config = null;
        this.baseURL = '';
        this.defaultHeaders = {};
        this.authToken = null;

        // Request management
        this.requestQueue = [];
        this.activeRequests = new Map();
        this.abortControllers = new Map();

        // Caching
        this.cache = new Map();
        this.cacheConfig = {
            enabled: true,
            ttl: 300000, // 5 minutes default
            maxSize: 100
        };

        // Retry configuration
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            retryOn: [408, 429, 500, 502, 503, 504],
            backoffMultiplier: 2
        };

        // Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedResponses: 0,
            retriedRequests: 0,
            avgResponseTime: 0
        };

        console.log(`[API v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize API client
     */
    async _init() {
        try {
            await this._loadConfig();
            this._setupDefaults();
            this._registerEvents();
            console.log('[API] Initialized successfully');
        } catch (error) {
            console.error('[API] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'api:init');
            }
        }
    }

    /**
     * Load API configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/api-config.json');
            if (response.ok) {
                this.config = await response.json();
                console.log('[API] Configuration loaded');
            } else {
                this.config = this._getDefaultConfig();
            }
        } catch (error) {
            console.warn('[API] Using default configuration:', error);
            this.config = this._getDefaultConfig();
        }
    }

    /**
     * Get default configuration
     */
    _getDefaultConfig() {
        return {
            baseURL: '',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            endpoints: {},
            cache: {
                enabled: true,
                ttl: 300000,
                maxSize: 100
            },
            retry: {
                maxRetries: 3,
                retryDelay: 1000,
                backoffMultiplier: 2
            }
        };
    }

    /**
     * Setup defaults from configuration
     */
    _setupDefaults() {
        this.baseURL = this.config.baseURL || '';
        this.defaultHeaders = { ...this.config.headers };

        if (this.config.cache) {
            this.cacheConfig = { ...this.cacheConfig, ...this.config.cache };
        }

        if (this.config.retry) {
            this.retryConfig = { ...this.retryConfig, ...this.config.retry };
        }
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const requestId = this._generateRequestId();
        const startTime = performance.now();

        try {
            // Build full URL
            const url = this._buildURL(endpoint, options.params);

            // Check cache first (for GET requests)
            if (options.method === 'GET' || !options.method) {
                const cached = this._getFromCache(url);
                if (cached) {
                    this.metrics.cachedResponses++;
                    return cached;
                }
            }

            // Prepare request options
            const fetchOptions = this._prepareFetchOptions(options);

            // Create abort controller
            const abortController = new AbortController();
            this.abortControllers.set(requestId, abortController);
            fetchOptions.signal = abortController.signal;

            // Execute request with retry logic
            const response = await this._fetchWithRetry(url, fetchOptions, requestId);

            // Update metrics
            const responseTime = performance.now() - startTime;
            this._updateMetrics(true, responseTime);

            // Emit success event
            this._emitEvent('api:request-success', {
                requestId,
                endpoint,
                method: options.method || 'GET',
                responseTime
            });

            return response;

        } catch (error) {
            // Update metrics
            const responseTime = performance.now() - startTime;
            this._updateMetrics(false, responseTime);

            // Emit error event
            this._emitEvent('api:request-error', {
                requestId,
                endpoint,
                error: error.message,
                responseTime
            });

            // Normalize and throw error
            throw this._normalizeError(error);

        } finally {
            // Cleanup
            this.abortControllers.delete(requestId);
            this.activeRequests.delete(requestId);
        }
    }

    /**
     * Fetch with retry logic
     */
    async _fetchWithRetry(url, options, requestId, retryCount = 0) {
        try {
            // Add timeout
            const timeoutId = setTimeout(() => {
                const controller = this.abortControllers.get(requestId);
                if (controller) controller.abort();
            }, this.config.timeout || 30000);

            // Make request
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            // Check if response is ok
            if (!response.ok) {
                // Check if we should retry
                if (this._shouldRetry(response.status, retryCount)) {
                    return await this._retry(url, options, requestId, retryCount);
                }

                // Throw error for non-ok responses
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse response
            const data = await this._parseResponse(response);

            // Cache if applicable
            if (options.method === 'GET' || !options.method) {
                this._saveToCache(url, data);
            }

            return data;

        } catch (error) {
            // Handle abort
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            // Retry on network errors
            if (retryCount < this.retryConfig.maxRetries) {
                return await this._retry(url, options, requestId, retryCount);
            }

            throw error;
        }
    }

    /**
     * Retry request with exponential backoff
     */
    async _retry(url, options, requestId, retryCount) {
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);

        console.log(`[API] Retrying request (${retryCount + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);

        this.metrics.retriedRequests++;

        await this._wait(delay);
        return await this._fetchWithRetry(url, options, requestId, retryCount + 1);
    }

    /**
     * Check if request should be retried
     */
    _shouldRetry(statusCode, retryCount) {
        return retryCount < this.retryConfig.maxRetries &&
            this.retryConfig.retryOn.includes(statusCode);
    }

    /**
     * Parse response based on content type
     */
    async _parseResponse(response) {
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('text/')) {
            return await response.text();
        } else if (contentType && contentType.includes('application/octet-stream')) {
            return await response.blob();
        } else {
            return await response.json(); // Default to JSON
        }
    }

    /**
     * Build full URL with query parameters
     */
    _buildURL(endpoint, params) {
        let url = endpoint;

        // Add base URL if endpoint is relative
        if (!endpoint.startsWith('http')) {
            url = this.baseURL + endpoint;
        }

        // Add query parameters
        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url += (url.includes('?') ? '&' : '?') + queryString;
        }

        return url;
    }

    /**
     * Prepare fetch options
     */
    _prepareFetchOptions(options) {
        const fetchOptions = {
            method: options.method || 'GET',
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };

        // Add auth token if available
        if (this.authToken) {
            fetchOptions.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        // Add body for non-GET requests
        if (options.body && fetchOptions.method !== 'GET') {
            if (typeof options.body === 'object') {
                fetchOptions.body = JSON.stringify(options.body);
            } else {
                fetchOptions.body = options.body;
            }
        }

        // Add credentials if specified
        if (options.credentials) {
            fetchOptions.credentials = options.credentials;
        }

        return fetchOptions;
    }

    /**
     * Cache management
     */
    _getFromCache(key) {
        if (!this.cacheConfig.enabled) return null;

        const cached = this.cache.get(key);
        if (!cached) return null;

        // Check if cache is still valid
        if (Date.now() - cached.timestamp > this.cacheConfig.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    _saveToCache(key, data) {
        if (!this.cacheConfig.enabled) return;

        // Enforce max cache size
        if (this.cache.size >= this.cacheConfig.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }

        this._emitEvent('api:cache-cleared', { key });
    }

    /**
     * Convenience methods
     */
    async get(endpoint, params = null, options = {}) {
        return await this.request(endpoint, { ...options, method: 'GET', params });
    }

    async post(endpoint, body, options = {}) {
        return await this.request(endpoint, { ...options, method: 'POST', body });
    }

    async put(endpoint, body, options = {}) {
        return await this.request(endpoint, { ...options, method: 'PUT', body });
    }

    async patch(endpoint, body, options = {}) {
        return await this.request(endpoint, { ...options, method: 'PATCH', body });
    }

    async delete(endpoint, options = {}) {
        return await this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * GraphQL support
     */
    async graphql(query, variables = {}, options = {}) {
        const endpoint = this.config.graphqlEndpoint || '/graphql';

        return await this.post(endpoint, {
            query,
            variables
        }, options);
    }

    /**
     * Authentication
     */
    setAuthToken(token) {
        this.authToken = token;
        this._emitEvent('api:auth-token-set', { hasToken: !!token });
    }

    clearAuthToken() {
        this.authToken = null;
        this._emitEvent('api:auth-token-cleared');
    }

    getAuthToken() {
        return this.authToken;
    }

    /**
     * Request cancellation
     */
    cancelRequest(requestId) {
        const controller = this.abortControllers.get(requestId);
        if (controller) {
            controller.abort();
            this._emitEvent('api:request-cancelled', { requestId });
        }
    }

    cancelAllRequests() {
        this.abortControllers.forEach((controller, requestId) => {
            controller.abort();
        });
        this.abortControllers.clear();
        this._emitEvent('api:all-requests-cancelled');
    }

    /**
     * Named endpoints from configuration
     */
    async callEndpoint(name, options = {}) {
        const endpoint = this.config.endpoints ? this.config.endpoints[name] : null;

        if (!endpoint) {
            throw new Error(`Endpoint '${name}' not found in configuration`);
        }

        return await this.request(endpoint, options);
    }

    /**
     * Utilities
     */
    _generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _normalizeError(error) {
        return {
            message: error.message || 'Unknown error',
            status: error.status || null,
            code: error.code || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString()
        };
    }

    _updateMetrics(success, responseTime) {
        this.metrics.totalRequests++;

        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }

        // Update average response time
        const totalTime = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1);
        this.metrics.avgResponseTime = (totalTime + responseTime) / this.metrics.totalRequests;
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    /**
     * Register event listeners
     */
    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Listen for cache clear requests
        eventBus.on('api:clear-cache', (data) => {
            this.clearCache(data?.key);
        });

        // Listen for auth token updates
        eventBus.on('auth:token-updated', (data) => {
            if (data.token) {
                this.setAuthToken(data.token);
            }
        });
    }

    /**
     * Get current state
     */
    getState() {
        return {
            baseURL: this.baseURL,
            hasAuthToken: !!this.authToken,
            cacheSize: this.cache.size,
            activeRequests: this.activeRequests.size,
            metrics: { ...this.metrics }
        };
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.metrics.totalRequests > 0
                ? Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100)
                : 0,
            cacheHitRate: this.metrics.totalRequests > 0
                ? Math.round((this.metrics.cachedResponses / this.metrics.totalRequests) * 100)
                : 0
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        this.cancelAllRequests();
        this.clearCache();
        console.log('[API] Destroyed');
    }
}

// Initialize and Export
const apiClient = new APIClientRuntime();
window.__ANTIGRAVITY_API__ = apiClient;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[API] Registered with runtime');
    });
}

export default apiClient;
