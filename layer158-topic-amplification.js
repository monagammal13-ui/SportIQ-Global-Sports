/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 158 – HIGH-IMPACT TOPIC AMPLIFICATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Detects high-impact stories and amplifies their presence across 
 * the entire platform ecosystem.
 * 
 * @version 1.0.0
 * @layer 158
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 158,
        name: 'High-Impact Topic Amplification Engine',

        impactThresholds: {
            breaking: 0.9,
            high: 0.7,
            medium: 0.5,
            low: 0.3
        },

        amplificationChannels: ['homepage', 'category', 'sidebar', 'push', 'social', 'newsletter'],

        intervals: {
            detectionCheck: 3000,
            amplificationUpdate: 10000,
            analyticsUpdate: 30000
        }
    };

    class TopicAmplificationEngine {
        constructor() {
            this.amplifiedTopics = new Map();
            this.impactScores = new Map();
            this.amplificationLog = [];
            this.config = null;
            this.stats = {
                totalAmplified: 0,
                currentlyAmplified: 0,
                averageImpact: 0
            };

            this.init();
        }

        async init() {
            console.log('📢 [Layer 158] High-Impact Topic Amplification - Initializing...');

            try {
                await this.loadConfiguration();
                this.startDetectionEngine();
                this.startAmplificationEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 158] High-Impact Topic Amplification - Active');
                this.logAmplification('SYSTEM', 'Amplification engine initialized');

            } catch (error) {
                console.error('❌ [Layer 158] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer158-topic-amplification.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        detectHighImpact(article) {
            if (!article || !article.id) return null;

            const impactScore = this.calculateImpactScore(article);

            if (impactScore >= CONFIG.impactThresholds.medium) {
                const amplification = {
                    articleId: article.id,
                    impactScore: impactScore,
                    impactLevel: this.getImpactLevel(impactScore),
                    channels: this.determineChannels(impactScore),
                    timestamp: new Date().toISOString()
                };

                this.amplifiedTopics.set(article.id, amplification);
                this.impactScores.set(article.id, impactScore);
                this.stats.totalAmplified++;
                this.stats.currentlyAmplified = this.amplifiedTopics.size;
                this.updateAverageImpact(impactScore);

                this.amplifyTopic(article, amplification);

                this.logAmplification('AMPLIFY', `High-impact story detected: "${article.title}" (Impact: ${(impactScore * 100).toFixed(1)}%)`);

                document.dispatchEvent(new CustomEvent('article:amplified', {
                    detail: { article, amplification }
                }));

                return amplification;
            }

            return null;
        }

        calculateImpactScore(article) {
            let score = 0;

            // Breaking news indicator
            if (article.breaking || article.priority === 'high') score += 0.4;

            // Recency
            const hoursOld = this.getArticleAge(article);
            score += hoursOld < 1 ? 0.3 : hoursOld < 6 ? 0.2 : 0.1;

            // Keywords
            const hasImpactKeywords = this.hasImpactKeywords(article);
            if (hasImpactKeywords) score += 0.2;

            // Social signals (if available)
            if (article.trending) score += 0.1;

            return Math.min(1, score);
        }

        hasImpactKeywords(article) {
            const content = `${article.title} ${article.content}`.toLowerCase();
            const keywords = ['breaking', 'historic', 'record', 'first ever', 'unprecedented', 'shock', 'sensation'];
            return keywords.some(keyword => content.includes(keyword));
        }

        getArticleAge(article) {
            if (!article.publishedAt) return 999;
            return (new Date() - new Date(article.publishedAt)) / (1000 * 60 * 60);
        }

        getImpactLevel(score) {
            if (score >= CONFIG.impactThresholds.breaking) return 'breaking';
            if (score >= CONFIG.impactThresholds.high) return 'high';
            if (score >= CONFIG.impactThresholds.medium) return 'medium';
            return 'low';
        }

        determineChannels(impactScore) {
            const channels = [];

            if (impactScore >= CONFIG.impactThresholds.breaking) {
                return CONFIG.amplificationChannels;
            }

            if (impactScore >= CONFIG.impactThresholds.high) {
                channels.push('homepage', 'category', 'sidebar', 'push');
            } else if (impactScore >= CONFIG.impactThresholds.medium) {
                channels.push('homepage', 'category', 'sidebar');
            }

            return channels;
        }

        amplifyTopic(article, amplification) {
            amplification.channels.forEach(channel => {
                this.amplifyToChannel(article, channel, amplification.impactLevel);
            });
        }

        amplifyToChannel(article, channel, impactLevel) {
            console.log(`📢 [Layer 158] Amplifying to ${channel} (${impactLevel})`);

            switch (channel) {
                case 'homepage':
                    this.amplifyToHomepage(article, impactLevel);
                    break;
                case 'category':
                    this.amplifyToCategory(article, impactLevel);
                    break;
                case 'sidebar':
                    this.amplifyToSidebar(article, impactLevel);
                    break;
                case 'push':
                    this.sendPushNotification(article);
                    break;
                case 'social':
                    this.amplifyToSocial(article);
                    break;
            }
        }

        amplifyToHomepage(article, impactLevel) {
            const container = document.getElementById('main-content-feed');
            if (container) {
                const existing = container.querySelector(`[data-article-id="${article.id}"]`);
                if (existing) {
                    existing.classList.add('amplified', `impact-${impactLevel}`);
                    container.insertBefore(existing, container.firstChild);
                }
            }
        }

        amplifyToCategory(article, impactLevel) {
            const categories = article.categories || [];
            categories.forEach(category => {
                const feed = document.getElementById(`${category}-feed`);
                if (feed) {
                    const existing = feed.querySelector(`[data-article-id="${article.id}"]`);
                    if (existing) {
                        existing.classList.add('amplified', `impact-${impactLevel}`);
                    }
                }
            });
        }

        amplifyToSidebar(article, impactLevel) {
            console.log(`📌 [Layer 158] Adding to sidebar: ${article.title}`);
        }

        sendPushNotification(article) {
            console.log(`🔔 [Layer 158] Push notification: ${article.title}`);
        }

        amplifyToSocial(article) {
            console.log(`📱 [Layer 158] Social amplification: ${article.title}`);
        }

        startDetectionEngine() {
            console.log('🚀 [Layer 158] Starting impact detection...');

            setInterval(() => {
                this.scanForHighImpact();
            }, CONFIG.intervals.detectionCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.detectHighImpact(event.detail.article);
                }
            });
        }

        scanForHighImpact() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.amplifiedTopics.has(article.id)) {
                            this.detectHighImpact(article);
                        }
                    });
                }
            }
        }

        startAmplificationEngine() {
            setInterval(() => {
                this.updateAmplifications();
            }, CONFIG.intervals.amplificationUpdate);
        }

        updateAmplifications() {
            // Decay old amplifications
            this.amplifiedTopics.forEach((amp, articleId) => {
                const age = (new Date() - new Date(amp.timestamp)) / (1000 * 60 * 60);
                if (age > 24) {
                    this.amplifiedTopics.delete(articleId);
                    this.stats.currentlyAmplified = this.amplifiedTopics.size;
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
                window.SPORTIQ.amplificationStats = this.stats;
            }
            this.updateDashboard();
        }

        updateAverageImpact(newImpact) {
            const total = this.stats.averageImpact * (this.stats.totalAmplified - 1) + newImpact;
            this.stats.averageImpact = total / this.stats.totalAmplified;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer158-dashboard';
            dashboard.className = 'layer158-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer158-dashboard-header">
                    <h3>📢 Topic Amplifier</h3>
                    <button class="layer158-close-btn">×</button>
                </div>
                <div class="layer158-dashboard-content">
                    <div class="layer158-stat">
                        <span class="layer158-stat-label">Amplified:</span>
                        <span class="layer158-stat-value" id="layer158-total">0</span>
                    </div>
                    <div class="layer158-stat">
                        <span class="layer158-stat-label">Currently Active:</span>
                        <span class="layer158-stat-value" id="layer158-active">0</span>
                    </div>
                    <div class="layer158-stat">
                        <span class="layer158-stat-label">Avg Impact:</span>
                        <span class="layer158-stat-value" id="layer158-impact">0%</span>
                    </div>
                    <div class="layer158-log" id="layer158-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer158-toggle-btn';
            toggleBtn.innerHTML = '📢';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer158-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer158-total');
            const activeEl = document.getElementById('layer158-active');
            const impactEl = document.getElementById('layer158-impact');

            if (totalEl) totalEl.textContent = this.stats.totalAmplified;
            if (activeEl) activeEl.textContent = this.stats.currentlyAmplified;
            if (impactEl) impactEl.textContent = `${(this.stats.averageImpact * 100).toFixed(1)}%`;

            const logEl = document.getElementById('layer158-log');
            if (logEl && this.amplificationLog.length > 0) {
                const recentLogs = this.amplificationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer158-log-entry">
                        <span class="layer158-log-type">${log.type}</span>
                        <span class="layer158-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logAmplification(type, message) {
            this.amplificationLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.amplificationLog.length > 100) this.amplificationLog.shift();
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAmplifier);
    } else {
        initAmplifier();
    }

    function initAmplifier() {
        const engine = new TopicAmplificationEngine();
        window.Layer158_TopicAmplification = engine;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.topicAmplification = engine;
        document.dispatchEvent(new CustomEvent('layer158:ready', { detail: { engine } }));
        console.log('🎯 [Layer 158] High-Impact Topic Amplification - Ready');
    }

})();
