// Shorts for Heaps (M9). Format: src/content/shortSchema.js. Facts come only from topics/heaps/topic.js.
// Every heap below is produced by running the pattern's template on its "e.g." input with a real binary heap
// (the lesson's push / pop: parent (i - 1) >> 1, children 2i + 1 and 2i + 2, comparator negative = a first).
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const list = (xs) => `[${xs.join(', ')}]`;
const check = (cond, msg) => {
  if (!cond) throw new Error(`heaps shorts: ${msg}`);
};

// ---------- the heap ----------
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
  const top = a[0];
  const last = a.pop();
  if (a.length) {
    a[0] = last;
    let i = 0;
    while (true) {
      const l = 2 * i + 1,
        r = l + 1;
      let best = i;
      if (l < a.length && cmp(a[l], a[best]) < 0) best = l;
      if (r < a.length && cmp(a[r], a[best]) < 0) best = r;
      if (best === i) break;
      [a[i], a[best]] = [a[best], a[i]];
      i = best;
    }
  }
  return top;
}

// the tree picture (same layout as the step lessons); `cap` fixes the layout for a sequence of pictures
const lvl = (i) => Math.floor(Math.log2(i + 1));
function heapTree(a, st = {}, { cap = a.length, label, show = String } = {}) {
  const D = lvl(Math.max(cap, 1) - 1);
  const nodes = a.map((v, i) => {
    const d = lvl(i);
    return { id: `h${i}`, label: String(show(v)), x: (i - (2 ** d - 1) + 0.5) * 2 ** (D - d), y: d, ...(st[i] ? { state: st[i] } : {}) };
  });
  const edges = a.slice(1).map((_, k) => ({ from: `h${(k + 1 - 1) >> 1}`, to: `h${k + 1}` }));
  return { kind: 'nodes', ...(label ? { label } : {}), nodes, edges };
}
const heapArr = (a, st = {}, label = 'heap array', show = String) => arr(a.map(show), { label, highlights: { ...st } });
const pic = (a, st = {}, o = {}) => [heapTree(a, st, o), heapArr(a, st, o.arrLabel, o.show)];
const asc = (a) => [...a].sort(MIN);

// ---------- Top K: e.g. stream [5, 9, 2, 7, 4, 8], k = 3, min-heap of size k ----------
const TK = [5, 9, 2, 7, 4, 8];
const K = 3;
const tkFrames = [];
const TKH = [];
{
  for (const x of TK.slice(0, K)) hpush(TKH, x);
  tkFrames.push({ say: 0, note: `push 5, 9, 2: size ≤ k = 3, keep all. The top, ${TKH[0]}, is the weakest of the three.`, panels: [...pic(TKH, { 0: 'active' }, { cap: 4 }), vars({ size: TKH.length, k: K })] });
  for (const x of TK.slice(K)) {
    hpush(TKH, x);
    tkFrames.push({ say: 1, note: `push ${x}: size ${TKH.length} > k. The top, ${TKH[0]}, is the weakest of the four.`, panels: [...pic(TKH, { [TKH.indexOf(x)]: 'active', 0: 'bad' }, { cap: 4 }), vars({ x, size: TKH.length, k: K })] });
    const out = hpop(TKH);
    tkFrames.push({
      say: 1,
      note: out === x ? `pop ${out}: the newcomer itself was the weakest, so it is thrown straight out.` : `pop ${out}: evicted. The best 3 so far: ${asc(TKH).join(', ')}.`,
      panels: [...pic(TKH, { 0: 'visited' }, { cap: 4 }), vars({ evicted: out, size: TKH.length })],
    });
  }
  check(TKH[0] === [...TK].sort(MAX)[K - 1], 'peek is the 3rd largest');
  tkFrames.push({ say: 2, note: `Done: the 3 largest are ${[...TKH].sort(MAX).join(', ')}. peek() = ${TKH[0]} = the 3rd largest.`, panels: [...pic(TKH, { 0: 'done' }, { cap: 4 }), vars({ kth: TKH[0] })] });
}
// the turn's answer, run for real: k smallest with a MAX-heap of size k
const TKS = [];
for (const x of TK) {
  hpush(TKS, x, MAX);
  if (TKS.length > K) hpop(TKS, MAX);
}
check(TKS[0] === asc(TK)[K - 1], 'max-heap top is the 3rd smallest');

