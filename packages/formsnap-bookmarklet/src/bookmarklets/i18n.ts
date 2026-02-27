import { useState } from "preact/hooks";

export type Lang = "zh" | "en";

export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem("fs-lang");
    if (stored === "zh" || stored === "en") return stored;
  } catch {}
  const nav = navigator.language ?? "";
  return nav.startsWith("zh") ? "zh" : "en";
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem("fs-lang", lang);
  } catch {}
}

const locale = {
  zh: {
    // header
    title: "🔧 FormSnap",
    langToggle: "EN",
    close: "×",
    tabCollector: "📋 采集器",
    tabFiller: "✏️ 填充器",
    // collector options
    optionsTitle: "⚙️ 选项",
    inclHidden: "包含隐藏字段",
    inclHiddenHint: "type=hidden、display:none、visibility:hidden",
    inclDisabled: "包含禁用/只读字段",
    inclButtons: "包含按钮类输入",
    inclButtonsHint: "button / submit / reset / image",
    inclOptions: "包含选项数据",
    inclOptionsHint: "select 的 option 标签文本和选中状态",
    inclEmpty: "包含空字段",
    // collector actions
    collect: "▶ 采集",
    collectDone: (n: number) =>
      `✅ 已采集 ${n} 个字段，已保存至 window.__form__`,
    copy: "📋 复制",
    copied: "✓ 已复制",
    // filler banner
    windowFormFound: (n: number) =>
      `✅ 检测到 window.__form__，已包含 ${n} 个字段`,
    windowFormMissing: "⚠️ 未找到 window.__form__，请手动粘贴 JSON",
    // filler options
    fireEvents: "触发 input 事件",
    fireEventsHint: "填充后触发 input/change（兼容 React/Vue/Angular）",
    fallbackMatch: "回退匹配",
    fallbackMatchHint: "selector 失败时尝试 name → id",
    fillReadonly: "填充只读字段",
    fillDisabled: "填充禁用字段",
    // filler actions
    jsonData: "📄 JSON 数据",
    clear: "清空",
    jsonPlaceholder: "粘贴来自 Form Collector 的 JSON…",
    fill: "▶ 填充",
    fillDone: (ok: number, skip: number, fail: number) =>
      `填充完成 — ✅ ${ok} 成功，⏭ ${skip} 跳过，❌ ${fail} 失败`,
    jsonParseError: (msg: string) => `❌ JSON 解析失败：${msg}`,
    jsonNotArray: "❌ 数据必须为 JSON 数组",
  },
  en: {
    // header
    title: "🔧 FormSnap",
    langToggle: "中文",
    close: "×",
    tabCollector: "📋 Collector",
    tabFiller: "✏️ Filler",
    // collector options
    optionsTitle: "⚙️ Options",
    inclHidden: "Include hidden fields",
    inclHiddenHint: "type=hidden, display:none, visibility:hidden",
    inclDisabled: "Include disabled / read-only fields",
    inclButtons: "Include button-type inputs",
    inclButtonsHint: "button / submit / reset / image",
    inclOptions: "Include options data",
    inclOptionsHint: "Option text and selected state for select elements",
    inclEmpty: "Include empty fields",
    // collector actions
    collect: "▶ Collect",
    collectDone: (n: number) =>
      `✅ Collected ${n} field(s), saved to window.__form__`,
    copy: "📋 Copy",
    copied: "✓ Copied",
    // filler banner
    windowFormFound: (n: number) =>
      `✅ Detected window.__form__ with ${n} field(s)`,
    windowFormMissing: "⚠️ window.__form__ not found. Paste JSON manually.",
    // filler options
    fireEvents: "Fire input events",
    fireEventsHint:
      "Trigger input/change after fill (React/Vue/Angular compatible)",
    fallbackMatch: "Fallback matching",
    fallbackMatchHint: "Try name → id when selector fails",
    fillReadonly: "Fill read-only fields",
    fillDisabled: "Fill disabled fields",
    // filler actions
    jsonData: "📄 JSON Data",
    clear: "Clear",
    jsonPlaceholder: "Paste JSON from Form Collector…",
    fill: "▶ Fill",
    fillDone: (ok: number, skip: number, fail: number) =>
      `Fill complete — ✅ ${ok} ok, ⏭ ${skip} skipped, ❌ ${fail} failed`,
    jsonParseError: (msg: string) => `❌ JSON parse error: ${msg}`,
    jsonNotArray: "❌ Data must be a JSON array",
  },
} as const;

export type Locale = typeof locale.zh;

export function useI18n() {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const setLang = (l: Lang) => {
    saveLang(l);
    setLangState(l);
  };
  const toggleLang = () => setLang(lang === "zh" ? "en" : "zh");
  return { lang, setLang, toggleLang, t: locale[lang] as unknown as Locale };
}
