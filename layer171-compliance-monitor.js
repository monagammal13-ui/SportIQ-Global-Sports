/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 171 – GLOBAL EDITORIAL COMPLIANCE MONITOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Ensure all content complies with international publishing 
 * standards and regulations.
 * 
 * @version 1.0.0
 * @layer 171
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 171,
        name: 'Global Editorial Compliance Monitor',

        regulations: ['GDPR', 'CCPA', 'COPPA', 'FTC', 'ASA', 'Press Council'],

        intervals: {
            complianceCheck: 10000,
            analyticsUpdate: 60000
        }
    };

    class ComplianceMonitor {
        constructor() {
            this.monitoredContent = new Map();
            this.violations = new Map();
            this.complianceLog = [];
            this.config = null;
            this.stats = {
                totalChecked: 0,
                compliant: 0,
                violations: 0,
                autoFixed: 0,
                flagged: 0
            };

            this.init();
        }

        async init() {
            console.log('⚖️ [Layer 171] Global Compliance Monitor - Initializing...');

            try {
                await this.loadConfiguration();
                this.startComplianceMonitoring();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 171] Global Compliance Monitor - Active');
                this.logCompliance('SYSTEM', 'Compliance monitoring initialized');

            } catch (error) {
                console.error('❌ [Layer 171] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer171-compliance-monitor.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        checkCompliance(content) {
            if (!content || !content.id) return null;

            try {
                const complianceReport = {
                    contentId: content.id,
                    timestamp: new Date().toISOString(),
                    checks: [],
                    violations: [],
                    warnings: [],
                    status: 'compliant',
                    score: 100
                };

                // Run all compliance checks
                this.checkGDPRCompliance(content, complianceReport);
                this.checkCCPACompliance(content, complianceReport);
                this.checkContentStandards(content, complianceReport);
                this.checkAdvertisingCompliance(content, complianceReport);
                this.checkAccessibility(content, complianceReport);
                this.checkCopyrightCompliance(content, complianceReport);
                this.checkMinorProtection(content, complianceReport);

                // Calculate compliance score
                complianceReport.score = this.calculateComplianceScore(complianceReport);

                // Determine overall status
                if (complianceReport.violations.length > 0) {
                    complianceReport.status = 'non-compliant';
                    this.stats.violations++;
                } else if (complianceReport.warnings.length > 0) {
                    complianceReport.status = 'warning';
                } else {
                    this.stats.compliant++;
                }

                // Store compliance report
                this.monitoredContent.set(content.id, complianceReport);
                this.stats.totalChecked++;

                // Handle violations
                if (complianceReport.violations.length > 0) {
                    this.handleViolations(content, complianceReport);
                }

                this.logCompliance('CHECK', `Content "${content.title}" - ${complianceReport.status} (${complianceReport.score}%)`);

                document.dispatchEvent(new CustomEvent('compliance:checked', {
                    detail: { content, complianceReport }
                }));

                return complianceReport;

            } catch (error) {
                console.error(`❌ [Layer 171] Compliance check failed:`, error);
                return null;
            }
        }

        checkGDPRCompliance(content, report) {
            const check = {
                regulation: 'GDPR',
                passed: true,
                issues: []
            };

            // Check for personal data handling disclosure
            const contentText = (content.content || '').toLowerCase();
            if (contentText.includes('personal data') || contentText.includes('user data')) {
                if (!contentText.includes('privacy policy') && !contentText.includes('data protection')) {
                    check.passed = false;
                    check.issues.push('Personal data mentioned without privacy policy reference');
                    report.violations.push({
                        type: 'GDPR',
                        severity: 'high',
                        message: 'GDPR: Personal data handling requires privacy policy disclosure'
                    });
                }
            }

            // Check for cookie consent if tracking mentioned
            if (contentText.includes('tracking') || contentText.includes('analytics')) {
                if (!contentText.includes('consent') && !contentText.includes('cookie')) {
                    check.passed = false;
                    report.warnings.push({
                        type: 'GDPR',
                        severity: 'medium',
                        message: 'GDPR: Tracking mentioned - ensure cookie consent is implemented'
                    });
                }
            }

            report.checks.push(check);
        }

        checkCCPACompliance(content, report) {
            const check = {
                regulation: 'CCPA',
                passed: true,
                issues: []
            };

            // Check for data sale disclosure
            const contentText = (content.content || '').toLowerCase();
            if (contentText.includes('data sale') || contentText.includes('sell information')) {
                if (!contentText.includes('do not sell')) {
                    check.passed = false;
                    report.violations.push({
                        type: 'CCPA',
                        severity: 'high',
                        message: 'CCPA: Data sale must include "Do Not Sell" option'
                    });
                }
            }

            report.checks.push(check);
        }

        checkContentStandards(content, report) {
            const check = {
                regulation: 'Editorial Standards',
                passed: true,
                issues: []
            };

            const contentText = (content.content || '').toLowerCase();
            const title = (content.title || '').toLowerCase();

            // Check for sensationalism in title
            const sensationalWords = ['shocking', 'unbelievable', 'you won\'t believe', 'secret'];
            if (sensationalWords.some(word => title.includes(word))) {
                check.passed = false;
                report.warnings.push({
                    type: 'Editorial Standards',
                    severity: 'low',
                    message: 'Title may contain sensationalist language'
                });
            }

            // Check for proper attribution
            if (contentText.includes('according to') || contentText.includes('sources say')) {
                const hasProperAttribution = contentText.match(/according to [a-z\s]+official|according to [a-z\s]+spokesperson/i);
                if (!hasProperAttribution) {
                    report.warnings.push({
                        type: 'Editorial Standards',
                        severity: 'medium',
                        message: 'Anonymous sources - consider adding proper attribution'
                    });
                }
            }

            // Check for disclosure of conflicts of interest
            if (contentText.includes('sponsored') || contentText.includes('partnership')) {
                if (!contentText.includes('disclosure') && !contentText.includes('disclaimer')) {
                    check.passed = false;
                    report.violations.push({
                        type: 'FTC',
                        severity: 'high',
                        message: 'Sponsored content requires clear disclosure'
                    });
                }
            }

            report.checks.push(check);
        }

        checkAdvertisingCompliance(content, report) {
            const check = {
                regulation: 'Advertising Standards',
                passed: true,
                issues: []
            };

            // Check if content has ads
            if (content.hasAds || content.monetized) {
                // Check for clear ad labeling
                if (!content.adDisclosure) {
                    report.warnings.push({
                        type: 'ASA',
                        severity: 'medium',
                        message: 'Ads should be clearly labeled as advertisements'
                    });
                }

                // Check for prohibited ad content
                const contentText = (content.content || '').toLowerCase();
                const prohibitedProducts = ['tobacco', 'cigarette', 'alcohol to minors', 'gambling'];
                if (prohibitedProducts.some(product => contentText.includes(product))) {
                    check.passed = false;
                    report.violations.push({
                        type: 'Advertising Standards',
                        severity: 'critical',
                        message: 'Content may contain prohibited advertising material'
                    });
                }
            }

            report.checks.push(check);
        }

        checkAccessibility(content, report) {
            const check = {
                regulation: 'WCAG 2.1',
                passed: true,
                issues: []
            };

            // Check for alt text on images
            if (content.images && content.images.length > 0) {
                const missingAlt = content.images.filter(img => !img.alt || img.alt.trim() === '');
                if (missingAlt.length > 0) {
                    report.warnings.push({
                        type: 'Accessibility',
                        severity: 'medium',
                        message: `${missingAlt.length} image(s) missing alt text`
                    });
                }
            }

            // Check for video captions
            if (content.videos && content.videos.length > 0) {
                const missingCaptions = content.videos.filter(vid => !vid.captions);
                if (missingCaptions.length > 0) {
                    report.warnings.push({
                        type: 'Accessibility',
                        severity: 'medium',
                        message: `${missingCaptions.length} video(s) missing captions`
                    });
                }
            }

            report.checks.push(check);
        }

        checkCopyrightCompliance(content, report) {
            const check = {
                regulation: 'Copyright',
                passed: true,
                issues: []
            };

            // Check for proper image attribution
            if (content.images && content.images.length > 0) {
                const missingCredit = content.images.filter(img => !img.credit && !img.license);
                if (missingCredit.length > 0) {
                    report.warnings.push({
                        type: 'Copyright',
                        severity: 'high',
                        message: `${missingCredit.length} image(s) missing proper attribution/license`
                    });
                }
            }

            // Check for quoted material attribution
            const contentText = content.content || '';
            const quoteMatches = contentText.match(/[""][^""]+[""]/g) || [];
            if (quoteMatches.length > 3) {
                const hasProperCitation = contentText.includes('source:') ||
                    contentText.includes('credit:') ||
                    contentText.includes('©');
                if (!hasProperCitation) {
                    report.warnings.push({
                        type: 'Copyright',
                        severity: 'medium',
                        message: 'Multiple quotes - ensure proper source citation'
                    });
                }
            }

            report.checks.push(check);
        }

        checkMinorProtection(content, report) {
            const check = {
                regulation: 'COPPA',
                passed: true,
                issues: []
            };

            const contentText = (content.content || '').toLowerCase();

            // Check for content targeting children
            const childKeywords = ['kids', 'children', 'under 13', 'youth'];
            if (childKeywords.some(keyword => contentText.includes(keyword))) {
                // Check for data collection from minors
                if (contentText.includes('register') || contentText.includes('sign up')) {
                    check.passed = false;
                    report.violations.push({
                        type: 'COPPA',
                        severity: 'critical',
                        message: 'COPPA: Content targeting children must not collect personal information without parental consent'
                    });
                }

                // Check for age-appropriate content warnings
                if (!content.ageRating && !content.contentWarning) {
                    report.warnings.push({
                        type: 'Minor Protection',
                        severity: 'medium',
                        message: 'Content involving minors should have age-appropriate ratings'
                    });
                }
            }

            report.checks.push(check);
        }

        calculateComplianceScore(report) {
            let score = 100;

            // Deduct points for violations
            report.violations.forEach(violation => {
                switch (violation.severity) {
                    case 'critical':
                        score -= 25;
                        break;
                    case 'high':
                        score -= 15;
                        break;
                    case 'medium':
                        score -= 10;
                        break;
                    case 'low':
                        score -= 5;
                        break;
                }
            });

            // Deduct smaller points for warnings
            report.warnings.forEach(warning => {
                switch (warning.severity) {
                    case 'high':
                        score -= 5;
                        break;
                    case 'medium':
                        score -= 3;
                        break;
                    case 'low':
                        score -= 1;
                        break;
                }
            });

            return Math.max(0, score);
        }

        handleViolations(content, report) {
            const criticalViolations = report.violations.filter(v => v.severity === 'critical');

            if (criticalViolations.length > 0) {
                // Flag content for review
                this.flagContent(content, criticalViolations);
                this.stats.flagged++;

                // Notify governance layer
                if (window.Layer165_EditorialGovernance) {
                    window.Layer165_EditorialGovernance.handleComplianceViolation(content.id, report);
                }
            } else {
                // Attempt auto-fix for non-critical violations
                const fixed = this.attemptAutoFix(content, report);
                if (fixed) {
                    this.stats.autoFixed++;
                }
            }

            // Store violations
            this.violations.set(content.id, report.violations);
        }

        flagContent(content, violations) {
            document.dispatchEvent(new CustomEvent('compliance:violation', {
                detail: {
                    contentId: content.id,
                    violations: violations,
                    action: 'flagged'
                }
            }));

            this.logCompliance('VIOLATION', `Content "${content.title}" flagged - ${violations.length} critical violation(s)`);
        }

        attemptAutoFix(content, report) {
            let fixed = false;

            // Auto-fix missing alt text
            if (content.images) {
                content.images.forEach(img => {
                    if (!img.alt) {
                        img.alt = content.title || 'Image';
                        fixed = true;
                    }
                });
            }

            if (fixed) {
                this.logCompliance('AUTOFIX', `Auto-fixed issues in "${content.title}"`);
            }

            return fixed;
        }

        startComplianceMonitoring() {
            console.log('🚀 [Layer 171] Starting compliance monitoring...');

            setInterval(() => {
                this.checkAllContent();
            }, CONFIG.intervals.complianceCheck);

            // Listen for new content
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.checkCompliance(event.detail.article);
                }
            });

            document.addEventListener('article:updated', (event) => {
                if (event.detail && event.detail.article) {
                    this.checkCompliance(event.detail.article);
                }
            });
        }

        checkAllContent() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        // Re-check periodically
                        if (!this.monitoredContent.has(article.id) ||
                            this.shouldRecheck(article.id)) {
                            this.checkCompliance(article);
                        }
                    });
                }
            }
        }

        shouldRecheck(contentId) {
            const report = this.monitoredContent.get(contentId);
            if (!report) return true;

            // Recheck if older than 1 hour
            const age = Date.now() - new Date(report.timestamp).getTime();
            return age > 3600000;
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.complianceStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer171-dashboard';
            dashboard.className = 'layer171-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer171-dashboard-header">
                    <h3>⚖️ Compliance Monitor</h3>
                    <button class="layer171-close-btn">×</button>
                </div>
                <div class="layer171-dashboard-content">
                    <div class="layer171-stat">
                        <span class="layer171-stat-label">Checked:</span>
                        <span class="layer171-stat-value" id="layer171-checked">0</span>
                    </div>
                    <div class="layer171-stat">
                        <span class="layer171-stat-label">Compliant:</span>
                        <span class="layer171-stat-value" id="layer171-compliant">0</span>
                    </div>
                    <div class="layer171-stat">
                        <span class="layer171-stat-label">Violations:</span>
                        <span class="layer171-stat-value" id="layer171-violations">0</span>
                    </div>
                    <div class="layer171-stat">
                        <span class="layer171-stat-label">Auto-Fixed:</span>
                        <span class="layer171-stat-value" id="layer171-fixed">0</span>
                    </div>
                    <div class="layer171-log" id="layer171-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer171-toggle-btn';
            toggleBtn.innerHTML = '⚖️';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer171-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const checkedEl = document.getElementById('layer171-checked');
            const compliantEl = document.getElementById('layer171-compliant');
            const violationsEl = document.getElementById('layer171-violations');
            const fixedEl = document.getElementById('layer171-fixed');

            if (checkedEl) checkedEl.textContent = this.stats.totalChecked;
            if (compliantEl) compliantEl.textContent = this.stats.compliant;
            if (violationsEl) violationsEl.textContent = this.stats.violations;
            if (fixedEl) fixedEl.textContent = this.stats.autoFixed;

            const logEl = document.getElementById('layer171-log');
            if (logEl && this.complianceLog.length > 0) {
                const recentLogs = this.complianceLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer171-log-entry">
                        <span class="layer171-log-type">${log.type}</span>
                        <span class="layer171-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logCompliance(type, message) {
            this.complianceLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.complianceLog.length > 100) this.complianceLog.shift();
        }

        getComplianceReport(contentId) {
            return this.monitoredContent.get(contentId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComplianceMonitor);
    } else {
        initComplianceMonitor();
    }

    function initComplianceMonitor() {
        const monitor = new ComplianceMonitor();
        window.Layer171_ComplianceMonitor = monitor;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.complianceMonitor = monitor;
        document.dispatchEvent(new CustomEvent('layer171:ready', { detail: { monitor } }));
        console.log('🎯 [Layer 171] Global Compliance Monitor - Ready');
    }

})();
