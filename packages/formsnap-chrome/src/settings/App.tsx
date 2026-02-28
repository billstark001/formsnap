import { useState, useEffect } from "preact/hooks";
import * as styles from "./styles.css";
import { loadSettings, saveSettings } from "../settings-store";
import type { Theme, Lang } from "../settings-store";
import { lightTheme, darkTheme } from "../theme.css";

const labels = {
  zh: {
    title: "FormSnap 设置",
    language: "语言",
    langZh: "中文",
    langEn: "English",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    saved: "已保存",
  },
  en: {
    title: "FormSnap Settings",
    language: "Language",
    langZh: "中文",
    langEn: "English",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    saved: "Saved",
  },
} as const;

export default function SettingsApp() {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("light");
  const [saveMsg, setSaveMsg] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setLangState(s.lang);
      setThemeState(s.theme);
    });
  }, []);

  const t = labels[lang];

  const applyTheme = (t: Theme) => {
    document.documentElement.className = t === "dark" ? darkTheme : lightTheme;
  };

  const handleLang = async (l: Lang) => {
    setLangState(l);
    await saveSettings({ lang: l });
    showSaved();
  };

  const handleTheme = async (th: Theme) => {
    setThemeState(th);
    applyTheme(th);
    await saveSettings({ theme: th });
    showSaved();
  };

  const showSaved = () => {
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 1500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        {t.title}
        {saveMsg && (
          <span style={{ marginLeft: 12, fontSize: 13, color: "#198754", fontWeight: 400 }}>
            ✓ {t.saved}
          </span>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t.language}</div>
        {(["zh", "en"] as Lang[]).map((l) => (
          <label key={l} className={styles.optionRow}>
            <input
              type="radio"
              name="lang"
              className={styles.radioInput}
              checked={lang === l}
              onChange={() => handleLang(l)}
            />
            <span className={styles.optionLabel}>
              {l === "zh" ? t.langZh : t.langEn}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t.theme}</div>
        {(["light", "dark"] as Theme[]).map((th) => (
          <label key={th} className={styles.optionRow}>
            <input
              type="radio"
              name="theme"
              className={styles.radioInput}
              checked={theme === th}
              onChange={() => handleTheme(th)}
            />
            <span className={styles.optionLabel}>
              {th === "light" ? t.themeLight : t.themeDark}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
