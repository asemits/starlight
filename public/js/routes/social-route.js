(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/social"] = {
    render: function renderSocialRoute() {
      return `
        <h1 class="text-4xl font-bold mb-6">Social</h1>
      `;
    }
  };
})();
