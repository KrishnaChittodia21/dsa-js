export default {
  id: 'single-number-ii',
  title: 'Single Number II',
  difficulty: 'Medium',
  order: 4,
  pattern: 'bit-per-position',
  tags: ['array', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 137, url: 'https://leetcode.com/problems/single-number-ii/' },

  statement: `Every value in \`nums\` appears exactly **three times** except one, which appears exactly once. Return that value, using linear time and constant extra space.`,
  examples: [
    { input: 'nums = [2,2,3,2]', output: '3' },
    { input: 'nums = [0,1,0,1,0,1,99]', output: '99' },
  ],
  constraints: ['1 <= nums.length <= 3 * 10^4', '-2^31 <= nums[i] <= 2^31 − 1', 'Exactly one element appears once; others appear three times'],

  think: `- Why does plain XOR fail here?
- Look at a single bit position. How many numbers have it set, modulo 3?
- Can you keep a "count mod 3" for all 32 positions at once using two integers?`,
  patternChallenge: {
    options: ['XOR cancellation', 'Per-bit counting modulo 3', 'Binary search', 'Sorting'],
    answer: 1,
    explanation: 'Triples contribute a multiple of 3 to every bit column, so count % 3 per column reveals the single number\'s bits. XOR only cancels pairs.',
  },
  hints: [
    'For each b in 0..31, count numbers with bit b set; if count % 3 === 1, set bit b of the answer.',
    'O(n) with two masks: ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones.',
  ],
  approach: `**Brute force:** Map of counts — O(n) space.

**Per-bit counting:** for each of the 32 positions, count how many numbers have that bit; the single number has the bit iff \`count % 3 === 1\`. Build the answer with \`result |= 1 << b\`. In JS, setting bit 31 through \`|\` makes the result negative exactly when the single number is negative — no fix-up needed. O(32n).

**Two masks (state machine):** keep \`ones\` and \`twos\`: bit k of ones = "bit k seen 1 mod 3 times", of twos = "2 mod 3 times". For each x: \`ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones;\`. Each bit cycles 00 → 10 → 01 → 00. At the end \`ones\` is the answer. O(n), no inner loop.`,

  functionName: 'singleNumber',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function singleNumber(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 3 appears once, 2 three times.',
      args: [[2, 2, 3, 2]], expected: 3 },
    { scenario: 'Example 2', hint: 'The single value is larger than the repeated ones.',
      args: [[0, 1, 0, 1, 0, 1, 99]], expected: 99 },
    { scenario: 'Single element', hint: 'nums = [5] — no triples at all.',
      args: [[5]], expected: 5 },
    { scenario: 'Plain XOR fails', hint: 'XOR of everything gives 1 ^ 2 = 3 here; triples do not cancel with XOR.',
      args: [[1, 1, 1, 2]], expected: 2 },
    { scenario: 'Negative numbers', hint: 'Negatives use bit 31; per-bit counting must include all 32 bits.',
      args: [[-2, -2, 1, 1, -3, 1, -3, -3, -4, -2]], expected: -4 },
    { scenario: 'Single is −1 (all bits set)', hint: 'Every one of the 32 bits belongs to the answer.',
      args: [[5, 5, 5, -1]], expected: -1 },
    { scenario: 'Single is −2^31', hint: 'Only bit 31 set. Building the result with + 2 ** 31 gives 2147483648 instead of −2147483648.',
      args: [[2147483647, 2147483647, 2147483647, -2147483648]], expected: -2147483648 },
    { scenario: 'Single is 2^31 − 1', hint: 'The repeated value is −2^31; the answer has every bit except 31.',
      args: [[-2147483648, -2147483648, -2147483648, 2147483647]], expected: 2147483647 },
    { scenario: 'Single is zero', hint: 'The answer has no bits set at all.',
      args: [[7, 7, 7, 0]], expected: 0 },
    { scenario: 'Single at the start', hint: 'Position must not matter.',
      args: [[9, 4, 4, 4]], expected: 9 },
    { scenario: 'Interleaved triples', hint: 'Copies are scattered; the ones/twos update order must be ones first, then twos using the NEW ones.',
      args: [[30000, 500, 100, 30000, 100, 30000, 100]], expected: 500 },
    { scenario: 'Large input (n = 29998)', hint: 'Counting each value by rescanning the array is O(n²) ≈ 9·10^8 steps. One pass with two bitmask counters is O(n).',
      argsGen: '() => { const a = []; for (let v = 1; v <= 9999; v++) { const x = v * 214748 - 1073741824; a.push(x, x, x); } a.push(-2147483648); return [a]; }', expected: -2147483648, timeLimitMs: 500 },
  ],

  solution: {
    code: `function singleNumber(nums) {
  let ones = 0, twos = 0;            // per-bit counters mod 3
  for (const x of nums) {
    ones = (ones ^ x) & ~twos;       // bits seen 1 (mod 3) times
    twos = (twos ^ x) & ~ones;       // bits seen 2 (mod 3) times
  }
  return ones;
}`,
  },
  dryRun: {
    columns: ['x', 'ones', 'twos'],
    rows: [
      ['start', '00', '00'],
      ['2 (10)', '10', '00'],
      ['2 (10)', '00', '10'],
      ['3 (11)', '01', '00  (bit 1 seen 3× → cleared; bit 0 seen once)'],
      ['2 (10)', '11', '00  → answer ones = 3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Constant work per element.' },
  alternative: {
    title: 'Count each bit mod 3',
    md: 'Clearer, 32 passes over the array.',
    code: `function singleNumber(nums) {
  let result = 0;
  for (let b = 0; b < 32; b++) {
    let count = 0;
    for (const x of nums) count += (x >>> b) & 1;
    if (count % 3 === 1) result |= 1 << b;
  }
  return result;
}`,
    complexity: 'O(32n) time, O(1) space',
  },
  mistakes: [
    'Using plain XOR (leaves the XOR of all distinct values).',
    'Building the result with + and 2 ** b — bit 31 then gives 2^31 instead of the negative value.',
    'Updating twos with the OLD ones (order of the two lines matters).',
  ],
};
