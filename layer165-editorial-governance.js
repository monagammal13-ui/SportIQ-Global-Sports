/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 165 – AUTONOMOUS EDITORIAL GOVERNANCE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Enforce editorial policies automatically without manual intervention.
 * 
 * @version 1.0.0
 * @layer 165
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 165,
        name: 'Autonomous Editorial Governance',

        policies: {
            minimumQuality: 70,
            minimumTrust: 0.6,
            minimumEvidence: 60,
            maximumBias: 0.4,
            maximumDisinfoRisk: 0.5
        },

        violationTypes: {
            quality: 'Quality Standards Violation',
            trust: 'Trust Threshold Not Met',
            evidence: 'Insufficient Evidence',
            bias: 'Excessive Bias Detected',
            disinformation: 'Disinformation Risk',
            viral: 'Viral Manipulation Detected'
        },

        actions: {
            approve: 'Auto-Approve',
            review: 'Manual Review Required',
            reject: 'Auto-Reject',
            quarantine: 'Quarantine'
        },

        intervals: {
            complianceCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class AutonomousEditorialGovernance {
        constructor() {
            this.articleDecisions = new Map();
            this.violations = [];
            this.auditTrail = [];
            this.config = null;
            this.stats = {
                totalReviewed: 0,
                autoApproved: 0,
                manualReview: 0,
                autoRejected: 0,
                quarantined: 0,
                violations: 0
            };

            this.init();
        }

        async init() {
            console.log('⚖️ [Layer 165] Autonomous Editorial Governance - Initializing...');

            try {
                await this.loadConfiguration();
                this.startComplianceEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 165] Autonomous Editorial Governance - Active');
                this.logAudit('SYSTEM', 'Governance system initialized');

            } catch (error) {
                console.error('❌ [Layer 165] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer165-editorial-governance.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        reviewArticle(article) {
            if (!article || !article.id) return null;

            try {
                const decision = {
                    articleId: article.id,
                    compliant: true,
                    violations: [],
                    action: null,
                    scores: {},
                    timestamp: new Date().toISOString()
                };

                // Check all compliance criteria
                decision.scores = this.checkCompliance(article);

                // Detect violations
                decision.violations = this.detectViolations(decision.scores);

                // Determine action
                decision.action = this.determineAction(decision);

                // Update compliance status
                decision.compliant = decision.violations.length === 0;

                // Store decision
                this.articleDecisions.set(article.id, decision);
                this.stats.totalReviewed++;
                this.updateStats(decision.action);

                // Execute action
                this.executeAction(article, decision);

                // Log audit trail
                this.logAudit('DECISION', `Article "${article.title}" - Action: ${decision.action} (${decision.violations.length} violations)`);

                document.dispatchEvent(new CustomEvent('article:governance-reviewed', {
                    detail: { article, decision }
                }));

                return decision;

            } catch (error) {
                console.error(`❌ [Layer 165] Review failed for article ${article.id}:`, error);
                return null;
            }
        }

        checkCompliance(article) {
            const scores = {
                quality: 0,
                trust: 0,
                evidence: 0,
                bias: 1,
                disinfoRisk: 0
            };

            // Check quality (Layer 153)
            if (window.Layer153_QualityValidator) {
                const validation = window.Layer153_QualityValidator.getValidation(article.id);
                if (validation) {
                    scores.quality = validation.qualityScore;
                }
            }

            // Check trust (Layer 159)
            if (window.Layer159_TrustSignals) {
                const trustData = window.Layer159_TrustSignals.getTrustData(article.id);
                if (trustData) {
                    scores.trust = trustData.trustScore;
                }
            }

            // Check evidence (Layer 161)
            if (window.Layer161_EvidenceScoring) {
                const evidenceData = window.Layer161_EvidenceScoring.getEvidenceScore(article.id);
                if (evidenceData) {
                    scores.evidence = evidenceData.evidenceScore;
                }
            }

            // Check bias (Layer 162)
            if (window.Layer162_BiasDetection) {
                const biasData = window.Layer162_BiasDetection.getAnalysis(article.id);
                if (biasData) {
                    scores.bias = biasData.balanceScore;
                }
            }

            // Check disinformation risk (Layer 163)
            if (window.Layer163_AntiDisinfo) {
                const checkData = window.Layer163_AntiDisinfo.getCheck(article.id);
                if (checkData) {
                    scores.disinfoRisk = checkData.riskScore;
                }
            }

            return scores;
        }

        detectViolations(scores) {
            const violations = [];

            if (scores.quality < CONFIG.policies.minimumQuality) {
                violations.push({
                    type: 'quality',
                    severity: 'high',
                    message: `Quality score ${scores.quality.toFixed(1)} below minimum ${CONFIG.policies.minimumQuality}`,
                    value: scores.quality
                });
            }

            if (scores.trust < CONFIG.policies.minimumTrust) {
                violations.push({
                    type: 'trust',
                    severity: 'high',
                    message: `Trust score ${(scores.trust * 100).toFixed(1)}% below minimum ${CONFIG.policies.minimumTrust * 100}%`,
                    value: scores.trust
                });
            }

            if (scores.evidence < CONFIG.policies.minimumEvidence) {
                violations.push({
                    type: 'evidence',
                    severity: 'medium',
                    message: `Evidence score ${scores.evidence.toFixed(1)} below minimum ${CONFIG.policies.minimumEvidence}`,
                    value: scores.evidence
                });
            }

            if (scores.bias < CONFIG.policies.maximumBias) {
                violations.push({
                    type: 'bias',
                    severity: 'medium',
                    message: `Bias balance ${(scores.bias * 100).toFixed(1)}% below acceptable ${CONFIG.policies.maximumBias * 100}%`,
                    value: scores.bias
                });
            }

            if (scores.disinfoRisk > CONFIG.policies.maximumDisinfoRisk) {
                violations.push({
                    type: 'disinformation',
                    severity: 'critical',
                    message: `Disinformation risk ${(scores.disinfoRisk * 100).toFixed(1)}% exceeds maximum ${CONFIG.policies.maximumDisinfoRisk * 100}%`,
                    value: scores.disinfoRisk
                });
            }

            return violations;
        }

        determineAction(decision) {
            // Critical violations = auto-reject
            const criticalViolations = decision.violations.filter(v => v.severity === 'critical');
            if (criticalViolations.length > 0) {
                return CONFIG.actions.reject;
            }

            // High severity violations = quarantine
            const highViolations = decision.violations.filter(v => v.severity === 'high');
            if (highViolations.length >= 2) {
                return CONFIG.actions.quarantine;
            }

            // Medium violations = manual review
            if (decision.violations.length > 0) {
                return CONFIG.actions.review;
            }

            // No violations = auto-approve
            return CONFIG.actions.approve;
        }

        executeAction(article, decision) {
            switch (decision.action) {
                case CONFIG.actions.approve:
                    this.autoApprove(article, decision);
                    break;
                case CONFIG.actions.review:
                    this.flagForReview(article, decision);
                    break;
                case CONFIG.actions.reject:
                    this.autoReject(article, decision);
                    break;
                case CONFIG.actions.quarantine:
                    this.quarantine(article, decision);
                    break;
            }
        }

        autoApprove(article, decision) {
            console.log(`✅ [Layer 165] AUTO-APPROVED: "${article.title}"`);

            // Mark as approved
            article.governanceApproved = true;

            // Attach approval badge
            this.attachGovernanceBadge(article, 'approved');
        }

        flagForReview(article, decision) {
            console.log(`⚠️ [Layer 165] FLAGGED FOR REVIEW: "${article.title}" - ${decision.violations.length} violations`);

            // Mark for manual review
            article.requiresManualReview = true;

            // Attach review badge
            this.attachGovernanceBadge(article, 'review');

            // Create review task (placeholder)
            this.createReviewTask(article, decision);
        }

        autoReject(article, decision) {
            console.error(`❌ [Layer 165] AUTO-REJECTED: "${article.title}" - ${decision.violations.length} violations`);

            // Mark as rejected
            article.governanceRejected = true;

            // Hide from public view
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (articleElement) {
                articleElement.style.display = 'none';
            }

            // Attach rejection badge
            this.attachGovernanceBadge(article, 'rejected');
        }

        quarantine(article, decision) {
            console.warn(`🚨 [Layer 165] QUARANTINED: "${article.title}" - ${decision.violations.length} violations`);

            // Mark as quarantined
            article.governanceQuarantined = true;

            // Hide from public view
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (articleElement) {
                articleElement.style.display = 'none';
            }

            // Attach quarantine badge
            this.attachGovernanceBadge(article, 'quarantine');
        }

        attachGovernanceBadge(article, status) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            const colors = {
                approved: '#10b981',
                review: '#f59e0b',
                rejected: '#ef4444',
                quarantine: '#991b1b'
            };

            const labels = {
                approved: '✅ Approved',
                review: '⚠️ Review Required',
                rejected: '❌ Rejected',
                quarantine: '🚨 Quarantined'
            };

            const badge = document.createElement('div');
            badge.className = 'governance-badge';
            badge.style.cssText = `
                background-color: ${colors[status]};
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                margin: 6px 0;
                font-size: 12px;
                font-weight: 600;
                display: inline-block;
            `;
            badge.textContent = labels[status];

            articleElement.appendChild(badge);
        }

        createReviewTask(article, decision) {
            // Placeholder for creating a review task for human editors
            console.log(`📋 [Layer 165] Review task created for "${article.title}"`);
        }

        handleViolation(article, violationType, data) {
            // Called by other layers to report violations
            const violation = {
                articleId: article.id,
                type: violationType,
                data: data,
                timestamp: new Date().toISOString()
            };

            this.violations.push(violation);
            this.stats.violations++;

            console.warn(`⚠️ [Layer 165] Violation reported: ${violationType} for "${article.title}"`);

            // Re-review the article
            this.reviewArticle(article);
        }

        startComplianceEngine() {
            console.log('🚀 [Layer 165] Starting compliance checking...');

            setInterval(() => {
                this.checkAllArticles();
            }, CONFIG.intervals.complianceCheck);

            // Listen for all integrity events
            ['evidence-scored', 'bias-analyzed', 'disinfo-checked', 'trust-verified', 'validated'].forEach(eventType => {
                document.addEventListener(`article:${eventType}`, (event) => {
                    if (event.detail && event.detail.article) {
                        this.reviewArticle(event.detail.article);
                    }
                });
            });
        }

        checkAllArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.articleDecisions.has(article.id)) {
                            this.reviewArticle(article);
                        }
                    });
                }
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
                window.SPORTIQ.governanceStats = this.stats;
            }
            this.updateDashboard();
        }

        updateStats(action) {
            if (action === CONFIG.actions.approve) this.stats.autoApproved++;
            else if (action === CONFIG.actions.review) this.stats.manualReview++;
            else if (action === CONFIG.actions.reject) this.stats.autoRejected++;
            else if (action === CONFIG.actions.quarantine) this.stats.quarantined++;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer165-dashboard';
            dashboard.className = 'layer165-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer165-dashboard-header">
                    <h3>⚖️ Governance</h3>
                    <button class="layer165-close-btn">×</button>
                </div>
                <div class="layer165-dashboard-content">
                    <div class="layer165-stat">
                        <span class="layer165-stat-label">Reviewed:</span>
                        <span class="layer165-stat-value" id="layer165-total">0</span>
                    </div>
                    <div class="layer165-stat">
                        <span class="layer165-stat-label">✅ Approved:</span>
                        <span class="layer165-stat-value" id="layer165-approved">0</span>
                    </div>
                    <div class="layer165-stat">
                        <span class="layer165-stat-label">❌ Rejected:</span>
                        <span class="layer165-stat-value" id="layer165-rejected">0</span>
                    </div>
                    <div class="layer165-log" id="layer165-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer165-toggle-btn';
            toggleBtn.innerHTML = '⚖️';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer165-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer165-total');
            const approvedEl = document.getElementById('layer165-approved');
            const rejectedEl = document.getElementById('layer165-rejected');

            if (totalEl) totalEl.textContent = this.stats.totalReviewed;
            if (approvedEl) approvedEl.textContent = this.stats.autoApproved;
            if (rejectedEl) rejectedEl.textContent = this.stats.autoRejected;

            const logEl = document.getElementById('layer165-log');
            if (logEl && this.auditTrail.length > 0) {
                const recentLogs = this.auditTrail.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer165-log-entry">
                        <span class="layer165-log-type">${log.type}</span>
                        <span class="layer165-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logAudit(type, message) {
            this.auditTrail.push({ type, message, timestamp: new Date().toISOString() });
            if (this.auditTrail.length > 100) this.auditTrail.shift();
        }

        getDecision(articleId) {
            return this.articleDecisions.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGovernance);
    } else {
        initGovernance();
    }

    function initGovernance() {
        const governance = new AutonomousEditorialGovernance();
        window.Layer165_EditorialGovernance = governance;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.editorialGovernance = governance;
        document.dispatchEvent(new CustomEvent('layer165:ready', { detail: { governance } }));
        console.log('🎯 [Layer 165] Autonomous Editorial Governance - Ready');
    }

})();
