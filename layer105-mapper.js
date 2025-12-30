/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 105: SECTION MAPPING INTELLIGENCE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Analyzes content context to map articles to precise website sections.
 * Features: Keyword scoring, multi-section tagging, and SEO path generation.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        mapping: {
            configPath: '../api-json/mapping-rules.json',
            minScore: 5 // Min keyword score to assign a category
        },
        events: {
            mapped: 'mapper:content-mapped'
        }
    };

    const state = {
        rules: null, // Loaded from JSON
        taxonomy: new Map() // Normalized category map
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MAPPING ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const MappingEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.mapping.configPath);
                if (response.ok) {
                    state.rules = await response.json();
                    this.buildTaxonomy();
                }
            } catch (error) {
                console.warn('⚠️ [Mapper] Failed to load rules');
            }

            console.log('🗺️ [Mapper] Engine initialized');
        },

        buildTaxonomy: function () {
            if (!state.rules || !state.rules.categories) return;
            state.rules.categories.forEach(cat => {
                state.taxonomy.set(cat.id, cat);
            });
        },

        analyzeAndMap: function (content) {
            const text = (content.headline + ' ' + content.body).toLowerCase();
            const results = [];

            // 1. Scoring Loop
            state.taxonomy.forEach((category, id) => {
                let score = 0;

                // Check primary keywords (5 points)
                category.keywords.primary.forEach(kw => {
                    if (text.includes(kw.toLowerCase())) score += 5;
                });

                // Check secondary keywords (1 point)
                category.keywords.secondary.forEach(kw => {
                    if (text.includes(kw.toLowerCase())) score += 1;
                });

                if (score >= CONFIG.mapping.minScore) {
                    results.push({
                        id: id,
                        name: category.name,
                        path: category.path,
                        score: score,
                        isPrimary: false
                    });
                }
            });

            // 2. Determine Primary
            if (results.length > 0) {
                results.sort((a, b) => b.score - a.score);
                results[0].isPrimary = true;
            } else {
                // Fallback
                results.push({
                    id: 'general',
                    name: 'General News',
                    path: '/general',
                    score: 0,
                    isPrimary: true
                });
            }

            console.log(`🗺️ [Mapper] Mapped to: ${results.map(r => r.name).join(', ')}`);

            this.notifyMapping(content.id, results);
            return results;
        },

        notifyMapping: function (contentId, mapping) {
            document.dispatchEvent(new CustomEvent(CONFIG.events.mapped, {
                detail: { contentId, mapping }
            }));
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER (DIAGNOSTICS)
    // ═══════════════════════════════════════════════════════════════════════

    const MapperRenderer = {
        renderDiagnostics: function (containerId, mappingResults) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="mapper-panel">
                    <h3>Section Mapping Analysis</h3>
                    <div class="mapping-results">
                        ${mappingResults.map(res => `
                            <div class="map-item ${res.isPrimary ? 'primary' : ''}">
                                <div class="map-score">${res.score}</div>
                                <div class="map-details">
                                    <span class="map-name">${res.name}</span>
                                    <span class="map-path">${res.path}</span>
                                </div>
                                ${res.isPrimary ? '<span class="primary-badge">PRIMARY</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.SectionMapper = {
        init: MappingEngine.initialize.bind(MappingEngine),
        map: MappingEngine.analyzeAndMap.bind(MappingEngine),
        render: MapperRenderer.renderDiagnostics.bind(MapperRenderer),

        // Helper to integrate with previous layers
        autoMapFeed: (feed) => {
            const mapping = MappingEngine.analyzeAndMap(feed.main);
            feed.mapping = mapping; // Augment feed object
            return feed;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MappingEngine.initialize());
    } else {
        MappingEngine.initialize();
    }

})();
