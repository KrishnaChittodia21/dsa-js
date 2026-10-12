export default {
  id: 'valid-palindrome',
  title: 'Valid Palindrome',
  difficulty: 'Easy',
  order: 1,
  pattern: 'two-pointers-opposite',
  tags: ['string', 'two pointers'],
  source: { platform: 'LeetCode', number: 125, url: 'https://leetcode.com/problems/valid-palindrome/' },

  statement: `A phrase is a **palindrome** if, after turning every uppercase letter into lowercase and throwing away every character that is not a letter or a digit, it reads the same forwards and backwards.

Given a string \`s\`, return \`true\` if it is a palindrome under this rule, otherwise \`false\`.`,
  examples: [
    { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: 'Cleaned: "amanaplanacanalpanama".' },
    { input: 's = "race a car"', output: 'false', explanation: 'Cleaned: "raceacar" — not the same backwards.' },
    { input: 's = " "', output: 'true', explanation: 'Cleaned string is empty, and the empty string is a palindrome.' },
  ],
  constraints: ['1 <= s.length <= 2 * 10^5', 's consists of printable ASCII characters'],

  think: `- A palindrome compares which pairs of characters?
- Do you need to build the cleaned string, or can you skip the junk characters on the fly?
- When should the loop stop?`,
  patternChallenge: {
    options: ['Hash Map of character counts', 'Two Pointers — Opposite Ends', 'Sliding Window', 'Stack'],
    answer: 1,
    explanation: 'A palindrome is defined by mirror pairs: first vs last, second vs second-to-last… Two pointers from both ends check exactly those pairs. Character counts cannot see order ("ab" and "ba" have equal counts); a stack works but uses O(n) memory.',
  },
  hints: [
    'Put `l` at the start and `r` at the end. Skip characters that are not letters/digits on each side.',
    'Compare the lowercase versions of `s[l]` and `s[r]`. If they differ → false; otherwise move both inward. Stop when `l >= r`.',
  ],
  approach: `**Simple version:** build the cleaned lowercase string, reverse it and compare → O(n) time but O(n) extra memory.

**Two pointers (O(1) space):**
1. \`l = 0\`, \`r = s.length - 1\`.
2. While \`l < r\`: move \`l\` right past non-alphanumeric characters, move \`r\` left past them.
3. Compare \`s[l].toLowerCase()\` with \`s[r].toLowerCase()\`. Mismatch → \`false\`. Otherwise \`l++\`, \`r--\`.
4. Return \`true\`.

Each pointer moves at most n steps in total.`,

  functionName: 'isPalindrome',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: ignore spaces, commas and the colon, and compare letters case-insensitively.', args: ['A man, a plan, a canal: Panama'], expected: true },
    { scenario: 'Example 2', hint: 'After cleaning, "raceacar" is not the same backwards.', args: ['race a car'], expected: false },
    { scenario: 'Example 3', hint: 'Only a space: the cleaned string is empty, and the empty string is a palindrome.', args: [' '], expected: true },
    { scenario: 'Digits count', hint: 'Digits are alphanumeric: "0p" is not a palindrome. Skipping digits as junk returns true.', args: ['0P'], expected: false },
    { scenario: 'Single character', hint: 'The smallest input: one letter is always a palindrome.', args: ['a'], expected: true },
    { scenario: 'Only punctuation', hint: 'Nothing survives cleaning. Skipping junk without re-checking `l < r` runs the pointers past each other.', args: ['.,!?;'], expected: true },
    { scenario: 'Mixed case', hint: 'Compare lowercase to lowercase: "A" and "a" are the same letter.', args: ['AbBa'], expected: true },
    { scenario: 'Junk at both ends', hint: 'Non-alphanumeric characters at both ends must be skipped before comparing.', args: ['  ..ab!ba..  '], expected: true },
    { scenario: 'Digit palindrome', hint: 'Digits only — they are compared like letters.', args: ['12321'], expected: true },
    { scenario: 'Almost a palindrome', hint: 'Differs only in the middle pair: every pair must be compared.', args: ['abcxdcba'], expected: false },
    { scenario: 'Letters vs digits', hint: '"1a1" vs "1A1": lowercase letters only, digits untouched.', args: ['1A1'], expected: true },
    { scenario: 'Special chars between', hint: 'Underscores and quotes are not alphanumeric — skip them.', args: ['No \'x\' in _Nixon_'], expected: true },
    { scenario: 'Large palindrome (2·10^5)', hint: 'The longest allowed string. Two pointers check it in one O(n) pass without building new strings.', argsGen: '() => { const h = Array.from({ length: 50000 }, (_, i) => \'aB3,\'[i % 4]).join(\'\'); return [h + [...h].reverse().join(\'\')]; }', expected: true },
    { scenario: 'Large, mismatch in middle', hint: 'A long almost-palindrome whose only mismatch is in the middle.', argsGen: '() => { const h = \'x\'.repeat(99999); return [h + \'ab\' + h]; }', expected: false },
  ],

  solution: {
    code: `function isPalindrome(s) {
  const isAlnum = (c) =>
    (c >= 48 && c <= 57) ||   // 0-9
    (c >= 65 && c <= 90) ||   // A-Z
    (c >= 97 && c <= 122);    // a-z

  let l = 0, r = s.length - 1;
  while (l < r) {
    while (l < r && !isAlnum(s.charCodeAt(l))) l++;
    while (l < r && !isAlnum(s.charCodeAt(r))) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++;
    r--;
  }
  return true;
}`,
    explanation: 'The inner loops also check `l < r`, so a string made only of symbols never indexes past the other pointer. "0P" is a classic trap: "0" and "p" differ even though both are alphanumeric.',
  },
  dryRun: {
    columns: ['l', 'r', 's[l]', 's[r]', 'result'],
    rows: [
      ['0', '9', 'r', 'r', 'match'],
      ['1', '8', 'a', 'a', 'match'],
      ['2', '7', 'c', 'c', 'match'],
      ['3', '6', 'e', '" " → skip to 5: a', 'e ≠ a → false'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Each character is visited by at most one pointer; no new string is built.' },
  alternative: {
    title: 'Clean, then reverse',
    md: 'Build the cleaned string with a regex and compare it to its reverse. Very readable, O(n) memory.',
    code: `function isPalindrome(s) {
  const t = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return t === [...t].reverse().join('');
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Forgetting digits are alphanumeric (so "0P" must be false).',
    'Skipping junk characters without re-checking `l < r`, running the pointers past each other.',
    'Comparing without lowercasing both sides.',
  ],
};
