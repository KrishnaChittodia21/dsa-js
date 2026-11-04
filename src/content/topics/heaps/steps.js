// Step lessons for Heaps (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every heap array, sift-up / sift-down swap, popped value and median below comes from running the lesson's own
// push / pop logic (parent (i - 1) >> 1, children 2i + 1 and 2i + 2) on the example input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const pad = (vals, n) => [...vals, ...Array(n - vals.length).fill('·')];
// a table that reveals its answers row by row: k = row being revealed now
const reveal = (rows, col, k) => table(rows.map((r) => r[0]), [col], rows.map((r, i) => [i <= k ? r[1] : '?']), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']));
const check = (cond, msg) => {
  if (!cond) throw new Error(`heaps steps: ${msg}`);
};
// `then` frames of a turn: drop links to the watch step's lines
const noSay = (frames) => frames.map(({ say, ...f }) => f);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- the heap: the lesson's push / pop, with a comparator (negative = a comes out first) ----------
const MIN = (a, b) => a - b;
const MAX = (a, b) => b - a;
function hpush(a, x, cmp = MIN) {
  a.push(x);
  let i = a.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (cmp(a[i], a[p]) >= 0) break;
    [a[i], a[p]] = [a[p], a[i]];
    i = p;
  }
  return a;
}
function hpop(a, cmp = MIN) {
  if (a.length === 0) return undefined;
  const top = a[0];
  const last = a.pop();
  if (a.length > 0) {
    a[0] = last;
    siftDown(a, 0, cmp);
  }
  return top;
}
// sift down; onStep(kind, i, j) reports each decision ('swap' i↔j, 'stop' at i with best child j or -1)
function siftDown(a, i, cmp, onStep = () => {}) {
  while (true) {
    const l = 2 * i + 1,
      r = l + 1;
    let best = i;
    if (l < a.length && cmp(a[l], a[best]) < 0) best = l;
    if (r < a.length && cmp(a[r], a[best]) < 0) best = r;
    if (best === i) {
      // the child that was compared, for the note: the better of the two (or -1 for a leaf)
      const c = l >= a.length ? -1 : r < a.length && cmp(a[r], a[l]) < 0 ? r : l;
      onStep('stop', i, c);
      return;
    }
    const before = a[i];
    [a[i], a[best]] = [a[best], a[i]];
    onStep('swap', i, best, before);
    i = best;
  }
}
const build = (vals, cmp = MIN) => vals.reduce((a, x) => hpush(a, x, cmp), []);

// ---------- pictures: the tree and its backing array side by side ----------
const lvl = (i) => Math.floor(Math.log2(i + 1));
/** Nodes panel for a heap array. Layout is fixed by `cap` (the most nodes this picture sequence will hold). */
function heapTree(a, st = {}, { cap = a.length, label, path = [], show = String } = {}) {
  const D = lvl(Math.max(cap, 1) - 1);
  const nodes = a.map((v, i) => {
    const d = lvl(i);
    const s = st[i];
    return { id: `h${i}`, label: String(show(v)), x: (i - (2 ** d - 1) + 0.5) * 2 ** (D - d), y: d, ...(s ? { state: s } : {}) };
  });
  const edges = a.slice(1).map((_, k) => {
    const i = k + 1;
    const p = (i - 1) >> 1;
    return { from: `h${p}`, to: `h${i}`, ...(path.includes(i) && path.includes(p) ? { state: 'active' } : {}) };
  });
  return { kind: 'nodes', ...(label ? { label } : {}), nodes, edges };
}
const heapArr = (a, st = {}, { label = 'heap array', show = String, pointers } = {}) => arr(a.map((v) => show(v)), { label, highlights: { ...st }, ...(pointers ? { pointers } : {}) });
const pic = (a, st = {}, o = {}) => [heapTree(a, st, o), heapArr(a, st, o)];

const words = (cmp) => (cmp === MAX ? { lt: '>', ge: '≤', kid: 'Larger', top: 'maximum' } : { lt: '<', ge: '≥', kid: 'Smaller', top: 'minimum' });

/** push(x) with one frame per append / swap / stop. say = [append, swap, stop] line indices. */
function pushFrames(a, x, cmp = MIN, { say = [0, 1, 1], cap, show = String, extra = () => [] } = {}) {
  const w = words(cmp);
  const P = (st, path = []) => [...pic(a, st, { cap: cap ?? a.length, show, path }), ...extra(a)];
  const frames = [];
  let swaps = 0;
  a.push(x);
  let i = a.length - 1;
  frames.push({ say: say[0], note: `Append ${show(x)} at index ${i}: the next free leaf.`, panels: P({ [i]: 'active' }) });
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (cmp(a[i], a[p]) >= 0) {
      frames.push({ say: say[2], note: `${show(a[i])} ${w.ge} parent ${show(a[p])} (index ${p}): stop.`, panels: P({ [i]: 'done', [p]: 'visited' }, [i, p]) });
      return { frames, swaps, at: i };
    }
    const pv = a[p];
    [a[i], a[p]] = [a[p], a[i]];
    swaps++;
    frames.push({ say: say[1], note: `${show(x)} ${w.lt} parent ${show(pv)}: swap index ${i} ↔ ${p}.`, panels: P({ [p]: 'active', [i]: 'visited' }, [i, p]) });
    i = p;
  }
  frames.push({ say: say[2], note: swaps ? `${show(x)} reached the root: stop.` : 'Index 0 is the root: nothing to compare.', panels: P({ 0: 'done' }) });
  return { frames, swaps, at: 0 };
}

/** pop() with one frame per step. say = [save top, move last, sift] line indices. */
function popFrames(a, cmp = MIN, { say = [0, 1, 2], cap, show = String, extra = () => [] } = {}) {
  const w = words(cmp);
  const P = (st, path = [], top) => [...pic(a, st, { cap: cap ?? a.length, show, path }), ...extra(a, top)];
  const frames = [];
  const top = a[0];
  frames.push({ say: say[0], note: `top = heap[0] = ${show(top)}, the ${w.top}.`, panels: P({ 0: 'active' }) });
  const last = a.pop();
  let swaps = 0;
  if (a.length === 0) {
    frames.push({ say: say[1], note: 'That was the only element: the heap is now empty.', panels: P({}, [], top) });
    return { frames, top, swaps };
  }
  a[0] = last;
  frames.push({ say: say[1], note: `Move the last element (${show(last)}) to the root.`, panels: P({ 0: 'active' }, [], top) });
  siftDown(a, 0, cmp, (kind, i, j) => {
    if (kind === 'swap') {
      swaps++;
      frames.push({ say: say[2], note: `${w.kid} child ${show(a[i])} ${w.lt} ${show(a[j])}: swap index ${i} ↔ ${j}.`, panels: P({ [j]: 'active', [i]: 'visited' }, [i, j], top) });
    } else if (j < 0) frames.push({ say: say[2], note: `${show(a[i])} has no children: stop.`, panels: P({ [i]: 'done' }, [], top) });
    else frames.push({ say: say[2], note: `${w.kid} child ${show(a[j])} ${w.ge} ${show(a[i])}: stop.`, panels: P({ [i]: 'done', [j]: 'visited' }, [i, j], top) });
  });
  return { frames, top, swaps };
}

// ---------- the lesson's example heap ("What is it?") ----------
const H0 = [1, 3, 2, 7, 4, 5, 8];
const isMinHeap = (a) => a.every((v, i) => i === 0 || a[(i - 1) >> 1] <= v);
check(isMinHeap(H0), 'H0 should be a min-heap');

// ---------- what ----------
const levelOf = (k) => hl(7, (i) => (lvl(i) === k ? 'active' : lvl(i) < k ? 'done' : ''));
const parentAt = (p) => {
  const kids = [2 * p + 1, 2 * p + 2].filter((c) => c < H0.length);
  const st = { [p]: 'active', ...Object.fromEntries(kids.map((c) => [c, 'done'])) };
  return { st, path: [p, ...kids], note: `${H0[p]} ≤ ${kids.map((c) => H0[c]).join(' and ')}: holds.` };
};
const whatFrames = [
  ...[1, 3, 7].map((n, k) => ({
    say: 1,
    note: ['Level 0: the root.', 'Level 1: full, two nodes.', 'Level 2: fills left to right. No gaps.'][k],
    panels: [heapTree(H0.slice(0, n), {}, { cap: 7 }), heapArr(H0, levelOf(k))],
  })),
  ...[0, 1, 2].map((p) => {
    const { st, path, note } = parentAt(p);
    return { say: 2, note: `Parent ${note}`, panels: pic(H0, st, { path }) };
  }),
  { say: 3, note: '3 is on the left though 2 is smaller. Siblings are not ordered: still a heap.', panels: pic(H0, { 1: 'window', 2: 'window' }) },
  { say: 0, note: 'Both rules hold, so the root, 1, is the minimum.', panels: pic(H0, { 0: 'done' }) },
];
const BROKEN = [2, 3, 9, 7, 4, 5, 8];
check(BROKEN.filter((v, i) => i > 0 && BROKEN[(i - 1) >> 1] > v).length === 2, 'only 9 should break the order');

