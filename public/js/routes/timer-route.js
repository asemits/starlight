(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  modules["/timer"] = {
    render: function renderTimerRoute() {
      return `
<style>
.nebula-timer-shell {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.nebula-timer-card {
  width: min(720px, 96vw);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.09), rgba(0, 0, 0, 0.36));
  backdrop-filter: blur(26px);
  -webkit-backdrop-filter: blur(26px);
  box-shadow: 0 22px 64px rgba(0, 0, 0, 0.48);
  padding: 24px;
  color: rgba(255, 255, 255, 0.95);
}

.nebula-timer-head h1 {
  margin: 0;
  font-family: 'Orbitron', 'Oxanium', sans-serif;
  letter-spacing: 0.08em;
  font-size: 24px;
}

.nebula-timer-head p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.68);
  font-family: 'Montserrat', 'DM Sans', sans-serif;
  font-size: 13px;
}

.nebula-timer-tabs {
  margin-top: 18px;
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.34);
}

.nebula-timer-tab {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  padding: 8px 14px;
  font: 600 12px/1 'Montserrat', 'DM Sans', sans-serif;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}

.nebula-timer-tab.is-active {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.nebula-timer-display {
  margin-top: 18px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: clamp(38px, 8vw, 72px);
  letter-spacing: 0.09em;
  font-variant-numeric: tabular-nums;
  color: rgba(166, 255, 238, 0.95);
  text-shadow: 0 0 28px rgba(82, 251, 216, 0.25);
}

.nebula-timer-fields {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.nebula-timer-fields.hidden {
  display: none;
}

.nebula-timer-field {
  display: grid;
  gap: 6px;
  font-family: 'Montserrat', 'DM Sans', sans-serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.62);
}

.nebula-timer-field input {
  width: 100%;
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  padding: 10px;
  text-align: center;
  font: 600 15px/1 'Fira Code', 'Consolas', monospace;
}

.nebula-timer-controls {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nebula-timer-btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  font: 700 12px/1 'Montserrat', 'DM Sans', sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: transform 160ms ease, filter 160ms ease;
}

.nebula-timer-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.07);
}

.nebula-timer-btn.start {
  background: linear-gradient(120deg, #29df8f, #19b873);
  color: #041810;
}

.nebula-timer-btn.stop {
  background: linear-gradient(120deg, #ff6b7d, #ff4f64);
  color: #fff;
}

.nebula-timer-btn.reset {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
}

.nebula-timer-reminder {
  margin-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  padding-top: 16px;
  display: grid;
  gap: 10px;
}

.nebula-timer-reminder h2 {
  margin: 0;
  font: 700 13px/1.2 'Montserrat', 'DM Sans', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
}

.nebula-timer-reminder-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 150px auto;
}

.nebula-timer-reminder-grid input {
  width: 100%;
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  padding: 10px 12px;
  font: 500 13px/1.2 'Montserrat', 'DM Sans', sans-serif;
}

.nebula-timer-reminder-grid button {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font: 700 12px/1 'Montserrat', 'DM Sans', sans-serif;
  letter-spacing: 0.04em;
  padding: 10px 14px;
  cursor: pointer;
}

.nebula-timer-status {
  margin: 12px 0 0;
  min-height: 1.2em;
  font: 600 12px/1.2 'Montserrat', 'DM Sans', sans-serif;
  color: rgba(176, 255, 230, 0.95);
  letter-spacing: 0.03em;
}

.nebula-timer-status.is-error {
  color: rgba(255, 168, 168, 0.98);
}

@media (max-width: 760px) {
  .nebula-timer-card {
    padding: 18px;
  }

  .nebula-timer-reminder-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<section class="nebula-timer-shell">
  <article class="nebula-timer-card">
    <header class="nebula-timer-head">
      <h1>Timer</h1>
    </header>

    <div class="nebula-timer-tabs" role="tablist" aria-label="Timer mode">
      <button id="nebula-timer-tab-stopwatch" class="nebula-timer-tab is-active" type="button" role="tab" aria-selected="true">Stopwatch</button>
      <button id="nebula-timer-tab-countdown" class="nebula-timer-tab" type="button" role="tab" aria-selected="false">Timer</button>
    </div>

    <div id="nebula-timer-display" class="nebula-timer-display">00:00:00</div>

    <div id="nebula-timer-fields" class="nebula-timer-fields hidden" aria-label="Countdown duration">
      <label class="nebula-timer-field">
        Hours
        <input id="nebula-timer-hours" type="number" inputmode="numeric" min="0" max="23" value="0" />
      </label>
      <label class="nebula-timer-field">
        Minutes
        <input id="nebula-timer-minutes" type="number" inputmode="numeric" min="0" max="59" value="5" />
      </label>
      <label class="nebula-timer-field">
        Seconds
        <input id="nebula-timer-seconds" type="number" inputmode="numeric" min="0" max="59" value="0" />
      </label>
    </div>

    <div class="nebula-timer-controls">
      <button class="nebula-timer-btn start" id="nebula-timer-start" type="button">Start</button>
      <button class="nebula-timer-btn stop" id="nebula-timer-stop" type="button">Pause</button>
      <button class="nebula-timer-btn reset" id="nebula-timer-reset" type="button">Reset</button>
    </div>

    <section class="nebula-timer-reminder">
      <h2>Background Reminder</h2>
      <div class="nebula-timer-reminder-grid">
        <input type="text" id="nebula-timer-reminder-text" placeholder="Remind me to..." maxlength="180" />
        <input type="number" id="nebula-timer-reminder-minutes" min="0.1" max="720" step="0.1" placeholder="Minutes" />
        <button id="nebula-timer-reminder-create" type="button">Set Reminder</button>
      </div>
    </section>

    <p id="nebula-timer-status" class="nebula-timer-status" aria-live="polite">Ready.</p>
  </article>
</section>`;
    },

    afterRender: function afterRenderTimerRoute() {
      const container = document.getElementById("app-content");
      if (!container) {
        return;
      }

      const display = container.querySelector("#nebula-timer-display");
      const status = container.querySelector("#nebula-timer-status");
      const tabStopwatch = container.querySelector("#nebula-timer-tab-stopwatch");
      const tabCountdown = container.querySelector("#nebula-timer-tab-countdown");
      const fields = container.querySelector("#nebula-timer-fields");
      const hoursInput = container.querySelector("#nebula-timer-hours");
      const minutesInput = container.querySelector("#nebula-timer-minutes");
      const secondsInput = container.querySelector("#nebula-timer-seconds");
      const startButton = container.querySelector("#nebula-timer-start");
      const stopButton = container.querySelector("#nebula-timer-stop");
      const resetButton = container.querySelector("#nebula-timer-reset");
      const reminderText = container.querySelector("#nebula-timer-reminder-text");
      const reminderMinutes = container.querySelector("#nebula-timer-reminder-minutes");
      const reminderButton = container.querySelector("#nebula-timer-reminder-create");

      if (!display || !status || !tabStopwatch || !tabCountdown || !fields || !hoursInput || !minutesInput || !secondsInput || !startButton || !stopButton || !resetButton || !reminderText || !reminderMinutes || !reminderButton) {
        return;
      }

      const state = {
        mode: "stopwatch",
        running: false,
        intervalId: 0,
        stopwatchElapsedMs: 0,
        stopwatchAnchorMs: 0,
        timerDurationMs: 5 * 60 * 1000,
        timerRemainingMs: 5 * 60 * 1000,
        timerAnchorMs: 0,
        timerAnchorRemainingMs: 5 * 60 * 1000
      };

      function safeInt(value, fallback, min, max) {
        const parsed = Number.parseInt(String(value || ""), 10);
        if (!Number.isFinite(parsed)) {
          return fallback;
        }
        return Math.min(max, Math.max(min, parsed));
      }

      function formatClock(ms) {
        const totalSeconds = Math.max(0, Math.floor(Math.max(0, Number(ms || 0)) / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      }

      function setStatus(message, isError) {
        status.textContent = String(message || "");
        status.classList.toggle("is-error", Boolean(isError));
      }

      function durationFromInputs() {
        const hours = safeInt(hoursInput.value, 0, 0, 23);
        const minutes = safeInt(minutesInput.value, 0, 0, 59);
        const seconds = safeInt(secondsInput.value, 0, 0, 59);
        return ((hours * 60 + minutes) * 60 + seconds) * 1000;
      }

      function inputsFromDuration(durationMs) {
        const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        hoursInput.value = String(hours);
        minutesInput.value = String(minutes);
        secondsInput.value = String(seconds);
      }

      function clearTicker() {
        if (state.intervalId) {
          window.clearInterval(state.intervalId);
          state.intervalId = 0;
        }
      }

      function renderDisplay() {
        const valueMs = state.mode === "stopwatch" ? state.stopwatchElapsedMs : state.timerRemainingMs;
        display.textContent = formatClock(valueMs);
      }

      function syncModeUi() {
        const isStopwatch = state.mode === "stopwatch";
        tabStopwatch.classList.toggle("is-active", isStopwatch);
        tabCountdown.classList.toggle("is-active", !isStopwatch);
        tabStopwatch.setAttribute("aria-selected", isStopwatch ? "true" : "false");
        tabCountdown.setAttribute("aria-selected", isStopwatch ? "false" : "true");
        fields.classList.toggle("hidden", isStopwatch);
      }

      function snapshotWhileRunning() {
        if (!state.running) {
          return;
        }
        const now = Date.now();
        if (state.mode === "stopwatch") {
          state.stopwatchElapsedMs = Math.max(0, now - state.stopwatchAnchorMs);
          return;
        }
        state.timerRemainingMs = Math.max(0, state.timerAnchorRemainingMs - (now - state.timerAnchorMs));
      }

      function stopClock(quiet) {
        if (!state.running) {
          if (!quiet) {
            setStatus("Already paused.", true);
          }
          return;
        }
        snapshotWhileRunning();
        state.running = false;
        clearTicker();
        renderDisplay();
        if (!quiet) {
          setStatus("Paused.", false);
        }
      }

      function finishCountdown() {
        state.running = false;
        clearTicker();
        state.timerRemainingMs = 0;
        renderDisplay();
        setStatus("Timer finished.", false);
        if (typeof window.showNebulaNotification === "function") {
          window.showNebulaNotification({
            title: "Timer",
            body: "Countdown complete.",
            type: "message"
          });
        }
      }

      function tick() {
        const now = Date.now();
        if (state.mode === "stopwatch") {
          state.stopwatchElapsedMs = Math.max(0, now - state.stopwatchAnchorMs);
          renderDisplay();
          return;
        }
        const remaining = Math.max(0, state.timerAnchorRemainingMs - (now - state.timerAnchorMs));
        state.timerRemainingMs = remaining;
        renderDisplay();
        if (remaining <= 0) {
          finishCountdown();
        }
      }

      function startClock() {
        if (state.running) {
          setStatus("Already running.", true);
          return;
        }

        if (state.mode === "stopwatch") {
          state.stopwatchAnchorMs = Date.now() - state.stopwatchElapsedMs;
        } else {
          const configuredDuration = durationFromInputs();
          if (!state.timerRemainingMs || state.timerRemainingMs > state.timerDurationMs) {
            state.timerRemainingMs = configuredDuration;
          }
          if (configuredDuration > 0) {
            state.timerDurationMs = configuredDuration;
          }
          if (state.timerRemainingMs <= 0) {
            setStatus("Set a countdown duration first.", true);
            return;
          }
          state.timerAnchorMs = Date.now();
          state.timerAnchorRemainingMs = state.timerRemainingMs;
        }

        state.running = true;
        clearTicker();
        state.intervalId = window.setInterval(tick, 100);
        setStatus("Running.", false);
      }

      function resetClock() {
        state.running = false;
        clearTicker();
        if (state.mode === "stopwatch") {
          state.stopwatchElapsedMs = 0;
        } else {
          state.timerDurationMs = durationFromInputs();
          state.timerRemainingMs = state.timerDurationMs;
        }
        renderDisplay();
        setStatus("Reset complete.", false);
      }

      function setMode(nextMode) {
        if (nextMode !== "stopwatch" && nextMode !== "timer") {
          return;
        }
        if (nextMode === state.mode) {
          return;
        }
        stopClock(true);
        state.mode = nextMode;
        if (nextMode === "timer") {
          state.timerDurationMs = durationFromInputs();
          state.timerRemainingMs = state.timerDurationMs;
        }
        syncModeUi();
        renderDisplay();
      }

      tabStopwatch.addEventListener("click", () => setMode("stopwatch"));
      tabCountdown.addEventListener("click", () => setMode("timer"));

      [hoursInput, minutesInput, secondsInput].forEach((input) => {
        input.addEventListener("input", () => {
          if (state.mode !== "timer" || state.running) {
            return;
          }
          state.timerDurationMs = durationFromInputs();
          state.timerRemainingMs = state.timerDurationMs;
          renderDisplay();
        });
      });

      startButton.addEventListener("click", startClock);
      stopButton.addEventListener("click", () => stopClock(false));
      resetButton.addEventListener("click", resetClock);

      reminderButton.addEventListener("click", () => {
        const text = String(reminderText.value || "").trim();
        const minutes = Number.parseFloat(String(reminderMinutes.value || ""));
        if (!text) {
          setStatus("Reminder text is required.", true);
          return;
        }
        if (!Number.isFinite(minutes) || minutes <= 0) {
          setStatus("Reminder minutes must be greater than 0.", true);
          return;
        }

        const delayMs = Math.round(minutes * 60000);

        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SET_REMINDER",
            text,
            delay: delayMs
          });
        } else {
          window.setTimeout(() => {
            if (typeof window.showNebulaNotification === "function") {
              window.showNebulaNotification({
                title: "Reminder",
                body: text,
                type: "message"
              });
            }
          }, delayMs);
        }

        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }

        setStatus(`Reminder set for ${minutes} minute(s).`, false);
      });

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }

      inputsFromDuration(state.timerDurationMs);
      syncModeUi();
      renderDisplay();
    }
  };
})();