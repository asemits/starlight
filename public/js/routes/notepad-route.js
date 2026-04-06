(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  modules["/notepad"] = {
    render: function () {
      return `
<style>
.notepad-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
}

.notepad {
    width: 95%;
    max-width: 1000px;
    height: 85vh;
    backdrop-filter: blur(25px);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.topbar {
    display: flex;
    justify-content: space-between; /* Spreads groups to edges */
    align-items: center;
    flex-wrap: wrap; /* Wraps groups to next line on mobile */
    gap: 15px;
    padding: 10px;
    background: rgba(0,0,0,0.3);
}

.action-group {
    display: flex;
    gap: 5px;
    background: rgba(255,255,255,0.03); /* Subtle background for the group */
    padding: 4px;
    border-radius: 8px;
}

/* Make the "Run" button stand out */
#runBtn {
    background: #2ed573;
    color: #000;
    font-weight: bold;
}

/* Make "Clear" look dangerous */
.danger:hover {
    background: #ff4757 !important;
}

button {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #efefef;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
}

button:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.3);
}

/* Special Button Colors */
#runBtn { background: rgba(46, 213, 115, 0.15); color: #2ed573; border-color: rgba(46, 213, 115, 0.2); }
#runBtn:hover { background: rgba(46, 213, 115, 0.25); }
#clearBtn:hover { background: rgba(255, 71, 87, 0.2); color: #ff4757; border-color: rgba(255, 71, 87, 0.3); }

.editor-wrapper {
    position: relative;
    flex: 1;
    overflow: hidden;
}

#highlight, #note {
    position: absolute;
    inset: 0;
    padding: 20px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    border: none;
    outline: none;
    box-sizing: border-box;
}

#highlight { z-index: 1; color: transparent; pointer-events: none; }
#note { z-index: 2; background: transparent; color: rgba(255, 255, 255, 0.85); caret-color: #fff; resize: none; }

/* Tokens */
.token-keyword { color: #ff7b72; font-weight: bold; }
.token-string { color: #a5d6ff; }
.token-comment { color: #6e7681; }
.token-number { color: #79c0ff; }

/* Scrollbar */
#note::-webkit-scrollbar { width: 6px; }
#note::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
</style>

<div class="notepad-wrapper">
  <div class="notepad">
      <div class="topbar">
    <div class="action-group primary">
        <button id="runBtn">▶ Run</button>
        <button id="downloadBtn">Save</button>
    </div>

    <div class="action-group editing">
        <button id="undoBtn">↶</button>
        <button id="redoBtn">↷</button>
        <button id="copyBtn">Copy</button>
    </div>

    <div class="action-group settings">
        <div class="font-controls">
            <button id="fontMinusBtn">-</button>
            <button id="fontPlusBtn">+</button>
        </div>
        <button id="wrapBtn">Wrap</button>
        <button id="clearBtn" class="danger">Clear</button>
    </div>
</div>

      <div class="editor-wrapper">
        <pre id="highlight" class="highlight"></pre>
        <textarea id="note" placeholder="Ready for input..." spellcheck="false"></textarea>
      </div>
  </div>
</div>
`;
    },

    afterRender: function (path) {
      const container = document.getElementById("app-content");
      const textarea = container.querySelector('#note');
      const highlight = container.querySelector('#highlight');
      
      // Selectors
      const btns = {
        run: container.querySelector('#runBtn'),
        console: container.querySelector('#consoleRunBtn'),
        download: container.querySelector('#downloadBtn'),
        copy: container.querySelector('#copyBtn'),
        paste: container.querySelector('#pasteBtn'),
        undo: container.querySelector('#undoBtn'),
        redo: container.querySelector('#redoBtn'),
        plus: container.querySelector('#fontPlusBtn'),
        minus: container.querySelector('#fontMinusBtn'),
        wrap: container.querySelector('#wrapBtn'),
        syntax: container.querySelector('#highlightBtn'),
        format: container.querySelector('#formatBtn'),
        clear: container.querySelector('#clearBtn')
      };

      if (!textarea) return;

      let fontSize = parseInt(localStorage.getItem('notepad_fontSize')) || 15;
      let wordWrap = localStorage.getItem('notepad_wordWrap') !== 'false';
      let syntaxHighlight = localStorage.getItem('notepad_syntaxHighlight') !== 'false';

      const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const applyHighlight = (code) => {
        if (!syntaxHighlight) { highlight.innerHTML = ''; return; }
        let html = escapeHTML(code);
        html = html
          .replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>')
          .replace(/("(.*?)"|'(.*?)')/g, '<span class="token-string">$1</span>')
          .replace(/\b(const|let|var|function|return|if|else|console|window|document)\b/g, '<span class="token-keyword">$1</span>')
          .replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
        highlight.innerHTML = html + (code.endsWith('\n') ? ' ' : '');
      };

      const updateUI = () => {
        textarea.style.fontSize = highlight.style.fontSize = fontSize + 'px';
        textarea.style.whiteSpace = highlight.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
        applyHighlight(textarea.value);
      };

      const sync = () => {
        updateUI();
        localStorage.setItem('notepad_content', textarea.value);
        localStorage.setItem('notepad_fontSize', fontSize);
        localStorage.setItem('notepad_wordWrap', wordWrap);
        localStorage.setItem('notepad_syntaxHighlight', syntaxHighlight);
      };

      // Events
      textarea.addEventListener('input', sync);
      textarea.addEventListener('scroll', () => {
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
      });

      // Actions
      btns.run.onclick = () => {
        const win = window.open("");
        if (win) { win.document.write(textarea.value); win.document.close(); }
      };

      btns.console.onclick = () => { try { eval(textarea.value); } catch(e) { console.error(e); } };

      btns.download.onclick = () => {
        const blob = new Blob([textarea.value], { type: "text/html" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "nebula_export.html";
        a.click();
      };

      btns.copy.onclick = () => navigator.clipboard.writeText(textarea.value);
      
      btns.paste.onclick = async () => {
        const text = await navigator.clipboard.readText();
        const start = textarea.selectionStart;
        textarea.setRangeText(text, start, textarea.selectionEnd, 'end');
        sync();
      };

      btns.undo.onclick = () => document.execCommand('undo');
      btns.redo.onclick = () => document.execCommand('redo');
      
      btns.plus.onclick = () => { fontSize = Math.min(fontSize + 1, 30); sync(); };
      btns.minus.onclick = () => { fontSize = Math.max(fontSize - 1, 10); sync(); };
      
      btns.wrap.onclick = () => { wordWrap = !wordWrap; sync(); };
      btns.syntax.onclick = () => { syntaxHighlight = !syntaxHighlight; sync(); };
      
      btns.format.onclick = () => {
        try {
          textarea.value = JSON.stringify(JSON.parse(textarea.value), null, 2);
          sync();
        } catch(e) { alert("Invalid JSON"); }
      };

      btns.clear.onclick = () => { if(confirm("Clear editor?")) { textarea.value = ""; sync(); } };

      // Load
      textarea.value = localStorage.getItem('notepad_content') || '';
      updateUI();
    }
  };
})();