// ---------- why ----------
const SCAN = [7, 3, 9, 1, 8, 4];
const scanFrames = (() => {
  const frames = [];
  let m = 0;
  SCAN.forEach((v, i) => {
    if (v < SCAN[m]) m = i;
    frames.push({ say: 0, note: i === 0 ? `Start: min = ${v}.` : v === SCAN[m] && m === i ? `${v} is smaller: min = ${v}.` : `${v} is not smaller. min stays ${SCAN[m]}.`, panels: [arr(SCAN, { label: 'unsorted', highlights: hl(SCAN.length, (k) => (k === i ? 'active' : k === m ? 'done' : k < i ? 'visited' : '')) }), vars({ min: SCAN[m], looked: i + 1 })] });
  });
  frames.at(-1).note += ` ${SCAN.length} looks for one answer.`;
  const H = build(SCAN);
  frames.push({ say: 1, note: `Same values in a min-heap: the min is heap[0] = ${H[0]}. One look.`, panels: pic(H, { 0: 'done' }) });
  return frames;
})();

// ---------- when / recognize ----------
const WHEN_ROWS = [
  ['Top K', 'best k'],
  ['Two heaps', 'two halves'],
  ['K-way merge', 'k heads'],
  ['Greedy', 'available'],
];
const REC_ROWS = [
  ['min/max often?', 'heap'],
  ['k ≪ n?', 'size-k heap'],
  ['the middle?', 'two heaps'],
  ['k sorted?', 'k-way merge'],
];

// ---------- intuition ----------
const idxFrame = (i, say, note) => {
  const p = (i - 1) >> 1;
  const l = 2 * i + 1,
    r = 2 * i + 2;
  const pointers = [ptr(i, 'i'), ...(i > 0 ? [ptr(p, 'p', 'b')] : []), ...[l, r].filter((c) => c < H0.length).map((c, k) => ptr(c, k ? 'R' : 'L', 'b'))];
  const st = { [i]: 'active', ...(i > 0 ? { [p]: 'visited' } : {}), ...Object.fromEntries([l, r].filter((c) => c < H0.length).map((c) => [c, 'done'])) };
  return { say, note, panels: [heapTree(H0, st), heapArr(H0, st, { pointers }), vars({ i, p: i > 0 ? p : '—', L: l, R: r })] };
};
const IN_BASE = [2, 4, 3, 7, 9, 5];
check(isMinHeap(IN_BASE), 'IN_BASE should be a min-heap');
const IN_A = [...IN_BASE];
const IN_PUSH = pushFrames(IN_A, 1, MIN, { say: [0, 1, 2], cap: 7 });
check(same(IN_A, [1, 4, 2, 7, 9, 5, 3]) && IN_PUSH.swaps === 2, 'intuition push');
const IN_AFTER_PUSH = [...IN_A];
const IN_POP = popFrames(IN_A, MIN, { cap: 7, extra: (_, top) => (top === undefined ? [] : [vars({ popped: top })]) });
check(IN_POP.top === 1 && same(IN_A, [2, 4, 3, 7, 9, 5]), 'intuition pop');
const IN_B = [...IN_A];
const IN_PUSH0 = pushFrames(IN_B, 0, MIN, { say: [0, 0, 0], cap: 7 });

// ---------- brute force: last stone weight ----------
const STONES = [2, 7, 4, 1, 8, 1];
const sortRounds = (() => {
  const s = [...STONES];
  const frames = [];
  let round = 0;
  let beforeRound2 = null;
  while (s.length > 1) {
    round++;
    if (round === 2) beforeRound2 = [...s];
    s.sort((a, b) => a - b);
    frames.push({ say: 0, note: `Round ${round}: sort all ${s.length} values.`, panels: [arr([...s], { label: 'stones', highlights: hl(s.length, () => 'visited') }), vars({ round })] });
    const y = s.pop(),
      x = s.pop();
    if (y !== x) s.push(y - x);
    const st = y !== x ? { [s.length - 1]: 'active' } : {};
    frames.push({ say: y !== x ? 2 : 1, note: y !== x ? `Smash ${y} and ${x}: push back ${y - x}.` : `Smash ${y} and ${x}: equal, both gone.`, panels: [arr(s.length ? [...s] : [], { label: 'stones', highlights: st }), vars({ round, y, x })] });
  }
  frames.push({ say: 2, note: `One stone left: ${s[0]}.`, panels: [arr([...s], { label: 'stones', highlights: { 0: 'done' } }), vars({ answer: s[0] })] });
  return { frames, beforeRound2, answer: s[0] };
})();
// round 2's input: how many values sit in sorted order before the pushed-back one
const R2 = sortRounds.beforeRound2;
const R2_SORTED = R2.slice(0, -1);
check(same(R2_SORTED, [...R2_SORTED].sort((a, b) => a - b)), 'round 2 prefix should be sorted');
const heapRounds = (() => {
  const h = build(STONES, MAX);
  const frames = [{ say: 0, note: `Push all ${STONES.length} stones into a max-heap. The heaviest, ${h[0]}, is on top.`, panels: pic(h, { 0: 'active' }, { cap: 6 }) }];
  let round = 0;
  while (h.length > 1) {
    round++;
    const y = hpop(h, MAX),
      x = hpop(h, MAX);
    if (y !== x) {
      hpush(h, y - x, MAX);
      frames.push({ say: 1, note: `Round ${round}: pop ${y}, pop ${x}, push ${y - x}. Three short paths.`, panels: [...pic(h, { [h.indexOf(y - x)]: 'active' }, { cap: 6 }), vars({ y, x })] });
    } else frames.push({ say: 0, note: `Round ${round}: pop ${y}, pop ${x}. Equal: nothing to push.`, panels: [...pic(h, {}, { cap: 6 }), vars({ y, x })] });
  }
  frames.push({ say: 2, note: h.length ? `One stone left: heap.peek() = ${h[0]}.` : 'Heap empty: return 0.', panels: [...pic(h, { 0: 'done' }, { cap: 6 }), vars({ answer: h.length ? h[0] : 0 })] });
  check((h[0] ?? 0) === sortRounds.answer, 'both versions agree');
  return frames;
})();

// ---------- optimized ----------
const OP_A = [1, 5, 3, 8, 6, 7];
check(isMinHeap(OP_A), 'OP_A should be a min-heap');
const OP_PUSH = pushFrames(OP_A, 2, MIN, { say: [0, 1, 2], cap: 7 });
check(same(OP_A, [1, 5, 2, 8, 6, 7, 3]) && OP_PUSH.swaps === 1, 'optimized push');
const OP_POP = popFrames(OP_A, MIN, { say: [0, 1, 2], cap: 7, extra: (_, top) => [vars({ top: top ?? OP_A[0] })] });
check(OP_POP.top === 1 && same(OP_A, [2, 5, 3, 8, 6, 7]), 'optimized pop');
OP_POP.frames.push({ say: 3, note: `Return top = ${OP_POP.top}.`, panels: [...pic(OP_A, {}, { cap: 7 }), vars({ returns: OP_POP.top })] });

/** Bottom-up heapify, one frame per sift-down decision. */
function heapifyFrames(src, say = [0, 1, 2]) {
  const a = [...src];
  const n = a.length;
  const start = Math.floor(n / 2) - 1;
  const leaves = hl(n, (i) => (i > start ? 'muted' : ''));
  const frames = [{ say: say[0], note: `n = ${n}: start at ⌊${n}/2⌋ − 1 = ${start}. Indexes ${start + 1}–${n - 1} are leaves: cost 0.`, panels: [heapTree(a, leaves), heapArr(a, leaves, { pointers: [ptr(start, 'start')] })] }];
  let total = 0;
  for (let k = start; k >= 0; k--) {
    const done = hl(n, (i) => (i > k ? 'done' : ''));
    frames.push({ say: say[k === 0 ? 2 : 1], note: `Sift down index ${k} (${a[k]}).`, panels: [heapTree(a, { ...done, [k]: 'active' }), heapArr(a, { ...done, [k]: 'active' }, { pointers: [ptr(k, 'k')] })] });
    siftDown(a, k, MIN, (kind, i, j) => {
      const st = { ...done, [i]: kind === 'swap' ? 'visited' : 'done', ...(j >= 0 ? { [j]: kind === 'swap' ? 'active' : 'visited' } : {}) };
      if (kind === 'swap') total++;
      const note = kind === 'swap' ? `Smaller child ${a[i]} < ${a[j]}: swap ${i} ↔ ${j}.` : j < 0 ? `${a[i]} is now a leaf: stop.` : `Smaller child ${a[j]} ≥ ${a[i]}: stop.`;
      frames.push({ say: say[k === 0 ? 2 : 1], note, panels: [heapTree(a, st, { path: j >= 0 ? [i, j] : [] }), heapArr(a, st), vars({ k, swaps: total })] });
    });
  }
  check(isMinHeap(a), 'heapify result');
  frames.push({ say: say[2], note: `A min-heap after ${total} swaps.`, panels: [heapTree(a, hl(n, () => 'done')), heapArr(a, hl(n, () => 'done')), vars({ swaps: total })] });
  return { frames, result: a, start };
}
const HEAPIFY7 = heapifyFrames([9, 4, 7, 1, 8, 2, 3]);
const HEAPIFY8_IN = [9, 6, 8, 5, 7, 4, 3, 1];
const HEAPIFY8 = heapifyFrames(HEAPIFY8_IN, [0, 0, 0]);

