/**
 * Layer 35: Localization & Multi-Language (Enhanced)
 * Standalone runtime for advanced localization features
 */

class Layer35Localization {
    constructor() {
        if (window.__LAYER35__) return window.__LAYER35__;

        this.layerId = 'layer-035';
        this.name = 'Localization Enhanced';
        this.version = '1.0.0';

        this.currentLang = 'en';
        this.translations = {};

        console.log(`[Layer 35 v${this.version}] Initializing Localization...`);
        this._init();
    }

    async _init() {
        // Connect to Layer 11 if available (Base 18n)
        if (window.__ANTIGRAVITY_I18N__) {
            this.baseI18n = window.__ANTIGRAVITY_I18N__;
            this.currentLang = this.baseI18n.currentLang || 'en';
        }

        await this._loadConfig();
        this._setupLanguageSwitcher();
        this._registerWithCoreEngines();
        console.log('[Layer 35] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer35-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                supportedLangs: ['en', 'es', 'fr', 'de', 'ar'],
                autoDetect: true
            };
        }
    }

    _setupLanguageSwitcher() {
        const container = document.getElementById('layer35-lang-switcher');
        if (!container) return;

        container.innerHTML = `
            <select class="layer35-select" onchange="window.__LAYER35__.setLanguage(this.value)">
                ${this.config.supportedLangs.map(lang =>
            `<option value="${lang}" ${lang === this.currentLang ? 'selected' : ''}>
                        ${lang.toUpperCase()}
                    </option>`
        ).join('')}
            </select>
        `;
    }

    async setLanguage(lang) {
        if (!this.config.supportedLangs.includes(lang)) return;

        this.currentLang = lang;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Propagate to Layer 11
        if (this.baseI18n) {
            this.baseI18n.setLanguage(lang);
        }

        // Emit event
        this._emitEvent('layer35:language-changed', { lang });

        // Persist
        localStorage.setItem('layer35_lang', lang);
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 35] Connected to Runtime');
            });
        }
    }
}

const layer35 = new Layer35Localization();
window.__LAYER35__ = layer35;
export default layer35;
