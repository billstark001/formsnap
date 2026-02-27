import { useState } from "preact/hooks";
import * as styles from "./styles.css";

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

  const checkRow = (label: string, subLabel: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label className={styles.checkLabel}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} className={styles.checkInput} />
      <span><b>{label}</b>{subLabel && <><br /><span className={styles.checkSubLabel}>{subLabel}</span></>}</span>
    </label>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>FormSnap</span>
        <div className={styles.tabGroup}>
          <button className={styles.tabBtn[tab === "collect" ? "active" : "default"]} onClick={() => setTab("collect")}>Collect</button>
          <button className={styles.tabBtn[tab === "fill" ? "active" : "default"]} onClick={() => setTab("fill")}>Fill</button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {tab === "collect" && (
        <div>
          <div className={styles.optionsBox}>
            {checkRow("Include hidden", "type=hidden, display:none", incHidden, setIncHidden)}
            {checkRow("Include disabled/readonly", "", incDisabled, setIncDisabled)}
            {checkRow("Include button inputs", "submit / reset / button", incButtons, setIncButtons)}
            {checkRow("Include empty fields", "", incEmpty, setIncEmpty)}
          </div>
          <button
            onClick={handleCollect}
            disabled={collecting}
            className={styles.collectBtn}
          >
            {collecting ? "Collecting…" : "▶ Collect"}
          </button>
          {collectedJson && (
            <>
              <textarea
                readOnly
                value={collectedJson}
                className={styles.collectedTextarea}
              />
              <button
                onClick={() => navigator.clipboard.writeText(collectedJson)}
                className={styles.copyBtn}
              >
                📋 Copy
              </button>
            </>
          )}
        </div>
      )}

      {tab === "fill" && (
        <div>
          <div className={styles.optionsBox}>
            {checkRow("Fire input events", "React/Vue/Angular compatible", doFire, setDoFire)}
            {checkRow("Fallback matching", "Try name → id when selector fails", doFallback, setDoFallback)}
            {checkRow("Fill readonly fields", "", fillReadonly, setFillReadonly)}
            {checkRow("Fill disabled fields", "", fillDisabled, setFillDisabled)}
          </div>
          <textarea
            value={fillJson}
            onInput={(e) => setFillJson((e.target as HTMLTextAreaElement).value)}
            placeholder="Paste JSON from Form Collector…"
            className={styles.fillTextarea}
          />
          <button
            onClick={handleFill}
            disabled={filling}
            className={styles.fillBtn}
          >
            {filling ? "Filling…" : "▶ Fill"}
          </button>
          {results.length > 0 && (
            <div className={styles.resultBox}>
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

