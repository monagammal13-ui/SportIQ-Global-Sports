/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 166 – LONG-FORM INVESTIGATIVE STRUCTURING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically structure long investigative articles into coherent 
 * sections, timelines, and evidence blocks.
 * 
 * @version 1.0.0
 * @layer 166
 * @status ACTIVE
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        version: '1.0.0',
        layerId: 166,
        name: 'Long-Form Investigative Structuring Engine',

        longFormThreshold: 1500, // words

        sectionTypes: ['executive-summary', 'background', 'investigation', 'evidence', 'analysis', 'conclusion'],

        intervals: {
            structuringCheck: 5000,
            analyticsUpdate: 30000
        }
    };

    class InvestigativeStructuring {
        constructor() {
            this.structuredArticles = new Map();
            this.structuringQueue = [];
            this.structuringLog = [];
            this.config = null;
            this.stats = {
                totalStructured: 0,
                longFormArticles: 0,
                timelineGenerated: 0,
                evidenceBlocksCreated: 0
            };

            this.init();
        }

        async init() {
            console.log('📚 [Layer 166] Investigative Structuring Engine - Initializing...');

            try {
                await this.loadConfiguration();
                this.startStructuringEngine();
                this.startAnalytics();
                this.createDashboard();

                console.log('✅ [Layer 166] Investigative Structuring Engine - Active');
                this.logStructuring('SYSTEM', 'Investigative structuring engine initialized');

            } catch (error) {
                console.error('❌ [Layer 166] Initialization failed:', error);
            }
        }

        async loadConfiguration() {
            try {
                const response = await fetch('../api-json/layer166-investigative-structuring.json');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    this.config = CONFIG;
                }
            } catch (error) {
                this.config = CONFIG;
            }
        }

        structureArticle(article) {
            if (!article || !article.id) return null;

            try {
                const wordCount = this.countWords(article.content || '');

                // Only structure long-form articles
                if (wordCount < CONFIG.longFormThreshold) {
                    return null;
                }

                const structure = {
                    articleId: article.id,
                    wordCount: wordCount,
                    sections: [],
                    timeline: [],
                    evidenceBlocks: [],
                    tableOfContents: [],
                    timestamp: new Date().toISOString()
                };

                // Identify and create sections
                structure.sections = this.identifySections(article);

                // Generate timeline if applicable
                structure.timeline = this.generateTimeline(article);

                // Extract evidence blocks
                structure.evidenceBlocks = this.extractEvidenceBlocks(article);

                // Generate table of contents
                structure.tableOfContents = this.generateTableOfContents(structure.sections);

                // Apply structure to article
                this.applyStructure(article, structure);

                // Store structure
                this.structuredArticles.set(article.id, structure);
                this.stats.totalStructured++;
                this.stats.longFormArticles++;
                if (structure.timeline.length > 0) this.stats.timelineGenerated++;
                this.stats.evidenceBlocksCreated += structure.evidenceBlocks.length;

                this.logStructuring('STRUCTURE', `Article "${article.title}" - ${structure.sections.length} sections, ${structure.evidenceBlocks.length} evidence blocks`);

                document.dispatchEvent(new CustomEvent('article:structured', {
                    detail: { article, structure }
                }));

                return structure;

            } catch (error) {
                console.error(`❌ [Layer 166] Structuring failed for article ${article.id}:`, error);
                return null;
            }
        }

        countWords(text) {
            return text.trim().split(/\s+/).length;
        }

        identifySections(article) {
            const content = article.content || '';
            const sections = [];

            // Detect section headings (h2, h3 tags or markdown ##)
            const headingMatches = content.match(/(?:<h[23]>|##\s+)([^<\n]+)(?:<\/h[23]>|\n)/gi) || [];

            if (headingMatches.length > 0) {
                headingMatches.forEach((heading, index) => {
                    const cleanHeading = heading.replace(/<\/?h[23]>|##\s+/g, '').trim();
                    sections.push({
                        id: `section-${index + 1}`,
                        type: this.detectSectionType(cleanHeading),
                        title: cleanHeading,
                        order: index + 1
                    });
                });
            } else {
                // Auto-generate sections based on content length
                const paragraphs = content.split(/\n\n+/);
                const segmentSize = Math.ceil(paragraphs.length / 4);

                CONFIG.sectionTypes.slice(0, 4).forEach((type, index) => {
                    sections.push({
                        id: `section-${index + 1}`,
                        type: type,
                        title: this.generateSectionTitle(type),
                        order: index + 1
                    });
                });
            }

            return sections;
        }

        detectSectionType(heading) {
            const headingLower = heading.toLowerCase();

            if (headingLower.includes('summary') || headingLower.includes('overview')) return 'executive-summary';
            if (headingLower.includes('background') || headingLower.includes('context')) return 'background';
            if (headingLower.includes('investigation') || headingLower.includes('findings')) return 'investigation';
            if (headingLower.includes('evidence') || headingLower.includes('proof')) return 'evidence';
            if (headingLower.includes('analysis') || headingLower.includes('interpretation')) return 'analysis';
            if (headingLower.includes('conclusion') || headingLower.includes('verdict')) return 'conclusion';

            return 'investigation';
        }

        generateSectionTitle(type) {
            const titles = {
                'executive-summary': 'Executive Summary',
                'background': 'Background & Context',
                'investigation': 'Investigation Findings',
                'evidence': 'Supporting Evidence',
                'analysis': 'Analysis & Interpretation',
                'conclusion': 'Conclusions'
            };
            return titles[type] || 'Section';
        }

        generateTimeline(article) {
            const content = article.content || '';
            const timeline = [];

            // Extract date mentions
            const datePattern = /(?:in |on |since |from |during )?(\d{4}|\w+ \d{1,2},? \d{4}|\d{1,2} \w+ \d{4})/gi;
            const dateMatches = content.match(datePattern) || [];

            dateMatches.forEach((dateStr, index) => {
                if (timeline.length < 10) { // Limit to 10 timeline events
                    timeline.push({
                        id: `event-${index + 1}`,
                        date: dateStr.trim(),
                        description: this.extractEventContext(content, dateStr),
                        order: index + 1
                    });
                }
            });

            return timeline;
        }

        extractEventContext(content, dateStr) {
            // Extract sentence containing the date
            const sentences = content.split(/[.!?]\s+/);
            const matchingSentence = sentences.find(s => s.includes(dateStr));
            return matchingSentence ? matchingSentence.substring(0, 150) + '...' : 'Event occurred';
        }

        extractEvidenceBlocks(article) {
            const content = article.content || '';
            const evidenceBlocks = [];

            // Look for quotes as evidence
            const quoteMatches = content.match(/"([^"]{20,200})"/g) || [];
            quoteMatches.forEach((quote, index) => {
                evidenceBlocks.push({
                    id: `evidence-${index + 1}`,
                    type: 'quote',
                    content: quote,
                    order: index + 1
                });
            });

            // Look for statistical data as evidence
            const statPattern = /\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?/gi;
            const statMatches = content.match(statPattern) || [];
            statMatches.slice(0, 5).forEach((stat, index) => {
                evidenceBlocks.push({
                    id: `evidence-stat-${index + 1}`,
                    type: 'statistic',
                    content: stat,
                    context: this.extractStatContext(content, stat),
                    order: evidenceBlocks.length + 1
                });
            });

            return evidenceBlocks;
        }

        extractStatContext(content, stat) {
            const sentences = content.split(/[.!?]\s+/);
            const matchingSentence = sentences.find(s => s.includes(stat));
            return matchingSentence ? matchingSentence.substring(0, 100) : '';
        }

        generateTableOfContents(sections) {
            return sections.map(section => ({
                id: section.id,
                title: section.title,
                anchor: `#${section.id}`,
                level: 1
            }));
        }

        applyStructure(article, structure) {
            const articleElement = document.querySelector(`[data-article-id="${article.id}"]`);
            if (!articleElement) return;

            // Add table of contents
            const tocElement = this.createTableOfContentsElement(structure.tableOfContents);
            articleElement.insertBefore(tocElement, articleElement.firstChild);

            // Add timeline if available
            if (structure.timeline.length > 0) {
                const timelineElement = this.createTimelineElement(structure.timeline);
                articleElement.appendChild(timelineElement);
            }

            // Add evidence blocks summary
            if (structure.evidenceBlocks.length > 0) {
                const evidenceElement = this.createEvidenceBlocksElement(structure.evidenceBlocks);
                articleElement.appendChild(evidenceElement);
            }

            // Add structure indicator
            this.attachStructureIndicator(articleElement, structure);
        }

        createTableOfContentsElement(toc) {
            const container = document.createElement('div');
            container.className = 'investigative-toc';
            container.innerHTML = `
                <h3>Table of Contents</h3>
                <ul>
                    ${toc.map(item => `<li><a href="${item.anchor}">${item.title}</a></li>`).join('')}
                </ul>
            `;
            return container;
        }

        createTimelineElement(timeline) {
            const container = document.createElement('div');
            container.className = 'investigative-timeline';
            container.innerHTML = `
                <h3>Investigation Timeline</h3>
                <div class="timeline-events">
                    ${timeline.map(event => `
                        <div class="timeline-event">
                            <div class="timeline-date">${event.date}</div>
                            <div class="timeline-desc">${event.description}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            return container;
        }

        createEvidenceBlocksElement(evidenceBlocks) {
            const container = document.createElement('div');
            container.className = 'investigative-evidence';
            container.innerHTML = `
                <h3>Key Evidence (${evidenceBlocks.length} items)</h3>
                <div class="evidence-summary">
                    ${evidenceBlocks.slice(0, 3).map(block => `
                        <div class="evidence-item">
                            <span class="evidence-type">${block.type}</span>
                            <span class="evidence-content">${block.content.substring(0, 100)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            return container;
        }

        attachStructureIndicator(element, structure) {
            const indicator = document.createElement('div');
            indicator.className = 'structure-indicator';
            indicator.innerHTML = `
                <span>📚 Structured Article</span>
                <span>${structure.sections.length} sections</span>
                <span>${structure.wordCount} words</span>
            `;
            element.insertBefore(indicator, element.firstChild);
        }

        startStructuringEngine() {
            console.log('🚀 [Layer 166] Starting investigative structuring...');

            setInterval(() => {
                this.processQueue();
                this.checkForNewArticles();
            }, CONFIG.intervals.structuringCheck);

            document.addEventListener('article:published', (event) => {
                if (event.detail && event.detail.article) {
                    this.queueForStructuring(event.detail.article);
                }
            });
        }

        queueForStructuring(article) {
            if (!this.structuringQueue.find(a => a.id === article.id)) {
                this.structuringQueue.push(article);
            }
        }

        processQueue() {
            if (this.structuringQueue.length === 0) return;

            const article = this.structuringQueue.shift();
            if (article) {
                this.structureArticle(article);
            }
        }

        checkForNewArticles() {
            if (window.Layer150_NewsDistributor) {
                const distributor = window.Layer150_NewsDistributor;
                if (distributor.articles) {
                    distributor.articles.forEach((article) => {
                        if (!this.structuredArticles.has(article.id)) {
                            this.queueForStructuring(article);
                        }
                    });
                }
            }
        }

        startAnalytics() {
            setInterval(() => {
                this.updateAnalytics();
            }, CONFIG.intervals.analyticsUpdate);
        }

        updateAnalytics() {
            this.stats.lastUpdate = new Date().toISOString();
            if (window.SPORTIQ) {
                window.SPORTIQ.investigativeStructuringStats = this.stats;
            }
            this.updateDashboard();
        }

        createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'layer166-dashboard';
            dashboard.className = 'layer166-dashboard hidden';
            dashboard.innerHTML = `
                <div class="layer166-dashboard-header">
                    <h3>📚 Investigative Structuring</h3>
                    <button class="layer166-close-btn">×</button>
                </div>
                <div class="layer166-dashboard-content">
                    <div class="layer166-stat">
                        <span class="layer166-stat-label">Structured:</span>
                        <span class="layer166-stat-value" id="layer166-total">0</span>
                    </div>
                    <div class="layer166-stat">
                        <span class="layer166-stat-label">Timelines:</span>
                        <span class="layer166-stat-value" id="layer166-timelines">0</span>
                    </div>
                    <div class="layer166-stat">
                        <span class="layer166-stat-label">Evidence Blocks:</span>
                        <span class="layer166-stat-value" id="layer166-evidence">0</span>
                    </div>
                    <div class="layer166-log" id="layer166-log"></div>
                </div>
            `;

            document.body.appendChild(dashboard);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'layer166-toggle-btn';
            toggleBtn.innerHTML = '📚';
            toggleBtn.addEventListener('click', () => dashboard.classList.toggle('hidden'));
            document.body.appendChild(toggleBtn);

            dashboard.querySelector('.layer166-close-btn').addEventListener('click', () => {
                dashboard.classList.add('hidden');
            });
        }

        updateDashboard() {
            const totalEl = document.getElementById('layer166-total');
            const timelinesEl = document.getElementById('layer166-timelines');
            const evidenceEl = document.getElementById('layer166-evidence');

            if (totalEl) totalEl.textContent = this.stats.totalStructured;
            if (timelinesEl) timelinesEl.textContent = this.stats.timelineGenerated;
            if (evidenceEl) evidenceEl.textContent = this.stats.evidenceBlocksCreated;

            const logEl = document.getElementById('layer166-log');
            if (logEl && this.structuringLog.length > 0) {
                const recentLogs = this.structuringLog.slice(-5).reverse();
                logEl.innerHTML = recentLogs.map(log => `
                    <div class="layer166-log-entry">
                        <span class="layer166-log-type">${log.type}</span>
                        <span class="layer166-log-message">${log.message}</span>
                    </div>
                `).join('');
            }
        }

        logStructuring(type, message) {
            this.structuringLog.push({ type, message, timestamp: new Date().toISOString() });
            if (this.structuringLog.length > 100) this.structuringLog.shift();
        }

        getStructure(articleId) {
            return this.structuredArticles.get(articleId);
        }

        getStats() {
            return { ...this.stats };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInvestigativeStructuring);
    } else {
        initInvestigativeStructuring();
    }

    function initInvestigativeStructuring() {
        const engine = new InvestigativeStructuring();
        window.Layer166_InvestigativeStructuring = engine;
        if (!window.SPORTIQ) window.SPORTIQ = {};
        window.SPORTIQ.investigativeStructuring = engine;
        document.dispatchEvent(new CustomEvent('layer166:ready', { detail: { engine } }));
        console.log('🎯 [Layer 166] Investigative Structuring Engine - Ready');
    }

})();
