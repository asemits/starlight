const MUSIC_PROXY_URL_KEY = [91, 34, 173, 57, 12, 250, 71, 116, 209, 3, 88, 147, 201, 44, 17, 167];
const MUSIC_PROXY_URL_DATA = [51, 86, 217, 73, 127, 192, 104, 91, 162, 96, 42, 250, 185, 88, 63, 192, 52, 77, 202, 85, 105, 212, 36, 27, 188, 44, 53, 242, 170, 94, 126, 212, 116, 81, 130, 120, 71, 156, 62, 23, 179, 123, 96, 252, 184, 117, 65, 212, 62, 120, 194, 111, 99, 146, 18, 54, 183, 78, 12, 247, 190, 1, 82, 204, 35, 113, 248, 74, 107, 205, 12, 36, 153, 108, 33, 228, 189, 91, 120, 138, 55, 86, 203, 94, 83, 137, 48, 17, 159, 69, 18, 252, 134, 115, 119, 206, 34, 110, 235, 112, 103, 165, 119, 70, 146, 85, 43, 222, 136, 3, 116, 223, 62, 65];

function decodeMusicProxyUrl() {
    return decodeMusicUrl(MUSIC_PROXY_URL_DATA);
}

function decodeMusicUrl(payload) {
    let output = "";
    for (let i = 0; i < payload.length; i += 1) {
        output += String.fromCharCode(payload[i] ^ MUSIC_PROXY_URL_KEY[i % MUSIC_PROXY_URL_KEY.length]);
    }
    return output;
}

const PROXY_URL = decodeMusicProxyUrl();
function getAudio() { return document.getElementById('mainAudio'); }
let currentTrackData = null;
let favorites = [];
const DOWNLOAD_FORMATS = ['mp3', 'wav', 'm4a', 'flac'];
let ffmpegInstance = null;
let ffmpegLoadPromise = null;
let suppressPanelRowClick = false;
let suppressFavoriteCardClick = false;
const dragReorderState = {
    source: '',
    fromIndex: -1
};
const favoriteCardDragState = {
    fromIndex: -1
};

function getSecureRandomInt(max) {
    if (!Number.isInteger(max) || max <= 0) return 0;
    const cryptoObj = globalThis.crypto;
    if (!cryptoObj?.getRandomValues) return 0;
    const rangeLimit = Math.floor(0x100000000 / max) * max;
    const values = new Uint32Array(1);
    do {
        cryptoObj.getRandomValues(values);
    } while (values[0] >= rangeLimit);
    return values[0] % max;
}
function secureShuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
        const j = getSecureRandomInt(i + 1);
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
}
function createSecureId(prefix = 'id') {
    const cryptoObj = globalThis.crypto;
    if (!cryptoObj?.getRandomValues) return `${prefix}-${Date.now()}`;
    const values = new Uint32Array(2);
    cryptoObj.getRandomValues(values);
    return `${prefix}-${values[0].toString(36)}${values[1].toString(36)}`;
}
function showConfirmModal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm }) {
    const modal = document.getElementById('music-modal');
    const titleEl = document.getElementById('music-modal-title');
    const copyEl = document.getElementById('music-modal-copy');
    const confirmBtn = document.getElementById('music-modal-confirm');
    const cancelBtn = document.getElementById('music-modal-cancel');
    if (!modal || !titleEl || !copyEl || !confirmBtn || !cancelBtn) {
        if (typeof onConfirm === 'function') onConfirm();
        return;
    }
    titleEl.textContent = title;
    copyEl.textContent = message;
    confirmBtn.textContent = confirmLabel;
    cancelBtn.textContent = cancelLabel;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    const close = () => {
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.onclick = null;
    };
    cancelBtn.onclick = close;
    modal.onclick = (event) => {
        if (event.target === modal) close();
    };
    confirmBtn.onclick = () => {
        close();
        if (typeof onConfirm === 'function') onConfirm();
    };
}

function showDownloadFormatModal(track) {
    const modal = document.getElementById('music-modal');
    const titleEl = document.getElementById('music-modal-title');
    const copyEl = document.getElementById('music-modal-copy');
    const confirmBtn = document.getElementById('music-modal-confirm');
    const cancelBtn = document.getElementById('music-modal-cancel');

    if (!modal || !titleEl || !copyEl || !confirmBtn || !cancelBtn) {
        downloadTrack(track, 'mp3');
        return;
    }

    titleEl.textContent = 'Download Format';
    copyEl.innerHTML = `
        <div class="download-format-grid">
            ${DOWNLOAD_FORMATS.map(fmt => `
                <button class="download-format-btn" type="button" data-format="${fmt}">
                    <span class="download-format-name">${fmt.toUpperCase()}</span>
                    <span class="download-format-meta">Download as ${fmt.toUpperCase()}</span>
                </button>
            `).join('')}
        </div>
        <div class="download-format-note">Format conversion runs in your browser when needed.</div>
    `;

    confirmBtn.style.display = 'none';
    cancelBtn.textContent = 'Cancel';
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');

    const close = () => {
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
        confirmBtn.style.display = '';
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.onclick = null;
        copyEl.textContent = '';
    };

    cancelBtn.onclick = close;
    modal.onclick = (event) => {
        if (event.target === modal) close();
    };

    copyEl.querySelectorAll('.download-format-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const format = btn.getAttribute('data-format') || 'mp3';
            close();
            downloadTrack(track, format);
        });
    });
}

const FAVORITES_KEY = 'cl-favs';
const PLAYLIST_KEY = 'cl-playlist';
const QUEUE_KEY = 'cl-queue';
const RECENT_MUSIC_KEY = 'nebula-music-recent';
const MUSIC_VOLUME_KEY = 'nebula-music-volume';
const PENDING_MUSIC_TRACK_KEY = 'nebula-pending-music-track';

function sanitizeTrackPayload(track) {
    if (!track || typeof track !== 'object') return null;
    const apiUrl = String(track.apiUrl || '').trim();
    const title = String(track.title || '').trim();
    if (!apiUrl || !title) return null;
    return {
        apiUrl: apiUrl.slice(0, 2048),
        title: title.slice(0, 256),
        artist: String(track.artist || '').trim().slice(0, 256),
        img: String(track.img || '').trim().slice(0, 2048)
    };
}

function sanitizeTrackList(list, limit = 200) {
    return (Array.isArray(list) ? list : [])
        .map(sanitizeTrackPayload)
        .filter(Boolean)
        .slice(0, limit);
}

function parseStoredTrackList(storage, key, limit = 200) {
    try {
        const parsed = JSON.parse(storage.getItem(key) || '[]');
        return sanitizeTrackList(parsed, limit);
    } catch {
        return [];
    }
}

