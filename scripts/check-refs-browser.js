// M7: run every Java / C++ reference through the in-browser runner (src/runner/native) — the same path a learner's
// Run / Submit takes — and list what fails. Results also land on window.refCheck for scripted runs.
import { runNative } from '../src/runner/native/runNative.js';

const questions = import.meta.glob('../src/content/topics/*/questions/*.js', { import: 'default' });
const sources = import.meta.glob('../src/content/topics/*/solutions/*.{java,cpp}', { query: '?raw', import: 'default' });
const params = new URLSearchParams(location.search);
const langs = params.get('lang') ? [params.get('lang')] : ['java', 'cpp'];
const only = params.get('ids')?.split(',');

const sum = document.getElementById('sum');
const log = (text, cls) => {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = text;
  document.getElementById('log').append(line);
};

const jobs = Object.keys(sources)
  .map((p) => ({ path: p, lang: p.endsWith('.java') ? 'java' : 'cpp', id: p.split('/').pop().replace(/\.\w+$/, ''), topic: p.split('/')[4] }))
  .filter((j) => langs.includes(j.lang) && (!only || only.includes(j.id)))
  .sort((a, b) => a.lang.localeCompare(b.lang) || a.id.localeCompare(b.id));

const results = (window.refCheck = { done: false, passed: 0, failed: [], total: jobs.length });
for (const [k, j] of jobs.entries()) {
  sum.textContent = `${k} / ${jobs.length} · ${results.failed.length} failing · ${j.lang} ${j.id}…`;
  const question = await questions[`../src/content/topics/${j.topic}/questions/${j.id}.js`]();
  const code = await sources[j.path]();
  const t0 = performance.now();
  const res = await runNative({ lang: j.lang, code, question, tests: question.tests || [], timeoutMs: 30000 });
  const ms = Math.round(performance.now() - t0);
  const bad = res.compileError ? [res.compileError] : res.results.filter((r) => !r.passed).map((r) => `#${r.index + 1} ${r.error || `got ${r.output}`}`);
  if (bad.length) {
    results.failed.push({ lang: j.lang, id: j.id, why: bad.slice(0, 3).map((s) => s.slice(0, 300)) });
    log(`✖ ${j.lang} ${j.id} (${ms} ms): ${bad[0].slice(0, 300)}`, 'bad');
  } else {
    results.passed++;
    log(`✔ ${j.lang} ${j.id} ${res.results.length}/${res.results.length} (${ms} ms)`, 'ok');
  }
}
results.done = true;
sum.textContent = `${results.passed} of ${jobs.length} references pass in the browser · ${results.failed.length} failing`;
