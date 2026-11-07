// Plan your journey maths (src/lib/pace.js): goal minutes, finish dates, the pacer and catch-up advice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { computePace, goalTarget, newPlan, parseGoal, rebase, studyDaysBetween } from '../src/lib/pace.js';

const T = (id, estMinutes) => ({ id, estMinutes });
const stages = [
  { id: 'a', title: 'A', topics: [T('a1', 60), T('a2', 60)] },
  { id: 'b', title: 'B', topics: [T('b1', 120)] },
];
const topics = stages.flatMap((s) => s.topics);
const none = () => 0;

test('goal: all, one stage, and an unknown pick falls back to the whole course', () => {
  assert.deepEqual(parseGoal(''), ['all']);
  assert.equal(goalTarget('all', stages, none).minutes, 240);
  const b = goalTarget('stage:b', stages, none);
  assert.equal(b.minutes, 120);
  assert.equal(b.label, 'Finish stage 2: B');
  assert.equal(goalTarget('stage:zzz', stages, none).minutes, 240);
});

test('study days run Monday onwards (2026-11-02 is a Monday)', () => {
  assert.equal(studyDaysBetween('2026-11-02', '2026-11-09', 5), 5);
  assert.equal(studyDaysBetween('2026-11-02', '2026-11-09', 7), 7);
});

test('finish date: 240 min at 60 min/day, Mon–Fri, from Monday is Thursday; stages get their own dates', () => {
  const plan = { ...newPlan(0, '2026-11-02'), dailyMinutes: 60 };
  const p = computePace(plan, { stages, topics, completion: none }, '2026-11-02');
  assert.equal(p.finish, '2026-11-05');
  assert.deepEqual(p.dates, ['2026-11-03', '2026-11-05']);
  assert.equal(p.state, 'on');
});

test('behind the pacer after missed days, with catch-up advice; moving the date clears the gap', () => {
  const plan = { ...newPlan(0, '2026-11-02'), dailyMinutes: 30 };
  const p = computePace(plan, { stages, topics, completion: none }, '2026-11-05');
  assert.equal(p.gap, 90);
  assert.equal(p.state, 'behind');
  assert.ok(p.catchUpPerDay >= 5);
  const moved = computePace(rebase(plan, 0, '2026-11-05'), { stages, topics, completion: none }, '2026-11-05');
  assert.equal(moved.state, 'on');
});

test('a covered stage is done and the goal can be reached', () => {
  const plan = newPlan(0, '2026-11-02');
  const p = computePace({ ...plan, goal: 'stage:a' }, { stages, topics, completion: (t) => (t.id.startsWith('a') ? 1 : 0) }, '2026-11-02');
  assert.equal(p.state, 'done');
  assert.equal(p.finish, null);
  assert.deepEqual(p.dates, [null]);
});
