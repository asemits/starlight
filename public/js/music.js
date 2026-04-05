const PROXY_URL = "https://script.google.com/macros/s/AKfycbx8oqYPseZoVohUBfMTdw-CkxSUsg7KPHoywtwi-ltfg_sweNFJoO_fiyLFIk_02CVsMA/exec";
function getAudio() { return document.getElementById('mainAudio'); }
let currentTrackData = null;
let favorites = JSON.parse(localStorage.getItem('cl-favs')) || [];

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

/* ══════════════════════════════════════════════════════
   PLAYLIST  (localStorage — persists across sessions)
══════════════════════════════════════════════════════ */
const PLAYLIST_KEY = 'cl-playlist';

function getPlaylist() {
    try { return JSON.parse(localStorage.getItem(PLAYLIST_KEY)) || []; }
    catch { return []; }
}
function savePlaylist(pl) {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(pl));
    renderPlaylist();
    updateBadges();
}
function addToPlaylist(track) {
    const pl = getPlaylist();
    if (pl.some(t => t.apiUrl === track.apiUrl)) {
        showToast('Already in playlist', 'fa-circle-info');
        return;
    }
    pl.push(track);
    savePlaylist(pl);
    showToast(`Added to Playlist`, 'fa-list');
}
function removeFromPlaylist(apiUrl) {
    savePlaylist(getPlaylist().filter(t => t.apiUrl !== apiUrl));
    showToast('Removed from Playlist', 'fa-trash');
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
        row.addEventListener('click', (e) => {
            if (e.target.closest('.row-icon-btn')) return;
            setQueue(pl.slice(i));
            playNextInQueue();
        });
        body.appendChild(row);
    });
}

/* ══════════════════════════════════════════════════════
   QUEUE  (sessionStorage — clears when tab closes)
══════════════════════════════════════════════════════ */
const QUEUE_KEY = 'cl-queue';

function getQueue() {
    try { return JSON.parse(sessionStorage.getItem(QUEUE_KEY)) || []; }
    catch { return []; }
}
function setQueue(arr) {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
    renderQueue();
    updateBadges();
}
function addToQueue(track) {
    const q = getQueue();
    q.push(track);
    setQueue(q);
    showToast('Added to Queue', 'fa-layer-group');
}
function removeFromQueue(idx) {
    const q = getQueue();
    q.splice(idx, 1);
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

    // "Up Next" label
    const lbl = document.createElement('div');
    lbl.className = 'queue-section-label';
    lbl.textContent = `UP NEXT · ${q.length} TRACK${q.length !== 1 ? 'S' : ''}`;
    body.appendChild(lbl);

    q.forEach((t, i) => {
        const row = buildTrackRow(t, i, 'queue');
        row.addEventListener('click', (e) => {
            if (e.target.closest('.row-icon-btn')) return;
            // Move clicked to front and play
            const qq = getQueue();
            const [item] = qq.splice(i, 1);
            qq.unshift(item);
            setQueue(qq);
            playNextInQueue();
        });
        body.appendChild(row);
    });
}

