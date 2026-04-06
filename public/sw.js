const CACHE_PREFIX = "nebula-cache-";
const notificationPreferences = {
	inApp: true,
	os: true,
	messages: true,
	friendRequests: true
};

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		const names = await caches.keys();
		await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name)));
		await self.clients.claim();
	})());
});

self.addEventListener("message", (event) => {
	const payload = event && event.data ? event.data : null;
	if (!payload || payload.type !== "nebula-notification-preferences") {
		return;
	}
	const next = payload.preferences && typeof payload.preferences === "object" ? payload.preferences : {};
	notificationPreferences.inApp = next.inApp !== false;
	notificationPreferences.os = next.os !== false;
	notificationPreferences.messages = next.messages !== false;
	notificationPreferences.friendRequests = next.friendRequests !== false;
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const data = event.notification && event.notification.data ? event.notification.data : {};
	const route = typeof data.route === "string" && data.route ? data.route : "/chat";

	event.waitUntil((async () => {
		const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
		if (allClients.length) {
			let targetClient = allClients.find((client) => {
				try {
					return new URL(client.url).origin === self.location.origin;
				} catch (_error) {
					return false;
				}
			});
			if (!targetClient) {
				targetClient = allClients[0];
			}
			await targetClient.focus();
			targetClient.postMessage({
				type: "nebula-notification-click",
				route
			});
			return;
		}
		await self.clients.openWindow(route);
	})());
});
