// Step lessons for Arrays & Strings (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const code = (text) => vars({ code: text });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// grid states from a function of (r, c)
const gst = (m, n, f) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => f(r, c)));

// ---------- what ----------
const BOXES = [7, 2, 9, 4, 1];

// ---------- intuition: stock prices ----------
const PRICES = [7, 1, 5, 3, 6, 4];
// [minSoFar before, profit if sold today, best] — straight from the lesson's dry-run table
const STOCK = [
  ['—', '—', 0],
  [7, -6, 0],
  [1, 4, 4],
  [1, 2, 4],
  [1, 5, 5],
  [1, 3, 5],
];

// ---------- rotate [1..7] by 3 ----------
const SEVEN = [1, 2, 3, 4, 5, 6, 7];
const rotK = (a, k) => a.map((_, i) => a[(i - k + a.length) % a.length]);
// extra-array version: nums[(i + k) % n] = copy[i], one i at a time
const copyWrites = SEVEN.map((_, i) => {
  const out = SEVEN.slice();
  for (let x = 0; x <= i; x++) out[(x + 3) % 7] = SEVEN[x];
  return out;
});
const written = (i) => new Set(Array.from({ length: i + 1 }, (_, x) => (x + 3) % 7));

// reverse(lo, hi) one swap at a time on a copy of the array
function swaps(a, lo, hi) {
  const out = [{ a: a.slice(), lo, hi }];
  const b = a.slice();
  while (lo < hi) {
    [b[lo], b[hi]] = [b[hi], b[lo]];
    lo++;
    hi--;
    out.push({ a: b.slice(), lo, hi });
  }
  return out;
}

// ---------- template: streak counter ----------
const ONES = [1, 1, 0, 1, 1, 1];
const streakRun = [];
{
  let streak = 0,
    best = 0;
  for (const x of ONES) {
    streak = x === 1 ? streak + 1 : 0;
    best = Math.max(best, streak);
    streakRun.push([streak, best]);
  }
}

// ---------- matrices ----------
const M3 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const M34 = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
];
// spiral sides on the 3 × 4 matrix: cells walked + the walls after the side
const SIDES = [
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], walls: { top: 1, bottom: 2, left: 0, right: 3 }, say: 1, what: 'Left → right along top: 1 2 3 4, then top++.' },
  { cells: [[1, 3], [2, 3]], walls: { top: 1, bottom: 2, left: 0, right: 2 }, say: 2, what: 'Top → bottom along right: 8 12, then right--.' },
  { cells: [[2, 2], [2, 1], [2, 0]], walls: { top: 1, bottom: 1, left: 0, right: 2 }, say: 3, what: 'top ≤ bottom, so right → left along bottom: 11 10 9, then bottom--.' },
  { cells: [[1, 0]], walls: { top: 1, bottom: 1, left: 1, right: 2 }, say: 4, what: 'left ≤ right, so bottom → top along left: 5, then left++.' },
  { cells: [[1, 1], [1, 2]], walls: { top: 2, bottom: 1, left: 1, right: 2 }, say: 1, what: 'Inner layer: left → right along top: 6 7, then top++. Now top > bottom.' },
];
const spiralFrames = SIDES.map((s, k) => {
  const before = new Set(SIDES.slice(0, k).flatMap((x) => x.cells.map(([r, c]) => `${r},${c}`)));
  const now = new Set(s.cells.map(([r, c]) => `${r},${c}`));
  const out = SIDES.slice(0, k + 1).flatMap((x) => x.cells.map(([r, c]) => M34[r][c]));
  return {
    say: s.say,
    note: s.what,
    panels: [grid(M34, gst(3, 4, (r, c) => (now.has(`${r},${c}`) ? 'active' : before.has(`${r},${c}`) ? 'done' : '')), '3 × 4 matrix'), vars({ ...s.walls, out: out.join(' ') })],
  };
});

// ---------- prefix / suffix ----------
const PN = [1, 2, 3, 4];
const LEFTP = [1, 1, 2, 6];
const RIGHTP = [24, 12, 4, 1];
const ANS = [24, 12, 8, 6];
const blank = (n) => Array(n).fill('·');

// ---------- strings ----------
const RLE = 'aaabcc'.split('');
// [i, j, piece emitted]
const RUNS = [
  [0, 3, 'a3'],
  [3, 4, 'b'],
  [4, 6, 'c2'],
];

