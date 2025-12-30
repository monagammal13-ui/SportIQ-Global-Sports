/**
 * Analytics & Tracking System
 * Comprehensive visitor tracking with privacy compliance
 */

class AnalyticsTracker {
    constructor(config) {
        this.config = config;
        this.consentGiven = false;
        this.queue = [];
        this.init();
    }

    init() {
        // Check for consent
        this.checkConsent();

        // Initialize if consent given
        if (this.consentGiven) {
            this.initializeTrackers();
        }

        // Setup event listeners
        this.setupEventListeners();

        console.log('📊 Analytics initialized');
    }

    // Check cookie consent
    checkConsent() {
        const consent = localStorage.getItem('analytics-consent');
        this.consentGiven = consent === 'true';

        if (!this.consentGiven) {
            this.showConsentBanner();
        }
    }

    // Show consent banner
    showConsentBanner() {
        if (document.querySelector('.cookie-consent')) return;

        const banner = document.createElement('div');
        banner.className = 'cookie-consent';
        banner.innerHTML = `
      <div class="cookie-consent-content">
        <p>We use cookies and analytics to improve your experience. 
        <a href="/privacy">Learn more</a></p>
        <div class="cookie-consent-buttons">
          <button class="btn btn-primary" data-consent="accept">Accept</button>
          <button class="btn btn-secondary" data-consent="decline">Decline</button>
        </div>
      </div>
    `;

        document.body.appendChild(banner);

        // Handle consent
        banner.querySelectorAll('[data-consent]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.consent;
                this.handleConsent(action === 'accept');
                banner.remove();
            });
        });
    }

    // Handle consent decision
    handleConsent(accepted) {
        this.consentGiven = accepted;
        localStorage.setItem('analytics-consent', accepted);

        if (accepted) {
            this.initializeTrackers();
            this.processQueue();
        }

        // Fire consent event
        window.dispatchEvent(new CustomEvent('analytics:consent', {
            detail: { accepted }
        }));
    }

    // Initialize trackers
    initializeTrackers() {
        // Google Analytics
        if (this.config.providers.googleAnalytics.enabled) {
            this.initGA();
        }

        // Google Tag Manager
        if (this.config.providers.googleTagManager.enabled) {
            this.initGTM();
        }

        // Heatmaps
        if (this.config.providers.heatmaps.enabled) {
            this.initHeatmaps();
        }
    }

    // Initialize Google Analytics
    initGA() {
        const gaMeasurementId = this.config.providers.googleAnalytics.trackingId;

        // Load GA script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', gaMeasurementId, {
            'anonymize_ip': this.config.providers.googleAnalytics.anonymizeIP,
            'cookie_expires': this.config.providers.googleAnalytics.cookieExpires
        });

        console.log('✅ Google Analytics initialized');
    }

    // Initialize Google Tag Manager
    initGTM() {
        const gtmId = this.config.providers.googleTagManager.containerId;

        // GTM script
        (function (w, d, s, l, i) {
            w[l] = w[l] || []; w[l].push({
                'gtm.start':
                    new Date().getTime(), event: 'gtm.js'
            }); var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
                    'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', gtmId);

        console.log('✅ Google Tag Manager initialized');
    }

    // Initialize Heatmaps (Hotjar example)
    initHeatmaps() {
        const siteId = this.config.providers.heatmaps.siteId;

        (function (h, o, t, j, a, r) {
            h.hj = h.hj || function () { (h.hj.q = h.hj.q || []).push(arguments) };
            h._hjSettings = { hjid: siteId, hjsv: 6 };
            a = o.getElementsByTagName('head')[0];
            r = o.createElement('script'); r.async = 1;
            r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
            a.appendChild(r);
        })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

        console.log('✅ Heatmaps initialized');
    }

    // Track page view
    trackPageView(path, title) {
        if (!this.consentGiven) {
            this.queue.push(['pageview', path, title]);
            return;
        }

        if (window.gtag) {
            gtag('event', 'page_view', {
                page_path: path,
                page_title: title
            });
        }
    }

    // Track event
    trackEvent(category, action, label, value) {
        if (!this.consentGiven) {
            this.queue.push(['event', category, action, label, value]);
            return;
        }

        if (window.gtag) {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }
    }

    // Track slider events
    trackSlider(action, slideIndex) {
        this.trackEvent('slider', action, `Slide ${slideIndex}`, slideIndex);
    }

    // Track video events
    trackVideo(action, videoTitle, progress) {
        this.trackEvent('video', action, videoTitle, progress);
    }

    // Track scroll depth
    trackScrollDepth(depth) {
        this.trackEvent('engagement', 'scroll_depth', `${depth}%`, depth);
    }

    // Track time on page
    trackTimeOnPage(seconds) {
        this.trackEvent('engagement', 'time_on_page', `${seconds}s`, seconds);
    }

    // Track search
    trackSearch(query, resultsCount) {
        this.trackEvent('search', 'search_query', query, resultsCount);
    }

    // Track social share
    trackShare(platform, url) {
        this.trackEvent('social', 'share', platform, url);
    }

    // Track conversion
    trackConversion(type, value) {
        this.trackEvent('conversion', type, type, value);
    }

    // Process queued events
    processQueue() {
        while (this.queue.length > 0) {
            const event = this.queue.shift();
            const [type, ...args] = event;

            if (type === 'pageview') {
                this.trackPageView(...args);
            } else if (type === 'event') {
                this.trackEvent(...args);
            }
        }
    }

    // Setup automatic event listeners
    setupEventListeners() {
        // Scroll depth tracking
        this.setupScrollTracking();

        // Time on page tracking
        this.setupTimeTracking();

        // Click tracking
        this.setupClickTracking();

        // Form tracking
        this.setupFormTracking();
    }

    // Setup scroll tracking
    setupScrollTracking() {
        const depths = this.config.eventTracking.engagement.scrollDepth;
        const tracked = new Set();

        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

            depths.forEach(depth => {
                if (scrollPercent >= depth && !tracked.has(depth)) {
                    tracked.add(depth);
                    this.trackScrollDepth(depth);
                }
            });
        });
    }

    // Setup time tracking
    setupTimeTracking() {
        const milestones = this.config.eventTracking.engagement.timeOnPage;
        const tracked = new Set();
        const startTime = Date.now();

        setInterval(() => {
            const secondsOnPage = Math.floor((Date.now() - startTime) / 1000);

            milestones.forEach(milestone => {
                if (secondsOnPage >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    this.trackTimeOnPage(milestone);
                }
            });
        }, 1000);
    }

    // Setup click tracking
    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-track]');
            if (!target) return;

            const category = target.dataset.trackCategory || 'click';
            const action = target.dataset.track;
            const label = target.dataset.trackLabel || target.textContent;

            this.trackEvent(category, action, label);
        });
    }

    // Setup form tracking
    setupFormTracking() {
        document.querySelectorAll('form[data-track-submit]').forEach(form => {
            form.addEventListener('submit', (e) => {
                const formName = form.dataset.trackSubmit;
                this.trackConversion('form_submit', formName);
            });
        });
    }
}

// Initialize analytics on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load config
        const response = await fetch('/api-json/analytics-tracking.json');
        const config = await response.json();

        // Initialize tracker
        window.analyticsTracker = new AnalyticsTracker(config);

        // Track initial page view
        window.analyticsTracker.trackPageView(window.location.pathname, document.title);

    } catch (error) {
        console.error('Analytics initialization failed:', error);
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsTracker;
}
