import { style, styleVariants } from "@vanilla-extract/css";

export const container = style({
  padding: 16,
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
});

const tabBtnBase = {
  padding: "6px 16px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: 600,
} as const;

export const tabBtn = styleVariants({
  default: { ...tabBtnBase, background: "#f0f0f0", color: "#333" },
  active: { ...tabBtnBase, background: "#0d6efd", color: "#fff" },
});

export const errorBox = style({
  background: "#f8d7da",
  borderLeft: "4px solid #dc3545",
  padding: "8px 12px",
  borderRadius: 5,
  marginBottom: 10,
  fontSize: 13,
});

export const optionsBox = style({
  background: "#f5f7fa",
  border: "1px solid #e0e4ea",
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
  color: "#888",
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
  border: "1px solid #ddd",
  padding: 8,
  boxSizing: "border-box",
  borderRadius: 5,
  background: "#fafafa",
  resize: "vertical",
} as const;

export const collectedTextarea = style({
  ...monoTextareaBase,
  height: 180,
});

export const fillTextarea = style({
  ...monoTextareaBase,
  height: 150,
  marginBottom: 10,
});

export const copyBtn = style({
  padding: "5px 14px",
  background: "#0d6efd",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  marginTop: 6,
});

export const resultBox = style({
  maxHeight: 150,
  overflowY: "auto",
  fontFamily: "monospace",
  fontSize: 11,
  border: "1px solid #ddd",
  borderRadius: 5,
  padding: 8,
  background: "#fafafa",
});

export const langBtn = style({
  padding: "3px 8px",
  background: "transparent",
  color: "#555",
  border: "1px solid #bbb",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  marginLeft: 6,
});
