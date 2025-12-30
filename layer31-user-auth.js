/**
 * Layer 31: User Accounts & Authentication Runtime
 * Complete authentication system with login, register, session management
 */

class UserAuthenticationRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_AUTH__) {
            return window.__ANTIGRAVITY_AUTH__;
        }

        this.version = '1.0.0';
        this.layerId = 'layer-031';
        this.name = 'User Accounts & Authentication';

        this.currentUser = null;
        this.sessionToken = null;
        this.users = [];

        console.log(`[Auth v${this.version}] Initializing...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._loadUsers();
        this._restoreSession();
        this._renderAuthForms();
        this._setupEventListeners();
        console.log('[Auth] Initialized');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/auth-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = { sessionTimeout: 3600000, requireEmailVerification: false };
        }
    }

    _loadUsers() {
        const stored = localStorage.getItem('users_db');
        this.users = stored ? JSON.parse(stored) : [];
    }

    _saveUsers() {
        localStorage.setItem('users_db', JSON.stringify(this.users));
    }

    _restoreSession() {
        const token = localStorage.getItem('session_token');
        const userId = localStorage.getItem('current_user_id');

        if (token && userId) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                this.currentUser = user;
                this.sessionToken = token;
                this._emitEvent('auth:session-restored', { user });
            }
        }
    }

    _renderAuthForms() {
        const container = document.getElementById('authFormsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="auth-forms">
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="register">Register</button>
                </div>
                
                <div class="auth-form-container" id="loginForm">
                    <form class="auth-form" id="loginFormElement">
                        <h2>Login</h2>
                        <div class="form-group">
                            <input type="email" id="loginEmail" placeholder="Email" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="loginPassword" placeholder="Password" required>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" id="rememberMe">
                            <label for="rememberMe">Remember me</label>
                        </div>
                        <button type="submit" class="btn-auth">Login</button>
                        <a href="#" class="forgot-password">Forgot password?</a>
                    </form>
                </div>

                <div class="auth-form-container hidden" id="registerForm">
                    <form class="auth-form" id="registerFormElement">
                        <h2>Register</h2>
                        <div class="form-group">
                            <input type="text" id="registerName" placeholder="Full Name" required>
                        </div>
                        <div class="form-group">
                            <input type="email" id="registerEmail" placeholder="Email" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="registerPassword" placeholder="Password" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="registerConfirm" placeholder="Confirm Password" required>
                        </div>
                        <button type="submit" class="btn-auth">Create Account</button>
                    </form>
                </div>
            </div>
        `;
    }

    _setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this._switchTab(tabName);
            });
        });

        // Login form
        document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this._handleLogin();
        });

        // Register form
        document.getElementById('registerFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this._handleRegister();
        });
    }

    _switchTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.auth-form-container').forEach(f => f.classList.add('hidden'));
        document.getElementById(tabName + 'Form').classList.remove('hidden');
    }

    async _handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const user = this.users.find(u => u.email === email);

        if (!user || user.password !== this._hashPassword(password)) {
            this._showError('Invalid email or password');
            return;
        }

        this.currentUser = user;
        this.sessionToken = this._generateToken();

        localStorage.setItem('session_token', this.sessionToken);
        localStorage.setItem('current_user_id', user.id);

        this._emitEvent('auth:login-success', { user });
        this._showSuccess('Login successful!');
        this._hideAuthForms();
    }

    async _handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;

        if (password !== confirm) {
            this._showError('Passwords do not match');
            return;
        }

        if (this.users.find(u => u.email === email)) {
            this._showError('Email already registered');
            return;
        }

        const user = {
            id: `user_${Date.now()}`,
            name,
            email,
            password: this._hashPassword(password),
            createdAt: Date.now(),
            verified: !this.config.requireEmailVerification
        };

        this.users.push(user);
        this._saveUsers();

        this._emitEvent('auth:register-success', { user });
        this._showSuccess('Account created! Please login.');
        this._switchTab('login');
    }

    logout() {
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('session_token');
        localStorage.removeItem('current_user_id');
        this._emitEvent('auth:logout', {});
        this._showAuthForms();
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    _hashPassword(password) {
        // Simple hash (use proper hashing in production)
        return btoa(password);
    }

    _generateToken() {
        return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _showError(message) {
        if (window.__ANTIGRAVITY_NOTIFY__) {
            window.__ANTIGRAVITY_NOTIFY__.show(message, 'error');
        } else {
            alert(message);
        }
    }

    _showSuccess(message) {
        if (window.__ANTIGRAVITY_NOTIFY__) {
            window.__ANTIGRAVITY_NOTIFY__.show(message, 'success');
        }
    }

    _hideAuthForms() {
        document.getElementById('authFormsContainer')?.classList.add('hidden');
    }

    _showAuthForms() {
        document.getElementById('authFormsContainer')?.classList.remove('hidden');
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    getState() {
        return {
            authenticated: this.isAuthenticated(),
            user: this.currentUser,
            usersCount: this.users.length
        };
    }
}

const userAuth = new UserAuthenticationRuntime();
window.__ANTIGRAVITY_AUTH__ = userAuth;

if (window.__ANTIGRAVITY_RUNTIME__) {
    window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
        console.log('[Auth] Registered with runtime');
    });
}

export default userAuth;
