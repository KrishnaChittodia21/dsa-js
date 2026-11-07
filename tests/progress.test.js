// The progress reducer (src/state/progressReducer.js): everything the learner does, kept in localStorage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress, migrate, progressReducer, todayKey, VERSION } from '../src/state/progressReducer.js';

const run = (actions, state = initialProgress()) => actions.reduce(progressReducer, state);

test('a failed submit marks the question attempted; a passing one solves it', () => {
  const s = run([
    { type: 'Q_SUBMIT', qid: 'two-sum', allPassed: false, passed: 2, total: 5 },
    { type: 'Q_SUBMIT', qid: 'two-sum', allPassed: true, passed: 5, total: 5 },
  ]);
  const q = s.questions['two-sum'];
  assert.equal(q.status, 'solved');
  assert.equal(q.submissions, 2);
  assert.equal(q.failedSubmissions, 1);
  assert.equal(q.solvedWithoutSolution, true);
  assert.ok(q.solvedAt);
});

test('a later failed submit never un-solves a question', () => {
  const s = run([
    { type: 'Q_SUBMIT', qid: 'q', allPassed: true, passed: 1, total: 1 },
    { type: 'Q_SUBMIT', qid: 'q', allPassed: false, passed: 0, total: 1 },
  ]);
  assert.equal(s.questions.q.status, 'solved');
});

test('viewing the solution before solving is remembered', () => {
  const s = run([
    { type: 'Q_VIEW_SOLUTION', qid: 'q' },
    { type: 'Q_SUBMIT', qid: 'q', allPassed: true, passed: 1, total: 1 },
  ]);
  assert.equal(s.questions.q.solutionViewedBeforeSolve, true);
  assert.equal(s.questions.q.solvedWithoutSolution, false);
});

test('completing a lesson marks the topic and counts today as active', () => {
  const s = run([{ type: 'LESSON_COMPLETE', topicId: 'hashing' }]);
  assert.equal(s.topics.hashing.lessonCompleted, true);
  assert.equal(s.activity[todayKey()], 1);
});

test('the reducer never mutates the previous state', () => {
  const before = initialProgress();
  const frozen = JSON.stringify(before);
  run([{ type: 'Q_SUBMIT', qid: 'q', allPassed: true, passed: 1, total: 1 }], before);
  assert.equal(JSON.stringify(before), frozen);
});

test('importing an old export keeps its data and fills in newer fields', () => {
  const old = { version: 1, topics: { arrays: { lessonCompleted: true } }, questions: { q: { status: 'solved' } } };
  const s = progressReducer(initialProgress(), { type: 'IMPORT', state: old });
  assert.equal(s.topics.arrays.lessonCompleted, true);
  assert.equal(s.questions.q.status, 'solved');
  assert.deepEqual(s.achievements, {});
  assert.deepEqual(s.checkpoints, {});
});

test('reset all goes back to a fresh start', () => {
  const s = run([{ type: 'LESSON_COMPLETE', topicId: 'x' }, { type: 'RESET_ALL' }]);
  assert.deepEqual(s, initialProgress());
});

test('migrate: a v1 store gains Saved and the backup date, and keeps everything it had', () => {
  const v1 = { version: 1, topics: { arrays: { lessonCompleted: true } }, questions: { q: { status: 'solved' } }, activity: { '2026-11-01': 3 }, extra: 'kept' };
  const s = migrate(v1);
  assert.equal(s.version, VERSION);
  assert.deepEqual(s.saved, {});
  assert.equal(s.exportedAt, null);
  assert.equal(s.questions.q.status, 'solved');
  assert.equal(s.activity['2026-11-01'], 3);
  assert.equal(s.extra, 'kept');
});

test('migrate: broken or missing parts fall back to empty instead of crashing the app', () => {
  assert.deepEqual(migrate(null), initialProgress());
  assert.deepEqual(migrate('nonsense'), initialProgress());
  const s = migrate({ questions: null, topics: [], saved: 'x' });
  assert.deepEqual([s.questions, s.topics, s.saved], [{}, {}, {}]);
});

test('Save toggles an item in and out of Saved, and it survives an export/import round trip', () => {
  const item = { kind: 'question', id: 'two-sum', topicId: 'hashing', title: 'Two Sum' };
  const saved = run([{ type: 'SAVE_TOGGLE', key: 'q:two-sum', item }, { type: 'EXPORTED' }]);
  assert.equal(saved.saved['q:two-sum'].title, 'Two Sum');
  assert.ok(saved.saved['q:two-sum'].at);
  assert.ok(saved.exportedAt);
  const reimported = progressReducer(initialProgress(), { type: 'IMPORT', state: JSON.parse(JSON.stringify(saved)) });
  assert.deepEqual(reimported.saved, saved.saved);
  assert.deepEqual(run([{ type: 'SAVE_TOGGLE', key: 'q:two-sum' }], saved).saved, {});
});
