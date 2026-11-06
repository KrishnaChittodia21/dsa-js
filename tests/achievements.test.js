// Achievement rules (src/content/achievements.js): tiers fire at their threshold, not one below, and only once.
import test from 'node:test';
import assert from 'node:assert/strict';
import { achievementById, evaluateAchievement, newlyEarned, ACHIEVEMENTS } from '../src/content/achievements.js';

const lessons = (n) => ({ topics: Object.fromEntries(Array.from({ length: n }, (_, i) => [`t${i}`, { lessonCompleted: true }])), questions: {} });
const tierAt = (id, p) => evaluateAchievement(achievementById[id], p, {}).tier;

test('Bookworm tiers fire exactly at their thresholds', () => {
  assert.equal(tierAt('bookworm', lessons(0)), null);
  assert.equal(tierAt('bookworm', lessons(1)), 'bronze');
  assert.equal(tierAt('bookworm', lessons(7)), 'bronze');
  assert.equal(tierAt('bookworm', lessons(8)), 'silver');
  assert.equal(tierAt('bookworm', lessons(32)), 'diamond');
});

test('Hello World needs one solved question; attempted does not count', () => {
  assert.equal(tierAt('hello-world', { topics: {}, questions: { q: { status: 'attempted' } } }), null);
  assert.equal(tierAt('hello-world', { topics: {}, questions: { q: { status: 'solved' } } }), 'standard');
});

test('newlyEarned awards only tiers not stored yet, and never twice', () => {
  const evals = { bookworm: evaluateAchievement(achievementById.bookworm, lessons(8), {}) };
  assert.deepEqual(newlyEarned(evals, {}), [{ id: 'bookworm', tier: 'silver', tiers: ['bronze', 'silver'] }]);
  assert.deepEqual(newlyEarned(evals, { bookworm: { tier: 'bronze' } }), [{ id: 'bookworm', tier: 'silver', tiers: ['silver'] }]);
  assert.deepEqual(newlyEarned(evals, { bookworm: { tier: 'silver' } }), []);
});

test('every achievement has a unique id and a measure', () => {
  const ids = ACHIEVEMENTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const a of ACHIEVEMENTS) assert.equal(typeof a.measure, 'function', a.id);
});

// ---- M10: round two (fire at the threshold, not one below) ----
import { progressReducer, initialProgress } from '../src/state/progressReducer.js';

const days = (n, start = '2026-10-01') =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [new Date(new Date(`${start}T00:00:00`).getTime() + i * 864e5).toLocaleDateString('sv'), 1]));

test('Polyglot needs one question solved in JS, Java and C++; two languages are not enough', () => {
  const p = (langs) => ({ questions: { a: { status: 'solved', solvedLangs: langs } } });
  assert.equal(tierAt('polyglot', p(['js', 'java'])), null);
  assert.equal(tierAt('polyglot', p(['js', 'java', 'cpp'])), 'bronze');
});

test('Submit records the language; an older solve counts as JS', () => {
  let s = initialProgress();
  s.questions.a = { status: 'solved' }; // solved before languages were recorded
  s = progressReducer(s, { type: 'Q_SUBMIT', qid: 'a', passed: 3, total: 3, allPassed: true, lang: 'java' });
  s = progressReducer(s, { type: 'Q_SUBMIT', qid: 'a', passed: 1, total: 3, allPassed: false, lang: 'cpp' });
  assert.deepEqual(s.questions.a.solvedLangs, ['js', 'java']); // a failing C++ submit adds nothing
  s = progressReducer(s, { type: 'Q_SUBMIT', qid: 'a', passed: 3, total: 3, allPassed: true, lang: 'cpp' });
  assert.equal(tierAt('polyglot', s), 'bronze');
});

test('Daily Short and Hands-on Streak count consecutive days: 3 in a row, not 2 or a gap', () => {
  assert.equal(tierAt('shorts-streak', { shortDays: days(2) }), null);
  assert.equal(tierAt('shorts-streak', { shortDays: days(3) }), 'bronze');
  assert.equal(tierAt('step-streak', { stepDays: { '2026-10-01': 1, '2026-10-02': 1, '2026-10-04': 1 } }), null);
  assert.equal(tierAt('step-streak', { stepDays: days(7) }), 'silver');
});

test('Collector fires at 5 saved items, not 4', () => {
  const saved = (n) => ({ saved: Object.fromEntries(Array.from({ length: n }, (_, i) => [`q:${i}`, {}])) });
  assert.equal(tierAt('collector', saved(4)), null);
  assert.equal(tierAt('collector', saved(5)), 'bronze');
});

test('Animate: a passing run earns Lights, Camera, Pass; a fix needs a divergence on that same test first', () => {
  let s = initialProgress();
  s = progressReducer(s, { type: 'ANIMATE_RUN', key: 'q|0', passed: false });
  assert.equal(tierAt('animated', s), null);
  s = progressReducer(s, { type: 'ANIMATE_RUN', key: 'q|1', passed: true }); // passed, but never diverged
  assert.equal(tierAt('animated', s), 'standard');
  assert.equal(tierAt('divergence-fixed', s), null);
  s = progressReducer(s, { type: 'ANIMATE_DIVERGED', key: 'q|0' });
  s = progressReducer(s, { type: 'ANIMATE_RUN', key: 'q|0', passed: true });
  assert.equal(tierAt('divergence-fixed', s), 'standard');
  s = progressReducer(s, { type: 'ANIMATE_RUN', key: 'q|0', passed: true }); // a second pass is not a second fix
  assert.equal(s.animate.fixed, 1);
});

test('step tasks and Shorts record their day', () => {
  let s = progressReducer(initialProgress(), { type: 'STEP_TASK' });
  s = progressReducer(s, { type: 'SHORT_DONE', id: 'x', correct: true });
  assert.equal(Object.values(s.stepDays)[0], 1);
  assert.equal(Object.values(s.shortDays)[0], 1);
});
