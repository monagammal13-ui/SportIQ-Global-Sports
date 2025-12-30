/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 100: GLOBAL CONTENT SYNDICATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Auto-publish content to external platforms (Twitter, FB, RSS, Partners).
 * Features: Post formatting, scheduling, cross-posting, performance tracking.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        syndication: {
            configPath: '../api-json/syndication-config.json',
            maxBatchSize: 5,
            retryAttempts: 3
        },
        events: {
            contentPublished: 'syndication:published',
            publishFailed: 'syndication:failed',
            queueUpdated: 'syndication:queue-updated'
        }
    };

    const state = {
        platforms: new Map(),
        queue: [],
        history: [],
        config: null,
        isProcessing: false
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SYNDICATION CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SyndicationEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.syndication.configPath);
                if (response.ok) {
                    state.config = await response.json();

                    if (state.config.platforms) {
                        this.registerPlatforms(state.config.platforms);
                    }
                }
            } catch (error) {
                console.warn('⚠️ [Syndication] Failed to load config');
            }

            console.log('📡 [Syndication] Engine initialized');
            this.processQueue(); // Start processor
        },

        registerPlatforms: function (platforms) {
            platforms.forEach(p => {
                state.platforms.set(p.id, {
                    ...p,
                    status: 'connected', // active, connected, disconnected
                    lastSync: Date.now()
                });
            });
        },

        publish: function (content, targets = 'all') {
            const job = {
                id: 'sync_' + Date.now(),
                content,
                targets: targets === 'all' ? Array.from(state.platforms.keys()) : targets,
                status: 'pending',
                timestamp: Date.now()
            };

            state.queue.push(job);
            this.notifyQueueUpdate();
            this.processQueue();

            return job.id;
        },

        processQueue: async function () {
            if (state.isProcessing || state.queue.length === 0) return;

            state.isProcessing = true;
            const job = state.queue.shift();

            try {
                console.log(`📡 [Syndication] Processing job ${job.id}`);

                // Simulate publishing to each target
                const results = await Promise.all(job.targets.map(targetId =>
                    this.sendToPlatform(targetId, job.content)
                ));

                // Add to history
                state.history.unshift({
                    ...job,
                    status: 'completed',
                    results,
                    completedAt: Date.now()
                });

                // Notify
                document.dispatchEvent(new CustomEvent(CONFIG.events.contentPublished, {
                    detail: { jobId: job.id, results }
                }));

            } catch (error) {
                console.error(`❌ [Syndication] Job ${job.id} failed`, error);
                state.history.unshift({ ...job, status: 'failed', error: error.message });
            }

            state.isProcessing = false;
            this.notifyQueueUpdate();

            // Render update
            SyndicationRenderer.renderDashboard('syndication-dashboard');

            // Loop if more items
            if (state.queue.length > 0) {
                setTimeout(() => this.processQueue(), 1000);
            }
        },

        sendToPlatform: async function (platformId, content) {
            const platform = state.platforms.get(platformId);
            if (!platform) throw new Error(`Unknown platform: ${platformId}`);

            // Format content based on platform rules (mock logic)
            let formattedBody = content.body;
            if (platform.type === 'twitter' && formattedBody.length > 280) {
                formattedBody = formattedBody.substring(0, 277) + '...';
            }

            // Simulate API latency
            await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

            return {
                platform: platform.name,
                status: 'published',
                externalId: 'ext_' + Math.random().toString(36).substr(2, 9),
                timestamp: Date.now()
            };
        },

        notifyQueueUpdate: function () {
            const event = new CustomEvent(CONFIG.events.queueUpdated, {
                detail: { count: state.queue.length }
            });
            document.dispatchEvent(event);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const SyndicationRenderer = {
        renderDashboard: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return; // Might not exist on all pages

            // Header
            let html = `
                <div class="syndication-header">
                    <h3>Content Distribution Hub</h3>
                    <button onclick="window.SyndicationSystem.publishDemo()">Test Publish</button>
                </div>
            `;

            // Platforms Grid
            html += `<div class="platforms-grid">`;
            state.platforms.forEach(p => {
                html += `
                    <div class="platform-card ${p.status}">
                        <div class="platform-icon">${this.getIcon(p.type)}</div>
                        <div class="platform-details">
                            <span class="platform-name">${p.name}</span>
                            <span class="platform-status">${p.status}</span>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;

            // Recent Activity
            html += `
                <div class="activity-log">
                    <h4>Recent Broadcasts</h4>
                    ${state.history.slice(0, 5).map(job => `
                        <div class="log-item ${job.status}">
                            <span class="log-status">${job.status === 'completed' ? '✔' : '❌'}</span>
                            <div class="log-content">
                                <div class="log-title">${job.content.title}</div>
                                <div class="log-meta">To: ${job.targets.length} platforms • ${new Date(job.completedAt).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    `).join('')}
                    ${state.history.length === 0 ? '<div class="no-activity">No recent broadcasts</div>' : ''}
                </div>
            `;

            container.innerHTML = html;
        },

        getIcon: function (type) {
            const icons = {
                twitter: '🐦',
                facebook: '📘',
                rss: '📡',
                telegram: '✈️',
                partner: '🤝'
            };
            return icons[type] || '🌐';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.SyndicationSystem = {
        init: SyndicationEngine.initialize.bind(SyndicationEngine),
        publish: SyndicationEngine.publish.bind(SyndicationEngine),
        render: SyndicationRenderer.renderDashboard.bind(SyndicationRenderer),

        // Demo
        publishDemo: () => {
            SyndicationEngine.publish({
                title: 'Live: Man City vs Liverpool',
                body: 'Match underway at the Etihad! Follow live coverage now. #PremierLeague',
                url: 'https://sportiq.global/match/123'
            });
        },

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SyndicationEngine.initialize());
    } else {
        SyndicationEngine.initialize();
    }

})();
