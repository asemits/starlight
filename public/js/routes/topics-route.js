(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeMarkdownLinkUrl(rawUrl) {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) {
      return "#";
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return "https://" + trimmed;
  }

  function stashMarkdownToken(pool, value) {
    const key = "__social_md_token_" + pool.length + "__";
    pool.push({ key, value });
    return key;
  }

  function restoreMarkdownTokens(value, pool) {
    let output = String(value || "");
    for (let i = 0; i < pool.length; i += 1) {
      const token = pool[i];
      output = output.replaceAll(token.key, token.value);
    }
    return output;
  }

  function renderMarkdownInline(value, tokenPool) {
    let output = escapeHtml(String(value || ""));
    output = output.replace(/`([^`]+)`/g, function (_match, codeText) {
      return stashMarkdownToken(tokenPool, "<code class=\"nebula-social-md-code\">" + codeText + "</code>");
    });
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_match, label, rawUrl) {
      const href = normalizeMarkdownLinkUrl(rawUrl);
      return stashMarkdownToken(tokenPool, "<a href=\"" + escapeHtml(href) + "\" target=\"_blank\" rel=\"noreferrer noopener\">" + label + "</a>");
    });
    output = output
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<u>$1</u>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>");
    return output;
  }

  function renderMarkdownBlocks(value, tokenPool) {
    const lines = String(value || "").split("\n");
    const output = [];
    let listOpen = false;

    function closeList() {
      if (listOpen) {
        output.push("</ul>");
        listOpen = false;
      }
    }

    for (let i = 0; i < lines.length; i += 1) {
      const current = lines[i];
      const listMatch = /^(\s{0,4})[-*]\s+(.+)$/.exec(current);
      if (listMatch) {
        if (!listOpen) {
          output.push("<ul class=\"nebula-social-md-list\">");
          listOpen = true;
        }
        const depth = Math.min(Math.floor(listMatch[1].length / 2), 3);
        output.push("<li class=\"depth-" + depth + "\">" + renderMarkdownInline(listMatch[2], tokenPool) + "</li>");
        continue;
      }

      closeList();

      const headingMatch = /^(#{1,3})\s+(.+)$/.exec(current);
      if (headingMatch) {
        const level = headingMatch[1].length;
        output.push("<h" + level + ">" + renderMarkdownInline(headingMatch[2], tokenPool) + "</h" + level + ">");
        continue;
      }

      const quoteMatch = /^>\s+(.+)$/.exec(current);
      if (quoteMatch) {
        output.push("<blockquote class=\"nebula-social-md-quote\">" + renderMarkdownInline(quoteMatch[1], tokenPool) + "</blockquote>");
        continue;
      }

      if (!current.trim()) {
        output.push("<p></p>");
        continue;
      }

      output.push("<p>" + renderMarkdownInline(current, tokenPool) + "</p>");
    }

    closeList();
    return output.join("");
  }

  function renderMarkdown(value) {
    const tokenPool = [];
    const escapedText = String(value || "").replace(/\\([`*_~\\[\]()#>-])/g, function (_match, escapedChar) {
      return stashMarkdownToken(tokenPool, escapeHtml(escapedChar));
    });
    const withCodeBlocks = escapedText.replace(/```([\s\S]*?)```/g, function (_match, codeText) {
      return stashMarkdownToken(tokenPool, "<pre class=\"nebula-social-md-codeblock\"><code>" + escapeHtml(codeText.trim()) + "</code></pre>");
    });
    const rendered = renderMarkdownBlocks(withCodeBlocks, tokenPool);
    return restoreMarkdownTokens(rendered, tokenPool);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\r/g, "").replace(/\u00A0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  function relativeTime(value) {
    if (!value) {
      return "just now";
    }
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "just now";
    }
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      if (Math.abs(diffSeconds) >= unit[1] || unit[0] === "minute") {
        return formatter.format(Math.round(diffSeconds / unit[1]), unit[0]);
      }
    }
    return "just now";
  }

  function formatCount(value) {
    return new Intl.NumberFormat("en-US", {
      notation: Number(value) >= 1000 ? "compact" : "standard",
      maximumFractionDigits: 1
    }).format(Number(value) || 0);
  }

  function userLabel(user) {
    const fallback = user && user.uid ? String(user.uid).slice(0, 8) : "member";
    const raw = user && (user.displayName || (user.email ? user.email.split("@")[0] : fallback)) || fallback;
    return String(raw).trim().slice(0, 60) || "member";
  }

  modules["/topics"] = {
    render: function renderTopicsRoute() {
      return `
        <section class="nebula-topics-page">
          <style>
            .nebula-topics-page{width:min(100%,1480px);margin:0 auto;min-height:calc(100vh - 130px);display:grid;grid-template-rows:auto minmax(0,1fr);gap:10px}
            .nebula-topics-topbar{display:flex;align-items:center;gap:12px;padding:6px 0}
            .nebula-topics-brand{font-family:'Geist','Oxanium',sans-serif;font-size:1.9rem;font-weight:700;color:#f5f5f5;letter-spacing:-.03em}
            .nebula-topics-search-wrap{flex:1;display:flex;align-items:center;gap:8px;max-width:760px}
            .nebula-topics-search-wrap input{width:100%;height:42px;border-radius:999px;border:1px solid #333;background:#111;color:#f2f2f2;padding:0 16px;font-family:'Geist','Montserrat',sans-serif}
            .nebula-topics-search-wrap input:focus{outline:none;border-color:#ff6a00;box-shadow:0 0 0 1px rgba(255,106,0,.28)}
            .nebula-topics-page button{cursor:pointer}
            .nebula-topics-shell{display:grid;grid-template-columns:270px minmax(0,1fr) 350px;gap:12px;min-height:0}
            .nebula-topics-col{background:#0f0f10;border:1px solid #242424;border-radius:14px;min-height:0}
            .nebula-topics-left{display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden}
            .nebula-topics-left-head{padding:12px;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between;gap:8px}
            .nebula-topics-left-head strong{font-family:'Geist','Oxanium',sans-serif;font-size:.9rem;letter-spacing:.08em;text-transform:uppercase}
            .nebula-topics-list{display:grid;gap:8px;overflow:auto;padding:10px}
            .nebula-topic-chip{border:1px solid #2f2f2f;border-radius:10px;background:#161616;padding:10px;display:grid;gap:7px}
            .nebula-topic-chip.active{border-color:#646464;background:#1c1c1d}
            .nebula-topic-chip h3{margin:0;color:#efefef;font-size:.88rem;font-family:'Geist','Oxanium',sans-serif;letter-spacing:.02em}
            .nebula-topic-chip p{margin:0;color:#a8a8a8;font-size:.75rem;line-height:1.45}
            .nebula-topic-meta{display:flex;align-items:center;gap:8px;color:#8a8a8a;font-size:.66rem;text-transform:uppercase;letter-spacing:.07em}
            .nebula-topics-editor{padding:10px;border-top:1px solid #222;display:grid;gap:8px}
            .nebula-topics-editor input,.nebula-topics-editor textarea,.nebula-thread-composer input,.nebula-thread-composer textarea,.nebula-reply-editor textarea{width:100%;border:1px solid #323232;background:#151515;color:#eee;border-radius:10px;padding:10px 11px;font-family:'Geist','Montserrat',sans-serif;font-size:.84rem}
            .nebula-topics-editor input:focus,.nebula-topics-editor textarea:focus,.nebula-thread-composer input:focus,.nebula-thread-composer textarea:focus,.nebula-reply-editor textarea:focus{outline:none;border-color:#5d5d5d}
            .nebula-social-inline{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
            .nebula-topics-btn,.nebula-thread-action,.nebula-reply-action{border:1px solid #3a3a3a;background:#1d1d1e;color:#f0f0f0;border-radius:999px;padding:8px 12px;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;font-family:'Geist','Montserrat',sans-serif}
            .nebula-topics-btn.primary{background:#ff4500;border-color:#ff4500;color:white}
            .nebula-thread-action.active,.nebula-reply-action.active{border-color:#ff6a00;color:#fff;background:#2a1a12}
            .nebula-social-note{margin:0;color:#8d8d8d;font-size:.68rem;letter-spacing:.06em;text-transform:uppercase}
            .nebula-social-error{color:#ffb4b4}
            .nebula-social-success{color:#bbffd4}
            .nebula-topics-main{display:grid;grid-template-rows:auto auto minmax(0,1fr);min-height:0}
            .nebula-topics-main-head{padding:12px;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between;gap:8px}
            .nebula-topics-main-head strong{font-size:1rem;font-family:'Geist','Oxanium',sans-serif;color:#f3f3f3}
            .nebula-topics-main-controls{padding:10px;border-bottom:1px solid #222;display:grid;gap:8px}
            .nebula-thread-composer{display:grid;gap:8px}
            .nebula-thread-list{display:grid;gap:10px;overflow:auto;padding:12px;min-height:0}
            .nebula-thread-card{border:1px solid #2b2b2b;border-radius:12px;background:#151516;padding:12px;display:grid;gap:8px}
            .nebula-thread-card h3{margin:0;font-family:'Geist','Oxanium',sans-serif;font-size:1.02rem;color:#fafafa}
            .nebula-thread-card-meta,.nebula-reply-card-meta{color:#949494;font-size:.66rem;letter-spacing:.06em;text-transform:uppercase}
            .nebula-thread-markdown p{margin:0 0 8px;color:#c8c8c8;line-height:1.65;font-size:.84rem}
            .nebula-thread-markdown a{color:#8fc2ff}
            .nebula-thread-actions,.nebula-reply-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
            .nebula-thread-window{display:grid;grid-template-rows:auto auto auto auto minmax(0,1fr);min-height:0}
            .nebula-thread-window.hidden .nebula-thread-markdown,.nebula-thread-window.hidden .nebula-reply-editor,.nebula-thread-window.hidden .nebula-replies-list,.nebula-thread-window.hidden #social-thread-meta-view{display:none}
            .nebula-thread-window.hidden #social-thread-title-view:after{content:' (open a thread)';color:#888;font-size:.75rem;font-weight:400;text-transform:none;letter-spacing:0}
            .nebula-thread-head{padding:12px;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between;gap:8px}
            .nebula-thread-head h2{margin:0;font-family:'Geist','Oxanium',sans-serif;font-size:1rem;color:#f4f4f4}
            #social-thread-body-view{padding:12px 12px 0}
            #social-thread-meta-view{padding:0 12px 10px}
            .nebula-reply-editor{padding:0 12px 12px;display:grid;gap:8px}
            .nebula-replies-list{overflow:auto;padding:0 12px 12px;display:grid;gap:8px;min-height:0}
            .nebula-reply-card{border:1px solid #2b2b2b;border-radius:10px;background:#171718;padding:10px;display:grid;gap:6px}
            .nebula-social-empty{padding:14px;border:1px dashed #333;border-radius:10px;color:#8f8f8f;text-align:center;font-size:.78rem}
            .nebula-social-md-code{background:#252525;border:1px solid #3b3b3b;border-radius:6px;padding:1px 6px;font-size:.78rem}
            .nebula-social-md-codeblock{background:#1b1b1c;border:1px solid #343434;border-radius:8px;padding:8px;overflow:auto}
            .nebula-social-md-list{margin:0 0 8px;padding-left:0;list-style:none;display:grid;gap:4px}
            .nebula-social-md-list li{padding-left:12px;position:relative}
            .nebula-social-md-list li:before{content:'•';position:absolute;left:0;opacity:.75}
            .nebula-social-md-list .depth-1{padding-left:24px}
            .nebula-social-md-list .depth-2{padding-left:36px}
            .nebula-social-md-list .depth-3{padding-left:48px}
            .nebula-social-md-quote{margin:0 0 8px;border-left:2px solid #555;padding-left:10px;color:#b5b5b5}
            @media (max-width:1300px){.nebula-topics-shell{grid-template-columns:240px minmax(0,1fr)}.nebula-topics-shell .nebula-thread-window{grid-column:1 / -1;min-height:380px}}
            @media (max-width:900px){.nebula-topics-shell{grid-template-columns:1fr}.nebula-topics-page{min-height:0}.nebula-topics-col{min-height:320px}}
          </style>

          <div class="nebula-topics-topbar">
            <div class="nebula-topics-brand">reddit</div>
            <div class="nebula-topics-search-wrap">
              <input id="social-topic-search" type="search" placeholder="Search Topics" autocomplete="off" />
              <button type="button" id="social-refresh-topics" class="nebula-topics-btn">Refresh</button>
            </div>
          </div>

          <section class="nebula-topics-shell" id="social-topics-shell">
            <aside class="nebula-topics-col nebula-topics-left">
              <div class="nebula-topics-left-head">
                <strong>Topics</strong>
                <p id="social-auth-note" class="nebula-social-note">Checking session...</p>
              </div>
              <div id="social-topic-list" class="nebula-topics-list"></div>
              <div class="nebula-topics-editor">
                <input id="social-topic-name" maxlength="32" placeholder="Create topic name" />
                <textarea id="social-topic-description" rows="2" maxlength="300" placeholder="Topic description"></textarea>
                <textarea id="social-topic-rules" rows="3" maxlength="800" placeholder="Topic rules"></textarea>
                <div class="nebula-social-inline">
                  <button type="button" id="social-create-topic" class="nebula-topics-btn primary">Create Topic</button>
                  <button type="button" id="social-edit-topic" class="nebula-topics-btn" disabled>Save Topic</button>
                </div>
                <p id="social-topic-status" class="nebula-social-note"></p>
              </div>
            </aside>

            <main class="nebula-topics-col nebula-topics-main">
              <div class="nebula-topics-main-head">
                <strong id="social-selected-topic">Select a Topic</strong>
                <div class="nebula-social-inline">
                  <button id="social-join-topic" type="button" class="nebula-topics-btn" disabled>Join</button>
                  <button id="social-open-topic" type="button" class="nebula-topics-btn" disabled>Open Thread</button>
                </div>
              </div>
              <div id="social-topic-detail" class="nebula-social-empty" style="margin:10px">Pick a Topic from the left to browse threads.</div>
              <div class="nebula-topics-main-controls">
                <div class="nebula-thread-composer">
                  <input id="social-thread-title" maxlength="160" placeholder="Thread title" />
                  <textarea id="social-thread-body" rows="4" maxlength="4000" placeholder="Thread markdown body"></textarea>
                  <div class="nebula-social-inline">
                    <button type="button" id="social-create-thread" class="nebula-topics-btn primary">Post Thread</button>
                    <p id="social-thread-status" class="nebula-social-note"></p>
                  </div>
                </div>
              </div>
              <div id="social-thread-list" class="nebula-thread-list"></div>
            </main>

            <section id="social-thread-window" class="nebula-topics-col nebula-thread-window hidden">
              <div class="nebula-thread-head">
                <h2 id="social-thread-title-view">Thread</h2>
                <button id="social-close-thread" class="nebula-topics-btn" type="button">Close</button>
              </div>
              <div id="social-thread-body-view" class="nebula-thread-markdown"></div>
              <div id="social-thread-meta-view" class="nebula-thread-card-meta"></div>
              <div class="nebula-reply-editor">
                <textarea id="social-reply-body" rows="3" maxlength="2000" placeholder="Write a reply"></textarea>
                <div class="nebula-social-inline">
                  <button id="social-create-reply" type="button" class="nebula-topics-btn primary">Reply</button>
                  <p id="social-reply-status" class="nebula-social-note"></p>
                </div>
              </div>
              <div id="social-reply-list" class="nebula-replies-list"></div>
            </section>
          </section>
        </section>
      `;
    },
    afterRender: async function afterRenderTopicsRoute() {
      const fb = window.firebase;
      if (!fb || typeof fb.firestore !== "function") {
        return;
      }

      const db = fb.firestore();
      const auth = fb.auth();
      const fieldValue = fb.firestore.FieldValue;

      if (window.NebulaTopicsRoute && typeof window.NebulaTopicsRoute.teardown === "function") {
        window.NebulaTopicsRoute.teardown();
      }

      const root = document.querySelector("#social-topics-shell");
      if (!root) {
        return;
      }

      const el = {
        search: root.querySelector("#social-topic-search"),
        refresh: root.querySelector("#social-refresh-topics"),
        auth: root.querySelector("#social-auth-note"),
        topicList: root.querySelector("#social-topic-list"),
        topicName: root.querySelector("#social-topic-name"),
        topicDescription: root.querySelector("#social-topic-description"),
        topicRules: root.querySelector("#social-topic-rules"),
        createTopic: root.querySelector("#social-create-topic"),
        editTopic: root.querySelector("#social-edit-topic"),
        topicStatus: root.querySelector("#social-topic-status"),
        selectedTopic: root.querySelector("#social-selected-topic"),
        joinTopic: root.querySelector("#social-join-topic"),
        openTopic: root.querySelector("#social-open-topic"),
        topicDetail: root.querySelector("#social-topic-detail"),
        threadTitle: root.querySelector("#social-thread-title"),
        threadBody: root.querySelector("#social-thread-body"),
        createThread: root.querySelector("#social-create-thread"),
        threadStatus: root.querySelector("#social-thread-status"),
        threadList: root.querySelector("#social-thread-list"),
        threadWindow: root.querySelector("#social-thread-window"),
        closeThread: root.querySelector("#social-close-thread"),
        threadTitleView: root.querySelector("#social-thread-title-view"),
        threadBodyView: root.querySelector("#social-thread-body-view"),
        threadMetaView: root.querySelector("#social-thread-meta-view"),
        replyBody: root.querySelector("#social-reply-body"),
        createReply: root.querySelector("#social-create-reply"),
        replyStatus: root.querySelector("#social-reply-status"),
        replyList: root.querySelector("#social-reply-list")
      };

      const state = {
        user: null,
        topics: [],
        selectedTopicId: "",
        selectedTopic: null,
        topicMembership: null,
        threads: [],
        activeThreadId: "",
        activeThread: null,
        replies: [],
        replyParentId: "",
        throttleUntil: 0,
        lastCreateAt: 0,
        threadVoteTotals: new Map(),
        threadUserVotes: new Map(),
        replyVoteTotals: new Map(),
        replyUserVotes: new Map(),
        unsubThreadVotes: new Map(),
        unsubReplyVotes: new Map(),
        unsubTopics: null,
        unsubThreads: null,
        unsubReplies: null,
        unsubMembership: null,
        unsubAuth: null,
        observer: null
      };

      function setStatus(node, text, tone) {
        if (!node) {
          return;
        }
        node.textContent = text || "";
        node.classList.remove("nebula-social-error", "nebula-social-success");
        if (tone === "error") {
          node.classList.add("nebula-social-error");
        }
        if (tone === "success") {
          node.classList.add("nebula-social-success");
        }
      }

      function cleanInput(node) {
        return normalizeText(node && node.value || "");
      }

      function clearInput(node) {
        if (node) {
          node.value = "";
        }
      }

      function topicNameIsValid(value) {
        return /^[a-z0-9][a-z0-9-]{2,30}$/.test(value);
      }

      function assertClientThrottle(statusNode) {
        const now = Date.now();
        if (now < state.throttleUntil) {
          setStatus(statusNode, "Posting blocked. Wait a few seconds.", "error");
          return false;
        }
        if (state.lastCreateAt && (now - state.lastCreateAt) < 5000) {
          state.throttleUntil = now + 5000;
          setStatus(statusNode, "Rate limit hit. You are blocked for 5 seconds.", "error");
          return false;
        }
        return true;
      }

      function stampClientThrottle() {
        const now = Date.now();
        state.lastCreateAt = now;
        state.throttleUntil = now + 5000;
      }

      function authSync() {
        if (state.user) {
          el.auth.textContent = "Signed in as " + userLabel(state.user);
        } else {
          el.auth.textContent = "Sign in to post, reply, vote, and create Topics.";
        }
        const canUse = Boolean(state.user);
        el.createTopic.disabled = !canUse;
        el.createThread.disabled = !canUse;
        el.createReply.disabled = !canUse;
        el.joinTopic.disabled = !canUse || !state.selectedTopic;
      }

      function normalizeTopic(doc) {
        const data = doc.data() || {};
        return {
          id: doc.id,
          name: normalizeText(data.name).slice(0, 32),
          nameLower: normalizeText(data.nameLower).slice(0, 32),
          description: normalizeText(data.description).slice(0, 300),
          rules: normalizeText(data.rules).slice(0, 800),
          ownerId: String(data.ownerId || ""),
          ownerName: normalizeText(data.ownerName).slice(0, 60),
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null
        };
      }

      function normalizeThread(doc) {
        const data = doc.data() || {};
        return {
          id: doc.id,
          topicId: String(data.topicId || ""),
          title: normalizeText(data.title).slice(0, 160),
          body: normalizeText(data.body).slice(0, 4000),
          authorId: String(data.authorId || ""),
          authorName: normalizeText(data.authorName).slice(0, 60),
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          commentCount: Number(data.commentCount) || 0,
          deletedAt: data.deletedAt || null,
          deletedBy: String(data.deletedBy || "")
        };
      }

      function normalizeReply(doc) {
        const data = doc.data() || {};
        return {
          id: doc.id,
          parentId: String(data.parentId || ""),
          body: normalizeText(data.body).slice(0, 2000),
          authorId: String(data.authorId || ""),
          authorName: normalizeText(data.authorName).slice(0, 60),
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          deletedAt: data.deletedAt || null,
          deletedBy: String(data.deletedBy || "")
        };
      }

      function selectedTopicOwner() {
        return state.selectedTopic && state.selectedTopic.ownerId === (state.user && state.user.uid || "");
      }

      function canModerateTopic(topicId) {
        const topic = state.topics.find(function (item) {
          return item.id === topicId;
        });
        if (!topic || !state.user) {
          return false;
        }
        return topic.ownerId === state.user.uid;
      }

      function tallyVotes(snapshot) {
        let score = 0;
        let myVote = 0;
        snapshot.forEach(function (doc) {
          const data = doc.data() || {};
          const value = Number(data.value) || 0;
          if (value === 1 || value === -1) {
            score += value;
          }
          if (state.user && doc.id === state.user.uid && (value === 1 || value === -1)) {
            myVote = value;
          }
        });
        return { score: score, myVote: myVote };
      }

      function clearVoteWatchers(map) {
        map.forEach(function (unsub) {
          if (typeof unsub === "function") {
            unsub();
          }
        });
        map.clear();
      }

      function syncThreadVoteWatchers() {
        const activeIds = new Set(state.threads.map(function (thread) {
          return thread.id;
        }));

        state.unsubThreadVotes.forEach(function (unsub, threadId) {
          if (!activeIds.has(threadId)) {
            if (typeof unsub === "function") {
              unsub();
            }
            state.unsubThreadVotes.delete(threadId);
            state.threadVoteTotals.delete(threadId);
            state.threadUserVotes.delete(threadId);
          }
        });

        state.threads.forEach(function (thread) {
          if (state.unsubThreadVotes.has(thread.id)) {
            return;
          }
          const unsub = db.collection("feedThreads").doc(thread.id).collection("votes")
            .onSnapshot(function (snapshot) {
              const tally = tallyVotes(snapshot);
              state.threadVoteTotals.set(thread.id, tally.score);
              state.threadUserVotes.set(thread.id, tally.myVote);
              renderThreads();
            });
          state.unsubThreadVotes.set(thread.id, unsub);
        });
      }

      function syncReplyVoteWatchers() {
        const activeIds = new Set(state.replies.map(function (reply) {
          return reply.id;
        }));

        state.unsubReplyVotes.forEach(function (unsub, replyId) {
          if (!activeIds.has(replyId)) {
            if (typeof unsub === "function") {
              unsub();
            }
            state.unsubReplyVotes.delete(replyId);
            state.replyVoteTotals.delete(replyId);
            state.replyUserVotes.delete(replyId);
          }
        });

        if (!state.activeThread) {
          return;
        }

        state.replies.forEach(function (reply) {
          if (state.unsubReplyVotes.has(reply.id)) {
            return;
          }
          const unsub = db.collection("feedThreads").doc(state.activeThread.id)
            .collection("comments").doc(reply.id).collection("votes")
            .onSnapshot(function (snapshot) {
              const tally = tallyVotes(snapshot);
              state.replyVoteTotals.set(reply.id, tally.score);
              state.replyUserVotes.set(reply.id, tally.myVote);
              renderReplies();
            });
          state.unsubReplyVotes.set(reply.id, unsub);
        });
      }

      function renderTopics() {
        const queryText = normalizeText(el.search.value).toLowerCase();
        const filtered = queryText
          ? state.topics.filter(function (topic) {
              return topic.nameLower.includes(queryText) || topic.description.toLowerCase().includes(queryText);
            })
          : state.topics;

        if (!filtered.length) {
          el.topicList.innerHTML = "<div class=\"nebula-social-empty\">No Topics found.</div>";
          return;
        }

        el.topicList.innerHTML = filtered.map(function (topic) {
          const isActive = topic.id === state.selectedTopicId;
          const owner = topic.ownerName || "owner";
          const joined = Boolean(state.topicMembership) && state.selectedTopicId === topic.id;
          return ""
            + "<article class=\"nebula-topic-chip" + (isActive ? " active" : "") + "\" data-topic-id=\"" + escapeHtml(topic.id) + "\">"
            + "<h3>t/" + escapeHtml(topic.name) + "</h3>"
            + "<p>" + escapeHtml(topic.description || "No description") + "</p>"
            + "<div class=\"nebula-topic-meta\"><span>owner: " + escapeHtml(owner) + "</span><span>" + (joined ? "joined" : "") + "</span></div>"
            + "<div class=\"nebula-social-inline\">"
            + "<button type=\"button\" data-action=\"select-topic\" data-topic-id=\"" + escapeHtml(topic.id) + "\">Open</button>"
            + "</div>"
            + "</article>";
        }).join("");
      }

      function renderTopicDetail() {
        if (!state.selectedTopic) {
          el.selectedTopic.textContent = "Select a Topic";
          el.topicDetail.innerHTML = "<div class=\"nebula-social-empty\">Pick a Topic from the left to browse threads.</div>";
          el.joinTopic.disabled = true;
          el.openTopic.disabled = true;
          el.editTopic.disabled = true;
          return;
        }

        el.selectedTopic.textContent = "t/" + state.selectedTopic.name;
        el.joinTopic.disabled = !state.user;
        el.openTopic.disabled = false;

        const joined = Boolean(state.topicMembership);
        el.joinTopic.textContent = joined ? "Leave" : "Join";

        const isOwner = selectedTopicOwner();
        el.editTopic.disabled = !isOwner;
        if (isOwner) {
          el.topicName.value = state.selectedTopic.name;
          el.topicDescription.value = state.selectedTopic.description;
          el.topicRules.value = state.selectedTopic.rules;
        }

        el.topicDetail.innerHTML = ""
          + "<div class=\"nebula-thread-card\">"
          + "<div class=\"nebula-thread-card-meta\">t/" + escapeHtml(state.selectedTopic.name) + " • owner " + escapeHtml(state.selectedTopic.ownerName || "owner") + " • " + escapeHtml(relativeTime(state.selectedTopic.createdAt)) + "</div>"
          + "<div class=\"nebula-thread-markdown\">" + renderMarkdown(state.selectedTopic.description || "No description") + "</div>"
          + "<strong style=\"font-size:.76rem;letter-spacing:.09em;text-transform:uppercase\">Topic Rules</strong>"
          + "<div class=\"nebula-thread-markdown\">" + renderMarkdown(state.selectedTopic.rules || "No rules yet") + "</div>"
          + "</div>";
      }

      function renderThreads() {
        if (!state.selectedTopic) {
          el.threadList.innerHTML = "<div class=\"nebula-social-empty\">Choose a Topic to load threads.</div>";
          return;
        }

        if (!state.threads.length) {
          el.threadList.innerHTML = "<div class=\"nebula-social-empty\">No threads yet in this Topic.</div>";
          return;
        }

        el.threadList.innerHTML = state.threads.map(function (thread) {
          const mine = state.user && thread.authorId === state.user.uid;
          const mod = canModerateTopic(thread.topicId);
          const body = thread.deletedAt ? "[removed]" : thread.body;
          const score = Number(state.threadVoteTotals.get(thread.id) || 0);
          const myVote = Number(state.threadUserVotes.get(thread.id) || 0);
          return ""
            + "<article class=\"nebula-thread-card\" data-thread-id=\"" + escapeHtml(thread.id) + "\">"
            + "<div class=\"nebula-thread-card-meta\">by " + escapeHtml(thread.authorName || "member") + " • " + escapeHtml(relativeTime(thread.createdAt)) + " • " + escapeHtml(formatCount(thread.commentCount)) + " replies • score " + escapeHtml(formatCount(score)) + "</div>"
            + "<h3>" + escapeHtml(thread.title || "Untitled thread") + "</h3>"
            + "<div class=\"nebula-thread-markdown\">" + renderMarkdown(body) + "</div>"
            + "<div class=\"nebula-thread-actions\">"
            + "<button class=\"nebula-thread-action" + (myVote === 1 ? " active" : "") + "\" type=\"button\" data-action=\"upvote-thread\" data-thread-id=\"" + escapeHtml(thread.id) + "\">Upvote " + escapeHtml(formatCount(score)) + "</button>"
            + "<button class=\"nebula-thread-action" + (myVote === -1 ? " active" : "") + "\" type=\"button\" data-action=\"downvote-thread\" data-thread-id=\"" + escapeHtml(thread.id) + "\">Downvote</button>"
            + "<button class=\"nebula-thread-action\" type=\"button\" data-action=\"open-thread\" data-thread-id=\"" + escapeHtml(thread.id) + "\">Open</button>"
            + (mine ? "<button class=\"nebula-thread-action\" type=\"button\" data-action=\"edit-thread\" data-thread-id=\"" + escapeHtml(thread.id) + "\">Edit</button>" : "")
            + ((mine || mod) ? "<button class=\"nebula-thread-action\" type=\"button\" data-action=\"remove-thread\" data-thread-id=\"" + escapeHtml(thread.id) + "\">Remove</button>" : "")
            + "</div>"
            + "</article>";
        }).join("");
      }

      function renderReplies() {
        if (!state.activeThread) {
          el.replyList.innerHTML = "<div class=\"nebula-social-empty\">Thread closed.</div>";
          return;
        }

        if (!state.replies.length) {
          el.replyList.innerHTML = "<div class=\"nebula-social-empty\">No replies yet.</div>";
          return;
        }

        const byParent = new Map();
        state.replies.forEach(function (reply) {
          const key = reply.parentId || "__root__";
          if (!byParent.has(key)) {
            byParent.set(key, []);
          }
          byParent.get(key).push(reply);
        });

        function branch(parentId, depth) {
          return (byParent.get(parentId || "__root__") || []).map(function (reply) {
            const mine = state.user && reply.authorId === state.user.uid;
            const mod = state.activeThread ? canModerateTopic(state.activeThread.topicId) : false;
            const content = reply.deletedAt ? "[removed]" : reply.body;
            const score = Number(state.replyVoteTotals.get(reply.id) || 0);
            const myVote = Number(state.replyUserVotes.get(reply.id) || 0);
            return ""
              + "<article class=\"nebula-reply-card\" style=\"margin-left:" + (Math.min(depth, 6) * 18) + "px\">"
              + "<div class=\"nebula-reply-card-meta\">" + escapeHtml(reply.authorName || "member") + " • " + escapeHtml(relativeTime(reply.createdAt)) + " • score " + escapeHtml(formatCount(score)) + "</div>"
              + "<div class=\"nebula-thread-markdown\">" + renderMarkdown(content) + "</div>"
              + "<div class=\"nebula-reply-actions\">"
              + "<button class=\"nebula-reply-action\" type=\"button\" data-action=\"reply-to-reply\" data-reply-id=\"" + escapeHtml(reply.id) + "\">Reply</button>"
              + "<button class=\"nebula-reply-action" + (myVote === 1 ? " active" : "") + "\" type=\"button\" data-action=\"upvote-reply\" data-reply-id=\"" + escapeHtml(reply.id) + "\">Upvote " + escapeHtml(formatCount(score)) + "</button>"
              + "<button class=\"nebula-reply-action" + (myVote === -1 ? " active" : "") + "\" type=\"button\" data-action=\"downvote-reply\" data-reply-id=\"" + escapeHtml(reply.id) + "\">Downvote</button>"
              + (mine ? "<button class=\"nebula-reply-action\" type=\"button\" data-action=\"edit-reply\" data-reply-id=\"" + escapeHtml(reply.id) + "\">Edit</button>" : "")
              + ((mine || mod) ? "<button class=\"nebula-reply-action\" type=\"button\" data-action=\"remove-reply\" data-reply-id=\"" + escapeHtml(reply.id) + "\">Remove</button>" : "")
              + "</div>"
              + branch(reply.id, depth + 1)
              + "</article>";
          }).join("");
        }

        el.replyList.innerHTML = branch("", 0);
      }

      async function createTopic() {
        if (!state.user) {
          setStatus(el.topicStatus, "Sign in to create Topics.", "error");
          return;
        }

        const nameInput = cleanInput(el.topicName).toLowerCase();
        const description = cleanInput(el.topicDescription).slice(0, 300);
        const rules = cleanInput(el.topicRules).slice(0, 800);

        if (!topicNameIsValid(nameInput)) {
          setStatus(el.topicStatus, "Topic name must be 3-31 chars, lowercase letters/numbers/hyphen.", "error");
          return;
        }
        if (!description || !rules) {
          setStatus(el.topicStatus, "Topic description and rules are required.", "error");
          return;
        }

        if (!assertClientThrottle(el.topicStatus)) {
          return;
        }

        const duplicate = state.topics.some(function (topic) {
          return topic.nameLower === nameInput;
        });
        if (duplicate) {
          setStatus(el.topicStatus, "That Topic name is already taken.", "error");
          return;
        }

        el.createTopic.disabled = true;
        setStatus(el.topicStatus, "Creating Topic...");

        try {
          const topicRef = db.collection("feedTopics").doc();
          const nameRef = db.collection("feedTopicNames").doc(nameInput);
          const memberRef = topicRef.collection("members").doc(state.user.uid);
          const rateRef = db.collection("feedRateLimits").doc(state.user.uid);
          const serverTime = fieldValue.serverTimestamp();
          const batch = db.batch();

          batch.set(nameRef, {
            nameLower: nameInput,
            topicId: topicRef.id,
            ownerId: state.user.uid,
            createdAt: serverTime
          });

          batch.set(topicRef, {
            name: nameInput,
            nameLower: nameInput,
            description: description,
            rules: rules,
            ownerId: state.user.uid,
            ownerName: userLabel(state.user),
            createdAt: serverTime,
            updatedAt: serverTime
          });

          batch.set(memberRef, {
            uid: state.user.uid,
            role: "owner",
            favorite: true,
            joinedAt: serverTime,
            updatedAt: serverTime
          });

          batch.set(rateRef, {
            uid: state.user.uid,
            lastCreatedAt: serverTime,
            updatedAt: serverTime
          }, { merge: true });

          await batch.commit();
          stampClientThrottle();
          setStatus(el.topicStatus, "Topic created.", "success");
          clearInput(el.topicName);
          clearInput(el.topicDescription);
          clearInput(el.topicRules);
        } catch (error) {
          setStatus(el.topicStatus, "Could not create Topic. " + (error && error.message ? error.message : ""), "error");
        } finally {
          el.createTopic.disabled = false;
        }
      }

      async function saveTopicEdits() {
        if (!state.user || !state.selectedTopic || !selectedTopicOwner()) {
          setStatus(el.topicStatus, "Only Topic owner can edit Topic details.", "error");
          return;
        }

        const nextName = cleanInput(el.topicName).toLowerCase();
        const nextDescription = cleanInput(el.topicDescription).slice(0, 300);
        const nextRules = cleanInput(el.topicRules).slice(0, 800);
        if (!topicNameIsValid(nextName)) {
          setStatus(el.topicStatus, "Topic name format is invalid.", "error");
          return;
        }
        if (!nextDescription || !nextRules) {
          setStatus(el.topicStatus, "Topic description and rules cannot be empty.", "error");
          return;
        }

        const duplicate = state.topics.some(function (topic) {
          return topic.id !== state.selectedTopic.id && topic.nameLower === nextName;
        });
        if (duplicate) {
          setStatus(el.topicStatus, "That Topic name already exists.", "error");
          return;
        }

        setStatus(el.topicStatus, "Saving Topic...");
        el.editTopic.disabled = true;

        try {
          const topicRef = db.collection("feedTopics").doc(state.selectedTopic.id);
          const batch = db.batch();
          const serverTime = fieldValue.serverTimestamp();
          if (nextName !== state.selectedTopic.nameLower) {
            const oldNameRef = db.collection("feedTopicNames").doc(state.selectedTopic.nameLower);
            const nextNameRef = db.collection("feedTopicNames").doc(nextName);
            batch.set(nextNameRef, {
              nameLower: nextName,
              topicId: state.selectedTopic.id,
              ownerId: state.user.uid,
              createdAt: serverTime
            });
            batch.delete(oldNameRef);
          }
          batch.update(topicRef, {
            name: nextName,
            nameLower: nextName,
            description: nextDescription,
            rules: nextRules,
            updatedAt: serverTime
          });
          await batch.commit();
          setStatus(el.topicStatus, "Topic updated.", "success");
        } catch (error) {
          setStatus(el.topicStatus, "Could not update Topic. " + (error && error.message ? error.message : ""), "error");
        } finally {
          el.editTopic.disabled = false;
        }
      }

      function watchMembership(topicId) {
        if (state.unsubMembership) {
          state.unsubMembership();
          state.unsubMembership = null;
        }
        if (!state.user || !topicId) {
          state.topicMembership = null;
          renderTopics();
          renderTopicDetail();
          return;
        }
        state.unsubMembership = db.collection("feedTopics").doc(topicId).collection("members").doc(state.user.uid)
          .onSnapshot(function (snap) {
            state.topicMembership = snap.exists ? (snap.data() || null) : null;
            renderTopics();
            renderTopicDetail();
          });
      }

      async function toggleJoin() {
        if (!state.user || !state.selectedTopic) {
          return;
        }
        if (selectedTopicOwner()) {
          setStatus(el.topicStatus, "Owner is always joined to this Topic.", "error");
          return;
        }
        const memberRef = db.collection("feedTopics").doc(state.selectedTopic.id).collection("members").doc(state.user.uid);
        const serverTime = fieldValue.serverTimestamp();
        try {
          if (state.topicMembership) {
            await memberRef.delete();
          } else {
            await memberRef.set({
              uid: state.user.uid,
              role: "member",
              favorite: true,
              joinedAt: serverTime,
              updatedAt: serverTime
            });
          }
        } catch (error) {
          setStatus(el.topicStatus, "Could not change membership. " + (error && error.message ? error.message : ""), "error");
        }
      }

      function openThread(threadId) {
        const next = state.threads.find(function (thread) {
          return thread.id === threadId;
        });
        if (!next) {
          return;
        }
        state.activeThreadId = threadId;
        state.activeThread = next;
        state.replyParentId = "";
        el.threadWindow.classList.remove("hidden");
        el.threadTitleView.textContent = next.title || "Thread";
        el.threadBodyView.innerHTML = renderMarkdown(next.deletedAt ? "[removed]" : next.body);
        el.threadMetaView.textContent = "by " + (next.authorName || "member") + " • " + relativeTime(next.createdAt);
        if (state.unsubReplies) {
          state.unsubReplies();
        }
        state.unsubReplies = db.collection("feedThreads").doc(threadId).collection("comments").orderBy("createdAt", "asc").limit(400)
          .onSnapshot(function (snapshot) {
            state.replies = snapshot.docs.map(normalizeReply);
            syncReplyVoteWatchers();
            renderReplies();
          });
      }

      function closeThread() {
        state.activeThreadId = "";
        state.activeThread = null;
        state.replies = [];
        state.replyParentId = "";
        clearInput(el.replyBody);
        setStatus(el.replyStatus, "");
        el.threadWindow.classList.add("hidden");
        el.replyList.innerHTML = "";
        if (state.unsubReplies) {
          state.unsubReplies();
          state.unsubReplies = null;
        }
        clearVoteWatchers(state.unsubReplyVotes);
        state.replyVoteTotals.clear();
        state.replyUserVotes.clear();
      }

      async function createThread() {
        if (!state.user) {
          setStatus(el.threadStatus, "Sign in to post threads.", "error");
          return;
        }
        if (!state.selectedTopic) {
          setStatus(el.threadStatus, "Select a Topic first.", "error");
          return;
        }
        if (!assertClientThrottle(el.threadStatus)) {
          return;
        }

        const title = cleanInput(el.threadTitle).slice(0, 160);
        const body = cleanInput(el.threadBody).slice(0, 4000);
        if (!title || !body) {
          setStatus(el.threadStatus, "Thread title and body are required.", "error");
          return;
        }

        el.createThread.disabled = true;
        setStatus(el.threadStatus, "Posting thread...");

        try {
          const threadRef = db.collection("feedThreads").doc();
          const rateRef = db.collection("feedRateLimits").doc(state.user.uid);
          const serverTime = fieldValue.serverTimestamp();
          const batch = db.batch();
          batch.set(threadRef, {
            topicId: state.selectedTopic.id,
            title: title,
            body: body,
            authorId: state.user.uid,
            authorName: userLabel(state.user),
            createdAt: serverTime,
            updatedAt: serverTime,
            commentCount: 0,
            deletedAt: null,
            deletedBy: ""
          });
          batch.set(rateRef, {
            uid: state.user.uid,
            lastCreatedAt: serverTime,
            updatedAt: serverTime
          }, { merge: true });
          await batch.commit();
          stampClientThrottle();
          clearInput(el.threadTitle);
          clearInput(el.threadBody);
          setStatus(el.threadStatus, "Thread posted.", "success");
        } catch (error) {
          setStatus(el.threadStatus, "Could not post thread. " + (error && error.message ? error.message : ""), "error");
        } finally {
          el.createThread.disabled = false;
        }
      }

      async function createReply() {
        if (!state.user || !state.activeThread) {
          setStatus(el.replyStatus, "Open a thread to reply.", "error");
          return;
        }
        if (!assertClientThrottle(el.replyStatus)) {
          return;
        }

        const body = cleanInput(el.replyBody).slice(0, 2000);
        if (!body) {
          setStatus(el.replyStatus, "Reply body is required.", "error");
          return;
        }

        el.createReply.disabled = true;
        setStatus(el.replyStatus, "Posting reply...");

        try {
          const threadRef = db.collection("feedThreads").doc(state.activeThread.id);
          const replyRef = threadRef.collection("comments").doc();
          const rateRef = db.collection("feedRateLimits").doc(state.user.uid);
          const serverTime = fieldValue.serverTimestamp();
          const batch = db.batch();

          batch.set(replyRef, {
            parentId: state.replyParentId || "",
            body: body,
            authorId: state.user.uid,
            authorName: userLabel(state.user),
            createdAt: serverTime,
            updatedAt: serverTime,
            deletedAt: null,
            deletedBy: ""
          });
          batch.update(threadRef, {
            commentCount: fieldValue.increment(1),
            updatedAt: serverTime
          });
          batch.set(rateRef, {
            uid: state.user.uid,
            lastCreatedAt: serverTime,
            updatedAt: serverTime
          }, { merge: true });
          await batch.commit();
          stampClientThrottle();
          clearInput(el.replyBody);
          state.replyParentId = "";
          setStatus(el.replyStatus, "Reply posted.", "success");
        } catch (error) {
          setStatus(el.replyStatus, "Could not post reply. " + (error && error.message ? error.message : ""), "error");
        } finally {
          el.createReply.disabled = false;
        }
      }

      async function voteThread(threadId, value) {
        if (!state.user) {
          setStatus(el.threadStatus, "Sign in to vote.", "error");
          return;
        }
        try {
          const voteRef = db.collection("feedThreads").doc(threadId).collection("votes").doc(state.user.uid);
          await voteRef.set({ uid: state.user.uid, value: value, updatedAt: fieldValue.serverTimestamp() }, { merge: true });
          setStatus(el.threadStatus, "Vote saved.", "success");
        } catch (error) {
          setStatus(el.threadStatus, "Vote failed. " + (error && error.message ? error.message : ""), "error");
        }
      }

      async function voteReply(replyId, value) {
        if (!state.user || !state.activeThread) {
          setStatus(el.replyStatus, "Sign in to vote.", "error");
          return;
        }
        try {
          const voteRef = db.collection("feedThreads").doc(state.activeThread.id).collection("comments").doc(replyId).collection("votes").doc(state.user.uid);
          await voteRef.set({ uid: state.user.uid, value: value, updatedAt: fieldValue.serverTimestamp() }, { merge: true });
          setStatus(el.replyStatus, "Vote saved.", "success");
        } catch (error) {
          setStatus(el.replyStatus, "Vote failed. " + (error && error.message ? error.message : ""), "error");
        }
      }

      async function editThread(threadId) {
        if (!state.user) {
          return;
        }
        const thread = state.threads.find(function (item) {
          return item.id === threadId;
        });
        if (!thread || thread.authorId !== state.user.uid) {
          setStatus(el.threadStatus, "You can only edit your own thread.", "error");
          return;
        }
        const nextTitle = cleanInput(el.threadTitle).slice(0, 160) || thread.title;
        const nextBody = cleanInput(el.threadBody).slice(0, 4000) || thread.body;
        try {
          await db.collection("feedThreads").doc(threadId).update({
            title: nextTitle,
            body: nextBody,
            updatedAt: fieldValue.serverTimestamp()
          });
          setStatus(el.threadStatus, "Thread edited.", "success");
        } catch (error) {
          setStatus(el.threadStatus, "Edit failed. " + (error && error.message ? error.message : ""), "error");
        }
      }

      async function editReply(replyId) {
        if (!state.user || !state.activeThread) {
          return;
        }
        const reply = state.replies.find(function (item) {
          return item.id === replyId;
        });
        if (!reply || reply.authorId !== state.user.uid) {
          setStatus(el.replyStatus, "You can only edit your own reply.", "error");
          return;
        }
        const nextBody = cleanInput(el.replyBody).slice(0, 2000) || reply.body;
        try {
          await db.collection("feedThreads").doc(state.activeThread.id).collection("comments").doc(replyId).update({
            body: nextBody,
            updatedAt: fieldValue.serverTimestamp()
          });
          setStatus(el.replyStatus, "Reply edited.", "success");
        } catch (error) {
          setStatus(el.replyStatus, "Edit failed. " + (error && error.message ? error.message : ""), "error");
        }
      }

      async function removeThread(threadId) {
        if (!state.user) {
          return;
        }
        const thread = state.threads.find(function (item) {
          return item.id === threadId;
        });
        if (!thread) {
          return;
        }
        const mine = thread.authorId === state.user.uid;
        const mod = canModerateTopic(thread.topicId);
        if (!mine && !mod) {
          setStatus(el.threadStatus, "You cannot remove this thread.", "error");
          return;
        }
        try {
          await db.collection("feedThreads").doc(threadId).update({
            body: "[removed by moderator]",
            deletedAt: fieldValue.serverTimestamp(),
            deletedBy: state.user.uid,
            updatedAt: fieldValue.serverTimestamp()
          });
          setStatus(el.threadStatus, "Thread removed.", "success");
        } catch (error) {
          setStatus(el.threadStatus, "Remove failed. " + (error && error.message ? error.message : ""), "error");
        }
      }

      async function removeReply(replyId) {
        if (!state.user || !state.activeThread) {
          return;
        }
        const reply = state.replies.find(function (item) {
          return item.id === replyId;
        });
        if (!reply) {
          return;
        }
        const mine = reply.authorId === state.user.uid;
        const mod = canModerateTopic(state.activeThread.topicId);
        if (!mine && !mod) {
          setStatus(el.replyStatus, "You cannot remove this reply.", "error");
          return;
        }
        try {
          await db.collection("feedThreads").doc(state.activeThread.id).collection("comments").doc(replyId).update({
            body: "[removed by moderator]",
            deletedAt: fieldValue.serverTimestamp(),
            deletedBy: state.user.uid,
            updatedAt: fieldValue.serverTimestamp()
          });
          setStatus(el.replyStatus, "Reply removed.", "success");
        } catch (error) {
          setStatus(el.replyStatus, "Remove failed. " + (error && error.message ? error.message : ""), "error");
        }
      }

      function selectTopic(topicId) {
        state.selectedTopicId = topicId;
        state.selectedTopic = state.topics.find(function (topic) {
          return topic.id === topicId;
        }) || null;
        renderTopics();
        renderTopicDetail();
        watchMembership(topicId);

        if (state.unsubThreads) {
          state.unsubThreads();
          state.unsubThreads = null;
        }

        if (!topicId) {
          state.threads = [];
          clearVoteWatchers(state.unsubThreadVotes);
          state.threadVoteTotals.clear();
          state.threadUserVotes.clear();
          renderThreads();
          closeThread();
          return;
        }

        state.unsubThreads = db.collection("feedThreads")
          .where("topicId", "==", topicId)
          .orderBy("updatedAt", "desc")
          .limit(80)
          .onSnapshot(function (snapshot) {
            state.threads = snapshot.docs.map(normalizeThread);
            syncThreadVoteWatchers();
            renderThreads();
            if (state.activeThreadId) {
              const nextActive = state.threads.find(function (thread) {
                return thread.id === state.activeThreadId;
              }) || null;
              if (nextActive) {
                state.activeThread = nextActive;
                el.threadTitleView.textContent = nextActive.title || "Thread";
                el.threadBodyView.innerHTML = renderMarkdown(nextActive.deletedAt ? "[removed]" : nextActive.body);
                el.threadMetaView.textContent = "by " + (nextActive.authorName || "member") + " • " + relativeTime(nextActive.createdAt);
              } else {
                closeThread();
              }
            }
          });
      }

      function teardown() {
        if (state.unsubTopics) {
          state.unsubTopics();
        }
        if (state.unsubThreads) {
          state.unsubThreads();
        }
        if (state.unsubReplies) {
          state.unsubReplies();
        }
        clearVoteWatchers(state.unsubThreadVotes);
        clearVoteWatchers(state.unsubReplyVotes);
        if (state.unsubMembership) {
          state.unsubMembership();
        }
        if (state.unsubAuth) {
          state.unsubAuth();
        }
        if (state.observer) {
          state.observer.disconnect();
        }
      }

      window.NebulaTopicsRoute = { teardown: teardown };

      state.observer = new MutationObserver(function () {
        if (!document.body.contains(root)) {
          teardown();
        }
      });
      state.observer.observe(document.body, { childList: true, subtree: true });

      el.refresh.addEventListener("click", function () {
        renderTopics();
      });

      el.search.addEventListener("input", function () {
        renderTopics();
      });

      el.createTopic.addEventListener("click", createTopic);
      el.editTopic.addEventListener("click", saveTopicEdits);
      el.joinTopic.addEventListener("click", toggleJoin);
      el.openTopic.addEventListener("click", function () {
        if (!state.selectedTopic) {
          return;
        }
        const first = state.threads[0];
        if (first) {
          openThread(first.id);
        }
      });
      el.createThread.addEventListener("click", createThread);
      el.createReply.addEventListener("click", createReply);
      el.closeThread.addEventListener("click", closeThread);

      el.topicList.addEventListener("click", function (event) {
        const button = event.target.closest('[data-action="select-topic"]');
        if (!button) {
          return;
        }
        const topicId = button.getAttribute("data-topic-id") || "";
        if (!topicId) {
          return;
        }
        selectTopic(topicId);
      });

      el.threadList.addEventListener("click", function (event) {
        const button = event.target.closest("[data-action]");
        if (!button) {
          return;
        }
        const action = button.getAttribute("data-action") || "";
        const threadId = button.getAttribute("data-thread-id") || "";
        if (!threadId) {
          return;
        }
        if (action === "open-thread") {
          openThread(threadId);
        }
        if (action === "upvote-thread") {
          voteThread(threadId, 1);
        }
        if (action === "downvote-thread") {
          voteThread(threadId, -1);
        }
        if (action === "edit-thread") {
          editThread(threadId);
        }
        if (action === "remove-thread") {
          removeThread(threadId);
        }
      });

      el.replyList.addEventListener("click", function (event) {
        const button = event.target.closest("[data-action]");
        if (!button) {
          return;
        }
        const action = button.getAttribute("data-action") || "";
        const replyId = button.getAttribute("data-reply-id") || "";
        if (!replyId) {
          return;
        }
        if (action === "reply-to-reply") {
          state.replyParentId = replyId;
          el.replyBody.focus();
          setStatus(el.replyStatus, "Replying to nested comment.");
        }
        if (action === "upvote-reply") {
          voteReply(replyId, 1);
        }
        if (action === "downvote-reply") {
          voteReply(replyId, -1);
        }
        if (action === "edit-reply") {
          editReply(replyId);
        }
        if (action === "remove-reply") {
          removeReply(replyId);
        }
      });

      state.unsubTopics = db.collection("feedTopics").orderBy("nameLower", "asc").limit(200)
        .onSnapshot(function (snapshot) {
          state.topics = snapshot.docs.map(normalizeTopic);
          if (state.selectedTopicId) {
            const found = state.topics.find(function (topic) {
              return topic.id === state.selectedTopicId;
            }) || null;
            state.selectedTopic = found;
            if (!found) {
              state.selectedTopicId = "";
            }
          }
          renderTopics();
          renderTopicDetail();
        });

      state.unsubAuth = auth.onAuthStateChanged(function (user) {
        state.user = user || null;
        authSync();
        if (state.selectedTopicId) {
          watchMembership(state.selectedTopicId);
        } else {
          watchMembership("");
        }
      });

      authSync();
      renderTopics();
      renderTopicDetail();
      renderThreads();
    }
  };
})();