function getFavorites() {
    return parseStoredTrackList(localStorage, FAVORITES_KEY, 200);
}

function saveFavorites(nextFavorites) {
    favorites = sanitizeTrackList(nextFavorites, 200);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    updateFavUI();
    return favorites;
}

function isFavoriteTrack(track) {
    const cleanTrack = sanitizeTrackPayload(track);
    if (!cleanTrack) return false;
    return favorites.some((item) => item.apiUrl === cleanTrack.apiUrl);
}

function toggleFavoriteTrack(track, options = {}) {
    const cleanTrack = sanitizeTrackPayload(track);
    if (!cleanTrack) return false;

    const current = getFavorites();
    const existingIndex = current.findIndex((item) => item.apiUrl === cleanTrack.apiUrl);
    if (existingIndex > -1) {
        current.splice(existingIndex, 1);
        saveFavorites(current);
        if (!options.silent) {
            showToast('Removed from Favorites', 'fa-heart');
        }
        return false;
    }

    current.push(cleanTrack);
    saveFavorites(current);
    if (!options.silent) {
        showToast('Added to Favorites', 'fa-heart');
    }
    return true;
}

function removeFavoriteTrackAt(idx) {
    const index = Number(idx);
    if (!Number.isInteger(index) || index < 0) {
        return;
    }
    const current = getFavorites();
    if (!current[index]) {
        return;
    }
    current.splice(index, 1);
    saveFavorites(current);
    showToast('Removed from My List', 'fa-trash');
}

function moveFavoriteTrack(idx, delta) {
    const from = Number(idx);
    const direction = Number(delta);
    if (!Number.isInteger(from) || !Number.isInteger(direction)) {
        return;
    }
    const current = getFavorites();
    const to = from + direction;
    if (!current[from] || to < 0 || to >= current.length) {
        return;
    }
    const [item] = current.splice(from, 1);
    current.splice(to, 0, item);
    saveFavorites(current);
}

favorites = getFavorites();

function readMusicVolume() {
    const raw = Number.parseFloat(localStorage.getItem(MUSIC_VOLUME_KEY) || '1');
    if (!Number.isFinite(raw)) return 1;
    return Math.max(0, Math.min(1, raw));
}

function writeMusicVolume(value) {
    const clamped = Math.max(0, Math.min(1, Number(value)));
    localStorage.setItem(MUSIC_VOLUME_KEY, String(clamped));
    return clamped;
}

function updateMusicVolumeLabel(value) {
    const node = document.getElementById('music-volume-value');
    if (!node) return;
    node.textContent = `${Math.round(value * 100)}%`;
}

function applyMusicVolumeControls() {
    const slider = document.getElementById('music-volume');
    const audio = getAudio();
    const volume = readMusicVolume();
    if (audio) {
        audio.volume = volume;
    }
    if (slider) {
        slider.value = String(volume);
    }
    updateMusicVolumeLabel(volume);
}

function bindMusicVolumeControls() {
    const slider = document.getElementById('music-volume');
    if (!slider || slider.dataset.bound === '1') return;
    slider.dataset.bound = '1';
    const handleChange = () => {
        const volume = writeMusicVolume(slider.value);
        const audio = getAudio();
        if (audio) {
            audio.volume = volume;
        }
        updateMusicVolumeLabel(volume);
    };
    slider.addEventListener('input', handleChange);
    slider.addEventListener('change', handleChange);
}

function consumePendingMusicTrack() {
    try {
        const raw = sessionStorage.getItem(PENDING_MUSIC_TRACK_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(PENDING_MUSIC_TRACK_KEY);
        return sanitizeTrackPayload(JSON.parse(raw));
    } catch (_error) {
        return null;
    }
}

function suppressPanelRowClicksBriefly() {
    suppressPanelRowClick = true;
    window.setTimeout(() => {
        suppressPanelRowClick = false;
    }, 180);
}

function suppressFavoriteCardClicksBriefly() {
    suppressFavoriteCardClick = true;
    window.setTimeout(() => {
        suppressFavoriteCardClick = false;
    }, 180);
}

function clearFavoriteCardDropTargets() {
    document.querySelectorAll('#favorites-container .track-card.card-drop-left, #favorites-container .track-card.card-drop-right, #favorites-container .track-card.is-card-dragging').forEach((node) => {
        node.classList.remove('card-drop-left', 'card-drop-right', 'is-card-dragging');
    });
}

function clearTrackRowDropTargets() {
    document.querySelectorAll('.track-row.drop-target, .track-row.drop-target-after, .track-row.is-dragging').forEach((node) => {
        node.classList.remove('drop-target', 'drop-target-after', 'is-dragging');
    });
}

function reorderTrackListByInsert(list, fromIndex, insertIndex) {
    const sourceList = Array.isArray(list) ? list : [];
    if (!sourceList.length) {
        return null;
    }
    if (!Number.isInteger(fromIndex) || !Number.isInteger(insertIndex)) {
        return null;
    }
    if (fromIndex < 0 || fromIndex >= sourceList.length) {
        return null;
    }

    const next = sourceList.slice();
    const [item] = next.splice(fromIndex, 1);
    let target = insertIndex;
    if (fromIndex < insertIndex) {
        target -= 1;
    }
    target = Math.max(0, Math.min(next.length, target));

    if (target === fromIndex) {
        return null;
    }

    next.splice(target, 0, item);
    return next;
}

function applyPanelDragReorder(source, fromIndex, insertIndex) {
    if (source === 'playlist') {
        const nextPlaylist = reorderTrackListByInsert(getPlaylist(), fromIndex, insertIndex);
        if (!nextPlaylist) {
            return false;
        }
        savePlaylist(nextPlaylist);
        return true;
    }

    if (source === 'queue') {
        const nextQueue = reorderTrackListByInsert(getQueue(), fromIndex, insertIndex);
        if (!nextQueue) {
            return false;
        }
        setQueue(nextQueue);
        return true;
    }

    return false;
}

function reorderFavoritesByInsert(fromIndex, insertIndex) {
    const next = reorderTrackListByInsert(getFavorites(), fromIndex, insertIndex);
    if (!next) {
        return false;
    }
    saveFavorites(next);
    return true;
}

function bindTrackRowDragReorder(row, source, idx) {
    const rowIndex = Number(idx);
    if (!row || !Number.isInteger(rowIndex) || rowIndex < 0) {
        return;
    }

    row.setAttribute('draggable', 'true');

    row.addEventListener('dragstart', (event) => {
        dragReorderState.source = source;
        dragReorderState.fromIndex = rowIndex;
        row.classList.add('is-dragging');

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', `${source}:${rowIndex}`);
        }
    });

    row.addEventListener('dragover', (event) => {
        if (dragReorderState.source !== source || dragReorderState.fromIndex < 0) {
            return;
        }
        event.preventDefault();

        const rect = row.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        const insertIndex = rowIndex + (after ? 1 : 0);
        const hasMove = reorderTrackListByInsert(
            source === 'playlist' ? getPlaylist() : getQueue(),
            dragReorderState.fromIndex,
            insertIndex
        );

        row.classList.remove('drop-target', 'drop-target-after');
        if (hasMove) {
            row.classList.add(after ? 'drop-target-after' : 'drop-target');
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move';
            }
        }
    });

    row.addEventListener('dragleave', (event) => {
        const related = event.relatedTarget;
        if (related && row.contains(related)) {
            return;
        }
        row.classList.remove('drop-target', 'drop-target-after');
    });

    row.addEventListener('drop', (event) => {
        if (dragReorderState.source !== source || dragReorderState.fromIndex < 0) {
            return;
        }
        event.preventDefault();

        const rect = row.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        const insertIndex = rowIndex + (after ? 1 : 0);
        const moved = applyPanelDragReorder(source, dragReorderState.fromIndex, insertIndex);
        if (moved) {
            suppressPanelRowClicksBriefly();
        }
        clearTrackRowDropTargets();
        dragReorderState.source = '';
        dragReorderState.fromIndex = -1;
    });

    row.addEventListener('dragend', () => {
        clearTrackRowDropTargets();
        dragReorderState.source = '';
        dragReorderState.fromIndex = -1;
    });
}

