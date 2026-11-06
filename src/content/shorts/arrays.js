// Shorts for Arrays & Strings (M9). Format: src/content/shortSchema.js. Facts come only from topics/arrays/topic.js.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const gst = (m, n, f) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => f(r, c)));
const at = (cells) => (r, c) => cells.some(([a, b]) => a === r && b === c);

// ---------- running state: stock prices (the lesson's dry run) ----------
const PRICES = [7, 1, 5, 3, 6, 4];
const stockFrames = [];
{
  let min = Infinity,
    minAt = -1,
    best = 0;
  PRICES.forEach((p, i) => {
    const before = min,
      beforeAt = minAt;
    const profit = i === 0 ? '—' : p - before;
    if (i > 0) best = Math.max(best, profit);
    if (p < min) [min, minAt] = [p, i];
    stockFrames.push({
      say: i === 0 ? 0 : 1,
      note:
        i === 0
          ? 'Day 0: nothing to buy before it. minSoFar becomes 7.'
          : `Day ${i}: sell at ${p}, cheapest before is ${before} → profit ${profit}. best = ${best}.${p < before ? ` New min ${p}.` : ''}`,
      panels: [
        arr(PRICES, { label: 'prices', pointers: [ptr(i, 'sell')], highlights: hl(6, (k) => (k === i ? 'active' : k === beforeAt ? 'done' : k < i ? 'visited' : '')) }),
        vars({ minSoFar: before === Infinity ? '—' : before, profit, best }),
      ],
    });
  });
}

// ---------- in-place reversal: rotate [1..7] by 3 ----------
const SEVEN = [1, 2, 3, 4, 5, 6, 7];
const GOAL = [5, 6, 7, 1, 2, 3, 4];

// ---------- matrix: rotate 3 × 3 clockwise ----------
const M3 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const T1 = [
  [1, 4, 3],
  [2, 5, 6],
  [7, 8, 9],
];
const T2 = [
  [1, 4, 7],
  [2, 5, 6],
  [3, 8, 9],
];
const TR = [
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
];
const ROT = [
  [7, 4, 1],
  [8, 5, 2],
  [9, 6, 3],
];
const swapFrame = (g, i, j, note) => ({
  say: 0,
  note,
  panels: [grid(g, gst(3, 3, (r, c) => ((r === i && c === j) || (r === j && c === i) ? 'active' : r === c ? 'muted' : '')), 'transposing'), vars({ i, j })],
});

// ---------- prefix / suffix: product except self ----------
const PN = [1, 2, 3, 4];
const fwdFrames = [];
const bwdFrames = [];
{
  const out = ['·', '·', '·', '·'];
  let left = 1;
  PN.forEach((x, i) => {
    out[i] = left;
    const was = left;
    left *= x;
    fwdFrames.push({
      say: 0,
      note: `i = ${i}: out[${i}] = left = ${was}, then left *= ${x} → ${left}.`,
      panels: [arr(PN, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(4, (k) => (k < i ? 'window' : k === i ? 'active' : '')) }), arr(out.slice(), { label: 'out (left products)', highlights: { [i]: 'active' } }), vars({ left })],
    });
  });
  let right = 1;
  for (let i = 3; i >= 0; i--) {
    const was = out[i];
    out[i] *= right;
    const r = right;
    right *= PN[i];
    bwdFrames.push({
      say: 0,
      note: `i = ${i}: out[${i}] = ${was} × right ${r} = ${out[i]}, then right *= ${PN[i]} → ${right}.`,
      panels: [arr(PN, { label: 'nums', pointers: [ptr(i, 'i', 'b')], highlights: hl(4, (k) => (k > i ? 'window' : k === i ? 'active' : '')) }), arr(out.slice(), { label: 'out', highlights: hl(4, (k) => (k === i ? 'active' : k > i ? 'done' : '')) }), vars({ right })],
    });
  }
}

