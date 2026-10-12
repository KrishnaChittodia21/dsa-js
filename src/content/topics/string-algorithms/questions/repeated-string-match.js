export default {
  id: 'repeated-string-match',
  title: 'Repeated String Match',
  difficulty: 'Medium',
  order: 3,
  pattern: 'string-kmp-prefix-function',
  tags: ['string', 'string matching', 'kmp', 'rolling hash'],
  source: { platform: 'LeetCode', number: 686, url: 'https://leetcode.com/problems/repeated-string-match/' },

  statement: `Given strings \`a\` and \`b\`, return the **minimum number of times** you must repeat \`a\` (concatenate copies of it) so that \`b\` becomes a substring of the result. If it is impossible, return \`-1\`.

(Repeating "abc" 0 times gives "", 1 time "abc", 2 times "abcabc".)`,
  examples: [
    { input: 'a = "abcd", b = "cdabcdab"', output: '3', explanation: '"abcdabcdabcd" contains "cdabcdab"; two copies are too short.' },
    { input: 'a = "a", b = "aa"', output: '2' },
    { input: 'a = "abc", b = "wxyz"', output: '-1' },
  ],
  constraints: ['1 <= a.length, b.length <= 10^4', 'Lowercase English letters only'],

  think: `- What is the fewest copies that could possibly be long enough to contain b?
- If b fits somewhere, where can it start inside the repeated string? Does it ever help to start after the first copy?
- So how many different copy counts do you actually need to test?`,
  patternChallenge: {
    options: ['Binary Search on the answer', 'KMP search in a (virtual) repeated string', 'Dynamic Programming', 'Greedy by character counts'],
    answer: 1,
    explanation: 'Any occurrence of b can be assumed to start inside the first copy of a, so only q = ceil(|b| / |a|) or q + 1 copies need checking — each check is a single pattern search, done in linear time with KMP. No monotonic search space or DP structure is needed.',
  },
  hints: [
    'Let q = ceil(|b| / |a|). If b starts at offset k < |a| of the first copy, it ends before position |a| + |b| − 1, which fits in q + 1 copies. So the answer is q, q + 1, or −1.',
    'Run KMP for b over the virtual text of length (q + 1)·|a| where text[i] = a[i % |a|]. The first match ending at index e needs ceil((e + 1) / |a|) copies.',
  ],
  approach: `**Brute force:** keep appending a and test \`includes(b)\` until the string is much longer than b — correct if you stop at the right bound, but each test is a full search.

**Key bound:** shifting an occurrence left by |a| gives another occurrence (the text is periodic), so the **first** occurrence starts at some offset < |a|. It ends at most at \`|a| − 1 + |b|\`, which needs at most \`q + 1\` copies where \`q = ceil(|b| / |a|)\`.

**Optimized — one KMP scan:** build lps(b). Scan the virtual text \`a[i % |a|]\` for i in [0, (q + 1)·|a|). At the first full match ending at index e, return \`ceil((e + 1) / |a|)\`. If no match, return −1. O(|a| + |b|) time, O(|b|) space — no big string is ever built.`,

  functionName: 'repeatedStringMatch',
  paramNames: ['a', 'b'],
  starterCode: `/**
 * @param {string} a
 * @param {string} b
 * @return {number}
 */
function repeatedStringMatch(a, b) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: two copies are too short, three contain "cdabcdab".', args: ["abcd","cdabcdab"], expected: 3 },
    { scenario: 'Example 2', hint: '"a" twice gives "aa".', args: ["a","aa"], expected: 2 },
    { scenario: 'Example 3', hint: 'b has letters a never has — return −1 instead of looping forever.', args: ["abc","wxyz"], expected: -1 },
    { scenario: 'Needs q + 1 copies', hint: 'Checking only q = ⌈|b|/|a|⌉ copies misses matches that start mid-copy: here 4 copies are needed.', args: ["abc","cabcabca"], expected: 4 },
    { scenario: 'b shorter than a', hint: 'One copy already contains "a".', args: ["aa","a"], expected: 1 },
    { scenario: 'Impossible despite same letters', hint: '"abcdb" uses only letters of a but the order never appears. Bound the search at q + 1 copies.', args: ["abcd","abcdb"], expected: -1 },
    { scenario: 'Wrap-around match', hint: '"ba" spans the boundary between two copies of "ab".', args: ["ab","ba"], expected: 2 },
    { scenario: 'Match inside one copy', hint: '"aac" occurs inside "aaac" — one copy.', args: ["aaac","aac"], expected: 1 },
    { scenario: 'Equal strings', hint: 'a === b needs exactly one copy.', args: ["abc","abc"], expected: 1 },
    { scenario: 'Single char repeated', hint: 'b is 300 copies of a.', argsGen: "() => ['a', 'a'.repeat(300)]", expected: 300 },
    { scenario: 'Single letters differ', hint: 'a = "a", b = "b" — impossible.', args: ["a","b"], expected: -1 },
    { scenario: 'Adversarial "aaa…ab" (10^4)', hint: 'Naive matching compares almost all of b at every offset: about 10^8 steps. Use KMP (or Z / rolling hash) over the virtual text.', argsGen: "() => ['a'.repeat(9999) + 'b', 'a'.repeat(10000)]", expected: -1, timeLimitMs: 60 },
    { scenario: 'Long strings, wrap match', hint: '|a| = |b| = 10^4 and b is a rotation of a, so it spans two copies.', argsGen: "() => { let s = 4; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); let a = ''; for (let i = 0; i < 10000; i++) a += 'abc'[rnd() % 3]; return [a, a.slice(5000) + a.slice(0, 5000)]; }", expected: 2 },
  ],
  solution: {
    code: `function repeatedStringMatch(a, b) {
  const n = a.length, m = b.length;
  const q = Math.ceil(m / n);

  const lps = new Array(m).fill(0);
  for (let i = 1, len = 0; i < m; i++) {
    while (len > 0 && b[i] !== b[len]) len = lps[len - 1];
    if (b[i] === b[len]) len++;
    lps[i] = len;
  }

  const limit = (q + 1) * n;                 // enough text for any first occurrence
  for (let i = 0, j = 0; i < limit; i++) {
    const c = a[i % n];                      // virtual repeated string, never built
    while (j > 0 && c !== b[j]) j = lps[j - 1];
    if (c === b[j]) j++;
    if (j === m) return Math.ceil((i + 1) / n); // copies needed to reach index i
  }
  return -1;
}`,
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['a, b', '"abcd", "cdabcdab" → q = 2, limit = 12'],
      ['scan', 'virtual text "abcdabcdabcd"; b matches starting at i = 2'],
      ['match end', 'i = 9 → ceil(10 / 4) = 3'],
      ['answer', '3'],
    ],
  },
  complexity: { time: 'O(|a| + |b|)', space: 'O(|b|)', explanation: 'The virtual text has (q + 1)·|a| ≤ |b| + 2|a| characters; KMP scans it once. Only the lps array is stored.' },
  alternative: {
    title: 'Build q and q + 1 copies and use includes',
    md: 'The same bound gives a two-line solution: `const t = a.repeat(q); if (t.includes(b)) return q; if ((t + a).includes(b)) return q + 1; return -1;`. It builds strings of length up to |b| + 2|a| and relies on the built-in search.',
    code: `function repeatedStringMatch(a, b) {
  const q = Math.ceil(b.length / a.length);
  const t = a.repeat(q);
  if (t.includes(b)) return q;
  if ((t + a).includes(b)) return q + 1;
  return -1;
}`,
    complexity: 'O(|a| + |b|) memory; search cost depends on the engine',
  },
  mistakes: [
    'Looping "append until includes" without an upper bound — infinite loop when the answer is −1.',
    'Checking only q copies: "abcd"/"cdabcdab" needs q + 1 = 3.',
    'Checking too few characters: the virtual text must be (q + 1)·|a| long.',
    'Returning q + 2 or more — never necessary, by the start-offset argument.',
  ],
};
