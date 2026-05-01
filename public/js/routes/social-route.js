(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  modules["/social"] = {
    render: function renderSocialRoute() {
      return `
        <section class="nebula-social-shell">
          <header class="nebula-social-header">
            <h1>Social</h1>
          </header>
          <div class="nebula-social-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,420px));">
            <a href="/chat" class="nav-link nebula-social-card">
              <div class="nebula-social-card-icon">
                <i class="fa-solid fa-user-lock"></i>
              </div>
              <div>
                <h2>Chat</h2>
                <p>DMs and GCs</p>
              </div>
              <i class="fa-solid fa-arrow-right nebula-social-card-arrow"></i>
            </a>
            <a href="/feed" class="nav-link nebula-social-card">
              <div class="nebula-social-card-icon">
                <i class="fa-solid fa-layer-group"></i>
              </div>
              <div>
                <h2>Feed</h2>
                <p>Forums</p>
              </div>
              <i class="fa-solid fa-arrow-right nebula-social-card-arrow"></i>
            </a>
          </div>
        </section>
      `;
    }
  };
})();
