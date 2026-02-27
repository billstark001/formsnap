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
