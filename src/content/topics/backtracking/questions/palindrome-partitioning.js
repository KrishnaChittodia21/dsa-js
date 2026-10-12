export default {
  id: 'palindrome-partitioning',
  title: 'Palindrome Partitioning',
  difficulty: 'Medium',
  order: 10,
  pattern: 'backtracking-string-construction',
  tags: ['backtracking', 'string', 'palindrome'],
  source: { platform: 'LeetCode', number: 131, url: 'https://leetcode.com/problems/palindrome-partitioning/' },

  statement: `Given a string \`s\`, split it into pieces so that **every piece is a palindrome** (reads the same forwards and backwards). Return **all** such splits.

Each split is a list of pieces in their original order; the list of splits may be returned in any order.`,
  examples: [
    { input: 's = "aab"', output: '[["a","a","b"],["aa","b"]]' },
    { input: 's = "a"', output: '[["a"]]' },
  ],
  constraints: ['1 <= s.length <= 16', 's contains only lowercase English letters'],

  think: `- If the first piece is \`s[0..end]\`, what problem is left?
- What does one level of the tree decide — and how many choices does it have?
- How do you avoid exploring a cut whose first piece is not a palindrome?`,
  patternChallenge: {
    options: ['Two Pointers (expand around center)', 'Backtracking — Splitting a string into valid pieces', 'Sliding Window', 'Backtracking — Permutations'],
    answer: 1,
    explanation: '"Return all partitions" → enumerate cut positions: each level chooses where the next piece ends. Expand-around-center only *finds* palindromic substrings; it does not list partitions (though it can be used to precompute which pieces are valid).',
  },
  hints: [
    '`dfs(start)`: if `start === s.length` a full partition is in `path`. Otherwise try every `end` from `start` to `s.length − 1`.',
    'Only recurse when `s.slice(start, end + 1)` is a palindrome (check with two pointers). Push the piece, recurse with `end + 1`, pop.',
  ],
  approach: `**Brute force:** there are 2^(n−1) ways to place cuts. Generate each and check all pieces — O(n · 2ⁿ).

**Backtracking:** choose the first piece, but only if it is a palindrome, then solve the rest recursively. Invalid first pieces are pruned immediately, so large parts of the 2^(n−1) space are never visited.

**Optional speed-up:** precompute \`isPal[i][j]\` with DP (\`s[i] === s[j] && isPal[i+1][j−1]\`) so each check is O(1).`,

  functionName: 'partition',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string[][]}
 */
function partition(s) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: '"aa" is a palindrome piece, so both ["a","a","b"] and ["aa","b"] count.', args: ["aab"], expected: [["aa","b"],["a","a","b"]] },
    { scenario: 'Example 2', hint: 'Smallest input: one character is one palindrome.', args: ["a"], expected: [["a"]] },
    { scenario: 'Odd palindrome whole string', hint: 'The whole string "aba" is one valid piece — your slice end must include the last character (end + 1).', args: ["aba"], expected: [["aba"],["a","b","a"]] },
    { scenario: 'Two equal characters', hint: '"aa" splits as ["a","a"] or stays whole.', args: ["aa"], expected: [["aa"],["a","a"]] },
    { scenario: 'Two different characters', hint: '"ab" is not a palindrome, so only single letters work.', args: ["ab"], expected: [["a","b"]] },
    { scenario: 'No multi-letter palindromes', hint: 'Only the all-single-letters split is valid.', args: ["abc"], expected: [["a","b","c"]] },
    { scenario: 'Even palindrome', hint: '"abba" and the inner "bb" are both palindromes.', args: ["abba"], expected: [["abba"],["a","bb","a"],["a","b","b","a"]] },
    { scenario: 'All same letter', hint: 'Every substring is a palindrome, so all 8 ways to cut "aaaa" are valid. Push a copy of the path.', args: ["aaaa"], expected: [["aaaa"],["a","aaa"],["aa","aa"],["a","a","aa"],["aaa","a"],["a","aa","a"],["aa","a","a"],["a","a","a","a"]] },
    { scenario: 'Two even blocks', hint: 'Four answers mixing "aa" and "bb". Only record a partition once start reaches the end.', args: ["aabb"], expected: [["aa","bb"],["a","a","bb"],["aa","b","b"],["a","a","b","b"]] },
    { scenario: 'Nested palindromes', hint: '"racecar" contains "aceca" and "cec" — check every substring, not just pairs.', args: ["racecar"], expected: [["racecar"],["r","aceca","r"],["r","a","cec","a","r"],["r","a","c","e","c","a","r"]] },
    { scenario: 'Max length, all distinct', hint: '16 distinct letters: exactly one partition into single characters.', args: ["abcdefghijklmnop"], expected: [["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p"]] },
    { scenario: 'Max length, palindromes at ends', hint: 'Palindromes at the very start and end — make sure the last piece reaches the final index.', args: ["aabcdefghijklmnn"], expected: [["aa","b","c","d","e","f","g","h","i","j","k","l","m","nn"],["a","a","b","c","d","e","f","g","h","i","j","k","l","m","nn"],["aa","b","c","d","e","f","g","h","i","j","k","l","m","n","n"],["a","a","b","c","d","e","f","g","h","i","j","k","l","m","n","n"]] },
  ],

  solution: {
    code: `function partition(s) {
  const result = [];
  const path = [];

  const isPalindrome = (l, r) => {
    while (l < r) if (s[l++] !== s[r--]) return false;
    return true;
  };

  function backtrack(start) {
    if (start === s.length) {            // the whole string is cut into palindromes
      result.push([...path]);
      return;
    }
    for (let end = start; end < s.length; end++) {
      if (!isPalindrome(start, end)) continue;   // prune this cut
      path.push(s.slice(start, end + 1));
      backtrack(end + 1);
      path.pop();
    }
  }

  backtrack(0);
  return result;
}`,
  },
  dryRun: {
    columns: ['start', 'path', 'candidate pieces', 'action'],
    rows: [
      ['0', '[]', '"a" ✓, "aa" ✓, "aab" ✗', 'take "a"'],
      ['1', '[a]', '"a" ✓, "ab" ✗', 'take "a"'],
      ['2', '[a,a]', '"b" ✓', 'take "b" → start 3 → record [a,a,b]'],
      ['0', '[]', '', 'take "aa"'],
      ['2', '[aa]', '"b" ✓', 'record [aa,b]'],
    ],
  },
  complexity: { time: 'O(n · 2ⁿ)', space: 'O(n) extra (plus output)', explanation: 'At most 2^(n−1) partitions; each is built/copied in O(n), and palindrome checks are O(n) each (or O(1) with the DP table).' },
  alternative: {
    title: 'Precomputed palindrome table',
    md: 'Fill `pal[i][j]` for all i ≤ j in O(n²) (iterate i from n−1 down to 0). The backtracking then checks `pal[start][end]` in O(1).',
    complexity: 'O(n · 2ⁿ) time, O(n²) space',
  },
  mistakes: [
    'Using `slice` to test every piece *and* store it (fine) but forgetting `end + 1` in slice (off-by-one).',
    'Recording the partition before `start === s.length` (incomplete splits).',
    'Pushing `path` instead of a copy.',
  ],
};
