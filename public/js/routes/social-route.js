(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/social"] = {
    render: function renderSocialRoute() {
      return `
        <section class="nebula-social-shell">
          <header class="nebula-social-header">
            <h1>Social</h1>
            <p>Open encrypted direct messages and group chats.</p>
          </header>
          <div class="nebula-social-grid">
            <a href="/chat" class="nav-link nebula-social-card">
              <div class="nebula-social-card-icon">
                <i class="fa-solid fa-user-lock"></i>
              </div>
              <div>
                <h2>Private Chat</h2>
                <p>End-to-end encrypted DMs and GCs</p>
              </div>
              <i class="fa-solid fa-arrow-right nebula-social-card-arrow"></i>
            </a>
          </div>
        </section>
      `;
    }
  };
})();