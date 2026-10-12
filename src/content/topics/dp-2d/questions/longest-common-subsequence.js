export default {
  id: 'longest-common-subsequence',
  title: 'Longest Common Subsequence',
  difficulty: 'Medium',
  order: 5,
  pattern: 'dp-2d-two-sequences',
  tags: ['string', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 1143, url: 'https://leetcode.com/problems/longest-common-subsequence/' },

  statement: `Given two strings \`text1\` and \`text2\`, return the length of their **longest common subsequence** — the longest string that is a subsequence of both (characters in order, gaps allowed). Return \`0\` if they share no character.`,
  examples: [
    { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: '"ace".' },
    { input: 'text1 = "abc", text2 = "abc"', output: '3' },
    { input: 'text1 = "abc", text2 = "def"', output: '0' },
  ],
  constraints: ['1 <= text1.length, text2.length <= 1000', 'Only lowercase English letters'],

  think: `- Look at the last characters of both strings. If they are equal, is it safe to match them?
- If they are different, which one can be thrown away?
- What is the LCS of anything with the empty string?`,
  patternChallenge: {
    options: ['Sliding window', 'Two-sequence DP over prefixes', 'Hash set intersection', 'Greedy matching'],
    answer: 1,
    explanation: 'Two strings, order matters, gaps allowed → prefix × prefix DP. Sets ignore order; greedy matching (first common char) can lock you into a short answer; windows need contiguity.',
  },
  hints: [
    'dp[i][j] = LCS of text1[0..i) and text2[0..j). Row 0 and column 0 are 0.',
    'Equal last chars → dp[i−1][j−1] + 1; otherwise max(dp[i−1][j], dp[i][j−1]).',
  ],
  approach: `**Brute force:** enumerate all 2^m subsequences of text1 and check each against text2 — exponential.

**DP:** the last characters either match (take the diagonal + 1) or at least one of them is unused (drop it: max of up and left). Exchange argument: if the last characters are equal, some optimal LCS uses them as its last pair. Table size (m+1)(n+1), filled row by row. Only the previous row is needed → two rolling rows, O(min(m, n)) space if you put the shorter string on the columns.`,

  functionName: 'longestCommonSubsequence',
  paramNames: ['text1', 'text2'],
  starterCode: `/**
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */
function longestCommonSubsequence(text1, text2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: "ace".', args: ["abcde", "ace"], expected: 3 },
    { scenario: 'Example 2', hint: 'Identical strings — the LCS is the whole string.', args: ["abc", "abc"], expected: 3 },
    { scenario: 'Example 3', hint: 'No common letters → 0.', args: ["abc", "def"], expected: 0 },
    { scenario: 'Single equal characters', hint: 'Smallest input with a match.', args: ["a", "a"], expected: 1 },
    { scenario: 'Single different characters', hint: 'Smallest input without a match.', args: ["a", "b"], expected: 0 },
    { scenario: 'Subsequence, not substring', hint: '"abcd" is a subsequence of "abxcd" (gap allowed) → 4. Longest common substring would give 2.', args: ["abxcd", "abcd"], expected: 4 },
    { scenario: 'Reversed pair', hint: 'On a mismatch take max(up, left), not the diagonal — the diagonal version returns 0 here.', args: ["ab", "ba"], expected: 1 },
    { scenario: 'One letter in common', hint: 'Only "b" is shared.', args: ["bsbininm", "jmjkbkjkv"], expected: 1 },
    { scenario: 'Scattered matches', hint: 'Matches are spread out — the answer is 2.', args: ["oxcpqrsvwf", "shmtulqrypy"], expected: 2 },
    { scenario: 'Shorter inside longer', hint: 'Every character of the shorter string can be matched.', args: ["abcba", "abcbcba"], expected: 5 },
    { scenario: 'Different lengths', hint: 'Prefix-length indexing: compare text1[i−1] with text2[j−1].', args: ["ezupkr", "ubmrapg"], expected: 2 },
    { scenario: 'Alternating, max length', hint: '"abab…" vs "baba…" (1000 each): the LCS drops just one character → 999.', argsGen: '() => [\'ab\'.repeat(500), \'ba\'.repeat(500)]', expected: 999 },
    { scenario: 'Large input (1000 × 1000)', hint: 'Plain recursion branches on every mismatch — exponential. The table is 10^6 cells.', argsGen: '() => { let x = 4; const r = () => (x = x * 48271 % 2147483647); const w = () => Array.from({ length: 1000 }, () => String.fromCharCode(97 + r() % 8)).join(\'\'); return [w(), w()]; }', expected: 508, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function longestCommonSubsequence(text1, text2) {
  const n = text2.length;
  let prev = new Array(n + 1).fill(0);           // row i-1
  for (let i = 1; i <= text1.length; i++) {
    const cur = new Array(n + 1).fill(0);        // row i (cur[0] = 0: empty text2 prefix)
    for (let j = 1; j <= n; j++) {
      cur[j] = text1[i - 1] === text2[j - 1]
        ? prev[j - 1] + 1                          // match: diagonal + 1
        : Math.max(prev[j], cur[j - 1]);           // drop one character
    }
    prev = cur;
  }
  return prev[n];
}`,
  },
  dryRun: {
    columns: ['i (text1[i−1])', 'row over "", a, c, e'],
    rows: [
      ['0', '[0, 0, 0, 0]'],
      ['1 (a)', '[0, 1, 1, 1]'],
      ['2 (b)', '[0, 1, 1, 1]'],
      ['3 (c)', '[0, 1, 2, 2]'],
      ['4 (d)', '[0, 1, 2, 2]'],
      ['5 (e)', '[0, 1, 2, 3]'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(n)', explanation: '(m+1)(n+1) cells, O(1) each; two rows kept.' },
  alternative: {
    title: 'Top-down memo',
    md: 'lcs(i, j) with a memo table. Same O(m·n), but recursion depth up to m + n = 2000 — fine here, risky for bigger inputs.',
    code: `function longestCommonSubsequence(a, b) {
  const memo = Array.from({ length: a.length }, () => new Array(b.length).fill(-1));
  const go = (i, j) => {
    if (i === a.length || j === b.length) return 0;
    if (memo[i][j] !== -1) return memo[i][j];
    return (memo[i][j] = a[i] === b[j] ? 1 + go(i + 1, j + 1) : Math.max(go(i + 1, j), go(i, j + 1)));
  };
  return go(0, 0);
}`,
    complexity: 'O(m·n) time and space',
  },
  mistakes: [
    'Confusing it with longest common SUBSTRING (which resets to 0 on a mismatch).',
    'On a mismatch, taking dp[i−1][j−1] instead of max(up, left).',
    'Off-by-one: comparing text1[i] with text2[j] while dp indices are prefix lengths.',
  ],
};
