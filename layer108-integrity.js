/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 108: CONTENT INTEGRITY & QUALITY CHECKER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Validates article quality, redundancy, grammar (basic), and readability.
 * Features: Flesch-Kincaid readability scoring, duplicate detection, and structural validation.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        checks: {
            minWordCount: 100,
            maxWordCount: 5000,
            similarityThreshold: 0.8 // 80% similarity = duplicate
        },
        events: {
            validationComplete: 'integrity:check-complete',
            validationFailed: 'integrity:check-failed'
        }
    };

    const state = {
        contentHistory: [] // Hashes of recent content to check duplicates
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INTEGRITY ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const IntegrityEngine = {
        initialize: function () {
            console.log('🛡️ [Integrity] Engine initialized');

            // Hook into content generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    const result = this.validateContent(e.detail.feed);
                    if (!result.passed) {
                        console.warn('⚠️ [Integrity] Validation issues found:', result.issues);
                    }
                }
            });
        },

        validateContent: function (feed) {
            const body = feed.main.body;
            const issues = [];

            // 1. Structural Checks
            if (!feed.main.headline) issues.push("Missing Headline");
            if (feed.main.body.length < CONFIG.checks.minWordCount) issues.push("Content too short");

            // 2. Readability Score
            const readability = this.calculateReadability(body);
            if (readability.grade > 14) issues.push("Content too complex (Grade " + readability.grade + ")");

            // 3. Duplicate Detection
            const hash = this.generateHash(body);
            if (this.isDuplicate(hash)) {
                issues.push("Duplicate content detected");
            } else {
                state.contentHistory.push(hash);
            }

            // 4. Basic Grammar/Style (Rule-based)
            const grammarIssues = this.checkGrammar(body);
            issues.push(...grammarIssues);

            const result = {
                passed: issues.length === 0,
                score: Math.max(0, 100 - (issues.length * 10)),
                readability: readability,
                issues: issues
            };

            this.notifyValidation(feed.id, result);
            return result;
        },

        calculateReadability: function (text) {
            // Approximation of Flesch-Kincaid
            const sentences = text.split(/[.!?]+/).length;
            const words = text.split(/\s+/).length;
            const syllables = text.split(/[aeiouy]+/).length; // Very rough approximation

            const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
            const grade = (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59;

            return {
                score: Math.round(score),
                grade: Math.round(grade),
                level: score > 60 ? 'Standard' : score > 30 ? 'Difficult' : 'Very Difficult'
            };
        },

        checkGrammar: function (text) {
            const issues = [];
            // Catch common formatting errors
            if (text.includes("  ")) issues.push("Double spaces found");
            if (text.match(/[a-z]\.[A-Z]/)) issues.push("Missing space after period");
            if (text.match(/\s[,.]/)) issues.push("Space before punctuation");

            // Check capitalization of brand names (example)
            if (text.includes("iphone")) issues.push("Brand capitalization (iPhone)");
            if (text.includes("english")) issues.push("Language capitalization (English)");

            return issues;
        },

        isDuplicate: function (hash) {
            return state.contentHistory.includes(hash);
        },

        generateHash: function (str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            return hash;
        },

        notifyValidation: function (contentId, result) {
            document.dispatchEvent(new CustomEvent(CONFIG.events.validationComplete, {
                detail: { contentId, result }
            }));

            // Render result if dashboard is active
            IntegrityRenderer.updateStatus(result);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const IntegrityRenderer = {
        renderDashboard: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="integrity-panel">
                    <h3>Content Quality Check</h3>
                    <div id="integrity-status" class="integrity-result waiting">
                        Waiting for content...
                    </div>
                </div>
            `;
        },

        updateStatus: function (result) {
            const el = document.getElementById('integrity-status');
            if (!el) return;

            const statusClass = result.passed ? 'passed' : result.score > 70 ? 'warning' : 'failed';

            el.className = `integrity-result ${statusClass}`;
            el.innerHTML = `
                <div class="result-header">
                    <span class="score-circle">${result.score}</span>
                    <span class="status-text">${result.passed ? 'Excellent Quality' : 'Needs Attention'}</span>
                </div>
                
                <div class="readability-stats">
                    <div class="stat">
                        <label>Readability</label>
                        <span>${result.readability.level} (${result.readability.score})</span>
                    </div>
                    <div class="stat">
                        <label>Est. Grade</label>
                        <span>${result.readability.grade}</span>
                    </div>
                </div>

                ${result.issues.length > 0 ? `
                    <div class="issues-list">
                        <h4>Identified Issues:</h4>
                        <ul>
                            ${result.issues.map(i => `<li>${i}</li>`).join('')}
                        </ul>
                    </div>
                ` : '<div class="no-issues">No issues detected. Ready to publish.</div>'}
            `;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.ContentIntegrity = {
        init: IntegrityEngine.initialize.bind(IntegrityEngine),
        check: IntegrityEngine.validateContent.bind(IntegrityEngine),
        render: IntegrityRenderer.renderDashboard.bind(IntegrityRenderer)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => IntegrityEngine.initialize());
    } else {
        IntegrityEngine.initialize();
    }

})();
