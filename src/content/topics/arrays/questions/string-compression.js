export default {
  id: 'string-compression',
  title: 'String Compression',
  difficulty: 'Medium',
  order: 6,
  pattern: 'string-builder',
  tags: ['string', 'in-place', 'run-length encoding'],
  source: { platform: 'LeetCode', number: 443, url: 'https://leetcode.com/problems/string-compression/' },

  statement: `You are given an array of characters \`chars\`. Compress it **in place** using run-length encoding:

- For each group of consecutive equal characters, write the character once.
- If the group has length > 1, follow it with the group length written as digits (a length of 12 becomes \`'1', '2'\`).

Write the result into the **beginning of \`chars\`** and return the new length. Characters after the returned length do not matter. Use only O(1) extra space.`,
  examples: [
    { input: 'chars = ["a","a","b","b","c","c","c"]', output: '6 → ["a","2","b","2","c","3"]' },
    { input: 'chars = ["a"]', output: '1 → ["a"]' },
    { input: 'chars = ["a","b","b","b","b","b","b","b","b","b","b","b","b"]', output: '4 → ["a","b","1","2"]' },
  ],
  constraints: ['1 <= chars.length <= 2000', 'chars[i] is a letter, digit or symbol'],

  think: `- How do you find where a group ends?
- Can the compressed output ever be longer than the part of the input you have already read?
- How do you turn 12 into the characters '1' and '2'?`,
  patternChallenge: {
    options: ['String Building with a read index and a write index', 'Hash Map frequency count', 'Sort the characters', 'Binary Search'],
    answer: 0,
    explanation: 'Counting runs needs contiguity (so no hash map, no sorting). We read runs with one index and write the encoding with another, inside the same array.',
  },
  hints: ['Use `read` to scan runs: `j` walks forward while chars[j] === chars[read].', 'Keep a `write` index. Write the character, then (if count > 1) each digit of String(count). write never overtakes read.'],
  approach: `**With extra memory:** build a string with parts.push + join, then copy back — O(n) extra space.

**In place:** \`read\` finds the start of a group; \`j\` finds its end. Write \`chars[write++] = chars[read]\`, then the digits of \`j − read\` if it is > 1. Set \`read = j\`. Because a group of length k ≥ 2 is encoded in 1 + digits(k) ≤ k characters, \`write\` never passes \`read\`, so we never overwrite unread input. Return \`write\`.`,

  functionName: 'compress',
  paramNames: ['chars'],
  starterCode: `/**
 * @param {character[]} chars
 * @return {number}
 */
function compress(chars) {
  
}
`,
  harness: `(target, args) => {
  const chars = args[0];
  const len = target(chars);
  if (typeof len !== 'number') return 'returned ' + typeof len + ' instead of a length';
  return chars.slice(0, len); // the compressed prefix
}`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: three groups of 2, 2 and 3.', args: [['a', 'a', 'b', 'b', 'c', 'c', 'c']], expected: ['a', '2', 'b', '2', 'c', '3'] },
    { scenario: 'Example 2', hint: 'A single character: write just the letter, never a "1".', args: [['a']], expected: ['a'] },
    { scenario: 'Example 3', hint: 'A group of 12 must be written as two characters "1","2", not one element "12".', args: [['a', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b']], expected: ['a', 'b', '1', '2'] },
    { scenario: 'No repeats', hint: 'Writing "1" for groups of length 1 is a mistake — groups of one are just the character.', args: [['a', 'b', 'c']], expected: ['a', 'b', 'c'] },
    { scenario: 'Single pair', hint: 'The whole array is one group of two.', args: [['a', 'a']], expected: ['a', '2'] },
    { scenario: 'Last group is single', hint: 'If you compare chars[i] with chars[i+1] and only flush on a change, the final group is forgotten.', args: [['a', 'a', 'b']], expected: ['a', '2', 'b'] },
    { scenario: 'Last group is long', hint: 'The final group must be flushed after the loop ends, with its count.', args: [['a', 'b', 'c', 'c', 'c', 'c', 'c']], expected: ['a', 'b', 'c', '5'] },
    { scenario: 'Character reappears later', hint: 'Only consecutive runs form a group — "a" appearing again starts a new group.', args: [['a', 'a', 'a', 'b', 'a', 'a']], expected: ['a', '3', 'b', 'a', '2'] },
    { scenario: 'Group of exactly ten', hint: 'Count 10 is two characters "1","0"; writing only the last digit drops the "1".', args: [['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']], expected: ['x', '1', '0'] },
    { scenario: 'Digits and symbols', hint: 'Characters can be digits or symbols; the count digits come after the character.', args: [['1', '1', '1', '#', '#']], expected: ['1', '3', '#', '2'] },
    { scenario: 'Group of one hundred', hint: 'A three-digit count writes three characters.', argsGen: '() => [Array(100).fill(\'z\').concat([\'y\'])]', expected: ['z', '1', '0', '0', 'y'] },
    { scenario: 'Return length, not array', hint: 'Return the new length — the checker reads that many characters from chars. Returning the array is a common mistake.', args: [['p', 'p', 'q', 'q']], expected: ['p', '2', 'q', '2'] },
    { scenario: 'Maximum length one group', hint: '2000 equal characters compress to 5: the letter plus "2","0","0","0".', argsGen: '() => [Array(2000).fill(\'k\')]', expected: ['k', '2', '0', '0', '0'] },
    { scenario: 'Maximum length mixed groups', hint: 'Many groups of varying sizes at the 2000-character limit; the write pointer never overtakes the read pointer.', argsGen: '() => { const out = []; let len = 1; let ch = 0; while (out.length < 2000) { for (let i = 0; i < len && out.length < 2000; i++) out.push(String.fromCharCode(97 + ch)); ch = (ch + 1) % 26; len = (len % 13) + 1; } return [out]; }', expected: ['a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '3', 'a', 'b', '2', 'c', '3', 'd', '4', 'e', '5', 'f', '6', 'g', '7', 'h', '8', 'i', '9', 'j', '1', '0', 'k', '1', '1', 'l', '1', '2', 'm', '1', '3', 'n', 'o', '2', 'p', '3', 'q', '4', 'r', '5', 's', '6', 't', '7', 'u', '8', 'v', '9', 'w', '1', '0', 'x', '1', '1', 'y', '1', '2', 'z', '1', '1'] },
  ],

  solution: {
    code: `function compress(chars) {
  let write = 0;
  let read = 0;
  while (read < chars.length) {
    let j = read;
    while (j < chars.length && chars[j] === chars[read]) j++; // end of the group
    const count = j - read;

    chars[write++] = chars[read];
    if (count > 1) {
      for (const d of String(count)) chars[write++] = d;     // '1','2' for 12
    }
    read = j;                                               // next group
  }
  return write;
}`,
  },
  dryRun: {
    columns: ['group', 'count', 'written', 'write after'],
    rows: [['a a', '2', 'a 2', '2'], ['b b', '2', 'b 2', '4'], ['c c c', '3', 'c 3', '6']],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: '`read`/`j` scan each character once; the count string has at most 4 digits.' },
  alternative: {
    title: 'Build a string, then copy back',
    md: 'Collect pieces in an array and join; then write the characters back into chars. Clearer, but O(n) extra space.',
    code: `function compress(chars) {
  const parts = [];
  for (let i = 0; i < chars.length; ) {
    let j = i;
    while (j < chars.length && chars[j] === chars[i]) j++;
    parts.push(chars[i], j - i > 1 ? String(j - i) : '');
    i = j;
  }
  const s = parts.join('');
  for (let k = 0; k < s.length; k++) chars[k] = s[k];
  return s.length;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Writing the count as a single element "12" instead of two characters', 'Forgetting the last group when comparing chars[i] with chars[i+1]', 'Writing "1" for groups of length 1', 'Returning the array instead of the length'],
};
