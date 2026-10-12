export default {
  id: 'coin-change',
  title: 'Coin Change',
  difficulty: 'Medium',
  order: 3,
  pattern: 'dp-1d-unbounded-choice',
  tags: ['array', 'dynamic programming', 'bfs'],
  source: { platform: 'LeetCode', number: 322, url: 'https://leetcode.com/problems/coin-change/' },

  statement: `You have coins of denominations \`coins\` and an **unlimited** supply of each. Return the **fewest** number of coins that add up exactly to \`amount\`, or \`-1\` if it cannot be made.`,
  examples: [
    { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '5 + 5 + 1.' },
    { input: 'coins = [2], amount = 3', output: '-1' },
    { input: 'coins = [1], amount = 0', output: '0' },
  ],
  constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],

  think: `- Why is "take the biggest coin that fits" wrong? Try coins [1, 3, 4] and amount 6.
- If the LAST coin you used was c, what is left to solve?
- What value means "impossible" in a minimum-DP?`,
  patternChallenge: {
    options: ['Greedy — largest coin first', '1D DP — Unbounded Choices', 'Backtracking over all combinations', 'Binary Search'],
    answer: 1,
    explanation: 'dp[x] = 1 + min over coins of dp[x − c]. Greedy fails on non-canonical coin systems; backtracking is exponential.',
  },
  hints: [
    'dp[0] = 0; every other cell starts at Infinity.',
    'For each x from 1 to amount and each coin c ≤ x: dp[x] = min(dp[x], dp[x − c] + 1). Return −1 if dp[amount] is still Infinity.',
  ],
  approach: `**Brute force:** recursively try every coin as the next one — exponential, repeating the same remaining amounts.

**DP:** \`dp[x]\` = fewest coins to make x. The last coin is some c, leaving x − c which must itself be made optimally (optimal substructure). So \`dp[x] = min_c dp[x − c] + 1\`, \`dp[0] = 0\`, unreachable = Infinity. Fill x = 1..amount.

It is also a BFS: amounts are nodes, coins are unit-weight edges, and the answer is the shortest path from 0 to amount.`,

  functionName: 'coinChange',
  paramNames: ['coins', 'amount'],
  starterCode: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
function coinChange(coins, amount) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '5 + 5 + 1 = 11 uses 3 coins.', args: [[1, 2, 5], 11], expected: 3 },
    { scenario: 'Example 2', hint: 'Only even sums can be made from 2s — return −1, not Infinity.', args: [[2], 3], expected: -1 },
    { scenario: 'Example 3', hint: 'Amount 0 needs zero coins — dp[0] = 0.', args: [[1], 0], expected: 0 },
    { scenario: 'Greedy picks the wrong coin', hint: 'Largest-coin-first takes 4 + 1 + 1 = 3 coins, but 3 + 3 = 2 coins. Greedy is not safe for arbitrary coin systems.', args: [[1, 3, 4], 6], expected: 2 },
    { scenario: 'Greedy hits a dead end', hint: 'Taking 5 first leaves 1, which cannot be made — yet 2 + 2 + 2 works. Greedy reports −1 here.', args: [[2, 5], 6], expected: 3 },
    { scenario: 'Unsorted coins', hint: 'Coins are not sorted; the DP must not depend on order.', args: [[2, 5, 10, 1], 27], expected: 4 },
    { scenario: 'Odd denominations mix', hint: 'A larger case where no shortcut works — only the full DP finds 20.', args: [[186, 419, 83, 408], 6249], expected: 20 },
    { scenario: 'Coin larger than amount', hint: 'A 2^31 − 1 coin can never be used for amount 2. Guard c ≤ x before indexing dp[x − c].', args: [[2147483647], 2], expected: -1 },
    { scenario: 'Impossible amount', hint: 'Neither 3 nor 7 builds 5. If you return dp[amount] directly you leak Infinity instead of −1.', args: [[3, 7], 5], expected: -1 },
    { scenario: 'Single coin, exact multiple', hint: 'One denomination dividing the amount: amount / coin coins.', args: [[7], 14], expected: 2 },
    { scenario: 'Only 1-coins (amount = 10^4)', hint: 'Needs 10,000 coins. Memoized recursion from amount 10⁴ can blow the JS call stack — prefer the bottom-up loop.', args: [[1], 10000], expected: 10000 },
    { scenario: 'Large amount, many coins', hint: 'Twelve coin types and amount 10⁴: plain recursion explores exponentially many coin sequences. O(amount · k) DP is instant.', args: [[7, 11, 13, 29, 31, 37, 101, 211, 307, 401, 503, 997], 9973], expected: 15, timeLimitMs: 1000 },
    { scenario: 'Large impossible amount', hint: 'Every coin is even and the amount is odd. Without memoization, recursion tries every combination before giving up.', args: [[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24], 999], expected: -1, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity); // Infinity = cannot be made (yet)
  dp[0] = 0;                                       // zero coins make 0
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1; // c as the LAST coin
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
  },
  dryRun: {
    columns: ['x', 'last coin 1', 'last coin 3', 'last coin 4', 'dp[x]'],
    rows: [
      ['1', 'dp[0]+1 = 1', '—', '—', '1'],
      ['2', 'dp[1]+1 = 2', '—', '—', '2'],
      ['3', 'dp[2]+1 = 3', 'dp[0]+1 = 1', '—', '1'],
      ['4', 'dp[3]+1 = 2', 'dp[1]+1 = 2', 'dp[0]+1 = 1', '1'],
      ['5', 'dp[4]+1 = 2', 'dp[2]+1 = 3', 'dp[1]+1 = 2', '2'],
      ['6', 'dp[5]+1 = 3', 'dp[3]+1 = 2', 'dp[2]+1 = 3', '2'],
    ],
    note: 'coins = [1,3,4], amount = 6 → 2 (3 + 3). Greedy would give 3 (4 + 1 + 1).',
  },
  complexity: { time: 'O(amount · k)', space: 'O(amount)', explanation: 'amount + 1 states, k coins tried for each.' },
  alternative: {
    title: 'BFS over amounts',
    md: 'Level = number of coins used. The first time you reach `amount` is the minimum. Same worst case, often faster when the answer is small.',
    code: `function coinChange(coins, amount) {
  if (amount === 0) return 0;
  const seen = new Array(amount + 1).fill(false);
  let frontier = [0], steps = 0;
  seen[0] = true;
  while (frontier.length) {
    steps++;
    const next = [];
    for (const x of frontier) {
      for (const c of coins) {
        const y = x + c;
        if (y === amount) return steps;
        if (y < amount && !seen[y]) { seen[y] = true; next.push(y); }
      }
    }
    frontier = next;
  }
  return -1;
}`,
    complexity: 'O(amount · k) time, O(amount) space',
  },
  mistakes: [
    'Using greedy (largest coin first).',
    'Initialising dp with 0 — then every min stays 0.',
    'Returning Infinity instead of −1.',
    'Memoized recursion from amount 10⁴ can overflow the JS stack — prefer the loop.',
  ],
};