// ---------- Two heaps: e.g. stream 5, 1, 8, 3, then 10 ----------
const twoPanels = (low, high, st = {}, v = {}) => [heapTree(low, st.low || {}, { cap: 3, label: 'low (max-heap)' }), heapTree(high, st.high || {}, { cap: 3, label: 'high (min-heap)' }), vars(v)];
const med = (low, high) => (low.length > high.length ? low[0] : (low[0] + high[0]) / 2);
function add(low, high, x) {
  const steps = [];
  hpush(low, x, MAX);
  steps.push({ what: 'push', low: [...low], high: [...high] });
  const moved = hpop(low, MAX);
  hpush(high, moved);
  steps.push({ what: 'move', moved, low: [...low], high: [...high] });
  let back = null;
  if (high.length > low.length) {
    back = hpop(high);
    hpush(low, back, MAX);
  }
  steps.push({ what: 'rebalance', back, low: [...low], high: [...high] });
  return { steps, moved, back, median: med(low, high) };
}
const LO = [],
  HI = [];
const twFrames = [];
const SEEN = [];
for (const x of [5, 1, 8]) {
  const r = add(LO, HI, x);
  SEEN.push(x);
  twFrames.push({
    say: 1,
    note: `add(${x}): ${r.moved} crosses to high${r.back !== null ? `, ${r.back} comes back` : ''}. Median ${r.median}.`,
    panels: twoPanels(LO, HI, { low: { 0: 'done' }, high: LO.length > HI.length ? {} : { 0: 'done' } }, { seen: list(SEEN), median: r.median }),
  });
}
const A3 = add(LO, HI, 3);
SEEN.push(3);
twFrames.push(
  { say: 1, note: 'add(3), step 1: push 3 into low.', panels: twoPanels(A3.steps[0].low, A3.steps[0].high, { low: { [A3.steps[0].low.indexOf(3)]: 'active' } }, { x: 3 }) },
  { say: 1, note: `Step 2: low's top, ${A3.moved}, crosses to high. Every value in low stays ≤ every value in high.`, panels: twoPanels(A3.steps[1].low, A3.steps[1].high, { high: { [A3.steps[1].high.indexOf(A3.moved)]: 'active' } }, { x: 3, moved: A3.moved }) },
  { say: 2, note: `high has ${A3.steps[1].high.length}, low ${A3.steps[1].low.length}: equal, so nothing moves back.`, panels: twoPanels(LO, HI, {}, { x: 3 }) },
  { say: 3, note: `Even count: median = (${LO[0]} + ${HI[0]}) / 2 = ${A3.median}. Sorted it would be 1, 3, 5, 8.`, panels: twoPanels(LO, HI, { low: { 0: 'done' }, high: { 0: 'done' } }, { seen: list(SEEN), median: A3.median }) },
);
check(A3.back === null && A3.median === 4, 'after 5 1 8 3 the median is 4');
const LO4 = [...LO],
  HI4 = [...HI];
