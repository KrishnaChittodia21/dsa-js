export default {
  id: 'word-break',
  title: 'Word Break',
  difficulty: 'Medium',
  order: 6,
  pattern: 'dp-1d-prefix-segmentation',
  tags: ['string', 'dynamic programming', 'hash set'],
  source: { platform: 'LeetCode', number: 139, url: 'https://leetcode.com/problems/word-break/' },

  statement: `Given a string \`s\` and a list of words \`wordDict\`, return \`true\` if \`s\` can be split into a sequence of one or more dictionary words (with no characters left over). Words may be reused any number of times.`,
  examples: [
    { input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true' },
    { input: 's = "applepenapple", wordDict = ["apple","pen"]', output: 'true', explanation: '"apple" is reused.' },
    { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: 'false' },
  ],
  constraints: ['1 <= s.length <= 300', '1 <= wordDict.length <= 1000', '1 <= wordDict[i].length <= 20', 'all words are unique, lowercase'],

  think: `- If the first i characters can be segmented, what is the only thing that matters about HOW they were segmented?
- For dp[i], which last words could end at position i?
- Why is plain backtracking slow on s = "aaaa…ab"?`,
  patternChallenge: {
    options: ['Trie + greedy longest match', '1D DP — Prefix Segmentation', 'Sliding Window', 'Two Pointers'],
    answer: 1,
    explanation: 'dp[i] = some j < i with dp[j] and s[j..i) in the dictionary. Greedy longest match fails (e.g. "cars" with ["car","ca","rs"]: taking "car" leaves "s"). A Trie can speed up the inner loop, but the idea is still DP over prefixes.',
  },
  hints: [
    'Put the words in a Set. dp[0] = true.',
    'dp[i] = true if any j in [max(0, i − maxLen), i) has dp[j] true and s.slice(j, i) in the Set.',
  ],
  approach: `**Brute force:** try every first word, recurse on the rest — exponential for inputs like "aaaa…ab".

**DP over prefixes:** \`dp[i]\` = can \`s[0..i)\` be segmented. The last word is \`s[j..i)\` for some j with \`dp[j]\` true. Base \`dp[0] = true\`. Answer \`dp[n]\`.

Optimisation: words are ≤ 20 characters, so only try \`j ≥ i − maxLen\`. Time O(n · maxLen · maxLen) including slicing/hashing.`,

  functionName: 'wordBreak',
  paramNames: ['s', 'wordDict'],
  starterCode: `/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {boolean}
 */
function wordBreak(s, wordDict) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '"leet" + "code".', args: ['leetcode', ['leet', 'code']], expected: true },
    { scenario: 'Example 2', hint: 'Words may be reused: "apple" + "pen" + "apple".', args: ['applepenapple', ['apple', 'pen']], expected: true },
    { scenario: 'Example 3', hint: 'Every split leaves "og" or similar uncovered — false.', args: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], expected: false },
    { scenario: 'Single letter word', hint: 'The whole string is one word. dp[0] = true (empty prefix) is what lets the first word count.', args: ['a', ['a']], expected: true },
    { scenario: 'Single letter, no match', hint: 'No word matches — false.', args: ['a', ['b']], expected: false },
    { scenario: 'Word longer than string', hint: 'A dictionary word longer than s can never be used; do not read past the end.', args: ['ab', ['abc']], expected: false },
    { scenario: 'Reuse with mixed lengths', hint: '7 = 4 + 3: you must try both word lengths at each position, not stop at the first match.', args: ['aaaaaaa', ['aaaa', 'aaa']], expected: true },
    { scenario: 'Greedy longest match fails', hint: 'Taking the longest prefix "car" leaves "s" unsplittable; "ca" + "rs" works. Try every word ending at each position.', args: ['cars', ['car', 'ca', 'rs']], expected: true },
    { scenario: 'Greedy shortest match fails', hint: 'Taking "a" first leaves "bc"; only "ab" + "c" works.', args: ['abc', ['a', 'ab', 'c']], expected: true },
    { scenario: 'Unused dictionary words', hint: 'Extra words that never match must not change the answer.', args: ['dogs', ['dog', 's', 'gs', 'cat', 'do']], expected: true },
    { scenario: 'Dead end at the end (n = 300)', hint: 'The final "b" makes it impossible, but unmemoized recursion tries every way to split the 299 a’s first — exponential. Mark each start index once.', argsGen: '() => [\'a\'.repeat(299) + \'b\', [\'a\', \'aa\', \'aaa\', \'aaaa\', \'aaaaa\', \'aaaaaa\', \'aaaaaaa\', \'aaaaaaaa\', \'aaaaaaaaa\', \'aaaaaaaaaa\']]', expected: false, timeLimitMs: 1000 },
    { scenario: 'Large dictionary (1000 words)', hint: 'Use a Set for O(1) word lookups — wordDict.includes scans all 1000 words for every substring.', argsGen: '() => { const dict = []; for (let i = 0; dict.length < 1000; i++) { let w = \'\', x = i; do { w += String.fromCharCode(97 + (x % 26)); x = Math.floor(x / 26); } while (x > 0); dict.push(w + \'q\'); } let s = \'\'; for (let i = 0; s.length < 290; i += 37) s += dict[i % 1000]; return [s, dict]; }', expected: true },
  ],

  solution: {
    code: `function wordBreak(s, wordDict) {
  const dict = new Set(wordDict);
  let maxLen = 0;
  for (const w of wordDict) maxLen = Math.max(maxLen, w.length);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;                                   // empty prefix
  for (let i = 1; i <= s.length; i++) {
    for (let j = Math.max(0, i - maxLen); j < i; j++) {
      if (dp[j] && dict.has(s.slice(j, i))) {     // last word is s[j..i)
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}`,
  },
  dryRun: {
    columns: ['i', 'prefix', 'last word found', 'dp[i]'],
    rows: [
      ['4', '"leet"', '"leet" (j = 0)', 'true'],
      ['5–7', '"leetc".."leetcod"', '—', 'false'],
      ['8', '"leetcode"', '"code" (j = 4, dp[4] true)', 'true'],
    ],
  },
  complexity: { time: 'O(n · L²)', space: 'O(n + total dictionary size)', explanation: 'n end positions × up to L start positions × O(L) slice + hash (L = max word length).' },
  alternative: {
    title: 'Memoized DFS on suffixes',
    md: '`can(start)` = can the suffix from start be segmented; memoize by start.',
    code: `function wordBreak(s, wordDict) {
  const dict = new Set(wordDict);
  const memo = new Map();
  const can = (start) => {
    if (start === s.length) return true;
    if (memo.has(start)) return memo.get(start);
    let ok = false;
    for (let end = start + 1; end <= s.length && !ok; end++) {
      if (dict.has(s.slice(start, end)) && can(end)) ok = true;
    }
    memo.set(start, ok);
    return ok;
  };
  return can(0);
}`,
    complexity: 'O(n² · L) time, O(n) space',
  },
  mistakes: ['Forgetting dp[0] = true.', 'Using wordDict.includes (O(k) per lookup) instead of a Set.', 'Greedy longest-word matching (fails on "cars" with ["car","ca","rs"]).'],
};
