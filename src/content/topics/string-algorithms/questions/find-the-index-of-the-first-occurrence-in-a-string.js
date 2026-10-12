export default {
  id: 'find-the-index-of-the-first-occurrence-in-a-string',
  title: 'Find the Index of the First Occurrence in a String',
  difficulty: 'Easy',
  order: 1,
  pattern: 'string-kmp-prefix-function',
  tags: ['string', 'string matching', 'kmp'],
  source: { platform: 'LeetCode', number: 28, url: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/' },

  statement: `Given two strings \`haystack\` and \`needle\`, return the index where \`needle\` first appears inside \`haystack\`, or \`-1\` if it never appears.

Implement the search yourself (do not just call \`indexOf\`) — aim for a linear-time algorithm.`,
  examples: [
    { input: 'haystack = "sadbutsad", needle = "sad"', output: '0', explanation: '"sad" occurs at 0 and 6; the first is 0.' },
    { input: 'haystack = "leetcode", needle = "leeto"', output: '-1' },
  ],
  constraints: ['1 <= haystack.length, needle.length <= 10^4', 'Both strings contain only lowercase English letters'],

  think: `- What does the naive "try every start" approach re-read after a mismatch?
- After matching j characters of the needle and failing, what do you already know about the text?
- Can that knowledge be precomputed from the needle alone?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'KMP Prefix Function', 'Two Pointers (opposite ends)', 'Hash Map (Complement Lookup)'],
    answer: 1,
    explanation: 'This is the canonical single-pattern search. KMP precomputes the lps array of the needle and scans the haystack once without moving backwards: O(n + m). A variable window has no monotonic validity rule here, and hashing complements does not apply.',
  },
  hints: [
    'Build `lps` for the needle: lps[i] = length of the longest proper prefix of needle[0..i] that is also a suffix of it.',
    'Scan the haystack with j = matched characters. On mismatch, `while (j > 0 && h[i] !== needle[j]) j = lps[j − 1]`. When j reaches needle.length, return i − j + 1.',
  ],
  approach: `**Brute force:** for each start, compare up to m characters — O(n·m) worst case (e.g. "aaaa…ab" vs "aa…ab").

**Optimized — KMP:**
1. Build lps in O(m) (the pattern matched against itself).
2. Scan the text: extend j on a match, fall back via lps on a mismatch, report when j === m.

The text index never moves back, and j's total decreases are bounded by its total increases → O(n + m).`,

  functionName: 'strStr',
  paramNames: ['haystack', 'needle'],
  starterCode: `/**
 * @param {string} haystack
 * @param {string} needle
 * @return {number}
 */
function strStr(haystack, needle) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "The basic case from the statement: the needle occurs twice — return the first index.", args: ["sadbutsad","sad"], expected: 0 },
    { scenario: "Example 2", hint: "A long partial match (\"leet\") that then fails — the answer is -1.", args: ["leetcode","leeto"], expected: -1 },
    { scenario: "Single equal characters", hint: "Smallest input: haystack and needle are the same one letter, so the answer is 0.", args: ["a","a"], expected: 0 },
    { scenario: "Single different characters", hint: "One letter each and they differ — return -1, not 0.", args: ["a","b"], expected: -1 },
    { scenario: "Needle longer than haystack", hint: "The needle cannot fit at all; make sure you do not read past the haystack or return a bogus index.", args: ["ab","abc"], expected: -1 },
    { scenario: "Needle equals haystack", hint: "The whole haystack is the match, starting at 0.", args: ["hello","hello"], expected: 0 },
    { scenario: "Match at the very end", hint: "The only occurrence starts at the last possible index n − m. A loop bound of i < n − m (instead of <=) misses it.", args: ["xyzxyab","ab"], expected: 5 },
    { scenario: "Restart after partial match", hint: "\"aab\" starts at 1 inside \"aaab\". Resetting j to 0 on a mismatch (without re-checking the current character) skips it — that is the naive-reset mistake.", args: ["aaab","aab"], expected: 1 },
    { scenario: "Repeated fall-back needed", hint: "After matching \"aa\", the \"b\" must fall back twice (2 → 1 → 0). With `if` instead of `while` the fall-back stops at 1 and a stale partial match produces a false hit at index 2.", args: ["aabaa","aaa"], expected: -1 },
    { scenario: "Index arithmetic check", hint: "With KMP the match is detected at its last character i, so the start is i − m + 1; returning i − m is off by one.", args: ["ababcabcabababd","ababd"], expected: 10 },
    { scenario: "Overlapping border", hint: "\"issip\" overlaps an earlier failed attempt at index 1 — the real match is at 4.", args: ["mississippi","issip"], expected: 4 },
    { scenario: "Adversarial \"aaa…ab\" (n = 10^4)", hint: "Every start matches thousands of characters before failing, so a naive restart at each index does ~25 million comparisons; KMP never moves backwards in the haystack.", argsGen: "() => ['a'.repeat(9999) + 'b', 'a'.repeat(4999) + 'b']", expected: 5000, timeLimitMs: 30 },
    { scenario: "Adversarial, no match", hint: "Same worst case as above but the needle never occurs — the answer is -1 after scanning everything.", argsGen: "() => ['a'.repeat(10000), 'a'.repeat(4999) + 'b']", expected: -1 },
    { scenario: "Pseudo-random large text", hint: "A long text over two letters with the needle planted near the end; check that earlier near-misses do not confuse your fall-back logic.", argsGen: "() => { let x = 7, h = ''; for (let i = 0; i < 10000; i++) { x = (x * 1103515245 + 12345) % 2147483648; h += (x >> 16) & 1 ? 'a' : 'b'; } const nd = 'abbabaabbaababbaab'; return [h.slice(0, 9900) + nd + h.slice(9900 + nd.length), nd]; }", expected: 9900 },
  ],
  solution: {
    code: `function strStr(haystack, needle) {
  const m = needle.length;
  if (m === 0) return 0;

  // lps[i] = longest proper prefix of needle[0..i] that is also a suffix
  const lps = new Array(m).fill(0);
  for (let i = 1, len = 0; i < m; i++) {
    while (len > 0 && needle[i] !== needle[len]) len = lps[len - 1];
    if (needle[i] === needle[len]) len++;
    lps[i] = len;
  }

  for (let i = 0, j = 0; i < haystack.length; i++) {
    while (j > 0 && haystack[i] !== needle[j]) j = lps[j - 1]; // reuse the matched part
    if (haystack[i] === needle[j]) j++;
    if (j === m) return i - m + 1;
  }
  return -1;
}`,
  },
  dryRun: {
    columns: ['i', 'haystack[i]', 'j before', 'action', 'j after'],
    rows: [
      ['—', '—', '—', 'needle = "sad", lps = [0,0,0]', '—'],
      ['0', 's', '0', 'match', '1'],
      ['1', 'a', '1', 'match', '2'],
      ['2', 'd', '2', 'match → j = 3 = m → return 0', '3'],
    ],
  },
  complexity: { time: 'O(n + m)', space: 'O(m)', explanation: 'Building lps is O(m) and the scan is O(n), both by the "j only decreases as often as it increased" argument. The lps array holds m integers.' },
  alternative: {
    title: 'Z-algorithm on needle + "#" + haystack',
    md: 'Compute the Z-array of `needle + "#" + haystack`; the first index i with z[i] === m gives the answer i − m − 1. Same O(n + m) bound.',
    code: `function strStr(haystack, needle) {
  const s = needle + '#' + haystack, n = s.length, m = needle.length;
  const z = new Array(n).fill(0);
  for (let i = 1, l = 0, r = 0; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]);
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
    if (z[i] === m) return i - m - 1;
  }
  return -1;
}`,
    complexity: 'O(n + m) time and space',
  },
  mistakes: [
    'Using `if` instead of `while` for the fall-back.',
    'Resetting j to 0 on every mismatch — that is the naive algorithm again (and misses matches like "aab" in "aaab").',
    'Returning i − m instead of i − m + 1.',
    'Looping `i < haystack.length - needle.length` in the naive version and missing the last start.',
  ],
};
