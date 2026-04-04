(async function () {
  const DEFAULT_CDN_BASE = "https://cdn.jsdelivr.net/gh/PopAnynomous234/Goodboy@main/";
  const ALLOWED_CDN_BASES = [
    "https://cdn.jsdelivr.net/gh/PopAnynomous234/Goodboy@main/",
    "https://cdn.jsdelivr.net/gh/asemits/starlight-games@main/"
  ];
  const status = document.getElementById("runner-status");
  const params = new URLSearchParams(window.location.search);
  const gamePath = params.get("path") || "";
  const requestedBase = params.get("base") || DEFAULT_CDN_BASE;

  function normalizeBase(base) {
    const input = String(base || "").trim().replace(/\/+$/, "") + "/";
    return ALLOWED_CDN_BASES.find((allowed) => allowed === input) || DEFAULT_CDN_BASE;
  }

  const CDN_BASE = normalizeBase(requestedBase);

  function normalizeGamePath(path) {
    const raw = String(path || "").trim();
    if (!raw) {
      return "";
    }

    let decoded = "";
    try {
      decoded = decodeURIComponent(raw).replace(/^\/+/, "");
    } catch (_error) {
      decoded = raw.replace(/^\/+/, "");
    }
    const lower = decoded.toLowerCase();
    if (!lower.endsWith(".html")) {
      return "";
    }
    if (decoded.includes("\\")) {
      return "";
    }
    if (decoded.includes("://") || decoded.startsWith("//")) {
      return "";
    }

    const segments = decoded.split("/");
    if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
      return "";
    }

    return decoded;
  }

  function encodePath(path) {
    return String(path || "")
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  function buildGameInterfaceShim(baseHref) {
    const safeBase = JSON.stringify(baseHref || CDN_BASE);
    return '<script>(function(){if(window.GameInterface&&typeof window.GameInterface.init==="function"){return;}var baseHref=' + safeBase + ';function absoluteUrl(file){try{return new URL(file,baseHref).toString();}catch(_e){return file;}}function loadFiles(files){var list=Array.isArray(files)?files:[files];return Promise.all(list.filter(Boolean).map(function(file){var name=String(file);if(/\\.css(\\?|#|$)/i.test(name)){return new Promise(function(resolve){var link=document.createElement("link");link.rel="stylesheet";link.href=absoluteUrl(name);link.onload=resolve;link.onerror=resolve;document.head.appendChild(link);});}return new Promise(function(resolve){var script=document.createElement("script");script.src=absoluteUrl(name);script.onload=resolve;script.onerror=resolve;document.head.appendChild(script);});}));}window.GameInterface={init:function(files){return loadFiles(files);},trackEvent:function(){return Promise.resolve();},setGameData:function(){return Promise.resolve();},showInterstitial:function(){return Promise.resolve(false);},showRewarded:function(){return Promise.resolve(false);},gameReady:function(){return Promise.resolve();},gameStart:function(){return Promise.resolve();},gameComplete:function(){return Promise.resolve();},gameOver:function(){return Promise.resolve();},gamePause:function(){return Promise.resolve();},gameResume:function(){return Promise.resolve();},sendScore:function(){return Promise.resolve();},onAudioStateChange:function(){return Promise.resolve();},onMuteStateChange:function(){return Promise.resolve();},onPauseStateChange:function(){return Promise.resolve();},isMuted:function(){return false;},isPaused:function(){return false;}};})();<\/script>';
  }

  const normalizedGamePath = normalizeGamePath(gamePath);
  if (!normalizedGamePath) {
    status.textContent = "Invalid game path.";
    return;
  }

  function showError(msg) {
    document.getElementById("runner-text").textContent = msg;
    document.getElementById("runner-dots").style.display = "none";
    document.getElementById("runner-status").querySelector(".runner-icon").textContent = "o";
  }

  try {
    const sourceUrl = new URL(encodePath(normalizedGamePath), CDN_BASE).toString();
    const gameDirUrl = sourceUrl.slice(0, sourceUrl.lastIndexOf("/") + 1);
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) {
      showError("Failed to load game source.");
      return;
    }

    let html = await response.text();
    let effectiveBase = gameDirUrl;
    const baseMatch = html.match(/<base[^>]*href=["']([^"']+)["'][^>]*>/i);
    if (baseMatch && baseMatch[1]) {
      try {
        effectiveBase = new URL(baseMatch[1], gameDirUrl).toString();
      } catch (_error) {
        effectiveBase = gameDirUrl;
      }
    } else {
      const baseTag = '<base href="' + gameDirUrl + '">';
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, '<head$1>' + baseTag);
      } else {
        html = "<head>" + baseTag + "</head>" + html;
      }
    }

    const shimTag = buildGameInterfaceShim(effectiveBase);
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, '<head$1>' + shimTag);
    } else {
      html = "<head>" + shimTag + "</head>" + html;
    }

    document.open();
    document.write(html);
    document.close();
  } catch (_error) {
    showError("Unable to start this game right now.");
  }
})();
