// Step lessons for Array Techniques (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every running sum, swap, mark and vote below is produced by running the algorithm on its input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const code = (text) => vars({ code: text });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });

// a 9-long array does not fit one phone row: show [0..4] and [5..8] (hi(k), pointers and range use real indexes)
function halves(a, { hi = () => '', ptrs = [], range, label = 'nums' } = {}) {
  return [
    [0, 5],
    [5, a.length],
  ].map(([s, e]) =>
    arr(a.slice(s, e), {
      label: `${label}[${s}..${e - 1}]`,
      indexBase: s,
      highlights: hl(e - s, (k) => hi(k + s)),
      pointers: ptrs.filter((p) => p.index >= s && p.index < e).map((p) => ({ ...p, index: p.index - s })),
      ...(range && range[0] < e && range[1] >= s ? { range: [Math.max(range[0], s) - s, Math.min(range[1], e - 1) - s] } : {}),
    }),
  );
}

// ---------- Kadane ----------
const NUMS = [-2, 1, -3, 4, -1, 2, 1, -5, 4]; // the lesson's input
function kadane(a) {
  let cur = a[0],
    best = a[0],
    start = 0,
    bl = 0,
    br = 0;
  const out = [{ i: 0, x: a[0], ext: null, dec: 'start', cur, best, start, bl, br }];
  for (let i = 1; i < a.length; i++) {
    const ext = cur + a[i],
      restart = ext < a[i];
    if (restart) {
      cur = a[i];
      start = i;
    } else cur = ext;
    if (cur > best) {
      best = cur;
      bl = start;
      br = i;
    }
    out.push({ i, x: a[i], ext, dec: restart ? 'restart' : 'extend', cur, best, start, bl, br });
  }
  return out;
}
const KRUN = kadane(NUMS);
const decText = (st) => (st.dec === 'start' ? 'start' : st.dec === 'restart' ? `restart (${st.x} > ${st.ext})` : 'extend');
const kFrame = (st, say) => ({
  say,
  note: st.dec === 'start' ? `i = 0: cur = best = ${st.x}.` : `i = ${st.i}: cur + nums[i] = ${st.ext}, nums[i] = ${st.x} → ${decText(st)}. cur = ${st.cur}, best = ${st.best}.`,
  panels: [
    ...halves(NUMS, { hi: (k) => (k === st.i ? 'active' : k >= st.start && k < st.i ? 'window' : k < st.start ? 'muted' : ''), ptrs: [ptr(st.i, 'i')], range: [st.start, st.i] }),
    vars({ 'nums[i]': st.x, 'cur + nums[i]': st.ext === null ? '—' : st.ext, decision: decText(st), cur: st.cur, best: st.best }),
  ],
});

// brute force: every start, running sum to the right
const BRUTE = [];
{
  let best = -Infinity;
  for (let s = 0; s < NUMS.length; s++) {
    let sum = 0;
    for (let e = s; e < NUMS.length; e++) {
      sum += NUMS[e];
      best = Math.max(best, sum);
      BRUTE.push({ s, e, sum, best });
    }
  }
}
const BEST_BEFORE_3 = BRUTE.filter((b) => b.s < 3).reduce((m, b) => Math.max(m, b.sum), -Infinity); // 4
const bruteFrame = (b) => ({
  say: 1,
  note: `end = ${b.e}: sum += ${NUMS[b.e]} → ${b.sum}. best = ${b.best}.`,
  panels: [...halves(NUMS, { hi: (k) => (k === b.e ? 'active' : k >= b.s && k < b.e ? 'window' : ''), ptrs: [ptr(b.s, 'start', 'b'), ptr(b.e, 'end')], range: [b.s, b.e] }), vars({ start: b.s, end: b.e, sum: b.sum, best: b.best })],
});

// shops analogy: running total, restart when it is a debt
const SHOPS = [2, -4, 3, -1, 2];
const SRUN = kadane(SHOPS);

// circular: [5, -3, 5]
function circular(a) {
  let total = 0,
    curMax = 0,
    bestMax = -Infinity,
    curMin = 0,
    bestMin = Infinity;
  for (const x of a) {
    total += x;
    curMax = Math.max(x, curMax + x);
    bestMax = Math.max(bestMax, curMax);
    curMin = Math.min(x, curMin + x);
    bestMin = Math.min(bestMin, curMin);
  }
  return { total, bestMax, bestMin, answer: bestMax < 0 ? bestMax : Math.max(bestMax, total - bestMin) };
}
const CIRC = [5, -3, 5];
const C = circular(CIRC); // total 7, max 7, min -3, answer 10
const NEG = [-3, -1, -2];
const CN = circular(NEG); // total -6, max -1, min -6

// product: track curMax and curMin
function product(a) {
  let hi = a[0],
    lo = a[0],
    best = a[0];
  const out = [{ i: 0, x: a[0], cands: [a[0]], hi, lo, best }];
  for (let i = 1; i < a.length; i++) {
    const x = a[i],
      p = hi * x,
      q = lo * x;
    const cands = [x, p, q];
    hi = Math.max(...cands);
    lo = Math.min(...cands);
    best = Math.max(best, hi);
    out.push({ i, x, cands, hi, lo, best });
  }
  return out;
}
const PROD = [3, -2, 0, -4, -5];
const PRUN = product(PROD); // best 20
const fmt = (n) => (Object.is(n, -0) ? 0 : n);

// implementation: range tracking
const RANGE_IN = [2, -3, 1, 2, -1, 3];
const RRUN = kadane(RANGE_IN);

// product update-order bug: old curMax = -2, curMin = -6, x = -3
const BUG = { hi: -2, lo: -6, x: -3 };
const BUG_RIGHT = { hi: Math.max(BUG.x, BUG.hi * BUG.x, BUG.lo * BUG.x), lo: Math.min(BUG.x, BUG.hi * BUG.x, BUG.lo * BUG.x) }; // 18, -3
const BUG_HI = Math.max(BUG.x, BUG.hi * BUG.x, BUG.lo * BUG.x);
const BUG_LO = Math.min(BUG.x, BUG_HI * BUG.x, BUG.lo * BUG.x); // -54

// ---------- cyclic sort ----------
function cyclic(a0, { advanceAfterSwap = false } = {}) {
  const a = a0.slice(),
    out = [];
  let i = 0,
    swaps = 0;
  while (i < a.length) {
    const v = a[i],
      h = v - 1,
      swap = a[h] !== v;
    if (swap) {
      [a[i], a[h]] = [a[h], a[i]];
      swaps++;
      out.push({ i, v, h, act: 'swap', a: a.slice(), swaps });
      if (advanceAfterSwap) i++;
    } else {
      out.push({ i, v, h, act: h === i ? 'home' : 'dup', a: a.slice(), swaps });
      i++;
    }
  }
  return out;
}
const homeHl = (a, extra = {}) => hl(a.length, (k) => extra[k] || (a[k] === k + 1 ? 'done' : ''));
const cycNote = (s) =>
  s.act === 'swap'
    ? `i = ${s.i}: ${s.v} belongs at index ${s.h} → swap. i stays.`
    : s.act === 'home'
      ? `i = ${s.i}: ${s.v} is home → i++.`
      : `i = ${s.i}: ${s.v}'s home (index ${s.h}) already holds ${s.v} → duplicate, i++.`;
const cycFrame = (s, say, label = 'nums') => ({
  say,
  note: cycNote(s),
  panels: [arr(s.a, { label, pointers: [ptr(s.i, 'i')], highlights: homeHl(s.a, { [s.h]: s.act === 'dup' ? 'bad' : 'active' }) }), vars({ i: s.i, h: s.h, swaps: s.swaps })],
});
const CYC_IN = [3, 1, 5, 3, 2]; // n = 5: 4 missing, 3 twice
const CYC = cyclic(CYC_IN);
const CYC_DUP = CYC.findIndex((s) => s.act === 'dup');
const CYC_END = CYC[CYC.length - 1].a; // [1, 2, 3, 3, 5]
const CYC_BAD = CYC_END.findIndex((v, j) => v !== j + 1); // 3
const TRI = [2, 3, 1];
const TRUN = cyclic(TRI);
const TRI_SWAPS = TRUN[TRUN.length - 1].swaps; // 2

