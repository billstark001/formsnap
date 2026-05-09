import type { PortableFormSnapshot } from "formsnap";

export interface SavedForm {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  note: string;
  snapshot: PortableFormSnapshot;
  /**
   * !!! LEGACY COMPATIBILITY ONLY !!!
   * Old saved records stored raw FieldInfo[] here before versioned snapshots existed.
   * Keep reading this property for migration/restore, but do not use it for new saves.
   */
  fields?: unknown[];
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
