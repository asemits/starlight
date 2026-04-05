(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/games"] = {
    render: function renderGamesRoute() {
      return '<div id="games-root"></div>';
    },
    afterRender: function afterRenderGamesRoute() {
      if (window.StarlightGames) {
        window.StarlightGames.mount("#games-root");
      }
    }
  };
})();