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

  modules["/markdown-guide"] = {
    render: function renderMarkdownGuideRoute() {
      const syntaxLines = [
        "# big header",
        "## smaller header",
        "### even smaller header",
        "",
        "*italics*",
        "_italics_",
        "__*underline italics*__",
        "**bold**",
        "__**underline bold**__",
        "__underline__",
        "~~strikethrough~~",
        "-# subtext",
        "",
        "[Masked link](www.example.com)",
        "",
        "- List",
        "* List",
        "  - Indented List",
        "  * Indented List",
        "",
        "`One-line code block`",
        "```",
        "Multi-line code block",
        "```",
        "",
        "> Block quote",
        ">>> Multi-line block quote",
        "",
        "\\# literal heading",
        "\\*literal italics*",
        "\\`literal code`"
      ];

      const syntaxHtml = escapeHtml(syntaxLines.join("\n")).replaceAll("\n", "<br>");

      return `
        <div class="p-8 max-w-6xl mx-auto">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 class="text-3xl font-bold font-orbitron">Markdown Guide</h1>
            <a href="/settings" class="nav-link inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Back to Settings</span>
            </a>
          </div>

          <p class="text-gray-200 mb-6">Chat supports markdown plus escaping with a backslash to show formatting tokens as plain text.</p>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article class="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h2 class="text-lg font-semibold mb-3">Syntax</h2>
              <div class="text-sm text-gray-200 leading-6 max-h-[70vh] overflow-y-auto pr-1 font-mono">${syntaxHtml}</div>
            </article>

            <article class="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h2 class="text-lg font-semibold mb-3">Rendered Example</h2>
              <div class="nebula-chat-bubble-markdown text-sm text-gray-100">
                <h1>big header</h1>
                <h2>smaller header</h2>
                <h3>even smaller header</h3>
                <p><em>italics</em> and <em>italics</em></p>
                <p><u><em>underline italics</em></u></p>
                <p><strong>bold</strong></p>
                <p><u><strong>underline bold</strong></u></p>
                <p><u>underline</u></p>
                <p><del>strikethrough</del></p>
                <p class="nebula-chat-md-subtext">subtext</p>
                <p><a href="https://www.example.com" target="_blank" rel="noreferrer noopener">Masked link</a></p>
                <ul class="nebula-chat-md-list">
                  <li class="depth-0">List</li>
                  <li class="depth-0">List</li>
                  <li class="depth-1">Indented List</li>
                  <li class="depth-1">Indented List</li>
                </ul>
                <p><code class="nebula-chat-md-code">One-line code block</code></p>
                <pre class="nebula-chat-md-codeblock"><code>Multi-line code block</code></pre>
                <blockquote class="nebula-chat-md-quote">Block quote</blockquote>
                <blockquote class="nebula-chat-md-quote multi">Multi-line block quote</blockquote>
                <p># literal heading via <code class="nebula-chat-md-code">\# heading</code></p>
              </div>
            </article>
          </div>
        </div>
      `;
    }
  };
})();
