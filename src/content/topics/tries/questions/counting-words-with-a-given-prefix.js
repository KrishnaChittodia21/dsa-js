export default {
  id: 'counting-words-with-a-given-prefix',
  title: 'Counting Words With a Given Prefix',
  difficulty: 'Easy',
  order: 2,
  pattern: 'trie-prefix-tree',
  tags: ['string', 'trie'],
  source: { platform: 'LeetCode', number: 2185, url: 'https://leetcode.com/problems/counting-words-with-a-given-prefix/' },

  statement: `Given an array of strings \`words\` and a string \`pref\`, return how many strings in \`words\` start with \`pref\`.`,
  examples: [
    { input: 'words = ["pay","attention","practice","attend"], pref = "at"', output: '2', explanation: '"attention" and "attend".' },
    { input: 'words = ["leetcode","win","loops","success"], pref = "code"', output: '0' },
  ],
  constraints: ['1 <= words.length <= 100', '1 <= words[i].length, pref.length <= 100', 'lowercase English letters'],

  think: `- For ONE prefix query, is a trie worth it? What does it cost to build versus to scan?
- If there were 10⁵ different prefix queries on the same words, what would you store on each trie node?`,
  patternChallenge: {
    options: ['Trie — Prefix Tree (with prefix counts)', 'Sliding Window', 'Binary Search on the answer', 'Trie — Binary Trie for XOR'],
    answer: 0,
    explanation: 'Counting words by prefix is exactly what a trie with a pass-through counter answers in O(|pref|). For a single query a direct scan is just as good — the trie pays off with many queries.',
  },
  hints: [
    'Simple: count words where `w.startsWith(pref)`.',
    'Trie: during insert, increment `count` on every node you pass. The answer is the count stored on the node reached by walking `pref` (0 if the walk fails).',
  ],
  approach: `**Direct scan:** \`words.filter(w => w.startsWith(pref)).length\` → O(n · |pref|). For a single query this is optimal — you must at least look at each word.

**Trie with counts:** build once in O(S) (S = total characters); each node stores how many words pass through it. A query walks |pref| nodes and reads the count → O(|pref|) per query, independent of n. This wins when there are many queries.

The solution below uses the toolkit's global \`Trie\`, whose \`countPrefix\` implements exactly this.`,

  functionName: 'prefixCount',
  paramNames: ['words', 'pref'],
  starterCode: `/**
 * @param {string[]} words
 * @param {string} pref
 * @return {number}
 */
function prefixCount(words, pref) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "attention" and "attend" start with "at".', args: [["pay","attention","practice","attend"],"at"], expected: 2 },
    { scenario: 'Example 2', hint: '"leetcode" contains "code" but does not start with it — the answer is 0.', args: [["leetcode","win","loops","success"],"code"], expected: 0 },
    { scenario: 'Single word equals prefix', hint: 'A word equal to pref starts with it.', args: [["a"],"a"], expected: 1 },
    { scenario: 'Contains but not prefix', hint: 'Counting words that contain pref anywhere (`includes`) is wrong: only "abx" starts with "ab".', args: [["xab","aab","abx","bab"],"ab"], expected: 1 },
    { scenario: 'Words pass through prefix', hint: 'Counting only words that END at the prefix node misses longer words: "abc" and "abcd" both count.', args: [["abc","ab","abcd"],"abc"], expected: 2 },
    { scenario: 'One-letter prefix', hint: 'Three words start with "x".', args: [["x","xy","xyz","y"],"x"], expected: 3 },
    { scenario: 'Prefix longer than word', hint: '"hello" cannot start with "helloo" — do not read past the end of a word.', args: [["hello"],"helloo"], expected: 0 },
    { scenario: 'Duplicate words', hint: 'Duplicates are separate strings in the array and each counts.', args: [["aa","aa","ab"],"aa"], expected: 2 },
    { scenario: 'Every word matches', hint: 'All words share the prefix — the answer is words.length.', args: [["pre","prefix","preview","present"],"pre"], expected: 4 },
    { scenario: 'Mismatch at last letter', hint: 'Words that agree with pref until its final letter do not count.', args: [["abcd","abce","abcf"],"abcz"], expected: 0 },
    { scenario: 'Max size (100 × 100 chars)', hint: '100 words of length 100 and a 100-letter prefix; half of them match.', argsGen: "() => [Array.from({ length: 100 }, (_, i) => 'a'.repeat(99) + (i % 2 ? 'a' : 'b')), 'a'.repeat(100)]", expected: 50 },
  ],

  solution: {
    code: `function prefixCount(words, pref) {
  const trie = new Trie(words);    // toolkit Trie: every node counts words passing through
  return trie.countPrefix(pref);
}`,
    explanation: 'Duplicates are inserted twice, so their pass-through counts add up correctly.',
  },
  dryRun: {
    columns: ['step', 'node', 'count'],
    rows: [['insert all 4 words', '—', '—'], ['walk "a"', 'a', '2 (attention, attend)'], ['walk "t"', 'at', '2 → answer']],
  },
  complexity: { time: 'O(S + |pref|)', space: 'O(S)', explanation: 'Building the trie costs O(S); the query O(|pref|). For many queries, each extra query is only O(|pref|).' },
  alternative: {
    title: 'Direct scan (best for one query)',
    code: `function prefixCount(words, pref) {
  return words.filter((w) => w.startsWith(pref)).length;
}`,
    md: 'O(n · |pref|) time, O(1) extra space — the right call when there is only one query.',
    complexity: 'O(n · |pref|)',
  },
  mistakes: [
    'Counting words that CONTAIN pref anywhere (`includes`) instead of starting with it.',
    'Counting only the words that END at the prefix node (isEnd) instead of those passing through.',
    'Building a trie for a single query and claiming it is faster than scanning.',
  ],
};
