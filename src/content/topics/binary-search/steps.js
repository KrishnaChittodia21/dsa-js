// Step lessons for Binary Search (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every lo / mid / hi, predicate value and count below is produced by running the lesson's own loops on the example.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const TF = (b) => (b ? 'T' : 'F');
// the schema checks `intervals`, the renderer reads `items`; give both
const iv = (items, label) => ({ kind: 'intervals', label, items, intervals: items, min: 1, max: 100 });
// pointers that fall inside an array of length n (lo can step past the end)
const ptrs = (n, list) => list.filter((p) => p.index >= 0 && p.index < n);

// ---------- closed search [lo, hi], lo <= hi (exact match) ----------
function exact(a, t) {
  const out = [];
  let lo = 0,
    hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1),
      v = a[mid],
      act = v === t ? 'found' : v < t ? 'lo' : 'hi';
    out.push({ lo, hi, mid, v, act });
    if (act === 'found') return out;
    if (act === 'lo') lo = mid + 1;
    else hi = mid - 1;
  }
  out.push({ lo, hi, act: 'empty' });
  return out;
}
const exNote = (t, s) =>
  s.act === 'found'
    ? `nums[${s.mid}] = ${s.v} = target → return ${s.mid}.`
    : s.act === 'lo'
      ? `nums[${s.mid}] = ${s.v} < ${t} → lo = ${s.mid + 1}.`
      : s.act === 'hi'
        ? `nums[${s.mid}] = ${s.v} > ${t} → hi = ${s.mid - 1}.`
        : `lo = ${s.lo} > hi = ${s.hi}: empty range → return −1.`;
