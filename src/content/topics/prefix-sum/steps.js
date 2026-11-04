// Step lessons for Prefix Sum (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every prefix value, range sum, map count and grid cell below is produced by running the algorithm on the example.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const code = (text) => vars({ code: text });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const gst = (m, n, f) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => f(r, c)));
// shade [lo, hi] as a window, with per-index overrides
const win = (n, lo, hi, extra = {}) => hl(n, (k) => extra[k] ?? (k >= lo && k <= hi ? 'window' : ''));
const prefixOf = (a) => a.reduce((p, x) => (p.push(p.at(-1) + x), p), [0]);
// prefix values filled up to index `upto`, the rest still blank
const partial = (P, upto) => P.map((v, k) => (k <= upto ? v : '·'));
const mapTable = (m, label = 'count') => (m.size ? table([...m.keys()].map(String), [label], [...m.values()].map((v) => [String(v)])) : vars({ map: '{}' }));
const mapStr = (m) => `{${[...m].map(([k, v]) => `${k}:${v}`).join(', ')}}`;

// Building prefix[i + 1] = prefix[i] + nums[i], one frame per element (plus the empty-sum frame).
function buildFrames(nums, { sayZero, sayStep, label = 'nums', plabel = 'prefix' }) {
  const P = prefixOf(nums);
  const frames = [{ say: sayZero, note: 'prefix[0] = 0: the empty sum.', panels: [arr(nums, { label }), arr(partial(P, 0), { label: plabel, highlights: { 0: 'active' } })] }];
  nums.forEach((x, i) =>
    frames.push({
      say: sayStep,
      note: `prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${P[i]} + ${x} = ${P[i + 1]}.`,
      panels: [arr(nums, { label, highlights: hl(nums.length, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), arr(partial(P, i + 1), { label: plabel, highlights: hl(P.length, (k) => (k === i + 1 ? 'active' : k === i ? 'window' : k < i ? 'done' : '')) })],
    }),
  );
  return frames;
}
// A range sum: nums[l..r] bracketed, prefix[r + 1] kept (active) and prefix[l] subtracted (bad).
const rangePanels = (nums, P, l, r, label = 'nums') => [
  arr(nums, { label, range: [l, r], highlights: win(nums.length, l, r) }),
  arr(P, { label: 'prefix', highlights: { [r + 1]: 'active', [l]: 'bad' }, pointers: [ptr(l, '−'), ptr(r + 1, '+', 'b')] }),
];

// Count subarrays with sum k: seen = {0: 1}, look up cur − k first, then record cur.
function countRun(nums, k, init = true) {
  const seen = new Map(init ? [[0, 1]] : []);
  let cur = 0,
    count = 0;
  return nums.map((x, j) => {
    cur += x;
    const found = seen.get(cur - k) ?? 0;
    count += found;
    const before = new Map(seen);
    seen.set(cur, (seen.get(cur) ?? 0) + 1);
    return { j, x, cur, look: cur - k, found, count, before, after: new Map(seen) };
  });
}
const countPanels = (nums, s, k, label) => [arr(nums, { label: label ?? `nums, k = ${k}`, pointers: [ptr(s.j, 'j')], highlights: hl(nums.length, (i) => (i === s.j ? 'active' : i < s.j ? 'done' : '')) }), vars({ cur: s.cur, 'look for': s.look, found: s.found, count: s.count }), mapTable(s.after, 'seen')];

// ---------- what ----------
const N5 = [3, 1, 4, 1, 5];
const P5 = prefixOf(N5); // 0 3 4 8 9 14

// ---------- why: three queries, direct vs prefix ----------
const QUERIES = [
  [0, 4],
  [1, 3],
  [2, 4],
];
const directFrames = [];
{
  let adds = 0;
  for (const [l, r] of QUERIES) {
    adds += r - l + 1;
    directFrames.push({ say: 0, note: `sum(${l}..${r}): loop over ${r - l + 1} elements = ${P5[r + 1] - P5[l]}.`, panels: [arr(N5, { label: 'direct', range: [l, r], highlights: win(5, l, r, hl(5, (k) => (k >= l && k <= r ? 'visited' : undefined))) }), vars({ additions: adds })] });
  }
}
const prefixQueryFrames = QUERIES.map(([l, r], q) => ({ say: 1, note: `sum(${l}..${r}) = prefix[${r + 1}] − prefix[${l}] = ${P5[r + 1]} − ${P5[l]} = ${P5[r + 1] - P5[l]}.`, panels: [...rangePanels(N5, P5, l, r), vars({ 'build additions': 5, subtractions: q + 1 })] }));

// ---------- intuition: height profile ----------
const N6 = [3, 1, 4, 1, 5, 9];
const P6 = prefixOf(N6); // 0 3 4 8 9 14 23

// ---------- brute force / optimized: pivot index ----------
const PV = [1, 7, 3, 6, 5, 6];
const PV_TOTAL = PV.reduce((a, b) => a + b, 0); // 28
const PVP = prefixOf(PV); // 0 1 8 11 17 22 28
const pivotOf = (a) => a.findIndex((_, i) => a.slice(0, i).reduce((x, y) => x + y, 0) === a.slice(i + 1).reduce((x, y) => x + y, 0)); // 3
const PIVOT = pivotOf(PV);
const bruteFrames = [];
for (let i = 0; i <= PIVOT; i++) {
  const left = PVP[i];
  const right = PV_TOTAL - PVP[i + 1];
  bruteFrames.push({
    say: i === PIVOT ? 0 : 1,
    note: `i = ${i}: re-add the left part (${left}) and the right part (${right}).${left === right ? ' Equal → return ' + i + '.' : ''}`,
    panels: [arr(PV, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(6, (k) => (k < i ? 'window' : k === i ? 'active' : 'visited')) }), vars({ left, right, 'elements added': (i + 1) * (PV.length - 1) })],
  });
}
// one pass: total, then left / right per i
const passFrames = [{ say: 0, note: `total = ${PV.join(' + ')} = ${PV_TOTAL}.`, panels: [arr(PV, { label: 'nums', highlights: hl(6, () => 'visited') }), vars({ total: PV_TOTAL, left: 0 })] }];
{
  let left = 0;
  for (let i = 0; i < PV.length; i++) {
    const right = PV_TOTAL - left - PV[i];
    const pane = (l) => [arr(PV, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(6, (k) => (k < i ? 'window' : k === i ? 'active' : '')) }), vars({ total: PV_TOTAL, left: l, right })];
    passFrames.push({ i, say: 2, note: `i = ${i}: right = ${PV_TOTAL} − ${left} − ${PV[i]} = ${right}.${left === right ? ` left = right → return ${i}.` : ` ${left} ≠ ${right}.`}`, panels: pane(left) });
    if (left === right) break;
    left += PV[i];
    passFrames.push({ i, say: 3, note: `left += ${PV[i]} → ${left}.`, panels: pane(left) });
  }
}
const passTurnAt = passFrames.findIndex((f) => f.i === 2);

// ---------- template ----------
const T3 = [2, 4, 1];
const T3P = prefixOf(T3);
const ONES = [1, 1, 1];
const onesRun = countRun(ONES, 2);
// difference array: n = 4, updates [l, r, v]
const UPD = [
  [0, 1, 3],
  [1, 3, 2],
];
const diffMarks = [];
{
  const d = new Array(5).fill(0);
  for (const [l, r, v] of UPD) {
    d[l] += v;
    d[r + 1] -= v;
    diffMarks.push({ l, r, v, d: d.slice() });
  }
}
const diffRun = [];
{
  const d = diffMarks.at(-1).d.slice();
  for (let i = 1; i < 4; i++) {
    d[i] += d[i - 1];
    diffRun.push({ i, d: d.slice() });
  }
}

// ---------- implementation ----------
const NA = [-2, 0, 3, -5, 2, -1];
const NAP = prefixOf(NA); // 0 -2 -2 1 -4 -2 -3

