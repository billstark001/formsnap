import type { FieldInfo } from "formsnap";

export interface SavedForm {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  note: string;
  fields: FieldInfo[];
}

const STORAGE_KEY = "fs-saved-forms";

export async function loadSavedForms(): Promise<SavedForm[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as SavedForm[]) ?? [];
}

export async function saveForm(form: SavedForm): Promise<void> {
  const forms = await loadSavedForms();
  forms.unshift(form);
  await chrome.storage.local.set({ [STORAGE_KEY]: forms });
}

export async function deleteForm(id: string): Promise<void> {
  const forms = await loadSavedForms();
  await chrome.storage.local.set({
    [STORAGE_KEY]: forms.filter((f) => f.id !== id),
  });
}
