// Step lessons for Sorting, first half (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every swap, comparison, merge take, partition and count below is produced by running the lesson's own code on the example.
// The second half (counting sort, comparators, preprocessing, dry run, mistakes, tips) lives in steps-2.js.
import secondHalf from './steps-2.js';
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const inside = (n, list) => list.filter((p) => p.index >= 0 && p.index < n);
const swap = (a, x, y) => ([a[x], a[y]] = [a[y], a[x]]);
const pad = (vals, n) => [...vals, ...Array(n - vals.length).fill('·')];
// tagged keys: equal numbers told apart by a letter, e.g. 5a / 5b
const T = (k, t = '') => ({ k, t });
const show = (x) => (typeof x === 'object' ? `${x.k}${x.t}` : x);
const key = (x) => (typeof x === 'object' ? x.k : x);

// ---------- merge of two sorted lists (the lesson's `<=` merge), one record per take ----------
function mergeRun(L, R) {
  const out = [],
    steps = [];
  let i = 0,
    j = 0;
  while (i < L.length && j < R.length) {
    const left = key(L[i]) <= key(R[j]);
    const v = left ? L[i] : R[j];
    steps.push({ i, j, from: left ? 'L' : 'R', v, add: left ? 0 : L.length - i, cmp: true, out: [...out, v] });
    out.push(v);
    left ? i++ : j++;
  }
  while (i < L.length) {
    steps.push({ i, j, from: 'L', v: L[i], add: 0, cmp: false, out: [...out, L[i]] });
    out.push(L[i++]);
  }
  while (j < R.length) {
    steps.push({ i, j, from: 'R', v: R[j], add: 0, cmp: false, out: [...out, R[j]] });
    out.push(R[j++]);
  }
  return steps;
}
// pointers sit where they were BEFORE the take; taken cells are muted
const mergePanels = (L, R, s, extra = []) => {
  const n = L.length + R.length;
  const ip = s.from === 'L' ? s.i : -1;
  const jp = s.from === 'R' ? s.j : -1;
  return [
    arr(L.map(show), { label: 'left', pointers: inside(L.length, [ptr(s.i, 'i')]), highlights: hl(L.length, (k) => (k === ip ? 'active' : k < s.i ? 'muted' : '')) }),
    arr(R.map(show), { label: 'right', pointers: inside(R.length, [ptr(s.j, 'j', 'b')]), highlights: hl(R.length, (k) => (k === jp ? 'active' : k < s.j ? 'muted' : '')) }),
    arr(pad(s.out.map(show), n), { label: 'out', highlights: hl(n, (k) => (k === s.out.length - 1 ? 'active' : k < s.out.length ? 'done' : '')) }),
    ...extra,
  ];
};
const mergeNote = (s) =>
  s.cmp ? `${show(s.v)}: ${s.from === 'L' ? 'left' : 'right'} wins the comparison → out.` : `The other side is empty: copy leftover ${show(s.v)}.`;

// ---------- what ----------
const WHAT_IN = [5, 2, 9, 1, 5];
const WHAT_OUT = [...WHAT_IN].sort((a, b) => a - b);
const TAGGED = [T(5, 'a'), T(2), T(9), T(1), T(5, 'b')];
const STABLE = [...TAGGED].sort((a, b) => a.k - b.k); // JS sort is stable (ES2019)

// ---------- why ----------
const DUP = [3, 8, 1, 6, 8, 2];
const BRUTE_ROWS = (() => {
  const rows = [];
  let checks = 0;
  for (let i = 0; i < DUP.length; i++) {
    for (let j = i + 1; j < DUP.length; j++) {
      checks++;
      if (DUP[i] === DUP[j]) {
        rows.push({ i, j, checks, found: true });
        return rows;
      }
    }
    rows.push({ i, checks, found: false });
  }
  return rows;
})();
const DUP_S = [...DUP].sort((x, y) => x - y);
const DUP_SCAN = (() => {
  for (let i = 1; i < DUP_S.length; i++) if (DUP_S[i] === DUP_S[i - 1]) return i;
  return -1;
})();
const PAIRS = DUP.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
const PAIR_HIT = PAIRS.findIndex((p, k) => k > 0 && p[0] === PAIRS[k - 1][0]);

// ---------- intuition ----------
const INT_A = [6, 3, 8, 1, 5];
const INT_MID = INT_A.length >> 1;
const INT_HALVES = [...INT_A.slice(0, INT_MID).sort((a, b) => a - b), ...INT_A.slice(INT_MID).sort((a, b) => a - b)];

// Lomuto partition of a[lo..hi] with the pivot already at a[hi]; one record per loop step
function lomuto(a0, lo, hi) {
  const a = [...a0],
    pivot = a[hi],
    out = [];
  let store = lo;
  for (let i = lo; i < hi; i++) {
    const v = a[i],
      less = v < pivot,
      at = store;
    if (less) {
      swap(a, i, store);
      store++;
    }
    out.push({ i, v, less, at, store, a: [...a] });
  }
  swap(a, store, hi);
  out.push({ final: true, store, a: [...a] });
  return out;
}
const INT_LOM = lomuto(INT_A, 0, INT_A.length - 1);
const INT_P = INT_LOM.at(-1);

// lower bound: orderings of a, b, c that survive each comparison (worst branch followed)
const PERMS = ['abc', 'acb', 'bac', 'bca', 'cab', 'cba'];
const LB = (() => {
  const qs = [
    ['a', 'b'],
    ['b', 'c'],
    ['a', 'c'],
  ];
  let alive = PERMS.slice();
  const out = [];
  for (const [x, y] of qs) {
    if (alive.length === 1) break;
    const yes = alive.filter((p) => p.indexOf(x) < p.indexOf(y));
    const no = alive.filter((p) => p.indexOf(x) > p.indexOf(y));
    const keepYes = yes.length >= no.length;
    alive = keepYes ? yes : no;
    out.push({ q: `${x} before ${y}?`, ans: keepYes ? 'yes' : 'no', split: `${yes.length} / ${no.length}`, alive: alive.slice() });
  }
  return out;
})();
const permPanel = (alive, label) => arr(PERMS, { label, showIndices: false, highlights: hl(6, (k) => (alive.includes(PERMS[k]) ? 'active' : 'muted')) });
const FACT4 = 24;
const LB4 = Math.ceil(Math.log2(FACT4)); // 5

// ---------- brute force ----------
function selectionRun(a0) {
  const a = [...a0],
    out = [];
  let comps = 0;
  for (let i = 0; i < a.length - 1; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) {
      comps++;
      if (key(a[j]) < key(a[m])) m = j;
    }
    const before = [...a];
    swap(a, i, m);
    out.push({ i, m, before, a: [...a], pass: a.length - 1 - i, comps });
  }
  return out;
}
const SEL_A = [5, 3, 4, 1, 2];
const SEL = selectionRun(SEL_A);
const SEL_TAG = [T(2, 'a'), T(2, 'b'), T(1)];
const SEL_T = selectionRun(SEL_TAG);

// insertion sort, the lesson's code; the cell being moved is shown as a gap '·'
function insertionRun(a0) {
  const a = [...a0],
    out = [];
  let shifts = 0;
  for (let i = 1; i < a.length; i++) {
    const x = a[i];
    let j = i - 1;
    const view = () => a.map((v, k) => v);
    const gapView = (g) => view().map((v, k) => (k === g ? '·' : v));
    out.push({ kind: 'pick', i, x, gap: i, vals: gapView(i), shifts });
    while (j >= 0 && a[j] > x) {
      a[j + 1] = a[j];
      shifts++;
      out.push({ kind: 'shift', i, x, from: j, gap: j, vals: gapView(j), shifts });
      j--;
    }
    a[j + 1] = x;
    out.push({ kind: 'place', i, x, at: j + 1, vals: view(), shifts });
  }
  return out;
}
const INS_A = [4, 2, 3, 1];
const INS = insertionRun(INS_A);
const INS_B = [3, 1, 4, 2, 5];
const INS_BR = insertionRun(INS_B);
const INS_B_SHIFTS = INS_BR.at(-1).shifts;
const insPanels = (s, n, label) => [
  arr(s.vals, {
    label,
    pointers: s.kind === 'place' ? [ptr(s.at, 'x lands')] : [ptr(s.gap, 'gap')],
    highlights: hl(n, (k) => (s.kind === 'place' ? (k === s.at ? 'done' : k <= s.i ? 'window' : '') : k === s.gap ? 'active' : k === s.from + 1 ? 'visited' : k < s.i + 1 ? 'window' : '')),
  }),
  vars({ x: s.x, i: s.i, shifts: s.shifts }),
];
const insNote = (s) =>
  s.kind === 'pick' ? `i = ${s.i}: lift x = ${s.x} out.` : s.kind === 'shift' ? `a[${s.from}] = ${s.vals[s.from + 1]} > ${s.x}: shift it right.` : `Nothing bigger to the left: put ${s.x} at index ${s.at}.`;
