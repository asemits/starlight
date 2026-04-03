(function () {
	const CDN_BASE = "https://cdn.jsdelivr.net/gh/PopAnynomous234/Goodboy@main/";
	const PAGE_SIZE = 18;

	const state = {
		mountSelector: "#games-root",
		games: [],
		ready: false,
		search: "",
		page: 1,
		letter: "A",
		popularIndex: 0,
		statsCache: new Map(),
		activeGame: null,
		overlayCleanup: null
	};

	async function ensureAuthReady() {
		if (!window.starlightAuth) {
			return false;
		}

		if (window.starlightAuth.currentUser) {
			return true;
		}

		if (window.starlightAuthReady) {
			try {
				await window.starlightAuthReady;
			} catch (_err) {
				return false;
			}
		}

		return Boolean(window.starlightAuth.currentUser);
	}

	function getPaginationMode() {
		const mode = localStorage.getItem("games-pagination-mode");
		return mode === "alphabetical" ? "alphabetical" : "numbered";
	}

	function escapeHtml(value) {
		return String(value)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#39;");
	}

	function pathToDocId(path) {
		return btoa(unescape(encodeURIComponent(path))).replace(/=+$/g, "");
	}

	function statRefs(path) {
		if (!window.starlightDb) {
			return null;
		}
		const uid = window.starlightAuth && window.starlightAuth.currentUser ? window.starlightAuth.currentUser.uid : null;
		if (!uid) {
			return null;
		}
		const db = window.starlightDb;
		const gameId = pathToDocId(path);
		return {
			gameId,
			statsRef: db.collection("gameStats").doc(gameId),
			playerRef: db.collection("gameStats").doc(gameId).collection("players").doc(uid)
		};
	}

	function filenameToName(filename) {
		const base = filename.replace(/\.[^/.]+$/, "");
		return decodeURIComponent(base).replaceAll("_", " ").trim();
	}

	function defaultTypeFromName(name) {
		const lower = name.toLowerCase();
		if (lower.includes("fifa") || lower.includes("soccer") || lower.includes("basket") || lower.includes("football") || lower.includes("baseball")) {
			return "Sports";
		}
		if (lower.includes("fnaf") || lower.includes("granny") || lower.includes("horror")) {
			return "Horror";
		}
		if (lower.includes("mario") || lower.includes("vex") || lower.includes("platform")) {
			return "Platformer";
		}
		if (lower.includes("drift") || lower.includes("moto") || lower.includes("racer") || lower.includes("race")) {
			return "Racing";
		}
		if (lower.includes("puzzle") || lower.includes("2048")) {
			return "Puzzle";
		}
		if (lower.includes("doom") || lower.includes("strike") || lower.includes("shooter") || lower.includes("cod")) {
			return "Shooter";
		}
		return "Action";
	}

	async function loadGames() {
    if (state.ready) return;

   if (!window.GAMES_LIST) {
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const isDev = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
        script.src = isDev ? '/public/gameslist.js' : '/gameslist.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
const list = window.GAMES_LIST;

state.games = list.map(g => ({
    name: g.title,
    path: g.url,
    type: '',
    image: g.image || ''
})).sort((a, b) => a.name.localeCompare(b.name));

    state.ready = true;
}
	function getPopularGames() {
		const pinned = ["UGS Library (1,700 Games)", "1v1 LOL", "Geometry Dash", "Retro Bowl", "Basketball Stars", "Subway Surfers"];
		const byName = new Map(state.games.map((game) => [game.name, game]));
		const selected = [];

		for (const name of pinned) {
			if (byName.has(name)) {
				selected.push(byName.get(name));
			}
		}

		if (selected.length < 6) {
			for (const game of state.games) {
				if (!selected.find((item) => item.path === game.path)) {
					selected.push(game);
				}
				if (selected.length >= 6) {
					break;
				}
			}
		}

		return selected;
	}

	function firstLetter(name) {
		const first = name.trim().charAt(0).toUpperCase();
		return /[A-Z]/.test(first) ? first : "#";
	}

	function currentFilteredGames() {
		const query = state.search.trim().toLowerCase();
		let list = state.games;
		if (query) {
			list = list.filter((game) => game.name.toLowerCase().includes(query) || game.type.toLowerCase().includes(query));
		}

		if (getPaginationMode() === "alphabetical") {
			return list.filter((game) => firstLetter(game.name) === state.letter);
		}

		return list;
	}

	function getVisibleGames() {
		const list = currentFilteredGames();
		if (getPaginationMode() === "alphabetical") {
			return list;
		}
		const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
		if (state.page > pageCount) {
			state.page = pageCount;
		}
		const start = (state.page - 1) * PAGE_SIZE;
		return list.slice(start, start + PAGE_SIZE);
	}

	function statsForPath(path) {
		return state.statsCache.get(path) || { plays: 0, uniqueClicks: 0, thumbsUp: 0, thumbsDown: 0, myRating: 0 };
	}

function createGameRunnerUrl(gamePath) {
    const isDev = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const base = isDev ? '/public/game-runner.html' : '/game-runner.html';
    const url = new URL(base, window.location.origin);
    url.searchParams.set('path', gamePath);
    return url.toString();
}

	async function ensureStats(paths) {
		const authReady = await ensureAuthReady();
		if (!authReady) {
			return;
		}

		const refs = paths
			.filter((path) => !state.statsCache.has(path))
			.map((path) => ({ path, refs: statRefs(path) }))
			.filter((item) => item.refs);

		await Promise.all(
			refs.map(async (item) => {
				try {
					const [statsDoc, playerDoc] = await Promise.all([item.refs.statsRef.get(), item.refs.playerRef.get()]);
					const stats = statsDoc.exists ? statsDoc.data() : {};
					const player = playerDoc.exists ? playerDoc.data() : {};
					state.statsCache.set(item.path, {
						plays: Number(stats.plays || 0),
						uniqueClicks: Number(stats.uniqueClicks || 0),
						thumbsUp: Number(stats.thumbsUp || 0),
						thumbsDown: Number(stats.thumbsDown || 0),
						myRating: Number(player.rating || 0)
					});
				} catch (_err) {
					state.statsCache.set(item.path, { plays: 0, uniqueClicks: 0, thumbsUp: 0, thumbsDown: 0, myRating: 0 });
				}
			})
		);
	}

	async function trackPlay(game) {
		const authReady = await ensureAuthReady();
		if (!authReady) {
			return;
		}

		const refs = statRefs(game.path);
		if (!refs) {
			return;
		}
		const { statsRef, playerRef } = refs;
		await window.starlightDb.runTransaction(async (tx) => {
			const [statsDoc, playerDoc] = await Promise.all([tx.get(statsRef), tx.get(playerRef)]);
			const increment = firebase.firestore.FieldValue.increment;
			const now = firebase.firestore.FieldValue.serverTimestamp();
			const isFirstClick = !playerDoc.exists;

			if (!statsDoc.exists) {
				tx.set(statsRef, {
					name: game.name,
					path: game.path,
					image: game.image,
					type: game.type,
					plays: 0,
					uniqueClicks: 0,
					thumbsUp: 0,
					thumbsDown: 0,
					updatedAt: now
				}, { merge: true });
			}

			tx.set(statsRef, {
				plays: increment(1),
				uniqueClicks: increment(isFirstClick ? 1 : 0),
				updatedAt: now
			}, { merge: true });

			tx.set(playerRef, {
				rating: playerDoc.exists ? Number(playerDoc.data().rating || 0) : 0,
				lastPlayedAt: now,
				clickCount: increment(1)
			}, { merge: true });
		});
	}

	async function setRating(game, rating) {
		const authReady = await ensureAuthReady();
		if (!authReady) {
			return;
		}

		const refs = statRefs(game.path);
		if (!refs) {
			return;
		}
		const { statsRef, playerRef } = refs;
		await window.starlightDb.runTransaction(async (tx) => {
			const [statsDoc, playerDoc] = await Promise.all([tx.get(statsRef), tx.get(playerRef)]);
			const now = firebase.firestore.FieldValue.serverTimestamp();
			const oldRating = playerDoc.exists ? Number(playerDoc.data().rating || 0) : 0;
			const nextRating = Number(rating);

			if (oldRating === nextRating) {
				return;
			}

			if (!statsDoc.exists) {
				tx.set(statsRef, {
					name: game.name,
					path: game.path,
					image: game.image,
					type: game.type,
					plays: 0,
					uniqueClicks: 0,
					thumbsUp: 0,
					thumbsDown: 0,
					updatedAt: now
				}, { merge: true });
			}

			const thumbsUpDelta = (nextRating === 1 ? 1 : 0) - (oldRating === 1 ? 1 : 0);
			const thumbsDownDelta = (nextRating === -1 ? 1 : 0) - (oldRating === -1 ? 1 : 0);
			const increment = firebase.firestore.FieldValue.increment;

			tx.set(statsRef, {
				thumbsUp: increment(thumbsUpDelta),
				thumbsDown: increment(thumbsDownDelta),
				updatedAt: now
			}, { merge: true });

			tx.set(playerRef, {
				rating: nextRating,
				lastRatedAt: now
			}, { merge: true });
		});

		const prev = statsForPath(game.path);
		state.statsCache.set(game.path, {
			...prev,
			thumbsUp: prev.thumbsUp + ((rating === 1 ? 1 : 0) - (prev.myRating === 1 ? 1 : 0)),
			thumbsDown: prev.thumbsDown + ((rating === -1 ? 1 : 0) - (prev.myRating === -1 ? 1 : 0)),
			myRating: rating
		});
	}

	function paginationMarkup(totalCount) {
		if (getPaginationMode() === "alphabetical") {
			const letters = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
			return `
				<div class="games-alpha-nav">
					${letters
						.map((letter) => `<button type="button" class="games-page-btn ${state.letter === letter ? "active" : ""}" data-letter="${letter}">${letter}</button>`)
						.join("")}
				</div>
			`;
		}

		const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
		const pages = [];
		for (let i = 1; i <= pageCount; i += 1) {
			pages.push(`<button type="button" class="games-page-btn ${state.page === i ? "active" : ""}" data-page="${i}">${i}</button>`);
		}
		return `<div class="games-page-nav">${pages.join("")}</div>`;
	}

	function gameCardMarkup(game) {
		const stats = statsForPath(game.path);
        const image = game.image || "";
		return `
			<article class="game-card" data-path="${escapeHtml(game.path)}">
				<div class="game-thumb-wrap">
					${image ? `<img class="game-thumb" src="${image}" alt="${escapeHtml(game.name)}">` : `<div class="game-thumb placeholder">Game Thumbnail</div>`}
				</div>
				<h3 class="game-name">${escapeHtml(game.name)}</h3>
				<p class="game-type">${escapeHtml(game.type)}</p>
				<div class="game-card-actions">
					<button type="button" class="rate-btn ${stats.myRating === 1 ? "active" : ""}" data-path="${escapeHtml(game.path)}" data-rate="1"><i class="fa-solid fa-thumbs-up"></i> ${stats.thumbsUp}</button>
					<button type="button" class="rate-btn ${stats.myRating === -1 ? "active" : ""}" data-path="${escapeHtml(game.path)}" data-rate="-1"><i class="fa-solid fa-thumbs-down"></i> ${stats.thumbsDown}</button>
				</div>
			</article>
		`;
	}

	function renderMarkup() {
		const popularGames = getPopularGames();
		const visiblePopular = popularGames.slice(state.popularIndex, state.popularIndex + 3);
		while (visiblePopular.length < 3 && popularGames.length) {
			visiblePopular.push(popularGames[(visiblePopular.length + state.popularIndex) % popularGames.length]);
		}

		const allFiltered = currentFilteredGames();
		const visibleGames = getVisibleGames();
		const heroGame = popularGames[0] || state.games[0];
		const heroImage = heroGame?.image || "";

		return `
			<style>
.games-page {
  --ink: rgba(255,255,255,0.85);
  --ink-dim: rgba(255,255,255,0.4);
  --ink-faint: rgba(255,255,255,0.15);
  --glass: rgba(255,255,255,0.04);
  --glass-mid: rgba(255,255,255,0.07);
  --glass-hover: rgba(255,255,255,0.09);
  --border: rgba(255,255,255,0.1);
  --border-hover: rgba(255,255,255,0.22);
  --spring: cubic-bezier(0.16, 1, 0.3, 1);
  --shadow-deep: 0 40px 80px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6);
  font-family: 'Geist', 'Oxanium', 'Montserrat', sans-serif;
  color: var(--ink);
}

/* ── Hero ─────────────────────────────────────────── */
.games-hero {
  border-radius: 32px;
  padding: 3px;
  margin-bottom: 30px;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03), rgba(255,255,255,0.08));
  animation: sectionReveal 0.8s var(--spring) forwards;
  opacity: 0;
}

.games-hero-card {
  max-width: 1040px;
  margin: 0 auto;
  border-radius: 30px;
  background: var(--glass);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  padding: 28px 28px 20px;
  position: relative;
  overflow: hidden;
}

.games-hero-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
}

.games-hero-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%);
  pointer-events: none;
}

.games-hero-thumb {
  width: 100%;
  max-height: 480px;
  object-fit: cover;
  border-radius: 20px;
  aspect-ratio: 16/9;
  background: #000;
  display: block;
  box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.08);
  transition: transform 0.6s var(--spring), box-shadow 0.6s ease;
}

.games-hero-thumb:hover {
  transform: scale(1.01);
  box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.15);
}

.games-hero-name {
  text-align: center;
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 200;
  letter-spacing: 0.06em;
  margin-top: 18px;
  color: var(--ink);
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  text-shadow: 0 0 60px rgba(255,255,255,0.15);
}

/* ── Section reveal ───────────────────────────────── */
@keyframes sectionReveal {
  0%   { opacity: 0; transform: translateY(28px); filter: blur(6px); }
  60%  { filter: blur(0); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes cardIn {
  0%   { opacity: 0; transform: translateY(24px) scale(0.96); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

@keyframes scanline {
  0%   { transform: translateY(-100%); opacity: 1; }
  100% { transform: translateY(400%); opacity: 0; }
}

@keyframes shimmerEdge {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 1; }
}

/* ── Popular ──────────────────────────────────────── */
.games-popular {
  border-radius: 28px;
  padding: 3px;
  margin-bottom: 26px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
  opacity: 0;
  animation: sectionReveal 0.8s 0.15s var(--spring) forwards;
}

.games-popular-inner {
  border-radius: 26px;
  background: var(--glass);
  backdrop-filter: blur(32px) saturate(160%);
  -webkit-backdrop-filter: blur(32px) saturate(160%);
  padding: 28px;
  position: relative;
  overflow: hidden;
}

.games-popular-inner::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}

.games-popular-title {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: clamp(24px, 3.5vw, 38px);
  font-weight: 300;
  letter-spacing: 0.08em;
  margin: 0 0 20px;
  color: var(--ink);
  text-transform: uppercase;
}

.games-popular-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.games-slide-btn {
  flex: 0 0 36px;
  height: 240px;
  border-radius: 12px;
  border: 0.5px solid var(--border);
  background: var(--glass-mid);
  backdrop-filter: blur(12px);
  color: rgba(255,255,255,0.5);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s var(--spring);
}

.games-slide-btn:hover {
  background: var(--glass-hover);
  border-color: var(--border-hover);
  color: #fff;
  transform: scale(1.05);
}

.games-popular-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  width: 100%;
}

/* ── Popular card ─────────────────────────────────── */
.game-pop-card {
  border-radius: 20px;
  padding: 3px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
  cursor: pointer;
  transition: transform 0.5s var(--spring), box-shadow 0.5s ease;
  position: relative;
  opacity: 0;
  animation: cardIn 0.6s var(--spring) forwards;
}

.game-pop-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-deep), 0 0 0 0.5px rgba(255,255,255,0.15);
}

.game-pop-card-inner {
  border-radius: 18px;
  background: var(--glass-mid);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  padding: 12px 12px 10px;
  overflow: hidden;
  position: relative;
}

.game-pop-card-inner::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
}

.game-pop-card-inner::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
  transform: translateY(-100%);
  pointer-events: none;
  z-index: 2;
}

.game-pop-card:hover .game-pop-card-inner::after {
  animation: scanline 0.75s var(--spring) forwards;
}

.game-pop-thumb {
  width: 100%;
  aspect-ratio: 16/10;
  object-fit: cover;
  border-radius: 12px;
  background: #000;
  display: block;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  transition: transform 0.5s var(--spring), box-shadow 0.4s ease;
}

.game-pop-card:hover .game-pop-thumb {
  transform: scale(1.03);
  box-shadow: 0 16px 40px rgba(0,0,0,0.8);
}

.game-pop-name {
  text-align: center;
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: clamp(18px, 2.5vw, 28px);
  font-weight: 300;
  letter-spacing: 0.04em;
  margin: 10px 0 4px;
  color: var(--ink);
  transition: text-shadow 0.3s ease;
}

.game-pop-card:hover .game-pop-name {
  text-shadow: 0 0 24px rgba(255,255,255,0.3);
}

/* ── Toolbar ──────────────────────────────────────── */
.games-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  opacity: 0;
  animation: sectionReveal 0.7s 0.25s var(--spring) forwards;
}

.games-search {
  width: 280px;
  max-width: 100%;
  border-radius: 999px;
  border: 0.5px solid var(--border);
  background: var(--glass-mid);
  backdrop-filter: blur(20px);
  color: #fff;
  padding: 10px 18px;
  font-size: 12px;
  letter-spacing: 0.08em;
  font-family: inherit;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
}

.games-search::placeholder { color: var(--ink-dim); }

.games-search:focus {
  border-color: rgba(255,255,255,0.3);
  background: var(--glass-hover);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4);
}

/* ── Game card grid ───────────────────────────────── */
.games-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  opacity: 0;
  animation: sectionReveal 0.8s 0.3s var(--spring) forwards;
}

.game-card {
  border-radius: 3px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02), rgba(255,255,255,0.06));
  cursor: pointer;
  position: relative;
  opacity: 0;
  animation: cardIn 0.5s var(--spring) forwards;
  transition: transform 0.5s var(--spring), box-shadow 0.5s ease;
}

.game-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: var(--shadow-deep), 0 0 0 0.5px rgba(255,255,255,0.18);
}

.game-card-inner {
  border-radius: 2px;
  background: rgba(12,12,12,0.85);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  padding: 10px;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.game-card-inner::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}

.game-card-inner::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
  transform: translateY(-100%);
  pointer-events: none;
  z-index: 2;
}

.game-card:hover .game-card-inner::after {
  animation: scanline 0.65s var(--spring) forwards;
}

.game-thumb-wrap {
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  position: relative;
}

.game-thumb {
  width: 100%;
  height: 130px;
  object-fit: cover;
  display: block;
  transition: transform 0.5s var(--spring);
}

.game-card:hover .game-thumb {
  transform: scale(1.06);
}

.game-thumb.placeholder {
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-faint);
  font-size: 32px;
}

/* Bottom glow bar */
.game-card .glow-bar {
  position: absolute;
  bottom: 0; left: 20%; right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  opacity: 0;
  transition: opacity 0.4s ease, left 0.4s var(--spring), right 0.4s var(--spring);
  border-radius: 1px;
}

.game-card:hover .glow-bar {
  opacity: 1;
  left: 5%;
  right: 5%;
}

/* Corner accents */
.game-card .corner-tr {
  position: absolute;
  top: 10px; right: 10px;
  width: 8px; height: 8px;
  border-top: 0.5px solid rgba(255,255,255,0.25);
  border-right: 0.5px solid rgba(255,255,255,0.25);
  border-radius: 0 3px 0 0;
  transition: width 0.4s var(--spring), height 0.4s var(--spring), border-color 0.3s ease;
  z-index: 3;
}

.game-card:hover .corner-tr {
  width: 14px; height: 14px;
  border-color: rgba(255,255,255,0.6);
}

.game-name {
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.08em;
  margin: 10px 0 3px;
  color: var(--ink);
  line-height: 1.3;
  transition: text-shadow 0.3s ease;
}

.game-card:hover .game-name {
  text-shadow: 0 0 16px rgba(255,255,255,0.25);
}

.game-type {
  font-size: 10px;
  opacity: .45;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin: 0;
  font-weight: 300;
}

.game-card-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.rate-btn {
  border: 0.5px solid var(--border);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--glass);
  backdrop-filter: blur(8px);
  color: var(--ink-dim);
  cursor: pointer;
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
  font-family: inherit;
}

.rate-btn:hover {
  background: var(--glass-mid);
  border-color: var(--border-hover);
  color: var(--ink);
  transform: translateY(-1px);
}

.rate-btn.active {
  background: rgba(255,255,255,0.9);
  border-color: rgba(255,255,255,0.9);
  color: #000;
}

/* ── Pagination ───────────────────────────────────── */
.games-page-nav,
.games-alpha-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 20px;
}

.games-page-btn {
  border: 0.5px solid var(--border);
  border-radius: 999px;
  background: var(--glass);
  backdrop-filter: blur(8px);
  color: var(--ink-dim);
  padding: 6px 14px;
  min-width: 36px;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.2s var(--spring);
}

.games-page-btn:hover {
  background: var(--glass-hover);
  border-color: var(--border-hover);
  color: var(--ink);
  transform: translateY(-2px);
}

.games-page-btn.active {
  background: rgba(255,255,255,0.9);
  border-color: rgba(255,255,255,0.9);
  color: #000;
}

/* ── Game overlay ─────────────────────────────────── */
.game-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.96);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  animation: overlayIn 0.5s var(--spring) forwards;
}

@keyframes overlayIn {
  0%   { opacity: 0; transform: scale(0.98); }
  100% { opacity: 1; transform: scale(1); }
}

.game-frame-wrap { flex: 1; min-height: 0; }

.game-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #000;
}

.game-bottom-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 0.5px solid var(--border);
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(24px);
}

.bar-left, .bar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.bar-btn {
  border: 0.5px solid var(--border);
  background: var(--glass-mid);
  backdrop-filter: blur(12px);
  color: var(--ink);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.3s ease, border-color 0.3s ease, transform 0.2s var(--spring);
}

.bar-btn:hover {
  background: var(--glass-hover);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.bar-stats {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--ink-dim);
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 900px) {
  .games-hero { border-radius: 20px; padding: 2px; }
  .games-hero-card { border-radius: 18px; padding: 14px; }
  .games-hero-thumb { border-radius: 12px; }
  .games-hero-name { font-size: 28px; }
  .games-popular { border-radius: 18px; }
  .games-popular-inner { border-radius: 16px; padding: 16px; }
  .games-popular-title { font-size: 22px; }
  .games-slide-btn { height: 180px; }
  .game-pop-card { border-radius: 14px; }
  .game-pop-card-inner { border-radius: 12px; }
  .game-pop-thumb { border-radius: 8px; }
  .game-pop-name { font-size: 18px; }
  .games-popular-grid { grid-template-columns: 1fr; }
}
			</style>
			<section class="games-page">
				<section class="games-hero">
					<article class="games-hero-card game-open-trigger" data-path="${heroGame ? escapeHtml(heroGame.path) : ""}">
						${heroImage ? `<img src="${heroImage}" class="games-hero-thumb" alt="${heroGame ? escapeHtml(heroGame.name) : "Featured Game"}">` : `<div class="games-hero-thumb"></div>`}
						<h2 class="games-hero-name">${heroGame ? escapeHtml(heroGame.name) : "Game Name"}</h2>
					</article>
				</section>

				<section class="games-popular">
					<h2 class="games-popular-title">Popular Games</h2>
					<div class="games-popular-row">
						<button type="button" class="games-slide-btn" data-slide="left">&lt;</button>
						<div class="games-popular-grid">
							${visiblePopular
								.map((game) => {
									const thumb = game.image || "";
									return `
										<article class="game-pop-card game-open-trigger" data-path="${escapeHtml(game.path)}">
											${thumb ? `<img class="game-pop-thumb" src="${thumb}" alt="${escapeHtml(game.name)}">` : `<div class="game-pop-thumb"></div>`}
											<p class="game-pop-name">${escapeHtml(game.name)}</p>
										</article>
									`;
								})
								.join("")}
						</div>
						<button type="button" class="games-slide-btn" data-slide="right">&gt;</button>
					</div>
				</section>

				<section>
					<div class="games-toolbar">
						<input class="games-search" id="games-search" placeholder="Search games or type" value="${escapeHtml(state.search)}">
						<div>${allFiltered.length} games</div>
					</div>
					<div class="games-card-grid">
						${visibleGames.map((game) => gameCardMarkup(game)).join("")}
					</div>
					${paginationMarkup(allFiltered.length)}
				</section>
			</section>
		`;
	}
function renderCardsOnly(root) {
    const allFiltered = currentFilteredGames();
    const visibleGames = getVisibleGames();

    const grid = root.querySelector(".games-card-grid");
    if (grid) {
        grid.innerHTML = visibleGames.map(game => gameCardMarkup(game)).join("");
    }

    const paginationContainer = root.querySelector(".games-page-nav, .games-alpha-nav");
    if (paginationContainer) {
        paginationContainer.outerHTML = paginationMarkup(allFiltered.length);
    }

    const countEl = root.querySelector(".games-toolbar div");
    if (countEl) {
        countEl.textContent = `${allFiltered.length} games`;
    }

    root.querySelectorAll(".game-card").forEach(card => {
        card.addEventListener("click", async (event) => {
            if (event.target.closest(".rate-btn")) return;
            const path = card.getAttribute("data-path");
            const game = state.games.find(item => item.path === path);
            if (game) await openGame(game);
        });
    });

    root.querySelectorAll(".rate-btn").forEach(button => {
        button.addEventListener("click", async (event) => {
            event.stopPropagation();
            const path = button.getAttribute("data-path");
            const rating = Number(button.getAttribute("data-rate"));
            const game = state.games.find(item => item.path === path);
            if (game) {
                await setRating(game, rating);
                renderCardsOnly(root);
            }
        });
    });
}

function renderPopularOnly(root) {
    const popularGames = getPopularGames();
    const visiblePopular = popularGames.slice(state.popularIndex, state.popularIndex + 3);
    while (visiblePopular.length < 3 && popularGames.length) {
        visiblePopular.push(popularGames[(visiblePopular.length + state.popularIndex) % popularGames.length]);
    }

    const grid = root.querySelector(".games-popular-grid");
    if (!grid) return;

    grid.innerHTML = visiblePopular.map(game => {
        const thumb = game.image || "";
        return `
            <article class="game-pop-card game-open-trigger" data-path="${escapeHtml(game.path)}">
                <div class="game-pop-card-inner">
                    ${thumb ? `<img class="game-pop-thumb" src="${thumb}" alt="${escapeHtml(game.name)}">` : `<div class="game-pop-thumb"></div>`}
                    <p class="game-pop-name">${escapeHtml(game.name)}</p>
                </div>
            </article>
        `;
    }).join("");

    grid.querySelectorAll(".game-pop-card").forEach(card => {
        card.addEventListener("click", async (event) => {
            if (event.target.closest(".rate-btn")) return;
            const path = card.getAttribute("data-path");
            const game = state.games.find(item => item.path === path);
            if (game) await openGame(game);
        });
    });
}
	function bindPageEvents(root) {
const searchInput = root.querySelector("#games-search");
if (searchInput) {
    searchInput.addEventListener("input", (event) => {
        state.search = event.target.value;
        state.page = 1;
        renderCardsOnly(root);
    });
}

		root.querySelectorAll("[data-page]").forEach((button) => {
			button.addEventListener("click", () => {
				state.page = Number(button.getAttribute("data-page"));
				render();
			});
		});

		root.querySelectorAll("[data-letter]").forEach((button) => {
			button.addEventListener("click", () => {
				state.letter = button.getAttribute("data-letter");
				render();
			});
		});

		root.querySelectorAll("[data-slide]").forEach((button) => {
    button.addEventListener("click", () => {
        const dir = button.getAttribute("data-slide");
        const total = Math.max(1, getPopularGames().length);
        if (dir === "left") {
            state.popularIndex = (state.popularIndex - 1 + total) % total;
        } else {
            state.popularIndex = (state.popularIndex + 1) % total;
        }
        renderPopularOnly(root);
    });
});

		root.querySelectorAll(".game-open-trigger, .game-card").forEach((card) => {
			card.addEventListener("click", async (event) => {
				if (event.target.closest(".rate-btn")) {
					return;
				}
				const path = card.getAttribute("data-path");
				const game = state.games.find((item) => item.path === path);
				if (game) {
					await openGame(game);
				}
			});
		});

		root.querySelectorAll(".rate-btn").forEach((button) => {
			button.addEventListener("click", async (event) => {
				event.stopPropagation();
				const path = button.getAttribute("data-path");
				const rating = Number(button.getAttribute("data-rate"));
				const game = state.games.find((item) => item.path === path);
				if (game) {
					await setRating(game, rating);
					render();
				}
			});
		});
	}

	async function openGame(game) {
		await trackPlay(game);
		await ensureStats([game.path]);

		if (state.overlayCleanup) {
			state.overlayCleanup();
			state.overlayCleanup = null;
		}

		state.activeGame = game;
		const frameUrl = createGameRunnerUrl(game.path);

		const overlay = document.createElement("div");
		overlay.className = "game-overlay";
		overlay.innerHTML = `
			<div class="game-frame-wrap" id="game-frame-wrap">
				<iframe class="game-frame" src="${frameUrl}" allowfullscreen></iframe>
			</div>
			<div class="game-bottom-bar">
				<div class="bar-left">
					<button type="button" class="bar-btn" id="close-game"><i class="fa-solid fa-xmark"></i> Close</button>
					<button type="button" class="bar-btn" id="new-tab"><i class="fa-solid fa-up-right-from-square"></i> New Tab</button>
					<button type="button" class="bar-btn" id="full-screen"><i class="fa-solid fa-expand"></i> Fullscreen</button>
				</div>
				<div class="bar-stats" id="game-stats">Loading stats...</div>
				<div class="bar-right">
					<button type="button" class="bar-btn" id="overlay-up"><i class="fa-solid fa-thumbs-up"></i></button>
					<button type="button" class="bar-btn" id="overlay-down"><i class="fa-solid fa-thumbs-down"></i></button>
					<div class="bar-btn" id="fps-value">FPS: --</div>
				</div>
			</div>
		`;
		document.body.appendChild(overlay);

		const refs = statRefs(game.path);
		let unsubscribe = null;
		if (refs) {
			unsubscribe = refs.statsRef.onSnapshot(async (doc) => {
				const stats = doc.exists ? doc.data() : {};
				const player = await refs.playerRef.get();
				const merged = {
					plays: Number(stats.plays || 0),
					uniqueClicks: Number(stats.uniqueClicks || 0),
					thumbsUp: Number(stats.thumbsUp || 0),
					thumbsDown: Number(stats.thumbsDown || 0),
					myRating: player.exists ? Number(player.data().rating || 0) : 0
				};
				state.statsCache.set(game.path, merged);
				renderOverlayStats(overlay, game.path);
			});
		}

		renderOverlayStats(overlay, game.path);

		let rafId = 0;
		let fpsCount = 0;
		let fpsStart = performance.now();
		function fpsLoop() {
			fpsCount += 1;
			const now = performance.now();
			const elapsed = now - fpsStart;
			if (elapsed >= 500) {
				const fps = Math.round((fpsCount * 1000) / elapsed);
				const fpsNode = overlay.querySelector("#fps-value");
				if (fpsNode) {
					fpsNode.textContent = `FPS: ${fps}`;
				}
				fpsStart = now;
				fpsCount = 0;
			}
			rafId = requestAnimationFrame(fpsLoop);
		}
		rafId = requestAnimationFrame(fpsLoop);

		overlay.querySelector("#close-game").addEventListener("click", () => {
			cleanup();
		});

		overlay.querySelector("#new-tab").addEventListener("click", () => {
			window.open(createGameRunnerUrl(game.path), "_blank", "noopener,noreferrer");
		});

		overlay.querySelector("#full-screen").addEventListener("click", async () => {
			const wrap = overlay.querySelector("#game-frame-wrap");
			if (!document.fullscreenElement) {
				await wrap.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		});

		overlay.querySelector("#overlay-up").addEventListener("click", async () => {
			await setRating(game, 1);
			renderOverlayStats(overlay, game.path);
			render();
		});

		overlay.querySelector("#overlay-down").addEventListener("click", async () => {
			await setRating(game, -1);
			renderOverlayStats(overlay, game.path);
			render();
		});

		function cleanup() {
			if (unsubscribe) {
				unsubscribe();
			}
			cancelAnimationFrame(rafId);
			overlay.remove();
			state.activeGame = null;
			state.overlayCleanup = null;
			render();
		}

		state.overlayCleanup = cleanup;
	}

	function renderOverlayStats(overlay, path) {
		const stats = statsForPath(path);
		const statsNode = overlay.querySelector("#game-stats");
		if (statsNode) {
			statsNode.textContent = `Plays: ${stats.plays} | Unique Clicks: ${stats.uniqueClicks} | 👍 ${stats.thumbsUp} | 👎 ${stats.thumbsDown}`;
		}
		const up = overlay.querySelector("#overlay-up");
		const down = overlay.querySelector("#overlay-down");
		if (up) {
			up.classList.toggle("active", stats.myRating === 1);
			up.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> ${stats.thumbsUp}`;
		}
		if (down) {
			down.classList.toggle("active", stats.myRating === -1);
			down.innerHTML = `<i class="fa-solid fa-thumbs-down"></i> ${stats.thumbsDown}`;
		}
	}

	async function render() {
		const root = document.querySelector(state.mountSelector);
		if (!root) {
			return;
		}

		const authReady = await ensureAuthReady();
		if (!authReady) {
			root.innerHTML = '<div class="text-2xl text-red-400">Enable Anonymous sign-in in Firebase Authentication to use ratings and stats.</div>';
			return;
		}

		if (!state.ready) {
			root.innerHTML = '<div class="text-2xl">Loading games...</div>';
			try {
				await loadGames();
			} catch (_err) {
				root.innerHTML = '<div class="text-2xl text-red-400">Unable to load games right now.</div>';
				return;
			}
		}

		const visiblePaths = getVisibleGames().map((game) => game.path);
		await ensureStats(visiblePaths.slice(0, 30));
		root.innerHTML = renderMarkup();
		bindPageEvents(root);
	}

	function mount(selector) {
		state.mountSelector = selector || state.mountSelector;
		render();
	}

	window.StarlightGames = { mount, render };
})();
