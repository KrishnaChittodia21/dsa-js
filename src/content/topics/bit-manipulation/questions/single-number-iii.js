export default {
  id: 'single-number-iii',
  title: 'Single Number III',
  difficulty: 'Medium',
  order: 3,
  pattern: 'bit-xor-cancel',
  tags: ['array', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 260, url: 'https://leetcode.com/problems/single-number-iii/' },

  statement: `In \`nums\`, exactly **two** values appear once and every other value appears exactly twice. Return the two single values (in any order).

Use linear time and constant extra space.`,
  examples: [
    { input: 'nums = [1,2,1,3,2,5]', output: '[3,5]', explanation: '[5,3] is also accepted.' },
    { input: 'nums = [-1,0]', output: '[-1,0]' },
    { input: 'nums = [0,1]', output: '[1,0]' },
  ],
  constraints: ['2 <= nums.length <= 3 * 10^4', '-2^31 <= nums[i] <= 2^31 − 1', 'Exactly two elements appear once; the rest appear twice'],

  think: `- XOR of everything gives a ^ b. Why is that non-zero, and what does a 1-bit in it tell you?
- If you could split the array into two groups — a in one, b in the other, pairs never split — what would you do with each group?`,
  patternChallenge: {
    options: ['Hash map counting', 'XOR, then split by a differing bit', 'Sort and scan', 'Per-bit counting mod 3'],
    answer: 1,
    explanation: 'XOR cancels the pairs, leaving a ^ b. Any set bit of a ^ b separates a from b; XOR within each side isolates them. O(n) time, O(1) space — a map would be O(n) space.',
  },
  hints: [
    'x = XOR of all = a ^ b. Take d = x & −x (the lowest bit where a and b differ).',
    'XOR together all numbers with (v & d) !== 0 → one of the answers; the other is x ^ that.',
  ],
  approach: `**Brute force:** Map of counts → O(n) space.

**XOR split:**
1. \`x\` = XOR of all = \`a ^ b\` ≠ 0.
2. \`d = x & −x\` — a single bit where a and b differ.
3. Numbers with bit d set form one group, the rest the other. Equal numbers share bit d, so pairs stay together and cancel inside their group; a and b fall into different groups.
4. XOR of the first group is one answer; \`x ^\` it is the other.

**JS edge:** if \`x = −2147483648\` (only bit 31), \`-x\` is 2147483648 as a float, but \`&\` converts it back to the same int32 pattern, so d = x — still correct.`,

  functionName: 'singleNumber',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function singleNumber(nums) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 3 and 5 appear once (any order).',
      args: [[1, 2, 1, 3, 2, 5]], expected: [3, 5] },
    { scenario: 'Example 2', hint: 'Just the two singles, one negative.',
      args: [[-1, 0]], expected: [-1, 0] },
    { scenario: 'Example 3', hint: 'Two singles, one of them 0.',
      args: [[0, 1]], expected: [0, 1] },
    { scenario: 'Only two elements', hint: 'No pairs at all — the answer is the whole array.',
      args: [[4, 7]], expected: [4, 7] },
    { scenario: 'Precedence trap', hint: '`v & d === 0` parses as `v & (d === 0)` and puts everything in one group — use `(v & d) === 0`.',
      args: [[6, 6, 9, 12]], expected: [9, 12] },
    { scenario: 'Both negative', hint: 'Negatives have bit 31 set; the split bit is chosen from a ^ b, which still works.',
      args: [[-7, 2, -3, 2]], expected: [-7, -3] },
    { scenario: 'Extremes 2^31 − 1 and −2^31', hint: 'a ^ b = −1; the lowest differing bit is bit 0.',
      args: [[2147483647, -2147483648]], expected: [-2147483648, 2147483647] },
    { scenario: 'Split on the sign bit', hint: '−1 and 2^31 − 1 differ ONLY in bit 31, so d = x & −x = −2^31. A highest-bit loop that breaks on negatives fails here.',
      args: [[-1, 5, 2147483647, 5]], expected: [-1, 2147483647] },
    { scenario: 'Single −2^31 and 0', hint: 'One single is 0 and the other is only the sign bit.',
      args: [[-2147483648, 5, 5, 0]], expected: [-2147483648, 0] },
    { scenario: 'Singles at the end', hint: 'The two singles come after all pairs.',
      args: [[1, 1, 2, 2, 3, 3, 10, 12]], expected: [10, 12] },
    { scenario: 'Mixed signs with pairs', hint: 'Pairs of negatives cancel just like positives.',
      args: [[-7, 3, -7, 9, 9, 8]], expected: [3, 8] },
    { scenario: 'Large input (n = 30000)', hint: 'Counting each value with a nested loop is O(n²) ≈ 9·10^8 steps. XOR everything, split on one differing bit, XOR each group — O(n).',
      argsGen: '() => { const a = []; for (let v = 1; v <= 14999; v++) { const x = v * 143165 - 1073741824; a.push(x, x); } a.push(2147483647, -2147483648); return [a]; }', expected: [-2147483648, 2147483647], timeLimitMs: 500 },
  ],

  solution: {
    code: `function singleNumber(nums) {
  let x = 0;
  for (const v of nums) x ^= v;     // x = a ^ b
  const d = x & -x;                 // lowest bit where a and b differ
  let a = 0;
  for (const v of nums) {
    if (v & d) a ^= v;              // group with bit d set
  }
  return [a, x ^ a];
}`,
  },
  dryRun: {
    columns: ['step', 'value'],
    rows: [
      ['x = XOR all', '3 ^ 5 = 110 (6)'],
      ['d = x & −x', '010 (2)'],
      ['bit-1 group', '2, 3, 2 → 3'],
      ['other', '6 ^ 3 = 5'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Two passes, constant variables.' },
  alternative: {
    title: 'Set toggle',
    md: 'Add on first sight, remove on second; the Set ends with the two answers. O(n) space.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Using `v & d === 0` without parentheses (=== binds tighter).',
    'Picking the highest bit with a loop that breaks on negatives — the lowest bit via x & −x is simpler.',
    'Returning the answers in a fixed order when the checker is exact (here any order is accepted).',
  ],
};