// ---------- implementation: MinHeap with a key function ----------
const JOBS = [
  { n: 'A', dist: 3 },
  { n: 'B', dist: 1 },
  { n: 'C', dist: 2 },
];
const job = (x) => `${x.n}${x.dist}`;
const keyFrames = (() => {
  const a = [];
  const key = (x) => x.dist;
  const frames = [];
  for (const x of JOBS) {
    a.push(x);
    let i = a.length - 1;
    frames.push({ say: 0, note: `push ${job(x)}: append at index ${i}. key = ${key(x)}.`, panels: [...pic(a, { [i]: 'active' }, { cap: 3, show: job }), vars({ i })] });
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (key(a[i]) >= key(a[p])) {
        frames.push({ say: 1, note: `key ${key(a[i])} >= key ${key(a[p])}: break.`, panels: [...pic(a, { [i]: 'done', [p]: 'visited' }, { cap: 3, show: job, path: [i, p] }), vars({ i, p })] });
        break;
      }
      [a[i], a[p]] = [a[p], a[i]];
      frames.push({ say: 2, note: `key ${key(a[p])} < key ${key(a[i])}: swap. The whole object ${job(a[p])} moves up.`, panels: [...pic(a, { [p]: 'active', [i]: 'visited' }, { cap: 3, show: job, path: [i, p] }), vars({ i, p })] });
      i = p;
    }
  }
  check(a[0].n === 'B', 'smallest dist on top');
  return frames;
})();
// new MinHeap(x => -x): a max-heap by key
const NEG = (() => {
  const a = [];
  const cmp = (x, y) => -x - -y;
  const frames = [];
  for (const x of [3, 9, 5]) {
    const r = pushFrames(a, x, cmp, { say: [0, 0, 0], cap: 3 });
    frames.push({ ...r.frames.at(-1), note: `push ${x} (key ${-x}): heap is [${a.join(', ')}].` });
  }
  return { frames, heap: a };
})();
check(NEG.heap[0] === 9, 'x => -x puts 9 on top');
// PriorityQueue((a, b) => a[0] - b[0] || a[1] - b[1])
const TUP_CMP = (a, b) => a[0] - b[0] || a[1] - b[1];
const tup = (t) => `[${t[0]},${t[1]}]`;
const TUP_IN = [
  [2, 5],
  [1, 9],
  [2, 3],
];
const TUP_HEAP = build(TUP_IN, TUP_CMP);
const TUP = (() => {
  const a = [...TUP_HEAP];
  const out = [];
  const frames = [];
  while (a.length) {
    const t = hpop(a, TUP_CMP);
    out.push(t);
    frames.push({ say: 1, note: `pop → ${tup(t)}.`, panels: [...pic(a, {}, { cap: 3, show: tup }), arr(pad(out.map(tup), 3), { label: 'popped', highlights: { [out.length - 1]: 'active' } })] });
  }
  return { frames, order: out.map((t) => `[${t[0]}, ${t[1]}]`) };
})();
check(same(TUP.order, ['[1, 9]', '[2, 3]', '[2, 5]']), 'tuple pop order');

// ---------- template: one picture per skeleton ----------
const TPL_TOPK = (() => {
  const h = [];
  for (const x of [5, 1, 9, 3, 7]) {
    hpush(h, x);
    if (h.length > 2) hpop(h);
  }
  return h;
})();
check(TPL_TOPK[0] === 7, 'top-2 of 5 1 9 3 7: peek 7');
// two heaps add(x), straight from the lesson
function addTwo(low, high, x) {
  hpush(low, x, MAX);
  hpush(high, hpop(low, MAX), MIN);
  if (high.length > low.length) hpush(low, hpop(high, MIN), MAX);
}
const median = (low, high) => (low.length > high.length ? low[0] : (low[0] + high[0]) / 2);
const TPL_LOW = [],
  TPL_HIGH = [];
for (const x of [5, 1, 9]) addTwo(TPL_LOW, TPL_HIGH, x);
const TPL_LISTS = [[1, 4], [2, 6], [3]];
const TPL_PQ = TPL_LISTS.reduce((pq, l, i) => (l.length ? hpush(pq, [l[0], i, 0], (a, b) => a[0] - b[0]) : pq), []);

// ---------- dry run: the lesson's table, row by row ----------
const DRY_TABLE = [
  ['push 5', [5]],
  ['push 3', [3, 5]],
  ['push 8', [3, 5, 8]],
  ['push 1', [1, 3, 8, 5]],
  ['pop → 1', [3, 5, 8]],
];
const dry = (() => {
  const a = [];
  const frames = [];
  const op = (o) => (h) => [vars({ op: o, heap: `[${h.join(', ')}]` })];
  [5, 3, 8, 1].forEach((x, k) => {
    const r = pushFrames(a, x, MIN, { say: [k, k, k], cap: 4, extra: op(`push ${x}`) });
    frames.push(...r.frames);
    check(same(a, DRY_TABLE[k][1]), `dry run row ${k + 1}`);
  });
  const r = popFrames(a, MIN, { say: [4, 4, 4], cap: 4, extra: op('pop') });
  check(r.top === 1 && same(a, DRY_TABLE[4][1]), 'dry run pop row');
  frames.push(...r.frames);
  frames.push({ say: 4, note: 'pop returns 1. Heap [3, 5, 8]: matches the table.', panels: [...pic(a, { 0: 'done' }, { cap: 4 }), vars({ returned: 1 })] });
  return { frames, heap: a };
})();
const DRY_ADD4 = [...dry.heap];
const DRY_ADD4_RUN = pushFrames(DRY_ADD4, 4, MIN, { say: [0, 0, 0], cap: 4 });
check(DRY_ADD4_RUN.at === 1, 'push 4 lands at index 1');
const DRY_POP2 = [...dry.heap];
const DRY_POP2_RUN = popFrames(DRY_POP2, MIN, { say: [0, 0, 0], cap: 3 });
check(DRY_POP2_RUN.swaps === 1 && same(DRY_POP2, [5, 8]), 'second pop');

// ---------- top k ----------
const TOPK_IN = [4, 1, 7, 3, 8, 5];
const K = 3;
function topKFrames(h, xs, say) {
  const frames = [];
  for (const x of xs) {
    hpush(h, x);
    const over = h.length > K;
    frames.push({ say: say[0], note: over ? `push ${x}: size ${h.length} > k.` : `push ${x}: size ${h.length} ≤ k, keep it.`, panels: [...pic(h, { [h.indexOf(x)]: 'active', ...(over ? { 0: 'bad' } : {}) }, { cap: 4 }), vars({ x, size: h.length, k: K })] });
    if (over) {
      const out = hpop(h);
      frames.push({ say: say[1], note: `pop the weakest, ${out}. The best ${K} so far: ${[...h].sort((a, b) => a - b).join(', ')}.`, panels: [...pic(h, { 0: 'visited' }, { cap: 4 }), vars({ evicted: out, size: h.length })] });
    }
  }
  return frames;
}
const TOPK_H = [];
const TOPK_FRAMES = topKFrames(TOPK_H, TOPK_IN, [1, 1]);
TOPK_FRAMES[0].say = 0;
TOPK_FRAMES.push({ say: 2, note: `Done: the 3 largest are ${[...TOPK_H].sort((a, b) => b - a).join(', ')}. peek() = ${TOPK_H[0]} = 3rd largest.`, panels: [...pic(TOPK_H, { 0: 'done' }, { cap: 4 }), vars({ kth: TOPK_H[0] })] });
check(TOPK_H[0] === [...TOPK_IN].sort((a, b) => b - a)[K - 1], 'peek is the kth largest');
const TOPK_H6 = [...TOPK_H];
const TOPK_6 = topKFrames(TOPK_H6, [6], [0, 0]);
check(TOPK_H6[0] === 6, 'after 6 the 3rd largest is 6');

