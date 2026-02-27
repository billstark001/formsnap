import { render, Fragment } from "preact";
import { useState } from "preact/hooks";
import {
  collectFields as _collectFields,
  isVisible,
  isEditable,
  isButtonType,
  isEmpty,
  extractInfo,
  fillFields,
} from "formsnap";
import type { CollectOptions, FieldInfo, FillOptions } from "formsnap";
import { useI18n } from "./i18n";
import type { Locale } from "./i18n";
import * as s from "./main.css";

// ─── Collector Tab ─────────────────────────────────────────────────────────────

type CollectorResult =
  | { status: "idle" }
  | { status: "done"; fields: FieldInfo[] };

function CollectorTab({ modalEl, t }: { modalEl: HTMLElement; t: Locale }) {
  const [includeHidden, setIncludeHidden] = useState(false);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [includeButtons, setIncludeButtons] = useState(false);
  const [includeEmpty, setIncludeEmpty] = useState(false);
  const [includeOptions, setIncludeOptions] = useState(false);
  const [result, setResult] = useState<CollectorResult>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  const handleCollect = () => {
    const options: CollectOptions = {
      includeHidden,
      includeDisabled,
      includeButtons,
      includeEmpty,
      includeOptions,
    };
    const allEls = Array.from(
      document.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input,select,textarea")
    ).filter((el) => !modalEl.contains(el));

    const collected: FieldInfo[] = [];
    for (const el of allEls) {
      if (
        !options.includeButtons &&
        el.tagName === "INPUT" &&
        isButtonType(el as HTMLInputElement)
      )
        continue;
      if (!options.includeHidden && !isVisible(el as HTMLElement)) continue;
      if (!options.includeDisabled && !isEditable(el as HTMLInputElement))
        continue;
      if (!options.includeEmpty && isEmpty(el as HTMLInputElement)) continue;
      collected.push(extractInfo(el as HTMLInputElement, options.includeOptions));
    }

    (window as any).__form__ = collected;
    setResult({ status: "done", fields: collected });
  };

  const handleCopy = () => {
    if (result.status !== "done") return;
    const text = JSON.stringify(result.fields, null, 2);
    navigator.clipboard?.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const json =
    result.status === "done" ? JSON.stringify(result.fields, null, 2) : "";

  return (
    <Fragment>
      <div className={s.optionsBox}>
        <div className={s.optionsTitle}>{t.optionsTitle}</div>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={includeHidden}
            onChange={(e) =>
              setIncludeHidden((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.inclHidden}</span>
            <span className={s.checkHint}>{t.inclHiddenHint}</span>
          </span>
        </label>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={includeDisabled}
            onChange={(e) =>
              setIncludeDisabled((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.inclDisabled}</span>
          </span>
        </label>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={includeButtons}
            onChange={(e) =>
              setIncludeButtons((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.inclButtons}</span>
            <span className={s.checkHint}>{t.inclButtonsHint}</span>
          </span>
        </label>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={includeOptions}
            onChange={(e) =>
              setIncludeOptions((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.inclOptions}</span>
            <span className={s.checkHint}>{t.inclOptionsHint}</span>
          </span>
        </label>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={includeEmpty}
            onChange={(e) =>
              setIncludeEmpty((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.inclEmpty}</span>
          </span>
        </label>
      </div>

      <button
        className={`${s.primaryBtn} ${s.btnGreen}`}
        onClick={handleCollect}
      >
        {t.collect}
      </button>

      {result.status === "done" && (
        <div className={s.resultSection}>
          <div className={`${s.banner} ${s.bannerGreen}`}>
            {t.collectDone(result.fields.length)}
          </div>
          <textarea
            readOnly
            className={s.textarea}
            style={{ height: 260 }}
            value={json}
          />
          <div className={s.actionsRow}>
            <button
              className={`${s.actionBtn} ${s.actionBtnBlue}`}
              onClick={handleCopy}
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </div>
      )}
    </Fragment>
  );
}

// ─── Filler Tab ────────────────────────────────────────────────────────────────

type FillResult =
  | { status: "idle" }
  | { status: "done"; ok: number; skip: number; fail: number; lines: string[] }
  | { status: "error"; msg: string };

function FillerTab({ t }: { t: Locale }) {
  const initialData = Array.isArray((window as any).__form__)
    ? JSON.stringify((window as any).__form__, null, 2)
    : "";
  const hasWindowData = initialData.length > 0;

  const [jsonText, setJsonText] = useState(initialData);
  const [fireEvents, setFireEvents] = useState(true);
  const [fallbackMatch, setFallbackMatch] = useState(true);
  const [fillReadonly, setFillReadonly] = useState(false);
  const [fillDisabled, setFillDisabled] = useState(false);
  const [fillResult, setFillResult] = useState<FillResult>({ status: "idle" });

  const handleFill = () => {
    const src = jsonText.trim();
    const options: FillOptions = {
      fireEvents,
      fallbackMatch,
      fillReadonly,
      fillDisabled,
    };

    let fields: FieldInfo[];
    try {
      fields = JSON.parse(src);
    } catch (e) {
      setFillResult({
        status: "error",
        msg: t.jsonParseError((e as Error).message),
      });
      return;
    }
    if (!Array.isArray(fields)) {
      setFillResult({ status: "error", msg: t.jsonNotArray });
      return;
    }

    const results = fillFields(fields, options);
    const ok = results.filter((r) => r.status === "ok").length;
    const skip = results.filter((r) => r.status === "skip").length;
    const fail = results.filter((r) => r.status === "fail").length;
    const lines = results.map((r) => {
      const icon =
        r.status === "ok" ? "✅" : r.status === "skip" ? "⏭" : "❌";
      return `${icon} ${r.selector}${r.reason ? ` (${r.reason})` : ""}`;
    });

    setFillResult({ status: "done", ok, skip, fail, lines });
  };

  return (
    <Fragment>
      <div
        className={`${s.banner} ${hasWindowData ? s.bannerGreen : s.bannerYellow}`}
      >
        {hasWindowData
          ? t.windowFormFound((window as any).__form__.length)
          : t.windowFormMissing}
      </div>

      <div className={s.optionsBox}>
        <div className={s.optionsTitle}>{t.optionsTitle}</div>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={fireEvents}
            onChange={(e) =>
              setFireEvents((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.fireEvents}</span>
            <span className={s.checkHint}>{t.fireEventsHint}</span>
          </span>
        </label>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={fallbackMatch}
            onChange={(e) =>
              setFallbackMatch((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.fallbackMatch}</span>
            <span className={s.checkHint}>{t.fallbackMatchHint}</span>
          </span>
        </label>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={fillReadonly}
            onChange={(e) =>
              setFillReadonly((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.fillReadonly}</span>
          </span>
        </label>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            className={s.checkInput}
            checked={fillDisabled}
            onChange={(e) =>
              setFillDisabled((e.target as HTMLInputElement).checked)
            }
          />
          <span>
            <span className={s.checkTitle}>{t.fillDisabled}</span>
          </span>
        </label>
      </div>

      <div>
        <div className={s.sectionHeader}>
          <span className={s.sectionTitle}>{t.jsonData}</span>
          <button className={s.smallBtn} onClick={() => setJsonText("")}>
            {t.clear}
          </button>
        </div>
        <textarea
          className={s.textarea}
          style={{ height: 180 }}
          placeholder={t.jsonPlaceholder}
          value={jsonText}
          onInput={(e) => setJsonText((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <button
        className={`${s.primaryBtn} ${s.btnBlue}`}
        style={{ marginTop: 12 }}
        onClick={handleFill}
      >
        {t.fill}
      </button>

      {fillResult.status === "done" && (
        <div className={s.resultSection}>
          <div className={`${s.banner} ${s.bannerGreen}`}>
            {t.fillDone(fillResult.ok, fillResult.skip, fillResult.fail)}
          </div>
          <div className={s.resultDetails}>
            {fillResult.lines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      )}
      {fillResult.status === "error" && (
        <div className={`${s.banner} ${s.bannerRed}`}>{fillResult.msg}</div>
      )}
    </Fragment>
  );
}

// ─── Combined App ──────────────────────────────────────────────────────────────

type Tab = "collector" | "filler";

function App({
  onClose,
  modalEl,
}: {
  onClose: () => void;
  modalEl: HTMLElement;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("collector");
  const { t, toggleLang } = useI18n();

  return (
    <div className={s.modal}>
      <div className={s.header}>
        <span className={s.headerTitle}>{t.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className={s.smallBtn} onClick={toggleLang}>
            {t.langToggle}
          </button>
          <button className={s.closeBtn} onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>

      <div className={s.tabBar}>
        <button
          className={`${s.tab} ${activeTab === "collector" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("collector")}
        >
          {t.tabCollector}
        </button>
        <button
          className={`${s.tab} ${activeTab === "filler" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("filler")}
        >
          {t.tabFiller}
        </button>
      </div>

      {activeTab === "collector" ? (
        <CollectorTab modalEl={modalEl} t={t} />
      ) : (
        <FillerTab t={t} />
      )}
    </div>
  );
}

// ─── Bookmarklet Entry ─────────────────────────────────────────────────────────

declare const __FS_CSS__: string;
const MODAL_ID = "fs-combined-modal";
const existing = document.getElementById(MODAL_ID);
if (existing) {
  existing.remove();
  // Also remove injected styles so they re-inject fresh on next open
  document.getElementById("fs-combined-styles")?.remove();
} else {
  // Inject scoped styles once
  const styleId = "fs-combined-styles";
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = __FS_CSS__;
    document.head.appendChild(styleEl);
  }

  const host = document.createElement("div");
  host.id = MODAL_ID;
  document.body.appendChild(host);

  render(
    <App onClose={() => host.remove()} modalEl={host} />,
    host
  );
}