/* ── Shared row builder ──────────────────────────── */
function buildTrackRow(track, idx, source) {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.style.animationDelay = `${idx * 0.04}s`;
    if (currentTrackData && currentTrackData.apiUrl === track.apiUrl) row.classList.add('playing');

    // Mini EQ for playing indicator
    const eqHtml = `<div class="track-row-eq">
        <div class="eq-bar" style="animation-duration:0.6s"></div>
        <div class="eq-bar" style="animation-duration:0.9s;animation-delay:0.15s"></div>
        <div class="eq-bar" style="animation-duration:0.75s;animation-delay:0.05s"></div>
    </div>`;

    // Actions differ per source
    const actionsHtml = source === 'playlist'
        ? `<div class="track-row-actions">
                <button class="row-icon-btn" onclick="addToQueue(${JSON.stringify(track).replace(/"/g,'&quot;')})" title="Add to Queue"><i class="fa-solid fa-layer-group"></i></button>
                <button class="row-icon-btn remove" onclick="removeFromPlaylist('${track.apiUrl}')" title="Remove"><i class="fa-solid fa-xmark"></i></button>
           </div>`
        : `<div class="track-row-actions">
                <button class="row-icon-btn" onclick="addToPlaylist(${JSON.stringify(track).replace(/"/g,'&quot;')})" title="Save to Playlist"><i class="fa-solid fa-list"></i></button>
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

    // Lazy load thumbnail
    if (track.img) {
        getTunneledBlob(track.img, 'image').then(url => {
            if (!url) return;
            const thumb = row.querySelector('.track-row-thumb');
            if (thumb) thumb.innerHTML = `<img src="${url}" alt="">`;
        });
    }
    return row;
}

/* ══════════════════════════════════════════════════════
   PANEL UI
══════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════
   SCROLL / ARROWS
══════════════════════════════════════════════════════ */
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

/* Header scroll */
window.addEventListener('scroll', () => {
    document.getElementById('site-header').classList.toggle('scrolled', window.scrollY > 60);
});

/* Keyboard shortcut: Escape closes panel */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
});

/* ══════════════════════════════════════════════════════
   TUNNEL ENGINE
══════════════════════════════════════════════════════ */
async function getTunneledBlob(url, type) {
    try {
        const res = await fetch(`${PROXY_URL}?type=${type}&url=${encodeURIComponent(url)}`);
        const b64 = await res.text();
        if (!b64 || b64.trim().startsWith("<!DOCTYPE")) return null;
        const byteChars = atob(b64.trim());
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNums)], { type: type === 'image' ? 'image/jpeg' : 'audio/mpeg' });
        return URL.createObjectURL(blob);
    } catch (e) { return null; }
}

/* ══════════════════════════════════════════════════════
   PIP ENGINE
══════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════
   MEDIA SESSION
══════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════
   PLAYER CORE
══════════════════════════════════════════════════════ */
async function playTrack(apiUrl, title, artist, img) {
    currentTrackData = { apiUrl, title, artist, img };
    document.getElementById('now-playing-title').textContent = title;
    document.getElementById('now-playing-artist').textContent = artist;
    document.getElementById('status-msg').textContent = "Connecting…";
    updateFavUI();

    // Hero bg crossfade
    const heroBg = document.getElementById('hero-bg');
    heroBg.style.transition = 'opacity 0.5s';
    heroBg.style.opacity = '0';
    setTimeout(() => {
        heroBg.style.backgroundImage = `url('${img.replace('-large','-t500x500')}')`;
        heroBg.style.opacity = '';
    }, 500);

    getTunneledBlob(img, 'image').then(url => {
        if (url) { document.getElementById('current-art').src = url; updateMediaSession(); }
    });

    const blobUrl = await getTunneledBlob(apiUrl, 'stream');
    if (blobUrl) {
        getAudio().src = blobUrl; getAudio().play();
        document.getElementById('status-msg').textContent = "Live";
    }

    // Re-render panels to highlight current
    renderPlaylist();
    renderQueue();
}

function togglePlay() {
const audio = getAudio(); if (!audio.src) return;
audio.paused ? audio.play() : audio.pause();
}

let loopMode = 0; // 0 = off, 1 = loop one, 2 = loop all

function toggleLoop() {
  loopMode = (loopMode + 1) % 3;
  const btn = document.getElementById('loop-btn');
  const icon = btn.querySelector('i');

  if (loopMode === 0) {
    // Off
    btn.style.color = '';
    btn.style.background = '';
    icon.className = 'fa-solid fa-repeat';
    btn.title = 'Loop: Off';
    showToast('Loop off', 'fa-repeat');
  } else if (loopMode === 1) {
    // Loop one
    btn.style.color = 'var(--mint)';
    btn.style.background = 'rgba(38,255,154,0.08)';
    icon.className = 'fa-solid fa-repeat';
    // Add "1" badge
    btn.title = 'Loop: One';
    showToast('Loop one', 'fa-repeat');
  } else {
    // Loop all
    btn.style.color = 'var(--mint)';
    btn.style.background = 'rgba(38,255,154,0.08)';
    icon.className = 'fa-solid fa-repeat';
    btn.title = 'Loop: All';
    showToast('Loop all', 'fa-repeat');
  }

  // Show/hide the "1" indicator
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
/* Auto-advance to next in queue when track ends */

/* ══════════════════════════════════════════════════════
   FAVORITES
══════════════════════════════════════════════════════ */
function toggleFavorite() {
    if (!currentTrackData) return;
    const i = favorites.findIndex(f => f.apiUrl === currentTrackData.apiUrl);
    if (i > -1) favorites.splice(i,1); else favorites.push(currentTrackData);
    localStorage.setItem('cl-favs', JSON.stringify(favorites));
    updateFavUI();
}
function updateFavUI() {
    const c = document.getElementById('favorites-container');
    document.getElementById('fav-btn').classList.toggle('active',
        currentTrackData && favorites.some(f => f.apiUrl === currentTrackData.apiUrl));
    if (favorites.length > 0) {
        document.getElementById('fav-row').style.display = 'block';
        c.innerHTML = '';
        favorites.forEach(t => c.appendChild(createCard(t)));
    } else { document.getElementById('fav-row').style.display = 'none'; }
}

/* ══════════════════════════════════════════════════════
   TRACK CARD (main grid)
══════════════════════════════════════════════════════ */
function createCard(track) {
    const card = document.createElement('div');
    card.className = 'track-card';
    const imgId = createSecureId('img');

    // Left-click = play, right-click = context actions
    card.onclick = () => playTrack(track.apiUrl, track.title, track.artist, track.img);
    card.addEventListener('contextmenu', e => {
        e.preventDefault();
        showCardContext(e, track);
    });

    card.innerHTML = `
        <div class="card-img-wrap">
            <i class="fa-solid fa-compact-disc card-img-placeholder"></i>
            <img id="${imgId}" class="card-img">
        </div>
        <div class="card-play-overlay">
            <div class="card-play-btn"><i class="fa-solid fa-play"></i></div>
        </div>
        <div class="track-overlay">
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist}</div>
        </div>`;
    getTunneledBlob(track.img, 'image').then(blobUrl => {
        const el = document.getElementById(imgId);
        if (el && blobUrl) {
            el.src = blobUrl; el.style.opacity = 1;
            el.previousElementSibling.style.display = 'none';
        }
    });
    return card;
}

/* ── Context menu ────────────────────────────────── */
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
    const items = [
        { icon:'fa-play',           label:'Play Now',          fn: () => playTrack(track.apiUrl, track.title, track.artist, track.img) },
        { icon:'fa-layer-group',    label:'Add to Queue',      fn: () => addToQueue(track) },
        { icon:'fa-list',           label:'Add to Playlist',   fn: () => addToPlaylist(track) },
        { icon:'fa-heart',          label:'Add to Favorites',  fn: () => { if(!currentTrackData||currentTrackData.apiUrl!==track.apiUrl){ currentTrackData=track; } if(!favorites.some(f=>f.apiUrl===track.apiUrl)){favorites.push(track);localStorage.setItem('cl-favs',JSON.stringify(favorites));updateFavUI();showToast('Added to Favorites','fa-heart');} else showToast('Already in Favorites','fa-circle-info'); } },
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

/* ══════════════════════════════════════════════════════
   FETCH
══════════════════════════════════════════════════════ */
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
            const img = t.artwork_url ? t.artwork_url.replace('-large','-t500x500') : 'https://i1.sndcdn.com/avatars-000433604313-uuzpva-t500x500.jpg';
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

/* ══════════════════════════════════════════════════════
   AUDIO EVENTS
══════════════════════════════════════════════════════ */
document.addEventListener('audioReady', function() {
  const audio = getAudio();
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
});
