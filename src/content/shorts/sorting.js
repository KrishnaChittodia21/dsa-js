// Shorts for Sorting (M9). Format: src/content/shortSchema.js. Facts come only from topics/sorting/topic.js.
// Every frame below is produced by running the pattern's template on the "e.g." input next to it.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const num = (a, b) => a - b;

// ---------- merge sort: e.g. [9, 4, 6, 2], the final merge with an inversion count ----------
const MS = [9, 4, 6, 2];
const MID = MS.length >> 1;
const ML = MS.slice(0, MID).sort(num); // [4, 9]: the leap of faith, sorted by the recursive call
const MR = MS.slice(MID).sort(num); // [2, 6]
const merge = [];
{
  const out = [];
  let i = 0,
    j = 0,
    inv = 0;
  while (i < ML.length && j < MR.length) {
    const left = ML[i] <= MR[j];
    const add = left ? 0 : ML.length - i;
    inv += add;
    merge.push({ i, j, a: ML[i], b: MR[j], left, add, inv, out: [...out, left ? ML[i] : MR[j]] });
    if (left) out.push(ML[i++]);
    else out.push(MR[j++]);
  }
  const rest = [...ML.slice(i), ...MR.slice(j)];
  merge.push({ i, j, rest, inv, out: [...out, ...rest] });
}
const MS_INNER = 2; // (9, 4) inside the left half, (6, 2) inside the right half
const MS_INV = merge.at(-1).inv + MS_INNER; // 5
const mergeFrame = (s) => ({
  say: s.rest ? 2 : s.left ? 1 : 1,
  note: s.rest
    ? `One half is empty: copy the leftover ${s.rest.join(', ')}. 4 items out, 4 steps.`
    : s.left
      ? `${s.a} <= ${s.b}: take ${s.a} from the left.`
      : `${s.a} > ${s.b}: take ${s.b} from the right. The ${s.add} left item${s.add > 1 ? 's' : ''} still waiting ${s.add > 1 ? 'are' : 'is'} > ${s.b}: +${s.add} inversion${s.add > 1 ? 's' : ''}.`,
  panels: [
    arr(ML, { label: 'left (sorted)', pointers: s.rest ? [] : [ptr(s.i, 'i')], highlights: hl(ML.length, (k) => (k < s.i ? 'muted' : !s.rest && k === s.i ? (s.left ? 'done' : 'active') : '')) }),
    arr(MR, { label: 'right (sorted)', pointers: s.rest ? [] : [ptr(s.j, 'j', 'b')], highlights: hl(MR.length, (k) => (k < s.j ? 'muted' : !s.rest && k === s.j ? (s.left ? 'active' : 'done') : '')) }),
    arr(s.out, { label: 'out', highlights: { [s.out.length - 1]: 'done' } }),
    vars({ 'cross inversions': s.inv }),
  ],
});

// ---------- quick sort: Lomuto partition of e.g. [4, 8, 1, 6, 3, 5], the random pick lands on the last index ----------
const QS = [4, 8, 1, 6, 3, 5];
const QHI = QS.length - 1;
const part = [];
const QA = QS.slice();
{
  const pivot = QA[QHI];
  let store = 0;
  for (let i = 0; i < QHI; i++) {
    const less = QA[i] < pivot;
    const from = store;
    if (less) {
      [QA[i], QA[store]] = [QA[store], QA[i]];
      store++;
    }
    part.push({ i, less, from, store, a: QA.slice(), v: less ? QA[from] : QA[i] });
  }
  [QA[store], QA[QHI]] = [QA[QHI], QA[store]];
  part.push({ done: true, store, a: QA.slice() });
}
const QP = part.at(-1).store; // 3
const QPIV = QS[QHI];
const partFrame = (s) => ({
  say: s.done ? 2 : 1,
  note: s.done
    ? `Swap the pivot into a[store]: ${QPIV} lands at index ${s.store}, its final sorted place. One O(n) pass.`
    : s.less
      ? `i = ${s.i}: ${s.v} < ${QPIV} → swap into a[${s.from}]${s.from === s.i ? ' (itself)' : ''}, store = ${s.store}.`
      : `i = ${s.i}: ${s.v} is not < ${QPIV} → it stays right of store.`,
  panels: [
    arr(s.a, {
      label: `a, pivot ${QPIV}`,
      pointers: s.done ? [ptr(s.store, 'pivot', 'c')] : [ptr(s.store, 'store'), ptr(s.i, 'i', 'b')],
      highlights: hl(QS.length, (k) => (s.done ? (k === s.store ? 'done' : k < s.store ? 'window' : 'visited') : k === QHI ? 'active' : k < s.store ? 'window' : k <= s.i ? 'visited' : '')),
    }),
    vars(s.done ? { 'pivot index': s.store } : { i: s.i, store: s.store }),
  ],
});
const QFINAL = part.at(-1).a; // [4, 1, 3, 5, 8, 6]
const qSides = (keep) =>
  arr(QFINAL, {
    label: 'after the partition',
    pointers: [ptr(QP, 'pivot', 'c')],
    highlights: hl(QFINAL.length, (k) => (k === QP ? 'done' : (keep === 'left' ? k < QP : k > QP) ? 'window' : keep ? 'muted' : '')),
  });