// the skipped step: push 10 straight into low, rebalance only
const BAD_LO = hpush([...LO4], 10, MAX);
check(BAD_LO.length - HI4.length === 1 && BAD_LO[0] === 10, 'skipping the crossing puts 10 on low');
const A10 = add(LO, HI, 10);
check(A10.median === 5 && A10.back === 5, 'add(10): 5 comes back, median 5');
const tw10Frames = [
  { note: 'Real add(10), step 1: push 10 into low.', panels: twoPanels(A10.steps[0].low, A10.steps[0].high, { low: { 0: 'active' } }, { x: 10 }) },
  { note: `Step 2: low's top is 10, so 10 crosses to high: it lands in the half where it belongs.`, panels: twoPanels(A10.steps[1].low, A10.steps[1].high, { high: { [A10.steps[1].high.indexOf(10)]: 'active' } }, { x: 10, moved: 10 }) },
  { note: `high has 3, low 2: move high's top, ${A10.back}, back. Odd count: median = low.peek() = ${A10.median}.`, panels: twoPanels(LO, HI, { low: { 0: 'done' } }, { seen: list([...SEEN, 10]), median: A10.median }) },
];

// ---------- K-way merge: e.g. L0 = [2, 6, 9], L1 = [1, 7], L2 = [4, 5] ----------
const LISTS = [
  [2, 6, 9],
  [1, 7],
  [4, 5],
];
const N = LISTS.flat().length;
const KCMP = (a, b) => a.v - b.v;
const kshow = (e) => `${e.v}·L${e.i}`;
const kwPanels = (heap, out, popped) => {
  const inHeap = new Set(heap.map((e) => `${e.i},${e.j}`));
  return [
    table(
      LISTS.map((_, i) => `L${i}`),
      ['0', '1', '2'],
      LISTS.map((l) => [0, 1, 2].map((j) => (j < l.length ? l[j] : '—'))),
      LISTS.map((l, i) => [0, 1, 2].map((j) => (j >= l.length ? '' : popped.has(`${i},${j}`) ? 'muted' : inHeap.has(`${i},${j}`) ? 'active' : ''))),
    ),
    heapTree(heap, heap.length ? { 0: 'active' } : {}, { cap: 3, label: 'min-heap of heads', show: kshow }),
    arr([...out, ...Array(N - out.length).fill('·')], { label: 'out', highlights: out.length ? { [out.length - 1]: 'done' } : {} }),
  ];
};
const kwFrames = [];
{
  const heap = [];
  const out = [];
  const popped = new Set();
  LISTS.forEach((l, i) => l.length && hpush(heap, { v: l[0], i, j: 0 }, KCMP));
  kwFrames.push({ say: 0, note: `Push each list's head with its list and position: ${LISTS.map((l) => l[0]).join(', ')}. k = 3 entries.`, panels: kwPanels(heap, out, popped) });
  let most = heap.length;
  while (heap.length) {
    const { v, i, j } = hpop(heap, KCMP);
    out.push(v);
    popped.add(`${i},${j}`);
    const next = j + 1 < LISTS[i].length;
    if (next) hpush(heap, { v: LISTS[i][j + 1], i, j: j + 1 }, KCMP);
    most = Math.max(most, heap.length);
    kwFrames.push({
      say: next ? 1 : 2,
      note: next ? `Pop ${v} (L${i}), output it. Push L${i}'s next, ${LISTS[i][j + 1]}. Heap size ${heap.length}.` : `Pop ${v} (L${i}), output it. L${i} is used up: push nothing.${heap.length ? '' : ' Heap empty: done.'}`,
      panels: kwPanels(heap, out, popped),
    });
  }
  check(out.join() === asc(LISTS.flat()).join() && most === LISTS.length, 'merge is sorted and the heap never exceeds k');
}

