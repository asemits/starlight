const CACHE_PREFIX = "nebula-cache-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const PRECACHE_URLS = ["/", "/index.html"];
const notificationPreferences = {
    inApp: true,
    os: true,
    messages: true,
    friendRequests: true
};

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
        await self.clients.claim();
    })());
});

// --- UPDATED MESSAGE LISTENER ---
self.addEventListener("message", (event) => {
    const payload = event && event.data ? event.data : null;
    if (!payload) return;

  if (payload.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

    // 1. Handle original Nebula Preferences
    if (payload.type === "nebula-notification-preferences") {
        const next = payload.preferences && typeof payload.preferences === "object" ? payload.preferences : {};
        notificationPreferences.inApp = next.inApp !== false;
        notificationPreferences.os = next.os !== false;
        notificationPreferences.messages = next.messages !== false;
        notificationPreferences.friendRequests = next.friendRequests !== false;
    }

    // 2. NEW: Handle Background Timer/Reminders
    if (payload.type === 'SET_REMINDER' && notificationPreferences.os) {
        const { delay, text } = payload;
        
        // We use a timeout in the worker. Note: browsers may throttle 
        // timeouts if the device is in heavy sleep, but for short 
        // timers (minutes) this works well.
        setTimeout(() => {
            self.registration.showNotification("Nebula Reminder", {
                body: text,
                icon: "/icon.png", // Ensure this path is correct
                vibrate: [200, 100, 200],
                data: {
                    route: "/timer", // Where to go when clicked
                    isReminder: true
                }
            });
        }, delay);
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const data = event.notification && event.notification.data ? event.notification.data : {};
    
    // Determine route: use the one from data (for reminders) or default to /chat
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

            if (!targetClient) targetClient = allClients[0];

            await targetClient.focus();
            
            // Notify the app which route to navigate to
            targetClient.postMessage({
                type: "nebula-notification-click",
                route
            });
            return;
        }
        // If no windows are open, open a new one to the specific route
        await self.clients.openWindow(route);
    })());
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (!req || req.method !== "GET") {
        return;
    }

    let url;
    try {
        url = new URL(req.url);
    } catch (_error) {
        return;
    }

    if (url.origin !== self.location.origin) {
        return;
    }

    if (req.mode === "navigate") {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(req);
                const cache = await caches.open(CACHE_NAME);
                await cache.put(req, networkResponse.clone());
                return networkResponse;
            } catch (_error) {
                const cachedPage = await caches.match(req);
                if (cachedPage) {
                    return cachedPage;
                }
                return caches.match("/index");
            }
        })());
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        const networkPromise = fetch(req).then(async (response) => {
            if (response && response.ok) {
                await cache.put(req, response.clone());
            }
            return response;
        }).catch(() => null);

        if (cached) {
            event.waitUntil(networkPromise);
            return cached;
        }

        const network = await networkPromise;
        if (network) {
            return network;
        }

        return Response.error();
    })());
});