// Shorts for Binary Search (M9). Format: src/content/shortSchema.js. Facts come only from topics/binary-search/topic.js.
// Every lo / mid / hi below is produced by running the pattern's template on the "e.g." input next to it.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const TF = (b) => (b ? 'T' : 'F');

// ---------- exact match, closed [lo, hi] ----------
function exact(nums, t) {
  const out = [];
  let lo = 0,
    hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    const v = nums[mid];
    const act = v === t ? 'found' : v < t ? 'lo' : 'hi';
    out.push({ lo, hi, mid, v, act });
    if (act === 'found') return out;
    if (act === 'lo') lo = mid + 1;
    else hi = mid - 1;
  }
  out.push({ lo, hi, act: 'empty' });
  return out;
}
const EX = [3, 8, 15, 21, 27, 34, 40, 46, 52];
const EX34 = exact(EX, 34); // mid 4 → 6 → 5 found
const EX30 = exact(EX, 30); // mid 4 → 6 → 5 → empty
const EXT = EX30[2]; // the turn: lo = hi = mid = 5, 34 > 30
const exNote = (t, s) =>
  s.act === 'found'
    ? `mid = ${s.mid}: nums[${s.mid}] = ${s.v} = ${t} → return ${s.mid}. ${EX34.length} probes instead of ${s.mid + 1} reads.`
    : s.act === 'lo'
      ? `mid = ${s.mid}: ${s.v} < ${t} → mid and everything left are too small: lo = ${s.mid + 1}.`
      : `mid = ${s.mid}: ${s.v} > ${t} → mid and everything right are too big: hi = ${s.mid - 1}.`;
