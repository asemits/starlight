(function () {
  const state = {
    mountSelector: "#weather-root",
    data: null,
    loading: false,
    error: ""
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function ensureStyles() {
    if (document.getElementById("starlight-weather-styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "starlight-weather-styles";
    style.textContent = `
      .weather-page { color: rgba(255,255,255,0.92); font-family: 'Montserrat', sans-serif; }
      .weather-grid-top { display: grid; grid-template-columns: 1.2fr 0.95fr 1.3fr; gap: 12px; margin-bottom: 12px; }
      .weather-panel { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.13); border-radius: 28px; padding: 14px; }
      .weather-panel h2 { margin: 0 0 8px; font-size: 20px; letter-spacing: 0.02em; }
      .alerts-list { display: grid; gap: 8px; }
      .alert-item { border: 1px solid rgba(255,255,255,0.25); border-radius: 14px; padding: 8px 10px; background: rgba(35,35,35,0.62); display: grid; gap: 6px; }
      .alert-item h3 { margin: 0 0 5px; font-size: 14px; }
      .alert-item p { margin: 0; font-size: 12px; opacity: 0.84; line-height: 1.35; }
      .alert-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; font-size: 12px; opacity: 0.88; }
      .alert-description { max-height: 120px; overflow-y: auto; white-space: pre-wrap; line-height: 1.35; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 6px; }
      .alert-actions { max-height: 70px; overflow-y: auto; white-space: pre-wrap; line-height: 1.3; font-size: 12px; opacity: 0.9; background: rgba(0,0,0,0.22); border-radius: 9px; padding: 6px; }
      .alert-description::-webkit-scrollbar, .alert-actions::-webkit-scrollbar { width: 8px; }
      .alert-description::-webkit-scrollbar-thumb, .alert-actions::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 999px; }
      .alert-extreme { border-color: rgba(255,90,90,0.9); }
      .alert-severe { border-color: rgba(255,180,0,0.9); }
      .alert-moderate { border-color: rgba(200,230,0,0.9); }
      .wx-now-main { text-align: center; }
      .wx-now-icon { font-size: 52px; margin: 8px 0; }
      .wx-temp { font-size: 30px; font-weight: 700; margin: 0; }
      .wx-text { font-size: 20px; margin: 2px 0 10px; opacity: 0.9; }
      .wx-mini { font-size: 14px; line-height: 1.45; opacity: 0.88; }
      .wx-mini-row { display: flex; align-items: center; gap: 8px; justify-content: center; }
      .weather-panel canvas { width: 100%; height: 210px; background: rgba(255,255,255,0.04); border-radius: 18px; }
      .wx-strip-label { margin: 0 0 6px; text-align: center; font-size: 32px; letter-spacing: 0.06em; }
      .wx-scroller { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
      .wx-scroller-center { justify-content: center; }
      .wx-scroller::-webkit-scrollbar { height: 10px; }
      .wx-scroller::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 999px; }
      .wx-card { min-width: 210px; max-width: 210px; background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 10px 12px; }
      .wx-card h3 { margin: 0; text-align: center; font-size: 34px; }
      .wx-card-main { text-align: center; margin: 5px 0; }
      .wx-card-main i { display: block; font-size: 28px; margin-bottom: 3px; }
      .wx-card-main .temp { font-size: 18px; }
      .wx-card-main .desc { font-size: 11px; opacity: 0.8; }
      .wx-card-line { display: flex; align-items: center; gap: 7px; font-size: 12px; line-height: 1.3; opacity: 0.9; }
      .wx-card-outlook { text-align: center; margin-top: 8px; font-size: 12px; opacity: 0.88; }
      .wx-status { text-align: center; font-size: 15px; padding: 30px 10px; }
      @media (max-width: 1100px) {
        .weather-grid-top { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function weatherIconClass(code) {
    const c = Number(code);
    if ([0].includes(c)) return "fa-sun";
    if ([1, 2].includes(c)) return "fa-cloud-sun";
    if ([3].includes(c)) return "fa-cloud";
    if ([45, 48].includes(c)) return "fa-smog";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(c)) return "fa-cloud-rain";
    if ([66, 67].includes(c)) return "fa-cloud-meatball";
    if ([71, 73, 75, 77, 85, 86].includes(c)) return "fa-snowflake";
    if ([95, 96, 99].includes(c)) return "fa-cloud-bolt";
    return "fa-cloud";
  }

  function weatherLabel(code) {
    const map = {
      0: "Clear",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Cloudy",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Drizzle",
      55: "Heavy drizzle",
      56: "Freezing drizzle",
      57: "Heavy freezing drizzle",
      61: "Light rain",
      63: "Rain",
      65: "Heavy rain",
      66: "Freezing rain",
      67: "Heavy freezing rain",
      71: "Light snow",
      73: "Snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Rain showers",
      81: "Heavy showers",
      82: "Violent showers",
      85: "Snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunder w/ hail",
      99: "Heavy hail storm"
    };
    return map[Number(code)] || "Unknown";
  }

  function aqiText(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return "N/A";
    if (v <= 50) return "Good";
    if (v <= 100) return "Moderate";
    if (v <= 150) return "Unhealthy SG";
    if (v <= 200) return "Unhealthy";
    if (v <= 300) return "Very Unhealthy";
    return "Hazardous";
  }

  function alertLevelClass(severity) {
    const level = String(severity || "").toLowerCase();
    if (level.includes("extreme")) return "alert-extreme";
    if (level.includes("severe")) return "alert-severe";
    if (level.includes("moderate")) return "alert-moderate";
    return "";
  }

  function windDirShort(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const d = Number(deg);
    if (!Number.isFinite(d)) return "N/A";
    return dirs[Math.round(d / 45) % 8];
  }

  function formatHour(value) {
    const d = new Date(value);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDay(value) {
    const d = new Date(value);
    return d.toLocaleDateString([], { weekday: "short" });
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(String(response.status));
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function resolveGeo() {
    const ipData = await fetchJson("https://api.ipify.org?format=json");
    const ip = ipData && ipData.ip ? ipData.ip : "";
    const providers = [
      async () => {
        const d = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
        if (!d || d.success === false) throw new Error("ipwho");
        return { lat: Number(d.latitude), lon: Number(d.longitude), place: [d.city, d.region, d.country].filter(Boolean).join(", ") };
      },
      async () => {
        const d = await fetchJson(`https://free.freeipapi.com/api/json/${encodeURIComponent(ip)}`);
        return { lat: Number(d.latitude), lon: Number(d.longitude), place: [d.cityName, d.regionName, d.countryName].filter(Boolean).join(", ") };
      },
      async () => {
        const d = await fetchJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
        return { lat: Number(d.latitude), lon: Number(d.longitude), place: [d.city, d.region, d.country_name].filter(Boolean).join(", ") };
      },
      async () => {
        const d = await fetchJson(`https://ipinfo.io/${encodeURIComponent(ip)}/json`);
        const parts = String(d.loc || "").split(",");
        return { lat: Number(parts[0]), lon: Number(parts[1]), place: [d.city, d.region, d.country].filter(Boolean).join(", ") };
      }
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (Number.isFinite(result.lat) && Number.isFinite(result.lon)) {
          return result;
        }
      } catch (_error) {
      }
    }
    throw new Error("Could not resolve geolocation");
  }

  async function getWeatherPayload() {
    const geo = await resolveGeo();
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${geo.lat}&longitude=${geo.lon}&current=us_aqi&timezone=auto`;
    const alertsUrl = `https://api.weather.gov/alerts/active?point=${geo.lat},${geo.lon}`;

    const [forecast, aqi, alerts] = await Promise.all([
      fetchJson(forecastUrl),
      fetchJson(aqiUrl).catch(() => ({ current: {} })),
      fetchJson(alertsUrl).catch(() => ({ features: [] }))
    ]);

    return { geo, forecast, aqi, alerts };
  }

  function renderPoPGraph(canvas, labels, values) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, w, h);

    const left = 34;
    const right = w - 10;
    const top = 12;
    const bottom = h - 24;
    const plotW = right - left;
    const plotH = bottom - top;

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = top + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.font = "11px Montserrat";
    [100, 75, 50, 25, 0].forEach((n, i) => {
      const y = top + (plotH * i) / 4 + 3;
      ctx.fillText(String(n), 4, y);
    });

    if (!values.length) return;

    ctx.strokeStyle = "rgba(90, 175, 255, 0.95)";
    ctx.fillStyle = "rgba(90, 175, 255, 0.16)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    values.forEach((value, i) => {
      const x = left + (plotW * i) / Math.max(1, values.length - 1);
      const y = top + ((100 - value) / 100) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    values.forEach((value, i) => {
      if (i % 2 !== 0) return;
      const x = left + (plotW * i) / Math.max(1, values.length - 1);
      const y = top + ((100 - value) / 100) * plotH;
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(labels[i], x - 14, h - 8);
    });
  }

  function statRow(icon, text, extraStyle) {
    const style = extraStyle ? ` style="${extraStyle}"` : "";
    return `<div class="wx-card-line"><i class="fa-solid ${icon}"${style}></i><span>${text}</span></div>`;
  }

  function buildCard(title, iconClass, temp, desc, pop, windSpeed, windDirDeg, aqi, sunrise, sunset, outlook) {
    const rot = Number.isFinite(Number(windDirDeg)) ? `transform: rotate(${Number(windDirDeg)}deg);` : "";
    return `
      <article class="wx-card">
        <h3>${title}</h3>
        <div class="wx-card-main">
          <i class="fa-solid ${iconClass}"></i>
          <div class="temp">${temp}</div>
          <div class="desc">${desc}</div>
        </div>
        ${statRow("fa-cloud-rain", `PoP ${pop}`)}
        ${statRow("fa-wind", `Speed ${windSpeed}`)}
        ${statRow("fa-location-arrow", `Direction ${windDirDeg}`, rot)}
        ${statRow("fa-lungs", `AQI ${aqi}`)}
        ${statRow("fa-sun", `Sunrise ${sunrise}`)}
        ${statRow("fa-moon", `Sunset ${sunset}`)}
        <div class="wx-card-outlook">${outlook}</div>
      </article>
    `;
  }

  function render() {
    const root = document.querySelector(state.mountSelector);
    if (!root) return;
    ensureStyles();

    if (state.loading) {
      root.innerHTML = `<section class="weather-page"><p class="wx-status">Loading weather...</p></section>`;
      return;
    }

    if (state.error) {
      root.innerHTML = `<section class="weather-page"><p class="wx-status">${state.error}</p></section>`;
      return;
    }

    if (!state.data) {
      root.innerHTML = `<section class="weather-page"><p class="wx-status">No weather data.</p></section>`;
      return;
    }

    const { geo, forecast, aqi, alerts } = state.data;
    const hourly = forecast.hourly || {};
    const daily = forecast.daily || {};
    const current = forecast.current || {};
    const aqiNow = aqi && aqi.current ? aqi.current.us_aqi : null;

    const hourlyCards = [];
    const hourlyCount = Math.min(12, (hourly.time || []).length);
    for (let i = 0; i < hourlyCount; i += 1) {
      hourlyCards.push(buildCard(
        formatHour(hourly.time[i]),
        weatherIconClass(hourly.weather_code[i]),
        `${Math.round(hourly.temperature_2m[i])}F`,
        weatherLabel(hourly.weather_code[i]),
        `${Math.round(hourly.precipitation_probability[i] || 0)}%`,
        `${Math.round(hourly.wind_speed_10m[i] || 0)} mph`,
        windDirShort(hourly.wind_direction_10m[i]),
        `${aqiNow ?? "N/A"} ${aqiText(aqiNow)}`,
        daily.sunrise && daily.sunrise[0] ? formatHour(daily.sunrise[0]) : "--",
        daily.sunset && daily.sunset[0] ? formatHour(daily.sunset[0]) : "--",
      ));
    }

    const dailyCards = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyTime = daily.time || [];
    for (let i = 0; i < dailyTime.length; i += 1) {
      if (dailyCards.length >= 6) {
        break;
      }
      const dayValue = new Date(dailyTime[i]);
      dayValue.setHours(0, 0, 0, 0);
      if (dayValue <= today) {
        continue;
      }
      dailyCards.push(buildCard(
        formatDay(daily.time[i]),
        weatherIconClass(daily.weather_code[i]),
        `${Math.round(daily.temperature_2m_max[i])}F / ${Math.round(daily.temperature_2m_min[i])}F`,
        weatherLabel(daily.weather_code[i]),
        "--",
        `${Math.round(current.wind_speed_10m || 0)} mph`,
        windDirShort(current.wind_direction_10m),
        `${aqiNow ?? "N/A"} ${aqiText(aqiNow)}`,
        daily.sunrise && daily.sunrise[i] ? formatHour(daily.sunrise[i]) : "--",
        daily.sunset && daily.sunset[i] ? formatHour(daily.sunset[i]) : "--",
      ));
    }

    const alertItems = (alerts.features || []).slice(0, 3).map((feature) => {
      const props = feature.properties || {};
      const cls = alertLevelClass(props.severity);
      const title = escapeHtml(props.headline || props.event || "Weather alert");
      const desc = escapeHtml(props.description || "No description");
      const actions = escapeHtml(props.instruction || "Follow local guidance");
      const certainty = escapeHtml(props.certainty || "Unknown");
      const urgency = escapeHtml(props.urgency || "Unknown");
      const severity = escapeHtml(props.severity || "Unknown");
      const expires = props.expires ? new Date(props.expires).toLocaleString() : "N/A";
      return `<article class="alert-item ${cls}">
        <h3>${title}</h3>
        <div class="alert-meta">
          <span>Certainty: ${certainty}</span>
          <span>Urgency: ${urgency}</span>
          <span>Severity: ${severity}</span>
          <span>Expires: ${escapeHtml(expires)}</span>
        </div>
        <div class="alert-description">${desc}</div>
        <div class="alert-actions">Actions: ${actions}</div>
      </article>`;
    }).join("");

    root.innerHTML = `
      <section class="weather-page">
        <div class="weather-grid-top">
          <section class="weather-panel">
            <h2>Alerts</h2>
            <div class="alerts-list">${alertItems || "<p class='wx-status'>No active alerts for this area.</p>"}</div>
          </section>

          <section class="weather-panel wx-now-main">
            <h2>Weather</h2>
            <p>${geo.place || "Unknown location"}</p>
            <div class="wx-now-icon"><i class="fa-solid ${weatherIconClass(current.weather_code)}"></i></div>
            <p class="wx-temp">${Math.round(current.temperature_2m || 0)}F</p>
            <p class="wx-text">${weatherLabel(current.weather_code)}</p>
            <div class="wx-mini">
              <div class="wx-mini-row"><i class="fa-solid fa-cloud-rain"></i><span>PoP ${Math.round(hourly.precipitation_probability && hourly.precipitation_probability[0] || 0)}%</span></div>
              <div class="wx-mini-row"><i class="fa-solid fa-wind"></i><span>Speed ${Math.round(current.wind_speed_10m || 0)} mph</span></div>
              <div class="wx-mini-row"><i class="fa-solid fa-location-arrow" style="transform: rotate(${Number(current.wind_direction_10m || 0)}deg);"></i><span>Direction ${windDirShort(current.wind_direction_10m)}</span></div>
              <div class="wx-mini-row"><i class="fa-solid fa-lungs"></i><span>AQI ${aqiNow ?? "N/A"} (${aqiText(aqiNow)})</span></div>
              <div class="wx-mini-row"><i class="fa-solid fa-sun"></i><span>Sunrise ${daily.sunrise && daily.sunrise[0] ? formatHour(daily.sunrise[0]) : "--"}</span></div>
              <div class="wx-mini-row"><i class="fa-solid fa-moon"></i><span>Sunset ${daily.sunset && daily.sunset[0] ? formatHour(daily.sunset[0]) : "--"}</span></div>
            </div>
          </section>

          <section class="weather-panel">
            <h2 style="text-align:center;">PoP</h2>
            <canvas id="weather-pop-graph"></canvas>
          </section>
        </div>

        <h2 class="wx-strip-label">Hourly</h2>
        <div class="wx-scroller" id="weather-hourly-cards">${hourlyCards.join("")}</div>

        <h2 class="wx-strip-label">Daily</h2>
        <div class="wx-scroller wx-scroller-center" id="weather-daily-cards">${dailyCards.join("")}</div>
      </section>
    `;

    const graphLabels = (hourly.time || []).slice(0, 12).map((item) => formatHour(item));
    const graphValues = (hourly.precipitation_probability || []).slice(0, 12).map((item) => Math.max(0, Math.min(100, Number(item) || 0)));
    const graph = root.querySelector("#weather-pop-graph");
    renderPoPGraph(graph, graphLabels, graphValues);
    window.addEventListener("resize", () => renderPoPGraph(graph, graphLabels, graphValues), { once: true });
  }

  async function load() {
    state.loading = true;
    state.error = "";
    render();
    try {
      state.data = await getWeatherPayload();
    } catch (error) {
      state.error = "Weather data unavailable right now.";
    } finally {
      state.loading = false;
      render();
    }
  }

  function mount(selector) {
    state.mountSelector = selector || state.mountSelector;
    load();
  }

  window.StarlightWeather = { mount };
})();
