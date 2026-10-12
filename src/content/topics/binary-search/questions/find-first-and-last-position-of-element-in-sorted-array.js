export default {
  id: 'find-first-and-last-position-of-element-in-sorted-array',
  title: 'Find First and Last Position of Element in Sorted Array',
  difficulty: 'Medium',
  order: 1,
  pattern: 'binary-search-boundary',
  tags: ['array', 'binary search', 'lower bound', 'upper bound'],
  source: { platform: 'LeetCode', number: 34, url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/' },

  statement: `Given an array \`nums\` sorted in non-decreasing order (duplicates allowed) and a \`target\`, return \`[first, last]\` — the first and last indices where \`target\` appears. If it does not appear, return \`[-1, -1]\`.

The solution must run in **O(log n)**.`,
  examples: [
    { input: 'nums = [5,7,7,8,8,10], target = 8', output: '[3,4]' },
    { input: 'nums = [5,7,7,8,8,10], target = 6', output: '[-1,-1]' },
    { input: 'nums = [], target = 0', output: '[-1,-1]' },
  ],
  constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i], target <= 10^9', 'nums is sorted non-decreasing'],

  think: `- Finding *some* 8 and then walking left/right is O(n) in the worst case (all elements equal). Why?
- Which two boundary questions give you "first" and "last"?`,
  patternChallenge: {
    options: ['Exact-match binary search, then expand outwards', 'Binary Search — lower bound + upper bound', 'Two Pointers from both ends', 'Hash Map value → indices'],
    answer: 1,
    explanation: 'First = first index ≥ target (lower bound); last = (first index > target) − 1 (upper bound). Expanding outwards from a hit degenerates to O(n) when the array is all one value.',
  },
  hints: [
    'Write one helper `firstAtLeast(x)` = first index with `nums[i] >= x`.',
    'first = firstAtLeast(target); last = firstAtLeast(target + 1) − 1 (integers!). If first === n or nums[first] !== target, return [-1, -1].',
  ],
  approach: `**Brute force:** linear scan for the first and last match — O(n).

**Optimized:** two boundary searches.
- \`first = lowerBound(target)\` — the first index with value ≥ target.
- \`last = upperBound(target) − 1\` — one before the first index with value > target. For integers, \`upperBound(t) = lowerBound(t + 1)\`, so one helper suffices.
- If \`first\` is out of range or \`nums[first] !== target\`, the value is absent.`,

  functionName: 'searchRange',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function searchRange(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: a run of two 8s in the middle.', args: [[5, 7, 7, 8, 8, 10], 8], expected: [3, 4] },
    { scenario: 'Example 2', hint: 'The target is absent — both boundaries must report -1.', args: [[5, 7, 7, 8, 8, 10], 6], expected: [-1, -1] },
    { scenario: 'Example 3', hint: 'An empty array: do not read nums[0] before checking the length.', args: [[], 0], expected: [-1, -1] },
    { scenario: 'Single element, match', hint: 'First and last occurrence are the same index.', args: [[1], 1], expected: [0, 0] },
    { scenario: 'Single element, no match', hint: 'One element that is not the target — return [-1, -1].', args: [[1], 0], expected: [-1, -1] },
    { scenario: 'Two equal elements', hint: 'Both indices are in the run: the lower bound must stop at 0 and the upper bound must reach 1.', args: [[8, 8], 8], expected: [0, 1] },
    { scenario: 'All duplicates', hint: 'The whole array is the run. The answer is [0, n - 1].', args: [[2, 2, 2, 2, 2], 2], expected: [0, 4] },
    { scenario: 'Target above all values', hint: 'The lower bound lands at n. Check `first < n` before reading nums[first].', args: [[1, 2, 3], 4], expected: [-1, -1] },
    { scenario: 'Target below all values', hint: 'The lower bound lands at 0 but nums[0] is not the target — still [-1, -1].', args: [[1, 2, 3], 0], expected: [-1, -1] },
    { scenario: 'Target between values', hint: 'The lower bound points at a larger value (5); confirm nums[first] === target before answering.', args: [[1, 3, 5, 7], 4], expected: [-1, -1] },
    { scenario: 'Run at the start', hint: 'The run begins at index 0 — the left search must be able to reach the left edge.', args: [[4, 4, 4, 5, 6], 4], expected: [0, 2] },
    { scenario: 'Run at the end', hint: 'The run ends at the last index — the right search must be able to reach n - 1.', args: [[1, 1, 2, 3, 3, 3], 3], expected: [3, 5] },
    { scenario: 'Extreme values', hint: 'Values at ±10^9: avoid tricks like searching for target + 1 that assume extra headroom or integer gaps elsewhere.', args: [[-1000000000, -1000000000, 0, 1000000000, 1000000000], 1000000000], expected: [3, 4] },
    { scenario: 'Large run of duplicates', hint: '10^5 copies of 7. Finding one match and expanding outward is O(n); two boundary searches stay O(log n).', argsGen: '() => [new Array(100000).fill(7), 7]', expected: [0, 99999] },
    { scenario: 'Large input, run in middle', hint: 'n = 10^5 with each value repeated 10 times — both boundaries must land exactly on the run of 5000s.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => Math.floor(i / 10)), 5000]', expected: [50000, 50009] },
  ],

  solution: {
    code: `function searchRange(nums, target) {
  // first index i with nums[i] >= x (nums.length if none)
  const firstAtLeast = (x) => {
    let lo = 0, hi = nums.length;
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1);
      if (nums[mid] >= x) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };

  const first = firstAtLeast(target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  const last = firstAtLeast(target + 1) - 1;   // upper bound − 1
  return [first, last];
}`,
  },
  dryRun: `For \`[5,7,7,8,8,10]\`, target 8:

| search | lo,hi steps | result |
|---|---|---|
| firstAtLeast(8) | (0,6)→mid 3 (8 ≥ 8) hi=3 → mid 1 (7) lo=2 → mid 2 (7) lo=3 | 3 |
| firstAtLeast(9) | (0,6)→mid 3 (8) lo=4 → mid 5 (10 ≥ 9) hi=5 → mid 4 (8) lo=5 | 5 → last = 4 |`,
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'Two independent binary searches.' },
  alternative: {
    title: 'Biased exact-match search',
    md: 'Run the closed `lo <= hi` search twice. When `nums[mid] === target`, record mid and continue left (`hi = mid − 1`) for the first occurrence, or right (`lo = mid + 1`) for the last.',
    complexity: 'O(log n) time, O(1) space',
  },
  mistakes: [
    'Finding one match and expanding linearly: O(n) on `[7,7,7,…]`.',
    'Not checking `first < n` before reading `nums[first]`.',
    'Using `target + 1` trick on non-integers — write a separate upper-bound helper there.',
  ],
};
