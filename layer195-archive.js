/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 195 – GLOBAL ARCHIVE PRESERVATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Preserve all published content in immutable long-term archives.
 * 
 * @version 1.0.0
 * @layer 195
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 195,
        name: 'Global Archive Preservation Engine'
    };

    class ArchivePreservation {
        constructor() {
            this.archive = new Map();
            this.stats = {
                totalArchived: 0,
                archiveSize: 0,
                oldestEntry: null
            };
            this.init();
        }

        async init() {
            console.log('📚 [Layer 195] Archive Preservation - Initializing...');
            await this.loadConfiguration();
            this.setupArchiving();
            this.createDashboard();
            console.log('✅ [Layer 195] Archive Preservation - Active');
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer195-archive.json');
                this.config = response.ok ? await response.json() : CONFIG;
            } catch (error) {
                this.config = CONFIG;
            }
        }

        setupArchiving() {
            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.archiveArticle(event.detail.article);
                }
            });
        }

        archiveArticle(article) {
            const archiveEntry = {
                id: `archive-${Date.now()}`,
                articleId: article.id,
                content: article.content,
                title: article.title,
                author: article.author,
                timestamp: new Date().toISOString(),
                immutable: true,
                hash: this.createHash(article.content)
            };

            this.archive.set(article.id, archiveEntry);
            this.stats.totalArchived++;
            this.stats.archiveSize += (article.content || '').length;

            if (!this.stats.oldestEntry) {
                this.stats.oldestEntry = archiveEntry.timestamp;
            }

            this.updateDashboard();

            document.dispatchEvent(new CustomEvent('archive:preserved', {
                detail: { article, archiveEntry }
            }));
        }

        createHash(content) {
            let hash = 0;
            for (let i = 0; i < content.length; i++) {
                hash = ((hash << 5) - hash) + content.charCodeAt(i);
                hash |= 0;
            }
            return hash.toString(16);
        }

        retrieveFromArchive(articleId) {
            return this.archive.get(articleId);
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer195-dashboard';
            dashboard.className = 'layer195-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer195-dashboard-header">
                    <h3>📚 Archive</h3>
                    <button class="layer195-close-btn">×</button>
                </div>
                <div class="layer195-dashboard-content">
                    <div class="layer195-stat">
                        <span class="layer195-stat-label">Archived:</span>
                        <span class="layer195-stat-value" id="layer195-total">0</span>
                    </div>
                    <div class="layer195-stat">
                        <span class="layer195-stat-label">Size (chars):</span>
                        <span class="layer195-stat-value" id="layer195-size">0</span>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer195-toggle-btn';
            toggleBtn.innerHTML = '📚';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer195-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer195-total');
            const sizeEl = document.getElementById('layer195-size');

            if (totalEl) totalEl.textContent = this.stats.totalArchived;
            if (sizeEl) sizeEl.textContent = this.stats.archiveSize.toLocaleString();
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArchive);
    } else {
        initArchive();
    }

    function initArchive() {
        const archive = new ArchivePreservation();
        window.Layer195_Archive = archive;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.archive = archive;
        console.log('🎯 [Layer 195] Archive Preservation - Ready');
    }

})();
