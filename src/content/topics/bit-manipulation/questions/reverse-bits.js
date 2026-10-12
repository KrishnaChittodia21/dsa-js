export default {
  id: 'reverse-bits',
  title: 'Reverse Bits',
  difficulty: 'Easy',
  order: 5,
  pattern: 'bit-per-position',
  tags: ['bit manipulation', 'divide and conquer'],
  source: { platform: 'LeetCode', number: 190, url: 'https://leetcode.com/problems/reverse-bits/' },

  statement: `Treat \`n\` as an **unsigned 32-bit** integer (0 … 2^32 − 1). Reverse the order of its 32 bits — bit 0 becomes bit 31, bit 1 becomes bit 30, and so on — and return the result, also as an **unsigned** number.`,
  examples: [
    { input: 'n = 43261596', output: '964176192', explanation: '00000010100101000001111010011100 → 00111001011110000010100101000000.' },
    { input: 'n = 4294967293', output: '3221225471', explanation: '11111111111111111111111111111101 → 10111111111111111111111111111111.' },
  ],
  constraints: ['0 <= n <= 2^32 − 1', 'All 32 bits are reversed, including leading zeros'],

  think: `- Leading zeros matter here: 1 reverses to 2^31, not 1. How many iterations do you need?
- In JavaScript, \`1 << 31\` is negative. How do you return the unsigned value?
- Why is \`>>>\` safer than \`>>\` for reading the input bits?`,
  patternChallenge: {
    options: ['XOR cancellation', 'Bit-by-bit construction (shift out of n, shift into result)', 'Binary search', 'Bitmask as a set'],
    answer: 1,
    explanation: 'Each output bit is determined by exactly one input bit — a per-position transformation. Read the lowest bit of n 32 times while pushing it into the result from the right.',
  },
  hints: [
    'Loop exactly 32 times: res = (res << 1) | (n & 1); n >>>= 1.',
    'res may become negative (bit 31 set). Return res >>> 0.',
  ],
  approach: `**String approach:** \`n.toString(2).padStart(32, '0')\`, reverse, \`parseInt(…, 2)\`. Correct, but allocates.

**Bit by bit:** 32 iterations: take the lowest bit of n (\`n & 1\`), append it to the result (\`res = (res << 1) | bit\`), shift n right logically (\`n >>>= 1\`). Always 32 iterations so leading zeros become trailing zeros correctly. Finally \`res >>> 0\` turns the signed 32-bit value into the unsigned one the problem expects.

**Divide and conquer (optional):** swap halves, then 8-bit blocks, 4, 2, 1 with masks — 5 steps, no loop.`,

  functionName: 'reverseBits',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n - an unsigned 32-bit integer
 * @return {number} - unsigned 32-bit result
 */
function reverseBits(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement.',
      args: [43261596], expected: 964176192 },
    { scenario: 'Example 2', hint: 'An input ≥ 2^31 whose result is also ≥ 2^31 — return it unsigned.',
      args: [4294967293], expected: 3221225471 },
    { scenario: 'Zero', hint: 'All zeros reversed is still 0.',
      args: [0], expected: 0 },
    { scenario: 'One becomes 2^31', hint: 'Bit 0 moves to bit 31. Without `>>> 0` the result is −2147483648 instead of 2147483648.',
      args: [1], expected: 2147483648 },
    { scenario: '2^31 becomes one', hint: 'The sign bit moves to bit 0. `n >>= 1` would smear the sign bit and read extra 1s.',
      args: [2147483648], expected: 1 },
    { scenario: 'All ones', hint: '2^32 − 1 is its own reversal — and must stay positive.',
      args: [4294967295], expected: 4294967295 },
    { scenario: 'Leading zeros matter', hint: '6 = 110: stopping when n becomes 0 skips the 29 leading zeros. All 32 positions must be shifted.',
      args: [6], expected: 1610612736 },
    { scenario: 'Two becomes 2^30', hint: 'Bit 1 goes to bit 30.',
      args: [2], expected: 1073741824 },
    { scenario: 'Alternating bits', hint: '0xAAAAAAAA reverses to 0x55555555.',
      args: [2863311530], expected: 1431655765 },
    { scenario: 'Bit palindrome', hint: '0x80000001 reads the same both ways.',
      args: [2147483649], expected: 2147483649 },
    { scenario: 'Low byte to high byte', hint: '255 → 0xFF000000 — a result well above 2^31.',
      args: [255], expected: 4278190080 },
    { scenario: 'High half to low half', hint: '0xFFFF0000 → 0x0000FFFF.',
      args: [4294901760], expected: 65535 },
  ],

  solution: {
    code: `function reverseBits(n) {
  let res = 0;
  for (let i = 0; i < 32; i++) {
    res = (res << 1) | (n & 1);   // append n's lowest bit
    n >>>= 1;                     // logical shift (no sign smearing)
  }
  return res >>> 0;               // reinterpret as unsigned
}`,
  },
  dryRun: `4-bit illustration with n = 0b0110 (the real loop does 32 steps):

| i | n & 1 | res | n after >>> 1 |
|---|---|---|---|
| 0 | 0 | 0 | 011 |
| 1 | 1 | 01 | 01 |
| 2 | 1 | 011 | 0 |
| 3 | 0 | 0110 | 0 |

Result 0110 — a palindrome. With 32 bits, n = 1 ends with res = 1 followed by 31 zeros = −2147483648 as int32, and \`>>> 0\` returns 2147483648.`,
  complexity: { time: 'O(32) = O(1)', space: 'O(1)', explanation: 'Fixed 32 iterations.' },
  alternative: {
    title: 'Divide and conquer with masks',
    md: 'Swap 16-bit halves, then bytes, nibbles, pairs, bits.',
    code: `function reverseBits(n) {
  n = (n >>> 16) | (n << 16);
  n = ((n & 0xff00ff00) >>> 8) | ((n & 0x00ff00ff) << 8);
  n = ((n & 0xf0f0f0f0) >>> 4) | ((n & 0x0f0f0f0f) << 4);
  n = ((n & 0xcccccccc) >>> 2) | ((n & 0x33333333) << 2);
  n = ((n & 0xaaaaaaaa) >>> 1) | ((n & 0x55555555) << 1);
  return n >>> 0;
}`,
    complexity: 'O(1), 5 steps',
  },
  mistakes: [
    'Stopping when n becomes 0 — the remaining shifts (leading zeros) are skipped.',
    'Returning res without >>> 0, producing negative numbers.',
    'Using n >>= 1 on inputs ≥ 2^31 — reads copies of the sign bit.',
  ],
};