// ---------- 2D ----------
const M = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const P2 = Array.from({ length: 4 }, () => new Array(4).fill(0));
const build2d = [];
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 3; c++) {
    P2[r + 1][c + 1] = M[r][c] + P2[r][c + 1] + P2[r + 1][c] - P2[r][c];
    build2d.push({ r, c, snap: P2.map((row) => row.slice()) });
  }
const P2full = P2.map((row) => row.slice());
// P grid with not-yet-built cells blank
const p2grid = (snap, r, c) => {
  const done = (R, C) => R === 0 || C === 0 || (R - 1) * 3 + (C - 1) <= r * 3 + c;
  return grid(
    snap.map((row, R) => row.map((v, C) => (done(R, C) ? v : '·'))),
    gst(4, 4, (R, C) => (R === r + 1 && C === c + 1 ? 'active' : R === r && C === c ? 'bad' : (R === r && C === c + 1) || (R === r + 1 && C === c) ? 'window' : '')),
    'P (one padded row and column)',
  );
};
const buildFrame2d = (b) => ({
  say: 1,
  note: `P[${b.r + 1}][${b.c + 1}] = ${M[b.r][b.c]} + ${b.snap[b.r][b.c + 1]} + ${b.snap[b.r + 1][b.c]} − ${b.snap[b.r][b.c]} = ${b.snap[b.r + 1][b.c + 1]}.`,
  panels: [grid(M, gst(3, 3, (R, C) => (R === b.r && C === b.c ? 'active' : R <= b.r && C <= b.c ? 'window' : '')), 'M'), p2grid(b.snap, b.r, b.c)],
});
const turn2d = build2d.findIndex((b) => b.r === 1 && b.c === 1);
const rectSum = (r1, c1, r2, c2) => P2full[r2 + 1][c2 + 1] - P2full[r1][c2 + 1] - P2full[r2 + 1][c1] + P2full[r1][c1];
const P2st = (cells) => gst(4, 4, (R, C) => cells[`${R},${C}`] ?? '');

// ---------- intuition-hashmap ----------
const IH = [1, -1, 1];
const ihRun = countRun(IH, 1);
const threeYes = countRun([3], 3)[0];
const threeNo = countRun([3], 3, false)[0];

// ---------- optimized-hashmap ----------
const OH = [1, 2, 3];
const ohRun = countRun(OH, 3);
// Contiguous Array: 0 → −1, first index of each prefix
const BIN = [0, 1, 1, 0, 1, 1];
const longRun = [];
{
  const first = new Map([[0, -1]]);
  let cur = 0,
    best = 0;
  BIN.forEach((b, j) => {
    cur += b === 0 ? -1 : 1;
    let len = null;
    if (first.has(cur)) {
      len = j - first.get(cur);
      best = Math.max(best, len);
    } else first.set(cur, j);
    longRun.push({ j, cur, len, best, start: len === null ? null : j - len + 1, first: new Map(first) });
  });
}
const longFrame = (s) => ({
  say: s.len === null ? 1 : 2,
  note: s.len === null ? `j = ${s.j}: cur = ${s.cur} is new → first[${s.cur}] = ${s.j}.` : `j = ${s.j}: cur = ${s.cur} seen first at ${s.first.get(s.cur)} → length ${s.j} − (${s.first.get(s.cur)}) = ${s.len}. best = ${s.best}.`,
  panels: [
    arr(BIN.map((b) => (b === 0 ? -1 : 1)), { label: '0 → −1', pointers: [ptr(s.j, 'j')], ...(s.len !== null ? { range: [s.start, s.j], highlights: win(6, s.start, s.j, { [s.j]: 'active' }) } : { highlights: { [s.j]: 'active' } }) }),
    mapTable(s.first, 'first index'),
    vars({ cur: s.cur, best: s.best }),
  ],
});
const longTurnAt = 3;

// ---------- optimized-modulo ----------
const MO = [4, 5, 0, -2, -3, 1];
const K5 = 5;
const norm = (x, k) => ((x % k) + k) % k;
const modRun = [];
{
  const seen = new Map([[0, 1]]);
  let cur = 0,
    count = 0;
  MO.forEach((x, j) => {
    cur += x;
    const rem = norm(cur, K5);
    const found = seen.get(rem) ?? 0;
    count += found;
    seen.set(rem, (seen.get(rem) ?? 0) + 1);
    modRun.push({ j, cur, rem, found, count, after: new Map(seen) });
  });
}
const modFrame = (s) => ({
  say: 1,
  note: `j = ${s.j}: P = ${s.cur}, remainder ${s.rem}. Earlier prefixes with remainder ${s.rem}: ${s.found}. count = ${s.count}.`,
  panels: [arr(MO, { label: 'nums, k = 5', pointers: [ptr(s.j, 'j')], highlights: hl(6, (i) => (i === s.j ? 'active' : i < s.j ? 'done' : '')) }), vars({ P: s.cur, 'P mod 5': s.rem, count: s.count }), mapTable(s.after, 'seen')],
});
const MOD_TURN = 4;

// ---------- intuition-difference ----------
const Z5 = [0, 0, 0, 0, 0];
const lessonDiff = [0, 5, 0, 0, -5, 0];
const lessonOut = prefixOf(lessonDiff).slice(1, 6); // 0 5 5 5 0
const A4 = [2, 5, 5, 3];
const A4D = A4.map((x, i) => x - (i ? A4[i - 1] : 0)); // 2 3 0 -2
const UP2 = [
  [0, 2, 2],
  [2, 4, 3],
];
const up2Marks = [];
{
  const d = new Array(6).fill(0);
  for (const [l, r, v] of UP2) {
    d[l] += v;
    up2Marks.push({ at: l, d: d.slice(), what: `+${v} at diff[${l}]` });
    d[r + 1] -= v;
    up2Marks.push({ at: r + 1, d: d.slice(), what: `−${v} at diff[${r + 1}]` });
  }
}
const UP2D = up2Marks.at(-1).d; // 2 0 3 -2 0 -3
const UP2OUT = prefixOf(UP2D).slice(1, 6); // 2 2 5 3 3

// ---------- dry run ----------
const DR = [1, 2, 1, -1, 2];
const drRun = countRun(DR, 3);
const drFrame = (s, say = 1) => ({ say, note: `j = ${s.j}: cur = ${s.cur}, look for ${s.look} → found ${s.found}. count = ${s.count}.`, panels: countPanels(DR, s, 3) });
const DRP = prefixOf(DR);

// ---------- mistakes ----------
const noInitRun = countRun(OH, 3, false);

// ---------- interview tips ----------
const ZEROS = [0, 0, 0];
const zeroRun = countRun(ZEROS, 0);

