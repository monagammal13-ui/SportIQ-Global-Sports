/**
 * Layer 20: User Profiles & Personalization Runtime
 */
class UserPersonalizationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_USER__) return window.__ANTIGRAVITY_USER__;
        this.version = '1.0.0';
        this.currentUser = null;
        this._init();
    }

    async _init() {
        this._loadUserProfile();
        this._applyPersonalization();
    }

    _loadUserProfile() {
        const stored = localStorage.getItem('user_profile');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        } else {
            this.currentUser = this._createDefaultProfile();
        }
    }

    _createDefaultProfile() {
        return {
            id: `user_${Date.now()}`,
            preferences: {
                theme: 'light',
                language: 'en',
                favoriteSports: [],
                favoriteTeams: []
            },
            favorites: [],
            readingHistory: []
        };
    }

    updatePreferences(updates) {
        this.currentUser.preferences = {
            ...this.currentUser.preferences,
            ...updates
        };
        this._saveProfile();
        this._applyPersonalization();
    }

    addFavorite(articleId) {
        if (!this.currentUser.favorites.includes(articleId)) {
            this.currentUser.favorites.push(articleId);
            this._saveProfile();
        }
    }

    removeFavorite(articleId) {
        this.currentUser.favorites = this.currentUser.favorites.filter(id => id !== articleId);
        this._saveProfile();
    }

    getFavorites() {
        return this.currentUser.favorites;
    }

    _applyPersonalization() {
        // Apply theme
        document.body.className = `theme-${this.currentUser.preferences.theme}`;

        // Apply language
        if (window.__ANTIGRAVITY_I18N__) {
            window.__ANTIGRAVITY_I18N__.switchLanguage(this.currentUser.preferences.language);
        }

        // Update state
        if (window.__ANTIGRAVITY_STATE__) {
            window.__ANTIGRAVITY_STATE__.set('user.profile', this.currentUser);
        }
    }

    _saveProfile() {
        localStorage.setItem('user_profile', JSON.stringify(this.currentUser));
    }

    getProfile() {
        return this.currentUser;
    }
}

window.__ANTIGRAVITY_USER__ = new UserPersonalizationRuntime();
export default window.__ANTIGRAVITY_USER__;
