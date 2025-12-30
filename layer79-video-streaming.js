/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 79: VIDEO STREAMING & HIGHLIGHTS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Video streaming, highlights, quality selection, buffering management
 * Features: Adaptive streaming, playlist management, auto-quality, analytics
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
            configPath: '../api-json/video-config.json',
            autoPlay: false,
            defaultQuality: 'auto',
            enableAnalytics: true
        },
        events: {
            videoPlayed: 'video:played',
            videoPaused: 'video:paused',
            videoEnded: 'video:ended',
            qualityChanged: 'video:quality-changed',
            videoBuffering: 'video:buffering'
        }
    };

    const state = {
        players: new Map(),
        playlists: new Map(),
        highlights: new Map(),
        analytics: new Map(),
        config: null,
        statistics: {
            totalViews: 0,
            totalPlaytime: 0,
            buffering: 0
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VIDEO PLAYER MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const PlayerManager = {
        create: function (container, options = {}) {
            const id = options.id || this.generateId();

            const player = {
                id,
                container,
                videoElement: null,
                currentVideo: null,
                quality: options.quality || CONFIG.video.defaultQuality,
                autoPlay: options.autoPlay || CONFIG.video.autoPlay,
                playbackRate: 1,
                volume: 0.8,
                muted: false,
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                buffered: 0,
                qualities: ['360p', '480p', '720p', '1080p'],
                playlist: []
            };

            this.initializePlayer(player);
            state.players.set(id, player);

            console.log('🎥 [Video] Player created:', id);
            return player;
        },

        initializePlayer: function (player) {
            const video = document.createElement('video');
            video.className = 'video-player';
            video.controls = true;
            video.preload = 'metadata';

            // Event listeners
            video.addEventListener('play', () => this.handlePlay(player));
            video.addEventListener('pause', () => this.handlePause(player));
            video.addEventListener('ended', () => this.handleEnded(player));
            video.addEventListener('timeupdate', () => this.handleTimeUpdate(player));
            video.addEventListener('waiting', () => this.handleBuffering(player));

            player.videoElement = video;
            player.container.appendChild(video);
        },

        loadVideo: function (playerId, videoSource) {
            const player = state.players.get(playerId);
            if (!player) return false;

            player.currentVideo = videoSource;
            player.videoElement.src = videoSource.url;

            if (player.autoPlay) {
                player.videoElement.play();
            }

            return true;
        },

        play: function (playerId) {
            const player = state.players.get(playerId);
            if (!player) return;

            player.videoElement.play();
        },

        pause: function (playerId) {
            const player = state.players.get(playerId);
            if (!player) return;

            player.videoElement.pause();
        },

        setQuality: function (playerId, quality) {
            const player = state.players.get(playerId);
            if (!player) return false;

            const currentTime = player.videoElement.currentTime;
            player.quality = quality;

            // In production, switch to different quality URL
            // For now, just fire event
            const event = new CustomEvent(CONFIG.events.qualityChanged, {
                detail: { playerId, quality, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            console.log('🎬 [Video] Quality changed:', quality);
            return true;
        },

        handlePlay: function (player) {
            player.isPlaying = true;
            state.statistics.totalViews++;

            const event = new CustomEvent(CONFIG.events.videoPlayed, {
                detail: { playerId: player.id, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            this.trackAnalytics(player, 'play');
        },

        handlePause: function (player) {
            player.isPlaying = false;

            const event = new CustomEvent(CONFIG.events.videoPaused, {
                detail: { playerId: player.id, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            this.trackAnalytics(player, 'pause');
        },

        handleEnded: function (player) {
            player.isPlaying = false;

            const event = new CustomEvent(CONFIG.events.videoEnded, {
                detail: { playerId: player.id, timestamp: Date.now() }
            });
            document.dispatchEvent(event);

            this.trackAnalytics(player, 'ended');
        },

        handleTimeUpdate: function (player) {
            player.currentTime = player.videoElement.currentTime;
            player.duration = player.videoElement.duration;

            if (CONFIG.video.enableAnalytics) {
                state.statistics.totalPlaytime += 0.1;
            }
        },

        handleBuffering: function (player) {
            state.statistics.buffering++;

            const event = new CustomEvent(CONFIG.events.videoBuffering, {
                detail: { playerId: player.id, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        },

        trackAnalytics: function (player, action) {
            if (!CONFIG.video.enableAnalytics) return;

            const key = player.currentVideo?.id || 'unknown';
            if (!state.analytics.has(key)) {
                state.analytics.set(key, {
                    views: 0,
                    plays: 0,
                    pauses: 0,
                    completions: 0,
                    totalTime: 0
                });
            }

            const analytics = state.analytics.get(key);

            switch (action) {
                case 'play':
                    analytics.plays++;
                    if (player.currentTime === 0) analytics.views++;
                    break;
                case 'pause':
                    analytics.pauses++;
                    break;
                case 'ended':
                    analytics.completions++;
                    break;
            }
        },

        generateId: function () {
            return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HIGHLIGHTS MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const HighlightsManager = {
        add: function (highlight) {
            const id = highlight.id || this.generateId();

            state.highlights.set(id, {
                id,
                title: highlight.title,
                description: highlight.description || '',
                duration: highlight.duration || 0,
                thumbnail: highlight.thumbnail || '',
                url: highlight.url,
                category: highlight.category || 'general',
                sport: highlight.sport || 'football',
                quality: highlight.quality || '720p',
                views: 0,
                timestamp: Date.now()
            });

            console.log('✨ [Video] Highlight added:', id);
            return id;
        },

        get: function (highlightId) {
            return state.highlights.get(highlightId);
        },

        getAll: function (filter = {}) {
            let highlights = Array.from(state.highlights.values());

            if (filter.category) {
                highlights = highlights.filter(h => h.category === filter.category);
            }

            if (filter.sport) {
                highlights = highlights.filter(h => h.sport === filter.sport);
            }

            return highlights.sort((a, b) => b.timestamp - a.timestamp);
        },

        incrementViews: function (highlightId) {
            const highlight = state.highlights.get(highlightId);
            if (highlight) {
                highlight.views++;
            }
        },

        generateId: function () {
            return 'highlight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PLAYLIST MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const PlaylistManager = {
        create: function (name, videos = []) {
            const id = this.generateId();

            state.playlists.set(id, {
                id,
                name,
                videos,
                currentIndex: 0,
                shuffle: false,
                repeat: false
            });

            return id;
        },

        addVideo: function (playlistId, video) {
            const playlist = state.playlists.get(playlistId);
            if (!playlist) return false;

            playlist.videos.push(video);
            return true;
        },

        next: function (playlistId) {
            const playlist = state.playlists.get(playlistId);
            if (!playlist) return null;

            if (playlist.shuffle) {
                playlist.currentIndex = Math.floor(Math.random() * playlist.videos.length);
            } else {
                playlist.currentIndex = (playlist.currentIndex + 1) % playlist.videos.length;
            }

            return playlist.videos[playlist.currentIndex];
        },

        previous: function (playlistId) {
            const playlist = state.playlists.get(playlistId);
            if (!playlist) return null;

            playlist.currentIndex = (playlist.currentIndex - 1 + playlist.videos.length) % playlist.videos.length;
            return playlist.videos[playlist.currentIndex];
        },

        generateId: function () {
            return 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // QUALITY SELECTOR
    // ═══════════════════════════════════════════════════════════════════════

    const QualitySelector = {
        getAvailableQualities: function (videoSource) {
            // In production, fetch from server
            return ['360p', '480p', '720p', '1080p'];
        },

        selectOptimal: function (bandwidth) {
            if (bandwidth > 5000) return '1080p';
            if (bandwidth > 2500) return '720p';
            if (bandwidth > 1000) return '480p';
            return '360p';
        },

        estimateBandwidth: function () {
            // Simplified bandwidth estimation
            return navigator.connection?.downlink * 1000 || 2500;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🎥 LAYER 79: VIDEO STREAMING ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        // Load configuration
        try {
            const response = await fetch(CONFIG.video.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Load highlights
                if (state.config.highlights) {
                    state.config.highlights.forEach(h => {
                        HighlightsManager.add(h);
                    });
                    console.log(`✅ [Video] Loaded ${state.config.highlights.length} highlights`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Video] Failed to load config');
        }

        console.log('✅ [Video] Streaming engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.VideoEngine = {
        // Player
        createPlayer: PlayerManager.create.bind(PlayerManager),
        loadVideo: PlayerManager.loadVideo.bind(PlayerManager),
        play: PlayerManager.play.bind(PlayerManager),
        pause: PlayerManager.pause.bind(PlayerManager),
        setQuality: PlayerManager.setQuality.bind(PlayerManager),

        // Highlights
        addHighlight: HighlightsManager.add.bind(HighlightsManager),
        getHighlight: HighlightsManager.get.bind(HighlightsManager),
        getHighlights: HighlightsManager.getAll.bind(HighlightsManager),

        // Playlist
        createPlaylist: PlaylistManager.create.bind(PlaylistManager),
        addToPlaylist: PlaylistManager.addVideo.bind(PlaylistManager),
        nextVideo: PlaylistManager.next.bind(PlaylistManager),
        previousVideo: PlaylistManager.previous.bind(PlaylistManager),

        // Quality
        getQualities: QualitySelector.getAvailableQualities.bind(QualitySelector),

        // Statistics
        getStats: () => ({ ...state.statistics }),
        getAnalytics: (videoId) => state.analytics.get(videoId),

        CONFIG
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