// ---------- two heaps ----------
const twoPanels = (low, high, st = {}, v = {}) => [
  heapTree(low, st.low || {}, { cap: 3, label: 'low (max-heap)' }),
  heapTree(high, st.high || {}, { cap: 3, label: 'high (min-heap)' }),
  vars(v),
];
function addFrames(low, high, x) {
  const frames = [];
  hpush(low, x, MAX);
  frames.push({ say: 1, note: `add(${x}): push ${x} into low.`, panels: twoPanels(low, high, { low: { [low.indexOf(x)]: 'active' } }, { x }) });
  const moved = hpop(low, MAX);
  hpush(high, moved, MIN);
  frames.push({ say: 1, note: `Move low's top, ${moved}, to high.`, panels: twoPanels(low, high, { high: { [high.indexOf(moved)]: 'active' } }, { x, moved }) });
  let back = null;
  if (high.length > low.length) {
    back = hpop(high, MIN);
    hpush(low, back, MAX);
    frames.push({ say: 2, note: `high has ${high.length + 1}, low ${low.length - 1}: move ${back} back to low.`, panels: twoPanels(low, high, { low: { [low.indexOf(back)]: 'active' } }, { x, back }) });
  } else frames.push({ say: 2, note: `Sizes ${low.length} and ${high.length}: balanced, no move back.`, panels: twoPanels(low, high, {}, { x }) });
  const m = median(low, high);
  frames.push({ say: 3, note: low.length > high.length ? `Odd count: median = low.peek() = ${m}.` : `Even count: median = (${low[0]} + ${high[0]}) / 2 = ${m}.`, panels: twoPanels(low, high, { low: { 0: 'done' }, high: low.length > high.length ? {} : { 0: 'done' } }, { median: m }) });
  return { frames, median: m, back };
}
const TW_LOW = [],
  TW_HIGH = [];
const TW_WATCH = [6, 2, 9].flatMap((x) => addFrames(TW_LOW, TW_HIGH, x).frames);
const TW_LOW1 = [...TW_LOW],
  TW_HIGH1 = [...TW_HIGH];
const TW_ADD4 = addFrames(TW_LOW, TW_HIGH, 4);
check(TW_ADD4.median === 5, 'median after 6 2 9 4 is 5');
const TW_LOW2 = [...TW_LOW],
  TW_HIGH2 = [...TW_HIGH];
const TW_ADD7 = addFrames(TW_LOW, TW_HIGH, 7);
check(TW_ADD7.back === 6 && TW_ADD7.median === 6, 'adding 7 moves 6 back, median 6');

// ---------- k-way merge ----------
const LISTS = [
  [1, 4, 7],
  [2, 5],
  [3, 6, 8],
];
const N_ALL = LISTS.flat().length;
const KW_CMP = (a, b) => a.v - b.v;
const kwPanels = (heap, out, popped, extra) => {
  const inHeap = new Set(heap.map((e) => `${e.i},${e.j}`));
  const states = LISTS.map((l, i) => [0, 1, 2].map((j) => (j >= l.length ? '' : popped.has(`${i},${j}`) ? 'done' : inHeap.has(`${i},${j}`) ? 'active' : '')));
  return [
    table(['L0', 'L1', 'L2'], ['0', '1', '2'], LISTS.map((l) => [0, 1, 2].map((j) => (j < l.length ? l[j] : '—'))), states),
    arr(heap.map((e) => e.v), { label: 'heap (min)', highlights: heap.length ? { 0: 'active' } : {} }),
    extra || arr(pad(out, N_ALL), { label: 'out', highlights: out.length ? { [out.length - 1]: 'done' } : {} }),
  ];
};
const KW = (() => {
  const heap = [];
  const out = [];
  const popped = new Set();
  const frames = [];
  LISTS.forEach((l, i) => l.length && hpush(heap, { v: l[0], i, j: 0 }, KW_CMP));
  frames.push({ say: 0, note: `Push each list's head: ${LISTS.map((l) => l[0]).join(', ')}. The heap holds k = ${LISTS.length}.`, panels: kwPanels(heap, out, popped) });
  const snaps = [];
  while (heap.length) {
    snaps.push({ heap: heap.map((e) => ({ ...e })), out: [...out], popped: new Set(popped) });
    const { v, i, j } = hpop(heap, KW_CMP);
    out.push(v);
    popped.add(`${i},${j}`);
    const next = j + 1 < LISTS[i].length;
    if (next) hpush(heap, { v: LISTS[i][j + 1], i, j: j + 1 }, KW_CMP);
    frames.push({ say: next ? 2 : 1, note: next ? `Pop ${v} (L${i}), output it. Push L${i}'s next, ${LISTS[i][j + 1]}.` : `Pop ${v} (L${i}), output it. L${i} is used up: push nothing.`, panels: kwPanels(heap, out, popped) });
  }
  frames.at(-1).say = 3;
  frames.at(-1).note += ' Heap empty: done.';
  check(same(out, LISTS.flat().sort((a, b) => a - b)), 'merge output sorted');
  return { frames, snaps };
})();
// the moment 2 is about to be popped
const KW_AT2 = KW.snaps.findIndex((s) => s.heap[0].v === 2);
check(KW_AT2 === 1, 'second pop is 2');

// ---------- scheduling: reorganize string with a hold-out ----------
const letter = (e) => `${e.ch}${e.c}`;
const BY_COUNT = (x, y) => y.c - x.c;
function reorganize(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  const heap = [];
  for (const [ch, c] of counts) hpush(heap, { ch, c }, BY_COUNT);
  const out = [];
  const frames = [];
  const P = (st, held) => [arr(heap.map(letter), { label: 'max-heap by count', highlights: st }), vars({ held: held && held.c > 0 ? letter(held) : '—' }), arr(pad(out, s.length), { label: 'output', highlights: out.length ? { [out.length - 1]: 'active' } : {} })];
  frames.push({ say: 0, note: `Count: ${[...counts].map(([ch, c]) => `${ch}×${c}`).join(', ')}. Max-heap by count.`, panels: P({ 0: 'active' }, null) });
  let held = null;
  while (heap.length) {
    const top = hpop(heap, BY_COUNT);
    out.push(top.ch);
    const back = held && held.c > 0 ? held : null;
    if (back) hpush(heap, back, BY_COUNT);
    top.c--;
    held = top;
    frames.push({ say: back ? 2 : 1, note: `Pop ${top.ch} (most frequent), emit it.${back ? ` Push held ${letter(back)} back.` : ''} ${top.c ? `Hold ${letter(top)} out for one step.` : `${top.ch} is used up.`}`, panels: P(back ? { [heap.indexOf(back)]: 'visited' } : {}, top) });
  }
  const ok = held.c === 0;
  return { frames, out: out.join(''), ok, held };
}
const RE1 = reorganize('aaabb');
check(RE1.ok && RE1.out === 'ababa', 'aaabb → ababa');
const RE2 = reorganize('aaab');
check(!RE2.ok, 'aaab is impossible');
RE2.frames.push({ say: 0, note: `The heap is empty but ${letter(RE2.held)} is still held: no letter can separate it. Impossible.`, panels: [arr([], { label: 'max-heap by count' }), vars({ held: letter(RE2.held) }), arr(pad(RE2.out.split(''), 4), { label: 'output', highlights: { 3: 'bad' } })] });

// IPO: sort by capital, push affordable profits into a max-heap, take the top
const PROJ_IN = [
  [1, 3],
  [0, 1],
  [3, 5],
  [1, 2],
];
const IPO = (() => {
  const P = [...PROJ_IN].sort((a, b) => a[0] - b[0]);
  const rows = P.map((_, i) => `P${i + 1}`);
  const cells = P.map(([c, p]) => [c, p]);
  const taken = new Set();
  let unlocked = 0;
  let w = 0;
  const heap = [];
  const st = () => P.map((_, i) => (taken.has(i) ? ['done', 'done'] : i < unlocked ? ['visited', 'visited'] : ['', '']));
  const panels = (hi = {}) => [table(rows, ['capital', 'profit'], cells, st()), arr(heap.map((e) => e[1]), { label: 'max-heap (profit)', highlights: hi }), vars({ w, k: K_IPO - roundsUsed })];
  const K_IPO = 2;
  let roundsUsed = 0;
  const frames = [{ say: 0, note: `Sort by capital. Start: w = 0, k = ${K_IPO}.`, panels: panels() }];
  const cmp = (a, b) => b[1] - a[1];
  for (let r = 0; r < K_IPO; r++) {
    const before = unlocked;
    while (unlocked < P.length && P[unlocked][0] <= w) hpush(heap, [...P[unlocked++], unlocked - 1], cmp);
    frames.push({ say: 1, note: unlocked > before ? `w = ${w}: unlock ${P.slice(before, unlocked).map((_, k) => `P${before + k + 1}`).join(', ')}. Push profit${unlocked - before > 1 ? 's' : ''}.` : `w = ${w}: nothing new unlocks.`, panels: panels({ 0: 'active' }) });
    if (!heap.length) break;
    const best = hpop(heap, cmp);
    taken.add(best[2]);
    w += best[1];
    roundsUsed++;
    frames.push({ say: 2, note: `Take the top: profit ${best[1]}. w = ${w}.`, panels: panels() });
  }
  frames.at(-1).note += roundsUsed === K_IPO ? ` k used up. Final capital ${w}.` : '';
  return { frames, w, P };
})();
check(IPO.w === 4, 'IPO final capital 4');
const SCHED = (() => {
  const tasks = ['A', 'A', 'A', 'B', 'B'];
  const n = 2;
  const freq = {};
  tasks.forEach((t) => (freq[t] = (freq[t] || 0) + 1));
  const maxF = Math.max(...Object.values(freq));
  const countMax = Object.values(freq).filter((f) => f === maxF).length;
  return { tasks, n, freq, ans: Math.max(tasks.length, (maxF - 1) * (n + 1) + countMax) };
})();
check(SCHED.ans === 7, 'task scheduler 7');

