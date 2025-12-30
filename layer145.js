/**
 * Layer 145: Personalization Runtime Engine
 * Adapts the UI/UX layout and content density based on User Profile and Segments.
 * 
 * Responsibilities:
 * - Listens for User Profile updates.
 * - Modifies DOM to suit user segments (e.g. "Data Saver", "Power User", "Casual").
 * - Injects/Reorders content based on relevance.
 * - Applies A/B testing variations if configured.
 */
export class SportIQPersonalizationEngine {
    constructor() {
        this.id = 'layer-145';
        this.name = 'Personalization Runtime Engine';
        this.version = '2.0.0';
        this.initialized = false;

        this.currentSegments = [];
        this.uiConfig = {
            "Football Fanatic": { highlightColor: "#e74c3c", heroSection: "football" },
            "Analyst": { showStats: true, density: "compact" },
            "Visual Learner": { mediaSize: "large" }
        };
    }

    async init() {
        if (this.initialized) return;
        console.log(`🎨 Initializing ${this.name}...`);

        await this.loadConfig();
        this.bindEvents();

        this.initialized = true;

        // Register
        if (window.RuntimeOrchestrator) {
            window.RuntimeOrchestrator.registerLayer(this);
        }
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer145.json');
            if (res.ok) {
                const json = await res.json();
                this.uiConfig = { ...this.uiConfig, ...json.segmentRules };
                console.log('🎨 Personalization Config Loaded');
            }
        } catch (e) {
            console.warn('Using default personalized config');
        }
    }

    bindEvents() {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('profile:updated', (profile) => {
                this.adaptUI(profile);
            });

            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('recommendations:ready', (data) => {
                this.injectRecommendations(data);
            });
        }
    }

    adaptUI(profile) {
        if (!window.Layer140_UserProfiling) return;

        // 1. Get Segments
        const segments = window.Layer140_UserProfiling.getSegments();
        this.currentSegments = segments;

        console.log('🎨 Adapting UI for segments:', segments);
        const body = document.body;

        // 2. Apply Segment Classes
        // Reset old segment classes first (if we tracked them, simpler to just add new ones for now)
        segments.forEach(seg => {
            const safeClass = 'segment-' + seg.toLowerCase().replace(/\s+/g, '-');
            if (!body.classList.contains(safeClass)) {
                body.classList.add(safeClass);
            }

            // Apply Rules
            const rules = this.uiConfig[seg];
            if (rules) {
                if (rules.density === 'compact') body.classList.add('ui-density-compact');
                if (rules.mediaSize === 'large') body.classList.add('ui-media-large');
            }
        });

        // 3. Dynamic Section Reordering
        // If user loves Football, move Football section to top
        if (profile.interestVector && profile.interestVector['football'] > 10) {
            this.prioritizeSection('section-football');
        }
    }

    prioritizeSection(sectionId) {
        const section = document.getElementById(sectionId);
        const container = document.querySelector('main') || document.body;

        if (section && container) {
            // Move to top of main container
            container.prepend(section);
            console.log(`🎨 Moved ${sectionId} to top based on persistence.`);
        }
    }

    injectRecommendations(data) {
        // data.top is list of recommended articles
        const container = document.getElementById('recommended-for-you');
        if (!container) return; // Only populate if slot exists

        const articles = data.top;
        if (!articles || articles.length === 0) return;

        container.innerHTML = '<h3>Recommended For You</h3>';
        const list = document.createElement('div');
        list.className = 'rec-feed-grid';

        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'rec-card';
            card.innerHTML = `
                <h4>${article.title}</h4>
                <span class="score-badge">Match: ${Math.round(article.relevanceScore * 10)}%</span>
            `;
            list.appendChild(card);
        });

        container.appendChild(list);
        container.style.display = 'block';
    }

    /**
     * Public API
     */
    getCurrentLayoutMode() {
        return this.currentSegments.includes('Analyst') ? 'compact' : 'standard';
    }
}

// Runtime Execution
window.Layer145_Personalization = new SportIQPersonalizationEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer145_Personalization.init());
} else {
    window.Layer145_Personalization.init();
}
