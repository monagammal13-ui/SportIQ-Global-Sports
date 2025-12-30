/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 85: GLOBAL POLLS & VOTING SYSTEM ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Interactive polls, voting, real-time results aggregation
 * Features: Multi-option polls, vote tracking, results visualization, anti-fraud
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        polls: {
            configPath: '../api-json/polls-config.json',
            storagePrefix: 'sportiq_poll_',
            updateInterval: 5000, // 5 seconds
            antiDuplicateVoting: true
        },
        events: {
            pollCreated: 'poll:created',
            voteSubmitted: 'poll:vote-submitted',
            resultsUpdated: 'poll:results-updated',
            pollClosed: 'poll:closed'
        }
    };

    const state = {
        polls: new Map(),
        votes: new Map(),
        userVotes: new Map(),
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // POLL MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const PollManager = {
        create: function (poll) {
            const id = poll.id || this.generateId();

            const pollObj = {
                id,
                question: poll.question,
                description: poll.description || '',
                category: poll.category || 'general',
                options: poll.options.map((opt, idx) => ({
                    id: opt.id || `opt_${idx}`,
                    text: opt.text || opt,
                    votes: 0
                })),
                startTime: new Date(poll.startTime || Date.now()),
                endTime: poll.endTime ? new Date(poll.endTime) : null,
                status: poll.status || 'active',
                totalVotes: 0,
                featured: poll.featured || false,
                allowMultiple: poll.allowMultiple || false,
                created: Date.now()
            };

            state.polls.set(id, pollObj);
            state.votes.set(id, new Map());

            const event = new CustomEvent(CONFIG.events.pollCreated, {
                detail: { poll: pollObj, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('📊 [Polls] Poll created:', pollObj.question);
            return pollObj;
        },

        get: function (pollId) {
            return state.polls.get(pollId);
        },

        getAll: function (filter = {}) {
            let polls = Array.from(state.polls.values());

            if (filter.category) {
                polls = polls.filter(p => p.category === filter.category);
            }

            if (filter.status) {
                polls = polls.filter(p => p.status === filter.status);
            }

            if (filter.featured !== undefined) {
                polls = polls.filter(p => p.featured === filter.featured);
            }

            return polls.sort((a, b) => b.created - a.created);
        },

        close: function (pollId) {
            const poll = state.polls.get(pollId);
            if (!poll) return false;

            poll.status = 'closed';
            poll.endTime = new Date();

            const event = new CustomEvent(CONFIG.events.pollClosed, {
                detail: { pollId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('🔒 [Polls] Poll closed:', pollId);
            return true;
        },

        generateId: function () {
            return 'poll_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VOTE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const VoteManager = {
        submit: function (pollId, optionId, userId = 'guest') {
            const poll = state.polls.get(pollId);
            if (!poll) {
                return { success: false, error: 'Poll not found' };
            }

            if (poll.status !== 'active') {
                return { success: false, error: 'Poll is closed' };
            }

            // Check if already voted
            if (CONFIG.polls.antiDuplicateVoting) {
                const userVoteKey = `${pollId}_${userId}`;
                if (state.userVotes.has(userVoteKey)) {
                    return { success: false, error: 'Already voted' };
                }
                state.userVotes.set(userVoteKey, optionId);
            }

            // Record vote
            const pollVotes = state.votes.get(pollId);
            const currentVotes = pollVotes.get(optionId) || 0;
            pollVotes.set(optionId, currentVotes + 1);

            // Update poll totals
            const option = poll.options.find(o => o.id === optionId);
            if (option) {
                option.votes++;
            }
            poll.totalVotes++;

            // Save to storage
            this.save(pollId);

            const event = new CustomEvent(CONFIG.events.voteSubmitted, {
                detail: { pollId, optionId, userId, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('✅ [Polls] Vote submitted:', pollId, optionId);

            return {
                success: true,
                results: this.getResults(pollId)
            };
        },

        getResults: function (pollId) {
            const poll = state.polls.get(pollId);
            if (!poll) return null;

            const results = {
                pollId,
                question: poll.question,
                totalVotes: poll.totalVotes,
                options: poll.options.map(opt => ({
                    id: opt.id,
                    text: opt.text,
                    votes: opt.votes,
                    percentage: poll.totalVotes > 0
                        ? ((opt.votes / poll.totalVotes) * 100).toFixed(1)
                        : 0
                })),
                status: poll.status
            };

            return results;
        },

        hasVoted: function (pollId, userId = 'guest') {
            const userVoteKey = `${pollId}_${userId}`;
            return state.userVotes.has(userVoteKey);
        },

        save: function (pollId) {
            try {
                const poll = state.polls.get(pollId);
                const votes = state.votes.get(pollId);

                localStorage.setItem(
                    CONFIG.polls.storagePrefix + pollId,
                    JSON.stringify({
                        poll,
                        votes: Array.from(votes.entries())
                    })
                );
            } catch (e) {
                console.warn('⚠️ [Polls] Failed to save');
            }
        },

        load: function (pollId) {
            try {
                const data = localStorage.getItem(CONFIG.polls.storagePrefix + pollId);
                if (data) {
                    const { poll, votes } = JSON.parse(data);
                    state.polls.set(pollId, poll);
                    state.votes.set(pollId, new Map(votes));
                    return true;
                }
            } catch (e) { }
            return false;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // POLL RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const PollRenderer = {
        render: function (poll, userId = 'guest') {
            const hasVoted = VoteManager.hasVoted(poll.id, userId);
            const results = VoteManager.getResults(poll.id);

            let html = '<div class="poll-widget">';
            html += `<div class="poll-question">${poll.question}</div>`;

            if (poll.description) {
                html += `<div class="poll-description">${poll.description}</div>`;
            }

            html += '<div class="poll-options">';

            poll.options.forEach(option => {
                const percentage = results.options.find(o => o.id === option.id)?.percentage || 0;

                if (hasVoted || poll.status === 'closed') {
                    // Show results
                    html += '<div class="poll-option result">';
                    html += `<div class="option-text">${option.text}</div>`;
                    html += `<div class="option-bar" style="width: ${percentage}%"></div>`;
                    html += `<div class="option-percentage">${percentage}%</div>`;
                    html += `<div class="option-votes">${option.votes} votes</div>`;
                    html += '</div>';
                } else {
                    // Show voteable option
                    html += `<div class="poll-option" onclick="window.PollSystem.vote('${poll.id}', '${option.id}')">`;
                    html += `<div class="option-text">${option.text}</div>`;
                    html += '</div>';
                }
            });

            html += '</div>';

            html += '<div class="poll-footer">';
            html += `<span class="poll-total">${poll.totalVotes} total votes</span>`;
            if (poll.status === 'closed') {
                html += '<span class="poll-status closed">Closed</span>';
            }
            html += '</div>';

            html += '</div>';

            return html;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-UPDATE
    // ═══════════════════════════════════════════════════════════════════════

    const AutoUpdate = {
        start: function () {
            this.timerId = setInterval(() => {
                this.checkPolls();
            }, CONFIG.polls.updateInterval);
        },

        checkPolls: function () {
            state.polls.forEach((poll, pollId) => {
                if (poll.endTime && poll.status === 'active') {
                    if (new Date() >= poll.endTime) {
                        PollManager.close(pollId);
                    }
                }
            });

            const event = new CustomEvent(CONFIG.events.resultsUpdated, {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        stop: function () {
            if (this.timerId) clearInterval(this.timerId);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📊 LAYER 85: POLLS & VOTING ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        try {
            const response = await fetch(CONFIG.polls.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Load polls
                if (state.config.polls) {
                    state.config.polls.forEach(poll => {
                        PollManager.create(poll);
                    });
                    console.log(`✅ [Polls] Loaded ${state.config.polls.length} polls`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Polls] Failed to load config');
        }

        // Start auto-update
        AutoUpdate.start();

        console.log('✅ [Polls] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.PollSystem = {
        // Poll Management
        createPoll: PollManager.create.bind(PollManager),
        getPoll: PollManager.get.bind(PollManager),
        getPolls: PollManager.getAll.bind(PollManager),
        closePoll: PollManager.close.bind(PollManager),

        // Voting
        vote: VoteManager.submit.bind(VoteManager),
        getResults: VoteManager.getResults.bind(VoteManager),
        hasVoted: VoteManager.hasVoted.bind(VoteManager),

        // Rendering
        render: PollRenderer.render.bind(PollRenderer),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
