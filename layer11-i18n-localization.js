/**
 * Layer 11: Multi-Language & Localization Runtime
 * ID: layer-011
 * Type: Core
 * Description: Dynamic language switching, RTL support, translation management, and locale-aware formatting.
 */

class LocalizationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_I18N__) {
            console.warn('[i18n] Localization runtime already initialized.');
            return window.__ANTIGRAVITY_I18N__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-011';
        this.name = 'Multi-Language & Localization Runtime';
        this.timestamp = new Date().toISOString();

        // Configuration
        this.config = null;
        this.translations = new Map();
        this.currentLanguage = 'en';
        this.fallbackLanguage = 'en';
        this.loadedLanguages = new Set();

        // Supported languages
        this.supportedLanguages = [];
        this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];

        // DOM elements tracking
        this.translatedElements = new Set();

        // Formatters
        this.dateFormatter = null;
        this.numberFormatter = null;
        this.currencyFormatter = null;

        console.log(`[i18n v${this.version}] Initializing...`);
        this._init();
    }

    /**
     * Initialize localization
     */
    async _init() {
        try {
            await this._loadConfig();
            await this._detectLanguage();
            await this._loadLanguage(this.currentLanguage);
            this._setupFormatters();
            this._setupLanguageSwitcher();
            this._translatePage();
            this._registerEvents();
            console.log('[i18n] Initialized successfully');
        } catch (error) {
            console.error('[i18n] Initialization error:', error);
            if (window.__ANTIGRAVITY_RUNTIME__) {
                window.__ANTIGRAVITY_RUNTIME__.logError(error, 'i18n:init');
            }
        }
    }

    /**
     * Load configuration
     */
    async _loadConfig() {
        try {
            const response = await fetch('../api-json/i18n-config.json');
            if (response.ok) {
                this.config = await response.json();
                this.supportedLanguages = this.config.languages || [];
                this.fallbackLanguage = this.config.fallbackLanguage || 'en';
                console.log('[i18n] Configuration loaded');
            }
        } catch (error) {
            console.warn('[i18n] Using default configuration:', error);
            this.config = this._getDefaultConfig();
        }
    }

    /**
     * Default configuration
     */
    _getDefaultConfig() {
        return {
            fallbackLanguage: 'en',
            languages: [
                { code: 'en', name: 'English', flag: '🇬🇧' },
                { code: 'es', name: 'Español', flag: '🇪🇸' },
                { code: 'fr', name: 'Français', flag: '🇫🇷' },
                { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
                { code: 'pt', name: 'Português', flag: '🇵🇹' },
                { code: 'zh', name: '中文', flag: '🇨🇳' },
                { code: 'ja', name: '日本語', flag: '🇯🇵' }
            ],
            autoDetect: true,
            persistSelection: true
        };
    }

    /**
     * Detect user's preferred language
     */
    async _detectLanguage() {
        // Check localStorage
        if (this.config.persistSelection) {
            const saved = localStorage.getItem('sportiq_language');
            if (saved && this._isLanguageSupported(saved)) {
                this.currentLanguage = saved;
                return;
            }
        }

        // Check browser language
        if (this.config.autoDetect) {
            const browserLang = navigator.language.split('-')[0];
            if (this._isLanguageSupported(browserLang)) {
                this.currentLanguage = browserLang;
                return;
            }
        }

        // Use fallback
        this.currentLanguage = this.fallbackLanguage;
    }

    /**
     * Check if language is supported
     */
    _isLanguageSupported(code) {
        return this.supportedLanguages.some(lang => lang.code === code);
    }

    /**
     * Load language translations
     */
    async _loadLanguage(langCode) {
        if (this.loadedLanguages.has(langCode)) {
            return true;
        }

        try {
            const response = await fetch(`../api-json/translations/${langCode}.json`);
            if (response.ok) {
                const translations = await response.json();
                this.translations.set(langCode, translations);
                this.loadedLanguages.add(langCode);
                console.log(`[i18n] Loaded language: ${langCode}`);
                return true;
            }
        } catch (error) {
            console.error(`[i18n] Failed to load language ${langCode}:`, error);

            // Load fallback if not already loaded
            if (langCode !== this.fallbackLanguage && !this.loadedLanguages.has(this.fallbackLanguage)) {
                await this._loadLanguage(this.fallbackLanguage);
            }
        }
        return false;
    }

    /**
     * Get translation
     */
    t(key, params = {}) {
        let translation = this._getTranslation(key, this.currentLanguage);

        // Fallback to default language
        if (!translation && this.currentLanguage !== this.fallbackLanguage) {
            translation = this._getTranslation(key, this.fallbackLanguage);
        }

        // Fallback to key itself
        if (!translation) {
            return key;
        }

        // Replace parameters
        return this._replaceParams(translation, params);
    }

    /**
     * Get translation from language map
     */
    _getTranslation(key, langCode) {
        const translations = this.translations.get(langCode);
        if (!translations) return null;

        // Support nested keys (e.g., "common.welcome")
        const keys = key.split('.');
        let value = translations;

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return null;
            }
        }

        return value;
    }

    /**
     * Replace parameters in translation
     */
    _replaceParams(text, params) {
        let result = text;

        for (const [key, value] of Object.entries(params)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, value);
        }

        return result;
    }

    /**
     * Switch language
     */
    async switchLanguage(langCode) {
        if (!this._isLanguageSupported(langCode)) {
            console.error(`[i18n] Unsupported language: ${langCode}`);
            return false;
        }

        // Load language if not already loaded
        await this._loadLanguage(langCode);

        const previousLanguage = this.currentLanguage;
        this.currentLanguage = langCode;

        // Persist selection
        if (this.config.persistSelection) {
            localStorage.setItem('sportiq_language', langCode);
        }

        // Update document direction (RTL/LTR)
        this._updateDirection();

        // Retranslate page
        this._translatePage();

        // Update formatters
        this._setupFormatters();

        // Emit event
        this._emitEvent('i18n:language-changed', {
            from: previousLanguage,
            to: langCode
        });

        // Update state
        if (window.__ANTIGRAVITY_STATE__) {
            window.__ANTIGRAVITY_STATE__.set('user.preferences.language', langCode);
        }

        console.log(`[i18n] Language switched to: ${langCode}`);
        return true;
    }

    /**
     * Update document direction (RTL/LTR)
     */
    _updateDirection() {
        const isRTL = this.rtlLanguages.includes(this.currentLanguage);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLanguage;

        // Add/remove RTL class
        document.body.classList.toggle('rtl', isRTL);
        document.body.classList.toggle('ltr', !isRTL);
    }

    /**
     * Translate page content
     */
    _translatePage() {
        // Find all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            // Update text content
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }

            this.translatedElements.add(el);
        });

        // Translate attributes (title, alt, etc.)
        const attrElements = document.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(el => {
            const attrs = el.getAttribute('data-i18n-attr').split(',');
            attrs.forEach(attr => {
                const [attrName, key] = attr.split(':');
                if (key) {
                    const translation = this.t(key.trim());
                    el.setAttribute(attrName.trim(), translation);
                }
            });
        });
    }

    /**
     * Setup language switcher UI
     */
    _setupLanguageSwitcher() {
        // Create language selector if it doesn't exist
        const selector = document.getElementById('languageSelector');
        if (selector && !selector.hasChildNodes()) {
            this._renderLanguageSelector(selector);
        }

        // Listen for language selector clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('lang-option')) {
                const langCode = e.target.getAttribute('data-lang');
                if (langCode) {
                    this.switchLanguage(langCode);
                }
            }
        });
    }

    /**
     * Render language selector
     */
    _renderLanguageSelector(container) {
        const currentLang = this.supportedLanguages.find(l => l.code === this.currentLanguage);

        container.innerHTML = `
            <div class="language-selector">
                <button class="lang-current" id="langButton">
                    <span class="lang-flag">${currentLang?.flag || '🌐'}</span>
                    <span class="lang-name">${currentLang?.name || 'Language'}</span>
                    <span class="lang-arrow">▼</span>
                </button>
                <div class="lang-dropdown" id="langDropdown">
                    ${this.supportedLanguages.map(lang => `
                        <div class="lang-option ${lang.code === this.currentLanguage ? 'active' : ''}" 
                             data-lang="${lang.code}">
                            <span class="lang-flag">${lang.flag}</span>
                            <span class="lang-name">${lang.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Toggle dropdown
        const button = container.querySelector('#langButton');
        const dropdown = container.querySelector('#langDropdown');

        button?.addEventListener('click', () => {
            dropdown?.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown?.classList.remove('active');
            }
        });
    }

    /**
     * Setup formatters
     */
    _setupFormatters() {
        const locale = this.currentLanguage;

        this.dateFormatter = new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        this.numberFormatter = new Intl.NumberFormat(locale);

        this.currencyFormatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD'
        });
    }

    /**
     * Format date
     */
    formatDate(date, options = {}) {
        const formatter = options ? new Intl.DateTimeFormat(this.currentLanguage, options) : this.dateFormatter;
        return formatter.format(new Date(date));
    }

    /**
     * Format number
     */
    formatNumber(number) {
        return this.numberFormatter.format(number);
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        const formatter = new Intl.NumberFormat(this.currentLanguage, {
            style: 'currency',
            currency
        });
        return formatter.format(amount);
    }

    /**
     * Format relative time
     */
    formatRelativeTime(date) {
        const now = new Date();
        const past = new Date(date);
        const seconds = Math.floor((now - past) / 1000);

        if (seconds < 60) return this.t('time.justNow');
        if (seconds < 3600) return this.t('time.minutesAgo', { count: Math.floor(seconds / 60) });
        if (seconds < 86400) return this.t('time.hoursAgo', { count: Math.floor(seconds / 3600) });
        if (seconds < 604800) return this.t('time.daysAgo', { count: Math.floor(seconds / 86400) });

        return this.formatDate(date);
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Is RTL language
     */
    isRTL() {
        return this.rtlLanguages.includes(this.currentLanguage);
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

        // Listen for language switch requests
        eventBus.on('i18n:switch-language', (data) => {
            if (data.language) {
                this.switchLanguage(data.language);
            }
        });
    }

    /**
     * Get state
     */
    getState() {
        return {
            currentLanguage: this.currentLanguage,
            loadedLanguages: Array.from(this.loadedLanguages),
            supportedLanguages: this.supportedLanguages.length,
            isRTL: this.isRTL(),
            translatedElements: this.translatedElements.size
        };
    }
}

// Initialize and Export
const i18n = new LocalizationRuntime();
window.__ANTIGRAVITY_I18N__ = i18n;

// Register with runtime
if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[i18n] Registered with runtime');
    });
}

export default i18n;
