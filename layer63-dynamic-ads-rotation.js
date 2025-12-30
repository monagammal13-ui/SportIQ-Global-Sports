/**
 * Layer 63 - Dynamic Ads Rotation
 * Advanced monetization with 9 scripts, 300+ links, auto-rotation
 */

class DynamicAdsRotation {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.loadedScripts = new Set();
        this.activeLinks = new Map();
        this.rotationIntervals = new Map();
        this.stats = {
            impressions: 0,
            clicks: 0,
            revenue: 0
        };

        this.init();
    }

    async init() {
        console.log('💰 Layer 63: Dynamic Ads Rotation - STARTING');

        // Load configuration
        await this.loadConfig();

        // Add 9 ad scripts
        await this.addAdScripts();

        // Add hundreds of direct links
        this.addDirectLinks();

        // Enable auto-rotation
        this.enableAutoRotation();

        // Start continuous updates
        this.startContinuousUpdates();

        this.isActive = true;
        console.log('✅ Layer 63: Dynamic Ads Rotation - ACTIVE');
        console.log(`💵 Estimated Revenue: $${this.config?.estimatedRevenue?.yearly?.toLocaleString()}/year`);
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/layer63-dynamic-ads-rotation.json');
            this.config = await response.json();
            console.log('✅ Layer 63 config loaded');
        } catch (error) {
            console.error('❌ Failed to load Layer 63 config:', error);
            this.config = { adScripts: { networks: [] }, directLinks: { total: 0 } };
        }
    }

    async addAdScripts() {
        console.log('📜 Adding 9 ad network scripts...');

        const networks = this.config?.adScripts?.networks || [];
        let loadedCount = 0;

        for (const network of networks) {
            if (network.enabled) {
                const success = await this.loadAdScript(network);
                if (success) loadedCount++;
            }
        }

        console.log(`✅ Loaded ${loadedCount}/9 ad networks`);
    }

    async loadAdScript(network) {
        return new Promise((resolve) => {
            // Check if already loaded
            if (this.loadedScripts.has(network.id)) {
                console.log(`⏭️ ${network.name} already loaded`);
                resolve(true);
                return;
            }

            console.log(`📥 Loading ${network.name}...`);

            const script = document.createElement('script');
            script.id = `ad-network-${network.id}`;
            script.src = network.script;

            if (network.async) script.async = true;
            if (network.crossOrigin) script.crossOrigin = network.crossOrigin;

            // Timeout protection
            const timeoutId = setTimeout(() => {
                console.warn(`⏱️ ${network.name} timeout (10s)`);
                resolve(false);
            }, 10000);

            script.onload = () => {
                clearTimeout(timeoutId);
                this.loadedScripts.add(network.id);
                console.log(`✅ ${network.name} loaded`);
                resolve(true);
            };

            script.onerror = () => {
                clearTimeout(timeoutId);
                console.warn(`⚠️ ${network.name} failed`);
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    addDirectLinks() {
        console.log('🔗 Adding hundreds of direct ad links...');

        const links = this.generateDirectLinks();

        // Organize by zones
        const zones = ['header', 'sidebar', 'inContent', 'footer', 'popup', 'native'];

        zones.forEach(zone => {
            const zoneLinks = links.filter(link => link.zone === zone);
            this.activeLinks.set(zone, {
                links: zoneLinks,
                currentIndex: 0,
                totalLinks: zoneLinks.length
            });

            console.log(`✅ Zone "${zone}": ${zoneLinks.length} links`);
        });

        const totalLinks = links.length;
        console.log(`✅ Total direct links: ${totalLinks}`);
    }

    generateDirectLinks() {
        const links = [];
        const categories = {
            sportsBetting: ['Bet365', 'DraftKings', 'FanDuel', 'BetMGM'],
            sportsGear: ['Nike', 'Adidas', 'Under Armour', 'Puma'],
            streaming: ['ESPN+', 'DAZN', 'Peacock', 'Paramount+'],
            tickets: ['Ticketmaster', 'StubHub', 'SeatGeek', 'Vivid Seats'],
            fantasy: ['FanDuel Fantasy', 'DraftKings Fantasy', 'Yahoo Fantasy']
        };

        const zones = ['header', 'sidebar', 'inContent', 'footer', 'popup', 'native'];

        let linkId = 1;

        // Generate 300 links
        for (let i = 0; i < 300; i++) {
            const categoryKeys = Object.keys(categories);
            const category = categoryKeys[i % categoryKeys.length];
            const brands = categories[category];
            const brand = brands[i % brands.length];
            const zone = zones[i % zones.length];

            links.push({
                id: linkId++,
                zone,
                category,
                brand,
                url: `https://example.com/ads/${category}/${brand.toLowerCase().replace(/\s/g, '-')}/${linkId}`,
                text: `${brand} - Special Offer`,
                weight: Math.floor(Math.random() * 10) + 1,
                impressions: 0,
                clicks: 0,
                active: true
            });
        }

        return links;
    }

    enableAutoRotation() {
        console.log('🔄 Enabling auto-rotation for all zones...');

        const intervals = this.config?.autoRotation?.intervals || {};

        for (const [zone, zoneData] of this.activeLinks) {
            const interval = intervals[zone] || 30000; // Default 30s

            this.startZoneRotation(zone, interval);
        }

        console.log(`✅ Auto-rotation enabled for ${this.activeLinks.size} zones`);
    }

    startZoneRotation(zone, interval) {
        // Clear existing interval
        if (this.rotationIntervals.has(zone)) {
            clearInterval(this.rotationIntervals.get(zone));
        }

        const zoneData = this.activeLinks.get(zone);
        if (!zoneData || zoneData.links.length === 0) return;

        // Create interval
        const intervalId = setInterval(() => {
            this.rotateZoneAd(zone);
        }, interval);

        this.rotationIntervals.set(zone, intervalId);
        console.log(`🔄 Zone "${zone}" rotating every ${interval}ms`);
    }

    rotateZoneAd(zone) {
        const zoneData = this.activeLinks.get(zone);
        if (!zoneData) return;

        // Move to next ad
        zoneData.currentIndex = (zoneData.currentIndex + 1) % zoneData.links.length;

        const currentLink = zoneData.links[zoneData.currentIndex];

        // Track impression
        currentLink.impressions++;
        this.stats.impressions++;

        // Display ad (if container exists)
        this.displayAd(zone, currentLink);

        console.log(`🔄 ${zone}: ${currentLink.brand} (${zoneData.currentIndex + 1}/${zoneData.totalLinks})`);
    }

    displayAd(zone, link) {
        const container = document.querySelector(`[data-ad-zone="${zone}"]`);
        if (!container) return;

        const adElement = document.createElement('a');
        adElement.href = link.url;
        adElement.textContent = link.text;
        adElement.className = `ad-link zone-${zone}`;
        adElement.target = '_blank';
        adElement.rel = 'noopener noreferrer sponsored';

        // Track clicks
        adElement.addEventListener('click', () => {
            this.trackClick(link);
        });

        container.innerHTML = '';
        container.appendChild(adElement);
    }

    trackClick(link) {
        link.clicks++;
        this.stats.clicks++;

        // Calculate estimated revenue (example: $0.50 per click)
        this.stats.revenue += 0.50;

        console.log(`📊 Click: ${link.brand} | Total: $${this.stats.revenue.toFixed(2)}`);

        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'ad_click', {
                'event_category': 'ads',
                'event_label': link.brand,
                'value': link.id
            });
        }
    }

    startContinuousUpdates() {
        console.log('🔄 Starting continuous updates...');

        const checkInterval = this.config?.continuousUpdate?.checkInterval || 300000; // 5 min

        setInterval(() => {
            this.updateLinks();
            this.updatePerformance();
        }, checkInterval);

        console.log(`✅ Continuous updates enabled (${checkInterval}ms)`);
    }

    updateLinks() {
        console.log('🔄 Updating ad links...');

        // Check performance of all links
        for (const [zone, zoneData] of this.activeLinks) {
            zoneData.links.forEach(link => {
                // Disable low-performing links
                if (link.impressions > 100 && link.clicks === 0) {
                    link.active = false;
                    console.log(`⚠️ Disabled low-performing link: ${link.brand}`);
                }
            });

            // Filter active links
            zoneData.links = zoneData.links.filter(link => link.active);
        }
    }

    updatePerformance() {
        const ctr = this.stats.impressions > 0
            ? (this.stats.clicks / this.stats.impressions * 100).toFixed(2)
            : 0;

        console.log(`📊 Performance Update:`);
        console.log(`   Impressions: ${this.stats.impressions.toLocaleString()}`);
        console.log(`   Clicks: ${this.stats.clicks.toLocaleString()}`);
        console.log(`   CTR: ${ctr}%`);
        console.log(`   Revenue: $${this.stats.revenue.toFixed(2)}`);
    }

    getStatus() {
        const totalLinks = Array.from(this.activeLinks.values())
            .reduce((sum, zone) => sum + zone.totalLinks, 0);

        return {
            active: this.isActive,
            layer: 63,
            name: 'Dynamic Ads Rotation',
            adScripts: this.loadedScripts.size,
            directLinks: totalLinks,
            activeZones: this.activeLinks.size,
            rotations: this.rotationIntervals.size,
            stats: this.stats,
            estimatedYearlyRevenue: this.config?.estimatedRevenue?.yearly || 0
        };
    }

    pauseAllRotations() {
        for (const intervalId of this.rotationIntervals.values()) {
            clearInterval(intervalId);
        }
        console.log('⏸️ All rotations paused');
    }

    resumeAllRotations() {
        const intervals = this.config?.autoRotation?.intervals || {};

        for (const zone of this.activeLinks.keys()) {
            const interval = intervals[zone] || 30000;
            this.startZoneRotation(zone, interval);
        }
        console.log('▶️ All rotations resumed');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer63_DynamicAdsRotation = new DynamicAdsRotation();
    });
} else {
    window.Layer63_DynamicAdsRotation = new DynamicAdsRotation();
}
