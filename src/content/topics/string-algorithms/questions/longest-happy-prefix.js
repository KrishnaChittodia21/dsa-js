export default {
  id: 'longest-happy-prefix',
  title: 'Longest Happy Prefix',
  difficulty: 'Hard',
  order: 1,
  pattern: 'string-kmp-prefix-function',
  tags: ['string', 'kmp', 'rolling hash'],
  source: { platform: 'LeetCode', number: 1392, url: 'https://leetcode.com/problems/longest-happy-prefix/' },

  statement: `A **happy prefix** of \`s\` is a non-empty prefix that is also a suffix, **excluding \`s\` itself**. Return the longest happy prefix of \`s\`, or \`""\` if there is none.`,
  examples: [
    { input: 's = "level"', output: '"l"', explanation: 'Prefixes that are also suffixes (excluding s): only "l".' },
    { input: 's = "ababab"', output: '"abab"', explanation: '"ab" and "abab" both work; "abab" is longer. Prefix and suffix may overlap.' },
  ],
  constraints: ['1 <= s.length <= 10^5', 's contains only lowercase English letters'],

  think: `- Is a "happy prefix" one of the terms defined in this topic?
- Which entry of the lps array describes the whole string?
- Comparing every prefix with the matching suffix is O(n²). What does the lps construction reuse to avoid that?`,
  patternChallenge: {
    options: ['KMP Prefix Function', 'Expand Around Center', 'Binary Search on length', 'Two Pointers (opposite ends)'],
    answer: 0,
    explanation: 'A happy prefix is exactly a border, and lps[n − 1] is the length of the longest border of the whole string. Binary search on the length does not apply because borders are not monotonic: "abab" has a border of length 2 but none of length 1.',
  },
  hints: [
    'This is the definition of lps for the last index: longest proper prefix of s that is also its suffix.',
    'Build the lps array in O(n) and return `s.slice(0, lps[n − 1])`.',
  ],
  approach: `**Brute force:** for L from n − 1 down to 1, compare \`s.slice(0, L)\` with \`s.slice(n − L)\` — O(n²) in the worst case (e.g. "aaaa…ab").

**Optimized — lps:** the answer is literally \`lps[n − 1]\`. Building lps is O(n): \`len\` (the current border) grows by at most 1 per step and every fall-back shrinks it.

**Alternative — rolling hash:** compare prefix hash and suffix hash for each L in O(1) each, keep the largest equal pair (O(n) expected; verify to rule out collisions).`,

  functionName: 'longestPrefix',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function longestPrefix(s) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "The basic case: only \"l\" is both a proper prefix and a suffix.", args: ["level"], expected: "l" },
    { scenario: "Example 2", hint: "\"abab\" is a prefix and a suffix even though the two copies overlap in the middle — borders may overlap.", args: ["ababab"], expected: "abab" },
    { scenario: "Single character", hint: "Smallest input: the only prefix is s itself, which is excluded, so return \"\".", args: ["a"], expected: "" },
    { scenario: "Two equal characters", hint: "\"a\" is a proper prefix and a suffix of \"aa\".", args: ["aa"], expected: "a" },
    { scenario: "Two different characters", hint: "No proper prefix equals a suffix — return \"\".", args: ["ab"], expected: "" },
    { scenario: "All same letter", hint: "For \"aaaa\" the answer is \"aaa\", not \"aaaa\": the whole string never counts.", args: ["aaaa"], expected: "aaa" },
    { scenario: "No border at all", hint: "All distinct letters — the answer is \"\".", args: ["abcd"], expected: "" },
    { scenario: "Nested borders", hint: "\"aba\" is the longest border of \"abacaba\"; it in turn has the border \"a\".", args: ["abacaba"], expected: "aba" },
    { scenario: "Fall-back must repeat", hint: "At the final \"b\" the border length must fall back 2 → 1 → 0. Using `if` instead of `while` stops at 1 and wrongly returns \"a\".", args: ["aaab"], expected: "" },
    { scenario: "Border after a mismatch", hint: "The scan has to recover from a mismatch and still find the border \"aab\".", args: ["aabaaab"], expected: "aab" },
    { scenario: "All \"a\" (n = 10^5)", hint: "The answer is n − 1 characters long and overlaps itself almost completely.", argsGen: "() => ['a'.repeat(100000)]", expectedGen: "() => 'a'.repeat(99999)" },
    { scenario: "Adversarial \"aaa…ab\" (n = 10^5)", hint: "No border exists, but every candidate length L matches almost all of its characters before failing — checking each L by comparison is O(n²). The prefix function finds the answer in O(n).", argsGen: "() => ['a'.repeat(99999) + 'b']", expected: "", timeLimitMs: 100 },
    { scenario: "Fibonacci word (n = 10^5)", hint: "A highly self-similar string with a long border; the lps fall-back chain is exercised many times.", argsGen: "() => { let a = 'a', b = 'ab'; while (b.length < 100000) { const c = b + a; a = b; b = c; } return [b.slice(0, 100000)]; }", expectedGen: "() => { const [s] = (() => { let a = 'a', b = 'ab'; while (b.length < 100000) { const c = b + a; a = b; b = c; } return [b.slice(0, 100000)]; })(); const n = s.length, z = new Int32Array(n); let l = 0, r = 0; for (let i = 1; i < n; i++) { if (i < r) z[i] = Math.min(r - i, z[i - l]); while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++; if (i + z[i] > r) { l = i; r = i + z[i]; } if (i + z[i] === n) return s.slice(0, n - i); } return ''; }" },
    { scenario: "Periodic text (n = 10^5)", hint: "\"abc\" repeated: the longest border is everything except the first period.", argsGen: "() => ['abc'.repeat(33333) + 'a']", expectedGen: "() => 'abc'.repeat(33332) + 'a'" },
  ],
  solution: {
    code: `function longestPrefix(s) {
  const n = s.length;
  const lps = new Array(n).fill(0);
  for (let i = 1, len = 0; i < n; i++) {
    while (len > 0 && s[i] !== s[len]) len = lps[len - 1]; // try the next shorter border
    if (s[i] === s[len]) len++;
    lps[i] = len;
  }
  return s.slice(0, lps[n - 1]);
}`,
  },
  dryRun: {
    columns: ['i', 's[i]', 'len before', 'action', 'lps[i]'],
    rows: [
      ['1', 'b', '0', 'b ≠ a', '0'],
      ['2', 'a', '0', 'a = s[0]', '1'],
      ['3', 'b', '1', 'b = s[1]', '2'],
      ['4', 'a', '2', 'a = s[2]', '3'],
      ['5', 'b', '3', 'b = s[3]', '4 → answer "abab"'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One lps build; the final slice is O(answer length).' },
  alternative: {
    title: 'Rolling hash of prefix vs suffix',
    md: 'Grow the prefix hash from the left (`hp = hp·B + c`) and the suffix hash from the right (`hs = c·B^k + hs`) simultaneously. When they are equal for length L, record L. Uses moduli below 2^26 so products stay exact in JS; the double modulus makes collisions negligible.',
    code: `function longestPrefix(s) {
  const M1 = 67108859, M2 = 67108837, B = 131, n = s.length;
  let p1 = 0, p2 = 0, s1 = 0, s2 = 0, pw1 = 1, pw2 = 1, best = 0;
  for (let L = 1; L < n; L++) {
    const cp = s.charCodeAt(L - 1), cs = s.charCodeAt(n - L);
    p1 = (p1 * B + cp) % M1;  p2 = (p2 * B + cp) % M2;     // prefix s[0..L)
    s1 = (cs * pw1 + s1) % M1; s2 = (cs * pw2 + s2) % M2;   // suffix s[n-L..n)
    pw1 = (pw1 * B) % M1; pw2 = (pw2 * B) % M2;
    if (p1 === s1 && p2 === s2) best = L;
  }
  return s.slice(0, best);
}`,
    complexity: 'O(n) time, O(1) extra space',
  },
  mistakes: [
    'Returning s itself for strings like "aaaa" — the prefix must be proper (lps never counts the whole string).',
    'Assuming borders cannot overlap: "ababab" → "abab" overlaps itself.',
    'Using `if` instead of `while` in the fall-back.',
    'Comparing slices for every L (O(n²)).',
  ],
};
