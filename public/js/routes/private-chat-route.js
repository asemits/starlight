(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};

  function renderChatRoute() {
    return '<div id="private-chat-root"><div class="starlight-chat-main-empty">Loading encrypted chat...</div></div>';
  }

  function mountChatRoute() {
    if (window.StarlightPrivateChat && typeof window.StarlightPrivateChat.mount === "function") {
      window.StarlightPrivateChat.mount("#private-chat-root");
      return;
    }
    const root = document.querySelector("#private-chat-root");
    if (root) {
      root.innerHTML = '<div class="starlight-chat-main-empty">Chat module failed to load. Refresh and try again.</div>';
    }
  }

  modules["/chat"] = {
    render: function renderPrivateChatRoute() {
      return renderChatRoute();
    },
    afterRender: function afterRenderPrivateChatRoute() {
      mountChatRoute();
    }
  };

  modules["/private-chat"] = {
    render: function renderLegacyPrivateChatRoute() {
      return renderChatRoute();
    },
    afterRender: function afterRenderLegacyPrivateChatRoute() {
      if (window.location.pathname === "/private-chat") {
        window.history.replaceState({}, "", "/chat");
      }
      mountChatRoute();
    }
  };
})();