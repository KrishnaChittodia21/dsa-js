// ---- large-test generators (deterministic; used by the timed tests below) ----
// 1000 roots "zq???x"; the sentence has ~140 000 words "zq???y" (no root) or "zq???xy" (root = word minus the final "y").
const bigReplaceArgs = () => {
  const L = 'abcdefghij';
  const code = (k) => L[k % 10] + L[Math.floor(k / 10) % 10] + L[Math.floor(k / 100) % 10];
  const dict = Array.from({ length: 1000 }, (_, k) => 'zq' + code(k) + 'x');
  let s = 1;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  const words = [];
  for (let len = 0; len < 990000; len += words[words.length - 1].length + 1) words.push('zq' + code(rnd() % 1000) + (rnd() % 4 === 0 ? 'xy' : 'y'));
  return [dict, words.join(' ')];
};
const bigReplaceExpected = () => bigReplaceArgs()[1].split(' ').map((w) => (w.endsWith('xy') ? w.slice(0, -1) : w)).join(' ');
// ---- end generators ----

export default {
  id: 'replace-words',
  title: 'Replace Words',
  difficulty: 'Medium',
  order: 4,
  pattern: 'trie-prefix-tree',
  tags: ['trie', 'string', 'hash set'],
  source: { platform: 'LeetCode', number: 648, url: 'https://leetcode.com/problems/replace-words/' },

  statement: `A **root** is a word that can be extended into longer words (e.g. \`"help"\` → \`"helpful"\`). Given a \`dictionary\` of roots and a \`sentence\` of space-separated words, replace every word that starts with some root by the **shortest** such root. Words with no root stay unchanged. Return the new sentence.`,
  examples: [
    { input: 'dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by the battery"', output: '"the cat was rat by the bat"' },
    { input: 'dictionary = ["a","b","c"], sentence = "aadsfasf absbs bbab cadsfafs"', output: '"a a b c"' },
  ],
  constraints: ['1 <= dictionary.length <= 1000', '1 <= dictionary[i].length <= 100', '1 <= sentence.length <= 10^6', 'Single spaces, lowercase letters'],

  think: `- For one sentence word, how would you find the shortest root that is a prefix of it?
- Walking the word through a trie of roots — when can you stop early?
- What if the walk falls off the trie before hitting a root?`,
  patternChallenge: {
    options: ['Hash Set of roots, checking every prefix', 'Trie — Prefix Tree', 'Sliding Window', 'Trie — Binary Trie for XOR'],
    answer: 1,
    explanation: 'Walk each word through a trie of roots and stop at the first end-of-root node — that is the shortest root, found in O(length of that root). A Set of roots also works but checks every prefix length by slicing.',
  },
  hints: [
    'Insert all roots into a trie.',
    'For each word, walk character by character: if you reach a node marked as a root, output the prefix so far; if a child is missing, keep the word.',
  ],
  approach: `**Set approach:** put roots in a Set; for each word try prefixes of length 1, 2, … and stop at the first one in the Set → O(L²) per word because of slicing/hashing each prefix.

**Trie:** insert the roots. For each word, walk the trie:
- reaching a node with \`isEnd\` → the prefix walked so far is the **shortest** root → replace;
- missing child → no root is a prefix → keep the word.

Each word costs O(min(L, length of shortest root)).`,

  functionName: 'replaceWords',
  paramNames: ['dictionary', 'sentence'],
  starterCode: `/**
 * @param {string[]} dictionary
 * @param {string} sentence
 * @return {string}
 */
function replaceWords(dictionary, sentence) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "cattle" → "cat", "rattled" → "rat", "battery" → "bat".', args: [["cat","bat","rat"],"the cattle was rattled by the battery"], expected: "the cat was rat by the bat" },
    { scenario: 'Example 2', hint: 'Single-letter roots replace every word that starts with them.', args: [["a","b","c"],"aadsfasf absbs bbab cadsfafs"], expected: "a a b c" },
    { scenario: 'Nested roots pick shortest', hint: 'With roots "a", "aa", "aaa" the shortest prefix "a" wins every time. Stop at the first end-of-word node.', args: [["a","aa","aaa"],"aa aaa aaaa"], expected: "a a a" },
    { scenario: 'Longer root listed first', hint: 'Continuing past the first root returns "catt" instead of "cat". Dictionary order must not matter.', args: [["catt","cat","bat","rat"],"the cattle was rattled by the battery"], expected: "the cat was rat by the bat" },
    { scenario: 'Two roots share a letter', hint: '"ab" and "ac" branch after "a" — each word follows its own branch.', args: [["ac","ab"],"it is abnormal that this solution is accepted"], expected: "it is ab that this solution is ac" },
    { scenario: 'No word has a root', hint: 'Nothing matches, so the sentence comes back unchanged.', args: [["xyz"],"hello world"], expected: "hello world" },
    { scenario: 'Single-word sentence', hint: 'A sentence with one word and no spaces. "e" is itself a root, so it stays "e".', args: [["e","k","c"],"e"], expected: "e" },
    { scenario: 'Root inside, not prefix', hint: 'Replacing with a root that merely appears inside the word is wrong: "concat" contains "cat" but does not start with it.', args: [["cat","at"],"concat scatter atlas cat"], expected: "concat scatter at cat" },
    { scenario: 'Word shorter than root', hint: '"ca" is a prefix of the root "cat", not the other way round — the word must stay. Do not report a match when the word runs out mid-trie.', args: [["cat"],"ca c cat cats"], expected: "ca c cat cat" },
    { scenario: 'Word equals a root', hint: 'A word identical to a root is "replaced" by itself.', args: [["cat","bat"],"cat bat cattle"], expected: "cat bat cat" },
    { scenario: 'Repeated words', hint: 'Each occurrence is replaced independently.', args: [["re"],"redo redo undo redo"], expected: "re re undo re" },
    { scenario: 'Long root of 100 chars', hint: 'Roots can be long; a word only matches if all 100 letters agree.', args: [["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","b"],"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bb"], expected: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa b" },
    { scenario: 'Large (sentence ≈ 10^6 chars)', hint: 'About 140 000 words × 1000 roots with startsWith is over 10^8 checks. Rebuilding the trie per word is also too slow — build it once and walk each word.', argsGen: String(bigReplaceArgs), expected: bigReplaceExpected(), timeLimitMs: 500 },
  ],

  solution: {
    code: `function replaceWords(dictionary, sentence) {
  const root = { children: new Map(), isEnd: false };
  for (const r of dictionary) {
    let node = root;
    for (const ch of r) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), isEnd: false });
      node = node.children.get(ch);
    }
    node.isEnd = true;
  }

  const shortestRoot = (word) => {
    let node = root;
    for (let i = 0; i < word.length; i++) {
      node = node.children.get(word[i]);
      if (!node) return word;                  // no root is a prefix
      if (node.isEnd) return word.slice(0, i + 1); // first root hit = shortest
    }
    return word;
  };

  return sentence.split(' ').map(shortestRoot).join(' ');
}`,
  },
  dryRun: {
    columns: ['word', 'walk', 'result'],
    rows: [['the', 't → missing', 'the'], ['cattle', 'c, a, t (isEnd)', 'cat'], ['rattled', 'r, a, t (isEnd)', 'rat'], ['battery', 'b, a, t (isEnd)', 'bat']],
  },
  complexity: { time: 'O(D + S)', space: 'O(D)', explanation: 'D = total characters in the dictionary (trie build); S = sentence length (each word walks at most its own length).' },
  alternative: {
    title: 'Set of roots + prefix checks',
    code: `function replaceWords(dictionary, sentence) {
  const roots = new Set(dictionary);
  return sentence.split(' ').map((w) => {
    for (let i = 1; i <= w.length; i++) if (roots.has(w.slice(0, i))) return w.slice(0, i);
    return w;
  }).join(' ');
}`,
    md: 'Short and fine for moderate inputs; each prefix slice costs O(i), so O(L²) per word.',
    complexity: 'O(Σ L²) time',
  },
  mistakes: [
    'Continuing past the first root and returning a longer one ("catt" instead of "cat").',
    'Replacing with a root that merely appears inside the word (must be a prefix).',
    'Rebuilding the trie for every word.',
  ],
};
