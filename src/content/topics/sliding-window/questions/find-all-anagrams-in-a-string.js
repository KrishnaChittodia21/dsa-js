export default {
  id: 'find-all-anagrams-in-a-string',
  title: 'Find All Anagrams in a String',
  difficulty: 'Medium',
  order: 5,
  pattern: 'fixed-window',
  tags: ['string', 'hash map', 'frequency count', 'sliding window'],
  source: { platform: 'LeetCode', number: 438, url: 'https://leetcode.com/problems/find-all-anagrams-in-a-string/' },

  statement: `Given strings \`s\` and \`p\`, return **all start indices** of substrings of \`s\` that are **anagrams** of \`p\` (same letters, same counts, any order). Return the indices in increasing order.`,
  examples: [
    { input: 's = "cbaebabacd", p = "abc"', output: '[0,6]', explanation: '"cba" starts at 0 and "bac" starts at 6.' },
    { input: 's = "abab", p = "ab"', output: '[0,1,2]', explanation: '"ab", "ba", "ab" — overlapping matches all count.' },
  ],
  constraints: ['1 <= s.length, p.length <= 3 * 10^4', 's and p consist of lowercase English letters'],

  think: `- This is "Permutation in String", but instead of stopping at the first match you collect all of them. What changes?
- Can two matching windows overlap? Does your approach handle that?
- Instead of two count arrays, could one array of *differences* plus a counter of "letters still missing" work?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Hash each substring into a Set', 'Sliding Window — Fixed Size + frequency count', 'Sort + Binary Search'],
    answer: 2,
    explanation: 'Every anagram of p has length `p.length`, so the window size is fixed; "anagram" = "same letter counts", tracked in O(1) per slide. A variable window is unnecessary because the length is known.',
  },
  hints: [
    'Keep `need[c]` = count of c in p minus count of c in the window, and `missing` = total letters still needed (starts at `p.length`).',
    'When a letter enters: if `need[c] > 0` then `missing--`; `need[c]--`. When a letter leaves: `need[c]++`; if `need[c] > 0` then `missing++`. The window is an anagram exactly when `missing === 0` and the window is full.',
  ],
  approach: `**Brute force:** for every start, count letters of \`s[i .. i+m-1]\` and compare with p → O(n·m).

**Optimized:** fixed window of size \`m = p.length\` with a single \`need\` array and a \`missing\` counter (the same bookkeeping as Minimum Window Substring, but with a fixed size):
- enter \`s[right]\` → maybe \`missing--\`,
- if \`right >= m\`, remove \`s[right - m]\` → maybe \`missing++\`,
- if the window is full and \`missing === 0\`, push \`right - m + 1\`.

Why does \`missing === 0\` with window size m imply an exact anagram? The window has m letters and none of p's m letters is missing, so every letter in the window is one p needs — no extras.`,

  functionName: 'findAnagrams',
  paramNames: ['s', 'p'],
  starterCode: `/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
function findAnagrams(s, p) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: "cba" at 0 and "bac" at 6. Push the window start, not the right edge.', args: ['cbaebabacd', 'abc'], expected: [0, 6] },
    { scenario: 'Example 2', hint: 'Overlapping matches all count — do not skip ahead by m after a match.', args: ['abab', 'ab'], expected: [0, 1, 2] },
    { scenario: 'p longer than s', hint: 'No window of length m fits in s: return [].', args: ['ab', 'abc'], expected: [] },
    { scenario: 'Single characters', hint: 'The smallest input: s and p are one letter each and equal.', args: ['a', 'a'], expected: [0] },
    { scenario: 'Single char, no match', hint: 'One letter each, different: [].', args: ['a', 'b'], expected: [] },
    { scenario: 'Whole string is a match', hint: 's itself is an anagram of p: the only answer is 0.', args: ['listen', 'silent'], expected: [0] },
    { scenario: 'Repeated letters in p', hint: 'p = "aa" needs two a\'s in the window. A half-filled window must not count as complete.', args: ['abaa', 'aa'], expected: [2] },
    { scenario: 'Match at the very end', hint: 'The last window starts at n - m. Make sure your loop checks it.', args: ['xxxxab', 'ba'], expected: [4] },
    { scenario: 'Every window matches', hint: 'All letters equal: every start index from 0 to n - m is an answer.', args: ['aaaaa', 'aa'], expected: [0, 1, 2, 3] },
    { scenario: 'Same letters, wrong counts', hint: '"aab" and "abb" use the same letters but different counts — only exact counts match.', args: ['abbaab', 'aab'], expected: [2, 3] },
    { scenario: 'No match anywhere', hint: 'None of p\'s letters appear in s: [].', args: ['zzzzzz', 'abc'], expected: [] },
    { scenario: 'Large input, long p', hint: 's has 3·10^4 letters and p has 1.5·10^4. Re-counting each window is O(n·m); a sliding count is O(n).', argsGen: '() => [\'a\'.repeat(30000), \'a\'.repeat(14999) + \'b\']', expected: [], timeLimitMs: 150 },
    { scenario: 'Large input, one match', hint: 'The only match is the last window (start 15000). Count updates must stay O(1) per step to finish in time.', argsGen: '() => [\'a\'.repeat(29999) + \'b\', \'a\'.repeat(14999) + \'b\']', expected: [15000], timeLimitMs: 150 },
  ],

  solution: {
    code: `function findAnagrams(s, p) {
  const m = p.length, result = [];
  if (m > s.length) return result;
  const need = new Array(26).fill(0);
  for (let i = 0; i < m; i++) need[p.charCodeAt(i) - 97]++;
  let missing = m;

  for (let right = 0; right < s.length; right++) {
    const inC = s.charCodeAt(right) - 97;
    if (need[inC] > 0) missing--;   // this letter was still needed
    need[inC]--;

    if (right >= m) {                // keep the window at size m
      const outC = s.charCodeAt(right - m) - 97;
      need[outC]++;
      if (need[outC] > 0) missing++; // we removed a needed letter
    }
    if (right >= m - 1 && missing === 0) result.push(right - m + 1);
  }
  return result;
}`,
    explanation: '`need` goes negative for surplus letters, exactly like in Minimum Window Substring. The window is full once `right >= m - 1`.',
  },
  dryRun: {
    columns: ['right', 'window', 'missing', 'push?'],
    rows: [
      ['2', '"cba"', '0', 'push 0'],
      ['3', '"bae"', '1', '—'],
      ['4', '"aeb"', '1', '—'],
      ['5', '"eba"', '1', '—'],
      ['6', '"bab"', '1', '—'],
      ['7', '"aba"', '1', '—'],
      ['8', '"bac"', '0', 'push 6'],
      ['9', '"acd"', '1', '—'],
    ],
  },
  complexity: { time: 'O(n + m)', space: 'O(1)', explanation: 'One pass over s; the count array always has 26 slots (the output is not counted).' },
  alternative: {
    title: 'Two count arrays + 26-slot comparison',
    md: 'Maintain `pCount` and `wCount` and compare all 26 slots after each slide. O(26·n) — simpler, still linear.',
    complexity: 'O(26·n) time, O(1) space',
  },
  mistakes: [
    'Pushing `right` instead of the start index `right - m + 1`.',
    'Checking `missing === 0` before the window is full (with `p = "aa"`, `s = "a…"` a half window could look complete if bookkeeping is wrong).',
    'Skipping ahead by m after a match — matches can overlap ("abab" / "ab").',
  ],
};
