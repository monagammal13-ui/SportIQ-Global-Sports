/**
 * Layer 9: State Management and Data Store Runtime
 * ID: layer-009
 * Type: Core
 * Description: Centralized reactive state management with persistence, transactions, and event-driven updates.
 */

class StateStoreRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_STATE__) {
            console.warn('[StateStore] State store already initialized.');
            return window.__ANTIGRAVITY_STATE__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-009';
        this.name = 'State Store Runtime';
        this.timestamp = new Date().toISOString();

        // State storage
        this.state = {};
        this.initialState = {};

        // Subscribers and watchers
        this.subscribers = new Map(); // Map<key, Set<callback>>
        this.globalSubscribers = new Set();

        // State history for time travel
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;

        // Middleware
        this.middleware = [];

        // Persistence configuration
        this.persistence = {
            enabled: false,
            storage: 'localStorage',
            key: 'antigravity_state',
            whitelist: [],
            blacklist: []
        };

        // Transaction management
        this.transaction = {
            active: false,
            changes: new Map(),
            rollbackStack: []
        };

        // Computed values cache
        this.computed = new Map();
        this.computedDependencies = new Map();

        // Performance metrics
        this.metrics = {
            stateUpdates: 0,
            subscriptionCalls: 0,
            persistenceSaves: 0,
            avgUpdateTime: 0
        };

