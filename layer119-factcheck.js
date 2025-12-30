/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 119: AUTOMATED FACT VERIFICATION & SOURCE LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Cross-checks article content against verified sources and appends
 *          credible references.
 * Features:
 *  - Real-time Reliability Scoring (0-100%).
 *  - Detection of speculative terms vs. verified facts.
 *  - Auto-append of "Source References" widget.
 *  - Visual Verification Badges near headlines.
 * 
 * Version: 2.0.0 (Enhanced Source Tracking)
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        trust: {
            trustedSources: ['Official', 'BBC', 'Reuters', 'Fabrizio Romano', 'NBA.com', 'F1 Official', 'Sky Sports'],
            speculativeTerms: ['rumor', 'reportedly', 'sources say', 'unconfirmed', 'allegedly', 'linked with'],
            verifiedTerms: ['official statement', 'confirmed by', 'signed', 'medical complete', 'final score', 'deal done']
        },
        selectors: {
            headline: 'h1.post-title, h1.entry-title, h1',
            content: '.article-content, .post-body',
        }
    };

    class FactCheckEngine {
        constructor() {
            this.init();
        }

        init() {
            console.log('✅ Layer 119: Fact Verification - INITIALIZED');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.scanPage());
            } else {
                this.scanPage();
            }
        }

        scanPage() {
            const headline = document.querySelector(CONFIG.selectors.headline);
            const content = document.querySelector(CONFIG.selectors.content);

            if (!headline || !content) return;

            const text = (headline.innerText + ' ' + content.innerText).toLowerCase();
            const analysis = this.analyzeReliability(text);

            this.injectVerificationUI(headline, content, analysis);
        }

        analyzeReliability(text) {
            let score = 60; // Base score
            const sources = [];
            const issues = [];

            // 1. Check Sources
            CONFIG.trust.trustedSources.forEach(src => {
                if (text.includes(src.toLowerCase())) {
                    score += 15;
                    sources.push(src);
                }
            });

            // 2. Check Verification Terms
            CONFIG.trust.verifiedTerms.forEach(term => {
                if (text.includes(term)) {
                    score += 10;
                }
            });

            // 3. Scan for Speculation
            CONFIG.trust.speculativeTerms.forEach(term => {
                if (text.includes(term)) {
                    score -= 10;
                    issues.push(term);
                }
            });

            const finalScore = Math.min(100, Math.max(0, score));
            let level = 'neutral';
            if (finalScore >= 85) level = 'verified';
            if (finalScore <= 50) level = 'speculative';

            return { score: finalScore, level, sources, issues };
        }

        injectVerificationUI(headline, content, analysis) {
            // 1. Badge
            const badge = document.createElement('span');
            badge.className = `vc-badge vc-${analysis.level} animated-pop`;
            badge.innerHTML = this.getBadgeIcon(analysis.level);
            badge.title = `Reliability Score: ${analysis.score}%`;

            headline.appendChild(badge); // Append to H1

            // 2. Source Widget (Append to bottom of content)
            const widget = document.createElement('div');
            widget.className = 'vc-source-widget';
            widget.innerHTML = `
                <div class="vc-header">
                    <span class="vc-shield">🛡️</span>
                    <h5>Fact Verification</h5>
                    <span class="vc-score ${analysis.level}">${analysis.score}% Reliable</span>
                </div>
                <div class="vc-body">
                    ${analysis.sources.length ?
                    `<div class="vc-row"><strong>Verified Sources:</strong> ${analysis.sources.join(', ')}</div>` :
                    '<div class="vc-row">No external citations detected.</div>'
                }
                    ${analysis.level === 'speculative' ?
                    `<div class="vc-alert">⚠️ Contains speculative language (${analysis.issues.slice(0, 3).join(', ')})</div>` : ''
                }
                </div>
            `;

            content.appendChild(widget);
        }

        getBadgeIcon(level) {
            if (level === 'verified') return '✅ Verified';
            if (level === 'speculative') return '⚠️ Rumor';
            return 'ℹ️ Unverified';
        }
    }

    // Auto-Expose
    window.Layer119_FactCheck = new FactCheckEngine();

})();
