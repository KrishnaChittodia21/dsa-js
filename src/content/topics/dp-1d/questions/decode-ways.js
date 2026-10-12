export default {
  id: 'decode-ways',
  title: 'Decode Ways',
  difficulty: 'Medium',
  order: 5,
  pattern: 'dp-1d-string-decoding',
  tags: ['string', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 91, url: 'https://leetcode.com/problems/decode-ways/' },

  statement: `Letters are encoded as numbers: \`'A' → "1"\`, \`'B' → "2"\`, …, \`'Z' → "26"\`. Given a string of digits \`s\`, return the **number of ways** to decode it back into letters.

Codes with a leading zero (like \`"06"\`) are invalid, and \`"0"\` alone maps to nothing. The answer fits in a 32-bit integer.`,
  examples: [
    { input: 's = "12"', output: '2', explanation: '"AB" (1 2) or "L" (12).' },
    { input: 's = "226"', output: '3', explanation: '"BZ" (2 26), "VF" (22 6), "BBF" (2 2 6).' },
    { input: 's = "06"', output: '0' },
  ],
  constraints: ['1 <= s.length <= 100', 's contains only digits and may contain leading zeros'],

  think: `- The last letter of a decoding used either the last digit, or the last two digits. When is each valid?
- Define dp[i] = number of decodings of the first i characters. What is dp[0]?
- What does a "0" force?`,
  patternChallenge: {
    options: ['Backtracking — enumerate decodings', 'Greedy', '1D DP — String Decoding', 'Stack'],
    answer: 2,
    explanation: 'Each prefix splits into "last piece of length 1" or "of length 2" — Fibonacci-like DP with validity checks. Enumerating decodings is exponential ("111…1" has Fibonacci-many).',
  },
  hints: [
    'dp[0] = 1 (empty prefix). If s[i−1] !== "0", add dp[i−1]. If the two digits s[i−2..i−1] form 10..26, add dp[i−2].',
    'Only dp[i−1] and dp[i−2] are needed.',
  ],
  approach: `**Brute force:** recursively peel 1 or 2 digits from the front — O(2ⁿ), recomputing the same suffixes.

**DP:** \`dp[i]\` = ways to decode \`s[0..i)\`.
- one digit: \`s[i−1]\` in '1'..'9' → \`+dp[i−1]\`
- two digits: \`s[i−2..i−1]\` in 10..26 → \`+dp[i−2]\`
Base \`dp[0] = 1\`, \`dp[1] = s[0] === '0' ? 0 : 1\`. Answer \`dp[n]\`. Rolling variables → O(1) space.`,

  functionName: 'numDecodings',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function numDecodings(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '"AB" (1 2) or "L" (12).', args: ['12'], expected: 2 },
    { scenario: 'Example 2', hint: '"BZ" (2 26), "VF" (22 6), "BBF" (2 2 6).', args: ['226'], expected: 3 },
    { scenario: 'Example 3', hint: '"06" is not a valid code and "0" alone maps to nothing — so 0 ways. Accepting "06" as a two-digit code is a common slip.', args: ['06'], expected: 0 },
    { scenario: 'Single zero', hint: '"0" is not a letter — 0 ways, even though the string is non-empty.', args: ['0'], expected: 0 },
    { scenario: 'Single digit', hint: 'One non-zero digit decodes exactly one way.', args: ['7'], expected: 1 },
    { scenario: 'Zero must pair', hint: '"10" can only be read as J; the 0 cannot stand alone.', args: ['10'], expected: 1 },
    { scenario: 'Double zero', hint: '"00" can never be decoded, so the whole string has 0 ways.', args: ['100'], expected: 0 },
    { scenario: 'Pair above 26', hint: '27 is not a letter, so only "2 7" works.', args: ['27'], expected: 1 },
    { scenario: 'Zero after 3', hint: '"30" is not valid as one code and "0" cannot stand alone — 0 ways.', args: ['230'], expected: 0 },
    { scenario: 'Zero forces the split', hint: 'The 0 must join the 1 before it, which constrains the rest: "1 1 10 6" or "11 10 6".', args: ['11106'], expected: 2 },
    { scenario: 'Many ones (n = 45)', hint: 'A string of ones counts like Fibonacci — 1.8·10⁹ ways. Plain recursion visits each one; a memo or rolling DP is O(n).', args: ['111111111111111111111111111111111111111111111'], expected: 1836311903, timeLimitMs: 1000 },
    { scenario: 'Dead end at the end (n = 100)', hint: 'The trailing "00" makes the answer 0, but unmemoized recursion explores every split of the 98 ones before discovering that.', argsGen: '() => [\'1\'.repeat(98) + \'00\']', expected: 0, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function numDecodings(s) {
  let prev2 = 1;                    // dp[0]: the empty prefix has one decoding
  let prev1 = s[0] === '0' ? 0 : 1; // dp[1]
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    if (s[i - 1] !== '0') cur += prev1;         // last letter uses one digit
    const two = (s.charCodeAt(i - 2) - 48) * 10 + (s.charCodeAt(i - 1) - 48);
    if (two >= 10 && two <= 26) cur += prev2;   // last letter uses two digits
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
  },
  dryRun: {
    columns: ['i', 'one digit', 'two digits', 'dp[i]'],
    rows: [
      ['1', '"2" ✓', '—', '1'],
      ['2', '"2" ✓ +1', '"22" ✓ +1', '2'],
      ['3', '"6" ✓ +2', '"26" ✓ +1', '3'],
    ],
    note: 's = "226" → 3.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Constant work per character.' },
  alternative: {
    title: 'Memoized recursion from the front',
    md: '`ways(i)` = decodings of the suffix starting at i.',
    code: `function numDecodings(s) {
  const memo = new Map();
  const ways = (i) => {
    if (i === s.length) return 1;
    if (s[i] === '0') return 0;
    if (memo.has(i)) return memo.get(i);
    let res = ways(i + 1);
    if (i + 1 < s.length && Number(s.slice(i, i + 2)) <= 26) res += ways(i + 2);
    memo.set(i, res);
    return res;
  };
  return ways(0);
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Counting "0" as a letter.', 'Accepting "05" as a two-digit code (must be 10..26).', 'dp[0] = 0 — then everything becomes 0.'],
};
