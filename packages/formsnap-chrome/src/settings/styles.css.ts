import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme.css";

export const page = style({
  maxWidth: 500,
  margin: "0 auto",
  padding: "32px 20px",
  background: themeVars.bg,
  color: themeVars.text,
  minHeight: "100vh",
  boxSizing: "border-box",
});

export const heading = style({
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 24,
});

export const section = style({
  marginBottom: 24,
  border: `1px solid ${themeVars.borderLight}`,
  borderRadius: 8,
  padding: 16,
  background: themeVars.bgAlt,
});

export const sectionTitle = style({
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 12,
  color: themeVars.text,
});

export const optionRow = style({
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
  cursor: "pointer",
  selectors: {
    "&:last-child": { marginBottom: 0 },
  },
});

export const optionLabel = style({
  fontSize: 14,
  color: themeVars.text,
});

export const radioInput = style({
  appearance: "none",
  WebkitAppearance: "none",
  width: 16,
  height: 16,
  cursor: "pointer",
  border: "1.5px solid #bbb",
  borderRadius: "50%",
  background: "#fff",
  flexShrink: 0,
  transition: "border-color .15s, box-shadow .15s",
  selectors: {
    "&:checked": {
      borderColor: "#0d6efd",
      borderWidth: 5,
    },
    "&:hover:not(:checked)": {
      borderColor: "#888",
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: "0 0 0 2px rgba(13,110,253,.2)",
    },
  },
});

export const savedNote = style({
  marginTop: 16,
  fontSize: 12,
  color: themeVars.textMuted,
  fontStyle: "italic",
});
