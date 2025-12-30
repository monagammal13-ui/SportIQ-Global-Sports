/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 182 – LIVE STORY STREAM ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Continuous live updates for developing stories without page reloads.
 * 
 * @version 1.0.0
 * @layer 182
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 182,
        name: 'Live Story Stream Engine',

        intervals: {
            streamUpdate: 3000,
            verificationCheck: 10000,
            analyticsUpdate: 60000
        }
    };

    class LiveStreamEngine {
        constructor() {
            this.liveStories = new Map();
            this.updateStream = [];
            this.config = null;
            this.stats = {
                liveStories: 0,
                totalUpdates: 0,
                verifiedUpdates: 0
            };

            this.init();
        }

        async init() {
            console.log('📡 [Layer 182] Live Stream - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupLiveStream();
                this.startStreaming();
                this.createStreamContainer();

                console.log('✅ [Layer 182] Live Stream - Active');

            } catch (error) {
                console.error('❌ [Layer 182] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer182-live-stream.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupLiveStream() {
            document.addEventListener('breaking:alert', (event) => {
                if (event.detail && event.detail.article) {
                    this.addToLiveStream(event.detail.article);
                }
            });

            document.addEventListener('article:updated', (event) => {
                if (event.detail && event.detail.article) {
                    this.handleStoryUpdate(event.detail.article);
                }
            });
        }

        addToLiveStream(article) {
            if (!this.liveStories.has(article.id)) {
                this.liveStories.set(article.id, {
                    article: article,
                    updates: [],
                    startedAt: new Date().toISOString(),
                    lastUpdate: new Date().toISOString()
                });
                this.stats.liveStories++;
            }

            this.renderStreamItem(article);
        }

        addBreakingStory(article) {
            this.addToLiveStream(article);
        }

        handleStoryUpdate(article) {
            if (this.liveStories.has(article.id)) {
                const story = this.liveStories.get(article.id);
                story.updates.push({
                    content: article.content,
                    timestamp: new Date().toISOString()
                });
                story.lastUpdate = new Date().toISOString();
                this.stats.totalUpdates++;

                this.updateStreamItem(article.id);
            }
        }

        renderStreamItem(article) {
            const container = document.getElementById('live-stream-container');
            if (!container) return;

            const item = document.createElement('div');
            item.id = `stream-item-${article.id}`;
            item.className = 'live-stream-item';
            item.innerHTML = `
                <div class="stream-item-badge">🔴 LIVE</div>
                <h4>${article.title}</h4>
                <div class="stream-item-updates" id="updates-${article.id}"></div>
            `;

            container.insertBefore(item, container.firstChild);
        }

        updateStreamItem(articleId) {
            const updatesContainer = document.getElementById(`updates-${articleId}`);
            if (!updatesContainer) return;

            const story = this.liveStories.get(articleId);
            if (story && story.updates.length > 0) {
                const latestUpdate = story.updates[story.updates.length - 1];
                const updateElement = document.createElement('div');
                updateElement.className = 'stream-update';
                updateElement.textContent = latestUpdate.content.substring(0, 200) + '...';
                updatesContainer.insertBefore(updateElement, updatesContainer.firstChild);
            }
        }

        createStreamContainer() {
            let container = document.getElementById('live-stream-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'live-stream-container';
                container.className = 'live-stream-container hidden';
                document.body.appendChild(container);
            }
        }

        startStreaming() {
            setInterval(() => {
                this.checkForUpdates();
            }, CONFIG.intervals.streamUpdate);
        }

        checkForUpdates() {
            // Simulated update checking
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLiveStream);
    } else {
        initLiveStream();
    }

    function initLiveStream() {
        const stream = new LiveStreamEngine();
        window.Layer182_LiveStream = stream;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.liveStream = stream;
        console.log('🎯 [Layer 182] Live Stream Engine - Ready');
    }

})();
