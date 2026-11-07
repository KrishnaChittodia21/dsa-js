// Range-structure pattern scenes: coordinate compression + BIT counting, lazy segment tree, per-value
// index lists + binary search, and a sorted boundary map for bookings on huge coordinates.
import { layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (cells, rowLabels, colLabels, opts = {}) => ({ kind: 'table', cells, rowLabels, colLabels, ...opts });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toInt = (v, lo, hi, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? clamp(Math.trunc(x), lo, hi) : d;
};
const ints = (xs, max, lo = -99, hi = 99) => (Array.isArray(xs) ? xs : []).slice(0, max).map((x) => toInt(x, lo, hi));
const show = (a) => `[${a.join(', ')}]`;
const lowbit = (i) => i & -i;

// ───────────────────────── 1. Coordinate compression + BIT: count of smaller numbers after self ─────────────────────────
export const bitCountSmaller = {
  problem: { name: 'Count of Smaller Numbers After Self', statement: 'For each element, count how many elements to its right are smaller.', example: '[40, -7, 900, 40, 3, 12] → [3, 0, 3, 2, 0, 0]', exampleOutput: [3, 0, 3, 2, 0, 0], questionId: 'count-of-smaller-numbers-after-self' },
  title: 'Compression + BIT: count smaller numbers after self',
  description: 'Values become ranks among the sorted distinct values; scanning right to left, a Fenwick tree over ranks answers "how many values to my right are smaller?" with one prefix sum, then marks the value as seen. First 8 numbers kept, values clamped to ±999.',
  defaultInput: { nums: [40, -7, 900, 40, 3, 12] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (≤ 8)' }],
  testInputs: [{ nums: [] }, { nums: [5] }, { nums: [2, 2, 2] }, { nums: [1, 2, 3, 4, 5, 6, 7, 8] }, { nums: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] }, { nums: [-999, 999, 0, -999] }],
  generate({ nums }) {
    const a = ints(nums, 8, -999, 999);
    const n = a.length;
    const frames = [];
    const sorted = [...new Set(a)].sort((x, y) => x - y);
    const m = sorted.length;
    const rank = new Map(sorted.map((v, i) => [v, i + 1])); // 1-based ranks = BIT cells
    const tree = new Array(m + 1).fill(0);
    const seen = new Array(m + 1).fill(0);
    const res = new Array(n).fill('·');
    const numsPanel = (i, hl = {}) => {
      const highlights = {};
      for (let k = i + 1; k < n; k++) highlights[k] = 'visited';
      return arr(a, { label: 'nums', highlights: { ...highlights, ...hl }, pointers: i >= 0 && i < n ? [{ index: i, label: 'i', color: 'a' }] : [] });
    };
    const rankPanel = (shown, hl = {}) =>
      table(
        sorted.map((v, k) => [shown ? v : '?', seen[k + 1]]),
        sorted.map((_, k) => `rank ${k + 1}`),
        ['value', 'seen'],
        { label: 'rank map + counts', states: sorted.map((_, k) => [hl[k + 1] || '', hl[k + 1] || '']) },
      );
    const bitPanel = (hl = {}) => arr(['-', ...tree.slice(1)], { label: 'BIT over ranks (1-indexed)', highlights: { 0: 'muted', ...hl } });
    const push = (note, panels, extra, predict) => frames.push({ note, panels: [...panels, vars(extra)], ...(predict ? { predict } : {}) });
    if (!n) {
      push('No numbers → nothing to count.', [numsPanel(-1)], { res: '[]' });
      push('The answer is an empty list. O(n log n) in general: one sort plus two O(log n) BIT walks per element.', [numsPanel(-1)], { res: '[]' });
      frames.at(-1).result = [];
      return frames;
    }
    push(`For each nums[i], count the values to its RIGHT that are smaller. Brute force compares every pair: O(n²). A BIT indexed by value would be faster, but values like ${sorted[0]} or ${sorted[m - 1]} cannot be array indices.`, [numsPanel(-1), rankPanel(false)], { n });
    const probe = a[0];
    push(`Compress: sorted distinct values = ${show(sorted)}. Each value's rank is its position there (1-based), so "less than" between values is the same as between ranks.`, [numsPanel(-1), rankPanel(true, { [rank.get(probe)]: 'active' })], { m, [`rank(${probe})`]: rank.get(probe) }, m > 2 ? pick(`What rank (1-based) does ${probe} get among the distinct values?`, rank.get(probe), [rank.get(probe) + 1, rank.get(probe) - 1, 1, m, a.indexOf(probe) + 1].filter((r) => r >= 1 && r <= m), 1, 'Rank = position in the sorted list of distinct values.') : undefined);
    push(`ranks = ${show(a.map((v) => rank.get(v)))}. The BIT gets one cell per rank (${m} cells, not ${sorted[m - 1] - sorted[0] + 1}). Now scan from the right, so everything already in the BIT is to the right of i.`, [numsPanel(-1), rankPanel(true), bitPanel()], { ranks: show(a.map((v) => rank.get(v))) });
    let step = 0;
    for (let i = n - 1; i >= 0; i--, step++) {
      const x = a[i];
      const r = rank.get(x);
      // Query: prefix over ranks 1..r-1 (template: bit.prefixSum(r - 2) in the 0-based API).
      let s = 0;
      const hops = [];
      const qHl = {};
      for (let k = r - 1; k > 0; k -= lowbit(k)) {
        s += tree[k];
        hops.push(k);
        qHl[k] = 'done';
      }
      res[i] = s;
      const below = {};
      for (let k = 1; k < r; k++) below[k] = 'visited';
      below[r] = 'active';
      const qPredict = step % 2 === 1 ? pick(`nums[${i}] = ${x} has rank ${r}. How many values to its right are smaller?`, s, [s + 1, Math.max(0, s - 1), n - 1 - i, seen[r]], step + 2, 'Count the seen values with rank < r: a prefix sum over ranks 1..r−1.') : undefined;
      push(
        r > 1
          ? `i = ${i}: x = ${x}, rank ${r}. Smaller values have ranks 1..${r - 1}, so ask prefix(${r - 1}): hops ${hops.length ? hops.join(' → ') : '(none)'} (i −= i & −i) → ${s}. res[${i}] = ${s}.`
          : `i = ${i}: x = ${x} has rank 1 — no value is smaller, so res[${i}] = 0 without touching the BIT.`,
        [numsPanel(i, { [i]: 'active' }), rankPanel(true, below), bitPanel(qHl)],
        { x, rank: r, [`prefix(${r - 1})`]: s, res: show(res) },
        qPredict,
      );
      // Update: mark x as seen.
      const ups = [];
      for (let k = r; k <= m; k += lowbit(k)) {
        tree[k] += 1;
        ups.push(k);
      }
      seen[r] += 1;
      const uPredict = step % 2 === 0 && step > 0 && m > 1 ? pick(`Insert rank ${r}: which BIT cells does add climb through (i += i & −i)?`, ups.join(' → '), [[r].join(' → '), Array.from({ length: m - r + 1 }, (_, k) => r + k).join(' → '), [r, r + 1].filter((k) => k <= m).join(' → '), [r, m].join(' → ')], step, 'Each hop adds the lowest set bit, landing on the next larger block that contains this rank.') : undefined;
      push(`Mark ${x} as seen AFTER the query (so it never counts itself): add(rank ${r}, +1) climbs ${ups.join(' → ')}. Equal values share a rank and are not "smaller".`, [numsPanel(i, { [i]: 'done' }), rankPanel(true, { [r]: 'done' }), bitPanel(Object.fromEntries(ups.map((k) => [k, 'active'])))], { x, rank: r, res: show(res) }, uPredict);
    }
    push(`Done: res = ${show(res)}. Sort O(n log n) + n × (query + update) O(log n) each → O(n log n) time, O(n) space.`, [numsPanel(-1, Object.fromEntries(a.map((_, k) => [k, 'done']))), rankPanel(true), bitPanel()], { res: show(res) });
    frames.at(-1).result = res;
    return frames;
  },
};

// ───────────────────────── 2. Segment tree with lazy propagation: range add + range sum ─────────────────────────
export const lazySegmentTree = {
  problem: { name: 'Range add, range sum (lazy segment tree)', statement: 'Support "add d to every element in [l, r]" and "sum of [l, r]", both in O(log n).', example: '[2, 5, 1, 4, 3, 6], add 2 to [0..4], sum [1..3] → 16', exampleOutput: 16, questionId: 'classic-range-add-range-sum' },
  title: 'Lazy segment tree: range add, range sum',
  description: 'A range add stops at nodes fully inside the range (sum += d × length, tag += d). A tag is pushed to the children only when a later update or query must go below that node. Node label = its sum, then the pending tag. First 6 numbers kept, values clamped to ±99, delta to ±9.',
  defaultInput: { nums: [2, 5, 1, 4, 3, 6], addL: 0, addR: 4, delta: 2, qL: 1, qR: 3 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums (≤ 6)' },
    { key: 'addL', type: 'number', label: 'add l' },
    { key: 'addR', type: 'number', label: 'add r' },
    { key: 'delta', type: 'number', label: 'delta' },
    { key: 'qL', type: 'number', label: 'query l' },
    { key: 'qR', type: 'number', label: 'query r' },
  ],
  testInputs: [
    { nums: [], addL: 0, addR: 0, delta: 1, qL: 0, qR: 0 },
    { nums: [7], addL: 0, addR: 0, delta: 3, qL: 0, qR: 0 },
    { nums: [1, 1, 1, 1], addL: 3, addR: 1, delta: -2, qL: 0, qR: 3 },
    { nums: [4, 4, 4, 4, 4, 4, 4, 4], addL: -5, addR: 50, delta: 1, qL: 2, qR: 2 },
    { nums: [3, 1, 4, 1, 5], addL: 0, addR: 1, delta: 5, qL: 7, qR: 9 },
  ],
  generate({ nums, addL, addR, delta, qL, qR }) {
    const a = ints(nums, 6);
    const n = a.length;
    const frames = [];
    const order = (x, y) => (x <= y ? [x, y] : [y, x]);
    const [ul, ur] = order(toInt(addL, -99, 99), toInt(addR, -99, 99));
    const [ql, qr] = order(toInt(qL, -99, 99), toInt(qR, -99, 99));
    const d = toInt(delta, -9, 9);
    if (!n) {
      frames.push({ note: 'No numbers → the tree is empty.', panels: [arr([], { label: 'real values' })] });
      frames.push({ note: 'Every range sum is 0. Range add and range sum are O(log n) in general.', panels: [arr([], { label: 'real values' }), vars({ answer: 0 })] });
      frames.at(-1).result = 0;
      return frames;
    }
    const real = [...a];
    const sum = {};
    const lazy = {};
    const span = {};
    const build = (node, lo, hi) => {
      span[node] = [lo, hi];
      lazy[node] = 0;
      if (lo === hi) return (sum[node] = a[lo]);
      const mid = (lo + hi) >> 1;
      return (sum[node] = build(2 * node, lo, mid) + build(2 * node + 1, mid + 1, hi));
    };
    build(1, 0, n - 1);
    const toTree = (node) => {
      const [lo, hi] = span[node];
      return { id: node, label: '', children: lo < hi ? [toTree(2 * node), toTree(2 * node + 1)] : [] };
    };
    const layout = layoutNary(toTree(1));
    const label = (node) => (lazy[node] && span[node][0] < span[node][1] ? `${sum[node]} ${lazy[node] > 0 ? '+' : ''}${lazy[node]}` : String(sum[node]));
    const rng = (node) => `[${span[node][0]}..${span[node][1]}]`;
    const visible = (l, r) => (r < 0 || l > n - 1 ? undefined : [clamp(l, 0, n - 1), clamp(r, 0, n - 1)]);
    let mode = 'add';
    const draw = (note, states, extra, node, predict) => {
      const [l, r] = mode === 'add' ? [ul, ur] : [ql, qr];
      const highlights = {};
      for (let k = 0; k < n; k++) highlights[k] = k >= l && k <= r ? (mode === 'add' ? 'visited' : 'done') : '';
      frames.push({
        note,
        panels: [
          { kind: 'nodes', nodes: layout.nodes.map((ln) => ({ id: ln.id, label: label(ln.id), x: ln.x, y: ln.y, state: states[ln.id] || '' })), edges: layout.edges.map(([p, c]) => ({ from: p, to: c, state: '' })), directed: false, label: 'segment tree (sum, pending tag)' },
          arr([...real], { label: 'real values (not stored anywhere)', highlights, ...(node && visible(...span[node]) ? { range: visible(...span[node]) } : {}) }),
          vars(extra),
        ],
        ...(predict ? { predict } : {}),
      });
    };
    draw(`Built: every node stores the sum of its range (root = ${sum[1]}). Each node also has a lazy tag, 0 for now. Next: add ${d} to nums[${ul}..${ur}].`, {}, { op: `add [${ul}..${ur}] += ${d}` }, 1);
    // rangeAdd with frames
    let st = {};
    let firstFull = true;
    const rangeAdd = (node) => {
      const [lo, hi] = span[node];
      const ex = { node: rng(node), op: `add [${ul}..${ur}] += ${d}` };
      if (ur < lo || hi < ul) {
        st[node] = 'muted';
        draw(`${rng(node)} is outside [${ul}..${ur}] → return, nothing changes below it.`, { ...st }, ex, node);
        return;
      }
      if (ul <= lo && hi <= ur) {
        const before = sum[node];
        sum[node] += d * (hi - lo + 1);
        lazy[node] += d; // a leaf's tag is never pushed, so it is not drawn
        st[node] = 'done';
        const predict = firstFull && lo < hi ? pick(`${rng(node)} lies fully inside [${ul}..${ur}]. What happens here?`, `sum += ${d}×${hi - lo + 1}, tag += ${d}, stop`, [`recurse into both children`, `sum += ${d}, stop`, `update every leaf below it`], 1, 'Full overlap: the node absorbs the whole update; its children are fixed later, only if needed.') : undefined;
        if (lo < hi) firstFull = false;
        draw(`${rng(node)} is fully inside → apply: sum ${before} + ${d} × ${hi - lo + 1} = ${sum[node]}${lo < hi ? `, tag = ${lazy[node]}. Stop — its children are NOT touched now.` : ' (a leaf: no children to owe anything).'}`, { ...st }, { ...ex, sum: sum[node], tag: lazy[node] }, node, predict);
        return;
      }
      st[node] = 'active';
      if (lazy[node]) {
        pushDown(node, ex);
      } else draw(`${rng(node)} only partly overlaps [${ul}..${ur}] → its tag is 0, so nothing to push; split into both children.`, { ...st }, ex, node);
      st[node] = 'visited';
      rangeAdd(2 * node);
      rangeAdd(2 * node + 1);
      sum[node] = sum[2 * node] + sum[2 * node + 1];
      draw(`Back at ${rng(node)}: sum = ${sum[2 * node]} + ${sum[2 * node + 1]} = ${sum[node]} (children are current, so re-sum them).`, { ...st, [node]: 'active' }, { ...ex, sum: sum[node] }, node);
    };
    let firstPush = true;
    const pushDown = (node, ex) => {
      const t = lazy[node];
      const L = 2 * node;
      const R = 2 * node + 1;
      for (const c of [L, R]) {
        sum[c] += t * (span[c][1] - span[c][0] + 1);
        lazy[c] += t; // as in the template; a leaf's tag is never read, so it is not drawn
      }
      lazy[node] = 0;
      const predict = firstPush ? pick(`We must go below ${rng(node)}, which still has a pending tag ${t > 0 ? '+' : ''}${t}. What happens first?`, 'push the tag to both children', ['ignore the tag', 'add the tag to the answer', 'push it to every leaf below'], 2, 'Children are stale until the parent hands them its tag.') : undefined;
      firstPush = false;
      draw(`${rng(node)} only partly overlaps and owes its children ${t > 0 ? '+' : ''}${t} → push: each child's sum grows by ${t} × its length and inherits the tag; the parent's tag clears.`, { ...st, [L]: 'active', [R]: 'active' }, { ...ex, [`${rng(L)} sum`]: sum[L], [`${rng(R)} sum`]: sum[R] }, node, predict);
    };
    rangeAdd(1);
    for (let k = Math.max(0, ul); k <= Math.min(n - 1, ur); k++) real[k] += d;
    draw(`Range add done with only ${Object.keys(st).length} node visits. Tagged nodes hold correct sums; the nodes under them are still stale — and that is fine until someone looks.`, Object.fromEntries(Object.keys(lazy).filter((k) => lazy[k] && span[k][0] < span[k][1]).map((k) => [k, 'done'])), { op: `add [${ul}..${ur}] += ${d}`, root: sum[1] }, 1);
    // rangeSum with frames
    mode = 'sum';
    st = {};
    let total = 0;
    draw(`Now query sum of nums[${ql}..${qr}]. Same three cases; a partial node pushes its tag before we step into its children.`, {}, { query: `[${ql}..${qr}]`, total }, 1);
    const rangeSum = (node) => {
      const [lo, hi] = span[node];
      const ex = { node: rng(node), query: `[${ql}..${qr}]` };
      if (qr < lo || hi < ql) {
        st[node] = 'muted';
        draw(`${rng(node)} is outside [${ql}..${qr}] → contributes 0. Its stale children stay untouched.`, { ...st }, { ...ex, total }, node);
        return;
      }
      if (ql <= lo && hi <= qr) {
        total += sum[node];
        st[node] = 'done';
        draw(`${rng(node)} is fully inside → take its sum ${sum[node]}${lazy[node] ? ` (already includes its own tag ${lazy[node]})` : ''}. total = ${total}.`, { ...st }, { ...ex, total }, node);
        return;
      }
      st[node] = 'active';
      if (lazy[node]) pushDown(node, { ...ex, total });
      else draw(`${rng(node)} partly overlaps [${ql}..${qr}], no pending tag → split into both children.`, { ...st }, { ...ex, total }, node);
      st[node] = 'visited';
      rangeSum(2 * node);
      rangeSum(2 * node + 1);
    };
    rangeSum(1);
    let check = 0;
    for (let k = Math.max(0, ql); k <= Math.min(n - 1, qr); k++) check += real[k];
    if (check !== total) throw new Error('lazy segment tree mismatch');
    const others = [total + d, total - d, total + 1, 2 * total];
    const predict = pick(`What is sum(${ql}..${qr})?`, total, others, 3, 'Add the sums of the fully covered nodes.');
    draw(`sum(${ql}..${qr}) = ${total}. Tags were pushed only along the paths the query walked. Range add and range sum are both O(log n).`, { ...st }, { query: `[${ql}..${qr}]`, answer: total }, undefined, predict);
    frames.at(-1).result = total;
    return frames;
  },
};

// ───────────────────────── 3. Per-value index lists + binary search: range frequency queries ─────────────────────────
export const indexListsRangeFreq = {
  problem: { name: 'Range Frequency Queries', statement: 'Answer queries "how many times does value appear in arr[l..r]?".', example: 'arr [5, 2, 5, 7, 2, 5, 9, 5], queries [1,5,5] [3,6,2] [0,7,8] → [2, 1, 0]', exampleOutput: [2, 1, 0], questionId: 'range-frequency-queries' },
  title: 'Index lists + binary search: range frequency',
  description: 'Record the positions of each value while scanning (already sorted), then count v in [l, r] as lowerBound(pos[v], r + 1) − lowerBound(pos[v], l). First 8 numbers and 3 queries [l, r, value] kept; l > r is swapped.',
  defaultInput: { arr: [5, 2, 5, 7, 2, 5, 9, 5], queries: [[1, 5, 5], [3, 6, 2], [0, 7, 8]] },
  fields: [
    { key: 'arr', type: 'numbers', label: 'arr (≤ 8)' },
    { key: 'queries', type: 'json', label: 'queries [[l, r, value], …] (≤ 3)' },
  ],
  testInputs: [
    { arr: [], queries: [[0, 3, 1]] },
    { arr: [4], queries: [[0, 0, 4], [0, 0, 5]] },
    { arr: [3, 3, 3, 3], queries: [[-5, 99, 3], [2, 1, 3]] },
    { arr: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2], queries: [[8, 9, 1], [0, 0, 2], [5, 5, 2]] },
    { arr: [7, 8], queries: 'oops' },
  ],
  generate({ arr: arrIn, queries }) {
    const a = ints(arrIn, 8);
    const n = a.length;
    const qs = (Array.isArray(queries) ? queries : [])
      .filter((q) => Array.isArray(q))
      .slice(0, 3)
      .map((q) => {
        const [l, r] = [toInt(q[0], -99, 99), toInt(q[1], -99, 99)];
        return [Math.min(l, r), Math.max(l, r), toInt(q[2], -99, 99)];
      });
    const frames = [];
    const pos = new Map();
    const posTable = (hlValue) => {
      const keys = [...pos.keys()];
      return keys.length
        ? table(keys.map((v) => [pos.get(v).join(', ')]), keys.map((v) => `v = ${v}`), ['positions'], { label: 'pos (value → sorted positions)', states: keys.map((v) => [v === hlValue ? 'active' : '']) })
        : arr([], { label: 'pos (value → sorted positions)' });
    };
    const arrPanel = (opts = {}) => arr(a, { label: 'arr', ...opts });
    const push = (note, panels, extra, predict) => frames.push({ note, panels: [...panels, vars(extra)], ...(predict ? { predict } : {}) });
    push(`Static array, many questions "how often does v appear in arr[l..r]?". Counting each time is O(n) per query. Instead, store where every value lives.`, [arrPanel(), posTable()], { n, queries: qs.length });
    a.forEach((v, i) => {
      const fresh = !pos.has(v);
      if (fresh) pos.set(v, []);
      pos.get(v).push(i);
      const predict = i === n - 1 && pos.get(v).length > 1 ? pick(`Push index ${i} for value ${v}. What is pos(${v}) after this?`, pos.get(v).join(', '), [[i, ...pos.get(v).slice(0, -1)].join(', '), pos.get(v).slice(0, -1).join(', '), String(i)], 1, 'Indices arrive in increasing order, so push keeps each list sorted.') : undefined;
      push(`i = ${i}: ${fresh ? `first ${v} → new list.` : `${v} again →`} push ${i}. Indices only grow, so every list stays sorted with no extra work.`, [arrPanel({ highlights: { [i]: 'active' }, pointers: [{ index: i, label: 'i', color: 'a' }] }), posTable(v)], { v, [`pos(${v})`]: show(pos.get(v)) }, predict);
    });
    const answers = [];
    qs.forEach(([l, r, v], qi) => {
      const range = n && r >= 0 && l <= n - 1 ? { range: [clamp(l, 0, n - 1), clamp(r, 0, n - 1)] } : {};
      const vHl = {};
      a.forEach((x, k) => {
        if (x === v) vHl[k] = k >= l && k <= r ? 'done' : 'visited';
      });
      const list = pos.get(v);
      if (!list) {
        answers.push(0);
        push(`query(${l}, ${r}, ${v}): ${v} never appears in arr, so pos(${v}) is empty → count = 0 with no search at all.`, [arrPanel(range), posTable()], { query: `${l}, ${r}, ${v}`, count: 0 });
        return;
      }
      const listPanel = (lo, hi, m, hl = {}) =>
        arr([...list, 'end'], {
          label: `pos(${v})`,
          highlights: { [list.length]: 'muted', ...hl },
          pointers: [
            { index: lo, label: 'lo', color: 'a' },
            { index: hi, label: 'hi', color: 'b' },
            ...(m === undefined ? [] : [{ index: m, label: 'm', color: 'c' }]),
          ],
        });
      push(`query(${l}, ${r}, ${v}): look up pos(${v}) = ${show(list)}. Count = lowerBound(${r + 1}) − lowerBound(${l}) — the first index ≥ r + 1 minus the first index ≥ l.`, [arrPanel({ ...range, highlights: vHl }), posTable(v), listPanel(0, list.length)], { query: `${l}, ${r}, ${v}` });
      const lowerBound = (x, which) => {
        let lo = 0;
        let hi = list.length;
        let it = 0;
        while (lo < hi) {
          const m = (lo + hi) >> 1;
          const goRight = list[m] < x;
          const predict = which === 'r' && it === 0 && qi === 0 ? ask(`lowerBound(${x}): m = ${m}, pos[m] = ${list[m]}. Which half keeps the answer?`, ['lo = m + 1 (go right)', 'hi = m (go left)'], goRight ? 0 : 1, 'pos[m] < x → the first index ≥ x is to the right of m; otherwise it is m or left of it.') : undefined;
          if (goRight) lo = m + 1;
          else hi = m;
          push(`lowerBound(${x}): m = ${m}, pos[m] = ${list[m]} ${goRight ? `< ${x} → lo = ${lo}` : `≥ ${x} → hi = ${hi}`}.`, [arrPanel({ ...range, highlights: vHl }), posTable(v), listPanel(lo, hi, m, { [m]: goRight ? 'muted' : 'active' })], { x, lo, hi }, predict);
          it++;
        }
        return lo;
      };
      const left = lowerBound(l, 'l');
      push(`lowerBound(${l}) = ${left}: ${left} occurrence${left === 1 ? '' : 's'} of ${v} sit before index ${l}. Now the right end — use r + 1 = ${r + 1}, because r itself is included.`, [arrPanel({ ...range, highlights: vHl }), posTable(v), listPanel(left, list.length, undefined, Object.fromEntries(list.slice(0, left).map((_, k) => [k, 'muted'])))], { [`lowerBound(${l})`]: left });
      const right = lowerBound(r + 1, 'r');
      const count = right - left;
      answers.push(count);
      const inside = {};
      for (let k = 0; k < list.length; k++) inside[k] = k >= left && k < right ? 'done' : 'muted';
      const predict = qi === 1 || (qi === 0 && qs.length === 1) ? pick(`lowerBound(${l}) = ${left}, lowerBound(${r + 1}) = ${right}. How many ${v}s in [${l}..${r}]?`, count, [count + 1, right, left, Math.max(0, count - 1)], qi + 2, 'Positions with index in [left, right) are exactly the ones inside [l, r].') : undefined;
      push(`count = ${right} − ${left} = ${count}: pos(${v}) entries ${left}..${right - 1} lie inside [${l}..${r}]. Two binary searches → O(log n) per query.`, [arrPanel({ ...range, highlights: vHl }), posTable(v), listPanel(left, right, undefined, inside)], { query: `${l}, ${r}, ${v}`, count }, predict);
    });
    push(`Answers: ${show(answers)}. Build O(n) once, then O(log n) per query and O(n) memory in total — no tree, because the array never changes.`, [arrPanel(), posTable()], { answers: show(answers) });
    frames.at(-1).result = answers;
    return frames;
  },
};

