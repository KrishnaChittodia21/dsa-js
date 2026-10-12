export default {
  signals: [
    '"choose value x and lose x − 1 and x + 1" → bucket by value, then house robber',
    'dp[i] = best of dp[i − k .. i − 1] (a sliding range of previous cells) → monotonic deque',
    '"n-th number whose only prime factors are 2, 3, 5" → several pointers merging sequences',
    'n up to 10^18 with a fixed-size recurrence → matrix power / fast doubling',
    'travel days or events on a calendar with passes of different lengths → DP over days',
    '"count binary strings with no two adjacent 1s" → two-state Fibonacci',
    '"can you reach the last index?" → greedy farthest reach, not DP',
  ],
  tricks: [
    {
      title: 'Bucket by value to turn it into house robber',
      kind: 'recognition',
      md: 'In "delete and earn", taking value x removes x − 1 and x + 1. Collapse the input into `sum[x] = x * count(x)`, and now you are choosing non-adjacent **values**, which is exactly house robber on the `sum` array. The trick is to notice that the "adjacency" is about values, not positions.',
      code: `function deleteAndEarn(nums) {
  const sum = new Array(Math.max(...nums) + 1).fill(0);
  for (const x of nums) sum[x] += x;
  let take = 0, skip = 0;
  for (const s of sum) [take, skip] = [skip + s, Math.max(take, skip)];
  return Math.max(take, skip);
}
console.log(deleteAndEarn([2, 2, 3, 3, 3, 4])); // 9`,
    },
    {
      title: 'Window max over previous dp values → monotonic deque',
      kind: 'optimization',
      md: 'For recurrences like `dp[i] = nums[i] + max(dp[i-k..i-1])` (Jump Game VI, constrained subsequence sum), the inner max makes it O(n·k). Keep a deque of indices whose dp values decrease from front to back. The front is always the best value in the window, and expired indices drop off the front. That makes the whole DP O(n).',
      code: `function maxResult(nums, k) {
  const dp = new Array(nums.length), dq = [0];
  let head = 0; dp[0] = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (dq[head] < i - k) head++;                   // expire
    dp[i] = nums[i] + dp[dq[head]];
    while (dq.length > head && dp[dq[dq.length - 1]] <= dp[i]) dq.pop();
    dq.push(i);
  }
  return dp[nums.length - 1];
}
console.log(maxResult([1, -1, -2, 4, -7, 3], 2)); // 7`,
    },
    {
      title: 'Multiply mod 1e9+7 with BigInt (or split)',
      kind: 'javascript',
      md: 'Sums of two values below 1e9+7 are safe in a JS number, but a **product** can reach about 10^18, far above 2^53 ≈ 9·10^15, so the low digits get silently rounded. Counting DPs that multiply (matrix power, combinations) must do the product in BigInt and convert back. Additions can stay as plain numbers with `% MOD` after each step.',
      code: `const MOD = 1_000_000_007;
const a = 999_999_999, b = 999_999_998;
const wrong = (a * b) % MOD;
const mulmod = (x, y) => Number((BigInt(x) * BigInt(y)) % BigInt(MOD));
console.log(wrong === mulmod(a, b), mulmod(a, b)); // false 72`,
    },
    {
      title: 'Huge n: fast doubling instead of a loop',
      kind: 'optimization',
      md: 'Any fixed-length linear recurrence (Fibonacci, tribonacci, tiling counts) can be written as a k×k matrix raised to the n-th power, which takes O(k³ log n). For Fibonacci, fast doubling is shorter: F(2m) = F(m)·(2F(m+1) − F(m)) and F(2m+1) = F(m)² + F(m+1)². Use BigInt when the exact value is huge.',
      code: `function fib(n) {                       // returns [F(n), F(n+1)] as BigInt
  if (n === 0n) return [0n, 1n];
  const [a, b] = fib(n >> 1n);
  const c = a * (2n * b - a), d = a * a + b * b;
  return n & 1n ? [d, c + d] : [c, d];
}
console.log(fib(90n)[0]); // 2880067194370816120n`,
    },
    {
      title: 'Push forward when the choices are about the future',
      kind: 'template',
      md: 'A "pull" DP reads earlier states: `dp[i] = f(dp[i - c])`. A "push" DP writes to later states: `dp[i + c] = best(dp[i + c], dp[i] + cost)`. Push is more natural when each position offers moves forward (ticket passes, jumps with varying lengths, "from day i you can skip to day j"). Both visit the same edges, so pick the form that matches how the problem is worded.',
      code: `function minTickets(days, costs) {
  const last = days[days.length - 1], travel = new Set(days);
  const dp = new Array(last + 32).fill(Infinity); dp[1] = 0;
  for (let d = 1; d <= last; d++) {
    if (!travel.has(d)) { dp[d + 1] = Math.min(dp[d + 1], dp[d]); continue; }
    [1, 7, 30].forEach((len, i) => { dp[d + len] = Math.min(dp[d + len], dp[d] + costs[i]); });
  }
  return Math.min(...dp.slice(last + 1));
}
console.log(minTickets([1, 4, 6, 7, 8, 20], [2, 7, 15])); // 11`,
    },
    {
      title: 'k pointers for "merge generated sequences"',
      kind: 'template',
      md: 'For ugly numbers (only factors 2, 3, 5), each new number is an earlier number times 2, 3 or 5. Keep one pointer per multiplier, take the minimum of the three candidates, and move **every** pointer whose candidate equals that minimum, so 6 = 2·3 = 3·2 is not added twice. This is O(n), compared with O(n log n) for a heap and a Set.',
      code: `function nthUgly(n) {
  const u = [1]; let i2 = 0, i3 = 0, i5 = 0;
  while (u.length < n) {
    const next = Math.min(u[i2] * 2, u[i3] * 3, u[i5] * 5);
    u.push(next);
    if (next === u[i2] * 2) i2++;
    if (next === u[i3] * 3) i3++;
    if (next === u[i5] * 5) i5++;
  }
  return u[n - 1];
}
console.log(nthUgly(10)); // 12`,
    },
    {
      title: 'Store the choice so you can rebuild the answer',
      kind: 'template',
      md: 'Interviewers often follow up with "now print the coins/path, not just the count". Next to `dp[i]`, store `choice[i]`, the move that gave the best value. Then walk back from n: `i -= choice[i]`. This only costs an extra O(n) array. A rolling two-variable DP can\'t do this, so mention the trade-off.',
      code: `function coinChangeWithCoins(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity), pick = new Array(amount + 1).fill(-1);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++)
    for (const c of coins) if (c <= a && dp[a - c] + 1 < dp[a]) { dp[a] = dp[a - c] + 1; pick[a] = c; }
  if (dp[amount] === Infinity) return null;
  const used = [];
  for (let a = amount; a > 0; a -= pick[a]) used.push(pick[a]);
  return used;
}
console.log(coinChangeWithCoins([1, 3, 4], 6)); // [ 3, 3 ]`,
    },
    {
      title: 'Test n = 0, 1, 2 before anything else',
      kind: 'edge-cases',
      md: 'Most 1D DP bugs are in the base cases: `dp[1] = ...` writes outside an array of length 1 when n = 0, or `dp[2]` reads `nums[1]`, which doesn\'t exist. Run the three smallest inputs by hand and compare. Also check whether "0 ways" and "impossible" should return 0, -1 or `Infinity` mapped to -1.',
    },
    {
      title: 'Use a typed array memo for dense integer states',
      kind: 'javascript',
      md: 'For memoization over 0..n, `new Float64Array(n + 1).fill(-1)` (or `Int32Array` when values fit) is compact and fast. It also avoids two bugs: the `if (memo[i])` truthiness bug (0 is a valid answer) and the slow `Map` lookups. Check with `memo[i] !== -1`, using a sentinel the real answers can never be. Keep a `Map` for sparse or composite keys.',
    },
  ],
  traps: [
    { looksLike: 'Coin change with greedy (largest coin first)', actually: 'DP over amounts', why: 'coins [1, 3, 4], amount 6: greedy uses 4 + 1 + 1 (3 coins) but 3 + 3 uses 2' },
    { looksLike: 'Jump Game I needs DP', actually: 'Greedy farthest reach', why: 'reachability is monotonic — if you can reach i you can reach everything before it — so one O(n) pass is enough' },
    { looksLike: 'House robber on positions', actually: 'House robber on values (delete and earn)', why: 'conflicts are between equal-neighbour values, not neighbouring indices' },
    { looksLike: 'Climbing stairs counting with combinations (order ignored)', actually: 'Ordered counting (amount loop outside)', why: '1+2 and 2+1 are different step sequences' },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Dynamic programming', url: 'https://www.techinterviewhandbook.org/algorithms/dynamic-programming/' },
    { label: 'CP-Algorithms — Knapsack (loop direction)', url: 'https://cp-algorithms.com/dynamic_programming/knapsack.html' },
  ],
};
