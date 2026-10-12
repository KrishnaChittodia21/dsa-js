export default {
  id: 'palindrome-pairs',
  title: 'Palindrome Pairs',
  difficulty: 'Hard',
  order: 4,
  pattern: 'trie-backtracking-search',
  tags: ['trie', 'string', 'palindrome', 'hash map'],
  source: { platform: 'LeetCode', number: 336, url: 'https://leetcode.com/problems/palindrome-pairs/' },

  statement: `You are given an array of **unique** strings \`words\`. A **palindrome pair** is a pair of indices \`[i, j]\` with \`i !== j\` such that \`words[i] + words[j]\` is a palindrome (reads the same backwards).

Return all palindrome pairs, in any order. Note that \`[i, j]\` and \`[j, i]\` are different pairs.`,
  examples: [
    { input: 'words = ["abcd","dcba","lls","s","sssll"]', output: '[[0,1],[1,0],[3,2],[2,4]]', explanation: '"abcddcba", "dcbaabcd", "slls", "llssssll".' },
    { input: 'words = ["bat","tab","cat"]', output: '[[0,1],[1,0]]' },
    { input: 'words = ["a",""]', output: '[[0,1],[1,0]]' },
  ],
  constraints: ['1 <= words.length <= 5000', '0 <= words[i].length <= 300', 'lowercase letters, all unique'],

  think: `- For \`a + b\` to be a palindrome, the beginning of \`a\` must mirror the end of \`b\`. What if you stored every word **reversed** in a trie and walked \`a\` through it?
- When the walk finishes one of the two words first, what must be true about the leftover part of the other word?
- Which extra information can each trie node store so that the "a is shorter" case is answered instantly?`,
  patternChallenge: {
    options: ['Check all pairs', 'Trie — Trie-guided Search (reversed-word trie)', 'Sliding Window', 'Two Pointers on a sorted list'],
    answer: 1,
    explanation: 'Walking each word through a trie of reversed words matches a\'s prefix against b\'s reversed suffix for all b at once; the leftover must be a palindrome. All pairs is O(n² · L); sorting and windows do not capture the mirror condition.',
  },
  hints: [
    'Insert each word reversed. At each node keep `palBelow`: indices of words whose REMAINING (not yet inserted) part is a palindrome at that point; at the end node store the word index.',
    'For word i, walk its characters: at each step, if a word ends here and the rest of word i is a palindrome → pair [i, thatIndex]. After consuming all of word i, every index in node.palBelow (≠ i) gives [i, k].',
  ],
  approach: `**Brute force:** test every ordered pair → O(n² · L) = 2.5·10⁷ · 600 — too slow.

**Reversed trie.** Let \`a = words[i]\`, \`b = words[j]\`. Write \`rev(b)\` for b reversed.
- **Case 1, |a| ≥ |b|:** \`a = rev(b) + rest\`, and \`rest\` must be a palindrome. Walking \`a\` through the trie of reversed words, you pass the end node of \`rev(b)\` after |b| characters; check that the remaining part of \`a\` is a palindrome.
- **Case 2, |a| < |b|:** \`rev(b) = a + rest\` where \`rest\` (a prefix of b, reversed) must be a palindrome. After consuming all of \`a\`, every word whose reversed form continues below this node with a palindromic remainder qualifies. Precompute this list (\`palBelow\`) during insertion: while inserting \`rev(b)\` at depth d, if \`b[0 .. len−1−d]\` is a palindrome, add j to the current node's list.

Each word is inserted and walked once, with palindrome checks of O(L) at each of O(L) positions → O(n · L²).`,

  functionName: 'palindromePairs',
  paramNames: ['words'],
  starterCode: `/**
 * @param {string[]} words
 * @return {number[][]}
 */
function palindromePairs(words) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: equal-length mirrors plus longer/shorter splits ("s" + "lls", "lls" + "sssll").', args: [["abcd","dcba","lls","s","sssll"]], expected: [[0,1],[1,0],[2,4],[3,2]] },
    { scenario: 'Example 2', hint: 'Only "bat" and "tab" mirror each other; "cat" has no partner.', args: [["bat","tab","cat"]], expected: [[0,1],[1,0]] },
    { scenario: 'Example 3', hint: 'The empty string pairs with every palindrome in both orders.', args: [["a",""]], expected: [[0,1],[1,0]] },
    { scenario: 'Single word', hint: 'One word cannot form a pair — i and j must differ.', args: [["abc"]], expected: [] },
    { scenario: 'Only the empty string', hint: 'A lone "" has no partner. Do not pair a word with itself.', args: [[""]], expected: [] },
    { scenario: 'Single palindrome word', hint: '"aba" + "aba" is a palindrome, but i === j is not allowed.', args: [["aba"]], expected: [] },
    { scenario: 'Empty string with palindromes', hint: 'Forgetting the empty string: "" pairs with "aba" and "c" in both orders, but not with "xy".', args: [["","aba","xy","c"]], expected: [[0,1],[0,3],[1,0],[3,0]] },
    { scenario: 'Equal-length mirror once', hint: 'An equal-length match must be reported once per order. Handling "equal length" in both split loops produces duplicates.', args: [["ab","ba"]], expected: [[0,1],[1,0]] },
    { scenario: 'Single letters and pairs', hint: 'Short words combine with longer ones whose remaining part is a palindrome.', args: [["a","b","ab","ba"]], expected: [[0,3],[1,2],[2,0],[2,3],[3,1],[3,2]] },
    { scenario: 'Palindromes nested', hint: '"aa", "a" and "" all pair with each other in both orders.', args: [["aa","a",""]], expected: [[0,1],[0,2],[1,0],[1,2],[2,0],[2,1]] },
    { scenario: 'Longer word with palindromic tail', hint: '"abc" + "ba" = "abcba": the leftover middle "c" of the longer word must itself be a palindrome.', args: [["abc","ba","cba","b","cb","xyz"]], expected: [[0,1],[0,2],[1,3],[2,0],[3,4],[4,0]] },
    { scenario: 'No pairs at all', hint: 'No combination reads the same backwards — return an empty array.', args: [["abc","def","ghij","xy"]], expected: [] },
    { scenario: 'Large (n = 5000)', hint: '5000 long words: trying every ordered pair is 25 million concatenations plus palindrome checks. Look each word up in a trie of reversed words instead.', argsGen: "() => { const w = Array.from({ length: 4995 }, (_, i) => { let s = 'd'; for (let b = 0; b < 13; b++) s += (i >> b) & 1 ? 'b' : 'c'; return 'a'.repeat(30) + s + 'a'.repeat(30 + (i % 3)); }); for (let i = 0; i < 5; i++) w.push([...w[i * 7]].reverse().join('')); return [w]; }", expected: [[0,4995],[7,4996],[14,4997],[21,4998],[28,4999],[4995,0],[4996,7],[4997,14],[4998,21],[4999,28]], timeLimitMs: 1500 },
  ],

  solution: {
    code: `function palindromePairs(words) {
  const isPal = (s, i, j) => {
    while (i < j) if (s[i++] !== s[j--]) return false;
    return true;
  };
  const newNode = () => ({ children: new Map(), index: -1, palBelow: [] });
  const root = newNode();

  // Insert each word REVERSED. palBelow at a node lists words whose remaining
  // (not yet inserted) prefix is a palindrome.
  words.forEach((w, idx) => {
    let node = root;
    for (let k = w.length - 1; k >= 0; k--) {
      if (isPal(w, 0, k)) node.palBelow.push(idx);
      const ch = w[k];
      if (!node.children.has(ch)) node.children.set(ch, newNode());
      node = node.children.get(ch);
    }
    node.index = idx;
    node.palBelow.push(idx);          // empty remainder is a palindrome
  });

  const out = [];
  words.forEach((w, i) => {
    let node = root;
    for (let k = 0; k < w.length && node; k++) {
      // Case 1: a reversed word ends here and the rest of w is a palindrome
      if (node.index >= 0 && node.index !== i && isPal(w, k, w.length - 1)) out.push([i, node.index]);
      node = node.children.get(w[k]);
    }
    if (!node) return;
    // Case 2: w consumed; words continuing below with a palindromic remainder
    for (const j of node.palBelow) if (j !== i) out.push([i, j]);
  });
  return out;
}`,
    explanation: 'Case 1 only fires while characters of w remain (k < |w|) and case 2 covers equal length and longer b, so no pair is produced twice.',
  },
  dryRun: {
    columns: ['word i', 'walk', 'event', 'pair'],
    rows: [
      ['"lls" (2)', 'l, l, s', 'after consuming, node for rev-path "lls" has palBelow = [4] ("sssll" reversed = "llsss", remainder "ss")', '[2, 4]'],
      ['"s" (3)', 'at root: "" not a word; after "s": node palBelow includes 2 ("lls" reversed = "sll", remainder "ll")', 'case 2', '[3, 2]'],
      ['"abcd" (0)', 'a b c d', 'end node of rev("dcba") = "abcd" → index 1, remainder "" palindrome', '[0, 1]'],
    ],
  },
  complexity: { time: 'O(n · L²)', space: 'O(n · L)', explanation: 'Each word is inserted and walked once; at each of its L positions a palindrome check costs O(L). The trie holds n · L characters.' },
  alternative: {
    title: 'Hash map of reversed words',
    md: 'Map reversed word → index. For each word and each split point k, if the left part is a palindrome and the right part\'s reverse exists → [thatIndex, i]; if the right part is a palindrome and the left part\'s reverse exists → [i, thatIndex]. Also O(n · L²); needs care to avoid duplicate pairs at k = 0 / k = L.',
    complexity: 'O(n · L²) time, O(n · L) space',
  },
  mistakes: [
    'Forgetting the empty string: it pairs with every palindrome in both orders.',
    'Producing duplicate pairs by handling "equal length" in both cases.',
    'Pairing a word with itself (i === j) when the word is a palindrome.',
  ],
};
