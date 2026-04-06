(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  modules["/timer"] = {
    render: function () {
      return `
<style>
.timer-wrapper { height: 100%; display: flex; align-items: center; justify-content: center; background: #000; color: white; }
.timer-card { width: 90%; max-width: 500px; padding: 30px; background: rgba(255,255,255,0.05); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); text-align: center; }

.display { font-size: 64px; font-family: monospace; margin: 20px 0; color: #00ffcc; text-shadow: 0 0 20px rgba(0,255,204,0.3); }
.tabs { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
.tab-btn { background: none; border: none; color: #888; cursor: pointer; font-size: 14px; padding: 5px 15px; }
.tab-btn.active { color: white; border-bottom: 2px solid #00ffcc; }

.controls { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
.btn { padding: 12px 24px; border-radius: 12px; border: none; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-start { background: #2ed573; color: #000; }
.btn-stop { background: #ff4757; color: white; }
.btn-reset { background: rgba(255,255,255,0.1); color: white; }

.reminder-input { margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px; border-radius: 8px; width: 60%; margin-bottom: 10px; }
</style>

<div class="timer-wrapper">
  <div class="timer-card">
    <div class="tabs">
      <button class="tab-btn active" id="tabStopwatch">Stopwatch</button>
      <button class="tab-btn" id="tabTimer">Timer</button>
    </div>

    <div class="display" id="mainDisplay">00:00:00</div>

    <div class="controls">
      <button class="btn btn-start" id="startBtn">Start</button>
      <button class="btn btn-stop" id="stopBtn">Stop</button>
      <button class="btn btn-reset" id="resetBtn">Reset</button>
    </div>

    <div class="reminder-input">
      <h4>Set Background Reminder</h4>
      <input type="text" id="remText" placeholder="Remind me to...">
      <input type="number" id="remTime" placeholder="Minutes">
      <button class="btn btn-reset" id="remBtn">🔔 Notify Me</button>
    </div>
  </div>
</div>`;
    },

    afterRender: function () {
      const container = document.getElementById("app-content");
      const display = container.querySelector("#mainDisplay");
      const startBtn = container.querySelector("#startBtn");
      const stopBtn = container.querySelector("#stopBtn");
      const resetBtn = container.querySelector("#resetBtn");
      const remBtn = container.querySelector("#remBtn");

      let mode = 'stopwatch'; // or 'timer'
      let startTime = 0;
      let elapsedTime = 0;
      let timerInterval;

      // 1. REGISTER SERVICE WORKER
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('SW Registered');
          // Request notification permission
          Notification.requestPermission();
        });
      }

      function formatTime(ms) {
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
      }

      startBtn.onclick = () => {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(() => {
          elapsedTime = Date.now() - startTime;
          display.innerText = formatTime(elapsedTime);
        }, 100);
      };

      stopBtn.onclick = () => clearInterval(timerInterval);

      resetBtn.onclick = () => {
        clearInterval(timerInterval);
        elapsedTime = 0;
        display.innerText = "00:00:00";
      };

      // 2. BACKGROUND REMINDER LOGIC
      remBtn.onclick = () => {
        const text = container.querySelector("#remText").value;
        const minutes = parseFloat(container.querySelector("#remTime").value);
        
        if (!text || isNaN(minutes)) return alert("Fill in reminder details");

        const delayMs = minutes * 60000;

        // Send message to Service Worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SET_REMINDER',
            text: text,
            delay: delayMs
          });
          alert(`Reminder set for ${minutes} minutes from now.`);
        }
      };
    }
  };
})();