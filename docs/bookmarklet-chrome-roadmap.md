# Bookmarklet And Chrome Extension Improvements

This document sketches the next UX layer after the core `formsnap` package gained stable identity, labels, semantics, snapshots, and restore plans. The extensions should stay thin: they should call core APIs and focus on import/export, display, and user workflows.

## 1. Markdown Export

Add "Export Markdown" as a user-only archival format. It should be readable in notes apps and not intended for automated restore.

Suggested format:

```md
# Form Snapshot

- Created: 2026-05-09T00:00:00.000Z
- Form: Example Application
- URL: https://example.test/apply

| ID | Field | Meaning | Value |
|---|---|---|---|
| email | Email Address | email | user@example.test |
```

Rules:

- Escape table pipes and line breaks.
- Redact or mark sensitive values by default for `password`, hidden inputs, and fields whose label contains high-risk words.
- For checkboxes/radios, show checked state and selected option text where possible.
- For multi-selects, join selected labels with commas.
- Do not include internal debug evidence unless the user chooses a verbose export.

## 2. AI-Friendly Fill Workflow

Do not call an LLM from FormSnap. Instead, generate an AI-friendly schema that users can paste into their own LLM tool, then import the LLM's structured output.

Export to LLM:

```json
{
  "version": "formsnap-ai-fill-1",
  "instructions": "Return JSON only. Fill only fields you are confident about.",
  "fields": [
    { ... }
  ]
}
```

Expected LLM output:

```json
{
  "version": "formsnap-ai-fill-result-1",
  "values": [
    {
      ...
      "value": "user@example.test",
      "confidence": 0.94,
      "note": "Provided in profile"
    }
  ]
}
```

Import behavior:

- Match by `stableId` first, then `id`/`naiveId` if unambiguous.
- Require JSON, not prose.
- Validate option values for select/radio fields.
- Show a review table before applying values.
- Default minimum confidence can be configurable, for example `0.6`.
- Unknown fields or invalid values should be skipped with a visible warning.

Suggested UI additions:

- Collector tab: Export JSON Snapshot, Export Markdown, Export AI Schema.
- Filler tab: Import Legacy JSON, Import Snapshot JSON, Import AI Fill JSON.
- Result view: show matched `description`, `naiveId`, confidence, and whether restore used stable, semantic, or weak matching.