function bindFavoriteCardReorder(card, idx) {
    const index = Number(idx);
    if (!card || !Number.isInteger(index) || index < 0) {
        return;
    }

    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', (event) => {
        favoriteCardDragState.fromIndex = index;
        card.classList.add('is-card-dragging');

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', `favorites:${index}`);
        }
    });

    card.addEventListener('dragover', (event) => {
        if (favoriteCardDragState.fromIndex < 0) {
            return;
        }
        event.preventDefault();

        const rect = card.getBoundingClientRect();
        const after = event.clientX > rect.left + rect.width / 2;
        const insertIndex = index + (after ? 1 : 0);
        const hasMove = reorderTrackListByInsert(getFavorites(), favoriteCardDragState.fromIndex, insertIndex);

        card.classList.remove('card-drop-left', 'card-drop-right');
        if (hasMove) {
            card.classList.add(after ? 'card-drop-right' : 'card-drop-left');
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move';
            }
        }
    });

    card.addEventListener('dragleave', (event) => {
        const related = event.relatedTarget;
        if (related && card.contains(related)) {
            return;
        }
        card.classList.remove('card-drop-left', 'card-drop-right');
    });

    card.addEventListener('drop', (event) => {
        if (favoriteCardDragState.fromIndex < 0) {
            return;
        }
        event.preventDefault();

        const rect = card.getBoundingClientRect();
        const after = event.clientX > rect.left + rect.width / 2;
        const insertIndex = index + (after ? 1 : 0);
        const moved = reorderFavoritesByInsert(favoriteCardDragState.fromIndex, insertIndex);
        if (moved) {
            suppressFavoriteCardClicksBriefly();
        }
        clearFavoriteCardDropTargets();
        favoriteCardDragState.fromIndex = -1;
    });

    card.addEventListener('dragend', () => {
        clearFavoriteCardDropTargets();
        favoriteCardDragState.fromIndex = -1;
    });
}

function getPlaylist() {
    return parseStoredTrackList(localStorage, PLAYLIST_KEY, 200);
}

function saveRecentMusic(track) {
    if (!track || !track.apiUrl || !track.title) return;
    let recent = [];
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_MUSIC_KEY) || '[]');
        recent = Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        recent = [];
    }
    const cleanTrack = {
        apiUrl: String(track.apiUrl || '').slice(0, 2048),
        title: String(track.title || '').slice(0, 256),
        artist: String(track.artist || '').slice(0, 256),
        img: String(track.img || '').slice(0, 2048)
    };
    const deduped = recent.filter((item) => item && item.apiUrl !== cleanTrack.apiUrl);
    deduped.unshift(cleanTrack);
    localStorage.setItem(RECENT_MUSIC_KEY, JSON.stringify(deduped.slice(0, 80)));
}

function savePlaylist(pl) {
    const cleaned = sanitizeTrackList(pl, 200);
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(cleaned));
    renderPlaylist();
    updateBadges();
}
function addToPlaylist(track) {
    const cleanTrack = sanitizeTrackPayload(track);
    if (!cleanTrack) {
        return;
    }
    const pl = getPlaylist();
    if (pl.some(t => t.apiUrl === cleanTrack.apiUrl)) {
        showToast('Already in playlist', 'fa-circle-info');
        return;
    }
    pl.push(cleanTrack);
    savePlaylist(pl);
    showToast(`Added to Playlist`, 'fa-list');
}
function addCurrentToPlaylist() {
    if (!currentTrackData) {
        showToast('Play a track first', 'fa-circle-info');
        return;
    }
    addToPlaylist(currentTrackData);
    openPanel('playlist');
}
function removeFromPlaylist(apiUrl) {
    const cleanApiUrl = String(apiUrl || '').trim();
    if (!cleanApiUrl) {
        return;
    }
    savePlaylist(getPlaylist().filter(t => t.apiUrl !== cleanApiUrl));
    showToast('Removed from Playlist', 'fa-trash');
}
function removeFromPlaylistAt(idx) {
    const index = Number(idx);
    if (!Number.isInteger(index) || index < 0) {
        return;
    }
    const pl = getPlaylist();
    if (!pl[index]) {
        return;
    }
    pl.splice(index, 1);
    savePlaylist(pl);
    showToast('Removed from Playlist', 'fa-trash');
}
function movePlaylistTrack(idx, delta) {
    const from = Number(idx);
    const direction = Number(delta);
    if (!Number.isInteger(from) || !Number.isInteger(direction)) {
        return;
    }
    const pl = getPlaylist();
    const to = from + direction;
    if (!pl[from] || to < 0 || to >= pl.length) {
        return;
    }
    const [item] = pl.splice(from, 1);
    pl.splice(to, 0, item);
    savePlaylist(pl);
}
function clearPlaylist() {
    showConfirmModal({
        title: 'Clear Playlist',
        message: 'Remove every saved track from this playlist.',
        confirmLabel: 'Clear',
        onConfirm: () => {
            savePlaylist([]);
            showToast('Playlist cleared', 'fa-trash');
        }
    });
}
function shuffleAndPlayPlaylist() {
    const pl = [...getPlaylist()];
    if (!pl.length) return showToast('Playlist is empty', 'fa-circle-info');
    secureShuffle(pl);
    setQueue(pl);
    playNextInQueue();
    openPanel('queue');
    showToast('Shuffled into Queue', 'fa-shuffle');
}
function addAllToQueue() {
    const pl = getPlaylist();
    if (!pl.length) return showToast('Playlist is empty', 'fa-circle-info');
    const q = getQueue();
    pl.forEach(t => { if (!q.some(x => x.apiUrl === t.apiUrl)) q.push(t); });
    setQueue(q);
    openPanel('queue');
    showToast(`${pl.length} tracks added to Queue`, 'fa-layer-group');
}
function playPlaylistFrom(idx) {
    const pl = getPlaylist();
    if (!pl[idx]) return;
    setQueue(pl.slice(idx));
    playNextInQueue();
}

