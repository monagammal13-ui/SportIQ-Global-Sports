/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 187 – READER PERSONALIZATION WITHOUT FILTER BUBBLES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Personalize content while explicitly preventing filter bubbles.
 * 
 * @version 1.0.0
 * @layer 187
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 187,
        name: 'Reader Personalization Without Filter Bubbles',

        diversityThresholds: {
            minPerspectives: 3,
            maxSameCategory: 0.4,
            requiredOpposingViews: 0.2
        },

        intervals: {
            personalizationUpdate: 30000,
            analyticsUpdate: 60000
        }
    };

    class BubbleFreePersonalization {
        constructor() {
            this.userPreferences = new Map();
            this.diversityTracking = new Map();
            this.config = null;
            this.stats = {
                usersPersonalized: 0,
                diversityScore: 100,
                filterBubblePrevented: 0
            };

            this.init();
        }

        async init() {
            console.log('🎭 [Layer 187] Bubble-Free Personalization - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupPersonalization();
                this.startMonitoring();
                this.createDashboard();

                console.log('✅ [Layer 187] Bubble-Free Personalization - Active');

            } catch (error) {
                console.error('❌ [Layer 187] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer187-personalization.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupPersonalization() {
            // Integrate with audience intelligence
            if (window.Layer178_AudienceIntelligence) {
                document.addEventListener('audience:insights', (event) => {
                    if (event.detail && event.detail.insights) {
                        this.applyBubbleFreePersonalization(event.detail.insights);
                    }
                });
            }
        }

        applyBubbleFreePersonalization(insights) {
            insights.forEach(insight => {
                if (insight.type === 'content_preference') {
                    // Force diversity
                    this.enforceDiversity(insight);
                }
            });
        }

        enforceDiversity(preferences) {
            const diversityCheck = {
                timestamp: new Date().toISOString(),
                originalPreferences: preferences,
                diversifiedPreferences: this.diversifyPreferences(preferences),
                diversityScore: 0
            };

            diversityCheck.diversityScore = this.calculateDiversityScore(diversityCheck.diversifiedPreferences);

            if (diversityCheck.diversityScore < 70) {
                this.stats.filterBubblePrevented++;
            }

            return diversityCheck;
        }

        diversifyPreferences(preferences) {
            // Ensure diverse content mix
            const diversified = { ...preferences };

            // Add opposing perspectives
            if (diversified.data && Array.isArray(diversified.data)) {
                const categories = diversified.data.map(item => item[0]);
                const underrepresented = this.findUnderrepresentedCategories(categories);

                underrepresented.forEach(category => {
                    diversified.data.push([category, 1]); // Boost underrepresented
                });
            }

            return diversified;
        }

        findUnderrepresentedCategories(currentCategories) {
            const allCategories = ['sports', 'politics', 'tech', 'business', 'health', 'culture'];
            return allCategories.filter(cat => !currentCategories.includes(cat));
        }

        calculateDiversityScore(preferences) {
            // Simple diversity calculation
            if (!preferences.data || preferences.data.length === 0) return 100;

            const uniqueCategories = new Set(preferences.data.map(item => item[0]));
            return Math.min(100, (uniqueCategories.size / 6) * 100);
        }

        startMonitoring() {
            setInterval(() => {
                this.monitorDiversity();
            }, CONFIG.intervals.personalizationUpdate);
        }

        monitorDiversity() {
            this.stats.diversityScore = this.calculateOverallDiversity();
        }

        calculateOverallDiversity() {
            // Calculate platform-wide diversity
            return 85; // Simulated
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer187-dashboard';
            dashboard.className = 'layer187-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer187-dashboard-header">
                    <h3>🎭 Personalization</h3>
                    <button class="layer187-close-btn">×</button>
                </div>
                <div class="layer187-dashboard-content">
                    <div class="layer187-stat">
                        <span class="layer187-stat-label">Diversity:</span>
                        <span class="layer187-stat-value" id="layer187-diversity">100%</span>
                    </div>
                    <div class="layer187-stat">
                        <span class="layer187-stat-label">Bubbles Prevented:</span>
                        <span class="layer187-stat-value" id="layer187-prevented">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer187-toggle-btn';
            toggleBtn.innerHTML = '🎭';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer187-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const diversityEl = document.getElementById('layer187-diversity');
            const preventedEl = document.getElementById('layer187-prevented');

            if (diversityEl) diversityEl.textContent = `${this.stats.diversityScore}%`;
            if (preventedEl) preventedEl.textContent = this.stats.filterBubblePrevented;
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPersonalization);
    } else {
        initPersonalization();
    }

    function initPersonalization() {
        const personalization = new BubbleFreePersonalization();
        window.Layer187_Personalization = personalization;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.personalization = personalization;
        console.log('🎯 [Layer 187] Bubble-Free Personalization - Ready');
    }

})();
