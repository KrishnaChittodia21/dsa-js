export default {
  id: 'create-sorted-array-through-instructions',
  title: 'Create Sorted Array through Instructions',
  difficulty: 'Hard',
  order: 2,
  pattern: 'bit-coordinate-compression-counting',
  tags: ['array', 'fenwick tree', 'counting'],
  source: { platform: 'LeetCode', number: 1649, url: 'https://leetcode.com/problems/create-sorted-array-through-instructions/' },

  statement: `You insert the numbers of \`instructions\` one by one (left to right) into an initially empty container that is kept sorted. Inserting value \`x\` costs

\`min(number of elements already in the container that are < x, number of elements already in the container that are > x)\`.

Return the total cost modulo \`10^9 + 7\`.`,
  examples: [
    { input: 'instructions = [1,5,6,2]', output: '1', explanation: 'Costs: 1 → 0, 5 → min(1,0)=0, 6 → min(2,0)=0, 2 → min(1,2)=1.' },
    { input: 'instructions = [1,2,3,6,5,4]', output: '3', explanation: 'Only 5 (min(4,1)=1) and 4 (min(3,2)=2) cost anything.' },
    { input: 'instructions = [1,3,3,3,2,4,2,1,2]', output: '4' },
  ],
  constraints: ['1 <= instructions.length <= 10^5', '1 <= instructions[i] <= 10^5'],

  think: `- If you really kept a sorted array, inserting is O(n) because of shifting. Do you actually need the array, or just two counts?
- "Elements < x so far" and "elements > x so far" — both are counts over the **values** seen so far. Which structure answers that?
- Values are already in 1..10^5. Do you need to compress?`,
  patternChallenge: {
    options: ['Binary Search + Array.splice', 'Fenwick Tree indexed by value', 'Min-Heap and Max-Heap', 'Sliding Window'],
    answer: 1,
    explanation: 'The cost depends only on counts of smaller/larger values inserted so far. A BIT indexed by value gives `less = prefix(x − 1)` and `greater = inserted − prefix(x)` in O(log M). Binary search finds the position fast, but `splice` still shifts O(n) elements; two heaps cannot count elements below an arbitrary x.',
  },
  hints: [
    'Keep a Fenwick tree over values 1..max. After i insertions: less = prefix(x − 1), greater = i − prefix(x).',
    'Add `min(less, greater)` to the answer, then `add(x, 1)`. Take the modulo at the end or as you go (the total stays below 2^53 anyway, but modding is the stated output).',
  ],
  approach: `**Brute force:** maintain a real sorted array. Binary-search the position (O(log n)), but inserting with \`splice\` shifts up to n elements — O(n²) overall (10^10 at n = 10^5).

**Optimized — BIT over values:** values are in 1..10^5, so they can be indices directly (no compression).
1. \`bit = new FenwickTree(maxValue + 1)\`.
2. For the i-th instruction x (i elements already inserted): \`less = prefixSum(x − 1)\`, \`greater = i − prefixSum(x)\` — equal values are in neither group.
3. \`cost += min(less, greater)\`; \`bit.add(x, 1)\`.

Each step O(log M) with M = max value → O(n log M).`,

  functionName: 'createSortedArray',
  paramNames: ['instructions'],
  starterCode: `/**
 * @param {number[]} instructions
 * @return {number}
 */
function createSortedArray(instructions) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Only inserting 2 costs anything: min(1 smaller, 2 larger) = 1.', args: [[1,5,6,2]], expected: 1 },
    { scenario: 'Example 2', hint: 'Costs 1 (for 5) and 2 (for 4).', args: [[1,2,3,6,5,4]], expected: 3 },
    { scenario: 'Example 3', hint: 'Duplicates: equal values are neither smaller nor larger.', args: [[1,3,3,3,2,4,2,1,2]], expected: 4 },
    { scenario: 'Single instruction', hint: 'The container is empty: the first insert always costs 0.', args: [[7]], expected: 0 },
    { scenario: 'All equal values', hint: 'Computing greater as i − less counts equal values as greater; here every insert must cost 0.', args: [[5,5,5,5]], expected: 0 },
    { scenario: 'Equal values in the middle', hint: 'greater = i − (count of values ≤ x), not i − (count < x) — equal values must be excluded.', args: [[1,9,5,5,5,5]], expected: 4 },
    { scenario: 'Strictly decreasing', hint: 'Each new value is the smallest so far: cost 0 every time.', args: [[3,2,1]], expected: 0 },
    { scenario: 'Strictly increasing', hint: 'Each new value is the largest so far: cost 0 every time.', args: [[1,2,3,4,5,6]], expected: 0 },
    { scenario: 'Max value 10^5', hint: 'Values go up to 10^5 — the BIT must have a cell for 100000 itself.', args: [[100000,1,100000,50000,99999,2]], expected: 4 },
    { scenario: 'Alternating extremes', hint: 'Middle values pay the most: they have many smaller and many larger neighbours.', args: [[1,10,2,9,3,8,4,7,5,6]], expected: 20 },
    { scenario: 'Random (n = 100)', hint: 'Pseudo-random values with repeats — check the equal-value handling first if this fails.', argsGen: '() => { let s = 21; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100 }, () => 1 + (rnd() % 50))]; }', expected: 1116 },
    { scenario: 'Total exceeds 10^9 + 7', hint: '50 000 inserts of 50 000 each cost 25 000: the total 1.25·10^9 must be returned modulo 10^9 + 7.', argsGen: '() => { const a = []; for (let i = 0; i < 25000; i++) a.push(1, 100000); for (let i = 0; i < 50000; i++) a.push(50000); return [a]; }', expected: 249999993, timeLimitMs: 200 },
    { scenario: 'Large random (n = 10^5)', hint: 'Counting smaller/larger with a loop, or keeping a sorted array with splice, is O(n²). Use a BIT over values: O(n log V).', argsGen: '() => { let s = 31; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100000 }, () => 1 + (rnd() % 100000))]; }', expected: 252250000, timeLimitMs: 200 },
  ],
  solution: {
    code: `function createSortedArray(instructions) {
  const MOD = 1_000_000_007;
  const maxV = Math.max(...instructions);
  const bit = new FenwickTree(maxV + 1);      // index = value (0 unused by the data)
  let cost = 0;

  instructions.forEach((x, i) => {            // i = how many values are already inserted
    const less = bit.prefixSum(x - 1);        // values < x
    const greater = i - bit.prefixSum(x);     // values > x (equal ones excluded)
    cost = (cost + Math.min(less, greater)) % MOD;
    bit.add(x, 1);
  });
  return cost;
}`,
    explanation: '`Math.max(...arr)` spreads the array into arguments; for 10^5 elements that is fine in modern engines, but for millions prefer a loop (argument-count limits).',
  },
  dryRun: {
    columns: ['i', 'x', 'less = prefix(x−1)', 'greater = i − prefix(x)', 'cost'],
    rows: [
      ['0', '1', '0', '0', '0'],
      ['1', '5', '1', '0', '0'],
      ['2', '6', '2', '0', '0'],
      ['3', '2', '1', '3 − 1 = 2', '1'],
    ],
  },
  complexity: { time: 'O(n log M)', space: 'O(M)', explanation: 'M = largest value (≤ 10^5). Two prefix queries and one update per instruction.' },
  alternative: {
    title: 'Merge-sort style counting / compressed BIT',
    md: 'If values were up to 10^9, compress them first (sort unique values → ranks) and run the same BIT over ranks. A merge-sort approach is awkward here because each element needs *both* smaller and greater counts among earlier elements, with ties excluded — the BIT is the natural tool.',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Computing greater as `i − less` — that wrongly counts equal values as greater.',
    'Keeping an actual sorted array with `splice` — each insert is O(n).',
    'Forgetting the modulo in the returned value.',
    'Indexing the BIT from 0 with values that start at 1 is fine with the toolkit (0-based API), but in a hand-written 1-based BIT remember that value x maps directly to cell x.',
  ],
};
