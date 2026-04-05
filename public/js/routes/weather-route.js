(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/weather"] = {
    render: function renderWeatherRoute() {
      return '<div id="weather-root"></div>';
    },
    afterRender: function afterRenderWeatherRoute() {
      if (window.StarlightWeather) {
        window.StarlightWeather.mount("#weather-root");
      }
    }
  };
})();