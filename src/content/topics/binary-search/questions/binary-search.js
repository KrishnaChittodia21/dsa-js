export default {
  id: 'binary-search',
  title: 'Binary Search',
  difficulty: 'Easy',
  order: 1,
  pattern: 'binary-search-exact',
  tags: ['array', 'binary search'],
  source: { platform: 'LeetCode', number: 704, url: 'https://leetcode.com/problems/binary-search/' },

  statement: `You are given an array of integers \`nums\` sorted in **strictly increasing** order and an integer \`target\`.

Return the index of \`target\` in \`nums\`, or \`-1\` if it does not appear. Your algorithm must run in **O(log n)** time.`,
  examples: [
    { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 is at index 4.' },
    { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 is not in the array.' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All values are distinct', 'nums is sorted ascending'],

  think: `- What does comparing \`target\` with the middle element tell you about the elements to its left and right?
- What is your search space, and is it closed \`[lo, hi]\` or half-open?
- When exactly should the loop stop?`,
  patternChallenge: {
    options: ['Two Pointers (opposite ends)', 'Hash Map lookup', 'Binary Search — exact match', 'Sliding Window'],
    answer: 2,
    explanation: '"Sorted" + "find the index" + "O(log n)" is the textbook exact-match binary search. A hash map needs O(n) to build; two pointers and windows are linear scans.',
  },
  hints: [
    'Keep `lo` and `hi` as the first and last index that could still hold the target.',
    'If `nums[mid] < target`, the target can only be right of mid (`lo = mid + 1`); otherwise left (`hi = mid - 1`). Stop when `lo > hi`.',
  ],
  approach: `**Brute force:** scan every index — O(n).

**Optimized:** closed-interval binary search. Invariant: *if target exists it is in [lo, hi]*. Compare with \`nums[mid]\`; equal → return; smaller → \`lo = mid + 1\`; bigger → \`hi = mid - 1\`. The range shrinks by at least one each step, halving in size, so O(log n).`,

  functionName: 'search',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: the target is present.', args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
    { scenario: 'Example 2', hint: 'The target is absent — return -1 once the search range becomes empty.', args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
    { scenario: 'Single element, found', hint: 'With one element lo === hi from the start. A `while (lo < hi)` loop never runs and the only element is never checked.', args: [[5], 5], expected: 0 },
    { scenario: 'Single element, missing', hint: 'One element that is not the target: make sure the loop terminates and you return -1.', args: [[5], -5], expected: -1 },
    { scenario: 'Two elements, target last', hint: 'If you use `while (lo < hi)` with `hi = n - 1`, the last remaining element is never compared.', args: [[1, 3], 3], expected: 1 },
    { scenario: 'Two elements, target first', hint: 'mid lands on index 0 here. Writing `lo = mid` instead of `mid + 1` in the other branch can loop forever.', args: [[1, 3], 1], expected: 0 },
    { scenario: 'Target below all values', hint: 'hi keeps moving left until it drops below lo — make sure you stop and return -1, not an index.', args: [[2, 4, 6, 8, 10], 1], expected: -1 },
    { scenario: 'Target above all values', hint: 'lo moves past the end of the array. Never read nums[lo] after the loop without a bounds check.', args: [[2, 4, 6, 8, 10], 11], expected: -1 },
    { scenario: 'Target at index 0', hint: 'The answer is the very first element of a longer array — the range must shrink all the way to the left edge.', args: [[-7, -2, 0, 4, 8, 15, 23], -7], expected: 0 },
    { scenario: 'Target at last index', hint: 'The answer is the very last element — the range must shrink all the way to the right edge.', args: [[-7, -2, 0, 4, 8, 15, 23], 23], expected: 6 },
    { scenario: 'Even length, fractional mid', hint: 'With `(lo + hi) / 2` (no floor) mid becomes 2.5 here and nums[2.5] is undefined. Always floor the midpoint.', args: [[1, 2, 3, 4, 5, 6], 4], expected: 3 },
    { scenario: 'Missing value in a gap', hint: 'The target falls between two neighbours; lo and hi cross between them and the loop must end with -1.', args: [[-9, -5, -1, 3, 7, 11, 13, 17], 4], expected: -1 },
    { scenario: 'Largest input (n = 10^4)', hint: 'Target near the end of the biggest allowed array — check your bounds hold for n = 10^4.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 2 * i - 9999), 9997]', expected: 9998 },
    { scenario: 'Largest input, target missing', hint: 'An even target between the odd values of a 10^4-element array: the search must end cleanly with -1.', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => 2 * i - 9999), 0]', expected: -1 },
  ],

  solution: {
    code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;       // closed range [lo, hi]
  while (lo <= hi) {                       // non-empty
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;  // mid and left are too small
    else hi = mid - 1;                     // mid and right are too big
  }
  return -1;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'nums[mid]', 'decision'],
    rows: [
      ['0', '5', '2', '3', '3 < 9 → lo = 3'],
      ['3', '5', '4', '9', 'found → 4'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'The range halves each iteration; only three variables are stored.' },
  alternative: {
    title: 'Lower bound then check',
    md: 'Compute `i = lowerBound(nums, target)` (first index with value ≥ target) and return `i` if `nums[i] === target`, else -1. Same complexity, and it generalises to duplicates.',
    code: `function search(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] >= target) hi = mid; else lo = mid + 1;
  }
  return nums[lo] === target ? lo : -1;
}`,
    complexity: 'O(log n) time, O(1) space',
  },
  mistakes: [
    '`while (lo < hi)` with `hi = n - 1`: a single remaining element is never checked.',
    '`lo = mid` instead of `mid + 1` → infinite loop when lo === mid.',
    'Forgetting to floor the midpoint: `(lo + hi) / 2` can be fractional in JS.',
  ],
};
