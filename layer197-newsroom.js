/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 197 – INTERNATIONAL NEWSROOM COORDINATION HUB
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Coordinate multiple regional newsrooms under unified editorial control.
 * 
 * @version 1.0.0
 * @layer 197
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 197,
        name: 'International Newsroom Coordination Hub'
    };

    class NewsroomCoordination {
        constructor() {
            this.newsrooms = new Map();
            this.stats = {
                totalNewsrooms: 0,
                activeNewsrooms: 0,
                globalStories: 0
            };
            this.init();
        }

        async init() {
            console.log('🌍 [Layer 197] Newsroom Coordination - Initializing...');
            await this.loadConfiguration();
            this.setupCoordination();
            this.createDashboard();
            console.log('✅ [Layer 197] Newsroom Coordination - Active');
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer197-newsroom.json');
                this.config = response.ok ? await response.json() : CONFIG;
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupCoordination() {
            // Initialize default newsrooms
            this.registerNewsroom({ id: 'global', region: 'Global', status: 'active' });
            this.registerNewsroom({ id: 'americas', region: 'Americas', status: 'active' });
            this.registerNewsroom({ id: 'europe', region: 'Europe', status: 'active' });
            this.registerNewsroom({ id: 'asia', region: 'Asia-Pacific', status: 'active' });
        }

        registerNewsroom(newsroom) {
            this.newsrooms.set(newsroom.id, {
                ...newsroom,
                registeredAt: new Date().toISOString(),
                articles: []
            });
            this.stats.totalNewsrooms++;
            this.stats.activeNewsrooms++;
        }

        coordinateStory(article) {
            this.stats.globalStories++;

            // Distribute to relevant newsrooms
            this.newsrooms.forEach((newsroom) => {
                newsroom.articles.push(article.id);
            });
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer197-dashboard';
            dashboard.className = 'layer197-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer197-dashboard-header">
                    <h3>🌍 Newsrooms</h3>
                    <button class="layer197-close-btn">×</button>
                </div>
                <div class="layer197-dashboard-content">
                    <div class="layer197-stat">
                        <span class="layer197-stat-label">Newsrooms:</span>
                        <span class="layer197-stat-value" id="layer197-total">0</span>
                    </div>
                    <div class="layer197-stat">
                        <span class="layer197-stat-label">Active:</span>
                        <span class="layer197-stat-value" id="layer197-active">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer197-toggle-btn';
            toggleBtn.innerHTML = '🌍';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer197-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });

            this.updateDashboard();
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer197-total');
            const activeEl = document.getElementById('layer197-active');

            if (totalEl) totalEl.textContent = this.stats.totalNewsrooms;
            if (activeEl) activeEl.textContent = this.stats.activeNewsrooms;
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNewsroom);
    } else {
        initNewsroom();
    }

    function initNewsroom() {
        const newsroom = new NewsroomCoordination();
        window.Layer197_Newsroom = newsroom;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.newsroom = newsroom;
        console.log('🎯 [Layer 197] Newsroom Coordination - Ready');
    }

})();
