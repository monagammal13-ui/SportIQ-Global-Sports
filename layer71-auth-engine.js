/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 71: CORE USER AUTHENTICATION & ROLES ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Complete authentication, authorization, and user management system
 * Features: Login, Signup, Session Management, Role-Based Access Control (RBAC)
 * Security: Password hashing, encryption, XSS protection, CSRF tokens
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION & CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        storage: {
            prefix: 'sportiq_',
            sessionKey: 'sportiq_session',
            userKey: 'sportiq_user',
            tokenKey: 'sportiq_token',
            rememberKey: 'sportiq_remember'
        },
        security: {
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            passwordMinLength: 8,
            requireSpecialChar: true,
            requireNumber: true,
            requireUpperCase: true
        },
        api: {
            configPath: '../api-json/auth-config.json',
            usersPath: '../api-json/users.json'
        },
        events: {
            login: 'auth:login',
            logout: 'auth:logout',
            sessionExpired: 'auth:session-expired',
            unauthorized: 'auth:unauthorized',
            roleChanged: 'auth:role-changed'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        currentUser: null,
        isAuthenticated: false,
        sessionActive: false,
        loginAttempts: new Map(),
        config: null,
        roles: new Map(),
        permissions: new Map()
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    const Security = {
        /**
         * Simple hash function (for demo - use bcrypt/scrypt in production)
         */
        hashPassword: async function (password) {
            const salt = this.generateSalt();
            const hash = await this.sha256(password + salt);
            return { hash, salt };
        },

        /**
         * Verify password against hash
         */
        verifyPassword: async function (password, storedHash, salt) {
            const hash = await this.sha256(password + salt);
            return hash === storedHash;
        },

        /**
         * Generate random salt
         */
        generateSalt: function () {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },

        /**
         * SHA-256 hash using Web Crypto API
         */
        sha256: async function (message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },

        /**
         * Generate secure token
         */
        generateToken: function () {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },

        /**
         * Generate CSRF token
         */
        generateCSRFToken: function () {
            return this.generateToken();
        },

        /**
         * Sanitize input to prevent XSS
         */
        sanitizeInput: function (input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        },

        /**
         * Validate password strength
         */
        validatePassword: function (password) {
            const errors = [];

            if (password.length < CONFIG.security.passwordMinLength) {
                errors.push(`Password must be at least ${CONFIG.security.passwordMinLength} characters`);
            }

            if (CONFIG.security.requireUpperCase && !/[A-Z]/.test(password)) {
                errors.push('Password must contain at least one uppercase letter');
            }

            if (CONFIG.security.requireNumber && !/[0-9]/.test(password)) {
                errors.push('Password must contain at least one number');
            }

            if (CONFIG.security.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                errors.push('Password must contain at least one special character');
            }

            return {
                valid: errors.length === 0,
                errors
            };
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const SessionManager = {
        /**
         * Create new session
         */
        createSession: function (user, rememberMe = false) {
            const token = Security.generateToken();
            const expiresAt = Date.now() + (rememberMe ?
                CONFIG.security.rememberMeDuration :
                CONFIG.security.sessionTimeout);

            const session = {
                token,
                userId: user.id,
                username: user.username,
                role: user.role,
                createdAt: Date.now(),
                expiresAt,
                rememberMe
            };

            // Store in localStorage or sessionStorage
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem(CONFIG.storage.sessionKey, JSON.stringify(session));
            storage.setItem(CONFIG.storage.userKey, JSON.stringify(user));
            storage.setItem(CONFIG.storage.tokenKey, token);

            state.sessionActive = true;
            this.startSessionTimer(expiresAt);

            return session;
        },

        /**
         * Get current session
         */
        getSession: function () {
            // Check both storages
            let sessionData = sessionStorage.getItem(CONFIG.storage.sessionKey);
            if (!sessionData) {
                sessionData = localStorage.getItem(CONFIG.storage.sessionKey);
            }

            if (!sessionData) return null;

            try {
                const session = JSON.parse(sessionData);

                // Check if expired
                if (Date.now() > session.expiresAt) {
                    this.destroySession();
                    return null;
                }

                return session;
            } catch (e) {
                return null;
            }
        },

        /**
         * Refresh session
         */
        refreshSession: function () {
            const session = this.getSession();
            if (!session) return false;

            const user = this.getCurrentUser();
            if (!user) return false;

            this.createSession(user, session.rememberMe);
            return true;
        },

        /**
         * Destroy session
         */
        destroySession: function () {
            sessionStorage.removeItem(CONFIG.storage.sessionKey);
            sessionStorage.removeItem(CONFIG.storage.userKey);
            sessionStorage.removeItem(CONFIG.storage.tokenKey);
            localStorage.removeItem(CONFIG.storage.sessionKey);
            localStorage.removeItem(CONFIG.storage.userKey);
            localStorage.removeItem(CONFIG.storage.tokenKey);

            state.sessionActive = false;
            state.currentUser = null;
            state.isAuthenticated = false;

            this.stopSessionTimer();
        },

        /**
         * Get current user from session
         */
        getCurrentUser: function () {
            let userData = sessionStorage.getItem(CONFIG.storage.userKey);
            if (!userData) {
                userData = localStorage.getItem(CONFIG.storage.userKey);
            }

            if (!userData) return null;

            try {
                return JSON.parse(userData);
            } catch (e) {
                return null;
            }
        },

        /**
         * Start session expiration timer
         */
        startSessionTimer: function (expiresAt) {
            this.stopSessionTimer();

            const timeUntilExpiry = expiresAt - Date.now();
            if (timeUntilExpiry > 0) {
                state.sessionTimer = setTimeout(() => {
                    this.handleSessionExpired();
                }, timeUntilExpiry);
            }
        },

        /**
         * Stop session timer
         */
        stopSessionTimer: function () {
            if (state.sessionTimer) {
                clearTimeout(state.sessionTimer);
                state.sessionTimer = null;
            }
        },

        /**
         * Handle session expiration
         */
        handleSessionExpired: function () {
            this.destroySession();

            // Fire event
            const event = new CustomEvent(CONFIG.events.sessionExpired, {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            // Redirect to login if needed
            if (window.location.pathname !== '/html/login.html') {
                this.redirectToLogin();
            }
        },

        /**
         * Redirect to login page
         */
        redirectToLogin: function (returnUrl) {
            const url = returnUrl || window.location.href;
            window.location.href = `/html/login.html?returnUrl=${encodeURIComponent(url)}`;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTHENTICATION
    // ═══════════════════════════════════════════════════════════════════════

    const Auth = {
        /**
         * Login user
         */
        login: async function (username, password, rememberMe = false) {
            try {
                // Check lockout
                if (this.isLockedOut(username)) {
                    return {
                        success: false,
                        error: 'Account temporarily locked due to too many failed attempts'
                    };
                }

                // Sanitize inputs
                username = Security.sanitizeInput(username);

                // Load users (in production, this would be an API call)
                const users = await this.loadUsers();
                const user = users.find(u => u.username === username || u.email === username);

                if (!user) {
                    this.recordFailedAttempt(username);
                    return {
                        success: false,
                        error: 'Invalid username or password'
                    };
                }

                // Verify password
                const isValid = await Security.verifyPassword(password, user.passwordHash, user.salt);

                if (!isValid) {
                    this.recordFailedAttempt(username);
                    return {
                        success: false,
                        error: 'Invalid username or password'
                    };
                }

                // Clear failed attempts
                this.clearFailedAttempts(username);

                // Create session
                const session = SessionManager.createSession(user, rememberMe);

                // Update state
                state.currentUser = user;
                state.isAuthenticated = true;

                // Fire login event
                const event = new CustomEvent(CONFIG.events.login, {
                    detail: { user, session }
                });
                document.dispatchEvent(event);

                console.log('✅ [Auth] User logged in:', username);

                return {
                    success: true,
                    user,
                    session
                };

            } catch (error) {
                console.error('❌ [Auth] Login error:', error);
                return {
                    success: false,
                    error: 'Login failed. Please try again.'
                };
            }
        },

        /**
         * Signup new user
         */
        signup: async function (userData) {
            try {
                // Validate required fields
                const required = ['username', 'email', 'password'];
                for (const field of required) {
                    if (!userData[field]) {
                        return {
                            success: false,
                            error: `${field} is required`
                        };
                    }
                }

                // Sanitize inputs
                userData.username = Security.sanitizeInput(userData.username);
                userData.email = Security.sanitizeInput(userData.email);
                userData.firstName = Security.sanitizeInput(userData.firstName || '');
                userData.lastName = Security.sanitizeInput(userData.lastName || '');

                // Validate password
                const passwordValidation = Security.validatePassword(userData.password);
                if (!passwordValidation.valid) {
                    return {
                        success: false,
                        error: passwordValidation.errors.join(', ')
                    };
                }

                // Validate email
                if (!this.isValidEmail(userData.email)) {
                    return {
                        success: false,
                        error: 'Invalid email address'
                    };
                }

                // Load existing users
                const users = await this.loadUsers();

                // Check if username exists
                if (users.find(u => u.username === userData.username)) {
                    return {
                        success: false,
                        error: 'Username already exists'
                    };
                }

                // Check if email exists
                if (users.find(u => u.email === userData.email)) {
                    return {
                        success: false,
                        error: 'Email already registered'
                    };
                }

                // Hash password
                const { hash, salt } = await Security.hashPassword(userData.password);

                // Create new user
                const newUser = {
                    id: this.generateUserId(),
                    username: userData.username,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    passwordHash: hash,
                    salt: salt,
                    role: userData.role || 'user',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    profile: {
                        avatar: userData.avatar || null,
                        bio: userData.bio || '',
                        preferences: {}
                    }
                };

                // Save user (in production, this would be an API call)
                users.push(newUser);
                await this.saveUsers(users);

                console.log('✅ [Auth] User registered:', newUser.username);

                return {
                    success: true,
                    user: newUser
                };

            } catch (error) {
                console.error('❌ [Auth] Signup error:', error);
                return {
                    success: false,
                    error: 'Registration failed. Please try again.'
                };
            }
        },

        /**
         * Logout user
         */
        logout: function () {
            const user = state.currentUser;

            SessionManager.destroySession();

            // Fire logout event
            const event = new CustomEvent(CONFIG.events.logout, {
                detail: { user, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('✅ [Auth] User logged out');

            // Redirect to login
            if (window.location.pathname !== '/html/login.html') {
                window.location.href = '/html/login.html';
            }
        },

        /**
         * Check if user is authenticated
         */
        isAuthenticated: function () {
            const session = SessionManager.getSession();
            return session !== null;
        },

        /**
         * Get current user
         */
        getCurrentUser: function () {
            return SessionManager.getCurrentUser();
        },

        /**
         * Update user profile
         */
        updateProfile: async function (updates) {
            try {
                const currentUser = this.getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Not authenticated' };
                }

                const users = await this.loadUsers();
                const userIndex = users.findIndex(u => u.id === currentUser.id);

                if (userIndex === -1) {
                    return { success: false, error: 'User not found' };
                }

                // Merge updates
                users[userIndex] = {
                    ...users[userIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };

                await this.saveUsers(users);

                // Update session
                SessionManager.createSession(users[userIndex], SessionManager.getSession().rememberMe);
                state.currentUser = users[userIndex];

                console.log('✅ [Auth] Profile updated');

                return {
                    success: true,
                    user: users[userIndex]
                };

            } catch (error) {
                console.error('❌ [Auth] Update profile error:', error);
                return {
                    success: false,
                    error: 'Failed to update profile'
                };
            }
        },

        /**
         * Change password
         */
        changePassword: async function (oldPassword, newPassword) {
            try {
                const currentUser = this.getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Not authenticated' };
                }

                // Verify old password
                const isValid = await Security.verifyPassword(oldPassword, currentUser.passwordHash, currentUser.salt);
                if (!isValid) {
                    return { success: false, error: 'Current password is incorrect' };
                }

                // Validate new password
                const validation = Security.validatePassword(newPassword);
                if (!validation.valid) {
                    return { success: false, error: validation.errors.join(', ') };
                }

                // Hash new password
                const { hash, salt } = await Security.hashPassword(newPassword);

                // Update user
                const users = await this.loadUsers();
                const userIndex = users.findIndex(u => u.id === currentUser.id);

                users[userIndex].passwordHash = hash;
                users[userIndex].salt = salt;
                users[userIndex].updatedAt = new Date().toISOString();

                await this.saveUsers(users);

                console.log('✅ [Auth] Password changed');

                return { success: true };

            } catch (error) {
                console.error('❌ [Auth] Change password error:', error);
                return { success: false, error: 'Failed to change password' };
            }
        },

        // Helper methods
        isLockedOut: function (username) {
            const attempts = state.loginAttempts.get(username);
            if (!attempts) return false;

            if (attempts.count >= CONFIG.security.maxLoginAttempts) {
                const lockoutEnd = attempts.lastAttempt + CONFIG.security.lockoutDuration;
                if (Date.now() < lockoutEnd) {
                    return true;
                } else {
                    // Lockout expired, clear attempts
                    this.clearFailedAttempts(username);
                    return false;
                }
            }

            return false;
        },

        recordFailedAttempt: function (username) {
            const attempts = state.loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
            attempts.count++;
            attempts.lastAttempt = Date.now();
            state.loginAttempts.set(username, attempts);
        },

        clearFailedAttempts: function (username) {
            state.loginAttempts.delete(username);
        },

        isValidEmail: function (email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        generateUserId: function () {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        loadUsers: async function () {
            try {
                const response = await fetch(CONFIG.api.usersPath);
                if (!response.ok) {
                    // If file doesn't exist, return default users
                    return this.getDefaultUsers();
                }
                return await response.json();
            } catch (error) {
                console.warn('⚠️ [Auth] Could not load users, using defaults');
                return this.getDefaultUsers();
            }
        },

        saveUsers: async function (users) {
            // In client-side, we can only store in localStorage
            localStorage.setItem('sportiq_users_db', JSON.stringify(users));
            console.log('✅ [Auth] Users saved to localStorage');
        },

        getDefaultUsers: function () {
            // Check localStorage first
            const stored = localStorage.getItem('sportiq_users_db');
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    // Fall through to defaults
                }
            }

            // Default demo users
            return [
                {
                    id: 'user_admin_1',
                    username: 'admin',
                    email: 'admin@sportiq.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    passwordHash: 'demoHash123',
                    salt: 'demoSalt123',
                    role: 'admin',
                    status: 'active',
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    profile: {
                        avatar: null,
                        bio: 'Platform Administrator',
                        preferences: {}
                    }
                },
                {
                    id: 'user_demo_1',
                    username: 'demo',
                    email: 'demo@sportiq.com',
                    firstName: 'Demo',
                    lastName: 'User',
                    passwordHash: 'demoHash123',
                    salt: 'demoSalt123',
                    role: 'user',
                    status: 'active',
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    profile: {
                        avatar: null,
                        bio: 'Demo User Account',
                        preferences: {}
                    }
                }
            ];
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ROLE-BASED ACCESS CONTROL (RBAC)
    // ═══════════════════════════════════════════════════════════════════════

    const RBAC = {
        /**
         * Load roles and permissions
         */
        loadConfig: async function () {
            try {
                const response = await fetch(CONFIG.api.configPath);
                if (!response.ok) {
                    state.config = this.getDefaultConfig();
                } else {
                    state.config = await response.json();
                }

                this.setupRolesAndPermissions();
            } catch (error) {
                console.warn('⚠️ [RBAC] Could not load config, using defaults');
                state.config = this.getDefaultConfig();
                this.setupRolesAndPermissions();
            }
        },

        setupRolesAndPermissions: function () {
            if (!state.config) return;

            // Setup roles
            if (state.config.roles) {
                state.config.roles.forEach(role => {
                    state.roles.set(role.name, role);
                });
            }

            // Setup permissions
            if (state.config.permissions) {
                state.config.permissions.forEach(perm => {
                    state.permissions.set(perm.name, perm);
                });
            }
        },

        /**
         * Check if user has permission
         */
        hasPermission: function (permissionName, user = null) {
            user = user || state.currentUser;
            if (!user) return false;

            const role = state.roles.get(user.role);
            if (!role) return false;

            return role.permissions.includes(permissionName) || role.permissions.includes('*');
        },

        /**
         * Check if user has role
         */
        hasRole: function (roleName, user = null) {
            user = user || state.currentUser;
            if (!user) return false;

            return user.role === roleName;
        },

        /**
         * Require permission (throw error if not found)
         */
        requirePermission: function (permissionName) {
            if (!this.hasPermission(permissionName)) {
                const event = new CustomEvent(CONFIG.events.unauthorized, {
                    detail: { permission: permissionName, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                throw new Error(`Permission denied: ${permissionName}`);
            }
        },

        /**
         * Require role
         */
        requireRole: function (roleName) {
            if (!this.hasRole(roleName)) {
                const event = new CustomEvent(CONFIG.events.unauthorized, {
                    detail: { role: roleName, timestamp: Date.now() }
                });
                document.dispatchEvent(event);

                throw new Error(`Role required: ${roleName}`);
            }
        },

        getDefaultConfig: function () {
            return {
                roles: [
                    {
                        name: 'admin',
                        displayName: 'Administrator',
                        permissions: ['*']
                    },
                    {
                        name: 'editor',
                        displayName: 'Editor',
                        permissions: ['content.create', 'content.edit', 'content.delete', 'content.view']
                    },
                    {
                        name: 'user',
                        displayName: 'User',
                        permissions: ['content.view', 'profile.edit']
                    },
                    {
                        name: 'guest',
                        displayName: 'Guest',
                        permissions: ['content.view']
                    }
                ],
                permissions: [
                    { name: 'content.create', description: 'Create content' },
                    { name: 'content.edit', description: 'Edit content' },
                    { name: 'content.delete', description: 'Delete content' },
                    { name: 'content.view', description: 'View content' },
                    { name: 'user.manage', description: 'Manage users' },
                    { name: 'profile.edit', description: 'Edit own profile' }
                ],
                passwordPolicy: {
                    minLength: 8,
                    requireUpperCase: true,
                    requireLowerCase: true,
                    requireNumber: true,
                    requireSpecialChar: true,
                    maxAge: 90
                }
            };
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════

    const UI = {
        /**
         * Initialize authentication UI
         */
        init: function () {
            this.setupLoginForm();
            this.setupSignupForm();
            this.setupProfileForms();
            this.setupUserMenu();
            this.updateAuthUI();
        },

        setupLoginForm: function () {
            const loginForm = document.getElementById('loginForm');
            if (!loginForm) return;

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const username = document.getElementById('username')?.value;
                const password = document.getElementById('password')?.value;
                const rememberMe = document.getElementById('rememberMe')?.checked;

                const result = await Auth.login(username, password, rememberMe);

                if (result.success) {
                    // Redirect to return URL or home
                    const params = new URLSearchParams(window.location.search);
                    const returnUrl = params.get('returnUrl') || '/html/index.html';
                    window.location.href = returnUrl;
                } else {
                    this.showError(result.error);
                }
            });
        },

        setupSignupForm: function () {
            const signupForm = document.getElementById('signupForm');
            if (!signupForm) return;

            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const userData = {
                    username: document.getElementById('username')?.value,
                    email: document.getElementById('email')?.value,
                    password: document.getElementById('password')?.value,
                    firstName: document.getElementById('firstName')?.value,
                    lastName: document.getElementById('lastName')?.value
                };

                const result = await Auth.signup(userData);

                if (result.success) {
                    // Auto login
                    await Auth.login(userData.username, userData.password);
                    window.location.href = '/html/index.html';
                } else {
                    this.showError(result.error);
                }
            });
        },

        setupProfileForms: function () {
            // Profile update form
            const profileForm = document.getElementById('profileForm');
            if (profileForm) {
                profileForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const updates = {
                        firstName: document.getElementById('firstName')?.value,
                        lastName: document.getElementById('lastName')?.value,
                        email: document.getElementById('email')?.value,
                        profile: {
                            bio: document.getElementById('bio')?.value
                        }
                    };

                    const result = await Auth.updateProfile(updates);

                    if (result.success) {
                        this.showSuccess('Profile updated successfully');
                    } else {
                        this.showError(result.error);
                    }
                });
            }

            // Password change form
            const passwordForm = document.getElementById('passwordForm');
            if (passwordForm) {
                passwordForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const oldPassword = document.getElementById('oldPassword')?.value;
                    const newPassword = document.getElementById('newPassword')?.value;

                    const result = await Auth.changePassword(oldPassword, newPassword);

                    if (result.success) {
                        this.showSuccess('Password changed successfully');
                        passwordForm.reset();
                    } else {
                        this.showError(result.error);
                    }
                });
            }
        },

        setupUserMenu: function () {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Auth.logout();
                });
            }
        },

        updateAuthUI: function () {
            const isAuth = Auth.isAuthenticated();
            const user = Auth.getCurrentUser();

            // Update user menu
            const userMenu = document.getElementById('userMenu');
            const loginLink = document.getElementById('loginLink');

            if (userMenu && loginLink) {
                if (isAuth && user) {
                    userMenu.style.display = 'block';
                    loginLink.style.display = 'none';

                    const username = document.getElementById('currentUsername');
                    if (username) username.textContent = user.username;
                } else {
                    userMenu.style.display = 'none';
                    loginLink.style.display = 'block';
                }
            }
        },

        showError: function (message) {
            alert('Error: ' + message); // Replace with better UI
        },

        showSuccess: function (message) {
            alert('Success: ' + message); // Replace with better UI
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🔐 LAYER 71: AUTHENTICATION ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Load configuration
        await RBAC.loadConfig();

        // Check existing session
        const session = SessionManager.getSession();
        if (session) {
            state.currentUser = SessionManager.getCurrentUser();
            state.isAuthenticated = true;
            state.sessionActive = true;
            console.log('✅ [Auth] Session restored:', state.currentUser?.username);
        }

        // Initialize UI
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => UI.init());
        } else {
            UI.init();
        }

        console.log('✅ [Auth] Authentication engine initialized');
        console.log('📊 [Auth] Authenticated:', state.isAuthenticated);
        console.log('👤 [Auth] Current User:', state.currentUser?.username || 'None');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.AuthEngine = {
        // Authentication
        login: Auth.login.bind(Auth),
        logout: Auth.logout.bind(Auth),
        signup: Auth.signup.bind(Auth),
        isAuthenticated: Auth.isAuthenticated.bind(Auth),
        getCurrentUser: Auth.getCurrentUser.bind(Auth),
        updateProfile: Auth.updateProfile.bind(Auth),
        changePassword: Auth.changePassword.bind(Auth),

        // Session
        getSession: SessionManager.getSession.bind(SessionManager),
        refreshSession: SessionManager.refreshSession.bind(SessionManager),

        // RBAC
        hasPermission: RBAC.hasPermission.bind(RBAC),
        hasRole: RBAC.hasRole.bind(RBAC),
        requirePermission: RBAC.requirePermission.bind(RBAC),
        requireRole: RBAC.requireRole.bind(RBAC),

        // Security
        validatePassword: Security.validatePassword.bind(Security),
        sanitizeInput: Security.sanitizeInput.bind(Security),

        // State
        state: () => ({ ...state }),

        // Config
        CONFIG
    };

    // Auto-initialize
    initialize();

})();
