export default {
  id: 'minimum-difference-between-highest-and-lowest-of-k-scores',
  title: 'Minimum Difference Between Highest and Lowest of K Scores',
  difficulty: 'Easy',
  order: 3,
  pattern: 'fixed-window',
  tags: ['array', 'sorting', 'sliding window'],
  source: { platform: 'LeetCode', number: 1984, url: 'https://leetcode.com/problems/minimum-difference-between-highest-and-lowest-of-k-scores/' },

  statement: `\`nums[i]\` is the score of student \`i\`. Choose **any \`k\` students** so that the difference between the highest and the lowest score among the chosen students is as **small** as possible.

Return that minimum possible difference.`,
  examples: [
    { input: 'nums = [90], k = 1', output: '0', explanation: 'One student: highest = lowest.' },
    { input: 'nums = [9,4,1,7], k = 2', output: '2', explanation: 'Pick 9 and 7 → 9 - 7 = 2.' },
  ],
  constraints: ['1 <= k <= nums.length <= 1000', '0 <= nums[i] <= 10^5'],

  think: `- The chosen students can be anywhere in the array. Is there an order in which the best choice becomes a *contiguous* block?
- After sorting, if you pick k scores with a gap in the middle, can you always do at least as well by closing the gap?
- In a sorted block of k values, where are the max and the min?`,
  patternChallenge: {
    options: ['Hash Map (Complement Lookup)', 'Prefix Sum', 'Sort, then Fixed-Size Sliding Window', 'Backtracking over all k-subsets'],
    answer: 2,
    explanation: 'Picking "any k" is not contiguous — until you sort. In sorted order an optimal choice is always k neighbours, so we slide a window of size k and the spread is simply `last - first`. Backtracking would try C(n, k) subsets.',
  },
  hints: [
    'Sort the scores numerically (remember: JavaScript `sort()` without a comparator sorts as strings).',
    'In the sorted array, every window `nums[i .. i + k - 1]` has spread `nums[i + k - 1] - nums[i]`. Take the minimum over all i.',
  ],
  approach: `**Brute force:** try every subset of size k → C(n, k), hopeless.

**Key insight:** sort first. Suppose an optimal choice in sorted order skips a value \`x\` between its min and max. Swapping the max (or min) for \`x\` never increases the spread. Repeating this, some optimal choice is **k consecutive sorted values**.

**Optimized:** sort ascending, then slide a fixed window of size k. For a sorted window the min is its first element and the max its last, so each window costs O(1). Answer = \`min(nums[i + k - 1] - nums[i])\`.`,

  functionName: 'minimumDifference',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function minimumDifference(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'One student: highest = lowest, difference 0.', args: [[90], 1], expected: 0 },
    { scenario: 'Example 2', hint: 'Pick 9 and 7 — they are not adjacent in the input, so sort first.', args: [[9, 4, 1, 7], 2], expected: 2 },
    { scenario: 'k = 1', hint: 'Any single student gives difference 0.', args: [[5, 100, 3], 1], expected: 0 },
    { scenario: 'k = n', hint: 'All students are chosen: max - min of the whole array.', args: [[3, 9, 1, 6], 4], expected: 8 },
    { scenario: 'Last window is best', hint: 'The best group is the k largest scores. Looping `i < n - k` misses that last window.', args: [[1, 10, 20, 21], 2], expected: 1 },
    { scenario: 'Default sort trap', hint: '`sort()` without a comparator puts 100 before 9 (string order) and the windows become wrong.', args: [[100, 9, 101, 8], 2], expected: 1 },
    { scenario: 'Not adjacent in input', hint: 'The two closest scores (50 and 52) are far apart in the array — a window on the unsorted input misses them.', args: [[50, 1, 99, 30, 52], 2], expected: 2 },
    { scenario: 'Duplicates', hint: 'Equal scores give difference 0.', args: [[7, 3, 7, 10], 2], expected: 0 },
    { scenario: 'All zeros', hint: 'Score 0 is allowed; the difference is 0.', args: [[0, 0, 0], 3], expected: 0 },
    { scenario: 'Max scores', hint: 'Scores at 0 and 10^5: the difference can be as large as 10^5.', args: [[0, 100000], 2], expected: 100000 },
    { scenario: 'Three of five', hint: 'k = 3: the best window of three sorted scores is [4, 5, 7].', args: [[12, 4, 7, 20, 5], 3], expected: 3 },
    { scenario: 'Largest n (1000)', hint: 'The largest allowed input. Sort (O(n log n)) and slide a window of size k.', argsGen: '() => { let s = 59; return [Array.from({ length: 1000 }, () => { s = (s * 48271) % 2147483647; return s % 100001; }), 37]; }', expected: 2186 },
  ],

  solution: {
    code: `function minimumDifference(nums, k) {
  const sorted = [...nums].sort((a, b) => a - b); // numeric sort, don't mutate input
  let best = Infinity;
  for (let i = 0; i + k - 1 < sorted.length; i++) {
    best = Math.min(best, sorted[i + k - 1] - sorted[i]); // window [i, i+k-1]
  }
  return best;
}`,
    explanation: 'The comparator `(a, b) => a - b` is essential: the default sort would order `[100, 20, 3]` as `[100, 20, 3]` (string order "100" < "20" < "3").',
  },
  dryRun: {
    columns: ['i', 'window (sorted [1,4,7,9], k=2)', 'spread', 'best'],
    rows: [
      ['0', '[1, 4]', '3', '3'],
      ['1', '[4, 7]', '3', '3'],
      ['2', '[7, 9]', '2', '2'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting dominates; the window pass is O(n). The copy costs O(n) (sort in place for O(1) extra if mutation is allowed).' },
  alternative: {
    title: 'Counting sort',
    md: 'Scores are bounded by 10^5, so a counting sort would make the sort O(n + maxValue). Rarely worth it at n ≤ 1000, but a good point to raise in an interview.',
    complexity: 'O(n + V) time, O(V) space',
  },
  mistakes: [
    'Calling `nums.sort()` without a comparator — lexicographic order gives wrong answers for multi-digit numbers.',
    'Looping `i < n - k` instead of `i <= n - k` and missing the last window.',
    'Trying a window on the unsorted array — the chosen students do not need to be adjacent in the input.',
  ],
};
