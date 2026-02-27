import { style, globalStyle } from "@vanilla-extract/css";

export const modal = style({
  position: "fixed",
  top: "5%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 580,
  maxWidth: "95vw",
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: 10,
  boxShadow: "0 6px 30px rgba(0,0,0,.25)",
  zIndex: 2147483647,
  padding: 20,
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
  color: "#333",
  maxHeight: "90vh",
  overflowY: "auto",
  boxSizing: "border-box",
});

export const header = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
});

export const headerTitle = style({
  fontSize: 16,
  fontWeight: 700,
  margin: 0,
});

export const closeBtn = style({
  border: "none",
  background: "none",
  fontSize: 22,
  cursor: "pointer",
  color: "#aaa",
  padding: 0,
  lineHeight: 1,
});

// Tab bar
export const tabBar = style({
  display: "flex",
  marginBottom: 16,
  borderBottom: "2px solid #e0e4ea",
});

export const tab = style({
  padding: "8px 20px",
  cursor: "pointer",
  background: "none",
  border: "none",
  borderBottom: "2px solid transparent",
  marginBottom: -2,
  fontSize: 14,
  fontWeight: 600,
  color: "#666",
  transition: "color .15s, border-color .15s",
  selectors: {
    "&:hover": {
      color: "#333",
    },
  },
});

export const tabActive = style({
  color: "#0d6efd",
  borderBottomColor: "#0d6efd",
});

// Options section
export const optionsBox = style({
  background: "#f5f7fa",
  border: "1px solid #e0e4ea",
  borderRadius: 7,
  padding: 14,
  marginBottom: 14,
});

export const optionsTitle = style({
  fontWeight: 600,
  color: "#444",
  marginBottom: 10,
  fontSize: 13,
});

export const checkLabel = style({
  display: "flex",
  gap: 9,
  marginBottom: 8,
  cursor: "pointer",
  alignItems: "flex-start",
  selectors: {
    "&:last-child": {
      marginBottom: 0,
    },
  },
});

export const checkInput = style({
  marginTop: 3,
  flexShrink: 0,
});

export const checkTitle = style({
  fontWeight: "bold",
});

export const checkHint = style({
  color: "#888",
  fontSize: 12,
  display: "block",
});

// Buttons
export const primaryBtn = style({
  display: "block",
  width: "100%",
  padding: "9px 0",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 12,
});

export const btnGreen = style({
  background: "#198754",
  selectors: {
    "&:hover": { background: "#157347" },
  },
});

export const btnBlue = style({
  background: "#0d6efd",
  selectors: {
    "&:hover": { background: "#0b5ed7" },
  },
});

// Banner / status
export const banner = style({
  padding: "8px 12px",
  borderRadius: 5,
  fontSize: 13,
  marginBottom: 12,
  borderLeft: "4px solid transparent",
});

export const bannerGreen = style({
  background: "#d1e7dd",
  borderLeftColor: "#198754",
});

export const bannerYellow = style({
  background: "#fff3cd",
  borderLeftColor: "#ffc107",
});

export const bannerRed = style({
  background: "#f8d7da",
  borderLeftColor: "#dc3545",
});

// JSON textarea section
export const sectionHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 7,
});

export const sectionTitle = style({
  fontWeight: 600,
  color: "#444",
  fontSize: 13,
});

export const smallBtn = style({
  fontSize: 12,
  padding: "2px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  color: "#666",
});

export const textarea = style({
  width: "100%",
  fontFamily: "monospace",
  fontSize: 12,
  border: "1px solid #ddd",
  padding: 8,
  boxSizing: "border-box",
  borderRadius: 5,
  background: "#fafafa",
  resize: "vertical",
});

// Result section
export const resultSection = style({
  marginTop: 4,
});

export const resultDetails = style({
  maxHeight: 200,
  overflowY: "auto",
  fontSize: 12,
  fontFamily: "monospace",
  border: "1px solid #ddd",
  borderRadius: 5,
  padding: 8,
  background: "#fafafa",
  lineHeight: 1.7,
  marginBottom: 10,
});

export const actionsRow = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: 6,
  marginTop: 10,
});

export const actionBtn = style({
  padding: "6px 16px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  color: "#fff",
});

export const actionBtnBlue = style({
  background: "#0d6efd",
  selectors: {
    "&:hover": { background: "#0b5ed7" },
  },
});

export const actionBtnGray = style({
  background: "#6c757d",
  selectors: {
    "&:hover": { background: "#5c636a" },
  },
});
