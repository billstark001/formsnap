import { normalizeText, tokenOverlap, tokenizeIdentifier } from "../shared/text.js";
import type {
  FieldInfo,
  FieldMatch,
  IdentityMatchPreset,
  IdentityMatchPresetName,
  RestoreOptions,
  RestorePlan,
} from "../types.js";

function same(a: unknown, b: unknown): boolean {
  return a !== undefined && b !== undefined && a === b;
}

function selectorLooksNth(selector: string): boolean {
  return /nth-of-type/.test(selector) && !/#/.test(selector);
}

export const identityMatchPresets: Record<IdentityMatchPresetName, IdentityMatchPreset> = {
  strict: { minimumSourceMatches: 5, score: 100 },
  balanced: { minimumSourceMatches: 3, score: 85 },
  loose: { minimumSourceMatches: 2, score: 70 },
};

function identityPreset(options: RestoreOptions): IdentityMatchPreset {
  const base = identityMatchPresets[options.identityMatchPreset ?? "balanced"];
  return { ...base, ...options.identityMatch };
}

function matchingIdentitySources(source: FieldInfo, target: FieldInfo): string[] {
  const targetSources = new Set(target.identity?.sources ?? []);
  return (source.identity?.sources ?? []).filter((item) => targetSources.has(item));
}

function distinctiveIdentitySources(sources: string[]): string[] {
  return sources.filter((source) => !/^[ft]/.test(source));
}

function sourcesByPrefix(field: FieldInfo, prefix: string): Set<string> {
  return new Set((field.identity?.sources ?? []).filter((source) => source.startsWith(prefix)));
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const item of a) if (b.has(item)) return true;
  return false;
}

function tieBreaker(match: FieldMatch): number {
  const source = match.source;
  const target = match.target;
  let score = 0;
  if (same(source.identity?.stableKey, target.identity?.stableKey)) score += 10_000;
  if (source.selector === target.selector && (source.identity?.selectorReliability ?? 0) >= 70)
    score += 5_000;
  if (source.name && source.name === target.name) score += 4_000;
  if (same(source.label?.text, target.label?.text)) score += 1_000;
  if (same(source.repeat?.itemIndex, target.repeat?.itemIndex)) score += 500;
  if (same(source.repeat?.colIndex, target.repeat?.colIndex)) score += 200;
  score += distinctiveIdentitySources(matchingIdentitySources(source, target)).length * 20;
  return score;
}

