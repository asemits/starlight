(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/soundboard"] = {
    render: function renderSoundboardRoute() {
      return `
        <style>
          #searchInput {
            border-radius:5px;
            background-color:Black;
            border:2px solid white;
            color:white;
          }
        </style>
        <br>
        <div id="controls">
          <button id="toggleFavorites" class="control-button favorites-toggle">Favorites: OFF</button>
          <button id="toggleButton" class="control-button overlap-toggle">Overlap: OFF</button>
          <button id="stopButton" class="control-button stop-button">Stop All Sounds</button>
          <button id="ttsToggle" class="control-button">TTS</button>
          <input id="searchInput" type="text" placeholder="Search buttons">
        </div>
        <div id="soundboard"></div>
        <div id="ttsPanel" class="hidden" style="max-width:720px;margin:20px auto;padding:14px;border:1px solid rgba(255,255,255,0.25);border-radius:14px;background:rgba(0,0,0,0.45);">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
            <strong>TTS</strong>
            <button id="ttsClose" type="button" class="control-button">Close</button>
          </div>
          <textarea id="ttsText" class="w-full bg-black border border-white/20 p-2 rounded mb-2" rows="3" placeholder="Enter text"></textarea>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <select id="ttsLangFilter" class="bg-black border border-white/20 p-2 rounded"></select>
            <select id="ttsVoice" class="bg-black border border-white/20 p-2 rounded"></select>
          </div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:8px;">
            <label>Volume <input id="ttsVolume" type="range" min="0" max="1" step="0.01" value="1"></label><span id="ttsVolumeVal">1.00</span>
            <label>Rate <input id="ttsRate" type="range" min="0.5" max="2" step="0.1" value="1"></label><span id="ttsRateVal">1.0</span>
            <label>Pitch <input id="ttsPitch" type="range" min="0" max="2" step="0.01" value="1"></label><span id="ttsPitchVal">1.00</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
            <button id="ttsSpeak" type="button" class="control-button">Speak</button>
            <button id="ttsPause" type="button" class="control-button">Pause</button>
            <button id="ttsResume" type="button" class="control-button">Resume</button>
            <button id="ttsStop" type="button" class="control-button">Stop</button>
            <button id="ttsReset" type="button" class="control-button">Reset</button>
          </div>
          <p id="ttsStatus" style="margin-top:8px;">Idle</p>
          <div id="ttsSpeaking" class="hidden" style="display:flex;gap:8px;align-items:center;">
            <span>Speaking:</span><strong id="ttsCurrentWord">-</strong>
          </div>
        </div>
      `;
    },
    afterRender: function afterRenderSoundboardRoute() {
      if (window.mountSoundboardRoute) {
        window.mountSoundboardRoute();
      }
    }
  };
})();