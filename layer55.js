
/**
 * Layer 55: Global RSS & Aggregated Feeds
 * Aggregates RSS feeds and displays them in a widget.
 */
export class SportIQRSSFeeds {
    constructor() {
        this.id = 'layer-055';
        this.name = 'Global RSS & Aggregated Feeds';
        this.config = null;
        this.containerId = 'global-rss-feed-widget';
    }

    async init() {
        console.log(`Initializing ${this.name}...`);
        await this.loadConfig();
        this.renderWidget();
        window.RuntimeOrchestrator?.registerLayer(this);
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer55.json');
            this.config = await res.json();
        } catch {
            this.config = { feeds: [] };
        }
    }

    renderWidget() {
        // Append to sidebar or a news section
        const target = document.querySelector('[data-slot="feed-native"]');
        if (target) {
            target.innerHTML = ''; // Clear ad slot usage for this demo
            target.id = this.containerId;
            target.style.background = 'var(--color-surface, #fff)';
            target.style.display = 'block';
            target.style.height = 'auto';
            target.style.padding = '1rem';

            target.innerHTML = `
                <h4>Latest from the Web</h4>
                <div class="rss-feed-list" style="margin-top: 10px;">
                    <div class="rss-item" style="padding: 10px; border-bottom: 1px solid #eee;">
                        <a href="#" style="text-decoration: none; color: inherit;">
                            <strong>FIFA.com</strong>: World Cup 2026 Qualifiers Update
                            <span style="display:block; font-size: 0.8em; color: gray;">2 hours ago</span>
                        </a>
                    </div>
                    <div class="rss-item" style="padding: 10px; border-bottom: 1px solid #eee;">
                        <a href="#" style="text-decoration: none; color: inherit;">
                            <strong>NBA.com</strong>: Lakers sign new point guard
                            <span style="display:block; font-size: 0.8em; color: gray;">4 hours ago</span>
                        </a>
                    </div>
                </div>
            `;
        }
    }
}

window.Layer55_RSSFeeds = new SportIQRSSFeeds();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer55_RSSFeeds.init());
} else {
    window.Layer55_RSSFeeds.init();
}
