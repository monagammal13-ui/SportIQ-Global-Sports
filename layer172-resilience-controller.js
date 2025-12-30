/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 172 – PLATFORM RESILIENCE & FAILOVER CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Maintain uptime and graceful degradation during traffic spikes 
 * or failures.
 * 
 * @version 1.0.0
 * @layer 172
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 172,
        name: 'Platform Resilience & Failover Controller',

        thresholds: {
            errorRate: 0.05, // 5%
            responseTime: 3000, // 3 seconds
            memoryUsage: 0.85, // 85%
            cpuUsage: 0.90 // 90%
        },

        intervals: {
            healthCheck: 5000,
            performanceMonitor: 10000,
            analyticsUpdate: 30000
        }
    };

    class ResilienceController {
        constructor() {
            this.healthStatus = 'healthy';
            this.errors = [];
            this.performanceMetrics = [];
            this.failoverLog = [];
            this.config = null;
            this.stats = {
                uptime: 0,
                totalRequests: 0,
                failedRequests: 0,
                avgResponseTime: 0,
                failovers: 0,
                degradations: 0
            };
            this.startTime = Date.now();
            this.degradedMode = false;

            this.init();
        }

        async init() {
            console.log('🛡️ [Layer 172] Resilience Controller - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupErrorHandling();
                this.startHealthMonitoring();
                this.startPerformanceMonitoring();
                this.setupCircuitBreaker();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 172] Resilience Controller - Active');
                this.logResilience('SYSTEM', 'Resilience controller initialized');

            } catch (error) {
                console.error('❌ [Layer 172] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer172-resilience-controller.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupErrorHandling() {
            // Global error handler
            window.addEventListener('error', (event) => {
                this.handleError({
                    type: 'runtime',
                    message: event.message,
                    source: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    timestamp: new Date().toISOString()
                });
            });

            // Promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError({
                    type: 'promise',
                    message: event.reason,
                    timestamp: new Date().toISOString()
                });
            });

            // Resource loading errors
            window.addEventListener('error', (event) => {
                if (event.target !== window) {
                    this.handleResourceError(event.target);
                }
            }, true);
        }

        handleError(error) {
            this.errors.push(error);
            this.stats.failedRequests++;

            // Keep only last 100 errors
            if (this.errors.length > 100) {
                this.errors.shift();
            }

            // Check error rate
            const errorRate = this.calculateErrorRate();
            if (errorRate > CONFIG.thresholds.errorRate) {
                this.triggerDegradedMode('High error rate detected');
            }

            this.logResilience('ERROR', `${error.type}: ${error.message}`);
        }

        handleResourceError(element) {
            const resourceType = element.tagName.toLowerCase();
            const resourceSrc = element.src || element.href;

            this.logResilience('RESOURCE_ERROR', `Failed to load ${resourceType}: ${resourceSrc}`);

            // Attempt failover
            this.attemptResourceFailover(element, resourceSrc);
        }

        attemptResourceFailover(element, failedSrc) {
            // Try CDN fallback
            if (failedSrc && !failedSrc.includes('cdn-fallback')) {
                const fallbackSrc = failedSrc.replace(/^(https?:\/\/[^\/]+)/, '$1/cdn-fallback');

                if (element.tagName === 'SCRIPT') {
                    const newScript = document.createElement('script');
                    newScript.src = fallbackSrc;
                    newScript.async = element.async;
                    element.parentNode.replaceChild(newScript, element);

                    this.stats.failovers++;
                    this.logResilience('FAILOVER', `Script failover: ${failedSrc} → ${fallbackSrc}`);
                } else if (element.tagName === 'LINK') {
                    element.href = fallbackSrc;
                    this.stats.failovers++;
                }
            }
        }

        calculateErrorRate() {
            if (this.stats.totalRequests === 0) return 0;
            return this.stats.failedRequests / this.stats.totalRequests;
        }

        startHealthMonitoring() {
            console.log('🚀 [Layer 172] Starting health monitoring...');

            setInterval(() => {
                this.checkHealth();
            }, CONFIG.intervals.healthCheck);
        }

        checkHealth() {
            const health = {
                timestamp: new Date().toISOString(),
                status: 'healthy',
                checks: []
            };

            // Check error rate
            const errorRate = this.calculateErrorRate();
            health.checks.push({
                name: 'Error Rate',
                status: errorRate < CONFIG.thresholds.errorRate ? 'pass' : 'fail',
                value: `${(errorRate * 100).toFixed(2)}%`,
                threshold: `${(CONFIG.thresholds.errorRate * 100)}%`
            });

            // Check response time
            const avgResponseTime = this.getAverageResponseTime();
            health.checks.push({
                name: 'Response Time',
                status: avgResponseTime < CONFIG.thresholds.responseTime ? 'pass' : 'fail',
                value: `${avgResponseTime}ms`,
                threshold: `${CONFIG.thresholds.responseTime}ms`
            });

            // Check memory usage (if available)
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                health.checks.push({
                    name: 'Memory Usage',
                    status: memoryUsage < CONFIG.thresholds.memoryUsage ? 'pass' : 'fail',
                    value: `${(memoryUsage * 100).toFixed(2)}%`,
                    threshold: `${(CONFIG.thresholds.memoryUsage * 100)}%`
                });

                if (memoryUsage > CONFIG.thresholds.memoryUsage) {
                    this.triggerDegradedMode('High memory usage');
                }
            }

            // Determine overall health status
            const failedChecks = health.checks.filter(c => c.status === 'fail');
            if (failedChecks.length > 0) {
                health.status = 'degraded';
                this.healthStatus = 'degraded';
            } else {
                health.status = 'healthy';
                this.healthStatus = 'healthy';
                this.degradedMode = false;
            }

            document.dispatchEvent(new CustomEvent('health:checked', {
                detail: health
            }));
        }

        startPerformanceMonitoring() {
            setInterval(() => {
                this.collectPerformanceMetrics();
            }, CONFIG.intervals.performanceMonitor);

            // Monitor long tasks
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) { // Tasks longer than 50ms
                                this.logResilience('LONG_TASK', `Long task detected: ${entry.duration.toFixed(2)}ms`);
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    // Long task API not supported
                }
            }
        }

        collectPerformanceMetrics() {
            const metrics = {
                timestamp: new Date().toISOString(),
                navigation: null,
                resources: []
            };

            // Navigation timing
            if (performance.timing) {
                const timing = performance.timing;
                metrics.navigation = {
                    loadTime: timing.loadEventEnd - timing.navigationStart,
                    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                    responseTime: timing.responseEnd - timing.requestStart
                };
            }

            // Resource timing
            if (performance.getEntriesByType) {
                const resources = performance.getEntriesByType('resource');
                metrics.resources = resources.slice(-10).map(r => ({
                    name: r.name,
                    duration: r.duration,
                    size: r.transferSize
                }));
            }

            this.performanceMetrics.push(metrics);
            if (this.performanceMetrics.length > 50) {
                this.performanceMetrics.shift();
            }
        }

        getAverageResponseTime() {
            if (this.performanceMetrics.length === 0) return 0;

            const times = this.performanceMetrics
                .filter(m => m.navigation && m.navigation.responseTime)
                .map(m => m.navigation.responseTime);

            if (times.length === 0) return 0;

            return times.reduce((a, b) => a + b, 0) / times.length;
        }

        setupCircuitBreaker() {
            this.circuitBreaker = {
                state: 'closed', // closed, open, half-open
                failureCount: 0,
                failureThreshold: 5,
                timeout: 60000, // 1 minute
                lastFailureTime: null
            };
        }

        checkCircuitBreaker(operation) {
            const cb = this.circuitBreaker;

            if (cb.state === 'open') {
                // Check if timeout has elapsed
                if (Date.now() - cb.lastFailureTime > cb.timeout) {
                    cb.state = 'half-open';
                    this.logResilience('CIRCUIT_BREAKER', 'Circuit breaker moved to half-open');
                } else {
                    throw new Error('Circuit breaker is open - operation blocked');
                }
            }

            return true;
        }

        recordCircuitBreakerSuccess() {
            const cb = this.circuitBreaker;
            if (cb.state === 'half-open') {
                cb.state = 'closed';
                cb.failureCount = 0;
                this.logResilience('CIRCUIT_BREAKER', 'Circuit breaker closed');
            }
        }

        recordCircuitBreakerFailure() {
            const cb = this.circuitBreaker;
            cb.failureCount++;
            cb.lastFailureTime = Date.now();

            if (cb.failureCount >= cb.failureThreshold) {
                cb.state = 'open';
                this.logResilience('CIRCUIT_BREAKER', 'Circuit breaker opened');
                this.triggerDegradedMode('Circuit breaker tripped');
            }
        }

        triggerDegradedMode(reason) {
            if (this.degradedMode) return; // Already in degraded mode

            this.degradedMode = true;
            this.stats.degradations++;

            this.logResilience('DEGRADED_MODE', `Entering degraded mode: ${reason}`);

            // Disable non-essential features
            this.disableNonEssentialFeatures();

            // Notify other layers
            document.dispatchEvent(new CustomEvent('platform:degraded', {
                detail: { reason, timestamp: new Date().toISOString() }
            }));

            // Show user notification
            this.showDegradedModeNotification();

            // Attempt recovery after timeout
            setTimeout(() => {
                this.attemptRecovery();
            }, 30000); // 30 seconds
        }

        disableNonEssentialFeatures() {
            // Disable animations
            document.body.classList.add('reduced-motion');

            // Reduce polling intervals
            document.dispatchEvent(new CustomEvent('platform:reduceActivity'));

            this.logResilience('OPTIMIZATION', 'Non-essential features disabled');
        }

        attemptRecovery() {
            this.logResilience('RECOVERY', 'Attempting recovery...');

            // Re-enable features gradually
            document.body.classList.remove('reduced-motion');

            // Check if health has improved
            this.checkHealth();

            if (this.healthStatus === 'healthy') {
                this.degradedMode = false;
                this.logResilience('RECOVERY', 'Recovery successful - normal operation resumed');

                document.dispatchEvent(new CustomEvent('platform:recovered'));
                this.hideDegradedModeNotification();
            } else {
                // Try again later
                setTimeout(() => this.attemptRecovery(), 30000);
            }
        }

        showDegradedModeNotification() {
            const notification = document.createElement('div');
            notification.id = 'degraded-mode-notification';
            notification.className = 'degraded-notification';
            notification.innerHTML = `
                <div class="degraded-icon">⚠️</div>
                <div class="degraded-message">
                    <strong>Limited Functionality</strong>
                    <p>Some features are temporarily disabled to maintain performance.</p>
                </div>
            `;
            document.body.appendChild(notification);
        }

        hideDegradedModeNotification() {
            const notification = document.getElementById('degraded-mode-notification');
            if (notification) {
                notification.remove();
            }
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.uptime = Date.now() - this.startTime;
            this.stats.lastUpdate = new Date().toISOString();

            if (window.SPORTIQ) {
                window.SPORTIQ.resilienceStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer172-dashboard';
            dashboard.className = 'layer172-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer172-dashboard-header">
                    <h3>🛡️ Resilience Controller</h3>
                    <button class="layer172-close-btn">×</button>
                </div>
                <div class="layer172-dashboard-content">
                    <div class="layer172-stat">
                        <span class="layer172-stat-label">Health:</span>
                        <span class="layer172-stat-value" id="layer172-health">Healthy</span>
                    </div>
                    <div class="layer172-stat">
                        <span class="layer172-stat-label">Uptime:</span>
                        <span class="layer172-stat-value" id="layer172-uptime">0s</span>
                    </div>
                    <div class="layer172-stat">
                        <span class="layer172-stat-label">Failovers:</span>
                        <span class="layer172-stat-value" id="layer172-failovers">0</span>
                    </div>
                    <div class="layer172-stat">
                        <span class="layer172-stat-label">Error Rate:</span>
                        <span class="layer172-stat-value" id="layer172-errors">0%</span>
                    </div>
                    <div class="layer172-log" id="layer172-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer172-toggle-btn';
            toggleBtn.innerHTML = '🛡️';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer172-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const healthEl = document.getElementById('layer172-health');
            const uptimeEl = document.getElementById('layer172-uptime');
            const failoversEl = document.getElementById('layer172-failovers');
            const errorsEl = document.getElementById('layer172-errors');

            if (healthEl) healthEl.textContent = this.healthStatus;
            if (uptimeEl) uptimeEl.textContent = this.formatUptime(this.stats.uptime);
            if (failoversEl) failoversEl.textContent = this.stats.failovers;
            if (errorsEl) errorsEl.textContent = `${(this.calculateErrorRate() * 100).toFixed(2)}%`;

            const logEl = document.getElementById('layer172-log');
            if (logEl && this.failoverLog.length > 0) {
                const recentLogs = this.failoverLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer172-log-entry">
                        <span class="layer172-log-type">${log.type}</span>
                        <span class="layer172-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        formatUptime(ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            if (hours > 0) return `${hours}h ${minutes % 60}m`;
            if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
            return `${seconds}s`;
        }

        logResilience(type, message) {
            this.failoverLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.failoverLog.length > 100) this.failoverLog.shift();
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initResilienceController);
    } else {
        initResilienceController();
    }

    function initResilienceController() {
        const controller = new ResilienceController();
        window.Layer172_ResilienceController = controller;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.resilienceController = controller;
        document.dispatchEvent(new CustomEvent('layer172:ready', { detail: { controller } }));
        console.log('🎯 [Layer 172] Resilience Controller - Ready');
    }

})();
