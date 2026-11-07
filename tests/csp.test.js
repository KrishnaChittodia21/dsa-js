// M12: the production Content-Security-Policy <meta> (build/cspPlugin.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { withCsp, cspContent } from '../build/cspPlugin.js';

const html = '<!doctype html><html><head>\n    <meta charset="UTF-8" />\n    <script>var t = 1;</script>\n    <script type="module" src="/x.js"></script></head></html>';

test('every inline script is allowed by its hash, and the policy comes before the first script', () => {
  const out = withCsp(html);
  const hash = createHash('sha256').update('var t = 1;').digest('base64');
  assert.ok(out.includes(`'sha256-${hash}'`));
  assert.ok(out.indexOf('Content-Security-Policy') < out.indexOf('<script'));
  assert.equal((out.match(/sha256-/g) || []).length, 1); // the src= script needs no hash
});

test('the policy keeps everything else locked to the site', () => {
  const c = cspContent();
  for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'", 'connect-src \'self\' https://cdn.jsdelivr.net'])
    assert.ok(c.includes(d), d);
  assert.ok(!/script-src[^;]*https?:/.test(c), 'no remote script hosts on the page');
});

test('a page without <meta charset> fails the build instead of shipping without a policy', () => {
  assert.throws(() => withCsp('<html><head></head></html>'), /no <meta charset>/);
});
