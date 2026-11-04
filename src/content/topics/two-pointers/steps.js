// Step lessons for Two Pointers (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Pointer positions are produced by running each algorithm on its example input below.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const code = (text) => vars({ code: text });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const lr = (l, r) => [ptr(l, 'l'), ptr(r, 'r', 'b')];

// ---------- sorted pair sum (opposite ends) ----------
function pairRun(a, t) {
  const out = [];
  let l = 0,
    r = a.length - 1;
  while (l < r) {
    const s = a[l] + a[r];
    if (s === t) {
      out.push({ l, r, s, move: 'found' });
      return out;
    }
    out.push({ l, r, s, move: s < t ? 'l++' : 'r--' });
    s < t ? l++ : r--;
  }
  out.push({ l, r, move: 'meet' });
  return out;
}
const pairNote = (a, t, st) =>
  st.move === 'found' ? `${a[st.l]} + ${a[st.r]} = ${t}: found.` : st.move === 'meet' ? 'l = r: the pointers met. No pair exists.' : `${a[st.l]} + ${a[st.r]} = ${st.s} ${st.s < t ? '<' : '>'} ${t} → ${st.move}.`;
// cells outside [l, r] are discarded
const pairHl = (n, st) => hl(n, (k) => (k < st.l || k > st.r ? 'muted' : k === st.l || k === st.r ? (st.move === 'found' ? 'done' : 'active') : ''));

const SIX = [1, 2, 4, 7, 11, 15];
const GIFT = pairRun(SIX, 13); // what: gift card 13
const WHY = pairRun(SIX, 9); // why: pair grid
const INTU = pairRun(SIX, 15); // intuition (the lesson's visual input)
const MEET_A = [1, 3, 5, 9];
const MEET = pairRun(MEET_A, 11);

// pair grid: cell (i, j) is a[i] + a[j] for i < j
const PAIR_GRID = SIX.map((x, i) => SIX.map((y, j) => (j > i ? x + y : '·')));
const pairGridStates = (st) =>
  SIX.map((_, i) => SIX.map((_, j) => (j <= i ? '' : i === st.l && j === st.r ? (st.move === 'found' ? 'done' : 'active') : i < st.l || j > st.r ? 'muted' : '')));
const pairsLeft = (st) => ((st.r - st.l + 1) * (st.r - st.l)) / 2;

// ---------- brute force ----------
const BRUTE = [];
outer: for (let i = 0; i < SIX.length; i++)
  for (let j = i + 1; j < SIX.length; j++) {
    BRUTE.push({ i, j, s: SIX[i] + SIX[j] });
    if (SIX[i] + SIX[j] === 15) break outer;
  }

// ---------- palindrome ----------
function palRun(s) {
  const out = [];
  let l = 0,
    r = s.length - 1;
  while (l < r) {
    const ok = s[l] === s[r];
    out.push({ l, r, ok });
    if (!ok) return out;
    l++;
    r--;
  }
  out.push({ l, r, done: true });
  return out;
}
const KAYAK = palRun('kayak');
const BAD = 'abcxba';
const BAD_RUN = palRun(BAD);

// ---------- boats ----------
const BOATS = [1, 2, 2, 3];

// ---------- read / write ----------
const DUP = [0, 0, 1, 1, 1, 2, 3, 3];
const DEDUP = [];
{
  const b = DUP.slice();
  let w = 1;
  for (let r = 1; r < b.length; r++) {
    const v = b[r],
      last = b[w - 1],
      keep = v !== last;
    if (keep) b[w++] = v;
    DEDUP.push({ a: b.slice(), r, w, v, last, keep });
  }
}
const dedupFrame = (st) => ({
  say: st.keep ? 2 : 1,
  note: st.keep ? `read = ${st.r}: ${st.v} ≠ last kept ${st.last} → copy to nums[${st.w - 1}], write = ${st.w}.` : `read = ${st.r}: ${st.v} = last kept ${st.last} → skip.`,
  panels: [
    arr(st.a, {
      label: 'nums',
      pointers: [ptr(st.w, 'write'), ptr(st.r, 'read', 'b')],
      highlights: hl(8, (k) => (st.keep && k === st.w - 1 ? 'active' : k < st.w ? 'done' : k === st.r ? 'muted' : k < st.r ? 'visited' : '')),
    }),
    vars({ write: st.w }),
  ],
});
const DEDUP_TURN = 3; // index in DEDUP of read = 4; the turn asks about read = 5

const ZEROS = [0, 1, 0, 3, 12];
const ZRUN = [];
{
  const b = ZEROS.slice();
  let w = 0;
  for (let r = 0; r < b.length; r++) {
    const v = b[r],
      keep = v !== 0,
      at = w;
    if (keep) {
      [b[w], b[r]] = [b[r], b[w]];
      w++;
    }
    ZRUN.push({ a: b.slice(), r, w, v, keep, at });
  }
}

// ---------- merge ----------
const MA = [1, 4, 7];
const MB = [2, 3, 9];
const MERGE = [];
{
  let i = 0,
    j = 0;
  const out = [];
  while (i < MA.length || j < MB.length) {
    const fromA = j >= MB.length || (i < MA.length && MA[i] <= MB[j]);
    const v = fromA ? MA[i] : MB[j];
    const before = { i, j };
    fromA ? i++ : j++;
    out.push(v);
    MERGE.push({ ...before, fromA, v, out: out.slice(), ni: i, nj: j });
  }
}
const pad = (xs, n) => [...xs, ...Array(n - xs.length).fill('·')];

function mergeBack(n1, m, n2) {
  const a = n1.slice(),
    out = [];
  let i = m - 1,
    j = n2.length - 1,
    k = m + n2.length - 1;
  out.push({ a: a.slice(), i, j, k });
  while (j >= 0) {
    let v, from;
    if (i >= 0 && a[i] > n2[j]) {
      v = a[i];
      from = 'i';
      a[k--] = a[i--];
    } else {
      v = n2[j];
      from = 'j';
      a[k--] = n2[j--];
    }
    out.push({ a: a.slice(), i, j, k, v, from, at: k + 1 });
  }
  return out;
}
const N1 = [1, 3, 5, 0, 0, 0];
const N2 = [2, 4, 6];
const BACK = mergeBack(N1, 3, N2);
const backFrame = (st, n2, say, note) => ({
  say,
  note,
  panels: [
    arr(st.a, {
      label: 'nums1',
      pointers: [...(st.i >= 0 ? [ptr(st.i, 'i')] : []), ...(st.k >= 0 ? [ptr(st.k, 'k', 'b')] : [])],
      highlights: hl(st.a.length, (k) => (k === st.at ? 'active' : k > st.k ? 'done' : '')),
    }),
    arr(n2, { label: 'nums2', pointers: st.j >= 0 ? [ptr(st.j, 'j')] : [], highlights: hl(n2.length, (k) => (k > st.j ? 'muted' : '')) }),
    vars({ i: st.i, j: st.j, k: st.k }),
  ],
});
const backNote = (st) => `${st.from === 'i' ? 'nums1[i]' : 'nums2[j]'} = ${st.v} is the larger → write at k = ${st.at}, ${st.from}--, k--.`;
const BACK_TURN = 3; // BACK[3]: i = 1 (3), j = 0 (2), k = 2
const END_RUN = mergeBack([1, 2, 8, 0, 0], 3, [5, 9]);
const END = END_RUN[END_RUN.length - 1];

// ---------- 3Sum (as the k-sum section describes it) ----------
function ksumRun(a) {
  const ev = [],
    res = [];
  for (let i = 0; i < a.length - 2; i++) {
    let l = i + 1,
      r = a.length - 1;
    while (l < r) {
      const s = a[i] + a[l] + a[r];
      if (s === 0) {
        res.push([a[i], a[l], a[r]]);
        ev.push({ i, l, r, s, act: 'found', res: res.slice() });
        l++;
        while (l < r && a[l] === a[l - 1]) l++;
      } else {
        ev.push({ i, l, r, s, act: s < 0 ? 'l++' : 'r--', res: res.slice() });
        s < 0 ? l++ : r--;
      }
    }
  }
  return ev;
}
const K_RAW = [1, -1, 3, 0, -2, 1];
const K = [...K_RAW].sort((a, b) => a - b); // [-2, -1, 0, 1, 1, 3]
const KEV = ksumRun(K);
const ksPanels = (a, e) => [
  arr(a, {
    label: 'nums (sorted)',
    pointers: [ptr(e.i, 'i', 'b'), ...lr(e.l, e.r).map((p) => ({ ...p, color: 'a' }))],
    highlights: hl(a.length, (k) => (k === e.i ? 'window' : k === e.l || k === e.r ? (e.act === 'found' ? 'done' : 'active') : k < e.i ? 'visited' : '')),
  }),
  vars({ 'pair target −nums[i]': -a[e.i], sum: e.s, found: e.res.map((t) => `[${t.join(', ')}]`).join(' ') || '—' }),
];
const ksNote = (a, e) => `i = ${e.i}, l = ${e.l}, r = ${e.r}: ${a[e.i]} + ${a[e.l]} + ${a[e.r]} = ${e.s}${e.act === 'found' ? ' → record it, move l past copies.' : e.s < 0 ? ' < 0 → l++.' : ' > 0 → r--.'}`;
const K2 = [-2, 0, 0, 2, 2];
const K2EV = ksumRun(K2);

