(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/social"] = {
    render: function renderSocialRoute() {
      return `
        <section class="starlight-social-shell">
          <header class="starlight-social-header">
            <h1>Social</h1>
            <p>Connect through encrypted private messages and group chats.</p>
          </header>

          <div class="starlight-social-grid">
            <a href="/private-chat" class="nav-link starlight-social-card">
              <div class="starlight-social-card-icon">
                <i class="fa-solid fa-user-group"></i>
              </div>
              <div>
                <h2>Private Chat</h2>
                <p>Open encrypted DMs and GCs with a Discord-style layout.</p>
              </div>
              <span class="starlight-social-card-arrow">
                <i class="fa-solid fa-arrow-right"></i>
              </span>
            </a>
          </div>
        </section>
      `;
    }
  };
})();
