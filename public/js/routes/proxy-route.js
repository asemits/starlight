(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/proxy"] = {
    render: function renderProxyRoute() {
      return '<h1 class="text-3xl font-bold">Proxy</h1>';
    }
  };
})();