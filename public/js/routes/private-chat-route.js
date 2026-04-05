(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/private-chat"] = {
    render: function renderPrivateChatRoute() {
      return `
        <style>
          #main-content {
            padding: 0 !important;
            margin: 0 !important;
            height: 100vh !important;
            width: 100vw !important;
            max-width: 100vw !important;
            overflow: hidden;
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
          }
          .glass-chat-container {
            display: flex;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 15, 20, 0.6);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            color: rgba(255, 255, 255, 0.85);
            font-family: 'Geist', 'Segoe UI', Arial, sans-serif;
          }
          .glass-sidebar {
            width: 320px;
            background: rgba(0, 0, 0, 0.4);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            z-index: 10;
          }
          .glass-sidebar-header {
            padding: 24px;
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .new-chat-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 5px 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .new-chat-btn:hover { background: rgba(255,255,255,0.2); }
          .glass-chat-list {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
          }
          .glass-chat-list::-webkit-scrollbar, .glass-messages::-webkit-scrollbar { width: 6px; }
          .glass-chat-list::-webkit-scrollbar-thumb, .glass-messages::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
          .glass-chat-item {
            padding: 15px;
            margin-bottom: 5px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            border: 1px solid transparent;
            font-size: 15px;
            font-weight: 300;
          }
          .glass-chat-item:hover, .glass-chat-item.active {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .glass-main {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            background: radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 50%);
          }
          .glass-main-header {
            padding: 24px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 20px;
            font-weight: 500;
            background: rgba(255, 255, 255, 0.01);
            display: flex;
            justify-content: space-between;
          }
          .back-social-btn {
            color: white;
            text-decoration: none;
            padding: 5px 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            font-size: 14px;
          }
          .glass-messages {
            flex-grow: 1;
            padding: 30px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .glass-message-wrapper { display: flex; gap: 15px; max-width: 80%; }
          .glass-message-wrapper.owned { align-self: flex-end; flex-direction: row-reverse; }
          .glass-message-content {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 18px;
            border-radius: 20px 20px 20px 4px;
            color: rgba(255, 255, 255, 0.9);
            word-break: break-all;
          }
          .glass-message-wrapper.owned .glass-message-content {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px 20px 4px 20px;
          }
          .glass-input-area {
            padding: 20px 30px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .glass-input-wrapper {
            display: flex;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 30px;
            padding: 5px 15px;
          }
          .glass-input {
            flex-grow: 1;
            background: transparent;
            border: none;
            padding: 15px;
            color: white;
            outline: none;
          }
          .glass-send-btn {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 0 20px;
            border-radius: 20px;
            margin: 5px 0;
            cursor: pointer;
          }
          .error-msg { color: #ff5555; text-align: center; }
        </style>
        <div class="glass-chat-container">
          <div class="glass-sidebar">
            <div class="glass-sidebar-header">
              <span>Messages</span>
              <button class="new-chat-btn" id="new-chat-btn"><i class="fa-solid fa-plus"></i></button>
            </div>
            <div class="glass-chat-list" id="chat-list-container"></div>
          </div>
          <div class="glass-main">
            <div class="glass-main-header">
              <span id="chat-header-name">Select a chat</span>
              <a href="/social" class="back-social-btn nav-link"><i class="fa-solid fa-arrow-left"></i> Back</a>
            </div>
            <div class="glass-messages" id="chat-messages-container"></div>
            <div class="glass-input-area">
              <div class="glass-input-wrapper">
                <input type="text" class="glass-input" placeholder="Type a message..." id="chat-input-field" disabled/>
                <button class="glass-send-btn" id="chat-send-btn" disabled><i class="fa-solid fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    afterRender: function() {
      const db = firebase.firestore();
      const auth = firebase.auth();
      const listContainer = document.getElementById("chat-list-container");
      const msgsContainer = document.getElementById("chat-messages-container");
      const inputField = document.getElementById("chat-input-field");
      const sendBtn = document.getElementById("chat-send-btn");
      const headerName = document.getElementById("chat-header-name");
      const newChatBtn = document.getElementById("new-chat-btn");
      let currentChatId = null;
      let unsubscribeMsg = null;
      let sharedKeyStr = "U3RhcmxpZ2h0U2VjcmV0S2V5MTIzNDU2Nzg5MDEyMzQ="; 
      async function encryptData(text) {
        const enc = new TextEncoder();
        const keyData = Uint8Array.from(atob(sharedKeyStr), c => c.charCodeAt(0));
        const key = await crypto.subtle.importKey("raw", keyData, {name: "AES-GCM"}, false, ["encrypt"]);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ciphertext = await crypto.subtle.encrypt({name: "AES-GCM", iv}, key, enc.encode(text));
        const ivArr = Array.from(iv);
        const cipherArr = Array.from(new Uint8Array(ciphertext));
        return btoa(JSON.stringify({iv: ivArr, d: cipherArr}));
      }
      async function decryptData(encStr) {
        try {
          const {iv, d} = JSON.parse(atob(encStr));
          const keyData = Uint8Array.from(atob(sharedKeyStr), c => c.charCodeAt(0));
          const key = await crypto.subtle.importKey("raw", keyData, {name: "AES-GCM"}, false, ["decrypt"]);
          const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv: new Uint8Array(iv)}, key, new Uint8Array(d));
          return new TextDecoder().decode(decrypted);
        } catch { return "Decryption error"; }
      }
      function loadChats(user) {
        listContainer.innerHTML = '';
        db.collection("chats").where("members", "array-contains", user.uid).onSnapshot(snap => {
          listContainer.innerHTML = '';
          snap.forEach(doc => {
            const data = doc.data();
            const otherUid = data.members.find(m => m !== user.uid);
            db.collection("users").doc(otherUid).get().then(uDoc => {
              const uName = uDoc.exists ? uDoc.data().username : "Unknown User";
              const div = document.createElement("div");
              div.className = "glass-chat-item";
              div.innerHTML = `<i class="fa-solid fa-user"></i> ${uName}`;
              div.onclick = () => openChat(doc.id, uName);
              listContainer.appendChild(div);
            });
          });
        });
      }
      function openChat(chatId, chatName) {
        currentChatId = chatId;
        headerName.textContent = chatName;
        inputField.disabled = false;
        sendBtn.disabled = false;
        if(unsubscribeMsg) unsubscribeMsg();
        unsubscribeMsg = db.collection("chats").doc(chatId).collection("messages").orderBy("t").onSnapshot(async snap => {
          msgsContainer.innerHTML = '';
          for (let doc of snap.docs) {
            const data = doc.data();
            const text = await decryptData(data.m);
            const div = document.createElement('div');
            div.className = `glass-message-wrapper ${data.s === auth.currentUser.uid ? 'owned' : ''}`;
            div.innerHTML = `<div class="glass-message-content">${text}</div>`;
            msgsContainer.appendChild(div);
          }
          msgsContainer.scrollTop = msgsContainer.scrollHeight;
        });
      }
      newChatBtn.onclick = async () => {
        const username = prompt("Enter the exact username of the person to chat with:");
        if(!username) return;
        const snap = await db.collection("users").where("username", "==", username).get();
        if(snap.empty) { alert("User not found."); return; }
        const otherUid = snap.docs[0].id;
        const exists = await db.collection("chats").where("members", "==", [auth.currentUser.uid, otherUid]).get();
        if(!exists.empty) return;
        await db.collection("chats").add({ members: [auth.currentUser.uid, otherUid], lastUpdate: firebase.firestore.FieldValue.serverTimestamp() });
      };
      async function sendMsg() {
        const text = inputField.value.trim();
        if(!text || !currentChatId) return;
        inputField.value = '';
        const encrypted = await encryptData(text);
        await db.collection("chats").doc(currentChatId).collection("messages").add({
          s: auth.currentUser.uid,
          m: encrypted,
          t: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      sendBtn.onclick = sendMsg;
      inputField.onkeypress = e => { if(e.key === "Enter") sendMsg(); };
      auth.onAuthStateChanged(u => {
        if(u) loadChats(u);
        else listContainer.innerHTML = '<div class="error-msg">Please log in first.</div>';
      });
    }
  };
})();
