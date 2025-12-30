/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 134: CROSS-PLATFORM SYNC ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Ensures real-time state synchronization across multiple browser tabs
 *          and simulates cross-device cloud syncing for user sessions.
 * Features: BroadcastChannel for local tab sync, mock Cloud Socket for remote,
 *          and automatic state reconciliation.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        sync: {
            channelName: 'sportiq_global_sync',
            debounce: 500
        },
        selectors: {
            indicator: '#sync-status-indicator'
        }
    };

    const state = {
        channel: null,
        lastSync: 0,
        isOnline: navigator.onLine
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SYNC ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const SyncEngine = {
        initialize: function () {
            console.log('🔄 [Sync] Engine initialized');

            this.setupChannel();
            this.setupNetworkListeners();
            this.injectStatusUI();

            // Example: Listen for local events to broadcast
            // 1. Personalization updates
            // 2. Read articles

            // Mocking a listener for when personalization saves
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function (key, value) {
                originalSetItem.apply(this, arguments);
                if (key.includes('sportiq')) {
                    SyncEngine.broadcast({ type: 'storage_update', key, value });
                }
            };
        },

        setupChannel: function () {
            if ('BroadcastChannel' in window) {
                state.channel = new BroadcastChannel(CONFIG.sync.channelName);
                state.channel.onmessage = (event) => this.handleMessage(event.data);
                console.log('🔄 [Sync] BroadcastChannel connected');
            }
        },

        setupNetworkListeners: function () {
            window.addEventListener('online', () => {
                state.isOnline = true;
                this.updateStatus('online');
                this.simulateCloudSync();
            });

            window.addEventListener('offline', () => {
                state.isOnline = false;
                this.updateStatus('offline');
            });
        },

        broadcast: function (payload) {
            // payload: { type, key, value, timestamp }
            if (state.channel) {
                state.channel.postMessage({
                    ...payload,
                    origin: window.name || 'tab-' + Date.now(),
                    timestamp: Date.now()
                });
            }
            // Also trigger cloud push (mock)
            if (state.isOnline) this.pushToCloud(payload);
        },

        handleMessage: function (data) {
            console.log('🔄 [Sync] Received update:', data.type);

            if (data.type === 'storage_update') {
                // Apply update locally without re-triggering broadcast loop
                // (In a real app, we'd use a mutex or specific flag)
                // For this demo, we just log and notify UI
                this.showSyncNotification(`Synced: ${data.key}`);

                // If it's personalization, maybe reload that engine?
                if (data.key === 'sportiq_user_profile' && window.ReaderPersonalization) {
                    window.ReaderPersonalization.init(); // Reload profile
                }
            } else if (data.type === 'force_refresh') {
                window.location.reload();
            }
        },

        pushToCloud: function (payload) {
            this.updateStatus('syncing');
            setTimeout(() => {
                console.log('☁️ [Sync] Pushed to cloud:', payload);
                this.updateStatus('online');
            }, 800);
        },

        simulateCloudSync: function () {
            console.log('☁️ [Sync] Pulling latest from cloud...');
            this.updateStatus('syncing');
            setTimeout(() => {
                this.updateStatus('online');
                this.showSyncNotification('Cloud Sync Complete');
            }, 1500);
        },

        // ════ UI ════
        injectStatusUI: function () {
            if (document.getElementById('sync-status-indicator')) return;

            const div = document.createElement('div');
            div.id = 'sync-status-indicator';
            div.className = state.isOnline ? 'status-online' : 'status-offline';
            div.innerHTML = `
                <span class="sync-icon">☁️</span>
                <span class="sync-text">${state.isOnline ? 'Synced' : 'Offline'}</span>
            `;
            document.body.appendChild(div);
        },

        updateStatus: function (status) { // online, offline, syncing
            const el = document.getElementById('sync-status-indicator');
            if (!el) return;

            el.className = `status-${status}`;
            const text = el.querySelector('.sync-text');

            if (status === 'online') text.innerText = 'Synced';
            else if (status === 'offline') text.innerText = 'Offline';
            else if (status === 'syncing') text.innerText = 'Syncing...';
        },

        showSyncNotification: function (msg) {
            const toast = document.createElement('div');
            toast.className = 'sync-toast';
            toast.innerText = msg;
            document.body.appendChild(toast);

            setTimeout(() => toast.classList.add('visible'), 10);
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        injectDemo: function () {
            // Simulate an update coming from "another device"
            console.log('🔄 [Sync] Simulating remote update...');
            this.handleMessage({
                type: 'storage_update',
                key: 'sportiq_user_profile',
                value: '{"mock":"profile"}',
                timestamp: Date.now()
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.PlatformSync = {
        init: SyncEngine.initialize.bind(SyncEngine),
        sync: SyncEngine.broadcast.bind(SyncEngine),
        demo: SyncEngine.injectDemo.bind(SyncEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SyncEngine.initialize());
    } else {
        SyncEngine.initialize();
    }

})();
