// M12: a Content-Security-Policy <meta> for production builds — GitHub Pages cannot send headers. The dev server gets
// none (Vite injects its own inline scripts there). Inline scripts (the theme set-up in index.html) are allowed by
// their sha256, computed from the built HTML, so editing that script can never silently break the page.
//
// Why each source is allowed:
//  - 'unsafe-eval': the page compiles a question's checker / harness text and Animate's Big-O curve with
//    `new Function` (src/runner/core.js, src/visualizations/runFrames.js). That text is the app's own content or code
//    the learner types into their own editor; the page loads no third-party scripts or HTML.
//  - cdn.jsdelivr.net: the C++ compiler (@yowasp/clang, pinned version) — fetched by a worker.
//  - blob: workers / images: generated downloads and worker fallbacks.
// A <meta> CSP cannot set frame-ancestors (it needs a header), so framing is not restricted.
import { createHash } from 'node:crypto';

export function cspContent(scriptHashes = []) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval'${scriptHashes.map((h) => ` 'sha256-${h}'`).join('')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://cdn.jsdelivr.net",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
}

/** sha256 (base64) of every inline <script> body in an HTML document */
export const inlineScriptHashes = (html) =>
  [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => createHash('sha256').update(m[1]).digest('base64'));

/** add the CSP <meta> right after <meta charset> (before any script, so it covers them all) */
export function withCsp(html) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${cspContent(inlineScriptHashes(html))}" />`;
  const out = html.replace(/(<meta charset="[^"]*"\s*\/?>)/i, `$1\n    ${meta}`);
  if (out === html) throw new Error('csp: no <meta charset> in index.html to anchor the CSP');
  return out;
}

export default function cspPlugin() {
  return { name: 'dsa-csp', apply: 'build', transformIndexHtml: { order: 'post', handler: withCsp } };
}