// ---------- Greedy simulation: last stone weight, e.g. stones [6, 4, 9, 3] ----------
const ST = [6, 4, 9, 3];
const gFrames = [];
const SH = [];
{
  for (const w of ST) hpush(SH, w, MAX);
  gFrames.push({ say: 0, note: `Push every stone into a max-heap. The top, ${SH[0]}, is the heaviest.`, panels: [...pic(SH, { 0: 'active' }, { cap: 4 }), vars({ stones: SH.length })] });
  while (SH.length > 1) {
    const y = hpop(SH, MAX);
    const x = hpop(SH, MAX);
    gFrames.push({ say: 0, note: `pop ${y}, pop ${x}: the two heaviest, O(log n) each.`, panels: [...pic(SH, {}, { cap: 4 }), vars({ y, x })] });
    if (y !== x) hpush(SH, y - x, MAX);
    gFrames.push({
      say: 1,
      note: y !== x ? `Smash: ${y} − ${x} = ${y - x}. Push it back; only one path is repaired.` : `${y} = ${x}: both are destroyed, nothing goes back.`,
      panels: [...pic(SH, y !== x ? { [SH.indexOf(y - x)]: 'active' } : {}, { cap: 4 }), vars({ stones: SH.length })],
    });
  }
  check(SH.length === 1 && SH[0] === 2, 'stones 6 4 9 3 end at 2');
  gFrames.push({ say: 2, note: `One stone left: the answer is ${SH[0]}.`, panels: [...pic(SH, { 0: 'done' }, { cap: 4 }), vars({ answer: SH[0] })] });
}

