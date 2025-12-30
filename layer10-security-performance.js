/**
 * Layer 10: Security & Performance Runtime
 * ID: layer-010
 * Type: Core
 * Description: Security hardening, performance optimization, rate limiting, XSS/CSRF protection, and monitoring.
 */

class SecurityPerformanceRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_SECURITY__) {
            console.warn('[Security] Security runtime already initialized.');
            return window.__ANTIGRAVITY_SECURITY__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-010';
        this.name = 'Security & Performance Runtime';
        this.timestamp = new Date().toISOString();

        // Security configuration
        this.config = null;
        this.csp = null;
        this.rateLimit = new Map();
        this.blockedIPs = new Set();
        this.suspiciousActivity = [];

        // Performance monitoring
        this.performanceMetrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            timeToInteractive: 0,
            totalBlockingTime: 0,
            cumulativeLayoutShift: 0
        };

        // Resource monitoring
        this.resourceMetrics = {
            totalResources: 0,
            loadedResources: 0,
            failedResources: 0,
            totalSize: 0,
            cacheHits: 0
        };

        // Security threats
        this.threats = {
            xssAttempts: 0,
            csrfAttempts: 0,
            rateLimitViolations: 0,
            suspiciousRequests: 0,
            blockedRequests: 0
        };

        console.log(`[Security v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize security and performance systems
     */
    async _init() {
        try {
            await this._loadConfig();
            this._setupCSP();
            this._setupSecurityHeaders();
            this._setupXSSProtection();
            this._setupCSRFProtection();
            this._setupRateLimiting();
            this._setupPerformanceMonitoring();
            this._setupResourceMonitoring();
            this._setupClickjackingProtection();
            this._sanitizeDOM();
            this._registerEvents();
            console.log('[Security] Initialized successfully');
        } catch (error) {
            console.error('[Security] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'security:init');
            }
        }
    }

    /**
     * Load configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/security-config.json');
            if (response.ok) {
                this.config = await response.json();
                console.log('[Security] Configuration loaded');
            } else {
                this.config = this._getDefaultConfig();
            }
        } catch (error) {
            console.warn('[Security] Using default configuration:', error);
            this.config = this._getDefaultConfig();
        }
    }

    /**
     * Default configuration
     */
    _getDefaultConfig() {
        return {
            csp: {
                enabled: true,
                directives: {
                    'default-src': ["'self'"],
                    'script-src': ["'self'", "'unsafe-inline'"],
                    'style-src': ["'self'", "'unsafe-inline'"],
                    'img-src': ["'self'", 'data:', 'https:'],
                    'font-src': ["'self'", 'data:'],
                    'connect-src': ["'self'"],
                    'frame-ancestors': ["'none'"],
                    'base-uri': ["'self'"],
                    'form-action': ["'self'"]
                }
            },
            rateLimit: {
                enabled: true,
                maxRequests: 100,
                windowMs: 60000,
                blockDuration: 300000
            },
            xss: {
                enabled: true,
                sanitizeInputs: true,
                escapeOutputs: true
            },
            csrf: {
                enabled: true,
                tokenName: 'csrf_token',
                headerName: 'X-CSRF-Token'
            },
            performance: {
                monitoring: true,
                resourceHints: true,
                lazyLoad: true,
                compression: true
            }
        };
    }

    /**
     * Setup Content Security Policy
     */
    _setupCSP() {
        if (!this.config.csp.enabled) return;

        const directives = [];
        for (const [key, values] of Object.entries(this.config.csp.directives)) {
            directives.push(`${key} ${values.join(' ')}`);
        }

        const cspHeader = directives.join('; ');

        // Add CSP meta tag
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = cspHeader;
        document.head.appendChild(meta);

        this.csp = cspHeader;
        console.log('[Security] CSP enabled');
    }

    /**
     * Setup security headers (via meta tags where possible)
     */
    _setupSecurityHeaders() {
        // X-Content-Type-Options
        this._addMetaTag('http-equiv', 'X-Content-Type-Options', 'nosniff');

        // X-Frame-Options
        this._addMetaTag('http-equiv', 'X-Frame-Options', 'DENY');

        // Referrer-Policy
        this._addMetaTag('name', 'referrer', 'strict-origin-when-cross-origin');

        // Permissions-Policy
        const permissionsPolicy = 'geolocation=(), microphone=(), camera=()';
        this._addMetaTag('http-equiv', 'Permissions-Policy', permissionsPolicy);

        console.log('[Security] Security headers configured');
    }

    /**
     * Add meta tag helper
     */
    _addMetaTag(attribute, key, value) {
        let meta = document.querySelector(`meta[${attribute}="${key}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, key);
            document.head.appendChild(meta);
        }
        meta.content = value;
    }

    /**
     * XSS Protection
     */
    _setupXSSProtection() {
        if (!this.config.xss.enabled) return;

        // Monitor for potential XSS in forms
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    if (this._detectXSS(input.value)) {
                        e.preventDefault();
                        this.threats.xssAttempts++;
                        this._emitThreat('xss', { value: input.value });
                        alert('Potential XSS detected. Request blocked.');
                    }
                });
            }
        });

        console.log('[Security] XSS protection enabled');
    }

    /**
     * Detect XSS patterns
     */
    _detectXSS(value) {
        if (!value) return false;

        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /eval\(/gi,
            /expression\(/gi
        ];

        return xssPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Sanitize string
     */
    sanitize(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * CSRF Protection
     */
    _setupCSRFProtection() {
        if (!this.config.csrf.enabled) return;

        // Generate CSRF token
        this.csrfToken = this._generateCSRFToken();

        // Store in meta tag
        this._addMetaTag('name', this.config.csrf.tokenName, this.csrfToken);

        // Add to all forms
        document.addEventListener('DOMContentLoaded', () => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                if (!form.querySelector(`input[name="${this.config.csrf.tokenName}"]`)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = this.config.csrf.tokenName;
                    input.value = this.csrfToken;
                    form.appendChild(input);
                }
            });
        });

        console.log('[Security] CSRF protection enabled');
    }

    /**
     * Generate CSRF token
     */
    _generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verify CSRF token
     */
    verifyCSRFToken(token) {
        return token === this.csrfToken;
    }

    /**
     * Rate Limiting
     */
    _setupRateLimiting() {
        if (!this.config.rateLimit.enabled) return;

        // Monitor API calls
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.on('api:*', () => {
                this._checkRateLimit('api');
            });
        }

        console.log('[Security] Rate limiting enabled');
    }

    /**
     * Check rate limit
     */
    _checkRateLimit(key) {
        const now = Date.now();
        const record = this.rateLimit.get(key) || { count: 0, resetTime: now + this.config.rateLimit.windowMs };

        // Reset if window expired
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + this.config.rateLimit.windowMs;
        }

        record.count++;

        // Check if limit exceeded
        if (record.count > this.config.rateLimit.maxRequests) {
            this.threats.rateLimitViolations++;
            this._emitThreat('rate-limit', { key, count: record.count });
            return false;
        }

        this.rateLimit.set(key, record);
        return true;
    }

    /**
     * Clickjacking Protection
     */
    _setupClickjackingProtection() {
        // Framebusting code
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }

        console.log('[Security] Clickjacking protection enabled');
    }

    /**
     * Sanitize DOM on load
     */
    _sanitizeDOM() {
        // Remove any potentially dangerous attributes
        const dangerousAttrs = ['onerror', 'onload', 'onclick', 'onmouseover'];

        document.addEventListener('DOMContentLoaded', () => {
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                dangerousAttrs.forEach(attr => {
                    if (el.hasAttribute(attr)) {
                        el.removeAttribute(attr);
                        this.threats.xssAttempts++;
                    }
                });
            });
        });
    }

    /**
     * Performance Monitoring
     */
    _setupPerformanceMonitoring() {
        if (!this.config.performance.monitoring) return;

        // Navigation Timing
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.performanceMetrics.pageLoadTime = perfData.loadEventEnd - perfData.fetchStart;
                    this.performanceMetrics.domContentLoaded = perfData.domContentLoadedEventEnd - perfData.fetchStart;
                }

                // Paint Timing
                const paintEntries = performance.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    if (entry.name === 'first-paint') {
                        this.performanceMetrics.firstPaint = entry.startTime;
                    } else if (entry.name === 'first-contentful-paint') {
                        this.performanceMetrics.firstContentfulPaint = entry.startTime;
                    }
                });

                // Largest Contentful Paint
                if ('PerformanceObserver' in window) {
                    const lcpObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        this.performanceMetrics.largestContentfulPaint = lastEntry.startTime;
                    });
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                    // Cumulative Layout Shift
                    const clsObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                this.performanceMetrics.cumulativeLayoutShift += entry.value;
                            }
                        }
                    });
                    clsObserver.observe({ entryTypes: ['layout-shift'] });
                }

                this._emitEvent('performance:metrics-collected', this.performanceMetrics);
            }, 0);
        });

        console.log('[Security] Performance monitoring enabled');
    }

    /**
     * Resource Monitoring
     */
    _setupResourceMonitoring() {
        const resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.resourceMetrics.totalResources++;
                this.resourceMetrics.totalSize += entry.transferSize || 0;

                if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
                    this.resourceMetrics.cacheHits++;
                }

                if (entry.responseStatus === 0 || entry.responseStatus >= 400) {
                    this.resourceMetrics.failedResources++;
                } else {
                    this.resourceMetrics.loadedResources++;
                }
            }
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
        console.log('[Security] Resource monitoring enabled');
    }

    /**
     * Emit security threat
     */
    _emitThreat(type, data) {
        this.suspiciousActivity.push({
            type,
            data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });

        // Keep only last 100 threats
        if (this.suspiciousActivity.length > 100) {
            this.suspiciousActivity.shift();
        }

        this._emitEvent('security:threat-detected', { type, data });

        // Log to runtime
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.logError(new Error(`Security threat: ${type}`), 'security:threat');
        }
    }

    /**
     * Event bus integration
     */
    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerEvents() {
        if (!window.__ANTIGRAVITY_EVENT_BUS__) return;

        const eventBus = window.__ANTIGRAVITY_EVENT_BUS__;

        // Listen for potential threats
        eventBus.on('api:request-error', (data) => {
            if (data.status === 401 || data.status === 403) {
                this.threats.suspiciousRequests++;
            }
        });
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            cspEnabled: !!this.csp,
            csrfToken: !!this.csrfToken,
            threats: { ...this.threats },
            suspiciousActivity: this.suspiciousActivity.length,
            rateLimits: this.rateLimit.size,
            blockedIPs: this.blockedIPs.size
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            resources: { ...this.resourceMetrics },
            score: this._calculatePerformanceScore()
        };
    }

    /**
     * Calculate performance score (0-100)
     */
    _calculatePerformanceScore() {
        let score = 100;

        // Page load time penalty
        if (this.performanceMetrics.pageLoadTime > 3000) score -= 20;
        else if (this.performanceMetrics.pageLoadTime > 2000) score -= 10;

        // FCP penalty
        if (this.performanceMetrics.firstContentfulPaint > 2000) score -= 15;
        else if (this.performanceMetrics.firstContentfulPaint > 1000) score -= 5;

        // LCP penalty
        if (this.performanceMetrics.largestContentfulPaint > 2500) score -= 20;
        else if (this.performanceMetrics.largestContentfulPaint > 1500) score -= 10;

        // CLS penalty
        if (this.performanceMetrics.cumulativeLayoutShift > 0.25) score -= 15;
        else if (this.performanceMetrics.cumulativeLayoutShift > 0.1) score -= 5;

        // Failed resources penalty
        const failureRate = this.resourceMetrics.failedResources / this.resourceMetrics.totalResources;
        if (failureRate > 0.1) score -= 20;
        else if (failureRate > 0.05) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Enable security feature
     */
    enableFeature(feature) {
        if (this.config[feature]) {
            this.config[feature].enabled = true;
            console.log(`[Security] ${feature} enabled`);
        }
    }

    /**
     * Disable security feature
     */
    disableFeature(feature) {
        if (this.config[feature]) {
            this.config[feature].enabled = false;
            console.log(`[Security] ${feature} disabled`);
        }
    }

    /**
     * Get state
     */
    getState() {
        return {
            security: this.getSecurityStatus(),
            performance: this.getPerformanceMetrics()
        };
    }
}

// Initialize and Export
const securityPerformance = new SecurityPerformanceRuntime();
window.__ANTIGRAVITY_SECURITY__ = securityPerformance;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[Security] Registered with runtime');
    });
}

export default securityPerformance;
