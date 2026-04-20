(function () {
  function decodeFirebaseValue(obfuscated) {
    let output = "";
    for (let i = 0; i < obfuscated.length; i += 1) {
      output += String.fromCharCode(obfuscated[i] ^ 73);
    }
    return output;
  }

  const firebaseConfig = {
    apiKey: decodeFirebaseValue([8, 0, 51, 40, 26, 48, 8, 40, 6, 57, 122, 5, 16, 38, 4, 14, 43, 11, 48, 6, 7, 126, 30, 126, 57, 14, 24, 16, 31, 22, 38, 17, 3, 37, 36, 28, 22, 1, 62]),
    authDomain: decodeFirebaseValue([39, 44, 43, 60, 37, 40, 100, 121, 112, 58, 37, 123, 103, 47, 32, 59, 44, 43, 40, 58, 44, 40, 57, 57, 103, 42, 38, 36]),
    databaseURL: decodeFirebaseValue([33, 61, 61, 57, 58, 115, 102, 102, 58, 61, 40, 59, 37, 32, 46, 33, 61, 100, 123, 113, 44, 125, 121, 100, 45, 44, 47, 40, 60, 37, 61, 100, 59, 61, 45, 43, 103, 47, 32, 59, 44, 43, 40, 58, 44, 32, 38, 103, 42, 38, 36]),
    projectId: decodeFirebaseValue([58, 61, 40, 59, 37, 32, 46, 33, 61, 100, 123, 113, 44, 125, 121]),
    storageBucket: decodeFirebaseValue([58, 61, 40, 59, 37, 32, 46, 33, 61, 100, 123, 113, 44, 125, 121, 103, 47, 32, 59, 44, 43, 40, 58, 44, 58, 61, 38, 59, 40, 46, 44, 103, 40, 57, 57]),
    messagingSenderId: decodeFirebaseValue([123, 121, 127, 113, 124, 112, 122, 120, 121, 123, 120, 120]),
    appId: decodeFirebaseValue([120, 115, 123, 121, 127, 113, 124, 112, 122, 120, 121, 123, 120, 120, 115, 62, 44, 43, 115, 122, 125, 124, 121, 42, 47, 40, 112, 47, 40, 44, 126, 47, 127, 122, 127, 121, 40, 126, 126, 43, 127]),
    measurementId: decodeFirebaseValue([14, 100, 14, 124, 123, 29, 13, 1, 127, 14, 27, 16])
  };

  const SHORTCUT_KEY = "tab-shortcut-combo";
  const SHORTCUT_TARGET_KEY = "tab-shortcut-target";
  const SHORTCUT_ENABLED_KEY = "tab-shortcut-enabled";
  const WRAP_MODE_KEY = "site-wrap-mode";
  const WRAP_ENABLED_KEY = "site-wrap-enabled";
  const WRAP_LAST_URL_KEY = "site-wrap-last-url";
  const ANTI_CLOSE_KEY = "nebula-anti-close-enabled";
  const WIDGET_ENABLED_KEY = "info-widget-enabled";
  const WIDGET_TIME_MODE_KEY = "info-widget-time-mode";
  const WIDGET_FORMAT_KEY = "info-widget-format";
  const WIDGET_POS_X_KEY = "info-widget-pos-x";
  const WIDGET_POS_Y_KEY = "info-widget-pos-y";
  const WIDGET_SHOW_WEATHER_KEY = "info-widget-show-weather";
  const WIDGET_SHOW_DATETIME_KEY = "info-widget-show-datetime";
  const WIDGET_SHOW_BATTERY_KEY = "info-widget-show-battery";
  const DASHBOARD_SHOW_RECENT_KEY = "dashboard-show-recent";
  const DASHBOARD_SHOW_FAVORITES_KEY = "dashboard-show-favorites";
  const DASHBOARD_SHOW_STATS_KEY = "dashboard-show-stats";
  const DASHBOARD_SHOW_RECENT_MUSIC_KEY = "dashboard-show-recent-music";
  const MEASUREMENT_SYSTEM_KEY = "nebula-measurement-system";
  const WIDGET_WEATHER_CACHE_KEY = "nebula-widget-weather-current";
  const NOTIFY_INAPP_KEY = "nebula-notify-inapp";
  const NOTIFY_OS_KEY = "nebula-notify-os";
  const NOTIFY_MESSAGES_KEY = "nebula-notify-messages";
  const NOTIFY_FRIEND_REQUESTS_KEY = "nebula-notify-friend-requests";
  const FONT_KEY = "nebula-font";
  const FONT_MODE_KEY = "nebula-font-mode";
  const FONT_CUSTOM_URL_KEY = "nebula-font-custom-url";
  const FONT_CUSTOM_FAMILY_KEY = "nebula-font-custom-family";
  const FONT_UPLOAD_DATA_KEY = "nebula-font-upload-data";
  const FONT_UPLOAD_FAMILY_KEY = "nebula-font-upload-family";
  const FONT_UPLOAD_FORMAT_KEY = "nebula-font-upload-format";
  const GAMES_BACKGROUND_UPDATED_AT_KEY = "games-background-updated-at";

  const FONT_PRESETS = [
    { id: "geist", label: "Geist", family: "Geist", stack: "'Geist','Montserrat','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" },
    { id: "montserrat", label: "Montserrat", family: "Montserrat", stack: "'Montserrat','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" },
    { id: "inter", label: "Inter", family: "Inter", stack: "'Inter','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    { id: "poppins", label: "Poppins", family: "Poppins", stack: "'Poppins','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" },
    { id: "outfit", label: "Outfit", family: "Outfit", stack: "'Outfit','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" },
    { id: "sora", label: "Sora", family: "Sora", stack: "'Sora','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" },
    { id: "manrope", label: "Manrope", family: "Manrope", stack: "'Manrope','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" },
    { id: "nunito", label: "Nunito", family: "Nunito", stack: "'Nunito','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" },
    { id: "rubik", label: "Rubik", family: "Rubik", stack: "'Rubik','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap" },
    { id: "dm-sans", label: "DM Sans", family: "DM Sans", stack: "'DM Sans','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" },
    { id: "space-grotesk", label: "Space Grotesk", family: "Space Grotesk", stack: "'Space Grotesk','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" },
    { id: "merriweather", label: "Merriweather", family: "Merriweather", stack: "'Merriweather','Georgia',serif", cssUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap" },
    { id: "playfair", label: "Playfair Display", family: "Playfair Display", stack: "'Playfair Display','Times New Roman',serif", cssUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700;800&display=swap" },
    { id: "cormorant", label: "Cormorant Garamond", family: "Cormorant Garamond", stack: "'Cormorant Garamond','Georgia',serif", cssUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap" },
    { id: "source-code-pro", label: "Source Code Pro", family: "Source Code Pro", stack: "'Source Code Pro','Fira Code',monospace", cssUrl: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;700&display=swap" },
    { id: "fira-code", label: "Fira Code", family: "Fira Code", stack: "'Fira Code','Consolas',monospace", cssUrl: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap" },
    { id: "oxanium", label: "Oxanium", family: "Oxanium", stack: "'Oxanium','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700&display=swap" },
    { id: "orbitron", label: "Orbitron", family: "Orbitron", stack: "'Orbitron','Segoe UI',sans-serif", cssUrl: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&display=swap" },
    { id: "system", label: "System", family: "System UI", stack: "system-ui,-apple-system,'Segoe UI',sans-serif" }
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeTarget(input) {
    const raw = String(input || "").trim();
    if (!raw) {
      return "/";
    }
    if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) {
      return raw;
    }
    return "/" + raw;
  }

  function nebulaPresetById(id) {
    const target = String(id || "").trim();
    for (let i = 0; i < FONT_PRESETS.length; i += 1) {
      if (FONT_PRESETS[i].id === target) {
        return FONT_PRESETS[i];
      }
    }
    return FONT_PRESETS[0];
  }

  function ensureNebulaFontLink(href, idSuffix) {
    if (!href) {
      return;
    }
    const id = "nebula-font-link-" + String(idSuffix || "preset");
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.href = href;
    }
  }

  function setNebulaFontStyle(cssText) {
    let style = document.getElementById("nebula-font-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "nebula-font-style";
      document.head.appendChild(style);
    }
    style.textContent = cssText;
  }

  function buildNebulaFontCss(stack, extraFaceCss) {
    const face = String(extraFaceCss || "");
    const safeStack = String(stack || "'Geist','Montserrat','Segoe UI',sans-serif");
    return `${face}
      :root { --nebula-user-font: ${safeStack}; }
      body,
      body *:not(i):not(.fa):not(.fa-solid):not(.fa-regular):not(.fa-brands):not([class^="fa-"]):not([class*=" fa-"])
      { font-family: var(--nebula-user-font) !important; }
    `;
  }

  function applyNebulaFontPreset(presetId) {
    const preset = nebulaPresetById(presetId);
    if (preset.cssUrl) {
      ensureNebulaFontLink(preset.cssUrl, "preset");
    }
    setNebulaFontStyle(buildNebulaFontCss(preset.stack, ""));
  }

  function applyNebulaFontFromUrl(fontUrl, familyName) {
    const safeUrl = String(fontUrl || "").trim();
    const safeFamily = String(familyName || "").trim().slice(0, 80);
    if (!safeUrl || !safeFamily) {
      return;
    }
    const lowerUrl = safeUrl.toLowerCase();
    if (lowerUrl.endsWith(".css") || lowerUrl.includes("fonts.googleapis.com")) {
      ensureNebulaFontLink(safeUrl, "custom-url");
      setNebulaFontStyle(buildNebulaFontCss(`'${safeFamily}','Segoe UI',sans-serif`, ""));
      return;
    }
    setNebulaFontStyle(buildNebulaFontCss(
      `'NebulaCustomUrlFont','${safeFamily}','Segoe UI',sans-serif`,
      `@font-face { font-family: 'NebulaCustomUrlFont'; src: url('${safeUrl}'); font-display: swap; }`
    ));
  }

  function applyNebulaFontFromUpload(dataUrl, familyName, formatHint) {
    const safeData = String(dataUrl || "").trim();
    const safeFamily = String(familyName || "").trim().slice(0, 80);
    if (!safeData || !safeFamily) {
      return;
    }
    const fmt = String(formatHint || "woff2").replace(/[^a-z0-9]/gi, "").toLowerCase() || "woff2";
    setNebulaFontStyle(buildNebulaFontCss(
      `'NebulaUploadFont','${safeFamily}','Segoe UI',sans-serif`,
      `@font-face { font-family: 'NebulaUploadFont'; src: url('${safeData}') format('${fmt}'); font-display: swap; }`
    ));
  }

  function applyNebulaSavedFont() {
    const mode = localStorage.getItem(FONT_MODE_KEY) || "preset";
    if (mode === "custom-url") {
      applyNebulaFontFromUrl(localStorage.getItem(FONT_CUSTOM_URL_KEY) || "", localStorage.getItem(FONT_CUSTOM_FAMILY_KEY) || "");
      return;
    }
    if (mode === "upload") {
      applyNebulaFontFromUpload(
        localStorage.getItem(FONT_UPLOAD_DATA_KEY) || "",
        localStorage.getItem(FONT_UPLOAD_FAMILY_KEY) || "",
        localStorage.getItem(FONT_UPLOAD_FORMAT_KEY) || "woff2"
      );
      return;
    }
    applyNebulaFontPreset(localStorage.getItem(FONT_KEY) || "geist");
  }

  function withWrappedParam(urlText) {
    try {
      const url = new URL(urlText, window.location.origin);
      url.searchParams.set("nebulaWrapped", "1");
      return url.toString();
    } catch (_error) {
      return window.location.origin + "/?nebulaWrapped=1";
    }
  }

  function cleanWrappedParam(urlText) {
    try {
      const url = new URL(urlText, window.location.origin);
      url.searchParams.delete("nebulaWrapped");
      return url.toString();
    } catch (_error) {
      return window.location.origin + "/";
    }
  }

  function wrapperHtml(targetUrl) {
    const escaped = targetUrl
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

    return `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>loading...</title>
<style>
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }
iframe { width: 100vw; height: 100vh; border: none; }
</style>
</head>
<body>
<iframe src="${escaped}" frameborder="0" allow="fullscreen"></iframe>
</body>
</html>`;
  }

  function launchWrapped(mode, targetUrl, sameTab) {
    const frameUrl = withWrappedParam(targetUrl);
    localStorage.setItem(WRAP_LAST_URL_KEY, cleanWrappedParam(targetUrl));

    if (mode === "blob") {
      const blob = new Blob([wrapperHtml(frameUrl)], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      if (sameTab) {
        window.location.replace(blobUrl);
        return true;
      }
      const win = window.open(blobUrl, "_blank", "noopener");
      return Boolean(win);
    }

    if (sameTab) {
      document.open();
      document.write(wrapperHtml(frameUrl));
      document.close();
      return true;
    }

    const win = window.open("", "_blank");
    if (!win) {
      return false;
    }
    win.document.open();
    win.document.write(wrapperHtml(frameUrl));
    win.document.close();
    return true;
  }

  function isWrappedInnerPage() {
    if (new URLSearchParams(window.location.search).get("nebulaWrapped") === "1") {
      return true;
    }
    try {
      return window.top !== window.self && localStorage.getItem(WRAP_ENABLED_KEY) === "on";
    } catch (_error) {
      return true;
    }
  }

  let sidebarSafeAreaResizeObserver = null;

  function setSidebarSafeArea(top, right, bottom, left) {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--sidebar-safe-top", `${top}px`);
    rootStyle.setProperty("--sidebar-safe-right", `${right}px`);
    rootStyle.setProperty("--sidebar-safe-bottom", `${bottom}px`);
    rootStyle.setProperty("--sidebar-safe-left", `${left}px`);
  }

  function updateSidebarSafeArea() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) {
      setSidebarSafeArea(0, 0, 0, 0);
      return;
    }

    const side = document.body.getAttribute("data-side") || "top";
    const rect = sidebar.getBoundingClientRect();
    const width = window.innerWidth || document.documentElement.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight;
    const gap = 12;

    let top = 0;
    let right = 0;
    let bottom = 0;
    let left = 0;

    if (side === "bottom") {
      bottom = Math.max(0, Math.ceil(height - rect.top + gap));
    } else if (side === "left") {
      left = Math.max(0, Math.ceil(rect.right + gap));
    } else if (side === "right") {
      right = Math.max(0, Math.ceil(width - rect.left + gap));
    } else {
      top = Math.max(0, Math.ceil(rect.bottom + gap));
    }

    setSidebarSafeArea(top, right, bottom, left);
  }

  function bindSidebarSafeAreaTracking() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) {
      setSidebarSafeArea(0, 0, 0, 0);
      return;
    }

    if (typeof ResizeObserver === "function" && !sidebarSafeAreaResizeObserver) {
      sidebarSafeAreaResizeObserver = new ResizeObserver(() => {
        updateSidebarSafeArea();
      });
      sidebarSafeAreaResizeObserver.observe(sidebar);
    }

    function refreshSafeAreaAfterTransition() {
      updateSidebarSafeArea();
      window.setTimeout(updateSidebarSafeArea, 450);
    }

    sidebar.addEventListener("transitionend", updateSidebarSafeArea);
    sidebar.addEventListener("mouseenter", refreshSafeAreaAfterTransition);
    sidebar.addEventListener("mouseleave", refreshSafeAreaAfterTransition);
    window.addEventListener("resize", updateSidebarSafeArea);

    updateSidebarSafeArea();
    window.requestAnimationFrame(updateSidebarSafeArea);
  }

  function saveSidebarPosition(newPos) {
    document.body.setAttribute("data-side", newPos);
    localStorage.setItem("sidebar-pos", newPos);
    updateSidebarSafeArea();
    window.requestAnimationFrame(updateSidebarSafeArea);
    window.setTimeout(updateSidebarSafeArea, 450);
  }

  function randomUnit() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }

  let nebulaNotificationToastHost = null;

  function notificationDefaults() {
    return {
      inApp: true,
      os: true,
      messages: true,
      friendRequests: true
    };
  }

  function readNotificationPreferences() {
    const defaults = notificationDefaults();
    return {
      inApp: localStorage.getItem(NOTIFY_INAPP_KEY) === "off" ? false : defaults.inApp,
      os: localStorage.getItem(NOTIFY_OS_KEY) === "off" ? false : defaults.os,
      messages: localStorage.getItem(NOTIFY_MESSAGES_KEY) === "off" ? false : defaults.messages,
      friendRequests: localStorage.getItem(NOTIFY_FRIEND_REQUESTS_KEY) === "off" ? false : defaults.friendRequests
    };
  }

  function notificationPreferenceStorageKey(category) {
    if (category === "inApp") {
      return NOTIFY_INAPP_KEY;
    }
    if (category === "os") {
      return NOTIFY_OS_KEY;
    }
    if (category === "messages") {
      return NOTIFY_MESSAGES_KEY;
    }
    if (category === "friendRequests") {
      return NOTIFY_FRIEND_REQUESTS_KEY;
    }
    return "";
  }

  function syncNotificationPreferencesToServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const payload = {
      type: "nebula-notification-preferences",
      preferences: readNotificationPreferences()
    };

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(payload);
    }

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && registration.active) {
        registration.active.postMessage(payload);
      }
    }).catch(() => {});
  }

  function openNotificationRoute(routeText) {
    const route = normalizeTarget(routeText || "/chat");
    if (window.location.pathname === route) {
      return;
    }
    window.history.pushState({}, "", route);
    if (typeof window.router === "function") {
      window.router();
    }
  }

  function ensureNotificationToastHost() {
    if (nebulaNotificationToastHost && document.body.contains(nebulaNotificationToastHost)) {
      return nebulaNotificationToastHost;
    }
    let host = document.getElementById("nebula-notification-stack");
    if (!host) {
      host = document.createElement("div");
      host.id = "nebula-notification-stack";
      host.className = "nebula-notification-stack";
      document.body.appendChild(host);
    }
    nebulaNotificationToastHost = host;
    return host;
  }

  function showInAppNotificationToast(payload) {
    const host = ensureNotificationToastHost();
    const toast = document.createElement("article");
    toast.className = "nebula-notification-toast";
    const title = escapeHtml(String(payload.title || "Notification"));
    const body = escapeHtml(String(payload.body || ""));
    const actionLabel = escapeHtml(String(payload.actionLabel || "Open"));
    const route = escapeHtml(String(payload.route || "/chat"));
    toast.innerHTML = `
      <div class="nebula-notification-content">
        <h4>${title}</h4>
        <p>${body}</p>
      </div>
      <div class="nebula-notification-actions">
        <button type="button" class="nebula-notification-open" data-notification-route="${route}">${actionLabel}</button>
        <button type="button" class="nebula-notification-dismiss" aria-label="Dismiss notification"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;

    const dismiss = () => {
      toast.classList.add("is-removing");
      window.setTimeout(() => {
        toast.remove();
      }, 220);
    };

    const openBtn = toast.querySelector(".nebula-notification-open");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        openNotificationRoute(String(payload.route || "/chat"));
        dismiss();
      });
    }

    const dismissBtn = toast.querySelector(".nebula-notification-dismiss");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", dismiss);
    }

    host.appendChild(toast);
    window.setTimeout(dismiss, 9000);
  }

  function shouldShowNotificationType(preferences, type) {
    if (type === "message") {
      return preferences.messages;
    }
    if (type === "friend-request") {
      return preferences.friendRequests;
    }
    return true;
  }

  function normalizeNotificationPayload(input) {
    const raw = input && typeof input === "object" ? input : {};
    const type = String(raw.type || "generic");
    const route = normalizeTarget(raw.route || (type === "message" || type === "friend-request" ? "/chat" : "/"));
    return {
      type,
      title: String(raw.title || "Notification").slice(0, 140),
      body: String(raw.body || "").slice(0, 420),
      route,
      actionLabel: String(raw.actionLabel || "Open").slice(0, 28),
      tag: String(raw.tag || `${type}:${Date.now()}`).slice(0, 160)
    };
  }

  window.getNebulaNotificationPreferences = function getNebulaNotificationPreferences() {
    return readNotificationPreferences();
  };

  window.setNebulaNotificationPreference = function setNebulaNotificationPreference(category, enabled) {
    const key = notificationPreferenceStorageKey(String(category || ""));
    if (!key) {
      return;
    }
    localStorage.setItem(key, enabled ? "on" : "off");
    syncNotificationPreferencesToServiceWorker();
    window.dispatchEvent(new CustomEvent("nebula:notification-preferences-changed", {
      detail: readNotificationPreferences()
    }));
  };

  window.requestNebulaNotificationPermission = async function requestNebulaNotificationPermission() {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    try {
      return await Notification.requestPermission();
    } catch (_error) {
      return Notification.permission || "default";
    }
  };

  window.showNebulaNotification = async function showNebulaNotification(input) {
    const payload = normalizeNotificationPayload(input);
    const preferences = readNotificationPreferences();
    if (!shouldShowNotificationType(preferences, payload.type)) {
      return;
    }

    if (preferences.inApp) {
      showInAppNotificationToast(payload);
    }

    if (!preferences.os) {
      return;
    }
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && typeof registration.showNotification === "function") {
          await registration.showNotification(payload.title, {
            body: payload.body,
            tag: payload.tag,
            data: {
              route: payload.route,
              type: payload.type
            }
          });
          return;
        }
      } catch (_error) {
      }
    }

    try {
      const osNotification = new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        data: {
          route: payload.route,
          type: payload.type
        }
      });
      osNotification.onclick = () => {
        window.focus();
        openNotificationRoute(payload.route);
      };
    } catch (_error) {
    }
  };

  syncNotificationPreferencesToServiceWorker();

  window.changeSidebarPos = function changeSidebarPos(newPos) {
    saveSidebarPosition(newPos);
  };

  window.getMeasurementSystem = function getMeasurementSystem() {
    return localStorage.getItem(MEASUREMENT_SYSTEM_KEY) === "metric" ? "metric" : "imperial";
  };

  window.changeMeasurementSystem = function changeMeasurementSystem(value) {
    const system = value === "metric" ? "metric" : "imperial";
    localStorage.setItem(MEASUREMENT_SYSTEM_KEY, system);
    window.dispatchEvent(new CustomEvent("nebula:measurement-changed", { detail: { system } }));
    if (window.location.pathname === "/weather" && window.NebulaWeather && typeof window.NebulaWeather.refresh === "function") {
      window.NebulaWeather.refresh();
    }
  };

  window.getNebulaFontChoices = function getNebulaFontChoices() {
    return FONT_PRESETS.map((item) => ({ id: item.id, label: item.label }));
  };

  window.getNebulaFontPreset = function getNebulaFontPreset() {
    const id = localStorage.getItem(FONT_KEY) || "geist";
    return nebulaPresetById(id).id;
  };

  window.changeNebulaFontPreset = function changeNebulaFontPreset(presetId) {
    const preset = nebulaPresetById(presetId);
    localStorage.setItem(FONT_KEY, preset.id);
    localStorage.setItem(FONT_MODE_KEY, "preset");
    applyNebulaFontPreset(preset.id);
  };

  window.applyNebulaCustomFontUrl = function applyNebulaCustomFontUrl(fontUrl, familyName) {
    const url = String(fontUrl || "").trim();
    const family = String(familyName || "").trim();
    if (!/^https:\/\//i.test(url) || !family) {
      return false;
    }
    localStorage.setItem(FONT_MODE_KEY, "custom-url");
    localStorage.setItem(FONT_CUSTOM_URL_KEY, url);
    localStorage.setItem(FONT_CUSTOM_FAMILY_KEY, family);
    applyNebulaFontFromUrl(url, family);
    return true;
  };

  window.applyNebulaUploadedFontFile = function applyNebulaUploadedFontFile(file, familyName) {
    const upload = file;
    const family = String(familyName || "").trim();
    if (!upload || !family) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function onLoad() {
        const dataUrl = String(reader.result || "");
        if (!dataUrl.startsWith("data:")) {
          resolve(false);
          return;
        }
        const type = String(upload.type || "").toLowerCase();
        const ext = String(upload.name || "").split(".").pop().toLowerCase();
        const format = type.includes("woff2") || ext === "woff2"
          ? "woff2"
          : type.includes("woff") || ext === "woff"
            ? "woff"
            : ext === "otf"
              ? "opentype"
              : "truetype";
        try {
          if (dataUrl.length <= 1800000) {
            localStorage.setItem(FONT_UPLOAD_DATA_KEY, dataUrl);
            localStorage.setItem(FONT_UPLOAD_FAMILY_KEY, family);
            localStorage.setItem(FONT_UPLOAD_FORMAT_KEY, format);
            localStorage.setItem(FONT_MODE_KEY, "upload");
          }
        } catch (_error) {
        }
        applyNebulaFontFromUpload(dataUrl, family, format);
        resolve(true);
      };
      reader.onerror = function onError() {
        resolve(false);
      };
      reader.readAsDataURL(upload);
    });
  };

  window.getDashboardSectionVisibility = function getDashboardSectionVisibility(section) {
    const keyMap = {
      recent: DASHBOARD_SHOW_RECENT_KEY,
      favorites: DASHBOARD_SHOW_FAVORITES_KEY,
      stats: DASHBOARD_SHOW_STATS_KEY,
      "recent-music": DASHBOARD_SHOW_RECENT_MUSIC_KEY
    };
    const key = keyMap[String(section || "")];
    if (!key) {
      return "on";
    }
    return localStorage.getItem(key) === "off" ? "off" : "on";
  };

  window.changeDashboardSectionVisibility = function changeDashboardSectionVisibility(section, value) {
    const keyMap = {
      recent: DASHBOARD_SHOW_RECENT_KEY,
      favorites: DASHBOARD_SHOW_FAVORITES_KEY,
      stats: DASHBOARD_SHOW_STATS_KEY,
      "recent-music": DASHBOARD_SHOW_RECENT_MUSIC_KEY
    };
    const key = keyMap[String(section || "")];
    if (!key) {
      return;
    }
    localStorage.setItem(key, value === "off" ? "off" : "on");
    if (window.location.pathname === "/" && typeof window.router === "function") {
      window.router();
    }
  };

  window.changeGamesPaginationMode = function changeGamesPaginationMode(newMode) {
    localStorage.setItem("games-pagination-mode", newMode);
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  window.changeGamesParticlesEnabled = function changeGamesParticlesEnabled(newValue) {
    const value = newValue === "off" ? "off" : "on";
    localStorage.setItem("games-particles-enabled", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  window.changeGamesParticlesBonds = function changeGamesParticlesBonds(newValue) {
    const value = newValue === "on" ? "on" : "off";
    localStorage.setItem("games-particles-bonds", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  window.changeGamesParticlesColor = function changeGamesParticlesColor(newColor) {
    const valid = /^#[0-9a-fA-F]{6}$/.test(newColor) ? newColor : "#ffffff";
    localStorage.setItem("games-particles-color", valid);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  window.getGamesParticlesShape = function getGamesParticlesShape() {
    const value = localStorage.getItem("games-particles-shape");
    return value === "square" || value === "triangle" ? value : "circle";
  };

  window.getGamesParticlesFrequency = function getGamesParticlesFrequency() {
    const value = localStorage.getItem("games-particles-frequency");
    return value === "low" || value === "high" ? value : "normal";
  };

  window.getGamesParticlesSize = function getGamesParticlesSize() {
    const value = localStorage.getItem("games-particles-size");
    return value === "small" || value === "large" ? value : "medium";
  };

  window.changeGamesParticlesShape = function changeGamesParticlesShape(newShape) {
    const value = newShape === "square" || newShape === "triangle" ? newShape : "circle";
    localStorage.setItem("games-particles-shape", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  window.changeGamesParticlesFrequency = function changeGamesParticlesFrequency(newFrequency) {
    const value = newFrequency === "low" || newFrequency === "high" ? newFrequency : "normal";
    localStorage.setItem("games-particles-frequency", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  window.changeGamesParticlesSize = function changeGamesParticlesSize(newSize) {
    const value = newSize === "small" || newSize === "large" ? newSize : "medium";
    localStorage.setItem("games-particles-size", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  const GAMES_BACKGROUND_PRESETS = {
    "preset-flow": "static/bg/bg1.webp",
    "preset-torus": "static/bg/bg2.webp",
    "preset-monochrome": "static/bg/bg3.webp",
    "preset-glass-plate": "static/bg/bg4.webp",
    "preset-future-city": "static/bg/bg5.webp",
    "preset-glint": "static/bg/bg6.webp",
    "live-car": "static/bg/live1.mp4"
  };

  function normalizeBackgroundMode(input) {
    const mode = String(input || "").trim();
    if (mode === "preset-flow" || mode === "preset-torus" || mode === "preset-monochrome" || mode === "preset-glass-plate" || mode === "preset-future-city" || mode === "preset-glint" || mode === "live-car" || mode === "upload") {
      return mode;
    }
    return "none";
  }

  function hasUploadedBackground() {
    const url = String(localStorage.getItem("games-background-url") || "").trim();
    return url.startsWith("data:image/");
  }

  function touchGamesBackgroundUpdatedAt() {
    localStorage.setItem(GAMES_BACKGROUND_UPDATED_AT_KEY, String(Date.now()));
  }

  window.getGamesBackgroundMode = function getGamesBackgroundMode() {
    const mode = normalizeBackgroundMode(localStorage.getItem("games-background-mode") || "none");
    if (mode === "upload" && !hasUploadedBackground()) {
      return "none";
    }
    return mode;
  };

  window.changeGamesBackgroundMode = function changeGamesBackgroundMode(nextMode) {
    const mode = normalizeBackgroundMode(nextMode);
    if (mode === "none") {
      localStorage.setItem("games-background-mode", "none");
      localStorage.removeItem("games-background-url");
    } else if (mode === "upload") {
      if (!hasUploadedBackground()) {
        localStorage.setItem("games-background-mode", "none");
      } else {
        localStorage.setItem("games-background-mode", "upload");
      }
    } else {
      localStorage.setItem("games-background-mode", mode);
      localStorage.setItem("games-background-url", GAMES_BACKGROUND_PRESETS[mode] || "");
    }

    touchGamesBackgroundUpdatedAt();

    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  window.applyGamesUploadedBackgroundFile = function applyGamesUploadedBackgroundFile(file) {
    const upload = file;
    if (!upload || !String(upload.type || "").startsWith("image/")) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function onLoad() {
        const dataUrl = String(reader.result || "");
        if (!dataUrl.startsWith("data:image/")) {
          resolve(false);
          return;
        }
        localStorage.setItem("games-background-mode", "upload");
        localStorage.setItem("games-background-url", dataUrl);
        touchGamesBackgroundUpdatedAt();
        if (window.updateGlobalParticlesSettings) {
          window.updateGlobalParticlesSettings();
        }
        if (window.location.pathname === "/games" && window.NebulaGames) {
          window.NebulaGames.render();
        }
        resolve(true);
      };
      reader.onerror = function onError() {
        resolve(false);
      };
      reader.readAsDataURL(upload);
    });
  };

  window.clearGamesBackground = function clearGamesBackground() {
    localStorage.setItem("games-background-mode", "none");
    localStorage.removeItem("games-background-url");
    touchGamesBackgroundUpdatedAt();
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.NebulaGames) {
      window.NebulaGames.render();
    }
  };

  function refreshSettingsView(preferredCategory) {
    if (window.location.pathname !== "/settings") {
      return;
    }
    const activePanel = document.querySelector("[data-settings-panel]:not(.hidden)");
    const activeCategory = preferredCategory || (activePanel ? activePanel.getAttribute("data-settings-panel") : "layout");
    if (typeof window.router === "function") {
      Promise.resolve(window.router()).finally(() => {
        if (typeof window.switchSettingsCategory === "function") {
          window.switchSettingsCategory(activeCategory || "layout");
        }
      });
      return;
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function resetSettingsCard(cardId) {
    if (cardId === "layout-sidebar") {
      window.changeSidebarPos("top");
      return;
    }
    if (cardId === "layout-measurement") {
      window.changeMeasurementSystem("imperial");
      return;
    }
    if (cardId === "layout-font") {
      window.changeNebulaFontPreset("geist");
      return;
    }
    if (cardId === "layout-dashboard-recent") {
      window.changeDashboardSectionVisibility("recent", "on");
      return;
    }
    if (cardId === "layout-dashboard-favorites") {
      window.changeDashboardSectionVisibility("favorites", "on");
      return;
    }
    if (cardId === "layout-dashboard-stats") {
      window.changeDashboardSectionVisibility("stats", "on");
      return;
    }
    if (cardId === "layout-dashboard-recent-music") {
      window.changeDashboardSectionVisibility("recent-music", "on");
      return;
    }
    if (cardId === "games-pagination") {
      window.changeGamesPaginationMode("numbered");
      return;
    }
    if (cardId === "particles-enabled") {
      window.changeGamesParticlesEnabled("on");
      return;
    }
    if (cardId === "particles-bonds") {
      window.changeGamesParticlesBonds("off");
      return;
    }
    if (cardId === "particles-color") {
      window.changeGamesParticlesColor("#ffffff");
      return;
    }
    if (cardId === "particles-shape") {
      window.changeGamesParticlesShape("circle");
      return;
    }
    if (cardId === "particles-frequency") {
      window.changeGamesParticlesFrequency("normal");
      return;
    }
    if (cardId === "particles-size") {
      window.changeGamesParticlesSize("medium");
      return;
    }
    if (cardId === "particles-background") {
      window.clearGamesBackground();
      return;
    }
    if (cardId === "shortcut-main") {
      localStorage.removeItem(SHORTCUT_KEY);
      window.changeShortcutEnabled("off");
      window.changeShortcutTarget("/");
      return;
    }
    if (cardId === "shortcut-anticlose") {
      window.changeAntiCloseEnabled("on");
      return;
    }
    if (cardId === "cloak-main") {
      window.changeWrapEnabled("off");
      window.changeWrapMode("about-blank");
      return;
    }
    if (cardId === "cloak-open") {
      window.changeWrapMode("about-blank");
      return;
    }
    if (cardId === "widget-main") {
      window.changeInfoWidgetEnabled("on");
      window.changeInfoWidgetTimeMode("12");
      return;
    }
    if (cardId === "widget-format") {
      window.changeInfoWidgetFormat("%Y-%m-%d %H:%M:%S");
      window.resetInfoWidgetPosition();
      return;
    }
    if (cardId === "widget-content") {
      window.changeInfoWidgetSectionVisibility("weather", "on");
      window.changeInfoWidgetSectionVisibility("datetime", "on");
      window.changeInfoWidgetSectionVisibility("battery", "on");
    }
  }

  window.resetSettingsCard = function exposedResetSettingsCard(cardId) {
    resetSettingsCard(String(cardId || ""));
    refreshSettingsView();
  };

  window.resetSettingsCategory = function resetSettingsCategory(category) {
    const map = {
      layout: ["layout-sidebar", "layout-measurement", "layout-font", "layout-dashboard-recent", "layout-dashboard-favorites", "layout-dashboard-stats", "layout-dashboard-recent-music", "games-pagination"],
      games: ["games-pagination"],
      particles: ["particles-enabled", "particles-bonds", "particles-color", "particles-shape", "particles-frequency", "particles-size"],
      shortcut: ["shortcut-main", "shortcut-anticlose"],
      cloak: ["cloak-main", "cloak-open"],
      widget: ["widget-main", "widget-format", "widget-content"]
    };
    const keys = map[String(category || "")] || [];
    keys.forEach((key) => resetSettingsCard(key));
    refreshSettingsView(String(category || "layout"));
  };

  window.switchSettingsCategory = function switchSettingsCategory(category) {
    document.querySelectorAll("[data-settings-tab]").forEach((button) => {
      const active = button.getAttribute("data-settings-tab") === category;
      button.classList.toggle("bg-white/15", active);
      button.classList.toggle("border-white/30", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("text-gray-300", !active);
    });

    document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
      const show = panel.getAttribute("data-settings-panel") === category;
      panel.classList.toggle("hidden", !show);
    });
  };

  window.getShortcutDisplay = function getShortcutDisplay() {
    return localStorage.getItem(SHORTCUT_KEY) || "Not set";
  };

  window.getShortcutTarget = function getShortcutTarget() {
    return localStorage.getItem(SHORTCUT_TARGET_KEY) || "/";
  };

  window.getShortcutEnabled = function getShortcutEnabled() {
    return localStorage.getItem(SHORTCUT_ENABLED_KEY) === "on" ? "on" : "off";
  };

  function normalizeKeyName(key) {
    if (!key) {
      return "";
    }
    if (key === " ") {
      return "Space";
    }
    if (key.length === 1) {
      return key.toUpperCase();
    }
    if (key === "ArrowUp") return "Up";
    if (key === "ArrowDown") return "Down";
    if (key === "ArrowLeft") return "Left";
    if (key === "ArrowRight") return "Right";
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  function comboFromEvent(event) {
    const mods = [];
    if (event.ctrlKey) mods.push("Ctrl");
    if (event.metaKey) mods.push("Meta");
    if (event.altKey) mods.push("Alt");
    if (event.shiftKey) mods.push("Shift");

    const key = normalizeKeyName(event.key);
    if (["Control", "Meta", "Alt", "Shift"].includes(key)) {
      return "";
    }
    return [...mods, key].join("+");
  }

  function shouldIgnoreShortcutTarget(target) {
    if (!target) {
      return false;
    }
    const tag = target.tagName;
    return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function runShortcutAction() {
    const nextRaw = normalizeTarget(localStorage.getItem(SHORTCUT_TARGET_KEY) || "/");
    const nextUrl = new URL(nextRaw, window.location.origin).toString();
    window.open(nextUrl, "_blank", "noopener");
    if (window.NebulaAntiClose && typeof window.NebulaAntiClose.bypassNextClose === "function") {
      window.NebulaAntiClose.bypassNextClose();
    }
    window.close();
    if (!window.closed) {
      window.location.href = nextUrl;
    }
  }

  window.startShortcutCapture = function startShortcutCapture() {
    const status = document.getElementById("shortcut-capture-status");
    if (status) {
      status.textContent = "Press your shortcut";
    }

    function onCapture(event) {
      event.preventDefault();
      event.stopPropagation();
      const combo = comboFromEvent(event);
      if (!combo) {
        return;
      }
      localStorage.setItem(SHORTCUT_KEY, combo);
      const display = document.getElementById("shortcut-combo-display");
      if (display) {
        display.value = combo;
      }
      if (status) {
        status.textContent = "Saved";
      }
      document.removeEventListener("keydown", onCapture, true);
    }

    document.addEventListener("keydown", onCapture, true);
  };

  window.changeShortcutTarget = function changeShortcutTarget(value) {
    localStorage.setItem(SHORTCUT_TARGET_KEY, normalizeTarget(value));
  };

  window.changeShortcutEnabled = function changeShortcutEnabled(value) {
    localStorage.setItem(SHORTCUT_ENABLED_KEY, value === "on" ? "on" : "off");
  };

  window.getAntiCloseEnabled = function getAntiCloseEnabled() {
    return localStorage.getItem(ANTI_CLOSE_KEY) === "off" ? "off" : "on";
  };

  window.changeAntiCloseEnabled = function changeAntiCloseEnabled(value) {
    const enabled = value === "off" ? "off" : "on";
    localStorage.setItem(ANTI_CLOSE_KEY, enabled);
    if (window.NebulaAntiClose) {
      if (enabled === "on" && typeof window.NebulaAntiClose.enable === "function") {
        window.NebulaAntiClose.enable();
      }
      if (enabled === "off" && typeof window.NebulaAntiClose.disable === "function") {
        window.NebulaAntiClose.disable();
      }
    }
  };

  window.getWrapMode = function getWrapMode() {
    const mode = localStorage.getItem(WRAP_MODE_KEY);
    return mode === "blob" ? "blob" : "about-blank";
  };

  window.getWrapEnabled = function getWrapEnabled() {
    return localStorage.getItem(WRAP_ENABLED_KEY) === "on" ? "on" : "off";
  };

  window.changeWrapMode = function changeWrapMode(mode) {
    localStorage.setItem(WRAP_MODE_KEY, mode === "blob" ? "blob" : "about-blank");
  };

  window.changeWrapEnabled = function changeWrapEnabled(value) {
    const enabled = value === "on" ? "on" : "off";
    localStorage.setItem(WRAP_ENABLED_KEY, enabled);

    if (enabled === "off" && window.top !== window.self) {
      const target = cleanWrappedParam(localStorage.getItem(WRAP_LAST_URL_KEY) || window.location.href);
      window.top.postMessage({ type: "nebula-unwrapper", target }, "*");
      return;
    }

    if (enabled === "on" && !isWrappedInnerPage()) {
      const didOpen = launchWrapped(window.getWrapMode(), window.location.href, false);
      if (!didOpen) {
        launchWrapped(window.getWrapMode(), window.location.href, true);
      }
    }
  };

  window.openWrappedNow = function openWrappedNow(mode) {
    const nextMode = mode === "blob" ? "blob" : "about-blank";
    localStorage.setItem(WRAP_MODE_KEY, nextMode);
    const didOpen = launchWrapped(nextMode, window.location.href, false);
    if (!didOpen) {
      launchWrapped(nextMode, window.location.href, true);
    }
  };

  window.getInfoWidgetEnabled = function getInfoWidgetEnabled() {
    return localStorage.getItem(WIDGET_ENABLED_KEY) === "off" ? "off" : "on";
  };

  window.getInfoWidgetFormat = function getInfoWidgetFormat() {
    return localStorage.getItem(WIDGET_FORMAT_KEY) || "%Y-%m-%d %H:%M:%S";
  };

  window.getInfoWidgetTimeMode = function getInfoWidgetTimeMode() {
    return localStorage.getItem(WIDGET_TIME_MODE_KEY) === "24" ? "24" : "12";
  };

  window.getInfoWidgetSectionVisibility = function getInfoWidgetSectionVisibility(section) {
    const keyMap = {
      weather: WIDGET_SHOW_WEATHER_KEY,
      datetime: WIDGET_SHOW_DATETIME_KEY,
      battery: WIDGET_SHOW_BATTERY_KEY
    };
    const key = keyMap[String(section || "")];
    if (!key) {
      return "on";
    }
    return localStorage.getItem(key) === "off" ? "off" : "on";
  };

  window.changeInfoWidgetSectionVisibility = function changeInfoWidgetSectionVisibility(section, value) {
    const keyMap = {
      weather: WIDGET_SHOW_WEATHER_KEY,
      datetime: WIDGET_SHOW_DATETIME_KEY,
      battery: WIDGET_SHOW_BATTERY_KEY
    };
    const key = keyMap[String(section || "")];
    if (!key) {
      return;
    }
    localStorage.setItem(key, value === "off" ? "off" : "on");
    renderInfoWidgetNow();
  };

  window.changeInfoWidgetEnabled = function changeInfoWidgetEnabled(value) {
    localStorage.setItem(WIDGET_ENABLED_KEY, value === "off" ? "off" : "on");
    mountInfoWidget();
  };

  window.changeInfoWidgetFormat = function changeInfoWidgetFormat(value) {
    localStorage.setItem(WIDGET_FORMAT_KEY, String(value || "%Y-%m-%d %H:%M:%S"));
    renderInfoWidgetNow();
  };

  window.changeInfoWidgetTimeMode = function changeInfoWidgetTimeMode(value) {
    localStorage.setItem(WIDGET_TIME_MODE_KEY, value === "24" ? "24" : "12");
    renderInfoWidgetNow();
  };

  window.resetInfoWidgetPosition = function resetInfoWidgetPosition() {
    localStorage.removeItem(WIDGET_POS_X_KEY);
    localStorage.removeItem(WIDGET_POS_Y_KEY);
    const widget = document.getElementById("nebula-info-widget");
    if (widget) {
      widget.style.left = "24px";
      widget.style.top = "90px";
    }
  };

  window.mountSoundboardRoute = function mountSoundboardRoute() {
    const existing = document.getElementById("soundboard-main-module");
    if (existing) {
      existing.remove();
    }
    const moduleScript = document.createElement("script");
    moduleScript.id = "soundboard-main-module";
    moduleScript.type = "module";
    moduleScript.src = "/vendor/soundboard/main.js?t=" + Date.now();
    document.body.appendChild(moduleScript);
  };

  if (window.firebase) {
    const firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    window.nebulaAuth = firebaseApp.auth();
    window.nebulaRtdb = firebaseApp.database();
    window.nebulaFirestore = null;
    if (typeof firebaseApp.firestore === "function") {
      try {
        const firestore = firebaseApp.firestore();
        firestore.settings({
          experimentalAutoDetectLongPolling: true,
          useFetchStreams: false
        });
        window.nebulaFirestore = firestore;
      } catch (_error) {
        try {
          window.nebulaFirestore = firebaseApp.firestore();
        } catch (_innerError) {
          window.nebulaFirestore = null;
        }
      }
    }
    window.nebulaDb = window.createNebulaRtdbCompatDb
      ? window.createNebulaRtdbCompatDb(window.nebulaRtdb)
      : null;

    window.nebulaAuthReady = new Promise((resolve) => {
      const unsubscribe = window.nebulaAuth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user || null);
      });
    });

    window.isNebulaAuthenticated = function isNebulaAuthenticated() {
      const user = window.nebulaAuth && window.nebulaAuth.currentUser;
      return Boolean(user && !user.isAnonymous);
    };
  }

  applyNebulaSavedFont();

  saveSidebarPosition(localStorage.getItem("sidebar-pos") || "top");
  bindSidebarSafeAreaTracking();

  let widgetBatteryLevel = null;
  let widgetBatteryCharging = false;
  let widgetBatteryBound = false;
  let widgetTick = 0;
  let widgetWeatherIcon = "fa-cloud";
  let widgetWeatherTempValue = null;
  let widgetWeatherTempSystem = "imperial";

  function convertTemp(value, fromSystem, toSystem) {
    const input = Number(value);
    if (!Number.isFinite(input)) {
      return null;
    }
    if (fromSystem === toSystem) {
      return input;
    }
    if (fromSystem === "metric" && toSystem === "imperial") {
      return (input * 9) / 5 + 32;
    }
    if (fromSystem === "imperial" && toSystem === "metric") {
      return ((input - 32) * 5) / 9;
    }
    return input;
  }

  function formatWidgetWeatherTemp() {
    const targetSystem = window.getMeasurementSystem();
    const unit = targetSystem === "metric" ? "°C" : "°F";
    const converted = convertTemp(widgetWeatherTempValue, widgetWeatherTempSystem, targetSystem);
    if (!Number.isFinite(converted)) {
      return "--";
    }
    return `${Math.round(converted)}${unit}`;
  }

  function readWidgetWeatherFromCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WIDGET_WEATHER_CACHE_KEY) || "{}");
      if (parsed && typeof parsed === "object") {
        widgetWeatherIcon = typeof parsed.icon === "string" && parsed.icon ? parsed.icon : "fa-cloud";
        if (typeof parsed.tempValue === "number" && Number.isFinite(parsed.tempValue)) {
          widgetWeatherTempValue = parsed.tempValue;
          widgetWeatherTempSystem = parsed.system === "metric" ? "metric" : "imperial";
        } else if (typeof parsed.temp === "string") {
          const match = parsed.temp.match(/-?\d+(?:\.\d+)?/);
          widgetWeatherTempValue = match ? Number(match[0]) : null;
          widgetWeatherTempSystem = /c$/i.test(parsed.temp) ? "metric" : "imperial";
        } else {
          widgetWeatherTempValue = null;
          widgetWeatherTempSystem = "imperial";
        }
      }
    } catch (_error) {
      widgetWeatherIcon = "fa-cloud";
      widgetWeatherTempValue = null;
      widgetWeatherTempSystem = "imperial";
    }
  }

  function pad2(input) {
    return String(input).padStart(2, "0");
  }

  function getWidgetDateParts(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour24 = date.getHours();
    const hour12 = hour24 % 12 || 12;
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNamesLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return {
      year,
      month,
      day,
      hour24,
      hour12,
      minute,
      second,
      ampm: hour24 >= 12 ? "PM" : "AM",
      dowShort: dayNamesShort[date.getDay()],
      dowLong: dayNamesLong[date.getDay()],
      monthShort: monthShort[date.getMonth()],
      monthLong: monthLong[date.getMonth()]
    };
  }

  function formatWidgetDate(date, format, timeMode) {
    const value = String(format || "%Y-%m-%d %H:%M:%S");
    const p = getWidgetDateParts(date);
    const tokens = {
      "%Y": String(p.year),
      "%y": String(p.year).slice(-2),
      "%m": pad2(p.month),
      "%d": pad2(p.day),
      "%e": String(p.day),
      "%H": pad2(p.hour24),
      "%I": pad2(p.hour12),
      "%M": pad2(p.minute),
      "%S": pad2(p.second),
      "%p": p.ampm,
      "%a": p.dowShort,
      "%A": p.dowLong,
      "%b": p.monthShort,
      "%B": p.monthLong,
      "%%": "%"
    };

    let normalized = value;
    if (timeMode === "12") {
      normalized = normalized.replaceAll("%H", "%I");
      if (!normalized.includes("%p")) {
        normalized += " %p";
      }
    } else {
      normalized = normalized.replaceAll("%I", "%H").replaceAll(" %p", "").replaceAll("%p", "");
    }

    return normalized.replace(/%[YymdeHIMSpaAbB%]/g, (match) => (match in tokens ? tokens[match] : match));
  }

  function getWidgetBatteryIconClass() {
    if (widgetBatteryCharging) {
      return "fa-bolt";
    }
    if (typeof widgetBatteryLevel !== "number") {
      return "fa-battery-empty";
    }
    const pct = Math.round(widgetBatteryLevel * 100);
    if (pct >= 90) return "fa-battery-full";
    if (pct >= 65) return "fa-battery-three-quarters";
    if (pct >= 40) return "fa-battery-half";
    if (pct >= 20) return "fa-battery-quarter";
    return "fa-battery-empty";
  }

  function getWidgetBatteryText() {
    if (typeof widgetBatteryLevel !== "number") {
      return "N/A";
    }
    const pct = Math.round(widgetBatteryLevel * 100);
    return pct + "%" + (widgetBatteryCharging ? " charging" : "");
  }

  function renderInfoWidgetNow() {
    const node = document.getElementById("nebula-info-widget");
    if (!node) {
      return;
    }
    const weatherRow = node.querySelector('[data-widget-section="weather"]');
    const dateRow = node.querySelector('[data-widget-section="datetime"]');
    const batteryRow = node.querySelector('[data-widget-section="battery"]');
    const dateTextNode = node.querySelector("[data-widget-date]");
    const weatherIconNode = node.querySelector("[data-widget-weather-icon]");
    const weatherTempNode = node.querySelector("[data-widget-weather-temp]");
    const batteryIconNode = node.querySelector("[data-widget-battery-icon]");
    const batteryNode = node.querySelector("[data-widget-battery]");
    if (!dateTextNode || !weatherIconNode || !weatherTempNode || !batteryIconNode || !batteryNode) {
      return;
    }
    const format = window.getInfoWidgetFormat();
    const mode = window.getInfoWidgetTimeMode();
    const showWeather = window.getInfoWidgetSectionVisibility("weather") === "on";
    const showDatetime = window.getInfoWidgetSectionVisibility("datetime") === "on";
    const showBattery = window.getInfoWidgetSectionVisibility("battery") === "on";

    if (weatherRow) {
      weatherRow.style.display = showWeather ? "flex" : "none";
    }
    if (dateRow) {
      dateRow.style.display = showDatetime ? "flex" : "none";
    }
    if (batteryRow) {
      batteryRow.style.display = showBattery ? "flex" : "none";
    }

    dateTextNode.textContent = formatWidgetDate(new Date(), format, mode);
    weatherIconNode.className = "fa-solid " + widgetWeatherIcon;
    weatherTempNode.textContent = formatWidgetWeatherTemp();
    batteryIconNode.className = "fa-solid " + getWidgetBatteryIconClass();
    batteryNode.textContent = getWidgetBatteryText();
  }

  function bindWidgetBattery() {
    if (widgetBatteryBound || !navigator.getBattery) {
      return;
    }
    widgetBatteryBound = true;
    navigator.getBattery().then((battery) => {
      function updateBatteryState() {
        widgetBatteryLevel = battery.level;
        widgetBatteryCharging = battery.charging;
        renderInfoWidgetNow();
      }
      updateBatteryState();
      battery.addEventListener("levelchange", updateBatteryState);
      battery.addEventListener("chargingchange", updateBatteryState);
    }).catch(() => {});
  }

  function mountInfoWidget() {
    const existing = document.getElementById("nebula-info-widget");
    if (window.getInfoWidgetEnabled() !== "on") {
      if (existing) {
        existing.remove();
      }
      if (widgetTick) {
        clearInterval(widgetTick);
        widgetTick = 0;
      }
      return;
    }

    let widget = existing;
    if (!widget) {
      widget = document.createElement("section");
      widget.id = "nebula-info-widget";
      widget.innerHTML = `
        <header class="nebula-widget-handle" data-widget-handle>
          <i class="fa-solid fa-grip-lines nebula-widget-grip"></i>
        </header>
        <div class="nebula-widget-body">
          <div class="nebula-widget-row nebula-widget-weather-row" data-widget-section="weather">
            <i class="fa-solid fa-cloud" data-widget-weather-icon></i>
            <p class="nebula-widget-weather-temp" data-widget-weather-temp>--</p>
          </div>
          <div class="nebula-widget-row" data-widget-section="datetime">
            <i class="fa-regular fa-clock"></i>
            <p class="nebula-widget-date" data-widget-date></p>
          </div>
          <div class="nebula-widget-row" data-widget-section="battery">
            <i class="fa-solid fa-battery-half" data-widget-battery-icon></i>
            <p class="nebula-widget-battery" data-widget-battery></p>
          </div>
        </div>
      `;
      document.body.appendChild(widget);

      const savedX = Number(localStorage.getItem(WIDGET_POS_X_KEY));
      const savedY = Number(localStorage.getItem(WIDGET_POS_Y_KEY));
      const x = Number.isFinite(savedX) ? savedX : 24;
      const y = Number.isFinite(savedY) ? savedY : 90;
      widget.style.left = x + "px";
      widget.style.top = y + "px";

      const handle = widget.querySelector("[data-widget-handle]");
      let dragActive = false;
      let offsetX = 0;
      let offsetY = 0;

      function onMove(event) {
        if (!dragActive) {
          return;
        }
        const nextX = Math.max(0, Math.min(window.innerWidth - widget.offsetWidth, event.clientX - offsetX));
        const nextY = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, event.clientY - offsetY));
        widget.style.left = nextX + "px";
        widget.style.top = nextY + "px";
        localStorage.setItem(WIDGET_POS_X_KEY, String(Math.round(nextX)));
        localStorage.setItem(WIDGET_POS_Y_KEY, String(Math.round(nextY)));
      }

      function stopDrag() {
        dragActive = false;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", stopDrag);
      }

      if (handle) {
        handle.addEventListener("pointerdown", (event) => {
          dragActive = true;
          const rect = widget.getBoundingClientRect();
          offsetX = event.clientX - rect.left;
          offsetY = event.clientY - rect.top;
          document.addEventListener("pointermove", onMove);
          document.addEventListener("pointerup", stopDrag);
        });
      }
    }

    if (!widgetTick) {
      widgetTick = window.setInterval(renderInfoWidgetNow, 1000);
    }
    bindWidgetBattery();
    renderInfoWidgetNow();
  }

  (function initGlobalParticles() {
    const canvas = document.getElementById("global-particles");
    if (!canvas) {
      return;
    }
    const body = document.body;

    const ctx = canvas.getContext("2d");
    const particles = [];
    const maxDistance = 120;
    let width = 0;
    let height = 0;

    function ensureHexColor(input) {
      const value = String(input || "").trim();
      return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff";
    }

    function currentSettings() {
      const backgroundMode = typeof window.getGamesBackgroundMode === "function"
        ? window.getGamesBackgroundMode()
        : "none";
      const backgroundUrl = String(localStorage.getItem("games-background-url") || "").trim();
      const backgroundActive = backgroundMode !== "none";
      return {
        enabled: localStorage.getItem("games-particles-enabled") !== "off" && !backgroundActive,
        backgroundMode,
        backgroundUrl,
        color: ensureHexColor(localStorage.getItem("games-particles-color") || "#ffffff"),
        bondsOn: localStorage.getItem("games-particles-bonds") === "on",
        shape: window.getGamesParticlesShape(),
        frequency: window.getGamesParticlesFrequency(),
        size: window.getGamesParticlesSize()
      };
    }

    const settings = currentSettings();

    function applyBackground() {
      if (!body) {
        return;
      }

      body.classList.remove("nebula-live-background");
      body.classList.remove("nebula-live-car-background");
      body.style.removeProperty("background-image");
      body.style.removeProperty("background-size");
      body.style.removeProperty("background-position");
      body.style.removeProperty("background-repeat");
      body.style.removeProperty("background-attachment");

      const existingCarFrame = document.getElementById("nebula-live-car-frame");

      if (settings.backgroundMode === "none") {
        if (existingCarFrame) {
          existingCarFrame.remove();
        }
        return;
      }

      if (settings.backgroundMode === "live-aurora") {
        if (existingCarFrame) {
          existingCarFrame.remove();
        }
        body.classList.add("nebula-live-background");
        return;
      }

      if (settings.backgroundMode === "live-car") {
        const videoUrl = settings.backgroundUrl;
        let carFrame = existingCarFrame;
        if (!carFrame) {
          carFrame = document.createElement("iframe");
          carFrame.id = "nebula-live-car-frame";
          carFrame.className = "nebula-live-car-frame";
          carFrame.setAttribute("title", "Live car background");
          carFrame.setAttribute("aria-hidden", "true");
          carFrame.setAttribute("tabindex", "-1");
          carFrame.setAttribute("loading", "eager");
          carFrame.setAttribute("referrerpolicy", "no-referrer");
          carFrame.setAttribute("allow", "autoplay; fullscreen");
          carFrame.setAttribute("sandbox", "allow-scripts");
          document.body.insertBefore(carFrame, document.body.firstChild);
        }
        body.classList.add("nebula-live-car-background");

        const safeVideoUrl = String(videoUrl || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;");
        const nextSrcdoc = `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #000;
  }
  body {
    contain: strict;
    isolation: isolate;
  }
  video {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    object-position: center center;
    display: block;
    pointer-events: none;
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
  }
