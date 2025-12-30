/**
 * Layer 67 - Global Polls & Interactive Quizzes
 * Interactive polls, trivia quizzes, and instant feedback system
 * Sport IQ Platform
 */

class GlobalPollsAndQuizzes {
    constructor() {
        this.config = null;
        this.isActive = false;
        this.polls = [];
        this.quizzes = []; // New Quizzes Array
        this.userVotes = {};
        this.userQuizResults = {}; // Store quiz scores
        this.updateInterval = null;
        this.refreshRate = 30000; // 30 seconds
        this.init();
    }

    async init() {
        console.log('📊 Layer 67: Global Polls & Interactive Quizzes - STARTING');

        // Load configuration
        await this.loadConfig();

        // Load user data from localStorage
        this.loadUserData();

        // Initialize content
        this.initializePolls();
        this.initializeQuizzes();

        // Start real-time results engine
        this.startRealTimeUpdates();

        // Inject UI
        this.injectLayerUI();

        this.isActive = true;
        console.log('✅ Layer 67: Global Polls & Interactive Quizzes - ACTIVE');
    }

    async loadConfig() {
        try {
            const response = await fetch('/api-json/polls-voting-config.json');
            this.config = await response.json();
            console.log('✅ Polls & config loaded');
        } catch (error) {
            console.warn('⚠️ Using default polls/quiz config');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            refreshRate: 30000,
            maxPolls: 4,
            maxQuizzes: 2,
            displayMode: 'grid',
            allowMultipleVotes: false,
            showResults: 'after-vote',
            animateResults: true
        };
    }

    loadUserData() {
        try {
            const storedVotes = localStorage.getItem('sportiq_votes');
            this.userVotes = storedVotes ? JSON.parse(storedVotes) : {};

            const storedQuizzes = localStorage.getItem('sportiq_quiz_results');
            this.userQuizResults = storedQuizzes ? JSON.parse(storedQuizzes) : {};

            console.log(`✅ Loaded user data: ${Object.keys(this.userVotes).length} votes, ${Object.keys(this.userQuizResults).length} quizzes`);
        } catch (error) {
            console.warn('⚠️ Could not load user data');
            this.userVotes = {};
            this.userQuizResults = {};
        }
    }

    saveUserData() {
        try {
            localStorage.setItem('sportiq_votes', JSON.stringify(this.userVotes));
            localStorage.setItem('sportiq_quiz_results', JSON.stringify(this.userQuizResults));
        } catch (error) {
            console.warn('⚠️ Could not save user data');
        }
    }

