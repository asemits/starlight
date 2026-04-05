(function () {
	const PRIMARY_CDN_BASE = "https://cdn.jsdelivr.net/gh/PopAnynomous234/Goodboy@main/";
	const SECONDARY_CDN_BASE = "https://cdn.jsdelivr.net/gh/asemits/starlight-games@main/";
	const CDN_BASES = [PRIMARY_CDN_BASE, SECONDARY_CDN_BASE];
	const SECONDARY_MANIFEST_PATH = "/secondary-games.json";
	const PAGE_SIZE = 18;
	const POPULAR_LIMIT = 10;
	const POPULAR_REFRESH_MS = 15000;
	const GAME_LIST_CACHE_KEY = "starlight-games-list-v8";

	const state = {
		mountSelector: "#games-root",
		games: [],
		ready: false,
		search: "",
		page: 1,
		letter: "A",
		statsCache: new Map(),
		popularGames: [],
		popularLoadedAt: 0,
		overlayCleanup: null,
		presenceCleanup: null,
		warmedImages: new Set(),
		renderQueued: false
	};

	let gameListRefreshPromise = null;

	function queueRender() {
		if (state.renderQueued) {
			return;
		}
		state.renderQueued = true;
		requestAnimationFrame(() => {
			state.renderQueued = false;
			render();
		});
	}

	function randomToken(length) {
		const bytes = new Uint8Array(length);
		crypto.getRandomValues(bytes);
		let output = "";
		for (const byte of bytes) {
			output += (byte % 36).toString(36);
		}
		return output;
	}

	function getPaginationMode() {
		const mode = localStorage.getItem("games-pagination-mode");
		return mode === "alphabetical" ? "alphabetical" : "numbered";
	}

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
			} catch (_error) {
				return false;
			}
		}

		return Boolean(window.starlightAuth.currentUser);
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

	function firstLetter(name) {
		const first = name.trim().charAt(0).toUpperCase();
		return /[A-Z]/.test(first) ? first : "#";
	}

	function currentFilteredGames() {
		const query = state.search.trim().toLowerCase();
		let list = state.games;
		if (query) {
			list = list.filter((game) => game.name.toLowerCase().includes(query));
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
		if (state.page < 1) {
			state.page = 1;
		}

		const start = (state.page - 1) * PAGE_SIZE;
		return list.slice(start, start + PAGE_SIZE);
	}

	function statsForPath(path) {
		return state.statsCache.get(path) || {
			plays: 0,
			uniqueClicks: 0,
			thumbsUp: 0,
			thumbsDown: 0,
			currentPlayers: 0,
			myRating: 0,
			isFavorite: false
		};
	}

	function createGameRunnerUrl(gamePath, sourceBase) {
		const isDev = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
		const base = isDev ? "/public/loader.html" : "/loader.html";
		const url = new URL(base, window.location.origin);
		url.searchParams.set("path", gamePath);
		url.searchParams.set("base", sourceBase || PRIMARY_CDN_BASE);
		return url.toString();
	}

	function normalizePath(path) {
		const raw = String(path || "").trim();
		if (!raw) {
			return "";
		}
		try {
			return decodeURIComponent(raw).replace(/^\/+/, "");
		} catch (_error) {
			return raw.replace(/^\/+/, "");
		}
	}

	function encodePath(path) {
		return normalizePath(path)
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");
	}

	function normalizeName(name) {
		return String(name || "").trim().toLowerCase();
	}

	function gameIdentity(path, sourceBase) {
		const normalizedPath = normalizePath(path).toLowerCase();
		const normalizedBase = normalizeSourceBase(sourceBase);
		return `${normalizedBase}|${normalizedPath}`;
	}

	function normalizeSourceBase(sourceBase) {
		const input = String(sourceBase || "").trim();
		const found = CDN_BASES.find((base) => base === input || base.replace(/\/$/, "") === input.replace(/\/$/, ""));
		return found || PRIMARY_CDN_BASE;
	}

	function normalizeImageUrl(image, sourceBase) {
		const raw = String(image || "").trim();
		if (!raw) {
			return "";
		}
		if (raw.startsWith("/")) {
			return raw;
		}
		if (/^(https?:|data:|blob:)/i.test(raw)) {
			return raw;
		}
		try {
			return new URL(raw, normalizeSourceBase(sourceBase)).toString();
		} catch (_error) {
			return raw;
		}
	}


	function dedupeGames(list) {
		const byIdentity = new Map();
		for (const game of list || []) {
			const rawPath = game ? (game.url || game.path) : "";
			if (!rawPath) {
				continue;
			}
			const key = gameIdentity(rawPath, game.sourceBase);
			if (!byIdentity.has(key)) {
				byIdentity.set(key, game);
				continue;
			}
			const existing = byIdentity.get(key);
			if (!existing.image && game.image) {
				byIdentity.set(key, game);
			}
		}
		return Array.from(byIdentity.values());
	}

	function readCachedGameList() {
		try {
			const raw = localStorage.getItem(GAME_LIST_CACHE_KEY);
			if (!raw) {
				return null;
			}
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed) || parsed.length === 0) {
				return null;
			}
			return parsed;
		} catch (_error) {
			return null;
		}
	}

	function writeCachedGameList(list) {
		try {
			const compact = list.map((item) => {
				const safeImage = typeof item.image === "string" && item.image.startsWith("data:") ? "" : (item.image || "");
				return {
					title: item.title || item.name || "",
					url: item.url || item.path || "",
					image: safeImage,
					sourceBase: normalizeSourceBase(item.sourceBase)
				};
			});
			localStorage.setItem(GAME_LIST_CACHE_KEY, JSON.stringify(compact));
		} catch (_error) {
		}
	}

	function applyGameList(list) {
		state.games = dedupeGames(list || [])
			.map((item) => ({
				name: item.title || item.name || "",
				path: normalizePath(item.url || item.path),
				sourceBase: normalizeSourceBase(item.sourceBase),
				image: normalizeImageUrl(item.image || "", item.sourceBase)
			}))
			.filter((item) => item.name && item.path)
			.sort((a, b) => a.name.localeCompare(b.name));
		state.ready = state.games.length > 0;
	}

	function loadGameListScript() {
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			const isDev = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
			script.src = isDev ? "/public/gameslist.js" : "/gameslist.js";
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	async function fetchSecondaryGames() {
		try {
			const isDev = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
			const manifestUrl = isDev ? `/public${SECONDARY_MANIFEST_PATH}` : SECONDARY_MANIFEST_PATH;
			const response = await fetch(manifestUrl, { cache: "force-cache" });
			if (!response.ok) {
				return [];
			}
			const data = await response.json();
			const entries = Array.isArray(data) ? data : [];
			return entries
				.map((item) => {
					const path = normalizePath(item.url || item.path || "");
					if (!path || !/\.html$/i.test(path)) {
						return null;
					}
					if (/\/(?:index|404)\.html$/i.test(path) || /^(?:index|404)\.html$/i.test(path)) {
						return null;
					}
					const imagePath = normalizePath(item.image || "");
					const rawTitle = String(item.title || "").trim();
					return {
						title: rawTitle || path,
						url: path,
						image: imagePath ? `${SECONDARY_CDN_BASE}${encodePath(imagePath)}` : "",
						sourceBase: SECONDARY_CDN_BASE
					};
				})
				.filter(Boolean);
		} catch (_error) {
			return [];
		}
	}

	async function buildCombinedGameList() {
		let primary = [];
		try {
			await loadGameListScript();
			primary = (Array.isArray(window.GAMES_LIST) ? window.GAMES_LIST : []).map((item) => ({
				title: item.title,
				url: item.url,
				image: item.image || "",
				sourceBase: PRIMARY_CDN_BASE
			}));
		} catch (_error) {
			primary = [];
		}

		const secondary = await fetchSecondaryGames();
		return dedupeGames([...primary, ...secondary]);
	}

	function refreshGameListInBackground() {
		if (gameListRefreshPromise) {
			return;
		}

		gameListRefreshPromise = buildCombinedGameList()
			.then((combined) => {
				if (combined.length > 0) {
					applyGameList(combined);
					writeCachedGameList(combined);
					queueRender();
				}
			})
			.catch(() => {
			})
			.finally(() => {
				gameListRefreshPromise = null;
			});
	}

	function thumbFallback(path, sourceBase) {
		const clean = normalizePath(path).replace(/\.html$/i, "");
		const encoded = encodePath(clean);
		const primary = normalizeSourceBase(sourceBase);
		const secondary = CDN_BASES.find((base) => base !== primary) || SECONDARY_CDN_BASE;
		return [
			`${primary}${encoded}.png`,
			`${primary}${encoded}.jpg`,
			`${secondary}${encoded}.png`,
			`${secondary}${encoded}.jpg`,
			"/logos/logo.png"
		].join("|");
	}

	function warmImageUrl(url) {
		const src = normalizeImageUrl(url);
		if (!src || state.warmedImages.has(src)) {
			return;
		}
		state.warmedImages.add(src);
		const img = new Image();
		img.loading = "eager";
		img.decoding = "async";
		img.src = src;
	}

	function warmGameImages(games) {
		(games || []).forEach((game) => {
			if (!game) {
				return;
			}
			if (game.image) {
				warmImageUrl(game.image);
			}
			const fallbackChain = thumbFallback(game.path, game.sourceBase)
				.split("|")
				.map((item) => item.trim())
				.filter(Boolean)
				.slice(0, 1);
			fallbackChain.forEach((item) => warmImageUrl(item));
		});
	}

	function findGame(path, sourceBase) {
		const target = gameIdentity(path, sourceBase);
		return state.games.find((game) => gameIdentity(game.path, game.sourceBase) === target)
			|| state.popularGames.find((game) => gameIdentity(game.path, game.sourceBase) === target)
			|| null;
	}

	async function loadGames() {
		if (state.ready) {
			return;
		}

		const cached = readCachedGameList();
		if (cached && cached.length > 0) {
			applyGameList(cached);
			refreshGameListInBackground();
			return;
		}

		const combined = await buildCombinedGameList();
		applyGameList(combined);
		writeCachedGameList(combined);
	}

	async function loadPopularGames(force) {
		const now = Date.now();
		if (!force && state.popularLoadedAt && now - state.popularLoadedAt < POPULAR_REFRESH_MS) {
			return;
		}

		const authReady = await ensureAuthReady();
		if (!authReady || !window.starlightDb) {
			state.popularGames = [];
			state.popularLoadedAt = now;
			return;
		}

		try {
			const snapshot = await window.starlightDb
				.collection("gameStats")
				.where("uniqueClicks", ">", 0)
				.orderBy("uniqueClicks", "desc")
				.limit(POPULAR_LIMIT)
				.get();

			const byPath = new Map(state.games.map((game) => [normalizePath(game.path), game]));
			const byName = new Map(state.games.map((game) => [normalizeName(game.name), game]));
			const popular = [];

			snapshot.forEach((doc) => {
				const data = doc.data() || {};
				const path = normalizePath(data.path || "");
				if (!path) {
					return;
				}
				const fromList = byPath.get(path);
				if (fromList) {
					popular.push(fromList);
					return;
				}
				const byGameName = byName.get(normalizeName(data.name || ""));
				if (byGameName) {
					popular.push(byGameName);
					return;
				}
				popular.push({
					name: String(data.name || path),
					path,
					sourceBase: normalizeSourceBase(data.sourceBase),
					image: normalizeImageUrl(String(data.image || ""), data.sourceBase)
				});
			});

			state.popularGames = popular.slice(0, POPULAR_LIMIT);
		} catch (_error) {
			state.popularGames = [];
		}

		state.popularLoadedAt = now;
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
						currentPlayers: Number(stats.currentPlayers || 0),
						myRating: Number(player.rating || 0),
						isFavorite: Boolean(player.isFavorite)
					});
				} catch (_error) {
					state.statsCache.set(item.path, {
						plays: 0,
						uniqueClicks: 0,
						thumbsUp: 0,
						thumbsDown: 0,
						currentPlayers: 0,
						myRating: 0,
						isFavorite: false
					});
				}
			})
		);
	}

	async function setFavorite(game, favoriteOn) {
		const prev = statsForPath(game.path);
		mergeStatCache(game.path, { isFavorite: Boolean(favoriteOn) });

		const authReady = await ensureAuthReady();
		if (!authReady) {
			mergeStatCache(game.path, prev);
			throw new Error("auth-not-ready");
		}

		const refs = statRefs(game.path);
		if (!refs) {
			mergeStatCache(game.path, prev);
			throw new Error("missing-refs");
		}

		try {
			await window.starlightDb.runTransaction(async (tx) => {
				const [statsDoc, playerDoc] = await Promise.all([tx.get(refs.statsRef), tx.get(refs.playerRef)]);
				const now = firebase.firestore.FieldValue.serverTimestamp();
				const currentUid = window.starlightAuth && window.starlightAuth.currentUser ? window.starlightAuth.currentUser.uid : null;

				if (!statsDoc.exists) {
					tx.set(refs.statsRef, {
						name: game.name,
						path: game.path,
						sourceBase: normalizeSourceBase(game.sourceBase),
						image: game.image,
						plays: 0,
						uniqueClicks: 0,
						thumbsUp: 0,
						thumbsDown: 0,
						currentPlayers: 0,
						updatedAt: now
					}, { merge: true });
				}

				tx.set(refs.playerRef, {
					uid: currentUid,
					gamePath: game.path,
					gameName: game.name,
					gameImage: game.image || "",
					sourceBase: normalizeSourceBase(game.sourceBase),
					isFavorite: Boolean(favoriteOn),
					favoritedAt: favoriteOn ? now : firebase.firestore.FieldValue.delete()
				}, { merge: true });
			});
		} catch (error) {
			mergeStatCache(game.path, prev);
			throw error;
		}
	}

	function mergeStatCache(path, patch) {
		const prev = statsForPath(path);
		state.statsCache.set(path, { ...prev, ...patch });
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

		await window.starlightDb.runTransaction(async (tx) => {
			const [statsDoc, playerDoc] = await Promise.all([tx.get(refs.statsRef), tx.get(refs.playerRef)]);
			const increment = firebase.firestore.FieldValue.increment;
			const now = firebase.firestore.FieldValue.serverTimestamp();
			const isFirstClick = !playerDoc.exists;
			const currentUid = window.starlightAuth && window.starlightAuth.currentUser ? window.starlightAuth.currentUser.uid : null;

			if (!statsDoc.exists) {
				tx.set(refs.statsRef, {
					name: game.name,
					path: game.path,
					sourceBase: normalizeSourceBase(game.sourceBase),
					image: game.image,
					plays: 0,
					uniqueClicks: 0,
					thumbsUp: 0,
					thumbsDown: 0,
					currentPlayers: 0,
					updatedAt: now
				}, { merge: true });
			}

			tx.set(refs.statsRef, {
				plays: increment(1),
				uniqueClicks: increment(isFirstClick ? 1 : 0),
				updatedAt: now,
				name: game.name,
				path: game.path,
				sourceBase: normalizeSourceBase(game.sourceBase),
				image: game.image
			}, { merge: true });

			tx.set(refs.playerRef, {
				uid: currentUid,
				gamePath: game.path,
				gameName: game.name,
				gameImage: game.image || "",
				rating: playerDoc.exists ? Number(playerDoc.data().rating || 0) : 0,
				clickCount: increment(1),
				lastPlayedAt: now
			}, { merge: true });
		});

		const prev = statsForPath(game.path);
		mergeStatCache(game.path, {
			plays: prev.plays + 1,
			uniqueClicks: prev.uniqueClicks + (prev.plays === 0 ? 1 : 0)
		});
	}

	async function setRating(game, rating) {
		const prev = statsForPath(game.path);
		const nextRating = prev.myRating === Number(rating) ? 0 : Number(rating);
		mergeStatCache(game.path, {
			thumbsUp: prev.thumbsUp + ((nextRating === 1 ? 1 : 0) - (prev.myRating === 1 ? 1 : 0)),
			thumbsDown: prev.thumbsDown + ((nextRating === -1 ? 1 : 0) - (prev.myRating === -1 ? 1 : 0)),
			myRating: nextRating
		});

		const authReady = await ensureAuthReady();
		if (!authReady) {
			mergeStatCache(game.path, prev);
			throw new Error("auth-not-ready");
		}

		const refs = statRefs(game.path);
		if (!refs) {
			mergeStatCache(game.path, prev);
			throw new Error("missing-refs");
		}

		try {
			await window.starlightDb.runTransaction(async (tx) => {
				const [statsDoc, playerDoc] = await Promise.all([tx.get(refs.statsRef), tx.get(refs.playerRef)]);
				const now = firebase.firestore.FieldValue.serverTimestamp();
				const oldRating = playerDoc.exists ? Number(playerDoc.data().rating || 0) : 0;
				const desiredRating = oldRating === Number(rating) ? 0 : Number(rating);
				const currentUid = window.starlightAuth && window.starlightAuth.currentUser ? window.starlightAuth.currentUser.uid : null;

				if (!statsDoc.exists) {
					tx.set(refs.statsRef, {
						name: game.name,
						path: game.path,
						sourceBase: normalizeSourceBase(game.sourceBase),
						image: game.image,
						plays: 0,
						uniqueClicks: 0,
						thumbsUp: 0,
						thumbsDown: 0,
						currentPlayers: 0,
						updatedAt: now
					}, { merge: true });
				}

				const thumbsUpDelta = (desiredRating === 1 ? 1 : 0) - (oldRating === 1 ? 1 : 0);
				const thumbsDownDelta = (desiredRating === -1 ? 1 : 0) - (oldRating === -1 ? 1 : 0);
				const increment = firebase.firestore.FieldValue.increment;

				tx.set(refs.statsRef, {
					sourceBase: normalizeSourceBase(game.sourceBase),
					thumbsUp: increment(thumbsUpDelta),
					thumbsDown: increment(thumbsDownDelta),
					updatedAt: now
				}, { merge: true });

				tx.set(refs.playerRef, {
					uid: currentUid,
					gamePath: game.path,
					gameName: game.name,
					gameImage: game.image || "",
					rating: desiredRating,
					lastRatedAt: now
				}, { merge: true });
			});
		} catch (error) {
			mergeStatCache(game.path, prev);
			throw error;
		}
	}

	async function acquirePresence(game) {
		const refs = statRefs(game.path);
		if (!refs) {
			return function () {};
		}

		const sessionKey = "session_" + Date.now() + "_" + randomToken(10);
		try {
			await window.starlightDb.runTransaction(async (tx) => {
				const [statsDoc, playerDoc] = await Promise.all([tx.get(refs.statsRef), tx.get(refs.playerRef)]);
				const now = firebase.firestore.FieldValue.serverTimestamp();
				const increment = firebase.firestore.FieldValue.increment;
				const hasPresence = playerDoc.exists && playerDoc.data() && playerDoc.data().activeSession;
				const currentUid = window.starlightAuth && window.starlightAuth.currentUser ? window.starlightAuth.currentUser.uid : null;

				if (!statsDoc.exists) {
					tx.set(refs.statsRef, {
						name: game.name,
						path: game.path,
						image: game.image,
						plays: 0,
						uniqueClicks: 0,
						thumbsUp: 0,
						thumbsDown: 0,
						currentPlayers: 0,
						updatedAt: now
					}, { merge: true });
				}

				tx.set(refs.playerRef, {
					uid: currentUid,
					gamePath: game.path,
					gameName: game.name,
					gameImage: game.image || "",
					activeSession: sessionKey,
					activeGamePath: game.path,
					activeAt: now
				}, { merge: true });

				if (!hasPresence) {
					tx.set(refs.statsRef, {
						currentPlayers: increment(1),
						updatedAt: now
					}, { merge: true });
				}
			});
		} catch (_error) {
			return function () {};
		}

		const current = statsForPath(game.path);
		mergeStatCache(game.path, { currentPlayers: current.currentPlayers + 1 });

		let released = false;
		return async function releasePresence() {
			if (released) {
				return;
			}
			released = true;
			try {
				await window.starlightDb.runTransaction(async (tx) => {
					const [statsDoc, playerDoc] = await Promise.all([tx.get(refs.statsRef), tx.get(refs.playerRef)]);
					const playerData = playerDoc.exists ? playerDoc.data() : null;
					const now = firebase.firestore.FieldValue.serverTimestamp();
					if (!statsDoc.exists || !playerData || playerData.activeSession !== sessionKey) {
						return;
					}
					tx.set(refs.playerRef, {
						activeSession: firebase.firestore.FieldValue.delete(),
						activeGamePath: firebase.firestore.FieldValue.delete(),
						activeAt: firebase.firestore.FieldValue.delete()
					}, { merge: true });
					tx.set(refs.statsRef, {
						currentPlayers: firebase.firestore.FieldValue.increment(-1),
						updatedAt: now
					}, { merge: true });
				});
			} catch (_error) {
			}

			const latest = statsForPath(game.path);
			mergeStatCache(game.path, { currentPlayers: Math.max(0, latest.currentPlayers - 1) });
			queueRender();
		};
	}

	function statIcon(icon, value, label) {
		return `<span class="stat-pill"><i class="fa-solid ${icon}"></i><span>${value}</span><span class="sr-only">${escapeHtml(label)}</span></span>`;
	}

	function gameCardMarkup(game) {
		const stats = statsForPath(game.path);
		const fallbacks = thumbFallback(game.path, game.sourceBase);
		const initialSrc = game.image || fallbacks.split("|")[0] || "/logos/logo.png";
		return `
			<article class="game-card game-open-trigger" data-path="${escapeHtml(game.path)}" data-base="${escapeHtml(normalizeSourceBase(game.sourceBase))}">
				<div class="game-card-inner">
					<div class="game-thumb-wrap">
						<img class="game-thumb" src="${escapeHtml(initialSrc)}" loading="eager" fetchpriority="high" decoding="async" data-fallbacks="${escapeHtml(fallbacks)}" alt="${escapeHtml(game.name)}">
					</div>
					<h3 class="game-name">${escapeHtml(game.name)}</h3>
					<div class="game-mini-stats">
						${statIcon("fa-play", stats.plays, "Plays")}
						${statIcon("fa-eye", stats.uniqueClicks, "Unique Clicks")}
						${statIcon("fa-user-group", stats.currentPlayers, "Currently Playing")}
					</div>
					<div class="game-card-actions">
						<button type="button" class="rate-btn ${stats.isFavorite ? "active" : ""}" data-action="favorite" data-path="${escapeHtml(game.path)}" data-base="${escapeHtml(normalizeSourceBase(game.sourceBase))}"><i class="fa-solid fa-star"></i><span>${stats.isFavorite ? "Saved" : "Save"}</span></button>
						<button type="button" class="rate-btn ${stats.myRating === 1 ? "active" : ""}" data-action="rate" data-path="${escapeHtml(game.path)}" data-base="${escapeHtml(normalizeSourceBase(game.sourceBase))}" data-rate="1"><i class="fa-solid fa-thumbs-up"></i><span>${stats.thumbsUp}</span></button>
						<button type="button" class="rate-btn ${stats.myRating === -1 ? "active" : ""}" data-action="rate" data-path="${escapeHtml(game.path)}" data-base="${escapeHtml(normalizeSourceBase(game.sourceBase))}" data-rate="-1"><i class="fa-solid fa-thumbs-down"></i><span>${stats.thumbsDown}</span></button>
					</div>
				</div>
			</article>
		`;
	}

	function popularCardMarkup(game, rank) {
		const stats = statsForPath(game.path);
		const fallbacks = thumbFallback(game.path, game.sourceBase);
		const initialSrc = game.image || fallbacks.split("|")[0] || "/logos/logo.png";
		return `
			<article class="game-pop-card game-open-trigger" data-path="${escapeHtml(game.path)}" data-base="${escapeHtml(normalizeSourceBase(game.sourceBase))}">
				<div class="game-pop-rank">#${rank + 1}</div>
				<img class="game-pop-thumb" src="${escapeHtml(initialSrc)}" loading="eager" fetchpriority="high" decoding="async" data-fallbacks="${escapeHtml(fallbacks)}" alt="${escapeHtml(game.name)}">
				<div class="game-pop-meta">
					<p class="game-pop-name">${escapeHtml(game.name)}</p>
					<div class="game-pop-stats">
						${statIcon("fa-eye", stats.uniqueClicks, "Unique Clicks")}
						${statIcon("fa-thumbs-up", stats.thumbsUp, "Likes")}
						${statIcon("fa-thumbs-down", stats.thumbsDown, "Dislikes")}
					</div>
				</div>
			</article>
		`;
	}

	function paginationMarkup(totalCount) {
		if (getPaginationMode() === "alphabetical") {
			const letters = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
			return letters
				.map((letter) => `<button type="button" class="games-page-btn ${state.letter === letter ? "active" : ""}" data-action="letter" data-letter="${letter}">${letter}</button>`)
				.join("");
		}

		const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
		const pages = [];
		for (let i = 1; i <= pageCount; i += 1) {
			pages.push(`<button type="button" class="games-page-btn ${state.page === i ? "active" : ""}" data-action="page" data-page="${i}">${i}</button>`);
		}
		return pages.join("");
	}

	function getHeroGame() {
		if (state.popularGames.length > 0) {
			return state.popularGames[0];
		}
		return state.games[0] || null;
	}

	function heroImageChain(game) {
		const logo = normalizeImageUrl("/logos/logo.png", game.sourceBase);
		const candidates = [
			game.image || "",
			...thumbFallback(game.path, game.sourceBase).split("|"),
			logo
		];
		const chain = [];
		for (const candidate of candidates) {
			const normalized = normalizeImageUrl(candidate, game.sourceBase);
			if (!normalized || normalized === logo || chain.includes(normalized)) {
				continue;
			}
			chain.push(normalized);
		}
		chain.push(logo);
		return chain;
	}

	function renderHero(root) {
		const heroWrap = root.querySelector("#games-hero");
		if (!heroWrap) {
			return;
		}

		const heroGame = getHeroGame();
		if (!heroGame) {
			heroWrap.innerHTML = "";
			return;
		}

		const stats = statsForPath(heroGame.path);
		const heroChain = heroImageChain(heroGame);
		const heroInitialSrc = heroChain[0] || "/logos/logo.png";
		const heroFallbacks = heroChain.slice(1).join("|");
		heroWrap.innerHTML = `
			<article class="games-hero-card game-open-trigger" data-path="${escapeHtml(heroGame.path)}" data-base="${escapeHtml(normalizeSourceBase(heroGame.sourceBase))}">
				<div class="games-hero-media">
					<img src="${escapeHtml(heroInitialSrc)}" class="games-hero-backdrop" loading="eager" decoding="async" data-fallbacks="${escapeHtml(heroFallbacks)}" alt="" aria-hidden="true">
					<img src="${escapeHtml(heroInitialSrc)}" class="games-hero-thumb" loading="eager" fetchpriority="high" decoding="async" data-fallbacks="${escapeHtml(heroFallbacks)}" alt="${escapeHtml(heroGame.name)}">
					<h2 class="games-hero-name">${escapeHtml(heroGame.name)}</h2>
				</div>
				<div class="games-hero-stats">
					${statIcon("fa-thumbs-up", stats.thumbsUp, "Likes")}
					${statIcon("fa-thumbs-down", stats.thumbsDown, "Dislikes")}
					${statIcon("fa-eye", stats.uniqueClicks, "Unique Views")}
				</div>
			</article>
		`;
	}

	function renderPopular(root) {
		const popularWrap = root.querySelector("#games-popular");
		if (!popularWrap) {
			return;
		}

		if (state.popularGames.length === 0) {
			popularWrap.innerHTML = `<p class="games-empty">No popular games. Check back later!</p>`;
			return;
		}

		popularWrap.innerHTML = `
			<div class="games-popular-grid">
				${state.popularGames.slice(0, POPULAR_LIMIT).map((game, index) => popularCardMarkup(game, index)).join("")}
			</div>
		`;
	}

	function renderCards(root, animate) {
		const list = currentFilteredGames();
		const visible = getVisibleGames();

		const countNode = root.querySelector("#games-count");
		if (countNode) {
			countNode.textContent = String(list.length);
		}

		const grid = root.querySelector("#games-grid");
		const nav = root.querySelector("#games-pagination");

		const applyDom = () => {
			if (grid) {
				grid.innerHTML = visible.map((game) => gameCardMarkup(game)).join("");
			}

			if (nav) {
				nav.className = getPaginationMode() === "alphabetical" ? "games-alpha-nav" : "games-page-nav";
				nav.innerHTML = paginationMarkup(list.length);
			}
		};

		if (!animate) {
			applyDom();
			return;
		}

		const targets = [grid, nav].filter(Boolean);
		targets.forEach((node) => node.classList.add("cards-switching"));
		window.setTimeout(() => {
			applyDom();
			requestAnimationFrame(() => {
				targets.forEach((node) => node.classList.remove("cards-switching"));
			});
		}, 135);
	}

	function renderOverlayStats(overlay, path) {
		const stats = statsForPath(path);
		const statsNode = overlay.querySelector("#game-stats");
		if (statsNode) {
			statsNode.innerHTML = `${statIcon("fa-play", stats.plays, "Plays")}${statIcon("fa-eye", stats.uniqueClicks, "Unique Clicks")}${statIcon("fa-user-group", stats.currentPlayers, "Currently Playing")}`;
		}

		const up = overlay.querySelector("#overlay-up");
		const down = overlay.querySelector("#overlay-down");
		const favorite = overlay.querySelector("#overlay-favorite");
		if (favorite) {
			favorite.classList.toggle("active", Boolean(stats.isFavorite));
			favorite.innerHTML = `<i class="fa-solid fa-star"></i><span>${stats.isFavorite ? "Saved" : "Save"}</span>`;
		}
		if (up) {
			up.classList.toggle("active", stats.myRating === 1);
			up.innerHTML = `<i class="fa-solid fa-thumbs-up"></i><span>${stats.thumbsUp}</span>`;
		}
		if (down) {
			down.classList.toggle("active", stats.myRating === -1);
			down.innerHTML = `<i class="fa-solid fa-thumbs-down"></i><span>${stats.thumbsDown}</span>`;
		}
	}

	async function openGame(game) {
		try {
			await trackPlay(game);
		} catch (_error) {
		}
		try {
			await ensureStats([game.path]);
		} catch (_error) {
		}
		try {
			await loadPopularGames(true);
		} catch (_error) {
		}

		if (state.overlayCleanup) {
			try {
				await state.overlayCleanup();
			} catch (_error) {
			}
		}

		const frameUrl = createGameRunnerUrl(game.path, game.sourceBase);
		const overlay = document.createElement("div");
		overlay.className = "game-overlay";
		overlay.innerHTML = `
			<div class="game-frame-wrap" id="game-frame-wrap">
				<iframe class="game-frame" src="${frameUrl}" allowfullscreen></iframe>
			</div>
			<div class="game-bottom-bar">
				<div class="bar-left">
					<button type="button" class="bar-btn" id="close-game"><i class="fa-solid fa-xmark"></i>Close</button>
					<button type="button" class="bar-btn" id="new-tab"><i class="fa-solid fa-up-right-from-square"></i>New Tab</button>
					<button type="button" class="bar-btn" id="full-screen"><i class="fa-solid fa-expand"></i>Fullscreen</button>
				</div>
				<div class="bar-stats" id="game-stats"></div>
				<div class="bar-right">
					<button type="button" class="bar-btn" id="overlay-favorite"></button>
					<button type="button" class="bar-btn" id="overlay-up"></button>
					<button type="button" class="bar-btn" id="overlay-down"></button>
					<div class="bar-btn" id="fps-value">FPS: --</div>
				</div>
			</div>
		`;
		document.body.appendChild(overlay);

		if (state.presenceCleanup) {
			await state.presenceCleanup();
			state.presenceCleanup = null;
		}
		state.presenceCleanup = await acquirePresence(game);

		const refs = statRefs(game.path);
		let unsubscribe = null;
		if (refs) {
			unsubscribe = refs.statsRef.onSnapshot(async (doc) => {
				const stats = doc.exists ? doc.data() : {};
				let myRating = 0;
				try {
					const playerDoc = await refs.playerRef.get();
					myRating = playerDoc.exists ? Number(playerDoc.data().rating || 0) : 0;
				} catch (_error) {
				}
				mergeStatCache(game.path, {
					plays: Number(stats.plays || 0),
					uniqueClicks: Number(stats.uniqueClicks || 0),
					thumbsUp: Number(stats.thumbsUp || 0),
					thumbsDown: Number(stats.thumbsDown || 0),
					currentPlayers: Number(stats.currentPlayers || 0),
					myRating
				});
				renderOverlayStats(overlay, game.path);
				queueRender();
			});
		}

		renderOverlayStats(overlay, game.path);

		let rafId = 0;
		let frameCount = 0;
		let start = performance.now();
		function fpsLoop() {
			frameCount += 1;
			const now = performance.now();
			const elapsed = now - start;
			if (elapsed >= 500) {
				const fps = Math.round((frameCount * 1000) / elapsed);
				const node = overlay.querySelector("#fps-value");
				if (node) {
					node.textContent = `FPS: ${fps}`;
				}
				start = now;
				frameCount = 0;
			}
			rafId = requestAnimationFrame(fpsLoop);
		}
		rafId = requestAnimationFrame(fpsLoop);

		overlay.querySelector("#close-game").addEventListener("click", () => {
			cleanup();
		});

		overlay.querySelector("#new-tab").addEventListener("click", () => {
			window.open(createGameRunnerUrl(game.path, game.sourceBase), "_blank", "noopener,noreferrer");
		});

		overlay.querySelector("#full-screen").addEventListener("click", async () => {
			const wrap = overlay.querySelector("#game-frame-wrap");
			if (!document.fullscreenElement) {
				await wrap.requestFullscreen();
				return;
			}
			await document.exitFullscreen();
		});

		overlay.querySelector("#overlay-up").addEventListener("click", async () => {
			setRating(game, 1)
				.catch(() => {
					renderOverlayStats(overlay, game.path);
					queueRender();
				});
			renderOverlayStats(overlay, game.path);
			queueRender();
		});

		overlay.querySelector("#overlay-down").addEventListener("click", async () => {
			setRating(game, -1)
				.catch(() => {
					renderOverlayStats(overlay, game.path);
					queueRender();
				});
			renderOverlayStats(overlay, game.path);
			queueRender();
		});

		overlay.querySelector("#overlay-favorite").addEventListener("click", async () => {
			const current = statsForPath(game.path);
			setFavorite(game, !current.isFavorite)
				.catch(() => {
					renderOverlayStats(overlay, game.path);
					queueRender();
				});
			renderOverlayStats(overlay, game.path);
			queueRender();
		});

		async function cleanup() {
			if (unsubscribe) {
				unsubscribe();
			}
			cancelAnimationFrame(rafId);
			overlay.remove();
			if (state.presenceCleanup) {
				await state.presenceCleanup();
				state.presenceCleanup = null;
			}
			state.overlayCleanup = null;
			queueRender();
		}

		state.overlayCleanup = cleanup;
	}

	function hideOverlayInstant() {
		if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
			document.exitFullscreen().catch(() => {});
		}

		document.querySelectorAll(".game-overlay").forEach((node) => {
			try {
				node.style.opacity = "0";
				node.style.visibility = "hidden";
				node.style.pointerEvents = "none";
				const frame = node.querySelector(".game-frame");
				if (frame) {
					frame.setAttribute("src", "about:blank");
				}
				node.remove();
			} catch (_error) {
			}
		});
	}

	async function closeOverlay() {
		hideOverlayInstant();
		if (!state.overlayCleanup) {
			return;
		}
		const cleanup = state.overlayCleanup;
		state.overlayCleanup = null;
		try {
			await cleanup();
		} catch (_error) {
		}
	}

	function baseMarkup() {
		return `
			<style>
			.games-page {
				--ink: rgba(255,255,255,0.9);
				--ink-dim: rgba(255,255,255,0.55);
				--glass: rgba(255,255,255,0.06);
				--glass-2: rgba(255,255,255,0.09);
				--border: rgba(255,255,255,0.18);
				position: relative;
				font-family: 'Geist', 'Oxanium', 'Montserrat', sans-serif;
				color: var(--ink);
				z-index: 1;
			}
			.games-hero {
				margin-bottom: 16px;
			}
			.games-hero-card {
				border: 1px solid var(--border);
				background: var(--glass);
				border-radius: 16px;
				overflow: hidden;
				cursor: pointer;
				backdrop-filter: blur(10px);
			}
			.games-hero-media {
				position: relative;
				height: clamp(180px, 30vw, 300px);
				background: #0a0a0a;
			}
			.games-hero-media::after {
				content: "";
				position: absolute;
				inset: 0;
				background: linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.45));
				pointer-events: none;
				z-index: 2;
			}
			.games-hero-backdrop {
				position: absolute;
				inset: 0;
				width: 100%;
				height: 100%;
				object-fit: cover;
				filter: blur(24px) saturate(1.2) brightness(0.78);
				transform: scale(1.12);
				opacity: 0.95;
			}
			.games-hero-thumb {
				position: relative;
				z-index: 1;
				width: min(100%, 760px);
				height: 100%;
				margin: 0 auto;
				object-fit: contain;
				object-position: center;
				padding: 10px 16px 16px;
				background: transparent;
				display: block;
				filter: drop-shadow(0 18px 34px rgba(0,0,0,0.6));
			}
			.games-hero-name {
				position: absolute;
				left: 14px;
				top: 12px;
				z-index: 3;
				margin: 0;
				font-size: clamp(16px, 2.2vw, 24px);
				font-weight: 600;
				letter-spacing: 0.03em;
				text-shadow: 0 4px 16px rgba(0,0,0,0.65);
			}
			.games-hero-stats {
				display: flex;
				gap: 8px;
				padding: 10px 12px;
				border-top: 1px solid var(--border);
				background: rgba(0,0,0,0.45);
				flex-wrap: wrap;
			}
			.games-popular-shell {
				border: 1px solid var(--border);
				background: var(--glass);
				border-radius: 16px;
				padding: 12px;
				backdrop-filter: blur(10px);
				margin-bottom: 16px;
			}
			.games-popular-title {
				margin: 0 0 10px;
				font-size: 17px;
				font-weight: 700;
				letter-spacing: 0.05em;
				text-transform: uppercase;
			}
			.games-popular-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
				gap: 10px;
			}
			.game-pop-card {
				border: 1px solid var(--border);
				background: rgba(0,0,0,0.45);
				border-radius: 12px;
				overflow: hidden;
				cursor: pointer;
				position: relative;
				transition: transform .2s ease, border-color .2s ease;
			}
			.game-pop-card:hover {
				transform: translateY(-2px);
				border-color: rgba(255,255,255,0.4);
			}
			.game-pop-rank {
				position: absolute;
				right: 8px;
				top: 8px;
				background: rgba(0,0,0,0.55);
				padding: 3px 7px;
				border-radius: 999px;
				font-size: 11px;
			}
			.game-pop-thumb {
				height: 88px;
				width: 100%;
				object-fit: cover;
				display: block;
				background: #111;
			}
			.game-pop-meta { padding: 8px; }
			.game-pop-name {
				margin: 0 0 6px;
				font-size: 12px;
				font-weight: 600;
				line-height: 1.3;
			}
			.game-pop-stats {
				display: flex;
				gap: 5px;
				flex-wrap: wrap;
			}
			.games-empty {
				margin: 0;
				padding: 16px 6px;
				color: var(--ink-dim);
				font-size: 14px;
			}
			.games-toolbar {
				display: flex;
				gap: 8px;
				justify-content: space-between;
				align-items: center;
				margin: 10px 0;
				flex-wrap: wrap;
			}
			.games-search {
				background: rgba(0,0,0,0.45);
				border: 1px solid var(--border);
				border-radius: 999px;
				color: #fff;
				padding: 8px 12px;
				min-width: 220px;
				outline: none;
			}
			.games-count {
				font-size: 12px;
				color: var(--ink-dim);
			}
			.games-card-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
				gap: 10px;
				transition: opacity 0.24s ease, transform 0.24s ease;
			}
			.game-card {
				border-radius: 12px;
				border: 1px solid var(--border);
				background: var(--glass);
				cursor: pointer;
				transition: transform .2s ease, border-color .2s ease;
				backdrop-filter: blur(8px);
			}
			.game-card:hover {
				transform: translateY(-3px);
				border-color: rgba(255,255,255,0.4);
			}
			.game-card-inner { padding: 8px; }
			.game-thumb-wrap {
				height: 96px;
				border-radius: 8px;
				overflow: hidden;
				background: #111;
			}
			.game-thumb {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
			}
			.game-thumb.placeholder {
				display: block;
				height: 100%;
			}
			.game-name {
				margin: 8px 0 6px;
				font-size: 13px;
				font-weight: 600;
				line-height: 1.25;
			}
			.game-mini-stats {
				display: flex;
				gap: 5px;
				flex-wrap: wrap;
			}
			.stat-pill {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				font-size: 11px;
				padding: 3px 7px;
				border-radius: 999px;
				background: rgba(0,0,0,0.45);
				border: 1px solid var(--border);
				color: var(--ink);
			}
			.sr-only {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0,0,0,0);
				white-space: nowrap;
				border: 0;
			}
			.game-card-actions {
				display: flex;
				gap: 6px;
				margin-top: 8px;
			}
			.rate-btn {
				border: 1px solid var(--border);
				background: rgba(0,0,0,0.45);
				color: var(--ink);
				border-radius: 999px;
				padding: 4px 8px;
				font-size: 11px;
				display: inline-flex;
				align-items: center;
				gap: 5px;
				cursor: pointer;
			}
			.rate-btn.active {
				background: #fff;
				color: #000;
			}
			.games-page-nav,
			.games-alpha-nav {
				display: flex;
				gap: 5px;
				flex-wrap: wrap;
				margin-top: 10px;
				justify-content: center;
				transition: opacity 0.24s ease, transform 0.24s ease;
			}
			.cards-switching {
				opacity: 0.25;
				transform: translateY(8px);
			}
			.games-page-btn {
				border: 1px solid var(--border);
				background: rgba(0,0,0,0.45);
				color: var(--ink);
				border-radius: 999px;
				padding: 5px 9px;
				min-width: 30px;
				font-size: 11px;
				cursor: pointer;
			}
			.games-page-btn.active {
				background: #fff;
				color: #000;
			}
			.game-overlay {
				position: fixed;
				inset: 0;
				z-index: 9999;
				background: rgba(0,0,0,0.95);
				display: flex;
				flex-direction: column;
			}
			.game-frame-wrap { flex: 1; min-height: 0; }
			.game-frame { width: 100%; height: 100%; border: 0; background: #000; }
			.game-bottom-bar {
				display: flex;
				gap: 8px;
				align-items: center;
				justify-content: space-between;
				padding: 10px;
				border-top: 1px solid var(--border);
				flex-wrap: wrap;
			}
			.bar-left, .bar-right { display: flex; gap: 6px; flex-wrap: wrap; }
			.bar-btn {
				border: 1px solid var(--border);
				background: rgba(0,0,0,0.45);
				color: var(--ink);
				border-radius: 999px;
				padding: 6px 10px;
				font-size: 11px;
				display: inline-flex;
				align-items: center;
				gap: 5px;
				cursor: pointer;
			}
			.bar-btn.active {
				background: #fff;
				color: #000;
			}
			.bar-stats {
				display: flex;
				gap: 6px;
				flex-wrap: wrap;
			}
			@media (max-width: 900px) {
				.games-popular-grid,
				.games-card-grid {
					grid-template-columns: repeat(2, minmax(0, 1fr));
				}
			}
			</style>
			<section class="games-page">
				<section class="games-hero" id="games-hero"></section>
				<section class="games-popular-shell">
					<h2 class="games-popular-title">Popular Games</h2>
					<div id="games-popular"></div>
				</section>
				<section>
					<div class="games-toolbar">
						<input class="games-search" id="games-search" placeholder="Search games" value="${escapeHtml(state.search)}">
						<div class="games-count"><span id="games-count">0</span> games</div>
					</div>
					<div class="games-card-grid" id="games-grid"></div>
					<div id="games-pagination" class="games-page-nav"></div>
				</section>
			</section>
		`;
	}

	function bindEvents(root) {
		if (root.dataset.gamesBound === "1") {
			return;
		}
		root.dataset.gamesBound = "1";

		root.addEventListener("input", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}
			if (target.id === "games-search") {
				state.search = target.value || "";
				state.page = 1;
				renderCards(root, false);
			}
		});

		root.addEventListener("click", async (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}

			const rateButton = target.closest("[data-action='rate']");
			if (rateButton) {
				event.stopPropagation();
				const path = rateButton.getAttribute("data-path") || "";
				const sourceBase = rateButton.getAttribute("data-base") || PRIMARY_CDN_BASE;
				const rating = Number(rateButton.getAttribute("data-rate") || "0");
				const game = findGame(path, sourceBase);
				if (game) {
					setRating(game, rating)
						.catch(() => {
							renderHero(root);
							renderPopular(root);
							renderCards(root, false);
						});
					renderHero(root);
					renderPopular(root);
					renderCards(root, false);
				}
				return;
			}

			const favoriteButton = target.closest("[data-action='favorite']");
			if (favoriteButton) {
				event.stopPropagation();
				const path = favoriteButton.getAttribute("data-path") || "";
				const sourceBase = favoriteButton.getAttribute("data-base") || PRIMARY_CDN_BASE;
				const game = findGame(path, sourceBase);
				if (game) {
					const current = statsForPath(game.path);
					setFavorite(game, !current.isFavorite)
						.catch(() => {
							renderHero(root);
							renderPopular(root);
							renderCards(root, false);
						});
					renderHero(root);
					renderPopular(root);
					renderCards(root, false);
				}
				return;
			}

			const pageButton = target.closest("[data-action='page']");
			if (pageButton) {
				state.page = Number(pageButton.getAttribute("data-page") || "1");
				renderCards(root, true);
				return;
			}

			const letterButton = target.closest("[data-action='letter']");
			if (letterButton) {
				state.letter = letterButton.getAttribute("data-letter") || "A";
				renderCards(root, true);
				return;
			}

			const openTrigger = target.closest(".game-open-trigger");
			if (openTrigger) {
				const path = openTrigger.getAttribute("data-path") || "";
				const sourceBase = openTrigger.getAttribute("data-base") || PRIMARY_CDN_BASE;
				const game = findGame(path, sourceBase);
				if (game) {
					try {
						await openGame(game);
					} catch (_error) {
					}
				}
				return;
			}

			const imageNode = target.closest("img[data-fallbacks]");
			if (imageNode) {
				return;
			}
		});

		root.addEventListener("error", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLImageElement)) {
				return;
			}
			const chain = (target.dataset.fallbacks || "")
				.split("|")
				.map((item) => item.trim())
				.filter(Boolean);
			if (!chain.length) {
				return;
			}
			const current = target.src;
			const next = chain.find((candidate) => {
				try {
					return new URL(candidate, window.location.origin).toString() !== current;
				} catch (_error) {
					return candidate !== current;
				}
			});
			if (next) {
				target.dataset.fallbacks = chain.filter((item) => item !== next).join("|");
				target.src = next;
			}
		}, true);
	}

	async function render() {
		const root = document.querySelector(state.mountSelector);
		if (!root) {
			return;
		}

		const authReady = await ensureAuthReady();

		if (!state.ready) {
			root.innerHTML = '<div class="text-2xl">Loading games...</div>';
			try {
				await loadGames();
			} catch (_error) {
				root.innerHTML = '<div class="text-2xl text-red-400">Unable to load games right now.</div>';
				return;
			}
		}

		await loadPopularGames(false);

		const visible = getVisibleGames();
		const extra = state.popularGames.slice(0, POPULAR_LIMIT);
		const hero = getHeroGame();
		const paths = [...new Set([
			...visible.map((game) => game.path),
			...extra.map((game) => game.path),
			hero ? hero.path : ""
		].filter(Boolean))];

		warmGameImages([
			hero,
			...extra.slice(0, 10),
			...visible.slice(0, 24)
		].filter(Boolean));
		await ensureStats(paths);

		root.innerHTML = baseMarkup();
		bindEvents(root);
		renderHero(root);
		renderPopular(root);
		renderCards(root, false);
	}

	function mount(selector) {
		state.mountSelector = selector || state.mountSelector;
		render();
	}

	window.addEventListener("beforeunload", () => {
		if (state.presenceCleanup) {
			state.presenceCleanup();
		}
	});

	window.StarlightGames = {
		mount,
		render,
		hideOverlayInstant,
		closeOverlay,
		setFavoriteByPath: async function setFavoriteByPath(path, sourceBase, favoriteOn) {
			const game = findGame(path, sourceBase || PRIMARY_CDN_BASE);
			if (!game) {
				return;
			}
			await setFavorite(game, Boolean(favoriteOn));
			queueRender();
		}
	};
})();