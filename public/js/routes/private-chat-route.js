(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/private-chat"] = {
    render: function renderPrivateChatRoute() {
      return '<div id="private-chat-root"></div>';
    },
    afterRender: function afterRenderPrivateChatRoute() {
      if (window.StarlightPrivateChat) {
        window.StarlightPrivateChat.mount("#private-chat-root");
      }
    }
  };
})();
