(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/"] = {
    render: function renderHomeRoute() {
      return '<div id="home-root"></div>';
    },
    afterRender: function afterRenderHomeRoute() {
      if (window.NebulaAuthUI) {
        window.NebulaAuthUI.renderHome("#home-root");
      }
    }
  };
})();