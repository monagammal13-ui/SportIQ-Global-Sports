/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 186 – GLOBAL TIMELINE & EVENT CORRELATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Build interactive timelines correlating events across regions/time.
 * 
 * @version 1.0.0
 * @layer 186
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 186,
        name: 'Global Timeline & Event Correlation Engine',

        intervals: {
            correlationCheck: 30000,
            analyticsUpdate: 60000
        }
    };

    class TimelineCorrelation {
        constructor() {
            this.timelines = new Map();
            this.events = new Map();
            this.correlations = [];
            this.config = null;
            this.stats = {
                timelines: 0,
                events: 0,
                correlations: 0
            };

            this.init();
        }

        async init() {
            console.log('📅 [Layer 186] Timeline Correlation - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupTimelines();
                this.startCorrelation();
                this.createDashboard();

                console.log('✅ [Layer 186] Timeline Correlation - Active');

            } catch (error) {
                console.error('❌ [Layer 186] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer186-timeline.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupTimelines() {
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.addToTimeline(event.detail.article);
                }
            });
        }

        addToTimeline(article) {
            const event = {
                id: `event-${Date.now()}`,
                articleId: article.id,
                title: article.title,
                timestamp: article.publishedAt || new Date().toISOString(),
                region: article.region || 'global',
                category: article.category,
                tags: article.tags || []
            };

            this.events.set(event.id, event);
            this.stats.events++;

            // Find correlations
            this.findCorrelations(event);

            // Update or create timeline
            this.updateTimeline(event);
        }

        findCorrelations(event) {
            this.events.forEach((existingEvent, id) => {
                if (id === event.id) return;

                const correlation = this.calculateCorrelation(event, existingEvent);
                if (correlation.score > 0.5) {
                    this.correlations.push({
                        event1: event.id,
                        event2: id,
                        score: correlation.score,
                        type: correlation.type,
                        timestamp: new Date().toISOString()
                    });
                    this.stats.correlations++;
                }
            });
        }

        calculateCorrelation(event1, event2) {
            let score = 0;
            let type = 'unknown';

            // Same category
            if (event1.category === event2.category) {
                score += 0.3;
                type = 'category';
            }

            // Same region
            if (event1.region === event2.region) {
                score += 0.2;
                type = 'regional';
            }

            // Shared tags
            const sharedTags = event1.tags.filter(tag => event2.tags.includes(tag));
            if (sharedTags.length > 0) {
                score += sharedTags.length * 0.2;
                type = 'thematic';
            }

            // Time proximity (within 24 hours)
            const timeDiff = Math.abs(new Date(event1.timestamp) - new Date(event2.timestamp));
            if (timeDiff < 24 * 60 * 60 * 1000) {
                score += 0.3;
                type = 'temporal';
            }

            return { score: Math.min(score, 1), type };
        }

        updateTimeline(event) {
            const timelineKey = `${event.category}-${event.region}`;

            if (!this.timelines.has(timelineKey)) {
                this.timelines.set(timelineKey, {
                    id: timelineKey,
                    category: event.category,
                    region: event.region,
                    events: [],
                    createdAt: new Date().toISOString()
                });
                this.stats.timelines++;
            }

            const timeline = this.timelines.get(timelineKey);
            timeline.events.push(event.id);
            timeline.events.sort((a, b) => {
                const eventA = this.events.get(a);
                const eventB = this.events.get(b);
                return new Date(eventA.timestamp) - new Date(eventB.timestamp);
            });
        }

        renderTimeline(timelineId) {
            const timeline = this.timelines.get(timelineId);
            if (!timeline) return;

            const container = document.createElement('div');
            container.className = 'interactive-timeline';
            container.innerHTML = `
                <h3>Timeline: ${timeline.category} - ${timeline.region}</h3>
                <div class="timeline-events">
                    ${timeline.events.map(eventId => {
                const event = this.events.get(eventId);
                return `
                            <div class="timeline-event" data-event-id="${event.id}">
                                <div class="event-marker"></div>
                                <div class="event-content">
                                    <div class="event-time">${new Date(event.timestamp).toLocaleString()}</div>
                                    <div class="event-title">${event.title}</div>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

            return container;
        }

        startCorrelation() {
            setInterval(() => {
                this.recheckCorrelations();
            }, CONFIG.intervals.correlationCheck);
        }

        recheckCorrelations() {
            // Periodic correlation checking
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer186-dashboard';
            dashboard.className = 'layer186-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer186-dashboard-header">
                    <h3>📅 Timelines</h3>
                    <button class="layer186-close-btn">×</button>
                </div>
                <div class="layer186-dashboard-content">
                    <div class="layer186-stat">
                        <span class="layer186-stat-label">Timelines:</span>
                        <span class="layer186-stat-value" id="layer186-timelines">0</span>
                    </div>
                    <div class="layer186-stat">
                        <span class="layer186-stat-label">Events:</span>
                        <span class="layer186-stat-value" id="layer186-events">0</span>
                    </div>
                    <div class="layer186-stat">
                        <span class="layer186-stat-label">Correlations:</span>
                        <span class="layer186-stat-value" id="layer186-correlations">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer186-toggle-btn';
            toggleBtn.innerHTML = '📅';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer186-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const timelinesEl = document.getElementById('layer186-timelines');
            const eventsEl = document.getElementById('layer186-events');
            const correlationsEl = document.getElementById('layer186-correlations');

            if (timelinesEl) timelinesEl.textContent = this.stats.timelines;
            if (eventsEl) eventsEl.textContent = this.stats.events;
            if (correlationsEl) correlationsEl.textContent = this.stats.correlations;
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimeline);
    } else {
        initTimeline();
    }

    function initTimeline() {
        const timeline = new TimelineCorrelation();
        window.Layer186_Timeline = timeline;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.timeline = timeline;
        console.log('🎯 [Layer 186] Timeline Correlation Engine - Ready');
    }

})();
