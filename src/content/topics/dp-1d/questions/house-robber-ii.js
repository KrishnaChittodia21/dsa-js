export default {
  id: 'house-robber-ii',
  title: 'House Robber II',
  difficulty: 'Medium',
  order: 2,
  pattern: 'dp-1d-linear-sequence',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 213, url: 'https://leetcode.com/problems/house-robber-ii/' },

  statement: `Same as House Robber, but the houses stand in a **circle**: the first and last houses are neighbours too.

Given \`nums\`, return the maximum amount you can rob without robbing two adjacent houses.`,
  examples: [
    { input: 'nums = [2,3,2]', output: '3', explanation: 'Houses 0 and 2 are neighbours, so rob only house 1.' },
    { input: 'nums = [1,2,3,1]', output: '4' },
    { input: 'nums = [1,2,3]', output: '3' },
  ],
  constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 1000'],

  think: `- In any valid plan, can you rob BOTH the first and the last house?
- So every valid plan avoids at least one of them. What two linear problems does that give you?
- What happens when there is only one house?`,
  patternChallenge: {
    options: ['1D DP — Linear Sequence (two passes)', 'Graph cycle detection', 'Greedy — Local Rules', 'Sliding Window'],
    answer: 0,
    explanation: 'Breaking the circle: every plan skips house 0 or house n−1, so answer = max(rob(nums[1..]), rob(nums[..n−2])) with the linear house-robber DP.',
  },
  hints: ['Run the linear house robber on nums without the last house, and on nums without the first house.', 'Special-case n = 1.'],
  approach: `**Brute force:** try all non-adjacent subsets on the circle — exponential.

**DP by case split:** first and last are adjacent, so at least one is not robbed.
- Case A: house n−1 not robbed → linear problem on houses 0..n−2.
- Case B: house 0 not robbed → linear problem on houses 1..n−1.
Every valid circular plan belongs to A or B, and every plan of A or B is valid on the circle. Answer = max(A, B). For n = 1 the two cases are empty, so return nums[0].`,

  functionName: 'rob',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function rob(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Houses 0 and 2 are neighbours in a circle, so you can only take one 2 — or the 3.', args: [[2, 3, 2]], expected: 3 },
    { scenario: 'Example 2', hint: 'Rob houses 0 and 2: 1 + 3 = 4.', args: [[1, 2, 3, 1]], expected: 4 },
    { scenario: 'Example 3', hint: 'All three houses are mutual neighbours, so take the single best one.', args: [[1, 2, 3]], expected: 3 },
    { scenario: 'Single house', hint: 'With n = 1 both "skip first" and "skip last" ranges are empty — return nums[0] explicitly.', args: [[7]], expected: 7 },
    { scenario: 'Two houses', hint: 'Two houses in a circle are neighbours — take the larger.', args: [[1, 5]], expected: 5 },
    { scenario: 'Both ends tempting', hint: 'Running the plain linear DP on the whole array robs both 5s, but they are neighbours in the circle. Solve [0..n−2] and [1..n−1] separately.', args: [[5, 1, 1, 5]], expected: 6 },
    { scenario: 'First house is worth skipping', hint: 'The best set uses houses 0, 2 — and must not also use the last house.', args: [[200, 3, 140, 20, 10]], expected: 340 },
    { scenario: 'Big prize at the end', hint: 'Taking the last house rules out the first one.', args: [[1, 3, 1, 3, 100]], expected: 103 },
    { scenario: 'All empty houses', hint: 'Every value is 0 — the answer is 0.', args: [[0, 0]], expected: 0 },
    { scenario: 'All equal, odd count', hint: 'With 5 equal houses in a circle you can rob only 2 of them (not 3 as in a row).', args: [[4, 4, 4, 4, 4]], expected: 8 },
    { scenario: 'Zeros everywhere (n = 100)', hint: 'A memo check like `if (memo[i])` treats a cached 0 as missing and recurses exponentially.', argsGen: '() => [new Array(100).fill(0)]', expected: 0, timeLimitMs: 1000 },
    { scenario: 'Random circle (n = 100)', hint: 'Plain recursion without memo is 2^n; run the O(n) linear DP twice.', argsGen: '() => [(() => { let s = 11; return Array.from({ length: 100 }, () => { s = (s * 1664525 + 1013904223) % 4294967296; return Math.floor(s / 256) % 1001; }); })()]', expected: 30993, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function rob(nums) {
  const n = nums.length;
  if (n === 1) return nums[0];
  // Linear house robber on nums[lo..hi]
  const line = (lo, hi) => {
    let prev2 = 0, prev1 = 0;
    for (let i = lo; i <= hi; i++) {
      const cur = Math.max(prev1, prev2 + nums[i]);
      prev2 = prev1;
      prev1 = cur;
    }
    return prev1;
  };
  // Skip the last house, or skip the first house.
  return Math.max(line(0, n - 2), line(1, n - 1));
}`,
  },
  dryRun: {
    columns: ['case', 'range', 'best'],
    rows: [
      ['skip last', '[200, 3, 140, 20]', '340 (200 + 140)'],
      ['skip first', '[3, 140, 20, 10]', '150 (140 + 10)'],
    ],
    note: 'Answer max = 340.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Two linear passes.' },
  alternative: {
    title: 'Slice + reuse house robber',
    md: 'Same idea with `slice` for readability (O(n) extra memory).',
    code: `function rob(nums) {
  if (nums.length === 1) return nums[0];
  const line = (arr) => arr.reduce(([p2, p1], x) => [p1, Math.max(p1, p2 + x)], [0, 0])[1];
  return Math.max(line(nums.slice(0, -1)), line(nums.slice(1)));
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Forgetting n = 1 (both ranges are empty → returns 0).', 'Running the linear DP on the whole array (may rob both ends).', 'Trying to track "was the first house robbed?" inside one pass — possible but error-prone.'],
};
