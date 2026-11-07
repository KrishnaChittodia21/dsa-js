// Step lessons for Big-O & Complexity (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v, label) => ({ kind: 'vars', vars: v, ...(label ? { label } : {}) });
const stack = (values, label) => ({ kind: 'stack', values, ...(label ? { label } : {}) });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const grid = (n, filledRows, label) => ({
  kind: 'grid',
  label,
  cells: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => `${r},${c}`)),
  states: Array.from({ length: n }, (_, r) => Array.from({ length: n }, () => (r < filledRows ? 'done' : r === filledRows ? 'active' : ''))),
});

// ---------- counting steps and dropping constants ----------
const LOOP = [4, 8, 15, 16, 23];
const loopFrames = LOOP.map((_, i) => ({
  say: 0,
  note: `i = ${i}: one step for element ${LOOP[i]}.`,
  panels: [arr(LOOP, { pointers: [{ index: i, label: 'i', color: 'a' }], highlights: Object.fromEntries(LOOP.map((_, k) => [k, k < i ? 'done' : k === i ? 'active' : ''])) }), vars({ steps: i + 1 })],
}));

const SORTED = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
const halves = [
  [0, 15],
  [8, 15],
  [12, 15],
  [14, 15],
  [15, 15],
];

// fib(4) call tree, each node labelled with its k (fib(k))
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
const fibTree = (states) => ({
  kind: 'nodes',
  label: 'calls of fib(k), shown as k',
  directed: true,
  nodes: FIB.map(([id, label, x, y]) => ({ id, label, x, y, state: states[id] || '' })),
  edges: FIB_EDGES.map(([from, to]) => ({ from, to, state: states[from] === 'active' && states[to] === 'active' ? 'active' : '' })),
});

// ---------- amortized: the j pointer that never resets ----------
const NUMS = [1, 2, 4, 5, 7, 9];
// i, j after the while loop for that i (k = 3: move j while nums[j] < nums[i] + 3)
const RUN = [
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 6],
];


// ---------- batch 2b helpers ----------
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const code = (text) => vars({ code: text });
const SEARCH = [7, 2, 9, 4, 6, 1, 8, 3];
const PAIRS = [3, 8, 1, 6];
const pairList = [];
for (let i = 0; i < PAIRS.length; i++) for (let j = i + 1; j < PAIRS.length; j++) pairList.push([i, j]);

