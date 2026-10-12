export default {
  id: 'partition-labels',
  title: 'Partition Labels',
  difficulty: 'Medium',
  order: 4,
  pattern: 'greedy-interval-scheduling',
  tags: ['string', 'greedy', 'hash map', 'intervals'],
  source: { platform: 'LeetCode', number: 763, url: 'https://leetcode.com/problems/partition-labels/' },

  statement: `Split the string \`s\` into **as many contiguous parts as possible** so that every letter appears in **at most one** part. Concatenating the parts in order must give back \`s\`.

Return an array with the **sizes** of the parts, in order.`,
  examples: [
    { input: 's = "ababcbacadefegdehijhklij"', output: '[9,7,8]', explanation: 'Parts "ababcbaca", "defegde", "hijhklij".' },
    { input: 's = "eccbbbbdec"', output: '[10]' },
  ],
  constraints: ['1 <= s.length <= 500', 's consists of lowercase English letters'],

  think: `- If the letter "a" appears at indices 0 and 8, what does that force about the part containing index 0?
- Think of each letter as an interval [first, last]. When can you safely cut?
- Why is cutting as early as possible never worse?`,
  patternChallenge: {
    options: ['Sliding Window — Variable Size', 'Greedy — Intervals by Earliest End', 'Dynamic Programming', 'Two Pointers (opposite ends)'],
    answer: 1,
    explanation: 'Each letter is an interval [first, last]. A part must fully contain every interval that it touches. Sweeping and cutting as soon as the running max end equals the index is interval greedy.',
  },
  hints: [
    'Precompute the last index of every character.',
    'Sweep i, maintaining end = max(last[s[i]]). When i === end, close the part.',
  ],
  approach: `**Brute force:** for every possible cut position, check that no letter appears on both sides (O(n²) or O(26·n)).

**Greedy:** store \`last[c]\`. Sweep with \`start\` and \`end\`. At each i, \`end = max(end, last[s[i]])\`. When \`i === end\`, every letter inside [start, i] has its last occurrence inside, so this is a legal cut — and it is the **earliest** legal cut, which maximises the number of parts (any later cut can be refined into this one plus the rest).`,

  functionName: 'partitionLabels',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number[]}
 */
function partitionLabels(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Parts "ababcbaca", "defegde", "hijhklij" — each letter stays inside one part.', args: ['ababcbacadefegdehijhklij'], expected: [9, 7, 8] },
    { scenario: 'Example 2', hint: 'The first letter "e" reappears near the end, so the whole string is one part.', args: ['eccbbbbdec'], expected: [10] },
    { scenario: 'Single character', hint: 'The smallest input is one part of size 1.', args: ['a'], expected: [1] },
    { scenario: 'All distinct letters', hint: 'No letter repeats, so you can cut after every character.', args: ['abc'], expected: [1, 1, 1] },
    { scenario: 'All the same letter', hint: 'One letter repeated: it must stay in a single part.', args: ['aaaa'], expected: [4] },
    { scenario: 'First letter repeats at end', hint: 'The first and last character match, forcing one part over everything.', args: ['abca'], expected: [4] },
    { scenario: 'Doubled letters', hint: 'Each pair is its own part.', args: ['aabbcc'], expected: [2, 2, 2] },
    { scenario: 'Interleaved letters', hint: '"a" and "b" overlap, so they merge into one part.', args: ['abab'], expected: [4] },
    { scenario: 'Running max, not own last', hint: 'At index 2 "c" sees its own last occurrence, but "a" still continues later. Cut only when i reaches the running max end.', args: ['acca'], expected: [4] },
    { scenario: 'Reset start after a cut', hint: 'Sizes are measured from the start of the current part; forgetting start = i + 1 returns cumulative lengths like [1, 10].', args: ['caedbdedda'], expected: [1, 9] },
    { scenario: 'Single-letter parts at ends', hint: 'Lone letters at both ends form parts of size 1.', args: ['zabbaq'], expected: [1, 4, 1] },
    { scenario: 'Nested intervals', hint: 'An interval fully inside another does not extend the part.', args: ['abcbad'], expected: [5, 1] },
    { scenario: 'Maximum length (500)', hint: 'Longest allowed string: the letter-interval sweep is linear.', argsGen: '() => { let s = ""; for (let i = 0; i < 500; i++) s += String.fromCharCode(97 + ((i * 7) % 26 + Math.floor(i / 50)) % 26); return [s]; }', expected: [500] },
    { scenario: 'Maximum length, many parts', hint: '25 blocks of 20 equal letters give 25 parts — make sure every cut is emitted, including the last one.', argsGen: '() => { let s = ""; for (let i = 0; i < 500; i++) s += String.fromCharCode(97 + Math.floor(i / 20) % 26); return [s]; }', expected: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20] },
  ],

  solution: {
    code: `function partitionLabels(s) {
  const last = new Map();                      // char -> last index
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  const sizes = [];
  let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last.get(s[i]));       // part must reach this char's last copy
    if (i === end) {                           // nothing in [start, i] continues further
      sizes.push(end - start + 1);
      start = i + 1;
    }
  }
  return sizes;
}`,
  },
  dryRun: {
    columns: ['i', 's[i]', 'last', 'end', 'cut?'],
    rows: [
      ['0', 'e', '8', '8', 'no'],
      ['1', 'c', '9', '9', 'no'],
      ['…', '…', '…', '9', 'no'],
      ['9', 'c', '9', '9', 'yes → size 10'],
    ],
    note: 's = "eccbbbbdec".',
  },
  complexity: { time: 'O(n)', space: 'O(σ)', explanation: 'Two passes; the map holds at most 26 entries.' },
  alternative: {
    title: 'Merge intervals explicitly',
    md: 'Build [first, last] for each letter in order of first appearance, merge overlapping intervals (Intervals topic), and output the lengths of the merged intervals.',
    code: `function partitionLabels(s) {
  const first = new Map(), last = new Map();
  for (let i = 0; i < s.length; i++) {
    if (!first.has(s[i])) first.set(s[i], i);
    last.set(s[i], i);
  }
  const merged = [];
  for (const [c, f] of first) {               // Map keeps insertion order = order of first
    const l = last.get(c);
    if (merged.length && f <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], l);
    } else merged.push([f, l]);
  }
  return merged.map(([a, b]) => b - a + 1);
}`,
    complexity: 'O(n) time, O(σ) space',
  },
  mistakes: [
    'Cutting when the current character\'s last index equals i, instead of the running maximum.',
    'Returning the parts as strings instead of their sizes.',
    'Forgetting to set start = i + 1 after a cut.',
  ],
};