// findDisappearedNumbers
const DIS_IN = [4, 1, 4, 1];
const DIS = cyclic(DIS_IN);
const DIS_END = DIS[DIS.length - 1].a;
const DIS_SCAN = [];
{
  const missing = [];
  DIS_END.forEach((v, j) => {
    const miss = v !== j + 1;
    if (miss) missing.push(j + 1);
    DIS_SCAN.push({ j, v, miss, missing: missing.slice() });
  });
}

// index marking: findDuplicates
function marking(a0) {
  const a = a0.slice(),
    out = [],
    dup = [];
  for (let i = 0; i < a.length; i++) {
    const raw = a[i],
      v = Math.abs(raw),
      seen = a[v - 1] < 0;
    if (seen) dup.push(v);
    else a[v - 1] = -a[v - 1];
    out.push({ i, raw, v, seen, a: a.slice(), dup: dup.slice() });
  }
  return out;
}
const markHl = (s) => hl(s.a.length, (k) => (k === s.v - 1 ? (s.seen ? 'bad' : 'active') : s.a[k] < 0 ? 'visited' : ''));
const markFrame = (s, say) => ({
  say,
  note: `i = ${s.i}: v = |${s.raw}| = ${s.v}. nums[${s.v - 1}] ${s.seen ? `is negative → ${s.v} seen before: duplicate.` : `= ${-s.a[s.v - 1]} → negate it: ${s.v} is now marked seen.`}`,
  panels: [arr(s.a, { label: 'nums', pointers: [ptr(s.i, 'i', 'b')], highlights: markHl(s) }), vars({ v: s.v, dup: s.dup.length ? `[${s.dup.join(', ')}]` : '[]' })],
});
const MARK_IN = [2, 3, 1, 3, 2];
const MARK = marking(MARK_IN);
const MARK_TURN = 3; // i = 3, v = 3

// why: the input array stores the "seen" facts
const WHY_IN = [3, 1, 3, 4];
const WHY_CYC = cyclic(WHY_IN);
const WHY_CYC_END = WHY_CYC[WHY_CYC.length - 1].a;
const WHY_MARK_END = marking(WHY_IN).at(-1).a;

// first missing positive cleanup (n + 1 replaces out-of-range values)
const FMP = [3, -1, 0, 7];
const FMP_N1 = FMP.length + 1;
const FMP_CLEAN = FMP.map((v) => (v >= 1 && v <= FMP.length ? v : FMP_N1));

// cyclic sort that wrongly advances i after a swap
const ADV_IN = [2, 3, 4, 1];
const ADV_BAD = cyclic(ADV_IN, { advanceAfterSwap: true });
const ADV_OK = cyclic(ADV_IN);

// ---------- voting ----------
function vote(a) {
  let cand = null,
    cnt = 0;
  const out = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    let act;
    if (cnt === 0) {
      cand = x;
      cnt = 1;
      act = 'adopt';
    } else if (x === cand) {
      cnt++;
      act = '+1';
    } else {
      cnt--;
      act = '-1';
    }
    out.push({ i, x, cand, cnt, act });
  }
  return out;
}
const voteNote = (s) => (s.act === 'adopt' ? `count was 0 → ${s.x} becomes the candidate, count = 1.` : s.act === '+1' ? `${s.x} = candidate → count++ → ${s.cnt}.` : `${s.x} ≠ candidate → count-- → ${s.cnt}.`);
const voteFrame = (a, s, say) => ({
  say,
  note: voteNote(s),
  panels: [arr(a, { label: 'votes', pointers: [ptr(s.i, 'x')], highlights: hl(a.length, (k) => (k === s.i ? (s.act === '-1' ? 'bad' : 'active') : k < s.i ? 'visited' : '')) }), vars({ candidate: s.cand, count: s.cnt })],
});
const V_IN = [2, 2, 1, 1, 1, 2, 2];
const VRUN = vote(V_IN);
const V3 = [3, 3, 4, 2, 3];
const V3RUN = vote(V3);
const NOMAJ = [1, 1, 2, 2, 3];
const NMRUN = vote(NOMAJ);
const NM_CAND = NMRUN.at(-1).cand;
const NM_COUNT = NOMAJ.filter((x) => x === NM_CAND).length;

// > n/3 with two candidates
function vote3(a) {
  let c1 = null,
    n1 = 0,
    c2 = null,
    n2 = 0;
  const out = [];
  a.forEach((x, i) => {
    let act;
    if (x === c1) (n1++, (act = 'n1++'));
    else if (x === c2) (n2++, (act = 'n2++'));
    else if (n1 === 0) ((c1 = x), (n1 = 1), (act = 'c1'));
    else if (n2 === 0) ((c2 = x), (n2 = 1), (act = 'c2'));
    else (n1--, n2--, (act = 'both--'));
    out.push({ i, x, c1, n1, c2, n2, act });
  });
  return out;
}
const T3 = [1, 1, 2, 3, 2, 1, 2];
const T3RUN = vote3(T3);
const t3Note = (s) =>
  ({
    'n1++': `${s.x} = c1 → n1++ → ${s.n1}.`,
    'n2++': `${s.x} = c2 → n2++ → ${s.n2}.`,
    c1: `${s.x} matches no candidate, n1 = 0 → c1 = ${s.x}, n1 = 1.`,
    c2: `${s.x} matches no candidate, n2 = 0 → c2 = ${s.x}, n2 = 1.`,
    'both--': `${s.x} matches neither, no empty slot → n1--, n2--. Three different values cancelled.`,
  })[s.act];
const t3Count = (c) => T3.filter((x) => x === c).length;

// template voting: if (cnt === 0) cand = x; cnt += x === cand ? 1 : -1;
const TV = [7, 5, 5, 7, 5];
const TVRUN = vote(TV);

// ---------- next permutation ----------
function nextPerm(a0) {
  const a = a0.slice(),
    n = a.length,
    ev = [];
  let i = n - 2;
  while (i >= 0 && a[i] >= a[i + 1]) {
    ev.push({ phase: 'scan', a: a.slice(), i, ok: true });
    i--;
  }
  ev.push({ phase: 'pivot', a: a.slice(), i });
  if (i >= 0) {
    let j = n - 1;
    while (a[j] <= a[i]) {
      ev.push({ phase: 'seek', a: a.slice(), i, j });
      j--;
    }
    ev.push({ phase: 'found', a: a.slice(), i, j });
    [a[i], a[j]] = [a[j], a[i]];
    ev.push({ phase: 'swap', a: a.slice(), i, j });
  }
  let l = i + 1,
    r = n - 1;
  while (l < r) {
    [a[l], a[r]] = [a[r], a[l]];
    ev.push({ phase: 'rev', a: a.slice(), i, l, r });
    l++;
    r--;
  }
  ev.push({ phase: 'done', a: a.slice(), i });
  return ev;
}
const NP = [1, 3, 5, 4, 2];
const NPRUN = nextPerm(NP);
const npHl = (e) =>
  hl(e.a.length, (k) => {
    if (e.phase === 'scan') return k > e.i ? 'window' : '';
    if (e.phase === 'pivot') return k === e.i ? 'active' : k > e.i ? 'window' : '';
    if (e.phase === 'seek') return k === e.i ? 'active' : k === e.j ? 'muted' : k > e.i ? 'window' : '';
    if (e.phase === 'found' || e.phase === 'swap') return k === e.i || k === e.j ? (e.phase === 'swap' ? 'done' : 'active') : k > e.i ? 'window' : '';
    if (e.phase === 'rev') return k === e.l || k === e.r ? 'active' : k > e.i ? 'window' : '';
    return k > e.i ? 'done' : '';
  });
