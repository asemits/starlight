(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/settings"] = {
    render: function renderSettingsRoute() {
      const authConfig = window.NebulaAuthUI && window.NebulaAuthUI.config ? window.NebulaAuthUI.config : {};
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
      const fontChoices = typeof window.getNebulaFontChoices === "function" ? window.getNebulaFontChoices() : [];
      const fontCurrent = typeof window.getNebulaFontPreset === "function" ? window.getNebulaFontPreset() : "geist";
      const fontOptionsHtml = fontChoices.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === fontCurrent ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("");

      return `
        <div class="p-8 max-w-6xl mx-auto">
          <h1 class="text-3xl font-bold font-orbitron mb-6">Settings</h1>
          <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <aside class="bg-white/5 p-4 rounded-2xl border border-white/10 h-fit">
              <div class="flex items-center gap-2 mb-2">
                <button type="button" data-settings-tab="layout" onclick="switchSettingsCategory('layout')" class="flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-white/10 text-gray-300 bg-white/15 border-white/30 text-white transition"><i class="fa-solid fa-bars"></i><span>Layout</span></button>
                <button type="button" onclick="resetSettingsCategory('layout')" title="Reset Layout defaults" class="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <button type="button" data-settings-tab="particles" onclick="switchSettingsCategory('particles')" class="flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-white/10 text-gray-300 transition"><i class="fa-solid fa-wand-magic-sparkles"></i><span>Particles</span></button>
                <button type="button" onclick="resetSettingsCategory('particles')" title="Reset Particles defaults" class="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <button type="button" data-settings-tab="shortcut" onclick="switchSettingsCategory('shortcut')" class="flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-white/10 text-gray-300 transition"><i class="fa-solid fa-keyboard"></i><span>Shortcut</span></button>
                <button type="button" onclick="resetSettingsCategory('shortcut')" title="Reset Shortcut defaults" class="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <button type="button" data-settings-tab="cloak" onclick="switchSettingsCategory('cloak')" class="flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-white/10 text-gray-300 transition"><i class="fa-solid fa-user-secret"></i><span>Tab Cloak</span></button>
                <button type="button" onclick="resetSettingsCategory('cloak')" title="Reset Tab Cloak defaults" class="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" data-settings-tab="widget" onclick="switchSettingsCategory('widget')" class="flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-white/10 text-gray-300 transition"><i class="fa-solid fa-table-cells-large"></i><span>Widget</span></button>
                <button type="button" onclick="resetSettingsCategory('widget')" title="Reset Widget defaults" class="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <button type="button" data-settings-tab="about" onclick="switchSettingsCategory('about')" class="flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-white/10 text-gray-300 transition"><i class="fa-solid fa-circle-info"></i><span>About</span></button>
              </div>
            </aside>

            <section>
              <div data-settings-panel="layout" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('layout-sidebar')" title="Reset Sidebar Position" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Sidebar Position</label>
                  <select onchange="changeSidebarPos(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="top" ${localStorage.getItem('sidebar-pos') === 'top' ? 'selected' : ''}>Top</option>
                    <option value="bottom" ${localStorage.getItem('sidebar-pos') === 'bottom' ? 'selected' : ''}>Bottom</option>
                    <option value="left" ${localStorage.getItem('sidebar-pos') === 'left' ? 'selected' : ''}>Left</option>
                    <option value="right" ${localStorage.getItem('sidebar-pos') === 'right' ? 'selected' : ''}>Right</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('layout-measurement')" title="Reset Measurement System" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Measurement System</label>
                  <select onchange="changeMeasurementSystem(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="imperial" ${window.getMeasurementSystem() === 'metric' ? '' : 'selected'}>Imperial (F, mph)</option>
                    <option value="metric" ${window.getMeasurementSystem() === 'metric' ? 'selected' : ''}>Metric (C, km/h)</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10 sm:col-span-2">
                  <button type="button" onclick="resetSettingsCard('layout-font')" title="Reset Font" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Font Preset</label>
                  <select id="settings-font-preset" onchange="changeNebulaFontPreset(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none mb-4">
                    ${fontOptionsHtml}
                  </select>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label class="block mb-2 text-sm text-gray-300">Custom Font CSS/File URL (https)</label>
                      <input id="settings-font-url" type="url" placeholder="https://fonts.googleapis.com/css2?family=Your+Font" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none" />
                    </div>
                    <div>
                      <label class="block mb-2 text-sm text-gray-300">Custom Font Family Name</label>
                      <input id="settings-font-family" type="text" placeholder="Your Font" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none" />
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 mb-3">
                    <button type="button" id="settings-font-apply-url" class="px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Apply URL Font</button>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label class="block mb-2 text-sm text-gray-300">Upload Font File (.woff2, .woff, .ttf, .otf)</label>
                      <input id="settings-font-upload" type="file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" class="w-full bg-black border border-white/20 p-2 rounded-xl text-white outline-none" />
                    </div>
                    <div>
                      <label class="block mb-2 text-sm text-gray-300">Upload Font Family Name</label>
                      <input id="settings-font-upload-family" type="text" placeholder="My Uploaded Font" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none" />
                    </div>
                  </div>
                  <p id="settings-font-status" class="text-sm text-gray-300">Choose a preset, use a custom URL, or upload a local font file.</p>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('games-pagination')" title="Reset Games Pagination" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Games Pagination</label>
                  <select onchange="changeGamesPaginationMode(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="numbered" ${localStorage.getItem('games-pagination-mode') === 'alphabetical' ? '' : 'selected'}>Numbered</option>
                    <option value="alphabetical" ${localStorage.getItem('games-pagination-mode') === 'alphabetical' ? 'selected' : ''}>Alphabetical</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('layout-dashboard-recent')" title="Reset Recently Played Section" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Dashboard Recently Played</label>
                  <select onchange="changeDashboardSectionVisibility('recent', this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="on" ${window.getDashboardSectionVisibility('recent') === 'on' ? 'selected' : ''}>On</option>
                    <option value="off" ${window.getDashboardSectionVisibility('recent') === 'off' ? 'selected' : ''}>Off</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('layout-dashboard-favorites')" title="Reset Favorites Section" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Dashboard Favorites</label>
                  <select onchange="changeDashboardSectionVisibility('favorites', this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="on" ${window.getDashboardSectionVisibility('favorites') === 'on' ? 'selected' : ''}>On</option>
                    <option value="off" ${window.getDashboardSectionVisibility('favorites') === 'off' ? 'selected' : ''}>Off</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('layout-dashboard-stats')" title="Reset Stats Section" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Dashboard Stats</label>
                  <select onchange="changeDashboardSectionVisibility('stats', this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="on" ${window.getDashboardSectionVisibility('stats') === 'on' ? 'selected' : ''}>On</option>
                    <option value="off" ${window.getDashboardSectionVisibility('stats') === 'off' ? 'selected' : ''}>Off</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('layout-dashboard-recent-music')" title="Reset Recently Played Music Section" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Dashboard Recently Played Music</label>
                  <select onchange="changeDashboardSectionVisibility('recent-music', this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="on" ${window.getDashboardSectionVisibility('recent-music') === 'on' ? 'selected' : ''}>On</option>
                    <option value="off" ${window.getDashboardSectionVisibility('recent-music') === 'off' ? 'selected' : ''}>Off</option>
                  </select>
                </article>
              </div>

              <div data-settings-panel="particles" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('particles-enabled')" title="Reset Particles" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Particles</label>
                  <select onchange="changeGamesParticlesEnabled(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="on" ${localStorage.getItem('games-particles-enabled') === 'off' ? '' : 'selected'}>On</option>
                    <option value="off" ${localStorage.getItem('games-particles-enabled') === 'off' ? 'selected' : ''}>Off</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('particles-bonds')" title="Reset Particle Bonds" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Particle Bonds</label>
                  <select onchange="changeGamesParticlesBonds(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="off" ${localStorage.getItem('games-particles-bonds') === 'on' ? '' : 'selected'}>Off</option>
                    <option value="on" ${localStorage.getItem('games-particles-bonds') === 'on' ? 'selected' : ''}>On</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('particles-color')" title="Reset Particle Color" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Particle Color</label>
                  <input type="color" value="${localStorage.getItem('games-particles-color') || '#ffffff'}" onchange="changeGamesParticlesColor(this.value)" class="w-full h-12 bg-black border border-white/20 rounded-xl text-white outline-none">
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('particles-shape')" title="Reset Particle Shape" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Particle Shape</label>
                  <select onchange="changeGamesParticlesShape(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="circle" ${window.getGamesParticlesShape() === 'circle' ? 'selected' : ''}>Circle</option>
                    <option value="square" ${window.getGamesParticlesShape() === 'square' ? 'selected' : ''}>Square</option>
                    <option value="triangle" ${window.getGamesParticlesShape() === 'triangle' ? 'selected' : ''}>Triangle</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('particles-frequency')" title="Reset Particle Frequency" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Particle Frequency</label>
                  <select onchange="changeGamesParticlesFrequency(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="low" ${window.getGamesParticlesFrequency() === 'low' ? 'selected' : ''}>Low</option>
                    <option value="normal" ${window.getGamesParticlesFrequency() === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="high" ${window.getGamesParticlesFrequency() === 'high' ? 'selected' : ''}>High</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('particles-size')" title="Reset Particle Size" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Particle Size</label>
                  <select onchange="changeGamesParticlesSize(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="small" ${window.getGamesParticlesSize() === 'small' ? 'selected' : ''}>Small</option>
                    <option value="medium" ${window.getGamesParticlesSize() === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="large" ${window.getGamesParticlesSize() === 'large' ? 'selected' : ''}>Large</option>
                  </select>
                </article>
              </div>

              <div data-settings-panel="shortcut" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10 sm:col-span-2">
                  <button type="button" onclick="resetSettingsCard('shortcut-main')" title="Reset Shortcut" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Shortcut Enabled</label>
                  <select onchange="changeShortcutEnabled(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none mb-4">
                    <option value="off" ${window.getShortcutEnabled() === 'on' ? '' : 'selected'}>Off</option>
                    <option value="on" ${window.getShortcutEnabled() === 'on' ? 'selected' : ''}>On</option>
                  </select>
                  <label class="block mb-2 text-sm text-gray-300">Shortcut Combo</label>
                  <div class="flex flex-wrap gap-2 mb-2">
                    <input id="shortcut-combo-display" type="text" readonly value="${window.getShortcutDisplay()}" class="flex-1 min-w-[220px] bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <button type="button" onclick="startShortcutCapture()" class="px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Record Combo</button>
                  </div>
                  <p id="shortcut-capture-status" class="text-sm text-gray-300 mb-4">Ready</p>
                  <label class="block mb-2 text-sm text-gray-300">Open This Page When Triggered</label>
                  <input type="text" value="${window.getShortcutTarget()}" onchange="changeShortcutTarget(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none" placeholder="/games">
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('shortcut-anticlose')" title="Reset Anti-Close" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Anti-Close</label>
                  <select onchange="changeAntiCloseEnabled(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="on" ${window.getAntiCloseEnabled() === 'on' ? 'selected' : ''}>On</option>
                    <option value="off" ${window.getAntiCloseEnabled() === 'off' ? 'selected' : ''}>Off</option>
                  </select>
                </article>
              </div>

              <div data-settings-panel="cloak" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('cloak-main')" title="Reset Wrapper Settings" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Auto Open In Wrapper</label>
                  <select onchange="changeWrapEnabled(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none mb-4">
                    <option value="off" ${window.getWrapEnabled() === 'on' ? '' : 'selected'}>Off</option>
                    <option value="on" ${window.getWrapEnabled() === 'on' ? 'selected' : 'selected'}>On</option>
                  </select>
                  <label class="block mb-2 text-sm text-gray-300">Wrapper Mode</label>
                  <select onchange="changeWrapMode(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="about-blank" ${window.getWrapMode() === 'about-blank' ? 'selected' : ''}>about:blank</option>
                    <option value="blob" ${window.getWrapMode() === 'blob' ? 'selected' : ''}>blob:</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <label class="block mb-2 text-sm text-gray-300">Tab Disguise (Cloak)</label>
                  <div class="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <button type="button" onclick="applyCloak('Home - Google Drive', 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" class="w-5 h-5"> Google Drive
                    </button>
                    <button type="button" onclick="applyCloak('Dashboard', 'https://instructure-uploads.s3.amazonaws.com/account_96810000000000001/attachments/1049/Canvas_logo_gray2.png')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="https://instructure-uploads.s3.amazonaws.com/account_96810000000000001/attachments/1049/Canvas_logo_gray2.png" class="w-5 h-5"> Dashboard
                    </button>
                    <button type="button" onclick="applyCloak('Google', 'https://www.google.com/favicon.ico')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="https://www.google.com/favicon.ico" class="w-5 h-5"> Google
                    </button>
                    <button type="button" onclick="applyCloak('Nebula', '/static/logo.png')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="/static/logo.png" class="w-5 h-5"> Nebula  
                    </button>
                    <button type="button" onclick="applyCloak('Blooket – Fun, Free, Educational Games for Everyone', 'http://www.google.com/s2/favicons?domain=blooket.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=blooket.com" class="w-5 h-5"> Blooket  
                    </button>
                    <button type="button" onclick="applyCloak('Google Slides', 'https://www.gstatic.com/images/branding/product/1x/slides_2020q4_48dp.png')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="https://www.gstatic.com/images/branding/product/1x/slides_2020q4_48dp.png" class="w-5 h-5"> Google Slides  
                    </button>
                    <button type="button" onclick="applyCloak('Home | Gimkit', 'http://www.google.com/s2/favicons?domain=gimkit.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=gimkit.com" class="w-5 h-5"> Gimkit  
                    </button>
                    <button type="button" onclick="applyCloak('Enter Game PIN - Kahoot!', 'http://www.google.com/s2/favicons?domain=kahoot.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=kahoot.com" class="w-5 h-5"> Kahoot  
                    </button>
                    <button type="button" onclick="applyCloak('Google', 'http://www.google.com/s2/favicons?domain=google.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=google.com" class="w-5 h-5"> Google  
                    </button>
                    <button type="button" onclick="applyCloak('Sections | CodeHS', 'http://www.google.com/s2/favicons?domain=codehs.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=codehs.com" class="w-5 h-5"> CodeHS  
                    </button>
                    <button type="button" onclick="applyCloak('For Students - Enter Your Code | Wayground (Formerly Quizziz)', 'http://www.google.com/s2/favicons?domain=wayground.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=wayground.com" class="w-5 h-5"> Wayground  
                    </button>
                    <button type="button" onclick="applyCloak('Edpuzzle', 'http://www.google.com/s2/favicons?domain=edpuzzle.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=edpuzzle.com" class="w-5 h-5"> Edpuzzle  
                    </button>
                    <button type="button" onclick="applyCloak('Clever | Portal', 'http://www.google.com/s2/favicons?domain=clever.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=clever.com" class="w-5 h-5"> Clever  
                    </button>
                    <button type="button" onclick="applyCloak('Dashboard | Khan Academy', 'http://www.google.com/s2/favicons?domain=khanacademy.org')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=khanacademy.org" class="w-5 h-5"> Khan Academy  
                    </button>
                    <button type="button" onclick="applyCloak('Chrome New Tab', 'https://cdn.jsdelivr.net/gh/PopAnynomous234/assets/chrome.png')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="https://cdn.jsdelivr.net/gh/PopAnynomous234/assets/chrome.png" class="w-5 h-5"> Chrome New Tab  
                    </button>
                    <button type="button" onclick="applyCloak('Seesaw', 'http://www.google.com/s2/favicons?domain=seesaw.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=seesaw.com" class="w-5 h-5"> Seesaw  
                    </button>
                    <button type="button" onclick="applyCloak('Home - Classroom', 'http://www.google.com/s2/favicons?domain=classroom.google.com')" class="w-full text-left px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3">
                      <img src="http://www.google.com/s2/favicons?domain=classroom.google.com" class="w-5 h-5"> Google Classroom  
                    </button>
                  </div>
    
                  
                </article>
                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                <div style="margin-bottom: 15px;">
        <label style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; color: #ccc;">Custom Title</label>
        <input type="text" id="titleInput" placeholder="Enter title..." style="
            width: 100%;
            padding: 12px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            outline: none;
            box-sizing: border-box;
        ">
    </div>
    
    <div style="margin-bottom: 25px;">
        <label style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; color: #ccc;">Favicon URL</label>
        <input type="text" id="iconInput" placeholder="https://..." style="
            width: 100%;
            padding: 12px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            outline: none;
            box-sizing: border-box;
        ">
    </div>

    <button onclick="handleApply()" style="
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(90deg, #ffffff 0%, #d1d1d1 100%);
        color: #1a1a1a;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
        margin-bottom: 10px;
    ">Apply Changes</button>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('cloak-open')" title="Reset Open Immediately" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Open Immediately</label>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" onclick="openWrappedNow('about-blank')" class="px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Open about:blank</button>
                    <button type="button" onclick="openWrappedNow('blob')" class="px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Open blob:</button>
                  </div>
                </article>
              </div>

              <div data-settings-panel="widget" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('widget-main')" title="Reset Widget Main" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Widget Enabled</label>
                  <select onchange="changeInfoWidgetEnabled(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none mb-4">
                    <option value="on" ${window.getInfoWidgetEnabled() === 'on' ? 'selected' : ''}>On</option>
                    <option value="off" ${window.getInfoWidgetEnabled() === 'off' ? 'selected' : ''}>Off</option>
                  </select>

                  <label class="block mb-2 text-sm text-gray-300">Time Mode</label>
                  <select onchange="changeInfoWidgetTimeMode(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                    <option value="12" ${window.getInfoWidgetTimeMode() === '12' ? 'selected' : ''}>12-hour</option>
                    <option value="24" ${window.getInfoWidgetTimeMode() === '24' ? 'selected' : ''}>24-hour / military</option>
                  </select>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
                  <button type="button" onclick="resetSettingsCard('widget-format')" title="Reset Widget Format" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Date/Time Format (strftime)</label>
                  <input type="text" value="${window.getInfoWidgetFormat()}" onchange="changeInfoWidgetFormat(this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none mb-2" placeholder="%Y-%m-%d %H:%M:%S">
                  <a href="/static/images/image.png" class="nav-link inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-sm"> <span>Reference</span> </a>
                  <button type="button" onclick="resetInfoWidgetPosition()" class="w-full mt-2 mb-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Reset Widget Position</button>
                </article>

                <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10 sm:col-span-2">
                  <button type="button" onclick="resetSettingsCard('widget-content')" title="Reset Widget Content" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-rotate-left"></i></button>
                  <label class="block mb-2 text-sm text-gray-300">Widget Content</label>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block mb-2 text-sm text-gray-300">Weather Row</label>
                      <select onchange="changeInfoWidgetSectionVisibility('weather', this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                        <option value="on" ${window.getInfoWidgetSectionVisibility('weather') === 'on' ? 'selected' : ''}>Include</option>
                        <option value="off" ${window.getInfoWidgetSectionVisibility('weather') === 'off' ? 'selected' : ''}>Exclude</option>
                      </select>
                    </div>
                    <div>
                      <label class="block mb-2 text-sm text-gray-300">Date/Time Row</label>
                      <select onchange="changeInfoWidgetSectionVisibility('datetime', this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                        <option value="on" ${window.getInfoWidgetSectionVisibility('datetime') === 'on' ? 'selected' : ''}>Include</option>
                        <option value="off" ${window.getInfoWidgetSectionVisibility('datetime') === 'off' ? 'selected' : ''}>Exclude</option>
                      </select>
                    </div>
                    <div>
                      <label class="block mb-2 text-sm text-gray-300">Battery Row</label>
                      <select onchange="changeInfoWidgetSectionVisibility('battery', this.value)" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none">
                        <option value="on" ${window.getInfoWidgetSectionVisibility('battery') === 'on' ? 'selected' : ''}>Include</option>
                        <option value="off" ${window.getInfoWidgetSectionVisibility('battery') === 'off' ? 'selected' : ''}>Exclude</option>
                      </select>
                    </div>
                  </div>
                </article>
              </div>

              <div data-settings-panel="about" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article class="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h2 class="text-lg font-semibold mb-3">Privacy Policy</h2>
                  <div class="text-sm text-gray-200 leading-6 max-h-[420px] overflow-y-auto pr-1">${privacyHtml}</div>
                </article>

                <article class="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h2 class="text-lg font-semibold mb-3">Terms of Service</h2>
                  <div class="text-sm text-gray-200 leading-6 max-h-[420px] overflow-y-auto pr-1">${tosHtml}</div>
                </article>

                <article class="bg-white/5 p-6 rounded-2xl border border-white/10 sm:col-span-2">
                  <h2 class="text-lg font-semibold mb-2">Markdown Guide</h2>
                  <p class="text-sm text-gray-200 leading-6 mb-4">Learn every chat formatting feature including headers, emphasis, code blocks, lists, block quotes, links, and escaping with a backslash.</p>
                  <a href="/markdown-guide" class="nav-link inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">
                    <i class="fa-solid fa-book-open"></i>
                    <span>Open Markdown Guide</span>
                  </a>
                </article>
              </div>
            </section>
          </div>
        </div>
      `;
    },
    afterRender: function afterRenderSettingsRoute() {
      if (typeof window.switchSettingsCategory === "function") {
        window.switchSettingsCategory("layout");
      }
      const statusNode = document.getElementById("settings-font-status");
      const applyUrlBtn = document.getElementById("settings-font-apply-url");
      const uploadInput = document.getElementById("settings-font-upload");
      const urlInput = document.getElementById("settings-font-url");
      const familyInput = document.getElementById("settings-font-family");
      const uploadFamilyInput = document.getElementById("settings-font-upload-family");

      function setFontStatus(text, ok) {
        if (!statusNode) {
          return;
        }
        statusNode.textContent = text;
        statusNode.classList.toggle("text-emerald-300", Boolean(ok));
        statusNode.classList.toggle("text-red-300", !ok);
      }

      if (applyUrlBtn) {
        applyUrlBtn.addEventListener("click", () => {
          if (typeof window.applyNebulaCustomFontUrl !== "function") {
            setFontStatus("Font engine unavailable.", false);
            return;
          }
          const ok = window.applyNebulaCustomFontUrl(
            urlInput ? urlInput.value : "",
            familyInput ? familyInput.value : ""
          );
          if (ok) {
            setFontStatus("Custom URL font applied.", true);
          } else {
            setFontStatus("Enter a valid https URL and font family name.", false);
          }
        });
      }

      if (uploadInput) {
        uploadInput.addEventListener("change", async () => {
          const file = uploadInput.files && uploadInput.files[0] ? uploadInput.files[0] : null;
          const familyName = uploadFamilyInput ? uploadFamilyInput.value : "";
          if (!file) {
            return;
          }
          if (!familyName || !familyName.trim()) {
            setFontStatus("Enter an upload font family name first.", false);
            return;
          }
          if (typeof window.applyNebulaUploadedFontFile !== "function") {
            setFontStatus("Font engine unavailable.", false);
            return;
          }
          setFontStatus("Uploading and applying font...", true);
          const ok = await window.applyNebulaUploadedFontFile(file, familyName);
          if (ok) {
            setFontStatus("Uploaded font applied.", true);
          } else {
            setFontStatus("Could not apply uploaded font.", false);
          }
        });
      }
      if (window.NebulaAuthUI) {
        window.NebulaAuthUI.mountSettingsAuthPanel();
      }
    }
  };
})();