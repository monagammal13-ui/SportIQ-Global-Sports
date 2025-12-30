/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 189 – EDITORIAL ACCOUNTABILITY LEDGER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Transparent ledger of editorial changes, corrections, and updates.
 * 
 * @version 1.0.0
 * @layer 189
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 189,
        name: 'Editorial Accountability Ledger',

        intervals: {
            ledgerSync: 30000,
            analyticsUpdate: 60000
        }
    };

    class AccountabilityLedger {
        constructor() {
            this.ledger = new Map();
            this.changes = [];
            this.config = null;
            this.stats = {
                totalChanges: 0,
                corrections: 0,
                updates: 0,
                retractions: 0
            };

            this.init();
        }

        async init() {
            console.log('📋 [Layer 189] Accountability Ledger - Initializing...');

            try {
                await this.loadConfiguration();
                this.setupLedger();
                this.startMonitoring();
                this.createDashboard();

                console.log('✅ [Layer 189] Accountability Ledger - Active');

            } catch (error) {
                console.error('❌ [Layer 189] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer189-ledger.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupLedger() {
            document.addEventListener('article:updated', (event) => {
                if (event.detail && event.detail.article) {
                    this.recordChange(event.detail.article, 'update');
                }
            });

            document.addEventListener('article:corrected', (event) => {
                if (event.detail) {
                    this.recordChange(event.detail.article, 'correction', event.detail.correction);
                }
            });
        }

        recordChange(article, changeType, details = {}) {
            const change = {
                id: `change-${Date.now()}`,
                articleId: article.id,
                type: changeType,
                timestamp: new Date().toISOString(),
                editor: details.editor || 'system',
                previousVersion: details.previousVersion || null,
                newVersion: details.newVersion || article.content,
                reason: details.reason || '',
                visible: true
            };

            this.changes.push(change);
            this.stats.totalChanges++;

            if (changeType === 'correction') this.stats.corrections++;
            else if (changeType === 'update') this.stats.updates++;
            else if (changeType === 'retraction') this.stats.retractions++;

            // Update ledger for article
            if (!this.ledger.has(article.id)) {
                this.ledger.set(article.id, []);
            }
            this.ledger.get(article.id).push(change);

            // Display change notice
            this.displayChangeNotice(article.id, change);

            document.dispatchEvent(new CustomEvent('ledger:recorded', {
                detail: { article, change }
            }));
        }

        displayChangeNotice(articleId, change) {
            const articleElement = document.querySelector(`[data-article-id="${articleId}"]`);
            if (!articleElement) return;

            const notice = document.createElement('div');
            notice.className = `change-notice change-type-${change.type}`;
            notice.innerHTML = `
                <div class="notice-header">
                    <strong>${change.type.toUpperCase()}</strong>
                    <span class="notice-time">${new Date(change.timestamp).toLocaleString()}</span>
                </div>
                ${change.reason ? `<p class="notice-reason">${change.reason}</p>` : ''}
                <button class="view-history-btn" onclick="window.Layer189_Ledger.showHistory('${articleId}')">
                    View Full History
                </button>
            `;

            const insertPoint = articleElement.querySelector('.article-content') || articleElement;
            insertPoint.insertBefore(notice, insertPoint.firstChild);
        }

        showHistory(articleId) {
            const history = this.ledger.get(articleId);
            if (!history || history.length === 0) return;

            const modal = document.createElement('div');
            modal.className = 'ledger-modal';
            modal.innerHTML = `
                <div class="ledger-modal-content">
                    <div class="ledger-modal-header">
                        <h3>Editorial History</h3>
                        <button class="modal-close" onclick="this.closest('.ledger-modal').remove()">×</button>
                    </div>
                    <div class="ledger-modal-body">
                        <div class="ledger-timeline">
                            ${history.reverse().map((change, index) => `
                                <div class="ledger-entry">
                                    <div class="entry-marker">${history.length - index}</div>
                                    <div class="entry-content">
                                        <div class="entry-type">${change.type.toUpperCase()}</div>
                                        <div class="entry-time">${new Date(change.timestamp).toLocaleString()}</div>
                                        <div class="entry-editor">By: ${change.editor}</div>
                                        ${change.reason ? `<div class="entry-reason">${change.reason}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        startMonitoring() {
            setInterval(() => {
                this.syncLedger();
            }, CONFIG.intervals.ledgerSync);
        }

        syncLedger() {
            // Persist ledger to storage
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer189-dashboard';
            dashboard.className = 'layer189-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer189-dashboard-header">
                    <h3>📋 Ledger</h3>
                    <button class="layer189-close-btn">×</button>
                </div>
                <div class="layer189-dashboard-content">
                    <div class="layer189-stat">
                        <span class="layer189-stat-label">Total Changes:</span>
                        <span class="layer189-stat-value" id="layer189-total">0</span>
                    </div>
                    <div class="layer189-stat">
                        <span class="layer189-stat-label">Corrections:</span>
                        <span class="layer189-stat-value" id="layer189-corrections">0</span>
                    </div>
                    <div class="layer189-stat">
                        <span class="layer189-stat-label">Updates:</span>
                        <span class="layer189-stat-value" id="layer189-updates">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer189-toggle-btn';
            toggleBtn.innerHTML = '📋';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer189-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer189-total');
            const correctionsEl = document.getElementById('layer189-corrections');
            const updatesEl = document.getElementById('layer189-updates');

            if (totalEl) totalEl.textContent = this.stats.totalChanges;
            if (correctionsEl) correctionsEl.textContent = this.stats.corrections;
            if (updatesEl) updatesEl.textContent = this.stats.updates;
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLedger);
    } else {
        initLedger();
    }

    function initLedger() {
        const ledger = new AccountabilityLedger();
        window.Layer189_Ledger = ledger;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.ledger = ledger;
        console.log('🎯 [Layer 189] Accountability Ledger - Ready');
    }

})();
