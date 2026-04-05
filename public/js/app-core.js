(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyAaOp3LYoMGbByON7W7pGQYV_oXJlmU_Hw",
    authDomain: "starlight-28e40.firebaseapp.com",
    projectId: "starlight-28e40",
    storageBucket: "starlight-28e40.firebasestorage.app",
    messagingSenderId: "206859310211",
    appId: "1:206859310211:web:3450cfa9fae7f6360a77b6",
    measurementId: "G-G52TDH6GRY"
  };

  const SHORTCUT_KEY = "tab-shortcut-combo";
  const SHORTCUT_TARGET_KEY = "tab-shortcut-target";
  const SHORTCUT_ENABLED_KEY = "tab-shortcut-enabled";
  const WRAP_MODE_KEY = "site-wrap-mode";
  const WRAP_ENABLED_KEY = "site-wrap-enabled";
  const WRAP_LAST_URL_KEY = "site-wrap-last-url";
  const ANTI_CLOSE_KEY = "starlight-anti-close-enabled";
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
  const MEASUREMENT_SYSTEM_KEY = "starlight-measurement-system";
  const WIDGET_WEATHER_CACHE_KEY = "starlight-widget-weather-current";

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

  function withWrappedParam(urlText) {
    try {
      const url = new URL(urlText, window.location.origin);
      url.searchParams.set("starlightWrapped", "1");
      return url.toString();
    } catch (_error) {
      return window.location.origin + "/?starlightWrapped=1";
    }
  }

  function cleanWrappedParam(urlText) {
    try {
      const url = new URL(urlText, window.location.origin);
      url.searchParams.delete("starlightWrapped");
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
<title>Starlight</title>
<style>
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
iframe { width: 100%; height: 100%; border: 0; display: block; }
</style>
</head>
<body>
<iframe id="starlightFrame" src="${escaped}" allow="fullscreen"></iframe>
<script>
(function () {
  var frame = document.getElementById('starlightFrame');
  window.addEventListener('message', function (event) {
    var data = event && event.data ? event.data : null;
    if (!data || data.type !== 'starlight-unwrapper') {
      return;
    }
    var nextUrl = data.target || (frame ? frame.src : '/');
    window.location.replace(nextUrl);
  });
})();
<\/script>
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

    const win = window.open("about:blank", "_blank", "noopener");
    if (!win) {
      return false;
    }
    win.document.open();
    win.document.write(wrapperHtml(frameUrl));
    win.document.close();
    return true;
  }

  function isWrappedInnerPage() {
    return new URLSearchParams(window.location.search).get("starlightWrapped") === "1";
  }

  function saveSidebarPosition(newPos) {
    document.body.setAttribute("data-side", newPos);
    localStorage.setItem("sidebar-pos", newPos);
  }

  function randomUnit() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }

  window.changeSidebarPos = function changeSidebarPos(newPos) {
    saveSidebarPosition(newPos);
  };

  window.getMeasurementSystem = function getMeasurementSystem() {
    return localStorage.getItem(MEASUREMENT_SYSTEM_KEY) === "metric" ? "metric" : "imperial";
  };

  window.changeMeasurementSystem = function changeMeasurementSystem(value) {
    const system = value === "metric" ? "metric" : "imperial";
    localStorage.setItem(MEASUREMENT_SYSTEM_KEY, system);
    window.dispatchEvent(new CustomEvent("starlight:measurement-changed", { detail: { system } }));
    if (window.location.pathname === "/weather" && window.StarlightWeather && typeof window.StarlightWeather.refresh === "function") {
      window.StarlightWeather.refresh();
    }
  };

  window.getDashboardSectionVisibility = function getDashboardSectionVisibility(section) {
    const keyMap = {
      recent: DASHBOARD_SHOW_RECENT_KEY,
      favorites: DASHBOARD_SHOW_FAVORITES_KEY,
      stats: DASHBOARD_SHOW_STATS_KEY
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
      stats: DASHBOARD_SHOW_STATS_KEY
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
    if (window.location.pathname === "/games" && window.StarlightGames) {
      window.StarlightGames.render();
    }
  };

  window.changeGamesParticlesEnabled = function changeGamesParticlesEnabled(newValue) {
    const value = newValue === "off" ? "off" : "on";
    localStorage.setItem("games-particles-enabled", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.StarlightGames) {
      window.StarlightGames.render();
    }
  };

  window.changeGamesParticlesBonds = function changeGamesParticlesBonds(newValue) {
    const value = newValue === "on" ? "on" : "off";
    localStorage.setItem("games-particles-bonds", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.StarlightGames) {
      window.StarlightGames.render();
    }
  };

  window.changeGamesParticlesColor = function changeGamesParticlesColor(newColor) {
    const valid = /^#[0-9a-fA-F]{6}$/.test(newColor) ? newColor : "#ffffff";
    localStorage.setItem("games-particles-color", valid);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.StarlightGames) {
      window.StarlightGames.render();
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
    if (window.location.pathname === "/games" && window.StarlightGames) {
      window.StarlightGames.render();
    }
  };

  window.changeGamesParticlesFrequency = function changeGamesParticlesFrequency(newFrequency) {
    const value = newFrequency === "low" || newFrequency === "high" ? newFrequency : "normal";
    localStorage.setItem("games-particles-frequency", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.StarlightGames) {
      window.StarlightGames.render();
    }
  };

  window.changeGamesParticlesSize = function changeGamesParticlesSize(newSize) {
    const value = newSize === "small" || newSize === "large" ? newSize : "medium";
    localStorage.setItem("games-particles-size", value);
    if (window.updateGlobalParticlesSettings) {
      window.updateGlobalParticlesSettings();
    }
    if (window.location.pathname === "/games" && window.StarlightGames) {
      window.StarlightGames.render();
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
      layout: ["layout-sidebar", "layout-measurement", "layout-dashboard-recent", "layout-dashboard-favorites", "layout-dashboard-stats", "games-pagination"],
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
    if (window.StarlightAntiClose && typeof window.StarlightAntiClose.bypassNextClose === "function") {
      window.StarlightAntiClose.bypassNextClose();
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
    if (window.StarlightAntiClose) {
      if (enabled === "on" && typeof window.StarlightAntiClose.enable === "function") {
        window.StarlightAntiClose.enable();
      }
      if (enabled === "off" && typeof window.StarlightAntiClose.disable === "function") {
        window.StarlightAntiClose.disable();
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
      window.top.postMessage({ type: "starlight-unwrapper", target }, "*");
      return;
    }

    if (enabled === "on" && !isWrappedInnerPage()) {
      launchWrapped(window.getWrapMode(), window.location.href, true);
    }
  };

  window.openWrappedNow = function openWrappedNow(mode) {
    const nextMode = mode === "blob" ? "blob" : "about-blank";
    localStorage.setItem(WRAP_MODE_KEY, nextMode);
    launchWrapped(nextMode, window.location.href, true);
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
    const widget = document.getElementById("starlight-info-widget");
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
    window.starlightAuth = firebaseApp.auth();
    window.starlightDb = firebaseApp.firestore();

    window.starlightAuthReady = new Promise((resolve) => {
      const unsubscribe = window.starlightAuth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user || null);
      });
    });

    window.isStarlightAuthenticated = function isStarlightAuthenticated() {
      const user = window.starlightAuth && window.starlightAuth.currentUser;
      return Boolean(user && !user.isAnonymous);
    };
  }

  saveSidebarPosition(localStorage.getItem("sidebar-pos") || "top");

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
    const node = document.getElementById("starlight-info-widget");
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
    const existing = document.getElementById("starlight-info-widget");
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
      widget.id = "starlight-info-widget";
      widget.innerHTML = `
        <header class="starlight-widget-handle" data-widget-handle>
          <i class="fa-solid fa-grip-lines starlight-widget-grip"></i>
        </header>
        <div class="starlight-widget-body">
          <div class="starlight-widget-row starlight-widget-weather-row" data-widget-section="weather">
            <i class="fa-solid fa-cloud" data-widget-weather-icon></i>
            <p class="starlight-widget-weather-temp" data-widget-weather-temp>--</p>
          </div>
          <div class="starlight-widget-row" data-widget-section="datetime">
            <i class="fa-regular fa-clock"></i>
            <p class="starlight-widget-date" data-widget-date></p>
          </div>
          <div class="starlight-widget-row" data-widget-section="battery">
            <i class="fa-solid fa-battery-half" data-widget-battery-icon></i>
            <p class="starlight-widget-battery" data-widget-battery></p>
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
      return {
        enabled: localStorage.getItem("games-particles-enabled") !== "off",
        color: ensureHexColor(localStorage.getItem("games-particles-color") || "#ffffff"),
        bondsOn: localStorage.getItem("games-particles-bonds") === "on",
        shape: window.getGamesParticlesShape(),
        frequency: window.getGamesParticlesFrequency(),
        size: window.getGamesParticlesSize()
      };
    }

    const settings = currentSettings();

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
      settings.color = next.color;
      settings.bondsOn = next.bondsOn;
      settings.shape = next.shape;
      settings.frequency = next.frequency;
      settings.size = next.size;
      makeParticles();
      canvas.style.display = settings.enabled ? "block" : "none";
    };

    resize();
    canvas.style.display = settings.enabled ? "block" : "none";
    draw();
    window.addEventListener("resize", resize);
  })();

  (function registerCachingServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const isDev = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const swPath = isDev ? "/public/sw.js" : "/sw.js";
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(swPath).catch(() => {});
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

  window.addEventListener("starlight:weather-current", (event) => {
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

  window.addEventListener("starlight:measurement-changed", () => {
    renderInfoWidgetNow();
  });

  readWidgetWeatherFromCache();

  if (window.StarlightWeather && typeof window.StarlightWeather.prefetchWidgetWeather === "function") {
    window.StarlightWeather.prefetchWidgetWeather();
  }

  mountInfoWidget();
})();