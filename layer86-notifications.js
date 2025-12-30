/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 86: NOTIFICATION & ALERTS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Alert management, push notifications, in-app notifications
 * Features: Multi-channel alerts, priority queue, toast notifications, badges
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        notifications: {
            configPath: '../api-json/notifications-config.json',
            maxVisible: 3,
            defaultDuration: 5000,
            enableBrowserNotifications: true,
            enableSound: false
        },
        events: {
            notificationSent: 'notify:sent',
            notificationClicked: 'notify:clicked',
            notificationDismissed: 'notify:dismissed'
        }
    };

    const state = {
        notifications: [],
        queue: [],
        visible: [],
        unreadCount: 0,
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // NOTIFICATION MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const NotificationManager = {
        send: function (notification) {
            const id = this.generateId();

            const notif = {
                id,
                title: notification.title,
                message: notification.message,
                type: notification.type || 'info',
                priority: notification.priority || 'normal',
                category: notification.category || 'general',
                icon: notification.icon || this.getIcon(notification.type),
                url: notification.url || null,
                duration: notification.duration || CONFIG.notifications.defaultDuration,
                timestamp: Date.now(),
                read: false,
                dismissed: false
            };

            state.notifications.unshift(notif);
            state.unreadCount++;

            // Add to queue
            if (notif.priority === 'high' || notif.priority === 'critical') {
                state.queue.unshift(notif);
            } else {
                state.queue.push(notif);
            }

            // Show notification
            this.show(notif);

            // Browser notification
            if (CONFIG.notifications.enableBrowserNotifications) {
                this.sendBrowserNotification(notif);
            }

            const event = new CustomEvent(CONFIG.events.notificationSent, {
                detail: { notification: notif, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('🔔 [Notify] Sent:', notif.title);

            return notif;
        },

        show: function (notification) {
            if (state.visible.length >= CONFIG.notifications.maxVisible) {
                return;
            }

            state.visible.push(notification);
            this.render();

            // Auto-dismiss
            if (notification.duration > 0) {
                setTimeout(() => {
                    this.dismiss(notification.id);
                }, notification.duration);
            }
        },

        dismiss: function (notificationId) {
            const index = state.visible.findIndex(n => n.id === notificationId);
            if (index > -1) {
                state.visible.splice(index, 1);
                this.render();
            }

            const notif = state.notifications.find(n => n.id === notificationId);
            if (notif) {
                notif.dismissed = true;
            }

            const event = new CustomEvent(CONFIG.events.notificationDismissed, {
                detail: { notificationId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            // Show next in queue
            this.processQueue();
        },

        markAsRead: function (notificationId) {
            const notif = state.notifications.find(n => n.id === notificationId);
            if (notif && !notif.read) {
                notif.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },

        processQueue: function () {
            if (state.queue.length > 0 && state.visible.length < CONFIG.notifications.maxVisible) {
                const next = state.queue.shift();
                this.show(next);
            }
        },

        sendBrowserNotification: function (notification) {
            if ('Notification' in window && Notification.permission === 'granted') {
                const browserNotif = new Notification(notification.title, {
                    body: notification.message,
                    icon: notification.icon,
                    tag: notification.id
                });

                browserNotif.onclick = () => {
                    if (notification.url) {
                        window.location.href = notification.url;
                    }
                    this.handleClick(notification.id);
                };
            }
        },

        handleClick: function (notificationId) {
            this.markAsRead(notificationId);

            const event = new CustomEvent(CONFIG.events.notificationClicked, {
                detail: { notificationId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        getIcon: function (type) {
            const icons = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌',
                live: '🔴',
                goal: '⚽',
                news: '📰'
            };
            return icons[type] || 'ℹ️';
        },

        render: function () {
            let container = document.getElementById('notification-container');

            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'notification-container';
                document.body.appendChild(container);
            }

            container.innerHTML = state.visible.map(notif => `
                <div class="notification notification-${notif.type} priority-${notif.priority}" 
                     data-id="${notif.id}">
                    <div class="notification-icon">${notif.icon}</div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${notif.message}</div>
                    </div>
                    <button class="notification-close" onclick="window.NotificationEngine.dismiss('${notif.id}')">×</button>
                </div>
            `).join('');
        },

        generateId: function () {
            return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ALERT TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════

    const AlertTemplates = {
        matchStart: function (match) {
            return NotificationManager.send({
                title: '⚽ Match Starting',
                message: `${match.homeTeam} vs ${match.awayTeam}`,
                type: 'live',
                priority: 'high',
                category: 'match'
            });
        },

        goal: function (team, player) {
            return NotificationManager.send({
                title: '⚽ GOAL!',
                message: `${player} scored for ${team}`,
                type: 'goal',
                priority: 'critical',
                category: 'match'
            });
        },

        breakingNews: function (headline) {
            return NotificationManager.send({
                title: '🚨 Breaking News',
                message: headline,
                type: 'news',
                priority: 'high',
                category: 'news'
            });
        },

        transferAlert: function (player, from, to) {
            return NotificationManager.send({
                title: '🔄 Transfer Alert',
                message: `${player} moves from ${from} to ${to}`,
                type: 'info',
                priority: 'normal',
                category: 'transfer'
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // NOTIFICATION CENTER
    // ═══════════════════════════════════════════════════════════════════════

    const NotificationCenter = {
        getAll: function () {
            return state.notifications;
        },

        getUnread: function () {
            return state.notifications.filter(n => !n.read);
        },

        getByCategory: function (category) {
            return state.notifications.filter(n => n.category === category);
        },

        clearAll: function () {
            state.notifications = [];
            state.unreadCount = 0;
        },

        getUnreadCount: function () {
            return state.unreadCount;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PERMISSION HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    const PermissionHandler = {
        request: function () {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    console.log('🔔 [Notify] Permission:', permission);
                });
            }
        },

        hasPermission: function () {
            return 'Notification' in window && Notification.permission === 'granted';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🔔 LAYER 86: NOTIFICATION ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        try {
            const response = await fetch(CONFIG.notifications.configPath);
            if (response.ok) {
                state.config = await response.json();
                console.log('✅ [Notify] Config loaded');
            }
        } catch (error) {
            console.warn('⚠️ [Notify] Failed to load config');
        }

        // Request permission
        if (CONFIG.notifications.enableBrowserNotifications) {
            PermissionHandler.request();
        }

        // Send welcome notification
        setTimeout(() => {
            NotificationManager.send({
                title: 'Welcome to SportIQ!',
                message: 'Stay updated with live scores and breaking news',
                type: 'info',
                priority: 'normal'
            });
        }, 2000);

        console.log('✅ [Notify] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.NotificationEngine = {
        // Sending
        send: NotificationManager.send.bind(NotificationManager),
        dismiss: NotificationManager.dismiss.bind(NotificationManager),
        markAsRead: NotificationManager.markAsRead.bind(NotificationManager),

        // Templates
        matchStart: AlertTemplates.matchStart.bind(AlertTemplates),
        goal: AlertTemplates.goal.bind(AlertTemplates),
        breakingNews: AlertTemplates.breakingNews.bind(AlertTemplates),
        transferAlert: AlertTemplates.transferAlert.bind(AlertTemplates),

        // Center
        getAll: NotificationCenter.getAll.bind(NotificationCenter),
        getUnread: NotificationCenter.getUnread.bind(NotificationCenter),
        getByCategory: NotificationCenter.getByCategory.bind(NotificationCenter),
        getUnreadCount: NotificationCenter.getUnreadCount.bind(NotificationCenter),
        clearAll: NotificationCenter.clearAll.bind(NotificationCenter),

        // Permissions
        requestPermission: PermissionHandler.request.bind(PermissionHandler),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
