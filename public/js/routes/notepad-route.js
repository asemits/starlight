(function () {
  const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

  modules["/notepad"] = {
    render: function renderNotepadRoute() {
      return `
<style>
.nebula-notepad-shell {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
}

.nebula-notepad-card {
  width: min(1200px, 97vw);
  height: min(86vh, 920px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.09), rgba(0, 0, 0, 0.38));
  backdrop-filter: blur(26px);
  -webkit-backdrop-filter: blur(26px);
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.52);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  overflow: hidden;
}

.nebula-notepad-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.28);
}

.nebula-notepad-group {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  padding: 4px;
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.nebula-notepad-btn,
.nebula-notepad-select {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.09);
  color: #f6f9ff;
  padding: 8px 11px;
  font: 700 11px/1 'Montserrat', 'DM Sans', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 160ms ease, filter 160ms ease, background 160ms ease;
}

.nebula-notepad-btn:hover,
.nebula-notepad-select:hover {
  transform: translateY(-1px);
  filter: brightness(1.07);
  background: rgba(255, 255, 255, 0.16);
}

.nebula-notepad-btn.run {
  background: linear-gradient(120deg, #29df8f, #19b873);
  color: #041810;
  border-color: transparent;
}

.nebula-notepad-btn.danger {
  background: rgba(255, 115, 132, 0.16);
  border-color: rgba(255, 138, 151, 0.45);
  color: rgba(255, 220, 224, 0.98);
}

.nebula-notepad-btn.is-active {
  background: rgba(142, 227, 255, 0.23);
  border-color: rgba(169, 238, 255, 0.6);
  color: #dff6ff;
}

.nebula-notepad-select {
  min-width: 138px;
}

.nebula-notepad-status {
  margin: 0;
  min-height: 1.35em;
  padding: 8px 14px;
  color: rgba(177, 255, 230, 0.95);
  font: 600 12px/1.25 'Montserrat', 'DM Sans', sans-serif;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.nebula-notepad-status.is-error {
  color: rgba(255, 164, 164, 0.98);
}

.nebula-notepad-editor-wrap {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr;
}

.nebula-notepad-editor-wrap.with-preview {
  grid-template-columns: minmax(0, 1fr) minmax(0, 45%);
}

.nebula-notepad-editor {
  min-height: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.nebula-notepad-input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: none;
  resize: none;
  padding: 18px;
  background: transparent;
  color: rgba(248, 250, 255, 0.94);
  caret-color: #ffffff;
  font: 500 15px/1.65 'Fira Code', 'Consolas', monospace;
}

.nebula-notepad-input::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.nebula-notepad-input::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.nebula-notepad-preview {
  min-height: 0;
  overflow: auto;
  padding: 18px;
  color: rgba(245, 250, 255, 0.93);
  background: rgba(0, 0, 0, 0.26);
  font: 400 14px/1.7 'DM Sans', 'Montserrat', sans-serif;
}

.nebula-notepad-preview.hidden {
  display: none;
}

.nebula-notepad-preview h1,
.nebula-notepad-preview h2,
.nebula-notepad-preview h3 {
  margin: 0.4em 0 0.35em;
  font-family: 'Orbitron', 'Oxanium', sans-serif;
  letter-spacing: 0.04em;
}

.nebula-notepad-preview p {
  margin: 0.35em 0;
}

.nebula-notepad-preview ul {
  margin: 0.35em 0;
  padding-left: 1.15rem;
}

.nebula-notepad-preview blockquote {
  margin: 0.45em 0;
  padding: 0.45em 0.8em;
  border-left: 3px solid rgba(183, 246, 255, 0.7);
  background: rgba(183, 246, 255, 0.11);
  border-radius: 8px;
}

.nebula-notepad-preview code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.94em;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 0.05em 0.38em;
}

.nebula-notepad-preview pre {
  margin: 0.45em 0;
  padding: 0.65em 0.8em;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.34);
  overflow-x: auto;
}

.nebula-notepad-preview a {
  color: rgba(172, 235, 255, 0.95);
  text-decoration: underline;
}

@media (max-width: 940px) {
  .nebula-notepad-card {
    height: min(89vh, 980px);
  }

  .nebula-notepad-editor-wrap.with-preview {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) minmax(170px, 36%);
  }

  .nebula-notepad-editor {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>

<section class="nebula-notepad-shell">
  <article class="nebula-notepad-card">
    <header class="nebula-notepad-toolbar">
      <div class="nebula-notepad-group">
        <button id="np-run" type="button" class="nebula-notepad-btn run">Run</button>
        <button id="np-save" type="button" class="nebula-notepad-btn">Save</button>
      </div>

      <div class="nebula-notepad-group">
        <button id="np-undo" type="button" class="nebula-notepad-btn">Undo</button>
        <button id="np-redo" type="button" class="nebula-notepad-btn">Redo</button>
        <button id="np-copy" type="button" class="nebula-notepad-btn">Copy</button>
        <button id="np-paste" type="button" class="nebula-notepad-btn">Paste</button>
      </div>

      <div class="nebula-notepad-group">
        <button id="np-md-h" type="button" class="nebula-notepad-btn">H1</button>
        <button id="np-md-bold" type="button" class="nebula-notepad-btn">Bold</button>
        <button id="np-md-italic" type="button" class="nebula-notepad-btn">Italic</button>
        <button id="np-md-code" type="button" class="nebula-notepad-btn">Code</button>
        <button id="np-md-link" type="button" class="nebula-notepad-btn">Link</button>
        <button id="np-md-quote" type="button" class="nebula-notepad-btn">Quote</button>
        <button id="np-md-list" type="button" class="nebula-notepad-btn">List</button>
        <button id="np-md-preview" type="button" class="nebula-notepad-btn">Preview</button>
      </div>

      <div class="nebula-notepad-group">
        <button id="np-font-minus" type="button" class="nebula-notepad-btn">A-</button>
        <button id="np-font-plus" type="button" class="nebula-notepad-btn">A+</button>
        <button id="np-wrap" type="button" class="nebula-notepad-btn">Wrap</button>
        <select id="np-mode" class="nebula-notepad-select" aria-label="Run mode">
          <option value="auto">Auto</option>
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
          <option value="markdown">Markdown</option>
          <option value="text">Text</option>
        </select>
        <button id="np-clear" type="button" class="nebula-notepad-btn danger">Clear</button>
      </div>
    </header>

    <p id="np-status" class="nebula-notepad-status" aria-live="polite">Ready.</p>

    <div id="np-editor-wrap" class="nebula-notepad-editor-wrap">
      <div class="nebula-notepad-editor">
        <textarea id="np-input" class="nebula-notepad-input" spellcheck="false" placeholder="Write notes, markdown, HTML, or JavaScript..."></textarea>
      </div>

      <aside id="np-preview" class="nebula-notepad-preview hidden"></aside>
    </div>
  </article>
</section>
`;
    },

    afterRender: function afterRenderNotepadRoute() {
      const container = document.getElementById("app-content");
      if (!container) {
        return;
      }

      const textarea = container.querySelector("#np-input");
      const status = container.querySelector("#np-status");
      const editorWrap = container.querySelector("#np-editor-wrap");
      const preview = container.querySelector("#np-preview");
      const modeSelect = container.querySelector("#np-mode");

      const runButton = container.querySelector("#np-run");
      const saveButton = container.querySelector("#np-save");
      const undoButton = container.querySelector("#np-undo");
      const redoButton = container.querySelector("#np-redo");
      const copyButton = container.querySelector("#np-copy");
      const pasteButton = container.querySelector("#np-paste");
      const headingButton = container.querySelector("#np-md-h");
      const boldButton = container.querySelector("#np-md-bold");
      const italicButton = container.querySelector("#np-md-italic");
      const codeButton = container.querySelector("#np-md-code");
      const linkButton = container.querySelector("#np-md-link");
      const quoteButton = container.querySelector("#np-md-quote");
      const listButton = container.querySelector("#np-md-list");
      const previewButton = container.querySelector("#np-md-preview");
      const fontMinusButton = container.querySelector("#np-font-minus");
      const fontPlusButton = container.querySelector("#np-font-plus");
      const wrapButton = container.querySelector("#np-wrap");
      const clearButton = container.querySelector("#np-clear");

      if (!textarea || !status || !editorWrap || !preview || !modeSelect || !runButton || !saveButton || !undoButton || !redoButton || !copyButton || !pasteButton || !headingButton || !boldButton || !italicButton || !codeButton || !linkButton || !quoteButton || !listButton || !previewButton || !fontMinusButton || !fontPlusButton || !wrapButton || !clearButton) {
        return;
      }

      let fontSize = Number.parseInt(String(localStorage.getItem("notepad_fontSize") || "15"), 10);
      if (!Number.isFinite(fontSize)) {
        fontSize = 15;
      }
      fontSize = Math.min(30, Math.max(11, fontSize));

      let wordWrap = localStorage.getItem("notepad_wordWrap") !== "false";
      let selectedMode = String(localStorage.getItem("notepad_mode") || "auto");
      if (!["auto", "javascript", "html", "markdown", "text"].includes(selectedMode)) {
        selectedMode = "auto";
      }

      let previewVisible = localStorage.getItem("notepad_markdown_preview") === "true";
      let clearConfirmUntilMs = 0;

      function escapeHtml(value) {
        return String(value || "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
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

      function utf8ToBase64(value) {
        const bytes = new TextEncoder().encode(String(value || ""));
        return bytesToBase64(bytes);
      }

      function setStatus(message, isError) {
        status.textContent = String(message || "");
        status.classList.toggle("is-error", Boolean(isError));
      }

      function normalizeMarkdownUrl(rawUrl) {
        const source = String(rawUrl || "").trim();
        if (!source) {
          return "";
        }
        const withProtocol = /^www\./i.test(source) ? `https://${source}` : source;
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

      function renderMarkdownInline(input) {
        let output = escapeHtml(input);
        output = output.replace(/`([^`\n]+)`/g, "<code>$1</code>");
        output = output.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
        output = output.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
        output = output.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
        output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, rawUrl) => {
          const href = normalizeMarkdownUrl(rawUrl);
          if (!href) {
            return `${label} (${rawUrl})`;
          }
          return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${label}</a>`;
        });
        return output;
      }

      function renderMarkdown(source) {
        const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
        const html = [];
        let inList = false;
        let inCodeBlock = false;
        let codeBuffer = [];

        const flushList = () => {
          if (inList) {
            html.push("</ul>");
            inList = false;
          }
        };

        const flushCode = () => {
          if (inCodeBlock) {
            html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
            codeBuffer = [];
            inCodeBlock = false;
          }
        };

        for (const line of lines) {
          if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
              flushCode();
            } else {
              flushList();
              inCodeBlock = true;
            }
            continue;
          }

          if (inCodeBlock) {
            codeBuffer.push(line);
            continue;
          }

          const listMatch = line.match(/^\s*[-*]\s+(.+)$/);
          if (listMatch) {
            if (!inList) {
              html.push("<ul>");
              inList = true;
            }
            html.push(`<li>${renderMarkdownInline(listMatch[1])}</li>`);
            continue;
          }

          flushList();

          if (!line.trim()) {
            continue;
          }

          const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            html.push(`<h${level}>${renderMarkdownInline(headingMatch[2])}</h${level}>`);
            continue;
          }

          const quoteMatch = line.match(/^>\s?(.*)$/);
          if (quoteMatch) {
            html.push(`<blockquote>${renderMarkdownInline(quoteMatch[1])}</blockquote>`);
            continue;
          }

          html.push(`<p>${renderMarkdownInline(line)}</p>`);
        }

        flushList();
        flushCode();

        if (!html.length) {
          return "<p>Nothing to preview yet.</p>";
        }
        return html.join("");
      }

      function detectLanguage(text) {
        if (selectedMode !== "auto") {
          return selectedMode;
        }

        const source = String(text || "");
        if (/<\/?[a-z][\s\S]*>/i.test(source)) {
          return "html";
        }
        if (/^\s*#{1,6}\s+.+$/m.test(source) || /^\s*[-*]\s+.+$/m.test(source) || /^\s*>\s+.+$/m.test(source) || /\*\*[^*\n]+\*\*/.test(source) || /`[^`\n]+`/.test(source)) {
          return "markdown";
        }
        if (/\b(const|let|var|function|=>|console\.|import\s+|export\s+|class\s+)\b/.test(source)) {
          return "javascript";
        }
        return "text";
      }

      function applyInputStyles() {
        textarea.style.fontSize = `${fontSize}px`;
        textarea.style.whiteSpace = wordWrap ? "pre-wrap" : "pre";
        textarea.style.overflowWrap = wordWrap ? "break-word" : "normal";
        wrapButton.classList.toggle("is-active", wordWrap);
      }

      function applyPreviewVisibility() {
        preview.classList.toggle("hidden", !previewVisible);
        editorWrap.classList.toggle("with-preview", previewVisible);
        previewButton.classList.toggle("is-active", previewVisible);
      }

      function renderPreview() {
        if (!previewVisible) {
          return;
        }
        preview.innerHTML = renderMarkdown(textarea.value);
      }

      function persist() {
        localStorage.setItem("notepad_content", textarea.value);
        localStorage.setItem("notepad_fontSize", String(fontSize));
        localStorage.setItem("notepad_wordWrap", String(wordWrap));
        localStorage.setItem("notepad_mode", selectedMode);
        localStorage.setItem("notepad_markdown_preview", String(previewVisible));
        renderPreview();
      }

      function insertAround(prefix, suffix, fallbackText) {
        const start = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : textarea.value.length;
        const end = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : textarea.value.length;
        const selected = textarea.value.slice(start, end);
        const content = selected || fallbackText;
        const nextText = `${prefix}${content}${suffix}`;
        textarea.setRangeText(nextText, start, end, "end");
        const nextStart = start + prefix.length;
        const nextEnd = nextStart + content.length;
        textarea.setSelectionRange(nextStart, nextEnd);
        textarea.focus();
        persist();
      }

      function prefixSelection(prefix) {
        const start = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : 0;
        const end = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : 0;
        const selected = textarea.value.slice(start, end) || "line";
        const updated = selected
          .split("\n")
          .map((line) => `${prefix}${line}`)
          .join("\n");
        textarea.setRangeText(updated, start, end, "select");
        textarea.focus();
        persist();
      }

      function openRunnerWindow(documentHtml) {
        const runner = window.open("", "_blank", "noopener,noreferrer");
        if (!runner) {
          setStatus("Pop-up blocked. Allow pop-ups for this site to run code.", true);
          return false;
        }
        runner.document.open();
        runner.document.write(documentHtml);
        runner.document.close();
        return true;
      }

      function shellHtml(title, bodyHtml) {
        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
body {
  margin: 0;
  padding: 20px;
  font-family: 'DM Sans', 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #182134 0%, #0a0f18 60%, #05070d 100%);
  color: #f4f8ff;
}
.np-run-card {
  max-width: 1000px;
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px);
  padding: 16px;
}
.np-run-card pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: 'Fira Code', 'Consolas', monospace;
}
.np-run-markdown h1,
.np-run-markdown h2,
.np-run-markdown h3 {
  font-family: 'Orbitron', 'Oxanium', sans-serif;
}
.np-run-markdown code {
  font-family: 'Fira Code', 'Consolas', monospace;
  background: rgba(255, 255, 255, 0.14);
  padding: 0.1em 0.35em;
  border-radius: 6px;
}
.np-run-markdown pre {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  padding: 0.65em 0.8em;
  overflow-x: auto;
}
.np-run-markdown a {
  color: rgba(174, 233, 255, 0.98);
}
</style>
</head>
<body>
  <article class="np-run-card">${bodyHtml}</article>
