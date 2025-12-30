/**
 * Layer 69 - Global Alerts & Critical Updates
 * Real-time notification and alert system
 * Sport IQ Platform
 */

class GlobalAlertsSystem {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.alerts = [];
        this.dismissedAlerts = new Set();
        this.alertContainer = null;
        this.checkInterval = null;
        this.init();
    }

    async init() {
        console.log('🚨 Layer 69: Global Alerts - STARTING');

        // Load configuration
        await this.loadConfig();

        // Load dismissed alerts from localStorage
        this.loadDismissedAlerts();

        // Create alert container
        this.createAlertContainer();

        // Initialize with mock alerts
        this.loadAlerts();

        // Start real-time checking
        this.startRealTimeMonitoring();

        this.isActive = true;
        console.log('✅ Layer 69: Global Alerts - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/alerts-config.json');
            this.config = await response.json();
            console.log('✅ Alerts config loaded');
        } catch (error) {
            console.warn('⚠️ Using default alerts config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            checkInterval: 60000, // 1 minute
            maxAlertsDisplayed: 3,
            autoHideDelay: 10000, // 10 seconds for non-critical
            enableSound: false,
            position: 'top-right',
            types: ['breaking', 'match-update', 'injury', 'transfer', 'general']
        };
    }

    loadDismissedAlerts() {
        try {
            const stored = localStorage.getItem('sportiq_dismissed_alerts');
            this.dismissedAlerts = stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            this.dismissedAlerts = new Set();
        }
    }

    saveDismissedAlert(alertId) {
        this.dismissedAlerts.add(alertId);
        try {
            localStorage.setItem('sportiq_dismissed_alerts',
                JSON.stringify([...this.dismissedAlerts]));
        } catch (error) {
            console.warn('⚠️ Could not save dismissed alert');
        }
    }

    createAlertContainer() {
        this.alertContainer = document.createElement('div');
        this.alertContainer.id = 'global-alerts-container';
        this.alertContainer.className = `alerts-container alerts-${this.config.position}`;
        document.body.appendChild(this.alertContainer);

        console.log('✅ Alert container created');
    }

    loadAlerts() {
        // Generate mock alerts (in production, fetch from API)
        this.alerts = this.generateMockAlerts();

        // Display active alerts
        this.displayActiveAlerts();

        console.log(`✅ Loaded ${this.alerts.length} alerts`);
    }

    generateMockAlerts() {
        return [
            {
                id: 'alert-1',
                type: 'breaking',
                priority: 'critical',
                title: '🔴 BREAKING NEWS',
                message: 'Cristiano Ronaldo announces retirement from international football',
                timestamp: new Date().toISOString(),
                source: 'Official',
                persistent: true,
                url: '#'
            },
            {
                id: 'alert-2',
                type: 'match-update',
                priority: 'high',
                title: '⚽ GOAL ALERT',
                message: 'Real Madrid 2-1 Barcelona (85\') - Benzema scores!',
                timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                source: 'Live Match',
                persistent: false,
                url: '#'
            },
            {
                id: 'alert-3',
                type: 'injury',
                priority: 'medium',
                title: '🏥 Injury Update',
                message: 'LeBron James ruled out for 2 weeks with ankle injury',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                source: 'Lakers Official',
                persistent: false,
                url: '#'
            }
        ];
    }

    displayActiveAlerts() {
        // Filter out dismissed alerts
        const activeAlerts = this.alerts.filter(alert =>
            !this.dismissedAlerts.has(alert.id)
        );

        // Sort by priority
        const sortedAlerts = activeAlerts.sort((a, b) => {
            const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Display top alerts
        sortedAlerts.slice(0, this.config.maxAlertsDisplayed).forEach(alert => {
            this.showAlert(alert);
        });
    }

    showAlert(alert) {
        // Check if already displayed
        if (document.querySelector(`[data-alert-id="${alert.id}"]`)) {
            return;
        }

        const alertEl = this.createAlertElement(alert);
        this.alertContainer.appendChild(alertEl);

        // Auto-hide non-persistent alerts
        if (!alert.persistent && this.config.autoHideDelay) {
            setTimeout(() => {
                this.dismissAlert(alert.id, alertEl);
            }, this.config.autoHideDelay);
        }

        // Emit event
        window.dispatchEvent(new CustomEvent('alert:show', {
            detail: alert
        }));

        console.log(`🚨 Alert displayed: ${alert.title}`);
    }

    createAlertElement(alert) {
        const div = document.createElement('div');
        div.className = `alert alert-${alert.priority} alert-${alert.type}`;
        div.dataset.alertId = alert.id;

        const timeAgo = this.getTimeAgo(alert.timestamp);
        const icon = this.getAlertIcon(alert.type);

        div.innerHTML = `
            <div class="alert-icon">${icon}</div>
            <div class="alert-content">
                <div class="alert-header">
                    <span class="alert-title">${alert.title}</span>
                    <span class="alert-time">${timeAgo}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-footer">
                    <span class="alert-source">📡 ${alert.source}</span>
                    ${alert.url !== '#' ? `<a href="${alert.url}" class="alert-link">Details →</a>` : ''}
                </div>
            </div>
            <button class="alert-dismiss" aria-label="Dismiss alert">✕</button>
        `;

        // Add dismiss handler
        div.querySelector('.alert-dismiss').onclick = () => {
            this.dismissAlert(alert.id, div);
        };

        // Add click handler for entire alert
        div.onclick = (e) => {
            if (!e.target.classList.contains('alert-dismiss')) {
                this.handleAlertClick(alert);
            }
        };

        // Animate in
        setTimeout(() => div.classList.add('alert-show'), 10);

        return div;
    }

    getAlertIcon(type) {
        const icons = {
            'breaking': '🔴',
            'match-update': '⚽',
            'injury': '🏥',
            'transfer': '✈️',
            'general': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diff = now - then;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return then.toLocaleDateString();
    }

    dismissAlert(alertId, element) {
        // Animate out
        element.classList.add('alert-hide');

        // Remove after animation
        setTimeout(() => {
            element.remove();
        }, 300);

        // Save to dismissed
        this.saveDismissedAlert(alertId);

        // Emit event
        window.dispatchEvent(new CustomEvent('alert:dismiss', {
            detail: { alertId }
        }));

        console.log(`🚫 Alert dismissed: ${alertId}`);
    }

    handleAlertClick(alert) {
        console.log(`🖱️ Alert clicked: ${alert.title}`);

        if (alert.url && alert.url !== '#') {
            window.location.href = alert.url;
        }

        // Emit event
        window.dispatchEvent(new CustomEvent('alert:click', {
            detail: alert
        }));
    }

    addAlert(alert) {
        // Add ID if not present
        if (!alert.id) {
            alert.id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Add timestamp if not present
        if (!alert.timestamp) {
            alert.timestamp = new Date().toISOString();
        }

        // Add to alerts array
        this.alerts.unshift(alert);

        // Show if not dismissed
        if (!this.dismissedAlerts.has(alert.id)) {
            this.showAlert(alert);
        }

        console.log(`➕ New alert added: ${alert.title}`);
    }

    clearAllAlerts() {
        const alertElements = this.alertContainer.querySelectorAll('.alert');
        alertElements.forEach(el => {
            const alertId = el.dataset.alertId;
            this.dismissAlert(alertId, el);
        });
    }

    startRealTimeMonitoring() {
        if (!this.config.checkInterval) return;

        console.log(`⏰ Starting real-time monitoring (${this.config.checkInterval / 1000}s interval)`);

        this.checkInterval = setInterval(() => {
            console.log('🔍 Checking for new alerts...');
            this.checkForNewAlerts();
        }, this.config.checkInterval);
    }

    checkForNewAlerts() {
        // Simulate checking for new alerts
        // In production, this would fetch from API

        const random = Math.random();
        if (random < 0.3) { // 30% chance of new alert
            const newAlert = {
                type: ['breaking', 'match-update', 'injury', 'transfer'][Math.floor(Math.random() * 4)],
                priority: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)],
                title: this.getRandomAlertTitle(),
                message: 'This is a simulated real-time alert notification',
                source: 'Live Update',
                persistent: false,
                url: '#'
            };

            this.addAlert(newAlert);
        }
    }

    getRandomAlertTitle() {
        const titles = [
            '🔴 BREAKING: Major announcement',
            '⚽ GOAL: Match update',
            '🏥 INJURY: Player status update',
            '✈️ TRANSFER: Deal confirmed',
            'ℹ️ UPDATE: Latest news'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    stopRealTimeMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('⏹️ Real-time monitoring stopped');
        }
    }

    // Public API
    getActiveAlerts() {
        return this.alerts.filter(alert => !this.dismissedAlerts.has(alert.id));
    }

    getAlertById(id) {
        return this.alerts.find(alert => alert.id === id);
    }

    getStatus() {
        return {
            active: this.isActive,
            layer: 69,
            name: 'Global Alerts & Critical Updates',
            totalAlerts: this.alerts.length,
            activeAlerts: this.getActiveAlerts().length,
            dismissedCount: this.dismissedAlerts.size,
            monitoring: !!this.checkInterval,
            checkInterval: this.config.checkInterval,
            features: {
                realTimeNotifications: true,
                persistentAlerts: true,
                dismissible: true,
                categorized: true
            }
        };
    }

    destroy() {
        this.stopRealTimeMonitoring();
        if (this.alertContainer) {
            this.alertContainer.remove();
        }
        this.isActive = false;
        console.log('🗑️ Layer 69 destroyed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer69_GlobalAlerts = new GlobalAlertsSystem();
    });
} else {
    window.Layer69_GlobalAlerts = new GlobalAlertsSystem();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalAlertsSystem;
}
