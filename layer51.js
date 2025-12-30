
import { SportIQInteractionAnalytics } from './layer54.js';

/**
 * Layer 51: Global Trending Topics Dashboard
 * Manages live trending topics, fetching from varied sources and displaying them.
 */
export class SportIQTrendingDashboard {
    constructor() {
        this.id = 'layer-051';
        this.name = 'Global Trending Topics Dashboard';
        this.config = null;
        this.containerId = 'trending-dashboard-container';
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        console.log(`Initializing ${this.name}...`);

        try {
            await this.loadConfig();
            this.createDashboardContainer();
            await this.fetchTrends();
            this.startAutoRefresh();
            this.isInitialized = true;

            // Register with Runtime Orchestrator if available
            if (window.RuntimeOrchestrator) {
                window.RuntimeOrchestrator.registerLayer(this);
            }
        } catch (error) {
            console.error(`Failed to initialize ${this.name}:`, error);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('../api-json/layer51.json');
            this.config = await response.json();
        } catch (e) {
            console.warn('Layer 51: Using default config');
            this.config = {
                refreshInterval: 60000,
                sources: ["internal", "social", "news"],
                displayLimit: 10
            };
        }
    }

    createDashboardContainer() {
        // Check if container exists, if not, create it in a suitable location (e.g., sidebar or special section)
        // For now, we'll append to a data-slot if available or create a hidden one until activated
        let container = document.getElementById(this.containerId);
        if (!container) {
            // Find a slot
            const slot = document.querySelector('[data-slot="sidebar"]');
            if (slot) {
                container = document.createElement('div');
                container.id = this.containerId;
                container.className = 'trending-dashboard-widget';
                slot.appendChild(container);
            }
        }
    }

    async fetchTrends() {
        if (!this.config) return;
        // Mock fetching trends based on sources
        const trends = [
            { topic: "Champions League", type: "football", volume: "1.2M", trend: "up" },
            { topic: "NBA Finals", type: "basketball", volume: "850K", trend: "up" },
            { topic: "Transfer News", type: "general", volume: "500K", trend: "stable" }
        ]; // This would be a real API call

        this.render(trends);
    }

    render(trends) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        let html = `
            <div class="trending-header">
                <h3>Global Trending</h3>
                <span class="live-indicator">LIVE</span>
            </div>
            <ul class="trending-list">
        `;

        trends.forEach((t, i) => {
            html += `
                <li class="trending-item">
                    <span class="rank">${i + 1}</span>
                    <span class="topic">${t.topic}</span>
                    <span class="volume">${t.volume}</span>
                </li>
            `;
        });

        html += '</ul>';
        container.innerHTML = html;
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('layer51-css')) return;
        const style = document.createElement('style');
        style.id = 'layer51-css';
        style.textContent = `
            .trending-dashboard-widget {
                background: var(--color-surface, #fff);
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 1rem;
            }
            .trending-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
                border-bottom: 1px solid #eee;
                padding-bottom: 0.5rem;
            }
            .live-indicator {
                background: red;
                color: white;
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                animation: pulse 2s infinite;
            }
            .trending-item {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid #f5f5f5;
            }
            .trending-item:last-child { border-bottom: none; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    startAutoRefresh() {
        if (this.config && this.config.refreshInterval) {
            setInterval(() => this.fetchTrends(), this.config.refreshInterval);
        }
    }
}

// Auto-instantiate and expose globally
window.Layer51_TrendingDashboard = new SportIQTrendingDashboard();
// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer51_TrendingDashboard.init());
} else {
    window.Layer51_TrendingDashboard.init();
}
