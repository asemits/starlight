(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["404"] = {
    render: function renderNotFoundRoute() {
      return '<h1 class="text-3xl font-bold text-red-500">404 Not Found</h1>';
    }
  };
})();