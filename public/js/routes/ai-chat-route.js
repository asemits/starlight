(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  function mountAiChat() {
    if (window.NebulaAIChat && typeof window.NebulaAIChat.mount === "function") {
      window.NebulaAIChat.mount("#ai-chat-root");
      return;
    }
    const root = document.querySelector("#ai-chat-root");
    if (root) {
      root.innerHTML = '<div class="nebula-ai-empty-state"><h2>AI chat failed to load.</h2><p>Refresh and try again.</p></div>';
    }
  }

  modules["/ai-chat"] = {
    render: function renderAiChatRoute() {
      return '<div id="ai-chat-root"></div>';
    },
    afterRender: function afterRenderAiChatRoute() {
      mountAiChat();
    }
  };

  modules["/ai"] = {
    render: function renderAiAliasRoute() {
      return '<div id="ai-chat-root"></div>';
    },
    afterRender: function afterRenderAiAliasRoute() {
      if (window.location.pathname === "/ai") {
        window.history.replaceState({}, "", "/ai-chat");
      }
      mountAiChat();
    }
  };
})();