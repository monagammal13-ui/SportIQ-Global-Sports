/**
 * Layer 4: Runtime Event Bus and Communication Layer
 * ID: layer-004
 * Type: Core
 * Description: Global event bus enabling communication between all system layers with pub/sub patterns,
 * async/sync support, memory leak prevention, and debugging hooks.
 */

class AntigravityEventBus {
    constructor() {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            console.warn('[EventBus] Event bus already initialized.');
            return window.__ANTIGRAVITY_EVENT_BUS__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-004';
        this.name = 'Runtime Event Bus';
        this.timestamp = new Date().toISOString();

        // Subscribers storage: Map<eventName, Set<subscriberObject>>
        // subscriberObject = { id, callback, options: { once, priority, context } }
        this.subscribers = new Map();

        // Event history for debugging (limited to last 100 events)
        this.history = [];
        this.maxHistorySize = 100;

        // Performance metrics
        this.metrics = {
            eventsPublished: 0,
            eventsHandled: 0,
            errors: 0,
            avgProcessingTime: 0
        };

        // Debugging mode
        this.debug = false;

        // Wildcard subscriptions (pattern matching)
        this.wildcardSubscribers = [];

        // Bind methods
        this.on = this.on.bind(this);
        this.once = this.once.bind(this);
        this.off = this.off.bind(this);
        this.emit = this.emit.bind(this);
        this.emitAsync = this.emitAsync.bind(this);
        this.clear = this.clear.bind(this);
        this.getSubscribers = this.getSubscribers.bind(this);

        console.log(`[EventBus v${this.version}] Initialized.`);
        this._notifyRuntime();
    }

