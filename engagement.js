/**
 * SPORTIQ - Engagement System
 * Layer 8: User Interaction & Engagement
 * Handles: Comments, Likes, Shares, Ratings, Newsletter
 */

class SportIQEngagement {
    constructor() {
        this.config = null;
        this.comments = [];
        this.likes = new Map();
        this.ratings = new Map();
        this.shares = new Map();
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.initComments();
        this.initLikes();
        this.initSharing();
        this.initRatings();
        this.initNewsletter();
        this.initSocialFollow();
        console.log('✅ Engagement system initialized');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/engagement.json');
            this.config = await response.json();
        } catch (error) {
            console.warn('Using default engagement config');
            this.config = { features: {} };
        }
    }

    // ========== COMMENT SYSTEM ==========

    initComments() {
        const commentSections = document.querySelectorAll('.comments-section');
        commentSections.forEach(section => {
            this.setupCommentSection(section);
        });
    }

    setupCommentSection(section) {
        const form = section.querySelector('.comment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCommentSubmit(e, section));
        }

        // Load existing comments from localStorage
        this.loadComments(section);
    }

    handleCommentSubmit(e, section) {
        e.preventDefault();

        const form = e.target;
        const name = form.querySelector('[name="name"]').value;
        const email = form.querySelector('[name="email"]').value;
        const message = form.querySelector('[name="message"]').value;

        if (!this.validateComment(message)) {
            this.showMessage('Comment must be between 10 and 1000 characters', 'error');
            return;
        }

        const comment = {
            id: Date.now(),
            name,
            email,
            message,
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: []
        };

        this.addComment(comment, section);
        form.reset();
        this.showMessage('Comment posted successfully!', 'success');
    }

    validateComment(message) {
        const config = this.config.features.comments;
        return message.length >= config.minLength && message.length <= config.maxLength;
    }

    addComment(comment, section) {
        // Store in memory
        if (!this.comments[section.dataset.articleId]) {
            this.comments[section.dataset.articleId] = [];
        }
        this.comments[section.dataset.articleId].push(comment);

        // Store in localStorage
        this.saveComments(section.dataset.articleId);

        // Render comment
        this.renderComment(comment, section);

        // Update count
        this.updateCommentCount(section);
    }

    renderComment(comment, section) {
        const commentsList = section.querySelector('.comments-list');
        const commentEl = document.createElement('div');
        commentEl.className = 'comment-item';
        commentEl.dataset.commentId = comment.id;

        commentEl.innerHTML = `
            <div class="comment-avatar">
                <img src="${this.config.features.comments.defaultAvatar}" alt="${comment.name}">
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHtml(comment.name)}</span>
                    <span class="comment-date">${this.formatDate(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${this.escapeHtml(comment.message)}</p>
                <div class="comment-actions">
                    <button class="comment-like" data-id="${comment.id}">👍 Like (${comment.likes})</button>
                    <button class="comment-reply" data-id="${comment.id}">↩️ Reply</button>
                </div>
            </div>
        `;

        commentsList.prepend(commentEl);

        // Attach event listeners
        commentEl.querySelector('.comment-like').addEventListener('click', () => this.likeComment(comment.id, section));
        commentEl.querySelector('.comment-reply').addEventListener('click', () => this.replyToComment(comment.id, section));
    }

    loadComments(section) {
        const articleId = section.dataset.articleId;
        const stored = localStorage.getItem(`comments_${articleId}`);
        if (stored) {
            this.comments[articleId] = JSON.parse(stored);
            this.comments[articleId].forEach(comment => this.renderComment(comment, section));
            this.updateCommentCount(section);
        }
    }

    saveComments(articleId) {
        localStorage.setItem(`comments_${articleId}`, JSON.stringify(this.comments[articleId]));
    }

    updateCommentCount(section) {
        const articleId = section.dataset.articleId;
        const count = this.comments[articleId]?.length || 0;
        const countEl = section.querySelector('.comment-count');
        if (countEl) {
            countEl.textContent = `(${count})`;
        }
    }

    likeComment(commentId, section) {
        const articleId = section.dataset.articleId;
        const comment = this.comments[articleId].find(c => c.id === commentId);
        if (comment) {
            comment.likes++;
            this.saveComments(articleId);

            // Update UI
            const likeBtn = section.querySelector(`[data-id="${commentId}"]`);
            if (likeBtn) {
                likeBtn.innerHTML = `👍 Like (${comment.likes})`;
                this.animateElement(likeBtn, 'pulse');
            }
        }
    }

    replyToComment(commentId, section) {
        const nameInput = section.querySelector('[name="name"]');
        const messageInput = section.querySelector('[name="message"]');
        const commentEl = section.querySelector(`[data-comment-id="${commentId}"]`);
        const authorName = commentEl.querySelector('.comment-author').textContent;

        messageInput.value = `@${authorName} `;
        messageInput.focus();
    }

    // ========== LIKE SYSTEM ==========

    initLikes() {
        const likeButtons = document.querySelectorAll('.like-btn');
        likeButtons.forEach(btn => {
            const articleId = btn.dataset.articleId;
            this.loadLikes(articleId, btn);
            btn.addEventListener('click', () => this.handleLike(articleId, btn));
        });
    }

    handleLike(articleId, btn) {
        const hasLiked = localStorage.getItem(`liked_${articleId}`);

        if (hasLiked) {
            // Unlike
            this.unlike(articleId, btn);
        } else {
            // Like
            this.like(articleId, btn);
        }
    }

    like(articleId, btn) {
        let count = parseInt(btn.dataset.count) || 0;
        count++;

        btn.dataset.count = count;
        btn.innerHTML = `👍 Liked (${count})`;
        btn.classList.add('liked');

        localStorage.setItem(`liked_${articleId}`, 'true');
        localStorage.setItem(`like_count_${articleId}`, count);

        this.animateElement(btn, 'heartbeat');
        this.trackEvent('like', articleId);
    }

    unlike(articleId, btn) {
        let count = parseInt(btn.dataset.count) || 0;
        count = Math.max(0, count - 1);

        btn.dataset.count = count;
        btn.innerHTML = `👍 Like (${count})`;
        btn.classList.remove('liked');

        localStorage.removeItem(`liked_${articleId}`);
        localStorage.setItem(`like_count_${articleId}`, count);
    }

    loadLikes(articleId, btn) {
        const count = localStorage.getItem(`like_count_${articleId}`) || 0;
        const hasLiked = localStorage.getItem(`liked_${articleId}`);

        btn.dataset.count = count;
        btn.innerHTML = hasLiked ? `👍 Liked (${count})` : `👍 Like (${count})`;
        if (hasLiked) btn.classList.add('liked');
    }

    // ========== SHARE SYSTEM ==========

    initSharing() {
        const shareButtons = document.querySelectorAll('.share-btn');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleShare(e, btn));
        });

        // Copy link buttons
        const copyButtons = document.querySelectorAll('.copy-link-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', () => this.copyLink(btn));
        });
    }

    async handleShare(e, btn) {
        const url = btn.dataset.url || window.location.href;
        const title = btn.dataset.title || document.title;

        // Try native Web Share API first (mobile)
        if (navigator.share && this.config.features.sharing.nativeShareAPI) {
            try {
                await navigator.share({ title, url });
                this.trackEvent('share', url, 'native');
                this.showMessage('Shared successfully!', 'success');
                return;
            } catch (err) {
                // Fallback to custom share menu
            }
        }

        // Show custom share menu
        this.showShareMenu(btn, url, title);
    }

    showShareMenu(btn, url, title) {
        const menu = btn.nextElementSibling;
        if (menu && menu.classList.contains('share-menu')) {
            menu.classList.toggle('active');
        }
    }

    copyLink(btn) {
        const url = btn.dataset.url || window.location.href;

        navigator.clipboard.writeText(url).then(() => {
            btn.innerHTML = '✅ Copied!';
            this.showMessage('Link copied to clipboard!', 'success');

            setTimeout(() => {
                btn.innerHTML = '🔗 Copy Link';
            }, 2000);

            this.trackEvent('copy_link', url);
        });
    }

    // ========== RATING SYSTEM ==========

    initRatings() {
        const ratingContainers = document.querySelectorAll('.rating-container');
        ratingContainers.forEach(container => {
            this.setupRating(container);
        });
    }

    setupRating(container) {
        const articleId = container.dataset.articleId;
        const stars = container.querySelectorAll('.rating-star');

        stars.forEach((star, index) => {
            star.addEventListener('click', () => this.setRating(articleId, index + 1, container));
            star.addEventListener('mouseenter', () => this.highlightStars(stars, index));
            star.addEventListener('mouseleave', () => this.resetStars(stars, container));
        });

        this.loadRating(articleId, container);
    }

    setRating(articleId, rating, container) {
        const hasRated = localStorage.getItem(`rated_${articleId}`);

        if (hasRated && this.config.features.ratings.oneRatingPerUser) {
            this.showMessage('You have already rated this!', 'info');
            return;
        }

        // Store rating
        localStorage.setItem(`rated_${articleId}`, 'true');
        localStorage.setItem(`rating_${articleId}`, rating);

        // Update UI
        this.updateRatingDisplay(container, rating);
        this.showMessage(`You rated this ${rating} stars!`, 'success');
        this.trackEvent('rating', articleId, rating);
    }

    highlightStars(stars, index) {
        stars.forEach((star, i) => {
            if (i <= index) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    resetStars(stars, container) {
        const currentRating = parseInt(container.dataset.currentRating) || 0;
        stars.forEach((star, i) => {
            if (i < currentRating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    loadRating(articleId, container) {
        const rating = localStorage.getItem(`rating_${articleId}`);
        if (rating) {
            this.updateRatingDisplay(container, parseInt(rating));
        }
    }

    updateRatingDisplay(container, rating) {
        container.dataset.currentRating = rating;
        const stars = container.querySelectorAll('.rating-star');
        stars.forEach((star, i) => {
            if (i < rating) {
                star.classList.add('active');
            }
        });
    }

    // ========== NEWSLETTER SYSTEM ==========

    initNewsletter() {
        const forms = document.querySelectorAll('.newsletter-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
        });
    }

    async handleNewsletterSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const emailInput = form.querySelector('[type="email"]');
        const button = form.querySelector('button[type="submit"]');
        const email = emailInput.value;

        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        // Check if already subscribed
        const isSubscribed = localStorage.getItem(`newsletter_${email}`);
        if (isSubscribed) {
            this.showMessage(this.config.features.newsletter.alreadySubscribedMessage, 'info');
            return;
        }

        // Show loading state
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = this.config.features.newsletter.buttonText.loading;

        // Simulate API call
        try {
            await this.subscribeToNewsletter(email);

            // Success
            localStorage.setItem(`newsletter_${email}`, 'true');
            button.textContent = this.config.features.newsletter.buttonText.success;
            this.showMessage(this.config.features.newsletter.successMessage, 'success');
            form.reset();

            this.trackEvent('newsletter_signup', email);

        } catch (error) {
            // Error  
            button.textContent = this.config.features.newsletter.buttonText.error;
            this.showMessage(this.config.features.newsletter.errorMessage, 'error');
        } finally {
            setTimeout(() => {
                button.disabled = false;
                button.textContent = originalText;
            }, 3000);
        }
    }

    async subscribeToNewsletter(email) {
        // Simulate API call
        return new Promise((resolve) => setTimeout(resolve, 1500));

        // TODO: Replace with actual API call
        // const response = await fetch('/api/newsletter/subscribe', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email })
        // });
        // return response.json();
    }

    // ========== SOCIAL FOLLOW ==========

    initSocialFollow() {
        const socialLinks = document.querySelectorAll('.social-follow-link');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.trackEvent('social_follow', link.dataset.platform);
            });
        });
    }

    // ========== UTILITY FUNCTIONS ==========

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    animateElement(element, animation) {
        element.classList.add(`animate-${animation}`);
        setTimeout(() => element.classList.remove(`animate-${animation}`), 600);
    }

    trackEvent(event, data, extra = null) {
        if (this.config.analytics[`track${event.charAt(0).toUpperCase() + event.slice(1)}`]) {
            console.log(`📊 Event: ${event}`, data, extra);
            // TODO: Send to analytics service
        }
    }
}

// Initialize engagement system
let sportiqEngagement;

document.addEventListener('DOMContentLoaded', () => {
    sportiqEngagement = new SportIQEngagement();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportIQEngagement;
}