</style>
</head>
<body>
<video autoplay muted loop playsinline preload="auto" disablepictureinpicture src="${safeVideoUrl}"></video>
</body>
</html>`;

        if (carFrame.getAttribute("srcdoc") !== nextSrcdoc) {
          carFrame.setAttribute("srcdoc", nextSrcdoc);
        }
        if (carFrame.contentWindow) {
          try {
            carFrame.contentWindow.focus();
          } catch (_error) {
          }
        }
        return;
      }

      if (existingCarFrame) {
        existingCarFrame.remove();
      }

      if (!settings.backgroundUrl) {
        return;
      }

      const escapedUrl = settings.backgroundUrl.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n|\r/g, "");
      body.style.setProperty(
        "background-image",
        `linear-gradient(180deg, rgba(3, 8, 20, 0.52), rgba(2, 6, 14, 0.72)), url("${escapedUrl}")`
      );
      body.style.setProperty("background-size", "cover");
      body.style.setProperty("background-position", "center center");
      body.style.setProperty("background-repeat", "no-repeat");
      body.style.setProperty("background-attachment", "fixed");
    }

    function toRgba(hex, alpha) {
      const clean = ensureHexColor(hex).slice(1);
      const r = Number.parseInt(clean.slice(0, 2), 16);
      const g = Number.parseInt(clean.slice(2, 4), 16);
      const b = Number.parseInt(clean.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function makeParticles() {
      const multiplier = settings.frequency === "low" ? 0.6 : settings.frequency === "high" ? 1.7 : 1;
      const count = Math.max(24, Math.floor((width * height * multiplier) / 18000));
      particles.length = 0;
      for (let i = 0; i < count; i += 1) {
        const randX = randomUnit();
        const randY = randomUnit();
        const randVX = randomUnit();
        const randVY = randomUnit();
        const randR = randomUnit();
        particles.push({
          x: randX * width,
          y: randY * height,
          vx: (randVX - 0.5) * 0.35,
          vy: (randVY - 0.5) * 0.35,
          r: 0.8 + randR * 2.2
        });
      }
    }

    function drawParticle(particle) {
      const sizeMultiplier = settings.size === "small" ? 0.7 : settings.size === "large" ? 1.5 : 1;
      const size = particle.r * sizeMultiplier;
      ctx.fillStyle = toRgba(settings.color, 0.85);
      if (settings.shape === "square") {
        ctx.fillRect(particle.x - size, particle.y - size, size * 2, size * 2);
        return;
      }
      if (settings.shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - size * 1.3);
        ctx.lineTo(particle.x - size * 1.1, particle.y + size * 0.9);
        ctx.lineTo(particle.x + size * 1.1, particle.y + size * 0.9);
        ctx.closePath();
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      makeParticles();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      if (!settings.enabled) {
        requestAnimationFrame(draw);
        return;
      }

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -1;
        }

        drawParticle(particle);
      }

      if (settings.bondsOn) {
        for (let i = 0; i < particles.length; i += 1) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j += 1) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= maxDistance) {
              const alpha = 0.2 * (1 - distance / maxDistance);
              ctx.beginPath();
              ctx.strokeStyle = toRgba(settings.color, alpha);
              ctx.lineWidth = 1;
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      requestAnimationFrame(draw);
    }

    window.updateGlobalParticlesSettings = function updateGlobalParticlesSettings() {
      const next = currentSettings();
      settings.enabled = next.enabled;
      settings.backgroundMode = next.backgroundMode;
      settings.backgroundUrl = next.backgroundUrl;
      settings.color = next.color;
      settings.bondsOn = next.bondsOn;
      settings.shape = next.shape;
      settings.frequency = next.frequency;
      settings.size = next.size;
      makeParticles();
      canvas.style.display = settings.enabled ? "block" : "none";
      applyBackground();
    };

    resize();
    canvas.style.display = settings.enabled ? "block" : "none";
    applyBackground();
    draw();
    window.addEventListener("resize", resize);
  })();

  (function registerCachingServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const isDev = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const swPath = isDev ? "/public/sw.js" : "/sw.js";

    navigator.serviceWorker.addEventListener("message", (event) => {
      const payload = event && event.data ? event.data : null;
      if (!payload || payload.type !== "nebula-notification-click") {
        return;
      }
      const route = normalizeTarget(payload.route || "/chat");
      openNotificationRoute(route);
    });

    window.addEventListener("load", () => {
      navigator.serviceWorker.register(swPath).then(() => {
        syncNotificationPreferencesToServiceWorker();
      }).catch(() => {});
    });
  })();

  document.addEventListener("keydown", (event) => {
    if (window.getShortcutEnabled() !== "on") {
      return;
    }
    if (shouldIgnoreShortcutTarget(event.target)) {
      return;
    }
    const saved = localStorage.getItem(SHORTCUT_KEY) || "";
    if (!saved) {
      return;
    }
    const now = comboFromEvent(event);
    if (now && now === saved) {
      event.preventDefault();
      runShortcutAction();
    }
  });

  if (window.getWrapEnabled() === "on" && !isWrappedInnerPage()) {
    launchWrapped(window.getWrapMode(), window.location.href, true);
  }

  window.addEventListener("nebula:weather-current", (event) => {
    const detail = event && event.detail ? event.detail : null;
    if (!detail) {
      return;
    }
    widgetWeatherIcon = typeof detail.icon === "string" && detail.icon ? detail.icon : "fa-cloud";
    widgetWeatherTempValue = Number.isFinite(Number(detail.tempValue)) ? Number(detail.tempValue) : null;
    widgetWeatherTempSystem = detail.system === "metric" ? "metric" : "imperial";
    try {
      localStorage.setItem(WIDGET_WEATHER_CACHE_KEY, JSON.stringify({
        icon: widgetWeatherIcon,
        tempValue: widgetWeatherTempValue,
        system: widgetWeatherTempSystem
      }));
    } catch (_error) {
    }
    renderInfoWidgetNow();
  });

  window.addEventListener("nebula:measurement-changed", () => {
    renderInfoWidgetNow();
  });

  readWidgetWeatherFromCache();

  if (window.NebulaWeather && typeof window.NebulaWeather.prefetchWidgetWeather === "function") {
    window.NebulaWeather.prefetchWidgetWeather();
  }

  mountInfoWidget();
})();