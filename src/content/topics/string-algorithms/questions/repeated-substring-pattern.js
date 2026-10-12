export default {
  id: 'repeated-substring-pattern',
  title: 'Repeated Substring Pattern',
  difficulty: 'Easy',
  order: 4,
  pattern: 'string-kmp-prefix-function',
  tags: ['string', 'kmp', 'periodicity'],
  source: { platform: 'LeetCode', number: 459, url: 'https://leetcode.com/problems/repeated-substring-pattern/' },

  statement: `Return \`true\` if the string \`s\` can be built by taking some substring of it and concatenating **two or more** copies of that substring; otherwise return \`false\`.`,
  examples: [
    { input: 's = "abab"', output: 'true', explanation: '"ab" + "ab".' },
    { input: 's = "aba"', output: 'false' },
    { input: 's = "abcabcabcabc"', output: 'true', explanation: '"abc" four times (or "abcabc" twice).' },
  ],
  constraints: ['1 <= s.length <= 10^4', 's consists of lowercase English letters'],

  think: `- If s = t repeated k times, what is the longest proper prefix of s that is also a suffix?
- Define the **period** of s as n − (longest border). When is s a whole number of copies of its period?
- Could you answer with a single value from the lps array?`,
  patternChallenge: {
    options: ['Sliding Window — Fixed Size', 'Two Pointers (opposite ends)', 'Hash Map (frequency count)', 'KMP Prefix Function (border / period)'],
    answer: 3,
    explanation: 'Repetition is a statement about borders: if s = t^k then s[0..n−|t|) equals s[|t|..n), a border of length n − |t|. The lps array gives the longest border in O(n), and the smallest period is n − lps[n − 1]. Character frequencies cannot see order.',
  },
  hints: [
    'Compute the lps array of s. Let `L = lps[n − 1]` (longest border) and `p = n − L` (smallest period).',
    's is a repetition exactly when `L > 0` and `n % p === 0`.',
  ],
  approach: `**Brute force:** for every length L that divides n (L < n), check whether \`s.slice(0, L).repeat(n / L) === s\`. O(n · d(n)) where d(n) is the number of divisors — acceptable, but it is guesswork.

**Optimized — lps:**
- The longest border L means s "overlaps itself" when shifted by \`p = n − L\` — p is the smallest period: \`s[i] === s[i + p]\` for all valid i.
- If p divides n, s is exactly \`n / p\` copies of \`s.slice(0, p)\` (and n / p ≥ 2 because L > 0 ⇒ p < n).
- If p does not divide n, no shorter block can tile s either (any tiling block length would be a period, and a classic lemma says it would then be a multiple of the smallest period p — which cannot divide n).

**Neat alternative:** s is a repetition iff s occurs in \`(s + s).slice(1, −1)\`.`,

  functionName: 'repeatedSubstringPattern',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function repeatedSubstringPattern(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "ab" twice.', args: ["abab"], expected: true },
    { scenario: 'Example 2', hint: 'Odd length and no repeating unit.', args: ["aba"], expected: false },
    { scenario: 'Example 3', hint: '"abc" four times (also "abcabc" twice).', args: ["abcabcabcabc"], expected: true },
    { scenario: 'Single character', hint: 'One copy is not "two or more" — false. Forgetting `border > 0` returns true here.', args: ["a"], expected: false },
    { scenario: 'Two equal characters', hint: '"a" twice.', args: ["aa"], expected: true },
    { scenario: 'All distinct', hint: 'For "abc" the period 3 divides 3, but that is one copy — false.', args: ["abc"], expected: false },
    { scenario: 'Odd number of copies', hint: 'Checking only the two halves misses "abc" × 3 (odd length 9).', args: ["abcabcabc"], expected: true },
    { scenario: 'Equal counts, no pattern', hint: 'Character counts are not enough: "aabb" has even counts but is not a repetition.', args: ["aabb"], expected: false },
    { scenario: 'Unit contains repeats', hint: '"abaab" twice — the unit itself has internal repeats.', args: ["abaababaab"], expected: true },
    { scenario: 'Border but no period', hint: '"abcab" has a border "ab", but 5 − 2 = 3 does not divide 5.', args: ["abcab"], expected: false },
    { scenario: 'Large repetition (n = 9999)', hint: '"xyz" × 3333.', argsGen: "() => ['xyz'.repeat(3333)]", expected: true },
    { scenario: 'Large "aaa…ab" (n = 10^4)', hint: 'Almost periodic: only the last character breaks period 1. Trying every length L without checking that L divides n wastes ~n²/2 comparisons.', argsGen: "() => ['a'.repeat(9999) + 'b']", expected: false },
    { scenario: 'Large near-repetition', hint: '"xyz" × 3333 with the final letter changed — false.', argsGen: "() => ['xyz'.repeat(3333).slice(0, 9998) + 'x']", expected: false },
  ],
  solution: {
    code: `function repeatedSubstringPattern(s) {
  const n = s.length;
  const lps = new Array(n).fill(0);
  for (let i = 1, len = 0; i < n; i++) {
    while (len > 0 && s[i] !== s[len]) len = lps[len - 1];
    if (s[i] === s[len]) len++;
    lps[i] = len;
  }
  const border = lps[n - 1];
  const period = n - border;              // smallest period of s
  return border > 0 && n % period === 0;
}`,
  },
  dryRun: {
    columns: ['s', 'lps', 'border', 'period', 'n % period', 'answer'],
    rows: [
      ['"abab"', '[0,0,1,2]', '2', '2', '0', 'true'],
      ['"aba"', '[0,0,1]', '1', '2', '1', 'false'],
      ['"abcabcabcabc"', '[0,0,0,1,2,3,…,9]', '9', '3', '0', 'true'],
      ['"abaababaab"', '[0,0,1,1,2,3,2,3,4,5]', '5', '5', '0', 'true ("abaab" twice)'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One lps build.' },
  alternative: {
    title: 'Doubled-string trick',
    md: 'If s = t^k (k ≥ 2), then s appears in s + s at a position other than 0 and n. Removing the first and last characters of s + s destroys those two trivial occurrences, so the test is `(s + s).slice(1, -1).includes(s)`.',
    code: `function repeatedSubstringPattern(s) {
  return (s + s).slice(1, -1).includes(s);
}`,
    complexity: 'O(n) with KMP, built-in search typically fast',
  },
  mistakes: [
    'Forgetting `border > 0`: for "abc", period = 3 divides 3, but one copy is not "two or more".',
    'Checking only `n % 2 === 0` halves — "abcabcabc" has an odd length and is a repetition.',
    'Using character counts — "aabb" has even counts but is not a repetition.',
  ],
};
