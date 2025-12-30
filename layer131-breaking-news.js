/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 131: REAL-TIME BREAKING NEWS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: DELIVERS HIGH-PRIORITY ALERTS INSTANTLY.
 *          Overrides standard UI to display urgent breaking news banners.
 * Features: Urgent tickers, full-width banners, flash alerts, and auto-expiry.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        breaking: {
            displayDuration: 15000, // ms before auto-minimize (if applicable)
            flashEnabled: true
        },
        selectors: {
            appContainer: '#app', // Main app wrapper to push down
            bannerId: 'breaking-news-banner'
        }
    };

    const state = {
        activeAlert: null,
        isBannerVisible: false
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BREAKING NEWS ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const BreakingNewsEngine = {
        initialize: function () {
            console.log('🚨 [BreakingNews] Engine initialized');

            // Listen for system-wide breaking (custom event)
            document.addEventListener('newsgen:breaking-news', (e) => {
                if (e.detail) this.triggerAlert(e.detail);
            });

            // Listen for manual trigger via console or other layers
            window.addEventListener('trigger-breaking', (e) => {
                this.triggerAlert(e.detail);
            });
        },

        triggerAlert: function (newsItem) {
            // newsItem: { headline, subhead, url, severity: 'high'|'critical' }
            console.log(`🚨 [BreakingNews] ALERT RECEIVED: ${newsItem.headline}`);

            state.activeAlert = newsItem;
            this.renderBanner(newsItem);

            if (CONFIG.breaking.flashEnabled) {
                this.flashScreen();
            }

            // Integrate with Notification Scheduler (Layer 124) if present
            if (window.NotifyScheduler) {
                window.NotifyScheduler.schedule({
                    title: '🚨 ' + newsItem.headline,
                    body: newsItem.subhead || 'Tap to read full story.',
                    topic: 'breaking',
                    sendAt: Date.now()
                });
            }
        },

        renderBanner: function (item) {
            this.removeBanner(); // Clear existing

            const banner = document.createElement('div');
            banner.id = CONFIG.selectors.bannerId;
            banner.className = `breaking-banner severity-${item.severity || 'high'}`;

            banner.innerHTML = `
                <div class="bb-content">
                    <div class="bb-label">
                        <span class="bb-icon">⚡</span> BREAKING
                    </div>
                    <div class="bb-text">
                        <span class="bb-headline">${item.headline}</span>
                        ${item.subhead ? `<span class="bb-subhead"> - ${item.subhead}</span>` : ''}
                    </div>
                </div>
                <div class="bb-actions">
                    ${item.url ? `<a href="${item.url}" class="bb-btn">Read Now</a>` : ''}
                    <button class="bb-close" onclick="BreakingNews.dismiss()">×</button>
                </div>
                <div class="bb-progress"></div>
            `;

            document.body.prepend(banner);
            state.isBannerVisible = true;

            // Animate In
            requestAnimationFrame(() => banner.classList.add('visible'));

            // Auto Dismiss Timer logic could go here, but breaking news usually stays until dismissed
        },

        removeBanner: function () {
            const existing = document.getElementById(CONFIG.selectors.bannerId);
            if (existing) {
                existing.classList.remove('visible');
                setTimeout(() => existing.remove(), 300); // 300ms transition
            }
            state.isBannerVisible = false;
        },

        flashScreen: function () {
            const flash = document.createElement('div');
            flash.className = 'breaking-flash';
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 1000);
        },

        injectDemo: function () {
            this.triggerAlert({
                headline: 'Official: Mbappe Signs for Liverpool',
                subhead: 'World record transfer fee agreed',
                url: '#article-mbappe',
                severity: 'critical'
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.BreakingNews = {
        init: BreakingNewsEngine.initialize.bind(BreakingNewsEngine),
        trigger: BreakingNewsEngine.triggerAlert.bind(BreakingNewsEngine),
        dismiss: BreakingNewsEngine.removeBanner.bind(BreakingNewsEngine),
        demo: BreakingNewsEngine.injectDemo.bind(BreakingNewsEngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => BreakingNewsEngine.initialize());
    } else {
        BreakingNewsEngine.initialize();
    }

})();
