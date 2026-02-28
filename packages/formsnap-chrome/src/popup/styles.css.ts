import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme.css";

export const container = style({
  padding: 16,
  background: themeVars.bg,
  color: themeVars.text,
  minHeight: "100%",
});

export const header = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
});

export const headerTitle = style({
  fontWeight: 700,
  fontSize: 16,
});

export const tabGroup = style({
  display: "flex",
  gap: 4,
  alignItems: "center",
});

const tabBtnBase = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
} as const;

export const tabBtn = styleVariants({
  default: { ...tabBtnBase, background: themeVars.bgAlt, color: themeVars.textMuted },
  active: { ...tabBtnBase, background: "#0d6efd", color: "#fff" },
});

export const iconBtn = style({
  padding: "5px 8px",
  background: "transparent",
  color: themeVars.textMuted,
  border: `1px solid ${themeVars.borderLight}`,
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
});

export const errorBox = style({
  background: "#f8d7da",
  borderLeft: "4px solid #dc3545",
  padding: "8px 12px",
  borderRadius: 5,
  marginBottom: 10,
  fontSize: 13,
  color: "#721c24",
});

export const optionsBox = style({
  background: themeVars.bgAlt,
  border: `1px solid ${themeVars.borderLight}`,
  borderRadius: 7,
  padding: 12,
  marginBottom: 12,
});

export const checkLabel = style({
  display: "flex",
  gap: 8,
  marginBottom: 8,
  cursor: "pointer",
  alignItems: "flex-start",
});

export const checkInput = style({
  marginTop: 3,
});

export const checkSubLabel = style({
  color: themeVars.textMuted,
  fontSize: 12,
});

export const collectBtn = style({
  display: "block",
  width: "100%",
  padding: 9,
  background: "#198754",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 10,
  boxSizing: "border-box",
});

export const fillBtn = style({
  display: "block",
  width: "100%",
  padding: 9,
  background: "#0d6efd",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 10,
  boxSizing: "border-box",
});

const monoTextareaBase = {
  width: "100%",
  fontFamily: "monospace",
  fontSize: 11,
  border: `1px solid ${themeVars.border}`,
  padding: 8,
  boxSizing: "border-box" as const,
  borderRadius: 5,
  background: themeVars.bgInput,
  color: themeVars.text,
  resize: "vertical" as const,
};

export const collectedTextarea = style({
  ...monoTextareaBase,
  height: 150,
  marginBottom: 8,
});

export const fillTextarea = style({
  ...monoTextareaBase,
  height: 130,
  marginBottom: 10,
});

export const noteInput = style({
  width: "100%",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  border: `1px solid ${themeVars.border}`,
  padding: "5px 8px",
  boxSizing: "border-box",
  borderRadius: 4,
  background: themeVars.bgInput,
  color: themeVars.text,
  marginBottom: 6,
});

export const rowBtns = style({
  display: "flex",
  gap: 6,
  marginBottom: 6,
});

export const copyBtn = style({
  flex: 1,
  padding: "5px 0",
  background: "#0d6efd",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
});

export const saveBtn = style({
  flex: 1,
  padding: "5px 0",
  background: "#198754",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
});

export const resultBox = style({
  maxHeight: 130,
  overflowY: "auto",
  fontFamily: "monospace",
  fontSize: 11,
  border: `1px solid ${themeVars.border}`,
  borderRadius: 5,
  padding: 8,
  background: themeVars.bgInput,
  color: themeVars.text,
});

// Saved forms tab
export const savedList = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

export const savedCard = style({
  border: `1px solid ${themeVars.borderLight}`,
  borderRadius: 6,
  padding: 10,
  background: themeVars.bgAlt,
});

export const savedMeta = style({
  fontSize: 11,
  color: themeVars.textMuted,
  marginBottom: 4,
});

export const savedNote = style({
  fontSize: 12,
  fontStyle: "italic",
  color: themeVars.text,
  marginBottom: 6,
});

export const savedCardBtns = style({
  display: "flex",
  gap: 6,
});

export const restoreBtn = style({
  padding: "3px 10px",
  background: "#0d6efd",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
});

export const deleteBtn = style({
  padding: "3px 10px",
  background: themeVars.bgInput,
  color: themeVars.textMuted,
  border: `1px solid ${themeVars.border}`,
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
});

export const emptyMsg = style({
  color: themeVars.textMuted,
  fontSize: 13,
  textAlign: "center",
  padding: "20px 0",
});