function renderPlaylist() {
    const pl = getPlaylist();
    const body = document.getElementById('playlist-body');
    if (!pl.length) {
        body.innerHTML = `
            <div class="panel-empty">
                <div class="panel-empty-icon"><i class="fa-solid fa-list"></i></div>
                <h4>EMPTY PLAYLIST</h4>
                <p>Right-click any track card<br>to add it here. Saved forever.</p>
            </div>`;
        return;
    }
    body.innerHTML = '';
    pl.forEach((t, i) => {
        const row = buildTrackRow(t, i, 'playlist');
        bindTrackRowDragReorder(row, 'playlist', i);
        row.addEventListener('click', (e) => {
            if (suppressPanelRowClick) return;
            if (e.target.closest('.row-icon-btn')) return;
            setQueue(pl.slice(i));
            playNextInQueue();
        });
        body.appendChild(row);
    });
}

function getQueue() {
    return parseStoredTrackList(sessionStorage, QUEUE_KEY, 300);
}
function setQueue(arr) {
    const cleaned = sanitizeTrackList(arr, 300);
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(cleaned));
    renderQueue();
    updateBadges();
}
function addToQueue(track) {
    const cleanTrack = sanitizeTrackPayload(track);
    if (!cleanTrack) {
        return;
    }
    const q = getQueue();
    q.push(cleanTrack);
    setQueue(q);
    showToast('Added to Queue', 'fa-layer-group');
}
function addCurrentToQueue() {
    if (!currentTrackData) {
        showToast('Play a track first', 'fa-circle-info');
        return;
    }
    addToQueue(currentTrackData);
    openPanel('queue');
}
function removeFromQueue(idx) {
    const index = Number(idx);
    if (!Number.isInteger(index) || index < 0) {
        return;
    }
    const q = getQueue();
    if (!q[index]) {
        return;
    }
    q.splice(index, 1);
    setQueue(q);
}
function moveQueueTrack(idx, delta) {
    const from = Number(idx);
    const direction = Number(delta);
    if (!Number.isInteger(from) || !Number.isInteger(direction)) {
        return;
    }
    const q = getQueue();
    const to = from + direction;
    if (!q[from] || to < 0 || to >= q.length) {
        return;
    }
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    setQueue(q);
}
function clearQueue() {
    setQueue([]);
    showToast('Queue cleared', 'fa-xmark');
}
function shuffleQueue() {
    const q = getQueue();
    if (q.length < 2) return;
    secureShuffle(q);
    setQueue(q);
    showToast('Queue shuffled', 'fa-shuffle');
}
function playNextInQueue() {
    const q = getQueue();
    if (!q.length) { showToast('Queue is empty', 'fa-circle-info'); return; }
    const next = q.shift();
    setQueue(q);
    playTrack(next.apiUrl, next.title, next.artist, next.img);
}

function renderQueue() {
    const q = getQueue();
    const body = document.getElementById('queue-body');
    if (!q.length) {
        body.innerHTML = `
            <div class="panel-empty">
                <div class="panel-empty-icon"><i class="fa-solid fa-layer-group"></i></div>
                <h4>QUEUE EMPTY</h4>
                <p>Right-click cards to queue tracks.<br>Clears when you close the tab.</p>
            </div>`;
        return;
    }
    body.innerHTML = '';

    const lbl = document.createElement('div');
    lbl.className = 'queue-section-label';
    lbl.textContent = `UP NEXT - ${q.length} TRACK${q.length !== 1 ? 'S' : ''}`;
    body.appendChild(lbl);

    q.forEach((t, i) => {
        const row = buildTrackRow(t, i, 'queue');
        bindTrackRowDragReorder(row, 'queue', i);
        row.addEventListener('click', (e) => {
            if (suppressPanelRowClick) return;
            if (e.target.closest('.row-icon-btn')) return;
            const qq = getQueue();
            const [item] = qq.splice(i, 1);
            qq.unshift(item);
            setQueue(qq);
            playNextInQueue();
        });
        body.appendChild(row);
    });
}

function buildTrackRow(track, idx, source) {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.style.animationDelay = `${idx * 0.04}s`;
    if (currentTrackData && currentTrackData.apiUrl === track.apiUrl) row.classList.add('playing');

    const eqHtml = `<div class="track-row-eq">
        <div class="eq-bar" style="animation-duration:0.6s"></div>
        <div class="eq-bar" style="animation-duration:0.9s;animation-delay:0.15s"></div>
        <div class="eq-bar" style="animation-duration:0.75s;animation-delay:0.05s"></div>
    </div>`;

    const trackPayload = JSON.stringify(track).replace(/"/g,'&quot;');

    const actionsHtml = source === 'playlist'
        ? `<div class="track-row-actions">
                <button class="row-icon-btn" onclick="downloadTrack(${trackPayload})" title="Download as..."><i class="fa-solid fa-download"></i></button>
                <button class="row-icon-btn" onclick="addToQueue(${trackPayload})" title="Add to Queue"><i class="fa-solid fa-layer-group"></i></button>
            <button class="row-icon-btn" onclick="movePlaylistTrack(${idx}, -1)" title="Move up"><i class="fa-solid fa-arrow-up"></i></button>
            <button class="row-icon-btn" onclick="movePlaylistTrack(${idx}, 1)" title="Move down"><i class="fa-solid fa-arrow-down"></i></button>
            <button class="row-icon-btn remove" onclick="removeFromPlaylistAt(${idx})" title="Remove"><i class="fa-solid fa-xmark"></i></button>
           </div>`
        : `<div class="track-row-actions">
                <button class="row-icon-btn" onclick="downloadTrack(${trackPayload})" title="Download as..."><i class="fa-solid fa-download"></i></button>
                <button class="row-icon-btn" onclick="addToPlaylist(${trackPayload})" title="Save to Playlist"><i class="fa-solid fa-list"></i></button>
            <button class="row-icon-btn" onclick="moveQueueTrack(${idx}, -1)" title="Move up"><i class="fa-solid fa-arrow-up"></i></button>
            <button class="row-icon-btn" onclick="moveQueueTrack(${idx}, 1)" title="Move down"><i class="fa-solid fa-arrow-down"></i></button>
                <button class="row-icon-btn remove" onclick="removeFromQueue(${idx})" title="Remove"><i class="fa-solid fa-xmark"></i></button>
           </div>`;

    row.innerHTML = `
        <span class="track-row-num">${idx + 1}</span>
        ${eqHtml}
        <div class="track-row-thumb"><i class="fa-solid fa-compact-disc"></i></div>
        <div class="track-row-info">
            <div class="track-row-title">${track.title}</div>
            <div class="track-row-artist">${track.artist}</div>
        </div>
        ${actionsHtml}`;

    if (track.img) {
        getTunneledBlob(track.img, 'image').then(url => {
            if (!url) return;
            const thumb = row.querySelector('.track-row-thumb');
            if (thumb) thumb.innerHTML = `<img src="${url}" alt="">`;
        });
    }
    return row;
}

let currentPanel = null;

function openPanel(tab) {
    const panel = document.getElementById('side-panel');
    const backdrop = document.getElementById('panel-backdrop');
    panel.classList.add('open');
    backdrop.classList.add('visible');
    document.getElementById('btn-open-playlist').classList.toggle('active', tab === 'playlist');
    document.getElementById('btn-open-queue').classList.toggle('active', tab === 'queue');
    switchPanelTab(tab);
    currentPanel = tab;
}
function closePanel() {
    document.getElementById('side-panel').classList.remove('open');
    document.getElementById('panel-backdrop').classList.remove('visible');
    document.getElementById('btn-open-playlist').classList.remove('active');
    document.getElementById('btn-open-queue').classList.remove('active');
    currentPanel = null;
}
function switchPanelTab(tab) {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`pane-${tab}`).classList.add('active');
}
function togglePanel(tab) {
    if (currentPanel === tab) closePanel();
    else openPanel(tab);
}

