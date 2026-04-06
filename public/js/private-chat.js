(function () {
  const CHAT_COLLECTION = "privateChats";
  const PROFILE_COLLECTION = "userPublicProfiles";
  const USER_COLLECTION = "users";
  const PRIVATE_CHAT_IDENTITY_SUBCOLLECTION = "privateChatIdentity";
  const PRIVATE_CHAT_IDENTITY_DOC_ID = "main";
  const FRIEND_REQUESTS_COLLECTION = "friendRequests";
  const BLOCKED_USERS_SUBCOLLECTION = "blockedUsers";
  const CHAIN_WINDOW_MS = 5 * 60 * 1000;
  const CHAT_PREVIEW_LIMIT = 90;
  const GC_TITLE_LIMIT = 72;
  const MESSAGE_BURST_LIMIT = 10;
  const MESSAGE_BURST_WINDOW_MS = 5000;
  const MESSAGE_THROTTLE_MS = 60 * 1000;

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
    linkPreview: null,
    composeMentionContext: null,
    composeMentionItems: [],
    composeMentionIndex: 0,
    activeMenuMessageId: "",
    statusText: "",
    statusType: "",
    keySyncLabel: "Checking...",
    keySyncType: "pending",
    keySyncLastSyncedMs: 0,
    sendThrottleUntilMs: 0,
    sendThrottleTimerId: 0,
    profileCache: new Map(),
    memberCache: new Map(),
    friends: [],
    blockedUsers: [],
    incomingFriendRequests: [],
    outgoingFriendRequests: [],
    friendsUnsub: null,
    blockedUsersUnsub: null,
    incomingFriendRequestsUnsub: null,
    outgoingFriendRequestsUnsub: null
  };

  const notificationState = {
    authUnsub: null,
    activeUid: "",
    blockedUids: new Set(),
    blockedUsersUnsub: null,
    chatsUnsub: null,
    friendRequestsUnsub: null,
    messageUnsubs: new Map(),
    seenFriendRequestIds: new Set(),
    friendRequestsInitialized: false
  };

  function auth() {
    return window.nebulaAuth || null;
  }

  function db() {
    return window.nebulaDb || null;
  }

  function rtdb() {
    return window.nebulaRtdb || null;
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

  function formatDateTime(ms) {
    if (!ms) {
      return "never";
    }
    try {
      return new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (_error) {
      return "unknown";
    }
  }

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function extractFirstUrl(value) {
    const text = String(value || "");
    const match = text.match(/https?:\/\/[^\s"'<>()]+/i);
    if (!match) {
      return "";
    }
    try {
      return new URL(match[0].trim()).href;
    } catch (_error) {
      return "";
    }
  }

  function isImageUrl(url) {
    return /\.(jpe?g|png|gif|webp|bmp|svg|avif)(?:[?#].*)?$/i.test(String(url));
  }

  function isVideoUrl(url) {
    return /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(String(url));
  }

  async function fetchLinkPreview(url) {
    const normalized = extractFirstUrl(url);
    if (!normalized) {
      return null;
    }

    if (isImageUrl(normalized)) {
      return { type: "image", url: normalized, title: "", description: "", image: normalized, video: "" };
    }
    if (isVideoUrl(normalized)) {
      return { type: "video", url: normalized, title: "", description: "", image: "", video: normalized };
    }

    try {
      const response = await fetch(normalized, { method: "GET", credentials: "omit" });
      if (!response.ok) {
        return null;
      }
      const contentType = String(response.headers.get("content-type") || "").toLowerCase();
      if (!contentType.includes("text/html")) {
        return null;
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = (doc.querySelector("meta[property='og:title']")?.content || doc.querySelector("meta[name='twitter:title']")?.content || doc.querySelector("title")?.textContent || "").trim();
      const description = (doc.querySelector("meta[property='og:description']")?.content || doc.querySelector("meta[name='description']")?.content || doc.querySelector("meta[name='twitter:description']")?.content || "").trim();
      const image = (doc.querySelector("meta[property='og:image']")?.content || doc.querySelector("meta[name='twitter:image']")?.content || doc.querySelector("link[rel='image_src']")?.href || "").trim();
      const video = (doc.querySelector("meta[property='og:video']")?.content || doc.querySelector("meta[name='twitter:player']")?.content || doc.querySelector("video source")?.src || doc.querySelector("video")?.src || "").trim();
      const type = video ? "video" : image ? "image" : "link";
      return {
        type,
        url: normalized,
        title,
        description,
        image: image || "",
        video: video || ""
      };
    } catch (_error) {
      // Fallback to basic link preview if CORS or other error
      return {
        type: "link",
        url: normalized,
        title: normalized,
        description: "",
        image: "",
        video: ""
      };
    }
  }

  function renderLinkPreview() {
    if (!state.root) {
      return;
    }
    const previewZone = state.root.querySelector("#nebula-chat-link-preview");
    if (!previewZone) {
      return;
    }
    const preview = state.linkPreview;
    if (!preview) {
      previewZone.classList.add("hidden");
      previewZone.innerHTML = "";
      return;
    }
    let content = "";
    if (preview.type === "image" && preview.image) {
      content = `<img src="${escapeHtml(preview.image)}" alt="${escapeHtml(preview.title || "Link preview image")}" referrerpolicy="no-referrer" />`;
    } else if (preview.type === "video" && preview.video) {
      content = `<video src="${escapeHtml(preview.video)}" controls preload="metadata" crossorigin="anonymous"></video>`;
    } else {
      content = `
        <div class="nebula-chat-link-preview-body">
          <strong>${escapeHtml(preview.title || preview.url)}</strong>
          <p>${escapeHtml(preview.description || preview.url)}</p>
        </div>
      `;
    }
    previewZone.classList.remove("hidden");
    previewZone.innerHTML = `
      <a href="${escapeHtml(preview.url)}" target="_blank" rel="noreferrer noopener" class="nebula-chat-link-preview-card">
        ${content}
      </a>
    `;
  }

  function updateLinkPreviewForInput(value) {
    const url = extractFirstUrl(value);
    if (!url) {
      state.linkPreview = null;
      renderLinkPreview();
      return;
    }
    if (state.linkPreview && state.linkPreview.url === url) {
      return;
    }
    state.linkPreview = null;
    renderLinkPreview();
    fetchLinkPreview(url).then((preview) => {
      if (preview && extractFirstUrl(String(value || "")) === url) {
        state.linkPreview = preview;
        renderLinkPreview();
      }
    }).catch(() => {
      state.linkPreview = null;
      renderLinkPreview();
    });
  }

  function clearLinkPreview() {
    state.linkPreview = null;
    renderLinkPreview();
  }

  function truncate(value, maxLen) {
    const text = String(value || "").trim();
    if (!text || text.length <= maxLen) {
      return text;
    }
    return `${text.slice(0, Math.max(0, maxLen - 1))}\u2026`;
  }
  function decodeHtmlEntities(value) {
    const element = document.createElement("textarea");
    element.innerHTML = String(value || "");
    return element.value;
  }

  function normalizeMarkdownLinkUrl(rawUrl) {
    const decoded = decodeHtmlEntities(rawUrl).trim();
    if (!decoded) {
      return "";
    }
    const withProtocol = /^www\./i.test(decoded) ? `https://${decoded}` : decoded;
    try {
      const parsed = new URL(withProtocol);
      const protocol = String(parsed.protocol || "").toLowerCase();
      if (protocol !== "http:" && protocol !== "https:") {
        return "";
      }
      return parsed.href;
    } catch (_error) {
      return "";
    }
  }

  function stashMarkdownToken(pool, value) {
    const token = `\uE000${pool.length}\uE001`;
    pool.push(String(value || ""));
    return token;
  }

  function restoreMarkdownTokens(value, pool) {
    return String(value || "").replace(/\uE000(\d+)\uE001/g, (_match, indexText) => {
      const index = Number.parseInt(indexText, 10);
      if (!Number.isFinite(index) || index < 0 || index >= pool.length) {
        return "";
      }
      return pool[index];
    });
  }

  function renderMarkdownInline(value, tokenPool) {
    let output = String(value || "");

    output = output.replace(/`([^`\n]+)`/g, (_match, codeText) => {
      return stashMarkdownToken(tokenPool, `<code class="nebula-chat-md-code">${codeText}</code>`);
    });

    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, rawUrl) => {
      const href = normalizeMarkdownLinkUrl(rawUrl);
      if (!href) {
        return `${label} (${rawUrl})`;
      }
      return stashMarkdownToken(tokenPool, `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${label}</a>`);
    });

    output = output.replace(/__\*\*([\s\S]+?)\*\*__/g, "<u><strong>$1</strong></u>");
    output = output.replace(/__\*([\s\S]+?)\*__/g, "<u><em>$1</em></u>");
    output = output.replace(/__([^_\n]+?)__/g, "<u>$1</u>");
    output = output.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
    output = output.replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");
    output = output.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
    output = output.replace(/_([^_\n]+?)_/g, "<em>$1</em>");

    return output;
  }

  function renderMarkdownBlocks(value, tokenPool) {
    const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    let inList = false;

    lines.forEach((line) => {
      const current = String(line || "");
      const listMatch = current.match(/^(\s*)([-*])\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          output.push('<ul class="nebula-chat-md-list">');
          inList = true;
        }
        const depth = Math.max(0, Math.min(4, Math.floor(String(listMatch[1] || "").length / 2)));
        output.push(`<li class="depth-${depth}">${renderMarkdownInline(listMatch[3], tokenPool)}</li>`);
        return;
      }

      if (inList) {
        output.push("</ul>");
        inList = false;
      }

      const trimmed = current.trim();
      if (!trimmed) {
        return;
      }

      const headerMatch = current.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        output.push(`<h${level}>${renderMarkdownInline(headerMatch[2], tokenPool)}</h${level}>`);
        return;
      }

      const subtextMatch = current.match(/^-#\s+(.+)$/);
      if (subtextMatch) {
        output.push(`<p class="nebula-chat-md-subtext">${renderMarkdownInline(subtextMatch[1], tokenPool)}</p>`);
        return;
      }

      const quoteMultiMatch = current.match(/^>>>\s?(.*)$/);
      if (quoteMultiMatch) {
        output.push(`<blockquote class="nebula-chat-md-quote multi">${renderMarkdownInline(quoteMultiMatch[1], tokenPool)}</blockquote>`);
        return;
      }

      const quoteMatch = current.match(/^>\s?(.*)$/);
      if (quoteMatch) {
        output.push(`<blockquote class="nebula-chat-md-quote">${renderMarkdownInline(quoteMatch[1], tokenPool)}</blockquote>`);
        return;
      }

      output.push(`<p>${renderMarkdownInline(current, tokenPool)}</p>`);
    });

    if (inList) {
      output.push("</ul>");
    }

    return output.join("");
  }

  function renderMarkdown(value) {
    const safeText = escapeHtml(String(value || ""));
    const tokenPool = [];
    let prepared = safeText;

    prepared = prepared.replace(/\\([\\`*_~\[\]()>#-])/g, (_match, escapedChar) => {
      return stashMarkdownToken(tokenPool, escapedChar);
    });

    prepared = prepared.replace(/```([\s\S]*?)```/g, (_match, codeText) => {
      return stashMarkdownToken(tokenPool, `<pre class="nebula-chat-md-codeblock"><code>${codeText}</code></pre>`);
    });

    const rendered = renderMarkdownBlocks(prepared, tokenPool);
    return restoreMarkdownTokens(rendered, tokenPool);
  }

  function markdownToPlainText(value) {
    let output = String(value || "");
    output = output.replace(/\\([\\`*_~\[\]()>#-])/g, "$1");
    output = output.replace(/```([\s\S]*?)```/g, "$1");
    output = output.replace(/`([^`\n]+)`/g, "$1");
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
    output = output.replace(/__\*\*([\s\S]+?)\*\*__/g, "$1");
    output = output.replace(/__\*([\s\S]+?)\*__/g, "$1");
    output = output.replace(/__([^_\n]+?)__/g, "$1");
    output = output.replace(/\*\*([^*\n]+?)\*\*/g, "$1");
    output = output.replace(/~~([^~\n]+?)~~/g, "$1");
    output = output.replace(/\*([^*\n]+?)\*/g, "$1");
    output = output.replace(/_([^_\n]+?)_/g, "$1");
    output = output.replace(/^\s*[-*]\s+/gm, "");
    output = output.replace(/^\s*>+\s?/gm, "");
    output = output.replace(/^\s*#{1,3}\s+/gm, "");
    output = output.replace(/^\s*-#\s+/gm, "");
    return output.trim();
  }

  function messageRateLimitPath(chatId, uid) {
    const cleanChatId = String(chatId || "").trim();
    const cleanUid = String(uid || "").trim();
    if (!cleanChatId || !cleanUid) {
      return "";
    }
    return `privateChats/${cleanChatId}/messageRateLimits/${cleanUid}`;
  }

  function toFiniteNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeRateLimitState(raw, uid) {
    const safe = raw && typeof raw === "object" ? raw : {};
    return {
      uid: String(safe.uid || uid || ""),
      windowStartMs: Math.max(0, toFiniteNumber(safe.windowStartMs, 0)),
      windowCount: Math.max(0, toFiniteNumber(safe.windowCount, 0)),
      throttleStartedAtMs: Math.max(0, toFiniteNumber(safe.throttleStartedAtMs, 0)),
      updatedAtMs: Math.max(0, toFiniteNumber(safe.updatedAtMs, 0))
    };
  }

  function throttleUntilFromRateState(rateState) {
    const start = Math.max(0, toFiniteNumber(rateState && rateState.throttleStartedAtMs, 0));
    if (!start) {
      return 0;
    }
    return start + MESSAGE_THROTTLE_MS;
  }

  function getRateLimitServerTimestamp() {
    const namespace = window.firebase && window.firebase.database ? window.firebase.database : null;
    if (namespace && namespace.ServerValue && namespace.ServerValue.TIMESTAMP) {
      return namespace.ServerValue.TIMESTAMP;
    }
    return Date.now();
  }

  function computeNextRateLimitState(currentRaw, nowMs, uid) {
    const current = normalizeRateLimitState(currentRaw, uid);
    const activeThrottleUntil = throttleUntilFromRateState(current);

    if (activeThrottleUntil > nowMs) {
      return {
        blocked: true,
        throttleUntilMs: activeThrottleUntil,
        next: null,
        resetWindow: false,
        triggerThrottle: false
      };
    }

    const withinWindow = current.windowStartMs > 0 && (nowMs - current.windowStartMs) <= MESSAGE_BURST_WINDOW_MS;
    const nextWindowStartMs = withinWindow ? current.windowStartMs : nowMs;
    const nextWindowCount = withinWindow ? current.windowCount + 1 : 1;
    const triggerThrottle = withinWindow && nextWindowCount > MESSAGE_BURST_LIMIT;
    const nextThrottleStartedAtMs = triggerThrottle ? nowMs : current.throttleStartedAtMs;
    const next = {
      uid: String(uid || current.uid || ""),
      windowStartMs: nextWindowStartMs,
      windowCount: nextWindowCount,
      throttleStartedAtMs: nextThrottleStartedAtMs,
      updatedAtMs: nowMs
    };

    return {
      blocked: false,
      throttleUntilMs: triggerThrottle ? nowMs + MESSAGE_THROTTLE_MS : 0,
      next,
      resetWindow: !withinWindow,
      triggerThrottle
    };
  }

  function buildRateLimitWriteState(next, resetWindow, triggerThrottle) {
    const serverTs = getRateLimitServerTimestamp();
    return {
      uid: String(next.uid || ""),
      windowStartMs: resetWindow ? serverTs : next.windowStartMs,
      windowCount: next.windowCount,
      throttleStartedAtMs: triggerThrottle ? serverTs : next.throttleStartedAtMs,
      updatedAtMs: serverTs
    };
  }

  function formatThrottleCountdown(ms) {
    const totalSeconds = Math.max(0, Math.ceil(Math.max(0, Number(ms || 0)) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function stopSendThrottleTimer() {
    if (state.sendThrottleTimerId) {
      window.clearInterval(state.sendThrottleTimerId);
      state.sendThrottleTimerId = 0;
    }
  }

  function renderSendThrottleTimer() {
    const node = state.root ? state.root.querySelector("#nebula-chat-throttle-timer") : null;
    if (!node) {
      return;
    }
    const remaining = Math.max(0, state.sendThrottleUntilMs - Date.now());
    if (remaining <= 0) {
      node.textContent = "";
      node.classList.add("hidden");
      return;
    }
    node.textContent = `Throttled: ${formatThrottleCountdown(remaining)}`;
    node.classList.remove("hidden");
  }

  function setSendThrottleUntil(untilMs) {
    const parsed = toFiniteNumber(untilMs, 0);
    state.sendThrottleUntilMs = parsed > Date.now() ? parsed : 0;
    renderSendThrottleTimer();
    if (state.sendThrottleUntilMs > 0 && !state.sendThrottleTimerId) {
      state.sendThrottleTimerId = window.setInterval(() => {
        renderSendThrottleTimer();
        if (state.sendThrottleUntilMs <= Date.now()) {
          state.sendThrottleUntilMs = 0;
          renderSendThrottleTimer();
          stopSendThrottleTimer();
        }
      }, 250);
    }
    if (state.sendThrottleUntilMs <= 0) {
      stopSendThrottleTimer();
    }
  }

  function isSendThrottled() {
    return state.sendThrottleUntilMs > Date.now();
  }

  function showSlowDownModal() {
    openModal(
      "Slow down!",
      '<p class="nebula-chat-modal-copy">Bandwidth doesn\'t grow on trees. Your connection will be throttled for 1 minute.</p>'
    );
  }

  async function syncSendThrottleFromServer(chatId) {
    const user = state.user || currentUser();
    const rtdbInstance = rtdb();
    const path = messageRateLimitPath(chatId, user && user.uid ? user.uid : "");
    if (!user || !path || !rtdbInstance) {
      setSendThrottleUntil(0);
      return;
    }
    try {
      const snap = await rtdbInstance.ref(path).once("value");
      const rateState = normalizeRateLimitState(snap && snap.val ? snap.val() : null, user.uid);
      setSendThrottleUntil(throttleUntilFromRateState(rateState));
    } catch (_error) {
    }
  }

  async function sendMessageWithRateLimit(chatId, encryptedMessage, payloadText) {
    const user = state.user || currentUser();
    const rtdbInstance = rtdb();
    const cleanChatId = String(chatId || "").trim();
    if (!user || !user.uid || !cleanChatId || !rtdbInstance || !encryptedMessage) {
      throw new Error("Database unavailable.");
    }

    const path = messageRateLimitPath(cleanChatId, user.uid);
    if (!path) {
      throw new Error("Rate limit path unavailable.");
    }

    const nowMs = Date.now();
    const rateSnap = await rtdbInstance.ref(path).once("value");
    const decision = computeNextRateLimitState(rateSnap && rateSnap.val ? rateSnap.val() : null, nowMs, user.uid);

    if (decision.blocked) {
      setSendThrottleUntil(decision.throttleUntilMs);
      showSlowDownModal();
      throw new Error("Bandwidth doesn't grow on trees. Your connection will be throttled for 1 minute.");
    }

    const messageId = shortId("msg-");
    const serverTs = getRateLimitServerTimestamp();
    const updates = {};
    updates[`privateChats/${cleanChatId}/messages/${messageId}`] = {
      senderId: user.uid,
      senderUsername: currentUsername(),
      ciphertext: encryptedMessage.ciphertext,
      iv: encryptedMessage.iv,
      createdAtClient: nowMs,
      createdAt: serverTs
    };
    updates[`privateChats/${cleanChatId}/lastMessageAt`] = serverTs;
    updates[path] = buildRateLimitWriteState(decision.next, decision.resetWindow, decision.triggerThrottle);

    await rtdbInstance.ref().update(updates);

    if (decision.triggerThrottle) {
      setSendThrottleUntil(Date.now() + MESSAGE_THROTTLE_MS);
      showSlowDownModal();
    } else {
      const nextUntil = throttleUntilFromRateState(decision.next);
      setSendThrottleUntil(nextUntil);
    }

    return {
      messageId,
      text: String(payloadText || "")
    };
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

  function getChatMentionCandidates(chat) {
    const out = [];
    const seen = new Set();
    const myUid = state.user && state.user.uid ? String(state.user.uid) : "";
    const participants = chat && Array.isArray(chat.participants)
      ? chat.participants.map((uid) => String(uid || ""))
      : [];
    const usernames = chat && chat.participantUsernames && typeof chat.participantUsernames === "object"
      ? chat.participantUsernames
      : {};

    participants.forEach((uid) => {
      if (!uid || uid === myUid) {
        return;
      }
      const username = String(usernames[uid] || "").trim();
      const key = normalizeUsername(username);
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      out.push({ uid, username });
    });

    state.friends.forEach((friend) => {
      const username = String(friend.username || "").trim();
      const key = normalizeUsername(username);
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      out.push({ uid: String(friend.uid || ""), username });
    });

    return out.sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")));
  }

  function getActiveMentionContext(inputValue, caretPosition) {
    const text = String(inputValue || "");
    const caret = Number.isFinite(Number(caretPosition)) ? Number(caretPosition) : text.length;
    const head = text.slice(0, caret);
    const match = head.match(/(^|[\s(])@([A-Za-z0-9._-]{0,24})$/);
    if (!match) {
      return null;
    }
    const query = String(match[2] || "");
    const start = caret - query.length - 1;
    if (start < 0) {
      return null;
    }
    return {
      start,
      end: caret,
      query
    };
  }

  function resetComposeMentionState() {
    state.composeMentionContext = null;
    state.composeMentionItems = [];
    state.composeMentionIndex = 0;
  }

  function hideComposeMentionSuggestions(container) {
    resetComposeMentionState();
    hideSuggestionList(container);
  }

  function applyComposeMentionSuggestion(input, container, suggestion) {
    if (!input || !container || !suggestion || !suggestion.username) {
      return;
    }
    const context = state.composeMentionContext;
    if (!context) {
      hideComposeMentionSuggestions(container);
      return;
    }

    const currentValue = String(input.value || "");
    const before = currentValue.slice(0, context.start);
    const after = currentValue.slice(context.end);
    const mentionText = `@${suggestion.username}`;
    const nextAfter = after.startsWith(" ") ? after.slice(1) : after;
    const nextValue = `${before}${mentionText} ${nextAfter}`;
    const caret = (before + mentionText + " ").length;

    input.value = nextValue;
    input.setSelectionRange(caret, caret);
    updateLinkPreviewForInput(nextValue);
    hideComposeMentionSuggestions(container);
    input.focus();
  }

  function renderComposeMentionSuggestions(input, container) {
    if (!input || !container || !state.selectedChat) {
      hideComposeMentionSuggestions(container);
      return;
    }

    const value = String(input.value || "");
    const caret = Number.isFinite(Number(input.selectionStart)) ? Number(input.selectionStart) : value.length;
    const context = getActiveMentionContext(value, caret);

    if (!context) {
      hideComposeMentionSuggestions(container);
      return;
    }

    const filter = normalizeUsername(context.query);
    const items = getChatMentionCandidates(state.selectedChat)
      .filter((item) => !filter || normalizeUsername(item.username).includes(filter))
      .slice(0, 8);

    if (!items.length) {
      hideComposeMentionSuggestions(container);
      return;
    }

    state.composeMentionContext = context;
    state.composeMentionItems = items;
    if (!Number.isFinite(Number(state.composeMentionIndex)) || state.composeMentionIndex < 0 || state.composeMentionIndex >= items.length) {
      state.composeMentionIndex = 0;
    }

    container.classList.remove("hidden");
    container.innerHTML = items
      .map((item, index) => {
        const active = index === state.composeMentionIndex ? " is-active" : "";
        return `<button type="button" data-compose-mention-index="${index}" class="${active.trim()}">@${escapeHtml(item.username)}</button>`;
      })
      .join("");

    container.querySelectorAll("button[data-compose-mention-index]").forEach((node) => {
      node.addEventListener("mousedown", (event) => {
        event.preventDefault();
        const index = Number.parseInt(String(node.getAttribute("data-compose-mention-index") || "-1"), 10);
        if (!Number.isFinite(index) || index < 0 || index >= state.composeMentionItems.length) {
          return;
        }
        applyComposeMentionSuggestion(input, container, state.composeMentionItems[index]);
      });
    });
  }

  function handleComposeMentionKeydown(event, input, container) {
    if (!event || !input || !container || container.classList.contains("hidden") || !state.composeMentionItems.length) {
      return false;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.composeMentionIndex = (state.composeMentionIndex + 1) % state.composeMentionItems.length;
      renderComposeMentionSuggestions(input, container);
      return true;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.composeMentionIndex = (state.composeMentionIndex - 1 + state.composeMentionItems.length) % state.composeMentionItems.length;
      renderComposeMentionSuggestions(input, container);
      return true;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const index = Math.max(0, Math.min(state.composeMentionItems.length - 1, state.composeMentionIndex));
      applyComposeMentionSuggestion(input, container, state.composeMentionItems[index]);
      return true;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      hideComposeMentionSuggestions(container);
      return true;
    }

    return false;
  }

  function isBlockedUid(uid) {
    const target = String(uid || "").trim();
    if (!target) {
      return false;
    }
    return state.blockedUsers.some((item) => String(item.uid || "") === target);
  }

  async function hasUserBlockedMe(otherUid) {
    const user = state.user || currentUser();
    const firestore = db();
    const cleanOther = String(otherUid || "").trim();
    if (!user || !firestore || !cleanOther) {
      return false;
    }
    try {
      const doc = await firestore
        .collection("users")
        .doc(cleanOther)
        .collection(BLOCKED_USERS_SUBCOLLECTION)
        .doc(user.uid)
        .get();
      return Boolean(doc && doc.exists);
    } catch (_error) {
      return false;
    }
  }

  function shouldSuppressMessageNotification(chatId) {
    const path = String(window.location.pathname || "");
    const inChatRoute = path === "/chat" || path === "/private-chat";
    if (!inChatRoute) {
      return false;
    }
    if (document.visibilityState !== "visible" || !document.hasFocus()) {
      return false;
    }
    return String(state.selectedChatId || "") === String(chatId || "");
  }

  function emitNotification(payload) {
    if (!window.showNebulaNotification || !payload || typeof payload !== "object") {
      return;
    }
    window.showNebulaNotification(payload);
  }

  function stopNotificationWatchers() {
    if (notificationState.chatsUnsub) {
      notificationState.chatsUnsub();
      notificationState.chatsUnsub = null;
    }
    if (notificationState.friendRequestsUnsub) {
      notificationState.friendRequestsUnsub();
      notificationState.friendRequestsUnsub = null;
    }
    if (notificationState.blockedUsersUnsub) {
      notificationState.blockedUsersUnsub();
      notificationState.blockedUsersUnsub = null;
    }

    notificationState.messageUnsubs.forEach((entry) => {
      if (entry && typeof entry.unsub === "function") {
        entry.unsub();
      }
    });
    notificationState.messageUnsubs.clear();
    notificationState.seenFriendRequestIds.clear();
    notificationState.friendRequestsInitialized = false;
    notificationState.blockedUids.clear();
  }

  function ensureChatMessageWatcher(user, chatId, chatData) {
    const firestore = db();
    if (!firestore || !user || !chatId) {
      return;
    }

    const existing = notificationState.messageUnsubs.get(chatId);
    if (existing) {
      existing.chatData = chatData;
      return;
    }

    const watcher = {
      unsub: null,
      initialized: false,
      lastMessageId: "",
      chatData
    };

    const query = firestore
      .collection(CHAT_COLLECTION)
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(1);

    watcher.unsub = query.onSnapshot((snap) => {
      if (!snap || snap.empty) {
        watcher.initialized = true;
        return;
      }

      const doc = snap.docs[0];
      const data = doc.data() || {};
      const messageId = String(doc.id || "");

      if (!watcher.initialized) {
        watcher.lastMessageId = messageId;
        watcher.initialized = true;
        return;
      }
      if (!messageId || messageId === watcher.lastMessageId) {
        return;
      }
      watcher.lastMessageId = messageId;

      const senderId = String(data.senderId || "");
      if (!senderId || senderId === user.uid || notificationState.blockedUids.has(senderId)) {
        return;
      }
      if (shouldSuppressMessageNotification(chatId)) {
        return;
      }

      const sender = String(data.senderUsername || "Someone");
      const title = chatTitle({ id: chatId, ...(watcher.chatData || {}) }, user.uid);
      emitNotification({
        type: "message",
        title: "New Message",
        body: `${sender} sent a message in ${title || "chat"}`,
        route: "/chat",
        tag: `chat:${chatId}`,
        actionLabel: "Open Chat"
      });
    });

    notificationState.messageUnsubs.set(chatId, watcher);
  }

  function startNotificationWatchers(user) {
    const firestore = db();
    if (!user || user.isAnonymous || !firestore) {
      stopNotificationWatchers();
      return;
    }

    stopNotificationWatchers();
    notificationState.activeUid = user.uid;

    notificationState.blockedUsersUnsub = firestore
      .collection("users")
      .doc(user.uid)
      .collection(BLOCKED_USERS_SUBCOLLECTION)
      .onSnapshot((snap) => {
        notificationState.blockedUids = new Set((snap.docs || []).map((doc) => String(doc.id || "")));
      });

    notificationState.friendRequestsUnsub = firestore
      .collection(FRIEND_REQUESTS_COLLECTION)
      .where("toUid", "==", user.uid)
      .onSnapshot((snap) => {
        const pending = (snap.docs || [])
          .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
          .filter((doc) => String(doc.status || "") === "pending");

        const currentIds = new Set(pending.map((doc) => String(doc.id || "")));

        if (!notificationState.friendRequestsInitialized) {
          notificationState.seenFriendRequestIds = currentIds;
          notificationState.friendRequestsInitialized = true;
          return;
        }

        pending.forEach((request) => {
          const id = String(request.id || "");
          if (!id || notificationState.seenFriendRequestIds.has(id)) {
            return;
          }
          notificationState.seenFriendRequestIds.add(id);
          const fromUid = String(request.fromUid || "");
          if (fromUid && notificationState.blockedUids.has(fromUid)) {
            return;
          }
          emitNotification({
            type: "friend-request",
            title: "New Friend Request",
            body: `${String(request.fromUsername || "Someone")} sent you a friend request`,
            route: "/chat",
            tag: `friend-request:${id}`,
            actionLabel: "Open"
          });
        });

        notificationState.seenFriendRequestIds.forEach((id) => {
          if (!currentIds.has(id)) {
            notificationState.seenFriendRequestIds.delete(id);
          }
        });
      });

    notificationState.chatsUnsub = firestore
      .collection(CHAT_COLLECTION)
      .where("participants", "array-contains", user.uid)
      .onSnapshot((snap) => {
        const activeIds = new Set();
        (snap.docs || []).forEach((doc) => {
          const chatId = String(doc.id || "");
          if (!chatId) {
            return;
          }
          activeIds.add(chatId);
          ensureChatMessageWatcher(user, chatId, doc.data() || {});
        });

        notificationState.messageUnsubs.forEach((entry, chatId) => {
          if (activeIds.has(chatId)) {
            return;
          }
          if (entry && typeof entry.unsub === "function") {
            entry.unsub();
          }
          notificationState.messageUnsubs.delete(chatId);
        });
      });
  }

  function initNotificationWatchers() {
    const instance = auth();
    if (!instance || notificationState.authUnsub) {
      return;
    }

    notificationState.authUnsub = instance.onAuthStateChanged((user) => {
      if (!user || user.isAnonymous) {
        notificationState.activeUid = "";
        stopNotificationWatchers();
        return;
      }
      if (notificationState.activeUid === user.uid && notificationState.chatsUnsub) {
        return;
      }
      startNotificationWatchers(user);
    });
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

  function backupIdentitySecret(user) {
    const uid = String(user && user.uid ? user.uid : "");
    const createdAt = String(user && user.metadata && user.metadata.creationTime ? user.metadata.creationTime : "");
    return `${uid}\n${createdAt}\nnebula-chat-identity-backup-v1`;
  }

  function identityBackupDocRef(firestore, uid) {
    return firestore
      .collection(USER_COLLECTION)
      .doc(uid)
      .collection(PRIVATE_CHAT_IDENTITY_SUBCOLLECTION)
      .doc(PRIVATE_CHAT_IDENTITY_DOC_ID);
  }

  async function deriveIdentityBackupKey(user, saltBytes) {
    const secretBytes = utf8Encode(backupIdentitySecret(user));
    const baseKey = await crypto.subtle.importKey("raw", secretBytes, "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: saltBytes, iterations: 210000, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
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

  function persistIdentityLocally(uid, identity) {
    localStorage.setItem(
      localIdentityKey(uid),
      JSON.stringify({
        publicJwk: identity.publicJwk,
        privateJwk: identity.privateJwk
      })
    );
  }

  async function loadIdentityFromLocalStorage(uid) {
    const raw = localStorage.getItem(localIdentityKey(uid));
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.publicJwk || !parsed.privateJwk) {
        return null;
      }
      return await importIdentityFromJwk(parsed.publicJwk, parsed.privateJwk);
    } catch (_error) {
      return null;
    }
  }

  function identityJwkFingerprint(jwk) {
    try {
      return JSON.stringify(jwk || {});
    } catch (_error) {
      return "";
    }
  }

  async function encryptIdentityBackupBundle(user, identity) {
    const salt = new Uint8Array(16);
    const iv = new Uint8Array(12);
    crypto.getRandomValues(salt);
    crypto.getRandomValues(iv);
    const key = await deriveIdentityBackupKey(user, salt);
    const payload = utf8Encode(
      JSON.stringify({
        publicJwk: identity.publicJwk,
        privateJwk: identity.privateJwk
      })
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      payload
    );
    return {
      uid: user.uid,
      version: 1,
      publicJwk: identity.publicJwk,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(encrypted))
    };
  }

  async function decryptIdentityBackupBundle(user, bundle) {
    if (!bundle || !bundle.publicJwk || !bundle.salt || !bundle.iv || !bundle.ciphertext) {
      return null;
    }
    const salt = base64ToBytes(bundle.salt);
    const iv = base64ToBytes(bundle.iv);
    const ciphertext = base64ToBytes(bundle.ciphertext);
    const key = await deriveIdentityBackupKey(user, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    const parsed = JSON.parse(utf8Decode(new Uint8Array(plaintext)) || "{}");
    if (!parsed || !parsed.publicJwk || !parsed.privateJwk) {
      return null;
    }
    return importIdentityFromJwk(parsed.publicJwk, parsed.privateJwk);
  }

  async function fetchIdentityBackupBundle(user, firestore) {
    if (!user || !user.uid || !firestore) {
      return null;
    }
    try {
      const snap = await identityBackupDocRef(firestore, user.uid).get();
      if (!snap.exists) {
        return null;
      }
      return snap.data() || null;
    } catch (_error) {
      return null;
    }
  }

  async function loadIdentityFromBackup(user, firestore) {
    const bundle = await fetchIdentityBackupBundle(user, firestore);
    if (!bundle) {
      return null;
    }
    try {
      return await decryptIdentityBackupBundle(user, bundle);
    } catch (_error) {
      return null;
    }
  }

  async function syncIdentityBackup(user, firestore, identity) {
    if (!user || !user.uid || !firestore || !identity) {
      return;
    }
    const bundle = await encryptIdentityBackupBundle(user, identity);
    await identityBackupDocRef(firestore, user.uid).set(
      {
        uid: user.uid,
        version: bundle.version,
        publicJwk: bundle.publicJwk,
        salt: bundle.salt,
        iv: bundle.iv,
        ciphertext: bundle.ciphertext,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    setKeySyncStatus("Synced", "ok", Date.now());
  }

  async function replaceIdentityFromBackup(user, firestore) {
    const recovered = await loadIdentityFromBackup(user, firestore);
    if (!recovered) {
      return null;
    }
    persistIdentityLocally(user.uid, recovered);
    let backupUpdatedAtMs = 0;
    const bundle = await fetchIdentityBackupBundle(user, firestore);
    if (bundle) {
      backupUpdatedAtMs = toMillis(bundle.updatedAt);
    }
    state.identity = {
      uid: user.uid,
      ...recovered
    };
    setKeySyncStatus("Restored on this device", "ok", backupUpdatedAtMs || Date.now());
    return state.identity;
  }

  async function userHasAnyChats(user, firestore) {
    if (!user || !user.uid || !firestore) {
      return true;
    }
    try {
      const snap = await firestore
        .collection(CHAT_COLLECTION)
        .where("participants", "array-contains", user.uid)
        .limit(1)
        .get();
      return !snap.empty;
    } catch (_error) {
      return true;
    }
  }

  async function ensureIdentity(user) {
    if (!user || !user.uid) {
      throw new Error("No active user.");
    }
    if (state.identity && state.identity.uid === user.uid) {
      return state.identity;
    }
    const firestore = db();
    setKeySyncStatus("Checking...", "pending");
    let identity = await loadIdentityFromLocalStorage(user.uid);
    const backupBundle = firestore ? await fetchIdentityBackupBundle(user, firestore) : null;

    if (backupBundle) {
      const backupUpdatedAtMs = toMillis(backupBundle.updatedAt);
      if (backupUpdatedAtMs > 0) {
        setKeySyncStatus("Backup found", "pending", backupUpdatedAtMs);
      }
      const backupPublic = identityJwkFingerprint(backupBundle.publicJwk);
      const localPublic = identity ? identityJwkFingerprint(identity.publicJwk) : "";
      if (!identity || (backupPublic && localPublic && backupPublic !== localPublic)) {
        try {
          const recovered = await decryptIdentityBackupBundle(user, backupBundle);
          if (recovered) {
            identity = recovered;
            persistIdentityLocally(user.uid, recovered);
            setKeySyncStatus("Restored on this device", "ok", backupUpdatedAtMs || Date.now());
          }
        } catch (_error) {
        }
      }
    }

    let existingProfilePublicKey = null;
    if (firestore) {
      try {
        const profileSnap = await firestore.collection(PROFILE_COLLECTION).doc(user.uid).get();
        if (profileSnap.exists) {
          const profileData = profileSnap.data() || {};
          existingProfilePublicKey = profileData.chatPublicKeyJwk || null;
        }
      } catch (_error) {
      }
    }

    if (!identity) {
      if (existingProfilePublicKey) {
        const hasChats = await userHasAnyChats(user, firestore);
        if (hasChats) {
          setKeySyncStatus("Missing key on this device", "error");
          throw new Error("This device is missing your chat key. Open chat on a linked device to sync your key backup.");
        }
      }
      identity = await generateIdentity();
      persistIdentityLocally(user.uid, identity);
      setKeySyncStatus("Preparing backup...", "pending");
    }

    state.identity = {
      uid: user.uid,
      ...identity
    };

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

      try {
        await syncIdentityBackup(user, firestore, identity);
      } catch (_error) {
        setKeySyncStatus("Backup sync failed", "warn", state.keySyncLastSyncedMs);
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
    let raw;
    try {
      raw = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        identity.privateKey,
        encryptedBytes
      );
    } catch (_error) {
      const recoveredIdentity = await replaceIdentityFromBackup(user, firestore);
      if (!recoveredIdentity) {
        setKeySyncStatus("Key unavailable on this device", "error", state.keySyncLastSyncedMs);
        throw new Error("Could not decrypt conversation key on this device. Open chat on a linked device to sync keys.");
      }
      try {
        raw = await crypto.subtle.decrypt(
          { name: "RSA-OAEP" },
          recoveredIdentity.privateKey,
          encryptedBytes
        );
      } catch (_retryError) {
        setKeySyncStatus("Key unavailable on this device", "error", state.keySyncLastSyncedMs);
        throw new Error("Could not decrypt conversation key on this device. Open chat on a linked device to sync keys.");
      }
    }

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
    if (isBlockedUid(otherProfile.uid)) {
      throw new Error("Unblock this user before creating a DM.");
    }
    if (await hasUserBlockedMe(otherProfile.uid)) {
      throw new Error("This user has blocked you.");
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
      throw new Error("That user has not opened chat yet.");
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
      if (isBlockedUid(friend.uid)) {
        throw new Error(`Unblock this user before adding: ${normalized}`);
      }
      if (await hasUserBlockedMe(friend.uid)) {
        throw new Error(`This user has blocked you: ${normalized}`);
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
        throw new Error(`User has not opened chat yet: ${profile.username}`);
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
      const preview = decryptFailed ? null : payload.linkPreview || null;

      rows.push({
        preview,
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

  function resetKeySyncStatus() {
    state.keySyncLabel = "Checking...";
    state.keySyncType = "pending";
    state.keySyncLastSyncedMs = 0;
    renderKeySyncStatus();
  }

  function setKeySyncStatus(label, type, lastSyncedMs) {
    state.keySyncLabel = String(label || "Checking...");
    const cleanType = String(type || "pending");
    state.keySyncType = ["ok", "warn", "error", "pending"].includes(cleanType) ? cleanType : "pending";
    if (typeof lastSyncedMs !== "undefined") {
      const parsed = Number(lastSyncedMs);
      state.keySyncLastSyncedMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    renderKeySyncStatus();
  }

  function renderKeySyncStatus() {
    const labelNode = state.root ? state.root.querySelector("#nebula-chat-keysync-label") : null;
    const lastNode = state.root ? state.root.querySelector("#nebula-chat-keysync-last") : null;
    if (!labelNode || !lastNode) {
      return;
    }
    labelNode.textContent = state.keySyncLabel;
    labelNode.classList.remove("ok", "warn", "error", "pending");
    labelNode.classList.add(state.keySyncType || "pending");
    lastNode.textContent = `Last synced: ${formatDateTime(state.keySyncLastSyncedMs)}`;
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
    state.linkPreview = null;
    resetComposeMentionState();
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
      main.innerHTML = `<div class="nebula-chat-main-empty">Pick a conversation from the left to view messages.</div>`;
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
          <div id="nebula-chat-link-preview" class="nebula-chat-link-preview hidden"></div>
          <div id="nebula-chat-compose-mentions" class="nebula-chat-suggestions nebula-chat-compose-mentions hidden"></div>
          <form id="nebula-chat-compose-form" class="nebula-chat-compose">
            <textarea id="nebula-chat-compose-input" maxlength="4000" rows="3" placeholder="Send a message" autocomplete="off"></textarea>
            <div class="nebula-chat-compose-actions">
              <button type="button" id="nebula-chat-compose-preview">Preview</button>
              <button type="submit">Send</button>
              <p id="nebula-chat-throttle-timer" class="nebula-chat-throttle-timer hidden"></p>
            </div>
          </form>
        </div>
      </section>
    `;

    const form = main.querySelector("#nebula-chat-compose-form");
    const input = main.querySelector("#nebula-chat-compose-input");
    const previewBtn = main.querySelector("#nebula-chat-compose-preview");
    const mentionContainer = main.querySelector("#nebula-chat-compose-mentions");

    if (form && input) {
      input.addEventListener("input", () => {
        const nextValue = String(input.value || "");
        updateLinkPreviewForInput(nextValue);
        renderComposeMentionSuggestions(input, mentionContainer);
      });

      input.addEventListener("paste", (event) => {
        if (event && event.defaultPrevented) {
          return;
        }
        window.setTimeout(() => {
          const nextValue = String(input.value || "");
          updateLinkPreviewForInput(nextValue);
          renderComposeMentionSuggestions(input, mentionContainer);
        }, 0);
      });

      input.addEventListener("focus", () => {
        renderComposeMentionSuggestions(input, mentionContainer);
      });

      input.addEventListener("click", () => {
        renderComposeMentionSuggestions(input, mentionContainer);
      });

      input.addEventListener("keyup", (event) => {
        if (!event || ["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(String(event.key || ""))) {
          return;
        }
        renderComposeMentionSuggestions(input, mentionContainer);
      });

      input.addEventListener("blur", () => {
        window.setTimeout(() => hideComposeMentionSuggestions(mentionContainer), 120);
      });

      input.addEventListener("keydown", (event) => {
        if (handleComposeMentionKeydown(event, input, mentionContainer)) {
          return;
        }
        if (
          event.key === "Enter"
          && !event.shiftKey
          && !event.ctrlKey
          && !event.metaKey
          && !event.altKey
          && !event.isComposing
        ) {
          event.preventDefault();
          if (typeof form.requestSubmit === "function") {
            form.requestSubmit();
          }
        }
      });

      if (previewBtn) {
        previewBtn.addEventListener("click", () => {
          const text = String(input.value || "");
          if (!text.trim()) {
            openModal("Markdown Preview", '<p class="nebula-chat-modal-copy">Nothing to preview yet.</p>');
            return;
          }
          openModal("Markdown Preview", `<div class="nebula-chat-markdown-preview nebula-chat-bubble-markdown">${renderMarkdown(text)}</div>`);
        });
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = String(input.value || "").trim();
        if (!text || !state.selectedChatId) {
          return;
        }

        if (isSendThrottled()) {
          showSlowDownModal();
          renderSendThrottleTimer();
          return;
        }

        const selectedChat = state.selectedChat || null;
        const participantIds = selectedChat && Array.isArray(selectedChat.participants)
          ? selectedChat.participants.map((value) => String(value || "")).filter(Boolean)
          : [];
        const otherParticipantIds = participantIds.filter((uid) => uid !== state.user.uid);
        if (otherParticipantIds.some((uid) => isBlockedUid(uid))) {
          setStatus("Unblock this user before sending messages.", "error");
          return;
        }
        for (const uid of otherParticipantIds) {
          if (await hasUserBlockedMe(uid)) {
            setStatus("This user has blocked you.", "error");
            return;
          }
        }

        const payload = {
          text,
          replyToMessageId: state.pendingReply && state.pendingReply.id ? state.pendingReply.id : "",
          linkPreview: state.linkPreview ? { ...state.linkPreview } : null
        };

        input.disabled = true;
        try {
          const encrypted = await encryptPayload(state.selectedChatId, payload);
          await sendMessageWithRateLimit(state.selectedChatId, encrypted, text);

          input.value = "";
          dismissReplyComposer();
          clearLinkPreview();
          hideComposeMentionSuggestions(mentionContainer);
        } catch (error) {
          await syncSendThrottleFromServer(state.selectedChatId);
          if (isSendThrottled()) {
            showSlowDownModal();
          }
          setStatus(error && error.message ? error.message : "Could not send message.", "error");
        } finally {
          input.disabled = false;
          input.focus();
        }
      });
    }

    syncSendThrottleFromServer(state.selectedChatId).catch(() => {});

    renderReplyChip();
    renderLinkPreview();
    renderSendThrottleTimer();
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
          ? `<div class="nebula-chat-inline-reply"><strong>${escapeHtml(reply.senderUsername)}</strong><span>${escapeHtml(truncate(markdownToPlainText(reply.text), CHAT_PREVIEW_LIMIT))}</span></div>`
          : "";
        const preview = row.preview || null;
        const previewHtml = preview
          ? `<div class="nebula-chat-link-preview-card">
               <a href="${escapeHtml(preview.url)}" target="_blank" rel="noreferrer noopener">
                 ${preview.type === "image" && preview.image ? `<img src="${escapeHtml(preview.image)}" alt="${escapeHtml(preview.title || preview.url)}" />` : ""}
                 ${preview.type === "video" && preview.video ? `<video src="${escapeHtml(preview.video)}" controls preload="metadata"></video>` : ""}
                 ${preview.type === "link" ? `<div class="nebula-chat-link-preview-body"><strong>${escapeHtml(preview.title || preview.url)}</strong><p>${escapeHtml(preview.description || preview.url)}</p></div>` : ""}
               </a>
             </div>`
          : "";

        return `
          <article class="nebula-chat-bubble${mineClass}" data-message-id="${escapeHtml(row.id)}">
            ${showMeta ? `<div class="nebula-chat-bubble-meta"><strong>${escapeHtml(row.senderUsername)}</strong><span>${escapeHtml(formatTime(row.chainAtMs) + edited)}</span></div>` : ""}
            ${replyHtml}
            ${previewHtml}
            <div class="nebula-chat-bubble-markdown">${renderMarkdown(row.text)}</div>
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
    const blockedNode = document.getElementById("nebula-chat-friends-blocked");
    if (friendsNode) {
      friendsNode.innerHTML = state.friends.length
        ? state.friends
            .slice()
            .sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")))
            .map((friend) => `
              <li>
                <span>${escapeHtml(friend.username)}</span>
                <div>
                  <button type="button" data-friend-remove="${escapeHtml(friend.uid)}">Remove</button>
                  <button type="button" data-friend-block="${escapeHtml(friend.uid)}">Block</button>
                </div>
              </li>
            `)
            .join("")
        : '<li class="nebula-chat-friends-empty">No friends yet.</li>';

      friendsNode.querySelectorAll("button[data-friend-remove]").forEach((node) => {
        node.addEventListener("click", async () => {
          const uid = String(node.getAttribute("data-friend-remove") || "");
          await removeFriend(uid);
          renderFriendsModalContent();
        });
      });

      friendsNode.querySelectorAll("button[data-friend-block]").forEach((node) => {
        node.addEventListener("click", async () => {
          const uid = String(node.getAttribute("data-friend-block") || "");
          await blockFriend(uid);
          renderFriendsModalContent();
        });
      });
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
    if (blockedNode) {
      blockedNode.innerHTML = state.blockedUsers.length
        ? state.blockedUsers
            .slice()
            .sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")))
            .map((entry) => `
              <li>
                <span>${escapeHtml(entry.username || "Unknown")}</span>
                <button type="button" data-friend-unblock="${escapeHtml(entry.uid)}">Unblock</button>
              </li>
            `)
            .join("")
        : '<li class="nebula-chat-friends-empty">No blocked users.</li>';

      blockedNode.querySelectorAll("button[data-friend-unblock]").forEach((node) => {
        node.addEventListener("click", async () => {
          const uid = String(node.getAttribute("data-friend-unblock") || "");
          await unblockUser(uid);
          renderFriendsModalContent();
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
    if (isBlockedUid(profile.uid)) {
      throw new Error("Unblock this user before sending a friend request.");
    }
    if (await hasUserBlockedMe(profile.uid)) {
      throw new Error("This user has blocked you.");
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
    if (isBlockedUid(request.fromUid) || await hasUserBlockedMe(request.fromUid)) {
      setStatus("Cannot accept this request because one side has blocked the other.", "error");
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

  async function removeFriend(friendUid) {
    const user = state.user || currentUser();
    const firestore = db();
    const cleanFriendUid = String(friendUid || "").trim();
    if (!user || !firestore || !cleanFriendUid) {
      return;
    }

    const myRef = firestore.collection("users").doc(user.uid).collection("friends").doc(cleanFriendUid);
    const theirRef = firestore.collection("users").doc(cleanFriendUid).collection("friends").doc(user.uid);
    await Promise.all([
      myRef.delete().catch(() => null),
      theirRef.delete().catch(() => null)
    ]);

    setStatus("Friend removed.", "ok");
  }

  async function blockFriend(friendUid) {
    const user = state.user || currentUser();
    const firestore = db();
    const cleanFriendUid = String(friendUid || "").trim();
    if (!user || !firestore || !cleanFriendUid) {
      return;
    }

    let targetProfile = await getProfileByUid(cleanFriendUid);
    if (!targetProfile) {
      const friend = state.friends.find((item) => String(item.uid || "") === cleanFriendUid) || null;
      targetProfile = {
        uid: cleanFriendUid,
        username: friend ? String(friend.username || "Unknown") : "Unknown"
      };
    }

    await firestore
      .collection("users")
      .doc(user.uid)
      .collection(BLOCKED_USERS_SUBCOLLECTION)
      .doc(cleanFriendUid)
      .set({
        uid: cleanFriendUid,
        username: String(targetProfile.username || "Unknown"),
        usernameLower: normalizeUsername(targetProfile.username || "unknown"),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    await removeFriend(cleanFriendUid);

    const requestsToCancel = state.incomingFriendRequests
      .concat(state.outgoingFriendRequests)
      .filter((request) => String(request.fromUid || "") === cleanFriendUid || String(request.toUid || "") === cleanFriendUid)
      .map((request) => firestore.collection(FRIEND_REQUESTS_COLLECTION).doc(request.id).update({
        status: "canceled",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(() => null));

    if (requestsToCancel.length) {
      await Promise.all(requestsToCancel);
    }

    setStatus("User blocked.", "ok");
  }

  async function unblockUser(friendUid) {
    const user = state.user || currentUser();
    const firestore = db();
    const cleanFriendUid = String(friendUid || "").trim();
    if (!user || !firestore || !cleanFriendUid) {
      return;
    }
    await firestore
      .collection("users")
      .doc(user.uid)
      .collection(BLOCKED_USERS_SUBCOLLECTION)
      .doc(cleanFriendUid)
      .delete()
      .catch(() => null);
    setStatus("User unblocked.", "ok");
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
          <section>
            <h4>Blocked Users</h4>
            <ul id="nebula-chat-friends-blocked" class="nebula-chat-friends-list"></ul>
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
    if (state.blockedUsersUnsub) {
      state.blockedUsersUnsub();
      state.blockedUsersUnsub = null;
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
      state.blockedUsers = [];
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

    state.blockedUsersUnsub = firestore
      .collection("users")
      .doc(user.uid)
      .collection(BLOCKED_USERS_SUBCOLLECTION)
      .onSnapshot((snap) => {
        state.blockedUsers = snap.docs.map((doc) => ({
          uid: String(doc.id),
          ...(doc.data() || {})
        }));
        renderDmSuggestions();
        renderGcSuggestions();
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
    const composeSuggestions = state.root.querySelector("#nebula-chat-compose-mentions");
    const composeInput = state.root.querySelector("#nebula-chat-compose-input");
    if (dmSuggestions && (!event.target || !dmSuggestions.contains(event.target))) {
      dmSuggestions.classList.add("hidden");
    }
    if (gcSuggestions && (!event.target || !gcSuggestions.contains(event.target))) {
      gcSuggestions.classList.add("hidden");
    }
    if (
      composeSuggestions
      && (!event.target || !composeSuggestions.contains(event.target))
      && (!composeInput || !composeInput.contains(event.target))
    ) {
      hideComposeMentionSuggestions(composeSuggestions);
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
      const composeSuggestions = state.root ? state.root.querySelector("#nebula-chat-compose-mentions") : null;
      hideComposeMentionSuggestions(composeSuggestions);
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
            <div class="nebula-chat-keysync">
              <div class="nebula-chat-keysync-head">
                <span>Key Sync</span>
                <strong id="nebula-chat-keysync-label" class="pending">Checking...</strong>
              </div>
              <p id="nebula-chat-keysync-last">Last synced: never</p>
            </div>
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
    resetKeySyncStatus();
    renderStatus();
    try {
      await ensureIdentity(user);
    } catch (error) {
      setStatus(error && error.message ? error.message : "Profile sync is unavailable. Chat UI is loaded.", "error");
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
    state.root.innerHTML = `<div class="nebula-chat-main-empty">Loading chat...</div>`;

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
      if (state.blockedUsersUnsub) {
        state.blockedUsersUnsub();
        state.blockedUsersUnsub = null;
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
      state.linkPreview = null;
      state.composeMentionContext = null;
      state.composeMentionItems = [];
      state.composeMentionIndex = 0;
      stopSendThrottleTimer();
      state.sendThrottleUntilMs = 0;
      state.chatAesKeys.clear();
      state.memberCache.clear();
      state.identity = null;
      state.friends = [];
      state.blockedUsers = [];
      state.incomingFriendRequests = [];
      state.outgoingFriendRequests = [];
      state.keySyncLabel = "Checking...";
      state.keySyncType = "pending";
      state.keySyncLastSyncedMs = 0;
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
    if (state.blockedUsersUnsub) {
      state.blockedUsersUnsub();
      state.blockedUsersUnsub = null;
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
    state.identity = null;
    state.chats = [];
    state.selectedChatId = "";
    state.selectedChat = null;
    state.messageRows = [];
    state.pendingReply = null;
    state.linkPreview = null;
    state.composeMentionContext = null;
    state.composeMentionItems = [];
    state.composeMentionIndex = 0;
    stopSendThrottleTimer();
    state.sendThrottleUntilMs = 0;
    state.chatAesKeys.clear();
    state.memberCache.clear();
    state.friends = [];
    state.blockedUsers = [];
    state.incomingFriendRequests = [];
    state.outgoingFriendRequests = [];
    state.activeMenuMessageId = "";
    state.statusText = "";
    state.statusType = "";
    state.keySyncLabel = "Checking...";
    state.keySyncType = "pending";
    state.keySyncLastSyncedMs = 0;
  }

  initNotificationWatchers();

  window.NebulaPrivateChat = {
    mount,
    unmount
  };
})();