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
.neb-feed {
  --spring: cubic-bezier(0.16,1,0.3,1);
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0,1fr) 280px;
  gap: 20px;
  align-items: start;
  font-family: 'Geist','Montserrat',sans-serif;
  color: rgba(255,255,255,0.88);
}

.neb-feed * { box-sizing: border-box; }

.neb-card {
  border: 0.5px solid rgba(255,255,255,0.09);
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.neb-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
  pointer-events: none;
}

.neb-card:hover { border-color: rgba(255,255,255,0.15); }

.neb-composer {
  padding: 16px;
  margin-bottom: 12px;
}

.neb-composer-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.neb-avatar {
  width: 36px; height: 36px;
  border-radius: 999px;
  border: 0.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  display: grid;
  place-items: center;
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  flex-shrink: 0;
}

.neb-fake-input {
  flex: 1;
  padding: 10px 16px;
  border-radius: 999px;
  border: 0.5px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.35);
  font-size: 13px;
  font-family: inherit;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: border-color 0.3s ease, background 0.3s ease;
}

.neb-fake-input:hover {
  border-color: rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.6);
}

.neb-composer-btns {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 0.5px solid rgba(255,255,255,0.06);
}

.neb-composer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  font-family: inherit;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.neb-composer-btn:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.8);
}

.neb-sort-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 16px;
  border: 0.5px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
}

.neb-sort-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  font-size: 11px;
  font-family: inherit;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.neb-sort-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
.neb-sort-btn.active { background: rgba(255,255,255,0.1); color: #fff; }

.neb-post {
  display: grid;
  grid-template-columns: 44px minmax(0,1fr);
  gap: 0;
  padding: 0;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.neb-post:hover { border-color: rgba(255,255,255,0.18); }

.neb-vote-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 0 12px 8px;
}

.neb-vote-btn {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.3);
  font-size: 13px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.neb-vote-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
.neb-vote-btn.up.voted { color: #fff; }
.neb-vote-btn.down.voted { color: rgba(255,255,255,0.5); }

.neb-vote-score {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.6);
}

.neb-post-body {
  padding: 12px 14px 12px 8px;
  display: grid;
  gap: 6px;
  min-width: 0;
}

.neb-post-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.03em;
}

.neb-post-meta .community {
  color: rgba(255,255,255,0.65);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.neb-post-meta .dot { opacity: 0.3; }

.neb-post-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: rgba(255,255,255,0.92);
  letter-spacing: 0.01em;
}

.neb-post-excerpt {
  margin: 0;
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  line-height: 1.6;
  letter-spacing: 0.02em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.neb-post-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.neb-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.35);
  font-size: 11px;
  font-family: inherit;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.neb-action-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
.neb-action-btn.active { background: rgba(255,255,255,0.12); color: #fff; }

/* Post divider */
.neb-post + .neb-post { border-top: 0.5px solid rgba(255,255,255,0.05); border-radius: 0; }
.neb-post:first-child { border-radius: 20px 20px 0 0; }
.neb-post:last-child { border-radius: 0 0 20px 20px; margin-bottom: 0; }
.neb-post:only-child { border-radius: 20px; }

/* Sidebar */
.neb-sidebar { display: grid; gap: 12px; }

.neb-side-card { padding: 16px; }

.neb-side-card h3 {
  margin: 0 0 12px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  font-weight: 600;
}

.neb-community-header {
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  margin: -16px -16px 14px;
  border-radius: 20px 20px 0 0;
}

.neb-community-icon {
  width: 48px; height: 48px;
  border-radius: 999px;
  border: 2px solid rgba(0,0,0,0.8);
  background: rgba(255,255,255,0.08);
  display: grid;
  place-items: center;
  font-size: 20px;
  margin-top: -24px;
  margin-left: 16px;
  position: relative;
  z-index: 1;
}

.neb-community-name {
  margin: 10px 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.02em;
}

.neb-community-desc {
  margin: 0 0 14px;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  line-height: 1.6;
  letter-spacing: 0.02em;
}

.neb-community-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.neb-community-stat p:first-child {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.88);
}

.neb-community-stat p:last-child {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
}

.neb-join-btn {
  width: 100%;
  padding: 10px;
  border-radius: 999px;
  border: 0.5px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.9);
  color: #000;
  font-size: 12px;
  font-family: inherit;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;
}

.neb-join-btn:hover { background: #fff; }
.neb-join-btn.joined {
  border-color: rgba(255,255,255,0.22);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.92);
}

.neb-community-list {
  display: grid;
  gap: 8px;
}

.neb-community-item {
  border: 0.5px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.neb-community-item-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.neb-community-item-name {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: rgba(255,255,255,0.88);
}

.neb-community-item-desc {
  margin: 0;
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  line-height: 1.55;
}

.neb-rules-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.neb-rules-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  line-height: 1.5;
  letter-spacing: 0.02em;
}

.neb-rules-list li span:first-child {
  font-weight: 700;
  color: rgba(255,255,255,0.25);
  flex-shrink: 0;
  font-size: 11px;
}

