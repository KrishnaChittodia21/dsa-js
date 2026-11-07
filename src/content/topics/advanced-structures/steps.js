// Step lessons for Advanced Structures (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every Fenwick cell, lowbit jump, segment-tree node, lazy tag, sparse-table cell and answer below comes from
// running the lesson's own code on the example input; check() throws if a run drifts.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const check = (ok, msg) => {
  if (!ok) throw new Error(`advanced-structures steps drifted: ${msg}`);
};
const bin = (x, w = 4) => x.toString(2).padStart(w, '0');
const lowbit = (i) => i & -i;

// ---------- Fenwick (lesson code: add / prefixSum, 0-based API over 1-based cells) ----------
function fenAdd(tree, index, delta) {
  const path = [];
  for (let i = index + 1; i < tree.length; i += i & -i) {
    const before = tree[i];
    tree[i] += delta;
    path.push({ i, before, after: tree[i] });
  }
  return path;
}
function fenPrefix(tree, index) {
  const path = [];
  let s = 0;
  for (let i = index + 1; i > 0; i -= i & -i) {
    s += tree[i];
    path.push({ i, val: tree[i], s, next: i - (i & -i) });
  }
  return { s, path };
}
const fenFrom = (a) => {
  const t = new Array(a.length + 1).fill(0);
  a.forEach((v, i) => fenAdd(t, i, v));
  return t;
};
// tree[1..n] drawn with 1-based labels; st maps 1-based cell → state
const fenP = (tree, st = {}, label = 'tree[1..n]', pointers = []) =>
  arr(tree.slice(1), { label, indexBase: 1, highlights: Object.fromEntries(Object.entries(st).filter(([i]) => i >= 1 && i < tree.length).map(([i, s]) => [i - 1, s])), pointers: pointers.map((p) => ({ ...p, index: p.index - 1 })) });
// positions 1..n with the block (lo, hi] of one cell shaded
const coverP = (nums, i, label = 'nums (1-based)') => arr(nums, { label, indexBase: 1, range: [i - lowbit(i), i - 1], highlights: hl(nums.length, (k) => (k >= i - lowbit(i) && k <= i - 1 ? 'window' : '')) });

// ---------- recursive segment tree (heap layout: node k → 2k, 2k + 1) ----------
function segBuild(nums) {
  const n = nums.length;
  const t = new Array(4 * n).fill(0);
  const meta = {};
  const order = [];
  const b = (node, lo, hi, d) => {
    meta[node] = { lo, hi, d };
    if (lo === hi) {
      t[node] = nums[lo];
      order.push(node);
      return;
    }
    const mid = (lo + hi) >> 1;
    b(2 * node, lo, mid, d + 1);
    b(2 * node + 1, mid + 1, hi, d + 1);
    t[node] = t[2 * node] + t[2 * node + 1];
    order.push(node);
  };
  b(1, 0, n - 1, 0);
  return { n, t, meta, order };
}
function segQuery(S, l, r) {
  const vis = [];
  const q = (node, lo, hi) => {
    if (r < lo || hi < l) return vis.push({ node, c: 'none' }), 0;
    if (l <= lo && hi <= r) return vis.push({ node, c: 'full' }), S.t[node];
    vis.push({ node, c: 'partial' });
    const mid = (lo + hi) >> 1;
    return q(2 * node, lo, mid) + q(2 * node + 1, mid + 1, hi);
  };
  return { v: q(1, 0, S.n - 1), vis };
}
function segUpdate(S, i, val) {
  const down = [];
  const up = [];
  const u = (node, lo, hi) => {
    down.push(node);
    if (lo === hi) {
      S.t[node] = val;
      up.push(node);
      return;
    }
    const mid = (lo + hi) >> 1;
    if (i <= mid) u(2 * node, lo, mid);
    else u(2 * node + 1, mid + 1, hi);
    S.t[node] = S.t[2 * node] + S.t[2 * node + 1];
    up.push(node);
  };
  u(1, 0, S.n - 1);
  return { down, up };
}
const rng = (m) => (m.lo === m.hi ? `${m.lo}` : `${m.lo}-${m.hi}`);
// draw: x from the node's range, y = depth; lab(node) gives the label, st maps node → state
const segDraw = (S, { lab = (k) => S.t[k], st = {}, label, sx = 0.75 } = {}) => ({
  kind: 'nodes',
  ...(label ? { label } : {}),
  nodes: Object.entries(S.meta).map(([k, m]) => ({ id: +k, label: String(lab(+k)), x: (m.lo + m.hi) * sx, y: m.d, ...(st[k] ? { state: st[k] } : {}) })),
  edges: Object.keys(S.meta)
    .filter((k) => +k > 1)
    .map((k) => ({ from: +k >> 1, to: +k })),
});
const CASE_ST = { partial: 'visited', full: 'done', none: 'muted' };

// ---------- shared example arrays ----------
const NUMS = [5, 2, 9, -3, 5, 20, 10, -7]; // the lesson's array
const SEG = [2, 1, 5, 3]; // the lesson's segment-tree array

// ================= what =================
const whatRun = (() => {
  const a = NUMS.slice();
  const sum = (l, r) => a.slice(l, r + 1).reduce((s, x) => s + x, 0);
  const q1 = sum(1, 4);
  a[3] = 7;
  const q2 = sum(1, 4);
  const afterUpd = a.slice();
  a[0] = 1;
  const q3 = sum(0, 7);
  return { q1, q2, q3, afterUpd, final: a.slice() };
})();
check(whatRun.q1 === 13 && whatRun.q2 === 23, 'lesson what: 13 then 23');
const winHl = (n, l, r, extra = {}) => hl(n, (k) => extra[k] ?? (k >= l && k <= r ? 'window' : ''));

// ================= why: what each design touches =================
const N7 = NUMS.slice(0, 7);
const P7 = N7.reduce((p, x) => (p.push(p.at(-1) + x), p), [0]);
const T7 = fenFrom(N7);
const t7upd = fenAdd(T7.slice(), 0, 1).map((s) => s.i);
const t7qry = fenPrefix(T7, 6).path.map((s) => s.i);
check(t7upd.join() === '1,2,4' && t7qry.join() === '7,6,4', 'why BIT paths');
const WHY_ROWS = [
  ['plain', 1, 7],
  ['prefix', 7, 2],
  ['BIT', t7upd.length, t7qry.length],
];
const whyTable = (k) => table(WHY_ROWS.map((r) => r[0]), ['upd', 'qry'], WHY_ROWS.map((r, i) => (i <= k ? [String(r[1]), String(r[2])] : ['?', '?'])), WHY_ROWS.map((_, i) => (i === k ? ['active', 'active'] : i < k ? ['done', 'done'] : ['', ''])), 'cells touched');

// ================= when / recognize: tool shelf =================
const TOOLS = ['prefix', 'sparse', 'BIT', 'seg', 'lazy', 'lists'];
const toolP = (st = {}) => arr(TOOLS, { label: 'tool', showIndices: false, highlights: st });
const WHEN = [
  [{ changes: 'never', asks: 'sum' }, 0, 'Static array, range sums: **prefix sums**, O(1) query.'],
  [{ changes: 'never', asks: 'min/max/gcd' }, 1, 'Static array, many min/max/gcd queries: **sparse table**, O(1) query.'],
  [{ changes: 'point', asks: 'sum/count' }, 2, 'Point updates + range sums or counts: **Fenwick tree**.'],
  [{ changes: 'point', asks: 'min/max' }, 3, 'Point updates + min/max or any associative op: **segment tree**.'],
  [{ changes: 'range', asks: 'range' }, 4, 'Range updates + range queries: **lazy segment tree**.'],
];

// ================= intuition: power-of-two blocks over 1..8 =================
const B8 = segBuild([1, 2, 3, 4, 5, 6, 7, 8]); // only its shape is used: node k covers positions lo+1..hi+1
const blockLab = (k) => {
  const m = B8.meta[k];
  return m.lo === m.hi ? `${m.lo + 1}` : `${m.lo + 1}-${m.hi + 1}`;
};
const fenBlocks = Object.keys(B8.meta).filter((k) => {
  const m = B8.meta[k];
  const i = m.hi + 1;
  return m.hi - m.lo + 1 === lowbit(i);
});
check(fenBlocks.length === 8, 'Fenwick keeps exactly one block per index');
check(Object.keys(B8.meta).length === 15, 'segment tree on 8 has 15 blocks');

// ================= brute force =================
const bfPlain = (() => {
  const a = N7.slice();
  a[2] = 4;
  const frames = [{ say: 0, note: '`update(2, 4)`: one assignment. O(1).', panels: [arr(a.slice(), { label: 'this.nums', highlights: { 2: 'active' } }), vars({ s: '-' })] }];
  let s = 0;
  for (let i = 1; i <= 5; i++) {
    s += a[i];
    frames.push({ say: 1, note: `\`sumRange(1, 5)\`: i = ${i}, s += ${a[i]} → ${s}.`, panels: [arr(a.slice(), { label: 'this.nums', pointers: [ptr(i, 'i')], highlights: hl(7, (k) => (k === i ? 'active' : k >= 1 && k < i ? 'done' : '')) }), vars({ s, reads: i })] });
  }
  frames[frames.length - 1].note += ' 5 reads for a range of 5: O(n).';
  return { frames, s };
})();
check(bfPlain.s === 2 + 4 - 3 + 5 + 20, 'plain sumRange');
const bfPrefix = (() => {
  const nums = N7.slice();
  const P = P7.slice();
  const d = 4 - nums[2];
  nums[2] = 4;
  const frames = [{ say: 1, note: `\`update(2, 4)\`: d = 4 − 9 = ${d}.`, panels: [arr(nums.slice(), { label: 'this.nums', highlights: { 2: 'active' } }), arr(P.slice(), { label: 'this.P' }), vars({ d })] }];
  for (let k = 3; k < P.length; k++) {
    P[k] += d;
    frames.push({ say: 1, note: `k = ${k}: P[${k}] += ${d} → ${P[k]}.`, panels: [arr(nums.slice(), { label: 'this.nums', highlights: { 2: 'active' } }), arr(P.slice(), { label: 'this.P', pointers: [ptr(k, 'k')], highlights: hl(P.length, (j) => (j === k ? 'active' : j > 2 && j < k ? 'done' : '')) }), vars({ d, rewrites: k - 2 })] });
  }
  const ans = P[6] - P[1];
  frames.push({ say: 2, note: `\`sumRange(1, 5)\` = P[6] − P[1] = ${P[6]} − ${P[1]} = ${ans}. Two reads: O(1).`, panels: [arr(nums.slice(), { label: 'this.nums', range: [1, 5], highlights: winHl(7, 1, 5) }), arr(P.slice(), { label: 'this.P', highlights: { 6: 'active', 1: 'bad' }, pointers: [ptr(1, '−'), ptr(6, '+', 'b')] }), vars({ answer: ans })] });
  return { frames, ans };
})();
check(bfPrefix.ans === bfPlain.s, 'both brute forces agree');
const pairs = (n) => {
  let c = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) c++;
  return c;
};
check(pairs(6) === 15, 'pairs of 6');

