export default {
  id: 'ransom-note',
  title: 'Ransom Note',
  difficulty: 'Easy',
  order: 4,
  pattern: 'hash-frequency-map',
  tags: ['string', 'frequency count'],
  source: { platform: 'LeetCode', number: 383, url: 'https://leetcode.com/problems/ransom-note/' },

  statement: `You want to write \`ransomNote\` by cutting letters out of \`magazine\`. Each letter in the magazine can be used **at most once**.

Return \`true\` if the note can be constructed, otherwise \`false\`.`,
  examples: [
    { input: 'ransomNote = "a", magazine = "b"', output: 'false' },
    { input: 'ransomNote = "aa", magazine = "ab"', output: 'false', explanation: 'Only one "a" is available.' },
    { input: 'ransomNote = "aa", magazine = "aab"', output: 'true' },
  ],
  constraints: ['1 <= ransomNote.length, magazine.length <= 10^5', 'Both consist of lowercase English letters'],

  think: `- What do you need to know about the magazine: where the letters are, or how many of each there are?
- How do you "use up" a letter?`,
  patternChallenge: {
    options: ['Hash Set membership', 'Frequency Map (Counting)', 'Two Pointers', 'Sorting + Binary Search'],
    answer: 1,
    explanation: '"Each letter used at most once" means multiplicity matters → counts. A Set would accept "aa" from "ab".',
  },
  hints: ['Count the magazine letters first.', 'For each note letter, decrement its count; if it drops below zero, return false.'],
  approach: `**Brute force:** for each note letter, find and remove a matching letter in the magazine (indexOf + splice) → O(n·m).

**Optimized:** 26 counters for the magazine, then consume them with the note. O(n + m) time, O(1) space. Early exit: if the note is longer than the magazine, it is impossible.`,

  functionName: 'canConstruct',
  paramNames: ['ransomNote', 'magazine'],
  starterCode: `/**
 * @param {string} ransomNote
 * @param {string} magazine
 * @return {boolean}
 */
function canConstruct(ransomNote, magazine) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The magazine has no "a" at all.', args: ['a', 'b'], expected: false },
    { scenario: 'Example 2', hint: 'The note needs two a\'s but the magazine has one. Checking presence with a Set says true.', args: ['aa', 'ab'], expected: false },
    { scenario: 'Example 3', hint: 'Two a\'s are available: true.', args: ['aa', 'aab'], expected: true },
    { scenario: 'Identical strings', hint: 'The magazine is exactly the note.', args: ['abc', 'cba'], expected: true },
    { scenario: 'Note longer than magazine', hint: 'More letters needed than exist — you can return false early.', args: ['abcd', 'abc'], expected: false },
    { scenario: 'Magazine has extra letters', hint: 'Unused magazine letters are fine.', args: ['cat', 'tacocat'], expected: true },
    { scenario: 'Comparison direction', hint: 'The magazine must cover the note, not the other way round: here the note has more b\'s than the magazine.', args: ['abb', 'aab'], expected: false },
    { scenario: 'Same letters, short count', hint: 'Every letter is present, but "z" is needed three times and appears twice.', args: ['zzz', 'zzyy'], expected: false },
    { scenario: 'All 26 letters', hint: 'Every letter once: count each letter separately.', args: ['thequickbrownfoxjumpsoverthelazydog', 'abcdefghijklmnopqrstuvwxyzthequickbrownfoxjumpsoverthelazydog'], expected: true },
    { scenario: 'Single letters equal', hint: 'The smallest true case.', args: ['q', 'q'], expected: true },
    { scenario: 'Large, exactly enough (10^5)', hint: 'Searching the magazine for each note letter (indexOf / splice) is O(n·m). Count the magazine once: O(n + m).', argsGen: '() => { let s = 101, a = \'\'; for (let i = 0; i < 100000; i++) { s = (s * 48271) % 2147483647; a += String.fromCharCode(97 + (s % 26)); } return [a, a.split(\'\').reverse().join(\'\')]; }', expected: true, timeLimitMs: 1000 },
    { scenario: 'Large, one letter short', hint: 'The note needs 10^5 a\'s; the magazine has one fewer.', argsGen: '() => [\'a\'.repeat(100000), \'a\'.repeat(99999) + \'b\']', expected: false, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function canConstruct(ransomNote, magazine) {
  if (ransomNote.length > magazine.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i < magazine.length; i++) count[magazine.charCodeAt(i) - 97]++;
  for (let i = 0; i < ransomNote.length; i++) {
    const c = ransomNote.charCodeAt(i) - 97;
    if (--count[c] < 0) return false;   // ran out of this letter
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['note letter', 'count before', 'count after', 'ok?'],
    rows: [['a', 'a:2', 'a:1', 'yes'], ['a', 'a:1', 'a:0', 'yes → true (note "aa", magazine "aab")']],
  },
  complexity: { time: 'O(n + m)', space: 'O(1)', explanation: 'Two passes; 26 counters.' },
  alternative: {
    title: 'Map-based counting (any alphabet)',
    md: 'Same algorithm with a Map, for inputs beyond lowercase letters.',
    code: `function canConstruct(ransomNote, magazine) {
  const freq = new Map();
  for (const ch of magazine) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  for (const ch of ransomNote) {
    const left = (freq.get(ch) ?? 0) - 1;
    if (left < 0) return false;
    freq.set(ch, left);
  }
  return true;
}`,
    complexity: 'O(n + m) time, O(σ) space',
  },
  mistakes: ['Checking only presence (Set) instead of counts', 'Counting the note instead of the magazine and comparing the wrong way round'],
};
