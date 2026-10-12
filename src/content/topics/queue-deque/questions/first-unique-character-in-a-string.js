export default {
  id: 'first-unique-character-in-a-string',
  title: 'First Unique Character in a String',
  difficulty: 'Easy',
  order: 2,
  pattern: 'queue-simulation',
  tags: ['string', 'hash map', 'queue'],
  source: { platform: 'LeetCode', number: 387, url: 'https://leetcode.com/problems/first-unique-character-in-a-string/' },

  statement: `Given a string \`s\`, return the **index** of the first character that appears exactly once in \`s\`. If there is no such character, return \`-1\`.`,
  examples: [
    { input: 's = "leetcode"', output: '0' },
    { input: 's = "loveleetcode"', output: '2' },
    { input: 's = "aabb"', output: '-1' },
  ],
  constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],

  think: `- Two passes with a count table is the simplest idea. Can you also do it in a single pass, as if characters were arriving one by one in a stream?
- In a stream, the "first unique so far" can stop being unique. Which candidates should be discarded, and from which end?`,
  patternChallenge: {
    options: ['Queue of candidates + counts (stream-friendly)', 'Stack', 'Two pointers', 'Binary search'],
    answer: 0,
    explanation: 'Candidates are considered in arrival order and the oldest candidate is the answer until it becomes a duplicate — then it is dropped from the FRONT. That is FIFO. (Counting in two passes is equally valid for a fixed string.)',
  },
  hints: [
    'Count each character as it arrives; enqueue its index the first time you see it.',
    'While the character at the queue front has count > 1, dequeue it. The front (if any) is the first unique character so far.',
  ],
  approach: `**Brute force:** for each index, scan the whole string for another copy → O(n²).

**Two passes (O(n)):** count all characters, then return the first index with count 1.

**Queue (one pass, stream-friendly):** maintain counts and a queue of indices of characters seen once. After each character, pop the front while its character has become a duplicate. The front is always the first unique character so far — this works even if the string never ends (a stream). Each index is enqueued and dequeued at most once.`,

  functionName: 'firstUniqChar',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function firstUniqChar(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '"l" is unique and is the very first character — return its index 0, not the letter.', args: ['leetcode'], expected: 0 },
    { scenario: 'Example 2', hint: '"l" and "o" repeat later; "v" at index 2 is the first unique one.', args: ['loveleetcode'], expected: 2 },
    { scenario: 'Example 3', hint: 'Every character repeats — return −1.', args: ['aabb'], expected: -1 },
    { scenario: 'Single character', hint: 'Smallest input: the only character is unique, index 0.', args: ['z'], expected: 0 },
    { scenario: 'Unique at the end', hint: 'The answer is the last index.', args: ['aab'], expected: 2 },
    { scenario: 'Unique after many repeats', hint: 'Earlier candidates turn into duplicates and must all be dropped (a while loop, not one check).', args: ['abcabcd'], expected: 6 },
    { scenario: 'Repeats interleaved', hint: 'Several candidates are invalidated out of order before the unique "a" at the end.', args: ['dddccdbba'], expected: 8 },
    { scenario: 'Two characters, both unique', hint: 'Return the first of several unique characters.', args: ['xy'], expected: 0 },
    { scenario: 'Duplicate first, unique middle', hint: 'The first character repeats at the very end, so the unique answer is in the middle.', args: ['abcda'], expected: 1 },
    { scenario: 'All 26 letters twice', hint: 'Every letter appears exactly twice — no answer.', args: ['abcdefghijklmnopqrstuvwxyzzyxwvutsrqponmlkjihgfedcba'], expected: -1 },
    { scenario: 'Long blocks, unique last (n = 10^5)', hint: 'indexOf/lastIndexOf per character scans ~5·10^4 characters for every index here — O(n²). Count once, then scan.', argsGen: '() => [\'a\'.repeat(50000) + \'b\'.repeat(49999) + \'c\']', expected: 99999, timeLimitMs: 1000 },
    { scenario: 'Large, no unique (n = 10^5)', hint: 'Every letter repeats in long runs; the answer is −1.', argsGen: '() => [\'m\'.repeat(50000) + \'n\'.repeat(50000)]', expected: -1 },
    { scenario: 'Large random, unique in middle', hint: 'Random letters except "z", which appears once in the middle.', argsGen: '() => { let s = 3; let o = \'\'; for (let i = 0; i < 100000; i++) { s = (s * 1103515245 + 12345) % 2147483648; o += String.fromCharCode(97 + ((s >> 16) % 25)); } return [o.slice(0, 54321) + \'z\' + o.slice(54322)]; }', expected: 54321 },
  ],
  solution: {
    code: `function firstUniqChar(s) {
  const count = new Array(26).fill(0);
  const q = new Queue();                  // indices of characters seen once, in order
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i) - 97;
    if (count[c]++ === 0) q.enqueue(i);   // first sighting → candidate
    // drop candidates that turned into duplicates
    while (!q.isEmpty() && count[s.charCodeAt(q.front()) - 97] > 1) q.dequeue();
  }
  return q.isEmpty() ? -1 : q.front();
}`,
  },
  dryRun: {
    columns: ['i', 'ch', 'queue (chars)', 'front'],
    rows: [
      ['0', 'l', '[l]', 'l'],
      ['1', 'o', '[l,o]', 'l'],
      ['2', 'v', '[l,o,v]', 'l'],
      ['3', 'e', '[l,o,v,e]', 'l'],
      ['4', 'l', '[o,v,e]  (l dropped)', 'o'],
      ['5', 'e', '[o,v,e]', 'o'],
      ['6', 'e', '[o,v,e]', 'o'],
      ['7..11', 't c o d e', 'o dropped at i = 9; t, c, d stay behind v', 'v (index 2)'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1) (26 counters; queue ≤ 26 distinct candidates alive)', explanation: 'Each index is enqueued once and dequeued at most once.' },
  alternative: {
    title: 'Two passes with counts',
    md: 'Count, then scan for the first count of 1. Simplest and equally fast for a fixed string.',
    code: `function firstUniqChar(s) {
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
  for (let i = 0; i < s.length; i++) if (count[s.charCodeAt(i) - 97] === 1) return i;
  return -1;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Returning the character instead of its index.',
    'Using s.indexOf(c) === s.lastIndexOf(c) inside a loop → O(n²).',
    'Only checking the front once (use a while loop) in the queue version.',
  ],
};
