(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/apps"] = {
    render: function renderAppsRoute() {
      return `
        <style>
          :root {
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

          .cards-container {
            width: min(1220px, 100% - 2rem);
            margin: 0 auto;
            padding: 1rem 0 3rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 1.15rem;
          }

          h1.tools-title, .titles {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.55rem;
            font-family: 'Cormorant Garamond', 'Georgia', serif;
            font-weight: 400;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: rgba(245, 248, 255, 0.95);
            text-shadow: 0 0 36px rgba(180, 214, 255, 0.28);
            margin: 0.25rem 0 0.6rem;
            opacity: 0;
            animation: cardReveal 0.6s ease 0.05s forwards;
          }

          .tool-card {
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
            text-decoration: none;
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

          .tool-card::before,
          .tool-card::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
          }

          .tool-card::before {
            background: linear-gradient(115deg, transparent 25%, rgba(255, 255, 255, 0.26) 50%, transparent 75%);
            transform: translateX(-135%);
            transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 0.6;
          }

          .tool-card::after {
            border-radius: 22px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            inset: 2px;
          }

          .tool-card:hover {
            transform: translateY(-10px) scale(1.022);
            border-color: var(--apps-card-border-hover);
            box-shadow: var(--apps-card-shadow-hover);
          }

          .tool-card:hover::before {
            transform: translateX(135%);
          }

          .tool-card i,
          .tool-card img {
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

          .tool-card:hover i,
          .tool-card:hover img {
            transform: translateY(-4px) scale(1.08);
            color: rgba(255, 255, 255, 1);
            filter: drop-shadow(0 0 22px rgba(165, 236, 255, 0.45));
          }

          .tool-card h2 {
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

          .tool-card:hover h2 {
            color: rgba(255, 255, 255, 1);
            letter-spacing: 0.19em;
          }

          .tool-card .card-desc {
            font-family: 'Geist', 'Segoe UI', sans-serif;
            font-size: 0.72rem;
            font-weight: 300;
            text-align: center;
            padding: 0 0.7rem;
            line-height: 1.55;
            letter-spacing: 0.04em;
            color: rgba(224, 236, 255, 0.42);
            transform: translateY(10px);
            opacity: 0;
            max-height: 0;
            overflow: hidden;
            transition: transform 0.32s ease, opacity 0.32s ease, max-height 0.32s ease;
            z-index: 1;
          }

          .tool-card:hover .card-desc {
            opacity: 1;
            transform: translateY(0);
            max-height: 90px;
            color: rgba(225, 237, 255, 0.72);
          }

          .tool-card .glow-bar {
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

          .tool-card:hover .glow-bar {
            transform: scaleX(1);
            opacity: 0.95;
          }

          @media (max-width: 900px) {
            .cards-container {
              width: min(980px, 100% - 1.35rem);
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 0.95rem;
              padding-bottom: 2rem;
            }

            .tool-card {
              min-height: 238px;
              border-radius: 18px;
            }
          }

          @media (max-width: 520px) {
            h1.tools-title, .titles {
              letter-spacing: 0.16em;
            }

            .cards-container {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.75rem;
            }

            .tool-card {
              min-height: 210px;
              padding: 0.85rem 0.7rem 0.75rem;
            }

            .tool-card i,
            .tool-card img {
              width: 58px;
              height: 58px;
            }

            .tool-card h2 {
              font-size: 0.67rem;
              letter-spacing: 0.12em;
            }
          }
        </style>
        <div class="cards-container">
          <a href="/soundboard" class="nav-link tool-card" style="animation-delay: 0.2s;">
            <i class="fa-solid fa-volume-high" style="font-size: 52px;"></i>
            <h2>Soundboard</h2>
            <p class="card-desc">Play sound effects</p>
            <div class="glow-bar"></div>
          </a>
          <a href="/weather" class="nav-link tool-card" style="animation-delay: 0.35s;">
            <i class="fa-solid fa-cloud-sun-rain" style="font-size: 52px;"></i>
            <h2>Weather</h2>
            <p class="card-desc">Forecast and alerts</p>
            <div class="glow-bar"></div>
          </a>
          <a href="/music" class="nav-link tool-card" style="animation-delay: 0.5s;">
            <i class="fa-solid fa-music" style="font-size: 52px;"></i>
            <h2>Music</h2>
            <p class="card-desc">Listen to your favorite tracks</p>
            <div class="glow-bar"></div>
          </a>
          <a href="/notepad" class="nav-link tool-card" style="animation-delay: 0.7s;">
            <i class="fa-regular fa-clipboard" style="font-size: 52px;"></i>
            <h2>Notepad</h2>
            <p class="card-desc">Write down stuff</p>
            <div class="glow-bar"></div>
          </a>
          <a href="/timer" class="nav-link tool-card" style="animation-delay: 0.7s;">
            <i class="fa-regular fa-clock" style="font-size: 52px;"></i>
            <h2>Timer</h2>
            <p class="card-desc">Timer + stopwatch</p>
            <div class="glow-bar"></div>
          </a>
          <a href="/maps" class="nav-link tool-card" style="animation-delay: 0.85s;">
            <i class="fa-solid fa-map-location-dot" style="font-size: 52px;"></i>
            <h2>Maps</h2>
            <p class="card-desc">Live map + GPS</p>
            <div class="glow-bar"></div>
          </a>
        </div>
      `;
    }
  };
})();