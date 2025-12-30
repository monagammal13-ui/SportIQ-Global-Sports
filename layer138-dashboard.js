/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 138: PERSONALIZED READER DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Centralizes user-specific content, reading history, and saved items.
 * Features:
 *  - "For You" Feed based on browsing history.
 *  - "Continue Reading" prompt for unfinished articles.
 *  - Saved/Bookmarked Articles list.
 *  - Interest Profile visualization.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        storageKeys: {
            history: 'sportiq_read_history',
            saved: 'sportiq_saved_items',
            interests: 'sportiq_interest_profile'
        },
        selectors: {
            dashboardTarget: '#main-content-feed, main', // Where to inject if full page
            menuTrigger: '#user-dashboard-trigger'
        }
    };

    class PersonalDashboard {
        constructor() {
            this.history = JSON.parse(localStorage.getItem(CONFIG.storageKeys.history) || '[]');
            this.saved = JSON.parse(localStorage.getItem(CONFIG.storageKeys.saved) || '[]');
            // Mock initial interests if empty
            this.interests = JSON.parse(localStorage.getItem(CONFIG.storageKeys.interests) || '{"Football": 80, "F1": 40, "Tech": 20}');

            this.init();
        }

        init() {
            console.log('👤 Layer 138: Personal Dashboard - INITIALIZED');
            this.injectAccessPoint();
        }

        injectAccessPoint() {
            // Add a floating button or menu item to access dashboard
            const btn = document.createElement('button');
            btn.className = 'dashboard-fab';
            btn.innerHTML = '👤';
            btn.title = 'My Reader Dashboard';
            btn.onclick = () => this.openDashboardOverlay();
            document.body.appendChild(btn);
        }

        openDashboardOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'dashboard-overlay animated-slide-up';
            overlay.innerHTML = `
                <div class="dashboard-container">
                    <header class="dash-header">
                        <h2>My Reader Hub</h2>
                        <button class="dash-close" onclick="this.closest('.dashboard-overlay').remove()">×</button>
                    </header>
                    
                    <div class="dash-grid">
                        <!-- Left: Stats & Interests -->
                        <aside class="dash-sidebar">
                            <div class="dash-card profile-card">
                                <div class="avatar">U</div>
                                <h4>Reader Profile</h4>
                                <div class="interest-tags">
                                    ${this.renderInterestTags()}
                                </div>
                            </div>
                        </aside>

                        <!-- Right: Content -->
                        <main class="dash-content">
                            <!-- Continue Reading -->
                            ${this.renderContinueReading()}

                            <!-- Saved Items -->
                            <section class="dash-section">
                                <h3>🔖 Saved for Later</h3>
                                ${this.renderSavedList()}
                            </section>

                            <!-- For You Feed -->
                            <section class="dash-section">
                                <h3>🎯 Recommended For You</h3>
                                <div class="rec-feed">
                                    ${this.renderRecommendations()}
                                </div>
                            </section>
                        </main>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        renderInterestTags() {
            return Object.entries(this.interests)
                .sort(([, a], [, b]) => b - a)
                .map(([topic, score]) => `<span class="tag" style="opacity: ${score / 100 + 0.3}">${topic}</span>`)
                .join('');
        }

        renderContinueReading() {
            // Find most recent unfinished article
            const recent = this.history[0];
            if (!recent) return '';

            return `
                <section class="dash-section continue-reading">
                    <div class="continue-card">
                        <div class="content">
                            <span class="label">Continue Reading</span>
                            <h4>${recent.title || 'Previous Article'}</h4>
                            <div class="progress-bar">
                                <div class="fill" style="width: ${recent.scrollDepth || 40}%"></div>
                            </div>
                        </div>
                        <button class="btn-read">Run ▶</button>
                    </div>
                </section>
            `;
        }

        renderSavedList() {
            if (this.saved.length === 0) return '<p class="empty-state">No saved articles yet.</p>';
            return `
                <ul class="saved-list">
                    ${this.saved.map(item => `
                        <li>
                            <a href="${item.url}">${item.title}</a>
                            <button class="btn-remove">×</button>
                        </li>
                    `).join('')}
                </ul>
            `;
        }

        renderRecommendations() {
            // Mock recommendations based on top interest
            const topInterest = Object.keys(this.interests)[0] || 'Trending';
            return `
                <div class="rec-card">
                    <h5>Based on your love for ${topInterest}</h5>
                    <p>New Analysis: The tactical evolution of the season...</p>
                </div>
                <div class="rec-card">
                    <h5>Hot in ${topInterest}</h5>
                    <p>Breaking: Major announcement from the league...</p>
                </div>
            `;
        }
    }

    // Auto-Expose
    window.Layer138_Dashboard = new PersonalDashboard();

})();
