(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/social"] = {
    render: function renderSocialRoute() {
      return `
        <section class="nebula-social-shell">
          <header class="nebula-social-header">
            <h1>Social</h1>
          </header>
          <div class="nebula-social-grid">
            <a href="/chat" class="nav-link nebula-social-card">
              <div class="nebula-social-card-icon">
                <i class="fa-solid fa-user-lock"></i>
              </div>
              <div>
                <h2>Chat</h2>
                <p>E2EE DMs and GCs</p>
              </div>
              <i class="fa-solid fa-arrow-right nebula-social-card-arrow"></i>
            </a>
          </div>
        </section>
      `;
    }
  };
})();