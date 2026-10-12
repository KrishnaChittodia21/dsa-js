export default {
  id: 'burst-balloons',
  title: 'Burst Balloons',
  difficulty: 'Hard',
  order: 4,
  pattern: 'dp-adv-interval',
  tags: ['array', 'dynamic programming', 'interval dp'],
  source: { platform: 'LeetCode', number: 312, url: 'https://leetcode.com/problems/burst-balloons/' },

  statement: `\`nums[i]\` is the number painted on balloon \`i\`. Bursting balloon \`i\` earns \`left · nums[i] · right\` coins, where \`left\` and \`right\` are the numbers on its **current** neighbours (after earlier bursts). A missing neighbour (beyond either end) counts as \`1\`.

Burst every balloon; return the maximum total coins.`,
  examples: [
    { input: 'nums = [3,1,5,8]', output: '167', explanation: 'Burst 1, 5, 3, 8: 3·1·5 + 3·5·8 + 1·3·8 + 1·8·1 = 15 + 120 + 24 + 8 = 167.' },
    { input: 'nums = [1,5]', output: '10' },
  ],
  constraints: ['1 <= nums.length <= 300', '0 <= nums[i] <= 100'],

  think: `- If you choose which balloon to burst FIRST, do the left and right parts stay independent?
- What if you choose which balloon in a range is burst LAST? Who are its neighbours at that moment?
- What boundary values make every range have fixed walls?`,
  patternChallenge: {
    options: ['Greedy: burst the smallest balloon first', 'Interval DP — choose the LAST balloon burst in each range', 'Backtracking over all orders', 'Monotonic stack'],
    answer: 1,
    explanation: 'Greedy fails and backtracking is n!. Choosing the last balloon k inside walls (i, j) fixes its neighbours to a[i] and a[j] and separates the two sides — the defining move of interval DP.',
  },
  hints: [
    'Pad: a = [1, ...nums, 1]. dp[i][j] = best coins from bursting every balloon strictly between i and j (i and j stay).',
    'dp[i][j] = max over i < k < j of dp[i][k] + dp[k][j] + a[i]·a[k]·a[j]. Iterate by j − i.',
  ],
  approach: `**Brute force:** try all n! orders.

**Why "first" fails:** bursting k first makes k−1 and k+1 neighbours — later coins on the left depend on balloons on the right.

**Why "last" works:** if k is the last balloon burst between walls i and j, then k stands between the sides the whole time, so the left side (i, k) and right side (k, j) never interact. When k finally bursts its neighbours are exactly the walls: \`a[i]·a[k]·a[j]\`.

\`dp[i][j] = max_k dp[i][k] + dp[k][j] + a[i]·a[k]·a[j]\`, filled by increasing interval length. Answer \`dp[0][n+1]\`.`,

  functionName: 'maxCoins',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxCoins(nums) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "Bursting order 1, 5, 3, 8 gives 15 + 120 + 24 + 8 = 167.", args: [[3,1,5,8]], expected: 167 },
    { scenario: "Example 2", hint: "Burst 1 first (1·1·5) then 5 (1·5·1) = 10.", args: [[1,5]], expected: 10 },
    { scenario: "Single balloon", hint: "Its neighbours are the two padding 1s — forgetting the padding breaks this case.", args: [[5]], expected: 5 },
    { scenario: "Single zero balloon", hint: "A zero balloon earns nothing.", args: [[0]], expected: 0 },
    { scenario: "All zeros", hint: "Every product contains a 0 — the answer is 0.", args: [[0,0,0]], expected: 0 },
    { scenario: "Zero in the middle", hint: "Burst the 0 first so it never sits next to the big values as a neighbour.", args: [[9,0,9]], expected: 90 },
    { scenario: "Three balloons", hint: "Small enough to check by hand: 2·3·4 + 1·2·4 + 1·4·1 = 36. Choosing the FIRST balloon to burst splits into dependent halves.", args: [[2,3,4]], expected: 36 },
    { scenario: "All equal values", hint: "Ties everywhere — the interval DP still has to try every last-burst k.", args: [[3,3,3,3,3]], expected: 93 },
    { scenario: "Max values", hint: "Values of 100 make products of 10^6; the sum stays well inside safe integers.", args: [[100,100,100,100]], expected: 2010100 },
    { scenario: "Mixed eleven balloons", hint: "Filling dp row by row (instead of by interval length) reads dp[k][j] before it is computed.", args: [[7,9,8,0,7,1,3,5,5,2,3]], expected: 1654 },
    { scenario: "Neighbour bookkeeping", hint: "With closed intervals it is easy to multiply by the wrong neighbours; the last balloon k in (i, j) pairs with a[i] and a[j].", args: [[9,76,64,21]], expected: 116718 },
    { scenario: "Large input (n = 300)", hint: "Trying every burst order is n! — hopeless. The interval DP is O(n³) ≈ 4.5·10^6 steps.", argsGen: "() => { let s = 11; const a = []; for (let i = 0; i < 300; i++) { s = (s * 16807) % 2147483647; a.push(s % 101); } return [a]; }", expected: 100470359, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxCoins(nums) {
  const a = [1, ...nums, 1];                    // walls that are never burst
  const m = a.length;
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));

  for (let len = 2; len < m; len++) {           // len = j − i
    for (let i = 0; i + len < m; i++) {
      const j = i + len;
      let best = 0;
      for (let k = i + 1; k < j; k++) {         // k is the LAST balloon burst in (i, j)
        const coins = dp[i][k] + dp[k][j] + a[i] * a[k] * a[j];
        if (coins > best) best = coins;
      }
      dp[i][j] = best;
    }
  }
  return dp[0][m - 1];
}`,
  },
  dryRun: {
    columns: ['interval (i, j)', 'inside', 'dp'],
    rows: [['(0,2)', '{3}', '3'], ['(1,3)', '{1}', '15'], ['(2,4)', '{5}', '40'], ['(3,5)', '{8}', '40'], ['(1,4)', '{1,5}', '135 (5 last: 15 + 3·5·8)'], ['(0,4)', '{3,1,5}', '159'], ['(0,5)', 'all', '167 (8 last: 159 + 1·8·1)']],
  },
  complexity: { time: 'O(n³)', space: 'O(n²)', explanation: 'O(n²) intervals × O(n) choices of the last balloon; 300³/6 ≈ 4.5·10^6.' },
  alternative: {
    title: 'Top-down memoization',
    md: 'Same recurrence, recursive. Depth ≤ n.',
    code: `function maxCoins(nums) {
  const a = [1, ...nums, 1];
  const m = a.length;
  const memo = Array.from({ length: m }, () => new Array(m).fill(-1));
  function best(i, j) {
    if (j - i < 2) return 0;
    if (memo[i][j] !== -1) return memo[i][j];
    let r = 0;
    for (let k = i + 1; k < j; k++) r = Math.max(r, best(i, k) + best(k, j) + a[i] * a[k] * a[j]);
    return (memo[i][j] = r);
  }
  return best(0, m - 1);
}`,
    complexity: 'O(n³) time, O(n²) space',
  },
  mistakes: [
    'Defining the recurrence on the FIRST balloon burst.',
    'Using closed intervals and multiplying by the wrong neighbours.',
    'Forgetting the padding 1s.',
    'Filling dp row by row so dp[k][j] is not ready.',
  ],
};
