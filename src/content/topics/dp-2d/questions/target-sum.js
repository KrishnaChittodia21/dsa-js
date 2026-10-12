export default {
  id: 'target-sum',
  title: 'Target Sum',
  difficulty: 'Medium',
  order: 8,
  pattern: 'dp-2d-knapsack-01',
  tags: ['array', 'dynamic programming', 'backtracking'],
  source: { platform: 'LeetCode', number: 494, url: 'https://leetcode.com/problems/target-sum/' },

  statement: `You are given an array of non-negative integers \`nums\` and an integer \`target\`. Put either a \`+\` or a \`−\` sign in front of **every** number and add them all up.

Return how many different sign assignments produce exactly \`target\`.`,
  examples: [
    { input: 'nums = [1,1,1,1,1], target = 3', output: '5', explanation: 'Exactly one of the five 1s gets a minus sign: 5 choices.' },
    { input: 'nums = [1], target = 1', output: '1' },
  ],
  constraints: ['1 <= nums.length <= 20', '0 <= nums[i] <= 1000', 'sum(nums) <= 1000', '-1000 <= target <= 1000'],

  think: `- Split the numbers into a plus group P and a minus group N. Write two equations using target and total.
- After solving them, what is the sum of P? Does that turn the problem into something you know?
- What should happen with zeros?`,
  patternChallenge: {
    options: ['Sliding window', 'Unbounded knapsack', 'Two pointers', '0/1 knapsack counting (subset sum after an algebraic transform)'],
    answer: 3,
    explanation: 'Each number is used exactly once with a sign → choose the plus-subset. P − N = target and P + N = total give P = (total + target) / 2: count subsets with that sum. Unbounded would reuse numbers.',
  },
  hints: [
    'P − N = target, P + N = total ⇒ P = (total + target) / 2. If that is not a non-negative integer, answer 0.',
    'Count subsets with sum P: dp[0] = 1; for each x, for s from P down to x: dp[s] += dp[s − x].',
  ],
  approach: `**Brute force:** DFS with two branches per number (+ / −): 2^n = about a million for n = 20 — actually acceptable here, but the DP is the lesson.

**Memo over (index, running sum):** \`ways(i, sum)\` with sum offset by \`total\` — O(n · total).

**Transform to subset sum:** Let P = sum of the plus group, N = sum of the minus group.
\`\`\`text
P − N = target
P + N = total      ⇒ P = (total + target) / 2
\`\`\`
If \`total + target\` is odd, or \`|target| > total\`, return 0. Otherwise count subsets summing to P using the 0/1 counting knapsack (capacity loop backwards). Zeros work automatically: when x = 0 the loop runs at s = 0 … s ≥ 0 once, doing dp[s] += dp[s] → doubling every count (+0 and −0 are two different assignments).`,

  functionName: 'findTargetSumWays',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function findTargetSumWays(nums, target) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: one of the five 1s gets a minus.', args: [[1, 1, 1, 1, 1], 3], expected: 5 },
    { scenario: 'Example 2', hint: 'Single number, +1 → one way.', args: [[1], 1], expected: 1 },
    { scenario: 'Target unreachable', hint: '±1 can never be 2 — return 0.', args: [[1], 2], expected: 0 },
    { scenario: 'Zeros double the count', hint: 'Each 0 can be +0 or −0: 2 × 2 = 4 ways. The counting DP handles this — do not special-case zeros.', args: [[0, 0, 1], 1], expected: 4 },
    { scenario: 'Single zero, target 0', hint: '+0 and −0 are two different expressions.', args: [[0], 0], expected: 2 },
    { scenario: 'Target above the sum', hint: '|target| > sum → 0. Without the range check P becomes larger than the table.', args: [[1, 2, 3], 7], expected: 0 },
    { scenario: 'Odd sum + target', hint: 'sum + target = 3 is odd → 0. Without the parity check P is fractional.', args: [[1, 1, 1], 0], expected: 0 },
    { scenario: 'Target equals −sum', hint: 'All minus signs: exactly 1 way (P = 0). dp[0] must start at 1.', args: [[1, 2, 3], -6], expected: 1 },
    { scenario: 'Target below −sum', hint: 'P would be negative — return 0 instead of indexing dp[-50].', args: [[100], -200], expected: 0 },
    { scenario: 'Balanced target 0', hint: '1 − 2 + 1 and −1 + 2 − 1.', args: [[1, 2, 1], 0], expected: 2 },
    { scenario: 'Each number used once', hint: 'Only one sign pattern works. Iterating the capacity forwards reuses a number and over-counts.', args: [[2, 3, 5, 7, 11, 13], 3], expected: 1 },
    { scenario: 'Twenty ones (max n)', hint: 'Choose 10 pluses out of 20: C(20,10) = 184 756.', args: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0], expected: 184756 },
    { scenario: 'Max sum (1000)', hint: 'Twenty numbers summing to 1000 with a negative target.', args: [[50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 10, 20, 30, 40, 60, 70, 80, 90, 25, 75], -200], expected: 12362 },
  ],

  solution: {
    code: `function findTargetSumWays(nums, target) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > total || (total + target) % 2 !== 0) return 0;
  const P = (total + target) / 2;              // required sum of the "+" group
  const dp = new Array(P + 1).fill(0);         // dp[s] = #subsets with sum s
  dp[0] = 1;                                   // the empty subset
  for (const x of nums) {
    for (let s = P; s >= x; s--) {             // backwards: each number once
      dp[s] += dp[s - x];
    }
  }
  return dp[P];
}`,
    explanation: 'For x = 0 the inner loop runs once at s = 0 and doubles dp[0]; all later sums inherit the doubling. That matches +0 / −0 being distinct choices.',
  },
  dryRun: {
    columns: ['x', 'dp[0..4] (P = 4)'],
    rows: [
      ['start', '[1, 0, 0, 0, 0]'],
      ['1', '[1, 1, 0, 0, 0]'],
      ['1', '[1, 2, 1, 0, 0]'],
      ['1', '[1, 3, 3, 1, 0]'],
      ['1', '[1, 4, 6, 4, 1]'],
      ['1', '[1, 5, 10, 10, 5] → answer 5'],
    ],
  },
  complexity: { time: 'O(n · P)', space: 'O(P)', explanation: 'P ≤ total ≤ 1000, so at most 20 · 1000 updates.' },
  alternative: {
    title: 'Memoised DFS over (index, sum)',
    md: 'Direct translation of the sign choices; the Map key combines index and running sum.',
    code: `function findTargetSumWays(nums, target) {
  const memo = new Map();
  const go = (i, sum) => {
    if (i === nums.length) return sum === target ? 1 : 0;
    const key = i * 4001 + sum + 2000;
    if (memo.has(key)) return memo.get(key);
    const r = go(i + 1, sum + nums[i]) + go(i + 1, sum - nums[i]);
    memo.set(key, r);
    return r;
  };
  return go(0, 0);
}`,
    complexity: 'O(n · total) time and space',
  },
  mistakes: [
    'Missing the parity / range check → fractional or negative P and wrong indexing.',
    'Iterating the capacity forwards (reuses a number).',
    'Special-casing zeros incorrectly — the counting DP already doubles for them.',
    'Initialising dp[0] = 0.',
  ],
};
