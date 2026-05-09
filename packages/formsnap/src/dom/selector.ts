import cssEscape from "css.escape";
import { finder, attr, className, idName } from "@medv/finder";
import { stableHash } from "../shared/hash.js";
import { uniqueIdentitySources } from "../shared/identity.js";
import { looksDynamicToken, tokenizeIdentifier } from "../shared/text.js";
import type { FieldContext, FieldIdentityInfo, StableSelectorOptions } from "../types.js";

/**
 * Generates a unique CSS selector for a DOM element.
 * Prefers id-based selectors; falls back to nth-of-type path.
 */
export function getSelector(el: Element): string {
  if (el.id && !looksDynamicToken(el.id)) return `#${cssEscape(el.id)}`;
  if (isExpensiveSelectorSearch(el)) return getSimpleSelector(el);
  installFinderGlobals(el);
  try {
    return finder(el, {
      root: el.ownerDocument.body,
      timeoutMs: 25,
      seedMinLength: 1,
      optimizedMinLength: 1,
      maxNumberOfPathChecks: 200,
      idName: (value) => idName(value) && !looksDynamicToken(value),
      className: (value) => className(value) && !looksDynamicToken(value),
      attr: (name, value) =>
        attr(name, value) && /^(aria-label|autocomplete|name|type)$/i.test(name),
    });
  } catch {
    // Some production pages have deep/generated DOMs that make selector search
    // explode combinatorially. Filling must continue, so use a linear fallback.
    return getSimpleSelector(el);
  }
}

export { looksDynamicToken };

function installFinderGlobals(el: Element): void {
  const view = el.ownerDocument.defaultView;
  // @medv/finder reads browser globals while building defaults. Browsers already
  // provide them; jsdom unit tests often keep them only on ownerDocument.defaultView.
  if (!globalThis.document) {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: el.ownerDocument,
    });
  }
  if (!globalThis.Node && view?.Node) {
    Object.defineProperty(globalThis, "Node", {
      configurable: true,
      value: view.Node,
    });
  }
  if (!globalThis.CSS && view?.CSS) {
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: view.CSS,
    });
  }
}

function getSimpleSelector(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;

  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== "html") {
    let seg = node.tagName.toLowerCase();
    if (node.id && !looksDynamicToken(node.id)) {
      seg += `#${cssEscape(node.id)}`;
      parts.unshift(seg);
      break;
    }

    const current: Element = node;
    const parent: Element | null = current.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (child) => child.tagName === current.tagName
      );
      if (sameTag.length > 1) seg += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
    }
    parts.unshift(seg);
    node = parent;
  }

  return parts.join(" > ");
}

function isExpensiveSelectorSearch(el: Element): boolean {
  let depth = 0;
  let branchCost = 0;
  let node: Element | null = el;
  while (node && node.tagName.toLowerCase() !== "html") {
    depth++;
    branchCost += node.parentElement?.children.length ?? 0;
    if (depth > 16 || branchCost > 180) return true;
    node = node.parentElement;
  }
  return false;
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
    sources: uniqueIdentitySources([
      { kind: "stable-key", value: `fs_${stableHash(keyParts)}` },
      context.formKey ? { kind: "form-key", value: context.formKey } : undefined,
      { kind: "tag-type", value: `${tag}:${type}` },
      ...nameTokens.map((value) => ({ kind: "name-token" as const, value })),
      ...idTokens.map((value) => ({ kind: "id-token" as const, value })),
      structuralPath ? { kind: "structural-path", value: structuralPath } : undefined,
    ]),
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
