
/**
 * Layer 60: Multi-Language Content Engine
 * Handles dynamic switching of content elements.
 */
export class SportIQMultiLanguageContent {
    constructor() {
        this.id = 'layer-060';
        this.name = 'Multi-Language Content Engine';
        this.currentLang = 'en';
        this.config = null;
    }

    async init() {
        console.log(`Initializing ${this.name}...`);
        await this.loadConfig();

        // Listen to language switch events from the core i18n layer if available
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.subscribe('i18n:language-changed', (lang) => this.switchLanguage(lang));
        }

        window.RuntimeOrchestrator?.registerLayer(this);
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer60.json');
            this.config = await res.json();
        } catch {
            this.config = {};
        }
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        // Logic to swap content that isn't handled by the core I18n layer
        // e.g. replacing images containing text, or swapping external widget sources
        console.log(`Layer 60: Activating content for ${lang}`);

        document.querySelectorAll('[data-lang-content]').forEach(el => {
            if (el.getAttribute('data-lang-content') === lang) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
    }
}

window.Layer60_MultiLangContent = new SportIQMultiLanguageContent();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer60_MultiLangContent.init());
} else {
    window.Layer60_MultiLangContent.init();
}
