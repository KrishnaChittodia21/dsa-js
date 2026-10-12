export default {
  id: 'distinct-subsequences',
  title: 'Distinct Subsequences',
  difficulty: 'Hard',
  order: 1,
  pattern: 'dp-2d-two-sequences',
  tags: ['string', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 115, url: 'https://leetcode.com/problems/distinct-subsequences/' },

  statement: `Given strings \`s\` and \`t\`, count how many **different ways** you can delete characters from \`s\` so that what remains is exactly \`t\`. Two ways are different if they keep a different set of positions of \`s\`.

In other words: the number of distinct subsequences of \`s\` (by position) that equal \`t\`.`,
  examples: [
    { input: 's = "rabbbit", t = "rabbit"', output: '3', explanation: 'Any one of the three b\'s can be the one that is deleted.' },
    { input: 's = "babgbag", t = "bag"', output: '5' },
  ],
  constraints: ['1 <= s.length, t.length <= 1000', 'English letters', 'The answer fits in a 32-bit signed integer'],

  think: `- Look at the last character of the current prefix of s. What are the two things you can do with it?
- When is "use it" allowed?
- How many ways does the empty t appear in any s?`,
  patternChallenge: {
    options: ['Sliding window', 'Two-sequence counting DP', 'Backtracking over all subsequences', 'Hash map of character counts'],
    answer: 1,
    explanation: 'Two strings, subsequence, count ways → prefix × prefix counting DP. Backtracking enumerates up to 2^1000 subsequences; counts ignore order.',
  },
  hints: [
    'dp[i][j] = ways to form t[0..j) from s[0..i). dp[i][0] = 1 (delete everything), dp[0][j>0] = 0.',
    'dp[i][j] = dp[i−1][j] (skip s[i−1]) + (s[i−1] === t[j−1] ? dp[i−1][j−1] : 0). In 1D, iterate j backwards.',
  ],
  approach: `**Brute force:** generate every subsequence of s of length |t| — exponential.

**DP:** for the last character of \`s[0..i)\`:
- **skip it** → all ways that form \`t[0..j)\` from \`s[0..i−1)\`: \`dp[i−1][j]\`;
- **use it** as the last character of t — allowed only if \`s[i−1] === t[j−1]\` → \`dp[i−1][j−1]\`.

These two sets of ways are disjoint (position i−1 is used or not), so we add. Base: \`dp[i][0] = 1\`.

**1D:** row i reads row i−1 at columns j and j−1. Iterate j **backwards** so \`dp[j−1]\` is still the old row — the same trick as 0/1 knapsack, for the same reason (each character of s used at most once).`,

  functionName: 'numDistinct',
  paramNames: ['s', 't'],
  starterCode: `/**
 * @param {string} s
 * @param {string} t
 * @return {number}
 */
function numDistinct(s, t) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: three different b’s can be dropped.', args: ["rabbbit", "rabbit"], expected: 3 },
    { scenario: 'Example 2', hint: 'Five position-sets spell "bag" — overlapping choices are all counted.', args: ["babgbag", "bag"], expected: 5 },
    { scenario: 'Single matching character', hint: 'One character equal to t → exactly 1 way. If dp[·][0] (empty target) is 0, everything stays 0.', args: ["a", "a"], expected: 1 },
    { scenario: 'No match at all', hint: 'The letter never appears in s → 0 ways.', args: ["a", "b"], expected: 0 },
    { scenario: 't longer than s', hint: 'A longer target can never be formed → 0.', args: ["abc", "abcd"], expected: 0 },
    { scenario: 'Identical strings', hint: 's equals t → exactly one way (use every character).', args: ["abc", "abc"], expected: 1 },
    { scenario: 'Same string, many positions', hint: '"a" can be picked at any of 3 positions → 3. Counting distinct strings instead of position sets gives 1.', args: ["aaa", "a"], expected: 3 },
    { scenario: 'Choose 2 of 4 equal letters', hint: 'C(4,2) = 6 ways — each pair of positions counts separately.', args: ["aaaa", "aa"], expected: 6 },
    { scenario: 'Repeated letter in t', hint: 'Only one "a" in s can match, so "aa" cannot be formed → 0. Iterating j forwards in the 1D version reuses that "a" twice.', args: ["xa", "aa"], expected: 0 },
    { scenario: 'Case sensitive letters', hint: '"A" and "a" are different characters.', args: ["AaAa", "Aa"], expected: 3 },
    { scenario: 'Interleaved repeats', hint: 'Several "abc" chains share letters — the DP must add the skip and use branches.', args: ["abcabc", "abc"], expected: 4 },
    { scenario: 'Large input (|s| = 1000)', hint: 'Brute-force recursion that tries skip/use for every character of s is exponential; the (i, j) table is O(|s| · |t|).', argsGen: '() => { let x = 11; const r = () => (x = x * 48271 % 2147483647); const A = \'abcdefghijklmnopqrstuvwxyz\'; let s = \'\'; for (let i = 0; i < 1000; i++) s += A[r() % 26]; let t = \'\'; for (let i = 0; i < 10; i++) t += A[r() % 26]; return [s, t]; }', expected: 544001791, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function numDistinct(s, t) {
  const n = t.length;
  if (n > s.length) return 0;
  const dp = new Array(n + 1).fill(0);   // dp[j] = ways to form t[0..j) from the s-prefix so far
  dp[0] = 1;                             // empty t: one way
  for (let i = 0; i < s.length; i++) {
    for (let j = n; j >= 1; j--) {       // backwards: dp[j-1] is still the previous row
      if (s[i] === t[j - 1]) dp[j] += dp[j - 1];
    }
  }
  return dp[n];
}`,
    explanation: 'The "skip" term is implicit: dp[j] keeps its old value; the "use" term adds dp[j − 1] on a match.',
  },
  dryRun: {
    columns: ['s[i]', 'dp over "", b, a, g'],
    rows: [
      ['start', '[1, 0, 0, 0]'],
      ['b', '[1, 1, 0, 0]'],
      ['a', '[1, 1, 1, 0]'],
      ['b', '[1, 2, 1, 0]'],
      ['g', '[1, 2, 1, 1]'],
      ['b', '[1, 3, 1, 1]'],
      ['a', '[1, 3, 4, 1]'],
      ['g', '[1, 3, 4, 5] → 5'],
    ],
  },
  complexity: { time: 'O(|s|·|t|)', space: 'O(|t|)', explanation: 'Each (i, j) once; one row.' },
  alternative: {
    title: 'Top-down memo',
    md: 'ways(i, j) = ways(i+1, j) + (s[i] === t[j] ? ways(i+1, j+1) : 0), with ways(_, |t|) = 1. Also prune when the remaining s is shorter than the remaining t.',
    complexity: 'O(|s|·|t|) time and space',
  },
  mistakes: [
    'Iterating j forwards in the 1D version — one character of s gets used twice.',
    'dp[0] = 0 — the empty target must count as one way.',
    'Counting distinct *strings* instead of distinct position sets.',
    'For adversarial inputs intermediate counts can exceed 2^53; the constraints guarantee the final answer fits, but in general consider BigInt or a modulus.',
  ],
};
