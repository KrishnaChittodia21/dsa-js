export default {
  id: 'product-of-array-except-self',
  title: 'Product of Array Except Self',
  difficulty: 'Medium',
  order: 5,
  pattern: 'array-prefix-suffix-products',
  tags: ['array', 'prefix product', 'suffix product'],
  source: { platform: 'LeetCode', number: 238, url: 'https://leetcode.com/problems/product-of-array-except-self/' },

  statement: `Given an integer array \`nums\`, return an array \`answer\` where \`answer[i]\` is the product of **all elements of nums except nums[i]**.

Your algorithm must run in **O(n)** time and must **not use division**. (Every prefix/suffix product fits in a 32-bit integer.)`,
  examples: [
    { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
    { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]', explanation: 'Only index 2 (the zero) has a non-zero answer: (-1)·1·(-3)·3 = 9.' },
  ],
  constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30', 'Prefix and suffix products fit in a 32-bit integer'],

  think: `- Split "everything except i" into two groups. What are they?
- Can each group be computed for all i with one pass?
- Why is dividing the total product by nums[i] dangerous?`,
  patternChallenge: {
    options: ['Sliding Window', 'Prefix & Suffix Passes', 'Hash Map', 'Sort and multiply'],
    answer: 1,
    explanation: '"Except self" + "no division" is the signature of combining a left-to-right pass with a right-to-left pass.',
  },
  hints: ['answer[i] = (product of nums[0..i−1]) × (product of nums[i+1..n−1]).', 'Store the left products in the output array, then sweep from the right with one running variable.'],
  approach: `**Brute force:** for each i multiply all other elements → O(n²).

**Division idea:** total / nums[i] — forbidden, and breaks with zeros (one zero → only that index is non-zero; two zeros → all zeros).

**Optimized:** forward pass writes \`out[i] = left\` (product of everything before i), then \`left *= nums[i]\`. Backward pass multiplies \`out[i] *= right\` (product of everything after i), then \`right *= nums[i]\`. O(n) time, O(1) extra space besides the output.`,

  functionName: 'productExceptSelf',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function productExceptSelf(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement.', args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
    { scenario: 'Example 2', hint: 'One zero: only the zero position gets a non-zero product. Division-based solutions break here.', args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
    { scenario: 'Two elements', hint: 'Smallest input: each answer is simply the other element.', args: [[2, 3]], expected: [3, 2] },
    { scenario: 'Two zeros', hint: 'With two zeros every product is 0 — dividing the total product by nums[i] fails completely.', args: [[0, 0]], expected: [0, 0] },
    { scenario: 'Zero at the start', hint: 'Using division fails on zeros: total product is 0, but answer[0] is 20.', args: [[0, 4, 5]], expected: [20, 0, 0] },
    { scenario: 'Zero at the end', hint: 'The last position must get the product of everything before it.', args: [[3, 2, 1, 0]], expected: [0, 0, 0, 6] },
    { scenario: 'Two zeros apart', hint: 'Every position still sees at least one zero.', args: [[5, 0, 2, 0]], expected: [0, 0, 0, 0] },
    { scenario: 'All ones', hint: 'Every product is 1.', args: [[1, 1, 1, 1]], expected: [1, 1, 1, 1] },
    { scenario: 'Negative numbers', hint: 'Signs must be handled correctly by the prefix and suffix products.', args: [[-2, -3, 4]], expected: [-12, -8, 6] },
    { scenario: 'Negative times zero', hint: 'JavaScript produces -0 for a negative × 0; the expected answer is 0.', args: [[-3, 0]], expected: [0, -3] },
    { scenario: 'Prefix includes self check', hint: 'If you multiply nums[i] into left before writing out[i], each answer wrongly includes its own element.', args: [[2, 5, 7]], expected: [35, 14, 10] },
    { scenario: 'Zero in the middle', hint: 'Only the zero position gets the product of all other elements (including negatives).', args: [[-1, 2, 0, 3, -4]], expected: [0, 0, 24, 0, 0] },
    { scenario: 'Extreme values', hint: 'Values at the bounds −30 and 30; products stay within 32-bit range.', args: [[30, -30, 30, -30, 1]], expected: [27000, -27000, 27000, -27000, 810000] },
    { scenario: 'Large input (n = 3·10^4)', hint: 'Recomputing each product with an inner loop is O(n²) — too slow. Use a prefix pass and a suffix pass; the single zero makes every other answer 0.', argsGen: '() => [Array.from({ length: 30000 }, (_, i) => (i === 23456 ? 0 : i % 2 ? -1 : 1))]', expectedGen: "() => { const a = new Array(30000).fill(0); a[23456] = 1; return a; }", timeLimitMs: 1000 },
  ],

  solution: {
    code: `function productExceptSelf(nums) {
  const n = nums.length;
  const out = new Array(n);

  let left = 1;                      // product of nums[0..i-1]
  for (let i = 0; i < n; i++) {
    out[i] = left;
    left *= nums[i];
  }

  let right = 1;                     // product of nums[i+1..n-1]
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= right;
    right *= nums[i];
  }
  return out.map((x) => x + 0);      // normalise -0 to 0 (e.g. -3 * 0)
}`,
    explanation: 'In JavaScript, a negative number times 0 is `-0`. It compares equal with `===`, but some graders/serialisers treat it differently, so we normalise it.',
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'out after forward', 'right (before)', 'out final'],
    rows: [['0', '1', '1', '24', '24'], ['1', '2', '1', '12', '12'], ['2', '3', '2', '4', '8'], ['3', '4', '6', '1', '6']],
  },
  complexity: { time: 'O(n)', space: 'O(1) extra', explanation: 'Two passes; the only extra memory besides the output is two numbers.' },
  alternative: {
    title: 'Explicit prefix and suffix arrays',
    md: 'Build `pre[i]` and `suf[i]` arrays, then multiply. Easier to see, O(n) extra space.',
    code: `function productExceptSelf(nums) {
  const n = nums.length, pre = new Array(n).fill(1), suf = new Array(n).fill(1);
  for (let i = 1; i < n; i++) pre[i] = pre[i - 1] * nums[i - 1];
  for (let i = n - 2; i >= 0; i--) suf[i] = suf[i + 1] * nums[i + 1];
  return nums.map((_, i) => pre[i] * suf[i] + 0);
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Using division (fails on zeros and is forbidden)', 'Multiplying nums[i] into `left` before writing out[i]', 'Forgetting that JS produces -0 for negative × 0'],
};
