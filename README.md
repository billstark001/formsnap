# FormSnap

Browser tools for collecting and re-filling form data. Provided as:

- **Bookmarklets** — drag-and-drop into any browser's bookmarks bar
- **Chrome Extension** — one-click UI in any tab
- **Core Library** (`formsnap`) — importable ESM module for custom integrations

## Packages

| Package | Description |
|---|---|
| [`packages/formsnap`](packages/formsnap) | Core ESM library — selector generation, field analysis, resilient snapshot restore |
| [`packages/formsnap-bookmarklet`](packages/formsnap-bookmarklet) | Static site (Vite + Preact) hosting the bookmarklets |
| [`packages/formsnap-chrome`](packages/formsnap-chrome) | Chrome Extension (Manifest V3, Vite + Preact) |

## Quick Start

```bash
pnpm install
pnpm build          # build all packages
pnpm test           # run tests (Vitest, formsnap package)
```

## Core Library

`formsnap` still exposes the original `collectFields` and `fillFields` APIs for selector-based snapshots. The core package now also includes semantic analysis and dynamic-form recovery:

- `analyzeFields(options?, root?)` collects fields and adds label, semantic, repeat-group, and stable identity metadata.
- `collectSnapshot(options?, root?)` returns a versioned `FormSnapshot` with a form signature and enhanced fields.
- `matchFields(source, target, options?)` and `createRestorePlan(snapshot, current, options?)` explain how old fields map to the current DOM.
- `restoreSnapshot(snapshot, options?, root?)` analyzes the current page before filling, so changed ids and shifted `nth-of-type` paths can still recover through labels, semantics, repeat columns, and stable keys.
- `normalizeRuleSet`, `mergeRuleSets`, `applyHeuristicRules`, and `fetchHeuristicRuleSet` provide a declarative heuristic rule protocol for site or server-maintained field rules.

See [`docs/field-analysis.md`](docs/field-analysis.md) and [`docs/heuristics.md`](docs/heuristics.md) for the analysis model and rule schema.

The core package is organized into submodules with their own public indexes:

- `formsnap/shared`
- `formsnap/dom`
- `formsnap/analysis`
- `formsnap/rules`
- `formsnap/snapshot`
- `formsnap/restore`
- `formsnap/adapters`

The root `formsnap` export re-exports these modules for the bookmarklet and Chrome extension. See [`docs/bookmarklet-chrome-roadmap.md`](docs/bookmarklet-chrome-roadmap.md) for planned UI import/export upgrades.

## W3C Standards & Framework Compatibility

### Standards compliance

| Standard | Status |
|---|---|
| [HTML Living Standard — form elements](https://html.spec.whatwg.org/multipage/form-elements.html) | ✅ Full support for `input`, `select`, `textarea` |
| [CSS Visibility](https://www.w3.org/TR/CSS2/visufx.html) | ✅ Detects `display:none`, `visibility:hidden` |
| [DOM Level 3 Events](https://www.w3.org/TR/DOM-Level-3-Events/) | ✅ Dispatches `input` and `change` events with `bubbles:true` |
| [HTMLInputElement.value setter](https://html.spec.whatwg.org/#dom-input-value) | ✅ Uses native property descriptor for React compatibility |
| [CSS.escape()](https://www.w3.org/TR/cssom-1/#the-css.escape()-method) | ✅ Used for safe selector construction |

### Framework compatibility

| Framework | Collection | Filling | Notes |
|---|---|---|---|
| Plain HTML | ✅ | ✅ | Full support |
| React (16–19) | ✅ | ✅ | Uses `Object.getOwnPropertyDescriptor` on `HTMLInputElement.prototype.value` to bypass React's synthetic event system |
| Vue (2/3) | ✅ | ✅ | `input` + `change` events trigger `v-model` updates |
| Angular | ✅ | ✅ | Change detection triggered via `change` event |
| Svelte | ✅ | ✅ | Standard `input` events sufficient |
| Solid.js | ✅ | ✅ | Uses fine-grained reactivity via DOM events |
| Web Components | ✅ | ⚠️ | Works on standard shadow-root–less components; shadow DOM internals not traversed |

### Known limitations

- **Shadow DOM**: Elements inside closed shadow roots are not collected. Open shadow roots are accessible if queried explicitly.
- **Canvas/custom inputs**: Non-standard input widgets (e.g., rich-text editors, date pickers that hide the real input) may require custom handling.
- **Custom components**: The core now has a lightweight adapter interface for future `contenteditable`, combobox, Web Component, and hidden backing-input support. Native inputs, textareas, selects, checkboxes, and radios remain the built-in behavior.
- **iframe**: Cross-origin iframes cannot be accessed due to the same-origin policy.
- **`type=file`**: File input values cannot be set programmatically (browser security restriction).

## Testing

Uses **[Vitest](https://vitest.dev/)** (not Jest) because:

- Native ESM support without transform overhead
- Shares Vite's config and plugin pipeline
- Faster cold-start and watch mode
- First-class TypeScript support

Run tests:

```bash
pnpm --filter formsnap test
```

## CI/CD

| Workflow | Trigger | Output |
|---|---|---|
| `deploy-bookmarklet.yml` | Push to `main` | Deploys `formsnap-bookmarklet` to GitHub Pages |
| `release-chrome.yml` | Push a `v*` tag | Packages `formsnap-chrome` as a `.zip`, uploads as a release asset |

### Chrome Web Store publishing

Automated publishing to the Chrome Web Store requires the following repository secrets:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_EXTENSION_ID`

See [Google's OAuth2 setup guide](https://developer.chrome.com/docs/webstore/using-api/) for how to obtain these values.

## License

MIT
