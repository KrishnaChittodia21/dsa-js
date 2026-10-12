export default {
  id: 'house-robber',
  title: 'House Robber',
  difficulty: 'Medium',
  order: 1,
  pattern: 'dp-1d-linear-sequence',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 198, url: 'https://leetcode.com/problems/house-robber/' },

  statement: `Houses stand in a row; house \`i\` holds \`nums[i]\` money. If you rob two **adjacent** houses, an alarm goes off.

Return the **maximum** amount you can rob without robbing two neighbours.`,
  examples: [
    { input: 'nums = [1,2,3,1]', output: '4', explanation: 'Rob houses 0 and 2: 1 + 3.' },
    { input: 'nums = [2,7,9,3,1]', output: '12', explanation: 'Rob houses 0, 2 and 4: 2 + 9 + 1.' },
  ],
  constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],

  think: `- For the last house, you either rob it or you do not. What does each choice leave behind?
- Define dp[i] as the best for the first i houses. Which earlier dp values does it need?
- Why does "rob every other house" fail? (Try [2, 1, 1, 2].)`,
  patternChallenge: {
    options: ['Greedy — take the largest houses first', '1D DP — Linear Sequence', 'Sliding Window — Fixed Size', 'Two Pointers'],
    answer: 1,
    explanation: 'Take/skip at each index with a "no adjacent" constraint: dp[i] = max(dp[i−1], dp[i−2] + nums[i−1]). Greedy fails, e.g. [2, 3, 2] greedy takes 3 but 2 + 2 = 4.',
  },
  hints: [
    'Skip house i → best of the first i houses before it; rob house i → nums[i] + best up to i − 2.',
    'Only the last two dp values are needed — keep two variables.',
  ],
  approach: `**Brute force:** \`rob(i) = max(rob(i−1), nums[i] + rob(i−2))\` recursively — O(2ⁿ).

**DP:** \`dp[i]\` = max money from the first i houses. \`dp[0] = 0\`, \`dp[1] = nums[0]\`, \`dp[i] = max(dp[i−1], dp[i−2] + nums[i−1])\`. Answer \`dp[n]\`.

**Space:** roll \`prev2\`, \`prev1\` → O(1).`,

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
    { scenario: 'Example 1', hint: 'Rob houses 0 and 2: 1 + 3 = 4.', args: [[1, 2, 3, 1]], expected: 4 },
    { scenario: 'Example 2', hint: 'Rob houses 0, 2 and 4: 2 + 9 + 1 = 12.', args: [[2, 7, 9, 3, 1]], expected: 12 },
    { scenario: 'Single house', hint: 'With one house, rob it. Make sure your base cases do not read nums[1].', args: [[5]], expected: 5 },
    { scenario: 'Two houses', hint: 'Neighbours — you can only take the larger one.', args: [[2, 9]], expected: 9 },
    { scenario: 'Skip two in a row', hint: 'The best plan skips two consecutive houses (2 + 2). "Sum of even indices vs sum of odd indices" gives 3 here.', args: [[2, 1, 1, 2]], expected: 4 },
    { scenario: 'Both ends of the row', hint: 'In a row (not a circle) the first and last houses are not neighbours.', args: [[2, 3, 2]], expected: 4 },
    { scenario: 'Big prize at the end', hint: 'The last house dominates; the choice before it must leave it robbable.', args: [[1, 3, 1, 3, 100]], expected: 103 },
    { scenario: 'All empty houses', hint: 'Every value is 0 — the answer is 0.', args: [[0, 0, 0]], expected: 0 },
    { scenario: 'All equal values', hint: 'Every second house is best: ceil(n / 2) houses.', args: [[4, 4, 4, 4, 4]], expected: 12 },
    { scenario: 'Zeros everywhere (n = 100)', hint: 'Every best value is 0. A memo check like `if (memo[i])` treats a cached 0 as "not computed" and recurses exponentially — use `memo[i] !== undefined` or a loop.', argsGen: '() => [new Array(100).fill(0)]', expected: 0, timeLimitMs: 1000 },
    { scenario: 'All maximum values (n = 100)', hint: 'Fifty houses of 400 each. Plain recursion without memo is 2^n here.', argsGen: '() => [new Array(100).fill(400)]', expected: 20000, timeLimitMs: 1000 },
    { scenario: 'Random street (n = 100)', hint: 'No simple alternating pattern works on random values — the O(n) DP does.', argsGen: '() => [(() => { let s = 7; return Array.from({ length: 100 }, () => { s = (s * 1664525 + 1013904223) % 4294967296; return Math.floor(s / 256) % 401; }); })()]', expected: 12248, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function rob(nums) {
  let prev2 = 0; // best for the first i-2 houses
  let prev1 = 0; // best for the first i-1 houses
  for (const money of nums) {
    const cur = Math.max(prev1, prev2 + money); // skip this house, or rob it
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
  },
  dryRun: {
    columns: ['house', 'money', 'skip (prev1)', 'rob (prev2 + money)', 'cur'],
    rows: [
      ['0', '2', '0', '2', '2'],
      ['1', '1', '2', '1', '2'],
      ['2', '1', '2', '3', '3'],
      ['3', '2', '3', '4', '4'],
    ],
    note: 'nums = [2,1,1,2] → 4 (houses 0 and 3) — not "every other house".',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass, two variables.' },
  alternative: {
    title: 'Memoized recursion',
    md: 'Direct translation of the recurrence with a cache.',
    code: `function rob(nums) {
  const memo = new Array(nums.length).fill(-1);
  const best = (i) => {
    if (i < 0) return 0;
    if (memo[i] !== -1) return memo[i];
    return (memo[i] = Math.max(best(i - 1), nums[i] + best(i - 2)));
  };
  return best(nums.length - 1);
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Assuming the answer is max(sum of even indices, sum of odd indices) — [2,1,1,2] breaks it.',
    'Memo check `if (memo[i])` — 0 is a valid answer.',
    'Wrong shift order of the rolling variables.',
  ],
};
