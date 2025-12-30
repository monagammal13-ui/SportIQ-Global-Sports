/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 193 – GLOBAL LEGAL RISK & COMPLIANCE ANALYZER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Analyze legal risk, defamation exposure, and compliance issues.
 * 
 * @version 1.0.0
 * @layer 193
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 193,
        name: 'Global Legal Risk & Compliance Analyzer'
    };

    class LegalRiskAnalyzer {
        constructor() {
            this.riskAssessments = new Map();
            this.stats = {
                totalAnalyses: 0,
                highRisk: 0,
                blocked: 0
            };
            this.init();
        }

        async init() {
            console.log('⚖️ [Layer 193] Legal Risk Analyzer - Initializing...');
            await this.loadConfiguration();
            this.setupAnalysis();
            this.createDashboard();
            console.log('✅ [Layer 193] Legal Risk Analyzer - Active');
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer193-legal-risk.json');
                this.config = response.ok ? await response.json() : CONFIG;
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupAnalysis() {
            document.addEventListener('article:pre-publish', (event) => {
                if (event.detail && event.detail.article) {
                    this.analyzeArticle(event.detail.article);
                }
            });
        }

        analyzeArticle(article) {
            const assessment = {
                id: `risk-${Date.now()}`,
                articleId: article.id,
                timestamp: new Date().toISOString(),
                defamationRisk: this.assessDefamation(article),
                complianceRisk: this.assessCompliance(article),
                overallRisk: 'low'
            };

            assessment.overallRisk = this.calculateOverallRisk(assessment);

            this.riskAssessments.set(article.id, assessment);
            this.stats.totalAnalyses++;

            if (assessment.overallRisk === 'high' || assessment.overallRisk === 'critical') {
                this.stats.highRisk++;
                this.flagForReview(article, assessment);
            }

            return assessment;
        }

        assessDefamation(article) {
            const text = (article.content || '').toLowerCase();
            const defamatoryTerms = ['fraud', 'criminal', 'scandal'];
            const count = defamatoryTerms.filter(term => text.includes(term)).length;
            return count > 0 ? 'medium' : 'low';
        }

        assessCompliance(article) {
            return 'low'; // Simulated compliance check
        }

        calculateOverallRisk(assessment) {
            if (assessment.defamationRisk === 'high' || assessment.complianceRisk === 'high') {
                return 'high';
            }
            return assessment.defamationRisk === 'medium' ? 'medium' : 'low';
        }

        flagForReview(article, assessment) {
            document.dispatchEvent(new CustomEvent('legal:flagged', {
                detail: { article, assessment }
            }));

            if (window.Layer180_SovereignControl) {
                window.Layer180_SovereignControl.handleEscalation({
                    domain: 'legal',
                    type: 'legal_risk',
                    severity: 'high',
                    articleId: article.id
                });
            }
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer193-dashboard';
            dashboard.className = 'layer193-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer193-dashboard-header">
                    <h3>⚖️ Legal Risk</h3>
                    <button class="layer193-close-btn">×</button>
                </div>
                <div class="layer193-dashboard-content">
                    <div class="layer193-stat">
                        <span class="layer193-stat-label">Analyses:</span>
                        <span class="layer193-stat-value" id="layer193-total">0</span>
                    </div>
                    <div class="layer193-stat">
                        <span class="layer193-stat-label">High Risk:</span>
                        <span class="layer193-stat-value" id="layer193-highrisk">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer193-toggle-btn';
            toggleBtn.innerHTML = '⚖️';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer193-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer193-total');
            const highRiskEl = document.getElementById('layer193-highrisk');
            if (totalEl) totalEl.textContent = this.stats.totalAnalyses;
            if (highRiskEl) highRiskEl.textContent = this.stats.highRisk;
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLegalRisk);
    } else {
        initLegalRisk();
    }

    function initLegalRisk() {
        const analyzer = new LegalRiskAnalyzer();
        window.Layer193_LegalRisk = analyzer;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.legalRisk = analyzer;
        console.log('🎯 [Layer 193] Legal Risk Analyzer - Ready');
    }

})();