// ---------- mistakes ----------
const WRONG_IN = [4, 1, 7, 3, 8];
const wrongDir = (() => {
  const mx = [],
    mn = [];
  const frames = [];
  for (const x of WRONG_IN) {
    hpush(mx, x, MAX);
    hpush(mn, x, MIN);
    const outMax = mx.length > 2 ? hpop(mx, MAX) : null;
    const outMin = mn.length > 2 ? hpop(mn, MIN) : null;
    frames.push({
      say: outMax === null ? 0 : 1,
      note: `push ${x}.${outMax !== null ? ` Max-heap evicts ${outMax}; min-heap evicts ${outMin}.` : ''}`,
      panels: [arr([...mx], { label: 'max-heap, k = 2' }), arr([...mn], { label: 'min-heap, k = 2' }), vars({ x, out: outMax === null ? '—' : `${outMax} / ${outMin}` })],
    });
  }
  frames.push({ say: 2, note: `Max-heap kept ${[...mx].sort((a, b) => a - b).join(', ')}: the two smallest. Min-heap kept ${[...mn].sort((a, b) => a - b).join(', ')}: right.`, panels: [arr([...mx], { label: 'max-heap, k = 2', highlights: hl(mx.length, () => 'bad') }), arr([...mn], { label: 'min-heap, k = 2', highlights: hl(mn.length, () => 'done') })] });
  check(same([...mn].sort((a, b) => a - b), [7, 8]), 'min-heap keeps 7, 8');
  return frames;
})();
const SIGN = (() => {
  const a = [];
  // (a, b) => b - a is exactly MAX
  pushFrames(a, 3, MAX);
  const r = pushFrames(a, 9, MAX, { say: [0, 0, 0], cap: 2 });
  return { frames: r.frames, top: a[0] };
})();
check(SIGN.top === 9, 'b - a puts 9 first');
const LEX = [10, 9, 1].sort();
check(same(LEX, [1, 10, 9]), 'default sort is lexicographic');

