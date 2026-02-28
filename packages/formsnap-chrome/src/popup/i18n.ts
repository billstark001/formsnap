import { useState } from "preact/hooks";
import type { Lang } from "../settings-store";

export type { Lang };

const locale = {
  zh: {
    title: "FormSnap",
    // tabs
    tabCollect: "采集",
    tabFill: "填充",
    tabSaved: "已存",
    // collect options
    inclHidden: "包含隐藏字段",
    inclHiddenHint: "type=hidden, display:none",
    inclDisabled: "包含禁用/只读字段",
    inclButtons: "包含按钮类输入",
    inclButtonsHint: "submit / reset / button",
    inclOptions: "包含选项数据",
    inclOptionsHint: "select 的 option 文本与选中状态",
    inclEmpty: "包含空字段",
    // collect actions
    collecting: "采集中…",
    collect: "▶ 采集",
    copy: "📋 复制",
    notePlaceholder: "备注（可选）…",
    saveForm: "💾 保存",
    saved: "✓ 已保存",
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
    // saved tab
    savedFormsTitle: "本页已存表单",
    noSavedForms: "暂无已保存的表单",
    restore: "填充",
    deleteSaved: "删除",
    fieldsCount: (n: number) => `${n} 个字段`,
    // settings icon tooltip
    settings: "设置",
  },
  en: {
    title: "FormSnap",
    // tabs
    tabCollect: "Collect",
    tabFill: "Fill",
    tabSaved: "Saved",
    // collect options
    inclHidden: "Include hidden",
    inclHiddenHint: "type=hidden, display:none",
    inclDisabled: "Include disabled/readonly",
    inclButtons: "Include button inputs",
    inclButtonsHint: "submit / reset / button",
    inclOptions: "Include options data",
    inclOptionsHint: "Option text and selected state for select",
    inclEmpty: "Include empty fields",
    // collect actions
    collecting: "Collecting…",
    collect: "▶ Collect",
    copy: "📋 Copy",
    notePlaceholder: "Note (optional)…",
    saveForm: "💾 Save",
    saved: "✓ Saved",
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
    // saved tab
    savedFormsTitle: "Saved forms for this page",
    noSavedForms: "No saved forms yet",
    restore: "Restore",
    deleteSaved: "Delete",
    fieldsCount: (n: number) => `${n} field(s)`,
    // settings icon tooltip
    settings: "Settings",
  },
} as const;

export type Locale = typeof locale.zh;

export function useI18n(initialLang: Lang) {
  const [lang] = useState<Lang>(initialLang);
  return { lang, t: locale[lang] as unknown as Locale };
}
