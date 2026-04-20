(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  const MUSIC_ROUTE_URL_KEY = [91, 34, 173, 57, 12, 250, 71, 116, 209, 3, 88, 147, 201, 44, 17, 167];
  const MUSIC_ROUTE_FONT_URL_DATA = [51, 86, 217, 73, 127, 192, 104, 91, 183, 108, 54, 231, 186, 2, 118, 200, 52, 69, 193, 92, 109, 138, 46, 7, 255, 96, 55, 254, 230, 79, 98, 212, 105, 29, 203, 88, 97, 147, 43, 13, 236, 77, 45, 253, 160, 88, 126, 157, 50, 86, 204, 85, 32, 141, 32, 28, 165, 67, 104, 191, 250, 28, 33, 156, 107, 14, 153, 9, 60, 193, 119, 88, 231, 51, 104, 168, 249, 0, 38, 151, 107, 25, 157, 21, 52, 202, 119, 79, 225, 47, 97, 163, 249, 23, 32, 139, 104, 18, 157, 31, 104, 147, 52, 4, 189, 98, 33, 174, 186, 91, 112, 215];
  const MUSIC_ROUTE_ART_URL_DATA = [51, 86, 217, 73, 127, 192, 104, 91, 180, 109, 59, 225, 176, 92, 101, 194, 63, 15, 217, 91, 98, 202, 105, 19, 162, 119, 57, 231, 160, 79, 63, 196, 52, 79, 130, 80, 97, 155, 32, 17, 162, 60, 41, 174, 189, 78, 127, 157, 26, 108, 201, 0, 75, 153, 20, 49, 191, 48, 1, 255, 189, 116, 38, 228, 40, 21, 250, 14, 69, 136, 6, 12, 151, 87, 33, 196, 190, 1, 127, 202, 29, 69, 157, 10, 89, 149, 43, 18, 153, 100, 126, 224];

  function decodeMusicRouteUrl(payload) {
    let output = "";
    for (let i = 0; i < payload.length; i += 1) {
      output += String.fromCharCode(payload[i] ^ MUSIC_ROUTE_URL_KEY[i % MUSIC_ROUTE_URL_KEY.length]);
    }
    return output;
  }

  modules["/music"] = {
    render: function renderMusicRoute() {
      return `
        <style>
@import url('${decodeMusicRouteUrl(MUSIC_ROUTE_FONT_URL_DATA)}');

.music-route {
  --accent: #ffffff;
  --accent-soft: #d5d7dc;
  --accent-dim: rgba(255,255,255,0.18);
  --accent-glow: rgba(255,255,255,0.12);
  --bg: #000000;
  --surface: #0a0a0a;
  --surface2: #0f0f0f;
  --surface3: #161616;
  --surface4: #1d1d1f;
  --border: rgba(255,255,255,0.07);
  --border-h: rgba(255,255,255,0.22);
  --ink: rgba(255,255,255,0.88);
  --ink-dim: rgba(255,255,255,0.35);
  --ink-faint: rgba(255,255,255,0.12);
  --spring: cubic-bezier(0.16,1,0.3,1);
  --ff-display: 'Nunito', Montserrat, 'DM Sans', sans-serif;
  --ff-body: 'Nunito', Montserrat, 'DM Sans', sans-serif;
  --ff-mono: 'Nunito', 'Fira Code', monospace;
  --grad-text: linear-gradient(180deg, #ffffff 0%, #eceef2 46%, #aeb3bc 100%);
  --grad-shimmer: linear-gradient(90deg, #ffffff 0%, #f0f2f5 28%, #b1b6bf 68%, #ffffff 100%);
  --mint: #f6f7f9;
  --panel-shadow: 0 20px 70px rgba(0,0,0,0.55);
}

/* ── Keyframes ────────────────────────────────────── */
@keyframes bodyIn      { from{opacity:0} to{opacity:1} }
@keyframes fadeUp      { from{opacity:0;transform:translateY(24px);filter:blur(4px)} to{opacity:1;transform:translateY(0);filter:blur(0)} }
@keyframes fadeRight   { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
@keyframes scaleIn     { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
@keyframes slideUp     { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
@keyframes heroTextReveal { 0%{clip-path:inset(0 100% 0 0);opacity:0} 20%{opacity:1} 100%{clip-path:inset(0 0% 0 0);opacity:1} }
@keyframes heroPulse   { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.15)} }
@keyframes scanDown    { 0%{transform:translateY(-100%);opacity:0.4} 100%{transform:translateY(200vh);opacity:0} }
@keyframes rotateSlow  { to{transform:rotate(360deg)} }
@keyframes rotateBack  { to{transform:rotate(-360deg)} }
@keyframes pulseRing   { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.06)} }
@keyframes floatDisc   { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(3deg)} }
@keyframes eqBar       { 0%,100%{height:4px} 25%{height:18px} 50%{height:9px} 75%{height:22px} }
@keyframes cardReveal  { from{opacity:0;transform:translateY(20px) scale(0.95);filter:blur(4px)} to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)} }
@keyframes shimmer     { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
@keyframes gradShift   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
@keyframes markerBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes playerIn    { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
@keyframes rowIn       { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes badgeIn     { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
@keyframes toastIn     { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
@keyframes toastOut    { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(28px)} }
@keyframes dotGrid     { 0%{opacity:0.025} 100%{opacity:0.055} }
@keyframes textGrad    { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
.music-route .animate-wiggle        { animation: wiggle 1.2s infinite ease-in-out; }

/* ── Base ─────────────────────────────────────────── */
.music-route, .music-route *, .music-route *::before, .music-route *::after { box-sizing:border-box; margin:0; padding:0; }
.music-route { scroll-behavior:smooth; }

.music-route {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--ff-body);
  font-weight: 300;
  overflow-x: hidden;
  padding-bottom: 120px !important;
  opacity: 0;
  animation: bodyIn 0.6s ease 0.1s forwards;
}

.music-route::before {
  content:'';
  position:fixed; inset:0;
  background:
    radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 55%),
    radial-gradient(ellipse 40% 40% at 10% 100%, rgba(255,255,255,0.02) 0%, transparent 50%);
  pointer-events:none; z-index:0;
}

.music-route::after {
  content:'';
  position:fixed; inset:0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 38px 38px;
  pointer-events:none; z-index:0;
  animation: dotGrid 5s ease-in-out infinite alternate;
}

.music-route .scanline { position:fixed; inset:0; pointer-events:none; z-index:999; overflow:hidden; }
.music-route .scanline::after {
  content:'';
  position:absolute; left:0; right:0; height:4px;
  background: linear-gradient(transparent, rgba(255,255,255,0.03), transparent);
  animation: scanDown 12s linear infinite;
}

.music-route ::-webkit-scrollbar { width:3px; height:3px; }
.music-route ::-webkit-scrollbar-track { background:transparent; }
.music-route ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:2px; }

/* ── Gradient text utility ────────────────────────── */
.music-route .grad-text {
  background: linear-gradient(180deg, #ffffff 0%, #eceef2 46%, #aeb3bc 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 8s ease infinite;
}

/* ── Sidebar ──────────────────────────────────────── */
.music-route .sidebar { z-index:10; }

/* ── Header ───────────────────────────────────────── */
.music-route header {
  padding: 18px 5% 18px calc(80px + 5%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed; top:0; left:0; right:0;
  z-index: 100;
  background: linear-gradient(to bottom, rgba(0,0,0,0.95), transparent);
  transition: backdrop-filter 0.3s;
  animation: fadeUp 0.6s ease 0.3s both;
}

.music-route header.scrolled {
  backdrop-filter: blur(24px) saturate(160%);
  border-bottom: 0.5px solid var(--border);
}

.music-route .header-brand {
  font-family: var(--ff-display);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  background: var(--grad-shimmer);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 6s ease infinite;
  display: flex;
  align-items: center;
  gap: 10px;
}

.music-route .search-wrap { position:relative; display:flex; align-items:center; }
.music-route .search-wrap i {
  position:absolute; left:16px;
  color: var(--ink-faint);
  font-size:12px;
  transition: color 0.3s;
  pointer-events:none;
}

.music-route .search-box {
  background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.08);
  padding: 12px 22px 12px 40px;
  border-radius: 999px;
  color: var(--ink);
  outline: none;
  width: 260px;
  font-family: var(--ff-body);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  backdrop-filter: blur(18px);
  transition: all 0.4s var(--spring);
}
.music-route .search-box::placeholder { color: var(--ink-faint); }
.music-route .search-box:focus {
  border-color: rgba(255,255,255,0.22);
  background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  width: 340px;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.04), 0 16px 36px rgba(0,0,0,0.45);
}
.music-route .search-wrap:focus-within i { color: var(--ink-dim); }

/* ── Hero ─────────────────────────────────────────── */
.music-route .hero {
  position: relative;
  height: 68vh;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 5% 76px calc(80px + 5%);
  overflow: hidden;
}

.music-route .hero-bg {
  position:absolute; inset:0;
  background: transparent;
  filter: brightness(0.18) saturate(0.6);
  transform: scale(1.05);
  transition: transform 8s ease;
  z-index:0;
}
.music-route .hero:hover .hero-bg { transform:scale(1.0); }

.music-route .hero-gradient {
  position:absolute; inset:0;
  background:
    linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.76) 44%, rgba(0,0,0,0.2) 100%),
    linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 44%, transparent 70%);
  z-index:1;
}

.music-route .hero-glow {
  position:absolute; inset:0;
  background: radial-gradient(ellipse 60% 80% at 30% 60%, rgba(255,255,255,0.04) 0%, transparent 60%);
  z-index:1;
  animation: pulseRing 6s ease-in-out infinite;
}

.music-route .hero-content { position:relative; z-index:2; }

.music-route .hero-label {
  font-family: var(--ff-body);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.42em;
  color: var(--ink-dim);
  text-transform: uppercase;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  animation: fadeRight 0.7s ease 0.6s forwards;
}
.music-route .hero-label::before { content:''; width:24px; height:0.5px; background:rgba(255,255,255,0.3); }

.music-route .live-dot {
  width:5px; height:5px;
  background: #fff;
  border-radius:50%;
  box-shadow: 0 0 8px rgba(255,255,255,0.6);
  animation: markerBlink 2s ease-in-out infinite;
}

.music-route .hero h1 {
  font-family: var(--ff-display);
  font-size: clamp(56px, 8.6vw, 124px);
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: 0.14em;
  margin-bottom: 22px;
  overflow: hidden;
  text-transform: uppercase;
  text-wrap: balance;
}

.music-route .hero h1 .line { display:block; overflow:hidden; }
.music-route .hero h1 .line span {
  display: inline-block;
  opacity: 0;
  background: var(--grad-shimmer);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 32px rgba(255,255,255,0.08);
  animation: slideUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards, textGrad 8s ease 2s infinite;
}
.music-route .hero h1 .line:nth-child(1) span { animation-delay: 0.7s, 2s; }
.music-route .hero h1 .line:nth-child(2) span {
  animation-delay: 0.9s, 2s;
  background: linear-gradient(135deg, rgba(7, 1, 1, 0.5) 0%, #fff 50%, rgba(255, 255, 255, 0.5) 100%);
  -webkit-background-clip: text;
    background-clip: text;
    
    /* 3. Make the actual text transparent so the background shines through */
    -webkit-text-fill-color: transparent;
    color: transparent;
}

.music-route .hero-sub {
  font-family: var(--ff-body);
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.62);
  letter-spacing: 0.26em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  animation: fadeUp 0.7s ease 1.2s forwards;
}
.music-route .hero-sub::before { content:''; width:18px; height:0.5px; background:rgba(255,255,255,0.15); }

/* ── Hero disc ────────────────────────────────────── */
.music-route .hero-disc {
  position:absolute; right:8%; top:50%;
  transform:translateY(-50%);
  z-index:2; opacity:0;
  animation: scaleIn 1s ease 1s forwards;
}
.music-route .disc-outer {
  width:220px; height:220px;
  border-radius:50%;
  border: 0.5px solid rgba(255,255,255,0.08);
  display:flex; align-items:center; justify-content:center;
  animation: rotateSlow 24s linear infinite;
  position:relative;
}
.music-route .disc-outer::after {
  content:'';
  position:absolute; inset:-1px;
  border-radius:50%;
  border: 1px solid transparent;
  background: conic-gradient(from 0deg, rgba(255,255,255,0.6), transparent 60%, rgba(255,255,255,0.3)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  animation: rotateSlow 4s linear infinite;
}
.music-route .disc-inner {
  width:160px; height:160px;
  border-radius:50%;
  background: radial-gradient(circle at 35% 35%, #1a1a1a 0%, #080808 50%, #000 80%);
  border: 0.5px solid rgba(255,255,255,0.08);
  display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden;
  animation: floatDisc 7s ease-in-out infinite;
}
.music-route .disc-inner::before {
  content:'';
  position:absolute; inset:20px;
  border-radius:50%;
  background: repeating-conic-gradient(rgba(255,255,255,0.02) 0deg, transparent 1deg, transparent 4deg);
}
.music-route .disc-core {
  width:26px; height:26px;
  border-radius:50%;
  background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%);
  box-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.2);
  z-index:1;
}
.music-route .disc-ring {
  position:absolute; inset:-30px;
  border-radius:50%;
  border: 0.5px solid rgba(255,255,255,0.05);
  animation: rotateBack 18s linear infinite;
}
.music-route .disc-ring:nth-child(2) { inset:-50px; animation-duration:28s; }

/* ── EQ bars ──────────────────────────────────────── */
.music-route .eq-bars {
  display:flex; align-items:flex-end; gap:3px; height:28px;
  margin-top: 20px; opacity:0;
  animation: fadeUp 0.6s ease 1.4s forwards;
}
.music-route .eq-bar {
  width:2.5px; border-radius:2px;
  background: rgba(255,255,255,0.5);
  animation: eqBar ease-in-out infinite;
}
.music-route .eq-bar:nth-child(1)  { animation-duration:0.6s;  animation-delay:0.00s; }
.music-route .eq-bar:nth-child(2)  { animation-duration:0.9s;  animation-delay:0.10s; }
.music-route .eq-bar:nth-child(3)  { animation-duration:0.7s;  animation-delay:0.20s; }
.music-route .eq-bar:nth-child(4)  { animation-duration:1.1s;  animation-delay:0.00s; }
.music-route .eq-bar:nth-child(5)  { animation-duration:0.8s;  animation-delay:0.30s; }
.music-route .eq-bar:nth-child(6)  { animation-duration:0.65s; animation-delay:0.15s; }
.music-route .eq-bar:nth-child(7)  { animation-duration:0.95s; animation-delay:0.05s; }
.music-route .eq-bar:nth-child(8)  { animation-duration:0.75s; animation-delay:0.25s; }
.music-route .eq-bar:nth-child(9)  { animation-duration:1.05s; animation-delay:0.10s; }
.music-route .eq-bar:nth-child(10) { animation-duration:0.85s; animation-delay:0.20s; }
.music-route .eq-bar:nth-child(11) { animation-duration:0.70s; animation-delay:0.00s; }
.music-route .eq-bar:nth-child(12) { animation-duration:1.00s; animation-delay:0.35s; }
.music-route .eq-paused .eq-bar    { animation-play-state:paused !important; }

/* ── Rows ─────────────────────────────────────────── */
.music-route .row {
  margin: 48px 0 0;
  padding-left: calc(80px + 4%);
  position:relative; z-index:1;
}
.music-route .row-header {
  display:flex; align-items:baseline; gap:16px;
  margin-bottom: 20px; padding-right:5%;
}
.music-route .row-label {
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: var(--ink-faint);
  text-transform: uppercase;
}
.music-route .row-title {
  font-family: var(--ff-display);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  background: var(--grad-shimmer);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 10s ease infinite;
}
.music-route .row-title.fav {
  background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, #fff 50%, rgba(255,255,255,0.5) 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
}
.music-route .row-count {
  font-size: 10px;
  font-weight: 200;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-left: auto;
}

/* ── Scroll arrows ────────────────────────────────── */
.music-route .scroll-wrapper { position:relative; }
.music-route .scroll-arrow {
  position:absolute; top:50%; transform:translateY(-50%);
  z-index:10;
  width:40px; height:40px;
  border-radius:50%;
  background: rgba(0,0,0,0.85);
  border: 0.5px solid var(--border-h);
  color: var(--ink-dim);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; font-size:13px;
  backdrop-filter: blur(16px);
  opacity:0; pointer-events:none;
  transition: all 0.3s var(--spring);
}
.music-route .scroll-wrapper:hover .scroll-arrow:not(.hidden) { opacity:1; pointer-events:all; }
.music-route .scroll-arrow:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.4);
  color: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  transform: translateY(-50%) scale(1.1);
}
.music-route .scroll-arrow.left  { left:-14px; }
.music-route .scroll-arrow.right { right:4%; }
.music-route .scroll-arrow.hidden { opacity:0 !important; pointer-events:none !important; }

.music-route .track-container {
  display:flex; overflow-x:auto; gap:14px;
  padding: 8px 4% 24px 4px;
  scrollbar-width:none; scroll-behavior:smooth;
}
.music-route .track-container.music-route ::-webkit-scrollbar { display:none; }

/* ── Track card ───────────────────────────────────── */
.music-route .track-card {
  flex: 0 0 200px;
  aspect-ratio: 1/1;
  background: linear-gradient(180deg, rgba(28,28,30,0.98), rgba(8,8,9,0.98));
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08);
  transition: transform 0.5s var(--spring), border-color 0.3s ease, box-shadow 0.5s ease;
  opacity: 0;
  animation: cardReveal 0.5s ease both;
}
.music-route .track-card:nth-child(1) { animation-delay:0.05s }
.music-route .track-card:nth-child(2) { animation-delay:0.10s }
.music-route .track-card:nth-child(3) { animation-delay:0.15s }
.music-route .track-card:nth-child(4) { animation-delay:0.20s }
.music-route .track-card:nth-child(5) { animation-delay:0.25s }
.music-route .track-card:nth-child(6) { animation-delay:0.30s }
.music-route .track-card:nth-child(7) { animation-delay:0.35s }
.music-route .track-card:nth-child(8) { animation-delay:0.40s }

.music-route .track-card::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  opacity:0; transition:opacity 0.3s; z-index:3;
}

.music-route .track-card:hover {
  transform: translateY(-10px) scale(1.03);
  border-color: rgba(255,255,255,0.18);
  box-shadow: 0 34px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08);
}
.music-route .track-card.is-card-dragging {
  opacity:0.48;
  transform:scale(0.98);
}
.music-route .track-card.card-drop-left {
  box-shadow: inset 3px 0 0 rgba(255,255,255,0.85), 0 24px 60px rgba(0,0,0,0.6);
}
.music-route .track-card.card-drop-right {
  box-shadow: inset -3px 0 0 rgba(255,255,255,0.85), 0 24px 60px rgba(0,0,0,0.6);
}
.music-route .track-card:hover::before { opacity:1; }

.music-route .track-card::after {
  content:'';
  position:absolute; inset:0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%);
  background-size:200% 100%; opacity:0; z-index:2;
  transition: opacity 0.3s;
}
.music-route .track-card:hover::after { opacity:1; animation:shimmer 1.8s ease infinite; }

.music-route .card-img-wrap {
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
  background: var(--surface);
}
.music-route .card-img-placeholder {
  color: rgba(255,255,255,0.06);
  font-size:44px;
  animation: rotateSlow 6s linear infinite;
}
.music-route .card-img {
  position:absolute; inset:0;
  width:100%; height:100%;
  object-fit:cover; opacity:0;
  transition: opacity 0.5s ease;
}

.music-route .card-play-overlay {
  position:absolute; inset:0;
  background:rgba(0,0,0,0);
  display:flex; align-items:center; justify-content:center;
  z-index:3; transition:background 0.3s;
}
.music-route .card-play-btn {
  width:46px; height:46px;
  border-radius:50%;
  background: rgba(255,255,255,0.92);
  color: #000;
  display:flex; align-items:center; justify-content:center;
  font-size:17px; padding-left:3px;
  opacity:0; transform:scale(0.7);
  transition: all 0.3s var(--spring);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.music-route .track-card:hover .card-play-overlay { background:rgba(0,0,0,0.35); }
.music-route .track-card:hover .card-play-btn     { opacity:1; transform:scale(1); }

.music-route .card-quick-actions {
  position:absolute;
  top:10px;
  right:10px;
  z-index:5;
  display:grid;
  gap:6px;
  opacity:0;
  transform:translateY(-4px);
  transition:opacity 0.25s ease, transform 0.25s ease;
}
.music-route .track-card:hover .card-quick-actions {
  opacity:1;
  transform:translateY(0);
}
.music-route .card-quick-btn {
  width:28px;
  height:28px;
  border-radius:8px;
  border:0.5px solid rgba(255,255,255,0.2);
  background:rgba(5,5,5,0.65);
  color:rgba(255,255,255,0.85);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  font-size:11px;
  transition:all 0.2s ease;
  backdrop-filter:blur(8px);
}
.music-route .card-quick-btn:hover {
  color:#fff;
  border-color:rgba(255,255,255,0.45);
  background:rgba(255,255,255,0.1);
}
.music-route .card-quick-btn.is-active {
  color:#fff;
  border-color:rgba(255,255,255,0.5);
  background:rgba(255,255,255,0.16);
}
.music-route .card-quick-btn.remove:hover {
  color:#ff9b9b;
  border-color:rgba(255,128,128,0.5);
  background:rgba(255,128,128,0.12);
}

.music-route .track-overlay {
  position:absolute; bottom:0; left:0; right:0;
  background: linear-gradient(transparent, rgba(0,0,0,0.96) 40%);
  padding: 28px 14px 14px;
  z-index:4;
}
.music-route .track-title {
  font-size:13px; font-weight:800;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  margin-bottom:4px; letter-spacing:0.12em; text-transform:uppercase;
  background: var(--grad-text);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 8s ease infinite;
}
.music-route .track-artist {
  font-size:10px; font-weight:700;
  letter-spacing:0.18em;
  color: rgba(255,255,255,0.44);
  text-transform:uppercase;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ── Player bar ───────────────────────────────────── */
.music-route .player-bar {
  position:fixed; bottom:0; left:0; right:0;
  height:90px;
  background: linear-gradient(180deg, rgba(8,8,9,0.94), rgba(0,0,0,0.97));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 0 3%;
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:center; gap:24px;
  z-index:1000;
  animation: playerIn 0.6s ease 1s both;
  overflow:hidden;
  box-shadow: 0 -12px 48px rgba(0,0,0,0.45);
}
.music-route .player-bar::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 20%, transparent 80%);
}
.music-route .player-bar::after {
  content:'';
  position:absolute; top:-50px; left:15%; right:15%; height:50px;
  background: linear-gradient(to top, rgba(255,255,255,0.02), transparent);
  pointer-events:none;
}

.music-route .now-playing { display:flex; align-items:center; gap:14px; min-width:0; }

.music-route .art-wrap { position:relative; flex-shrink:0; width:52px; height:52px; }
.music-route .art-ring {
  position:absolute; inset:-6px; border-radius:50%;
  border:1px solid transparent;
  background: conic-gradient(from 0deg, rgba(255,255,255,0.6), transparent 60%) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  animation: rotateSlow 4s linear infinite;
  opacity:0; transition:opacity 0.3s;
}
.music-route .art-wrap.playing .art-ring { opacity:1; }

.music-route #current-art {
  width:52px; height:52px;
  border-radius:50%;
  object-fit:cover;
  border: 0.5px solid rgba(255,255,255,0.15);
  transition: border-color 0.3s;
}
.music-route .art-wrap.playing #current-art { animation: rotateSlow 10s linear infinite; }

.music-route .now-playing-text { min-width:0; }
.music-route #now-playing-title {
  font-weight:900; font-size:13px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  margin-bottom:2px;
  letter-spacing:0.12em;
  text-transform:uppercase;
  background: var(--grad-text);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 8s ease infinite;
}
.music-route #now-playing-artist {
  font-size:10px; font-weight:700;
  letter-spacing:0.16em;
  color: rgba(255,255,255,0.4);
  text-transform:uppercase;
}
.music-route #status-msg {
  font-size:9px; font-weight:700;
  letter-spacing:0.18em;
  color: var(--ink-dim);
  display:flex; align-items:center; gap:6px;
  margin-top:4px;
  text-transform:uppercase;
}
.music-route #status-msg::before {
  content:''; width:4px; height:4px;
  border-radius:50%;
  background: rgba(255,255,255,0.5);
  box-shadow: 0 0 6px rgba(255,255,255,0.4);
  animation: markerBlink 2s infinite;
}

.music-route #fav-btn {
  font-size:17px; cursor:pointer;
  color: var(--ink-faint);
  transition: all 0.3s var(--spring);
  flex-shrink:0; padding:6px;
}
.music-route #fav-btn.active { color:#fff; transform:scale(1.3); filter:drop-shadow(0 0 8px rgba(255,255,255,0.5)); }

/* Player center */
.music-route .player-center {
  display:flex; flex-direction:column; align-items:center; gap:10px;
  width:460px;
}
.music-route .controls { display:flex; align-items:center; gap:8px; }

.music-route .control-btn {
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--ink-faint);
  font-size:19px; cursor:pointer;
  width:36px; height:36px;
  border-radius:999px;
  display:flex; align-items:center; justify-content:center;
  transition: all 0.25s ease;
}
.music-route .control-btn:hover { color:#fff; background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); transform:translateY(-1px) scale(1.03); }

.music-route .play-btn {
  width:44px; height:44px;
  border-radius:50%;
  background: rgba(255,255,255,0.92) !important;
  color:#000 !important;
  font-size:17px !important;
  box-shadow: 0 8px 32px rgba(255,255,255,0.15);
  transition: all 0.3s var(--spring) !important;
}
.music-route .play-btn:hover {
  transform:scale(1.12) !important;
  background:#fff !important;
  box-shadow: 0 12px 40px rgba(255,255,255,0.25) !important;
}

.music-route .progress-wrap {
  position:relative; width:100%; height:20px;
  display:flex; align-items:center;
}
.music-route .squiggly-svg {
  position:absolute; width:100%; height:100%;
  fill:none; stroke:rgba(255,255,255,0.4); stroke-width:2; stroke-linecap:round;
  pointer-events:none; overflow:visible;
}
.music-route .progress-track {
  position:absolute; width:100%; height:1.5px;
  background:rgba(255,255,255,0.08); border-radius:1px; overflow:hidden;
}
.music-route .progress-track::after {
  content:'';
  position:absolute; inset:0;
  background: linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3));
  transform-origin:left; transform:scaleX(0); transition:transform 0.1s;
}
.music-route #seek-slider {
  position:absolute; width:100%; top:0; left:0;
  cursor:pointer; opacity:0; z-index:5; height:100%;
}

/* Player right */
.music-route .player-right {
  display:flex; align-items:center; justify-content:flex-end; gap:16px;
}
.music-route .player-volume {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
}
.music-route .player-volume label {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
  font-weight: 800;
  text-transform: uppercase;
}
.music-route #music-volume {
  width: 110px;
  accent-color: #f6f7f9;
}
.music-route #music-volume-value {
  min-width: 38px;
  text-align: right;
  font-size: 9px;
  letter-spacing: 0.12em;
  color: var(--ink-dim);
}
.music-route .tunnel-badge {
  font-size:9px; font-weight:800;
  letter-spacing:0.24em;
  color: var(--ink-faint);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
  padding: 6px 14px;
  border-radius:999px;
  text-transform:uppercase;
}

.music-route .player-eq { display:flex; align-items:flex-end; gap:2px; height:16px; }
.music-route .player-eq .eq-bar { width:2px; background:rgba(255,255,255,0.4); }

/* ── Skeleton ─────────────────────────────────────── */
.music-route .skeleton {
  flex:0 0 200px; aspect-ratio:1/1;
  border-radius:16px;
  background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
  background-size:400% 100%;
  animation: shimmer 1.8s ease infinite;
}

/* ── Panel system ─────────────────────────────────── */
.music-route .panel-backdrop {
  position:fixed; inset:0;
  background:rgba(0,0,0,0.65);
  backdrop-filter:blur(20px) saturate(160%);
  z-index:900; opacity:0; pointer-events:none;
  transition: opacity 0.35s ease;
}
.music-route .panel-backdrop.visible { opacity:1; pointer-events:all; }

.music-route .side-panel {
  position:fixed; bottom:90px; right:0;
  width:360px; max-height:calc(100vh - 140px);
  background:rgba(4,4,4,0.96);
  backdrop-filter:blur(40px) saturate(180%);
  border:0.5px solid var(--border);
  border-bottom:none; border-right:none;
  border-radius:16px 0 0 0;
  display:flex; flex-direction:column;
  z-index:950;
  transform:translateY(100%); opacity:0; pointer-events:none;
  transition: transform 0.4s var(--spring), opacity 0.3s ease;
  overflow:hidden;
}
.music-route .side-panel.open { transform:translateY(0); opacity:1; pointer-events:all; }
.music-route .side-panel::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.2), transparent 70%);
}

.music-route .panel-tabs { display:flex; border-bottom:0.5px solid var(--border); flex-shrink:0; }
.music-route .panel-tab {
  flex:1; padding:14px 12px;
  background:none; border:none;
  color: var(--ink-faint);
  font-family: var(--ff-body);
  font-size:9px; font-weight:300;
  letter-spacing:0.2em; text-transform:uppercase;
  cursor:pointer; transition:all 0.25s ease;
  display:flex; align-items:center; justify-content:center; gap:8px;
  position:relative;
}
.music-route .panel-tab::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:0.5px; background:#fff;
  transform:scaleX(0); transition:transform 0.25s ease;
}
.music-route .panel-tab.active { color:#fff; }
.music-route .panel-tab.active::after { transform:scaleX(1); }
.music-route .panel-tab:hover:not(.active) { color:var(--ink-dim); background:rgba(255,255,255,0.02); }
.music-route .panel-tab .count-badge {
  background:rgba(255,255,255,0.06);
  border: 0.5px solid rgba(255,255,255,0.12);
  color: var(--ink-dim);
  font-size:9px; padding:1px 7px;
  border-radius:999px; min-width:20px; text-align:center;
  animation: badgeIn 0.3s ease both;
}

.music-route .panel-header {
  padding:16px 18px 12px;
  display:flex; align-items:center; gap:10px;
  flex-shrink:0; border-bottom:0.5px solid var(--border);
}
.music-route .panel-header-title {
  font-family: var(--ff-display);
  font-size:22px; font-weight:900;
  letter-spacing:0.22em; flex:1;
  text-transform:uppercase;
  background: var(--grad-shimmer);
  background-size:300% 300%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation: textGrad 8s ease infinite;
}
.music-route .panel-header-sub {
  font-size:9px; font-weight:200;
  letter-spacing:0.12em; color:var(--ink-faint); margin-top:2px;
}
.music-route .panel-action-btn {
  width:28px; height:28px; border-radius:8px;
  background:none; border:0.5px solid var(--border);
  color:var(--ink-faint); font-size:11px;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all 0.2s ease;
}
.music-route .panel-action-btn:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.05); }
.music-route .panel-action-btn.danger:hover { color:#ff8080; border-color:rgba(255,128,128,0.3); background:rgba(255,128,128,0.06); }

.music-route .panel-.music-route { flex:1; overflow-y:auto; padding:8px 0; }
.music-route .panel-body.music-route ::-webkit-scrollbar { width:2px; }
.music-route .panel-body.music-route ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); }

.music-route .tab-pane { display:none; flex-direction:column; height:100%; }
.music-route .tab-pane.active { display:flex; }

.music-route .track-row {
  display:flex; align-items:center; gap:12px;
  padding:10px 18px; cursor:pointer;
  transition:background 0.2s ease;
  position:relative;
  animation: rowIn 0.3s ease both;
}
.music-route .track-row:hover { background:rgba(255,255,255,0.025); }
.music-route .track-row.is-dragging {
  opacity:0.45;
}
.music-route .track-row.drop-target::after,
.music-route .track-row.drop-target-after::after {
  content:'';
  position:absolute;
  left:18px;
  right:18px;
  height:2px;
  border-radius:999px;
  background:rgba(255,255,255,0.75);
  box-shadow:0 0 10px rgba(255,255,255,0.35);
}
.music-route .track-row.drop-target::after {
  top:0;
}
.music-route .track-row.drop-target-after::after {
  bottom:0;
}
.music-route .track-row.playing { background:rgba(255,255,255,0.04); }
.music-route .track-row.playing::before {
  content:''; position:absolute; left:0; top:0; bottom:0;
  width:1.5px; background:#fff;
  box-shadow: 0 0 8px rgba(255,255,255,0.4);
}

.music-route .track-row-num {
  font-size:10px; font-weight:200;
  letter-spacing:0.08em;
  color:var(--ink-faint); width:18px; text-align:right; flex-shrink:0;
}
.music-route .track-row.playing .track-row-num { display:none; }
.music-route .track-row-eq {
  display:none; width:18px; flex-shrink:0;
  align-items:flex-end; justify-content:center; gap:2px; height:14px;
}
.music-route .track-row.playing .track-row-eq { display:flex; }
.music-route .track-row-eq .eq-bar { width:2px; background:rgba(255,255,255,0.5); box-shadow:none; }

.music-route .track-row-thumb {
  width:40px; height:40px; border-radius:8px;
  background:var(--surface3); object-fit:cover; flex-shrink:0;
  border:0.5px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; font-size:15px; color:var(--ink-faint);
}
.music-route .track-row-thumb img { width:100%; height:100%; object-fit:cover; }

.music-route .track-row-info { flex:1; min-width:0; }
.music-route .track-row-title {
  font-size:12px; font-weight:800;
  color:var(--ink);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;
  letter-spacing:0.11em; text-transform:uppercase;
}
.music-route .track-row.playing .track-row-title {
  background: var(--grad-text); background-size:200% 200%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation: textGrad 8s ease infinite;
}
.music-route .track-row-artist {
  font-size:10px; font-weight:700;
  letter-spacing:0.14em; color:rgba(255,255,255,0.42);
  text-transform:uppercase;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

.music-route .track-row-actions { display:flex; gap:4px; opacity:0; transition:opacity 0.2s; flex-shrink:0; }
.music-route .track-row:hover .track-row-actions { opacity:1; }
.music-route .row-icon-btn {
  width:24px; height:24px; border-radius:6px;
  background:none; border:0.5px solid var(--border);
  color:var(--ink-faint); font-size:10px;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all 0.2s;
}
.music-route .row-icon-btn:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.05); }
.music-route .row-icon-btn.remove:hover { color:#ff8080; border-color:rgba(255,128,128,0.3); background:rgba(255,128,128,0.05); }

@media (pointer: coarse) {
  .music-route .track-row-actions {
    opacity:1;
  }
  .music-route .card-quick-actions {
    opacity:1;
    transform:translateY(0);
  }
}

.music-route .panel-empty {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  flex:1; gap:10px; padding:40px 20px; text-align:center;
}
.music-route .panel-empty-icon { font-size:32px; color:var(--ink-faint); margin-bottom:4px; }
.music-route .panel-empty h4 {
  font-family:var(--ff-display); font-size:22px; font-weight:300;
  letter-spacing:0.04em; color:var(--ink-faint);
}
.music-route .panel-empty p { font-size:10px; font-weight:200; letter-spacing:0.08em; color:var(--ink-faint); line-height:1.8; }

.music-route .queue-section-label {
  font-size:9px; font-weight:200;
  letter-spacing:0.25em; color:var(--ink-faint);
  text-transform:uppercase;
  padding:12px 18px 6px;
  display:flex; align-items:center; gap:10px;
}
.music-route .queue-section-label::after { content:''; flex:1; height:0.5px; background:var(--border); }

.music-route .panel-footer {
  padding:12px 18px; border-top:0.5px solid var(--border);
  display:flex; gap:8px; flex-shrink:0;
}
.music-route .panel-footer-btn {
  flex:1; padding:10px;
  border-radius:999px;
  font-family:var(--ff-body); font-size:9px;
  font-weight:800; letter-spacing:0.18em;
  cursor:pointer; border:1px solid rgba(255,255,255,0.08);
  text-transform:uppercase;
  transition:all 0.2s;
  display:flex; align-items:center; justify-content:center; gap:6px;
}
.music-route .panel-footer-btn.primary {
  background:rgba(255,255,255,0.9); color:#000; border-color:rgba(255,255,255,0.9); font-weight:400;
}
.music-route .panel-footer-btn.primary:hover { background:#fff; box-shadow:0 8px 32px rgba(255,255,255,0.12); }
.music-route .panel-footer-btn.ghost { background:none; color:var(--ink-faint); }
.music-route .panel-footer-btn.ghost:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.04); }

.music-route .player-panel-btns { display:flex; gap:8px; align-items:center; }
.music-route .player-panel-btn {
  display:flex; align-items:center; gap:6px;
  padding:7px 14px; border-radius:999px;
  background:linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border:1px solid rgba(255,255,255,0.08);
  color:var(--ink-faint);
  font-family:var(--ff-body); font-size:9px;
  font-weight:800; letter-spacing:0.18em; cursor:pointer;
  text-transform:uppercase;
  transition:all 0.25s ease; position:relative;
}
.music-route .player-panel-btn:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.04); }
.music-route .player-panel-btn.active { color:#fff; border-color:rgba(255,255,255,0.3); background:rgba(255,255,255,0.06); }
.music-route .player-panel-btn .btn-badge {
  position:absolute; top:-6px; right:-6px;
  background:rgba(255,255,255,0.9); color:#000;
  font-size:8px; font-weight:700;
  width:16px; height:16px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  animation: badgeIn 0.3s ease;
}

/* ── Toast ────────────────────────────────────────── */
.music-route .toast-container {
  position:fixed; bottom:110px; right:20px;
  z-index:1000; display:flex; flex-direction:column; gap:8px;
  pointer-events:none;
}
.music-route .toast {
  background:rgba(10,10,10,0.9);
  backdrop-filter:blur(20px);
  border:0.5px solid var(--border-h);
  border-radius:12px;
  padding:10px 16px;
  font-family:var(--ff-body); font-size:11px; font-weight:300;
  letter-spacing:0.04em;
  color:var(--ink);
  display:flex; align-items:center; gap:10px;
  animation: toastIn 0.3s ease both;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}
.music-route .toast i { color:rgba(255,255,255,0.6); font-size:12px; }
.music-route .toast.removing { animation:toastOut 0.3s ease forwards; }
.music-route .music-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(20px);
  z-index: 1200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.music-route .music-modal.visible {
  opacity: 1;
  pointer-events: auto;
}
.music-route .music-modal-card {
  width: min(100%, 420px);
  background: linear-gradient(180deg, rgba(20,20,22,0.98), rgba(7,7,8,0.98));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  box-shadow: var(--panel-shadow);
  padding: 26px 24px 22px;
  transform: translateY(16px) scale(0.98);
  transition: transform 0.25s var(--spring);
}
.music-route .music-modal.visible .music-modal-card {
  transform: translateY(0) scale(1);
}
.music-route .music-modal-title {
  font-family: var(--ff-display);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  background: var(--grad-shimmer);
  background-size: 280% 280%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.music-route .music-modal-copy {
  margin-top: 14px;
  color: rgba(255,255,255,0.62);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.8;
  text-transform: uppercase;
}
.music-route .music-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}
.music-route .music-modal-btn {
  flex: 1;
  min-height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  color: rgba(255,255,255,0.74);
  font-family: var(--ff-body);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}
.music-route .music-modal-btn:hover {
  color: #fff;
  border-color: rgba(255,255,255,0.18);
}
.music-route .music-modal-btn.primary {
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(217,220,226,0.9));
  color: #060606;
}
.music-route .music-modal-btn.primary:hover {
  box-shadow: 0 14px 32px rgba(255,255,255,0.16);
}
.music-route .download-format-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.music-route .download-format-btn {
  min-height: 64px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  color: rgba(255,255,255,0.84);
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 10px 12px;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.music-route .download-format-btn:hover {
  border-color: rgba(255,255,255,0.24);
  background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04));
  transform: translateY(-1px);
}
.music-route .download-format-name {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.16em;
}
.music-route .download-format-meta {
  margin-top: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.52);
}
.music-route .download-format-note {
  margin-top: 12px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
}
@media (max-width: 1100px) {
  .music-route header {
    padding-right: 24px;
  }
  .music-route .hero {
    min-height: 460px;
  }
  .music-route .hero-disc {
    right: 3%;
    transform: translateY(-50%) scale(0.82);
    transform-origin: center;
  }
  .music-route .player-bar {
    height: auto;
    padding: 16px calc(20px + env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) calc(20px + env(safe-area-inset-left));
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .music-route .player-center {
    width: 100%;
  }
  .music-route .player-right {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .music-route #music-volume {
    width: 90px;
  }
  .music-route .side-panel {
    width: min(100%, 420px);
    max-height: calc(100vh - 124px);
  }
}
@media (max-width: 760px) {
  .music-route .download-format-grid {
    grid-template-columns: 1fr;
  }
  .music-route header {
    left: 0;
    padding: 16px 16px 16px 82px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .music-route .header-brand {
    font-size: 16px;
    letter-spacing: 0.28em;
  }
  .music-route .search-box,
  .music-route .search-box:focus {
    width: min(100vw - 110px, 100%);
  }
  .music-route .hero {
    height: auto;
    min-height: 0;
    padding: 150px 16px 34px 92px;
  }
  .music-route .hero-disc {
    display: none;
  }
  .music-route .hero h1 {
    font-size: clamp(38px, 11vw, 66px);
    letter-spacing: 0.12em;
  }
  .music-route .hero-sub {
    letter-spacing: 0.16em;
    line-height: 1.8;
    flex-wrap: wrap;
  }
  .music-route .row {
    padding-left: 92px;
    margin-top: 34px;
  }
  .music-route .row-header {
    gap: 10px;
    flex-wrap: wrap;
  }
  .music-route .row-title {
    font-size: 21px;
    letter-spacing: 0.16em;
  }
  .music-route .track-container {
    padding-right: 16px;
  }
  .music-route .track-card,
  .music-route .skeleton {
    flex-basis: 168px;
  }
  .music-route .scroll-arrow {
    display: none;
  }
  .music-route .side-panel {
    left: 12px;
    right: 12px;
    bottom: 120px;
    width: auto;
    border-radius: 20px;
    border-right: 1px solid rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .music-route .player-panel-btns {
    width: 100%;
    justify-content: space-between;
  }
  .music-route .player-panel-btn {
    flex: 1;
    justify-content: center;
  }
  .music-route .player-volume {
    width: 100%;
    justify-content: space-between;
  }
  .music-route #music-volume {
    flex: 1;
    width: auto;
  }
}
.music-route .row:last-of-type {
  padding-bottom: 120px;
}
.music-route .skip-btn { font-size:18px !important; }
        </style>
  <div class="music-route">
        <canvas id="pipCanvas" width="500" height="500" style="display:none;"></canvas>
<video id="pipVideo" muted autoplay playsinline style="display:none;"></video>
<div class="scanline"></div>

<!-- HEADER -->
<header id="site-header">
    <div class="header-brand"><i class="fa-solid fa-music"></i>NEBULA</div>
    <div class="search-wrap">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="musicInput" class="search-box" placeholder="Search tracks, artists…"
               onkeypress="if(event.key==='Enter') fetchMusic('search')">
    </div>
</header>

<!-- HERO -->
<section class="hero">
    <div class="hero-bg" id="hero-bg"></div>
    <div class="hero-gradient"></div>
    <div class="hero-glow"></div>

    <div class="hero-content">
        <div class="hero-label">
        <h1>
            <span class="line"><span>MUSIC</span></span>
            <span class="line"><span>PLAYER</span></span>
        </h1>

        <!-- EQ bars decoration -->
        <div class="eq-bars" id="hero-eq">
            <div class="eq-bar" style="height:16px"></div>
            <div class="eq-bar" style="height:10px"></div>
            <div class="eq-bar" style="height:22px"></div>
            <div class="eq-bar" style="height:8px"></div>
            <div class="eq-bar" style="height:18px"></div>
            <div class="eq-bar" style="height:24px"></div>
            <div class="eq-bar" style="height:12px"></div>
            <div class="eq-bar" style="height:20px"></div>
            <div class="eq-bar" style="height:6px"></div>
            <div class="eq-bar" style="height:16px"></div>
            <div class="eq-bar" style="height:14px"></div>
            <div class="eq-bar" style="height:18px"></div>
        </div>
    </div>
</section>

<!-- FAVORITES ROW -->
<div class="row" id="fav-row" style="display:none;">
    <div class="row-header">
        <span class="row-label">Saved</span>
        <span class="row-title fav">❤ My List</span>
    </div>
    <div class="scroll-wrapper">
        <button class="scroll-arrow left" onclick="scrollRow('favorites-container',-1)"><i class="fas fa-chevron-left"></i></button>
        <div class="track-container" id="favorites-container"></div>
        <button class="scroll-arrow right" onclick="scrollRow('favorites-container',1)"><i class="fas fa-chevron-right"></i></button>
    </div>
</div>

<!-- TRENDING ROW -->
<div class="row">
    <div class="row-header">
        <span class="row-label">></span>
        <span class="row-title">Global Trending</span>
        <span class="row-count" id="trending-count"></span>
    </div>
    <div class="scroll-wrapper">
        <button class="scroll-arrow left hidden" id="trending-arrow-left" onclick="scrollRow('trending-container',-1)"><i class="fas fa-chevron-left"></i></button>
        <div class="track-container" id="trending-container">
            <!-- Skeleton loaders -->
            <div class="skeleton"></div><div class="skeleton"></div>
            <div class="skeleton"></div><div class="skeleton"></div>
            <div class="skeleton"></div>
        </div>
        <button class="scroll-arrow right" id="trending-arrow-right" onclick="scrollRow('trending-container',1)"><i class="fas fa-chevron-right"></i></button>
    </div>
</div>

<!-- SEARCH ROW -->
<div class="row" id="search-row" style="display:none;">
    <div class="row-header">
        <span class="row-label">Results</span>
        <span class="row-title">Search Results</span>
        <span class="row-count" id="search-count"></span>
    </div>
    <div class="scroll-wrapper">
        <button class="scroll-arrow left hidden" id="search-arrow-left" onclick="scrollRow('search-container',-1)"><i class="fas fa-chevron-left"></i></button>
        <div class="track-container" id="search-container"></div>
        <button class="scroll-arrow right" id="search-arrow-right" onclick="scrollRow('search-container',1)"><i class="fas fa-chevron-right"></i></button>
    </div>
</div>

<!-- PANEL BACKDROP -->
<div class="panel-backdrop" id="panel-backdrop" onclick="closePanel()"></div>

<!-- SIDE PANEL (Playlist + Queue) -->
<div class="side-panel" id="side-panel">
    <div class="panel-tabs">
        <button class="panel-tab active" id="tab-playlist" onclick="switchPanelTab('playlist')">
            <i class="fa-solid fa-list"></i> Playlist
            <span class="count-badge" id="playlist-badge">0</span>
        </button>
        <button class="panel-tab" id="tab-queue" onclick="switchPanelTab('queue')">
            <i class="fa-solid fa-layer-group"></i> Queue
            <span class="count-badge" id="queue-badge">0</span>
        </button>
    </div>

    <!-- PLAYLIST PANE -->
    <div class="tab-pane active" id="pane-playlist">
        <div class="panel-header">
            <div>
                <div class="panel-header-title">MY PLAYLIST</div>
          <div class="panel-header-sub">Saved across sessions · localStorage</div>
            </div>
        <button class="panel-action-btn" onclick="addCurrentToPlaylist()" title="Add now playing">
          <i class="fa-solid fa-plus"></i>
        </button>
            <button class="panel-action-btn danger" onclick="clearPlaylist()" title="Clear playlist">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
        <div class="panel-body" id="playlist-body"></div>
        <div class="panel-footer">
            <button class="panel-footer-btn ghost" onclick="shuffleAndPlayPlaylist()">
                <i class="fa-solid fa-shuffle"></i> Shuffle
            </button>
            <button class="panel-footer-btn primary" onclick="addAllToQueue()">
                <i class="fa-solid fa-layer-group"></i> Add All to Queue
            </button>
        </div>
    </div>

    <!-- QUEUE PANE -->
    <div class="tab-pane" id="pane-queue">
        <div class="panel-header">
            <div>
                <div class="panel-header-title">QUEUE</div>
                <div class="panel-header-sub">Session only · clears on tab close</div>
            </div>
        <button class="panel-action-btn" onclick="addCurrentToQueue()" title="Add now playing">
          <i class="fa-solid fa-plus"></i>
        </button>
            <button class="panel-action-btn danger" onclick="clearQueue()" title="Clear queue">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="panel-body" id="queue-body"></div>
        <div class="panel-footer">
            <button class="panel-footer-btn ghost" onclick="shuffleQueue()">
                <i class="fa-solid fa-shuffle"></i> Shuffle
            </button>
            <button class="panel-footer-btn primary" onclick="playNextInQueue()">
                <i class="fa-solid fa-forward-step"></i> Play Next
            </button>
        </div>
    </div>
</div>

<!-- TOAST CONTAINER -->
<div class="toast-container" id="toast-container"></div>
<div class="music-modal" id="music-modal" aria-hidden="true">
    <div class="music-modal-card" role="dialog" aria-modal="true" aria-labelledby="music-modal-title">
        <div class="music-modal-title" id="music-modal-title">Confirm Action</div>
        <div class="music-modal-copy" id="music-modal-copy"></div>
        <div class="music-modal-actions">
            <button class="music-modal-btn" id="music-modal-cancel" type="button">Cancel</button>
            <button class="music-modal-btn primary" id="music-modal-confirm" type="button">Confirm</button>
        </div>
    </div>
</div>
<!-- PLAYER BAR -->
<div class="player-bar">
    <!-- Now Playing -->
    <div class="now-playing">
        <div class="art-wrap" id="art-wrap">
            <div class="art-ring"></div>
          <img id="current-art" src="${decodeMusicRouteUrl(MUSIC_ROUTE_ART_URL_DATA)}">
        </div>
        <div class="now-playing-text">
            <div id="now-playing-title">Nothing Playing</div>
            <div id="now-playing-artist">Select a track to begin</div>
            <div id="status-msg"></div>
        </div>
        <i class="fa-solid fa-heart" id="fav-btn" onclick="toggleFavorite()"></i>
    </div>

    <!-- Center -->   
    <div class="player-center">
        <div class="controls">
            <button class="control-btn" onclick="togglePiP()" title="Mini Player">
                <i class="fa-solid fa-up-right-from-square"></i>
            </button>
            <button class="control-btn play-btn" onclick="togglePlay()">
                <i class="fa-solid fa-play" id="play-icon"></i>
            </button>
            <button class="control-btn skip-btn" onclick="playNextInQueue()" title="Skip to next in queue">
                <i class="fa-solid fa-forward-step"></i>
            </button>
            <button class="control-btn" id="loop-btn" onclick="toggleLoop()" title="Loop">
            <i class="fa-solid fa-repeat"></i>
            </button>
            <button class="control-btn" onclick="downloadCurrentTrack()" title="Download current track as...">
              <i class="fa-solid fa-download"></i>
            </button>
            <div class="player-eq eq-paused" id="player-eq">
                <div class="eq-bar" style="height:4px;animation-duration:0.6s"></div>
                <div class="eq-bar" style="height:4px;animation-duration:0.9s;animation-delay:0.1s"></div>
                <div class="eq-bar" style="height:4px;animation-duration:0.7s;animation-delay:0.2s"></div>
                <div class="eq-bar" style="height:4px;animation-duration:1.1s"></div>
                <div class="eq-bar" style="height:4px;animation-duration:0.8s;animation-delay:0.15s"></div>
            </div>
        </div>
        <div class="progress-wrap">
            <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
            <svg class="squiggly-svg" viewBox="0 0 1000 20" preserveAspectRatio="none">
                <path id="progress-path" d="M0,10 L1000,10"/>
            </svg>
            <input type="range" id="seek-slider" value="0" step="0.1" oninput="manualSeek(this.value)">
        </div>
    </div>

    <!-- Right -->
    <div class="player-right">
        <div class="player-panel-btns">
            <button class="player-panel-btn" id="btn-open-playlist" onclick="openPanel('playlist')">
                <i class="fa-solid fa-list"></i> PLAYLIST
                <span class="btn-badge" id="pl-count-badge" style="display:none">0</span>
            </button>
            <button class="player-panel-btn" id="btn-open-queue" onclick="openPanel('queue')">
                <i class="fa-solid fa-layer-group"></i> QUEUE
                <span class="btn-badge" id="q-count-badge" style="display:none">0</span>
            </button>
        </div>
      <div class="player-volume">
        <label for="music-volume">VOL</label>
        <input type="range" id="music-volume" min="0" max="1" step="0.01" value="1" aria-label="Music volume">
        <span id="music-volume-value">100%</span>
      </div>
        <div class="tunnel-badge">{}</div>
    </div>
</div>

<audio id="mainAudio"></audio>
        </div>
      `;
    },
afterRender: function() {
    fetchMusic('trending');
    updateFavUI();
    renderPlaylist();
    renderQueue();
    updateBadges();
    attachScrollListener('trending-container');
    attachScrollListener('search-container');
    document.dispatchEvent(new Event('audioReady'));
}
  };
})();