// ================= optimized-fenwick =================
const TN = fenFrom(NUMS);
check(TN.slice(1).join() === '5,7,9,13,5,25,10,41', 'lesson tree values');
const lowbitFrames = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
  say: 0,
  note: `i = ${i} = ${bin(i)}. Lowest set bit: ${lowbit(i)}.`,
  panels: [arr([1, 2, 3, 4, 5, 6, 7, 8].map((j) => (j <= i ? lowbit(j) : '·')), { label: 'lowbit(i)', indexBase: 1, highlights: hl(8, (k) => (k === i - 1 ? 'active' : k < i - 1 ? 'done' : '')) }), vars({ i, binary: bin(i), 'i & -i': lowbit(i) })],
}));
check(((6 & -6) === 2) && (((-6) >>> 0) & 15) === 0b1010, '6 & -6');
lowbitFrames.push({ say: 1, note: '6 = 0110 and −6 = …1010 share only bit 1, so `6 & -6` = 0010 = 2.', panels: [arr([0, 1, 1, 0], { label: '6', showIndices: false, highlights: { 2: 'active' } }), arr([1, 0, 1, 0], { label: '−6 (low 4 bits)', showIndices: false, highlights: { 2: 'active' } }), arr([0, 0, 1, 0], { label: '6 & -6 = 2', showIndices: false, highlights: { 2: 'done' } })] });
const coverFrames = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
  say: i === 1 ? 0 : 1,
  note: `tree[${i}] covers (${i - lowbit(i)}, ${i}] = ${lowbit(i)} element${lowbit(i) > 1 ? 's' : ''}: sum ${TN[i]}.`,
  panels: [coverP(NUMS, i), fenP(TN, { [i]: 'active' })],
}));
const q7 = fenPrefix(TN, 6);
check(q7.path.map((s) => s.i).join() === '7,6,4' && q7.s === 48, 'prefix(7)');
const queryFrames = q7.path.map((s, k) => ({
  say: k === q7.path.length - 1 ? 1 : 0,
  note: `i = ${s.i} (${bin(s.i)}): add tree[${s.i}] = ${s.val} (covers ${s.i - lowbit(s.i) + 1}..${s.i}). Sum ${s.s}. i −= ${lowbit(s.i)} → ${s.next}.${s.next === 0 ? ' Stop.' : ''}`,
  panels: [coverP(NUMS, s.i), fenP(TN, Object.fromEntries(q7.path.map((p, j) => [p.i, j === k ? 'active' : j < k ? 'done' : ''])), 'tree[1..8]', [ptr(s.i, 'i')]), vars({ i: s.i, sum: s.s })],
}));
const u3 = fenAdd(TN.slice(), 2, 0).map((s) => s.i);
check(u3.join() === '3,4,8', 'update path of 3');
const updFrames = u3.map((i, k) => ({
  say: k === u3.length - 1 ? 1 : 0,
  note: `i = ${i} (${bin(i)}): tree[${i}] covers ${i - lowbit(i) + 1}..${i}, which holds position 3. i += ${lowbit(i)} → ${i + lowbit(i)}${i + lowbit(i) > 8 ? ' > 8: stop.' : '.'}`,
  panels: [coverP(NUMS, i), fenP(TN, Object.fromEntries(u3.map((j, m) => [j, m === k ? 'active' : m < k ? 'done' : ''])), 'tree[1..8]', [ptr(i, 'i')])],
}));
const u5 = fenAdd(TN.slice(), 4, 0).map((s) => s.i);
check(u5.join() === '5,6,8', 'update path of 5');
const q6 = fenPrefix(TN, 5).path.map((s) => s.i);
check(q6.join() === '6,4', 'prefix(6) path');

// ================= template =================
const TA = [3, 1, 4, 1, 5, 9];
const tplBuild = (() => {
  const t = new Array(TA.length + 1).fill(0);
  return TA.map((v, idx) => {
    const path = fenAdd(t, idx, v).map((s) => s.i);
    return {
      say: 1,
      note: `\`add(${idx}, ${v})\`: i = ${idx + 1}, then ${path.join(' → ')}. ${path.length} cell${path.length > 1 ? 's' : ''} get +${v}.`,
      panels: [arr(TA, { label: 'arr (0-based)', highlights: hl(TA.length, (k) => (k === idx ? 'active' : k < idx ? 'done' : '')) }), fenP(t.slice(), Object.fromEntries(path.map((i) => [i, 'active'])), 'tree[1..6]')],
    };
  });
})();
const TT = fenFrom(TA);
const rs4 = fenPrefix(TT, 4);
const rs1 = fenPrefix(TT, 1);
check(rs4.s - rs1.s === 4 + 1 + 5 && rs4.path.map((s) => s.i).join() === '5,4' && rs1.path.map((s) => s.i).join() === '2', 'rangeSum(2, 4)');
const rangeFrames = [
  { say: 2, note: `\`prefixSum(4)\`: i = 5 → 4. tree[5] + tree[4] = ${TT[5]} + ${TT[4]} = ${rs4.s}.`, panels: [arr(TA, { label: 'arr', highlights: winHl(6, 0, 4) }), fenP(TT, { 5: 'active', 4: 'active' }, 'tree[1..6]')] },
  { say: 2, note: `\`prefixSum(1)\`: i = 2 → 0. tree[2] = ${rs1.s}.`, panels: [arr(TA, { label: 'arr', highlights: winHl(6, 0, 1) }), fenP(TT, { 2: 'bad' }, 'tree[1..6]')] },
  { say: 2, note: `\`rangeSum(2, 4)\` = ${rs4.s} − ${rs1.s} = ${rs4.s - rs1.s} = 4 + 1 + 5. Subtraction works because sum is invertible.`, panels: [arr(TA, { label: 'arr', range: [2, 4], highlights: winHl(6, 2, 4) }), fenP(TT, { 5: 'active', 4: 'active', 2: 'bad' }, 'tree[1..6]'), vars({ answer: rs4.s - rs1.s })] },
];
const TU = TT.slice();
const tuPath = fenAdd(TU, 3, 6 - TA[3]).map((s) => s.i);
check(tuPath.join() === '4' && 6 - TA[3] === 5, 'assignment update path');
// O(n) build: copy, then push tree[i] into j = i + lowbit(i)
const linBuild = (() => {
  const t = [0, ...TA];
  const frames = [{ say: 0, note: 'Copy the values into tree[1..6].', panels: [fenP(t.slice(), {}, 'tree[1..6]')] }];
  for (let i = 1; i < t.length; i++) {
    const j = i + lowbit(i);
    if (j < t.length) {
      t[j] += t[i];
      frames.push({ say: 1, note: `i = ${i}: parent j = ${i} + ${lowbit(i)} = ${j}. tree[${j}] += ${t[i]} → ${t[j]}.`, panels: [fenP(t.slice(), { [i]: 'visited', [j]: 'active' }, 'tree[1..6]', [ptr(i, 'i'), ptr(j, 'j', 'b')])] });
    } else frames.push({ say: 1, note: `i = ${i}: j = ${j} > 6, nothing to push.`, panels: [fenP(t.slice(), { [i]: 'visited' }, 'tree[1..6]', [ptr(i, 'i')])] });
  }
  frames.push({ say: 2, note: 'Same cells as n calls to `add`, each cell visited once: O(n).', panels: [fenP(t.slice(), hl(7, () => 'done'), 'tree[1..6]')] });
  return { frames, t };
})();
check(linBuild.t.join() === TT.join(), 'O(n) build matches add-build');

// ================= implementation =================
const IA = [4, 2, 7, 1];
const implBuild = (() => {
  const nums = new Array(IA.length).fill(0);
  const t = new Array(IA.length + 1).fill(0);
  const frames = [{ say: 0, note: '`nums` and `tree` start as zeros.', panels: [arr(nums.slice(), { label: 'this.nums' }), fenP(t.slice(), {}, 'tree[1..4]')] }];
  IA.forEach((v, idx) => {
    const d = v - nums[idx];
    const path = fenAdd(t, idx, d).map((s) => s.i);
    nums[idx] = v;
    frames.push({ say: 1, note: `\`update(${idx}, ${v})\`: add ${v} − 0 = ${d} along ${path.join(' → ')}; nums[${idx}] = ${v}.`, panels: [arr(nums.slice(), { label: 'this.nums', highlights: { [idx]: 'active' } }), fenP(t.slice(), Object.fromEntries(path.map((i) => [i, 'active'])), 'tree[1..4]')] });
  });
  return { frames, t, nums };
})();
check(implBuild.t.join() === fenFrom(IA).join(), 'implementation build');
const ip2 = fenPrefix(implBuild.t, 2);
const ipm1 = fenPrefix(implBuild.t, -1);
check(ip2.s === 13 && ipm1.s === 0 && ipm1.path.length === 0, 'implementation sumRange(0, 2)');

