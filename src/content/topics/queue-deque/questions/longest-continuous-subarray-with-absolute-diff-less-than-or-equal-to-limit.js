export default {
  id: 'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit',
  title: 'Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit',
  difficulty: 'Medium',
  order: 5,
  pattern: 'monotonic-deque-window',
  tags: ['array', 'sliding window', 'monotonic deque'],
  source: { platform: 'LeetCode', number: 1438, url: 'https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/' },

  statement: `Given an integer array \`nums\` and an integer \`limit\`, return the length of the longest non-empty contiguous subarray in which the absolute difference between **any two** elements is at most \`limit\`.

(Equivalently: \`max(subarray) − min(subarray) <= limit\`.)`,
  examples: [
    { input: 'nums = [8,2,4,7], limit = 4', output: '2', explanation: '[2,4] or [4,7].' },
    { input: 'nums = [10,1,2,4,7,2], limit = 5', output: '4', explanation: '[2,4,7,2]: max 7 − min 2 = 5.' },
    { input: 'nums = [4,2,2,2,4,4,2,2], limit = 0', output: '3' },
  ],
  constraints: ['1 <= nums.length <= 10^5', '1 <= nums[i] <= 10^9', '0 <= limit <= 10^9'],

  think: `- "Any two elements differ by at most limit" is the same as max − min ≤ limit. Is that rule monotonic (does a valid window stay valid when it shrinks)?
- A variable sliding window then works — but how do you know the window's max and min in O(1) as it grows and shrinks?
- How many deques do you need?`,
  patternChallenge: {
    options: ['Sort + two pointers', 'Prefix sums', 'Variable sliding window + two monotonic deques (max and min)', 'Binary search on the answer with brute-force checks'],
    answer: 2,
    explanation: 'Shrinking a window never increases max − min, so the variable window is valid. Its max and min under both expansion and shrinking come from a decreasing deque and an increasing deque. Sorting destroys contiguity.',
  },
  hints: [
    'Keep maxD (indices, values decreasing) and minD (indices, values increasing). Push right into both after popping dominated backs.',
    'While nums[maxD.front] − nums[minD.front] > limit: left++, and pop any deque front whose index < left. Record right − left + 1.',
  ],
  approach: `**Brute force:** every subarray, tracking running max/min → O(n²).

**Variable window + two deques (O(n)):** expand \`right\`; update both deques (pop from the back values that can no longer be the max/min). While the window is invalid, move \`left\` forward and drop deque fronts that fell out of the window. After repair, the window is valid → record its length. Each index enters and leaves each deque at most once.

(A sorted multiset / two heaps with lazy deletion also works in O(n log n).)`,

  functionName: 'longestSubarray',
  paramNames: ['nums', 'limit'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} limit
 * @return {number}
 */
function longestSubarray(nums, limit) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[2,4] or [4,7] — any longer window has max − min above 4.', args: [[8, 2, 4, 7], 4], expected: 2 },
    { scenario: 'Example 2', hint: '[2,4,7,2]: the window max is 7 and the min is 2 — you need both, not just one.', args: [[10, 1, 2, 4, 7, 2], 5], expected: 4 },
    { scenario: 'Example 3', hint: 'limit = 0 means all elements in the window must be equal.', args: [[4, 2, 2, 2, 4, 4, 2, 2], 0], expected: 3 },
    { scenario: 'Single element', hint: 'Smallest input: a single element always qualifies.', args: [[1], 0], expected: 1 },
    { scenario: 'All equal, limit 0', hint: 'The whole array qualifies.', args: [[5, 5, 5, 5], 0], expected: 4 },
    { scenario: 'No pair fits', hint: 'Every adjacent difference exceeds the limit — answer 1.', args: [[1, 5, 9, 13], 3], expected: 1 },
    { scenario: 'Whole array fits', hint: 'A large limit lets the entire array be one window.', args: [[1, 2, 3, 4, 5], 10], expected: 5 },
    { scenario: 'Only max tracked fails', hint: 'Tracking only the max (or only the min) misses violations from the other side.', args: [[2, 2, 2, 4, 4, 2, 5, 5, 5, 5, 5, 2], 2], expected: 6 },
    { scenario: 'Shrink several steps', hint: 'One new element can force the left edge forward many times — use while, not if.', args: [[1, 1, 1, 1, 10, 10], 3], expected: 4 },
    { scenario: 'Expire by index, not value', hint: 'Duplicate values sit at different indices; expiring deque fronts by value removes the wrong entry.', args: [[3, 1, 3, 1, 3, 7, 7], 2], expected: 5 },
    { scenario: 'Huge values and limit', hint: 'Values up to 10^9 with limit 10^9 − 1.', args: [[1, 1000000000, 1, 1000000000], 999999999], expected: 4 },
    { scenario: 'Large all equal (n = 10^5)', hint: 'The answer is the whole array; an O(n²) expand-from-each-start loop does ~5·10^9 steps. Use two monotonic deques.', argsGen: '() => [new Array(100000).fill(7), 0]', expected: 100000, timeLimitMs: 1000 },
    { scenario: 'Large slow drift (n = 10^5)', hint: 'Values drift slowly so windows are tens of thousands long — the window must slide in O(n) total.', argsGen: '() => { let s = 99; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, (_, i) => 500000000 + Math.floor(i / 3) + (r() % 50)), 20000]; }', expected: 59924, timeLimitMs: 1000 },
    { scenario: 'Large random (n = 10^5)', hint: 'Random values at full size with a moderate limit.', argsGen: '() => { let s = 99; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100000 }, () => 1 + (r() % 1000000000)), 900000000]; }', expected: 106 },
  ],
  solution: {
    code: `function longestSubarray(nums, limit) {
  const maxD = new Deque();   // indices, nums decreasing → front is the window max
  const minD = new Deque();   // indices, nums increasing → front is the window min
  let left = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    const x = nums[right];
    while (!maxD.isEmpty() && nums[maxD.back()] < x) maxD.popBack();
    maxD.pushBack(right);
    while (!minD.isEmpty() && nums[minD.back()] > x) minD.popBack();
    minD.pushBack(right);

    while (nums[maxD.front()] - nums[minD.front()] > limit) {
      left++;                                        // shrink
      if (maxD.front() < left) maxD.popFront();      // expired
      if (minD.front() < left) minD.popFront();
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['right', 'x', 'maxD (vals)', 'minD (vals)', 'left', 'best'],
    rows: [
      ['0', '10', '[10]', '[10]', '0', '1'],
      ['1', '1', '[10,1]', '[1]', '1 (10−1 > 5, 10 expires)', '1'],
      ['2', '2', '[2]', '[1,2]', '1', '2'],
      ['3', '4', '[4]', '[1,2,4]', '1', '3'],
      ['4', '7', '[7]', '[1,2,4,7]', '2 (7−1 > 5, 1 expires)', '3'],
      ['5', '2', '[7,2]', '[2,2]', '2', '4'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each index is pushed and popped at most once per deque; left and right each move at most n times.' },
  alternative: {
    title: 'Sorted structure (two heaps with lazy deletion)',
    md: 'Keep a max-heap and min-heap of [value, index]; while invalid, move left and discard heap tops with index < left. O(n log n).',
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Only tracking the max (or min) — the rule needs both.',
    'Expiring deque fronts by value instead of by index.',
    'Using `if` instead of `while` when shrinking.',
  ],
};
