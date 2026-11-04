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
