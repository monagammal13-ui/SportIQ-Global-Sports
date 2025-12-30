/**
 * Layer 32: Comments & Interaction
 * Standalone runtime for comment threads, voting, and moderation
 */

class Layer32Comments {
    constructor() {
        if (window.__LAYER32__) return window.__LAYER32__;

        this.layerId = 'layer-032';
        this.name = 'Comments & Interaction';
        this.version = '1.0.0';

        this.comments = [];

        console.log(`[Layer 32 v${this.version}] Initializing Comments System...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._loadComments();
        this._setupCommentsUI();
        this._registerWithCoreEngines();
        console.log('[Layer 32] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer32-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                moderationEnabled: true,
                maxCommentLength: 500,
                allowAnonymous: true
            };
        }
    }

    _loadComments() {
        const stored = localStorage.getItem('layer32_comments');
        this.comments = stored ? JSON.parse(stored) : [];
    }

    _saveComments() {
        localStorage.setItem('layer32_comments', JSON.stringify(this.comments));
    }

    _setupCommentsUI() {
        const containers = document.querySelectorAll('[data-layer32-comments]');
        containers.forEach(container => {
            const contextId = container.dataset.layer32Comments;
            this._renderThread(container, contextId);
        });
    }

    _renderThread(container, contextId) {
        const threadComments = this.comments.filter(c => c.contextId === contextId);

        container.innerHTML = `
            <div class="layer32-thread">
                <h3>Comments (${threadComments.length})</h3>
                <form class="layer32-form" onsubmit="window.__LAYER32__.postComment(event, '${contextId}')">
                    <textarea placeholder="Write a comment..." maxlength="${this.config.maxCommentLength}" required></textarea>
                    <button type="submit" class="layer32-btn-primary">Post Comment</button>
                </form>
                <div class="layer32-list">
                    ${threadComments.map(c => this._renderComment(c)).join('')}
                </div>
            </div>
        `;
    }

    _renderComment(comment) {
        return `
            <div class="layer32-comment" id="comment-${comment.id}">
                <div class="layer32-header">
                    <strong>${comment.author}</strong>
                    <span class="layer32-time">${new Date(comment.timestamp).toLocaleString()}</span>
                </div>
                <div class="layer32-body">${comment.text}</div>
                <div class="layer32-actions">
                    <button onclick="window.__LAYER32__.vote('${comment.id}', 1)">👍 ${comment.upvotes}</button>
                    <button onclick="window.__LAYER32__.vote('${comment.id}', -1)">👎 ${comment.downvotes}</button>
                </div>
            </div>
        `;
    }

    postComment(event, contextId) {
        event.preventDefault();
        const form = event.target;
        const text = form.querySelector('textarea').value;
        const user = window.__LAYER31__?.getCurrentUser(); // Integration with Layer 31

        if (!user && !this.config.allowAnonymous) {
            alert('Please login to comment');
            return;
        }

        const comment = {
            id: `cmt_${Date.now()}`,
            contextId,
            author: user ? user.name : 'Guest',
            text: text,
            timestamp: Date.now(),
            upvotes: 0,
            downvotes: 0
        };

        this.comments.push(comment);
        this._saveComments();
        this._setupCommentsUI(); // Re-render

        this._emitEvent('layer32:comment-posted', { comment });
        form.reset();
    }

    vote(commentId, value) {
        const comment = this.comments.find(c => c.id === commentId);
        if (comment) {
            if (value > 0) comment.upvotes++;
            else comment.downvotes++;
            this._saveComments();
            this._setupCommentsUI();
        }
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 32] Connected to Runtime');
            });
        }
    }

    // Public API
    getComments(contextId) {
        return this.comments.filter(c => c.contextId === contextId);
    }
}

const layer32 = new Layer32Comments();
window.__LAYER32__ = layer32;
export default layer32;
