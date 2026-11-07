# Security review (M12, 2026-11-07)

dsa-js is a static site on GitHub Pages: no server, no accounts, one learner per browser, progress in localStorage.
So the review is about what the page itself can be made to do.

## Done in M12
| Area | Finding | Action |
|---|---|---|
| Content-Security-Policy | Pages cannot send headers | `<meta http-equiv="Content-Security-Policy">` added to production builds by `build/cspPlugin.js` (dev has none: Vite injects inline scripts). Inline theme script allowed by its sha256, computed at build. `tests/csp.test.js`. |
| Policy contents | — | `default-src 'self'`; `script-src 'self' 'unsafe-eval' 'sha256-…'`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob:`; `font-src 'self' data:`; `connect-src 'self' https://cdn.jsdelivr.net`; `worker-src 'self' blob:`; `object-src 'none'`; `base-uri 'self'`; `form-action 'none'`. |
| `'unsafe-eval'` | Needed: the page compiles question checkers / harnesses (`runner/core.js`) and Animate's Big-O curve (`visualizations/runFrames.js`) with `new Function`; learner code runs in workers | Kept, documented. Evaluated text is the app's own content or the learner's own code in their own browser; no third-party script or HTML reaches the page. |
| Framing | A meta CSP cannot set `frame-ancestors` | Not restricted (would need a header; nothing on the page acts on a click without the learner's own data). |
| CI | The deploy built without testing | `deploy.yml` now runs `npm run check` (tests + content validation + build) before publishing. |
| Secrets | `git ls-files` / pattern scan | None tracked (no `.env`, keys, tokens). Workflow uses only `GITHUB_TOKEN` scopes `contents: read`, `pages: write`, `id-token: write`. |

## Checked, no change
- **Learner code** runs in Web Workers with a time limit (JS 10 s; Java / C++ 10 s per run, after compiling); a crash
  or infinite loop ends that worker only.
- **WebAssembly toolchains:** C++ `@yowasp/clang@22.0.0-git20542-10` from jsDelivr (exact version, immutable URL);
  Java TeaVM javac vendored in `public/teavm/` with sha256 checksums in its `NOTICE.md`.
- **Import:** a progress file goes through `migrate()` (shape normalised, unknown fields kept) and is rendered by React
  (escaped text); nothing from it is executed or injected as HTML.
- **Dependencies:** `npm audit` (2026-11-07, after the Vite upgrade) → **0 vulnerabilities**.
  - ~~esbuild ≤0.24.2 via vite 5 (GHSA-67mh-4wv8-2f99, moderate) and vite ≤6.4.3 (high: optimized-deps `.map` path
    traversal, `server.fs` allow/deny bypasses, cross-origin script via custom middleware, launch-editor issues).~~
    **Fixed 2026-11-07:** `vite` 6.4.5 (exact pin; esbuild 0.25.12), `@vitejs/plugin-react` 4.7.0 (exact). All were
    dev-server only; none were in the built site.
  - ~~react-router 6: open redirect via a backslash in `<Link>` / `useNavigate` (GHSA-wrjc-x8rr-h8h6), constructor
    injection in SSR hydration (GHSA-337j-9hxr-rhxg).~~ **Fixed 2026-11-07:** `react-router-dom` 6 replaced by
    `react-router` 7.18.4 (exact pin). Neither was reachable here anyway (all navigation targets are the app's own
    routes; no SSR).

## Optional hardening
- ~~Pin GitHub Actions to commit SHAs instead of `@v4` / `@v5` tags.~~ **Done 2026-11-07:** every `uses:` in
  `deploy.yml` is a full commit SHA with the release tag as a comment.
- ~~A compile time limit for the C++ compiler worker.~~ **Done 2026-11-07:** 60 s, counted once the toolchain is loaded;
  on timeout the worker is terminated and recreated on the next compile (`src/runner/native/runNative.js`).
- Subresource integrity for the clang files is not possible as loaded (the bundle fetches its own `.wasm`); the pinned
  version on jsDelivr is the safeguard.

## Launch check (on the live Pages site, after the deploy)
1. Open the site and every main page (Dashboard, a topic, a lesson in Steps view, a question, Visualizer, Shorts, a
   Short, Saved, Settings): the browser console shows **no CSP errors**.
2. On a question: Run in JavaScript, Java (first run downloads ~4 MB) and C++ (~23 MB): all show results.
3. Animate my run plays; the page guide opens on `?`.
4. Settings → Export, then Import the file: progress is unchanged.
