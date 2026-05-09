export function createBookmarkletHref(code: string, wrapCode = false): string {
  const payload = wrapCode ? `!function(){${code}}();` : code;

  // Browsers decode javascript: URLs before execution. Encoding keeps
  // source text like modulo expressions (`n%32`) from becoming identifiers (`n2`).
  return `javascript:${encodeURIComponent(payload)}`;
}
