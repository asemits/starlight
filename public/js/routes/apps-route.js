(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/apps"] = {
    render: function renderAppsRoute() {
      return `
        <style>
          @keyframes cardReveal {
            0%   { opacity: 0; transform: translateY(40px) scale(0.94); filter: blur(8px); }
            60%  { filter: blur(0px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
          }

          @keyframes scanline {
            0%   { transform: translateY(-100%); opacity: 1; }
            100% { transform: translateY(350%); opacity: 0; }
          }

          @keyframes shimmerBorder {
            0%, 100% { opacity: 0.4; }
            50%       { opacity: 1; }
          }

          .cards-container {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            padding: 20px 40px 40px 4%;
            margin-left: 100px;
          }

          h1.tools-title, .titles {
            display: flex;
            justify-content: center;
            font-family: 'Cormorant Garamond', 'Georgia', serif;
            font-weight: 300;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.9);
            text-shadow: 0 0 40px rgba(255,255,255,0.2);
            margin-bottom: 10px;
            opacity: 0;
            animation: cardReveal 0.5s ease 0.1s forwards;
          }

          .tool-card {
            width: 220px;
            height: 280px;
            background: rgba(255,255,255,0.04);
            backdrop-filter: blur(24px) saturate(160%);
            -webkit-backdrop-filter: blur(24px) saturate(160%);
            border: 0.5px solid rgba(255,255,255,0.12);
            border-radius: 20px;
            text-decoration: none;
            color: rgba(255,255,255,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            opacity: 0;
            animation: cardReveal 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transition:
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.5s ease,
              border-color 0.4s ease,
              background 0.4s ease;
          }

          .tool-card::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            border-radius: 20px 20px 0 0;
            transition: opacity 0.4s ease;
          }

          .tool-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 35%;
            background: linear-gradient(to bottom, rgba(255,255,255,0.06), transparent);
            transform: translateY(-100%);
            pointer-events: none;
            z-index: 2;
          }

          .tool-card:hover::before {
            animation: scanline 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .tool-card:hover {
            transform: translateY(-12px) scale(1.03);
            background: rgba(255,255,255,0.08);
            border-color: rgba(255,255,255,0.28);
            box-shadow:
              0 30px 60px rgba(0,0,0,0.7),
              0 0 0 0.5px rgba(255,255,255,0.1),
              0 0 40px rgba(255,255,255,0.04),
              0 1px 0 rgba(255,255,255,0.15) inset;
          }

          .tool-card .corner {
            position: absolute;
            top: 12px; right: 12px;
            width: 10px; height: 10px;
            border-top: 0.5px solid rgba(255,255,255,0.3);
            border-right: 0.5px solid rgba(255,255,255,0.3);
            border-radius: 0 4px 0 0;
            transition: width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease;
          }
          .tool-card:hover .corner {
            width: 18px; height: 18px;
            border-color: rgba(255,255,255,0.7);
          }

          .tool-card .corner-bl {
            position: absolute;
            bottom: 12px; left: 12px;
            width: 10px; height: 10px;
            border-bottom: 0.5px solid rgba(255,255,255,0.3);
            border-left: 0.5px solid rgba(255,255,255,0.3);
            border-radius: 0 0 0 4px;
            transition: width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease;
          }
          .tool-card:hover .corner-bl {
            width: 18px; height: 18px;
            border-color: rgba(255,255,255,0.7);
          }

          .tool-card .glow-bar {
            position: absolute;
            bottom: 0; left: 20%; right: 20%;
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent);
            opacity: 0;
            transition: opacity 0.4s ease, left 0.4s ease, right 0.4s ease;
            z-index: 3;
            border-radius: 1px;
          }
          .tool-card:hover .glow-bar {
            opacity: 1;
            left: 10%;
            right: 10%;
          }

          .tool-card img {
            width: 72px; height: 72px;
            object-fit: contain;
            filter: brightness(0) invert(1) opacity(0.7);
            transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease;
            z-index: 1;
          }
          .tool-card:hover img {
            transform: scale(1.15) translateY(-4px);
            filter: brightness(0) invert(1) opacity(1) drop-shadow(0 0 12px rgba(255,255,255,0.5));
          }

          .tool-card .card-icon-fa {
            font-size: 52px;
            color: rgba(255,255,255,0.5);
            transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease, color 0.4s ease;
            z-index: 1;
          }
          .tool-card:hover .card-icon-fa {
            transform: scale(1.15) translateY(-4px);
            color: rgba(255,255,255,0.95);
            filter: drop-shadow(0 0 14px rgba(255,255,255,0.4));
          }

          .tool-card h2 {
            font-family: 'Geist', 'Segoe UI', sans-serif;
            font-size: 12px;
            font-weight: 300;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin: 0;
            text-align: center;
            z-index: 1;
            color: rgba(255,255,255,0.6);
            transition: color 0.3s ease, text-shadow 0.3s ease;
          }
          .tool-card:hover h2 {
            color: rgba(255,255,255,0.95);
            text-shadow: 0 0 20px rgba(255,255,255,0.3);
          }

          .tool-card .card-desc {
            font-family: 'Geist', 'Segoe UI', sans-serif;
            font-size: 11px;
            font-weight: 200;
            color: rgba(255,255,255,0.0);
            text-align: center;
            padding: 0 18px;
            line-height: 1.7;
            letter-spacing: 0.04em;
            z-index: 1;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.16,1,0.3,1), color 0.4s ease, opacity 0.4s ease;
            opacity: 0;
          }
          .tool-card:hover .card-desc {
            max-height: 80px;
            color: rgba(255,255,255,0.45);
            opacity: 1;
          }
        </style>
        <h1 class="tools-title"><i class="fa-solid fa-shapes"></i>‎ ‎ Apps</h1>
        <br>
        <div class="cards-container">
          <a href="/soundboard" class="nav-link tool-card" style="animation-delay: 0.35s;">
            <i class="fa-solid fa-volume-high"></i>
            <h2>Soundboard</h2>
            <p class="card-desc">Play sound effects</p>
            <div class="glow-bar"></div>
          </a>
          <a href="/weather" class="nav-link tool-card" style="animation-delay: 0.4s;">
            <i class="fa-solid fa-cloud-sun-rain"></i>
            <h2>Weather</h2>
            <p class="card-desc">Forecast and alerts</p>
            <div class="glow-bar"></div>
          </a>
        </div>
      `;
    }
  };
})();
