export default {
  id: 'coin-change-ii',
  title: 'Coin Change II',
  difficulty: 'Medium',
  order: 9,
  pattern: 'dp-2d-knapsack-unbounded',
  tags: ['array', 'dynamic programming', 'knapsack'],
  source: { platform: 'LeetCode', number: 518, url: 'https://leetcode.com/problems/coin-change-ii/' },

  statement: `You have unlimited coins of each denomination in \`coins\` (all distinct). Return the number of **combinations** that add up to \`amount\` — the order of coins does not matter, so \`1+2\` and \`2+1\` are the same combination.

If the amount cannot be made, return 0. (Making amount 0 has exactly one combination: use no coins.)`,
  examples: [
    { input: 'amount = 5, coins = [1,2,5]', output: '4', explanation: '5, 2+2+1, 2+1+1+1, 1+1+1+1+1.' },
    { input: 'amount = 3, coins = [2]', output: '0' },
    { input: 'amount = 10, coins = [10]', output: '1' },
  ],
  constraints: ['1 <= coins.length <= 300', '1 <= coins[i] <= 5000, all distinct', '0 <= amount <= 5000', 'The answer fits in a 32-bit signed integer'],

  think: `- Coin Change (DP 1D) minimised coins. Here we count — does the loop order now matter?
- Compare with Combination Sum IV, which counts (1,2) and (2,1) separately. What is different about its loops?
- Each coin can be reused: should the amount loop go forwards or backwards?`,
  patternChallenge: {
    options: ['0/1 knapsack counting', 'Unbounded knapsack, coins outer (combinations)', 'Unbounded knapsack, amount outer (permutations)', 'Greedy largest coin first'],
    answer: 1,
    explanation: 'Unlimited coins → unbounded (forward amount loop). Order does not matter → coins outer, so each multiset is built in one fixed coin order. Amount outer would count permutations (that is Combination Sum IV).',
  },
  hints: [
    'dp[a] = number of combinations making a using the coins processed so far; dp[0] = 1.',
    'for (coin of coins) for (a = coin; a <= amount; a++) dp[a] += dp[a − coin].',
  ],
  approach: `**Brute force:** recursion over (coin index, remaining amount), branching "use this coin again" or "move to the next coin" — exponential without memo.

**2D DP:** \`dp[i][a]\` = combinations for amount a using the first i coins = \`dp[i−1][a]\` (never use coin i) + \`dp[i][a − coin_i]\` (use it at least once more — same row, so it may be used again).

**1D:** process coins one at a time (outer loop), amounts increasing (inner loop). Increasing = "same row" → reuse allowed. Coins outer = each combination is counted in exactly one coin order.

**Contrast with Combination Sum IV (DP 1D):** amount outer, coins inner — each amount tries every coin as the *last* coin, so every ordering is counted.`,

  functionName: 'change',
  paramNames: ['amount', 'coins'],
  starterCode: `/**
 * @param {number} amount
 * @param {number[]} coins
 * @return {number}
 */
function change(amount, coins) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: 5 = 5 = 2+2+1 = 2+1+1+1 = 1+1+1+1+1.', args: [5, [1, 2, 5]], expected: 4 },
    { scenario: 'Example 2', hint: 'Only coin 2 cannot form an odd amount — the answer is 0, not −1.', args: [3, [2]], expected: 0 },
    { scenario: 'Example 3', hint: 'A single coin equal to the amount is exactly one combination.', args: [10, [10]], expected: 1 },
    { scenario: 'Amount zero', hint: 'There is exactly one way to make 0 (use nothing). If dp[0] starts at 0, nothing is ever counted.', args: [0, [7]], expected: 1 },
    { scenario: 'Order must not matter', hint: 'With coins [1,2], 3 = 1+1+1 = 1+2 → 2 ways. Looping amount outer / coins inner counts 1+2 and 2+1 separately (3).', args: [3, [1, 2]], expected: 2 },
    { scenario: 'Permutations vs combinations', hint: 'Amount-outer loops count orderings: they return 7 here instead of 4.', args: [4, [1, 2, 3]], expected: 4 },
    { scenario: 'Same coin used many times', hint: 'Coins are unlimited — 10 = 5+5 needs coin 5 twice. Iterating amounts backwards uses each coin at most once.', args: [10, [1, 5]], expected: 3 },
    { scenario: 'All coins too large', hint: 'No coin fits, so the only reachable amount is 0 — return 0.', args: [3, [5, 10]], expected: 0 },
    { scenario: 'Unsorted coins', hint: 'The coin order in the input must not change the count.', args: [11, [5, 2, 1]], expected: 11 },
    { scenario: 'Many ways (US coins)', hint: 'Classic: 292 ways to make change for a dollar.', args: [100, [1, 5, 10, 25, 50]], expected: 292 },
    { scenario: 'Single coin = max amount', hint: 'Coin and amount at their maximum (5000) — still exactly one way.', args: [5000, [5000]], expected: 1 },
    { scenario: 'Mixed coins, larger amount', hint: 'Counts reach the tens of millions — a plain recursion over (coin, remaining) repeats the same sub-problems.', args: [500, [3, 5, 7, 8, 9, 10, 11]], expected: 35502874 },
    { scenario: 'Large input (300 coins, 5000)', hint: 'Un-memoized recursion over (coin index, remaining amount) is exponential here; the 1D table is O(coins · amount).', argsGen: '() => { let x = 7; const r = () => (x = x * 48271 % 2147483647); const s = new Set(); while (s.size < 300) s.add(300 + r() % 4701); return [5000, [...s]]; }', expected: 1793938, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function change(amount, coins) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;                                  // one way to make 0: take nothing
  for (const coin of coins) {                 // coins OUTER → combinations
    for (let a = coin; a <= amount; a++) {    // forwards → coin can be reused
      dp[a] += dp[a - coin];
    }
  }
  return dp[amount];
}`,
  },
  dryRun: {
    columns: ['coin', 'dp[0..5]'],
    rows: [
      ['start', '[1, 0, 0, 0, 0, 0]'],
      ['1', '[1, 1, 1, 1, 1, 1]'],
      ['2', '[1, 1, 2, 2, 3, 3]'],
      ['5', '[1, 1, 2, 2, 3, 4]'],
    ],
  },
  complexity: { time: 'O(coins · amount)', space: 'O(amount)', explanation: 'At most 300 × 5000 = 1.5M updates.' },
  alternative: {
    title: '2D table',
    md: 'dp[i][a] with rows for "first i coins" — same recurrence, easier to explain, more memory.',
    code: `function change(amount, coins) {
  const n = coins.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = 1;
  for (let i = 1; i <= n; i++)
    for (let a = 1; a <= amount; a++)
      dp[i][a] = dp[i - 1][a] + (a >= coins[i - 1] ? dp[i][a - coins[i - 1]] : 0);
  return dp[n][amount];
}`,
    complexity: 'O(coins · amount) time and space',
  },
  mistakes: [
    'Amount outer / coins inner — counts permutations (9 instead of 4 for amount 5, coins [1,2,5]).',
    'Iterating amount backwards — each coin at most once.',
    'dp[0] = 0 — then nothing is ever counted.',
  ],
};
