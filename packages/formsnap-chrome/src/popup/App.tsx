import { useState, useEffect } from "preact/hooks";
import * as styles from "./styles.css";
import { useI18n } from "./i18n";
import type { Lang } from "./i18n";
import { saveForm, loadSavedForms, deleteForm } from "../form-store";
import type { SavedForm } from "../form-store";
import { parseSnapshotText, stringifySnapshot, toPortableSnapshot } from "formsnap";
import type {
  FormSnapshot,
  IdentityMatchPresetName,
  PortableFormSnapshot,
  SnapshotTextFormat,
  SnapshotTextInputFormat,
} from "formsnap";

type Tab = "collect" | "fill" | "saved";
type ResultItem = {
  status: "ok" | "skip" | "fail";
  selector: string;
  reason?: string;
  matchConfidence?: number;
  matchStrategy?: string;
};

async function sendMessage(type: string, payload?: unknown): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error("No active tab");
  return chrome.tabs.sendMessage(tab.id, { type, payload });
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

function StatusBadge({ status }: { status: "ok" | "skip" | "fail" }) {
  const map = { ok: ["✅", "#198754"], skip: ["⏭", "#856404"], fail: ["❌", "#dc3545"] } as const;
  const [icon, color] = map[status];
  return <span style={{ color }}>{icon}</span>;
}

