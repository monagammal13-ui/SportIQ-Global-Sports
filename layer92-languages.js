/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 92: MULTI-LANGUAGE CONTENT ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Manage active locale, translate content dynamically, handle RTL.
 * Features: Hot-swapping languages, persistent preference, RTL support
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        configPath: '../api-json/languages-config.json',
        storageKey: 'sportiq_lang_pref',
        events: {
            changed: 'language:changed',
            loaded: 'language:loaded'
        }
    };

    const state = {
        currentLang: 'en',
        config: null,
        translations: {}
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LANGUAGE ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const LanguageEngine = {
        initialize: async function () {
            try {
                // Load Config
                const response = await fetch(CONFIG.configPath);
                state.config = await response.json();
                state.translations = state.config.translations;

                // Determine Language
                const storedLang = localStorage.getItem(CONFIG.storageKey);
                const browserLang = navigator.language.split('-')[0];
                const supportedCodes = state.config.supportedLanguages.map(l => l.code);

                state.currentLang = storedLang && supportedCodes.includes(storedLang)
                    ? storedLang
                    : (supportedCodes.includes(browserLang) ? browserLang : state.config.defaultLanguage);

                console.log(`🌍 [LangEngine] Initialized: ${state.currentLang}`);

                // Apply Language
                this.applyLanguage(state.currentLang);

                // Render Switcher
                this.renderSwitcher();

                // Listen for clicks outside to close dropdown
                document.addEventListener('click', (e) => {
                    const switcher = document.querySelector('.lang-switcher');
                    if (switcher && !switcher.contains(e.target)) {
                        switcher.classList.remove('active');
                    }
                });

            } catch (error) {
                console.error('❌ [LangEngine] Init Failed:', error);
            }
        },

        setLanguage: function (langCode) {
            if (state.currentLang === langCode) return;

            // Persist
            localStorage.setItem(CONFIG.storageKey, langCode);
            this.applyLanguage(langCode);
        },

        applyLanguage: function (langCode) {
            state.currentLang = langCode;
            const langMeta = state.config.supportedLanguages.find(l => l.code === langCode);

            // Set HTML attributes
            document.documentElement.lang = langCode;
            document.documentElement.dir = langMeta.dir || 'ltr';

            // Translate all data-i18n elements
            this.translatePage();

            // Dispatch Event
            document.dispatchEvent(new CustomEvent(CONFIG.events.changed, {
                detail: { lang: langCode, dir: document.documentElement.dir }
            }));

            // Re-render switcher to update selection state
            this.renderSwitcher();
        },

        translatePage: function () {
            const dictionary = state.translations[state.currentLang] || {};
            const elements = document.querySelectorAll('[data-i18n]');

            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (dictionary[key]) {
                    // Handle input placeholders vs text content
                    if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                        el.setAttribute('placeholder', dictionary[key]);
                    } else {
                        el.textContent = dictionary[key];
                    }
                }
            });
        },

        getText: function (key) {
            return state.translations[state.currentLang]?.[key] || key;
        },

        renderSwitcher: function () {
            let container = document.getElementById('lang-switcher-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'lang-switcher-container';
                container.className = 'lang-switcher';
                document.body.appendChild(container);
            }

            const currentMeta = state.config.supportedLanguages.find(l => l.code === state.currentLang);

            let html = `
                <button class="lang-btn" onclick="this.parentElement.classList.toggle('active')">
                    <span class="lang-flag">${currentMeta.flag}</span>
                    <span class="lang-name">${currentMeta.name}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="lang-dropdown">
            `;

            state.config.supportedLanguages.forEach(lang => {
                const isSelected = lang.code === state.currentLang;
                html += `
                    <div class="lang-option ${isSelected ? 'selected' : ''}" 
                         onclick="window.LanguageSystem.setLanguage('${lang.code}')">
                        <span class="lang-flag">${lang.flag}</span>
                        <span class="lang-name">${lang.name}</span>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;
        }
    };

    // Global Export
    window.LanguageSystem = {
        init: LanguageEngine.initialize.bind(LanguageEngine),
        setLanguage: LanguageEngine.setLanguage.bind(LanguageEngine),
        t: LanguageEngine.getText.bind(LanguageEngine),
        current: () => state.currentLang
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => LanguageEngine.initialize());
    } else {
        LanguageEngine.initialize();
    }

})();
