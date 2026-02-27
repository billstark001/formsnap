import type { FieldInfo, FillOptions, FillResult } from "./types.js";

const BUTTON_TYPES = new Set(["button", "submit", "reset", "image"]);

/** Fires input and change events (needed for React/Vue/Angular reactivity). */
export function fireEvents(el: Element): void {
  ["input", "change"].forEach((t) =>
    el.dispatchEvent(new Event(t, { bubbles: true }))
  );
}

/**
 * Sets input value through the native property descriptor so that
 * React's synthetic event system detects the change.
 */
export function nativeSet(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  const Proto =
    el.tagName === "TEXTAREA"
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(Proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }
}

/** Finds an element by selector with optional name/id fallback. */
export function findElement(
  info: FieldInfo,
  fallback: boolean,
  root: Document = document
): Element | null {
  let el: Element | null = null;
  try {
    el = root.querySelector(info.selector);
  } catch (_) {
    // invalid selector – proceed to fallback
  }
  if (el) return el;
  if (!fallback) return null;

  if (info.name) {
    const tag = info.tag ?? "*";
    const found = root.querySelector(`${tag}[name="${CSS.escape(info.name)}"]`);
    if (found) return found;
  }
  if (info.id) {
    return root.getElementById(info.id);
  }
  return null;
}

/** Fills a single element with data from a FieldInfo object. */
export function fillElement(
  el: Element,
  info: FieldInfo,
  doFire: boolean
): boolean {
  const tag = el.tagName.toLowerCase();
  const tp = ((el as HTMLInputElement).type ?? "").toLowerCase();

  if (tag === "select") {
    const sel = el as HTMLSelectElement;
    if (info.multiple && Array.isArray(info.selectedValues)) {
      const vs = new Set(info.selectedValues.map((o) => o.value));
      Array.from(sel.options).forEach((o) => {
        o.selected = vs.has(o.value);
      });
    } else if (info.value != null) {
      sel.value = info.value;
    }
    if (doFire) fireEvents(sel);
    return true;
  }

  if (tp === "checkbox" || tp === "radio") {
    (el as HTMLInputElement).checked = !!info.checked;
    if (doFire) fireEvents(el);
    return true;
  }

  if (info.value != null) {
    nativeSet(el as HTMLInputElement, info.value);
    if (doFire) fireEvents(el);
    return true;
  }

  return false;
}

/** Fills all fields described in the array, returning per-field results. */
export function fillFields(
  fields: FieldInfo[],
  options: FillOptions = {},
  root: Document = document
): FillResult[] {
  const {
    fireEvents: doFire = true,
    fallbackMatch = true,
    fillReadonly = false,
    fillDisabled = false,
  } = options;

  return fields.map((info): FillResult => {
    const tp = (info.type ?? "").toLowerCase();
    if (BUTTON_TYPES.has(tp)) {
      return { selector: info.selector, status: "skip", reason: "button" };
    }

    const el = findElement(info, fallbackMatch, root);
    if (!el) {
      return { selector: info.selector, status: "fail", reason: "not-found" };
    }

    if ((el as HTMLInputElement).disabled && !fillDisabled) {
      return { selector: info.selector, status: "skip", reason: "disabled" };
    }
    if ((el as HTMLInputElement).readOnly && !fillReadonly) {
      return { selector: info.selector, status: "skip", reason: "readonly" };
    }

    const filled = fillElement(el, info, doFire);
    return filled
      ? { selector: info.selector, status: "ok" }
      : { selector: info.selector, status: "fail", reason: "fill-failed" };
  });
}
