export default {
  id: 'rotate-string',
  title: 'Rotate String',
  difficulty: 'Easy',
  order: 2,
  pattern: 'string-kmp-prefix-function',
  tags: ['string', 'string matching', 'kmp'],
  source: { platform: 'LeetCode', number: 796, url: 'https://leetcode.com/problems/rotate-string/' },

  statement: `A **shift** moves the first character of a string to its end (\`"abcde"\` → \`"bcdea"\`). Given strings \`s\` and \`goal\`, return \`true\` if some number of shifts (possibly zero) turns \`s\` into \`goal\`.`,
  examples: [
    { input: 's = "abcde", goal = "cdeab"', output: 'true', explanation: 'Two shifts: abcde → bcdea → cdeab.' },
    { input: 's = "abcde", goal = "abced"', output: 'false' },
  ],
  constraints: ['1 <= s.length, goal.length <= 100', 's and goal consist of lowercase English letters'],

  think: `- Write down all rotations of "abcde". Do they all appear somewhere inside one longer string?
- What must be true about the lengths?
- Once you have that longer string, which algorithm answers "does goal appear inside it" in linear time?`,
  patternChallenge: {
    options: ['Two Pointers (opposite ends)', 'Sorting both strings', 'KMP search inside s + s', 'Sliding Window — Variable Size'],
    answer: 2,
    explanation: 'Every rotation of s is a substring of s + s (of length |s|). So the question becomes a pattern search of goal in s + s, which KMP answers in O(n). Sorting checks for anagrams, not rotations.',
  },
  hints: [
    'If the lengths differ, the answer is false.',
    'goal is a rotation of s exactly when goal occurs inside s + s. Search it with KMP (or `includes`, then explain its complexity).',
  ],
  approach: `**Brute force:** try all n rotations and compare each with goal — O(n²).

**Optimized:** \`s + s\` contains every rotation as a length-n window: rotation by k is \`(s + s).slice(k, k + n)\`. So:
1. If \`s.length !== goal.length\`, return false.
2. Return whether goal occurs in \`s + s\` — a KMP search, O(n).`,

  functionName: 'rotateString',
  paramNames: ['s', 'goal'],
  starterCode: `/**
 * @param {string} s
 * @param {string} goal
 * @return {boolean}
 */
function rotateString(s, goal) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: two shifts turn "abcde" into "cdeab".', args: ["abcde","cdeab"], expected: true },
    { scenario: 'Example 2', hint: 'Same letters, but "abced" is not any rotation.', args: ["abcde","abced"], expected: false },
    { scenario: 'Single character', hint: 'Zero shifts count: "a" is a rotation of itself.', args: ["a","a"], expected: true },
    { scenario: 'Different lengths', hint: 'Forgetting the length check: "aa" + "aa" contains "a", but lengths differ.', args: ["aa","a"], expected: false },
    { scenario: 'Goal longer than s', hint: 'goal longer than s can never be a rotation.', args: ["ab","aba"], expected: false },
    { scenario: 'Zero shifts', hint: 's equal to goal is a rotation (0 shifts).', args: ["abc","abc"], expected: true },
    { scenario: 'Periodic string', hint: '"abab" shifted once is "baba".', args: ["abab","baba"], expected: true },
    { scenario: 'Anagram, not rotation', hint: 'Comparing sorted characters checks anagrams, not rotations: "abcd" vs "dcba" is false.', args: ["abcd","dcba"], expected: false },
    { scenario: 'Repeated letters shift', hint: 'Many equal letters: the b must land in the right place.', args: ["aaaaab","aaabaa"], expected: true },
    { scenario: 'Same letters, wrong order', hint: '"aabb" → rotations are aabb, abba, bbaa, baab — "abab" is not one.', args: ["aabb","abab"], expected: false },
    { scenario: 'Single different letter', hint: 'Length 1, different letters.', args: ["a","b"], expected: false },
    { scenario: 'Max length 100 near-match', hint: '100 letters "aaa…ab" vs "aaa…ac": every rotation almost matches but none does.', argsGen: "() => ['a'.repeat(99) + 'b', 'a'.repeat(99) + 'c']", expected: false },
    { scenario: 'Max length 100 rotation', hint: '100 letters, rotated by 37.', argsGen: "() => { const s = Array.from({ length: 100 }, (_, i) => 'abcdefg'[(i * i) % 7]).join(''); return [s, s.slice(37) + s.slice(0, 37)]; }", expected: true },
  ],
  solution: {
    code: `function rotateString(s, goal) {
  if (s.length !== goal.length) return false;
  const text = s + s;
  const m = goal.length;

  const lps = new Array(m).fill(0);
  for (let i = 1, len = 0; i < m; i++) {
    while (len > 0 && goal[i] !== goal[len]) len = lps[len - 1];
    if (goal[i] === goal[len]) len++;
    lps[i] = len;
  }
  for (let i = 0, j = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== goal[j]) j = lps[j - 1];
    if (text[i] === goal[j]) j++;
    if (j === m) return true;
  }
  return false;
}`,
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['s + s', '"abcdeabcde"'],
      ['goal', '"cdeab" (lps = [0,0,0,0,0])'],
      ['scan', 'i = 0,1 mismatch; i = 2..6 match c,d,e,a,b → j = 5'],
      ['result', 'true (rotation by 2)'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 's + s has 2n characters; KMP scans it once after an O(n) lps build.' },
  alternative: {
    title: 'Built-in includes',
    md: '`s.length === goal.length && (s + s).includes(goal)` is the idiomatic one-liner. Mention that the engine\'s search is not guaranteed linear in the worst case; with n ≤ 100 it does not matter.',
    code: `function rotateString(s, goal) {
  return s.length === goal.length && (s + s).includes(goal);
}`,
    complexity: 'O(n) typical, O(n²) worst case',
  },
  mistakes: [
    'Forgetting the length check: "aa" + "aa" contains "a", but "a" is not a rotation of "aa".',
    'Building every rotation with slice + concatenation (O(n²) time and garbage).',
    'Comparing sorted characters — that checks anagrams, not rotations.',
  ],
};
