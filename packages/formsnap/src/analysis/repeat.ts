import { stableHash } from "../shared/hash.js";
import { LABEL_SCORES } from "../dom/label.js";
import { normalizeText, tokenizeIdentifier } from "../shared/text.js";
import type { FieldInfo, FieldLabelInfo } from "../types.js";

function fieldElements(root: Document | Element): Element[] {
  return Array.from(root.querySelectorAll("input,select,textarea"));
}

function nearestRepeatUnit(el: Element): Element | null {
  const tableRow = el.closest("tr");
  if (tableRow) return tableRow;
  let node = el.parentElement;
  while (node && node.tagName.toLowerCase() !== "body") {
    const count = node.querySelectorAll("input,select,textarea").length;
    if (
      count >= 1 &&
      count <= 20 &&
      /^(div|li|fieldset|section|article|tr|tbody)$/i.test(node.tagName)
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return el.parentElement;
}

function fingerprint(unit: Element): string {
  const fields = Array.from(unit.querySelectorAll("input,select,textarea"));
  const fieldTypes = fields.map(
    (el) => `${el.tagName.toLowerCase()}:${((el as HTMLInputElement).type ?? "").toLowerCase()}`,
  );
  const children = Array.from(unit.children).map((child) => child.tagName.toLowerCase());
  return stableHash([unit.tagName.toLowerCase(), fieldTypes, children, fields.length]);
}

function namePatternKey(info: FieldInfo): string | null {
  const raw = info.name ?? info.id ?? "";
  if (!raw || !/\d/.test(raw)) return null;
  const normalized = raw.replace(/\[\d+\]/g, "[]").replace(/\d+/g, "#");
  const tokens = tokenizeIdentifier(normalized);
  return tokens.length ? tokens.join(".") : normalized;
}

export function detectRepeatGroups(fields: FieldInfo[], root: Document | Element = document): void {
  const els = fieldElements(root);
  const byUnit = new Map<Element, number[]>();
  els.forEach((el, index) => {
    const unit = nearestRepeatUnit(el);
    if (!unit || index >= fields.length) return;
    const indexes = byUnit.get(unit) ?? [];
    indexes.push(index);
    byUnit.set(unit, indexes);
  });

  const byParentFingerprint = new Map<string, Array<{ unit: Element; indexes: number[] }>>();
  for (const [unit, indexes] of byUnit) {
    const parent = unit.parentElement;
    if (!parent) continue;
    const key = `${parent.tagName}:${fingerprint(unit)}`;
    const group = byParentFingerprint.get(key) ?? [];
    group.push({ unit, indexes });
    byParentFingerprint.set(key, group);
  }

  for (const [key, units] of byParentFingerprint) {
    if (units.length < 2) continue;
    const groupKey = `rg_${stableHash(key)}`;
    units.forEach((unit, itemIndex) => {
      unit.indexes.forEach((fieldIndexInAll, fieldIndex) => {
        const field = fields[fieldIndexInAll];
        const cell = els[fieldIndexInAll]?.closest("td,th");
        field.repeat = {
          groupKey,
          itemIndex,
          fieldIndex,
          rowIndex: itemIndex,
          colIndex: cell
            ? Array.from(cell.parentElement?.children ?? []).indexOf(cell)
            : fieldIndex,
          confidence: 0.82,
        };
      });
    });
  }

  const patternGroups = new Map<string, number[]>();
  fields.forEach((field, index) => {
    const key = namePatternKey(field);
    if (!key) return;
    const indexes = patternGroups.get(key) ?? [];
    indexes.push(index);
    patternGroups.set(key, indexes);
  });
  for (const [key, indexes] of patternGroups) {
    if (indexes.length < 2) continue;
    const groupKey = `rg_name_${stableHash(key)}`;
    indexes.forEach((fieldIndexInAll, itemIndex) => {
      const field = fields[fieldIndexInAll];
      field.repeat ??= {
        groupKey,
        itemIndex,
        fieldIndex: 0,
        colIndex: 0,
        rowIndex: itemIndex,
        confidence: 0.7,
      };
    });
  }

  propagateRepeatLabels(fields);
}

function repeatedLabel(text: string, evidence: string[]): FieldLabelInfo {
  return {
    text,
    source: "repeated-group",
    confidence: LABEL_SCORES.repeatedGroup,
    evidence,
  };
}

function propagateRepeatLabels(fields: FieldInfo[]): void {
  const labelsByGroupField = new Map<string, string>();
  for (const field of fields) {
    if (!field.repeat || !field.label?.text) continue;
    labelsByGroupField.set(
      `${field.repeat.groupKey}:${field.repeat.colIndex ?? field.repeat.fieldIndex}`,
      field.label.text,
    );
  }
  for (const field of fields) {
    if (!field.repeat || field.label?.text) continue;
    const key = `${field.repeat.groupKey}:${field.repeat.colIndex ?? field.repeat.fieldIndex}`;
    const label = labelsByGroupField.get(key);
    if (label) field.label = repeatedLabel(label, [`propagated label for ${normalizeText(key)}`]);
  }
}
