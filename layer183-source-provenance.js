/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 183 – SOURCE VERIFICATION & PROVENANCE TRACKER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Track, verify, and display source provenance for transparency.
 * 
 * @version 1.0.0
 * @layer 183
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 183,
        name: 'Source Verification & Provenance Tracker',

        credibilityLevels: ['verified', 'credible', 'unverified', 'questionable'],

        intervals: {
            verificationCheck: 30000,
            provenanceTracking: 60000,
            analyticsUpdate: 60000
        }
    };

    class SourceProvenance {
        constructor() {
            this.sourceRegistry = new Map();
            this.provenanceChains = new Map();
            this.verificationLog = [];
            this.config = null;
            this.stats = {
                totalSources: 0,
                verifiedSources: 0,
                unverifiedSources: 0,
                provenanceChains: 0
            };

            this.init();
        }

        async init() {
            console.log('🔍 [Layer 183] Source Provenance - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupProvenance();
                this.startVerification();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 183] Source Provenance - Active');

            } catch (error) {
                console.error('❌ [Layer 183] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer183-source-provenance.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupProvenance() {
            // Listen for articles with sources
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.trackSourceProvenance(event.detail.article);
                }
            });

            document.addEventListener('source:added', (event) => {
                if (event.detail && event.detail.source) {
                    this.registerSource(event.detail.source);
                }
            });
        }

        trackSourceProvenance(article) {
            if (!article.sources || article.sources.length === 0) return;

            const provenanceChain = {
                articleId: article.id,
                sources: [],
                timestamp: new Date().toISOString(),
                verificationStatus: 'pending'
            };

            article.sources.forEach(source => {
                const sourceRecord = this.registerSource(source);
                provenanceChain.sources.push({
                    sourceId: sourceRecord.id,
                    name: source.name || source.organization,
                    type: source.type,
                    credibility: sourceRecord.credibility,
                    verificationDate: sourceRecord.verifiedAt
                });
            });

            // Verify chain
            provenanceChain.verificationStatus = this.verifyProvenanceChain(provenanceChain);

            this.provenanceChains.set(article.id, provenanceChain);
            this.stats.provenanceChains++;

            // Display provenance widget
            this.displayProvenanceWidget(article.id, provenanceChain);

            document.dispatchEvent(new CustomEvent('provenance:tracked', {
                detail: { article, provenanceChain }
            }));
        }

        registerSource(source) {
            const sourceId = this.generateSourceId(source);

            if (this.sourceRegistry.has(sourceId)) {
                return this.sourceRegistry.get(sourceId);
            }

            const sourceRecord = {
                id: sourceId,
                name: source.name || source.organization,
                organization: source.organization,
                type: source.type || 'unknown',
                credibility: this.assessCredibility(source),
                verifiedAt: null,
                registeredAt: new Date().toISOString(),
                usageCount: 1,
                provenanceData: {
                    firstSeen: new Date().toISOString(),
                    location: source.location,
                    affiliation: source.affiliation
                }
            };

            this.sourceRegistry.set(sourceId, sourceRecord);
            this.stats.totalSources++;

            if (sourceRecord.credibility === 'verified' || sourceRecord.credibility === 'credible') {
                this.stats.verifiedSources++;
            } else {
                this.stats.unverifiedSources++;
            }

            return sourceRecord;
        }

        generateSourceId(source) {
            const name = source.name || source.organization || 'unknown';
            return `source-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        }

        assessCredibility(source) {
            let credibilityScore = 0;

            // Known organization
            if (source.organization) credibilityScore += 0.3;

            // Type indicator
            if (source.type === 'official') credibilityScore += 0.4;
            else if (source.type === 'expert') credibilityScore += 0.3;
            else if (source.type === 'witness') credibilityScore += 0.2;

            // Has credentials
            if (source.credentials) credibilityScore += 0.3;

            // Determine level
            if (credibilityScore >= 0.8) return 'verified';
            if (credibilityScore >= 0.5) return 'credible';
            if (credibilityScore >= 0.3) return 'unverified';
            return 'questionable';
        }

        verifyProvenanceChain(chain) {
            const verifiedCount = chain.sources.filter(s =>
                s.credibility === 'verified' || s.credibility === 'credible'
            ).length;

            const ratio = verifiedCount / chain.sources.length;

            if (ratio >= 0.8) return 'verified';
            if (ratio >= 0.5) return 'credible';
            return 'needs_verification';
        }

        displayProvenanceWidget(articleId, chain) {
            const articleElement = document.querySelector(`[data-article-id="${articleId}"]`);
            if (!articleElement) return;

            const widget = document.createElement('div');
            widget.className = 'provenance-widget';
            widget.innerHTML = `
                <div class="provenance-header">
                    <h4>📋 Source Provenance</h4>
                    <span class="provenance-status provenance-${chain.verificationStatus}">
                        ${chain.verificationStatus.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                <div class="provenance-sources">
                    ${chain.sources.map(source => `
                        <div class="provenance-source credibility-${source.credibility}">
                            <span class="source-name">${source.name}</span>
                            <span class="source-type">${source.type}</span>
                            <span class="source-credibility">${source.credibility}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="provenance-details-btn" onclick="window.Layer183_SourceProvenance.showProvenanceDetails('${articleId}')">
                    View Full Provenance Chain
                </button>
            `;

            // Insert widget
            const insertPoint = articleElement.querySelector('.article-content') || articleElement;
            insertPoint.appendChild(widget);
        }

        showProvenanceDetails(articleId) {
            const chain = this.provenanceChains.get(articleId);
            if (!chain) return;

            const modal = document.createElement('div');
            modal.className = 'provenance-modal';
            modal.innerHTML = `
                <div class="provenance-modal-content">
                    <div class="provenance-modal-header">
                        <h3>Complete Source Provenance Chain</h3>
                        <button class="modal-close" onclick="this.closest('.provenance-modal').remove()">×</button>
                    </div>
                    <div class="provenance-modal-body">
                        <div class="provenance-timeline">
                            ${chain.sources.map((source, index) => `
                                <div class="provenance-timeline-item">
                                    <div class="timeline-marker">${index + 1}</div>
                                    <div class="timeline-content">
                                        <h4>${source.name}</h4>
                                        <div class="source-details">
                                            <span><strong>Type:</strong> ${source.type}</span>
                                            <span><strong>Credibility:</strong> ${source.credibility}</span>
                                            ${source.verificationDate ? `<span><strong>Verified:</strong> ${new Date(source.verificationDate).toLocaleDateString()}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="provenance-summary">
                            <p><strong>Verification Status:</strong> ${chain.verificationStatus}</p>
                            <p><strong>Tracked:</strong> ${new Date(chain.timestamp).toLocaleString()}</p>
                            <p><strong>Total Sources:</strong> ${chain.sources.length}</p>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        startVerification() {
            console.log('🚀 [Layer 183] Starting source verification...');

            setInterval(() => {
                this.performVerificationChecks();
            }, CONFIG.intervals.verificationCheck);
        }

        performVerificationChecks() {
            this.sourceRegistry.forEach((source, id) => {
                if (!source.verifiedAt && source.credibility === 'verified') {
                    source.verifiedAt = new Date().toISOString();
                }
            });
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.sourceProvenanceStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer183-dashboard';
            dashboard.className = 'layer183-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer183-dashboard-header">
                    <h3>🔍 Source Provenance</h3>
                    <button class="layer183-close-btn">×</button>
                </div>
                <div class="layer183-dashboard-content">
                    <div class="layer183-stat">
                        <span class="layer183-stat-label">Sources:</span>
                        <span class="layer183-stat-value" id="layer183-total">0</span>
                    </div>
                    <div class="layer183-stat">
                        <span class="layer183-stat-label">Verified:</span>
                        <span class="layer183-stat-value" id="layer183-verified">0</span>
                    </div>
                    <div class="layer183-stat">
                        <span class="layer183-stat-label">Chains:</span>
                        <span class="layer183-stat-value" id="layer183-chains">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer183-toggle-btn';
            toggleBtn.innerHTML = '🔍';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer183-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer183-total');
            const verifiedEl = document.getElementById('layer183-verified');
            const chainsEl = document.getElementById('layer183-chains');

            if (totalEl) totalEl.textContent = this.stats.totalSources;
            if (verifiedEl) verifiedEl.textContent = this.stats.verifiedSources;
            if (chainsEl) chainsEl.textContent = this.stats.provenanceChains;
        }

        getSourceProvenance(articleId) {
            return this.provenanceChains.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSourceProvenance);
    } else {
        initSourceProvenance();
    }

    function initSourceProvenance() {
        const provenance = new SourceProvenance();
        window.Layer183_SourceProvenance = provenance;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.sourceProvenance = provenance;
        console.log('🎯 [Layer 183] Source Provenance Tracker - Ready');
    }

})();
