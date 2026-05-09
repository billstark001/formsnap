import cssEscape from "css.escape";
import { getSelector } from "./selector.js";
import { stableHash } from "../shared/hash.js";
import { createNaiveId, uniqueIdentitySources } from "../shared/identity.js";
import { detectFieldLabel } from "./label.js";
import { detectRepeatGroups } from "../analysis/repeat.js";
import { applyHeuristicRules, defaultHeuristicRules, mergeRuleSets } from "../rules/rules.js";
import { applyPostalAndPhoneRepresentations, detectSemantic } from "../analysis/semantic.js";
import { getFieldIdentity } from "./selector.js";
import { normalizeText, tokenizeIdentifier } from "../shared/text.js";
import type { AnalyzeOptions, CollectOptions, FieldInfo } from "../types.js";

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
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): boolean {
  return !el.disabled && !(el as HTMLInputElement).readOnly;
}

/** Returns true if the element is a non-data input button. */
export function isButtonType(el: HTMLInputElement): boolean {
  return el.tagName === "INPUT" && BUTTON_TYPES.has((el.type || "").toLowerCase());
}

/** Returns true when the field carries no meaningful value. */
export function isEmpty(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase() ?? "";
  if (tag === "select") {
    return (el as HTMLSelectElement).multiple
      ? (el as HTMLSelectElement).selectedOptions.length === 0
      : el.value === "";
  }
  if (type === "checkbox" || type === "radio") return !(el as HTMLInputElement).checked;
  return el.value === "";
}

/** Extracts a serialisable info object from a form element. */
export function extractInfo(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  includeOptions: boolean = false,
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
    if (includeOptions) {
      info.options = Array.from(sel.options).map((o) => ({
        value: o.value,
        text: o.text.trim(),
      }));
    }
  } else if (type === "checkbox" || type === "radio") {
    const inp = el as HTMLInputElement;
    info.value = inp.value;
    info.checked = inp.checked;
    if (type === "radio" && inp.name) {
      const checked = document.querySelector<HTMLInputElement>(
        `input[type="radio"][name="${cssEscape(inp.name)}"]:checked`,
      );
      info.groupSelectedValue = checked ? checked.value : null;
    }
  } else {
    info.value = el.value;
  }

  return info;
}

function getLocationParts(url?: string): { url?: string; host?: string; pathname?: string } {
  const href = url ?? globalThis.location?.href;
  if (!href) return {};
  try {
    const parsed = new URL(href);
    return { url: parsed.href, host: parsed.host, pathname: parsed.pathname };
  } catch {
    return { url: href };
  }
}

function enrichIdentity(info: FieldInfo): void {
  if (!info.identity) return;
  const label = normalizeText(info.label?.text ?? "");
  const stableNameTokens = tokenizeIdentifier(info.name);
  const stableIdTokens = tokenizeIdentifier(info.id);
  const optionTextHash = info.options?.length
    ? stableHash(info.options.map((option) => option.text))
    : undefined;
  const repeatColumn = info.repeat
    ? `${info.repeat.groupKey}:${info.repeat.colIndex ?? info.repeat.fieldIndex}`
    : undefined;
  const stableKey = stableHash([
    "v2",
    info.identity.formKey,
    info.tag,
    info.type,
    info.semantic?.slot,
    label,
    info.repeat?.groupKey,
    info.repeat?.colIndex ?? info.repeat?.fieldIndex,
    stableNameTokens,
    stableIdTokens,
    info.identity.structuralPath,
    info.debug?.autocomplete,
    optionTextHash,
  ]);
  info.identity.stableKey = `fs_${stableKey}`;
  info.identity.weakKey = `fw_${stableHash([info.tag, info.type, info.semantic?.slot, label, stableNameTokens])}`;
  info.identity.sources = uniqueIdentitySources([
    { kind: "stable-key", value: info.identity.stableKey },
    info.identity.formKey ? { kind: "form-key", value: info.identity.formKey } : undefined,
    { kind: "tag-type", value: `${info.tag}:${info.type ?? ""}` },
    info.semantic?.slot && info.semantic.slot !== "unknown"
      ? { kind: "semantic", value: info.semantic.slot }
      : undefined,
    label ? { kind: "label", value: label } : undefined,
    repeatColumn ? { kind: "repeat-column", value: repeatColumn } : undefined,
    ...stableNameTokens.map((value) => ({ kind: "name-token" as const, value })),
    ...stableIdTokens.map((value) => ({ kind: "id-token" as const, value })),
    info.identity.structuralPath
      ? { kind: "structural-path", value: info.identity.structuralPath }
      : undefined,
    typeof info.debug?.autocomplete === "string"
      ? { kind: "autocomplete", value: info.debug.autocomplete }
      : undefined,
    optionTextHash ? { kind: "option-text", value: optionTextHash } : undefined,
    { kind: "naive-id", value: createNaiveId(info) },
  ]);
  info.identity.evidence.push("stable key includes label/semantic/repeat/structure");
}

