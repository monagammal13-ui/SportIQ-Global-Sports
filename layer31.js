/**
 * Layer 31: User Accounts & Authentication
 * Standalone runtime with complete auth system
 */

class Layer31UserAuth {
    constructor() {
        if (window.__LAYER31__) return window.__LAYER31__;

        this.layerId = 'layer-031';
        this.name = 'User Accounts & Authentication';
        this.version = '1.0.0';

        this.users = [];
        this.currentUser = null;
        this.sessionToken = null;

        console.log(`[Layer 31 v${this.version}] Initializing User Authentication...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._loadUsers();
        this._restoreSession();
        this._setupAuthUI();
        this._registerWithCoreEngines();
        console.log('[Layer 31] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer31-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                sessionTimeout: 3600000,
                requireEmailVerification: false,
                passwordMinLength: 6
            };
        }
    }

    _loadUsers() {
        const stored = localStorage.getItem('layer31_users');
        this.users = stored ? JSON.parse(stored) : [];
    }

    _saveUsers() {
        localStorage.setItem('layer31_users', JSON.stringify(this.users));
    }

    _restoreSession() {
        const token = localStorage.getItem('layer31_session_token');
        const userId = localStorage.getItem('layer31_current_user');

        if (token && userId) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                this.currentUser = user;
                this.sessionToken = token;
                this._emitEvent('layer31:session-restored', { user });
            }
        }
    }

    _setupAuthUI() {
        const container = document.getElementById('layer31-auth-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer31-auth-widget">
                ${this.currentUser ? this._renderUserProfile() : this._renderAuthForms()}
            </div>
        `;

        this._attachEventListeners();
    }

    _renderAuthForms() {
        return `
            <div class="layer31-auth-forms">
                <div class="layer31-tabs">
                    <button class="layer31-tab active" data-tab="login">Login</button>
                    <button class="layer31-tab" data-tab="register">Register</button>
                </div>
                
                <div class="layer31-form-container" id="layer31-login">
                    <form class="layer31-form" id="layer31-login-form">
                        <h3>Login to Your Account</h3>
                        <input type="email" name="email" placeholder="Email Address" required>
                        <input type="password" name="password" placeholder="Password" required>
                        <label>
                            <input type="checkbox" name="remember"> Remember Me
                        </label>
                        <button type="submit" class="layer31-btn-primary">Login</button>
                    </form>
                </div>

                <div class="layer31-form-container hidden" id="layer31-register">
                    <form class="layer31-form" id="layer31-register-form">
                        <h3>Create Account</h3>
                        <input type="text" name="name" placeholder="Full Name" required>
                        <input type="email" name="email" placeholder="Email Address" required>
                        <input type="password" name="password" placeholder="Password" required>
                        <input type="password" name="confirm" placeholder="Confirm Password" required>
                        <button type="submit" class="layer31-btn-primary">Create Account</button>
                    </form>
                </div>
            </div>
        `;
    }

    _renderUserProfile() {
        return `
            <div class="layer31-user-profile">
                <div class="layer31-user-info">
                    <div class="layer31-avatar">${this.currentUser.name.charAt(0)}</div>
                    <div class="layer31-user-details">
                        <strong>${this.currentUser.name}</strong>
                        <span>${this.currentUser.email}</span>
                    </div>
                </div>
                <button onclick="window.__LAYER31__.logout()" class="layer31-btn-secondary">Logout</button>
            </div>
        `;
    }

    _attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.layer31-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                document.querySelectorAll('.layer31-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                document.querySelectorAll('.layer31-form-container').forEach(f => f.classList.add('hidden'));
                document.getElementById(`layer31-${tabName}`).classList.remove('hidden');
            });
        });

        // Login form
        const loginForm = document.getElementById('layer31-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this._handleLogin(new FormData(e.target));
            });
        }

        // Register form
        const registerForm = document.getElementById('layer31-register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this._handleRegister(new FormData(e.target));
            });
        }
    }

    _handleLogin(formData) {
        const email = formData.get('email');
        const password = formData.get('password');

        const user = this.users.find(u => u.email === email);

        if (!user || user.password !== btoa(password)) {
            this._showNotification('Invalid credentials', 'error');
            return;
        }

        this.currentUser = user;
        this.sessionToken = this._generateToken();

        localStorage.setItem('layer31_session_token', this.sessionToken);
        localStorage.setItem('layer31_current_user', user.id);

        this._emitEvent('layer31:login-success', { user });
        this._showNotification('Login successful!', 'success');
        this._setupAuthUI();
    }

    _handleRegister(formData) {
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirm = formData.get('confirm');

        if (password !== confirm) {
            this._showNotification('Passwords do not match', 'error');
            return;
        }

        if (this.users.find(u => u.email === email)) {
            this._showNotification('Email already registered', 'error');
            return;
        }

        const user = {
            id: `user_${Date.now()}`,
            name,
            email,
            password: btoa(password),
            createdAt: Date.now()
        };

        this.users.push(user);
        this._saveUsers();

        this._emitEvent('layer31:register-success', { user });
        this._showNotification('Account created! Please login.', 'success');

        // Switch to login tab
        document.querySelector('.layer31-tab[data-tab="login"]').click();
    }

    logout() {
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('layer31_session_token');
        localStorage.removeItem('layer31_current_user');

        this._emitEvent('layer31:logout', {});
        this._showNotification('Logged out successfully', 'info');
        this._setupAuthUI();
    }

    _generateToken() {
        return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _showNotification(message, type) {
        if (window.__ANTIGRAVITY_NOTIFY__) {
            window.__ANTIGRAVITY_NOTIFY__.show(message, type);
        } else {
            console.log(`[Layer 31] ${type.toUpperCase()}: ${message}`);
        }
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerWithCoreEngines() {
        // Register with Runtime
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 31] Connected to Runtime');
            });
        }

        // Register with Event Bus
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.on('app:init', () => {
                console.log('[Layer 31] Event Bus Connected');
            });
        }

        // Register with State
        if (window.__ANTIGRAVITY_STATE__) {
            window.__ANTIGRAVITY_STATE__.set('layer31.authenticated', !!this.currentUser);
        }
    }

    // Public API
    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getState() {
        return {
            layerId: this.layerId,
            version: this.version,
            authenticated: this.isAuthenticated(),
            user: this.currentUser,
            usersCount: this.users.length
        };
    }
}

// Initialize and export
const layer31 = new Layer31UserAuth();
window.__LAYER31__ = layer31;

export default layer31;
