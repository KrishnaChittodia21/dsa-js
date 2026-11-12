// Where did I go wrong · Measure my growth · Ghost of past me: src/runner/growth.js and src/lib/attempts.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { divergence, fitClass, makeArgs, measurable, measure, rng, shrink } from '../src/runner/growth.js';
import { recordRun } from '../src/runner/recorder.js';
import { runnableQuestion } from '../src/runner/runInWorker.js';
import { addAttempt, loadAttempts, MAX_ATTEMPTS } from '../src/lib/attempts.js';
import stock from '../src/content/topics/arrays/questions/best-time-to-buy-and-sell-stock.js';
import dup from '../src/content/topics/hashing/questions/contains-duplicate.js';
import insert from '../src/content/topics/binary-search/questions/search-insert-position.js';

// what jobInWorker sends to the worker
const Q = (q) => ({ ...runnableQuestion(q), paramTypes: q.paramTypes, paramNames: q.paramNames, solution: { code: q.solution.code } });

const minAtZero = `function maxProfit(prices) {
  let minSoFar = 0;
  let best = 0;
  for (const price of prices) {
    best = Math.max(best, price - minSoFar);
    minSoFar = Math.min(minSoFar, price);
  }
  return best;
}`;
const everyPair = `function maxProfit(prices) {
  let best = 0;
  for (let i = 0; i < prices.length; i++)
    for (let j = i + 1; j < prices.length; j++)
      best = Math.max(best, prices[j] - prices[i]);
  return best;
}`;

test('shrink keeps only a still-failing input; the divergence names the variable and the line', () => {
  const r = shrink({ code: minAtZero, refCode: stock.solution.code, question: Q(stock), args: [[7, 1, 5, 3, 6, 4]] });
  assert.ok(r.args[0].length < 6);
  assert.ok(r.log.length >= 2);
  const last = r.log[r.log.length - 1];
  assert.notEqual(last.got, last.want);
  const small = { args: r.args, expected: last.want };
  const d = divergence(recordRun(minAtZero, Q(stock), small).steps, recordRun(stock.solution.code, Q(stock), small).steps);
  assert.deepEqual([d.name, d.line, d.mine, d.want], ['minSoFar', 2, 0, Infinity]);
});

test('shrink says so when the code is right on that input', () => {
  const r = shrink({ code: stock.solution.code, refCode: stock.solution.code, question: Q(stock), args: [[7, 1, 5]] });
  assert.match(r.note, /matches the reference/);
});

test('a run whose variables follow the reference has no divergence', () => {
  const t = insert.tests[0];
  const steps = recordRun(insert.solution.code, Q(insert), t).steps;
  assert.equal(divergence(steps, steps), null);
});

test('measure + fit: every pair is n² time / O(1) space; a Set is n time / n space', () => {
  const sizes = [8, 16, 32, 64, 128, 256, 512];
  const m = measure({ code: everyPair, question: Q(stock), sizes });
  assert.equal(fitClass(m.points, 'calls').name, 'n²');
  assert.equal(fitClass(m.points, 'space').name, '1');
  assert.ok(m.points.at(-1).hot[0][1] > 0.9, 'the inner loop line does nearly all the work');
  const s = measure({ code: dup.solution.code, question: Q(dup), sizes });
  assert.equal(fitClass(s.points, 'calls').name, 'n');
  assert.equal(fitClass(s.points, 'space').name, 'n');
});

test('measure stops at the step cap and reports where', () => {
  const m = measure({ code: everyPair, question: Q(stock), sizes: [8, 64, 1024], cap: 50_000 });
  assert.equal(m.stoppedAt, 1024);
  assert.match(m.reason, /steps at n = 1,024/);
});

test('fitClass names the usual classes', () => {
  const pts = (f) => [8, 16, 32, 64, 128, 256, 512, 1024].map((n) => ({ n, calls: f(n) }));
  assert.equal(fitClass(pts((n) => 4 * Math.ceil(Math.log2(n)) + 3), 'calls').name, 'log n');
  assert.equal(fitClass(pts((n) => 3 * n * Math.log2(n)), 'calls').name, 'n log n');
  assert.equal(fitClass(pts(() => 7), 'calls').name, '1');
});

test('inputs from paramTypes: sizes, edge lists vs grids, ints as the size when nothing else is', () => {
  const r = rng(1);
  const [prices] = makeArgs({ paramTypes: ['int[]'] }, 50, r);
  assert.equal(prices.length, 50);
  const [n, edges] = makeArgs({ paramTypes: ['int', 'int[][]'], paramNames: ['n', 'edges'] }, 30, r);
  assert.equal(n, 30);
  assert.ok(edges.every(([u, v]) => u >= 0 && u < 30 && v >= 0 && v < 30 && u !== v));
  const [grid] = makeArgs({ paramTypes: ['int[][]'], paramNames: ['grid'] }, 64, r);
  assert.equal(grid.length, 8);
  assert.deepEqual(makeArgs({ paramTypes: ['int'], paramNames: ['n'] }, 100, r), [100]);
  assert.equal(measurable(stock), true);
  assert.equal(measurable({ kind: 'design', paramTypes: ['int'], solution: { code: 'x' } }), false);
});

test('attempts keep the last 5 per question; resubmitting the same code updates it', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  let list = [];
  for (let i = 0; i < 7; i++) list = addAttempt('q', { code: `v${i}`, at: `2026-11-0${i + 1}`, passed: i, total: 9 });
  assert.equal(list.length, MAX_ATTEMPTS);
  assert.equal(list[0].code, 'v2');
  list = addAttempt('q', { code: 'v6', at: '2026-11-12', passed: 9, total: 9 });
  assert.equal(list.length, MAX_ATTEMPTS);
  assert.equal(list.at(-1).passed, 9);
  assert.deepEqual(loadAttempts('q'), list);
  assert.deepEqual(loadAttempts('other'), []);
  delete globalThis.localStorage;
});