// ---------- counting sort: e.g. nums = [4, 1, 4, 0, 1, 4], maxValue = 4 ----------
const CS = [4, 1, 4, 0, 1, 4];
const CMAX = 4;
const counts = [];
{
  const count = new Array(CMAX + 1).fill(0);
  CS.forEach((x, i) => {
    count[x]++;
    if (i % 2 === 1) counts.push({ upTo: i, count: count.slice() });
  });
}
const CFULL = counts.at(-1).count; // [1, 2, 0, 0, 3]
const emits = [];
{
  const out = [];
  for (let v = 0; v <= CMAX; v++) {
    for (let c = 0; c < CFULL[v]; c++) out.push(v);
    if (CFULL[v]) emits.push({ v, out: out.slice(), skipped: emits.length ? v - emits.at(-1).v - 1 : v });
  }
}
const N_FACT = [1, 2, 3, 4, 5, 6].reduce((p, x) => p * x, 1); // 720 orderings of 6 items
const LB = Math.ceil(Math.log2(N_FACT)); // 10
const countPanel = (count, v = -1) =>
  arr(count, { label: 'count (index = value)', highlights: hl(count.length, (k) => (k === v ? 'active' : count[k] ? 'window' : 'muted')) });

// ---------- custom comparator: e.g. score descending, then name ascending ----------
const DEF = [8, 30, 200];
const DEF_SORTED = DEF.slice().sort(); // [200, 30, 8]: compared as strings
const ITEMS = [
  { name: 'fig', score: 3 },
  { name: 'kiwi', score: 5 },
  { name: 'pear', score: 3 },
  { name: 'lime', score: 5 },
];
const cmp = (a, b) => b.score - a.score || a.name.localeCompare(b.name); // the pattern's template
const SORTED = ITEMS.slice().sort(cmp);
const show = (it) => `${it.name} ${it.score}`;
const [FIG, KIWI, PEAR, LIME] = ITEMS;
const c1 = cmp(FIG, KIWI); // 2
const c2 = cmp(KIWI, LIME); // < 0
const c3 = cmp(FIG, PEAR); // < 0
const sign = (x) => (x < 0 ? 'negative' : x > 0 ? 'positive' : '0');
const itemsPanel = (list, label, on = []) => arr(list.map(show), { label, highlights: hl(list.length, (k) => (on.includes(list[k]) ? 'active' : '')) });

// ---------- sort as preprocessing: e.g. smallest difference between any two values ----------
const PD = [9, 2, 14, 5, 11];
const PAIRS = (PD.length * (PD.length - 1)) / 2; // 10
const PDS = [...PD].sort(num); // don't mutate the caller's array
const scan = [];
{
  let best = Infinity;
  for (let i = 1; i < PDS.length; i++) {
    const d = PDS[i] - PDS[i - 1];
    const better = d < best;
    if (better) best = d;
    scan.push({ i, d, best, better });
  }
}
const PBEST = scan.at(-1).best; // 2