const npPtrs = (e) => [...(e.i >= 0 && e.phase !== 'scan' ? [ptr(e.i, 'pivot')] : e.phase === 'scan' ? [ptr(e.i, 'i')] : []), ...(e.j !== undefined && e.phase !== 'rev' && e.phase !== 'done' ? [ptr(e.j, 'j', 'b')] : [])];
const npNote = (e) =>
  ({
    scan: () => `a[${e.i}] = ${e.a[e.i]} ≥ a[${e.i + 1}] = ${e.a[e.i + 1]} → still descending from the right, i--.`,
    pivot: () => (e.i >= 0 ? `a[${e.i}] = ${e.a[e.i]} < a[${e.i + 1}] = ${e.a[e.i + 1]} → pivot i = ${e.i}.` : 'No pivot: the whole array is descending.'),
    seek: () => `a[${e.j}] = ${e.a[e.j]} ≤ ${e.a[e.i]} → j--.`,
    found: () => `a[${e.j}] = ${e.a[e.j]} > ${e.a[e.i]}: the smallest larger value in the suffix, j = ${e.j}.`,
    swap: () => `Swap a[${e.i}] and a[${e.j}]. The suffix is still descending.`,
    rev: () => `Reverse the suffix: swap a[${e.l}] and a[${e.r}].`,
    done: () => `Done: [${e.a.join(', ')}].`,
  })[e.phase]();
const npFrame = (e, say, label = 'a') => ({ say, note: npNote(e), panels: [arr(e.a, { label, pointers: npPtrs(e), highlights: npHl(e), ...(e.i >= 0 && e.phase !== 'scan' ? { range: [e.i + 1, e.a.length - 1] } : {}) })] });
const NP2 = [6, 2, 5, 4, 3];
const NP2RUN = nextPerm(NP2);
const NP2_PIVOT = NP2RUN.find((e) => e.phase === 'pivot').i; // 1
const NP2_J = NP2RUN.find((e) => e.phase === 'found').j; // 4
const NP2_SWAPPED = NP2RUN.find((e) => e.phase === 'swap').a;
const DESC = [4, 3, 2, 1];
const TIP = [1, 2, 4, 3];
const TIPRUN = nextPerm(TIP);

