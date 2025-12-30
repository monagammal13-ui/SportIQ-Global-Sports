/**
 * Runtime_Ads_And_Scripts
 * Safe execution of ad scripts and external links without conflicts
 */

class RuntimeAdsAndScripts {
    constructor() {
        this.adScripts = new Map();
        this.directLinks = new Map();
        this.loadedScripts = new Set();
        this.rotationIntervals = new Map();
        this.isActive = false;

        // Ad configuration
        this.adConfig = {
            maxConcurrent: 3,        // Max ads loading at once
            timeout: 10000,          // 10s timeout per script
            retryAttempts: 2,        // Retry failed ads
            rotationInterval: 30000, // 30s rotation
            isolationMode: true      // Run in iframe if possible
        };

        this.init();
    }

    async init() {
        console.log('💰 Runtime Ads & Scripts - STARTING');

        // Load ad configuration
        await this.loadAdConfiguration();

        // Setup ad scripts
        await this.setupAdScripts();

        // Setup direct links rotation
        this.setupDirectLinks();

        // Monitor for new ads
        this.startAdMonitoring();

        this.isActive = true;
        console.log('✅ Runtime Ads & Scripts - ACTIVE');
    }

    // LOAD AD CONFIGURATION
    async loadAdConfiguration() {
        console.log('📋 Loading ad configuration...');

        // Try to load from runtime ultimate config
        if (window.RuntimeData) {
            const runtimeConfig = window.RuntimeData.getDataByName('runtime-ultimate');
            if (runtimeConfig?.adManagement) {
                console.log(`✅ Found ad config: ${runtimeConfig.adManagement.totalAds} ads`);
                return;
            }
        }

        console.log('ℹ️ Using default ad configuration');
    }

    // SETUP AD SCRIPTS
    async setupAdScripts() {
        console.log('📜 Setting up ad scripts...');

        // Common ad networks
        const adNetworks = [
            {
                id: 'google-adsense',
                name: 'Google AdSense',
                src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
                async: true,
                crossOrigin: 'anonymous',
                enabled: true
            },
            {
                id: 'media-net',
                name: 'Media.net',
                src: 'https://contextual.media.net/dmedianet.js',
                async: true,
                enabled: false // Enable when you have account
            },
            {
                id: 'propeller-ads',
                name: 'PropellerAds',
                src: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
                async: true,
                enabled: false
            }
        ];

        // Load enabled ad scripts
        for (const network of adNetworks) {
            if (network.enabled) {
                await this.loadAdScript(network);
            } else {
                console.log(`⏭️  ${network.name} disabled, skipping`);
            }
        }

        console.log(`✅ Ad scripts setup complete (${this.loadedScripts.size} loaded)`);
    }

