(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  function renderChatRoute() {
    return '<div id="private-chat-root"><div class="nebula-chat-main-empty">Loading encrypted chat...</div></div>';
  }

  function mountChatRoute() {
    if (window.NebulaPrivateChat && typeof window.NebulaPrivateChat.mount === "function") {
      window.NebulaPrivateChat.mount("#private-chat-root");
      return;
    }
    const root = document.querySelector("#private-chat-root");
    if (root) {
      root.innerHTML = '<div class="nebula-chat-main-empty">Chat module failed to load. Refresh and try again.</div>';
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