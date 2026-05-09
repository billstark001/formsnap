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
    inclNaiveId: "包含短 ID",
    inclDescription: "包含字段描述",
    inclSource: "包含 source 调试信息",
    inclSourceHint: "selector/name/id/label/semantic，默认不导出",
    exportFormat: "导出格式",
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
    identityPreset: "身份匹配预设",
    identityStrict: "严格",
    identityBalanced: "平衡",
    identityLoose: "宽松",
    minConfidence: "最低置信度",
    confidenceDefault: "默认",
    confidenceWeak: "弱匹配 35%",
    confidenceStandard: "标准 55%",
    confidenceHigh: "高置信 70%",
    sourceThreshold: "身份源阈值",
    sourceThresholdDefault: "跟随预设",
    sourceThresholdTwo: "至少 2 个",
    sourceThresholdThree: "至少 3 个",
    sourceThresholdFive: "至少 5 个",
    fillReadonly: "填充只读字段",
    fillDisabled: "填充禁用字段",
    importFormat: "导入格式",
    formatAuto: "自动识别",
    // fill actions
    filling: "填充中…",
    fill: "▶ 填充",
    fillPlaceholder: "粘贴来自采集器的 JSON 或 YAML…",
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
    inclNaiveId: "Include short ID",
    inclDescription: "Include field description",
    inclSource: "Include source debug info",
    inclSourceHint: "selector/name/id/label/semantic, off by default",
    exportFormat: "Export format",
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
    identityPreset: "Identity match preset",
    identityStrict: "Strict",
    identityBalanced: "Balanced",
    identityLoose: "Loose",
    minConfidence: "Minimum confidence",
    confidenceDefault: "Default",
    confidenceWeak: "Weak 35%",
    confidenceStandard: "Standard 55%",
    confidenceHigh: "High 70%",
    sourceThreshold: "Identity source threshold",
    sourceThresholdDefault: "Use preset",
    sourceThresholdTwo: "At least 2",
    sourceThresholdThree: "At least 3",
    sourceThresholdFive: "At least 5",
    fillReadonly: "Fill readonly fields",
    fillDisabled: "Fill disabled fields",
    importFormat: "Import format",
    formatAuto: "Auto-detect",
    // fill actions
    filling: "Filling…",
    fill: "▶ Fill",
    fillPlaceholder: "Paste JSON or YAML from Form Collector…",
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
