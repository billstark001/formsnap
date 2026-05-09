import cssEscape from "css.escape";
import { analyzeFields } from "../dom/collect.js";
import { createRestorePlan } from "./match.js";
import type { FieldInfo, FillOptions, FillResult } from "../types.js";
import type { FormSnapshot, RestoreOptions } from "../types.js";

const BUTTON_TYPES = new Set(["button", "submit", "reset", "image", "file"]);

/** Fires input and change events (needed for React/Vue/Angular reactivity). */
export function fireEvents(el: Element): void {
  ["input", "change"].forEach((t) => el.dispatchEvent(new Event(t, { bubbles: true })));
}

/**
 * Sets input value through the native property descriptor so that
 * React's synthetic event system detects the change.
 */
export function nativeSet(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const Proto =
    el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
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
  root: Document | Element = document,
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
    const found = root.querySelector(`${tag}[name="${cssEscape(info.name)}"]`);
    if (found) return found;
  }
  if (info.id) {
    if ("getElementById" in root) return root.getElementById(info.id);
    return root.querySelector(`#${cssEscape(info.id)}`);
  }
  return null;
}

/** Fills a single element with data from a FieldInfo object. */
export function fillElement(el: Element, info: FieldInfo, doFire: boolean): boolean {
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
    if (tp === "file") return false;
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
  root: Document | Element = document,
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

export function restoreSnapshot(
  snapshot: FormSnapshot | FieldInfo[],
  options: RestoreOptions = {},
  root: Document | Element = document,
): FillResult[] {
  const { fireEvents: doFire = true, fillReadonly = false, fillDisabled = false } = options;
  const current = analyzeFields(
    { includeEmpty: true, includeDisabled: fillReadonly || fillDisabled },
    root,
  );
  const plan = createRestorePlan(snapshot, current, options);
  if (options.dryRun) {
    return [
      ...plan.matches.map((match) => ({
        selector: match.source.selector,
        targetSelector: match.target.selector,
        status: "skip" as const,
        reason: "dry-run",
        matchConfidence: match.confidence,
        matchStrategy: match.strategy,
      })),
      ...plan.unmatchedSource.map((field) => ({
        selector: field.selector,
        status: "fail" as const,
        reason: "no-match",
      })),
    ];
  }

  return [
    ...plan.matches.map((match): FillResult => {
      const el = findElement(match.target, false, root);
      if (!el) {
        return {
          selector: match.source.selector,
          targetSelector: match.target.selector,
          status: "fail",
          reason: "target-not-found",
          matchConfidence: match.confidence,
          matchStrategy: match.strategy,
        };
      }
      if ((el as HTMLInputElement).disabled && !fillDisabled) {
        return {
          selector: match.source.selector,
          targetSelector: match.target.selector,
          status: "skip",
          reason: "disabled",
          matchConfidence: match.confidence,
          matchStrategy: match.strategy,
        };
      }
      if ((el as HTMLInputElement).readOnly && !fillReadonly) {
        return {
          selector: match.source.selector,
          targetSelector: match.target.selector,
          status: "skip",
          reason: "readonly",
          matchConfidence: match.confidence,
          matchStrategy: match.strategy,
        };
      }
      const filled = fillElement(el, match.source, doFire);
      return {
        selector: match.source.selector,
        targetSelector: match.target.selector,
        status: filled ? "ok" : "fail",
        reason: filled ? undefined : "fill-failed",
        matchConfidence: match.confidence,
        matchStrategy: match.strategy,
      };
    }),
    ...plan.unmatchedSource.map(
      (field): FillResult => ({
        selector: field.selector,
        status: "fail",
        reason: "no-match",
      }),
    ),
  ];
}
