(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/"] = {
    render: function renderHomeRoute() {
      return '<div id="home-root"></div>';
    },
    afterRender: function afterRenderHomeRoute() {
      if (window.StarlightAuthUI) {
        window.StarlightAuthUI.renderHome("#home-root");
      }
    }
  };
})();
