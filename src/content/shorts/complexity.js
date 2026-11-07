// Shorts for Big-O & Complexity (M9). Format: src/content/shortSchema.js. Facts come only from topics/complexity/topic.js.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v, label) => ({ kind: 'vars', vars: v, ...(label ? { label } : {}) });
const stack = (values, label) => ({ kind: 'stack', values, ...(label ? { label } : {}) });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// table states: highlight whole rows, `rows` = { rowIndex: state }
const rowSt = (nRows, nCols, rows) => Array.from({ length: nRows }, (_, r) => Array.from({ length: nCols }, () => rows[r] || ''));

// ---------- loop counting: an n × n grid of (i, j) pairs, n = 4 ----------
const N4 = 4;
const pairGrid = (f, label) => ({
  kind: 'grid',
  label,
  cells: Array.from({ length: N4 }, (_, i) => Array.from({ length: N4 }, (_, j) => `${i},${j}`)),
  states: Array.from({ length: N4 }, (_, i) => Array.from({ length: N4 }, (_, j) => f(i, j))),
});
const SUM = [4, 8, 15, 16, 23];

// ---------- halving: 16 sorted values cut in half until one is left ----------
const SIXTEEN = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
const HALVES = [
  [0, 15],
  [8, 15],
  [12, 15],
  [14, 15],
  [15, 15],
];
const halfFrames = HALVES.map(([lo, hi], s) => ({
  say: 0,
  note:
    s === 0
      ? 'e.g. 16 values left. Each step throws away half of what is left.'
      : s < HALVES.length - 1
        ? `Halving ${s}: ${hi - lo + 1} values left.`
        : 'Halving 4: one value left. 16 → 8 → 4 → 2 → 1 is 4 steps = log₂ 16.',
  panels: [
    arr(SIXTEEN, { label: 'sorted values', pointers: lo === hi ? [ptr(lo, 'left')] : [ptr(lo, 'lo'), ptr(hi, 'hi', 'b')], highlights: hl(16, (k) => (k >= lo && k <= hi ? (lo === hi ? 'done' : 'window') : 'muted')) }),
    vars({ left: hi - lo + 1, halvings: s }),
  ],
}));

// ---------- recursion: fib(4) call tree, each node labelled with its k ----------
const FIB = [
  ['a', '4', 4, 0],
  ['b', '3', 2, 1],
  ['c', '2', 6, 1],
  ['d', '2', 1, 2],
  ['e', '1', 3, 2],
  ['f', '1', 5, 2],
  ['g', '0', 7, 2],
  ['h', '1', 0.5, 3],
  ['i', '0', 1.5, 3],
];
const FIB_EDGES = [
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'd'],
  ['b', 'e'],
  ['c', 'f'],
  ['c', 'g'],
  ['d', 'h'],
  ['d', 'i'],
];
// `shown` = ids drawn, `st` = { id: state } for drawn nodes
const fibTree = (shown, st = {}) => ({
  kind: 'nodes',
  label: 'calls of fib(k), shown as k',
  directed: true,
  nodes: FIB.map(([id, label, x, y]) => ({ id, label, x, y, state: shown.includes(id) ? st[id] || '' : 'hidden' })),
  edges: FIB_EDGES.map(([from, to]) => ({ from, to, state: st[from] === 'active' && st[to] === 'active' ? 'active' : '' })),
});
const ALL_FIB = FIB.map(([id]) => id);

// ---------- amortized: a dynamic array that doubles when full ----------
// after push p: values written so far, capacity, copies made by this push
const growFrame = (p, cap, copied, total, note) => ({
  say: copied ? 1 : 0,
  note,
  panels: [
    arr([...Array.from({ length: p }, (_, k) => k + 1), ...Array(cap - p).fill('·')], { label: `capacity ${cap}`, highlights: hl(cap, (k) => (k === p - 1 ? 'active' : k < p - 1 ? (copied ? 'window' : 'done') : 'muted')) }),
    vars({ pushes: p, 'copied now': copied, 'copies total': total }),
  ],
});
// the j pointer that never resets: nums = [1, 2, 4, 5, 7, 9], move j while nums[j] < nums[i] + 3
const NUMS = [1, 2, 4, 5, 7, 9];

