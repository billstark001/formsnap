import { stableHash } from "./hash.js";
import type { FieldInfo, StableIdentitySource, StableIdentitySourceKind } from "../types.js";

const SOURCE_CODES: Record<StableIdentitySourceKind, string> = {
  "stable-key": "s",
  "form-key": "f",
  "tag-type": "t",
  semantic: "m",
  label: "l",
  "repeat-column": "r",
  "name-token": "n",
  "id-token": "i",
  "structural-path": "p",
  autocomplete: "a",
  "option-text": "o",
  context: "c",
  discriminator: "x",
  "naive-id": "d",
};

type IdentitySourceInput = StableIdentitySource | { kind: StableIdentitySourceKind; value: string };

function firstToken(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const token = value
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (token) return token;
  }
  return undefined;
}

export function createNaiveId(field: FieldInfo, index = 0): string {
  return (
    firstToken(
      field.semantic?.slot,
      field.label?.text,
      field.name,
      field.id,
      field.identity?.weakKey,
      field.selector,
    ) ?? `field_${index + 1}`
  );
}

export function encodeIdentitySource(
  kind: StableIdentitySourceKind,
  value: string,
): StableIdentitySource {
  // Keep snapshots compact and privacy-friendlier by storing hashed facts.
  return `${SOURCE_CODES[kind]}${stableHash(value).slice(0, 10)}`;
}

export function uniqueIdentitySources(
  sources: Array<IdentitySourceInput | undefined>,
): StableIdentitySource[] {
  const seen = new Set<string>();
  const result: StableIdentitySource[] = [];
  for (const source of sources) {
    if (!source) continue;
    const key =
      typeof source === "string"
        ? source
        : source.value
          ? encodeIdentitySource(source.kind, source.value)
          : "";
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}
