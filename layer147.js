/**
 * Layer 147: Retention & Re-Engagement Engine
 * Monitors user activity to detect "drift" and triggers automated recovery strategies.
 * 
 * Responsibilities:
 * - Tracks "Time Since Last Action" (TSLA).
 * - Detects "Idle" or "About the Bounce" states.
 * - Triggers "Exit Intent" modals or "Welcome Back" toasts.
 * - Schedules local notifications for return visits.
 */
export class SportIQRetentionEngine {
    constructor() {
        this.id = 'layer-147';
        this.name = 'Retention & Re-Engagement Engine';
        this.version = '2.0.0';
        this.initialized = false;

        this.timers = {
            idle: null,
            lastAction: Date.now()
        };

        this.config = {
            idleThreshold: 60000, // 60s of no activity = Idle
            bounceThreshold: 2000, // <2s visit = Bounce risk
            strategies: [
                "exit_popup", "browser_notification", "email_digest"
            ]
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`⚓ Initializing ${this.name}...`);

        await this.loadConfig();
        this.monitorActivity();
        this.checkReturnState();

        this.initialized = true;

        // Register
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer147.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('⚓ Retention Config Loaded');
            }
        } catch (e) {
            console.warn('Using default retention config');
        }
    }

    monitorActivity() {
        const resetTimer = () => {
            this.timers.lastAction = Date.now();
            if (this.timers.idle) clearTimeout(this.timers.idle);

            this.timers.idle = setTimeout(() => {
                this.triggerStrategy('idle_nudge');
            }, this.config.idleThreshold);
        };

        // Inputs
        ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'].forEach(evt => {
            window.addEventListener(evt, resetTimer, { passive: true });
        });

        // Exit Intent (Mouse leaves top of window)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 0) {
                this.triggerStrategy('exit_intent');
            }
        });

        // Tab Visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.setReturnTrigger();
            } else {
                this.triggerStrategy('welcome_back');
            }
        });

        resetTimer();
    }

    checkReturnState() {
        const lastVisit = localStorage.getItem('sportiq_last_visit');
        if (lastVisit) {
            const days = (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24);
            if (days > 7) {
                this.triggerStrategy('long_absence_welcome');
            }
        }
        localStorage.setItem('sportiq_last_visit', Date.now().toString());
    }

    setReturnTrigger() {
        // Here we might schedule a Local Notification if permissions allowed
        // Simplified for this layer: Just log the intent
        console.log('⚓ User left tab. Retention trigger set.');
    }

    triggerStrategy(type) {
        console.log(`⚓ Retention Strategy Triggered: [${type}]`);

        // Emit to Event Bus so UI layers can render the actual popup/toast
        window.__ANTIGRAVITY_EVENT_BUS__?.publish('retention:trigger', {
            type: type,
            reason: 'User behavior detected',
            timestamp: Date.now()
        });

        // Example Logic
        if (type === 'exit_intent') {
            // Check cooldown
            const lastExitPopup = sessionStorage.getItem('last_exit_popup');
            if (!lastExitPopup) {
                sessionStorage.setItem('last_exit_popup', Date.now());
                this.showExitModal(); // Direct fallback actions
            }
        }
    }

    showExitModal() {
        // Fallback UI if no external handler
        // In a real app, this would check if a modal is already open
        console.log('⚓ >> SHOWING EXIT MODAL << (Simulated)');
    }
}

// Runtime Execution
window.Layer147_Retention = new SportIQRetentionEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer147_Retention.init());
} else {
    window.Layer147_Retention.init();
}
