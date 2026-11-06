// "Animate my run" (M4): the recorder (src/runner/recorder.js + instrument.js) and the frame builder
// (src/visualizations/runFrames.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { recordRun, firstDivergence } from '../src/runner/recorder.js';
import { buildRunFrames, panelsFor, bigO, inputSize, historyOf } from '../src/visualizations/runFrames.js';
import { mutants } from '../src/runner/bugs.js';
import sortScene from '../src/visualizations/scenes/sort-an-array.js';
import searchScene from '../src/visualizations/scenes/binary-search.js';
import pathScene from '../src/visualizations/scenes/find-if-path-exists-in-graph.js';
import { PANEL_KINDS } from '../src/content/stepSchema.js';

const sortQ = { kind: 'function', functionName: 'sortArray', io: { params: ['array'], returns: 'array' } };
const bubble = `function sortArray(nums) {
  const n = nums.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (nums[j] > nums[j + 1]) {
        [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return nums;
}`;
// the classic off-by-one: the inner loop stops one pair early, so the last pair is never compared
const buggy = bubble.replace('j < n - 1 - i', 'j < n - 2 - i');
const sortTest = { args: [[5, 2, 4, 1, 3]], expected: [1, 2, 3, 4, 5] };

function checkFrames(frames) {
  for (const [k, f] of frames.entries()) {
    assert.ok(typeof f.note === 'string' && f.note.length, `frame ${k} has a note`);
    for (const p of f.panels) {
      assert.ok(PANEL_KINDS.includes(p.kind), `frame ${k}: panel kind ${p.kind}`);
      if (p.kind === 'array') {
        for (const i of Object.keys(p.highlights || {})) assert.ok(+i >= 0 && +i < p.values.length, `frame ${k}: highlight ${i} in range`);
        for (const ptr of p.pointers || []) assert.ok(ptr.index >= 0 && ptr.index < p.values.length, `frame ${k}: pointer ${ptr.label} in range`);
      }
      if (p.kind === 'list') assert.equal(p.next.length, p.values.length);
      if (p.kind === 'nodes') {
        const ids = new Set(p.nodes.map((n) => n.id));
        for (const n of p.nodes) assert.ok(typeof n.label === 'string' && Number.isFinite(n.x) && Number.isFinite(n.y), `frame ${k}: node ${n.id}`);
        for (const e of p.edges) assert.ok(ids.has(e.from) && ids.has(e.to), `frame ${k}: edge ${e.from}→${e.to}`);
      }
      if (p.kind === 'table') assert.equal(p.cells.length, p.rowLabels.length);
    }
  }
}

test('a correct bubble sort: passes, every swap is a step, frames end on the sorted array', () => {
  const run = recordRun(bubble, sortQ, sortTest);
  assert.equal(run.passed, true);
  const states = run.steps.map((s) => JSON.stringify(s.vars.nums));
  assert.equal(states[0], '[5,2,4,1,3]');
  assert.ok(states.includes('[2,5,4,1,3]'), 'the first swap is recorded');
  const frames = buildRunFrames(run, bubble);
  checkFrames(frames);
  assert.match(frames.at(-1).note, /correct/);
  assert.deepEqual(frames.at(-1).panels.find((p) => p.label === 'nums').values, [1, 2, 3, 4, 5]);
  // step lines point at real statements of the user's code (instrumenting adds no lines)
  const lines = bubble.split('\n');
  for (const s of run.steps) assert.ok(lines[s.line - 1].trim().length > 0, `line ${s.line} is code`);
  // a swap frame highlights exactly the two swapped cells and points i, j at the array
  const swap = frames.find((f) => /nums\[0\] = 2/.test(f.note));
  const nums = swap.panels.find((p) => p.label === 'nums');
  assert.deepEqual(Object.keys(nums.highlights), ['0', '1']);
  assert.deepEqual(nums.pointers.map((p) => p.label), ['i', 'j']);
});

test('a buggy bubble sort: fails, and the first wrong step is found against the reference run', () => {
  const ref = recordRun(bubble, sortQ, sortTest);
  const run = recordRun(buggy, sortQ, sortTest);
  assert.equal(run.passed, false);
  assert.match(buildRunFrames(run, buggy).at(-1).note, /not the expected answer/);
  assert.equal(firstDivergence(ref.steps, ref.steps, 'nums'), -1);
  const at = firstDivergence(run.steps, ref.steps, 'nums');
  assert.ok(at >= 0, 'a divergence is found');
  // up to that step the two runs agree on every distinct state of nums, and at it they differ
  const distinct = (steps) => steps.map((s) => JSON.stringify(s.vars.nums)).filter((v, i, a) => v && v !== a[i - 1]);
  const mine = distinct(run.steps.slice(0, at + 1));
  assert.deepEqual(mine.slice(0, -1), distinct(ref.steps).slice(0, mine.length - 1));
  assert.notEqual(mine.at(-1), distinct(ref.steps)[mine.length - 1]);
});

