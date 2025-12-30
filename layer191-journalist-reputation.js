/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 191 – JOURNALIST REPUTATION & ATTRIBUTION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Track journalist contributions, expertise, and credibility metrics.
 * 
 * @version 1.0.0
 * @layer 191
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 191,
        name: 'Journalist Reputation & Attribution System',

        intervals: {
            reputationUpdate: 60000,
            analyticsUpdate: 120000
        }
    };

    class JournalistReputation {
        constructor() {
            this.journalists = new Map();
            this.contributions = new Map();
            this.expertiseDomains = new Map();
            this.config = null;
            this.stats = {
                totalJournalists: 0,
                totalContributions: 0,
                averageReputation: 0
            };

            this.init();
        }

        async init() {
            console.log('👤 [Layer 191] Journalist Reputation - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupReputationTracking();
                this.startMonitoring();
                this.createDashboard();

                console.log('✅ [Layer 191] Journalist Reputation - Active');

            } catch (error) {
                console.error('❌ [Layer 191] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer191-journalist-reputation.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupReputationTracking() {
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.trackContribution(event.detail.article);
                }
            });
        }

        trackContribution(article) {
            if (!article.author) return;

            const journalist = this.getOrCreateJournalist(article.author);

            const contribution = {
                id: `contrib-${Date.now()}`,
                articleId: article.id,
                journalistId: journalist.id,
                title: article.title,
                category: article.category,
                timestamp: new Date().toISOString(),
                impact: this.calculateImpact(article)
            };

            this.contributions.set(contribution.id, contribution);
            journalist.contributions.push(contribution.id);
            journalist.articleCount++;
            this.stats.totalContributions++;

            // Update expertise
            this.updateExpertise(journalist, article.category);

            // Recalculate reputation
            journalist.reputation = this.calculateReputation(journalist);

            this.updateStats();
        }

        getOrCreateJournalist(author) {
            const id = `journalist-${author.toLowerCase().replace(/\s+/g, '-')}`;

            if (this.journalists.has(id)) {
                return this.journalists.get(id);
            }

            const journalist = {
                id: id,
                name: author,
                reputation: 50,
                articleCount: 0,
                contributions: [],
                expertiseDomains: [],
                joinedAt: new Date().toISOString(),
                badges: []
            };

            this.journalists.set(id, journalist);
            this.stats.totalJournalists++;

            return journalist;
        }

        calculateImpact(article) {
            let impact = 0;
            if (article.views) impact += article.views * 0.01;
            if (article.shares) impact += article.shares * 0.5;
            return Math.min(impact, 100);
        }

        updateExpertise(journalist, category) {
            let domain = this.expertiseDomains.get(journalist.id) || {};
            domain[category] = (domain[category] || 0) + 1;
            this.expertiseDomains.set(journalist.id, domain);

            // Update journalist's top expertise domains
            journalist.expertiseDomains = Object.entries(domain)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cat]) => cat);
        }

        calculateReputation(journalist) {
            let reputation = 50; // Base

            // Article count bonus
            reputation += Math.min(journalist.articleCount * 2, 30);

            // Contributions quality
            const avgImpact = journalist.contributions
                .map(id => this.contributions.get(id))
                .reduce((sum, c) => sum + (c?.impact || 0), 0) / journalist.contributions.length || 0;

            reputation += avgImpact * 0.2;

            return Math.min(Math.round(reputation), 100);
        }

        updateStats() {
            const reps = Array.from(this.journalists.values()).map(j => j.reputation);
            this.stats.averageReputation = Math.round(
                reps.reduce((sum, r) => sum + r, 0) / reps.length || 0
            );
        }

        startMonitoring() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            if (window.SPORTIQ) {
                window.SPORTIQ.journalistStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer191-dashboard';
            dashboard.className = 'layer191-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer191-dashboard-header">
                    <h3>👤 Journalists</h3>
                    <button class="layer191-close-btn">×</button>
                </div>
                <div class="layer191-dashboard-content">
                    <div class="layer191-stat">
                        <span class="layer191-stat-label">Total:</span>
                        <span class="layer191-stat-value" id="layer191-total">0</span>
                    </div>
                    <div class="layer191-stat">
                        <span class="layer191-stat-label">Articles:</span>
                        <span class="layer191-stat-value" id="layer191-articles">0</span>
                    </div>
                    <div class="layer191-stat">
                        <span class="layer191-stat-label">Avg Reputation:</span>
                        <span class="layer191-stat-value" id="layer191-reputation">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer191-toggle-btn';
            toggleBtn.innerHTML = '👤';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer191-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer191-total');
            const articlesEl = document.getElementById('layer191-articles');
            const reputationEl = document.getElementById('layer191-reputation');

            if (totalEl) totalEl.textContent = this.stats.totalJournalists;
            if (articlesEl) articlesEl.textContent = this.stats.totalContributions;
            if (reputationEl) reputationEl.textContent = this.stats.averageReputation;
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initJournalistReputation);
    } else {
        initJournalistReputation();
    }

    function initJournalistReputation() {
        const reputation = new JournalistReputation();
        window.Layer191_JournalistReputation = reputation;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.journalistReputation = reputation;
        console.log('🎯 [Layer 191] Journalist Reputation - Ready');
    }

})();
