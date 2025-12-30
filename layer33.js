/**
 * Layer 33: Media Upload & Gallery
 * Standalone runtime for handling media assets (images/video)
 */

class Layer33Media {
    constructor() {
        if (window.__LAYER33__) return window.__LAYER33__;

        this.layerId = 'layer-033';
        this.name = 'Media Upload & Gallery';
        this.version = '1.0.0';

        this.mediaLibrary = [];

        console.log(`[Layer 33 v${this.version}] Initializing Media System...`);
        this._init();
    }

    async _init() {
        await this._loadConfig();
        this._loadLibrary();
        this._renderGallery();
        this._registerWithCoreEngines();
        console.log('[Layer 33] ✅ Fully Active');
    }

    async _loadConfig() {
        try {
            const response = await fetch('../api-json/layer33-config.json');
            this.config = await response.json();
        } catch (error) {
            this.config = {
                allowedTypes: ['image/jpeg', 'image/png', 'video/mp4'],
                maxSize: 5242880 // 5MB
            };
        }
    }

    _loadLibrary() {
        const stored = localStorage.getItem('layer33_library');
        this.mediaLibrary = stored ? JSON.parse(stored) : [];
    }

    _saveLibrary() {
        localStorage.setItem('layer33_library', JSON.stringify(this.mediaLibrary));
    }

    _renderGallery() {
        const container = document.getElementById('layer33-gallery-container');
        if (!container) return;

        container.innerHTML = `
            <div class="layer33-uploader">
                <input type="file" id="layer33-input" accept="${this.config.allowedTypes.join(',')}" multiple>
                <div class="layer33-dropzone" id="layer33-dropzone">
                    <p>Drag & Drop files here or click to upload</p>
                </div>
            </div>
            <div class="layer33-grid">
                ${this.mediaLibrary.map(m => this._renderMediaItem(m)).join('')}
            </div>
        `;

        this._attachEventListeners();
    }

    _renderMediaItem(item) {
        const isImage = item.type.startsWith('image/');
        return `
            <div class="layer33-item">
                ${isImage ?
                `<img src="${item.data}" alt="${item.name}">` :
                `<video src="${item.data}" controls></video>`
            }
                <div class="layer33-meta">
                    <span class="layer33-name" title="${item.name}">${item.name}</span>
                    <button onclick="window.__LAYER33__.deleteMedia('${item.id}')">×</button>
                </div>
            </div>
        `;
    }

    _attachEventListeners() {
        const input = document.getElementById('layer33-input');
        const dropzone = document.getElementById('layer33-dropzone');

        if (input && dropzone) {
            dropzone.onclick = () => input.click();

            input.onchange = (e) => this.handleUpload(e.target.files);

            dropzone.ondragover = (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            };

            dropzone.ondragleave = () => dropzone.classList.remove('dragover');

            dropzone.ondrop = (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                this.handleUpload(e.dataTransfer.files);
            };
        }
    }

    async handleUpload(fileList) {
        const files = Array.from(fileList);

        for (const file of files) {
            if (!this.config.allowedTypes.includes(file.type)) {
                console.warn(`[Layer 33] Skipped invalid type: ${file.name}`);
                continue;
            }
            if (file.size > this.config.maxSize) {
                console.warn(`[Layer 33] Skipped file too large: ${file.name}`);
                continue;
            }

            try {
                const base64 = await this._readFileAsDataURL(file);
                const item = {
                    id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64,
                    uploadedAt: Date.now()
                };

                this.mediaLibrary.unshift(item); // Add to beginning
                this._emitEvent('layer33:media-uploaded', { item });
            } catch (err) {
                console.error(`[Layer 33] Upload failed for ${file.name}`, err);
            }
        }

        this._saveLibrary();
        this._renderGallery();
    }

    _readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    deleteMedia(id) {
        this.mediaLibrary = this.mediaLibrary.filter(m => m.id !== id);
        this._saveLibrary();
        this._renderGallery();
        this._emitEvent('layer33:media-deleted', { id });
    }

    _emitEvent(eventName, data) {
        if (window.__ANTIGRAVITY_EVENT_BUS__) {
            window.__ANTIGRAVITY_EVENT_BUS__.emit(eventName, data);
        }
    }

    _registerWithCoreEngines() {
        if (window.__ANTIGRAVITY_RUNTIME__) {
            window.__ANTIGRAVITY_RUNTIME__.hook('onReady', () => {
                console.log('[Layer 33] Connected to Runtime');
            });
        }
    }
}

const layer33 = new Layer33Media();
window.__LAYER33__ = layer33;
export default layer33;
