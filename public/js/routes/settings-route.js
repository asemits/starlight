(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/settings"] = {
    render: function renderSettingsRoute() {
      const authConfig = window.StarlightAuthUI && window.StarlightAuthUI.config ? window.StarlightAuthUI.config : {};
      const tosText = String(authConfig.tosText || "Terms of Service are not configured.");
      const privacyText = String(authConfig.privacyPolicyText || "Privacy Policy is not configured.");
      
      const escapeHtml = (value) => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
        
      const tosHtml = escapeHtml(tosText).replaceAll("\n", "<br>");
      const privacyHtml = escapeHtml(privacyText).replaceAll("\n", "<br>");

      return `
        <div class="starlight-settings-shell p-8">
          <div class="starlight-settings-header">
            <h1>Settings & Customization</h1>
            <p style="color: var(--ink-dim); margin-top: 8px; font-size: 1rem;">Personalize your experience across layout, appearance, and features</p>
          </div>
          
          <div class="starlight-settings-tabs">
            <button type="button" data-settings-tab="layout" onclick="switchSettingsCategory('layout')" class="starlight-settings-tab active"><i class="fa-solid fa-bars"></i><span style="margin-left: 8px;">Layout</span></button>
            <button type="button" data-settings-tab="particles" onclick="switchSettingsCategory('particles')" class="starlight-settings-tab"><i class="fa-solid fa-wand-magic-sparkles"></i><span style="margin-left: 8px;">Particles</span></button>
            <button type="button" data-settings-tab="shortcut" onclick="switchSettingsCategory('shortcut')" class="starlight-settings-tab"><i class="fa-solid fa-keyboard"></i><span style="margin-left: 8px;">Shortcuts</span></button>
            <button type="button" data-settings-tab="cloak" onclick="switchSettingsCategory('cloak')" class="starlight-settings-tab"><i class="fa-solid fa-user-secret"></i><span style="margin-left: 8px;">Privacy</span></button>
            <button type="button" data-settings-tab="widget" onclick="switchSettingsCategory('widget')" class="starlight-settings-tab"><i class="fa-solid fa-table-cells-large"></i><span style="margin-left: 8px;">Widget</span></button>
            <button type="button" data-settings-tab="about" onclick="switchSettingsCategory('about')" class="starlight-settings-tab"><i class="fa-solid fa-circle-info"></i><span style="margin-left: 8px;">About</span></button>
          </div>

          <div style="margin-top: 24px;">
            <div data-settings-panel="layout" class="starlight-settings-grid">
              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Sidebar Position</h3>
                  <button type="button" onclick="resetSettingsCard('layout-sidebar')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Choose Location</label>
                <select onchange="changeSidebarPos(this.value)" class="starlight-settings-card input">
                  <option value="left" ${localStorage.getItem('sidebar-pos') === 'left' ? 'selected' : ''}>Left</option>
                  <option value="right" ${localStorage.getItem('sidebar-pos') === 'right' ? 'selected' : ''}>Right</option>
                  <option value="top" ${localStorage.getItem('sidebar-pos') === 'top' ? 'selected' : ''}>Top</option>
                  <option value="bottom" ${localStorage.getItem('sidebar-pos') === 'bottom' ? 'selected' : ''}>Bottom</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Temperature Unit</h3>
                  <button type="button" onclick="resetSettingsCard('layout-measurement')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Measurement System</label>
                <select onchange="changeMeasurementSystem(this.value)" class="starlight-settings-card input">
                  <option value="metric" ${window.getMeasurementSystem() === 'metric' ? 'selected' : ''}>Metric (°C, km/h)</option>
                  <option value="imperial" ${window.getMeasurementSystem() === 'metric' ? '' : 'selected'}>Imperial (°F, mph)</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Games Layout</h3>
                  <button type="button" onclick="resetSettingsCard('games-pagination')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Pagination Style</label>
                <select onchange="changeGamesPaginationMode(this.value)" class="starlight-settings-card input">
                  <option value="numbered" ${localStorage.getItem('games-pagination-mode') === 'alphabetical' ? '' : 'selected'}>Numbered Pages</option>
                  <option value="alphabetical" ${localStorage.getItem('games-pagination-mode') === 'alphabetical' ? 'selected' : ''}>Alphabetical Groups</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Dashboard: Recently Played</h3>
                  <button type="button" onclick="resetSettingsCard('layout-dashboard-recent')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Visibility</label>
                <select onchange="changeDashboardSectionVisibility('recent', this.value)" class="starlight-settings-card input">
                  <option value="on" ${window.getDashboardSectionVisibility('recent') === 'on' ? 'selected' : ''}>Show</option>
                  <option value="off" ${window.getDashboardSectionVisibility('recent') === 'off' ? 'selected' : ''}>Hide</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Dashboard: Favorites</h3>
                  <button type="button" onclick="resetSettingsCard('layout-dashboard-favorites')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Visibility</label>
                <select onchange="changeDashboardSectionVisibility('favorites', this.value)" class="starlight-settings-card input">
                  <option value="on" ${window.getDashboardSectionVisibility('favorites') === 'on' ? 'selected' : ''}>Show</option>
                  <option value="off" ${window.getDashboardSectionVisibility('favorites') === 'off' ? 'selected' : ''}>Hide</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Dashboard: Statistics</h3>
                  <button type="button" onclick="resetSettingsCard('layout-dashboard-stats')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Visibility</label>
                <select onchange="changeDashboardSectionVisibility('stats', this.value)" class="starlight-settings-card input">
                  <option value="on" ${window.getDashboardSectionVisibility('stats') === 'on' ? 'selected' : ''}>Show</option>
                  <option value="off" ${window.getDashboardSectionVisibility('stats') === 'off' ? 'selected' : ''}>Hide</option>
                </select>
              </article>
            </div>

            <div data-settings-panel="particles" class="hidden starlight-settings-grid">
              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Background Particles</h3>
                  <button type="button" onclick="resetSettingsCard('particles-enabled')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Effect Status</label>
                <select onchange="changeGamesParticlesEnabled(this.value)" class="starlight-settings-card input">
                  <option value="on" ${localStorage.getItem('games-particles-enabled') === 'off' ? '' : 'selected'}>Enabled</option>
                  <option value="off" ${localStorage.getItem('games-particles-enabled') === 'off' ? 'selected' : ''}>Disabled</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Particle Bonds</h3>
                  <button type="button" onclick="resetSettingsCard('particles-bonds')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Connection Lines</label>
                <select onchange="changeGamesParticlesBonds(this.value)" class="starlight-settings-card input">
                  <option value="off" ${localStorage.getItem('games-particles-bonds') === 'on' ? '' : 'selected'}>Disabled</option>
                  <option value="on" ${localStorage.getItem('games-particles-bonds') === 'on' ? 'selected' : ''}>Enabled</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Particle Color</h3>
                  <button type="button" onclick="resetSettingsCard('particles-color')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Color Selection</label>
                <input type="color" value="${localStorage.getItem('games-particles-color') || '#ffffff'}" onchange="changeGamesParticlesColor(this.value)" class="starlight-settings-card input">
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Particle Shape</h3>
                  <button type="button" onclick="resetSettingsCard('particles-shape')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Visual Style</label>
                <select onchange="changeGamesParticlesShape(this.value)" class="starlight-settings-card input">
                  <option value="circle" ${window.getGamesParticlesShape() === 'circle' ? 'selected' : ''}>Circles</option>
                  <option value="square" ${window.getGamesParticlesShape() === 'square' ? 'selected' : ''}>Squares</option>
                  <option value="triangle" ${window.getGamesParticlesShape() === 'triangle' ? 'selected' : ''}>Triangles</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Particle Frequency</h3>
                  <button type="button" onclick="resetSettingsCard('particles-frequency')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Generation Rate</label>
                <select onchange="changeGamesParticlesFrequency(this.value)" class="starlight-settings-card input">
                  <option value="low" ${window.getGamesParticlesFrequency() === 'low' ? 'selected' : ''}>Low</option>
                  <option value="normal" ${window.getGamesParticlesFrequency() === 'normal' ? 'selected' : ''}>Normal</option>
                  <option value="high" ${window.getGamesParticlesFrequency() === 'high' ? 'selected' : ''}>High</option>
                </select>
              </article>

              <article class="starlight-settings-card">
                <div class="starlight-settings-card-header">
                  <h3>Particle Size</h3>
                  <button type="button" onclick="resetSettingsCard('particles-size')" title="Reset" class="starlight-settings-reset-btn"><i class="fa-solid fa-rotate-left"></i></button>
                </div>
                <label>Scale</label>
                <select onchange="changeGamesParticlesSize(this.value)" class="starlight-settings-card input">
                  <option value="small" ${window.getGamesParticlesSize() === 'small' ? 'selected' : ''}>Small</option>
                  <option value="medium" ${window.getGamesParticlesSize() === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="large" ${window.getGamesParticlesSize() === 'large' ? 'selected' : ''}>Large</option>
                </select>
              </article>
            </div>

            <!-- Remaining panels for shortcut, cloak, widget, about -->
            <div data-settings-panel="shortcut" class="hidden starlight-settings-grid">
              <article class="starlight-settings-card" style="grid-column: 1 / -1;">
                <h3>Keyboard Shortcuts</h3>
                <p style="margin-top: 12px; color: var(--ink-dim);">Configure custom keyboard shortcuts to quickly access your favorite sections.</p>
              </article>
            </div>

            <div data-settings-panel="cloak" class="hidden starlight-settings-grid">
              <article class="starlight-settings-card" style="grid-column: 1 / -1;">
                <h3>Privacy & Tab Cloaking</h3>
                <p style="margin-top: 12px; color: var(--ink-dim);">Customize how your tab appears to protect your privacy.</p>
              </article>
            </div>

            <div data-settings-panel="widget" class="hidden starlight-settings-grid">
              <article class="starlight-settings-card" style="grid-column: 1 / -1;">
                <h3>Info Widget Customization</h3>
                <p style="margin-top: 12px; color: var(--ink-dim);">Choose which information appears in your dashboard widget.</p>
              </article>
            </div>

            <div data-settings-panel="about" class="hidden">
              <article class="starlight-settings-card" style="grid-column: 1 / -1;">
                <h3>About ${escapeHtml(authConfig.siteName || 'Starlight')}</h3>
                <p style="margin-top: 12px; color: var(--ink-dim);">Learn about our platform, privacy practices, and terms of service.</p>
              </article>
            </div>
          </div>
        </div>
      `;
    },
    afterRender: function afterRenderSettingsRoute() {
      if (typeof window.switchSettingsCategory === "function") {
        window.switchSettingsCategory("layout");
      }
      if (window.StarlightAuthUI) {
        window.StarlightAuthUI.mountSettingsAuthPanel();
      }
    }
  };
})();
