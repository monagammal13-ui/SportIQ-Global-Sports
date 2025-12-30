/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 77: ADVANCED CONTENT SCHEDULER ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Content scheduling, auto-publishing, priority queue management
 * Features: Scheduled publishing, content queue, priority management, auto-sync
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION & CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        scheduler: {
            configPath: '../api-json/scheduler-config.json',
            checkInterval: 10000, // 10 seconds
            storagePrefix: 'sportiq_schedule_',
            autoPublish: true
        },
        events: {
            contentScheduled: 'scheduler:content-scheduled',
            contentPublished: 'scheduler:content-published',
            contentCanceled: 'scheduler:content-canceled',
            queueUpdated: 'scheduler:queue-updated',
            publishFailed: 'scheduler:publish-failed'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        queue: new Map(),
        published: new Map(),
        categories: new Map(),
        timers: new Map(),
        statistics: {
            totalScheduled: 0,
            published: 0,
            pending: 0,
            canceled: 0,
            failed: 0
        },
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT QUEUE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const QueueManager = {
        /**
         * Schedule content
         */
        schedule: function (content) {
            const id = content.id || this.generateId();

            const scheduled = {
                id,
                title: content.title || 'Untitled',
                description: content.description || '',
                type: content.type || 'article',
                category: content.category || 'general',
                content: content.content || {},
                publishAt: content.publishAt || Date.now(),
                priority: content.priority || 5,
                status: 'scheduled',
                author: content.author || 'System',
                tags: content.tags || [],
                metadata: content.metadata || {},
                created: Date.now()
            };

            state.queue.set(id, scheduled);

            // Save to storage
            this.saveToStorage();

            // Set publish timer
            this.setPublishTimer(scheduled);

            // Update statistics
            state.statistics.totalScheduled++;
            state.statistics.pending = state.queue.size;

            // Fire event
            const event = new CustomEvent(CONFIG.events.contentScheduled, {
                detail: { content: scheduled, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('📅 [Scheduler] Content scheduled:', id, 'for', new Date(scheduled.publishAt).toLocaleString());

            return scheduled;
        },

        /**
         * Cancel scheduled content
         */
        cancel: function (contentId) {
            const content = state.queue.get(contentId);
            if (!content) return false;

            // Clear timer
            this.clearPublishTimer(contentId);

            // Remove from queue
            state.queue.delete(contentId);

            // Save to storage
            this.saveToStorage();

            // Update statistics
            state.statistics.canceled++;
            state.statistics.pending = state.queue.size;

            // Fire event
            const event = new CustomEvent(CONFIG.events.contentCanceled, {
                detail: { contentId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('❌ [Scheduler] Content canceled:', contentId);

            return true;
        },

        /**
         * Get scheduled content
         */
        get: function (contentId) {
            return state.queue.get(contentId);
        },

        /**
         * Get all scheduled content
         */
        getAll: function (filter = {}) {
            let items = Array.from(state.queue.values());

            if (filter.category) {
                items = items.filter(c => c.category === filter.category);
            }

            if (filter.type) {
                items = items.filter(c => c.type === filter.type);
            }

            if (filter.status) {
                items = items.filter(c => c.status === filter.status);
            }

            // Sort by publish time
            items.sort((a, b) => a.publishAt - b.publishAt);

            return items;
        },

        /**
         * Update content priority
         */
        updatePriority: function (contentId, priority) {
            const content = state.queue.get(contentId);
            if (!content) return false;

            content.priority = priority;
            this.saveToStorage();

            return true;
        },

        /**
         * Generate content ID
         */
        generateId: function () {
            return 'content_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        /**
         * Save to storage
         */
        saveToStorage: function () {
            const data = Array.from(state.queue.entries());
            try {
                localStorage.setItem(CONFIG.scheduler.storagePrefix + 'queue', JSON.stringify(data));
            } catch (error) {
                console.warn('⚠️ [Scheduler] Failed to save to storage:', error.message);
            }
        },

        /**
         * Load from storage
         */
        loadFromStorage: function () {
            try {
                const data = localStorage.getItem(CONFIG.scheduler.storagePrefix + 'queue');
                if (data) {
                    const entries = JSON.parse(data);
                    entries.forEach(([id, content]) => {
                        state.queue.set(id, content);
                        // Re-set timers for future content
                        if (content.publishAt > Date.now()) {
                            this.setPublishTimer(content);
                        }
                    });
                    console.log(`✅ [Scheduler] Loaded ${entries.length} scheduled items from storage`);
                }
            } catch (error) {
                console.warn('⚠️ [Scheduler] Failed to load from storage:', error.message);
            }
        },

        /**
         * Set publish timer
         */
        setPublishTimer: function (content) {
            const delay = content.publishAt - Date.now();

            if (delay <= 0) {
                // Publish immediately
                if (CONFIG.scheduler.autoPublish) {
                    PublishEngine.publish(content.id);
                }
                return;
            }

            // Clear existing timer
            this.clearPublishTimer(content.id);

            // Set new timer
            const timerId = setTimeout(() => {
                if (CONFIG.scheduler.autoPublish) {
                    PublishEngine.publish(content.id);
                }
            }, delay);

            state.timers.set(content.id, timerId);
        },

        /**
         * Clear publish timer
         */
        clearPublishTimer: function (contentId) {
            const timerId = state.timers.get(contentId);
            if (timerId) {
                clearTimeout(timerId);
                state.timers.delete(contentId);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLISH ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const PublishEngine = {
        /**
         * Publish content
         */
        publish: function (contentId) {
            const content = state.queue.get(contentId);
            if (!content) {
                console.error('❌ [Scheduler] Content not found:', contentId);
                return false;
            }

            console.log('🚀 [Scheduler] Publishing content:', contentId);

            try {
                // Execute publish action
                const result = this.executePublish(content);

                if (result.success) {
                    // Move to published
                    content.status = 'published';
                    content.publishedAt = Date.now();
                    state.published.set(contentId, content);

                    // Remove from queue
                    state.queue.delete(contentId);
                    QueueManager.clearPublishTimer(contentId);

                    // Save to storage
                    QueueManager.saveToStorage();

                    // Update statistics
                    state.statistics.published++;
                    state.statistics.pending = state.queue.size;

                    // Fire event
                    const event = new CustomEvent(CONFIG.events.contentPublished, {
                        detail: { content, timestamp: Date.now() }
                    });
                    document.dispatchEvent(event);

                    console.log('✅ [Scheduler] Content published:', contentId);

                    return true;
                } else {
                    throw new Error(result.error || 'Publish failed');
                }

            } catch (error) {
                console.error('❌ [Scheduler] Publish failed:', error.message);

                content.status = 'failed';

                // Update statistics
                state.statistics.failed++;

                // Fire event
                const event = new CustomEvent(CONFIG.events.publishFailed, {
                    detail: { contentId, error: error.message, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                return false;
            }
        },

        /**
         * Execute publish action
         */
        executePublish: function (content) {
            // In a real implementation, this would:
            // - Send to CMS
            // - Update database
            // - Trigger notifications
            // - Update search index

            // For demo, just simulate
            console.log('📤 [Scheduler] Publishing:', content.title);

            // Simulate API call
            return {
                success: true,
                publishedUrl: `/content/${content.id}`
            };
        },

        /**
         * Get published content
         */
        getPublished: function () {
            return Array.from(state.published.values())
                .sort((a, b) => b.publishedAt - a.publishedAt);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const PriorityManager = {
        /**
         * Get queue by priority
         */
        getByPriority: function () {
            const items = QueueManager.getAll();
            return items.sort((a, b) => b.priority - a.priority);
        },

        /**
         * Promote content (increase priority)
         */
        promote: function (contentId) {
            const content = state.queue.get(contentId);
            if (!content) return false;

            content.priority = Math.min(content.priority + 1, 10);
            QueueManager.saveToStorage();

            return true;
        },

        /**
         * Demote content (decrease priority)
         */
        demote: function (contentId) {
            const content = state.queue.get(contentId);
            if (!content) return false;

            content.priority = Math.max(content.priority - 1, 1);
            QueueManager.saveToStorage();

            return true;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const CategoryManager = {
        /**
         * Register category
         */
        register: function (category) {
            state.categories.set(category.id, {
                id: category.id,
                name: category.name,
                description: category.description || '',
                color: category.color || '#6366f1',
                icon: category.icon || '📁'
            });
        },

        /**
         * Get all categories
         */
        getAll: function () {
            return Array.from(state.categories.values());
        },

        /**
         * Get content by category
         */
        getContent: function (categoryId) {
            return QueueManager.getAll({ category: categoryId });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULER MONITOR
    // ═══════════════════════════════════════════════════════════════════════

    const SchedulerMonitor = {
        /**
         * Start monitoring
         */
        start: function () {
            console.log('🔍 [Scheduler] Starting queue monitor');

            this.check();

            this.timerId = setInterval(() => {
                this.check();
            }, CONFIG.scheduler.checkInterval);
        },

        /**
         * Stop monitoring
         */
        stop: function () {
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        },

        /**
         * Check queue for due content
         */
        check: function () {
            const now = Date.now();
            const due = [];

            state.queue.forEach((content, id) => {
                if (content.publishAt <= now && content.status === 'scheduled') {
                    due.push(content);
                }
            });

            if (due.length > 0) {
                console.log(`📢 [Scheduler] ${due.length} items due for publishing`);

                if (CONFIG.scheduler.autoPublish) {
                    due.forEach(content => {
                        PublishEngine.publish(content.id);
                    });
                }
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📅 LAYER 77: CONTENT SCHEDULER ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Load configuration
        try {
            const response = await fetch(CONFIG.scheduler.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register categories
                if (state.config.categories) {
                    state.config.categories.forEach(cat => {
                        CategoryManager.register(cat);
                    });
                    console.log(`✅ [Scheduler] Registered ${state.config.categories.length} categories`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Scheduler] Failed to load config:', error.message);
        }

        // Load from storage
        QueueManager.loadFromStorage();

        // Start monitoring
        SchedulerMonitor.start();

        // Update statistics
        state.statistics.pending = state.queue.size;

        console.log('✅ [Scheduler] Engine initialized');
        console.log('📊 [Scheduler] Scheduled items:', state.queue.size);
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ContentScheduler = {
        // Queue Management
        schedule: QueueManager.schedule.bind(QueueManager),
        cancel: QueueManager.cancel.bind(QueueManager),
        getContent: QueueManager.get.bind(QueueManager),
        getQueue: QueueManager.getAll.bind(QueueManager),
        updatePriority: QueueManager.updatePriority.bind(QueueManager),

        // Publishing
        publish: PublishEngine.publish.bind(PublishEngine),
        getPublished: PublishEngine.getPublished.bind(PublishEngine),

        // Priority
        promote: PriorityManager.promote.bind(PriorityManager),
        demote: PriorityManager.demote.bind(PriorityManager),
        getByPriority: PriorityManager.getByPriority.bind(PriorityManager),

        // Categories
        getCategories: CategoryManager.getAll.bind(CategoryManager),
        getCategoryContent: CategoryManager.getContent.bind(CategoryManager),

        // Statistics
        getStats: () => ({ ...state.statistics }),

        // State
        state: () => ({
            queued: state.queue.size,
            published: state.published.size,
            categories: state.categories.size,
            statistics: state.statistics
        }),

        // Config
        CONFIG
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