// ---------- 3Sum (implementation section: break + l++, r-- + skip loops) ----------
function implRun(a) {
  const ev = [],
    res = [];
  for (let i = 0; i < a.length - 2; i++) {
    if (a[i] > 0) {
      ev.push({ i, act: 'break', res: res.slice() });
      break;
    }
    if (i > 0 && a[i] === a[i - 1]) continue;
    let l = i + 1,
      r = a.length - 1;
    while (l < r) {
      const s = a[i] + a[l] + a[r];
      if (s < 0) {
        ev.push({ i, l, r, s, act: 'l++', res: res.slice() });
        l++;
      } else if (s > 0) {
        ev.push({ i, l, r, s, act: 'r--', res: res.slice() });
        r--;
      } else {
        res.push([a[i], a[l], a[r]]);
        ev.push({ i, l, r, s, act: 'found', res: res.slice() });
        l++;
        r--;
        while (l < r && a[l] === a[l - 1]) l++;
        while (l < r && a[r] === a[r + 1]) r--;
      }
    }
  }
  return ev;
}
const I_RAW = [1, -2, 2, 0, 1];
const I_SORTED = [...I_RAW].sort((a, b) => a - b); // [-2, 0, 1, 1, 2]
const IEV = implRun(I_SORTED);
const IBREAK = IEV.find((e) => e.act === 'break');

// ---------- Dutch national flag ----------
function dutchRun(a0) {
  const a = a0.slice(),
    out = [];
  let low = 0,
    mid = 0,
    high = a.length - 1;
  while (mid <= high) {
    const v = a[mid],
      before = { low, mid, high };
    if (v === 0) {
      [a[low], a[mid]] = [a[mid], a[low]];
      low++;
      mid++;
    } else if (v === 1) mid++;
    else {
      [a[mid], a[high]] = [a[high], a[mid]];
      high--;
    }
    out.push({ v, before, a: a.slice(), low, mid, high });
  }
  return out;
}
const dutchHl = (n, low, mid, high) => hl(n, (k) => (k < low ? 'done' : k < mid ? 'window' : k > high ? 'visited' : k === mid ? 'active' : ''));
const dutchPtrs = (n, low, mid, high) => [...(low < n ? [ptr(low, 'low')] : []), ...(mid < n ? [ptr(mid, 'mid', 'b')] : []), ...(high >= 0 ? [ptr(high, 'high')] : [])];
const dutchPanels = (a, low, mid, high) => [arr(a, { label: 'nums', pointers: dutchPtrs(a.length, low, mid, high), highlights: dutchHl(a.length, low, mid, high) }), vars({ low, mid, high })];
const FLAG = [2, 0, 2, 1, 1, 0];
const FRUN = dutchRun(FLAG);
const dutchNote = (st) =>
  st.v === 0
    ? `nums[mid] = 0 → swap with nums[low], low++, mid++.`
    : st.v === 1
      ? `nums[mid] = 1 → already in place, mid++.`
      : `nums[mid] = 2 → swap with nums[high], high--. mid stays.`;
const SMALL = [1, 2, 0];
const SRUN = dutchRun(SMALL); // [1: mid++], [2: swap high], [0: swap low]

// ---------- partitioning: evens before odds ----------
const PART = [3, 8, 5, 2, 6];
const LOMUTO = [];
{
  const a = PART.slice();
  let b = 0,
    swaps = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i],
      match = v % 2 === 0;
    if (match) {
      [a[b], a[i]] = [a[i], a[b]];
      b++;
      swaps++;
    }
    LOMUTO.push({ a: a.slice(), i, b, v, match, swaps });
  }
}
function hoareRun(a0) {
  const a = a0.slice(),
    out = [];
  let l = 0,
    r = a.length - 1,
    swaps = 0;
  while (l < r) {
    const before = { l, r };
    let act;
    if (a[l] % 2 === 0) {
      act = 'l';
      l++;
    } else if (a[r] % 2 === 1) {
      act = 'r';
      r--;
    } else {
      [a[l], a[r]] = [a[r], a[l]];
      act = 'swap';
      swaps++;
      l++;
      r--;
    }
    out.push({ before, act, a: a.slice(), l, r, swaps, lv: a0[before.l], rv: a0[before.r] });
  }
  return out;
}
const HOARE = hoareRun(PART);
const H2_IN = [7, 4, 1, 6, 9, 2];
const H2 = hoareRun(H2_IN);
const H2_TURN = H2.findIndex((s) => s.before.l === 2 && s.act === 'r'); // l stuck on 1, r about to skip 9

// ---------- container ----------
function containerRun(h) {
  const out = [];
  let l = 0,
    r = h.length - 1,
    best = 0;
  while (l < r) {
    const area = Math.min(h[l], h[r]) * (r - l);
    best = Math.max(best, area);
    const move = h[l] < h[r] ? 'l++' : 'r--';
    out.push({ l, r, area, best, move, min: Math.min(h[l], h[r]) });
    h[l] < h[r] ? l++ : r--;
  }
  return out;
}
const CH = [2, 4, 3, 5, 1, 4];
const CRUN = containerRun(CH);

// ---------- trapping rain water ----------
const TH = [2, 0, 3, 1, 0, 4, 1, 2];
const TRUN = [];
{
  let l = 0,
    r = TH.length - 1,
    lm = 0,
    rm = 0,
    water = 0;
  const per = Array(TH.length).fill('·');
  while (l < r) {
    lm = Math.max(lm, TH[l]);
    rm = Math.max(rm, TH[r]);
    const left = lm < rm;
    const at = left ? l : r;
    const add = left ? lm - TH[l] : rm - TH[r];
    water += add;
    per[at] = add;
    TRUN.push({ l, r, lm, rm, left, at, add, water, per: per.slice() });
    left ? l++ : r--;
  }
}

// ---------- dry run: container on the lesson's 9 lines ----------
const DH = [1, 8, 6, 2, 5, 4, 8, 3, 7];
const DRUN = containerRun(DH);
// 9 bars do not fit one phone row: indexes 0–4 and 5–8
const halvesOf = (l, r, hi = {}) =>
  [
    [0, 5],
    [5, 9],
  ].map(([s, e], p) =>
    arr(DH.slice(s, e), {
      label: p ? 'height[5..8]' : 'height[0..4]',
      indexBase: s,
      pointers: [...(l >= s && l < e ? [ptr(l - s, 'l')] : []), ...(r >= s && r < e ? [ptr(r - s, 'r', 'b')] : [])],
      highlights: hl(e - s, (k) => hi[k + s] || (k + s < l || k + s > r ? 'muted' : '')),
    }),
  );
const dryFrame = (st, k) => ({
  say: k === 0 ? 0 : 1,
  note: `l = ${st.l}, r = ${st.r}: ${st.min} × ${st.r - st.l} = ${st.area}, best ${st.best}. ${DH[st.l] < DH[st.r] ? 'h[l] smaller → l++' : DH[st.l] === DH[st.r] ? 'equal → either; r--' : 'h[r] smaller → r--'}.`,
  panels: [...halvesOf(st.l, st.r, { [st.l]: 'active', [st.r]: 'active' }), vars({ area: st.area, best: st.best })],
});

// ---------- template ----------
const TPL_A = [1, 3, 5, '·', '·', '·', '·'];

