(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/proxy"] = {
    render: function renderProxyRoute() {
      return `
        <div class="p-8 max-w-6xl mx-auto">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h1 class="text-3xl font-bold font-orbitron">Proxy</h1>
            <a
              href="https://puckgaming30-d1ae244e-41b4-48d6-9db4-01ead12b6fa6.socketxp.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition text-sm"
            >
              Open in New Tab
            </a>
          </div>
          <div class="rounded-2xl border border-white/10 bg-black/40 overflow-hidden" style="box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);">
            <iframe
              src="https://puckgaming30-d1ae244e-41b4-48d6-9db4-01ead12b6fa6.socketxp.com/"
              title="Proxy Embed"
              allow="fullscreen"
              referrerpolicy="no-referrer"
              style="width: 100%; height: calc(100vh - 220px); min-height: 560px; border: 0; display: block;"
            ></iframe>
          </div>
        </div>
      `;
    }
  };
})();