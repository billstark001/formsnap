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

const appLocale = {
  zh: {
    pageDesc:
      "浏览器书签工具，用于在任意网页上采集和填充表单数据。支持原生 HTML 表单、React、Vue、Angular 等各类框架。",
    card1Title: "🔧 FormSnap 工具箱（完整版）",
    card1Desc:
      "点击后弹出悬浮面板，内含「采集器」和「填充器」两个选项卡。\n采集器可将当前页面所有表单字段导出为 JSON；填充器可将 JSON 数据回填至表单字段，兼容 React/Vue/Angular 事件系统。\n完整 bundle 内嵌于书签，无需外部依赖。",
    card2Title: "⚡ FormSnap 工具箱（远程加载版）",
    card2Desc:
      "体积极小的书签脚本，点击后动态向页面注入远程 formsnap.js，始终加载最新版本。\n需要网络访问 GitHub Pages。",
    dragLink: "📌 拖到书签栏",
    copied: "✓ 已复制！",
    copyUrl: "📋 复制链接",
    langToggle: "English",
  },
  en: {
    pageDesc:
      "A browser bookmarklet tool for collecting and filling form data on any web page. Supports native HTML forms, React, Vue, Angular, and more.",
    card1Title: "🔧 FormSnap Toolbox (Full Bundle)",
    card1Desc:
      "Click to open a floating panel with a Collector tab and a Filler tab.\nThe Collector exports all form fields on the page as JSON; the Filler injects JSON data back into form fields, compatible with React/Vue/Angular event systems.\nThe full bundle is embedded in the bookmark — no external dependencies.",
    card2Title: "⚡ FormSnap Toolbox (Remote Loader)",
    card2Desc:
      "A tiny bookmark script that dynamically injects the remote formsnap.js, always loading the latest version.\nRequires network access to GitHub Pages.",
    dragLink: "📌 Drag to Bookmarks Bar",
    copied: "✓ Copied!",
    copyUrl: "📋 Copy URL",
    langToggle: "中文",
  },
} as const;

export type AppLocale = typeof appLocale.zh;

export function useAppI18n() {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const setLang = (l: Lang) => {
    saveLang(l);
    setLangState(l);
  };
  const toggleLang = () => setLang(lang === "zh" ? "en" : "zh");
  return { lang, setLang, toggleLang, t: appLocale[lang] };
}
