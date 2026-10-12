export default {
  id: 'letter-combinations-of-a-phone-number',
  title: 'Letter Combinations of a Phone Number',
  difficulty: 'Medium',
  order: 7,
  pattern: 'backtracking-string-construction',
  tags: ['backtracking', 'string', 'hash map'],
  source: { platform: 'LeetCode', number: 17, url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/' },

  statement: `On an old phone keypad each digit from 2 to 9 maps to some letters:

| 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|
| abc | def | ghi | jkl | mno | pqrs | tuv | wxyz |

Given a string \`digits\` containing only the characters \`'2'\`–\`'9'\`, return **every letter string** the digits could spell (one letter per digit, in the same order). Return them in any order. If \`digits\` is empty, return an empty array.`,
  examples: [
    { input: 'digits = "23"', output: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
    { input: 'digits = ""', output: '[]' },
    { input: 'digits = "2"', output: '["a","b","c"]' },
  ],
  constraints: ['0 <= digits.length <= 4', "digits[i] is a digit in ['2', '9']"],

  think: `- What does level \`i\` of the decision tree decide?
- How many branches does each level have? How many leaves in total?
- Why is the empty input a special case — what would a naive recursion return for it?`,
  patternChallenge: {
    options: ['Backtracking — Building strings position by position', 'Sliding Window', 'Backtracking — Subsets (include / exclude)', 'Dynamic Programming'],
    answer: 0,
    explanation: 'Every position of the output string must be filled with one of the digit\'s letters — a decision tree whose depth is the number of digits. It is not include/exclude: every digit contributes exactly one letter.',
  },
  hints: [
    'Store the keypad in an array or object: `map["2"] = "abc"` and so on.',
    '`dfs(i)`: if `i === digits.length`, record `path.join("")`. Otherwise for each letter of `map[digits[i]]`: push, recurse with `i + 1`, pop.',
  ],
  approach: `**Iterative (BFS-like):** start with \`[""]\`; for each digit replace every partial string by its extensions. Simple, same complexity.

**Backtracking:** depth = digit index; branches = letters of that digit (3 or 4). Keep an array of characters and join at the leaf. Return \`[]\` immediately for empty input — otherwise the recursion would record \`""\` at depth 0.`,

  functionName: 'letterCombinations',
  paramNames: ['digits'],
  starterCode: `/**
 * @param {string} digits
 * @return {string[]}
 */
function letterCombinations(digits) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: '3 × 3 = 9 combinations, one letter from each key.', args: ["23"], expected: ["ad","ae","af","bd","be","bf","cd","ce","cf"] },
    { scenario: 'Example 2', hint: 'Empty input must return [], not [""].', args: [""], expected: [] },
    { scenario: 'Example 3', hint: 'A single digit gives its own letters.', args: ["2"], expected: ["a","b","c"] },
    { scenario: 'Four-letter keys', hint: '7 has "pqrs" and 9 has "wxyz" — four letters each, so 16 combinations.', args: ["79"], expected: ["pw","px","py","pz","qw","qx","qy","qz","rw","rx","ry","rz","sw","sx","sy","sz"] },
    { scenario: 'Single four-letter key', hint: '"7" maps to four letters; a 3-letter assumption drops "s".', args: ["7"], expected: ["p","q","r","s"] },
    { scenario: 'Digit 9 alone', hint: '"9" must include "z".', args: ["9"], expected: ["w","x","y","z"] },
    { scenario: 'Repeated digit', hint: 'The same digit twice still contributes independently: "aa", "ab", …', args: ["22"], expected: ["aa","ab","ac","ba","bb","bc","ca","cb","cc"] },
    { scenario: 'Three digits', hint: '27 combinations. If you append to a shared string, restore it after each call.', args: ["234"], expected: ["adg","adh","adi","aeg","aeh","aei","afg","afh","afi","bdg","bdh","bdi","beg","beh","bei","bfg","bfh","bfi","cdg","cdh","cdi","ceg","ceh","cei","cfg","cfh","cfi"] },
    { scenario: 'Mixed key sizes', hint: '"8" has 3 letters and "7" has 4 → 12 combinations.', args: ["87"], expected: ["tp","tq","tr","ts","up","uq","ur","us","vp","vq","vr","vs"] },
    { scenario: 'Max length (4 digits)', hint: '3 × 3 × 3 × 3 = 81 combinations, each of length 4.', args: ["2345"], expected: ["adgj","adgk","adgl","adhj","adhk","adhl","adij","adik","adil","aegj","aegk","aegl","aehj","aehk","aehl","aeij","aeik","aeil","afgj","afgk","afgl","afhj","afhk","afhl","afij","afik","afil","bdgj","bdgk","bdgl","bdhj","bdhk","bdhl","bdij","bdik","bdil","begj","begk","begl","behj","behk","behl","beij","beik","beil","bfgj","bfgk","bfgl","bfhj","bfhk","bfhl","bfij","bfik","bfil","cdgj","cdgk","cdgl","cdhj","cdhk","cdhl","cdij","cdik","cdil","cegj","cegk","cegl","cehj","cehk","cehl","ceij","ceik","ceil","cfgj","cfgk","cfgl","cfhj","cfhk","cfhl","cfij","cfik","cfil"] },
    { scenario: 'Max length with 4-letter keys', hint: '4 × 3 × 3 × 4 = 144 combinations — remember both 7 and 9 have four letters.', args: ["7689"], expected: ["pmtw","pmtx","pmty","pmtz","pmuw","pmux","pmuy","pmuz","pmvw","pmvx","pmvy","pmvz","pntw","pntx","pnty","pntz","pnuw","pnux","pnuy","pnuz","pnvw","pnvx","pnvy","pnvz","potw","potx","poty","potz","pouw","poux","pouy","pouz","povw","povx","povy","povz","qmtw","qmtx","qmty","qmtz","qmuw","qmux","qmuy","qmuz","qmvw","qmvx","qmvy","qmvz","qntw","qntx","qnty","qntz","qnuw","qnux","qnuy","qnuz","qnvw","qnvx","qnvy","qnvz","qotw","qotx","qoty","qotz","qouw","qoux","qouy","qouz","qovw","qovx","qovy","qovz","rmtw","rmtx","rmty","rmtz","rmuw","rmux","rmuy","rmuz","rmvw","rmvx","rmvy","rmvz","rntw","rntx","rnty","rntz","rnuw","rnux","rnuy","rnuz","rnvw","rnvx","rnvy","rnvz","rotw","rotx","roty","rotz","rouw","roux","rouy","rouz","rovw","rovx","rovy","rovz","smtw","smtx","smty","smtz","smuw","smux","smuy","smuz","smvw","smvx","smvy","smvz","sntw","sntx","snty","sntz","snuw","snux","snuy","snuz","snvw","snvx","snvy","snvz","sotw","sotx","soty","sotz","souw","soux","souy","souz","sovw","sovx","sovy","sovz"] },
  ],

  solution: {
    code: `function letterCombinations(digits) {
  if (digits.length === 0) return [];
  const keypad = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
  const result = [];
  const path = [];

  function backtrack(i) {
    if (i === digits.length) {
      result.push(path.join(''));        // build the string once, at the leaf
      return;
    }
    for (const ch of keypad[digits[i]]) {
      path.push(ch);
      backtrack(i + 1);
      path.pop();
    }
  }

  backtrack(0);
  return result;
}`,
  },
  dryRun: {
    columns: ['i', 'path', 'action'],
    rows: [
      ['0', '[]', 'digit 2 → try a'],
      ['1', '[a]', 'digit 3 → try d, e, f → record ad, ae, af'],
      ['0', '[]', 'try b → bd, be, bf'],
      ['0', '[]', 'try c → cd, ce, cf'],
    ],
  },
  complexity: { time: 'O(n · 4ⁿ)', space: 'O(n) extra (plus output)', explanation: 'Up to 4 letters per digit → at most 4ⁿ leaves, each joined in O(n). The recursion depth is n.' },
  alternative: {
    title: 'Iterative expansion',
    md: 'Keep a list of partial strings and extend it digit by digit.',
    code: `function letterCombinations(digits) {
  if (!digits) return [];
  const keypad = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
  let out = [''];
  for (const d of digits) {
    const next = [];
    for (const prefix of out) for (const ch of keypad[d]) next.push(prefix + ch);
    out = next;
  }
  return out;
}`,
    complexity: 'O(n · 4ⁿ) time',
  },
  mistakes: [
    'Returning `[""]` for empty input instead of `[]`.',
    'Forgetting that 7 and 9 have four letters.',
    'Concatenating onto a shared string variable without restoring it.',
  ],
};
