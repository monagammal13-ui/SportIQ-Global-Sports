/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 136: REAL-TIME USER FEEDBACK & ENGAGEMENT ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Collects direct user feedback on articles to measure quality/sentiment.
 * Features:
 *  - 5-Star Rating System with hover animations.
 *  - "Was this helpful?" Quick Poll.
 *  - Comment Input with instant preview.
 *  - Real-time aggregation visualization (simulated).
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        selectors: {
            // Append to bottom of article or specific container
            target: '.article-footer, .post-footer, .article-content',
        },
        storageKey: 'sportiq_user_feedback'
    };

    class FeedbackEngine {
        constructor() {
            this.container = null;
            this.history = this.loadHistory();
            this.stats = {
                rating: 4.5,
                votes: 128,
                helpful: 85 // %
            };
            this.init();
        }

        init() {
            console.log('💬 Layer 136: Feedback Engine - INITIALIZED');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.injectUI());
            } else {
                this.injectUI();
            }
        }

        loadHistory() {
            try {
                return JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
            } catch (e) { return {}; }
        }

        saveHistory() {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.history));
        }

        getPageId() {
            // Unique ID for current page
            return window.location.pathname || 'home';
        }

        hasVoted() {
            return !!this.history[this.getPageId()];
        }

        injectUI() {
            // Find insertion point
            const target = document.querySelectorAll(CONFIG.selectors.target);
            if (target.length === 0) return;

            // Use the last match (often the end of article) or specific one
            const injectionPoint = target[target.length - 1];

            // Create Widget
            const widget = document.createElement('div');
            widget.className = 'feedback-widget animated-entry';
            widget.id = 'feedback-widget';

            if (this.hasVoted()) {
                widget.innerHTML = this.renderResults();
            } else {
                widget.innerHTML = this.renderForm();
            }

            injectionPoint.parentNode.insertBefore(widget, injectionPoint.nextSibling);

            // Bind events
            if (!this.hasVoted()) this.bindFormEvents(widget);
        }

        renderForm() {
            return `
                <div class="feedback-header">
                    <h4>How was this article?</h4>
                    <span class="fb-subtitle">Your feedback helps us improve.</span>
                </div>
                
                <div class="feedback-body">
                    <div class="star-rating">
                        ${[5, 4, 3, 2, 1].map(n => `
                            <input type="radio" id="star${n}" name="rating" value="${n}" />
                            <label for="star${n}" title="${n} stars">★</label>
                        `).join('')}
                    </div>

                    <div class="helpful-toggle">
                        <span>Was this helpful?</span>
                        <div class="toggle-buttons">
                            <button class="fb-btn-outline" data-val="yes">👍 Yes</button>
                            <button class="fb-btn-outline" data-val="no">👎 No</button>
                        </div>
                    </div>

                    <div class="comment-box hidden">
                        <textarea placeholder="Tell us more (optional)..."></textarea>
                        <button class="fb-btn-primary" id="submit-feedback">Submit Feedback</button>
                    </div>
                </div>
            `;
        }

        renderResults() {
            // Simulate updated stats if user voted
            return `
                <div class="feedback-results">
                    <div class="res-icon">🎉</div>
                    <h4>Thanks for your feedback!</h4>
                    
                    <div class="res-stats">
                        <div class="stat-item">
                            <span class="stat-val">${this.stats.rating} ★</span>
                            <span class="stat-label">Avg Rating</span>
                        </div>
                         <div class="stat-item">
                            <span class="stat-val">${this.stats.helpful}%</span>
                            <span class="stat-label">Found Helpful</span>
                        </div>
                    </div>
                </div>
            `;
        }

        bindFormEvents(widget) {
            // Star Click
            const stars = widget.querySelectorAll('input[name="rating"]');
            stars.forEach(s => s.addEventListener('change', (e) => {
                this.showCommentBox();
            }));

            // Helpful Click
            const helpBtns = widget.querySelectorAll('.toggle-buttons button');
            helpBtns.forEach(b => b.addEventListener('click', (e) => {
                helpBtns.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.showCommentBox();
            }));

            // Submit
            const submit = widget.querySelector('#submit-feedback');
            if (submit) {
                submit.addEventListener('click', () => {
                    this.submitFeedback();
                });
            }
        }

        showCommentBox() {
            const box = document.querySelector('.comment-box');
            if (box) {
                box.classList.remove('hidden');
                box.classList.add('slide-down');
            }
        }

        submitFeedback() {
            const widget = document.getElementById('feedback-widget');

            // Collect data
            const ratingEl = widget.querySelector('input[name="rating"]:checked');
            const rating = ratingEl ? parseInt(ratingEl.value) : 0;
            const comment = widget.querySelector('textarea').value;

            console.log(`💬 Feedback Submitted: ${rating} Stars | Comment: "${comment}"`);

            // Save state
            this.history[this.getPageId()] = { timestamp: Date.now(), rating };
            this.saveHistory();

            // Transition to results
            widget.innerHTML = '<div class="spinner"></div>';
            setTimeout(() => {
                widget.innerHTML = this.renderResults();
            }, 800); // Fake network delay
        }
    }

    // Auto-Expose
    window.Layer136_Feedback = new FeedbackEngine();

})();