/** Collects form fields from the document according to options. */
export function collectFields(
  options: CollectOptions = {},
  root: Document | Element = document,
): FieldInfo[] {
  const {
    includeHidden = false,
    includeDisabled = false,
    includeButtons = false,
    includeEmpty = false,
    includeOptions = false,
  } = options;

  const results: FieldInfo[] = [];
  const els = (root as Document).querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("input,select,textarea");

  for (const el of Array.from(els)) {
    if (!includeButtons && el.tagName === "INPUT" && isButtonType(el as HTMLInputElement)) continue;
    if (!includeHidden && !isVisible(el as HTMLElement)) continue;
    if (!includeDisabled && !isEditable(el as HTMLInputElement)) continue;
    if (!includeEmpty && isEmpty(el as HTMLInputElement)) continue;
    results.push(extractInfo(el as HTMLInputElement, includeOptions));
  }

  return results;
}

/** Collects fields and enriches them with labels, semantics, repeat groups and stable identity. */
export function analyzeFields(
  options: AnalyzeOptions = {},
  root: Document | Element = document,
): FieldInfo[] {
  const {
    analyzeLabels = true,
    analyzeSemantics = true,
    analyzeRepeats = true,
    includeDebug = false,
    rules,
    includeHidden = false,
    includeDisabled = false,
    includeButtons = false,
    includeEmpty = true,
    includeOptions = false,
  } = options;
  const allEls = Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input,select,textarea",
    ),
  );
  const pairs: Array<{
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    info: FieldInfo;
  }> = [];
  for (const el of allEls) {
    if (!includeButtons && el.tagName === "INPUT" && isButtonType(el as HTMLInputElement)) continue;
    if (!includeHidden && !isVisible(el as HTMLElement)) continue;
    if (!includeDisabled && !isEditable(el as HTMLInputElement)) continue;
    if (!includeEmpty && isEmpty(el as HTMLInputElement)) continue;
    pairs.push({ el, info: extractInfo(el, includeOptions) });
  }
  const fields = pairs.map((pair) => pair.info);
  const locationParts = getLocationParts(options.url);
  const formKey = stableHash([
    locationParts.host,
    locationParts.pathname,
    fields.map((field) => `${field.tag}:${field.type ?? ""}`),
  ]);

  pairs.forEach(({ el, info }) => {
    const debug = {
      placeholder: el.getAttribute("placeholder") ?? undefined,
      autocomplete: el.getAttribute("autocomplete") ?? undefined,
      maxlength: el.getAttribute("maxlength") ?? undefined,
      minlength: el.getAttribute("minlength") ?? undefined,
      pattern: el.getAttribute("pattern") ?? undefined,
    };
    info.aliases = [
      debug.placeholder,
      debug.autocomplete,
      tokenizeIdentifier(info.name).join(" "),
      tokenizeIdentifier(info.id).join(" "),
    ].filter((value): value is string => !!value);
    info.debug = includeDebug ? debug : debug;
    if (analyzeLabels) info.label = detectFieldLabel(el);
    if (analyzeSemantics) info.semantic = detectSemantic(info);
    info.identity = getFieldIdentity(el, { ...locationParts, formKey });
  });

  if (analyzeRepeats) detectRepeatGroups(fields, root);
  if (analyzeSemantics) applyPostalAndPhoneRepresentations(fields);

  const ruleSet = rules ? mergeRuleSets(defaultHeuristicRules, rules) : defaultHeuristicRules;
  fields.forEach((info, index) => {
    const el = pairs[index]?.el;
    const next = applyHeuristicRules(info, { ...locationParts, element: el, root }, ruleSet);
    Object.assign(info, next);
    enrichIdentity(info);
    if (!includeDebug) delete info.debug;
  });

  return fields;
}