// ---------- strings: merge alternately ----------
const W1 = ['a', 'b', 'c'];
const W2 = ['p', 'q'];
const mergeFrames = [];
{
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const got = [W1[i], W2[i]].filter(Boolean);
    parts.push(...got);
    mergeFrames.push({
      say: 1,
      note: got.length === 2 ? `i = ${i}: push '${got[0]}' from word1, then '${got[1]}' from word2.` : `i = ${i}: word2 has no letter ${i}; push only '${got[0]}'.`,
      panels: [
        arr(W1, { label: 'word1', pointers: [ptr(i, 'i')], highlights: { [i]: 'active' } }),
        arr(W2, { label: 'word2', ...(i < 2 ? { pointers: [ptr(i, 'i', 'b')], highlights: { [i]: 'active' } } : { highlights: { 0: 'visited', 1: 'visited' } }) }),
        arr(parts.slice(), { label: 'parts', highlights: hl(parts.length, (k) => (k >= parts.length - got.length ? 'active' : '')) }),
      ],
    });
  }
}

export default [
  {
    id: 'array-traversal-running-state',
    title: 'Best profit in one pass: carry the minimum',
    steps: [
      {
        kind: 'watch',
        title: 'Every pair is a lot of pairs',
        lines: ['Buy on one day, sell on a **later** day: what is the best profit?', 'Checking every buy/sell pair is **O(n²)**.'],
        frames: [
          { say: 0, note: 'prices = [7, 1, 5, 3, 6, 4]. The buy day must come before the sell day.', panels: [arr(PRICES, { label: 'prices' })] },
          { say: 1, note: 'Sell on day 4 (price 6): brute force tries every earlier day as the buy day.', panels: [arr(PRICES, { label: 'prices', pointers: [ptr(4, 'sell')], highlights: { 0: 'window', 1: 'window', 2: 'window', 3: 'window', 4: 'active' } }), vars({ tries: 4 })] },
          { say: 1, note: 'Repeat that for every sell day: 15 pairs for 6 prices, about n² / 2 in general.', panels: [arr(PRICES, { label: 'prices', highlights: hl(6, () => 'window') }), vars({ pairs: 15 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Carry the cheapest day so far',
        lines: ['Standing at day i, ask: what do I need to know about everything to my **left**?', 'If I sell today, the best buy is the **cheapest day before today**: keep `minSoFar` and `best`.'],
        frames: stockFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"maximum profit"**, **"buy before you sell"** (i < j), **"consecutive"**, **"longest run"**.'],
        frames: [
          {
            say: 0,
            note: 'Each clue needs only a small summary of the left side. One pass: O(n) time, O(1) space.',
            panels: [table(['"maximum profit"', '"buy before you sell"', '"longest run"'], ['summary to carry'], [['minSoFar + best'], ['minSoFar (only earlier days)'], ['current streak + best']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the run breaks',
        lines: ['Streak counter: `streak = x === 1 ? streak + 1 : 0`, then `best = max(best, streak)`.'],
        panels: [arr([1, 1, 0, 1, 1, 1], { label: 'nums', pointers: [ptr(2, 'x')], highlights: { 0: 'visited', 1: 'visited', 2: 'active' } }), vars({ streak: 2, best: 2 })],
        task: {
          type: 'choose',
          question: 'The scan reaches the 0 at index 2. What happens to `streak` and `best`?',
          options: [
            { text: '`streak` becomes 0, `best` stays 2' },
            { text: 'Both become 0', why: '`best` is the answer so far; the run of two 1s already happened and must not be forgotten.' },
            { text: '`streak` stays 2', why: 'The run is broken; the next 1 must start a new run at 1, not continue to 3.' },
            { text: '`streak` becomes 1', why: 'Only a 1 adds to the streak; a 0 resets it to 0.' },
          ],
          answer: 0,
        },
        solved: '`streak` summarises the run still open; `best` keeps what you already found (here it ends at 3).',
      },
    ],
  },

  {
    id: 'array-in-place-reversal',
    title: 'Rotate an array without a copy',
    steps: [
      {
        kind: 'watch',
        title: 'A copy costs n extra slots',
        lines: ['Rotate right by k: `[1,2,3,4,5,6,7]`, k = 3 → `[5,6,7,1,2,3,4]`.', 'One step at a time is **O(n·k)**; a copy is O(n) time but **O(n) extra space**.'],
        frames: [
          { say: 0, note: 'Every element moves k = 3 slots right, wrapping around the end.', panels: [arr(SEVEN, { label: 'nums' }), arr(GOAL, { label: 'goal', highlights: { 0: 'window', 1: 'window', 2: 'window' } })] },
          { say: 1, note: 'One step = pop + unshift: everything shifts right. Do it k times: O(n·k).', panels: [arr([7, 1, 2, 3, 4, 5, 6], { label: 'after 1 step', highlights: hl(7, (k) => (k === 0 ? 'active' : 'window')) }), vars({ steps: '1 of 3' })] },
          { say: 1, note: 'Or copy and write nums[(i + k) % n] = copy[i]: fast, but a whole second array.', panels: [arr(SEVEN, { label: 'copy (n extra slots)', highlights: hl(7, () => 'muted') }), arr(GOAL, { label: 'nums', highlights: hl(7, () => 'done') })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Three reversals, all in place',
        lines: ['Reverse in place: swap the two ends, then move both inward.', 'Rotation is `A B → B A`: reverse all, reverse the first k, reverse the rest.'],
        frames: [
          { say: 0, note: 'lo = 0, hi = 6: 1 and 7 trade places, then lo++ and hi--.', panels: [arr([7, 2, 3, 4, 5, 6, 1], { label: 'nums', pointers: [ptr(1, 'lo'), ptr(5, 'hi', 'b')], highlights: { 0: 'done', 6: 'done' } })] },
          { say: 1, note: 'Swap until lo meets hi: reversed. B = 7 6 5 is in front, but backwards.', panels: [arr([7, 6, 5, 4, 3, 2, 1], { label: 'reverse all (0..6)', highlights: { 0: 'window', 1: 'window', 2: 'window' } })] },
          { say: 1, note: 'Reverse the first k = 3 (0..2): 7 6 5 → 5 6 7.', panels: [arr([5, 6, 7, 4, 3, 2, 1], { label: 'reverse first k (0..2)', highlights: { 0: 'done', 1: 'done', 2: 'done' } })] },
          { say: 1, note: 'Reverse the rest (3..6): 4 3 2 1 → 1 2 3 4. Rotated, about n swaps, no extra array.', panels: [arr(GOAL, { label: 'reverse the rest (3..6)', highlights: hl(7, () => 'done') }), vars({ extra: 'O(1)', time: 'O(n)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"in-place"**, **"do not return anything, modify nums"**, **"O(1) extra memory"**, **"rotate"**.'],
        frames: [{ say: 0, note: 'These ask you to edit the array inside its own memory: swaps, reversals, careful writes.', panels: [arr(GOAL, { label: 'nums, edited in place', highlights: hl(7, () => 'done') })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: k bigger than n',
        lines: ['nums has length 7, and now k = 10.', 'Rotating by 7 brings the array back to where it started.'],
        panels: [arr(SEVEN, { label: 'nums, n = 7' }), vars({ k: 10 })],
        task: {
          type: 'choose',
          question: 'Before the three reversals, what must happen to k?',
          options: [
            { text: 'Nothing: reversing handles any k', why: 'Reversing the first k = 10 would touch indexes 7, 8, 9, which do not exist.' },
            { text: '`k %= n`, so k = 3' },
            { text: 'k = n − k = −3', why: 'A negative k makes no sense as a reversal index; only k mod n matters.' },
            { text: 'Throw an error', why: 'Any k ≥ 0 is allowed; normalising it is the expected fix.' },
          ],
          answer: 1,
        },
        solved: 'Rotating by n is a full circle, so only `k % n` matters. Forgetting it is the classic bug.',
      },
    ],
  },

  {
    id: 'matrix-traversal-layers',
    title: 'Rotate an image: transpose, then reverse each row',
    steps: [
      {
        kind: 'watch',
        title: 'A quarter turn, cell by cell, is messy',
        lines: ['Rotate an n × n matrix 90° **clockwise**, in place.', 'Clockwise sends cell (r, c) to (c, n − 1 − r).'],
        frames: [
          { say: 0, note: 'e.g. a 3 × 3 image. The top row 1 2 3 must become the right column.', panels: [grid(M3, gst(3, 3, (r) => (r === 0 ? 'active' : '')), 'matrix'), grid(ROT, gst(3, 3, (_, c) => (c === 2 ? 'active' : '')), 'goal')] },
          { say: 1, note: '(0, 0) holding 1 goes to (0, 2); (0, 2) holding 3 goes to (2, 2). Tracking every cell is error-prone.', panels: [grid(M3, gst(3, 3, (r, c) => (at([[0, 0], [0, 2]])(r, c) ? 'active' : '')), 'matrix'), grid(ROT, gst(3, 3, (r, c) => (at([[0, 2], [2, 2]])(r, c) ? 'done' : '')), 'goal')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Two simple moves',
        lines: ['**Transpose:** swap `a[i][j]` with `a[j][i]` for j > i; rows become columns.', '**Reverse each row:** column r moves to column n − 1 − r.'],
        frames: [
          swapFrame(T1, 0, 1, 'Swap (0, 1) with (1, 0): 2 and 4 trade places. The diagonal 1 5 9 never moves.'),
          swapFrame(T2, 0, 2, 'Swap (0, 2) with (2, 0): 3 and 7 trade places.'),
          swapFrame(TR, 1, 2, 'Swap (1, 2) with (2, 1): 6 and 8 trade places. Transposed: the top row is now the left column.'),
          { say: 1, note: 'Reverse each row: 1 4 7 → 7 4 1, and so on. Clockwise, no extra matrix.', panels: [grid(ROT, gst(3, 3, () => 'done'), 'rotated'), vars({ extra: 'O(1)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"matrix"**, **"m x n grid"**, **"spiral order"**, **"rotate the image by 90 degrees"**, **"in place"**.', 'Not for islands or shortest paths in a grid: those are graph BFS/DFS problems.'],
        frames: [{ say: 0, note: 'A grid is an array of rows: index formulas and boundaries turn the geometry into plain loops.', panels: [grid(ROT, gst(3, 3, () => ''), 'matrix[r][c]')] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: after the transpose',
        lines: ['You transposed the matrix. One more move finishes the rotation.'],
        panels: [grid(TR, gst(3, 3, (r, c) => (r === c ? 'muted' : '')), 'after transpose')],
        task: {
          type: 'choose',
          question: 'Which move turns this into the **clockwise** rotation?',
          options: [
            { text: 'Reverse the order of the rows', why: 'Transpose, then reverse the order of the rows, is the counter-clockwise rotation.' },
            { text: 'Transpose again', why: 'A second transpose swaps every pair back: you get the original matrix.' },
            { text: 'Reverse each row' },
            { text: 'Nothing: the transpose is the rotation', why: 'A transpose is a reflection over the diagonal: the top row is the left column, in the wrong order.' },
          ],
          answer: 2,
        },
        solved: 'Clockwise = transpose, then reverse each row: (r, c) → (c, r) → (c, n − 1 − r).',
      },
    ],
  },

  {
    id: 'array-prefix-suffix-products',
    title: 'Everything except me, without division',
    steps: [
      {
        kind: 'watch',
        title: 'Two slow or broken ideas',
        lines: ['`[1, 2, 3, 4]` → `[24, 12, 8, 6]`: each slot is the product of all the **other** elements.', 'Multiplying the others again for every index is **O(n²)**.', 'Dividing the total by nums[i] breaks on zeros.'],
        frames: [
          { say: 0, note: 'answer[2] = 1 × 2 × 4 = 8: every element except nums[2].', panels: [arr(PN, { label: 'nums', highlights: { 0: 'window', 1: 'window', 2: 'bad', 3: 'window' } }), vars({ 'answer[2]': 8 })] },
          { say: 1, note: 'Redo that for each of the n indexes, and the same products are recomputed again and again.', panels: [arr(PN, { label: 'nums', highlights: hl(4, () => 'window') }), vars({ time: 'O(n²)' })] },
          { say: 2, note: 'e.g. nums = [1, 0, 3]: the total is 0, so total / nums[i] cannot recover the answers.', panels: [arr([1, 0, 3], { label: 'nums', highlights: { 1: 'bad' } }), vars({ total: 0 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Forward pass: products on the left',
        lines: ['`out[i] = left; left *= nums[i];` — `left` is the product of everything **before** i.'],
        frames: fwdFrames,
      },
      {
        kind: 'watch',
        title: 'Backward pass: products on the right',
        lines: ['`out[i] *= right; right *= nums[i];` — `right` is the product of everything **after** i.', 'Clues: **"except self"**, **"without using division"**, **"left and right of i"**.'],
        frames: [...bwdFrames, { say: 1, note: 'Both sides combined in two passes: O(n) time, O(1) extra space besides out.', panels: [arr([24, 12, 8, 6], { label: 'out', highlights: hl(4, () => 'done') }), vars({ time: 'O(n)', extra: 'O(1)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: swap the two lines?',
        lines: ['Forward pass: `out[i] = left; left *= nums[i];`'],
        panels: [arr(PN, { label: 'nums' }), vars({ left: 1 })],
        task: {
          type: 'choose',
          question: 'What changes if you write `left *= nums[i]` **before** `out[i] = left`?',
          options: [
            { text: 'Nothing: the order is arbitrary', why: 'out[i] would then include nums[i] itself: the inclusive prefix product.' },
            { text: 'out[i] includes nums[i], so it is no longer "except self"' },
            { text: 'The numbers overflow', why: 'The order does not change how big the numbers get.' },
            { text: 'It gets slower', why: 'Both orders do the same multiplications; this is about correctness.' },
          ],
          answer: 1,
        },
        solved: 'When you write out[i], `left` must hold only the elements **before** i; fold nums[i] in afterwards.',
      },
    ],
  },

  {
    id: 'string-builder',
    title: 'Build strings with parts and one join',
    steps: [
      {
        kind: 'watch',
        title: 'Strings do not change',
        lines: ['Strings are **immutable**: every "edit" creates a new string.', 'In a loop, `out += piece` can copy the whole string each time: **O(n²)** in the worst case.'],
        frames: [
          { say: 0, note: 'e.g. s = "cat": s[0] = "b" is silently ignored. s is still "cat".', panels: [arr(['c', 'a', 't'], { label: 's', highlights: { 0: 'bad' } }), vars({ s: '"cat"' })] },
          { say: 1, note: 'Each += may build a brand-new string, copying every character so far.', panels: [arr(['a', 'p', 'b', 'q'], { label: 'out, rebuilt each time', highlights: hl(4, () => 'window') }), vars({ copied: '1 + 2 + 3 + 4' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Collect, then join once',
        lines: ['Merge alternately: one letter from each word in turn, e.g. "abc" and "pq".', '`parts.push(piece)` is O(1) amortized; `parts.join("")` runs once at the end.'],
        frames: [
          ...mergeFrames,
          { say: 1, note: 'One join, one O(total length) pass: "apbqc".', panels: [arr(['a', 'p', 'b', 'q', 'c'], { label: 'parts', highlights: hl(5, () => 'done') }), vars({ result: '"apbqc"' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"return the resulting string"**, **"format"**, **"compress"**, **"alternately"**, **"in words"**.'],
        frames: [{ say: 0, note: 'Output built piece by piece: push the pieces, join once, read characters with s[i].', panels: [vars({ build: 'parts.push(piece)', finish: 'parts.join("")' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: compress "aaabcc"',
        lines: ['Run-length compress: `"aaabcc"` → `"a3bc2"`.', '`i` marks where a run starts; `j` scans while `s[j] === s[i]`.'],
        panels: [arr(['a', 'a', 'a', 'b', 'c', 'c'], { label: 's', pointers: [ptr(0, 'i'), ptr(3, 'j', 'b')], highlights: { 0: 'window', 1: 'window', 2: 'window' } }), vars({ parts: '[]' })],
        task: {
          type: 'choose',
          question: '`j` stopped at 3. What happens next?',
          options: [
            { text: 'Push "a3" into parts, then jump i = j' },
            { text: '`out += "a3"`, then i++', why: 'i++ starts a fake run inside the a’s, and += may recopy the string each time.' },
            { text: 'Set `s[0] = "a3"`', why: 'Strings are immutable: the assignment is silently ignored.' },
            { text: 'Push "a3", then i = j + 1', why: 'That skips "b", the first letter of the next run.' },
          ],
          answer: 0,
        },
        solved: 'Emit each run once and jump i to j: j never goes back, so it is O(n), then one join.',
      },
    ],
  },
];
