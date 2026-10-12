export default {
  id: 'longest-common-prefix',
  title: 'Longest Common Prefix',
  difficulty: 'Easy',
  order: 1,
  pattern: 'trie-prefix-tree',
  tags: ['string', 'trie'],
  source: { platform: 'LeetCode', number: 14, url: 'https://leetcode.com/problems/longest-common-prefix/' },

  statement: `Given an array of strings \`strs\`, return the **longest prefix shared by all of them**. If they share no prefix, return \`""\`.`,
  examples: [
    { input: 'strs = ["flower","flow","flight"]', output: '"fl"' },
    { input: 'strs = ["dog","racecar","car"]', output: '""' },
  ],
  constraints: ['1 <= strs.length <= 200', '0 <= strs[i].length <= 200', 'strs[i] consists of lowercase English letters'],

  think: `- If you inserted every string into a trie, what would the shared prefix look like in the tree?
- When does the shared path stop — which two situations end it?
- Is building a trie actually necessary for a single question like this?`,
  patternChallenge: {
    options: ['Sliding Window', 'Trie — Prefix Tree', 'Two Pointers', 'Hash Map (complement lookup)'],
    answer: 1,
    explanation: 'In a trie of all strings, the common prefix is the path from the root along which every node has exactly one child and no word ends. (Direct character-by-character comparison is an equally good, simpler solution for a single query.)',
  },
  hints: [
    'Compare characters column by column: position 0 of every string, then position 1, …',
    'Trie view: walk from the root while the node has exactly one child and is not the end of a word.',
  ],
  approach: `**Vertical scan (simplest):** for i = 0, 1, …, check that every string has character \`strs[0][i]\` at position i; stop at the first mismatch or when a string ends. O(S) where S = total characters.

**Trie view:** insert all strings. The common prefix is the chain from the root where each node has **one child** and **no word ends** there (a word ending means some string is exhausted). Same O(S), more memory — but it generalises: the same trie answers "longest common prefix of any subset" or supports future insertions.`,

  functionName: 'longestCommonPrefix',
  paramNames: ['strs'],
  starterCode: `/**
 * @param {string[]} strs
 * @return {string}
 */
function longestCommonPrefix(strs) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: all three share "fl".', args: [["flower","flow","flight"]], expected: "fl" },
    { scenario: 'Example 2', hint: 'The first letters already differ — return "".', args: [["dog","racecar","car"]], expected: "" },
    { scenario: 'Single string', hint: 'With one string, the whole string is the common prefix.', args: [["a"]], expected: "a" },
    { scenario: 'Contains empty string', hint: 'Not handling an empty string in the input: the answer must be "".', args: [["","b"]], expected: "" },
    { scenario: 'Only an empty string', hint: 'strs = [""] — the prefix is "" and nothing should crash.', args: [[""]], expected: "" },
    { scenario: 'Whole word is the prefix', hint: 'A whole string can be the prefix ("ab", "a" → "a"): stop as soon as any word ends.', args: [["ab","a"]], expected: "a" },
    { scenario: 'Shortest word in the middle', hint: 'The shortest word is not first or last; its end limits the prefix.', args: [["abcdef","abc","abcdxy"]], expected: "abc" },
    { scenario: 'Long shared prefix', hint: 'Six shared letters before the strings diverge.', args: [["interspecies","interstellar","interstate"]], expected: "inters" },
    { scenario: 'All identical', hint: 'Identical strings — the prefix is the full string.', args: [["same","same","same"]], expected: "same" },
    { scenario: 'Differ at last letter', hint: 'Only the final letters differ.', args: [["abc","abd","abe"]], expected: "ab" },
    { scenario: 'Sorting trap', hint: 'If you sort and compare first and last, sort lexicographically — "b" sorts after "abc", so the answer is "".', args: [["b","abc","ab"]], expected: "" },
    { scenario: 'Max size (200 × 200)', hint: '200 strings of length 200 that agree on 199 letters, except one that stops at 150.', argsGen: "() => [Array.from({ length: 200 }, (_, i) => (i === 137 ? 'q'.repeat(150) : 'q'.repeat(199) + String.fromCharCode(97 + (i % 26))))]", expected: "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" },
  ],

  solution: {
    code: `function longestCommonPrefix(strs) {
  // Build a trie of all strings.
  const root = { children: new Map(), isEnd: false };
  for (const s of strs) {
    let node = root;
    for (const ch of s) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), isEnd: false });
      node = node.children.get(ch);
    }
    node.isEnd = true;
  }
  // Follow the single-child chain until a branch or a word end.
  let prefix = '';
  let node = root;
  while (node.children.size === 1 && !node.isEnd) {
    const [ch, next] = node.children.entries().next().value;
    prefix += ch;
    node = next;
  }
  return prefix;
}`,
  },
  dryRun: {
    columns: ['node (prefix)', 'children', 'isEnd', 'continue?'],
    rows: [['root ("")', '{f}', 'no', 'yes'], ['"f"', '{l}', 'no', 'yes'], ['"fl"', '{o, i}', 'no', 'no — branch → answer "fl"']],
  },
  complexity: { time: 'O(S)', space: 'O(S)', explanation: 'S = total number of characters. Building the trie touches each once; the walk is at most the shortest string. The vertical scan needs only O(1) extra space.' },
  alternative: {
    title: 'Vertical scanning — O(1) extra space',
    code: `function longestCommonPrefix(strs) {
  for (let i = 0; i < strs[0].length; i++) {
    const ch = strs[0][i];
    for (const s of strs) if (i >= s.length || s[i] !== ch) return strs[0].slice(0, i);
  }
  return strs[0];
}`,
    md: 'Best choice for a one-off question; stops at the first mismatch.',
    complexity: 'O(S) time, O(1) space',
  },
  mistakes: [
    'Forgetting that a whole string can be the prefix ("ab", "a" → "a"): stop when a word ends.',
    'Not handling an empty string in the input (answer is "").',
    'Sorting and comparing only first and last strings without explaining why it works (it does: they are the most different).',
  ],
};
