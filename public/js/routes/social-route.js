(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/social"] = {
    render: function renderSocialRoute() {
      return `
        <section class="starlight-social-shell">
          <header class="starlight-social-header">
            <h1>Social</h1>
            <p>Open encrypted direct messages and group chats.</p>
          </header>
          <div class="starlight-social-grid">
            <a href="/chat" class="nav-link starlight-social-card">
              <div class="starlight-social-card-icon">
                <i class="fa-solid fa-user-lock"></i>
              </div>
              <div>
                <h2>Private Chat</h2>
                <p>End-to-end encrypted DMs and GCs</p>
              </div>
              <i class="fa-solid fa-arrow-right starlight-social-card-arrow"></i>
            </a>
          </div>
        </section>
      `;
    }
  };
})();