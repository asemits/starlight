(function () {
	const CDN_BASE = "https://cdn.jsdelivr.net/gh/asemits/starlight-games@main/";
	const TREE_API = "https://api.github.com/repos/asemits/starlight-games/git/trees/main?recursive=1";
	const DEVICE_ID_KEY = "starlight-device-id";
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

	function getDeviceId() {
		let id = localStorage.getItem(DEVICE_ID_KEY);
		if (!id) {
			id = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
			localStorage.setItem(DEVICE_ID_KEY, id);
		}
		return id;
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
		const db = window.starlightDb;
		const gameId = pathToDocId(path);
		return {
			gameId,
			statsRef: db.collection("gameStats").doc(gameId),
			playerRef: db.collection("gameStats").doc(gameId).collection("players").doc(getDeviceId())
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
		if (state.ready) {
			return;
		}

		if (Array.isArray(window.GAMES) && window.GAMES.length) {
			state.games = window.GAMES.map((game) => ({ ...game }));
			state.ready = true;
			return;
		}

		const response = await fetch(TREE_API, { cache: "no-store" });
		const payload = await response.json();
		const tree = Array.isArray(payload.tree) ? payload.tree : [];
		const files = new Set(tree.map((entry) => entry.path));
		const htmlFiles = tree
			.map((entry) => entry.path)
			.filter((path) => path.toLowerCase().endsWith(".html"));

		const imageExts = ["png", "jpg", "jpeg", "webp"];
		const games = [];

		for (const htmlFile of htmlFiles) {
			const stem = htmlFile.replace(/\.html$/i, "");
			let image = "";
			for (const ext of imageExts) {
				const candidate = `${stem}.${ext}`;
				if (files.has(candidate)) {
					image = candidate;
					break;
				}
			}

			games.push({
				name: filenameToName(htmlFile),
				path: htmlFile,
				type: defaultTypeFromName(filenameToName(htmlFile)),
				image
			});
		}

		state.games = games.sort((a, b) => a.name.localeCompare(b.name));
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

	async function ensureStats(paths) {
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
		const image = game.image ? `${CDN_BASE}${encodeURI(game.image)}` : "";
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
		const heroImage = heroGame && heroGame.image ? `${CDN_BASE}${encodeURI(heroGame.image)}` : "";

		return `
			<style>
				.games-page { --panel:#666; --panel-edge:#4b4b4d; --ink:#efefef; --card:#4b4b4d; --thumb:#000; --accent:#f4f4f4; font-family:'Oxanium', 'Montserrat', sans-serif; color:var(--ink); }
				.games-hero { background:var(--panel-edge); border-radius:88px; padding:28px; margin-bottom:30px; }
				.games-hero-card { max-width:1040px; margin:0 auto; border-radius:86px; background:var(--panel-edge); padding:34px 30px 16px; }
				.games-hero-thumb { width:100%; max-height:520px; object-fit:cover; border-radius:56px; background:#000; aspect-ratio:16/9; }
				.games-hero-name { text-align:center; font-size:56px; margin-top:14px; letter-spacing:0.02em; }
				.games-popular { background:var(--panel); border-radius:70px; padding:30px; margin-bottom:26px; }
				.games-popular-title { font-size:42px; margin:6px 0 20px; }
				.games-popular-row { display:flex; align-items:center; gap:14px; }
				.games-slide-btn { flex:0 0 40px; height:260px; border-radius:8px; border:0; background:#4f4f52; color:#111; font-size:24px; }
				.games-popular-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:14px; width:100%; }
				.game-pop-card { background:var(--card); border-radius:46px; padding:14px 14px 8px; cursor:pointer; }
				.game-pop-thumb { width:100%; aspect-ratio:16/10; object-fit:cover; border-radius:34px; background:#000; }
				.game-pop-name { text-align:center; font-size:36px; margin:8px 0 4px; }
				.games-toolbar { display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:center; margin:18px 0; }
				.games-search { width:280px; max-width:100%; border-radius:12px; border:1px solid #8f8f90; background:#151515; color:#fff; padding:10px 12px; }
				.games-card-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:16px; }
				.game-card { background:#323233; border-radius:24px; padding:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.08); }
				.game-thumb-wrap { border-radius:16px; overflow:hidden; background:#000; }
				.game-thumb { width:100%; height:140px; object-fit:cover; display:block; }
				.game-thumb.placeholder { height:140px; display:flex; align-items:center; justify-content:center; color:#bcbcbc; }
				.game-name { font-size:18px; margin:10px 0 4px; line-height:1.25; }
				.game-type { font-size:12px; opacity:.8; text-transform:uppercase; letter-spacing:.08em; margin:0; }
				.game-card-actions { display:flex; gap:8px; margin-top:10px; }
				.rate-btn { border:1px solid rgba(255,255,255,0.18); border-radius:999px; padding:6px 10px; font-size:12px; background:rgba(0,0,0,0.45); color:#fff; }
				.rate-btn.active { background:#fff; color:#111; }
				.games-page-nav, .games-alpha-nav { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }
				.games-page-btn { border:1px solid rgba(255,255,255,0.22); border-radius:10px; background:#1f1f20; color:#fff; padding:6px 10px; min-width:36px; }
				.games-page-btn.active { background:#fff; color:#111; }
				.game-overlay { position:fixed; inset:0; z-index:9999; background:#030303; display:flex; flex-direction:column; }
				.game-frame-wrap { flex:1; min-height:0; }
				.game-frame { width:100%; height:100%; border:0; background:#000; }
				.game-bottom-bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between; padding:10px 12px; border-top:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.92); }
				.bar-left, .bar-right { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
				.bar-btn { border:1px solid rgba(255,255,255,0.25); background:#101010; color:#fff; border-radius:10px; padding:7px 10px; font-size:13px; }
				.bar-stats { font-size:12px; opacity:.9; }
				@media (max-width: 900px) {
					.games-hero { border-radius:36px; padding:14px; }
					.games-hero-card { border-radius:30px; padding:12px; }
					.games-hero-thumb { border-radius:20px; }
					.games-hero-name { font-size:34px; }
					.games-popular { border-radius:24px; padding:12px; }
					.games-popular-title { font-size:28px; margin-top:2px; }
					.games-slide-btn { height:188px; }
					.game-pop-card { border-radius:20px; }
					.game-pop-thumb { border-radius:14px; }
					.game-pop-name { font-size:20px; }
					.games-popular-grid { grid-template-columns:1fr; }
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
									const thumb = game.image ? `${CDN_BASE}${encodeURI(game.image)}` : "";
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

	function bindPageEvents(root) {
		const searchInput = root.querySelector("#games-search");
		if (searchInput) {
			searchInput.addEventListener("input", (event) => {
				state.search = event.target.value;
				state.page = 1;
				render();
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
				render();
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
		const overlay = document.createElement("div");
		overlay.className = "game-overlay";
		overlay.innerHTML = `
			<div class="game-frame-wrap" id="game-frame-wrap">
				<iframe class="game-frame" src="${CDN_BASE}${encodeURI(game.path)}" allowfullscreen></iframe>
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
			const targetUrl = `${CDN_BASE}${encodeURI(game.path)}`;
			const blobHtml = `<!doctype html><html><body style="margin:0;background:#000;"><iframe src="${targetUrl}" style="border:0;width:100vw;height:100vh" allowfullscreen></iframe></body></html>`;
			const blob = new Blob([blobHtml], { type: "text/html" });
			const blobUrl = URL.createObjectURL(blob);
			window.open(blobUrl, "_blank", "noopener,noreferrer");
			setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
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