const STEPS = {
  what: [
    {
      kind: 'watch',
      title: 'Running totals',
      lines: ['A **prefix sum** is a running total.', '`prefix[0] = 0`: the **empty sum**, before any element.', '`prefix[i + 1] = prefix[i] + nums[i]`.', 'n elements give **n + 1** prefix entries.'],
      frames: [
        ...buildFrames(N5, { sayZero: 1, sayStep: 2 }),
        { say: 3, note: `nums has ${N5.length} elements; prefix has ${P5.length}. prefix[3] = 3 + 1 + 4.`, panels: [arr(N5, { label: 'nums' }), arr(P5, { label: 'prefix', highlights: { 3: 'active' }, range: [0, 3] })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Any range in one subtraction',
      lines: ['`sum(l..r) = prefix[r + 1] − prefix[l]` (inclusive l and r).', 'Like an **odometer**: subtract two readings, never re-drive the route.'],
      frames: [
        { say: 0, note: 'Range nums[1..3]: the 1, 4, 1.', panels: [arr(N5, { label: 'nums', range: [1, 3], highlights: win(5, 1, 3) }), arr(P5, { label: 'prefix' })] },
        { say: 0, note: `prefix[4] − prefix[1] = ${P5[4]} − ${P5[1]} = ${P5[4] - P5[1]} = 1 + 4 + 1.`, panels: [...rangePanels(N5, P5, 1, 3), vars({ sum: P5[4] - P5[1] })] },
        { say: 1, note: 'Two readings, one subtraction. The elements in between are never touched again.', panels: [arr(P5, { label: 'odometer readings', highlights: { 4: 'active', 1: 'bad' } }), vars({ distance: `${P5[4]} − ${P5[1]} = ${P5[4] - P5[1]}` })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: another range',
      lines: ['Right end: `prefix[r + 1]`. Left end: `prefix[l]`.'],
      panels: [arr(N5, { label: 'nums', range: [2, 4], highlights: win(5, 2, 4) }), arr(P5, { label: 'prefix' })],
      task: { type: 'number', question: 'What is `sum(nums[2..4])`?', options: [5, 9, 10, 14], answer: P5[5] - P5[2], hint: 'Subtract prefix[2] from prefix[5].' },
      solved: `prefix[5] − prefix[2] = ${P5[5]} − ${P5[2]} = ${P5[5] - P5[2]} = 4 + 1 + 5.`,
      then: [{ say: 0, note: `${P5[5]} − ${P5[2]} = ${P5[5] - P5[2]}.`, panels: rangePanels(N5, P5, 2, 4) }],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Loop every time, or pay once?',
      lines: ['Direct: each query **loops over** its range.', 'Prefix sums: **one O(n) pass** to build, then **O(1)** per query.', 'n = q = 10^5: direct is up to **10^10** additions; prefix about **2 · 10^5** operations.'],
      frames: [
        ...directFrames,
        { say: 1, note: 'Build prefix once: one addition per element.', panels: [arr(N5, { label: 'nums', highlights: hl(5, () => 'done') }), arr(P5, { label: 'prefix', highlights: hl(6, () => 'done') }), vars({ 'build additions': 5 })] },
        ...prefixQueryFrames,
        { say: 2, note: 'Pay once, reuse forever.', panels: [table(['direct', 'prefix'], ['n = q = 10^5'], [['≈ 10^10'], ['≈ 2 · 10^5']], [['bad'], ['done']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why it cancels',
      lines: ['`prefix[4]` = nums[0..3]. `prefix[1]` = nums[0..0].'],
      panels: [arr(N5, { label: `prefix[4] = 3 + 1 + 4 + 1`, range: [0, 3], highlights: win(5, 0, 3) }), arr(N5, { label: 'prefix[1] = 3', range: [0, 0], highlights: { 0: 'bad' } })],
      task: {
        type: 'choose',
        question: 'Why does `prefix[4] − prefix[1]` leave exactly `nums[1..3]`?',
        options: [
          { text: 'Both contain `nums[0]`; that shared part cancels', why: '' },
          { text: '`prefix[1]` is the empty sum', why: 'prefix[0] is the empty sum; prefix[1] = nums[0] = 3.' },
          { text: 'Subtraction reverses the order of the elements', why: 'Order plays no part; what matters is which elements both sums share.' },
        ],
        answer: 0,
      },
      solved: 'The shared part `nums[0..l−1]` cancels. That works because addition is **invertible**.',
    },
    {
      kind: 'turn',
      title: 'Your turn: a prefix min?',
      lines: ['Subtraction works because addition can be **undone**.'],
      panels: [arr(N5, { label: 'nums', range: [2, 2], highlights: { 0: 'window', 1: 'active', 2: 'window' } }), vars({ 'min(0..2)': 1, 'min(0..1)': 1 })],
      task: {
        type: 'choose',
        question: 'You know `min(0..2) = 1` and `min(0..1) = 1`. Do they give you `min(2..2)`?',
        options: [
          { text: 'No: a min cannot be subtracted away', why: '' },
          { text: 'Yes: 1 − 1 = 0', why: 'nums[2] is 4. Min is not invertible, so subtracting means nothing.' },
          { text: 'Yes: it is 1', why: 'nums[2] is 4. The 1 came from index 1, the part you cut away.' },
        ],
        answer: 0,
      },
      solved: 'That is why there is **no prefix min**: min(0..r) and min(0..l−1) do not tell you min(l..r).',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Situation → tool',
      lines: ['Each kind of question has its own prefix tool.'],
      frames: [0, 1, 2, 4].map((upto, f) => {
        const rows = ['many range sums, fixed array', 'rectangle sums on a matrix', 'subarrays with sum exactly k', 'subarray sums divisible by k', 'many range updates, one read'];
        const tools = ['1D prefix sum', '2D prefix sum', 'prefix sum + hash map', '?', 'difference array'];
        const shown = [0, 1, 2, 4].slice(0, f + 1);
        return { say: 0, note: `${rows[upto]} → ${tools[upto]}.`, panels: [table(rows, ['tool'], tools.map((t, i) => [shown.includes(i) ? t : '?']), tools.map((_, i) => [i === upto ? 'active' : shown.includes(i) ? 'done' : '']))] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: divisible by k',
      lines: ['Same running totals, a different question.'],
      panels: [table(['many range sums, fixed array', 'rectangle sums on a matrix', 'subarrays with sum exactly k', 'subarray sums divisible by k', 'many range updates, one read'], ['tool'], [['1D prefix sum'], ['2D prefix sum'], ['prefix sum + hash map'], ['?'], ['difference array']], [['done'], ['done'], ['done'], ['active'], ['done']])],
      task: {
        type: 'choose',
        question: 'Which tool counts subarray sums **divisible** by k?',
        options: [
          { text: 'Prefix sum mod k + hash map', why: '' },
          { text: '2D prefix sum', why: 'That one answers rectangle sums on a matrix.' },
          { text: 'Difference array', why: 'That applies range updates; it does not test sums.' },
        ],
        answer: 0,
      },
      solved: 'Prefix sums **mod k** in a hash map.',
    },
    {
      kind: 'turn',
      title: 'Your turn: not a fit',
      lines: ['Prefix sums assume the array **never changes**.'],
      panels: [arr(N5, { label: 'nums, then nums[1] = 7', highlights: { 1: 'bad' } }), arr(P5, { label: 'prefix (stale?)', highlights: { 2: 'bad', 3: 'bad', 4: 'bad', 5: 'bad' } })],
      task: {
        type: 'choose',
        question: 'Values change **between** sum queries. What does the lesson point you to?',
        options: [
          { text: 'A Fenwick tree or segment tree', why: '' },
          { text: 'A 1D prefix sum', why: 'The lesson lists a changing array as **not a fit** for prefix sums.' },
          { text: 'A difference array', why: 'That suits many updates read **once** at the end, not queries mixed with changes.' },
        ],
        answer: 0,
      },
      solved: 'Fenwick or segment tree (Advanced Structures).',
      then: [
        {
          say: 0,
          note: 'The three "not a fit" cases.',
          panels: [table(['array changes between queries', 'range min / max', 'longest sum ≤ target, positives only'], ['instead'], [['Fenwick / segment tree'], ['not invertible'], ['sliding window']], [['bad'], ['bad'], ['bad']])],
        },
      ],
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clues in the text',
      lines: ['Range sums with many queries → **prefix sum**.', 'Subarray counts, negatives, divisible by k → **+ hash map**.', 'Add to every element from l to r → **difference array**.'],
      frames: (() => {
        const clues = ['sum of a range', 'many queries, no updates', 'subarrays with sum k', 'negatives allowed', 'divisible by k', 'add val from l to r', 'after all bookings'];
        const tool = ['prefix sum', 'prefix sum', '+ hash map', '+ hash map', '+ hash map', 'difference array', 'difference array'];
        const groups = [
          [0, 1],
          [2, 3, 4],
          [5, 6],
        ];
        return groups.map((g, f) => {
          const shown = groups.slice(0, f + 1).flat();
          return { say: f, note: g.map((i) => `"${clues[i]}"`).join(', ') + ` → ${tool[g[0]]}.`, panels: [table(clues, ['think'], clues.map((_, i) => [shown.includes(i) ? tool[i] : '?']), clues.map((_, i) => [g.includes(i) ? 'active' : shown.includes(i) ? 'done' : '']))] };
        });
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: 0s and 1s',
      lines: ['"Equal number of 0s and 1s" is on the clue list too.'],
      panels: [arr(BIN, { label: 'nums' }), code('"longest subarray with equal 0s and 1s"')],
      task: {
        type: 'choose',
        question: 'Which tool does this clue point to?',
        options: [
          { text: 'Prefix sum + hash map', why: '' },
          { text: 'Difference array', why: 'Nothing is being added to a range here.' },
          { text: '2D prefix sum', why: 'The data is one row, not a matrix.' },
        ],
        answer: 0,
      },
      solved: 'Prefix sum + hash map: map each 0 to −1 and look for sum 0.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'A height profile',
      lines: ['Walk along the array; your **altitude** changes by `nums[i]` at each step.', 'Each prefix value is the previous one plus the current element.'],
      frames: buildFrames(N6, { sayZero: 0, sayStep: 1, plabel: 'altitude (prefix)' }),
    },
    {
      kind: 'watch',
      title: 'One picture, every pattern',
      lines: ['**Range sum** = altitude at the end − altitude at the start.', '**Sum k** = two points whose altitudes differ by exactly k.', '**Divisible by k** = two altitudes with the same remainder mod k.', '**Difference array** = given the steps, rebuild the altitudes.'],
      frames: [
        { say: 0, note: `nums[1..3]: ${P6[4]} − ${P6[1]} = ${P6[4] - P6[1]}.`, panels: rangePanels(N6, P6, 1, 3) },
        { say: 1, note: `k = 5: altitudes ${P6[3]} and ${P6[1]} differ by 5 → nums[1..2] = 1 + 4.`, panels: [arr(N6, { label: 'nums', range: [1, 2], highlights: win(6, 1, 2) }), arr(P6, { label: 'altitude', highlights: { 1: 'active', 3: 'active' } })] },
        { say: 2, note: `k = 3: altitudes ${P6[0]} and ${P6[1]} both leave remainder 0 → nums[0..0] = 3 is divisible by 3.`, panels: [arr(P6, { label: 'altitude', highlights: { 0: 'active', 1: 'active' } }), arr(P6.map((p) => p % 3), { label: 'altitude mod 3', highlights: { 0: 'active', 1: 'active' } })] },
        { say: 3, note: 'Steps in, altitudes out: the prefix pass rebuilds the profile.', panels: [arr(N6, { label: 'steps (nums)', highlights: hl(6, () => 'visited') }), arr(P6, { label: 'altitude', highlights: hl(7, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: 9 below you',
      lines: ['Sum k = two altitudes that differ by k.'],
      panels: [arr(P6, { label: 'altitude', pointers: [ptr(6, 'you', 'b')], highlights: { 6: 'active' } })],
      task: { type: 'cell', question: 'You stand at the end (altitude 23). Tap the earlier altitude exactly **9** below you.', answer: 5, hints: { 4: '23 − 9 = 14, not 9.', 3: '23 − 8 = 15.', 0: '23 − 0 = 23: that is the whole walk.' } },
      solved: '23 − 14 = 9: the subarray between them is just `[9]`.',
      then: [{ say: 1, note: 'Altitudes 14 and 23 → nums[5..5] = 9.', panels: rangePanels(N6, P6, 5, 5) }],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Recompute both sides',
      lines: ['**Find Pivot Index**: the first i where the sum to its left equals the sum to its right.', 'For every i, loop over the left part **and** the right part again.'],
      frames: bruteFrames.slice(0, PIVOT),
    },
    {
      kind: 'turn',
      title: 'Your turn: total work',
      lines: ['Each i re-adds every element except nums[i].'],
      panels: [arr(PV, { label: 'nums', pointers: [ptr(PIVOT, 'i')], highlights: hl(6, (k) => (k < PIVOT ? 'window' : k === PIVOT ? 'active' : 'visited')) }), vars({ left: PVP[PIVOT], right: PV_TOTAL - PVP[PIVOT + 1] })],
      task: { type: 'number', question: 'It returns at i = 3. How many elements has it added **in total** (i = 0..3)?', options: [5, 11, 20, 30], answer: (PIVOT + 1) * (PV.length - 1), hint: 'Four values of i, each adding n − 1 = 5 elements.' },
      solved: '4 × 5 = 20. With no early return that grows like n², so **O(n²)**.',
      then: [bruteFrames[PIVOT]],
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Pivot in one pass',
      lines: ['Compute `total = sum(nums)`.', 'Walk i from 0 with `left = 0` (sum of nums[0..i−1]).', '`right = total − left − nums[i]`. If `left === right`, return i.', 'Otherwise `left += nums[i]` and continue.'],
      frames: [passFrames[0], { say: 1, note: 'i = 0, left = 0.', panels: [arr(PV, { label: 'nums', pointers: [ptr(0, 'i')] }), vars({ total: PV_TOTAL, left: 0 })] }, ...passFrames.slice(1, passTurnAt).map(({ i, ...f }) => f)],
    },
    {
      kind: 'turn',
      title: 'Your turn: the right side',
      lines: ['`right = total − left − nums[i]`.'],
      panels: [arr(PV, { label: 'nums', pointers: [ptr(2, 'i')], highlights: hl(6, (k) => (k < 2 ? 'window' : k === 2 ? 'active' : '')) }), vars({ total: PV_TOTAL, left: PVP[2], right: '?' })],
      task: { type: 'number', question: 'At i = 2, what is `right`?', options: [11, 17, 20, 25], answer: PV_TOTAL - PVP[2] - PV[2], hint: `${PV_TOTAL} − ${PVP[2]} − ${PV[2]}.` },
      solved: `${PV_TOTAL} − ${PVP[2]} − ${PV[2]} = ${PV_TOTAL - PVP[2] - PV[2]}: no match yet.`,
      then: passFrames.slice(passTurnAt).map(({ i, ...f }) => f),
    },
    {
      kind: 'watch',
      title: 'Many queries: build the array',
      lines: ['`prefix[i + 1] = prefix[i] + nums[i]`, n + 1 entries.', 'The leading `0` is the **empty prefix**.'],
      frames: buildFrames(PV, { sayZero: 1, sayStep: 0 }),
    },
    {
      kind: 'turn',
      title: 'Your turn: a range from 0',
      lines: ['`sum(l..r) = prefix[r + 1] − prefix[l]`.'],
      panels: [arr(PV, { label: 'nums', range: [0, 2], highlights: win(6, 0, 2) }), arr(PVP, { label: 'prefix', highlights: { 3: 'active' } })],
      task: { type: 'cell', question: 'For `sum(0..2)`, `prefix[3]` is kept. Tap the prefix cell you **subtract**.', panel: 1, answer: 0, hints: { 1: 'prefix[1] holds nums[0]; index 0 would drop out of the sum.', 3: 'That is the right end you keep.', 2: 'prefix[2] would remove indices 0 and 1.' } },
      solved: `prefix[3] − prefix[0] = ${PVP[3]} − 0 = ${PVP[3]}. The leading 0 means no special case when l = 0.`,
      then: [{ say: 1, note: `${PVP[3]} − 0 = ${PVP[3]} = 1 + 7 + 3.`, panels: rangePanels(PV, PVP, 0, 2) }],
    },
  ],

  template: [
    {
      kind: 'watch',
      title: '1D prefix sum',
      lines: ['Fill `prefix[i + 1] = prefix[i] + nums[i]`.', '`sum(l, r) = prefix[r + 1] − prefix[l]`, inclusive l..r.'],
      frames: [...buildFrames(T3, { sayZero: 0, sayStep: 0 }), { say: 1, note: `sum(1, 2) = ${T3P[3]} − ${T3P[1]} = ${T3P[3] - T3P[1]}.`, panels: rangePanels(T3, T3P, 1, 2) }],
    },
    {
      kind: 'watch',
      title: 'Prefix sum + hash map',
      lines: ['`seen` starts as `{0: 1}`.', '`prefix += x`, then `count += seen.get(prefix − k) ?? 0`.', 'Then `seen.set(prefix, …)` adds one to its count.'],
      frames: [
        { say: 0, note: 'k = 2. seen = {0: 1}, count = 0.', panels: [arr(ONES, { label: 'nums, k = 2' }), vars({ prefix: 0, count: 0 }), mapTable(new Map([[0, 1]]), 'seen')] },
        ...onesRun.flatMap((s) => [
          { say: 1, note: `prefix = ${s.cur}; seen has ${s.look} → ${s.found}. count = ${s.count}.`, panels: [arr(ONES, { label: 'nums, k = 2', pointers: [ptr(s.j, 'x')], highlights: { [s.j]: 'active' } }), vars({ prefix: s.cur, 'look for': s.look, count: s.count }), mapTable(s.before, 'seen')] },
          { say: 2, note: `Record ${s.cur}: seen = ${mapStr(s.after)}.`, panels: [arr(ONES, { label: 'nums, k = 2', pointers: [ptr(s.j, 'x')], highlights: { [s.j]: 'done' } }), vars({ prefix: s.cur, count: s.count }), mapTable(s.after, 'seen')] },
        ]),
      ],
    },
    {
      kind: 'watch',
      title: 'Difference array: the marks',
      lines: ['`diff` has n + 1 slots, all 0.', 'Each update `[l, r, v]`: `diff[l] += v; diff[r + 1] −= v`.'],
      frames: [
        { say: 0, note: 'n = 4, so diff has 5 slots.', panels: [arr(new Array(5).fill(0), { label: 'diff' }), vars({ updates: '[0,1,+3] [1,3,+2]' })] },
        ...diffMarks.map((u) => ({ say: 1, note: `[${u.l}, ${u.r}, ${u.v}]: diff[${u.l}] += ${u.v}, diff[${u.r + 1}] −= ${u.v}.`, panels: [arr(u.d, { label: 'diff', highlights: { [u.l]: 'active', [u.r + 1]: 'bad' }, range: [u.l, u.r] })] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: after the running sum',
      lines: ['`for (let i = 1; i < n; i++) diff[i] += diff[i − 1]`.', 'diff[0..n−1] is now the result.'],
      panels: [arr(diffMarks.at(-1).d, { label: 'diff after both updates' })],
      task: { type: 'number', question: 'After the running sum, what is `diff[2]`?', options: [-3, 0, 2, 5], answer: diffRun[1].d[2], hint: 'Running sum of 3, 2, −3.' },
      solved: `3 + 2 − 3 = ${diffRun[1].d[2]}: only the +2 update covers index 2.`,
      then: diffRun.map((s) => ({ say: 0, note: `diff[${s.i}] += diff[${s.i - 1}] → ${s.d[s.i]}.`, panels: [arr(s.d, { label: 'diff', highlights: hl(5, (k) => (k === s.i ? 'active' : k < s.i ? 'done' : k === 4 ? 'muted' : '')) })] })),
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'NumArray',
      lines: ['The **constructor** builds `this.prefix` once.', '`sumRange(left, right)` returns `prefix[right + 1] − prefix[left]`.'],
      frames: [...buildFrames(NA, { sayZero: 0, sayStep: 0, plabel: 'this.prefix' }), { say: 1, note: `sumRange(0, 2) = ${NAP[3]} − ${NAP[0]} = ${NAP[3] - NAP[0]}.`, panels: rangePanels(NA, NAP, 0, 2) }],
    },
    {
      kind: 'turn',
      title: 'Your turn: sumRange(2, 5)',
      lines: ['Negatives change nothing about the formula.'],
      panels: [arr(NA, { label: 'nums', range: [2, 5], highlights: win(6, 2, 5) }), arr(NAP, { label: 'this.prefix' })],
      task: { type: 'number', question: 'What does `sumRange(2, 5)` return?', options: [-6, -3, -1, 1], answer: NAP[6] - NAP[2], hint: 'Right end is index 6. Watch the two minus signs.' },
      solved: `${NAP[6]} − (${NAP[2]}) = ${NAP[6] - NAP[2]} = 3 − 5 + 2 − 1.`,
      then: [{ say: 1, note: `${NAP[6]} − (${NAP[2]}) = ${NAP[6] - NAP[2]}.`, panels: rangePanels(NA, NAP, 2, 5) }],
    },
    {
      kind: 'turn',
      title: 'Your turn: the slice shortcut',
      lines: ['Inside a loop of queries, cost per call adds up.'],
      panels: [arr(NA, { label: 'slice(2, 6) copies these', range: [2, 5], highlights: win(6, 2, 5, { 2: 'visited', 3: 'visited', 4: 'visited', 5: 'visited' }) }), code('nums.slice(l, r + 1).reduce(...)')],
      task: {
        type: 'choose',
        question: 'Why avoid this inside `sumRange`?',
        options: [
          { text: 'It is O(length) per call and allocates a new array', why: '' },
          { text: '`reduce` cannot add negative numbers', why: 'reduce adds any numbers; the cost is the problem.' },
          { text: '`slice` changes `nums`', why: 'slice copies without changing nums. The copy itself is the cost.' },
        ],
        answer: 0,
      },
      solved: 'One subtraction on `prefix` is O(1) and allocates nothing.',
    },
  ],

  'optimized-2d': [
    {
      kind: 'watch',
      title: 'Build P cell by cell',
      lines: ['`P[r][c]` = sum of the rectangle (0, 0)–(r − 1, c − 1); one extra row and column of zeros.', 'Cell + above + left − overlap (counted twice): `P[r+1][c+1] = M[r][c] + P[r][c+1] + P[r+1][c] − P[r][c]`.'],
      frames: [
        { say: 0, note: 'Row 0 and column 0 of P are the zero padding.', panels: [grid(M, undefined, 'M'), grid(P2.map((row, R) => row.map((v, C) => (R === 0 || C === 0 ? 0 : '·'))), gst(4, 4, (R, C) => (R === 0 || C === 0 ? 'muted' : '')), 'P (one padded row and column)')] },
        ...build2d.slice(0, turn2d).map(buildFrame2d),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: P[2][2]',
      lines: ['Cell + above + left − overlap.'],
      panels: [grid(M, gst(3, 3, (R, C) => (R === 1 && C === 1 ? 'active' : '')), 'M'), p2grid(build2d[turn2d - 1].snap, 1, 1)],
      task: { type: 'number', question: 'What is `P[2][2]`?', options: [9, 11, 12, 13], answer: P2full[2][2], hint: 'M[1][1] + P[1][2] + P[2][1] − P[1][1] = 5 + 3 + 5 − 1.' },
      solved: `5 + 3 + 5 − 1 = ${P2full[2][2]} = 1 + 2 + 4 + 5.`,
      then: build2d.slice(turn2d).map(buildFrame2d),
    },
    {
      kind: 'watch',
      title: 'A rectangle in four lookups',
      lines: ['Query (1, 1)–(2, 2): inclusion–exclusion.', '`sum = P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1]`.'],
      frames: (() => {
        const mst = (f) => gst(3, 3, f);
        const steps = [
          { note: `Whole: P[3][3] = ${P2full[3][3]}.`, total: P2full[3][3], m: mst(() => 'window'), p: { '3,3': 'active' } },
          { note: `− strip above: P[1][3] = ${P2full[1][3]}.`, total: P2full[3][3] - P2full[1][3], m: mst((r) => (r === 0 ? 'bad' : 'window')), p: { '3,3': 'done', '1,3': 'bad' } },
          { note: `− strip left: P[3][1] = ${P2full[3][1]}.`, total: P2full[3][3] - P2full[1][3] - P2full[3][1], m: mst((r, c) => (r === 0 || c === 0 ? 'bad' : 'window')), p: { '3,3': 'done', '1,3': 'bad', '3,1': 'bad' } },
          { note: `+ corner: P[1][1] = ${P2full[1][1]}.`, total: rectSum(1, 1, 2, 2), m: mst((r, c) => (r === 0 && c === 0 ? 'active' : r === 0 || c === 0 ? 'bad' : 'window')), p: { '3,3': 'done', '1,3': 'bad', '3,1': 'bad', '1,1': 'active' } },
          { note: `Sum = ${rectSum(1, 1, 2, 2)} = 5 + 6 + 8 + 9.`, total: rectSum(1, 1, 2, 2), m: mst((r, c) => (r >= 1 && c >= 1 ? 'done' : 'muted')), p: {} },
        ];
        return steps.map((s, i) => ({ say: i === 0 ? 0 : 1, note: s.note, panels: [grid(M, s.m, 'M, query (1,1)–(2,2)'), grid(P2full, P2st(s.p), 'P'), vars({ sum: s.total })] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: another rectangle',
      lines: ['Four lookups, whatever the rectangle size.'],
      panels: [grid(M, gst(3, 3, (r, c) => (r <= 1 && c >= 1 ? 'window' : '')), 'M, query (0,1)–(1,2)'), grid(P2full, undefined, 'P')],
      task: { type: 'number', question: 'What is the sum of (0, 1)–(1, 2)?', options: [11, 15, 16, 21], answer: rectSum(0, 1, 1, 2), hint: 'P[2][3] − P[0][3] − P[2][1] + P[0][1].' },
      solved: `${P2full[2][3]} − 0 − ${P2full[2][1]} + 0 = ${rectSum(0, 1, 1, 2)} = 2 + 3 + 5 + 6. Row 0 of P is padding, so two lookups are 0.`,
      then: [{ say: 1, note: `${P2full[2][3]} − ${P2full[0][3]} − ${P2full[2][1]} + ${P2full[0][1]} = ${rectSum(0, 1, 1, 2)}.`, panels: [grid(M, gst(3, 3, (r, c) => (r <= 1 && c >= 1 ? 'done' : '')), 'M'), grid(P2full, P2st({ '2,3': 'active', '0,3': 'bad', '2,1': 'bad', '0,1': 'active' }), 'P')] }],
    },
    {
      kind: 'watch',
      title: 'The shared-row trap',
      lines: ['`new Array(m + 1).fill(new Array(n + 1).fill(0))` puts **one** inner array in every row.', 'Use `Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))`.'],
      frames: [
        { say: 0, note: 'With fill(): write P[1][1] = 1 … and every row changes.', panels: [grid(gst(4, 4, (r, c) => (c === 1 ? 1 : 0)), gst(4, 4, (r, c) => (r === 1 && c === 1 ? 'active' : c === 1 ? 'bad' : '')), 'fill(new Array(...))')] },
        { say: 1, note: 'With Array.from: each row is its own array; only P[1][1] changes.', panels: [grid(gst(4, 4, (r, c) => (r === 1 && c === 1 ? 1 : 0)), gst(4, 4, (r, c) => (r === 1 && c === 1 ? 'done' : '')), 'Array.from(...)')] },
      ],
    },
  ],

  'intuition-hashmap': [
    {
      kind: 'watch',
      title: 'Two Sum on prefix sums',
      lines: ['`sum(nums[i..j]) = P_after(j) − P_before(i) = k`.', 'At j: how many earlier prefixes equal `cur − k`?', 'That is **Two Sum** on prefix sums; a hash map answers in O(1).'],
      frames: [
        { say: 0, note: 'nums = [1, −1, 1], k = 1. Before any element, P = 0.', panels: [arr(IH, { label: 'nums, k = 1' }), vars({ cur: 0, count: 0 }), mapTable(new Map([[0, 1]]), 'seen')] },
        ...ihRun.slice(0, 2).map((s) => ({ say: s.found ? 2 : 1, note: `j = ${s.j}: cur = ${s.cur}, look for ${s.look} → ${s.found}. count = ${s.count}.`, panels: countPanels(IH, s, 1) })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: ending at j = 2',
      lines: ['Each earlier occurrence is a **different starting point**.'],
      panels: [arr(IH, { label: 'nums, k = 1', pointers: [ptr(2, 'j')], highlights: { 2: 'active' } }), vars({ cur: ihRun[2].cur, 'look for': ihRun[2].look }), mapTable(ihRun[2].before, 'seen')],
      task: { type: 'number', question: 'How many subarrays **ending at j = 2** have sum 1?', options: [0, 1, 2, 3], answer: ihRun[2].found, hint: 'Read the count of 0 in the map.' },
      solved: '0 was seen twice (before index 0, after index 1): `[1, -1, 1]` and `[1]`. That is why the map stores **counts**.',
      then: [
        { say: 0, note: 'Start before index 0: [1, −1, 1].', panels: [arr(IH, { label: 'from the empty prefix', range: [0, 2], highlights: win(3, 0, 2) }), vars({ count: ihRun[2].count })] },
        { say: 0, note: 'Start after index 1: [1].', panels: [arr(IH, { label: 'from the prefix after index 1', range: [2, 2], highlights: win(3, 2, 2) }), vars({ count: ihRun[2].count })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Why {0: 1}',
      lines: ['The empty prefix (before index 0) has sum 0.', 'A subarray starting at index 0 needs `cur − k = 0` in the map.'],
      frames: [
        { say: 0, note: `nums = [3], k = 3, with {0: 1}: cur = 3, look for 0 → found ${threeYes.found}.`, panels: [arr([3], { label: 'nums, k = 3', range: [0, 0], highlights: { 0: 'done' } }), mapTable(threeYes.before, 'seen'), vars({ count: threeYes.count })] },
        { say: 1, note: `Without it: look for 0 → found ${threeNo.found}. [3] is missed.`, panels: [arr([3], { label: 'nums, k = 3', highlights: { 0: 'bad' } }), vars({ seen: '{}', count: threeNo.count })] },
      ],
    },
  ],

  'optimized-hashmap': [
    {
      kind: 'watch',
      title: 'subarraySum, line by line',
      lines: ['`seen = {0: 1}` for the empty prefix.', '`cur += x`, then **look up first**: `count += seen.get(cur − k) ?? 0`.', '**Then record**: `seen.set(cur, …)`.'],
      frames: [
        { say: 0, note: 'nums = [1, 2, 3], k = 3.', panels: [arr(OH, { label: 'nums, k = 3' }), vars({ cur: 0, count: 0 }), mapTable(new Map([[0, 1]]), 'seen')] },
        ...ohRun.flatMap((s) => [
          { say: 1, note: `cur = ${s.cur}; look for ${s.look} → ${s.found}. count = ${s.count}.`, panels: [arr(OH, { label: 'nums, k = 3', pointers: [ptr(s.j, 'x')], highlights: { [s.j]: 'active' } }), vars({ cur: s.cur, 'look for': s.look, count: s.count }), mapTable(s.before, 'seen')] },
          { say: 2, note: `Record ${s.cur}.`, panels: [arr(OH, { label: 'nums, k = 3', pointers: [ptr(s.j, 'x')], highlights: { [s.j]: 'done' } }), vars({ cur: s.cur, count: s.count }), mapTable(s.after, 'seen')] },
        ]),
      ],
    },
    {
      kind: 'watch',
      title: 'Longest: store the first index',
      lines: ['Map each 0 to −1; the goal becomes **sum 0**.', 'Store the **first index** of each prefix; `first.set(0, -1)`.', 'When `cur` repeats at j, `(first[cur], j]` has sum 0, length `j − first[cur]`.', 'Never overwrite the first index.'],
      frames: [
        { say: 0, note: 'Contiguous Array: 0 becomes −1.', panels: [arr(BIN, { label: 'nums' }), arr(BIN.map((b) => (b === 0 ? -1 : 1)), { label: '0 → −1', highlights: hl(6, (k) => (BIN[k] === 0 ? 'active' : '')) })] },
        ...longRun.slice(0, longTurnAt).map(longFrame),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: cur = 0 again',
      lines: ['Length = `j − first[cur]`.'],
      panels: [arr(BIN.map((b) => (b === 0 ? -1 : 1)), { label: '0 → −1', pointers: [ptr(longTurnAt, 'j')], highlights: { [longTurnAt]: 'active' } }), mapTable(longRun[longTurnAt - 1].first, 'first index'), vars({ cur: longRun[longTurnAt].cur, best: longRun[longTurnAt - 1].best })],
      task: { type: 'number', question: 'At j = 3, cur = 0 again. How long is the subarray?', options: [2, 3, 4, 6], answer: longRun[longTurnAt].len, hint: 'first[0] = −1, so 3 − (−1).' },
      solved: `3 − (−1) = ${longRun[longTurnAt].len}: [0, 1, 1, 0] has as many 0s as 1s.`,
      then: longRun.slice(longTurnAt).map((s, i) => ({ ...longFrame(s), say: i === 1 ? 3 : longFrame(s).say, note: i === 1 ? `${longFrame(s).note} first[1] stays 2.` : longFrame(s).note })),
    },
  ],

  'optimized-modulo': [
    {
      kind: 'watch',
      title: 'Same remainder, divisible gap',
      lines: ['Divisible by k ⇔ `P_j` and `P_i` have the **same remainder** mod k.', 'Key the map by remainders; count earlier prefixes with the same one.'],
      frames: [{ say: 0, note: 'nums = [4, 5, 0, −2, −3, 1], k = 5. The empty prefix has remainder 0.', panels: [arr(MO, { label: 'nums, k = 5' }), vars({ P: 0, 'P mod 5': 0, count: 0 }), mapTable(new Map([[0, 1]]), 'seen')] }, ...modRun.slice(0, MOD_TURN).map(modFrame)],
    },
    {
      kind: 'turn',
      title: 'Your turn: remainder 4 again',
      lines: ['Each earlier prefix with the same remainder starts one divisible subarray.'],
      panels: [arr(MO, { label: 'nums, k = 5', pointers: [ptr(MOD_TURN, 'j')], highlights: { [MOD_TURN]: 'active' } }), vars({ P: modRun[MOD_TURN].cur, 'P mod 5': modRun[MOD_TURN].rem }), mapTable(modRun[MOD_TURN - 1].after, 'seen')],
      task: { type: 'number', question: 'How many divisible subarrays **end at j = 4**?', options: [1, 2, 3, 4], answer: modRun[MOD_TURN].found, hint: 'Read the count of remainder 4.' },
      solved: `${modRun[MOD_TURN].found}: [5, 0, −2, −3] = 0, [0, −2, −3] = −5, [−2, −3] = −5.`,
      then: modRun.slice(MOD_TURN).map(modFrame),
    },
    {
      kind: 'watch',
      title: 'JS % keeps the sign',
      lines: ['In JS, `%` has the sign of the **dividend**: `-6 % 5 === -1`.', 'Normalise: `((x % k) + k) % k` lands in `0 … k−1`.'],
      frames: [
        { say: 0, note: '-6 % 5 = -1. As a map key, -1 is not 4.', panels: [vars({ x: -6, 'x % 5': -1 })] },
        { say: 1, note: '(-1 + 5) % 5 = 4.', panels: [vars({ x: -6, 'x % 5': -1, '+ 5': 4, '% 5': norm(-6, 5) })] },
        { say: 1, note: 'A positive x is unchanged: 4 % 5 = 4, (4 + 5) % 5 = 4.', panels: [vars({ x: 4, 'x % 5': 4, '+ 5': 9, '% 5': norm(4, 5) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: normalise −7',
      lines: ['`((x % k) + k) % k`.'],
      panels: [vars({ x: -7, k: 5, 'x % 5': -7 % 5 })],
      task: { type: 'number', question: 'What is `((-7 % 5) + 5) % 5`?', options: [-2, 2, 3, 7], answer: norm(-7, 5), hint: '(-2 + 5) % 5.' },
      solved: `(-2 + 5) % 5 = ${norm(-7, 5)}: inside 0 … 4, safe as a map key.`,
    },
  ],

  'intuition-difference': [
    {
      kind: 'watch',
      title: 'Two marks, one pass',
      lines: ['A difference array stores **changes**.', 'Add v to [l, r]: at l values jump up → `diff[l] += v`.', 'Right after r they drop back → `diff[r + 1] −= v`.', 'The prefix sum of diff rebuilds the array.'],
      frames: [
        { say: 0, note: 'Add 5 to [1, 3] in an array of 5 zeros. diff starts all 0.', panels: [arr(Z5, { label: 'array', range: [1, 3] }), arr(new Array(6).fill(0), { label: 'diff' })] },
        { say: 1, note: 'diff[1] += 5.', panels: [arr(Z5, { label: 'array', range: [1, 3] }), arr([0, 5, 0, 0, 0, 0], { label: 'diff', highlights: { 1: 'active' } })] },
        { say: 2, note: 'diff[4] −= 5.', panels: [arr(Z5, { label: 'array', range: [1, 3] }), arr(lessonDiff, { label: 'diff', highlights: { 1: 'active', 4: 'bad' } })] },
        ...lessonOut.map((v, i) => ({ say: 3, note: `Running sum to index ${i}: ${v}.`, panels: [arr(lessonDiff, { label: 'diff', highlights: hl(6, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), arr(partial(lessonOut, i), { label: 'final array', highlights: { [i]: 'active' } })] })),
      ],
    },
    {
      kind: 'watch',
      title: 'Inverse operations',
      lines: ['`diff[i] = a[i] − a[i − 1]`.', 'Its prefix sum gives back `a`, like integration and differentiation.'],
      frames: [
        ...A4.map((x, i) => ({ say: 0, note: i ? `diff[${i}] = ${x} − ${A4[i - 1]} = ${A4D[i]}.` : `diff[0] = ${x}.`, panels: [arr(A4, { label: 'a', highlights: { [i]: 'active', ...(i ? { [i - 1]: 'bad' } : {}) } }), arr(partial(A4D, i), { label: 'diff', highlights: { [i]: 'active' } })] })),
        { say: 1, note: `Prefix of diff: ${prefixOf(A4D).slice(1).join(', ')} = a again.`, panels: [arr(A4D, { label: 'diff', highlights: hl(4, () => 'visited') }), arr(prefixOf(A4D).slice(1), { label: 'prefix of diff', highlights: hl(4, () => 'done') })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Two updates, four marks',
      lines: ['+2 on [0, 2], then +3 on [2, 4], array of 5 zeros.', 'u updates cost O(u): two marks each.'],
      frames: up2Marks.map((m) => ({ say: 1, note: `${m.what}.`, panels: [arr(m.d, { label: 'diff', highlights: { [m.at]: m.what.startsWith('+') ? 'active' : 'bad' } })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: read index 2',
      lines: ['One O(n) prefix pass produces the final array.'],
      panels: [arr(UP2D, { label: 'diff after both updates' })],
      task: { type: 'number', question: 'After the prefix pass, what is the value at index 2?', options: [0, 2, 3, 5], answer: UP2OUT[2], hint: 'Add diff[0] + diff[1] + diff[2].' },
      solved: `2 + 0 + 3 = ${UP2OUT[2]}: both updates cover index 2.`,
      then: UP2OUT.map((v, i) => ({ say: 0, note: `Index ${i}: ${v}.`, panels: [arr(UP2D, { label: 'diff', highlights: hl(6, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), arr(partial(UP2OUT, i), { label: 'final array', highlights: { [i]: 'active' } })] })),
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'subarraySum([1, 2, 1, -1, 2], k = 3)',
      lines: ['Start: cur = 0, count = 0, map {0: 1}.', 'Each j: `cur += nums[j]`, look for `cur − k`, add what is found, record `cur`.'],
      frames: [{ say: 0, note: 'Before j = 0.', panels: [arr(DR, { label: 'nums, k = 3' }), vars({ cur: 0, count: 0 }), mapTable(new Map([[0, 1]]), 'seen')] }, ...drRun.slice(0, 3).map((s) => drFrame(s))],
    },
    {
      kind: 'turn',
      title: 'Your turn: j = 3',
      lines: ['nums[3] = −1 brings cur back to 3.'],
      panels: [arr(DR, { label: 'nums, k = 3', pointers: [ptr(3, 'j')], highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'active' } }), vars({ cur: drRun[3].cur, count: drRun[2].count }), mapTable(drRun[3].before, 'seen')],
      task: { type: 'number', question: 'What is `count` after j = 3?', options: [2, 3, 4, 5], answer: drRun[3].count, hint: 'Look for 3 − 3 = 0.' },
      solved: `0 is found once → count = ${drRun[3].count}. The map now holds 3 twice.`,
      then: drRun.slice(3).map((s) => drFrame(s)),
    },
    {
      kind: 'turn',
      title: 'Your turn: where [2, 1] starts',
      lines: ['At j = 2, cur = 4 matched the prefix value **1**, recorded after index 0.'],
      panels: [arr(DR, { label: 'nums', pointers: [ptr(2, 'j')], highlights: { 2: 'active' } }), arr(DRP, { label: 'prefix', highlights: { 1: 'bad', 3: 'active' } })],
      task: { type: 'cell', question: 'Tap where that subarray **starts**.', answer: 1, hints: { 0: 'Prefix 1 already includes index 0, so the subarray starts after it.', 2: 'That is where it ends.' } },
      solved: '[2, 1] starts at index 1, right after the prefix value 1.',
      then: [
        [0, 1, 1],
        [1, 2, 2],
        [0, 3, 3],
      ].map(([l, r, j]) => ({ say: 1, note: `Found at j = ${j}: [${DR.slice(l, r + 1).join(', ')}] = 3.`, panels: [arr(DR, { label: 'nums', range: [l, r], highlights: win(5, l, r) }), arr(DRP, { label: 'prefix', highlights: { [l]: 'bad', [r + 1]: 'active' } })] })),
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Off by one',
      lines: ['Decide once: `prefix` has n + 1 entries.', '`sum(l..r) = prefix[r + 1] − prefix[l]`.'],
      frames: [
        { say: 1, note: `Wrong: sum(0..3) as prefix[3] − prefix[0] = ${P5[3]}. Index 3 is missing.`, panels: [arr(N5, { label: 'nums', range: [0, 2], highlights: win(5, 0, 2, { 3: 'bad' }) }), arr(P5, { label: 'prefix', highlights: { 3: 'bad', 0: 'bad' } })] },
        { say: 1, note: `Right: prefix[4] − prefix[0] = ${P5[4]}.`, panels: rangePanels(N5, P5, 0, 3) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an update at the end',
      lines: ['**Difference array end**: allocate n + 1 slots.'],
      panels: [arr([0, 0, 2, 0, 0], { label: 'diff, n = 4: add 2 to [2, 3]', highlights: { 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'Where does the `−2` go?',
        options: [
          { text: '`diff[4]`: that is why diff has n + 1 slots', why: '' },
          { text: '`diff[3]`', why: 'Index 3 is still inside the range; −2 there would cancel the update at index 3.' },
          { text: '`diff[0]`', why: '−2 at index 0 would lower indices 0 and 1, which the update never touched.' },
        ],
        answer: 0,
      },
      solved: 'r = 3 is the last index, so `r + 1` = 4 needs the extra slot.',
      then: [{ say: 0, note: 'Prefix pass over diff[0..3]: 0, 0, 2, 2.', panels: [arr([0, 0, 2, 0, -2], { label: 'diff', highlights: { 2: 'active', 4: 'bad' } }), arr(prefixOf([0, 0, 2, 0]).slice(1), { label: 'final array', highlights: { 2: 'done', 3: 'done' } })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the missing start',
      lines: ['**Forgetting `map.set(0, 1)`**: subarrays starting at index 0 are missed.'],
      panels: [arr(OH, { label: 'nums, k = 3' }), code('const seen = new Map();'), vars({ returns: noInitRun.at(-1).count, 'should be': ohRun.at(-1).count })],
      task: {
        type: 'choose',
        question: 'Which subarray with sum 3 does this version miss?',
        options: [
          { text: '`[1, 2]`', why: '' },
          { text: '`[3]`', why: 'At j = 2 it looks for 6 − 3 = 3, which was recorded at j = 1.' },
          { text: '`[2, 3]`', why: '2 + 3 = 5, never a match.' },
        ],
        answer: 0,
      },
      solved: '`[1, 2]` starts at index 0: at j = 1 it needs 0 in the map, and 0 was never put there.',
      then: [{ say: 0, note: 'j = 1: cur = 3, look for 0 → not in the map.', panels: [arr(OH, { label: 'nums, k = 3', range: [0, 1], highlights: win(3, 0, 1, { 1: 'bad' }) }), mapTable(noInitRun[1].before, 'seen'), vars({ count: noInitRun[1].count })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: longest or count?',
      lines: ['Same map, a different value, chosen by what the question asks.'],
      panels: [code('"longest subarray with sum k"'), mapTable(new Map([[0, -1]]), 'first index')],
      task: {
        type: 'choose',
        question: 'For the **longest** subarray, what should the map store per prefix?',
        options: [
          { text: 'The first index it appeared', why: '' },
          { text: 'How many times it appeared', why: 'Counts are for **count** problems; every occurrence is a start there.' },
          { text: 'The latest index it appeared', why: 'A later start only makes the subarray shorter.' },
        ],
        answer: 0,
      },
      solved: 'Longest wants the start as far left as possible: keep the first index, never overwrite.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Say the identity',
      lines: ['"sum(i..j) = P[j+1] − P[i], so I need earlier prefixes equal to P − k."', 'Mention the **initial map entry** and the **lookup-then-insert** order.'],
      frames: [
        { say: 0, note: `sum(1..2) = P[3] − P[1] = ${DRP[3]} − ${DRP[1]} = ${DRP[3] - DRP[1]}.`, panels: rangePanels(DR, DRP, 1, 2) },
        { say: 1, note: 'seen starts as {0: 1}; each step looks up before it records.', panels: [mapTable(new Map([[0, 1]]), 'seen'), code('count += seen.get(cur - k) ?? 0; then seen.set(cur, …)')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: all zeros, k = 0',
      lines: ['Edge case from the list: **all zeros with k = 0**.'],
      panels: [arr(ZEROS, { label: 'nums, k = 0' }), mapTable(new Map([[0, 1]]), 'seen')],
      task: { type: 'number', question: 'How many subarrays have sum 0?', options: [3, 4, 6, 7], answer: zeroRun.at(-1).count, hint: 'Every subarray: 3 of length 1, 2 of length 2, 1 of length 3.' },
      solved: `${zeroRun.at(-1).count}. The map finds them as +1, +2, +3.`,
      then: zeroRun.map((s) => ({ say: 1, note: `j = ${s.j}: 0 seen ${s.found} time(s) before → count = ${s.count}.`, panels: countPanels(ZEROS, s, 0) })),
    },
  ],
};

// A turn's `then` frames reuse frame builders from watch steps; point them at the turn's own (single-idea) line 0.
let nChoose = 0;
for (const steps of Object.values(STEPS))
  for (const s of steps) {
    if (s.then) s.then = s.then.map((f) => ({ ...f, say: f.say < s.lines.length ? f.say : 0 }));
    // options are written right-answer-first; rotate so the right one lands in varying positions
    if (s.task?.type === 'choose') {
      const o = s.task.options;
      const r = nChoose++ % o.length;
      s.task.options = [...o.slice(o.length - r), ...o.slice(0, o.length - r)];
      s.task.answer = (s.task.answer + r) % o.length;
    }
  }

export default STEPS;
