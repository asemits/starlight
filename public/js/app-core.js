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
<title>Starlight Wrapper</title>
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

    const target = sameTab ? "_self" : "_blank";
    const win = window.open("about:blank", target, "noopener");
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

  window.changeSidebarPos = function changeSidebarPos(newPos) {
    saveSidebarPosition(newPos);
  };

  window.changeGamesPaginationMode = function changeGamesPaginationMode(newMode) {
    localStorage.setItem("games-pagination-mode", newMode);
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
    launchWrapped(nextMode, window.location.href, false);
  };

  window.mountSoundboardRoute = function mountSoundboardRoute() {
    const existing = document.getElementById("soundboard-main-module");
    if (existing) {
      existing.remove();
    }
    const moduleScript = document.createElement("script");
    moduleScript.id = "soundboard-main-module";
    moduleScript.type = "module";
    moduleScript.src = "https://cdn.jsdelivr.net/gh/genizy/soundboard@main/main.js?t=" + Date.now();
    document.body.appendChild(moduleScript);
  };

  if (window.firebase) {
    const firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    window.starlightAuth = firebaseApp.auth();
    window.starlightDb = firebaseApp.firestore();

    window.starlightAuthReady = new Promise((resolve, reject) => {
      const unsubscribe = window.starlightAuth.onAuthStateChanged(async (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }
        try {
          await window.starlightAuth.signInAnonymously();
        } catch (error) {
          console.error("Anonymous auth failed. Enable Anonymous sign-in in Firebase Auth.", error);
          reject(error);
        }
      });
    });
  }

  saveSidebarPosition(localStorage.getItem("sidebar-pos") || "top");

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
        color: ensureHexColor(localStorage.getItem("games-particles-color") || "#ffffff"),
        bondsOn: localStorage.getItem("games-particles-bonds") === "on"
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
      const count = Math.max(42, Math.floor((width * height) / 18000));
      particles.length = 0;
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 0.8 + Math.random() * 2.2
        });
      }
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

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -1;
        }

        ctx.beginPath();
        ctx.fillStyle = toRgba(settings.color, 0.85);
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
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
      settings.color = next.color;
      settings.bondsOn = next.bondsOn;
    };

    resize();
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
})();