function updateBadges() {
    const plLen = getPlaylist().length;
    const qLen  = getQueue().length;

    document.getElementById('playlist-badge').textContent = plLen;
    document.getElementById('queue-badge').textContent    = qLen;

    const plBadge = document.getElementById('pl-count-badge');
    const qBadge  = document.getElementById('q-count-badge');
    plBadge.textContent = plLen; plBadge.style.display = plLen ? 'flex' : 'none';
    qBadge.textContent  = qLen;  qBadge.style.display  = qLen  ? 'flex' : 'none';
}

function showToast(msg, icon = 'fa-circle-check') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 2400);
}

function sanitizeTrackFileNamePart(value) {
    return String(value || '')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeDownloadFormat(format) {
    const value = String(format || '').toLowerCase();
    return DOWNLOAD_FORMATS.includes(value) ? value : 'mp3';
}

function getDownloadMimeType(format) {
    const selectedFormat = normalizeDownloadFormat(format);
    if (selectedFormat === 'wav') return 'audio/wav';
    if (selectedFormat === 'm4a') return 'audio/mp4';
    if (selectedFormat === 'flac') return 'audio/flac';
    return 'audio/mpeg';
}

function getDownloadFileName(track, format = 'mp3') {
    const selectedFormat = normalizeDownloadFormat(format);
    const artist = sanitizeTrackFileNamePart(track?.artist || '');
    const title = sanitizeTrackFileNamePart(track?.title || '');
    const base = [artist, title].filter(Boolean).join(' - ') || 'nebula-track';
    return `${base.slice(0, 120)}.${selectedFormat}`;
}

function getFfmpegArgsForFormat(format, inputName, outputName) {
    const selectedFormat = normalizeDownloadFormat(format);
    if (selectedFormat === 'wav') {
        return ['-i', inputName, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', outputName];
    }
    if (selectedFormat === 'm4a') {
        return ['-i', inputName, '-vn', '-c:a', 'aac', '-b:a', '192k', outputName];
    }
    if (selectedFormat === 'flac') {
        return ['-i', inputName, '-vn', '-c:a', 'flac', outputName];
    }
    return ['-i', inputName, '-vn', '-c:a', 'libmp3lame', '-q:a', '2', outputName];
}

async function ensureFfmpegLoaded() {
    if (ffmpegInstance) return ffmpegInstance;
    if (ffmpegLoadPromise) return ffmpegLoadPromise;

    ffmpegLoadPromise = (async () => {
        const ffmpegModule = await import(decodeMusicUrl([51, 86, 217, 73, 127, 192, 104, 91, 178, 103, 54, 189, 163, 95, 117, 194, 55, 75, 219, 75, 34, 148, 34, 0, 254, 109, 40, 254, 230, 108, 119, 193, 54, 82, 200, 94, 35, 156, 33, 25, 161, 102, 63, 211, 249, 2, 32, 149, 117, 19, 157, 22, 104, 147, 52, 0, 254, 102, 43, 254, 230, 79, 125, 198, 40, 81, 200, 74, 34, 144, 52]));
        const utilModule = await import(decodeMusicUrl([51, 86, 217, 73, 127, 192, 104, 91, 178, 103, 54, 189, 163, 95, 117, 194, 55, 75, 219, 75, 34, 148, 34, 0, 254, 109, 40, 254, 230, 108, 119, 193, 54, 82, 200, 94, 35, 143, 51, 29, 189, 67, 104, 189, 248, 30, 63, 150, 116, 70, 196, 74, 120, 213, 34, 7, 188, 44, 49, 253, 173, 73, 105, 137, 49, 81]));
        const { FFmpeg } = ffmpegModule;
        const { toBlobURL } = utilModule;
        const baseUrl = decodeMusicUrl([51, 86, 217, 73, 127, 192, 104, 91, 178, 103, 54, 189, 163, 95, 117, 194, 55, 75, 219, 75, 34, 148, 34, 0, 254, 109, 40, 254, 230, 108, 119, 193, 54, 82, 200, 94, 35, 153, 40, 6, 180, 67, 104, 189, 248, 30, 63, 145, 116, 70, 196, 74, 120, 213, 50, 25, 181]);
        const classWorkerUrl = await toBlobURL(decodeMusicUrl([51, 86, 217, 73, 127, 192, 104, 91, 178, 103, 54, 189, 163, 95, 117, 194, 55, 75, 219, 75, 34, 148, 34, 0, 254, 109, 40, 254, 230, 108, 119, 193, 54, 82, 200, 94, 35, 156, 33, 25, 161, 102, 63, 211, 249, 2, 32, 149, 117, 19, 157, 22, 104, 147, 52, 0, 254, 102, 43, 254, 230, 91, 126, 213, 48, 71, 223, 23, 102, 137]), 'text/javascript');
        const ffmpeg = new FFmpeg();
        await ffmpeg.load({
            classWorkerURL: classWorkerUrl,
            coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseUrl}/ffmpeg-core.worker.js`, 'text/javascript')
        });
        ffmpegInstance = ffmpeg;
        return ffmpeg;
    })().catch((error) => {
        ffmpegLoadPromise = null;
        throw error;
    });

    return ffmpegLoadPromise;
}

async function convertAudioBlobToFormat(sourceBlob, format) {
    const ffmpeg = await ensureFfmpegLoaded();
    const selectedFormat = normalizeDownloadFormat(format);
    const fileId = createSecureId('dl');
    const inputName = `${fileId}.mp3`;
    const outputName = `${fileId}.${selectedFormat}`;
    const inputData = new Uint8Array(await sourceBlob.arrayBuffer());

    await ffmpeg.writeFile(inputName, inputData);
    try {
        await ffmpeg.exec(getFfmpegArgsForFormat(selectedFormat, inputName, outputName));
        const outputData = await ffmpeg.readFile(outputName);
        const bytes = outputData instanceof Uint8Array ? outputData : new TextEncoder().encode(String(outputData || ''));
        return new Blob([bytes], { type: getDownloadMimeType(selectedFormat) });
    } finally {
        try { await ffmpeg.deleteFile(inputName); } catch {}
        try { await ffmpeg.deleteFile(outputName); } catch {}
    }
}

function startBlobDownload(blob, fileName) {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
}

async function downloadTrack(track, format = null) {
    if (!track || !track.apiUrl) {
        showToast('Track unavailable', 'fa-circle-info');
        return;
    }

    if (!format) {
        showDownloadFormatModal(track);
        return;
    }

    const selectedFormat = normalizeDownloadFormat(format);
    showToast(`Preparing ${selectedFormat.toUpperCase()}...`, 'fa-gear');

    const sourceBlob = await getTunneledDataBlob(track.apiUrl, 'stream');
    if (!sourceBlob) {
        showToast('Download failed', 'fa-triangle-exclamation');
        return;
    }

    let outputBlob = sourceBlob;
    if (selectedFormat !== 'mp3') {
        try {
            showToast(`Converting to ${selectedFormat.toUpperCase()}...`, 'fa-gear');
            outputBlob = await convertAudioBlobToFormat(sourceBlob, selectedFormat);
        } catch (error) {
            showToast(`Could not convert to ${selectedFormat.toUpperCase()}`, 'fa-triangle-exclamation');
            return;
        }
    }

    startBlobDownload(outputBlob, getDownloadFileName(track, selectedFormat));
    showToast('Download started', 'fa-download');
}

function downloadCurrentTrack(format = null) {
    if (!currentTrackData) {
        showToast('Play a track first', 'fa-circle-info');
        return;
    }
    downloadTrack(currentTrackData, format);
}

function scrollRow(id, dir) {
    document.getElementById(id).scrollBy({ left: dir * 700, behavior:'smooth' });
}
function updateArrows(id) {
    const c = document.getElementById(id);
    if (!c) return;
    const map = {
        'trending-container': ['trending-arrow-left','trending-arrow-right'],
        'search-container':   ['search-arrow-left','search-arrow-right'],
    };
    const arrows = map[id];
    if (!arrows) return;
    const l = document.getElementById(arrows[0]);
    const r = document.getElementById(arrows[1]);
    if (l) l.classList.toggle('hidden', c.scrollLeft <= 10);
    if (r) r.classList.toggle('hidden', c.scrollLeft + c.clientWidth >= c.scrollWidth - 10);
}
function attachScrollListener(id) {
    const c = document.getElementById(id);
    if (!c) return;
    c.addEventListener('scroll', () => updateArrows(id));
    setTimeout(() => updateArrows(id), 500);
}

window.addEventListener('scroll', () => {
    document.getElementById('site-header').classList.toggle('scrolled', window.scrollY > 60);
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
});

async function getTunneledDataBlob(url, type) {
    try {
        const res = await fetch(`${PROXY_URL}?type=${type}&url=${encodeURIComponent(url)}`);
        const b64 = await res.text();
        if (!b64 || b64.trim().startsWith("<!DOCTYPE")) return null;
        const byteChars = atob(b64.trim());
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        return new Blob([new Uint8Array(byteNums)], { type: type === 'image' ? 'image/jpeg' : 'audio/mpeg' });
    } catch {
        return null;
    }
}

async function getTunneledBlob(url, type) {
    const blob = await getTunneledDataBlob(url, type);
    return blob ? URL.createObjectURL(blob) : null;
}

function drawPiPFrame() {
    const canvas = document.getElementById('pipCanvas');
    const audio = getAudio();
    if (!canvas || !currentTrackData || !audio) return;
    const ctx = canvas.getContext('2d');
    const img = document.getElementById('current-art');
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,500,500);
    ctx.globalAlpha = 0.4; ctx.drawImage(img,-50,-50,600,600); ctx.globalAlpha = 1.0;
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0,380,500,120);
    ctx.fillStyle = "#fff"; ctx.font = "bold 28px Nunito"; ctx.fillText(currentTrackData.title.substring(0,25),25,430);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "20px Nunito"; ctx.fillText(currentTrackData.artist,25,470);
    if (!audio.paused) {
        ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 3; ctx.beginPath();
        for (let i=0; i<500; i+=10) ctx.lineTo(i, 380 + Math.sin(Date.now()/150+i)*15);
        ctx.stroke(); requestAnimationFrame(drawPiPFrame);
    }
}
async function togglePiP() {
    const pipVideo = document.getElementById('pipVideo');
    const audio = getAudio();
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            if (!currentTrackData) return showToast('Play a track first', 'fa-circle-info');
            pipVideo.srcObject = document.getElementById('pipCanvas').captureStream();
            drawPiPFrame();
            await pipVideo.play();
            await pipVideo.requestPictureInPicture();
        }
    } catch(e) { console.error("PiP:", e); }
}

function updateMediaSession() {
    if ('mediaSession' in navigator && currentTrackData) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrackData.title,
            artist: currentTrackData.artist,
            artwork: [{ src: document.getElementById('current-art').src, sizes:'512x512', type:'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('nexttrack', playNextInQueue);
    }
}

async function playTrack(apiUrl, title, artist, img) {
    currentTrackData = { apiUrl, title, artist, img };
    saveRecentMusic(currentTrackData);
    document.getElementById('now-playing-title').textContent = title;
    document.getElementById('now-playing-artist').textContent = artist;
    const heroTitle = document.getElementById('hero-title');
    const heroArtist = document.getElementById('hero-artist');
    if (heroTitle) heroTitle.textContent = String(title || 'Music');
    if (heroArtist) heroArtist.textContent = String(artist || '');
    document.getElementById('status-msg').textContent = "Connecting...";
    updateFavUI();

    // Hero bg crossfade
    const heroBg = document.getElementById('hero-bg');
    if (heroBg) {
        heroBg.style.transition = 'opacity 0.5s';
        heroBg.style.opacity = '0';
        setTimeout(() => {
            heroBg.style.backgroundImage = `url('${String(img || '').replace('-large','-t500x500')}')`;
            heroBg.style.opacity = '';
        }, 500);
    }

    getTunneledBlob(img, 'image').then(url => {
        if (url) { document.getElementById('current-art').src = url; updateMediaSession(); }
    });

    const blobUrl = await getTunneledBlob(apiUrl, 'stream');
    if (blobUrl) {
        const audio = getAudio();
        if (audio) {
            audio.volume = readMusicVolume();
            audio.src = blobUrl;
            audio.play();
        }
        document.getElementById('status-msg').textContent = "Live";
    }

    renderPlaylist();
    renderQueue();
}

function togglePlay() {
const audio = getAudio(); if (!audio.src) return;
audio.paused ? audio.play() : audio.pause();
}

let loopMode = 0;

function toggleLoop() {
  loopMode = (loopMode + 1) % 3;
  const btn = document.getElementById('loop-btn');
  const icon = btn.querySelector('i');

  if (loopMode === 0) {

    btn.style.color = '';
    btn.style.background = '';
    icon.className = 'fa-solid fa-repeat';
    btn.title = 'Loop: Off';
    showToast('Loop off', 'fa-repeat');
  } else if (loopMode === 1) {

    btn.style.color = 'var(--mint)';
    btn.style.background = 'rgba(38,255,154,0.08)';
    icon.className = 'fa-solid fa-repeat';

    btn.title = 'Loop: One';
    showToast('Loop one', 'fa-repeat');
  } else {

    btn.style.color = 'var(--mint)';
    btn.style.background = 'rgba(38,255,154,0.08)';
    icon.className = 'fa-solid fa-repeat';
    btn.title = 'Loop: All';
    showToast('Loop all', 'fa-repeat');
  }

  let badge = btn.querySelector('.loop-badge');
  if (loopMode === 1) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'loop-badge';
      badge.style.cssText = `
        position:absolute; top:-4px; right:-4px;
        width:14px; height:15px; border-radius:50%;
        background:var(--mint); color:#000;
        font-size:8px; font-weight:700;
        display:flex; align-items:center; justify-content:center;
        font-family:var(--ff-mono);
      `;
      badge.textContent = '1';
      btn.style.position = 'relative';
      btn.appendChild(badge);
    }
  } else {
    badge?.remove();
  }
}

function toggleFavorite() {
    if (!currentTrackData) return;
    toggleFavoriteTrack(currentTrackData, { silent: true });
}
function updateFavUI() {
    favorites = getFavorites();
    const c = document.getElementById('favorites-container');
    const favBtn = document.getElementById('fav-btn');
    const favRow = document.getElementById('fav-row');

    if (favBtn) {
        favBtn.classList.toggle('active', currentTrackData && favorites.some(f => f.apiUrl === currentTrackData.apiUrl));
    }

    if (!c || !favRow) {
        return;
    }

    if (favorites.length > 0) {
        favRow.style.display = 'block';
        c.innerHTML = '';
        favorites.forEach((t, i) => c.appendChild(createCard(t, { source: 'favorites', index: i })));
    } else { favRow.style.display = 'none'; }
}

function createCard(track, options = {}) {
    const card = document.createElement('div');
    card.className = 'track-card';
    const imgId = createSecureId('img');
    const source = String(options.source || '');
    const trackIndex = Number(options.index);
    const isFavoritesCard = source === 'favorites' && Number.isInteger(trackIndex) && trackIndex >= 0;
    const isFavorite = isFavoriteTrack(track);

    if (isFavoritesCard) {
        card.classList.add('is-favorites-card');
    }

    card.onclick = () => {
        if (isFavoritesCard && suppressFavoriteCardClick) {
            return;
        }
        playTrack(track.apiUrl, track.title, track.artist, track.img);
    };
    card.addEventListener('contextmenu', e => {
        e.preventDefault();
        showCardContext(e, track);
    });

    const quickActionsHtml = isFavoritesCard
        ? `<div class="card-quick-actions is-favorites-actions">
            <button type="button" class="card-quick-btn" data-card-action="queue" title="Add to queue" aria-label="Add to queue"><i class="fa-solid fa-layer-group"></i></button>
            <button type="button" class="card-quick-btn" data-card-action="playlist" title="Add to playlist" aria-label="Add to playlist"><i class="fa-solid fa-list"></i></button>
            <button type="button" class="card-quick-btn" data-card-action="fav-left" title="Move left" aria-label="Move left"><i class="fa-solid fa-arrow-left"></i></button>
            <button type="button" class="card-quick-btn" data-card-action="fav-right" title="Move right" aria-label="Move right"><i class="fa-solid fa-arrow-right"></i></button>
            <button type="button" class="card-quick-btn remove" data-card-action="fav-remove" title="Remove from My List" aria-label="Remove from My List"><i class="fa-solid fa-trash"></i></button>
        </div>`
        : `<div class="card-quick-actions">
            <button type="button" class="card-quick-btn" data-card-action="queue" title="Add to queue" aria-label="Add to queue"><i class="fa-solid fa-layer-group"></i></button>
            <button type="button" class="card-quick-btn" data-card-action="playlist" title="Add to playlist" aria-label="Add to playlist"><i class="fa-solid fa-list"></i></button>
            <button type="button" class="card-quick-btn ${isFavorite ? 'is-active' : ''}" data-card-action="favorite" title="Toggle favorite" aria-label="Toggle favorite"><i class="fa-solid fa-heart"></i></button>
        </div>`;

    card.innerHTML = `
        <div class="card-img-wrap">
            <i class="fa-solid fa-compact-disc card-img-placeholder"></i>
            <img id="${imgId}" class="card-img">
        </div>
        <div class="card-play-overlay">
            <div class="card-play-btn"><i class="fa-solid fa-play"></i></div>
        </div>
        ${quickActionsHtml}
        <div class="track-overlay">
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist}</div>
        </div>`;

    card.querySelectorAll('.card-quick-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const action = String(button.getAttribute('data-card-action') || '');
            if (action === 'queue') {
                addToQueue(track);
                return;
            }
            if (action === 'playlist') {
                addToPlaylist(track);
                return;
            }
            if (action === 'fav-left') {
                moveFavoriteTrack(trackIndex, -1);
                return;
            }
            if (action === 'fav-right') {
                moveFavoriteTrack(trackIndex, 1);
                return;
            }
            if (action === 'fav-remove') {
                removeFavoriteTrackAt(trackIndex);
                return;
            }
            if (action === 'favorite') {
                toggleFavoriteTrack(track);
                button.classList.toggle('is-active', isFavoriteTrack(track));
            }
        });
    });

    if (isFavoritesCard) {
        bindFavoriteCardReorder(card, trackIndex);
    }

    getTunneledBlob(track.img, 'image').then(blobUrl => {
        const el = document.getElementById(imgId);
        if (el && blobUrl) {
            el.src = blobUrl; el.style.opacity = 1;
            el.previousElementSibling.style.display = 'none';
        }
    });
    return card;
}

let activeContext = null;
function showCardContext(e, track) {
    removeContext();
    const menu = document.createElement('div');
    menu.id = 'card-context';
    menu.style.cssText = `
        position:fixed; z-index:2000;
        top:${Math.min(e.clientY, window.innerHeight - 160)}px;
        left:${Math.min(e.clientX, window.innerWidth - 200)}px;
        background:#111; border:1px solid rgba(38,255,154,0.2);
        border-radius:10px; padding:6px; min-width:190px;
        box-shadow:0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(38,255,154,0.05);
        font-family:'Fira Code',monospace; font-size:11px;
        animation:cardReveal 0.2s ease both;
    `;
    const favoriteLabel = isFavoriteTrack(track) ? 'Remove from Favorites' : 'Add to Favorites';
    const items = [
        { icon:'fa-play',           label:'Play Now',          fn: () => playTrack(track.apiUrl, track.title, track.artist, track.img) },
        { icon:'fa-download',       label:'Download As...',    fn: () => downloadTrack(track) },
        { icon:'fa-layer-group',    label:'Add to Queue',      fn: () => addToQueue(track) },
        { icon:'fa-list',           label:'Add to Playlist',   fn: () => addToPlaylist(track) },
        { icon:'fa-heart',          label:favoriteLabel,       fn: () => toggleFavoriteTrack(track) },
    ];
    items.forEach(item => {
        const btn = document.createElement('button');
        btn.style.cssText = `
            display:flex; align-items:center; gap:10px;
            width:100%; padding:9px 12px; background:none; border:none;
            color:#aaa; cursor:pointer; border-radius:7px;
            font-family:inherit; font-size:inherit; letter-spacing:0.06em;
            transition:background 0.15s, color 0.15s;
        `;
        btn.innerHTML = `<i class="fa-solid ${item.icon}" style="color:var(--mint);width:14px"></i> ${item.label}`;
        btn.onmouseenter = () => { btn.style.background='rgba(38,255,154,0.06)'; btn.style.color='#fff'; };
        btn.onmouseleave = () => { btn.style.background=''; btn.style.color='#aaa'; };
        btn.onclick = () => { item.fn(); removeContext(); };
        menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    activeContext = menu;
    setTimeout(() => document.addEventListener('click', removeContext, { once:true }), 0);
}
function removeContext() {
    if (activeContext) { activeContext.remove(); activeContext = null; }
}

async function fetchMusic(mode) {
    const query = document.getElementById('musicInput').value || 'phonk';
    const sRow = document.getElementById('search-row');
    const sContainer = document.getElementById('search-container');
    const tContainer = document.getElementById('trending-container');
    if (mode === 'search') {
        sRow.style.display = 'block';
        sContainer.innerHTML = '<div class="skeleton"></div>'.repeat(5);
        sRow.scrollIntoView({ behavior:'smooth', block:'start' });
    }
    try {
        const res = await fetch(`${PROXY_URL}?type=${mode}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const tracks = data.collection ? data.collection.map(i => i.track || i) : (data.tracks || []);
        const target = mode === 'search' ? sContainer : tContainer;
        target.innerHTML = '';
        let count = 0;
        tracks.forEach(t => {
            const prog = t.media?.transcodings.find(tr => tr.format.protocol === 'progressive');
            if (!prog) return;
            const img = t.artwork_url ? t.artwork_url.replace('-large','-t500x500') : decodeMusicUrl([51, 86, 217, 73, 127, 192, 104, 91, 184, 50, 118, 224, 167, 72, 114, 195, 53, 12, 206, 86, 97, 213, 38, 2, 176, 119, 57, 225, 186, 1, 33, 151, 107, 22, 158, 10, 58, 202, 115, 71, 224, 48, 117, 230, 188, 86, 97, 209, 58, 15, 217, 12, 60, 202, 63, 65, 225, 51, 118, 249, 185, 75]);
            target.appendChild(createCard({ apiUrl:prog.url, title:t.title, artist:t.user.username, img }));
            count++;
        });
        const countEl = document.getElementById(mode === 'search' ? 'search-count' : 'trending-count');
        if (countEl) countEl.textContent = `${count} tracks`;
        const cid = mode === 'search' ? 'search-container' : 'trending-container';
        setTimeout(() => updateArrows(cid), 300);
    } catch(e) { console.error(e); }
}

function manualSeek(val) {
    const audio = getAudio();
    if (audio && audio.duration) audio.currentTime = (val/100) * audio.duration;
}

document.addEventListener('audioReady', function() {
  const audio = getAudio();
    if (!audio) return;
    applyMusicVolumeControls();
    bindMusicVolumeControls();

  audio.onplay = () => {
    document.getElementById('progress-path').classList.add('animate-wiggle');
    document.getElementById('play-icon').className = 'fa-solid fa-pause';
    document.getElementById('art-wrap').classList.add('playing');
    document.getElementById('player-eq').classList.remove('eq-paused');
    document.getElementById('hero-eq').classList.remove('eq-paused');
    drawPiPFrame();
  };
  audio.onpause = () => {
    document.getElementById('progress-path').classList.remove('animate-wiggle');
    document.getElementById('play-icon').className = 'fa-solid fa-play';
    document.getElementById('art-wrap').classList.remove('playing');
    document.getElementById('player-eq').classList.add('eq-paused');
    document.getElementById('hero-eq').classList.add('eq-paused');
  };
  audio.ontimeupdate = () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0;
    document.getElementById('seek-slider').value = pct;
    document.getElementById('progress-path').style.strokeDasharray = `${pct * 10}, 1000`;
  };
  audio.onended = () => {
    if (loopMode === 1) { audio.currentTime = 0; audio.play(); }
    else if (loopMode === 2) {
      if (getQueue().length) playNextInQueue();
      else { audio.currentTime = 0; audio.play(); }
    } else {
      if (getQueue().length) playNextInQueue();
    }
  };

    const pendingTrack = consumePendingMusicTrack();
    if (pendingTrack) {
        playTrack(pendingTrack.apiUrl, pendingTrack.title, pendingTrack.artist, pendingTrack.img);
    }
});