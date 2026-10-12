export default {
  signals: [
    '"minimum number of non-increasing piles/chains to cover the sequence" → LIS length (Dilworth)',
    '"number of longest increasing subsequences" → O(n²) DP with counts',
    '"partition into k equal-sum subsets" with n ≤ 16 → bitmask DP',
    '"smallest team covering all skills" → bitmask over skills, not people',
    '"answer for every node as the root" → rerooting (two DFS passes)',
    '"strange printer" / "remove boxes" → interval DP with an extra parameter',
    'stocks with k transactions where k ≥ n / 2 → effectively unlimited',
    'n ≈ 40 subsets → split in half (meet in the middle)',
  ],
  tricks: [
    {
      title: 'Enumerate submasks with s = (s − 1) & m',
      kind: 'template',
      md: 'Starting from `s = m`, the step `s = (s - 1) & m` visits every submask of m in decreasing order. Subtracting 1 clears the lowest set bit and sets all bits below it, and the `& m` keeps only bits that are in m. Doing this for every mask costs O(3^n) in total, not 4^n, because each bit is either out of m, in m only, or in both. Handle `s = 0` separately.',
      code: `function submasks(m) {
  const out = [];
  for (let s = m; s > 0; s = (s - 1) & m) out.push(s.toString(2));
  out.push('0');
  return out;
}
console.log(submasks(0b101)); // [ '101', '100', '1', '0' ]`,
    },
    {
      title: 'Rebuild the actual LIS from patience sorting',
      kind: 'template',
      md: 'The `tails` array is not itself a valid subsequence. Store, for each element, the **index** that sits at `tails[len-1]` when the element is placed. That is its predecessor in some best chain. At the end, start from the index at the last tail and follow the predecessors back. The time is still O(n log n).',
      code: `function lisSequence(a) {
  const tailIdx = [], prev = new Array(a.length).fill(-1);
  for (let i = 0; i < a.length; i++) {
    let lo = 0, hi = tailIdx.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (a[tailIdx[mid]] < a[i]) lo = mid + 1; else hi = mid; }
    if (lo > 0) prev[i] = tailIdx[lo - 1];
    tailIdx[lo] = i;
  }
  const seq = [];
  for (let i = tailIdx[tailIdx.length - 1]; i !== -1 && i !== undefined; i = prev[i]) seq.push(a[i]);
  return seq.reverse();
}
console.log(lisSequence([10, 9, 2, 5, 3, 7, 101, 18])); // [ 2, 3, 7, 18 ]`,
    },
    {
      title: 'Non-decreasing LIS: search for the first value strictly greater',
      kind: 'edge-cases',
      md: 'For a strictly increasing LIS you replace the first tail that is **≥ x** (lower bound). If equal values are allowed (non-decreasing), replace the first tail that is **> x** (upper bound). Then an equal value extends the chain instead of replacing a tail. Mixing these up gives an off-by-some answer only on inputs with duplicates, so test `[2, 2, 2]`: the answers should be 1 and 3.',
    },
    {
      title: 'Dilworth: covering by chains = longest antichain',
      kind: 'recognition',
      md: 'The minimum number of non-increasing subsequences needed to cover an array equals the length of its longest **strictly increasing** subsequence. That is why the greedy "put each card on the leftmost pile whose top is ≥ it" uses LIS-many piles. Recognise it in "minimum number of missiles/interceptors", "minimum number of piles", and box-stacking chain problems.',
    },
    {
      title: 'Rerooting: answer for every root in O(n)',
      kind: 'template',
      md: 'Pass 1 (post-order) computes subtree answers from one root. Pass 2 (pre-order) moves the root across each edge and updates in O(1). For "sum of distances", moving the root from u to child v brings `size[v]` nodes one step closer and pushes `n − size[v]` one step farther, so `ans[v] = ans[u] − size[v] + (n − size[v])`. Running a DFS from every node would be O(n²).',
      code: `function sumOfDistances(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const order = [0], par = new Array(n).fill(-1), size = new Array(n).fill(1), ans = new Array(n).fill(0);
  for (let h = 0; h < order.length; h++) for (const v of adj[order[h]]) if (v !== par[order[h]]) { par[v] = order[h]; order.push(v); }
  const depth = new Array(n).fill(0);
  for (const u of order) if (par[u] !== -1) depth[u] = depth[par[u]] + 1;
  for (let i = n - 1; i > 0; i--) size[par[order[i]]] += size[order[i]];
  ans[0] = depth.reduce((a, b) => a + b, 0);
  for (const u of order) if (par[u] !== -1) ans[u] = ans[par[u]] - size[u] + (n - size[u]);
  return ans;
}
console.log(sumOfDistances(6, [[0, 1], [0, 2], [2, 3], [2, 4], [2, 5]])); // [ 8, 12, 6, 10, 10, 10 ]`,
    },
    {
      title: 'Bitmask helpers in JS: popcount and the 31-bit limit',
      kind: 'javascript',
      md: 'JS has no built-in popcount. Use `x &= x - 1` in a loop (one step per set bit), or build a table `pc[m] = pc[m >> 1] + (m & 1)` once for all masks. Bitwise operators work on 32-bit signed integers, so `1 << 31` is negative and `1 << 32` is 1. Bitmask DP is safe for n ≤ 30, and the memory limit stops you well before that anyway (2^20 states is fine, 2^25 × n is not).',
      code: `const n = 4, pc = new Uint8Array(1 << n);
for (let m = 1; m < 1 << n; m++) pc[m] = pc[m >> 1] + (m & 1);
console.log(pc[0b1011], 1 << 31, 1 << 32); // 3 -2147483648 1`,
    },
    {
      title: 'k-equal-subset partition: carry the partial bucket in the mask',
      kind: 'template',
      md: 'You do not need to store which bucket each item went to. Fill buckets one at a time. The used-items mask already tells you the total placed, and `total % target` is how full the current bucket is. So the state is just `mask`, with `dp[mask]` = reachable or not. This is O(2^n · n), compared with O(k^n) for backtracking.',
      code: `function canPartitionK(nums, k) {
  const total = nums.reduce((a, b) => a + b, 0), target = total / k, n = nums.length;
  if (!Number.isInteger(target)) return false;
  const fill = new Int32Array(1 << n).fill(-1); fill[0] = 0;   // -1 = unreachable
  for (let mask = 0; mask < 1 << n; mask++) {
    if (fill[mask] === -1) continue;
    for (let i = 0; i < n; i++)
      if (!(mask & (1 << i)) && fill[mask] + nums[i] <= target)
        fill[mask | (1 << i)] = (fill[mask] + nums[i]) % target;
  }
  return fill[(1 << n) - 1] === 0;
}
console.log(canPartitionK([4, 3, 2, 3, 5, 2, 1], 4), canPartitionK([1, 2, 3, 4], 3)); // true false`,
    },
    {
      title: 'k ≥ n / 2 stock transactions means unlimited',
      kind: 'optimization',
      md: 'A profitable transaction needs a buy day and a later sell day, so at most n / 2 of them are useful. If k ≥ n / 2, skip the O(n·k) table and add up every positive day-to-day increase. This guard matters when k can be as large as 10^9, where allocating `k` states would crash.',
    },
    {
      title: 'Write interval DP top-down first',
      kind: 'interview',
      md: 'A memoized `solve(i, j)` follows the problem statement directly ("choose the last balloon k in (i, j)"), and you don\'t need to work out the loop order. The recursion depth is only O(n), so it won\'t overflow. Once it works, offer the bottom-up version by length. Many interviewers accept the memoized version as the final answer.',
    },
    {
      title: 'Counting LIS needs O(n²) (or a tree), not tails',
      kind: 'edge-cases',
      md: 'The `tails` array forgets how many ways each length can be reached, so binary search can\'t count LIS. Use `len[i]` and `cnt[i]`. When `len[j] + 1 > len[i]`, reset `cnt[i] = cnt[j]`, and when they are equal, add `cnt[j]`. The answer is the sum of `cnt` over every i that reaches the maximum length. To get O(n log n), use a segment tree or BIT over values that stores (length, count) pairs.',
    },
  ],
  traps: [
    { looksLike: 'Strictly increasing LIS', actually: 'Non-decreasing (equal allowed)', why: 'the binary search must switch from lower bound to upper bound, or duplicates are undercounted' },
    { looksLike: 'Bitmask DP with n = 40', actually: 'Meet in the middle', why: '2^40 states is too many; two halves of 2^20 each, sorted and combined with two pointers, fit easily' },
    { looksLike: 'Tree DP rerun from every root', actually: 'Rerooting in two passes', why: 'n DFS runs is O(n²); moving the root across an edge changes the answer in O(1)' },
    { looksLike: 'Interval DP choosing the first balloon', actually: 'Choose the last balloon', why: 'after the first burst, the neighbours change; the last one in (i, j) has fixed neighbours i and j' },
  ],
  sources: [
    { label: 'CP-Algorithms — Longest increasing subsequence', url: 'https://cp-algorithms.com/dynamic_programming/longest_increasing_subsequence.html' },
    { label: 'CP-Algorithms — Enumerating submasks', url: 'https://cp-algorithms.com/algebra/all-submasks.html' },
    { label: 'Tech Interview Handbook — Dynamic programming', url: 'https://www.techinterviewhandbook.org/algorithms/dynamic-programming/' },
  ],
};
