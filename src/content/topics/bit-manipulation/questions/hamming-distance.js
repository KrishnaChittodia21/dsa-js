export default {
  id: 'hamming-distance',
  title: 'Hamming Distance',
  difficulty: 'Easy',
  order: 3,
  pattern: 'bit-xor-cancel',
  tags: ['bit manipulation'],
  source: { platform: 'LeetCode', number: 461, url: 'https://leetcode.com/problems/hamming-distance/' },

  statement: `The **Hamming distance** between two integers is the number of bit positions at which their bits are different. Given non-negative integers \`x\` and \`y\`, return it.`,
  examples: [
    { input: 'x = 1, y = 4', output: '2', explanation: '001 vs 100 — positions 0 and 2 differ.' },
    { input: 'x = 3, y = 1', output: '1' },
  ],
  constraints: ['0 <= x, y <= 2^31 − 1'],

  think: `- Which operator produces a 1 exactly where two bits differ?
- Once you have that number, what is left to do?`,
  patternChallenge: {
    options: ['XOR then popcount', 'Bitwise AND then popcount', 'Subtraction', 'Gray code'],
    answer: 0,
    explanation: 'x ^ y has a 1 exactly at the differing positions, so the answer is popcount(x ^ y). AND marks positions where both are 1, not where they differ.',
  },
  hints: [
    'Compute d = x ^ y.',
    'Count the 1-bits of d with the n & (n − 1) trick.',
  ],
  approach: `**Brute force:** compare bit k of x and y for k = 0..31.

**XOR + popcount:** \`d = x ^ y\` marks every differing position; count its set bits with Kernighan's loop. Both inputs are below 2^31, so no signedness issues.`,

  functionName: 'hammingDistance',
  paramNames: ['x', 'y'],
  starterCode: `/**
 * @param {number} x
 * @param {number} y
 * @return {number}
 */
function hammingDistance(x, y) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 001 vs 100 differ in two positions.',
      args: [1, 4], expected: 2 },
    { scenario: 'Example 2', hint: '11 vs 01 differ only in bit 1.',
      args: [3, 1], expected: 1 },
    { scenario: 'Both zero', hint: 'No bits set anywhere — distance 0.',
      args: [0, 0], expected: 0 },
    { scenario: 'Equal numbers', hint: 'x ^ y is 0 when the numbers are equal, so the distance is 0.',
      args: [7, 7], expected: 0 },
    { scenario: 'AND / OR give the wrong count', hint: '5 = 101 and 3 = 011: AND has 1 bit, OR has 3, but they differ in 2 positions — only XOR marks differences.',
      args: [5, 3], expected: 2 },
    { scenario: 'Decimal digits mislead', hint: '93 and 73 differ in one decimal digit but in two binary digits — compare bits, not digits.',
      args: [93, 73], expected: 2 },
    { scenario: 'Zero vs maximum', hint: '2^31 − 1 has 31 set bits and 0 has none — distance 31.',
      args: [0, 2147483647], expected: 31 },
    { scenario: 'Maximum vs itself', hint: 'Two copies of 2^31 − 1 — the distance is 0, not 31.',
      args: [2147483647, 2147483647], expected: 0 },
    { scenario: 'Bit 30 set', hint: '2^30 vs 1: a loop that only checks the low 16 or so bits misses bit 30.',
      args: [1073741824, 1], expected: 2 },
    { scenario: 'Maximum vs 2^30', hint: 'Only bit 30 is shared, the other 30 bits differ.',
      args: [2147483647, 1073741824], expected: 30 },
    { scenario: 'Alternating bit patterns', hint: '0x55555555 and 0x2AAAAAAA are complements within 31 bits — every position differs.',
      args: [1431655765, 715827882], expected: 31 },
    { scenario: 'Across a power of two', hint: '1023 and 1024 differ in all 11 low bits.',
      args: [1023, 1024], expected: 11 },
  ],

  solution: {
    code: `function hammingDistance(x, y) {
  let d = x ^ y;            // 1 where the bits differ
  let count = 0;
  while (d !== 0) {
    d &= d - 1;             // remove one differing bit
    count++;
  }
  return count;
}`,
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['x = 1', '001'],
      ['y = 4', '100'],
      ['d = x ^ y', '101'],
      ['popcount(d)', '2'],
    ],
  },
  complexity: { time: 'O(1) — at most 31 iterations', space: 'O(1)', explanation: 'Kernighan runs once per differing bit.' },
  alternative: {
    title: 'String method',
    md: '`(x ^ y).toString(2).split("1").length - 1` — short but allocates; fine for non-negative inputs.',
    complexity: 'O(32) time, O(32) space',
  },
  mistakes: [
    'Using & or | instead of ^.',
    'Comparing decimal digits instead of bits.',
  ],
};
