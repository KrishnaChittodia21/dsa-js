export default {
  id: 'minimum-cost-to-cut-a-stick',
  title: 'Minimum Cost to Cut a Stick',
  difficulty: 'Hard',
  order: 3,
  pattern: 'dp-adv-interval',
  tags: ['array', 'dynamic programming', 'interval dp', 'sorting'],
  source: { platform: 'LeetCode', number: 1547, url: 'https://leetcode.com/problems/minimum-cost-to-cut-a-stick/' },

  statement: `A wooden stick of length \`n\` is marked at positions \`0 … n\`. You must cut it at every position listed in \`cuts\`, in any order you like.

Each cut costs the **current length of the piece being cut**. Return the minimum total cost.`,
  examples: [
    { input: 'n = 7, cuts = [1,3,4,5]', output: '16', explanation: 'Order [3,5,1,4]: 7 + 4 + 3 + 2 = 16. The order [1,3,4,5] would cost 20.' },
    { input: 'n = 9, cuts = [5,6,1,4,2]', output: '22' },
  ],
  constraints: ['2 <= n <= 10^6', '1 <= cuts.length <= min(n − 1, 100)', '1 <= cuts[i] <= n − 1', 'All cuts are distinct'],

  think: `- Once you make a cut, are the two pieces independent?
- Which positions define a piece? Do you need all n positions or only the cut positions?
- For the piece between two walls, which choice do you try: the first cut or the last cut?`,
  patternChallenge: {
    options: ['Greedy: always cut closest to the middle', 'Interval DP over sorted cut positions', 'Huffman-style heap merging', 'Binary search'],
    answer: 1,
    explanation: 'Greedy middle cuts are not always optimal. Pieces are defined by pairs of cut positions (plus 0 and n); the first cut inside a piece splits it into two independent pieces → dp over intervals of the sorted cuts. Huffman works only when any two pieces may be merged, not just neighbours.',
  },
  hints: [
    'Sort cuts and add the walls: pos = [0, ...sorted cuts, n]. dp[i][j] = min cost to make every cut strictly between pos[i] and pos[j].',
    'dp[i][j] = (pos[j] − pos[i]) + min over i < k < j of dp[i][k] + dp[k][j]; dp[i][i+1] = 0. Iterate by interval length.',
  ],
  approach: `**Brute force:** try every order of the c cuts → O(c!).

**Interval DP:**
- Walls: \`pos = [0, ...sorted(cuts), n]\`, length m = c + 2.
- \`dp[i][j]\`: cost to perform every cut strictly inside (pos[i], pos[j]).
- The first cut k inside that piece costs the piece length \`pos[j] − pos[i]\`, then the two halves are independent: \`dp[i][k] + dp[k][j]\`.
- Iterate by \`len = j − i\` from 2 to m − 1. Answer \`dp[0][m − 1]\`.

The DP is over the ≤ 102 positions, not over n (which can be 10^6).`,

  functionName: 'minCost',
  paramNames: ['n', 'cuts'],
  starterCode: `/**
 * @param {number} n
 * @param {number[]} cuts
 * @return {number}
 */
function minCost(n, cuts) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: cutting at 3 first, then 5, 1, 4 costs 16.', args: [7,[1,3,4,5]], expected: 16 },
    { scenario: 'Example 2', hint: 'The statement example with unsorted cuts.', args: [9,[5,6,1,4,2]], expected: 22 },
    { scenario: 'Smallest stick', hint: 'n = 2 with one cut: cost is the whole stick, 2.', args: [2,[1]], expected: 2 },
    { scenario: 'Single cut', hint: 'One cut always costs n. Forgetting to add the walls 0 and n gives 0.', args: [10,[5]], expected: 10 },
    { scenario: 'Balanced cuts', hint: 'Cutting the middle first is best here: 100 + 50 + 50.', args: [100,[50,25,75]], expected: 200 },
    { scenario: 'Cut at every position', hint: 'Every integer point is cut — the classic balanced-split case.', args: [5,[1,2,3,4]], expected: 12 },
    { scenario: 'Huge n, few cuts', hint: 'n = 10^6 but only two cuts. DP over every unit length 0..n is hopeless; work on the sorted cut positions only.', args: [1000000,[1,999999]], expected: 1999999 },
    { scenario: 'Numeric sort needed', hint: 'Default `sort()` puts 10 before 9 and 100 before 20 — use (a, b) => a − b.', args: [120,[100,9,20,10,3]], expected: 257 },
    { scenario: 'Unsorted mixed cuts', hint: 'Cuts given in random order; sort them before building the interval DP.', args: [30,[10,20,3,27,15]], expected: 80 },
    { scenario: 'Cuts clustered at one end', hint: 'All cuts near the left end: the best order is not simply "middle first".', args: [50,[1,2,3,4,5,6]], expected: 66 },
    { scenario: 'Large (100 cuts, n = 10^6)', hint: 'Trying cut orders is factorial. Interval DP over the 102 sorted positions is O(m³) ≈ 10^6. Fill dp by increasing interval length so dp[i][k] and dp[k][j] are ready.', argsGen: "() => { let s = 5; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const set = new Set(); while (set.size < 100) set.add(1 + (rnd() % 999999)); return [1000000, [...set]]; }", expected: 6213552, timeLimitMs: 1000 },
    { scenario: 'Large (100 cuts, n = 101)', hint: 'Every position 1..100 is cut — 100 cuts, the densest possible case.', argsGen: "() => [101, Array.from({ length: 100 }, (_, i) => 100 - i)]", expected: 680, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minCost(n, cuts) {
  const pos = [0, ...[...cuts].sort((a, b) => a - b), n];  // numeric sort!
  const m = pos.length;
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));

  for (let len = 2; len < m; len++) {            // number of gaps between the walls
    for (let i = 0; i + len < m; i++) {
      const j = i + len;
      let best = Infinity;
      for (let k = i + 1; k < j; k++) {          // k = FIRST cut made inside (i, j)
        best = Math.min(best, dp[i][k] + dp[k][j]);
      }
      dp[i][j] = best + (pos[j] - pos[i]);       // that first cut costs the piece length
    }
  }
  return dp[0][m - 1];
}`,
  },
  dryRun: {
    columns: ['interval', 'piece', 'best first cut', 'dp'],
    rows: [['(0,2)', '[0,3] cuts {1}', '1', '3'], ['(1,3)', '[1,4] cuts {3}', '3', '3'], ['(2,4)', '[3,5] cuts {4}', '4', '2'], ['(3,5)', '[4,7] cuts {5}', '5', '3'], ['…', '', '', ''], ['(0,5)', '[0,7] all', '3', '7 + dp(0,2) + dp(2,5) = 7 + 3 + 6 = 16']],
  },
  complexity: { time: 'O(c³)', space: 'O(c²)', explanation: 'c + 2 walls → O(c²) intervals × O(c) split points; c ≤ 100.' },
  alternative: {
    title: 'Top-down memo',
    md: 'cost(i, j) = pos[j] − pos[i] + min_k cost(i, k) + cost(k, j), memoized in a 2D array.',
    code: `function minCost(n, cuts) {
  const pos = [0, ...[...cuts].sort((a, b) => a - b), n];
  const m = pos.length;
  const memo = Array.from({ length: m }, () => new Array(m).fill(-1));
  function cost(i, j) {
    if (j - i < 2) return 0;
    if (memo[i][j] !== -1) return memo[i][j];
    let best = Infinity;
    for (let k = i + 1; k < j; k++) best = Math.min(best, cost(i, k) + cost(k, j));
    return (memo[i][j] = best + pos[j] - pos[i]);
  }
  return cost(0, m - 1);
}`,
    complexity: 'O(c³) time, O(c²) space',
  },
  mistakes: [
    'Default `sort()` on numbers ([10, 2] stays [10, 2]).',
    'DP over every unit length 0..n (10^6 × 10^6).',
    'Forgetting to add the walls 0 and n.',
    'Iterating i, j in plain order so dp[k][j] is not ready.',
  ],
};
