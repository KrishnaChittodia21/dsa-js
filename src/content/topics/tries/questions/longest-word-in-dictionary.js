export default {
  id: 'longest-word-in-dictionary',
  title: 'Longest Word in Dictionary',
  difficulty: 'Medium',
  order: 3,
  pattern: 'trie-prefix-tree',
  tags: ['trie', 'string', 'dfs'],
  source: { platform: 'LeetCode', number: 720, url: 'https://leetcode.com/problems/longest-word-in-dictionary/' },

  statement: `Given an array of strings \`words\`, find the longest word that can be **built one character at a time** from other words in the array — i.e. every prefix of it (\`"w"\`, \`"wo"\`, \`"wor"\`, …) must also be in \`words\`.

If several words have the maximum length, return the lexicographically smallest. If there is none, return \`""\`.`,
  examples: [
    { input: 'words = ["w","wo","wor","worl","world"]', output: '"world"' },
    { input: 'words = ["a","banana","app","appl","ap","apply","apple"]', output: '"apple"', explanation: '"apply" is also buildable, but "apple" is smaller.' },
  ],
  constraints: ['1 <= words.length <= 1000', '1 <= words[i].length <= 30', 'lowercase English letters'],

  think: `- In a trie of all words, what does "every prefix is a word" mean for the path to the word?
- Which nodes are you allowed to walk through?
- In what order should you visit children so that ties are resolved lexicographically without extra work?`,
  patternChallenge: {
    options: ['Trie — Prefix Tree (DFS through end-of-word nodes)', 'Sliding Window', 'Heap — Top K', 'Two Pointers'],
    answer: 0,
    explanation: 'A buildable word is a trie path whose every node is an end-of-word node. DFS only through such nodes, children in alphabetical order. (Sorting + Set is an alternative.)',
  },
  hints: [
    'Insert all words. Then DFS from the root, stepping only into children that have isEnd = true.',
    'Visit children a → z and only replace the best answer when the depth is strictly greater — the first word found at a given length is the smallest.',
  ],
  approach: `**Brute force:** for each word, check all its prefixes in a Set → O(Σ L²) (slicing prefixes). Workable here.

**Sort + Set:** sort words; a word is buildable if \`word.slice(0, -1)\` is already known buildable. Track the best.

**Trie + DFS:** insert everything (Array(26) children for alphabetical order). DFS from the root, only entering children with \`isEnd\`. The depth of a node is its word length. Since children are visited a → z, the first node reached at a new maximum depth is the lexicographically smallest of that length. O(S).`,

  functionName: 'longestWord',
  paramNames: ['words'],
  starterCode: `/**
 * @param {string[]} words
 * @return {string}
 */
function longestWord(words) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: each step "w" → "world" is a word.', args: [["w","wo","wor","worl","world"]], expected: "world" },
    { scenario: 'Example 2', hint: '"apply" and "apple" are both buildable with length 5; the lexicographically smaller "apple" wins.', args: [["a","banana","app","appl","ap","apply","apple"]], expected: "apple" },
    { scenario: 'Single one-letter word', hint: 'A one-letter word is buildable on its own (its only prefix is itself).', args: [["a"]], expected: "a" },
    { scenario: 'No buildable word', hint: '"abc" lacks "a" and "ab" — return "".', args: [["abc"]], expected: "" },
    { scenario: 'Longest is not buildable', hint: 'Returning the longest word without checking its prefixes: "banana" is longest but "b" is missing.', args: [["banana","a","ap","app"]], expected: "app" },
    { scenario: 'Gap in the chain', hint: 'Descending into children that are not words breaks the chain: "abcd" needs "abc", which is missing.', args: [["a","ab","abcd","abcde","x","xy","xyz"]], expected: "xyz" },
    { scenario: 'Mixed chains', hint: 'Several partial chains; only "yodn" is complete at length 4.', args: [["yo","ew","fc","zrc","yodn","fcm","qm","qmo","fcmz","z","ewq","yod","ewqz","y"]], expected: "yodn" },
    { scenario: 'Tie on length', hint: 'Updating the best on equal length breaks the tie rule: "latte" and "mocha" tie, "latte" is smaller.', args: [["m","mo","moc","moch","mocha","l","la","lat","latt","latte","c","ca","cat"]], expected: "latte" },
    { scenario: 'Longest chain wins', hint: '"breakfast" (9) beats "dinner" (6) and "lunch" (5).', args: [["b","br","bre","brea","break","breakf","breakfa","breakfas","breakfast","l","lu","lun","lunc","lunch","d","di","din","dinn","dinne","dinner"]], expected: "breakfast" },
    { scenario: 'All single letters', hint: 'Every word has length 1 — the smallest letter wins.', args: [["b","a","c"]], expected: "a" },
    { scenario: 'Duplicates in input', hint: 'Duplicate words are fine and change nothing.', args: [["a","a","ab","ab","abc"]], expected: "abc" },
    { scenario: 'Max size (1000 words)', hint: 'A 30-letter chain hidden among 970 random words, plus a second 30-letter chain that is larger lexicographically.', argsGen: "() => { let s = 31; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); const w = []; for (let k = 0; k < 940; k++) { let x = ''; const L = 2 + (rnd() % 29); for (let j = 0; j < L; j++) x += 'abcdefghij'[rnd() % 10]; w.push(x); } const a = 'kmnopqrstuvwxyzkmnopqrstuvwxyz', b = 'kmnopqrstuvwxyzkmnopqrstuvwxzz'; for (let L = 1; L <= 30; L++) { w.push(b.slice(0, L)); w.push(a.slice(0, L)); } return [w]; }", expected: "kmnopqrstuvwxyzkmnopqrstuvwxyz" },
  ],

  solution: {
    code: `function longestWord(words) {
  const newNode = () => ({ next: new Array(26).fill(null), word: null });
  const root = newNode();
  for (const w of words) {
    let node = root;
    for (const ch of w) node = node.next[ch.charCodeAt(0) - 97] ??= newNode();
    node.word = w;                         // mark end of word (store it for output)
  }

  let best = '';
  const dfs = (node) => {
    for (let i = 0; i < 26; i++) {         // a → z: first hit at a length is the smallest
      const child = node.next[i];
      if (!child || child.word === null) continue;   // prefix must itself be a word
      if (child.word.length > best.length) best = child.word;
      dfs(child);
    }
  };
  dfs(root);
  return best;
}`,
  },
  dryRun: {
    columns: ['visit', 'isEnd?', 'best'],
    rows: [['a', 'yes', 'a'], ['ap', 'yes', 'ap'], ['app', 'yes', 'app'], ['appl', 'yes', 'appl'], ['apple', 'yes', 'apple'], ['apply', 'yes (same length, later) → keep apple', 'apple'], ['b (banana path)', 'no "b" word → skipped', 'apple']],
  },
  complexity: { time: 'O(S)', space: 'O(S · 26)', explanation: 'S = total characters; each node is created once and visited at most once. Array(26) children cost 26 slots per node.' },
  alternative: {
    title: 'Sort + Set',
    code: `function longestWord(words) {
  const ok = new Set(['']);
  let best = '';
  for (const w of [...words].sort()) {
    if (ok.has(w.slice(0, -1))) {
      ok.add(w);
      if (w.length > best.length) best = w;
    }
  }
  return best;
}`,
    md: 'Sorting guarantees prefixes come first and ties are met in lexicographic order.',
    complexity: 'O(S log n) time',
  },
  mistakes: [
    'Returning the longest word without checking that all its prefixes exist.',
    'Updating the best on equal length (breaks the lexicographic tie rule when visiting a → z).',
    'Descending into children that are not words (they break the chain).',
  ],
};
