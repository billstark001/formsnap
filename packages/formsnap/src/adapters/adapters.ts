import type { FieldAdapter, FieldInfo } from "../types.js";

export const nativeTextAdapter: FieldAdapter = {
  id: "nativeText",
  detect: (el) =>
    /input/i.test(el.tagName) && !/checkbox|radio/i.test((el as HTMLInputElement).type),
  read: (el) => (el as HTMLInputElement).value,
  write: (el, value) => {
    (el as HTMLInputElement).value = String(value ?? "");
    return true;
  },
};

export const textareaAdapter: FieldAdapter = {
  id: "textarea",
  detect: (el) => el.tagName.toLowerCase() === "textarea",
  read: (el) => (el as HTMLTextAreaElement).value,
  write: (el, value) => {
    (el as HTMLTextAreaElement).value = String(value ?? "");
    return true;
  },
};

export const nativeSelectAdapter: FieldAdapter = {
  id: "nativeSelect",
  detect: (el) => el.tagName.toLowerCase() === "select",
};

export const checkboxRadioAdapter: FieldAdapter = {
  id: "checkboxRadio",
  detect: (el, info: FieldInfo) => info.type === "checkbox" || info.type === "radio",
};

export const fieldAdapters: FieldAdapter[] = [
  nativeSelectAdapter,
  checkboxRadioAdapter,
  textareaAdapter,
  nativeTextAdapter,
];
