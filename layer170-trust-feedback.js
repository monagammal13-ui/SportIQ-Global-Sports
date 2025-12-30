/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 170 – READER TRUST FEEDBACK LOOP
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Collect and analyze reader trust feedback to improve editorial decisions.
 * 
 * @version 1.0.0
 * @layer 170
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 170,
        name: 'Reader Trust Feedback Loop',

        feedbackTypes: ['trust', 'accuracy', 'bias', 'completeness', 'clarity'],
        aggregationPeriod: 3600000, // 1 hour

        intervals: {
            aggregation: 60000,
            analyticsUpdate: 30000
        }
    };

    class ReaderTrustFeedback {
        constructor() {
            this.feedback = new Map();
            this.aggregatedScores = new Map();
            this.feedbackLog = [];
            this.config = null;
            this.stats = {
                totalFeedback: 0,
                avgTrustScore: 0,
                avgAccuracyScore: 0,
                articlesRated: 0,
                feedbackThisHour: 0
            };

            this.init();
        }

        async init() {
            console.log('🤝 [Layer 170] Reader Trust Feedback - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupFeedbackCollectors();
                this.startAggregation();
                this.startAnalytics();
                this.createDashboard();
                this.createFeedbackWidgets();

                console.log('✅ [Layer 170] Reader Trust Feedback - Active');
                this.logFeedback('SYSTEM', 'Reader trust feedback system initialized');

            } catch (error) {
                console.error('❌ [Layer 170] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer170-trust-feedback.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        collectFeedback(articleId, feedbackData) {
            if (!articleId || !feedbackData) return null;

            try {
                const feedbackEntry = {
                    id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    articleId: articleId,
                    timestamp: new Date().toISOString(),
                    scores: {
                        trust: feedbackData.trust || 0,
                        accuracy: feedbackData.accuracy || 0,
                        bias: feedbackData.bias || 0,
                        completeness: feedbackData.completeness || 0,
                        clarity: feedbackData.clarity || 0
                    },
                    comment: feedbackData.comment || '',
                    userId: feedbackData.userId || 'anonymous',
                    verified: feedbackData.verified || false
                };

                // Store feedback
                if (!this.feedback.has(articleId)) {
                    this.feedback.set(articleId, []);
                }
                this.feedback.get(articleId).push(feedbackEntry);

                // Update statistics
                this.stats.totalFeedback++;
                this.stats.feedbackThisHour++;

                // Trigger aggregation for this article
                this.aggregateArticleFeedback(articleId);

                // Log feedback
                this.logFeedback('FEEDBACK', `Article: ${articleId} - Trust: ${feedbackEntry.scores.trust}/5`);

                // Dispatch event
                document.dispatchEvent(new CustomEvent('feedback:received', {
                    detail: { feedbackEntry }
                }));

                // Check for actionable insights
                this.analyzeForActionableInsights(articleId, feedbackEntry);

                return feedbackEntry;

            } catch (error) {
                console.error(`❌ [Layer 170] Feedback collection failed:`, error);
                return null;
            }
        }

        aggregateArticleFeedback(articleId) {
            const articleFeedback = this.feedback.get(articleId);
            if (!articleFeedback || articleFeedback.length === 0) return;

            const aggregated = {
                articleId: articleId,
                totalFeedback: articleFeedback.length,
                scores: {
                    trust: 0,
                    accuracy: 0,
                    bias: 0,
                    completeness: 0,
                    clarity: 0
                },
                overall: 0,
                verifiedFeedbackCount: 0,
                lastUpdated: new Date().toISOString()
            };

            // Calculate averages
            let totalWeight = 0;
            articleFeedback.forEach(fb => {
                const weight = fb.verified ? 2 : 1; // Verified feedback weights more
                totalWeight += weight;

                Object.keys(aggregated.scores).forEach(key => {
                    aggregated.scores[key] += (fb.scores[key] || 0) * weight;
                });

                if (fb.verified) aggregated.verifiedFeedbackCount++;
            });

            // Normalize scores
            Object.keys(aggregated.scores).forEach(key => {
                aggregated.scores[key] = Math.round((aggregated.scores[key] / totalWeight) * 100) / 100;
            });

            // Calculate overall score
            aggregated.overall = Math.round(
                (aggregated.scores.trust + aggregated.scores.accuracy +
                    (5 - aggregated.scores.bias) + aggregated.scores.completeness +
                    aggregated.scores.clarity) / 5 * 100
            ) / 100;

            // Store aggregated data
            this.aggregatedScores.set(articleId, aggregated);

            // Update global stats
            this.updateGlobalStats();

            // Apply trust indicators to article
            this.applyTrustIndicators(articleId, aggregated);

            return aggregated;
        }

        updateGlobalStats() {
            let totalTrust = 0;
            let totalAccuracy = 0;
            let count = 0;

            this.aggregatedScores.forEach((agg) => {
                totalTrust += agg.scores.trust;
                totalAccuracy += agg.scores.accuracy;
                count++;
            });

            if (count > 0) {
                this.stats.avgTrustScore = Math.round((totalTrust / count) * 100) / 100;
                this.stats.avgAccuracyScore = Math.round((totalAccuracy / count) * 100) / 100;
                this.stats.articlesRated = count;
            }
        }

        analyzeForActionableInsights(articleId, feedbackEntry) {
            const aggregated = this.aggregatedScores.get(articleId);
            if (!aggregated) return;

            const insights = [];

            // Low trust score
            if (aggregated.scores.trust < 2.5 && aggregated.totalFeedback >= 5) {
                insights.push({
                    type: 'low_trust',
                    severity: 'high',
                    message: 'Article has low trust score',
                    articleId: articleId,
                    score: aggregated.scores.trust
                });
            }

            // Low accuracy score
            if (aggregated.scores.accuracy < 2.5 && aggregated.totalFeedback >= 5) {
                insights.push({
                    type: 'low_accuracy',
                    severity: 'high',
                    message: 'Article accuracy is questioned',
                    articleId: articleId,
                    score: aggregated.scores.accuracy
                });
            }

            // High bias score
            if (aggregated.scores.bias > 3.5 && aggregated.totalFeedback >= 5) {
                insights.push({
                    type: 'high_bias',
                    severity: 'medium',
                    message: 'Article may have bias concerns',
                    articleId: articleId,
                    score: aggregated.scores.bias
                });
            }

            // Dispatch insights for editorial review
            if (insights.length > 0) {
                insights.forEach(insight => {
                    document.dispatchEvent(new CustomEvent('feedback:actionable', {
                        detail: { insight, aggregated }
                    }));

                    this.logFeedback('INSIGHT', `${insight.type}: Article ${articleId}`);
                });

                // Alert editorial governance layer
                if (window.Layer165_EditorialGovernance) {
                    window.Layer165_EditorialGovernance.handleFeedbackInsights(articleId, insights);
                }
            }
        }

        applyTrustIndicators(articleId, aggregated) {
            const articleElement = document.querySelector(`[data-article-id="${articleId}"]`);
            if (!articleElement) return;

            // Remove existing trust indicators
            const existing = articleElement.querySelector('.trust-indicator');
            if (existing) existing.remove();

            // Create trust indicator
            const indicator = this.createTrustIndicator(aggregated);
            articleElement.insertBefore(indicator, articleElement.firstChild);

            // Add CSS class based on overall score
            articleElement.classList.remove('trust-high', 'trust-medium', 'trust-low');
            if (aggregated.overall >= 4) {
                articleElement.classList.add('trust-high');
            } else if (aggregated.overall >= 3) {
                articleElement.classList.add('trust-medium');
            } else {
                articleElement.classList.add('trust-low');
            }
        }

        createTrustIndicator(aggregated) {
            const indicator = document.createElement('div');
            indicator.className = 'trust-indicator';
            indicator.innerHTML = `
                <div class="trust-header">
                    <span class="trust-icon">🤝</span>
                    <span class="trust-title">Reader Trust Score</span>
                </div>
                <div class="trust-metrics">
                    <div class="trust-metric">
                        <span class="metric-label">Trust:</span>
                        <span class="metric-value">${aggregated.scores.trust}/5</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${(aggregated.scores.trust / 5) * 100}%"></div>
                        </div>
                    </div>
                    <div class="trust-metric">
                        <span class="metric-label">Accuracy:</span>
                        <span class="metric-value">${aggregated.scores.accuracy}/5</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${(aggregated.scores.accuracy / 5) * 100}%"></div>
                        </div>
                    </div>
                    <div class="trust-metric">
                        <span class="metric-label">Clarity:</span>
                        <span class="metric-value">${aggregated.scores.clarity}/5</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${(aggregated.scores.clarity / 5) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="trust-footer">
                    <span class="trust-count">Based on ${aggregated.totalFeedback} reader${aggregated.totalFeedback !== 1 ? 's' : ''}</span>
                    ${aggregated.verifiedFeedbackCount > 0 ? `<span class="verified-badge">✓ ${aggregated.verifiedFeedbackCount} verified</span>` : ''}
                </div>
            `;

            return indicator;
        }

        createFeedbackWidgets() {
            // Add feedback button to articles
            const articles = document.querySelectorAll('article, .article, [data-article-id]');

            articles.forEach(article => {
                const articleId = article.getAttribute('data-article-id') || article.id;
                if (!articleId) return;

                const feedbackBtn = document.createElement('button');
                feedbackBtn.className = 'article-feedback-btn';
                feedbackBtn.innerHTML = '🤝 Rate This Article';
                feedbackBtn.addEventListener('click', () => this.showFeedbackForm(articleId));

                article.appendChild(feedbackBtn);
            });
        }

        showFeedbackForm(articleId) {
            // Create modal form
            const modal = document.createElement('div');
            modal.className = 'feedback-modal';
            modal.innerHTML = `
                <div class="feedback-modal-content">
                    <div class="feedback-modal-header">
                        <h3>Rate This Article</h3>
                        <button class="feedback-modal-close">×</button>
                    </div>
                    <form class="feedback-form" id="feedback-form-${articleId}">
                        <div class="feedback-field">
                            <label>Trust</label>
                            <div class="rating-stars" data-field="trust">
                                ${this.createStarRating(5)}
                            </div>
                        </div>
                        <div class="feedback-field">
                            <label>Accuracy</label>
                            <div class="rating-stars" data-field="accuracy">
                                ${this.createStarRating(5)}
                            </div>
                        </div>
                        <div class="feedback-field">
                            <label>Bias (1=unbiased, 5=very biased)</label>
                            <div class="rating-stars" data-field="bias">
                                ${this.createStarRating(5)}
                            </div>
                        </div>
                        <div class="feedback-field">
                            <label>Completeness</label>
                            <div class="rating-stars" data-field="completeness">
                                ${this.createStarRating(5)}
                            </div>
                        </div>
                        <div class="feedback-field">
                            <label>Clarity</label>
                            <div class="rating-stars" data-field="clarity">
                                ${this.createStarRating(5)}
                            </div>
                        </div>
                        <div class="feedback-field">
                            <label>Additional Comments (optional)</label>
                            <textarea name="comment" rows="3" placeholder="Share your thoughts..."></textarea>
                        </div>
                        <div class="feedback-actions">
                            <button type="button" class="btn-cancel">Cancel</button>
                            <button type="submit" class="btn-submit">Submit Feedback</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);

            // Setup star rating interactivity
            this.setupStarRatings(modal);

            // Handle form submission
            const form = modal.querySelector('form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitFeedbackForm(articleId, form);
                modal.remove();
            });

            // Handle close button
            modal.querySelector('.feedback-modal-close').addEventListener('click', () => modal.remove());
            modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());

            // Show modal
            setTimeout(() => modal.classList.add('show'), 10);
        }

        createStarRating(count) {
            return Array.from({ length: count }, (_, i) =>
                `<span class="star" data-value="${i + 1}">★</span>`
            ).join('');
        }

        setupStarRatings(modal) {
            const ratingContainers = modal.querySelectorAll('.rating-stars');

            ratingContainers.forEach(container => {
                const stars = container.querySelectorAll('.star');

                stars.forEach(star => {
                    star.addEventListener('click', () => {
                        const value = parseInt(star.getAttribute('data-value'));
                        container.setAttribute('data-rating', value);

                        stars.forEach((s, idx) => {
                            if (idx < value) {
                                s.classList.add('selected');
                            } else {
                                s.classList.remove('selected');
                            }
                        });
                    });
                });
            });
        }

        submitFeedbackForm(articleId, form) {
            const feedbackData = {
                trust: parseInt(form.querySelector('[data-field="trust"]').getAttribute('data-rating') || 3),
                accuracy: parseInt(form.querySelector('[data-field="accuracy"]').getAttribute('data-rating') || 3),
                bias: parseInt(form.querySelector('[data-field="bias"]').getAttribute('data-rating') || 3),
                completeness: parseInt(form.querySelector('[data-field="completeness"]').getAttribute('data-rating') || 3),
                clarity: parseInt(form.querySelector('[data-field="clarity"]').getAttribute('data-rating') || 3),
                comment: form.querySelector('[name="comment"]').value
            };

            this.collectFeedback(articleId, feedbackData);

            // Show thank you message
            this.showThankYouMessage();
        }

        showThankYouMessage() {
            const message = document.createElement('div');
            message.className = 'feedback-thank-you';
            message.innerHTML = '✅ Thank you for your feedback!';
            document.body.appendChild(message);

            setTimeout(() => message.classList.add('show'), 10);
            setTimeout(() => {
                message.classList.remove('show');
                setTimeout(() => message.remove(), 300);
            }, 3000);
        }

        setupFeedbackCollectors() {
            console.log('🚀 [Layer 170] Setting up feedback collectors...');

            // Listen for published articles
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    // Initialize feedback collection for new article
                    this.feedback.set(event.detail.article.id, []);
                }
            });
        }

        startAggregation() {
            setInterval(() => {
                this.aggregateAllFeedback();
                this.resetHourlyCounters();
            }, CONFIG.intervals.aggregation);
        }

        aggregateAllFeedback() {
            this.feedback.forEach((_, articleId) => {
                this.aggregateArticleFeedback(articleId);
            });
        }

        resetHourlyCounters() {
            this.stats.feedbackThisHour = 0;
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.trustFeedbackStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer170-dashboard';
            dashboard.className = 'layer170-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer170-dashboard-header">
                    <h3>🤝 Reader Trust Feedback</h3>
                    <button class="layer170-close-btn">×</button>
                </div>
                <div class="layer170-dashboard-content">
                    <div class="layer170-stat">
                        <span class="layer170-stat-label">Total Feedback:</span>
                        <span class="layer170-stat-value" id="layer170-total">0</span>
                    </div>
                    <div class="layer170-stat">
                        <span class="layer170-stat-label">Avg Trust:</span>
                        <span class="layer170-stat-value" id="layer170-trust">0</span>
                    </div>
                    <div class="layer170-stat">
                        <span class="layer170-stat-label">Avg Accuracy:</span>
                        <span class="layer170-stat-value" id="layer170-accuracy">0</span>
                    </div>
                    <div class="layer170-log" id="layer170-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer170-toggle-btn';
            toggleBtn.innerHTML = '🤝';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer170-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer170-total');
            const trustEl = document.getElementById('layer170-trust');
            const accuracyEl = document.getElementById('layer170-accuracy');

            if (totalEl) totalEl.textContent = this.stats.totalFeedback;
            if (trustEl) trustEl.textContent = this.stats.avgTrustScore.toFixed(2);
            if (accuracyEl) accuracyEl.textContent = this.stats.avgAccuracyScore.toFixed(2);

            const logEl = document.getElementById('layer170-log');
            if (logEl && this.feedbackLog.length > 0) {
                const recentLogs = this.feedbackLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer170-log-entry">
                        <span class="layer170-log-type">${log.type}</span>
                        <span class="layer170-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logFeedback(type, message) {
            this.feedbackLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.feedbackLog.length > 100) this.feedbackLog.shift();
        }

        getFeedback(articleId) {
            return this.feedback.get(articleId);
        }

        getAggregatedScore(articleId) {
            return this.aggregatedScores.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTrustFeedback);
    } else {
        initTrustFeedback();
    }

    function initTrustFeedback() {
        const feedback = new ReaderTrustFeedback();
        window.Layer170_TrustFeedback = feedback;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.trustFeedback = feedback;
        document.dispatchEvent(new CustomEvent('layer170:ready', { detail: { feedback } }));
        console.log('🎯 [Layer 170] Reader Trust Feedback - Ready');
    }

})();