// ================= dry-run =================
const DR = fenFrom(NUMS);
const dq = fenPrefix(DR, 6);
const LESSON_Q = [['7', '0111', '10', '10'], ['6', '0110', '25', '35'], ['4', '0100', '13', '48']];
check(dq.path.map((s) => [String(s.i), bin(s.i), String(s.val), String(s.s)].join()).join('|') === LESSON_Q.map((r) => r.join()).join('|'), 'dry-run prefixSum(6) table');
const DA = DR.slice();
const da = fenAdd(DA, 2, 4);
const LESSON_U = [['3', '0011', '9', '13'], ['4', '0100', '13', '17'], ['8', '1000', '41', '45']];
check(da.map((s) => [String(s.i), bin(s.i), String(s.before), String(s.after)].join()).join('|') === LESSON_U.map((r) => r.join()).join('|'), 'dry-run add(2, +4) table');
const dq2 = fenPrefix(DA, 6);
check(dq2.s === 52 && dq2.path.map((s) => s.i).join() === '7,6,4', 'prefixSum(6) after add');
const rowsUpTo = (rows, k) => table(rows.slice(0, k + 1).map((_, j) => `${j + 1}`), ['i', 'bin', ...(rows === LESSON_Q ? ['tree', 'sum'] : ['before', 'after'])], rows.slice(0, k + 1), rows.slice(0, k + 1).map((_, j) => Array(4).fill(j === k ? 'active' : 'done')));

// ================= optimized-compression =================
const CN = [40, -7, 1000000000, 40, 3];
const short = (v) => (v === 1000000000 ? '1e9' : v);
const CS = [...new Set(CN)].sort((a, b) => a - b);
const CR1 = CN.map((v) => CS.indexOf(v) + 1); // the text's 1-based ranks
check(CS.join() === '-7,3,40,1000000000' && CR1.join() === '3,1,4,3,2', 'lesson compression');
function countSmallerRun(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));
  const t = new Array(sorted.length + 1).fill(0);
  const res = new Array(nums.length).fill('?');
  const steps = [];
  for (let i = nums.length - 1; i >= 0; i--) {
    const r = rank.get(nums[i]);
    const q = r > 0 ? fenPrefix(t, r - 1) : { s: 0, path: [] };
    res[i] = q.s;
    const add = fenAdd(t, r, 1).map((s) => s.i);
    steps.push({ i, r, ask: q.s, read: q.path.map((s) => s.i), add, tree: t.slice(), res: res.slice() });
  }
  return { sorted, steps, res };
}
const CSR = countSmallerRun([5, 2, 6, 1]);
check(CSR.res.join() === '2,1,1,0', 'countSmaller [5,2,6,1]');
const CT = countSmallerRun([8, 3, 8, 1]);
check(CT.sorted.join() === '1,3,8' && CT.res[0] === 2, 'countSmaller [8,3,8,1]');

// ================= optimized-segment-tree =================
const S1 = segBuild(SEG);
check(S1.t[1] === 11 && S1.t[2] === 3 && S1.t[3] === 8, 'lesson segment tree');
const allNodes = Object.keys(S1.meta).map(Number);
const segBuildFrames = (() => {
  const shown = new Set();
  const frames = [{ say: 0, note: 'Root covers 0-3; each node splits at mid into two halves. Labels are ranges.', panels: [segDraw(S1, { lab: (k) => rng(S1.meta[k]) }), arr(SEG, { label: 'nums' })] }];
  for (const k of S1.order) {
    shown.add(k);
    const m = S1.meta[k];
    const leaf = m.lo === m.hi;
    frames.push({
      say: leaf ? 0 : 1,
      note: leaf ? `Leaf node ${k} = nums[${m.lo}] = ${S1.t[k]}.` : `Node ${k} [${m.lo},${m.hi}] = ${S1.t[2 * k]} + ${S1.t[2 * k + 1]} = ${S1.t[k]}.`,
      panels: [segDraw(S1, { lab: (j) => (shown.has(j) ? S1.t[j] : rng(S1.meta[j])), st: Object.fromEntries(allNodes.map((j) => [j, j === k ? 'active' : shown.has(j) ? 'done' : 'muted'])) }), arr(SEG, { label: 'nums', highlights: winHl(4, m.lo, m.hi, {}) })],
    });
  }
  return frames;
})();
const SQ = segQuery(S1, 1, 2);
check(SQ.v === 6 && SQ.vis.map((v) => `${v.node}${v.c[0]}`).join() === '1p,2p,4n,5f,3p,6f,7n', 'lesson query [1, 2] trace');
const segQueryFrames = (S, l, r, Q, say) => {
  let acc = 0;
  return Q.vis.map((v, k) => {
    if (v.c === 'full') acc += S.t[v.node];
    const m = S.meta[v.node];
    const what = { partial: 'partial overlap → ask both children', full: `full overlap → take ${S.t[v.node]}`, none: 'no overlap → 0' }[v.c];
    return {
      say: say[v.c],
      note: `Node ${v.node} [${m.lo},${m.hi}]: ${what}.${k === Q.vis.length - 1 ? ` Answer ${Q.v}.` : ''}`,
      panels: [segDraw(S, { st: Object.fromEntries(Q.vis.slice(0, k + 1).map((w, j) => [w.node, j === k ? 'active' : CASE_ST[w.c]])) }), arr(S.n === 4 ? SEG.map((_, i) => S.t[[4, 5, 6, 7][i]]) : [], { label: `query [${l}, ${r}]`, range: [l, r], highlights: winHl(4, l, r) }), vars({ taken: acc })],
    };
  });
};
const SQ2 = segQuery(S1, 0, 2);
check(SQ2.vis.map((v) => v.node).join() === '1,2,3,6,7' && SQ2.v === 8, 'query [0, 2] order');
const S1u = segBuild(SEG);
const before = S1u.t.slice();
const SU = segUpdate(S1u, 2, 7);
check(SU.down.join() === '1,3,6' && SU.up.join() === '6,3,1' && S1u.t[1] === 13, 'update(2, 7)');
const SQ3 = segQuery(S1u, 1, 3);
check(SQ3.v === 11, 'query [1, 3] after update');
const segUpdFrames = [
  ...SU.down.slice(0, -1).map((k) => ({ say: 0, note: `Node ${k} [${S1u.meta[k].lo},${S1u.meta[k].hi}]: 2 ≤ mid = ${(S1u.meta[k].lo + S1u.meta[k].hi) >> 1}? ${2 <= (S1u.meta[k].lo + S1u.meta[k].hi) >> 1 ? 'yes, go left' : 'no, go right'}.`, panels: [segDraw({ ...S1u, t: before }, { st: { [k]: 'active' } })] })),
  ...SU.up.map((k, j) => {
    const t = before.slice();
    SU.up.slice(0, j + 1).forEach((x) => (t[x] = S1u.t[x]));
    const m = S1u.meta[k];
    return {
      say: 1,
      note: m.lo === m.hi ? `Leaf node ${k}: set to 7.` : `Back up at node ${k}: recompute ${t[2 * k]} + ${t[2 * k + 1]} = ${t[k]}.`,
      panels: [segDraw({ ...S1u, t }, { st: Object.fromEntries(SU.up.map((x, i) => [x, i === j ? 'active' : i < j ? 'done' : 'visited'])) })],
    };
  }),
];

// ================= implementation-segment-tree (iterative 2n layout) =================
function itBuild(a) {
  const n = a.length;
  const t = new Array(2 * n).fill(0);
  const frames = [];
  for (let i = 0; i < n; i++) t[n + i] = a[i];
  frames.push({ i: null, t: t.slice() });
  for (let i = n - 1; i > 0; i--) {
    t[i] = t[2 * i] + t[2 * i + 1];
    frames.push({ i, t: t.slice() });
  }
  return { n, t, frames };
}
function itQuery(T, left, right) {
  let resL = 0, resR = 0;
  let l = left + T.n, r = right + T.n + 1;
  const log = [];
  while (l < r) {
    const took = [];
    if (l & 1) took.push(['L', l]), (resL += T.t[l++]);
    if (r & 1) took.push(['R', r - 1]), (resR = T.t[--r] + resR);
    log.push({ l, r, took, resL, resR });
    l >>= 1;
    r >>= 1;
  }
  return { v: resL + resR, log };
}
const IT = itBuild(SEG);
check(IT.t.slice(1).join() === '11,3,8,2,1,5,3', 'lesson iterative layout');
const itP = (t, st = {}, ptrs = []) => arr(t.map((v, i) => (i === 0 ? '·' : v)), { label: 'tree (2n)', highlights: { 0: 'muted', ...st }, pointers: ptrs });
const IQ = itQuery(IT, 1, 2);
check(IQ.v === 6 && IQ.log.length === 1, 'iterative query(1, 2)');
const IQ3 = itQuery(IT, 1, 3);
check(IQ3.v === 9, 'iterative query(1, 3)');
const itUpd = (() => {
  const t = IT.t.slice();
  let i = 2 + IT.n;
  t[i] = 7;
  const path = [i];
  for (i >>= 1; i >= 1; i >>= 1) {
    t[i] = t[2 * i] + t[2 * i + 1];
    path.push(i);
  }
  return { t, path };
})();
check(itUpd.path.join() === '6,3,1' && itUpd.t[1] === 13, 'iterative update(2, 7)');