export default {
  intuition: [
    {
      kind: 'watch',
      title: 'Count the steps of one loop',
      lines: ['A loop that visits every element does one step per element.', 'With n elements that is n steps, so the loop is **O(n)**.'],
      frames: [...loopFrames, { say: 1, note: '5 elements, 5 steps. Double the array and the steps double too.', panels: [arr(LOOP, { highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done' } }), vars({ steps: 5, n: 5 })] }],
    },
    {
      kind: 'watch',
      title: 'Drop the constants, keep the dominant term',
      lines: ['`3n + 5` grows in step with n: make n 10× bigger and it is about 10× bigger.', '`n²` grows 100× when n grows 10×.', 'So `3n + 5` is **O(n)**: the 3 and the 5 do not change the shape of the growth.'],
      frames: [
        { say: 0, note: 'n = 10', panels: [table(['n = 10'], ['3n + 5', 'n²'], [['35', '100']])] },
        { say: 0, note: 'n = 100: 3n + 5 grew about 10×.', panels: [table(['n = 10', 'n = 100'], ['3n + 5', 'n²'], [['35', '100'], ['305', '10,000']], [[null, null], ['active', null]])] },
        { say: 1, note: 'n = 100: n² grew 100×.', panels: [table(['n = 10', 'n = 100'], ['3n + 5', 'n²'], [['35', '100'], ['305', '10,000']], [[null, null], [null, 'bad']])] },
        {
          say: 2,
          note: 'n = 1,000: 3,005 against 1,000,000. Only the shape matters when n is huge.',
          panels: [table(['n = 10', 'n = 100', 'n = 1,000'], ['3n + 5', 'n²'], [['35', '100'], ['305', '10,000'], ['3,005', '1,000,000']], [[null, null], [null, null], ['active', 'bad']])],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Simplify it',
      lines: ['Drop the constants.', 'Keep only the fastest-growing term.'],
      panels: [table(['n = 1,000'], ['2n', 'n² / 2', '50'], [['2,000', '500,000', '50']])],
      task: {
        type: 'choose',
        question: 'A function runs `2n + n²/2 + 50` steps. What is its Big-O?',
        options: [
          { text: 'O(n)', why: '2n grows slower than n²/2; at n = 1,000 it is 2,000 against 500,000.' },
          { text: 'O(n²)', why: '' },
          { text: 'O(n²/2)', why: 'Constants are dropped: O(n²/2) and O(n²) are the same class.' },
          { text: 'O(n² + n)', why: 'Lower-order terms are dropped; for large n the n is noise next to n².' },
        ],
        answer: 1,
      },
      solved: 'Drop the ½, the 2 and the 50, keep n²: **O(n²)**.',
    },
    {
      kind: 'watch',
      title: 'One after another adds; inside a loop multiplies',
      lines: ['Two loops one after another: n + n = 2n steps, still **O(n)**.', 'A loop inside a loop: for each i, all n values of j run.', 'n rows of n cells: n · n steps, so **O(n²)**.'],
      frames: [
        { say: 0, note: 'Loop A then loop B over the same 4 elements: 4 + 4 = 8 steps.', panels: [arr([0, 1, 2, 3], { label: 'loop A', highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'done' } }), arr([0, 1, 2, 3], { label: 'loop B', highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'done' } }), vars({ steps: 8 })] },
        { say: 1, note: 'Nested: i = 0 runs j = 0, 1, 2, 3.', panels: [grid(4, 0, 'cells (i, j)'), vars({ i: 0, steps: 4 })] },
        { say: 1, note: 'i = 1 runs all four j again.', panels: [grid(4, 1, 'cells (i, j)'), vars({ i: 1, steps: 8 })] },
        { say: 1, note: 'i = 2', panels: [grid(4, 2, 'cells (i, j)'), vars({ i: 2, steps: 12 })] },
        { say: 2, note: '4 × 4 = 16 steps. With n = 1,000 it would be 1,000,000.', panels: [grid(4, 4, 'cells (i, j)'), vars({ i: 3, steps: 16 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Halving gives log n',
      lines: ['Each step throws away half of what is left.', '16 → 8 → 4 → 2 → 1: four halvings.', 'log₂ 16 = 4, so a loop that halves the work runs **O(log n)** times.'],
      frames: halves.map(([lo, hi], s) => ({
        say: s === 0 ? 0 : s < halves.length - 1 ? 1 : 2,
        note: s === 0 ? '16 elements left.' : `${hi - lo + 1} left after ${s} halving${s === 1 ? '' : 's'}.`,
        // 16 cells in two rows of 8, so it fits a phone; the half thrown away goes grey
        panels: [0, 8].map((off) =>
          arr(SORTED.slice(off, off + 8), { label: off ? 'elements 8–15' : 'elements 0–7', showIndices: false, highlights: hl(8, (k) => (k + off >= lo && k + off <= hi ? 'window' : 'muted')) }),
        ).concat(vars({ left: hi - lo + 1, steps: s })),
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: a doubling loop',
      lines: ['Doubling i is the same idea as halving the work.', 'Count the values i takes before the condition stops the loop.'],
      panels: [arr([1, 2, 4, 8, 16], { label: 'values i can take' }), vars({ code: 'for (let i = 1; i < 32; i *= 2)' })],
      task: {
        type: 'number',
        question: 'How many times does the body of `for (let i = 1; i < 32; i *= 2) { work(); }` run?',
        options: [31, 16, 5, 6],
        answer: 5,
        hint: 'List i: 1, 2, 4, 8, 16; the next value, 32, fails `i < 32`.',
      },
      solved: 'Five runs, and log₂ 32 = 5: doubling reaches n in about log₂ n steps.',
      then: [1, 2, 4, 8, 16].map((v, k) => ({ say: 1, note: `run ${k + 1}: i = ${v}`, panels: [arr([1, 2, 4, 8, 16], { label: 'values i can take', pointers: [{ index: k, label: 'i', color: 'a' }], highlights: Object.fromEntries([0, 1, 2, 3, 4].map((x) => [x, x < k ? 'done' : x === k ? 'active' : ''])) })] })),
    },
  ],

  'intuition-amortized': [
    {
      kind: 'watch',
      title: 'push writes into a free slot',
      lines: ['A JavaScript array reserves some spare capacity.', '`push` writes into the next free slot: one step, **O(1)**.'],
      frames: [
        { say: 0, note: 'Capacity 4, nothing stored yet.', panels: [arr(['·', '·', '·', '·'], { label: 'capacity 4', highlights: { 0: 'muted', 1: 'muted', 2: 'muted', 3: 'muted' } }), vars({ size: 0, capacity: 4 })] },
        { say: 1, note: 'push(7): one write.', panels: [arr([7, '·', '·', '·'], { label: 'capacity 4', highlights: { 0: 'active', 1: 'muted', 2: 'muted', 3: 'muted' } }), vars({ size: 1, capacity: 4 })] },
        { say: 1, note: 'push(3): one write.', panels: [arr([7, 3, '·', '·'], { label: 'capacity 4', highlights: { 1: 'active', 2: 'muted', 3: 'muted' } }), vars({ size: 2, capacity: 4 })] },
        { say: 1, note: 'push(9) and push(1): now it is full.', panels: [arr([7, 3, 9, 1], { label: 'capacity 4', highlights: { 2: 'active', 3: 'active' } }), vars({ size: 4, capacity: 4 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Full: allocate bigger, copy everything',
      lines: ['When the capacity is full, the engine allocates a bigger block (typically about 1.5–2× larger).', 'Then it **copies everything** across: O(n) for that one push.'],
      frames: [
        { say: 0, note: 'push(5) on a full array of 4.', panels: [arr([7, 3, 9, 1], { label: 'old block, full', highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'bad' } }), vars({ size: 4, capacity: 4 })] },
        { say: 0, note: 'A new block of 8 is allocated.', panels: [arr([7, 3, 9, 1], { label: 'old block' }), arr(['·', '·', '·', '·', '·', '·', '·', '·'], { label: 'new block, capacity 8', highlights: { 0: 'muted', 1: 'muted', 2: 'muted', 3: 'muted', 4: 'muted', 5: 'muted', 6: 'muted', 7: 'muted' } })] },
        { say: 1, note: 'All 4 elements are copied: 4 copies for this one push.', panels: [arr([7, 3, 9, 1, '·', '·', '·', '·'], { label: 'new block, capacity 8', highlights: { 0: 'window', 1: 'window', 2: 'window', 3: 'window', 4: 'muted', 5: 'muted', 6: 'muted', 7: 'muted' } }), vars({ copies: 4 })] },
        { say: 1, note: 'Then 5 goes into the next free slot. The next three pushes are cheap again.', panels: [arr([7, 3, 9, 1, 5, '·', '·', '·'], { label: 'new block, capacity 8', highlights: { 4: 'active', 5: 'muted', 6: 'muted', 7: 'muted' } }), vars({ size: 5, capacity: 8, copies: 4 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Add up all the copies',
      lines: ['With doubling, resizes copy 1, then 2, then 4, then 8… elements.', 'Over n pushes the copies add up to 1 + 2 + 4 + … + n, which is less than 2n.', 'Under 2 copies per push on average: **O(1) amortized**.'],
      frames: [1, 2, 3, 4, 5].map((k) => {
        const rows = [1, 2, 4, 8, 16].slice(0, k);
        const total = rows.reduce((a, b) => a + b, 0);
        return {
          say: k < 3 ? 0 : k < 5 ? 1 : 2,
          note: k < 5 ? `So far ${total} copies.` : '32 pushes (starting from capacity 1) copied 31 elements in total: fewer than 2 × 32.',
          panels: [table(rows.map((c) => `full at ${c}`), ['copies'], rows.map((c) => [String(c)]), rows.map((_, i) => [i === k - 1 ? 'active' : null])), vars({ pushes: 32, totalCopies: total })],
        };
      }),
    },
    {
      kind: 'turn',
      title: 'Amortized is not the same as average',
      lines: ['**Amortized O(1)**: any sequence of k operations costs O(k) in total, no luck involved.', '**Average O(1)**: expected over random inputs, so a bad input could still be slow.'],
      panels: [table(['array push', 'Map lookup'], ['cost'], [['O(1) amortized'], ['O(1) average']])],
      task: {
        type: 'choose',
        question: 'Which of these is a **hard guarantee** over any sequence of operations?',
        options: [
          { text: 'A Map lookup being O(1) on average', why: 'Average means expected over random inputs; with a good hash it is fast, but a bad input could still be slow.' },
          { text: 'An array push being O(1) amortized', why: '' },
          { text: 'Both', why: 'Only amortized is a guarantee over every sequence. Average depends on the inputs.' },
        ],
        answer: 1,
      },
      solved: 'Amortized bounds the total of every sequence; average only holds in expectation.',
    },
    {
      kind: 'watch',
      title: 'Looks nested, is linear',
      lines: ['`j` is declared outside the loop and never goes back.', 'Across the whole run, `j` can only move forward n times in total.', 'i moves n times, j at most n times: **O(n)**, not O(n²).'],
      frames: [
        ...RUN.map(([i, j], s) => ({
          say: s === 0 ? 0 : 1,
          note: `i = ${i} (value ${NUMS[i]}): j moves while nums[j] < ${NUMS[i]} + 3, and stops at ${j}.`,
          panels: [
            arr(NUMS, {
              label: 'nums, k = 3',
              pointers: j < NUMS.length ? [{ index: i, label: 'i', color: 'a' }, { index: j, label: 'j', color: 'b' }] : [{ index: i, label: 'i', color: 'a' }],
              highlights: Object.fromEntries(NUMS.map((_, x) => [x, x < j ? 'visited' : ''])),
            }),
            vars({ i, j, 'j moves so far': j }),
          ],
        })),
        { say: 2, note: 'j has reached the end: it moved 6 times in total, never 6 × 6.', panels: [arr(NUMS, { label: 'nums, k = 3', highlights: Object.fromEntries(NUMS.map((_, x) => [x, 'visited'])) }), vars({ 'i moves': 6, 'j moves': 6 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the copies',
      lines: ['Start with capacity 1 and double whenever the array is full.', 'A resize copies every element already stored.'],
      panels: [arr([1, 2, 3, 4, 5, 6, 7, 8], { label: '8 pushes' }), vars({ capacity: '1 → 2 → 4 → 8' })],
      task: {
        type: 'number',
        question: 'You push 8 items. How many element copies happen in total?',
        options: [3, 7, 8, 28],
        answer: 7,
        hint: 'Copies happen only when it is full: at sizes 1, 2 and 4. Add those.',
      },
      solved: '1 + 2 + 4 = 7 copies for 8 pushes: under one copy per push.',
    },
  ],

  'intuition-space': [
    {
      kind: 'watch',
      title: 'The call stack grows with recursion',
      lines: ['Every call that has not returned yet waits on the **call stack** with its own variables.', '`sumTo(3)` → `sumTo(2)` → `sumTo(1)` → `sumTo(0)`: four calls waiting at the deepest point.', 'Then they return one by one and free their frames.', 'Depth n means **O(n)** space, even with no arrays.'],
      frames: [
        { say: 0, note: 'sumTo(3) starts and needs sumTo(2).', panels: [stack(['sumTo(3)'], 'call stack'), vars({ depth: 1 })] },
        { say: 1, note: 'sumTo(2) waits for sumTo(1).', panels: [stack(['sumTo(3)', 'sumTo(2)'], 'call stack'), vars({ depth: 2 })] },
        { say: 1, note: 'sumTo(1) waits for sumTo(0).', panels: [stack(['sumTo(3)', 'sumTo(2)', 'sumTo(1)'], 'call stack'), vars({ depth: 3 })] },
        { say: 1, note: 'sumTo(0) is the base case: the stack is at its deepest.', panels: [stack(['sumTo(3)', 'sumTo(2)', 'sumTo(1)', 'sumTo(0)'], 'call stack'), vars({ depth: 4 })] },
        { say: 2, note: 'sumTo(0) returns 0 and its frame is freed.', panels: [stack(['sumTo(3)', 'sumTo(2)', 'sumTo(1)'], 'call stack'), vars({ depth: 3, returned: 0 })] },
        { say: 2, note: 'sumTo(1) returns 1, sumTo(2) returns 3…', panels: [stack(['sumTo(3)'], 'call stack'), vars({ depth: 1, returned: 3 })] },
        { say: 3, note: 'sumTo(3) returns 6. The most memory was used at depth 4, so space grows with n.', panels: [stack([], 'call stack'), vars({ depth: 0, result: 6 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how deep?',
      lines: ['Count the calls that are waiting at the same moment.', 'Include the first call and the base case.'],
      panels: [stack(['sumTo(5)', '…'], 'call stack'), vars({ code: 'if (n === 0) return 0; return n + sumTo(n - 1);' })],
      task: {
        type: 'number',
        question: 'At the deepest point of `sumTo(5)`, how many calls are waiting on the call stack?',
        options: [1, 5, 6, 15],
        answer: 6,
        hint: 'Count sumTo(5), sumTo(4), … down to sumTo(0), including both ends.',
      },
      solved: 'Six frames, sumTo(5) down to sumTo(0): stack space grows with n.',
    },
    {
      kind: 'watch',
      title: 'Time is the whole tree; space is one path',
      lines: ['Naive `fib(n)` calls `fib(n−1)` and `fib(n−2)`, so the call tree has about 2ⁿ nodes: **O(2ⁿ)** time.', 'Only one root-to-leaf path is waiting at any moment; finished calls free their frames.', 'The tree is only n levels tall, so space is **O(n)**.'],
      frames: [
        { say: 0, note: 'Every node is one call: 9 calls for fib(4).', panels: [fibTree({ a: 'done', b: 'done', c: 'done', d: 'done', e: 'done', f: 'done', g: 'done', h: 'done', i: 'done' })] },
        { say: 1, note: 'Going down the left side: fib(4) → fib(3) → fib(2) → fib(1).', panels: [fibTree({ a: 'active', b: 'active', d: 'active', h: 'active' }), stack(['fib(4)', 'fib(3)', 'fib(2)', 'fib(1)'], 'call stack')] },
        { say: 1, note: 'fib(1) returns; fib(0) takes its place. Still 4 frames.', panels: [fibTree({ a: 'active', b: 'active', d: 'active', h: 'done', i: 'active' }), stack(['fib(4)', 'fib(3)', 'fib(2)', 'fib(0)'], 'call stack')] },
        { say: 1, note: 'Later the right branch runs, after the left one has freed its frames.', panels: [fibTree({ a: 'active', b: 'done', d: 'done', e: 'done', h: 'done', i: 'done', c: 'active', f: 'active' }), stack(['fib(4)', 'fib(2)', 'fib(1)'], 'call stack')] },
        { say: 2, note: '9 calls in total, but never more than 4 waiting at once: time follows the tree, space its height.', panels: [fibTree({ a: 'done', b: 'done', c: 'done', d: 'done', e: 'done', f: 'done', g: 'done', h: 'done', i: 'done' }), stack([], 'call stack')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: very deep recursion',
      lines: ['JavaScript engines allow roughly 10,000 nested calls (it varies by engine and frame size).', 'For deep inputs, turn the recursion into a loop with an explicit stack.'],
      panels: [stack(['f(100000)', '…', 'f(2)', 'f(1)'], 'call stack')],
      task: {
        type: 'choose',
        question: 'A recursive function goes 100,000 calls deep in JavaScript. What happens?',
        options: [
          { text: 'It works, just slowly', why: 'Speed is not the problem: the engine runs out of stack long before 100,000 nested calls.' },
          { text: 'It throws RangeError: Maximum call stack size exceeded', why: '' },
          { text: 'The engine moves the frames to the heap automatically', why: 'JavaScript engines do not do that; deep recursion overflows the stack.' },
        ],
        answer: 1,
      },
      solved: 'Depth 10⁵ overflows the stack: use a loop with an explicit stack instead.',
    },
  ],
  what: [
    {
      kind: 'watch',
      title: 'Count steps, not seconds',
      lines: ['We count **basic steps**: a comparison, an addition, reading `arr[i]`.', '`sum(arr)` does 1 step to start, n steps in the loop and 1 to return: **n + 2**.', 'n + 2 grows like n, so `sum` is **O(n)**.'],
      frames: [
        { say: 0, note: '`let total = 0`: 1 step.', panels: [arr([3, 1, 4, 1, 5], { label: 'arr' }), vars({ total: 0, steps: 1 })] },
        ...[3, 1, 4, 1, 5].map((v, i, a) => ({
          say: 1,
          note: `total += ${v}: 1 step.`,
          panels: [arr(a, { label: 'arr', pointers: [{ index: i, label: 'x', color: 'a' }], highlights: hl(5, (k) => (k < i ? 'done' : k === i ? 'active' : '')) }), vars({ total: a.slice(0, i + 1).reduce((x, y) => x + y, 0), steps: i + 2 })],
        })),
        { say: 2, note: '`return total`: 1 step. 5 elements → 7 steps = n + 2.', panels: [arr([3, 1, 4, 1, 5], { label: 'arr', highlights: hl(5, () => 'done') }), vars({ total: 14, steps: 7 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'The phone book: how you search matters',
      lines: ['Reading page by page: twice as many pages, twice as long (**linear**).', 'Opening in the middle and discarding half each time: twice as many pages, just **one more** step (**logarithmic**).'],
      frames: [
        { say: 0, note: '100 pages.', panels: [table(['100 pages'], ['page by page', 'halve each time'], [['100', '7']])] },
        { say: 0, note: 'Double the book: page by page doubles.', panels: [table(['100 pages', '200 pages'], ['page by page', 'halve each time'], [['100', '7'], ['200', '8']], [[null, null], ['bad', null]])] },
        { say: 1, note: 'Halving needs one more step each time the book doubles.', panels: [table(['100 pages', '200 pages', '400 pages'], ['page by page', 'halve each time'], [['100', '7'], ['200', '8'], ['400', '9']], [[null, null], [null, null], ['bad', 'active']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count them',
      lines: ['1 step for `let total = 0`.', 'One step per element in the loop.', '1 step for `return total`.'],
      panels: [arr([2, 9, 4, 7, 1, 8, 3, 6, 5, 0], { label: 'arr, n = 10' })],
      task: { type: 'number', question: 'By the lesson\'s count (n + 2), how many basic steps does `sum` take on this array of 10?', options: [10, 11, 12, 20], answer: 12, hint: '1 to start, 10 in the loop, 1 to return.' },
      solved: '10 + 2 = 12. The +2 never changes the growth, so it is still O(n).',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'The gap grows enormous',
      lines: ['Growth rates look close for small n.', 'Once n is large, the gap is enormous: at n = 100,000, n² is 10 billion steps.'],
      frames: [
        { say: 0, note: 'n = 10: everything is small.', panels: [table(['n = 10'], ['log n', 'n', 'n log n', 'n²', '2ⁿ'], [['3', '10', '33', '100', '1,024']])] },
        { say: 1, note: 'n = 1,000: 2ⁿ is already about 10³⁰¹.', panels: [table(['n = 10', 'n = 1,000'], ['log n', 'n', 'n log n', 'n²', '2ⁿ'], [['3', '10', '33', '100', '1,024'], ['10', '1,000', '10,000', '1,000,000', '≈ 10³⁰¹']], [[null, null, null, null, null], [null, null, null, null, 'bad']])] },
        { say: 1, note: 'n = 100,000: n log n is 1.7 million, n² is 10 billion.', panels: [table(['n = 10', 'n = 1,000', 'n = 100,000'], ['log n', 'n', 'n log n', 'n²', '2ⁿ'], [['3', '10', '33', '100', '1,024'], ['10', '1,000', '10,000', '1,000,000', '≈ 10³⁰¹'], ['17', '100,000', '1.7 million', '10 billion', '—']], [[null, null, null, null, null], [null, null, null, null, null], [null, null, 'active', 'bad', null]])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how long would it take?',
      lines: ['A computer does very roughly **10⁸ simple steps per second**.', 'A JavaScript engine is in the same ballpark, often a little slower.'],
      panels: [table(['O(n log n)', 'O(n²)'], ['steps at n = 100,000'], [['1.7 million'], ['10 billion']])],
      task: {
        type: 'choose',
        question: 'At about 10⁸ steps per second, how long does an O(n²) solution take for n = 100,000?',
        options: [
          { text: 'A few milliseconds', why: 'That is the O(n log n) solution: 1.7 million steps.' },
          { text: 'About 1 second', why: '10 billion is 10¹⁰; divided by 10⁸ per second that is 100 seconds, not 1.' },
          { text: 'About 100 seconds', why: '' },
        ],
        answer: 2,
      },
      solved: '10¹⁰ ÷ 10⁸ = 100 seconds: the difference between accepted and time limit exceeded.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Best, average and worst case',
      lines: ['**Best case**, the luckiest input: x is first, 1 step.', '**Average case**: x is somewhere in the middle, about n/2 steps.', '**Worst case**, the unluckiest input: x is last or missing, all n steps. This is the guarantee we state.'],
      frames: [
        { say: 0, note: 'Search for 7: found at index 0 after 1 step.', panels: [arr(SEARCH, { pointers: [{ index: 0, label: 'found', color: 'a' }], highlights: { 0: 'active' } }), vars({ steps: 1 })] },
        { say: 1, note: 'Search for 4: found at index 3 after 4 steps, about n/2.', panels: [arr(SEARCH, { pointers: [{ index: 3, label: 'found', color: 'a' }], highlights: hl(8, (k) => (k < 3 ? 'visited' : k === 3 ? 'active' : '')) }), vars({ steps: 4 })] },
        { say: 2, note: 'Search for 5: not there. Every one of the 8 elements was checked.', panels: [arr(SEARCH, { highlights: hl(8, () => 'bad') }), vars({ steps: 8 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: when to think about complexity',
      lines: ['Complexity is not a final step: it guides you before, during and after coding.'],
      panels: [table(['before', 'while choosing', 'after'], ['you…'], [['read the constraints'], ['compare ideas'], ['state time and space']])],
      task: {
        type: 'order',
        question: 'Tap these in the order you do them.',
        items: ['Read the constraints and pick a target complexity', 'Compare ideas by their complexity', 'Write the code', 'State the time and space complexity'],
        hint: 'The constraints come first; stating the complexity comes after you finish.',
      },
      solved: 'Before, while choosing, after: complexity guides every stage.',
    },
    {
      kind: 'turn',
      title: 'Your turn: when the cases differ',
      lines: ['State the worst case unless asked otherwise.', 'Mention the average case when it differs meaningfully, as it does for hash maps.'],
      panels: [table(['average', 'worst'], ['hash map lookup'], [['O(1)'], ['O(n)']])],
      task: {
        type: 'choose',
        question: 'An interviewer asks for the cost of a hash map lookup. What do you say?',
        options: [
          { text: 'O(1), always', why: 'The worst case is O(n), and it differs meaningfully, so say both.' },
          { text: 'O(1) on average, O(n) in the worst case', why: '' },
          { text: 'O(n)', why: 'That is only the worst case; the average O(1) is the reason we use hash maps, so state it too.' },
        ],
        answer: 1,
      },
      solved: 'Worst case is the guarantee; add the average when it differs, as for hash maps and quicksort.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clues in the code',
      lines: ['Count how many times the innermost statement runs, as a function of n.', 'Each shape of code has a tell-tale clue.'],
      frames: [
        ['one loop over n', 'O(n)'],
        ['loop inside loop', 'multiply'],
        ['loops one after another', 'add'],
        ['i *= 2 or n /= 2', 'log n'],
        ['sort', 'n log n'],
        ['two recursive calls per level', '2ⁿ'],
        ['built-in call inside a loop', 'check its cost'],
      ].map((_, k, all) => ({
        say: k === 0 ? 0 : 1,
        note: `${all[k][0]} → ${all[k][1]}`,
        panels: [table(all.slice(0, k + 1).map((r) => r[0]), ['means'], all.slice(0, k + 1).map((r) => [r[1]]), all.slice(0, k + 1).map((_, i) => [i === k ? 'active' : null]))],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: fastest to slowest',
      lines: ['O(1) constant, O(log n) logarithmic, O(n) linear…', '…O(n log n) linearithmic, O(n²) quadratic, O(2ⁿ) exponential.'],
      panels: [table(['`arr[i]`', 'binary search', 'one pass', 'sorting', 'all pairs', 'all subsets'], ['typical code'], [['?'], ['?'], ['?'], ['?'], ['?'], ['?']])],
      task: { type: 'order', question: 'Tap the complexities from fastest to slowest.', items: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'], hint: 'Constant, then logarithmic, linear, linearithmic, quadratic, exponential.' },
      solved: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ), and O(n!) is slower still.',
    },
    {
      kind: 'turn',
      title: 'Your turn: a built-in inside a loop',
      lines: ['A built-in call inside a loop: check its real cost.', '`sort` is O(n log n); a copy with spread is O(n).'],
      panels: [code('for (let i = 0; i < n; i++) { const s = [...arr].sort(cmp); }')],
      task: {
        type: 'choose',
        question: 'What is the time complexity of this loop (arr has n elements)?',
        options: [
          { text: 'O(n)', why: 'Each round copies and sorts the whole array; that is not O(1) work.' },
          { text: 'O(n log n)', why: 'One sort is O(n log n), but it runs n times: multiply.' },
          { text: 'O(n² log n)', why: '' },
        ],
        answer: 2,
      },
      solved: 'n rounds × O(n log n) each = O(n² log n): nested work multiplies.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Try every pair',
      lines: ['Try every pair once: `j` starts at `i + 1`.', 'The inner loop runs (n−1) + (n−2) + … + 1 = n(n−1)/2 times.', 'That is n²/2 − n/2: **O(n²)** time and **O(1)** extra space.'],
      frames: [
        ...pairList.map(([i, j], k) => ({
          say: k === 0 ? 0 : 1,
          note: `${PAIRS[i]} + ${PAIRS[j]} = ${PAIRS[i] + PAIRS[j]}, not 20.`,
          panels: [arr(PAIRS, { label: 'nums, target 20', pointers: [{ index: i, label: 'i', color: 'a' }, { index: j, label: 'j', color: 'b' }], highlights: { [i]: 'active', [j]: 'active' } }), vars({ 'pairs checked': k + 1 })],
        })),
        { say: 2, note: 'No pair sums to 20: all 4·3/2 = 6 pairs were checked.', panels: [arr(PAIRS, { label: 'nums, target 20', highlights: hl(4, () => 'bad') }), vars({ 'pairs checked': 6 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the pairs',
      lines: ['The worst case checks every pair once.', 'n(n−1)/2 pairs for n elements.'],
      panels: [arr([5, 1, 9, 2, 7], { label: 'nums, n = 5' })],
      task: { type: 'number', question: 'With n = 5 and no matching pair, how many pairs does the loop check?', options: [5, 10, 20, 25], answer: 10, hint: 'n(n−1)/2 = 5 · 4 / 2.' },
      solved: '10 pairs: about n²/2, and the ½ disappears in Big-O.',
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Sort, then two pointers',
      lines: ['Sort a copy: **O(n log n)**.', 'Two pointers from both ends: sum too small, move `lo` up; too big, move `hi` down. **O(n)** in total.', 'One after another adds: O(n log n) + O(n) = **O(n log n)**.'],
      frames: [
        { say: 0, note: 'nums = [3, 8, 1, 6], target 14.', panels: [arr(PAIRS, { label: 'nums' })] },
        { say: 0, note: 'Sorted copy.', panels: [arr([1, 3, 6, 8], { label: 'sorted copy', highlights: hl(4, () => 'done') })] },
        { say: 1, note: '1 + 8 = 9 < 14: move lo up.', panels: [arr([1, 3, 6, 8], { label: 'sorted copy', pointers: [{ index: 0, label: 'lo', color: 'a' }, { index: 3, label: 'hi', color: 'b' }] }), vars({ s: 9 })] },
        { say: 1, note: '3 + 8 = 11 < 14: move lo up.', panels: [arr([1, 3, 6, 8], { label: 'sorted copy', pointers: [{ index: 1, label: 'lo', color: 'a' }, { index: 3, label: 'hi', color: 'b' }], highlights: { 0: 'muted' } }), vars({ s: 11 })] },
        { say: 2, note: '6 + 8 = 14: found.', panels: [arr([1, 3, 6, 8], { label: 'sorted copy', pointers: [{ index: 2, label: 'lo', color: 'a' }, { index: 3, label: 'hi', color: 'b' }], highlights: { 0: 'muted', 1: 'muted', 2: 'active', 3: 'active' } }), vars({ s: 14 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Remember what you have seen',
      lines: ['Walk once, keeping every value seen in a Set.', 'For each x, check whether `target − x` is already in the Set: O(1) on average.', '**O(n)** average time, but **O(n)** extra space.'],
      frames: [
        { say: 0, note: '3: is 11 in the Set? No. Add 3.', panels: [arr(PAIRS, { label: 'nums, target 14', pointers: [{ index: 0, label: 'x', color: 'a' }] }), vars({ need: 11, seen: '{3}' })] },
        { say: 1, note: '8: is 6 in the Set? No. Add 8.', panels: [arr(PAIRS, { label: 'nums, target 14', pointers: [{ index: 1, label: 'x', color: 'a' }], highlights: { 0: 'visited' } }), vars({ need: 6, seen: '{3, 8}' })] },
        { say: 1, note: '1: is 13 in the Set? No. Add 1.', panels: [arr(PAIRS, { label: 'nums, target 14', pointers: [{ index: 2, label: 'x', color: 'a' }], highlights: { 0: 'visited', 1: 'visited' } }), vars({ need: 13, seen: '{3, 8, 1}' })] },
        { say: 2, note: '6: is 8 in the Set? Yes: 8 + 6 = 14. One pass, but the Set grew with n.', panels: [arr(PAIRS, { label: 'nums, target 14', pointers: [{ index: 3, label: 'x', color: 'a' }], highlights: { 0: 'visited', 1: 'active', 2: 'visited', 3: 'active' } }), vars({ need: 8, seen: '{3, 8, 1}' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the time–space trade-off',
      lines: ['The fastest idea often uses more memory.', 'Both are valid; the constraints decide.'],
      panels: [table(['all pairs', 'sort + two pointers', 'Set'], ['time', 'extra space'], [['O(n²)', 'O(1)'], ['O(n log n)', 'O(1)–O(n)'], ['O(n) average', 'O(n)']])],
      task: {
        type: 'choose',
        question: 'n is large, O(n log n) is fast enough, and you want to keep extra memory small. Which idea fits?',
        options: [
          { text: 'The Set', why: 'It is the fastest, but it always needs O(n) extra memory.' },
          { text: 'Sort + two pointers', why: '' },
          { text: 'All pairs', why: 'It uses O(1) space, but O(n²) is too slow when n is large.' },
        ],
        answer: 1,
      },
      solved: 'Sort + two pointers trades a little time for less memory; the constraints decide.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Constraints tell you the target',
      lines: ['Read the constraints **first**.', 'At about 10⁸ simple steps per second, the largest n tells you the intended complexity.'],
      frames: [
        ['≤ 10–12', 'O(n!)'],
        ['≤ 20–25', 'O(2ⁿ)'],
        ['≤ 100–500', 'O(n³)'],
        ['≤ 2,000–5,000', 'O(n²)'],
        ['≤ 10⁵–10⁶', 'O(n log n) or O(n)'],
        ['≤ 10⁹ or more', 'O(log n) or O(1)'],
      ].map((_, k, all) => ({
        say: k === 0 ? 0 : 1,
        note: `max n ${all[k][0]} → aim for ${all[k][1]}`,
        panels: [table(all.slice(0, k + 1).map((r) => `n ${r[0]}`), ['target'], all.slice(0, k + 1).map((r) => [r[1]]), all.slice(0, k + 1).map((_, i) => [i === k ? 'active' : null]))],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: a small n',
      lines: ['A small limit is a hint that a slow-growing idea is allowed.', 'n ≤ 20–25 points at all subsets or bitmask DP.'],
      panels: [code('1 <= nums.length <= 20')],
      task: {
        type: 'choose',
        question: 'Constraints say n ≤ 20. What is the intended solution likely to be?',
        options: [
          { text: 'Try all permutations, O(n!)', why: 'n! at n = 20 is far too big; permutations fit n ≤ 10–12.' },
          { text: 'Try all subsets, O(2ⁿ)', why: '' },
          { text: 'Binary search, O(log n)', why: 'O(log n) targets n ≤ 10⁹; a limit of 20 is a hint that exponential work is allowed.' },
        ],
        answer: 1,
      },
      solved: '2²⁰ is about a million steps: all subsets fit easily.',
    },
    {
      kind: 'turn',
      title: 'Your turn: analyse any code',
      lines: ['The same checklist works on any piece of code.'],
      panels: [table(['1', '2', '3', '4', '5', '6'], ['step'], [['?'], ['?'], ['?'], ['?'], ['?'], ['?']])],
      task: {
        type: 'order',
        question: 'Tap the analysis steps in order.',
        items: ['Name the input sizes', 'Count the iterations of each loop', 'Multiply nested work, add sequential work', 'Expand built-in calls to their real cost', 'Recursion: calls × work per call; depth for space', 'Drop constants and lower terms; state time and space'],
        hint: 'Start from the inputs, end by simplifying and stating both time and space.',
      },
      solved: 'Inputs → loops → combine → built-ins → recursion → simplify and state both.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: '`shift()` moves everything',
      lines: ['`shift()` removes the first element, then every other element moves one slot: **O(n)**.', 'Inside a `while` loop over the queue, that is **O(n²)** in total.', 'A `head` index reads `queue[head++]` instead: O(1) each, **O(n)** in total.'],
      frames: [
        { say: 0, note: 'shift() takes 10…', panels: [arr([10, 20, 30, 40, 50], { label: 'queue', highlights: { 0: 'bad' } }), vars({ moves: 0 })] },
        { say: 0, note: '…and 20, 30, 40, 50 each move one slot left: 4 moves.', panels: [arr([20, 30, 40, 50], { label: 'queue', highlights: hl(4, () => 'window') }), vars({ moves: 4 })] },
        { say: 1, note: 'The next shift() moves 3 more. 4 + 3 + 2 + 1: quadratic.', panels: [arr([30, 40, 50], { label: 'queue', highlights: hl(3, () => 'window') }), vars({ moves: 7 })] },
        { say: 2, note: 'With a head index nothing moves: read queue[0]…', panels: [arr([10, 20, 30, 40, 50], { label: 'queue', pointers: [{ index: 0, label: 'head', color: 'a' }], highlights: { 0: 'active' } }), vars({ moves: 0 })] },
        { say: 2, note: '…then queue[1], queue[2]. Each read is O(1).', panels: [arr([10, 20, 30, 40, 50], { label: 'queue', pointers: [{ index: 2, label: 'head', color: 'a' }], highlights: { 0: 'done', 1: 'done', 2: 'active' } }), vars({ moves: 0 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which one is cheap?',
      lines: ['Many single lines of JavaScript are loops in disguise.', 'Only slot access and the end of the array are O(1).'],
      panels: [code('includes · slice() · pop() · shift()')],
      task: {
        type: 'choose',
        question: 'Which of these is O(1)?',
        options: [
          { text: '`arr.includes(x)`', why: 'includes is a linear scan: O(n).' },
          { text: '`arr.slice()`', why: 'slice creates a full copy: O(n).' },
          { text: '`arr.pop()`', why: '' },
          { text: '`arr.shift()`', why: 'shift moves every other element one slot: O(n).' },
        ],
        answer: 2,
      },
      solved: '`pop` works at the end of the array, so nothing else moves: O(1).',
    },
    {
      kind: 'watch',
      title: 'Spread in reduce copies every step',
      lines: ['`[...acc, x * 2]` copies the whole accumulator on every step.', 'The copies add up: 0 + 1 + 2 + 3 + …, so **O(n²)** in total.', '`push` (or `map`) adds in place: **O(n)**.'],
      frames: [
        { say: 0, note: 'Step 1: copy 0 elements, add 2.', panels: [arr([2], { label: 'acc', highlights: { 0: 'active' } }), vars({ copies: 0 })] },
        { say: 0, note: 'Step 2: copy 1 element, add 4.', panels: [arr([2, 4], { label: 'acc', highlights: { 0: 'window', 1: 'active' } }), vars({ copies: 1 })] },
        { say: 1, note: 'Step 3: copy 2, add 6.', panels: [arr([2, 4, 6], { label: 'acc', highlights: { 0: 'window', 1: 'window', 2: 'active' } }), vars({ copies: 3 })] },
        { say: 1, note: 'Step 4: copy 3, add 8. 0 + 1 + 2 + 3 grows like n².', panels: [arr([2, 4, 6, 8], { label: 'acc', highlights: { 0: 'window', 1: 'window', 2: 'window', 3: 'active' } }), vars({ copies: 6 })] },
        { say: 2, note: 'With push: one write per element, no copies.', panels: [arr([2, 4, 6, 8], { label: 'out', highlights: hl(4, () => 'done') }), vars({ copies: 0 })] },
      ],
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'Halve the outer loop, add up the inner one',
      lines: ['The outer loop takes i = 8, 4, 2, 1: it halves.', 'The inner loop runs i times each round.', '8 + 4 + 2 + 1 = 15 < 2n: **O(n)**, not O(n log n).'],
      frames: [
        [8, 8],
        [4, 12],
        [2, 14],
        [1, 15],
      ].map(([i, total], k, all) => ({
        say: k === 0 ? 0 : k < 3 ? 1 : 2,
        note: k < 3 ? `i = ${i}: the inner loop runs ${i} times. Running total ${total}.` : 'i = 1: one more. Total 15, less than 2 × 8.',
        panels: [
          arr([0, 1, 2, 3, 4, 5, 6, 7], { label: `inner loop for i = ${i}`, highlights: hl(8, (x) => (x < i ? 'active' : 'muted')) }),
          table(all.slice(0, k + 1).map((r) => `i = ${r[0]}`), ['inner', 'total'], all.slice(0, k + 1).map((r) => [String(r[0]), String(r[1])])),
        ],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: n = 16',
      lines: ['Same loops: the outer i halves, the inner loop runs i times.', 'A geometric series is dominated by its first term.'],
      panels: [code('for (let i = n; i >= 1; i = Math.floor(i / 2)) for (let j = 0; j < i; j++) work();'), vars({ n: 16 })],
      task: { type: 'number', question: 'With n = 16, how many times does `work()` run?', options: [16, 31, 64, 80], answer: 31, hint: 'Add 16 + 8 + 4 + 2 + 1.' },
      solved: '31 runs, still under 2n = 32: linear.',
    },
  ],

  mistakes: [
    {
      kind: 'turn',
      title: 'Adding is not halving',
      lines: ['Adding a constant to i is linear.', 'Multiplying (or halving) is logarithmic.'],
      panels: [code('for (let i = 0; i < n; i += 2) work();')],
      task: {
        type: 'choose',
        question: 'What is the time complexity of this loop?',
        options: [
          { text: 'O(log n)', why: 'i += 2 adds a constant, so it runs n/2 times; only multiplying gives log n.' },
          { text: 'O(n)', why: '' },
          { text: 'O(n/2)', why: 'Constants are dropped: n/2 is O(n).' },
        ],
        answer: 1,
      },
      solved: 'n/2 runs is O(n). Only `i *= 2` or `i /= 2` gives log n.',
    },
    {
      kind: 'turn',
      title: 'Keep different inputs apart',
      lines: ['Two inputs of sizes n and m stay separate.', 'One after another adds: O(n + m).'],
      panels: [code('for (const x of a) f(x);   // a.length = n\nfor (const y of b) g(y);   // b.length = m')],
      task: {
        type: 'choose',
        question: 'What is the time complexity?',
        options: [
          { text: 'O(n)', why: 'That hides m: if b is huge, the second loop dominates.' },
          { text: 'O(n · m)', why: 'The loops run one after another, not one inside the other: add, do not multiply.' },
          { text: 'O(n + m)', why: '' },
        ],
        answer: 2,
      },
      solved: 'Sequential loops over different inputs add: O(n + m).',
    },
    {
      kind: 'turn',
      title: 'The output has a cost too',
      lines: ['Returning many results costs at least the time to write them.'],
      panels: [arr([1, 2, 3, 4], { label: 'return every pair' })],
      task: {
        type: 'choose',
        question: 'A function returns every pair of n elements. What is the least time it can take?',
        options: [
          { text: 'O(n), with a clever loop', why: 'There are n(n−1)/2 pairs; writing each one costs at least one step.' },
          { text: 'O(n²)', why: '' },
          { text: 'O(1), the pairs are computed lazily', why: 'Returning all of them still means producing every pair.' },
        ],
        answer: 1,
      },
      solved: 'Writing n(n−1)/2 pairs takes O(n²) on its own.',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Say it precisely',
      lines: ['Name your variables.', 'Give space too, including the recursion stack.'],
      panels: [code('function wordStats(words) { … }  // n words, average length m')],
      task: {
        type: 'choose',
        question: 'Which answer gives the interviewer what they want?',
        options: [
          { text: '"It\'s O(n²)."', why: 'It does not say what n is, and it leaves out space.' },
          { text: '"O(n · m) time, where n is the number of words and m their average length, and O(1) extra space."', why: '' },
          { text: '"It\'s fast enough."', why: 'State the complexity for every solution: it shows why you are optimising.' },
        ],
        answer: 1,
      },
      solved: 'Named variables plus time and space: a complete answer.',
    },
    {
      kind: 'turn',
      title: 'Mention the hidden costs you avoided',
      lines: ['Point out the built-in costs you avoided.', 'It shows you know where O(n) hides in one line of JavaScript.'],
      panels: [arr([10, 20, 30, 40], { label: 'queue', pointers: [{ index: 1, label: 'head', color: 'a' }], highlights: { 0: 'done' } })],
      task: {
        type: 'choose',
        question: 'Your BFS uses an array as a queue. What is worth saying?',
        options: [
          { text: '"I use `shift()` to pop, which is O(1)."', why: '`shift()` is O(n): every other element moves one slot.' },
          { text: '"I use a head index instead of `shift()`, so each pop is O(1)."', why: '' },
          { text: 'Nothing: queues are an implementation detail.', why: 'Hidden costs are exactly what interviewers like to hear you avoided.' },
        ],
        answer: 1,
      },
      solved: 'A head index keeps each pop O(1); saying so shows you know the hidden cost.',
    },
  ],
};
