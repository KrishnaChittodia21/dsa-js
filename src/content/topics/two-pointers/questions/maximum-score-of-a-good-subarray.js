export default {
  id: 'maximum-score-of-a-good-subarray',
  title: 'Maximum Score of a Good Subarray',
  difficulty: 'Hard',
  order: 2,
  pattern: 'two-pointers-bottleneck',
  tags: ['array', 'two pointers', 'greedy'],
  source: { platform: 'LeetCode', number: 1793, url: 'https://leetcode.com/problems/maximum-score-of-a-good-subarray/' },

  statement: `You are given an array of positive integers \`nums\` and an index \`k\`.

The **score** of a subarray \`nums[i..j]\` is \`min(nums[i..j]) × (j − i + 1)\`. A subarray is **good** if it contains index \`k\` (\`i <= k <= j\`).

Return the maximum score of a good subarray.`,
  examples: [
    { input: 'nums = [1,4,3,7,4,5], k = 3', output: '15', explanation: 'nums[1..5] = [4,3,7,4,5]: min 3 × length 5 = 15.' },
    { input: 'nums = [5,5,4,5,4,1,1,1], k = 0', output: '20', explanation: 'nums[0..4]: min 4 × length 5 = 20.' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '1 <= nums[i] <= 2 * 10^4', '0 <= k < nums.length'],

  think: `- Every good subarray contains \`k\`. So start with \`[k, k]\` and grow. Growing adds either \`nums[i − 1]\` or \`nums[j + 1]\`. Which one should you add, and why?
- Compare with Container With Most Water: there you shrank from outside in and dropped the smaller side. What is the mirror image when growing from the inside out?
- Can the greedy ever grow past the best subarray before reaching it exactly?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Two Pointers — expand outward from k towards the larger neighbour', 'Prefix Sum', 'Sort + Two Pointers'],
    answer: 1,
    explanation: 'The score is `min × width` — a bottleneck. Starting at k, extending towards the **larger** neighbour keeps the min as high as possible for each width. Sliding windows need a validity rule; sorting destroys contiguity. (A monotonic stack for "largest rectangle" also works.)',
  },
  hints: [
    'Keep `i = j = k` and `curMin = nums[k]`. At each step extend by one: to the right if `nums[j + 1] > nums[i − 1]` (or the left end is at 0), else to the left.',
    'After each extension, update `curMin` and the best score `curMin × (j − i + 1)`. Stop when the range covers the whole array.',
  ],
  approach: `**Brute force:** every \`i ≤ k ≤ j\`, O(n²) with a running min.

**Greedy two pointers (expand outward):** start at \`[k, k]\`. For every length from 1 to n there is one step; always extend towards the **larger** neighbour, because that loses the least from the min.

**Why it is optimal:** let \`[a, b]\` be an optimal good subarray of **maximum length**, with minimum \`m\`. While the greedy range \`[i, j]\` is inside \`[a, b]\`, suppose it steps outside first, e.g. to \`a − 1\` while \`j < b\`. It chose the left because \`nums[a − 1] ≥ nums[j + 1] ≥ m\` (\`j + 1\` is inside \`[a, b]\`). But then \`[a − 1, b]\` also has minimum \`m\` and is longer, so its score is bigger (all numbers are positive) — contradicting the choice of \`[a, b]\`. The same holds on the right. So the greedy reaches exactly \`[a, b]\` at some step and records its score.`,

  functionName: 'maximumScore',
  paramNames: ['nums', 'k'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function maximumScore(nums, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: expand from k = 3 to cover [4, 3, 7, 4, 5] for 3 × 5 = 15.', args: [[1, 4, 3, 7, 4, 5], 3], expected: 15 },
    { scenario: 'Example 2', hint: 'k is at the left edge, so you can only grow to the right. Handle a side that is already at the boundary.', args: [[5, 5, 4, 5, 4, 1, 1, 1], 0], expected: 20 },
    { scenario: 'Single element', hint: 'The only good subarray is [7] itself.', args: [[7], 0], expected: 7 },
    { scenario: 'k at the right edge', hint: 'Only the left side can grow. Reading nums[j + 1] past the end gives undefined and breaks the comparison.', args: [[2, 3, 4, 5, 6], 4], expected: 12 },
    { scenario: 'All equal', hint: 'Every extension keeps the min, so the whole array wins: 1 × 4.', args: [[1, 1, 1, 1], 2], expected: 4 },
    { scenario: 'Best is just k', hint: 'The neighbours are tiny: extending only lowers the score, so the answer is nums[k] alone.', args: [[1, 100, 1], 1], expected: 100 },
    { scenario: 'Extend toward the larger side', hint: 'Always step toward the larger neighbour. Stepping toward the smaller one drops the min too early and misses [5, 4, 3, 2, 3, 6] with 2 × 6 = 12.', args: [[1, 5, 4, 3, 2, 3, 6, 1], 4], expected: 12 },
    { scenario: 'Must contain k', hint: 'The best subarray overall is [10, 10, 10] (30), but it does not contain k = 0. A good subarray must include index k.', args: [[10, 1, 10, 10, 10], 0], expected: 10 },
    { scenario: 'Mixed values', hint: 'A random-looking case: compare every (min × width) as you expand both ways.', args: [[6569, 9667, 3148, 7698, 1622, 2194, 793, 9041, 1670, 1872], 5], expected: 9732 },
    { scenario: 'Valley around k', hint: 'k sits on the minimum, so the full array is best: 2 × 7 = 14.', args: [[9, 8, 7, 2, 7, 8, 9], 3], expected: 14 },
    { scenario: 'Max values', hint: 'Values up to 2·10^4 and long widths: scores stay well inside JS number range.', args: [[20000, 20000, 20000], 1], expected: 60000 },
    { scenario: 'Large input (n = 10^5)', hint: 'Trying every (i, j) pair around k is O(n²). Greedy expansion toward the larger neighbour is O(n).', argsGen: '() => { let s = 31; const a = Array.from({ length: 100000 }, () => { s = (s * 48271) % 2147483647; return (s % 20000) + 1; }); return [a, 50000]; }', expected: 146835, timeLimitMs: 1000 },
    { scenario: 'Large, increasing values', hint: 'Strictly increasing values with k at the start: the expansion must walk all the way to the right edge.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => Math.floor(i / 5) + 1), 0]', expected: 100000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maximumScore(nums, k) {
  const n = nums.length;
  let i = k, j = k, curMin = nums[k], best = nums[k];
  while (i > 0 || j < n - 1) {
    // extend towards the larger neighbour (the only option at an edge)
    if (i === 0) j++;
    else if (j === n - 1) i--;
    else if (nums[j + 1] > nums[i - 1]) j++;
    else i--;
    curMin = Math.min(curMin, nums[i], nums[j]);
    best = Math.max(best, curMin * (j - i + 1));
  }
  return best;
}`,
    explanation: 'Only one of `nums[i]` / `nums[j]` is new each step, but taking the min of both is harmless and keeps the code symmetric.',
  },
  dryRun: {
    columns: ['i, j', 'extend', 'curMin', 'score', 'best'],
    rows: [
      ['3, 3', 'start', '7', '7', '7'],
      ['3, 4', 'right (4 > 3)', '4', '8', '8'],
      ['3, 5', 'right (5 > 3)', '4', '12', '12'],
      ['2, 5', 'left (edge)', '3', '12', '12'],
      ['1, 5', 'left', '3', '15', '15'],
      ['0, 5', 'left', '1', '6', '15'],
    ],
    note: 'nums = [1,4,3,7,4,5], k = 3.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Exactly n − 1 extension steps.' },
  alternative: {
    title: 'Monotonic stack (largest rectangle containing k)',
    md: 'For every index, find how far it can extend left and right while staying the minimum (previous/next smaller element via a monotonic stack — Stack topic). Among ranges that contain k, take the best `nums[x] × width`. O(n) time, O(n) space, and a nice link to Largest Rectangle in Histogram.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Extending towards the smaller neighbour — it drops the min faster than necessary.',
    'Forgetting to handle the edges (one side already at the array boundary).',
    'Allowing subarrays that do not contain k.',
  ],
};
