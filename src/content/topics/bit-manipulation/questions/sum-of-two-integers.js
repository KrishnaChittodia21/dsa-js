export default {
  id: 'sum-of-two-integers',
  title: 'Sum of Two Integers',
  difficulty: 'Medium',
  order: 1,
  pattern: 'bit-per-position',
  tags: ['math', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 371, url: 'https://leetcode.com/problems/sum-of-two-integers/' },

  statement: `Return the sum of two integers \`a\` and \`b\` **without using the operators \`+\` or \`-\`**. The inputs may be negative.`,
  examples: [
    { input: 'a = 1, b = 2', output: '3' },
    { input: 'a = 2, b = 3', output: '5' },
    { input: 'a = -5, b = -7', output: '-12' },
  ],
  constraints: ['-1000 <= a, b <= 1000'],

  think: `- Add two single bits: which operator gives the sum digit, and which gives the carry?
- Where does the carry go — same position or one to the left?
- Why does the loop stop for negative numbers in JavaScript but might not with unbounded integers?`,
  patternChallenge: {
    options: ['XOR cancellation', 'Bitmask as a set', 'Carry loop: XOR for the sum, AND << 1 for the carry', 'Gray code'],
    answer: 2,
    explanation: 'Binary addition per column: sum bit = a ^ b, carry = a & b moved one position left. Repeat until no carry remains.',
  },
  hints: [
    'a ^ b adds without carries; (a & b) << 1 is exactly the carries.',
    'Replace (a, b) with (a ^ b, (a & b) << 1) until b is 0.',
  ],
  approach: `**Idea:** schoolbook addition in base 2. For each column, 1 + 1 = 0 carry 1; 1 + 0 = 1; 0 + 0 = 0. That is exactly XOR for the digit and AND for the carry. Doing all 32 columns at once:

\`\`\`text
sum   = a ^ b          // add every column, ignore carries
carry = (a & b) << 1   // carries move one position left
\`\`\`

Now add \`sum\` and \`carry\` the same way, until there is no carry.

**Negatives:** two's complement means the same loop works for negative numbers. In JavaScript the values are 32-bit, so any carry out of bit 31 is discarded by \`<<\` and the loop ends after at most 32 rounds. (In Python you'd need an explicit 32-bit mask.)`,

  functionName: 'getSum',
  paramNames: ['a', 'b'],
  starterCode: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function getSum(a, b) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 1 + 2.',
      args: [1, 2], expected: 3 },
    { scenario: 'Example 2', hint: '2 + 3 needs one carry.',
      args: [2, 3], expected: 5 },
    { scenario: 'Example 3', hint: 'Two negatives — two\'s complement addition with 32-bit ops gives the signed result directly.',
      args: [-5, -7], expected: -12 },
    { scenario: 'Carry must shift left', hint: '1 + 1: the carry (a & b) must move one column left; without << 1 the loop never finishes or gives 0.',
      args: [1, 1], expected: 2 },
    { scenario: 'Both zero', hint: '0 + 0 — the carry loop must not run.',
      args: [0, 0], expected: 0 },
    { scenario: 'Zero plus negative', hint: 'b = −7 alone; XOR with 0 returns it unchanged.',
      args: [0, -7], expected: -7 },
    { scenario: 'Opposites cancel', hint: '−1 + 1: carries ripple through all 32 bits and fall off the top.',
      args: [-1, 1], expected: 0 },
    { scenario: 'Max and min cancel', hint: '1000 + (−1000) = 0.',
      args: [1000, -1000], expected: 0 },
    { scenario: 'Result −1', hint: 'Mixed signs with a negative result.',
      args: [-1000, 999], expected: -1 },
    { scenario: 'Negative plus positive', hint: '−2 + 5 = 3.',
      args: [-2, 5], expected: 3 },
    { scenario: 'Long carry chain', hint: '255 + 1: the carry ripples through eight columns.',
      args: [255, 1], expected: 256 },
    { scenario: 'Maximum sum', hint: '1000 + 1000 = 2000.',
      args: [1000, 1000], expected: 2000 },
    { scenario: 'Minimum sum', hint: '−1000 + (−1000) = −2000.',
      args: [-1000, -1000], expected: -2000 },
  ],

  solution: {
    code: `function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;   // carries, shifted into the next column
    a = a ^ b;                    // column sums without carries
    b = carry;
  }
  return a;
}`,
  },
  dryRun: {
    columns: ['a', 'b', 'a ^ b', '(a & b) << 1'],
    rows: [
      ['0011 (3)', '0101 (5)', '0110', '0010'],
      ['0110', '0010', '0100', '0100'],
      ['0100', '0100', '0000', '1000'],
      ['0000', '1000', '1000', '0000'],
      ['1000 (8)', '0', '—', 'done'],
    ],
  },
  complexity: { time: 'O(32) = O(1)', space: 'O(1)', explanation: 'Each round the lowest carry moves at least one position left; after 32 rounds it has left the 32-bit word.' },
  alternative: {
    title: 'Recursive form',
    md: 'getSum(a, b) = b === 0 ? a : getSum(a ^ b, (a & b) << 1). Same logic.',
    complexity: 'O(1) time, O(32) stack',
  },
  mistakes: [
    'Forgetting to shift the carry left.',
    'Using >>> or masks unnecessarily — plain 32-bit ops already give the signed result.',
    'Porting to a language with unbounded integers without masking to 32 bits (infinite loop on negatives).',
  ],
};
