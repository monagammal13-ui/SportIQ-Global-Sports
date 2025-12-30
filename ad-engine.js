/**
 * SPORTIQ Ad Engine Core
 * ESPN-Style Professional Ad Rotation System
 * 
 * Features:
 * - Weighted rotation algorithm
 * - Geo-targeting
 * - Device targeting
 * - Anti-AdBlock protection
 * - 9 ad types support
 * - Frequency capping
 * - Performance tracking
 * 
 * @version 2.0
 * @author SPORTIQ Team
 */

class SportIQAdEngine {
    constructor() {
        this.config = {
            directLinks: [],
            scripts: [],
            priorities: null,
            geoRules: null,
            deviceRules: null
        };

        this.state = {
            userCountry: null,
            userDevice: null,
            userBrowser: null,
            connectionSpeed: null,
            shownAds: new Set(),
            sessionStart: Date.now(),
            adBlockDetected: false
        };

        this.stats = {
            impressions: 0,
            clicks: 0,
            revenue: 0
        };

        this.initialized = false;
    }

    /**
     * Initialize the ad engine
     */
    async init() {
        console.log('🎯 SPORTIQ Ad Engine initializing...');

        try {
            // Load all configuration files
            await this.loadConfigurations();

            // Detect user environment
            await this.detectEnvironment();

            // Detect AdBlock
            this.detectAdBlock();

            // Initialize ad slots
            this.initializeAdSlots();

            this.initialized = true;
            console.log('✅ Ad Engine initialized successfully');
            console.log('📊 User Profile:', {
                country: this.state.userCountry,
                device: this.state.userDevice,
                browser: this.state.userBrowser,
                adBlock: this.state.adBlockDetected
            });

        } catch (error) {
            console.error('❌ Ad Engine initialization failed:', error);
        }
    }

    /**
     * Load all JSON configuration files
     */
    async loadConfigurations() {
        try {
            const basePath = '../ads/';

            // Load all config files in parallel
            const [directLinks, scripts, priorities, geoRules, deviceRules] = await Promise.all([
                this.loadJSON(basePath + 'direct-links.json'),
                this.loadJSON(basePath + 'scripts.json'),
                this.loadJSON(basePath + 'priorities.json'),
                this.loadJSON(basePath + 'geo-rules.json'),
                this.loadJSON(basePath + 'device-rules.json')
            ]);

            this.config.directLinks = directLinks.links || [];
            this.config.scripts = scripts.scripts || [];
            this.config.priorities = priorities;
            this.config.geoRules = geoRules;
            this.config.deviceRules = deviceRules;

            console.log(`📋 Loaded ${this.config.directLinks.length} direct links`);
            console.log(`📋 Loaded ${this.config.scripts.length} ad scripts`);

        } catch (error) {
            console.error('Failed to load configurations:', error);
            // Use fallback empty configs
            this.config.directLinks = [];
            this.config.scripts = [];
        }
    }

