// ---- large-test generators (deterministic; used by the timed tests below) ----
// 5000 words "a"×20 + 5-letter code of an EVEN number k < 10^4, then 4999 searches for codes j < 10^4:
// plain or with dots on the leading a's → true iff j is even; with a dot on the last letter → always true.
const bigDict = () => {
  const code = (k) => String(k).padStart(5, '0').split('').map((d) => 'bcdefghijk'[d]).join('');
  const ops = ['WordDictionary'], args = [[]], expected = [null];
  for (let k = 0; k < 10000; k += 2) { ops.push('addWord'); args.push(['a'.repeat(20) + code(k)]); expected.push(null); }
  let s = 17;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  for (let q = 0; q < 4999; q++) {
    const j = rnd() % 10000, type = q % 3;
    let w = 'a'.repeat(20) + code(j);
    if (type === 1) w = '..' + w.slice(2);
    if (type === 2) w = w.slice(0, 24) + '.';
    ops.push('search'); args.push([w]); expected.push(type === 2 || j % 2 === 0);
  }
  return { ops, args, expected };
};
// ---- end generators ----

export default {
  id: 'design-add-and-search-words-data-structure',
  title: 'Design Add and Search Words Data Structure',
  difficulty: 'Medium',
  order: 6,
  pattern: 'trie-wildcard-dfs',
  kind: 'design',
  tags: ['trie', 'design', 'dfs', 'string'],
  source: { platform: 'LeetCode', number: 211, url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/' },

  statement: `Design a class \`WordDictionary\`:

- \`addWord(word)\` — stores \`word\`;
- \`search(word)\` — returns \`true\` if some stored word **matches** \`word\`, where each \`'.'\` in \`word\` matches **any single letter**.`,
  examples: [
    { input: 'addWord("bad"), addWord("dad"), addWord("mad"), search("pad"), search("bad"), search(".ad"), search("b..")', output: '[null,null,null,null,false,true,true,true]' },
  ],
  constraints: ['1 <= word.length <= 25', 'addWord words are lowercase letters', 'search words are lowercase letters or "."', 'At most 2 dots per search', 'At most 10^4 calls'],

  think: `- Without dots this is a normal trie search. What changes at a \`'.'\`?
- How many children might you have to try at a dot, and when can you stop trying?
- What is the base case of the recursion?`,
  patternChallenge: {
    options: ['Hash Set with every possible expansion of dots', 'Trie — Prefix Tree (single walk)', 'Trie — DFS over branches (wildcards)', 'Regular expression over a joined string'],
    answer: 2,
    explanation: 'A dot can match any child, so the search must branch: DFS over the trie. A single walk cannot branch; expanding dots into a Set costs 26^dots per query and a regex scan over all words is O(total length).',
  },
  hints: [
    'Use a normal trie for addWord.',
    'search = dfs(node, i): if i === word.length return node.isEnd; if word[i] is "." try every child with dfs(child, i + 1); otherwise follow the matching child.',
  ],
  approach: `**Brute force:** store words in an array; for each query compare with every word of the same length, treating "." as a match → O(n · L) per search.

**Trie + DFS:**
- \`addWord\`: ordinary trie insert, O(L).
- \`search\`: \`dfs(node, i)\`:
  - \`i === word.length\` → return \`node.isEnd\`;
  - \`word[i] === '.'\` → return true if **any** child satisfies \`dfs(child, i + 1)\`;
  - else → follow \`node.children.get(word[i])\` or return false.

Without dots this is O(L). With d dots it explores at most 26^d branches (d ≤ 2 here), pruned by missing children.`,

  className: 'WordDictionary',
  starterCode: `class WordDictionary {
  constructor() {
    
  }

  /** @param {string} word */
  addWord(word) {
    
  }

  /** @param {string} word @return {boolean} */
  search(word) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "pad" is missing; ".ad" and "b.." match stored words.', ops: ["WordDictionary","addWord","addWord","addWord","search","search","search","search"], args: [[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]], expected: [null,null,null,null,false,true,true,true] },
    { scenario: 'All dots', hint: '"..." matches any 3-letter word; "...." needs a 4-letter word.', ops: ["WordDictionary","addWord","search","search"], args: [[],["bad"],["..."],["...."]], expected: [null,null,true,false] },
    { scenario: 'Single letter word', hint: '"." matches "a"; "a." is too long.', ops: ["WordDictionary","addWord","search","search","search"], args: [[],["a"],["."],["a."],["a"]], expected: [null,null,true,false,true] },
    { scenario: 'Search on empty dictionary', hint: 'Nothing has been added yet — every search is false (and must not crash).', ops: ["WordDictionary","search","search"], args: [[],["."],["a"]], expected: [null,false,false] },
    { scenario: 'Dot must try all children', hint: 'Returning the first child\'s result at a dot is wrong: ".ad" must try "b" (fails) and then "m".', ops: ["WordDictionary","addWord","addWord","search","search","search"], args: [[],["bat"],["mad"],[".ad"],[".a."],["..d"]], expected: [null,null,null,true,true,true] },
    { scenario: 'Prefix is not a match', hint: 'Returning true when the pattern ends (instead of node.isEnd) counts prefixes: "ab" matches only because "ab" was added.', ops: ["WordDictionary","addWord","search","search","addWord","search","search"], args: [[],["abc"],["ab"],["a."],["ab"],["ab"],["a."]], expected: [null,null,false,false,null,true,true] },
    { scenario: 'Longer and shorter words', hint: '"ab." matches "abc", "a." matches "ab" — lengths must agree exactly.', ops: ["WordDictionary","addWord","addWord","search","search","search"], args: [[],["abc"],["ab"],["ab."],["a."],["abc."]], expected: [null,null,null,true,true,false] },
    { scenario: 'Dot in the middle', hint: 'A dot between letters: "c.t" matches "cut"; "c.r" does not.', ops: ["WordDictionary","addWord","addWord","search","search","search","search"], args: [[],["cut"],["cart"],["c.t"],["c.r"],["c..t"],["ca.t"]], expected: [null,null,null,true,false,true,true] },
    { scenario: 'Two dots at the end', hint: 'Dots at the last positions still need the word to end exactly there.', ops: ["WordDictionary","addWord","search","search","search"], args: [[],["hello"],["hel.."],["hell.."],["he..."]], expected: [null,null,true,false,true] },
    { scenario: 'Duplicate adds', hint: 'Adding the same word twice is harmless.', ops: ["WordDictionary","addWord","addWord","search","search","search"], args: [[],["xy"],["xy"],["xy"],["x."],[".z"]], expected: [null,null,null,true,true,false] },
    { scenario: 'Search before and after add', hint: 'A search reflects only the words added so far.', ops: ["WordDictionary","search","addWord","search","search"], args: [[],["cat"],["cat"],["cat"],["c.t"]], expected: [null,false,null,true,true] },
    { scenario: 'Max length 25', hint: '25-letter words; the dot is in the final position.', ops: ["WordDictionary","addWord","search","search","search"], args: [[],["abcdefghijklmnopqrstuvwxy"],["abcdefghijklmnopqrstuvwx."],["abcdefghijklmnopqrstuvwxz"],[".bcdefghijklmnopqrstuvwxy"]], expected: [null,null,true,false,true] },
    { scenario: 'Large (10^4 calls, long words)', hint: 'Comparing a search against every stored word costs 5000 words × 25 letters per call. Walk the trie: only dots branch, and at most two per search.', opsGen: String(bigDict), timeLimitMs: 400 },
  ],

  solution: {
    code: `class WordDictionary {
  constructor() {
    this.root = { children: new Map(), isEnd: false };
  }

  addWord(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), isEnd: false });
      node = node.children.get(ch);
    }
    node.isEnd = true;
  }

  search(word) {
    const dfs = (node, i) => {
      if (i === word.length) return node.isEnd;
      const ch = word[i];
      if (ch === '.') {
        for (const child of node.children.values()) {
          if (dfs(child, i + 1)) return true;   // any matching branch is enough
        }
        return false;
      }
      const next = node.children.get(ch);
      return next !== undefined && dfs(next, i + 1);
    };
    return dfs(this.root, 0);
  }
}`,
  },
  dryRun: {
    columns: ['search ".ad"', 'node', 'action'],
    rows: [['i = 0, "."', 'root', 'try children b, d, m'], ['i = 1, "a"', 'b', 'follow a'], ['i = 2, "d"', 'ba', 'follow d'], ['i = 3', 'bad', 'isEnd → true (stop trying d, m)']],
  },
  complexity: { time: 'addWord O(L); search O(L) without dots, up to O(26^d · L) with d dots', space: 'O(total characters)', explanation: 'Recursion depth is at most L (≤ 25).' },
  alternative: {
    title: 'Bucket words by length',
    md: 'Map length → list of words; a search compares only with words of the same length, treating "." as a wildcard. Simple, O(k · L) per query where k = words of that length.',
    complexity: 'O(k · L) per search',
  },
  mistakes: [
    'Returning the result of the first child at a dot instead of trying all children.',
    'Checking `i === word.length` but returning true instead of node.isEnd (prefix matches would count).',
    'Storing "." in the trie during addWord (only search contains dots).',
  ],
};
