export default {
  id: 'edit-distance',
  title: 'Edit Distance',
  difficulty: 'Medium',
  order: 6,
  pattern: 'dp-2d-two-sequences',
  tags: ['string', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 72, url: 'https://leetcode.com/problems/edit-distance/' },

  statement: `Given two strings \`word1\` and \`word2\`, return the minimum number of single-character operations needed to turn \`word1\` into \`word2\`. The allowed operations are:

- **insert** a character,
- **delete** a character,
- **replace** a character with another.

(This number is also called the *Levenshtein distance*.)`,
  examples: [
    { input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse → rorse (replace h) → rose (delete r) → ros (delete e).' },
    { input: 'word1 = "intention", word2 = "execution"', output: '5' },
  ],
  constraints: ['0 <= word1.length, word2.length <= 500', 'Lowercase English letters'],

  think: `- Focus on the last character of each prefix. If they are equal, do you need to pay anything?
- If they differ, each operation leaves a different smaller pair of prefixes. Which?
- How many operations turn a string of length i into the empty string?`,
  patternChallenge: {
    options: ['Two-sequence DP (three transitions)', 'LCS and subtract', 'Greedy left-to-right fixing', 'BFS over all strings'],
    answer: 0,
    explanation: 'Two strings, minimum operations — the prefix × prefix DP with match / replace / delete / insert transitions. "m + n − 2·LCS" only counts insert+delete (no replace). BFS over strings is exponential.',
  },
  hints: [
    'dp[i][j] = edit distance between word1[0..i) and word2[0..j). dp[i][0] = i, dp[0][j] = j.',
    'Equal last chars → dp[i−1][j−1]. Otherwise 1 + min(dp[i−1][j−1] (replace), dp[i−1][j] (delete), dp[i][j−1] (insert)).',
  ],
  approach: `**Brute force:** recursively try all three operations at every mismatch — 3^(m+n).

**DP:** the last characters of the two prefixes are either:
- equal → free, move diagonally: \`dp[i−1][j−1]\`;
- different → pay 1 and choose the cheapest of
  - **replace** word1's last char with word2's: both handled → \`dp[i−1][j−1]\`
  - **delete** word1's last char: \`dp[i−1][j]\`
  - **insert** word2's last char after word1: \`dp[i][j−1]\`.

Base cases: empty → length j needs j inserts; length i → empty needs i deletes.

**Space:** one row plus a variable \`diag\` that remembers the old \`dp[j−1]\` (the up-left cell) before it is overwritten.`,

  functionName: 'minDistance',
  paramNames: ['word1', 'word2'],
  starterCode: `/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
function minDistance(word1, word2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: replace, delete, delete.', args: ["horse", "ros"], expected: 3 },
    { scenario: 'Example 2', hint: 'Five operations — a mix of deletes, replaces and an insert.', args: ["intention", "execution"], expected: 5 },
    { scenario: 'Both empty', hint: 'Nothing to change → 0.', args: ["", ""], expected: 0 },
    { scenario: 'First word empty', hint: 'Insert every character: dp[0][j] = j. Missing base cases gives 0.', args: ["", "abc"], expected: 3 },
    { scenario: 'Second word empty', hint: 'Delete every character: dp[i][0] = i.', args: ["abc", ""], expected: 3 },
    { scenario: 'Identical words', hint: 'Matching characters cost nothing — adding 1 on a match gives a non-zero answer.', args: ["abc", "abc"], expected: 0 },
    { scenario: 'Single replace', hint: 'One replace is cheaper than delete + insert.', args: ["a", "b"], expected: 1 },
    { scenario: 'Nothing in common', hint: 'Three replaces (3), not m + n − 2·LCS = 6 — that formula ignores replace.', args: ["abc", "xyz"], expected: 3 },
    { scenario: 'Insert in the middle', hint: 'One insert lines everything up.', args: ["ac", "abc"], expected: 1 },
    { scenario: 'kitten → sitting', hint: 'Two replaces and one insert.', args: ["kitten", "sitting"], expected: 3 },
    { scenario: 'Long shared suffix', hint: 'Most of the work is deleting a long prefix — the diagonal must be read before it is overwritten in the 1D version.', args: ["zoologicoarchaeologist", "zoogeologist"], expected: 10 },
    { scenario: 'Completely different (500 each)', hint: 'Max length, no shared letters → 500 replaces.', argsGen: '() => [\'a\'.repeat(500), \'b\'.repeat(500)]', expected: 500 },
    { scenario: 'Large input (500 × 500)', hint: 'Plain recursion branches three ways per mismatch — exponential. The table is 250 000 cells.', argsGen: '() => { let x = 3; const r = () => (x = x * 48271 % 2147483647); const w = () => Array.from({ length: 500 }, () => String.fromCharCode(97 + r() % 6)).join(\'\'); return [w(), w()]; }', expected: 317, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;        // row 0: j inserts
  for (let i = 1; i <= m; i++) {
    let diag = dp[0];                            // old dp[i-1][0]
    dp[0] = i;                                   // i deletes
    for (let j = 1; j <= n; j++) {
      const up = dp[j];                          // dp[i-1][j] (not yet overwritten)
      if (word1[i - 1] === word2[j - 1]) dp[j] = diag;
      else dp[j] = 1 + Math.min(diag /* replace */, up /* delete */, dp[j - 1] /* insert */);
      diag = up;                                 // becomes up-left for column j+1
    }
  }
  return dp[n];
}`,
  },
  dryRun: `Full table for \`"horse"\` → \`"ros"\` (rows = prefixes of horse, columns = "", r, o, s):

| | "" | r | o | s |
|---|---|---|---|---|
| "" | 0 | 1 | 2 | 3 |
| h | 1 | 1 | 2 | 3 |
| o | 2 | 2 | 1 | 2 |
| r | 3 | 2 | 2 | 2 |
| s | 4 | 3 | 3 | 2 |
| e | 5 | 4 | 4 | **3** |

\`dp[2][2]\` ("ho" vs "ro") = 1: last chars o = o → diagonal \`dp[1][1]\` = 1 (replace h with r).`,
  complexity: { time: 'O(m·n)', space: 'O(n)', explanation: 'Every (i, j) pair once; a single row plus one saved diagonal value.' },
  alternative: {
    title: 'Full 2D table',
    md: 'Easier to write and to reconstruct the actual edit script by walking back from dp[m][n].',
    code: `function minDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}`,
    complexity: 'O(m·n) time and space',
  },
  mistakes: [
    'Adding 1 even when the last characters match.',
    'Forgetting base cases dp[i][0] = i and dp[0][j] = j.',
    'In the 1D version, reading dp[j − 1] as the diagonal after it has been overwritten.',
    'Assuming m + n − 2·LCS — that ignores replace.',
  ],
};