export default {
  what: [
    {
      kind: 'watch',
      title: 'Two shapes of two pointers',
      lines: [
        'Two index variables move through the array by a rule, instead of two nested loops trying every pair.',
        '**Opposite ends:** one pointer at each end, walking towards each other until they meet.',
        '**Same direction:** both start on the left; `read` visits every element, `write` marks where the next kept one goes.',
      ],
      frames: [
        { say: 0, note: 'Two integers, l and r. That is all the extra memory.', panels: [arr(SIX, { label: 'sorted', pointers: lr(0, 5) })] },
        { say: 1, note: 'l starts at the left end, r at the right end.', panels: [arr(SIX, { label: 'sorted', pointers: lr(0, 5), highlights: { 0: 'active', 5: 'active' } })] },
        { say: 1, note: 'Each step moves one of them inwards…', panels: [arr(SIX, { label: 'sorted', pointers: lr(1, 4), highlights: { 0: 'muted', 1: 'active', 4: 'active', 5: 'muted' } })] },
        { say: 1, note: '…until they meet. Then the walk is over.', panels: [arr(SIX, { label: 'sorted', pointers: lr(2, 2), highlights: { 0: 'muted', 1: 'muted', 2: 'active', 3: 'muted', 4: 'muted', 5: 'muted' } })] },
        { say: 2, note: 'Same direction: write and read both start on the left.', panels: [arr(ZEROS, { label: 'nums', pointers: [ptr(0, 'write'), ptr(0, 'read', 'b')] })] },
        { say: 2, note: 'read runs ahead over every element; write only moves when something is kept.', panels: [arr(ZEROS, { label: 'nums', pointers: [ptr(1, 'write'), ptr(3, 'read', 'b')], highlights: { 0: 'visited', 1: 'visited', 2: 'visited', 3: 'active' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'The gift-card shoppers',
      lines: [
        'One shopper starts at the cheapest shelf, one at the most expensive. The card is worth 13.',
        'Total too high → the expensive-end shopper steps down. Too low → the cheap-end shopper steps up.',
        'They never go back: each step rules out an item for good.',
      ],
      frames: [
        { say: 0, note: 'Cheapest 1, most expensive 15.', panels: [arr(SIX, { label: 'prices', pointers: lr(0, 5) }), vars({ card: 13 })] },
        ...GIFT.map((st) => ({
          say: st.move === 'found' ? 2 : 1,
          note: pairNote(SIX, 13, st),
          panels: [arr(SIX, { label: 'prices', pointers: lr(st.l, st.r), highlights: pairHl(6, st) }), vars({ card: 13, total: st.s })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: what is a pointer?',
      lines: ['The word **pointer** comes from other languages.', 'In this topic it has a narrower meaning.'],
      panels: [arr(SIX, { label: 'arr', pointers: lr(1, 4) }), vars({ l: 1, r: 4 })],
      task: {
        type: 'choose',
        question: 'What do `l` and `r` hold here?',
        options: [
          { text: 'An integer index into the array', why: '' },
          { text: 'A memory address', why: 'Here a pointer is just an index, not a memory pointer.' },
          { text: 'A copy of the element', why: 'They store where to look (1 and 4), not the values 2 and 11.' },
        ],
        answer: 0,
      },
      solved: 'A pointer is **just an integer index**: `arr[l]` reads the element.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the search space',
      lines: ['The **search space** is every candidate still possible.', 'For pairs: all `(i, j)` with `left ≤ i < j ≤ right`.'],
      panels: [arr(SIX, { label: 'arr', pointers: [ptr(1, 'left'), ptr(4, 'right', 'b')], highlights: { 0: 'muted', 5: 'muted' } })],
      task: { type: 'number', question: 'left = 1, right = 4. How many indexes can still be part of a pair?', options: [2, 4, 6], answer: 4, hint: 'Count the indexes from left to right, both ends included.' },
      solved: 'Indexes 1, 2, 3 and 4. Indexes 0 and 5 are gone for good.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'One comparison deletes a whole row or column',
      lines: [
        'n elements have about **n²/2 pairs**. The nested loop checks every one: **O(n²)**.',
        'Sorted: if `a[l] + a[r]` is too small, row `l` is useless (`l++`). Too big: column `r` is useless (`r--`).',
        'Each step moves one pointer, never back: at most **n** steps, **O(n)**.',
      ],
      frames: [
        { say: 0, note: '6 sorted numbers, target 9. Row i, column j holds a[i] + a[j]: 15 pairs.', panels: [grid(PAIR_GRID, pairGridStates({ l: 0, r: 5, move: '' }).map((row) => row.map(() => '')), 'pair sums (row i, column j)'), vars({ target: 9, 'pairs left': 15 })] },
        ...WHY.map((st) => ({
          say: st.move === 'found' ? 2 : 1,
          note:
            st.move === 'found'
              ? `${SIX[st.l]} + ${SIX[st.r]} = 9: found after ${WHY.length} looks.`
              : `${SIX[st.l]} + ${SIX[st.r]} = ${st.s} ${st.s < 9 ? '< 9: the whole row of ' + SIX[st.l] + ' is too small → l++' : '> 9: the whole column of ' + SIX[st.r] + ' is too big → r--'}.`,
          panels: [grid(PAIR_GRID, pairGridStates(st), 'pair sums (row i, column j)'), vars({ target: 9, 'pairs left': pairsLeft(st) })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many steps at most?',
      lines: ['For n = 100,000 the nested loop does about 5 billion checks.', 'Two pointers: each step moves one pointer, and pointers never go back.'],
      panels: [vars({ n: '100,000', 'nested loop': '≈ 5,000,000,000 checks' })],
      task: { type: 'number', question: 'At most how many steps does the two-pointer loop take?', options: [100000, 50000, 5000000000], answer: 100000, hint: 'Each step moves one pointer one place; together they cover the array once.' },
      solved: 'At most **n = 100,000** steps instead of about 5 billion.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Situation → pointer shape',
      lines: ['Each situation has its own shape.', '**Not** two pointers: unsorted + original indices (hash map), or a contiguous range defined by a condition (**sliding window**).'],
      frames: [
        ['sorted, pair / triplet sum', 'opposite ends (+ outer loop)'],
        ['symmetry', 'opposite ends'],
        ['greedy pairing after sorting', 'opposite ends'],
        ['remove / keep in place', 'read / write'],
        ['two sorted → one sorted', 'one pointer per input'],
        ['three groups, one pass', 'three pointers'],
        ['min of two sides', 'move the smaller side'],
      ]
        .map((_, k, all) => ({
          say: 0,
          note: `${all[k][0]} → ${all[k][1]}.`,
          panels: [table(all.slice(0, k + 1).map((r) => r[0]), ['shape'], all.slice(0, k + 1).map((r) => [r[1]]), all.slice(0, k + 1).map((_, i) => [i === k ? 'active' : 'done']))],
        }))
        .concat([
          {
            say: 1,
            note: 'And the two places it is the wrong tool.',
            panels: [table(['unsorted, need original indices', 'contiguous range by a condition'], ['use instead'], [['hash map'], ['sliding window']], [['bad'], ['bad']])],
          },
        ]),
    },
    {
      kind: 'turn',
      title: 'Your turn: range or pair?',
      lines: ['Two pointers find pairs, compact arrays, merge, group.', 'A contiguous range defined by a condition has its own technique.'],
      panels: [code('"Return the longest contiguous subarray whose sum is at most k."')],
      task: {
        type: 'choose',
        question: 'Which technique fits this statement?',
        options: [
          { text: 'Opposite-ends two pointers', why: 'The answer is a contiguous range defined by a condition, not a pair.' },
          { text: 'Sliding window', why: '' },
          { text: 'Three pointers', why: 'There are no three groups to sort in one pass.' },
        ],
        answer: 1,
      },
      solved: 'A range defined by a condition → **sliding window**, the next topic (a same-direction two-pointer technique).',
    },
    {
      kind: 'turn',
      title: 'Your turn: lightest with heaviest',
      lines: ['Boats to Save People: two people per boat, under a weight limit.'],
      panels: [arr(BOATS, { label: 'weights, sorted', pointers: lr(0, 3) })],
      task: {
        type: 'choose',
        question: 'Which shape is this?',
        options: [
          { text: 'Opposite ends: greedy pairing after sorting', why: '' },
          { text: 'Read / write', why: 'Nothing is removed or compacted in place.' },
          { text: 'One pointer per input', why: 'There is only one input array.' },
        ],
        answer: 0,
      },
      solved: 'Sort, then pair from both ends: **opposite ends**.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Spot the clues',
      lines: ['Scan the statement for the clue phrases.', 'Several clues in one statement → think **Two Pointers**.'],
      frames: [
        { say: 0, note: 'The statement.', panels: [code('"nums is sorted. Remove the duplicates in place and return the new length k."')] },
        ...['sorted array', 'in place, O(1) extra space', 'return the new length k'].map((c, k, all) => ({
          say: 0,
          note: `Clue: "${c}".`,
          panels: [code('"nums is sorted. Remove the duplicates in place and return the new length k."'), table(all.slice(0, k + 1), ['clue found'], all.slice(0, k + 1).map(() => ['yes']), all.slice(0, k + 1).map((_, i) => [i === k ? 'active' : 'done']))],
        })),
        { say: 1, note: 'Three clues → Two Pointers.', panels: [table(['sorted array', 'in place, O(1) extra space', 'return the new length k'], ['clue found'], [['yes'], ['yes'], ['yes']], [['done'], ['done'], ['done']]), vars({ think: 'Two Pointers' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Can one comparison rule out an end?',
      lines: ['Q1: is there order I can exploit?', 'Q2: if `a[l] + a[r]` is too small, is `a[l]` useless for **every** remaining partner?', 'Q3: must I work in place?'],
      frames: [
        { say: 0, note: 'Sorted, target 12. Q1: yes.', panels: [arr([1, 3, 5, 8], { label: 'a (sorted)' }), vars({ target: 12 })] },
        { say: 1, note: '1 + 8 = 9 < 12.', panels: [arr([1, 3, 5, 8], { label: 'a (sorted)', pointers: lr(0, 3), highlights: { 0: 'active', 3: 'active' } }), vars({ target: 12, sum: 9 })] },
        { say: 1, note: '8 is the biggest partner 1 has. 1 + 3 = 4, 1 + 5 = 6, 1 + 8 = 9: all too small.', panels: [arr([1, 3, 5, 8], { label: 'a (sorted)', pointers: [ptr(0, 'l')], highlights: { 0: 'bad', 1: 'visited', 2: 'visited', 3: 'visited' } }), vars({ target: 12, 'best sum with 1': 9 })] },
        { say: 1, note: 'Q2: yes. 1 is useless → l++.', panels: [arr([1, 3, 5, 8], { label: 'a (sorted)', pointers: lr(1, 3), highlights: { 0: 'muted' } })] },
        { say: 2, note: 'Q3: here we only read, so the pair-sum shape is enough.', panels: [table(['Q1 order?', 'Q2 rule out an end?', 'Q3 in place?'], ['answer'], [['yes, sorted'], ['yes'], ['no']], [['done'], ['done'], ['muted']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which question fires?',
      lines: ['Q1 order · Q2 rule out an end · Q3 in place.', 'Q3 → a read/write or swap-based pointer scheme is likely intended.'],
      panels: [code('"Remove every copy of val from nums in place, using O(1) extra space. Return how many are left."')],
      task: {
        type: 'choose',
        question: 'Which of the three questions points to the technique here?',
        options: [
          { text: 'Q1: is there order I can exploit?', why: 'The statement never says nums is sorted.' },
          { text: 'Q2: can one comparison rule out an end?', why: 'There is no pair and no end to compare.' },
          { text: 'Q3: must I work in place?', why: '' },
        ],
        answer: 2,
      },
      solved: '"in place, O(1) extra space" → a **read/write** scheme.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'The heartbeat, on a sorted pair sum',
      lines: ['The pointers mark what is **still possible**: pairs inside `[l, r]`.', 'Look at the elements under the pointers.', 'Prove one of them can never be part of a better answer.', 'Move that pointer. **Never backwards.**'],
      frames: [
        { say: 0, note: 'Target 15. All of [0, 5] is still possible.', panels: [arr(SIX, { label: 'nums', pointers: lr(0, 5), range: [0, 5] }), vars({ target: 15 })] },
        { say: 1, note: `Look: ${SIX[0]} + ${SIX[5]} = ${INTU[0].s}.`, panels: [arr(SIX, { label: 'nums', pointers: lr(0, 5), range: [0, 5], highlights: { 0: 'active', 5: 'active' } }), vars({ target: 15, sum: INTU[0].s })] },
        { say: 3, note: '16 > 15 → r--. 15 leaves the search space for good.', panels: [arr(SIX, { label: 'nums', pointers: lr(0, 4), range: [0, 4], highlights: { 5: 'muted' } }), vars({ target: 15 })] },
        { say: 1, note: `Look: ${SIX[0]} + ${SIX[4]} = ${INTU[1].s}.`, panels: [arr(SIX, { label: 'nums', pointers: lr(0, 4), range: [0, 4], highlights: { 0: 'active', 4: 'active', 5: 'muted' } }), vars({ target: 15, sum: INTU[1].s })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which pointer, and where?',
      lines: ['Too small → the left value is useless for every remaining partner.'],
      panels: [arr(SIX, { label: 'nums', pointers: lr(0, 4), range: [0, 4], highlights: { 0: 'active', 4: 'active', 5: 'muted' } }), vars({ target: 15, sum: 12 })],
      task: {
        type: 'cell',
        question: '1 + 11 = 12 is too small. Tap where the moving pointer lands.',
        answer: 1,
        hints: { 3: 'r only moves when the sum is too big.', 0: 'A pointer must move every step.', 5: 'Never backwards: 15 is already out.' },
      },
      solved: 'l++ to index 1. 1 is useless with every partner up to 11.',
      then: INTU.slice(2).map((st) => ({
        note: pairNote(SIX, 15, st),
        panels: [arr(SIX, { label: 'nums', pointers: lr(st.l, st.r), range: [st.l, st.r], highlights: pairHl(6, st) }), vars({ target: 15, sum: st.s })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: one beat',
      lines: ['Every two-pointer algorithm repeats the same beat.'],
      panels: [arr(SIX, { label: 'nums', pointers: lr(1, 4), range: [1, 4], highlights: { 0: 'muted', 5: 'muted' } })],
      task: {
        type: 'order',
        question: 'Tap one step of the loop in order.',
        items: ['Look at the elements under the pointers', 'Prove one can never be part of a better answer', 'Move that pointer, never backwards'],
        hint: 'You look before you can prove, and prove before you move.',
      },
      solved: 'Look, prove, move. Each pointer has at most n places to go: **O(n)**.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Try every pair',
      lines: ['`i` from the left, `j` from `i + 1` to the end: try every pair.', 'Stop at the first pair that adds up to `target`.', 'It never uses the fact that the array is **sorted**: O(n²).'],
      frames: [
        ...BRUTE.map((c, k) => ({
          say: c.s === 15 ? 1 : 0,
          note: c.s === 15 ? `i = ${c.i}, j = ${c.j}: ${SIX[c.i]} + ${SIX[c.j]} = 15. Found.` : `i = ${c.i}, j = ${c.j}: ${SIX[c.i]} + ${SIX[c.j]} = ${c.s}. No.`,
          panels: [
            arr(SIX, { label: 'numbers', pointers: [ptr(c.i, 'i'), ptr(c.j, 'j', 'b')], highlights: hl(6, (x) => (x === c.i || x === c.j ? (c.s === 15 ? 'done' : 'active') : x < c.i ? 'visited' : '')) }),
            vars({ target: 15, checks: k + 1 }),
          ],
        })),
        { say: 2, note: `${BRUTE.length} checks for 6 numbers, and sortedness was never used.`, panels: [arr(SIX, { label: 'numbers', highlights: { 2: 'done', 4: 'done' } }), vars({ checks: BRUTE.length })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: what does it return?',
      lines: ['Two Sum II wants **1-based** indices.', 'The code returns `[i + 1, j + 1]`.'],
      panels: [arr(SIX, { label: 'numbers', pointers: [ptr(2, 'i'), ptr(4, 'j', 'b')], highlights: { 2: 'done', 4: 'done' } })],
      task: {
        type: 'choose',
        question: 'The pair is found at i = 2, j = 4. What does `twoSum` return?',
        options: [
          { text: '[3, 5]', why: '' },
          { text: '[2, 4]', why: 'Those are 0-based; the function adds 1 to each.' },
          { text: '[4, 11]', why: 'It returns positions, not values.' },
        ],
        answer: 0,
      },
      solved: '`[i + 1, j + 1]` = **[3, 5]**.',
    },
  ],

  'optimized-opposite': [
    {
      kind: 'watch',
      title: 'Sorted pair sum, no answer',
      lines: ['`left = 0`, `right = n − 1`.', 'While `left < right`: `sum = a[left] + a[right]`.', 'Equal → found. Less → `left++`. Greater → `right--`.', 'If the pointers meet, no pair exists.'],
      frames: [
        { say: 0, note: 'Target 11. left = 0, right = 3.', panels: [arr(MEET_A, { label: 'a', pointers: lr(0, 3) }), vars({ target: 11 })] },
        ...MEET.flatMap((st) =>
          st.move === 'meet'
            ? [{ say: 3, note: pairNote(MEET_A, 11, st), panels: [arr(MEET_A, { label: 'a', pointers: lr(st.l, st.r), highlights: hl(4, () => 'muted') }), vars({ target: 11, found: 'none' })] }]
            : [
                { say: 1, note: `sum = ${MEET_A[st.l]} + ${MEET_A[st.r]} = ${st.s}.`, panels: [arr(MEET_A, { label: 'a', pointers: lr(st.l, st.r), highlights: pairHl(4, st) }), vars({ target: 11, sum: st.s })] },
                { say: 2, note: `${st.s} ${st.s < 11 ? '< 11 → left++' : '> 11 → right--'}.`, panels: [arr(MEET_A, { label: 'a', pointers: st.move === 'l++' ? lr(st.l + 1, st.r) : lr(st.l, st.r - 1), highlights: pairHl(4, st.move === 'l++' ? { l: st.l + 1, r: st.r } : { l: st.l, r: st.r - 1 }) }), vars({ target: 11 })] },
              ],
        ),
      ],
    },
    {
      kind: 'watch',
      title: 'Palindrome: both ends move together',
      lines: ['Compare the mirror pair `s[l]` and `s[r]`.', 'Equal → both characters are fully checked: `l++` and `r--` **together**.', 'Mismatch → `return false`. Pointers meet → `return true`.'],
      frames: KAYAK.map((st) => ({
        say: st.done ? 2 : st.ok ? 1 : 0,
        note: st.done ? `l = r = ${st.l}: the pointers met → true.` : `s[${st.l}] = "${'kayak'[st.l]}", s[${st.r}] = "${'kayak'[st.r]}": equal → l++, r--.`,
        panels: [arr('kayak'.split(''), { label: '"kayak"', pointers: lr(st.l, st.r), highlights: hl(5, (k) => (k < st.l || k > st.r ? 'done' : k === st.l || k === st.r ? 'active' : '')) })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it fail?',
      lines: ['Mirror pairs are checked from the outside in.'],
      panels: [arr(BAD.split(''), { label: `"${BAD}"`, pointers: lr(0, 5) })],
      task: { type: 'cell', question: 'Tap where `l` is when `isPalindrome` returns false.', answer: 2, hints: { 0: 'a = a: this pair passes.', 1: 'b = b: this pair passes too.', 3: 'That is where r is at the mismatch; tap l.' } },
      solved: 'At l = 2, r = 3: "c" ≠ "x" → false.',
      then: BAD_RUN.map((st) => ({
        note: st.ok ? `"${BAD[st.l]}" = "${BAD[st.r]}" → l++, r--.` : `"${BAD[st.l]}" ≠ "${BAD[st.r]}" → return false.`,
        panels: [arr(BAD.split(''), { label: `"${BAD}"`, pointers: lr(st.l, st.r), highlights: hl(6, (k) => (k < st.l || k > st.r ? 'done' : k === st.l || k === st.r ? (st.ok ? 'active' : 'bad') : '')) })],
      })),
    },
    {
      kind: 'watch',
      title: 'Boats: heaviest with lightest',
      lines: ['Sort the weights. Try the **heaviest** with the **lightest**.', 'They fit → both leave: `l++`, `r--`.', 'They do not fit → the heaviest goes **alone** (`r--`): the lightest was their best chance.', 'Exchange argument: heaviest + lightest is never worse than any other pairing.'],
      frames: [
        { say: 0, note: 'Sorted weights, limit 3 per boat.', panels: [arr(BOATS, { label: 'weights', pointers: lr(0, 3) }), vars({ limit: 3, boats: 0 })] },
        { say: 2, note: '1 + 3 = 4 > 3: the 3 cannot share with anyone → alone. r--.', panels: [arr(BOATS, { label: 'weights', pointers: lr(0, 2), highlights: { 3: 'done' } }), vars({ limit: 3, boats: 1 })] },
        { say: 1, note: '1 + 2 = 3 fits → both leave. l++, r--.', panels: [arr(BOATS, { label: 'weights', pointers: lr(1, 1), highlights: { 0: 'done', 2: 'done', 3: 'done' } }), vars({ limit: 3, boats: 2 })] },
        { say: 3, note: 'The last person takes the last boat: 3 boats.', panels: [arr(BOATS, { label: 'weights', highlights: hl(4, () => 'done') }), vars({ limit: 3, boats: 3 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: too heavy together',
      lines: ['The lightest person is the heaviest person’s best chance.'],
      panels: [arr([2, 3, 4, 5], { label: 'weights, sorted', pointers: lr(0, 3), highlights: { 0: 'active', 3: 'bad' } }), vars({ limit: 6, 'sum': 7 })],
      task: {
        type: 'choose',
        question: '2 + 5 = 7 > 6. What happens next?',
        options: [
          { text: '5 goes alone: r--', why: '' },
          { text: 'Try 5 with 3 instead', why: 'If 5 cannot fit with the lightest, every heavier partner is worse.' },
          { text: '2 goes alone: l++', why: '2 can still pair with someone lighter than 5 later.' },
        ],
        answer: 0,
      },
      solved: 'The heaviest cannot share with anyone → one boat for 5, then r--.',
    },
  ],

  'optimized-read-write': [
    {
      kind: 'watch',
      title: 'Remove duplicates from a sorted array',
      lines: [
        'Invariant: `nums[0 .. write − 1]` is exactly the answer for `nums[0 .. read − 1]`.',
        '`read` visits every element once.',
        'Kept (differs from the last **kept** value `nums[write − 1]`) → copy to `nums[write]`, `write++`.',
        'At the end, `write` is the new length.',
      ],
      frames: [
        { say: 0, note: 'nums[0] is always kept: write = 1, read starts at 1.', panels: [arr(DUP, { label: 'nums', pointers: [ptr(1, 'write'), ptr(1, 'read', 'b')], highlights: { 0: 'done' } }), vars({ write: 1 })] },
        ...DEDUP.slice(0, DEDUP_TURN + 1).map(dedupFrame),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it go?',
      lines: ['A kept value is copied to `nums[write]`.'],
      panels: [
        arr(DEDUP[DEDUP_TURN].a, { label: 'nums', pointers: [ptr(DEDUP[DEDUP_TURN].w, 'write'), ptr(5, 'read', 'b')], highlights: hl(8, (k) => (k < DEDUP[DEDUP_TURN].w ? 'done' : k === 5 ? 'active' : k < 5 ? 'visited' : '')) }),
        vars({ write: DEDUP[DEDUP_TURN].w, 'last kept': DEDUP[DEDUP_TURN].a[DEDUP[DEDUP_TURN].w - 1] }),
      ],
      task: { type: 'cell', question: 'nums[5] = 2 differs from the last kept 1. Tap the cell it is copied to.', answer: 2, hints: { 5: 'That is where read is; the copy goes to write.', 1: 'nums[1] is the last kept value; the copy goes right after it.', 3: 'write is 2, not 3.' } },
      solved: 'Copied to nums[2], then write = 3.',
      then: [...DEDUP.slice(DEDUP_TURN + 1).map((st) => ({ ...dedupFrame(st), say: undefined })), { note: 'read has visited everything. return write = 4: [0, 1, 2, 3].', panels: [arr(DEDUP[DEDUP.length - 1].a, { label: 'nums', pointers: [ptr(4, 'write')], highlights: hl(8, (k) => (k < 4 ? 'done' : 'muted')) }), vars({ return: 4 })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: the new length',
      lines: ['`write` only advances for kept values.'],
      panels: [arr([1, 1, 2, 3, 3], { label: 'nums (sorted)' })],
      task: { type: 'number', question: 'What does `removeDuplicates` return for this array?', options: [2, 3, 4, 5], answer: 3, hint: 'Each distinct value is kept exactly once.' },
      solved: 'Kept 1, 2, 3: write ends at **3**, and nums[0..2] = [1, 2, 3].',
    },
    {
      kind: 'watch',
      title: 'Move Zeroes: swap instead of copy',
      lines: ['Same pointers, but **swap** `nums[read]` and `nums[write]`.', 'The zeros drift to the back: no second "fill with zeros" pass.'],
      frames: [
        { say: 0, note: 'write = 0, read = 0.', panels: [arr(ZEROS, { label: 'nums', pointers: [ptr(0, 'write'), ptr(0, 'read', 'b')] })] },
        ...ZRUN.map((st, k) => ({
          say: k === ZRUN.length - 1 ? 1 : 0,
          note: st.keep ? `read = ${st.r}: ${st.v} is kept → swap with nums[${st.at}], write = ${st.w}.` : `read = ${st.r}: 0 → skip.`,
          panels: [
            arr(st.a, {
              label: 'nums',
              pointers: [...(st.w < 5 ? [ptr(st.w, 'write')] : []), ptr(st.r, 'read', 'b')],
              highlights: hl(5, (x) => (st.keep && (x === st.at || x === st.r) ? 'active' : x < st.w ? 'done' : '')),
            }),
          ],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: copy instead of swap?',
      lines: ['Copying writes only the kept values.', 'Swapping also carries the zeros backwards.'],
      panels: [arr(ZEROS, { label: 'nums' })],
      task: {
        type: 'choose',
        question: 'If you **copied** kept values forward (no swap), what is left in nums after one pass?',
        options: [
          { text: '[1, 3, 12, 3, 12]: old values stay at the back', why: '' },
          { text: '[1, 3, 12, 0, 0]', why: 'Copying never writes zeros; those slots keep their old values.' },
          { text: '[1, 3, 12]', why: 'Copying does not shrink the array; it still has 5 slots.' },
        ],
        answer: 0,
      },
      solved: 'That is why copying needs a second "fill with zeros" pass, and swapping does not.',
    },
  ],

  'optimized-merge': [
    {
      kind: 'watch',
      title: 'Take the smaller front, advance that pointer',
      lines: ['Both inputs are sorted: the smallest remaining element overall is `min(a[i], b[j])`.', 'Take it, advance **that** pointer, repeat.'],
      frames: [
        { say: 0, note: 'i = 0, j = 0. Output is empty.', panels: [arr(MA, { label: 'a', pointers: [ptr(0, 'i')] }), arr(MB, { label: 'b', pointers: [ptr(0, 'j', 'b')] }), arr(pad([], 6), { label: 'out' })] },
        ...MERGE.map((st) => ({
          say: 1,
          note: st.i < MA.length && st.j < MB.length ? `min(${MA[st.i]}, ${MB[st.j]}) = ${st.v} from ${st.fromA ? 'a → i++' : 'b → j++'}.` : `Only ${st.fromA ? 'a' : 'b'} has values left: take ${st.v}.`,
          panels: [
            arr(MA, { label: 'a', pointers: st.ni < 3 ? [ptr(st.ni, 'i')] : [], highlights: hl(3, (k) => (k < st.ni ? (st.fromA && k === st.ni - 1 ? 'active' : 'muted') : '')) }),
            arr(MB, { label: 'b', pointers: st.nj < 3 ? [ptr(st.nj, 'j', 'b')] : [], highlights: hl(3, (k) => (k < st.nj ? (!st.fromA && k === st.nj - 1 ? 'active' : 'muted') : '')) }),
            arr(pad(st.out, 6), { label: 'out', highlights: hl(6, (k) => (k === st.out.length - 1 ? 'active' : k < st.out.length ? 'done' : '')) }),
          ],
        })),
      ],
    },
    {
      kind: 'watch',
      title: 'In place: fill nums1 from the back',
      lines: ['`nums1` has free room at the back for `nums2`.', 'Write the larger of `nums1[i]` and `nums2[j]` at `k`, starting at `m + n − 1`, and move left.', 'Loop while `j >= 0`.'],
      frames: [
        backFrame(BACK[0], N2, 0, 'm = 3, n = 3. i = 2, j = 2, k = 5. The three 0s are free slots.'),
        ...BACK.slice(1, BACK_TURN + 1).map((st) => backFrame(st, N2, 1, backNote(st))),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the next write',
      lines: ['The larger value goes to `k`; the pointer it came from moves left.'],
      panels: backFrame(BACK[BACK_TURN], N2, 1, 'x').panels,
      task: {
        type: 'choose',
        question: 'nums1[i] = 3, nums2[j] = 2. What happens next?',
        options: [
          { text: 'Write 3 at k, then i-- and k--', why: '' },
          { text: 'Write 2 at k, then j-- and k--', why: 'The larger value goes to the back, and 3 > 2.' },
          { text: 'Write 3 at k, then j-- and k--', why: 'The pointer whose value was taken moves: i, not j.' },
        ],
        answer: 0,
      },
      solved: '3 lands at k = 2; i and k move left.',
      then: [
        ...BACK.slice(BACK_TURN + 1).map((st) => backFrame(st, N2, 0, backNote(st))),
        backFrame({ ...BACK[BACK.length - 1], at: -1 }, N2, 0, 'j = −1: the loop stops. nums1 = [1, 2, 3, 4, 5, 6].'),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: nums2 ran out first',
      lines: ['The loop runs `while (j >= 0)`.'],
      panels: [
        arr(END.a, { label: 'nums1', pointers: [ptr(END.i, 'i'), ptr(END.k, 'k', 'b')], highlights: hl(5, (k) => (k > END.k ? 'done' : '')) }),
        arr([5, 9], { label: 'nums2', highlights: { 0: 'muted', 1: 'muted' } }),
        vars({ i: END.i, j: END.j, k: END.k }),
      ],
      task: {
        type: 'choose',
        question: 'nums2 is used up (j = −1) while i = 1. What is left to do?',
        options: [
          { text: 'Nothing: nums1’s rest is already in place', why: '' },
          { text: 'Copy 1 and 2 to the front', why: 'They never moved; they already sit at the front, in order.' },
          { text: 'Sort nums1 once more', why: 'Every write put the next-largest value in its final slot.' },
        ],
        answer: 0,
      },
      solved: 'Once nums2 is used up, nums1’s remaining values are already in place.',
    },
  ],

  'optimized-ksum': [
    {
      kind: 'watch',
      title: '3Sum = sort + a pair sum per i',
      lines: ['**Sort** first, with a numeric comparator.', 'For each `i`: find pairs in `nums[i+1 ..]` with sum `−nums[i]`, an opposite-ends pair sum.', 'Found → record it, then move `l` past all copies of `nums[l]`.'],
      frames: [
        { say: 0, note: 'The input, unsorted.', panels: [arr(K_RAW, { label: 'nums' })] },
        { say: 0, note: 'sort((a, b) => a − b): equal values are now neighbours.', panels: [arr(K, { label: 'nums (sorted)' })] },
        ...KEV.filter((e) => e.i < 2).map((e) => ({ say: e.act === 'found' ? 2 : 1, note: ksNote(K, e), panels: ksPanels(K, e) })),
        { say: 1, note: 'i = 2 and i = 3 find no more zero sums.', panels: [arr(K, { label: 'nums (sorted)' }), vars({ found: KEV[KEV.length - 1].res.map((t) => `[${t.join(', ')}]`).join(' ') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: past the copies',
      lines: ['After recording a triplet, move `l` past all copies of `nums[l]`.', 'The matching `r` copies are then skipped automatically.'],
      panels: ksPanels(K2, K2EV[0]),
      task: { type: 'cell', question: '[-2, 0, 2] was just recorded with l = 1. Tap where l lands.', answer: 3, hints: { 2: 'nums[2] is another 0: the same partner value again.', 1: 'l must move past the value it just used.', 4: 'That is r.' } },
      solved: 'l skips both 0s and lands on index 3.',
      then: K2EV.slice(1).filter((e) => e.i === 0).map((e) => ({ say: 1, note: `${ksNote(K2, e)} The copy of 2 at r was skipped by the sum alone. l ≥ r: i = 0 is done.`, panels: ksPanels(K2, e) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the 3Sum recipe',
      lines: ['3Sum turns into many sorted pair sums.'],
      panels: [arr(K_RAW, { label: 'nums' })],
      task: {
        type: 'order',
        question: 'Tap the 3Sum steps in order.',
        items: ['Sort with (a, b) => a − b', 'Pick the next i', 'Pair-sum nums[i+1 ..] for −nums[i]', 'Move l past copies after a match'],
        hint: 'Pairs can only be found once the array is sorted and i is fixed.',
      },
      solved: 'Sort once, then an O(n) pair sum per i: **O(n²)** in total.',
    },
    {
      kind: 'turn',
      title: 'Your turn: 4Sum',
      lines: ['3Sum: one outer loop around a pair sum, O(n²).', '4Sum adds one more outer loop, with its own duplicate skip.'],
      panels: [table(['3Sum', '4Sum'], ['outer loops', 'time'], [['1', 'O(n²)'], ['?', 'O(n³)']], [['done', 'done'], ['active', 'done']])],
      task: { type: 'number', question: 'How many outer loops wrap the pair sum in 4Sum?', options: [1, 2, 3], answer: 2, hint: 'One more than 3Sum.' },
      solved: 'Two outer loops + an O(n) pair sum: O(n³). In general kSum is O(n^(k−1)).',
    },
  ],

  'optimized-dutch-flag': [
    {
      kind: 'watch',
      title: 'Three pointers, four regions',
      lines: [
        '`[0, low)` 0s · `[low, mid)` 1s · `[mid, high]` unknown · `(high, end]` 2s.',
        '**0** → swap with `nums[low]`, `low++`, `mid++`.',
        '**1** → already in the right region, `mid++`.',
        '**2** → swap with `nums[high]`, `high--`. **mid stays**: the value from high is still unknown.',
        'Stop when `mid > high`.',
      ],
      frames: [
        { say: 0, note: 'Everything is unknown: low = mid = 0, high = 5.', panels: dutchPanels(FLAG, 0, 0, 5) },
        ...FRUN.map((st, k) => ({
          say: st.v === 0 ? 1 : st.v === 1 ? 2 : 3,
          note: dutchNote(st) + (k === FRUN.length - 1 ? ' Now mid > high: done.' : ''),
          panels: dutchPanels(st.a, st.low, st.mid, st.high),
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the four regions',
      lines: ['low, mid and high split the array into four regions.'],
      panels: dutchPanels(FRUN[2].a, FRUN[2].low, FRUN[2].mid, FRUN[2].high),
      task: { type: 'order', question: 'Tap the four regions from left to right.', items: ['0s', '1s', 'unknown', '2s'], hint: 'low ends the 0s, mid starts the unknown, high ends it.' },
      solved: '0s, 1s, unknown, 2s. The algorithm shrinks the unknown until it is empty.',
    },
    {
      kind: 'turn',
      title: 'Your turn: mid after a 2',
      lines: ['A 2 is swapped with `nums[high]`, then `high--`.'],
      panels: [arr(SRUN[1].a, { label: 'nums, after the swap', pointers: [ptr(SRUN[1].low, 'low'), ptr(SRUN[1].high, 'high')], highlights: { 2: 'visited' } }), vars({ low: SRUN[1].low, high: SRUN[1].high })],
      task: { type: 'cell', question: 'Before the swap mid was 1 and nums[1] was 2. Tap where mid is now.', answer: 1, hints: { 2: 'mid does not follow the 2.', 0: 'mid never moves backwards.' } },
      solved: 'mid stays at 1: the 0 that arrived from high is still unknown.',
      then: [
        { say: 0, note: 'mid = 1 holds 0 → swap with nums[low], low++, mid++.', panels: dutchPanels(SRUN[2].a, SRUN[2].low, SRUN[2].mid, SRUN[2].high) },
        { say: 0, note: 'mid > high: no unknowns left. [0, 1, 2].', panels: [arr(SRUN[2].a, { label: 'nums', highlights: { 0: 'done', 1: 'window', 2: 'visited' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many steps?',
      lines: ['Every step either moves mid right or high left.', 'Either way the unknown region `[mid, high]` shrinks by one.'],
      panels: dutchPanels(FLAG, 0, 0, 5),
      task: { type: 'number', question: 'How many loop steps does this 6-element array take?', options: [3, 5, 6, 12], answer: 6, hint: 'The unknown region starts with 6 elements and loses one per step.' },
      solved: `${FRUN.length} steps: one pass, O(1) space.`,
    },
  ],

  'optimized-partition': [
    {
      kind: 'watch',
      title: 'Lomuto: evens first',
      lines: ['One `boundary`, one scanner. Invariant: `[0, boundary)` all match the predicate.', 'The scanner finds a match → swap it to `boundary`, grow the region.'],
      frames: [
        { say: 0, note: 'Predicate: even. boundary = 0, the region is empty.', panels: [arr(PART, { label: 'nums', pointers: [ptr(0, 'boundary'), ptr(0, 'scan', 'b')] }), vars({ swaps: 0 })] },
        ...LOMUTO.map((st) => ({
          say: st.match ? 1 : 0,
          note: st.match ? `scan = ${st.i}: ${st.v} is even → swap to the boundary, boundary = ${st.b}.` : `scan = ${st.i}: ${st.v} is odd → leave it.`,
          panels: [arr(st.a, { label: 'nums', pointers: [...(st.b < 5 ? [ptr(st.b, 'boundary')] : []), ptr(st.i, 'scan', 'b')], highlights: hl(5, (k) => (k < st.b ? 'done' : k === st.i ? 'active' : '')) }), vars({ swaps: st.swaps })],
        })),
      ],
    },
    {
      kind: 'watch',
      title: 'Hoare: one swap fixes two',
      lines: ['`l` skips elements already on the left side; `r` skips those already on the right.', 'Both stuck: `nums[l]` belongs right and `nums[r]` belongs left → **one swap fixes both**.'],
      frames: [
        { say: 0, note: 'Same input. l = 0, r = 4.', panels: [arr(PART, { label: 'nums', pointers: lr(0, 4) }), vars({ swaps: 0 })] },
        ...HOARE.map((st) => ({
          say: st.act === 'swap' ? 1 : 0,
          note: st.act === 'l' ? `nums[l] is even: already on the left → l++.` : st.act === 'r' ? `nums[r] is odd: already on the right → r--.` : `odd at l, even at r: swap, l++, r--.`,
          panels: [arr(st.a, { label: 'nums', pointers: lr(st.l, st.r), highlights: hl(5, (k) => (st.act === 'swap' && (k === st.before.l || k === st.before.r) ? 'active' : k < st.l ? 'done' : k > st.r ? 'visited' : '')) }), vars({ swaps: st.swaps })],
        })),
        { say: 1, note: `l ≥ r: done with ${HOARE[HOARE.length - 1].swaps} swaps; Lomuto used ${LOMUTO[LOMUTO.length - 1].swaps}.`, panels: [arr(HOARE[HOARE.length - 1].a, { label: 'nums', highlights: hl(5, (k) => (HOARE[HOARE.length - 1].a[k] % 2 === 0 ? 'done' : 'visited')) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does r stop?',
      lines: ['Evens left, odds right. `r` skips odds: they already belong on the right.'],
      panels: [arr(H2[H2_TURN - 1].a, { label: 'nums', pointers: lr(2, 4), highlights: { 0: 'done', 1: 'done', 2: 'bad', 5: 'visited' } })],
      task: { type: 'cell', question: 'l is stuck on 1 (odd, belongs right). Tap where r gets stuck.', answer: 3, hints: { 4: '9 is odd: already on the right side, so r skips it.', 5: 'r never moves back.', 2: 'That is l.' } },
      solved: 'r skips 9 and stops on 6 (even, belongs left). One swap fixes both.',
      then: H2.slice(H2_TURN).map((st) => ({
        say: 0,
        note: st.act === 'r' ? 'nums[r] = 9 is odd → r--.' : 'Odd at l, even at r → swap, l++, r--. Now l > r: done.',
        panels: [arr(st.a, { label: 'nums', pointers: lr(st.l, st.r), highlights: st.act === 'swap' ? { 2: 'active', 3: 'active' } : { 2: 'bad', 3: 'active' } })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: keep the order',
      lines: ['Neither Lomuto nor Hoare is **stable**.'],
      panels: [arr(PART, { label: 'before: evens 8, 2, 6' }), arr(HOARE[HOARE.length - 1].a, { label: 'after Hoare: evens 6, 8, 2' })],
      task: {
        type: 'choose',
        question: 'The evens must keep their original order. What should you use?',
        options: [
          { text: 'Read/write compaction', why: '' },
          { text: 'Hoare, but with fewer swaps', why: 'Any swapping across the array can reorder equal-category elements.' },
          { text: 'Lomuto', why: 'Lomuto is not stable either.' },
        ],
        answer: 0,
      },
      solved: 'If order matters, use **read/write** compaction instead.',
    },
  ],

  'optimized-bottleneck': [
    {
      kind: 'watch',
      title: 'Container: move the shorter line',
      lines: ['Area of lines `l` and `r`: `min(h[l], h[r]) × (r − l)`.', 'Start with the **widest** pair.', 'Shorter line at `l`: every other container using it is narrower and no taller → `l++` (and the mirror for `r`).'],
      frames: CRUN.map((st, k) => ({
        say: k === 0 ? 1 : 2,
        note: `l = ${st.l}, r = ${st.r}: ${st.min} × ${st.r - st.l} = ${st.area}, best ${st.best}. ${CH[st.l] < CH[st.r] ? 'h[l] shorter → l++' : CH[st.l] === CH[st.r] ? 'equal → r--' : 'h[r] shorter → r--'}.`,
        panels: [arr(CH, { label: 'height', pointers: lr(st.l, st.r), range: [st.l, st.r], highlights: hl(6, (x) => (x === st.l || x === st.r ? 'active' : x < st.l || x > st.r ? 'muted' : '')) }), vars({ area: st.area, best: st.best })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: which line goes?',
      lines: ['Moving the taller line can never help: narrower, and still capped by the shorter one.'],
      panels: [arr([3, 7, 2, 6, 5], { label: 'height', pointers: lr(0, 4), range: [0, 4], highlights: { 0: 'active', 4: 'active' } }), vars({ area: '3 × 4 = 12' })],
      task: { type: 'cell', question: 'Tap where the moving pointer lands.', answer: 1, hints: { 3: 'That moves the taller line (5): narrower and still capped by 3.', 0: 'Line 0 is finished; it must go.' } },
      solved: 'h[l] = 3 is shorter → l++ to index 1.',
    },
    {
      kind: 'watch',
      title: 'Trapping Rain Water: settle the smaller side',
      lines: [
        'Water above bar i: `min(maxLeft[i], maxRight[i]) − h[i]`.',
        'Keep running `leftMax` and `rightMax` from both ends.',
        'The smaller running max is the bottleneck: that side’s level is **known exactly**. Add it, move that pointer.',
        'O(n) time, **O(1)** space.',
      ],
      frames: [
        { say: 0, note: 'Bars of height h. Water sits between taller bars.', panels: [arr(TH, { label: 'height', pointers: lr(0, 7) }), arr(Array(8).fill('·'), { label: 'water per bar' }), vars({ leftMax: 0, rightMax: 0, water: 0 })] },
        ...TRUN.map((st, k) => ({
          say: k === TRUN.length - 1 ? 3 : 2,
          note: `leftMax ${st.lm}, rightMax ${st.rm} → ${st.left ? `left settles: ${st.lm} − ${TH[st.l]} = ${st.add}, l++` : `right settles: ${st.rm} − ${TH[st.r]} = ${st.add}, r--`}.`,
          panels: [
            arr(TH, { label: 'height', pointers: lr(st.l, st.r), highlights: hl(8, (x) => (x === st.at ? 'active' : st.per[x] !== '·' ? 'done' : '')) }),
            arr(st.per, { label: 'water per bar', highlights: hl(8, (x) => (x === st.at ? 'active' : st.per[x] !== '·' ? 'window' : '')) }),
            vars({ leftMax: st.lm, rightMax: st.rm, water: st.water }),
          ],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: water above one bar',
      lines: ['`water[i] = min(maxLeft[i], maxRight[i]) − h[i]`.'],
      panels: [arr([4, 2, 1, 3], { label: 'height', pointers: [ptr(2, 'i')], highlights: { 0: 'visited', 2: 'active', 3: 'visited' } }), vars({ 'maxLeft[2]': 4, 'maxRight[2]': 3, 'h[2]': 1 })],
      task: { type: 'number', question: 'How much water sits above bar 2?', options: [0, 1, 2, 3], answer: 2, hint: 'The lower of the two maxima sets the level.' },
      solved: 'min(4, 3) − 1 = **2**.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Where each skeleton starts',
      lines: [
        'Opposite ends: `l = 0`, `r = n − 1`, loop `while (l < r)`.',
        'Read/write: `write = 0`, `read` sweeps the array; `arr[0 .. write − 1]` is the result.',
        'Merge from the back: `i = m − 1`, `j = n − 1`, `k = m + n − 1`, loop `while (j >= 0)`.',
        'Dutch flag: `low = mid = 0`, `high = n − 1`, loop `while (mid <= high)`.',
      ],
      frames: [
        { say: 0, note: 'One pointer per end.', panels: [arr(SIX, { label: 'arr', pointers: lr(0, 5) }), code('let l = 0, r = arr.length - 1;')] },
        { say: 1, note: 'Both on the left; read moves every step.', panels: [arr(ZEROS, { label: 'arr', pointers: [ptr(0, 'write'), ptr(0, 'read', 'b')] }), code('let write = 0;')] },
        { say: 2, note: 'i and j on the last real values, k on the last slot.', panels: [arr([1, 3, 5, '·', '·'], { label: 'a (m = 3, room for 2)', pointers: [ptr(2, 'i'), ptr(4, 'k', 'b')] }), arr([2, 4], { label: 'b (n = 2)', pointers: [ptr(1, 'j')] }), code('let i = m - 1, j = n - 1, k = m + n - 1;')] },
        { say: 3, note: 'Everything unknown: low and mid at 0, high at the end.', panels: [arr(FLAG, { label: 'a', pointers: dutchPtrs(6, 0, 0, 5) }), code('let low = 0, mid = 0, high = a.length - 1;')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does k start?',
      lines: ['`k = m + n − 1`: the last slot of the combined array.'],
      panels: [arr(TPL_A, { label: 'a: m = 3 values, room for n = 4', pointers: [ptr(2, 'i')] })],
      task: { type: 'cell', question: 'Tap where k starts.', answer: 6, hints: { 2: 'That is i = m − 1.', 3: 'k counts both arrays: m + n − 1.' } },
      solved: 'k = 3 + 4 − 1 = 6: the very last slot.',
    },
    {
      kind: 'turn',
      title: 'Your turn: which loop?',
      lines: ['Each skeleton has its own loop condition.'],
      panels: [arr(FLAG, { label: 'a', pointers: dutchPtrs(6, 0, 0, 5) })],
      task: {
        type: 'choose',
        question: 'Which loop condition belongs to the three-pointer (Dutch flag) template?',
        options: [
          { text: 'while (mid <= high)', why: '' },
          { text: 'while (l < r)', why: 'That is the opposite-ends template.' },
          { text: 'while (j >= 0)', why: 'That is merge from the back.' },
        ],
        answer: 0,
      },
      solved: '`mid <= high`: the loop runs while unknowns remain.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Sort numbers with a comparator',
      lines: ['`[1, 10, 2].sort()` gives `[1, 10, 2]`: the default sort compares strings.', 'Always pass `(a, b) => a - b` for numbers.', '`sort` mutates the array.'],
      frames: [
        { say: 0, note: '[1, 10, 2].sort() → [1, 10, 2]: "10" comes before "2" as text.', panels: [arr([1, 10, 2], { label: '.sort()', highlights: { 1: 'bad', 2: 'bad' } })] },
        { say: 1, note: '.sort((a, b) => a − b) → [1, 2, 10].', panels: [arr([1, 2, 10], { label: '.sort((a, b) => a - b)', highlights: hl(3, () => 'done') })] },
        { say: 2, note: 'The original array itself is now sorted: no copy was made.', panels: [arr([1, 2, 10], { label: 'nums (changed!)', highlights: hl(3, () => 'active') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: leave the caller’s array alone',
      lines: ['`sort` mutates.', 'Sometimes the caller’s array must not change.'],
      panels: [arr(I_RAW, { label: 'caller’s nums (must not change)' })],
      task: {
        type: 'choose',
        question: 'How do you get a sorted version without changing nums?',
        options: [
          { text: '[...nums].sort((a, b) => a - b)', why: '' },
          { text: 'nums.sort((a, b) => a - b)', why: 'That sorts the caller’s array in place.' },
          { text: '[...nums].sort()', why: 'A copy, but the default sort compares strings.' },
        ],
        answer: 0,
      },
      solved: 'Sort a **copy**: `[...nums].sort((a, b) => a - b)`.',
    },
    {
      kind: 'watch',
      title: '3Sum, as implemented',
      lines: [
        'Sort, then for each `i`: `if (nums[i] > 0) break` — the smallest value is positive.',
        'Sum < 0 → `l++`. Sum > 0 → `r--`.',
        'Sum = 0 → push, `l++`, `r--`, then skip copies on both sides.',
      ],
      frames: [
        { say: 0, note: 'Sorted numerically.', panels: [arr(I_SORTED, { label: 'nums (sorted)' })] },
        ...IEV.filter((e) => e.act !== 'break').map((e) => ({
          say: e.act === 'found' ? 2 : 1,
          note: `i = ${e.i}, l = ${e.l}, r = ${e.r}: ${I_SORTED[e.i]} + ${I_SORTED[e.l]} + ${I_SORTED[e.r]} = ${e.s}${e.act === 'found' ? ' → push, l++, r--.' : e.act === 'l++' ? ' → l++.' : ' → r--.'}`,
          panels: ksPanels(I_SORTED, e).slice(0, 1).concat([vars({ sum: e.s, result: e.res.map((t) => `[${t.join(', ')}]`).join(' ') || '—' })]),
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it break?',
      lines: ['`if (nums[i] > 0) break;` — no more zero sums once the smallest value is positive.'],
      panels: [arr(I_SORTED, { label: 'nums (sorted)', highlights: { 0: 'visited', 1: 'visited' } }), vars({ result: '[-2, 0, 2] [-2, 1, 1]' })],
      task: { type: 'cell', question: 'i = 0 and i = 1 are done. Tap the i where the loop breaks.', answer: IBREAK.i, hints: { 1: '0 is not > 0; i = 1 already ran.', 3: 'The loop stops earlier, at the first positive nums[i].', 4: 'i only runs up to n − 3.' } },
      solved: `nums[${IBREAK.i}] = ${I_SORTED[IBREAK.i]} > 0 → break. Two triplets.`,
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'Container, height = [1,8,6,2,5,4,8,3,7]',
      lines: ['Start with the widest pair: l = 0, r = 8.', 'Compute the area, keep the best, move the shorter line.'],
      frames: [dryFrame(DRUN[0], 0)],
    },
    {
      kind: 'turn',
      title: 'Your turn: the second move',
      lines: ['Move the shorter line.'],
      panels: [...halvesOf(1, 8, { 1: 'active', 8: 'active' }), vars({ area: '7 × 7 = 49', best: 49 })],
      task: { type: 'cell', panel: 1, question: 'h[1] = 8, h[8] = 7. Tap where the moving pointer lands.', answer: 2, hints: { 3: 'That is where r is now; it must move.', 0: 'r moves one step at a time.', 1: 'r moves one step, not two.' } },
      solved: 'h[r] = 7 is shorter → r-- to index 7.',
      then: DRUN.slice(1).map((st) => ({ ...dryFrame(st, 1), say: 0 })),
    },
    {
      kind: 'turn',
      title: 'Your turn: steps vs pairs',
      lines: ['The loop took 8 steps for 9 lines.'],
      panels: [...halvesOf(0, 8), vars({ steps: DRUN.length, best: 49 })],
      task: { type: 'number', question: 'How many pairs would the brute force check for 9 lines?', options: [8, 36, 72, 81], answer: 36, hint: 'Pairs of 9 lines: 9 × 8 / 2.' },
      solved: '**36** pairs, against 8 two-pointer steps.',
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Default sort is lexicographic',
      lines: ['`[10, 9, 1].sort()` sorts the numbers as text.'],
      frames: [
        { say: 0, note: 'The input.', panels: [arr([10, 9, 1], { label: 'nums' })] },
        { say: 0, note: '.sort() → [1, 10, 9]: "10" < "9" as text. Not sorted!', panels: [arr([1, 10, 9], { label: 'nums.sort()', highlights: { 1: 'bad', 2: 'bad' } })] },
        { say: 0, note: '.sort((a, b) => a − b) → [1, 9, 10].', panels: [arr([1, 9, 10], { label: 'nums.sort((a, b) => a - b)', highlights: hl(3, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: l <= r in a pair sum',
      lines: ['A pair needs two distinct indices.'],
      panels: [arr([1, 3, 5], { label: 'nums, target 10', pointers: lr(2, 2), highlights: { 0: 'muted', 1: 'muted', 2: 'bad' } }), code('while (l <= r) { … }  // l = r = 2: 5 + 5 = 10 "found"')],
      task: {
        type: 'choose',
        question: 'The loop reports 5 + 5 = 10 as a pair. What went wrong?',
        options: [
          { text: 'It paired index 2 with itself; pair loops need l < r', why: '' },
          { text: 'The target is too big for this array', why: 'Any target is allowed; the bug is the loop condition.' },
          { text: 'The array should be sorted descending', why: 'Ascending is right; the bug is l <= r.' },
        ],
        answer: 0,
      },
      solved: 'Pairs need `l < r`. (`<=` is right for the Dutch flag, where it classifies the last unknown.)',
    },
    {
      kind: 'watch',
      title: 'Merging in place from the front',
      lines: ['From the front, the write slot still holds an **unread** nums1 value.'],
      frames: [
        { say: 0, note: 'nums1 = [4, 5, 6, _, _, _], nums2 = [1, 2, 3].', panels: [arr([4, 5, 6, 0, 0, 0], { label: 'nums1', pointers: [ptr(0, 'write')] }), arr([1, 2, 3], { label: 'nums2', pointers: [ptr(0, 'j', 'b')] })] },
        { say: 0, note: 'Smallest is 1 → write it at index 0… and 4 is gone before it was read.', panels: [arr([1, 5, 6, 0, 0, 0], { label: 'nums1', pointers: [ptr(1, 'write')], highlights: { 0: 'bad' } }), arr([1, 2, 3], { label: 'nums2', pointers: [ptr(1, 'j', 'b')], highlights: { 0: 'muted' } }), vars({ lost: 4 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: forgot to move',
      lines: ['After a match, the pointers must still move.'],
      panels: [arr(['a', 'a'], { label: '"aa"', pointers: lr(0, 1), highlights: { 0: 'active', 1: 'active' } }), code('while (l < r) { if (s[l] !== s[r]) return false; }  // no l++, r--')],
      task: {
        type: 'choose',
        question: 'What does this loop do on "aa"?',
        options: [
          { text: 'It never ends', why: '' },
          { text: 'Returns true', why: 'l and r never move, so l < r stays true forever.' },
          { text: 'Returns false', why: '"a" = "a", so the mismatch check never fires.' },
        ],
        answer: 0,
      },
      solved: 'Forgetting to move the pointers after a match → **infinite loop**.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Talk through the optimisation',
      lines: ['Start with brute force: "all pairs, O(n²)".', 'Then say **which pairs one comparison rules out**: that sentence is the optimisation.', 'State the invariant: "no valid pair uses an index outside [l, r]".'],
      frames: [
        { say: 0, note: '"I could try all 15 pairs: O(n²)."', panels: [arr(SIX, { label: 'nums, target 9' }), vars({ pairs: 15 })] },
        { say: 1, note: '"1 + 15 = 16 > 9, so every pair with 15 is too big."', panels: [arr(SIX, { label: 'nums, target 9', pointers: lr(0, 5), highlights: { 0: 'active', 5: 'bad' } })] },
        { say: 2, note: '"No valid pair uses an index outside [l, r]."', panels: [arr(SIX, { label: 'nums, target 9', pointers: lr(0, 4), range: [0, 4], highlights: { 5: 'muted' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: explaining Trapping Rain Water',
      lines: ['Build the answer up in layers.'],
      panels: [arr(TH, { label: 'height' })],
      task: {
        type: 'order',
        question: 'Tap the parts of your explanation in order.',
        items: ['The formula min(maxLeft, maxRight) − h', 'The O(n)-space version', 'The two-pointer proof'],
        hint: 'Formula first, then the simple version, then the clever one.',
      },
      solved: 'Formula → O(n)-space version → two-pointer proof.',
    },
    {
      kind: 'turn',
      title: 'Your turn: state the invariant',
      lines: ['Interviewers want the invariant out loud.'],
      panels: dutchPanels(FRUN[3].a, FRUN[3].low, FRUN[3].mid, FRUN[3].high),
      task: {
        type: 'choose',
        question: 'Which invariant holds for the Dutch flag?',
        options: [
          { text: '[low, mid) are all 1s', why: '' },
          { text: '[low, mid) are all 0s', why: 'The 0s are [0, low).' },
          { text: '[mid, high] are all 2s', why: '[mid, high] is the unknown region; 2s sit after high.' },
        ],
        answer: 0,
      },
      solved: '"[low, mid) are all 1s" — say it before you code.',
    },
  ],
};
