const CACHE_VERSION = "starlight-cache-v1";
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		const names = await caches.keys();
		await Promise.all(names.filter((name) => !name.startsWith(CACHE_VERSION)).map((name) => caches.delete(name)));
		await self.clients.claim();
	})());
});

function shouldCacheFirst(request, url) {
	if (request.method !== "GET") {
		return false;
	}

	if (request.destination === "image") {
		return true;
	}

	if (url.pathname.endsWith("/gameslist.js") || url.pathname.endsWith("/public/gameslist.js")) {
		return true;
	}

	return false;
}

async function cacheFirst(request) {
	const cache = await caches.open(RUNTIME_CACHE);
	const cached = await cache.match(request);
	if (cached) {
		fetch(request)
			.then((response) => {
				if (response && (response.ok || response.type === "opaque")) {
					cache.put(request, response.clone());
				}
			})
			.catch(() => {});
		return cached;
	}

	const response = await fetch(request);
	if (response && (response.ok || response.type === "opaque")) {
		cache.put(request, response.clone());
	}
	return response;
}

self.addEventListener("fetch", (event) => {
	const request = event.request;
	const url = new URL(request.url);

	if (!shouldCacheFirst(request, url)) {
		return;
	}

	event.respondWith(cacheFirst(request));
});