const exPanel = (t, s) =>
  arr(EX, {
    label: `nums, target ${t}`,
    range: [s.lo, s.hi],
    pointers: [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi', 'c')],
    highlights: hl(EX.length, (k) => (k === s.mid ? (s.act === 'found' ? 'done' : 'active') : k < s.lo || k > s.hi ? 'muted' : '')),
  });

// ---------- lower / upper bound, half-open [lo, hi) ----------
function bound(P, lo, hi) {
  const out = [];
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    const p = P(mid);
    out.push({ lo, hi, mid, p });
    if (p) hi = mid;
    else lo = mid + 1;
  }
  out.push({ lo, hi, done: true });
  return out;
}
const BD = [2, 4, 4, 4, 4, 7, 9];
const LB = bound((i) => BD[i] >= 4, 0, BD.length); // → 1
const UB = bound((i) => BD[i] > 4, 0, BD.length); // → 5
const LBI = LB.at(-1).lo;
const UBI = UB.at(-1).lo;
const BDX = exact(BD, 4)[0]; // the exact search lands on mid = 3
const LB10 = bound((i) => BD[i] >= 10, 0, BD.length).at(-1).lo; // → 7 = n
const bVals = [...BD, '·'];
const bPanel = (s, label) =>
  arr(bVals, {
    label,
    ...(s.lo < s.hi ? { range: [s.lo, s.hi - 1] } : {}),
    pointers: s.done ? [ptr(s.lo, 'lo = hi')] : [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi', 'c')].filter((p) => p.index >= 0),
    highlights: hl(bVals.length, (k) => (s.done ? (k === s.lo ? 'done' : '') : k === s.mid ? 'active' : k < s.lo || k >= s.hi ? 'muted' : '')),
  });
const predRow = (P, label) => arr(BD.map((_, i) => TF(P(i))), { label, highlights: hl(BD.length, (i) => (P(i) ? 'done' : 'muted')) });
const lbFrame = (s) => ({
  say: s.done ? 2 : s.p ? 0 : 1,
  note: s.done
    ? `lo = hi = ${s.lo} → return ${s.lo}: the first 4, even though mid = 3 hit a 4 on the first probe.`
    : `mid = ${s.mid}: nums[${s.mid}] = ${BD[s.mid]} >= 4? ${s.p ? `yes → mid may be the first: hi = ${s.mid}` : `no → the answer is right of it: lo = ${s.mid + 1}`}.`,
  panels: [bPanel(s, 'nums + "·" at n = 7, target 4'), vars(s.done ? { result: s.lo } : { lo: s.lo, hi: s.hi, mid: s.mid })],
});

// ---------- rotated sorted array ----------
const RT = [8, 9, 1, 2, 3, 5, 6];
function rotated(nums, t) {
  const out = [];
  let lo = 0,
    hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === t) {
      out.push({ lo, hi, mid, found: true });
      return out;
    }
    const left = nums[lo] <= nums[mid];
    const inside = left ? nums[lo] <= t && t < nums[mid] : nums[mid] < t && t <= nums[hi];
    const goLeft = left ? inside : !inside;
    out.push({ lo, hi, mid, left, inside, goLeft });
    if (goLeft) hi = mid - 1;
    else lo = mid + 1;
  }
  out.push({ lo, hi, empty: true });
  return out;
}
const RT9 = rotated(RT, 9); // mid 3: right half sorted, 9 not in (2, 6] → hi = 2; mid 1 → found
const RT1 = rotated(RT, 1); // mid 3 → hi = 2; mid 1: left half sorted, 1 not in [8, 9) → lo = 2; mid 2 → found
const RTT = RT1[1];
const rPanel = (t, s) =>
  arr(RT, {
    label: `nums (rotated), target ${t}`,
    range: [s.lo, s.hi],
    pointers: [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi', 'c')],
    highlights: hl(RT.length, (k) =>
      k === s.mid ? (s.found ? 'done' : 'active') : k < s.lo || k > s.hi ? 'muted' : s.found ? '' : (s.left ? k < s.mid : k > s.mid) ? 'window' : '',
    ),
  });
const rNote = (t, s) => {
  if (s.found) return `mid = ${s.mid}: nums[${s.mid}] = ${t} → return ${s.mid}. ${RT9.length} probes.`;
  const [a, b] = s.left ? [RT[s.lo], RT[s.mid]] : [RT[s.mid], RT[s.hi]];
  const half = s.left ? `left [${s.lo}..${s.mid}] sorted, ${t} ${s.inside ? 'in' : 'not in'} [${a}, ${b})` : `right [${s.mid}..${s.hi}] sorted, ${t} ${s.inside ? 'in' : 'not in'} (${a}, ${b}]`;
  return `nums[lo] = ${RT[s.lo]} ${s.left ? '<=' : '>'} nums[mid] = ${RT[s.mid]}: ${half} → ${s.goLeft ? `hi = ${s.mid - 1}` : `lo = ${s.mid + 1}`}.`;
};

// ---------- binary search on the answer: e.g. piles [2, 9, 5, 8], h = 6 ----------
const PL = [2, 9, 5, 8];
const H = 6;
const hoursAt = (k) => PL.reduce((s, p) => s + Math.ceil(p / k), 0);
const KMAX = Math.max(...PL); // 9
const KS = Array.from({ length: KMAX }, (_, i) => i + 1);
const HRS = KS.map(hoursAt); // 24 13 9 8 6 6 6 5 4
const ANS = [];
{
  let lo = 1,
    hi = KMAX;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = hoursAt(mid) <= H;
    ANS.push({ lo, hi, mid, ok, hours: hoursAt(mid) });
    if (ok) hi = mid;
    else lo = mid + 1;
  }
  ANS.push({ lo, hi, done: true });
}
const KANS = ANS.at(-1).lo; // 5
const kPanel = (s, known = new Set()) =>
  arr(KS, {
    label: 'speed k',
    showIndices: false,
    range: [s.lo - 1, s.hi - 1],
    pointers: s.done ? [ptr(s.lo - 1, 'lo = hi')] : [ptr(s.lo - 1, 'lo'), ptr(s.mid - 1, 'mid', 'b'), ptr(s.hi - 1, 'hi', 'c')].filter((p) => p.index >= 0),
    highlights: hl(KMAX, (i) => (s.done ? (i === s.lo - 1 ? 'done' : 'muted') : i === s.mid - 1 ? 'active' : i < s.lo - 1 || i > s.hi - 1 ? 'muted' : known.has(i) ? 'visited' : '')),
  });
const ansFrames = ANS.map((s, n) => ({
  say: s.done ? 1 : s.ok ? 0 : 1,
  note: s.done
    ? `lo = hi = ${s.lo} → minimum speed ${s.lo}. ${ANS.length - 1} checks of hours, each one pass over the piles.`
    : `mid = ${s.mid}: hours = ${s.hours} ${s.ok ? `<= ${H} → fast enough, maybe slower works: hi = ${s.mid}` : `> ${H} → too slow, so all slower are too: lo = ${s.mid + 1}`}.`,
  panels: [kPanel(s, new Set(ANS.slice(0, n).map((x) => x.mid - 1))), vars(s.done ? { answer: s.lo } : { lo: s.lo, hi: s.hi, mid: s.mid, hours: s.hours })],
}));

