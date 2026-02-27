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
    title: "FormSnap",
    langToggle: "EN",
    // tabs
    tabCollect: "采集",
    tabFill: "填充",
    // collect options
    inclHidden: "包含隐藏字段",
    inclHiddenHint: "type=hidden, display:none",
    inclDisabled: "包含禁用/只读字段",
    inclButtons: "包含按钮类输入",
    inclButtonsHint: "submit / reset / button",
    inclEmpty: "包含空字段",
    // collect actions
    collecting: "采集中…",
    collect: "▶ 采集",
    copy: "📋 复制",
    // fill options
    fireEvents: "触发 input 事件",
    fireEventsHint: "兼容 React/Vue/Angular",
    fallbackMatch: "回退匹配",
    fallbackMatchHint: "selector 失败时尝试 name → id",
    fillReadonly: "填充只读字段",
    fillDisabled: "填充禁用字段",
    // fill actions
    filling: "填充中…",
    fill: "▶ 填充",
    fillPlaceholder: "粘贴来自采集器的 JSON…",
  },
  en: {
    title: "FormSnap",
    langToggle: "中文",
    // tabs
    tabCollect: "Collect",
    tabFill: "Fill",
    // collect options
    inclHidden: "Include hidden",
    inclHiddenHint: "type=hidden, display:none",
    inclDisabled: "Include disabled/readonly",
    inclButtons: "Include button inputs",
    inclButtonsHint: "submit / reset / button",
    inclEmpty: "Include empty fields",
    // collect actions
    collecting: "Collecting…",
    collect: "▶ Collect",
    copy: "📋 Copy",
    // fill options
    fireEvents: "Fire input events",
    fireEventsHint: "React/Vue/Angular compatible",
    fallbackMatch: "Fallback matching",
    fallbackMatchHint: "Try name → id when selector fails",
    fillReadonly: "Fill readonly fields",
    fillDisabled: "Fill disabled fields",
    // fill actions
    filling: "Filling…",
    fill: "▶ Fill",
    fillPlaceholder: "Paste JSON from Form Collector…",
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
