/**
 * Layer 24: Comment System & Moderation Runtime
 */
class CommentSystemRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_COMMENTS__) return window.__ANTIGRAVITY_COMMENTS__;
        this.version = '1.0.0';
        this.comments = [];
        this._init();
    }

    async _init() {
        this._loadComments();
        this._setupModeration();
    }

    addComment(articleId, text, author) {
        const comment = {
            id: `cmt_${Date.now()}`,
            articleId,
            text,
            author: author || 'Anonymous',
            timestamp: Date.now(),
            status: 'pending',
            likes: 0
        };

        // Auto-moderate
        if (this._containsProfanity(text)) {
            comment.status = 'flagged';
        } else {
            comment.status = 'approved';
        }

        this.comments.push(comment);
        this._save();
        return comment;
    }

    getComments(articleId) {
        return this.comments
            .filter(c => c.articleId === articleId && c.status === 'approved')
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    _containsProfanity(text) {
        const badWords = ['spam', 'xxx']; // Basic filter
        return badWords.some(word => text.toLowerCase().includes(word));
    }

    _loadComments() {
        const saved = localStorage.getItem('comments');
        if (saved) this.comments = JSON.parse(saved);
    }

    _save() {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }

    _setupModeration() {
        // Moderation logic
    }
}

window.__ANTIGRAVITY_COMMENTS__ = new CommentSystemRuntime();
export default window.__ANTIGRAVITY_COMMENTS__;