.neb-empty {
  padding: 48px 24px;
  text-align: center;
  color: rgba(255,255,255,0.2);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.neb-post-flair {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 0.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  font-weight: 600;
}

/* Modal */
.neb-modal {
  position: fixed; inset: 0;
  z-index: 9000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(20px);
}

.neb-modal.open { display: flex; }

.neb-modal-card {
  width: min(720px,100%);
  max-height: 90vh;
  border-radius: 20px;
  border: 0.5px solid rgba(255,255,255,0.12);
  background: rgba(6,6,6,0.92);
  backdrop-filter: blur(40px);
  display: grid;
  grid-template-rows: auto minmax(0,1fr) auto;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,0.8);
}

.neb-modal-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
}

.neb-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 0.5px solid rgba(255,255,255,0.07);
}

.neb-modal-head h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
}

.neb-modal-close {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 0.5px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 13px;
  transition: background 0.2s ease, color 0.2s ease;
}

.neb-modal-close:hover { background: rgba(255,255,255,0.08); color: #fff; }

.neb-modal-body {
  overflow-y: auto;
  padding: 20px;
  display: grid;
  gap: 12px;
}

.neb-modal-post-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: rgba(255,255,255,0.92);
}

.neb-modal-post-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.02em;
}

.neb-modal-post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.03em;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 0.5px solid rgba(255,255,255,0.06);
}

.neb-comments-divider {
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  padding: 4px 0;
}

.neb-comment {
  display: grid;
  grid-template-columns: 24px minmax(0,1fr);
  gap: 10px;
}

.neb-comment-thread-line {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.neb-comment-thread-line-inner {
  width: 1.5px;
  height: 100%;
  background: rgba(255,255,255,0.07);
  border-radius: 1px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.neb-comment-thread-line-inner:hover { background: rgba(255,255,255,0.2); }

.neb-comment-content { display: grid; gap: 6px; }

.neb-comment-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
}

.neb-comment-author {
  font-weight: 600;
  color: rgba(255,255,255,0.65);
  letter-spacing: 0.02em;
}

.neb-comment-body {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: rgba(255,255,255,0.72);
  letter-spacing: 0.02em;
}

.neb-comment-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.neb-modal-foot {
  padding: 14px 20px;
  border-top: 0.5px solid rgba(255,255,255,0.07);
  display: grid;
  gap: 10px;
}

.neb-reply-input {
  width: 100%;
  min-height: 80px;
  resize: none;
  border-radius: 12px;
  border: 0.5px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.88);
  padding: 12px 14px;
  font-size: 13px;
  font-family: inherit;
  letter-spacing: 0.02em;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.neb-reply-input:focus {
  border-color: rgba(255,255,255,0.22);
  background: rgba(255,255,255,0.06);
}

.neb-reply-input::placeholder { color: rgba(255,255,255,0.2); }

.neb-modal-foot-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.neb-reply-btn {
  padding: 8px 20px;
  border-radius: 999px;
  border: 0.5px solid rgba(255,255,255,0.88);
  background: rgba(255,255,255,0.88);
  color: #000;
  font-size: 11px;
  font-family: inherit;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;
}

.neb-reply-btn:hover { background: #fff; }

.neb-ghost-btn {
  padding: 8px 16px;
  border-radius: 999px;
  border: 0.5px solid rgba(255,255,255,0.09);
  background: transparent;
  color: rgba(255,255,255,0.4);
  font-size: 11px;
  font-family: inherit;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.neb-ghost-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }

.neb-status {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: rgba(255,160,160,0.85);
}

.neb-status.ok { color: rgba(160,255,200,0.85); }

/* Create post modal */
.neb-create-modal-card {
  width: min(600px,100%);
}

.neb-input {
  width: 100%;
  border-radius: 10px;
  border: 0.5px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.88);
  padding: 12px 14px;
  font-size: 13px;
  font-family: inherit;
  letter-spacing: 0.02em;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.neb-input:focus {
  border-color: rgba(255,255,255,0.22);
  background: rgba(255,255,255,0.06);
}

.neb-input::placeholder { color: rgba(255,255,255,0.2); }

.neb-textarea {
  resize: vertical;
  min-height: 120px;
}

.neb-input-label {
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin-bottom: 6px;
  display: block;
}

@media (max-width: 860px) {
  .neb-feed { grid-template-columns: 1fr; }
  .neb-sidebar { grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); }
}
  .neb-ai-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 0.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.5);
  font-size: 11px;
  font-family: inherit;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.neb-ai-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.22);
  color: #fff;
}

.neb-ai-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.neb-ai-summary {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 0.5px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  line-height: 1.65;
  letter-spacing: 0.02em;
  display: none;
}

.neb-ai-summary.visible { display: block; }

.neb-ai-summary-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  margin-bottom: 5px;
}
</style>

