export default {
  id: 'valid-anagram',
  title: 'Valid Anagram',
  difficulty: 'Easy',
  order: 3,
  pattern: 'hash-frequency-map',
  tags: ['string', 'frequency count'],
  source: { platform: 'LeetCode', number: 242, url: 'https://leetcode.com/problems/valid-anagram/' },

  statement: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an **anagram** of \`s\` — that is, it uses exactly the same letters, each the same number of times, possibly in a different order.`,
  examples: [
    { input: 's = "anagram", t = "nagaram"', output: 'true' },
    { input: 's = "rat", t = "car"', output: 'false' },
  ],
  constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters'],

  think: `- Does the position of each letter matter?
- What summary of a string is identical for all of its anagrams?
- Is there a quick early exit?`,
  patternChallenge: {
    options: ['Sliding Window', 'Frequency Map (Counting)', 'Two Pointers', 'Hash Set membership'],
    answer: 1,
    explanation: 'Anagram = same multiset of letters = same counts. A Set loses multiplicity ("aab" vs "abb"), so counts are needed.',
  },
  hints: ['If the lengths differ, return false immediately.', 'Use a 26-slot array: +1 for each letter in s, −1 for each letter in t; all zeros means anagram.'],
  approach: `**Sorting:** sort both strings and compare → O(n log n).

**Optimized:** count letters. With lowercase letters, \`new Array(26).fill(0)\` indexed by \`charCodeAt(i) − 97\` is a perfect hash. Increment for s, decrement for t, then check every slot is 0 → O(n) time, O(1) space (26 counters). For Unicode input use a Map instead.`,

  functionName: 'isAnagram',
  paramNames: ['s', 't'],
  starterCode: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: same letters, same counts, different order.', args: ['anagram', 'nagaram'], expected: true },
    { scenario: 'Example 2', hint: '"car" has a c where "rat" has a t.', args: ['rat', 'car'], expected: false },
    { scenario: 'Identical strings', hint: 'A string is an anagram of itself.', args: ['abc', 'abc'], expected: true },
    { scenario: 'Single letters equal', hint: 'The smallest true case.', args: ['a', 'a'], expected: true },
    { scenario: 'Single letters differ', hint: 'The smallest false case.', args: ['a', 'b'], expected: false },
    { scenario: 'Different lengths', hint: 'If you only decrement t\'s letters, "ab" vs "a" looks fine — check the lengths first.', args: ['ab', 'a'], expected: false },
    { scenario: 'Same letter set, other counts', hint: 'Both use only a and b, but with different counts. A Set ignores counts.', args: ['aab', 'abb'], expected: false },
    { scenario: 'Repeated letters', hint: 'Counts of every letter must match exactly.', args: ['aaabbb', 'ababab'], expected: true },
    { scenario: 'One extra letter', hint: 't has one letter more than s: false.', args: ['listen', 'silentt'], expected: false },
    { scenario: 'All 26 letters', hint: 'Every letter once, reversed: true.', args: ['abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba'], expected: true },
    { scenario: 'Large, true (n = 5·10^4)', hint: 'Count letters in one pass each (O(n)). Removing letters with indexOf/splice is O(n²).', argsGen: '() => { let s = 107, a = \'\'; for (let i = 0; i < 50000; i++) { s = (s * 48271) % 2147483647; a += String.fromCharCode(97 + (s % 26)); } return [a, a.split(\'\').reverse().join(\'\')]; }', expected: true, timeLimitMs: 200 },
    { scenario: 'Large, one letter differs', hint: 'Two long strings that differ in a single letter count.', argsGen: '() => [\'a\'.repeat(49999) + \'b\', \'a\'.repeat(49999) + \'c\']', expected: false, timeLimitMs: 200 },
  ],

  solution: {
    code: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;   // letters of s add
    count[t.charCodeAt(i) - 97]--;   // letters of t cancel
  }
  return count.every((c) => c === 0);
}`,
  },
  dryRun: {
    columns: ['i', 's[i]', 't[i]', 'non-zero counts'],
    rows: [['0', 'r', 'c', 'r:1, c:−1'], ['1', 'a', 'a', 'r:1, c:−1'], ['2', 't', 'r', 't:1, c:−1 → not all zero → false']],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass; 26 counters regardless of input size.' },
  alternative: {
    title: 'Sort both strings',
    md: 'Simple and correct; O(n log n).',
    code: `function isAnagram(s, t) {
  return s.length === t.length && [...s].sort().join('') === [...t].sort().join('');
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: ['Using a Set (ignores counts)', 'Forgetting the length check when only decrementing', 'Using charCodeAt − 97 on non-lowercase input (use a Map for general Unicode)'],
};