// ================= optimized-lazy =================
function makeLazy(a) {
  const S = segBuild(a);
  const lazy = new Array(4 * a.length).fill(0);
  const log = [];
  const apply = (node, lo, hi, d) => {
    S.t[node] += d * (hi - lo + 1);
    lazy[node] += d;
  };
  const push = (node, lo, hi) => {
    if (lazy[node] !== 0) {
      const mid = (lo + hi) >> 1;
      log.push({ node, ev: 'push', d: lazy[node] });
      apply(2 * node, lo, mid, lazy[node]);
      apply(2 * node + 1, mid + 1, hi, lazy[node]);
      lazy[node] = 0;
    }
  };
  const snap = (node, ev, extra = {}) => log.push({ node, ev, t: S.t.slice(), lazy: lazy.slice(), ...extra });
  const rangeAdd = (l, r, d, node = 1, lo = 0, hi = a.length - 1) => {
    if (r < lo || hi < l) return snap(node, 'none');
    if (l <= lo && hi <= r) return apply(node, lo, hi, d), snap(node, 'tag', { d });
    push(node, lo, hi);
    snap(node, 'partial');
    const mid = (lo + hi) >> 1;
    rangeAdd(l, r, d, 2 * node, lo, mid);
    rangeAdd(l, r, d, 2 * node + 1, mid + 1, hi);
    S.t[node] = S.t[2 * node] + S.t[2 * node + 1];
    snap(node, 'fix');
  };
  const rangeSum = (l, r, node = 1, lo = 0, hi = a.length - 1) => {
    if (r < lo || hi < l) return snap(node, 'none'), 0;
    if (l <= lo && hi <= r) return snap(node, 'full'), S.t[node];
    const had = lazy[node];
    push(node, lo, hi);
    snap(node, had ? 'pushed' : 'partial', { had });
    const mid = (lo + hi) >> 1;
    return rangeSum(l, r, 2 * node, lo, mid) + rangeSum(l, r, 2 * node + 1, mid + 1, hi);
  };
  return { S, lazy, log, rangeAdd, rangeSum };
}
const LZ = makeLazy(SEG);
LZ.rangeAdd(0, 2, 2);
const addLog = LZ.log.filter((e) => e.t);
check(LZ.S.t[1] === 17 && LZ.S.t[2] === 7 && LZ.lazy[2] === 2 && LZ.lazy[6] === 2 && LZ.S.t[4] === 2, 'rangeAdd(0, 2, +2)');
const afterAdd = { t: LZ.S.t.slice(), lazy: LZ.lazy.slice() };
LZ.log.length = 0;
const lzAns = LZ.rangeSum(1, 1);
const sumLog = LZ.log.filter((e) => e.t);
check(lzAns === 3 && LZ.lazy[2] === 0 && LZ.lazy[4] === 2 && LZ.S.t[4] === 4, 'rangeSum(1, 1) pushes node 2');
const LZB = makeLazy(SEG);
LZB.rangeAdd(1, 3, 1);
const tagged = LZB.log.filter((e) => e.ev === 'tag').map((e) => e.node);
check(tagged.join() === '5,3', 'rangeAdd(1, 3) tags nodes 5 and 3');
const LZC = makeLazy(SEG);
LZC.rangeAdd(0, 2, 2);
LZC.log.length = 0;
check(LZC.rangeSum(0, 1) === 7 && LZC.log.every((e) => e.ev !== 'push' && e.ev !== 'pushed'), 'rangeSum(0, 1) needs no push');
const lzPanels = (t, lazy, st, lab = 'sum') => [segDraw({ ...S1, t }, { st, label: lab }), arr(lazy.slice(1, 8), { label: 'lazy[1..7]', indexBase: 1, highlights: Object.fromEntries(lazy.slice(1, 8).map((v, i) => [i, v ? 'window' : ''])) })];
const EV_NOTE = {
  partial: (e) => `Node ${e.node} [${rng(S1.meta[e.node])}]: partial. Push (no tag here) and go down.`,
  none: (e) => `Node ${e.node} [${rng(S1.meta[e.node])}]: no overlap, return.`,
  tag: (e) => `Node ${e.node} [${rng(S1.meta[e.node])}]: full. sum += ${e.d} × ${S1.meta[e.node].hi - S1.meta[e.node].lo + 1} → ${e.t[e.node]}; lazy[${e.node}] += ${e.d}. Stop here.`,
  fix: (e) => `Back at node ${e.node}: sum = ${e.t[2 * e.node]} + ${e.t[2 * e.node + 1]} = ${e.t[e.node]}.`,
  full: (e) => `Node ${e.node} [${rng(S1.meta[e.node])}]: full overlap, return ${e.t[e.node]}.`,
  pushed: (e) => `Node ${e.node}: partial, and it owes +${e.had}. Push: both children get +${e.had}, their own tags too; lazy[${e.node}] = 0.`,
};
const lzFrames = (log, say) =>
  log.map((e) => ({ say: say[e.ev], note: EV_NOTE[e.ev](e), panels: lzPanels(e.t, e.lazy, { [e.node]: e.ev === 'none' ? 'muted' : e.ev === 'tag' || e.ev === 'full' ? 'done' : 'active' }) }));

// ================= optimized-sparse-table =================
const SPN = [4, 6, 1, 5, 7, 3, 2];
const ST = [SPN.slice()];
for (let k = 1; 1 << k <= SPN.length; k++) {
  const prev = ST[k - 1];
  ST.push(Array.from({ length: SPN.length - (1 << k) + 1 }, (_, i) => Math.min(prev[i], prev[i + (1 << (k - 1))])));
}
check(ST[1].join() === '4,1,1,5,3,2' && ST[2].join() === '1,1,1,2' && ST.length === 3, 'lesson sparse table');
const stQuery = (l, r) => {
  const k = 31 - Math.clz32(r - l + 1);
  return { k, a: l, b: r - (1 << k) + 1, v: Math.min(ST[k][l], ST[k][r - (1 << k) + 1]) };
};
const SQ15 = stQuery(1, 5);
check(SQ15.k === 2 && SQ15.a === 1 && SQ15.b === 2 && SQ15.v === 1, 'lesson query [1, 5]');
const SQ26 = stQuery(2, 6);
check(SQ26.k === 2 && SQ26.b === 3, 'query [2, 6]');
const SQ46 = stQuery(4, 6);
check(SQ46.k === 1 && SQ46.v === 2, 'query [4, 6]');
const stP = (k, upto = Infinity, st = {}) => arr(ST[k].map((v, i) => (i <= upto ? v : '·')), { label: `st[${k}] (len ${1 << k})`, highlights: st });

// ================= optimized-dynamic-ranges =================
const BOOK = [[10, 20], [50, 60], [10, 40], [5, 15], [5, 10]];
const calRun = (() => {
  const delta = new Map();
  return BOOK.map(([s, e]) => {
    delta.set(s, (delta.get(s) ?? 0) + 1);
    delta.set(e, (delta.get(e) ?? 0) - 1);
    const keys = [...delta.keys()].sort((a, b) => a - b);
    let run = 0, best = 0;
    const runs = keys.map((k) => ((run += delta.get(k)), (best = Math.max(best, run)), run));
    return { s, e, keys, d: keys.map((k) => delta.get(k)), runs, best };
  });
})();
check(calRun.slice(0, 4).map((c) => c.best).join() === '1,1,2,3' && calRun[4].best === 3 && calRun[4].keys.length <= 8, 'calendar sweep');
const calPanels = (c, st) => [arr(c.keys, { label: 'sorted keys', showIndices: false, highlights: st }), arr(c.d, { label: 'delta', showIndices: false, highlights: st }), arr(c.runs, { label: 'running sum', showIndices: false, highlights: Object.fromEntries(c.runs.map((v, i) => [i, v === c.best ? 'done' : ''])) })];
const FA = [4, 7, 4, 2, 4, 7];
const POS = new Map();
FA.forEach((v, i) => (POS.get(v) ?? POS.set(v, []).get(v)).push(i));
const lowerBound = (a, x) => {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] < x) lo = m + 1;
    else hi = m;
  }
  return lo;
};
const freq = (l, r, v) => lowerBound(POS.get(v) ?? [], r + 1) - lowerBound(POS.get(v) ?? [], l);
check(POS.get(4).join() === '0,2,4' && freq(1, 4, 4) === 2 && lowerBound(POS.get(4), 5) === 3 && lowerBound(POS.get(4), 1) === 1, 'frequency 4 in [1, 4]');
check(freq(2, 5, 7) === 1, 'frequency 7 in [2, 5]');

// ================= mistakes =================
const SORTED_BAD = [10, 9, 1].sort();
check(SORTED_BAD.join() === '1,10,9', 'default sort');
const LE = [3, 5, 5, 8];
const LEs = [...new Set(LE)].sort((a, b) => a - b);
const LEt = new Array(LEs.length + 1).fill(0);
LE.forEach((v) => fenAdd(LEt, LEs.indexOf(v), 1));
check(fenPrefix(LEt, 1).s === 3 && fenPrefix(LEt, 0).s === 1, 'strict vs ≤ for 5');
const SPS = [2, 3, 4];
check(2 + 3 + (3 + 4) === 12 && SPS.reduce((a, b) => a + b) === 9, 'sparse sum double-count');

