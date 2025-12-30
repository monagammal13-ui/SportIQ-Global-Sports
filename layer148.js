/**
 * Layer 148: Monetization Intelligence Layer
 * Smart orchestration of ad placements, affiliate links, and sponsored content.
 * 
 * Responsibilities:
 * - Balances Revenue vs. User Experience (Ad Density Control).
 * - Optimizes ad slot visibility (Lazy Loading / Refresh).
 * - Injects context-aware affiliate links.
 */
export class SportIQMonetizationEngine {
    constructor() {
        this.id = 'layer-148';
        this.name = 'Monetization Intelligence Engine';
        this.version = '2.0.0';
        this.initialized = false;

        this.state = {
            impressionCount: 0,
            adSlots: [],
            userValueSegment: 'standard'
        };

        this.config = {
            maxAdsPerPage: 5,
            minDistanceBetweenAds: 500, // pixels
            refreshInterval: 30000,
            provider: "google_adsense"
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`💰 Initializing ${this.name}...`);

        await this.loadConfig();
        this.assessUserValue();
        this.scanAndOptimizeSlots();
        this.startRefreshCycle();

        this.initialized = true;

        // Register
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer148.json');
            if (res.ok) {
                const json = await res.json();
                this.config = { ...this.config, ...json };
                console.log('💰 Monetization Config Loaded');
            }
        } catch (e) { console.warn('Using default money config'); }
    }

    assessUserValue() {
        // If Layer 140 (Profiling) says this is a "High Value" user, we might show FEWER ads
        // but higher quality ones, or upsell subscriptions instead.
        if (window.SportIQProfile) {
            const vector = window.SportIQProfile.interestVector || {};
            if (vector['luxury'] > 5 || vector['betting'] > 10) {
                this.state.userValueSegment = 'high_cpm';
            }
        }
        console.log(`💰 User Segment: ${this.state.userValueSegment}`);
    }

    scanAndOptimizeSlots() {
        // Find existing ad slots
        const slots = document.querySelectorAll('.ad-slot, .revenue-unit');

        const validSlots = [];
        let lastY = -999;

        slots.forEach(slot => {
            const rect = slot.getBoundingClientRect();
            const y = rect.top + window.scrollY;

            // Density Control: Don't show ads too close together
            if (y - lastY < this.config.minDistanceBetweenAds) {
                console.log('💰 Suppressing ad slot due to density rule', slot);
                slot.style.display = 'none'; // Hide overload
            } else {
                validSlots.push(slot);
                lastY = y;
                this.injectAd(slot);
            }
        });

        this.state.adSlots = validSlots;
    }

    injectAd(slot) {
        // Simulate ad injection or call external provider
        const type = slot.dataset.adType || 'banner';
        slot.setAttribute('data-status', 'filled');
        slot.classList.add('ad-filled');

        // In reality, this calls googletag.cmd.push(...)
        // console.log(`💰 Filling ${type} ad for ${this.state.userValueSegment}`);
    }

    startRefreshCycle() {
        setInterval(() => {
            if (document.hidden) return;

            this.state.adSlots.forEach(slot => {
                if (this.isSlotVisible(slot)) {
                    // Logic to refresh visible ads for more impressions
                    // console.log('💰 Refreshing visible ad'); 
                }
            });
        }, this.config.refreshInterval);
    }

    isSlotVisible(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}

// Runtime Execution
window.Layer148_Monetization = new SportIQMonetizationEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer148_Monetization.init());
} else {
    window.Layer148_Monetization.init();
}
