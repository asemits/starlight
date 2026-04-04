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
    const frame = document.createElement("iframe");
    frame.src = sourceUrl;
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.style.width = "100%";
    frame.style.height = "100%";
    frame.style.border = "0";
    frame.style.display = "block";

    frame.addEventListener("load", () => {
      const runner = document.getElementById("runner-status");
      if (runner && runner.parentNode) {
        runner.parentNode.replaceChild(frame, runner);
      }
    });

    frame.addEventListener("error", () => {
      showError("Unable to start this game right now.");
    });

    window.setTimeout(() => {
      const runner = document.getElementById("runner-status");
      if (runner && runner.parentNode) {
        runner.parentNode.replaceChild(frame, runner);
      }
    }, 1200);
  } catch (_error) {
    showError("Unable to start this game right now.");
  }
})();
