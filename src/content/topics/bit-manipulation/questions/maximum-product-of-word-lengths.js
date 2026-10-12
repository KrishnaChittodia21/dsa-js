export default {
  id: 'maximum-product-of-word-lengths',
  title: 'Maximum Product of Word Lengths',
  difficulty: 'Medium',
  order: 6,
  pattern: 'bit-mask-set',
  tags: ['array', 'string', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 318, url: 'https://leetcode.com/problems/maximum-product-of-word-lengths/' },

  statement: `Given an array of lowercase words, find two words that **share no letter** and maximise \`length(word1) × length(word2)\`. Return that product, or \`0\` if no such pair exists.`,
  examples: [
    { input: 'words = ["abcw","baz","foo","bar","xtfn","abcdef"]', output: '16', explanation: '"abcw" and "xtfn".' },
    { input: 'words = ["a","ab","abc","d","cd","bcd","abcd"]', output: '4', explanation: '"ab" and "cd".' },
    { input: 'words = ["a","aa","aaa","aaaa"]', output: '0' },
  ],
  constraints: ['2 <= words.length <= 1000', '1 <= words[i].length <= 1000', 'Lowercase English letters only'],

  think: `- Checking "no common letter" character by character is O(L) per pair. Can you precompute something per word?
- 26 letters, yes/no each — what fits in one integer?
- Which single operation tells you two such summaries are disjoint?`,
  patternChallenge: {
    options: ['Sort by length + greedy', 'Hash set per word, compare letters', 'Bitmask per word, (a & b) === 0', 'Binary trie'],
    answer: 2,
    explanation: 'A 26-bit mask per word turns each pair check into one AND. Sets work but cost O(26) per pair; greedy by length can skip the optimal pair.',
  },
  hints: [
    'mask |= 1 << (ch.charCodeAt(0) − 97) for each character.',
    'Try all pairs i < j; if (mask[i] & mask[j]) === 0, update the best product.',
  ],
  approach: `**Brute force:** for every pair, check letter overlap with a Set: O(n² · L).

**Bitmasks:** compute \`mask[i]\` once (O(total length)). A pair has no common letter iff \`(mask[i] & mask[j]) === 0\` — O(1). All pairs: O(n²) = 5·10^5 checks.

**Optional:** keep only the longest word per distinct mask in a \`Map\`, reducing pairs when words repeat letter sets.

This is the "bitmask as a set" idea that powers bitmask DP later: a subset of a small universe stored as one number.`,

  functionName: 'maxProduct',
  paramNames: ['words'],
  starterCode: `/**
 * @param {string[]} words
 * @return {number}
 */
function maxProduct(words) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: "abcw" and "xtfn" share no letter → 4 × 4.',
      args: [['abcw', 'baz', 'foo', 'bar', 'xtfn', 'abcdef']], expected: 16 },
    { scenario: 'Example 2', hint: '"ab" and "cd" (and others) — the best disjoint pair gives 4.',
      args: [['a', 'ab', 'abc', 'd', 'cd', 'bcd', 'abcd']], expected: 4 },
    { scenario: 'Example 3', hint: 'Every pair shares "a", so no valid pair exists → 0.',
      args: [['a', 'aa', 'aaa', 'aaaa']], expected: 0 },
    { scenario: 'Two disjoint words', hint: 'The minimum input size with a valid pair.',
      args: [['ab', 'cd']], expected: 4 },
    { scenario: 'Two words sharing a letter', hint: 'The only pair overlaps on "b" → 0.',
      args: [['ab', 'bc']], expected: 0 },
    { scenario: 'Repeated letters (+ vs |)', hint: 'Building the mask with + makes "aa" look like "b" (1 + 1 = 2) and wrongly reject the pair. Use |.',
      args: [['aa', 'b']], expected: 2 },
    { scenario: 'Operator precedence trap', hint: '`masks[i] & masks[j] === 0` parses as `masks[i] & (masks[j] === 0)` and never finds a pair — parenthesise the &.',
      args: [['abc', 'def', 'ghij']], expected: 12 },
    { scenario: 'Identical words', hint: 'Equal words always overlap; the best pair here mixes "abc" with "def". A word must never be paired with itself.',
      args: [['abc', 'abc', 'def']], expected: 9 },
    { scenario: 'Letter z (bit 25)', hint: '"z" uses the highest bit of the mask; it is disjoint from the 25-letter word.',
      args: [['z', 'abcdefghijklmnopqrstuvwxy']], expected: 25 },
    { scenario: 'Length counts repeats', hint: 'Word length includes repeated letters: "aaaaaaaaaa" has 10 letters but only one distinct.',
      args: [['aaaaaaaaaa', 'abcd', 'efgh']], expected: 40 },
    { scenario: 'Mixed overlaps', hint: 'Many pairs overlap; check every pair i < j, not just neighbours.',
      args: [['eae', 'ea', 'aaf', 'bda', 'fcf', 'dc', 'ac', 'ce', 'cefde', 'dabae']], expected: 15 },
    { scenario: 'Large input (1000 long words)', hint: '1000 words of ~950 letters: comparing letters for every pair is ~10^8+ work. Precompute a 26-bit mask per word so each pair check is one &.',
      argsGen: '() => { const words = []; for (let i = 0; i < 1000; i++) { const len = 899 + (i * 37) % 101; const base = i % 2 === 0 ? 0 : 13; let w = \'\'; for (let k = 0; k < len; k++) w += String.fromCharCode(97 + base + (k * 7 + i) % 13); if (i % 5 === 0) w += String.fromCharCode(97 + 25 - base); words.push(w); } return [words]; }', expected: 998001, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxProduct(words) {
  const masks = words.map((w) => {
    let m = 0;
    for (let i = 0; i < w.length; i++) m |= 1 << (w.charCodeAt(i) - 97);
    return m;
  });
  let best = 0;
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      if ((masks[i] & masks[j]) === 0) {          // no shared letter
        best = Math.max(best, words[i].length * words[j].length);
      }
    }
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['word', 'mask (letters)', 'note'],
    rows: [
      ['abcw', 'a b c w', ''],
      ['xtfn', 'f n t x', 'abcw & xtfn = 0 → 4 × 4 = 16'],
      ['abcdef', 'a–f', 'shares a with abcw, f with xtfn'],
      ['foo', 'f o', 'baz & foo = 0 → 9 (< 16)'],
    ],
  },
  complexity: { time: 'O(n² + total length)', space: 'O(n)', explanation: 'One mask per word, O(1) per pair test.' },
  alternative: {
    title: 'Deduplicate masks',
    md: 'Map each mask to its longest word length, then compare entries of the Map.',
    code: `function maxProduct(words) {
  const best = new Map();
  for (const w of words) {
    let m = 0;
    for (let i = 0; i < w.length; i++) m |= 1 << (w.charCodeAt(i) - 97);
    best.set(m, Math.max(best.get(m) ?? 0, w.length));
  }
  const entries = [...best];
  let ans = 0;
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++)
      if ((entries[i][0] & entries[j][0]) === 0) ans = Math.max(ans, entries[i][1] * entries[j][1]);
  return ans;
}`,
    complexity: 'O(k² + total length), k = distinct masks',
  },
  mistakes: [
    'Writing masks[i] & masks[j] === 0 without parentheses.',
    'Using + instead of | when building the mask (duplicate letters then add twice).',
    'Comparing a word with itself (j must start at i + 1).',
  ],
};