export default {
  what: [
    {
      kind: 'watch',
      title: 'Numbered boxes, instant access',
      lines: ['An array is a row of numbered boxes; the numbers (**indexes**) start at `0`.', 'Jump straight to any box: `arr[3]` is `4`, no searching needed.', 'A **string** is a read-only row of characters: `"hello"[1]` is `"e"`.', 'A **matrix** is an array of rows: `grid[r][c]` is row r, column c.'],
      frames: [
        { say: 0, note: 'Five boxes, indexes 0 to 4.', panels: [arr(BOXES, { label: 'arr' })] },
        { say: 1, note: 'arr[3]: go straight to box 3. It holds 4. No other box is looked at.', panels: [arr(BOXES, { label: 'arr', pointers: [ptr(3, 'arr[3]')], highlights: { 3: 'active' } })] },
        { say: 2, note: '"hello"[1] is "e"; the length is 5.', panels: [arr('hello'.split(''), { label: '"hello"', pointers: [ptr(1, '[1]')], highlights: { 1: 'active' } }), vars({ length: 5 })] },
        { say: 3, note: 'grid[1][2]: first pick row 1, then column 2 inside it.', panels: [grid(M3, gst(3, 3, (r, c) => (r === 1 && c === 2 ? 'active' : r === 1 ? 'window' : '')), 'grid')] },
      ],
    },
    {
      kind: 'watch',
      title: 'A new house means renumbering',
      lines: ['Know the house number and you walk straight there: **O(1)**.', 'Insert a house between #2 and #3 and every house after it is renumbered: **O(n)**.'],
      frames: [
        { say: 0, note: 'House #3 is one step away, wherever it is on the street.', panels: [arr(BOXES, { label: 'street', pointers: [ptr(3, '#3')], highlights: { 3: 'active' } })] },
        { say: 1, note: 'To fit X after #2, the houses at 3 and 4 each move one slot right.', panels: [arr([7, 2, 9, '·', 4, 1], { label: 'street', highlights: { 3: 'muted', 4: 'window', 5: 'window' } }), vars({ moved: 2 })] },
        { say: 1, note: 'X lands at #3. Everything after it got a new number.', panels: [arr([7, 2, 9, 'X', 4, 1], { label: 'street', highlights: { 3: 'active', 4: 'window', 5: 'window' } }), vars({ moved: 2 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the last index',
      lines: ['Valid indexes run from `0` to `length − 1`.'],
      panels: [arr(BOXES, { label: 'arr, length 5' })],
      task: { type: 'cell', question: 'Tap the box with the **last valid index**.', answer: 4, hints: { 0: 'That is the first index, 0.', 3: 'Close, but there is one more box after it.' } },
      solved: 'Length 5, so the last index is 5 − 1 = 4.',
    },
    {
      kind: 'turn',
      title: 'Your turn: piece or picks?',
      lines: ['A **subarray** is a contiguous piece.', 'A **subsequence** keeps the order but may skip elements.'],
      panels: [arr(BOXES, { label: 'picked: 7, 9, 1', highlights: { 0: 'active', 2: 'active', 4: 'active' } })],
      task: {
        type: 'choose',
        question: 'Is `[7, 9, 1]` a subarray or a subsequence of `arr`?',
        options: [
          { text: 'Subarray', why: 'A subarray must be contiguous; here 2 and 4 are skipped.' },
          { text: 'Subsequence', why: '' },
          { text: 'Neither', why: 'The elements appear in the same order as in arr, so it is a subsequence.' },
        ],
        answer: 1,
      },
      solved: 'In order with gaps: a **subsequence**.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'The end is cheap, the front is not',
      lines: ['`push` at the end: nothing else moves, **O(1) amortized**.', '`unshift` at the front: everything after the slot must move, **O(n)**.', 'Searching with `includes` must look at each element, **O(n)**.'],
      frames: [
        { say: 0, note: 'push(6): one write into the next slot. 0 moves.', panels: [arr([3, 8, 5, 2, 6], { label: 'arr', highlights: { 4: 'active' } }), vars({ moves: 0 })] },
        { say: 1, note: 'unshift(6): 3, 8, 5, 2 each move one slot right…', panels: [arr(['·', 3, 8, 5, 2], { label: 'arr', highlights: { 0: 'muted', 1: 'window', 2: 'window', 3: 'window', 4: 'window' } }), vars({ moves: 4 })] },
        { say: 1, note: '…then 6 goes in at index 0. 4 moves for one insert.', panels: [arr([6, 3, 8, 5, 2], { label: 'arr', highlights: { 0: 'active', 1: 'window', 2: 'window', 3: 'window', 4: 'window' } }), vars({ moves: 4 })] },
        ...[0, 1, 2, 3].map((i) => ({
          say: 2,
          note: i < 3 ? `includes(5): look at index ${i}… not 5.` : 'includes(5): found at index 3, after 4 looks.',
          panels: [arr([6, 3, 8, 5, 2], { label: 'arr', pointers: [ptr(i, 'look')], highlights: hl(5, (k) => (k < i ? 'visited' : k === i ? (i === 3 ? 'done' : 'active') : '')) }), vars({ looks: i + 1 })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: remove from the front',
      lines: ['`shift` removes the first element.', 'Everything after the slot must move.'],
      panels: [arr([6, 3, 8, 5, 2], { label: 'arr', highlights: { 0: 'bad' } })],
      task: { type: 'number', question: 'How many elements move when you call `arr.shift()`?', options: [0, 1, 4, 5], answer: 4, hint: 'The removed 6 does not move; count the elements after it.' },
      solved: '3, 8, 5 and 2 each shift one slot left: n − 1 moves, **O(n)**.',
      then: [{ say: 1, note: 'After shift: the four elements slid one slot left.', panels: [arr([3, 8, 5, 2], { label: 'arr', highlights: hl(4, () => 'window') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: strings are not edited',
      lines: ['`s[i]` on a string is a read-only O(1) access.', '"Changing" a string (`s + t`, `slice`, `replace`) creates a new string: **O(length)**.'],
      panels: [table(['s[i]', 's + t', 'arr.push(x)'], ['what happens'], [['read one slot'], ['build a new string'], ['write at the end']])],
      task: {
        type: 'choose',
        question: 'Which of these costs time proportional to the length?',
        options: [
          { text: '`s[2]`', why: 'Reading one character by index is O(1).' },
          { text: '`s + t`', why: '' },
          { text: '`arr.push(x)`', why: 'push writes at the end and nothing else moves: O(1) amortized.' },
        ],
        answer: 1,
      },
      solved: 'Strings never change in place, so `s + t` builds a whole new string: O(length).',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Copy it, or edit it in place?',
      lines: ['"May I modify the input?"', '"Do you need O(1) extra space?"', 'Those two answers decide: copy the array, or edit it **in place**.'],
      frames: [
        { say: 0, note: 'The input, before any work.', panels: [arr([1, 2, 3, 4], { label: 'nums (input)' })] },
        { say: 0, note: 'Not allowed to modify: work on a copy. nums stays as it was.', panels: [arr([1, 2, 3, 4], { label: 'nums (untouched)', highlights: hl(4, () => 'muted') }), arr([4, 3, 2, 1], { label: 'copy (edited)', highlights: hl(4, () => 'active') }), vars({ extra: 'n slots' })] },
        { say: 1, note: 'O(1) extra space: edit nums itself, no second array.', panels: [arr([4, 3, 2, 1], { label: 'nums (edited in place)', highlights: hl(4, () => 'active') }), vars({ extra: 'O(1)' })] },
        { say: 2, note: 'Same result either way; the questions pick which one the interviewer wants.', panels: [table(['may modify, O(1) space', 'must not modify'], ['do this'], [['edit in place'], ['copy first']], [['done'], ['done']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: when one pass is not enough',
      lines: ['Plain array techniques: one or two passes, in place, grids, building strings.', 'When that is not enough, later topics add a tool.'],
      panels: [table(['Hashing', 'Two Pointers', 'Sliding Window', 'Prefix sums'], ['adds'], [['?'], ['two indexes'], ['a window'], ['precomputed sums']])],
      task: {
        type: 'choose',
        question: 'You need to **remember values** you saw earlier. Which later topic adds that tool?',
        options: [
          { text: 'Hashing (a hash map)', why: '' },
          { text: 'Two Pointers', why: 'Two Pointers walks two indexes; it does not store earlier values.' },
          { text: 'Sliding Window', why: 'A window keeps a range of the array, not a memory of arbitrary values.' },
          { text: 'Prefix sums', why: 'Prefix sums precompute totals, not a lookup of values seen.' },
        ],
        answer: 0,
      },
      solved: 'Remembering values = a **hash map**, from the Hashing topic.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clue → technique',
      lines: ['Each clue in the statement points at one array technique.', 'Think array traversal: running state, in-place rewrite, matrix layers, prefix/suffix passes or string building.'],
      frames: [
        ['"consecutive" / "streak"', 'running state'],
        ['"in-place", "O(1) extra space"', 'in-place rewrite'],
        ['"rotate", "reverse"', 'in-place rewrite'],
        ['"matrix", "spiral"', 'matrix layers'],
        ['"except self", "without division"', 'prefix/suffix passes'],
        ['"formatted string", "compress"', 'string building'],
      ].map((_, k, all) => ({
        say: k < 5 ? 0 : 1,
        note: `${all[k][0]} → ${all[k][1]}.`,
        panels: [table(all.slice(0, k + 1).map((r) => r[0]), ['think'], all.slice(0, k + 1).map((r) => [r[1]]), all.slice(0, k + 1).map((_, i) => [i === k ? 'active' : 'done']))],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: read the clue',
      lines: ['Find the phrase in the statement that names the technique.'],
      panels: [code('"Compress the string: return the resulting string."')],
      task: {
        type: 'choose',
        question: 'Which technique does this statement point to?',
        options: [
          { text: 'Running state', why: 'Running state fits "consecutive" or "streak" questions that return a number.' },
          { text: 'Matrix layers', why: 'There is no grid here, only a string.' },
          { text: 'String building', why: '' },
          { text: 'Prefix/suffix passes', why: 'Those fit "except self" questions, where each answer needs both sides of i.' },
        ],
        answer: 2,
      },
      solved: '"compress" and "return the string" → **string building**.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'All pairs, or one summary?',
      lines: ['Checking every pair is **O(n²)**.', 'Ask: standing at index i, what do I need to know about everything to my left?', 'For the stock: selling today, the best buy is the **cheapest earlier day**. Only `minSoFar` matters.'],
      frames: [
        { say: 0, note: 'Sell on day 4 (price 6). Brute force compares it with every earlier day…', panels: [arr(PRICES, { label: 'prices', pointers: [ptr(4, 'sell')], highlights: { 0: 'visited', 1: 'visited', 2: 'visited', 3: 'visited', 4: 'active' } }), vars({ comparisons: 4 })] },
        { say: 0, note: '…and does that again for every sell day: pairs, O(n²).', panels: [arr(PRICES, { label: 'prices', pointers: [ptr(5, 'sell')], highlights: { 0: 'visited', 1: 'visited', 2: 'visited', 3: 'visited', 4: 'visited', 5: 'active' } }), vars({ comparisons: 5 })] },
        { say: 1, note: 'Everything to the left of day 4 boils down to one number.', panels: [arr(PRICES, { label: 'prices', pointers: [ptr(4, 'i')], highlights: { 0: 'muted', 1: 'window', 2: 'muted', 3: 'muted', 4: 'active' } }), vars({ minSoFar: 1 })] },
        { say: 2, note: 'Profit if sold today = 6 − 1 = 5. One subtraction, no scan.', panels: [arr(PRICES, { label: 'prices', pointers: [ptr(1, 'min'), ptr(4, 'i', 'b')], highlights: { 1: 'window', 4: 'active' } }), vars({ minSoFar: 1, profit: 5 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'One pass, two variables',
      lines: ['At each day: profit if sold today = price − minSoFar.', 'Keep the best profit, then fold today into the minimum.', 'One pass, two variables: **O(n)** time, **O(1)** space.'],
      frames: STOCK.map(([min, profit, best], d) => ({
        say: d === 0 ? 0 : d < 5 ? 1 : 2,
        note: d === 0 ? 'Day 0: no earlier day to buy on yet.' : `Day ${d}: price ${PRICES[d]}, minSoFar ${min}, profit ${profit}. best = ${best}.`,
        panels: [arr(PRICES, { label: 'prices', pointers: [ptr(d, 'day')], highlights: hl(6, (k) => (k < d ? 'visited' : k === d ? 'active' : '')) }), vars({ 'minSoFar (before)': min, 'profit if sold today': profit, best })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the best buy day',
      lines: ['Buy on one day, sell on a **later** day.', 'For a fixed sell day, only earlier days can be the buy.'],
      panels: [arr(PRICES, { label: 'prices', pointers: [ptr(3, 'sell')], highlights: { 3: 'active', 4: 'muted', 5: 'muted' } })],
      task: {
        type: 'cell',
        question: 'You sell on day 3 (price 3). Tap the best day to buy.',
        answer: 1,
        hints: { 0: 'Price 7 would lose money.', 2: 'Price 5 is not the cheapest earlier day.', 3: 'You cannot buy on the day you sell.', 4: 'Day 4 is after the sell day.', 5: 'Day 5 is after the sell day.' },
      },
      solved: 'Day 1, price 1: the cheapest earlier day. Profit 3 − 1 = 2, exactly what `minSoFar` gives.',
    },
    {
      kind: 'turn',
      title: 'Your turn: order of one day',
      lines: ['The dry-run table uses **minSoFar (before)** today.'],
      panels: [arr(PRICES, { label: 'prices', pointers: [ptr(4, 'day')], highlights: { 4: 'active' } }), vars({ minSoFar: 1, best: 4 })],
      task: {
        type: 'order',
        question: 'Tap the work for one day in the order the table does it.',
        items: ['profit = price − minSoFar', 'best = max(best, profit)', 'minSoFar = min(minSoFar, price)'],
        hint: 'Profit uses the minimum from earlier days, so today joins the minimum last.',
      },
      solved: 'Profit, then best, then fold today into `minSoFar` for tomorrow.',
      then: [{ say: 0, note: 'Day 4: profit 6 − 1 = 5, best 5, minSoFar stays 1.', panels: [arr(PRICES, { label: 'prices', pointers: [ptr(4, 'day')], highlights: { 4: 'done' } }), vars({ minSoFar: 1, best: 5 })] }],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Rotate one step, k times',
      lines: ['Each step: `pop` the last element (O(1)).', 'Then `unshift` it to the front: everything shifts right, **O(n)**.', 'k steps × n moves: **O(n·k)**.'],
      frames: [
        { say: 0, note: '[1..7], k = 3. Step 1: pop takes 7.', panels: [arr([1, 2, 3, 4, 5, 6], { label: 'nums' }), vars({ step: 1, last: 7, moves: 0 })] },
        { say: 1, note: 'unshift(7): all 6 elements shift right.', panels: [arr(rotK(SEVEN, 1), { label: 'nums', highlights: { 0: 'active', ...hl(7, (k) => (k ? 'window' : 'active')) } }), vars({ step: 1, moves: 6 })] },
        { say: 1, note: 'Step 2: pop 6, unshift it: 6 more moves.', panels: [arr(rotK(SEVEN, 2), { label: 'nums', highlights: hl(7, (k) => (k ? 'window' : 'active')) }), vars({ step: 2, moves: 12 })] },
        { say: 2, note: 'Step 3: pop 5, unshift it. Rotated, after 3 full shifts.', panels: [arr(rotK(SEVEN, 3), { label: 'nums', highlights: hl(7, (k) => (k ? 'window' : 'active')) }), vars({ step: 3, moves: 18 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how big is n·k?',
      lines: ['k unshifts, each shifting about n elements.'],
      panels: [vars({ n: '10^5', k: '10^5' })],
      task: {
        type: 'choose',
        question: 'With n = k = 10^5, about how many moves does the one-step version make?',
        options: [
          { text: '10^5', why: 'That is one pass; here each of the k steps does a full pass.' },
          { text: '2 · 10^5', why: 'The costs multiply (k steps × n moves), they do not add.' },
          { text: '10^10', why: '' },
        ],
        answer: 2,
      },
      solved: '10^5 × 10^5 = **10^10** moves: correct, but far too slow.',
    },
    {
      kind: 'watch',
      title: 'Extra array: write each element to its new spot',
      lines: ['Copy nums first.', 'Element i moves to `(i + k) % n`: write `nums[(i + k) % n] = copy[i]`.', 'O(n) time, but the copy costs **O(n) space**.'],
      frames: [
        { say: 0, note: 'copy = nums.slice().', panels: [arr(SEVEN, { label: 'copy' }), arr(SEVEN, { label: 'nums' })] },
        ...SEVEN.map((v, i) => ({
          say: i < 6 ? 1 : 2,
          note: i < 6 ? `i = ${i}: copy[${i}] = ${v} goes to (${i} + 3) % 7 = ${(i + 3) % 7}.` : 'i = 6: 7 goes to index 2. Done: [5,6,7,1,2,3,4].',
          panels: [
            arr(SEVEN, { label: 'copy', pointers: [ptr(i, 'i')], highlights: hl(7, (k) => (k < i ? 'visited' : k === i ? 'active' : '')) }),
            arr(copyWrites[i], { label: 'nums', pointers: [ptr((i + 3) % 7, 'write', 'b')], highlights: hl(7, (k) => (k === (i + 3) % 7 ? 'active' : written(i).has(k) ? 'done' : 'muted')) }),
          ],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it land?',
      lines: ['`nums[(i + k) % n] = copy[i]`, with n = 7 and k = 3.'],
      panels: [arr(copyWrites[4], { label: 'nums, after i = 0…4', highlights: hl(7, (k) => (written(4).has(k) ? 'done' : 'muted')) }), vars({ i: 5, 'copy[i]': 6 })],
      task: { type: 'cell', question: 'i = 5: which index of `nums` does `copy[5] = 6` get written to?', answer: 1, hints: { 5: 'That is i itself; it must move k = 3 places.', 0: '(5 + 3) % 7 is not 0.', 6: '5 + 3 = 8 wraps around past 6.' } },
      solved: '(5 + 3) % 7 = 1: the `% n` wraps it around to the front.',
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Rotation = three reversals',
      lines: ['Rotation moves block B (last k) in front of block A: `A B → B A`.', 'Reverse everything: `rev(B) rev(A)`. Right order, each block backwards.', 'Reverse each block again to fix it.'],
      frames: [
        { say: 0, note: 'A = 1 2 3 4, B = 5 6 7 (k = 3).', panels: [arr(SEVEN, { label: 'nums', highlights: hl(7, (k) => (k < 4 ? 'visited' : 'active')) })] },
        { say: 1, note: 'Reverse all: B is in front now, but reads 7 6 5.', panels: [arr([7, 6, 5, 4, 3, 2, 1], { label: 'nums', range: [0, 6], highlights: hl(7, (k) => (k < 3 ? 'active' : 'visited')) })] },
        { say: 2, note: 'Reverse the first k (0..2): 5 6 7.', panels: [arr([5, 6, 7, 4, 3, 2, 1], { label: 'nums', range: [0, 2], highlights: hl(7, (k) => (k < 3 ? 'done' : 'visited')) })] },
        { say: 2, note: 'Reverse the rest (3..6): 1 2 3 4. Rotated, in place.', panels: [arr([5, 6, 7, 1, 2, 3, 4], { label: 'nums', range: [3, 6], highlights: hl(7, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: what is wrong with B?',
      lines: ['After the first reversal B sits in front.'],
      panels: [arr([7, 6, 5, 4, 3, 2, 1], { label: 'after reverse all', highlights: { 0: 'active', 1: 'active', 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'Block B is now `7 6 5`. What still needs fixing?',
        options: [
          { text: 'It is in the right place, but backwards', why: '' },
          { text: 'It is in the wrong place', why: 'B is already in front, exactly where the rotation needs it.' },
          { text: 'It holds the wrong elements', why: 'It holds 5, 6, 7: exactly the last k elements.' },
        ],
        answer: 0,
      },
      solved: 'Right place, wrong direction: one more reversal of each block fixes both.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the three calls',
      lines: ['Each reversal is in place, so the whole rotation needs O(1) extra space.'],
      panels: [arr(SEVEN, { label: 'nums, k = 3' })],
      task: { type: 'order', question: 'Tap the reversals in the order you do them.', items: ['reverse all (0..6)', 'reverse the first k (0..2)', 'reverse the rest (3..6)'], hint: 'Whole array first; then fix each block.' },
      solved: 'All, first k, the rest: `[5, 6, 7, 1, 2, 3, 4]`.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Running state: a streak',
      lines: ['`streak = nums[i] === 1 ? streak + 1 : 0`', '`best = Math.max(best, streak)`'],
      frames: ONES.map((x, i) => ({
        say: i === 2 ? 0 : 1,
        note: x === 1 ? `nums[${i}] = 1: streak ${streakRun[i][0]}, best ${streakRun[i][1]}.` : `nums[${i}] = 0: the streak resets to 0; best keeps ${streakRun[i][1]}.`,
        panels: [arr(ONES, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(6, (k) => (k === i ? (x ? 'active' : 'bad') : k < i ? 'visited' : '')) }), vars({ streak: streakRun[i][0], best: streakRun[i][1] })],
      })),
    },
    {
      kind: 'watch',
      title: 'In-place reverse of a segment',
      lines: ['Swap `a[lo]` and `a[hi]`.', 'Move both inward: `lo++`, `hi--`.', 'Stop when `lo < hi` fails.'],
      frames: swaps([1, 2, 3, 4, 5, 6], 1, 4).map(({ a, lo, hi }, s, all) => ({
        say: s === 0 ? 0 : s < all.length - 1 ? 1 : 2,
        note: s === 0 ? 'reverse(a, 1, 4): only indexes 1..4 change.' : lo < hi ? `Swapped; lo = ${lo}, hi = ${hi}.` : `Swapped; lo = ${lo} > hi = ${hi}, stop. 1 and 6 never moved.`,
        panels: [arr(a, { label: 'a', range: [1, 4], pointers: lo < hi ? [ptr(lo, 'lo'), ptr(hi, 'hi', 'b')] : [], highlights: hl(6, (k) => (k === 0 || k === 5 ? 'muted' : lo < hi && (k === lo || k === hi) ? 'active' : (k < lo || k > hi) && k >= 1 && k <= 4 ? 'done' : '')) }), vars({ lo, hi })],
      })),
    },
    {
      kind: 'watch',
      title: 'Carry from the right: 999 + 1',
      lines: ['Walk from the last digit.', 'A 9 becomes 0 and the carry moves left.', 'All nines: `unshift(1)`, the only O(n) front insert.'],
      frames: [
        { say: 0, note: 'Start at the last digit.', panels: [arr([9, 9, 9], { label: 'digits', pointers: [ptr(2, 'i')], highlights: { 2: 'active' } })] },
        { say: 1, note: 'digits[2] = 9 → 0, carry on.', panels: [arr([9, 9, 0], { label: 'digits', pointers: [ptr(1, 'i')], highlights: { 1: 'active', 2: 'done' } })] },
        { say: 1, note: 'digits[1] = 9 → 0, carry on.', panels: [arr([9, 0, 0], { label: 'digits', pointers: [ptr(0, 'i')], highlights: { 0: 'active', 1: 'done', 2: 'done' } })] },
        { say: 1, note: 'digits[0] = 9 → 0. The loop ends with the carry still there.', panels: [arr([0, 0, 0], { label: 'digits', highlights: hl(3, () => 'done') })] },
        { say: 2, note: 'unshift(1): 999 → 1000.', panels: [arr([1, 0, 0, 0], { label: 'digits', highlights: { 0: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does the carry stop?',
      lines: ['`if (digits[i] < 9) { digits[i]++; return digits; }`', 'Otherwise the 9 becomes 0 and the carry moves left.'],
      panels: [arr([1, 2, 9, 9], { label: 'digits + 1' })],
      task: { type: 'cell', question: 'Tap the digit that gets `++` and ends the loop.', answer: 1, hints: { 3: 'It is a 9: it becomes 0 and the carry moves on.', 2: 'Also a 9: it becomes 0 too.', 0: 'The loop returns before it gets here.' } },
      solved: 'The first digit below 9 from the right: 2 → 3. Result `[1, 3, 0, 0]`, no unshift.',
      then: [
        { say: 1, note: 'i = 3: 9 → 0.', panels: [arr([1, 2, 9, 0], { label: 'digits', pointers: [ptr(2, 'i')], highlights: { 3: 'done', 2: 'active' } })] },
        { say: 1, note: 'i = 2: 9 → 0.', panels: [arr([1, 2, 0, 0], { label: 'digits', pointers: [ptr(1, 'i')], highlights: { 2: 'done', 3: 'done', 1: 'active' } })] },
        { say: 0, note: 'i = 1: 2 < 9, so 2 → 3 and return.', panels: [arr([1, 3, 0, 0], { label: 'digits', highlights: { 1: 'done', 2: 'done', 3: 'done' } })] },
      ],
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Inside reverse(0, n − 1)',
      lines: ['`[nums[lo], nums[hi]] = [nums[hi], nums[lo]]` swaps the two ends.', 'Then `lo++; hi--` until they meet.', 'The middle element of an odd length never moves.'],
      frames: swaps(SEVEN, 0, 6).map(({ a, lo, hi }, s) => ({
        say: s === 0 ? 0 : lo < hi ? 1 : 2,
        note: s === 0 ? 'lo = 0, hi = 6: swap 1 and 7.' : lo < hi ? `Swapped. lo = ${lo}, hi = ${hi}: swap ${a[lo]} and ${a[hi]}.` : `Swapped. lo = hi = ${lo}: stop. 4 stays put. 3 swaps for 7 elements.`,
        panels: [arr(a, { label: 'nums', pointers: lo < hi ? [ptr(lo, 'lo'), ptr(hi, 'hi', 'b')] : [ptr(lo, 'lo = hi')], highlights: hl(7, (k) => (lo < hi && (k === lo || k === hi) ? 'active' : k < lo || k > hi ? 'done' : '')) }), vars({ swaps: s })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: reverse only a segment',
      lines: ['`arr.reverse()` reverses the **whole** array in place.', 'For a segment, write your own loop.'],
      panels: [arr([5, 6, 7, 4, 3, 2, 1], { label: 'nums', range: [3, 6], highlights: { 3: 'active', 4: 'active', 5: 'active', 6: 'active' } })],
      task: {
        type: 'choose',
        question: 'You must reverse only indexes 3..6. What do you use?',
        options: [
          { text: '`nums.reverse()`', why: 'It reverses the whole array, undoing 5 6 7 at the front too.' },
          { text: 'A lo/hi swap loop from 3 to 6', why: '' },
          { text: 'A `for…in` loop over nums', why: 'for…in iterates string keys, including inherited ones; avoid it on arrays.' },
        ],
        answer: 1,
      },
      solved: 'A segment needs your own lo/hi loop: `reverse(3, 6)`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: at(-1)',
      lines: ['`arr.at(-1)` reads the last element without `arr[arr.length - 1]`.'],
      panels: [arr([5, 6, 7, 1, 2, 3, 4], { label: 'nums' })],
      task: { type: 'cell', question: 'Tap the cell `nums.at(-1)` reads.', answer: 6, hints: { 0: 'at(0) would read index 0; -1 counts from the end.' } },
      solved: 'at(-1) = the last element, index 6 (value 4).',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'rotate([1..7], 3), step by step',
      lines: ['Step 1 reverses 0..6.', 'Step 2 reverses 0..2.', 'Step 3 reverses 3..6.', 'Each element is swapped at most twice: about n swaps in total.'],
      frames: [
        { say: 0, note: 'start', panels: [arr(SEVEN, { label: 'nums' })] },
        { say: 0, note: 'Step 1, range 0..6: [7,6,5,4,3,2,1].', panels: [arr([7, 6, 5, 4, 3, 2, 1], { label: 'nums', range: [0, 6], highlights: hl(7, () => 'active') }), vars({ swaps: 3 })] },
        { say: 1, note: 'Step 2, range 0..2: [5,6,7,4,3,2,1].', panels: [arr([5, 6, 7, 4, 3, 2, 1], { label: 'nums', range: [0, 2], highlights: { 0: 'active', 1: 'active', 2: 'active' } }), vars({ swaps: 4 })] },
        { say: 2, note: 'Step 3, range 3..6: [5,6,7,1,2,3,4].', panels: [arr([5, 6, 7, 1, 2, 3, 4], { label: 'nums', range: [3, 6], highlights: { 3: 'active', 4: 'active', 5: 'active', 6: 'active' } }), vars({ swaps: 6 })] },
        { say: 3, note: '6 swaps for 7 elements: about n.', panels: [arr([5, 6, 7, 1, 2, 3, 4], { label: 'nums', highlights: hl(7, () => 'done') }), vars({ swaps: 6 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: follow one value',
      lines: ['Step 3 reverses the range 3..6.'],
      panels: [arr([5, 6, 7, 4, 3, 2, 1], { label: 'before step 3', range: [3, 6], pointers: [ptr(6, '1')], highlights: { 6: 'active' } })],
      task: { type: 'cell', question: 'Value 1 sits at index 6. Where does it end up after step 3?', answer: 3, hints: { 6: 'It is the end of the range, so it swaps with the other end.', 0: 'Step 3 only touches 3..6.' } },
      solved: 'Ends of the range swap: index 6 ↔ index 3.',
    },
    {
      kind: 'turn',
      title: 'Your turn: count the swaps',
      lines: ['A reversal of L elements does L / 2 swaps (rounded down).'],
      panels: [table(['step 1', 'step 2', 'step 3'], ['range', 'length'], [['0..6', '7'], ['0..2', '3'], ['3..6', '4']])],
      task: { type: 'number', question: 'How many swaps do the three steps make in total?', options: [3, 6, 7, 14], answer: 6, hint: '7 → 3 swaps, 3 → 1, 4 → 2.' },
      solved: '3 + 1 + 2 = 6 swaps: about n, so **O(n)**.',
    },
  ],

  'intuition-matrix': [
    {
      kind: 'watch',
      title: 'Rows first, or columns first',
      lines: ['`grid[1][2] === 6`: row 1, column 2.', '**Row traversal**: outer loop over r, inner over c.', '**Column traversal**: outer loop over c, inner over r.'],
      frames: [
        { say: 0, note: 'grid[1][2] is 6.', panels: [grid(M3, gst(3, 3, (r, c) => (r === 1 && c === 2 ? 'active' : '')), 'grid')] },
        ...[0, 1, 2].map((r) => ({ say: 1, note: `Row traversal: r = ${r}, c goes 0 → 2.`, panels: [grid(M3, gst(3, 3, (a) => (a < r ? 'done' : a === r ? 'active' : '')), 'row by row')] })),
        ...[0, 1, 2].map((c) => ({ say: 2, note: `Column traversal: c = ${c}, r goes 0 → 2.`, panels: [grid(M3, gst(3, 3, (_, b) => (b < c ? 'done' : b === c ? 'active' : '')), 'column by column')] })),
      ],
    },
    {
      kind: 'watch',
      title: 'Neighbours and bounds',
      lines: ['Neighbours of (r, c): (r−1, c), (r+1, c), (r, c−1), (r, c+1).', 'Always check bounds: `0 ≤ r < m`, `0 ≤ c < n`.'],
      frames: [
        { say: 0, note: '(1, 1) in the middle: all four neighbours exist.', panels: [grid(M3, gst(3, 3, (r, c) => (r === 1 && c === 1 ? 'active' : Math.abs(r - 1) + Math.abs(c - 1) === 1 ? 'window' : '')), 'grid, m = n = 3')] },
        { say: 1, note: '(0, 0) in a corner: (−1, 0) and (0, −1) fail the bounds check. Only 2 remain.', panels: [grid(M3, gst(3, 3, (r, c) => (r === 0 && c === 0 ? 'active' : r + c === 1 ? 'window' : '')), 'grid, m = n = 3'), vars({ '(−1, 0)': 'out', '(0, −1)': 'out' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an edge cell',
      lines: ['Keep only the neighbours with `0 ≤ r < 3` and `0 ≤ c < 3`.'],
      panels: [grid(M3, gst(3, 3, (r, c) => (r === 1 && c === 2 ? 'active' : '')), 'grid, (1, 2) lit')],
      task: { type: 'number', question: 'How many neighbours of (1, 2) are inside the grid?', options: [1, 2, 3, 4], answer: 3, hint: 'Check (0, 2), (2, 2), (1, 1) and (1, 3).' },
      solved: '(1, 3) has c = 3, out of bounds. The other three stay: 3 neighbours.',
      then: [{ say: 0, note: '(0, 2), (2, 2), (1, 1) are in; (1, 3) is out.', panels: [grid(M3, gst(3, 3, (r, c) => (r === 1 && c === 2 ? 'active' : Math.abs(r - 1) + Math.abs(c - 2) === 1 ? 'window' : '')), 'grid')] }],
    },
    {
      kind: 'watch',
      title: 'Transpose: rows become columns',
      lines: ['Swap `grid[i][j]` with `grid[j][i]`.', 'Rows become columns; the diagonal stays.'],
      frames: (() => {
        const g = M3.map((r) => r.slice());
        const out = [{ say: 0, note: 'The diagonal 1, 5, 9 never moves.', panels: [grid(g, gst(3, 3, (r, c) => (r === c ? 'muted' : '')), 'grid')] }];
        for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
          [g[i][j], g[j][i]] = [g[j][i], g[i][j]];
          out.push({ say: 0, note: `Swap (${i}, ${j}) with (${j}, ${i}).`, panels: [grid(g, gst(3, 3, (r, c) => ((r === i && c === j) || (r === j && c === i) ? 'active' : r === c ? 'muted' : '')), 'grid')] });
        }
        out.push({ say: 1, note: 'Row 0 was 1 2 3; now column 0 is 1 2 3.', panels: [grid(g, gst(3, 3, (_, c) => (c === 0 ? 'done' : '')), 'transposed')] });
        return out;
      })(),
    },
    {
      kind: 'watch',
      title: 'The shared-row trap',
      lines: ['`new Array(3).fill(new Array(3).fill(0))` puts the **same** row in all 3 slots.', '`Array.from({ length: m }, () => new Array(n).fill(0))` makes independent rows.'],
      frames: [
        { say: 0, note: 'fill(row): one row object, three references. Write grid[0][0] = 1…', panels: [grid([[0, 0, 0], [0, 0, 0], [0, 0, 0]], gst(3, 3, (r, c) => (r === 0 && c === 0 ? 'active' : '')), 'fill(new Array(3).fill(0))')] },
        { say: 0, note: '…and every row shows it.', panels: [grid([[1, 0, 0], [1, 0, 0], [1, 0, 0]], gst(3, 3, (_, c) => (c === 0 ? 'bad' : '')), 'fill(new Array(3).fill(0))')] },
        { say: 1, note: 'Array.from: a new row per slot. Only row 0 changes.', panels: [grid([[1, 0, 0], [0, 0, 0], [0, 0, 0]], gst(3, 3, (r, c) => (r === 0 && c === 0 ? 'done' : '')), 'Array.from(…)')] },
      ],
    },
  ],

  'optimized-matrix': [
    {
      kind: 'turn',
      title: 'Your turn: the next cells',
      lines: ['After the top side, the `right` wall is walked top → bottom, then `bottom` right → left.'],
      panels: [grid(M34, gst(3, 4, (r) => (r === 0 ? 'done' : '')), 'top row done'), vars({ top: 1, bottom: 2, left: 0, right: 3, out: '1 2 3 4' })],
      task: { type: 'order', question: 'Tap the next four values the spiral outputs.', items: ['8', '12', '11', '10'], hint: 'Down the right column from row top = 1, then left along the bottom row.' },
      solved: '8, 12 down the right wall, then 11, 10 (and 9) along the bottom.',
    },
    {
      kind: 'watch',
      title: 'Peel the 3 × 4 matrix',
      lines: ['Four walls: `top`, `bottom`, `left`, `right`.', 'left → right along `top`, then `top++`.', 'top → bottom along `right`, then `right--`.', 'right → left along `bottom` (only if `top <= bottom`), then `bottom--`.', 'bottom → top along `left` (only if `left <= right`), then `left++`.', 'The re-checks stop a single leftover row or column being walked twice.'],
      frames: [
        { say: 0, note: 'Walls start at the edges.', panels: [grid(M34, gst(3, 4, () => ''), '3 × 4 matrix'), vars({ top: 0, bottom: 2, left: 0, right: 3, out: '' })] },
        ...spiralFrames,
        { say: 5, note: 'top > bottom: the bottom side is skipped; the while loop ends. 12 cells, each once.', panels: [grid(M34, gst(3, 4, () => 'done'), '3 × 4 matrix'), vars({ top: 2, bottom: 1, left: 2, right: 1, out: '1 2 3 4 8 12 11 10 9 5 6 7' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one row left',
      lines: ['The middle row `6 7` was just walked as the top side.', 'Now `top = 2`, `bottom = 1`.'],
      panels: [grid(M34, gst(3, 4, (r, c) => (r === 1 && (c === 1 || c === 2) ? 'active' : 'done')), 'inner row walked'), vars({ top: 2, bottom: 1, left: 1, right: 1 })],
      task: {
        type: 'choose',
        question: 'What does the bottom side (step 3) do now?',
        options: [
          { text: 'Skip it: `top <= bottom` is false', why: '' },
          { text: 'Walk row 1 right → left', why: 'Row 1 was just walked; that would add 7 and 6 a second time.' },
          { text: 'Walk row 2 right → left', why: 'Row 2 was already output as the bottom side of the outer layer.' },
        ],
        answer: 0,
      },
      solved: 'top > bottom, so no bottom row is left: the re-check skips it.',
    },
  ],

  'optimized-prefix-suffix': [
    {
      kind: 'watch',
      title: 'Forward pass: products to the left',
      lines: ['answer[i] = (product **left** of i) × (product **right** of i).', 'Forward: `out[i] = left; left *= nums[i];`', 'So `out` holds `leftProd`: 1 1 2 6.'],
      frames: [
        { say: 0, note: 'nums = [1, 2, 3, 4]. left starts at 1: nothing is left of index 0.', panels: [arr(PN, { label: 'nums' }), arr(blank(4), { label: 'leftProd (in out)', highlights: hl(4, () => 'muted') }), vars({ left: 1 })] },
        ...PN.map((v, i) => ({
          say: i < 3 ? 1 : 2,
          note: `out[${i}] = ${LEFTP[i]}, then left × ${v} = ${LEFTP[i] * v}.`,
          panels: [
            arr(PN, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(4, (k) => (k < i ? 'visited' : k === i ? 'active' : '')) }),
            arr(LEFTP.map((x, k) => (k <= i ? x : '·')), { label: 'leftProd (in out)', highlights: hl(4, (k) => (k < i ? 'done' : k === i ? 'active' : 'muted')) }),
            vars({ left: LEFTP[i] * v }),
          ],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: right at i = 1',
      lines: ['The backward pass carries `right` = product of elements **after** i.'],
      panels: [arr(PN, { label: 'nums', pointers: [ptr(1, 'i')], highlights: { 1: 'active', 2: 'window', 3: 'window' } })],
      task: { type: 'number', question: 'When the backward pass reaches i = 1, what is `right`?', options: [1, 4, 12, 24], answer: 12, hint: 'Multiply the elements after index 1: 3 × 4.' },
      solved: '3 × 4 = 12, so answer[1] = 1 × 12 = 12.',
    },
    {
      kind: 'watch',
      title: 'Backward pass: multiply in the right side',
      lines: ['Backward: `out[i] *= right; right *= nums[i];`', 'One running variable, no second array: O(1) extra space beyond the output.'],
      frames: [
        ...[3, 2, 1, 0].map((i) => ({
          say: 0,
          note: `i = ${i}: right = ${RIGHTP[i]}, out[${i}] = ${LEFTP[i]} × ${RIGHTP[i]} = ${ANS[i]}.`,
          panels: [
            arr(LEFTP, { label: 'leftProd', pointers: [ptr(i, 'i')], highlights: { [i]: 'active' } }),
            arr(RIGHTP.map((x, k) => (k >= i ? x : '·')), { label: 'rightProd', highlights: hl(4, (k) => (k > i ? 'done' : k === i ? 'active' : 'muted')) }),
            arr(ANS.map((x, k) => (k >= i ? x : '·')), { label: 'answer', highlights: hl(4, (k) => (k > i ? 'done' : k === i ? 'active' : 'muted')) }),
          ],
        })),
        { say: 1, note: 'answer = [24, 12, 8, 6]. rightProd was only ever one variable.', panels: [arr(ANS, { label: 'answer', highlights: hl(4, () => 'done') }), vars({ extra: 'O(1)' })] },
      ],
    },
  ],

  'implementation-strings': [
    {
      kind: 'watch',
      title: '`+=` copies, `join` copies once',
      lines: ['Strings are immutable: every "edit" creates a new string.', 'In a loop `s += piece` can, in the worst case, copy the whole string each time: **O(n²)**.', 'Collect pieces with `parts.push`, then `join("")` once.'],
      frames: [
        ...['a', 'ab', 'abc', 'abcd'].map((s, k) => ({ say: k === 0 ? 0 : 1, note: `out += "${s.at(-1)}": a new string of ${s.length}, built by copying.`, panels: [arr(s.split(''), { label: 'out (new string)', highlights: hl(s.length, (x) => (x === k ? 'active' : 'window')) }), vars({ 'chars copied': [1, 3, 6, 10][k] })] })),
        { say: 2, note: 'parts: 4 pushes, then one join over 4 characters.', panels: [arr(['a', 'b', 'c', 'd'], { label: 'parts', highlights: hl(4, () => 'done') }), vars({ 'join("")': '"abcd"' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Merge alternately with an array',
      lines: ['`if (i < word1.length) out.push(word1[i])`', '`if (i < word2.length) out.push(word2[i])`', '`return out.join("")`'],
      frames: [0, 1, 2].map((i) => {
        const parts = ['a', 'p', 'b', 'q', 'c'].slice(0, i < 2 ? 2 * i + 2 : 5);
        return {
          say: i < 2 ? 0 : 1,
          note: i < 2 ? `i = ${i}: push "${'abc'[i]}" then "${'pq'[i]}".` : 'i = 2: word2 has no index 2, so only "c" is pushed.',
          panels: [arr(['a', 'b', 'c'], { label: 'word1', pointers: [ptr(i, 'i')], highlights: { [i]: 'active' } }), arr(['p', 'q'], { label: 'word2', ...(i < 2 ? { pointers: [ptr(i, 'i', 'b')], highlights: { [i]: 'active' } } : { highlights: { 0: 'muted', 1: 'muted' } }) }), arr(parts, { label: 'out', highlights: hl(parts.length, () => 'done') })],
        };
      }).concat({ say: 2, note: 'join once: "apbqc".', panels: [arr(['a', 'p', 'b', 'q', 'c'], { label: 'out.join("")', highlights: hl(5, () => 'done') })] }),
    },
    {
      kind: 'turn',
      title: 'Your turn: where does j stop?',
      lines: ['`i` marks the start of a run.', '`j` scans forward while `s[j] === s[i]`.'],
      panels: [arr(RLE, { label: 's', pointers: [ptr(0, 'i')], highlights: { 0: 'active' } })],
      task: { type: 'cell', question: 'i = 0. Tap the index where j stops.', answer: 3, hints: { 2: 's[2] is still "a", so j moves past it.', 0: 'j starts here, and s[0] equals s[0].' } },
      solved: 'j stops at the first different character, index 3. The run length is j − i = 3.',
      then: RUNS.map(([i, j, piece], k) => ({
        say: 1,
        note: `i = ${i}, j stops at ${j}: emit "${piece}", then i = j.`,
        panels: [arr(RLE, { label: 's', pointers: j < 6 ? [ptr(i, 'i'), ptr(j, 'j', 'b')] : [ptr(i, 'i')], highlights: hl(6, (x) => (x >= i && x < j ? 'window' : x < i ? 'done' : '')) }), vars({ out: RUNS.slice(0, k + 1).map((r) => r[2]).join('') })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: total work of j',
      lines: ['After each run `i` jumps to `j`.', '`j` never revisits an index.'],
      panels: [arr(RLE, { label: 's = "aaabcc"', highlights: hl(6, () => 'visited') })],
      task: { type: 'number', question: 'How many times does `j++` run in total on "aaabcc"?', options: [3, 6, 12, 36], answer: 6, hint: 'Runs of 3, 1 and 2: j steps once over each character.' },
      solved: '3 + 1 + 2 = 6 = n: the nested `while` is still **O(n)**.',
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Off-by-one at the end',
      lines: ['Valid indexes are `0 … length − 1`.', '`arr[arr.length]` is `undefined`, not an error.'],
      frames: [
        { say: 0, note: 'i = 4 is the last valid index.', panels: [arr(BOXES, { label: 'arr, length 5', pointers: [ptr(4, 'i')], highlights: { 4: 'active' } })] },
        { say: 1, note: 'With `i <= arr.length`, i reaches 5: there is no box, and no error either.', panels: [arr(BOXES, { label: 'arr, length 5', highlights: hl(5, () => 'visited') }), vars({ i: 5, 'arr[5]': 'undefined' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Forgetting the last group',
      lines: ['Record a streak only when it breaks…', '…and a streak that ends at the end of the array is lost.', 'Record it after the loop too.'],
      frames: [
        { say: 0, note: 'The 0 breaks a streak of 2: record best = 2.', panels: [arr(ONES, { label: 'nums', pointers: [ptr(2, 'i')], highlights: { 0: 'done', 1: 'done', 2: 'bad' } }), vars({ streak: 0, best: 2 })] },
        { say: 1, note: 'Streak of 3 at the end, but no 0 follows: the loop exits with best = 2.', panels: [arr(ONES, { label: 'nums', highlights: { 3: 'window', 4: 'window', 5: 'window' } }), vars({ streak: 3, best: 2 })] },
        { say: 2, note: 'After the loop: best = max(2, 3) = 3.', panels: [arr(ONES, { label: 'nums', highlights: { 3: 'done', 4: 'done', 5: 'done' } }), vars({ streak: 3, best: 3 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: sort() without a comparator',
      lines: ['`[10, 9, 1].sort()` gives `[1, 10, 9]`.'],
      panels: [arr([1, 10, 9], { label: '[10, 9, 1].sort()', highlights: { 1: 'bad', 2: 'bad' } })],
      task: {
        type: 'choose',
        question: 'Why does 10 land before 9?',
        options: [
          { text: 'Without a comparator, sort compares numbers as strings', why: '' },
          { text: 'sort() sorts in descending order', why: 'Then 10 would come first, not 1.' },
          { text: 'sort() only looks at the first element', why: 'It reorders every element; 1 moved from the end to the front.' },
        ],
        answer: 0,
      },
      solved: 'As strings, "10" comes before "9". Pass a comparator to sort numbers.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the hidden O(n)',
      lines: ['Some calls inside a loop are loops themselves: `shift`, `unshift`, `splice`, `includes`, `slice`.'],
      panels: [code('for (const x of nums) if (!seen.includes(x)) seen.push(x);')],
      task: {
        type: 'choose',
        question: 'Which call in this loop hides O(n) work?',
        options: [
          { text: '`seen.push(x)`', why: 'push writes at the end; nothing else moves.' },
          { text: '`seen.includes(x)`', why: '' },
          { text: '`for (const x of nums)`', why: 'That is the loop itself, one step per element; the hidden cost is inside it.' },
        ],
        answer: 1,
      },
      solved: '`includes` scans `seen` on every pass: a loop inside the loop.',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: the opening moves',
      lines: ['Clarify first.', 'Say the brute force, then what summary you can carry instead.'],
      panels: [arr(PRICES, { label: 'prices' })],
      task: { type: 'order', question: 'Tap these in the order you say them.', items: ['Clarify: may I mutate the input? Empty input?', 'Say the brute force: all pairs', 'Say the summary to carry instead: minSoFar'], hint: 'Questions before ideas; the slow idea before the fast one.' },
      solved: 'Clarify, brute force, then the running summary.',
    },
    {
      kind: 'turn',
      title: 'Your turn: name the invariant',
      lines: ['An invariant says what a variable **always** means.'],
      panels: [arr(PRICES, { label: 'prices', pointers: [ptr(4, 'i')], highlights: { 1: 'window', 4: 'active' } }), vars({ minSoFar: 1 })],
      task: {
        type: 'choose',
        question: 'Which sentence names the invariant?',
        options: [
          { text: '"`minSoFar` is a number we update."', why: 'True, but it does not say what the number means.' },
          { text: '"`minSoFar` is the cheapest price on any earlier day."', why: '' },
          { text: '"The loop runs n times."', why: 'That is the complexity, not the meaning of a variable.' },
        ],
        answer: 1,
      },
      solved: 'Say what the variable always holds: the cheapest earlier price.',
    },
    {
      kind: 'watch',
      title: 'Test shapes, not just values',
      lines: ['For matrices, test 1 × 1, 1 × n, n × 1 and rectangular shapes.'],
      frames: [
        { say: 0, note: '1 × 1: a single cell.', panels: [grid([[1]], [['active']], '1 × 1')] },
        { say: 0, note: '1 × n: one row.', panels: [grid([[1, 2, 3, 4]], [['active', 'active', 'active', 'active']], '1 × 4')] },
        { say: 0, note: 'n × 1: one column.', panels: [grid([[1], [2], [3], [4]], [['active'], ['active'], ['active'], ['active']], '4 × 1')] },
        { say: 0, note: 'Rectangular: rows ≠ columns.', panels: [grid(M34, gst(3, 4, () => 'active'), '3 × 4')] },
      ],
    },
  ],
};
