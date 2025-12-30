/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 176 – LONG-TERM MEDIA INDEPENDENCE CORE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Safeguard editorial independence from external influence.
 * 
 * @version 1.0.0
 * @layer 176
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 176,
        name: 'Long-Term Media Independence Core',

        independenceThresholds: {
            externalInfluenceScore: 0.2, // Max 20% external influence
            editorialAutonomy: 0.8, // Min 80% autonomy
            financialIndependence: 0.7 // Min 70% financial independence
        },

        intervals: {
            independenceCheck: 30000,
            analyticsUpdate: 60000
        }
    };

    class MediaIndependence {
        constructor() {
            this.independenceMetrics = new Map();
            this.influenceLog = [];
            this.safeguards = new Map();
            this.config = null;
            this.stats = {
                independenceScore: 100,
                externalInfluenceDetected: 0,
                safeguardsActive: 0,
                editorialOverrides: 0
            };

            this.init();
        }

        async init() {
            console.log('🛡️ [Layer 176] Media Independence - Initializing...');

            try {
                await this.loadConfiguration();
                this.establishSafeguards();
                this.startIndependenceMonitoring();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 176] Media Independence - Active');
                this.logInfluence('SYSTEM', 'Media independence core initialized');

            } catch (error) {
                console.error('❌ [Layer 176] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer176-media-independence.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        establishSafeguards() {
            // Content independence safeguards
            this.addSafeguard({
                id: 'editorial-autonomy',
                name: 'Editorial Autonomy Protection',
                type: 'content',
                enabled: true,
                action: (content) => this.protectEditorialAutonomy(content)
            });

            // Financial independence safeguards
            this.addSafeguard({
                id: 'advertising-separation',
                name: 'Advertising-Editorial Separation',
                type: 'financial',
                enabled: true,
                action: (content) => this.enforceAdvertisingSeparation(content)
            });

            // Source independence safeguards
            this.addSafeguard({
                id: 'source-diversity',
                name: 'Source Diversity Enforcement',
                type: 'sources',
                enabled: true,
                action: (content) => this.ensureSourceDiversity(content)
            });

            // Political independence safeguards
            this.addSafeguard({
                id: 'political-neutrality',
                name: 'Political Neutrality Check',
                type: 'political',
                enabled: true,
                action: (content) => this.checkPoliticalNeutrality(content)
            });

            this.stats.safeguardsActive = this.safeguards.size;
            this.logInfluence('SAFEGUARDS', `${this.safeguards.size} independence safeguards established`);
        }

        addSafeguard(safeguard) {
            this.safeguards.set(safeguard.id, safeguard);
        }

        assessIndependence(content) {
            if (!content || !content.id) return null;

            try {
                const assessment = {
                    contentId: content.id,
                    timestamp: new Date().toISOString(),
                    scores: {},
                    violations: [],
                    status: 'independent'
                };

                // Run all safeguard checks
                this.safeguards.forEach((safeguard, id) => {
                    if (safeguard.enabled) {
                        const result = safeguard.action(content);
                        assessment.scores[id] = result.score;
                        if (result.violations) {
                            assessment.violations.push(...result.violations);
                        }
                    }
                });

                // Calculate overall independence score
                const scores = Object.values(assessment.scores);
                assessment.independenceScore = scores.reduce((a, b) => a + b, 0) / scores.length;

                // Determine status
                if (assessment.independenceScore < 60) {
                    assessment.status = 'compromised';
                    this.stats.externalInfluenceDetected++;
                } else if (assessment.independenceScore < 80) {
                    assessment.status = 'at-risk';
                }

                // Store assessment
                this.independenceMetrics.set(content.id, assessment);

                // Handle violations
                if (assessment.violations.length > 0) {
                    this.handleIndependenceViolations(content, assessment);
                }

                this.logInfluence('ASSESS', `Content "${content.title}" - Independence: ${assessment.independenceScore.toFixed(1)}%`);

                document.dispatchEvent(new CustomEvent('independence:assessed', {
                    detail: { content, assessment }
                }));

                return assessment;

            } catch (error) {
                console.error(`❌ [Layer 176] Assessment failed:`, error);
                return null;
            }
        }

        protectEditorialAutonomy(content) {
            const result = { score: 100, violations: [] };

            // Check for advertiser influence indicators
            const contentText = (content.content || '').toLowerCase();
            const sponsorKeywords = ['sponsored by', 'presented by', 'in partnership with', 'brought to you by'];

            sponsorKeywords.forEach(keyword => {
                if (contentText.includes(keyword)) {
                    // Check if properly disclosed
                    if (!contentText.includes('disclosure') && !contentText.includes('advertisement')) {
                        result.score -= 25;
                        result.violations.push({
                            type: 'editorial-autonomy',
                            severity: 'high',
                            message: 'Potential advertiser influence without proper disclosure'
                        });
                    }
                }
            });

            // Check for external pressure indicators
            const pressureIndicators = ['must publish', 'required to state', 'mandated coverage'];
            pressureIndicators.forEach(indicator => {
                if (contentText.includes(indicator)) {
                    result.score -= 20;
                    result.violations.push({
                        type: 'editorial-autonomy',
                        severity: 'critical',
                        message: 'Potential external editorial pressure detected'
                    });
                }
            });

            return result;
        }

        enforceAdvertisingSeparation(content) {
            const result = { score: 100, violations: [] };

            // Check if content is clearly labeled
            if (content.sponsored && !content.sponsoredDisclosure) {
                result.score -= 40;
                result.violations.push({
                    type: 'advertising-separation',
                    severity: 'critical',
                    message: 'Sponsored content lacks clear disclosure'
                });
            }

            // Check for advertiser mentions in editorial content
            if (!content.sponsored && content.content) {
                const brandMentions = this.detectBrandMentions(content.content);
                if (brandMentions.length > 3) {
                    result.score -= 15;
                    result.violations.push({
                        type: 'advertising-separation',
                        severity: 'medium',
                        message: `Excessive brand mentions (${brandMentions.length}) in editorial content`
                    });
                }
            }

            return result;
        }

        detectBrandMentions(text) {
            // Simple brand detection (can be enhanced)
            const brandPattern = /\b[A-Z][a-z]+\s+(Inc\.|Corp\.|LLC|Ltd\.)\b/g;
            return (text.match(brandPattern) || []);
        }

        ensureSourceDiversity(content) {
            const result = { score: 100, violations: [] };

            // Check for source diversity
            if (content.sources) {
                const uniqueSources = new Set(content.sources.map(s => s.organization || s.name));

                if (uniqueSources.size < 2) {
                    result.score -= 20;
                    result.violations.push({
                        type: 'source-diversity',
                        severity: 'medium',
                        message: 'Limited source diversity - only one source cited'
                    });
                }

                // Check for over-reliance on single source
                const sourceCounts = {};
                content.sources.forEach(source => {
                    const key = source.organization || source.name;
                    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
                });

                const maxCount = Math.max(...Object.values(sourceCounts));
                if (maxCount > content.sources.length * 0.7) {
                    result.score -= 15;
                    result.violations.push({
                        type: 'source-diversity',
                        severity: 'low',
                        message: 'Over-reliance on single source'
                    });
                }
            }

            return result;
        }

        checkPoliticalNeutrality(content) {
            const result = { score: 100, violations: [] };

            const contentText = (content.content || '').toLowerCase();

            // Check for political bias indicators
            const biasIndicators = {
                left: ['socialist', 'progressive agenda', 'liberal elite'],
                right: ['conservative values', 'traditional', 'patriotic duty']
            };

            let leftCount = 0;
            let rightCount = 0;

            biasIndicators.left.forEach(term => {
                if (contentText.includes(term)) leftCount++;
            });

            biasIndicators.right.forEach(term => {
                if (contentText.includes(term)) rightCount++;
            });

            const totalBias = leftCount + rightCount;
            if (totalBias > 2) {
                const imbalance = Math.abs(leftCount - rightCount);
                if (imbalance > 1) {
                    result.score -= 25;
                    result.violations.push({
                        type: 'political-neutrality',
                        severity: 'medium',
                        message: 'Potential political bias detected'
                    });
                }
            }

            return result;
        }

        handleIndependenceViolations(content, assessment) {
            const criticalViolations = assessment.violations.filter(v => v.severity === 'critical');

            if (criticalViolations.length > 0) {
                // Flag content for editorial review
                this.flagForReview(content, criticalViolations);

                // Notify governance layer
                if (window.Layer165_EditorialGovernance) {
                    window.Layer165_EditorialGovernance.handleIndependenceViolation(content.id, assessment);
                }

                // If Sovereign Media Control exists, escalate
                if (window.Layer180_SovereignControl) {
                    window.Layer180_SovereignControl.handleIndependenceCompromise(content.id, assessment);
                }
            }
        }

        flagForReview(content, violations) {
            document.dispatchEvent(new CustomEvent('independence:violation', {
                detail: {
                    contentId: content.id,
                    violations: violations,
                    action: 'flagged_for_review'
                }
            }));

            this.logInfluence('VIOLATION', `Content "${content.title}" flagged - ${violations.length} critical violation(s)`);
        }

        startIndependenceMonitoring() {
            console.log('🚀 [Layer 176] Starting independence monitoring...');

            setInterval(() => {
                this.monitorAllContent();
                this.updateIndependenceScore();
            }, CONFIG.intervals.independenceCheck);

            // Listen for new content
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.assessIndependence(event.detail.article);
                }
            });

            document.addEventListener('article:updated', (event) => {
                if (event.detail && event.detail.article) {
                    this.assessIndependence(event.detail.article);
                }
            });
        }

        monitorAllContent() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.independenceMetrics.has(article.id)) {
                            this.assessIndependence(article);
                        }
                    });
                }
            }
        }

        updateIndependenceScore() {
            const assessments = Array.from(this.independenceMetrics.values());

            if (assessments.length > 0) {
                const totalScore = assessments.reduce((sum, a) => sum + a.independenceScore, 0);
                this.stats.independenceScore = Math.round(totalScore / assessments.length);
            }
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.mediaIndependenceStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer176-dashboard';
            dashboard.className = 'layer176-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer176-dashboard-header">
                    <h3>🛡️ Media Independence</h3>
                    <button class="layer176-close-btn">×</button>
                </div>
                <div class="layer176-dashboard-content">
                    <div class="layer176-stat">
                        <span class="layer176-stat-label">Independence:</span>
                        <span class="layer176-stat-value" id="layer176-score">100%</span>
                    </div>
                    <div class="layer176-stat">
                        <span class="layer176-stat-label">Safeguards:</span>
                        <span class="layer176-stat-value" id="layer176-safeguards">0</span>
                    </div>
                    <div class="layer176-stat">
                        <span class="layer176-stat-label">Violations:</span>
                        <span class="layer176-stat-value" id="layer176-violations">0</span>
                    </div>
                    <div class="layer176-log" id="layer176-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer176-toggle-btn';
            toggleBtn.innerHTML = '🛡️';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer176-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const scoreEl = document.getElementById('layer176-score');
            const safeguardsEl = document.getElementById('layer176-safeguards');
            const violationsEl = document.getElementById('layer176-violations');

            if (scoreEl) scoreEl.textContent = `${this.stats.independenceScore}%`;
            if (safeguardsEl) safeguardsEl.textContent = this.stats.safeguardsActive;
            if (violationsEl) violationsEl.textContent = this.stats.externalInfluenceDetected;

            const logEl = document.getElementById('layer176-log');
            if (logEl && this.influenceLog.length > 0) {
                const recentLogs = this.influenceLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer176-log-entry">
                        <span class="layer176-log-type">${log.type}</span>
                        <span class="layer176-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logInfluence(type, message) {
            this.influenceLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.influenceLog.length > 100) this.influenceLog.shift();
        }

        getAssessment(contentId) {
            return this.independenceMetrics.get(contentId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMediaIndependence);
    } else {
        initMediaIndependence();
    }

    function initMediaIndependence() {
        const independence = new MediaIndependence();
        window.Layer176_MediaIndependence = independence;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.mediaIndependence = independence;
        document.dispatchEvent(new CustomEvent('layer176:ready', { detail: { independence } }));
        console.log('🎯 [Layer 176] Media Independence Core - Ready');
    }

})();
