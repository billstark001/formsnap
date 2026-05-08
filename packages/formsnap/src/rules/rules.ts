import { normalizeText } from "../shared/text.js";
import type {
  FieldInfo,
  HeuristicRule,
  HeuristicRuleSet,
  RegExpLike,
  RuleContext,
} from "../types.js";

export const defaultHeuristicRules: HeuristicRuleSet = {
  version: "2026.05.09",
  rules: [
    {
      id: "global.email.type",
      scope: "global",
      priority: 100,
      confidence: 0.95,
      match: { type: "email" },
      action: { semanticSlot: "email" },
    },
    {
      id: "global.jp.postal.split.part1",
      scope: "global",
      priority: 90,
      confidence: 0.9,
      match: {
        label: { pattern: "郵便番号|邮编|postal|zip", flags: "i" },
        attributes: { maxlength: "3" },
      },
      action: { semanticSlot: "postal_code.part1", representation: "split_3_4" },
    },
  ],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRegExpLike(value: unknown): value is RegExpLike {
  return isObject(value) && typeof value.pattern === "string";
}

function safeRegExp(value: RegExpLike): RegExp | null {
  try {
    return new RegExp(value.pattern, value.flags);
  } catch {
    return null;
  }
}

function matches(value: string | undefined, matcher: string | RegExpLike | undefined): boolean {
  if (matcher === undefined) return true;
  if (value === undefined) return false;
  if (typeof matcher === "string") return normalizeText(value) === normalizeText(matcher);
  const re = safeRegExp(matcher);
  return re ? re.test(value) : false;
}

export function normalizeRuleSet(input: unknown): HeuristicRuleSet {
  if (!isObject(input) || !Array.isArray(input.rules)) {
    throw new Error("Invalid heuristic rule set");
  }
  const rules: HeuristicRule[] = [];
  for (const rule of input.rules) {
    if (!isObject(rule) || typeof rule.id !== "string" || !isObject(rule.match) || !isObject(rule.action)) continue;
    const scope = rule.scope === "site" || rule.scope === "form" || rule.scope === "component" ? rule.scope : "global";
    rules.push({
      id: rule.id,
      version: typeof rule.version === "number" ? rule.version : undefined,
      scope,
      priority: typeof rule.priority === "number" ? rule.priority : 0,
      confidence: typeof rule.confidence === "number" ? rule.confidence : 0.75,
      match: rule.match,
      action: rule.action,
      notes: typeof rule.notes === "string" ? rule.notes : undefined,
    } as HeuristicRule);
  }
  return {
    version: typeof input.version === "string" ? input.version : "unknown",
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : undefined,
    rules,
  };
}

export function mergeRuleSets(...sets: HeuristicRuleSet[]): HeuristicRuleSet {
  const byId = new Map<string, HeuristicRule>();
  for (const set of sets) {
    for (const rule of set.rules) {
      const existing = byId.get(rule.id);
      if (!existing || (rule.priority ?? 0) >= (existing.priority ?? 0)) byId.set(rule.id, rule);
    }
  }
  return {
    version: sets.map((set) => set.version).join("+") || "merged",
    updatedAt: new Date(0).toISOString(),
    rules: Array.from(byId.values()).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
  };
}

function ruleMatches(field: FieldInfo, context: RuleContext, rule: HeuristicRule): boolean {
  const m = rule.match;
  const el = context.element as HTMLInputElement | undefined;
  if (!matches(context.host, m.host)) return false;
  if (!matches(context.pathname, m.pathname)) return false;
  if (!matches(field.selector, m.selector)) return false;
  if (!matches(field.tag, m.tag)) return false;
  if (!matches(field.type, m.type)) return false;
  if (!matches(field.name, m.name)) return false;
  if (!matches(field.id, m.id)) return false;
  if (!matches(field.label?.text, m.label)) return false;
  if (!matches(el?.getAttribute("placeholder") ?? undefined, m.placeholder)) return false;
  if (!matches(el?.getAttribute("autocomplete") ?? undefined, m.autocomplete)) return false;
  if (m.attributes && el) {
    for (const [name, expected] of Object.entries(m.attributes)) {
      if (!matches(el.getAttribute(name) ?? undefined, expected)) return false;
    }
  }
  if (m.repeat) {
    if (m.repeat.colIndex !== undefined && field.repeat?.colIndex !== m.repeat.colIndex) return false;
    if (m.repeat.fieldIndex !== undefined && field.repeat?.fieldIndex !== m.repeat.fieldIndex) return false;
    if (!matches(field.repeat?.groupLabel, m.repeat.groupLabel)) return false;
  }
  return true;
}

export function applyHeuristicRules(
  field: FieldInfo,
  context: RuleContext,
  rules: HeuristicRuleSet
): FieldInfo {
  const next: FieldInfo = { ...field };
  for (const rule of rules.rules) {
    if (!ruleMatches(next, context, rule)) continue;
    const confidence = rule.confidence ?? 0.75;
    if (rule.action.label && (!next.label || confidence >= next.label.confidence / 100)) {
      next.label = {
        text: rule.action.label,
        source: "heuristic-rule",
        confidence: Math.round(confidence * 100),
        evidence: [`rule ${rule.id}`],
      };
    }
    if (rule.action.semanticSlot) {
      const current = next.semantic?.confidence ?? 0;
      if (confidence >= current - 0.1) {
        next.semantic = {
          slot: rule.action.semanticSlot,
          confidence: Math.max(confidence, current),
          representation: rule.action.representation ?? next.semantic?.representation,
          evidence: [...(next.semantic?.evidence ?? []), `heuristic rule ${rule.id}`],
          ruleIds: [...(next.semantic?.ruleIds ?? []), rule.id],
        };
      }
    }
    if (rule.action.stableKeyHint && next.identity) {
      next.identity = {
        ...next.identity,
        weakKey: rule.action.stableKeyHint,
        evidence: [...next.identity.evidence, `stable key hint from ${rule.id}`],
      };
    }
  }
  return next;
}

export async function fetchHeuristicRuleSet(
  url: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<HeuristicRuleSet> {
  const controller = new AbortController();
  const timeout = options.timeoutMs
    ? setTimeout(() => controller.abort(), options.timeoutMs)
    : undefined;
  try {
    const signal = options.signal ?? controller.signal;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Failed to fetch rules: ${response.status}`);
    return normalizeRuleSet(await response.json());
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