const insFrames = (run, n, label, say) => run.map((s) => ({ say: say(s), note: insNote(s), panels: insPanels(s, n, label) }));

// ---------- intuition-merge-sort ----------
const MS_L = [38, 27, 43].sort((a, b) => a - b);
const MS_R = [3, 9, 82, 10].sort((a, b) => a - b);
const MS_RUN = mergeRun(MS_L, MS_R);
const LO_L = [2, 4, 9, 11];
const LO_R = [3, 5, 6];
const LO_RUN = mergeRun(LO_L, LO_R);
const LO_LEFT = LO_RUN.filter((s) => !s.cmp).length;
const LO_CUT = LO_RUN.findIndex((s) => !s.cmp);

// merge-sort split tree (the slice template: mid = length >> 1); leaves get x = 0, 1.5, 3, …
const TREE_A = [38, 27, 43, 3, 9];
const TREE = (() => {
  const nodes = [],
    edges = [],
    merges = [];
  let leaf = 0;
  function build(a, depth, parent) {
    const id = `n${nodes.length}`;
    const node = { id, vals: a, depth, x: 0 };
    nodes.push(node);
    if (parent) edges.push({ from: parent, to: id });
    if (a.length <= 1) {
      node.x = leaf++ * 1.5;
      node.sorted = a;
      return node;
    }
    const mid = a.length >> 1;
    const l = build(a.slice(0, mid), depth + 1, id);
    const r = build(a.slice(mid), depth + 1, id);
    node.x = (l.x + r.x) / 2;
    node.sorted = mergeRun(l.sorted, r.sorted).at(-1).out;
    merges.push(id);
    return node;
  }
  build(TREE_A, 0, null);
  return { nodes, edges, merges, depth: Math.max(...nodes.map((n) => n.depth)) };
})();
// show: nodes up to depth d; merged: ids already merged; cur: the id just merged
const treePanel = (d, merged = [], cur = null) => ({
  kind: 'nodes',
  label: 'merge sort calls',
  nodes: TREE.nodes.map((n) => ({
    id: n.id,
    label: (merged.includes(n.id) || n.vals.length === 1 ? n.sorted : n.vals).join(','),
    x: n.x,
    y: n.depth * 1.2,
    state: n.depth > d ? 'hidden' : n.id === cur ? 'active' : merged.includes(n.id) || (n.vals.length === 1 && merged.length) ? 'done' : '',
  })),
  edges: TREE.edges,
});
const TREE_FRAMES = [
  ...Array.from({ length: TREE.depth + 1 }, (_, d) => ({
    say: d === TREE.depth ? 3 : 0,
    note: d === 0 ? 'Start with the whole array.' : d === TREE.depth ? 'Every piece has 1 element: the base case.' : `Split each piece longer than 1 in half (level ${d}).`,
    panels: [treePanel(d)],
  })),
  ...TREE.merges.map((id, k) => {
    const n = TREE.nodes.find((x) => x.id === id);
    return { say: 2, note: `Merge two sorted children → ${n.sorted.join(', ')}.`, panels: [treePanel(TREE.depth, TREE.merges.slice(0, k + 1), id)] };
  }),
];

// ---------- optimized-merge-sort ----------
const LEVELS = (() => {
  const rows = [];
  for (let size = 8, merges = 1; size > 1; size /= 2, merges *= 2) rows.push([merges, size, merges * size]);
  return rows;
})();
const LEVEL_TOTAL = LEVELS.reduce((s, r) => s + r[2], 0);
const ST_L = [T(1), T(5, 'a')];
const ST_R = [T(5, 'b'), T(7)];
const ST_RUN = mergeRun(ST_L, ST_R);
const INV_L = [2, 6, 7];
const INV_R = [1, 3, 8];
const INV_RUN = mergeRun(INV_L, INV_R);
const INV_TOTAL = INV_RUN.reduce((s, x) => s + x.add, 0);
const brute = (L, R) => L.reduce((s, x) => s + R.filter((y) => x > y).length, 0);
const INV2_L = [5, 8, 9];
const INV2_R = [1, 2, 6];
const INV2_RUN = mergeRun(INV2_L, INV2_R);
const INV2_TOTAL = INV2_RUN.reduce((s, x) => s + x.add, 0);
if (INV_TOTAL !== brute(INV_L, INV_R) || INV2_TOTAL !== brute(INV2_L, INV2_R)) throw new Error('inversion count mismatch');
const invFrames = (L, R, run, say) => {
  let total = 0;
  return run.map((s) => {
    total += s.add;
    return {
      say: say(s),
      note: s.add ? `${s.v} from the right beats ${L[s.i]}: left[${s.i}..] are all bigger → +${s.add}.` : s.cmp ? `${s.v} from the left: no inversion added.` : `Leftover ${s.v}: no comparison, nothing added.`,
      panels: mergePanels(L, R, s, [vars({ 'left.length − i': s.add ? s.add : '—', inversions: total })]).filter((_, k) => k !== 2),
    };
  });
};