test('a runaway loop is stopped by the recorder, keeping its steps; long runs are sampled but end on the final state', () => {
  const q = { kind: 'function', functionName: 'f', io: {} };
  const stuck = recordRun('function f(n) { let c = 0; while (true) { c++; } }', q, { args: [1], expected: 0 });
  assert.equal(stuck.passed, false);
  assert.match(stuck.error, /Stopped after/);
  assert.ok(stuck.steps.length > 0 && stuck.steps.length <= 2000);
  const long = recordRun('function f(n) { let c = 0; for (let i = 0; i < n; i++) c++; return c; }', q, { args: [100000], expected: 100000 });
  assert.equal(long.passed, true);
  assert.ok(long.truncated && long.steps.length <= 2000);
  assert.equal(long.steps.at(-1).vars.c, 100000);
});

test('linked lists and maps become panels; braces-less bodies and nested helpers still run', () => {
  const q = { kind: 'function', functionName: 'f', io: { params: ['list'], returns: 'list' } };
  const code = `function f(head) {
  const seen = new Map();
  let prev = null, cur = head;
  while (cur) { const nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; seen.set(prev.val, true) }
  const bump = (x) => { const y = x + 1; return y };
  if (bump(1) === 2) return prev; else return null;
}`;
  const run = recordRun(code, q, { args: [[1, 2, 3]], expected: [3, 2, 1] });
  assert.equal(run.passed, true, run.error);
  const frames = buildRunFrames(run, code);
  checkFrames(frames);
  assert.ok(frames.some((f) => f.panels.some((p) => p.kind === 'list' && p.label === 'prev' && p.values.join() === '3,2,1')));
  assert.ok(frames.some((f) => f.panels.some((p) => p.kind === 'table' && p.label === 'seen (map)' && p.rowLabels.join() === '1,2,3')));
});

test('every reference solution still passes when recorded (its smallest test)', async () => {
  const root = path.resolve('src/content/topics');
  let n = 0;
  for (const t of fs.readdirSync(root)) {
    const dir = path.join(root, t, 'questions');
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const q = (await import(pathToFileURL(path.join(dir, f)).href)).default;
      const small = (q.tests || []).filter((x) => !x.argsGen && !x.opsGen).sort((a, b) => JSON.stringify(a).length - JSON.stringify(b).length)[0];
      if (!q.solution?.code || !small) continue;
      const run = recordRun(q.solution.code, q, small);
      assert.equal(run.passed, true, `${q.id}: ${run.compileError || run.error || run.outputText}`);
      assert.ok(run.steps.length > 0, `${q.id}: no steps recorded`);
      checkFrames(buildRunFrames(run, q.solution.code, {}, q.paramNames)); // every renderer copes with every reference
      n++;
    }
  }
  assert.ok(n > 400, `checked ${n} questions`);
});

const loadQ = async (topic, id) => (await import(pathToFileURL(path.resolve(`src/content/topics/${topic}/questions/${id}.js`)).href)).default;

test('trees, heaps, graphs, union-find forests and DP tables get their own panels', () => {
  const treeQ = { kind: 'function', functionName: 'f', io: { params: ['tree'], returns: 'number' } };
  const treeCode = `function f(root) {
  let cur = root;
  let depth = 0;
  while (cur) { cur = cur.left; depth++; }
  return depth;
}`;
  const tr = recordRun(treeCode, treeQ, { args: [[4, 2, 6, 1, 3]], expected: 3 });
  assert.equal(tr.passed, true, tr.error);
  const tf = buildRunFrames(tr, treeCode);
  checkFrames(tf);
  const tagged = tf.flatMap((f) => f.panels).find((p) => p.kind === 'nodes' && p.label === 'root' && p.nodes.some((n) => n.tag === 'cur' && n.label === '2'));
  assert.ok(tagged, 'cur is drawn as a tag on node 2 of the root tree');

  const heap = panelsFor({ heap: { $obj: { heap: [1, 3, 2, 7] } } });
  assert.equal(heap[0].kind, 'nodes');
  assert.equal(heap[0].edges.length, 3);

  const g = panelsFor({ adj: [[1, 2], [0], [0]], visited: [1, 1, 0], u: 0, v: 2 });
  assert.equal(g[0].kind, 'nodes');
  assert.equal(g[0].directed, false);
  assert.deepEqual(g[0].nodes.map((n) => n.state), ['active', 'visited', 'done']);
  assert.equal(g[0].edges.find((e) => e.state === 'active').to, 2);

  const uf = panelsFor({ parent: [0, 0, 1, 3] });
  assert.equal(uf[0].kind, 'nodes');
  assert.equal(uf[0].edges.length, 2, '1→0 and 2→1');
  assert.equal(panelsFor({ parent: [1, 0, 2] })[0].kind, 'array', 'a 2-cycle (a bug) has no root: drawn as a row');

  const dp = panelsFor({ dp: [[0, 1], [1, 2]] }, { dp: [[0, 1], [1, 0]] });
  assert.equal(dp[0].kind, 'table');
  assert.equal(dp[0].states[1][1], 'active');
});