export function scoreFieldMatch(
  source: FieldInfo,
  target: FieldInfo,
  options: RestoreOptions = {},
): FieldMatch {
  let score = 0;
  const evidence: string[] = [];
  const add = (points: number, reason: string) => {
    score += points;
    evidence.push(`${reason} +${points}`);
  };

  const preset = identityPreset(options);
  const identityMatches = matchingIdentitySources(source, target);
  const distinctiveMatches = distinctiveIdentitySources(identityMatches);
  const sourceDiscriminators = sourcesByPrefix(source, "x");
  const targetDiscriminators = sourcesByPrefix(target, "x");
  const discriminatorMismatch =
    sourceDiscriminators.size > 0 &&
    targetDiscriminators.size > 0 &&
    !intersects(sourceDiscriminators, targetDiscriminators);
  const sourceContext = sourcesByPrefix(source, "c");
  const targetContext = sourcesByPrefix(target, "c");
  const contextMismatch =
    sourceContext.size > 0 && targetContext.size > 0 && !intersects(sourceContext, targetContext);

  if (discriminatorMismatch) {
    return {
      source,
      target,
      confidence: 0,
      rawScore: 0,
      strategy: "conflicting discriminator",
      evidence: ["conflicting discriminator"],
    };
  }

  if (distinctiveMatches.length >= preset.minimumSourceMatches) {
    add(
      preset.score,
      `same distinctive identity sources (${distinctiveMatches.length}/${preset.minimumSourceMatches})`,
    );
  }
  if (same(source.identity?.stableKey, target.identity?.stableKey)) add(100, "same stableKey");
  if (
    source.selector === target.selector &&
    (source.identity?.selectorReliability ?? 0) >= 70 &&
    !selectorLooksNth(source.selector)
  ) {
    add(80, "same reliable selector");
  }
  if (same(source.semantic?.slot, target.semantic?.slot) && source.semantic?.slot !== "unknown")
    add(35, "same semantic slot");
  if (
    normalizeText(source.label?.text ?? "") &&
    normalizeText(source.label?.text ?? "") === normalizeText(target.label?.text ?? "")
  ) {
    add(35, "same normalized label");
  }
  if (
    same(source.repeat?.groupKey, target.repeat?.groupKey) &&
    same(source.repeat?.colIndex, target.repeat?.colIndex) &&
    same(source.repeat?.itemIndex, target.repeat?.itemIndex)
  ) {
    add(40, "same repeat group row/column");
  } else if (
    same(source.repeat?.groupKey, target.repeat?.groupKey) &&
    same(source.repeat?.colIndex, target.repeat?.colIndex)
  ) {
    add(10, "same repeat group column");
  } else if (
    source.repeat &&
    target.repeat &&
    same(source.repeat?.colIndex, target.repeat?.colIndex)
  ) {
    add(25, "same repeat column");
  }
  const nameOverlap = tokenOverlap(
    tokenizeIdentifier(source.name),
    tokenizeIdentifier(target.name),
  );
  if (nameOverlap > 0) add(Math.round(25 * nameOverlap), "stable name token overlap");
  const idOverlap = tokenOverlap(tokenizeIdentifier(source.id), tokenizeIdentifier(target.id));
  if (idOverlap > 0) add(Math.round(20 * idOverlap), "stable id token overlap");
  if (source.tag === target.tag && (source.type ?? "") === (target.type ?? ""))
    add(10, "same tag/type");
  if (source.options?.length && target.options?.length) {
    const a = source.options.map((o) => normalizeText(o.text)).join("|");
    const b = target.options.map((o) => normalizeText(o.text)).join("|");
    if (a === b) add(25, "same select options");
  }
  if (contextMismatch && score > 55) {
    score = 55;
    evidence.push("context mismatch cap");
  }
  if (source.selector === target.selector && selectorLooksNth(source.selector) && score < 40) {
    score = Math.min(40, score + 20);
    evidence.push("nth-of-type selector capped");
  }
  if (source.id && target.id && source.id === target.id && idOverlap === 0 && score > 30) {
    score = 30;
    evidence.push("dynamic id only cap");
  }

  return {
    source,
    target,
    confidence: Math.min(1, score / 100),
    rawScore: score,
    strategy: evidence[0]?.split(" +")[0] ?? "no-match",
    evidence,
  };
}

export function matchFields(
  sourceFields: FieldInfo[],
  targetFields: FieldInfo[],
  options: RestoreOptions = {},
): RestorePlan {
  const min = options.minMatchConfidence ?? (options.allowWeakMatches ? 0.35 : 0.55);
  const candidates: FieldMatch[] = [];
  for (const source of sourceFields) {
    for (const target of targetFields) {
      const match = scoreFieldMatch(source, target, options);
      if (match.confidence >= min) candidates.push(match);
    }
  }
  candidates.sort((a, b) => {
    const confidence = b.confidence - a.confidence;
    if (confidence) return confidence;
    const rawScore = (b.rawScore ?? 0) - (a.rawScore ?? 0);
    if (rawScore) return rawScore;
    return tieBreaker(b) - tieBreaker(a);
  });
  const usedSource = new Set<FieldInfo>();
  const usedTarget = new Set<FieldInfo>();
  const matches: FieldMatch[] = [];
  for (const candidate of candidates) {
    if (usedSource.has(candidate.source) || usedTarget.has(candidate.target)) continue;
    matches.push(candidate);
    usedSource.add(candidate.source);
    usedTarget.add(candidate.target);
  }
  return {
    matches,
    unmatchedSource: sourceFields.filter((field) => !usedSource.has(field)),
    unmatchedTarget: targetFields.filter((field) => !usedTarget.has(field)),
    warnings: [],
  };
}

export function createRestorePlan(
  snapshot: { fields: FieldInfo[] } | FieldInfo[],
  current: FieldInfo[],
  options: RestoreOptions = {},
): RestorePlan {
  const source = Array.isArray(snapshot) ? snapshot : snapshot.fields;
  const plan = matchFields(source, current, options);
  const ambiguous = plan.matches.filter((match) => match.confidence < 0.7);
  if (ambiguous.length) {
    plan.warnings.push(`${ambiguous.length} low-confidence matches`);
  }
  return plan;
}
