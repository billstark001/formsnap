# FormSnap

Browser tools for collecting and re-filling form data. Provided as:

- **Bookmarklets** — drag-and-drop into any browser's bookmarks bar
- **Chrome Extension** — one-click UI in any tab
- **Core Library** (`formsnap`) — importable ESM module for custom integrations

## Packages

| Package | Description |
|---|---|
| [`packages/formsnap`](packages/formsnap) | Core ESM library — selector generation, collection, filling |
| [`packages/formsnap-bookmarklet`](packages/formsnap-bookmarklet) | Static SSG site (Vite + Vike + Preact) hosting the bookmarklets |
| [`packages/formsnap-chrome`](packages/formsnap-chrome) | Chrome Extension (Manifest V3, Vite + Preact) |

## Quick Start

```bash
pnpm install
pnpm build          # build all packages
pnpm test           # run tests (Vitest, formsnap package)
```

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
