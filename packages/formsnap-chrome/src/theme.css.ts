import { createTheme, createThemeContract } from "@vanilla-extract/css";

export const themeVars = createThemeContract({
  bg: null,
  bgAlt: null,
  bgInput: null,
  text: null,
  textMuted: null,
  border: null,
  borderLight: null,
});

export const lightTheme = createTheme(themeVars, {
  bg: "#fff",
  bgAlt: "#f5f7fa",
  bgInput: "#fafafa",
  text: "#333",
  textMuted: "#666",
  border: "#ddd",
  borderLight: "#e0e4ea",
});

export const darkTheme = createTheme(themeVars, {
  bg: "#1e1e1e",
  bgAlt: "#2a2a2a",
  bgInput: "#252525",
  text: "#e0e0e0",
  textMuted: "#9e9e9e",
  border: "#444",
  borderLight: "#383838",
});