test('design classes: an operation timeline and one panel per field of this', async () => {
  const q = await loadQ('linked-list', 'lru-cache').catch(() => null);
  const lru = q || (await loadQ('hashing', 'lru-cache'));
  const run = recordRun(lru.solution.code, lru, lru.tests[0]);
  assert.equal(run.passed, true, run.error);
  assert.equal(run.ops[0].name, 'LRUCache');
  const frames = buildRunFrames(run, lru.solution.code, {}, lru.paramNames);
  checkFrames(frames);
  assert.ok(frames.some((f) => /^op 2 · put\(/.test(f.note)), 'notes name the operation');
  assert.ok(frames.some((f) => f.panels[0].label?.startsWith('operations (')), 'the op timeline is the first panel');
  assert.ok(frames.at(-1).panels.some((p) => p.label === 'returned by each operation'));
});

test('kit: big-O curves, input size, value history', () => {
  assert.equal(bigO('O(n log n)')(16), 64);
  assert.equal(bigO('O(log n)')(1024), 10);
  assert.equal(bigO('O(n^2)')(5), 25);
  assert.equal(bigO('O(n + m)')(10), 20);
  assert.equal(bigO('O(V + E)')(3), 6);
  assert.equal(bigO('O(1)')(99), 1);
  assert.equal(bigO('O(m · n)')(4), 16);
  assert.equal(bigO('nonsense'), null);
  assert.equal(inputSize([[1, 2, 3], 9]), 3);
  assert.equal(inputSize([7]), 7);
  assert.equal(inputSize([[[1, 2], [3, 4]]]), 4);
  const run = recordRun(bubble, sortQ, sortTest);
  const h = historyOf(run.steps, 'nums');
  assert.equal(h[0].value, '[5,2,4,1,3]');
  assert.equal(h.at(-1).value, '[1,2,3,4,5]');
});

test('break it: an injected bug makes a working solution fail', () => {
  const ms = mutants(bubble, sortScene.bugs);
  assert.equal(ms[0].label, 'Inner loop stops one pair early');
  assert.ok(ms.every((m) => m.code !== bubble && m.line >= 1));
  assert.ok(ms.some((m) => !recordRun(m.code, sortQ, sortTest).passed));
});

test('gold scenes: narration, predictions and their bugs on the reference solutions', async () => {
  const cases = [
    [sortScene, await loadQ('sorting', 'sort-an-array'), bubble.replace('sortArray(nums)', 'sortArray(nums)')],
    [searchScene, await loadQ('binary-search', 'binary-search')],
    [pathScene, await loadQ('graphs', 'find-if-path-exists-in-graph')],
  ];
  for (const [scene, q, userCode] of cases) {
    assert.equal(scene.id, q.id);
    const code = userCode || q.solution.code;
    let told = 0;
    let asked = 0;
    for (const t of q.tests.filter((x) => !x.argsGen).slice(0, 3)) {
      const run = recordRun(code, q, t);
      assert.equal(run.passed, true, `${q.id}: ${run.error}`);
      const frames = buildRunFrames(run, code, scene, q.paramNames);
      checkFrames(frames);
      told += frames.filter((f) => !/`/.test(f.note.split(': ').slice(1).join(': '))).length;
      for (const f of frames.filter((x) => x.predict)) {
        asked++;
        assert.ok(f.predict.answer >= 0 && f.predict.answer < f.predict.options.length, `${q.id}: predict answer in range`);
      }
    }
    assert.ok(told > 0, `${q.id}: the scene narrates`);
    assert.ok(asked > 0, `${q.id}: the scene asks a prediction`);
    const failing = mutants(code, scene.bugs).filter((m) => q.tests.filter((x) => !x.argsGen).some((t) => !recordRun(m.code, q, t).passed));
    assert.ok(failing.length > 0, `${q.id}: at least one injected bug fails a test`);
  }
});

test('node-and-neighbours graphs (Clone Graph) are drawn as one graph, steady from step to step', async () => {
  const q = (await import(pathToFileURL(path.resolve('src/content/topics/graphs/questions/clone-graph.js')).href)).default;
  const run = recordRun(q.solution.code, q, q.tests[0]);
  assert.equal(run.passed, true);
  const g = run.steps[0].vars.node.$graph;
  assert.deepEqual(g.nodes.map((n) => n.val), [1, 2, 4, 3]); // breadth first from node 1
  assert.deepEqual(g.nodes[0].nb, [1, 2]);
  const seats = (k) => {
    const p = panelsFor(run.steps[k].vars).find((x) => x.kind === 'nodes' && x.edges.length === 4);
    return Object.fromEntries(p.nodes.map((n) => [n.label, `${n.x.toFixed(2)},${n.y.toFixed(2)}`]));
  };
  const last = run.steps.length - 1;
  assert.deepEqual(seats(5), seats(last - 2)); // the original graph keeps its layout while the search moves around it
});
