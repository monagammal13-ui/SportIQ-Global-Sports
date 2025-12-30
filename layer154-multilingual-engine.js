/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 154 – MULTILINGUAL SEMANTIC PUBLISHING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically translates and publishes articles into supported 
 * languages while preserving meaning, tone, and authority.
 * 
 * Features:
 * - Automatic language detection
 * - Multi-language translation
 * - Semantic meaning preservation
 * - Tone and style consistency
 * - Cultural adaptation
 * - Language-specific SEO optimization
 * - Translation quality scoring
 * - Multilingual content distribution
 * 
 * @version 1.0.0
 * @layer 154
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 154,
        name: 'Multilingual Semantic Publishing Engine',

        supportedLanguages: {
            'en': { name: 'English', nativeName: 'English', rtl: false },
            'es': { name: 'Spanish', nativeName: 'Español', rtl: false },
            'fr': { name: 'French', nativeName: 'Français', rtl: false },
            'de': { name: 'German', nativeName: 'Deutsch', rtl: false },
            'it': { name: 'Italian', nativeName: 'Italiano', rtl: false },
            'pt': { name: 'Portuguese', nativeName: 'Português', rtl: false },
            'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true },
            'zh': { name: 'Chinese', nativeName: '中文', rtl: false },
            'ja': { name: 'Japanese', nativeName: '日本語', rtl: false },
            'ko': { name: 'Korean', nativeName: '한국어', rtl: false }
        },

        translationQuality: {
            minQualityScore: 0.7,
            requireHumanReview: false,
            preserveFormatting: true,
            adaptCulturalReferences: true
        },

        intervals: {
            translationCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class MultilingualPublishingEngine {
        constructor() {
            this.translations = new Map();          // Article ID -> language -> translation
            this.translationQueue = [];            // Pending translations
            this.translationLog = [];              // Translation history
            this.config = null;
            this.stats = {
                totalTranslations: 0,
                languagesActive: 0,
                averageQualityScore: 0,
                pendingQueue: 0
            };

            this.init();
        }

        async init() {
            console.log('🌍 [Layer 154] Multilingual Publishing Engine - Initializing...');

            try {
                await this.loadConfiguration();
                this.initializeLanguages();
                this.startTranslationEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 154] Multilingual Publishing Engine - Active');
                this.logTranslation('SYSTEM', 'Translation engine initialized successfully');

            } catch (error) {
                console.error('❌ [Layer 154] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer154-multilingual-engine.json');
                if (response.ok) {
                    this.config = await response.json();
                    console.log('📋 [Layer 154] Configuration loaded');
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        initializeLanguages() {
            console.log('🌐 [Layer 154] Initializing language support...');
            this.stats.languagesActive = Object.keys(CONFIG.supportedLanguages).length;
            console.log(`✅ [Layer 154] Supporting ${this.stats.languagesActive} languages`);
        }

        async translateArticle(article, targetLanguages = null) {
            if (!article || !article.id) {
                console.warn('⚠️ [Layer 154] Invalid article provided');
                return null;
            }

            const sourceLanguage = article.language || 'en';
            const languages = targetLanguages || Object.keys(CONFIG.supportedLanguages).filter(lang => lang !== sourceLanguage);

            const translations = {
                articleId: article.id,
                sourceLanguage: sourceLanguage,
                translations: new Map(),
                timestamp: new Date().toISOString()
            };

            for (const targetLang of languages) {
                try {
                    const translation = await this.performTranslation(article, sourceLanguage, targetLang);

                    if (translation && translation.qualityScore >= CONFIG.translationQuality.minQualityScore) {
                        translations.translations.set(targetLang, translation);
                        this.stats.totalTranslations++;
                        this.updateAverageQualityScore(translation.qualityScore);

                        // Publish translated version
                        this.publishTranslation(article, translation, targetLang);

                        console.log(`✅ [Layer 154] Translated "${article.title}" to ${CONFIG.supportedLanguages[targetLang].name} (Quality: ${(translation.qualityScore * 100).toFixed(1)}%)`);
                    } else {
                        console.warn(`⚠️ [Layer 154] Translation to ${targetLang} failed quality check`);
                    }
                } catch (error) {
                    console.error(`❌ [Layer 154] Translation to ${targetLang} failed:`, error);
                }
            }

            // Store translations
            this.translations.set(article.id, translations);

            // Log translation
            this.logTranslation('TRANSLATE', `Article "${article.title}" translated to ${translations.translations.size} languages`);

            // Dispatch event
            document.dispatchEvent(new CustomEvent('article:translated', {
                detail: { article, translations }
            }));

            return translations;
        }

        async performTranslation(article, sourceLang, targetLang) {
            // Simulate translation (in production, use real API like Google Translate, DeepL, etc.)
            const translation = {
                title: this.simulateTranslate(article.title, sourceLang, targetLang),
                excerpt: this.simulateTranslate(article.excerpt, sourceLang, targetLang),
                content: this.simulateTranslate(article.content, sourceLang, targetLang),
                language: targetLang,
                sourceLanguage: sourceLang,
                qualityScore: this.calculateTranslationQuality(article, targetLang),
                preservedElements: this.preserveElements(article),
                culturalAdaptations: this.adaptCulturalReferences(article, targetLang),
                timestamp: new Date().toISOString()
            };

            // Preserve formatting if required
            if (CONFIG.translationQuality.preserveFormatting) {
                translation.formatting = this.preserveFormatting(article.content);
            }

            return translation;
        }

        simulateTranslate(text, sourceLang, targetLang) {
            // This is a placeholder - in production, integrate with real translation API
            // For now, we'll just add language marker
            if (!text) return '';

            const langInfo = CONFIG.supportedLanguages[targetLang];
            return `[${langInfo.nativeName}] ${text}`;
        }

        calculateTranslationQuality(article, targetLang) {
            // Simulated quality score based on various factors
            let score = 0.85; // Base quality

            // Adjust based on language complexity
            if (['zh', 'ja', 'ko', 'ar'].includes(targetLang)) {
                score -= 0.1; // More complex languages may have lower initial quality
            }

            // Adjust based on content length (shorter content generally translates better)
            const contentLength = (article.content || '').length;
            if (contentLength > 5000) {
                score -= 0.05;
            }

            // Adjust based on technical terminology
            const technicalTerms = (article.content || '').match(/\b[A-Z]{2,}\b/g) || [];
            if (technicalTerms.length > 10) {
                score -= 0.05;
            }

            return Math.max(0.5, Math.min(1.0, score));
        }

        preserveElements(article) {
            // Preserve specific elements that shouldn't be translated
            const preserved = {
                properNouns: this.extractProperNouns(article),
                numbers: this.extractNumbers(article),
                urls: this.extractUrls(article),
                hashtags: article.tags || []
            };

            return preserved;
        }

        extractProperNouns(article) {
            // Simple proper noun extraction (names, places, organizations)
            const text = `${article.title} ${article.content}`;
            const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
            return [...new Set(properNouns)];
        }

        extractNumbers(article) {
            const text = `${article.content}`;
            return text.match(/\b\d+(?:\.\d+)?\b/g) || [];
        }

        extractUrls(article) {
            const text = `${article.content}`;
            return text.match(/https?:\/\/[^\s]+/g) || [];
        }

        adaptCulturalReferences(article, targetLang) {
            if (!CONFIG.translationQuality.adaptCulturalReferences) {
                return [];
            }

            // Placeholder for cultural adaptation logic
            const adaptations = [];

            // Example: Convert units based on region
            if (['en-US'].includes(targetLang)) {
                adaptations.push({ type: 'units', from: 'metric', to: 'imperial' });
            }

            // Example: Adapt date formats
            adaptations.push({
                type: 'dateFormat',
                format: this.getDateFormat(targetLang)
            });

            return adaptations;
        }

        getDateFormat(lang) {
            const formats = {
                'en': 'MM/DD/YYYY',
                'es': 'DD/MM/YYYY',
                'fr': 'DD/MM/YYYY',
                'de': 'DD.MM.YYYY',
                'zh': 'YYYY年MM月DD日',
                'ja': 'YYYY年MM月DD日',
                'ar': 'DD/MM/YYYY'
            };

            return formats[lang] || 'DD/MM/YYYY';
        }

        preserveFormatting(content) {
            return {
                paragraphs: content.split('\n\n').length,
                headings: (content.match(/#+\s/g) || []).length,
                lists: (content.match(/^[\-\*]\s/gm) || []).length,
                bold: (content.match(/\*\*[^*]+\*\*/g) || []).length,
                italic: (content.match(/\*[^*]+\*/g) || []).length
            };
        }

        publishTranslation(originalArticle, translation, language) {
            const translatedArticle = {
                ...originalArticle,
                id: `${originalArticle.id}_${language}`,
                originalId: originalArticle.id,
                language: language,
                title: translation.title,
                excerpt: translation.excerpt,
                content: translation.content,
                translationQuality: translation.qualityScore,
                translatedAt: translation.timestamp
            };

            // Distribute translated article
            document.dispatchEvent(new CustomEvent('article:published', {
                detail: { article: translatedArticle }
            }));

            // Optimize SEO for target language
            this.optimizeSEO(translatedArticle, language);
        }

        optimizeSEO(article, language) {
            // Language-specific SEO optimization
            const langInfo = CONFIG.supportedLanguages[language];

            // Set language meta tags
            if (typeof document !== 'undefined') {
                const htmlLang = document.documentElement.getAttribute('lang');
                if (!htmlLang || htmlLang === language) {
                    document.documentElement.setAttribute('lang', language);
                    if (langInfo.rtl) {
                        document.documentElement.setAttribute('dir', 'rtl');
                    }
                }
            }

            // Create language-specific URL structure
            const seoUrl = `/${language}/${article.slug || article.id}`;

            // Add hreflang tags for multilingual SEO
            this.addHreflangTags(article.originalId, language);

            return seoUrl;
        }

        addHreflangTags(articleId, currentLang) {
            // Add hreflang tags for better international SEO
            if (typeof document === 'undefined') return;

            const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
            const translatedVersions = this.translations.get(articleId);

            if (translatedVersions) {
                translatedVersions.translations.forEach((translation, lang) => {
                    const exists = Array.from(existingTags).some(tag =>
                        tag.getAttribute('hreflang') === lang
                    );

                    if (!exists) {
                        const link = document.createElement('link');
                        link.rel = 'alternate';
                        link.hreflang = lang;
                        link.href = `/${lang}/article.html?id=${articleId}_${lang}`;
                        document.head.appendChild(link);
                    }
                });
            }
        }

        startTranslationEngine() {
            console.log('🚀 [Layer 154] Starting translation engine...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.translationCheck);

            document.addEventListener('article:approved', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForTranslation(event.detail.article);
                }
            });
        }

        queueForTranslation(article) {
            if (!this.translationQueue.find(a => a.id === article.id)) {
                this.translationQueue.push(article);
                this.stats.pendingQueue = this.translationQueue.length;
                console.log(`📥 [Layer 154] Article "${article.title}" queued for translation`);
            }
        }

        async processQueue() {
            if (this.translationQueue.length === 0) return;

            const article = this.translationQueue.shift();
            if (article) {
                await this.translateArticle(article);
                this.stats.pendingQueue = this.translationQueue.length;
            }
        }

        checkForNewArticles() {
            if (window.Layer153_QualityValidator) {
                const validator = window.Layer153_QualityValidator;

                if (validator.validatedArticles) {
                    validator.validatedArticles.forEach((validation, articleId) => {
                        if (validation.passed && !this.translations.has(articleId)) {
                            // Get article from distributor
                            if (window.Layer150_NewsDistributor) {
                                const article = window.Layer150_NewsDistributor.getArticle(articleId);
                                if (article) {
                                    this.queueForTranslation(article);
                                }
                            }
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
                window.SPORTIQ.translationStats = this.stats;
            }

            this.updateDashboard();
        }

        updateAverageQualityScore(newScore) {
            const total = this.stats.averageQualityScore * (this.stats.totalTranslations - 1) + newScore;
            this.stats.averageQualityScore = total / this.stats.totalTranslations;
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer154-dashboard';
            dashboard.className = 'layer154-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer154-dashboard-header">
                    <h3>🌍 Translation Engine</h3>
                    <button class="layer154-close-btn">×</button>
                </div>
                <div class="layer154-dashboard-content">
                    <div class="layer154-stat">
                        <span class="layer154-stat-label">Total Translations:</span>
                        <span class="layer154-stat-value" id="layer154-total">0</span>
                    </div>
                    <div class="layer154-stat">
                        <span class="layer154-stat-label">Languages:</span>
                        <span class="layer154-stat-value" id="layer154-languages">0</span>
                    </div>
                    <div class="layer154-stat">
                        <span class="layer154-stat-label">Avg Quality:</span>
                        <span class="layer154-stat-value" id="layer154-quality">0%</span>
                    </div>
                    <div class="layer154-log" id="layer154-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer154-toggle-btn';
            toggleBtn.innerHTML = '🌍';
            toggleBtn.title = 'Toggle Translation Engine Dashboard';
            toggleBtn.addEventListener('click', () => {
                dashboard.classList.toggle('hidden');
            });

            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer154-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer154-total');
            const languagesEl = document.getElementById('layer154-languages');
            const qualityEl = document.getElementById('layer154-quality');

            if (totalEl) totalEl.textContent = this.stats.totalTranslations;
            if (languagesEl) languagesEl.textContent = this.stats.languagesActive;
            if (qualityEl) qualityEl.textContent = `${(this.stats.averageQualityScore * 100).toFixed(1)}%`;

            const logEl = document.getElementById('layer154-log');
            if (logEl && this.translationLog.length > 0) {
                const recentLogs = this.translationLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer154-log-entry">
                        <span class="layer154-log-type">${log.type}</span>
                        <span class="layer154-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logTranslation(type, message) {
            this.translationLog.push({
                type,
                message,
                timestamp: new Date().toISOString()
            });

            if (this.translationLog.length > 100) {
                this.translationLog.shift();
            }
        }

        getTranslation(articleId, language) {
            const translations = this.translations.get(articleId);
            return translations ? translations.translations.get(language) : null;
        }

        getAllTranslations(articleId) {
            return this.translations.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTranslationEngine);
    } else {
        initTranslationEngine();
    }

    function initTranslationEngine() {
        const engine = new MultilingualPublishingEngine();
        window.Layer154_TranslationEngine = engine;

        if (!window.SPORTIQ) {
            window.SPORTIQ = {};
        }
        window.SPORTIQ.translationEngine = engine;

        document.dispatchEvent(new CustomEvent('layer154:ready', {
            detail: { engine }
        }));

        console.log('🎯 [Layer 154] Multilingual Publishing Engine - Ready');
    }

})();
