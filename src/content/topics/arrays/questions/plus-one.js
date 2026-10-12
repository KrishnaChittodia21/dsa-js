export default {
  id: 'plus-one',
  title: 'Plus One',
  difficulty: 'Easy',
  order: 2,
  pattern: 'array-in-place-reversal',
  tags: ['array', 'math', 'carry'],
  source: { platform: 'LeetCode', number: 66, url: 'https://leetcode.com/problems/plus-one/' },

  statement: `A non-negative integer is stored as an array \`digits\`, most significant digit first (e.g. \`[4,3,2,1]\` is 4321). There are no leading zeros except for the number 0 itself.

Add **one** to the number and return the resulting array of digits.`,
  examples: [
    { input: 'digits = [1,2,3]', output: '[1,2,4]' },
    { input: 'digits = [9,9]', output: '[1,0,0]', explanation: '99 + 1 = 100 — the array grows by one digit.' },
  ],
  constraints: ['1 <= digits.length <= 100', '0 <= digits[i] <= 9', 'No leading zeros (except the number 0)'],

  think: `- Which digit changes first when you add 1 by hand?
- When does the carry stop moving left?
- When does the result need an extra digit?`,
  patternChallenge: {
    options: ['In-place Rewrite (carry from the right)', 'Sliding Window', 'Two Pointers from both ends', 'Hash Map lookup'],
    answer: 0,
    explanation: 'We edit the digits array in place, walking from the right because the carry flows right-to-left.',
  },
  hints: ['Walk from the last digit. If it is less than 9, increment it and you are done.', 'A 9 becomes 0 and the carry continues. If every digit was 9, put a 1 in front.'],
  approach: `**Why not convert to a number?** 100 digits exceed \`Number.MAX_SAFE_INTEGER\` (~9·10^15). \`BigInt\` would work, but the intended solution is digit arithmetic.

**Optimized:** from the right, if \`digits[i] < 9\`, increment and return — no carry remains. Otherwise set it to 0 and continue. If the loop finishes, all digits were 9: the answer is 1 followed by zeros (\`unshift(1)\`, the only O(n) front insert, and it happens once).`,

  functionName: 'plusOne',
  paramNames: ['digits'],
  starterCode: `/**
 * @param {number[]} digits
 * @return {number[]}
 */
function plusOne(digits) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: the last digit is below 9, so only it changes.', args: [[1, 2, 3]], expected: [1, 2, 4] },
    { scenario: 'Example 2', hint: 'Every digit is 9 — forgetting the all-9s case returns [0,0] instead of [1,0,0].', args: [[9, 9]], expected: [1, 0, 0] },
    { scenario: 'Four digits, no carry', hint: 'Only the last digit changes; continuing the loop after the carry is absorbed would corrupt earlier digits.', args: [[4, 3, 2, 1]], expected: [4, 3, 2, 2] },
    { scenario: 'Number zero', hint: 'The single digit 0 becomes 1.', args: [[0]], expected: [1] },
    { scenario: 'Single nine', hint: 'A single 9 becomes [1,0] — the array must grow by one.', args: [[9]], expected: [1, 0] },
    { scenario: 'Single digit, no carry', hint: 'Smallest non-trivial case: just increment the only digit.', args: [[5]], expected: [6] },
    { scenario: 'Carry stops at the front', hint: 'The carry ripples through the 9s and is absorbed by the first digit.', args: [[1, 9, 9]], expected: [2, 0, 0] },
    { scenario: 'Carry stops in the middle', hint: 'After absorbing the carry, stop — continuing would also bump the 2 in front.', args: [[2, 8, 9, 9]], expected: [2, 9, 0, 0] },
    { scenario: 'Nine not at the end', hint: 'A 9 that is not at the end must stay 9 — only trailing 9s turn into 0.', args: [[9, 0, 9, 8]], expected: [9, 0, 9, 9] },
    { scenario: 'Zeros inside the number', hint: 'Interior zeros are ordinary digits; only the last digit changes.', args: [[1, 0, 0, 0]], expected: [1, 0, 0, 1] },
    { scenario: 'Longer than safe integer', hint: 'Number(digits.join("")) loses precision beyond 15–16 digits; do digit arithmetic instead.', args: [[9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]], expected: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1] },
    { scenario: 'Long number ending in 9s', hint: 'Precision loss with Number() shows up here too: 20 digits with a carry.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 9, 0, 0, 0] },
    { scenario: 'Maximum length all 9s', hint: '100 nines become 1 followed by 100 zeros — the result has 101 digits.', argsGen: '() => [Array(100).fill(9)]', expected: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { scenario: 'Maximum length, no carry', hint: '100 digits where only the last one changes.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => (i === 0 ? 1 : (i * 7) % 9))]', expected: [1, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 0, 7, 5, 3, 1, 8, 6, 4, 2, 1] },
  ],

  solution: {
    code: `function plusOne(digits) {
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] < 9) {
      digits[i]++;        // absorbs the carry — nothing further changes
      return digits;
    }
    digits[i] = 0;        // 9 + 1 = 10 → write 0, carry 1 to the left
  }
  digits.unshift(1);      // every digit was 9: 99…9 + 1 = 100…0
  return digits;
}`,
  },
  dryRun: {
    columns: ['i', 'digit (digits = [1,9,9])', 'action', 'digits'],
    rows: [
      ['2', '9', 'set 0, carry', '[1,9,0]'],
      ['1', '9', 'set 0, carry', '[1,0,0]'],
      ['0', '1', '1 < 9 → 2, return', '[2,0,0]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1) extra (O(n) only when a new digit is prepended)', explanation: 'At most one pass; usually stops at the first non-9 from the right.' },
  alternative: {
    title: 'BigInt',
    md: 'Convert to BigInt, add 1n, convert back. Correct for any length, but O(n) conversions and it sidesteps the digit-arithmetic idea the question is testing.',
    code: `function plusOne(digits) {
  return String(BigInt(digits.join('')) + 1n).split('').map(Number);
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Converting with Number(digits.join("")) — loses precision beyond 15–16 digits', 'Forgetting the all-9s case', 'Continuing the loop after the carry has been absorbed'],
};
