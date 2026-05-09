import { analyzeFields } from "../dom/collect.js";
import { stableHash } from "../shared/hash.js";
import { getSelector } from "../dom/selector.js";
import { normalizeText } from "../shared/text.js";
import type { AnalyzeOptions, FieldInfo, FormSignature, FormSnapshot } from "../types.js";

function locationParts(url?: string): { url?: string; host?: string; pathname?: string } {
  const href = url ?? globalThis.location?.href;
  if (!href) return {};
  try {
    const parsed = new URL(href);
    return { url: parsed.href, host: parsed.host, pathname: parsed.pathname };
  } catch {
    return { url: href };
  }
}

function findForm(root: Document | Element, fields: FieldInfo[]): HTMLFormElement | null {
  const first = fields[0];
  if (!first) return null;
  try {
    const el = root.querySelector(first.selector);
    return el?.closest("form") ?? null;
  } catch {
    return null;
  }
}

export function createFormSignature(
  fields: FieldInfo[],
  options: AnalyzeOptions = {},
  root: Document | Element = document,
): FormSignature {
  const form = findForm(root, fields);
  const fieldTypeSequence = fields.map((field) => `${field.tag}:${field.type ?? ""}`);
  const fieldSemanticSequence = fields.map((field) => field.semantic?.slot ?? "unknown");
  const labels = fields.map((field) => normalizeText(field.label?.text ?? "")).filter(Boolean);
  const submitTexts = form
    ? Array.from(form.querySelectorAll("button,input[type=submit]"))
        .map((el) => normalizeText((el as HTMLInputElement).value || el.textContent || ""))
        .filter(Boolean)
    : [];
  const structureHash = stableHash([
    fieldTypeSequence,
    fieldSemanticSequence,
    fields.map((f) => f.repeat?.groupKey),
  ]);
  const textHash = stableHash([labels, submitTexts]);
  const loc = locationParts(options.url);
  return {
    ...loc,
    key: `form_${stableHash([loc.host, loc.pathname, form?.getAttribute("action"), fieldTypeSequence, labels])}`,
    formSelector: form ? getSelector(form) : undefined,
    action: form?.getAttribute("action") ?? undefined,
    method: form?.getAttribute("method") ?? undefined,
    titleText: normalizeText(root.ownerDocument?.title ?? document.title ?? ""),
    submitTexts,
    fieldCount: fields.length,
    fieldTypeSequence,
    fieldSemanticSequence,
    structureHash,
    textHash,
    evidence: ["field type sequence", "semantic sequence", "normalized labels", "submit texts"],
  };
}

export function collectSnapshot(
  options: AnalyzeOptions = {},
  root: Document | Element = document,
): FormSnapshot {
  const fields = analyzeFields(options, root);
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    form: createFormSignature(fields, options, root),
    fields,
    rulesVersion: options.rules?.version,
  };
}
