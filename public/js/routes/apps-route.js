(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  const FALLBACK_CATALOG = [
    { id: "soundboard", title: "Soundboard", description: "Play sound effects", icon: "fa-solid fa-volume-high", href: "/soundboard" },
    { id: "weather", title: "Weather", description: "Forecast and alerts", icon: "fa-solid fa-cloud-sun-rain", href: "/weather" },
    { id: "music", title: "Music", description: "Listen to your favorite tracks", icon: "fa-solid fa-music", href: "/music" },
    { id: "notepad", title: "Notepad", description: "Write down stuff", icon: "fa-regular fa-clipboard", href: "/notepad" },
    { id: "timer", title: "Timer", description: "Timer + stopwatch", icon: "fa-regular fa-clock", href: "/timer" },
    { id: "maps", title: "Maps", description: "Live map + GPS", icon: "fa-solid fa-map-location-dot", href: "/maps" },
    { id: "calc", title: "Calculator", description: "Basic and scientific calculations", icon: "fa-solid fa-calculator", href: "/calc" }
  ];

  function getCatalog() {
    if (typeof window.getNebulaAppCatalog === "function") {
      const catalog = window.getNebulaAppCatalog();
      if (Array.isArray(catalog) && catalog.length) {
        return catalog;
      }
    }
    return FALLBACK_CATALOG;
  }

  function getInstalled() {
    if (typeof window.getNebulaInstalledApps === "function") {
      return window.getNebulaInstalledApps();
    }
    try {
      const parsed = JSON.parse(localStorage.getItem("nebula-installed-apps") || "[]");
      return Array.isArray(parsed) ? parsed.map((id) => String(id || "").trim()).filter(Boolean) : [];
    } catch (_error) {
      return [];
    }
  }

  function setInstalled(appId, install) {
    if (typeof window.toggleNebulaAppInstalled === "function") {
      return window.toggleNebulaAppInstalled(appId, install);
    }
    const set = new Set(getInstalled());
    if (install) {
      set.add(String(appId || "").trim());
    } else {
      set.delete(String(appId || "").trim());
    }
    const next = Array.from(set);
    localStorage.setItem("nebula-installed-apps", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("nebula:apps-installed-changed", { detail: { ids: next.slice() } }));
    return next;
  }

  modules["/apps"] = {
    render: function renderAppsRoute() {
      const catalog = getCatalog();
      const installed = new Set(getInstalled());
      const cards = catalog.map((app, index) => {
        const isInstalled = installed.has(String(app.id || ""));
        const installLabel = isInstalled ? "Installed" : "Install";
        const installClass = isInstalled ? " is-installed" : "";
        const openAction = isInstalled
          ? `<a href="${String(app.href || "/apps")}" class="nav-link nebula-store-open">Open</a>`
          : "";
        return `
          <article class="nebula-store-card" style="animation-delay:${(0.08 * (index + 1)).toFixed(2)}s;">
            <div class="nebula-store-icon"><i class="${String(app.icon || "fa-solid fa-shapes")}"></i></div>
            <h2>${String(app.title || "App")}</h2>
            <p class="nebula-store-desc">${String(app.description || "Install this app to add it to your home screen.")}</p>
            <div class="nebula-store-actions">
              <button type="button" data-install-app="${String(app.id || "")}" data-app-href="${String(app.href || "/apps")}" class="nebula-store-install${installClass}">${installLabel}</button>
              ${openAction}
            </div>
            <div class="glow-bar"></div>
          </article>
        `;
      }).join("");

      return `
        <style>
          .nebula-appstore {
            --apps-card-bg: rgba(10, 13, 24, 0.66);
            --apps-card-border: rgba(184, 200, 255, 0.18);
            --apps-card-border-hover: rgba(212, 222, 255, 0.52);
            --apps-card-shadow: 0 24px 60px rgba(0, 0, 0, 0.46);
            --apps-card-shadow-hover: 0 34px 80px rgba(0, 0, 0, 0.58);
            --apps-accent: rgba(144, 222, 255, 0.55);
          }

          @keyframes cardReveal {
            0% { opacity: 0; transform: translateY(38px) scale(0.96); filter: blur(8px); }
            65% { filter: blur(0); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          }

          .nebula-appstore {
            width: min(1220px, 100% - 2rem);
            margin: 0 auto;
            padding: 0.75rem 0 3rem;
          }

          .nebula-store-head {
            margin: 0 0 1rem;
            padding: 1rem 1rem 0.35rem;
          }

          .nebula-store-head h1 {
            margin: 0;
            font-family: 'Cormorant Garamond', 'Georgia', serif;
            font-weight: 500;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(245, 248, 255, 0.95);
            text-shadow: 0 0 36px rgba(180, 214, 255, 0.28);
          }

          .nebula-store-head p {
            margin: 0.45rem 0 0;
            font-size: 0.85rem;
            color: rgba(218, 233, 255, 0.66);
            letter-spacing: 0.06em;
          }

          .nebula-store-grid {
            width: min(1220px, 100% - 2rem);
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 1.15rem;
          }

          .nebula-store-card {
            min-height: 270px;
            padding: 1.1rem 1rem 1rem;
            background:
              radial-gradient(120% 85% at 100% 0%, rgba(129, 219, 255, 0.12), transparent 46%),
              radial-gradient(110% 90% at 0% 100%, rgba(140, 166, 255, 0.15), transparent 52%),
              var(--apps-card-bg);
            backdrop-filter: blur(18px) saturate(160%);
            -webkit-backdrop-filter: blur(18px) saturate(160%);
            border: 1px solid var(--apps-card-border);
            border-radius: 22px;
            color: rgba(240, 246, 255, 0.82);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.65rem;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            opacity: 0;
            animation: cardReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            box-shadow: var(--apps-card-shadow);
            transition: transform 0.42s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.42s ease, border-color 0.32s ease;
          }

          .nebula-store-card::before,
          .nebula-store-card::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
          }

          .nebula-store-card::before {
            background: linear-gradient(115deg, transparent 25%, rgba(255, 255, 255, 0.26) 50%, transparent 75%);
            transform: translateX(-135%);
            transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 0.6;
          }

          .nebula-store-card::after {
            border-radius: 22px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            inset: 2px;
          }

          .nebula-store-card:hover {
            transform: translateY(-10px) scale(1.022);
            border-color: var(--apps-card-border-hover);
            box-shadow: var(--apps-card-shadow-hover);
          }

          .nebula-store-card:hover::before {
            transform: translateX(135%);
          }

          .nebula-store-icon i {
            width: 72px;
            height: 72px;
            display: grid;
            place-items: center;
            object-fit: contain;
            color: rgba(236, 243, 255, 0.84);
            filter: drop-shadow(0 0 18px rgba(145, 222, 255, 0.2));
            transition: transform 0.42s cubic-bezier(0.2, 0.8, 0.2, 1), color 0.35s ease, filter 0.35s ease;
            z-index: 1;
          }

          .nebula-store-card:hover .nebula-store-icon i {
            transform: translateY(-4px) scale(1.08);
            color: rgba(255, 255, 255, 1);
            filter: drop-shadow(0 0 22px rgba(165, 236, 255, 0.45));
          }

          .nebula-store-card h2 {
            font-family: 'Geist', 'Segoe UI', sans-serif;
            font-size: 0.78rem;
            font-weight: 500;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            margin: 0;
            text-align: center;
            color: rgba(238, 244, 255, 0.86);
            transition: letter-spacing 0.28s ease, color 0.28s ease;
            z-index: 1;
          }

          .nebula-store-card:hover h2 {
            color: rgba(255, 255, 255, 1);
            letter-spacing: 0.19em;
          }

          .nebula-store-desc {
            font-family: 'Geist', 'Segoe UI', sans-serif;
            font-size: 0.72rem;
            font-weight: 300;
            text-align: center;
            padding: 0 0.7rem;
            line-height: 1.55;
            letter-spacing: 0.04em;
            color: rgba(225, 237, 255, 0.72);
            z-index: 1;
          }

          .nebula-store-actions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.55rem;
            margin-top: 0.25rem;
            z-index: 1;
          }

          .nebula-store-actions.has-open {
            grid-template-columns: 1fr 1fr;
          }

          .nebula-store-install,
          .nebula-store-open {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 38px;
            border-radius: 11px;
            border: 1px solid rgba(255, 255, 255, 0.24);
            background: rgba(255, 255, 255, 0.08);
            color: rgba(239, 246, 255, 0.92);
            text-decoration: none;
            font-size: 0.72rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          }

          .nebula-store-install:hover,
          .nebula-store-open:hover {
            background: rgba(255, 255, 255, 0.16);
            border-color: rgba(255, 255, 255, 0.44);
            transform: translateY(-1px);
          }

          .nebula-store-install.is-installed {
            background: rgba(122, 238, 181, 0.18);
            border-color: rgba(122, 238, 181, 0.56);
            color: rgba(214, 255, 236, 0.98);
          }

          .nebula-store-card .glow-bar {
            position: absolute;
            bottom: 0;
            left: 16%;
            right: 16%;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, transparent, var(--apps-accent), transparent);
            opacity: 0.25;
            transform: scaleX(0.72);
            transition: transform 0.34s ease, opacity 0.34s ease;
            z-index: 1;
          }

          .nebula-store-card:hover .glow-bar {
            transform: scaleX(1);
            opacity: 0.95;
          }

          @media (max-width: 900px) {
            .nebula-appstore {
              width: min(980px, 100% - 1.35rem);
            }

            .nebula-store-grid {
              width: min(980px, 100% - 1.35rem);
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 0.95rem;
              padding-bottom: 2rem;
            }

            .nebula-store-card {
              min-height: 238px;
              border-radius: 18px;
            }
          }

          @media (max-width: 520px) {
            .nebula-store-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.75rem;
            }

            .nebula-store-card {
              min-height: 210px;
              padding: 0.85rem 0.7rem 0.75rem;
            }

            .nebula-store-icon i {
              width: 58px;
              height: 58px;
            }

            .nebula-store-card h2 {
              font-size: 0.67rem;
              letter-spacing: 0.12em;
            }

            .nebula-store-actions {
              grid-template-columns: 1fr;
            }
          }
        </style>
        <section class="nebula-appstore">
          <header class="nebula-store-head">
            <h1>App Store</h1>
            <p>Install apps to pin them to your home screen. Stored on this device.</p>
          </header>
          <div class="nebula-store-grid">
            ${cards}
          </div>
        </section>
      `;
    },
    afterRender: function afterRenderAppsRoute() {
      function setOpenVisibility(button, show) {
        const actions = button.closest(".nebula-store-actions");
        if (!actions) {
          return;
        }
        const appHref = String(button.getAttribute("data-app-href") || "/apps").trim() || "/apps";
        const existingOpen = actions.querySelector(".nebula-store-open");
        if (show) {
          if (!existingOpen) {
            const openLink = document.createElement("a");
            openLink.href = appHref;
            openLink.className = "nav-link nebula-store-open";
            openLink.textContent = "Open";
            actions.appendChild(openLink);
          }
          actions.classList.add("has-open");
          return;
        }
        if (existingOpen) {
          existingOpen.remove();
        }
        actions.classList.remove("has-open");
      }



      const buttons = Array.from(document.querySelectorAll("[data-install-app]"));
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const appId = String(button.getAttribute("data-install-app") || "").trim();
          if (!appId) {
            return;
          }
          if (button.classList.contains("is-installing")) {
            return;
          }

          const isInstalled = button.classList.contains("is-installed");
          if (!isInstalled) {
            button.classList.add("is-installed");
            button.textContent = "Installed";
            setInstalled(appId, true);
            setOpenVisibility(button, true);
            return;
          }

          setInstalled(appId, false);
          button.classList.remove("is-installed");
          button.textContent = "Install";
          setOpenVisibility(button, false);
        });

        const actions = button.closest(".nebula-store-actions");
        if (actions) {
          actions.classList.toggle("has-open", Boolean(actions.querySelector(".nebula-store-open")));
        }
      });
    }
  };
})();