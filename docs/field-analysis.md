# Field Analysis

FormSnap can now collect more than DOM values. `analyzeFields()` returns the original `FieldInfo` shape plus optional `label`, `semantic`, `repeat`, `identity`, `aliases`, and debug evidence.

## Label Detection

Labels are gathered from local, explainable browser signals:

- `label[for]` and `input.labels`
- wrapped `<label><input>Text</label>`
- `aria-labelledby` and `aria-label`
- table headers and row headers
- nearest fieldset legend
- nearby label-like text in the field container
- placeholder, title, and stable name/id tokens
- propagation within repeated rows or cards

Each label has `source`, `confidence`, and `evidence`. Text is trimmed, whitespace is collapsed, common required/optional suffixes are removed, and very long surrounding text is ignored.

## Semantic Slots

`semantic.slot` is inferred locally from type, autocomplete, label text, placeholder/name/id aliases, select option text, and heuristic rules. Built-in slots include email, phone parts, postal code parts, address parts, name parts, company, department, title, date, number, URL, password, username, search, and unknown.

`semantic.representation` records detected layouts such as Japanese postal code `single_7_digits`, `single_3_dash_4`, and `split_3_4`, phone `single` or split fields, and full-address textareas. The library records the representation even when it does not yet transform values between all representations.

## Repeat Groups

`detectRepeatGroups()` looks for repeated table rows, list items, cards, and div rows by comparing local structure fingerprints. It also recognizes indexed field names such as `applicant[0][email]` and `applicant[1][email]`.

Fields in a group receive:

- `groupKey`
- `itemIndex`
- `fieldIndex`
- optional `rowIndex` and `colIndex`
- confidence

When the first row or table header has the only useful label, FormSnap propagates the label to fields in the same repeated column.

## Stable Identity

`identity.stableKey` is not a selector. It is derived from stable evidence: form context, tag/type, semantic slot, normalized label, repeat column, filtered name/id tokens, structural path, autocomplete, and option fingerprints.

Dynamic ids and classes are down-weighted. UUIDs, long hashes, session/nonce/random/timestamp tokens, build hashes, and meaningless numeric field ids reduce selector reliability. Semantic ids such as `email`, `postalCode`, and `address1` remain useful.

## Restore Matching

`createRestorePlan()` compares old snapshot fields against current analyzed fields. Matches include confidence and evidence. Signals include stable key, reliable selector, semantic slot, normalized label, repeat column, stable name/id tokens, tag/type, structural path, and select options.

`restoreSnapshot()` uses the plan before filling. This lets an old snapshot survive changed ids, inserted DOM nodes that shift `nth-of-type`, and repeated rows where absolute position is less reliable than group column identity.