export default {
  what: [
    {
      kind: 'watch',
      title: 'Five tools, five free properties',
      lines: [
        '**Kadane:** the best subarray ending at i only depends on the best one ending at i − 1.',
        '**Cyclic sort:** values are in `1..n`, so each value has a home index.',
        '**Index marking:** values are positive, so the sign bit is free to use as a flag.',
        '**Boyer–Moore voting:** a strict majority cannot be cancelled out by everyone else.',
        '**Next permutation:** a descending suffix is already the largest arrangement.',
        'Before reaching for a hash map or a sort, ask what the constraints give you **for free**.',
      ],
      frames: [
        { say: 0, note: 'The best subarray ending at index 4 grows out of the one ending at index 3.', panels: [arr([-3, 4, -1, 2, 1], { label: 'nums', range: [1, 4], highlights: { 1: 'window', 2: 'window', 3: 'window', 4: 'active' } })] },
        { say: 1, note: 'Value v lives at index v − 1: the value says where it belongs.', panels: [arr([1, 2, 3, 4], { label: 'value v at index v − 1', highlights: hl(4, () => 'done') })] },
        { say: 2, note: 'Negative cell = a flag. Here 1 and 2 are marked "seen".', panels: [arr([-2, -3, 1, 4], { label: 'nums', highlights: { 0: 'visited', 1: 'visited' } })] },
        { say: 3, note: '2 appears 3 times out of 5: the two other votes cannot cancel all of them.', panels: [arr([2, 2, 1, 2, 1], { label: 'votes', highlights: { 0: 'active', 1: 'active', 2: 'muted', 3: 'active', 4: 'muted' } })] },
        { say: 4, note: '5, 4, 2 is descending: nothing inside it can grow.', panels: [arr(NP, { label: 'a', range: [2, 4], highlights: { 2: 'window', 3: 'window', 4: 'window' } })] },
        { say: 5, note: 'One or two passes, usually O(1) extra memory, each time.', panels: [vars({ tools: 5, passes: '1–2', 'extra memory': 'usually O(1)' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: what counts as a majority?',
      lines: ['A **majority element** appears **more than** ⌊n/2⌋ times.', 'Strictly more than half.'],
      panels: [vars({ n: 6, '⌊n/2⌋': 3 })],
      task: { type: 'number', question: 'n = 6. At least how many times must a majority element appear?', options: [3, 4, 6], answer: 4, hint: 'More than ⌊6/2⌋ = 3. Exactly 3 is not enough.' },
      solved: 'At least **4** of 6. Exactly half is **not** a majority.',
    },
    {
      kind: 'turn',
      title: 'Your turn: subarray or not?',
      lines: ['A **subarray** is a contiguous, non-empty slice `nums[l..r]`.', 'A **subsequence** may skip elements; a subarray may not.'],
      panels: [arr([5, 8, 1, 9], { label: 'nums' })],
      task: {
        type: 'choose',
        question: 'Which of these is a subarray of `[5, 8, 1, 9]`?',
        options: [
          { text: '[8, 1, 9]', why: '' },
          { text: '[5, 1, 9]', why: 'It skips 8. That makes it a subsequence, not a subarray.' },
          { text: '[]', why: 'A subarray is non-empty.' },
        ],
        answer: 0,
      },
      solved: '`[8, 1, 9]` is `nums[1..3]`: contiguous and non-empty.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'The input array is the memory',
      lines: [
        'To find missing numbers you must remember, for each value, whether you saw it: **n facts**.',
        'With O(1) extra space, the only place big enough is the **input array itself**.',
        '**Cyclic sort** stores "v is present" as: v sits at index v − 1.',
        '**Index marking** stores it as: `nums[v − 1]` is negative.',
      ],
      frames: [
        { say: 0, note: `n = 4. Four facts to remember: is 1 present? 2? 3? 4?`, panels: [arr(WHY_IN, { label: 'nums' }), vars({ 'facts to store': 4 })] },
        { say: 1, note: 'No new array allowed. These 4 cells are the only room we have.', panels: [arr(WHY_IN, { label: 'nums', highlights: hl(4, () => 'window') })] },
        {
          say: 2,
          note: `After cyclic sort: [${WHY_CYC_END.join(', ')}]. Index 1 does not hold 2 → 2 is missing.`,
          panels: [arr(WHY_CYC_END, { label: 'after cyclic sort', highlights: hl(4, (k) => (WHY_CYC_END[k] === k + 1 ? 'done' : 'bad')) })],
        },
        {
          say: 3,
          note: `After marking: [${WHY_MARK_END.join(', ')}]. Index 1 is still positive → 2 was never seen.`,
          panels: [arr(WHY_MARK_END, { label: 'after index marking', highlights: hl(4, (k) => (WHY_MARK_END[k] < 0 ? 'visited' : 'bad')) })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the cost of generating all',
      lines: ['Next permutation, the general way: **generate all** arrangements, O(n!).', 'Pivot-swap-reverse: O(n).'],
      panels: [arr([1, 2, 3, 4], { label: 'a (4 different values)' })],
      task: { type: 'number', question: 'How many arrangements of these 4 values would "generate all" produce?', options: [16, 24, 4], answer: 24, hint: '4! = 4 × 3 × 2 × 1.' },
      solved: '**24** arrangements for just 4 values, and n! explodes. Pivot-swap-reverse is O(n).',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Match the constraint to the tool',
      lines: [
        '"Contiguous subarray" + "largest sum/product", numbers may be **negative** → **Kadane**.',
        '"Values in [1, n]" (or 0..n) + missing / duplicate → **cyclic sort** or **index marking**.',
        '"Appears more than ⌊n/2⌋ (or ⌊n/3⌋) times" → **Boyer–Moore voting**.',
        '"Next lexicographically greater arrangement" → **next permutation**.',
      ],
      frames: [
        { say: 0, note: 'Contiguous + largest sum + negatives → Kadane.', panels: [arr([-2, 1, -3, 4, -1], { label: 'nums', highlights: { 0: 'bad', 2: 'bad', 4: 'bad' } }), vars({ tool: 'Kadane' })] },
        { say: 1, note: 'n = 4 cells, values 1..4 → cyclic sort or marking.', panels: [arr([3, 1, 3, 4], { label: 'values in 1..4' }), vars({ tool: 'cyclic sort / index marking' })] },
        { say: 2, note: 'A "more than a fraction" frequency guarantee → voting.', panels: [arr([2, 2, 1, 2, 1], { label: 'votes' }), vars({ tool: 'Boyer–Moore voting' })] },
        { say: 3, note: 'Next arrangement in dictionary order → next permutation.', panels: [arr(NP, { label: 'a' }), vars({ tool: 'next permutation' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: no negatives at all',
      lines: ['Kadane is for subarrays where numbers may be **negative**.', 'Change the input and the problem can become trivial.'],
      panels: [arr([3, 1, 4, 2], { label: 'nums (all positive)' })],
      task: {
        type: 'choose',
        question: 'Largest-sum contiguous subarray of an all-positive array?',
        options: [
          { text: 'The whole array', why: '' },
          { text: 'Run Kadane to find it', why: 'It would work, but it is not needed: every extra positive element only adds.' },
          { text: 'The single largest element', why: 'Adding any other positive element makes the sum bigger.' },
        ],
        answer: 0,
      },
      solved: 'With only positive numbers the answer is simply **the whole array** (here 10).',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'The quick decision list',
      lines: [
        '1. Contiguous segment, best sum/product, negatives allowed? → **Kadane**.',
        '2. Values fit the indices (1..n in n cells)? → **cyclic sort** (place) or **negation marks** (flag "seen").',
        '3. "More than a fraction" frequency guarantee? → **voting**.',
        '4. Next arrangement in dictionary order? → **pivot, swap, reverse**.',
      ],
      frames: [
        { say: 0, note: 'Clue: "maximum subarray", "maximum product subarray", "circular array".', panels: [vars({ clue: '"largest sum contiguous"', tool: 'Kadane' })] },
        { say: 1, note: 'Clue: "integers in the range [1, n]", "O(1) extra space".', panels: [vars({ clue: '"integers in the range [1, n]"', tool: 'cyclic sort / marks' })] },
        { say: 2, note: 'Clue: "more than ⌊n/2⌋ times".', panels: [vars({ clue: '"more than ⌊n/2⌋ times"', tool: 'voting' })] },
        { say: 3, note: 'Clue: "next permutation".', panels: [vars({ clue: '"next permutation"', tool: 'pivot, swap, reverse' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: read the problem',
      lines: ['Read the constraints, then pick the tool.'],
      panels: [arr([2, 3, 2, 1], { label: 'nums: n = 4, values in [1, 4]' }), vars({ problem: 'return every value that appears twice', limit: 'O(1) extra space' })],
      task: {
        type: 'choose',
        question: 'Which tool fits?',
        options: [
          { text: 'Cyclic sort or negation marks', why: '' },
          { text: "Kadane's algorithm", why: 'Nothing here asks for a best contiguous sum or product.' },
          { text: 'Boyer–Moore voting', why: 'There is no "more than a fraction" guarantee; we want every repeated value.' },
          { text: 'Next permutation', why: 'Nothing asks for the next arrangement.' },
        ],
        answer: 0,
      },
      solved: 'Values fit the indices + O(1) space → **cyclic sort** or **negation marks**.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Fix a start, extend the end',
      lines: [
        'Try every `start`. For each, move `end` right and keep a running `sum` of `nums[start..end]`.',
        'Each new end adds one number to `sum`; `best` keeps the largest sum seen.',
        'Here: start = 3, the start of the winning subarray.',
      ],
      frames: [
        { say: 2, note: `Starts 0, 1 and 2 are done. Their best sum was ${BEST_BEFORE_3}.`, panels: [...halves(NUMS, { ptrs: [ptr(3, 'start', 'b')] }), vars({ start: 3, sum: 0, best: BEST_BEFORE_3 })] },
        ...BRUTE.filter((b) => b.s === 3).map(bruteFrame),
        { say: 2, note: 'Best for start 3 is 6, from [4, -1, 2, 1]. Starts 4..8 never beat it.', panels: [...halves(NUMS, { hi: (k) => (k >= 3 && k <= 6 ? 'done' : ''), range: [3, 6] }), vars({ best: BRUTE.at(-1).best })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how much work is one step?',
      lines: ['The caption calls this better than the naive O(n³) version.', 'The naive one re-sums each subarray from scratch.'],
      panels: [...halves(NUMS, { hi: (k) => (k === 6 ? 'active' : k >= 3 && k < 6 ? 'window' : ''), ptrs: [ptr(3, 'start', 'b'), ptr(6, 'end')], range: [3, 6] }), vars({ 'sum of nums[3..5]': 5 })],
      task: {
        type: 'choose',
        question: '`end` moves from 5 to 6. How does the brute force get the sum of `nums[3..6]`?',
        options: [
          { text: 'sum += nums[6] → 5 + 1 = 6', why: '' },
          { text: 'Add nums[3] + nums[4] + nums[5] + nums[6] again', why: 'That is the naive O(n³) version. The running sum already holds nums[3..5].' },
          { text: 'Restart sum at nums[6]', why: 'That would be a new start. The start stays 3 inside the inner loop.' },
        ],
        answer: 0,
      },
      solved: 'One addition per (start, end): **O(n²)** overall, still quadratic.',
    },
    {
      kind: 'turn',
      title: 'Your turn: count the pairs',
      lines: ['The outer loop picks `start`, the inner loop runs `end` from start to the last index.', 'Every (start, end) pair is one subarray.'],
      panels: [...halves(NUMS), vars({ n: 9 })],
      task: { type: 'number', question: 'For n = 9, how many (start, end) pairs does the double loop visit?', options: [9, 45, 81], answer: BRUTE.length, hint: 'start = 0 visits 9 ends, start = 1 visits 8, … start = 8 visits 1.' },
      solved: `9 + 8 + … + 1 = **${BRUTE.length}** subarrays. Kadane will look at each index once: 9.`,
    },
  ],

  'intuition-kadane': [
    {
      kind: 'watch',
      title: 'Restart or extend at index 3',
      lines: [
        'New question for each index i: the best subarray that **ends exactly at i**, `cur(i)`.',
        'Either just `nums[i]` (**restart**) or `cur(i − 1) + nums[i]` (**extend**).',
        '`cur(i) = max(nums[i], cur(i − 1) + nums[i])`; answer = max over all i.',
      ],
      frames: [
        { say: 0, note: 'Index 3 holds 4. What is the best subarray ending exactly there?', panels: [...halves(NUMS, { hi: (k) => (k === 3 ? 'active' : ''), ptrs: [ptr(3, 'i')] })] },
        { say: 1, note: `Extend: cur(2) = ${KRUN[2].cur}, so cur(2) + 4 = ${KRUN[3].ext}.`, panels: [...halves(NUMS, { hi: (k) => (k === 3 ? 'active' : k === 2 ? 'window' : ''), ptrs: [ptr(3, 'i')], range: [KRUN[2].start, 3] }), vars({ 'cur(2)': KRUN[2].cur, extend: KRUN[3].ext })] },
        { say: 1, note: 'Restart: just [4], sum 4.', panels: [...halves(NUMS, { hi: (k) => (k === 3 ? 'active' : k < 3 ? 'muted' : ''), ptrs: [ptr(3, 'i')], range: [3, 3] }), vars({ restart: 4, extend: KRUN[3].ext })] },
        { say: 2, note: `max(4, ${KRUN[3].ext}) = 4 → restart. cur(3) = 4.`, panels: [...halves(NUMS, { hi: (k) => (k === 3 ? 'done' : k < 3 ? 'muted' : ''), ptrs: [ptr(3, 'i')], range: [3, 3] }), vars({ 'cur(3)': KRUN[3].cur, best: KRUN[3].best })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Walking down the street of shops',
      lines: ['At each shop you gain (+) or lose (−) money.', 'Carrying a **negative** total is a debt: start fresh at the next shop.', 'A positive total helps, so you keep it.'],
      frames: SRUN.map((st) => ({
        say: st.dec === 'restart' ? 1 : st.dec === 'start' ? 0 : 2,
        note: st.dec === 'start' ? `First shop: carrying ${st.cur}.` : st.dec === 'restart' ? `Carrying ${st.ext - st.x} is a debt: ${st.ext} < ${st.x} → start fresh with ${st.cur}.` : `Carrying ${st.ext - st.x} is not a debt → keep it: ${st.ext - st.x} + ${st.x} = ${st.cur}.`,
        panels: [arr(SHOPS, { label: 'shops', pointers: [ptr(st.i, 'you')], range: [st.start, st.i], highlights: hl(SHOPS.length, (k) => (k === st.i ? 'active' : k >= st.start && k < st.i ? 'window' : k < st.start ? 'muted' : '')) }), vars({ carrying: st.cur, 'best total': st.best })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: extending can go down',
      lines: ['`cur` must end **at** i, so it always includes `nums[i]`.', 'Pick the bigger of the two candidates, even if both are bad.'],
      panels: [arr([2, -6], { label: 'nums', pointers: [ptr(1, 'i')], highlights: { 0: 'window', 1: 'active' } }), vars({ 'cur(0)': 2, 'nums[1]': -6 })],
      task: {
        type: 'choose',
        question: 'What is `cur(1)`?',
        options: [
          { text: '-4 (extend: 2 + (-6))', why: '' },
          { text: '-6 (restart)', why: 'Carrying 2 is positive, it helps: -4 > -6.' },
          { text: '2 (keep the old value)', why: '2 ends at index 0. cur(1) must include nums[1].' },
        ],
        answer: 0,
      },
      solved: '`max(-6, 2 + (-6)) = -4`. `cur` went down; `best` still remembers 2.',
    },
    {
      kind: 'turn',
      title: 'Your turn: subarrays ending at i',
      lines: ['Every non-empty subarray ends at **some** index i.', 'Kadane only keeps the best one per ending index.'],
      panels: [arr([-2, 1, -3], { label: 'nums', pointers: [ptr(2, 'i')], highlights: { 2: 'active' } })],
      task: { type: 'number', question: 'How many subarrays end exactly at index 2?', options: [1, 3, 6], answer: 3, hint: 'They all end at index 2; only the start changes: 0, 1 or 2.' },
      solved: '[-3], [1, -3], [-2, 1, -3]. Kadane never lists them: `cur(1) + nums[2]` already stands for the best that extends.',
    },
  ],

  'optimized-kadane-variants': [
    {
      kind: 'watch',
      title: 'Circular: keep everything except the worst middle',
      lines: [
        'A best subarray either does **not wrap** (ordinary Kadane)…',
        '…or **wraps**: everything except a middle piece. Remove the **minimum-sum** subarray.',
        '`answer = max(maxKadane, total − minKadane)`.',
      ],
      frames: [
        { say: 0, note: `No wrap: Kadane finds ${C.bestMax} (the whole array).`, panels: [arr(CIRC, { label: 'nums (wraps around)', range: [0, 2], highlights: hl(3, () => 'window') }), vars({ maxKadane: C.bestMax })] },
        { say: 1, note: `Minimum-sum subarray: [-3], sum ${C.bestMin}.`, panels: [arr(CIRC, { label: 'nums (wraps around)', highlights: { 1: 'bad' } }), vars({ total: C.total, minKadane: C.bestMin })] },
        { say: 1, note: `Remove it: 5 + 5 wraps from the end back to the start. ${C.total} − (${C.bestMin}) = ${C.total - C.bestMin}.`, panels: [arr(CIRC, { label: 'nums (wraps around)', highlights: { 0: 'done', 1: 'muted', 2: 'done' } }), vars({ 'total − min': C.total - C.bestMin })] },
        { say: 2, note: `max(${C.bestMax}, ${C.total - C.bestMin}) = ${C.answer}.`, panels: [vars({ maxKadane: C.bestMax, 'total − minKadane': C.total - C.bestMin, answer: C.answer })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: every number negative',
      lines: ['If every number is negative, the minimum subarray is the **whole** array.', 'Then `total − min` describes an empty subarray.'],
      panels: [arr(NEG, { label: 'nums', highlights: hl(3, () => 'bad') }), vars({ total: CN.total, minKadane: CN.bestMin, maxKadane: CN.bestMax })],
      task: {
        type: 'choose',
        question: 'What should circular Kadane return here?',
        options: [
          { text: `${CN.bestMax} (maxKadane)`, why: '' },
          { text: `0 (total − min)`, why: 'That is the empty subarray, which is not allowed.' },
          { text: `${CN.total} (total)`, why: 'The whole array is a valid subarray, but -1 alone is larger.' },
        ],
        answer: 0,
      },
      solved: `All negative → return **maxKadane**, the largest single element: ${CN.bestMax}.`,
    },
    {
      kind: 'watch',
      title: 'Product: carry the max and the min',
      lines: [
        'Multiplying by a negative flips signs: the **smallest** product can become the **largest**.',
        'candidates = `[nums[i], curMax * nums[i], curMin * nums[i]]`; curMax = max, curMin = min.',
        'A zero makes both 0, and the next element restarts.',
      ],
      frames: PRUN.map((st) => ({
        say: st.x === 0 ? 2 : st.i === 0 ? 1 : st.hi === st.cands[2] && st.cands[2] !== st.x ? 0 : 1,
        note:
          st.i === 0
            ? `Start: curMax = curMin = ${st.x}.`
            : `x = ${st.x}: candidates [${st.cands.map(fmt).join(', ')}] → curMax ${fmt(st.hi)}, curMin ${fmt(st.lo)}.${st.x === 0 ? ' Both 0.' : ''}${st.hi === st.cands[2] && st.cands[2] !== st.x && st.cands[2] !== st.cands[1] ? ' The max came from the old curMin.' : ''}`,
        panels: [arr(PROD, { label: 'nums', pointers: [ptr(st.i, 'i')], highlights: hl(PROD.length, (k) => (k === st.i ? 'active' : k < st.i ? 'visited' : '')) }), vars({ curMax: fmt(st.hi), curMin: fmt(st.lo), best: st.best })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: one more step',
      lines: ['Same rule: compute all three candidates from the **old** curMax and curMin.'],
      panels: [arr([-1, 4, -3], { label: 'nums', pointers: [ptr(2, 'i')], highlights: { 0: 'visited', 1: 'visited', 2: 'active' } }), vars({ curMax: product([-1, 4]).at(-1).hi, curMin: product([-1, 4]).at(-1).lo })],
      task: { type: 'number', question: 'x = -3. What is the new curMax?', options: [4, -12, 12], answer: product([-1, 4, -3]).at(-1).hi, hint: 'Candidates: -3, 4 × -3, -4 × -3.' },
      solved: 'Candidates -3, -12, **12**. The 12 comes from curMin × -3: the whole array [-1, 4, -3].',
    },
  ],

  'implementation-kadane': [
    {
      kind: 'watch',
      title: 'Tracking the range',
      lines: [
        '`start` moves to i on every **restart**.',
        'When `cur > best`, save `best` and the range `[start, i]`.',
        'Initialise with `nums[0]`, never 0, when the subarray must be non-empty.',
      ],
      frames: RRUN.map((st) => ({
        say: st.i === 0 ? 2 : st.dec === 'restart' ? 0 : 1,
        note:
          st.i === 0
            ? `cur = best = nums[0] = ${st.cur}, range [0, 0].`
            : `i = ${st.i}: ${st.dec === 'restart' ? `${st.ext} < ${st.x} → restart, start = ${st.i}` : `extend, cur = ${st.cur}`}.${st.best === st.cur && st.br === st.i ? ` cur > best → best = ${st.best}, range [${st.bl}, ${st.br}].` : ''}`,
        panels: [
          arr(RANGE_IN, { label: 'nums', pointers: [ptr(st.i, 'i'), ...(st.start !== st.i ? [ptr(st.start, 'start', 'b')] : [])], range: [st.bl, st.br], highlights: hl(RANGE_IN.length, (k) => (k === st.i ? 'active' : k >= st.start && k < st.i ? 'window' : '')) }),
          vars({ cur: st.cur, start: st.start, best: st.best, 'range [bestL, bestR]': `[${st.bl}, ${st.br}]` }),
        ],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the update-order bug',
      lines: ['Product version: compute both products from the **old** values first.', 'Assigning `curMax` and then using it for `curMin` is a classic bug.'],
      panels: [vars({ 'old curMax': BUG.hi, 'old curMin': BUG.lo, x: BUG.x }), code('curMax = Math.max(x, curMax * x, curMin * x);\ncurMin = Math.min(x, curMax * x, curMin * x);')],
      task: { type: 'number', question: 'With this buggy order, what does curMin become?', options: [BUG_RIGHT.lo, BUG_LO, BUG.lo * BUG.x], answer: BUG_LO, hint: `curMax becomes ${BUG_HI} first; then curMin uses ${BUG_HI} × ${BUG.x}.` },
      solved: `Buggy curMin = **${BUG_LO}**. With \`const a = curMax * x, b = curMin * x;\` first, curMin = min(${BUG.x}, ${BUG.hi * BUG.x}, ${BUG.lo * BUG.x}) = ${BUG_RIGHT.lo}.`,
    },
  ],

  'dry-run-kadane': [
    {
      kind: 'watch',
      title: 'maxSubArray, rows i = 0 to 4',
      lines: ['Each row: compare `cur + nums[i]` with `nums[i]`, keep the larger as `cur`.', '`best` only goes up.'],
      frames: KRUN.slice(0, 5).map((st) => kFrame(st, st.i === 0 ? 1 : 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: row i = 5',
      lines: ['cur = 3 after i = 4. Now nums[5] = 2.'],
      panels: kFrame(KRUN[4], 0).panels,
      task: { type: 'number', question: 'What is `best` after i = 5?', options: [4, 5, 6], answer: KRUN[5].best, hint: 'cur + nums[5] = 3 + 2. Is that more than the old best, 4?' },
      solved: 'Extend: cur = 5 > 4, so **best = 5**.',
      then: KRUN.slice(5).map((st) => kFrame(st, 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: where did the winner start?',
      lines: ['best = 6 at i = 6.', 'Its subarray began at the last restart before that.'],
      panels: [...halves(NUMS, { hi: (k) => (k === 6 ? 'done' : '') })],
      task: { type: 'cell', question: 'Tap the first element of the winning subarray.', answer: KRUN[6].start, hints: { 1: 'i = 1 was a restart, but i = 3 restarted again later.', 0: 'cur restarted after index 0.' } },
      solved: 'The restart at **i = 3** starts the winning subarray [4, -1, 2, 1].',
    },
  ],

  'intuition-cyclic': [
    {
      kind: 'turn',
      title: 'Your turn: send the value home',
      lines: ['Length n, values from 1..n: **value v belongs at index v − 1**.', 'No comparison sort needed.'],
      panels: [arr(CYC_IN, { label: 'nums (n = 5)', pointers: [ptr(0, 'i')], highlights: { 0: 'active' } })],
      task: { type: 'cell', question: '`nums[0] = 3`. Tap its home.', answer: 2, hints: { 3: 'Index 3 is the home of 4.', 0: 'Index 0 is the home of 1.' } },
      solved: 'Home of 3 is index **2**. Swap, and do **not** advance i: a new value just arrived at i.',
      then: CYC.slice(0, CYC_DUP).map((s) => cycFrame(s, s.act === 'swap' ? 0 : 1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: the home is taken',
      lines: ['Swap when `nums[h]` is not already `nums[i]`.', 'Otherwise (home, or home holds a copy, or out of range), advance i.'],
      panels: [arr(CYC[CYC_DUP - 1].a, { label: 'nums', pointers: [ptr(3, 'i')], highlights: homeHl(CYC[CYC_DUP - 1].a, { 3: 'active', 2: 'window' }) }), vars({ i: 3, 'nums[i]': 3, h: 2, 'nums[h]': 3 })],
      task: {
        type: 'choose',
        question: 'i = 3 holds 3, and index 2 already holds 3. What now?',
        options: [
          { text: 'Advance i: this 3 is a duplicate', why: '' },
          { text: 'Swap nums[3] and nums[2]', why: 'Both are 3: the swap changes nothing.' },
          { text: 'Stop the loop', why: 'Index 4 has not been checked yet.' },
        ],
        answer: 0,
      },
      solved: 'Its home already holds a copy → **duplicate**, i++.',
      then: CYC.slice(CYC_DUP).map((s) => cycFrame(s, 1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: read the answer off',
      lines: ['After the pass, scan once.', 'Index j with `nums[j] !== j + 1`: value j + 1 is **missing**, the value there is a **duplicate**.'],
      panels: [arr(CYC_END, { label: 'nums after the pass' })],
      task: { type: 'cell', question: 'Tap the cell that exposes the missing number.', answer: CYC_BAD, hints: { 2: 'Index 2 holds 3 = 2 + 1: correct.', 4: 'Index 4 holds 5 = 4 + 1: correct.' } },
      solved: `Index ${CYC_BAD} should hold ${CYC_BAD + 1} but holds ${CYC_END[CYC_BAD]}: **${CYC_BAD + 1} is missing, ${CYC_END[CYC_BAD]} is the duplicate**.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: count the swaps',
      lines: ['Every swap puts one value in its final slot.', 'A correctly placed value is never swapped again.'],
      panels: [arr(TRI, { label: 'nums', pointers: [ptr(0, 'i')] })],
      task: { type: 'number', question: 'How many swaps until every value in [2, 3, 1] is home?', options: [1, 2, 3], answer: TRI_SWAPS, hint: 'Each swap fixes one value for good. Once two of three are home, the third has nowhere else to be.' },
      solved: `**${TRI_SWAPS}** swaps. Swaps plus increments of i stay ≤ 2n → O(n).`,
      then: TRUN.map((s) => cycFrame(s, 0)),
    },
  ],

  'implementation-cyclic': [
    {
      kind: 'watch',
      title: 'findDisappearedNumbers',
      lines: ['The while loop sends each value home; `i++` only when no swap is needed.', 'Then one scan: every `j` with `nums[j] !== j + 1` pushes `j + 1` into `missing`.'],
      frames: [
        ...DIS.map((s) => cycFrame(s, 0)),
        ...DIS_SCAN.map((s) => ({
          say: 1,
          note: s.miss ? `j = ${s.j}: ${s.v} ≠ ${s.j + 1} → push ${s.j + 1}.` : `j = ${s.j}: ${s.v} = ${s.j + 1} ✓.`,
          panels: [arr(DIS_END, { label: 'nums', pointers: [ptr(s.j, 'j', 'b')], highlights: hl(4, (k) => (k === s.j ? (s.miss ? 'bad' : 'done') : '')) }), vars({ missing: `[${s.missing.join(', ')}]` })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where is the mark?',
      lines: ['**Index marking**: values are positive, so the sign of `nums[v − 1]` is a free bit.', 'Negative means "v has been seen". Read the value with `Math.abs`.'],
      panels: markFrame(MARK[MARK_TURN - 1], 0).panels.map((p, k) => (k === 0 ? { ...p, pointers: [ptr(MARK_TURN, 'i', 'b')], highlights: hl(5, (j) => (j === MARK_TURN ? 'active' : p.values[j] < 0 ? 'visited' : '')) } : p)),
      task: { type: 'cell', question: `i = ${MARK_TURN}, v = ${MARK[MARK_TURN].v}. Tap the cell that says whether ${MARK[MARK_TURN].v} was seen.`, answer: MARK[MARK_TURN].v - 1, hints: { [MARK_TURN]: 'That is where v came from. The flag for v lives at index v − 1.' } },
      solved: `nums[${MARK[MARK_TURN].v - 1}] is already negative → ${MARK[MARK_TURN].v} is a **duplicate**.`,
      then: MARK.map((s, k) => markFrame(s, k === 0 ? 0 : 1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: First Missing Positive cleanup',
      lines: ['With 0, negatives or values > n, neither trick works directly.', 'The marking version first replaces out-of-range values by **n + 1**.'],
      panels: [arr(FMP, { label: `nums (n = ${FMP.length})`, highlights: hl(FMP.length, (k) => (FMP[k] >= 1 && FMP[k] <= FMP.length ? '' : 'bad')) })],
      task: { type: 'number', question: 'What value replaces -1, 0 and 7?', options: [0, FMP.length, FMP_N1], answer: FMP_N1, hint: 'n + 1, with n = 4.' },
      solved: `Every cell is now positive, ready for marking. (Cyclic sort instead just **skips** values outside 1..n.)`,
      then: [{ say: 1, note: `[${FMP.join(', ')}] → [${FMP_CLEAN.join(', ')}].`, panels: [arr(FMP_CLEAN, { label: 'nums after cleanup', highlights: hl(FMP.length, (k) => (FMP[k] === FMP_CLEAN[k] ? '' : 'active')) })] }],
    },
  ],

  'intuition-voting': [
    {
      kind: 'watch',
      title: 'One candidate, one counter',
      lines: ['`count === 0` → the current element becomes the candidate.', 'Same as candidate → `count++`.', 'Different → `count--`: one supporter cancelled against this voter.'],
      frames: VRUN.map((s) => voteFrame(V_IN, s, s.act === 'adopt' ? 0 : s.act === '+1' ? 1 : 2)),
    },
    {
      kind: 'turn',
      title: 'Your turn: the final count',
      lines: ['Each decrement cancels **two different values**.', 'So `count` is what survives the pairing, not how often the value appears.'],
      panels: [arr(V3, { label: 'votes' }), vars({ candidate: '—', count: 0 })],
      task: { type: 'number', question: `Run voting on [${V3.join(', ')}]. What is count at the end?`, options: [1, 2, 3], answer: V3RUN.at(-1).cnt, hint: '3, 3 → count 2. Then 4 and 2 each cancel one.' },
      solved: `Candidate ${V3RUN.at(-1).cand}, count **${V3RUN.at(-1).cnt}**, even though 3 appears 3 times.`,
      then: V3RUN.map((s) => voteFrame(V3, s, 0)),
    },
    {
      kind: 'watch',
      title: 'No majority: verify the survivor',
      lines: ['If no majority exists, the final candidate is just "someone".', 'A second pass counts it.'],
      frames: [
        ...NMRUN.map((s) => voteFrame(NOMAJ, s, 0)),
        {
          say: 1,
          note: `Verify: ${NM_CAND} appears ${NM_COUNT} time${NM_COUNT === 1 ? '' : 's'}, not more than ⌊${NOMAJ.length}/2⌋ = ${Math.floor(NOMAJ.length / 2)}. No majority.`,
          panels: [arr(NOMAJ, { label: 'votes', highlights: hl(NOMAJ.length, (k) => (NOMAJ[k] === NM_CAND ? 'bad' : '')) }), vars({ candidate: NM_CAND, 'real count': NM_COUNT })],
        },
      ],
    },
    {
      kind: 'watch',
      title: 'More than n/3: two candidates',
      lines: [
        'At most **two** values can appear more than n/3 times.',
        'A value matching neither, with no empty slot, **decrements both**: three different values cancel.',
        'Survivors must be verified with a second pass.',
      ],
      frames: [
        ...T3RUN.map((s) => ({
          say: s.act === 'both--' ? 1 : 0,
          note: t3Note(s),
          panels: [arr(T3, { label: 'nums', pointers: [ptr(s.i, 'x')], highlights: hl(T3.length, (k) => (k === s.i ? (s.act === 'both--' ? 'bad' : 'active') : k < s.i ? 'visited' : '')) }), vars({ c1: s.c1, n1: s.n1, c2: s.c2 ?? '—', n2: s.n2 })],
        })),
        {
          say: 2,
          note: `Verify: ${T3RUN.at(-1).c1} appears ${t3Count(T3RUN.at(-1).c1)} times, ${T3RUN.at(-1).c2} appears ${t3Count(T3RUN.at(-1).c2)} times. Both > ${T3.length}/3.`,
          panels: [arr(T3, { label: 'nums', highlights: hl(T3.length, (k) => (T3[k] === 3 ? 'muted' : 'done')) }), vars({ result: `[${T3RUN.at(-1).c1}, ${T3RUN.at(-1).c2}]` })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which check first?',
      lines: ['Check "equals a candidate" **before** "a slot is empty".'],
      panels: [vars({ c1: 1, n1: 0, c2: 2, n2: 1, x: 2 })],
      task: {
        type: 'choose',
        question: 'x = 2 arrives. With the lesson\'s order, what happens?',
        options: [
          { text: 'n2++ (2 already is c2)', why: '' },
          { text: 'c1 = 2, n1 = 1 (slot 1 is empty)', why: 'Then 2 would occupy both slots. That is why the candidate check comes first.' },
          { text: 'n1--, n2--', why: 'Only a value that matches neither candidate and finds no empty slot decrements both.' },
        ],
        answer: 0,
      },
      solved: 'x === c2 is checked before n1 === 0, so **n2 becomes 2** and the value stays in one slot.',
    },
  ],

  'optimized-next-permutation': [
    {
      kind: 'watch',
      title: 'Pivot, swap, reverse on [1, 3, 5, 4, 2]',
      lines: [
        'Read the array like a number: 13542. We want the smallest bigger one.',
        '**Find the pivot:** scan from the right while non-increasing; the first index to its left is the pivot.',
        '**Swap** the pivot with the smallest larger value to its right (scan from the right).',
        '**Reverse** the still-descending suffix to make it ascending.',
      ],
      frames: [
        { say: 0, note: '[1, 3, 5, 4, 2] ≈ 13542. Change it as far to the right as possible.', panels: [arr(NP, { label: 'a' })] },
        ...NPRUN.map((e) => npFrame(e, e.phase === 'scan' || e.phase === 'pivot' ? 1 : e.phase === 'seek' || e.phase === 'found' || e.phase === 'swap' ? 2 : 3)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: find the pivot',
      lines: ['Scan from the right while the sequence is non-increasing.', 'The pivot is the rightmost position that **can** be increased.'],
      panels: [arr(NP2, { label: 'a' })],
      task: { type: 'cell', question: 'Tap the pivot.', answer: NP2_PIVOT, hints: { 0: '6 could grow, but 2 is further right and can grow too.', 2: '5 ≥ 4 ≥ 3: 5 is inside the descending suffix.', 3: '4 ≥ 3: still descending.' } },
      solved: `5, 4, 3 is descending; 2 < 5 → pivot at index **${NP2_PIVOT}**.`,
      then: NP2RUN.filter((e) => e.phase === 'scan' || e.phase === 'pivot').map((e) => npFrame(e, 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: who swaps with the pivot?',
      lines: ['Swap the pivot with the **smallest value larger than it** in the suffix.', 'The suffix is descending, so scanning from the right finds it first.'],
      panels: [arr(NP2, { label: 'a', pointers: [ptr(NP2_PIVOT, 'pivot')], range: [NP2_PIVOT + 1, NP2.length - 1], highlights: { [NP2_PIVOT]: 'active', 2: 'window', 3: 'window', 4: 'window' } })],
      task: { type: 'cell', question: 'Tap the value that swaps with 2.', answer: NP2_J, hints: { 2: '5 > 2, but 3 is a smaller value that is still > 2.', 3: '4 > 2, but 3 is smaller and still > 2.', 0: 'Only the suffix right of the pivot is searched.' } },
      solved: `3 at index ${NP2_J} → [${NP2_SWAPPED.join(', ')}], then reverse the suffix.`,
      then: NP2RUN.filter((e) => !['scan', 'pivot'].includes(e.phase)).map((e) => npFrame(e, e.phase === 'rev' || e.phase === 'done' ? 1 : 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: the last permutation',
      lines: ['If no pivot exists, the whole array is descending.', 'That is the **last** permutation.'],
      panels: [arr(DESC, { label: 'a', range: [0, 3], highlights: hl(4, () => 'window') })],
      task: {
        type: 'choose',
        question: 'What does next permutation produce for [4, 3, 2, 1]?',
        options: [
          { text: '[1, 2, 3, 4]', why: '' },
          { text: '[4, 3, 2, 1] unchanged', why: 'The algorithm still reverses everything to wrap around.' },
          { text: '[3, 4, 2, 1]', why: 'That would need a pivot. Scanning from the right never finds a[i] < a[i + 1].' },
        ],
        answer: 0,
      },
      solved: 'No pivot → **reverse everything** to get the first permutation.',
      then: nextPerm(DESC).map((e) => npFrame(e, 1)),
    },
  ],

  template: [
    {
      kind: 'turn',
      title: 'Your turn: assemble next permutation',
      lines: ['Four lines of the template, shuffled.'],
      panels: [arr(TIP, { label: 'a' })],
      task: {
        type: 'order',
        question: 'Put the template steps in order.',
        items: ['i = n − 2; while a[i] ≥ a[i + 1]: i--', 'j = n − 1; while a[j] ≤ a[i]: j--', 'swap a[i] and a[j]', 'reverse(a, i + 1, n − 1)'],
        hint: 'Pivot first, then its partner, then the swap; the suffix comes last.',
      },
      solved: 'Scan, search, swap, reverse. The swap is skipped when i < 0.',
      then: TIPRUN.map((e) => npFrame(e, 0)),
    },
    {
      kind: 'watch',
      title: 'The compact voting line',
      lines: ['`if (cnt === 0) cand = x;` then `cnt += x === cand ? 1 : -1;`', 'Adopting a new candidate and counting its vote happen in the same iteration.'],
      frames: TVRUN.map((s) => ({
        say: s.act === 'adopt' ? 0 : 1,
        note: s.act === 'adopt' ? `cnt was 0 → cand = ${s.x}; then x === cand → cnt = 1.` : `cnt += ${s.act === '+1' ? 1 : -1} → ${s.cnt}.`,
        panels: [arr(TV, { label: 'nums', pointers: [ptr(s.i, 'x')], highlights: hl(TV.length, (k) => (k === s.i ? (s.act === '-1' ? 'bad' : 'active') : k < s.i ? 'visited' : '')) }), vars({ cand: s.cand, cnt: s.cnt })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the range guard',
      lines: ['The cyclic sort template swaps only if `nums[i] >= 1 && nums[i] <= n && nums[h] !== nums[i]`.'],
      panels: [arr([0, 3, 5, 1], { label: 'nums (n = 4)', pointers: [ptr(2, 'i')], highlights: { 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'i = 2 holds 5, and n = 4. What does the template do?',
        options: [
          { text: 'i++: 5 has no home', why: '' },
          { text: 'Swap with nums[4]', why: 'Index 4 does not exist; the guard stops this.' },
          { text: 'Replace 5 with 0', why: 'The template never rewrites values; it only swaps or advances.' },
        ],
        answer: 0,
      },
      solved: 'Out-of-range values fail the guard and are **skipped**.',
    },
  ],

  mistakes: [
    {
      kind: 'turn',
      title: 'Your turn: best = 0',
      lines: ['Mistake 1: **Kadane with `best = 0`**.'],
      panels: [arr([-4, -2, -7], { label: 'nums' }), code('let cur = nums[0], best = 0;')],
      task: { type: 'number', question: 'What does this version return?', options: [0, -2, -4], answer: 0, hint: 'Every cur is negative, so max(best, cur) never beats 0.' },
      solved: 'It returns **0**. All-negative input must return the largest element, **-2**.',
    },
    {
      kind: 'watch',
      title: 'Advancing i after a swap',
      lines: ['Mistake 5: **advancing i after a swap** in cyclic sort.', 'The newly arrived value is never placed.'],
      frames: [
        ...ADV_BAD.map((s) => ({ ...cycFrame(s, 1, 'nums (buggy: i++ after swap)'), note: s.act === 'swap' ? `i = ${s.i}: swap ${s.v} home, then i++ anyway. ${s.a[s.i]} is left at index ${s.i}.` : cycNote(s) })),
        {
          say: 1,
          note: `End: [${ADV_BAD.at(-1).a.join(', ')}]. Nothing was missing, but the scan would report ${ADV_BAD.at(-1).a.map((v, k) => (v !== k + 1 ? k + 1 : null)).filter(Boolean).join(' and ')} as missing.`,
          panels: [arr(ADV_BAD.at(-1).a, { label: 'buggy result', highlights: homeHl(ADV_BAD.at(-1).a, Object.fromEntries(ADV_BAD.at(-1).a.map((v, k) => [k, v === k + 1 ? 'done' : 'bad']))) }), arr(ADV_OK.at(-1).a, { label: 'correct: i stays after a swap', highlights: homeHl(ADV_OK.at(-1).a) })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: name the mistake',
      lines: ['Product Kadane, the update step.'],
      panels: [code('curMax = Math.max(x, curMax * x, curMin * x);\ncurMin = Math.min(x, curMax * x, curMin * x);')],
      task: {
        type: 'choose',
        question: 'What is wrong?',
        options: [
          { text: 'curMin is computed from the new curMax, not the old one', why: '' },
          { text: 'It should reset to 0 on a negative', why: 'Resetting to 0 means an empty subarray. Including x as a candidate already restarts.' },
          { text: 'Nothing, it is correct', why: 'The second line reads curMax after it was overwritten.' },
        ],
        answer: 0,
      },
      solved: 'Mistake 3: compute `a = curMax * x`, `b = curMin * x` **first**, then assign both.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Next permutation in one sentence',
      lines: ['"Find the **rightmost digit that can grow**,', '**grow it minimally**,', 'make the rest **as small as possible**."'],
      frames: [
        npFrame(TIPRUN.find((e) => e.phase === 'pivot'), 0),
        npFrame(TIPRUN.find((e) => e.phase === 'swap'), 1),
        npFrame(TIPRUN.at(-1), 2),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: no modifying the input',
      lines: ['Ask whether you are allowed to **modify the input**.'],
      panels: [arr([3, 1, 3, 4], { label: 'nums (read-only)', highlights: hl(4, () => 'muted') })],
      task: {
        type: 'choose',
        question: 'If the input must stay unchanged, which tools are off the table?',
        options: [
          { text: 'Cyclic sort and index marking', why: '' },
          { text: "Kadane's algorithm", why: 'Kadane only reads the array and keeps a few variables.' },
          { text: 'Boyer–Moore voting', why: 'Voting only reads the array and keeps a candidate and a count.' },
        ],
        answer: 0,
      },
      solved: 'Cyclic sort moves values and marking negates them. Either avoid them **or restore the array afterwards**.',
    },
  ],
};
