(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  const MAPLIBRE_CSS_ID = "nebula-maplibre-css";
  const MAPLIBRE_SCRIPT_ID = "nebula-maplibre-script";
  const MAPLIBRE_SCRIPT_SRC = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
  const MAPLIBRE_CSS_HREF = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
  const ACCURACY_SOURCE_ID = "nebula-accuracy-source";
  const ACCURACY_FILL_LAYER_ID = "nebula-accuracy-fill";
  const ACCURACY_STROKE_LAYER_ID = "nebula-accuracy-stroke";
  const DEFAULT_CENTER = [0, 0];
  const DEFAULT_ZOOM = 2;

  function ensureMapLibreLoaded() {
    if (window.maplibregl && window.maplibregl.Map) {
      return Promise.resolve(window.maplibregl);
    }

    return new Promise(function loadMapLibre(resolve, reject) {
      let css = document.getElementById(MAPLIBRE_CSS_ID);
      if (!css) {
        css = document.createElement("link");
        css.id = MAPLIBRE_CSS_ID;
        css.rel = "stylesheet";
        css.href = MAPLIBRE_CSS_HREF;
        css.crossOrigin = "";
        document.head.appendChild(css);
      }

      const existingScript = document.getElementById(MAPLIBRE_SCRIPT_ID);
      if (existingScript) {
        if (window.maplibregl && window.maplibregl.Map) {
          resolve(window.maplibregl);
          return;
        }
        existingScript.addEventListener("load", function onLoad() {
          resolve(window.maplibregl);
        }, { once: true });
        existingScript.addEventListener("error", function onError() {
          reject(new Error("MapLibre failed to load."));
        }, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = MAPLIBRE_SCRIPT_ID;
      script.src = MAPLIBRE_SCRIPT_SRC;
      script.async = true;
      script.crossOrigin = "";
      script.onload = function onScriptLoad() {
        resolve(window.maplibregl);
      };
      script.onerror = function onScriptError() {
        reject(new Error("MapLibre failed to load."));
      };
      document.head.appendChild(script);
    });
  }

  function addMarker(map, markers, latitude, longitude, labelText) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    const popupText = String(labelText || "Marker") + "<br>" + lat.toFixed(5) + ", " + lng.toFixed(5);
    const popup = new window.maplibregl.Popup({ offset: 24 }).setHTML(popupText);
    const marker = new window.maplibregl.Marker({ color: "#67f6ff" })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);
    markers.push({ marker: marker, lat: lat, lng: lng, label: labelText || "Marker" });
    return marker;
  }

  function createAccuracyGeoJSON(longitude, latitude, radiusMeters) {
    const steps = 64;
    const earthRadius = 6378137;
    const latRad = latitude * Math.PI / 180;
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const dLat = (radiusMeters / earthRadius) * Math.sin(angle);
      const dLng = (radiusMeters / (earthRadius * Math.cos(latRad))) * Math.cos(angle);
      const nextLat = latitude + (dLat * 180 / Math.PI);
      const nextLng = longitude + (dLng * 180 / Math.PI);
      points.push([nextLng, nextLat]);
    }
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [points]
          },
          properties: {}
        }
      ]
    };
  }

  function ensureAccuracyLayers(map) {
    if (!map.getSource(ACCURACY_SOURCE_ID)) {
      map.addSource(ACCURACY_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
    }

    if (!map.getLayer(ACCURACY_FILL_LAYER_ID)) {
      map.addLayer({
        id: ACCURACY_FILL_LAYER_ID,
        type: "fill",
        source: ACCURACY_SOURCE_ID,
        paint: {
          "fill-color": "#67f6ff",
          "fill-opacity": 0.14
        }
      });
    }

    if (!map.getLayer(ACCURACY_STROKE_LAYER_ID)) {
      map.addLayer({
        id: ACCURACY_STROKE_LAYER_ID,
        type: "line",
        source: ACCURACY_SOURCE_ID,
        paint: {
          "line-color": "#67f6ff",
          "line-width": 1.2,
          "line-opacity": 0.95
        }
      });
    }
  }

  function updateAccuracyRadius(map, longitude, latitude, accuracyMeters) {
    ensureAccuracyLayers(map);
    const source = map.getSource(ACCURACY_SOURCE_ID);
    if (!source) {
      return;
    }
    const radius = Math.max(Number(accuracyMeters) || 0, 10);
    source.setData(createAccuracyGeoJSON(longitude, latitude, radius));
  }

  function clearAccuracyRadius(map) {
    const source = map.getSource(ACCURACY_SOURCE_ID);
    if (!source) {
      return;
    }
    source.setData({ type: "FeatureCollection", features: [] });
  }

  function getIPLocation() {
    return fetch("https://ipapi.co/json/")
      .then(function parseIpApi(response) {
        if (!response.ok) {
          throw new Error("IP lookup failed.");
        }
        return response.json();
      })
      .then(function normalizeIpApi(data) {
        const lat = Number(data && data.latitude);
        const lng = Number(data && data.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new Error("IP lookup returned invalid coordinates.");
        }
        return {
          latitude: lat,
          longitude: lng,
          city: data && data.city ? String(data.city) : "Unknown city"
        };
      })
      .catch(function fallbackToIpInfo() {
        return fetch("https://ipinfo.io/json")
          .then(function parseIpInfo(response) {
            if (!response.ok) {
              throw new Error("IP fallback failed.");
            }
            return response.json();
          })
          .then(function normalizeIpInfo(data) {
            const locText = data && data.loc ? String(data.loc) : "";
            const parts = locText.split(",");
            const lat = Number(parts[0]);
            const lng = Number(parts[1]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              throw new Error("IP fallback returned invalid coordinates.");
            }
            return {
              latitude: lat,
              longitude: lng,
              city: data && data.city ? String(data.city) : "Unknown city"
            };
          });
      });
  }

  function getGPSLocation(map, markers, state) {
    return new Promise(function requestGPS(resolve, reject) {
      if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== "function") {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function onSuccess(position) {
          const lat = Number(position.coords && position.coords.latitude);
          const lng = Number(position.coords && position.coords.longitude);
          const accuracy = Number(position.coords && position.coords.accuracy);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            reject(new Error("GPS returned invalid coordinates."));
            return;
          }

          map.easeTo({ center: [lng, lat], zoom: 15, duration: 700 });

          if (state.gpsMarker) {
            state.gpsMarker.remove();
          }
          clearAccuracyRadius(map);

          state.gpsMarker = addMarker(map, markers, lat, lng, "You are here");
          if (Number.isFinite(accuracy)) {
            updateAccuracyRadius(map, lng, lat, accuracy);
          }

          resolve({ latitude: lat, longitude: lng, accuracy: accuracy });
        },
        function onError(error) {
          reject(error || new Error("GPS permission denied or unavailable."));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  function initMap() {
    const mapNode = document.getElementById("nebula-map-canvas");
    const gpsButton = document.getElementById("nebula-map-gps");
    const statusNode = document.getElementById("nebula-map-status");

    if (!mapNode) {
      return;
    }

    const markers = [];
    const state = {
      gpsMarker: null,
      ipMarker: null,
      map: null
    };

    function setStatus(text, isError) {
      if (!statusNode) {
        return;
      }
      statusNode.textContent = String(text || "");
      statusNode.classList.toggle("is-error", !!isError);
    }

    ensureMapLibreLoaded()
      .then(function onMapLibreReady() {
        const map = new window.maplibregl.Map({
          container: mapNode,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://{a,b,c}.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
            },
            layers: [
              {
                id: "osm-tiles",
                type: "raster",
                source: "osm"
              }
            ]
          },
          center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]],
          zoom: DEFAULT_ZOOM,
          maxZoom: 19
        });
        state.map = map;

        map.addControl(new window.maplibregl.NavigationControl(), "top-left");

        map.on("load", function onMapLoad() {
          ensureAccuracyLayers(map);
        });

        map.on("click", function onMapClick(event) {
          const lat = event && event.lngLat ? event.lngLat.lat : NaN;
          const lng = event && event.lngLat ? event.lngLat.lng : NaN;
          const marker = addMarker(map, markers, lat, lng, "Custom marker");
          if (marker) {
            marker.togglePopup();
          }
        });

        if (gpsButton) {
          gpsButton.addEventListener("click", function onGpsClick() {
            setStatus("Requesting GPS location...", false);

            getGPSLocation(map, markers, state)
              .then(function onGpsDone(result) {
                setStatus("GPS lock acquired. Accuracy: " + Math.round(result.accuracy || 0) + "m", false);
              })
              .catch(function onGpsFail() {
                setStatus("GPS unavailable. Switching to IP-based location...", false);

                getIPLocation()
                  .then(function onIpDone(location) {
                    map.easeTo({ center: [location.longitude, location.latitude], zoom: 12, duration: 700 });

                    if (state.ipMarker) {
                      state.ipMarker.remove();
                    }

                    state.ipMarker = addMarker(
                      map,
                      markers,
                      location.latitude,
                      location.longitude,
                      "Approximate location" + (location.city ? " - " + location.city : "")
                    );

                    if (state.ipMarker) {
                      state.ipMarker.togglePopup();
                    }

                    setStatus("Using approximate IP location" + (location.city ? " in " + location.city : "") + ".", false);
                  })
                  .catch(function onIpFail() {
                    map.easeTo({ center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]], zoom: DEFAULT_ZOOM, duration: 700 });
                    addMarker(map, markers, DEFAULT_CENTER[0], DEFAULT_CENTER[1], "Default location");
                    setStatus("GPS and IP lookup failed. Showing default location.", true);
                  });
              });
          });
        }

        setStatus("Map ready. Press GPS or click map to add markers.", false);

        setTimeout(function invalidateMap() {
          if (state.map) {
            state.map.resize();
          }
        }, 120);

        window.addEventListener("resize", function onResize() {
          if (state.map) {
            state.map.resize();
          }
        });
      })
      .catch(function onMapError() {
        setStatus("Failed to load map engine.", true);
      });
  }

  modules["/maps"] = {
    render: function renderMapsRoute() {
      return `
        <style>
          .nebula-map-viewport {
            position: fixed;
            left: 88px;
            right: 0;
            top: 0;
            bottom: 0;
            background:
              radial-gradient(circle at 12% 12%, rgba(86, 235, 255, 0.2), transparent 36%),
              radial-gradient(circle at 88% 86%, rgba(13, 116, 255, 0.2), transparent 36%),
              linear-gradient(145deg, #03060d 0%, #060f1d 48%, #03040a 100%);
            overflow: hidden;
          }

          #nebula-map-canvas {
            position: absolute;
            inset: 0;
            z-index: 100;
          }

          .nebula-map-glass {
            position: absolute;
            border: 1px solid rgba(177, 240, 255, 0.26);
            background: rgba(2, 12, 24, 0.52);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
            border-radius: 16px;
            z-index: 500;
          }

          .nebula-map-search {
            top: 18px;
            left: 50%;
            transform: translateX(-50%);
            width: min(560px, calc(100vw - 180px));
            height: 54px;
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 12px;
          }

          .nebula-map-search i {
            color: rgba(173, 231, 255, 0.8);
            font-size: 14px;
          }

          .nebula-map-search input {
            flex: 1;
            border: 0;
            outline: 0;
            background: transparent;
            color: rgba(234, 249, 255, 0.95);
            font: 500 14px/1.2 'Oxanium', 'Montserrat', sans-serif;
            letter-spacing: 0.03em;
          }

          .nebula-map-search input::placeholder {
            color: rgba(186, 211, 224, 0.72);
          }

          #nebula-map-status {
            left: 16px;
            bottom: 20px;
            max-width: min(460px, calc(100vw - 150px));
            padding: 12px 14px;
            color: rgba(220, 249, 255, 0.95);
            font: 500 12px/1.4 'DM Sans', 'Montserrat', sans-serif;
            letter-spacing: 0.02em;
          }

          #nebula-map-status.is-error {
            border-color: rgba(255, 148, 148, 0.5);
            color: rgba(255, 189, 189, 0.98);
          }

          #nebula-map-gps {
            right: 22px;
            bottom: 24px;
            width: 58px;
            height: 58px;
            border-radius: 999px;
            border-width: 1px;
            cursor: pointer;
            display: grid;
            place-items: center;
            color: rgba(209, 244, 255, 0.96);
            font-size: 18px;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }

          #nebula-map-gps:hover {
            transform: translateY(-2px) scale(1.02);
            border-color: rgba(207, 240, 255, 0.55);
            box-shadow: 0 18px 32px rgba(0, 0, 0, 0.38), 0 0 24px rgba(83, 227, 255, 0.24);
          }

          .maplibregl-map {
            width: 100%;
            height: 100%;
            background: #050a12;
          }

          .maplibregl-popup-content {
            background: rgba(10, 17, 28, 0.92);
            color: rgba(226, 246, 255, 0.96);
            border: 1px solid rgba(183, 229, 247, 0.32);
            box-shadow: 0 14px 28px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 10px 12px;
          }

          .maplibregl-popup-tip {
            border-top-color: rgba(10, 17, 28, 0.92) !important;
          }

          .maplibregl-ctrl-group {
            background: rgba(8, 19, 35, 0.9);
            border: 1px solid rgba(160, 223, 255, 0.4);
          }

          .maplibregl-ctrl-group button {
            color: rgba(222, 246, 255, 0.96);
          }

          .maplibregl-ctrl-attrib {
            background: rgba(5, 14, 26, 0.74) !important;
            color: rgba(180, 214, 231, 0.84) !important;
            font: 500 11px/1.2 'DM Sans', sans-serif;
          }

          .maplibregl-ctrl-attrib a {
            color: rgba(192, 242, 255, 0.94) !important;
          }

          @media (max-width: 900px) {
            .nebula-map-viewport {
              left: 0;
            }

            .nebula-map-search {
              top: 12px;
              width: calc(100vw - 28px);
            }

            #nebula-map-status {
              left: 10px;
              right: 10px;
              max-width: none;
              bottom: 16px;
            }

            #nebula-map-gps {
              bottom: 84px;
              right: 14px;
            }
          }
        </style>

        <section class="nebula-map-viewport">
          <div id="nebula-map-canvas"></div>

          <div class="nebula-map-search nebula-map-glass" aria-label="Map search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input type="text" placeholder="Search locations (coming soon)" aria-label="Search locations" />
          </div>

          <div id="nebula-map-status" class="nebula-map-glass" aria-live="polite">Loading map...</div>

          <button id="nebula-map-gps" class="nebula-map-glass" type="button" aria-label="Center on my location" title="Center on my location">
            <i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i>
          </button>
        </section>
      `;
    },
    afterRender: function afterRenderMapsRoute() {
      initMap();
    }
  };
})();
