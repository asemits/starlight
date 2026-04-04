(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/music"] = {
    render: function renderMusicRoute() {
      return `
        <style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200;0,300;0,400;0,600;0,700;1,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');

:root {
  --accent: #ffffff;
  --accent-dim: rgba(255,255,255,0.18);
  --accent-glow: rgba(255,255,255,0.12);
  --bg: #000000;
  --surface: #0a0a0a;
  --surface2: #0f0f0f;
  --surface3: #161616;
  --border: rgba(255,255,255,0.07);
  --border-h: rgba(255,255,255,0.22);
  --ink: rgba(255,255,255,0.88);
  --ink-dim: rgba(255,255,255,0.35);
  --ink-faint: rgba(255,255,255,0.12);
  --spring: cubic-bezier(0.16,1,0.3,1);
  --ff-display: 'Cormorant Garamond', serif;
  --ff-body: 'Nunito', Montserrat, 'DM Sans', sans-serif;
  --ff-mono: 'Nunito', 'Fira Code', monospace;
  --grad-text: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 50%, #fff 100%);
  --grad-shimmer: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.85) 70%, #fff 100%);
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
.animate-wiggle        { animation: wiggle 1.2s infinite ease-in-out; }

/* ── Base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
html { scroll-behavior:smooth; }

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--ff-body);
  font-weight: 300;
  overflow-x: hidden;
  padding-bottom: 160px;
  opacity: 0;
  animation: bodyIn 0.6s ease 0.1s forwards;
}

body::before {
  content:'';
  position:fixed; inset:0;
  background:
    radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 55%),
    radial-gradient(ellipse 40% 40% at 10% 100%, rgba(255,255,255,0.02) 0%, transparent 50%);
  pointer-events:none; z-index:0;
}

body::after {
  content:'';
  position:fixed; inset:0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 38px 38px;
  pointer-events:none; z-index:0;
  animation: dotGrid 5s ease-in-out infinite alternate;
}

.scanline { position:fixed; inset:0; pointer-events:none; z-index:999; overflow:hidden; }
.scanline::after {
  content:'';
  position:absolute; left:0; right:0; height:4px;
  background: linear-gradient(transparent, rgba(255,255,255,0.03), transparent);
  animation: scanDown 12s linear infinite;
}

::-webkit-scrollbar { width:3px; height:3px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:2px; }

/* ── Gradient text utility ────────────────────────── */
.grad-text {
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0.9) 70%, #fff 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 8s ease infinite;
}

/* ── Sidebar ──────────────────────────────────────── */
.sidebar { z-index:10; }

/* ── Header ───────────────────────────────────────── */
header {
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

header.scrolled {
  backdrop-filter: blur(24px) saturate(160%);
  background: rgba(0,0,0,0.8);
  border-bottom: 0.5px solid var(--border);
}

.header-brand {
  font-family: var(--ff-display);
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 0.2em;
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

.search-wrap { position:relative; display:flex; align-items:center; }
.search-wrap i {
  position:absolute; left:16px;
  color: var(--ink-faint);
  font-size:12px;
  transition: color 0.3s;
  pointer-events:none;
}

.search-box {
  background: rgba(255,255,255,0.04);
  border: 0.5px solid var(--border);
  padding: 10px 20px 10px 40px;
  border-radius: 999px;
  color: var(--ink);
  outline: none;
  width: 240px;
  font-family: var(--ff-body);
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.06em;
  backdrop-filter: blur(12px);
  transition: all 0.4s var(--spring);
}
.search-box::placeholder { color: var(--ink-faint); }
.search-box:focus {
  border-color: rgba(255,255,255,0.28);
  background: rgba(255,255,255,0.06);
  width: 320px;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5);
}
.search-wrap:focus-within i { color: var(--ink-dim); }

/* ── Hero ─────────────────────────────────────────── */
.hero {
  position: relative;
  height: 62vh;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 5% 60px calc(80px + 5%);
  overflow: hidden;
}

.hero-bg {
  position:absolute; inset:0;
  background: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdVD7HYYAAVqf2fKLOUgPHl7I_--dyl1maLA&s') center/cover no-repeat;
  filter: brightness(0.18) saturate(0.6);
  transform: scale(1.05);
  transition: transform 8s ease;
  z-index:0;
}
.hero:hover .hero-bg { transform:scale(1.0); }

.hero-gradient {
  position:absolute; inset:0;
  background:
    linear-gradient(to top, var(--bg) 0%, rgba(0,0,0,0.65) 50%, transparent 100%),
    linear-gradient(to right, var(--bg) 0%, transparent 60%);
  z-index:1;
}

.hero-glow {
  position:absolute; inset:0;
  background: radial-gradient(ellipse 60% 80% at 30% 60%, rgba(255,255,255,0.04) 0%, transparent 60%);
  z-index:1;
  animation: pulseRing 6s ease-in-out infinite;
}

.hero-content { position:relative; z-index:2; }

.hero-label {
  font-family: var(--ff-body);
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.35em;
  color: var(--ink-dim);
  text-transform: uppercase;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  animation: fadeRight 0.7s ease 0.6s forwards;
}
.hero-label::before { content:''; width:24px; height:0.5px; background:rgba(255,255,255,0.3); }

.live-dot {
  width:5px; height:5px;
  background: #fff;
  border-radius:50%;
  box-shadow: 0 0 8px rgba(255,255,255,0.6);
  animation: markerBlink 2s ease-in-out infinite;
}

.hero h1 {
  font-family: var(--ff-display);
  font-size: clamp(52px, 8vw, 110px);
  font-weight: 300;
  line-height: 0.92;
  letter-spacing: -0.01em;
  margin-bottom: 18px;
  overflow: hidden;
}

.hero h1 .line { display:block; overflow:hidden; }
.hero h1 .line span {
  display: inline-block;
  opacity: 0;
  background: var(--grad-shimmer);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: slideUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards, textGrad 8s ease 2s infinite;
}
.hero h1 .line:nth-child(1) span { animation-delay: 0.7s, 2s; }
.hero h1 .line:nth-child(2) span {
  animation-delay: 0.9s, 2s;
  background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, #fff 50%, rgba(255,255,255,0.5) 100%);
  background-size: 300% 300%;
}

.hero-sub {
  font-family: var(--ff-body);
  font-size: 11px;
  font-weight: 200;
  color: var(--ink-faint);
  letter-spacing: 0.12em;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  animation: fadeUp 0.7s ease 1.2s forwards;
}
.hero-sub::before { content:''; width:18px; height:0.5px; background:rgba(255,255,255,0.15); }

/* ── Hero disc ────────────────────────────────────── */
.hero-disc {
  position:absolute; right:8%; top:50%;
  transform:translateY(-50%);
  z-index:2; opacity:0;
  animation: scaleIn 1s ease 1s forwards;
}
.disc-outer {
  width:220px; height:220px;
  border-radius:50%;
  border: 0.5px solid rgba(255,255,255,0.08);
  display:flex; align-items:center; justify-content:center;
  animation: rotateSlow 24s linear infinite;
  position:relative;
}
.disc-outer::after {
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
.disc-inner {
  width:160px; height:160px;
  border-radius:50%;
  background: radial-gradient(circle at 35% 35%, #1a1a1a 0%, #080808 50%, #000 80%);
  border: 0.5px solid rgba(255,255,255,0.08);
  display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden;
  animation: floatDisc 7s ease-in-out infinite;
}
.disc-inner::before {
  content:'';
  position:absolute; inset:20px;
  border-radius:50%;
  background: repeating-conic-gradient(rgba(255,255,255,0.02) 0deg, transparent 1deg, transparent 4deg);
}
.disc-core {
  width:26px; height:26px;
  border-radius:50%;
  background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%);
  box-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.2);
  z-index:1;
}
.disc-ring {
  position:absolute; inset:-30px;
  border-radius:50%;
  border: 0.5px solid rgba(255,255,255,0.05);
  animation: rotateBack 18s linear infinite;
}
.disc-ring:nth-child(2) { inset:-50px; animation-duration:28s; }

/* ── EQ bars ──────────────────────────────────────── */
.eq-bars {
  display:flex; align-items:flex-end; gap:3px; height:28px;
  margin-top: 20px; opacity:0;
  animation: fadeUp 0.6s ease 1.4s forwards;
}
.eq-bar {
  width:2.5px; border-radius:2px;
  background: rgba(255,255,255,0.5);
  animation: eqBar ease-in-out infinite;
}
.eq-bar:nth-child(1)  { animation-duration:0.6s;  animation-delay:0.00s; }
.eq-bar:nth-child(2)  { animation-duration:0.9s;  animation-delay:0.10s; }
.eq-bar:nth-child(3)  { animation-duration:0.7s;  animation-delay:0.20s; }
.eq-bar:nth-child(4)  { animation-duration:1.1s;  animation-delay:0.00s; }
.eq-bar:nth-child(5)  { animation-duration:0.8s;  animation-delay:0.30s; }
.eq-bar:nth-child(6)  { animation-duration:0.65s; animation-delay:0.15s; }
.eq-bar:nth-child(7)  { animation-duration:0.95s; animation-delay:0.05s; }
.eq-bar:nth-child(8)  { animation-duration:0.75s; animation-delay:0.25s; }
.eq-bar:nth-child(9)  { animation-duration:1.05s; animation-delay:0.10s; }
.eq-bar:nth-child(10) { animation-duration:0.85s; animation-delay:0.20s; }
.eq-bar:nth-child(11) { animation-duration:0.70s; animation-delay:0.00s; }
.eq-bar:nth-child(12) { animation-duration:1.00s; animation-delay:0.35s; }
.eq-paused .eq-bar    { animation-play-state:paused !important; }

/* ── Rows ─────────────────────────────────────────── */
.row {
  margin: 48px 0 0;
  padding-left: calc(80px + 4%);
  position:relative; z-index:1;
}
.row-header {
  display:flex; align-items:baseline; gap:16px;
  margin-bottom: 20px; padding-right:5%;
}
.row-label {
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: var(--ink-faint);
  text-transform: uppercase;
}
.row-title {
  font-family: var(--ff-display);
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 0.04em;
  background: var(--grad-shimmer);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 10s ease infinite;
}
.row-title.fav {
  background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, #fff 50%, rgba(255,255,255,0.5) 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
}
.row-count {
  font-size: 10px;
  font-weight: 200;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-left: auto;
}

/* ── Scroll arrows ────────────────────────────────── */
.scroll-wrapper { position:relative; }
.scroll-arrow {
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
.scroll-wrapper:hover .scroll-arrow:not(.hidden) { opacity:1; pointer-events:all; }
.scroll-arrow:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.4);
  color: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  transform: translateY(-50%) scale(1.1);
}
.scroll-arrow.left  { left:-14px; }
.scroll-arrow.right { right:4%; }
.scroll-arrow.hidden { opacity:0 !important; pointer-events:none !important; }

.track-container {
  display:flex; overflow-x:auto; gap:14px;
  padding: 8px 4% 24px 4px;
  scrollbar-width:none; scroll-behavior:smooth;
}
.track-container::-webkit-scrollbar { display:none; }

/* ── Track card ───────────────────────────────────── */
.track-card {
  flex: 0 0 200px;
  aspect-ratio: 1/1;
  background: var(--surface2);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 0.5px solid var(--border);
  transition: transform 0.5s var(--spring), border-color 0.3s ease, box-shadow 0.5s ease;
  opacity: 0;
  animation: cardReveal 0.5s ease both;
}
.track-card:nth-child(1) { animation-delay:0.05s }
.track-card:nth-child(2) { animation-delay:0.10s }
.track-card:nth-child(3) { animation-delay:0.15s }
.track-card:nth-child(4) { animation-delay:0.20s }
.track-card:nth-child(5) { animation-delay:0.25s }
.track-card:nth-child(6) { animation-delay:0.30s }
.track-card:nth-child(7) { animation-delay:0.35s }
.track-card:nth-child(8) { animation-delay:0.40s }

.track-card::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  opacity:0; transition:opacity 0.3s; z-index:3;
}

.track-card:hover {
  transform: translateY(-10px) scale(1.03);
  border-color: rgba(255,255,255,0.2);
  box-shadow: 0 40px 80px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.1);
}
.track-card:hover::before { opacity:1; }

.track-card::after {
  content:'';
  position:absolute; inset:0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%);
  background-size:200% 100%; opacity:0; z-index:2;
  transition: opacity 0.3s;
}
.track-card:hover::after { opacity:1; animation:shimmer 1.8s ease infinite; }

.card-img-wrap {
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
  background: var(--surface);
}
.card-img-placeholder {
  color: rgba(255,255,255,0.06);
  font-size:44px;
  animation: rotateSlow 6s linear infinite;
}
.card-img {
  position:absolute; inset:0;
  width:100%; height:100%;
  object-fit:cover; opacity:0;
  transition: opacity 0.5s ease;
}

.card-play-overlay {
  position:absolute; inset:0;
  background:rgba(0,0,0,0);
  display:flex; align-items:center; justify-content:center;
  z-index:3; transition:background 0.3s;
}
.card-play-btn {
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
.track-card:hover .card-play-overlay { background:rgba(0,0,0,0.35); }
.track-card:hover .card-play-btn     { opacity:1; transform:scale(1); }

.track-overlay {
  position:absolute; bottom:0; left:0; right:0;
  background: linear-gradient(transparent, rgba(0,0,0,0.96) 40%);
  padding: 28px 14px 14px;
  z-index:4;
}
.track-title {
  font-size:13px; font-weight:400;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  margin-bottom:4px; letter-spacing:0.02em;
  background: var(--grad-text);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 8s ease infinite;
}
.track-artist {
  font-size:10px; font-weight:200;
  letter-spacing:0.1em;
  color: var(--ink-faint);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ── Player bar ───────────────────────────────────── */
.player-bar {
  position:fixed; bottom:0; left:0; right:0;
  height:90px;
  background: rgba(0,0,0,0.92);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-top: 0.5px solid var(--border);
  padding: 0 3%;
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:center; gap:20px;
  z-index:1000;
  animation: playerIn 0.6s ease 1s both;
  overflow:hidden;
}
.player-bar::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 20%, transparent 80%);
}
.player-bar::after {
  content:'';
  position:absolute; top:-50px; left:15%; right:15%; height:50px;
  background: linear-gradient(to top, rgba(255,255,255,0.02), transparent);
  pointer-events:none;
}

.now-playing { display:flex; align-items:center; gap:14px; min-width:0; }

.art-wrap { position:relative; flex-shrink:0; width:52px; height:52px; }
.art-ring {
  position:absolute; inset:-6px; border-radius:50%;
  border:1px solid transparent;
  background: conic-gradient(from 0deg, rgba(255,255,255,0.6), transparent 60%) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  animation: rotateSlow 4s linear infinite;
  opacity:0; transition:opacity 0.3s;
}
.art-wrap.playing .art-ring { opacity:1; }

#current-art {
  width:52px; height:52px;
  border-radius:50%;
  object-fit:cover;
  border: 0.5px solid rgba(255,255,255,0.15);
  transition: border-color 0.3s;
}
.art-wrap.playing #current-art { animation: rotateSlow 10s linear infinite; }

.now-playing-text { min-width:0; }
#now-playing-title {
  font-weight:400; font-size:13px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  margin-bottom:2px;
  background: var(--grad-text);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: textGrad 8s ease infinite;
}
#now-playing-artist {
  font-size:10px; font-weight:200;
  letter-spacing:0.08em;
  color: var(--ink-faint);
}
#status-msg {
  font-size:9px; font-weight:200;
  letter-spacing:0.12em;
  color: var(--ink-dim);
  display:flex; align-items:center; gap:6px;
  margin-top:4px;
}
#status-msg::before {
  content:''; width:4px; height:4px;
  border-radius:50%;
  background: rgba(255,255,255,0.5);
  box-shadow: 0 0 6px rgba(255,255,255,0.4);
  animation: markerBlink 2s infinite;
}

#fav-btn {
  font-size:17px; cursor:pointer;
  color: var(--ink-faint);
  transition: all 0.3s var(--spring);
  flex-shrink:0; padding:6px;
}
#fav-btn.active { color:#fff; transform:scale(1.3); filter:drop-shadow(0 0 8px rgba(255,255,255,0.5)); }

/* Player center */
.player-center {
  display:flex; flex-direction:column; align-items:center; gap:10px;
  width:460px;
}
.controls { display:flex; align-items:center; gap:8px; }

.control-btn {
  background:none; border:none;
  color: var(--ink-faint);
  font-size:19px; cursor:pointer;
  width:36px; height:36px;
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  transition: all 0.25s ease;
}
.control-btn:hover { color:#fff; background:rgba(255,255,255,0.06); transform:scale(1.1); }

.play-btn {
  width:44px; height:44px;
  border-radius:50%;
  background: rgba(255,255,255,0.92) !important;
  color:#000 !important;
  font-size:17px !important;
  box-shadow: 0 8px 32px rgba(255,255,255,0.15);
  transition: all 0.3s var(--spring) !important;
}
.play-btn:hover {
  transform:scale(1.12) !important;
  background:#fff !important;
  box-shadow: 0 12px 40px rgba(255,255,255,0.25) !important;
}

.progress-wrap {
  position:relative; width:100%; height:20px;
  display:flex; align-items:center;
}
.squiggly-svg {
  position:absolute; width:100%; height:100%;
  fill:none; stroke:rgba(255,255,255,0.4); stroke-width:2; stroke-linecap:round;
  pointer-events:none; overflow:visible;
}
.progress-track {
  position:absolute; width:100%; height:1.5px;
  background:rgba(255,255,255,0.08); border-radius:1px; overflow:hidden;
}
.progress-track::after {
  content:'';
  position:absolute; inset:0;
  background: linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3));
  transform-origin:left; transform:scaleX(0); transition:transform 0.1s;
}
#seek-slider {
  position:absolute; width:100%; top:0; left:0;
  cursor:pointer; opacity:0; z-index:5; height:100%;
}

/* Player right */
.player-right {
  display:flex; align-items:center; justify-content:flex-end; gap:16px;
}
.tunnel-badge {
  font-size:9px; font-weight:200;
  letter-spacing:0.18em;
  color: var(--ink-faint);
  background: rgba(255,255,255,0.03);
  border: 0.5px solid var(--border);
  padding: 4px 12px;
  border-radius:4px;
  text-transform:uppercase;
}

.player-eq { display:flex; align-items:flex-end; gap:2px; height:16px; }
.player-eq .eq-bar { width:2px; background:rgba(255,255,255,0.4); }

/* ── Skeleton ─────────────────────────────────────── */
.skeleton {
  flex:0 0 200px; aspect-ratio:1/1;
  border-radius:16px;
  background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
  background-size:400% 100%;
  animation: shimmer 1.8s ease infinite;
}

/* ── Panel system ─────────────────────────────────── */
.panel-backdrop {
  position:fixed; inset:0;
  background:rgba(0,0,0,0.65);
  backdrop-filter:blur(20px) saturate(160%);
  z-index:900; opacity:0; pointer-events:none;
  transition: opacity 0.35s ease;
}
.panel-backdrop.visible { opacity:1; pointer-events:all; }

.side-panel {
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
.side-panel.open { transform:translateY(0); opacity:1; pointer-events:all; }
.side-panel::before {
  content:'';
  position:absolute; top:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.2), transparent 70%);
}

.panel-tabs { display:flex; border-bottom:0.5px solid var(--border); flex-shrink:0; }
.panel-tab {
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
.panel-tab::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:0.5px; background:#fff;
  transform:scaleX(0); transition:transform 0.25s ease;
}
.panel-tab.active { color:#fff; }
.panel-tab.active::after { transform:scaleX(1); }
.panel-tab:hover:not(.active) { color:var(--ink-dim); background:rgba(255,255,255,0.02); }
.panel-tab .count-badge {
  background:rgba(255,255,255,0.06);
  border: 0.5px solid rgba(255,255,255,0.12);
  color: var(--ink-dim);
  font-size:9px; padding:1px 7px;
  border-radius:999px; min-width:20px; text-align:center;
  animation: badgeIn 0.3s ease both;
}

.panel-header {
  padding:16px 18px 12px;
  display:flex; align-items:center; gap:10px;
  flex-shrink:0; border-bottom:0.5px solid var(--border);
}
.panel-header-title {
  font-family: var(--ff-display);
  font-size:22px; font-weight:300;
  letter-spacing:0.04em; flex:1;
  background: var(--grad-shimmer);
  background-size:300% 300%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation: textGrad 8s ease infinite;
}
.panel-header-sub {
  font-size:9px; font-weight:200;
  letter-spacing:0.12em; color:var(--ink-faint); margin-top:2px;
}
.panel-action-btn {
  width:28px; height:28px; border-radius:8px;
  background:none; border:0.5px solid var(--border);
  color:var(--ink-faint); font-size:11px;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all 0.2s ease;
}
.panel-action-btn:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.05); }
.panel-action-btn.danger:hover { color:#ff8080; border-color:rgba(255,128,128,0.3); background:rgba(255,128,128,0.06); }

.panel-body { flex:1; overflow-y:auto; padding:8px 0; }
.panel-body::-webkit-scrollbar { width:2px; }
.panel-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); }

.tab-pane { display:none; flex-direction:column; height:100%; }
.tab-pane.active { display:flex; }

.track-row {
  display:flex; align-items:center; gap:12px;
  padding:10px 18px; cursor:pointer;
  transition:background 0.2s ease;
  position:relative;
  animation: rowIn 0.3s ease both;
}
.track-row:hover { background:rgba(255,255,255,0.025); }
.track-row.playing { background:rgba(255,255,255,0.04); }
.track-row.playing::before {
  content:''; position:absolute; left:0; top:0; bottom:0;
  width:1.5px; background:#fff;
  box-shadow: 0 0 8px rgba(255,255,255,0.4);
}

.track-row-num {
  font-size:10px; font-weight:200;
  letter-spacing:0.08em;
  color:var(--ink-faint); width:18px; text-align:right; flex-shrink:0;
}
.track-row.playing .track-row-num { display:none; }
.track-row-eq {
  display:none; width:18px; flex-shrink:0;
  align-items:flex-end; justify-content:center; gap:2px; height:14px;
}
.track-row.playing .track-row-eq { display:flex; }
.track-row-eq .eq-bar { width:2px; background:rgba(255,255,255,0.5); box-shadow:none; }

.track-row-thumb {
  width:40px; height:40px; border-radius:8px;
  background:var(--surface3); object-fit:cover; flex-shrink:0;
  border:0.5px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; font-size:15px; color:var(--ink-faint);
}
.track-row-thumb img { width:100%; height:100%; object-fit:cover; }

.track-row-info { flex:1; min-width:0; }
.track-row-title {
  font-size:12px; font-weight:400;
  color:var(--ink);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;
}
.track-row.playing .track-row-title {
  background: var(--grad-text); background-size:200% 200%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation: textGrad 8s ease infinite;
}
.track-row-artist {
  font-size:10px; font-weight:200;
  letter-spacing:0.06em; color:var(--ink-faint);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

.track-row-actions { display:flex; gap:4px; opacity:0; transition:opacity 0.2s; flex-shrink:0; }
.track-row:hover .track-row-actions { opacity:1; }
.row-icon-btn {
  width:24px; height:24px; border-radius:6px;
  background:none; border:0.5px solid var(--border);
  color:var(--ink-faint); font-size:10px;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all 0.2s;
}
.row-icon-btn:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.05); }
.row-icon-btn.remove:hover { color:#ff8080; border-color:rgba(255,128,128,0.3); background:rgba(255,128,128,0.05); }

.panel-empty {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  flex:1; gap:10px; padding:40px 20px; text-align:center;
}
.panel-empty-icon { font-size:32px; color:var(--ink-faint); margin-bottom:4px; }
.panel-empty h4 {
  font-family:var(--ff-display); font-size:22px; font-weight:300;
  letter-spacing:0.04em; color:var(--ink-faint);
}
.panel-empty p { font-size:10px; font-weight:200; letter-spacing:0.08em; color:var(--ink-faint); line-height:1.8; }

.queue-section-label {
  font-size:9px; font-weight:200;
  letter-spacing:0.25em; color:var(--ink-faint);
  text-transform:uppercase;
  padding:12px 18px 6px;
  display:flex; align-items:center; gap:10px;
}
.queue-section-label::after { content:''; flex:1; height:0.5px; background:var(--border); }

.panel-footer {
  padding:12px 18px; border-top:0.5px solid var(--border);
  display:flex; gap:8px; flex-shrink:0;
}
.panel-footer-btn {
  flex:1; padding:10px;
  border-radius:999px;
  font-family:var(--ff-body); font-size:9px;
  font-weight:300; letter-spacing:0.15em;
  cursor:pointer; border:0.5px solid var(--border);
  transition:all 0.2s;
  display:flex; align-items:center; justify-content:center; gap:6px;
}
.panel-footer-btn.primary {
  background:rgba(255,255,255,0.9); color:#000; border-color:rgba(255,255,255,0.9); font-weight:400;
}
.panel-footer-btn.primary:hover { background:#fff; box-shadow:0 8px 32px rgba(255,255,255,0.12); }
.panel-footer-btn.ghost { background:none; color:var(--ink-faint); }
.panel-footer-btn.ghost:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.04); }

.player-panel-btns { display:flex; gap:8px; align-items:center; }
.player-panel-btn {
  display:flex; align-items:center; gap:6px;
  padding:7px 14px; border-radius:999px;
  background:none; border:0.5px solid var(--border);
  color:var(--ink-faint);
  font-family:var(--ff-body); font-size:9px;
  font-weight:300; letter-spacing:0.15em; cursor:pointer;
  transition:all 0.25s ease; position:relative;
}
.player-panel-btn:hover { color:#fff; border-color:var(--border-h); background:rgba(255,255,255,0.04); }
.player-panel-btn.active { color:#fff; border-color:rgba(255,255,255,0.3); background:rgba(255,255,255,0.06); }
.player-panel-btn .btn-badge {
  position:absolute; top:-6px; right:-6px;
  background:rgba(255,255,255,0.9); color:#000;
  font-size:8px; font-weight:700;
  width:16px; height:16px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  animation: badgeIn 0.3s ease;
}

/* ── Toast ────────────────────────────────────────── */
.toast-container {
  position:fixed; bottom:110px; right:20px;
  z-index:1000; display:flex; flex-direction:column; gap:8px;
  pointer-events:none;
}
.toast {
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
.toast i { color:rgba(255,255,255,0.6); font-size:12px; }
.toast.removing { animation:toastOut 0.3s ease forwards; }
.skip-btn { font-size:18px !important; }
        </style>
        <canvas id="pipCanvas" width="500" height="500" style="display:none;"></canvas>
<video id="pipVideo" muted autoplay playsinline style="display:none;"></video>
<div class="scanline"></div>

<!-- HEADER -->
<header id="site-header">
    <div class="header-brand"><i class="fa-solid fa-music"></i> CODELISTENER</div>
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

    <!-- Decorative spinning disc -->
    <div class="hero-disc">
        <div class="disc-ring"></div>
        <div class="disc-ring"></div>
        <div class="disc-outer">
            <div class="disc-inner">
                <div class="disc-core"></div>
            </div>
        </div>
    </div>

    <div class="hero-content">
        <div class="hero-label">
            <span class="live-dot"></span>
            ENCRYPTED TUNNEL ACTIVE
        </div>
        <h1>
            <span class="line"><span>MUSIC</span></span>
            <span class="line"><span>PLAYER</span></span>
        </h1>
        <p class="hero-sub">Private streaming · Background playback · No limits</p>

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
        <span class="row-label">Live Charts</span>
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

<!-- PLAYER BAR -->
<div class="player-bar">
    <!-- Now Playing -->
    <div class="now-playing">
        <div class="art-wrap" id="art-wrap">
            <div class="art-ring"></div>
            <img id="current-art" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEn3YltX7Cs7W7IrAxFTyWw-nmFg03UolfHg&s">
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
        <div class="tunnel-badge">TUNNEL v2.5</div>
    </div>
</div>

<audio id="mainAudio"></audio>
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
