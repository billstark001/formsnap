import { cleanLabelText, elementText, identifierLabel } from "../shared/text.js";
import type { FieldLabelInfo } from "../types.js";

export const LABEL_SCORES = {
  explicit: 100,
  ariaLabelledBy: 95,
  wrapped: 90,
  ariaLabel: 88,
  tableHeader: 80,
  fieldsetLegend: 68,
  nearby: 58,
  placeholder: 48,
  title: 35,
  nameIdToken: 30,
  repeatedGroup: 72,
} as const;

function candidate(
  text: string,
  source: FieldLabelInfo["source"],
  confidence: number,
  evidence: string[]
): FieldLabelInfo | null {
  const cleaned = cleanLabelText(text);
  if (!cleaned || cleaned.length > 100) return null;
  return { text: cleaned, source, confidence, evidence };
}

function best(candidates: Array<FieldLabelInfo | null>): FieldLabelInfo | undefined {
  return candidates
    .filter((c): c is FieldLabelInfo => !!c)
    .sort((a, b) => b.confidence - a.confidence)[0];
}

function tableHeaderLabel(el: Element): FieldLabelInfo | null {
  const cell = el.closest("td,th");
  const row = cell?.parentElement;
  const table = el.closest("table");
  if (!cell || !row || !table) return null;
  const labels: string[] = [];
  const colIndex = Array.from(row.children).indexOf(cell);
  const headerRow = table.querySelector("thead tr") ?? table.querySelector("tr");
  const colHeader = headerRow?.children[colIndex];
  if (colHeader?.tagName.toLowerCase() === "th") labels.push(elementText(colHeader));
  const rowHeader = Array.from(row.children).find(
    (child) => child.tagName.toLowerCase() === "th"
  );
  if (rowHeader) labels.push(elementText(rowHeader));
  return candidate(labels.filter(Boolean).join(" "), "table-header", LABEL_SCORES.tableHeader, [
    "table header cell",
  ]);
}

function nearbyLabel(el: Element): FieldLabelInfo | null {
  const parent = el.parentElement;
  if (!parent) return null;
  if (/^(body|html|form)$/i.test(parent.tagName)) return null;
  const previous = el.previousElementSibling;
  const prevText = elementText(previous);
  if (prevText) {
    return candidate(prevText, "nearby-text", LABEL_SCORES.nearby, [
      "previous sibling text",
    ]);
  }
  const labelish = Array.from(parent.children).find((child) => {
    if (child === el || /input|select|textarea|button/i.test(child.tagName)) return false;
    const text = elementText(child);
    return text.length > 0 && text.length <= 80;
  });
  const local = candidate(elementText(labelish ?? null), "nearby-text", LABEL_SCORES.nearby - 8, [
    "parent label-like text",
  ]);
  if (local) return local;

  let ancestor = parent.parentElement;
  let depth = 0;
  while (ancestor && depth < 4 && !/^(body|html|form)$/i.test(ancestor.tagName)) {
    const ancestorLabel = Array.from(
      ancestor.querySelectorAll(":scope > label,:scope > .label,:scope > [class*='label'],:scope > span,:scope > div")
    ).find((child) => {
      if (child.contains(el)) return false;
      const text = elementText(child);
      return text.length > 0 && text.length <= 80;
    });
    const fromAncestor = candidate(
      elementText(ancestorLabel ?? null),
      "nearby-text",
      LABEL_SCORES.nearby - 4 - depth * 4,
      ["ancestor label-like text"]
    );
    if (fromAncestor) return fromAncestor;
    ancestor = ancestor.parentElement;
    depth++;
  }
  return null;
}

export function detectFieldLabel(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): FieldLabelInfo | undefined {
  const doc = el.ownerDocument;
  const labels = Array.from((el as HTMLInputElement).labels ?? []);
  const explicit = labels.find((label) => label.htmlFor === el.id && el.id);
  const wrapped = labels.find((label) => !label.htmlFor);
  const labelledBy = el.getAttribute("aria-labelledby")
    ?.split(/\s+/)
    .map((id) => elementText(doc.getElementById(id)))
    .filter(Boolean)
    .join(" ");
  const legend = elementText(el.closest("fieldset")?.querySelector("legend") ?? null);
  const tokenLabel = [identifierLabel(el.name), identifierLabel(el.id)]
    .filter(Boolean)
    .join(" ");

  return best([
    candidate(elementText(explicit ?? null), "explicit-label", LABEL_SCORES.explicit, [
      "label[for] matched id",
    ]),
    candidate(elementText(wrapped ?? null), "wrapped-label", LABEL_SCORES.wrapped, [
      "wrapped by label",
    ]),
    candidate(labelledBy ?? "", "aria-labelledby", LABEL_SCORES.ariaLabelledBy, [
      "aria-labelledby references",
    ]),
    candidate(el.getAttribute("aria-label") ?? "", "aria-label", LABEL_SCORES.ariaLabel, [
      "aria-label",
    ]),
    tableHeaderLabel(el),
    candidate(legend, "fieldset-legend", LABEL_SCORES.fieldsetLegend, ["fieldset legend"]),
    nearbyLabel(el),
    candidate(el.getAttribute("placeholder") ?? "", "placeholder", LABEL_SCORES.placeholder, [
      "placeholder",
    ]),
    candidate(el.getAttribute("title") ?? "", "title", LABEL_SCORES.title, ["title"]),
    candidate(tokenLabel, "name-id-token", LABEL_SCORES.nameIdToken, ["name/id tokens"]),
  ]);
}