// ---------------------------------------------------------------------------
export default {
  what: [
    {
      kind: 'watch',
      title: 'Two rules, one tree',
      lines: ['A heap answers: what is the smallest thing I have?', '**Shape rule:** every level is full except the last, which fills left to right.', '**Order rule (min-heap):** every parent ≤ its children.', 'Left vs right is not ordered.'],
      frames: whatFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: find the broken parent',
      lines: ['Same shape, different values.', 'Check each parent against its children.'],
      panels: pic(BROKEN),
      task: {
        type: 'cell',
        question: 'One parent breaks the min-heap order rule. Tap it.',
        panel: 1,
        answer: 2,
        hints: { 0: '2 ≤ 3 and 2 ≤ 9: fine.', 1: '3 ≤ 7 and 3 ≤ 4: fine.', 3: '7 is a leaf: no children to check.', 4: '4 is a leaf: no children to check.', 5: '5 is a leaf. Look at its parent.', 6: '8 is a leaf. Look at its parent.' },
      },
      solved: '9 sits above 5 and 8. A min-heap parent must be ≤ both children.',
      then: [{ say: 1, note: '9 > 5 and 9 > 8: the order rule fails at index 2.', panels: pic(BROKEN, { 2: 'bad', 5: 'visited', 6: 'visited' }, { path: [2, 5, 6] }) }],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does node 8 go?',
      lines: ['This complete tree has 7 nodes.', 'An 8th node must keep the shape rule.'],
      panels: pic(H0, {}, { cap: 8 }),
      task: {
        type: 'choose',
        question: 'Which slot can the 8th node take?',
        options: [
          { text: 'Left child of 7 (index 7)', why: '' },
          { text: 'Right child of 8', why: 'That leaves gaps: the last level must fill left to right.' },
          { text: 'Any leaf whose value is smaller', why: 'The shape rule alone fixes the slot. Values do not choose it.' },
        ],
        answer: 0,
      },
      solved: 'Level 3 starts filling from the left: under 7, at index 7.',
      then: [{ say: 1, note: 'Index 7 is the next free slot. No gaps.', panels: pic([...H0, '?'], { 7: 'active' }, { path: [3, 7] }) }],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Get the min: scan vs heap',
      lines: ['Unsorted array: get min is an O(n) scan.', 'Heap: the min is always at the top, O(1).'],
      frames: scanFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: n operations',
      lines: ['n = 10⁵ operations.', 'Heap: O(log n) each. A structure that costs O(n) each: O(n²) total.'],
      panels: [table(['O(n) each', 'heap'], ['per op', 'total'], [['O(n)', 'O(n²)'], ['O(log n)', 'O(n log n)']], [['', 'bad'], ['', 'done']])],
      task: {
        type: 'choose',
        question: 'For n = 10⁵, about how many steps does the heap take in total?',
        options: [
          { text: '~1.7 million', why: '' },
          { text: '~10 billion', why: 'That is n² = 10¹⁰: the O(n)-per-operation cost.' },
          { text: '~100 thousand', why: 'That would be O(1) per operation; push and pop are O(log n).' },
        ],
        answer: 0,
      },
      solved: 'n log n ≈ 10⁵ × 17 ≈ 1.7 million, vs 10 billion for n².',
    },
    {
      kind: 'turn',
      title: 'Your turn: heap vs balanced BST',
      lines: ['A balanced BST is also O(log n).', 'So what does the heap win?'],
      panels: [table(['BST', 'heap'], ['insert', 'get min', 'remove'], [['O(log n)', 'O(log n)', 'O(log n)'], ['O(log n)', 'O(1)', 'O(log n)']], [['', '', ''], ['', 'done', '']])],
      task: {
        type: 'choose',
        question: 'Besides O(1) get min, what does the heap give up that the BST needs?',
        options: [
          { text: 'Pointers and balancing rotations: it is a plain array', why: '' },
          { text: 'The O(log n) insert', why: 'Heap insert is O(log n) too.' },
          { text: 'Its memory: a heap stores no values', why: 'A heap stores every value, in an array.' },
        ],
        answer: 0,
      },
      solved: 'Same speed class, simpler structure: the complete shape is balanced automatically.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Four patterns, four contents',
      lines: ['Use a heap when you **repeatedly** need the min or max of a set that **changes**.', 'Each pattern keeps something different in the heap.'],
      frames: WHEN_ROWS.map((r, k) => ({ say: k === 0 ? 0 : 1, note: `${r[0]}: the heap holds ${['the best k candidates', 'the lower half (max-heap) and upper half (min-heap)', 'the current head of each sorted sequence', 'the items still available, best first'][k]}.`, panels: [reveal(WHEN_ROWS, 'heap holds', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: merge 5 sorted files',
      lines: ['You must merge 5 sorted files into one.'],
      panels: [reveal(WHEN_ROWS, 'heap holds', 3)],
      task: {
        type: 'choose',
        question: 'What sits in the heap?',
        options: [
          { text: 'The current head of each file', why: '' },
          { text: 'The best k candidates', why: 'That is Top K; here every line is output.' },
          { text: 'The lower and upper half', why: 'That is two heaps, for a median.' },
        ],
        answer: 0,
      },
      solved: 'K-way merge: one head per sorted source.',
    },
    {
      kind: 'turn',
      title: 'Your turn: just once',
      lines: ['You need the minimum of this array **once**.'],
      panels: [arr([7, 3, 9, 1], { label: 'nums' })],
      task: {
        type: 'choose',
        question: 'Best tool?',
        options: [
          { text: 'A loop (or `Math.min(...arr)` if small): O(n)', why: '' },
          { text: 'A heap, then peek', why: 'The heap pays off only when you need the extreme repeatedly.' },
          { text: 'Sort, then take index 0', why: 'Sorting costs O(n log n) for a single value.' },
        ],
        answer: 0,
      },
      solved: 'Once → a linear scan: O(n) and simpler.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Four questions',
      lines: ['Min/max many times while the set changes? → heap.', 'k small compared to n? → size-k heap, O(n log k).', 'The middle, not an end? → two heaps.', 'k sorted sources? → k-way merge.'],
      frames: REC_ROWS.map((_, k) => ({ say: k, note: ['Repeated extremes of a changing set: a heap.', 'Only k items matter: keep k, O(n log k).', 'Median: split into two halves.', 'Sorted sources: a heap of their heads.'][k], panels: [reveal(REC_ROWS, 'think', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: a reading arrives',
      lines: ['"Report the **median** after each new reading."'],
      panels: [arr([5, 2, 8], { label: 'readings so far' }), vars({ next: '?' })],
      task: {
        type: 'choose',
        question: 'Which shape fits?',
        options: [
          { text: 'Two heaps', why: '' },
          { text: 'A size-k heap', why: 'The median is the middle, not the top k.' },
          { text: 'K-way merge', why: 'There are no k sorted sources here.' },
        ],
        answer: 0,
      },
      solved: 'The middle, not an end → two heaps.',
    },
    {
      kind: 'turn',
      title: 'Your turn: each turn, the largest',
      lines: ['"Each turn, take the **largest** pile, shrink it, put it back."'],
      panels: [arr([9, 4, 16], { label: 'piles' })],
      task: {
        type: 'choose',
        question: 'What do you reach for?',
        options: [
          { text: 'A max-heap: pop, modify, push back', why: '' },
          { text: 'Sort once at the start', why: 'The largest changes after every turn; one sort goes stale.' },
          { text: 'Two heaps', why: 'Nothing asks for the middle.' },
        ],
        answer: 0,
      },
      solved: '"Each turn pick the largest" → a heap.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'The positions are the links',
      lines: ['`parent(i) = (i - 1) >> 1`', '`left(i) = 2i + 1`, `right(i) = 2i + 2`', 'An index past the end means: no such node.'],
      frames: [
        idxFrame(1, 1, 'i = 1: children 2·1+1 = 3 and 2·1+2 = 4 (values 7 and 4).'),
        idxFrame(2, 0, 'i = 2: parent (2 − 1) >> 1 = 0. Children 5 and 6.'),
        idxFrame(4, 0, 'i = 4: parent (4 − 1) >> 1 = 1 (value 3).'),
        idxFrame(4, 2, 'Children of 4 would be 9 and 10: past the end. 4 is a leaf.'),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: find a parent',
      lines: ['Use `(i - 1) >> 1`.'],
      panels: pic(H0, { 5: 'active' }),
      task: { type: 'cell', question: 'Tap the parent of index 5.', panel: 1, answer: 2, hints: { 1: 'Index 1 is the parent of 3 and 4.', 4: '(5 − 1) >> 1 = 2.', 0: 'Index 0 is the parent of 1 and 2.' } },
      solved: '(5 − 1) >> 1 = 2. Index 2 holds 2, and 2 ≤ 5.',
    },
    {
      kind: 'watch',
      title: 'push: append, then sift up',
      lines: ['push(x): put x at the end, the next free leaf.', 'Sift up: swap with the parent while x is smaller.', 'One path, at most ⌊log₂ n⌋ swaps.'],
      frames: IN_PUSH.frames,
    },
    {
      kind: 'watch',
      title: 'pop: last to root, then sift down',
      lines: ['pop(): the answer is `heap[0]`.', 'Move the **last** element to the root: the tree stays complete.', 'Sift down: swap with the smaller child while it is smaller.'],
      frames: IN_POP.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: count the swaps',
      lines: ['push(0) into this heap.', 'It sifts up while it is smaller than its parent.'],
      panels: pic(IN_A, {}, { cap: 7 }),
      task: { type: 'number', question: 'How many swaps does push(0) make?', options: [1, 2, 3], answer: IN_PUSH0.swaps, hint: 'One swap per level, until the root.' },
      solved: `0 is smaller than everything: ${IN_PUSH0.swaps} swaps, one per level, to the root.`,
      then: IN_PUSH0.frames,
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Last stone weight: re-sort every round',
      lines: ['Sort the whole array every round: O(n log n).', 'Smash the two heaviest, `y` and `x`.', 'If they differ, push back `y - x`.'],
      frames: sortRounds.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: how much was already sorted?',
      lines: ['Round 2 is about to sort these values.', 'Only the last one was just pushed.'],
      panels: [arr(R2, { label: 'stones', highlights: { [R2.length - 1]: 'active' } })],
      task: { type: 'number', question: 'How many of them are already in sorted order?', options: [1, R2_SORTED.length, R2.length], answer: R2_SORTED.length, hint: 'Everything but the pushed-back value survived last round’s sort.' },
      solved: `${R2_SORTED.length} of ${R2.length} were already sorted. sort() re-examines them all anyway.`,
    },
    {
      kind: 'watch',
      title: 'Max-heap: repair one path',
      lines: ['Each pop repairs one path: O(log n).', 'push `y - x` repairs one more path.', 'Heap empty → 0, else the last stone.'],
      frames: heapRounds,
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'push(2)',
      lines: ['Append x at the end: the tree is still complete.', 'While `i > 0` and `heap[i] < heap[parent(i)]`: swap, `i = parent(i)`.', 'Stop when the parent ≤ x or x is the root.'],
      frames: OP_PUSH.frames,
    },
    {
      kind: 'watch',
      title: 'pop()',
      lines: ['Save `top = heap[0]`.', 'Remove the last element and put it at index 0.', 'Sift down: swap with the smaller child while it is smaller.', 'Return `top`.'],
      frames: OP_POP.frames,
    },
    {
      kind: 'watch',
      title: 'Heapify bottom-up',
      lines: ['Sift down every non-leaf, from `⌊n/2⌋ − 1` down to 0.', 'A sift down costs the node’s **height**, not the tree height.', 'Most nodes are near the bottom, where sifting is cheap: O(n).'],
      frames: HEAPIFY7.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: where does heapify start?',
      lines: ['Now n = 8.', 'Leaves need no sift down.'],
      panels: pic(HEAPIFY8_IN),
      task: { type: 'cell', question: 'Tap the first index heapify sifts down.', panel: 1, answer: HEAPIFY8.start, hints: { 4: 'Index 4 has children 9 and 10: past the end. A leaf.', 7: 'A leaf: nothing to sift.', 0: 'The root is the last one, not the first.', 2: '⌊8/2⌋ − 1 = 3.' } },
      solved: `⌊8/2⌋ − 1 = ${HEAPIFY8.start}: the last node that has a child.`,
      then: HEAPIFY8.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: cost of the root',
      lines: ['A 7-node complete tree has 3 levels.', 'Sift down from a node costs at most its height.'],
      panels: pic([9, 4, 7, 1, 8, 2, 3], { 0: 'active' }),
      task: { type: 'number', question: 'At most how many swaps can the root’s sift down make?', options: [1, 2, 3], answer: 2, hint: 'Count the edges from the root down to a leaf.' },
      solved: 'The root has height 2: at most 2 swaps. Leaves pay 0, their parents at most 1.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'A key function on objects',
      lines: ['`new MinHeap((p) => p.dist)`: `key(x)` is the priority; smaller first.', 'push: `if (key(a[i]) >= key(a[p])) break;`', 'Otherwise swap: the whole object moves.'],
      frames: keyFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: forget to floor',
      lines: ['Someone writes `p = (i - 1) / 2`.'],
      panels: [heapArr(H0, { 4: 'active' }, { pointers: [ptr(4, 'i')] }), vars({ i: 4 })],
      task: {
        type: 'choose',
        question: 'What is p for i = 4?',
        options: [
          { text: '1.5: not an index at all', why: '' },
          { text: '1', why: 'That is `(i - 1) >> 1`. Plain `/` does not floor.' },
          { text: '2', why: '(4 − 1) / 2 = 1.5; nothing rounds it up.' },
        ],
        answer: 0,
      },
      solved: 'Use `(i - 1) >> 1`: floor division by 2 for non-negative ints.',
    },
    {
      kind: 'turn',
      title: 'Your turn: a max-heap from a min-heap',
      lines: ['A max-heap is a min-heap with key `x => -x`.', 'Push 3, 9, 5 into `new MinHeap(x => -x)`.'],
      panels: [arr([3, 9, 5], { label: 'push order' }), vars({ key: 'x => -x' })],
      task: {
        type: 'choose',
        question: 'What does peek() return?',
        options: [
          { text: '9', why: '' },
          { text: '3', why: 'Smallest **key** comes first: key(9) = −9 is the smallest.' },
          { text: '5', why: 'key(5) = −5 is bigger than key(9) = −9.' },
        ],
        answer: 0,
      },
      solved: 'Negated keys put the largest value on top.',
      then: NEG.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: tie-breaks',
      lines: ['`new PriorityQueue((a, b) => a[0] - b[0] || a[1] - b[1])`', 'On a tie in a[0], the `||` falls through to a[1].'],
      panels: [...pic(TUP_HEAP, {}, { show: tup })],
      task: { type: 'order', question: 'In what order do the tuples pop?', items: TUP.order, hint: 'Smaller first number first; on a tie, smaller second number.' },
      solved: '[2,3] beats [2,5] on the tie-break.',
      then: TUP.frames,
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Four skeletons, four heaps',
      lines: ['Top K: min-heap of size k; peek() = kth largest.', 'Two heaps: low (max), high (min), low.size() ≥ high.size().', 'K-way merge: heap of (value, listIndex, elementIndex).', 'Greedy: pop best, modify, push back.'],
      frames: [
        { say: 0, note: `nums 5 1 9 3 7, k = 2: h ends as [${TPL_TOPK.join(', ')}]. peek() = ${TPL_TOPK[0]}, the 2nd largest.`, panels: [...pic(TPL_TOPK), vars({ k: 2 })] },
        { say: 1, note: `After 5, 1, 9: low [${TPL_LOW.join(', ')}], high [${TPL_HIGH.join(', ')}]. Median = low.peek() = ${median(TPL_LOW, TPL_HIGH)}.`, panels: [heapTree(TPL_LOW, { 0: 'done' }, { label: 'low (max)' }), heapTree(TPL_HIGH, {}, { label: 'high (min)' })] },
        { say: 2, note: 'Lists [1,4], [2,6], [3]: one tuple per head.', panels: [arr(TPL_PQ.map((t) => t.join(',')), { label: 'pq (v,i,j)', highlights: { 0: 'active' } }), vars({ next: '[4,0,1]' })] },
        { say: 3, note: 'Pop the best, change it, push the changed item back.', panels: [...pic(build([3, 5, 4], MAX), { 0: 'active' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why i and j?',
      lines: ['Skeleton 3 pushes `[l[0], i, 0]`, not just `l[0]`.'],
      panels: [arr(TPL_PQ.map((t) => t.join(',')), { label: 'pq (v,i,j)', highlights: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'After popping `[1,0,0]`, what are i and j used for?',
        options: [
          { text: 'To push the successor `lists[i][j + 1]`', why: '' },
          { text: 'To break ties', why: 'The comparator reads only a[0].' },
          { text: 'To sort the output', why: 'The heap already pops values in order.' },
        ],
        answer: 0,
      },
      solved: 'i says which list, j which position: so the next element is lists[0][1] = 4.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the size rule',
      lines: ['Skeleton 2: `if (high.size() > low.size()) low.push(high.pop());`'],
      panels: [heapTree(TPL_LOW, {}, { label: 'low (max)' }), heapTree(TPL_HIGH, {}, { label: 'high (min)' })],
      task: {
        type: 'choose',
        question: 'Which size rule does that line keep?',
        options: [
          { text: 'low.size() ≥ high.size()', why: '' },
          { text: 'high.size() ≥ low.size()', why: 'Whenever high gets bigger, its top moves back to low.' },
          { text: 'Sizes always equal', why: 'With an odd count, low holds one extra.' },
        ],
        answer: 0,
      },
      solved: 'low may have one extra; high is never bigger.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'push 5, 3, 8, 1 then pop()',
      lines: ['push 5: [5]. Nothing to compare.', 'push 3: 3 < 5 → swap (i 1 ↔ 0). [3, 5]', 'push 8: 8 ≥ 3 → stop. [3, 5, 8]', 'push 1: 1 < 5 → swap (3 ↔ 1); 1 < 3 → swap (1 ↔ 0). [1, 3, 8, 5]', 'pop → 1: last (5) to root [5, 3, 8]; 3 < 5 → swap. [3, 5, 8]'],
      frames: dry.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: push 4',
      lines: ['Continue from [3, 5, 8].', 'Append 4, then sift up.'],
      panels: pic(dry.heap, {}, { cap: 4 }),
      task: { type: 'cell', question: 'At which index does 4 end up?', panel: 1, answer: DRY_ADD4_RUN.at, hints: { 0: '4 ≥ 3: it stops below the root.', 2: '4 is appended at index 3; its parent is index 1.' } },
      solved: '4 < 5 → swap to index 1; 4 ≥ 3 → stop. Heap [3, 4, 8, 5].',
      then: DRY_ADD4_RUN.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: pop again',
      lines: ['Back to [3, 5, 8]. Call pop().'],
      panels: pic(dry.heap, {}, { cap: 3 }),
      task: { type: 'number', question: 'How many swaps does the sift down make?', options: [0, 1, 2], answer: DRY_POP2_RUN.swaps, hint: '8 moves to the root; compare it with its only child.' },
      solved: 'pop → 3. 8 goes to the root, 5 < 8 → 1 swap. Heap [5, 8].',
      then: DRY_POP2_RUN.frames,
    },
  ],

  'optimized-top-k': [
    {
      kind: 'watch',
      title: 'Keep the best 3',
      lines: ['Keep a min-heap of the k best so far (k = 3).', 'push x; if size > k, pop: the top is the weakest.', 'At the end: the k largest, and the top is the k-th largest.'],
      frames: TOPK_FRAMES,
    },
    {
      kind: 'turn',
      title: 'Your turn: the stream goes on',
      lines: ['The stream sends one more number: **6**.'],
      panels: [...pic(TOPK_H, {}, { cap: 4 }), vars({ next: 6, k: K })],
      task: { type: 'number', question: 'What is the 3rd largest now?', options: [5, 6, 7], answer: TOPK_H6[0], hint: '6 beats the weakest member, 5.' },
      solved: '6 pushes in, 5 is evicted. peek() = 6.',
      then: TOPK_6,
    },
    {
      kind: 'turn',
      title: 'Your turn: how big does it get?',
      lines: ['Same code, a stream of 10⁶ numbers, k = 3.'],
      panels: [...pic(TOPK_H6, {}, { cap: 4 }), vars({ n: '10⁶', k: K })],
      task: {
        type: 'choose',
        question: 'At most how many values does the heap hold at once?',
        options: [
          { text: '4: k + 1, just before the pop', why: '' },
          { text: '10⁶', why: 'Every push past k is followed by a pop.' },
          { text: '3, never more', why: 'push comes first, so for a moment size is k + 1.' },
        ],
        answer: 0,
      },
      solved: 'Size stays ≤ k + 1: O(k) memory, O(log k) per step.',
    },
    {
      kind: 'turn',
      title: 'Your turn: heap or quickselect?',
      lines: ['Quickselect: O(n) average, O(n²) worst.', 'Heap: O(n log k) always.'],
      panels: [arr([4, 1, 7, 3, 8, 5, '…'], { label: 'stream' }), vars({ k: K })],
      task: {
        type: 'choose',
        question: 'Numbers keep arriving. Which fits?',
        options: [
          { text: 'The size-k heap', why: '' },
          { text: 'Quickselect', why: 'It partitions a whole array; the heap is the one that works on streams.' },
          { text: 'Sort descending each time', why: 'O(n log n) per answer.' },
        ],
        answer: 0,
      },
      solved: 'Streams → heap. For a static array, offer quickselect as the optimisation.',
    },
  ],

  'optimized-two-heaps': [
    {
      kind: 'watch',
      title: 'Running median of 6, 2, 9',
      lines: ['`low`: max-heap, smaller half. `high`: min-heap, larger half.', 'add(x): push x to low, then move low’s top to high.', 'If high is bigger, move its top back to low.', 'Median: low.peek() if odd, else the average of the tops.'],
      frames: TW_WATCH,
    },
    {
      kind: 'turn',
      title: 'Your turn: add 4',
      lines: ['Continue: add(4).'],
      panels: twoPanels(TW_LOW1, TW_HIGH1, {}, { next: 4 }),
      task: { type: 'number', question: 'What is the median after adding 4?', options: [4, 5, 6], answer: TW_ADD4.median, hint: 'Four values: even count, average the two tops.' },
      solved: 'low {4, 2}, high {6, 9}: (4 + 6) / 2 = 5.',
      then: noSay(TW_ADD4.frames),
    },
    {
      kind: 'turn',
      title: 'Your turn: add 7',
      lines: ['Continue: add(7).', 'Watch which value crosses back.'],
      panels: twoPanels(TW_LOW2, TW_HIGH2, {}, { next: 7 }),
      task: {
        type: 'choose',
        question: 'Which value moves from high back to low?',
        options: [
          { text: '6', why: '' },
          { text: '7', why: '7 crosses to high, but then 6 is high’s top, and only the top moves.' },
          { text: 'None', why: 'high ends with 3 values and low with 2: a rebalance is needed.' },
        ],
        answer: 0,
      },
      solved: 'low {6, 4, 2}, high {7, 9}. Odd count: median = 6.',
      then: noSay(TW_ADD7.frames),
    },
    {
      kind: 'turn',
      title: 'Your turn: lazy deletion',
      lines: ['Sliding window: 2 leaves the window.', 'It is buried inside low, not at a top.'],
      panels: [heapTree(TW_LOW, { [TW_LOW.indexOf(2)]: 'bad' }, { cap: 3, label: 'low (max-heap)' }), heapTree(TW_HIGH, {}, { cap: 3, label: 'high (min-heap)' }), vars({ pending: '2' })],
      task: {
        type: 'choose',
        question: 'When is 2 actually removed from low?',
        options: [
          { text: 'When it reaches the top of the heap', why: '' },
          { text: 'Right now, by searching low for it', why: 'Searching a heap is O(n); lazy deletion avoids that.' },
          { text: 'Never, so it may be returned as a median', why: 'Tops are cleaned before every read: a stale value is never returned.' },
        ],
        answer: 0,
      },
      solved: 'Record 2 in a Map; pop it only when it surfaces at a top.',
    },
  ],

  'optimized-k-way-merge': [
    {
      kind: 'watch',
      title: 'Merge 3 sorted lists',
      lines: ['Push the first element of each list, with which list and position.', 'Pop the smallest head, append it to the output.', 'Push the next element of the same list.', 'Repeat until the heap is empty.'],
      frames: KW.frames.slice(0, 2),
    },
    {
      kind: 'turn',
      title: 'Your turn: after 2',
      lines: ['2 is the smallest head. It came from L1.'],
      panels: kwPanels(KW.snaps[KW_AT2].heap, KW.snaps[KW_AT2].out, KW.snaps[KW_AT2].popped),
      task: {
        type: 'choose',
        question: 'Pop 2. What is pushed next?',
        options: [
          { text: '5, the next element of L1', why: '' },
          { text: '3, the next smallest overall', why: '3 is already in the heap as L2’s head.' },
          { text: 'Nothing', why: 'L1 still has 5 left.' },
        ],
        answer: 0,
      },
      solved: 'Always the successor from the same list.',
      then: noSay([KW.frames[2]]),
    },
    {
      kind: 'turn',
      title: 'Your turn: heap size',
      lines: ['3 lists, 8 elements in total.'],
      panels: kwPanels(KW.snaps[2].heap, KW.snaps[2].out, KW.snaps[2].popped),
      task: { type: 'number', question: 'At most how many entries does the heap hold?', options: [2, 3, 8], answer: Math.max(...KW.snaps.map((s) => s.heap.length)), hint: 'One head per list.' },
      solved: 'Never more than k = 3: each step is O(log k).',
      then: noSay(KW.frames.slice(3)),
    },
    {
      kind: 'turn',
      title: 'Your turn: smallest range',
      lines: ['Range = [heap min, current max].', 'Advance the list that owns the minimum.'],
      panels: [table(['L0', 'L1', 'L2'], ['0', '1', '2'], LISTS.map((l) => [0, 1, 2].map((j) => (j < l.length ? l[j] : '—'))), [['done', 'active', ''], ['active', '', ''], ['active', '', '']]), arr(build([4, 2, 3]), { label: 'heap (min)' }), vars({ max: 4, range: '[2, 4]' })],
      task: {
        type: 'choose',
        question: 'Heads are 4, 2, 3. Which list advances?',
        options: [
          { text: 'L1, which owns the min 2', why: '' },
          { text: 'L0, which owns the max 4', why: 'The rule advances the list owning the minimum.' },
          { text: 'All three', why: 'One list advances per step.' },
        ],
        answer: 0,
      },
      solved: 'L1 advances to 5: heads 4, 5, 3.',
    },
  ],

  'optimized-scheduling': [
    {
      kind: 'watch',
      title: 'Reorganize "aaabb"',
      lines: ['Count letters; a max-heap by count.', 'Pop the most frequent, emit it.', 'Hold it out one step so it cannot repeat; then push it back.'],
      frames: RE1.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: "aaab"',
      lines: ['n = 4. Impossible when a letter appears more than ⌈n/2⌉ times.'],
      panels: [table(['a', 'b'], ['count'], [[3], [1]]), vars({ n: 4, 'ceil(n/2)': 2 })],
      task: {
        type: 'choose',
        question: 'Can "aaab" be reorganized?',
        options: [
          { text: 'No: a appears 3 > 2 times', why: '' },
          { text: 'Yes: "abaa"', why: 'The last two a’s are adjacent.' },
          { text: 'Yes: "aaba"', why: 'The first two a’s are adjacent.' },
        ],
        answer: 0,
      },
      solved: '3 > ⌈4/2⌉ = 2: impossible. The heap run gets stuck.',
      then: noSay(RE2.frames),
    },
    {
      kind: 'watch',
      title: 'IPO: unlock, then choose',
      lines: ['**Sort** projects by required capital.', 'Push every newly affordable profit into a **max-heap**.', 'Take the top: capital grows, more projects unlock.'],
      frames: IPO.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: task scheduler',
      lines: ['Tasks A A A B B, cooldown n = 2.', '`max(len, (maxFreq − 1)(n + 1) + countOfMax)`'],
      panels: [table(['A', 'B'], ['count'], [[SCHED.freq.A], [SCHED.freq.B]]), vars({ len: 5, n: 2 })],
      task: { type: 'number', question: 'How many slots are needed?', options: [5, 7, 8], answer: SCHED.ans, hint: 'maxFreq = 3, only A has it: (3 − 1)(2 + 1) + 1.' },
      solved: 'max(5, 2·3 + 1) = 7: A B _ A B _ A.',
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Wrong direction for Top K',
      lines: ['Goal: the 2 largest of 4, 1, 7, 3, 8.', 'A max-heap of size k evicts its top: the **best** value.', 'A min-heap evicts the weakest: right tool.'],
      frames: wrongDir,
    },
    {
      kind: 'turn',
      title: 'Your turn: the array is not sorted',
      lines: ['Only `heap[0]` is special.'],
      panels: [heapArr(H0)],
      task: { type: 'cell', question: 'Tap the second-smallest value.', answer: 2, hints: { 1: 'Index 1 holds 3. A heap array is not sorted.', 0: 'That is the smallest.' } },
      solved: 'The 2nd smallest, 2, sits at index 2, not index 1.',
    },
    {
      kind: 'turn',
      title: 'Your turn: test the comparator',
      lines: ['`new PriorityQueue((a, b) => b - a)`', 'Negative means a first. Test it on two values.'],
      panels: [vars({ a: 3, b: 9, 'b - a': 6 })],
      task: {
        type: 'choose',
        question: 'Push 3, then 9. Which is on top?',
        options: [
          { text: '9: cmp(9, 3) = −6 < 0, so 9 comes first', why: '' },
          { text: '3: it was pushed first', why: 'A heap is not FIFO; the comparator decides.' },
          { text: '3: the smaller value', why: 'b − a is negative when a is the larger one: larger first.' },
        ],
        answer: 0,
      },
      solved: '`b - a` is a max-heap.',
      then: SIGN.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: default sort',
      lines: ['`[10, 9, 1].sort()` with no comparator.'],
      panels: [arr([10, 9, 1], { label: 'before' })],
      task: { type: 'order', question: 'Tap the values in the order sort() leaves them.', items: LEX.map(String), hint: 'Without a comparator, numbers are compared as strings.' },
      solved: '"1" < "10" < "9" as strings. Always pass `(a, b) => a - b`.',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: tell the story',
      lines: ['"Find the kth largest."', 'Walk the interviewer through it.'],
      panels: [arr([4, 1, 7, 3, 8, 5], { label: 'nums' }), vars({ k: 3 })],
      task: { type: 'order', question: 'In what order do you present these?', items: ['Sort baseline: O(n log n)', 'Size-k min-heap: O(n log k)', 'Mention quickselect'], hint: 'Baseline first, then improve, then offer the alternative.' },
      solved: 'Baseline → heap (and why min-heap) → quickselect as the optimisation.',
    },
    {
      kind: 'turn',
      title: 'Your turn: before coding two heaps',
      lines: ['You are about to code a running median.'],
      panels: [heapTree(TPL_LOW, {}, { label: 'low (max)' }), heapTree(TPL_HIGH, {}, { label: 'high (min)' })],
      task: {
        type: 'choose',
        question: 'What do you state first?',
        options: [
          { text: 'Both invariants: order across heaps, size difference ≤ 1', why: '' },
          { text: 'Only the median formula', why: 'The formula is only right while both invariants hold.' },
          { text: 'Nothing: start writing the heap class', why: 'First ask whether you may assume a heap class.' },
        ],
        answer: 0,
      },
      solved: 'State both invariants, then code.',
    },
  ],
};
