import { getSelector } from "./selector.js";
import type { CollectOptions, FieldInfo } from "./types.js";

const BUTTON_TYPES = new Set(["button", "submit", "reset", "image"]);

/** Returns false if the element or any ancestor is hidden. */
export function isVisible(el: HTMLElement): boolean {
  if ((el as HTMLInputElement).type === "hidden") return false;
  let node: HTMLElement | null = el;
  while (node && node.nodeType === 1) {
    const s = getComputedStyle(node);
    if (s.display === "none" || s.visibility === "hidden") return false;
    node = node.parentElement;
  }
  return true;
}

/** Returns true if the element can be edited by the user. */
export function isEditable(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): boolean {
  return !el.disabled && !(el as HTMLInputElement).readOnly;
}

/** Returns true if the element is a non-data input button. */
export function isButtonType(el: HTMLInputElement): boolean {
  return (
    el.tagName === "INPUT" &&
    BUTTON_TYPES.has((el.type || "").toLowerCase())
  );
}

/** Returns true when the field carries no meaningful value. */
export function isEmpty(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): boolean {
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase() ?? "";
  if (tag === "select") {
    return (el as HTMLSelectElement).multiple
      ? (el as HTMLSelectElement).selectedOptions.length === 0
      : el.value === "";
  }
  if (type === "checkbox" || type === "radio")
    return !(el as HTMLInputElement).checked;
  return el.value === "";
}

/** Extracts a serialisable info object from a form element. */
export function extractInfo(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): FieldInfo {
  const tag = el.tagName.toLowerCase();
  const type = ((el as HTMLInputElement).type ?? "").toLowerCase();
  const info: FieldInfo = {
    selector: getSelector(el),
    tag,
    visible: isVisible(el as HTMLElement),
  };

  if (type) info.type = type;
  if (el.name) info.name = el.name;
  if (el.id) info.id = el.id;
  if (el.disabled) info.disabled = true;
  if ((el as HTMLInputElement).readOnly) info.readOnly = true;
  if ((el as HTMLInputElement).required) info.required = true;

  if (tag === "select") {
    const sel = el as HTMLSelectElement;
    info.multiple = sel.multiple;
    if (sel.multiple) {
      info.selectedValues = Array.from(sel.selectedOptions).map((o) => ({
        value: o.value,
        text: o.text.trim(),
      }));
    } else {
      info.value = sel.value;
      const opt = sel.options[sel.selectedIndex];
      info.selectedText = opt ? opt.text.trim() : "";
    }
    info.options = Array.from(sel.options).map((o) => ({
      value: o.value,
      text: o.text.trim(),
      selected: o.selected,
    }));
  } else if (type === "checkbox" || type === "radio") {
    const inp = el as HTMLInputElement;
    info.value = inp.value;
    info.checked = inp.checked;
    if (type === "radio" && inp.name) {
      const checked = document.querySelector<HTMLInputElement>(
        `input[type="radio"][name="${CSS.escape(inp.name)}"]:checked`
      );
      info.groupSelectedValue = checked ? checked.value : null;
    }
  } else {
    info.value = el.value;
  }

  return info;
}

/** Collects form fields from the document according to options. */
export function collectFields(
  options: CollectOptions = {},
  root: Document | Element = document
): FieldInfo[] {
  const {
    includeHidden = false,
    includeDisabled = false,
    includeButtons = false,
    includeEmpty = false,
  } = options;

  const results: FieldInfo[] = [];
  const els = (root as Document).querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("input,select,textarea");

  for (const el of Array.from(els)) {
    if (!includeButtons && el.tagName === "INPUT" && isButtonType(el as HTMLInputElement))
      continue;
    if (!includeHidden && !isVisible(el as HTMLElement)) continue;
    if (!includeDisabled && !isEditable(el as HTMLInputElement)) continue;
    if (!includeEmpty && isEmpty(el as HTMLInputElement)) continue;
    results.push(extractInfo(el as HTMLInputElement));
  }

  return results;
}
