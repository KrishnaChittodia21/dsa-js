export default {
  id: 'shortest-palindrome',
  title: 'Shortest Palindrome',
  difficulty: 'Hard',
  order: 2,
  pattern: 'string-kmp-prefix-function',
  tags: ['string', 'kmp', 'palindrome', 'rolling hash'],
  source: { platform: 'LeetCode', number: 214, url: 'https://leetcode.com/problems/shortest-palindrome/' },

  statement: `You may add characters **only in front of** the string \`s\`. Return the shortest palindrome you can obtain this way.`,
  examples: [
    { input: 's = "aacecaaa"', output: '"aaacecaaa"', explanation: 'Adding one "a" in front works.' },
    { input: 's = "abcd"', output: '"dcbabcd"' },
    { input: 's = ""', output: '""' },
  ],
  constraints: ['0 <= s.length <= 5 * 10^4', 's consists of lowercase English letters'],

  think: `- Whatever you add in front, the original s ends the palindrome. Which part of s can stay "unmatched" in the middle?
- If the longest palindromic **prefix** of s has length k, what exactly must be added?
- How can "prefix of s that equals a suffix of reverse(s)" be computed in one linear pass?`,
  patternChallenge: {
    options: ['Expand Around Center from every index', 'KMP on s + "#" + reverse(s)', 'Dynamic Programming on intervals', 'Two Pointers from both ends only'],
    answer: 1,
    explanation: 'The answer is reverse(tail) + s where tail follows the longest palindromic prefix. A prefix is a palindrome exactly when it equals a suffix of reverse(s), so lps of s + "#" + reverse(s) gives its length in O(n). Center expansion finds it too but in O(n²).',
  },
  hints: [
    'Let k = length of the longest palindromic prefix of s. The answer is `reverse(s.slice(k)) + s`.',
    'k = last value of the lps array of `s + "#" + reverse(s)`. The "#" stops a border from spanning both halves.',
  ],
  approach: `**Brute force:** for k from n down to 0, check whether \`s.slice(0, k)\` is a palindrome; the first success gives the answer. O(n²) worst case ("aaaa…ab…").

**Optimized — KMP:**
1. \`t = s + "#" + reverse(s)\`.
2. The longest border of t is a prefix of s (left side) that equals a suffix of reverse(s) (right side). A suffix of reverse(s) is the reverse of a prefix of s — so this prefix equals its own reverse: it is a palindrome, and the longest one.
3. \`k = lps[t.length − 1]\`; return \`reverse(s.slice(k)) + s\`.

Without "#", a border could run across both halves and exceed n (e.g. s = "aa").`,

  functionName: 'shortestPalindrome',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function shortestPalindrome(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "aacecaa" is already a palindromic prefix; add one "a".', args: ["aacecaaa"], expected: "aaacecaaa" },
    { scenario: 'Example 2', hint: 'Only "a" is a palindromic prefix; mirror "bcd" in front.', args: ["abcd"], expected: "dcbabcd" },
    { scenario: 'Example 3', hint: 'Empty string: return "" (the lps array is then built over "#" only).', args: [""], expected: "" },
    { scenario: 'Single character', hint: 'Already a palindrome.', args: ["a"], expected: "a" },
    { scenario: 'Already a palindrome', hint: 'Nothing to add.', args: ["aba"], expected: "aba" },
    { scenario: 'Two characters', hint: 'Add the "b" in front, not at the end: "bab". Adding at the end gives "aba".', args: ["ab"], expected: "bab" },
    { scenario: 'Missing "#" separator', hint: 'Omitting the "#" separator: for "aa" the lps of "aaaa" is 3 > 2. Here the palindromic prefix is the whole string.', args: ["aa"], expected: "aa" },
    { scenario: 'Even palindromic prefix', hint: '"abba" is the longest palindromic prefix.', args: ["abbacd"], expected: "dcabbacd" },
    { scenario: 'Prefix not at start', hint: '"abba" in the middle does not help — only prefixes count.', args: ["aabba"], expected: "abbaabba" },
    { scenario: 'All same letter (5·10^4)', hint: 'The whole string is a palindrome; nothing is added.', argsGen: "() => ['a'.repeat(50000)]", expected: 'a'.repeat(50000) },
    { scenario: 'Adversarial "a…aba…a" (5·10^4)', hint: 'Checking prefixes from longest to shortest costs O(n) each — about 10^9 steps here. Build the KMP failure function of s + "#" + reverse(s).', argsGen: "() => ['a'.repeat(25000) + 'b' + 'a'.repeat(24999)]", expected: 'a'.repeat(24999) + 'b' + 'a'.repeat(25000) + 'b' + 'a'.repeat(24999), timeLimitMs: 300 },
    { scenario: 'Adversarial "abab…c…abab"', hint: 'The palindromic prefix is "abab…a" (24 999 letters), found only after checking ~25 000 longer prefixes at O(n) each. Comparing reversed suffixes with startsWith one by one is also O(n²).', argsGen: "() => ['ab'.repeat(12500) + 'c' + 'ab'.repeat(12499)]", expected: (() => { const s = 'ab'.repeat(12500) + 'c' + 'ab'.repeat(12499); return [...s.slice(24999)].reverse().join('') + s; })(), timeLimitMs: 200 },
  ],
  solution: {
    code: `function shortestPalindrome(s) {
  const rev = [...s].reverse().join('');
  const t = s + '#' + rev;
  const lps = new Array(t.length).fill(0);
  for (let i = 1, len = 0; i < t.length; i++) {
    while (len > 0 && t[i] !== t[len]) len = lps[len - 1];
    if (t[i] === t[len]) len++;
    lps[i] = len;
  }
  const k = lps[t.length - 1];        // longest palindromic prefix of s
  return rev.slice(0, s.length - k) + s;  // = reverse(s.slice(k)) + s
}`,
    explanation: '`rev.slice(0, n − k)` is exactly the reverse of `s.slice(k)`, so no second reversal is needed.',
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['s', '"aacecaaa"'],
      ['rev', '"aaacecaa"'],
      ['t', '"aacecaaa#aaacecaa"'],
      ['lps[last]', '7 → "aacecaa" is the longest palindromic prefix'],
      ['add', 'rev.slice(0, 1) = "a"'],
      ['answer', '"aaacecaaa"'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 't has 2n + 1 characters; one lps pass.' },
  alternative: {
    title: 'Rolling hash of prefix vs reversed prefix',
    md: 'Scan i from 0 to n − 1 maintaining the hash of s[0..i] read forwards (`f = f·B + c`) and backwards (`b = b + c·B^i`). When they match, s[0..i] is (with high probability) a palindrome; keep the largest such i. O(n), and a good second answer in interviews.',
    code: `function shortestPalindrome(s) {
  const M = 67108859, B = 131;
  let f = 0, b = 0, pw = 1;
  const candidates = [0];                     // prefix lengths whose hashes match
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    f = (f * B + c) % M;                      // hash of s[0..i] read forwards
    b = (b + c * pw) % M;                     // hash of s[0..i] read backwards
    pw = (pw * B) % M;
    if (f === b) candidates.push(i + 1);
  }
  const isPal = (k) => { for (let l = 0, r = k - 1; l < r; l++, r--) if (s[l] !== s[r]) return false; return true; };
  let k = 0;
  for (let c = candidates.length - 1; c >= 0; c--) {
    if (isPal(candidates[c])) { k = candidates[c]; break; }  // verify: rules out collisions
  }
  return [...s.slice(k)].reverse().join('') + s;
}`,
    complexity: 'O(n) expected time, O(n) for the result',
  },
  mistakes: [
    'Omitting the "#" separator: for "aa", lps of "aaaa" is 3 > 2.',
    'Adding characters at the end instead of the front.',
    'Using center expansion from every index — O(n²), too slow on "aaaa…" inputs with 5·10^4 characters when combined with slicing.',
    'Empty string: return "" (the lps array is then built over "#" only).',
  ],
};
