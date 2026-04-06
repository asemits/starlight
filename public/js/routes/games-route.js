(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/games"] = {
    render: function renderGamesRoute() {
      return '<div id="games-root"></div>';
    },
    afterRender: function afterRenderGamesRoute() {
      if (window.NebulaGames) {
        window.NebulaGames.mount("#games-root");
      }
    }
  };
})();