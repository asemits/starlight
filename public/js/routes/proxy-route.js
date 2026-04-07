(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/proxy"] = {
    render: function renderProxyRoute() {
      return `
        <div id="proxy-root" class="nebula-proxy-shell">
          <div class="nebula-proxy-header">
            <h1 class="nebula-proxy-title">Proxy</h1>
            <a
              href="https://puckgaming30-d1ae244e-41b4-48d6-9db4-01ead12b6fa6.socketxp.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="nebula-proxy-open"
            >
              Open in New Tab
            </a>
          </div>
          <div class="nebula-proxy-frame-wrap">
            <iframe
              src="https://puckgaming30-d1ae244e-41b4-48d6-9db4-01ead12b6fa6.socketxp.com/"
              title="Proxy Embed"
              allow="fullscreen"
              referrerpolicy="no-referrer"
              class="nebula-proxy-frame"
            ></iframe>
          </div>
        </div>
      `;
    }
  };
})();