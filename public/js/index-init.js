(function () {
  const ANTI_CLOSE_KEY = "starlight-anti-close-enabled";
  let skipOnce = false;

  function antiCloseEnabled() {
    const value = localStorage.getItem(ANTI_CLOSE_KEY);
    if (value === null) {
      localStorage.setItem(ANTI_CLOSE_KEY, "on");
      return true;
    }
    return value === "on";
  }

  window.StarlightAntiClose = {
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
  const routes = window.StarlightRouteModules || {};

  let routeToken = 0;
  async function router() {
    let path = window.location.pathname;

    if (window.StarlightAuthUI) {
      path = window.StarlightAuthUI.guardedPath(path);
      window.StarlightAuthUI.syncLockedState(path);
    }

    const route = routes[path] || routes["404"];
    if (!route || typeof route.render !== "function") {
      return;
    }

    if (path !== "/games" && window.StarlightGames && typeof window.StarlightGames.closeOverlay === "function") {
      try {
        await window.StarlightGames.closeOverlay();
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
      if (url !== "/games" && window.StarlightGames && typeof window.StarlightGames.hideOverlayInstant === "function") {
        try {
          window.StarlightGames.hideOverlayInstant();
        } catch (_error) {
        }
      }
      if (window.StarlightAuthUI && !window.StarlightAuthUI.isLoggedIn() && url !== "/") {
        window.StarlightAuthUI.showLockedMessage();
        window.history.replaceState({}, "", "/");
        router();
        return;
      }
      window.history.pushState({}, "", url);
      router();
    }
  });
  window.addEventListener("popstate", () => {
    if (window.location.pathname !== "/games" && window.StarlightGames && typeof window.StarlightGames.hideOverlayInstant === "function") {
      try {
        window.StarlightGames.hideOverlayInstant();
      } catch (_error) {
      }
    }
    router();
  });
  window.addEventListener("DOMContentLoaded", () => {
    if (window.StarlightAuthUI) {
      window.StarlightAuthUI.init();
    }
    router();
  });
})();
