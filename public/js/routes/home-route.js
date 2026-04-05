(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/"] = {
    render: function renderHomeRoute() {
      return `
        <div class="starlight-home-shell">
          <div id="home-root"></div>
        </div>
      `;
    },
    afterRender: function afterRenderHomeRoute() {
      if (window.StarlightAuthUI) {
        window.StarlightAuthUI.renderHome("#home-root");
      }
    }
  };
})();
