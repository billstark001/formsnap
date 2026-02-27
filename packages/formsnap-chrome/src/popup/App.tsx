import { useState } from "preact/hooks";

type Tab = "collect" | "fill";
type ResultItem = { status: "ok" | "skip" | "fail"; selector: string; reason?: string };

async function sendMessage(type: string, payload?: unknown): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error("No active tab");
  return chrome.tabs.sendMessage(tab.id, { type, payload });
}

function StatusBadge({ status }: { status: "ok" | "skip" | "fail" }) {
  const map = { ok: ["✅", "#198754"], skip: ["⏭", "#856404"], fail: ["❌", "#dc3545"] } as const;
  const [icon, color] = map[status];
  return <span style={{ color }}>{icon}</span>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("collect");
  const [collecting, setCollecting] = useState(false);
  const [filling, setFilling] = useState(false);
  const [collectedJson, setCollectedJson] = useState("");
  const [fillJson, setFillJson] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState("");

  // Collect options
  const [incHidden, setIncHidden] = useState(false);
  const [incDisabled, setIncDisabled] = useState(false);
  const [incButtons, setIncButtons] = useState(false);
  const [incEmpty, setIncEmpty] = useState(false);

  // Fill options
  const [doFire, setDoFire] = useState(true);
  const [doFallback, setDoFallback] = useState(true);
  const [fillReadonly, setFillReadonly] = useState(false);
  const [fillDisabled, setFillDisabled] = useState(false);

  const handleCollect = async () => {
    setCollecting(true);
    setError("");
    try {
      const res = await sendMessage("collect", {
        includeHidden: incHidden,
        includeDisabled: incDisabled,
        includeButtons: incButtons,
        includeEmpty: incEmpty,
      });
      setCollectedJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCollecting(false);
    }
  };

  const handleFill = async () => {
    setFilling(true);
    setError("");
    setResults([]);
    try {
      let fields;
      try { fields = JSON.parse(fillJson); } catch { throw new Error("Invalid JSON"); }
      const res = await sendMessage("fill", {
        fields,
        options: { fireEvents: doFire, fallbackMatch: doFallback, fillReadonly, fillDisabled },
      }) as ResultItem[];
      setResults(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFilling(false);
    }
  };

  const btnStyle = (active: boolean) => ({
    padding: "6px 16px",
    background: active ? "#0d6efd" : "#f0f0f0",
    color: active ? "#fff" : "#333",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600 as const,
  });

  const checkRow = (label: string, sublabel: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label style={{ display: "flex", gap: 8, marginBottom: 8, cursor: "pointer", alignItems: "flex-start" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} style={{ marginTop: 3 }} />
      <span><b>{label}</b>{sublabel && <><br /><span style={{ color: "#888", fontSize: 12 }}>{sublabel}</span></>}</span>
    </label>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>FormSnap</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={btnStyle(tab === "collect")} onClick={() => setTab("collect")}>Collect</button>
          <button style={btnStyle(tab === "fill")} onClick={() => setTab("fill")}>Fill</button>
        </div>
      </div>

      {error && <div style={{ background: "#f8d7da", borderLeft: "4px solid #dc3545", padding: "8px 12px", borderRadius: 5, marginBottom: 10, fontSize: 13 }}>{error}</div>}

      {tab === "collect" && (
        <div>
          <div style={{ background: "#f5f7fa", border: "1px solid #e0e4ea", borderRadius: 7, padding: 12, marginBottom: 12 }}>
            {checkRow("Include hidden", "type=hidden, display:none", incHidden, setIncHidden)}
            {checkRow("Include disabled/readonly", "", incDisabled, setIncDisabled)}
            {checkRow("Include button inputs", "submit / reset / button", incButtons, setIncButtons)}
            {checkRow("Include empty fields", "", incEmpty, setIncEmpty)}
          </div>
          <button
            onClick={handleCollect}
            disabled={collecting}
            style={{ display: "block", width: "100%", padding: 9, background: "#198754", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}
          >
            {collecting ? "Collecting…" : "▶ Collect"}
          </button>
          {collectedJson && (
            <>
              <textarea
                readOnly
                value={collectedJson}
                style={{ width: "100%", height: 180, fontFamily: "monospace", fontSize: 11, border: "1px solid #ddd", padding: 8, boxSizing: "border-box", borderRadius: 5, background: "#fafafa", resize: "vertical" }}
              />
              <button
                onClick={() => navigator.clipboard.writeText(collectedJson)}
                style={{ padding: "5px 14px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginTop: 6 }}
              >
                📋 Copy
              </button>
            </>
          )}
        </div>
      )}

      {tab === "fill" && (
        <div>
          <div style={{ background: "#f5f7fa", border: "1px solid #e0e4ea", borderRadius: 7, padding: 12, marginBottom: 12 }}>
            {checkRow("Fire input events", "React/Vue/Angular compatible", doFire, setDoFire)}
            {checkRow("Fallback matching", "Try name → id when selector fails", doFallback, setDoFallback)}
            {checkRow("Fill readonly fields", "", fillReadonly, setFillReadonly)}
            {checkRow("Fill disabled fields", "", fillDisabled, setFillDisabled)}
          </div>
          <textarea
            value={fillJson}
            onInput={(e) => setFillJson((e.target as HTMLTextAreaElement).value)}
            placeholder="Paste JSON from Form Collector…"
            style={{ width: "100%", height: 150, fontFamily: "monospace", fontSize: 11, border: "1px solid #ddd", padding: 8, boxSizing: "border-box", borderRadius: 5, background: "#fafafa", resize: "vertical", marginBottom: 10 }}
          />
          <button
            onClick={handleFill}
            disabled={filling}
            style={{ display: "block", width: "100%", padding: 9, background: "#0d6efd", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}
          >
            {filling ? "Filling…" : "▶ Fill"}
          </button>
          {results.length > 0 && (
            <div style={{ maxHeight: 150, overflowY: "auto", fontFamily: "monospace", fontSize: 11, border: "1px solid #ddd", borderRadius: 5, padding: 8, background: "#fafafa" }}>
              {results.map((r, i) => (
                <div key={i}>
                  <StatusBadge status={r.status} /> {r.selector}{r.reason ? ` (${r.reason})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
