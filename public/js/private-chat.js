(function () {
  const PROFILE_COLLECTION = "userPublicProfiles";
  const CHAT_COLLECTION = "privateChats";
  const USER_COLLECTION = "users";
  const KEY_STORAGE_PREFIX = "starlight-chat-keypair-v1-";

  const state = {
    root: null,
    user: null,
    profile: null,
    keyPair: null,
    activeChatId: "",
    chatsById: new Map(),
    chatKeyCache: new Map(),
    chatListUnsub: null,
    messageUnsub: null
  };

  function db() {
    return window.starlightDb || null;
  }

  function auth() {
    return window.starlightAuth || null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function toMillis(value) {
    if (!value) {
      return 0;
    }
    if (typeof value.toMillis === "function") {
      return value.toMillis();
    }
    if (typeof value.seconds === "number") {
      return value.seconds * 1000;
    }
    return 0;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(String(value || ""));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  }

  function randomHex(bytesLength) {
    const bytes = new Uint8Array(bytesLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  function authUser() {
    const instance = auth();
    return instance ? instance.currentUser : null;
  }

  async function waitForAuthUser() {
    const direct = authUser();
    if (direct) {
      return direct;
    }
    if (window.starlightAuthReady) {
      const ready = await window.starlightAuthReady;
      if (ready) {
        return ready;
      }
    }
    return null;
  }

  function keyStorageKey(uid) {
    return KEY_STORAGE_PREFIX + String(uid || "");
  }

  async function generateKeyPair() {
    return crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async function exportKeyPair(keyPair) {
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privatePkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
    return {
      publicJwk,
      privatePkcs8: bytesToBase64(privatePkcs8)
    };
  }

  async function importPrivateKey(pkcs8Base64) {
    const bytes = base64ToBytes(pkcs8Base64);
    return crypto.subtle.importKey(
      "pkcs8",
      bytes,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["decrypt"]
    );
  }

  async function importPublicKey(jwk) {
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["encrypt"]
    );
  }

  async function loadOrCreateKeyPair(uid) {
    const storageKey = keyStorageKey(uid);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.privatePkcs8 && parsed.publicJwk) {
          const privateKey = await importPrivateKey(parsed.privatePkcs8);
          const publicKey = await importPublicKey(parsed.publicJwk);
          return {
            publicKey,
            privateKey,
            publicJwk: parsed.publicJwk
          };
        }
      } catch (_error) {
      }
    }

    const generated = await generateKeyPair();
    const exported = await exportKeyPair(generated);
    localStorage.setItem(storageKey, JSON.stringify(exported));
    return {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      publicJwk: exported.publicJwk
    };
  }

  async function loadOwnUsername(user) {
    const firestore = db();
    if (!firestore || !user) {
      return "";
    }
    try {
      const snap = await firestore.collection(USER_COLLECTION).doc(user.uid).get();
      if (snap.exists) {
        const data = snap.data() || {};
        const username = String(data.username || "").trim();
        if (username) {
          return username;
        }
      }
    } catch (_error) {
    }
    if (user.displayName) {
      return String(user.displayName).trim();
    }
    if (user.email) {
      const local = String(user.email).split("@")[0] || "";
      return local.trim();
    }
    return "User";
  }

  async function ensureOwnProfile(user, publicJwk) {
    const firestore = db();
    if (!firestore || !user) {
      return null;
    }
    const username = await loadOwnUsername(user);
    const usernameLower = username.toLowerCase();
    const payload = {
      uid: user.uid,
      username,
      usernameLower,
      chatPublicKeyJwk: publicJwk,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await firestore.collection(PROFILE_COLLECTION).doc(user.uid).set(payload, { merge: true });
    return {
      uid: user.uid,
      username,
      usernameLower,
      chatPublicKeyJwk: publicJwk
    };
  }

  async function resolveProfileByUsername(input) {
    const firestore = db();
    if (!firestore) {
      return null;
    }
    const usernameLower = String(input || "").trim().toLowerCase();
    if (!usernameLower) {
      return null;
    }
    const snap = await firestore
      .collection(PROFILE_COLLECTION)
      .where("usernameLower", "==", usernameLower)
      .limit(1)
      .get();
    if (snap.empty) {
      return null;
    }
    const doc = snap.docs[0];
    const data = doc.data() || {};
    return {
      uid: doc.id,
      username: String(data.username || "").trim() || "Unknown",
      usernameLower: String(data.usernameLower || "").trim(),
      chatPublicKeyJwk: data.chatPublicKeyJwk || null
    };
  }

  async function resolveProfilesByUsernames(usernames) {
    const resolved = [];
    for (const rawName of usernames) {
      const found = await resolveProfileByUsername(rawName);
      if (found) {
        resolved.push(found);
      }
    }
    const byUid = new Map();
    resolved.forEach((profile) => {
      byUid.set(profile.uid, profile);
    });
    return Array.from(byUid.values());
  }

  function formatChatTitle(chatData) {
    const participants = Array.isArray(chatData.participants) ? chatData.participants : [];
    const usernamesMap = chatData.participantUsernames && typeof chatData.participantUsernames === "object"
      ? chatData.participantUsernames
      : {};
    const me = state.user ? state.user.uid : "";
    const others = participants.filter((uid) => uid !== me);
    if (chatData.type === "dm") {
      const otherUid = others[0] || "";
      return String(usernamesMap[otherUid] || "Unknown user");
    }
    const names = others.map((uid) => String(usernamesMap[uid] || "Unknown")).filter(Boolean);
    if (!names.length) {
      return "Group chat";
    }
    return names.join(", ");
  }

  function truncateMiddle(text, maxLength) {
    const value = String(text || "");
    if (value.length <= maxLength) {
      return value;
    }
    if (maxLength <= 3) {
      return value.slice(0, maxLength);
    }
    return value.slice(0, maxLength - 3) + "...";
  }

  async function generateChatKey() {
    return crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async function wrapChatKey(chatKey, publicKeyJwk) {
    const publicKey = await importPublicKey(publicKeyJwk);
    const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", chatKey));
    const wrapped = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawKey);
    return bytesToBase64(new Uint8Array(wrapped));
  }

  async function unwrapChatKey(wrappedKeyBase64) {
    const privateKey = state.keyPair ? state.keyPair.privateKey : null;
    if (!privateKey) {
      throw new Error("missing-private-key");
    }
    const wrapped = base64ToBytes(wrappedKeyBase64);
    const raw = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, wrapped);
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  }

  async function encryptMessage(chatKey, messageText) {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const encoded = new TextEncoder().encode(String(messageText || ""));
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, chatKey, encoded);
    return {
      ciphertext: bytesToBase64(new Uint8Array(cipher)),
      iv: bytesToBase64(iv)
    };
  }

  async function decryptMessage(chatKey, ciphertextBase64, ivBase64) {
    const ciphertext = base64ToBytes(ciphertextBase64);
    const iv = base64ToBytes(ivBase64);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, chatKey, ciphertext);
    return new TextDecoder().decode(plain);
  }

  function setStatus(text, ok) {
    if (!state.root) {
      return;
    }
    const node = state.root.querySelector("[data-private-chat-status]");
    if (!node) {
      return;
    }
    node.textContent = String(text || "");
    node.classList.toggle("ok", Boolean(ok));
    node.classList.toggle("error", !ok);
  }

  function sortChats(chats) {
    return chats.slice().sort((a, b) => {
      const aTime = toMillis(a.lastMessageAt) || toMillis(a.createdAt);
      const bTime = toMillis(b.lastMessageAt) || toMillis(b.createdAt);
      return bTime - aTime;
    });
  }

  function renderShell() {
    if (!state.root) {
      return;
    }
    state.root.innerHTML = `
      <section class="starlight-private-chat-page">
        <header class="starlight-private-chat-header">
          <div>
            <h1>Private Chat</h1>
            <p>End-to-end encrypted DMs and group chats.</p>
          </div>
          <a href="/social" class="starlight-chat-back nav-link">Back to Social</a>
        </header>
        <div class="starlight-private-chat-shell">
          <main class="starlight-chat-main" data-chat-main>
            <div class="starlight-chat-main-empty">Select a DM or GC from the list on the right.</div>
          </main>
          <aside class="starlight-chat-sidebar">
            <div class="starlight-chat-create-block">
              <label for="starlight-new-dm-input">New DM (username)</label>
              <div class="starlight-chat-inline-form">
                <input id="starlight-new-dm-input" type="text" placeholder="username" maxlength="40" />
                <button type="button" data-chat-create-dm>Start</button>
              </div>
            </div>
            <div class="starlight-chat-create-block">
              <label for="starlight-new-gc-input">New GC (comma-separated usernames)</label>
              <div class="starlight-chat-inline-form">
                <input id="starlight-new-gc-input" type="text" placeholder="alice, bob" maxlength="200" />
                <button type="button" data-chat-create-gc>Create</button>
              </div>
            </div>
            <p class="starlight-chat-status" data-private-chat-status></p>
            <div class="starlight-chat-list-wrap">
              <h2>Your chats</h2>
              <ul class="starlight-chat-list" data-chat-list></ul>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderChatList() {
    if (!state.root) {
      return;
    }
    const list = state.root.querySelector("[data-chat-list]");
    if (!list) {
      return;
    }

    const chats = sortChats(Array.from(state.chatsById.values()));
    if (!chats.length) {
      list.innerHTML = '<li class="starlight-chat-list-empty">No chats yet.</li>';
      return;
    }

    list.innerHTML = chats.map((chat) => {
      const title = formatChatTitle(chat);
      const compact = truncateMiddle(title, 50);
      const active = chat.id === state.activeChatId;
      const typeLabel = chat.type === "gc" ? "GC" : "DM";
      return `
        <li>
          <button type="button" class="starlight-chat-list-item ${active ? "is-active" : ""}" data-chat-id="${escapeHtml(chat.id)}">
            <span class="starlight-chat-list-item-type">${typeLabel}</span>
            <span class="starlight-chat-list-item-title" title="${escapeHtml(title)}">${escapeHtml(compact)}</span>
          </button>
        </li>
      `;
    }).join("");
  }

  function renderActiveChatHeader(chat) {
    const title = formatChatTitle(chat);
    return `
      <header class="starlight-chat-conversation-head">
        <h2 title="${escapeHtml(title)}">${escapeHtml(truncateMiddle(title, 90))}</h2>
        <p>${chat.type === "gc" ? "Group chat" : "Direct message"}</p>
      </header>
    `;
  }

  function renderMessages(chat, messages) {
    if (!state.root) {
      return;
    }
    const main = state.root.querySelector("[data-chat-main]");
    if (!main) {
      return;
    }

    const myUid = state.user ? state.user.uid : "";
    const messagesHtml = messages.map((message) => {
      const mine = String(message.senderId || "") === myUid;
      const sender = String(message.senderUsername || "Unknown");
      const when = message.createdAtMillis ? new Date(message.createdAtMillis).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      return `
        <article class="starlight-chat-bubble ${mine ? "mine" : ""}">
          <div class="starlight-chat-bubble-meta">
            <strong>${escapeHtml(sender)}</strong>
            <span>${escapeHtml(when)}</span>
          </div>
          <p>${escapeHtml(String(message.text || ""))}</p>
        </article>
      `;
    }).join("");

    main.innerHTML = `
      <section class="starlight-chat-conversation" data-active-chat-id="${escapeHtml(chat.id)}">
        ${renderActiveChatHeader(chat)}
        <div class="starlight-chat-messages" data-chat-messages>
          ${messagesHtml || '<div class="starlight-chat-main-empty">No messages yet.</div>'}
        </div>
        <form class="starlight-chat-compose" data-chat-compose>
          <input type="text" data-chat-input placeholder="Send an encrypted message" maxlength="1500" autocomplete="off" required />
          <button type="submit">Send</button>
        </form>
      </section>
    `;

    const feed = main.querySelector("[data-chat-messages]");
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }

  async function getChatKey(chatId) {
    if (state.chatKeyCache.has(chatId)) {
      return state.chatKeyCache.get(chatId);
    }
    const firestore = db();
    const user = state.user;
    if (!firestore || !user) {
      throw new Error("chat-key-unavailable");
    }
    const memberSnap = await firestore
      .collection(CHAT_COLLECTION)
      .doc(chatId)
      .collection("members")
      .doc(user.uid)
      .get();
    if (!memberSnap.exists) {
      throw new Error("missing-member-key");
    }
    const data = memberSnap.data() || {};
    const wrappedKey = String(data.wrappedKey || "");
    if (!wrappedKey) {
      throw new Error("missing-wrapped-key");
    }
    const chatKey = await unwrapChatKey(wrappedKey);
    state.chatKeyCache.set(chatId, chatKey);
    return chatKey;
  }

  function stopMessageListener() {
    if (typeof state.messageUnsub === "function") {
      state.messageUnsub();
    }
    state.messageUnsub = null;
  }

  async function subscribeToMessages(chatId) {
    const firestore = db();
    const chat = state.chatsById.get(chatId);
    if (!firestore || !chat) {
      return;
    }

    stopMessageListener();
    renderMessages(chat, []);

    let chatKey = null;
    try {
      chatKey = await getChatKey(chatId);
    } catch (_error) {
      setStatus("Could not load encryption key for this chat.", false);
      return;
    }

    state.messageUnsub = firestore
      .collection(CHAT_COLLECTION)
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limitToLast(200)
      .onSnapshot(async (snap) => {
        const items = await Promise.all(snap.docs.map(async (doc) => {
          const data = doc.data() || {};
          let text = "[Unable to decrypt]";
          try {
            text = await decryptMessage(chatKey, data.ciphertext, data.iv);
          } catch (_error) {
          }
          return {
            id: doc.id,
            senderId: String(data.senderId || ""),
            senderUsername: String(data.senderUsername || "Unknown"),
            text,
            createdAtMillis: toMillis(data.createdAt)
          };
        }));
        renderMessages(chat, items);
      }, () => {
        setStatus("Could not load messages.", false);
      });
  }

  async function setActiveChat(chatId) {
    if (!chatId || !state.chatsById.has(chatId)) {
      return;
    }
    state.activeChatId = chatId;
    renderChatList();
    await subscribeToMessages(chatId);
  }

  async function sendMessage(text) {
    const messageText = String(text || "").trim();
    if (!messageText) {
      return;
    }
    const chatId = state.activeChatId;
    const chat = state.chatsById.get(chatId);
    const firestore = db();
    if (!chatId || !chat || !firestore || !state.user || !state.profile) {
      return;
    }

    try {
      const chatKey = await getChatKey(chatId);
      const encrypted = await encryptMessage(chatKey, messageText);
      await firestore
        .collection(CHAT_COLLECTION)
        .doc(chatId)
        .collection("messages")
        .add({
          senderId: state.user.uid,
          senderUsername: state.profile.username,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      await firestore.collection(CHAT_COLLECTION).doc(chatId).set({
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      setStatus("Encrypted message sent.", true);
    } catch (_error) {
      setStatus("Could not send encrypted message.", false);
    }
  }

  async function findExistingDm(otherUid) {
    const firestore = db();
    const user = state.user;
    if (!firestore || !user || !otherUid) {
      return "";
    }
    const snap = await firestore
      .collection(CHAT_COLLECTION)
      .where("participants", "array-contains", user.uid)
      .limit(40)
      .get();
    const found = snap.docs.find((doc) => {
      const data = doc.data() || {};
      const participants = Array.isArray(data.participants) ? data.participants : [];
      return participants.length === 2 && participants.includes(otherUid);
    });
    return found ? found.id : "";
  }

  async function createChatRecord(type, participantProfiles) {
    const firestore = db();
    const user = state.user;
    if (!firestore || !user || !Array.isArray(participantProfiles) || !participantProfiles.length) {
      throw new Error("invalid-chat-input");
    }

    const participants = participantProfiles.map((profile) => profile.uid);
    const usernamesMap = {};
    participantProfiles.forEach((profile) => {
      usernamesMap[profile.uid] = profile.username;
    });

    const chatId = randomHex(16);
    const chatKey = await generateChatKey();

    const wrappedKeyByUid = {};
    for (const profile of participantProfiles) {
      if (!profile.chatPublicKeyJwk) {
        throw new Error("missing-participant-key");
      }
      wrappedKeyByUid[profile.uid] = await wrapChatKey(chatKey, profile.chatPublicKeyJwk);
    }

    const chatRef = firestore.collection(CHAT_COLLECTION).doc(chatId);
    const batch = firestore.batch();
    batch.set(chatRef, {
      type,
      participants,
      participantUsernames: usernamesMap,
      createdBy: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    participants.forEach((uid) => {
      batch.set(chatRef.collection("members").doc(uid), {
        uid,
        username: usernamesMap[uid] || "Unknown",
        wrappedKey: wrappedKeyByUid[uid],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    state.chatsById.set(chatId, {
      id: chatId,
      type,
      participants,
      participantUsernames: usernamesMap,
      createdAt: null,
      lastMessageAt: null
    });
    renderChatList();
    state.chatKeyCache.set(chatId, chatKey);
    return chatId;
  }

  async function createDmFromInput() {
    if (!state.root || !state.profile) {
      return;
    }
    const input = state.root.querySelector("#starlight-new-dm-input");
    const username = String(input ? input.value : "").trim();
    if (!username) {
      setStatus("Enter a username for the DM.", false);
      return;
    }

    try {
      const other = await resolveProfileByUsername(username);
      if (!other) {
        setStatus("User not found.", false);
        return;
      }
      if (other.uid === state.profile.uid) {
        setStatus("You cannot DM yourself.", false);
        return;
      }
      const existing = await findExistingDm(other.uid);
      if (existing) {
        setStatus("Opened existing DM.", true);
        await setActiveChat(existing);
        return;
      }
      const chatId = await createChatRecord("dm", [state.profile, other]);
      setStatus("Encrypted DM created.", true);
      if (input) {
        input.value = "";
      }
      await setActiveChat(chatId);
    } catch (_error) {
      setStatus("Could not create DM.", false);
    }
  }

  async function createGcFromInput() {
    if (!state.root || !state.profile) {
      return;
    }
    const input = state.root.querySelector("#starlight-new-gc-input");
    const value = String(input ? input.value : "").trim();
    if (!value) {
      setStatus("Enter usernames separated by commas.", false);
      return;
    }

    const usernames = value.split(",").map((part) => part.trim()).filter(Boolean);
    if (!usernames.length) {
      setStatus("Enter at least one username.", false);
      return;
    }

    try {
      const others = await resolveProfilesByUsernames(usernames);
      const participants = [state.profile, ...others.filter((profile) => profile.uid !== state.profile.uid)];
      const byUid = new Map();
      participants.forEach((profile) => {
        byUid.set(profile.uid, profile);
      });
      const finalParticipants = Array.from(byUid.values());
      if (finalParticipants.length < 3) {
        setStatus("A GC needs you plus at least two other users.", false);
        return;
      }
      const chatId = await createChatRecord("gc", finalParticipants);
      setStatus("Encrypted GC created.", true);
      if (input) {
        input.value = "";
      }
      await setActiveChat(chatId);
    } catch (_error) {
      setStatus("Could not create GC.", false);
    }
  }

  function subscribeToChatList() {
    const firestore = db();
    const user = state.user;
    if (!firestore || !user) {
      return;
    }

    if (typeof state.chatListUnsub === "function") {
      state.chatListUnsub();
    }

    state.chatListUnsub = firestore
      .collection(CHAT_COLLECTION)
      .where("participants", "array-contains", user.uid)
      .onSnapshot(async (snap) => {
        const next = new Map();
        snap.docs.forEach((doc) => {
          const data = doc.data() || {};
          next.set(doc.id, {
            id: doc.id,
            type: String(data.type || "dm"),
            participants: Array.isArray(data.participants) ? data.participants : [],
            participantUsernames: data.participantUsernames && typeof data.participantUsernames === "object" ? data.participantUsernames : {},
            createdAt: data.createdAt || null,
            lastMessageAt: data.lastMessageAt || null
          });
        });
        state.chatsById = next;
        renderChatList();

        if (!state.activeChatId || !state.chatsById.has(state.activeChatId)) {
          const first = sortChats(Array.from(state.chatsById.values()))[0];
          if (first) {
            await setActiveChat(first.id);
          } else {
            const main = state.root ? state.root.querySelector("[data-chat-main]") : null;
            if (main) {
              main.innerHTML = '<div class="starlight-chat-main-empty">No chats yet. Create a DM or GC on the right.</div>';
            }
            stopMessageListener();
            state.activeChatId = "";
          }
          return;
        }

        const active = state.chatsById.get(state.activeChatId);
        if (active) {
          const main = state.root ? state.root.querySelector("[data-chat-main]") : null;
          const mountedId = main && main.querySelector("[data-active-chat-id]")
            ? String(main.querySelector("[data-active-chat-id]").getAttribute("data-active-chat-id") || "")
            : "";
          if (!mountedId || mountedId !== active.id) {
            await subscribeToMessages(active.id);
          }
        }
      }, () => {
        setStatus("Could not load chats.", false);
      });
  }

  function bindEvents() {
    if (!state.root) {
      return;
    }

    const createDmBtn = state.root.querySelector("[data-chat-create-dm]");
    if (createDmBtn) {
      createDmBtn.addEventListener("click", () => {
        createDmFromInput();
      });
    }

    const createGcBtn = state.root.querySelector("[data-chat-create-gc]");
    if (createGcBtn) {
      createGcBtn.addEventListener("click", () => {
        createGcFromInput();
      });
    }

    const list = state.root.querySelector("[data-chat-list]");
    if (list) {
      list.addEventListener("click", (event) => {
        const button = event.target.closest("[data-chat-id]");
        if (!button) {
          return;
        }
        const chatId = String(button.getAttribute("data-chat-id") || "");
        if (chatId) {
          setActiveChat(chatId);
        }
      });
    }

    const main = state.root.querySelector("[data-chat-main]");
    if (main) {
      main.addEventListener("submit", async (event) => {
        const form = event.target.closest("[data-chat-compose]");
        if (!form) {
          return;
        }
        event.preventDefault();
        const input = form.querySelector("[data-chat-input]");
        if (!input) {
          return;
        }
        const text = String(input.value || "");
        if (!text.trim()) {
          return;
        }
        await sendMessage(text);
        input.value = "";
      });
    }
  }

  function resetState() {
    if (typeof state.chatListUnsub === "function") {
      state.chatListUnsub();
    }
    state.chatListUnsub = null;
    stopMessageListener();
    state.activeChatId = "";
    state.chatsById = new Map();
    state.chatKeyCache = new Map();
  }

  async function mount(selector) {
    const root = document.querySelector(selector);
    if (!root) {
      return;
    }

    resetState();
    state.root = root;
    renderShell();
    bindEvents();

    const user = await waitForAuthUser();
    if (!user) {
      const main = state.root.querySelector("[data-chat-main]");
      if (main) {
        main.innerHTML = '<div class="starlight-chat-main-empty">Log in to use private chat.</div>';
      }
      setStatus("Log in to load encrypted chats.", false);
      return;
    }

    state.user = user;

    try {
      const keyPair = await loadOrCreateKeyPair(user.uid);
      state.keyPair = keyPair;
      state.profile = await ensureOwnProfile(user, keyPair.publicJwk);
      subscribeToChatList();
      setStatus("Encryption ready.", true);
    } catch (_error) {
      setStatus("Could not initialize encrypted chat.", false);
    }
  }

  function unmount() {
    resetState();
    state.root = null;
    state.user = null;
    state.profile = null;
    state.keyPair = null;
  }

  window.StarlightPrivateChat = {
    mount,
    unmount
  };
})();