// ───────────────────────── 4. Interval coverage on huge coordinates: sorted boundary map (My Calendar III) ─────────────────────────
export const boundaryMapBookings = {
  problem: { name: 'My Calendar III', statement: 'After each booking [start, end), report the largest number of bookings that overlap at one moment.', example: '[10,20] [50,60] [10,40] [5,15] [5,10] [25,55] → [1, 1, 2, 3, 3, 3]', exampleOutput: [1, 1, 2, 3, 3, 3], questionId: 'my-calendar-iii' },
  title: 'Boundary map: max overlap after each booking',
  description: 'Each booking [start, end) adds +1 at start and −1 at end in a map; sweeping the keys in sorted order gives the running overlap, and its maximum is the answer. Only endpoints are stored, so coordinates can be huge. First 6 bookings kept, coordinates clamped to 0..10^9; start ≥ end is skipped.',
  defaultInput: { bookings: [[10, 20], [50, 60], [10, 40], [5, 15], [5, 10], [25, 55]] },
  fields: [{ key: 'bookings', type: 'json', label: 'bookings [[start, end], …] (≤ 6)' }],
  testInputs: [
    { bookings: [] },
    { bookings: [[3, 9]] },
    { bookings: [[1, 5], [5, 9], [1, 5]] },
    { bookings: [[0, 1000000000], [2, 3], [7, 7], [9, 4]] },
    { bookings: [[1, 10], [2, 9], [3, 8], [4, 7], [5, 6], [6, 7], [0, 1]] },
    { bookings: 'bad' },
  ],
  generate({ bookings }) {
    const raw = (Array.isArray(bookings) ? bookings : []).filter((b) => Array.isArray(b)).slice(0, 6).map((b) => [toInt(b[0], 0, 1e9), toInt(b[1], 0, 1e9)]);
    const valid = raw.filter(([s, e]) => s < e);
    const lo = valid.length ? Math.min(...valid.map((b) => b[0])) : 0;
    const hi = valid.length ? Math.max(...valid.map((b) => b[1])) : 1;
    const frames = [];
    const delta = new Map();
    const booked = [];
    const results = [];
    const ivPanel = (cur) => ({ kind: 'intervals', label: 'bookings [start, end)', min: lo, max: Math.max(hi, lo + 1), items: booked.map((b, k) => ({ start: b[0], end: b[1], state: k === cur ? 'active' : '' })) });
    const mapPanel = (keys, curCol = {}, states = {}) =>
      keys.length
        ? table(keys.map((k) => [delta.get(k), k in curCol ? curCol[k] : '']), keys.map(String), ['delta', 'cur'], { label: 'delta map (sorted keys)', states: keys.map((k) => [states[k] || '', states[k] || '']) })
        : arr([], { label: 'delta map' });
    const push = (note, panels, extra, predict) => frames.push({ note, panels: [...panels, vars(extra)], ...(predict ? { predict } : {}) });
    push(`Coordinates may reach 10^9, so no array over them. Store only the boundaries: +1 where a booking starts, −1 where it ends (half-open [start, end)). Running sums over sorted keys = how many bookings cover that stretch.`, [ivPanel(-1), mapPanel([])], { bookings: valid.length });
    let made = 0;
    raw.forEach(([s, e]) => {
      if (s >= e) {
        push(`[${s}, ${e}) is empty or reversed (start ≥ end) → skipped.`, [ivPanel(-1), mapPanel([...delta.keys()].sort((x, y) => x - y))], { skipped: `[${s}, ${e})` });
        return;
      }
      booked.push([s, e]);
      const b = booked.length - 1;
      delta.set(s, (delta.get(s) ?? 0) + 1);
      delta.set(e, (delta.get(e) ?? 0) - 1);
      const keys = [...delta.keys()].sort((x, y) => x - y);
      const touch = delta.get(e) === 0 || delta.get(s) === 0;
      push(`book(${s}, ${e}): delta[${s}] += 1 → ${delta.get(s)}, delta[${e}] −= 1 → ${delta.get(e)}.${touch ? ' A 0 means one booking ends exactly where another starts — touching, not overlapping.' : ''}`, [ivPanel(b), mapPanel(keys, {}, { [s]: 'active', [e]: 'active' })], { start: s, end: e });
      // Sweep the sorted keys.
      let cur = 0;
      let best = 0;
      const curCol = {};
      const stepThrough = made === 2;
      keys.forEach((k, ki) => {
        cur += delta.get(k);
        best = Math.max(best, cur);
        curCol[k] = cur;
        if (stepThrough) {
          const predict = ki === 2 ? pick(`Running cur = ${cur - delta.get(k)}. Key ${k} has delta ${delta.get(k)}. What is cur now?`, cur, [cur - delta.get(k), cur + 1, -cur, best + 1], 2, 'cur += delta[k]: starts raise it, ends lower it.') : undefined;
          push(`Sweep key ${k}: cur += ${delta.get(k)} → ${cur}. From ${k} up to the next key, ${cur} booking${cur === 1 ? '' : 's'} overlap. best = ${best}.`, [ivPanel(b), mapPanel(keys, { ...curCol }, { [k]: 'active' })], { key: k, cur, best }, predict);
        }
      });
      results.push(best);
      const bestStates = Object.fromEntries(keys.filter((k) => curCol[k] === best && best > 0).map((k) => [k, 'done']));
      const predict = made >= 3 && made % 2 === 1 ? pick(`After booking [${s}, ${e}), what does book() return (max overlap)?`, best, [best + 1, best - 1, results[results.length - 2], booked.length].filter((x) => x >= 0), made, 'Sweep the sorted keys, keep the running sum, take its maximum.') : undefined;
      push(`${stepThrough ? 'Sweep done' : `Sweep ${keys.length} sorted keys`}: running cur values ${keys.map((k) => curCol[k]).join(', ')} → max overlap = ${best}. book returns ${best}.`, [ivPanel(b), mapPanel(keys, curCol, bestStates)], { returns: best, so_far: show(results) }, predict);
      made++;
    });
    const k = delta.size;
    push(valid.length ? `Returns: ${show(results)}. Each book sorts the ${k} stored keys and sweeps them: O(k log k) per call — fine for a few hundred calls, independent of how large the coordinates are.` : 'No valid booking → nothing to return. Each book costs O(k log k) for k stored keys.', [ivPanel(-1), mapPanel([...delta.keys()].sort((x, y) => x - y))], { returns: show(results) });
    frames.at(-1).result = results;
    return frames;
  },
};