// ======================================================================
const STEPS = {
  what: [
    {
      kind: 'watch',
      title: 'Questions on a changing array',
      lines: ['A **range query** asks about a slice `[l, r]`.', 'A **point update** changes one element.', 'Updates and queries arrive mixed together.'],
      frames: [
        { say: 0, note: `\`sumRange(1, 4)\` = 2 + 9 − 3 + 5 = ${whatRun.q1}.`, panels: [arr(NUMS, { label: 'nums', range: [1, 4], highlights: winHl(8, 1, 4) }), vars({ answer: whatRun.q1 })] },
        { say: 1, note: '`update(3, 7)`: nums[3] goes from −3 to 7.', panels: [arr(whatRun.afterUpd, { label: 'nums', highlights: { 3: 'active' } }), vars({ answer: '-' })] },
        { say: 2, note: `Same question again: \`sumRange(1, 4)\` = ${whatRun.q2}. The old answer is stale.`, panels: [arr(whatRun.afterUpd, { label: 'nums', range: [1, 4], highlights: winHl(8, 1, 4, { 3: 'active' }) }), vars({ answer: whatRun.q2 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the next question',
      lines: ['Then `update(0, 1)`: nums[0] becomes 1.', 'Now `sumRange(0, 7)`: the whole array.'],
      panels: [arr(whatRun.final, { label: 'nums', range: [0, 7], highlights: winHl(8, 0, 7, { 0: 'active', 3: 'active' }) })],
      task: { type: 'number', question: 'What does `sumRange(0, 7)` return?', options: [47, 51, 41, 43], answer: whatRun.q3, hint: 'Add all 8 cells: 1 + 2 + 9 + 7 + 5 + 20 + 10 − 7.' },
      solved: `${whatRun.q3}. Every answer must reflect the updates so far.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the structure',
      lines: ['Fenwick: point update, range **sum**.', 'Segment tree: any associative op.', 'Sparse table: static, min/max/gcd in **O(1)**.'],
      panels: [table(['Fenwick', 'Segment', 'Sparse'], ['upd', 'qry'], [['log', 'log'], ['log', 'log'], ['✗', '1']])],
      task: {
        type: 'choose',
        question: 'The array **never changes** and you get many range-min queries. Which fits best?',
        options: [
          { text: 'Sparse table', why: '' },
          { text: 'Fenwick tree', why: 'The table lists Fenwick for sums and counts, not min.' },
          { text: 'Segment tree', why: 'It works, but each query is O(log n); with no updates the sparse table answers in O(1).' },
        ],
        answer: 0,
      },
      solved: 'Static + many min queries → **sparse table**, O(1) per query.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Too little, too much, just enough',
      lines: ['Plain array: nothing pre-added, so queries loop.', 'Prefix sums: every prefix holds nums[0], so updates rewrite.', 'Fenwick: each element in about log n blocks.'],
      frames: [
        { say: 0, note: 'Plain array, n = 7. Changing nums[0] touches 1 cell; `sumRange(0, 6)` reads all 7.', panels: [whyTable(0), arr(N7, { label: 'nums', highlights: hl(7, (k) => (k === 0 ? 'active' : 'window')) })] },
        { say: 1, note: 'Prefix array: P[1..7] all contain nums[0], so 7 rewrites. The query reads only P[7] and P[0].', panels: [whyTable(1), arr(P7, { label: 'P', highlights: hl(8, (k) => (k === 0 ? 'window' : k === 7 ? 'bad' : 'active')) })] },
        { say: 2, note: `Fenwick: the update climbs ${t7upd.join(' → ')} (3 cells); prefix(7) reads ${t7qry.join(' → ')} (3 cells).`, panels: [whyTable(2), fenP(T7, { 1: 'active', 2: 'active', 4: 'bad', 6: 'window', 7: 'window' }, 'tree[1..7]')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: who stores too much?',
      lines: ['Each simple design is fast at one operation.', 'It pays for that with the other one.'],
      panels: [whyTable(2)],
      task: {
        type: 'choose',
        question: 'Which design stores **too much shared information**, so one update rewrites many cells?',
        options: [
          { text: 'The prefix-sum array', why: '' },
          { text: 'The plain array', why: 'It stores too little: nothing is pre-added, so the query pays.' },
          { text: 'The Fenwick tree', why: 'It stores just enough: about log n blocks per element.' },
        ],
        answer: 0,
      },
      solved: 'Prefix sums share nums[0] in every cell. Fenwick and segment trees use **power-of-two blocks**: O(log n) both ways.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'What changes, what is asked',
      lines: ['Read two things from the problem.', 'What changes: nothing, one point, or a range?', 'What is asked: a sum, or min/max?'],
      frames: WHEN.map(([v, k, note], i) => ({ say: i === 0 ? 0 : i < 4 ? 2 : 1, note, panels: [vars(v), toolP({ [k]: 'active' })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: no tree at all',
      lines: ['Do not reach for a tree too early.', 'Static data often has a simpler tool.'],
      panels: [vars({ changes: 'never', asks: 'count of v in [l, r]' }), toolP()],
      task: { type: 'cell', panel: 1, question: 'Static array, "how many times does v appear in [l, r]?" Which tool?', answer: 5, hints: { 0: 'A prefix sum per value would need one array per value.', 2: 'No updates, so no tree is needed.', 3: 'Heavier than needed: the lesson says no tree.', 1: 'A sparse table answers min/max/gcd, not counts.', 4: 'There are no range updates.' } },
      solved: 'Per-value **position lists + binary search**. No tree.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Run the checklist',
      lines: ['1. Interleaved updates and queries?', '2. Invertible aggregate (sum, count, xor)?', '3. Point or range updates?', 'Clue: a class with `update()` and `sumRange()`.'],
      frames: [
        { say: 3, note: 'A class with `update(i, val)` and `sumRange(l, r)`.', panels: [vars({ class: 'update + sumRange' }), toolP()] },
        { say: 0, note: 'Calls can come in any order: interleaved. Prefix sums are out.', panels: [vars({ interleaved: 'yes' }), toolP({ 0: 'muted', 1: 'muted' })] },
        { say: 1, note: 'Sum is invertible, so prefixes are enough.', panels: [vars({ interleaved: 'yes', invertible: 'yes' }), toolP({ 0: 'muted', 1: 'muted', 2: 'active' })] },
        { say: 2, note: 'Point updates only: no lazy tree. **Fenwick tree**.', panels: [vars({ interleaved: 'yes', invertible: 'yes', updates: 'point' }), toolP({ 0: 'muted', 1: 'muted', 2: 'done', 4: 'muted' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a range clue',
      lines: ['"Add val to all elements in [l, r]."', 'Range sums are asked between those adds.'],
      panels: [vars({ updates: 'range', queries: 'range' }), toolP()],
      task: { type: 'cell', panel: 1, question: 'Which tool does the checklist give?', answer: 4, hints: { 0: 'Updates and queries are interleaved.', 1: 'A sparse table cannot be updated.', 2: 'A plain BIT handles point updates + range sums.', 3: 'A plain segment tree updates one point at a time.', 5: 'Position lists are for a static array.' } },
      solved: 'Range update + range query → **lazy segment tree**.',
    },
    {
      kind: 'turn',
      title: 'Your turn: huge coordinates',
      lines: ['"Coordinates up to 10^9, but ≤ 10^4 operations."'],
      panels: [vars({ coords: '≤ 10^9', ops: '≤ 10^4' })],
      task: {
        type: 'choose',
        question: 'What does checklist item 5 suggest?',
        options: [
          { text: 'Compress the coordinates, or keep a sorted list of breakpoints', why: '' },
          { text: 'Allocate a tree of size 10^9', why: 'Values like 10^9 cannot be practical array indices; only the endpoints that appear matter.' },
          { text: 'Use a sparse table', why: 'The data changes with each operation; sparse tables are static.' },
        ],
        answer: 0,
      },
      solved: 'Only the endpoints that appear matter: **compress** or keep **sorted breakpoints**.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'One brick: power-of-two blocks',
      lines: ['Segment tree: keeps **all** blocks (about 2n).', 'Fenwick: one block per index, ending at i, length lowbit(i).', 'Sparse table: every power-of-two length at **every** start.'],
      frames: [
        { say: 0, note: 'Blocks of size 8, 4, 2, 1 over positions 1..8. A segment tree keeps all 15.', panels: [segDraw(B8, { lab: blockLab, sx: 0.5, st: hl(16, () => 'done') })] },
        { say: 1, note: 'Fenwick keeps only blocks that end at i with length lowbit(i): 8 blocks for n = 8.', panels: [segDraw(B8, { lab: blockLab, sx: 0.5, st: Object.fromEntries(Object.keys(B8.meta).map((k) => [k, fenBlocks.includes(k) ? 'active' : 'muted'])) })] },
        { say: 2, note: 'A sparse table also keeps blocks like 2..5 (length 4, starting at 2). It is no tree node: it overlaps 1-4 and 5-8.', panels: [arr([1, 2, 3, 4, 5, 6, 7, 8], { label: 'positions', showIndices: false, range: [1, 4], highlights: winHl(8, 1, 4) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the sizes',
      lines: ['Only a few power-of-two sizes exist up to n.', 'A constant number of blocks per size is O(log n).'],
      panels: [segDraw(B8, { lab: blockLab, sx: 0.5 })],
      task: { type: 'number', question: 'How many distinct block sizes are there for n = 8?', options: [4, 3, 8, 15], answer: 4, hint: 'log₂ 8 + 1: sizes 1, 2, 4, 8.' },
      solved: 'log₂ n + 1 = **4** sizes. Constant blocks per size → O(log n).',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Plain array: the query loops',
      lines: ['`update(i, val)`: one assignment.', '`sumRange(l, r)`: loop from l to r.'],
      frames: bfPlain.frames,
    },
    {
      kind: 'watch',
      title: 'Prefix sums: the update loops',
      lines: ['Build `P` with P[0] = 0.', '`update` adds d to every P[k] with k > i.', '`sumRange(l, r)` = P[r + 1] − P[l].'],
      frames: bfPrefix.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: the pair loop',
      lines: ['Counting problems brute-force over every pair `i < j`.', 'That is O(n²).'],
      panels: [arr([0, 1, 2, 3, 4, 5], { label: 'n = 6 indices' })],
      task: { type: 'number', question: 'How many pairs `i < j` does the double loop check for n = 6?', options: [15, 36, 30, 6], answer: 15, hint: 'i = 0 pairs with 5, i = 1 with 4, … : 5 + 4 + 3 + 2 + 1.' },
      solved: '15 = n(n − 1)/2. At n = 10^5 that is about 5 × 10^9: too slow.',
    },
  ],

  'optimized-fenwick': [
    {
      kind: 'watch',
      title: 'lowbit(i) = i & -i',
      lines: ['`i & -i` keeps only the lowest set bit of i.', 'Why: `-i = ~i + 1` agrees with i only at that bit.'],
      frames: lowbitFrames,
    },
    {
      kind: 'watch',
      title: 'What each cell stores',
      lines: ['`tree[i]` = sum of the lowbit(i) elements ending at i.', 'That is positions `(i − lowbit(i), i]`.'],
      frames: coverFrames,
    },
    {
      kind: 'watch',
      title: 'prefix(7): remove the low bit',
      lines: ['Add `tree[i]`, then `i -= i & -i`.', 'Blocks are adjacent and never overlap.'],
      frames: queryFrames,
    },
    {
      kind: 'watch',
      title: 'Update position 3: add the low bit',
      lines: ['Change `tree[i]`, then `i += i & -i`.', 'Each jump reaches the next bigger block holding position 3.'],
      frames: updFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: update position 5',
      lines: ['Updates climb: `i += i & -i`.', 'Stop when i > n (n = 8).'],
      panels: [fenP(TN, { 5: 'active' }, 'tree[1..8]', [ptr(5, 'i')])],
      task: { type: 'order', question: 'Tap the cells the update visits, in order.', items: u5.map(String), hint: '5 = 0101, lowbit 1 → 6 = 0110, lowbit 2 → 8.' },
      solved: '5 → 6 → 8: the blocks [5], [5, 6] and [1, 8] all hold position 5.',
      then: u5.map((i, k) => ({ note: `tree[${i}] covers ${i - lowbit(i) + 1}..${i}.`, panels: [coverP(NUMS, i), fenP(TN, Object.fromEntries(u5.map((j, m) => [j, m === k ? 'active' : m < k ? 'done' : ''])), 'tree[1..8]')] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: prefix(6), next cell',
      lines: ['prefix(6) starts at tree[6] (covers 5..6).', 'Then `i -= i & -i`.'],
      panels: [fenP(TN, { 6: 'done' }, 'tree[1..8]', [ptr(6, 'i')])],
      task: { type: 'cell', question: 'Which cell does prefix(6) read next?', answer: 3, hints: { 4: 'tree[5] is inside 5..6, already covered.', 0: 'tree[4] already covers position 1.', 1: 'tree[4] already covers positions 1..2.' } },
      solved: `6 − 2 = 4: tree[4] covers 1..4. Then 4 − 4 = 0, stop. prefix(6) = ${TN[6]} + ${TN[4]} = ${TN[6] + TN[4]}.`,
    },
  ],

  template: [
    {
      kind: 'watch',
      title: '`FenwickTree.from`: n adds',
      lines: ['`new Array(n + 1)`: slot 0 unused.', '`from(arr)` calls `add(i, v)` for each element: O(n log n).'],
      frames: tplBuild,
    },
    {
      kind: 'watch',
      title: 'rangeSum = two prefix sums',
      lines: ['`prefixSum(index)`: sum of arr[0..index].', '`add(index, delta)` converts with `i = index + 1`.', '`rangeSum(l, r)` = prefixSum(r) − prefixSum(l − 1).'],
      frames: rangeFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: set, not add',
      lines: ['A BIT only knows "add delta".', 'To set nums[i] = val, add `val − nums[i]`, then store val.'],
      panels: [arr(TA, { label: 'this.nums', highlights: { 3: 'active' } }), fenP(TT, {}, 'tree[1..6]')],
      task: { type: 'number', question: '`update(3, 6)`: what delta goes to `bit.add`?', options: [5, 6, 1, -5], answer: 5, hint: 'nums[3] is 1 now.' },
      solved: 'delta = 6 − 1 = **5**. Passing 6 would make nums[3] = 7.',
      then: [{ note: `\`add(3, 5)\`: i = 4, then 4 + 4 = 8 > 6, stop. tree[4] = ${TU[4]}.`, panels: [arr(TA.map((v, i) => (i === 3 ? 6 : v)), { label: 'this.nums', highlights: { 3: 'done' } }), fenP(TU, { 4: 'active' }, 'tree[1..6]')] }],
    },
    {
      kind: 'watch',
      title: 'O(n) build: push to the parent',
      lines: ['Copy values into `tree[1..n]`.', 'For each i, add `tree[i]` into `j = i + (i & -i)` if j ≤ n.', 'Every cell is visited once.'],
      frames: linBuild.frames,
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Constructor = n updates',
      lines: ['Start `nums` and `tree` at zero.', 'Call `update(i, v)`: it adds `v − 0` along the climb.'],
      frames: implBuild.frames,
    },
    {
      kind: 'watch',
      title: 'sumRange(0, 2)',
      lines: ['`#prefix(r) − #prefix(l − 1)`.', '`#prefix(-1)`: i++ makes i = 0, the loop never runs → 0.'],
      frames: [
        { say: 0, note: `\`#prefix(2)\`: i = 3 → 2. tree[3] + tree[2] = ${implBuild.t[3]} + ${implBuild.t[2]} = ${ip2.s}.`, panels: [arr(IA, { label: 'nums', highlights: winHl(4, 0, 2) }), fenP(implBuild.t, { 3: 'active', 2: 'active' }, 'tree[1..4]')] },
        { say: 1, note: '`#prefix(-1)`: i becomes 0; `i > 0` fails at once. Returns 0.', panels: [arr(IA, { label: 'nums' }), vars({ i: 0, s: 0 })] },
        { say: 0, note: `sumRange(0, 2) = ${ip2.s} − 0 = ${ip2.s}. No special case for l = 0.`, panels: [arr(IA, { label: 'nums', range: [0, 2], highlights: winHl(4, 0, 2) }), vars({ answer: ip2.s })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why keep nums?',
      lines: ['The class stores `this.nums` next to `this.tree`.'],
      panels: [arr(implBuild.nums, { label: 'this.nums' }), fenP(implBuild.t, {}, 'tree[1..4]')],
      task: {
        type: 'choose',
        question: 'Why does `update` need `this.nums[index]`?',
        options: [
          { text: 'To turn "set to val" into the delta `val − nums[index]`', why: '' },
          { text: 'To answer sumRange faster', why: 'sumRange reads only the tree.' },
          { text: 'Because tree[] is 0-based', why: 'tree[] is 1-based; nums is kept for the current values.' },
        ],
        answer: 0,
      },
      solved: 'The tree stores sums of deltas. Assignment needs the **current value** to compute the delta.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'The built tree',
      lines: ['nums = `[5, 2, 9, -3, 5, 20, 10, -7]`.', 'Cells are 1-based.'],
      frames: [
        { say: 0, note: 'The input, 0-based.', panels: [arr(NUMS, { label: 'nums' })] },
        { say: 1, note: 'After building: tree[1..8] = 5, 7, 9, 13, 5, 25, 10, 41.', panels: [arr(NUMS, { label: 'nums' }), fenP(DR, hl(9, () => 'done'), 'tree[1..8]')] },
      ],
    },
    {
      kind: 'watch',
      title: 'prefixSum(6)',
      lines: ['Start at i = 7 (1-based).', 'Add tree[i], then i −= lowbit.'],
      frames: dq.path.map((s, k) => ({ say: k === 0 ? 0 : 1, note: `i = ${s.i} (${bin(s.i)}): tree[${s.i}] = ${s.val}, sum ${s.s}. Next i = ${s.next}${s.next === 0 ? ': stop.' : '.'}${s.next === 0 ? ' Three cells instead of seven.' : ''}`, panels: [rowsUpTo(LESSON_Q, k), fenP(DR, Object.fromEntries(dq.path.map((p, j) => [p.i, j === k ? 'active' : j < k ? 'done' : ''])), 'tree[1..8]', [ptr(s.i, 'i')])] })),
    },
    {
      kind: 'watch',
      title: 'add(2, +4)',
      lines: ['nums[2] goes from 9 to 13.', 'Start at i = 3, then i += lowbit.'],
      frames: da.map((s, k) => {
        const t = DR.slice();
        da.slice(0, k + 1).forEach((x) => (t[x.i] = x.after));
        return { say: k === 0 ? 0 : 1, note: `i = ${s.i}: ${s.before} → ${s.after}. Next i = ${s.i + lowbit(s.i)}${s.i + lowbit(s.i) > 8 ? ' > 8: stop.' : '.'}`, panels: [rowsUpTo(LESSON_U, k), fenP(t, Object.fromEntries(da.map((p, j) => [p.i, j === k ? 'active' : j < k ? 'done' : ''])), 'tree[1..8]', [ptr(s.i, 'i')])] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: prefixSum(6) again',
      lines: ['Same path as before: 7 → 6 → 4.', 'But tree[4] changed in the update.'],
      panels: [fenP(DA, { 7: 'active', 6: 'active', 4: 'active' }, 'tree[1..8]')],
      task: { type: 'number', question: 'After `add(2, +4)`, what does `prefixSum(6)` return?', options: [52, 48, 56, 44], answer: dq2.s, hint: 'tree[7] + tree[6] + tree[4] = 10 + 25 + 17.' },
      solved: `${dq2.s} = 48 + 4: position 3 lies inside tree[4]'s block.`,
    },
  ],

  'optimized-compression': [
    {
      kind: 'watch',
      title: 'Values become ranks',
      lines: ['Only the relative order matters for "less than".', 'Sort the distinct values; each value → its rank.'],
      frames: [
        { say: 0, note: 'nums has 10^9 (shown as 1e9): too big to be an index.', panels: [arr(CN.map(short), { label: 'nums' })] },
        { say: 1, note: '`[...new Set(nums)].sort((a, b) => a - b)`: 4 distinct values.', panels: [arr(CN.map(short), { label: 'nums' }), arr(CS.map(short), { label: 'sorted unique', indexBase: 1 })] },
        { say: 1, note: 'The text numbers ranks 1..4. (The code below uses 0-based ranks.)', panels: [table(CS.map((v) => String(short(v))), ['rank'], CS.map((_, i) => [String(i + 1)])), arr(CR1, { label: 'ranks', highlights: hl(5, () => 'done') })] },
      ],
    },
    {
      kind: 'watch',
      title: 'countSmaller([5, 2, 6, 1])',
      lines: ['Scan i from right to left.', 'Ask `prefixSum(r − 1)`: inserted values with a smaller rank.', 'Then `add(r, 1)`.'],
      frames: [
        { say: 0, note: `sorted = [${CSR.sorted}], 0-based ranks 1→0, 2→1, 5→2, 6→3. BIT of size 4.`, panels: [arr([5, 2, 6, 1], { label: 'nums' }), fenP([0, 0, 0, 0, 0], {}, 'tree[1..4]'), vars({ res: '[?, ?, ?, ?]' })] },
        ...CSR.steps.map((s) => ({
          say: 1,
          note: `i = ${s.i}, nums[i] = ${[5, 2, 6, 1][s.i]}, r = ${s.r}. ${s.r > 0 ? `prefixSum(${s.r - 1}) = ${s.ask}` : 'r = 0 → 0'}. Then add(${s.r}, 1) along ${s.add.join(' → ')}.`,
          panels: [arr([5, 2, 6, 1], { label: 'nums', pointers: [ptr(s.i, 'i')], highlights: hl(4, (k) => (k === s.i ? 'active' : k > s.i ? 'visited' : '')) }), fenP(s.tree, Object.fromEntries(s.add.map((i) => [i, 'active'])), 'tree[1..4]'), vars({ r: s.r, smaller: s.ask, res: `[${s.res.join(', ')}]` })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: rank with duplicates',
      lines: ['nums = `[8, 3, 8, 1]`.', 'Duplicates collapse in the Set.'],
      panels: [arr(CT.sorted, { label: 'sorted unique (0-based rank)' })],
      task: { type: 'cell', question: 'Which BIT slot (0-based rank) does 8 use?', answer: 2, hints: { 0: 'Rank 0 is the smallest value, 1.', 1: 'Rank 1 is 3.' } },
      solved: '8 → rank 2. Both 8s share that slot.',
    },
    {
      kind: 'turn',
      title: 'Your turn: strictly smaller',
      lines: ['nums = `[8, 3, 8, 1]`.', '`prefixSum(r − 1)` counts **strictly** smaller ranks.'],
      panels: [arr([8, 3, 8, 1], { label: 'nums', pointers: [ptr(0, 'i')], highlights: { 0: 'active', 1: 'visited', 2: 'visited', 3: 'visited' } }), fenP(CT.steps[2].tree, {}, 'tree[1..3]')],
      task: { type: 'number', question: 'What is res[0]?', options: [2, 3, 1, 0], answer: CT.res[0], hint: 'To the right of 8: 3, 8, 1. Which are strictly smaller?' },
      solved: `res[0] = ${CT.res[0]}: 3 and 1. The other 8 shares rank 2, so prefixSum(1) skips it.`,
    },
  ],

  'optimized-segment-tree': [
    {
      kind: 'watch',
      title: 'Build: children first',
      lines: ['Leaves hold single elements.', 'A parent = left child + right child.', 'Node k has children 2k and 2k + 1.'],
      frames: segBuildFrames,
    },
    {
      kind: 'watch',
      title: 'Query [1, 2]: three cases',
      lines: ['No overlap → 0.', 'Full overlap → take the node, stop.', 'Partial → ask both children.'],
      frames: segQueryFrames(S1, 1, 2, SQ, { none: 0, full: 1, partial: 2 }),
    },
    {
      kind: 'turn',
      title: 'Your turn: query [0, 2]',
      lines: ['Same tree: `[2, 1, 5, 3]`.', 'Nodes are numbered 1 (root) to 7 (heap order).'],
      panels: [segDraw(S1, { lab: (k) => k })],
      task: { type: 'order', question: 'Tap the nodes `query(0, 2)` visits, in order.', items: SQ2.vis.map((v) => String(v.node)), hint: 'Node 2 [0,1] is fully inside, so do not go below it.' },
      solved: `1 (partial), 2 (full: 3), 3 (partial), 6 (full: 5), 7 (none). Answer ${SQ2.v}.`,
      then: segQueryFrames(S1, 0, 2, SQ2, {}),
    },
    {
      kind: 'watch',
      title: 'update(2, 7): one root path',
      lines: ['Walk from the root to the leaf of i.', 'Recompute every node on the way back up.'],
      frames: segUpdFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: query after the update',
      lines: ['nums is now `[2, 1, 7, 3]`.'],
      panels: [segDraw(S1u)],
      task: { type: 'number', question: 'What does `query(1, 3)` return?', options: [11, 9, 13, 10], answer: SQ3.v, hint: 'Node 5 (1) + node 3 [2,3].' },
      solved: `1 + 10 = ${SQ3.v}: node 5 and node 3 are full overlaps.`,
    },
  ],

  'implementation-segment-tree': [
    {
      kind: 'watch',
      title: 'Bottom-up build, size 2n',
      lines: ['Leaves at `tree[n..2n−1]`.', '`tree[i] = tree[2i] + tree[2i+1]` for i = n−1 down to 1.'],
      frames: IT.frames.map((f) => ({
        say: f.i === null ? 0 : 1,
        note: f.i === null ? 'n = 4: copy nums into tree[4..7]. Slot 0 is unused.' : `i = ${f.i}: tree[${2 * f.i}] + tree[${2 * f.i + 1}] = ${f.t[f.i]}.`,
        panels: [itP(f.t.map((v, j) => (j > 0 && j < 4 && (f.i === null || j < f.i) ? '?' : v)), f.i === null ? { 4: 'active', 5: 'active', 6: 'active', 7: 'active' } : { [f.i]: 'active', [2 * f.i]: 'window', [2 * f.i + 1]: 'window' })],
      })),
    },
    {
      kind: 'watch',
      title: 'query(1, 2) with two borders',
      lines: ['`l = left + n`, `r = right + n + 1`: half-open on leaves.', 'Odd l: take `tree[l++]`. Odd r: take `tree[--r]`.', 'Then both move up: `l >>= 1; r >>= 1`.'],
      frames: [
        { say: 0, note: 'l = 1 + 4 = 5, r = 2 + 4 + 1 = 7.', panels: [itP(IT.t, {}, [ptr(5, 'l'), ptr(7, 'r', 'b')]), vars({ resLeft: 0, resRight: 0 })] },
        { say: 1, note: 'l = 5 is odd: take tree[5] = 1, l → 6. r = 7 is odd: r → 6, take tree[6] = 5.', panels: [itP(IT.t, { 5: 'active', 6: 'active' }, [ptr(6, 'l'), ptr(6, 'r', 'b')]), vars({ resLeft: 1, resRight: 5 })] },
        { say: 2, note: `l = 3, r = 3: l < r fails. Answer 1 + 5 = ${IQ.v}.`, panels: [itP(IT.t, { 5: 'done', 6: 'done' }, [ptr(3, 'l'), ptr(3, 'r', 'b')]), vars({ answer: IQ.v })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: query(1, 3)',
      lines: ['l = 5, r = 8.', 'Take a node when its border index is odd.'],
      panels: [itP(IT.t, {}, [ptr(5, 'l')])],
      task: { type: 'number', question: 'What does `query(1, 3)` return?', options: [9, 6, 11, 8], answer: IQ3.v, hint: 'l = 5 odd → tree[5]; then l = 3, r = 4: l odd → tree[3].' },
      solved: `tree[5] + tree[3] = 1 + 8 = ${IQ3.v}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: update climbs',
      lines: ['`update(2, 7)`: i = 2 + n = 6.', 'Then `i >>= 1` until the root.'],
      panels: [itP(IT.t, { 6: 'active' }, [ptr(6, 'i')])],
      task: { type: 'cell', question: 'Which cell is recomputed right after tree[6]?', answer: 3, hints: { 7: 'tree[7] is the sibling; it does not change.', 1: 'The root comes last.', 2: 'tree[2] covers leaves 4 and 5.' } },
      solved: '6 >> 1 = 3, then 3 >> 1 = 1.',
      then: [
        { note: `tree[6] = 7, tree[3] = 7 + 3 = ${itUpd.t[3]}.`, panels: [itP(itUpd.t.map((v, j) => (j === 1 ? IT.t[1] : v)), { 6: 'done', 3: 'active' })] },
        { note: `tree[1] = 3 + 10 = ${itUpd.t[1]}.`, panels: [itP(itUpd.t, { 6: 'done', 3: 'done', 1: 'active' })] },
      ],
    },
  ],

  'optimized-lazy': [
    {
      kind: 'watch',
      title: 'rangeAdd(0, 2, +2): park the tag',
      lines: ['Full overlap: sum += delta × length, and `lazy[node] += delta`. Stop.', 'Partial: push, recurse, then fix the sum.'],
      frames: lzFrames(addLog, { partial: 1, none: 1, tag: 0, fix: 1 }),
    },
    {
      kind: 'watch',
      title: 'rangeSum(1, 1): push on the way down',
      lines: ['Going **below** a tagged node? Push first.', 'Push: apply the tag to both children, then clear it.'],
      frames: [
        { say: 0, note: 'State after the add. Node 2 owes +2 to its children: node 5 still says 1.', panels: lzPanels(afterAdd.t, afterAdd.lazy, { 2: 'window', 5: 'bad' }) },
        ...lzFrames(sumLog, { partial: 0, none: 0, full: 0, pushed: 1 }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where do tags land?',
      lines: ['Fresh tree `[2, 1, 5, 3]`.', '`rangeAdd(1, 3, +1)`.'],
      panels: lzPanels(S1.t, new Array(16).fill(0), {}),
      task: {
        type: 'choose',
        question: 'Which nodes get a lazy tag?',
        options: [
          { text: 'Nodes 5 and 3', why: '' },
          { text: 'Nodes 5, 6 and 7', why: 'Node 3 [2,3] is fully covered, so the update stops there.' },
          { text: 'Only node 1', why: 'The root [0,3] is only partly covered: index 0 is outside.' },
          { text: 'Nodes 2 and 3', why: 'Node 2 [0,1] is only partly covered.' },
        ],
        answer: 0,
      },
      solved: '[1, 3] is tiled by node 5 [1] and node 3 [2,3]. Only those get tags.',
    },
    {
      kind: 'turn',
      title: 'Your turn: read a tagged node',
      lines: ['Back to the state after `rangeAdd(0, 2, +2)`.', 'Node 2 holds a tag.'],
      panels: lzPanels(afterAdd.t, afterAdd.lazy, { 2: 'window' }),
      task: { type: 'number', question: 'What does `rangeSum(0, 1)` return?', options: [7, 3, 9, 5], answer: 7, hint: 'Node 2 covers [0, 1] exactly: full overlap.' },
      solved: 'Full overlap at node 2: return sum[2] = 7. No push needed: we never go below it.',
    },
  ],

  'optimized-sparse-table': [
    {
      kind: 'watch',
      title: 'Build level by level',
      lines: ['`st[k][i]` = min of the block of length 2^k at i.', '`st[k][i] = min(st[k−1][i], st[k−1][i + 2^(k−1)])`.'],
      frames: [
        { say: 0, note: 'st[0] is nums itself.', panels: [stP(0)] },
        { say: 1, note: `st[1][0] = min(${ST[0][0]}, ${ST[0][1]}) = ${ST[1][0]}.`, panels: [stP(0, Infinity, { 0: 'window', 1: 'window' }), stP(1, 0, { 0: 'active' })] },
        { say: 1, note: 'Each st[1] cell joins two neighbours.', panels: [stP(0), stP(1, Infinity, hl(6, () => 'done'))] },
        { say: 1, note: `st[2][0] = min(st[1][0], st[1][2]) = min(${ST[1][0]}, ${ST[1][2]}) = ${ST[2][0]}.`, panels: [stP(0), stP(1, Infinity, { 0: 'window', 2: 'window' }), stP(2, 0, { 0: 'active' })] },
        { say: 1, note: 'st[2] done: n log n cells, O(1) each.', panels: [stP(0), stP(1), stP(2, Infinity, hl(4, () => 'done'))] },
      ],
    },
    {
      kind: 'watch',
      title: 'Query [1, 5]: two blocks',
      lines: ['len = 5, k = floor(log2 5) = 2.', 'One block starts at l, one ends at r.', 'Overlap is harmless: min(x, x) = x.'],
      frames: [
        { say: 0, note: 'len = 5, so blocks of length 4.', panels: [arr(SPN, { label: 'nums', range: [1, 5], highlights: winHl(7, 1, 5) }), vars({ len: 5, k: 2 })] },
        { say: 1, note: `Block at l = 1: indices 1..4, st[2][1] = ${ST[2][1]}.`, panels: [arr(SPN, { label: 'nums', range: [1, 4], highlights: winHl(7, 1, 4) }), stP(2, Infinity, { 1: 'active' })] },
        { say: 1, note: `Block ending at r = 5: indices 2..5, st[2][2] = ${ST[2][2]}.`, panels: [arr(SPN, { label: 'nums', range: [2, 5], highlights: winHl(7, 2, 5) }), stP(2, Infinity, { 1: 'done', 2: 'active' })] },
        { say: 2, note: `Indices 2..4 counted twice. min(1, 1) = ${SQ15.v}: still right.`, panels: [arr(SPN, { label: 'nums', range: [1, 5], highlights: winHl(7, 1, 5, { 2: 'active', 3: 'active', 4: 'active' }) }), vars({ answer: SQ15.v })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: query [2, 6]',
      lines: ['len = 5, k = 2.', 'The second block **ends** at r = 6.'],
      panels: [stP(2, Infinity, { 2: 'done' })],
      task: { type: 'cell', question: 'Which st[2] cell is the block ending at r = 6?', answer: SQ26.b, hints: { 2: 'That is the block starting at l = 2.', 1: 'st[2][1] covers 1..4: outside the range.', 0: 'st[2][0] covers 0..3.' } },
      solved: `Start = r − 4 + 1 = 3. Answer min(st[2][2], st[2][3]) = ${stQuery(2, 6).v}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: query [4, 6]',
      lines: ['len = 3, so k = 1: blocks of length 2.'],
      panels: [arr(SPN, { label: 'nums', range: [4, 6], highlights: winHl(7, 4, 6) }), stP(1)],
      task: { type: 'number', question: 'What is the min of [4, 6]?', options: [2, 3, 7, 1], answer: SQ46.v, hint: 'min(st[1][4], st[1][5]).' },
      solved: `min(${ST[1][4]}, ${ST[1][5]}) = ${SQ46.v}. Index 5 sits in both blocks.`,
    },
  ],

  'optimized-dynamic-ranges': [
    {
      kind: 'watch',
      title: 'My Calendar III: a boundary sweep',
      lines: ['`+1` at each start, `−1` at each end.', 'Walk sorted keys with a running sum.', 'The max running sum is the answer.'],
      frames: calRun.slice(0, 4).map((c, k) => ({
        say: k === 3 ? 2 : k === 0 ? 0 : 1,
        note: `book [${c.s}, ${c.e}): +1 at ${c.s}, −1 at ${c.e}. Max running sum = ${c.best}.`,
        panels: calPanels(c, Object.fromEntries(c.keys.map((x, i) => [i, x === c.s || x === c.e ? 'active' : '']))),
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: one more booking',
      lines: ['Book `[5, 10)`. Half-open: it ends where 10 starts.'],
      panels: calPanels(calRun[3], { 0: 'active', 1: 'active' }),
      task: { type: 'number', question: 'After this booking, what is the max running sum?', options: [3, 4, 2, 5], answer: calRun[4].best, hint: 'delta at 5 becomes +2, at 10 becomes +1.' },
      solved: `Running sums: ${calRun[4].runs.join(', ')}. Max ${calRun[4].best}: [5, 10) ends before [10, …) begin.`,
      then: [{ note: 'Keys after the booking.', panels: calPanels(calRun[4], { 0: 'active', 1: 'active' }) }],
    },
    {
      kind: 'watch',
      title: 'Range frequency: no tree',
      lines: ['For each value, record its sorted positions.', 'Count in [l, r] = `lowerBound(pos, r + 1) − lowerBound(pos, l)`.'],
      frames: [
        { say: 0, note: 'Scan once and push each index into its value\'s list.', panels: [arr(FA, { label: 'arr', highlights: hl(6, (k) => (FA[k] === 4 ? 'active' : '')) }), table([...POS.keys()].map(String), ['positions'], [...POS.values()].map((p) => [p.join(',')]))] },
        { say: 1, note: 'How many 4s in [1, 4]? lowerBound(pos[4], 5) = 3: all three positions are < 5.', panels: [arr(FA, { label: 'arr', range: [1, 4], highlights: winHl(6, 1, 4) }), arr(POS.get(4), { label: 'pos[4]', highlights: { 0: 'window', 1: 'window', 2: 'window' } })] },
        { say: 1, note: `lowerBound(pos[4], 1) = 1. Answer 3 − 1 = ${freq(1, 4, 4)}.`, panels: [arr(FA, { label: 'arr', range: [1, 4], highlights: winHl(6, 1, 4, { 2: 'done', 4: 'done' }) }), arr(POS.get(4), { label: 'pos[4]', pointers: [ptr(1, 'lb(1) = 1')], highlights: { 1: 'done', 2: 'done', 0: 'muted' } }), vars({ answer: freq(1, 4, 4) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the 7s',
      lines: ['Same arr. Query: how many 7s in [2, 5]?'],
      panels: [arr(FA, { label: 'arr', range: [2, 5], highlights: winHl(6, 2, 5) }), arr(POS.get(7), { label: 'pos[7]' })],
      task: { type: 'number', question: 'What is the answer?', options: [1, 2, 0, 3], answer: freq(2, 5, 7), hint: 'lowerBound(pos[7], 6) − lowerBound(pos[7], 2).' },
      solved: `2 − 1 = ${freq(2, 5, 7)}: only the 7 at index 5.`,
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Index 0 in a Fenwick tree',
      lines: ['`0 & -0 === 0`.', 'So `i += i & -i` never moves from 0.', 'Always convert to 1-based first.'],
      frames: [
        { say: 0, note: 'i = 0: lowbit = 0.', panels: [vars({ i: 0, 'i & -i': 0 })] },
        { say: 1, note: 'i += 0 → still 0. The loop never ends.', panels: [vars({ i: 0, 'next i': 0 })] },
        { say: 2, note: 'With i = index + 1 = 1: 1 → 2 → 4 → 8. It climbs.', panels: [vars({ i: 1, 'path (n = 8)': '1, 2, 4, 8' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: default sort',
      lines: ['Compression with `[10, 9, 1].sort()` (no comparator).', 'Default sort compares as **strings**.'],
      panels: [arr(SORTED_BAD, { label: '[10, 9, 1].sort()' })],
      task: { type: 'cell', question: 'Which cell is out of numeric order?', answer: 1, hints: { 0: '1 is the smallest, so it is fine first.', 2: '9 is fine; the cell before it is the problem.' } },
      solved: '"10" < "9" as strings. Always pass `(a, b) => a - b`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: identity for max',
      lines: ['No overlap must return the operation\'s **identity**.'],
      panels: [vars({ op: 'max', 'no overlap': '?' })],
      task: {
        type: 'choose',
        question: 'A **max** segment tree: what does no-overlap return?',
        options: [
          { text: '-Infinity', why: '' },
          { text: '0', why: 'With negative data, max(−5, 0) = 0: a wrong answer.' },
          { text: 'Infinity', why: 'max(x, Infinity) is always Infinity.' },
        ],
        answer: 0,
      },
      solved: 'Identities: 0 for sum, Infinity for min, **-Infinity for max**, 0 for gcd.',
    },
    {
      kind: 'turn',
      title: 'Your turn: smaller or equal',
      lines: ['Inserted so far: 3, 5, 5, 8.', '"Strictly smaller" is `prefix(rank − 1)`; "≤" is `prefix(rank)`.'],
      panels: [arr(LEs, { label: 'value (rank 0..2)' }), arr([1, 2, 1], { label: 'count by rank' })],
      task: { type: 'number', question: 'How many inserted values are **≤ 5**?', options: [3, 1, 2, 4], answer: fenPrefix(LEt, 1).s, hint: 'rank(5) = 1: prefix(1) = counts at ranks 0 and 1.' },
      solved: `prefix(1) = 1 + 2 = 3. Strictly smaller would be prefix(0) = ${fenPrefix(LEt, 0).s}.`,
    },
    {
      kind: 'watch',
      title: 'Sparse table for sums',
      lines: ['The two blocks may overlap.', 'Sum adds the overlap twice.'],
      frames: [
        { say: 0, note: 'Sum of [0, 2] on [2, 3, 4]: blocks [0, 1] and [1, 2].', panels: [arr(SPS, { label: 'nums', highlights: { 0: 'window', 1: 'active', 2: 'window' } })] },
        { say: 1, note: '5 + 7 = 12, but the real sum is 9: the 3 was added twice.', panels: [arr(SPS, { label: 'nums', highlights: { 1: 'bad' } }), vars({ blocks: '5 + 7 = 12', real: 9 })] },
      ],
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Open with the trade-off',
      lines: ['Plain array: O(1) update, O(n) query.', 'Prefix sums: O(n) update, O(1) query.', '"I need both fast: a Fenwick tree gives O(log n) / O(log n)."'],
      frames: [
        { say: 0, note: 'Plain array.', panels: [table(['plain'], ['upd', 'qry'], [['1', 'n']], [['done', 'bad']])] },
        { say: 1, note: 'Prefix sums: the costs swap.', panels: [table(['plain', 'prefix'], ['upd', 'qry'], [['1', 'n'], ['n', '1']], [['done', 'bad'], ['bad', 'done']])] },
        { say: 2, note: 'Fenwick: log n both ways.', panels: [table(['plain', 'prefix', 'BIT'], ['upd', 'qry'], [['1', 'n'], ['n', '1'], ['log', 'log']], [['muted', 'muted'], ['muted', 'muted'], ['active', 'active']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: justify the tree',
      lines: ['Prefer the Fenwick tree for sums and counts.', 'Say why when you need a segment tree.'],
      panels: [vars({ updates: 'point', asks: 'range max' })],
      task: {
        type: 'choose',
        question: 'Point updates + range **max**. What do you say?',
        options: [
          { text: 'Segment tree: max is not a sum, so Fenwick prefixes do not fit', why: '' },
          { text: 'Fenwick tree: it is shorter', why: 'Fenwick is preferred for sums/counts; max needs a segment tree.' },
          { text: 'Sparse table: O(1) queries', why: 'There are updates; a sparse table is static.' },
        ],
        answer: 0,
      },
      solved: 'Name the reason: **min/max or range updates** → segment tree.',
    },
  ],
};

export default STEPS;
