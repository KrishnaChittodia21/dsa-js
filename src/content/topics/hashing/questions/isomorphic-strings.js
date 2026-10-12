export default {
  id: 'isomorphic-strings',
  title: 'Isomorphic Strings',
  difficulty: 'Easy',
  order: 5,
  pattern: 'hash-canonical-key',
  tags: ['string', 'hash map', 'bijection'],
  source: { platform: 'LeetCode', number: 205, url: 'https://leetcode.com/problems/isomorphic-strings/' },

  statement: `Two strings \`s\` and \`t\` are **isomorphic** if the characters of \`s\` can be replaced to get \`t\`, such that:

- every occurrence of a character is replaced by the **same** character, and
- **no two different characters** map to the same character (a character may map to itself).

Return \`true\` if \`s\` and \`t\` are isomorphic.`,
  examples: [
    { input: 's = "egg", t = "add"', output: 'true', explanation: 'e → a, g → d.' },
    { input: 's = "foo", t = "bar"', output: 'false', explanation: 'o would have to map to both a and r.' },
    { input: 's = "badc", t = "baba"', output: 'false', explanation: 'b → b and d → b: two characters map to the same one.' },
  ],
  constraints: ['1 <= s.length <= 5 * 10^4', 't.length == s.length', 's and t consist of any valid ASCII characters'],

  think: `- What must be true about the mapping s → t?
- Is one map enough, or can two different characters sneak onto the same target?
- Can you describe the "shape" of a string in a way that ignores which letters are used?`,
  patternChallenge: {
    options: ['Frequency Map comparison', 'Canonical Keys / bijection maps', 'Sliding Window', 'Sorting'],
    answer: 1,
    explanation: 'The mapping must be one-to-one both ways. Either keep two maps (s→t and t→s) or compare the canonical "first-occurrence pattern" of both strings. Frequencies alone are not enough ("ab" vs "aa" have the same length but different shapes; "abab" vs "aabb" have the same counts but different shapes).',
  },
  hints: ['Keep two maps: sToT and tToS. Every pair (s[i], t[i]) must agree with both.', 'Alternative: record, for each position, the index where its character first appeared. Isomorphic strings produce identical patterns.'],
  approach: `**Two maps:** for each i with a = s[i], b = t[i]: if sToT has a with a different value → false; if tToS has b with a different value → false; otherwise set both. O(n) time, O(σ) space.

Why two maps? With only s→t, \`"badc"\` → \`"baba"\` passes (b→b, a→a, d→b, c→a), but b and d both map to b — not allowed.

**Canonical key view:** replace each character with the index of its first occurrence: "egg" → [0,1,1], "add" → [0,1,1]. Equal patterns ⇔ isomorphic.`,

  functionName: 'isIsomorphic',
  paramNames: ['s', 't'],
  starterCode: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isIsomorphic(s, t) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: e → a, g → d.', args: ['egg', 'add'], expected: true },
    { scenario: 'Example 2', hint: 'o would have to map to both a and r.', args: ['foo', 'bar'], expected: false },
    { scenario: 'Example 3', hint: 'b → b and d → b: two characters cannot map to the same one. One map s → t alone does not notice this.', args: ['badc', 'baba'], expected: false },
    { scenario: 'Single character', hint: 'The smallest input: any one character maps to any other.', args: ['a', 'z'], expected: true },
    { scenario: 'Identical strings', hint: 'A character may map to itself.', args: ['paper', 'paper'], expected: true },
    { scenario: 'Classic true case', hint: 'p → t, a → i, e → l, r → e: consistent both ways.', args: ['paper', 'title'], expected: true },
    { scenario: 'Reverse direction conflict', hint: '"ab" → "aa": a → a and b → a. Only a reverse map (t → s) catches it.', args: ['ab', 'aa'], expected: false },
    { scenario: 'Forward direction conflict', hint: '"aa" → "ab": a must map to both a and b.', args: ['aa', 'ab'], expected: false },
    { scenario: 'Same counts, different structure', hint: 'Both have letter counts {2, 2}, but "aabb" vs "abab" have different shapes — comparing frequencies is not enough.', args: ['aabb', 'abab'], expected: false },
    { scenario: 'Digits and symbols', hint: 'Any ASCII character is allowed: digits, spaces and punctuation map like letters.', args: ['1 2!', 'x y?'], expected: true },
    { scenario: 'Conflict at the end', hint: 'Everything matches until the last character.', args: ['abcdefa', 'ghijklm'], expected: false },
    { scenario: 'Large, true (n = 5·10^4)', hint: 'Comparing every pair of positions is O(n²). Two maps (or last-seen indices) give O(n).', argsGen: '() => { let s = 79, a = \'\', b = \'\'; for (let i = 0; i < 50000; i++) { s = (s * 48271) % 2147483647; const c = s % 90; a += String.fromCharCode(33 + c); b += String.fromCharCode(33 + ((c * 7 + 3) % 90)); } return [a, b]; }', expected: true, timeLimitMs: 1000 },
    { scenario: 'Large, false at the end', hint: 'A long isomorphic prefix with a single conflicting last character.', argsGen: '() => { let s = 83, a = \'\', b = \'\'; for (let i = 0; i < 49999; i++) { s = (s * 48271) % 2147483647; const c = s % 50; a += String.fromCharCode(48 + c); b += String.fromCharCode(48 + ((c + 17) % 50)); } return [a + \'0\', b + \'0\']; }', expected: false },
  ],

  solution: {
    code: `function isIsomorphic(s, t) {
  if (s.length !== t.length) return false;
  const sToT = new Map();
  const tToS = new Map();
  for (let i = 0; i < s.length; i++) {
    const a = s[i], b = t[i];
    if (sToT.has(a) && sToT.get(a) !== b) return false; // a already maps elsewhere
    if (tToS.has(b) && tToS.get(b) !== a) return false; // b already taken by another char
    sToT.set(a, b);
    tToS.set(b, a);
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['i', 's[i] → t[i]', 'sToT', 'tToS', 'ok?'],
    rows: [['0', 'b → b', '{b:b}', '{b:b}', 'yes'], ['1', 'a → a', '{b:b, a:a}', '{b:b, a:a}', 'yes'], ['2', 'd → b', '—', 'b already ← b', 'no → false']],
  },
  complexity: { time: 'O(n)', space: 'O(σ)', explanation: 'σ = number of distinct characters (at most 128 for ASCII).' },
  alternative: {
    title: 'First-occurrence patterns (canonical key)',
    md: 'Map every character to the index where it first appeared; the two patterns must be identical.',
    code: `function isIsomorphic(s, t) {
  const pattern = (str) => {
    const first = new Map();
    return [...str].map((ch, i) => {
      if (!first.has(ch)) first.set(ch, i);
      return first.get(ch);
    }).join(',');
  };
  return pattern(s) === pattern(t);
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Using only one map (misses two characters mapping to the same target)', 'Comparing frequency counts instead of structure'],
};
