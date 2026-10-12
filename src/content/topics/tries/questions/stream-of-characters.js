// ---- large-test generators (deterministic; used by the timed tests below) ----
// 2000 words "<3-letter code> + 197 a's"; the stream is blocks of "<code> + 300 a's", so a query returns true exactly
// 197 letters after a code that is in the dictionary. Comparing every word against the stream is ~200 steps × 2000 words per query.
const bigStream = () => {
  const L = 'bcdefghijklmn';
  const code = (k) => L[k % 13] + L[Math.floor(k / 13) % 13] + L[Math.floor(k / 169) % 13];
  const words = Array.from({ length: 2000 }, (_, k) => code(k) + 'a'.repeat(197));
  const ops = ['StreamChecker'], args = [[words]], expected = [null];
  let s = 3;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  while (ops.length <= 40000) {
    const k = rnd() % 2197;  // codes >= 2000 are not words
    for (const ch of code(k)) { ops.push('query'); args.push([ch]); expected.push(false); }
    for (let j = 1; j <= 300 && ops.length <= 40000; j++) { ops.push('query'); args.push(['a']); expected.push(j === 197 && k < 2000); }
  }
  return { ops, args, expected };
};
// ---- end generators ----

export default {
  id: 'stream-of-characters',
  title: 'Stream of Characters',
  difficulty: 'Hard',
  order: 1,
  pattern: 'trie-backtracking-search',
  kind: 'design',
  tags: ['trie', 'design', 'data stream', 'string'],
  source: { platform: 'LeetCode', number: 1032, url: 'https://leetcode.com/problems/stream-of-characters/' },

  statement: `Design a class \`StreamChecker\`:

- \`new StreamChecker(words)\` — receives a list of words;
- \`query(letter)\` — appends \`letter\` to a character stream and returns \`true\` if **some suffix** of the stream (the last few characters, including the new one) is one of the words.`,
  examples: [
    {
      input: 'StreamChecker(["cd","f","kl"]); query a, b, c, d, e, f, g, h, i, j, k, l',
      output: '[null,false,false,false,true,false,true,false,false,false,false,false,true]',
      explanation: '"cd" ends at d, "f" at f, "kl" at l.',
    },
  ],
  constraints: ['1 <= words.length <= 2000', '1 <= words[i].length <= 200', 'lowercase English letters', 'At most 4 * 10^4 queries'],

  think: `- After each query, the question is about the **end** of the stream. In which direction should you read the stream to check it?
- If you read backwards from the newest letter, how should the words be stored so that the trie walk matches?
- How far back do you ever need to look?`,
  patternChallenge: {
    options: ['Trie — Prefix Tree of forward words, re-walked from every start', 'Trie — Trie-guided Search (reversed words)', 'Sliding Window', 'Hash Set of all suffixes'],
    answer: 1,
    explanation: 'Store words reversed; each query walks the trie from the newest character backwards and stops as soon as the path dies. Forward tries would need a walk from every earlier position; a Set of suffixes would build O(maxLen) strings per query.',
  },
  hints: [
    'Insert every word reversed. Keep the stream history in an array.',
    'On query, walk the trie using history from the last index backwards; return true on an end-of-word node, false when a child is missing or you have looked back maxLen characters.',
  ],
  approach: `**Brute force:** after each letter, check every word with \`stream.endsWith(word)\` → O(total word length) per query.

**Reversed trie:** "the stream ends with w" ⇔ "the reversed stream starts with reversed w". Insert reversed words into a trie. On each query:
- append the letter to \`history\`;
- walk the trie with \`history[last], history[last − 1], …\`;
- return true at the first end-of-word node; false when a child is missing.

A walk never goes deeper than the longest word, so each query is O(maxLen) and usually much less because the walk dies early. Trim the history so it never holds more than maxLen letters that matter.`,

  className: 'StreamChecker',
  starterCode: `class StreamChecker {
  /** @param {string[]} words */
  constructor(words) {
    
  }

  /** @param {character} letter @return {boolean} */
  query(letter) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: "cd" ends at d, "f" at f, "kl" at l.', ops: ["StreamChecker","query","query","query","query","query","query","query","query","query","query","query","query"], args: [[["cd","f","kl"]],["a"],["b"],["c"],["d"],["e"],["f"],["g"],["h"],["i"],["j"],["k"],["l"]], expected: [null,false,false,false,true,false,true,false,false,false,false,false,true] },
    { scenario: 'Single-letter word', hint: 'A one-letter word matches every time that letter arrives, and only then.', ops: ["StreamChecker","query","query","query"], args: [[["a"]],["a"],["b"],["a"]], expected: [null,true,false,true] },
    { scenario: 'Word is a suffix of another', hint: '"b" matches as soon as b arrives even though "ab" also does — return true at the first end-of-word node.', ops: ["StreamChecker","query","query"], args: [[["ab","b"]],["a"],["b"]], expected: [null,false,true] },
    { scenario: 'Match then fail', hint: '"c" after "abc" no longer ends with a word. Each query looks at the current suffix only.', ops: ["StreamChecker","query","query","query","query","query","query","query"], args: [[["abc","xyz"]],["x"],["y"],["z"],["a"],["b"],["c"],["c"]], expected: [null,false,false,true,false,false,true,false] },
    { scenario: 'Overlapping repeats', hint: '"aaa" matches on the third a; then "ba" on the final a.', ops: ["StreamChecker","query","query","query","query","query"], args: [[["aaa","ba"]],["a"],["a"],["a"],["b"],["a"]], expected: [null,false,false,true,false,true] },
    { scenario: 'Run of a then b', hint: 'Nothing matches during the run of a letters; at the final b both "ab" and "aaab" end.', ops: ["StreamChecker","query","query","query","query","query","query"], args: [[["ab","ba","aaab","abab","baa"]],["a"],["a"],["a"],["a"],["a"],["b"]], expected: [null,false,false,false,false,false,true] },
    { scenario: 'Forward trie trap', hint: 'Inserting words forward and walking the history backwards finds "dc", not "cd". The trie must store words reversed.', ops: ["StreamChecker","query","query","query","query"], args: [[["cd"]],["d"],["c"],["d"],["c"]], expected: [null,false,false,true,false] },
    { scenario: 'Word longer than stream', hint: 'Before enough letters arrived, a long word cannot match — do not read before the start of the history.', ops: ["StreamChecker","query","query","query","query"], args: [[["abcde"]],["b"],["c"],["d"],["e"]], expected: [null,false,false,false,false] },
    { scenario: 'Match far in the past', hint: '"abc" appeared earlier but the stream now ends with "x"; only suffixes count.', ops: ["StreamChecker","query","query","query","query","query","query","query"], args: [[["abc"]],["a"],["b"],["c"],["x"],["a"],["b"],["c"]], expected: [null,false,false,true,false,false,false,true] },
    { scenario: 'Same letter repeated', hint: 'Every query after the second "z" ends with "zz".', ops: ["StreamChecker","query","query","query","query","query"], args: [[["zz"]],["z"],["z"],["z"],["z"],["z"]], expected: [null,false,true,true,true,true] },
    { scenario: 'No word ever matches', hint: 'The stream never ends with a word — always false.', ops: ["StreamChecker","query","query","query","query","query","query","query","query"], args: [[["xyz","pq"]],["a"],["b"],["c"],["d"],["e"],["f"],["x"],["y"]], expected: [null,false,false,false,false,false,false,false,false] },
    { scenario: 'Large (4·10^4 queries, long words)', hint: 'Checking every word against the stream is ~2000 words × 200 letters per query. Walk a reversed trie from the newest letter and stop at a missing child or maxLen.', opsGen: String(bigStream), timeLimitMs: 1000 },
  ],

  solution: {
    code: `class StreamChecker {
  constructor(words) {
    this.root = { children: new Map(), isEnd: false };
    this.maxLen = 0;
    for (const w of words) {
      this.maxLen = Math.max(this.maxLen, w.length);
      let node = this.root;
      for (let i = w.length - 1; i >= 0; i--) {      // insert REVERSED
        const ch = w[i];
        if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), isEnd: false });
        node = node.children.get(ch);
      }
      node.isEnd = true;
    }
    this.history = [];
  }

  query(letter) {
    this.history.push(letter);
    if (this.history.length > 2 * this.maxLen) {      // keep only what can still matter
      this.history = this.history.slice(-this.maxLen);
    }
    let node = this.root;
    const h = this.history;
    for (let i = h.length - 1; i >= 0 && i >= h.length - this.maxLen; i--) {
      node = node.children.get(h[i]);
      if (!node) return false;                        // no word ends like this
      if (node.isEnd) return true;
    }
    return false;
  }
}`,
    explanation: 'Trimming at 2·maxLen keeps the amortized cost of slicing O(1) per query.',
  },
  dryRun: {
    columns: ['query', 'history (newest last)', 'walk (backwards)', 'result'],
    rows: [['c', '…a b c', 'reversed words are "dc", "f", "lk": root has no child "c"', 'false'], ['d', '…b c d', 'd → c (isEnd: "cd")', 'true'], ['e', '…c d e', 'e → missing', 'false'], ['f', '…d e f', 'f (isEnd)', 'true']],
  },
  complexity: { time: 'O(W) to build, O(maxLen) per query', space: 'O(W + maxLen)', explanation: 'W = total characters in words. Each query walks at most maxLen trie nodes.' },
  alternative: {
    title: 'Aho-Corasick automaton',
    md: 'Builds failure links over a forward trie so each query is O(1) amortized. The general tool for multi-pattern matching in a stream (covered with string algorithms later); the reversed trie is simpler and fast enough here.',
    complexity: 'O(1) amortized per query',
  },
  mistakes: [
    'Inserting words forward and walking the history backwards (the directions must match).',
    'Walking the whole history on every query instead of stopping at maxLen or a missing child.',
    'Building a new string for the stream on each query (O(n) per query).',
  ],
};
