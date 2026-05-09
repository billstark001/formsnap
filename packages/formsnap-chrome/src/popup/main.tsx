import { render } from "preact";
import App from "./App.js";
import { loadSettings } from "../settings-store.js";
import { lightTheme, darkTheme } from "../theme.css.js";

(async () => {
  const settings = await loadSettings();
  document.documentElement.className = settings.theme === "dark" ? darkTheme : lightTheme;
  render(<App initialLang={settings.lang} />, document.getElementById("app")!);
})();
