/**
 * Theme Manager - Dark/Light mode system
 * Manages theme switching and persistence
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.initThemeToggle();
        this.listenForSystemChanges();
    }

    getStoredTheme() {
        return localStorage.getItem('sportiq-theme');
    }

    getPreferredTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('sportiq-theme', theme);

        // Update toggle button if exists
        this.updateToggleButton();

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    initThemeToggle() {
        const toggleButtons = document.querySelectorAll('.theme-toggle');

        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.toggleTheme();
            });
        });
    }

    updateToggleButton() {
        const toggleButtons = document.querySelectorAll('.theme-toggle');

        toggleButtons.forEach(button => {
            const icon = button.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
            }
            button.setAttribute('aria-label',
                this.currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            );
        });
    }

    listenForSystemChanges() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    getTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
