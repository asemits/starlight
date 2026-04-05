(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/private-chat"] = {
    render: function renderPrivateChatRoute() {
      return `
        <style>
          /* Full screen animated reveal */
          @keyframes chatReveal {
            0% { opacity: 0; transform: scale(0.98); filter: blur(10px); }
            100% { opacity: 1; transform: scale(1); filter: blur(0px); }
          }

          /* Override main container layout so the chat can be properly large but within the site theme */
          #main-content {
            padding: 80px 20px 20px 100px !important; /* Assuming left sidebar is ~80px wide and top navbar space */
            height: 100vh !important;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }

          /* Chat container with Glassmorphism */
          .glass-chat-container {
            display: flex;
            flex-grow: 1;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 20, 0.4);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: chatReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            color: rgba(255, 255, 255, 0.85);
            font-family: 'Geist', 'Segoe UI', Arial, sans-serif;
            position: relative;
          }

          /* Left Sidebar for DMs */
          .glass-sidebar {
            width: 280px;
            background: rgba(0, 0, 0, 0.2);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 10;
          }

          .glass-sidebar-header {
            padding: 20px;
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.02);
          }

          .glass-chat-list {
            flex-grow: 1;
            overflow-y: auto;
            padding: 15px 10px;
          }

          /* Custom Scrollbar */
          .glass-chat-list::-webkit-scrollbar, .glass-messages::-webkit-scrollbar {
            width: 6px;
          }
          .glass-chat-list::-webkit-scrollbar-track, .glass-messages::-webkit-scrollbar-track {
            background: transparent;
          }
          .glass-chat-list::-webkit-scrollbar-thumb, .glass-messages::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .glass-chat-list::-webkit-scrollbar-thumb:hover, .glass-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .glass-chat-item {
            padding: 12px 15px;
            margin-bottom: 6px;
            border-radius: 12px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: background 0.3s ease, border 0.3s ease, transform 0.2s ease;
            border: 1px solid transparent;
            font-size: 14px;
            font-weight: 300;
          }

          .glass-chat-item:hover {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transform: translateX(4px);
          }

          .glass-chat-item.active {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          
          .glass-chat-item-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.0));
            border: 1px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: rgba(255,255,255,0.8);
            flex-shrink: 0;
          }

          /* Main Chat Area */
          .glass-main {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            position: relative;
            background: radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 50%);
          }

          .glass-main-header {
            padding: 20px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(10px);
            z-index: 5;
          }

          .glass-main-header-info {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 18px;
            font-weight: 500;
            letter-spacing: 0.05em;
          }

          .glass-close-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .glass-close-btn:hover {
            background: rgba(255, 100, 100, 0.2);
            border-color: rgba(255, 100, 100, 0.5);
            color: white;
            transform: scale(1.1) rotate(90deg);
          }

          .glass-messages {
            flex-grow: 1;
            padding: 30px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          /* Placeholder message styling for the demo */
          .glass-message-wrapper {
            display: flex;
            gap: 15px;
            max-width: 80%;
          }
          
          .glass-message-wrapper.owned {
            align-self: flex-end;
            flex-direction: row-reverse;
          }

          .glass-message-content {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 18px;
            border-radius: 20px 20px 20px 4px;
            font-size: 14px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.9);
          }

          .glass-message-wrapper.owned .glass-message-content {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.2);
            border-radius: 20px 20px 4px 20px;
          }

          .glass-input-area {
            padding: 20px 30px;
            background: rgba(0, 0, 0, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            position: relative;
          }

          .glass-input-wrapper {
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 30px;
            padding: 5px 15px;
            transition: border 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
          }

          .glass-input-wrapper:focus-within {
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
            background: rgba(0, 0, 0, 0.3);
          }

          .glass-input {
            flex-grow: 1;
            background: transparent;
            border: none;
            padding: 12px 10px;
            color: white;
            font-family: inherit;
            font-size: 15px;
            outline: none;
          }

          .glass-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
          }

          .glass-send-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .glass-send-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
          }
          
          .glass-send-btn i {
             transform: translateX(-1px);
          }

        </style>

        <div class="glass-chat-container">
          <!-- Sidebar -->
          <div class="glass-sidebar">
            <div class="glass-sidebar-header">
              <i class="fa-solid fa-messages"></i> Messages
            </div>
            <div class="glass-chat-list" id="chat-list-container">
              <div class="glass-chat-item active">
                 <div class="glass-chat-item-avatar"><i class="fa-solid fa-user"></i></div>
                 Mock User 1
              </div>
              <div class="glass-chat-item">
                 <div class="glass-chat-item-avatar"><i class="fa-solid fa-users"></i></div>
                 Mock Group (User 2, User 3)
              </div>
              <div class="glass-chat-item">
                 <div class="glass-chat-item-avatar"><i class="fa-solid fa-user"></i></div>
                 Another Friend
              </div>
            </div>
          </div>

          <!-- Main Chat -->
          <div class="glass-main">
            <!-- Header -->
            <div class="glass-main-header">
              <div class="glass-main-header-info" id="chat-header-name">
                <i class="fa-solid fa-at" style="color: rgba(255,255,255,0.4);"></i> Mock User 1
              </div>
              <a href="/social" class="glass-close-btn nav-link" title="Close Chat">
                <i class="fa-solid fa-xmark"></i>
              </a>
            </div>

            <!-- Messages List -->
            <div class="glass-messages" id="chat-messages-container">
              <div class="glass-message-wrapper">
                 <div class="glass-chat-item-avatar"><i class="fa-solid fa-user"></i></div>
                 <div class="glass-message-content">Hey there! Welcome to the new private chat.</div>
              </div>
              <div class="glass-message-wrapper owned">
                 <div class="glass-message-content">This looks so much better! Glassmorphism fits perfectly.</div>
              </div>
            </div>

            <!-- Input Box -->
            <div class="glass-input-area">
              <div class="glass-input-wrapper">
                <i class="fa-solid fa-image" style="color: rgba(255,255,255,0.4); padding: 0 5px; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='rgba(255,255,255,0.4)'"></i>
                <input type="text" class="glass-input" placeholder="Message @Mock User 1..." id="chat-input-field" disabled/>
                <button class="glass-send-btn" disabled>
                  <i class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    afterRender: function afterRenderPrivateChatRoute() {
      // Connect functionality logic if loaded
      const chatRoot = document.getElementById("private-chat-root");
      if (window.StarlightPrivateChat && chatRoot) {
        window.StarlightPrivateChat.mount("#private-chat-root");
      }
    }
  };
})();
