export default {
  id: 'is-subsequence',
  title: 'Is Subsequence',
  difficulty: 'Easy',
  order: 2,
  pattern: 'dp-2d-two-sequences',
  tags: ['string', 'two pointers', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 392, url: 'https://leetcode.com/problems/is-subsequence/' },

  statement: `Given strings \`s\` and \`t\`, return \`true\` if \`s\` is a **subsequence** of \`t\`.

A subsequence is obtained by deleting zero or more characters from \`t\` **without changing the order** of the remaining ones. For example \`"ace"\` is a subsequence of \`"abcde"\`, but \`"aec"\` is not.`,
  examples: [
    { input: 's = "abc", t = "ahbgdc"', output: 'true' },
    { input: 's = "axc", t = "ahbgdc"', output: 'false', explanation: 'There is no x in t.' },
  ],
  constraints: ['0 <= s.length <= 100', '0 <= t.length <= 10^4', 'Both strings contain only lowercase English letters'],

  think: `- If \`s[0] === t[0]\`, is it ever worse to match them?
- What does the two-index state (i in s, j in t) mean?
- What happens if you have millions of different \`s\` against the same \`t\`?`,
  patternChallenge: {
    options: ['Sliding window', 'Hash map counting', 'Two-sequence DP / two pointers over both strings', 'Sorting'],
    answer: 2,
    explanation: 'Order matters and characters may be skipped — a subsequence relation between two strings. The DP state (i, j) collapses to two pointers because matching greedily is always safe. Counting letters ignores order; windows need contiguity.',
  },
  hints: [
    'Keep a pointer i into s. Walk through t; whenever t[j] equals s[i], advance i.',
    'Answer: did i reach s.length? An empty s is always a subsequence.',
  ],
  approach: `**DP view:** \`dp[i][j]\` = is \`s[0..i)\` a subsequence of \`t[0..j)\`? If \`s[i−1] === t[j−1]\` then \`dp[i−1][j−1]\`, else \`dp[i][j−1]\` (skip a character of t). Base: \`dp[0][j] = true\`. O(|s|·|t|).

**Greedy / two pointers:** matching the earliest possible character of t never hurts — any later match leaves *fewer* characters of t for the rest of s. So one pass: advance \`i\` on a match. O(|t|) time, O(1) space.

**Follow-up (many queries):** preprocess \`t\` into, for each letter, the sorted list of its positions; for each character of s binary-search the next position > the current one. O(|s| log |t|) per query.`,

  functionName: 'isSubsequence',
  paramNames: ['s', 't'],
  starterCode: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isSubsequence(s, t) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: a, b, c appear in order.', args: ["abc", "ahbgdc"], expected: true },
    { scenario: 'Example 2', hint: '"x" never appears in t.', args: ["axc", "ahbgdc"], expected: false },
    { scenario: 'Empty s', hint: 'The empty string is a subsequence of anything — return true.', args: ["", "ahbgdc"], expected: true },
    { scenario: 'Both empty', hint: 'Empty is a subsequence of empty.', args: ["", ""], expected: true },
    { scenario: 'Empty t', hint: 'A non-empty s cannot come from an empty t.', args: ["a", ""], expected: false },
    { scenario: 'Letters out of order', hint: 'All letters exist in t but "c" comes before "e" — order matters.', args: ["aec", "abcde"], expected: false },
    { scenario: 'Gaps between letters', hint: 'Non-contiguous match → true. t.includes(s) only finds contiguous substrings and returns false.', args: ["ace", "abcde"], expected: true },
    { scenario: 'Not enough repeats', hint: 's needs three "a"s but t has only two.', args: ["aaa", "aa"], expected: false },
    { scenario: 's equals t', hint: 'Every character matches in place.', args: ["abc", "abc"], expected: true },
    { scenario: 'Match only at the end', hint: 'The only match is the last character of t — make sure the scan reaches it.', args: ["c", "abc"], expected: true },
    { scenario: 's longer than t', hint: 'A longer s can never be a subsequence.', args: ["abcd", "abc"], expected: false },
    { scenario: 'Large t, spread-out s', hint: 'Max sizes: 100 letters picked every 100th position of a 10 000-letter t.', argsGen: '() => { let x = 9; const r = () => (x = x * 48271 % 2147483647); const t = Array.from({ length: 10000 }, () => String.fromCharCode(97 + r() % 26)).join(\'\'); let s = \'\'; for (let i = 99; i < 10000; i += 100) s += t[i]; return [s, t]; }', expected: true },
    { scenario: 'Large t, last letter missing', hint: '99 "a"s match early, but the final "b" never appears — return false after one pass.', argsGen: '() => [\'a\'.repeat(99) + \'b\', \'a\'.repeat(10000)]', expected: false },
  ],

  solution: {
    code: `function isSubsequence(s, t) {
  let i = 0;                           // next character of s to match
  for (let j = 0; j < t.length && i < s.length; j++) {
    if (s[i] === t[j]) i++;            // greedy match is always safe
  }
  return i === s.length;
}`,
  },
  dryRun: {
    columns: ['j', 't[j]', 's[i]', 'match?', 'i after'],
    rows: [
      ['0', 'a', 'a', 'yes', '1'],
      ['1', 'h', 'b', 'no', '1'],
      ['2', 'b', 'b', 'yes', '2'],
      ['3', 'g', 'c', 'no', '2'],
      ['4', 'd', 'c', 'no', '2'],
      ['5', 'c', 'c', 'yes', '3 = s.length → true'],
    ],
  },
  complexity: { time: 'O(|t|)', space: 'O(1)', explanation: 'One pass over t; i only moves forward.' },
  alternative: {
    title: 'The full DP table',
    md: 'Useful to see the two-sequence pattern before harder problems like distinct subsequences.',
    code: `function isSubsequence(s, t) {
  const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(false));
  for (let j = 0; j <= t.length; j++) dp[0][j] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 1; j <= t.length; j++)
      dp[i][j] = s[i - 1] === t[j - 1] ? dp[i - 1][j - 1] : dp[i][j - 1];
  return dp[s.length][t.length];
}`,
    complexity: 'O(|s|·|t|) time and space',
  },
  mistakes: [
    'Using t.includes(s) — that checks for a contiguous substring.',
    'Returning false for an empty s.',
    'Resetting the pointer into t after a mismatch (unnecessary, order only moves forward).',
  ],
};