<section class="neb-feed">
  <main>
    <div class="neb-card neb-composer">
      <div class="neb-composer-bar">
        <div class="neb-avatar"><i class="fa-solid fa-user"></i></div>
        <button class="neb-fake-input" id="neb-open-create" type="button">Create a post</button>
      </div>
      <div class="neb-composer-btns">
        <button class="neb-composer-btn" id="neb-open-create-img" type="button">
          <i class="fa-solid fa-image"></i> Image
        </button>
        <button class="neb-composer-btn" id="neb-open-create-link" type="button">
          <i class="fa-solid fa-link"></i> Link
        </button>
        <button class="neb-composer-btn" id="neb-open-create-poll" type="button">
          <i class="fa-solid fa-chart-bar"></i> Poll
        </button>
      </div>
    </div>

    <div class="neb-sort-bar">
      <button class="neb-sort-btn active" data-sort="new" type="button"><i class="fa-solid fa-bolt"></i> New</button>
      <button class="neb-sort-btn" data-sort="top" type="button"><i class="fa-solid fa-fire"></i> Top</button>
      <button class="neb-sort-btn" data-sort="hot" type="button"><i class="fa-solid fa-chart-line"></i> Hot</button>
    </div>

    <div id="neb-post-list"></div>
    <p id="neb-feed-status" class="neb-status" style="padding:8px 0;"></p>
  </main>

  <aside class="neb-sidebar">
    <div class="neb-card neb-side-card">
      <div class="neb-community-header"></div>
      <div class="neb-community-icon">◎</div>
      <p class="neb-community-name">r/nebula</p>
      <p class="neb-community-desc">The official Nebula community. Share what you're playing, building, or thinking about.</p>
      <div class="neb-community-stats">
        <div class="neb-community-stat">
          <p id="neb-stat-members">—</p>
          <p>Members</p>
        </div>
      </div>
      <div id="neb-community-list" class="neb-community-list"></div>
    </div>

    <div class="neb-card neb-side-card">
      <h3>Community Rules</h3>
      <ul class="neb-rules-list">
        <li><span>1.</span><span>Be respectful to all members</span></li>
        <li><span>2.</span><span>No spam or self-promotion</span></li>
        <li><span>3.</span><span>Stay on topic</span></li>
        <li><span>4.</span><span>No personal information</span></li>
        <li><span>5.</span><span>Follow site-wide rules</span></li>
      </ul>
    </div>

    <div class="neb-card neb-side-card">
      <h3>Moderators</h3>
      <p style="font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:0.03em;line-height:1.6;">u/nebula_admin<br>u/mod_team</p>
    </div>
  </aside>
</section>

<!-- Thread modal -->
<div id="neb-thread-modal" class="neb-modal" aria-hidden="true">
  <div class="neb-modal-card">
    <div class="neb-modal-head">
      <h3>Comments</h3>
      <button class="neb-modal-close" id="neb-close-thread" type="button"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="neb-modal-body" id="neb-thread-body"></div>
    <div class="neb-modal-foot">
      <textarea class="neb-reply-input" id="neb-reply-input" placeholder="Add a comment…"></textarea>
      <p id="neb-reply-status" class="neb-status"></p>
      <div class="neb-modal-foot-actions">
        <button class="neb-ghost-btn" id="neb-cancel-reply" type="button">Cancel</button>
        <button class="neb-reply-btn" id="neb-submit-reply" type="button">Comment</button>
      </div>
    </div>
  </div>
</div>

<!-- Create post modal -->
<div id="neb-create-modal" class="neb-modal" aria-hidden="true">
  <div class="neb-modal-card neb-create-modal-card">
    <div class="neb-modal-head">
      <h3>Create Post</h3>
      <button class="neb-modal-close" id="neb-close-create" type="button"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="neb-modal-body">
      <div>
        <label class="neb-input-label">Community</label>
        <select class="neb-input" id="neb-post-community">
          <option value="r/nebula">r/nebula</option>
          <option value="r/gaming">r/gaming</option>
          <option value="r/music">r/music</option>
          <option value="r/builds">r/builds</option>
        </select>
      </div>
      <div>
        <label class="neb-input-label">Title</label>
        <input class="neb-input" id="neb-post-title" type="text" placeholder="An interesting title…" maxlength="300" />
      </div>
      <div>
        <label class="neb-input-label">Body (optional)</label>
        <textarea class="neb-input neb-textarea" id="neb-post-body" placeholder="Share your thoughts…"></textarea>
      </div>
      <p id="neb-create-status" class="neb-status"></p>
    </div>
    <div class="neb-modal-foot">
      <div class="neb-modal-foot-actions">
        <button class="neb-ghost-btn" id="neb-cancel-create" type="button">Cancel</button>
        <button class="neb-reply-btn" id="neb-submit-post" type="button">Post</button>
      </div>
    </div>
  </div>
