/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 124: REAL-TIME NOTIFICATION SCHEDULER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Manages the scheduling and dispatch of push notifications for breaking news.
 * Features: Priority queues, scheduled delivery, and topic subscription matching.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        scheduler: {
            tickRate: 1000,
            defaultDelay: 0 // Instant by default
        },
        selectors: {
            container: '#notification-scheduler-panel'
        }
    };

    const state = {
        queue: [], // { id, title, body, topic, timestamp, status }
        subscribers: new Set(['football', 'f1', 'breaking']), // Mock user prefs
        permission: 'default'
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULER ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const NotifyScheduler = {
        initialize: function () {
            console.log('🔔 [NotifyScheduler] Engine initialized');

            this.checkPermission();

            // Listen for breaking news events (simulated or from other layers)
            document.addEventListener('newsgen:breaking-news', (e) => {
                if (e.detail) this.schedule(e.detail);
            });

            // Start processing loop
            setInterval(() => this.processQueue(), CONFIG.scheduler.tickRate);
        },

        checkPermission: async function () {
            if ('Notification' in window) {
                state.permission = Notification.permission;
            }
        },

        requestPermission: async function () {
            if ('Notification' in window) {
                const result = await Notification.requestPermission();
                state.permission = result;
                console.log(`🔔 [NotifyScheduler] Permission: ${result}`);
                return result;
            }
        },

        schedule: function (data) {
            // data: { title, body, topic, sendAt (timestamp) }
            const notification = {
                id: 'notif_' + Date.now(),
                title: data.title,
                body: data.body,
                topic: data.topic || 'general',
                sendAt: data.sendAt || Date.now(),
                status: 'pending'
            };

            state.queue.push(notification);
            state.queue.sort((a, b) => a.sendAt - b.sendAt);

            console.log(`🔔 [NotifyScheduler] Scheduled: "${data.title}" for ${new Date(notification.sendAt).toLocaleTimeString()}`);

            NotifyRenderer.renderQueue(state.queue);
        },

        processQueue: function () {
            const now = Date.now();

            state.queue.forEach(item => {
                if (item.status === 'pending' && item.sendAt <= now) {
                    this.dispatch(item);
                }
            });
        },

        dispatch: function (item) {
            // 1. Check Topic Match (Mock Logic)
            if (state.subscribers.has(item.topic) || item.topic === 'breaking') {
                this.sendBrowserNotification(item);
                item.status = 'sent';
                console.log(`🔔 [NotifyScheduler] Sent: ${item.title}`);
            } else {
                item.status = 'skipped'; // User not subscribed
                console.log(`🔔 [NotifyScheduler] Skipped (Topic mismatch): ${item.title}`);
            }

            // Update UI
            NotifyRenderer.renderQueue(state.queue);

            // Cleanup sent items after 5 seconds to keep list clean
            setTimeout(() => {
                state.queue = state.queue.filter(i => i.id !== item.id);
                NotifyRenderer.renderQueue(state.queue);
            }, 5000);
        },

        sendBrowserNotification: function (item) {
            // Real Browser Notification
            if (state.permission === 'granted') {
                new Notification(item.title, {
                    body: item.body,
                    icon: 'https://via.placeholder.com/128/ef4444/FFFFFF?text=NEWS',
                    tag: item.topic
                });
            } else {
                // Fallback to In-App Toast (Reuse existing or create simple one)
                this.showToast(item);
            }
        },

        showToast: function (item) {
            const toast = document.createElement('div');
            toast.className = 'notify-toast';
            toast.innerHTML = `
                <div class="toast-header">
                    <span class="toast-dot"></span> ${item.topic.toUpperCase()}
                </div>
                <strong>${item.title}</strong>
                <p>${item.body}</p>
            `;
            document.body.appendChild(toast);

            // Animate In/Out
            requestAnimationFrame(() => toast.classList.add('visible'));
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        },

        injectDemo: function () {
            if (!document.getElementById('notification-scheduler-panel')) {
                const div = document.createElement('div');
                div.id = 'notification-scheduler-panel';
                document.body.appendChild(div);
            }

            // Schedule some fake stuff
            this.schedule({
                title: 'Goal! Haaland Scores',
                body: 'Man City take the lead in the 12th minute.',
                topic: 'football',
                sendAt: Date.now() + 2000 // 2s delay
            });

            this.schedule({
                title: 'Transfer Alert',
                body: 'Breaking: Mbappe to Liverpool confirmed.',
                topic: 'breaking',
                sendAt: Date.now() + 8000 // 8s delay
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const NotifyRenderer = {
        renderQueue: function (queue) {
            const container = document.querySelector(CONFIG.selectors.container);
            if (!container) return;

            container.innerHTML = `
                <div class="scheduler-card">
                    <div class="sched-header">
                        <h3>Notification Center</h3>
                        <button onclick="window.NotifyScheduler.reqPerm()">
                            ${state.permission === 'granted' ? '🔕 Active' : '🔔 Enable'}
                        </button>
                    </div>
                    
                    <div class="sched-queue">
                        <h5>Queue</h5>
                        ${queue.length === 0 ? '<div class="empty-q">No pending notifications</div>' : ''}
                        ${queue.map(item => `
                            <div class="q-item ${item.status}">
                                <div class="q-time">${new Date(item.sendAt).toLocaleTimeString()}</div>
                                <div class="q-info">
                                    <span class="q-topic">${item.topic}</span>
                                    <div class="q-title">${item.title}</div>
                                </div>
                                <div class="q-status">${item.status}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.NotifyScheduler = {
        init: NotifyScheduler.initialize.bind(NotifyScheduler),
        schedule: NotifyScheduler.schedule.bind(NotifyScheduler),
        reqPerm: NotifyScheduler.requestPermission.bind(NotifyScheduler),
        demo: NotifyScheduler.injectDemo.bind(NotifyScheduler)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NotifyScheduler.initialize());
    } else {
        NotifyScheduler.initialize();
    }

})();
