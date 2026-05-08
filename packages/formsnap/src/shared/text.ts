const LABEL_NOISE = /\s*(?:[:：*＊]|required|optional|必須|任意)+\s*$/giu;

export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function normalizeText(s: string): string {
  return collapseWhitespace(s.replace(/[：]/g, ":"))
    .replace(LABEL_NOISE, "")
    .trim()
    .toLowerCase();
}

export function cleanLabelText(s: string): string {
  return collapseWhitespace(s)
    .replace(LABEL_NOISE, "")
    .trim();
}

export function elementText(el: Element | null, maxLength = 120): string {
  if (!el) return "";
  const clone = el.cloneNode(true) as Element;
  clone
    .querySelectorAll("input,select,textarea,button,script,style")
    .forEach((child) => child.remove());
  const text = cleanLabelText(clone.textContent ?? "");
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

export function looksDynamicToken(token: string): boolean {
  const t = token.trim();
  if (!t) return true;
  const lower = t.toLowerCase();
  const semantic = /email|mail|phone|tel|postal|postcode|zip|address|name|first|last|company|city|street|country|pref|region|user/.test(
    lower
  );
  if (semantic) return false;
  if (/^(?:[0-9a-f]{8,}|[a-z0-9+/]{16,}={0,2})$/i.test(t)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t))
    return true;
  if (/(session|nonce|random|uuid|guid|timestamp|^ts$)/i.test(t)) return true;
  if (/^(css|sc|jss|mui)-?[a-z0-9]{3,}$/i.test(t)) return true;
  if (/^_ngcontent-|^data-v-/i.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  if (/^(field|input|control|element)[_-]?\d{2,}$/i.test(t)) return true;
  const digits = (t.match(/\d/g) ?? []).length;
  if (t.length > 28 && digits > 6) return true;
  if (t.length > 40 && !/[aeiou]/i.test(t)) return true;
  return false;
}

export function tokenizeIdentifier(s: string | undefined): string[] {
  if (!s) return [];
  const spaced = s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\[[^\]]*\]/g, (m) => ` ${m.slice(1, -1)} `)
    .replace(/[._:\/\\-]+/g, " ");
  return spaced
    .split(/\s+/)
    .map((part) => normalizeText(part))
    .filter((part) => part && !/^\d+$/.test(part) && !looksDynamicToken(part));
}

export function identifierLabel(s: string | undefined): string {
  return tokenizeIdentifier(s).join(" ");
}

export function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const bs = new Set(b);
  return a.filter((token) => bs.has(token)).length / Math.max(a.length, b.length);
}
