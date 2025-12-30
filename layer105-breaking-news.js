/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 105: BREAKING NEWS PRIORITY ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Specializes in managing "Breaking News" status for content.
 * Features:
 *  - Elevates urgency of specific news items.
 *  - Injects specific "Breaking" badges and banners into article headers.
 *  - Coordinates with the Notification System (Layer 120) to push alerts.
 *  - Auto-expires "Breaking" status after set time.
 * 
 * Version: 2.0.0 (Priority Activated)
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        scanInterval: 10000,
        breakingDuration: 1000 * 60 * 60, // 1 hour
        selectors: {
            articleHeader: 'header, .post-header',
            heroTitle: 'h1.post-title, h1.entry-title'
        }
    };

    class BreakingNewsEngine {
        constructor() {
            this.activeIds = new Set();
            this.init();
        }

        init() {
            console.log('⚡ Layer 105: Breaking News Priority - ACTIVE');
            this.scanPage();
        }

        scanPage() {
            // Check if current page is tagged as Breaking
            // Use metadata or tags check
            const isBreaking = this.detectBreakingStatus();

            if (isBreaking) {
                this.elevateCurrentPage();
            }
        }

        detectBreakingStatus() {
            // Check tags
            const tags = Array.from(document.querySelectorAll('a[rel="tag"], .post-labels a'));
            return tags.some(t => t.textContent.toLowerCase().includes('breaking'));
        }

        elevateCurrentPage() {
            console.log('⚡ Elevating page to BREAKING status');

            // 1. Inject Badge
            this.injectBadge();

            // 2. Trigger Global Alert (via Layer 120 if active)
            this.triggerGlobalAlert();
        }

        injectBadge() {
            const h1 = document.querySelector(CONFIG.selectors.heroTitle);
            if (h1 && !h1.querySelector('.breaking-badge')) {
                const badge = document.createElement('span');
                badge.className = 'breaking-badge pulse-animation';
                badge.innerHTML = '⚡ BREAKING';
                h1.prepend(badge);
            }
        }

        triggerGlobalAlert() {
            if (window.Layer120_Alerts && !sessionStorage.getItem('breaking_alert_shown')) {
                const title = document.querySelector(CONFIG.selectors.heroTitle)?.innerText.replace('⚡ BREAKING', '').trim();

                window.Layer120_Alerts.triggerAlert({
                    id: 'brk_page_' + Date.now(),
                    level: 'critical',
                    headline: title || 'Breaking News',
                    timestamp: Date.now()
                });

                sessionStorage.setItem('breaking_alert_shown', 'true');
            }
        }
    }

    // Auto-Expose
    window.Layer105_Breaking = new BreakingNewsEngine();

})();
