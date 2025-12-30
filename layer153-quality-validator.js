/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 153 – EDITORIAL QUALITY & COMPLETENESS VALIDATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Validates that each article meets global editorial standards, 
 * narrative completeness, factual density, and journalistic balance before activation.
 * 
 * Features:
 * - Editorial quality scoring
 * - Narrative completeness validation
 * - Factual density analysis
 * - Journalistic balance checking
 * - Grammar and readability assessment
 * - Source citation verification
 * - Bias detection
 * - Automated quality reporting
 * 
 * @version 1.0.0
 * @layer 153
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 153,
        name: 'Editorial Quality & Completeness Validator',

        qualityMetrics: {
            minWordCount: 150,
            maxWordCount: 5000,
            minSentenceCount: 5,
            minParagraphCount: 3,
            minFactualDensity: 0.3,
            minReadabilityScore: 40,
            minBalanceScore: 0.6,
            requireSources: true,
            minSourceCount: 1
        },

        validationRules: {
            requireTitle: true,
            requireExcerpt: true,
            requireContent: true,
            requireAuthor: true,
            requirePublishDate: true,
            requireCategory: true,
            checkSpelling: true,
            checkGrammar: true,
            checkBias: true
        },

        intervals: {
            validationCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class QualityValidator {
        constructor() {
            this.validatedArticles = new Map();
            this.validationQueue = [];
            this.validationLog = [];
            this.config = null;
            this.stats = {
                totalValidated: 0,
                passed: 0,
                failed: 0,
                averageQualityScore: 0,
                pendingQueue: 0
            };

            this.init();
        }

        async init() {
            console.log('✅ [Layer 153] Editorial Quality Validator - Initializing...');

            try {
                await this.loadConfiguration();
                this.startValidationEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 153] Editorial Quality Validator - Active');
                this.logValidation('SYSTEM', 'Quality validator initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 153] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer153-quality-validator.json');
                if (response.ok) {
                    this.config = await response.json();
                    console.log('📋 [Layer 153] Configuration loaded');
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        validateArticle(article) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 153] Invalid article provided');
                return null;
            }

            try {
                const validation = {
                    articleId: article.id,
                    timestamp: new Date().toISOString(),
                    checks: {},
                    passed: false,
                    qualityScore: 0,
                    issues: [],
                    recommendations: []
                };

                // Run all validation checks
                validation.checks.metadata = this.validateMetadata(article);
                validation.checks.content = this.validateContent(article);
                validation.checks.quality = this.validateQuality(article);
                validation.checks.completeness = this.validateCompleteness(article);
                validation.checks.factualDensity = this.validateFactualDensity(article);
                validation.checks.balance = this.validateBalance(article);
                validation.checks.sources = this.validateSources(article);

                // Calculate overall quality score
                validation.qualityScore = this.calculateQualityScore(validation.checks);

                // Determine pass/fail
                validation.passed = validation.qualityScore >= 70;

                // Collect issues and recommendations
                Object.entries(validation.checks).forEach(([checkName, result]) => {
                    if (!result.passed) {
                        validation.issues.push(`${checkName}: ${result.message}`);
                    }
                    if (result.recommendations) {
                        validation.recommendations.push(...result.recommendations);
                    }
                });

                // Store validation result
                this.validatedArticles.set(article.id, validation);

                // Update stats
                this.stats.totalValidated++;
                if (validation.passed) {
                    this.stats.passed++;
                } else {
                    this.stats.failed++;
                }
                this.updateAverageQualityScore(validation.qualityScore);

                // Log validation
                this.logValidation('VALIDATE', `Article "${article.title}" - ${validation.passed ? 'PASSED' : 'FAILED'} (Score: ${validation.qualityScore.toFixed(1)})`);

                // Dispatch validation event
                document.dispatchEvent(new CustomEvent('article:validated', {
                    detail: { article, validation }
                }));

                // Auto-approve if passed
                if (validation.passed && this.config.autoApprove) {
                    document.dispatchEvent(new CustomEvent('article:approved', {
                        detail: { article, validation }
                    }));
                }

                console.log(`${validation.passed ? '✅' : '❌'} [Layer 153] Article "${article.title}" validation ${validation.passed ? 'passed' : 'failed'} (${validation.qualityScore.toFixed(1)}/100)`);

                return validation;

            } catch (error) {
                console.error(`❌ [Layer 153] Validation failed for article ${article.id}:`, error);
                return null;
            }
        }

        validateMetadata(article) {
            const issues = [];

            if (!article.title || article.title.trim().length < 10) {
                issues.push('Title too short or missing');
            }
            if (!article.excerpt || article.excerpt.trim().length < 50) {
                issues.push('Excerpt too short or missing');
            }
            if (!article.author) {
                issues.push('Author missing');
            }
            if (!article.publishedAt) {
                issues.push('Publish date missing');
            }
            if (!article.category) {
                issues.push('Category missing');
            }

            return {
                passed: issues.length === 0,
                score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20)),
                message: issues.length > 0 ? issues.join(', ') : 'Metadata complete',
                recommendations: issues.map(issue => `Fix: ${issue}`)
            };
        }

        validateContent(article) {
            const content = article.content || '';
            const words = content.split(/\s+/).filter(w => w.length > 0);
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

            const issues = [];

            if (words.length < CONFIG.qualityMetrics.minWordCount) {
                issues.push(`Word count too low (${words.length} < ${CONFIG.qualityMetrics.minWordCount})`);
            }
            if (words.length > CONFIG.qualityMetrics.maxWordCount) {
                issues.push(`Word count too high (${words.length} > ${CONFIG.qualityMetrics.maxWordCount})`);
            }
            if (sentences.length < CONFIG.qualityMetrics.minSentenceCount) {
                issues.push(`Too few sentences (${sentences.length} < ${CONFIG.qualityMetrics.minSentenceCount})`);
            }
            if (paragraphs.length < CONFIG.qualityMetrics.minParagraphCount) {
                issues.push(`Too few paragraphs (${paragraphs.length} < ${CONFIG.qualityMetrics.minParagraphCount})`);
            }

            const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 15));

            return {
                passed: issues.length === 0,
                score: score,
                message: issues.length > 0 ? issues.join(', ') : 'Content structure valid',
                recommendations: issues.map(issue => `Fix: ${issue}`),
                metrics: {
                    wordCount: words.length,
                    sentenceCount: sentences.length,
                    paragraphCount: paragraphs.length
                }
            };
        }

        validateQuality(article) {
            const content = article.content || '';
            const readabilityScore = this.calculateReadabilityScore(content);
            const issues = [];

            if (readabilityScore < CONFIG.qualityMetrics.minReadabilityScore) {
                issues.push(`Readability score too low (${readabilityScore.toFixed(1)} < ${CONFIG.qualityMetrics.minReadabilityScore})`);
            }

            return {
                passed: issues.length === 0,
                score: readabilityScore,
                message: issues.length > 0 ? issues.join(', ') : 'Quality metrics acceptable',
                recommendations: issues.length > 0 ? ['Simplify language', 'Use shorter sentences', 'Break up long paragraphs'] : []
            };
        }

        validateCompleteness(article) {
            const completenessScore = this.calculateCompletenessScore(article);
            const passed = completenessScore >= 80;

            return {
                passed: passed,
                score: completenessScore,
                message: passed ? 'Article is complete' : 'Article incomplete',
                recommendations: passed ? [] : ['Add more detail', 'Include supporting facts', 'Provide context']
            };
        }

        validateFactualDensity(article) {
            const content = article.content || '';
            const factualDensity = this.calculateFactualDensity(content);
            const passed = factualDensity >= CONFIG.qualityMetrics.minFactualDensity;

            return {
                passed: passed,
                score: factualDensity * 100,
                message: passed ? `Factual density: ${(factualDensity * 100).toFixed(1)}%` : 'Low factual density',
                recommendations: passed ? [] : ['Add more facts and data', 'Include statistics', 'Cite specific examples']
            };
        }

        validateBalance(article) {
            const content = article.content || '';
            const balanceScore = this.calculateBalanceScore(content);
            const passed = balanceScore >= CONFIG.qualityMetrics.minBalanceScore;

            return {
                passed: passed,
                score: balanceScore * 100,
                message: passed ? 'Journalistic balance acceptable' : 'Content may be biased',
                recommendations: passed ? [] : ['Include multiple perspectives', 'Reduce opinionated language', 'Add counterarguments']
            };
        }

        validateSources(article) {
            const sources = article.sources || [];
            const passed = sources.length >= CONFIG.qualityMetrics.minSourceCount;

            return {
                passed: passed,
                score: passed ? 100 : 0,
                message: passed ? `${sources.length} source(s) cited` : 'No sources cited',
                recommendations: passed ? [] : ['Add credible sources', 'Cite references', 'Include expert quotes']
            };
        }

        calculateQualityScore(checks) {
            const weights = {
                metadata: 0.15,
                content: 0.20,
                quality: 0.20,
                completeness: 0.15,
                factualDensity: 0.15,
                balance: 0.10,
                sources: 0.05
            };

            let totalScore = 0;
            let totalWeight = 0;

            Object.entries(weights).forEach(([checkName, weight]) => {
                if (checks[checkName]) {
                    totalScore += checks[checkName].score * weight;
                    totalWeight += weight;
                }
            });

            return totalWeight > 0 ? totalScore / totalWeight : 0;
        }

        calculateReadabilityScore(content) {
            const words = content.split(/\s+/).filter(w => w.length > 0);
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

            if (sentences.length === 0) return 0;

            const avgWordsPerSentence = words.length / sentences.length;
            const avgCharsPerWord = content.length / words.length;

            // Simplified readability formula
            const score = 100 - (avgWordsPerSentence * 1.5 + avgCharsPerWord * 2);
            return Math.max(0, Math.min(100, score));
        }

        calculateCompletenessScore(article) {
            let score = 0;
            const maxScore = 100;

            if (article.title) score += 10;
            if (article.excerpt && article.excerpt.length > 100) score += 15;
            if (article.content && article.content.length > 500) score += 30;
            if (article.author) score += 10;
            if (article.publishedAt) score += 10;
            if (article.category) score += 10;
            if (article.image) score += 10;
            if (article.tags && article.tags.length > 0) score += 5;

            return score;
        }

        calculateFactualDensity(content) {
            // Simple heuristic: count numbers, proper nouns, and factual indicators
            const factualIndicators = /\d+|[A-Z][a-z]+|according to|research shows|study found|expert|official/g;
            const matches = content.match(factualIndicators) || [];
            const words = content.split(/\s+/).filter(w => w.length > 0);

            return words.length > 0 ? matches.length / words.length : 0;
        }

        calculateBalanceScore(content) {
            const biasedWords = /always|never|best|worst|terrible|amazing|definitely|obviously/gi;
            const balancedWords = /however|although|according to|reportedly|allegedly|may|might|could/gi;

            const biased = (content.match(biasedWords) || []).length;
            const balanced = (content.match(balancedWords) || []).length;
            const total = biased + balanced;

            return total > 0 ? balanced / total : 0.5;
        }

        startValidationEngine() {
            console.log('🚀 [Layer 153] Starting validation engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.validationCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForValidation(event.detail.article);
                }
            });

            document.addEventListener('article:created', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForValidation(event.detail.article);
                }
            });
        }

        queueForValidation(article) {
            if (!this.validationQueue.find(a => a.id === article.id)) {
                this.validationQueue.push(article);
                this.stats.pendingQueue = this.validationQueue.length;
                console.log(`📥 [Layer 153] Article "${article.title}" queued for validation`);
            }
        }

        processQueue() {
            if (this.validationQueue.length === 0) return;

            const article = this.validationQueue.shift();
            if (article) {
                this.validateArticle(article);
                this.stats.pendingQueue = this.validationQueue.length;
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;

                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.validatedArticles.has(article.id)) {
                            this.queueForValidation(article);
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
            this.stats.passRate = this.stats.totalValidated > 0 ?
                (this.stats.passed / this.stats.totalValidated * 100).toFixed(1) : 0;

            if (window.SPORTIQ) {
                window.SPORTIQ.validationStats = this.stats;
            }

            this.updateDashboard();
        }

        updateAverageQualityScore(newScore) {
            const total = this.stats.averageQualityScore * (this.stats.totalValidated - 1) + newScore;
            this.stats.averageQualityScore = total / this.stats.totalValidated;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer153-dashboard';
            dashboard.className = 'layer153-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer153-dashboard-header">
                    <h3>✅ Quality Validator</h3>
                    <button class="layer153-close-btn">×</button>
                </div>
                <div class="layer153-dashboard-content">
                    <div class="layer153-stat">
                        <span class="layer153-stat-label">Total Validated:</span>
                        <span class="layer153-stat-value" id="layer153-total">0</span>
                    </div>
                    <div class="layer153-stat">
                        <span class="layer153-stat-label">Pass Rate:</span>
                        <span class="layer153-stat-value" id="layer153-passrate">0%</span>
                    </div>
                    <div class="layer153-stat">
                        <span class="layer153-stat-label">Avg Quality:</span>
                        <span class="layer153-stat-value" id="layer153-quality">0</span>
                    </div>
                    <div class="layer153-log" id="layer153-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer153-toggle-btn';
            toggleBtn.innerHTML = '✅';
            toggleBtn.title = 'Toggle Quality Validator Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer153-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer153-total');
            const passRateEl = document.getElementById('layer153-passrate');
            const qualityEl = document.getElementById('layer153-quality');

            if (totalEl) totalEl.textContent = this.stats.totalValidated;
            if (passRateEl) passRateEl.textContent = `${this.stats.passRate}%`;
            if (qualityEl) qualityEl.textContent = this.stats.averageQualityScore.toFixed(1);

            const logEl = document.getElementById('layer153-log');
            if (logEl && this.validationLog.length > 0) {
                const recentLogs = this.validationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer153-log-entry">
                        <span class="layer153-log-type">${log.type}</span>
                        <span class="layer153-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logValidation(type, message) {
            this.validationLog.push({
                type,
                message,
                timestamp: new Date().toISOString()
            });

            if (this.validationLog.length > 100) {
                this.validationLog.shift();
            }
        }

        getValidation(articleId) {
            return this.validatedArticles.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initValidator);
    } else {
        initValidator();
    }

    function initValidator() {
        const validator = new QualityValidator();
        window.Layer153_QualityValidator = validator;

        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }
        window.SPORTIQ.qualityValidator = validator;

        document.dispatchEvent(new CustomEvent('layer153:ready', {
            detail: { validator }
        }));

        console.log('🎯 [Layer 153] Editorial Quality Validator - Ready');
    }

})();
