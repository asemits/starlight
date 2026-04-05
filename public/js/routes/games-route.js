(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/games"] = {
    render: function renderGamesRoute() {
      return `
        <div class="starlight-games-shell">
          <div class="starlight-games-header">
            <h1>Game Library</h1>
            <p>Explore hundreds of games across all genres</p>
          </div>
          
          <div class="starlight-games-controls">
            <div class="starlight-games-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="games-search-input" placeholder="Search games..." />
            </div>
          </div>
          
          <div id="games-root"></div>
        </div>
      `;
    },
    afterRender: function afterRenderGamesRoute() {
      if (window.StarlightGames) {
        window.StarlightGames.mount("#games-root");
      }
      
      // Setup search functionality
      const searchInput = document.getElementById("games-search-input");
      if (searchInput && window.StarlightGames) {
        searchInput.addEventListener("input", (e) => {
          if (window.StarlightGames.setSearch) {
            window.StarlightGames.setSearch(e.target.value);
          }
        });
      }
    }
  };
})();