    // LOAD SINGLE AD SCRIPT
    async loadAdScript(network) {
        return new Promise((resolve) => {
            console.log(`📥 Loading ${network.name}...`);

            // Check if already loaded
            if (this.loadedScripts.has(network.id)) {
                console.log(`⏭️  ${network.name} already loaded`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.id = `ad-script-${network.id}`;
            script.src = network.src;

            // Non-blocking async loading
            if (network.async) {
                script.async = true;
            }
            if (network.defer) {
                script.defer = true;
            }
            if (network.crossOrigin) {
                script.crossOrigin = network.crossOrigin;
            }

            // Timeout protection
            const timeoutId = setTimeout(() => {
                console.warn(`⏱️ ${network.name} timeout`);
                this.handleAdScriptError(network, 'timeout');
                resolve();
            }, this.adConfig.timeout);

            script.onload = () => {
                clearTimeout(timeoutId);
                this.loadedScripts.add(network.id);
                this.adScripts.set(network.id, {
                    ...network,
                    loaded: true,
                    timestamp: Date.now()
                });
                console.log(`✅ ${network.name} loaded`);
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeoutId);
                console.warn(`❌ ${network.name} failed to load`);
                this.handleAdScriptError(network, 'load-failed');
                resolve(); // Don't reject, continue with other ads
            };

            // Append to head (not body, so ads load early but don't block)
            document.head.appendChild(script);
        });
    }

    // HANDLE AD SCRIPT ERROR
    handleAdScriptError(network, reason) {
        console.log(`🔧 Handling ${network.name} error (${reason})...`);

        this.adScripts.set(network.id, {
            ...network,
            loaded: false,
            error: reason,
            timestamp: Date.now()
        });

        // Retry if configured
        if (this.adConfig.retryAttempts > 0 && !network._retryCount) {
            network._retryCount = 1;
            setTimeout(() => {
                console.log(`🔄 Retrying ${network.name}...`);
                this.loadAdScript(network);
            }, 5000);
        }
    }

    // SETUP DIRECT LINKS
    setupDirectLinks() {
        console.log('🔗 Setting up direct ad links...');

        // Find all ad link containers
        const adContainers = document.querySelectorAll('[data-ad-zone]');

        adContainers.forEach(container => {
            const zone = container.dataset.adZone;
            const links = this.getAdLinksForZone(zone);

            if (links && links.length > 0) {
                this.directLinks.set(zone, {
                    container,
                    links,
                    currentIndex: 0
                });

                // Display first link
                this.displayAdLink(zone, 0);

                // Setup rotation
                this.setupLinkRotation(zone);

                console.log(`✅ Zone "${zone}" setup (${links.length} links)`);
            }
        });

        console.log(`✅ Direct links setup (${this.directLinks.size} zones)`);
    }

    // GET AD LINKS FOR ZONE
    getAdLinksForZone(zone) {
        // Example ad links (replace with your actual ad links)
        const adLinks = {
            'header': [
                { url: 'https://example.com/ad1', text: 'Sports Gear 50% Off' },
                { url: 'https://example.com/ad2', text: 'Live Match Tickets' },
                { url: 'https://example.com/ad3', text: 'Premium Sports Streaming' }
            ],
            'sidebar': [
                { url: 'https://example.com/ad4', text: 'Fantasy Sports App' },
                { url: 'https://example.com/ad5', text: 'Sports Betting Guide' }
            ],
            'footer': [
                { url: 'https://example.com/ad6', text: 'Sports News Premium' },
                { url: 'https://example.com/ad7', text: 'Athlete Training Program' }
            ]
        };

        return adLinks[zone] || [];
    }

    // DISPLAY AD LINK
    displayAdLink(zone, index) {
        const adZone = this.directLinks.get(zone);
        if (!adZone) return;

        const link = adZone.links[index];
        if (!link) return;

        // Create ad link element
        const adElement = document.createElement('a');
        adElement.href = link.url;
        adElement.textContent = link.text;
        adElement.className = 'ad-link';
        adElement.target = '_blank';
        adElement.rel = 'noopener noreferrer sponsored';

        // Add click tracking
        adElement.addEventListener('click', () => {
            this.trackAdClick(zone, index);
        });

        // Clear container and add new link
        adZone.container.innerHTML = '';
        adZone.container.appendChild(adElement);
    }

    // SETUP LINK ROTATION
    setupLinkRotation(zone) {
        const adZone = this.directLinks.get(zone);
        if (!adZone || adZone.links.length <= 1) return;

        // Clear existing interval
        if (this.rotationIntervals.has(zone)) {
            clearInterval(this.rotationIntervals.get(zone));
        }

        // Setup new rotation
        const intervalId = setInterval(() => {
            adZone.currentIndex = (adZone.currentIndex + 1) % adZone.links.length;
            this.displayAdLink(zone, adZone.currentIndex);
            console.log(`🔄 Rotated ad in zone "${zone}" (${adZone.currentIndex + 1}/${adZone.links.length})`);
        }, this.adConfig.rotationInterval);

        this.rotationIntervals.set(zone, intervalId);
    }

    // TRACK AD CLICK
    trackAdClick(zone, index) {
        console.log(`📊 Ad clicked: Zone ${zone}, Link ${index}`);

        // Send to analytics if available
        if (window.RuntimeData && typeof gtag !== 'undefined') {
            gtag('event', 'ad_click', {
                'event_category': 'ads',
                'event_label': zone,
                'value': index
            });
        }
    }

    // START AD MONITORING
    startAdMonitoring() {
        console.log('👀 Ad monitoring started');

        // Check for new ad zones every minute
        setInterval(() => {
            this.scanForNewAdZones();
        }, 60000);
    }

    scanForNewAdZones() {
        const adContainers = document.querySelectorAll('[data-ad-zone]');

        adContainers.forEach(container => {
            const zone = container.dataset.adZone;
            if (!this.directLinks.has(zone)) {
                console.log(`🆕 New ad zone detected: ${zone}`);
                const links = this.getAdLinksForZone(zone);
                if (links && links.length > 0) {
                    this.directLinks.set(zone, {
                        container,
                        links,
                        currentIndex: 0
                    });
                    this.displayAdLink(zone, 0);
                    this.setupLinkRotation(zone);
                }
            }
        });
    }

    // LOAD EXTERNAL SCRIPT SAFELY
    async loadExternalScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log('⏭️  Script already loaded:', src);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;

            // Apply options
            if (options.async !== false) script.async = true;
            if (options.defer) script.defer = true;
            if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
            if (options.integrity) script.integrity = options.integrity;

            // Timeout
            const timeout = options.timeout || this.adConfig.timeout;
            const timeoutId = setTimeout(() => {
                console.warn('⏱️ External script timeout:', src);
                reject(new Error('Timeout'));
            }, timeout);

            script.onload = () => {
                clearTimeout(timeoutId);
                console.log('✅ External script loaded:', src);
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeoutId);
                console.error('❌ External script failed:', src);
                reject(new Error('Load failed'));
            };

