import safeRegex from "safe-regex2";
import * as v from "valibot";
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

function safeRegExp(value: RegExpLike): RegExp | null {
  try {
    if (!safeRegex(value.pattern)) return null;
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
  const parsed = v.safeParse(ruleSetSchema, input);
  if (!parsed.success) {
    throw new Error("Invalid heuristic rule set");
  }
  const inputRuleSet = parsed.output;
  const rules: HeuristicRule[] = [];
  for (const rule of inputRuleSet.rules) {
    const scope = rule.scope === "site" || rule.scope === "form" || rule.scope === "component" ? rule.scope : "global";
    rules.push({
      id: rule.id,
      version: typeof rule.version === "number" ? rule.version : undefined,
      scope,
      priority: typeof rule.priority === "number" ? rule.priority : 0,
      confidence: typeof rule.confidence === "number" ? rule.confidence : 0.75,
      match: rule.match as HeuristicRule["match"],
      action: rule.action as HeuristicRule["action"],
      notes: typeof rule.notes === "string" ? rule.notes : undefined,
    });
  }
  return {
    version: inputRuleSet.version,
    updatedAt: inputRuleSet.updatedAt,
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

const regExpLikeSchema = v.object({
  pattern: v.string(),
  flags: v.optional(v.string()),
});

const stringMatcherSchema = v.union([v.string(), regExpLikeSchema]);

const matcherSchema = v.object({
  host: v.optional(stringMatcherSchema),
  pathname: v.optional(stringMatcherSchema),
  selector: v.optional(v.string()),
  tag: v.optional(v.string()),
  type: v.optional(v.string()),
  name: v.optional(stringMatcherSchema),
  id: v.optional(stringMatcherSchema),
  label: v.optional(stringMatcherSchema),
  placeholder: v.optional(stringMatcherSchema),
  autocomplete: v.optional(stringMatcherSchema),
  text: v.optional(stringMatcherSchema),
  attributes: v.optional(v.record(v.string(), stringMatcherSchema)),
  ancestorText: v.optional(stringMatcherSchema),
  repeat: v.optional(v.object({
    colIndex: v.optional(v.number()),
    fieldIndex: v.optional(v.number()),
    groupLabel: v.optional(stringMatcherSchema),
  })),
});

const actionSchema = v.object({
  semanticSlot: v.optional(v.string()),
  label: v.optional(v.string()),
  representation: v.optional(v.string()),
  adapter: v.optional(v.string()),
  stableKeyHint: v.optional(v.string()),
});

const ruleSchema = v.object({
  id: v.string(),
  version: v.optional(v.number()),
  scope: v.optional(v.union([
    v.literal("global"),
    v.literal("site"),
    v.literal("form"),
    v.literal("component"),
  ])),
  priority: v.optional(v.number()),
  confidence: v.optional(v.number()),
  match: matcherSchema,
  action: actionSchema,
  notes: v.optional(v.string()),
});

const ruleSetSchema = v.object({
  version: v.optional(v.string(), "unknown"),
  updatedAt: v.optional(v.string()),
  rules: v.array(ruleSchema),
});