export default function App({ initialLang }: { initialLang: Lang }) {
  const { t } = useI18n(initialLang);
  const [tab, setTab] = useState<Tab>("collect");
  const [collecting, setCollecting] = useState(false);
  const [filling, setFilling] = useState(false);
  const [collectedSnapshot, setCollectedSnapshot] = useState<PortableFormSnapshot | null>(null);
  const [fillJson, setFillJson] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");

  // Collect options
  const [incHidden, setIncHidden] = useState(false);
  const [incDisabled, setIncDisabled] = useState(false);
  const [incButtons, setIncButtons] = useState(false);
  const [incOptions, setIncOptions] = useState(false);
  const [incEmpty, setIncEmpty] = useState(false);
  const [incNaiveId, setIncNaiveId] = useState(true);
  const [incDescription, setIncDescription] = useState(true);
  const [incSource, setIncSource] = useState(false);
  const [exportFormat, setExportFormat] = useState<SnapshotTextFormat>("json");

  // Fill options
  const [doFire, setDoFire] = useState(true);
  const [doFallback, setDoFallback] = useState(true);
  const [fillReadonly, setFillReadonly] = useState(false);
  const [fillDisabled, setFillDisabled] = useState(false);
  const [identityMatchPreset, setIdentityMatchPreset] =
    useState<IdentityMatchPresetName>("balanced");
  const [identitySourceThreshold, setIdentitySourceThreshold] = useState("default");
  const [minMatchConfidence, setMinMatchConfidence] = useState("default");
  const [importFormat, setImportFormat] = useState<SnapshotTextInputFormat>("auto");

  useEffect(() => {
    getActiveTab().then((activeTab) => {
      if (activeTab?.url) setCurrentUrl(activeTab.url);
    });
    loadSavedForms().then((forms) => setSavedForms(forms));
  }, []);

  const handleCollect = async () => {
    setCollecting(true);
    setError("");
    try {
      const res = await sendMessage("collect", {
        includeHidden: incHidden,
        includeDisabled: incDisabled,
        includeButtons: incButtons,
        includeOptions: incOptions,
        includeEmpty: incEmpty,
      });
      setCollectedSnapshot(
        toPortableSnapshot(res as FormSnapshot, {
          naiveId: incNaiveId,
          description: incDescription,
          source: incSource,
        }),
      );
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
      let snapshot;
      try {
        snapshot = parseSnapshotText(fillJson, importFormat);
      } catch (error) {
        throw new Error((error as Error).message);
      }
      const res = (await sendMessage("fill", {
        snapshot,
        options: {
          fireEvents: doFire,
          fallbackMatch: doFallback,
          fillReadonly,
          fillDisabled,
          identityMatchPreset,
          ...(identitySourceThreshold === "default"
            ? {}
            : { identityMatch: { minimumSourceMatches: Number(identitySourceThreshold) } }),
          ...(minMatchConfidence === "default"
            ? {}
            : { minMatchConfidence: Number(minMatchConfidence) }),
        },
      })) as ResultItem[] | { error: string };
      if (!Array.isArray(res)) throw new Error(res.error);
      setResults(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFilling(false);
    }
  };

  const handleSave = async () => {
    if (!collectedSnapshot) return;
    const activeTab = await getActiveTab();
    const form: SavedForm = {
      id: crypto.randomUUID(),
      url: activeTab?.url ?? "",
      title: activeTab?.title ?? "",
      timestamp: Date.now(),
      note: note.trim(),
      snapshot: collectedSnapshot,
    };
    await saveForm(form);
    setSavedForms(await loadSavedForms());
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleRestore = (form: SavedForm) => {
    setFillJson(JSON.stringify(form.snapshot ?? form.fields, null, 2));
    setTab("fill");
  };

  const handleDelete = async (id: string) => {
    await deleteForm(id);
    setSavedForms(await loadSavedForms());
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const checkRow = (
    label: string,
    subLabel: string,
    checked: boolean,
    onChange: (v: boolean) => void,
  ) => (
    <label className={styles.checkLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        className={styles.checkInput}
      />
      <span>
        <b>{label}</b>
        {subLabel && (
          <>
            <br />
            <span className={styles.checkSubLabel}>{subLabel}</span>
          </>
        )}
      </span>
    </label>
  );

  const formsForPage = savedForms.filter((f) => {
    if (!currentUrl || !f.url) return false;
    try {
      const current = new URL(currentUrl);
      const saved = new URL(f.url);
      return saved.origin + saved.pathname === current.origin + current.pathname;
    } catch {
      return false;
    }
  });

  const collectedText = collectedSnapshot ? stringifySnapshot(collectedSnapshot, exportFormat) : "";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>{t.title}</span>
        <div className={styles.tabGroup}>
          <button
            className={styles.tabBtn[tab === "collect" ? "active" : "default"]}
            onClick={() => setTab("collect")}
          >
            {t.tabCollect}
          </button>
          <button
            className={styles.tabBtn[tab === "fill" ? "active" : "default"]}
            onClick={() => setTab("fill")}
          >
            {t.tabFill}
          </button>
          <button
            className={styles.tabBtn[tab === "saved" ? "active" : "default"]}
            onClick={() => setTab("saved")}
          >
            {t.tabSaved}
          </button>
          <button className={styles.iconBtn} onClick={openSettings} title={t.settings}>
            ⚙️
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {tab === "collect" && (
        <div>
          <div className={styles.optionsBox}>
            {checkRow(t.inclHidden, t.inclHiddenHint, incHidden, setIncHidden)}
            {checkRow(t.inclDisabled, "", incDisabled, setIncDisabled)}
            {checkRow(t.inclButtons, t.inclButtonsHint, incButtons, setIncButtons)}
            {checkRow(t.inclOptions, t.inclOptionsHint, incOptions, setIncOptions)}
            {checkRow(t.inclEmpty, "", incEmpty, setIncEmpty)}
            {checkRow(t.inclNaiveId, "", incNaiveId, setIncNaiveId)}
            {checkRow(t.inclDescription, "", incDescription, setIncDescription)}
            {checkRow(t.inclSource, t.inclSourceHint, incSource, setIncSource)}
            <label className={styles.selectLabel}>
              <b>{t.exportFormat}</b>
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat((e.target as HTMLSelectElement).value as SnapshotTextFormat)
                }
                className={styles.selectInput}
              >
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </label>
          </div>
          <button onClick={handleCollect} disabled={collecting} className={styles.collectBtn}>
            {collecting ? t.collecting : t.collect}
          </button>
          {collectedSnapshot && (
            <>
              <textarea readOnly value={collectedText} className={styles.collectedTextarea} />
              <input
                type="text"
                className={styles.noteInput}
                placeholder={t.notePlaceholder}
                value={note}
                onInput={(e) => setNote((e.target as HTMLInputElement).value)}
              />
              <div className={styles.rowBtns}>
                <button
                  onClick={() => navigator.clipboard.writeText(collectedText)}
                  className={styles.copyBtn}
                >
                  {t.copy}
                </button>
                <button onClick={handleSave} className={styles.saveBtn}>
                  {savedMsg ? t.saved : t.saveForm}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "fill" && (
        <div>
          <div className={styles.optionsBox}>
            {checkRow(t.fireEvents, t.fireEventsHint, doFire, setDoFire)}
            {checkRow(t.fallbackMatch, t.fallbackMatchHint, doFallback, setDoFallback)}
            <label className={styles.selectLabel}>
              <b>{t.identityPreset}</b>
              <select
                value={identityMatchPreset}
                onChange={(e) =>
                  setIdentityMatchPreset(
                    (e.target as HTMLSelectElement).value as IdentityMatchPresetName,
                  )
                }
                className={styles.selectInput}
              >
                <option value="strict">{t.identityStrict}</option>
                <option value="balanced">{t.identityBalanced}</option>
                <option value="loose">{t.identityLoose}</option>
              </select>
            </label>
            <label className={styles.selectLabel}>
              <b>{t.minConfidence}</b>
              <select
                value={minMatchConfidence}
                onChange={(e) => setMinMatchConfidence((e.target as HTMLSelectElement).value)}
                className={styles.selectInput}
              >
                <option value="default">{t.confidenceDefault}</option>
                <option value="0.35">{t.confidenceWeak}</option>
                <option value="0.55">{t.confidenceStandard}</option>
                <option value="0.7">{t.confidenceHigh}</option>
              </select>
            </label>
            <label className={styles.selectLabel}>
              <b>{t.sourceThreshold}</b>
              <select
                value={identitySourceThreshold}
                onChange={(e) => setIdentitySourceThreshold((e.target as HTMLSelectElement).value)}
                className={styles.selectInput}
              >
                <option value="default">{t.sourceThresholdDefault}</option>
                <option value="2">{t.sourceThresholdTwo}</option>
                <option value="3">{t.sourceThresholdThree}</option>
                <option value="5">{t.sourceThresholdFive}</option>
              </select>
            </label>
            {checkRow(t.fillReadonly, "", fillReadonly, setFillReadonly)}
            {checkRow(t.fillDisabled, "", fillDisabled, setFillDisabled)}
            <label className={styles.selectLabel}>
              <b>{t.importFormat}</b>
              <select
                value={importFormat}
                onChange={(e) =>
                  setImportFormat((e.target as HTMLSelectElement).value as SnapshotTextInputFormat)
                }
                className={styles.selectInput}
              >
                <option value="auto">{t.formatAuto}</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </label>
          </div>
          <textarea
            value={fillJson}
            onInput={(e) => setFillJson((e.target as HTMLTextAreaElement).value)}
            placeholder={t.fillPlaceholder}
            className={styles.fillTextarea}
          />
          <button onClick={handleFill} disabled={filling} className={styles.fillBtn}>
            {filling ? t.filling : t.fill}
          </button>
          {results.length > 0 && (
            <div className={styles.resultBox}>
              {results.map((r, i) => (
                <div key={i}>
                  <StatusBadge status={r.status} /> {r.selector}
                  {r.matchConfidence !== undefined
                    ? ` · ${Math.round(r.matchConfidence * 100)}% ${r.matchStrategy ?? ""}`
                    : ""}
                  {r.reason ? ` (${r.reason})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{t.savedFormsTitle}</div>
          {formsForPage.length === 0 ? (
            <div className={styles.emptyMsg}>{t.noSavedForms}</div>
          ) : (
            <div className={styles.savedList}>
              {formsForPage.map((form) => (
                <div key={form.id} className={styles.savedCard}>
                  <div className={styles.savedMeta}>
                    {new Date(form.timestamp).toLocaleString()} ·{" "}
                    {t.fieldsCount((form.snapshot?.fields ?? form.fields ?? []).length)}
                    {form.title && ` · ${form.title}`}
                  </div>
                  {form.note && <div className={styles.savedNote}>"{form.note}"</div>}
                  <div className={styles.savedCardBtns}>
                    <button className={styles.restoreBtn} onClick={() => handleRestore(form)}>
                      {t.restore}
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(form.id)}>
                      {t.deleteSaved}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
