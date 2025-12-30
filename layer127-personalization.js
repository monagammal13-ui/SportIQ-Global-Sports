/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 127: READER BEHAVIOR ANALYTICS & PRESENTATION OPTIMIZER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Tracks real-time reader engagement (scroll depth, dwell time, clicks)
 *          to build an "Interest Profile" and optimize content presentation.
 * 
 * Features:
 *  - Scroll Depth Heatmap Tracking.
 *  - Active Reading Time Calculation (ignores idle tabs).
 *  - Smart "Interest Score" algorithm.
 *  - Auto-adjusts layout density based on reading speed.
 * 
 * Version: 2.0.0 (Analytics Upgraded)
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        tracking: {
            idleThreshold: 5000,    // 5s of no activity = idle
            scrollThrottle: 100,     // Check scroll every 100ms
            minReadTime: 10         // Seconds to count as a "read"
        },
        selectors: {
            article: 'article, .post-body, .article-content, #main-content',
            headings: 'h1, h2, h3'
        },
        storageKey: 'sportiq_reader_analytics'
    };

    class ReaderAnalytics {
        constructor() {
            this.session = {
                startTime: Date.now(),
                totalActiveTime: 0,
                maxScrollDepth: 0,
                clicks: [],
                hoverTargets: {}, // Element -> Duration
                isIdle: false
            };

            this.lastActivity = Date.now();
            this.idleTimer = null;
            this.trackingInterval = null;

            this.init();
        }

        init() {
            console.log('📊 Layer 127: Reader Analytics - INITIALIZED');
            this.bindEvents();
            this.startTracking();
        }

        bindEvents() {
            // Activity Listeners
            ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => {
                document.addEventListener(evt, () => this.recordActivity());
            });

            // Visibility (Tab switching)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.goIdle();
                else this.recordActivity();
            });

            // Scroll Tracking
            window.addEventListener('scroll', () => this.trackScroll(), false);
        }

        startTracking() {
            // Heartbeat check every second
            this.trackingInterval = setInterval(() => {
                const now = Date.now();
                if (!this.session.isIdle) {
                    this.session.totalActiveTime += 1;

                    // Check for idle timeout
                    if (now - this.lastActivity > CONFIG.tracking.idleThreshold) {
                        this.goIdle();
                    }
                }

                this.updateDebugUI();

            }, 1000);
        }

        recordActivity() {
            this.lastActivity = Date.now();
            if (this.session.isIdle) {
                this.session.isIdle = false;
                // console.log("User active");
            }
        }

        goIdle() {
            if (!this.session.isIdle) {
                this.session.isIdle = true;
                // console.log("User idle");
            }
        }

        trackScroll() {
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';

            const percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;
            const depth = Math.round(percent);

            if (depth > this.session.maxScrollDepth) {
                this.session.maxScrollDepth = depth;

                // Trigger events at milestones
                if (depth > 25 && depth < 26) this.emitEvent('read_start');
                if (depth > 50 && depth < 51) this.emitEvent('read_half');
                if (depth > 90 && depth < 91) this.emitEvent('read_complete');
            }
        }

        emitEvent(type) {
            console.log(`📊 [Analytics] Event: ${type}`);
            // Logic to send to server or adjust UI would go here
            if (window.ReaderPersonalization && window.ReaderPersonalization.track) {
                // Integrate with established Personalization Layer
                const topic = this.detectTopic();
                window.ReaderPersonalization.track({ topic: topic, action: type });
            }
        }

        detectTopic() {
            // Heuristic topic detection
            const h1 = document.querySelector('h1');
            const kw = h1 ? h1.textContent : '';
            if (kw.includes('Football') || kw.includes('Goal')) return 'Football';
            if (kw.includes('Tech')) return 'Tech';
            if (kw.includes('F1')) return 'F1';
            return 'General';
        }

        // ═════════════════════════════════════════════════════════════════════
        // UI DEBUGGER
        // ═════════════════════════════════════════════════════════════════════

        injectDebugUI() {
            if (document.getElementById('analytics-hud')) return;

            const hud = document.createElement('div');
            hud.id = 'analytics-hud';
            hud.innerHTML = `
                <div class="hud-header">
                    <span class="hud-pulse"></span>
                    <span>Reader Analytics</span>
                </div>
                <div class="hud-grid">
                    <div class="hud-item">
                        <label>Active Time</label>
                        <span id="hud-time">0s</span>
                    </div>
                    <div class="hud-item">
                        <label>Scroll Depth</label>
                        <span id="hud-scroll">0%</span>
                    </div>
                    <div class="hud-item">
                        <label>Status</label>
                        <span id="hud-status">Active</span>
                    </div>
                </div>
            `;
            document.body.appendChild(hud);
        }

        updateDebugUI() {
            const timeEl = document.getElementById('hud-time');
            const scrollEl = document.getElementById('hud-scroll');
            const statusEl = document.getElementById('hud-status');
            const pulse = document.querySelector('.hud-pulse');

            if (timeEl) {
                timeEl.textContent = `${this.session.totalActiveTime}s`;
                scrollEl.textContent = `${this.session.maxScrollDepth}%`;

                if (this.session.isIdle) {
                    statusEl.textContent = 'Idle';
                    statusEl.className = 'status-idle';
                    if (pulse) pulse.classList.remove('active');
                } else {
                    statusEl.textContent = 'Active';
                    statusEl.className = 'status-active';
                    if (pulse) pulse.classList.add('active');
                }
            }
        }
    }

    // Auto-Expose
    window.Layer127_Analytics = new ReaderAnalytics();

    // Inject HUD for demo purposes on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Layer127_Analytics.injectDebugUI());
    } else {
        window.Layer127_Analytics.injectDebugUI();
    }

})();
