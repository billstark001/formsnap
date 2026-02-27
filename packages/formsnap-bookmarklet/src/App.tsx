import { useState } from "preact/hooks";
import { collectorCode, fillerCode } from "virtual:bookmarklets";

function BookmarkletCard({
  title,
  description,
  code,
}: {
  title: string;
  description: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const href = `javascript:${encodeURIComponent(code)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // Fallback for environments without clipboard API
      const ta = document.createElement("textarea");
      ta.value = href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ color: "#555" }}>{description}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href={href}
          style={{
            padding: "8px 16px",
            background: "#198754",
            color: "#fff",
            borderRadius: 5,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          📌 Drag to Bookmarks Bar
        </a>
        <button
          onClick={handleCopy}
          style={{
            padding: "8px 16px",
            background: "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy URL"}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>FormSnap</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Browser bookmarklets for collecting and filling form data on any webpage.
        Works with vanilla HTML forms, React, Vue, Angular, and any other framework.
      </p>
      <BookmarkletCard
        title="📋 Form Collector"
        description="Scans all form fields on the current page and exports their state as JSON. Supports filtering by visibility, disabled state, button type, and empty values."
        code={collectorCode}
      />
      <BookmarkletCard
        title="✏️ Form Filler"
        description="Takes JSON collected by the Form Collector and fills form fields back. Fires native input/change events for React/Vue/Angular compatibility."
        code={fillerCode}
      />
      <footer style={{ marginTop: 40, color: "#aaa", fontSize: 13 }}>
        <a href="https://github.com/billstark001/formsnap" style={{ color: "#aaa" }}>
          GitHub
        </a>
      </footer>
    </div>
  );
}
