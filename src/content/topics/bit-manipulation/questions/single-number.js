export default {
  id: 'single-number',
  title: 'Single Number',
  difficulty: 'Easy',
  order: 1,
  pattern: 'bit-xor-cancel',
  tags: ['array', 'bit manipulation'],
  source: { platform: 'LeetCode', number: 136, url: 'https://leetcode.com/problems/single-number/' },

  statement: `Every value in the non-empty array \`nums\` appears **exactly twice**, except for one value that appears only once. Return that value.

Your solution should run in linear time and use only **constant extra space**.`,
  examples: [
    { input: 'nums = [2,2,1]', output: '1' },
    { input: 'nums = [4,1,2,1,2]', output: '4' },
    { input: 'nums = [1]', output: '1' },
  ],
  constraints: ['1 <= nums.length <= 3 * 10^4', '-3 * 10^4 <= nums[i] <= 3 * 10^4', 'Exactly one element appears once; all others appear twice'],

  think: `- The easy answer uses a Map or Set. Which requirement rules it out?
- Is there an operation where combining a value with itself gives "nothing"?
- Does the order in which you combine the values matter for that operation?`,
  patternChallenge: {
    options: ['Hash map counting', 'Sorting then scanning pairs', 'XOR cancellation', 'Two pointers'],
    answer: 2,
    explanation: 'x ^ x = 0 and x ^ 0 = x, and XOR is order-independent — so XOR of the whole array leaves the unpaired value, in O(1) space. A hash map is O(n) space; sorting is O(n log n).',
  },
  hints: [
    'What is a ^ a? What is a ^ 0?',
    'Start from 0 and XOR every element into an accumulator.',
  ],
  approach: `**Brute force:** a Map of counts (O(n) space) or sort and compare neighbours (O(n log n)).

**XOR:** XOR is commutative and associative, so XOR-ing the whole array is the same as XOR-ing the pairs together first: each pair gives 0, and 0 ^ single = single. One pass, one variable. Negative numbers are fine — XOR works on the 32-bit two's-complement patterns.`,

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
    { scenario: 'Example 1', hint: 'The basic case: 2 appears twice, 1 once.',
      args: [[2, 2, 1]], expected: 1 },
    { scenario: 'Example 2', hint: 'The pairs are not adjacent. Also catches starting the accumulator at nums[0] AND XOR-ing nums[0] again.',
      args: [[4, 1, 2, 1, 2]], expected: 4 },
    { scenario: 'Example 3', hint: 'A single element is the answer.',
      args: [[1]], expected: 1 },
    { scenario: 'Negative single', hint: 'XOR works on negatives too.',
      args: [[-1, -1, -2]], expected: -2 },
    { scenario: 'Single is zero', hint: 'The answer can be 0 — do not use 0 as a "not found" marker.',
      args: [[0, 7, 7]], expected: 0 },
    { scenario: 'Value limits ±30000', hint: 'Both extremes of the allowed range.',
      args: [[30000, -30000, 30000]], expected: -30000 },
    { scenario: 'Single at the start', hint: 'If you seed the accumulator with nums[0] and then XOR every element (including nums[0]), the first value cancels itself.',
      args: [[9, 3, 3]], expected: 9 },
    { scenario: 'Single at the end', hint: 'Position must not matter.',
      args: [[3, 3, 9]], expected: 9 },
    { scenario: 'Single in the middle', hint: 'Pairs are scattered around it.',
      args: [[5, 3, 5, 4, 3]], expected: 4 },
    { scenario: 'Pair of zeros', hint: '0 appearing twice cancels like any other pair.',
      args: [[0, -5, 0]], expected: -5 },
    { scenario: 'Single −30000 among positives', hint: 'Sum tricks need a Set to work — XOR does not.',
      args: [[12, -30000, 12, 7, 7]], expected: -30000 },
    { scenario: 'Large input (n = 29999)', hint: 'Counting each value by rescanning the array is O(n²) ≈ 9·10^8 steps. XOR all values in one pass — O(n), O(1) space.',
      argsGen: '() => { const a = []; for (let v = 1; v <= 14999; v++) a.push(v * 2 - 15000, v * 2 - 15000); a.push(-30000); return [a]; }', expected: -30000, timeLimitMs: 500 },
  ],

  solution: {
    code: `function singleNumber(nums) {
  let x = 0;
  for (const v of nums) x ^= v;   // pairs cancel: v ^ v = 0
  return x;
}`,
  },
  dryRun: {
    columns: ['v', 'x (binary)', 'x'],
    rows: [
      ['start', '000', '0'],
      ['4', '100', '4'],
      ['1', '101', '5'],
      ['2', '111', '7'],
      ['1', '110', '6'],
      ['2', '100', '4 ← answer'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass and one accumulator.' },
  alternative: {
    title: 'Set toggle',
    md: 'Add a value the first time, remove it the second time; the Set ends with the answer. Clear, but O(n) space.',
    code: `function singleNumber(nums) {
  const s = new Set();
  for (const v of nums) s.has(v) ? s.delete(v) : s.add(v);
  return [...s][0];
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Starting the accumulator at nums[0] and also XOR-ing nums[0] (it cancels itself).',
    'Using + / − instead of ^ ("sum twice minus sum" needs a Set anyway).',
    'Assuming it works when values appear three times.',
  ],
};
