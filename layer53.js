
/**
 * Layer 53: Global Video Highlights Feed
 * Manages video highlights fetching and display.
 */
export class SportIQVideoHighlights {
    constructor() {
        this.id = 'layer-053';
        this.name = 'Global Video Highlights Feed';
        this.config = null;
        this.containerId = 'video-highlights-feed';
    }

    async init() {
        console.log(`Initializing ${this.name}...`);
        await this.loadConfig();
        this.createSection();
        this.fetchHighlights();

        window.RuntimeOrchestrator?.registerLayer(this);
    }

    async loadConfig() {
        try {
            const res = await fetch('../api-json/layer53.json');
            this.config = await res.json();
        } catch {
            this.config = { limit: 6, autoplay: false };
        }
    }

    createSection() {
        // Look for a place to insert the video feed, e.g., after the "Services" section
        const target = document.getElementById('services');
        if (target && !document.getElementById(this.containerId)) {
            const section = document.createElement('section');
            section.className = 'section video-highlights';
            section.id = this.containerId;
            section.style.background = '#000';
            section.style.color = '#fff';
            target.after(section);
        }
    }

    async fetchHighlights() {
        // Mock data
        const videos = [
            { title: "Goal of the Month", thumbnail: "../assets/img/video1.jpg", duration: "2:15" },
            { title: "Top 10 Dunks", thumbnail: "../assets/img/video2.jpg", duration: "5:00" },
            { title: "Match Point", thumbnail: "../assets/img/video3.jpg", duration: "1:45" }
        ];
        this.render(videos);
    }

    render(videos) {
        const section = document.getElementById(this.containerId);
        if (!section) return;

        section.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title" style="color:#fff">Highlights Hub</h2>
                    <p>Best moments from around the world</p>
                </div>
                <div class="video-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    ${videos.map(v => `
                        <div class="video-card" style="background: #222; border-radius: 8px; overflow: hidden; cursor: pointer;">
                            <div class="thumbnail" style="height: 180px; background: #333; position: relative; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 3rem;">▶️</span>
                                <span style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 2px 6px; font-size: 12px; border-radius: 4px;">${v.duration}</span>
                            </div>
                            <div class="info" style="padding: 15px;">
                                <h4 style="margin: 0; font-size: 1.1rem;">${v.title}</h4>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

window.Layer53_VideoHighlights = new SportIQVideoHighlights();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Layer53_VideoHighlights.init());
} else {
    window.Layer53_VideoHighlights.init();
}
