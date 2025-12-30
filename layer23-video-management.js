/**
 * Layer 23: Video Management & Streaming Runtime
 */
class VideoManagementRuntime {
    constructor() {
        if (window.__ANTIGRAVITY_VIDEO__) return window.__ANTIGRAVITY_VIDEO__;
        this.version = '1.0.0';
        this.players = new Map();
        this._init();
    }

    async _init() {
        this._setupVideoPlayers();
    }

    _setupVideoPlayers() {
        document.querySelectorAll('video').forEach(video => {
            this._enhancePlayer(video);
        });
    }

    _enhancePlayer(video) {
        video.addEventListener('loadedmetadata', () => {
            this.players.set(video, { duration: video.duration, currentTime: 0 });
        });

        video.addEventListener('timeupdate', () => {
            const player = this.players.get(video);
            if (player) player.currentTime = video.currentTime;
        });

        // Auto-pause on scroll out
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && !video.paused) {
                    video.pause();
                }
            });
        }, { threshold: 0.5 });
        observer.observe(video);
    }

    createPlayer(containerId, videoUrl) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<video controls src="${videoUrl}" class="video-player"></video>`;
            this._enhancePlayer(container.querySelector('video'));
        }
    }
}

window.__ANTIGRAVITY_VIDEO__ = new VideoManagementRuntime();
export default window.__ANTIGRAVITY_VIDEO__;
