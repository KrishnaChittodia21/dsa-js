// ---- large-test generators (deterministic; used by the timed tests below) ----
// n = 10^5 values falling from 10^4 to −9999 in blocks of 5 equal values:
// counts[i] = number of elements after i's block = n − 5·(⌊i/5⌋ + 1).
const bigSmallerArgs = () => [Array.from({ length: 100000 }, (_, i) => 10000 - Math.floor(i / 5))];
const bigSmallerExpected = () => Array.from({ length: 100000 }, (_, i) => 100000 - 5 * (Math.floor(i / 5) + 1));
// ---- end generators ----

export default {
  id: 'count-of-smaller-numbers-after-self',
  title: 'Count of Smaller Numbers After Self',
  difficulty: 'Hard',
  order: 1,
  pattern: 'bit-coordinate-compression-counting',
  tags: ['array', 'fenwick tree', 'coordinate compression', 'merge sort'],
  source: { platform: 'LeetCode', number: 315, url: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/' },

  statement: `Given an integer array \`nums\`, return an array \`counts\` of the same length where \`counts[i]\` is the number of elements **to the right of index i** that are **strictly smaller** than \`nums[i]\`.`,
  examples: [
    { input: 'nums = [5,2,6,1]', output: '[2,1,1,0]', explanation: 'Right of 5: 2 and 1 are smaller. Right of 2: only 1. Right of 6: only 1. Nothing is right of 1.' },
    { input: 'nums = [-1]', output: '[0]' },
    { input: 'nums = [-1,-1]', output: '[0,0]', explanation: 'Equal values are not strictly smaller.' },
  ],
  constraints: ['0 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],

  think: `- If you walk from the **right end** to the left, what set of numbers have you already seen when you reach index i?
- Keep a count per value of everything seen. "How many seen values are < nums[i]" is then which kind of query?
- Values can be negative. How do you turn them into Fenwick indices?`,
  patternChallenge: {
    options: ['Coordinate Compression + BIT Counting', 'Monotonic Stack (next smaller element)', 'Sliding Window — Fixed Size', 'Binary Search on a static sorted copy'],
    answer: 0,
    explanation: 'Scanning right to left makes "to the right" equal "already seen". A Fenwick tree over compressed values counts seen values smaller than nums[i] in O(log n). A monotonic stack finds the *nearest* smaller element, not how many there are; a static sorted copy includes elements on both sides.',
  },
  hints: [
    'Compress values: sort the distinct values, map each to its index (rank).',
    'Iterate i from n − 1 down to 0: `counts[i] = bit.prefixSum(rank − 1)` then `bit.add(rank, 1)`. Query *before* inserting so an element never counts itself.',
  ],
  approach: `**Brute force:** for each i, scan j > i and count smaller values — O(n²), 5·10^9 steps at n = 10^5.

**Optimized — BIT over compressed values (O(n log n)):**
1. \`sorted = [...new Set(nums)].sort((a, b) => a − b)\`, \`rank = Map(value → index)\`.
2. \`bit = new FenwickTree(sorted.length)\` counts how many times each rank has been seen.
3. For i from right to left: \`counts[i] = rank > 0 ? bit.prefixSum(rank − 1) : 0\`; then \`bit.add(rank, 1)\`.

Because values here are within ±10^4, you could also shift by 10^4 + 1 instead of compressing — compression is the general technique that also works for ±10^9.

**Alternative — merge sort:** sort indices by value with merge sort; when an element from the left half is placed, every right-half element already placed before it is smaller and lies to its right. Add that count to its answer.`,

  functionName: 'countSmaller',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function countSmaller(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Look only to the right of each index: 5 sees 2 and 1, 6 sees only 1.', args: [[5,2,6,1]], expected: [2,1,1,0] },
    { scenario: 'Example 2', hint: 'A single element has nothing to its right.', args: [[-1]], expected: [0] },
    { scenario: 'Example 3', hint: 'Equal values are not strictly smaller — query ranks below the current one only.', args: [[-1,-1]], expected: [0,0] },
    { scenario: 'Empty array', hint: 'n = 0 is allowed: return [] without building anything that needs a value.', args: [[]], expected: [] },
    { scenario: 'Two elements', hint: 'The first element sees exactly one element to its right.', args: [[2,1]], expected: [1,0] },
    { scenario: 'Already sorted ascending', hint: 'Nothing to the right is smaller. If you scan left to right you count the left side instead.', args: [[1,2,3,4,5]], expected: [0,0,0,0,0] },
    { scenario: 'Strictly descending', hint: 'Every element to the right is smaller: n − 1 − i.', args: [[4,3,2,1]], expected: [3,2,1,0] },
    { scenario: 'Duplicates are not smaller', hint: 'prefixSum(rank) includes equal values — the problem asks for strictly smaller, so use prefixSum(rank − 1).', args: [[2,2,1,2,1,2]], expected: [2,2,0,1,0,0] },
    { scenario: 'Negative values', hint: 'Default .sort() compares strings: [-1, -10, 2, -5] sorts wrongly and the ranks break. Sort with (a, b) => a − b.', args: [[-1,-10,2,-5,-10,3]], expected: [3,0,2,1,0,0] },
    { scenario: 'Extreme values ±10^4', hint: 'Values reach both ends of the range — offsetting by 10^4 (or compressing) must handle them.', args: [[10000,-10000,0,10000,-10000,9999]], expected: [4,0,1,2,0,0] },
    { scenario: 'Mixed duplicates', hint: 'Repeated values on both sides of each other.', args: [[3,-2,3,-2,0]], expected: [3,0,2,0,0] },
    { scenario: 'Random (n = 100)', hint: 'Pseudo-random values with many repeats — compare with a double loop on a small prefix if this fails.', argsGen: '() => { let s = 11; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 100 }, () => (rnd() % 101) - 50)]; }', expected: [65,77,55,55,34,57,35,88,16,62,70,27,71,0,72,84,27,65,31,22,48,33,13,62,25,8,34,66,58,21,13,36,56,56,25,19,34,48,38,30,44,20,51,17,12,2,7,15,41,35,12,7,16,18,13,32,34,12,4,11,16,3,29,30,24,29,33,26,17,8,6,20,1,23,9,18,21,11,5,16,11,13,2,2,8,12,3,5,9,5,2,7,2,1,0,0,0,1,0,0] },
    { scenario: 'Large input (n = 10^5)', hint: 'A double loop is O(n²) = 5·10^9 steps. Scan right to left with a BIT over value ranks for O(n log n).', argsGen: String(bigSmallerArgs), expected: bigSmallerExpected(), timeLimitMs: 1000 },
  ],
  solution: {
    code: `function countSmaller(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));
  const bit = new FenwickTree(sorted.length);        // toolkit: add(i, d), prefixSum(i)
  const counts = new Array(nums.length).fill(0);

  for (let i = nums.length - 1; i >= 0; i--) {
    const r = rank.get(nums[i]);
    counts[i] = r > 0 ? bit.prefixSum(r - 1) : 0;    // seen (= to the right) and strictly smaller
    bit.add(r, 1);                                   // now nums[i] is "seen"
  }
  return counts;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'rank', 'BIT counts by rank before', 'prefixSum(rank − 1)', 'counts[i]'],
    rows: [
      ['3', '1', '0', '[0,0,0,0]', '— (rank 0)', '0'],
      ['2', '6', '3', '[1,0,0,0]', '1', '1'],
      ['1', '2', '1', '[1,0,0,1]', '1', '1'],
      ['0', '5', '2', '[1,1,0,1]', '2', '2'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting the distinct values is O(n log n); then n BIT queries and updates at O(log n) each.' },
  alternative: {
    title: 'Merge sort on indices',
    md: 'During each merge, keep `rightTaken` = how many right-half elements have already been output. When a left-half element is output, all of those were smaller than it and lie to its right — add `rightTaken` to its count. Take the left element on ties so equal values are not counted.',
    code: `function countSmaller(nums) {
  const n = nums.length;
  const counts = new Array(n).fill(0);
  let idx = Array.from({ length: n }, (_, i) => i);
  const sort = (lo, hi) => {                   // sorts idx[lo..hi) by value
    if (hi - lo < 2) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid); sort(mid, hi);
    const merged = [];
    let i = lo, j = mid, rightTaken = 0;
    while (i < mid || j < hi) {
      if (j === hi || (i < mid && nums[idx[i]] <= nums[idx[j]])) {
        counts[idx[i]] += rightTaken;
        merged.push(idx[i++]);
      } else {
        rightTaken++;
        merged.push(idx[j++]);
      }
    }
    for (let k = 0; k < merged.length; k++) idx[lo + k] = merged[k];
  };
  sort(0, n);
  return counts;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Scanning left to right — then "seen" means "to the left", the opposite of what is asked.',
    'Inserting before querying, which counts nothing extra for strict "<" but breaks the "≤" variant; always query first by habit.',
    'Using `prefixSum(rank)` — that includes equal values, but the problem asks for strictly smaller.',
    'Default `.sort()` on negative numbers: `[-1, -10, 2].sort()` gives `[-1, -10, 2]`.',
  ],
};
