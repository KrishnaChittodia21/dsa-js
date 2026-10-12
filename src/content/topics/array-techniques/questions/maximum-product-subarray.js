export default {
  id: 'maximum-product-subarray',
  title: 'Maximum Product Subarray',
  difficulty: 'Medium',
  order: 2,
  pattern: 'kadane-max-subarray',
  tags: ['array', 'kadane', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 152, url: 'https://leetcode.com/problems/maximum-product-subarray/' },

  statement: `Given an integer array \`nums\`, return the largest **product** of a non-empty contiguous subarray.

The answer fits in a 32-bit integer.`,
  examples: [
    { input: 'nums = [2,3,-2,4]', output: '6', explanation: '[2,3] has product 6.' },
    { input: 'nums = [-2,0,-1]', output: '0', explanation: '[-2,-1] is not contiguous, so the best is 0.' },
  ],
  constraints: ['1 <= nums.length <= 2 * 10^4', '-10 <= nums[i] <= 10', 'Every prefix/suffix product fits in a 32-bit integer'],

  think: `- In the sum version, the best subarray ending at i extends the best ending at i − 1. What goes wrong when nums[i] is negative?
- Which product ending at i − 1 becomes the biggest after multiplying by a negative?
- What does a 0 do to every product that crosses it?`,
  patternChallenge: {
    options: ['Sliding window', "Kadane's algorithm tracking both max and min", 'Prefix sums + hash map', 'Boyer–Moore voting'],
    answer: 1,
    explanation: 'Best contiguous segment with a local extend-or-restart decision → Kadane. Because a negative factor swaps the roles of the largest and smallest products, both must be tracked. Windows cannot shrink predictably with sign flips.',
  },
  hints: [
    'Keep hi = largest product ending here and lo = smallest (most negative) product ending here.',
    'For each x: candidates are x, hi·x, lo·x. New hi = max, new lo = min — compute both from the OLD hi and lo.',
  ],
  approach: `**Brute force:** every start, multiply while extending → O(n²).

**Kadane with two states (O(n), O(1)):** the best product ending at i comes from one of: \`x\` alone (restart), \`hi·x\` (extend the biggest), \`lo·x\` (extend the most negative — which flips to the biggest when x < 0). Track \`hi\` and \`lo\` together; \`best = max(best, hi)\`. Zeros reset both to 0 and the next element restarts naturally.`,

  functionName: 'maxProduct',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxProduct(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[2,3] gives 6; the −2 breaks the run.', args: [[2, 3, -2, 4]], expected: 6 },
    { scenario: 'Example 2', hint: '[-2, -1] is not contiguous; the best is the 0.', args: [[-2, 0, -1]], expected: 0 },
    { scenario: 'Single negative', hint: 'Initialising best with 0 or 1 returns the wrong value for [−2].', args: [[-2]], expected: -2 },
    { scenario: 'Two negatives at the end', hint: 'Only tracking the max misses that −3 × −4 = 12, then × 2 = 24 — keep the min product too.', args: [[2, -3, -4]], expected: 24 },
    { scenario: 'Negative at both ends', hint: 'The whole array: two negatives cancel.', args: [[-2, 3, -4]], expected: 24 },
    { scenario: 'Zero then positive', hint: 'A zero resets the running products.', args: [[0, 2]], expected: 2 },
    { scenario: 'Two minus ones', hint: '−1 × −1 = 1 beats either element alone.', args: [[-1, -1]], expected: 1 },
    { scenario: 'Single negative in middle', hint: 'An odd number of negatives — best is one side of it.', args: [[3, -1, 4]], expected: 4 },
    { scenario: 'Update hi and lo together', hint: 'Assigning hi before computing lo from the old hi corrupts the swap on negatives.', args: [[-2, -3, 7, -2, 0, 5]], expected: 42 },
    { scenario: 'All zeros', hint: 'Every product is 0.', args: [[0, 0, 0]], expected: 0 },
    { scenario: 'Value bounds', hint: 'Values at ±10; three negatives in a row.', args: [[-10, -10, -10, 10]], expected: 1000 },
    { scenario: 'Large ±1 with twos (n = 2·10^4)', hint: 'The O(n²) product over every subarray (~2·10^8) is too slow; track running max and min in one pass.', argsGen: '() => { let s = 5; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const a = Array.from({ length: 20000 }, () => ((r() >> 8) % 2 ? 1 : -1)); for (let i = 0; i < 25; i++) a[(i * 797) % 20000] = (i % 3 ? 2 : -2); return [a]; }', expected: 33554432, timeLimitMs: 150 },
    { scenario: 'Large with zeros (n = 2·10^4)', hint: 'Zeros split the array into segments; the best product lives inside one.', argsGen: '() => [Array.from({ length: 20000 }, (_, i) => (i % 1000 === 999 ? 0 : i % 1000 < 20 ? -2 : 1))]', expected: 1048576, timeLimitMs: 150 },
  ],
  solution: {
    code: `function maxProduct(nums) {
  let hi = nums[0], lo = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    const a = hi * x, b = lo * x;          // use OLD hi and lo
    hi = Math.max(x, a, b);
    lo = Math.min(x, a, b);
    best = Math.max(best, hi);
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['x', 'hi·x', 'lo·x', 'hi', 'lo', 'best'],
    rows: [
      ['2', '—', '—', '2', '2', '2'],
      ['-3', '-6', '-6', '-3', '-6', '2'],
      ['-4', '12', '24', '24', '-4', '24'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Constant work per element.' },
  alternative: {
    title: 'Prefix and suffix products',
    md: 'Without zeros, the best product is a prefix or a suffix (an even number of negatives can be kept whole; with an odd number, drop everything up to the first or after the last negative). Scan left-to-right and right-to-left, resetting the running product to 1 after a zero.',
    code: `function maxProduct(nums) {
  let best = -Infinity, left = 1, right = 1;
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    left = (left === 0 ? 1 : left) * nums[i];
    right = (right === 0 ? 1 : right) * nums[n - 1 - i];
    best = Math.max(best, left, right);
  }
  return best;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Assigning hi before computing lo from the old hi.',
    'Only tracking hi — misses negative × negative.',
    'Initialising best with 0 or 1 — [-2] must return -2.',
  ],
};
