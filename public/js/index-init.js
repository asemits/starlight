(function () {
  const ANTI_CLOSE_KEY = "nebula-anti-close-enabled";
  const PENDING_GAME_LAUNCH_KEY = "nebula-pending-game-launch";
  let skipOnce = false;

  function antiCloseEnabled() {
    const value = localStorage.getItem(ANTI_CLOSE_KEY);
    if (value === null) {
      localStorage.setItem(ANTI_CLOSE_KEY, "on");
      return true;
    }
    return value === "on";
  }

  window.NebulaAntiClose = {
    enable() {
      localStorage.setItem(ANTI_CLOSE_KEY, "on");
    },
    disable() {
      localStorage.setItem(ANTI_CLOSE_KEY, "off");
    },
    bypassNextClose() {
      skipOnce = true;
      window.setTimeout(() => {
        skipOnce = false;
      }, 1000);
    }
  };

  window.addEventListener("beforeunload", (event) => {
    if (skipOnce || !antiCloseEnabled()) {
      return;
    }
    event.preventDefault();
    event.returnValue = "";
  });

  const appContent = document.getElementById("app-content");
  const routes = window.NebulaRouteModules || {};

  let routeToken = 0;
  async function router() {
    let path = window.location.pathname;

    if (path !== "/games" && window.NebulaGames && typeof window.NebulaGames.hideOverlayInstant === "function") {
      try {
        window.NebulaGames.hideOverlayInstant();
      } catch (_error) {
      }
    }

    if (window.NebulaAuthUI) {
      path = window.NebulaAuthUI.guardedPath(path);
      window.NebulaAuthUI.syncLockedState(path);
    }

    if (path !== "/private-chat" && path !== "/chat" && window.NebulaPrivateChat && typeof window.NebulaPrivateChat.unmount === "function") {
      window.NebulaPrivateChat.unmount();
    }

    appContent.classList.toggle("nebula-chat-screen", path === "/private-chat" || path === "/chat");

    const route = routes[path] || routes["404"];
    if (!route || typeof route.render !== "function") {
      return;
    }

    if (path !== "/games" && window.NebulaGames && typeof window.NebulaGames.closeOverlay === "function") {
      try {
        await window.NebulaGames.closeOverlay();
      } catch (_error) {
      }
    }

    const token = ++routeToken;
    appContent.classList.add("route-exit");
    await new Promise((resolve) => setTimeout(resolve, 170));
    if (token !== routeToken) {
      return;
    }

    appContent.innerHTML = route.render();
    appContent.classList.remove("route-exit");
    appContent.classList.add("route-enter");
    requestAnimationFrame(() => {
      appContent.classList.remove("route-enter");
    });

    if (typeof route.afterRender === "function") {
      route.afterRender(path);
    }
  }
  window.router = router;
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (link) {
      e.preventDefault();
      const url = link.getAttribute("href");
      let nextUrl = url;
      if (url === "/games") {
        const gamePath = String(link.getAttribute("data-game-path") || "").trim();
        const sourceBase = String(link.getAttribute("data-source-base") || "").trim();
        if (gamePath) {
          try {
            sessionStorage.setItem(PENDING_GAME_LAUNCH_KEY, JSON.stringify({
              path: gamePath,
              sourceBase
            }));
          } catch (_error) {
          }
          nextUrl = `/games?play=${encodeURIComponent(gamePath)}${sourceBase ? `&base=${encodeURIComponent(sourceBase)}` : ""}`;
        }
      }
      if (url !== "/games" && window.NebulaGames && typeof window.NebulaGames.hideOverlayInstant === "function") {
        try {
          window.NebulaGames.hideOverlayInstant();
        } catch (_error) {
        }
      }
      if (window.NebulaAuthUI && !window.NebulaAuthUI.isLoggedIn() && url !== "/") {
        window.NebulaAuthUI.showLockedMessage();
        window.history.replaceState({}, "", "/");
        router();
        return;
      }
      window.history.pushState({}, "", nextUrl);
      router();
    }
  });
  window.addEventListener("popstate", () => {
    if (window.location.pathname !== "/games" && window.NebulaGames && typeof window.NebulaGames.hideOverlayInstant === "function") {
      try {
        window.NebulaGames.hideOverlayInstant();
      } catch (_error) {
      }
    }
    router();
  });
  window.addEventListener("DOMContentLoaded", () => {
    if (window.NebulaAuthUI) {
      window.NebulaAuthUI.init();
    }
    router();
  });
})();