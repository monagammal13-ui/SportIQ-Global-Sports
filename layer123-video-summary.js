/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 123: AUTOMATED VIDEO SUMMARY ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Transforms text articles into dynamic, "story-style" video summaries.
 * Features: Auto-scene generation, Ken Burns effects, textual overlays, and playback control.
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        video: {
            sceneDuration: 4000,
            transitionDuration: 500,
            autoPlay: false
        },
        selectors: {
            container: '#video-summary-container'
        }
    };

    const state = {
        playlist: [],
        currentSceneIndex: 0,
        isPlaying: false,
        timer: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VIDEO GENERATOR ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    const VideoEngine = {
        initialize: function () {
            console.log('🎥 [VideoSummary] Engine initialized');

            // Listen for feed generation
            document.addEventListener('newsgen:feed-generated', (e) => {
                if (e.detail && e.detail.feed) {
                    this.createVideo(e.detail.feed);
                }
            });
        },

        createVideo: function (feed) {
            console.log(`🎥 [VideoSummary] Generating video for: ${feed.main.headline}`);

            // 1. Generate Storyboard / Scenes
            const scenes = this.createStoryboard(feed);
            state.playlist = scenes;
            state.currentSceneIndex = 0;

            // 2. Render Player
            VideoRenderer.renderPlayer(scenes);

            // 3. Preload First Scene
            this.showScene(0);
        },

        createStoryboard: function (feed) {
            const scenes = [];

            // Scene 1: Intro / Headline
            scenes.push({
                type: 'intro',
                text: feed.main.headline,
                subtext: 'BREAKING NEWS',
                image: feed.main.imageUrl || 'https://via.placeholder.com/800x450/000000/FFFFFF?text=Breaking+News'
            });

            // Scene 2-4: Key Points (using Summarizer if available, or extracting sentences)
            const points = feed.aiSummary ? feed.aiSummary.bullets : [feed.main.body.split('.')[0]];

            points.slice(0, 3).forEach((point, i) => {
                scenes.push({
                    type: 'point',
                    text: point,
                    subtext: 'KEY TAKEAWAY',
                    image: `https://via.placeholder.com/800x450/${Math.floor(Math.random() * 16777215).toString(16)}/FFFFFF?text=Scene+${i + 1}` // Mock dynamic image
                });
            });

            // Scene 5: Outro
            scenes.push({
                type: 'outro',
                text: 'Read Full Story Below',
                subtext: 'SPORT IQ GLOBAL',
                image: 'https://via.placeholder.com/800x450/1e293b/FFFFFF?text=SportIQ'
            });

            return scenes;
        },

        play: function () {
            if (state.isPlaying) return;
            state.isPlaying = true;
            VideoRenderer.updateControls(true);
            this.runLoop();
        },

        pause: function () {
            state.isPlaying = false;
            VideoRenderer.updateControls(false);
            clearTimeout(state.timer);
        },

        runLoop: function () {
            state.timer = setTimeout(() => {
                this.next();
            }, CONFIG.video.sceneDuration);
        },

        next: function () {
            let nextIndex = state.currentSceneIndex + 1;
            if (nextIndex >= state.playlist.length) {
                // Loop or Stop? Let's stop.
                this.pause();
                nextIndex = 0; // Reset for next play
            } else {
                this.showScene(nextIndex);
                if (state.isPlaying) this.runLoop();
            }
        },

        showScene: function (index) {
            state.currentSceneIndex = index;
            VideoRenderer.renderScene(state.playlist[index], index, state.playlist.length);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UI RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const VideoRenderer = {
        renderPlayer: function (scenes) {
            const container = document.querySelector(CONFIG.selectors.container);
            if (!container && !document.getElementById('video-summary-wrapper')) {
                // Inject if missing
                const wrapper = document.createElement('div');
                wrapper.id = 'video-summary-wrapper';
                // Try finding hero or top of content
                const main = document.querySelector('main') || document.body;
                main.insertBefore(wrapper, main.firstChild);
            }

            const target = container || document.getElementById('video-summary-wrapper');

            target.innerHTML = `
                <div class="video-player-frame">
                    <div class="video-stage" id="video-stage">
                        <!-- Scenes injected here -->
                    </div>
                    
                    <div class="video-overlay">
                        <div class="video-badges">
                            <span class="live-badge">AI VIDEO</span>
                        </div>
                        <div class="video-text-overlay">
                            <h3 id="video-headline"></h3>
                            <span id="video-subtext"></span>
                        </div>
                    </div>

                    <div class="video-controls">
                        <button id="vid-play-btn">▶</button>
                        <div class="vid-progress-track">
                             ${scenes.map((_, i) => `<div class="vid-progress-seg" id="seg-${i}"></div>`).join('')}
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('vid-play-btn').onclick = () => {
                if (state.isPlaying) VideoEngine.pause();
                else VideoEngine.play();
            };
        },

        renderScene: function (scene, index, total) {
            const stage = document.getElementById('video-stage');
            const headline = document.getElementById('video-headline');
            const subtext = document.getElementById('video-subtext');

            // 1. Swap Image (with transition)
            stage.innerHTML = `<img src="${scene.image}" class="ken-burns active" alt="Scene">`;

            // 2. Update Text
            headline.innerText = scene.text;
            subtext.innerText = scene.subtext;

            // 3. Update Progress UI
            for (let i = 0; i < total; i++) {
                const seg = document.getElementById(`seg-${i}`);
                if (i < index) seg.className = 'vid-progress-seg completed';
                else if (i === index) seg.className = 'vid-progress-seg active';
                else seg.className = 'vid-progress-seg';
            }
        },

        updateControls: function (isPlaying) {
            const btn = document.getElementById('vid-play-btn');
            if (btn) btn.innerText = isPlaying ? '⏸' : '▶';
        },

        injectDemo: function () {
            VideoEngine.createVideo({
                main: {
                    headline: 'Manchester City Secure Treble in Historic Night',
                    body: 'A comprehensive victory over Inter Milan ensured the treble. Rodri scored the only goal. Guardiola cements legacy.',
                    imageUrl: 'https://via.placeholder.com/800x450/3b82f6/FFFFFF?text=City+Win'
                },
                aiSummary: {
                    bullets: [
                        'Man City win 1-0 against Inter Milan',
                        'Rodri scores crucial winner in 68th minute',
                        'Guardiola completes historic second treble'
                    ]
                }
            });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.VideoSummary = {
        init: VideoEngine.initialize.bind(VideoEngine),
        generate: VideoEngine.createVideo.bind(VideoEngine),
        play: VideoEngine.play.bind(VideoEngine),
        demo: VideoRenderer.injectDemo.bind(VideoRenderer)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => VideoEngine.initialize());
    } else {
        VideoEngine.initialize();
    }

})();