export default [
  {
    id: 'heap-top-k',
    title: 'The k largest of a stream in O(k) memory',
    steps: [
      {
        kind: 'watch',
        title: 'Sorting everything for 3 numbers',
        lines: ['Sorting everything costs **O(n log n)** even if you only need k items.', 'On a stream you never see all the data at once.'],
        frames: [
          { say: 0, note: 'e.g. stream 5, 9, 2, 7, 4, 8 and k = 3. Sort all 6, keep the first 3: O(n log n), O(n) memory.', panels: [arr([...TK].sort(MAX), { label: 'sorted descending', highlights: hl(TK.length, (j) => (j < K ? 'done' : 'muted')) }), vars({ k: K })] },
          { say: 1, note: 'And on a stream the next number may still be coming: there is nothing complete to sort.', panels: [arr([...TK, '…'], { label: 'stream' }), vars({ k: K })] },
        ],
      },
      {
        kind: 'watch',
        title: 'A min-heap of the best k',
        lines: ['Keep a **min**-heap of the k best so far: its top is the weakest of them.', 'push x; if size > k, pop: evict the weakest candidate.', 'At the end the heap holds the k largest; `peek()` is the k-th largest.'],
        frames: tkFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"top k"**, **"k most frequent"**, **"k closest"**, **"kth largest"**, **"kth smallest"**, **"stream"**.'],
        frames: [{ say: 0, note: 'n pushes and pops on a heap of size ≤ k: O(n log k) time, O(k) memory.', panels: [vars({ sort: 'O(n log n)', 'size-k heap': 'O(n log k)', memory: 'O(k)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the 3 smallest',
        lines: ['Same stream, but now keep the **3 smallest**.', 'The top of the heap is always the one you throw away.'],
        panels: [arr(TK, { label: 'stream' }), vars({ k: K, want: '3 smallest' })],
        task: {
          type: 'choose',
          question: 'Which heap of size 3 do you keep?',
          options: [
            { text: 'A max-heap: its top is the largest of the 3, the one to evict' },
            { text: 'A min-heap, the same as for the k largest', why: 'Its top would be the smallest, the best member: you would evict exactly what you want to keep.' },
            { text: 'A min-heap of all n, then pop 3 times', why: 'Correct, but O(n) memory: that is not the size-k trick and cannot stay small on a stream.' },
            { text: 'No heap: the k smallest need a full sort', why: 'The mirror rule works the same way: a size-k heap, O(n log k).' },
          ],
          answer: 0,
        },
        solved: 'The heap type is the **opposite** of what you keep: the top is what you throw away.',
        then: [{ note: `Run for real with a max-heap: the 3 smallest are ${asc(TKS).join(', ')}; peek() = ${TKS[0]} = the 3rd smallest.`, panels: [...pic(TKS, { 0: 'done' }, { cap: 4 }), vars({ kth: TKS[0] })] }],
      },
    ],
  },

  {
    id: 'heap-two-heaps',
    title: 'A running median in O(log n) per number',
    steps: [
      {
        kind: 'watch',
        title: 'Keeping it sorted costs a shift',
        lines: ['The median needs "the middle" of a set that keeps changing.', 'A sorted array makes each insertion **O(n)**: everything after the new value shifts.'],
        frames: [
          { say: 0, note: 'e.g. numbers so far 1, 5, 8, kept sorted. The middle is 5.', panels: [arr([1, 5, 8], { label: 'sorted', highlights: { 1: 'done' } })] },
          { say: 1, note: '3 arrives: 5 and 8 both shift right to make room. With n values, up to n shifts per insert.', panels: [arr([1, 3, 5, 8], { label: 'sorted after insert', highlights: { 1: 'active', 2: 'visited', 3: 'visited' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Split into two halves',
        lines: ['`low` is a **max**-heap (smaller half), `high` is a **min**-heap (larger half).', 'add(x): push x into low, then move low\'s top to high.', 'If high is now bigger, move its top back: low may have one extra.', 'Median: low.peek() if the count is odd, else the average of the two tops.'],
        frames: twFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"median"**, **"middle value"**, **"data stream"**, **"sliding window median"**, **"balance two groups"**.'],
        frames: [{ say: 0, note: 'O(log n) per add, O(1) per median: the answer always sits on the two tops.', panels: [vars({ add: 'O(log n)', median: 'O(1)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: skip a step',
        lines: [`low = {${LO4.join(', ')}}, high = {${HI4.join(', ')}}. Next: **10**.`, 'A teammate skips the crossing step: push 10 into low, then only rebalance sizes.'],
        panels: twoPanels(LO4, HI4, {}, { next: 10 }),
        task: {
          type: 'choose',
          question: 'What does median() return after their add(10)?',
          options: [
            { text: '10: low.peek() is 10, though 10 belongs in the upper half' },
            { text: '5, the true median of 1, 3, 5, 8, 10', why: 'Only the crossing step moves 10 out of low. Without it, low\'s top is 10.' },
            { text: '(10 + 5) / 2 = 7.5', why: 'low has 3 and high 2: odd count, so median() reads low.peek() alone.' },
            { text: '4, unchanged', why: 'The count changed to 5 (odd), so median() reads a single top.' },
          ],
          answer: 0,
        },
        solved: 'Push to low, **then move low\'s top to high**: that crossing keeps every value in low ≤ every value in high.',
        then: tw10Frames,
      },
    ],
  },

  {
    id: 'heap-k-way-merge',
    title: 'Merge k sorted lists by watching only their heads',
    steps: [
      {
        kind: 'watch',
        title: 'The next output is always a head',
        lines: ['The next output is always the **smallest of the k current heads**.', 'Scanning all k heads for every output costs **O(k·N)**.'],
        frames: [
          { say: 0, note: 'e.g. L0 = [2, 6, 9], L1 = [1, 7], L2 = [4, 5]. The heads 2, 1, 4 are the only candidates.', panels: [table(['L0', 'L1', 'L2'], ['0', '1', '2'], LISTS.map((l) => [0, 1, 2].map((j) => (j < l.length ? l[j] : '—'))), LISTS.map((l) => [0, 1, 2].map((j) => (j === 0 ? 'active' : ''))))] },
          { say: 1, note: `A scan compares all 3 heads to output 1, then all 3 again for 2, … for each of the ${N} outputs.`, panels: [vars({ 'per output': 'k compares', total: 'O(k·N)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'A min-heap of heads',
        lines: ['Push the first element of each list, remembering **which list** and **which position**.', 'Pop the smallest, output it, push the **next element of the same list**.', 'A used-up list pushes nothing. Repeat until the heap is empty.'],
        frames: kwFrames.slice(0, 4),
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"k sorted lists"**, **"merge"**, **"sorted matrix"**, **"k pairs with smallest sums"**, **"one element from each list"**.'],
        frames: [{ say: 0, note: 'The heap holds at most k items: each step O(log k), N elements O(N log k).', panels: [vars({ scan: 'O(k·N)', 'sort all': 'O(N log N)', heap: 'O(N log k)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: push it all up front?',
        lines: [`A teammate pushes all ${N} elements into one min-heap first, then pops them all.`, 'The output is still sorted.'],
        panels: [table(['L0', 'L1', 'L2'], ['0', '1', '2'], LISTS.map((l) => [0, 1, 2].map((j) => (j < l.length ? l[j] : '—')))), vars({ k: LISTS.length, N })],
        task: {
          type: 'choose',
          question: 'What did they lose?',
          options: [
            { text: 'The heap now holds N, not k: O(N log N) instead of O(N log k)' },
            { text: 'Correctness: the output is no longer sorted', why: 'Popping a min-heap empty gives sorted output. It is correct, only slower.' },
            { text: 'Nothing: both are O(N log k)', why: 'Each push and pop costs O(log size), and the size is now N.' },
            { text: 'It became O(k·N), like the scan', why: 'It is O(N log N): the cost of sorting everything from scratch.' },
          ],
          answer: 0,
        },
        solved: 'Keep only **one head per list** in the heap: size ≤ k, so O(N log k).',
        then: kwFrames.slice(4).map(({ say, ...f }) => f),
      },
    ],
  },

  {
    id: 'heap-greedy-scheduling',
    title: 'Act on the biggest item, again and again',
    steps: [
      {
        kind: 'watch',
        title: 'Re-sorting every round',
        lines: ['Last stone weight: smash the two heaviest stones until at most one is left.', 'Re-sorting every round costs **O(n log n) per round**, though only one value changed.'],
        frames: [
          { say: 0, note: 'e.g. stones 6, 4, 9, 3. Sort, take 9 and 6, push back 9 − 6 = 3.', panels: [arr(asc(ST), { label: 'sorted', highlights: { 2: 'active', 3: 'active' } })] },
          { say: 1, note: 'Now 3, 4, 3: sort all of it again. After one smash, the rest was already in order.', panels: [arr([3, 4, 3], { label: 'sort again?', highlights: { 2: 'active' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Pop, modify, push back',
        lines: ['Pop the current best two: O(log n) each.', 'Apply the rule and **push the modified item back**.', 'Repeat while the heap holds more than one.'],
        frames: gFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"each turn choose the largest"**, **"repeat until"**, **"no two adjacent are equal"**, **"cooldown"**, **"at most k projects"**, **"maximize capital"**.'],
        frames: [{ say: 0, note: 'The extreme is needed again after every change: a heap makes each step O(log n).', panels: [vars({ 're-sort': 'O(n log n) per step', heap: 'O(log n) per step' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: heap or one sort?',
        lines: ['A heap pays off when the greedy choice depends on an extreme that **keeps changing**.'],
        panels: [vars({ 'heap when': 'the set changes between picks', 'sort once when': 'nothing changes' })],
        task: {
          type: 'choose',
          question: 'Which task needs the heap?',
          options: [
            { text: 'Unlock projects as capital grows; always take the most profitable affordable one' },
            { text: 'Return all of 10⁶ numbers, given at once, in increasing order', why: 'Static data, full order: just sort. Heaps shine when the data changes.' },
            { text: 'Find the largest value of an array once', why: 'One extreme, once: a linear scan is O(n) and simpler.' },
            { text: 'A greedy pass whose order is fixed before it starts', why: 'The choice does not depend on a changing extreme: sorting once is enough.' },
          ],
          answer: 0,
        },
        solved: 'IPO: the sorted list **unlocks**, the max-heap **chooses**, and its contents change after every pick.',
      },
    ],
  },
];