// ---------- peak ----------
const PKA = [1, 5, 2, 4, 6, 3, 0];
function peak(a) {
  const out = [];
  let lo = 0,
    hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    const up = a[mid] < a[mid + 1];
    out.push({ lo, hi, mid, up });
    if (up) lo = mid + 1;
    else hi = mid;
  }
  out.push({ lo, hi, done: true });
  return out;
}
const PKR = peak(PKA); // mid 3 up → lo 4; mid 5 down → hi 5; mid 4 down → hi 4; peak 4
const pkPanel = (a, s, label) =>
  arr(a, {
    label,
    range: [s.lo, s.hi],
    pointers: s.done ? [ptr(s.lo, 'peak')] : [ptr(s.lo, 'lo'), ptr(s.mid, 'mid', 'b'), ptr(s.hi, 'hi', 'c')],
    highlights: hl(a.length, (k) => (s.done ? (k === s.lo ? 'done' : 'muted') : k === s.mid ? 'active' : k === s.mid + 1 ? 'window' : k < s.lo || k > s.hi ? 'muted' : '')),
  });
const pkNote = (a, s) =>
  s.done
    ? `lo = hi = ${s.lo}: nums[${s.lo}] = ${a[s.lo]} is a peak. The peak at index 1 was dropped, and that is fine.`
    : `nums[${s.mid}] = ${a[s.mid]} ${s.up ? '<' : '>'} nums[${s.mid + 1}] = ${a[s.mid + 1]} → ${s.up ? `uphill: lo = ${s.mid + 1}` : `peak at or left of mid: hi = ${s.mid}`}.`;
const PKT = [2, 8, 7, 5, 3, 4, 1];
const PKTS = peak(PKT)[0]; // lo 0, hi 6, mid 3: 5 > 3 → hi = 3

// ---------- partition of two sorted arrays ----------
const PA = [2, 5, 9]; // the shorter array
const PB = [1, 4, 6, 8, 11];
const HALF = (PA.length + PB.length + 1) >> 1; // half of the total, rounded up: 4
const MERGED = [...PA, ...PB].sort((a, b) => a - b);
const g = (a, k) => (k < 0 ? -Infinity : k >= a.length ? Infinity : a[k]);
const show = (v) => (v === -Infinity ? '−∞' : v === Infinity ? '+∞' : v);
const cut = (i) => {
  const j = HALF - i;
  const c = { i, j, Al: g(PA, i - 1), Ar: g(PA, i), Bl: g(PB, j - 1), Br: g(PB, j) };
  c.move = c.Al > c.Br ? 'left' : c.Bl > c.Ar ? 'right' : null;
  return c;
};
// binary search i over [0, m]: too far right → hi = i − 1, too far left → lo = i + 1
const PRUN = [];
{
  let lo = 0,
    hi = PA.length;
  while (lo <= hi) {
    const c = { ...cut(lo + ((hi - lo) >> 1)), lo, hi };
    PRUN.push(c);
    if (!c.move) break;
    if (c.move === 'left') hi = c.i - 1;
    else lo = c.i + 1;
  }
}
const PV = PRUN.at(-1); // the valid cut
const MED = (Math.max(PV.Al, PV.Bl) + Math.min(PV.Ar, PV.Br)) / 2;
const cutPanels = (c, bad) => [
  arr(PA, { label: `A (shorter), i = ${c.i}`, pointers: c.i < PA.length ? [ptr(c.i, 'i')] : [], highlights: hl(PA.length, (k) => (k < c.i ? (bad === 'A' && k === c.i - 1 ? 'bad' : 'window') : bad === 'B' && k === c.i ? 'bad' : '')) }),
  arr(PB, { label: `B, j = half − i = ${c.j}`, pointers: c.j < PB.length ? [ptr(c.j, 'j', 'b')] : [], highlights: hl(PB.length, (k) => (k < c.j ? (bad === 'B' && k === c.j - 1 ? 'bad' : 'window') : bad === 'A' && k === c.j ? 'bad' : '')) }),
  vars({ Aleft: show(c.Al), Aright: show(c.Ar), Bleft: show(c.Bl), Bright: show(c.Br) }),
];
const bad = (c) => (c.move === 'left' ? 'A' : c.move === 'right' ? 'B' : null);
const cutNote = (c) =>
  c.move === 'left'
    ? `i = ${c.i}, j = ${c.j}: Aleft ${show(c.Al)} > Bright ${show(c.Br)} → i too big: hi = ${c.i - 1}.`
    : c.move === 'right'
      ? `i = ${c.i}, j = ${c.j}: Bleft ${c.Bl} > Aright ${c.Ar} → i too small: lo = ${c.i + 1}.`
      : `i = ${c.i}, j = ${c.j}: ${c.Al} <= ${c.Br} and ${c.Bl} <= ${c.Ar}. Valid: every left element ≤ every right one.`;
