// ---- large-test generators (deterministic; used by the timed tests below) ----
// V-shaped array: nums[i] = |i − 37831| · 1000 − 3·10^7, so every range minimum has a closed form.
const bigRmqArgs = () => {
  const n = 100000, c = 37831;
  const nums = Array.from({ length: n }, (_, i) => Math.abs(i - c) * 1000 - 30000000);
  let s = 2024;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  const queries = [];
  for (let k = 0; k < 100000; k++) {
    const l = rnd() % n;
    queries.push([l, l + (rnd() % (n - l))]);
  }
  return [nums, queries];
};
const bigRmqExpected = () => {
  const c = 37831;
  return bigRmqArgs()[1].map(([l, r]) => (l <= c && c <= r ? 0 : Math.min(Math.abs(l - c), Math.abs(r - c))) * 1000 - 30000000);
};
// ---- end generators ----

export default {
  id: 'classic-range-minimum-query',
  title: 'Static Range Minimum Query',
  difficulty: 'Medium',
  order: 3,
  pattern: 'sparse-table-rmq',
  tags: ['array', 'sparse table', 'range query'],
  source: { platform: 'Classic', note: 'Standard RMQ problem (sparse table / segment tree textbook exercise)' },

  statement: `You are given an integer array \`nums\` that **never changes**, and a list of queries. Each query is a pair \`[l, r]\` with \`0 <= l <= r < nums.length\`.

Return an array whose i-th element is the **minimum** of \`nums[l..r]\` (inclusive) for the i-th query.

Aim for a solution where each query takes **O(1)** after preprocessing.`,
  examples: [
    { input: 'nums = [4,6,1,5,7,3,2], queries = [[0,6],[1,5],[3,4],[5,6],[2,2]]', output: '[1,1,5,2,1]' },
    { input: 'nums = [5], queries = [[0,0]]', output: '[5]' },
    { input: 'nums = [-1,-5,3], queries = [[0,1],[1,2],[0,0],[2,2]]', output: '[-5,-5,-1,3]' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '0 <= queries.length <= 10^5', '0 <= l <= r < nums.length'],

  think: `- Looping over each range is O(n) per query. How many queries could there be?
- Could you precompute the minimum of some ranges and combine a few of them?
- If two precomputed ranges overlap, does counting an element twice change a **minimum**?`,
  patternChallenge: {
    options: ['Prefix Sum', 'Sparse Table (static RMQ)', 'Sliding Window — Fixed Size', 'Monotonic Deque'],
    answer: 1,
    explanation: 'The array is static and there are many arbitrary range-min queries. Min is idempotent, so two overlapping power-of-two blocks answer any query in O(1) — a sparse table. Prefix sums do not work for min (not invertible); sliding-window/deque tricks need windows that move monotonically.',
  },
  hints: [
    'Let `st[k][i]` be the minimum of the 2^k elements starting at i. Build level k from level k − 1 with two halves.',
    'For a query of length len, take k = floor(log2(len)). The blocks starting at l and ending at r (both length 2^k) cover [l, r].',
  ],
  approach: `**Brute force:** for each query, loop from l to r — O(n) per query, O(n·q) total (10^10 in the worst case).

**Optimized — sparse table:**
1. \`log[i]\` = floor(log2 i) via \`log[i] = log[i >> 1] + 1\`.
2. \`st[0] = nums\`; \`st[k][i] = min(st[k−1][i], st[k−1][i + 2^(k−1)])\` for every valid i.
3. Query [l, r]: \`k = log[r − l + 1]\`, answer \`min(st[k][l], st[k][r − 2^k + 1])\`. The two blocks overlap when len is not a power of two, but min is idempotent, so the overlap is harmless.

The toolkit \`SparseTable\` implements exactly this; the reference solution writes it out so you can see every index.`,

  functionName: 'rangeMinQuery',
  paramNames: ['nums', 'queries'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number[][]} queries
 * @return {number[]}
 */
function rangeMinQuery(nums, queries) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: several overlapping ranges over one sparse table.', args: [[4,6,1,5,7,3,2],[[0,6],[1,5],[3,4],[5,6],[2,2]]], expected: [1,1,5,2,1] },
    { scenario: 'Example 2', hint: 'A single element: only level 0 of the table exists, and log[1] must be 0.', args: [[5],[[0,0]]], expected: [5] },
    { scenario: 'Example 3', hint: 'Negative values — make sure your table starts from the values, not from 0.', args: [[-1,-5,3],[[0,1],[1,2],[0,0],[2,2]]], expected: [-5,-5,-1,3] },
    { scenario: 'No queries', hint: 'queries may be empty: return an empty array (and do not crash while building the table).', args: [[1,3,2],[]], expected: [] },
    { scenario: 'Single-element ranges', hint: 'l = r means length 1 → k = 0, both blocks are the element itself.', args: [[3,-1,4,1,-5],[[0,0],[1,1],[2,2],[3,3],[4,4]]], expected: [3,-1,4,1,-5] },
    { scenario: 'Minimum at the right end', hint: 'The second block must start at r − 2^k + 1. Starting it at r − 2^k misses nums[r], which is the minimum here.', args: [[8,7,6,5,4,3,2,1,0],[[0,2],[1,6],[3,8],[0,8],[2,4],[4,7]]], expected: [6,2,0,0,4,1] },
    { scenario: 'Minimum at the left end', hint: 'Ascending array: the answer is always nums[l], covered only by the first block.', args: [[1,2,3,4,5,6,7,8,9,10],[[0,9],[3,9],[5,7],[8,9],[2,6]]], expected: [1,4,6,9,3] },
    { scenario: 'All equal values', hint: 'Ties everywhere — any block gives the same minimum.', args: [[2,2,2,2],[[0,3],[1,2]]], expected: [2,2] },
    { scenario: 'Length just past a power of two', hint: 'n = 17: the top level has only n − 2^k + 1 = 2 valid starts. Reading past them returns undefined/NaN.', args: [[9,4,7,3,8,6,5,2,10,11,12,13,14,15,16,1,20],[[0,16],[1,16],[0,15],[1,15],[0,14],[2,16]]], expected: [1,1,1,1,2,1] },
    { scenario: 'Extreme values ±10^9', hint: 'Do not seed the minimum with a small sentinel like 1e9 — values reach ±10^9.', args: [[1000000000,-1000000000,1000000000,-999999999],[[0,0],[0,3],[2,3],[2,2]]], expected: [1000000000,-1000000000,-999999999,1000000000] },
    { scenario: 'Random medium (n = 100)', hint: 'Mixed-length ranges over pseudo-random values — exercises every level of the table.', argsGen: '() => { let s = 7; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const nums = Array.from({ length: 100 }, () => (rnd() % 2001) - 1000); const qs = []; for (let k = 0; k < 40; k++) { const l = rnd() % 100; qs.push([l, l + (rnd() % (100 - l))]); } return [nums, qs]; }', expected: [-907,-943,-943,-943,-129,-907,-943,-714,-943,-943,-361,-943,-943,-943,-989,-839,-989,-943,-662,-714,-943,-943,-376,-943,-907,-376,-714,-413,-129,-714,-941,-907,-295,-943,-941,-907,-907,-569,-943,-907] },
    { scenario: 'Large: n = q = 10^5', hint: 'Scanning each range is O(n) per query — up to 10^10 steps here. Precompute a sparse table so each query is O(1).', argsGen: String(bigRmqArgs), expected: bigRmqExpected(), timeLimitMs: 1000 },
  ],
  solution: {
    code: `function rangeMinQuery(nums, queries) {
  const n = nums.length;
  const log = new Array(n + 1).fill(0);
  for (let i = 2; i <= n; i++) log[i] = log[i >> 1] + 1;   // floor(log2 i)

  const st = [nums.slice()];                                 // st[k][i] = min of nums[i .. i + 2^k - 1]
  for (let k = 1; (1 << k) <= n; k++) {
    const prev = st[k - 1];
    const half = 1 << (k - 1);
    const row = new Array(n - (1 << k) + 1);
    for (let i = 0; i < row.length; i++) row[i] = Math.min(prev[i], prev[i + half]);
    st.push(row);
  }

  return queries.map(([l, r]) => {
    const k = log[r - l + 1];
    return Math.min(st[k][l], st[k][r - (1 << k) + 1]);      // two overlapping blocks
  });
}`,
  },
  dryRun: {
    columns: ['query', 'len', 'k', 'block 1', 'block 2', 'answer'],
    rows: [
      ['[0, 6]', '7', '2', 'st[2][0] = min(4,6,1,5) = 1', 'st[2][3] = min(5,7,3,2) = 2', '1'],
      ['[1, 5]', '5', '2', 'st[2][1] = min(6,1,5,7) = 1', 'st[2][2] = min(1,5,7,3) = 1', '1'],
      ['[3, 4]', '2', '1', 'st[1][3] = 5', 'st[1][3] = 5', '5'],
      ['[5, 6]', '2', '1', 'st[1][5] = 2', 'st[1][5] = 2', '2'],
      ['[2, 2]', '1', '0', 'st[0][2] = 1', 'st[0][2] = 1', '1'],
    ],
  },
  complexity: { time: 'O(n log n + q)', space: 'O(n log n)', explanation: 'There are ⌊log₂ n⌋ + 1 levels with ≤ n cells each, each filled in O(1). Each query reads two cells.' },
  alternative: {
    title: 'Segment tree (min)',
    md: 'A min segment tree answers each query in O(log n) with O(n) memory, and additionally supports updates. Use it when the array can change. With the toolkit: `const st = new SegmentTree(nums, Math.min, Infinity)` and `st.query(l, r)`.',
    code: `function rangeMinQuery(nums, queries) {
  const st = new SegmentTree(nums, Math.min, Infinity);
  return queries.map(([l, r]) => st.query(l, r));
}`,
    complexity: 'O(n + q log n) time, O(n) space',
  },
  mistakes: [
    'Using `Math.floor(Math.log2(len))` in the hot loop — slower, and it is safer to precompute integer logs.',
    'Second block starts at `r − 2^k + 1`, not `r − 2^k`.',
    'Trying the same trick for range sums — overlapping blocks double-count.',
    'Allocating every level with n cells and reading past the valid range (level k has n − 2^k + 1 valid starts).',
  ],
};
