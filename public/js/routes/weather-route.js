(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  modules["/weather"] = {
    render: function renderWeatherRoute() {
      return '<div id="weather-root"></div>';
    },
    afterRender: function afterRenderWeatherRoute() {
      if (window.NebulaWeather) {
        window.NebulaWeather.mount("#weather-root");
      }
    }
  };
})();