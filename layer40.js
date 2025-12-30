/**
 * Layer 40: Global Video Feed Integration
 * Standalone runtime for video content
 */

class Layer40Video {
    constructor() {
        if (window.__LAYER40__) return window.__LAYER40__;

        this.layerId = 'layer-040';
        this.name = 'Global Video Feed';
        this.version = '1.0.0';

        this.videos = [];
        this.activeVideo = null;

        console.log(`[Layer 40 v${this.version}] Initializing Video Feed...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._loadVideos();
        this._renderVideoGrid();
        this._registerWithCoreEngines();
        console.log('[Layer 40] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer40-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                autoplay: false,
                gridColumns: 3
            };
        }
    }

    _loadVideos() {
        // Integrate with Layer 33 if available
        if (window.__LAYER33__) {
            const library = window.__LAYER33__.mediaLibrary || [];
            this.videos = library.filter(m => m.type.startsWith('video/'));
        }

        // Add some placeholders if empty
        if (this.videos.length === 0) {
            this.videos = [
                { id: 'v1', title: 'Game Highlights', url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', thumb: '' },
                { id: 'v2', title: 'Post-Match Analysis', url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', thumb: '' }
            ];
        }
    }

    _renderVideoGrid() {
        const container = document.getElementById('layer40-video-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer40-grid">
                ${this.videos.map(v => `
                    <div class="layer40-card" onclick="window.__LAYER40__.playVideo('${v.id}')">
                        <div class="layer40-thumb">
                            ${v.thumb ? `<img src="${v.thumb}" alt="${v.title}">` : '<div class="layer40-placeholder">▶</div>'}
                        </div>
                        <h4>${v.title}</h4>
                    </div>
                `).join('')}
            </div>
            <div id="layer40-player-modal" class="layer40-modal hidden">
                <div class="layer40-modal-content">
                    <span class="layer40-close" onclick="window.__LAYER40__.closePlayer()">×</span>
                    <video id="layer40-video-element" controls></video>
                </div>
            </div>
        `;
    }

    playVideo(id) {
        const video = this.videos.find(v => v.id === id);
        if (video) {
            this.activeVideo = video;
            const modal = document.getElementById('layer40-player-modal');
            const player = document.getElementById('layer40-video-element');

            player.src = video.data || video.url; // Support both base64 (Layer 33) and URL
            if (this.config.autoplay) player.play();

            modal.classList.remove('hidden');
        }
    }

    closePlayer() {
        const modal = document.getElementById('layer40-player-modal');
        const player = document.getElementById('layer40-video-element');
        player.pause();
        player.src = '';
        modal.classList.add('hidden');
        this.activeVideo = null;
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 40] Connected to Runtime');
            });
        }
    }
}

const layer40 = new Layer40Video();
window.__LAYER40__ = layer40;
export default layer40;