</body>
</html>`;
      }

      function javascriptRunnerHtml(source) {
        const encoded = JSON.stringify(utf8ToBase64(source));
        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>JavaScript Runner</title>
<style>
body {
  margin: 0;
  padding: 20px;
  font-family: 'Fira Code', 'Consolas', monospace;
  background: radial-gradient(circle at top, #182134 0%, #0a0f18 60%, #05070d 100%);
  color: #f4f8ff;
}
.np-js-shell {
  max-width: 1000px;
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px);
  padding: 16px;
}
#np-js-output {
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 28px;
}
</style>
</head>
<body>
  <article class="np-js-shell">
    <pre id="np-js-output">Running...</pre>
  </article>
<script>
(function () {
  const encoded = ${encoded};
  const output = document.getElementById('np-js-output');

  function decodeBase64Utf8(input) {
    const binary = atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function stringifyValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch (_error) {
      return String(value);
    }
  }

  function writeLine(prefix, args) {
    const line = args.map(stringifyValue).join(' ');
    output.textContent += '\n' + prefix + line;
  }

  const runtimeConsole = {
    log: (...args) => writeLine('', args),
    info: (...args) => writeLine('[info] ', args),
    warn: (...args) => writeLine('[warn] ', args),
    error: (...args) => writeLine('[error] ', args)
  };

  output.textContent = '';

  try {
    const source = decodeBase64Utf8(encoded);
    const executor = new Function('console', source);
    executor(runtimeConsole);
    writeLine('[done] ', ['Execution finished.']);
  } catch (error) {
    const detail = error && error.stack ? error.stack : String(error);
    writeLine('[error] ', [detail]);
  }
})();
</script>
</body>
</html>`;
      }

      function runEditor() {
        const source = String(textarea.value || "");
        if (!source.trim()) {
          setStatus("Nothing to run.", true);
          return;
        }

        const language = detectLanguage(source);
        let opened = false;

        if (language === "html") {
          opened = openRunnerWindow(source);
        } else if (language === "javascript") {
          opened = openRunnerWindow(javascriptRunnerHtml(source));
        } else if (language === "markdown") {
          opened = openRunnerWindow(shellHtml("Markdown Preview", `<article class="np-run-markdown">${renderMarkdown(source)}</article>`));
        } else {
          opened = openRunnerWindow(shellHtml("Text Preview", `<pre>${escapeHtml(source)}</pre>`));
        }

        if (opened) {
          setStatus(`Ran as ${language}.`, false);
        }
      }

      function downloadContent() {
        const source = String(textarea.value || "");
        const language = detectLanguage(source);
        const extensionMap = {
          javascript: "js",
          html: "html",
          markdown: "md",
          text: "txt"
        };
        const extension = extensionMap[language] || "txt";
        const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `notepad.${extension}`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
        setStatus(`Saved as .${extension}.`, false);
      }

      function copyContent() {
        const text = String(textarea.value || "");
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          setStatus("Copied.", false);
          return;
        }
        navigator.clipboard.writeText(text).then(() => {
          setStatus("Copied.", false);
        }).catch(() => {
          setStatus("Could not copy.", true);
        });
      }

      function pasteContent() {
        if (!navigator.clipboard || typeof navigator.clipboard.readText !== "function") {
          setStatus("Clipboard paste is unavailable.", true);
          return;
        }
        navigator.clipboard.readText().then((clipText) => {
          const start = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : textarea.value.length;
          const end = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : textarea.value.length;
          textarea.setRangeText(String(clipText || ""), start, end, "end");
          textarea.focus();
          persist();
          setStatus("Pasted.", false);
        }).catch(() => {
          setStatus("Could not read clipboard.", true);
        });
      }

      textarea.addEventListener("input", () => {
        clearConfirmUntilMs = 0;
        persist();
      });

      textarea.addEventListener("keydown", (event) => {
        if (!event.ctrlKey && !event.metaKey) {
          return;
        }
        const key = String(event.key || "").toLowerCase();
        if (key === "b") {
          event.preventDefault();
          insertAround("**", "**", "bold text");
        } else if (key === "i") {
          event.preventDefault();
          insertAround("*", "*", "italic text");
        } else if (key === "k") {
          event.preventDefault();
          insertAround("[", "](https://)", "link text");
        }
      });

      runButton.addEventListener("click", runEditor);
      saveButton.addEventListener("click", downloadContent);
      undoButton.addEventListener("click", () => document.execCommand("undo"));
      redoButton.addEventListener("click", () => document.execCommand("redo"));
      copyButton.addEventListener("click", copyContent);
      pasteButton.addEventListener("click", pasteContent);

      headingButton.addEventListener("click", () => prefixSelection("# "));
      boldButton.addEventListener("click", () => insertAround("**", "**", "bold text"));
      italicButton.addEventListener("click", () => insertAround("*", "*", "italic text"));
      codeButton.addEventListener("click", () => insertAround("`", "`", "code"));
      linkButton.addEventListener("click", () => insertAround("[", "](https://)", "link text"));
      quoteButton.addEventListener("click", () => prefixSelection("> "));
      listButton.addEventListener("click", () => prefixSelection("- "));

      previewButton.addEventListener("click", () => {
        previewVisible = !previewVisible;
        applyPreviewVisibility();
        persist();
      });

      fontMinusButton.addEventListener("click", () => {
        fontSize = Math.max(11, fontSize - 1);
        applyInputStyles();
        persist();
      });

      fontPlusButton.addEventListener("click", () => {
        fontSize = Math.min(30, fontSize + 1);
        applyInputStyles();
        persist();
      });

      wrapButton.addEventListener("click", () => {
        wordWrap = !wordWrap;
        applyInputStyles();
        persist();
      });

      modeSelect.addEventListener("change", () => {
        selectedMode = String(modeSelect.value || "auto");
        persist();
        setStatus(`Mode: ${selectedMode}.`, false);
      });

      clearButton.addEventListener("click", () => {
        const now = Date.now();
        if (now > clearConfirmUntilMs) {
          clearConfirmUntilMs = now + 3000;
          setStatus("Click Clear again within 3 seconds to confirm.", true);
          return;
        }
        clearConfirmUntilMs = 0;
        textarea.value = "";
        persist();
        setStatus("Editor cleared.", false);
      });

      textarea.value = localStorage.getItem("notepad_content") || "";
      modeSelect.value = selectedMode;
      applyInputStyles();
      applyPreviewVisibility();
      persist();
    }
  };
})();