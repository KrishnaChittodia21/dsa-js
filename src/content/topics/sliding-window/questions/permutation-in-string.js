export default {
  id: 'permutation-in-string',
  title: 'Permutation in String',
  difficulty: 'Medium',
  order: 4,
  pattern: 'fixed-window',
  tags: ['string', 'hash map', 'frequency count', 'sliding window'],
  source: { platform: 'LeetCode', number: 567, url: 'https://leetcode.com/problems/permutation-in-string/' },

  statement: `Given two strings \`s1\` and \`s2\`, return \`true\` if \`s2\` contains a **permutation** (a rearrangement) of \`s1\` as a substring, otherwise \`false\`.

Equivalently: is there a substring of \`s2\` with exactly the same letter counts as \`s1\`?`,
  examples: [
    { input: 's1 = "ab", s2 = "eidbaooo"', output: 'true', explanation: '"ba" is a permutation of "ab".' },
    { input: 's1 = "ab", s2 = "eidboaoo"', output: 'false' },
  ],
  constraints: ['1 <= s1.length, s2.length <= 10^4', 's1 and s2 consist of lowercase English letters'],

  think: `- How long must the matching substring be?
- Two strings are permutations of each other exactly when… (what about their letters?)
- When the window slides by one, how many letter counts change? Can you track "how many letters currently match" instead of comparing 26 counts every step?`,
  patternChallenge: {
    options: ['Backtracking: generate all permutations of s1', 'Sorting every substring', 'Two Pointers from both ends', 'Sliding Window — Fixed Size + frequency count'],
    answer: 3,
    explanation: 'A permutation of s1 has length `s1.length`, so the window size is fixed. "Is a permutation" means "same letter counts", which a 26-slot count array tracks in O(1) per slide. Generating permutations is O(m!) — hopeless.',
  },
  hints: [
    'Use a window of length `m = s1.length` over s2 and two 26-slot count arrays (or one array of differences).',
    'Keep `matches` = number of letters (out of 26) whose counts are equal. Each slide changes two letters; update `matches` for just those two. The answer is true when `matches === 26`.',
  ],
  approach: `**Brute force:** for every length-m substring of s2, sort it and compare to sorted s1 → O(n · m log m).

**Optimized (fixed window + counts):**
- \`need[c]\` = count of letter c in s1, \`have[c]\` = count in the current window of s2.
- The window is a permutation iff \`need\` and \`have\` agree on all 26 letters. Comparing all 26 each step is O(26·n) — already fine, but we can do O(1) per step by maintaining \`matches\`, the number of letters where \`need[c] === have[c]\`.
- When a letter enters or leaves, only its own slot changes: if it was matching before, \`matches--\`; if it matches after, \`matches++\`.`,

  functionName: 'checkInclusion',
  paramNames: ['s1', 's2'],
  starterCode: `/**
 * @param {string} s1
 * @param {string} s2
 * @return {boolean}
 */
function checkInclusion(s1, s2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: "ba" inside s2 is a permutation of "ab".', args: ['ab', 'eidbaooo'], expected: true },
    { scenario: 'Example 2', hint: 'The letters are there but not next to each other: false.', args: ['ab', 'eidboaoo'], expected: false },
    { scenario: 's1 longer than s2', hint: 'No window fits — exit early with false instead of reading past the end.', args: ['abc', 'ab'], expected: false },
    { scenario: 'Single characters equal', hint: 'Smallest input: s1 = s2 = "a".', args: ['a', 'a'], expected: true },
    { scenario: 'Single characters differ', hint: 'Smallest failing input.', args: ['a', 'b'], expected: false },
    { scenario: 'Match in last window', hint: 'The only match ends at the last character. Check the window after the final slide too.', args: ['abc', 'xxxxcba'], expected: true },
    { scenario: 'Match in first window', hint: 'The very first window already matches.', args: ['abc', 'bcaxxxx'], expected: true },
    { scenario: 'Same letters, wrong counts', hint: '"aab" needs two a\'s; windows with one a and two b\'s do not count.', args: ['aab', 'abbabb'], expected: false },
    { scenario: 'Whole s2 is a permutation', hint: 's1 and s2 have the same length and the same letters.', args: ['listen', 'silent'], expected: true },
    { scenario: 'Repeated letter window', hint: 's1 is one letter repeated; the window must hold exactly that many.', args: ['aaa', 'aabaaab'], expected: true },
    { scenario: 'No shared letters', hint: 'No letter of s1 appears in s2.', args: ['xyz', 'abcdefg'], expected: false },
    { scenario: 'Large input, long s1', hint: 's1 has 5 000 letters and s2 10^4. Sorting every window is O(n·m log m); a sliding 26-count is O(n).', argsGen: '() => { let s = 71; const r = () => { s = (s * 48271) % 2147483647; return String.fromCharCode(97 + (s % 26)); }; const s2 = Array.from({ length: 10000 }, r).join(\'\'); return [s2.slice(4000, 9000).split(\'\').reverse().join(\'\'), s2]; }', expected: true, timeLimitMs: 300 },
    { scenario: 'Large input, no match', hint: 's1 needs a "z" that s2 never has — every window must be rejected quickly.', argsGen: '() => [\'a\'.repeat(4999) + \'z\', \'a\'.repeat(10000)]', expected: false },
  ],

  solution: {
    code: `function checkInclusion(s1, s2) {
  const m = s1.length, n = s2.length;
  if (m > n) return false;
  const A = 97; // 'a'.charCodeAt(0)
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  for (let i = 0; i < m; i++) {
    need[s1.charCodeAt(i) - A]++;
    have[s2.charCodeAt(i) - A]++;
  }
  let matches = 0;
  for (let c = 0; c < 26; c++) if (need[c] === have[c]) matches++;

  for (let right = m; right < n; right++) {
    if (matches === 26) return true;
    // letter entering on the right
    let c = s2.charCodeAt(right) - A;
    if (have[c] === need[c]) matches--;
    have[c]++;
    if (have[c] === need[c]) matches++;
    // letter leaving on the left
    c = s2.charCodeAt(right - m) - A;
    if (have[c] === need[c]) matches--;
    have[c]--;
    if (have[c] === need[c]) matches++;
  }
  return matches === 26;
}`,
    explanation: 'The "was matching → matches--, is matching → matches++" pair handles every case (becoming equal, becoming unequal, or moving between two unequal values) without special cases. The final check covers the last window.',
  },
  dryRun: {
    columns: ['window of "eidbaooo"', 'counts vs need {a:1, b:1}', 'matches === 26?'],
    rows: [
      ['"ei"', 'a:0 b:0 e:1 i:1', 'no'],
      ['"id"', 'a:0 b:0 i:1 d:1', 'no'],
      ['"db"', 'b:1 d:1, a:0', 'no'],
      ['"ba"', 'a:1 b:1', 'yes → true'],
    ],
  },
  complexity: { time: 'O(m + n)', space: 'O(1)', explanation: 'Two 26-slot arrays; each slide is O(1).' },
  alternative: {
    title: 'Compare 26 counts per slide',
    md: 'Skip `matches` and compare `need` and `have` slot by slot after each slide. O(26·n) — still linear and simpler to write under pressure. Good as a first version.',
    complexity: 'O(26·n) time, O(1) space',
  },
  mistakes: [
    'Forgetting the early exit when `s1` is longer than `s2`.',
    'Checking the window only inside the loop and missing the last window.',
    'Comparing arrays with `===` (compares references) or `JSON.stringify` on every step (slow).',
  ],
};