const exPanels = (a, s, label = 'nums') => [
  arr(a, {
    label,
    ...(s.lo <= s.hi ? { range: [s.lo, s.hi] } : {}),
    pointers: s.act === 'empty' ? ptrs(a.length, [ptr(s.lo, 'lo'), ptr(s.hi, 'hi', 'b')]) : [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi')],
    highlights: hl(a.length, (k) => (k === s.mid ? (s.act === 'found' ? 'done' : 'active') : k < s.lo || k > s.hi ? 'muted' : '')),
  }),
  vars(s.act === 'empty' ? { lo: s.lo, hi: s.hi, result: -1 } : { lo: s.lo, hi: s.hi, mid: s.mid, 'nums[mid]': s.v }),
];
const exFrames = (a, t, run, say, label) => run.map((s) => ({ say: say(s), note: exNote(t, s), panels: exPanels(a, s, label) }));

// ---------- boundary search [lo, hi), lo < hi (first index where P is true) ----------
function bound(P, lo, hi) {
  const out = [];
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1),
      p = P(mid);
    out.push({ lo, hi, mid, p });
    if (p) hi = mid;
    else lo = mid + 1;
  }
  out.push({ lo, hi, done: true });
  return out;
}
// nums plus a "·" cell at index n so that hi = n has somewhere to point
const bPanels = (a, s, label, extra = []) => {
  const vals = [...a, '·'];
  return [
    arr(vals, {
      label,
      ...(s.lo < s.hi ? { range: [s.lo, s.hi - 1] } : {}),
      pointers: s.done ? [ptr(s.lo, 'lo = hi')] : [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi')],
      highlights: hl(vals.length, (k) => (s.done ? (k === s.lo ? 'done' : '') : k === s.mid ? 'active' : k < s.lo || k >= s.hi ? 'muted' : '')),
    }),
    ...extra,
  ];
};
const bNote = (s, test, val, yes = 'hi = mid', no = 'lo = mid + 1') =>
  s.done ? `lo = hi = ${s.lo} → return ${s.lo}.` : `mid = ${s.mid}: ${test} ${val}? ${s.p ? 'yes' : 'no'} → ${s.p ? yes.replace('mid', s.mid) : no.replace('mid + 1', s.mid + 1)}.`;
const lowerBound = (a, t) => bound((i) => a[i] >= t, 0, a.length);
const upperBound = (a, t) => bound((i) => a[i] > t, 0, a.length);
const last = (run) => run[run.length - 1].lo;

// ---------- what ----------
const GUESS = [
  { lo: 1, hi: 100, g: 50, say: 'higher' },
  { lo: 51, hi: 100, g: 75, say: 'lower' },
  { lo: 51, hi: 74, g: 62 },
];
function guessRun(secret) {
  const out = [];
  let lo = 1,
    hi = 100;
  for (;;) {
    const g = Math.floor((lo + hi) / 2);
    const say = g === secret ? 'yes' : g < secret ? 'higher' : 'lower';
    out.push({ lo, hi, g, say });
    if (say === 'yes') return out;
    if (say === 'higher') lo = g + 1;
    else hi = g - 1;
  }
}
const G30 = guessRun(30); // 50 lower, 25 higher, then [26, 49] …
const guessPanels = (hist, cur) => [
  iv(hist.map((h, i) => ({ start: h.lo, end: h.hi, state: i === hist.length - 1 ? 'active' : 'visited' })), 'still possible'),
  vars({ guess: cur.g, left: cur.hi - cur.lo + 1 }),
];
const EVEN7 = [2, 4, 6, 8, 10, 12, 14];

// ---------- why ----------
const A8 = [1, 3, 5, 7, 9, 11, 13, 15];
const WHY_BIN = exact(A8, 13);
const P9 = A8.map((x) => x >= 9); // F F F F T T T T

// ---------- intuition ----------
const I8 = [2, 5, 8, 12, 16, 23, 38, 56];
const I38 = exact(I8, 38);
const I16 = exact(I8, 16); // [0,7] mid 3 → [4,7] mid 5 → [4,4] mid 4

// ---------- brute force ----------
function scan(a, t) {
  const out = [];
  for (let i = 0; i < a.length; i++) {
    const r = a[i] === t ? 'found' : a[i] > t ? 'stop' : 'next';
    out.push({ i, r });
    if (r !== 'next') return out;
  }
  out.push({ i: a.length, r: 'end' });
  return out;
}
const S6 = scan(A8, 6);
const S15 = scan(A8, 15);
const S14 = scan(A8, 14);
const reads = (run) => run.filter((s) => s.r !== 'end').length;
const scanPanels = (a, s, t) =>
  arr(a, {
    label: `nums, target ${t}`,
    pointers: s.i < a.length ? [ptr(s.i, 'i')] : [],
    highlights: hl(a.length, (k) => (k === s.i ? (s.r === 'found' ? 'done' : s.r === 'stop' ? 'bad' : 'active') : k < s.i ? 'visited' : '')),
  });

// ---------- optimized ----------
const O7 = [-3, 0, 2, 4, 7, 9, 11];
const O9 = exact(O7, 9);
const O5 = exact(O7, 5);
const O11 = exact(O7, 11);
const optSay = (s) => ({ found: 2, lo: 3, hi: 4, empty: 5 })[s.act];

// ---------- template ----------
const T7 = [1, 2, 4, 6, 7, 8, 9];
const TB = bound((i) => T7[i] >= 6, 0, T7.length);
const TC = [3, 8, 10, 15, 21];
const TCR = bound((i) => TC[i] >= 9, 0, TC.length);
const predRow = (a, P, s) => arr(a.map((x, i) => (s.seen.has(i) ? TF(P(i)) : '?')), { label: 'P(i)', highlights: hl(a.length, (k) => (s.seen.has(k) ? (P(k) ? 'done' : 'muted') : '')) });
// attach the set of indices probed so far
const withSeen = (run) => {
  const seen = new Set();
  return run.map((s) => {
    if (!s.done) seen.add(s.mid);
    return { ...s, seen: new Set(seen) };
  });
};
const SIX = [10, 20, 30, 40, 50, 60];
const pairPanel = (lo, hi, mid, label) =>
  arr(SIX, { label, range: [lo, hi], pointers: [ptr(lo, 'lo'), ptr(mid, 'mid', 'b'), ...(hi !== mid && hi < SIX.length ? [ptr(hi, 'hi')] : [])], highlights: hl(6, (k) => (k === mid ? 'active' : k < lo || k > hi ? 'muted' : '')) });

// ---------- implementation ----------
const B6 = [1, 3, 3, 3, 6, 8];
const LB3 = lowerBound(B6, 3);
const UB3 = upperBound(B6, 3);
const LB9 = lowerBound(B6, 9);
const SORTED_WRONG = [10, 9, 1].sort(); // [1, 10, 9]
const SW = exact(SORTED_WRONG, 9);

// ---------- dry run (the lesson's own tables) ----------
const D6 = [-1, 0, 3, 5, 9, 12];
const D9 = exact(D6, 9);
const D2 = exact(D6, 2);
const L5 = [1, 2, 2, 2, 5];
const DLB = lowerBound(L5, 2);
const DUB = upperBound(L5, 2);
const dryRows = (run, t) => run.filter((s) => s.act !== 'empty').map((s) => [String(s.lo), String(s.hi), String(s.mid), s.act === 'found' ? 'found → return ' + s.mid : `${s.v} ${s.act === 'lo' ? '<' : '>'} ${t} → ${s.act} = ${s.act === 'lo' ? s.mid + 1 : s.mid - 1}`]);
const bRows = (run, a, sym) => run.map((s) => (s.done ? [String(s.lo), String(s.hi), '—', `lo === hi → return ${s.lo}`] : [String(s.lo), String(s.hi), String(s.mid), `${s.p ? 'yes' : 'no'} (${a[s.mid]}) → ${s.p ? 'hi = ' + s.mid : 'lo = ' + (s.mid + 1)}`]));
const upto = (rows, k) => table(rows.slice(0, k + 1).map((_, i) => String(i + 1)), ['lo', 'hi', 'mid', 'decision'], rows.slice(0, k + 1), rows.slice(0, k + 1).map((_, i) => [0, 1, 2, 3].map(() => (i === k ? 'active' : ''))));

// ---------- intuition-bounds ----------
const C6 = [5, 7, 7, 8, 8, 10];
const LB8 = lowerBound(C6, 8);
const UB7 = upperBound(C6, 7);
const LB9C = lowerBound(C6, 9);

// ---------- rotated ----------
const R7 = [4, 5, 6, 7, 0, 1, 2];
const R2 = [6, 7, 0, 1, 2, 4, 5];
function findMin(a) {
  const out = [];
  let lo = 0,
    hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1),
      right = a[mid] > a[hi];
    out.push({ lo, hi, mid, right });
    if (right) lo = mid + 1;
    else hi = mid;
  }
  out.push({ lo, hi, done: true });
  return out;
}
const FM = findMin(R7);
const FM2 = findMin(R2);
const fmPanels = (a, s) => [
  arr(a, {
    label: 'nums (rotated)',
    range: [s.lo, s.hi],
    pointers: s.done ? [ptr(s.lo, 'lo = hi')] : [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi')],
    highlights: hl(a.length, (k) => (s.done ? (k === s.lo ? 'done' : 'muted') : k === s.mid ? 'active' : k === s.hi ? 'window' : k < s.lo || k > s.hi ? 'muted' : '')),
  }),
  vars(s.done ? { min: a[s.lo] } : { 'nums[mid]': a[s.mid], 'nums[hi]': a[s.hi] }),
];
const fmNote = (a, s) =>
  s.done ? `lo = hi = ${s.lo} → the minimum is nums[${s.lo}] = ${a[s.lo]}.` : `nums[${s.mid}] = ${a[s.mid]} ${s.right ? '>' : '<='} nums[hi] = ${a[s.hi]} → ${s.right ? `drop is right of mid, lo = ${s.mid + 1}` : `mid..hi sorted, hi = ${s.mid}`}.`;

// ---------- answer search (Koko) ----------
const PILES = [3, 6, 7, 11];
const hoursAt = (k) => PILES.reduce((h, p) => h + Math.ceil(p / k), 0);
const KS = Array.from({ length: 11 }, (_, i) => i + 1);
const HOURS = KS.map(hoursAt); // 27 15 10 8 8 6 5 5 5 5 4
const sumStr = (k) => PILES.map((p) => Math.ceil(p / k)).join('+');
// the k axis 1..11 split over two panels; cell labels are the k values
const kPanels = (vals, opts) => [
  arr(vals.slice(0, 6), { label: opts.label1 || 'k = 1…6', indexBase: 1, ...opts.p1 }),
  arr(vals.slice(6), { label: opts.label2 || 'k = 7…11', indexBase: 7, ...opts.p2 }),
];
const kSplit = (lo, hi, mid, done) => {
  const part = (base, n) => {
    const a = Math.max(lo, base),
      b = Math.min(hi, base + n - 1);
    return {
      ...(a <= b ? { range: [a - base, b - base] } : {}),
      pointers: [...(lo >= base && lo < base + n ? [ptr(lo - base, done ? 'lo = hi' : 'lo')] : []), ...(!done && mid >= base && mid < base + n ? [ptr(mid - base, 'mid', 'b')] : []), ...(!done && hi >= base && hi < base + n ? [ptr(hi - base, 'hi')] : [])],
      highlights: hl(n, (i) => (base + i === mid && !done ? 'active' : done && base + i === lo ? 'done' : base + i < lo || base + i > hi ? 'muted' : '')),
    };
  };
  return { p1: part(1, 6), p2: part(7, 5) };
};
const KOKO = bound((k) => hoursAt(k) <= 8, 1, 11); // uses floor((lo + hi) / 2): same as lo + ((hi − lo) >> 1) for these small values
{
  // check: Math.floor((lo + hi) / 2) and lo + ((hi - lo) >> 1) agree on this run, as the lesson's code uses the former
  for (const s of KOKO) if (!s.done && Math.floor((s.lo + s.hi) / 2) !== s.mid) throw new Error('mid mismatch');
}
const H6 = bound((k) => hoursAt(k) <= 6, 1, 11);

// greedy split: fill the current part, start a new one only when the next number would overflow x
function greedy(nums, x) {
  const out = [];
  let part = 0,
    parts = 1,
    id = 0;
  const owner = [];
  nums.forEach((v, i) => {
    let fresh = false;
    if (part + v > x) {
      parts++;
      id++;
      part = 0;
      fresh = true;
    }
    part += v;
    owner[i] = id;
    out.push({ i, v, part, parts, fresh, owner: owner.slice() });
  });
  return out;
}
const GN = [2, 4, 3, 5];
const G7 = greedy(GN, 7);
const G8 = greedy(GN, 8);
const gPanels = (s, x) => [
  arr(GN, { label: `nums, x = ${x}`, pointers: [ptr(s.i, 'i')], highlights: hl(GN.length, (k) => (k > s.i ? '' : k === s.i ? 'active' : s.owner[k] % 2 ? 'visited' : 'window')) }),
  vars({ x, 'part sum': s.part, parts: s.parts }),
];

// k-th smallest pair distance by counting
const PD = [1, 3, 6];
function countSweep(a, x) {
  const out = [];
  let left = 0,
    total = 0;
  for (let right = 0; right < a.length; right++) {
    while (a[right] - a[left] > x) left++;
    total += right - left;
    out.push({ right, left, add: right - left, total });
  }
  return out;
}
const CS3 = countSweep(PD, 3);
const countAt = (x) => countSweep(PD, x).at(-1).total;
const COUNTS = [0, 1, 2, 3, 4, 5].map(countAt); // 0 0 1 2 2 3

// ---------- peak & partition ----------
function peak(a) {
  const out = [];
  let lo = 0,
    hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1),
      up = a[mid] < a[mid + 1];
    out.push({ lo, hi, mid, up });
    if (up) lo = mid + 1;
    else hi = mid;
  }
  out.push({ lo, hi, done: true });
  return out;
}
const PK = [2, 4, 1, 3, 5, 7, 6];
const PKR = peak(PK);
const DESC = [6, 5, 4, 3, 2, 1];
const DESCR = peak(DESC);
const pkPanels = (a, s, label) => [
  arr(a, {
    label,
    range: [s.lo, s.hi],
    pointers: s.done ? [ptr(s.lo, 'peak')] : [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi')],
    highlights: hl(a.length, (k) => (s.done ? (k === s.lo ? 'done' : 'muted') : k === s.mid ? 'active' : k === s.mid + 1 ? 'window' : k < s.lo || k > s.hi ? 'muted' : '')),
  }),
];
const pkNote = (a, s) => (s.done ? `lo = hi = ${s.lo}: nums[${s.lo}] = ${a[s.lo]} is a peak.` : `nums[${s.mid}] = ${a[s.mid]} ${s.up ? '<' : '>'} nums[${s.mid + 1}] = ${a[s.mid + 1]} → ${s.up ? `uphill, peak in [${s.mid + 1}, ${s.hi}]` : `downhill, peak in [${s.lo}, ${s.mid}]`}.`);

const MA = [1, 3, 8];
const MB = [2, 7, 9, 10];
const HALF = Math.ceil((MA.length + MB.length) / 2); // 4
const cut = (i) => {
  const j = HALF - i;
  const g = (a, k) => (k < 0 ? -Infinity : k >= a.length ? Infinity : a[k]);
  return { i, j, Al: g(MA, i - 1), Ar: g(MA, i), Bl: g(MB, j - 1), Br: g(MB, j) };
};
const show = (v) => (v === -Infinity ? '−∞' : v === Infinity ? '+∞' : v);
const cutPanels = (c, bad) => [
  arr(MA, { label: `A, i = ${c.i}`, highlights: hl(MA.length, (k) => (k < c.i ? (bad === 'A' && k === c.i - 1 ? 'bad' : 'window') : bad === 'B' && k === c.i ? 'bad' : '')) }),
  arr(MB, { label: `B, j = ${c.j}`, highlights: hl(MB.length, (k) => (k < c.j ? (bad === 'B' && k === c.j - 1 ? 'bad' : 'window') : bad === 'A' && k === c.j ? 'bad' : '')) }),
  vars({ Aleft: show(c.Al), Aright: show(c.Ar), Bleft: show(c.Bl), Bright: show(c.Br) }),
];
const C1 = cut(1); // Bleft 9 > Aright 3
const C2 = cut(2); // valid
const C3 = cut(3); // Aleft 8 > Bright 7

// ---------- mistakes ----------
const M4 = [1, 3, 5, 7];
const WRONG_HI = bound((i) => M4[i] >= 9, 0, M4.length - 1); // hi = n − 1 → returns 3, not 4

// ---------- interview tips ----------
const TINY = [
  { a: [5], t: 5, name: '1 element' },
  { a: [3, 5], t: 5, name: '2 elements' },
  { a: [3, 5], t: 1, name: 'smaller than all' },
  { a: [3, 5], t: 9, name: 'larger than all' },
];

export default {
  what: [
    {
      kind: 'watch',
      title: 'Guess the number',
      lines: ['I think of a number from **1** to **100**.', 'You always guess the **middle** of what is left.', 'Each "higher" or "lower" throws away **half**.'],
      frames: GUESS.map((g, i) => ({
        say: i === 0 ? 1 : 2,
        note: g.say ? `Range [${g.lo}, ${g.hi}]: guess ${g.g} → "${g.say}".` : `Range [${g.lo}, ${g.hi}]: guess ${g.g} → …`,
        panels: guessPanels(GUESS.slice(0, i + 1), g),
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: secret 30',
      lines: ['The secret is **30**.', 'You guessed 50 ("lower"), then 25 ("higher").'],
      panels: [iv([{ start: 1, end: 100, state: 'visited' }, { start: 1, end: 49, state: 'active' }], 'still possible'), vars({ 'guess 1': '50 lower', 'guess 2': '25 higher' })],
      task: {
        type: 'choose',
        question: 'Which numbers are still possible now?',
        options: [
          { text: '26 to 49', why: '' },
          { text: '1 to 49', why: '"Higher" at 25 rules out 25 and everything below it.' },
          { text: '26 to 50', why: '50 was already guessed and was too big.' },
          { text: '25 to 49', why: '25 itself was guessed and was wrong.' },
        ],
        answer: 0,
      },
      solved: `Both guesses moved the range **past** the guess. 30 is found on guess ${G30.length}.`,
      then: G30.map((g, i) => ({
        say: 1,
        note: g.say === 'yes' ? `Range [${g.lo}, ${g.hi}]: guess ${g.g} → found on guess ${i + 1}.` : `Range [${g.lo}, ${g.hi}]: guess ${g.g} → "${g.say}".`,
        panels: guessPanels(G30.slice(0, i + 1), g),
      })),
    },
    {
      kind: 'watch',
      title: 'The same thing in code',
      lines: ['The numbers still possible are an index range `[lo, hi]`.', 'Look at `mid`, compare, then move `lo` or `hi` **past** mid.'],
      frames: [
        { say: 0, note: 'Search space: every index from 0 to 6.', panels: [arr(EVEN7, { label: 'nums, target 12', range: [0, 6], pointers: [ptr(0, 'lo'), ptr(6, 'hi')] }), vars({ lo: 0, hi: 6 })] },
        ...exFrames(EVEN7, 12, exact(EVEN7, 12), () => 1, 'nums, target 12'),
      ],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Scan vs halve',
      lines: ['A linear scan checks one element per step: **O(n)**.', 'Binary search halves the range per step: **O(log n)**.', 'n = 10^9: a billion steps versus **30**.'],
      frames: [
        { say: 0, note: 'Scan: 4 checks so far, 13 not seen yet.', panels: [arr(A8, { label: 'scan, target 13', pointers: [ptr(3, 'i')], highlights: hl(8, (k) => (k < 3 ? 'visited' : k === 3 ? 'active' : '')) }), vars({ checks: 4 })] },
        { say: 0, note: 'Scan finds 13 at index 6 after 7 checks.', panels: [arr(A8, { label: 'scan, target 13', pointers: [ptr(6, 'i')], highlights: hl(8, (k) => (k < 6 ? 'visited' : k === 6 ? 'done' : '')) }), vars({ checks: 7 })] },
        ...WHY_BIN.map((s, i) => ({ say: 1, note: `${exNote(13, s)} Checks: ${i + 1}.`, panels: [exPanels(A8, s, 'halve, target 13')[0], vars({ checks: i + 1 })] })),
        { say: 2, note: 'The gap grows with n.', panels: [table(['linear scan', 'binary search'], ['n = 10^9'], [['10^9'], ['30']], [['bad'], ['done']])] },
      ],
    },
    {
      kind: 'watch',
      title: 'Why half may go unread',
      lines: ['`nums[mid] < target` in a sorted array:', 'every index `≤ mid` is too small. Proved, not read.', 'General form: a predicate `P(i)`, false then true.', 'P(mid) false → all before it false. True → all after it true.'],
      frames: [
        { say: 0, note: 'mid = 3: nums[3] = 7 < 13.', panels: [arr(A8, { label: 'nums, target 13', pointers: [ptr(3, 'mid', 'b')], highlights: { 3: 'active' } })] },
        { say: 1, note: 'nums[0..3] ≤ 7 < 13: none can be 13.', panels: [arr(A8, { label: 'nums, target 13', range: [4, 7], highlights: hl(8, (k) => (k <= 3 ? 'muted' : '')) })] },
        { say: 2, note: 'P(i) = nums[i] >= 9 looks like F F F F T T T T.', panels: [arr(A8, { label: 'nums' }), arr(P9.map(TF), { label: 'P(i): nums[i] >= 9', highlights: hl(8, (k) => (P9[k] ? 'done' : 'muted')) })] },
        { say: 3, note: 'P(2) is false, so P(0) and P(1) are false too: one check settles 3 indices.', panels: [arr(A8, { label: 'nums' }), arr(P9.map((p, k) => (k <= 2 ? 'F' : '?')), { label: 'P(i): nums[i] >= 9', pointers: [ptr(2, 'mid', 'b')], highlights: hl(8, (k) => (k === 2 ? 'active' : k < 2 ? 'muted' : '')) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one check, many answers',
      lines: ['Same predicate: `P(i) = nums[i] >= 9`.'],
      panels: [arr(A8, { label: 'nums' }), arr(A8.map((_, k) => (k === 4 ? 'T' : '?')), { label: 'P(i)', pointers: [ptr(4, 'mid', 'b')], highlights: { 4: 'active' } })],
      task: { type: 'number', question: '`P(4)` is true. Counting index 4, how many indices does this one check settle?', options: [1, 3, 4, 5], answer: 4, hint: 'True at mid means true for mid and every index after it.' },
      solved: 'Indices 4, 5, 6, 7 are all true. One evaluation settles the whole right side.',
      then: [{ say: 0, note: 'P(4) true → P(5), P(6), P(7) true.', panels: [arr(A8, { label: 'nums' }), arr(A8.map((_, k) => (k >= 4 ? 'T' : '?')), { label: 'P(i)', highlights: hl(8, (k) => (k >= 4 ? 'done' : '')) })] }],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Where a yes/no question flips',
      lines: ['Phrase it as: **find where a monotonic yes/no question flips**.', 'It does **not** help on unsorted data searched once, or on a linked list.'],
      frames: (() => {
        const rows = ['sorted input', 'rotated', 'local slope', 'numeric answer', 'asks O(log n)'];
        const how = ['search / bounds', 'one half sorted', 'mid vs neighbour', 'search the answer', 'loud hint'];
        return [
          ...rows.map((_, f) => ({ say: 0, note: `${rows[f]} → ${how[f]}.`, panels: [table(rows, ['use'], how.map((h, i) => [i <= f ? h : '?']), how.map((_, i) => [i === f ? 'active' : i < f ? 'done' : '']))] })),
          { say: 1, note: 'Two places it does not help.', panels: [table(['unsorted, one search', 'linked list'], ['why not'], [['sort > scan'], ['mid costs O(n)']], [['bad'], ['bad']])] },
        ];
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: scores ≥ 70',
      lines: ['Sorted exam scores.', 'Question: how many scores are **≥ 70**?'],
      panels: [arr([52, 61, 64, 70, 75, 88, 93], { label: 'scores (sorted)' })],
      task: {
        type: 'choose',
        question: 'Does binary search fit?',
        options: [
          { text: 'Yes: sorted input + a count, find where ≥ 70 starts', why: '' },
          { text: 'No: there is no single target value to find', why: 'Rule 1 covers a position or a count, not only an exact value.' },
          { text: 'No: counting must read every score', why: 'Sorted means all scores ≥ 70 sit together at the end; finding where they start is enough.' },
        ],
        answer: 0,
      },
      solved: '`nums[i] >= 70` reads F F F T T T T. The flip is at index 3, so 7 − 3 = 4 scores.',
      then: [{ say: 0, note: 'The question flips at index 3: four scores are ≥ 70.', panels: [arr([52, 61, 64, 70, 75, 88, 93], { label: 'scores (sorted)', highlights: hl(7, (k) => (k >= 3 ? 'done' : 'muted')) }), arr(['F', 'F', 'F', 'T', 'T', 'T', 'T'], { label: 'score >= 70', highlights: { 3: 'active' } })] }],
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clues in the problem text',
      lines: ['Some clues describe the **input**.', 'Some describe what is **asked**.', 'Some describe the **answer** as a number to optimise.', 'Then: find the monotonic yes/no question and its boundary.'],
      frames: (() => {
        const clues = ['sorted array / matrix', 'rotated sorted array', 'peak element', 'O(log n) required', 'first / last position', 'insert position', 'minimum X such that…', 'max the min / min the max', 'k-th smallest, huge set'];
        const kind = ['input', 'input', 'input', 'asked', 'asked', 'asked', 'answer', 'answer', 'answer'];
        return [0, 1, 2, 3].map((g) => ({
          say: g,
          note: g < 3 ? `Clues about the ${['input', 'question', 'answer'][g]}.` : 'Any of these → think binary search.',
          panels: [table(clues, ['kind'], kind.map((k, i) => [i < (g + 1) * 3 || g === 3 ? k : '?']), kind.map((_, i) => [g === 3 ? 'done' : Math.floor(i / 3) === g ? 'active' : i < g * 3 ? 'done' : '']))],
        }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the clue',
      lines: ['Three tasks. One carries a binary-search clue.'],
      panels: [table(['A', 'B', 'C'], ['task'], [['insert x into a sorted array'], ['find x in an unsorted array, once'], ['find x in a sorted linked list']])],
      task: {
        type: 'choose',
        question: 'Which one is a binary-search problem?',
        options: [
          { text: 'A: insert position in a sorted array', why: '' },
          { text: 'B: unsorted array, searched once', why: 'Sorting first costs O(n log n), more than one O(n) scan.' },
          { text: 'C: sorted linked list', why: 'Sorted, but reaching the middle of a linked list costs O(n).' },
        ],
        answer: 0,
      },
      solved: '"Insert position" is the clue: the first index whose value is ≥ x.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'One invariant, a shrinking strip',
      lines: ['Invariant: if the answer exists, it is inside `[lo, hi]`.', 'Pick `mid` and ask the question there.', 'Move `lo` or `hi`: the invariant holds **and** the range shrinks.'],
      frames: [
        { say: 0, note: 'Start: all 8 indices are candidates.', panels: [arr(I8, { label: 'nums, target 38', range: [0, 7], pointers: [ptr(0, 'lo'), ptr(7, 'hi')] }), vars({ lo: 0, hi: 7, size: 8 })] },
        ...I38.flatMap((s, i) => {
          const f = { say: 1, note: `mid = ${s.mid}: ask "is nums[${s.mid}] = ${s.v} the target?"`, panels: exPanels(I8, s, 'nums, target 38') };
          const nx = I38[i + 1];
          return nx ? [f, { say: 2, note: `${exNote(38, s)} Size ${s.hi - s.lo + 1} → ${nx.hi - nx.lo + 1}.`, panels: [exPanels(I8, { ...nx, act: 'empty' })[0], vars({ lo: nx.lo, hi: nx.hi, size: nx.hi - nx.lo + 1 })] }] : [{ ...f, note: exNote(38, s) }];
        }),
      ],
    },
    {
      kind: 'watch',
      title: 'The two ways to break it',
      lines: ['Bug 1: the answer falls **out** of the range.', 'Bug 2: the range **stops shrinking** → infinite loop.'],
      frames: [
        { say: 0, note: 'Target 5, mid = 3 (12). 12 > 5, but a buggy update moves lo = 4.', panels: [arr(I8, { label: 'nums, target 5', range: [4, 7], pointers: [ptr(4, 'lo'), ptr(7, 'hi')], highlights: hl(8, (k) => (k === 1 ? 'bad' : k < 4 ? 'muted' : '')) }), vars({ lo: 4, hi: 7 })] },
        { say: 0, note: 'The 5 at index 1 is outside [4, 7]. It can never be found.', panels: [arr(I8, { label: 'nums, target 5', range: [4, 7], highlights: hl(8, (k) => (k === 1 ? 'bad' : k < 4 ? 'muted' : '')) })] },
        { say: 1, note: 'Target 23, range [4, 5], mid = 4 (16 < 23). A buggy lo = mid keeps lo = 4.', panels: [arr(I8, { label: 'nums, target 23', range: [4, 5], pointers: [ptr(4, 'lo'), ptr(5, 'hi')], highlights: hl(8, (k) => (k === 4 ? 'active' : k < 4 || k > 5 ? 'muted' : '')) }), vars({ lo: 4, hi: 5, mid: 4 })] },
        { say: 1, note: 'Same lo, same hi, same mid again: the loop never ends.', panels: [arr(I8, { label: 'nums, target 23', range: [4, 5], pointers: [ptr(4, 'lo'), ptr(5, 'hi')], highlights: hl(8, (k) => (k === 4 ? 'bad' : k < 4 || k > 5 ? 'muted' : '')) }), vars({ lo: 4, hi: 5, mid: 4 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where is mid?',
      lines: ['Target 16. The first probe moved lo to 4.', '`mid = lo + ((hi − lo) >> 1)`'],
      panels: [arr(I8, { label: 'nums, target 16', range: [4, 7], pointers: [ptr(4, 'lo'), ptr(7, 'hi')], highlights: hl(8, (k) => (k < 4 ? 'muted' : '')) }), vars({ lo: 4, hi: 7 })],
      task: { type: 'cell', question: 'Tap the next `mid`.', answer: I16[1].mid, hints: { 4: 'That is lo. (7 − 4) >> 1 is 1, so mid = 4 + 1.', 6: 'That would round up. `>> 1` rounds down.', 7: 'That is hi.' } },
      solved: `mid = 4 + (3 >> 1) = 5. nums[5] = 23 > 16, so hi = 4 and the next mid finds 16.`,
      then: exFrames(I8, 16, I16.slice(1), () => 1, 'nums, target 16'),
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Read one by one',
      lines: ['Ignore most of the order: read elements **one by one**.', 'Early exit: once `nums[i] > target`, the target cannot come later.', 'Target near the end: still reads **every** element → O(n).'],
      frames: [
        ...S6.map((s) => ({ say: s.r === 'stop' ? 1 : 0, note: s.r === 'stop' ? `nums[${s.i}] = ${A8[s.i]} > 6 → return −1 after ${s.i + 1} reads.` : `nums[${s.i}] = ${A8[s.i]} < 6 → keep going.`, panels: [scanPanels(A8, s, 6), vars({ reads: s.i + 1 })] })),
        { say: 2, note: `Target 15: found at index 7 after ${reads(S15)} reads.`, panels: [scanPanels(A8, S15.at(-1), 15), vars({ reads: reads(S15) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: target 14',
      lines: ['Same loop, same early exit.'],
      panels: [arr(A8, { label: 'nums, target 14' })],
      task: { type: 'number', question: 'How many elements are read before it returns −1?', options: [1, 4, 7, 8], answer: reads(S14), hint: 'The early exit fires at the first value bigger than 14.' },
      solved: `Every value up to 13 is smaller, and 15 is the last element: ${reads(S14)} reads for −1.`,
      then: S14.map((s) => ({ say: 0, note: s.r === 'stop' ? `nums[${s.i}] = 15 > 14 → return −1 after ${s.i + 1} reads.` : `nums[${s.i}] = ${A8[s.i]} < 14.`, panels: [scanPanels(A8, s, 14), vars({ reads: s.i + 1 })] })),
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Closed range: found',
      lines: ['`lo = 0`, `hi = n − 1`: every index from lo to hi, **inclusive**.', 'While `lo <= hi`: `mid = lo + ((hi − lo) >> 1)`.', '`nums[mid] === target` → return mid.', '`nums[mid] < target` → `lo = mid + 1`.', 'Otherwise → `hi = mid − 1`.', 'Loop ends at `lo = hi + 1` → return −1.'],
      frames: [{ say: 0, note: 'lo = 0, hi = 6: all 7 indices.', panels: [arr(O7, { label: 'nums, target 9', range: [0, 6], pointers: [ptr(0, 'lo'), ptr(6, 'hi')] }), vars({ lo: 0, hi: 6 })] }, ...exFrames(O7, 9, O9, optSay, 'nums, target 9')],
    },
    {
      kind: 'watch',
      title: 'Closed range: not found',
      lines: ['`nums[mid] < target` → `lo = mid + 1`.', '`nums[mid] > target` → `hi = mid − 1`.', 'A one-element range (`lo === hi`) is still checked.', 'Empty range `lo = hi + 1` → return −1.'],
      frames: O5.map((s) => ({ say: s.act === 'lo' ? 0 : s.act === 'empty' ? 3 : s.lo === s.hi ? 2 : 1, note: exNote(5, s), panels: exPanels(O7, s, 'nums, target 5') })),
    },
    {
      kind: 'turn',
      title: 'Your turn: one iteration',
      lines: ['One pass of the loop body, closed template.'],
      panels: [arr(O7, { label: 'nums', range: [0, 6], pointers: [ptr(0, 'lo'), ptr(3, 'mid', 'b'), ptr(6, 'hi')], highlights: { 3: 'active' } })],
      task: {
        type: 'order',
        question: 'Put one iteration in order.',
        items: ['check lo <= hi', 'mid = lo + ((hi − lo) >> 1)', 'compare nums[mid] with target', 'move lo or hi past mid'],
        hint: 'You cannot compute mid of an empty range, and you cannot move past mid before comparing it.',
      },
      solved: 'Check the range, pick mid, compare, then exclude mid. Excluding mid is what guarantees progress.',
    },
    {
      kind: 'turn',
      title: 'Your turn: target 11',
      lines: ['Same array, target at the last index.'],
      panels: [arr(O7, { label: 'nums, target 11', range: [0, 6], pointers: [ptr(0, 'lo'), ptr(6, 'hi')] })],
      task: { type: 'number', question: 'How many probes (values of mid) until 11 is found?', options: [2, 3, 4, 7], answer: O11.length, hint: 'Each probe keeps only the part right of mid.' },
      solved: `mid = 3, then 5, then 6: ${O11.length} probes instead of 7 reads.`,
      then: exFrames(O7, 11, O11, () => 0, 'nums, target 11'),
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Template B: first true',
      lines: ['`lo = 0`, `hi = n` (n means "none is true").', '`P(mid)` true → `hi = mid`: mid may be the answer, keep it.', '`P(mid)` false → `lo = mid + 1`: discard mid.', 'Loop ends at `lo === hi`: the first true.'],
      frames: withSeen(TB).map((s) => ({
        say: s.done ? 3 : s.p ? 1 : 2,
        note: bNote(s, `nums[${s.mid}] =`, `${T7[s.mid]} >= 6`),
        panels: bPanels(T7, s, 'nums + "·" at n = 7', [predRow(T7, (i) => T7[i] >= 6, s)]),
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: where do they meet?',
      lines: ['Template B with `P(i) = nums[i] >= 9`.'],
      panels: bPanels(TC, TCR[0], 'nums + "·" at n = 5'),
      task: { type: 'cell', question: 'Tap the index where lo and hi meet.', answer: last(TCR), hints: { 0: 'P(0) is 3 >= 9: false. Not the first true.', 1: 'P(1) is 8 >= 9: false.', 3: 'P(3) is true, but P(2) is true already.', 5: 'n is returned only when no index is true.' } },
      solved: `They meet at ${last(TCR)}: nums[2] = 10 is the first value ≥ 9.`,
      then: withSeen(TCR).map((s) => ({ say: 0, note: bNote(s, `nums[${s.mid}] =`, `${TC[s.mid]} >= 9`), panels: bPanels(TC, s, 'nums + "·" at n = 5', [predRow(TC, (i) => TC[i] >= 9, s)]) })),
    },
    {
      kind: 'watch',
      title: 'Why floor mid never stalls',
      lines: ['Floor `mid` can equal `lo`, never `hi` (while `lo < hi`).', 'So `hi = mid` and `lo = mid + 1` both shrink the range.', 'Keeping mid with `lo = mid`? Round **up**: `lo + ((hi − lo + 1) >> 1)`.'],
      frames: [
        { say: 0, note: 'Template B, lo = 2, hi = 3: one candidate left, floor gives mid = 2 = lo.', panels: [pairPanel(2, 2, 2, 'lo = 2, hi = 3'), vars({ lo: 2, hi: 3, mid: 2 })] },
        { say: 1, note: 'P(2) true → hi = 2: lo === hi, the loop ends.', panels: [arr(SIX, { label: 'hi = mid', pointers: [ptr(2, 'lo = hi')], highlights: hl(6, (k) => (k === 2 ? 'done' : 'muted')) }), vars({ lo: 2, hi: 2 })] },
        { say: 1, note: 'P(2) false → lo = 3: lo === hi, the loop ends.', panels: [arr(SIX, { label: 'lo = mid + 1', pointers: [ptr(3, 'lo = hi')], highlights: hl(6, (k) => (k === 3 ? 'done' : 'muted')) }), vars({ lo: 3, hi: 3 })] },
        { say: 2, note: 'A "last true" search, lo = 2, hi = 3: rounding up gives mid = 2 + (2 >> 1) = 3.', panels: [arr(SIX, { label: 'round up', range: [2, 3], pointers: [ptr(2, 'lo'), ptr(3, 'mid = hi', 'b')], highlights: hl(6, (k) => (k === 3 ? 'active' : k < 2 || k > 3 ? 'muted' : '')) }), vars({ lo: 2, hi: 3, mid: 3 })] },
        { say: 2, note: 'Now lo = mid moves lo to 3, and hi = mid − 1 moves hi to 2. Both shrink.', panels: [arr(SIX, { label: 'round up', range: [2, 3], highlights: hl(6, (k) => (k === 2 || k === 3 ? 'done' : 'muted')) }), vars({ 'lo = mid': '[3, 3]', 'hi = mid − 1': '[2, 2]' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: big numbers',
      lines: ['An answer range, not array indices.', '`>>` converts to a **32-bit signed integer** first.'],
      panels: [vars({ lo: '10^9', hi: '2·10^9', 'lo + hi': '3·10^9' })],
      task: {
        type: 'choose',
        question: 'Which way of computing mid goes wrong here?',
        options: [
          { text: '`(lo + hi) >> 1`', why: '' },
          { text: '`Math.floor((lo + hi) / 2)`', why: 'JS numbers are exact up to 2^53, so lo + hi is fine and floor gives 1.5·10^9.' },
          { text: 'Neither: JS numbers never overflow', why: 'The sum is fine, but `>>` squeezes it into 32 bits first, and 3·10^9 > 2^31 − 1.' },
        ],
        answer: 0,
      },
      solved: `\`(3·10^9) >> 1\` is \`${(3e9) >> 1}\`. Use \`Math.floor((lo + hi) / 2)\` for big ranges.`,
      then: [{ say: 1, note: `(lo + hi) >> 1 = ${(3e9) >> 1}: a negative mid.`, panels: [vars({ '>> 1': (3e9) >> 1, 'Math.floor': Math.floor(3e9 / 2) })] }],
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'lowerBound vs upperBound',
      lines: ['`lowerBound`: first index with `nums[i] >= target`.', '`upperBound`: first index with `nums[i] > target`.', 'Both start at `hi = nums.length` and keep mid with `hi = mid`.'],
      frames: [
        ...LB3.map((s) => ({ say: 0, note: bNote(s, `nums[${s.mid}] =`, `${B6[s.mid]} >= 3`), panels: bPanels(B6, s, 'lowerBound(nums, 3)', [vars({ lo: s.lo, hi: s.hi })]) })),
        ...UB3.map((s) => ({ say: 1, note: bNote(s, `nums[${s.mid}] =`, `${B6[s.mid]} > 3`), panels: bPanels(B6, s, 'upperBound(nums, 3)', [vars({ lo: s.lo, hi: s.hi })]) })),
        { say: 2, note: `The 3s live at [${last(LB3)}, ${last(UB3)}): lowerBound ${last(LB3)}, upperBound ${last(UB3)}.`, panels: [arr(B6, { label: 'nums', range: [last(LB3), last(UB3) - 1], pointers: [ptr(last(LB3), 'lower'), ptr(last(UB3), 'upper', 'b')], highlights: hl(6, (k) => (k >= last(LB3) && k < last(UB3) ? 'done' : '')) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: bigger than all',
      lines: ['`lowerBound` returns `nums.length` if no value is big enough.'],
      panels: bPanels(B6, LB9[0], 'lowerBound(nums, 9)'),
      task: { type: 'number', question: 'What does `lowerBound(nums, 9)` return?', options: [-1, 5, 6, 7], answer: last(LB9), hint: 'Every value is below 9, so lo keeps moving right.' },
      solved: `It returns ${last(LB9)} = nums.length: "none is true". That is also where 9 would be inserted.`,
      then: LB9.map((s) => ({ say: 0, note: bNote(s, `nums[${s.mid}] =`, `${B6[s.mid]} >= 9`), panels: bPanels(B6, s, 'lowerBound(nums, 9)', [vars({ lo: s.lo, hi: s.hi })]) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: default sort',
      lines: ['There is no built-in binary search; you sort, then search.', 'Default `sort()` compares **strings**: `[10, 9, 1].sort()` → `[1, 10, 9]`.'],
      panels: [arr(SORTED_WRONG, { label: '[10, 9, 1].sort()' }), vars({ target: 9 })],
      task: {
        type: 'choose',
        question: '`search([1, 10, 9], 9)` returns…',
        options: [
          { text: '−1, although 9 is in the array', why: '' },
          { text: '2, the index of 9', why: 'mid = 1 sees 10 > 9 and throws away index 2 forever.' },
          { text: 'A TypeError', why: 'Nothing throws. The order is just wrong, so the answer is silently wrong.' },
        ],
        answer: 0,
      },
      solved: 'Sort numbers with `nums.sort((a, b) => a - b)` before searching.',
      then: exFrames(SORTED_WRONG, 9, SW, () => 1, 'nums = [1, 10, 9]'),
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'search([-1, 0, 3, 5, 9, 12], 9)',
      lines: ['Closed range, `lo <= hi`.', '6 elements, 2 comparisons.'],
      frames: D9.map((s, k) => ({ say: s.act === 'found' ? 1 : 0, note: exNote(9, s), panels: [exPanels(D6, s, 'nums, target 9')[0], upto(dryRows(D9, 9), k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: target 2',
      lines: ['Same array, a target that is not there.'],
      panels: [arr(D6, { label: 'nums, target 2', range: [0, 5], pointers: [ptr(0, 'lo'), ptr(5, 'hi')] })],
      task: { type: 'number', question: 'How many probes before it returns −1?', options: [2, 3, 4, 6], answer: D2.length - 1, hint: 'Ranges: [0,5] → [0,1] → [1,1] → empty.' },
      solved: 'Three probes: [0,5] → [0,1] → [1,1] → [2,1] (empty) → −1.',
      then: D2.map((s) => ({ say: 0, note: exNote(2, s), panels: exPanels(D6, s, 'nums, target 2') })),
    },
    {
      kind: 'watch',
      title: 'lowerBound([1, 2, 2, 2, 5], 2)',
      lines: ['`nums[mid] >= 2`? yes → `hi = mid` (mid may be first).', 'no → `lo = mid + 1`.', 'mid = 2 already hit a 2, yet the search keeps going left.'],
      frames: DLB.map((s, k) => ({ say: s.done ? 2 : s.p ? 0 : 1, note: bNote(s, `nums[${s.mid}] =`, `${L5[s.mid]} >= 2`), panels: [bPanels(L5, s, 'nums + "·" at n = 5')[0], upto(bRows(DLB, L5), k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: upperBound',
      lines: ['`upperBound(nums, 2)`: first index with `nums[i] > 2`.'],
      panels: bPanels(L5, DUB[0], 'nums + "·" at n = 5'),
      task: { type: 'cell', question: 'Tap where `upperBound(nums, 2)` ends.', answer: last(DUB), hints: { 1: 'That is lowerBound: the first 2, not the first value > 2.', 3: 'nums[3] = 2 is not > 2.', 5: 'nums[4] = 5 > 2 already.' } },
      solved: `upperBound = ${last(DUB)}, so the count of 2s is ${last(DUB)} − ${last(DLB)} = ${last(DUB) - last(DLB)}.`,
      then: DUB.map((s, k) => ({ say: 0, note: bNote(s, `nums[${s.mid}] =`, `${L5[s.mid]} > 2`), panels: [bPanels(L5, s, 'nums + "·" at n = 5')[0], upto(bRows(DUB, L5), k)] })),
    },
  ],

  'intuition-bounds': [
    {
      kind: 'watch',
      title: 'Two predicates, two boundaries',
      lines: ['Duplicates: "found it" may land on either 8.', '`nums[i] >= 8`: first T = lower bound.', '`nums[i] > 8`: first T = upper bound.', 'first = lower, last = upper − 1, count = upper − lower.'],
      frames: [
        { say: 0, note: 'Two 8s, at indices 3 and 4.', panels: [arr(C6, { label: 'nums', highlights: { 3: 'active', 4: 'active' } })] },
        { say: 1, note: 'First T of nums[i] >= 8 is index 3.', panels: [arr(C6, { label: 'nums' }), arr(C6.map((x) => TF(x >= 8)), { label: 'nums[i] >= 8', pointers: [ptr(3, 'lower')], highlights: hl(6, (k) => (k === 3 ? 'done' : C6[k] >= 8 ? 'window' : 'muted')) })] },
        { say: 2, note: 'First T of nums[i] > 8 is index 5.', panels: [arr(C6, { label: 'nums' }), arr(C6.map((x) => TF(x > 8)), { label: 'nums[i] > 8', pointers: [ptr(5, 'upper', 'b')], highlights: hl(6, (k) => (k === 5 ? 'done' : 'muted')) })] },
        { say: 3, note: 'first 3, last 5 − 1 = 4, count 5 − 3 = 2.', panels: [arr(C6, { label: 'nums', range: [3, 4], pointers: [ptr(3, 'first'), ptr(4, 'last', 'b')], highlights: { 3: 'done', 4: 'done' } }), vars({ first: 3, last: 4, count: 2, insert: 3 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'lowerBound(8) keeps going left',
      lines: ['`nums[mid] >= 8` → `hi = mid`: mid stays a candidate.', 'Stops at the **first** 8, not just any 8.'],
      frames: LB8.map((s) => ({ say: s.done ? 1 : 0, note: bNote(s, `nums[${s.mid}] =`, `${C6[s.mid]} >= 8`), panels: bPanels(C6, s, 'nums + "·" at n = 6', [vars({ lo: s.lo, hi: s.hi })]) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: last 7',
      lines: ['last occurrence = `upperBound − 1`.'],
      panels: [arr(C6, { label: 'nums' })],
      task: { type: 'cell', question: 'Tap the last occurrence of 7.', answer: last(UB7) - 1, hints: { 1: 'That is the first 7 (lowerBound).', 3: 'That is upperBound(7) itself, the first value > 7. Subtract one.' } },
      solved: `upperBound(7) = ${last(UB7)}, so the last 7 is at ${last(UB7) - 1}.`,
      then: UB7.map((s) => ({ say: 0, note: bNote(s, `nums[${s.mid}] =`, `${C6[s.mid]} > 7`), panels: bPanels(C6, s, 'upperBound(nums, 7)') })),
    },
    {
      kind: 'turn',
      title: 'Your turn: insert 9',
      lines: ['insert position = `lowerBound`.'],
      panels: [arr(C6, { label: 'nums' })],
      task: { type: 'number', question: 'At which index would 9 be inserted to keep `nums` sorted?', options: [-1, 4, 5, 6], answer: last(LB9C), hint: 'The first value ≥ 9.' },
      solved: `lowerBound(9) = ${last(LB9C)}: 9 goes right before 10.`,
      then: LB9C.map((s) => ({ say: 0, note: bNote(s, `nums[${s.mid}] =`, `${C6[s.mid]} >= 9`), panels: bPanels(C6, s, 'lowerBound(nums, 9)') })),
    },
  ],

  'optimized-rotated': [
    {
      kind: 'watch',
      title: 'Two sorted runs, one drop',
      lines: ['Rotated: a sorted array cut once and swapped.', 'The drop is in `[lo, mid]` or `[mid, hi]`, not both.', '`nums[lo] <= nums[mid]` → the left half is sorted.'],
      frames: [
        { say: 0, note: '[0,1,2,4,5,6,7] cut and swapped: one drop, 7 → 0.', panels: [arr(R7, { label: 'nums', highlights: { 3: 'bad', 4: 'bad' } })] },
        { say: 1, note: 'mid = 3: the drop (3 → 4) lies in [mid, hi].', panels: [arr(R7, { label: 'nums', pointers: [ptr(0, 'lo'), ptr(3, 'mid', 'b'), ptr(6, 'hi')], highlights: { 3: 'active', 4: 'bad' } })] },
        { say: 2, note: 'nums[0] = 4 <= nums[3] = 7 → [lo, mid] is sorted.', panels: [arr(R7, { label: 'nums', range: [0, 3], pointers: [ptr(0, 'lo'), ptr(3, 'mid', 'b'), ptr(6, 'hi')], highlights: hl(7, (k) => (k <= 3 ? 'done' : '')) })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Search target 5',
      lines: ['Left half sorted: is `nums[lo] <= target < nums[mid]`?', 'Inside → go there. Outside → go to the other half.'],
      frames: [
        { say: 0, note: 'mid = 3 (7) is not 5. 4 <= 7, so the left half is sorted.', panels: [arr(R7, { label: 'nums, target 5', range: [0, 6], pointers: [ptr(0, 'lo'), ptr(3, 'mid', 'b'), ptr(6, 'hi')], highlights: hl(7, (k) => (k === 3 ? 'active' : k < 3 ? 'done' : '')) }), vars({ lo: 0, hi: 6, mid: 3 })] },
        { say: 1, note: '4 <= 5 < 7: inside the sorted half → hi = mid − 1 = 2.', panels: [arr(R7, { label: 'nums, target 5', range: [0, 2], pointers: [ptr(0, 'lo'), ptr(2, 'hi')], highlights: hl(7, (k) => (k > 2 ? 'muted' : '')) }), vars({ lo: 0, hi: 2 })] },
        { say: 1, note: 'mid = 1: nums[1] = 5 → found.', panels: [arr(R7, { label: 'nums, target 5', range: [0, 2], pointers: [ptr(0, 'lo'), ptr(1, 'mid', 'b'), ptr(2, 'hi')], highlights: hl(7, (k) => (k === 1 ? 'done' : k > 2 ? 'muted' : '')) }), vars({ lo: 0, hi: 2, mid: 1 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'findMin: compare with nums[hi]',
      lines: ['`nums[mid] > nums[hi]` → the drop is right of mid: `lo = mid + 1`.', 'Else `mid..hi` is sorted → min at mid or left: `hi = mid`.', 'Predicate `nums[i] <= nums[last]` is F…F, T…T; first T = min.'],
      frames: [
        ...FM.map((s) => ({ say: s.done ? 2 : s.right ? 0 : 1, note: fmNote(R7, s), panels: fmPanels(R7, s) })),
        { say: 2, note: 'nums[i] <= 2: F F F F T T T. First T at 4.', panels: [arr(R7, { label: 'nums' }), arr(R7.map((x) => TF(x <= R7[6])), { label: 'nums[i] <= nums[last]', highlights: hl(7, (k) => (k === 4 ? 'done' : R7[k] <= R7[6] ? 'window' : 'muted')) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which half?',
      lines: ['A different rotation.', 'Compare `nums[lo]` with `nums[mid]`.'],
      panels: [arr(R2, { label: 'nums', pointers: [ptr(0, 'lo'), ptr(3, 'mid', 'b'), ptr(6, 'hi')], highlights: { 0: 'active', 3: 'active' } })],
      task: {
        type: 'choose',
        question: 'lo = 0, mid = 3, hi = 6. Which half is sorted?',
        options: [
          { text: 'The right half [1, 2, 4, 5]', why: '' },
          { text: 'The left half [6, 7, 0, 1]', why: 'nums[lo] = 6 > nums[mid] = 1: the left half holds the drop 7 → 0.' },
          { text: 'Neither', why: 'The drop is in exactly one half; the other half is sorted.' },
        ],
        answer: 0,
      },
      solved: '6 > 1, so the drop is on the left and `[mid, hi]` is sorted.',
      then: [{ say: 1, note: 'nums[0] = 6 > nums[3] = 1 → [mid, hi] is sorted.', panels: [arr(R2, { label: 'nums', range: [3, 6], pointers: [ptr(0, 'lo'), ptr(3, 'mid', 'b'), ptr(6, 'hi')], highlights: hl(7, (k) => (k >= 3 ? 'done' : k === 1 || k === 2 ? 'bad' : '')) })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: findMin',
      lines: ['Same rotation, the findMin loop.'],
      panels: fmPanels(R2, FM2[0]),
      task: { type: 'cell', question: 'Tap where lo and hi meet.', answer: last(FM2), hints: { 0: 'The start of the array is not the minimum after a rotation.', 3: 'nums[3] = 1, but 0 sits to its left.' } },
      solved: `They meet at ${last(FM2)}: nums[${last(FM2)}] = ${R2[last(FM2)]}, right after the drop.`,
      then: FM2.map((s) => ({ say: 0, note: fmNote(R2, s), panels: fmPanels(R2, s) })),
    },
  ],

  'intuition-answer': [
    {
      kind: 'watch',
      title: 'A predicate over speeds',
      lines: ['Piles `[3, 6, 7, 11]`, `h = 8`.', 'At speed `k`: hours = `Σ ceil(pile / k)`.', 'Faster never takes more hours: `hours <= 8` is F…F, T…T.', 'The minimum k is the first T.'],
      frames: [
        { say: 1, note: `k = 1: ${sumStr(1)} = ${HOURS[0]} hours.`, panels: kPanels(HOURS.map((h, i) => (i === 0 ? h : '·')), { label1: 'hours at k = 1…6', label2: 'k = 7…11', p1: { highlights: { 0: 'bad' } } }) },
        { say: 1, note: `k = 4: ${sumStr(4)} = ${HOURS[3]} hours.`, panels: kPanels(HOURS.map((h, i) => (i === 0 || i === 3 ? h : '·')), { label1: 'hours at k = 1…6', label2: 'k = 7…11', p1: { highlights: { 0: 'bad', 3: 'done' } } }) },
        { say: 2, note: 'All speeds: hours only go down as k grows.', panels: kPanels(HOURS, { label1: 'hours at k = 1…6', label2: 'hours at k = 7…11', p1: { highlights: hl(6, (i) => (HOURS[i] <= 8 ? 'done' : 'bad')) }, p2: { highlights: hl(5, () => 'done') } }) },
        { say: 3, note: 'hours <= 8: F F F T T … T. First T at k = 4.', panels: kPanels(HOURS.map((h) => TF(h <= 8)), { label1: 'hours <= 8, k = 1…6', label2: 'k = 7…11', p1: { pointers: [ptr(3, 'first T')], highlights: hl(6, (i) => (i === 3 ? 'active' : HOURS[i] <= 8 ? 'done' : 'muted')) }, p2: { highlights: hl(5, () => 'done') } }) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the recipe',
      lines: ['Five moves turn "find the minimum" into a boundary search.'],
      panels: [vars({ answer: 'speed k', lo: 1, hi: 'max pile', 'feasible(k)': 'hours <= h' })],
      task: { type: 'order', question: 'Put the recipe in order.', items: ['Name the answer', 'Bound it: lo and hi', 'Write feasible(x)', 'Prove monotonicity', 'Run the boundary template'], hint: 'You need the answer before you can bound it, and a feasible() before you can argue about it.' },
      solved: 'Name, bound, check, prove, search. For Koko: speed, [1, max pile], hours ≤ h, faster never takes longer.',
    },
    {
      kind: 'watch',
      title: 'The decision is easier: greedy',
      lines: ['Decision question: can every part sum stay ≤ x?', 'Greedy: fill the current part; start a new one only when the next number overflows.', 'Bigger x never needs more parts.'],
      frames: [
        ...G7.map((s) => ({ say: 1, note: s.fresh ? `${s.v} does not fit → new part. Parts: ${s.parts}.` : `${s.v} fits: part sum ${s.part}.`, panels: gPanels(s, 7) })),
        ...G8.slice(-2).map((s) => ({ say: 2, note: s.fresh ? `x = 8: ${s.v} does not fit → new part. Parts: ${s.parts}.` : `x = 8: ${s.v} fits, part sum ${s.part}. Parts: ${s.parts}.`, panels: gPanels(s, 8) })),
        { say: 0, note: 'Limit 2 parts: x = 7 says no, x = 8 says yes. The boundary is 8.', panels: [table(['x = 7', 'x = 8'], ['parts', '≤ 2?'], [[String(G7.at(-1).parts), 'no'], [String(G8.at(-1).parts), 'yes']], [['bad', 'bad'], ['done', 'done']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: h = 6',
      lines: ['Same piles `[3, 6, 7, 11]`, but only **6** hours.'],
      panels: kPanels(HOURS, { label1: 'hours at k = 1…6', label2: 'hours at k = 7…11' }),
      task: { type: 'number', question: 'What is the minimum speed k now?', options: [4, 5, 6, 7], answer: last(H6), hint: 'Find the first k whose hours are ≤ 6.' },
      solved: `k = 5 needs ${HOURS[4]} hours, k = 6 needs ${HOURS[5]}. The first T moves to k = ${last(H6)}.`,
      then: [{ say: 0, note: `hours <= 6: first T at k = ${last(H6)}.`, panels: kPanels(HOURS.map((h) => TF(h <= 6)), { label1: 'hours <= 6, k = 1…6', label2: 'k = 7…11', p1: { highlights: hl(6, (i) => (i + 1 === last(H6) ? 'active' : HOURS[i] <= 6 ? 'done' : 'muted')) }, p2: { highlights: hl(5, () => 'done') } }) }],
    },
  ],

  'implementation-answer': [
    {
      kind: 'watch',
      title: 'Koko, step by step',
      lines: ['`lo = 1`, `hi = Math.max(...piles)` = 11.', '`mid = Math.floor((lo + hi) / 2)`.', '`hoursAt(mid) <= h` → `hi = mid` (try slower).', 'Else `lo = mid + 1` (must be faster).'],
      frames: KOKO.map((s) => ({
        say: s.done ? 0 : s.p ? 2 : 3,
        note: s.done ? `lo = hi = ${s.lo} → return ${s.lo}.` : `mid = ${s.mid}: ${sumStr(s.mid)} = ${hoursAt(s.mid)} ${s.p ? '≤' : '>'} 8 → ${s.p ? `hi = ${s.mid}` : `lo = ${s.mid + 1}`}.`,
        panels: [...kPanels(KS, { label1: 'k = 1…6', label2: 'k = 7…11', ...kSplit(s.lo, s.hi, s.mid, s.done) }), vars(s.done ? { answer: s.lo } : { lo: s.lo, hi: s.hi, mid: s.mid, hours: hoursAt(s.mid) })],
      })),
    },
    {
      kind: 'watch',
      title: 'Counting pairs with distance ≤ x',
      lines: ['k-th smallest: binary search the value `x`.', 'count(x) on a sorted array: for each `right`, advance `left` while `nums[right] − nums[left] > x`.', 'Then `right − left` pairs end at `right`.'],
      frames: CS3.map((s, i) => ({
        say: i === 0 ? 1 : s.left > (CS3[i - 1]?.left ?? 0) ? 1 : 2,
        note: `right = ${s.right}: left = ${s.left}, +${s.add} pair${s.add === 1 ? '' : 's'}. count(3) = ${s.total}.`,
        panels: [arr(PD, { label: 'nums, x = 3', range: [s.left, s.right], pointers: [ptr(s.left, 'left'), ptr(s.right, 'right', 'b')], highlights: hl(PD.length, (k) => (k < s.left ? 'muted' : k >= s.left && k <= s.right ? 'window' : '')) }), vars({ added: s.add, 'count(3)': s.total })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: k = 2',
      lines: ['count(x) for nums `[1, 3, 6]`, x = 0…5.', 'k-th smallest = first `x` with `count(x) >= k`.'],
      panels: [arr(COUNTS, { label: 'count(x), cell = x' })],
      task: { type: 'cell', question: 'k = 2: tap the answer x.', answer: COUNTS.findIndex((c) => c >= 2), hints: { 2: 'count(2) = 1: only one pair is that close.', 4: 'count(4) ≥ 2, but count(3) already is.' } },
      solved: 'count(3) = 2 is the first count ≥ 2. The distances are 2, 3, 5: the 2nd smallest is 3.',
    },
    {
      kind: 'turn',
      title: 'Your turn: a huge pile list',
      lines: ['`Math.max(...piles)` spreads the array into arguments.'],
      panels: [vars({ piles: '10^6 items', need: 'hi = max' })],
      task: {
        type: 'choose',
        question: 'piles has 10^6 elements. How do you get `hi`?',
        options: [
          { text: 'A loop or `reduce`', why: '' },
          { text: '`Math.max(...piles)`', why: 'Fine for 10^4 elements; at 10^5+ the spread can hit a call-stack limit.' },
          { text: '`piles.sort()` and take the last', why: 'Default sort is lexicographic, so the last element need not be the largest.' },
        ],
        answer: 0,
      },
      solved: 'One pass with a loop or `reduce` has no argument limit.',
    },
  ],

  'optimized-peak-partition': [
    {
      kind: 'watch',
      title: 'Walk uphill',
      lines: ['Outside the array counts as −∞.', '`nums[mid] < nums[mid + 1]`: uphill → a peak exists in `[mid + 1, hi]`.', 'Otherwise: a peak exists in `[lo, mid]`.', 'No sorting needed, only a guarantee about one side.'],
      frames: [{ say: 0, note: 'Unsorted. Any peak will do.', panels: [arr(PK, { label: 'nums', range: [0, 6], pointers: [ptr(0, 'lo'), ptr(6, 'hi')] })] }, ...PKR.map((s) => ({ say: s.done ? 3 : s.up ? 1 : 2, note: pkNote(PK, s), panels: pkPanels(PK, s, 'nums') }))],
    },
    {
      kind: 'turn',
      title: 'Your turn: all downhill',
      lines: ['A strictly falling array.', 'Every mid sees a downhill step.'],
      panels: pkPanels(DESC, DESCR[0], 'nums'),
      task: { type: 'cell', question: 'Tap the peak the search returns.', answer: last(DESCR), hints: { 5: 'Its left neighbour 2 is bigger: not a peak.', 2: 'nums[1] = 5 is bigger.' } },
      solved: 'nums[0] = 6 beats its right neighbour 5, and its left neighbour is −∞: a peak.',
      then: DESCR.map((s) => ({ say: 1, note: pkNote(DESC, s), panels: pkPanels(DESC, s, 'nums') })),
    },
    {
      kind: 'watch',
      title: 'Median: search the cut',
      lines: ['Cut A after `i`, B after `j = half − i`.', 'Valid ⇔ `Aleft <= Bright` and `Bleft <= Aright`.', '`Bleft > Aright` → i too small, move right.', 'Odd total: median = max of the lefts.'],
      frames: [
        { say: 0, note: `A is the shorter array. Total 7 → half = ${HALF}. Try i = 1, j = 3.`, panels: cutPanels(C1) },
        { say: 2, note: `Bleft = ${C1.Bl} > Aright = ${C1.Ar} → i too small, move right.`, panels: cutPanels(C1, 'B') },
        { say: 1, note: `i = 2, j = 2: ${C2.Al} <= ${C2.Br} and ${C2.Bl} <= ${C2.Ar}. Valid.`, panels: cutPanels(C2) },
        { say: 3, note: `max(${C2.Al}, ${C2.Bl}) = ${Math.max(C2.Al, C2.Bl)} is the median.`, panels: [...cutPanels(C2).slice(0, 2), vars({ median: Math.max(C2.Al, C2.Bl) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: i = 3',
      lines: ['Same arrays, half = 4.', 'i = 3 puts all of A on the left, j = 1.'],
      panels: cutPanels(C3),
      task: {
        type: 'choose',
        question: 'Aleft = 8, Bright = 7. What next?',
        options: [
          { text: 'i is too big: move it left', why: '' },
          { text: 'i is too small: move it right', why: 'That is the fix for Bleft > Aright. Here Bleft = 2 ≤ Aright = +∞.' },
          { text: 'The cut is valid', why: 'Aleft = 8 > Bright = 7: a left element is bigger than a right one.' },
        ],
        answer: 0,
      },
      solved: 'Aleft > Bright means too much of A sits on the left. Moving i left leads to i = 2, the valid cut.',
      then: [{ say: 1, note: `Aleft = ${C3.Al} > Bright = ${C3.Br}: i too big.`, panels: cutPanels(C3, 'A') }],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'A stuck loop and a fractional mid',
      lines: ['Mixing templates: `lo <= hi` with `hi = mid` → stuck when lo = hi = mid.', '`(lo + hi) / 2` without floor → `nums[2.5]` is `undefined`.'],
      frames: [
        { say: 0, note: 'Target 1 in [3, 5]: mid = 0, 3 > 1 → hi = mid = 0.', panels: [arr([3, 5], { label: 'nums, target 1', range: [0, 0], pointers: [ptr(0, 'lo = hi = mid')], highlights: { 0: 'active', 1: 'muted' } }), vars({ lo: 0, hi: 0, mid: 0 })] },
        { say: 0, note: 'lo <= hi still true: mid = 0, hi = 0 again. Forever.', panels: [arr([3, 5], { label: 'nums, target 1', range: [0, 0], pointers: [ptr(0, 'lo = hi = mid')], highlights: { 0: 'bad', 1: 'muted' } }), vars({ lo: 0, hi: 0, mid: 0 })] },
        { say: 1, note: 'lo = 0, hi = 5: (0 + 5) / 2 = 2.5, and nums[2.5] is undefined.', panels: [arr([1, 2, 4, 6, 7, 9], { label: 'nums', pointers: [ptr(0, 'lo'), ptr(5, 'hi')], highlights: { 2: 'bad', 3: 'bad' } }), vars({ mid: 2.5, 'nums[mid]': 'undefined' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: wrong initial hi',
      lines: ['Insert position of 9 into `[1, 3, 5, 7]`.', 'Someone starts lowerBound with `hi = n − 1`.'],
      panels: bPanels(M4, WRONG_HI[0], 'hi starts at 3, not 4'),
      task: { type: 'number', question: 'What does it return?', options: [-1, 2, 3, 4], answer: last(WRONG_HI), hint: 'With hi = n − 1, the answer n is not in the range at all.' },
      solved: `It returns ${last(WRONG_HI)}, but 9 belongs at 4, after the last element. "None" (n) must be inside the range.`,
      then: WRONG_HI.map((s) => ({ say: 1, note: bNote(s, `nums[${s.mid}] =`, `${M4[s.mid]} >= 9`), panels: bPanels(M4, s, 'hi starts at 3, not 4') })),
    },
    {
      kind: 'turn',
      title: 'Your turn: monotonic?',
      lines: ['Binary search needs a predicate that never flips back.', 'Otherwise it returns *something*, silently wrong.'],
      panels: [arr([1, 2, 3, 4, 5, 6], { label: 'nums (sorted)' }), arr(['F', 'T', 'F', 'T', 'F', 'T'], { label: 'nums[i] is even' }), arr(['F', 'F', 'F', 'T', 'T', 'T'], { label: 'nums[i] >= 4' })],
      task: {
        type: 'choose',
        question: 'Which predicate can you binary search?',
        options: [
          { text: '`nums[i] >= 4`', why: '' },
          { text: '`nums[i] is even`', why: 'F T F T F T flips back and forth: there is no single boundary.' },
          { text: 'Both: the array is sorted', why: 'Sorted values do not make every question monotonic.' },
        ],
        answer: 0,
      },
      solved: 'State the monotonicity out loud: "once true, true for every bigger index".',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Test tiny cases aloud',
      lines: ['1 element.', '2 elements (the infinite-loop check).', 'Target smaller than all.', 'Target larger than all.'],
      frames: TINY.flatMap((c, ci) => exact(c.a, c.t).map((s) => ({ say: ci, note: `${c.name}: ${exNote(c.t, s)}`, panels: exPanels(c.a, s, `[${c.a.join(', ')}], target ${c.t}`) }))),
    },
    {
      kind: 'turn',
      title: 'Your turn: say the template',
      lines: ['Say which template you use and why.'],
      panels: [arr(['F', 'F', 'T', 'T', 'T'], { label: 'P(i): first index with nums[i] ≥ x' })],
      task: {
        type: 'choose',
        question: 'The task is "first index with nums[i] ≥ x". Which template?',
        options: [
          { text: 'Boundary, half-open: `lo < hi`, `hi = mid`', why: '' },
          { text: 'Closed, exact match: `lo <= hi`, `mid ± 1`', why: 'Exact match stops at any hit and excludes mid; here mid may be the first true and must stay.' },
        ],
        answer: 0,
      },
      solved: 'Exact match → closed. Boundary → half-open. Say it before you code.',
    },
  ],
};
