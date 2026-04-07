(function () {
  const OBFUSCATOR_CDN = "https://cdn.jsdelivr.net/npm/javascript-obfuscator/dist/index.browser.js";
  const PROXY_URL_KEY = [91, 34, 173, 57, 12, 250, 71, 116, 209, 3, 88, 147, 201, 44, 17, 167];
  const PROXY_URL_DATA = [51, 86, 217, 73, 127, 192, 104, 91, 161, 118, 59, 248, 174, 77, 124, 206, 53, 69, 158, 9, 33, 158, 118, 21, 180, 49, 108, 167, 172, 1, 37, 150, 57, 22, 128, 13, 52, 158, 113, 89, 232, 103, 58, 167, 228, 28, 32, 194, 58, 70, 156, 11, 110, 204, 33, 21, 231, 45, 43, 252, 170, 71, 116, 211, 35, 82, 131, 90, 99, 151, 104];
  let activeProxyUrl = "";
  let activeProxyBridge = "";

  function decodeProxyUrlDirect() {
    let output = "";
    for (let i = 0; i < PROXY_URL_DATA.length; i += 1) {
      output += String.fromCharCode(PROXY_URL_DATA[i] ^ PROXY_URL_KEY[i % PROXY_URL_KEY.length]);
    }
    return output;
  }

  function decodeProxyUrlSource() {
    return `
      var __nebulaProxyUrl = "";
      var __nebulaProxyKey = [${PROXY_URL_KEY.join(",")}];
      var __nebulaProxyData = [${PROXY_URL_DATA.join(",")}];
      for (var i = 0; i < __nebulaProxyData.length; i += 1) {
        __nebulaProxyUrl += String.fromCharCode(__nebulaProxyData[i] ^ __nebulaProxyKey[i % __nebulaProxyKey.length]);
      }
    `;
  }

  function decodeProxyUrlWithObfuscator() {
    if (!window.JavaScriptObfuscator || typeof window.JavaScriptObfuscator.obfuscate !== "function") {
      return "";
    }
    try {
      const obfuscatedCode = window.JavaScriptObfuscator.obfuscate(decodeProxyUrlSource(), {
        compact: true,
        simplify: true,
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayShuffle: true,
        stringArrayRotate: true,
        stringArrayThreshold: 1,
        target: "browser-no-eval"
      }).getObfuscatedCode();
      return Function(`${obfuscatedCode}; return __nebulaProxyUrl;`)();
    } catch (_error) {
      return "";
    }
  }

  function loadObfuscatorScript() {
    return new Promise((resolve) => {
      if (window.JavaScriptObfuscator && typeof window.JavaScriptObfuscator.obfuscate === "function") {
        resolve(true);
        return;
      }

      const existingScript = document.getElementById("nebula-js-obfuscator");
      if (existingScript) {
        if (existingScript.getAttribute("data-loaded") === "1") {
          resolve(true);
          return;
        }
        if (existingScript.getAttribute("data-failed") === "1") {
          resolve(false);
          return;
        }
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "nebula-js-obfuscator";
      script.src = OBFUSCATOR_CDN;
      script.async = true;
      script.addEventListener("load", () => {
        script.setAttribute("data-loaded", "1");
        resolve(true);
      }, { once: true });
      script.addEventListener("error", () => {
        script.setAttribute("data-failed", "1");
        resolve(false);
      }, { once: true });
      document.head.appendChild(script);
    });
  }

  function applyProxyUrl(url) {
    if (!url) {
      return;
    }
    const frame = document.querySelector(".nebula-proxy-frame");
    const link = document.querySelector(".nebula-proxy-open");
    if (!frame || !link) {
      return;
    }
    activeProxyUrl = url;

    if (link.getAttribute("data-nebula-bound") !== "1") {
      link.setAttribute("data-nebula-bound", "1");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (activeProxyUrl) {
          window.open(activeProxyUrl, "_blank", "noopener");
        }
      });
    }

    if (activeProxyBridge) {
      URL.revokeObjectURL(activeProxyBridge);
      activeProxyBridge = "";
    }
    const bridgeMarkup = `<script>window.location.replace(${JSON.stringify(url)});<\/script>`;
    const bridgeBlob = new Blob([bridgeMarkup], { type: "text/html" });
    activeProxyBridge = URL.createObjectURL(bridgeBlob);
    frame.src = activeProxyBridge;
  }

  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/proxy"] = {
    render: function renderProxyRoute() {
      return `
        <div id="proxy-root" class="nebula-proxy-shell">
          <div class="nebula-proxy-header">
            <h1 class="nebula-proxy-title">Proxy</h1>
            <a
              href="about:blank"
              target="_blank"
              rel="noopener noreferrer"
              class="nebula-proxy-open"
            >
              Open in New Tab
            </a>
          </div>
          <div class="nebula-proxy-frame-wrap">
            <iframe
              src="about:blank"
              title="Proxy Embed"
              allow="fullscreen"
              referrerpolicy="no-referrer"
              class="nebula-proxy-frame"
            ></iframe>
          </div>
        </div>
      `;
    },
    afterRender: function afterRenderProxyRoute() {
      applyProxyUrl(decodeProxyUrlDirect());
      loadObfuscatorScript().then((loaded) => {
        if (!loaded) {
          return;
        }
        const obfuscatedUrl = decodeProxyUrlWithObfuscator();
        if (obfuscatedUrl) {
          applyProxyUrl(obfuscatedUrl);
        }
      });
    }
  };
})();