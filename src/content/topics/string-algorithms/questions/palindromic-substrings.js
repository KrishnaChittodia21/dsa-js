export default {
  id: 'palindromic-substrings',
  title: 'Palindromic Substrings',
  difficulty: 'Medium',
  order: 2,
  pattern: 'string-palindrome-expand-center',
  tags: ['string', 'palindrome', 'two pointers', 'manacher'],
  source: { platform: 'LeetCode', number: 647, url: 'https://leetcode.com/problems/palindromic-substrings/' },

  statement: `Count how many **substrings** of \`s\` are palindromes (read the same forwards and backwards). Substrings at different positions count separately, even if they are equal as strings.`,
  examples: [
    { input: 's = "abc"', output: '3', explanation: '"a", "b", "c".' },
    { input: 's = "aaa"', output: '6', explanation: '"a" ×3, "aa" ×2, "aaa".' },
  ],
  constraints: ['1 <= s.length <= 1000', 's consists of lowercase English letters'],

  think: `- Checking every substring separately costs O(n) each — O(n³) total. What repeated work is there?
- If s[l..r] is a palindrome, what do you know about s[l+1..r−1]?
- Where is the "middle" of an even-length palindrome?`,
  patternChallenge: {
    options: ['Dynamic Programming on subsequences (LPS)', 'Expand Around Center', 'Sliding Window — Variable Size', 'KMP Prefix Function'],
    answer: 1,
    explanation: 'Palindromic substrings grow symmetrically from a center. Expanding from each of the 2n − 1 centers counts them all in O(n²) with O(1) space (Manacher makes it O(n)). Palindromic *subsequence* DP answers a different question; a sliding window has no monotonic rule here.',
  },
  hints: [
    'There are 2n − 1 centers: each character (odd lengths) and each gap between neighbours (even lengths).',
    'For each center, expand while `s[l] === s[r]`, counting one palindrome per successful step.',
  ],
  approach: `**Brute force:** enumerate all O(n²) substrings and check each with two pointers — O(n³).

**Expand around center — O(n²), O(1) space:**
For each center (c, c) and (c, c + 1): while l ≥ 0, r < n and s[l] === s[r], count++, l−−, r++.
Why it is correct: every palindrome has exactly one center, and it is found at the expansion step that reaches its ends — so each palindrome is counted exactly once.

**Manacher — O(n):** transform to \`^#a#b#…#$\`, compute radii with the mirror trick, and sum \`ceil(rad / 2)\` … see the alternative.`,

  functionName: 'countSubstrings',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function countSubstrings(s) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "The basic case: only the three single letters are palindromes.", args: ["abc"], expected: 3 },
    { scenario: "Example 2", hint: "Equal substrings at different positions count separately: \"a\" ×3, \"aa\" ×2, \"aaa\".", args: ["aaa"], expected: 6 },
    { scenario: "Single character", hint: "Smallest input: one letter is one palindrome.", args: ["a"], expected: 1 },
    { scenario: "Two equal characters", hint: "\"aa\" is an even-length palindrome — expanding only around single characters (odd centers) misses it.", args: ["aa"], expected: 3 },
    { scenario: "Two different characters", hint: "Only the two single letters count.", args: ["ab"], expected: 2 },
    { scenario: "Even palindrome", hint: "\"abba\" contains \"bb\" and \"abba\", both even length — odd centers alone give 4 instead of 6.", args: ["abba"], expected: 6 },
    { scenario: "Odd palindrome", hint: "\"racecar\" nests \"cec\", \"aceca\", \"racecar\" around one center.", args: ["racecar"], expected: 10 },
    { scenario: "Mismatch then more palindromes", hint: "A mismatch only ends the expansion around *that* center; the remaining centers still have palindromes to count.", args: ["abacdfgdcaba"], expected: 14 },
    { scenario: "Count occurrences, not distinct", hint: "In \"abab\" the palindrome \"aba\" and \"bab\" each occur once, but \"a\" and \"b\" each occur twice — counting distinct strings gives 4 instead of 6.", args: ["abab"], expected: 6 },
    { scenario: "Ten equal letters", hint: "Every substring is a palindrome: n·(n + 1)/2 = 55.", args: ["aaaaaaaaaa"], expected: 55 },
    { scenario: "All \"a\" (n = 1000)", hint: "All 500 500 substrings are palindromes. Checking each substring separately (or slicing and reversing it) is O(n³); expanding around 2n − 1 centers is O(n²).", argsGen: "() => ['a'.repeat(1000)]", expected: 500500, timeLimitMs: 50 },
    { scenario: "Random letters (n = 1000)", hint: "Few long palindromes: expansions stop quickly, but you must still visit every center.", argsGen: "() => { let x = 99, s = ''; for (let i = 0; i < 1000; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += String.fromCharCode(97 + ((x >> 16) % 3)); } return [s]; }", expected: 2031 },
    { scenario: "Alternating \"abab…\" (n = 1000)", hint: "Only odd-length palindromes exist here (every even center fails immediately) — odd centers expand far.", argsGen: "() => ['ab'.repeat(500)]", expected: 250500 },
  ],
  solution: {
    code: `function countSubstrings(s) {
  const n = s.length;
  let count = 0;
  const expand = (l, r) => {
    while (l >= 0 && r < n && s[l] === s[r]) {
      count++;          // s[l..r] is a palindrome
      l--;
      r++;
    }
  };
  for (let c = 0; c < n; c++) {
    expand(c, c);       // odd length: center is s[c]
    expand(c, c + 1);   // even length: center is the gap after s[c]
  }
  return count;
}`,
  },
  dryRun: {
    columns: ['center', 'expansions found', 'count'],
    rows: [
      ['(0,0)', '"a"', '1'],
      ['(0,1)', '"aa"', '2'],
      ['(1,1)', '"a", "aaa"', '4'],
      ['(1,2)', '"aa"', '5'],
      ['(2,2)', '"a"', '6'],
      ['(2,3)', 'r out of range', '6'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(1)', explanation: '2n − 1 centers, each expanding at most n/2 steps. Worst case "aaaa…" really reaches ~n²/4 steps.' },
  alternative: {
    title: 'Manacher\'s algorithm — O(n)',
    md: 'Insert separators so every palindrome is odd-length. `rad[i]` is the radius around i in the transformed string, which equals the length of the corresponding palindrome in s. Inside the rightmost palindrome [C − R, C + R], start from the mirror\'s radius (capped at the edge), then expand. The number of palindromes centered at i is `ceil(rad[i] / 2)`.',
    code: `function countSubstrings(s) {
  const t = '^#' + s.split('').join('#') + '#$';   // sentinels stop expansion
  const rad = new Array(t.length).fill(0);
  let center = 0, right = 0, count = 0;
  for (let i = 1; i < t.length - 1; i++) {
    if (i < right) rad[i] = Math.min(right - i, rad[2 * center - i]); // mirror
    while (t[i + rad[i] + 1] === t[i - rad[i] - 1]) rad[i]++;          // expand
    if (i + rad[i] > right) { center = i; right = i + rad[i]; }
    count += Math.ceil(rad[i] / 2);
  }
  return count;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Only odd centers — misses "aa", "abba", …',
    'Using `s.slice(l, r + 1)` and reversing inside the loop (O(n) per check → O(n³)).',
    'Stopping the whole algorithm at the first mismatch instead of just that center.',
    'Counting distinct palindromes instead of occurrences.',
  ],
};
