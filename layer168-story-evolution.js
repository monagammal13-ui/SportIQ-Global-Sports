/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 168 – REAL-TIME STORY EVOLUTION TRACKER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Track and update evolving stories dynamically as new information arrives.
 * 
 * @version 1.0.0
 * @layer 168
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 168,
        name: 'Real-Time Story Evolution Tracker',

        updateCheckInterval: 30000, // 30 seconds
        evolutionThreshold: 24, // hours to track story evolution

        intervals: {
            updateCheck: 30000,
            analyticsUpdate: 60000
        }
    };

    class StoryEvolutionTracker {
        constructor() {
            this.evolvingStories = new Map();
            this.storyUpdates = new Map();
            this.evolutionLog = [];
            this.config = null;
            this.stats = {
                totalStoriesTracked: 0,
                activeEvolvingStories: 0,
                totalUpdates: 0,
                rapidUpdates: 0
            };

            this.init();
        }

        async init() {
            console.log('📡 [Layer 168] Story Evolution Tracker - Initializing...');

            try {
                await this.loadConfiguration();
                this.startEvolutionTracking();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 168] Story Evolution Tracker - Active');
                this.logEvolution('SYSTEM', 'Story evolution tracker initialized');

            } catch (error) {
                console.error('❌ [Layer 168] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer168-story-evolution.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        trackStory(article) {
            if (!article || !article.id) return null;

            try {
                const storyId = this.generateStoryId(article);

                let evolution = this.evolvingStories.get(storyId);

                if (!evolution) {
                    // New story to track
                    evolution = {
                        storyId: storyId,
                        originalArticle: article,
                        versions: [],
                        updates: [],
                        timeline: [],
                        status: 'evolving',
                        createdAt: new Date().toISOString(),
                        lastUpdate: new Date().toISOString()
                    };

                    this.evolvingStories.set(storyId, evolution);
                    this.stats.totalStoriesTracked++;
                    this.stats.activeEvolvingStories++;
                }

                // Add version
                const version = {
                    versionId: `v${evolution.versions.length + 1}`,
                    article: article,
                    timestamp: new Date().toISOString(),
                    changes: this.detectChanges(evolution, article)
                };

                evolution.versions.push(version);
                evolution.lastUpdate = new Date().toISOString();

                // Detect significant updates
                if (version.changes.significant) {
                    this.handleSignificantUpdate(evolution, version);
                    this.stats.rapidUpdates++;
                }

                this.stats.totalUpdates++;

                this.logEvolution('TRACK', `Story "${article.title}" - Version ${version.versionId}`);

                document.dispatchEvent(new CustomEvent('story:evolved', {
                    detail: { evolution, version }
                }));

                return evolution;

            } catch (error) {
                console.error(`❌ [Layer 168] Tracking failed for story:`, error);
                return null;
            }
        }

        generateStoryId(article) {
            // Generate story ID based on topic/subject
            const title = article.title || '';
            const normalized = title.toLowerCase()trim();
            const hash = this.simpleHash(normalized);
            return `story-${hash}`;
        }

        simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }

        detectChanges(evolution, newArticle) {
            const changes = {
                significant: false,
                titleChanged: false,
                contentExpanded: false,
                newInformation: false,
                corrections: false,
                summary: []
            };

            if (evolution.versions.length === 0) {
                changes.significant = true;
                changes.summary.push('Initial version');
                return changes;
            }

            const lastVersion = evolution.versions[evolution.versions.length - 1];
            const lastArticle = lastVersion.article;

            // Check title changes
            if (lastArticle.title !== newArticle.title) {
                changes.titleChanged = true;
                changes.significant = true;
                changes.summary.push('Headline updated');
            }

            // Check content expansion
            const lastContentLength = (lastArticle.content || '').length;
            const newContentLength = (newArticle.content || '').length;

            if (newContentLength > lastContentLength * 1.2) {
                changes.contentExpanded = true;
                changes.significant = true;
                changes.summary.push('Significant content expansion');
            }

            // Detect correction keywords
            const correctionKeywords = ['correction', 'update', 'clarification', 'revised'];
            const newContent = (newArticle.content || '').toLowerCase();

            if (correctionKeywords.some(keyword => newContent.includes(keyword))) {
                changes.corrections = true;
                changes.significant = true;
                changes.summary.push('Contains corrections or clarifications');
            }

            // Check for new quotes or sources
            const lastQuoteCount = (lastArticle.content || '').match(/"|"/g)?.length || 0;
            const newQuoteCount = (newArticle.content || '').match(/"|"/g)?.length || 0;

            if (newQuoteCount > lastQuoteCount) {
                changes.newInformation = true;
                changes.summary.push(`${newQuoteCount - lastQuoteCount} new quotes added`);
            }

            return changes;
        }

        handleSignificantUpdate(evolution, version) {
            // Create update notification
            const update = {
                updateId: `update-${Date.now()}`,
                storyId: evolution.storyId,
                versionId: version.versionId,
                timestamp: new Date().toISOString(),
                changes: version.changes,
                priority: 'high'
            };

            evolution.updates.push(update);

            // Notify subscribers
            this.notifySubscribers(evolution, update);

            // Add to timeline
            evolution.timeline.push({
                event: 'significant_update',
                timestamp: new Date().toISOString(),
                description: version.changes.summary.join(', '),
                version: version.versionId
            });
        }

        notifySubscribers(evolution, update) {
            // Dispatch event for UI updates
            document.dispatchEvent(new CustomEvent('story:majorUpdate', {
                detail: { evolution, update }
            }));

            // Show visual notification
            this.showUpdateNotification(evolution, update);
        }

        showUpdateNotification(evolution, update) {
            const notification = document.createElement('div');
            notification.className = 'story-evolution-notification';
            notification.innerHTML = `
                <div class="notification-header">
                    <span class="notification-icon">🔄</span>
                    <span class="notification-title">Story Updated</span>
                </div>
                <div class="notification-body">
                    <p><strong>${evolution.originalArticle.title}</strong></p>
                    <p>${update.changes.summary.join(', ')}</p>
                </div>
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }

        startEvolutionTracking() {
            console.log('🚀 [Layer 168] Starting story evolution tracking...');

            setInterval(() => {
                this.checkForUpdates();
                this.cleanupOldStories();
            }, CONFIG.intervals.updateCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.trackStory(event.detail.article);
                }
            });

            document.addEventListener('article:updated', (event) => {
                if (event.detail && event.detail.article) {
                    this.trackStory(event.detail.article);
                }
            });
        }

        checkForUpdates() {
            // Check for updates from news distributor
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        this.trackStory(article);
                    });
                }
            }
        }

        cleanupOldStories() {
            const threshold = CONFIG.evolutionThreshold * 60 * 60 * 1000; // Convert to milliseconds
            const now = Date.now();

            this.evolvingStories.forEach((evolution, storyId) => {
                const lastUpdate = new Date(evolution.lastUpdate).getTime();
                const age = now - lastUpdate;

                if (age > threshold && evolution.status === 'evolving') {
                    evolution.status = 'archived';
                    this.stats.activeEvolvingStories--;
                    this.logEvolution('ARCHIVE', `Story "${evolution.originalArticle.title}" archived`);
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
                window.SPORTIQ.storyEvolutionStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer168-dashboard';
            dashboard.className = 'layer168-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer168-dashboard-header">
                    <h3>📡 Story Evolution Tracker</h3>
                    <button class="layer168-close-btn">×</button>
                </div>
                <div class="layer168-dashboard-content">
                    <div class="layer168-stat">
                        <span class="layer168-stat-label">Tracked:</span>
                        <span class="layer168-stat-value" id="layer168-total">0</span>
                    </div>
                    <div class="layer168-stat">
                        <span class="layer168-stat-label">Active:</span>
                        <span class="layer168-stat-value" id="layer168-active">0</span>
                    </div>
                    <div class="layer168-stat">
                        <span class="layer168-stat-label">Updates:</span>
                        <span class="layer168-stat-value" id="layer168-updates">0</span>
                    </div>
                    <div class="layer168-log" id="layer168-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer168-toggle-btn';
            toggleBtn.innerHTML = '📡';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer168-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer168-total');
            const activeEl = document.getElementById('layer168-active');
            const updatesEl = document.getElementById('layer168-updates');

            if (totalEl) totalEl.textContent = this.stats.totalStoriesTracked;
            if (activeEl) activeEl.textContent = this.stats.activeEvolvingStories;
            if (updatesEl) updatesEl.textContent = this.stats.totalUpdates;

            const logEl = document.getElementById('layer168-log');
            if (logEl && this.evolutionLog.length > 0) {
                const recentLogs = this.evolutionLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer168-log-entry">
                        <span class="layer168-log-type">${log.type}</span>
                        <span class="layer168-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logEvolution(type, message) {
            this.evolutionLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.evolutionLog.length > 100) this.evolutionLog.shift();
        }

        getEvolution(storyId) {
            return this.evolvingStories.get(storyId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStoryEvolution);
    } else {
        initStoryEvolution();
    }

    function initStoryEvolution() {
        const tracker = new StoryEvolutionTracker();
        window.Layer168_StoryEvolution = tracker;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.storyEvolution = tracker;
        document.dispatchEvent(new CustomEvent('layer168:ready', { detail: { tracker } }));
        console.log('🎯 [Layer 168] Story Evolution Tracker - Ready');
    }

})();