// ---------- template-merge-sort (shared buffer, half-open ranges) ----------
function msTemplate(a0) {
  const a = [...a0],
    buf = new Array(a.length),
    ev = [];
  let writes = 0;
  function sort(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1;
    ev.push({ kind: 'split', lo, mid, hi, a: [...a] });
    sort(lo, mid);
    sort(mid, hi);
    let i = lo,
      j = mid,
      k = lo;
    while (i < mid && j < hi) buf[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    for (let t = lo; t < hi; t++, writes++) a[t] = buf[t];
    ev.push({ kind: 'merge', lo, mid, hi, a: [...a] });
  }
  sort(0, a.length);
  return { ev, a, writes };
}
const TM_A = [6, 2, 5, 1];
const TM = msTemplate(TM_A);
const tmPanels = (e) => [
  arr(e.a, {
    label: 'a',
    range: [e.lo, e.hi - 1],
    pointers: e.kind === 'split' ? [ptr(e.lo, 'lo'), ptr(e.mid, 'mid', 'b')] : [],
    highlights: hl(e.a.length, (k) => (k < e.lo || k >= e.hi ? 'muted' : e.kind === 'merge' ? 'done' : k < e.mid ? 'window' : 'visited')),
  }),
  vars({ lo: e.lo, mid: e.mid, hi: e.hi }),
];
const W8 = [7, 3, 8, 2, 6, 1, 5, 4];
const W8_WRITES = msTemplate(W8).writes; // 24
const CELL_LO = 3,
  CELL_HI = 7,
  CELL_MID = (CELL_LO + CELL_HI) >> 1;

// ---------- implementation-merge-sort: countInversions, every comparison recorded ----------
function countInvRun(nums) {
  const a = [...nums],
    buf = new Array(a.length),
    ev = [];
  let total = 0;
  function sort(lo, hi) {
    if (hi - lo <= 1) return 0;
    const mid = (lo + hi) >> 1;
    let count = sort(lo, mid) + sort(mid, hi);
    let i = lo,
      j = mid,
      k = lo;
    while (i < mid && j < hi) {
      const snap = { lo, mid, hi, i, j, a: [...a], ai: a[i], aj: a[j] };
      if (a[i] <= a[j]) {
        buf[k++] = a[i++];
        ev.push({ ...snap, add: 0, total, buf: buf.slice(lo, k) });
      } else {
        count += mid - i;
        total += mid - i;
        buf[k++] = a[j++];
        ev.push({ ...snap, add: mid - snap.i, total, buf: buf.slice(lo, k) });
      }
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    for (let t = lo; t < hi; t++) a[t] = buf[t];
    ev.push({ kind: 'done', lo, mid, hi, a: [...a], total });
    return count;
  }
  const result = sort(0, a.length);
  return { ev, result };
}
const CI_A = [4, 1, 3, 2];
const CI = countInvRun(CI_A);
const ciPanels = (e) => {
  const n = e.a.length;
  if (e.kind === 'done')
    return [arr(e.a, { label: 'a', range: [e.lo, e.hi - 1], highlights: hl(n, (k) => (k >= e.lo && k < e.hi ? 'done' : 'muted')) }), vars({ lo: e.lo, mid: e.mid, hi: e.hi, count: e.total })];
  return [
    arr(e.a, {
      label: 'a',
      range: [e.lo, e.hi - 1],
      pointers: [ptr(e.i, 'i'), ptr(e.j, 'j', 'b')],
      highlights: hl(n, (k) => (k === e.i || k === e.j ? 'active' : k < e.lo || k >= e.hi ? 'muted' : k < e.mid ? 'window' : 'visited')),
    }),
    arr(pad(e.buf, e.hi - e.lo), { label: `buf[${e.lo}..${e.hi})`, indexBase: e.lo, highlights: hl(e.hi - e.lo, (k) => (k === e.buf.length - 1 ? 'active' : k < e.buf.length ? 'done' : '')) }),
    vars({ 'mid − i': e.add ? e.add : '—', count: e.total }),
  ];
};
const ciNote = (e) =>
  e.kind === 'done'
    ? `Copy buf back: a[${e.lo}..${e.hi}) is sorted. count = ${e.total}.`
    : e.add
      ? `a[i] = ${e.ai} > a[j] = ${e.aj}: take ${e.aj}, count += mid − i = ${e.add}.`
      : `a[i] = ${e.ai} <= a[j] = ${e.aj}: take ${e.ai}, nothing added.`;
const CI2_A = [2, 1, 2];
const CI2 = countInvRun(CI2_A);

// ---------- intuition-quick-sort ----------
const Q_A = [7, 2, 9, 4, 3];
const Q_R = 3; // the random pick lands on 4
const Q_SW = (() => {
  const a = [...Q_A];
  swap(a, Q_R, a.length - 1);
  return a;
})();
const Q_LOM = lomuto(Q_SW, 0, Q_SW.length - 1);
const Q_FIN = Q_LOM.at(-1);
const lomPanels = (s, n, lo, hi, label) => {
  const st = s.final ? s.store : s.store;
  return [
    arr(s.a, {
      label,
      range: [lo, hi],
      pointers: s.final ? [ptr(s.store, 'pivot')] : inside(n, [ptr(s.i, 'i'), ...(s.store !== s.i ? [ptr(s.store, 'store', 'b')] : [])]),
      highlights: hl(n, (k) =>
        k < lo || k > hi ? 'muted' : s.final ? (k === s.store ? 'done' : k < s.store ? 'window' : 'visited') : k === hi ? 'bad' : k < st ? 'window' : k === s.i ? 'active' : k < s.i + 1 ? 'visited' : '',
      ),
    }),
    vars({ pivot: s.final ? s.a[s.store] : s.a[hi], store: st }),
  ];
};
const lomNote = (s, pivot) =>
  s.final ? `Swap the pivot into a[store]: ${pivot} sits at index ${s.store}, its final place.` : s.less ? `${s.v} < ${pivot}: swap it to a[${s.at}], store = ${s.store}.` : `${s.v} ≥ ${pivot}: leave it, store stays ${s.store}.`;
const lomFrames = (run, n, lo, hi, label, say) => run.map((s) => ({ say: say(s), note: lomNote(s, run.at(-1).a[run.at(-1).store]), panels: lomPanels(s, n, lo, hi, label) }));
const Q2_A = [6, 1, 8, 3, 5];
const Q2_LOM = lomuto(Q2_A, 0, Q2_A.length - 1);
const Q2_AT = Q2_LOM.at(-1).store;

// ---------- optimized-quick-sort ----------
// 2-way (Lomuto) quickSort on all-equal values: count comparisons per call
const EQ = [3, 3, 3, 3, 3];
const EQ_CALLS = (() => {
  const out = [];
  (function qs(lo, hi) {
    if (lo >= hi) return;
    const run = lomuto(EQ, lo, hi); // values never change, the pivot lands at store
    const p = run.at(-1).store;
    out.push({ lo, hi, p, comps: hi - lo });
    qs(lo, p - 1);
    qs(p + 1, hi);
  })(0, EQ.length - 1);
  return out;
})();
const EQ_TOTAL = EQ_CALLS.reduce((s, c) => s + c.comps, 0);

function partition3(a, lo, hi, pivot) {
  let lt = lo,
    i = lo,
    gt = hi;
  const ev = [];
  while (i <= gt) {
    const v = a[i];
    let act;
    if (a[i] < pivot) {
      swap(a, lt, i);
      lt++;
      i++;
      act = 'lt';
    } else if (a[i] > pivot) {
      swap(a, i, gt);
      gt--;
      act = 'gt';
    } else {
      i++;
      act = 'eq';
    }
    ev.push({ v, act, lt, i, gt, a: [...a] });
  }
  return { lt, gt, ev };
}
const EQ3 = partition3([...EQ], 0, EQ.length - 1, 3);

// quickselect with Lomuto, pivot = the last cell of the range (as if the random pick chose it)
const QS_A = [6, 2, 9, 1, 7, 3, 5];
const QS_K = 5;
const QS_RUN = (() => {
  let a = [...QS_A],
    lo = 0,
    hi = a.length - 1;
  const out = [];
  for (;;) {
    const run = lomuto(a, lo, hi);
    a = run.at(-1).a;
    const p = run.at(-1).store;
    out.push({ lo, hi, p, a: [...a], scanned: hi - lo + 1 });
    if (p === QS_K) return out;
    if (QS_K < p) hi = p - 1;
    else lo = p + 1;
  }
})();
const QS_ANS = [...QS_A].sort((x, y) => x - y)[QS_K];
if (QS_RUN.at(-1).a[QS_K] !== QS_ANS) throw new Error('quickselect mismatch');
const HALVES64 = (() => {
  let s = 0;
  for (let n = 64; n >= 1; n /= 2) s += n;
  return s;
})(); // 127
const M3 = [10, 20, 30, 40, 50, 60, 70];
const M3_MID = (0 + M3.length - 1) >> 1;

// ---------- template-quick-sort ----------
const TQ_A = [4, 7, 1, 9, 3, 6];
const TQ_R = 0;
const TQ_SW = (() => {
  const a = [...TQ_A];
  swap(a, TQ_R, a.length - 1);
  return a;
})();
const TQ_LOM = lomuto(TQ_SW, 0, TQ_SW.length - 1);
const DF_A = [2, 0, 2, 1, 1, 0];
const DF = partition3([...DF_A], 0, DF_A.length - 1, 1);
const dfPanels = (vals, lt, i, gt, label, done = false) => {
  const n = vals.length;
  return [
    arr(vals, {
      label,
      pointers: done ? [ptr(lt, 'lt'), ptr(gt, 'gt', 'b')] : inside(n, [ptr(lt, 'lt'), ...(i !== lt ? [ptr(i, 'i', 'b')] : []), ...(gt !== i && gt !== lt ? [ptr(gt, 'gt', 'b')] : [])]),
      highlights: hl(n, (k) => (k < lt ? 'window' : k > gt ? 'visited' : k < i ? 'done' : !done && k === i ? 'active' : done ? 'done' : '')),
    }),
    vars({ lt, i, gt }),
  ];
};
const dfNote = (e, pivot) =>
  e.act === 'lt' ? `${e.v} < ${pivot}: swap to lt, lt++ and i++.` : e.act === 'gt' ? `${e.v} > ${pivot}: swap with a[gt], gt--. i stays.` : `${e.v} = ${pivot}: i++.`;
const DF_GT = DF.ev.findIndex((e) => e.act === 'gt');
const DF_GT_E = DF.ev[DF_GT];
const P3_A = [3, 1, 3, 2, 3, 4];
const P3 = partition3([...P3_A], 0, P3_A.length - 1, 3);

// ---------- implementation-quick-sort: quickselect with partition3 ----------
function quickselectRun(nums, k, picks) {
  const a = [...nums],
    out = [];
  let lo = 0,
    hi = a.length - 1;
  for (const r of picks) {
    const before = [...a];
    const pivot = a[r];
    const { lt, gt } = partition3(a, lo, hi, pivot);
    const act = k < lt ? 'hi' : k > gt ? 'lo' : 'found';
    out.push({ lo, hi, r, pivot, before, lt, gt, act, a: [...a] });
    if (act === 'found') return out;
    if (act === 'hi') hi = lt - 1;
    else lo = gt + 1;
  }
  throw new Error('quickselect needs more picks');
}
const QI_A = [5, 1, 5, 3, 5, 2, 5];
const QI_K = 4;
const QI = quickselectRun(QI_A, QI_K, [3, 3]); // r = 3 both rounds: pivot 3, then a 5
if (QI.at(-1).a[QI_K] !== [...QI_A].sort((x, y) => x - y)[QI_K]) throw new Error('quickselect3 mismatch');
const qiPanels = (s, after = true) => {
  const vals = after ? s.a : s.before;
  const n = vals.length;
  return [
    arr(vals, {
      label: `a, k = ${QI_K}`,
      range: [s.lo, s.hi],
      pointers: after ? [ptr(s.lt, 'lt'), ...(s.gt !== s.lt ? [ptr(s.gt, 'gt', 'b')] : [])] : [ptr(s.r, 'r')],
      highlights: hl(n, (k) => (k < s.lo || k > s.hi ? 'muted' : !after ? (k === s.r ? 'active' : '') : k >= s.lt && k <= s.gt ? (s.act === 'found' && k === QI_K ? 'done' : 'window') : '')),
    }),
    vars(after ? { lt: s.lt, gt: s.gt, k: QI_K } : { lo: s.lo, hi: s.hi, pivot: s.pivot }),
  ];
};
const QJ_A = [4, 6, 1, 4, 4];
const QJ_K = 4;
const QJ = quickselectRun(QJ_A, QJ_K, [0, 4]);
const QJ_1 = QJ[0];

export default {
  what: [
    {
      kind: 'watch',
      title: 'Into order, and stable',
      lines: ['**Sorting** puts items in order: here, small to large.', '**Stable**: equal items keep their original relative order.', 'Tag the two 5s as `5a` and `5b` to watch them.'],
      frames: [
        { say: 0, note: 'Unsorted input.', panels: [arr(WHAT_IN, { label: 'input' })] },
        { say: 0, note: `Sorted: ${WHAT_OUT.join(', ')}.`, panels: [arr(WHAT_OUT, { label: 'sorted', highlights: hl(5, () => 'done') })] },
        { say: 2, note: '5a comes before 5b in the input.', panels: [arr(TAGGED.map(show), { label: 'input, 5s tagged', highlights: { 0: 'active', 4: 'active' } })] },
        { say: 1, note: 'A stable sort keeps 5a before 5b.', panels: [arr(STABLE.map(show), { label: 'stable', highlights: hl(5, (k) => (key(STABLE[k]) === 5 ? 'done' : '')) })] },
        {
          say: 1,
          note: 'Same numbers, but 5b jumped ahead of 5a: unstable.',
          panels: [arr(STABLE.map((x) => (x.k === 5 ? (x.t === 'a' ? '5b' : '5a') : show(x))), { label: 'unstable', highlights: hl(5, (k) => (key(STABLE[k]) === 5 ? 'bad' : '')) })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: read a comparator',
      lines: ['A **comparator** `(a, b) => number` decides the order.', 'Negative: a first. Positive: b first. Zero: tie.'],
      panels: [arr([7, 3], { label: 'a, b' }), vars({ a: 7, b: 3, 'a − b': 4 })],
      task: {
        type: 'choose',
        question: 'The comparator `(a, b) => a - b` returns **4** for a = 7, b = 3. Which goes first?',
        options: [
          { text: '3 (b) goes first', why: '' },
          { text: '7 (a) goes first', why: 'Only a **negative** result puts a first.' },
          { text: "It's a tie: keep the order", why: 'Only **zero** means a tie.' },
        ],
        answer: 0,
      },
      solved: 'Positive means b first, so 3 comes before 7: ascending order.',
      then: [{ say: 1, note: 'Positive → b first.', panels: [arr([3, 7], { label: 'ordered', highlights: { 0: 'done', 1: 'done' } })] }],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Duplicates: pairs vs neighbours',
      lines: ['Brute force compares every pair `i < j`: **O(n²)**.', 'Sort first: equal values become **adjacent**.', 'Then one scan of neighbours finds them: **O(n log n)** in total.'],
      frames: [
        ...BRUTE_ROWS.map((r) => ({
          say: 0,
          note: r.found ? `a[${r.i}] = a[${r.j}] = ${DUP[r.i]}: found after ${r.checks} pair checks.` : `i = ${r.i}: compared with every later item, no match.`,
          panels: [
            arr(DUP, {
              label: 'a',
              pointers: r.found ? [ptr(r.i, 'i'), ptr(r.j, 'j', 'b')] : [ptr(r.i, 'i')],
              highlights: hl(DUP.length, (k) => (r.found ? (k === r.i || k === r.j ? 'done' : '') : k === r.i ? 'active' : k > r.i ? 'visited' : '')),
            }),
            vars({ 'pair checks': r.checks }),
          ],
        })),
        { say: 1, note: 'Sort a copy: the two 8s are now side by side.', panels: [arr(DUP_S, { label: 's = sorted copy' }), vars({ 'pair checks': '—' })] },
        {
          say: 2,
          note: `s[${DUP_SCAN}] === s[${DUP_SCAN - 1}]: duplicate found by comparing neighbours.`,
          panels: [arr(DUP_S, { label: 's = sorted copy', pointers: [ptr(DUP_SCAN, 'i')], highlights: hl(DUP_S.length, (k) => (k === DUP_SCAN || k === DUP_SCAN - 1 ? 'done' : k < DUP_SCAN ? 'visited' : '')) }), vars({ 'neighbour checks': DUP_SCAN })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the question asks for indices',
      lines: ['Same array, new question:', '"Return the **indices** of two equal values."'],
      panels: [arr(DUP, { label: 'a' })],
      task: {
        type: 'choose',
        question: 'Can sorting still help?',
        options: [
          { text: 'Yes: sort `[value, originalIndex]` pairs', why: '' },
          { text: 'Yes: sort the values, then read the indices', why: 'Sorting the bare values moves them; their original indices are lost.' },
          { text: 'No: sorting can never be used here', why: 'The index can travel **with** the value inside a pair.' },
        ],
        answer: 0,
      },
      solved: 'The answer depends on positions, so sort pairs: each value carries its original index.',
      then: [
        {
          say: 1,
          note: `Sorted pairs value@index: the 8s came from indices ${PAIRS[PAIR_HIT - 1][1]} and ${PAIRS[PAIR_HIT][1]}.`,
          panels: [arr(PAIRS.map(([v, i]) => `${v}@${i}`), { label: 'sorted pairs', highlights: hl(6, (k) => (k === PAIR_HIT || k === PAIR_HIT - 1 ? 'done' : '')) })],
        },
      ],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Situation → tool',
      lines: ['Match the situation to the tool.', 'Most of the time, the built-in sort with a comparator is enough.'],
      frames: (() => {
        const rows = ['general code', 'guaranteed / stable / list', 'in place, k-th', 'small int range', 'linear, big ints', 'unusual order', 'order-free answer'];
        const tool = ['arr.sort(cmp)', 'merge sort', 'quick sort / select', 'counting sort', 'radix / bucket', 'comparator', 'sort first'];
        return rows.map((_, f) => ({
          say: f === 0 ? 1 : 0,
          note: `${rows[f]} → ${tool[f]}.`,
          panels: [table(rows, ['tool'], tool.map((t, i) => [i <= f ? t : '?']), tool.map((_, i) => [i === f ? 'active' : i < f ? 'done' : '']))],
        }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: sort a linked list',
      lines: ['You must sort a **linked list** of numbers.'],
      panels: [{ kind: 'list', values: [4, 1, 3, 2], next: [1, 2, 3, null] }],
      task: {
        type: 'choose',
        question: 'Which tool does the table point to?',
        options: [
          { text: 'Merge sort', why: '' },
          { text: 'Quick sort / quickselect', why: 'That row is for in place, or for only the k-th element.' },
          { text: 'Counting sort', why: 'Nothing says the values sit in a small range.' },
          { text: 'A custom comparator', why: 'The order here is plain ascending, nothing unusual.' },
        ],
        answer: 0,
      },
      solved: 'Sorting a linked list sits on the merge sort row, next to "guaranteed O(n log n)" and "stable".',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'The reading checklist',
      lines: ['Ask five questions while reading the problem.', 'Each "yes" points at one sorting tool.'],
      frames: (() => {
        const qs = ['shuffle-proof?', 'values bounded?', 'pairs i < j?', 'weird order?', 'one position?'];
        const go = ['sort first', 'counting sort', 'merge step', 'comparator', 'quickselect'];
        return qs.map((_, f) => ({
          say: f === 0 ? 0 : 1,
          note: `${qs[f]} → ${go[f]}.`,
          panels: [table(qs, ['think of'], go.map((g, i) => [i <= f ? g : '?']), go.map((_, i) => [i === f ? 'active' : i < f ? 'done' : '']))],
        }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: a pair count',
      lines: ['"How many pairs `i < j` have `a[i] > a[j]`?"'],
      panels: [arr([5, 2, 6, 1], { label: 'a' })],
      task: {
        type: 'choose',
        question: 'Which sorting idea fits?',
        options: [
          { text: 'The merge step of merge sort', why: '' },
          { text: 'Counting sort', why: 'Nothing bounds the values; that clue is missing.' },
          { text: 'Quickselect', why: 'It finds one position. This asks for a count over all pairs.' },
          { text: 'A custom comparator', why: 'The order is not weird; the work is counting pairs.' },
        ],
        answer: 0,
      },
      solved: 'A pair count over `i < j` is clue 3: think of the merge step.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Split by position vs split by value',
      lines: ['**Merge sort**: split by position (free), then merge (the work).', '**Quick sort**: split by value around a pivot (the work), combine does nothing.'],
      frames: [
        { say: 0, note: `Split by position at mid = ${INT_MID}. No comparisons.`, panels: [arr(INT_A, { label: 'merge sort', highlights: hl(5, (k) => (k < INT_MID ? 'window' : 'visited')) })] },
        { say: 0, note: 'Each half sorted (recursive calls).', panels: [arr(INT_HALVES, { label: 'merge sort', highlights: hl(5, (k) => (k < INT_MID ? 'window' : 'visited')) })] },
        { say: 0, note: 'Merging the halves is where the comparing happens.', panels: [arr(mergeRun(INT_HALVES.slice(0, INT_MID), INT_HALVES.slice(INT_MID)).at(-1).out, { label: 'merge sort', highlights: hl(5, () => 'done') })] },
        { say: 1, note: `Quick sort: pivot ${INT_A.at(-1)}.`, panels: [arr(INT_A, { label: 'quick sort', highlights: { 4: 'bad' } })] },
        {
          say: 1,
          note: `Partition: smaller left, larger right. ${INT_A.at(-1)} is in its final place.`,
          panels: [arr(INT_P.a, { label: 'quick sort', highlights: hl(5, (k) => (k === INT_P.store ? 'done' : k < INT_P.store ? 'window' : 'visited')) })],
        },
        {
          say: 1,
          note: 'Sort each side in place. Nothing to combine.',
          panels: [arr([...INT_P.a].sort((x, y) => x - y), { label: 'quick sort', highlights: hl(5, () => 'done') })],
        },
      ],
    },
    {
      kind: 'watch',
      title: 'Why comparisons need n log n',
      lines: ['3 items have `3! = 6` possible orderings.', 'Each yes/no comparison can at best cut them in half.', 'Following the bigger half, it takes 3 comparisons to reach 1.'],
      frames: [
        { say: 0, note: 'Six orderings are possible before any comparison.', panels: [permPanel(PERMS, 'possible orderings'), vars({ comparisons: 0, left: 6 })] },
        ...LB.map((s, k) => ({
          say: k === 0 ? 1 : 2,
          note: `"${s.q}" splits them ${s.split}. Worst case: ${s.ans} → ${s.alive.length} left.`,
          panels: [permPanel(s.alive, 'possible orderings'), vars({ comparisons: k + 1, left: s.alive.length })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: four items',
      lines: ['Now sort **4** items with comparisons.', '`4! = 24` orderings are possible.'],
      panels: [vars({ n: 4, 'n!': FACT4, '2^4': 16, '2^5': 32 })],
      task: { type: 'number', question: 'In the worst case, at least how many comparisons are needed?', options: [4, LB4, 6, FACT4], answer: LB4, hint: 'k comparisons can tell apart at most 2^k orderings. Find the smallest 2^k ≥ 24.' },
      solved: `2^4 = 16 < 24 ≤ 32 = 2^5, so at least ${LB4}: that is log₂(n!) rounded up.`,
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Selection sort',
      lines: ['Find the minimum of the unsorted part.', 'Swap it to the front of the unsorted part.', 'The comparison count never depends on the input.'],
      frames: [
        { say: 0, note: 'Unsorted: the whole array.', panels: [arr(SEL_A, { label: 'a' }), vars({ comparisons: 0 })] },
        ...SEL.map((s) => ({
          say: s.i === 0 ? 1 : 2,
          note: `Pass ${s.i + 1}: ${s.pass} comparison${s.pass > 1 ? "s" : ""} → min ${s.a[s.i]}, swap it to index ${s.i}.`,
          panels: [
            arr(s.a, { label: 'a', pointers: s.m !== s.i ? [ptr(s.i, 'i'), ptr(s.m, 'min was', 'b')] : [ptr(s.i, 'i')], highlights: hl(SEL_A.length, (k) => (k === s.i ? 'active' : k < s.i ? 'done' : '')) }),
            vars({ comparisons: s.comps }),
          ],
        })),
        { say: 2, note: `Done: 4 + 3 + 2 + 1 = ${SEL.at(-1).comps} comparisons, about n²/2.`, panels: [arr(SEL.at(-1).a, { label: 'a', highlights: hl(5, () => 'done') }), vars({ comparisons: SEL.at(-1).comps })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: two equal keys',
      lines: ['Selection sort runs on keys `2, 2, 1`.', 'The 2s are tagged `2a` and `2b` to tell them apart.'],
      panels: [arr(SEL_TAG.map(show), { label: 'input' })],
      task: {
        type: 'choose',
        question: 'What does selection sort output?',
        options: [
          { text: SEL_T.at(-1).a.map(show).join(', '), why: '' },
          { text: '1, 2a, 2b', why: 'Pass 1 swaps 1 with 2a, sending 2a behind 2b. Nothing moves it back.' },
          { text: '2a, 2b, 1', why: 'That is not sorted: 1 must come first.' },
        ],
        answer: 0,
      },
      solved: 'The long-distance swap jumped 2a over 2b: selection sort is **not stable**.',
      then: SEL_T.map((s) => ({
        say: 0,
        note: s.m !== s.i ? `Pass ${s.i + 1}: min is ${show(s.before[s.m])}, swap it with ${show(s.before[s.i])}.` : `Pass ${s.i + 1}: ${show(s.a[s.i])} is already the min, no move.`,
        panels: [arr(s.a.map(show), { label: 'a', highlights: hl(3, (k) => (key(s.a[k]) === 2 && s.i === SEL_T.length - 1 ? 'bad' : k <= s.i ? 'done' : '')) })],
      })),
    },
    {
      kind: 'watch',
      title: 'Insertion sort',
      lines: ['Take the next item `x`.', 'Slide it left past larger items: each **shift** moves one bigger item right.', 'Each shift fixes exactly one inversion.'],
      frames: [{ say: 0, note: 'The prefix of length 1 is already sorted.', panels: [arr(INS_A, { label: 'a', highlights: { 0: 'window' } }), vars({ shifts: 0 })] }, ...insFrames(INS, INS_A.length, 'a', (s) => (s.kind === 'pick' ? 0 : s.kind === 'shift' ? 1 : 2))],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the shifts',
      lines: [`Insertion sort on \`[${INS_B.join(', ')}]\`.`, 'Shifts = inversions: pairs `i < j` with `a[i] > a[j]`.'],
      panels: [arr(INS_B, { label: 'a' })],
      task: { type: 'number', question: 'How many shifts will it make?', options: [2, INS_B_SHIFTS, 4, 6], answer: INS_B_SHIFTS, hint: 'List each pair where a bigger number sits left of a smaller one.' },
      solved: 'The pairs (3, 1), (3, 2) and (4, 2): three inversions, three shifts.',
      then: insFrames(INS_BR, INS_B.length, 'a', (s) => (s.kind === 'shift' ? 1 : 0)),
    },
  ],

  'intuition-merge-sort': [
    {
      kind: 'watch',
      title: 'Merging two sorted lists',
      lines: ['Put a finger at the front of each sorted list.', 'Take the **smaller** of the two fingered items.', 'Every step outputs one item: n steps in total.'],
      frames: [
        {
          say: 0,
          note: 'Both halves of [38, 27, 43, 3, 9, 82, 10], already sorted.',
          panels: [arr(MS_L, { label: 'left', pointers: [ptr(0, 'i')] }), arr(MS_R, { label: 'right', pointers: [ptr(0, 'j', 'b')] }), arr(pad([], 7), { label: 'out' })],
        },
        ...MS_RUN.map((s) => ({ say: s.cmp ? 1 : 2, note: mergeNote(s), panels: mergePanels(MS_L, MS_R, s) })),
      ],
    },
    {
      kind: 'watch',
      title: 'Split down, merge up',
      lines: ['Split the array into a left half and a right half.', 'Sort each half: trust the recursive call (leap of faith).', 'Merge the two sorted halves.', 'Base case: 0 or 1 element is already sorted.'],
      frames: TREE_FRAMES,
    },
    {
      kind: 'turn',
      title: 'Your turn: when one side runs out',
      lines: [`Merge \`[${LO_L.join(', ')}]\` with \`[${LO_R.join(', ')}]\`.`, 'Stop the moment one list is empty.'],
      panels: mergePanels(LO_L, LO_R, { i: 0, j: 0, from: '', out: [] }),
      task: { type: 'number', question: 'When the right list runs out, how many left items are still waiting?', options: [1, LO_LEFT, 3, 4], answer: LO_LEFT, hint: 'Take 2, 3, 4, 5, 6 in turn, then look at what is left.' },
      solved: `${LO_L.slice(-LO_LEFT).join(' and ')} remain. They are already sorted, so they are copied to the end as they are.`,
      then: LO_RUN.map((s, k) => ({ say: k < LO_CUT ? 0 : 1, note: mergeNote(s), panels: mergePanels(LO_L, LO_R, s) })),
    },
  ],

  'optimized-merge-sort': [
    {
      kind: 'watch',
      title: 'Every level costs n',
      lines: ['Each level halves the sizes and doubles the count.', 'So **every level costs n**.', '**log₂ n** levels: n · log₂ n, for any input order.'],
      frames: [
        ...LEVELS.map((_, f) => ({
          say: f === 0 ? 0 : 1,
          note: `${LEVELS[f][0]} merge${LEVELS[f][0] > 1 ? 's' : ''} of ${LEVELS[f][1]} items = ${LEVELS[f][2]}.`,
          panels: [
            table(
              LEVELS.map((_, i) => `level ${i}`),
              ['merges', 'size', 'work'],
              LEVELS.map((r, i) => (i <= f ? r.map(String) : ['?', '?', '?'])),
              LEVELS.map((_, i) => [0, 1, 2].map(() => (i === f ? 'active' : i < f ? 'done' : ''))),
            ),
          ],
        })),
        { say: 2, note: `${LEVELS.length} levels × 8 = ${LEVEL_TOTAL} = 8 · log₂ 8.`, panels: [vars({ n: 8, levels: LEVELS.length, total: LEVEL_TOTAL })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Equal keys in the merge',
      lines: ['Two items with key 5: `5a` (left half) and `5b` (right half).', 'With `<=`, the tie goes to the left one.', 'Left-half items came earlier, so the order is kept: **stable**.'],
      frames: [
        { say: 0, note: '5a is in the left half, 5b in the right.', panels: mergePanels(ST_L, ST_R, { i: 0, j: 0, from: '', out: [] }) },
        ...ST_RUN.map((s) => ({ say: s.cmp && key(s.v) === 5 && s.from === 'L' ? 1 : s.out.length === 4 ? 2 : 0, note: mergeNote(s), panels: mergePanels(ST_L, ST_R, s) })),
      ],
    },
    {
      kind: 'watch',
      title: 'Counting inversions while merging',
      lines: ['Take `right[j]` before `left[i]` → `left[i] > right[j]`.', 'The left half is sorted, so all of `left[i..]` beat `right[j]` too.', 'Add `left.length − i` in one step.'],
      frames: [
        { say: 0, note: 'Two sorted halves; count only pairs across the split.', panels: [arr(INV_L, { label: 'left', pointers: [ptr(0, 'i')] }), arr(INV_R, { label: 'right', pointers: [ptr(0, 'j', 'b')] }), vars({ inversions: 0 })] },
        ...invFrames(INV_L, INV_R, INV_RUN, (s) => (s.add ? 2 : 0)),
        {
          say: 1,
          note: `Check by hand: ${INV_L.flatMap((x) => INV_R.filter((y) => x > y).map((y) => `(${x},${y})`)).join(' ')} = ${INV_TOTAL}.`,
          panels: [arr(INV_L, { label: 'left' }), arr(INV_R, { label: 'right' }), vars({ inversions: INV_TOTAL })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: total across the split',
      lines: [`left = \`[${INV2_L.join(', ')}]\`, right = \`[${INV2_R.join(', ')}]\`.`, 'Merge them, adding `left.length − i` each time the right side wins.'],
      panels: [arr(INV2_L, { label: 'left', pointers: [ptr(0, 'i')] }), arr(INV2_R, { label: 'right', pointers: [ptr(0, 'j', 'b')] })],
      task: { type: 'number', question: 'How many cross inversions does the merge count?', options: [3, 6, INV2_TOTAL, 9], answer: INV2_TOTAL, hint: '1 and 2 each beat all three left items. Then check 6.' },
      solved: `3 + 3 + 2 = ${INV2_TOTAL}. Three additions, no pair checked one by one.`,
      then: invFrames(INV2_L, INV2_R, INV2_RUN, (s) => (s.add ? 1 : 0)),
    },
  ],

  'template-merge-sort': [
    {
      kind: 'watch',
      title: 'Half-open ranges and one buffer',
      lines: ['`sort(lo, hi)` sorts `a[lo..hi)`; the halves are `[lo, mid)` and `[mid, hi)`.', '`hi − lo <= 1` returns at once.', 'Merge into `buf`, then copy `buf[lo..hi)` back into `a`.'],
      frames: TM.ev.map((e) => ({
        say: e.kind === 'split' ? 0 : 2,
        note:
          e.kind === 'split'
            ? `sort(${e.lo}, ${e.hi}): mid = ${e.mid}, halves [${e.lo}, ${e.mid}) and [${e.mid}, ${e.hi}).${e.hi - e.lo === 2 ? ' Both have 1 item: they return at once.' : ''}`
            : `Merge [${e.lo}, ${e.mid}) with [${e.mid}, ${e.hi}) and copy back: ${e.a.slice(e.lo, e.hi).join(', ')}.`,
        panels: tmPanels(e),
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: find mid',
      lines: ['A call `sort(3, 7)` covers `a[3..7)`: indices 3 to 6.'],
      panels: [arr(W8, { label: 'a', range: [CELL_LO, CELL_HI - 1], highlights: hl(8, (k) => (k < CELL_LO || k >= CELL_HI ? 'muted' : '')) })],
      task: {
        type: 'cell',
        question: 'Tap the cell where `mid` lands.',
        answer: CELL_MID,
        hints: { 4: '(3 + 7) >> 1 is 5, not 4.', 6: '6 is the last index inside the range; mid is the middle.', 7: 'hi = 7 is excluded: the range stops at 6.', 3: 'That is lo.' },
      },
      solved: `mid = (3 + 7) >> 1 = ${CELL_MID}: halves [3, 5) and [5, 7), two items each.`,
      then: [
        {
          say: 0,
          note: 'Left half [3, 5), right half [5, 7).',
          panels: [arr(W8, { label: 'a', range: [CELL_LO, CELL_HI - 1], pointers: [ptr(CELL_LO, 'lo'), ptr(CELL_MID, 'mid', 'b')], highlights: hl(8, (k) => (k < CELL_LO || k >= CELL_HI ? 'muted' : k < CELL_MID ? 'window' : 'visited')) })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: copy-back writes',
      lines: ['Each merge copies `buf[lo..hi)` back: `hi − lo` writes.', 'Run `mergeSort` on 8 items.'],
      panels: [arr(W8, { label: 'a' }), vars({ n: 8 })],
      task: { type: 'number', question: 'How many copy-back writes happen in total?', options: [8, 16, W8_WRITES, 64], answer: W8_WRITES, hint: 'Every level of merges covers all 8 items. How many levels?' },
      solved: `3 levels × 8 = ${W8_WRITES}: the same n · log₂ n as the merging itself.`,
    },
  ],

  'implementation-merge-sort': [
    {
      kind: 'watch',
      title: 'countInversions on [4, 1, 3, 2]',
      lines: ['`a[i] <= a[j]`: take `a[i]`, nothing to add.', 'Else `a[i..mid)` are all `> a[j]`: `count += mid − i`.', 'Copy `buf` back; the counts of both halves add up.'],
      frames: CI.ev.map((e) => ({ say: e.kind === 'done' ? 2 : e.add ? 1 : 0, note: ciNote(e), panels: ciPanels(e) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: equal values',
      lines: [`\`countInversions([${CI2_A.join(', ')}])\`.`, 'An inversion needs `a[i] > a[j]` **strictly**.'],
      panels: [arr(CI2_A, { label: 'nums' })],
      task: { type: 'number', question: 'What does it return?', options: [0, CI2.result, 2, 3], answer: CI2.result, hint: 'Check the three pairs. Is (2, 2) out of order?' },
      solved: 'Only (2, 1) counts. The `<=` takes the left 2 first, so (2, 2) is never counted.',
      then: CI2.ev.map((e) => ({ say: 1, note: ciNote(e), panels: ciPanels(e) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the first line',
      lines: ['`countInversions` starts with `const a = [...nums]`.'],
      panels: [arr(CI_A, { label: 'nums (caller)' }), arr(CI.ev.at(-1).a, { label: 'a after sorting', highlights: hl(4, () => 'done') })],
      task: {
        type: 'choose',
        question: 'Why copy `nums` first?',
        options: [
          { text: "The sort rearranges `a`; the copy leaves the caller's array untouched", why: '' },
          { text: 'The merge cannot read from the input array', why: 'The merge reads `a` freely; it just rearranges it.' },
          { text: 'Copying makes the count faster', why: 'The copy costs extra O(n); it is about not destroying the input.' },
        ],
        answer: 0,
      },
      solved: 'Counting sorts the array as a side effect. The copy keeps the caller\'s `nums` as it was.',
    },
  ],

  'intuition-quick-sort': [
    {
      kind: 'watch',
      title: 'Partition [7, 2, 9, 4, 3] around 4',
      lines: ['Pick a **pivot**: here 4, swapped to the end.', '**Partition**: smaller values move left of the `store` boundary.', 'The pivot then sits in its **final** sorted position.'],
      frames: [
        { say: 0, note: 'Pivot 4 is at index 3.', panels: [arr(Q_A, { label: 'a', pointers: [ptr(Q_R, 'pivot')], highlights: { [Q_R]: 'bad' } })] },
        { say: 0, note: 'Swap the pivot to the end.', panels: lomPanels({ i: 0, store: 0, a: Q_SW }, 5, 0, 4, 'a') },
        ...lomFrames(Q_LOM, 5, 0, 4, 'a', (s) => (s.final ? 2 : 1)),
        { say: 2, note: `Left part [${Q_FIN.a.slice(0, Q_FIN.store).join(', ')}], right part [${Q_FIN.a.slice(Q_FIN.store + 1).join(', ')}]. Recurse on each.`, panels: lomPanels(Q_FIN, 5, 0, 4, 'a') },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does the pivot land?',
      lines: [`Partition \`[${Q2_A.join(', ')}]\` around the last value, ${Q2_A.at(-1)}.`],
      panels: [arr(Q2_A, { label: 'a', pointers: [ptr(4, 'pivot')], highlights: { 4: 'bad' } })],
      task: { type: 'cell', question: 'Tap the index where the pivot ends up.', answer: Q2_AT, hints: { 4: 'It only stays last if it is the largest.', 1: 'Count how many values are smaller than 5.', 3: 'Two values are smaller than 5, not three.' } },
      solved: `Two values (1 and 3) are smaller than 5, so 5 lands at index ${Q2_AT}.`,
      then: lomFrames(Q2_LOM, 5, 0, 4, 'a', () => 0),
    },
    {
      kind: 'turn',
      title: 'Your turn: after the recursion',
      lines: ['Partition is done and both parts are sorted recursively.'],
      panels: [arr([...Q_FIN.a].sort((x, y) => x - y), { label: 'a', highlights: hl(5, (k) => (k === Q_FIN.store ? 'done' : k < Q_FIN.store ? 'window' : 'visited')) })],
      task: {
        type: 'choose',
        question: 'What is left to combine the parts?',
        options: [
          { text: 'Nothing: the parts are already in place', why: '' },
          { text: 'Merge the two parts like merge sort', why: 'Every left value is already below the pivot and every right value above it.' },
          { text: 'One more pass over the whole array', why: 'Each part is sorted and sits on the correct side; the array is done.' },
        ],
        answer: 0,
      },
      solved: 'Quick sort does the hard work **before** recursing. No merge needed.',
    },
  ],

  'optimized-quick-sort': [
    {
      kind: 'watch',
      title: 'Duplicates: 2-way vs 3-way',
      lines: ['With all-equal values, `a[i] < pivot` is never true.', 'The 2-way partition removes **one** element per call: n²/2.', 'A 3-way partition puts all of them in the `= pivot` block in one pass.'],
      frames: [
        ...EQ_CALLS.map((c, k) => ({
          say: k === 0 ? 0 : 1,
          note: `quickSort(${c.lo}, ${c.hi}): ${c.comps} comparison${c.comps > 1 ? "s" : ""}, pivot lands at ${c.p}. Recurse on [${c.p + 1}, ${c.hi}].`,
          panels: [
            arr(EQ, { label: '2-way', range: [c.lo, c.hi], pointers: [ptr(c.p, 'pivot')], highlights: hl(EQ.length, (i) => (i < c.lo ? 'muted' : i === c.p ? 'done' : '')) }),
            vars({ comparisons: EQ_CALLS.slice(0, k + 1).reduce((s, x) => s + x.comps, 0) }),
          ],
        })),
        {
          say: 2,
          note: `3-way: one pass, lt = ${EQ3.lt}, gt = ${EQ3.gt}. Nothing left to recurse on.`,
          panels: [arr(EQ, { label: '3-way', pointers: [ptr(EQ3.lt, 'lt'), ptr(EQ3.gt, 'gt', 'b')], highlights: hl(EQ.length, () => 'done') }), vars({ '2-way': EQ_TOTAL, '3-way checks': EQ3.ev.length })],
        },
      ],
    },
    {
      kind: 'watch',
      title: 'Quickselect: recurse into one side',
      lines: [`Find the k-th smallest, k = ${QS_K} (0-based).`, 'Partition once and look where the pivot landed.', 'At k: done. Otherwise keep only the side that holds k.'],
      frames: [
        { say: 0, note: `Pivot = last value of the range (say the random pick chose it).`, panels: [arr(QS_A, { label: 'a', range: [0, 6], pointers: [ptr(QS_K, 'k', 'b')], highlights: { 6: 'bad' } })] },
        ...QS_RUN.map((s) => ({
          say: s.p === QS_K ? 2 : 1,
          note: s.p === QS_K ? `Pivot lands at ${s.p} = k: the answer is ${s.a[s.p]}.` : `Pivot ${s.a[s.p]} lands at ${s.p} ${s.p < QS_K ? '<' : '>'} k: keep [${s.p < QS_K ? s.p + 1 : s.lo}, ${s.p < QS_K ? s.hi : s.p - 1}] only.`,
          panels: [
            arr(s.a, {
              label: 'a',
              range: [s.lo, s.hi],
              pointers: s.p === QS_K ? [ptr(s.p, 'k = pivot')] : [ptr(s.p, 'pivot'), ptr(QS_K, 'k', 'b')],
              highlights: hl(QS_A.length, (k) => (k === s.p ? 'done' : k < s.lo || k > s.hi ? 'muted' : (s.p < QS_K ? k < s.p : k > s.p) ? 'muted' : '')),
            }),
            vars({ scanned: s.scanned }),
          ],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the halving sum',
      lines: ['Each partition scans its range, then keeps one side.', 'Suppose every pivot splits exactly in half.'],
      panels: [table(['n = 64'], ['scan 1', 'scan 2', 'scan 3', '…'], [['64', '32', '16', '…']])],
      task: { type: 'number', question: 'How many elements are scanned in total, down to size 1?', options: [64, HALVES64, 384, 2016], answer: HALVES64, hint: '64 + 32 + 16 + … + 1.' },
      solved: `${HALVES64} ≈ 2n: quickselect is O(n) on average.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: median-of-three',
      lines: ['Median-of-three: look at the first, middle and last value.', 'Use the middle one of those three as the pivot.'],
      panels: [arr(M3, { label: 'already sorted', highlights: { 0: 'visited', [M3_MID]: 'visited', 6: 'visited' } })],
      task: { type: 'cell', question: 'Tap the pivot median-of-three picks.', answer: M3_MID, hints: { 6: '70 is the largest of the three: the worst pivot here.', 0: '10 is the smallest of the three.' } },
      solved: `It picks ${M3[M3_MID]}, which splits the sorted input in half. Last-element pivot would pick 70.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: a lopsided split',
      lines: ['Suppose every pivot splits the range 10% / 90%.'],
      panels: [arr([1, 9], { label: 'split share (tenths)' })],
      task: {
        type: 'choose',
        question: 'What does quick sort cost then?',
        options: [
          { text: 'Still O(n log n), with a bigger constant', why: '' },
          { text: 'O(n²)', why: 'That needs one side to be empty every time. Here depth is log₁₀/₉ n, still logarithmic.' },
          { text: 'O(n)', why: 'Each level still costs about n, and there are more than a constant number of levels.' },
        ],
        answer: 0,
      },
      solved: 'Depth log₁₀/₉ n is still O(log n), so n work per level gives O(n log n).',
    },
  ],

  'template-quick-sort': [
    {
      kind: 'watch',
      title: 'Lomuto partition, random pivot',
      lines: ['Swap the random pick `a[r]` to `a[hi]`; it is the pivot.', 'Invariant: `a[lo..store)` < pivot.', 'Finally swap the pivot into `a[store]` and return `store`.'],
      frames: [
        { say: 0, note: `Say the random pick is r = ${TQ_R}: value ${TQ_A[TQ_R]}.`, panels: [arr(TQ_A, { label: 'a', pointers: [ptr(TQ_R, 'r')], highlights: { [TQ_R]: 'bad' } })] },
        { say: 0, note: `Swap a[${TQ_R}] and a[hi]: pivot ${TQ_A[TQ_R]} waits at the end.`, panels: lomPanels({ i: 0, store: 0, a: TQ_SW }, 6, 0, 5, 'a') },
        ...lomFrames(TQ_LOM, 6, 0, 5, 'a', (s) => (s.final ? 2 : 1)),
      ],
    },
    {
      kind: 'watch',
      title: '3-way partition (Dutch flag)',
      lines: ['`a[lo..lt)` < pivot, `a[lt..gt]` = pivot, `a(gt..hi]` > pivot.', 'Bigger: swap with `a[gt]`, `gt--`, and **don\'t** move `i`.', 'Stop when `i` passes `gt`.'],
      frames: [
        { say: 0, note: 'Pivot 1. lt = i = 0, gt = 5.', panels: dfPanels(DF_A, 0, 0, 5, 'a, pivot 1') },
        ...DF.ev.map((e, k) => ({ say: e.act === 'gt' ? 1 : 0, note: dfNote(e, 1), panels: dfPanels(e.a, e.lt, e.i, e.gt, 'a, pivot 1', k === DF.ev.length - 1) })),
        { say: 2, note: `i > gt: done. < 1 in [0, ${DF.lt}), = 1 in [${DF.lt}, ${DF.gt}], > 1 after.`, panels: dfPanels(DF.ev.at(-1).a, DF.lt, DF.ev.at(-1).i, DF.gt, 'a, pivot 1', true) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why i stays',
      lines: [`${DF_GT_E.v} > pivot was just swapped with \`a[gt]\`, and \`gt--\`.`],
      panels: dfPanels(DF_GT_E.a, DF_GT_E.lt, DF_GT_E.i, DF_GT_E.gt, 'a, pivot 1'),
      task: {
        type: 'choose',
        question: 'Why does the code not do `i++` here?',
        options: [
          { text: 'The value now at `a[i]` came from `gt` and has not been checked', why: '' },
          { text: 'It is a speed trick; `i++` would also be correct', why: 'Skipping the new `a[i]` could leave a big or small value in the wrong block.' },
          { text: 'The value now at `a[i]` is always equal to the pivot', why: 'It is whatever sat at `gt`: it could be smaller, equal or bigger.' },
        ],
        answer: 0,
      },
      solved: 'The swapped-in value is unseen, so the next loop step checks it at the same `i`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: where gt ends',
      lines: [`\`partition3([${P3_A.join(', ')}], 0, 5, 3)\`.`],
      panels: [arr(P3_A, { label: 'a, pivot 3' })],
      task: {
        type: 'cell',
        question: 'Tap where `gt` ends: the last cell of the `= 3` block.',
        panel: 0,
        answer: P3.gt,
        hints: { 2: 'That is where the = 3 block starts (lt).', 5: 'The 4 is bigger than 3: it ends after gt.', 3: 'There are three 3s, starting at index 2.' },
      },
      solved: `Two values are < 3, so the block of three 3s spans [${P3.lt}, ${P3.gt}].`,
      then: [{ say: 0, note: `lt = ${P3.lt}, gt = ${P3.gt}.`, panels: dfPanels(P3.ev.at(-1).a, P3.lt, P3.ev.at(-1).i, P3.gt, 'a, pivot 3', true) }],
    },
  ],

  'implementation-quick-sort': [
    {
      kind: 'watch',
      title: `Quickselect, k = ${QI_K}, many duplicates`,
      lines: ['Pick a random `r` and 3-way partition around `a[r]`.', '`k < lt`: `hi = lt − 1`. `k > gt`: `lo = gt + 1`.', 'Else k is inside the `= pivot` block: return `a[k]`.'],
      frames: QI.flatMap((s) => [
        { say: 0, note: `Range [${s.lo}, ${s.hi}]. Say r = ${s.r}: pivot ${s.pivot}.`, panels: qiPanels(s, false) },
        {
          say: s.act === 'found' ? 2 : 1,
          note: s.act === 'found' ? `k = ${QI_K} is in [${s.lt}, ${s.gt}]: return ${s.a[QI_K]}.` : s.act === 'lo' ? `k = ${QI_K} > gt = ${s.gt}: lo = ${s.gt + 1}.` : `k = ${QI_K} < lt = ${s.lt}: hi = ${s.lt - 1}.`,
          panels: qiPanels(s),
        },
      ]),
    },
    {
      kind: 'turn',
      title: 'Your turn: which side?',
      lines: [`\`quickselect([${QJ_A.join(', ')}], ${QJ_K})\`, pivot ${QJ_1.pivot}.`, `After partition3: lt = ${QJ_1.lt}, gt = ${QJ_1.gt}.`],
      panels: [arr(QJ_1.a, { label: `a, k = ${QJ_K}`, pointers: [ptr(QJ_1.lt, 'lt'), ptr(QJ_1.gt, 'gt', 'b')], highlights: hl(5, (k) => (k >= QJ_1.lt && k <= QJ_1.gt ? 'window' : '')) }), vars({ lt: QJ_1.lt, gt: QJ_1.gt, k: QJ_K })],
      task: {
        type: 'choose',
        question: 'What does the loop do next?',
        options: [
          { text: `lo = gt + 1 = ${QJ_1.gt + 1}`, why: '' },
          { text: `hi = lt − 1 = ${QJ_1.lt - 1}`, why: `That is for k < lt; here k = ${QJ_K} is bigger than gt.` },
          { text: `return a[${QJ_K}]`, why: `Only when lt ≤ k ≤ gt. k = ${QJ_K} is past the = ${QJ_1.pivot} block.` },
        ],
        answer: 0,
      },
      solved: `The answer is in the "> pivot" part, so the range shrinks to [${QJ_1.gt + 1}, ${QJ_A.length - 1}].`,
      then: QJ.slice(1).map((s) => ({
        say: 1,
        note: `Range [${s.lo}, ${s.hi}], pivot ${s.pivot}: k is in [${s.lt}, ${s.gt}] → return ${s.a[QJ_K]}.`,
        panels: [arr(s.a, { label: `a, k = ${QJ_K}`, range: [s.lo, s.hi], highlights: hl(5, (k) => (k === QJ_K ? 'done' : k < s.lo ? 'muted' : '')) })],
      })),
    },
  ],
  ...secondHalf,
};
