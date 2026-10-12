export default {
  id: 'longest-palindromic-subsequence',
  title: 'Longest Palindromic Subsequence',
  difficulty: 'Medium',
  order: 3,
  pattern: 'dp-adv-palindrome',
  tags: ['string', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 516, url: 'https://leetcode.com/problems/longest-palindromic-subsequence/' },

  statement: `Given a string \`s\`, return the length of its longest **subsequence** that is a palindrome.

Unlike a substring, a subsequence may skip characters (but must keep their order).`,
  examples: [
    { input: 's = "bbbab"', output: '4', explanation: '"bbbb".' },
    { input: 's = "cbbd"', output: '2', explanation: '"bb".' },
  ],
  constraints: ['1 <= s.length <= 1000', 's consists of lowercase English letters'],

  think: `- Look at the two ends s[i] and s[j]. If they are equal, what is the best you can do? If not, which of them can you safely throw away?
- Which sub-range does dp[i][j] depend on, and in what order must you fill the table?
- Is there a connection with Longest Common Subsequence?`,
  patternChallenge: {
    options: ['Expand around center', 'Interval DP on s[i..j] (palindromic DP)', 'Greedy: pair up equal letters', 'Sliding window'],
    answer: 1,
    explanation: 'Skipping characters breaks expand-around-center (which needs contiguity). dp[i][j] over the range with the "match both ends or drop one" transition is the standard solution. Greedy pairing fails on order constraints; windows need contiguity.',
  },
  hints: [
    'dp[i][j] = longest palindromic subsequence of s[i..j]. Base: dp[i][i] = 1.',
    'If s[i] === s[j]: dp[i][j] = dp[i+1][j−1] + 2. Otherwise dp[i][j] = max(dp[i+1][j], dp[i][j−1]). Fill i from n−1 down to 0.',
  ],
  approach: `**Brute force:** all 2^n subsequences, test each → O(n·2^n).

**Interval DP:** \`dp[i][j]\` for the substring s[i..j].
- Equal ends: both can be the outermost pair of the palindrome → \`dp[i+1][j−1] + 2\`.
- Different ends: at least one of them is not used → \`max(dp[i+1][j], dp[i][j−1])\`.

Order: \`dp[i][j]\` reads row i+1, so iterate i from n−1 down; j from i+1 up. Keep only two rows for O(n) memory.

**Equivalent:** LPS(s) = LCS(s, reverse(s)).`,

  functionName: 'longestPalindromeSubseq',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function longestPalindromeSubseq(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: skip the "a" to get "bbbb".', args: ["bbbab"], expected: 4 },
    { scenario: 'Example 2', hint: 'The statement example: "bb" is the longest.', args: ["cbbd"], expected: 2 },
    { scenario: 'Single character', hint: 'One character is a palindrome of length 1.', args: ["a"], expected: 1 },
    { scenario: 'Two different characters', hint: 'No pair matches — the answer is 1, not 0.', args: ["ab"], expected: 1 },
    { scenario: 'All distinct', hint: 'No repeated letters: any single character, length 1.', args: ["abcde"], expected: 1 },
    { scenario: 'Whole string palindrome', hint: 'The full string is already a palindrome.', args: ["racecar"], expected: 7 },
    { scenario: 'Skipping is required', hint: 'Expand-around-center finds only substrings (length 3 here); skipping "g" and "d" gives "abdba"-style length 5.', args: ["agbdba"], expected: 5 },
    { scenario: 'All same letter', hint: 'Every character can be used.', args: ["aaaa"], expected: 4 },
    { scenario: 'Scattered matches', hint: '"character" → "carac" (length 5) skips several letters.', args: ["character"], expected: 5 },
    { scenario: 'Alternating (n = 1000)', hint: '"abab…ab" of length 1000: drop one end to get 999. Fill the table with i going downward so dp[i+1][…] is ready.', args: ["abababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababab"], expected: 999 },
    { scenario: 'Random (n = 1000)', hint: 'Plain recursion without memoisation branches twice per mismatch — exponential. Memoise or fill the O(n²) table.', argsGen: "() => { let s = 3; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); let x = ''; for (let i = 0; i < 1000; i++) x += 'abcdefghijklmnopqrstuvwxyz'[rnd() % 26]; return [x]; }", expected: 329, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function longestPalindromeSubseq(s) {
  const n = s.length;
  let next = new Array(n).fill(0);          // dp[i + 1][*]
  for (let i = n - 1; i >= 0; i--) {
    const cur = new Array(n).fill(0);       // dp[i][*]
    cur[i] = 1;
    for (let j = i + 1; j < n; j++) {
      if (s[i] === s[j]) cur[j] = next[j - 1] + 2;       // dp[i+1][j-1] + 2
      else cur[j] = Math.max(next[j], cur[j - 1]);       // drop s[i] or s[j]
    }
    next = cur;
  }
  return next[n - 1];
}`,
    explanation: 'When j = i + 1 and the characters match, next[j − 1] = dp[i+1][i] = 0 (empty range), giving 2 — correct.',
  },
  dryRun: {
    columns: ['i', 'row dp[i][i..4] for "bbbab"'],
    rows: [['4 (b)', '[1]'], ['3 (a)', '[1, 1]'], ['2 (b)', '[1, 1, 3]'], ['1 (b)', '[1, 2, 2, 3]'], ['0 (b)', '[1, 2, 3, 3, 4]']],
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'n²/2 cells, each O(1); two rows kept at a time.' },
  alternative: {
    title: 'LCS with the reversed string',
    md: 'A palindromic subsequence of s is a common subsequence of s and reverse(s), and vice versa for the longest one.',
    code: `function longestPalindromeSubseq(s) {
  const t = [...s].reverse().join('');
  const n = s.length;
  let prev = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const cur = new Array(n + 1).fill(0);
    for (let j = 1; j <= n; j++) {
      cur[j] = s[i - 1] === t[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Confusing with the substring version (expand-around-center does not work when characters can be skipped).',
    'Iterating i upward so dp[i+1][…] is not computed yet.',
    'Adding 2 when i === j (a single character contributes 1).',
  ],
};