    async initializePolls() {
        // Generate mock polls
        this.polls = [
            {
                id: 'poll-1',
                question: 'Who will win the Champions League 2024?',
                category: 'football',
                options: [
                    { id: 'opt-1', text: 'Manchester City', votes: 2450 },
                    { id: 'opt-2', text: 'Real Madrid', votes: 3120 },
                    { id: 'opt-3', text: 'Bayern Munich', votes: 1890 },
                    { id: 'opt-4', text: 'Barcelona', votes: 2210 }
                ],
                totalVotes: 9670,
                endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'poll-2',
                question: 'Who is the NBA MVP so far?',
                category: 'basketball',
                options: [
                    { id: 'opt-1', text: 'Nikola Jokic', votes: 1540 },
                    { id: 'opt-2', text: 'Giannis Antetokounmpo', votes: 1320 },
                    { id: 'opt-3', text: 'Luka Doncic', votes: 1650 },
                    { id: 'opt-4', text: 'Jayson Tatum', votes: 980 }
                ],
                totalVotes: 5490,
                endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    async initializeQuizzes() {
        // Generate mock quizzes
        this.quizzes = [
            {
                id: 'quiz-1',
                title: 'Ultimate Football Trivia',
                category: 'football',
                questions: [
                    {
                        id: 'q1',
                        text: 'Which country won the first ever World Cup in 1930?',
                        options: [
                            { id: 'a', text: 'Brazil' },
                            { id: 'b', text: 'Uruguay' },
                            { id: 'c', text: 'Italy' },
                            { id: 'd', text: 'Argentina' }
                        ],
                        correctOptionId: 'b'
                    },
                    {
                        id: 'q2',
                        text: 'Who has won the most Ballon d\'Or awards?',
                        options: [
                            { id: 'a', text: 'Cristiano Ronaldo' },
                            { id: 'b', text: 'Michel Platini' },
                            { id: 'c', text: 'Lionel Messi' },
                            { id: 'd', text: 'Johan Cruyff' }
                        ],
                        correctOptionId: 'c'
                    },
                    {
                        id: 'q3',
                        text: 'Which club is known as "The Old Lady"?',
                        options: [
                            { id: 'a', text: 'Juventus' },
                            { id: 'b', text: 'AC Milan' },
                            { id: 'c', text: 'Real Madrid' },
                            { id: 'd', text: 'Liverpool' }
                        ],
                        correctOptionId: 'a'
                    }
                ]
            },
            {
                id: 'quiz-2',
                title: 'Tennis History Challenge',
                category: 'tennis',
                questions: [
                    {
                        id: 'q1',
                        text: 'Who holds the record for most Grand Slam titles (Men)?',
                        options: [
                            { id: 'a', text: 'Roger Federer' },
                            { id: 'b', text: 'Rafael Nadal' },
                            { id: 'c', text: 'Novak Djokovic' },
                            { id: 'd', text: 'Pete Sampras' }
                        ],
                        correctOptionId: 'c'
                    },
                    {
                        id: 'q2',
                        text: 'Where is the US Open held?',
                        options: [
                            { id: 'a', text: 'Los Angeles' },
                            { id: 'b', text: 'New York' },
                            { id: 'c', text: 'Miami' },
                            { id: 'd', text: 'Chicago' }
                        ],
                        correctOptionId: 'b'
                    }
                ]
            }
        ];
    }

    // --- VOTING LOGIC ---

    vote(pollId, optionId) {
        console.log(`🗳️ Casting vote: Poll ${pollId}, Option ${optionId}`);

        const poll = this.polls.find(p => p.id === pollId);
        if (!poll) return;

        if (this.userVotes[pollId] && !this.config.allowMultipleVotes) {
            alert('You have already voted on this poll!');
            return;
        }

        const option = poll.options.find(o => o.id === optionId);
        if (option) {
            if (this.userVotes[pollId]) {
                // Change vote logic if needed, simplify for now
            }
            option.votes++;
            poll.totalVotes++;
            this.userVotes[pollId] = optionId;
            this.saveUserData();
            this.updatePollDisplay(poll);
        }
    }

    // --- QUIZ LOGIC ---

    submitQuizAnswer(quizId, questionId, optionId) {
        const quiz = this.quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        // Initialize results tracking for this quiz if empty
        if (!this.userQuizResults[quizId]) {
            this.userQuizResults[quizId] = { answers: {}, score: 0, completed: false };
        }

        // Record answer
        this.userQuizResults[quizId].answers[questionId] = optionId;

        // Check if correct
        const question = quiz.questions.find(q => q.id === questionId);
        const isCorrect = question.correctOptionId === optionId;

        // Visual Feedback
        this.updateQuizQuestionUI(quizId, questionId, optionId, isCorrect);

        this.saveUserData();

        // Check completion
        const answeredCount = Object.keys(this.userQuizResults[quizId].answers).length;
        if (answeredCount === quiz.questions.length) {
            this.calculateQuizScore(quizId);
        }
    }

    calculateQuizScore(quizId) {
        const quiz = this.quizzes.find(q => q.id === quizId);
        const results = this.userQuizResults[quizId];
        let score = 0;

        quiz.questions.forEach(q => {
            if (results.answers[q.id] === q.correctOptionId) {
                score++;
            }
        });

        results.score = score;
        results.completed = true;
        this.saveUserData();
        this.showQuizResultSummary(quizId);
    }

    // --- UI INJECTION ---

    injectLayerUI() {
        console.log('🗳️ Injecting Polls & Quiz UI...');

        if (document.getElementById('polls-quiz-layer')) return;

        const section = document.createElement('section');
        section.id = 'polls-quiz-layer';
        section.className = 'polls-quiz-section';
        section.innerHTML = `
            <div class="container">
                <div class="layer-header">
                    <h2>📊 Interactive Zone</h2>
                    <div class="layer-tabs">
                        <button class="layer-tab active" onclick="window.Layer67_GlobalPolls.switchTab('polls')">Latest Polls</button>
                        <button class="layer-tab" onclick="window.Layer67_GlobalPolls.switchTab('quizzes')">Sports Trivia</button>
                    </div>
                </div>
                
                <div id="polls-container" class="interactive-container active">
                    <!-- Polls injected here -->
                </div>

                <div id="quizzes-container" class="interactive-container" style="display:none;">
                    <!-- Quizzes injected here -->
                </div>
            </div>
        `;

        // Smart Injection Strategy
        const insertPoint = document.getElementById('highlights-section') ||
            document.querySelector('.cinematic-slider-section') ||
            document.querySelector('main');

        if (insertPoint && insertPoint.nextSibling) {
            insertPoint.parentNode.insertBefore(section, insertPoint.nextSibling);
        } else if (insertPoint) {
            insertPoint.parentNode.appendChild(section);
        } else {
            document.body.appendChild(section);
        }

        this.renderPolls();
        this.renderQuizzes();
    }

    switchTab(tabName) {
        document.querySelectorAll('.layer-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.interactive-container').forEach(c => c.style.display = 'none');

        if (tabName === 'polls') {
            document.querySelector('.layer-tab:nth-child(1)').classList.add('active');
            document.getElementById('polls-container').style.display = 'grid';
        } else {
            document.querySelector('.layer-tab:nth-child(2)').classList.add('active');
            document.getElementById('quizzes-container').style.display = 'grid';
        }
    }

    // --- RENDER POLLS ---

    renderPolls() {
        const container = document.getElementById('polls-container');
        container.innerHTML = '';

        this.polls.forEach(poll => {
            const card = document.createElement('div');
            card.className = 'poll-card';
            card.dataset.pollId = poll.id;

            // Render basic structure
            card.innerHTML = `
                <span class="poll-category">${poll.category}</span>
                <h3 class="poll-question">${poll.question}</h3>
                <div class="poll-options"></div>
                <div class="poll-footer">${poll.totalVotes.toLocaleString()} votes • Ends soon</div>
            `;

            const optionsContainer = card.querySelector('.poll-options');
            const userVote = this.userVotes[poll.id];

            poll.options.forEach(opt => {
                const percent = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                const isSelected = userVote === opt.id;

                const optEl = document.createElement('div');
                optEl.className = `poll-option ${userVote ? 'result-mode' : ''} ${isSelected ? 'selected' : ''}`;

                if (userVote) {
                    optEl.innerHTML = `
                        <div class="fill" style="width: ${percent}%"></div>
                        <span class="text">${opt.text}</span>
                        <span class="percent">${percent}%</span>
                    `;
                } else {
                    optEl.innerHTML = `<span class="text">${opt.text}</span>`;
                    optEl.onclick = () => this.vote(poll.id, opt.id);
                }
                optionsContainer.appendChild(optEl);
            });

            container.appendChild(card);
        });
    }

    updatePollDisplay(poll) {
        // Re-render specific poll card
        this.renderPolls(); // Simple re-render for now
    }

    // --- RENDER QUIZZES ---

    renderQuizzes() {
        const container = document.getElementById('quizzes-container');
        container.innerHTML = '';

        this.quizzes.forEach(quiz => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.dataset.quizId = quiz.id;

            const results = this.userQuizResults[quiz.id];
            const isBroadCompleted = results && results.completed;

            let html = `
                <div class="quiz-header">
                    <span class="quiz-category">${quiz.category}</span>
                    <h3>${quiz.title}</h3>
                </div>
            `;

            if (isBroadCompleted) {
                html += `
                    <div class="quiz-result-summary">
                        <h4>🎉 Quiz Completed!</h4>
                        <div class="score-circle">${results.score}/${quiz.questions.length}</div>
                        <button class="btn-retry" onclick="window.Layer67_GlobalPolls.resetQuiz('${quiz.id}')">Try Again</button>
                    </div>
                `;
            } else {
                html += `<div class="quiz-questions">`;
                quiz.questions.forEach((q, index) => {
                    const answered = results?.answers?.[q.id];
                    html += `
                        <div class="quiz-question" id="${quiz.id}-${q.id}">
                            <p class="q-text">${index + 1}. ${q.text}</p>
                            <div class="q-options">
                                ${q.options.map(opt => {
                        let className = 'q-option';
                        if (answered) {
                            if (opt.id === q.correctOptionId) className += ' correct';
                            if (opt.id === answered && opt.id !== q.correctOptionId) className += ' wrong';
                            className += ' locked';
                        }
                        return `<div class="${className}" 
                                        onclick="window.Layer67_GlobalPolls.submitQuizAnswer('${quiz.id}', '${q.id}', '${opt.id}')">
                                        ${opt.text}
                                    </div>`;
                    }).join('')}
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
            }

            card.innerHTML = html;
            container.appendChild(card);
        });
    }

    updateQuizQuestionUI(quizId, questionId, optionId, isCorrect) {
        this.renderQuizzes(); // Re-render to update state
    }

    showQuizResultSummary(quizId) {
        this.renderQuizzes();
    }

    resetQuiz(quizId) {
        delete this.userQuizResults[quizId];
        this.saveUserData();
        this.renderQuizzes();
    }

    // --- REALTIME UPDATES ---

    startRealTimeUpdates() {
        if (!this.config.refreshRate) return;
        this.updateInterval = setInterval(() => {
            this.mockLiveVotes();
        }, this.config.refreshRate);
    }

    mockLiveVotes() {
        // Simulate random incoming votes
        let changed = false;
        this.polls.forEach(poll => {
            if (Math.random() > 0.7) {
                const randomOpt = poll.options[Math.floor(Math.random() * poll.options.length)];
                randomOpt.votes += Math.floor(Math.random() * 5);
                poll.totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
                changed = true;
            }
        });
        if (changed) this.renderPolls();
    }
}

// AUTO-START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Layer67_GlobalPolls = new GlobalPollsAndQuizzes();
    });
} else {
    window.Layer67_GlobalPolls = new GlobalPollsAndQuizzes();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalPollsAndQuizzes;
}
