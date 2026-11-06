// Shorts for Advanced Structures (M9). Format: src/content/shortSchema.js. Facts come only from
// topics/advanced-structures/topic.js. Every Fenwick cell, rank, segment-tree node, lazy tag, sparse-table cell,
// position list and running sum below comes from running the pattern's template on its "e.g." input, and every
// query result is checked against a brute-force loop when this file loads.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const win = (n, lo, hi, extra = {}) => hl(n, (k) => extra[k] ?? (k >= lo && k <= hi ? 'window' : ''));
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/advanced-structures.js: ${msg}`);
};
const sum = (a, l, r) => a.slice(l, r + 1).reduce((s, x) => s + x, 0);
const lowbit = (i) => i & -i;
const bin = (x) => x.toString(2).padStart(3, '0');

// ---------- Fenwick (pattern template, 1-based), with the visited cells recorded ----------
const fenAdd = (t, i, d) => {
  const path = [];
  for (; i < t.length; i += i & -i) (t[i] += d), path.push(i);
  return path;
};
const fenPrefix = (t, i) => {
  const path = [];
  let s = 0;
  for (; i > 0; i -= i & -i) (s += t[i]), path.push({ i, s });
  return { s, path };
};
const fenFrom = (a) => {
  const t = new Array(a.length + 1).fill(0);
  a.forEach((v, k) => fenAdd(t, k + 1, v));
  return t;
};
// tree[1..n] drawn with 1-based labels; st maps a 1-based cell → state
const fenP = (t, st = {}, label = 'tree[1..n]') => arr(t.slice(1), { label, indexBase: 1, highlights: Object.fromEntries(Object.entries(st).map(([i, s]) => [i - 1, s])) });

// ================= 1. Fenwick tree: e.g. nums = [3, 1, 4, 1, 5, 9], positions 1..6 =================
const FN = [3, 1, 4, 1, 5, 9];
const FT = fenFrom(FN);
check(FT.slice(1).join() === '3,4,4,9,5,14', 'fenwick build');
const covers = (i) => (lowbit(i) === 1 ? `${i}` : `${i - lowbit(i) + 1}..${i}`);
const coverT = (t, st = {}) =>
  table(['binary', 'covers', 'tree[i]'], FN.map((_, k) => String(k + 1)), [FN.map((_, k) => bin(k + 1)), FN.map((_, k) => covers(k + 1)), t.slice(1).map(String)], [0, 1, 2].map(() => FN.map((_, k) => st[k + 1] || '')), 'Fenwick cells');
const coverNums = (i) => arr(FN, { label: 'nums (positions 1..6)', indexBase: 1, range: [i - lowbit(i), i - 1], highlights: win(6, i - lowbit(i), i - 1) });
const FP5 = fenPrefix(FT, 5);
const FP1 = fenPrefix(FT, 1);
check(FP5.path.map((p) => p.i).join() === '5,4' && FP5.s === sum(FN, 0, 4), 'prefix(5)');
check(FP5.s - FP1.s === sum(FN, 1, 4), 'range(2, 5)');
const FT2 = FT.slice();
const FU = fenAdd(FT2, 5, 2); // position 5: 5 → 7
check(FU.join() === '5,6', 'add(5, +2) path');
const FN2 = FN.map((v, k) => (k === 4 ? 7 : v));
FN2.forEach((_, k) => check(fenPrefix(FT2, k + 1).s === sum(FN2, 0, k), `prefix(${k + 1}) after update`));
const FU3 = fenAdd(FT2.slice(), 3, 1);
check(FU3.join() === '3,4', 'add(3) path for the turn');
const P6 = FN.reduce((p, x) => (p.push(p.at(-1) + x), p), [0]);

// ================= 2. compression + BIT: e.g. nums = [−3, 9e8, 25, 9e8, −100] =================
const CN = [-3, 900000000, 25, 900000000, -100];
const sh = (v) => (v === 900000000 ? '9e8' : v);
const CNs = CN.map(sh);
// the template, verbatim in shape: 1-based ranks, toolkit-style 0-based BIT (index r − 1 is 1-based cell r)
const CRUN = (() => {
  const sorted = [...new Set(CN)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i + 1]));
  const t = new Array(sorted.length + 1).fill(0);
  const out = [];
  const steps = [];
  for (const [j, x] of CN.entries()) {
    const r = rank.get(x);
    const q = r > 1 ? fenPrefix(t, r - 1) : { s: 0, path: [] }; // = bit.prefixSum(r - 2)
    out.push(q.s);
    const before = t.slice();
    const added = fenAdd(t, r, 1); // = bit.add(r - 1, 1)
    steps.push({ j, x, r, ask: q.s, read: q.path.map((p) => p.i), added, before, tree: t.slice(), out: out.slice() });
  }
  return { sorted, rank, out, steps };
})();
const CBRUTE = CN.map((x, j) => CN.slice(0, j).filter((y) => y < x).length);
check(CRUN.out.join() === CBRUTE.join() && CRUN.out.join() === '0,1,1,2,0', 'count smaller before');
check(CRUN.sorted.join() === '-100,-3,25,900000000', 'sorted unique');
const CRANKS = CN.map((x) => CRUN.rank.get(x));
const CT = CRUN.steps[3]; // the turn: the second 9e8
const ctLess = fenPrefix(CT.before, CT.r - 1).s;
const ctLe = fenPrefix(CT.before, CT.r).s;
const ctAfter = fenPrefix(CT.tree, CT.r).s;
check(ctLess === 2 && ctLe === 3 && ctAfter === 4, 'turn options');
const cScanFrame = (s) => ({
  say: 0,
  note: `${sh(s.x)} → rank ${s.r}: ranks < ${s.r} seen so far = ${s.ask}${s.read.length ? ` (cells ${s.read.join(', ')})` : ''}. Then add 1 at cell${s.added.length > 1 ? 's' : ''} ${s.added.join(', ')}.`,
  panels: [
    arr(CNs, { label: 'nums', pointers: [ptr(s.j, 'x')], highlights: hl(5, (k) => (k === s.j ? 'active' : k < s.j ? 'done' : '')) }),
    fenP(s.tree, { ...Object.fromEntries(s.added.map((i) => [i, 'active'])), ...Object.fromEntries(s.read.map((i) => [i, 'window'])) }, 'BIT over ranks, tree[1..4]'),
    arr([...s.out, ...new Array(5 - s.out.length).fill('·')], { label: 'smaller before', highlights: { [s.j]: 'done' } }),
  ],
});

// ---------- recursive segment tree (heap layout: node k → 2k, 2k + 1) over any combine ----------
function segBuild(nums, combine) {
  const t = {};
  const meta = {};
  const b = (node, lo, hi, d) => {
    meta[node] = { lo, hi, d };
    if (lo === hi) return (t[node] = nums[lo]);
    const mid = (lo + hi) >> 1;
    b(2 * node, lo, mid, d + 1);
    b(2 * node + 1, mid + 1, hi, d + 1);
    t[node] = combine(t[2 * node], t[2 * node + 1]);
  };
  b(1, 0, nums.length - 1, 0);
  return { n: nums.length, t, meta, combine };
}
const rng = (m) => (m.lo === m.hi ? `${m.lo}` : `${m.lo}-${m.hi}`);
const segDraw = (S, { lab = (k) => S.t[k], st = {}, label } = {}) => ({
  kind: 'nodes',
  ...(label ? { label } : {}),
  nodes: Object.entries(S.meta).map(([k, m]) => ({ id: +k, label: String(lab(+k)), x: (m.lo + m.hi) * 0.75, y: m.d, ...(st[k] ? { state: st[k] } : {}) })),
  edges: Object.keys(S.meta)
    .filter((k) => +k > 1)
    .map((k) => ({ from: +k >> 1, to: +k })),
});

// ================= 3. segment tree, min: e.g. nums = [5, 8, 3, 9, 6, 4] =================
const SN = [5, 8, 3, 9, 6, 4];
const S3 = segBuild(SN, Math.min);
check(S3.t[1] === 3 && S3.t[2] === 3 && S3.t[3] === 4, 'min tree');
// the template: no overlap → Infinity, full → tree[node], partial → combine both children
function segQuery(S, l, r) {
  const vis = [];
  const q = (node, lo, hi) => {
    if (r < lo || hi < l) return vis.push({ node, c: 'none' }), Infinity;
    if (l <= lo && hi <= r) return vis.push({ node, c: 'full' }), S.t[node];
    vis.push({ node, c: 'partial' });
    const mid = (lo + hi) >> 1;
    return S.combine(q(2 * node, lo, mid), q(2 * node + 1, mid + 1, hi));
  };
  return { v: q(1, 0, S.n - 1), vis };
}
const segUpdate = (S, i, val) => {
  const path = [];
  const u = (node, lo, hi) => {
    path.push(node);
    if (lo === hi) return (S.t[node] = val);
    const mid = (lo + hi) >> 1;
    if (i <= mid) u(2 * node, lo, mid);
    else u(2 * node + 1, mid + 1, hi);
    S.t[node] = S.combine(S.t[2 * node], S.t[2 * node + 1]);
  };
  u(1, 0, S.n - 1);
  return path;
};
const minOf = (a, l, r) => Math.min(...a.slice(l, r + 1));
const SQ = segQuery(S3, 1, 4);
check(SQ.v === minOf(SN, 1, 4), 'min [1, 4]');
check(SQ.vis.map((v) => `${v.node}${v.c[0]}`).join() === '1p,2p,4p,8n,9f,5f,3p,6f,7n', 'query [1, 4] trace');
const CASE_ST = { partial: 'visited', full: 'done', none: 'muted' };
// one frame per tree level: every node the query reaches on that level, in its overlap case
const sqLevels = [0, 1, 2, 3].map((d) => SQ.vis.filter((v) => S3.meta[v.node].d === d));
const sqTaken = (d) => SQ.vis.filter((v) => v.c === 'full' && S3.meta[v.node].d <= d).map((v) => S3old[v.node]);
const S3old = { ...S3.t };
check(Math.min(...sqTaken(3)) === SQ.v, 'taken tiles give the min');
const SUP = segUpdate(S3, 2, 10);
check(SUP.join() === '1,2,5' && S3.t[2] === 5 && S3.t[1] === 4, 'update(2, 10)');
const SN2 = SN.map((v, k) => (k === 2 ? 10 : v));
const SQ2 = segQuery(S3, 1, 4);
check(SQ2.v === minOf(SN2, 1, 4) && SQ2.v === 6, 'min [1, 4] after update');
const STURN = segQuery(S3, 0, 4);
const sFull = STURN.vis.filter((v) => v.c === 'full').map((v) => rng(S3.meta[v.node]));
check(sFull.join() === '0-2,3-4' && STURN.v === minOf(SN2, 0, 4), 'turn: tiles of [0, 4]');

// ================= 4. lazy propagation, sums: e.g. nums = [3, 1, 4, 2, 6, 5] =================
const LN = [3, 1, 4, 2, 6, 5];
const L4 = segBuild(LN, (a, b) => a + b);
const lazy = {};
Object.keys(L4.meta).forEach((k) => (lazy[k] = 0));
const lzLog = [];
const snap = (node, ev, extra = {}) => lzLog.push({ node, ev, t: { ...L4.t }, lazy: { ...lazy }, ...extra });
// the template: apply / push / rangeAdd, plus the matching rangeSum
const apply = (node, lo, hi, d) => {
  L4.t[node] += d * (hi - lo + 1);
  lazy[node] += d;
};
const push = (node, lo, hi) => {
  if (lazy[node]) {
    const mid = (lo + hi) >> 1;
    const d = lazy[node];
    apply(2 * node, lo, mid, d);
    apply(2 * node + 1, mid + 1, hi, d);
    lazy[node] = 0;
    snap(node, 'push', { d });
  }
};
const rangeAdd = (l, r, d, node = 1, lo = 0, hi = LN.length - 1) => {
  if (r < lo || hi < l) return snap(node, 'none');
  if (l <= lo && hi <= r) return apply(node, lo, hi, d), snap(node, 'tag', { d });
  push(node, lo, hi);
  const mid = (lo + hi) >> 1;
  rangeAdd(l, r, d, 2 * node, lo, mid);
  rangeAdd(l, r, d, 2 * node + 1, mid + 1, hi);
  L4.t[node] = L4.t[2 * node] + L4.t[2 * node + 1];
  snap(node, 'fix');
};
const rangeSum = (l, r, node = 1, lo = 0, hi = LN.length - 1) => {
  if (r < lo || hi < l) return snap(node, 'none'), 0;
  if (l <= lo && hi <= r) return snap(node, 'full'), L4.t[node];
  push(node, lo, hi);
  const mid = (lo + hi) >> 1;
  return rangeSum(l, r, 2 * node, lo, mid) + rangeSum(l, r, 2 * node + 1, mid + 1, hi);
};
const L4start = { ...L4.t };
const zeroLazy = { ...lazy };
rangeAdd(0, 4, 2);
const LN2 = LN.map((v, k) => (k <= 4 ? v + 2 : v));
check(L4.t[1] === sum(LN2, 0, 5) && lazy[2] === 2 && lazy[6] === 2 && L4.t[4] === 4, 'rangeAdd(0, 4, +2)');
const addLog = lzLog.splice(0);
const tagOf = (n) => addLog.find((e) => e.ev === 'tag' && e.node === n);
const fixRoot = addLog.find((e) => e.ev === 'fix' && e.node === 1);
const LQ = rangeSum(2, 3);
check(LQ === sum(LN2, 2, 3) && LQ === 10, 'rangeSum(2, 3)');
const sumLog = lzLog.splice(0);
const pushAt = (n) => sumLog.find((e) => e.ev === 'push' && e.node === n);
check(sumLog.filter((e) => e.ev === 'push').map((e) => e.node).join() === '2,6', 'pushes at nodes 2 and 6');
const P2 = pushAt(2);
const P6n = pushAt(6);
// the turn's state: just before node 6 is visited (node 2 already pushed)
const turnT = sumLog[sumLog.indexOf(P6n) - 1];
check(turnT.lazy[6] === 2 && turnT.t[12] === 2, 'node 6 still owes +2');
const staleAns = sumLog.find((e) => e.ev === 'full' && e.node === 5).t[5] + turnT.t[12];
check(staleAns === 8, 'answer without the push');
const lzLab = (t, lz) => (k) => (lz[k] ? `${t[k]} (+${lz[k]})` : `${t[k]}`);
const lzDraw = (t, lz, st, label = 'sum (+lazy)') => segDraw(L4, { lab: lzLab(t, lz), st, label });

// ================= 5. sparse table, min: e.g. nums = [5, 9, 4, 7, 8, 2, 6, 3] =================
const XN = [5, 9, 4, 7, 8, 2, 6, 3];
const n5 = XN.length;
const LOG = [0, 0];
for (let i = 2; i <= n5; i++) LOG[i] = LOG[i >> 1] + 1;
const ST = [XN.slice()];
for (let k = 1; 1 << k <= n5; k++) ST[k] = Array.from({ length: n5 - (1 << k) + 1 }, (_, i) => Math.min(ST[k - 1][i], ST[k - 1][i + (1 << (k - 1))]));
check(ST.length === 4 && ST[1].join() === '5,4,4,7,2,2,3' && ST[2].join() === '4,4,2,2,2' && ST[3].join() === '2', 'sparse table');
ST.forEach((row, k) => row.forEach((v, i) => check(v === minOf(XN, i, i + (1 << k) - 1), `st[${k}][${i}]`)));
const stQuery = (l, r) => {
  const k = LOG[r - l + 1];
  return { k, a: l, b: r - (1 << k) + 1, v: Math.min(ST[k][l], ST[k][r - (1 << k) + 1]) };
};
const XQ = stQuery(0, 4);
check(XQ.k === 2 && XQ.b === 1 && XQ.v === minOf(XN, 0, 4), 'query [0, 4]');
const XT = stQuery(3, 5);
check(XT.k === 1 && XT.b === 4 && XT.v === minOf(XN, 3, 5), 'turn query [3, 5]');
// st as a table: row k, column i; cells that do not exist are blank. marks: 'k,i' → state
const stT = (upto, marks = {}) =>
  table(
    ST.map((_, k) => `k=${k} (len ${1 << k})`),
    XN.map((_, i) => String(i)),
    ST.map((row, k) => XN.map((_, i) => (k <= upto && i < row.length ? String(row[i]) : ''))),
    ST.map((_, k) => XN.map((_, i) => marks[`${k},${i}`] || '')),
    'st[k][i]',
  );
const stBuild = (k, i) => ({ [`${k},${i}`]: 'active', [`${k - 1},${i}`]: 'window', [`${k - 1},${i + (1 << (k - 1))}`]: 'window' });

// ================= 6. index lists: e.g. arr = [2, 5, 2, 2, 7, 5, 2] =================
const IA = [2, 5, 2, 2, 7, 5, 2];
const buildPos = (upto) => {
  const pos = new Map();
  IA.slice(0, upto).forEach((v, i) => {
    if (!pos.has(v)) pos.set(v, []);
    pos.get(v).push(i);
  });
  return pos;
};
const POS = buildPos(IA.length);
const lowerBound = (a, x) => {
  let lo = 0,
    hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] < x) lo = m + 1;
    else hi = m;
  }
  return lo;
};
const count = (l, r, v) => {
  const a = POS.get(v) ?? [];
  return lowerBound(a, r + 1) - lowerBound(a, l);
};
const brute = (l, r, v) => IA.slice(l, r + 1).filter((x) => x === v).length;
const A2 = POS.get(2);
check(A2.join() === '0,2,3,6', 'pos[2]');
check(count(1, 5, 2) === brute(1, 5, 2) && count(1, 5, 2) === 2, 'count(1, 5, 2)');
check(count(2, 6, 2) === brute(2, 6, 2) && count(2, 6, 2) === 3, 'count(2, 6, 2)');
check(lowerBound(A2, 6) - lowerBound(A2, 2) === 2 && lowerBound(A2, 7) - lowerBound(A2, 3) === 2, 'turn wrong options');
const posT = (pos, hot) => table([...pos.keys()].map(String), ['positions'], [...pos.values()].map((p) => [p.join(', ')]), [...pos.keys()].map((v) => [v === hot ? 'active' : '']), 'pos (value → positions)');
const LB1 = lowerBound(A2, 1);
const LB6 = lowerBound(A2, 6);

// ================= 7. bookings on huge coordinates: e.g. four half-open bookings =================
const BK = [
  [100, 400],
  [300, 600],
  [600, 900],
  [200, 700],
];
const CAL = (() => {
  const delta = new Map();
  return BK.map(([s, e]) => {
    const before = new Map(delta);
    delta.set(s, (delta.get(s) ?? 0) + 1);
    delta.set(e, (delta.get(e) ?? 0) - 1);
    const keys = [...delta.keys()].sort((a, b) => a - b);
    let cur = 0,
      best = 0;
    const runs = keys.map((k) => ((cur += delta.get(k)), (best = Math.max(best, cur)), cur));
    return { s, e, before, keys, d: keys.map((k) => delta.get(k)), runs, best };
  });
})();
// brute force: overlap at every integer point, half-open
CAL.forEach((c, b) => {
  let best = 0;
  for (let x = 0; x <= 1000; x++) best = Math.max(best, BK.slice(0, b + 1).filter(([s, e]) => s <= x && x < e).length);
  check(c.best === best, `booking ${b + 1}`);
});
check(CAL.map((c) => c.best).join() === '1,2,2,3', 'max overlaps');
const ENDPOINTS = new Set(BK.flat()).size;
const calIv = (k, st = {}) => ({ kind: 'intervals', label: 'bookings [start, end)', min: 0, max: 1000, items: BK.slice(0, k + 1).map(([start, end], j) => ({ start, end, state: st[j] || (j === k ? 'active' : '') })) });
const calPanels = (k, st) => {
  const c = CAL[k];
  return [
    calIv(k),
    arr(c.keys, { label: 'sorted keys', showIndices: false, highlights: st }),
    arr(c.d, { label: 'delta', showIndices: false, highlights: st }),
    arr(c.runs, { label: 'running sum', showIndices: false, highlights: Object.fromEntries(c.runs.map((v, i) => [i, v === c.best ? 'done' : ''])) }),
  ];
};
const keyHl = (k, xs) => Object.fromEntries(CAL[k].keys.map((x, i) => [i, xs.includes(x) ? 'active' : '']));
const C3zero = CAL[2].keys.indexOf(600);
check(CAL[2].d[C3zero] === 0, 'touching bookings net to 0 at 600');

export default [
  {
    id: 'fenwick-tree-bit',
    title: 'Update and range-sum, both in O(log n)',
    steps: [
      {
        kind: 'watch',
        title: 'Each simple design is slow at one thing',
        lines: ['Mixed **update(i, v)** and **sumRange(l, r)** calls on one array.', 'Plain array: update O(1), sum O(n). Prefix sums: sum O(1), update O(n).'],
        frames: [
          { say: 0, note: 'e.g. nums = [3, 1, 4, 1, 5, 9] at positions 1..6, with updates and sums arriving mixed.', panels: [arr(FN, { label: 'nums (positions 1..6)', indexBase: 1 })] },
          {
            say: 1,
            note: `Prefix sums: changing position 2 shifts P[2..6], every prefix that holds it. ${P6.length - 2} rewrites.`,
            panels: [arr(FN, { label: 'nums', indexBase: 1, highlights: { 1: 'active' } }), arr(P6, { label: 'P', highlights: hl(7, (k) => (k >= 2 ? 'bad' : '')) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Cell i holds the lowbit(i) elements ending at i',
        lines: ['`lowbit(i) = i & -i`, the value of the lowest set bit of i.', '`tree[i]` = sum of positions `(i − lowbit(i), i]`: blocks of 1, 2 or 4 here.'],
        frames: [
          { say: 0, note: 'Lowest set bit of 1..6: 1, 2, 1, 4, 1, 2. That is how many elements each cell sums.', panels: [coverT(FT)] },
          { say: 1, note: `tree[4]: lowbit 4, so it covers 1..4: 3 + 1 + 4 + 1 = ${FT[4]}.`, panels: [coverT(FT, { 4: 'active' }), coverNums(4)] },
          { say: 1, note: `tree[6]: 110 has lowbit 2, so it covers 5..6: 5 + 9 = ${FT[6]}. n + 1 numbers in total.`, panels: [coverT(FT, { 6: 'active' }), coverNums(6)] },
        ],
      },
      {
        kind: 'watch',
        title: 'Queries drop bits, updates add them',
        lines: ['`prefix(i)`: add tree[i], then `i -= i & -i` until 0.', '`add(i, d)`: tree[i] += d, then `i += i & -i` until past n.', '`range(l, r) = prefix(r) − prefix(l − 1)`. Clues: **"update" and "sumRange" in the same class**, n and q up to 10^5.'],
        frames: [
          ...FP5.path.map((p, k) => ({
            say: 0,
            note: `prefix(5): i = ${p.i} (${bin(p.i)}): add tree[${p.i}] = ${FT[p.i]} (covers ${covers(p.i)}). Sum ${p.s}. i −= ${lowbit(p.i)} → ${p.i - lowbit(p.i)}${p.i - lowbit(p.i) === 0 ? ', stop' : ''}.`,
            panels: [coverT(FT, Object.fromEntries(FP5.path.slice(0, k + 1).map((q, m) => [q.i, m === k ? 'active' : 'done']))), coverNums(p.i)],
          })),
          {
            say: 2,
            note: `range(2, 5) = prefix(5) − prefix(1) = ${FP5.s} − ${FP1.s} = ${FP5.s - FP1.s}. Subtraction works because sums are invertible.`,
            panels: [arr(FN, { label: 'nums', indexBase: 1, range: [1, 4], highlights: win(6, 1, 4) }), vars({ 'prefix(5)': FP5.s, 'prefix(1)': FP1.s, 'range(2, 5)': FP5.s - FP1.s })],
          },
          ...FU.map((i, k) => ({
            say: 1,
            note: `Position 5 goes 5 → 7: add(5, +2). i = ${i}: tree[${i}] (covers ${covers(i)}) += 2. i += ${lowbit(i)} → ${i + lowbit(i)}${i + lowbit(i) > 6 ? ' > 6, stop' : ''}.`,
            panels: [coverT(FU.slice(0, k + 1).reduce((t, j) => ((t[j] = FT2[j]), t), FT.slice()), Object.fromEntries(FU.slice(0, k + 1).map((j, m) => [j, m === k ? 'active' : 'done'])))],
          })),
          { say: 2, note: 'Each loop changes one bit per step, so both are O(log n).', panels: [vars({ update: 'O(log n)', 'prefix / range': 'O(log n)', memory: 'n + 1' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: update position 3',
        lines: ['Same n = 6 tree. Now `add(3, d)`.', 'It starts at tree[3], which covers only position 3.'],
        panels: [coverT(FT2, { 3: 'active' })],
        task: {
          type: 'choose',
          question: 'Which cells does add(3, d) change?',
          options: [
            { text: 'tree[3] and tree[4]' },
            { text: 'tree[3] and tree[2]', why: '3 − 1 = 2 is the query direction. tree[2] covers 1..2 and does not hold position 3.' },
            { text: 'tree[3], tree[4] and tree[8]', why: 'There is no tree[8] when n = 6: the loop stops once i > n.' },
            { text: 'tree[3] through tree[6]', why: 'tree[5] and tree[6] cover 5..6, not position 3. Rewriting every later cell is the prefix-sum cost.' },
          ],
          answer: 0,
        },
        solved: `3 → 4 → 8 > 6, stop: exactly the blocks that hold position 3. Updates **add** the lowest bit; queries **remove** it.`,
      },
    ],
  },

  {
    id: 'bit-coordinate-compression-counting',
    title: 'Count smaller values before you, even at ±10^9',
    steps: [
      {
        kind: 'watch',
        title: 'Pairs are O(n²), and values are not indices',
        lines: ['For each j: **how many earlier values are smaller**? Checking every i < j is O(n²).', 'A BIT indexed by value needs indices 1..m, but values may run from −10^9 to 10^9.'],
        frames: [
          { say: 0, note: `e.g. nums = [−3, 9e8, 25, 9e8, −100]. For j = 2 (25), compare with both earlier values: ${CBRUTE[2]} is smaller.`, panels: [arr(CNs, { label: 'nums', pointers: [ptr(2, 'j')], highlights: hl(5, (k) => (k === 2 ? 'active' : k < 2 ? 'visited' : '')) })] },
          { say: 1, note: 'A count array indexed by 9e8 needs 9e8 slots, and −100 is no index at all.', panels: [vars({ 'largest value': '9e8', 'smallest value': -100, n: 5 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Keep only the order: ranks',
        lines: ['`sorted = [...new Set(nums)].sort((a, b) => a - b)`.', 'Rank = place in `sorted`, 1-based. "Less than" only needs the order, and ranks keep it.'],
        frames: [
          { say: 0, note: 'Distinct values sorted numerically. The default sort() would sort them as strings.', panels: [table(CRUN.sorted.map((v) => String(sh(v))), ['rank'], CRUN.sorted.map((_, i) => [String(i + 1)]), null, 'rank')] },
          { say: 1, note: `ranks = [${CRANKS.join(', ')}]: indices 1..4, the same smaller/larger relations as nums.`, panels: [arr(CNs, { label: 'nums' }), arr(CRANKS, { label: 'ranks', highlights: hl(5, () => 'done') })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Scan: ask first, then insert',
        lines: ['For x with rank r: count seen values with **rank < r** (a BIT prefix), then add 1 at r.', 'Asking before inserting keeps x from counting itself.'],
        frames: [
          ...CRUN.steps.filter((s) => s.j < 3).map(cScanFrame),
          { say: 1, note: 'Clues: "count of smaller numbers after self", "reverse pairs", "pairs i < j such that", values up to ±10^9.', panels: [vars({ sort: 'O(n log n)', 'n BIT steps': 'O(n log n)', brute: 'O(n²)' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the second 9e8',
        lines: [`j = 3, x = 9e8, rank ${CT.r}. Seen so far: −3, 9e8, 25.`, 'The answer must count only values **strictly smaller** than 9e8.'],
        panels: [arr(CNs, { label: 'nums', pointers: [ptr(3, 'x')], highlights: hl(5, (k) => (k === 3 ? 'active' : k < 3 ? 'done' : '')) }), fenP(CT.before, {}, 'BIT over ranks, tree[1..4]'), arr(CT.out.slice(0, 3).concat(['?', '·']), { label: 'smaller before' })],
        task: {
          type: 'choose',
          question: 'Which BIT question gives the count for this 9e8?',
          options: [
            { text: `Ranks < 4, i.e. prefix up to rank 3 → ${ctLess}` },
            { text: `Ranks ≤ 4 → ${ctLe}`, why: 'That counts the earlier 9e8 too: equal is not smaller. "Strictly smaller" stops at rank − 1.' },
            { text: `Insert it first, then ranks ≤ 4 → ${ctAfter}`, why: 'Inserting before asking makes x pair with itself, on top of counting the equal value.' },
            { text: 'Read count[900000000] directly', why: 'That needs an array of 9e8 slots; rank 4 stands in for the value.' },
          ],
          answer: 0,
        },
        solved: `Compress, then for each x ask the BIT for **ranks < rank(x)** before inserting x. Answers: [${CRUN.out.join(', ')}], O(n log n).`,
      },
    ],
  },

  {
    id: 'segment-tree-range-query',
    title: 'Range min on a changing array',
    steps: [
      {
        kind: 'watch',
        title: 'Min cannot be subtracted',
        lines: ['Mixed **update index i** and **min of [l, r]** calls.', 'A Fenwick tree turns prefixes into ranges by subtraction, but min is not invertible.'],
        frames: [
          { say: 0, note: `e.g. nums = [5, 8, 3, 9, 6, 4]. min of [1, 4] = ${SQ.v}, with updates between queries.`, panels: [arr(SN, { label: 'nums', range: [1, 4], highlights: win(6, 1, 4) })] },
          {
            say: 1,
            note: 'Prefix mins up to 4 and up to 0 are 3 and 5. Nothing undoes a min, so they do not give min of [1, 4].',
            panels: [arr(SN.map((_, k) => minOf(SN, 0, k)), { label: 'prefix min', highlights: { 0: 'bad', 4: 'bad' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'A query takes the nodes that tile the range',
        lines: ['Each node stores the min of its segment `[lo, hi]`; children split at `mid = (lo + hi) >> 1`.', 'No overlap → Infinity. Full overlap → take the node, stop. Partial → ask both children.'],
        frames: [
          { say: 0, note: 'Root covers 0-5; each node splits in two; leaves are single elements. Labels are ranges.', panels: [segDraw(S3, { lab: (k) => rng(S3.meta[k]) })] },
          { say: 0, note: `Each node = min of its two children. Root = ${S3old[1]}.`, panels: [segDraw({ ...S3, t: S3old }), arr(SN, { label: 'nums' })] },
          ...sqLevels.map((lv, d) => ({
            say: 1,
            note: `Depth ${d}: ${lv.map((v) => `[${rng(S3.meta[v.node])}] ${v.c === 'full' ? `full, take ${S3old[v.node]}` : v.c === 'none' ? 'none' : 'partial'}`).join('; ')}.${d === 3 ? ` Answer min(${sqTaken(3).join(', ')}) = ${SQ.v}.` : ''}`,
            panels: [
              segDraw({ ...S3, t: S3old }, { st: Object.fromEntries(SQ.vis.filter((v) => S3.meta[v.node].d <= d).map((v) => [v.node, S3.meta[v.node].d === d && v.c !== 'none' ? (v.c === 'full' ? 'done' : 'active') : CASE_ST[v.c]])) }),
              arr(SN, { label: 'query [1, 4]', range: [1, 4], highlights: win(6, 1, 4) }),
            ],
          })),
        ],
      },
      {
        kind: 'watch',
        title: 'An update fixes one path',
        lines: ['`update(i, v)`: go down to the leaf of i, set it, recompute every node on the way back up.', 'Clues: **"update index i" + "min/max of range"**, q queries interleaved with modifications.'],
        frames: [
          { say: 0, note: 'update(2, 10): root → [0-2] → leaf [2], set to 10.', panels: [segDraw({ ...S3, t: { ...S3old, 5: 10 } }, { st: { 1: 'visited', 2: 'visited', 5: 'active' } }), arr(SN2, { label: 'nums', highlights: { 2: 'active' } })] },
          { say: 0, note: `Back up: [0-2] = min(${S3.t[4]}, 10) = ${S3.t[2]}, root = min(${S3.t[2]}, ${S3.t[3]}) = ${S3.t[1]}. Only one node per level changed.`, panels: [segDraw(S3, { st: { 5: 'done', 2: 'done', 1: 'active' } })] },
          {
            say: 1,
            note: `min of [1, 4] again: the same tiles [1], [2], [3-4] now give ${SQ2.v}. O(log n) per query and per update.`,
            panels: [segDraw(S3, { st: Object.fromEntries(SQ2.vis.map((v) => [v.node, CASE_ST[v.c]])) }), arr(SN2, { label: 'query [1, 4]', range: [1, 4], highlights: win(6, 1, 4) })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: tile [0, 4]',
        lines: ['Same tree after the update: nums = [5, 8, 10, 9, 6, 4].', 'Query: **min of [0, 4]**.'],
        panels: [segDraw(S3, { lab: (k) => `${rng(S3.meta[k])}: ${S3.t[k]}` }), arr(SN2, { label: 'query [0, 4]', range: [0, 4], highlights: win(6, 0, 4) })],
        task: {
          type: 'choose',
          question: 'Which nodes does the query take whole (full overlap)?',
          options: [
            { text: `[0-2] and [3-4] → min(${S3.t[2]}, ${S3.t[6]}) = ${STURN.v}` },
            { text: 'The five leaves [0] .. [4]', why: 'Same value, but O(n) work. A node fully inside the range is taken without going deeper.' },
            { text: 'The root [0-5]', why: 'The root also covers index 5 (value 4), outside the range: partial overlap, so it splits.' },
            { text: '[0-2] and [3-5]', why: '[3-5] includes index 5: partial overlap. Its child [3-4] fits exactly.' },
          ],
          answer: 0,
        },
        solved: 'A query combines the few nodes that **exactly tile** [l, r]: at most two partial nodes per level, so O(log n).',
      },
    ],
  },

  {
    id: 'segment-tree-lazy-propagation',
    title: 'Add to a whole range without touching every leaf',
    steps: [
      {
        kind: 'watch',
        title: 'A range add, leaf by leaf, is O(n)',
        lines: ['Mixed **add val to every element in [l, r]** and **sum of [l, r]** calls.', 'Adding to each element touches r − l + 1 leaves per update.'],
        frames: [
          { say: 0, note: 'e.g. nums = [3, 1, 4, 2, 6, 5] in a sum segment tree. Next: add 2 to [0, 4].', panels: [segDraw({ ...L4, t: L4start }, { label: 'sum' }), arr(LN, { label: 'nums' })] },
          {
            say: 1,
            note: 'Leaf by leaf, that is 5 leaves plus every parent above them, for one update.',
            panels: [segDraw({ ...L4, t: L4start }, { label: 'sum', st: Object.fromEntries(Object.entries(L4.meta).filter(([, m]) => m.lo <= 4).map(([k]) => [k, 'bad'])) }), arr(LN, { label: 'add 2 to [0, 4]', range: [0, 4], highlights: win(6, 0, 4) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Stop at covered nodes and leave a tag',
        lines: ['Full overlap: `sum += d × (hi − lo + 1)`, `lazy += d`, and stop.', 'Partial: push, recurse into both children, then recompute the sum.'],
        frames: [
          { say: 0, note: `[0-2] is inside [0, 4]: sum ${L4start[2]} + 2 × 3 = ${tagOf(2).t[2]}, lazy = 2. Its children are not visited.`, panels: [lzDraw(tagOf(2).t, tagOf(2).lazy, { 1: 'visited', 2: 'active' })] },
          { say: 0, note: `[3-4] is inside too: ${L4start[6]} + 2 × 2 = ${tagOf(6).t[6]}, lazy = 2. [5] has no overlap.`, panels: [lzDraw(tagOf(6).t, tagOf(6).lazy, { 1: 'visited', 2: 'done', 3: 'visited', 6: 'active', 7: 'muted' })] },
          { say: 1, note: `Back up: [3-5] = ${fixRoot.t[6]} + ${fixRoot.t[7]} = ${fixRoot.t[3]}, root = ${fixRoot.t[1]}. The leaves below the tags still owe +2.`, panels: [lzDraw(fixRoot.t, fixRoot.lazy, { 1: 'active', 3: 'done', 2: 'done', 6: 'done' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Push a tag only when you go below it',
        lines: ['`push`: apply the tag to both children (sums and tags), then clear it.', 'Clues: **"add val to every element in [l, r]"**, **"set all elements in range to x"**, many range updates AND range queries.'],
        frames: [
          {
            say: 0,
            note: `sum of [2, 3]: [0-2] is partial and owes +2. Push: [0-1] = ${L4start[4]} + 2 × 2 = ${P2.t[4]}, [2] = ${P2.t[5]}; lazy[0-2] = 0.`,
            panels: [lzDraw(P2.t, P2.lazy, { 1: 'visited', 2: 'active', 4: 'done', 5: 'done' }), arr(LN2, { label: 'query [2, 3]', range: [2, 3], highlights: win(6, 2, 3) })],
          },
          { say: 0, note: `[0-1] has no overlap; [2] is full: take ${P2.t[5]}.`, panels: [lzDraw(P2.t, P2.lazy, { 1: 'visited', 2: 'visited', 4: 'muted', 5: 'done' }), vars({ taken: P2.t[5] })] },
          { say: 1, note: 'Each push is O(1) and happens on a path being walked anyway: O(log n) per operation.', panels: [vars({ 'range add': 'O(log n)', 'range sum': 'O(log n)' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: node [3-4] still owes +2',
        lines: ['The query is now at [3-5] → [3-4]: partial (index 4 is outside [2, 3]).', `[3-4] shows ${turnT.t[6]} (+2); its children still show ${turnT.t[12]} and ${turnT.t[13]}.`],
        panels: [lzDraw(turnT.t, turnT.lazy, { 1: 'visited', 2: 'visited', 5: 'done', 3: 'visited', 6: 'active' }), vars({ taken: P2.t[5] })],
        task: {
          type: 'choose',
          question: 'What must happen at [3-4] before reading its children?',
          options: [
            { text: `Push: [3] = ${P6n.t[12]}, [4] = ${P6n.t[13]}, clear lazy, then go down` },
            { text: `Go down and take [3] = ${turnT.t[12]}`, why: `[3] is stale: it misses the +2 parked at [3-4]. The answer would be ${staleAns}, not ${LQ}.` },
            { text: `Return [3-4] = ${turnT.t[6]} whole`, why: 'It also covers index 4, outside [2, 3]: partial overlap must split.' },
            { text: 'Clear the lazy tag and go down', why: 'Dropping the tag loses the +2 for both children for good.' },
          ],
          answer: 0,
        },
        solved: `Push before descending, in queries **and** updates. Then [3] = ${P6n.t[12]}, and sum of [2, 3] = ${P2.t[5]} + ${P6n.t[12]} = ${LQ}.`,
      },
    ],
  },

  {
    id: 'sparse-table-rmq',
    title: 'Range min in O(1) on a fixed array',
    steps: [
      {
        kind: 'watch',
        title: 'Many min queries, no updates',
        lines: ['The array **does not change**, and q (up to 10^5–10^6) queries ask "minimum on [l, r]".', 'A segment tree pays O(log n) per query. Precompute more and pay O(1).'],
        frames: [{ say: 0, note: `e.g. nums = [5, 9, 4, 7, 8, 2, 6, 3]. min of [0, 4] = ${XQ.v}; many more queries follow.`, panels: [arr(XN, { label: 'nums', range: [0, 4], highlights: win(8, 0, 4) })] }],
      },
      {
        kind: 'watch',
        title: 'Every power-of-two block, from every start',
        lines: ['`st[k][i]` = min of the block of length 2^k starting at i.', '`st[k][i] = min(st[k−1][i], st[k−1][i + 2^(k−1)])`: two halves of the level below. O(n log n) build.'],
        frames: [
          { say: 0, note: 'k = 0: blocks of length 1, the array itself.', panels: [stT(0)] },
          { say: 1, note: `k = 1: st[1][1] = min(st[0][1], st[0][2]) = min(9, 4) = ${ST[1][1]}.`, panels: [stT(1, stBuild(1, 1))] },
          { say: 1, note: `k = 2: st[2][2] = min(st[1][2], st[1][4]) = min(${ST[1][2]}, ${ST[1][4]}) = ${ST[2][2]}.`, panels: [stT(2, stBuild(2, 2))] },
          { say: 1, note: `k = 3: one block of 8. st[3][0] = min(st[2][0], st[2][4]) = min(${ST[2][0]}, ${ST[2][4]}) = ${ST[3][0]}.`, panels: [stT(3, stBuild(3, 0))] },
        ],
      },
      {
        kind: 'watch',
        title: 'Two blocks cover any range',
        lines: ['`k = LOG[r − l + 1]`, so 2^k ≤ length < 2^(k+1).', 'Answer = `min(st[k][l], st[k][r − 2^k + 1])`: one block from l, one ending at r.', 'The blocks may overlap: harmless, because min(x, x) = x.'],
        frames: [
          { say: 0, note: `Query [0, 4]: length 5, LOG[5] = ${XQ.k}, so blocks of length ${1 << XQ.k}.`, panels: [arr(XN, { label: 'nums', range: [0, 4], highlights: win(8, 0, 4) }), vars({ length: 5, k: XQ.k, 'block length': 1 << XQ.k })] },
          {
            say: 1,
            note: `Block from l: st[2][0] covers 0..3 = ${ST[2][0]}. Block ending at r: st[2][${XQ.b}] covers ${XQ.b}..4 = ${ST[2][XQ.b]}.`,
            panels: [stT(3, { '2,0': 'active', [`2,${XQ.b}`]: 'active' }), arr(XN, { label: 'two blocks', range: [0, 4], highlights: hl(8, (k) => (k >= 1 && k <= 3 ? 'visited' : k <= 4 ? 'window' : '')) })],
          },
          { say: 2, note: `Indices 1..3 are in both blocks; min does not care. Answer min(${ST[2][0]}, ${ST[2][XQ.b]}) = ${XQ.v}.`, panels: [vars({ answer: XQ.v, build: 'O(n log n)', query: 'O(1)' })] },
          { say: 0, note: 'Clues: "array does not change", "answer q queries: minimum on [l, r]", q up to 10^5–10^6.', panels: [vars({ fits: 'min, max, gcd', 'not for': 'sums (overlap double-counts)' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: query [3, 5]',
        lines: [`Length 3, so k = LOG[3] = ${XT.k}: blocks of length 2.`, 'One block starts at l = 3; the other must end at r = 5.'],
        panels: [stT(3), arr(XN, { label: 'query [3, 5]', range: [3, 5], highlights: win(8, 3, 5) })],
        task: {
          type: 'choose',
          question: 'Which two cells give min of [3, 5]?',
          options: [
            { text: `st[1][3] and st[1][4] → min(${ST[1][3]}, ${ST[1][4]}) = ${XT.v}` },
            { text: `st[1][3] and st[1][5]`, why: 'st[1][5] covers 5..6, past r. The second block starts at r − 2^k + 1 = 4.' },
            { text: 'st[2][3] alone', why: 'Length 4 covers 3..6, past r. k = floor(log2 3) = 1.' },
            { text: 'st[0][3], st[0][4] and st[0][5]', why: 'Right value, but that is a scan of the range. Two table cells are always enough.' },
          ],
          answer: 0,
        },
        solved: 'Second block start = **r − 2^k + 1**. The two blocks of length 2^k overlap at index 4, and min does not mind.',
      },
    ],
  },

  {
    id: 'range-query-index-lists',
    title: 'How often does v appear in [l, r]? Two binary searches',
    steps: [
      {
        kind: 'watch',
        title: 'Scanning the slice for every query',
        lines: ['`query(left, right, value)`: how many times does value appear in arr[left..right]? The array is given once.', 'Scanning is O(length) per query; a tree would need one structure per value.'],
        frames: [
          { say: 0, note: 'e.g. arr = [2, 5, 2, 2, 7, 5, 2] and query(1, 5, 2).', panels: [arr(IA, { label: 'arr', range: [1, 5], highlights: win(7, 1, 5) })] },
          { say: 1, note: `A scan reads 5 cells to find ${brute(1, 5, 2)} twos. The next query reads its cells all over again.`, panels: [arr(IA, { label: 'arr', range: [1, 5], highlights: win(7, 1, 5, { 1: 'visited', 2: 'active', 3: 'active', 4: 'visited', 5: 'visited' }) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Positions per value, sorted for free',
        lines: ['Scan once: push each index i into `pos[arr[i]]`.', 'Pushing left to right keeps every list sorted: no re-sort, no unshift.'],
        frames: [
          { say: 0, note: 'After indices 0..3: value 2 has positions 0, 2, 3; value 5 has 1.', panels: [arr(IA, { label: 'arr', highlights: hl(7, (k) => (k <= 3 ? 'done' : '')) }), posT(buildPos(4), 2)] },
          { say: 1, note: 'All seven indices pushed. Every list is already in increasing order. O(n) build.', panels: [arr(IA, { label: 'arr', highlights: hl(7, () => 'done') }), posT(POS, 2)] },
        ],
      },
      {
        kind: 'watch',
        title: 'Count = two lowerBounds',
        lines: ['`count = lowerBound(a, r + 1) − lowerBound(a, l)`, with a = pos[value].', 'lowerBound(a, x) = the first slot whose position is ≥ x.', 'Clues: **"frequency of value in subarray"**, **"query(left, right, value)"**, array given once in the constructor.'],
        frames: [
          { say: 1, note: `query(1, 5, 2), a = pos[2]. lowerBound(a, 1) = ${LB1}: position 2 is the first ≥ 1.`, panels: [arr(A2, { label: 'pos[2]', pointers: [ptr(LB1, 'l')], highlights: { [LB1]: 'active' } })] },
          { say: 0, note: `lowerBound(a, 5 + 1) = ${LB6}: position 6 is the first ≥ 6, so slots ${LB1}..${LB6 - 1} are inside [1, 5].`, panels: [arr(A2, { label: 'pos[2]', pointers: [ptr(LB1, 'l'), ptr(LB6, 'r+1', 'b')], range: [LB1, LB6 - 1], highlights: win(4, LB1, LB6 - 1) })] },
          { say: 0, note: `count = ${LB6} − ${LB1} = ${count(1, 5, 2)}: positions 2 and 3. O(log n), no tree.`, panels: [arr(IA, { label: 'arr', range: [1, 5], highlights: win(7, 1, 5, { 2: 'done', 3: 'done' }) }), vars({ count: count(1, 5, 2) })] },
          { say: 2, note: 'The array never changes, so the lists never need editing.', panels: [vars({ build: 'O(n)', query: 'O(log n)', memory: 'O(n)' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: query(2, 6, 2)',
        lines: ['Same `pos[2] = [0, 2, 3, 6]`.', 'Both ends are inclusive: positions 2 and 6 count.'],
        panels: [arr(A2, { label: 'pos[2]' }), arr(IA, { label: 'arr', range: [2, 6], highlights: win(7, 2, 6) })],
        task: {
          type: 'choose',
          question: 'Which expression gives the count?',
          options: [
            { text: `lowerBound(a, 7) − lowerBound(a, 2) = ${lowerBound(A2, 7)} − ${lowerBound(A2, 2)} = ${count(2, 6, 2)}` },
            { text: 'lowerBound(a, 6) − lowerBound(a, 2) = 3 − 1 = 2', why: 'lowerBound(a, 6) stops before position 6 itself. The inclusive right end needs r + 1.' },
            { text: 'lowerBound(a, 7) − lowerBound(a, 3) = 4 − 2 = 2', why: 'Searching for l + 1 drops position 2, which is inside [2, 6].' },
            { text: 'Scan arr[2..6] and count the 2s', why: 'Right count, but O(length) per query: the lists exist to avoid that.' },
          ],
          answer: 0,
        },
        solved: 'Inclusive [l, r] → **lowerBound(r + 1) − lowerBound(l)**. Positions 2, 3 and 6: three.',
      },
    ],
  },

  {
    id: 'dynamic-interval-coverage',
    title: 'Max overlap with coordinates up to 10^9',
    steps: [
      {
        kind: 'watch',
        title: 'No array of size 10^9',
        lines: ['Bookings `[start, end)` with **0 <= start < end <= 10^9**; after each one, report the maximum overlap.', 'You cannot allocate 10^9 cells, but only the endpoints that appear matter.'],
        frames: [
          { say: 0, note: 'e.g. book [100, 400), [300, 600), [600, 900), then [200, 700). Half-open: the end is not included.', panels: [calIv(3, { 0: 'muted', 1: 'muted', 2: 'muted', 3: 'muted' })] },
          { say: 1, note: `Between two consecutive endpoints nothing changes: ${ENDPOINTS} distinct endpoints, not 10^9 cells.`, panels: [vars({ 'possible cells': '10^9', endpoints: ENDPOINTS })] },
        ],
      },
      {
        kind: 'watch',
        title: '+1 at start, −1 at end, sweep the keys',
        lines: ['`delta[start] += 1`, `delta[end] −= 1` in a map.', 'Walk the keys in numeric order with a running sum; its max is the answer.'],
        frames: [
          { say: 0, note: `[100, 400): +1 at 100, −1 at 400. Running sums ${CAL[0].runs.join(', ')} → max ${CAL[0].best}.`, panels: calPanels(0, keyHl(0, [100, 400])) },
          { say: 1, note: `[300, 600): running sum reaches 2 at 300 (both bookings cover [300, 400)). max ${CAL[1].best}.`, panels: calPanels(1, keyHl(1, [300, 600])) },
          { say: 1, note: `[600, 900): at 600 one booking ends and one starts, −1 + 1 = 0. Half-open, so no overlap: max stays ${CAL[2].best}.`, panels: calPanels(2, { [C3zero]: 'active' }) },
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"0 <= start < end <= 10^9"**, **"at most 400/1000 calls"**, **"half-open interval [left, right)"**, **"track ranges"**.', 'Other routes: a sorted list of disjoint intervals (Range Module), or compress the endpoints and run a segment tree (Falling Squares).'],
        frames: [{ say: 0, note: 'Few calls, huge coordinates: store breakpoints, not cells. Sort keys numerically, never with the default sort.', panels: [vars({ store: 'only endpoints that appear', 'running sum': 'overlap at that point' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: book [200, 700)',
        lines: ['The map already holds the first three bookings.', 'Now +1 at 200 and −1 at 700.'],
        panels: [calIv(3), table(CAL[2].keys.map(String), ['delta'], CAL[2].d.map((d) => [String(d)]), null, 'delta before')],
        task: {
          type: 'choose',
          question: 'What does book(200, 700) return?',
          options: [
            { text: `${CAL[3].best}: at 300 the running sum is 3 ([100, 400), [200, 700), [300, 600))` },
            { text: '4: all four bookings overlap', why: '[100, 400) ends before [600, 900) starts; no point lies inside all four.' },
            { text: `${CAL[2].best}: the max before this booking`, why: 'The new booking lies over [300, 400), where two bookings already meet, so the sum rises to 3.' },
          ],
          answer: 0,
        },
        solved: `Only endpoints matter: +1 / −1 in a map, sweep sorted keys, max running sum = ${CAL[3].best}. Half-open ends keep touching bookings apart.`,
      },
    ],
  },
];
