/**
 * Layer 49: Interactive Polls & Surveys
 * Standalone runtime for user voting and feedback
 */

class Layer49Polls {
    constructor() {
        if (window.__LAYER49__) return window.__LAYER49__;

        this.layerId = 'layer-049';
        this.name = 'Interactive Polls';
        this.version = '1.0.0';

        this.activePoll = null;

        console.log(`[Layer 49 v${this.version}] Initializing Polls...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._loadActivePoll();
        this._renderPollWidget();
        this._registerWithCoreEngines();
        console.log('[Layer 49] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer49-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                allowAnonymous: true,
                showResultsAfterVote: true
            };
        }
    }

    _loadActivePoll() {
        // Mock current poll
        this.activePoll = {
            id: 'poll_1',
            question: 'Who will win the MVP?',
            options: [
                { id: 'opt1', text: 'Player A', votes: 120 },
                { id: 'opt2', text: 'Player B', votes: 95 },
                { id: 'opt3', text: 'Player C', votes: 40 }
            ],
            totalVotes: 255
        };
    }

    _renderPollWidget(showResults = false) {
        const container = document.getElementById('layer49-poll-container');
        if (!container) return;

        if (showResults) {
            this._renderResults(container);
        } else {
            this._renderVote(container);
        }
    }

    _renderVote(container) {
        container.innerHTML = `
            <div class="layer49-widget">
                <h3>${this.activePoll.question}</h3>
                <div class="layer49-options">
                    ${this.activePoll.options.map(opt => `
                        <button class="layer49-btn" onclick="window.__LAYER49__.vote('${opt.id}')">
                            ${opt.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    _renderResults(container) {
        container.innerHTML = `
            <div class="layer49-widget">
                <h3>Result: ${this.activePoll.question}</h3>
                <div class="layer49-results">
                    ${this.activePoll.options.map(opt => {
            const pct = Math.round((opt.votes / this.activePoll.totalVotes) * 100) || 0;
            return `
                            <div class="layer49-bar-wrap">
                                <div class="layer49-label">${opt.text} (${pct}%)</div>
                                <div class="layer49-bar" style="width: ${pct}%"></div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    vote(optionId) {
        const option = this.activePoll.options.find(o => o.id === optionId);
        if (option) {
            option.votes++;
            this.activePoll.totalVotes++;
            this._renderPollWidget(true);
            this._emitEvent('layer49:voted', { pollId: this.activePoll.id, optionId });
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
                console.log('[Layer 49] Connected to Runtime');
            });
        }
    }
}

const layer49 = new Layer49Polls();
window.__LAYER49__ = layer49;
export default layer49;
