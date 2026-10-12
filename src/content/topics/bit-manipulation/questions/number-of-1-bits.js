export default {
  id: 'number-of-1-bits',
  title: 'Number of 1 Bits',
  difficulty: 'Easy',
  order: 2,
  pattern: 'bit-lowest-set-bit',
  tags: ['bit manipulation'],
  source: { platform: 'LeetCode', number: 191, url: 'https://leetcode.com/problems/number-of-1-bits/' },

  statement: `Given a non-negative integer \`n\` that fits in **32 bits** (it may be as large as 2^32 − 1), return how many of its bits are \`1\` — its *Hamming weight* (popcount).`,
  examples: [
    { input: 'n = 11', output: '3', explanation: '11 = 1011.' },
    { input: 'n = 128', output: '1', explanation: '128 = 10000000.' },
    { input: 'n = 4294967293', output: '31', explanation: '11111111111111111111111111111101.' },
  ],
  constraints: ['0 <= n <= 2^32 − 1'],

  think: `- How do you read the lowest bit? How do you move to the next one?
- What goes wrong with \`n >> 1\` when n ≥ 2^31 in JavaScript?
- Can you loop once per **set** bit instead of once per position?`,
  patternChallenge: {
    options: ['Brian Kernighan: n & (n − 1)', 'XOR cancellation', 'Binary search', 'Bitmask as a set'],
    answer: 0,
    explanation: 'Each `n &= n − 1` removes exactly one set bit, so counting the iterations counts the 1s. XOR cancellation is about pairs; binary search is unrelated.',
  },
  hints: [
    'n & (n − 1) clears the lowest set bit.',
    'Repeat until n becomes 0, counting steps. Use `!== 0`, not `> 0`: after the first & in JS, a value ≥ 2^31 becomes a negative int32.',
  ],
  approach: `**Shift and test:** 32 times, add \`n & 1\` and do \`n >>>= 1\` (logical shift — \`>>\` would drag the sign bit in for n ≥ 2^31 and never reach 0). O(32).

**Kernighan:** \`while (n !== 0) { n &= n − 1; count++; }\` — one iteration per set bit. Works for inputs up to 2^32 − 1 because \`&\` converts n to the same 32-bit pattern (as a signed int), and each step still removes one bit.

**JS pitfall:** \`n.toString(2)\` would work for non-negative inputs too (count the "1" characters) but allocates a string.`,

  functionName: 'hammingWeight',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function hammingWeight(n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 1011 has three 1s.',
      args: [11], expected: 3 },
    { scenario: 'Example 2', hint: 'A single set bit.',
      args: [128], expected: 1 },
    { scenario: 'Example 3', hint: 'An input ≥ 2^31: treat it as 32 unsigned bits.',
      args: [4294967293], expected: 31 },
    { scenario: 'Zero', hint: 'No set bits — the loop must not run.',
      args: [0], expected: 0 },
    { scenario: 'One', hint: 'Only bit 0 is set.',
      args: [1], expected: 1 },
    { scenario: 'Largest signed int (2^31 − 1)', hint: 'Thirty-one set bits, sign bit clear.',
      args: [2147483647], expected: 31 },
    { scenario: 'Exactly 2^31 (sign bit only)', hint: 'With `n >>= 1` the sign bit is copied forever (infinite loop); with `while (n > 0)` the loop stops at once because n & … turns negative. Answer: 1.',
      args: [2147483648], expected: 1 },
    { scenario: 'All 32 bits set', hint: '2^32 − 1 — every bit counts. Signed shifts or `n > 0` checks get this wrong.',
      args: [4294967295], expected: 32 },
    { scenario: 'Alternating bits 0xAAAAAAAA', hint: 'Sixteen 1s including bit 31.',
      args: [2863311530], expected: 16 },
    { scenario: 'Top two bits only', hint: '0xC0000000: both high bits must be counted.',
      args: [3221225472], expected: 2 },
    { scenario: 'Sign bit plus bit 0', hint: '2^31 + 1: mixing % 2 and >> models breaks here.',
      args: [2147483649], expected: 2 },
    { scenario: 'Single high bit 2^30', hint: 'One set bit far from the bottom.',
      args: [1073741824], expected: 1 },
  ],

  solution: {
    code: `function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;        // drop the lowest set bit (n becomes a 32-bit int)
    count++;
  }
  return count;
}`,
    explanation: 'For n = 2^32 − 1, the first `&` yields −2 (as int32) — still the right 31 remaining bits.',
  },
  dryRun: {
    columns: ['n (binary)', 'n − 1', 'n & (n − 1)', 'count'],
    rows: [
      ['1011', '1010', '1010', '1'],
      ['1010', '1001', '1000', '2'],
      ['1000', '0111', '0000', '3'],
    ],
  },
  complexity: { time: 'O(number of set bits) ≤ 32', space: 'O(1)', explanation: 'Each iteration removes one 1-bit.' },
  alternative: {
    title: 'Shift and test with >>>',
    md: 'Check every position; `>>>` keeps it unsigned.',
    code: `function hammingWeight(n) {
  let count = 0;
  for (let i = 0; i < 32; i++) { count += n & 1; n >>>= 1; }
  return count;
}`,
    complexity: 'O(32) time, O(1) space',
  },
  mistakes: [
    'Using `n >>= 1` with inputs ≥ 2^31 — the sign bit is copied and the loop never ends.',
    'Writing `while (n > 0)` — after `&`, a big input is negative and the loop stops early.',
    'Using `n % 2` / division with `>>` mixed — pick one model (arithmetic or 32-bit).',
  ],
};
