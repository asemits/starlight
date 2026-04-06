(function () {
  const CHAT_COLLECTION = "privateChats";
  const PROFILE_COLLECTION = "userPublicProfiles";
  const FRIEND_REQUESTS_COLLECTION = "friendRequests";
  const CHAIN_WINDOW_MS = 5 * 60 * 1000;
  const CHAT_PREVIEW_LIMIT = 90;
  const GC_TITLE_LIMIT = 72;

  const state = {
    mounted: false,
    rootSelector: "",
    root: null,
    user: null,
    identity: null,
    chats: [],
    selectedChatId: "",
    selectedChat: null,
    chatAesKeys: new Map(),
    messageRows: [],
    chatsUnsub: null,
    messagesUnsub: null,
    authUnsub: null,
    pendingReply: null,
    activeMenuMessageId: "",
    statusText: "",
    statusType: "",
    profileCache: new Map(),
    memberCache: new Map(),
    friends: [],
    incomingFriendRequests: [],
    outgoingFriendRequests: [],
    friendsUnsub: null,
    incomingFriendRequestsUnsub: null,
    outgoingFriendRequestsUnsub: null
  };

  function auth() {
    return window.nebulaAuth || null;
  }

  function db() {
    return window.nebulaDb || null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function shortId(prefix) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${prefix}${token}`;
  }

  function utf8Encode(input) {
    return new TextEncoder().encode(String(input || ""));
  }

  function utf8Decode(bytes) {
    return new TextDecoder().decode(bytes);
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(String(base64 || ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
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
    if (typeof value === "number") {
      return value;
    }
    return 0;
  }

  function formatTime(ms) {
    if (!ms) {
      return "Sending...";
    }
    try {
      return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (_error) {
      return "Unknown";
    }
  }

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function truncate(value, maxLen) {
    const text = String(value || "").trim();
    if (!text || text.length <= maxLen) {
      return text;
    }
    return `${text.slice(0, Math.max(0, maxLen - 1))}\u2026`;
  }

  function pairKeyForUids(uidA, uidB) {
    const a = String(uidA || "").trim();
    const b = String(uidB || "").trim();
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  function getFriendsByNormalizedUsername() {
    const map = new Map();
    state.friends.forEach((friend) => {
      const key = normalizeUsername(friend.username);
      if (key) {
        map.set(key, friend);
      }
    });
    return map;
  }

  function findFriendByUsername(username) {
    const key = normalizeUsername(username);
    if (!key) {
      return null;
    }
    return getFriendsByNormalizedUsername().get(key) || null;
  }

  function friendSuggestions(filterText, excludedUids) {
    const filter = normalizeUsername(filterText);
    const excluded = excludedUids || new Set();
    return state.friends
      .filter((friend) => !excluded.has(friend.uid))
      .filter((friend) => !filter || normalizeUsername(friend.username).includes(filter))
      .sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")));
  }

  function currentUser() {
    const instance = auth();
    return instance && instance.currentUser ? instance.currentUser : null;
  }

  function currentUsername() {
    const user = state.user || currentUser();
    return String(user && user.displayName ? user.displayName : "Unknown").trim() || "Unknown";
  }

  function localIdentityKey(uid) {
    return `nebula-chat-identity-v1:${uid}`;
  }

  async function generateIdentity() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    return {
      publicJwk,
      privateJwk,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };
  }

  async function importIdentityFromJwk(publicJwk, privateJwk) {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      publicJwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      privateJwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
    return { publicJwk, privateJwk, publicKey, privateKey };
  }

  async function ensureIdentity(user) {
    if (!user || !user.uid) {
      throw new Error("No active user.");
    }
    if (state.identity && state.identity.uid === user.uid) {
      return state.identity;
    }
    const key = localIdentityKey(user.uid);
    const raw = localStorage.getItem(key);
    let identity = null;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.publicJwk && parsed.privateJwk) {
          identity = await importIdentityFromJwk(parsed.publicJwk, parsed.privateJwk);
        }
      } catch (_error) {
      }
    }

    if (!identity) {
      identity = await generateIdentity();
      localStorage.setItem(
        key,
        JSON.stringify({
          publicJwk: identity.publicJwk,
          privateJwk: identity.privateJwk
        })
      );
    }

    state.identity = {
      uid: user.uid,
      ...identity
    };

    const firestore = db();
    if (firestore) {
      const username = currentUsername();
      const usernameLower = normalizeUsername(username);
      const profileRef = firestore.collection(PROFILE_COLLECTION).doc(user.uid);
      try {
        await profileRef.set(
          {
            uid: user.uid,
            username,
            usernameLower,
            chatPublicKeyJwk: identity.publicJwk,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
        state.profileCache.set(user.uid, {
          uid: user.uid,
          username,
          usernameLower,
          chatPublicKeyJwk: identity.publicJwk
        });
      } catch (_error) {
      }
    }

    return state.identity;
  }

  async function getProfileByUid(uid) {
    const clean = String(uid || "").trim();
    if (!clean) {
      return null;
    }
    if (state.profileCache.has(clean)) {
      return state.profileCache.get(clean);
    }
    const firestore = db();
    if (!firestore) {
      return null;
    }
    let snap;
    try {
      snap = await firestore.collection(PROFILE_COLLECTION).doc(clean).get();
    } catch (_error) {
      return null;
    }
    if (!snap.exists) {
      return null;
    }
    const data = snap.data() || {};
    const profile = {
      uid: clean,
      username: String(data.username || "Unknown"),
      usernameLower: normalizeUsername(data.usernameLower || data.username || ""),
      chatPublicKeyJwk: data.chatPublicKeyJwk || null
    };
    state.profileCache.set(clean, profile);
    return profile;
  }

  async function findProfileByUsername(username) {
    const clean = String(username || "").trim();
    const normalized = normalizeUsername(clean);
    if (!normalized) {
      return null;
    }

    const firestore = db();
    if (!firestore) {
      return null;
    }

    let querySnap;
    try {
      querySnap = await firestore
        .collection(PROFILE_COLLECTION)
        .where("usernameLower", "==", normalized)
        .limit(1)
        .get();
    } catch (_error) {
      return null;
    }

    if (querySnap.empty) {
      return null;
    }

    const doc = querySnap.docs[0];
    const data = doc.data() || {};
    const profile = {
      uid: String(data.uid || doc.id),
      username: String(data.username || clean),
      usernameLower: normalizeUsername(data.usernameLower || clean),
      chatPublicKeyJwk: data.chatPublicKeyJwk || null
    };
    state.profileCache.set(profile.uid, profile);
    return profile;
  }

  async function importPublicKeyFromJwk(jwk) {
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );
  }

  async function generateChatAesRawKey() {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const raw = await crypto.subtle.exportKey("raw", key);
    return new Uint8Array(raw);
  }

  async function importAesFromRaw(rawKey) {
    return crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function wrapRawKeyForUser(rawKeyBytes, publicJwk) {
    const publicKey = await importPublicKeyFromJwk(publicJwk);
    const wrapped = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      rawKeyBytes
    );
    return bytesToBase64(new Uint8Array(wrapped));
  }

  async function unwrapAesKeyForChat(chatId) {
    const cached = state.chatAesKeys.get(chatId);
    if (cached) {
      return cached;
    }

    const user = state.user || currentUser();
    const identity = await ensureIdentity(user);
    const firestore = db();
    if (!firestore || !user || !identity) {
      throw new Error("Chat encryption is unavailable right now.");
    }

    const memberKey = `${chatId}:${user.uid}`;
    let wrappedKey = "";

    if (state.memberCache.has(memberKey)) {
      wrappedKey = String(state.memberCache.get(memberKey).wrappedKey || "");
    } else {
      const memberSnap = await firestore.collection(CHAT_COLLECTION).doc(chatId).collection("members").doc(user.uid).get();
      if (!memberSnap.exists) {
        throw new Error("You do not have access to this conversation key.");
      }
      const memberData = memberSnap.data() || {};
      state.memberCache.set(memberKey, memberData);
      wrappedKey = String(memberData.wrappedKey || "");
    }

    if (!wrappedKey) {
      throw new Error("Conversation key is missing.");
    }

    const encryptedBytes = base64ToBytes(wrappedKey);
    const raw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      identity.privateKey,
      encryptedBytes
    );

    const aesKey = await importAesFromRaw(new Uint8Array(raw));
    state.chatAesKeys.set(chatId, aesKey);
    return aesKey;
  }

  async function encryptPayload(chatId, payloadObj) {
    const key = await unwrapAesKeyForChat(chatId);
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const plaintext = utf8Encode(JSON.stringify(payloadObj));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      plaintext
    );
    return {
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      iv: bytesToBase64(iv)
    };
  }

  async function decryptPayload(chatId, ciphertextB64, ivB64) {
    const key = await unwrapAesKeyForChat(chatId);
    const iv = base64ToBytes(ivB64);
    const ciphertext = base64ToBytes(ciphertextB64);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    const parsed = JSON.parse(utf8Decode(new Uint8Array(plaintext)) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  }

  function chatTitle(chat, myUid) {
    const usernames = chat.participantUsernames || {};
    const others = Array.isArray(chat.participants)
      ? chat.participants.filter((uid) => uid !== myUid)
      : [];

    if (chat.type === "dm") {
      const otherUid = others[0] || "";
      return String(usernames[otherUid] || "Unknown User");
    }

    const labels = others
      .map((uid) => String(usernames[uid] || "Unknown"))
      .filter((value) => Boolean(value));

    if (!labels.length) {
      return "Group Chat";
    }

    return truncate(labels.join(", "), GC_TITLE_LIMIT) || "Group Chat";
  }

  async function ensureDmWithUser(otherProfile) {
    const user = state.user || currentUser();
    const firestore = db();
    if (!user || !firestore) {
      throw new Error("You must be logged in.");
    }
    if (!otherProfile || !otherProfile.uid) {
      throw new Error("User not found.");
    }
    if (otherProfile.uid === user.uid) {
      throw new Error("You cannot DM yourself.");
    }
    const isFriend = state.friends.some((friend) => friend.uid === otherProfile.uid);
    if (!isFriend) {
      throw new Error("You can only DM users in your friends list.");
    }

    const existingSnap = await firestore
      .collection(CHAT_COLLECTION)
      .where("type", "==", "dm")
      .where("participants", "array-contains", user.uid)
      .get();

    const existing = existingSnap.docs.find((doc) => {
      const data = doc.data() || {};
      const participants = Array.isArray(data.participants) ? data.participants.map((v) => String(v)) : [];
      return participants.includes(otherProfile.uid) && participants.length === 2;
    });

    if (existing) {
      return existing.id;
    }

    const me = await getProfileByUid(user.uid);
    if (!me || !me.chatPublicKeyJwk) {
      throw new Error("Your encryption profile is not ready yet.");
    }
    if (!otherProfile.chatPublicKeyJwk) {
      throw new Error("That user has not opened encrypted chat yet.");
    }

    const participants = [user.uid, otherProfile.uid];
    const usernames = {
      [user.uid]: me.username || currentUsername(),
      [otherProfile.uid]: otherProfile.username || "Unknown"
    };

    const chatRef = firestore.collection(CHAT_COLLECTION).doc();
    const rawKey = await generateChatAesRawKey();
    const wrappedMe = await wrapRawKeyForUser(rawKey, me.chatPublicKeyJwk);
    const wrappedOther = await wrapRawKeyForUser(rawKey, otherProfile.chatPublicKeyJwk);
    const batch = firestore.batch();

    batch.set(chatRef, {
      type: "dm",
      participants,
      participantUsernames: usernames,
      createdBy: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.set(chatRef.collection("members").doc(user.uid), {
      uid: user.uid,
      username: usernames[user.uid],
      wrappedKey: wrappedMe,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.set(chatRef.collection("members").doc(otherProfile.uid), {
      uid: otherProfile.uid,
      username: usernames[otherProfile.uid],
      wrappedKey: wrappedOther,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    state.chatAesKeys.delete(chatRef.id);
    return chatRef.id;
  }

  async function createGroupChatFromInput(value) {
    const user = state.user || currentUser();
    const firestore = db();
    if (!user || !firestore) {
      throw new Error("You must be logged in.");
    }

    const names = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => Boolean(item));

    if (!names.length) {
      throw new Error("Enter at least one username.");
    }

    const friendsByName = getFriendsByNormalizedUsername();
    const byLower = new Map();
    names.forEach((name) => {
      byLower.set(normalizeUsername(name), name);
    });

    const foundProfiles = [];
    for (const normalized of byLower.keys()) {
      if (!normalized) {
        continue;
      }
      const friend = friendsByName.get(normalized);
      if (!friend) {
        throw new Error(`Only friends can be added: ${normalized}`);
      }
      const profile = await getProfileByUid(friend.uid);
      if (!profile) {
        throw new Error(`Friend profile unavailable: ${normalized}`);
      }
      if (profile.uid === user.uid) {
        continue;
      }
      foundProfiles.push(profile);
    }

    if (!foundProfiles.length) {
      throw new Error("Pick at least one user other than yourself.");
    }

    const me = await getProfileByUid(user.uid);
    if (!me || !me.chatPublicKeyJwk) {
      throw new Error("Your encryption profile is not ready yet.");
    }

    const uniqueProfiles = [];
    const uidSet = new Set();
    foundProfiles.forEach((profile) => {
      if (!uidSet.has(profile.uid)) {
        uidSet.add(profile.uid);
        uniqueProfiles.push(profile);
      }
    });

    uniqueProfiles.forEach((profile) => {
      if (!profile.chatPublicKeyJwk) {
        throw new Error(`User has not opened encrypted chat yet: ${profile.username}`);
      }
    });

    const participants = [user.uid, ...uniqueProfiles.map((profile) => profile.uid)];
    const participantUsernames = { [user.uid]: me.username || currentUsername() };
    uniqueProfiles.forEach((profile) => {
      participantUsernames[profile.uid] = profile.username || "Unknown";
    });

    const chatRef = firestore.collection(CHAT_COLLECTION).doc();
    const rawKey = await generateChatAesRawKey();
    const batch = firestore.batch();

    batch.set(chatRef, {
      type: "gc",
      participants,
      participantUsernames,
      createdBy: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    const wrappedMe = await wrapRawKeyForUser(rawKey, me.chatPublicKeyJwk);
    batch.set(chatRef.collection("members").doc(user.uid), {
      uid: user.uid,
      username: participantUsernames[user.uid],
      wrappedKey: wrappedMe,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    for (const profile of uniqueProfiles) {
      const wrapped = await wrapRawKeyForUser(rawKey, profile.chatPublicKeyJwk);
      batch.set(chatRef.collection("members").doc(profile.uid), {
        uid: profile.uid,
        username: participantUsernames[profile.uid],
        wrappedKey: wrapped,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    state.chatAesKeys.delete(chatRef.id);
    return chatRef.id;
  }

  async function decryptMessageRows(chatId, docs) {
    const rows = [];
    for (const doc of docs) {
      const data = doc.data() || {};
      const createdAtMs = toMillis(data.createdAt);
      const createdAtClientMs = Number.isFinite(Number(data.createdAtClient)) ? Number(data.createdAtClient) : 0;
      const chainAtMs = createdAtMs || createdAtClientMs;
      let payload = { text: "", replyToMessageId: "" };
      let decryptFailed = false;
      try {
        payload = await decryptPayload(chatId, String(data.ciphertext || ""), String(data.iv || ""));
      } catch (_error) {
        decryptFailed = true;
      }

      const text = decryptFailed ? "Unable to decrypt this message." : String(payload.text || "");
      const replyToMessageId = decryptFailed ? "" : String(payload.replyToMessageId || "");

      rows.push({
        id: doc.id,
        senderId: String(data.senderId || ""),
        senderUsername: String(data.senderUsername || "Unknown"),
        createdAtMs,
        createdAtClientMs,
        chainAtMs,
        editedAtMs: toMillis(data.editedAt),
        text,
        replyToMessageId,
        decryptFailed,
        raw: data
      });
    }
    rows.sort((a, b) => {
      const delta = (a.chainAtMs || 0) - (b.chainAtMs || 0);
      if (delta !== 0) {
        return delta;
      }
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
    return rows;
  }

  function computeReplyMap(rows) {
    const byId = new Map();
    rows.forEach((row) => byId.set(row.id, row));
    const replyMap = new Map();
    rows.forEach((row) => {
      const target = row.replyToMessageId ? byId.get(row.replyToMessageId) : null;
      if (target) {
        replyMap.set(row.id, {
          senderUsername: target.senderUsername,
          text: target.text
        });
      }
    });
    return replyMap;
  }

  function setStatus(text, type) {
    state.statusText = String(text || "");
    state.statusType = String(type || "");
    renderStatus();
  }

  function renderStatus() {
    const node = state.root ? state.root.querySelector("#nebula-chat-status") : null;
    if (!node) {
      return;
    }
    node.textContent = state.statusText;
    node.classList.remove("ok", "error");
    if (state.statusType === "ok") {
      node.classList.add("ok");
    }
    if (state.statusType === "error") {
      node.classList.add("error");
    }
  }

  function closeContextMenu() {
    if (!state.root) {
      return;
    }
    const menu = state.root.querySelector("#nebula-chat-context-menu");
    if (menu) {
      menu.classList.add("hidden");
      menu.innerHTML = "";
    }
    state.activeMenuMessageId = "";
  }

  function dismissReplyComposer() {
    state.pendingReply = null;
    renderReplyChip();
  }

  function renderReplyChip() {
    if (!state.root) {
      return;
    }
    const zone = state.root.querySelector("#nebula-chat-reply-chip");
    if (!zone) {
      return;
    }
    if (!state.pendingReply) {
      zone.innerHTML = "";
      zone.classList.add("hidden");
      return;
    }
    zone.classList.remove("hidden");
    zone.innerHTML = `
      <div class="nebula-chat-reply-chip-main">
        <p>Replying to ${escapeHtml(state.pendingReply.senderUsername)}</p>
        <span>${escapeHtml(truncate(state.pendingReply.text, CHAT_PREVIEW_LIMIT))}</span>
      </div>
      <button type="button" id="nebula-chat-reply-cancel" aria-label="Cancel reply">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    const cancel = zone.querySelector("#nebula-chat-reply-cancel");
    if (cancel) {
      cancel.addEventListener("click", dismissReplyComposer);
    }
  }

  function openModal(title, bodyHtml) {
    let host = document.getElementById("nebula-chat-modal");
    if (!host) {
      host = document.createElement("div");
      host.id = "nebula-chat-modal";
      host.className = "hidden";
      document.body.appendChild(host);
    }
    host.classList.remove("hidden");
    host.innerHTML = `
      <div class="nebula-chat-modal-layer">
        <button type="button" class="nebula-chat-modal-backdrop" data-chat-modal-close="1"></button>
        <div class="nebula-chat-modal-card">
          <header>
            <h3>${escapeHtml(title)}</h3>
            <button type="button" class="nebula-chat-modal-close" data-chat-modal-close="1" aria-label="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="nebula-chat-modal-body">${bodyHtml}</div>
        </div>
      </div>
    `;
    host.querySelectorAll("[data-chat-modal-close='1']").forEach((node) => {
      node.addEventListener("click", closeModal);
    });
  }

  function closeModal() {
    const host = document.getElementById("nebula-chat-modal");
    if (!host) {
      return;
    }
    host.innerHTML = "";
    host.classList.add("hidden");
  }

  function askDeleteMessage(messageRow, skipConfirm) {
    if (!messageRow || !messageRow.id || !state.selectedChatId) {
      return;
    }

    const performDelete = async () => {
      const firestore = db();
      if (!firestore) {
        return;
      }
      await firestore.collection(CHAT_COLLECTION).doc(state.selectedChatId).collection("messages").doc(messageRow.id).delete();
      if (state.pendingReply && state.pendingReply.id === messageRow.id) {
        dismissReplyComposer();
      }
    };

    if (skipConfirm) {
      performDelete().catch((error) => {
        setStatus(error && error.message ? error.message : "Could not delete message.", "error");
      });
      return;
    }

    openModal(
      "Delete Message",
      `
        <p class="nebula-chat-modal-copy">Delete this message?</p>
        <div class="nebula-chat-modal-actions">
          <button type="button" id="nebula-chat-delete-confirm" class="nebula-chat-modal-btn danger">Delete</button>
          <button type="button" data-chat-modal-close="1" class="nebula-chat-modal-btn">Cancel</button>
        </div>
      `
    );

    const confirm = document.getElementById("nebula-chat-delete-confirm");
    if (confirm) {
      confirm.addEventListener("click", async () => {
        try {
          await performDelete();
          closeModal();
        } catch (error) {
          const copy = document.querySelector(".nebula-chat-modal-copy");
          if (copy) {
            copy.textContent = error && error.message ? error.message : "Could not delete message.";
          }
        }
      });
    }
  }

  function openEditModal(messageRow) {
    if (!messageRow || !messageRow.id || !state.selectedChatId) {
      return;
    }

    openModal(
      "Edit Message",
      `
        <form id="nebula-chat-edit-form" class="nebula-chat-edit-form">
          <textarea id="nebula-chat-edit-input" maxlength="4000">${escapeHtml(messageRow.text)}</textarea>
          <p id="nebula-chat-edit-status" class="nebula-chat-modal-copy"></p>
          <div class="nebula-chat-modal-actions">
            <button type="submit" class="nebula-chat-modal-btn">Save</button>
            <button type="button" data-chat-modal-close="1" class="nebula-chat-modal-btn">Cancel</button>
          </div>
        </form>
      `
    );

    const form = document.getElementById("nebula-chat-edit-form");
    const input = document.getElementById("nebula-chat-edit-input");
    const status = document.getElementById("nebula-chat-edit-status");

    if (!form || !input) {
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = String(input.value || "").trim();
      if (!text) {
        if (status) {
          status.textContent = "Message cannot be empty.";
        }
        return;
      }
      try {
        const payload = {
          text,
          replyToMessageId: messageRow.replyToMessageId || ""
        };
        const encrypted = await encryptPayload(state.selectedChatId, payload);
        const firestore = db();
        if (!firestore) {
          throw new Error("Database unavailable.");
        }
        await firestore
          .collection(CHAT_COLLECTION)
          .doc(state.selectedChatId)
          .collection("messages")
          .doc(messageRow.id)
          .update({
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            editedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        closeModal();
      } catch (error) {
        if (status) {
          status.textContent = error && error.message ? error.message : "Could not edit message.";
        }
      }
    });
  }

  function handleContextAction(action, messageRow, event) {
    closeContextMenu();
    if (!messageRow) {
      return;
    }
    if (action === "reply") {
      state.pendingReply = {
        id: messageRow.id,
        senderUsername: messageRow.senderUsername,
        text: messageRow.text
      };
      renderReplyChip();
      const input = state.root ? state.root.querySelector("#nebula-chat-compose-input") : null;
      if (input) {
        input.focus();
      }
      return;
    }
    if (action === "edit") {
      openEditModal(messageRow);
      return;
    }
    if (action === "delete") {
      askDeleteMessage(messageRow, Boolean(event && event.shiftKey));
    }
  }

  function openContextMenu(messageRow, clientX, clientY) {
    if (!state.root || !messageRow) {
      return;
    }
    const menu = state.root.querySelector("#nebula-chat-context-menu");
    if (!menu) {
      return;
    }

    const isMine = messageRow.senderId === (state.user && state.user.uid ? state.user.uid : "");
    const buttons = [
      `<button type="button" data-chat-action="reply">Reply</button>`
    ];

    if (isMine) {
      buttons.push(`<button type="button" data-chat-action="edit">Edit</button>`);
      buttons.push(`<button type="button" data-chat-action="delete">Delete</button>`);
    }

    menu.innerHTML = buttons.join("");
    menu.classList.remove("hidden");
    menu.style.left = `${clientX}px`;
    menu.style.top = `${clientY}px`;

    const box = menu.getBoundingClientRect();
    const pad = 8;
    let left = clientX;
    let top = clientY;

    if (box.right > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - box.width - pad);
    }
    if (box.bottom > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - box.height - pad);
    }

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    menu.querySelectorAll("button[data-chat-action]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const action = String(btn.getAttribute("data-chat-action") || "");
        handleContextAction(action, messageRow, event);
      });
    });

    state.activeMenuMessageId = messageRow.id;
  }

  function selectChat(chatId) {
    const next = String(chatId || "").trim();
    if (!next || next === state.selectedChatId) {
      return;
    }
    state.selectedChatId = next;
    state.selectedChat = state.chats.find((chat) => chat.id === next) || null;
    state.messageRows = [];
    state.pendingReply = null;
    renderMainArea();
    renderChatList();
    subscribeMessages(next);
  }

  function sortChats(chats) {
    return [...chats].sort((a, b) => {
      const aMs = toMillis(a.lastMessageAt || a.createdAt);
      const bMs = toMillis(b.lastMessageAt || b.createdAt);
      return bMs - aMs;
    });
  }

  function renderChatList() {
    if (!state.root) {
      return;
    }
    const list = state.root.querySelector("#nebula-chat-list");
    if (!list) {
      return;
    }

    if (!state.chats.length) {
      list.innerHTML = `<li class="nebula-chat-list-empty">No chats yet. Create a DM or GC to start messaging.</li>`;
      return;
    }

    const myUid = state.user && state.user.uid ? state.user.uid : "";
    list.innerHTML = state.chats
      .map((chat) => {
        const title = chatTitle(chat, myUid);
        const type = chat.type === "gc" ? "GC" : "DM";
        const activeClass = chat.id === state.selectedChatId ? " is-active" : "";
        return `
          <li>
            <button type="button" class="nebula-chat-list-item${activeClass}" data-chat-id="${escapeHtml(chat.id)}">
              <span class="nebula-chat-list-item-type">${escapeHtml(type)}</span>
              <span class="nebula-chat-list-item-title">${escapeHtml(title)}</span>
            </button>
          </li>
        `;
      })
      .join("");

    list.querySelectorAll("button[data-chat-id]").forEach((node) => {
      node.addEventListener("click", () => {
        const chatId = node.getAttribute("data-chat-id");
        selectChat(chatId);
      });
    });
  }

  function renderMainArea() {
    if (!state.root) {
      return;
    }
    const main = state.root.querySelector("#nebula-chat-main");
    if (!main) {
      return;
    }

    if (!state.selectedChat) {
      main.innerHTML = `<div class="nebula-chat-main-empty">Pick a conversation from the left to view encrypted messages.</div>`;
      return;
    }

    const myUid = state.user && state.user.uid ? state.user.uid : "";
    const heading = chatTitle(state.selectedChat, myUid);

    main.innerHTML = `
      <section class="nebula-chat-conversation">
        <header class="nebula-chat-conversation-head">
          <h2>${escapeHtml(heading)}</h2>
          <p>${escapeHtml(state.selectedChat.type === "gc" ? "Group chat" : "Direct message")}</p>
        </header>
        <div id="nebula-chat-messages" class="nebula-chat-messages"></div>
        <div class="nebula-chat-compose-wrap">
          <div id="nebula-chat-reply-chip" class="nebula-chat-reply-chip hidden"></div>
          <form id="nebula-chat-compose-form" class="nebula-chat-compose">
            <input id="nebula-chat-compose-input" type="text" maxlength="4000" placeholder="Send an encrypted message" autocomplete="off" />
            <button type="submit">Send</button>
          </form>
        </div>
      </section>
    `;

    const form = main.querySelector("#nebula-chat-compose-form");
    const input = main.querySelector("#nebula-chat-compose-input");

    if (form && input) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = String(input.value || "").trim();
        if (!text || !state.selectedChatId) {
          return;
        }

        const payload = {
          text,
          replyToMessageId: state.pendingReply && state.pendingReply.id ? state.pendingReply.id : ""
        };

        input.disabled = true;
        try {
          const encrypted = await encryptPayload(state.selectedChatId, payload);
          const firestore = db();
          if (!firestore) {
            throw new Error("Database unavailable.");
          }

          await firestore
            .collection(CHAT_COLLECTION)
            .doc(state.selectedChatId)
            .collection("messages")
            .add({
              senderId: state.user.uid,
              senderUsername: currentUsername(),
              ciphertext: encrypted.ciphertext,
              iv: encrypted.iv,
              createdAtClient: Date.now(),
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

          await firestore.collection(CHAT_COLLECTION).doc(state.selectedChatId).update({
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          input.value = "";
          dismissReplyComposer();
        } catch (error) {
          setStatus(error && error.message ? error.message : "Could not send message.", "error");
        } finally {
          input.disabled = false;
          input.focus();
        }
      });
    }

    renderReplyChip();
    renderMessages();
  }

  function renderMessages() {
    if (!state.root || !state.selectedChat) {
      return;
    }

    const container = state.root.querySelector("#nebula-chat-messages");
    if (!container) {
      return;
    }

    if (!state.messageRows.length) {
      container.innerHTML = `<div class="nebula-chat-main-empty">No messages yet.</div>`;
      return;
    }

    const replyMap = computeReplyMap(state.messageRows);
    const myUid = state.user && state.user.uid ? state.user.uid : "";

    let previous = null;
    const html = state.messageRows
      .map((row) => {
        const sameSender = previous && previous.senderId === row.senderId;
        const withinChain = sameSender && row.chainAtMs && previous.chainAtMs && (row.chainAtMs - previous.chainAtMs <= CHAIN_WINDOW_MS);
        const showMeta = !withinChain;
        previous = row;

        const isMine = row.senderId === myUid;
        const mineClass = isMine ? " mine" : "";
        const edited = row.editedAtMs ? " (edited)" : "";
        const reply = replyMap.get(row.id);
        const replyHtml = reply
          ? `<div class="nebula-chat-inline-reply"><strong>${escapeHtml(reply.senderUsername)}</strong><span>${escapeHtml(truncate(reply.text, CHAT_PREVIEW_LIMIT))}</span></div>`
          : "";

        return `
          <article class="nebula-chat-bubble${mineClass}" data-message-id="${escapeHtml(row.id)}">
            ${showMeta ? `<div class="nebula-chat-bubble-meta"><strong>${escapeHtml(row.senderUsername)}</strong><span>${escapeHtml(formatTime(row.chainAtMs) + edited)}</span></div>` : ""}
            ${replyHtml}
            <p>${escapeHtml(row.text)}</p>
          </article>
        `;
      })
      .join("");

    container.innerHTML = html;

    container.querySelectorAll("[data-message-id]").forEach((node) => {
      node.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        const id = String(node.getAttribute("data-message-id") || "");
        const row = state.messageRows.find((item) => item.id === id);
        openContextMenu(row, event.clientX, event.clientY);
      });
    });

    container.scrollTop = container.scrollHeight;
  }

  function subscribeMessages(chatId) {
    if (state.messagesUnsub) {
      state.messagesUnsub();
      state.messagesUnsub = null;
    }

    const firestore = db();
    if (!firestore || !chatId) {
      return;
    }

    const query = firestore
      .collection(CHAT_COLLECTION)
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limit(500);

    state.messagesUnsub = query.onSnapshot(
      async (snap) => {
        const docs = snap.docs || [];
        try {
          const rows = await decryptMessageRows(chatId, docs);
          if (!state.mounted || state.selectedChatId !== chatId) {
            return;
          }
          state.messageRows = rows;
          renderMessages();
        } catch (error) {
          setStatus(error && error.message ? error.message : "Could not decrypt messages.", "error");
        }
      },
      (error) => {
        setStatus(error && error.message ? error.message : "Could not load messages.", "error");
      }
    );
  }

  function subscribeChats() {
    if (state.chatsUnsub) {
      state.chatsUnsub();
      state.chatsUnsub = null;
    }

    const user = state.user || currentUser();
    const firestore = db();

    if (!user || !firestore) {
      state.chats = [];
      state.selectedChat = null;
      state.selectedChatId = "";
      state.messageRows = [];
      renderChatList();
      renderMainArea();
      return;
    }

    const query = firestore.collection(CHAT_COLLECTION).where("participants", "array-contains", user.uid);

    state.chatsUnsub = query.onSnapshot(
      (snap) => {
        const chats = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
        state.chats = sortChats(chats);

        if (!state.selectedChatId && state.chats.length) {
          state.selectedChatId = state.chats[0].id;
        }

        const stillExists = state.chats.some((chat) => chat.id === state.selectedChatId);
        if (!stillExists) {
          state.selectedChatId = state.chats.length ? state.chats[0].id : "";
          state.messageRows = [];
        }

        state.selectedChat = state.chats.find((chat) => chat.id === state.selectedChatId) || null;
        renderChatList();
        renderMainArea();

        if (state.selectedChatId) {
          subscribeMessages(state.selectedChatId);
        } else if (state.messagesUnsub) {
          state.messagesUnsub();
          state.messagesUnsub = null;
        }
      },
      (error) => {
        setStatus(error && error.message ? error.message : "Could not load chats.", "error");
      }
    );
  }

  function renderSuggestionList(container, items, onSelect) {
    if (!container) {
      return;
    }
    if (!items.length) {
      container.innerHTML = "";
      container.classList.add("hidden");
      return;
    }
    container.classList.remove("hidden");
    container.innerHTML = items
      .map((item) => `<button type="button" data-friend-uid="${escapeHtml(item.uid)}">${escapeHtml(item.username)}</button>`)
      .join("");
    container.querySelectorAll("button[data-friend-uid]").forEach((node) => {
      node.addEventListener("click", () => {
        const uid = String(node.getAttribute("data-friend-uid") || "");
        const friend = items.find((item) => item.uid === uid);
        if (friend) {
          onSelect(friend);
        }
      });
    });
  }

  function hideSuggestionList(container) {
    if (!container) {
      return;
    }
    container.classList.add("hidden");
  }

  function renderDmSuggestions() {
    if (!state.root) {
      return;
    }
    const input = state.root.querySelector("#nebula-chat-create-dm-input");
    const container = state.root.querySelector("#nebula-chat-create-dm-suggestions");
    if (!input || !container) {
      return;
    }
    const suggestions = friendSuggestions(input.value || "", new Set());
    renderSuggestionList(container, suggestions, (friend) => {
      input.value = friend.username;
      hideSuggestionList(container);
      input.focus();
    });
  }

  function parseGcTokens(raw) {
    const value = String(raw || "");
    const tokens = value.split(",");
    const current = String(tokens.pop() || "").trim();
    const selected = tokens
      .map((token) => normalizeUsername(token))
      .filter((token) => Boolean(token));
    return { current, selected };
  }

  function renderGcSuggestions() {
    if (!state.root) {
      return;
    }
    const input = state.root.querySelector("#nebula-chat-create-gc-input");
    const container = state.root.querySelector("#nebula-chat-create-gc-suggestions");
    if (!input || !container) {
      return;
    }
    const parsed = parseGcTokens(input.value || "");
    const excluded = new Set();
    state.friends.forEach((friend) => {
      if (parsed.selected.includes(normalizeUsername(friend.username))) {
        excluded.add(friend.uid);
      }
    });
    const suggestions = friendSuggestions(parsed.current, excluded);
    renderSuggestionList(container, suggestions, (friend) => {
      const baseTokens = String(input.value || "")
        .split(",")
        .map((token) => token.trim());
      baseTokens.pop();
      baseTokens.push(friend.username);
      input.value = `${baseTokens.filter((token) => Boolean(token)).join(", ")}, `;
      hideSuggestionList(container);
      input.focus();
    });
  }

  function renderFriendsModalContent() {
    const friendsNode = document.getElementById("nebula-chat-friends-list");
    const incomingNode = document.getElementById("nebula-chat-friends-incoming");
    const outgoingNode = document.getElementById("nebula-chat-friends-outgoing");
    if (friendsNode) {
      friendsNode.innerHTML = state.friends.length
        ? state.friends
            .slice()
            .sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")))
            .map((friend) => `<li>${escapeHtml(friend.username)}</li>`)
            .join("")
        : '<li class="nebula-chat-friends-empty">No friends yet.</li>';
    }
    if (incomingNode) {
      incomingNode.innerHTML = state.incomingFriendRequests.length
        ? state.incomingFriendRequests
            .map((request) => `
              <li>
                <span>${escapeHtml(request.fromUsername)}</span>
                <div>
                  <button type="button" data-friend-accept="${escapeHtml(request.id)}">Accept</button>
                  <button type="button" data-friend-decline="${escapeHtml(request.id)}">Decline</button>
                </div>
              </li>
            `)
            .join("")
        : '<li class="nebula-chat-friends-empty">No incoming requests.</li>';
      incomingNode.querySelectorAll("button[data-friend-accept]").forEach((node) => {
        node.addEventListener("click", async () => {
          const id = String(node.getAttribute("data-friend-accept") || "");
          await acceptFriendRequest(id);
        });
      });
      incomingNode.querySelectorAll("button[data-friend-decline]").forEach((node) => {
        node.addEventListener("click", async () => {
          const id = String(node.getAttribute("data-friend-decline") || "");
          await declineFriendRequest(id);
        });
      });
    }
    if (outgoingNode) {
      outgoingNode.innerHTML = state.outgoingFriendRequests.length
        ? state.outgoingFriendRequests
            .map((request) => `
              <li>
                <span>${escapeHtml(request.toUsername)}</span>
                <button type="button" data-friend-cancel="${escapeHtml(request.id)}">Cancel</button>
              </li>
            `)
            .join("")
        : '<li class="nebula-chat-friends-empty">No outgoing requests.</li>';
      outgoingNode.querySelectorAll("button[data-friend-cancel]").forEach((node) => {
        node.addEventListener("click", async () => {
          const id = String(node.getAttribute("data-friend-cancel") || "");
          await cancelFriendRequest(id);
        });
      });
    }
  }

  async function sendFriendRequest(targetUsername) {
    const user = state.user || currentUser();
    const firestore = db();
    if (!user || !firestore) {
      throw new Error("You must be logged in.");
    }

    const clean = String(targetUsername || "").trim();
    const profile = await findProfileByUsername(clean);
    if (!profile || !profile.uid) {
      throw new Error("Username not found.");
    }
    if (profile.uid === user.uid) {
      throw new Error("You cannot add yourself.");
    }
    if (state.friends.some((friend) => friend.uid === profile.uid)) {
      throw new Error("This user is already your friend.");
    }
    const pairKey = pairKeyForUids(user.uid, profile.uid);
    const pendingExists = state.incomingFriendRequests.some((req) => req.pairKey === pairKey)
      || state.outgoingFriendRequests.some((req) => req.pairKey === pairKey);
    if (pendingExists) {
      throw new Error("A friend request is already pending for this user.");
    }

    await firestore.collection(FRIEND_REQUESTS_COLLECTION).add({
      fromUid: user.uid,
      fromUsername: currentUsername(),
      fromUsernameLower: normalizeUsername(currentUsername()),
      toUid: profile.uid,
      toUsername: profile.username,
      toUsernameLower: normalizeUsername(profile.username),
      status: "pending",
      pairKey,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function acceptFriendRequest(requestId) {
    const user = state.user || currentUser();
    const firestore = db();
    const request = state.incomingFriendRequests.find((item) => item.id === requestId);
    if (!user || !firestore || !request) {
      return;
    }
    const batch = firestore.batch();
    const myFriendRef = firestore.collection("users").doc(user.uid).collection("friends").doc(request.fromUid);
    const theirFriendRef = firestore.collection("users").doc(request.fromUid).collection("friends").doc(user.uid);
    const requestRef = firestore.collection(FRIEND_REQUESTS_COLLECTION).doc(request.id);

    batch.set(myFriendRef, {
      uid: request.fromUid,
      username: request.fromUsername,
      usernameLower: normalizeUsername(request.fromUsername),
      requestId: request.id,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.set(theirFriendRef, {
      uid: user.uid,
      username: currentUsername(),
      usernameLower: normalizeUsername(currentUsername()),
      requestId: request.id,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.update(requestRef, {
      status: "accepted",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await batch.commit();
    setStatus("Friend request accepted.", "ok");
  }

  async function declineFriendRequest(requestId) {
    const firestore = db();
    if (!firestore || !requestId) {
      return;
    }
    await firestore.collection(FRIEND_REQUESTS_COLLECTION).doc(requestId).update({
      status: "declined",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    setStatus("Friend request declined.", "ok");
  }

  async function cancelFriendRequest(requestId) {
    const firestore = db();
    if (!firestore || !requestId) {
      return;
    }
    await firestore.collection(FRIEND_REQUESTS_COLLECTION).doc(requestId).update({
      status: "canceled",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    setStatus("Friend request canceled.", "ok");
  }

  function openFriendsModal() {
    openModal(
      "Friends and Requests",
      `
        <div class="nebula-chat-friends-modal">
          <section>
            <h4>Friends</h4>
            <ul id="nebula-chat-friends-list" class="nebula-chat-friends-list"></ul>
          </section>
          <section>
            <h4>Add Friend</h4>
            <form id="nebula-chat-add-friend-form" class="nebula-chat-inline-form">
              <input id="nebula-chat-add-friend-input" type="text" placeholder="Username" maxlength="24" autocomplete="off" />
              <button type="submit">Send</button>
            </form>
          </section>
          <section>
            <h4>Incoming Requests</h4>
            <ul id="nebula-chat-friends-incoming" class="nebula-chat-friends-list"></ul>
          </section>
          <section>
            <h4>Outgoing Requests</h4>
            <ul id="nebula-chat-friends-outgoing" class="nebula-chat-friends-list"></ul>
          </section>
        </div>
      `
    );

    renderFriendsModalContent();
    const form = document.getElementById("nebula-chat-add-friend-form");
    const input = document.getElementById("nebula-chat-add-friend-input");
    if (form && input) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = String(input.value || "").trim();
        if (!username) {
          return;
        }
        input.disabled = true;
        try {
          await sendFriendRequest(username);
          input.value = "";
          setStatus("Friend request sent.", "ok");
        } catch (error) {
          setStatus(error && error.message ? error.message : "Could not send friend request.", "error");
        } finally {
          input.disabled = false;
          renderFriendsModalContent();
        }
      });
    }
  }

  function subscribeFriendsAndRequests() {
    if (state.friendsUnsub) {
      state.friendsUnsub();
      state.friendsUnsub = null;
    }
    if (state.incomingFriendRequestsUnsub) {
      state.incomingFriendRequestsUnsub();
      state.incomingFriendRequestsUnsub = null;
    }
    if (state.outgoingFriendRequestsUnsub) {
      state.outgoingFriendRequestsUnsub();
      state.outgoingFriendRequestsUnsub = null;
    }

    const user = state.user || currentUser();
    const firestore = db();
    if (!user || !firestore) {
      state.friends = [];
      state.incomingFriendRequests = [];
      state.outgoingFriendRequests = [];
      return;
    }

    state.friendsUnsub = firestore.collection("users").doc(user.uid).collection("friends").onSnapshot((snap) => {
      state.friends = snap.docs.map((doc) => ({
        uid: String(doc.id),
        ...(doc.data() || {})
      }));
      renderDmSuggestions();
      renderGcSuggestions();
      renderFriendsModalContent();
    });

    state.incomingFriendRequestsUnsub = firestore
      .collection(FRIEND_REQUESTS_COLLECTION)
      .where("toUid", "==", user.uid)
      .onSnapshot((snap) => {
        state.incomingFriendRequests = snap.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
          .filter((doc) => String(doc.status || "") === "pending");
        renderFriendsModalContent();
      });

    state.outgoingFriendRequestsUnsub = firestore
      .collection(FRIEND_REQUESTS_COLLECTION)
      .where("fromUid", "==", user.uid)
      .onSnapshot((snap) => {
        state.outgoingFriendRequests = snap.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
          .filter((doc) => String(doc.status || "") === "pending");
        renderFriendsModalContent();
      });
  }

  function bindControls() {
    if (!state.root) {
      return;
    }

    const dmForm = state.root.querySelector("#nebula-chat-create-dm-form");
    const dmInput = state.root.querySelector("#nebula-chat-create-dm-input");
    const dmSuggestions = state.root.querySelector("#nebula-chat-create-dm-suggestions");
    if (dmForm && dmInput) {
      dmInput.addEventListener("focus", () => {
        renderDmSuggestions();
      });
      dmInput.addEventListener("input", () => {
        renderDmSuggestions();
      });
      dmInput.addEventListener("blur", () => {
        window.setTimeout(() => hideSuggestionList(dmSuggestions), 120);
      });

      dmForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = String(dmInput.value || "").trim();
        if (!username) {
          return;
        }
        dmInput.disabled = true;
        setStatus("", "");
        try {
          const friend = findFriendByUsername(username);
          if (!friend) {
            throw new Error("You can only DM users in your friends list.");
          }
          const profile = await getProfileByUid(friend.uid);
          if (!profile) {
            throw new Error("Friend profile unavailable.");
          }
          const chatId = await ensureDmWithUser(profile);
          dmInput.value = "";
          hideSuggestionList(dmSuggestions);
          setStatus("DM ready.", "ok");
          selectChat(chatId);
        } catch (error) {
          setStatus(error && error.message ? error.message : "Could not create DM.", "error");
        } finally {
          dmInput.disabled = false;
        }
      });
    }

    const gcForm = state.root.querySelector("#nebula-chat-create-gc-form");
    const gcInput = state.root.querySelector("#nebula-chat-create-gc-input");
    const gcSuggestions = state.root.querySelector("#nebula-chat-create-gc-suggestions");
    if (gcForm && gcInput) {
      gcInput.addEventListener("focus", () => {
        renderGcSuggestions();
      });
      gcInput.addEventListener("input", () => {
        renderGcSuggestions();
      });
      gcInput.addEventListener("blur", () => {
        window.setTimeout(() => hideSuggestionList(gcSuggestions), 120);
      });

      gcForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = String(gcInput.value || "").trim();
        if (!text) {
          return;
        }
        gcInput.disabled = true;
        setStatus("", "");
        try {
          const chatId = await createGroupChatFromInput(text);
          gcInput.value = "";
          hideSuggestionList(gcSuggestions);
          setStatus("Group chat created.", "ok");
          selectChat(chatId);
        } catch (error) {
          setStatus(error && error.message ? error.message : "Could not create group chat.", "error");
        } finally {
          gcInput.disabled = false;
        }
      });
    }

    const friendsBtn = state.root.querySelector("#nebula-chat-friends-btn");
    if (friendsBtn) {
      friendsBtn.addEventListener("click", () => {
        openFriendsModal();
      });
    }

    document.addEventListener("click", onGlobalClick, true);
    document.addEventListener("keydown", onGlobalKeyDown, true);
  }

  function onGlobalClick(event) {
    if (!state.mounted || !state.root) {
      return;
    }
    const dmSuggestions = state.root.querySelector("#nebula-chat-create-dm-suggestions");
    const gcSuggestions = state.root.querySelector("#nebula-chat-create-gc-suggestions");
    if (dmSuggestions && (!event.target || !dmSuggestions.contains(event.target))) {
      dmSuggestions.classList.add("hidden");
    }
    if (gcSuggestions && (!event.target || !gcSuggestions.contains(event.target))) {
      gcSuggestions.classList.add("hidden");
    }
    const menu = state.root.querySelector("#nebula-chat-context-menu");
    if (!menu || menu.classList.contains("hidden")) {
      return;
    }
    if (!event.target || !menu.contains(event.target)) {
      closeContextMenu();
    }
  }

  function onGlobalKeyDown(event) {
    if (!state.mounted) {
      return;
    }
    if (event.key === "Escape") {
      closeContextMenu();
      closeModal();
    }
  }

  function unbindGlobalEvents() {
    document.removeEventListener("click", onGlobalClick, true);
    document.removeEventListener("keydown", onGlobalKeyDown, true);
  }

  function template() {
    return `
      <div class="nebula-private-chat-page nebula-private-chat-page-fullscreen">
        <section class="nebula-private-chat-shell nebula-private-chat-shell-fullscreen">
          <aside class="nebula-chat-sidebar">
            <div class="nebula-chat-create-block">
              <label>New DM</label>
              <form id="nebula-chat-create-dm-form" class="nebula-chat-inline-form">
                <input id="nebula-chat-create-dm-input" type="text" placeholder="Username" maxlength="24" autocomplete="off" />
                <button type="submit">Open</button>
              </form>
              <div id="nebula-chat-create-dm-suggestions" class="nebula-chat-suggestions hidden"></div>
            </div>
            <div class="nebula-chat-create-block">
              <label>New GC</label>
              <form id="nebula-chat-create-gc-form" class="nebula-chat-inline-form">
                <input id="nebula-chat-create-gc-input" type="text" placeholder="alice, bob, charlie" maxlength="220" autocomplete="off" />
                <button type="submit">Create</button>
              </form>
              <div id="nebula-chat-create-gc-suggestions" class="nebula-chat-suggestions hidden"></div>
            </div>
            <p id="nebula-chat-status" class="nebula-chat-status"></p>
            <section class="nebula-chat-list-wrap">
              <h2>Direct Messages and Group Chats</h2>
              <ul id="nebula-chat-list" class="nebula-chat-list"></ul>
            </section>
            <button type="button" id="nebula-chat-friends-btn" class="nebula-chat-friends-btn">Friends and Requests</button>
          </aside>
          <main id="nebula-chat-main" class="nebula-chat-main"></main>
        </section>
        <div id="nebula-chat-context-menu" class="nebula-chat-context-menu hidden"></div>
      </div>
    `;
  }

  function showLockedState() {
    if (!state.root) {
      return;
    }
    state.root.innerHTML = `
      <div class="nebula-private-chat-page">
        <div class="nebula-chat-main-empty">Log in to use encrypted private chat.</div>
      </div>
    `;
  }

  async function bootForUser(user) {
    if (!user || user.isAnonymous) {
      showLockedState();
      return;
    }
    state.root.innerHTML = template();
    bindControls();
    renderStatus();
    try {
      await ensureIdentity(user);
    } catch (_error) {
      setStatus("Profile sync is unavailable. Chat UI is loaded.", "error");
    }
    subscribeFriendsAndRequests();
    subscribeChats();
  }

  function mount(selector) {
    state.rootSelector = String(selector || "");
    state.root = document.querySelector(state.rootSelector);
    if (!state.root) {
      return;
    }

    state.mounted = true;
    state.root.innerHTML = `<div class="nebula-chat-main-empty">Loading encrypted chat...</div>`;

    const instance = auth();
    if (!instance) {
      state.root.innerHTML = `<div class="nebula-chat-main-empty">Authentication is unavailable.</div>`;
      return;
    }

    if (state.authUnsub) {
      state.authUnsub();
      state.authUnsub = null;
    }

    state.authUnsub = instance.onAuthStateChanged(async (user) => {
      state.user = user || null;
      closeContextMenu();
      closeModal();

      if (!state.mounted) {
        return;
      }

      if (state.chatsUnsub) {
        state.chatsUnsub();
        state.chatsUnsub = null;
      }
      if (state.messagesUnsub) {
        state.messagesUnsub();
        state.messagesUnsub = null;
      }
      if (state.friendsUnsub) {
        state.friendsUnsub();
        state.friendsUnsub = null;
      }
      if (state.incomingFriendRequestsUnsub) {
        state.incomingFriendRequestsUnsub();
        state.incomingFriendRequestsUnsub = null;
      }
      if (state.outgoingFriendRequestsUnsub) {
        state.outgoingFriendRequestsUnsub();
        state.outgoingFriendRequestsUnsub = null;
      }

      state.chats = [];
      state.selectedChat = null;
      state.selectedChatId = "";
      state.messageRows = [];
      state.pendingReply = null;
      state.chatAesKeys.clear();
      state.memberCache.clear();
      state.friends = [];
      state.incomingFriendRequests = [];
      state.outgoingFriendRequests = [];
      setStatus("", "");

      try {
        await bootForUser(user || null);
      } catch (error) {
        state.root.innerHTML = `<div class="nebula-chat-main-empty">${escapeHtml(error && error.message ? error.message : "Could not initialize chat.")}</div>`;
      }
    });
  }

  function unmount() {
    state.mounted = false;
    if (state.chatsUnsub) {
      state.chatsUnsub();
      state.chatsUnsub = null;
    }
    if (state.messagesUnsub) {
      state.messagesUnsub();
      state.messagesUnsub = null;
    }
    if (state.friendsUnsub) {
      state.friendsUnsub();
      state.friendsUnsub = null;
    }
    if (state.incomingFriendRequestsUnsub) {
      state.incomingFriendRequestsUnsub();
      state.incomingFriendRequestsUnsub = null;
    }
    if (state.outgoingFriendRequestsUnsub) {
      state.outgoingFriendRequestsUnsub();
      state.outgoingFriendRequestsUnsub = null;
    }
    if (state.authUnsub) {
      state.authUnsub();
      state.authUnsub = null;
    }
    unbindGlobalEvents();
    closeModal();

    if (state.root) {
      state.root.innerHTML = "";
    }

    state.root = null;
    state.rootSelector = "";
    state.user = null;
    state.chats = [];
    state.selectedChatId = "";
    state.selectedChat = null;
    state.messageRows = [];
    state.pendingReply = null;
    state.chatAesKeys.clear();
    state.memberCache.clear();
    state.friends = [];
    state.incomingFriendRequests = [];
    state.outgoingFriendRequests = [];
    state.activeMenuMessageId = "";
    state.statusText = "";
    state.statusType = "";
  }

  window.NebulaPrivateChat = {
    mount,
    unmount
  };
})();