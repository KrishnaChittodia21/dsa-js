export default {
  id: 'min-cost-climbing-stairs',
  title: 'Min Cost Climbing Stairs',
  difficulty: 'Easy',
  order: 3,
  pattern: 'dp-1d-linear-sequence',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 746, url: 'https://leetcode.com/problems/min-cost-climbing-stairs/' },

  statement: `\`cost[i]\` is the price of standing on step \`i\`. After paying for a step you may climb **1 or 2** steps. You may start on step \`0\` or step \`1\` for free (you pay when you leave a step).

The "top" is just past the last step (index \`n\`). Return the **minimum total cost** to reach the top.`,
  examples: [
    { input: 'cost = [10,15,20]', output: '15', explanation: 'Start at step 1, pay 15, jump 2 to the top.' },
    { input: 'cost = [1,100,1,1,1,100,1,1,100,1]', output: '6' },
  ],
  constraints: ['2 <= cost.length <= 1000', '0 <= cost[i] <= 999'],

  think: `- Define dp[i] = cheapest way to STAND on position i (not having paid for i yet). What are dp[0] and dp[1]?
- From which positions can you arrive at i, and what did you pay?
- Where is the answer: dp[n − 1], or dp[n]?`,
  patternChallenge: {
    options: ['Greedy — always step to the cheaper next step', 'Dijkstra', '1D DP — Linear Sequence', 'Sliding Window'],
    answer: 2,
    explanation: 'dp[i] = min(dp[i−1] + cost[i−1], dp[i−2] + cost[i−2]). Greedy "cheapest next step" fails (a cheap step may be followed by a very expensive one). Dijkstra works but is overkill for a DAG with edges of length 1 and 2.',
  },
  hints: ['dp[0] = dp[1] = 0 (you may start there for free).', 'dp[i] = min(dp[i−1] + cost[i−1], dp[i−2] + cost[i−2]); answer dp[n].'],
  approach: `**Brute force:** recursively try both moves from each step — exponential.

**DP:** state \`dp[i]\` = minimum paid to arrive at position i. You arrive from i − 1 (paying cost[i−1]) or from i − 2 (paying cost[i−2]). Base: dp[0] = dp[1] = 0. Answer at the top: dp[n]. Only two previous values are needed → O(1) space.`,

  functionName: 'minCostClimbingStairs',
  paramNames: ['cost'],
  starterCode: `/**
 * @param {number[]} cost
 * @return {number}
 */
function minCostClimbingStairs(cost) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Start on step 1, pay 15, jump two steps to the top.', args: [[10, 15, 20]], expected: 15 },
    { scenario: 'Example 2', hint: 'Hop over every 100 by alternating 1- and 2-step moves.', args: [[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]], expected: 6 },
    { scenario: 'Two free steps', hint: 'Both steps cost 0 — the minimum is 0.', args: [[0, 0]], expected: 0 },
    { scenario: 'Two steps, start on cheaper', hint: 'You may start on step 0 or 1 — and from either one a single jump reaches the top. If you charge for the start step you are fine, but returning dp[n−1] instead of dp[n] is not.', args: [[5, 3]], expected: 3 },
    { scenario: 'Top is past the last step', hint: 'The top is index n, not the last step. Returning dp[n − 1] (standing on the last step) gives a different answer here.', args: [[0, 1, 2, 2]], expected: 2 },
    { scenario: 'Greedy cheapest next step fails', hint: 'Always stepping to the cheaper of the next two steps walks into the 9. Compare whole paths with DP instead.', args: [[6, 8, 9, 0]], expected: 8 },
    { scenario: 'Increasing costs', hint: 'Skip as many steps as possible: pay 1 + 3 + 5? No — 2 + 4 = 6 is cheaper. Let the DP decide.', args: [[1, 2, 3, 4, 5]], expected: 6 },
    { scenario: 'Free steps in between', hint: 'Land only on the free steps (index 1 and 3).', args: [[999, 0, 999, 0, 999]], expected: 0 },
    { scenario: 'All equal costs', hint: 'With equal costs, the fewest landings wins: about n / 2 of them.', args: [[7, 7, 7, 7, 7, 7, 7]], expected: 21 },
    { scenario: 'All maximum costs (n = 1000)', hint: 'Plain recursion without memo branches twice per step — 2^n calls. A bottom-up loop is O(n).', argsGen: '() => [new Array(1000).fill(999)]', expected: 499500, timeLimitMs: 1000 },
    { scenario: 'Random costs (n = 1000)', hint: 'The full-size case; cache the cost of each step once instead of recomputing it along every path.', argsGen: '() => [(() => { let s = 5; return Array.from({ length: 1000 }, () => { s = (s * 1664525 + 1013904223) % 4294967296; return Math.floor(s / 256) % 1000; }); })()]', expected: 203057, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minCostClimbingStairs(cost) {
  let prev2 = 0; // dp[i-2]: cheapest cost to stand on position i-2
  let prev1 = 0; // dp[i-1]
  for (let i = 2; i <= cost.length; i++) {
    const cur = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;  // dp[n] = the top
}`,
  },
  dryRun: {
    columns: ['i', 'from i−1', 'from i−2', 'dp[i]'],
    rows: [
      ['2', '0 + 15 = 15', '0 + 10 = 10', '10'],
      ['3', '10 + 20 = 30', '0 + 15 = 15', '15'],
    ],
    note: 'cost = [10,15,20] → 15.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass with two rolling values.' },
  alternative: {
    title: 'In-place: cost to leave each step',
    md: 'Let f[i] = cost[i] + min(f[i−1], f[i−2]) = cheapest total having paid for step i. Answer min(f[n−1], f[n−2]).',
    code: `function minCostClimbingStairs(cost) {
  const f = [...cost];
  for (let i = 2; i < f.length; i++) f[i] += Math.min(f[i - 1], f[i - 2]);
  return Math.min(f[f.length - 1], f[f.length - 2]);
}`,
    complexity: 'O(n) time, O(n) space (O(1) if mutating input)',
  },
  mistakes: ['Returning dp[n−1] instead of the top dp[n].', 'Charging for the starting step.', 'Greedy "cheapest next step" instead of DP.'],
};
