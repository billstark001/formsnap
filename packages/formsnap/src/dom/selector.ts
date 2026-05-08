import { stableHash } from "../shared/hash.js";
import { looksDynamicToken, tokenizeIdentifier } from "../shared/text.js";
import type { FieldContext, FieldIdentityInfo, StableSelectorOptions } from "../types.js";

/**
 * Generates a unique CSS selector for a DOM element.
 * Prefers id-based selectors; falls back to nth-of-type path.
 */
export function getSelector(el: Element): string {
  if (el.id) return "#" + el.id;

  const parts: string[] = [];
  let node: Element | null = el;

  while (node && node.nodeType === 1) {
    let seg = node.nodeName.toLowerCase();

    if (node.id) {
      seg += "#" + node.id;
      parts.unshift(seg);
      break;
    }

    let sib: Element | null = node;
    let nth = 1;
    while ((sib = sib.previousElementSibling)) {
      if (sib.nodeName.toLowerCase() === seg) nth++;
    }
    if (nth > 1) seg += `:nth-of-type(${nth})`;

    parts.unshift(seg);
    node = node.parentElement;
  }

  return parts.join(" > ");
}

export { looksDynamicToken };

function cssEscape(value: string): string {
  if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

export function getSelectorReliability(el: Element): number {
  if (el.id) return looksDynamicToken(el.id) ? 35 : 92;
  const name = (el as HTMLInputElement).name;
  if (name) return tokenizeIdentifier(name).length > 0 ? 70 : 40;
  return 45;
}

export function getStructuralPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== "html") {
    let seg = node.tagName.toLowerCase();
    const stableIdTokens = tokenizeIdentifier(node.id);
    if (stableIdTokens.length) {
      seg += `[id~=${stableIdTokens.join("-")}]`;
    } else {
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter(
          (child) => child.tagName === node!.tagName
        );
        if (sameTag.length > 1) seg += `:nth(${sameTag.indexOf(node) + 1})`;
      }
    }
    parts.unshift(seg);
    node = node.parentElement;
  }
  return parts.join(">");
}

export function getStableSelector(
  el: Element,
  options: StableSelectorOptions = {}
): string {
  const tag = el.tagName.toLowerCase();
  const name = (el as HTMLInputElement).name;
  if (options.preferName && name && tokenizeIdentifier(name).length) {
    return `${tag}[name="${cssEscape(name)}"]`;
  }
  if (el.id && !looksDynamicToken(el.id)) return `#${cssEscape(el.id)}`;
  if (name && tokenizeIdentifier(name).length) return `${tag}[name="${cssEscape(name)}"]`;
  return getStructuralPath(el).replace(/:nth\((\d+)\)/g, ":nth-of-type($1)");
}

export function getBestSelector(el: Element): {
  selector: string;
  reliability: number;
  reason: string;
} {
  const reliability = getSelectorReliability(el);
  if (el.id && reliability >= 80) {
    return { selector: getSelector(el), reliability, reason: "stable-id" };
  }
  return {
    selector: getStableSelector(el),
    reliability,
    reason: el.id ? "dynamic-id-avoided" : "structural-or-name",
  };
}

export function getFieldIdentity(
  el: Element,
  context: FieldContext = {}
): FieldIdentityInfo {
  const tag = el.tagName.toLowerCase();
  const type = ((el as HTMLInputElement).type ?? "").toLowerCase();
  const name = (el as HTMLInputElement).name;
  const idTokens = tokenizeIdentifier(el.id);
  const nameTokens = tokenizeIdentifier(name);
  const structuralPath = getStructuralPath(el);
  const selectorReliability = getSelectorReliability(el);
  const idReliability = el.id ? (looksDynamicToken(el.id) ? 20 : 85) : undefined;
  const nameReliability = name ? (nameTokens.length ? 75 : 30) : undefined;
  const keyParts = [
    "v1",
    context.formKey,
    tag,
    type,
    idTokens,
    nameTokens,
    structuralPath,
  ];
  return {
    stableKey: `fs_${stableHash(keyParts)}`,
    weakKey: `fw_${stableHash([tag, type, nameTokens, idTokens])}`,
    formKey: context.formKey,
    structuralPath,
    selectorReliability,
    idReliability,
    nameReliability,
    evidence: [
      `selector reliability ${selectorReliability}`,
      ...(idTokens.length ? [`stable id tokens: ${idTokens.join(",")}`] : []),
      ...(nameTokens.length ? [`stable name tokens: ${nameTokens.join(",")}`] : []),
      `structural path ${structuralPath}`,
    ],
  };
}
