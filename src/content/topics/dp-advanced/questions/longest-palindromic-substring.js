export default {
  id: 'longest-palindromic-substring',
  title: 'Longest Palindromic Substring',
  difficulty: 'Medium',
  order: 2,
  pattern: 'dp-adv-palindrome',
  tags: ['string', 'dynamic programming', 'two pointers'],
  source: { platform: 'LeetCode', number: 5, url: 'https://leetcode.com/problems/longest-palindromic-substring/' },

  statement: `Given a string \`s\`, return its longest **contiguous** substring that reads the same forwards and backwards.

If several have the maximum length, return any of them.`,
  examples: [
    { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also accepted.' },
    { input: 's = "cbbd"', output: '"bb"' },
  ],
  constraints: ['1 <= s.length <= 1000', 's consists of digits and English letters'],

  think: `- If s[i..j] is a palindrome, what can you say about s[i+1..j-1]?
- Every palindrome has a middle. How many possible middles does a string of length n have?
- Can you find the answer without an n × n table?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Palindromic DP / expand around center', 'Longest Common Substring with reverse(s) only', 'Hashing all substrings'],
    answer: 1,
    explanation: 'Palindromes grow from the center: s[i..j] is a palindrome iff its ends match and the inside is a palindrome. A sliding window fails because "is palindrome" is not monotonic. Longest common substring with reverse(s) can return non-palindromes (e.g. "abacdfgdcaba") unless you add index checks. Hashing all substrings is O(n²) substrings × O(n) each.',
  },
  hints: [
    'Try every center: n single characters (odd length) and n − 1 gaps (even length).',
    'From a center, expand l--, r++ while s[l] === s[r]; the palindrome length is r − l − 1 when the loop stops.',
  ],
  approach: `**Brute force:** check all O(n²) substrings, each in O(n) → O(n³).

**DP table:** \`isPal[i][j] = s[i] === s[j] && (j − i < 2 || isPal[i+1][j−1])\`, filled with i descending. O(n²) time and space.

**Expand around center (best):** for each of the 2n − 1 centers expand while the ends match; remember the longest. O(n²) time, O(1) extra space. Record only (start, length) and slice once at the end.`,

  functionName: 'longestPalindrome',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function longestPalindrome(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "bab" and "aba" are both accepted.', args: ["babad"], expectedAnyOf: ["bab","aba"] },
    { scenario: 'Example 2', hint: 'Only checking odd-length centers returns "c"; the even center between the two b\'s gives "bb".', args: ["cbbd"], expected: "bb" },
    { scenario: 'Single character', hint: 'One character is its own palindrome.', args: ["a"], expected: "a" },
    { scenario: 'Two different characters', hint: 'No longer palindrome exists — either single character is accepted.', args: ["ac"], expectedAnyOf: ["a","c"] },
    { scenario: 'Whole string palindrome', hint: 'The answer can be the entire string.', args: ["racecar"], expected: "racecar" },
    { scenario: 'Even palindrome in middle', hint: 'A long even-length palindrome "geeksskeeg" in the middle.', args: ["forgeeksskeegfor"], expected: "geeksskeeg" },
    { scenario: 'All same character', hint: 'Every substring is a palindrome; the whole string wins.', args: ["aaaa"], expected: "aaaa" },
    { scenario: 'Reversed copy is a trap', hint: 'The string and its reverse share "abacd", but that is not a palindrome. The answer is "aba".', args: ["abacdfgdcaba"], expected: "aba" },
    { scenario: 'Palindrome at the end', hint: 'The answer "bb" ends at the last index.', args: ["abb"], expected: "bb" },
    { scenario: 'Digits and mixed case', hint: 'Digits and letters are ordinary characters; "A" and "a" differ.', args: ["1Aa2332aA9"], expected: "Aa2332aA" },
    { scenario: 'Max length same char', hint: '1000 equal characters: the whole string. Building substrings inside the loop adds an O(n) cost each time.', argsGen: "() => ['x'.repeat(1000)]", expected: 'x'.repeat(1000) },
    { scenario: 'Large "aaa…ab" (n = 1000)', hint: 'Almost every substring is a palindrome, so checking all ~5·10^5 substrings from scratch costs O(n³). Expand around each of the 2n−1 centers (or use the DP table) for O(n²).', argsGen: "() => ['a'.repeat(999) + 'b']", expected: 'a'.repeat(999), timeLimitMs: 150 },
  ],

  solution: {
    code: `function longestPalindrome(s) {
  let start = 0, bestLen = 0;

  // expand from the center (l, r) and return the palindrome's length
  const expand = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    return r - l - 1;
  };

  for (let c = 0; c < s.length; c++) {
    const odd = expand(c, c);        // center on a character
    const even = expand(c, c + 1);   // center on the gap after it
    const len = Math.max(odd, even);
    if (len > bestLen) {
      bestLen = len;
      start = c - Math.floor((len - 1) / 2);
    }
  }
  return s.slice(start, start + bestLen);
}`,
    explanation: 'For both odd and even lengths, the palindrome centred at c starts at c − ⌊(len − 1)/2⌋.',
  },
  dryRun: {
    columns: ['c', 'odd', 'even', 'best'],
    rows: [['0 (b)', '1', '0', '"b"'], ['1 (a)', '3 "bab"', '0', '"bab"'], ['2 (b)', '3 "aba"', '0', '"bab" (not longer)'], ['3 (a)', '1', '0', '"bab"'], ['4 (d)', '1', '0', '"bab"']],
  },
  complexity: { time: 'O(n²)', space: 'O(1)', explanation: '2n − 1 centers, each expanding at most O(n). Only indices are stored.' },
  alternative: {
    title: 'Boolean DP table',
    md: 'isPal[i][j] from isPal[i+1][j−1]. Same time, O(n²) memory, but it generalises to counting palindromic substrings and palindrome partitioning.',
    code: `function longestPalindrome(s) {
  const n = s.length;
  const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
  let start = 0, bestLen = 1;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      if (s[i] === s[j] && (j - i < 2 || isPal[i + 1][j - 1])) {
        isPal[i][j] = true;
        if (j - i + 1 > bestLen) { bestLen = j - i + 1; start = i; }
      }
    }
  }
  return s.slice(start, start + bestLen);
}`,
    complexity: 'O(n²) time, O(n²) space',
  },
  mistakes: [
    'Only checking odd-length centers ("cbbd" → "c" instead of "bb").',
    'Building substrings inside the loop (extra O(n) each time).',
    'Filling the DP table with i ascending so isPal[i+1][j−1] is not ready.',
  ],
};
