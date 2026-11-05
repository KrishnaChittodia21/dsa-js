// Visualizer scenes (src/visualizations/scenarios): each scene's frames are a pure function of its input.
// Structure and predict questions are checked by scripts/validate-visuals.mjs (part of `npm run validate`).
import test from 'node:test';
import assert from 'node:assert/strict';
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
