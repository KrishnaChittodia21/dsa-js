export default {
  id: 'regular-expression-matching',
  title: 'Regular Expression Matching',
  difficulty: 'Hard',
  order: 3,
  pattern: 'dp-2d-two-sequences',
  tags: ['string', 'dynamic programming', 'recursion'],
  source: { platform: 'LeetCode', number: 10, url: 'https://leetcode.com/problems/regular-expression-matching/' },

  statement: `Implement a matcher for a tiny regular-expression language. The pattern \`p\` may contain:

- lowercase letters, which match themselves;
- \`.\`, which matches **any single** character;
- \`*\`, which means **zero or more copies of the element right before it** (it always follows a letter or a \`.\`).

Return \`true\` only if the pattern matches the **entire** string \`s\` (not just a part of it).`,
  examples: [
    { input: 's = "aa", p = "a"', output: 'false', explanation: '"a" covers only one character.' },
    { input: 's = "aa", p = "a*"', output: 'true', explanation: '"a*" = two copies of a.' },
    { input: 's = "ab", p = ".*"', output: 'true', explanation: '".*" = any number of any characters.' },
  ],
  constraints: ['1 <= s.length <= 20', '1 <= p.length <= 20', 's has lowercase letters only; p has lowercase letters, "." and "*"', 'Every "*" has a valid preceding character'],

  think: `- "x*" is a single unit. What are the only two things it can do at any moment?
- If you drop the unit entirely, which pattern index do you jump to?
- If it eats one character of s, why does the pattern index NOT move?
- Can the empty string match a non-empty pattern?`,
  patternChallenge: {
    options: ['Greedy left-to-right matching', 'Two-sequence boolean DP over prefixes', 'Sliding window', 'Stack'],
    answer: 1,
    explanation: 'Whether "a*" should eat 0, 1 or 5 characters depends on the rest — greedy fails (s = "aaa", p = "a*a"). Each decision leaves a smaller (prefix of s, prefix of p) pair → boolean 2D DP.',
  },
  hints: [
    'dp[i][j] = does s[0..i) match p[0..j)? dp[0][0] = true; dp[0][j] = true only when p[0..j) is made of "x*" pairs.',
    'If p[j−1] is "*": dp[i][j] = dp[i][j−2] (zero copies) || (matches(s[i−1], p[j−2]) && dp[i−1][j]) (one more copy). Otherwise: matches(s[i−1], p[j−1]) && dp[i−1][j−1].',
  ],
  approach: `**Brute force recursion:** match(i, j): if p[j+1] is "*", try skipping "x*" or (if s[i] matches x) consuming s[i] and staying on j. Without memo it is exponential on inputs like s = "aaaaaaaaaaaaaaaaaaab", p = "a*a*a*a*a*c".

**DP over prefixes:** \`dp[i][j]\` = \`s[0..i)\` matches \`p[0..j)\`. Let \`ok(a, b) = b === '.' || a === b\`.

- \`p[j−1]\` is a letter or \`.\`: \`dp[i][j] = i > 0 && ok(s[i−1], p[j−1]) && dp[i−1][j−1]\`.
- \`p[j−1] === '*'\` (the unit is \`x = p[j−2]\` plus the star):
  1. **zero copies** of x — erase the unit: \`dp[i][j−2]\`;
  2. **one more copy** — s's last char must match x; consume it but **keep the unit** for further copies: \`i > 0 && ok(s[i−1], x) && dp[i−1][j]\`.

Why is "one more copy" enough to express "k copies"? Because \`dp[i−1][j]\` itself may again choose "one more copy", peeling characters off one at a time until it chooses "zero copies". Base row \`i = 0\`: \`dp[0][j] = p[j−1] === '*' && dp[0][j−2]\`.`,

  functionName: 'isMatch',
  paramNames: ['s', 'p'],
  starterCode: `/**
 * @param {string} s
 * @param {string} p
 * @return {boolean}
 */
function isMatch(s, p) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '"a" matches one character only — the whole string must be matched.', args: ["aa", "a"], expected: false },
    { scenario: 'Example 2', hint: '"a*" repeats "a" any number of times.', args: ["aa", "a*"], expected: true },
    { scenario: 'Example 3', hint: '".*" matches any string.', args: ["ab", ".*"], expected: true },
    { scenario: 'Zero copies of several units', hint: '"c*" matches zero c’s, then "a*" two a’s. The empty-prefix row must allow "c*" to vanish.', args: ["aab", "c*a*b"], expected: true },
    { scenario: 'Classic mismatch', hint: '"p*." cannot cover "pi" after "is*" consumes only the second s-run.', args: ["mississippi", "mis*is*p*."], expected: false },
    { scenario: 'Classic match', hint: 'Several starred units each take a different number of copies.', args: ["mississippi", "mis*is*ip*."], expected: true },
    { scenario: 'Star is not a wildcard', hint: '"a*" only repeats "a" — it cannot match "b". Treating "*" like a glob wildcard says true.', args: ["ab", "a*"], expected: false },
    { scenario: 'Zero copies jump back two', hint: '"a*" must disappear entirely (skip 2 pattern chars). Jumping back only 1 column fails.', args: ["b", "a*b"], expected: true },
    { scenario: 'Star unit stays available', hint: '"a*" must consume two "a"s before the final "a". Advancing past the unit after one copy fails.', args: ["aaa", "a*a"], expected: true },
    { scenario: 'Trailing pattern left over', hint: 'The string is used up but "c" in the pattern is not — false.', args: ["ab", ".*c"], expected: false },
    { scenario: 'Trailing optional unit', hint: 'A trailing "b*" can match zero characters.', args: ["a", "ab*"], expected: true },
    { scenario: 'Dot matches one character', hint: '"." matches exactly one arbitrary character.', args: ["abc", "a.c"], expected: true },
    { scenario: 'Pattern only a prefix', hint: 'Matching a prefix of s is not enough — the whole string must match.', args: ["abc", "ab"], expected: false },
    { scenario: 'Backtracking blow-up', hint: 'Ten "a*" units and a final "b" that never matches: un-memoized recursion tries a huge number of splits. Memoize (i, j) or use the table.', args: ["aaaaaaaaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*"], expected: false, timeLimitMs: 100 },
  ],

  solution: {
    code: `function isMatch(s, p) {
  const m = s.length, n = p.length;
  const ok = (a, b) => b === '.' || a === b;
  // dp[i][j]: s[0..i) matches p[0..j)
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 2; j <= n; j++) {
    if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];       // "" matches a*b*c*...
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        dp[i][j] =
          dp[i][j - 2] ||                                  // zero copies of p[j-2]
          (ok(s[i - 1], p[j - 2]) && dp[i - 1][j]);        // one more copy, keep "x*"
      } else {
        dp[i][j] = ok(s[i - 1], p[j - 1]) && dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}`,
  },
  dryRun: `\`s = "aab"\`, \`p = "c*a*b"\` (columns: "", c, *, a, *, b):

| | "" | c | * | a | * | b |
|---|---|---|---|---|---|---|
| "" | T | F | T | F | T | F |
| a | F | F | F | T | T | F |
| a | F | F | F | F | T | F |
| b | F | F | F | F | F | **T** |

- Row "": \`c*\` and \`c*a*\` can vanish → T at the star columns.
- (a, a*) : zero copies gives dp[1][3] = T.
- (aa, a*) : one more copy → dp[1][5] = T.
- (aab, b): b = b and dp[2][5] = T.`,
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each cell O(1). Can be reduced to two rows since row i reads rows i and i−1 only.' },
  alternative: {
    title: 'Top-down memoised recursion',
    md: 'Often easier to derive in an interview: look at whether p[j+1] is a star.',
    code: `function isMatch(s, p) {
  const memo = new Map();
  const go = (i, j) => {
    if (j === p.length) return i === s.length;
    const key = i * 32 + j;
    if (memo.has(key)) return memo.get(key);
    const first = i < s.length && (p[j] === '.' || p[j] === s[i]);
    let r;
    if (j + 1 < p.length && p[j + 1] === '*') r = go(i, j + 2) || (first && go(i + 1, j));
    else r = first && go(i + 1, j + 1);
    memo.set(key, r);
    return r;
  };
  return go(0, 0);
}`,
    complexity: 'O(m·n) time and space',
  },
  mistakes: [
    'Treating "*" as a standalone wildcard (it modifies the previous element).',
    'Zero-copies jumping back one column (j − 1) instead of two (j − 2).',
    'Moving the pattern index after "one more copy" — the unit must stay available.',
    'Forgetting the empty-string row, so "" never matches "a*".',
    'Accepting partial matches (the whole string must be matched).',
  ],
};
