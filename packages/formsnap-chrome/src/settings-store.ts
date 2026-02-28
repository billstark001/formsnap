export type Theme = "light" | "dark";
export type Lang = "zh" | "en";

export interface Settings {
  theme: Theme;
  lang: Lang;
}

const DEFAULTS: Settings = {
  theme: "light",
  lang: navigator.language?.startsWith("zh") ? "zh" : "en",
};

export async function loadSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.sync.get(["theme", "lang"]);
    return { ...DEFAULTS, ...stored } as Settings;
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(partial);
}