export default [
  {
    id: 'sorting-merge-sort',
    title: 'Sort by merging two sorted halves',
    steps: [
      {
        kind: 'watch',
        title: 'Split until nothing is left to sort',
        lines: ['Split the array in half and sort each half recursively.', 'Base case: 0 or 1 element is already sorted.'],
        frames: [
          {
            say: 0,
            note: `e.g. a = [${MS.join(', ')}]: mid = ${MID}, split by position into [${MS.slice(0, MID).join(', ')}] and [${MS.slice(MID).join(', ')}].`,
            panels: [arr(MS, { label: 'a', highlights: hl(MS.length, (k) => (k < MID ? 'window' : 'visited')) })],
          },
          {
            say: 1,
            note: `Each half splits into single elements, which are sorted. Merging them back gives [${ML.join(', ')}] and [${MR.join(', ')}].`,
            panels: [arr(ML, { label: 'left, sorted', highlights: hl(ML.length, () => 'window') }), arr(MR, { label: 'right, sorted', highlights: hl(MR.length, () => 'visited') })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Merge: only ever look at two fronts',
        lines: [
          'Put a finger at the front of each sorted half.',
          'Take the smaller front: `left[i] <= right[j]` takes from the left.',
          'Then copy the leftovers of the half that is not empty.',
        ],
        frames: merge.map(mergeFrame),
      },
      {
        kind: 'watch',
        title: 'Why O(n log n), and the clue',
        lines: [
          'Every level merges n items; halving gives log₂ n levels.',
          'Clues: **"count pairs i < j where a[i] > a[j]"**, **"sort a linked list"**, **"stable"**, **"O(n log n) without built-ins"**.',
        ],
        frames: [
          {
            say: 0,
            note: `log₂ ${MS.length} = 2 levels × ${MS.length} items. Best = average = worst = O(n log n); O(n) extra space.`,
            panels: [arr(merge.at(-1).out, { label: 'sorted', highlights: hl(MS.length, () => 'done') }), vars({ time: 'O(n log n)', space: 'O(n)', stable: 'yes' })],
          },
          {
            say: 1,
            note: `Inversions: ${MS_INNER} inside the halves + ${merge.at(-1).inv} counted by the merge = ${MS_INV}, without checking all pairs.`,
            panels: [arr(MS, { label: 'a (input)' }), vars({ 'inside halves': MS_INNER, 'cross (merge)': merge.at(-1).inv, total: MS_INV })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: two equal fronts',
        lines: ['e.g. merging left [3, 5a] and right [5b, 8]. 5a came before 5b in the input.', 'Now `left[i]` = 5a and `right[j]` = 5b.'],
        panels: [
          arr(['3', '5a'], { label: 'left (sorted)', pointers: [ptr(1, 'i')], highlights: { 0: 'muted', 1: 'active' } }),
          arr(['5b', '8'], { label: 'right (sorted)', pointers: [ptr(0, 'j', 'b')], highlights: { 0: 'active' } }),
          arr(['3'], { label: 'out', highlights: { 0: 'done' } }),
        ],
        task: {
          type: 'choose',
          question: 'Which merge test keeps the sort stable here?',
          options: [
            { text: '`left[i] < right[j]`: take 5b first', why: 'Then 5b, a later item, jumps in front of the equal 5a. That is the mistake that loses stability.' },
            { text: '`left[i] <= right[j]`: take 5a first' },
            { text: 'Either: equal values look the same', why: 'Equal keys are not equal records. When sorting records by a key, the other fields tell them apart.' },
            { text: 'Skip both and add them at the end', why: 'Every element must be output exactly once, in place; skipping breaks the merge.' },
          ],
          answer: 1,
        },
        solved: 'On a tie take from the **left** (`<=`): the left half came first in the input, so equal items keep their order.',
      },
    ],
  },

  {
    id: 'sorting-quick-sort',
    title: 'Partition: one pass puts the pivot in its final place',
    steps: [
      {
        kind: 'watch',
        title: 'Do the work before recursing',
        lines: ['Pick a **random pivot** and swap it to `a[hi]`.', 'Smaller values move left of `store`; the pivot then sits where a full sort would put it.'],
        frames: [
          {
            say: 0,
            note: `e.g. a = [${QS.join(', ')}]; say the random pick is index ${QHI}, so pivot = ${QPIV} is already at hi.`,
            panels: [arr(QS, { label: `a, pivot ${QPIV}`, pointers: [ptr(0, 'store'), ptr(QHI, 'hi', 'c')], highlights: { [QHI]: 'active' } }), vars({ store: 0 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Lomuto: grow the "less than pivot" block',
        lines: ['Invariant: `a[lo..store)` < pivot.', '`a[i] < pivot` → swap `a[i]` into `a[store]`, then `store++`.', 'Finally swap the pivot into `a[store]`.'],
        frames: part.map(partFrame),
      },
      {
        kind: 'watch',
        title: 'Quickselect: keep one side',
        lines: [
          'Quicksort recurses on both sides: O(n log n) average, O(log n) space.',
          'For the k-th smallest, recurse only into the side holding k: O(n) average.',
          'Clues: **"in place"**, **"k-th largest / median"**, **"partition around x"**, **"O(1) extra space"**.',
        ],
        frames: [
          { say: 0, note: `Both sides still need sorting; the pivot ${QPIV} is never touched again.`, panels: [qSides(null), vars({ average: 'O(n log n)', worst: 'O(n²)', stable: 'no' })] },
          { say: 1, note: `e.g. k = 1 (0-based): 1 < ${QP}, so the answer is in a[0..${QP - 1}]. The right side is dropped.`, panels: [qSides('left'), vars({ k: 1, 'pivot index': QP })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: k is on the right',
        lines: [`Same partition: the pivot ${QPIV} landed at index ${QP}.`, 'Now we want k = 4 (0-based), the 5th smallest.'],
        panels: [qSides(null), vars({ k: 4, 'pivot index': QP })],
        task: {
          type: 'choose',
          question: 'Where does quickselect continue?',
          options: [
            { text: `a[0..${QP - 1}]`, why: `Every value there is < ${QPIV}: they hold indices 0..${QP - 1} in sorted order, not index 4.` },
            { text: `a[${QP + 1}..${QHI}] only` },
            { text: `a[${QP}..${QHI}], keeping the pivot in the range`, why: 'Recursing on ranges that include the pivot is a listed mistake: it can recurse forever.' },
            { text: `Both sides, then read a[4]`, why: 'That is a full quicksort, O(n log n). Quickselect drops the side without k to get O(n) average.' },
          ],
          answer: 1,
        },
        solved: 'After a partition the pivot is final; quickselect keeps only the side that contains index k.',
      },
    ],
  },

  {
    id: 'sorting-counting-bucket',
    title: 'Small integers: count them, never compare',
    steps: [
      {
        kind: 'watch',
        title: 'Comparisons have a floor',
        lines: ['Any comparison sort needs Ω(n log n) comparisons: n! orderings, each comparison at best halves them.'],
        frames: [
          {
            say: 0,
            note: `e.g. 6 items: ${N_FACT} orderings, so at least log₂ ${N_FACT} → ${LB} comparisons in the worst case.`,
            panels: [arr(CS, { label: `nums, every value in 0..${CMAX}` }), vars({ orderings: N_FACT, 'comparisons ≥': LB })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Use the value as an address',
        lines: ['1. `count[x]++` for every x: no comparisons.', '2. Walk v = 0..maxValue and write v out `count[v]` times.'],
        frames: [
          ...counts.map((c) => ({
            say: 0,
            note: `Read ${CS.slice(c.upTo - 1, c.upTo + 1).join(' and ')}: count[${CS[c.upTo - 1]}]++, count[${CS[c.upTo]}]++.`,
            panels: [arr(CS, { label: 'nums', highlights: hl(CS.length, (k) => (k < c.upTo - 1 ? 'muted' : k <= c.upTo ? 'active' : '')) }), countPanel(c.count)],
          })),
          ...emits.map((e) => ({
            say: 1,
            note: `v = ${e.v}: count[${e.v}] = ${CFULL[e.v]} → write ${e.v} ${CFULL[e.v] === 1 ? 'once' : `${CFULL[e.v]} times`}.${e.skipped ? ` (${e.skipped === 1 ? `v = ${e.v - 1} has` : `v = ${e.v - e.skipped}..${e.v - 1} have`} count 0: nothing.)` : ''}`,
            panels: [countPanel(CFULL, e.v), arr(e.out, { label: 'out', highlights: hl(e.out.length, (k) => (e.out[k] === e.v ? 'done' : '')) })],
          })),
        ],
      },
      {
        kind: 'watch',
        title: 'The clue: a small value range',
        lines: ['O(n + k) time and O(k) space, where k is the value range.', 'Clues: **"0 <= nums[i] <= 1000"**, **"in linear time"**, **"lowercase letters only"**, **"sort by frequency"**.'],
        frames: [
          {
            say: 0,
            note: `n = ${CS.length} reads + k = ${CMAX + 1} boxes. Works when k is small; a range like 1e9 would not fit.`,
            panels: [arr(emits.at(-1).out, { label: 'sorted', highlights: hl(CS.length, () => 'done') }), vars({ time: 'O(n + k)', space: 'O(k)', compares: 0 })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a negative value',
        lines: ['e.g. nums = [2, −1, 0, 2]: values in −1..2.', 'The template does `count[x]++`.'],
        panels: [arr([2, -1, 0, 2], { label: 'nums', highlights: { 1: 'bad' } })],
        task: {
          type: 'choose',
          question: 'How do you count the −1?',
          options: [
            { text: '`count[-1]++` works like any index', why: 'Index −1 on an array silently creates a property "-1", not an element: the walk from 0 never sees it.' },
            { text: 'Give up: counting sort cannot handle negatives', why: 'It can: only the mapping from value to box changes.' },
            { text: 'Shift by −min: value x goes to box x − min, so −1 → 0' },
            { text: 'Size the count array by max(nums) only', why: 'That ignores the negative part of the range; the box for −1 still does not exist.' },
          ],
          answer: 2,
        },
        solved: 'Offset by −min so the smallest value maps to box 0; the range is then max − min + 1 boxes.',
      },
    ],
  },

  {
    id: 'sorting-custom-comparator',
    title: 'Sort by any rule with one comparator',
    steps: [
      {
        kind: 'watch',
        title: 'The default sort compares strings',
        lines: ['`sort()` with no comparator converts every element to a string.', '`(a, b) => a - b` gives numeric ascending.'],
        frames: [
          {
            say: 0,
            note: `e.g. [${DEF.join(', ')}].sort() → [${DEF_SORTED.join(', ')}]: "${DEF_SORTED.join('" < "')}" as strings. No error.`,
            panels: [arr(DEF_SORTED, { label: 'sort()', highlights: hl(DEF.length, () => 'bad') })],
          },
          {
            say: 1,
            note: `With a comparator: [${DEF.slice().sort(num).join(', ')}]. Negative → a first, positive → b first, 0 → keep order.`,
            panels: [arr(DEF.slice().sort(num), { label: 'sort((a, b) => a - b)', highlights: hl(DEF.length, () => 'done') })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Two keys in one line',
        lines: ['Primary key: `b.score - a.score` (score descending).', '`||` falls through only on 0, a tie: then `a.name.localeCompare(b.name)`.'],
        frames: [
          {
            say: 0,
            note: `e.g. compare(fig 3, kiwi 5): 5 − 3 = ${c1}, ${sign(c1)} → kiwi goes before fig.`,
            panels: [itemsPanel(ITEMS, 'items', [FIG, KIWI]), vars({ 'b.score − a.score': c1 })],
          },
          {
            say: 1,
            note: `compare(kiwi 5, lime 5): 5 − 5 = 0, a tie → "kiwi" vs "lime" is ${sign(c2)} → kiwi first.`,
            panels: [itemsPanel(ITEMS, 'items', [KIWI, LIME]), vars({ 'b.score − a.score': 0, localeCompare: sign(c2) })],
          },
          {
            say: 1,
            note: `Sorted: ${SORTED.map(show).join(', ')}. Score down, name up on ties.`,
            panels: [itemsPanel(SORTED, 'items.sort(cmp)', []), vars({ comparator: 'O(1)', sort: 'O(n log n) calls' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"sort by … then by …"**, **"in the order given by"**, **"custom order"**, **"arrange to form the largest number"**.'],
        frames: [
          {
            say: 0,
            note: 'The comparator must be a consistent order (transitive). Precompute expensive keys: it runs O(n log n) times.',
            panels: [itemsPanel(SORTED, 'items.sort(cmp)', []), vars({ returns: 'a number', stable: 'yes (ES2019)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: fig vs pear',
        lines: ['Same comparator. Both have score 3.', '`compare(fig 3, pear 3)`'],
        panels: [itemsPanel(ITEMS, 'items', [FIG, PEAR])],
        task: {
          type: 'choose',
          question: 'What does the comparator return, and what does sort do?',
          options: [
            { text: '0: the scores tie, so fig and pear keep their order', why: '`0 || y` evaluates y: on a score tie the name decides.' },
            { text: `A ${sign(c3)} number: "fig" comes before "pear", so fig goes first` },
            { text: 'A positive number: pear goes first', why: '"fig" < "pear" alphabetically, so localeCompare is negative: a (fig) goes first.' },
            { text: '`true`', why: 'A comparator returns a number, never a boolean; booleans never report "less than".' },
          ],
          answer: 1,
        },
        solved: '`key1 || key2` compares by the next key exactly when the first one is 0, a tie.',
      },
    ],
  },

  {
    id: 'sorting-preprocess',
    title: 'Sort first, then only neighbours matter',
    steps: [
      {
        kind: 'watch',
        title: 'Every pair is O(n²)',
        lines: ['Find the smallest difference between any two values.', 'Brute force compares every pair.'],
        frames: [
          {
            say: 1,
            note: `e.g. nums = [${PD.join(', ')}]: ${PD.length} values → ${PAIRS} pairs. n = 10⁵ would be about 5·10⁹ pairs.`,
            panels: [arr(PD, { label: 'nums', highlights: hl(PD.length, () => 'window') }), vars({ pairs: PAIRS })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Sort a copy, scan neighbours',
        lines: ['`[...items].sort((a, b) => a - b)`: O(n log n), and the caller keeps the original.', 'Sorted, the best partner of a value is its neighbour: one O(n) scan.'],
        frames: [
          {
            say: 0,
            note: `Sorted copy: [${PDS.join(', ')}]. The input order did not matter for the answer, so sorting is allowed.`,
            panels: [arr(PD, { label: 'nums (unchanged)' }), arr(PDS, { label: 'sorted' })],
          },
          ...scan.map((s) => ({
            say: 1,
            note: `${PDS[s.i]} − ${PDS[s.i - 1]} = ${s.d}${s.better ? ` → best = ${s.best}` : `, not below ${s.best}`}.`,
            panels: [
              arr(PDS, { label: 'sorted', pointers: [ptr(s.i - 1, 'i−1'), ptr(s.i, 'i', 'b')], highlights: hl(PDS.length, (k) => (k === s.i || k === s.i - 1 ? 'active' : k < s.i - 1 ? 'visited' : '')) }),
              vars({ diff: s.d, best: s.best }),
            ],
          })),
        ],
      },
      {
        kind: 'watch',
        title: 'The test and the clue',
        lines: ['Test: **does the answer change if I shuffle the input?** No → sort first.', 'Clues: **"return the answer in any order"**, **"pair up"**, **"closest"**, **"can the array be reordered so that"**.'],
        frames: [
          {
            say: 0,
            note: `Answer ${PBEST} after ${scan.length} neighbour checks instead of ${PAIRS}. Total O(n log n), the sort dominates.`,
            panels: [arr(PDS, { label: 'sorted', highlights: hl(PDS.length, () => 'done') }), vars({ answer: PBEST, brute: 'O(n²)', 'sort + scan': 'O(n log n)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: may we sort?',
        lines: ['Sorting first needs an answer that does not depend on the input order.'],
        panels: [arr(PD, { label: 'nums' })],
        task: {
          type: 'choose',
          question: 'For which problem does sorting `nums` itself destroy what you need?',
          options: [
            { text: 'Is there a duplicate value?', why: 'Shuffling cannot change whether a duplicate exists; after sorting, equal values are adjacent.' },
            { text: 'Can the array be reordered so that every x is paired with 2x?', why: '"Reordered" says order does not matter: sort and pair greedily.' },
            { text: 'For each element, the next greater element to its right' },
            { text: 'The smallest difference between any two values', why: 'That is the problem above: the answer is the same for any order.' },
          ],
          answer: 2,
        },
        solved: 'Sort only when the answer survives a shuffle. When just the indices must survive, sort `[value, index]` pairs.',
      },
    ],
  },
];
