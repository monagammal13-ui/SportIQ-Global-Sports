/**
 * Layer 19: Trending & Breaking News Runtime
 */
class TrendingNewsRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_TRENDING__) return window.__ANTIGRAVITY_TRENDING__;
        this.version = '1.0.0';
        this.trendingArticles = [];
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._detectTrending();
        this._setupBreakingNews();
    }

    async _loadConfig() {
        try {
            const res = await fetch('../api-json/trending-config.json');
            this.config = await res.json();
        } catch (e) {
            this.config = { trendThreshold: 100, breakingPriority: 10 };
        }
    }

    _detectTrending() {
        if (window.__ANTIGRAVITY_CMS__) {
            const articles = window.__ANTIGRAVITY_CMS__.getArticles();
            const scored = articles.map(a => ({
                ...a,
                trendScore: this._calculateTrendScore(a)
            }));

            this.trendingArticles = scored
                .filter(a => a.trendScore > this.config.trendThreshold)
                .sort((a, b) => b.trendScore - a.trendScore)
                .slice(0, 10);
        }
    }

    _calculateTrendScore(article) {
        const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
        const recencyScore = Math.max(0, 100 - ageHours * 5);
        const engagementScore = (article.views || 0) + (article.likes || 0) * 2;
        return recencyScore + engagementScore;
    }

    _setupBreakingNews() {
        setInterval(() => {
            this._checkForBreakingNews();
        }, 60000); // Check every minute
    }

    _checkForBreakingNews() {
        if (window.__ANTIGRAVITY_CMS__) {
            const recent = window.__ANTIGRAVITY_CMS__.getArticles({
                sortBy: 'publishedAt',
                sortOrder: 'desc',
                perPage: 5
            });

            const breaking = recent.filter(a => {
                const minutesOld = (Date.now() - new Date(a.publishedAt).getTime()) / 60000;
                return minutesOld < 15; // Breaking if less than 15 minutes old
            });

            if (breaking.length > 0) {
                this._displayBreakingAlert(breaking[0]);
            }
        }
    }

    _displayBreakingAlert(article) {
        const alert = document.createElement('div');
        alert.className = 'breaking-news-alert';
        alert.innerHTML = `
            <span class="breaking-badge">BREAKING</span>
            <span>${article.title}</span>
        `;
        document.body.prepend(alert);

        setTimeout(() => alert.remove(), 10000);
    }

    getTrending() {
        return this.trendingArticles;
    }
}

window.__ANTIGRAVITY_TRENDING__ = new TrendingNewsRuntime();
export default window.__ANTIGRAVITY_TRENDING__;
