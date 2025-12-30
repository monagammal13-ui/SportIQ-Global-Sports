/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 74: BACKUP & RECOVERY ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automated backup, versioning, and instant recovery system
 * Features: Scheduled backups, instant restore, version control, compression
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
        backup: {
            configPath: '../api-json/backup-config.json',
            storagePrefix: 'sportiq_backup_',
            maxBackups: 50,
            compressionEnabled: true,
            encryptionEnabled: false
        },
        schedule: {
            autoBackup: true,
            defaultInterval: 3600000, // 1 hour
            minInterval: 300000, // 5 minutes
            maxInterval: 86400000 // 24 hours
        },
        retention: {
            keepDaily: 7,
            keepWeekly: 4,
            keepMonthly: 6,
            autoCleanup: true
        },
        events: {
            backupCreated: 'backup:created',
            backupRestored: 'backup:restored',
            backupDeleted: 'backup:deleted',
            backupFailed: 'backup:failed',
            scheduleChanged: 'backup:schedule-changed'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        backups: new Map(),
        sources: new Map(),
        schedules: new Map(),
        config: null,
        statistics: {
            totalBackups: 0,
            successfulBackups: 0,
            failedBackups: 0,
            totalRestores: 0,
            storageUsed: 0
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BACKUP SOURCE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const SourceManager = {
        /**
         * Register backup source
         */
        register: function (source) {
            const id = source.id || source.name;

            state.sources.set(id, {
                id,
                name: source.name || id,
                type: source.type || 'localStorage', // localStorage, api, file
                selector: source.selector || null,
                include: source.include || [],
                exclude: source.exclude || [],
                compress: source.compress !== false,
                enabled: source.enabled !== false,
                priority: source.priority || 100
            });

            console.log('✅ [Backup] Source registered:', id);
            return true;
        },

        /**
         * Get source
         */
        get: function (sourceId) {
            return state.sources.get(sourceId);
        },

        /**
         * Get all sources
         */
        getAll: function (filter = {}) {
            let sources = Array.from(state.sources.values());

            if (filter.type) {
                sources = sources.filter(s => s.type === filter.type);
            }

            if (filter.enabled !== undefined) {
                sources = sources.filter(s => s.enabled === filter.enabled);
            }

            return sources;
        },

        /**
         * Extract data from source
         */
        extract: function (sourceId) {
            const source = state.sources.get(sourceId);
            if (!source || !source.enabled) return null;

            let data = {};

            switch (source.type) {
                case 'localStorage':
                    data = this.extractLocalStorage(source);
                    break;
                case 'sessionStorage':
                    data = this.extractSessionStorage(source);
                    break;
                case 'dom':
                    data = this.extractDOM(source);
                    break;
                case 'api':
                    data = this.extractAPI(source);
                    break;
                default:
                    console.warn('⚠️ [Backup] Unknown source type:', source.type);
            }

            return data;
        },

        /**
         * Extract from localStorage
         */
        extractLocalStorage: function (source) {
            const data = {};

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                // Check include/exclude patterns
                if (source.include.length > 0 && !this.matchesPattern(key, source.include)) {
                    continue;
                }

                if (source.exclude.length > 0 && this.matchesPattern(key, source.exclude)) {
                    continue;
                }

                try {
                    data[key] = localStorage.getItem(key);
                } catch (error) {
                    console.warn('⚠️ [Backup] Failed to extract key:', key);
                }
            }

            return data;
        },

        /**
         * Extract from sessionStorage
         */
        extractSessionStorage: function (source) {
            const data = {};

            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);

                if (source.include.length > 0 && !this.matchesPattern(key, source.include)) {
                    continue;
                }

                if (source.exclude.length > 0 && this.matchesPattern(key, source.exclude)) {
                    continue;
                }

                try {
                    data[key] = sessionStorage.getItem(key);
                } catch (error) {
                    console.warn('⚠️ [Backup] Failed to extract key:', key);
                }
            }

            return data;
        },

        /**
         * Extract from DOM
         */
        extractDOM: function (source) {
            if (!source.selector) return {};

            const elements = document.querySelectorAll(source.selector);
            const data = [];

            elements.forEach((el, index) => {
                data.push({
                    index,
                    html: el.outerHTML,
                    text: el.textContent
                });
            });

            return { selector: source.selector, elements: data };
        },

        /**
         * Extract from API
         */
        extractAPI: async function (source) {
            // Placeholder for API extraction
            return { api: source.selector, timestamp: Date.now() };
        },

        /**
         * Check if key matches patterns
         */
        matchesPattern: function (key, patterns) {
            return patterns.some(pattern => {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(key);
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BACKUP ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const BackupEngine = {
        /**
         * Create backup
         */
        create: async function (options = {}) {
            const {
                name = 'manual-backup',
                sources = 'all',
                compress = CONFIG.backup.compressionEnabled,
                metadata = {}
            } = options;

            console.log('💾 [Backup] Creating backup:', name);

            const backupId = this.generateId();
            const timestamp = Date.now();

            try {
                // Extract data from sources
                const data = {};
                const targetSources = sources === 'all'
                    ? SourceManager.getAll({ enabled: true })
                    : sources.map(id => SourceManager.get(id)).filter(Boolean);

                for (const source of targetSources) {
                    const sourceData = SourceManager.extract(source.id);
                    if (sourceData) {
                        data[source.id] = sourceData;
                    }
                }

                // Calculate size
                const dataStr = JSON.stringify(data);
                const size = new Blob([dataStr]).size;

                // Compress if enabled
                let content = dataStr;
                if (compress) {
                    content = this.compress(dataStr);
                }

                // Create backup object
                const backup = {
                    id: backupId,
                    name,
                    timestamp,
                    date: new Date(timestamp).toISOString(),
                    sources: targetSources.map(s => s.id),
                    size,
                    compressed: compress,
                    encrypted: false,
                    metadata: {
                        ...metadata,
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    },
                    content
                };

                // Store backup
                this.store(backup);

                // Update statistics
                state.statistics.totalBackups++;
                state.statistics.successfulBackups++;
                state.statistics.storageUsed += size;

                // Fire event
                const event = new CustomEvent(CONFIG.events.backupCreated, {
                    detail: { backup, timestamp }
                });
                document.dispatchEvent(event);

                console.log('✅ [Backup] Backup created:', backupId, `(${this.formatSize(size)})`);

                // Auto-cleanup old backups
                if (CONFIG.retention.autoCleanup) {
                    this.cleanup();
                }

                return {
                    success: true,
                    backup
                };

            } catch (error) {
                console.error('❌ [Backup] Failed to create backup:', error);

                state.statistics.failedBackups++;

                const event = new CustomEvent(CONFIG.events.backupFailed, {
                    detail: { error: error.message, timestamp }
                });
                document.dispatchEvent(event);

                return {
                    success: false,
                    error: error.message
                };
            }
        },

        /**
         * Store backup
         */
        store: function (backup) {
            // Store in memory
            state.backups.set(backup.id, backup);

            // Store in localStorage
            try {
                const key = CONFIG.backup.storagePrefix + backup.id;
                localStorage.setItem(key, JSON.stringify(backup));
            } catch (error) {
                console.warn('⚠️ [Backup] Failed to store in localStorage:', error.message);
            }
        },

        /**
         * Get backup
         */
        get: function (backupId) {
            // Try memory first
            let backup = state.backups.get(backupId);

            // Try localStorage
            if (!backup) {
                try {
                    const key = CONFIG.backup.storagePrefix + backupId;
                    const data = localStorage.getItem(key);
                    if (data) {
                        backup = JSON.parse(data);
                        state.backups.set(backupId, backup);
                    }
                } catch (error) {
                    console.warn('⚠️ [Backup] Failed to load from localStorage:', error.message);
                }
            }

            return backup;
        },

        /**
         * Get all backups
         */
        getAll: function () {
            // Load from localStorage
            this.loadFromStorage();

            return Array.from(state.backups.values())
                .sort((a, b) => b.timestamp - a.timestamp);
        },

        /**
         * Load backups from localStorage
         */
        loadFromStorage: function () {
            const prefix = CONFIG.backup.storagePrefix;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (key.startsWith(prefix)) {
                    try {
                        const backup = JSON.parse(localStorage.getItem(key));
                        state.backups.set(backup.id, backup);
                    } catch (error) {
                        console.warn('⚠️ [Backup] Failed to parse backup:', key);
                    }
                }
            }
        },

        /**
         * Delete backup
         */
        delete: function (backupId) {
            const backup = state.backups.get(backupId);
            if (!backup) return false;

            // Remove from memory
            state.backups.delete(backupId);

            // Remove from localStorage
            try {
                const key = CONFIG.backup.storagePrefix + backupId;
                localStorage.removeItem(key);
            } catch (error) {
                console.warn('⚠️ [Backup] Failed to delete from localStorage:', error.message);
            }

            // Update statistics
            state.statistics.storageUsed -= backup.size;

            // Fire event
            const event = new CustomEvent(CONFIG.events.backupDeleted, {
                detail: { backupId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('✅ [Backup] Backup deleted:', backupId);

            return true;
        },

        /**
         * Cleanup old backups
         */
        cleanup: function () {
            const backups = this.getAll();

            if (backups.length <= CONFIG.backup.maxBackups) return;

            // Keep newest backups up to maxBackups
            const toDelete = backups.slice(CONFIG.backup.maxBackups);

            toDelete.forEach(backup => {
                this.delete(backup.id);
            });

            console.log(`🗑️ [Backup] Cleaned up ${toDelete.length} old backups`);
        },

        /**
         * Generate backup ID
         */
        generateId: function () {
            return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        /**
         * Compress data (simple base64 for demo)
         */
        compress: function (data) {
            try {
                return btoa(data);
            } catch (error) {
                return data;
            }
        },

        /**
         * Decompress data
         */
        decompress: function (data) {
            try {
                return atob(data);
            } catch (error) {
                return data;
            }
        },

        /**
         * Format size in human-readable format
         */
        formatSize: function (bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RECOVERY ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const RecoveryEngine = {
        /**
         * Restore backup
         */
        restore: async function (backupId, options = {}) {
            const {
                sources = 'all',
                overwrite = true,
                preview = false
            } = options;

            console.log('🔄 [Backup] Restoring backup:', backupId);

            const backup = BackupEngine.get(backupId);
            if (!backup) {
                console.error('❌ [Backup] Backup not found:', backupId);
                return { success: false, error: 'Backup not found' };
            }

            try {
                // Decompress if needed
                let content = backup.content;
                if (backup.compressed) {
                    content = BackupEngine.decompress(content);
                }

                // Parse data
                const data = JSON.parse(content);

                // Preview mode - just return data
                if (preview) {
                    return {
                        success: true,
                        preview: data,
                        backup
                    };
                }

                // Restore each source
                const targetSources = sources === 'all'
                    ? Object.keys(data)
                    : sources;

                const results = {};

                for (const sourceId of targetSources) {
                    if (!data[sourceId]) continue;

                    const source = SourceManager.get(sourceId);
                    if (!source) continue;

                    try {
                        this.restoreSource(source, data[sourceId], overwrite);
                        results[sourceId] = { success: true };
                    } catch (error) {
                        results[sourceId] = { success: false, error: error.message };
                    }
                }

                // Update statistics
                state.statistics.totalRestores++;

                // Fire event
                const event = new CustomEvent(CONFIG.events.backupRestored, {
                    detail: { backupId, results, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                console.log('✅ [Backup] Backup restored:', backupId);

                return {
                    success: true,
                    results,
                    backup
                };

            } catch (error) {
                console.error('❌ [Backup] Failed to restore backup:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        },

        /**
         * Restore source data
         */
        restoreSource: function (source, data, overwrite) {
            switch (source.type) {
                case 'localStorage':
                    this.restoreLocalStorage(data, overwrite);
                    break;
                case 'sessionStorage':
                    this.restoreSessionStorage(data, overwrite);
                    break;
                case 'dom':
                    this.restoreDOM(data, overwrite);
                    break;
                default:
                    console.warn('⚠️ [Backup] Cannot restore source type:', source.type);
            }
        },

        /**
         * Restore localStorage
         */
        restoreLocalStorage: function (data, overwrite) {
            Object.entries(data).forEach(([key, value]) => {
                if (overwrite || !localStorage.getItem(key)) {
                    localStorage.setItem(key, value);
                }
            });
        },

        /**
         * Restore sessionStorage
         */
        restoreSessionStorage: function (data, overwrite) {
            Object.entries(data).forEach(([key, value]) => {
                if (overwrite || !sessionStorage.getItem(key)) {
                    sessionStorage.setItem(key, value);
                }
            });
        },

        /**
         * Restore DOM
         */
        restoreDOM: function (data, overwrite) {
            if (!data.selector || !data.elements) return;

            const container = document.querySelector(data.selector);
            if (!container) return;

            if (overwrite) {
                container.innerHTML = '';
            }

            data.elements.forEach(el => {
                const temp = document.createElement('div');
                temp.innerHTML = el.html;
                container.appendChild(temp.firstChild);
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULER
    // ═══════════════════════════════════════════════════════════════════════

    const Scheduler = {
        /**
         * Schedule automatic backup
         */
        schedule: function (options = {}) {
            const {
                id = 'auto-backup',
                interval = CONFIG.schedule.defaultInterval,
                sources = 'all',
                enabled = true
            } = options;

            // Stop existing schedule
            this.unschedule(id);

            if (!enabled) return;

            console.log(`⏰ [Backup] Scheduling backups every ${interval / 1000}s`);

            // Create schedule
            const schedule = {
                id,
                interval,
                sources,
                enabled,
                lastBackup: null,
                nextBackup: Date.now() + interval
            };

            // Immediate backup
            this.executeBackup(schedule);

            // Set interval
            const timerId = setInterval(() => {
                this.executeBackup(schedule);
            }, interval);

            schedule.timerId = timerId;
            state.schedules.set(id, schedule);

            // Fire event
            const event = new CustomEvent(CONFIG.events.scheduleChanged, {
                detail: { schedule }
            });
            document.dispatchEvent(event);

            return true;
        },

        /**
         * Execute scheduled backup
         */
        executeBackup: async function (schedule) {
            const result = await BackupEngine.create({
                name: `${schedule.id}-${Date.now()}`,
                sources: schedule.sources,
                metadata: {
                    scheduled: true,
                    scheduleId: schedule.id
                }
            });

            if (result.success) {
                schedule.lastBackup = Date.now();
                schedule.nextBackup = Date.now() + schedule.interval;
            }
        },

        /**
         * Unschedule backup
         */
        unschedule: function (id) {
            const schedule = state.schedules.get(id);
            if (!schedule) return false;

            if (schedule.timerId) {
                clearInterval(schedule.timerId);
            }

            state.schedules.delete(id);
            console.log('⏹️ [Backup] Schedule stopped:', id);

            return true;
        },

        /**
         * Get all schedules
         */
        getAll: function () {
            return Array.from(state.schedules.values());
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('💾 LAYER 74: BACKUP & RECOVERY ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Load configuration
        try {
            const response = await fetch(CONFIG.backup.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register sources
                if (state.config.sources) {
                    state.config.sources.forEach(source => {
                        SourceManager.register(source);
                    });
                    console.log(`✅ [Backup] Registered ${state.config.sources.length} sources`);
                }

                // Schedule automatic backups
                if (state.config.schedules) {
                    state.config.schedules.forEach(schedule => {
                        Scheduler.schedule(schedule);
                    });
                    console.log(`✅ [Backup] Scheduled ${state.config.schedules.length} automatic backups`);
                }

            } else {
                console.warn('⚠️ [Backup] Config file not found, using defaults');
            }
        } catch (error) {
            console.warn('⚠️ [Backup] Failed to load config:', error.message);
        }

        // Load existing backups
        BackupEngine.loadFromStorage();

        console.log('✅ [Backup] Engine initialized');
        console.log('📊 [Backup] Sources:', state.sources.size);
        console.log('💾 [Backup] Existing backups:', state.backups.size);
        console.log('⏰ [Backup] Active schedules:', state.schedules.size);
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.BackupEngine = {
        // Backup Operations
        createBackup: BackupEngine.create.bind(BackupEngine),
        getBackup: BackupEngine.get.bind(BackupEngine),
        getAllBackups: BackupEngine.getAll.bind(BackupEngine),
        deleteBackup: BackupEngine.delete.bind(BackupEngine),

        // Recovery
        restoreBackup: RecoveryEngine.restore.bind(RecoveryEngine),

        // Source Management
        registerSource: SourceManager.register.bind(SourceManager),
        getSources: SourceManager.getAll.bind(SourceManager),

        // Scheduling
        scheduleBackup: Scheduler.schedule.bind(Scheduler),
        unscheduleBackup: Scheduler.unschedule.bind(Scheduler),
        getSchedules: Scheduler.getAll.bind(Scheduler),

        // Statistics
        getStats: () => ({ ...state.statistics }),

        // State
        state: () => ({
            sources: state.sources.size,
            backups: state.backups.size,
            schedules: state.schedules.size,
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