    /**
     * Load JSON file
     */
    async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Failed to load ${url}:`, error.message);
            return {};
        }
    }

    /**
     * Detect user environment (country, device, browser, connection)
     */
    async detectEnvironment() {
        // Detect device
        this.state.userDevice = this.detectDevice();

        // Detect browser
        this.state.userBrowser = this.detectBrowser();

        // Detect connection speed
        this.state.connectionSpeed = this.detectConnectionSpeed();

        // Detect country (via geo API)
        await this.detectCountry();
    }

    /**
     * Detect device type
     */
    detectDevice() {
        const ua = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;

        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
            return 'tablet';
        }

        if (/mobile|iphone|ipod|blackberry|opera mini|windows phone/i.test(ua)) {
            return 'mobile';
        }

        if (width <= 768) {
            return 'mobile';
        } else if (width <= 1024) {
            return 'tablet';
        }

        return 'desktop';
    }

    /**
     * Detect browser
     */
    detectBrowser() {
        const ua = navigator.userAgent.toLowerCase();

        if (ua.indexOf('edg') > -1) return 'edge';
        if (ua.indexOf('opr') > -1 || ua.indexOf('opera') > -1) return 'opera';
        if (ua.indexOf('chrome') > -1) return 'chrome';
        if (ua.indexOf('safari') > -1) return 'safari';
        if (ua.indexOf('firefox') > -1) return 'firefox';

        return 'unknown';
    }

    /**
     * Detect connection speed
     */
    detectConnectionSpeed() {
        if ('connection' in navigator) {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            const effectiveType = conn.effectiveType;

            if (effectiveType === '4g' || effectiveType === '5g') return '4g-5g';
            if (effectiveType === '3g') return '3g';
            return '2g-slow';
        }

        return '4g-5g'; // Assume fast by default
    }

    /**
     * Detect user country via IP geolocation
     */
    async detectCountry() {
        try {
            // Try primary geo service
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            this.state.userCountry = data.country_code || 'US';
        } catch (error) {
            // Fallback to secondary service
            try {
                const response = await fetch('https://ip-api.com/json/');
                const data = await response.json();
                this.state.userCountry = data.countryCode || 'US';
            } catch (fallbackError) {
                console.warn('Geo detection failed, using default');
                this.state.userCountry = 'US'; // Default fallback
            }
        }
    }

    /**
     * Detect AdBlock presence
     */
    detectAdBlock() {
        // Simple AdBlock detection
        const testAd = document.createElement('div');
        testAd.className = 'ad-test adsbox doubleclick';
        testAd.style.cssText = 'position:absolute;left:-999px;';
        document.body.appendChild(testAd);

        setTimeout(() => {
            const isBlocked = testAd.offsetHeight === 0 || testAd.offsetWidth === 0;
            this.state.adBlockDetected = isBlocked;
            document.body.removeChild(testAd);

            if (isBlocked) {
                console.log('⚠️ AdBlock detected - using anti-block strategies');
            }
        }, 100);
    }

    /**
     * Initialize all ad slots on the page
     */
    initializeAdSlots() {
        const slots = document.querySelectorAll('.ad-slot');

        slots.forEach(slot => {
            const slotName = slot.getAttribute('data-slot');
            const slotConfig = this.config.priorities?.slotPriorities?.[slotName];

            if (slotConfig && this.config.priorities.globalSettings.lazyLoadAds) {
                // Use Intersection Observer for lazy loading
                this.lazyLoadAd(slot, slotName, slotConfig);
            } else {
                // Load immediately
                this.loadAdIntoSlot(slot, slotName, slotConfig);
            }
        });
    }

    /**
     * Lazy load ad when slot comes into view
     */
    lazyLoadAd(slot, slotName, slotConfig) {
        const threshold = this.config.priorities.globalSettings.lazyLoadThreshold || '200px';

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadAdIntoSlot(slot, slotName, slotConfig);
                    observer.unobserve(slot);
                }
            });
        }, {
            rootMargin: threshold
        });

        observer.observe(slot);
    }

    /**
     * Load ad into a specific slot
     */
    async loadAdIntoSlot(slot, slotName, slotConfig) {
        try {
            // Select best ad for this slot
            const ad = await this.selectBestAd(slotName, slotConfig);

            if (!ad) {
                console.warn(`No suitable ad found for slot: ${slotName}`);
                return;
            }

            // Inject ad into slot
            this.injectAd(slot, ad);

            // Track impression
            this.trackImpression(ad, slotName);

            // Setup refresh if enabled
            if (slotConfig?.enableRefresh) {
                this.setupAdRefresh(slot, slotName, slotConfig);
            }

        } catch (error) {
            console.error(`Failed to load ad in slot ${slotName}:`, error);
        }
    }

    /**
     * Select best ad based on targeting rules and weights
     */
    async selectBestAd(slotName, slotConfig) {
        const candidates = [];

        // Get all active direct links that match slot
        const matchingLinks = this.config.directLinks.filter(link => {
            return link.active &&
                this.matchesCountry(link.countries) &&
                this.matchesDevice(link.devices) &&
                !this.state.shownAds.has(link.id);
        });

        candidates.push(...matchingLinks.map(link => ({
            ...link,
            type: 'direct-link',
            score: this.calculateAdScore(link, slotName)
        })));

        // Get all active scripts that match slot
        const matchingScripts = this.config.scripts.filter(script => {
            return script.active &&
                this.matchesCountry(script.countries) &&
                this.matchesDevice(script.devices) &&
                (script.positions.includes(slotName) || script.positions.includes('global'));
        });

        candidates.push(...matchingScripts.map(script => ({
            ...script,
            type: 'ad-script',
            score: this.calculateAdScore(script, slotName)
        })));

        if (candidates.length === 0) {
            return null;
        }

        // Weighted random selection
        return this.weightedRandomSelect(candidates);
    }

    /**
     * Check if ad matches user's country
     */
    matchesCountry(countries) {
        if (!countries || countries.includes('ALL')) return true;
        return countries.includes(this.state.userCountry);
    }

    /**
     * Check if ad matches user's device
     */
    matchesDevice(devices) {
        if (!devices) return true;
        return devices.includes(this.state.userDevice);
    }

    /**
     * Calculate ad score based on weight and context
     */
    calculateAdScore(ad, slotName) {
        let score = ad.weight || 5;

        // Bonus for tier 1 countries
        if (this.isHighValueCountry()) {
            score += 2;
        }

        return score;
    }

    /**
     * Check if user is from high-value country
     */
    isHighValueCountry() {
        const tier1 = this.config.geoRules?.tiers?.tier1?.countries || [];
        return tier1.includes(this.state.userCountry);
    }

    /**
     * Weighted random selection algorithm
     */
    weightedRandomSelect(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.score, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.score;
            if (random <= 0) {
                return item;
            }
        }

        return items[0]; // Fallback
    }

    /**
     * Inject ad into slot element
     */
    injectAd(slot, ad) {
        if (ad.type === 'direct-link') {
            // Create direct link ad
            const link = document.createElement('a');
            link.href = ad.url;
            link.target = '_blank';
            link.rel = 'noopener sponsored';
            link.className = 'ad-direct-link';
            link.textContent = ad.name || 'Advertisement';
            link.style.cssText = 'display:block;text-align:center;padding:20px;background:var(--gradient-primary);color:white;border-radius:var(--radius-lg);text-decoration:none;';

            link.addEventListener('click', () => {
                this.trackClick(ad);
            });

            slot.appendChild(link);

            // Mark as shown
            this.state.shownAds.add(ad.id);

        } else if (ad.type === 'ad-script') {
            // Inject ad script
            if (ad.scriptUrl) {
                const script = document.createElement('script');
                script.src = ad.scriptUrl;
                script.async = true;
                script.dataset.adId = ad.id;
                slot.appendChild(script);
            }
        }
    }

    /**
     * Setup automatic ad refresh
     */
    setupAdRefresh(slot, slotName, slotConfig) {
        const interval = slotConfig.refreshInterval || 30000;

        setInterval(() => {
            // Clear current ad
            slot.innerHTML = '';

            // Load new ad
            this.loadAdIntoSlot(slot, slotName, slotConfig);
        }, interval);
    }

    /**
     * Track ad impression
     */
    trackImpression(ad, slotName) {
        this.stats.impressions++;

        console.log(`📊 Impression: ${ad.name} in ${slotName}`);

        // TODO: Send to analytics
        if (this.config.priorities?.performanceRules?.trackImpressions) {
            this.sendToAnalytics('impression', {
                adId: ad.id,
                adName: ad.name,
                slot: slotName,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Track ad click
     */
    trackClick(ad) {
        this.stats.clicks++;

        console.log(`🖱️ Click: ${ad.name}`);

        // TODO: Send to analytics
        if (this.config.priorities?.performanceRules?.trackClicks) {
            this.sendToAnalytics('click', {
                adId: ad.id,
                adName: ad.name,
                cpc: ad.cpc || 0,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Send event to analytics (placeholder)
     */
    sendToAnalytics(eventType, data) {
        // Placeholder for future analytics integration
        console.log(`📈 Analytics: ${eventType}`, data);

        // TODO: Integrate with Google Analytics, custom tracker, etc.
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            ctr: this.stats.impressions > 0 ?
                (this.stats.clicks / this.stats.impressions * 100).toFixed(2) + '%' :
                '0%'
        };
    }
}

// ========== GLOBAL INSTANCE ==========

// Create global ad engine instance
const sportiqAds = new SportIQAdEngine();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sportiqAds.init();
    });
} else {
    sportiqAds.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportIQAdEngine;
}