        console.log(`[StateStore v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize state store
     */
    async _init() {
        try {
            await this._loadConfig();
            this._restorePersistedState();
            this._registerEvents();
            this._setupAPIListeners();
            console.log('[StateStore] Initialized successfully');
        } catch (error) {
            console.error('[StateStore] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'state:init');
            }
        }
    }

    /**
     * Load configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/state-config.json');
            if (response.ok) {
                const config = await response.json();
                this._applyConfig(config);
                console.log('[StateStore] Configuration loaded');
            }
        } catch (error) {
            console.warn('[StateStore] Using default configuration:', error);
        }
    }

    /**
     * Apply configuration
     */
    _applyConfig(config) {
        if (config.persistence) {
            this.persistence = { ...this.persistence, ...config.persistence };
        }

        if (config.initialState) {
            this.initialState = config.initialState;
            this.state = this._deepClone(config.initialState);
        }

        if (config.maxHistorySize) {
            this.maxHistorySize = config.maxHistorySize;
        }
    }

    /**
     * Get state value
     */
    get(path) {
        if (!path) return this._deepClone(this.state);

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }

        return this._deepClone(value);
    }

    /**
     * Set state value
     */
    set(path, value, options = {}) {
        const startTime = performance.now();

        try {
            const keys = path.split('.');
            const oldValue = this.get(path);

            // Check if value actually changed
            if (this._isEqual(oldValue, value) && !options.force) {
                return oldValue;
            }

            // Apply middleware
            const middlewareResult = this._applyMiddleware('beforeSet', { path, value, oldValue });
            if (middlewareResult === false) {
                return oldValue; // Middleware blocked the update
            }

            // Handle transaction
            if (this.transaction.active) {
                this.transaction.changes.set(path, value);
                return value;
            }

            // Update state
            const newState = this._deepClone(this.state);
            this._setNestedValue(newState, keys, value);

            // Save to history (for undo/redo)
            if (!options.skipHistory) {
                this._saveToHistory();
            }

            this.state = newState;

            // Update metrics
            const updateTime = performance.now() - startTime;
            this._updateMetrics(updateTime);

            // Invalidate computed values
            this._invalidateComputed(path);

            // Notify subscribers
            this._notifySubscribers(path, value, oldValue);

            // Persist if enabled
            if (this.persistence.enabled && !options.skipPersist) {
                this._persistState();
            }

            // Apply middleware
            this._applyMiddleware('afterSet', { path, value, oldValue });

            // Emit event
            this._emitEvent('state:updated', { path, value, oldValue });

            return value;

        } catch (error) {
            console.error('[StateStore] Error setting state:', error);
            this._emitEvent('state:error', { action: 'set', path, error: error.message });
            throw error;
        }
    }

    /**
     * Update state (merge with existing)
     */
    update(path, updates) {
        const current = this.get(path) || {};
        const merged = { ...current, ...updates };
        return this.set(path, merged);
    }

    /**
     * Delete state value
     */
    delete(path) {
        const keys = path.split('.');
        const parentPath = keys.slice(0, -1).join('.');
        const key = keys[keys.length - 1];

        const parent = parentPath ? this.get(parentPath) : this.state;

        if (parent && typeof parent === 'object') {
            const newParent = { ...parent };
            delete newParent[key];

            if (parentPath) {
                this.set(parentPath, newParent);
            } else {
                this.state = newParent;
            }
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        // Global subscription (all changes)
        if (!path || path === '*') {
            this.globalSubscribers.add(callback);
            return () => this.globalSubscribers.delete(callback);
        }

        // Path-specific subscription
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }

        this.subscribers.get(path).add(callback);

        // Immediate notification if requested
        if (options.immediate) {
            const value = this.get(path);
            callback(value, undefined, path);
        }

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(path);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }

    /**
     * Watch for changes (alias for subscribe with immediate)
     */
    watch(path, callback) {
        return this.subscribe(path, callback, { immediate: true });
    }

    /**
     * Notify subscribers of changes
     */
    _notifySubscribers(path, newValue, oldValue) {
        this.metrics.subscriptionCalls++;

        // Notify exact path subscribers
        const exactSubs = this.subscribers.get(path);
        if (exactSubs) {
            exactSubs.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('[StateStore] Subscriber error:', error);
                }
            });
        }

        // Notify parent path subscribers
        const keys = path.split('.');
        for (let i = keys.length - 1; i > 0; i--) {
            const parentPath = keys.slice(0, i).join('.');
            const parentSubs = this.subscribers.get(parentPath);

            if (parentSubs) {
                const parentValue = this.get(parentPath);
                parentSubs.forEach(callback => {
                    try {
                        callback(parentValue, undefined, parentPath);
                    } catch (error) {
                        console.error('[StateStore] Subscriber error:', error);
                    }
                });
            }
        }

        // Notify global subscribers
        this.globalSubscribers.forEach(callback => {
            try {
                callback(this.state, path, newValue, oldValue);
            } catch (error) {
                console.error('[StateStore] Global subscriber error:', error);
            }
        });
    }

    /**
     * Computed values
     */
    computed(name, getter, dependencies = []) {
        this.computed.set(name, getter);
        this.computedDependencies.set(name, dependencies);

        // Subscribe to dependencies
        dependencies.forEach(dep => {
            this.subscribe(dep, () => {
                this.computed.delete(name); // Invalidate cache
            });
        });

        return () => this.getComputed(name);
    }

    getComputed(name) {
        if (!this.computed.has(name)) {
            throw new Error(`Computed value '${name}' not found`);
        }

        const getter = this.computed.get(name);
        return getter(this.state);
    }

    _invalidateComputed(path) {
        // Invalidate computed values that depend on this path
        this.computedDependencies.forEach((deps, name) => {
            if (deps.some(dep => path.startsWith(dep))) {
                this.computed.delete(name);
            }
        });
    }

    /**
     * Transactions
     */
    beginTransaction() {
        if (this.transaction.active) {
            throw new Error('Transaction already active');
        }

        this.transaction.active = true;
        this.transaction.changes.clear();
        this.transaction.rollbackStack.push(this._deepClone(this.state));
    }

    commit() {
        if (!this.transaction.active) {
            throw new Error('No active transaction');
        }

        // Apply all changes
        this.transaction.changes.forEach((value, path) => {
            this.set(path, value, { skipHistory: true });
        });

        this.transaction.active = false;
        this.transaction.changes.clear();
        this.transaction.rollbackStack.pop();

        this._emitEvent('state:transaction-committed');
    }

    rollback() {
        if (!this.transaction.active) {
            throw new Error('No active transaction');
        }

        // Restore previous state
        this.state = this.transaction.rollbackStack.pop();
        this.transaction.active = false;
        this.transaction.changes.clear();

        this._emitEvent('state:transaction-rolled-back');
    }

    /**
     * History (Undo/Redo)
     */
    _saveToHistory() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add current state
        this.history.push(this._deepClone(this.state));

        // Enforce max size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.state = this._deepClone(this.history[this.historyIndex]);
            this._notifySubscribers('*', this.state, undefined);
            this._emitEvent('state:undo');
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.state = this._deepClone(this.history[this.historyIndex]);
            this._notifySubscribers('*', this.state, undefined);
            this._emitEvent('state:redo');
            return true;
        }
        return false;
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
    }

    /**
     * Persistence
     */
    _persistState() {
        if (!this.persistence.enabled) return;

        try {
            let stateToPersist = this.state;

            // Apply whitelist/blacklist
            if (this.persistence.whitelist.length > 0) {
                stateToPersist = this._filterState(this.state, this.persistence.whitelist, true);
            } else if (this.persistence.blacklist.length > 0) {
                stateToPersist = this._filterState(this.state, this.persistence.blacklist, false);
            }

            const storage = this.persistence.storage === 'sessionStorage'
                ? sessionStorage
                : localStorage;

            storage.setItem(this.persistence.key, JSON.stringify(stateToPersist));
            this.metrics.persistenceSaves++;

        } catch (error) {
            console.error('[StateStore] Persistence error:', error);
            this._emitEvent('state:persistence-error', { error: error.message });
        }
    }

    _restorePersistedState() {
        if (!this.persistence.enabled) return;

        try {
            const storage = this.persistence.storage === 'sessionStorage'
                ? sessionStorage
                : localStorage;

            const persisted = storage.getItem(this.persistence.key);

            if (persisted) {
                const parsed = JSON.parse(persisted);
                this.state = { ...this.state, ...parsed };
                this._emitEvent('state:restored', { source: this.persistence.storage });
            }

        } catch (error) {
            console.error('[StateStore] Restore error:', error);
        }
    }

    clearPersistedState() {
        const storage = this.persistence.storage === 'sessionStorage'
            ? sessionStorage
            : localStorage;

        storage.removeItem(this.persistence.key);
        this._emitEvent('state:persistence-cleared');
    }

    /**
     * Middleware
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middleware.push(middleware);
    }

    _applyMiddleware(hook, context) {
        for (const mw of this.middleware) {
            const result = mw(hook, context, this);
            if (result === false) return false;
        }
        return true;
    }

    /**
     * Reset state
     */
    reset(path = null) {
        if (path) {
            const initialValue = this._getNestedValue(this.initialState, path.split('.'));
            this.set(path, initialValue);
        } else {
            this.state = this._deepClone(this.initialState);
            this._notifySubscribers('*', this.state, undefined);
            this._persistState();
        }

        this._emitEvent('state:reset', { path });
    }

    /**
     * Utility methods
     */
    _setNestedValue(obj, keys, value) {
        const lastKey = keys[keys.length - 1];
        const target = keys.slice(0, -1).reduce((acc, key) => {
            if (!(key in acc)) acc[key] = {};
            return acc[key];
        }, obj);

        target[lastKey] = value;
    }

    _getNestedValue(obj, keys) {
        return keys.reduce((acc, key) => acc?.[key], obj);
    }

    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this._deepClone(item));

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this._deepClone(obj[key]);
            }
        }
        return cloned;
    }

    _isEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    _filterState(state, paths, include) {
        const filtered = {};
        paths.forEach(path => {
            const value = this.get(path);
            if ((include && value !== undefined) || (!include && value === undefined)) {
                this._setNestedValue(filtered, path.split('.'), value);
            }
        });
        return filtered;
    }

    _updateMetrics(updateTime) {
        this.metrics.stateUpdates++;
        const totalTime = this.metrics.avgUpdateTime * (this.metrics.stateUpdates - 1);
        this.metrics.avgUpdateTime = (totalTime + updateTime) / this.metrics.stateUpdates;
    }

    /**
     * Event bus integration
     */
    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Listen for external state updates
        eventBus.on('state:set', (data) => {
            if (data.path && data.value !== undefined) {
                this.set(data.path, data.value);
            }
        });

        eventBus.on('state:reset', (data) => {
            this.reset(data?.path);
        });
    }

    /**
     * API layer integration
     */
    _setupAPIListeners() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Sync API responses to state
        eventBus.on('api:request-success', (data) => {
            // Auto-sync based on endpoint patterns
            if (data.endpoint && data.response) {
                this._syncAPIResponse(data.endpoint, data.response);
            }
        });
    }

    _syncAPIResponse(endpoint, response) {
        // Map endpoints to state paths (configurable)
        const mapping = {
            '/api/news': 'data.news',
            '/api/live-scores': 'data.liveScores',
            '/api/user': 'user.profile'
        };

        const statePath = mapping[endpoint];
        if (statePath) {
            this.set(statePath, response, { skipPersist: false });
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            stateSize: JSON.stringify(this.state).length,
            subscriberCount: this.subscribers.size + this.globalSubscribers.size,
            historySize: this.history.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            persistenceEnabled: this.persistence.enabled,
            metrics: { ...this.metrics }
        };
    }

    /**
     * Debug helpers
     */
    debug() {
        return {
            state: this._deepClone(this.state),
            subscribers: Array.from(this.subscribers.keys()),
            history: this.history.length,
            metrics: this.metrics
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        this.subscribers.clear();
        this.globalSubscribers.clear();
        this.computed.clear();
        this.clearHistory();
        console.log('[StateStore] Destroyed');
    }
}

// Initialize and Export
const stateStore = new StateStoreRuntime();
window.__ANTIGRAVITY_STATE__ = stateStore;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[StateStore] Registered with runtime');
    });
}

export default stateStore;