    /**
     * Notify the runtime that event bus is ready
     */
    _notifyRuntime() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.setState('eventBus', {
                status: 'ready',
                version: this.version
            });
        }
    }

    /**
     * Generate unique subscriber ID
     */
    _generateId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add to event history for debugging
     */
    _addToHistory(event, data, timestamp, processingTime) {
        if (this.history.length >= this.maxHistorySize) {
            this.history.shift(); // Remove oldest
        }

        this.history.push({
            event,
            data,
            timestamp,
            processingTime,
            subscribers: this._getSubscriberCount(event)
        });
    }

    /**
     * Get subscriber count for an event
     */
    _getSubscriberCount(eventName) {
        const subs = this.subscribers.get(eventName);
        return subs ? subs.size : 0;
    }

    /**
     * Match wildcard patterns
     */
    _matchesPattern(pattern, eventName) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        return regex.test(eventName);
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Event name or wildcard pattern (e.g., 'layer:*')
     * @param {Function} callback - Handler function
     * @param {Object} options - { once: false, priority: 0, context: null }
     * @returns {string} Subscription ID (use to unsubscribe)
     */
    on(eventName, callback, options = {}) {
        if (typeof eventName !== 'string' || !eventName) {
            console.error('[EventBus] Invalid event name:', eventName);
            return null;
        }

        if (typeof callback !== 'function') {
            console.error('[EventBus] Invalid callback for event:', eventName);
            return null;
        }

        const subscriber = {
            id: this._generateId(),
            callback,
            options: {
                once: options.once || false,
                priority: options.priority || 0,
                context: options.context || null
            }
        };

        // Handle wildcard subscriptions
        if (eventName.includes('*') || eventName.includes('?')) {
            this.wildcardSubscribers.push({
                pattern: eventName,
                subscriber
            });
        } else {
            // Regular subscription
            if (!this.subscribers.has(eventName)) {
                this.subscribers.set(eventName, new Set());
            }

            this.subscribers.get(eventName).add(subscriber);
        }

        if (this.debug) {
            console.log(`[EventBus] Subscribed to '${eventName}' (ID: ${subscriber.id})`);
        }

        return subscriber.id;
    }

    /**
     * Subscribe to an event (fires once then auto-unsubscribes)
     * @param {string} eventName 
     * @param {Function} callback 
     * @param {Object} options 
     * @returns {string} Subscription ID
     */
    once(eventName, callback, options = {}) {
        return this.on(eventName, callback, { ...options, once: true });
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventNameOrId - Event name or subscription ID
     * @param {Function} callback - Optional: specific callback to remove
     */
    off(eventNameOrId, callback = null) {
        // If it looks like a subscription ID
        if (eventNameOrId.startsWith('sub_')) {
            return this._unsubscribeById(eventNameOrId);
        }

        // Otherwise treat as event name
        const subs = this.subscribers.get(eventNameOrId);
        if (!subs) {
            if (this.debug) {
                console.warn(`[EventBus] No subscribers for event: ${eventNameOrId}`);
            }
            return false;
        }

        if (callback) {
            // Remove specific callback
            let removed = false;
            subs.forEach(sub => {
                if (sub.callback === callback) {
                    subs.delete(sub);
                    removed = true;
                }
            });

            if (subs.size === 0) {
                this.subscribers.delete(eventNameOrId);
            }

            return removed;
        } else {
            // Remove all subscribers for this event
            this.subscribers.delete(eventNameOrId);
            return true;
        }
    }

    /**
     * Unsubscribe by ID
     */
    _unsubscribeById(subscriptionId) {
        // Check regular subscribers
        for (const [eventName, subs] of this.subscribers.entries()) {
            for (const sub of subs) {
                if (sub.id === subscriptionId) {
                    subs.delete(sub);
                    if (subs.size === 0) {
                        this.subscribers.delete(eventName);
                    }
                    if (this.debug) {
                        console.log(`[EventBus] Unsubscribed: ${subscriptionId} from '${eventName}'`);
                    }
                    return true;
                }
            }
        }

        // Check wildcard subscribers
        const wildcardIndex = this.wildcardSubscribers.findIndex(
            ws => ws.subscriber.id === subscriptionId
        );
        if (wildcardIndex !== -1) {
            this.wildcardSubscribers.splice(wildcardIndex, 1);
            return true;
        }

        return false;
    }

    /**
     * Emit an event synchronously
     * @param {string} eventName 
     * @param {any} data 
     * @returns {number} Number of handlers executed
     */
    emit(eventName, data = null) {
        const startTime = performance.now();
        let handlersExecuted = 0;

        try {
            // Get all matching subscribers (direct + wildcard)
            const allSubscribers = this._getAllMatchingSubscribers(eventName);

            // Sort by priority (higher priority first)
            const sorted = Array.from(allSubscribers).sort(
                (a, b) => (b.options.priority || 0) - (a.options.priority || 0)
            );

            // Execute handlers
            const toRemove = [];

            sorted.forEach(sub => {
                try {
                    const context = sub.options.context || null;
                    sub.callback.call(context, data, eventName);
                    handlersExecuted++;
                    this.metrics.eventsHandled++;

                    // Mark for removal if 'once' option
                    if (sub.options.once) {
                        toRemove.push(sub);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error in handler for '${eventName}':`, error);
                    this.metrics.errors++;
                    if (window.__ANTIGRAVITY_RUNTIME__) {
                        window.__ANTIGRAVITY_RUNTIME__.logError(error, `eventbus:${eventName}`);
                    }
                }
            });

            // Remove 'once' subscribers
            toRemove.forEach(sub => {
                this._unsubscribeById(sub.id);
            });

        } catch (error) {
            console.error(`[EventBus] Critical error emitting '${eventName}':`, error);
            this.metrics.errors++;
        }

        // Update metrics
        const processingTime = performance.now() - startTime;
        this.metrics.eventsPublished++;
        this.metrics.avgProcessingTime =
            ((this.metrics.avgProcessingTime * (this.metrics.eventsPublished - 1)) + processingTime)
            / this.metrics.eventsPublished;

        // Add to history
        this._addToHistory(eventName, data, new Date().toISOString(), processingTime);

        if (this.debug) {
            console.log(`[EventBus] Emitted '${eventName}' (${handlersExecuted} handlers, ${processingTime.toFixed(2)}ms)`);
        }

        return handlersExecuted;
    }

    /**
     * Emit an event asynchronously (returns promise)
     * @param {string} eventName 
     * @param {any} data 
     * @returns {Promise<number>} Number of handlers executed
     */
    async emitAsync(eventName, data = null) {
        const startTime = performance.now();
        let handlersExecuted = 0;

        try {
            const allSubscribers = this._getAllMatchingSubscribers(eventName);
            const sorted = Array.from(allSubscribers).sort(
                (a, b) => (b.options.priority || 0) - (a.options.priority || 0)
            );

            const toRemove = [];

            // Execute all handlers as promises
            await Promise.all(
                sorted.map(async (sub) => {
                    try {
                        const context = sub.options.context || null;
                        await Promise.resolve(sub.callback.call(context, data, eventName));
                        handlersExecuted++;
                        this.metrics.eventsHandled++;

                        if (sub.options.once) {
                            toRemove.push(sub);
                        }
                    } catch (error) {
                        console.error(`[EventBus] Async error in handler for '${eventName}':`, error);
                        this.metrics.errors++;
                        if (window.__ANTIGRAVITY_RUNTIME__) {
                            window.__ANTIGRAVITY_RUNTIME__.logError(error, `eventbus:async:${eventName}`);
                        }
                    }
                })
            );

            toRemove.forEach(sub => {
                this._unsubscribeById(sub.id);
            });

        } catch (error) {
            console.error(`[EventBus] Critical async error emitting '${eventName}':`, error);
            this.metrics.errors++;
        }

        const processingTime = performance.now() - startTime;
        this.metrics.eventsPublished++;
        this.metrics.avgProcessingTime =
            ((this.metrics.avgProcessingTime * (this.metrics.eventsPublished - 1)) + processingTime)
            / this.metrics.eventsPublished;

        this._addToHistory(eventName, data, new Date().toISOString(), processingTime);

        if (this.debug) {
            console.log(`[EventBus] Async emitted '${eventName}' (${handlersExecuted} handlers, ${processingTime.toFixed(2)}ms)`);
        }

        return handlersExecuted;
    }

    /**
     * Get all subscribers matching an event (direct + wildcard)
     */
    _getAllMatchingSubscribers(eventName) {
        const result = new Set();

        // Add direct subscribers
        const directSubs = this.subscribers.get(eventName);
        if (directSubs) {
            directSubs.forEach(sub => result.add(sub));
        }

        // Add wildcard subscribers
        this.wildcardSubscribers.forEach(ws => {
            if (this._matchesPattern(ws.pattern, eventName)) {
                result.add(ws.subscriber);
            }
        });

        return result;
    }

    /**
     * Clear all subscribers for an event, or all events
     * @param {string} eventName - Optional: specific event to clear
     */
    clear(eventName = null) {
        if (eventName) {
            this.subscribers.delete(eventName);
            this.wildcardSubscribers = this.wildcardSubscribers.filter(
                ws => !this._matchesPattern(ws.pattern, eventName)
            );
        } else {
            this.subscribers.clear();
            this.wildcardSubscribers = [];
        }

        if (this.debug) {
            console.log(`[EventBus] Cleared ${eventName || 'all events'}`);
        }
    }

    /**
     * Get list of all registered event names
     */
    getEventNames() {
        return Array.from(this.subscribers.keys());
    }

    /**
     * Get subscribers for a specific event
     */
    getSubscribers(eventName) {
        const subs = this.subscribers.get(eventName);
        return subs ? Array.from(subs) : [];
    }

    /**
     * Get event history (for debugging)
     */
    getHistory(limit = 10) {
        return this.history.slice(-limit);
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            totalSubscribers: Array.from(this.subscribers.values())
                .reduce((sum, subs) => sum + subs.size, 0) + this.wildcardSubscribers.length,
            totalEvents: this.subscribers.size,
            wildcardSubscribers: this.wildcardSubscribers.length
        };
    }

    /**
     * Enable/disable debug mode
     */
    setDebug(enabled) {
        this.debug = enabled;
        console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Destroy event bus (cleanup)
     */
    destroy() {
        this.clear();
        this.history = [];
        console.log('[EventBus] Destroyed.');
    }
}

// Initialize and Export
const eventBus = new AntigravityEventBus();
window.__ANTIGRAVITY_EVENT_BUS__ = eventBus;

// Register with runtime if available
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[EventBus] Registered with runtime.');
    });
}

export default eventBus;
