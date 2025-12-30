/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 111: ADVANCED TOPIC CATEGORIZATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Deep recursive topic analysis for precise sub-categorization.
 * Features: Hierarchical topic tree, weighted keyword scoring, and multi-parent tagging.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        taxonomy: {
            configPath: '../api-json/topic-taxonomy.json',
            minConfidence: 0.6
        },
        events: {
            categorized: 'topics:categorized'
        }
    };

    const state = {
        tree: null // Topic Hierarchy
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORIZATION ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const TopicEngine = {
        initialize: async function () {
            try {
                const response = await fetch(CONFIG.taxonomy.configPath);
                if (response.ok) {
                    state.tree = await response.json();
                    console.log('🏷️ [Topics] Taxonomy loaded');
                }
            } catch (error) {
                console.warn('⚠️ [Topics] Failed to load taxonomy');
            }

            // Listen for content generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.assignTopics(e.detail.feed);
                }
            });
        },

        assignTopics: function (feed) {
            console.log(`🏷️ [Topics] Analyzing: ${feed.main.headline}`);
            const text = (feed.main.headline + ' ' + feed.main.body).toLowerCase();

            const matches = [];
            this.traverseTree(state.tree, text, matches);

            // Sort by depth (specificity) and score
            matches.sort((a, b) => b.depth - a.depth || b.score - a.score);

            // Pick Top 3
            const topTopics = matches.slice(0, 3);

            // Augment feed
            feed.topics = topTopics;

            console.log('🏷️ [Topics] Assigned:', topTopics.map(t => t.name).join(', '));

            // Notify
            this.notifyCategorization(feed.id, topTopics);

            // Render Tags in UI
            this.renderTags(topTopics);

            return topTopics;
        },

        traverseTree: function (nodes, text, matches, depth = 0, path = []) {
            if (!nodes) return;

            nodes.forEach(node => {
                const score = this.calculateScore(node, text);

                if (score >= CONFIG.taxonomy.minConfidence) {
                    matches.push({
                        id: node.id,
                        name: node.name,
                        path: [...path, node.name],
                        depth: depth,
                        score: score
                    });

                    // Recurse into children
                    if (node.children) {
                        this.traverseTree(node.children, text, matches, depth + 1, [...path, node.name]);
                    }
                }
            });
        },

        calculateScore: function (node, text) {
            let hits = 0;
            // Keywords check
            if (node.keywords) {
                node.keywords.forEach(kw => {
                    if (text.includes(kw.toLowerCase())) hits++;
                });
            }
            // Simple normalization (hits / keyword_count could be better, but hits works for demo)
            return hits > 0 ? Math.min(1.0, 0.5 + (hits * 0.1)) : 0;
        },

        notifyCategorization: function (contentId, topics) {
            document.dispatchEvent(new CustomEvent(CONFIG.events.categorized, {
                detail: { contentId, topics }
            }));
        },

        renderTags: function (topics) {
            const container = document.getElementById('article-tags-container');
            if (container) {
                container.innerHTML = topics.map(t => `
                    <span class="topic-tag depth-${t.depth}" title="${t.path.join(' > ')}">
                        ${t.name}
                    </span>
                `).join('');
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER (HIERARCHY VISUALIZER)
    // ═══════════════════════════════════════════════════════════════════════

    const TopicRenderer = {
        renderTree: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container || !state.tree) return;

            container.innerHTML = `
                <div class="taxonomy-browser">
                    <h3>Topic Taxonomy</h3>
                    ${this.buildHtmlTree(state.tree)}
                </div>
            `;
        },

        buildHtmlTree: function (nodes) {
            let html = `<ul class="topic-tree">`;
            nodes.forEach(node => {
                html += `
                    <li>
                        <span class="topic-node">${node.name}</span>
                        ${node.children ? this.buildHtmlTree(node.children) : ''}
                    </li>
                `;
            });
            html += `</ul>`;
            return html;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.TopicCategorizer = {
        init: TopicEngine.initialize.bind(TopicEngine),
        categorize: TopicEngine.assignTopics.bind(TopicEngine),
        renderTree: TopicRenderer.renderTree.bind(TopicRenderer)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TopicEngine.initialize());
    } else {
        TopicEngine.initialize();
    }

})();
