export default {
  id: 'merge-strings-alternately',
  title: 'Merge Strings Alternately',
  difficulty: 'Easy',
  order: 4,
  pattern: 'string-builder',
  tags: ['string', 'string building'],
  source: { platform: 'LeetCode', number: 1768, url: 'https://leetcode.com/problems/merge-strings-alternately/' },

  statement: `Given two strings \`word1\` and \`word2\`, build a new string by taking characters alternately — first from \`word1\`, then from \`word2\`, then \`word1\` again, and so on.

When one string runs out, append the remaining characters of the other one. Return the merged string.`,
  examples: [
    { input: 'word1 = "abc", word2 = "pqr"', output: '"apbqcr"' },
    { input: 'word1 = "ab", word2 = "pqrs"', output: '"apbqrs"', explanation: 'After "apbq", word1 is used up; append "rs".' },
  ],
  constraints: ['1 <= word1.length, word2.length <= 100', 'Both strings consist of lowercase English letters'],

  think: `- How many rounds does the alternating loop need?
- How will you handle the longer string's leftovers without a special case?`,
  patternChallenge: {
    options: ['Hash Map', 'String Building & Character Processing', 'Sliding Window', 'Binary Search'],
    answer: 1,
    explanation: 'We only read characters by index and produce a new string — pure string building.',
  },
  hints: ['Loop i from 0 to max(word1.length, word2.length) − 1.', 'Append word1[i] if it exists, then word2[i] if it exists; join at the end.'],
  approach: `Loop i over the longer length. At each i, append \`word1[i]\` when \`i < word1.length\` and \`word2[i]\` when \`i < word2.length\`. Collect characters in an array and \`join('')\` once — strings are immutable, so this is the reliably linear way to build output.`,

  functionName: 'mergeAlternately',
  paramNames: ['word1', 'word2'],
  starterCode: `/**
 * @param {string} word1
 * @param {string} word2
 * @return {string}
 */
function mergeAlternately(word1, word2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: equal lengths, letters alternate.', args: ['abc', 'pqr'], expected: 'apbqcr' },
    { scenario: 'Example 2', hint: 'word2 is longer — its leftover "rs" must be appended at the end.', args: ['ab', 'pqrs'], expected: 'apbqrs' },
    { scenario: 'First word longer', hint: 'Looping only to the shorter length forgets the leftovers of word1 ("cd").', args: ['abcd', 'pq'], expected: 'apbqcd' },
    { scenario: 'Both single letters', hint: 'Smallest input: one letter from each word.', args: ['a', 'b'], expected: 'ab' },
    { scenario: 'Second word much longer', hint: 'Reading word1[i] past its end gives undefined — concatenated it becomes the text "undefined".', args: ['a', 'bcde'], expected: 'abcde' },
    { scenario: 'First word much longer', hint: 'Reading word2[i] past its end gives undefined; check the index against each word separately.', args: ['wxyz', 'a'], expected: 'waxyz' },
    { scenario: 'Identical words', hint: 'Same letters in both words — each letter appears twice in a row.', args: ['ab', 'ab'], expected: 'aabb' },
    { scenario: 'Repeated letters', hint: 'Duplicate characters must all be kept in order.', args: ['aaa', 'bb'], expected: 'ababa' },
    { scenario: 'Word2 starts the tail early', hint: 'After word1 runs out, the rest of word2 is copied unchanged.', args: ['xy', 'abcdef'], expected: 'xaybcdef' },
    { scenario: 'Length differs by one', hint: 'Only the last letter of the longer word is left over.', args: ['abc', 'de'], expected: 'adbec' },
    { scenario: 'Maximum length words', hint: 'Both words at the maximum length of 100.', argsGen: '() => [\'a\'.repeat(100), \'b\'.repeat(100)]', expected: 'abababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababab' },
    { scenario: 'Max and min lengths', hint: 'word1 has 100 letters and word2 only 1 — most of the answer is the leftover tail.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => String.fromCharCode(97 + (i % 26))).join(\'\'), \'z\']', expected: 'azbcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuv' },
  ],

  solution: {
    code: `function mergeAlternately(word1, word2) {
  const out = [];
  const n = Math.max(word1.length, word2.length);
  for (let i = 0; i < n; i++) {
    if (i < word1.length) out.push(word1[i]);
    if (i < word2.length) out.push(word2[i]);
  }
  return out.join('');
}`,
  },
  dryRun: {
    columns: ['i', 'word1[i]', 'word2[i]', 'out'],
    rows: [['0', 'a', 'p', 'ap'], ['1', 'b', 'q', 'apbq'], ['2', '—', 'r', 'apbqr'], ['3', '—', 's', 'apbqrs']],
  },
  complexity: { time: 'O(n + m)', space: 'O(n + m)', explanation: 'Each character is pushed once; the output holds n + m characters.' },
  alternative: {
    title: 'Two indexes + slice for the tail',
    md: 'Alternate while both strings have characters, then append the remaining tail with slice.',
    code: `function mergeAlternately(word1, word2) {
  const out = [];
  let i = 0;
  while (i < word1.length && i < word2.length) { out.push(word1[i], word2[i]); i++; }
  return out.join('') + word1.slice(i) + word2.slice(i);
}`,
    complexity: 'O(n + m) time and space',
  },
  mistakes: ['Looping only to the shorter length and forgetting the leftovers', 'Appending `undefined` (word1[i] past the end) — it becomes the text "undefined" when concatenated'],
};