const PT = cut(PA.length); // the turn: all of A on the left

export default [
  {
    id: 'binary-search-exact',
    title: 'Find a value in a sorted array in log n looks',
    steps: [
      {
        kind: 'watch',
        title: 'Reading every element ignores the order',
        lines: ['Find the index of `target` in a **sorted** array, or −1.', 'A scan reads one element per step: **O(n)**.', 'Sorted means one comparison proves a whole half useless.'],
        frames: [
          { say: 1, note: 'e.g. target 34: a scan reads 3, 8, 15, 21, 27 before it reaches 34 at index 5. Six reads.', panels: [arr(EX, { label: 'nums, target 34', pointers: [ptr(5, 'i')], highlights: hl(EX.length, (k) => (k < 5 ? 'visited' : k === 5 ? 'done' : '')) })] },
          { say: 2, note: 'nums[4] = 27 < 34. Sorted, so nums[0..4] are all ≤ 27: none can be 34. Proved, not read.', panels: [arr(EX, { label: 'nums, target 34', pointers: [ptr(4, 'mid', 'b')], highlights: hl(EX.length, (k) => (k < 4 ? 'muted' : k === 4 ? 'active' : '')) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Closed range [lo, hi]: check mid, step past it',
        lines: ['`lo = 0`, `hi = n − 1`; loop while `lo <= hi`.', '`mid = lo + ((hi − lo) >> 1)`; equal → return mid.', '`nums[mid] < target` → `lo = mid + 1`; else `hi = mid − 1`.'],
        frames: [
          { say: 0, note: `lo = 0, hi = ${EX.length - 1}: all ${EX.length} indices are candidates.`, panels: [arr(EX, { label: 'nums, target 34', range: [0, EX.length - 1], pointers: [ptr(0, 'lo'), ptr(EX.length - 1, 'hi', 'c')] }), vars({ lo: 0, hi: EX.length - 1 })] },
          ...EX34.map((s) => ({ say: s.act === 'found' ? 1 : 2, note: exNote(34, s), panels: [exPanel(34, s), vars({ lo: s.lo, hi: s.hi, mid: s.mid, 'nums[mid]': s.v })] })),
        ],
      },
      {
        kind: 'watch',
        title: 'Not there: the range runs empty',
        lines: ['e.g. target 30, which is not in the array.', 'Same moves; a one-element range is still checked.', 'Clues: **"sorted array"**, **"return the index of target, or -1"**, **"must run in O(log n)"**.'],
        frames: [
          ...EX30.slice(0, 2).map((s) => ({ say: 0, note: exNote(30, s), panels: [exPanel(30, s), vars({ lo: s.lo, hi: s.hi, mid: s.mid, 'nums[mid]': s.v })] })),
          { say: 2, note: 'Each probe halves what is left: n → n/2 → n/4 → … → 1 after about log₂ n steps.', panels: [vars({ 'linear scan': 'O(n)', 'binary search': 'O(log n)', space: 'O(1)' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the last candidate',
        lines: [`Target 30. Now lo = hi = ${EXT.lo}: one candidate left.`, `mid = ${EXT.mid}, nums[mid] = ${EXT.v} > 30.`],
        panels: [exPanel(30, EXT), vars({ lo: EXT.lo, hi: EXT.hi, mid: EXT.mid, 'nums[mid]': EXT.v })],
        task: {
          type: 'choose',
          question: 'What does the closed template do now?',
          options: [
            { text: `hi = ${EXT.mid - 1}: lo > hi, the range is empty → return −1` },
            { text: `hi = mid = ${EXT.mid}`, why: 'lo, hi and mid stay the same: with lo <= hi and hi = mid the loop never ends. mid was checked, so exclude it.' },
            { text: `lo = mid = ${EXT.mid}`, why: 'Same problem: lo = mid changes nothing when lo === mid, an infinite loop. And 34 > 30 means move hi, not lo.' },
            { text: 'Nothing: it stopped before this check, since lo === hi', why: 'That is the lo < hi bug: the last candidate is never examined. With target 34 it would miss the answer.' },
          ],
          answer: 0,
        },
        solved: 'Closed range: `lo <= hi`, and mid is **excluded** with `mid ± 1`. That is what makes the range shrink every step.',
      },
    ],
  },

  {
    id: 'binary-search-boundary',
    title: 'First position, last position, insert position',
    steps: [
      {
        kind: 'watch',
        title: '"Found it" is not "found the first"',
        lines: ['With duplicates, exact match may land on **any** copy.', 'Ask a yes/no question instead: `nums[i] >= target` reads F…F, T…T.'],
        frames: [
          { say: 0, note: `e.g. target 4. The exact search probes mid = ${BDX.mid} first, sees a 4 and stops. The first 4 is at index ${LBI}.`, panels: [arr(BD, { label: 'nums, target 4', pointers: [ptr(BDX.mid, 'mid', 'b')], highlights: { [BDX.mid]: 'active', [LBI]: 'bad' } })] },
          { say: 1, note: `The predicate flips once. The first T is the answer, at index ${LBI}.`, panels: [arr(BD, { label: 'nums' }), predRow((i) => BD[i] >= 4, 'nums[i] >= 4')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Half-open [lo, hi): keep mid when it is true',
        lines: ['`nums[mid] >= target` → `hi = mid`: mid may be the first true, keep it.', 'Else `lo = mid + 1`: mid is false, the answer is right of it.', '`hi = n` at the start, loop while `lo < hi`, return `lo`.'],
        frames: [
          { say: 2, note: `lo = 0, hi = ${BD.length} = n: the "·" slot means "no element is >= target".`, panels: [bPanel({ lo: 0, hi: BD.length, mid: -1 }, 'nums + "·" at n = 7, target 4'), vars({ lo: 0, hi: BD.length })] },
          ...LB.map(lbFrame),
        ],
      },
      {
        kind: 'watch',
        title: 'Upper bound gives the rest',
        lines: ['upperBound: the same loop with `nums[mid] > target`.', 'Last occurrence = upperBound − 1; count = upperBound − lowerBound.', 'Clues: **"first position"**, **"last position"**, **"insert position"**, **"count occurrences in sorted array"**.'],
        frames: [
          { say: 0, note: `upperBound(4) runs ${UB.length - 1} probes and returns ${UBI}: the first value > 4.`, panels: [arr(bVals, { label: 'nums + "·"', pointers: [ptr(LBI, 'lower'), ptr(UBI, 'upper', 'b')], highlights: hl(bVals.length, (k) => (k >= LBI && k < UBI ? 'window' : '')) }), predRow((i) => BD[i] > 4, 'nums[i] > 4')] },
          { say: 1, note: `Last 4 at ${UBI} − 1 = ${UBI - 1}; count of 4s = ${UBI} − ${LBI} = ${UBI - LBI}. Two log n searches.`, panels: [vars({ first: LBI, last: UBI - 1, count: UBI - LBI })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: larger than everything',
        lines: ['Same nums. Where would **10** be inserted?', 'lowerBound(nums, 10): `nums[i] >= 10` is F for every index.'],
        panels: [bPanel({ lo: 0, hi: BD.length, mid: -1 }, 'nums + "·" at n = 7, target 10'), predRow((i) => BD[i] >= 10, 'nums[i] >= 10')],
        task: {
          type: 'choose',
          question: 'What does lowerBound(nums, 10) return?',
          options: [
            { text: '−1: no element is ≥ 10', why: 'lowerBound returns a position, not "not found". Checking nums[lo] === target is a separate step.' },
            { text: `6, the last index`, why: 'That is what hi = n − 1 would force: the search could never answer "after the last element".' },
            { text: `${LB10} = n: insert after the last element` },
            { text: '0: the predicate is never true', why: 'Every probe is false, so lo = mid + 1 keeps moving right until lo meets hi = n.' },
          ],
          answer: 2,
        },
        solved: 'Start with **hi = n**: "none is true" is a legal answer, and lo stops there.',
      },
    ],
  },

  {
    id: 'binary-search-rotated',
    title: 'Search a sorted array that was rotated',
    steps: [
      {
        kind: 'watch',
        title: 'Two sorted runs and one drop',
        lines: ['Sorted, then rotated at an **unknown pivot**: two sorted runs.', 'The plain rule "smaller than target → go right" is no longer safe.'],
        frames: [
          { say: 0, note: 'e.g. [1, 2, 3, 5, 6, 8, 9] rotated: [8, 9 | 1, 2, 3, 5, 6]. The drop is 9 → 1.', panels: [arr(RT, { label: 'nums (rotated)', highlights: { 1: 'bad', 2: 'bad' } })] },
          { say: 1, note: 'Target 9, mid = 3 (2). The plain rule says 2 < 9 → lo = 4, and throws away the 9 at index 1.', panels: [arr(RT, { label: 'nums, target 9', range: [4, 6], pointers: [ptr(3, 'mid', 'b')], highlights: hl(RT.length, (k) => (k === 1 ? 'bad' : k === 3 ? 'active' : k < 4 ? 'muted' : '')) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'One half is always sorted',
        lines: ['`nums[lo] <= nums[mid]` → left half `[lo, mid]` is sorted; otherwise the right half is.', 'Range-check the target on the **sorted** half only; go there if it fits, else the other half.'],
        frames: [
          { say: 0, note: `lo = 0, hi = ${RT.length - 1}. The drop sits in one half, never both.`, panels: [arr(RT, { label: 'nums (rotated), target 9', range: [0, RT.length - 1], pointers: [ptr(0, 'lo'), ptr(RT.length - 1, 'hi', 'c')] }), vars({ lo: 0, hi: RT.length - 1 })] },
          ...RT9.map((s) => ({ say: s.found ? 1 : s.left ? 0 : 1, note: rNote(9, s), panels: [rPanel(9, s), vars({ lo: s.lo, hi: s.hi, mid: s.mid, sorted: s.found ? '—' : s.left ? 'left' : 'right' })] })),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"rotated at an unknown pivot"**, **"sorted in ascending order, then rotated"**, **"find the minimum" in O(log n)**.'],
        frames: [{ say: 0, note: 'Distinct values: still O(log n). Many duplicates can hide which half is sorted, down to O(n).', panels: [vars({ 'distinct values': 'O(log n)', 'many duplicates': 'worst case O(n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: target 1',
        lines: [`Target 1. The first probe (mid = 3) set hi = 2.`, `Now lo = ${RTT.lo}, hi = ${RTT.hi}, mid = ${RTT.mid}: nums[lo] = ${RT[RTT.lo]}, nums[mid] = ${RT[RTT.mid]}.`],
        panels: [arr(RT, { label: 'nums (rotated), target 1', range: [RTT.lo, RTT.hi], pointers: [ptr(RTT.lo, 'lo'), ptr(RTT.mid, 'mid', 'b'), ptr(RTT.hi, 'hi', 'c')], highlights: hl(RT.length, (k) => (k === RTT.mid ? 'active' : k > RTT.hi ? 'muted' : '')) })],
        task: {
          type: 'choose',
          question: 'Where does the search go next?',
          options: [
            { text: `Left [8, 9] is sorted and 1 is not in [8, 9) → lo = ${RTT.mid + 1}` },
            { text: `1 < 9, so go left → hi = ${RTT.mid - 1}`, why: 'That is the plain sorted-array rule. Here the small values sit right of the big ones.' },
            { text: 'The right half is sorted → range-check it', why: `nums[lo] = 8 <= nums[mid] = 9 says the left half is the sorted one; the range check belongs there.` },
            { text: 'Rotation broke the order → scan linearly', why: 'One half is always sorted, and that is enough to discard half each step.' },
          ],
          answer: 0,
        },
        solved: `Find the sorted half, range-check only that half. Next mid = ${RTT.mid + 1} finds the 1.`,
      },
    ],
  },

  {
    id: 'binary-search-on-answer',
    title: 'Search the answer when you can only check it',
    steps: [
      {
        kind: 'watch',
        title: 'Nothing sorted, but the answer is a number',
        lines: ['Koko eats bananas at speed `k`: `Σ ceil(pile / k)` hours. Find the **minimum k** with hours ≤ h.', 'Faster never takes more hours, so "can finish?" reads F…F, T…T.'],
        frames: [
          { say: 0, note: `e.g. piles = [${PL.join(', ')}], h = ${H}. k is somewhere in [1, max pile] = [1, ${KMAX}].`, panels: [arr(PL, { label: `piles, h = ${H}` }), arr(KS, { label: 'speed k', showIndices: false })] },
          { say: 1, note: `Hours fall as k grows: ${HRS.join(', ')}. The first T is the answer.`, panels: [arr(KS, { label: 'speed k', showIndices: false }), arr(HRS, { label: 'hours at k', showIndices: false }), arr(HRS.map((x) => TF(x <= H)), { label: `hours <= ${H}`, showIndices: false, highlights: hl(KMAX, (i) => (HRS[i] <= H ? 'done' : 'muted')) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Lower bound over the speeds',
        lines: ['`feasible(mid)` → `hi = mid`: mid works, maybe something smaller does too.', 'Else `lo = mid + 1`: mid fails, so everything below fails too.'],
        frames: [{ say: 0, note: `lo = 1, hi = ${KMAX}. Invariant: the answer is in [lo, hi], and feasible(hi) is true.`, panels: [kPanel({ lo: 1, hi: KMAX, mid: 0 }), vars({ lo: 1, hi: KMAX })] }, ...ansFrames],
      },
      {
        kind: 'watch',
        title: 'Hear it, then recipe',
        lines: ['Clues: **"minimum eating speed"**, **"minimum capacity so that … within D days"**, **"minimize the largest sum"**.', 'Recipe: name the answer, bound it, write feasible(x), prove it is monotonic.'],
        frames: [{ say: 1, note: 'Each check is an O(n) pass, log₂ R checks: O(n log R) instead of trying every value.', panels: [vars({ range: `[1, ${KMAX}]`, 'feasible(k)': `hours <= ${H}`, total: 'O(n log R)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: mid works',
        lines: [`lo = 1, hi = ${KMAX}, mid = ${ANS[0].mid}.`, `hoursAt(${ANS[0].mid}) = ${ANS[0].hours} <= ${H}: speed ${ANS[0].mid} is fast enough.`],
        panels: [kPanel(ANS[0]), vars({ lo: ANS[0].lo, hi: ANS[0].hi, mid: ANS[0].mid, hours: ANS[0].hours })],
        task: {
          type: 'choose',
          question: 'What is the next update?',
          options: [
            { text: `hi = mid = ${ANS[0].mid}` },
            { text: `hi = mid − 1 = ${ANS[0].mid - 1}`, why: `mid may be the minimum itself. Here it is: speed ${KANS} would be thrown away.` },
            { text: `lo = mid + 1 = ${ANS[0].mid + 1}`, why: 'Predicate direction reversed: that keeps the faster speeds, which all work, and skips the smaller ones.' },
            { text: `Return ${ANS[0].mid}`, why: 'Feasible is not minimal: a slower speed may also finish in time.' },
          ],
          answer: 0,
        },
        solved: `**Feasible → hi = mid, infeasible → lo = mid + 1.** The search ends at speed ${KANS}.`,
      },
    ],
  },

  {
    id: 'binary-search-peak',
    title: 'Find a peak in an unsorted array',
    steps: [
      {
        kind: 'watch',
        title: 'Any peak, no order needed',
        lines: ['A peak is bigger than its neighbours; `nums[-1] = nums[n] = −∞`.', 'Return **any** peak. The array is not sorted.'],
        frames: [
          { say: 0, note: 'e.g. nums = [1, 5, 2, 4, 6, 3, 0]. Peaks: 5 at index 1 and 6 at index 4.', panels: [arr(PKA, { label: 'nums', highlights: { 1: 'done', 4: 'done' } })] },
          { say: 1, note: 'Unsorted, so nums[mid] vs a target says nothing. But the slope at mid does.', panels: [arr(PKA, { label: 'nums', pointers: [ptr(3, 'mid', 'b')], highlights: { 3: 'active', 4: 'window' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Walk uphill',
        lines: ['`nums[mid] < nums[mid + 1]`: uphill to the right, a peak is in `[mid + 1, hi]` → `lo = mid + 1`.', 'Else mid is a peak or downhill → `hi = mid`.', '`lo < hi` keeps `mid + 1` inside the array.'],
        frames: [
          { say: 2, note: `lo = 0, hi = ${PKA.length - 1}. Invariant: a peak exists in [lo, hi].`, panels: [arr(PKA, { label: 'nums', range: [0, PKA.length - 1], pointers: [ptr(0, 'lo'), ptr(PKA.length - 1, 'hi', 'c')] })] },
          ...PKR.map((s) => ({ say: s.done ? 2 : s.up ? 0 : 1, note: pkNote(PKA, s), panels: [pkPanel(PKA, s, 'nums')] })),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"find a peak element"**, **"nums[-1] = nums[n] = -∞"**, **"return any of the peaks"**, **"mountain array"**.'],
        frames: [{ say: 0, note: 'Not for the global maximum (that needs O(n)), and plateaus of equal neighbours break the argument.', panels: [vars({ 'any peak': 'O(log n)', 'global max': 'O(n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: downhill at mid',
        lines: [`e.g. nums = [${PKT.join(', ')}], lo = ${PKTS.lo}, hi = ${PKTS.hi}, mid = ${PKTS.mid}.`, `nums[${PKTS.mid}] = ${PKT[PKTS.mid]} > nums[${PKTS.mid + 1}] = ${PKT[PKTS.mid + 1]}.`],
        panels: [pkPanel(PKT, PKTS, 'nums')],
        task: {
          type: 'choose',
          question: 'Which range does the search keep?',
          options: [
            { text: `[${PKTS.lo}, ${PKTS.mid}]: hi = mid` },
            { text: `[${PKTS.lo}, ${PKTS.mid - 1}]: hi = mid − 1`, why: 'Downhill to the right means mid itself may be the peak, so it must stay in the range.' },
            { text: `[${PKTS.mid + 1}, ${PKTS.hi}]: lo = mid + 1`, why: 'Going right is going downhill: a peak there is not guaranteed by this comparison.' },
            { text: 'Neither: the array is unsorted, so scan', why: 'The slope at mid proves a peak is at or left of mid, sorted or not.' },
          ],
          answer: 0,
        },
        solved: 'Compare **nums[mid]** with **nums[mid + 1]** and keep the uphill side: uphill → lo = mid + 1, otherwise hi = mid.',
      },
    ],
  },

  {
    id: 'binary-search-partition',
    title: 'Median of two sorted arrays without merging',
    steps: [
      {
        kind: 'watch',
        title: 'Merging works, but costs O(m + n)',
        lines: ['The median splits the merged array into two equal halves.', 'We only need **where** that cut falls, not the merged array.'],
        frames: [
          { say: 0, note: `e.g. A = [${PA.join(', ')}], B = [${PB.join(', ')}]. Merged: ${MERGED.length} values, a pass over all of them.`, panels: [arr(PA, { label: 'A' }), arr(PB, { label: 'B' }), arr(MERGED, { label: 'merged', highlights: hl(MERGED.length, (k) => (k < HALF ? 'window' : '')) })] },
          { say: 1, note: `Left half = ${HALF} values. Choosing i of them from A forces j = ${HALF} − i from B.`, panels: [vars({ 'm + n': PA.length + PB.length, half: HALF, j: 'half − i' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Check the four elements next to the cuts',
        lines: ['Valid when `A[i−1] <= B[j]` and `B[j−1] <= A[i]`; ±∞ outside the arrays.', '`Aleft > Bright` → i too big, move left. `Bleft > Aright` → i too small, move right.'],
        frames: [
          { say: 0, note: `Binary search i over the shorter array: lo = 0, hi = ${PA.length}.`, panels: [arr(PA, { label: 'A (shorter)', range: [0, PA.length - 1] }), arr(PB, { label: 'B' }), vars({ lo: 0, hi: PA.length })] },
          ...PRUN.map((c) => ({ say: c.move ? 1 : 0, note: cutNote(c), panels: cutPanels(c, bad(c)) })),
          { say: 0, note: `Even total: median = (max(${PV.Al}, ${PV.Bl}) + min(${PV.Ar}, ${PV.Br})) / 2 = ${MED}.`, panels: [...cutPanels(PV, null).slice(0, 2), vars({ 'max(lefts)': Math.max(PV.Al, PV.Bl), 'min(rights)': Math.min(PV.Ar, PV.Br), median: MED })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"two sorted arrays"**, **"median"**, **"O(log (m+n))"**.', 'Search the **shorter** array: j stays a real cut, and it costs O(log min(m, n)).'],
        frames: [{ say: 1, note: 'If O(m + n) is acceptable, a two-pointer merge is much simpler.', panels: [vars({ partition: 'O(log min(m, n))', merge: 'O(m + n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: all of A on the left',
        lines: [`Try i = ${PT.i}, so j = ${PT.j}.`, `Aleft = ${show(PT.Al)}, Aright = ${show(PT.Ar)}, Bleft = ${show(PT.Bl)}, Bright = ${show(PT.Br)}.`],
        panels: cutPanels(PT, null),
        task: {
          type: 'choose',
          question: 'What does the check say about this cut?',
          options: [
            { text: `Aleft ${PT.Al} > Bright ${PT.Br}: i is too big → move i left` },
            { text: 'Bleft > Aright: i is too small → move i right', why: `Bleft ${PT.Bl} <= Aright +∞: that side of the check holds.` },
            { text: 'Valid: stop here', why: `${PT.Al} sits on the left but is bigger than ${PT.Br} on the right, so this is not a median cut.` },
            { text: 'Aright is +∞, so the cut is out of range', why: '+∞ is the sentinel past the end of A; i = m is a legal cut.' },
          ],
          answer: 0,
        },
        solved: 'A too-big left neighbour in **A** moves i left; a too-big one in **B** moves i right. Use ±∞ past the ends.',
      },
    ],
  },
];