            document.head.appendChild(script);
        });
    }

    // PUBLIC API
    async loadAdNetwork(networkId) {
        const network = Array.from(this.adScripts.values()).find(n => n.id === networkId);
        if (network) {
            return await this.loadAdScript(network);
        }
    }

    addAdZone(zone, links) {
        console.log(`➕ Adding ad zone: ${zone}`);

        // Find container
        const container = document.querySelector(`[data-ad-zone="${zone}"]`);
        if (!container) {
            console.warn(`⚠️ Container not found for zone: ${zone}`);
            return;
        }

        this.directLinks.set(zone, {
            container,
            links,
            currentIndex: 0
        });

        this.displayAdLink(zone, 0);
        this.setupLinkRotation(zone);
    }

    removeAdZone(zone) {
        if (this.rotationIntervals.has(zone)) {
            clearInterval(this.rotationIntervals.get(zone));
            this.rotationIntervals.delete(zone);
        }
        this.directLinks.delete(zone);
        console.log(`➖ Removed ad zone: ${zone}`);
    }

    pauseRotation(zone) {
        if (this.rotationIntervals.has(zone)) {
            clearInterval(this.rotationIntervals.get(zone));
            this.rotationIntervals.delete(zone);
            console.log(`⏸️ Paused rotation: ${zone}`);
        }
    }

    resumeRotation(zone) {
        if (this.directLinks.has(zone) && !this.rotationIntervals.has(zone)) {
            this.setupLinkRotation(zone);
            console.log(`▶️ Resumed rotation: ${zone}`);
        }
    }

    getStatus() {
        return {
            active: this.isActive,
            loadedScripts: this.loadedScripts.size,
            adScripts: this.adScripts.size,
            directLinkZones: this.directLinks.size,
            activeRotations: this.rotationIntervals.size
        };
    }

    stopAllRotations() {
        for (const intervalId of this.rotationIntervals.values()) {
            clearInterval(intervalId);
        }
        this.rotationIntervals.clear();
        console.log('⏹️ All rotations stopped');
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.RuntimeAds = new RuntimeAdsAndScripts();
    });
} else {
    window.RuntimeAds = new RuntimeAdsAndScripts();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuntimeAdsAndScripts;
}
