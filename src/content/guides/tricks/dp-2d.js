export default {
  signals: [
    '"minimum deletions / ASCII delete sum to make two strings equal" → LCS in disguise',
    '"is s3 an interleaving of s1 and s2" → dp over (i, j), position in s3 is i + j',
    '"how many times does t appear as a subsequence of s" → two-sequence counting',
    'two people walking the grid at the same time (cherry pickup) → dp over (step, r1, r2)',
    '"at most m zeros and n ones" → knapsack with two capacities',
    '"smash stones, smallest possible leftover" → subset sum closest to total / 2',
    'knapsack capacity up to 10^9 but values small → swap roles: dp over value',
  ],
  tricks: [
    {
      title: 'Drop a dimension you can compute from the others',
      kind: 'recognition',
      md: 'If one index always equals a formula of the others, it is not part of the state. In interleaving string, the position in s3 is always `i + j`. In cherry pickup with two walkers, `c = step − r` for each walker. Spotting this turns an O(n³) or O(n⁴) table into O(n²) or O(n³), and it is usually the key idea in the problem.',
    },
    {
      title: 'Turn LCS into other answers with formulas',
      kind: 'recognition',
      md: 'Once you have L = LCS(a, b): minimum deletions to make them equal = `a.length + b.length − 2L`, and shortest common supersequence length = `a.length + b.length − L`. Longest palindromic **subsequence** = LCS(s, reverse(s)). "Minimum ASCII delete sum" is the same DP but maximising the character codes kept instead of the count.',
    },
    {
      title: 'One-row LCS: save the diagonal before you overwrite it',
      kind: 'template',
      md: 'With a single row, `row[j]` still holds the value from the row above until you overwrite it, but the diagonal `dp[i-1][j-1]` has already been replaced. Keep it in a `prev` variable: read `row[j]` into `tmp`, compute the new value, then set `prev = tmp`. This is O(n) space and the same speed.',
      code: `function lcs(a, b) {
  const row = new Int32Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;                                      // dp[i-1][j-1]
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[b.length];
}
console.log(lcs('abcde', 'ace')); // 3`,
    },
    {
      title: 'Subset sum with a BigInt bitset',
      kind: 'javascript',
      md: 'Bit s of `bits` means "sum s is reachable". Adding item x is one shift-or: `bits |= bits << BigInt(x)`. JavaScript BigInts have no fixed size, so this works for sums up to a few hundred thousand with no array at all, and each step processes many bits at once. Use it for partition equal subset sum and last-stone-weight II.',
      code: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  let bits = 1n;
  for (const x of nums) bits |= bits << BigInt(x);
  return ((bits >> BigInt(total / 2)) & 1n) === 1n;
}
console.log(canPartition([1, 5, 11, 5]), canPartition([1, 2, 3, 5])); // true false`,
    },
    {
      title: 'Rebuild the string by walking the table backwards',
      kind: 'template',
      md: 'To output the actual LCS or edit script, keep the full table and start at (m, n). If the characters match, take one and move diagonally. Otherwise move toward the larger neighbour. A rolled 1D array cannot do this, so if the question asks for the sequence, say early that you will keep O(m·n) memory.',
      code: `function lcsString(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const out = [];
  for (let i = m, j = n; i > 0 && j > 0; ) {
    if (a[i - 1] === b[j - 1]) { out.push(a[i - 1]); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  return out.reverse().join('');
}
console.log(lcsString('abcde', 'ace')); // ace`,
    },
    {
      title: 'Pad with a sentinel row and column',
      kind: 'template',
      md: 'For minimum path sums, allocate `(R + 1) × (C + 1)` and fill row 0 and column 0 with `Infinity`, except one cell that is 0 so the start has something to build on. Then every cell can use `min(top, left)` with no `if (r > 0)` checks. For counting problems, the padding is 0 with a single 1 at the start. Fewer branches means fewer off-by-one bugs.',
    },
    {
      title: 'Two capacities: both loops go backwards',
      kind: 'template',
      md: '"Ones and zeroes" is 0/1 knapsack where each item uses two resources (zeros, ones). Use a 2D table `dp[z][o]` and loop **both** capacities from high to low for each item. Then each item is still counted at most once, for the same reason as the single-capacity case.',
      code: `function findMaxForm(strs, m, n) {
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (const s of strs) {
    let z = 0; for (const ch of s) if (ch === '0') z++;
    const o = s.length - z;
    for (let i = m; i >= z; i--) for (let j = n; j >= o; j--) dp[i][j] = Math.max(dp[i][j], dp[i - z][j - o] + 1);
  }
  return dp[m][n];
}
console.log(findMaxForm(['10', '0001', '111001', '1', '0'], 5, 3)); // 4`,
    },
    {
      title: 'Typed-array rows: fast, but they overflow silently',
      kind: 'javascript',
      md: '`Array.from({ length: m + 1 }, () => new Int32Array(n + 1))` gives zero-filled rows with no shared-row bug, and they are faster than nested normal arrays. But an `Int32Array` wraps around above 2^31 − 1 without any error. Counting DPs like "distinct subsequences" can grow beyond that, so use `Float64Array` (exact to 2^53) or BigInt there.',
      code: `const row = new Int32Array(1);
row[0] = 2 ** 31;                    // too big for 32 bits
console.log(row[0]);                 // -2147483648
const safe = new Float64Array(1); safe[0] = 2 ** 31;
console.log(safe[0]);                // 2147483648`,
    },
    {
      title: 'Count subsequences with one backwards row',
      kind: 'template',
      md: 'For "how many times does t appear as a subsequence of s", `dp[j]` = number of ways to build `t[0..j)`. For each character of s, loop j **backwards** and add `dp[j-1]` to `dp[j]` when `s[i] === t[j-1]`. The backwards loop stops the same character of s from being used twice, just like in 0/1 knapsack.',
      code: `function numDistinct(s, t) {
  const dp = new Float64Array(t.length + 1); dp[0] = 1;
  for (const ch of s)
    for (let j = t.length; j >= 1; j--) if (ch === t[j - 1]) dp[j] += dp[j - 1];
  return dp[t.length];
}
console.log(numDistinct('rabbbit', 'rabbit')); // 3`,
    },
  ],
  traps: [
    { looksLike: 'Two greedy passes for two walkers (cherry pickup)', actually: 'One joint DP over both walkers', why: 'the best first path can ruin the second; only a joint state sees shared cells' },
    { looksLike: 'Longest common subsequence', actually: 'Longest common substring', why: 'substring must be contiguous: on mismatch the cell resets to 0 and the answer is the max over all cells' },
    { looksLike: '0/1 knapsack over capacity with W = 10^9', actually: 'DP over total value → minimum weight', why: 'the table size follows whichever dimension is small' },
    { looksLike: 'Grid DP with moves in all four directions', actually: 'BFS / Dijkstra', why: 'cyclic dependencies mean there is no valid fill order' },
  ],
  sources: [
    { label: 'CP-Algorithms — Knapsack problem', url: 'https://cp-algorithms.com/dynamic_programming/knapsack.html' },
    { label: 'Tech Interview Handbook — Dynamic programming', url: 'https://www.techinterviewhandbook.org/algorithms/dynamic-programming/' },
  ],
};
