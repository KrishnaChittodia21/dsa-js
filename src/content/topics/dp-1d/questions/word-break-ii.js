export default {
  id: 'word-break-ii',
  title: 'Word Break II',
  difficulty: 'Hard',
  order: 1,
  pattern: 'dp-1d-prefix-segmentation',
  tags: ['string', 'dynamic programming', 'backtracking', 'memoization'],
  source: { platform: 'LeetCode', number: 140, url: 'https://leetcode.com/problems/word-break-ii/' },

  statement: `Given a string \`s\` and a dictionary \`wordDict\`, insert spaces into \`s\` to form sentences in which **every word is in the dictionary**. Words may be reused.

Return **all** such sentences, in any order.`,
  examples: [
    { input: 's = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]', output: '["cats and dog","cat sand dog"]' },
    { input: 's = "pineapplepenapple", wordDict = ["apple","pen","applepen","pine","pineapple"]', output: '["pine apple pen apple","pineapple pen apple","pine applepen apple"]' },
    { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: '[]' },
  ],
  constraints: ['1 <= s.length <= 20', '1 <= wordDict.length <= 1000', '1 <= wordDict[i].length <= 10', 'all words unique, lowercase', 'at most 10^5 sentences in the answer'],

  think: `- If you know all sentences for the suffix starting at index j, how do you build sentences for a start i < j?
- Which suffixes get re-explored many times in plain backtracking?
- What should the function return for the empty suffix?`,
  patternChallenge: {
    options: ['1D DP — Prefix Segmentation (memoized DFS)', 'Trie + BFS', 'Greedy longest match', 'Sliding Window'],
    answer: 0,
    explanation: 'Same states as Word Break (a start index), but each state stores a LIST of sentences. Memoizing by start index avoids re-exploring shared suffixes. A Trie can speed up matching but does not remove the need for memoization.',
  },
  hints: [
    'sentences(i) = for each word w = s.slice(i, j) in the dictionary: for each tail in sentences(j): w + " " + tail (or just w when j === n).',
    'Memoize sentences(i) in a Map. Base case: sentences(n) = [""] (one empty continuation).',
  ],
  approach: `**Brute force:** backtracking tries every split and rebuilds sentences for the same suffix again and again.

**Memoized DFS over suffixes:** \`sentences(i)\` returns all sentences for \`s[i..]\`.
- Base: \`sentences(n) = [""]\` — one way to finish: say nothing.
- For every end j with \`s.slice(i, j)\` in the dictionary, prefix that word to each sentence of \`sentences(j)\`.

Each start index is expanded once. The output itself can be exponential (e.g. "aaaa…" with ["a","aa"]), so the time is output-sensitive; memoization removes the *redundant* exploration, notably for suffixes that lead nowhere (they return [] once and are never retried).

Tip: run the boolean Word Break DP first if you want to prune starts that cannot finish.`,

  functionName: 'wordBreak',
  paramNames: ['s', 'wordDict'],
  compare: 'unordered',
  starterCode: `/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {string[]}
 */
function wordBreak(s, wordDict) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two sentences: "cats and dog" and "cat sand dog".', args: ['catsanddog', ['cat', 'cats', 'and', 'sand', 'dog']], expected: ['cat sand dog', 'cats and dog'] },
    { scenario: 'Example 2', hint: 'Three sentences; words can be reused ("apple" twice).', args: ['pineapplepenapple', ['apple', 'pen', 'applepen', 'pine', 'pineapple']], expected: ['pine apple pen apple', 'pine applepen apple', 'pineapple pen apple'] },
    { scenario: 'Example 3', hint: 'No full split exists — return an empty list.', args: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], expected: [] },
    { scenario: 'Single letter word', hint: 'One sentence with one word. If your base case returns [] instead of [""], no sentence is ever built.', args: ['a', ['a']], expected: ['a'] },
    { scenario: 'No split possible', hint: 'The "a" is not a word — return [].', args: ['ab', ['b']], expected: [] },
    { scenario: 'Whole string or pieces', hint: 'Both "leetcode" and "leet code" — and no trailing space when the tail is empty.', args: ['leetcode', ['leet', 'code', 'leetcode']], expected: ['leet code', 'leetcode'] },
    { scenario: 'Every split counts', hint: 'All 5 compositions of 4 into 1s and 2s, each as its own sentence.', args: ['aaaa', ['a', 'aa']], expected: ['a a a a', 'a a aa', 'a aa a', 'aa a a', 'aa aa'] },
    { scenario: 'Overlapping words', hint: '"apple pie", "applepie" and "app lepie" — try every word that starts at each index.', args: ['applepie', ['apple', 'pie', 'applepie', 'app', 'lepie']], expected: ['app lepie', 'apple pie', 'applepie'] },
    { scenario: 'Dead end at the end', hint: 'No sentence ends with "b". Without memoization or pruning, backtracking explores every split of the a’s first.', args: ['aaaaaaaaaaaaaaaaaaab', ['a', 'aa', 'aaa', 'aaaa', 'aaaaa']], expected: [] },
    { scenario: 'Maximum length string', hint: 'Twenty characters with several ways to split each half.', args: ['catsanddogcatsanddog', ['cat', 'cats', 'and', 'sand', 'dog']], expected: ['cat sand dog cat sand dog', 'cat sand dog cats and dog', 'cats and dog cat sand dog', 'cats and dog cats and dog'] },
    { scenario: 'Large dictionary, few matches', hint: '1000 unrelated words: use a Set so each substring check is O(1).', argsGen: '() => { const dict = [\'ab\', \'abc\', \'cd\', \'d\']; for (let i = 0; dict.length < 1000; i++) dict.push(\'zz\' + i.toString(36)); return [\'abcdabcd\', dict]; }', expected: ['ab cd ab cd', 'ab cd abc d', 'abc d ab cd', 'abc d abc d'] },
  ],

  solution: {
    code: `function wordBreak(s, wordDict) {
  const dict = new Set(wordDict);
  const memo = new Map();                  // start index -> list of sentences for s[start..]
  function sentences(start) {
    if (start === s.length) return [''];   // one way to finish: nothing left
    if (memo.has(start)) return memo.get(start);
    const result = [];
    for (let end = start + 1; end <= s.length; end++) {
      const word = s.slice(start, end);
      if (!dict.has(word)) continue;
      for (const tail of sentences(end)) {
        result.push(tail === '' ? word : word + ' ' + tail);
      }
    }
    memo.set(start, result);
    return result;
  }
  return sentences(0);
}`,
  },
  dryRun: {
    columns: ['call', 'words tried', 'result'],
    rows: [
      ['sentences(10)', '—', '[""]'],
      ['sentences(7)', '"dog"', '["dog"]'],
      ['sentences(4)', '"and" → sentences(7)', '["and dog"]'],
      ['sentences(3)', '"sand" → sentences(7)', '["sand dog"]'],
      ['sentences(0)', '"cat" → (3), "cats" → (4)', '["cat sand dog", "cats and dog"]'],
    ],
    note: 's = "catsanddog".',
  },
  complexity: { time: 'O(n² + output size · n)', space: 'O(output size · n)', explanation: 'n start states × n ends for matching; building the sentences costs proportional to their total length, which can be exponential in n.' },
  alternative: {
    title: 'Boolean DP to prune, then backtrack',
    md: 'Compute `canEnd[i]` = can the suffix from i be segmented (Word Break). Backtrack only into positions where the suffix is segmentable, so dead ends are never explored.',
    code: `function wordBreak(s, wordDict) {
  const dict = new Set(wordDict), n = s.length;
  const ok = new Array(n + 1).fill(false);
  ok[n] = true;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j <= n; j++) if (ok[j] && dict.has(s.slice(i, j))) { ok[i] = true; break; }
  }
  const out = [], path = [];
  const dfs = (i) => {
    if (i === n) { out.push(path.join(' ')); return; }
    for (let j = i + 1; j <= n; j++) {
      const w = s.slice(i, j);
      if (ok[j] && dict.has(w)) { path.push(w); dfs(j); path.pop(); }
    }
  };
  if (ok[0]) dfs(0);
  return out;
}`,
    complexity: 'O(n² · L + output) time, O(n) extra space',
  },
  mistakes: [
    'Base case returning [] instead of [""] — then no sentence is ever built.',
    'Adding a trailing space when the tail is empty.',
    'Backtracking without memoization or pruning: "aaaa…ab" explores exponentially many dead ends.',
  ],
};
