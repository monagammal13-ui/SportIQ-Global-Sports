/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 174 – SOVEREIGN DATA CONTROL LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Maintain full ownership and governance of platform data.
 * 
 * @version 1.0.0
 * @layer 174
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 174,
        name: 'Sovereign Data Control Layer',

        dataClasses: ['content', 'user', 'analytics', 'system'],
        retentionPolicies: {
            content: 'indefinite',
            user: '730days', // 2 years
            analytics: '365days',
            system: '90days'
        },

        intervals: {
            governanceCheck: 30000,
            analyticsUpdate: 60000
        }
    };

    class DataSovereignty {
        constructor() {
            this.dataRegistry = new Map();
            this.accessLog = [];
            this.dataGovernanceLog = [];
            this.config = null;
            this.stats = {
                totalDataAssets: 0,
                ownedData: 0,
                thirdPartyData: 0,
                dataExports: 0,
                accessRequests: 0
            };

            this.init();
        }

        async init() {
            console.log('🔐 [Layer 174] Data Sovereignty - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupDataGovernance();
                this.startMonitoring();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 174] Data Sovereignty - Active');
                this.logGovernance('SYSTEM', 'Data sovereignty layer initialized');

            } catch (error) {
                console.error('❌ [Layer 174] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer174-data-sovereignty.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupDataGovernance() {
            // Register data ownership
            this.registerDataAsset({
                id: 'platform-content',
                class: 'content',
                owner: 'platform',
                retention: CONFIG.retentionPolicies.content,
                created: new Date().toISOString()
            });

            this.registerDataAsset({
                id: 'user-profiles',
                class: 'user',
                owner: 'platform',
                retention: CONFIG.retentionPolicies.user,
                created: new Date().toISOString()
            });

            this.registerDataAsset({
                id: 'analytics-data',
                class: 'analytics',
                owner: 'platform',
                retention: CONFIG.retentionPolicies.analytics,
                created: new Date().toISOString()
            });

            // Setup data export capabilities
            this.setupDataExport();

            // Setup access control
            this.setupAccessControl();
        }

        registerDataAsset(asset) {
            this.dataRegistry.set(asset.id, {
                ...asset,
                registeredAt: new Date().toISOString(),
                lastAccessed: null,
                accessCount: 0
            });

            this.stats.totalDataAssets++;
            if (asset.owner === 'platform') {
                this.stats.ownedData++;
            } else {
                this.stats.thirdPartyData++;
            }

            this.logGovernance('REGISTER', `Data asset registered: ${asset.id}`);
        }

        setupDataExport() {
            // Expose data export API
            window.SPORTIQ = window.SPORTIQ || {};
            window.SPORTIQ.exportData = (dataType, format = 'json') => {
                return this.exportData(dataType, format);
            };
        }

        exportData(dataType, format) {
            this.stats.dataExports++;

            const asset = this.dataRegistry.get(dataType);
            if (!asset) {
                throw new Error(`Data asset not found: ${dataType}`);
            }

            // Log export
            this.logAccess({
                action: 'export',
                dataType: dataType,
                format: format,
                timestamp: new Date().toISOString()
            });

            // Gather data
            let data = this.gatherData(dataType);

            // Format data
            if (format === 'json') {
                return JSON.stringify(data, null, 2);
            } else if (format === 'csv') {
                return this.convertToCSV(data);
            }

            return data;
        }

        gatherData(dataType) {
            switch (dataType) {
                case 'platform-content':
                    return this.gatherPlatformContent();
                case 'user-profiles':
                    return this.gatherUserProfiles();
                case 'analytics-data':
                    return this.gatherAnalytics();
                default:
                    return {};
            }
        }

        gatherPlatformContent() {
            const content = [];

            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach(article => {
                        content.push({
                            id: article.id,
                            title: article.title,
                            author: article.author,
                            publishedAt: article.publishedAt,
                            category: article.category
                        });
                    });
                }
            }

            return content;
        }

        gatherUserProfiles() {
            // Gather anonymized user data
            if (window.AuthEngine) {
                const currentUser = window.AuthEngine.getCurrentUser();
                if (currentUser) {
                    return [{
                        userId: currentUser.id,
                        username: currentUser.username,
                        createdAt: currentUser.createdAt
                    }];
                }
            }
            return [];
        }

        gatherAnalytics() {
            const analytics = {};

            // Gather from various layers
            if (window.SPORTIQ) {
                Object.keys(window.SPORTIQ).forEach(key => {
                    if (key.includes('Stats')) {
                        analytics[key] = window.SPORTIQ[key];
                    }
                });
            }

            return analytics;
        }

        convertToCSV(data) {
            if (!Array.isArray(data) || data.length === 0) {
                return '';
            }

            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => {
                return Object.values(row).map(val => {
                    return typeof val === 'string' ? `"${val}"` : val;
                }).join(',');
            }).join('\n');

            return `${headers}\n${rows}`;
        }

        setupAccessControl() {
            // Intercept data access attempts
            const originalFetch = window.fetch;
            window.fetch = (...args) => {
                this.logAccess({
                    action: 'fetch',
                    url: args[0],
                    timestamp: new Date().toISOString()
                });
                this.stats.accessRequests++;
                return originalFetch.apply(window, args);
            };

            // Monitor localStorage access
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function (key, value) {
                this.logAccess({
                    action: 'localStorage.setItem',
                    key: key,
                    timestamp: new Date().toISOString()
                });
                return originalSetItem.apply(localStorage, arguments);
            }.bind(this);
        }

        logAccess(accessData) {
            this.accessLog.push(accessData);
            if (this.accessLog.length > 1000) {
                this.accessLog.shift();
            }
        }

        enforceRetentionPolicies() {
            const now = Date.now();

            this.dataRegistry.forEach((asset, id) => {
                if (asset.retention === 'indefinite') return;

                const retentionMs = this.parseRetention(asset.retention);
                const createdAt = new Date(asset.created).getTime();
                const age = now - createdAt;

                if (age > retentionMs) {
                    this.purgeData(id);
                }
            });
        }

        parseRetention(retention) {
            const match = retention.match(/(\d+)(days|hours|minutes)/);
            if (!match) return Infinity;

            const value = parseInt(match[1]);
            const unit = match[2];

            switch (unit) {
                case 'days':
                    return value * 24 * 60 * 60 * 1000;
                case 'hours':
                    return value * 60 * 60 * 1000;
                case 'minutes':
                    return value * 60 * 1000;
                default:
                    return Infinity;
            }
        }

        purgeData(dataId) {
            const asset = this.dataRegistry.get(dataId);
            if (!asset) return;

            this.logGovernance('PURGE', `Data purged per retention policy: ${dataId}`);

            // Remove from registry
            this.dataRegistry.delete(dataId);
            this.stats.totalDataAssets--;

            // Notify other systems
            document.dispatchEvent(new CustomEvent('data:purged', {
                detail: { dataId, asset }
            }));
        }

        generateDataMap() {
            const dataMap = {
                timestamp: new Date().toISOString(),
                totalAssets: this.stats.totalDataAssets,
                assets: []
            };

            this.dataRegistry.forEach((asset, id) => {
                dataMap.assets.push({
                    id: id,
                    class: asset.class,
                    owner: asset.owner,
                    retention: asset.retention,
                    created: asset.created,
                    accessCount: asset.accessCount
                });
            });

            return dataMap;
        }

        startMonitoring() {
            console.log('🚀 [Layer 174] Starting data governance monitoring...');

            setInterval(() => {
                this.enforceRetentionPolicies();
                this.auditDataAccess();
            }, CONFIG.intervals.governanceCheck);
        }

        auditDataAccess() {
            // Analyze access patterns
            const recentAccess = this.accessLog.slice(-100);

            // Detect anomalous access
            const accessFrequency = {};
            recentAccess.forEach(access => {
                const key = access.action;
                accessFrequency[key] = (accessFrequency[key] || 0) + 1;
            });

            // Flag high-frequency access
            Object.entries(accessFrequency).forEach(([action, count]) => {
                if (count > 50) {
                    this.logGovernance('AUDIT', `High-frequency access detected: ${action} (${count} times)`);
                }
            });
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.dataSovereigntyStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer174-dashboard';
            dashboard.className = 'layer174-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer174-dashboard-header">
                    <h3>🔐 Data Sovereignty</h3>
                    <button class="layer174-close-btn">×</button>
                </div>
                <div class="layer174-dashboard-content">
                    <div class="layer174-stat">
                        <span class="layer174-stat-label">Data Assets:</span>
                        <span class="layer174-stat-value" id="layer174-assets">0</span>
                    </div>
                    <div class="layer174-stat">
                        <span class="layer174-stat-label">Owned:</span>
                        <span class="layer174-stat-value" id="layer174-owned">0</span>
                    </div>
                    <div class="layer174-stat">
                        <span class="layer174-stat-label">Exports:</span>
                        <span class="layer174-stat-value" id="layer174-exports">0</span>
                    </div>
                    <div class="layer174-stat">
                        <span class="layer174-stat-label">Access Requests:</span>
                        <span class="layer174-stat-value" id="layer174-requests">0</span>
                    </div>
                    <div class="layer174-log" id="layer174-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer174-toggle-btn';
            toggleBtn.innerHTML = '🔐';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer174-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const assetsEl = document.getElementById('layer174-assets');
            const ownedEl = document.getElementById('layer174-owned');
            const exportsEl = document.getElementById('layer174-exports');
            const requestsEl = document.getElementById('layer174-requests');

            if (assetsEl) assetsEl.textContent = this.stats.totalDataAssets;
            if (ownedEl) ownedEl.textContent = this.stats.ownedData;
            if (exportsEl) exportsEl.textContent = this.stats.dataExports;
            if (requestsEl) requestsEl.textContent = this.stats.accessRequests;

            const logEl = document.getElementById('layer174-log');
            if (logEl && this.dataGovernanceLog.length > 0) {
                const recentLogs = this.dataGovernanceLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer174-log-entry">
                        <span class="layer174-log-type">${log.type}</span>
                        <span class="layer174-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logGovernance(type, message) {
            this.dataGovernanceLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.dataGovernanceLog.length > 100) this.dataGovernanceLog.shift();
        }

        getDataMap() {
            return this.generateDataMap();
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDataSovereignty);
    } else {
        initDataSovereignty();
    }

    function initDataSovereignty() {
        const sovereignty = new DataSovereignty();
        window.Layer174_DataSovereignty = sovereignty;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.dataSovereignty = sovereignty;
        document.dispatchEvent(new CustomEvent('layer174:ready', { detail: { sovereignty } }));
        console.log('🎯 [Layer 174] Data Sovereignty - Ready');
    }

})();
