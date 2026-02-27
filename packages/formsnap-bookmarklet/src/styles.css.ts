import { style } from "@vanilla-extract/css";

export const page = style({
  maxWidth: 700,
  margin: "0 auto",
  padding: "40px 20px",
  fontFamily: "system-ui, sans-serif",
});

export const pageHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
});

export const pageTitle = style({
  margin: 0,
});

export const langBtn = style({
  padding: "4px 12px",
  border: "1px solid #ccc",
  borderRadius: 5,
  background: "#f5f5f5",
  cursor: "pointer",
  fontSize: 13,
  color: "#555",
  selectors: {
    "&:hover": { background: "#e9e9e9", borderColor: "#aaa" },
  },
});

export const pageDesc = style({
  color: "#666",
  marginBottom: 32,
});

export const card = style({
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  background: "#fff",
});

export const cardTitle = style({
  marginTop: 0,
});

export const cardDesc = style({
  color: "#555",
  whiteSpace: "pre-wrap",
});

export const actionsRow = style({
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
});

export const dragLink = style({
  padding: "8px 16px",
  background: "#198754",
  color: "#fff",
  borderRadius: 5,
  textDecoration: "none",
  fontWeight: 600,
});

export const copyBtn = style({
  padding: "8px 16px",
  background: "#0d6efd",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 600,
});

export const footer = style({
  marginTop: 40,
  color: "#aaa",
  fontSize: 13,
});

export const footerLink = style({
  color: "#aaa",
});
