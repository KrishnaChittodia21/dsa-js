// Visualizer scenes (src/visualizations/scenarios): each scene's frames are a pure function of its input.
// Structure and predict questions are checked by scripts/validate-visuals.mjs (part of `npm run validate`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { SCENARIOS } from '../src/visualizations/scenarios/index.js';

test('every scene: same input gives the same frames, and the input is never changed', () => {
  for (const [id, sc] of Object.entries(SCENARIOS)) {
    for (const input of [sc.defaultInput, ...(sc.testInputs || [])]) {
      const given = structuredClone(input);
      const a = sc.generate(given);
      assert.deepEqual(given, input, `${id} changed its input`);
      assert.deepEqual(sc.generate(structuredClone(input)), a, `${id} is not deterministic`);
    }
  }
});

test('every scene names its problem, and a linked question exists', async () => {
  const { readdirSync, existsSync } = await import('node:fs');
  const root = new URL('../src/content/topics/', import.meta.url);
  const topics = readdirSync(root);
  const hasQuestion = (id) => topics.some((t) => existsSync(new URL(`${t}/questions/${id}.js`, root)));
  for (const [id, sc] of Object.entries(SCENARIOS)) {
    assert.ok(sc.problem?.name?.trim(), `${id}: problem.name missing`);
    assert.ok(sc.problem?.statement?.trim(), `${id}: problem.statement missing`);
    if (sc.problem.questionId) assert.ok(hasQuestion(sc.problem.questionId), `${id}: questionId "${sc.problem.questionId}" has no question file`);
  }
});

// problem.example is display text; exampleOutput is its checked part and must equal the final frame's `result`
// when the scene runs on exampleInput (defaultInput when omitted). The display text must also show exampleOutput.
const show = (v) => (Array.isArray(v) ? `[${v.map(show).join(',')}]` : String(v));
const squash = (t) => t.replace(/[\s"'`]/g, '');
test('every scene example is what the scene actually computes', () => {
  const bad = [];
  for (const [id, sc] of Object.entries(SCENARIOS)) {
    const p = sc.problem;
    if (!('exampleOutput' in p)) bad.push(`${id}: problem.exampleOutput missing`);
    else {
      const got = sc.generate(structuredClone(p.exampleInput ?? sc.defaultInput)).at(-1).result;
      if (!isDeepStrictEqual(got, p.exampleOutput)) bad.push(`${id}: final frame result ${JSON.stringify(got)} ≠ exampleOutput ${JSON.stringify(p.exampleOutput)}`);
      if (!squash(p.example).includes(squash(show(p.exampleOutput)))) bad.push(`${id}: example text "${p.example}" does not show ${show(p.exampleOutput)}`);
    }
  }
  assert.deepEqual(bad, []);
});
