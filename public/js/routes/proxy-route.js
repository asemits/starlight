(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/proxy"] = {
    render: function renderProxyRoute() {
      return '<h1 class="text-3xl font-bold">Proxy</h1>';
    }
  };
})();