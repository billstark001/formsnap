# Heuristic Rules

FormSnap's core library does not require a server, but it can consume a server-maintained declarative rule set. Rules are JSON data only: no functions, no `eval`, and no executable code.

## Why Rules Exist

Many enterprise forms use generated ids, generic component markup, or site-specific labels. Built-in heuristics cover common global patterns, while local or remote rules can add site knowledge such as "this component's third column is a postal code part".

Rule sources can be layered in this order:

1. built-in default rules
2. bundled site or component rules
3. user-provided local rules
4. fetched remote rules
5. user-correction generated rules

Use `mergeRuleSets()` to combine them. Higher-priority rules replace lower-priority rules with the same id, and rule confidence participates in semantic selection instead of blindly overwriting strong local evidence.

## Schema

```json
{
  "version": "2026.05.09",
  "updatedAt": "2026-05-09T00:00:00.000Z",
  "rules": [
    {
      "id": "global.jp.postal.split.part1",
      "scope": "global",
      "priority": 100,
      "confidence": 0.9,
      "match": {
        "label": { "pattern": "郵便番号|邮编|postal|zip", "flags": "i" },
        "attributes": { "maxlength": "3" }
      },
      "action": {
        "semanticSlot": "postal_code.part1",
        "representation": "split_3_4"
      }
    }
  ]
}
```

Matchers can inspect host, pathname, selector, tag, type, name, id, label, placeholder, autocomplete, attributes, ancestor text, and repeat metadata. String matchers are normalized exact matches. `{ "pattern": "...", "flags": "i" }` creates a guarded regular expression; invalid regexes simply fail that matcher.

Actions can set a semantic slot, label, representation, adapter id, or stable-key hint.

## Remote Endpoint

A remote endpoint can return the same JSON:

```http
GET /formsnap/rules.json
ETag: "rules-2026-05-09"
Content-Type: application/json
```

Clients can call `fetchHeuristicRuleSet(url, { timeoutMs, signal })`, then pass the normalized result to `analyzeFields({ rules })`. Fetch failures should be caught by the integration and should not prevent local collection or restore.

## Safety

Remote rules are declarative. They cannot execute JavaScript, traverse closed shadow roots, or install custom runtime behavior. `normalizeRuleSet()` validates the top-level shape and drops malformed rules. Regular expressions are constructed safely and invalid patterns are contained.

## Versioning And Rollback

Use monotonically meaningful `version` values and optional `updatedAt`/`etag` metadata. Keep old rule sets available for rollback, and prefer additive rule ids over changing semantics in place. User corrections can be serialized as high-priority local rules with narrow site or form scope.
