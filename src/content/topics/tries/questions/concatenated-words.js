export default {
  id: 'concatenated-words',
  title: 'Concatenated Words',
  difficulty: 'Hard',
  order: 3,
  pattern: 'trie-wildcard-dfs',
  tags: ['trie', 'dfs', 'memoization', 'string'],
  source: { platform: 'LeetCode', number: 472, url: 'https://leetcode.com/problems/concatenated-words/' },

  statement: `Given a list of **distinct** words, return every word that can be written as a concatenation of **at least two** shorter words from the same list (words may be reused). Order does not matter.`,
  examples: [
    {
      input: 'words = ["cat","cats","catsdogcats","dog","dogcatsdog","hippopotamuses","rat","ratcatdogcat"]',
      output: '["catsdogcats","dogcatsdog","ratcatdogcat"]',
      explanation: '"catsdogcats" = "cats" + "dog" + "cats", etc.',
    },
    { input: 'words = ["cat","dog","catdog"]', output: '["catdog"]' },
  ],
  constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 30', 'sum of lengths <= 10^5', 'lowercase letters, all distinct'],

  think: `- Starting at position \`i\` of a word, how can a trie list every dictionary word that begins there, in a single walk?
- Each such word ending gives a possible split point. What should you ask next about the rest of the word?
- The same suffix may be asked about many times. How do you avoid recomputing it?
- How do you prevent a word from counting as its own single piece?`,
  patternChallenge: {
    options: ['Trie — DFS over branches (split points) with memoisation', 'Sliding Window', 'Sort + Two Pointers', 'Trie — Binary Trie for XOR'],
    answer: 0,
    explanation: 'From each position the trie walk reveals every dictionary word starting there; each is a branch to explore on the remainder — a DFS over split points, memoised by start index (word-break DP). Windows and pointers cannot model arbitrary splits.',
  },
  hints: [
    'Insert all words into a trie. For a word w, define ok(start) = "w[start..] can be split into one or more dictionary words".',
    'ok(start): walk the trie from start; at every end-of-word node at index i, if ok(i + 1) → true. Memoise by start. Exclude the piece that is the whole word (start === 0 and i === n − 1).',
  ],
  approach: `**Brute force:** for each word, try every way to split it (2^(L−1) splits) and check the pieces in a Set.

**Word break per word (Set + DP):** \`dp[i]\` = prefix of length i is splittable; for each i try all j < i with \`set.has(w.slice(j, i))\` → O(L²) slices per word, each O(L).

**Trie + memoised DFS:**
- Insert all words once.
- For each word \`w\` (length n), \`ok(start)\`: walk the trie along \`w[start], w[start+1], …\`; whenever the node is an end of a word at index i, that piece \`w[start..i]\` is valid — recurse \`ok(i + 1)\` (\`ok(n) = true\`). Stop when a child is missing.
- To require at least two pieces, skip the piece covering the whole word (\`start === 0 && i === n − 1\`).
- Memoise \`ok\` by start, so each start position is solved once: O(L²) trie steps per word, no substring creation.`,

  functionName: 'findAllConcatenatedWordsInADict',
  paramNames: ['words'],
  starterCode: `/**
 * @param {string[]} words
 * @return {string[]}
 */
function findAllConcatenatedWordsInADict(words) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: three words split into dictionary pieces; "hippopotamuses" does not.', args: [["cat","cats","catsdogcats","dog","dogcatsdog","hippopotamuses","rat","ratcatdogcat"]], expected: ["catsdogcats","dogcatsdog","ratcatdogcat"] },
    { scenario: 'Example 2', hint: '"catdog" = "cat" + "dog".', args: [["cat","dog","catdog"]], expected: ["catdog"] },
    { scenario: 'Single word', hint: 'A word may not count as a single piece of itself — the answer is [].', args: [["a"]], expected: [] },
    { scenario: 'Word is not its own piece', hint: 'Counting the word itself as a valid single piece makes every word "concatenated". Only "ab" qualifies here.', args: [["a","b","ab","cd"]], expected: ["ab"] },
    { scenario: 'Pieces reused', hint: 'The same piece can be used several times: "aa", "aaa", "aaaa" are all built from "a".', args: [["a","aa","aaa","aaaa"]], expected: ["aa","aaa","aaaa"] },
    { scenario: 'Greedy longest piece fails', hint: '"abcd" = "abc" + "d"; also "abc" = "ab" + "c". Try every piece that starts at a position, not just the longest.', args: [["abc","ab","c","d","abcd"]], expected: ["abc","abcd"] },
    { scenario: 'Leftover suffix', hint: '"xyz" leaves "z" unmatched — no valid split.', args: [["x","y","xyz"]], expected: [] },
    { scenario: 'Overlapping pieces', hint: '"aba" is not "ab" + "a" because "a" is not in the list; "abab" and "ababab" use "ab" repeatedly.', args: [["ab","abab","ababab","ba","aba"]], expected: ["abab","ababab"] },
    { scenario: 'Three or more pieces', hint: '"abcdef" needs three pieces in a row — keep counting after the second piece.', args: [["ab","cd","ef","abcdef","abcd","cdx"]], expected: ["abcdef","abcd"] },
    { scenario: 'No concatenations', hint: 'All words have the same length, so none can be built from shorter ones.', args: [["abc","def","ghi","jkl"]], expected: [] },
    { scenario: 'Exponential trap "aaa…ab"', hint: 'No memoisation: "aaa…ab" has 2^28 ways to split the a\'s and every one fails at "b". Memoise "can position i be completed?".', argsGen: "() => [[...Array.from({ length: 29 }, (_, i) => 'a'.repeat(i + 1)), 'a'.repeat(29) + 'b']]", expected: ["aa","aaa","aaaa","aaaaa","aaaaaa","aaaaaaa","aaaaaaaa","aaaaaaaaa","aaaaaaaaaa","aaaaaaaaaaa","aaaaaaaaaaaa","aaaaaaaaaaaaa","aaaaaaaaaaaaaa","aaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaaa"], timeLimitMs: 1000 },
    { scenario: 'Large (n = 10^4)', hint: '10^4 words with total length ≈ 10^5, including the "aaa…ab" trap. A trie walk plus memoised DP per word stays near O(total length · 30).', argsGen: "() => { let s = 11; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const set = new Set(); while (set.size < 9900) { let w = ''; for (let k = 0; k < 10; k++) w += String.fromCharCode(98 + (rnd() % 25)); set.add(w); } const words = [...set]; for (let k = 0; k < 5; k++) words.push(words[k * 3] + words[k * 3 + 1]); for (let k = 1; k <= 29; k++) words.push('a'.repeat(k)); words.push('a'.repeat(29) + 'b'); return [words]; }", expected: ["ywmfrlcxozoklvfzfgtv","jsdpkqhwikukkxwbbrzl","chinscjpfnjqdyjzpwwo","ghzovfqycqymnwybjqtt","wolkoyvfctlcxsgtfdke","aa","aaa","aaaa","aaaaa","aaaaaa","aaaaaaa","aaaaaaaa","aaaaaaaaa","aaaaaaaaaa","aaaaaaaaaaa","aaaaaaaaaaaa","aaaaaaaaaaaaa","aaaaaaaaaaaaaa","aaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaaa"], timeLimitMs: 1500 },
  ],

  solution: {
    code: `function findAllConcatenatedWordsInADict(words) {
  const root = { children: new Map(), isEnd: false };
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), isEnd: false });
      node = node.children.get(ch);
    }
    node.isEnd = true;
  }

  const result = [];
  for (const w of words) {
    const n = w.length;
    const memo = new Array(n + 1).fill(undefined);
    // ok(start): can w[start..] be split into dictionary words?
    const ok = (start) => {
      if (start === n) return true;
      if (memo[start] !== undefined) return memo[start];
      let node = root;
      for (let i = start; i < n; i++) {
        node = node.children.get(w[i]);
        if (!node) break;                                  // no word continues this way
        const wholeWord = start === 0 && i === n - 1;      // w itself does not count
        if (node.isEnd && !wholeWord && ok(i + 1)) return (memo[start] = true);
      }
      return (memo[start] = false);
    };
    if (ok(0)) result.push(w);
  }
  return result;
}`,
  },
  dryRun: {
    columns: ['call', 'trie walk from start', 'word ends found', 'result'],
    rows: [
      ['ok(0) on "catsdogcats"', 'c a t s d …', '"cat" (i=2), "cats" (i=3)', 'try ok(3), ok(4)'],
      ['ok(3)', 's → missing', '—', 'false (memo)'],
      ['ok(4)', 'd o g c …', '"dog" (i=6)', 'try ok(7)'],
      ['ok(7)', 'c a t s', '"cat" (i=9), "cats" (i=10)', 'ok(11) = true → true'],
    ],
  },
  complexity: { time: 'O(Σ L²)', space: 'O(S + L)', explanation: 'For each word, each start position is solved once and walks at most L trie nodes. S = total characters (trie); memo and recursion are O(L) per word.' },
  alternative: {
    title: 'Set + word-break DP (shorter words first)',
    md: 'Sort words by length; for each word run word-break DP using a Set of the shorter words seen so far, then add the word to the Set. Easy to write; slices substrings, so O(L³) per word in the worst case.',
    complexity: 'O(Σ L³) time',
  },
  mistakes: [
    'Counting the word itself as a valid single piece (every word would be "concatenated").',
    'No memoisation — "aaaa…ab" style inputs explode exponentially.',
    'Inserting the empty string (older versions of the problem allowed it) and matching zero-length pieces forever.',
  ],
};