// ---------- hidden costs: a queue drained with shift ----------
const Q = ['A', 'B', 'C', 'D', 'E'];

export default [
  {
    id: 'complexity-loop-counting',
    title: 'Count how often the innermost line runs',
    steps: [
      {
        kind: 'watch',
        title: 'Count steps, not seconds',
        lines: ['Seconds depend on the laptop and the engine; the **number of steps** does not.', 'One loop over n elements runs its body n times: **O(n)**.'],
        frames: [
          { say: 0, note: 'sum(arr): 1 step to set total, n steps in the loop, 1 step to return.', panels: [arr(SUM, { label: 'arr, n = 5' }), vars({ steps: 0 })] },
          { say: 1, note: 'The loop touches each element once: n + 2 = 7 steps. It grows like n → O(n).', panels: [arr(SUM, { label: 'arr, n = 5', highlights: hl(5, () => 'done') }), vars({ steps: 'n + 2 = 7', 'Big-O': 'O(n)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Add sequential loops, multiply nested ones',
        lines: ['Two loops **one after another**: n + n = 2n → **O(n)**.', 'A loop **inside** a loop: n × n → **O(n²)**.', '`j = i + 1`: n(n−1)/2 steps, still **O(n²)**.'],
        frames: [
          { say: 0, note: 'e.g. n = 4. Loop 1 walks i, then loop 2 walks j: 4 + 4 = 8 steps. Drop the 2: O(n).', panels: [arr(['i0', 'i1', 'i2', 'i3'], { label: 'loop 1', highlights: hl(4, () => 'done') }), arr(['j0', 'j1', 'j2', 'j3'], { label: 'loop 2', highlights: hl(4, () => 'done') }), vars({ steps: '2n = 8' })] },
          { say: 1, note: 'Nested: for i = 0, the inner loop visits all 4 values of j.', panels: [pairGrid((i) => (i === 0 ? 'active' : ''), 'pairs (i, j)'), vars({ steps: 4 })] },
          { say: 1, note: 'Every row repeats it: 4 rows × 4 cells = 16 = n² steps → O(n²).', panels: [pairGrid(() => 'done', 'pairs (i, j)'), vars({ steps: 'n² = 16' })] },
          { say: 2, note: 'Start j at i + 1: only cells right of the diagonal. 3 + 2 + 1 = 6 = n(n−1)/2.', panels: [pairGrid((i, j) => (j > i ? 'done' : 'muted'), 'pairs with j > i'), vars({ steps: 'n(n−1)/2 = 6' })] },
          { say: 2, note: 'n(n−1)/2 = n²/2 − n/2. Drop the ½ and the smaller term: O(n²).', panels: [table(['n = 10', 'n = 1,000'], ['n', 'n²'], [['10', '100'], ['1,000', '1,000,000']], undefined, 'steps'), vars({ 'Big-O': 'O(n²)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **nested for loops**, **two loops one after another**, **a loop inside a function called inside a loop**, **j = i + 1**.'],
        frames: [
          {
            say: 0,
            note: 'Count the innermost body, keep the dominant term, drop constants. Keep different inputs separate.',
            panels: [table(['loops one after another', 'loop inside loop', 'j = i + 1', 'loop over n, inner over m'], ['cost'], [['add → O(n)'], ['multiply → O(n²)'], ['n(n−1)/2 → O(n²)'], ['O(n·m)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: two different inputs',
        lines: ['`for (const x of a)` with `a.length = n`, and inside it `for (const y of b)` with `b.length = m`.'],
        panels: [vars({ code: 'for (x of a) for (y of b) check(x, y)', 'a.length': 'n', 'b.length': 'm' })],
        task: {
          type: 'choose',
          question: 'How many times does `check` run, in Big-O?',
          options: [
            { text: 'O(n²)', why: 'That merges two different input sizes into one n. a and b can have very different lengths.' },
            { text: 'O(n + m)', why: 'Adding is for loops one after another. Here the b loop runs inside the a loop.' },
            { text: 'O(n·m)' },
            { text: 'O(2n)', why: 'Nested loops multiply; and constants like the 2 are dropped anyway.' },
          ],
          answer: 2,
        },
        solved: 'Nested work multiplies: n rounds of m steps = O(n·m). Never merge two inputs into one n.',
      },
    ],
  },

  {
    id: 'complexity-logarithmic-halving',
    title: 'Halve it: a million shrinks to about 20 steps',
    steps: [
      {
        kind: 'watch',
        title: 'Halving until one is left',
        lines: ['`log₂ n` = how many times you can halve n before reaching 1.'],
        frames: halfFrames,
      },
      {
        kind: 'watch',
        title: 'Why it barely grows',
        lines: ['Double n and a halving loop needs just **one more** step.', 'Adding a constant (`i += 2`) is still linear: **n/2 = O(n)**.'],
        frames: [
          {
            say: 0,
            note: 'n grows 10,000×, log n grows from 3 to 17. log₂ 1,000,000 ≈ 20.',
            panels: [table(['n = 10', 'n = 1,000', 'n = 100,000'], ['log n', 'n'], [['3', '10'], ['10', '1,000'], ['17', '100,000']], rowSt(3, 2, { 2: 'done' }), 'steps')],
          },
          {
            say: 1,
            note: 'i += 2 visits every other value: 8 of 16 stops. Still O(n), not log n.',
            panels: [arr(SIXTEEN.map((_, k) => k), { label: 'i += 2', highlights: hl(16, (k) => (k % 2 === 0 ? 'active' : 'muted')) }), vars({ stops: 'n/2 = 8' })],
          },
          {
            say: 0,
            note: 'i *= 2 jumps 1, 2, 4, 8: 4 stops before reaching 16. That is log₂ n.',
            panels: [arr(SIXTEEN.map((_, k) => k), { label: 'i *= 2', highlights: hl(16, (k) => ([1, 2, 4, 8].includes(k) ? 'active' : 'muted')) }), vars({ stops: 'log₂ 16 = 4' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **`i *= 2`**, **`i = Math.floor(i / 2)`**, **lo / hi / mid**, **`n /= 10`** (digit count = log₁₀ n).'],
        frames: [
          {
            say: 0,
            note: 'Each step multiplies or divides what is left by a constant → O(log n). The base does not matter.',
            panels: [table(['i++ or i += 2', 'i *= 2 or i /= 2', 'n /= 10', 'for i < n, inner j *= 2'], ['iterations'], [['O(n)'], ['O(log n)'], ['O(log n)'], ['O(n log n)']], rowSt(4, 1, { 1: 'done', 2: 'done' }))],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the inner loop shrinks too',
        lines: ['`for (let i = n; i >= 1; i = Math.floor(i / 2))`', '`  for (let j = 0; j < i; j++) work();`', 'e.g. n = 8: the outer i takes 8, 4, 2, 1.'],
        panels: [arr([8, 4, 2, 1], { label: 'outer i (inner loop runs i times)', highlights: hl(4, () => 'window') }), vars({ n: 8 })],
        task: {
          type: 'choose',
          question: 'What is the total work, in Big-O?',
          options: [
            { text: 'O(n log n)', why: 'log n rounds × up to n is only an upper bound. Most rounds do far less: 8 + 4 + 2 + 1, not 8 × 4.' },
            { text: 'O(log n)', why: 'That counts only the outer loop. Each round also runs i inner steps.' },
            { text: 'O(n)' },
            { text: 'O(n²)', why: 'The inner loop never runs n times more than once; it halves every round.' },
          ],
          answer: 2,
        },
        solved: '8 + 4 + 2 + 1 = 15 < 2n. A geometric series n + n/2 + n/4 + … sums to about 2n: O(n).',
      },
    ],
  },

  {
    id: 'complexity-recursion-analysis',
    title: 'Recursion: count the tree for time, measure its height for space',
    steps: [
      {
        kind: 'watch',
        title: 'Waiting calls take memory',
        lines: ['`sumTo(n)` returns `n + sumTo(n − 1)`, and stops at 0.', 'Every call that has not returned yet sits on the **call stack**.'],
        frames: [
          { say: 0, note: 'sumTo(5) cannot finish until sumTo(4) answers.', panels: [stack(['sumTo(5)'], 'call stack')] },
          { say: 1, note: 'sumTo(4) waits on sumTo(3), which waits on sumTo(2)…', panels: [stack(['sumTo(5)', 'sumTo(4)', 'sumTo(3)'], 'call stack')] },
          { say: 1, note: 'At the deepest point 6 calls are waiting: O(n) stack space, with no arrays at all.', panels: [stack(['sumTo(5)', 'sumTo(4)', 'sumTo(3)', 'sumTo(2)', 'sumTo(1)', 'sumTo(0)'], 'call stack'), vars({ time: 'O(n)', space: 'O(n)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Two calls per level: draw the tree',
        lines: ['Naive `fib(n)` calls `fib(n − 1)` and `fib(n − 2)`.', 'Time = the number of **nodes** in the call tree.', 'Space = the **height**: only one root-to-leaf path waits at a time.'],
        frames: [
          { say: 0, note: 'fib(4) makes two calls: fib(3) and fib(2).', panels: [fibTree(['a', 'b', 'c'], { a: 'active' })] },
          { say: 1, note: 'Each of those makes two more. fib(2) is computed twice already.', panels: [fibTree(['a', 'b', 'c', 'd', 'e', 'f', 'g'], { d: 'bad', c: 'bad' })] },
          { say: 1, note: '9 calls for n = 4. The tree roughly doubles each level: about 2ⁿ nodes → O(2ⁿ) time.', panels: [fibTree(ALL_FIB, Object.fromEntries(ALL_FIB.map((id) => [id, 'done']))), vars({ calls: 9, time: 'O(2ⁿ)' })] },
          {
            say: 2,
            note: 'The deepest moment: fib(4) → fib(3) → fib(2) → fib(1) wait together. n levels → O(n) space.',
            panels: [fibTree(ALL_FIB, { a: 'active', b: 'active', d: 'active', h: 'active' }), stack(['fib(4)', 'fib(3)', 'fib(2)', 'fib(1)'], 'call stack'), vars({ space: 'O(n)' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **f(n) calls f(n − 1)**, **two recursive calls per invocation**, **deep recursion on n up to 10⁵**.', 'JS engines allow roughly 10,000 nested calls; deeper throws **RangeError: Maximum call stack size exceeded**.'],
        frames: [
          {
            say: 0,
            note: 'Time = calls × work per call. Space = max depth of the stack + data kept per call.',
            panels: [table(['f(n − 1), one call', 'f(n − 1) + f(n − 2)', 'f(n / 2), one call'], ['time', 'stack'], [['O(n)', 'O(n)'], ['O(2ⁿ)', 'O(n)'], ['O(log n)', 'O(log n)']])],
          },
          { say: 1, note: 'Depth 10⁵ overflows the stack: convert the recursion to a loop with an explicit stack.', panels: [vars({ depth: '10⁵', limit: '≈ 10,000 calls', result: 'RangeError' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: recursion that halves',
        lines: ['`function h(n) { if (n <= 1) return 0; return 1 + h(Math.floor(n / 2)); }`', 'e.g. h(16) calls h(8), h(4), h(2), h(1).'],
        panels: [stack(['h(16)', 'h(8)', 'h(4)', 'h(2)', 'h(1)'], 'call stack at the deepest point')],
        task: {
          type: 'choose',
          question: 'What are the time and the space of `h(n)`?',
          options: [
            { text: 'O(log n) time, O(1) space', why: 'Every call waits for the next one to answer, so all of them sit on the stack together.' },
            { text: 'O(n) time, O(n) space', why: 'n is halved each call, not reduced by 1: there are only about log₂ n calls.' },
            { text: 'O(log n) time, O(log n) space' },
            { text: 'O(2ⁿ) time, O(log n) space', why: 'Exponential needs two calls per invocation. h makes one call, so the tree is a single chain.' },
          ],
          answer: 2,
        },
        solved: 'One call per level and log n levels: log n nodes (time) and log n tall (stack space).',
      },
    ],
  },

  {
    id: 'complexity-amortized-analysis',
    title: 'A rare big copy, paid for by many cheap pushes',
    steps: [
      {
        kind: 'watch',
        title: 'push usually writes one slot',
        lines: ['`push` writes into the next free slot: **O(1)**.', 'When the array is full, the engine allocates a bigger block and **copies everything**.'],
        frames: [
          growFrame(1, 1, 0, 0, 'e.g. capacity doubles when full. Push 1: one free slot, written directly.'),
          growFrame(2, 2, 1, 1, 'Push 2: full! New block of 2, copy 1 value, then write.'),
          growFrame(3, 4, 2, 3, 'Push 3: full again. New block of 4, copy 2 values.'),
          growFrame(4, 4, 0, 3, 'Push 4: a free slot is waiting. O(1), no copy.'),
          growFrame(5, 8, 4, 7, 'Push 5: new block of 8, copy 4 values. Expensive, but rare.'),
          growFrame(8, 8, 0, 7, 'Pushes 6, 7, 8 are cheap. 8 pushes, 1 + 2 + 4 = 7 copies < 2n → O(1) amortized.'),
        ],
      },
      {
        kind: 'watch',
        title: 'A pointer that never goes back',
        lines: ['`let j = 0` is declared **outside** the for loop; inside, `while (nums[j] < nums[i] + 3) j++`.', 'j only moves forward: at most n moves **in total**.'],
        frames: [
          { say: 0, note: 'i = 0: j moves from 0 to 2 (1 and 2 are below 1 + 3).', panels: [arr(NUMS, { label: 'nums', pointers: [ptr(0, 'i'), ptr(2, 'j', 'b')], highlights: { 0: 'active', 1: 'window' } }), vars({ 'j moves': 2 })] },
          { say: 1, note: 'i = 2: j continues from where it stopped, 3 → 4. It never restarts at 0.', panels: [arr(NUMS, { label: 'nums', pointers: [ptr(2, 'i'), ptr(4, 'j', 'b')], highlights: { 2: 'active', 0: 'visited', 1: 'visited', 3: 'window' } }), vars({ 'j moves': 4 })] },
          { say: 1, note: 'i = 4: j walks off the end. i moved 6 times, j 6 times: 2n steps → O(n), not O(n²).', panels: [arr(NUMS, { label: 'nums', pointers: [ptr(4, 'i')], highlights: hl(6, (k) => (k === 4 ? 'active' : 'visited')) }), vars({ 'j moves': 6, total: 'n + n = O(n)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **array push in a loop**, **inner while with a pointer declared OUTSIDE the outer loop**, **"each element is pushed and popped at most once"**.'],
        frames: [
          {
            say: 0,
            note: 'Count the total over the whole run. Amortized is a guarantee over any sequence, not luck.',
            panels: [table(['n pushes', 'shared inner pointer', 'push + pop once each'], ['total'], [['< 2n copies → O(n)'], ['n + n → O(n)'], ['O(n)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: move one line',
        lines: ['Same loop, but now `let j = 0` is written **inside** the for loop, just before the while.'],
        panels: [vars({ code: 'for (i…) { let j = 0; while (j < n && cond(i, j)) j++; }' })],
        task: {
          type: 'choose',
          question: 'What is the worst-case time now?',
          options: [
            { text: 'Still O(n): the while loop is the same', why: 'j now restarts at 0 for every i, so it can walk all n slots again each time.' },
            { text: 'O(n²)' },
            { text: 'O(n log n)', why: 'Nothing halves here. Each i may cost up to n inner steps.' },
            { text: 'O(1) amortized per i', why: 'Amortized needs the work to be shared across iterations. A reset pointer shares nothing.' },
          ],
          answer: 1,
        },
        solved: 'The amortized bound holds only while the pointer is never reset. Reset it and the loops multiply: O(n²).',
      },
    ],
  },

  {
    id: 'complexity-constraints-to-target',
    title: 'Read n first: the limit picks the algorithm',
    steps: [
      {
        kind: 'watch',
        title: 'Same idea, very different n',
        lines: ['A computer does roughly **10⁸ simple steps per second**; plan for a bit less in JavaScript.', 'All pairs is **O(n²)**: fine for one n, hopeless for another.'],
        frames: [
          { say: 1, note: 'n = 1,000: n² = 10⁶ steps, a few milliseconds. Brute force is fine.', panels: [table(['n = 1,000', 'n = 100,000'], ['n log n', 'n²'], [['10,000', '1,000,000'], ['1.7 million', '10 billion']], [['', 'done'], ['', '']], 'steps')] },
          { say: 0, note: 'n = 100,000: n² = 10¹⁰ steps ≈ 100 seconds. Time limit exceeded.', panels: [table(['n = 1,000', 'n = 100,000'], ['n log n', 'n²'], [['10,000', '1,000,000'], ['1.7 million', '10 billion']], [['', 'done'], ['', 'bad']], 'steps')] },
          { say: 0, note: 'n log n at n = 100,000 is 1.7 million steps: milliseconds. n × 100 made n² work × 10,000.', panels: [table(['n = 1,000', 'n = 100,000'], ['n log n', 'n²'], [['10,000', '1,000,000'], ['1.7 million', '10 billion']], [['', 'done'], ['done', 'bad']], 'steps')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Constraints → target',
        lines: ['Read the limit, find its row, aim for that complexity.', 'Values up to 10⁹: you cannot even loop over them.'],
        frames: [
          ...[
            [1, '1 <= n <= 20: 2ⁿ subsets fit. Try all subsets or a bitmask.'],
            [4, 'n <= 10^5: O(n log n) or O(n). Sorting, heaps, hashing, two pointers, sliding window.'],
          ].map(([row, note]) => ({ say: 0, note, panels: [constraintTable(row)] })),
          { say: 1, note: 'n <= 10^9: only O(log n) or O(1). Binary search or a math formula.', panels: [constraintTable(5)] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **1 <= n <= 20**, **n <= 10^5**, **n <= 10^9** in the constraints.', 'Two inputs: n, m ≤ 1000 → O(n·m) = 10⁶ is fine.'],
        frames: [{ say: 0, note: 'Plug n into each candidate before coding. Reject ideas that are too slow; keep it simple when n is small.', panels: [vars({ 'n ≤ 20': 'O(2ⁿ)', 'n ≤ 5000': 'O(n²)', 'n ≤ 10⁵': 'O(n log n)', 'n ≤ 10⁹': 'O(log n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: a small n',
        lines: ['Constraints: `1 <= nums.length <= 20`.', 'You must pick the best subset of nums.'],
        panels: [constraintTable(1)],
        task: {
          type: 'choose',
          question: 'What does this limit tell you?',
          options: [
            { text: 'Trying all 2ⁿ subsets is the intended size of solution' },
            { text: 'You need an O(n) trick', why: 'With n ≤ 20 brute force fits; hunting for O(n) here is over-engineering.' },
            { text: 'All n! orderings are fine too', why: 'n! fits only n ≤ 10–12. 20! is far beyond 10⁸ steps.' },
            { text: '2ⁿ is always too slow', why: 'At n = 20, 2²⁰ ≈ 10⁶ steps: instant. Exponential works for n around 20.' },
          ],
          answer: 0,
        },
        solved: 'A tiny limit like n ≤ 20 is a hint: all subsets (O(2ⁿ)) is expected, not a mistake.',
      },
    ],
  },

  {
    id: 'complexity-hidden-costs-js',
    title: 'One line of JavaScript can be a whole loop',
    steps: [
      {
        kind: 'watch',
        title: 'shift moves everyone',
        lines: ['`queue.shift()` removes the front: every other element moves one slot: **O(n)**.', 'Inside a `while (queue.length)` loop that is **O(n²)** total.'],
        frames: [
          { say: 0, note: 'e.g. a queue of 5 items, drained with shift.', panels: [arr(Q, { label: 'queue' })] },
          { say: 0, note: 'shift() takes A: B, C, D, E each move one slot left. 4 moves.', panels: [arr(Q.slice(1), { label: 'queue', highlights: hl(4, () => 'window') }), vars({ moves: 4 })] },
          { say: 0, note: 'shift() takes B: C, D, E move again. 4 + 3 = 7 moves.', panels: [arr(Q.slice(2), { label: 'queue', highlights: hl(3, () => 'window') }), vars({ moves: 7 })] },
          { say: 1, note: '4 + 3 + 2 + 1 = 10 moves for 5 items: about n²/2 → O(n²).', panels: [arr(['—'], { label: 'queue (empty)', highlights: { 0: 'muted' } }), vars({ moves: 10, total: 'O(n²)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Same queue, nothing moves',
        lines: ['Keep a `head` index: `queue[head++]` is **O(1)** per dequeue.', '`b.includes(x)` is a scan too; a `Set` answers in **O(1) average**.'],
        frames: [
          { say: 0, note: 'head = 0 reads A. The array stays put.', panels: [arr(Q, { label: 'queue', pointers: [ptr(0, 'head')], highlights: { 0: 'active' } }), vars({ moves: 0 })] },
          { say: 0, note: 'head = 3 reads D. Zero moves for the whole drain → O(n) total.', panels: [arr(Q, { label: 'queue', pointers: [ptr(3, 'head')], highlights: { 0: 'visited', 1: 'visited', 2: 'visited', 3: 'active' } }), vars({ moves: 0, total: 'O(n)' })] },
          {
            say: 1,
            note: 'For each x of a, b.includes(x) checks every element of b: O(n·m). new Set(b) first → O(n + m).',
            panels: [arr([2, 7, 4], { label: 'a (n)', pointers: [ptr(1, 'x')], highlights: { 1: 'active' } }), arr([9, 4, 1, 6], { label: 'b (m): includes(7) scans all', highlights: hl(4, () => 'visited') })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **`queue.shift()` in a loop**, **`arr.includes(x)` in a loop**, **`str +=` in a loop**, **`[...acc, x]` in reduce**, **`arr.slice()` passed to recursion**, **sort in a loop**.'],
        frames: [
          {
            say: 0,
            note: 'A built-in call inside a loop: expand it to its real cost, then multiply.',
            panels: [
              table(
                ['arr[i], push, pop', 'shift, unshift', 'includes, indexOf', 'slice, [...arr]', 'sort', 'set.has, map.get'],
                ['cost'],
                [['O(1)'], ['O(n)'], ['O(n)'], ['O(n)'], ['O(n log n)'], ['O(1) average']],
                rowSt(6, 1, { 1: 'bad', 2: 'bad', 3: 'bad', 4: 'bad' }),
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: spread in reduce',
        lines: ['`arr.reduce((acc, x) => [...acc, x * 2], [])` over n elements.'],
        panels: [arr([1, 2, 3, 4], { label: 'acc copied at step 4', highlights: { 0: 'window', 1: 'window', 2: 'window', 3: 'active' } }), vars({ copied: '0 + 1 + 2 + 3' })],
        task: {
          type: 'choose',
          question: 'What is the total time?',
          options: [
            { text: 'O(n): reduce visits each element once', why: 'The visit is O(1), but `[...acc, x]` copies the whole accumulator each time.' },
            { text: 'O(n²)' },
            { text: 'O(n log n)', why: 'Nothing is sorted or halved. The copies grow by one each step: 0 + 1 + 2 + … .' },
            { text: 'O(1) per step, so O(1) total', why: 'Spread is a copy: O(length of acc), not O(1). And n steps are never O(1) total.' },
          ],
          answer: 1,
        },
        solved: '`[...acc, x]` copies acc every step: 0 + 1 + … + (n−1) ≈ n²/2. Use `acc.push(x)` (or map) for O(n).',
      },
    ],
  },
];

// constraints table from the lesson, row `on` highlighted
function constraintTable(on) {
  const rows = ['≤ 10–12', '≤ 20–25', '≤ 100–500', '≤ 2,000–5,000', '≤ 10⁵–10⁶', '≤ 10⁹ or more'];
  const cells = [['O(n!)'], ['O(2ⁿ)'], ['O(n³)'], ['O(n²)'], ['O(n log n) or O(n)'], ['O(log n) or O(1)']];
  return table(rows, ['target'], cells, rowSt(6, 1, { [on]: 'active' }), 'max n → target');
}
