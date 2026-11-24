import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Configure marked with GFM, tables, and breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function MarkdownRenderer({ content }) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      // Custom renderer for code blocks
      const renderer = new marked.Renderer();
      renderer.code = function ({ text, lang }) {
        const language = (lang || "").trim();
        const escaped = escapeHtml(text);
        return `
          <div class="code-block" data-code="${escapeHtml(text)}">
            <div class="code-header">
              <span class="code-lang">${language || "code"}</span>
              <button type="button" class="copy-code-btn" data-action="copy-code" aria-label="Copy code">Copy Code</button>
            </div>
            <pre><code class="language-${language}">${escaped}</code></pre>
          </div>
        `;
      };

      const raw = marked.parse(content, { renderer });
      return DOMPurify.sanitize(raw, {
        ADD_TAGS: ["button"],
        ADD_ATTR: ["data-code", "data-action", "target", "rel"],
      });
    } catch {
      return escapeHtml(content);
    }
  }, [content]);

  const handleClick = (e) => {
    const btn = e.target.closest('button[data-action="copy-code"]');
    if (!btn) return;
    const block = btn.closest(".code-block");
    const code = block?.getAttribute("data-code") || block?.querySelector("code")?.innerText || "";
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      const originalText = btn.innerText;
      btn.innerText = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove("copied");
      }, 1500);
    }
  };

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
}