</div>
      `;
    },
    afterRender: async function afterRenderFeedRoute() {
      const fireb = window["firebase"];
      if (!fireb || typeof fireb.firestore !== "function") {
        console.error("Firebase Firestore is unavailable.");
        return;
      }

      const db = fireb.firestore();
      const fieldValue = fireb.firestore.FieldValue;
      const auth = fireb.auth();

      if (window.NebulaFeedRoute && typeof window.NebulaFeedRoute.teardown === "function") {
        window.NebulaFeedRoute.teardown();
      }

      const root = document.querySelector(".neb-feed");
      if (!root) return;

      const postsRef = db.collection("feedPosts");
      const communityDefs = [
        { id: "r/nebula", desc: "Core updates and general discussion." },
        { id: "r/gaming", desc: "Games, scores, and discoveries." },
        { id: "r/music", desc: "Tracks, playlists, and recommendations." },
        { id: "r/builds", desc: "Projects, setups, and experiments." }
      ];
      const el = {
        list: root.querySelector("#neb-post-list"),
        feedStatus: root.querySelector("#neb-feed-status"),
        statMembers: root.querySelector("#neb-stat-members"),
        communityList: root.querySelector("#neb-community-list"),
        openCreate: root.querySelector("#neb-open-create"),
        openCreateImg: root.querySelector("#neb-open-create-img"),
        openCreateLink: root.querySelector("#neb-open-create-link"),
        openCreatePoll: root.querySelector("#neb-open-create-poll"),
        sortButtons: Array.from(root.querySelectorAll(".neb-sort-btn")),
        createModal: document.getElementById("neb-create-modal"),
        closeCreate: document.getElementById("neb-close-create"),
        cancelCreate: document.getElementById("neb-cancel-create"),
        postCommunity: document.getElementById("neb-post-community"),
        postTitle: document.getElementById("neb-post-title"),
        postBody: document.getElementById("neb-post-body"),
        createStatus: document.getElementById("neb-create-status"),
        submitPost: document.getElementById("neb-submit-post"),
        threadModal: document.getElementById("neb-thread-modal"),
        closeThread: document.getElementById("neb-close-thread"),
        threadBody: document.getElementById("neb-thread-body"),
        replyInput: document.getElementById("neb-reply-input"),
        replyStatus: document.getElementById("neb-reply-status"),
        cancelReply: document.getElementById("neb-cancel-reply"),
        submitReply: document.getElementById("neb-submit-reply")
      };

      const state = {
        user: null,
        posts: [],
        sort: "new",
        threadPostId: null,
        replyParentId: null,
        memberships: new Set(),
        subscriptions: new Set(),
        likedPosts: new Set(),
        comments: new Map(),
        unsubPosts: null,
        unsubComments: null,
        unsubAuth: null,
        observer: null
      };

      function clean(text) {
        return String(text || "").replace(/\r/g, "").replace(/\u00A0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      }

      function fmtCount(v) {
        return new Intl.NumberFormat("en-US", { notation: Number(v) >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(Number(v) || 0);
      }

      function rel(v) {
        if (!v) return "just now";
        const d = typeof v.toDate === "function" ? v.toDate() : new Date(v);
        if (Number.isNaN(d.getTime())) return "just now";
        const diff = Math.round((d.getTime() - Date.now()) / 1000);
        const f = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
        const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
        for (let i = 0; i < units.length; i += 1) {
          if (Math.abs(diff) >= units[i][1] || units[i][0] === "minute") {
            return f.format(Math.round(diff / units[i][1]), units[i][0]);
          }
        }
        return "just now";
      }

      function initial(text) {
        const value = String(text || "").trim();
        return value ? value.charAt(0).toUpperCase() : "N";
      }

      function name(user) {
        return String(user && (user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8))) || "Member").trim();
      }

function handle(user) {
  const raw = String(user && (user.displayName || (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8))))
    .toLowerCase() // Ensure this is here
    .replace(/[^a-z0-9_]+/g, "");
  return "@" + (raw || "member");
}

      function setStatus(node, text, tone) {
        if (!node) return;
        node.textContent = text || "";
        node.classList.toggle("ok", tone === "success");
      }

      function prefKey() {
        const suffix = state.user && state.user.uid ? state.user.uid : "guest";
        return `neb-feed-prefs-${suffix}`;
      }

      function loadPrefs() {
        let raw = null;
        try {
          raw = JSON.parse(localStorage.getItem(prefKey()) || "{}");
        } catch (_error) {
          raw = {};
        }
        const memberships = Array.isArray(raw.memberships) ? raw.memberships : [];
        const subscriptions = Array.isArray(raw.subscriptions) ? raw.subscriptions : [];
        const likedPosts = Array.isArray(raw.likedPosts) ? raw.likedPosts : [];
        state.memberships = new Set(memberships.map((item) => String(item || "")).filter(Boolean));
        state.subscriptions = new Set(subscriptions.map((item) => String(item || "")).filter(Boolean));
        state.likedPosts = new Set(likedPosts.map((item) => String(item || "")).filter(Boolean));
      }

      function savePrefs() {
        try {
          localStorage.setItem(prefKey(), JSON.stringify({
            memberships: Array.from(state.memberships),
            subscriptions: Array.from(state.subscriptions),
            likedPosts: Array.from(state.likedPosts)
          }));
        } catch (_error) {
        }
      }

      function creatorKey(post) {
        return String(post.authorId || post.authorHandle || post.authorName || "member").toLowerCase();
      }

      function normPost(doc) {
        const d = doc.data() || {};
        const body = clean(d.body || d.content || "");
        const title = clean(d.title || body.split("\n")[0] || "Untitled post");
        return {
          id: doc.id,
          title: (title || "Untitled post").slice(0, 300),
          body: body.slice(0, 4000),
          community: clean(d.community || "r/nebula").slice(0, 48) || "r/nebula",
          flair: clean(d.flair || "Discussion").slice(0, 32) || "Discussion",
          authorId: clean(d.authorId || ""),
          authorName: clean(d.authorName || d.username || "Member").slice(0, 80) || "Member",
          authorHandle: clean(d.authorHandle || "").slice(0, 40),
          createdAt: d.createdAt || null,
          lastActivityAt: d.lastActivityAt || d.updatedAt || d.createdAt || null,
          commentCount: Number(d.commentCount) || 0
        };
      }

      function normComment(doc) {
        const d = doc.data() || {};
        return {
          id: doc.id,
          parentId: String(d.parentId || ""),
          authorName: clean(d.authorName || "Member").slice(0, 80) || "Member",
          authorHandle: clean(d.authorHandle || "").slice(0, 40),
          body: clean(d.body || "").slice(0, 2000),
          createdAt: d.createdAt || null
        };
      }

      function openCreateModal() {
        if (!el.createModal) return;
        if (el.postCommunity && state.memberships.size && !state.memberships.has(el.postCommunity.value)) {
          el.postCommunity.value = Array.from(state.memberships)[0];
        }
        setStatus(el.createStatus, "");
        el.createModal.classList.add("open");
        el.createModal.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => {
          if (el.postTitle) el.postTitle.focus();
        });
      }

      function closeCreateModal() {
        if (!el.createModal) return;
        el.createModal.classList.remove("open");
        el.createModal.setAttribute("aria-hidden", "true");
      }

      function closeThreadModal() {
        if (!el.threadModal) return;
        el.threadModal.classList.remove("open");
        el.threadModal.setAttribute("aria-hidden", "true");
        state.threadPostId = null;
        state.replyParentId = null;
        if (el.replyInput) el.replyInput.value = "";
        setStatus(el.replyStatus, "");
        if (state.unsubComments) {
          state.unsubComments();
          state.unsubComments = null;
        }
      }

      function updateSidebarStats() {
        const uniqueAuthors = new Set(state.posts.map((post) => post.authorId || post.authorHandle || post.authorName).filter(Boolean));
        const members = Math.max(42, uniqueAuthors.size * 7);
        if (el.statMembers) el.statMembers.textContent = fmtCount(members);
      }

      function renderCommunityList() {
        if (!el.communityList) return;
        el.communityList.innerHTML = communityDefs.map((community) => {
          const joined = state.memberships.has(community.id);
          return `
            <article class="neb-community-item">
              <div class="neb-community-item-top">
                <p class="neb-community-item-name">${escapeHtml(community.id)}</p>
                <button class="neb-join-btn ${joined ? "joined" : ""}" type="button" data-action="toggle-community" data-community="${escapeHtml(community.id)}">${joined ? "Joined" : "Join"}</button>
              </div>
              <p class="neb-community-item-desc">${escapeHtml(community.desc)}</p>
            </article>
          `;
        }).join("");

        if (el.postCommunity) {
          const current = el.postCommunity.value;
          el.postCommunity.innerHTML = communityDefs.map((community) => `<option value="${escapeHtml(community.id)}">${escapeHtml(community.id)}</option>`).join("");
          if (current && communityDefs.some((community) => community.id === current)) {
            el.postCommunity.value = current;
          }
        }
      }

      function renderPosts() {
        updateSidebarStats();
        if (!el.list) return;
        if (!state.posts.length) {
          el.list.innerHTML = `<div class="neb-card neb-empty">No posts yet</div>`;
          return;
        }
        el.list.innerHTML = state.posts.map((post) => `
          <article class="neb-card neb-post" data-post-id="${escapeHtml(post.id)}" data-action="open-post">
            <div class="neb-vote-col">
              <button class="neb-vote-btn up" type="button" tabindex="-1"><i class="fa-solid fa-chevron-up"></i></button>
              <div class="neb-vote-score">${fmtCount(post.commentCount + 1)}</div>
              <button class="neb-vote-btn down" type="button" tabindex="-1"><i class="fa-solid fa-chevron-down"></i></button>
            </div>
            <div class="neb-post-body">
              <div class="neb-post-meta">
                <span class="community">${escapeHtml(post.community)}</span>
                <span class="dot">•</span>
                <span>Creator: ${escapeHtml(post.authorName)} ${escapeHtml(post.authorHandle || "@member")}</span>
                <span class="dot">•</span>
                <span>${escapeHtml(rel(post.createdAt))}</span>
                <span class="neb-post-flair">${escapeHtml(post.flair)}</span>
              </div>
              <h3 class="neb-post-title">${escapeHtml(post.title)}</h3>
              <p class="neb-post-excerpt">${rich(post.body || "")}</p>
              <div class="neb-post-actions">
                <button class="neb-action-btn" type="button" data-action="open-post" data-post-id="${escapeHtml(post.id)}"><i class="fa-regular fa-message"></i> ${escapeHtml(post.commentCount === 1 ? "1 Reply" : `${fmtCount(post.commentCount)} Replies`)}</button>
                <button class="neb-action-btn" type="button" data-action="reply-post" data-post-id="${escapeHtml(post.id)}"><i class="fa-solid fa-reply"></i> Reply</button>
                <button class="neb-action-btn ${state.likedPosts.has(post.id) ? "active" : ""}" type="button" data-action="like-post" data-post-id="${escapeHtml(post.id)}"><i class="fa-regular fa-heart"></i> ${state.likedPosts.has(post.id) ? "Liked" : "Like"} ${escapeHtml(fmtCount(Number(post.likesCount || 0)))}</button>
                <button class="neb-action-btn ${state.subscriptions.has(creatorKey(post)) ? "active" : ""}" type="button" data-action="subscribe-creator" data-post-id="${escapeHtml(post.id)}"><i class="fa-regular fa-bell"></i> ${state.subscriptions.has(creatorKey(post)) ? "Subscribed" : "Subscribe"}</button>
                <button class="neb-action-btn ${state.subscriptions.has(creatorKey(post)) ? "active" : ""}" ...>
                <button class="neb-ai-btn" type="button" data-action="summarize-post" data-post-id="${escapeHtml(post.id)}"><i class="fa-solid fa-wand-magic-sparkles"></i> Summarize</button>
                </button>
              </div>
              <div class="neb-ai-summary" id="neb-summary-${escapeHtml(post.id)}"></div>
            </div>
          </article>
        `).join("");
      }

      function renderThread(postId) {
        if (!el.threadBody) return;
        const post = state.posts.find((item) => item.id === postId);
        if (!post) {
          el.threadBody.innerHTML = `<div class="neb-card neb-empty">This post is no longer available.</div>`;
          return;
        }

        const comments = state.comments.get(postId) || [];
        const byParent = new Map();
        comments.forEach((item) => {
          const key = item.parentId || "__root__";
          if (!byParent.has(key)) byParent.set(key, []);
          byParent.get(key).push(item);
        });

        function renderBranch(parentId, depth) {
          return (byParent.get(parentId || "__root__") || []).map((comment) => `
            <article class="neb-comment" style="padding-left:${depth * 16}px;">
              <div class="neb-comment-thread-line"><span class="neb-comment-thread-line-inner"></span></div>
              <div class="neb-comment-content">
                <div class="neb-comment-meta"><span class="neb-comment-author">${escapeHtml(comment.authorName)}</span><span>${escapeHtml(comment.authorHandle || "@member")}</span><span>•</span><span>${escapeHtml(rel(comment.createdAt))}</span></div>
                <p class="neb-comment-body">${rich(comment.body)}</p>
                <div class="neb-comment-actions"><button class="neb-action-btn" type="button" data-action="reply-comment" data-comment-id="${escapeHtml(comment.id)}">Reply</button></div>
                ${renderBranch(comment.id, Math.min(depth + 1, 6))}
              </div>
            </article>
          `).join("");
        }

        el.threadBody.innerHTML = `
          <article class="neb-card" style="padding:16px;">
            <h4 class="neb-modal-post-title">${escapeHtml(post.title)}</h4>
            <p class="neb-modal-post-body">${rich(post.body)}</p>
            <div class="neb-modal-post-meta">
              <span>${escapeHtml(post.community)}</span>
              <span>•</span>
              <span>Creator: ${escapeHtml(post.authorName)} ${escapeHtml(post.authorHandle || "@member")}</span>
              <span>•</span>
              <span>${escapeHtml(rel(post.createdAt))}</span>
            </div>
          </article>
          <div class="neb-comments-divider">${escapeHtml(post.commentCount === 1 ? "1 Comment" : `${fmtCount(post.commentCount)} Comments`)}</div>
          ${comments.length ? renderBranch("", 0) : `<div class="neb-card neb-empty">No comments yet</div>`}
        `;
      }

      function openThread(postId) {
        const post = state.posts.find((item) => item.id === postId);
        if (!post || !el.threadModal) return;
        state.threadPostId = postId;
        state.replyParentId = null;
        setStatus(el.replyStatus, "");
        el.threadModal.classList.add("open");
        el.threadModal.setAttribute("aria-hidden", "false");
        renderThread(postId);
        if (state.unsubComments) state.unsubComments();
        state.unsubComments = postsRef.doc(postId).collection("comments").orderBy("createdAt", "asc").limit(300).onSnapshot((snapshot) => {
          state.comments.set(postId, snapshot.docs.map(normComment));
          renderThread(postId);
        }, () => {
          if (el.threadBody) {
            el.threadBody.innerHTML = `<div class="neb-card neb-empty">Unable to load comments.</div>`;
          }
        });
      }

      async function publishPost() {
        if (!state.user) {
          setStatus(el.createStatus, "Sign in to publish a post.", "error");
          return;
        }
        const community = clean(el.postCommunity && el.postCommunity.value ? el.postCommunity.value : "r/nebula").slice(0, 48) || "r/nebula";
        const titleInput = clean(el.postTitle && el.postTitle.value ? el.postTitle.value : "");
        const bodyInput = clean(el.postBody && el.postBody.value ? el.postBody.value : "");
        const title = (titleInput || bodyInput.split("\n")[0] || "").slice(0, 300);
        if (!title) {
          setStatus(el.createStatus, "Add a title or body before posting.", "error");
          return;
        }

        if (el.submitPost) el.submitPost.disabled = true;
        setStatus(el.createStatus, "Publishing...");
        try {
          await postsRef.add({
            title,
            body: bodyInput.slice(0, 4000),
            community,
            flair: "Discussion",
            authorId: state.user.uid,
            authorName: name(state.user).slice(0, 80),
            authorHandle: handle(state.user).slice(0, 40),
            commentCount: 0,
            createdAt: fieldValue.serverTimestamp(),
            lastActivityAt: fieldValue.serverTimestamp()
          });
          if (el.postTitle) el.postTitle.value = "";
          if (el.postBody) el.postBody.value = "";
          setStatus(el.createStatus, "Post published.", "success");
          window.setTimeout(closeCreateModal, 300);
        } catch (error) {
          setStatus(el.createStatus, `Publish failed: ${String(error && error.message || "Unknown error")}`, "error");
        } finally {
          if (el.submitPost) el.submitPost.disabled = false;
        }
      }

      async function publishComment() {
        if (!state.user) {
          setStatus(el.replyStatus, "Sign in to comment.", "error");
          return;
        }
        if (!state.threadPostId) {
          setStatus(el.replyStatus, "Open a post before commenting.", "error");
          return;
        }
        const body = clean(el.replyInput && el.replyInput.value ? el.replyInput.value : "");
        if (!body) {
          setStatus(el.replyStatus, "Write a comment first.", "error");
          return;
        }
        if (el.submitReply) el.submitReply.disabled = true;
        setStatus(el.replyStatus, "Sending...");
        try {
          const postRef = postsRef.doc(state.threadPostId);
          const commentRef = postRef.collection("comments").doc();
          const batch = db.batch();
          batch.set(commentRef, {
            parentId: state.replyParentId || "",
            authorId: state.user.uid,
            authorName: name(state.user).slice(0, 80),
            authorHandle: handle(state.user).slice(0, 40),
            body: body.slice(0, 2000),
            createdAt: fieldValue.serverTimestamp()
          });
          batch.update(postRef, {
            commentCount: fieldValue.increment(1),
            lastActivityAt: fieldValue.serverTimestamp()
          });
          await batch.commit();
          if (el.replyInput) el.replyInput.value = "";
          state.replyParentId = null;
          setStatus(el.replyStatus, "Comment posted.", "success");
        } catch (error) {
          setStatus(el.replyStatus, `Comment failed: ${String(error && error.message || "Unknown error")}`, "error");
        } finally {
          if (el.submitReply) el.submitReply.disabled = false;
        }
      }

      async function toggleLike(postId) {
        if (!state.user) {
          setStatus(el.feedStatus, "Sign in to like posts.", "error");
          return;
        }
        const post = state.posts.find((item) => item.id === postId);
        if (!post) return;
        const hadLike = state.likedPosts.has(postId);
        const delta = hadLike ? -1 : 1;
        if (hadLike) state.likedPosts.delete(postId);
        else state.likedPosts.add(postId);
        savePrefs();
        renderPosts();
        try {
          await postsRef.doc(postId).update({ likesCount: fieldValue.increment(delta) });
          setStatus(el.feedStatus, hadLike ? "Like removed." : "Post liked.", "success");
        } catch (_error) {
          if (hadLike) state.likedPosts.add(postId);
          else state.likedPosts.delete(postId);
          savePrefs();
          renderPosts();
          setStatus(el.feedStatus, "Could not update like right now.", "error");
        }
      }

      function toggleSubscription(postId) {
        const post = state.posts.find((item) => item.id === postId);
        if (!post) return;
        const key = creatorKey(post);
        if (state.subscriptions.has(key)) state.subscriptions.delete(key);
        else state.subscriptions.add(key);
        savePrefs();
        renderPosts();
      }

      function toggleCommunity(communityId) {
        if (!communityId) return;
        if (state.memberships.has(communityId)) state.memberships.delete(communityId);
        else state.memberships.add(communityId);
        savePrefs();
        renderCommunityList();
      }

            const GROQ_TUNNEL = "https://script.google.com/macros/s/AKfycbxJuTi1kjlVIFsdBHZis_pp-AXwSaxxa6hmgmM8zOXbevupfl42wugnPLt9J_7CxywH/exec";

async function summarizePost(postId) {
  const post = state.posts.find(item => item.id === postId);
  if (!post) return;

  const btn = el.list.querySelector(`[data-action="summarize-post"][data-post-id="${postId}"]`);
  const summaryEl = document.getElementById(`neb-summary-${postId}`);
  if (!btn || !summaryEl) return;

  // Toggle off if already showing
  if (summaryEl.classList.contains("visible")) {
    summaryEl.classList.remove("visible");
    btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Summarize`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Summarizing…`;

  const prompt = `Summarize this post in 2-3 sentences. Be concise and neutral.

