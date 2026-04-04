(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/social"] = {
    render: function renderSocialRoute() {
      return '<h1 class="text-3xl font-bold">Social</h1>';
    }
  };
})();
