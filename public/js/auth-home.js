(function () {
  const VERIFICATION_WINDOW_MS = 5 * 60 * 1000;
  const TOS_REQUIRED_MS = 30 * 1000;
  const USER_DOC_COLLECTION = "users";
  const USERNAME_COLLECTION = "usernames";
  const hashCache = new Map();

  const config = {
    siteName: "starlight",
    heroTagline: "your launchpad for games, tools, and everything in between",
    heroSubtext: "",
    tosText: `Starlight Terms of Service\n\n1. Use this site responsibly.\n2. Do not abuse or disrupt services.\n3. Respect applicable laws and school/workplace policies.\n4. Accounts violating these terms may be restricted.\n\nEdit this text directly in public/js/auth-home.js.`,
    features: [
      {
        title: "Games",
        description: "Browse and launch your game library.",
        icon: "fa-solid fa-gamepad",
        href: "/games"
      },
      {
        title: "Apps",
        description: "Open utility apps like weather and soundboard.",
        icon: "fa-solid fa-shapes",
        href: "/apps"
      },
      {
        title: "Settings",
        description: "Tune layout, effects, widgets, and account options.",
        icon: "fa-solid fa-gear",
        href: "/settings"
      }
    ]
  };

  const state = {
    user: null,
    unsubscribe: null,
    authReady: false,
    signupStartedAt: 0,
    verifyDeadline: 0,
    resendAllowedAt: 0,
    verifyTimerId: 0,
    verificationId: "",
    recaptcha: null
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function auth() {
    return window.starlightAuth || null;
  }

  function db() {
    return window.starlightDb || null;
  }

  function currentUser() {
    const instance = auth();
    return instance ? instance.currentUser : null;
  }

  function isLoggedIn() {
    const user = currentUser() || state.user;
    return Boolean(user && !user.isAnonymous);
  }

  function isGoogleLinked(user) {
    if (!user || !Array.isArray(user.providerData)) {
      return false;
    }
    return user.providerData.some((provider) => provider && provider.providerId === "google.com");
  }

  function hasPasswordProvider(user) {
    if (!user || !Array.isArray(user.providerData)) {
      return false;
    }
    return user.providerData.some((provider) => provider && provider.providerId === "password");
  }

  function normalizeUsername(username) {
    return String(username || "").trim().toLowerCase();
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

  async function hashText(value) {
    const input = String(value || "");
    if (hashCache.has(input)) {
      return hashCache.get(input);
    }
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    hashCache.set(input, hex);
    return hex;
  }

  function passwordScore(password) {
    let score = 0;
    if (password.length >= 12) score += 30;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    if (password.length >= 18) score += 10;
    return Math.max(0, Math.min(100, score));
  }

  function passwordStrengthLabel(score) {
    if (score < 40) return { label: "Weak", color: "#ef4444" };
    if (score < 75) return { label: "Medium", color: "#f59e0b" };
    return { label: "Strong", color: "#22c55e" };
  }

  function passwordIsValid(password) {
    return password.length >= 12 && /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  }

  function setStatus(targetId, text, ok) {
    const node = document.getElementById(targetId);
    if (!node) {
      return;
    }
    node.textContent = text;
    node.classList.toggle("ok", Boolean(ok));
    node.classList.toggle("error", !ok);
  }

  function closeModal() {
    const modal = document.getElementById("starlight-auth-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.innerHTML = "";
    }
    if (state.verifyTimerId) {
      window.clearInterval(state.verifyTimerId);
      state.verifyTimerId = 0;
    }
  }

  function modalShell(title, body) {
    return `
      <div class="starlight-modal-layer" style="position:fixed;inset:0;display:grid;place-items:center;padding:14px;z-index:1;">
        <div class="starlight-modal-backdrop" data-close-modal="1" style="position:absolute;inset:0;background:rgba(0,0,0,0.66);backdrop-filter:blur(4px);"></div>
        <div class="starlight-modal-card" style="position:relative;z-index:1;width:min(94vw,580px);max-height:86vh;overflow-y:auto;">
          <div class="starlight-modal-head">
            <h2>${escapeHtml(title)}</h2>
            <button type="button" class="starlight-modal-close" data-close-modal="1"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="starlight-modal-body">${body}</div>
        </div>
      </div>
    `;
  }

  function showModal(title, body) {
    const modal = document.getElementById("starlight-auth-modal");
    if (!modal) {
      return;
    }
    modal.innerHTML = modalShell(title, body);
    modal.classList.remove("hidden");
    modal.querySelectorAll("[data-close-modal='1']").forEach((node) => {
      node.addEventListener("click", closeModal);
    });
  }

  function showMessagePopup(message, title) {
    showModal(title || "Notice", `<p class="starlight-popup-copy">${escapeHtml(message)}</p><button type="button" id="starlight-popup-ok" class="starlight-btn starlight-btn-primary">OK</button>`);
    const ok = document.getElementById("starlight-popup-ok");
    if (ok) {
      ok.addEventListener("click", closeModal);
    }
  }

  function toTimeText(ms) {
    const remaining = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  async function ensureUserDoc(user, usernameMaybe) {
    const firestore = db();
    if (!firestore || !user) {
      return;
    }
    const providers = (user.providerData || []).map((item) => item.providerId).filter(Boolean);
    const emailHash = await hashText(String(user.email || "").toLowerCase());
    const payload = {
      uid: user.uid,
      emailHash,
      providers,
      email: firebase.firestore.FieldValue.delete(),
      username: firebase.firestore.FieldValue.delete(),
      usernameLower: firebase.firestore.FieldValue.delete(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (usernameMaybe) {
      const normalized = normalizeUsername(usernameMaybe);
      payload.usernameHash = await hashText(normalized);
    }
    await firestore.collection(USER_DOC_COLLECTION).doc(user.uid).set(payload, { merge: true });
  }

  async function reserveUsername(user, username) {
    const firestore = db();
    if (!firestore || !user) {
      throw new Error("Database unavailable.");
    }
    const clean = String(username || "").trim();
    const normalized = normalizeUsername(clean);
    if (!normalized || !/^[a-z0-9_.-]{3,24}$/.test(normalized)) {
      throw new Error("Username is invalid.");
    }
    const normalizedHash = await hashText(normalized);

    await firestore.runTransaction(async (tx) => {
      const userRef = firestore.collection(USER_DOC_COLLECTION).doc(user.uid);
      const usernameRef = firestore.collection(USERNAME_COLLECTION).doc(normalizedHash);
      const [userDoc, usernameDoc] = await Promise.all([tx.get(userRef), tx.get(usernameRef)]);

      if (usernameDoc.exists) {
        const ownerUid = usernameDoc.data() && usernameDoc.data().uid ? String(usernameDoc.data().uid) : "";
        if (ownerUid && ownerUid !== user.uid) {
          throw new Error("Username is already taken.");
        }
      }

      const oldHash = userDoc.exists && userDoc.data() && userDoc.data().usernameHash ? String(userDoc.data().usernameHash) : "";
      const oldLower = userDoc.exists && userDoc.data() && userDoc.data().usernameLower ? String(userDoc.data().usernameLower) : "";
      if (oldHash && oldHash !== normalizedHash) {
        const oldRef = firestore.collection(USERNAME_COLLECTION).doc(oldHash);
        tx.delete(oldRef);
      }
      if (oldLower && oldLower !== normalized) {
        const oldPlainRef = firestore.collection(USERNAME_COLLECTION).doc(oldLower);
        tx.delete(oldPlainRef);
      }

      tx.set(usernameRef, {
        uid: user.uid,
        usernameHash: normalizedHash,
        username: firebase.firestore.FieldValue.delete(),
        usernameLower: firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      tx.set(userRef, {
        usernameHash: normalizedHash,
        username: firebase.firestore.FieldValue.delete(),
        usernameLower: firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    return clean;
  }

  function renderHome(selector) {
    const root = document.querySelector(selector);
    if (!root) {
      return;
    }

    const featureCards = config.features.map((card) => {
      return `
        <a href="${escapeHtml(card.href)}" class="starlight-home-feature nav-link" ${isLoggedIn() ? "" : "tabindex='-1'"}>
          <div class="starlight-home-feature-icon"><i class="${escapeHtml(card.icon)}"></i></div>
          <h3>${escapeHtml(card.title)}</h3>
          <p>${escapeHtml(card.description)}</p>
        </a>
      `;
    }).join("");

    if (isLoggedIn()) {
      root.innerHTML = `
        <section class="starlight-home-shell starlight-dashboard-shell">
          <header class="starlight-home-hero">
            <p class="starlight-home-kicker">Dashboard</p>
            <h1>${escapeHtml(config.siteName)}</h1>
            <p class="starlight-home-tagline">Welcome back.</p>
          </header>

          <section class="starlight-dashboard-section">
            <div class="starlight-dashboard-head">
              <h2>Recently Played</h2>
              <a href="/games" class="nav-link starlight-dashboard-link">Open games</a>
            </div>
            <div id="dashboard-recent" class="starlight-dashboard-grid"></div>
          </section>

          <section class="starlight-dashboard-section">
            <div class="starlight-dashboard-head">
              <h2>Favorites</h2>
              <a href="/games" class="nav-link starlight-dashboard-link">Manage favorites</a>
            </div>
            <div id="dashboard-favorites" class="starlight-dashboard-grid"></div>
          </section>

          <section class="starlight-dashboard-section">
            <div class="starlight-dashboard-head">
              <h2>Your Stats</h2>
            </div>
            <div id="dashboard-stats" class="starlight-dashboard-stats"></div>
          </section>

          <div class="starlight-home-auth-actions">
            <button id="starlight-logout" type="button" class="starlight-btn starlight-btn-muted">Log Out</button>
          </div>
        </section>
      `;
      loadSignedInDashboard();
    } else {
      root.innerHTML = `
      <section class="starlight-home-shell">
        <header class="starlight-home-hero">
          <p class="starlight-home-kicker">Welcome</p>
          <h1>${escapeHtml(config.siteName)}</h1>
          <p class="starlight-home-tagline">${escapeHtml(config.heroTagline)}</p>
          <p class="starlight-home-subtext">${escapeHtml(config.heroSubtext)}</p>
        </header>
        <section class="starlight-home-grid">
          ${featureCards}
        </section>
        <div class="starlight-home-auth-actions">
            <button id="starlight-login" type="button" class="starlight-btn starlight-btn-muted">Log In</button>
            <button id="starlight-signup" type="button" class="starlight-btn starlight-btn-highlight">Sign Up</button>
        </div>
      </section>
    `;
    }

    const loginBtn = document.getElementById("starlight-login");
    if (loginBtn) {
      loginBtn.addEventListener("click", openLoginModal);
    }

    const signupBtn = document.getElementById("starlight-signup");
    if (signupBtn) {
      signupBtn.addEventListener("click", openSignupTosModal);
    }

    const logoutBtn = document.getElementById("starlight-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const instance = auth();
        if (!instance) {
          return;
        }
        await instance.signOut();
      });
    }
  }

  async function loadSignedInDashboard() {
    const firestore = db();
    const user = currentUser();
    const recentNode = document.getElementById("dashboard-recent");
    const favoritesNode = document.getElementById("dashboard-favorites");
    const statsNode = document.getElementById("dashboard-stats");
    if (!firestore || !user || !recentNode || !favoritesNode || !statsNode) {
      return;
    }

    recentNode.innerHTML = '<p class="starlight-dashboard-empty">Loading...</p>';
    favoritesNode.innerHTML = '<p class="starlight-dashboard-empty">Loading...</p>';
    statsNode.innerHTML = '';

    try {
      const snap = await firestore.collectionGroup("players").where("uid", "==", user.uid).limit(120).get();
      let sourceDocs = snap.docs;
      if (!sourceDocs.length) {
        const fallbackSnap = await firestore
          .collectionGroup("players")
          .where(firebase.firestore.FieldPath.documentId(), "==", user.uid)
          .limit(120)
          .get();
        sourceDocs = fallbackSnap.docs;
      }

      const list = sourceDocs.map((doc) => {
        const data = doc.data() || {};
        return {
          gameName: String(data.gameName || "Unknown game"),
          gameImage: String(data.gameImage || ""),
          gamePath: String(data.gamePath || ""),
          clickCount: Number(data.clickCount || 0),
          rating: Number(data.rating || 0),
          lastPlayedAtMs: toMillis(data.lastPlayedAt),
          lastRatedAtMs: toMillis(data.lastRatedAt)
        };
      });

      const recent = list
        .filter((item) => item.clickCount > 0)
        .sort((a, b) => b.lastPlayedAtMs - a.lastPlayedAtMs)
        .slice(0, 8);

      const favorites = list
        .filter((item) => item.rating === 1)
        .sort((a, b) => b.lastRatedAtMs - a.lastRatedAtMs)
        .slice(0, 8);

      const totalPlays = list.reduce((sum, item) => sum + Math.max(0, item.clickCount), 0);
      const gamesPlayed = list.filter((item) => item.clickCount > 0).length;
      const thumbsUpGiven = list.filter((item) => item.rating === 1).length;
      const thumbsDownGiven = list.filter((item) => item.rating === -1).length;

      function tileMarkup(item) {
        const imageMarkup = item.gameImage ? `<img src="${escapeHtml(item.gameImage)}" alt="${escapeHtml(item.gameName)}">` : "<div class=\"starlight-dashboard-fallback\"><i class=\"fa-solid fa-gamepad\"></i></div>";
        return `
          <a href="/games" class="nav-link starlight-dashboard-item">
            <div class="starlight-dashboard-thumb">${imageMarkup}</div>
            <h3>${escapeHtml(item.gameName)}</h3>
            <p>Plays: ${item.clickCount}</p>
          </a>
        `;
      }

      recentNode.innerHTML = recent.length ? recent.map(tileMarkup).join("") : '<p class="starlight-dashboard-empty">No recent games yet.</p>';
      favoritesNode.innerHTML = favorites.length ? favorites.map(tileMarkup).join("") : '<p class="starlight-dashboard-empty">No favorites yet. Thumbs-up games in Games.</p>';

      statsNode.innerHTML = `
        <article class="starlight-stat-card"><h3>Total Plays</h3><p>${totalPlays}</p></article>
        <article class="starlight-stat-card"><h3>Games Played</h3><p>${gamesPlayed}</p></article>
        <article class="starlight-stat-card"><h3>Thumbs Up Given</h3><p>${thumbsUpGiven}</p></article>
        <article class="starlight-stat-card"><h3>Thumbs Down Given</h3><p>${thumbsDownGiven}</p></article>
      `;
    } catch (_error) {
      recentNode.innerHTML = '<p class="starlight-dashboard-empty">Could not load recent games.</p>';
      favoritesNode.innerHTML = '<p class="starlight-dashboard-empty">Could not load favorites.</p>';
      statsNode.innerHTML = '<p class="starlight-dashboard-empty">Could not load stats.</p>';
    }
  }

  function syncLockedState(path) {
    const locked = !isLoggedIn();
    document.body.classList.toggle("auth-locked", locked);
    document.body.setAttribute("data-auth-lock", locked ? "on" : "off");
    document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const disabled = locked && href !== "/";
      link.classList.toggle("auth-disabled", disabled);
      if (disabled) {
        link.setAttribute("aria-disabled", "true");
      } else {
        link.removeAttribute("aria-disabled");
      }
    });
    if (locked && path !== "/") {
      showMessagePopup("Log in or sign up to access that page.", "Locked");
    }
  }

  function guardedPath(path) {
    const normalized = String(path || "/");
    if (!isLoggedIn() && normalized !== "/") {
      if (window.location.pathname !== "/") {
        window.history.replaceState({}, "", "/");
      }
      return "/";
    }
    return normalized;
  }

  function openLoginModal() {
    showModal("Log In", `
      <form id="starlight-login-form" class="starlight-auth-form">
        <label>Email</label>
        <input id="login-email" type="email" required autocomplete="email" />
        <label>Password</label>
        <input id="login-password" type="password" required autocomplete="current-password" />
        <p id="login-status" class="starlight-status"></p>
        <button type="submit" class="starlight-btn starlight-btn-primary">Log In</button>
        <button type="button" id="login-google" class="starlight-btn starlight-btn-google"><i class="fa-brands fa-google"></i> Continue with Google</button>
      </form>
    `);

    const form = document.getElementById("starlight-login-form");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const instance = auth();
        if (!instance) {
          setStatus("login-status", "Authentication is unavailable.", false);
          return;
        }
        const email = String(document.getElementById("login-email").value || "").trim();
        const password = String(document.getElementById("login-password").value || "");
        try {
          const result = await instance.signInWithEmailAndPassword(email, password);
          await ensureUserDoc(result.user, result.user.displayName || "");
          closeModal();
        } catch (error) {
          setStatus("login-status", error && error.message ? error.message : "Login failed.", false);
        }
      });
    }

    const googleBtn = document.getElementById("login-google");
    if (googleBtn) {
      googleBtn.addEventListener("click", async () => {
        const instance = auth();
        if (!instance) {
          return;
        }
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          const result = await instance.signInWithPopup(provider);
          await ensureUserDoc(result.user, result.user.displayName || "");
          closeModal();
        } catch (error) {
          setStatus("login-status", error && error.message ? error.message : "Google login failed.", false);
        }
      });
    }
  }

  function openSignupTosModal() {
    state.signupStartedAt = Date.now();
    showModal("Terms of Service", `
      <div class="starlight-tos-block">${escapeHtml(config.tosText).replaceAll("\n", "<br>")}</div>
      <p id="signup-status" class="starlight-status"></p>
      <button type="button" id="signup-tos-continue" class="starlight-btn starlight-btn-primary">I Agree, Continue</button>
      <button type="button" id="signup-google" class="starlight-btn starlight-btn-google"><i class="fa-brands fa-google"></i> Sign up with Google</button>
    `);

    const continueBtn = document.getElementById("signup-tos-continue");
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        if (Date.now() - state.signupStartedAt < TOS_REQUIRED_MS) {
          showMessagePopup("Read it, you lazy bum.", "Slow Down");
          return;
        }
        openSignupFormModal();
      });
    }

    const googleBtn = document.getElementById("signup-google");
    if (googleBtn) {
      googleBtn.addEventListener("click", async () => {
        const instance = auth();
        if (!instance) {
          return;
        }
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          const result = await instance.signInWithPopup(provider);
          await ensureUserDoc(result.user, result.user.displayName || "");
          closeModal();
        } catch (error) {
          setStatus("signup-status", error && error.message ? error.message : "Google sign up failed.", false);
        }
      });
    }
  }

  function openSignupFormModal() {
    showModal("Create Account", `
      <form id="starlight-signup-form" class="starlight-auth-form">
        <label>Email</label>
        <input id="signup-email" type="email" required autocomplete="email" />
        <label>Password</label>
        <input id="signup-password" type="password" required autocomplete="new-password" />
        <div class="starlight-strength-wrap">
          <div id="signup-strength-bar" class="starlight-strength-bar"></div>
        </div>
        <p id="signup-strength-text" class="starlight-strength-text">Strength: Weak</p>
        <label>Confirm Password</label>
        <input id="signup-confirm-password" type="password" required autocomplete="new-password" />
        <p id="signup-form-status" class="starlight-status"></p>
        <button type="submit" class="starlight-btn starlight-btn-primary">Create Account</button>
      </form>
    `);

    const passwordInput = document.getElementById("signup-password");
    const strengthBar = document.getElementById("signup-strength-bar");
    const strengthText = document.getElementById("signup-strength-text");

    function refreshStrength() {
      const score = passwordScore(String(passwordInput.value || ""));
      const strength = passwordStrengthLabel(score);
      strengthBar.style.width = `${score}%`;
      strengthBar.style.background = strength.color;
      strengthText.textContent = `Strength: ${strength.label}`;
      strengthText.style.color = strength.color;
    }

    if (passwordInput) {
      passwordInput.addEventListener("input", refreshStrength);
      refreshStrength();
    }

    const form = document.getElementById("starlight-signup-form");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const instance = auth();
        if (!instance) {
          setStatus("signup-form-status", "Authentication is unavailable.", false);
          return;
        }
        const email = String(document.getElementById("signup-email").value || "").trim();
        const password = String(document.getElementById("signup-password").value || "");
        const confirmPassword = String(document.getElementById("signup-confirm-password").value || "");

        if (!email || !password || !confirmPassword) {
          setStatus("signup-form-status", "All fields are required.", false);
          return;
        }

        if (password !== confirmPassword) {
          setStatus("signup-form-status", "Passwords do not match.", false);
          return;
        }

        if (!passwordIsValid(password)) {
          setStatus("signup-form-status", "Password must be at least 12 characters with letters, numbers, and special characters.", false);
          return;
        }

        try {
          await instance.createUserWithEmailAndPassword(email, password);
          const user = currentUser();
          if (!user) {
            setStatus("signup-form-status", "Could not create account.", false);
            return;
          }
          await user.sendEmailVerification();
          state.verifyDeadline = Date.now() + VERIFICATION_WINDOW_MS;
          state.resendAllowedAt = Date.now() + VERIFICATION_WINDOW_MS;
          openVerifyEmailModal();
        } catch (error) {
          setStatus("signup-form-status", error && error.message ? error.message : "Sign up failed.", false);
        }
      });
    }
  }

  function openVerifyEmailModal() {
    showModal("Verify Email", `
      <div class="starlight-auth-form">
        <p>We sent a verification email. Verify within five minutes to continue.</p>
        <p>Time left: <strong id="verify-countdown">05:00</strong></p>
        <p id="verify-status" class="starlight-status"></p>
        <button id="verify-refresh" type="button" class="starlight-btn starlight-btn-primary">I Verified</button>
        <button id="verify-resend" type="button" class="starlight-btn starlight-btn-muted" disabled>Resend Email</button>
      </div>
    `);

    const countdown = document.getElementById("verify-countdown");
    const resendBtn = document.getElementById("verify-resend");
    const refreshBtn = document.getElementById("verify-refresh");

    function refreshTimer() {
      const now = Date.now();
      const untilDeadline = Math.max(0, state.verifyDeadline - now);
      const untilResend = Math.max(0, state.resendAllowedAt - now);
      if (countdown) {
        countdown.textContent = toTimeText(untilDeadline);
      }
      if (resendBtn) {
        resendBtn.disabled = untilResend > 0;
        resendBtn.textContent = untilResend > 0 ? `Resend Email (${toTimeText(untilResend)})` : "Resend Email";
      }
      if (untilDeadline <= 0) {
        setStatus("verify-status", "Verification window expired. Resend and verify again.", false);
      }
    }

    refreshTimer();
    if (state.verifyTimerId) {
      window.clearInterval(state.verifyTimerId);
    }
    state.verifyTimerId = window.setInterval(refreshTimer, 1000);

    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        const user = currentUser();
        if (!user) {
          setStatus("verify-status", "No active user.", false);
          return;
        }
        if (Date.now() < state.resendAllowedAt) {
          return;
        }
        try {
          await user.sendEmailVerification();
          state.verifyDeadline = Date.now() + VERIFICATION_WINDOW_MS;
          state.resendAllowedAt = Date.now() + VERIFICATION_WINDOW_MS;
          setStatus("verify-status", "Verification email resent.", true);
          refreshTimer();
        } catch (error) {
          setStatus("verify-status", error && error.message ? error.message : "Could not resend email.", false);
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        const user = currentUser();
        if (!user) {
          setStatus("verify-status", "No active user.", false);
          return;
        }
        try {
          await user.reload();
          const updatedUser = currentUser();
          if (Date.now() > state.verifyDeadline) {
            setStatus("verify-status", "Verification window expired. Resend and try again.", false);
            return;
          }
          if (!updatedUser || !updatedUser.emailVerified) {
            setStatus("verify-status", "Email is not verified yet.", false);
            return;
          }
          openUsernameModal();
        } catch (error) {
          setStatus("verify-status", error && error.message ? error.message : "Could not refresh user.", false);
        }
      });
    }
  }

  function openUsernameModal() {
    showModal("Choose Username", `
      <form id="username-form" class="starlight-auth-form">
        <label>Username</label>
        <input id="username-input" type="text" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_.-]{3,24}" />
        <p class="starlight-status">Use 3-24 characters: letters, numbers, underscore, period, or dash.</p>
        <p id="username-status" class="starlight-status"></p>
        <button type="submit" class="starlight-btn starlight-btn-primary">Finish Sign Up</button>
      </form>
    `);

    const form = document.getElementById("username-form");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const user = currentUser();
      if (!user) {
        setStatus("username-status", "No active user.", false);
        return;
      }

      const username = String(document.getElementById("username-input").value || "").trim();
      if (!/^[A-Za-z0-9_.-]{3,24}$/.test(username)) {
        setStatus("username-status", "Invalid username format.", false);
        return;
      }

      try {
        await reserveUsername(user, username);
        await user.updateProfile({ displayName: username });
        await ensureUserDoc(user, username);
        closeModal();
      } catch (error) {
        setStatus("username-status", error && error.message ? error.message : "Could not save username.", false);
      }
    });
  }

  async function linkGoogleInSettings() {
    const user = currentUser();
    if (!user) {
      setStatus("settings-auth-status", "You must be logged in.", false);
      return;
    }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await user.linkWithPopup(provider);
      await ensureUserDoc(result.user, result.user.displayName || "");
      setStatus("settings-auth-status", "Google account linked.", true);
      mountSettingsAuthPanel(true);
    } catch (error) {
      setStatus("settings-auth-status", error && error.message ? error.message : "Could not link Google.", false);
    }
  }

  async function unlinkGoogleInSettings() {
    const user = currentUser();
    if (!user) {
      setStatus("settings-auth-status", "You must be logged in.", false);
      return;
    }

    const linkedCount = Array.isArray(user.providerData) ? user.providerData.length : 0;
    if (linkedCount <= 1 && !hasPasswordProvider(user)) {
      setStatus("settings-auth-status", "Add another sign-in method before unlinking Google.", false);
      return;
    }

    try {
      await user.unlink("google.com");
      await ensureUserDoc(user, user.displayName || "");
      setStatus("settings-auth-status", "Google account unlinked.", true);
      mountSettingsAuthPanel(true);
    } catch (error) {
      setStatus("settings-auth-status", error && error.message ? error.message : "Could not unlink Google.", false);
    }
  }

  async function sendMfaCode() {
    const user = currentUser();
    if (!user) {
      setStatus("settings-mfa-status", "You must be logged in.", false);
      return;
    }
    const phone = String(document.getElementById("mfa-phone").value || "").trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setStatus("settings-mfa-status", "Use E.164 phone format, example +15551234567.", false);
      return;
    }

    try {
      if (state.recaptcha) {
        state.recaptcha.clear();
      }
      state.recaptcha = new firebase.auth.RecaptchaVerifier("mfa-recaptcha", { size: "invisible" });
      const session = await user.multiFactor.getSession();
      const phoneInfoOptions = { phoneNumber: phone, session };
      const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();
      state.verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, state.recaptcha);
      setStatus("settings-mfa-status", "Code sent. Enter it below to finish enrollment.", true);
    } catch (error) {
      setStatus("settings-mfa-status", error && error.message ? error.message : "Could not send code.", false);
    }
  }

  async function enrollMfaCode() {
    const user = currentUser();
    if (!user) {
      setStatus("settings-mfa-status", "You must be logged in.", false);
      return;
    }
    if (!state.verificationId) {
      setStatus("settings-mfa-status", "Request a code first.", false);
      return;
    }
    const code = String(document.getElementById("mfa-code").value || "").trim();
    if (!/^\d{6}$/.test(code)) {
      setStatus("settings-mfa-status", "Code must be 6 digits.", false);
      return;
    }

    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(state.verificationId, code);
      const assertion = firebase.auth.PhoneMultiFactorGenerator.assertion(credential);
      await user.multiFactor.enroll(assertion, "phone");
      state.verificationId = "";
      setStatus("settings-mfa-status", "2FA phone method added.", true);
      mountSettingsAuthPanel(true);
    } catch (error) {
      setStatus("settings-mfa-status", error && error.message ? error.message : "Could not enroll 2FA.", false);
    }
  }

  async function disableMfaInSettings() {
    const user = currentUser();
    if (!user) {
      setStatus("settings-mfa-status", "You must be logged in.", false);
      return;
    }

    const factors = user.multiFactor && Array.isArray(user.multiFactor.enrolledFactors) ? user.multiFactor.enrolledFactors : [];
    if (!factors.length) {
      setStatus("settings-mfa-status", "No enrolled 2FA factors found.", false);
      return;
    }

    try {
      await user.multiFactor.unenroll(factors[0].uid);
      setStatus("settings-mfa-status", "2FA method removed.", true);
      mountSettingsAuthPanel(true);
    } catch (error) {
      setStatus("settings-mfa-status", error && error.message ? error.message : "Could not disable 2FA.", false);
    }
  }

  function mountSettingsAuthPanel(forceRefresh) {
    const aside = document.querySelector("[data-settings-tab='widget']")?.closest("aside");
    const section = document.querySelector("section > [data-settings-panel='layout']")?.parentElement;
    if (!aside || !section) {
      return;
    }

    if (!forceRefresh && document.querySelector("[data-settings-tab='account']")) {
      return;
    }

    if (forceRefresh) {
      const existingTabRow = document.getElementById("settings-account-tab-row");
      const existingPanel = document.querySelector("[data-settings-panel='account']");
      if (existingTabRow) {
        existingTabRow.remove();
      }
      if (existingPanel) {
        existingPanel.remove();
      }
    }

    const user = currentUser();
    const googleLinked = isGoogleLinked(user);
    const hasMfa = Boolean(user && user.multiFactor && Array.isArray(user.multiFactor.enrolledFactors) && user.multiFactor.enrolledFactors.length > 0);

    const tabRow = document.createElement("div");
    tabRow.className = "flex items-center gap-2 mt-2";
    tabRow.id = "settings-account-tab-row";
    tabRow.innerHTML = `
      <button type="button" data-settings-tab="account" onclick="switchSettingsCategory('account')" class="flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-white/10 text-gray-300 transition"><i class="fa-solid fa-user"></i><span>Account</span></button>
      <button type="button" onclick="switchSettingsCategory('account')" title="Open Account" class="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-arrow-right"></i></button>
    `;
    aside.appendChild(tabRow);

    const panel = document.createElement("div");
    panel.className = "hidden grid grid-cols-1 sm:grid-cols-2 gap-4";
    panel.setAttribute("data-settings-panel", "account");
    panel.innerHTML = `
      <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
        <label class="block mb-2 text-sm text-gray-300">Authentication</label>
        <p class="text-sm text-gray-300 mb-2">Email: ${escapeHtml(user && user.email ? user.email : "Unknown")}</p>
        <p class="text-sm text-gray-300 mb-4">Google linked: ${googleLinked ? "Yes" : "No"}</p>
        ${googleLinked
          ? '<button id="settings-unlink-google" type="button" class="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-brands fa-google"></i> Unlink Google Account</button>'
          : '<button id="settings-link-google" type="button" class="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition"><i class="fa-brands fa-google"></i> Link Google Account</button>'}
        <p id="settings-auth-status" class="text-sm mt-3"></p>
      </article>

      <article class="relative bg-white/5 p-6 rounded-2xl border border-white/10">
        <label class="block mb-2 text-sm text-gray-300">Two-Factor Authentication (SMS)</label>
        <p class="text-sm text-gray-300 mb-3">Current status: ${hasMfa ? "Enabled" : "Not configured"}</p>
        <input id="mfa-phone" type="text" placeholder="+15551234567" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none mb-2" />
        <button id="mfa-send" type="button" class="w-full mb-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Send Code</button>
        <input id="mfa-code" type="text" placeholder="6-digit code" class="w-full bg-black border border-white/20 p-3 rounded-xl text-white outline-none mb-2" />
        <button id="mfa-enroll" type="button" class="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Enroll 2FA</button>
        ${hasMfa ? '<button id="mfa-disable" type="button" class="w-full mt-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">Disable 2FA</button>' : ''}
        <div id="mfa-recaptcha"></div>
        <p id="settings-mfa-status" class="text-sm mt-3"></p>
      </article>
    `;
    section.appendChild(panel);

    const linkBtn = document.getElementById("settings-link-google");
    if (linkBtn) {
      linkBtn.addEventListener("click", linkGoogleInSettings);
    }

    const unlinkBtn = document.getElementById("settings-unlink-google");
    if (unlinkBtn) {
      unlinkBtn.addEventListener("click", unlinkGoogleInSettings);
    }

    const sendBtn = document.getElementById("mfa-send");
    if (sendBtn) {
      sendBtn.addEventListener("click", sendMfaCode);
    }

    const enrollBtn = document.getElementById("mfa-enroll");
    if (enrollBtn) {
      enrollBtn.addEventListener("click", enrollMfaCode);
    }

    const disableBtn = document.getElementById("mfa-disable");
    if (disableBtn) {
      disableBtn.addEventListener("click", disableMfaInSettings);
    }
  }

  function bootstrapModalHost() {
    if (document.getElementById("starlight-auth-modal")) {
      return;
    }
    const host = document.createElement("div");
    host.id = "starlight-auth-modal";
    host.className = "hidden";
    document.body.appendChild(host);
  }

  function onAuthChanged(user) {
    state.user = user || null;
    state.authReady = true;
    if (typeof window.router === "function") {
      window.router();
    }
  }

  function init() {
    bootstrapModalHost();

    const instance = auth();
    if (!instance) {
      return;
    }

    if (state.unsubscribe) {
      state.unsubscribe();
    }

    state.unsubscribe = instance.onAuthStateChanged(async (user) => {
      state.user = user || null;
      if (user) {
        try {
          await ensureUserDoc(user, user.displayName || "");
        } catch (_error) {
        }
      }
      onAuthChanged(user || null);
    });
  }

  window.StarlightAuthUI = {
    config,
    init,
    guardedPath,
    syncLockedState,
    renderHome,
    openLoginModal,
    openSignupTosModal,
    mountSettingsAuthPanel,
    isLoggedIn,
    showLockedMessage: function showLockedMessage() {
      showMessagePopup("Log in or sign up to access that page.", "Locked");
    }
  };
})();
