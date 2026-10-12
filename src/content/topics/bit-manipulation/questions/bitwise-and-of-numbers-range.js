export default {
  id: 'bitwise-and-of-numbers-range',
  title: 'Bitwise AND of Numbers Range',
  difficulty: 'Medium',
  order: 2,
  pattern: 'bit-per-position',
  tags: ['bit manipulation'],
  source: { platform: 'LeetCode', number: 201, url: 'https://leetcode.com/problems/bitwise-and-of-numbers-range/' },

  statement: `Given \`left\` and \`right\`, return the bitwise AND of **every** integer in the inclusive range \`[left, right]\`.`,
  examples: [
    { input: 'left = 5, right = 7', output: '4', explanation: '101 & 110 & 111 = 100.' },
    { input: 'left = 0, right = 0', output: '0' },
    { input: 'left = 1, right = 2147483647', output: '0' },
  ],
  constraints: ['0 <= left <= right <= 2^31 − 1'],

  think: `- The range can contain two billion numbers — you cannot loop over it. What survives an AND?
- If some bit changes value somewhere inside the range, what happens to it in the result?
- Which bits of left and right never change across the range?`,
  patternChallenge: {
    options: ['Loop and AND every number', 'Common binary prefix of left and right', 'Prefix sums', 'Binary trie'],
    answer: 1,
    explanation: 'A bit survives only if it is 1 in every number. Bits below the first position where left and right differ take both values within the range, so only the common prefix survives. Looping is O(right − left).',
  },
  hints: [
    'Shift left and right right by one until they are equal, counting the shifts.',
    'The answer is the equal value shifted back left by that count. (Or: while right > left, right &= right − 1.)',
  ],
  approach: `**Brute force:** AND every number: O(right − left), up to 2^31 steps.

**Common prefix:** write left and right in binary. Find the highest position where they differ: right has 1 there, left has 0. The range then contains the number "prefix, 0, 1111…" and "prefix, 1, 0000…" — together they zero that position and everything below. Everything above is a shared prefix and never changes. So: shift both right until equal (count k), return \`left << k\`.

**Kernighan version:** \`while (right > left) right &= right − 1\` — repeatedly remove right's lowest bit until it is ≤ left; what remains is the prefix.`,

  functionName: 'rangeBitwiseAnd',
  paramNames: ['left', 'right'],
  starterCode: `/**
 * @param {number} left
 * @param {number} right
 * @return {number}
 */
function rangeBitwiseAnd(left, right) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 5 & 6 & 7 keeps only the shared top bit.',
      args: [5, 7], expected: 4 },
    { scenario: 'Example 2', hint: 'A one-number range containing 0 — the AND of {0} is 0.',
      args: [0, 0], expected: 0 },
    { scenario: 'Example 3', hint: 'The whole positive range — some number in it is 0 in every bit, so the answer is 0.',
      args: [1, 2147483647], expected: 0 },
    { scenario: 'Single-number range', hint: 'When left === right the answer is that number itself; the loop of shifts must not run at all.',
      args: [3, 3], expected: 3 },
    { scenario: 'Range containing zero', hint: 'Any range that includes 0 ANDs to 0.',
      args: [0, 5], expected: 0 },
    { scenario: 'Crossing a power of two', hint: '7 = 0111 and 8 = 1000 share no prefix, so everything cancels to 0.',
      args: [7, 8], expected: 0 },
    { scenario: 'Shared high prefix', hint: '12..15 all start with 11; only the two low bits vary, so the answer is 1100.',
      args: [12, 15], expected: 12 },
    { scenario: 'Accumulator starting at zero', hint: 'If you start the AND accumulator at 0 instead of all-ones, every answer comes out 0 — here it should be 6.',
      args: [6, 7], expected: 6 },
    { scenario: 'Maximum value alone', hint: 'left = right = 2^31 − 1: a loop like `for (i = left; i <= right; i++)` must stop exactly at right, and the result keeps all 31 bits.',
      args: [2147483647, 2147483647], expected: 2147483647 },
    { scenario: 'Top two values', hint: '2^31 − 2 and 2^31 − 1 differ only in bit 0; the prefix keeps bit 30 — no overflow or sign issues should appear.',
      args: [2147483646, 2147483647], expected: 2147483646 },
    { scenario: 'Power of two to next minus one', hint: '8..15 share only the leading 1 bit (1000).',
      args: [8, 15], expected: 8 },
    { scenario: 'Straddling 2^30', hint: '2^30 − 1 and 2^30 have no common prefix, so the answer is 0.',
      args: [1073741823, 1073741824], expected: 0 },
    { scenario: 'Large range near the top', hint: 'Only the lowest bits differ between these big numbers — strip them and shift the shared prefix back.',
      args: [2147483000, 2147483647], expected: 2147482624 },
    { scenario: 'Huge range, nonzero answer (2^30 numbers)', hint: 'Looping over 2^30 numbers is far too slow and never hits 0 early here. Shift both ends right until they match — O(31).',
      argsGen: '() => [1073741824, 2147483647]', expected: 1073741824, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function rangeBitwiseAnd(left, right) {
  let shift = 0;
  while (left !== right) {   // strip the differing low bits
    left >>= 1;
    right >>= 1;
    shift++;
  }
  return left << shift;       // common prefix followed by zeros
}`,
    explanation: 'Inputs are below 2^31, so >> and << stay non-negative (left << shift never exceeds the original right).',
  },
  dryRun: {
    columns: ['left', 'right', 'shift'],
    rows: [
      ['101', '111', '0'],
      ['10', '11', '1'],
      ['1', '1', '2 → equal'],
      ['result', '1 << 2 = 100 = 4', ''],
    ],
  },
  complexity: { time: 'O(31)', space: 'O(1)', explanation: 'At most 31 shifts.' },
  alternative: {
    title: 'Kernighan on right',
    md: 'Drop right\'s lowest bit until right ≤ left.',
    code: `function rangeBitwiseAnd(left, right) {
  while (right > left) right &= right - 1;
  return right;
}`,
    complexity: 'O(31) time',
  },
  mistakes: [
    'Looping over the whole range (time limit).',
    'Starting the AND accumulator at 0 (AND with 0 is always 0) instead of all-ones.',
    'For ranges touching 2^31 in other languages, overflow when incrementing i past right.',
  ],
};
