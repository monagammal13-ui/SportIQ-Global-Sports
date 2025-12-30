/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 120: EMERGENCY BREAKING NEWS ALERT SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Overrides standard feeds to push critical "Red Alert" notifications.
 * Features: 
 *  - Full-width top banner for emergency broadcasts.
 *  - Pulsing animation for high urgency.
 *  - Sound alert capability.
 *  - Manual trigger & Mock Simulation.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        alert: {
            refreshRate: 15000,
            simulatedChance: 0.1 // 10% chance per check to sim alert
        },
        selectors: {
            container: 'body'
        }
    };

    class EmergencyAlertSystem {
        constructor() {
            this.activeAlert = null;
            this.init();
        }

        init() {
            console.log('🚨 Layer 120: Emergency Alert System - INITIALIZED');
            this.checkForAlerts();

            // Start poller loop
            setInterval(() => this.checkForAlerts(), CONFIG.alert.refreshRate);
        }

        checkForAlerts() {
            // In a real app, this would fetch from an API endpoint
            // fetch('/api/alerts/breaking').then(...)

            // Simulation Logic
            if (!this.activeAlert && Math.random() < CONFIG.alert.simulatedChance) {
                this.triggerAlert({
                    id: 'brk_' + Date.now(),
                    level: 'critical', // critical, warning, info
                    headline: 'BREAKING: Major Transfer Record Shattered in Premier League',
                    timestamp: Date.now()
                });
            }
        }

        triggerAlert(alertData) {
            if (this.activeAlert) return; // Prevent stacking for now
            this.activeAlert = alertData;

            console.log('🚨 TRIGGERING EMERGENCY ALERT:', alertData.headline);
            this.renderAlert(alertData);
            this.playSound();
        }

        renderAlert(data) {
            const bar = document.createElement('div');
            bar.id = 'emergency-alert-bar';
            bar.className = `alert-bar level-${data.level} slide-down`;
            bar.innerHTML = `
                <div class="alert-content">
                    <span class="alert-icon">🚨</span>
                    <strong class="alert-label">BREAKING NEWS</strong>
                    <span class="alert-text">${data.headline}</span>
                    <span class="alert-time">${new Date(data.timestamp).toLocaleTimeString()}</span>
                </div>
                <button class="alert-close" onclick="window.Layer120_Alerts.dismiss('${data.id}')">×</button>
            `;

            document.body.prepend(bar);
        }

        dismiss(id) {
            const bar = document.getElementById('emergency-alert-bar');
            if (bar) {
                bar.classList.add('slide-up');
                setTimeout(() => {
                    bar.remove();
                    this.activeAlert = null;
                }, 500);
            }
        }

        playSound() {
            // Simple beep or notification sound can be added here
            // const audio = new Audio('/assets/alert.mp3');
            // audio.play().catch(e => console.log('Audio autoplay blocked'));
        }
    }

    // Auto-Expose
    window.Layer120_Alerts = new EmergencyAlertSystem();

})();
