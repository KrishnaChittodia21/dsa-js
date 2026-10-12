export default {
  id: 'search-insert-position',
  title: 'Search Insert Position',
  difficulty: 'Easy',
  order: 2,
  pattern: 'binary-search-boundary',
  tags: ['array', 'binary search', 'lower bound'],
  source: { platform: 'LeetCode', number: 35, url: 'https://leetcode.com/problems/search-insert-position/' },

  statement: `Given a sorted array of **distinct** integers \`nums\` and a \`target\`, return the index of \`target\` if it exists. If it does not, return the index where it **would be inserted** to keep the array sorted.

Your solution must be **O(log n)**.`,
  examples: [
    { input: 'nums = [1,3,5,6], target = 5', output: '2' },
    { input: 'nums = [1,3,5,6], target = 2', output: '1', explanation: '2 goes between 1 and 3.' },
    { input: 'nums = [1,3,5,6], target = 7', output: '4', explanation: 'Bigger than everything → after the last element.' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-10^4 <= nums[i], target <= 10^4', 'nums contains distinct values sorted ascending'],

  think: `- Both cases ("found" and "where it would go") are the same index: which one?
- Can the answer be \`nums.length\`? What does that mean for your initial \`hi\`?`,
  patternChallenge: {
    options: ['Binary Search — lower bound (first index ≥ target)', 'Linear scan with early exit', 'Two Pointers', 'Binary Search on the answer'],
    answer: 0,
    explanation: 'The insert position is by definition the first index whose value is ≥ target — a lower bound. A scan is O(n); "on the answer" is for numeric answer ranges with a feasibility check.',
  },
  hints: [
    'The answer is the first index `i` with `nums[i] >= target` (or `n` if none).',
    'Use `lo = 0, hi = n` and `while (lo < hi)`: if `nums[mid] >= target` keep mid (`hi = mid`), else `lo = mid + 1`.',
  ],
  approach: `**Brute force:** walk until the first element ≥ target — O(n).

**Optimized:** the predicate \`nums[i] >= target\` is false…false,true…true. Find the first true with the half-open boundary template. Because "insert at the end" is legal, \`hi\` starts at \`n\`, not \`n − 1\`.`,

  functionName: 'searchInsert',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function searchInsert(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The target exists — return its index.', args: [[1, 3, 5, 6], 5], expected: 2 },
    { scenario: 'Example 2', hint: 'The target is missing: return where it would go (between 1 and 3), not -1.', args: [[1, 3, 5, 6], 2], expected: 1 },
    { scenario: 'Example 3', hint: 'Larger than everything → insert at n. With `hi = n - 1` in the half-open template you return n - 1 instead.', args: [[1, 3, 5, 6], 7], expected: 4 },
    { scenario: 'Insert at the front', hint: 'Smaller than everything → index 0.', args: [[1, 3, 5, 6], 0], expected: 0 },
    { scenario: 'Single element, equal', hint: 'Found at index 0.', args: [[1], 1], expected: 0 },
    { scenario: 'Single element, larger target', hint: 'Insert after the only element → index 1 (= n). hi must start at n.', args: [[1], 2], expected: 1 },
    { scenario: 'Single element, smaller target', hint: 'Insert before the only element → index 0.', args: [[5], -3], expected: 0 },
    { scenario: 'Negative values', hint: '-4 goes between -10 and -3 → index 1.', args: [[-10, -3, 0, 4], -4], expected: 1 },
    { scenario: 'Target equals last element', hint: 'Found at the last index — not n.', args: [[2, 4, 6, 8], 8], expected: 3 },
    { scenario: 'Missing, not -1', hint: 'Returning -1 for a missing target is wrong here — the answer is the first index with a value >= 5.', args: [[1, 2, 4, 7, 9], 5], expected: 3 },
    { scenario: 'Extreme values', hint: 'Target -10^4 equals the minimum allowed value and sits at index 0.', args: [[-10000, 0, 10000], -10000], expected: 0 },
    { scenario: 'Two elements, between', hint: 'With two elements mid = 0; the insert point is index 1.', args: [[10, 20], 15], expected: 1 },
    { scenario: 'Largest input, insert at end', hint: 'n = 10^4 and the target is larger than every value → 10^4.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 2 * i - 10000), 10000]', expected: 10000 },
    { scenario: 'Largest input, insert in gap', hint: 'An odd target between even values of a 10^4 array — return the lower bound, not -1.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 2 * i - 10000), 1235]', expected: 5618 },
  ],

  solution: {
    code: `function searchInsert(nums, target) {
  let lo = 0, hi = nums.length;          // answer may be nums.length
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] >= target) hi = mid;   // mid could be the first >= target
    else lo = mid + 1;
  }
  return lo;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'nums[mid] >= 2?', 'decision'],
    rows: [
      ['0', '4', '2', 'yes (5)', 'hi = 2'],
      ['0', '2', '1', 'yes (3)', 'hi = 1'],
      ['0', '1', '0', 'no (1)', 'lo = 1'],
      ['1', '1', '—', '—', 'return 1'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'Standard boundary search.' },
  alternative: {
    title: 'Closed template returning lo',
    md: 'Run the exact-match `lo <= hi` search; if the target is not found, `lo` ends at the insert position (it is the first index whose value is larger than target).',
    code: `function searchInsert(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return lo;
}`,
    complexity: 'O(log n) time, O(1) space',
  },
  mistakes: [
    'Initialising `hi = n - 1` in the half-open template: target larger than all elements returns n − 1 instead of n.',
    'Returning -1 when not found — the problem wants the insertion index.',
  ],
};
