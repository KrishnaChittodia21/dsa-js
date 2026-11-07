// M9: Shorts — the order and daily suggestion (src/lib/shortsOrder.js), the format (src/content/shortSchema.js) and progress.
// Every real Short file is also checked by scripts/validate-content.mjs (npm run check).
import test from 'node:test';
import assert from 'node:assert/strict';
import { orderShorts, shortOfTheDay, shortLength } from '../src/lib/shortsOrder.js';
import { validateShort } from '../src/content/shortSchema.js';
import { progressReducer, initialProgress } from '../src/state/progressReducer.js';

const patterns = ['a', 'b', 'c', 'd'].map((id) => ({ id, topicId: 't', name: id.toUpperCase() }));
const byId = { a: { id: 'a', title: 'A' }, c: { id: 'c', title: 'C' }, d: { id: 'd', title: 'D' } };

test('Shorts follow the course order; the daily suggestion moves with study days', () => {
  const shorts = orderShorts(patterns, byId);
  assert.deepEqual(shorts.map((s) => [s.id, s.n]), [['a', 1], ['c', 2], ['d', 3]]); // b has no Short yet
  assert.equal(shortOfTheDay(shorts, { activity: {} }).id, 'a');
  const twoDays = { activity: { '2026-11-01': 3, '2026-11-02': 1 } };
  assert.equal(shortOfTheDay(shorts, twoDays).id, 'c');
  assert.equal(shortOfTheDay(shorts, { ...twoDays, shorts: { c: { correct: true } } }).id, 'd');
  assert.equal(shortOfTheDay(shorts, { ...twoDays, shorts: { c: {}, d: {} } }).id, 'a'); // wraps round
  assert.equal(shortOfTheDay(shorts, { ...twoDays, shorts: { a: {}, c: {}, d: {} } }).id, 'c'); // all done → today's
  assert.equal(shortOfTheDay([], twoDays), null);
});

test('a Short must end in one choose question and stay short', () => {
  const frame = { note: 'e.g. one frame', panels: [{ kind: 'array', values: [1, 2] }] };
  const watch = { kind: 'watch', title: 'Watch', lines: ['a line'], frames: [frame] };
  const turn = { kind: 'turn', title: 'Q', lines: ['a line'], panels: [frame.panels[0]], task: { type: 'choose', question: 'Which?', options: [{ text: 'right' }, { text: 'wrong', why: 'because' }], answer: 0 }, solved: 'ok' };
  assert.deepEqual(validateShort({ id: 'a', title: 'A', steps: [watch, turn] }, ['a']), []);
  assert.match(validateShort({ id: 'a', title: 'A', steps: [watch, watch] }, ['a']).join(), /last step must be a turn/);
  assert.match(validateShort({ id: 'z', title: 'Z', steps: [watch, turn] }, ['a']).join(), /not a pattern of this topic/);
  const long = { ...watch, frames: Array(15).fill(frame) };
  assert.match(validateShort({ id: 'a', title: 'A', steps: [long, turn] }, ['a']).join(), /more than two minutes/);
});

test('answering a Short records it; right first time stays right', () => {
  let s = progressReducer(initialProgress(), { type: 'SHORT_DONE', id: 'a', correct: true });
  assert.equal(s.shorts.a.correct, true);
  assert.equal(Object.keys(s.activity).length, 1); // it counts as a study day
  s = progressReducer(s, { type: 'SHORT_DONE', id: 'a', correct: false });
  assert.equal(s.shorts.a.correct, true);
});

test('a Short shows its length at the reading speed (last frame of a step 1.6×, the question 15 s)', () => {
  const watch = { kind: 'watch', frames: [{}, {}] };
  const turn = { kind: 'turn', then: [{}] };
  // (2 + 0.6) × 2 s + (1 + 0.6) × 2 s + 15 s = 23.4 s
  assert.equal(shortLength({ steps: [watch, turn] }, 2000), '0:23');
  assert.equal(shortLength({ steps: [watch, turn] }, 6000), '0:40');
});
