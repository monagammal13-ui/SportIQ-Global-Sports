
/**
 * Layer 52: Real-Time Notifications Engine
 * Manages push notifications and on-site alerts.
 */
export class SportIQNotificationsEngine {
    constructor() {
        this.id = 'layer-052';
        this.name = 'Real-Time Notifications Engine';
        this.queue = [];
        this.config = null;
        this.permission = 'default';
        this.containerId = 'notification-toast-container';
    }

    async init() {
        console.log(`Initializing ${this.name}...`);
        await this.loadConfig();
        this.createContainer();
        this.requestPermission();

        // Listen for global events if EventBus exists
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('notification:send', (data) => this.push(data));
        }

        window.RuntimeOrchestrator?.registerLayer(this);
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer52.json');
            this.config = await res.json();
        } catch {
            this.config = { position: "top-right", duration: 5000 };
        }
    }

    createContainer() {
        if (document.getElementById(this.containerId)) return;
        const div = document.createElement('div');
        div.id = this.containerId;
        Object.assign(div.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        document.body.appendChild(div);
    }

    requestPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(p => this.permission = p);
        }
    }

    push({ title, message, type = 'info', icon = null }) {
        // Validation
        if (!title && !message) return;

        // Browser push
        if (this.permission === 'granted' && document.hidden) {
            new Notification(title, { body: message, icon: icon });
        } else {
            // In-app toast
            this.showToast({ title, message, type });
        }
    }

    showToast({ title, message, type }) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <strong>${title}</strong>
            <p>${message}</p>
        `;
        Object.assign(toast.style, {
            background: 'var(--color-surface, #fff)',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderLeft: `4px solid ${this.getTypeColor(type)}`,
            minWidth: '250px',
            animation: 'slideIn 0.3s ease-out'
        });

        document.getElementById(this.containerId).appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, this.config.duration || 5000);
    }

    getTypeColor(type) {
        switch (type) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    }
}

window.Layer52_Notifications = new SportIQNotificationsEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer52_Notifications.init());
} else {
    window.Layer52_Notifications.init();
}
