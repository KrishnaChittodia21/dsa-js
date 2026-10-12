export default {
  id: 'find-peak-element',
  title: 'Find Peak Element',
  difficulty: 'Medium',
  order: 5,
  pattern: 'binary-search-peak',
  tags: ['array', 'binary search'],
  source: { platform: 'LeetCode', number: 162, url: 'https://leetcode.com/problems/find-peak-element/' },

  statement: `A **peak** is an element strictly greater than its neighbours. Given an array \`nums\` where adjacent elements are never equal, return the index of **any** peak.

Treat the positions just outside the array as \`-∞\`: \`nums[-1] = nums[n] = -∞\`. The algorithm must be **O(log n)**.`,
  examples: [
    { input: 'nums = [1,2,3,1]', output: '2', explanation: '3 is a peak.' },
    { input: 'nums = [1,2,1,3,5,6,4]', output: '1 or 5', explanation: 'Both 2 (index 1) and 6 (index 5) are peaks.' },
  ],
  constraints: ['1 <= nums.length <= 1000', '-2^31 <= nums[i] <= 2^31 - 1', 'nums[i] !== nums[i + 1]'],

  think: `- The array is not sorted — so what can one comparison at mid tell you?
- If \`nums[mid] < nums[mid + 1]\`, imagine walking right. Why must you eventually hit a peak?`,
  patternChallenge: {
    options: ['Linear scan for a local maximum', 'Sort and take the largest', 'Monotonic stack', 'Binary Search — follow the uphill slope'],
    answer: 3,
    explanation: 'Uphill at mid guarantees a peak on the right (values rise until they fall, or the array ends at −∞). That guarantee is enough to discard half. A scan is O(n); sorting loses indices and is O(n log n).',
  },
  hints: [
    'Compare `nums[mid]` with `nums[mid + 1]` only — never with `nums[mid - 1]`.',
    'Uphill → `lo = mid + 1`; downhill → `hi = mid` (mid may be the peak). Loop while `lo < hi`, return `lo`.',
  ],
  approach: `**Brute force:** return the first i with \`nums[i] > nums[i + 1]\` (or the last index) — O(n). This works because the first "downhill" step is always a peak.

**Optimized:** invariant *"a peak exists in [lo, hi]"*.
- \`nums[mid] < nums[mid + 1]\`: climbing right, a peak exists in \`[mid + 1, hi]\`.
- else: \`nums[mid] > nums[mid + 1]\`: a peak exists in \`[lo, mid]\` (mid itself may be it).
With \`lo < hi\`, \`mid + 1 <= hi\` is always a valid index.`,

  functionName: 'findPeakElement',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findPeakElement(nums) {
  
}
`,
  checker: `(out, args) => {
  const nums = args[0];
  if (!Number.isInteger(out) || out < 0 || out >= nums.length) return false;
  const left = out === 0 ? -Infinity : nums[out - 1];
  const right = out === nums.length - 1 ? -Infinity : nums[out + 1];
  return nums[out] > left && nums[out] > right;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: one peak (3) at index 2.', args: [[1, 2, 3, 1]], expected: 2 },
    { scenario: 'Example 2', hint: 'Two peaks (indices 1 and 5): returning either one is accepted.', args: [[1, 2, 1, 3, 5, 6, 4]], expected: 1 },
    { scenario: 'Single element', hint: 'Both outside neighbours count as -∞, so index 0 is a peak. Do not read nums[1].', args: [[1]], expected: 0 },
    { scenario: 'Two elements, rising', hint: 'The last element is a peak because nums[n] = -∞.', args: [[1, 2]], expected: 1 },
    { scenario: 'Two elements, falling', hint: 'The first element is a peak because nums[-1] = -∞.', args: [[2, 1]], expected: 0 },
    { scenario: 'Strictly increasing', hint: 'The only peak is the last index. With `while (lo <= hi)` you end up reading nums[mid + 1] past the end.', args: [[1, 2, 3, 4, 5]], expected: 4 },
    { scenario: 'Strictly decreasing', hint: 'The only peak is index 0 — every step is downhill, so the range must shrink to the left edge.', args: [[5, 4, 3, 2, 1]], expected: 0 },
    { scenario: 'Valley in the middle', hint: 'Both ends are peaks. You only need one — follow the uphill neighbour, not the global maximum.', args: [[3, 1, 2]], expected: 0 },
    { scenario: 'Zigzag', hint: 'Many local peaks. Compare nums[mid] with one neighbour (nums[mid + 1]); checking both neighbours tends to tangle the edge cases.', args: [[1, 3, 2, 4, 3, 5, 4]], expected: 1 },
    { scenario: 'Extreme 32-bit values', hint: 'Values at -2^31 and 2^31 - 1. Do not use a sentinel like -2^31 as "minus infinity" — it collides with real values.', args: [[-2147483648, 2147483647, -2147483648]], expected: 1 },
    { scenario: 'Lone element at int minimum', hint: 'A single -2^31 is still a peak because the outside is truly -∞. A sentinel of -2^31 with a strict `>` would reject it.', args: [[-2147483648]], expected: 0 },
    { scenario: 'All negative values', hint: 'The peak is -1 at index 2; negative numbers change nothing about the comparisons.', args: [[-3, -2, -1, -5]], expected: 2 },
    { scenario: 'Largest input, mountain', hint: 'n = 1000 rising to a single summit at index 700 — the only peak.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => (i <= 700 ? i : 1400 - i))]', expected: 700 },
    { scenario: 'Largest input, increasing', hint: 'n = 1000 strictly increasing: the answer is index 999 and mid + 1 must never go out of bounds.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => i * 3 - 1500)]', expected: 999 },
  ],

  solution: {
    code: `function findPeakElement(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] < nums[mid + 1]) lo = mid + 1; // uphill → peak on the right
    else hi = mid;                               // downhill → peak at mid or left
  }
  return lo;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'nums[mid] vs nums[mid+1]', 'decision'],
    rows: [
      ['0', '6', '3', '3 < 5 (uphill)', 'lo = 4'],
      ['4', '6', '5', '6 > 4 (downhill)', 'hi = 5'],
      ['4', '5', '4', '5 < 6 (uphill)', 'lo = 5'],
      ['5', '5', '—', '—', 'return 5'],
    ],
  },
  complexity: { time: 'O(log n)', space: 'O(1)', explanation: 'Halves the range every step.' },
  alternative: {
    title: 'First downhill step',
    md: 'Scan for the first i with nums[i] > nums[i + 1]; if none, the last index is a peak.',
    code: `function findPeakElement(nums) {
  for (let i = 0; i < nums.length - 1; i++) if (nums[i] > nums[i + 1]) return i;
  return nums.length - 1;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Looping `while (lo <= hi)` and reading `nums[mid + 1]` past the end.',
    'Trying to find the global maximum — any peak is accepted.',
    'Comparing with both neighbours and getting lost in edge cases; one neighbour is enough.',
  ],
};
