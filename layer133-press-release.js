/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 133: AUTOMATED PRESS RELEASE GENERATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Automatically formats structured data (key milestones, announcements)
 *          into standard AP-Style press releases for media distribution.
 * Features: Template generation, PDF-ready preview, and simulated wire distribution.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        pr: {
            boilerplate: "SportIQ Global is the leading platform for real-time sports intelligence, leveraging AI to deliver immersive experiences to millions of fans worldwide.",
            contact: {
                name: "Media Relations",
                email: "press@sportiq.global",
                phone: "+1 (555) 0199-283"
            }
        },
        selectors: {
            container: '#pr-generator-modal'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PR ENGINE CORE
    // ═══════════════════════════════════════════════════════════════════════

    const PREngine = {
        initialize: function () {
            console.log('📰 [PressRelease] Engine initialized');
            this.injectModal();
        },

        injectModal: function () {
            if (document.getElementById('pr-generator-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'pr-generator-modal';
            modal.className = 'pr-modal hidden';

            modal.innerHTML = `
                <div class="pr-modal-content">
                    <div class="pr-toolbar">
                        <span class="pr-brand">📰 Press Center</span>
                        <button onclick="PressReleaseSystem.close()">Close</button>
                    </div>
                    <div id="pr-preview-area" class="pr-paper">
                        <!-- Content goes here -->
                    </div>
                    <div class="pr-actions">
                        <button class="pr-action-btn primary" onclick="PressReleaseSystem.distribute()">🚀 Distribute to Wires</button>
                        <button class="pr-action-btn" onclick="PressReleaseSystem.copy()">📋 Copy Text</button>
                        <button class="pr-action-btn" onclick="PressReleaseSystem.download()">📥 Download PDF</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        },

        generate: function (data) {
            // data: { headline, location, date, body[], quotes[], about? }
            console.log(`📰 [PressRelease] Generating release: ${data.headline}`);

            const dateStr = data.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const location = (data.location || "NEW YORK").toUpperCase();

            // Generate HTML Content
            const html = `
                <div class="pr-header">
                    <span class="pr-release-line">FOR IMMEDIATE RELEASE</span>
                </div>
                
                <h1 class="pr-headline">${data.headline}</h1>
                
                <div class="pr-dateline">
                    <strong>${location}, ${dateStr}</strong> — ${data.body[0]}
                </div>
                
                ${data.body.slice(1).map(p => `<p>${p}</p>`).join('')}
                
                ${data.quotes ? data.quotes.map(q => `
                    <div class="pr-quote">
                        "${q.text}"
                        <div class="pr-attribution">— ${q.author}, ${q.title}</div>
                    </div>
                `).join('') : ''}
                
                <div class="pr-boilerplate">
                    <h3>About SportIQ Global</h3>
                    <p>${data.about || CONFIG.pr.boilerplate}</p>
                </div>
                
                <div class="pr-contact">
                    <h3>Media Contact:</h3>
                    <p>
                        ${CONFIG.pr.contact.name}<br>
                        ${CONFIG.pr.contact.email}<br>
                        ${CONFIG.pr.contact.phone}
                    </p>
                </div>
                
                <div class="pr-end">###</div>
            `;

            this.render(html);
        },

        render: function (html) {
            const preview = document.getElementById('pr-preview-area');
            if (preview) {
                preview.innerHTML = html;
                document.getElementById('pr-generator-modal').classList.remove('hidden');
            }
        },

        distribute: function () {
            // Simulate API call to BusinessWire / PR Newswire
            const btn = document.querySelector('.pr-action-btn.primary');
            const originalText = btn.innerText;

            btn.innerText = '📡 Transmitting...';
            btn.disabled = true;

            setTimeout(() => {
                alert('Success: Press Release distributed to 342 media outlets globally.');
                btn.innerText = originalText;
                btn.disabled = false;
                this.close();
            }, 1500);
        },

        copyToClipboard: function () {
            const text = document.getElementById('pr-preview-area').innerText;
            navigator.clipboard.writeText(text).then(() => {
                alert('Content copied to clipboard.');
            });
        },

        downloadPDF: function () {
            alert('Downloading formatted PDF (Simulation)...');
        },

        close: function () {
            document.getElementById('pr-generator-modal').classList.add('hidden');
        },

        // ════ Demo Data Generator ════
        injectDemo: function () {
            this.generate({
                headline: "SportIQ Global Launches Revolutionary AI-Powered Content Engine",
                location: "LONDON",
                body: [
                    "SportIQ Global today announced the launch of its new AI-driven content layers, marking a significant milestone in digital sports media. The new platform integrates 133 specialized engines to deliver hyper-personalized experiences.",
                    "The update brings real-time fact-checking, automated video generation, and predictive analytics directly to the browser, eliminating latency and enhancing user engagement.",
                    "This rollout represents the culmination of 24 months of rigorous development and testing across global markets."
                ],
                quotes: [
                    {
                        text: "This architecture changes the game. We are not just reporting news; we are creating intelligent, living content that adapts to every fan.",
                        author: "Sarah Jenkins",
                        title: "Chief Product Officer"
                    }
                ]
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.PressReleaseSystem = {
        init: PREngine.initialize.bind(PREngine),
        create: PREngine.generate.bind(PREngine),
        distribute: PREngine.distribute.bind(PREngine),
        copy: PREngine.copyToClipboard.bind(PREngine),
        download: PREngine.downloadPDF.bind(PREngine),
        close: PREngine.close.bind(PREngine),
        demo: PREngine.injectDemo.bind(PREngine)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PREngine.initialize());
    } else {
        PREngine.initialize();
    }

})();
