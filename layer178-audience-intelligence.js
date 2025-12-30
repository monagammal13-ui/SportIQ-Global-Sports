/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 178 – AUDIENCE INTELLIGENCE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Analyze global audience behavior to improve relevance.
 * 
 * @version 1.0.0
 * @layer 178
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 178,
        name: 'Audience Intelligence Engine',

        metrics: ['engagement', 'retention', 'preferences', 'behavior', 'demographics'],

        intervals: {
            behaviorTracking: 5000,
            insightGeneration: 60000,
            analyticsUpdate: 30000
        }
    };

    class AudienceIntelligence {
        constructor() {
            this.audienceProfiles = new Map();
            this.behaviorPatterns = new Map();
            this.insights = [];
            this.config = null;
            this.stats = {
                totalUsers: 0,
                activeUsers: 0,
                avgEngagement: 0,
                topContent: [],
                audienceSegments: 0
            };

            this.init();
        }

        async init() {
            console.log('👥 [Layer 178] Audience Intelligence - Initializing...');

            try {
                await this.loadConfiguration();
                this.startBehaviorTracking();
                this.startInsightGeneration();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 178] Audience Intelligence - Active');
                this.logIntelligence('SYSTEM', 'Audience intelligence engine initialized');

            } catch (error) {
                console.error('❌ [Layer 178] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer178-audience-intelligence.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        trackBehavior(userId, action, data) {
            try {
                const behavior = {
                    userId: userId || 'anonymous',
                    action: action,
                    data: data,
                    timestamp: new Date().toISOString(),
                    sessionId: this.getSessionId()
                };

                // Get or create user profile
                let profile = this.audienceProfiles.get(behavior.userId);
                if (!profile) {
                    profile = this.createUserProfile(behavior.userId);
                    this.audienceProfiles.set(behavior.userId, profile);
                    this.stats.totalUsers++;
                }

                // Update profile with behavior
                this.updateProfile(profile, behavior);

                // Detect patterns
                this.detectPatterns(profile, behavior);

                document.dispatchEvent(new CustomEvent('audience:behavior', {
                    detail: { behavior, profile }
                }));

                return behavior;

            } catch (error) {
                console.error(`❌ [Layer 178] Behavior tracking failed:`, error);
                return null;
            }
        }

        createUserProfile(userId) {
            return {
                userId: userId,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                sessions: 0,
                totalActions: 0,
                preferences: {
                    categories: {},
                    contentTypes: {},
                    timeOfDay: {}
                },
                engagement: {
                    avgSessionDuration: 0,
                    articlesRead: 0,
                    interactions: 0
                },
                demographics: {
                    location: null,
                    device: this.detectDevice(),
                    language: navigator.language || 'en'
                }
            };
        }

        detectDevice() {
            const ua = navigator.userAgent;
            if (/mobile/i.test(ua)) return 'mobile';
            if (/tablet/i.test(ua)) return 'tablet';
            return 'desktop';
        }

        getSessionId() {
            let sessionId = sessionStorage.getItem('sportiq_session_id');
            if (!sessionId) {
                sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('sportiq_session_id', sessionId);
            }
            return sessionId;
        }

        updateProfile(profile, behavior) {
            profile.lastActive = behavior.timestamp;
            profile.totalActions++;

            // Update based on action type
            switch (behavior.action) {
                case 'article_view':
                    profile.engagement.articlesRead++;
                    this.updateCategoryPreference(profile, behavior.data.category);
                    break;
                case 'article_click':
                    profile.engagement.interactions++;
                    break;
                case 'share':
                    profile.engagement.interactions++;
                    break;
                case 'comment':
                    profile.engagement.interactions++;
                    break;
            }

            // Update time of day preference
            const hour = new Date().getHours();
            const timeSlot = this.getTimeSlot(hour);
            profile.preferences.timeOfDay[timeSlot] = (profile.preferences.timeOfDay[timeSlot] || 0) + 1;
        }

        updateCategoryPreference(profile, category) {
            if (!category) return;
            profile.preferences.categories[category] = (profile.preferences.categories[category] || 0) + 1;
        }

        getTimeSlot(hour) {
            if (hour >= 6 && hour < 12) return 'morning';
            if (hour >= 12 && hour < 17) return 'afternoon';
            if (hour >= 17 && hour < 21) return 'evening';
            return 'night';
        }

        detectPatterns(profile, behavior) {
            // Detect reading patterns
            const categories = Object.entries(profile.preferences.categories);
            if (categories.length > 0) {
                const topCategory = categories.sort((a, b) => b[1] - a[1])[0];
                if (topCategory[1] > 5) { // More than 5 articles in one category
                    this.recordPattern({
                        userId: profile.userId,
                        type: 'category_preference',
                        pattern: `User prefers ${topCategory[0]} content`,
                        confidence: Math.min(topCategory[1] / 10, 1)
                    });
                }
            }

            // Detect engagement level
            const engagementRate = profile.engagement.interactions / Math.max(profile.engagement.articlesRead, 1);
            if (engagementRate > 0.5) {
                this.recordPattern({
                    userId: profile.userId,
                    type: 'high_engagement',
                    pattern: 'User shows high engagement',
                    confidence: engagementRate
                });
            }
        }

        recordPattern(pattern) {
            pattern.timestamp = new Date().toISOString();
            this.behaviorPatterns.set(`${pattern.userId}-${pattern.type}`, pattern);
        }

        generateInsights() {
            const insights = [];

            // Analyze all profiles
            const profiles = Array.from(this.audienceProfiles.values());

            if (profiles.length > 0) {
                // Content preference insights
                const categoryPreferences = this.aggregateCategoryPreferences(profiles);
                insights.push({
                    type: 'content_preference',
                    insight: `Top content categories: ${categoryPreferences.slice(0, 3).map(c => c[0]).join(', ')}`,
                    data: categoryPreferences,
                    actionable: true,
                    recommendation: 'Focus more content on these categories'
                });

                // Device insights
                const deviceBreakdown = this.analyzeDeviceBreakdown(profiles);
                insights.push({
                    type: 'device_usage',
                    insight: `Primary device: ${deviceBreakdown[0]?.[0] || 'desktop'}`,
                    data: deviceBreakdown,
                    actionable: true,
                    recommendation: 'Optimize user experience for this device type'
                });

                // Time of day insights
                const timePreferences = this.analyzeTimePreferences(profiles);
                insights.push({
                    type: 'timing',
                    insight: `Peak engagement: ${timePreferences[0]?.[0] || 'evening'}`,
                    data: timePreferences,
                    actionable: true,
                    recommendation: 'Schedule content releases during peak times'
                });

                // Engagement insights
                const avgEngagement = this.calculateAverageEngagement(profiles);
                insights.push({
                    type: 'engagement',
                    insight: `Average engagement rate: ${(avgEngagement * 100).toFixed(1)}%`,
                    data: { engagementRate: avgEngagement },
                    actionable: avgEngagement < 0.3,
                    recommendation: avgEngagement < 0.3 ? 'Improve content interactivity' : 'Maintain current engagement strategies'
                });
            }

            // Store insights
            this.insights = insights;

            // Dispatch insights event
            document.dispatchEvent(new CustomEvent('audience:insights', {
                detail: { insights }
            }));

            return insights;
        }

        aggregateCategoryPreferences(profiles) {
            const allCategories = {};

            profiles.forEach(profile => {
                Object.entries(profile.preferences.categories).forEach(([cat, count]) => {
                    allCategories[cat] = (allCategories[cat] || 0) + count;
                });
            });

            return Object.entries(allCategories).sort((a, b) => b[1] - a[1]);
        }

        analyzeDeviceBreakdown(profiles) {
            const devices = {};

            profiles.forEach(profile => {
                const device = profile.demographics.device;
                devices[device] = (devices[device] || 0) + 1;
            });

            return Object.entries(devices).sort((a, b) => b[1] - a[1]);
        }

        analyzeTimePreferences(profiles) {
            const timeSlots = {};

            profiles.forEach(profile => {
                Object.entries(profile.preferences.timeOfDay).forEach(([slot, count]) => {
                    timeSlots[slot] = (timeSlots[slot] || 0) + count;
                });
            });

            return Object.entries(timeSlots).sort((a, b) => b[1] - a[1]);
        }

        calculateAverageEngagement(profiles) {
            if (profiles.length === 0) return 0;

            const totalEngagement = profiles.reduce((sum, profile) => {
                const rate = profile.engagement.interactions / Math.max(profile.engagement.articlesRead, 1);
                return sum + rate;
            }, 0);

            return totalEngagement / profiles.length;
        }

        segmentAudience() {
            const profiles = Array.from(this.audienceProfiles.values());
            const segments = {
                'highly_engaged': [],
                'casual_readers': [],
                'new_users': [],
                'at_risk': []
            };

            profiles.forEach(profile => {
                // Highly engaged: >10 articles read and >5 interactions
                if (profile.engagement.articlesRead > 10 && profile.engagement.interactions > 5) {
                    segments.highly_engaged.push(profile.userId);
                }
                // Casual readers: 3-10 articles, low interaction
                else if (profile.engagement.articlesRead >= 3 && profile.engagement.articlesRead <= 10) {
                    segments.casual_readers.push(profile.userId);
                }
                // New users: <3 articles
                else if (profile.engagement.articlesRead < 3) {
                    segments.new_users.push(profile.userId);
                }
                // At risk: haven't been active in 7+ days
                else {
                    const daysSinceActive = (Date.now() - new Date(profile.lastActive).getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSinceActive > 7) {
                        segments.at_risk.push(profile.userId);
                    }
                }
            });

            this.stats.audienceSegments = Object.keys(segments).length;
            return segments;
        }

        startBehaviorTracking() {
            console.log('🚀 [Layer 178] Starting behavior tracking...');

            // Track page views
            document.addEventListener('article:view', (event) => {
                if (event.detail && event.detail.article) {
                    this.trackBehavior(null, 'article_view', {
                        articleId: event.detail.article.id,
                        category: event.detail.article.category
                    });
                }
            });

            // Track clicks
            document.addEventListener('click', (event) => {
                const link = event.target.closest('a');
                if (link && link.href) {
                    this.trackBehavior(null, 'article_click', {
                        url: link.href
                    });
                }
            });

            // Track session duration
            setInterval(() => {
                this.updateActiveUsers();
            }, CONFIG.intervals.behaviorTracking);
        }

        updateActiveUsers() {
            const now = Date.now();
            const activeThreshold = 5 * 60 * 1000; // 5 minutes

            let activeCount = 0;
            this.audienceProfiles.forEach(profile => {
                const lastActive = new Date(profile.lastActive).getTime();
                if (now - lastActive < activeThreshold) {
                    activeCount++;
                }
            });

            this.stats.activeUsers = activeCount;
        }

        startInsightGeneration() {
            setInterval(() => {
                this.generateInsights();
            }, CONFIG.intervals.insightGeneration);
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            const profiles = Array.from(this.audienceProfiles.values());
            this.stats.avgEngagement = this.calculateAverageEngagement(profiles);

            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.audienceIntelligenceStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer178-dashboard';
            dashboard.className = 'layer178-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer178-dashboard-header">
                    <h3>👥 Audience Intelligence</h3>
                    <button class="layer178-close-btn">×</button>
                </div>
                <div class="layer178-dashboard-content">
                    <div class="layer178-stat">
                        <span class="layer178-stat-label">Total Users:</span>
                        <span class="layer178-stat-value" id="layer178-total">0</span>
                    </div>
                    <div class="layer178-stat">
                        <span class="layer178-stat-label">Active:</span>
                        <span class="layer178-stat-value" id="layer178-active">0</span>
                    </div>
                    <div class="layer178-stat">
                        <span class="layer178-stat-label">Engagement:</span>
                        <span class="layer178-stat-value" id="layer178-engagement">0%</span>
                    </div>
                    <div class="layer178-insights" id="layer178-insights"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer178-toggle-btn';
            toggleBtn.innerHTML = '👥';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer178-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer178-total');
            const activeEl = document.getElementById('layer178-active');
            const engagementEl = document.getElementById('layer178-engagement');

            if (totalEl) totalEl.textContent = this.stats.totalUsers;
            if (activeEl) activeEl.textContent = this.stats.activeUsers;
            if (engagementEl) engagementEl.textContent = `${(this.stats.avgEngagement * 100).toFixed(1)}%`;

            const insightsEl = document.getElementById('layer178-insights');
            if (insightsEl && this.insights.length > 0) {
                insightsEl.innerHTML = '<h4>Latest Insights:</h4>' +
                    this.insights.slice(0, 3).map(insight => `
                        <div class="insight-item">
                            <strong>${insight.type}:</strong>
                            <p>${insight.insight}</p>
                        </div>
                    `).join('');
            }
        }

        logIntelligence(type, message) {
            // Can add logging if needed
        }

        getUserProfile(userId) {
            return this.audienceProfiles.get(userId);
        }

        getInsights() {
            return [...this.insights];
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAudienceIntelligence);
    } else {
        initAudienceIntelligence();
    }

    function initAudienceIntelligence() {
        const intelligence = new AudienceIntelligence();
        window.Layer178_AudienceIntelligence = intelligence;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.audienceIntelligence = intelligence;

        // Auto-track behavior
        window.SPORTIQ.trackBehavior = (action, data) => intelligence.trackBehavior(null, action, data);

        document.dispatchEvent(new CustomEvent('layer178:ready', { detail: { intelligence } }));
        console.log('🎯 [Layer 178] Audience Intelligence Engine - Ready');
    }

})();