Title: ${post.title}
Body: ${post.body || "(no body)"}
Community: ${post.community}`;

console.log("Sending to AI:", prompt);
  try {
    const res = await fetch(GROQ_TUNNEL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ message: prompt })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // handle common response shapes
    const text = (
      data.result ||
      data.response ||
      data.text ||
      data.content ||
      (data.choices && data.choices[0]?.message?.content) ||
      JSON.stringify(data)
    ).trim();

    summaryEl.innerHTML = `
      <div class="neb-ai-summary-label">AI Summary</div>
      ${escapeHtml(text)}
    `;
    summaryEl.classList.add("visible");
    btn.innerHTML = `<i class="fa-solid fa-xmark"></i> Hide`;

  } catch (err) {
    summaryEl.innerHTML = `
      <div class="neb-ai-summary-label">Error</div>
      Could not fetch summary: ${escapeHtml(String(err.message || err))}
    `;
    summaryEl.classList.add("visible");
    btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Summarize`;
  } finally {
    btn.disabled = false;
  }
}


      function applySortButtonState() {
        el.sortButtons.forEach((button) => {
          button.classList.toggle("active", button.getAttribute("data-sort") === state.sort);
        });
      }

      function subscribePosts() {
        if (state.unsubPosts) state.unsubPosts();
        let query = postsRef;
        if (state.sort === "top") {
          query = query.orderBy("commentCount", "desc").orderBy("lastActivityAt", "desc");
        } else if (state.sort === "hot") {
          query = query.orderBy("lastActivityAt", "desc").orderBy("commentCount", "desc");
        } else {
          query = query.orderBy("lastActivityAt", "desc");
        }
        state.unsubPosts = query.limit(60).onSnapshot((snapshot) => {
          state.posts = snapshot.docs.map(normPost);
          renderPosts();
          if (state.threadPostId) renderThread(state.threadPostId);
        }, () => {
          if (el.list) el.list.innerHTML = `<div class="neb-card neb-empty">Feed unavailable</div>`;
        });
      }

      function onKeydown(event) {
        if (event.key !== "Escape") return;
        if (el.createModal && el.createModal.classList.contains("open")) closeCreateModal();
        if (el.threadModal && el.threadModal.classList.contains("open")) closeThreadModal();
      }

      function teardown() {
        if (state.unsubPosts) state.unsubPosts();
        if (state.unsubComments) state.unsubComments();
        if (state.unsubAuth) state.unsubAuth();
        if (state.observer) state.observer.disconnect();
        document.removeEventListener("keydown", onKeydown);
      }

      window.NebulaFeedRoute = { teardown };
      state.observer = new MutationObserver(() => {
        if (!document.body.contains(root)) teardown();
      });
      state.observer.observe(document.body, { childList: true, subtree: true });

      if (el.openCreate) el.openCreate.addEventListener("click", openCreateModal);
      if (el.openCreateImg) el.openCreateImg.addEventListener("click", openCreateModal);
      if (el.openCreateLink) el.openCreateLink.addEventListener("click", openCreateModal);
      if (el.openCreatePoll) el.openCreatePoll.addEventListener("click", openCreateModal);
      if (el.closeCreate) el.closeCreate.addEventListener("click", closeCreateModal);
      if (el.cancelCreate) el.cancelCreate.addEventListener("click", closeCreateModal);
      if (el.submitPost) el.submitPost.addEventListener("click", publishPost);

      if (el.createModal) {
        el.createModal.addEventListener("click", (event) => {
          if (event.target === el.createModal) closeCreateModal();
        });
      }

      if (el.closeThread) el.closeThread.addEventListener("click", closeThreadModal);
      if (el.cancelReply) el.cancelReply.addEventListener("click", () => {
        if (el.replyInput) el.replyInput.value = "";
        state.replyParentId = null;
        setStatus(el.replyStatus, "");
      });
      if (el.submitReply) el.submitReply.addEventListener("click", publishComment);
      if (el.threadModal) {
        el.threadModal.addEventListener("click", (event) => {
          if (event.target === el.threadModal) closeThreadModal();
        });
      }

      if (el.list) {
        el.list.addEventListener("click", (event) => {
          const target = event.target.closest("[data-action]");
          if (!target) return;
          const action = target.getAttribute("data-action");
          const postId = target.getAttribute("data-post-id") || target.closest("[data-post-id]") && target.closest("[data-post-id]").getAttribute("data-post-id");
          if (!postId) return;
          if (action === "like-post") {
            toggleLike(postId);
            return;
          }
          if (action === "subscribe-creator") {
            toggleSubscription(postId);
            return;
          }
          if (action === "summarize-post") {
          summarizePost(postId);
          return;
         }
          openThread(postId);
          if (action === "reply-post") {
            requestAnimationFrame(() => {
              if (el.replyInput) el.replyInput.focus();
            });
          }
        });
      }

      if (el.communityList) {
        el.communityList.addEventListener("click", (event) => {
          const target = event.target.closest('[data-action="toggle-community"]');
          if (!target) return;
          toggleCommunity(target.getAttribute("data-community"));
        });
      }

      if (el.threadBody) {
        el.threadBody.addEventListener("click", (event) => {
          const target = event.target.closest('[data-action="reply-comment"]');
          if (!target) return;
          const commentId = target.getAttribute("data-comment-id");
          if (!commentId) return;
          state.replyParentId = commentId;
          requestAnimationFrame(() => {
            if (el.replyInput) el.replyInput.focus();
          });
        });
      }

      el.sortButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const next = String(button.getAttribute("data-sort") || "new");
          if (next === state.sort) return;
          state.sort = next;
          applySortButtonState();
          subscribePosts();
        });
      });

      document.addEventListener("keydown", onKeydown);
      state.unsubAuth = auth.onAuthStateChanged((user) => {
        state.user = user || null;
        loadPrefs();
        renderCommunityList();
        renderPosts();
        if (!state.user) {
          setStatus(el.feedStatus, "Sign in to create posts and comments.", "error");
        } else {
          setStatus(el.feedStatus, `Signed in as ${name(state.user)} ${handle(state.user)}.`);
        }
      });

      loadPrefs();
      renderCommunityList();
      applySortButtonState();
      subscribePosts();
      renderPosts();
    }
  };
})();
