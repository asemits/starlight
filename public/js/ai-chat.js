(function () {
  const AI_STORE_KEY = "nebula-ai-store-v1";
  const AI_CLOUD_SYNC_KEY = "nebula-sync-ai-conversations";
  const AI_CUSTOM_INSTRUCTIONS_KEY = "nebula-ai-custom-instructions";
  const AI_SERVER_BASE_KEY = "nebula-ai-server-base";
  const AI_DIRECT_MODE_KEY = "nebula-ai-direct-mode";
  const AI_GEMINI_MODEL_KEY = "nebula-ai-model";
  const AI_GEMINI_CONTEXT_LIMIT_KEY = "nebula-ai-context-limit";
  const AI_QUOTA_KEY = "nebula-ai-quota-v1";
  const AI_GEMINI_MODEL_DEFAULT = "gemini-2.5-flash";
  const AI_GEMINI_TUNNEL_URL = "https://script.google.com/macros/s/AKfycbyUwrz4n6d58QHC1cnqzrX-c24KhnkRvNLjMbVc-9TDmE2R6kcr5WALWtjIRDGN3at32w/exec";
  const AI_CONVERSATION_LIMIT = 60;
  const AI_MESSAGE_LIMIT = 120;
  const AI_CONTEXT_LIMIT_DEFAULT = 30;
  const AI_UPLOAD_LIMIT = 4;
  const AI_UPLOAD_MAX_BYTES = 1500000;

  const state = {
    mounted: false,
    rootSelector: "",
    root: null,
    store: {
      activeConversationId: "",
      conversations: []
    },
    pendingAttachments: [],
    busy: false,
    quota: {
      limit: 100,
      used: 0,
      remaining: 100,
      dayKey: ""
    },
    statusText: "",
    statusOk: true,
    modalClose: null
  };

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function randomId(prefix) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const text = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${prefix}-${text}`;
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, parsed));
  }

  function nowMs() {
    return Date.now();
  }

  function decodeHtmlEntities(value) {
    const node = document.createElement("textarea");
    node.innerHTML = String(value || "");
    return node.value;
  }

  function normalizePreview(text) {
    const plain = String(text || "").replace(/\s+/g, " ").trim();
    if (!plain) {
      return "";
    }
    return plain.length <= 140 ? plain : `${plain.slice(0, 139)}…`;
  }

  function autoTitle(text) {
    const plain = normalizePreview(text);
    if (!plain) {
      return "New conversation";
    }
    return plain.length <= 52 ? plain : `${plain.slice(0, 51)}…`;
  }

  function normalizeAttachment(item) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const id = String(item.id || randomId("att"));
    const name = String(item.name || "file").trim().slice(0, 140);
    const mimeType = String(item.mimeType || "application/octet-stream").trim().slice(0, 120);
    const kind = String(item.kind || "text").toLowerCase() === "image" ? "image" : "text";
    const size = clampNumber(item.size, 0, AI_UPLOAD_MAX_BYTES, 0);
    if (kind === "image") {
      const base64 = String(item.base64 || "").trim();
      if (!base64) {
        return { id, name, mimeType, kind, size };
      }
      return { id, name, mimeType, kind, size, base64 };
    }
    const text = String(item.text || "").slice(0, 220000);
    return { id, name, mimeType, kind, size, text };
  }

  function storageSafeAttachment(item) {
    const attachment = normalizeAttachment(item);
    if (!attachment) {
      return null;
    }
    if (attachment.kind === "image") {
      const imageAttachment = {
        id: attachment.id,
        name: attachment.name,
        mimeType: attachment.mimeType,
        kind: "image",
        size: attachment.size
      };
      if (attachment.base64) {
        imageAttachment.base64 = String(attachment.base64);
      }
      return imageAttachment;
    }
    return {
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      kind: "text",
      size: attachment.size,
      text: String(attachment.text || "").slice(0, 12000)
    };
  }

  function storageSafeMessage(item) {
    const message = normalizeMessage(item);
    if (!message) {
      return null;
    }
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      attachments: Array.isArray(message.attachments)
        ? message.attachments.map(storageSafeAttachment).filter(Boolean).slice(0, AI_UPLOAD_LIMIT)
        : []
    };
  }

  function normalizeMessage(item) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const role = String(item.role || "user").toLowerCase() === "assistant" ? "assistant" : "user";
    const content = String(item.content || "").slice(0, 120000);
    const id = String(item.id || randomId("msg"));
    const createdAt = clampNumber(item.createdAt, 0, Number.MAX_SAFE_INTEGER, nowMs());
    const attachments = Array.isArray(item.attachments)
      ? item.attachments.map(normalizeAttachment).filter(Boolean).slice(0, AI_UPLOAD_LIMIT)
      : [];
    return {
      id,
      role,
      content,
      attachments,
      createdAt
    };
  }

  function normalizeConversation(item) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const id = String(item.id || randomId("conv")).trim();
    if (!id) {
      return null;
    }
    const createdAt = clampNumber(item.createdAt, 0, Number.MAX_SAFE_INTEGER, nowMs());
    const updatedAt = clampNumber(item.updatedAt, 0, Number.MAX_SAFE_INTEGER, createdAt);
    const messages = Array.isArray(item.messages)
      ? item.messages.map(normalizeMessage).filter(Boolean).slice(-AI_MESSAGE_LIMIT)
      : [];
    const title = String(item.title || "").trim().slice(0, 120) || autoTitle(messages[0] ? messages[0].content : "");
    const lastPreview = String(item.lastPreview || normalizePreview(messages[messages.length - 1] ? messages[messages.length - 1].content : "")).slice(0, 220);
    const messageCount = clampNumber(item.messageCount, 0, 10000, messages.length);
    return {
      id,
      title,
      createdAt,
      updatedAt,
      messageCount,
      lastPreview,
      messages
    };
  }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(AI_STORE_KEY) || "{}");
      const conversations = Array.isArray(parsed.conversations)
        ? parsed.conversations.map(normalizeConversation).filter(Boolean).slice(0, AI_CONVERSATION_LIMIT)
        : [];
      const activeConversationId = String(parsed.activeConversationId || "");
      return {
        activeConversationId,
        conversations
      };
    } catch (_error) {
      return {
        activeConversationId: "",
        conversations: []
      };
    }
  }

  function writeStore() {
    const payload = {
      activeConversationId: state.store.activeConversationId,
      conversations: state.store.conversations.slice(0, AI_CONVERSATION_LIMIT).map((conversation) => {
        return {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messageCount: conversation.messageCount,
          lastPreview: conversation.lastPreview,
          messages: conversation.messages.slice(-AI_MESSAGE_LIMIT).map(storageSafeMessage).filter(Boolean)
        };
      })
    };
    try {
      localStorage.setItem(AI_STORE_KEY, JSON.stringify(payload));
    } catch (_error) {
      if (state.mounted) {
        setStatus("Local AI history is full. Older messages may not be saved.", false);
      }
    }
  }

  function cloudSyncEnabled() {
    return localStorage.getItem(AI_CLOUD_SYNC_KEY) === "off" ? false : true;
  }

  function getServerBase() {
    const raw = String(localStorage.getItem(AI_SERVER_BASE_KEY) || "").trim();
    if (!raw) {
      return window.location.origin;
    }
    return raw.replace(/\/+$/g, "");
  }

  function directModeEnabled() {
    const raw = String(localStorage.getItem(AI_DIRECT_MODE_KEY) || "").trim().toLowerCase();
    if (raw === "off" || raw === "false" || raw === "0") {
      return false;
    }
    if (raw === "on" || raw === "true" || raw === "1") {
      return true;
    }
    return true;
  }

  function cloudApiEnabled() {
    return cloudSyncEnabled() && !directModeEnabled();
  }

  function getCurrentModel() {
    const stored = String(localStorage.getItem(AI_GEMINI_MODEL_KEY) || "").trim();
    if (stored === "gemini-2.5-flash-lite" || stored === "gemini-2.5-flash") {
      return stored;
    }
    return AI_GEMINI_MODEL_DEFAULT;
  }

  function setCurrentModel(model) {
    const valid = model === "gemini-2.5-flash-lite" ? "gemini-2.5-flash-lite" : "gemini-2.5-flash";
    localStorage.setItem(AI_GEMINI_MODEL_KEY, valid);
  }

  function getContextLimit() {
    const stored = Number.parseInt(String(localStorage.getItem(AI_GEMINI_CONTEXT_LIMIT_KEY) || ""), 10);
    if (Number.isFinite(stored) && stored >= 1 && stored <= 100) {
      return stored;
    }
    return AI_CONTEXT_LIMIT_DEFAULT;
  }

  function setContextLimit(limit) {
    const valid = clampNumber(limit, 1, 100, AI_CONTEXT_LIMIT_DEFAULT);
    localStorage.setItem(AI_GEMINI_CONTEXT_LIMIT_KEY, String(valid));
  }

  function getTodayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function readQuotaStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(AI_QUOTA_KEY) || "{}");
      const today = getTodayKey();
      const dayKey = String(parsed.dayKey || "");
      if (dayKey !== today) {
        return {
          limit: 100,
          used: 0,
          remaining: 100,
          dayKey: today
        };
      }
      return {
        limit: clampNumber(parsed.limit, 1, 100000, 100),
        used: clampNumber(parsed.used, 0, 100000, 0),
        remaining: clampNumber(parsed.remaining, 0, 100000, 100),
        dayKey: today
      };
    } catch (_error) {
      return {
        limit: 100,
        used: 0,
        remaining: 100,
        dayKey: getTodayKey()
      };
    }
  }

  function writeQuotaStore() {
    try {
      localStorage.setItem(AI_QUOTA_KEY, JSON.stringify(state.quota));
    } catch (_error) {
    }
  }

  function decrementQuota() {
    if (state.quota.remaining > 0) {
      state.quota.remaining = Math.max(0, state.quota.remaining - 1);
      state.quota.used = Math.min(state.quota.limit, state.quota.used + 1);
      writeQuotaStore();
    }
  }


  function isQuotaErrorPayload(httpStatus, payload) {
    if (httpStatus === 429) {
      return true;
    }
    const errorObject = payload && payload.error ? payload.error : payload;
    const codeText = String(errorObject && (errorObject.status || errorObject.code || "") || "").toUpperCase();
    const message = String(errorObject && errorObject.message || "").toLowerCase();
    return codeText.includes("RESOURCE_EXHAUSTED")
      || codeText.includes("RATE_LIMIT")
      || message.includes("quota")
      || message.includes("rate limit")
      || message.includes("resource exhausted");
  }

  function composeGeminiContents(messages) {
    const output = [];
    const list = Array.isArray(messages) ? messages : [];
    list.forEach((message) => {
      if (!message || typeof message !== "object") {
        return;
      }
      const parts = [];
      const text = String(message.content || "");
      if (text.trim()) {
        parts.push({ text });
      }
      const attachments = Array.isArray(message.attachments) ? message.attachments : [];
      attachments.forEach((attachment) => {
        const normalized = normalizeAttachment(attachment);
        if (!normalized) {
          return;
        }
        if (normalized.kind === "image" && normalized.base64) {
          parts.push({
            inline_data: {
              mime_type: normalized.mimeType || "image/png",
              data: normalized.base64
            }
          });
          return;
        }
        if (normalized.kind === "text" && normalized.text) {
          parts.push({ text: `[${normalized.name}]\n${String(normalized.text || "").slice(0, 180000)}` });
        }
      });
      if (!parts.length) {
        return;
      }
      output.push({
        role: message.role === "assistant" ? "model" : "user",
        parts
      });
    });
    return output;
  }

  async function requestGeminiWithRotation(payload) {
    const contents = composeGeminiContents(payload && payload.messages ? payload.messages : []);
    if (!contents.length) {
      throw new Error("No valid message content to send.");
    }

    const customInstructions = String(payload && payload.customInstructions ? payload.customInstructions : "").trim();
    const requestBody = {
      model: getCurrentModel(),
      contents,
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 8192
      }
    };
    if (customInstructions) {
      requestBody.systemInstruction = {
        parts: [{ text: customInstructions.slice(0, 4000) }]
      };
    }


    let response;
    let json;
    try {
      response = await fetch(AI_GEMINI_TUNNEL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(requestBody)
      });
      json = await response.json();
    } catch (_error) {
      throw new Error("Could not reach AI tunnel.");
    }

    if (!response.ok) {
      const apiMessage = String(json && json.error && json.error.message ? json.error.message : json && json.error ? json.error : "AI tunnel request failed.");
      throw new Error(apiMessage);
    }
    const candidates = Array.isArray(json && json.candidates) ? json.candidates : [];
    const first = candidates[0] || null;
    const parts = first && first.content && Array.isArray(first.content.parts) ? first.content.parts : [];
    const output = parts.map((part) => String(part && part.text ? part.text : "")).join("\n").trim();
    if (!output) {
      throw new Error("AI tunnel returned an empty response.");
    }
    return {
      assistantMessage: output,
      title: String(payload && payload.title ? payload.title : "")
    };
  }

  function getCustomInstructions() {
    return String(localStorage.getItem(AI_CUSTOM_INSTRUCTIONS_KEY) || "").slice(0, 4000);
  }

  function currentUser() {
    return window.nebulaAuth && window.nebulaAuth.currentUser ? window.nebulaAuth.currentUser : null;
  }

  async function getAuthToken() {
    const user = currentUser();
    if (!user || user.isAnonymous) {
      throw new Error("You must be logged in.");
    }
    return user.getIdToken();
  }

  async function apiRequest(path, options) {
    const token = await getAuthToken();
    const base = getServerBase();
    const url = `${base}${path}`;
    const response = await fetch(url, {
      method: options && options.method ? options.method : "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: options && options.body ? options.body : undefined
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    if (!response.ok) {
      const message = payload && payload.error ? String(payload.error) : `Request failed (${response.status}).`;
      throw new Error(message);
    }

    return payload || {};
  }

  function findConversation(conversationId) {
    return state.store.conversations.find((item) => item.id === conversationId) || null;
  }

  function activeConversation() {
    return findConversation(state.store.activeConversationId);
  }

  function ensureConversation(forceId) {
    const wantedId = String(forceId || "").trim();
    if (wantedId) {
      const existing = findConversation(wantedId);
      if (existing) {
        state.store.activeConversationId = existing.id;
        return existing;
      }
    }

    const current = activeConversation();
    if (current) {
      return current;
    }

    const createdAt = nowMs();
    const conversation = {
      id: wantedId || randomId("conv"),
      title: "New conversation",
      createdAt,
      updatedAt: createdAt,
      messageCount: 0,
      lastPreview: "",
      messages: []
    };
    state.store.conversations.unshift(conversation);
    state.store.conversations = state.store.conversations.slice(0, AI_CONVERSATION_LIMIT);
    state.store.activeConversationId = conversation.id;
    writeStore();
    return conversation;
  }

  function upsertConversation(input) {
    const normalized = normalizeConversation(input);
    if (!normalized) {
      return null;
    }
    const existingIndex = state.store.conversations.findIndex((item) => item.id === normalized.id);
    if (existingIndex >= 0) {
      const existing = state.store.conversations[existingIndex];
      const merged = {
        ...existing,
        ...normalized,
        messages: normalized.messages.length ? normalized.messages : existing.messages,
        updatedAt: Math.max(existing.updatedAt || 0, normalized.updatedAt || 0),
        messageCount: Math.max(normalized.messageCount || 0, normalized.messages.length || 0, existing.messageCount || 0)
      };
      state.store.conversations.splice(existingIndex, 1);
      state.store.conversations.unshift(merged);
      return merged;
    }
    state.store.conversations.unshift(normalized);
    state.store.conversations = state.store.conversations.slice(0, AI_CONVERSATION_LIMIT);
    return normalized;
  }

  function removeConversation(conversationId) {
    state.store.conversations = state.store.conversations.filter((item) => item.id !== conversationId);
    if (state.store.activeConversationId === conversationId) {
      state.store.activeConversationId = "";
      ensureConversation();
    }
    writeStore();
  }

  function setStatus(text, ok) {
    state.statusText = String(text || "");
    state.statusOk = ok !== false;
    const node = state.root ? state.root.querySelector("#nebula-ai-status") : null;
    if (!node) {
      return;
    }
    node.textContent = state.statusText;
    node.classList.toggle("ok", state.statusOk);
    node.classList.toggle("error", !state.statusOk);
  }

  function readQueryConversationId() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return String(params.get("conversation") || "").trim();
    } catch (_error) {
      return "";
    }
  }

  function setBusy(nextBusy) {
    state.busy = Boolean(nextBusy);
    if (!state.root) {
      return;
    }
    const sendButton = state.root.querySelector("#nebula-ai-send");
    const regenerateButton = state.root.querySelector("#nebula-ai-regenerate");
    const newButton = state.root.querySelector("#nebula-ai-new");
    if (sendButton) {
      sendButton.disabled = state.busy;
    }
    if (regenerateButton) {
      regenerateButton.disabled = state.busy;
    }
    if (newButton) {
      newButton.disabled = state.busy;
    }
  }

  function delayMs(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
    });
  }

  async function animateAssistantTyping(conversation, messageId, finalText) {
    const text = String(finalText || "");
    const message = conversation && Array.isArray(conversation.messages)
      ? conversation.messages.find((item) => item.id === messageId)
      : null;
    if (!message) {
      return;
    }

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || text.length < 60) {
      message.content = text;
      renderMessageList();
      return;
    }

    const tokens = text.match(/(\s+|[^\s]+)/g) || [text];
    const chunkSize = text.length > 1800 ? 6 : text.length > 1000 ? 4 : 2;
    const stepDelay = text.length > 1800 ? 10 : text.length > 1000 ? 14 : 18;

    message.content = "";
    renderMessageList();

    for (let i = 0; i < tokens.length; i += chunkSize) {
      if (!state.mounted || !state.root) {
        message.content = text;
        return;
      }
      message.content += tokens.slice(i, i + chunkSize).join("");
      renderMessageList();
      await delayMs(stepDelay);
    }

    message.content = text;
    renderMessageList();
  }

  function detectLanguage(code) {
    const sample = String(code || "").slice(0, 8000);
    if (!sample.trim()) {
      return "text";
    }
    if (/^\s*<([a-z]+)(\s|>)/i.test(sample) || /<\/(html|div|span|body|script|style)>/i.test(sample)) {
      return "html";
    }
    if (/^\s*\{[\s\S]*\}\s*$/.test(sample) && /"[^"]+"\s*:/.test(sample)) {
      return "json";
    }
    if (/\b(def|import|from|lambda|print|elif)\b/.test(sample) || /:\s*\n\s{2,}\w+/.test(sample)) {
      return "python";
    }
    if (/\b(function|const|let|var|=>|console\.log|document\.|window\.)\b/.test(sample)) {
      return "javascript";
    }
    if (/\b(interface|type|implements|enum|readonly)\b/.test(sample)) {
      return "typescript";
    }
    if (/\b(public|private|class|static|void|new)\b/.test(sample) && /;/.test(sample)) {
      return "java";
    }
    if (/\b(fn|let mut|impl|pub|use|match)\b/.test(sample)) {
      return "rust";
    }
    if (/\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i.test(sample)) {
      return "sql";
    }
    if (/^\s*#include\s+[<"][^>"]+[>"]/.test(sample) || /\bstd::/.test(sample)) {
      return "cpp";
    }
    if (/^\s*package\s+[a-z0-9_.-]+/im.test(sample) || /^\s*apiVersion:/m.test(sample)) {
      return "yaml";
    }
    return "text";
  }

  function normalizeLanguageLabel(raw, code) {
    const explicit = String(raw || "").trim().toLowerCase();
    const map = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      yml: "yaml",
      sh: "bash",
      md: "markdown",
      plaintext: "text",
      text: "text",
      csharp: "c#",
      cs: "c#",
      cplusplus: "cpp",
      html: "html",
      css: "css",
      json: "json",
      sql: "sql",
      go: "go",
      rust: "rust",
      java: "java",
      bash: "bash",
      shell: "bash"
    };
    if (explicit) {
      return map[explicit] || explicit;
    }
    return detectLanguage(code);
  }

  function markdownToken(pool, html) {
    const token = `\uE100${pool.length}\uE101`;
    pool.push(html);
    return token;
  }

  function markdownRestore(value, pool) {
    return String(value || "").replace(/\uE100(\d+)\uE101/g, (_match, indexText) => {
      const index = Number.parseInt(indexText, 10);
      if (!Number.isFinite(index) || index < 0 || index >= pool.length) {
        return "";
      }
      return pool[index];
    });
  }

  function markdownInline(value, tokenPool) {
    let output = String(value || "");

    output = output.replace(/`([^`\n]+)`/g, (_match, codeText) => {
      return markdownToken(tokenPool, `<code class="nebula-ai-inline-code">${codeText}</code>`);
    });

    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, rawUrl) => {
      const decoded = decodeHtmlEntities(rawUrl).trim();
      if (!decoded) {
        return `${label} (${rawUrl})`;
      }
      const withProtocol = /^www\./i.test(decoded) ? `https://${decoded}` : decoded;
      let href = "";
      try {
        const parsed = new URL(withProtocol);
        const protocol = String(parsed.protocol || "").toLowerCase();
        if (protocol === "http:" || protocol === "https:") {
          href = parsed.href;
        }
      } catch (_error) {
        href = "";
      }
      if (!href) {
        return `${label} (${rawUrl})`;
      }
      return markdownToken(tokenPool, `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${label}</a>`);
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

  function markdownBlocks(value, tokenPool) {
    const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    let inList = false;

    lines.forEach((line) => {
      const current = String(line || "");
      const listMatch = current.match(/^(\s*)([-*])\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          output.push('<ul class="nebula-ai-list">');
          inList = true;
        }
        const depth = Math.max(0, Math.min(4, Math.floor(String(listMatch[1] || "").length / 2)));
        output.push(`<li class="depth-${depth}">${markdownInline(listMatch[3], tokenPool)}</li>`);
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

      const heading = current.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        output.push(`<h${level}>${markdownInline(heading[2], tokenPool)}</h${level}>`);
        return;
      }

      const quote = current.match(/^>\s?(.*)$/);
      if (quote) {
        output.push(`<blockquote>${markdownInline(quote[1], tokenPool)}</blockquote>`);
        return;
      }

      output.push(`<p>${markdownInline(current, tokenPool)}</p>`);
    });

    if (inList) {
      output.push("</ul>");
    }

    return output.join("");
  }

  function splitCodeFences(text) {
    const source = String(text || "").replace(/\r\n?/g, "\n");
    const items = [];
    let cursor = 0;
    const regex = /```([^\n`]*)\n?([\s\S]*?)```/g;
    let match = regex.exec(source);
    while (match) {
      const start = match.index;
      if (start > cursor) {
        items.push({ type: "text", value: source.slice(cursor, start) });
      }
      items.push({ type: "code", language: String(match[1] || ""), code: String(match[2] || "") });
      cursor = regex.lastIndex;
      match = regex.exec(source);
    }
    if (cursor < source.length) {
      items.push({ type: "text", value: source.slice(cursor) });
    }
    return items;
  }

  function renderMarkdown(value) {
    const segments = splitCodeFences(String(value || ""));
    const output = [];

    segments.forEach((segment) => {
      if (segment.type === "code") {
        const language = normalizeLanguageLabel(segment.language, segment.code);
        const label = escapeHtml(language.toUpperCase());
        const codeHtml = escapeHtml(segment.code);
        output.push(`
          <div class="nebula-ai-codeblock">
            <div class="nebula-ai-codeblock-head">
              <span>${label}</span>
              <button type="button" class="nebula-ai-copy-code" data-copy-code="1">Copy</button>
            </div>
            <pre><code data-language="${escapeHtml(language)}">${codeHtml}</code></pre>
          </div>
        `);
        return;
      }

      const tokenPool = [];
      let safe = escapeHtml(segment.value || "");
      safe = safe.replace(/\\([\\`*_~\[\]()>#-])/g, (_match, escapedChar) => {
        return markdownToken(tokenPool, escapedChar);
      });
      output.push(markdownRestore(markdownBlocks(safe, tokenPool), tokenPool));
    });

    return output.join("");
  }

  function plainText(value) {
    return String(value || "")
      .replace(/```([\s\S]*?)```/g, "$1")
      .replace(/`([^`\n]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/__\*\*([\s\S]+?)\*\*__/g, "$1")
      .replace(/__\*([\s\S]+?)\*__/g, "$1")
      .replace(/__([^_\n]+?)__/g, "$1")
      .replace(/\*\*([^*\n]+?)\*\*/g, "$1")
      .replace(/~~([^~\n]+?)~~/g, "$1")
      .replace(/\*([^*\n]+?)\*/g, "$1")
      .replace(/_([^_\n]+?)_/g, "$1")
      .replace(/^\s*>+\s?/gm, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/^\s*#{1,4}\s+/gm, "")
      .replace(/\\([\\`*_~\[\]()>#-])/g, "$1")
      .trim();
  }

  function renderConversationList() {
    if (!state.root) {
      return;
    }
    const container = state.root.querySelector("#nebula-ai-conversation-list");
    if (!container) {
      return;
    }

    if (!state.store.conversations.length) {
      container.innerHTML = '<p class="nebula-ai-empty-sidebar">No conversations yet.</p>';
      return;
    }

    container.innerHTML = state.store.conversations.map((conversation) => {
      const active = conversation.id === state.store.activeConversationId;
      const dateText = new Date(conversation.updatedAt || conversation.createdAt || nowMs()).toLocaleString();
      const preview = escapeHtml(conversation.lastPreview || "No messages yet.");
      return `
        <article class="nebula-ai-conversation-card ${active ? "active" : ""}" data-conversation-id="${escapeHtml(conversation.id)}">
          <button type="button" class="nebula-ai-conversation-main" data-conversation-open="${escapeHtml(conversation.id)}">
            <h3>${escapeHtml(conversation.title || "Untitled")}</h3>
            <p>${preview}</p>
            <span>${escapeHtml(dateText)}</span>
          </button>
          <div class="nebula-ai-conversation-actions">
            <button type="button" aria-label="Rename conversation" data-conversation-rename="${escapeHtml(conversation.id)}"><i class="fa-solid fa-pen"></i></button>
            <button type="button" aria-label="Delete conversation" data-conversation-delete="${escapeHtml(conversation.id)}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderPendingAttachments() {
    if (!state.root) {
      return;
    }
    const strip = state.root.querySelector("#nebula-ai-attachment-strip");
    if (!strip) {
      return;
    }

    if (!state.pendingAttachments.length) {
      strip.innerHTML = "";
      strip.classList.add("hidden");
      return;
    }

    strip.classList.remove("hidden");
    strip.innerHTML = state.pendingAttachments.map((attachment) => {
      if (attachment.kind === "image" && attachment.base64) {
        const dataUrl = `data:${attachment.mimeType};base64,${attachment.base64}`;
        return `
          <div class="nebula-ai-attachment-chip nebula-ai-image-chip">
            <img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(attachment.name)}" />
            <span>${escapeHtml(attachment.name)}</span>
            <button type="button" aria-label="Remove upload" data-remove-upload="${escapeHtml(attachment.id)}"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `;
      }
      return `
        <div class="nebula-ai-attachment-chip">
          <span>${escapeHtml(attachment.name)}</span>
          <button type="button" aria-label="Remove upload" data-remove-upload="${escapeHtml(attachment.id)}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
    }).join("");
  }

  function renderQuotaPanel() {
    if (!state.root) {
      return;
    }
    const remainingNode = state.root.querySelector("#nebula-ai-quota-remaining");
    const usedNode = state.root.querySelector("#nebula-ai-quota-used");
    const barNode = state.root.querySelector("#nebula-ai-quota-bar");
    const syncNode = state.root.querySelector("#nebula-ai-sync-label");

    if (remainingNode) {
      remainingNode.textContent = String(state.quota.remaining);
    }
    if (usedNode) {
      usedNode.textContent = String(state.quota.used);
    }
    if (barNode) {
      const usedPercent = state.quota.limit > 0 ? Math.max(0, Math.min(100, (state.quota.used / state.quota.limit) * 100)) : 0;
      barNode.style.width = `${usedPercent}%`;
    }
    if (syncNode) {
      syncNode.textContent = cloudSyncEnabled() ? "Cloud Sync: On" : "Cloud Sync: Off";
    }
  }

  function renderMessageList() {
    if (!state.root) {
      return;
    }
    const list = state.root.querySelector("#nebula-ai-messages");
    if (!list) {
      return;
    }

    const conversation = ensureConversation();
    if (!conversation.messages.length) {
      list.innerHTML = `
        <article class="nebula-ai-empty-state">
          <h2>Start chatting with Gemini 2.5 Flash</h2>
          <p>Markdown, code blocks with language labels, uploads, regenerate, and cloud-synced history are ready.</p>
        </article>
      `;
      return;
    }

    list.innerHTML = conversation.messages.map((message) => {
      const roleClass = message.role === "assistant" ? "assistant" : "user";
      const timeText = new Date(message.createdAt || nowMs()).toLocaleTimeString();
      const attachmentsHtml = message.attachments && message.attachments.length
        ? `<div class="nebula-ai-message-attachments">${message.attachments.map((attachment) => {
            if (attachment.kind === "image" && attachment.base64) {
              const dataUrl = `data:${attachment.mimeType};base64,${attachment.base64}`;
              return `<img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(attachment.name)}" title="${escapeHtml(attachment.name)}" />`;
            }
            return `<span>${escapeHtml(attachment.name)}</span>`;
          }).join("")}</div>`
        : "";
      const contentHtml = message.role === "assistant"
        ? `<div class="nebula-ai-markdown">${renderMarkdown(message.content)}</div>`
        : `<p>${escapeHtml(message.content || "")}</p>`;
      return `
        <article class="nebula-ai-message ${roleClass}" data-message-id="${escapeHtml(message.id)}">
          <header>
            <span>${message.role === "assistant" ? "Assistant" : "You"}</span>
            <div class="nebula-ai-message-head-actions">
              <time>${escapeHtml(timeText)}</time>
              <button type="button" data-copy-message="${escapeHtml(message.id)}">Copy</button>
            </div>
          </header>
          ${attachmentsHtml}
          <div class="nebula-ai-message-body">${contentHtml}</div>
        </article>
      `;
    }).join("");

    list.scrollTop = list.scrollHeight;
  }

  function render() {
    if (!state.root) {
      return;
    }

    state.root.innerHTML = `
            <style>
              .nebula-ai-header-controls { display: flex; gap: 8px; align-items: center; }
              .nebula-ai-control { padding: 6px 10px; border: 1px solid #444; border-radius: 4px; background: #222; color: #fff; font-size: 14px; }
              .nebula-ai-control:focus { outline: none; border-color: #666; }
            </style>
      <section class="nebula-ai-shell">
        <aside class="nebula-ai-sidebar">
          <div class="nebula-ai-sidebar-top">
            <button id="nebula-ai-new" type="button" class="nebula-btn nebula-btn-primary">New Conversation</button>
          </div>
          <div id="nebula-ai-conversation-list" class="nebula-ai-conversation-list"></div>
          <footer class="nebula-ai-sidebar-footer">
            <p class="nebula-ai-quota-title">Messages Left Today: <strong id="nebula-ai-quota-remaining">100</strong>/100</p>
            <div class="nebula-ai-quota-track"><span id="nebula-ai-quota-bar"></span></div>
            <p class="nebula-ai-quota-sub">Used: <span id="nebula-ai-quota-used">0</span></p>
            <p id="nebula-ai-sync-label" class="nebula-ai-quota-sub">Cloud Sync: On</p>
          </footer>
        </aside>

        <section class="nebula-ai-main">
          <header class="nebula-ai-main-head">
            <div>
              <p class="nebula-ai-kicker">AI Chat</p>
              <h1>${escapeHtml((activeConversation() && activeConversation().title) || "New conversation")}</h1>
            </div>
            <div class="nebula-ai-header-controls">
              <select id="nebula-ai-model-select" class="nebula-ai-control">
                <option value="gemini-2.5-flash" ${getCurrentModel() === "gemini-2.5-flash" ? "selected" : ""}>Flash</option>
                <option value="gemini-2.5-flash-lite" ${getCurrentModel() === "gemini-2.5-flash-lite" ? "selected" : ""}>Lite</option>
              </select>
              <button id="nebula-ai-regenerate" type="button" class="nebula-btn nebula-btn-muted">Regenerate</button>
            </div>
          </header>

          <div id="nebula-ai-messages" class="nebula-ai-messages"></div>
          <div id="nebula-ai-attachment-strip" class="nebula-ai-attachment-strip hidden"></div>

          <form id="nebula-ai-form" class="nebula-ai-form">
            <textarea id="nebula-ai-input" rows="3" placeholder="Type a message... Shift+Enter for a new line"></textarea>
            <div class="nebula-ai-form-actions">
              <input id="nebula-ai-upload-input" type="file" multiple class="hidden" />
              <button id="nebula-ai-upload" type="button" class="nebula-btn nebula-btn-muted">Upload</button>
              <button id="nebula-ai-send" type="submit" class="nebula-btn nebula-btn-highlight">Send</button>
            </div>
          </form>
          <p id="nebula-ai-status" class="nebula-status"></p>
        </section>
      </section>
    `;

    renderConversationList();
    renderMessageList();
    renderPendingAttachments();
    renderQuotaPanel();
    setStatus(state.statusText, state.statusOk);
    setBusy(state.busy);
  }

  async function loadQuota() {
    if (directModeEnabled()) {
      state.quota = readQuotaStore();
      renderQuotaPanel();
      return;
    }
    try {
      const payload = await apiRequest("/api/ai/quota", { method: "GET" });
      const limit = clampNumber(payload.limit, 1, 100000, 100);
      const used = clampNumber(payload.used, 0, limit, 0);
      const remaining = clampNumber(payload.remaining, 0, limit, limit - used);
      state.quota = {
        limit,
        used,
        remaining,
        dayKey: String(payload.dayKey || "")
      };
      renderQuotaPanel();
    } catch (error) {
      setStatus(error && error.message ? error.message : "Could not fetch quota.", false);
    }
  }

  async function syncFromCloud() {
    if (!cloudApiEnabled()) {
      return;
    }
    try {
      const payload = await apiRequest("/api/ai/conversations", { method: "GET" });
      const conversations = Array.isArray(payload.conversations) ? payload.conversations : [];
      conversations.forEach((conversation) => {
        upsertConversation({
          id: conversation.id,
          title: conversation.title,
          createdAt: Number(conversation.createdAt || nowMs()),
          updatedAt: Number(conversation.updatedAt || nowMs()),
          messageCount: Number(conversation.messageCount || 0),
          lastPreview: String(conversation.lastPreview || ""),
          messages: []
        });
      });
      state.store.conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      if (!activeConversation()) {
        ensureConversation();
      }
      writeStore();
      renderConversationList();
      const selected = activeConversation();
      if (selected && !selected.messages.length) {
        await loadConversationMessagesFromCloud(selected.id);
      }
    } catch (error) {
      setStatus(error && error.message ? error.message : "Could not sync cloud conversations.", false);
    }
  }

  async function loadConversationMessagesFromCloud(conversationId) {
    if (!cloudApiEnabled()) {
      return;
    }
    const conversation = findConversation(conversationId);
    if (!conversation) {
      return;
    }
    try {
      const payload = await apiRequest(`/api/ai/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "GET" });
      const messages = Array.isArray(payload.messages) ? payload.messages.map(normalizeMessage).filter(Boolean).slice(-AI_MESSAGE_LIMIT) : [];
      conversation.messages = messages;
      conversation.messageCount = Math.max(conversation.messageCount || 0, messages.length);
      if (messages.length) {
        const newest = messages[messages.length - 1];
        conversation.updatedAt = Math.max(conversation.updatedAt || 0, newest.createdAt || nowMs());
        conversation.lastPreview = normalizePreview(newest.content || "");
      }
      writeStore();
      renderMessageList();
      renderConversationList();
    } catch (_error) {
    }
  }

  function bytesToBase64(bytes) {
    let output = "";
    const chunk = 32768;
    for (let i = 0; i < bytes.length; i += chunk) {
      const part = bytes.subarray(i, i + chunk);
      let block = "";
      for (let j = 0; j < part.length; j += 1) {
        block += String.fromCharCode(part[j]);
      }
      output += block;
    }
    return btoa(output);
  }

  function supportsTextFile(file) {
    const mime = String(file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();
    if (mime.startsWith("text/")) {
      return true;
    }
    if ([
      "application/json",
      "application/xml",
      "application/javascript",
      "application/x-javascript",
      "application/typescript",
      "application/x-sh",
      "application/x-shellscript",
      "application/sql"
    ].includes(mime)) {
      return true;
    }
    return /\.(txt|md|json|xml|js|jsx|ts|tsx|html|css|py|java|cs|cpp|c|go|rs|rb|php|sql|yaml|yml|toml|ini|sh)$/i.test(name);
  }

  async function fileToAttachment(file) {
    const safeName = String(file && file.name ? file.name : "upload").slice(0, 140);
    const safeType = String(file && file.type ? file.type : "application/octet-stream").toLowerCase().slice(0, 120);
    const safeSize = clampNumber(file && file.size, 0, AI_UPLOAD_MAX_BYTES, 0);

    if (safeSize <= 0 || safeSize > AI_UPLOAD_MAX_BYTES) {
      throw new Error(`File too large: ${safeName}. Max ${Math.floor(AI_UPLOAD_MAX_BYTES / 1000)}KB.`);
    }

    if (safeType.startsWith("image/")) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return {
        id: randomId("att"),
        name: safeName,
        mimeType: safeType,
        kind: "image",
        size: safeSize,
        base64: bytesToBase64(bytes)
      };
    }

    if (!supportsTextFile(file)) {
      throw new Error(`Unsupported file type: ${safeName}.`);
    }

    const text = String(await file.text()).slice(0, 220000);
    return {
      id: randomId("att"),
      name: safeName,
      mimeType: safeType || "text/plain",
      kind: "text",
      size: safeSize,
      text
    };
  }

  function openDialog(title, bodyHtml, onReady) {
    closeDialog();
    const layer = document.createElement("div");
    layer.className = "nebula-ai-modal-layer";
    layer.innerHTML = `
      <div class="nebula-ai-modal-backdrop" data-close-ai-modal="1"></div>
      <div class="nebula-ai-modal-card">
        <header>
          <h2>${escapeHtml(title)}</h2>
          <button type="button" data-close-ai-modal="1"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <div class="nebula-ai-modal-body">${bodyHtml}</div>
      </div>
    `;
    document.body.appendChild(layer);

    const close = () => {
      layer.remove();
      if (state.modalClose === close) {
        state.modalClose = null;
      }
    };

    layer.querySelectorAll("[data-close-ai-modal='1']").forEach((node) => {
      node.addEventListener("click", close);
    });

    state.modalClose = close;
    if (typeof onReady === "function") {
      onReady(close, layer);
    }
  }

  function closeDialog() {
    if (typeof state.modalClose === "function") {
      state.modalClose();
    }
  }

  function conversationToApiMessage(item) {
    return {
      id: String(item.id || randomId("msg")),
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content || "").slice(0, 120000),
      attachments: Array.isArray(item.attachments)
        ? item.attachments.map((attachment) => {
            const normalized = normalizeAttachment(attachment);
            if (!normalized) {
              return null;
            }
            if (normalized.kind === "image") {
              const imagePayload = {
                id: normalized.id,
                name: normalized.name,
                mimeType: normalized.mimeType,
                kind: "image"
              };
              if (normalized.base64) {
                imagePayload.base64 = String(normalized.base64);
              }
              return imagePayload;
            }
            return {
              id: normalized.id,
              name: normalized.name,
              mimeType: normalized.mimeType,
              kind: "text",
              text: String(normalized.text || "")
            };
          }).filter(Boolean)
        : []
    };
  }

  function removeTrailingAssistant(conversation) {
    while (conversation.messages.length && conversation.messages[conversation.messages.length - 1].role === "assistant") {
      conversation.messages.pop();
    }
  }

  async function sendCurrentInput(options) {
    if (state.busy) {
      return;
    }
    const regenerate = Boolean(options && options.regenerate);
    if (!regenerate && state.quota.remaining <= 0) {
      setStatus("Daily message limit reached. Try again tomorrow.", false);
      return;
    }
    const input = state.root ? state.root.querySelector("#nebula-ai-input") : null;
    const conversation = ensureConversation();

    let userMessage = null;
    if (!regenerate) {
      const text = String(input && input.value ? input.value : "").trim();
      const attachments = state.pendingAttachments.map(normalizeAttachment).filter(Boolean);
      if (!text && !attachments.length) {
        setStatus("Type a message or upload a file.", false);
        return;
      }
      userMessage = {
        id: randomId("msg"),
        role: "user",
        content: text,
        attachments,
        createdAt: nowMs()
      };
      conversation.messages.push(userMessage);
      if (!conversation.title || conversation.title === "New conversation") {
        conversation.title = autoTitle(text || (attachments[0] ? attachments[0].name : "New conversation"));
      }
      conversation.updatedAt = userMessage.createdAt;
      conversation.messageCount = conversation.messages.length;
      conversation.lastPreview = normalizePreview(text || (attachments[0] ? `Uploaded ${attachments[0].name}` : ""));
      if (input) {
        input.value = "";
      }
      state.pendingAttachments = [];
    } else {
      removeTrailingAssistant(conversation);
      for (let i = conversation.messages.length - 1; i >= 0; i -= 1) {
        if (conversation.messages[i].role === "user") {
          userMessage = conversation.messages[i];
          break;
        }
      }
      if (!userMessage) {
        setStatus("No message to regenerate.", false);
        return;
      }
      conversation.updatedAt = nowMs();
    }

    const placeholder = {
      id: randomId("msg"),
      role: "assistant",
      content: "Thinking...",
      attachments: [],
      createdAt: nowMs()
    };
    conversation.messages.push(placeholder);
    conversation.messages = conversation.messages.slice(-AI_MESSAGE_LIMIT);
    state.store.conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    writeStore();
    renderConversationList();
    renderMessageList();
    renderPendingAttachments();
    setBusy(true);
    setStatus("", true);

    const syncConversation = cloudSyncEnabled();
    const contextMessages = conversation.messages
      .filter((item) => item.id !== placeholder.id)
      .slice(-getContextLimit())
      .map(conversationToApiMessage);

    try {
      const payload = directModeEnabled()
        ? await requestGeminiWithRotation({
            conversationId: conversation.id,
            title: conversation.title,
            messages: contextMessages,
            customInstructions: getCustomInstructions(),
            regenerate
          })
        : await apiRequest("/api/ai/chat", {
            method: "POST",
            body: JSON.stringify({
              model: getCurrentModel(),
              conversationId: conversation.id,
              title: conversation.title,
              messages: contextMessages,
              customInstructions: getCustomInstructions(),
              syncConversation,
              regenerate
            })
          });

      const assistantText = String(payload.assistantMessage || "").trim() || "No response generated.";
      const index = conversation.messages.findIndex((item) => item.id === placeholder.id);
      const assistantMessage = {
        id: placeholder.id,
        role: "assistant",
        content: "",
        attachments: [],
        createdAt: nowMs()
      };

      if (index >= 0) {
        conversation.messages.splice(index, 1, assistantMessage);
      } else {
        conversation.messages.push(assistantMessage);
      }

      renderMessageList();
      await animateAssistantTyping(conversation, assistantMessage.id, assistantText);

      conversation.updatedAt = assistantMessage.createdAt;
      conversation.messageCount = conversation.messages.length;
      conversation.lastPreview = normalizePreview(assistantText);

      if (payload.title) {
        conversation.title = String(payload.title).slice(0, 120);
      }

      if (payload.quota && typeof payload.quota === "object") {
        state.quota.limit = clampNumber(payload.quota.limit, 1, 100000, state.quota.limit);
        state.quota.used = clampNumber(payload.quota.used, 0, state.quota.limit, state.quota.used);
        state.quota.remaining = clampNumber(payload.quota.remaining, 0, state.quota.limit, state.quota.remaining);
        state.quota.dayKey = String(payload.quota.dayKey || state.quota.dayKey || "");
        writeQuotaStore();
      } else if (directModeEnabled()) {
        decrementQuota();
        renderQuotaPanel();
      }

      state.store.conversations = state.store.conversations
        .filter((item) => item.id !== conversation.id);
      state.store.conversations.unshift(conversation);
      state.store.conversations = state.store.conversations.slice(0, AI_CONVERSATION_LIMIT);
      state.store.activeConversationId = conversation.id;
      writeStore();
      renderConversationList();
      renderMessageList();
      renderQuotaPanel();
      setStatus("", true);
    } catch (error) {
      const index = conversation.messages.findIndex((item) => item.id === placeholder.id);
      if (index >= 0) {
        conversation.messages.splice(index, 1);
      }
      conversation.updatedAt = nowMs();
      conversation.messageCount = conversation.messages.length;
      state.store.conversations = state.store.conversations
        .filter((item) => item.id !== conversation.id);
      state.store.conversations.unshift(conversation);
      writeStore();
      renderConversationList();
      renderMessageList();
      setStatus(error && error.message ? error.message : "Request failed.", false);
    } finally {
      setBusy(false);
      if (!directModeEnabled()) {
        loadQuota();
      }
    }
  }

  async function renameConversation(conversationId) {
    const conversation = findConversation(conversationId);
    if (!conversation) {
      return;
    }

    openDialog("Rename Conversation", `
      <form id="nebula-ai-rename-form" class="nebula-ai-modal-form">
        <input id="nebula-ai-rename-input" type="text" maxlength="120" value="${escapeHtml(conversation.title || "")}" />
        <p id="nebula-ai-rename-status" class="nebula-status"></p>
        <button type="submit" class="nebula-btn nebula-btn-primary">Save</button>
      </form>
    `, (close, layer) => {
      const form = layer.querySelector("#nebula-ai-rename-form");
      const input = layer.querySelector("#nebula-ai-rename-input");
      const status = layer.querySelector("#nebula-ai-rename-status");
      if (input) {
        input.focus();
        input.select();
      }
      if (!form) {
        return;
      }
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const nextTitle = String(input && input.value ? input.value : "").trim().slice(0, 120);
        if (!nextTitle) {
          if (status) {
            status.textContent = "Title is required.";
          }
          return;
        }
        conversation.title = nextTitle;
        conversation.updatedAt = nowMs();
        writeStore();
        renderConversationList();
        render();

        if (cloudApiEnabled()) {
          try {
            await apiRequest(`/api/ai/conversations/${encodeURIComponent(conversation.id)}`, {
              method: "PATCH",
              body: JSON.stringify({ title: nextTitle })
            });
          } catch (error) {
            setStatus(error && error.message ? error.message : "Could not rename cloud conversation.", false);
          }
        }

        close();
      });
    });
  }

  async function deleteConversation(conversationId) {
    const conversation = findConversation(conversationId);
    if (!conversation) {
      return;
    }

    openDialog("Delete Conversation", `
      <div class="nebula-ai-modal-form">
        <p>Delete "${escapeHtml(conversation.title || "Untitled")}"?</p>
        <div class="nebula-ai-modal-actions">
          <button id="nebula-ai-delete-confirm" type="button" class="nebula-btn nebula-btn-primary">Delete</button>
          <button id="nebula-ai-delete-cancel" type="button" class="nebula-btn nebula-btn-muted" data-close-ai-modal="1">Cancel</button>
        </div>
      </div>
    `, (close, layer) => {
      const confirm = layer.querySelector("#nebula-ai-delete-confirm");
      if (!confirm) {
        return;
      }
      confirm.addEventListener("click", async () => {
        removeConversation(conversation.id);
        render();
        close();
        if (cloudApiEnabled()) {
          try {
            await apiRequest(`/api/ai/conversations/${encodeURIComponent(conversation.id)}`, {
              method: "DELETE"
            });
          } catch (error) {
            setStatus(error && error.message ? error.message : "Could not delete cloud conversation.", false);
          }
        }
      });
    });
  }

  async function handleUpload(files) {
    const list = Array.from(files || []).slice(0, AI_UPLOAD_LIMIT);
    if (!list.length) {
      return;
    }

    const remainingSlots = Math.max(0, AI_UPLOAD_LIMIT - state.pendingAttachments.length);
    if (!remainingSlots) {
      setStatus(`Maximum ${AI_UPLOAD_LIMIT} files per message.`, false);
      return;
    }

    const next = list.slice(0, remainingSlots);
    try {
      const attachments = [];
      for (const file of next) {
        const attachment = await fileToAttachment(file);
        attachments.push(attachment);
      }
      state.pendingAttachments = state.pendingAttachments.concat(attachments).slice(0, AI_UPLOAD_LIMIT);
      renderPendingAttachments();
      setStatus("", true);
    } catch (error) {
      setStatus(error && error.message ? error.message : "Upload failed.", false);
    }
  }

  function bindEvents() {
    if (!state.root) {
      return;
    }

    state.root.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) { 
        return;
      }

      const newButton = target.closest("#nebula-ai-new");
      if (newButton) {
        ensureConversation(randomId("conv"));
        state.pendingAttachments = [];
        writeStore();
        render();
        bindEvents();
        const newInput = state.root ? state.root.querySelector("#nebula-ai-input") : null;
        if (newInput) {
          newInput.value = "";
          newInput.focus();
        }
        const messageList = state.root ? state.root.querySelector("#nebula-ai-messages") : null;
        if (messageList) {
          messageList.scrollTop = 0;
        }
        return;
      }

      const openConversation = target.closest("[data-conversation-open]");
      if (openConversation) {
        const id = String(openConversation.getAttribute("data-conversation-open") || "").trim();
        if (id) {
          state.store.activeConversationId = id;
          writeStore();
          render();
          const selected = findConversation(id);
          if (selected && cloudSyncEnabled() && !selected.messages.length) {
            await loadConversationMessagesFromCloud(id);
          }
        }
        return;
      }

      const renameButton = target.closest("[data-conversation-rename]");
      if (renameButton) {
        const id = String(renameButton.getAttribute("data-conversation-rename") || "").trim();
        if (id) {
          await renameConversation(id);
        }
        return;
      }

      const deleteButton = target.closest("[data-conversation-delete]");
      if (deleteButton) {
        const id = String(deleteButton.getAttribute("data-conversation-delete") || "").trim();
        if (id) {
          await deleteConversation(id);
        }
        return;
      }

      const removeUpload = target.closest("[data-remove-upload]");
      if (removeUpload) {
        const id = String(removeUpload.getAttribute("data-remove-upload") || "").trim();
        if (!id) {
          return;
        }
        state.pendingAttachments = state.pendingAttachments.filter((item) => item.id !== id);
        renderPendingAttachments();
        return;
      }

      const uploadButton = target.closest("#nebula-ai-upload");
      if (uploadButton) {
        const input = state.root.querySelector("#nebula-ai-upload-input");
        if (input) {
          input.click();
        }
        return;
      }

      const regenerateButton = target.closest("#nebula-ai-regenerate");
      if (regenerateButton) {
        await sendCurrentInput({ regenerate: true });
        return;
      }

      const copyMessageButton = target.closest("[data-copy-message]");
      if (copyMessageButton) {
        const id = String(copyMessageButton.getAttribute("data-copy-message") || "").trim();
        const conversation = activeConversation();
        const message = conversation && conversation.messages ? conversation.messages.find((item) => item.id === id) : null;
        if (message) {
          try {
            await navigator.clipboard.writeText(String(message.content || ""));
            setStatus("Message copied.", true);
          } catch (_error) {
            setStatus("Could not copy message.", false);
          }
        }
        return;
      }

      const copyCodeButton = target.closest("[data-copy-code='1']");
      if (copyCodeButton) {
        const wrapper = copyCodeButton.closest(".nebula-ai-codeblock");
        const code = wrapper ? wrapper.querySelector("code") : null;
        if (!code) {
          return;
        }
        try {
          await navigator.clipboard.writeText(code.textContent || "");
          const button = copyCodeButton;
          const previous = button.textContent;
          button.textContent = "Copied";
          window.setTimeout(() => {
            button.textContent = previous || "Copy";
          }, 1200);
        } catch (_error) {
          setStatus("Could not copy code.", false);
        }
      }
    });

    state.root.addEventListener("submit", async (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      if (form.id !== "nebula-ai-form") {
        return;
      }
      event.preventDefault();
      await sendCurrentInput({ regenerate: false });
    });

    state.root.addEventListener("change", async (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) {
        return;
      }
      if (input.id === "nebula-ai-upload-input") {
        await handleUpload(input.files || []);
        input.value = "";
        return;
      }
      if (input.id === "nebula-ai-model-select") {
        setCurrentModel(String(input.value || "gemini-2.5-flash"));
        return;
      }

    });

    state.root.addEventListener("keydown", async (event) => {
      const node = event.target;
      if (!(node instanceof HTMLTextAreaElement)) {
        return;
      }
      if (node.id !== "nebula-ai-input") {
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        await sendCurrentInput({ regenerate: false });
      }
    });

    state.root.addEventListener("input", (event) => {
      const node = event.target;
      if (!(node instanceof HTMLTextAreaElement)) {
        return;
      }
      if (node.id !== "nebula-ai-input") {
        return;
      }
      node.style.height = "auto";
      node.style.height = `${Math.min(260, node.scrollHeight)}px`;
    });
  }

  async function mount(selector) {
    const root = document.querySelector(selector);
    state.rootSelector = selector;
    state.root = root;
    state.pendingAttachments = [];
    state.statusText = "";
    state.statusOk = true;
    state.store = readStore();
    state.quota = readQuotaStore();

    if (!state.root) {
      return;
    }

    const queryConversation = readQueryConversationId();
    ensureConversation(queryConversation || state.store.activeConversationId);
    writeStore();
    render();
    bindEvents();
    setStatus("", true);
    setBusy(false);
    state.mounted = true;

    await loadQuota();
    await syncFromCloud();
  }

  function unmount() {
    closeDialog();
    state.root = null;
    state.rootSelector = "";
    state.pendingAttachments = [];
    state.busy = false;
    state.mounted = false;
  }

  function getRecentConversations(limit) {
    const parsedLimit = clampNumber(limit, 1, 20, 6);
    const store = readStore();
    return store.conversations
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, parsedLimit)
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messageCount,
        lastPreview: conversation.lastPreview
      }));
  }

  function clearConversation(conversationId) {
    if (!conversationId) {
      return;
    }
    const store = readStore();
    store.conversations = store.conversations.filter((conversation) => conversation.id !== conversationId);
    if (store.activeConversationId === conversationId) {
      store.activeConversationId = "";
    }
    localStorage.setItem(AI_STORE_KEY, JSON.stringify(store));
    if (state.mounted) {
      state.store = readStore();
      ensureConversation();
      render();
    }
  }

  window.NebulaAIChat = {
    mount,
    unmount,
    getRecentConversations,
    clearConversation
  };
})();