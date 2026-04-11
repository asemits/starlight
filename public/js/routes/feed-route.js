(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};
  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  function rich(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  modules["/feed"] = {
    render: function renderFeedRoute() {
      return `
        <style>
          .feed-route{--bg:#050505;--panel:rgba(255,255,255,.08);--panel2:rgba(255,255,255,.12);--border:rgba(255,255,255,.14);--text:rgba(255,255,255,.96);--muted:rgba(255,255,255,.64);color:var(--text);font-family:"DM Sans","Segoe UI",sans-serif}
          .feed-route *{box-sizing:border-box}.feed-shell{width:min(1440px,100%);margin:0 auto;display:grid;grid-template-columns:minmax(220px,.88fr) minmax(0,1.7fr) minmax(250px,1fr);gap:20px;align-items:start}
          .feed-panel{position:relative;overflow:hidden;border-radius:28px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04)),linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 30px 90px rgba(0,0,0,.55);backdrop-filter:blur(24px) saturate(135%);-webkit-backdrop-filter:blur(24px) saturate(135%)}
          .feed-panel:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(255,255,255,.18),transparent 42%),radial-gradient(circle at bottom left,rgba(255,255,255,.08),transparent 36%);pointer-events:none}.feed-panel>*{position:relative;z-index:1}
          .feed-brand,.feed-block,.feed-composer,.feed-hero,.feed-modal-head,.feed-modal-body,.feed-modal-foot{padding:22px}.feed-brand-mark,.feed-avatar{display:inline-flex;align-items:center;justify-content:center}
          .feed-brand-mark{width:54px;height:54px;border-radius:18px;border:1px solid rgba(255,255,255,.24);background:linear-gradient(145deg,rgba(255,255,255,.22),rgba(255,255,255,.08));color:#050505;font-size:24px;margin-bottom:16px}
          .feed-brand h1,.feed-title,.feed-modal-card h3,.feed-thread-post h4{margin:0;font-family:"Bebas Neue","Segoe UI",sans-serif;letter-spacing:.08em;text-transform:uppercase}
          .feed-brand h1{font-size:34px}.feed-copy,.feed-meta,.feed-note,.feed-status,.feed-thread-meta,.feed-summary-label{margin:0;color:var(--muted);line-height:1.65}
          .feed-brand .feed-copy{margin-top:10px;font-size:14px}.feed-list,.feed-grid,.feed-topic-list,.feed-thread-list{display:grid;gap:16px}.feed-hero{display:grid;gap:16px;background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.05)),radial-gradient(circle at top left,rgba(255,255,255,.15),transparent 42%),#050505}
          .feed-hero-top,.feed-composer-top,.feed-meta-row,.feed-actions,.feed-post-meta,.feed-comment-head,.feed-modal-head,.feed-modal-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
          .feed-title{font-size:clamp(34px,5vw,54px);line-height:.92}.feed-pill,.feed-tag,.feed-chip{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:var(--text);text-transform:uppercase;letter-spacing:.08em;font-size:11px;font-weight:700}
          .feed-chip.active{background:#fff;color:#050505;box-shadow:0 14px 34px rgba(255,255,255,.18)}.feed-block h2,.feed-composer h2{margin:0 0 14px;font-family:"Bebas Neue","Segoe UI",sans-serif;letter-spacing:.08em;text-transform:uppercase;font-size:22px}
          .feed-topic-list{grid-template-columns:1fr}.feed-chip{justify-content:flex-start}.feed-composer-surface,.feed-thread-form{display:grid;gap:12px;padding:16px;border-radius:24px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(0,0,0,.3),rgba(255,255,255,.04)),rgba(0,0,0,.34)}
          .feed-editor{min-height:60px;padding:15px 17px;border-radius:22px;border:1px solid transparent;background:rgba(255,255,255,.06);outline:none;color:var(--text);white-space:pre-wrap;word-break:break-word;transition:border-color .22s ease,background .22s ease,transform .22s ease}
          .feed-editor:focus{border-color:rgba(255,255,255,.32);background:rgba(255,255,255,.1);transform:translateY(-1px)}.feed-editor[contenteditable="false"]{opacity:.55;pointer-events:none}
          .feed-editor:empty:before{content:attr(data-placeholder);color:rgba(255,255,255,.42)}.feed-editor.title{font-size:22px;font-weight:700;min-height:56px}.feed-editor.body{min-height:140px;line-height:1.7;font-size:15px}.feed-editor.comment{min-height:108px}
          .feed-button,.feed-ghost,.feed-icon,.feed-post-actions button{appearance:none;border-radius:999px;font:inherit;cursor:pointer;transition:transform .22s ease,opacity .22s ease,border-color .22s ease,background .22s ease}.feed-button:hover,.feed-ghost:hover,.feed-icon:hover,.feed-post-actions button:hover{transform:translateY(-1px)}
          .feed-button:disabled,.feed-ghost:disabled,.feed-icon:disabled,.feed-post-actions button:disabled{opacity:.45;cursor:not-allowed;transform:none}.feed-button{padding:13px 22px;border:1px solid #fff;background:#fff;color:#050505;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.feed-ghost,.feed-post-actions button{padding:11px 16px;border:1px solid var(--border);background:rgba(255,255,255,.06);color:var(--text)}.feed-icon{width:42px;height:42px;border:1px solid var(--border);background:rgba(255,255,255,.06);color:var(--text)}
          .feed-post{padding:20px 22px;display:grid;grid-template-columns:52px minmax(0,1fr);gap:16px}.feed-votes{display:grid;justify-items:center;gap:8px;padding-top:2px}.feed-vote{width:40px;height:40px;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.06);display:inline-flex;align-items:center;justify-content:center;color:var(--text)}
          .feed-score{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.74)}.feed-post-card,.feed-comment-card{display:grid;gap:12px;min-width:0}.feed-avatar{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(145deg,rgba(255,255,255,.24),rgba(255,255,255,.08));color:#050505;font-size:14px;font-weight:800;flex:0 0 auto}
          .feed-post-title{margin:0;font-size:clamp(22px,2vw,30px);line-height:1;color:#fff;font-weight:800;cursor:pointer}.feed-copy{font-size:15px;color:rgba(255,255,255,.8)}.feed-summary{grid-template-columns:repeat(2,minmax(0,1fr))}
          .feed-stat{padding:16px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}.feed-summary-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}.feed-summary-value{margin:0;color:#fff;font-size:24px;font-weight:800}
          .feed-empty{text-align:center;padding:40px 24px}.feed-empty h2{margin:0 0 10px;font-family:"Bebas Neue","Segoe UI",sans-serif;letter-spacing:.08em;text-transform:uppercase;font-size:28px}
          .feed-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.72);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:45}.feed-modal.open{display:flex}
          .feed-modal-card{width:min(980px,100%);max-height:min(88vh,980px);overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr) auto;border-radius:30px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04)),rgba(4,4,4,.96);box-shadow:0 38px 100px rgba(0,0,0,.62);backdrop-filter:blur(28px) saturate(140%);-webkit-backdrop-filter:blur(28px) saturate(140%)}
          .feed-modal-head,.feed-modal-foot{border-bottom:1px solid rgba(255,255,255,.08)}.feed-modal-foot{border-bottom:none;border-top:1px solid rgba(255,255,255,.08)}.feed-modal-body{overflow:auto;display:grid;gap:16px}.feed-thread-post{padding:18px;border-radius:24px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05)}.feed-thread-post h4{font-size:28px;margin-bottom:10px}
          .feed-thread-meta,.feed-reply-target{min-height:18px}.feed-comment-card{padding:16px 16px 16px calc(16px + (var(--depth,0) * 18px));border-radius:22px;border:1px solid rgba(255,255,255,.09);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03)),rgba(0,0,0,.22)}.feed-comment-body{margin:0;color:rgba(255,255,255,.8);line-height:1.75}
          @media (max-width:1180px){.feed-shell{grid-template-columns:minmax(0,1fr)}.feed-side,.feed-rail{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.feed-summary{grid-template-columns:repeat(4,minmax(0,1fr))}}
          @media (max-width:760px){.feed-hero-top,.feed-composer-top,.feed-meta-row,.feed-modal-head,.feed-modal-foot{flex-direction:column;align-items:flex-start}.feed-post{grid-template-columns:1fr}.feed-votes{grid-auto-flow:column;justify-content:flex-start}.feed-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.feed-modal{padding:12px}.feed-modal-card{max-height:92vh}}
        </style>
        <section class="feed-route">
          <div class="feed-shell">
            <aside class="feed-side feed-grid">
              <section class="feed-panel feed-brand"><div class="feed-brand-mark"><i class="fa-solid fa-comments"></i></div><h1>Nebula Feed</h1><p class="feed-copy">Reddit-style discussion flow, rebuilt with a black glass theme, rounded panels, gradients, and Firestore-backed live threads.</p></section>
              <section class="feed-panel feed-block"><h2>Communities</h2><div class="feed-topic-list"><div class="feed-chip"><i class="fa-solid fa-sparkles"></i><span>r/nebula</span></div><div class="feed-chip"><i class="fa-solid fa-gamepad"></i><span>r/gaming</span></div><div class="feed-chip"><i class="fa-solid fa-music"></i><span>r/music</span></div><div class="feed-chip"><i class="fa-solid fa-code"></i><span>r/builds</span></div></div></section>
              <section class="feed-panel feed-block"><h2>Posting Flow</h2><p class="feed-copy">Use the two typable surfaces for the post title and body, then open any card to reply inside the thread modal.</p></section>
            </aside>
            <main class="feed-grid">
              <section class="feed-panel feed-hero"><div class="feed-hero-top"><div><h2 class="feed-title">Discussion, rebuilt.</h2><p class="feed-copy">A familiar conversation-first feed with white accents over black backgrounds, glassmorphism, and live Firestore updates.</p></div><div class="feed-pill"><span style="width:10px;height:10px;border-radius:999px;background:#fff;box-shadow:0 0 18px rgba(255,255,255,.85)"></span><span>Live Firestore</span></div></div><div class="feed-meta-row"><div class="feed-chip active">Newest</div><div class="feed-chip">Discussions</div><div class="feed-chip">Threaded Replies</div></div></section>
              <section class="feed-panel feed-composer"><div class="feed-composer-top"><h2>Create Post</h2><span class="feed-tag">r/nebula</span></div><div class="feed-composer-surface"><div id="feed-title-editor" class="feed-editor title" contenteditable="true" spellcheck="true" data-placeholder="Title"></div><div id="feed-body-editor" class="feed-editor body" contenteditable="true" spellcheck="true" data-placeholder="What do you want to share?"></div></div><div class="feed-meta-row"><p id="feed-auth-note" class="feed-note">Checking your session...</p><div class="feed-actions"><button id="feed-clear" class="feed-ghost" type="button">Clear</button><button id="feed-submit" class="feed-button" type="button">Publish</button></div></div><p id="feed-status" class="feed-status"></p></section>
              <section id="feed-post-list" class="feed-list" aria-live="polite"></section>
            </main>
            <aside class="feed-rail feed-grid">
              <section class="feed-panel feed-block"><h2>Live Snapshot</h2><div class="feed-grid feed-summary"><div class="feed-stat"><p class="feed-summary-label">Posts</p><p id="feed-total-posts" class="feed-summary-value">0</p></div><div class="feed-stat"><p class="feed-summary-label">Replies</p><p id="feed-total-comments" class="feed-summary-value">0</p></div><div class="feed-stat"><p class="feed-summary-label">Signed In</p><p id="feed-session-state" class="feed-summary-value">...</p></div><div class="feed-stat"><p class="feed-summary-label">Community</p><p class="feed-summary-value">r/neb</p></div></div></section>
              <section class="feed-panel feed-block"><h2>Build Notes</h2><p class="feed-copy">This route uses the app’s existing authenticated Firebase app, stores posts in Firestore, and uses modal thread replies instead of browser prompts.</p></section>
            </aside>
          </div>
          <div id="feed-modal" class="feed-modal" aria-hidden="true"><div class="feed-modal-card"><div class="feed-modal-head"><div><h3>Thread</h3><p id="feed-modal-subtitle" class="feed-note">Live discussion</p></div><button id="feed-close-modal" class="feed-icon" type="button" aria-label="Close thread"><i class="fa-solid fa-xmark"></i></button></div><div class="feed-modal-body"><article id="feed-thread-post" class="feed-thread-post"></article><div><p id="feed-thread-meta" class="feed-thread-meta"></p><p id="feed-reply-target" class="feed-reply-target"></p></div><div id="feed-thread-list" class="feed-thread-list"></div></div><div class="feed-modal-foot"><div class="feed-thread-form" style="width:min(100%,640px)"><div id="feed-comment-editor" class="feed-editor comment" contenteditable="true" spellcheck="true" data-placeholder="Join the thread"></div><p id="feed-thread-status" class="feed-status"></p></div><div class="feed-actions"><button id="feed-clear-reply" class="feed-ghost" type="button">Clear Reply</button><button id="feed-submit-comment" class="feed-button" type="button">Reply</button></div></div></div></div>
        </section>
      `;
    },
    afterRender: async function afterRenderFeedRoute() {
const fb = window['firebase'];

    if (!fb || typeof fb.firestore !== "function") {
        console.error("CRITICAL: The firebase object exists but .firestore was wiped out by another script.");
        console.log("Current firebase object keys:", Object.keys(fb || {}));
        return;
    }

    const db = fb.firestore();
    const fieldValue = fb.firestore.FieldValue;
    const auth = fb.auth();

      // 3. Setup
      if (window.NebulaFeedRoute && typeof window.NebulaFeedRoute.teardown === "function") 
        window.NebulaFeedRoute.teardown();

      const root = document.querySelector(".feed-route");
      if (!root) return;
      const posts = db.collection("feedPosts");
      const el = {
        title: root.querySelector("#feed-title-editor"), body: root.querySelector("#feed-body-editor"), auth: root.querySelector("#feed-auth-note"),
        status: root.querySelector("#feed-status"), list: root.querySelector("#feed-post-list"), submit: root.querySelector("#feed-submit"),
        clear: root.querySelector("#feed-clear"), totalPosts: root.querySelector("#feed-total-posts"), totalComments: root.querySelector("#feed-total-comments"),
        session: root.querySelector("#feed-session-state"), modal: root.querySelector("#feed-modal"), modalSubtitle: root.querySelector("#feed-modal-subtitle"),
        threadPost: root.querySelector("#feed-thread-post"), threadMeta: root.querySelector("#feed-thread-meta"), replyTarget: root.querySelector("#feed-reply-target"),
        threadList: root.querySelector("#feed-thread-list"), comment: root.querySelector("#feed-comment-editor"), threadStatus: root.querySelector("#feed-thread-status"),
        submitComment: root.querySelector("#feed-submit-comment"), clearReply: root.querySelector("#feed-clear-reply"), closeModal: root.querySelector("#feed-close-modal")
      };
      const state = { user: null, posts: [], threadPostId: null, replyParentId: null, comments: new Map(), unsubPosts: null, unsubComments: null, unsubAuth: null, observer: null };
      const onKeydown = (event) => { if (event.key === "Escape" && el.modal.classList.contains("open")) closeThread(); };
      function teardown() { if (state.unsubPosts) state.unsubPosts(); if (state.unsubComments) state.unsubComments(); if (state.unsubAuth) state.unsubAuth(); if (state.observer) state.observer.disconnect(); document.removeEventListener("keydown", onKeydown); }
      window.NebulaFeedRoute = { teardown };
      state.observer = new MutationObserver(() => { if (!document.body.contains(root)) teardown(); });
      state.observer.observe(document.body, { childList: true, subtree: true });
      function clean(text) { return String(text || "").replace(/\r/g, "").replace(/\u00A0/g, " ").replace(/\n{3,}/g, "\n\n").trim(); }
      function editor(node) { return clean(node ? node.innerText : ""); }
      function clear(node) { if (node) node.innerHTML = ""; }
      function fmtCount(v) { return new Intl.NumberFormat("en-US", { notation: Number(v) >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(Number(v) || 0); }
      function rel(v) { if (!v) return "just now"; const d = typeof v.toDate === "function" ? v.toDate() : new Date(v); if (Number.isNaN(d.getTime())) return "just now"; const diff = Math.round((d.getTime() - Date.now()) / 1000); const f = new Intl.RelativeTimeFormat("en", { numeric: "auto" }); const units = [["year",31536000],["month",2592000],["week",604800],["day",86400],["hour",3600],["minute",60]]; for (let i = 0; i < units.length; i += 1) if (Math.abs(diff) >= units[i][1] || units[i][0] === "minute") return f.format(Math.round(diff / units[i][1]), units[i][0]); return "just now"; }
      function initial(text) { const v = String(text || "").trim(); return v ? v.charAt(0).toUpperCase() : "N"; }
      function name(user) { return String(user && (user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8))) || "Member").trim(); }
      function handle(user) { const raw = String(user && (user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8))) || "member").toLowerCase().replace(/[^a-z0-9_]+/g, ""); return "@" + (raw || "member"); }
      function setStatus(node, text, tone) { if (!node) return; node.textContent = text || ""; node.style.color = tone === "error" ? "rgba(255,162,162,.95)" : tone === "success" ? "rgba(194,255,215,.95)" : "rgba(255,255,255,.62)"; }
      function enable(on) { el.title.setAttribute("contenteditable", on ? "true" : "false"); el.body.setAttribute("contenteditable", on ? "true" : "false"); el.comment.setAttribute("contenteditable", on ? "true" : "false"); el.submit.disabled = !on; el.clear.disabled = !on; el.submitComment.disabled = !on; el.clearReply.disabled = !on; }
      function normPost(doc) { const d = doc.data() || {}; const body = clean(d.body || d.content || ""); const title = clean(d.title || body.split("\n")[0] || "Untitled post"); return { id: doc.id, title: (title || "Untitled post").slice(0, 140), body: body.slice(0, 4000), community: clean(d.community || "r/nebula").slice(0, 48) || "r/nebula", flair: clean(d.flair || "Discussion").slice(0, 32) || "Discussion", authorName: clean(d.authorName || d.username || "Member").slice(0, 80) || "Member", authorHandle: clean(d.authorHandle || "").slice(0, 40), createdAt: d.createdAt || d.timestamp || null, lastActivityAt: d.lastActivityAt || d.updatedAt || d.createdAt || d.timestamp || null, commentCount: Number(d.commentCount) || 0 }; }
      function normComment(doc) { const d = doc.data() || {}; return { id: doc.id, parentId: String(d.parentId || ""), authorName: clean(d.authorName || "Member").slice(0, 80) || "Member", authorHandle: clean(d.authorHandle || "").slice(0, 40), body: clean(d.body || "").slice(0, 2000), createdAt: d.createdAt || null }; }
      function updateSummary() { const totalComments = state.posts.reduce((sum, post) => sum + (Number(post.commentCount) || 0), 0); el.totalPosts.textContent = fmtCount(state.posts.length); el.totalComments.textContent = fmtCount(totalComments); el.session.textContent = state.user ? "Yes" : "No"; }
      function renderPosts() {
        updateSummary();
        if (!state.posts.length) { el.list.innerHTML = `<section class="feed-panel feed-empty"><h2>No Posts Yet</h2><p class="feed-copy">The feed is ready. Publish the first post and the live thread view will light up instantly.</p></section>`; return; }
        el.list.innerHTML = state.posts.map((post) => `
          <article class="feed-panel feed-post" data-post-id="${escapeHtml(post.id)}">
            <div class="feed-votes"><button class="feed-vote" type="button" tabindex="-1"><i class="fa-solid fa-chevron-up"></i></button><div class="feed-score">${fmtCount(post.commentCount + 1)}</div><button class="feed-vote" type="button" tabindex="-1"><i class="fa-solid fa-chevron-down"></i></button></div>
            <div class="feed-post-card">
              <div class="feed-post-meta"><span class="feed-avatar">${escapeHtml(initial(post.authorName))}</span><span class="feed-tag">${escapeHtml(post.community)}</span><p class="feed-meta">Posted by ${escapeHtml(post.authorName)} ${escapeHtml(post.authorHandle || "@member")} • ${escapeHtml(rel(post.createdAt))}</p></div>
              <h3 class="feed-post-title" data-action="open-post" data-post-id="${escapeHtml(post.id)}">${escapeHtml(post.title)}</h3>
              <p class="feed-copy">${rich(post.body)}</p>
              <div class="feed-post-actions"><button type="button" data-action="open-post" data-post-id="${escapeHtml(post.id)}"><i class="fa-regular fa-message"></i> ${escapeHtml(post.commentCount === 1 ? "1 reply" : `${fmtCount(post.commentCount)} replies`)}</button><button type="button" data-action="reply-post" data-post-id="${escapeHtml(post.id)}"><i class="fa-solid fa-reply"></i> Reply</button><button type="button" disabled><i class="fa-regular fa-bookmark"></i> Save</button></div>
            </div>
          </article>
        `).join("");
      }
      function closeThread() { el.modal.classList.remove("open"); el.modal.setAttribute("aria-hidden", "true"); state.threadPostId = null; state.replyParentId = null; clear(el.comment); setStatus(el.threadStatus, ""); el.threadPost.innerHTML = ""; el.threadList.innerHTML = ""; el.threadMeta.textContent = ""; el.replyTarget.textContent = ""; el.modalSubtitle.textContent = "Live discussion"; if (state.unsubComments) { state.unsubComments(); state.unsubComments = null; } }
      function setReplyTarget(id) { state.replyParentId = id || null; if (!state.threadPostId) { el.replyTarget.textContent = ""; return; } if (!id) { el.replyTarget.textContent = "Replying to the main post."; return; } const list = state.comments.get(state.threadPostId) || []; const match = list.find((item) => item.id === id); el.replyTarget.textContent = match ? `Replying to ${match.authorName}.` : "Replying in thread."; }
      function renderThreadList(postId) {
        const list = state.comments.get(postId) || [];
        if (!list.length) { el.threadList.innerHTML = `<div class="feed-panel" style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.06)">No replies yet. Start the thread below.</div>`; return; }
        const byParent = new Map();
        list.forEach((item) => { const key = item.parentId || "__root__"; if (!byParent.has(key)) byParent.set(key, []); byParent.get(key).push(item); });
        function branch(parentId, depth) {
          return (byParent.get(parentId || "__root__") || []).map((item) => `
            <article class="feed-comment-card" style="--depth:${depth};">
              <div class="feed-comment-head"><span class="feed-avatar">${escapeHtml(initial(item.authorName))}</span><p class="feed-meta">${escapeHtml(item.authorName)} ${escapeHtml(item.authorHandle || "@member")} • ${escapeHtml(rel(item.createdAt))}</p></div>
              <p class="feed-comment-body">${rich(item.body)}</p>
              <div class="feed-post-actions"><button type="button" data-action="reply-comment" data-comment-id="${escapeHtml(item.id)}">Reply</button></div>
              ${branch(item.id, Math.min(depth + 1, 6))}
            </article>
          `).join("");
        }
        el.threadList.innerHTML = branch("", 0);
      }
      function renderThreadPost(postId) {
        const post = state.posts.find((item) => item.id === postId);
        if (!post) { el.threadPost.innerHTML = `<div class="feed-copy">This thread is no longer available.</div>`; return; }
        el.modalSubtitle.textContent = `${post.community} • ${rel(post.createdAt)}`;
        el.threadMeta.textContent = post.commentCount === 1 ? "1 reply in this thread." : `${fmtCount(post.commentCount)} replies in this thread.`;
        el.threadPost.innerHTML = `<div class="feed-post-meta"><span class="feed-avatar">${escapeHtml(initial(post.authorName))}</span><span class="feed-tag">${escapeHtml(post.flair)}</span><p class="feed-meta">${escapeHtml(post.authorName)} ${escapeHtml(post.authorHandle || "@member")} • ${escapeHtml(rel(post.createdAt))}</p></div><h4>${escapeHtml(post.title)}</h4><p class="feed-copy">${rich(post.body)}</p>`;
      }
      function openThread(postId) {
        if (!state.posts.find((item) => item.id === postId)) return;
        state.threadPostId = postId; el.modal.classList.add("open"); el.modal.setAttribute("aria-hidden", "false"); renderThreadPost(postId); setReplyTarget(null); setStatus(el.threadStatus, ""); el.threadList.innerHTML = `<div class="feed-panel" style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.06)">Loading thread...</div>`;
        if (state.unsubComments) state.unsubComments();
        state.unsubComments = posts.doc(postId).collection("comments").orderBy("createdAt", "asc").limit(300).onSnapshot((snapshot) => { state.comments.set(postId, snapshot.docs.map(normComment)); renderThreadPost(postId); renderThreadList(postId); setReplyTarget(state.replyParentId); }, () => { el.threadList.innerHTML = `<div class="feed-panel" style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.06)">Unable to load the thread right now.</div>`; });
      }
      async function publishPost() {
        if (!state.user) { setStatus(el.status, "Sign in to publish a post.", "error"); return; }
        const titleValue = editor(el.title); const bodyValue = editor(el.body); const derivedTitle = titleValue || bodyValue.split("\n")[0].slice(0, 140);
        if (!bodyValue) { setStatus(el.status, "Add some body text before publishing.", "error"); return; }
        if (!derivedTitle) { setStatus(el.status, "Add a title or enough body text to derive one.", "error"); return; }
        el.submit.disabled = true; setStatus(el.status, "Publishing post...");
        try {
          await posts.add({ title: derivedTitle.slice(0, 140), body: bodyValue.slice(0, 4000), community: "r/nebula", flair: "Discussion", authorId: state.user.uid, authorName: name(state.user).slice(0, 80), authorHandle: handle(state.user).slice(0, 40), commentCount: 0, createdAt: fieldValue.serverTimestamp(), lastActivityAt: fieldValue.serverTimestamp() });
          clear(el.title); clear(el.body); setStatus(el.status, "Post published.", "success");
        } catch (_error) {
          setStatus(el.status, "Could not publish the post. Check your Firestore rules.", "error");
        } finally {
          el.submit.disabled = state.user == null;
        }
      }
      async function publishComment() {
        if (!state.user) { setStatus(el.threadStatus, "Sign in to reply.", "error"); return; }
        if (!state.threadPostId) { setStatus(el.threadStatus, "Open a thread before replying.", "error"); return; }
        const bodyValue = editor(el.comment); if (!bodyValue) { setStatus(el.threadStatus, "Write a reply first.", "error"); return; }
        el.submitComment.disabled = true; setStatus(el.threadStatus, "Sending reply...");
        try {
          const postRef = posts.doc(state.threadPostId); const commentRef = postRef.collection("comments").doc(); const batch = db.batch();
          batch.set(commentRef, { parentId: state.replyParentId || "", authorId: state.user.uid, authorName: name(state.user).slice(0, 80), authorHandle: handle(state.user).slice(0, 40), body: bodyValue.slice(0, 2000), createdAt: fieldValue.serverTimestamp() });
          batch.update(postRef, { commentCount: fieldValue.increment(1), lastActivityAt: fieldValue.serverTimestamp() });
          await batch.commit(); clear(el.comment); setReplyTarget(null); setStatus(el.threadStatus, "Reply posted.", "success");
        } catch (_error) {
          setStatus(el.threadStatus, "Could not send the reply. Check your Firestore rules.", "error");
        } finally {
          el.submitComment.disabled = state.user == null;
        }
      }
      function syncAuth() { if (state.user) { el.auth.textContent = `Posting as ${name(state.user)} ${handle(state.user)}`; enable(true); } else { el.auth.textContent = "Sign in to create posts and threaded replies."; enable(false); } updateSummary(); }
      el.submit.addEventListener("click", publishPost);
      el.clear.addEventListener("click", () => { clear(el.title); clear(el.body); setStatus(el.status, ""); });
      el.submitComment.addEventListener("click", publishComment);
      el.clearReply.addEventListener("click", () => { clear(el.comment); setReplyTarget(null); setStatus(el.threadStatus, ""); });
      el.closeModal.addEventListener("click", closeThread);
      el.modal.addEventListener("click", (event) => { if (event.target === el.modal) closeThread(); });
      document.addEventListener("keydown", onKeydown);
      el.list.addEventListener("click", (event) => { const target = event.target.closest("[data-action]"); if (!target) return; const postId = target.getAttribute("data-post-id"); if (!postId) return; openThread(postId); if (target.getAttribute("data-action") === "reply-post") requestAnimationFrame(() => el.comment.focus()); });
      el.threadList.addEventListener("click", (event) => { const target = event.target.closest('[data-action="reply-comment"]'); if (!target) return; const commentId = target.getAttribute("data-comment-id"); if (!commentId) return; setReplyTarget(commentId); requestAnimationFrame(() => el.comment.focus()); });
      state.unsubPosts = posts.orderBy("lastActivityAt", "desc").limit(60).onSnapshot((snapshot) => { state.posts = snapshot.docs.map(normPost); renderPosts(); if (state.threadPostId) renderThreadPost(state.threadPostId); }, () => { el.list.innerHTML = `<section class="feed-panel feed-empty"><h2>Feed Unavailable</h2><p class="feed-copy">Firestore denied the request or the collection does not exist yet.</p></section>`; });
      state.unsubAuth = auth.onAuthStateChanged((user) => { state.user = user || null; syncAuth(); });
      syncAuth(); renderPosts();
    }
  };
})();
