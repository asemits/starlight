(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/private-chat"] = {
    render: function renderPrivateChatRoute() {
      return `
        <style>
          #main-content {
            padding: 0 !important;
            height: calc(100vh - 0px) !important;
            overflow: hidden;
          }
          .chat-container {
            display: flex;
            height: 100vh;
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 100;
            background-color: #36393f;
            color: #dcddde;
          }
          .chat-sidebar {
            width: 240px;
            background-color: #2f3136;
            display: flex;
            flex-direction: column;
            overflow-y: hidden;
          }
          .chat-list {
            flex-grow: 1;
            overflow-y: auto;
          }
          .chat-list::-webkit-scrollbar {
            width: 8px;
          }
          .chat-list::-webkit-scrollbar-thumb {
            background: #202225;
            border-radius: 4px;
          }
          .chat-item {
            padding: 10px;
            margin: 5px 8px;
            border-radius: 4px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .chat-item:hover {
            background-color: #393c43;
          }
          .chat-main {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            background-color: #36393f;
          }
          .chat-header {
            padding: 15px;
            border-bottom: 1px solid #202225;
            font-weight: bold;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
          }
          .chat-header .close-btn {
            margin-left: auto;
            cursor: pointer;
            font-size: 1.5rem;
            color: #b9bbbe;
          }
          .chat-messages {
            flex-grow: 1;
            overflow-y: auto;
            padding: 20px;
          }
          .chat-input-area {
            padding: 20px;
          }
          .chat-input {
            width: 100%;
            background-color: #40444b;
            border: none;
            padding: 15px;
            border-radius: 8px;
            color: #dcddde;
            outline: none;
          }
        </style>
        <div class="chat-container">
          <div class="chat-sidebar">
            <div style="padding: 15px; border-bottom: 1px solid #202225; font-weight: bold">Direct Messages</div>
            <div class="chat-list" id="chat-list-container">
              <div class="chat-item">Mock User 1</div>
              <div class="chat-item">Mock Group (User 2, User 3...)</div>
            </div>
          </div>
          <div class="chat-main">
            <div class="chat-header">
              <span id="chat-header-name">Select a chat</span>
              <a href="#/social" class="close-btn">&times;</a>
            </div>
            <div class="chat-messages" id="chat-messages-container">
            </div>
            <div class="chat-input-area">
              <input type="text" class="chat-input" placeholder="Message..." id="chat-input-field" disabled/>
            </div>
          </div>
        </div>
      `;
    },
    afterRender: function afterRenderPrivateChatRoute() {
      const chatRoot = document.getElementById("private-chat-root");
      if (window.StarlightPrivateChat && chatRoot) {
        window.StarlightPrivateChat.mount("#private-chat-root");
      }
    }
  };
})();
