/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 179 – ETHICAL AI OVERSIGHT LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Ensure AI-generated content aligns with ethical journalism standards.
 * 
 * @version 1.0.0
 * @layer 179
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 179,
        name: 'Ethical AI Oversight Layer',

        ethicalPrinciples: ['accuracy', 'fairness', 'transparency', 'accountability', 'privacy'],

        intervals: {
            oversightCheck: 15000,
            analyticsUpdate: 60000
        }
    };

    class EthicalAIOversight {
        constructor() {
            this.aiContent = new Map();
            this.ethicalReviews = new Map();
            this.oversightLog = [];
            this.config = null;
            this.stats = {
                totalAIContent: 0,
                ethicalCompliance: 100,
                flaggedContent: 0,
                humanReviewRequired: 0
            };

            this.init();
        }

        async init() {
            console.log('🤖 [Layer 179] Ethical AI Oversight - Initializing...');

            try {
                await this.loadConfiguration();
                this.establishEthicalGuidelines();
                this.startOversight();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 179] Ethical AI Oversight - Active');
                this.logOversight('SYSTEM', 'Ethical AI oversight initialized');

            } catch (error) {
                console.error('❌ [Layer 179] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer179-ethical-ai.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        establishEthicalGuidelines() {
            this.guidelines = {
                accuracy: {
                    name: 'Accuracy & Truthfulness',
                    checks: ['fact_verification', 'source_citing', 'claim_substantiation']
                },
                fairness: {
                    name: 'Fairness & Bias Prevention',
                    checks: ['bias_detection', 'representation_balance', 'stereotype_avoidance']
                },
                transparency: {
                    name: 'Transparency & Disclosure',
                    checks: ['ai_disclosure', 'methodology_clarity', 'limitations_acknowledgment']
                },
                accountability: {
                    name: 'Accountability & Responsibility',
                    checks: ['human_oversight', 'error_correction', 'feedback_mechanism']
                },
                privacy: {
                    name: 'Privacy & Data Protection',
                    checks: ['data_anonymization', 'consent_verification', 'sensitive_info_redaction']
                }
            };

            this.logOversight('GUIDELINES', '5 ethical principles established');
        }

        reviewAIContent(content) {
            if (!content || !content.id) return null;

            // Check if content is AI-generated
            if (!content.aiGenerated && !content.aiAssisted) {
                return null; // Not AI content, skip review
            }

            try {
                const review = {
                    contentId: content.id,
                    timestamp: new Date().toISOString(),
                    aiType: content.aiGenerated ? 'fully_generated' : 'ai_assisted',
                    scores: {},
                    violations: [],
                    status: 'approved'
                };

                // Run ethical checks
                review.scores.accuracy = this.checkAccuracy(content);
                review.scores.fairness = this.checkFairness(content);
                review.scores.transparency = this.checkTransparency(content);
                review.scores.accountability = this.checkAccountability(content);
                review.scores.privacy = this.checkPrivacy(content);

                // Calculate overall compliance
                const scores = Object.values(review.scores);
                review.complianceScore = scores.reduce((a, b) => a + b.score, 0) / scores.length;

                // Collect violations
                scores.forEach(check => {
                    if (check.violations) {
                        review.violations.push(...check.violations);
                    }
                });

                // Determine review status
                if (review.complianceScore < 60) {
                    review.status = 'rejected';
                    this.stats.flaggedContent++;
                } else if (review.complianceScore < 80 || review.violations.length > 0) {
                    review.status = 'requires_human_review';
                    this.stats.humanReviewRequired++;
                }

                // Store review
                this.ethicalReviews.set(content.id, review);
                this.aiContent.set(content.id, content);
                this.stats.totalAIContent++;

                // Handle violations
                if (review.violations.length > 0) {
                    this.handleEthicalViolations(content, review);
                }

                this.logOversight('REVIEW', `AI content "${content.title}" - Compliance: ${review.complianceScore.toFixed(1)}%`);

                document.dispatchEvent(new CustomEvent('ai:reviewed', {
                    detail: { content, review }
                }));

                return review;

            } catch (error) {
                console.error(`❌ [Layer 179] AI review failed:`, error);
                return null;
            }
        }

        checkAccuracy(content) {
            const result = { score: 100, violations: [] };

            // Check for AI disclosure
            if (!content.aiDisclosure) {
                result.score -= 30;
                result.violations.push({
                    principle: 'accuracy',
                    check: 'ai_disclosure',
                    severity: 'high',
                    message: 'AI-generated content must be clearly disclosed'
                });
            }

            // Check for source citations
            if (!content.sources || content.sources.length === 0) {
                result.score -= 25;
                result.violations.push({
                    principle: 'accuracy',
                    check: 'source_citing',
                    severity: 'high',
                    message: 'AI content must cite sources for claims'
                });
            }

            // Check for unsubstantiated claims
            const contentText = (content.content || '').toLowerCase();
            const claimIndicators = ['according to', 'studies show', 'experts say', 'research indicates'];
            let unsupportedClaims = 0;

            claimIndicators.forEach(indicator => {
                if (contentText.includes(indicator) && (!content.sources || content.sources.length < 2)) {
                    unsupportedClaims++;
                }
            });

            if (unsupportedClaims > 0) {
                result.score -= 15;
                result.violations.push({
                    principle: 'accuracy',
                    check: 'claim_substantiation',
                    severity: 'medium',
                    message: 'Claims require proper source substantiation'
                });
            }

            return result;
        }

        checkFairness(content) {
            const result = { score: 100, violations: [] };

            // Check for bias indicators
            const biasPatterns = this.detectBiasPatterns(content.content || '');

            if (biasPatterns.length > 2) {
                result.score -= 20;
                result.violations.push({
                    principle: 'fairness',
                    check: 'bias_detection',
                    severity: 'high',
                    message: `${biasPatterns.length} potential bias patterns detected`
                });
            }

            // Check for balanced representation
            if (content.sources && content.sources.length > 0) {
                const perspectives = new Set(content.sources.map(s => s.affiliation || s.perspective));
                if (perspectives.size < 2 && content.contentType === 'opinion') {
                    result.score -= 15;
                    result.violations.push({
                        principle: 'fairness',
                        check: 'representation_balance',
                        severity: 'medium',
                        message: 'Opinion pieces should include multiple perspectives'
                    });
                }
            }

            return result;
        }

        detectBiasPatterns(text) {
            const patterns = [];
            const lowerText = text.toLowerCase();

            // Gender bias
            if (lowerText.match(/\b(he|him)\b/g)?.length > (lowerText.match(/\b(she|her)\b/g)?.length || 0) * 2) {
                patterns.push('gender_bias');
            }

            // Loaded language
            const loadedTerms = ['always', 'never', 'obviously', 'clearly', 'undoubtedly'];
            loadedTerms.forEach(term => {
                if (lowerText.includes(term)) {
                    patterns.push('loaded_language');
                }
            });

            return patterns;
        }

        checkTransparency(content) {
            const result = { score: 100, violations: [] };

            // Check for AI disclosure
            const contentText = (content.content || '').toLowerCase();
            const hasDisclosure = contentText.includes('ai-generated') ||
                contentText.includes('artificial intelligence') ||
                contentText.includes('automated content') ||
                content.aiDisclosure === true;

            if (!hasDisclosure) {
                result.score -= 40;
                result.violations.push({
                    principle: 'transparency',
                    check: 'ai_disclosure',
                    severity: 'critical',
                    message: 'AI involvement must be clearly disclosed to readers'
                });
            }

            // Check for methodology clarity
            if (content.aiGenerated && !content.aiMethodology) {
                result.score -= 20;
                result.violations.push({
                    principle: 'transparency',
                    check: 'methodology_clarity',
                    severity: 'medium',
                    message: 'AI generation methodology should be explained'
                });
            }

            // Check for limitations acknowledgment
            if (content.aiGenerated && !contentText.includes('limitation')) {
                result.score -= 10;
                result.violations.push({
                    principle: 'transparency',
                    check: 'limitations_acknowledgment',
                    severity: 'low',
                    message: 'AI content should acknowledge potential limitations'
                });
            }

            return result;
        }

        checkAccountability(content) {
            const result = { score: 100, violations: [] };

            // Check for human oversight
            if (!content.humanReviewed && content.aiGenerated) {
                result.score -= 35;
                result.violations.push({
                    principle: 'accountability',
                    check: 'human_oversight',
                    severity: 'critical',
                    message: 'AI-generated content requires human editorial review'
                });
            }

            // Check for responsible party
            if (!content.author && !content.editor) {
                result.score -= 25;
                result.violations.push({
                    principle: 'accountability',
                    check: 'responsibility',
                    severity: 'high',
                    message: 'Content must have accountable human responsible party'
                });
            }

            return result;
        }

        checkPrivacy(content) {
            const result = { score: 100, violations: [] };

            const contentText = content.content || '';

            // Check for personal identifiable information (PII)
            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

            if (emailPattern.test(contentText) || phonePattern.test(contentText)) {
                result.score -= 30;
                result.violations.push({
                    principle: 'privacy',
                    check: 'sensitive_info_redaction',
                    severity: 'critical',
                    message: 'Personal information must be redacted'
                });
            }

            return result;
        }

        handleEthicalViolations(content, review) {
            const criticalViolations = review.violations.filter(v => v.severity === 'critical');

            if (criticalViolations.length > 0) {
                // Block content publication
                this.blockContent(content, criticalViolations);

                // Escalate to governance
                if (window.Layer165_EditorialGovernance) {
                    window.Layer165_EditorialGovernance.handleAIEthicsViolation(content.id, review);
                }

                // Escalate to sovereign control
                if (window.Layer180_SovereignControl) {
                    window.Layer180_SovereignControl.handleEthicalViolation(content.id, review);
                }
            }
        }

        blockContent(content, violations) {
            document.dispatchEvent(new CustomEvent('ai:blocked', {
                detail: {
                    contentId: content.id,
                    violations: violations,
                    action: 'blocked_publication'
                }
            }));

            this.logOversight('BLOCK', `AI content "${content.title}" blocked - ${violations.length} critical violation(s)`);
        }

        startOversight() {
            console.log('🚀 [Layer 179] Starting AI oversight...');

            setInterval(() => {
                this.monitorAIContent();
                this.updateComplianceScore();
            }, CONFIG.intervals.oversightCheck);

            // Listen for AI-generated content
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.reviewAIContent(event.detail.article);
                }
            });

            document.addEventListener('article:generated', (event) => {
                if (event.detail && event.detail.article) {
                    this.reviewAIContent(event.detail.article);
                }
            });
        }

        monitorAIContent() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if ((article.aiGenerated || article.aiAssisted) && !this.ethicalReviews.has(article.id)) {
                            this.reviewAIContent(article);
                        }
                    });
                }
            }
        }

        updateComplianceScore() {
            const reviews = Array.from(this.ethicalReviews.values());

            if (reviews.length > 0) {
                const totalCompliance = reviews.reduce((sum, r) => sum + r.complianceScore, 0);
                this.stats.ethicalCompliance = Math.round(totalCompliance / reviews.length);
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
                window.SPORTIQ.ethicalAIStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer179-dashboard';
            dashboard.className = 'layer179-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer179-dashboard-header">
                    <h3>🤖 Ethical AI Oversight</h3>
                    <button class="layer179-close-btn">×</button>
                </div>
                <div class="layer179-dashboard-content">
                    <div class="layer179-stat">
                        <span class="layer179-stat-label">AI Content:</span>
                        <span class="layer179-stat-value" id="layer179-total">0</span>
                    </div>
                    <div class="layer179-stat">
                        <span class="layer179-stat-label">Compliance:</span>
                        <span class="layer179-stat-value" id="layer179-compliance">100%</span>
                    </div>
                    <div class="layer179-stat">
                        <span class="layer179-stat-label">Flagged:</span>
                        <span class="layer179-stat-value" id="layer179-flagged">0</span>
                    </div>
                    <div class="layer179-log" id="layer179-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer179-toggle-btn';
            toggleBtn.innerHTML = '🤖';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer179-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer179-total');
            const complianceEl = document.getElementById('layer179-compliance');
            const flaggedEl = document.getElementById('layer179-flagged');

            if (totalEl) totalEl.textContent = this.stats.totalAIContent;
            if (complianceEl) complianceEl.textContent = `${this.stats.ethicalCompliance}%`;
            if (flaggedEl) flaggedEl.textContent = this.stats.flaggedContent;

            const logEl = document.getElementById('layer179-log');
            if (logEl && this.oversightLog.length > 0) {
                const recentLogs = this.oversightLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer179-log-entry">
                        <span class="layer179-log-type">${log.type}</span>
                        <span class="layer179-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logOversight(type, message) {
            this.oversightLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.oversightLog.length > 100) this.oversightLog.shift();
        }

        getReview(contentId) {
            return this.ethicalReviews.get(contentId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEthicalAI);
    } else {
        initEthicalAI();
    }

    function initEthicalAI() {
        const oversight = new EthicalAIOversight();
        window.Layer179_EthicalAI = oversight;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.ethicalAI = oversight;
        document.dispatchEvent(new CustomEvent('layer179:ready', { detail: { oversight } }));
        console.log('🎯 [Layer 179] Ethical AI Oversight - Ready');
    }

})();
