/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 104: CONTENT SCHEDULING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Manages release timing, queued publishing, and update notifications.
 * Features: Time-based release, priority queuing, and "New Content" toasts.
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
            checkInterval: 5000, // Check every 5s
            notificationDuration: 4000
        },
        events: {
            publishNow: 'scheduler:publish-now',
            scheduled: 'scheduler:scheduled',
            queueUpdated: 'scheduler:queue-updated'
        }
    };

    const state = {
        schedule: [], // { id, feed, time, status }
        timer: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULING ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SchedulingEngine = {
        initialize: function () {
            console.log('⏰ [Scheduler] Engine initialized');
            this.startTimer();

            // Notification System Integration
            if (!document.getElementById('scheduler-toast-container')) {
                this.injectNotificationContainer();
            }
        },

        scheduleContent: function (feed, publishTime = 'now') {
            const timestamp = publishTime === 'now' ? Date.now() : new Date(publishTime).getTime();

            const job = {
                id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                feed: feed,
                time: timestamp,
                status: 'pending'
            };

            state.schedule.push(job);

            // Sort by time
            state.schedule.sort((a, b) => a.time - b.time);

            console.log(`⏰ [Scheduler] Job ${job.id} scheduled for ${new Date(timestamp).toLocaleTimeString()}`);

            this.notifyQueueUpdate();

            // If immediate, process now
            if (timestamp <= Date.now()) {
                this.processQueue();
            }

            return job.id;
        },

        processQueue: function () {
            const now = Date.now();
            const dueJobs = state.schedule.filter(job => job.status === 'pending' && job.time <= now);

            dueJobs.forEach(job => {
                this.publishJob(job);
            });
        },

        publishJob: function (job) {
            job.status = 'publishing';
            console.log(`🚀 [Scheduler] Publishing ${job.id}`);

            // 1. Dispatch event to Distributor (Layer 103)
            // Ideally we re-use the event Layer 103 listens to, or call it directly if exposed
            if (window.ContentDistributor) {
                window.ContentDistributor.distribute(job.feed);
            } else {
                // Fallback catch-all event
                document.dispatchEvent(new CustomEvent('newsgen:feed-generated', {
                    detail: { feed: job.feed }
                }));
            }

            // 2. Show User Notification
            SchedulerRenderer.showToast(job.feed.main.headline);

            job.status = 'completed';
            this.notifyQueueUpdate();
        },

        startTimer: function () {
            state.timer = setInterval(() => {
                this.processQueue();
            }, CONFIG.scheduler.checkInterval);
        },

        removeJob: function (jobId) {
            const index = state.schedule.findIndex(j => j.id === jobId);
            if (index > -1) {
                state.schedule.splice(index, 1);
                this.notifyQueueUpdate();
                return true;
            }
            return false;
        },

        notifyQueueUpdate: function () {
            document.dispatchEvent(new CustomEvent(CONFIG.events.queueUpdated, {
                detail: { count: state.schedule.filter(j => j.status === 'pending').length }
            }));

            // Update Dashboard if visible
            SchedulerRenderer.renderDashboard('scheduler-dashboard');
        },

        injectNotificationContainer: function () {
            const div = document.createElement('div');
            div.id = 'scheduler-toast-container';
            div.className = 'scheduler-toast-container';
            document.body.appendChild(div);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const SchedulerRenderer = {
        renderDashboard: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const pending = state.schedule.filter(j => j.status === 'pending');
            const completed = state.schedule.filter(j => j.status === 'completed').reverse().slice(0, 5);

            container.innerHTML = `
                <div class="scheduler-panel">
                    <h3>Content Schedule (${pending.length} Pending)</h3>
                    
                    <div class="schedule-list">
                        <h4>Upcoming</h4>
                        ${pending.length > 0 ? pending.map(job => this.jobTemplate(job)).join('') : '<div class="empty-state">No scheduled content</div>'}
                    </div>
                    
                    <div class="schedule-list history">
                        <h4>Recently Published</h4>
                        ${completed.map(job => this.jobTemplate(job)).join('')}
                    </div>
                </div>
            `;
        },

        jobTemplate: function (job) {
            const timeStr = new Date(job.time).toLocaleTimeString();
            const isFuture = job.time > Date.now();

            return `
                <div class="job-card ${job.status}">
                    <div class="job-time">${timeStr}</div>
                    <div class="job-details">
                        <div class="job-title">${job.feed.main.headline}</div>
                        <div class="job-meta">${job.status}</div>
                    </div>
                    ${job.status === 'pending' ? `<button onclick="window.ContentScheduler.cancel('${job.id}')">✕</button>` : ''}
                </div>
            `;
        },

        showToast: function (headline) {
            const container = document.getElementById('scheduler-toast-container');
            if (container) {
                const toast = document.createElement('div');
                toast.className = 'update-toast';
                toast.innerHTML = `
                    <span class="toast-icon">⚡</span>
                    <div class="toast-content">
                        <span class="toast-label">New Article Published</span>
                        <span class="toast-text">${headline}</span>
                    </div>
                `;

                container.appendChild(toast);

                // Animate In
                requestAnimationFrame(() => toast.classList.add('visible'));

                // Remove
                setTimeout(() => {
                    toast.classList.remove('visible');
                    setTimeout(() => toast.remove(), 300);
                }, CONFIG.scheduler.notificationDuration);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ContentScheduler = {
        init: SchedulingEngine.initialize.bind(SchedulingEngine),
        schedule: SchedulingEngine.scheduleContent.bind(SchedulingEngine),
        cancel: SchedulingEngine.removeJob.bind(SchedulingEngine),
        render: SchedulerRenderer.renderDashboard.bind(SchedulerRenderer),

        getQueue: () => state.schedule
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SchedulingEngine.initialize());
    } else {
        SchedulingEngine.initialize();
    }

})();
