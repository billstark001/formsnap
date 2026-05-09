import { hash } from "ohash";

/** Deterministic object hash for identities and structure fingerprints. */
export function stableHash(value: unknown): string {
  return hash(value);
}
